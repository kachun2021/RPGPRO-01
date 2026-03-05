/**
 * ShopPanel — Premium NPC shop UI with category tabs + item cards + buy/sell.
 * Opens from DialoguePanel or nav bar.
 * Stone Age Premium Dark Theme with rarity borders, quantity controls, and gold display.
 */

import type { ShopManager, ShopCategory, ShopItem } from '../systems/ShopManager';
import { SHOP_CATEGORIES } from '../systems/ShopManager';
import type { Inventory } from '../systems/Inventory';

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
      private _mode: 'buy' | 'sell' = 'buy';
      private _category: ShopCategory = 'potion';
      private _shop: ShopManager;
      private _inventory: Inventory;
      private _quantities: Map<string, number> = new Map();

      constructor(shop: ShopManager, inventory: Inventory) {
            this._shop = shop;
            this._inventory = inventory;

            this._el = document.createElement('div');
            this._el.id = 'shop-panel';
            this._el.className = 'sa-panel shop-root';
            this._el.style.display = 'none';
            document.getElementById('ui-layer')?.appendChild(this._el);

            this._inventory.onChange = () => { if (this._visible) this._render(); };
      }

      private _render(): void {
            const gold = this._inventory.gold;
            this._el.innerHTML = `
                  <div class="sa-panel-title">
                        <span class="shop-title-icon">${this._mode === 'buy' ? '🏪' : '📦'}</span>
                        ${this._mode === 'buy' ? '商店' : '出售'}
                        <span class="shop-gold-badge">💰 <span class="shop-gold-num">${gold.toLocaleString()}</span></span>
                        <span class="panel-close" id="shop-close">×</span>
                  </div>

                  <div class="shop-mode-bar">
                        <button class="shop-mode-btn${this._mode === 'buy' ? ' active' : ''}" data-mode="buy">🛒 購買</button>
                        <button class="shop-mode-btn${this._mode === 'sell' ? ' active' : ''}" data-mode="sell">💰 出售</button>
                  </div>

                  ${this._mode === 'buy' ? this._renderCategoryTabs() : ''}

                  <div class="shop-grid" id="shop-grid"></div>
            `;

            // Bind close
            this._el.querySelector('#shop-close')?.addEventListener('click', () => this.hide());

            // Bind mode buttons
            this._el.querySelectorAll('.shop-mode-btn').forEach(btn => {
                  btn.addEventListener('click', () => {
                        this._mode = (btn as HTMLElement).dataset.mode as 'buy' | 'sell';
                        this._render();
                  });
            });

            // Bind category tabs
            this._el.querySelectorAll('.shop-cat-btn').forEach(btn => {
                  btn.addEventListener('click', () => {
                        this._category = (btn as HTMLElement).dataset.cat as ShopCategory;
                        this._render();
                  });
            });

            // Render items
            const grid = this._el.querySelector('#shop-grid') as HTMLDivElement;
            if (this._mode === 'buy') {
                  this._renderBuyItems(grid);
            } else {
                  this._renderSellItems(grid);
            }
      }

      private _renderCategoryTabs(): string {
            return `<div class="shop-cat-bar">${SHOP_CATEGORIES.map(cat => `
                  <button class="shop-cat-btn${cat.id === this._category ? ' active' : ''}" data-cat="${cat.id}">
                        <span class="shop-cat-icon">${cat.icon}</span>
                        <span class="shop-cat-label">${cat.label}</span>
                  </button>
            `).join('')}</div>`;
      }

      private _renderBuyItems(grid: HTMLDivElement): void {
            const items = this._shop.getByCategory(this._category);
            if (items.length === 0) {
                  grid.innerHTML = '<div class="shop-empty">📭 此分類暫無商品</div>';
                  return;
            }

            for (const item of items) {
                  grid.appendChild(this._createBuyCard(item));
            }
      }

      private _renderSellItems(grid: HTMLDivElement): void {
            const invItems = this._inventory.items.filter(i => i.type !== 'quest');
            if (invItems.length === 0) {
                  grid.innerHTML = '<div class="shop-empty">🎒 背包空空如也</div>';
                  return;
            }

            for (const item of invItems) {
                  const sellPrice = this._shop.getSellPrice(item.itemId);
                  const card = document.createElement('div');
                  card.className = `shop-card`;
                  card.style.borderColor = RARITY_COLORS[item.rarity || 'common'];

                  const qty = this._getQty(item.itemId, item.qty);

                  card.innerHTML = `
                        <div class="shop-card-left">
                              <div class="shop-card-icon" style="border-color:${RARITY_COLORS[item.rarity || 'common']}">${item.icon}</div>
                        </div>
                        <div class="shop-card-center">
                              <div class="shop-card-name">${item.name}</div>
                              <div class="shop-card-desc">${item.description}</div>
                              <div class="shop-card-meta">
                                    <span class="shop-card-rarity" style="color:${RARITY_COLORS[item.rarity || 'common']}">${RARITY_LABELS[item.rarity || 'common']}</span>
                                    <span class="shop-card-stock">庫存: ${item.qty}</span>
                              </div>
                        </div>
                        <div class="shop-card-right">
                              <div class="shop-card-price sell">+💰 ${sellPrice * qty}</div>
                              <div class="shop-qty-control">
                                    <button class="shop-qty-btn minus" data-id="${item.itemId}">−</button>
                                    <span class="shop-qty-num">${qty}</span>
                                    <button class="shop-qty-btn plus" data-id="${item.itemId}" data-max="${item.qty}">＋</button>
                              </div>
                              <button class="shop-action-btn sell-btn" data-id="${item.itemId}">出售</button>
                        </div>
                  `;

                  this._bindQtyControls(card, item.itemId, item.qty);

                  card.querySelector('.sell-btn')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const q = this._getQty(item.itemId, item.qty);
                        const totalGold = this._shop.sell(item.itemId, q, this._inventory);
                        if (totalGold > 0) {
                              this._showToast(`📦 出售獲得 ${totalGold} 💰`, '#27AE60');
                              this._quantities.delete(item.itemId);
                        }
                        this._render();
                  });

                  grid.appendChild(card);
            }
      }

      private _createBuyCard(item: ShopItem): HTMLDivElement {
            const card = document.createElement('div');
            card.className = 'shop-card';
            card.style.borderColor = RARITY_COLORS[item.rarity || 'common'];

            const qty = this._getQty(item.id, 99);
            const totalCost = item.price * qty;
            const canAfford = this._inventory.gold >= totalCost;

            card.innerHTML = `
                  <div class="shop-card-left">
                        <div class="shop-card-icon" style="border-color:${RARITY_COLORS[item.rarity || 'common']}">${item.icon}</div>
                  </div>
                  <div class="shop-card-center">
                        <div class="shop-card-name">${item.name}</div>
                        <div class="shop-card-desc">${item.description}</div>
                        <div class="shop-card-meta">
                              <span class="shop-card-rarity" style="color:${RARITY_COLORS[item.rarity || 'common']}">${RARITY_LABELS[item.rarity || 'common']}</span>
                              <span class="shop-card-unit">單價: ${item.price}💰</span>
                        </div>
                  </div>
                  <div class="shop-card-right">
                        <div class="shop-card-price${canAfford ? '' : ' insufficient'}">💰 ${totalCost}</div>
                        <div class="shop-qty-control">
                              <button class="shop-qty-btn minus" data-id="${item.id}">−</button>
                              <span class="shop-qty-num">${qty}</span>
                              <button class="shop-qty-btn plus" data-id="${item.id}" data-max="99">＋</button>
                        </div>
                        <button class="shop-action-btn buy-btn btn-gold${canAfford ? '' : ' disabled'}" data-id="${item.id}">購買</button>
                  </div>
            `;

            this._bindQtyControls(card, item.id, 99);

            card.querySelector('.buy-btn')?.addEventListener('click', (e) => {
                  e.stopPropagation();
                  if (!canAfford) {
                        this._showToast('❌ 金幣不足！', '#E74C3C');
                        return;
                  }
                  const q = this._getQty(item.id, 99);
                  let bought = 0;
                  for (let i = 0; i < q; i++) {
                        if (this._shop.buy(item.id, 1, this._inventory)) bought++;
                        else break;
                  }
                  if (bought > 0) {
                        this._showToast(`✅ 購買 ${item.name} ×${bought}`, '#27AE60');
                        this._quantities.delete(item.id);
                  } else {
                        this._showToast('❌ 金幣不足！', '#E74C3C');
                  }
                  this._render();
            });

            return card;
      }

      // ─── Quantity Controls ───

      private _getQty(id: string, max: number): number {
            return Math.min(this._quantities.get(id) ?? 1, max);
      }

      private _bindQtyControls(card: HTMLElement, id: string, max: number): void {
            card.querySelector('.shop-qty-btn.minus')?.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const cur = this._getQty(id, max);
                  if (cur > 1) {
                        this._quantities.set(id, cur - 1);
                        this._render();
                  }
            });
            card.querySelector('.shop-qty-btn.plus')?.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const cur = this._getQty(id, max);
                  if (cur < max) {
                        this._quantities.set(id, cur + 1);
                        this._render();
                  }
            });
      }

      // ─── Toast ───

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

      // ─── Public API ───

      show(mode: 'buy' | 'sell' = 'buy'): void {
            this._mode = mode;
            this._visible = true;
            this._quantities.clear();
            this._el.style.display = 'flex';
            this._render();
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      dispose(): void { this._el.remove(); }
}
