import type { Inventory, InventoryItem } from '../systems/Inventory';
import type { ItemRarity } from '../systems/DropTable';
import type { EquipmentSystem, EquipSlot, EquipDef } from '../systems/EquipmentSystem';
import { EQUIP_TEMPLATES } from '../systems/EquipmentSystem';
import type { EnhanceSystem } from '../systems/EnhanceSystem';
import type { PlayerStats } from '../entities/Player';

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

const SLOT_ICONS: Record<EquipSlot, string> = {
      head: '🪖', armor: '🛡️', weapon: '⚔️', boots: '👢',
      gloves: '🧤', ring: '💎', ring2: '💎', necklace: '📿',
      bracelet: '⭕', bracelet2: '⭕',
};

/**
 * Layout matching Image 2 reference (CHM 庫存):
 * 4 rows × 3 cols — character preview in center
 */
const EQUIP_LAYOUT: (EquipSlot | null)[][] = [
      ['head', null, 'necklace'],
      ['weapon', null, 'armor'],
      ['gloves', null, 'ring'],
      ['bracelet', null, 'boots'],
];

type Tab = 'equipment' | 'consumable' | 'material' | 'quest';
const TAB_LABELS: { id: Tab; label: string; icon: string }[] = [
      { id: 'equipment', label: '裝備', icon: '🛡️' },
      { id: 'consumable', label: '消耗', icon: '🧪' },
      { id: 'material', label: '材料', icon: '⛏️' },
      { id: 'quest', label: '任務', icon: '📜' },
];

/**
 * InventoryPanel — Combined Equipment + Items (庫存).
 * Top: 8 equip slots around character preview.
 * Bottom: tabbed item grid + gold counter.
 */
