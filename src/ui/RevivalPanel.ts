import type { PetManager } from '../pets/PetManager';
import { SERIES_ICONS } from '../pets/PetData';

export class RevivalPanel {
      private _el: HTMLDivElement;
      private _pm: PetManager;
      private _onDone: (() => void) | null = null;

      constructor(pm: PetManager) {
            this._pm = pm;
            this._el = document.createElement('div');
            this._el.id = 'revivalPanel';
            this._el.className = 'sa-panel revival-root ui-panel-fullscreen';
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get element(): HTMLElement {
            return this._el;
      }

      open(onDone?: () => void): void {
            this._onDone = onDone || null;
            this._el.style.display = 'block';
            this._render();
      }

      close(): void {
            this._el.style.display = 'none';
      }

      private _render(): void {
            this._el.innerHTML = '';
            const dead = this._pm.owned.filter((p) => p.isDead);

            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span>💀 寵物復活</span>';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const body = document.createElement('div');
            body.className = 'revival-body';

            if (dead.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'revival-empty';
                  empty.textContent = '目前沒有死亡寵物';
                  body.appendChild(empty);
                  this._el.appendChild(body);
                  return;
            }

            const totalCost = dead.reduce((sum, p) => sum + p.revivalCost, 0);
            const costInfo = document.createElement('div');
            costInfo.className = 'sa-sec revival-cost';
            costInfo.innerHTML = `
                  <span class="revival-cost-label">復活全部寵物費用</span>
                  <span class="revival-cost-value">${totalCost} GP</span>
            `;
            body.appendChild(costInfo);

            const list = document.createElement('div');
            list.className = 'panel-body revival-list';

            for (const pet of dead) {
                  const row = document.createElement('div');
                  row.className = 'list-card revival-row';
                  row.innerHTML = `
                        <div class="revival-row-main">
                              <span class="revival-row-icon">${SERIES_ICONS[pet.def.series]}</span>
                              <div>
                                    <div class="revival-row-name">${pet.displayName}</div>
                                    <div class="revival-row-level">Lv.${pet.stats.level}</div>
                              </div>
                        </div>
                        <span class="revival-row-cost">${pet.revivalCost} GP</span>
                  `;

                  const btn = document.createElement('button');
                  btn.className = 'btn-gold revival-row-btn';
                  btn.textContent = '復活';
                  btn.addEventListener('click', () => {
                        pet.revive();
                        this._render();
                        this._onDone?.();
                  });
                  row.appendChild(btn);
                  list.appendChild(row);
            }

            body.appendChild(list);

            const allRow = document.createElement('div');
            allRow.className = 'revival-actions';

            const allBtn = document.createElement('button');
            allBtn.className = 'btn-gold revival-all-btn';
            allBtn.textContent = '全部復活';
            allBtn.addEventListener('click', () => {
                  for (const pet of dead) pet.revive();
                  this._render();
                  this._onDone?.();
            });

            const closeBtn2 = document.createElement('button');
            closeBtn2.className = 'revival-close-btn';
            closeBtn2.textContent = '取消';
            closeBtn2.addEventListener('click', () => this.close());

            allRow.appendChild(allBtn);
            allRow.appendChild(closeBtn2);
            body.appendChild(allRow);

            this._el.appendChild(body);
      }

      refresh(): void {
            if (this._el.style.display !== 'none') this._render();
      }

      dispose(): void {
            this._el.remove();
      }
}
