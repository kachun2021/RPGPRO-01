import type { PetManager } from '../pets/PetManager';
import type { PetEncyclopedia } from '../pets/PetEncyclopedia';
import type { PetEquipment } from '../pets/PetEquipment';
import { PetEquipSlot } from '../pets/PetEquipment';
import type { PetBuff } from '../pets/PetBuff';
import type { Pet } from '../pets/Pet';
import { SERIES_COLORS, SERIES_ICONS } from '../pets/PetData';

const STORAGE_COLS = 5;
const STORAGE_ROWS = 4;

export class PetPanel {
      readonly panelId = 'pet';
      private _el: HTMLDivElement;
      private _bodyRoot: HTMLDivElement;
      private _pm: PetManager;
      private _enc: PetEncyclopedia;
      private _eq: PetEquipment;
      private _buff: PetBuff;
      private _sel: Pet | null = null;
      private _page = 0;
      private _dragPet: Pet | null = null;
      private _visible = false;
      private _fitFrameId = 0;
      private _onResize = (): void => {
            if (!this._visible) return;
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
            this._el.className = 'sa-panel pet-panel-root ui-panel-fullscreen';

            this._bodyRoot = document.createElement('div');
            this._bodyRoot.className = 'pet-panel-body';
            this._el.appendChild(this._bodyRoot);

            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
            if (this._pm.active.length > 0) this._sel = this._pm.active[0];
      }

      get element(): HTMLElement { return this._el; }
      get isVisible(): boolean { return this._visible; }

      open(): void {
            this._visible = true;
            this._el.classList.add('is-open');
            this._syncAnchor();
            this._render();
      }

      close(): void {
            this._visible = false;
            this._el.classList.remove('is-open');
      }

      toggle(): void {
            this._visible ? this.close() : this.open();
      }

      show(): void {
            this.open();
      }

      hide(): void {
            this.close();
      }

