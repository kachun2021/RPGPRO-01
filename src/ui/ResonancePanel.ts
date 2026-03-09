import type { ResonanceSystem } from '../systems/ResonanceSystem';
import type { Inventory } from '../systems/Inventory';
import { PetSeries, SERIES_COLORS } from '../pets/PetData';

const SERIES_NAMES: Record<string, string> = {
      plant: '植物系',
      dragon: '龍族系',
      beast: '野獸系',
      insect: '昆蟲系',
      metal: '機械系',
      mystery: '神秘系',
      demon: '惡魔系',
      bird: '飛禽系',
};

/**
 * ResonancePanel - apply resonance boosts by pet series.
 */
export class ResonancePanel {
      readonly panelId = 'resonance';
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
            this._el.className = 'sa-panel reso-root ui-panel-atlas';
            this._el.hidden = true;

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get isVisible(): boolean { return this._visible; }

      private _buildShell(): void {
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '🔭 共鳴';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '✕';
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

            const allSeries: PetSeries[] = [
                  PetSeries.Plant,
                  PetSeries.Dragon,
                  PetSeries.Beast,
                  PetSeries.Insect,
                  PetSeries.Metal,
                  PetSeries.Mystery,
                  PetSeries.Demon,
                  PetSeries.Bird,
            ];

            for (const series of allSeries) {
                  const effect = this._resonanceSystem.getBonus(series);
                  const level = effect?.level ?? 0;
                  const color = SERIES_COLORS[series];
                  const colorStr = `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;

                  const row = document.createElement('div');
                  row.className = 'reso-row';
                  row.style.setProperty('--reso-series-color', colorStr);

                  let dots = '';
                  for (let i = 1; i <= 5; i++) {
                        dots += `<span class="reso-dot${i <= level ? ' reso-dot-active' : ''}"></span>`;
                  }

                  row.innerHTML = `
                        <div class="reso-series">${SERIES_NAMES[series] ?? series}</div>
                        <div class="reso-dots">${dots}</div>
                        <div class="reso-info">${level > 0 ? `ATK+${Math.round((effect?.atkBonus ?? 0) * 100)}% DEF+${Math.round((effect?.defBonus ?? 0) * 100)}%` : '尚未共鳴'}</div>
                        <button class="reso-apply-btn${level >= 5 ? ' reso-maxed' : ''}">
                              ${level >= 5 ? 'MAX' : `Lv.${level + 1} 共鳴`}
                        </button>
                  `;

                  const btn = row.querySelector('.reso-apply-btn') as HTMLButtonElement;
                  btn.disabled = level >= 5;
                  if (level < 5) {
                        btn.addEventListener('click', () => {
                              const goldCost = (level + 1) * 200;
                              const hasPotion = this._inventory.hasItem('reso_potion');
                              if (!this._inventory.spendGold(goldCost)) {
                                    this._showResult('金幣不足', 0);
                                    return;
                              }
                              if (hasPotion) this._inventory.removeItem('reso_potion', 1);
                              this._resonanceSystem.applyResonance(series);
                              this._showResult(`${SERIES_NAMES[series] ?? series} 共鳴升級`, level + 1);
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
            el.textContent = `✅ ${seriesName} Lv.${newLevel}`;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 2000);
      }

      toggle(): void {
            this._visible ? this.hide() : this.show();
      }

      show(): void {
            this._visible = true;
            this._el.hidden = false;
            this._render();
      }

      hide(): void {
            this._visible = false;
            this._el.hidden = true;
      }

      refresh(): void {
            if (this._visible) this._render();
      }

      dispose(): void {
            this._el.remove();
      }
}


