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
      private _bodyRoot: HTMLDivElement;
      private _pm: PetManager;
      private _enc: PetEncyclopedia;
      private _eq: PetEquipment;
      private _buff: PetBuff;
      private _sel: Pet | null = null;
      private _page = 0;
      private _dragPet: Pet | null = null;
      private _fitFrameId = 0;
      private _onResize = (): void => {
            if (this._el.style.display === 'none') return;
            this._syncAnchor();
            this._scheduleFit();
      };

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
                  position: 'fixed',
                  right: '70px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '340px',
                  zIndex: '300',
                  display: 'none',
                  maxHeight: '85vh',
                  overflow: 'hidden',
            });

            this._bodyRoot = document.createElement('div');
            this._bodyRoot.className = 'pet-panel-body';
            this._el.appendChild(this._bodyRoot);

            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
            if (this._pm.active.length > 0) this._sel = this._pm.active[0];
      }

      get element(): HTMLElement { return this._el; }

      open(): void {
            this._syncAnchor();
            this._el.style.display = '';
            this._render();
      }

      close(): void {
            this._el.style.display = 'none';
      }

      toggle(): void {
            this._el.style.display === 'none' ? this.open() : this.close();
      }

      private _render(): void {
            const pet = this._sel;
            this._bodyRoot.innerHTML = '';

            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span>🐉 寵物資訊</span>';

            const minis = document.createElement('div');
            minis.style.cssText = 'display:flex;gap:2px;margin-left:auto;margin-right:28px';
            for (let i = 0; i < 3; i++) {
                  const p = this._pm.active[i];
                  const mini = document.createElement('div');
                  mini.className = 'sa-mini-portrait';
                  if (p) {
                        const c = SERIES_COLORS[p.def.series];
                        mini.style.borderColor = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
                        mini.title = p.def.name;
                        mini.addEventListener('click', () => {
                              this._sel = p;
                              this._render();
                        });
                  }
                  minis.appendChild(mini);
            }
            title.appendChild(minis);

            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.close());
            title.appendChild(closeBtn);
            this._bodyRoot.appendChild(title);

            if (!pet) {
                  const empty = document.createElement('div');
                  empty.style.cssText = 'text-align:center;padding:20px;color:rgba(200,195,185,0.65);font-size:12px';
                  empty.textContent = '尚未選擇寵物';
                  this._bodyRoot.appendChild(empty);
                  this._renderBottom();
                  this._scheduleFit();
                  return;
            }

            const info = document.createElement('div');
            info.className = 'sa-sec';
            info.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
            info.innerHTML = `
                  <div>
                        <div style="font-weight:700;color:rgba(220,215,200,0.88);font-size:12px">[${pet.def.series}] ${pet.def.name}</div>
                        <div style="display:flex;gap:3px;margin-top:3px">
                              <span class="sa-tag">系列</span>
                              <span class="sa-tag sa-tag-active">${pet.def.series}</span>
                        </div>
                  </div>
            `;

            const portrait = document.createElement('div');
            portrait.className = 'sa-pet-portrait-lg';
            const c = SERIES_COLORS[pet.def.series];
            portrait.style.borderColor = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
            info.appendChild(portrait);
            this._bodyRoot.appendChild(info);

            const s = pet.stats;
            const stats = document.createElement('div');
            stats.className = 'sa-sec';
            stats.innerHTML = `
                  <div class="sa-sr"><b class="sa-sl">LV</b><span class="sa-sv">${s.level}</span><b class="sa-sl">EXP</b><span class="sa-sv">${s.exp > 0 ? ((s.exp / (s.level * 100)) * 100).toFixed(1) : '0.0'}%</span></div>
                  <div class="sa-sr"><b class="sa-sl">HP</b><span class="sa-sv">${s.hp}/${s.maxHp}</span><b class="sa-sl">MP</b><span class="sa-sv">${s.mp}/${s.maxMp}</span></div>
                  <div class="sa-sr"><b class="sa-sl">力量</b><span class="sa-sv">${s.str}</span><b class="sa-sl">攻擊力</b><span class="sa-sv">${s.atkMin}~${s.atkMax}</span></div>
                  <div class="sa-sr"><b class="sa-sl">敏捷</b><span class="sa-sv">${s.agi}</span><b class="sa-sl">命中率</b><span class="sa-sv">${s.hitRate}</span></div>
                  <div class="sa-sr"><b class="sa-sl">魅力</b><span class="sa-sv">${s.acc}</span><b class="sa-sl">迴避率</b><span class="sa-sv">${s.dodgeRate}</span></div>
                  <div class="sa-sr"><b class="sa-sl">幸運</b><span class="sa-sv">${s.luk}</span><b class="sa-sl">屬性</b><span class="sa-sv">${s.element}</span></div>
            `;
            this._bodyRoot.appendChild(stats);

            const eqSec = document.createElement('div');
            eqSec.className = 'sa-sec';
            eqSec.style.cssText = 'display:flex;gap:3px;justify-content:center;padding:4px 8px';
            for (const slot of Object.values(PetEquipSlot)) {
                  const el = document.createElement('div');
                  el.className = 'sa-equip-slot';
                  el.style.cssText = 'width:36px;height:36px';
                  const unlocked = this._eq.isSlotUnlocked(pet.def.id, slot);
                  if (!unlocked) {
                        el.innerHTML = '<span style="font-size:14px;font-weight:700;color:#8B7355">X</span>';
                  } else {
                        el.innerHTML = '<span style="font-size:8px;color:rgba(200,195,185,0.5)">空</span>';
                  }
                  el.title = `${slot}${unlocked ? '' : '（未解鎖）'}`;
                  eqSec.appendChild(el);
            }
            this._bodyRoot.appendChild(eqSec);

            this._renderBottom();
            this._scheduleFit();
      }

      private _renderBottom(): void {
            const sec = document.createElement('div');
            sec.className = 'sa-sec';
            sec.style.cssText = 'padding:4px 6px';

            const inactive = this._pm.owned.filter((p) => !p.isActive);
            const totalPages = Math.ceil(inactive.length / (STORAGE_COLS * STORAGE_ROWS)) || 1;

            const tabs = document.createElement('div');
            tabs.style.cssText = 'display:flex;gap:2px;margin-bottom:4px';
            for (let p = 0; p < Math.min(totalPages, 8); p++) {
                  const tag = document.createElement('span');
                  tag.className = `sa-tag ${p === this._page ? 'sa-tag-active' : ''}`;
                  tag.textContent = `${p + 1}`;
                  tag.style.cursor = 'pointer';
                  tag.addEventListener('click', () => {
                        this._page = p;
                        this._render();
                  });
                  tabs.appendChild(tag);
            }
            sec.appendChild(tabs);

            const layout = document.createElement('div');
            layout.style.cssText = 'display:flex;gap:4px';

            const deployCol = document.createElement('div');
            deployCol.style.cssText = 'display:flex;flex-direction:column;gap:2px;border:2px solid #C4993D;border-radius:3px;padding:2px;background:#E8D5B0';
            for (let i = 0; i < 3; i++) {
                  const slot = this._makeSlot(36, 36, true);
                  const pet = this._pm.active[i];
                  if (pet) {
                        slot.style.borderColor = this._cssColor(pet);
                        slot.innerHTML = `<img src="assets/icons/${SERIES_ICONS[pet.def.series]}" draggable="false" style="width:26px;height:26px;pointer-events:none" alt="">`;
                        slot.draggable = true;
                        slot.addEventListener('dragstart', (e) => {
                              this._dragPet = pet;
                              e.dataTransfer!.effectAllowed = 'move';
                        });
                        slot.addEventListener('click', () => {
                              this._sel = pet;
                              this._render();
                        });
                  }

                  slot.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        slot.style.boxShadow = '0 0 6px #C4993D';
                  });
                  slot.addEventListener('dragleave', () => {
                        slot.style.boxShadow = '';
                  });
                  slot.addEventListener('drop', (e) => {
                        e.preventDefault();
                        slot.style.boxShadow = '';
                        if (this._dragPet && !this._dragPet.isActive) {
                              const idx = this._pm.owned.indexOf(this._dragPet);
                              if (idx >= 0) this._pm.deploy(idx);
                              this._dragPet = null;
                              this._render();
                        }
                  });
                  deployCol.appendChild(slot);
            }
            layout.appendChild(deployCol);

            const gridWrap = document.createElement('div');
            gridWrap.style.cssText = 'flex:1;border:2px solid #8B7355;border-radius:3px;padding:2px;background:#D4C4A0';
            gridWrap.addEventListener('dragover', (e) => {
                  e.preventDefault();
            });
            gridWrap.addEventListener('drop', (e) => {
                  e.preventDefault();
                  if (this._dragPet && this._dragPet.isActive) {
                        const ai = this._pm.active.indexOf(this._dragPet);
                        if (ai >= 0) this._pm.recall(ai);
                        this._dragPet = null;
                        this._render();
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
                        slot.addEventListener('click', () => {
                              this._sel = pet;
                              this._render();
                        });
                  }
                  grid.appendChild(slot);
            }
            gridWrap.appendChild(grid);
            layout.appendChild(gridWrap);
            sec.appendChild(layout);
            this._bodyRoot.appendChild(sec);

            if (this._sel) {
                  const buffSec = document.createElement('div');
                  buffSec.className = 'sa-sec';
                  buffSec.style.cssText = 'display:flex;gap:3px;justify-content:center;padding:3px 6px';
                  const slots = this._buff.getSlots(this._sel.def.id);
                  for (let i = 0; i < 5; i++) {
                        const el = this._makeSlot(32, 32, false);
                        const b = slots[i];
                        if (b) {
                              const minutes = Math.ceil(b.remainingMs / 60000);
                              el.innerHTML = `<span style="font-size:7px;color:#5C3D1A">${b.def.name.substring(0, 3)}</span><span style="font-size:6px;color:#8B7355">${minutes}m</span>`;
                        }
                        buffSec.appendChild(el);
                  }
                  this._bodyRoot.appendChild(buffSec);
            }

            const actionBar = document.createElement('div');
            actionBar.style.cssText = 'display:flex;gap:6px;padding:6px 8px;justify-content:center;border-top:1px solid rgba(160,130,80,0.15)';
            const actions = [
                  { label: '🐾 合成', cb: () => this.onOpenFusion?.() },
                  { label: '📖 圖鑑', cb: () => this.onOpenEncyclopedia?.() },
                  { label: '✏️ 更名', cb: () => { if (this._sel) this.onOpenRename?.(this._sel); } },
                  { label: '👁 復活', cb: () => this.onOpenRevival?.() },
            ];

            for (const action of actions) {
                  const btn = document.createElement('button');
                  btn.className = 'btn-gold';
                  btn.style.cssText = 'padding:4px 10px;font-size:10px;flex:1;min-width:0;white-space:nowrap';
                  btn.textContent = action.label;
                  btn.addEventListener('click', action.cb);
                  actionBar.appendChild(btn);
            }
            this._bodyRoot.appendChild(actionBar);
      }

      private _scheduleFit(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            this._fitBodyScale();
            this._fitFrameId = requestAnimationFrame(() => {
                  this._fitBodyScale();
            });
      }

      private _syncAnchor(): void {
            const skillBar = document.getElementById('skillBar');
            const skillBarWidth = skillBar ? Math.ceil(skillBar.getBoundingClientRect().width) : 0;
            const rightGap = Math.max(70, skillBarWidth + 12);
            this._el.style.right = `${rightGap}px`;
      }

      private _fitBodyScale(): void {
            this._el.style.transformOrigin = 'right center';
            this._el.style.transform = 'translateY(-50%) scale(1)';

            const vh = window.innerHeight || 0;
            const available = Math.max(0, Math.floor(vh * 0.85) - 4);
            if (available <= 0) return;

            const needed = this._bodyRoot.scrollHeight;
            if (needed <= 0 || needed <= available) return;

            const scale = Math.max(0.55, Math.min(1, available / needed));
            this._el.style.transform = `translateY(-50%) scale(${scale})`;
      }

      private _makeSlot(w: number, h: number, isDeploy: boolean): HTMLDivElement {
            const el = document.createElement('div');
            el.className = isDeploy ? 'sa-pet-slot sa-pet-slot-deploy' : 'sa-pet-slot';
            if (w) el.style.width = `${w}px`;
            if (h) el.style.height = `${h}px`;
            return el;
      }

      private _cssColor(pet: Pet): string {
            const c = SERIES_COLORS[pet.def.series];
            return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
      }

      refresh(): void {
            if (this._el.style.display !== 'none') this._render();
      }

      dispose(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