      private _render(): void {
            const pet = this._sel;
            this._bodyRoot.innerHTML = '';

            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span>🐾 寵物資訊</span>';

            const minis = document.createElement('div');
            minis.className = 'sa-title-minis';
            for (let i = 0; i < 3; i++) {
                  const p = this._pm.active[i];
                  const mini = document.createElement('div');
                  mini.className = 'sa-mini-portrait';
                  if (p) {
                        mini.style.borderColor = this._cssColor(p);
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
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());
            title.appendChild(closeBtn);
            this._bodyRoot.appendChild(title);

            if (!pet) {
                  const empty = document.createElement('div');
                  empty.className = 'sa-empty-tip';
                  empty.textContent = '尚未選擇寵物';
                  this._bodyRoot.appendChild(empty);
                  this._renderBottom();
                  this._scheduleFit();
                  return;
            }

            const info = document.createElement('div');
            info.className = 'sa-sec sa-info-head';
            info.innerHTML = `
                  <div>
                        <div class="sa-info-name">[${pet.def.series}] ${pet.def.name}</div>
                        <div class="sa-info-tags">
                              <span class="sa-tag">種類</span>
                              <span class="sa-tag sa-tag-active">${pet.def.series}</span>
                        </div>
                  </div>
            `;

            const portrait = document.createElement('div');
            portrait.className = 'sa-pet-portrait-lg';
            portrait.style.borderColor = this._cssColor(pet);
            info.appendChild(portrait);
            this._bodyRoot.appendChild(info);

            const s = pet.stats;
            const stats = document.createElement('div');
            stats.className = 'sa-sec';
            stats.innerHTML = `
                  <div class="sa-sr"><b class="sa-sl">LV</b><span class="sa-sv">${s.level}</span><b class="sa-sl">EXP</b><span class="sa-sv">${s.exp > 0 ? ((s.exp / (s.level * 100)) * 100).toFixed(1) : '0.0'}%</span></div>
                  <div class="sa-sr"><b class="sa-sl">HP</b><span class="sa-sv">${s.hp}/${s.maxHp}</span><b class="sa-sl">MP</b><span class="sa-sv">${s.mp}/${s.maxMp}</span></div>
                  <div class="sa-sr"><b class="sa-sl">力量</b><span class="sa-sv">${s.str}</span><b class="sa-sl">攻擊</b><span class="sa-sv">${s.atkMin}~${s.atkMax}</span></div>
                  <div class="sa-sr"><b class="sa-sl">敏捷</b><span class="sa-sv">${s.agi}</span><b class="sa-sl">命中</b><span class="sa-sv">${s.hitRate}</span></div>
                  <div class="sa-sr"><b class="sa-sl">魅力</b><span class="sa-sv">${s.acc}</span><b class="sa-sl">迴避</b><span class="sa-sv">${s.dodgeRate}</span></div>
                  <div class="sa-sr"><b class="sa-sl">幸運</b><span class="sa-sv">${s.luk}</span><b class="sa-sl">屬性</b><span class="sa-sv">${s.element}</span></div>
            `;
            this._bodyRoot.appendChild(stats);

            const eqSec = document.createElement('div');
            eqSec.className = 'sa-sec sa-eq-sec';
            for (const slot of Object.values(PetEquipSlot)) {
                  const el = document.createElement('div');
                  el.className = 'sa-equip-slot sa-eq-slot-fixed';
                  const unlocked = this._eq.isSlotUnlocked(pet.def.id, slot);
                  if (!unlocked) {
                        el.innerHTML = '<span class="sa-eq-slot-x">X</span>';
                  } else {
                        el.innerHTML = '<span class="sa-eq-slot-empty">空</span>';
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
            sec.className = 'sa-sec sa-bottom-sec';

            const inactive = this._pm.owned.filter((p) => !p.isActive);
            const totalPages = Math.ceil(inactive.length / (STORAGE_COLS * STORAGE_ROWS)) || 1;

            const tabs = document.createElement('div');
            tabs.className = 'sa-page-tabs';
            for (let p = 0; p < Math.min(totalPages, 8); p++) {
                  const tag = document.createElement('span');
                  tag.className = `sa-tag ${p === this._page ? 'sa-tag-active' : ''}`;
                  tag.textContent = `${p + 1}`;
                  tag.addEventListener('click', () => {
                        this._page = p;
                        this._render();
                  });
                  tabs.appendChild(tag);
            }
            sec.appendChild(tabs);

            const layout = document.createElement('div');
            layout.className = 'sa-bottom-layout';

            const deployCol = document.createElement('div');
            deployCol.className = 'sa-deploy-col';
            for (let i = 0; i < 3; i++) {
                  const slot = this._makeSlot(36, 36, true);
                  const pet = this._pm.active[i];
                  if (pet) {
                        slot.style.borderColor = this._cssColor(pet);
                        slot.innerHTML = `<img src="assets/icons/${SERIES_ICONS[pet.def.series]}" draggable="false" class="sa-slot-icon-lg" alt="">`;
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
                        slot.classList.add('is-drag-over');
                  });
                  slot.addEventListener('dragleave', () => {
                        slot.classList.remove('is-drag-over');
                  });
                  slot.addEventListener('drop', (e) => {
                        e.preventDefault();
                        slot.classList.remove('is-drag-over');
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
            gridWrap.className = 'sa-grid-wrap';
            gridWrap.addEventListener('dragover', (e) => e.preventDefault());
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
            grid.className = 'sa-grid';
            const start = this._page * STORAGE_COLS * STORAGE_ROWS;
            for (let i = 0; i < STORAGE_COLS * STORAGE_ROWS; i++) {
                  const slot = this._makeSlot(0, 32, false);
                  const pet = inactive[start + i];
                  if (pet) {
                        slot.innerHTML = `<img src="assets/icons/${SERIES_ICONS[pet.def.series]}" draggable="false" class="sa-slot-icon-md" alt="">`;
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
                  buffSec.className = 'sa-sec sa-buff-sec';
                  const slots = this._buff.getSlots(this._sel.def.id);
                  for (let i = 0; i < 5; i++) {
                        const el = this._makeSlot(32, 32, false);
                        const b = slots[i];
                        if (b) {
                              const minutes = Math.ceil(b.remainingMs / 60000);
                              el.innerHTML = `<span class="sa-buff-name">${b.def.name.substring(0, 3)}</span><span class="sa-buff-min">${minutes}m</span>`;
                        }
                        buffSec.appendChild(el);
                  }
                  this._bodyRoot.appendChild(buffSec);
            }

            const actionBar = document.createElement('div');
            actionBar.className = 'sa-action-bar';
            const actions = [
                  { label: '🐾 合成', cb: () => this.onOpenFusion?.() },
                  { label: '📖 圖鑑', cb: () => this.onOpenEncyclopedia?.() },
                  { label: '✏️ 更名', cb: () => { if (this._sel) this.onOpenRename?.(this._sel); } },
                  { label: '💀 復活', cb: () => this.onOpenRevival?.() },
            ];

            for (const action of actions) {
                  const btn = document.createElement('button');
                  btn.className = 'btn-gold sa-action-btn';
                  btn.textContent = action.label;
                  btn.addEventListener('click', action.cb);
                  actionBar.appendChild(btn);
            }
            this._bodyRoot.appendChild(actionBar);
      }

      private _scheduleFit(): void {
            if (this._el.classList.contains('ui-panel-fullscreen')) return;
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            this._fitBodyScale();
            this._fitFrameId = requestAnimationFrame(() => this._fitBodyScale());
      }

      private _syncAnchor(): void {
            if (this._el.classList.contains('ui-panel-fullscreen')) {
                  this._el.style.removeProperty('right');
                  return;
            }
            const skillBar = document.getElementById('skillBar');
            const skillBarWidth = skillBar ? Math.ceil(skillBar.getBoundingClientRect().width) : 0;
            const rightGap = Math.max(70, skillBarWidth + 12);
            this._el.style.right = `${rightGap}px`;
      }

      private _fitBodyScale(): void {
            if (this._el.classList.contains('ui-panel-fullscreen')) {
                  this._el.style.removeProperty('transform');
                  this._el.style.removeProperty('transform-origin');
                  return;
            }
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
            el.className = isDeploy
                  ? 'sa-pet-slot sa-pet-slot-deploy sa-pet-slot-36'
                  : 'sa-pet-slot';
            if (!isDeploy) {
                  if (w === 32 && h === 32) {
                        el.classList.add('sa-pet-slot-32');
                  } else if (h === 32) {
                        el.classList.add('sa-pet-slot-grid');
                  }
            }
            return el;
      }

      private _cssColor(pet: Pet): string {
            const c = SERIES_COLORS[pet.def.series];
            return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
      }

      refresh(): void {
            if (this._visible) this._render();
      }

      dispose(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
