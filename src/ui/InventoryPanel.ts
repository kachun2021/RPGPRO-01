import type { Inventory, InventoryItem } from '../systems/Inventory';
import type { ItemRarity } from '../systems/DropTable';
import type { EquipmentSystem, EquipSlot, EquipDef } from '../systems/EquipmentSystem';
import { EQUIP_TEMPLATES } from '../systems/EquipmentSystem';
import type { EnhanceSystem } from '../systems/EnhanceSystem';
import type { PlayerStats } from '../entities/Player';
import { createPanelHeader } from './layout/PanelHeader';
import { buildDebugSummary, collectVisibleButtonLabels } from './layout/PanelDebugState';

const RARITY_CLASS: Record<ItemRarity, string> = {
      common: 'inv2-rarity-common',
      uncommon: 'inv2-rarity-uncommon',
      rare: 'inv2-rarity-rare',
      epic: 'inv2-rarity-epic',
      legendary: 'inv2-rarity-legendary',
};

const SLOT_LABELS: Record<EquipSlot, string> = {
      head: '頭', armor: '鎧', weapon: '武', boots: '靴',
      gloves: '手', ring: '戒', ring2: '戒', necklace: '項',
      bracelet: '鐲', bracelet2: '鐲',
};

const SLOT_MARKS: Record<EquipSlot, string> = {
      head: '頭', armor: '鎧', weapon: '武',
      boots: '靴', gloves: '手', ring: '戒',
      ring2: '戒II', necklace: '項', bracelet: '鐲',
      bracelet2: '鐲II',
};

const EQUIP_SLOT_ORDER: EquipSlot[] = [
      'weapon', 'head',
      'armor', 'necklace',
      'gloves', 'ring',
      'boots', 'ring2',
      'bracelet', 'bracelet2',
];

type Tab = 'equipment' | 'consumable' | 'material' | 'quest';
const TAB_LABELS: Array<{ id: Tab; label: string; emptyTitle: string; emptyText: string }> = [
      { id: 'equipment', label: '裝備', emptyTitle: '目前沒有備用裝備', emptyText: '先去狩獵或商店補齊武器與防具，再回來調整配裝。' },
      { id: 'consumable', label: '消耗', emptyTitle: '消耗品還沒入庫', emptyText: '藥水、捲軸與補給品會集中在這裡，方便戰鬥前快速整理。' },
      { id: 'material', label: '材料', emptyTitle: '材料欄目前是空的', emptyText: '分解、採集與掉落素材會在這裡累積，之後可用於製作與強化。' },
      { id: 'quest', label: '任務', emptyTitle: '尚未持有任務道具', emptyText: '與 NPC 對話或推進主線後，任務相關道具會顯示在這一頁。' },
];

const EQUIP_LEFT_COLUMN: EquipSlot[] = ['weapon', 'head', 'armor', 'gloves', 'boots'];
const EQUIP_RIGHT_COLUMN: EquipSlot[] = ['necklace', 'ring', 'ring2', 'bracelet', 'bracelet2'];

/**
 * InventoryPanel — Combined Equipment + Items (庫存).
 * Top: 8 equip slots around character preview.
 * Bottom: tabbed item grid + gold counter.
 */
