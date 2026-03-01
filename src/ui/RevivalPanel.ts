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
            this._el.className = 'sa-panel';
            Object.assign(this._el.style, {
                  position: 'fixed', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)', width: '320px',
                  maxHeight: '70vh', zIndex: '360', display: 'none',
            });
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get element(): HTMLElement { return this._el; }

      open(onDone?: () => void): void {
            this._onDone = onDone || null;
            this._el.style.display = '';
            this._render();
      }

      close(): void {
            this._el.style.display = 'none';
      }

      private _render(): void {
            this._el.innerHTML = '';
            const dead = this._pm.owned.filter(p => p.isDead);

            // Title
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span>💀 寵物復活</span>';
            const closeBtn = document.createElement('span');
            closeBtn.style.cssText = 'cursor:pointer;font-size:14px;margin-left:auto';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const body = document.createElement('div');
            body.style.cssText = 'padding:10px 12px;display:flex;flex-direction:column;gap:8px';

            if (dead.length === 0) {
                  const empty = document.createElement('div');
                  empty.style.cssText = 'text-align:center;padding:20px;color:rgba(200,195,185,0.5);font-size:13px';
                  empty.textContent = '目前沒有死亡的寵物 🎉';
                  body.appendChild(empty);
            } else {
                  // Total cost
                  const totalCost = dead.reduce((sum, p) => sum + p.revivalCost, 0);
                  const costInfo = document.createElement('div');
                  costInfo.className = 'sa-sec';
                  costInfo.style.cssText = 'display:flex;justify-content:space-between;padding:6px 8px;font-size:12px';
                  costInfo.innerHTML = `
                        <span style="color:rgba(200,195,185,0.6)">復活所有寵物的費用</span>
                        <span style="color:rgba(232,201,106,0.9);font-weight:700">${totalCost} GP</span>
                  `;
                  body.appendChild(costInfo);

                  // Dead pet list
                  const list = document.createElement('div');
                  list.style.cssText = 'max-height:35vh;overflow-y:auto;display:flex;flex-direction:column;gap:4px';
                  list.className = 'panel-body';

                  for (const pet of dead) {
                        const row = document.createElement('div');
                        row.className = 'list-card';
                        row.style.cssText += ';justify-content:space-between';
                        row.innerHTML = `
                              <div style="display:flex;align-items:center;gap:8px">
                                    <span style="font-size:18px">${SERIES_ICONS[pet.def.series]}</span>
                                    <div>
                                          <div style="font-size:12px;color:rgba(220,215,200,0.8);font-weight:600">${pet.displayName}</div>
                                          <div style="font-size:10px;color:rgba(200,195,185,0.5)">Lv.${pet.stats.level}</div>
                                    </div>
                              </div>
                              <span style="font-size:11px;color:rgba(232,201,106,0.7)">${pet.revivalCost} GP</span>
                        `;
                        // Individual revive btn
                        const btn = document.createElement('button');
                        btn.className = 'btn-gold';
                        btn.style.cssText = 'padding:3px 10px;font-size:10px;margin-left:6px';
                        btn.textContent = '復活';
                        btn.addEventListener('click', () => {
                              pet.revive();
                              console.log(`[Revival] Revived ${pet.displayName}`);
                              this._render();
                              this._onDone?.();
                        });
                        row.appendChild(btn);
                        list.appendChild(row);
                  }
                  body.appendChild(list);

                  // Revive all button
                  const allRow = document.createElement('div');
                  allRow.style.cssText = 'display:flex;gap:8px;justify-content:center;padding-top:6px';

                  const allBtn = document.createElement('button');
                  allBtn.className = 'btn-gold';
                  allBtn.style.cssText = 'padding:8px 24px;font-size:13px';
                  allBtn.textContent = '全體復活';
                  allBtn.addEventListener('click', () => {
                        for (const pet of dead) pet.revive();
                        console.log(`[Revival] Revived all ${dead.length} pets`);
                        this._render();
                        this._onDone?.();
                  });

                  const closeBtn2 = document.createElement('button');
                  closeBtn2.style.cssText = `
                        padding:8px 24px;font-size:13px;border-radius:6px;cursor:pointer;
                        background:rgba(160,130,80,0.12);border:1px solid rgba(160,130,80,0.25);
                        color:rgba(200,195,185,0.7);font-weight:600;font-family:'Inter',sans-serif;
                  `;
                  closeBtn2.textContent = '取 消';
                  closeBtn2.addEventListener('click', () => this.close());

                  allRow.appendChild(allBtn);
                  allRow.appendChild(closeBtn2);
                  body.appendChild(allRow);
            }

            this._el.appendChild(body);
      }

      refresh(): void { if (this._el.style.display !== 'none') this._render(); }
      dispose(): void { this._el.remove(); }
}
