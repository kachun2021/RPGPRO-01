import type { QuestManager, QuestDef, QuestType, QuestStatus, QuestReward } from '../systems/QuestManager';
import { Registry } from '../core/Registry';

type QTab = 'world' | 'general';
const TAB_LABELS: { id: QTab; label: string; types: QuestType[] }[] = [
      { id: 'world', label: '世界任務', types: ['main'] },
      { id: 'general', label: '一般任務', types: ['side', 'daily'] },
];

const STATUS_LABELS: Record<QuestStatus, string> = {
      locked: '未解鎖',
      available: '待接取',
      active: '進行中',
      turn_in: '待回報',
      complete: '可領取',
      claimed: '已完成',
};

/**
 * QuestPanel — CHM-style quest info panel with directory + detail view.
 */
export class QuestPanel {
      readonly panelId = 'quest';
      private _el: HTMLDivElement;
      private _visible = false;
      private _currentTab: QTab = 'world';
      private _selectedQuestId: string | null = null;
      private _questManager: QuestManager;
      private _disposeQuestListener: (() => void) | null = null;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._syncResponsiveMode();
      };

      get element(): HTMLDivElement { return this._el; }

      constructor(questManager: QuestManager) {
            this._questManager = questManager;
            this._el = document.createElement('div');
            this._el.id = 'quest-panel';
            this._el.className = 'sa-panel qp-root ui-panel-atlas';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);
            this._disposeQuestListener = questManager.subscribe(() => {
                  if (this._visible) this._render();
            });
            window.addEventListener('resize', this._onResize);
      }

      get isVisible(): boolean { return this._visible; }

      private _render(): void {
            this._syncResponsiveMode();
            this._el.innerHTML = '';

            // Title bar
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            const prog = this._questManager.mainProgress;
            title.innerHTML = `<span>任務誌</span><span class="qp-progress">主線 ${prog.current}/${prog.total}</span>`;
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Tab bar
            const tabBar = document.createElement('div');
            tabBar.className = 'qp-tab-bar';
            for (const t of TAB_LABELS) {
                  const tabQuestCount = t.types.reduce((total, type) => total + this._questManager.getByType(type).length, 0);
                  const btn = document.createElement('button');
                  btn.className = 'qp-tab rpg-chip rpg-chip-tab';
                  if (t.id === this._currentTab) btn.classList.add('qp-tab-active', 'is-active');
                  btn.innerHTML = `<span class="qp-tab-label">${t.label}</span><span class="qp-tab-count">${tabQuestCount}</span>`;
                  btn.addEventListener('click', () => {
                        this._currentTab = t.id;
                        this._selectedQuestId = null;
                        this._render();
                  });
                  tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);
            this._el.appendChild(this._buildOverviewStrip());

            // Get quests for current tab
            const tabDef = TAB_LABELS.find(t => t.id === this._currentTab)!;
            const quests: QuestDef[] = [];
            for (const type of tabDef.types) {
                  quests.push(...this._questManager.getByType(type));
            }

            // Quest directory
            const directory = document.createElement('div');
            directory.className = 'qp-directory';
            const dirTitle = document.createElement('div');
            dirTitle.className = 'qp-dir-title';
            dirTitle.textContent = '▎任務目錄';
            directory.appendChild(dirTitle);

            if (quests.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'qp-dir-empty';
                  empty.textContent = '暫無任務';
                  directory.appendChild(empty);
            } else {
                  for (const q of quests) {
                        const status = this._questManager.getStatus(q);
                        const objective = q.objectives[0];
                        const objectiveText = objective
                              ? `${objective.label} · ${objective.current}/${objective.required}`
                              : '目前沒有進度目標';
                        const item = document.createElement('div');
                        item.className = 'qp-dir-item';
                        if (q.id === this._selectedQuestId) item.classList.add('qp-dir-selected');
                        if (status === 'locked') item.classList.add('qp-dir-locked');
                        item.innerHTML = `
                              <div class="qp-dir-top">
                                    <span class="qp-dir-status is-${status}">${STATUS_LABELS[status]}</span>
                                    <span class="qp-dir-meta">${q.chapter ? `主線 ${q.chapter}` : this._typeLabel(q.type)}</span>
                              </div>
                              <div class="qp-dir-name">${this._escapeHtml(q.name)}</div>
                              <div class="qp-dir-objective">${this._escapeHtml(objectiveText)}</div>
                        `;
                        item.addEventListener('click', () => {
                              this._selectedQuestId = q.id;
                              this._render();
                        });
                        directory.appendChild(item);
                  }
                  if (!this._selectedQuestId && quests.length > 0) {
                        const preferred = quests.find((q) => this._questManager.getStatus(q) === 'turn_in')
                              ?? quests.find((q) => this._questManager.getStatus(q) === 'active')
                              ?? quests.find((q) => this._questManager.getStatus(q) === 'available')
                              ?? quests.find((q) => this._questManager.getStatus(q) === 'complete')
                              ?? quests[0];
                        this._selectedQuestId = preferred.id;
                  }
            }
            const body = document.createElement('div');
            body.className = 'qp-body';
            body.appendChild(directory);

            // Quest detail view
            const selectedQuest = quests.find(q => q.id === this._selectedQuestId);
            const detail = document.createElement('div');
            detail.className = 'qp-detail';

            if (selectedQuest) {
                  const status = this._questManager.getStatus(selectedQuest);
                  const obj = selectedQuest.objectives[0];
                  const pct = Math.min(100, Math.round((obj.current / obj.required) * 100));
                  const guidance = this._buildGuidanceText(selectedQuest, status);
                  const rewardHtml = this._buildRewardHtml(selectedQuest.rewards);
                  const acceptBtnHtml = status === 'available'
                        ? '<button class="qp-accept-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-secondary">接受任務</button>'
                        : '';
                  const claimBtnHtml = status === 'complete'
                        ? '<button class="qp-claim-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-primary">領取獎勵</button>'
                        : '';
                  const turnInNoticeHtml = status === 'turn_in'
                        ? '<div class="qp-detail-callout">請回對應 NPC 回報，獎勵與世界解鎖會在對話完成後發放。</div>'
                        : '';
                  const rewardSummary = this._buildRewardSummary(selectedQuest.rewards);
                  const actionCopy = this._buildActionCopy(status, rewardSummary);
                  const objectiveText = `${obj.label} · ${obj.current}/${obj.required}`;

                  detail.innerHTML = `
                        <div class="qp-detail-head">
                              <div class="qp-detail-head-main">
                                    <div class="qp-detail-status is-${status}">${STATUS_LABELS[status]}</div>
                                    <div class="qp-detail-name">${this._escapeHtml(selectedQuest.name)}</div>
                                    <div class="qp-detail-guidance">${this._escapeHtml(guidance)}</div>
                              </div>
                              <div class="qp-detail-focus-card atlas-card">
                                    <span class="qp-detail-focus-label">目前目標</span>
                                    <span class="qp-detail-focus-value">${this._escapeHtml(obj.label)}</span>
                                    <span class="qp-detail-focus-meta">${obj.current}/${obj.required}</span>
                              </div>
                              <div class="qp-detail-progress">
                                    <div class="qp-detail-pbar">
                                          <div class="qp-detail-pfill"></div>
                                    </div>
                                    <span class="qp-detail-ptext">${this._escapeHtml(objectiveText)}</span>
                              </div>
                        </div>
                        <div class="qp-detail-content">
                              <div class="qp-detail-copy atlas-card">
                                    <div class="qp-detail-section-title">任務摘要</div>
                                    <div class="qp-detail-desc">${this._escapeHtml(selectedQuest.description)}</div>
                              </div>
                              <div class="qp-detail-grid">
                                    <div class="qp-detail-section atlas-card">
                                          <div class="qp-detail-section-title">行動提示</div>
                                          <div class="qp-detail-body-copy">${this._escapeHtml(guidance)}</div>
                                    </div>
                                    <div class="qp-detail-section atlas-card">
                                          <div class="qp-detail-section-title">完成獎勵</div>
                                          <div class="qp-detail-reward-list">${rewardHtml || '<span class="qp-detail-reward qp-detail-reward-muted">以主線推進與後續節點為主</span>'}</div>
                                    </div>
                              </div>
                              ${turnInNoticeHtml}
                              <div class="qp-detail-action-rail atlas-card">
                                    <div class="qp-detail-action-copy">${this._escapeHtml(actionCopy)}</div>
                                    <div class="qp-detail-actions">
                                          ${acceptBtnHtml}
                                          ${claimBtnHtml}
                                    </div>
                              </div>
                        </div>
                  `;
                  const fill = detail.querySelector('.qp-detail-pfill') as HTMLDivElement | null;
                  if (fill) fill.style.width = `${pct}%`;

                  if (status === 'available') {
                        detail.querySelector('.qp-accept-btn')?.addEventListener('click', () => {
                              this._questManager.acceptQuest(selectedQuest.id);
                              this._render();
                        });
                  }

                  if (status === 'complete') {
                        detail.querySelector('.qp-claim-btn')?.addEventListener('click', () => {
                              this.claimQuest(selectedQuest.id);
                        });
                  }
            } else {
                  detail.innerHTML = `
                        <div class="qp-detail-content">
                              <div class="qp-detail-empty atlas-empty-state">
                                    <strong>先從左側挑一個任務</strong>
                                    <p>這裡會顯示目前步驟、獎勵與下一個世界推進節點。</p>
                              </div>
                        </div>
                  `;
            }
            body.appendChild(detail);
            this._el.appendChild(body);
      }

      private _buildOverviewStrip(): HTMLDivElement {
            const summary = document.createElement('div');
            summary.className = 'qp-overview-strip';
            const quests = this._questManager.allQuests;
            const active = quests.filter((quest) => this._questManager.getStatus(quest) === 'active').length;
            const complete = quests.filter((quest) => ['turn_in', 'complete'].includes(this._questManager.getStatus(quest))).length;
            const available = quests.filter((quest) => this._questManager.getStatus(quest) === 'available').length;
            const mainQuest = this._questManager.getByType('main').find((quest) => this._questManager.getStatus(quest) === 'turn_in')
                  ?? this._questManager.getByType('main').find((quest) => this._questManager.getStatus(quest) === 'active')
                  ?? this._questManager.getByType('main').find((quest) => this._questManager.getStatus(quest) === 'available')
                  ?? null;
            const mainQuestStatus = mainQuest ? this._questManager.getStatus(mainQuest) : null;
            const nextLoopLabel = mainQuest
                  ? `${mainQuest.name} · ${mainQuestStatus === 'turn_in' ? '回報' : mainQuestStatus === 'active' ? '推進中' : '待接取'}`
                  : '目前沒有主線節點';

            summary.innerHTML = `
                  <div class="qp-overview-card qp-overview-card-wide">
                        <span class="qp-overview-label">下一步</span>
                        <span class="qp-overview-value">${nextLoopLabel}</span>
                  </div>
                  <div class="qp-overview-card">
                        <span class="qp-overview-label">進行中</span>
                        <span class="qp-overview-value">${active}</span>
                  </div>
                  <div class="qp-overview-card">
                        <span class="qp-overview-label">可回報</span>
                        <span class="qp-overview-value">${complete}</span>
                  </div>
                  <div class="qp-overview-card">
                        <span class="qp-overview-label">待接取</span>
                        <span class="qp-overview-value">${available}</span>
                  </div>
            `;

            return summary;
      }

      private _buildGuidanceText(quest: QuestDef, status: QuestStatus): string {
            if (status === 'available') {
                  return quest.npcId ? '先找對應 NPC 接取，任務才會開始累積。' : '先接受任務，之後才會開始追蹤進度。';
            }
            if (status === 'turn_in') {
                  return quest.npcId ? '條件已達成，回到對應 NPC 回報後才會發獎勵與推進世界。' : '條件已達成，準備回報。';
            }
            if (status === 'complete') {
                  return '條件已達成，現在回報並領取獎勵。';
            }
            if (status === 'claimed') {
                  return '這個任務已完成，建議切到下一個主線節點。';
            }
            if (quest.rewards.unlockZone) {
                  return `完成後會推進世界進度，解鎖 ${quest.rewards.unlockZone}。`;
            }
            return '先照著目前目標推進，再回來查看獎勵與後續解鎖。';
      }

      private _buildRewardHtml(reward: QuestReward): string {
            const tokens: string[] = [];
            if (reward.gold) tokens.push(`<span class="qp-detail-reward">+${reward.gold} GP</span>`);
            if (reward.exp) tokens.push(`<span class="qp-detail-reward">+${reward.exp} EXP</span>`);
            if (reward.petId) tokens.push('<span class="qp-detail-reward">寵物蛋</span>');
            if (reward.unlockZone) tokens.push(`<span class="qp-detail-reward">解鎖 ${this._escapeHtml(reward.unlockZone)}</span>`);
            return tokens.join('');
      }

      private _buildRewardSummary(reward: QuestReward): string {
            const parts: string[] = [];
            if (reward.gold) parts.push(`${reward.gold} GP`);
            if (reward.exp) parts.push(`${reward.exp} EXP`);
            if (reward.petId) parts.push('寵物蛋');
            if (reward.unlockZone) parts.push(`解鎖 ${reward.unlockZone}`);
            return parts.join(' / ');
      }

      private _buildActionCopy(status: QuestStatus, rewardSummary: string): string {
            if (status === 'available') return '確認接取後才會開始累積進度。';
            if (status === 'turn_in') return '條件已達成，回到 NPC 後會結算任務與世界推進。';
            if (status === 'complete') return rewardSummary ? `可立即領取：${rewardSummary}` : '可立即領取任務完成獎勵。';
            if (status === 'claimed') return '這個節點已完成，建議切到下一個可推進任務。';
            return rewardSummary ? `完成本步可取得：${rewardSummary}` : '依照上方提示推進即可。';
      }

      private _typeLabel(type: QuestType): string {
            if (type === 'main') return '主線';
            if (type === 'daily') return '日常';
            return '支線';
      }

      claimQuest(questId: string): { quest: QuestDef; reward: QuestReward } | null {
            const quest = this._questManager.getQuest(questId);
            if (!quest) return null;
            const status = this._questManager.getStatus(quest);
            if (status !== 'complete' && status !== 'turn_in') return null;

            const reward = this._questManager.claimReward(quest.id);
            if (!reward) return null;

            this._applyReward(reward, quest);
            this._showRewardText(quest.name, reward);
            if (this._visible) this._render();
            return { quest, reward };
      }

      private _isLandscapeFocusMode(): boolean {
            const w = window.innerWidth || 0;
            const h = window.innerHeight || 0;
            return w > h && h <= 1080;
      }

      private _syncResponsiveMode(): void {
            this._el.classList.toggle('is-focus-mode', this._isLandscapeFocusMode());
      }

      /** Actually apply reward effects to game systems */
      private _applyReward(reward: QuestReward, claimedQuest?: QuestDef): void {
            // Gold
            if (reward.gold && Registry.inventory?.addGold) {
                  Registry.inventory.addGold(reward.gold);
            }

            // EXP tracking + player level-up
            if (reward.exp) {
                  if (Registry.inventory) {
                        Registry.inventory.totalExpGained = (Registry.inventory.totalExpGained ?? 0) + reward.exp;
                  }
                  if (Registry.player?.addExp) {
                        Registry.player.addExp(reward.exp);
                  }
            }

            // Increment questChapter only when the claimed quest is a main chapter.
            if (Registry.player?.stats && claimedQuest?.type === 'main' && claimedQuest.chapter !== undefined) {
                  const stats = Registry.player.stats;
                  if (claimedQuest.chapter > (stats.questChapter ?? 0)) {
                        stats.questChapter = claimedQuest.chapter;
                        console.log(`[Quest] questChapter → ${stats.questChapter}`);
                  }
            }

            // Unlock zone (ZoneManager.unlockZone is directly on zoneManager)
            if (reward.unlockZone && Registry.zoneManager?.unlockZone) {
                  Registry.zoneManager.unlockZone(reward.unlockZone);
                  console.log(`[Quest] Unlocked zone: ${reward.unlockZone}`);
            }

            // Pet reward
            if (reward.petId && Registry.petManager?.addPet) {
                  const gender = Math.random() > 0.5 ? 'male' : 'female';
                  Registry.petManager.addPet(reward.petId, gender);
                  console.log(`[Quest] Rewarded pet: ${reward.petId}`);
            }
      }

      private _showRewardText(name: string, reward: QuestReward): void {
            const el = document.createElement('div');
            el.className = 'pickup-text quest-reward-text';
            el.textContent = `${name} 完成  +${reward.exp ?? 0} EXP  +${reward.gold ?? 0} GP`;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 2500);
      }

      private _escapeHtml(value: string): string {
            return String(value ?? '')
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(questId?: string): void {
            if (questId) this._selectedQuestId = questId;
            this._visible = true;
            this._syncResponsiveMode();
            this._el.hidden = false;
            this._render();
      }
      hide(): void { this._visible = false; this._el.hidden = true; }
      dispose(): void {
            this._disposeQuestListener?.();
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}