export class InventoryPanel {
      readonly panelId = 'bag';
      private _el: HTMLDivElement;
      private _visible = false;
      private _currentTab: Tab = 'equipment';
      private _inventory: Inventory;
      private _equipSystem: EquipmentSystem;
      private _enhanceSystem: EnhanceSystem;
      private _playerStats: PlayerStats;
      private _tooltip!: HTMLDivElement;
      private _page = 0;
      private _disposeInventoryListener: (() => void) | null = null;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._render();
      };

      constructor(inventory: Inventory, equipSystem: EquipmentSystem, enhanceSystem: EnhanceSystem, playerStats: PlayerStats) {
            this._inventory = inventory;
            this._equipSystem = equipSystem;
            this._enhanceSystem = enhanceSystem;
            this._playerStats = playerStats;

            this._el = document.createElement('div');
            this._el.id = 'inventory-panel';
            this._el.className = 'sa-panel inv2-root ui-panel-atlas';
            document.getElementById('ui-layer')?.appendChild(this._el);

            this._tooltip = document.createElement('div');
            this._tooltip.className = 'inv-tooltip';
            this._el.appendChild(this._tooltip);

            this._disposeInventoryListener = inventory.subscribe(() => {
                  if (this._visible) this._render();
            });
            equipSystem.onChange = () => { if (this._visible) this._render(); };
            window.addEventListener('resize', this._onResize);
      }

      get isVisible(): boolean { return this._visible; }

      getDebugState() {
            return {
                  activeTab: this._currentTab,
                  visiblePrimaryActions: collectVisibleButtonLabels(this._el, 4),
                  keyDataSummary: buildDebugSummary({
                        page: this._page + 1,
                        gold: this._inventory.gold,
                        tabCount: this._inventory.getByTab(this._currentTab).length,
                        equipped: EQUIP_SLOT_ORDER.reduce((count, slot) => count + (this._equipSystem.getSlot(slot) ? 1 : 0), 0),
                  }),
            };
      }

      /** Show floating feedback text */
      private _showFeedback(msg: string, tone: 'success' | 'error' | 'info' | 'gold'): void {
            const el = document.createElement('div');
            el.className = 'pickup-text';
            el.classList.add(`pickup-text--${tone}`);
            el.textContent = msg;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 2000);
      }

      private _render(): void {
            this._syncResponsiveMode();
            const ttSaved = this._tooltip;
            this._el.innerHTML = '';
            this._el.appendChild(ttSaved);

            const { root: title } = createPanelHeader({
                  icon: 'bag',
                  kicker: 'Field Loadout',
                  title: '裝備與背包',
                  subtitle: '主裝備、消耗補給、素材與任務道具一頁整理',
                  summaryText: `收納 ${this._inventory.count} 項`,
                  summaryClassName: 'inv2-header-pill',
                  closeLabel: '關閉背包',
                  onClose: () => this.hide(),
            });
            this._el.appendChild(title);

            const panelMain = document.createElement('div');
            panelMain.className = 'inv2-main';

            const top = document.createElement('section');
            top.className = 'inv2-top';
            const tabCounts = {
                  equipment: this._inventory.getByTab('equipment').length,
                  consumable: this._inventory.getByTab('consumable').length,
                  material: this._inventory.getByTab('material').length,
                  quest: this._inventory.getByTab('quest').length,
            } satisfies Record<Tab, number>;

            const mkSlot = (key: EquipSlot): HTMLButtonElement => {
                  const c = document.createElement('button');
                  c.type = 'button';
                  c.className = 'inv2-eq-slot';
                  c.title = SLOT_LABELS[key];
                  const eq = this._equipSystem.getSlot(key);
                  if (eq) {
                        c.classList.add('inv2-eq-filled', RARITY_CLASS[eq.rarity]);
                        c.innerHTML = `
                              <span class="inv2-slot-badge">${SLOT_MARKS[key]}</span>
                              <span class="inv2-eq-copy">
                                    <span class="inv2-eq-title">${SLOT_LABELS[key]}</span>
                                    <span class="inv2-eq-item">${this._escapeHtml(eq.name)}</span>
                              </span>
                              <span class="inv2-eq-state">${eq.enhanceLevel > 0 ? `+${eq.enhanceLevel}` : '已裝備'}</span>
                        `;
                        c.addEventListener('click', (e) => { e.stopPropagation(); this._showEquipActions(eq, key); });
                  } else {
                        c.innerHTML = `
                              <span class="inv2-slot-badge is-empty">${SLOT_MARKS[key]}</span>
                              <span class="inv2-eq-copy">
                                    <span class="inv2-eq-title">${SLOT_LABELS[key]}</span>
                                    <span class="inv2-eq-item is-empty">點擊裝備</span>
                              </span>
                              <span class="inv2-eq-state is-empty">待裝備</span>
                        `;
                        c.addEventListener('click', (e) => { e.stopPropagation(); this._showEquipList(key); });
                  }
                  return c;
            };

            const statsTotal = this._equipSystem.getTotalStats();
            const setBonuses = this._equipSystem.getSetBonuses();
            const equippedCount = EQUIP_SLOT_ORDER.reduce((count, slot) => count + (this._equipSystem.getSlot(slot) ? 1 : 0), 0);
            const activeSetText = setBonuses.length > 0
                  ? setBonuses.map((bonus) => `${bonus.set.name} ${bonus.count} 件`).join(' · ')
                  : '尚未湊齊套裝效果';

            const equipCol = document.createElement('section');
            equipCol.className = 'inv2-top-panel inv2-top-panel-board atlas-card';
            equipCol.innerHTML = `
                  <div class="inv2-sec-title">主裝備板</div>
                  <div class="inv2-board">
                        <div class="inv2-board-column inv2-board-column-left"></div>
                        <div class="inv2-board-core">
                              <div class="inv2-board-avatar">${this._playerMark()}</div>
                              <div class="inv2-board-level">Lv.${Math.max(1, Math.floor(this._playerStats.level || 1))}</div>
                              <div class="inv2-board-title">主裝備板</div>
                              <div class="inv2-board-note">已裝備 ${equippedCount}/${EQUIP_SLOT_ORDER.length} 格 · ${this._escapeHtml(activeSetText)}</div>
                              <div class="inv2-board-stats">
                                    <div class="inv2-board-stat"><span>攻擊</span><strong>${statsTotal.atk}</strong></div>
                                    <div class="inv2-board-stat"><span>防禦</span><strong>${statsTotal.def}</strong></div>
                                    <div class="inv2-board-stat"><span>HP</span><strong>${this._playerStats.hp}/${this._playerStats.maxHp}</strong></div>
                                    <div class="inv2-board-stat"><span>MP</span><strong>${this._playerStats.mp}/${this._playerStats.maxMp}</strong></div>
                              </div>
                        </div>
                        <div class="inv2-board-column inv2-board-column-right"></div>
                  </div>
            `;
            const leftColumn = equipCol.querySelector('.inv2-board-column-left') as HTMLDivElement | null;
            const rightColumn = equipCol.querySelector('.inv2-board-column-right') as HTMLDivElement | null;
            EQUIP_LEFT_COLUMN.forEach((slot) => leftColumn?.appendChild(mkSlot(slot)));
            EQUIP_RIGHT_COLUMN.forEach((slot) => rightColumn?.appendChild(mkSlot(slot)));
            top.appendChild(equipCol);

            const quickCol = document.createElement('section');
            quickCol.className = 'inv2-top-panel inv2-top-panel-quick atlas-card';
            quickCol.innerHTML = `
                  <div class="inv2-sec-title">裝備概覽</div>
                  <div class="inv2-quick-grid">
                        <div class="inv2-quick-row"><span>備用裝備</span><b>${tabCounts.equipment}</b></div>
                        <div class="inv2-quick-row"><span>消耗品</span><b>${tabCounts.consumable}</b></div>
                        <div class="inv2-quick-row"><span>材料</span><b>${tabCounts.material}</b></div>
                        <div class="inv2-quick-row"><span>任務道具</span><b>${tabCounts.quest}</b></div>
                  </div>
                  <div class="inv2-side-block">
                        <div class="inv2-side-title">整理重點</div>
                        <div class="inv2-side-copy">${setBonuses.length > 0
                              ? this._escapeHtml(setBonuses.map((bonus) => `${bonus.set.name}: ${bonus.activeEffects.join(' / ')}`).join(' · '))
                              : '先把主武器、防具與飾品補齊，再追求套裝加成。'}
                        </div>
                  </div>
            `;
            top.appendChild(quickCol);

            panelMain.appendChild(top);

            const bottom = document.createElement('section');
            bottom.className = 'inv2-bottom';

            // ===== ITEM TABS =====
            const tabBar = document.createElement('div');
            tabBar.className = 'inv-tabs';
            for (const t of TAB_LABELS) {
                  const btn = document.createElement('button');
                  btn.className = 'inv-tab';
                  if (t.id === this._currentTab) btn.classList.add('inv-tab-active');
                  btn.innerHTML = `
                        <span class="inv-tab-label">${t.label}</span>
                        <span class="inv-tab-count">${tabCounts[t.id]}</span>
                  `;
                  btn.addEventListener('click', () => {
                        this._currentTab = t.id;
                        this._page = 0;
                        this._render();
                  });
                  tabBar.appendChild(btn);
            }
            bottom.appendChild(tabBar);

            // ===== ITEM GRID (adaptive columns, paginated) =====
            const allItems = this._inventory.getByTab(this._currentTab);
            const slotsPerPage = this._getSlotsPerPage();
            const totalPages = Math.max(1, Math.ceil(allItems.length / slotsPerPage));
            if (this._page >= totalPages) this._page = totalPages - 1;
            const pageStart = this._page * slotsPerPage;
            const items = allItems.slice(pageStart, pageStart + slotsPerPage);
            const itemColumns = this._getItemColumns();
            const renderSlots = this._getRenderSlotCount(items.length, itemColumns, slotsPerPage);

            const itemGrid = document.createElement('div');
            itemGrid.className = 'inv2-item-grid';
            itemGrid.style.setProperty('--inv2-item-cols', String(itemColumns));
            if (allItems.length === 0) {
                  itemGrid.classList.add('is-empty');
                  const currentTab = TAB_LABELS.find((tab) => tab.id === this._currentTab);
                  itemGrid.innerHTML = `
                        <div class="inv2-empty-state">
                              <span class="inv2-empty-kicker">空空如也</span>
                              <strong>${this._escapeHtml(currentTab?.emptyTitle ?? '目前沒有物品')}</strong>
                              <p>${this._escapeHtml(currentTab?.emptyText ?? '回到世界探索後再回來整理。')}</p>
                        </div>
                  `;
            } else {
                  for (let i = 0; i < renderSlots; i++) {
                        const slot = document.createElement('div');
                        slot.className = 'inv2-item-slot';
                        if (i < items.length) {
                              const item = items[i];
                              slot.classList.add('inv2-item-filled');
                              slot.classList.add(RARITY_CLASS[item.rarity]);
                              slot.innerHTML = `
                                    <span class="inv2-item-icon">${item.icon}</span>
                                    <span class="inv2-item-name">${item.name}</span>
                                    ${item.qty > 1 ? `<span class="inv2-item-qty">×${item.qty}</span>` : ''}
                              `;
                              slot.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    this._showTooltip(item, e);
                              });
                        }
                        itemGrid.appendChild(slot);
                  }
            }
            bottom.appendChild(itemGrid);

            const bottomBar = document.createElement('div');
            bottomBar.className = 'inv2-bottom-bar';

            const summary = document.createElement('div');
            summary.className = 'inv2-bag-summary';
            summary.textContent = `${TAB_LABELS.find((t) => t.id === this._currentTab)?.label ?? ''} ${allItems.length} 項`;

            const pageNav = document.createElement('div');
            pageNav.className = 'inv2-page-nav';
            const prevBtn = document.createElement('button');
            prevBtn.className = 'inv2-page-btn';
            prevBtn.textContent = '\u25c0';
            prevBtn.disabled = this._page <= 0;
            prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this._page--; this._render(); });
            const nextBtn = document.createElement('button');
            nextBtn.className = 'inv2-page-btn';
            nextBtn.textContent = '\u25b6';
            nextBtn.disabled = this._page >= totalPages - 1;
            nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this._page++; this._render(); });
            const label = document.createElement('span');
            label.className = 'inv2-page-label';
            label.textContent = `${this._page + 1} / ${totalPages}`;
            pageNav.appendChild(prevBtn);
            pageNav.appendChild(label);
            pageNav.appendChild(nextBtn);
            const gold = document.createElement('div');
            gold.className = 'inv2-gold-bar';
            gold.innerHTML = `<span class="inv2-gold-label">GP</span><span class="inv2-gold-val">${this._inventory.gold.toLocaleString()}</span>`;

            bottomBar.appendChild(summary);
            bottomBar.appendChild(pageNav);
            bottomBar.appendChild(gold);
            bottom.appendChild(bottomBar);

            panelMain.appendChild(bottom);
            this._el.appendChild(panelMain);
      }

      private _isPhoneLandscapeMode(): boolean {
            const width = window.innerWidth || this._el.clientWidth || 0;
            const height = window.innerHeight || 0;
            return width > height && width <= 1280 && height <= 620;
      }

      private _isCompactLandscapeMode(): boolean {
            const width = window.innerWidth || this._el.clientWidth || 0;
            const height = window.innerHeight || 0;
            return width > height && height <= 430;
      }

      private _syncResponsiveMode(): void {
            this._el.classList.toggle('is-phone-landscape', this._isPhoneLandscapeMode());
            this._el.classList.toggle('is-compact-landscape', this._isCompactLandscapeMode());
      }

      private _getSlotsPerPage(): number {
            if (!this._isPhoneLandscapeMode()) return 24;
            return this._isCompactLandscapeMode() ? 16 : 18;
      }

      private _getItemColumns(): number {
            if (!this._isPhoneLandscapeMode()) return 8;
            return this._isCompactLandscapeMode() ? 8 : 9;
      }

      private _getRenderSlotCount(itemCount: number, columns: number, maxSlots: number): number {
            const safeColumns = Math.max(1, columns);
            const minSlots = Math.min(maxSlots, safeColumns * 2);
            if (itemCount <= 0) return minSlots;
            const neededRows = Math.ceil(itemCount / safeColumns);
            const visibleRows = Math.max(2, Math.min(neededRows, Math.ceil(maxSlots / safeColumns)));
            return Math.min(maxSlots, visibleRows * safeColumns);
      }

      private _hideTooltip(): void {
            this._tooltip.classList.remove('is-visible', 'is-centered', 'is-follow-pointer');
      }

      private _showEquipActions(equip: EquipDef, slot: EquipSlot): void {
            const rate = this._enhanceSystem.getRate(equip.enhanceLevel);
            const cost = this._enhanceSystem.getCost(equip.enhanceLevel);
            const hasProtect = this._inventory.hasItem('protect_scroll');
            const setInfo = equip.setId ? `<div class="inv-tt-set">套裝: ${equip.setId === 'boss_set' ? 'Boss套裝' : 'PVP套裝'}</div>` : '';

            this._tooltip.innerHTML = `
                  <div class="inv-tt-name inv-tt-name-equip">${equip.icon} ${equip.name} +${equip.enhanceLevel}</div>
                  <div class="inv-tt-desc">ATK+${equip.stats.atk} DEF+${equip.stats.def} HP+${equip.stats.hp} MP+${equip.stats.mp}</div>
                  ${setInfo}
                  <div class="inv-tt-rarity">強化 +${equip.enhanceLevel + 1} 成功率: ${Math.round(rate * 100)}% | 費用: ${cost}💰</div>
                  <div class="inv-tt-protect">
                        <label><input type="checkbox" id="enh-protect" ${hasProtect ? '' : 'disabled'}>
                        使用保護卷${hasProtect ? '' : ' (無)'}</label>
                  </div>
                  <div class="inv-tt-actions">
                        <button class="inv-tt-btn inv2-enhance-btn btn-gold"${equip.enhanceLevel >= 10 ? ' disabled' : ''}>強化</button>
                        <button class="inv-tt-btn inv2-unequip-btn">卸下</button>
                  </div>
            `;
            this._tooltip.classList.remove('is-follow-pointer');
            this._tooltip.classList.add('is-visible', 'is-centered');

            this._tooltip.querySelector('.inv2-enhance-btn')?.addEventListener('click', () => {
                  if (!this._inventory.spendGold(cost)) {
                        this._showFeedback('金幣不足', 'error');
                        return;
                  }
                  const useProtect = (this._tooltip.querySelector('#enh-protect') as HTMLInputElement)?.checked ?? false;
                  if (useProtect) this._inventory.removeItem('protect_scroll', 1);
                  const result = this._enhanceSystem.enhance(equip, useProtect);
                  if (result.success) {
                        this._showFeedback(`強化成功 +${result.newLevel}`, 'success');
                        this._el.classList.add('enhance-flash');
                        setTimeout(() => this._el.classList.remove('enhance-flash'), 400);
                  } else {
                        this._showFeedback(
                              result.protected ? `保護生效，維持 +${result.newLevel}` : `強化失敗，降至 +${result.newLevel}`,
                              result.protected ? 'info' : 'error',
                        );
                        this._el.classList.add('enhance-shake');
                        setTimeout(() => this._el.classList.remove('enhance-shake'), 400);
                  }
                  // Re-open tooltip with updated stats (allow continuous enhance)
                  this._hideTooltip();
                  this._render();
                  setTimeout(() => this._showEquipActions(equip, slot), 50);
            });

            this._tooltip.querySelector('.inv2-unequip-btn')?.addEventListener('click', () => {
                  const removed = this._equipSystem.unequip(slot);
                  if (removed) {
                        this._inventory.addItem({
                              itemId: removed.id, name: removed.name,
                              type: 'equipment' as any, rarity: removed.rarity,
                              qty: 1, icon: removed.icon,
                              description: `ATK+${removed.stats.atk} DEF+${removed.stats.def} HP+${removed.stats.hp} MP+${removed.stats.mp}`,
                        });
                  }
                  this._hideTooltip();
                  this._render();
            });

            this._bindOutsideClose();
      }

      private _showEquipList(slot: EquipSlot): void {
            // Map bracelet2/ring2 to base slot for matching
            const baseSlot = slot.replace(/2$/, '') as EquipSlot;

            // Find equipment items in inventory that match this slot
            const invItems = this._inventory.getByTab('equipment').filter(i => {
                  const tmpl = EQUIP_TEMPLATES.find(t => t.id === i.itemId);
                  return tmpl && (tmpl.slot === baseSlot || tmpl.slot === slot);
            });

            if (invItems.length === 0) return;

            this._tooltip.innerHTML = `
                  <div class="inv-tt-name">選擇裝備 (${SLOT_LABELS[slot]})</div>
                  ${invItems.map(i => {
                  const tmpl = EQUIP_TEMPLATES.find(t => t.id === i.itemId)!;
                  return `
                              <div class="eq-equip-row" data-id="${i.itemId}">
                                    <span>${i.icon} ${i.name}</span>
                                    <span class="inv-eq-row-stats">ATK+${tmpl.stats.atk} DEF+${tmpl.stats.def}</span>
                              </div>
                        `;
            }).join('')}
            `;
            this._tooltip.classList.remove('is-follow-pointer');
            this._tooltip.classList.add('is-visible', 'is-centered');

            this._tooltip.querySelectorAll('.eq-equip-row').forEach(row => {
                  row.addEventListener('click', () => {
                        const id = (row as HTMLElement).dataset.id!;
                        const tmpl = EQUIP_TEMPLATES.find(t => t.id === id);
                        if (tmpl) {
                              const prev = this._equipSystem.equip({ ...tmpl, slot, enhanceLevel: 0 });
                              this._inventory.removeItem(id, 1);
                              if (prev) {
                                    this._inventory.addItem({
                                          itemId: prev.id, name: prev.name,
                                          type: 'equipment' as any, rarity: prev.rarity,
                                          qty: 1, icon: prev.icon,
                                          description: `ATK+${prev.stats.atk} DEF+${prev.stats.def} HP+${prev.stats.hp} MP+${prev.stats.mp}`,
                                    });
                              }
                        }
                        this._hideTooltip();
                        this._render();
                  });
            });

            this._bindOutsideClose();
      }

      private _showTooltip(item: InventoryItem, e: MouseEvent): void {
            const rarityName: Record<ItemRarity, string> = {
                  common: '普通', uncommon: '優良', rare: '稀有', epic: '史詩', legendary: '傳說',
            };
            const isEquipment = item.type === 'equipment';
            const isConsumable = item.type === 'consumable';

            // Build action buttons based on type
            let actionsHtml = '';
            if (isEquipment) {
                  actionsHtml = `
                        <button class="inv-tt-btn btn-gold inv-equip-btn">裝備</button>
                        <button class="inv-tt-btn inv-decompose-btn">分解</button>
                        <button class="inv-tt-btn inv-discard-btn">丟棄</button>
                  `;
            } else if (isConsumable) {
                  actionsHtml = `
                        <button class="inv-tt-btn btn-gold inv-use-btn">使用</button>
                        <button class="inv-tt-btn inv-discard-btn">丟棄</button>
                  `;
            } else {
                  actionsHtml = `
                        <button class="inv-tt-btn inv-discard-btn">丟棄</button>
                  `;
            }

            this._tooltip.innerHTML = `
                  <div class="inv-tt-name inv-tt-name-rarity">${item.icon} ${item.name}</div>
                  <div class="inv-tt-rarity">${rarityName[item.rarity]}</div>
                  <div class="inv-tt-desc">${item.description}</div>
                  <div class="inv-tt-qty">數量: ${item.qty}</div>
                  <div class="inv-tt-actions">
                        ${actionsHtml}
                  </div>
            `;
            const rect = this._el.getBoundingClientRect();
            const x = Math.min(e.clientX - rect.left + 8, rect.width - 180);
            const y = Math.min(e.clientY - rect.top + 8, rect.height - 140);
            this._tooltip.classList.remove('is-centered');
            this._tooltip.classList.add('is-visible', 'is-follow-pointer');
            this._tooltip.style.setProperty('--inv-tt-x', `${x}px`);
            this._tooltip.style.setProperty('--inv-tt-y', `${y}px`);

            // Equip button (equipment items only)
            this._tooltip.querySelector('.inv-equip-btn')?.addEventListener('click', () => {
                  const tmpl = EQUIP_TEMPLATES.find(t => t.id === item.itemId);
                  if (tmpl) {
                        const equipDef: EquipDef = { ...tmpl, enhanceLevel: 0 };
                        const prev = this._equipSystem.equip(equipDef);
                        this._inventory.removeItem(item.itemId, 1);
                        if (prev) {
                              this._inventory.addItem({
                                    itemId: prev.id, name: prev.name,
                                    type: 'equipment' as any, rarity: prev.rarity,
                                    qty: 1, icon: prev.icon,
                                    description: `ATK+${prev.stats.atk} DEF+${prev.stats.def} HP+${prev.stats.hp} MP+${prev.stats.mp}`,
                              });
                        }
                  }
                  this._hideTooltip();
                  this._render();
            });

            // Use consumable
            this._tooltip.querySelector('.inv-use-btn')?.addEventListener('click', () => {
                  const effect = this._inventory.useItem(item.itemId, this._playerStats);
                  if (effect) {
                        this._showFeedback(effect, 'success');
                  }
                  this._hideTooltip();
                  this._render();
            });

            // Decompose equipment
            this._tooltip.querySelector('.inv-decompose-btn')?.addEventListener('click', () => {
                  const result = this._inventory.decomposeEquipment(item.itemId);
                  if (result) {
                        this._showFeedback(`分解獲得 ${result.goldGained} GP + ${result.materialName}`, 'gold');
                  }
                  this._hideTooltip();
                  this._render();
            });

            // Discard
            this._tooltip.querySelector('.inv-discard-btn')?.addEventListener('click', () => {
                  this._inventory.removeItem(item.itemId, item.qty);
                  this._hideTooltip();
                  this._render();
            });

            this._bindOutsideClose();
      }

      private _bindOutsideClose(): void {
            // Use mousedown (not click) with 200ms delay to prevent immediate self-close
            setTimeout(() => {
                  const close = (ev: MouseEvent) => {
                        if (!this._tooltip.contains(ev.target as Node)) {
                              this._hideTooltip();
                              document.removeEventListener('mousedown', close);
                        }
                  };
                  document.addEventListener('mousedown', close);
            }, 200);
      }

      private _playerMark(): string {
            const level = Math.max(1, Math.floor(this._playerStats.level || 1));
            return `L${Math.min(level, 99).toString().padStart(2, '0')}`;
      }

      private _escapeHtml(value: string): string {
            return value
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void {
            this._visible = true;
            this._syncResponsiveMode();
            this._el.classList.add('is-open');
            this._render();
      }
      hide(): void {
            this._visible = false;
            this._el.classList.remove('is-open', 'is-scaled', 'is-phone-landscape');
            this._hideTooltip();
      }
      dispose(): void {
            this._disposeInventoryListener?.();
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}

