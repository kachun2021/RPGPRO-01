import type { QuestManager, QuestDef, QuestType, QuestStatus } from '../systems/QuestManager';

type QTab = 'world' | 'general';
const TAB_LABELS: { id: QTab; label: string; icon: string; types: QuestType[] }[] = [
      { id: 'world', label: '世界任務', icon: '🔴', types: ['main'] },
      { id: 'general', label: '一般任務', icon: '🟡', types: ['side', 'daily'] },
];

const STATUS_ICONS: Record<QuestStatus, string> = {
      locked: '🔒', available: '📌', active: '⚡', complete: '✅', claimed: '🏆',
};

/**
 * QuestPanel — CHM-style quest info panel with directory + detail view.
 * Tabs: 世界任務 / 一般任務
 * Left: quest directory list. Below: detailed quest info.
 */
export class QuestPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _currentTab: QTab = 'world';
      private _selectedQuestId: string | null = null;
      private _questManager: QuestManager;

      get element(): HTMLDivElement { return this._el; }

      constructor(questManager: QuestManager) {
            this._questManager = questManager;

            this._el = document.createElement('div');
            this._el.id = 'quest-panel';
            this._el.className = 'sa-panel qp-root';
            this._el.style.display = 'none';
            document.getElementById('ui-layer')?.appendChild(this._el);

            questManager.onChange = () => { if (this._visible) this._render(); };
      }

      private _render(): void {
            this._el.innerHTML = '';

            // Title bar
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            const prog = this._questManager.mainProgress;
            title.innerHTML = `📜 任務信息 <span class="qp-progress">${prog.current}/${prog.total}</span>`;
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
                  btn.className = 'qp-tab';
                  if (t.id === this._currentTab) btn.classList.add('qp-tab-active');
                  btn.innerHTML = `${t.icon} ${t.label}`;
                  btn.addEventListener('click', () => {
                        this._currentTab = t.id;
                        this._selectedQuestId = null;
                        this._render();
                  });
                  tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);

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
                  // Auto-select first if nothing selected
                  if (!this._selectedQuestId && quests.length > 0) {
                        this._selectedQuestId = quests[0].id;
                  }
            }
            this._el.appendChild(directory);

            // Quest detail view
            const selectedQuest = quests.find(q => q.id === this._selectedQuestId);
            const detail = document.createElement('div');
            detail.className = 'qp-detail';

            if (selectedQuest) {
                  const status = this._questManager.getStatus(selectedQuest);
                  const obj = selectedQuest.objectives[0];
                  const pct = Math.min(100, Math.round((obj.current / obj.required) * 100));

                  detail.innerHTML = `
                        <div class="qp-detail-name">${selectedQuest.name}</div>
                        <div class="qp-detail-desc">${selectedQuest.description}</div>
                        <div class="qp-detail-progress">
                              <div class="qp-detail-pbar">
                                    <div class="qp-detail-pfill" style="width:${pct}%"></div>
                              </div>
                              <span class="qp-detail-ptext">${obj.label}: ${obj.current}/${obj.required}</span>
                        </div>
                        ${selectedQuest.rewards.gold || selectedQuest.rewards.exp ? `
                              <div class="qp-detail-section">
                                    <span class="qp-detail-label">獎勵:</span>
                                    ${selectedQuest.rewards.gold ? `<span class="qp-detail-reward">💰 ${selectedQuest.rewards.gold}GP</span>` : ''}
                                    ${selectedQuest.rewards.exp ? `<span class="qp-detail-reward">✨ ${selectedQuest.rewards.exp}xp</span>` : ''}
                                    ${selectedQuest.rewards.petId ? `<span class="qp-detail-reward">🐾 寵物蛋</span>` : ''}
                                    ${selectedQuest.rewards.unlockZone ? `<span class="qp-detail-reward">🗺️ 解鎖地圖</span>` : ''}
                              </div>
                        ` : ''}
                        ${status === 'complete' ? '<button class="qp-claim-btn btn-gold">🎁 領取獎勵</button>' : ''}
                  `;

                  if (status === 'complete') {
                        detail.querySelector('.qp-claim-btn')?.addEventListener('click', () => {
                              const reward = this._questManager.claimReward(selectedQuest.id);
                              if (reward) {
                                    console.log('[Quest] Claimed:', reward);
                                    this._showRewardText(selectedQuest.name, reward);
                              }
                              this._render();
                        });
                  }
            } else {
                  detail.innerHTML = '<div class="qp-detail-empty">選擇一個任務查看詳情</div>';
            }
            this._el.appendChild(detail);
      }

      private _showRewardText(name: string, reward: any): void {
            const el = document.createElement('div');
            el.className = 'pickup-text';
            el.style.color = '#27AE60';
            el.textContent = `🎉 ${name} 完成！+${reward.exp ?? 0}xp +${reward.gold ?? 0}金`;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 2500);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._render(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
