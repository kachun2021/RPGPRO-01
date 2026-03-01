import type { PetManager } from '../pets/PetManager';
import type { PetEncyclopedia } from '../pets/PetEncyclopedia';
import { PET_DEFS, PetSeries, SERIES_ICONS, SERIES_COLORS } from '../pets/PetData';

type TabId = 'active' | 'storage' | 'fusion' | 'encyclopedia';

export class PetPanel {
      private _el: HTMLDivElement;
      private _tabs: Map<TabId, HTMLDivElement> = new Map();
      private _content: HTMLDivElement;
      private _currentTab: TabId = 'active';
      private _petManager: PetManager;
      private _encyclopedia: PetEncyclopedia;
      private _onFusionTab?: () => void;

      constructor(petManager: PetManager, encyclopedia: PetEncyclopedia, onFusionTab?: () => void) {
            this._petManager = petManager;
            this._encyclopedia = encyclopedia;
            this._onFusionTab = onFusionTab;

            this._el = document.createElement('div');
            this._el.id = 'petPanel';
            this._el.className = 'panel';
            Object.assign(this._el.style, { width: '380px', minHeight: '400px' });

            // Header
            const header = document.createElement('div');
            header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px';
            header.innerHTML = `
      <span style="font-family:'Cinzel',serif;font-size:16px;color:#E8C96A">🐾 Pets</span>
      <span style="font-size:11px;color:rgba(200,195,185,0.5)" id="petCount">0/20</span>
    `;
            this._el.appendChild(header);

            // Tabs
            const tabRow = document.createElement('div');
            tabRow.className = 'tab-row';
            const tabDefs: Array<{ id: TabId; label: string }> = [
                  { id: 'active', label: '⚔ Active' },
                  { id: 'storage', label: '📦 Storage' },
                  { id: 'fusion', label: '🔮 Fuse' },
                  { id: 'encyclopedia', label: '📖 Dex' },
            ];

            for (const t of tabDefs) {
                  const btn = document.createElement('div');
                  btn.className = 'tab-btn';
                  btn.textContent = t.label;
                  btn.dataset.tab = t.id;
                  btn.addEventListener('click', () => this._switchTab(t.id));
                  tabRow.appendChild(btn);
                  this._tabs.set(t.id, btn);
            }
            this._el.appendChild(tabRow);

            // Content area
            this._content = document.createElement('div');
            this._content.style.cssText = 'margin-top:10px;max-height:300px;overflow-y:auto';
            this._el.appendChild(this._content);

            document.getElementById('ui-layer')?.appendChild(this._el);

            this._switchTab('active');
      }

      get element(): HTMLElement { return this._el; }

      private _switchTab(id: TabId): void {
            if (id === 'fusion' && this._onFusionTab) {
                  this._onFusionTab();
                  return;
            }

            this._currentTab = id;
            this._tabs.forEach((btn, tid) => {
                  btn.classList.toggle('active', tid === id);
            });
            this._renderContent();
      }

      private _renderContent(): void {
            this._content.innerHTML = '';

            switch (this._currentTab) {
                  case 'active': this._renderActive(); break;
                  case 'storage': this._renderStorage(); break;
                  case 'encyclopedia': this._renderEncyclopedia(); break;
            }

            // Update count
            const countEl = this._el.querySelector('#petCount');
            if (countEl) countEl.textContent = `${this._petManager.owned.length}/${this._petManager.MAX_OWNED}`;
      }

      private _renderActive(): void {
            if (this._petManager.active.length === 0) {
                  this._content.innerHTML = '<div style="text-align:center;color:rgba(200,195,185,0.4);padding:40px">No active pets</div>';
                  return;
            }
            for (const pet of this._petManager.active) {
                  this._content.appendChild(this._createPetCard(pet.def.id, pet.stats.level, pet.def.series, true));
            }
      }

      private _renderStorage(): void {
            const stored = this._petManager.owned.filter(p => !p.isActive);
            if (stored.length === 0) {
                  this._content.innerHTML = '<div style="text-align:center;color:rgba(200,195,185,0.4);padding:40px">No stored pets</div>';
                  return;
            }
            for (const pet of stored) {
                  this._content.appendChild(this._createPetCard(pet.def.id, pet.stats.level, pet.def.series, false));
            }
      }

      private _renderEncyclopedia(): void {
            // Series sub-tabs
            const seriesRow = document.createElement('div');
            seriesRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px';

            const allSeries = Object.values(PetSeries);
            for (const s of allSeries) {
                  const btn = document.createElement('div');
                  const color = SERIES_COLORS[s];
                  btn.style.cssText = `padding:4px 8px;border-radius:6px;font-size:10px;cursor:pointer;
        background:rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},0.1);
        border:1px solid rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},0.3);
        color:#ECE8E0`;
                  btn.textContent = s;
                  btn.addEventListener('click', () => this._renderSeriesPets(s));
                  seriesRow.appendChild(btn);
            }
            this._content.appendChild(seriesRow);

            // Default: show Plant
            this._renderSeriesPets(PetSeries.Plant);
      }

      private _renderSeriesPets(series: PetSeries): void {
            // Remove existing pet list
            const existing = this._content.querySelector('.enc-list');
            existing?.remove();

            const list = document.createElement('div');
            list.className = 'enc-list';
            list.style.cssText = 'display:flex;flex-direction:column;gap:4px';

            const seriesPets = PET_DEFS.filter(d => d.series === series);
            for (const def of seriesPets) {
                  const discovered = this._encyclopedia.isDiscovered(def.id);
                  const card = document.createElement('div');
                  card.className = 'pet-card';
                  card.style.opacity = discovered ? '1' : '0.4';
                  card.innerHTML = `
        <img class="pet-card-icon" src="assets/icons/${SERIES_ICONS[def.series]}" alt="${def.series}" style="${discovered ? '' : 'filter:grayscale(1)'}">
        <div style="flex:1">
          <div class="pet-card-name">${discovered ? def.name : '???'}</div>
          <div class="pet-card-level">${discovered ? `Base Lv.${def.baseLevel}` : '🔒 Undiscovered'}</div>
        </div>
        ${discovered ? `<span style="color:#E8C96A;font-size:10px">×${this._encyclopedia.getCount(def.id)}</span>` : ''}
      `;
                  if (discovered) {
                        card.style.borderColor = 'rgba(232,201,106,0.15)';
                  }
                  list.appendChild(card);
            }
            this._content.appendChild(list);
      }

      private _createPetCard(defId: string, level: number, series: PetSeries, active: boolean): HTMLElement {
            const def = PET_DEFS.find(d => d.id === defId);
            const card = document.createElement('div');
            card.className = 'pet-card';
            const color = SERIES_COLORS[series];
            card.innerHTML = `
      <img class="pet-card-icon" src="assets/icons/${SERIES_ICONS[series]}" alt="${series}">
      <div style="flex:1">
        <div class="pet-card-name">${def?.name || defId}</div>
        <div class="pet-card-level">Lv.${level} · ${series}</div>
      </div>
      <span style="font-size:10px;color:${active ? 'rgba(46,204,113,0.7)' : 'rgba(200,195,185,0.4)'}">${active ? '⚔ Active' : '📦'}</span>
    `;
            card.style.borderColor = `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},0.15)`;
            return card;
      }

      refresh(): void {
            this._renderContent();
      }

      dispose(): void {
            this._el.remove();
      }
}
