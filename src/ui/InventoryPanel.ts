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

const EQUIP_SLOT_ORDER: EquipSlot[] = [
      'weapon', 'head',
      'armor', 'necklace',
      'gloves', 'ring',
      'boots', 'ring2',
      'bracelet', 'bracelet2',
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
            this._el.className = 'sa-panel inv2-root ui-panel-fullscreen';
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
            this._syncResponsiveMode();
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

            const panelMain = document.createElement('div');
            panelMain.className = 'inv2-main';

            const top = document.createElement('section');
            top.className = 'inv2-top';

            const mkSlot = (key: EquipSlot): HTMLButtonElement => {
                  const c = document.createElement('button');
                  c.type = 'button';
                  c.className = 'inv2-eq-slot';
                  c.title = SLOT_LABELS[key];
                  const eq = this._equipSystem.getSlot(key);
                  if (eq) {
                        c.classList.add('inv2-eq-filled');
                        c.innerHTML = `<span class="inv2-eq-icon">${eq.icon}</span>${eq.enhanceLevel > 0 ? `<span class="inv2-eq-enhance">+${eq.enhanceLevel}</span>` : ''}<span class="inv2-eq-label">${SLOT_LABELS[key]}</span>`;
                        c.addEventListener('click', (e) => { e.stopPropagation(); this._showEquipActions(eq, key); });
                  } else {
                        c.innerHTML = `<span class="inv2-eq-ghost">${SLOT_ICONS[key]}</span><span class="inv2-eq-label">${SLOT_LABELS[key]}</span>`;
                        c.addEventListener('click', (e) => { e.stopPropagation(); this._showEquipList(key); });
                  }
                  return c;
            };

            const equipCol = document.createElement('section');
            equipCol.className = 'inv2-top-panel inv2-top-panel-equip';
            const equipTitle = document.createElement('div');
            equipTitle.className = 'inv2-sec-title';
            equipTitle.textContent = '裝備欄';
            const equipGrid = document.createElement('div');
            equipGrid.className = 'inv2-equip-grid';
            for (const slot of EQUIP_SLOT_ORDER) equipGrid.appendChild(mkSlot(slot));
            equipCol.appendChild(equipTitle);
            equipCol.appendChild(equipGrid);
            top.appendChild(equipCol);

            const charCol = document.createElement('section');
            charCol.className = 'inv2-top-panel inv2-top-panel-char';
            charCol.innerHTML = `
                  <div class="inv2-sec-title">角色</div>
                  <div class="inv2-char-preview">👤</div>
                  <div class="inv2-char-meta">Lv.${Math.max(1, Math.floor(this._playerStats.level || 1))}</div>
            `;
            top.appendChild(charCol);

            const statsTotal = this._equipSystem.getTotalStats();
            const setBonuses = this._equipSystem.getSetBonuses();
            const quickCol = document.createElement('section');
            quickCol.className = 'inv2-top-panel inv2-top-panel-quick';
            quickCol.innerHTML = `
                  <div class="inv2-sec-title">快速屬性</div>
                  <div class="inv2-quick-grid">
                        <div class="inv2-quick-row"><span>攻擊</span><b>${statsTotal.atk}</b></div>
                        <div class="inv2-quick-row"><span>防禦</span><b>${statsTotal.def}</b></div>
                        <div class="inv2-quick-row"><span>HP</span><b>${this._playerStats.hp}/${this._playerStats.maxHp}</b></div>
                        <div class="inv2-quick-row"><span>MP</span><b>${this._playerStats.mp}/${this._playerStats.maxMp}</b></div>
                        <div class="inv2-quick-row"><span>背包項目</span><b>${this._inventory.count}</b></div>
                        <div class="inv2-quick-row"><span>套裝效果</span><b>${setBonuses.length > 0 ? `${setBonuses.length} 組` : '無'}</b></div>
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
                  btn.textContent = `${t.icon} ${t.label}`;
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
            const itemColumns = this._isPhoneLandscapeMode() ? 10 : 8;

            const itemGrid = document.createElement('div');
            itemGrid.className = 'inv2-item-grid';
            itemGrid.style.setProperty('--inv2-item-cols', String(itemColumns));
            for (let i = 0; i < slotsPerPage; i++) {
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
            gold.innerHTML = `💰 <span class="inv2-gold-val">${this._inventory.gold.toLocaleString()}</span> <span class="inv2-gold-label">GP</span>`;

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
            return width > height && width <= 1280 && height <= 560;
      }

      private _syncResponsiveMode(): void {
            this._el.classList.toggle('is-phone-landscape', this._isPhoneLandscapeMode());
      }

      private _getSlotsPerPage(): number {
            return this._isPhoneLandscapeMode() ? 20 : 24;
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
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