export class InventoryPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _currentTab: Tab = 'equipment';
      private _inventory: Inventory;
      private _equipSystem: EquipmentSystem;
      private _enhanceSystem: EnhanceSystem;
      private _playerStats: PlayerStats;
      private _tooltip!: HTMLDivElement;
      private _page = 0;
      private readonly SLOTS_PER_PAGE = 15;
      private _fitFrameId = 0;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._scheduleFit();
      };

      constructor(inventory: Inventory, equipSystem: EquipmentSystem, enhanceSystem: EnhanceSystem, playerStats: PlayerStats) {
            this._inventory = inventory;
            this._equipSystem = equipSystem;
            this._enhanceSystem = enhanceSystem;
            this._playerStats = playerStats;

            this._el = document.createElement('div');
            this._el.id = 'inventory-panel';
            this._el.className = 'sa-panel inv2-root';
            document.getElementById('ui-layer')?.appendChild(this._el);

            this._tooltip = document.createElement('div');
            this._tooltip.className = 'inv-tooltip';
            this._el.appendChild(this._tooltip);

            inventory.onChange = () => { if (this._visible) this._render(); };
            equipSystem.onChange = () => { if (this._visible) this._render(); };
            window.addEventListener('resize', this._onResize);
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
            const ttSaved = this._tooltip;
            this._el.innerHTML = '';
            this._el.appendChild(ttSaved);

            // Title
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = `🎒 庫存`;
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // ===== EQUIPMENT SECTION (5-col CHM layout) =====
            // Col0=bracelet  Col1=head/weapon/boots  Col2=3D preview  Col3=necklace/armor/gloves  Col4=ring
            const equipSection = document.createElement('div');
            equipSection.className = 'inv2-equip-section';

            // Stats summary bar
            const statsTotal = this._equipSystem.getTotalStats();
            const statsBar = document.createElement('div');
            statsBar.className = 'inv2-stats-bar';
            statsBar.innerHTML = `<span>⚔️${statsTotal.atk}</span> <span>🛡️${statsTotal.def}</span> <span>❤️${statsTotal.hp}</span> <span>💧${statsTotal.mp}</span>`;
            equipSection.appendChild(statsBar);

            const grid = document.createElement('div');
            grid.className = 'inv2-equip-grid';

            // Slot builder
            const mkSlot = (key: EquipSlot | null, locked = false) => {
                  const c = document.createElement('div');
                  c.className = 'inv2-eq-slot';
                  if (locked) {
                        c.classList.add('inv2-eq-locked');
                        c.innerHTML = `<span class="inv2-eq-x">✕</span>`;
                        return c;
                  }
                  if (!key) return c;
                  const eq = this._equipSystem.getSlot(key);
                  if (eq) {
                        c.classList.add('inv2-eq-filled');
                        c.innerHTML = `<span class="inv2-eq-icon">${eq.icon}</span>${eq.enhanceLevel > 0 ? `<span class="inv2-eq-enhance">+${eq.enhanceLevel}</span>` : ''}`;
                        c.addEventListener('click', (e) => { e.stopPropagation(); this._showEquipActions(eq, key); });
                  } else {
                        c.innerHTML = `<span class="inv2-eq-ghost">${SLOT_ICONS[key]}</span>`;
                        c.addEventListener('click', (e) => { e.stopPropagation(); this._showEquipList(key); });
                        c.title = SLOT_LABELS[key];
                  }
                  return c;
            };

            // Row 0: bracelet | head | [3D CHAR] | necklace | bracelet2
            grid.appendChild(mkSlot('bracelet'));
            grid.appendChild(mkSlot('head'));
            const charCell = document.createElement('div');
            charCell.className = 'inv2-char-cell inv2-char-cell-span';
            charCell.innerHTML = `<div class="inv2-char-preview">👤</div>`;
            grid.appendChild(charCell);
            grid.appendChild(mkSlot('necklace'));
            grid.appendChild(mkSlot('bracelet2'));

            // Row 1: ring | weapon | [spans] | armor | ring2
            grid.appendChild(mkSlot('ring'));
            grid.appendChild(mkSlot('weapon'));
            grid.appendChild(mkSlot('armor'));
            grid.appendChild(mkSlot('ring2'));

            // Row 2: X(locked) | boots | [spans] | gloves | X(locked)
            grid.appendChild(mkSlot(null, true));
            grid.appendChild(mkSlot('boots'));
            grid.appendChild(mkSlot('gloves'));
            grid.appendChild(mkSlot(null, true));

            equipSection.appendChild(grid);
            this._el.appendChild(equipSection);

            // ===== DIVIDER =====
            const divider = document.createElement('div');
            divider.className = 'inv2-divider';
            this._el.appendChild(divider);

            // ===== ITEM TABS =====
            const tabBar = document.createElement('div');
            tabBar.className = 'inv-tabs';
            for (const t of TAB_LABELS) {
                  const btn = document.createElement('button');
                  btn.className = 'inv-tab';
                  if (t.id === this._currentTab) btn.classList.add('inv-tab-active');
                  btn.textContent = `${t.icon} ${t.label}`;
                  btn.addEventListener('click', () => {
                        this._currentTab = t.id;
                        this._page = 0;
                        this._render();
                  });
                  tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);

            // ===== ITEM GRID (5 columns, paginated) =====
            const allItems = this._inventory.getByTab(this._currentTab);
            const totalPages = Math.max(1, Math.ceil(allItems.length / this.SLOTS_PER_PAGE));
            if (this._page >= totalPages) this._page = totalPages - 1;
            const pageStart = this._page * this.SLOTS_PER_PAGE;
            const items = allItems.slice(pageStart, pageStart + this.SLOTS_PER_PAGE);

            const itemGrid = document.createElement('div');
            itemGrid.className = 'inv2-item-grid';
            for (let i = 0; i < this.SLOTS_PER_PAGE; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'inv2-item-slot';
                  if (i < items.length) {
                        const item = items[i];
                        slot.classList.add('inv2-item-filled');
                        slot.classList.add(RARITY_CLASS[item.rarity]);
                        slot.innerHTML = `
                              <span class="inv2-item-icon">${item.icon}</span>
                              ${item.qty > 1 ? `<span class="inv2-item-qty">×${item.qty}</span>` : ''}
                        `;
                        slot.addEventListener('click', (e) => {
                              e.stopPropagation();
                              this._showTooltip(item, e);
                        });
                  }
                  itemGrid.appendChild(slot);
            }
            this._el.appendChild(itemGrid);

            // ===== PAGE NAV (always visible) =====
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
            this._el.appendChild(pageNav);

            // ===== SET BONUSES =====
            const setBonuses = this._equipSystem.getSetBonuses();
            if (setBonuses.length > 0) {
                  const setSection = document.createElement('div');
                  setSection.className = 'inv2-set-section';
                  for (const { set, count, activeEffects } of setBonuses) {
                        const setRow = document.createElement('div');
                        setRow.className = 'inv2-set-row';
                        setRow.innerHTML = `
                              <div class="inv2-set-name">🏅 ${set.name} <span class="inv2-set-count">(${count}件)</span></div>
                              ${activeEffects.map(e => `<div class="inv2-set-effect">✅ ${e}</div>`).join('')}
                              ${count < 2 ? `<div class="inv2-set-next">2件: ${set.pieces2}</div>` : ''}
                              ${count >= 2 && count < 4 ? `<div class="inv2-set-next">4件: ${set.pieces4}</div>` : ''}
                              ${count >= 4 && count < 6 ? `<div class="inv2-set-next">6件: ${set.pieces6}</div>` : ''}
                        `;
                        setSection.appendChild(setRow);
                  }
                  this._el.appendChild(setSection);
            }

            // ===== GOLD BAR =====
            const goldBar = document.createElement('div');
            goldBar.className = 'inv2-gold-bar';
            goldBar.innerHTML = `💰 <span class="inv2-gold-val">${this._inventory.gold.toLocaleString()}</span> <span class="inv2-gold-label">GP</span>`;
            this._el.appendChild(goldBar);
            this._scheduleFit();
      }

      private _scheduleFit(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            this._fitPanelScale();
            this._fitFrameId = requestAnimationFrame(() => this._fitPanelScale());
      }

      private _fitPanelScale(): void {
            this._el.style.setProperty('--inv2-panel-scale', '1');
            this._el.classList.remove('is-scaled');

            const vh = window.innerHeight || 0;
            const available = Math.max(0, Math.floor(vh * 0.88) - 6);
            if (available <= 0) return;

            const needed = this._el.scrollHeight;
            if (needed <= 0 || needed <= available) return;

            const scale = Math.max(0.55, Math.min(1, available / needed));
            this._el.style.setProperty('--inv2-panel-scale', String(scale));
            if (scale < 0.999) this._el.classList.add('is-scaled');
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
                        🛡️ 使用保護卷${hasProtect ? '' : ' (無)'}</label>
                  </div>
                  <div class="inv-tt-actions">
                        <button class="inv-tt-btn inv2-enhance-btn btn-gold"${equip.enhanceLevel >= 10 ? ' disabled' : ''}>⬆️ 強化</button>
                        <button class="inv-tt-btn inv2-unequip-btn">↩️ 卸下</button>
                  </div>
            `;
            this._tooltip.classList.remove('is-follow-pointer');
            this._tooltip.classList.add('is-visible', 'is-centered');

            this._tooltip.querySelector('.inv2-enhance-btn')?.addEventListener('click', () => {
                  if (!this._inventory.spendGold(cost)) {
                        this._showFeedback('❌ 金幣不足', 'error');
                        return;
                  }
                  const useProtect = (this._tooltip.querySelector('#enh-protect') as HTMLInputElement)?.checked ?? false;
                  if (useProtect) this._inventory.removeItem('protect_scroll', 1);
                  const result = this._enhanceSystem.enhance(equip, useProtect);
                  if (result.success) {
                        this._showFeedback(`✅ 強化成功！+${result.newLevel}`, 'success');
                        this._el.classList.add('enhance-flash');
                        setTimeout(() => this._el.classList.remove('enhance-flash'), 400);
                  } else {
                        this._showFeedback(
                              result.protected ? `🛡️ 保護生效！維持 +${result.newLevel}` : `❌ 強化失敗 → +${result.newLevel}`,
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
                        <button class="inv-tt-btn btn-gold inv-equip-btn">⚔️ 裝備</button>
                        <button class="inv-tt-btn inv-decompose-btn">🔨 分解</button>
                        <button class="inv-tt-btn inv-discard-btn">丟棄</button>
                  `;
            } else if (isConsumable) {
                  actionsHtml = `
                        <button class="inv-tt-btn btn-gold inv-use-btn">🧪 使用</button>
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
                        this._showFeedback(`✅ ${effect}`, 'success');
                  }
                  this._hideTooltip();
                  this._render();
            });

            // Decompose equipment
            this._tooltip.querySelector('.inv-decompose-btn')?.addEventListener('click', () => {
                  const result = this._inventory.decomposeEquipment(item.itemId);
                  if (result) {
                        this._showFeedback(`🔨 分解獲得 ${result.goldGained}💰 + ${result.materialName}`, 'gold');
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

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void {
            this._visible = true;
            this._el.classList.add('is-open');
            this._render();
      }
      hide(): void {
            this._visible = false;
            this._el.classList.remove('is-open', 'is-scaled');
            this._hideTooltip();
            this._el.style.setProperty('--inv2-panel-scale', '1');
      }
      dispose(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
