import { PetEncyclopedia } from '../pets/PetEncyclopedia';
import { PET_DEFS, PetSeries, SERIES_ICONS, SERIES_COLORS } from '../pets/PetData';

const SERIES_NAMES: Record<PetSeries, string> = {
      [PetSeries.Plant]: '植物', [PetSeries.Dragon]: '龍族',
      [PetSeries.Beast]: '獸類', [PetSeries.Insect]: '蟲族',
      [PetSeries.Metal]: '金屬', [PetSeries.Mystery]: '神秘',
      [PetSeries.Demon]: '惡魔', [PetSeries.Bird]: '飛鳥',
};

export class EncyclopediaPanel {
      private _el: HTMLDivElement;
      private _enc: PetEncyclopedia;
      private _activeSeries: PetSeries = PetSeries.Plant;

      constructor(enc: PetEncyclopedia) {
            this._enc = enc;
            this._el = document.createElement('div');
            this._el.id = 'encyclopediaPanel';
            this._el.className = 'sa-panel';
            Object.assign(this._el.style, {
                  position: 'fixed', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)', width: '420px',
                  maxHeight: '75vh', zIndex: '350', display: 'none',
            });
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get element(): HTMLElement { return this._el; }
      open(): void { this._el.style.display = ''; this._render(); }
      close(): void { this._el.style.display = 'none'; }

      private _render(): void {
            const enc = this._enc;
            this._el.innerHTML = '';

            // Title
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = `<span>📖 寵物圖鑑</span>
                  <span style="margin-left:auto;font-size:11px;color:rgba(200,195,185,0.6)">
                        ${enc.discoveredCount} / ${enc.totalCount}
                  </span>`;
            const closeBtn = document.createElement('span');
            closeBtn.style.cssText = 'cursor:pointer;font-size:14px;margin-left:8px';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Progress bar
            const prog = document.createElement('div');
            prog.className = 'sa-sec';
            const pct = enc.totalCount > 0 ? (enc.discoveredCount / enc.totalCount * 100) : 0;
            prog.innerHTML = `
                  <div style="height:6px;background:rgba(20,16,30,0.6);border-radius:3px;overflow:hidden">
                        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#E8C96A,#C4993D);
                              border-radius:3px;transition:width 0.3s"></div>
                  </div>`;
            this._el.appendChild(prog);

            // Series tabs
            const tabRow = document.createElement('div');
            tabRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;padding:6px 8px';
            const seriesValues = Object.values(PetSeries);
            for (const s of seriesValues) {
                  const tab = document.createElement('span');
                  tab.className = (s === this._activeSeries) ? 'sa-tag-active' : 'sa-tag';
                  tab.style.cssText = 'padding:3px 8px;font-size:11px;cursor:pointer';
                  tab.textContent = `${SERIES_ICONS[s]} ${SERIES_NAMES[s]}`;
                  tab.addEventListener('click', () => {
                        this._activeSeries = s;
                        this._render();
                  });
                  tabRow.appendChild(tab);
            }
            this._el.appendChild(tabRow);

            // Pet grid
            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:8px;max-height:45vh;overflow-y:auto';
            grid.className = 'panel-body';

            const seriesPets = PET_DEFS.filter(d => d.series === this._activeSeries);
            for (const def of seriesPets) {
                  const discovered = enc.isDiscovered(def.id);
                  const count = enc.getCount(def.id);

                  const cell = document.createElement('div');
                  cell.className = 'dark-slot';
                  cell.style.cssText = `
                        width:100%;aspect-ratio:1;display:flex;flex-direction:column;
                        align-items:center;justify-content:center;gap:2px;
                        ${discovered ? 'border-color:rgba(232,201,106,0.4)' : 'opacity:0.4'}
                  `;

                  const icon = document.createElement('div');
                  icon.style.cssText = `font-size:22px;${discovered ? '' : 'filter:grayscale(1)'}`;
                  icon.textContent = discovered ? SERIES_ICONS[def.series] : '🔒';

                  const name = document.createElement('div');
                  name.style.cssText = `font-size:9px;text-align:center;
                        color:${discovered ? 'rgba(232,201,106,0.9)' : 'rgba(200,195,185,0.4)'};
                        font-family:'Inter',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%`;
                  name.textContent = discovered ? def.name : '???';

                  if (discovered) {
                        const cnt = document.createElement('div');
                        cnt.style.cssText = 'font-size:8px;color:rgba(200,195,185,0.5)';
                        cnt.textContent = `×${count}`;
                        cell.appendChild(icon);
                        cell.appendChild(name);
                        cell.appendChild(cnt);
                  } else {
                        cell.appendChild(icon);
                        cell.appendChild(name);
                  }

                  grid.appendChild(cell);
            }
            this._el.appendChild(grid);
      }

      refresh(): void { if (this._el.style.display !== 'none') this._render(); }
      dispose(): void { this._el.remove(); }
}
