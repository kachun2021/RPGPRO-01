import type { PetManager } from '../pets/PetManager';
import type { PetEncyclopedia } from '../pets/PetEncyclopedia';
import type { PetEquipment } from '../pets/PetEquipment';
import { PetEquipSlot } from '../pets/PetEquipment';
import type { PetBuff } from '../pets/PetBuff';
import type { Pet } from '../pets/Pet';
import { SERIES_ICONS, SERIES_COLORS } from '../pets/PetData';

const STORAGE_COLS = 5;
const STORAGE_ROWS = 4;

export class PetPanel {
      private _el: HTMLDivElement;
      private _pm: PetManager;
      private _enc: PetEncyclopedia;
      private _eq: PetEquipment;
      private _buff: PetBuff;
      private _sel: Pet | null = null;
      private _page = 0;
      private _dragPet: Pet | null = null;

      // Sub-panel callbacks
      public onOpenFusion: (() => void) | null = null;
      public onOpenEncyclopedia: (() => void) | null = null;
      public onOpenRename: ((pet: Pet) => void) | null = null;
      public onOpenRevival: (() => void) | null = null;

      constructor(pm: PetManager, enc: PetEncyclopedia, eq: PetEquipment, buff: PetBuff) {
            this._pm = pm;
            this._enc = enc;
            this._eq = eq;
            this._buff = buff;

            this._el = document.createElement('div');
            this._el.id = 'petPanel';
            this._el.className = 'sa-panel';
            Object.assign(this._el.style, {
                  position: 'fixed', right: '70px', top: '50%', transform: 'translateY(-50%)',
                  width: '340px', zIndex: '300', display: 'none', overflow: 'hidden',
            });

            document.getElementById('ui-layer')?.appendChild(this._el);
            if (this._pm.active.length > 0) this._sel = this._pm.active[0];
      }

      get element(): HTMLElement { return this._el; }
      open(): void { this._el.style.display = ''; this._render(); }
      close(): void { this._el.style.display = 'none'; }
      toggle(): void { this._el.style.display === 'none' ? this.open() : this.close(); }

      private _render(): void {
            const pet = this._sel;
            this._el.innerHTML = '';

            // ── TITLE ──
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span>🐾 寵物信息</span>';
            // Close btn
            const closeBtn = document.createElement('span');
            closeBtn.style.cssText = 'cursor:pointer;font-size:14px;margin-left:auto';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());
            // Active mini portraits
            const minis = document.createElement('div');
            minis.style.cssText = 'display:flex;gap:2px;margin-left:auto;margin-right:6px';
            for (let i = 0; i < 3; i++) {
                  const p = this._pm.active[i];
                  const m = document.createElement('div');
                  m.className = 'sa-mini-portrait';
                  if (p) {
                        const c = SERIES_COLORS[p.def.series];
                        m.style.borderColor = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
                        m.title = p.def.name;
                        m.addEventListener('click', () => { this._sel = p; this._render(); });
                  }
                  minis.appendChild(m);
            }
            title.appendChild(minis);
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            if (!pet) {
                  const empty = document.createElement('div');
                  empty.style.cssText = 'text-align:center;padding:20px;color:#8B7355;font-size:12px';
                  empty.textContent = 'No pet selected';
                  this._el.appendChild(empty);
                  this._renderBottom(); return;
            }

            // ── INFO ROW: name + portrait ──
            const info = document.createElement('div');
            info.className = 'sa-sec';
            info.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
            info.innerHTML = `<div>
      <div style="font-weight:700;color:#5C3D1A;font-size:12px">[${pet.def.series}] ${pet.def.name}</div>
      <div style="display:flex;gap:3px;margin-top:3px">
        <span class="sa-tag">种族</span><span class="sa-tag sa-tag-active">${pet.def.series}</span>
      </div>
    </div>`;
            const portrait = document.createElement('div');
            portrait.className = 'sa-pet-portrait-lg';
            const c = SERIES_COLORS[pet.def.series];
            portrait.style.borderColor = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
            info.appendChild(portrait);
            this._el.appendChild(info);

