import type { PetManager } from '../pets/PetManager';
import type { PetEncyclopedia } from '../pets/PetEncyclopedia';
import type { PetEquipment } from '../pets/PetEquipment';
import { PetEquipSlot } from '../pets/PetEquipment';
import type { PetBuff } from '../pets/PetBuff';
import type { Pet } from '../pets/Pet';
import { SERIES_ICONS } from '../pets/PetData';
import { createPanelHeader } from './layout/PanelHeader';

const STORAGE_COLS = 2;
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
      private _visible = false;
      private _fitFrameId = 0;
      private _onResize = (): void => {
            if (!this._visible) return;
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
            this._el.className = 'sa-panel pet-panel-root ui-panel-atlas';

            this._bodyRoot = document.createElement('div');
            this._bodyRoot.className = 'pet-panel-body';
            this._el.appendChild(this._bodyRoot);

            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
            if (this._pm.active.length > 0) this._sel = this._pm.active[0];
      }

      get element(): HTMLElement {
            return this._el;
      }

      get isVisible(): boolean {
            return this._visible;
      }

      open(): void {
            this._visible = true;
            this._el.classList.add('is-open');
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

      refresh(): void {
            if (!this._sel) {
                  this._sel = this._pm.active[0] ?? this._pm.owned[0] ?? null;
            }
            if (this._visible) this._render();
      }

      dispose(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }

      private _render(): void {
            const selected = this._sel ?? this._pm.active[0] ?? this._pm.owned[0] ?? null;
            const inactiveCount = this._pm.owned.filter((pet) => !pet.isActive).length;
            const headerMeta = this._panelSubtitle(selected);
            const headerSummary = this._panelSummary(inactiveCount);
            this._sel = selected;
            this._bodyRoot.innerHTML = '';

            const { root: title } = createPanelHeader({
                  icon: 'pet',
                  kicker: 'Companion Roster',
                  title: '寵物編成',
                  subtitle: headerMeta,
                  summaryText: headerSummary,
                  summaryClassName: 'pet-header-pill',
                  closeLabel: '關閉寵物編成',
                  closeText: '✕',
                  onClose: () => this.close(),
            });
            this._bodyRoot.appendChild(title);

            if (!selected) {
                  const empty = document.createElement('div');
                  empty.className = 'sa-empty-tip';
                  empty.textContent = '尚未持有寵物';
                  this._bodyRoot.appendChild(empty);
                  return;
            }

            const shell = document.createElement('div');
            shell.className = 'pet-dashboard-shell';
            shell.appendChild(this._buildSquadPanel());
            shell.appendChild(this._buildDetailPanel(selected));
            shell.appendChild(this._buildStoragePanel());
            this._bodyRoot.appendChild(shell);
            this._scheduleFit();
      }

      private _panelSubtitle(selected: Pet | null): string {
            if (!selected) return '主力編隊、裝備板、Buff 與待命倉庫總覽';
            return `${selected.displayName || selected.def.name} · Lv.${selected.stats.level} · ${selected.def.series}`;
      }

      private _panelSummary(inactiveCount: number): string {
            return `編隊 ${this._pm.active.length}/${this._pm.MAX_ACTIVE} · 待命 ${inactiveCount}`;
      }

      private _buildSquadPanel(): HTMLDivElement {
            const section = document.createElement('div');
            section.className = 'pet-squad-panel';
            section.innerHTML = `
                  <div class="pet-sec-head">
                        <span class="pet-sec-title">主力編隊</span>
                        <span class="pet-sec-meta">${this._pm.active.length}/${this._pm.MAX_ACTIVE}</span>
                  </div>
            `;

            const list = document.createElement('div');
            list.className = 'pet-squad-list';
            for (let i = 0; i < this._pm.MAX_ACTIVE; i += 1) {
                  const pet = this._pm.active[i] ?? null;
                  const card = document.createElement('div');
                  card.className = `pet-squad-card${pet && this._sel === pet ? ' is-selected' : ''}${pet ? '' : ' is-empty'}`;
                  if (!pet) {
                        card.innerHTML = `
                              <div class="pet-squad-slot-label">編隊位 ${i + 1}</div>
                              <div class="pet-squad-empty">從下方倉庫加入</div>
                        `;
                        list.appendChild(card);
                        continue;
                  }

                  const hpPct = Math.max(0, Math.min(100, Math.round((pet.stats.hp / Math.max(1, pet.stats.maxHp)) * 100)));
                  card.innerHTML = `
                        <div class="pet-squad-top">
                              <span class="pet-squad-index">#${i + 1}</span>
                              <span class="pet-squad-name">${this._escapeHtml(pet.displayName || pet.def.name)}</span>
                        </div>
                        <div class="pet-squad-meta">Lv.${pet.stats.level} · ${this._escapeHtml(pet.def.series)}</div>
                        <div class="pet-squad-bar"><div class="pet-squad-bar-fill"></div></div>
                        <div class="pet-squad-footer">
                              <span class="pet-squad-hp">${pet.stats.hp}/${pet.stats.maxHp}</span>
                              <button type="button" class="pet-squad-action">撤下</button>
                        </div>
                  `;
                  const fill = card.querySelector('.pet-squad-bar-fill') as HTMLDivElement | null;
                  if (fill) fill.style.width = `${hpPct}%`;
                  card.addEventListener('click', (evt) => {
                        if ((evt.target as HTMLElement | null)?.closest('.pet-squad-action')) return;
                        this._sel = pet;
                        this._render();
                  });
                  card.querySelector('.pet-squad-action')?.addEventListener('click', (evt) => {
                        evt.stopPropagation();
                        const activeIndex = this._pm.active.indexOf(pet);
                        if (activeIndex >= 0) {
                              this._pm.recall(activeIndex);
                              if (this._sel === pet) {
                                    this._sel = this._pm.active[0] ?? this._pm.owned[0] ?? null;
                              }
                              this._render();
                        }
                  });
                  list.appendChild(card);
            }
            section.appendChild(list);
            return section;
      }

      private _buildDetailPanel(pet: Pet): HTMLDivElement {
            const section = document.createElement('div');
            section.className = 'pet-detail-panel';
            const buffs = this._buff.getSlots(pet.def.id).filter((entry): entry is NonNullable<typeof entry> => !!entry);
            const activeIndex = this._pm.active.indexOf(pet);
            const canDeploy = !pet.isActive && this._pm.active.length < this._pm.MAX_ACTIVE;
            const expNeed = Math.max(1, pet.stats.level * 80);
            const expPct = Math.min(100, Math.round((pet.stats.exp / expNeed) * 100));
            const equippedCount = Object.values(PetEquipSlot).filter((slot) => this._eq.getEquipped(pet.def.id, slot) !== null).length;
            const equipBonus = this._eq.getTotalBonus(pet.def.id);

            section.innerHTML = `
                  <div class="pet-sec-head">
                        <span class="pet-sec-title">已選寵物</span>
                        <span class="pet-sec-meta">${pet.isActive ? '戰鬥中' : '倉庫待命'}</span>
                  </div>
                  <div class="pet-hero-card atlas-card">
                        <div class="pet-hero-main">
                              <div class="pet-hero-icon ${this._seriesClass(pet)}">
                                    <img src="assets/icons/${SERIES_ICONS[pet.def.series]}" draggable="false" class="pet-hero-image" alt="">
                              </div>
                              <div class="pet-hero-copy">
                                    <div class="pet-hero-name">${this._escapeHtml(pet.displayName || pet.def.name)}</div>
                                    <div class="pet-hero-sub">Lv.${pet.stats.level} · ${this._escapeHtml(pet.def.series)} · EXP ${expPct}%</div>
                                    <div class="pet-hero-tags">
                                          <span class="pet-chip">${this._enc.isDiscovered(pet.def.id) ? '已登錄圖鑑' : '未登錄圖鑑'}</span>
                                          <span class="pet-chip">${pet.isDead ? '需復活' : '可戰鬥'}</span>
                                    </div>
                              </div>
                              <div class="pet-hero-rail">
                                    <span class="pet-hero-rail-label">裝備板</span>
                                    <span class="pet-hero-rail-value">${equippedCount}/6</span>
                                    <span class="pet-hero-rail-copy">${pet.isActive ? '目前主力編隊' : '可作替補與培養'} </span>
                              </div>
                        </div>
                        <div class="pet-hero-actions">
                              <button type="button" class="btn-gold sa-action-btn" id="pet-open-fusion">合成</button>
                              <button type="button" class="sa-action-btn" id="pet-open-book">圖鑑</button>
                              <button type="button" class="sa-action-btn" id="pet-open-rename">更名</button>
                              <button type="button" class="sa-action-btn" id="pet-open-revival">復活</button>
                        </div>
                  </div>
                  <div class="pet-stat-grid">
                        ${this._statCard('HP', `${pet.stats.hp}/${pet.stats.maxHp}`)}
                        ${this._statCard('MP', `${pet.stats.mp}/${pet.stats.maxMp}`)}
                        ${this._statCard('攻擊', `${pet.stats.atkMin}~${pet.stats.atkMax}`)}
                        ${this._statCard('命中', `${pet.stats.hitRate}`)}
                        ${this._statCard('迴避', `${pet.stats.dodgeRate}`)}
                        ${this._statCard('屬性', `${pet.stats.element}`)}
                  </div>
                  <div class="pet-equipment-panel">
                        <div class="pet-sec-head pet-sec-head-sub">
                              <span class="pet-sec-subtitle">裝備板</span>
                              <span class="pet-sec-meta">${this._formatEquipBonusSummary(equipBonus)}</span>
                        </div>
                        <div class="pet-equip-grid"></div>
                  </div>
                  <div class="pet-buff-panel">
                        <div class="pet-sec-head pet-sec-head-sub">
                              <span class="pet-sec-subtitle">Buff / 狀態</span>
                              <span class="pet-sec-meta">${buffs.length} 項</span>
                        </div>
                        <div class="pet-buff-list">${buffs.length > 0 ? '' : '<div class="pet-buff-empty">目前沒有 Buff</div>'}</div>
                  </div>
                  <div class="pet-deploy-bar">
                        <span class="pet-deploy-note">${activeIndex >= 0 ? `目前在編隊位 ${activeIndex + 1}` : canDeploy ? '可加入主力編隊' : '編隊已滿，先撤下其中一隻'}</span>
                        <button type="button" class="btn-gold sa-action-btn" id="pet-toggle-active"${!pet.isActive && !canDeploy ? ' disabled' : ''}>
                              ${pet.isActive ? '撤下編隊' : '加入編隊'}
                        </button>
                  </div>
            `;

            const equipGrid = section.querySelector('.pet-equip-grid') as HTMLDivElement | null;
            if (equipGrid) {
                  for (const slot of Object.values(PetEquipSlot)) {
                        const unlocked = this._eq.isSlotUnlocked(pet.def.id, slot);
                        const equipped = this._eq.getEquipped(pet.def.id, slot);
                        const el = document.createElement('div');
                        el.className = `pet-equip-slot atlas-card${unlocked ? '' : ' is-locked'}${equipped ? ' is-equipped' : ''}`;
                        el.innerHTML = `
                              <span class="pet-equip-slot-label">${this._slotLabel(slot)}</span>
                              <span class="pet-equip-slot-item">${this._escapeHtml(equipped?.name ?? (unlocked ? '目前空位' : '尚未解鎖'))}</span>
                              <span class="pet-equip-slot-note">${this._escapeHtml(this._formatEquipSlotNote(slot, unlocked, equipped?.stats ?? null))}</span>
                        `;
                        equipGrid.appendChild(el);
                  }
            }

            const buffList = section.querySelector('.pet-buff-list') as HTMLDivElement | null;
            if (buffList) {
                  for (const buff of buffs) {
                        const row = document.createElement('div');
                        row.className = 'pet-buff-row';
                        row.innerHTML = `
                              <span class="pet-buff-name">${this._escapeHtml(buff.def.name)}</span>
                              <span class="pet-buff-time">${Math.ceil(buff.remainingMs / 60000)}m</span>
                        `;
                        buffList.appendChild(row);
                  }
            }

            section.querySelector('#pet-open-fusion')?.addEventListener('click', () => this.onOpenFusion?.());
            section.querySelector('#pet-open-book')?.addEventListener('click', () => this.onOpenEncyclopedia?.());
            section.querySelector('#pet-open-rename')?.addEventListener('click', () => this.onOpenRename?.(pet));
            section.querySelector('#pet-open-revival')?.addEventListener('click', () => this.onOpenRevival?.());
            section.querySelector('#pet-toggle-active')?.addEventListener('click', () => {
                  if (pet.isActive) {
                        const idx = this._pm.active.indexOf(pet);
                        if (idx >= 0) this._pm.recall(idx);
                  } else {
                        const idx = this._pm.owned.indexOf(pet);
                        if (idx >= 0) this._pm.deploy(idx);
                  }
                  this._render();
            });

            return section;
      }

      private _buildStoragePanel(): HTMLDivElement {
            const section = document.createElement('div');
            section.className = 'pet-storage-panel';
            const inactive = this._pm.owned.filter((pet) => !pet.isActive);
            const pageSize = STORAGE_COLS * STORAGE_ROWS;
            const totalPages = Math.max(1, Math.ceil(inactive.length / pageSize));
            if (this._page >= totalPages) this._page = totalPages - 1;
            const averageLevel = inactive.length > 0
                  ? Math.round(inactive.reduce((total, pet) => total + pet.stats.level, 0) / inactive.length)
                  : 0;

            section.innerHTML = `
                  <div class="pet-sec-head">
                        <span class="pet-sec-title">收藏倉庫</span>
                        <span class="pet-sec-meta">${inactive.length} / ${this._pm.owned.length}</span>
                  </div>
                  <div class="pet-storage-summary atlas-card">
                        <div class="pet-storage-summary-main">
                              <span class="pet-storage-summary-label">待命補位</span>
                              <span class="pet-storage-summary-value">${inactive.length} 隻</span>
                        </div>
                        <div class="pet-storage-summary-meta">平均 Lv.${averageLevel || 0} · 每頁 ${pageSize} 格 · 不預先渲染空槽</div>
                  </div>
            `;

            const tabs = document.createElement('div');
            tabs.className = 'pet-storage-pages';
            if (totalPages > 1) {
                  for (let page = 0; page < Math.min(totalPages, 8); page += 1) {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = `pet-page-btn${page === this._page ? ' is-active' : ''}`;
                        btn.textContent = `${page + 1}`;
                        btn.addEventListener('click', () => {
                              this._page = page;
                              this._render();
                        });
                        tabs.appendChild(btn);
                  }
            }
            if (tabs.childElementCount > 0) section.appendChild(tabs);

            const grid = document.createElement('div');
            grid.className = 'pet-storage-grid';
            const start = this._page * pageSize;
            const pageItems = inactive.slice(start, start + pageSize);
            if (pageItems.length <= 0) {
                  const empty = document.createElement('div');
                  empty.className = 'pet-storage-empty';
                  empty.textContent = '目前沒有待命寵物';
                  section.appendChild(empty);
                  return section;
            }
            for (const pet of pageItems) {
                  const slot = document.createElement('button');
                  slot.type = 'button';
                  slot.className = `pet-storage-slot atlas-card${this._sel === pet ? ' is-selected' : ''}`;
                  slot.innerHTML = `
                        <img src="assets/icons/${SERIES_ICONS[pet.def.series]}" draggable="false" class="pet-storage-icon" alt="">
                        <span class="pet-storage-name">${this._escapeHtml(pet.displayName || pet.def.name)}</span>
                        <span class="pet-storage-level">Lv.${pet.stats.level} · ${this._escapeHtml(pet.def.series)}</span>
                        <span class="pet-storage-role">${pet.isDead ? '需復活' : '可補位 / 可培養'}</span>
                  `;
                  slot.addEventListener('click', () => {
                        this._sel = pet;
                        this._render();
                  });
                  grid.appendChild(slot);
            }
            section.appendChild(grid);
            if (pageItems.length < pageSize) {
                  const hint = document.createElement('div');
                  hint.className = 'pet-storage-hint atlas-card';
                  hint.textContent = '新取得的待命寵物會直接填入這裡；空白區改成摘要提示，不再預留一大片占位槽。';
                  section.appendChild(hint);
            }
            return section;
      }

      private _statCard(label: string, value: string): string {
            return `
                  <div class="pet-stat-card atlas-card">
                        <span class="pet-stat-label">${label}</span>
                        <span class="pet-stat-value">${value}</span>
                  </div>
            `;
      }

      private _slotLabel(slot: PetEquipSlot): string {
            switch (slot) {
                  case PetEquipSlot.Head: return '頭部';
                  case PetEquipSlot.Body: return '身軀';
                  case PetEquipSlot.Claw: return '武裝';
                  case PetEquipSlot.Ring: return '戒指';
                  case PetEquipSlot.Necklace: return '項鍊';
                  case PetEquipSlot.Boots: return '足具';
                  default: return slot;
            }
      }

      private _formatEquipSlotNote(slot: PetEquipSlot, unlocked: boolean, stats: { atk?: number; def?: number; hp?: number; spd?: number; str?: number; agi?: number } | null): string {
            if (!unlocked) return '完成對應解鎖條件後可裝備';
            if (stats) {
                  const bonusParts = [
                        stats.atk ? `ATK +${stats.atk}` : '',
                        stats.def ? `DEF +${stats.def}` : '',
                        stats.hp ? `HP +${stats.hp}` : '',
                        stats.spd ? `SPD +${stats.spd}` : '',
                        stats.str ? `STR +${stats.str}` : '',
                        stats.agi ? `AGI +${stats.agi}` : '',
                  ].filter(Boolean);
                  return bonusParts.join(' · ');
            }
            switch (slot) {
                  case PetEquipSlot.Head: return '適合放頭冠與防禦型裝備';
                  case PetEquipSlot.Body: return '優先補耐久與防禦';
                  case PetEquipSlot.Claw: return '提升攻擊或追加屬性';
                  case PetEquipSlot.Ring: return '補充攻擊或屬性加成';
                  case PetEquipSlot.Necklace: return '偏向續戰與耐久';
                  case PetEquipSlot.Boots: return '優先補速度與機動';
                  default: return '可裝備對應部位';
            }
      }

      private _formatEquipBonusSummary(bonus: { atk: number; def: number; hp: number; spd: number }): string {
            const tokens = [
                  bonus.atk ? `ATK +${bonus.atk}` : '',
                  bonus.def ? `DEF +${bonus.def}` : '',
                  bonus.hp ? `HP +${bonus.hp}` : '',
                  bonus.spd ? `SPD +${bonus.spd}` : '',
            ].filter(Boolean);
            return tokens.join(' · ') || '目前沒有裝備加成';
      }

      private _scheduleFit(): void {
            if (this._el.classList.contains('ui-panel-atlas')) return;
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            this._fitBodyScale();
            this._fitFrameId = requestAnimationFrame(() => this._fitBodyScale());
      }

      private _fitBodyScale(): void {
            if (this._el.classList.contains('ui-panel-atlas')) {
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

      private _seriesClass(pet: Pet): string {
            return `pet-series-${String(pet.def.series).toLowerCase()}`;
      }

      private _escapeHtml(value: string): string {
            return String(value ?? '')
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }
}

