import type { QuestManager, QuestDef, QuestStatus } from '../systems/QuestManager';

/**
 * QuestTracker — Mini HUD widget showing up to 2 active quests.
 * Positioned top-left (right of minimap), collapsible/expandable.
 * Auto-updates when quest progress changes.
 */
export class QuestTracker {
      private _el: HTMLDivElement;
      private _body: HTMLDivElement;
      private _toggle: HTMLSpanElement;
      private _collapsed = false;
      private _questManager: QuestManager;

      constructor(questManager: QuestManager) {
            this._questManager = questManager;

            this._el = document.createElement('div');
            this._el.className = 'quest-tracker';

            // Header (clickable to collapse/expand)
            const header = document.createElement('div');
            header.className = 'qt-header';
            header.innerHTML = `
                  <span class="qt-header-text">📋 任務追蹤</span>
                  <span class="qt-toggle">▼</span>
            `;
            this._toggle = header.querySelector('.qt-toggle') as HTMLSpanElement;
            header.addEventListener('click', () => this._toggleCollapse());
            this._el.appendChild(header);

            // Body
            this._body = document.createElement('div');
            this._body.className = 'qt-body';
            this._el.appendChild(this._body);

            document.getElementById('ui-layer')?.appendChild(this._el);

            // Listen for quest changes
            const origOnChange = questManager.onChange;
            questManager.onChange = () => {
                  origOnChange?.();
                  this.update();
            };

            this.update();
      }

      private _toggleCollapse(): void {
            this._collapsed = !this._collapsed;
            this._body.classList.toggle('collapsed', this._collapsed);
            this._toggle.textContent = this._collapsed ? '▶' : '▼';
            this._toggle.style.transform = this._collapsed ? 'rotate(0deg)' : '';
      }

      update(): void {
            this._body.innerHTML = '';

            // Get active + complete quests (show max 2)
            const allQuests = [
                  ...this._questManager.getByType('main'),
                  ...this._questManager.getByType('side'),
                  ...this._questManager.getByType('daily'),
            ];

            const tracked = allQuests
                  .filter(q => {
                        const s = this._questManager.getStatus(q);
                        return s === 'active' || s === 'complete';
                  })
                  .slice(0, 2);

            if (tracked.length === 0) {
                  this._body.innerHTML = '<div class="qt-empty">暫無進行中任務</div>';
                  return;
            }

            for (const quest of tracked) {
                  const status = this._questManager.getStatus(quest);
                  const obj = quest.objectives[0];
                  const pct = Math.min(100, Math.round((obj.current / obj.required) * 100));

                  const card = document.createElement('div');
                  card.className = 'qt-quest';
                  card.innerHTML = `
                        <div class="qt-quest-name">${status === 'complete' ? '✅' : '⚡'} ${quest.name}</div>
                        <div class="qt-quest-obj">${obj.label}: ${obj.current}/${obj.required}</div>
                        <div class="qt-pbar">
                              <div class="qt-pfill" style="width:${pct}%"></div>
                        </div>
                  `;
                  this._body.appendChild(card);
            }
      }

      dispose(): void { this._el.remove(); }
}
