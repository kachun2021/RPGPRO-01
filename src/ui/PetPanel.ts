import type { PetManager } from '../pets/PetManager';
import type { PetEncyclopedia } from '../pets/PetEncyclopedia';
import type { PetEquipment } from '../pets/PetEquipment';
import { PetEquipSlot } from '../pets/PetEquipment';
import type { PetBuff } from '../pets/PetBuff';
import type { Pet } from '../pets/Pet';
import { PET_DEFS, SERIES_ICONS, SERIES_COLORS, PetSeries } from '../pets/PetData';

const ITEMS_PER_PAGE = 14;

export class PetPanel {
      private _el: HTMLDivElement;
      private _petManager: PetManager;
      private _encyclopedia: PetEncyclopedia;
      private _equipment: PetEquipment;
      private _petBuff: PetBuff;
      private _selectedPet: Pet | null = null;
      private _storagePage = 0;

      constructor(petManager: PetManager, encyclopedia: PetEncyclopedia, equipment: PetEquipment, petBuff: PetBuff) {
            this._petManager = petManager;
            this._encyclopedia = encyclopedia;
            this._equipment = equipment;
            this._petBuff = petBuff;

            this._el = document.createElement('div');
            this._el.id = 'petPanel';
            this._el.className = 'sa-panel';
            Object.assign(this._el.style, {
                  position: 'fixed', right: '80px', top: '50%', transform: 'translateY(-50%)',
                  width: '360px', zIndex: '300', display: 'none',
            });

            document.getElementById('ui-layer')?.appendChild(this._el);
            if (this._petManager.active.length > 0) {
                  this._selectedPet = this._petManager.active[0];
            }
      }

      get element(): HTMLElement { return this._el; }

      open(): void {
            this._el.style.display = '';
            this._render();
      }

      close(): void {
            this._el.style.display = 'none';
      }

      toggle(): void {
            if (this._el.style.display === 'none') this.open();
            else this.close();
      }

      private _render(): void {
            const pet = this._selectedPet;
            this._el.innerHTML = '';

            // ── TITLE BAR ──
            const titleBar = document.createElement('div');
            titleBar.className = 'sa-panel-title';
            titleBar.innerHTML = `<span>怪物信息</span>`;

            // Close button
            const closeBtn = document.createElement('span');
            closeBtn.style.cssText = 'cursor:pointer;font-size:14px;color:#8B7355';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());
            titleBar.appendChild(closeBtn);

            // Active pet mini-portraits
            const minis = document.createElement('div');
            minis.style.cssText = 'display:flex;gap:3px;margin-left:auto;margin-right:8px';
            for (let i = 0; i < 3; i++) {
                  const p = this._petManager.active[i];
                  const mini = document.createElement('div');
                  mini.className = 'sa-mini-portrait';
                  if (p) {
                        const c = SERIES_COLORS[p.def.series];
                        mini.style.borderColor = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
                        mini.style.cursor = 'pointer';
                        mini.innerHTML = `<img src="assets/icons/${SERIES_ICONS[p.def.series]}" style="width:18px;height:18px" alt="">`;
                        mini.addEventListener('click', () => { this._selectedPet = p; this._render(); });
                  }
                  minis.appendChild(mini);
            }
            titleBar.appendChild(minis);
            this._el.appendChild(titleBar);

            if (!pet) {
                  this._el.innerHTML += '<div style="text-align:center;padding:40px;color:#8B7355">No pet selected</div>';
                  this._renderStorage();
                  return;
            }

