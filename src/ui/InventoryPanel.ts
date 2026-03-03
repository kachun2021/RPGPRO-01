import type { Inventory, InventoryItem } from '../systems/Inventory';
import type { ItemRarity } from '../systems/DropTable';
import type { EquipmentSystem, EquipSlot, EquipDef } from '../systems/EquipmentSystem';
import { EQUIP_TEMPLATES } from '../systems/EquipmentSystem';
import type { EnhanceSystem } from '../systems/EnhanceSystem';

const RARITY_BORDER: Record<ItemRarity, string> = {
      common: 'rgba(160,160,160,0.35)',
      uncommon: 'rgba(60,130,255,0.6)',
      rare: 'rgba(155,80,220,0.6)',
      epic: 'rgba(232,201,106,0.7)',
      legendary: 'rgba(255,100,30,0.8)',
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
      private _tooltip!: HTMLDivElement;
      private _page = 0;
      private readonly SLOTS_PER_PAGE = 15;

      constructor(inventory: Inventory, equipSystem: EquipmentSystem, enhanceSystem: EnhanceSystem) {
            this._inventory = inventory;
            this._equipSystem = equipSystem;
            this._enhanceSystem = enhanceSystem;

            this._el = document.createElement('div');
            this._el.id = 'inventory-panel';
            this._el.className = 'sa-panel inv2-root';
            this._el.style.display = 'none';
            document.getElementById('ui-layer')?.appendChild(this._el);

            this._tooltip = document.createElement('div');
            this._tooltip.className = 'inv-tooltip';
            this._tooltip.style.display = 'none';
            this._el.appendChild(this._tooltip);

            inventory.onChange = () => { if (this._visible) this._render(); };
            equipSystem.onChange = () => { if (this._visible) this._render(); };
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
                        c.addEventListener('click', () => this._showEquipActions(eq, key));
                  } else {
                        c.innerHTML = `<span class="inv2-eq-ghost">${SLOT_ICONS[key]}</span>`;
                        c.addEventListener('click', () => this._showEquipList(key));
                        c.title = SLOT_LABELS[key];
                  }
                  return c;
            };

            // Row 0: bracelet | head | [3D CHAR] | necklace | bracelet2
            grid.appendChild(mkSlot('bracelet'));
            grid.appendChild(mkSlot('head'));
            const charCell = document.createElement('div');
            charCell.className = 'inv2-char-cell';
            charCell.style.gridRow = '1 / 4';
            charCell.style.gridColumn = '3';
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
                        slot.style.borderColor = RARITY_BORDER[item.rarity];
                        slot.innerHTML = `
                              <span class="inv2-item-icon">${item.icon}</span>
                              ${item.qty > 1 ? `<span class="inv2-item-qty">×${item.qty}</span>` : ''}
                        `;
                        slot.addEventListener('click', (e) => this._showTooltip(item, e));
                  }
                  itemGrid.appendChild(slot);
            }
            this._el.appendChild(itemGrid);

            // ===== PAGE NAV =====
            if (totalPages > 1 || allItems.length > this.SLOTS_PER_PAGE) {
                  const pageNav = document.createElement('div');
                  pageNav.className = 'inv2-page-nav';
                  const prevBtn = document.createElement('button');
                  prevBtn.className = 'inv2-page-btn';
                  prevBtn.textContent = '◀';
                  prevBtn.disabled = this._page <= 0;
                  prevBtn.addEventListener('click', () => { this._page--; this._render(); });
                  const nextBtn = document.createElement('button');
                  nextBtn.className = 'inv2-page-btn';
                  nextBtn.textContent = '▶';
                  nextBtn.disabled = this._page >= totalPages - 1;
                  nextBtn.addEventListener('click', () => { this._page++; this._render(); });
                  const label = document.createElement('span');
                  label.className = 'inv2-page-label';
                  label.textContent = `${this._page + 1} / ${totalPages}`;
                  pageNav.appendChild(prevBtn);
                  pageNav.appendChild(label);
                  pageNav.appendChild(nextBtn);
                  this._el.appendChild(pageNav);
            }

            // ===== GOLD BAR =====
            const goldBar = document.createElement('div');
            goldBar.className = 'inv2-gold-bar';
            goldBar.innerHTML = `💰 <span class="inv2-gold-val">${this._inventory.gold.toLocaleString()}</span> <span class="inv2-gold-label">GP</span>`;
            this._el.appendChild(goldBar);
      }

      private _showEquipActions(equip: EquipDef, slot: EquipSlot): void {
            const rate = this._enhanceSystem.getRate(equip.enhanceLevel);
            const cost = this._enhanceSystem.getCost(equip.enhanceLevel);

            this._tooltip.innerHTML = `
                  <div class="inv-tt-name" style="color:rgba(232,201,106,0.9)">${equip.icon} ${equip.name} +${equip.enhanceLevel}</div>
                  <div class="inv-tt-desc">ATK+${equip.stats.atk} DEF+${equip.stats.def} HP+${equip.stats.hp} MP+${equip.stats.mp}</div>
                  <div class="inv-tt-rarity">強化 +${equip.enhanceLevel + 1} 成功率: ${Math.round(rate * 100)}% | 費用: ${cost}💰</div>
                  <div class="inv-tt-actions">
                        <button class="inv-tt-btn inv2-enhance-btn btn-gold">⬆️ 強化</button>
                        <button class="inv-tt-btn inv2-unequip-btn">↩️ 卸下</button>
                  </div>
            `;
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = '50%';
            this._tooltip.style.top = '40%';
            this._tooltip.style.transform = 'translate(-50%, -50%)';

            this._tooltip.querySelector('.inv2-enhance-btn')?.addEventListener('click', () => {
                  if (this._inventory.gold < cost) {
                        console.log('[Enhance] Not enough gold');
                        return;
                  }
                  const result = this._enhanceSystem.enhance(equip);
                  console.log(`[Enhance] ${result.success ? '✅ Success' : '❌ Failed'} → +${result.newLevel}`);
                  this._tooltip.style.display = 'none';
                  this._render();
            });

            this._tooltip.querySelector('.inv2-unequip-btn')?.addEventListener('click', () => {
                  const removed = this._equipSystem.unequip(slot);
                  // Return unequipped item to inventory
                  if (removed) {
                        this._inventory.addItem({
                              itemId: removed.id, name: removed.name,
                              type: 'equipment' as any, rarity: removed.rarity,
                              qty: 1, icon: removed.icon,
                              description: `ATK+${removed.stats.atk} DEF+${removed.stats.def} HP+${removed.stats.hp} MP+${removed.stats.mp}`,
                        });
                  }
                  this._tooltip.style.display = 'none';
                  this._render();
            });

            this._bindOutsideClose();
      }

      private _showEquipList(slot: EquipSlot): void {
            const available = EQUIP_TEMPLATES.filter(t => t.slot === slot);
            if (available.length === 0) return;

            this._tooltip.innerHTML = `
                  <div class="inv-tt-name">選擇裝備 (${SLOT_LABELS[slot]})</div>
                  ${available.map(t => `
                        <div class="eq-equip-row" data-id="${t.id}">
                              <span>${t.icon} ${t.name}</span>
                              <span style="color:rgba(200,195,185,0.4)">ATK+${t.stats.atk} DEF+${t.stats.def}</span>
                        </div>
                  `).join('')}
            `;
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = '50%';
            this._tooltip.style.top = '40%';
            this._tooltip.style.transform = 'translate(-50%, -50%)';

            this._tooltip.querySelectorAll('.eq-equip-row').forEach(row => {
                  row.addEventListener('click', () => {
                        const id = (row as HTMLElement).dataset.id!;
                        const tmpl = EQUIP_TEMPLATES.find(t => t.id === id);
                        if (tmpl) {
                              this._equipSystem.equip({ ...tmpl, enhanceLevel: 0 });
                        }
                        this._tooltip.style.display = 'none';
                        this._render();
                  });
            });

            this._bindOutsideClose();
      }

      private _showTooltip(item: InventoryItem, e: MouseEvent): void {
            const rarityName: Record<ItemRarity, string> = {
                  common: '普通', uncommon: '優良', rare: '稀有', epic: '史詩', legendary: '傳說',
            };
            this._tooltip.innerHTML = `
                  <div class="inv-tt-name" style="color:${RARITY_BORDER[item.rarity]}">${item.icon} ${item.name}</div>
                  <div class="inv-tt-rarity">${rarityName[item.rarity]}</div>
                  <div class="inv-tt-desc">${item.description}</div>
                  <div class="inv-tt-qty">數量: ${item.qty}</div>
                  <div class="inv-tt-actions">
                        <button class="inv-tt-btn inv-use-btn">使用</button>
                        <button class="inv-tt-btn inv-discard-btn">丟棄</button>
                  </div>
            `;
            this._tooltip.style.display = 'block';
            const rect = this._el.getBoundingClientRect();
            const x = Math.min(e.clientX - rect.left + 8, rect.width - 180);
            const y = Math.min(e.clientY - rect.top + 8, rect.height - 140);
            this._tooltip.style.left = x + 'px';
            this._tooltip.style.top = y + 'px';
            this._tooltip.style.transform = 'none';

            this._tooltip.querySelector('.inv-use-btn')?.addEventListener('click', () => {
                  this._inventory.removeItem(item.itemId, 1);
                  this._tooltip.style.display = 'none';
            });
            this._tooltip.querySelector('.inv-discard-btn')?.addEventListener('click', () => {
                  this._inventory.removeItem(item.itemId, item.qty);
                  this._tooltip.style.display = 'none';
            });

            this._bindOutsideClose();
      }

      private _bindOutsideClose(): void {
            setTimeout(() => {
                  const close = (ev: MouseEvent) => {
                        if (!this._tooltip.contains(ev.target as Node)) {
                              this._tooltip.style.display = 'none';
                              document.removeEventListener('click', close);
                        }
                  };
                  document.addEventListener('click', close);
            }, 10);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._render(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; this._tooltip.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
