/**
 * ShopPanel - NPC shop UI with mode/category sidebar and item detail workflow.
 */

import type { ShopManager, ShopCategory, ShopCatalogScope, ShopItem } from '../systems/ShopManager';
import type { Inventory, InventoryItem } from '../systems/Inventory';
import {
      getRuntimeCommerceItemMetaByIdx,
      getRuntimeProductionRecipes,
      type RuntimeProductionRecipe,
} from '../data/runtime/RuntimeEconomyCommerceSource';
import {
      buildItemTypeText,
      buildShopBottomBar,
      buildShopBuyDetail,
      buildShopCategoryTabs,
      buildShopCraftDetail,
      buildShopSellDetail,
      getShopRarityColor,
      getShopRarityLabel,
      iconForItemType,
} from './shop/ShopPanelTemplates';
import { createPanelHeader } from './layout/PanelHeader';

export class ShopPanel {
      readonly panelId = 'shop';
      private _el: HTMLDivElement;
      private _visible = false;
      private _mode: 'buy' | 'sell' | 'craft' = 'buy';
      private _category: ShopCategory = 'potion';
      private _buyCatalogScope: ShopCatalogScope = 'starter';
      private _shop: ShopManager;
      private _inventory: Inventory;
      private _quantities: Map<string, number> = new Map();
      private _selectedBuyId: string | null = null;
      private _selectedSellId: string | null = null;
      private _selectedRecipeId: number | null = null;
      private _disposeInventoryListener: (() => void) | null = null;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._render();
      };

      constructor(shop: ShopManager, inventory: Inventory) {
            this._shop = shop;
            this._inventory = inventory;

            this._el = document.createElement('div');
            this._el.id = 'shop-panel';
            this._el.className = 'sa-panel shop-root ui-panel-atlas';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);

            this._disposeInventoryListener = this._inventory.subscribe(() => {
                  if (this._visible) this._render();
            });
            window.addEventListener('resize', this._onResize);
      }

      get isVisible(): boolean {
            return this._visible;
      }

      private _render(): void {
            this._el.dataset.mode = this._mode;

            const gold = this._inventory.gold;
            this._el.innerHTML = `
                  <div class="shop-layout">
                        <aside class="shop-side">
                              <div class="shop-mode-bar">
                                    <button class="shop-mode-btn rpg-chip rpg-chip-tab${this._mode === 'buy' ? ' active is-active' : ''}" data-mode="buy"><span class="shop-mode-icon">買</span><span class="shop-mode-label">購買</span></button>
                                    <button class="shop-mode-btn rpg-chip rpg-chip-tab${this._mode === 'sell' ? ' active is-active' : ''}" data-mode="sell"><span class="shop-mode-icon">售</span><span class="shop-mode-label">出售</span></button>
                                    <button class="shop-mode-btn rpg-chip rpg-chip-tab${this._mode === 'craft' ? ' active is-active' : ''}" data-mode="craft"><span class="shop-mode-icon">作</span><span class="shop-mode-label">製作</span></button>
                              </div>
                              ${this._mode === 'buy' ? buildShopCategoryTabs(this._category, this._buyCatalogScope) : ''}
                        </aside>
                        <section class="shop-main">
                              <div class="shop-main-head shop-main-head-grid">
                                    <span class="shop-main-title">${this._mode === 'buy' ? '採買清單' : this._mode === 'sell' ? '背包變現' : '工坊配方'}</span>
                                    <span class="sa-tag shop-main-chip">${this._mainHeadChip()}</span>
                              </div>
                              <div class="shop-content">
                                    <div class="shop-list-pane">
                                          <div class="shop-list-head" id="shop-list-head"></div>
                                          <div class="shop-grid" id="shop-grid"></div>
                                    </div>
                                    <div class="shop-detail" id="shop-detail"></div>
                              </div>
                              <div class="shop-bottom-bar" id="shop-bottom"></div>
                        </section>
                  </div>
            `;

            const { root: title } = createPanelHeader({
                  icon: 'shop',
                  kicker: 'Supply Counter',
                  title: this._panelTitle(),
                  subtitle: this._panelSubtitle(),
                  summaryText: `GP ${gold.toLocaleString()}`,
                  summaryClassName: 'shop-gold-badge',
                  closeLabel: '關閉商店',
                  closeId: 'shop-close',
                  closeText: '✕',
                  onClose: () => this.hide(),
            });
            this._el.prepend(title);

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
            this._el.querySelectorAll('.shop-scope-btn').forEach((btn) => {
                  btn.addEventListener('click', () => {
                        this._buyCatalogScope = ((btn as HTMLElement).dataset.scope as ShopCatalogScope) || 'starter';
                        this._selectedBuyId = null;
                        this._render();
                  });
            });

            const grid = this._el.querySelector('#shop-grid') as HTMLDivElement;
            const listHead = this._el.querySelector('#shop-list-head') as HTMLDivElement;
            const detail = this._el.querySelector('#shop-detail') as HTMLDivElement;
            const bottom = this._el.querySelector('#shop-bottom') as HTMLDivElement;

            if (this._mode === 'buy') {
                  this._renderBuyMode(grid, detail, bottom, listHead);
            } else if (this._mode === 'sell') {
                  this._renderSellMode(grid, detail, bottom, listHead);
            } else {
                  this._renderCraftMode(grid, detail, bottom, listHead);
            }
      }

      private _renderBuyMode(grid: HTMLDivElement, detail: HTMLDivElement, bottom: HTMLDivElement, listHead: HTMLDivElement): void {
            const items = this._shop.getByCategory(this._category, this._buyCatalogScope);
            listHead.textContent = this._buyCatalogScope === 'starter'
                  ? `新手精選（${items.length}）`
                  : `商品清單（${items.length}）`;
            if (items.length <= 0) {
                  grid.innerHTML = '<div class="shop-empty">此分類暫時沒有商品</div>';
                  detail.innerHTML = '<div class="shop-empty">請切換其他分類</div>';
                  bottom.innerHTML = buildShopBottomBar('buy', null, 1, this._inventory.gold);
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

            detail.innerHTML = buildShopBuyDetail(selected, qty, this._inventory.gold);
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

            bottom.innerHTML = buildShopBottomBar('buy', selected, qty, this._inventory.gold);
      }

      private _renderSellMode(grid: HTMLDivElement, detail: HTMLDivElement, bottom: HTMLDivElement, listHead: HTMLDivElement): void {
            const invItems = this._inventory.items.filter((i) => i.type !== 'quest');
            listHead.textContent = `可出售（${invItems.length}）`;
            if (invItems.length <= 0) {
                  grid.innerHTML = '<div class="shop-empty">背包沒有可出售物品</div>';
                  detail.innerHTML = '<div class="shop-empty">沒有可出售物品</div>';
                  bottom.innerHTML = buildShopBottomBar('sell', null, 1, this._inventory.gold);
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

            detail.innerHTML = buildShopSellDetail(selected, unitSellPrice, qty);
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

            bottom.innerHTML = buildShopBottomBar('sell', {
                  name: selected.name,
                  price: unitSellPrice,
            }, qty, this._inventory.gold);
      }

      private _renderCraftMode(grid: HTMLDivElement, detail: HTMLDivElement, bottom: HTMLDivElement, listHead: HTMLDivElement): void {
            const recipes = getRuntimeProductionRecipes();
            listHead.textContent = `製作配方（${recipes.length}）`;
            if (recipes.length <= 0) {
                  grid.innerHTML = '<div class="shop-empty">目前沒有可用製作配方</div>';
                  detail.innerHTML = '<div class="shop-empty">尚未載入製作資料</div>';
                  bottom.innerHTML = buildShopBottomBar('craft', null, 1, this._inventory.gold);
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
            detail.innerHTML = buildShopCraftDetail(selected, craftable, (itemId) => this._getInventoryCount(itemId));
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
                                    icon: iconForItemType(resultMeta?.itemType ?? 'material'),
                                    description: resultMeta?.description ?? `製作產物 #${selected.resultIdx}`,
                              });
                        }
                        this._showToast(`製作成功：${selected.resultName} x${selected.resultCount}`, '#27AE60');
                  } else {
                        this._showToast('製作失敗，材料已消耗', '#E67E22');
                  }
                  this._render();
            });

            bottom.innerHTML = buildShopBottomBar('craft', {
                  name: selected.resultName,
                  price: selected.costGold,
            }, selected.resultCount, this._inventory.gold);
      }

      private _createBuyRow(item: ShopItem, selected: boolean): HTMLButtonElement {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = `shop-card shop-list-row${selected ? ' is-selected' : ''}`;
            const rarityColor = getShopRarityColor(item.rarity);
            row.style.borderColor = rarityColor;
            row.style.setProperty('--shop-rarity-color', rarityColor);

            row.innerHTML = `
                  <div class="shop-card-left">
                        <div class="shop-card-icon">${iconForItemType(item.itemType)}</div>
                  </div>
                  <div class="shop-card-center">
                        <div class="shop-card-name">${item.name}</div>
                        <div class="shop-card-desc">${buildItemTypeText(item.itemType)} · ${item.description}</div>
                        <div class="shop-card-meta">
                              <span class="shop-card-rarity">${getShopRarityLabel(item.rarity)}</span>
                              <span class="shop-card-unit">單價: ${item.price} GP</span>
                        </div>
                  </div>
                  <div class="shop-card-right">
                        <div class="shop-card-price">${item.price} GP</div>
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
            const rarityColor = getShopRarityColor(item.rarity);
            row.style.borderColor = rarityColor;
            row.style.setProperty('--shop-rarity-color', rarityColor);
            const sellPrice = this._shop.getSellPrice(item.itemId);

            row.innerHTML = `
                  <div class="shop-card-left">
                        <div class="shop-card-icon">${iconForItemType(item.type)}</div>
                  </div>
                  <div class="shop-card-center">
                        <div class="shop-card-name">${item.name}</div>
                        <div class="shop-card-desc">${item.description}</div>
                        <div class="shop-card-meta">
                              <span class="shop-card-rarity">${getShopRarityLabel(item.rarity)}</span>
                              <span class="shop-card-stock">庫存: ${item.qty}</span>
                        </div>
                  </div>
                  <div class="shop-card-right">
                        <div class="shop-card-price sell">+${sellPrice} GP</div>
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
                              <span class="shop-card-unit">費用: ${recipe.costGold} GP</span>
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

      private _panelTitle(): string {
            if (this._mode === 'sell') return '商旅回收';
            if (this._mode === 'craft') return '製作工坊';
            return '補給商店';
      }

      private _panelSubtitle(): string {
            if (this._mode === 'sell') return '背包整理、回收估值與快速出清';
            if (this._mode === 'craft') return '配方、缺料來源與成功率確認';
            return '補給採買、商品比較與即時結算';
      }

      private _mainHeadChip(): string {
            if (this._mode === 'sell') return '回收估值';
            if (this._mode === 'craft') return '材料檢核';
            return this._buyCatalogScope === 'starter' ? '新手精選' : '常規供應';
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
            this._disposeInventoryListener?.();
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}