            // ── STATS COMPACT ──
            const s = pet.stats;
            const stats = document.createElement('div');
            stats.className = 'sa-sec';
            stats.innerHTML = `
      <div class="sa-sr"><b class="sa-sl">LV</b><span class="sa-sv">${s.level}</span><b class="sa-sl">EXP</b><span class="sa-sv">${s.exp > 0 ? ((s.exp / (s.level * 100)) * 100).toFixed(1) : '0.0'}%</span></div>
      <div class="sa-sr"><b class="sa-sl">HP</b><span class="sa-sv">${s.hp}/${s.maxHp}</span><b class="sa-sl">MP</b><span class="sa-sv">${s.mp}/${s.maxMp}</span></div>
      <div class="sa-sr"><b class="sa-sl">力量</b><span class="sa-sv">${s.str}</span><b class="sa-sl">攻撃力</b><span class="sa-sv">${s.atkMin}~${s.atkMax}</span></div>
      <div class="sa-sr"><b class="sa-sl">敏捷</b><span class="sa-sv">${s.agi}</span><b class="sa-sl">命中率</b><span class="sa-sv">${s.hitRate}</span></div>
      <div class="sa-sr"><b class="sa-sl">準確</b><span class="sa-sv">${s.acc}</span><b class="sa-sl">回避率</b><span class="sa-sv">${s.dodgeRate}</span></div>
      <div class="sa-sr"><b class="sa-sl">幸運</b><span class="sa-sv">${s.luk}</span><b class="sa-sl">屬性</b><span class="sa-sv">${s.element}</span></div>
    `;
            this._el.appendChild(stats);

            // ── 6 EQUIPMENT ──
            const eqSec = document.createElement('div');
            eqSec.className = 'sa-sec';
            eqSec.style.cssText = 'display:flex;gap:3px;justify-content:center;padding:4px 8px';
            for (const slot of Object.values(PetEquipSlot)) {
                  const el = document.createElement('div');
                  el.className = 'sa-equip-slot';
                  el.style.cssText = 'width:36px;height:36px';
                  const unlocked = this._eq.isSlotUnlocked(pet.def.id, slot);
                  if (!unlocked) el.innerHTML = '<span style="font-size:14px;font-weight:700;color:#8B7355">X</span>';
                  else el.innerHTML = '<span style="font-size:8px;color:#AAA">—</span>';
                  el.title = `${slot}${unlocked ? '' : ' (Locked)'}`;
                  eqSec.appendChild(el);
            }
            this._el.appendChild(eqSec);

