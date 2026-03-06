/**
 * ShopPanel - NPC shop UI with mode/category sidebar and item detail workflow.
 */

import type { ShopManager, ShopCategory, ShopItem } from '../systems/ShopManager';
import { SHOP_CATEGORIES } from '../systems/ShopManager';
import type { Inventory, InventoryItem } from '../systems/Inventory';
import {
      getRuntimeCommerceItemMetaByIdx,
      getRuntimeProductionRecipes,
      type RuntimeProductionRecipe,
} from '../data/runtime/RuntimeEconomyCommerceSource';

const RARITY_COLORS: Record<string, string> = {
      common: 'rgba(200,195,185,0.5)',
      uncommon: 'rgba(39,174,96,0.7)',
      rare: 'rgba(52,152,219,0.8)',
      epic: 'rgba(155,89,182,0.8)',
      legendary: 'rgba(232,201,106,0.9)',
};

const RARITY_LABELS: Record<string, string> = {
      common: '普通',
      uncommon: '優秀',
      rare: '稀有',
      epic: '史詩',
      legendary: '傳說',
};

export class ShopPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _mode: 'buy' | 'sell' | 'craft' = 'buy';
      private _category: ShopCategory = 'potion';
      private _shop: ShopManager;
      private _inventory: Inventory;
      private _quantities: Map<string, number> = new Map();
      private _selectedBuyId: string | null = null;
      private _selectedSellId: string | null = null;
      private _selectedRecipeId: number | null = null;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._render();
      };

      constructor(shop: ShopManager, inventory: Inventory) {
            this._shop = shop;
            this._inventory = inventory;

            this._el = document.createElement('div');
            this._el.id = 'shop-panel';
            this._el.className = 'sa-panel shop-root';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);

            this._inventory.onChange = () => {
                  if (this._visible) this._render();
            };
            window.addEventListener('resize', this._onResize);
      }

      private _render(): void {
            this._el.dataset.mode = this._mode;

            const gold = this._inventory.gold;
            this._el.innerHTML = `
                  <div class="sa-panel-title">
                        <span class="shop-title-icon">${this._mode === 'buy' ? '🛒' : this._mode === 'sell' ? '💰' : '🛠️'}</span>
                        ${this._mode === 'buy' ? '商店' : this._mode === 'sell' ? '出售' : '製作所'}
                        <span class="shop-gold-badge">🪙 <span class="shop-gold-num">${gold.toLocaleString()}</span></span>
                        <span class="panel-close" id="shop-close">✕</span>
                  </div>
                  <div class="shop-layout">
                        <aside class="shop-side">
                              <div class="shop-mode-bar">
                                    <button class="shop-mode-btn${this._mode === 'buy' ? ' active' : ''}" data-mode="buy">🛍 購買</button>
                                    <button class="shop-mode-btn${this._mode === 'sell' ? ' active' : ''}" data-mode="sell">🪙 出售</button>
                                    <button class="shop-mode-btn${this._mode === 'craft' ? ' active' : ''}" data-mode="craft">🛠 製作</button>
                              </div>
                              ${this._mode === 'buy'
                                    ? this._renderCategoryTabs()
                                    : this._mode === 'sell'
                                          ? '<div class="shop-side-note">出售模式：先選物品，再在右側確認。</div>'
                                          : '<div class="shop-side-note">製作模式：先選配方，再確認素材與成功率。</div>'}
                        </aside>
                        <section class="shop-main">
                              <div class="shop-main-head shop-main-head-grid">
                                    <span class="shop-main-title">${this._mode === 'buy' ? '商品清單' : this._mode === 'sell' ? '背包物品' : '製作配方'}</span>
                                    <span class="shop-main-sub">${this._mode === 'buy'
                                          ? '先選商品，再確認購買數量'
                                          : this._mode === 'sell'
                                                ? '先選物品，再確認出售數量'
                                                : '先選配方，再確認材料與金幣'}</span>
                              </div>
                              <div class="shop-content">
                                    <div class="shop-grid" id="shop-grid"></div>
                                    <div class="shop-detail" id="shop-detail"></div>
                              </div>
                              <div class="shop-bottom-bar" id="shop-bottom"></div>
                        </section>
                  </div>
            `;

            this._el.querySelector('#shop-close')?.addEventListener('click', () => this.hide());

            this._el.querySelectorAll('.shop-mode-btn').forEach((btn) => {
                  btn.addEventListener('click', () => {
                        this._mode = (btn as HTMLElement).dataset.mode as 'buy' | 'sell' | 'craft';
                        this._selectedBuyId = null;
                        this._selectedSellId = null;
                        this._selectedRecipeId = null;
                        this._render();
                  });
            });

            this._el.querySelectorAll('.shop-cat-btn').forEach((btn) => {
                  btn.addEventListener('click', () => {
                        this._category = (btn as HTMLElement).dataset.cat as ShopCategory;
                        this._selectedBuyId = null;
                        this._render();
                  });
            });

            const grid = this._el.querySelector('#shop-grid') as HTMLDivElement;
            const detail = this._el.querySelector('#shop-detail') as HTMLDivElement;
            const bottom = this._el.querySelector('#shop-bottom') as HTMLDivElement;

            if (this._mode === 'buy') {
                  this._renderBuyMode(grid, detail, bottom);
            } else if (this._mode === 'sell') {
                  this._renderSellMode(grid, detail, bottom);
            } else {
                  this._renderCraftMode(grid, detail, bottom);
            }
      }

      private _renderCategoryTabs(): string {
            return `<div class="shop-cat-bar">${SHOP_CATEGORIES.map((cat) => `
                  <button class="shop-cat-btn${cat.id === this._category ? ' active' : ''}" data-cat="${cat.id}">
                        <span class="shop-cat-icon">${cat.icon}</span>
                        <span class="shop-cat-label">${cat.label}</span>
                  </button>
            `).join('')}</div>`;
      }

      private _renderBuyMode(grid: HTMLDivElement, detail: HTMLDivElement, bottom: HTMLDivElement): void {
            const items = this._shop.getByCategory(this._category);
            if (items.length <= 0) {
                  grid.innerHTML = '<div class="shop-empty">此分類暫時沒有商品</div>';
                  detail.innerHTML = '<div class="shop-empty">請切換其他分類</div>';
                  bottom.innerHTML = this._buildBottomBar('buy', null, 1);
                  return;
            }

            if (!this._selectedBuyId || !items.some((row) => row.id === this._selectedBuyId)) {
                  this._selectedBuyId = items[0].id;
            }

            const selected = items.find((row) => row.id === this._selectedBuyId) ?? items[0];
            const qty = this._getQty(selected.id, 99);

            for (const item of items) {
                  grid.appendChild(this._createBuyRow(item, item.id === selected.id));
            }

            detail.innerHTML = this._buildBuyDetail(selected, qty);
            this._bindDetailQty(detail, selected.id, 99);
            detail.querySelector('.shop-detail-action')?.addEventListener('click', () => {
                  const currentQty = this._getQty(selected.id, 99);
                  const canAfford = this._inventory.gold >= selected.price * currentQty;
                  if (!canAfford) {
                        this._showToast('金幣不足', '#E74C3C');
                        return;
                  }

                  let bought = 0;
                  for (let i = 0; i < currentQty; i++) {
                        if (this._shop.buy(selected.id, 1, this._inventory)) bought++;
                        else break;
                  }

                  if (bought > 0) {
                        this._showToast(`購買 ${selected.name} x${bought}`, '#27AE60');
                        this._quantities.delete(selected.id);
                  }
                  this._render();
            });

            bottom.innerHTML = this._buildBottomBar('buy', selected, qty);
      }

      private _renderSellMode(grid: HTMLDivElement, detail: HTMLDivElement, bottom: HTMLDivElement): void {
            const invItems = this._inventory.items.filter((i) => i.type !== 'quest');
            if (invItems.length <= 0) {
                  grid.innerHTML = '<div class="shop-empty">背包沒有可出售物品</div>';
                  detail.innerHTML = '<div class="shop-empty">沒有可出售物品</div>';
                  bottom.innerHTML = this._buildBottomBar('sell', null, 1);
                  return;
            }

            if (!this._selectedSellId || !invItems.some((row) => row.itemId === this._selectedSellId)) {
                  this._selectedSellId = invItems[0].itemId;
            }

            const selected = invItems.find((row) => row.itemId === this._selectedSellId) ?? invItems[0];
            const unitSellPrice = this._shop.getSellPrice(selected.itemId);
            const qty = this._getQty(selected.itemId, selected.qty);

            for (const item of invItems) {
                  grid.appendChild(this._createSellRow(item, item.itemId === selected.itemId));
            }

            detail.innerHTML = this._buildSellDetail(selected, unitSellPrice, qty);
            this._bindDetailQty(detail, selected.itemId, selected.qty);
            detail.querySelector('.shop-detail-action')?.addEventListener('click', () => {
                  const currentQty = this._getQty(selected.itemId, selected.qty);
                  const totalGold = this._shop.sell(selected.itemId, currentQty, this._inventory);
                  if (totalGold > 0) {
                        this._showToast(`出售獲得 ${totalGold} 金幣`, '#27AE60');
                        this._quantities.delete(selected.itemId);
                  }
                  this._render();
            });

            bottom.innerHTML = this._buildBottomBar('sell', {
                  id: selected.itemId,
                  name: selected.name,
                  category: 'scroll',
                  price: unitSellPrice,
                  icon: selected.icon,
                  description: selected.description,
                  itemType: selected.type as ShopItem['itemType'],
                  rarity: selected.rarity as ShopItem['rarity'],
            }, qty);
      }

      private _renderCraftMode(grid: HTMLDivElement, detail: HTMLDivElement, bottom: HTMLDivElement): void {
            const recipes = getRuntimeProductionRecipes();
            if (recipes.length <= 0) {
                  grid.innerHTML = '<div class="shop-empty">目前沒有可用製作配方</div>';
                  detail.innerHTML = '<div class="shop-empty">尚未載入製作資料</div>';
                  bottom.innerHTML = this._buildBottomBar('craft', null, 1);
                  return;
            }

            if (this._selectedRecipeId === null || !recipes.some((row) => row.recipeIdx === this._selectedRecipeId)) {
                  this._selectedRecipeId = recipes[0].recipeIdx;
            }
            const selected = recipes.find((row) => row.recipeIdx === this._selectedRecipeId) ?? recipes[0];

            for (const recipe of recipes) {
                  grid.appendChild(this._createCraftRow(recipe, recipe.recipeIdx === selected.recipeIdx));
            }

            const craftable = this._isRecipeCraftable(selected);
            detail.innerHTML = this._buildCraftDetail(selected, craftable);
            detail.querySelector('.shop-detail-action')?.addEventListener('click', () => {
                  if (!this._isRecipeCraftable(selected)) {
                        this._showToast('材料或金幣不足', '#E74C3C');
                        return;
                  }

                  const cost = Math.max(0, selected.costGold);
                  if (!this._inventory.spendGold(cost)) {
                        this._showToast('金幣不足', '#E74C3C');
                        return;
                  }

                  for (const mat of selected.materials) {
                        this._inventory.removeItem(`db_item_${mat.itemIdx}`, mat.count);
                  }

                  const successRate = selected.defaultPro > 0 ? Math.min(1, selected.defaultPro / 100000) : 1;
                  const success = Math.random() <= successRate;
                  if (success) {
                        const resultMeta = getRuntimeCommerceItemMetaByIdx(selected.resultIdx);
                        for (let i = 0; i < selected.resultCount; i++) {
                              this._inventory.addItem({
                                    itemId: resultMeta?.itemId ?? `db_item_${selected.resultIdx}`,
                                    name: resultMeta?.name ?? selected.resultName,
                                    type: resultMeta?.itemType ?? 'material',
                                    rarity: resultMeta?.rarity ?? 'common',
                                    qty: 1,
                                    icon: this._iconForItemType(resultMeta?.itemType ?? 'material'),
                                    description: resultMeta?.description ?? `製作產物 #${selected.resultIdx}`,
                              });
                        }
                        this._showToast(`製作成功：${selected.resultName} x${selected.resultCount}`, '#27AE60');
                  } else {
                        this._showToast('製作失敗，材料已消耗', '#E67E22');
                  }
                  this._render();
            });

            bottom.innerHTML = this._buildBottomBar('craft', {
                  id: `db_item_${selected.resultIdx}`,
                  name: selected.resultName,
                  category: 'scroll',
                  price: selected.costGold,
                  icon: this._iconForItemType('material'),
                  description: selected.docName,
                  itemType: 'material',
                  rarity: 'common',
            }, selected.resultCount);
      }

      private _createBuyRow(item: ShopItem, selected: boolean): HTMLButtonElement {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = `shop-card shop-list-row${selected ? ' is-selected' : ''}`;
            const rarityColor = RARITY_COLORS[item.rarity || 'common'];
            row.style.borderColor = rarityColor;
            row.style.setProperty('--shop-rarity-color', rarityColor);

            row.innerHTML = `
                  <div class="shop-card-left">
                        <div class="shop-card-icon">${item.icon}</div>
                  </div>
                  <div class="shop-card-center">
                        <div class="shop-card-name">${item.name}</div>
                        <div class="shop-card-desc">${this._buildItemTypeText(item.itemType)} · ${item.description}</div>
                        <div class="shop-card-meta">
                              <span class="shop-card-rarity">${RARITY_LABELS[item.rarity || 'common']}</span>
                              <span class="shop-card-unit">單價: ${item.price}🪙</span>
                        </div>
                  </div>
                  <div class="shop-card-right">
                        <div class="shop-card-price">🪙 ${item.price}</div>
                  </div>
            `;

            row.addEventListener('click', () => {
                  this._selectedBuyId = item.id;
                  this._render();
            });
            return row;
      }

      private _createSellRow(item: InventoryItem, selected: boolean): HTMLButtonElement {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = `shop-card shop-list-row${selected ? ' is-selected' : ''}`;
            const rarityColor = RARITY_COLORS[item.rarity || 'common'];
            row.style.borderColor = rarityColor;
            row.style.setProperty('--shop-rarity-color', rarityColor);
            const sellPrice = this._shop.getSellPrice(item.itemId);

            row.innerHTML = `
                  <div class="shop-card-left">
                        <div class="shop-card-icon">${item.icon}</div>
                  </div>
                  <div class="shop-card-center">
                        <div class="shop-card-name">${item.name}</div>
                        <div class="shop-card-desc">${item.description}</div>
                        <div class="shop-card-meta">
                              <span class="shop-card-rarity">${RARITY_LABELS[item.rarity || 'common']}</span>
                              <span class="shop-card-stock">庫存: ${item.qty}</span>
                        </div>
                  </div>
                  <div class="shop-card-right">
                        <div class="shop-card-price sell">+🪙 ${sellPrice}</div>
                  </div>
            `;

            row.addEventListener('click', () => {
                  this._selectedSellId = item.itemId;
                  this._render();
            });
            return row;
      }

      private _createCraftRow(recipe: RuntimeProductionRecipe, selected: boolean): HTMLButtonElement {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = `shop-card shop-list-row${selected ? ' is-selected' : ''}`;
            const craftable = this._isRecipeCraftable(recipe);
            row.innerHTML = `
                  <div class="shop-card-left">
                        <div class="shop-card-icon">🛠️</div>
                  </div>
                  <div class="shop-card-center">
                        <div class="shop-card-name">${recipe.resultName}</div>
                        <div class="shop-card-desc">${recipe.docName}</div>
                        <div class="shop-card-meta">
                              <span class="shop-card-stock">素材 ${recipe.materials.length} 種</span>
                              <span class="shop-card-unit">費用: ${recipe.costGold}🪙</span>
                        </div>
                  </div>
                  <div class="shop-card-right">
                        <div class="shop-card-price${craftable ? '' : ' insufficient'}">${craftable ? '可製作' : '缺素材'}</div>
                  </div>
            `;
            row.addEventListener('click', () => {
                  this._selectedRecipeId = recipe.recipeIdx;
                  this._render();
            });
            return row;
      }

      private _buildCraftDetail(recipe: RuntimeProductionRecipe, craftable: boolean): string {
            const successRatePct = recipe.defaultPro > 0 ? Math.min(100, recipe.defaultPro / 1000) : 100;
            const materialRows = recipe.materials.map((mat) => {
                  const have = this._getInventoryCount(`db_item_${mat.itemIdx}`);
                  const ok = have >= mat.count;
                  return `
                        <div class="shop-detail-row">
                              <span>${mat.itemName}</span>
                              <span class="${ok ? '' : 'insufficient'}">${have}/${mat.count}</span>
                        </div>
                  `;
            }).join('');
            return `
                  <div class="shop-detail-header">
                        <div class="shop-detail-icon">⚗️</div>
                        <div class="shop-detail-title-wrap">
                              <div class="shop-detail-title">${recipe.resultName}</div>
                              <div class="shop-detail-sub">${recipe.docName}</div>
                        </div>
                  </div>
                  <div class="shop-detail-body">
                        <div class="shop-detail-desc">製作後可獲得 ${recipe.resultName} x${recipe.resultCount}</div>
                        <div class="shop-detail-row"><span>金幣費用</span><span>${recipe.costGold}🪙</span></div>
                        <div class="shop-detail-row"><span>成功率</span><span>${successRatePct.toFixed(1)}%</span></div>
                        ${materialRows}
                  </div>
                  <button class="shop-action-btn buy-btn btn-gold shop-detail-action${craftable ? '' : ' disabled'}" type="button">${craftable ? '確認製作' : '材料不足'}</button>
            `;
      }

      private _buildBuyDetail(item: ShopItem, qty: number): string {
            const totalCost = item.price * qty;
            const canAfford = this._inventory.gold >= totalCost;
            return `
                  <div class="shop-detail-header">
                        <div class="shop-detail-icon">${item.icon}</div>
                        <div class="shop-detail-title-wrap">
                              <div class="shop-detail-title">${item.name}</div>
                              <div class="shop-detail-sub">${this._buildItemTypeText(item.itemType)} · ${RARITY_LABELS[item.rarity] ?? '普通'}</div>
                        </div>
                  </div>
                  <div class="shop-detail-body">
                        <div class="shop-detail-desc">${item.description}</div>
                        <div class="shop-detail-row"><span>單價</span><span>🪙 ${item.price}</span></div>
                        <div class="shop-detail-row">
                              <span>數量</span>
                              <div class="shop-qty-control">
                                    <button class="shop-qty-btn minus" type="button">-</button>
                                    <span class="shop-qty-num">${qty}</span>
                                    <button class="shop-qty-btn plus" type="button">+</button>
                              </div>
                        </div>
                        <div class="shop-detail-row shop-detail-row-total">
                              <span>總價</span>
                              <span class="${canAfford ? '' : 'insufficient'}">🪙 ${totalCost}</span>
                        </div>
                  </div>
                  <button class="shop-action-btn buy-btn btn-gold shop-detail-action${canAfford ? '' : ' disabled'}" type="button">${canAfford ? '確認購買' : '金幣不足'}</button>
            `;
      }

      private _buildSellDetail(item: InventoryItem, unitSellPrice: number, qty: number): string {
            return `
                  <div class="shop-detail-header">
                        <div class="shop-detail-icon">${item.icon}</div>
                        <div class="shop-detail-title-wrap">
                              <div class="shop-detail-title">${item.name}</div>
                              <div class="shop-detail-sub">出售 · ${RARITY_LABELS[item.rarity] ?? '普通'}</div>
                        </div>
                  </div>
                  <div class="shop-detail-body">
                        <div class="shop-detail-desc">${item.description}</div>
                        <div class="shop-detail-row"><span>庫存</span><span>${item.qty}</span></div>
                        <div class="shop-detail-row"><span>單件可得</span><span class="sell">+🪙 ${unitSellPrice}</span></div>
                        <div class="shop-detail-row">
                              <span>數量</span>
                              <div class="shop-qty-control">
                                    <button class="shop-qty-btn minus" type="button">-</button>
                                    <span class="shop-qty-num">${qty}</span>
                                    <button class="shop-qty-btn plus" type="button">+</button>
                              </div>
                        </div>
                        <div class="shop-detail-row shop-detail-row-total"><span>總計可得</span><span class="sell">+🪙 ${unitSellPrice * qty}</span></div>
                  </div>
                  <button class="shop-action-btn sell-btn shop-detail-action" type="button">確認出售</button>
            `;
      }

      private _buildBottomBar(mode: 'buy' | 'sell' | 'craft', item: ShopItem | null, qty: number): string {
            const gold = this._inventory.gold;
            if (!item) {
                  return `
                        <div class="shop-bottom-main">
                              <span class="shop-bottom-label">目前金幣</span>
                              <span class="shop-bottom-value">🪙 ${gold.toLocaleString()}</span>
                        </div>
                        <span class="shop-bottom-hint">請先選擇物品</span>
                  `;
            }

            const total = Math.max(1, item.price) * Math.max(1, qty);
            const hint = mode === 'buy'
                  ? `購買 ${item.name} x${qty}`
                  : mode === 'sell'
                        ? `出售 ${item.name} x${qty}`
                        : `製作 ${item.name} x${qty}`;
            const value = mode === 'buy'
                  ? `需支付 🪙 ${total.toLocaleString()}`
                  : mode === 'sell'
                        ? `可獲得 🪙 ${total.toLocaleString()}`
                        : `需消耗 🪙 ${total.toLocaleString()}`;
            return `
                  <div class="shop-bottom-main">
                        <span class="shop-bottom-label">${hint}</span>
                        <span class="shop-bottom-value${mode === 'sell' ? ' sell' : ''}">${value}</span>
                  </div>
                  <span class="shop-bottom-hint">目前金幣：🪙 ${gold.toLocaleString()}</span>
            `;
      }

      private _bindDetailQty(container: HTMLElement, id: string, max: number): void {
            container.querySelector('.shop-qty-btn.minus')?.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const cur = this._getQty(id, max);
                  if (cur > 1) {
                        this._quantities.set(id, cur - 1);
                        this._render();
                  }
            });

            container.querySelector('.shop-qty-btn.plus')?.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const cur = this._getQty(id, max);
                  if (cur < max) {
                        this._quantities.set(id, cur + 1);
                        this._render();
                  }
            });
      }

      private _getQty(id: string, max: number): number {
            return Math.min(this._quantities.get(id) ?? 1, max);
      }

      private _buildItemTypeText(itemType: ShopItem['itemType']): string {
            switch (itemType) {
                  case 'equipment': return '裝備';
                  case 'consumable': return '消耗品';
                  case 'material': return '材料';
                  case 'egg': return '蛋';
                  case 'recipe': return '配方';
                  case 'quest': return '任務道具';
                  default: return '道具';
            }
      }

      private _isRecipeCraftable(recipe: RuntimeProductionRecipe): boolean {
            if (this._inventory.gold < recipe.costGold) return false;
            for (const mat of recipe.materials) {
                  const have = this._getInventoryCount(`db_item_${mat.itemIdx}`);
                  if (have < mat.count) return false;
            }
            return true;
      }

      private _getInventoryCount(itemId: string): number {
            const row = this._inventory.items.find((item) => item.itemId === itemId);
            return row ? Math.max(0, row.qty) : 0;
      }

      private _iconForItemType(itemType: ShopItem['itemType']): string {
            switch (itemType) {
                  case 'equipment': return '⚔️';
                  case 'consumable': return '🧪';
                  case 'material': return '📦';
                  case 'egg': return '🥚';
                  case 'recipe': return '📜';
                  case 'quest': return '🧾';
                  default: return '📦';
            }
      }

      private _showToast(msg: string, color: string): void {
            const el = document.createElement('div');
            el.className = 'shop-toast';
            el.style.setProperty('--toast-color', color);
            el.textContent = msg;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => {
                  el.classList.remove('show');
                  setTimeout(() => el.remove(), 300);
            }, 2000);
      }

      async show(mode: 'buy' | 'sell' | 'craft' = 'buy'): Promise<void> {
            await this._shop.ensureRuntimeLoaded();
            this._mode = mode;
            this._visible = true;
            this._quantities.clear();
            this._selectedBuyId = null;
            this._selectedSellId = null;
            this._selectedRecipeId = null;
            this._el.hidden = false;
            this._render();
      }

      hide(): void {
            this._visible = false;
            this._el.hidden = true;
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }

      dispose(): void {
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
