import type { QuestManager } from '../systems/QuestManager';

/**
 * QuestTracker - mini HUD quest tracker (up to 2 entries).
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

            const header = document.createElement('div');
            header.className = 'qt-header';
            header.innerHTML = `
                  <span class="qt-header-text">📵 任務追蹤</span>
                  <span class="qt-toggle">▼</span>
            `;
            this._toggle = header.querySelector('.qt-toggle') as HTMLSpanElement;
            header.addEventListener('click', () => this._toggleCollapse());
            this._el.appendChild(header);

            this._body = document.createElement('div');
            this._body.className = 'qt-body';
            this._el.appendChild(this._body);

            document.getElementById('ui-layer')?.appendChild(this._el);

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
      }

      update(): void {
            this._body.innerHTML = '';

            const allQuests = [
                  ...this._questManager.getByType('main'),
                  ...this._questManager.getByType('side'),
                  ...this._questManager.getByType('daily'),
            ];

            const tracked = allQuests
                  .filter((q) => {
                        const s = this._questManager.getStatus(q);
                        return s === 'active' || s === 'complete';
                  })
                  .slice(0, 2);

            if (tracked.length === 0) {
                  this._body.innerHTML = '<div class="qt-empty">目前沒有進行中任務</div>';
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
                              <div class="qt-pfill"></div>
                        </div>
                  `;
                  const fill = card.querySelector('.qt-pfill') as HTMLDivElement | null;
                  if (fill) fill.style.width = `${pct}%`;
                  this._body.appendChild(card);
            }
      }

      dispose(): void {
            this._el.remove();
      }
}

