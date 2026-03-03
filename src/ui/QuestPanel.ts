import type { QuestManager, QuestDef, QuestType, QuestStatus } from '../systems/QuestManager';

type Tab = 'main' | 'side' | 'daily';
const TAB_LABELS: { id: Tab; label: string; icon: string }[] = [
      { id: 'main', label: '主線', icon: '📖' },
      { id: 'side', label: '支線', icon: '📋' },
      { id: 'daily', label: '每日', icon: '🔄' },
];

const STATUS_ICONS: Record<QuestStatus, string> = {
      locked: '🔒', available: '📌', active: '⚡', complete: '✅',
};

/**
 * QuestPanel — Center popup with 3 tabs (main/side/daily), progress bars, reward previews.
 */
export class QuestPanel {
      private _el: HTMLDivElement;
      private _body!: HTMLDivElement;
      private _visible = false;
      private _currentTab: Tab = 'main';
      private _questManager: QuestManager;

      get element(): HTMLDivElement { return this._el; }

      constructor(questManager: QuestManager) {
            this._questManager = questManager;

            this._el = document.createElement('div');
            this._el.id = 'quest-panel';
            this._el.className = 'sa-panel qp-root';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);

            questManager.onChange = () => { if (this._visible) this._renderList(); };
      }

      private _buildShell(): void {
            // Title
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            const prog = this._questManager.mainProgress;
            title.innerHTML = `📜 任務 <span class="qp-progress">${prog.current}/${prog.total}</span>`;
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Tabs
            const tabBar = document.createElement('div');
            tabBar.className = 'inv-tabs';
            for (const t of TAB_LABELS) {
                  const btn = document.createElement('button');
                  btn.className = 'inv-tab';
                  btn.dataset.tab = t.id;
                  btn.textContent = `${t.icon} ${t.label}`;
                  if (t.id === this._currentTab) btn.classList.add('inv-tab-active');
                  btn.addEventListener('click', () => {
                        this._currentTab = t.id;
                        tabBar.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('inv-tab-active'));
                        btn.classList.add('inv-tab-active');
                        this._renderList();
                  });
                  tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);

            // Body
            this._body = document.createElement('div');
            this._body.className = 'qp-body';
            this._el.appendChild(this._body);
      }

      private _renderList(): void {
            this._body.innerHTML = '';
            const quests = this._questManager.getByType(this._currentTab as QuestType);

            if (quests.length === 0) {
                  this._body.innerHTML = '<div class="qp-empty">暫無任務</div>';
                  return;
            }

            for (const quest of quests) {
                  const status = this._questManager.getStatus(quest);
                  const card = document.createElement('div');
                  card.className = `qp-card qp-${status}`;

                  // Progress
                  const obj = quest.objectives[0];
                  const pct = Math.min(100, Math.round((obj.current / obj.required) * 100));

                  card.innerHTML = `
                        <div class="qp-card-header">
                              <span class="qp-status-icon">${STATUS_ICONS[status]}</span>
                              <span class="qp-card-name">${quest.chapter ? `Ch.${quest.chapter} ` : ''}${quest.name}</span>
                        </div>
                        <div class="qp-card-desc">${quest.description}</div>
                        <div class="qp-progress-bar">
                              <div class="qp-progress-fill" style="width:${pct}%"></div>
                              <span class="qp-progress-text">${obj.current}/${obj.required}</span>
                        </div>
                        <div class="qp-rewards">
                              ${quest.rewards.exp ? `✨${quest.rewards.exp}xp ` : ''}
                              ${quest.rewards.gold ? `💰${quest.rewards.gold} ` : ''}
                              ${quest.rewards.petId ? `🐾${quest.rewards.petId} ` : ''}
                              ${quest.rewards.unlockZone ? `🗺️解鎖地圖 ` : ''}
                        </div>
                        ${status === 'complete' ? '<button class="qp-claim-btn btn-gold">領取獎勵</button>' : ''}
                  `;

                  if (status === 'complete') {
                        card.querySelector('.qp-claim-btn')?.addEventListener('click', () => {
                              const reward = this._questManager.claimReward(quest.id);
                              if (reward) {
                                    console.log('[Quest] Claimed reward:', reward);
                                    this._showRewardText(quest.name, reward);
                              }
                              this._renderList();
                        });
                  }

                  this._body.appendChild(card);
            }
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
      show(): void { this._visible = true; this._el.style.display = 'block'; this._renderList(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