            this._renderBottom();
      }

      /** Bottom: deploy(left) + storage(right) + buff row */
      private _renderBottom(): void {
            // ── DEPLOY + STORAGE with drag-drop ──
            const sec = document.createElement('div');
            sec.className = 'sa-sec';
            sec.style.cssText = 'padding:4px 6px';

            // Tabs
            const inactive = this._pm.owned.filter(p => !p.isActive);
            const totalPages = Math.ceil(inactive.length / (STORAGE_COLS * STORAGE_ROWS)) || 1;
            const tabs = document.createElement('div');
            tabs.style.cssText = 'display:flex;gap:2px;margin-bottom:4px';
            for (let p = 0; p < Math.min(totalPages, 8); p++) {
                  const t = document.createElement('span');
                  t.className = `sa-tag ${p === this._page ? 'sa-tag-active' : ''}`;
                  t.textContent = `${p + 1}`;
                  t.style.cursor = 'pointer';
                  t.addEventListener('click', () => { this._page = p; this._render(); });
                  tabs.appendChild(t);
            }
            sec.appendChild(tabs);

            // Layout flex: deploy | storage
            const layout = document.createElement('div');
            layout.style.cssText = 'display:flex;gap:4px';

            // LEFT: 3 deploy vertical
            const deployCol = document.createElement('div');
            deployCol.style.cssText = 'display:flex;flex-direction:column;gap:2px;border:2px solid #C4993D;border-radius:3px;padding:2px;background:#E8D5B0';
            for (let i = 0; i < 3; i++) {
                  const slot = this._makeSlot(36, 36, true);
                  const pet = this._pm.active[i];
                  if (pet) {
                        slot.style.borderColor = this._cssColor(pet);
                        slot.innerHTML = `<img src="assets/icons/${SERIES_ICONS[pet.def.series]}" draggable="false" style="width:26px;height:26px;pointer-events:none" alt="">`;
                        slot.draggable = true;
                        slot.addEventListener('dragstart', (e) => { this._dragPet = pet; e.dataTransfer!.effectAllowed = 'move'; });
                  }
                  // Drop: storage→deploy
                  slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.style.boxShadow = '0 0 6px #C4993D'; });
                  slot.addEventListener('dragleave', () => { slot.style.boxShadow = ''; });
                  slot.addEventListener('drop', (e) => {
                        e.preventDefault(); slot.style.boxShadow = '';
                        if (this._dragPet && !this._dragPet.isActive) {
                              const idx = this._pm.owned.indexOf(this._dragPet);
                              if (idx >= 0) this._pm.deploy(idx);
                              this._dragPet = null; this._render();
                        }
                  });
                  // Click fallback
                  if (pet) slot.addEventListener('click', () => { this._sel = pet; this._render(); });
                  deployCol.appendChild(slot);
            }
            layout.appendChild(deployCol);

            // RIGHT: storage grid
            const gridWrap = document.createElement('div');
            gridWrap.style.cssText = 'flex:1;border:2px solid #8B7355;border-radius:3px;padding:2px;background:#D4C4A0';
            // Drop zone for recall (entire grid)
            gridWrap.addEventListener('dragover', (e) => { e.preventDefault(); });
            gridWrap.addEventListener('drop', (e) => {
                  e.preventDefault();
                  if (this._dragPet && this._dragPet.isActive) {
                        const ai = this._pm.active.indexOf(this._dragPet);
                        if (ai >= 0) this._pm.recall(ai);
                        this._dragPet = null; this._render();
                  }
            });

            const grid = document.createElement('div');
            grid.style.cssText = `display:grid;grid-template-columns:repeat(${STORAGE_COLS},1fr);gap:2px`;
            const start = this._page * STORAGE_COLS * STORAGE_ROWS;
            for (let i = 0; i < STORAGE_COLS * STORAGE_ROWS; i++) {
                  const slot = this._makeSlot(0, 32, false);
                  slot.style.width = 'auto';
                  const pet = inactive[start + i];
                  if (pet) {
                        slot.innerHTML = `<img src="assets/icons/${SERIES_ICONS[pet.def.series]}" draggable="false" style="width:24px;height:24px;pointer-events:none" alt="">`;
                        slot.draggable = true;
                        slot.title = `${pet.def.name} Lv.${pet.stats.level}`;
                        slot.addEventListener('dragstart', (e) => {
                              this._dragPet = pet;
                              e.dataTransfer!.effectAllowed = 'move';
                              const ownedIdx = this._pm.owned.indexOf(pet);
                              e.dataTransfer!.setData('text/pet-index', String(ownedIdx));
                        });
                        slot.addEventListener('click', () => { this._sel = pet; this._render(); });
                  }
                  grid.appendChild(slot);
            }
            gridWrap.appendChild(grid);
            layout.appendChild(gridWrap);
            sec.appendChild(layout);
            this._el.appendChild(sec);

            // ── 5 BUFF SLOTS ──
            if (this._sel) {
                  const buffSec = document.createElement('div');
                  buffSec.className = 'sa-sec';
                  buffSec.style.cssText = 'display:flex;gap:3px;justify-content:center;padding:3px 6px';
                  const slots = this._buff.getSlots(this._sel.def.id);
                  for (let i = 0; i < 5; i++) {
                        const el = this._makeSlot(32, 32, false);
                        const b = slots[i];
                        if (b) {
                              const m = Math.ceil(b.remainingMs / 60000);
                              el.innerHTML = `<span style="font-size:7px;color:#5C3D1A">${b.def.name.substring(0, 3)}</span><span style="font-size:6px;color:#8B7355">${m}m</span>`;
                        }
                        buffSec.appendChild(el);
                  }
                  this._el.appendChild(buffSec);
            }

            // ── ACTION BUTTONS ──
            const actionBar = document.createElement('div');
            actionBar.style.cssText = 'display:flex;gap:6px;padding:6px 8px;justify-content:center;border-top:1px solid rgba(160,130,80,0.15)';

            const actions = [
                  { label: '⚗️ 合成', cb: () => this.onOpenFusion?.() },
                  { label: '📖 圖鑑', cb: () => this.onOpenEncyclopedia?.() },
                  { label: '✏️ 更名', cb: () => { if (this._sel) this.onOpenRename?.(this._sel); } },
                  { label: '💀 復活', cb: () => this.onOpenRevival?.() },
            ];

            for (const a of actions) {
                  const btn = document.createElement('button');
                  btn.className = 'btn-gold';
                  btn.style.cssText = 'padding:4px 10px;font-size:10px;flex:1';
                  btn.textContent = a.label;
                  btn.addEventListener('click', a.cb);
                  actionBar.appendChild(btn);
            }
            this._el.appendChild(actionBar);
      }

      private _makeSlot(w: number, h: number, isDeploy: boolean): HTMLDivElement {
            const el = document.createElement('div');
            el.className = isDeploy ? 'sa-pet-slot sa-pet-slot-deploy' : 'sa-pet-slot';
            if (w) el.style.width = w + 'px';
            if (h) el.style.height = h + 'px';
            return el;
      }

      private _cssColor(pet: Pet): string {
            const c = SERIES_COLORS[pet.def.series];
            return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
      }

      refresh(): void { if (this._el.style.display !== 'none') this._render(); }
      dispose(): void { this._el.remove(); }
}
