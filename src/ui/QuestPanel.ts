import type { QuestManager, QuestDef, QuestType, QuestStatus, QuestReward } from '../systems/QuestManager';
import { Registry } from '../core/Registry';

type QTab = 'world' | 'general';
const TAB_LABELS: { id: QTab; label: string; icon: string; types: QuestType[] }[] = [
      { id: 'world', label: '世界任務', icon: '🔴', types: ['main'] },
      { id: 'general', label: '一般任務', icon: '🟡', types: ['side', 'daily'] },
];

const STATUS_ICONS: Record<QuestStatus, string> = {
      locked: '🔒', available: '📌', active: '⚡', turn_in: '📣', complete: '✅', claimed: '🏆',
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
            this._el.className = 'sa-panel qp-root ui-panel-fullscreen';
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
            title.innerHTML = `<span class="qp-title-icon">📜</span> 任務信息 <span class="qp-progress">${prog.current}/${prog.total}</span>`;
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
                  const btn = document.createElement('button');
                  btn.className = 'qp-tab rpg-chip rpg-chip-tab';
                  if (t.id === this._currentTab) btn.classList.add('qp-tab-active', 'is-active');
                  btn.innerHTML = `<span class="qp-tab-icon">${t.icon}</span><span class="qp-tab-label">${t.label}</span>`;
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
                        const item = document.createElement('div');
                        item.className = 'qp-dir-item';
                        if (q.id === this._selectedQuestId) item.classList.add('qp-dir-selected');
                        if (status === 'locked') item.classList.add('qp-dir-locked');
                        item.innerHTML = `<span class="qp-dir-icon">${STATUS_ICONS[status]}</span> ${q.chapter ? `Ch.${q.chapter} ` : ''}${q.name}`;
                        item.addEventListener('click', () => {
                              this._selectedQuestId = q.id;
                              this._render();
                        });
                        directory.appendChild(item);
                  }
                  if (!this._selectedQuestId && quests.length > 0) {
                        const preferred = quests.find((q) => ['active', 'complete'].includes(this._questManager.getStatus(q))) ?? quests[0];
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
                  const rewardHtml = selectedQuest.rewards.gold || selectedQuest.rewards.exp
                        ? `
                              <div class="qp-detail-section">
                                    <span class="qp-detail-label">獎勵:</span>
                                    ${selectedQuest.rewards.gold ? `<span class="qp-detail-reward">💰 ${selectedQuest.rewards.gold}GP</span>` : ''}
                                    ${selectedQuest.rewards.exp ? `<span class="qp-detail-reward">✨ ${selectedQuest.rewards.exp}xp</span>` : ''}
                                    ${selectedQuest.rewards.petId ? `<span class="qp-detail-reward">🐾 寵物蛋</span>` : ''}
                                    ${selectedQuest.rewards.unlockZone ? `<span class="qp-detail-reward">🗺️ 解鎖地圖</span>` : ''}
                              </div>
                        `
                        : '';
                  const acceptBtnHtml = status === 'available'
                        ? '<button class="qp-accept-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-secondary">✅ 接受任務</button>'
                        : '';
                  const claimBtnHtml = status === 'complete'
                        ? '<button class="qp-claim-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-primary">🎁 領取獎勵</button>'
                        : '';
                  const turnInNoticeHtml = status === 'turn_in'
                        ? '<div class="qp-detail-guidance">請回對應 NPC 回報，獎勵與世界解鎖會在對話完成後發放。</div>'
                        : '';

                  detail.innerHTML = `
                        <div class="qp-detail-head">
                              <div class="qp-detail-name">${selectedQuest.name}</div>
                              <div class="qp-detail-guidance">${guidance}</div>
                              <div class="qp-detail-progress">
                                    <div class="qp-detail-pbar">
                                          <div class="qp-detail-pfill"></div>
                                    </div>
                                    <span class="qp-detail-ptext">${obj.label}: ${obj.current}/${obj.required}</span>
                              </div>
                        </div>
                        <div class="qp-detail-content">
                              <div class="qp-detail-desc">${selectedQuest.description}</div>
                              ${rewardHtml}
                              ${turnInNoticeHtml}
                              ${acceptBtnHtml}
                              ${claimBtnHtml}
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
                  detail.innerHTML = '<div class="qp-detail-content"><div class="qp-detail-empty">選擇一個任務查看詳情</div></div>';
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

            summary.innerHTML = `
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
            el.textContent = `🎉 ${name} 完成！+${reward.exp ?? 0}xp +${reward.gold ?? 0}金`;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 2500);
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
