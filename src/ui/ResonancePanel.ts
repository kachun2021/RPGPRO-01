import type { ResonanceSystem } from '../systems/ResonanceSystem';
import type { Inventory } from '../systems/Inventory';
import { PetSeries, SERIES_COLORS } from '../pets/PetData';
import { createPanelHeader } from './layout/PanelHeader';
import { buildDebugSummary, collectVisibleButtonLabels } from './layout/PanelDebugState';

const SERIES_NAMES: Record<PetSeries, string> = {
      [PetSeries.Plant]: '植物系',
      [PetSeries.Dragon]: '龍族系',
      [PetSeries.Beast]: '野獸系',
      [PetSeries.Insect]: '昆蟲系',
      [PetSeries.Metal]: '機械系',
      [PetSeries.Mystery]: '神秘系',
      [PetSeries.Demon]: '惡魔系',
      [PetSeries.Bird]: '飛禽系',
};

const ALL_SERIES: PetSeries[] = [
      PetSeries.Plant,
      PetSeries.Dragon,
      PetSeries.Beast,
      PetSeries.Insect,
      PetSeries.Metal,
      PetSeries.Mystery,
      PetSeries.Demon,
      PetSeries.Bird,
];

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
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get isVisible(): boolean { return this._visible; }

      getDebugState() {
            const effects = this._resonanceSystem.getAllEffects();
            return {
                  activeTab: 'series',
                  visiblePrimaryActions: collectVisibleButtonLabels(this._el),
                  keyDataSummary: buildDebugSummary({
                        activeSeries: effects.length,
                        maxedCount: effects.filter((effect) => effect.level >= 5).length,
                        gold: this._inventory.gold,
                        potionCount: this._itemQty('reso_potion'),
                  }),
            };
      }

      private _render(): void {
            const activeEffects = this._resonanceSystem.getAllEffects();
            const maxedCount = activeEffects.filter((effect) => effect.level >= 5).length;

            this._el.innerHTML = '';
            const { root: title } = createPanelHeader({
                  icon: 'skill',
                  kicker: 'Resonance Matrix',
                  title: '系列共鳴',
                  subtitle: `已啟動 ${activeEffects.length} / ${ALL_SERIES.length} · 金幣 ${this._inventory.gold}`,
                  summaryText: `${maxedCount} 已滿 · 藥水 ${this._itemQty('reso_potion')}`,
                  summaryClassName: 'reso-header-pill',
                  closeLabel: '關閉系列共鳴',
                  onClose: () => this.hide(),
            });
            this._el.appendChild(title);

            const body = document.createElement('div');
            body.className = 'reso-body';

            const grid = document.createElement('div');
            grid.className = 'reso-grid';
            for (const series of ALL_SERIES) {
                  grid.appendChild(this._buildSeriesCard(series));
            }
            body.appendChild(grid);
            this._el.appendChild(body);
      }

      private _buildSeriesCard(series: PetSeries): HTMLElement {
            const effect = this._resonanceSystem.getBonus(series);
            const level = effect?.level ?? 0;
            const goldCost = (level + 1) * 200;
            const hasPotion = this._inventory.hasItem('reso_potion');
            const color = SERIES_COLORS[series];
            const colorStr = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;

            const card = document.createElement('section');
            card.className = `reso-card game-card${level >= 5 ? ' is-maxed' : ''}`;
            card.style.setProperty('--reso-series-color', colorStr);

            let dots = '';
            for (let i = 1; i <= 5; i++) {
                  dots += `<span class="reso-dot${i <= level ? ' reso-dot-active' : ''}"></span>`;
            }

            card.innerHTML = `
                  <div class="reso-card-head">
                        <div class="reso-card-series">
                              <span class="reso-series-mark"></span>
                              <span class="reso-series-name">${SERIES_NAMES[series]}</span>
                        </div>
                        <span class="reso-level-pill">Lv.${level}/5</span>
                  </div>
                  <div class="reso-dots">${dots}</div>
                  <div class="reso-info">${level > 0 ? `ATK +${Math.round((effect?.atkBonus ?? 0) * 100)}% · DEF +${Math.round((effect?.defBonus ?? 0) * 100)}%` : '尚未啟動共鳴'}</div>
                  <div class="reso-cost-row">
                        <span>${level >= 5 ? '已達最高階' : `升級消耗 ${goldCost} G${hasPotion ? ' + 藥水 x1' : ''}`}</span>
                        <span>${hasPotion ? '背包可加成' : '可直接升級'}</span>
                  </div>
            `;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `game-btn ${level >= 5 ? 'game-btn-secondary' : 'game-btn-primary'} reso-apply-btn${level >= 5 ? ' reso-maxed' : ''}`;
            btn.textContent = level >= 5 ? '已滿級' : `升至 Lv.${level + 1}`;
            btn.disabled = level >= 5;
            if (level < 5) {
                  btn.addEventListener('click', () => this._applyResonance(series, level, goldCost, hasPotion));
            }
            card.appendChild(btn);
            return card;
      }

      private _applyResonance(series: PetSeries, currentLevel: number, goldCost: number, hasPotion: boolean): void {
            if (!this._inventory.spendGold(goldCost)) {
                  this._showResult('金幣不足，無法提升共鳴。', 'error');
                  return;
            }
            if (!this._resonanceSystem.applyResonance(series)) {
                  this._inventory.addGold(goldCost);
                  this._showResult('共鳴已達上限。', 'error');
                  return;
            }
            if (hasPotion) this._inventory.removeItem('reso_potion', 1);
            this._showResult(`${SERIES_NAMES[series]}提升至 Lv.${currentLevel + 1}`, 'success');
            this._render();
      }

      private _itemQty(itemId: string): number {
            return this._inventory.items.find((item) => item.itemId === itemId)?.qty ?? 0;
      }

      private _showResult(message: string, tone: 'success' | 'error'): void {
            const el = document.createElement('div');
            el.className = `pickup-text reso-result-banner${tone === 'error' ? ' is-error' : ''}`;
            el.textContent = message;
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


