import type { ResonanceSystem } from '../systems/ResonanceSystem';
import type { Inventory } from '../systems/Inventory';
import { PetSeries } from '../pets/PetData';
import { SERIES_COLORS } from '../pets/PetData';

const SERIES_NAMES: Record<string, string> = {
      plant: '植物系', dragon: '龍系', beast: '獸系', insect: '蟲系',
      metal: '金屬系', mystery: '神秘系', demon: '惡魔系', bird: '飛鳥系',
};

/**
 * ResonancePanel — Select equipment + resonance potion → preview → confirm.
 * Applies resonance boost to a pet series.
 */
export class ResonancePanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _resonanceSystem: ResonanceSystem;
      private _inventory: Inventory;

      get element(): HTMLDivElement { return this._el; }

      constructor(resonanceSystem: ResonanceSystem, inventory: Inventory) {
            this._resonanceSystem = resonanceSystem;
            this._inventory = inventory;

            this._el = document.createElement('div');
            this._el.id = 'resonance-panel';
            this._el.className = 'sa-panel reso-root';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      private _buildShell(): void {
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '🔮 共鳴';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const body = document.createElement('div');
            body.className = 'reso-body';
            body.id = 'reso-body';
            this._el.appendChild(body);
      }

      private _render(): void {
            const body = this._el.querySelector('#reso-body') as HTMLDivElement;
            if (!body) return;
            body.innerHTML = '';

            // Show all 8 series with current resonance level
            const allSeries: PetSeries[] = [
                  PetSeries.Plant, PetSeries.Dragon, PetSeries.Beast, PetSeries.Insect,
                  PetSeries.Metal, PetSeries.Mystery, PetSeries.Demon, PetSeries.Bird,
            ];

            for (const series of allSeries) {
                  const effect = this._resonanceSystem.getBonus(series);
                  const level = effect?.level ?? 0;
                  const color = SERIES_COLORS[series];
                  const colorStr = `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;

                  const row = document.createElement('div');
                  row.className = 'reso-row';

                  // Progress dots
                  let dots = '';
                  for (let i = 1; i <= 5; i++) {
                        dots += `<span class="reso-dot${i <= level ? ' reso-dot-active' : ''}" style="${i <= level ? `background:${colorStr}` : ''}"></span>`;
                  }

                  row.innerHTML = `
                        <div class="reso-series" style="color:${colorStr}">${SERIES_NAMES[series] ?? series}</div>
                        <div class="reso-dots">${dots}</div>
                        <div class="reso-info">${level > 0 ? `ATK+${Math.round((effect?.atkBonus ?? 0) * 100)}% DEF+${Math.round((effect?.defBonus ?? 0) * 100)}%` : '未啟動'}</div>
                        <button class="reso-apply-btn${level >= 5 ? ' reso-maxed' : ''}">
                              ${level >= 5 ? 'MAX' : `Lv.${level + 1} 共鳴`}
                        </button>
                  `;

                  const btn = row.querySelector('.reso-apply-btn') as HTMLButtonElement;
                  if (level < 5) {
                        btn.addEventListener('click', () => {
                              const cost = (level + 1) * 200;
                              if (this._inventory.gold < cost) {
                                    console.log('[Resonance] Not enough gold');
                                    return;
                              }
                              (this._inventory as any)._gold -= cost;
                              this._resonanceSystem.applyResonance(series);
                              this._showResult(SERIES_NAMES[series] ?? series, level + 1);
                              this._render();
                        });
                  }

                  body.appendChild(row);
            }
      }

      private _showResult(seriesName: string, newLevel: number): void {
            const el = document.createElement('div');
            el.className = 'pickup-text';
            el.style.color = '#27AE60';
            el.textContent = `✨ ${seriesName} 共鳴升級至 Lv.${newLevel}！`;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 2000);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._render(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