            // ── PET INFO HEADER ──
            const info = document.createElement('div');
            info.className = 'sa-section';
            const seriesName = pet.def.series;
            info.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div>
          <div style="font-weight:700;color:#5C3D1A;font-size:13px">[${seriesName}] ${pet.def.name}</div>
          <div style="display:flex;gap:4px;margin-top:4px">
            <span class="sa-tag">种族</span>
            <span class="sa-tag sa-tag-active">${seriesName}</span>
          </div>
        </div>
        <div class="sa-pet-portrait-lg" style="border-color:rgb(${Math.round(SERIES_COLORS[pet.def.series].r * 255)},${Math.round(SERIES_COLORS[pet.def.series].g * 255)},${Math.round(SERIES_COLORS[pet.def.series].b * 255)})">
          <img src="assets/icons/${SERIES_ICONS[pet.def.series]}" style="width:36px;height:36px" alt="">
        </div>
      </div>
    `;
            this._el.appendChild(info);

            // ── LEVEL + HP/MP ──
            const stats1 = document.createElement('div');
            stats1.className = 'sa-section';
            const expPct = pet.stats.exp > 0 ? ((pet.stats.exp / (pet.stats.level * 100)) * 100).toFixed(1) : '0.0';
            stats1.innerHTML = `
      <div class="sa-stat-row"><span class="sa-stat-label">LV</span><span class="sa-stat-val">${pet.stats.level}</span>
        <span class="sa-stat-label" style="margin-left:12px">EXP</span><span class="sa-stat-val">${expPct}%</span></div>
      <div class="sa-stat-row"><span class="sa-stat-label">HP</span><span class="sa-stat-val">${pet.stats.hp}/${pet.stats.maxHp}</span>
        <span class="sa-stat-label" style="margin-left:12px">MP</span><span class="sa-stat-val">${pet.stats.mp}/${pet.stats.maxMp}</span></div>
    `;
            this._el.appendChild(stats1);

            // ── 8 DIMENSION STATS ──
            const stats2 = document.createElement('div');
            stats2.className = 'sa-section';
            stats2.innerHTML = `
      <div class="sa-stat-grid">
        <div class="sa-stat-row"><span class="sa-stat-label">力 量</span><span class="sa-stat-val">${pet.stats.str}</span>
          <span class="sa-stat-label">攻撃力</span><span class="sa-stat-val">${pet.stats.atkMin}~${pet.stats.atkMax}</span></div>
        <div class="sa-stat-row"><span class="sa-stat-label">敏 捷</span><span class="sa-stat-val">${pet.stats.agi}</span>
          <span class="sa-stat-label">命中率</span><span class="sa-stat-val">${pet.stats.hitRate}</span></div>
        <div class="sa-stat-row"><span class="sa-stat-label">準 確</span><span class="sa-stat-val">${pet.stats.acc}</span>
          <span class="sa-stat-label">回避率</span><span class="sa-stat-val">${pet.stats.dodgeRate}</span></div>
        <div class="sa-stat-row"><span class="sa-stat-label">幸 運</span><span class="sa-stat-val">${pet.stats.luk}</span>
          <span class="sa-stat-label">屬 性</span><span class="sa-stat-val">${pet.stats.element}</span></div>
      </div>
    `;
            this._el.appendChild(stats2);

            // ── 6 EQUIPMENT SLOTS ──
            const equipSection = document.createElement('div');
            equipSection.className = 'sa-section';
            equipSection.style.cssText = 'display:flex;gap:4px;justify-content:center';
            const slots = Object.values(PetEquipSlot);
            for (const slot of slots) {
                  const slotEl = document.createElement('div');
                  slotEl.className = 'sa-equip-slot';
                  const isUnlocked = this._equipment.isSlotUnlocked(pet.def.id, slot);
                  const equipped = this._equipment.getEquipped(pet.def.id, slot);
                  if (!isUnlocked) {
                        slotEl.innerHTML = '<span style="font-size:16px;font-weight:700;color:#8B7355">X</span>';
                        slotEl.title = `${slot} — Locked (Shop unlock)`;
                  } else if (equipped) {
                        slotEl.innerHTML = `<span style="font-size:9px;color:#5C3D1A">${equipped.name.substring(0, 4)}</span>`;
                        slotEl.style.borderColor = '#C4993D';
                  } else {
                        slotEl.innerHTML = '<span style="font-size:9px;color:#AAA">Empty</span>';
                  }
                  equipSection.appendChild(slotEl);
            }
            this._el.appendChild(equipSection);

            // ── PET STORAGE ──
            this._renderStorage();

            // ── 5 BUFF SLOTS ──
            this._renderBuffSlots(pet);
      }

      private _renderStorage(): void {
            const section = document.createElement('div');
            section.className = 'sa-section';

            // Tab pages
            const totalPages = Math.ceil(this._petManager.owned.length / ITEMS_PER_PAGE) || 1;
            const tabs = document.createElement('div');
            tabs.style.cssText = 'display:flex;gap:2px;margin-bottom:4px';
            for (let p = 0; p < Math.min(totalPages, 8); p++) {
                  const tab = document.createElement('span');
                  tab.className = `sa-tag ${p === this._storagePage ? 'sa-tag-active' : ''}`;
                  tab.textContent = `${p + 1}`;
                  tab.style.cursor = 'pointer';
                  tab.addEventListener('click', () => { this._storagePage = p; this._render(); });
                  tabs.appendChild(tab);
            }
            section.appendChild(tabs);

            // Grid: left 3 = deploy slots, right = storage
            const grid = document.createElement('div');
            grid.className = 'sa-pet-grid';

            // Deploy slots (3)
            for (let i = 0; i < 3; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'sa-pet-slot sa-pet-slot-deploy';
                  const pet = this._petManager.active[i];
                  if (pet) {
                        const c = SERIES_COLORS[pet.def.series];
                        slot.style.borderColor = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
                        slot.innerHTML = `<img src="assets/icons/${SERIES_ICONS[pet.def.series]}" style="width:28px;height:28px" alt="${pet.def.name}">`;
                        slot.title = `${pet.def.name} (Click to recall)`;
                        slot.addEventListener('click', () => {
                              const activeIdx = this._petManager.active.indexOf(pet);
                              if (activeIdx >= 0) this._petManager.recall(activeIdx);
                              this._render();
                        });
                  }
                  grid.appendChild(slot);
            }

            // Storage slots (paged)
            const start = this._storagePage * ITEMS_PER_PAGE;
            const inactive = this._petManager.owned.filter(p => !p.isActive);
            for (let i = 0; i < ITEMS_PER_PAGE; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'sa-pet-slot';
                  const pet = inactive[start + i];
                  if (pet) {
                        slot.innerHTML = `<img src="assets/icons/${SERIES_ICONS[pet.def.series]}" style="width:28px;height:28px" alt="${pet.def.name}">`;
                        slot.title = `${pet.def.name} Lv.${pet.stats.level} (Click: view / Dbl: deploy)`;
                        slot.addEventListener('click', () => { this._selectedPet = pet; this._render(); });
                        slot.addEventListener('dblclick', () => {
                              const ownedIdx = this._petManager.owned.indexOf(pet);
                              if (ownedIdx >= 0) this._petManager.deploy(ownedIdx);
                              this._render();
                        });
                  }
                  grid.appendChild(slot);
            }
            section.appendChild(grid);
            this._el.appendChild(section);
      }

      private _renderBuffSlots(pet: Pet): void {
            const section = document.createElement('div');
            section.className = 'sa-section';
            section.style.cssText = 'display:flex;gap:4px;justify-content:center';

            const slots = this._petBuff.getSlots(pet.def.id);
            for (let i = 0; i < 5; i++) {
                  const slotEl = document.createElement('div');
                  slotEl.className = 'sa-buff-slot';
                  const buff = slots[i];
                  if (buff) {
                        const mins = Math.ceil(buff.remainingMs / 60000);
                        slotEl.innerHTML = `<span style="font-size:8px;color:#5C3D1A">${buff.def.name.substring(0, 3)}</span>
          <span style="font-size:7px;color:#8B7355">${mins}m</span>`;
                        slotEl.title = `${buff.def.description} — ${mins}min left`;
                  }
                  section.appendChild(slotEl);
            }
            this._el.appendChild(section);
      }

      refresh(): void {
            if (this._el.style.display !== 'none') this._render();
      }

      dispose(): void { this._el.remove(); }
}
