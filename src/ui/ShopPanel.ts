/**
 * ShopPanel — NPC shop UI with category tabs + item grid + buy/sell.
 * Opens from DialoguePanel when player clicks "買" or "賣".
 */

import type { ShopManager, ShopCategory } from '../systems/ShopManager';
import { SHOP_CATEGORIES } from '../systems/ShopManager';
import type { Inventory } from '../systems/Inventory';

export class ShopPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _mode: 'buy' | 'sell' = 'buy';
      private _category: ShopCategory = 'potion';
      private _shop: ShopManager;
      private _inventory: Inventory;

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
            this._el.innerHTML = '';

            // Title
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = `${this._mode === 'buy' ? '🛒 商店' : '📦 出售'}`;
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Mode toggle
            const modeBar = document.createElement('div');
            modeBar.className = 'shop-mode-bar';
            for (const m of ['buy', 'sell'] as const) {
                  const btn = document.createElement('button');
                  btn.className = `shop-mode-btn${m === this._mode ? ' shop-mode-active' : ''}`;
                  btn.textContent = m === 'buy' ? '💰 購買' : '📦 出售';
                  btn.addEventListener('click', () => { this._mode = m; this._render(); });
                  modeBar.appendChild(btn);
            }
            this._el.appendChild(modeBar);

            // Layout: tabs left + grid right
            const body = document.createElement('div');
            body.className = 'shop-body';

            // Category tabs
            const tabs = document.createElement('div');
            tabs.className = 'shop-tabs';
            for (const cat of SHOP_CATEGORIES) {
                  const btn = document.createElement('button');
                  btn.className = `shop-tab${cat.id === this._category ? ' shop-tab-active' : ''}`;
                  btn.innerHTML = `${cat.icon}<br>${cat.label}`;
                  btn.addEventListener('click', () => { this._category = cat.id; this._render(); });
                  tabs.appendChild(btn);
            }
            body.appendChild(tabs);

            // Item grid
            const grid = document.createElement('div');
            grid.className = 'shop-grid';

            if (this._mode === 'buy') {
                  const items = this._shop.getByCategory(this._category);
                  for (const item of items) {
                        const card = document.createElement('div');
                        card.className = 'shop-item';
                        card.innerHTML = `
                              <div class="shop-item-icon">${item.icon}</div>
                              <div class="shop-item-info">
                                    <div class="shop-item-name">${item.name}</div>
                                    <div class="shop-item-desc">${item.description}</div>
                                    <div class="shop-item-price">💰 ${item.price}</div>
                              </div>
                              <button class="shop-buy-btn btn-gold">購買</button>
                        `;
                        const buyBtn = card.querySelector('.shop-buy-btn')!;
                        buyBtn.addEventListener('click', (e) => {
                              e.stopPropagation();
                              if (this._shop.buy(item.id, 1, this._inventory)) {
                                    this._showFeedback(`✅ 購買 ${item.name}`, '#27AE60');
                              } else {
                                    this._showFeedback('❌ 金幣不足', '#E74C3C');
                              }
                              this._render();
                        });
                        grid.appendChild(card);
                  }
                  if (items.length === 0) {
                        grid.innerHTML = '<div class="shop-empty">此分類暫無商品</div>';
                  }
            } else {
                  // Sell mode — show inventory items
                  const invItems = this._inventory.items.filter(i => i.type !== 'quest');
                  for (const item of invItems) {
                        const sellPrice = this._shop.getSellPrice(item.itemId);
                        const card = document.createElement('div');
                        card.className = 'shop-item';
                        card.innerHTML = `
                              <div class="shop-item-icon">${item.icon}</div>
                              <div class="shop-item-info">
                                    <div class="shop-item-name">${item.name} ×${item.qty}</div>
                                    <div class="shop-item-desc">${item.description}</div>
                                    <div class="shop-item-price" style="color:#27AE60">+💰 ${sellPrice}</div>
                              </div>
                              <button class="shop-sell-btn">出售</button>
                        `;
                        const sellBtn = card.querySelector('.shop-sell-btn')!;
                        sellBtn.addEventListener('click', (e) => {
                              e.stopPropagation();
                              const gold = this._shop.sell(item.itemId, 1, this._inventory);
                              if (gold > 0) {
                                    this._showFeedback(`📦 出售獲得 ${gold}💰`, '#E8C96A');
                              }
                              this._render();
                        });
                        grid.appendChild(card);
                  }
                  if (invItems.length === 0) {
                        grid.innerHTML = '<div class="shop-empty">背包空空如也</div>';
                  }
            }

            body.appendChild(grid);
            this._el.appendChild(body);

            // Gold display
            const goldBar = document.createElement('div');
            goldBar.className = 'shop-gold-bar';
            goldBar.innerHTML = `💰 <span class="shop-gold-val">${this._inventory.gold.toLocaleString()}</span> GP`;
            this._el.appendChild(goldBar);
      }

      private _showFeedback(msg: string, color: string): void {
            const el = document.createElement('div');
            el.className = 'pickup-text';
            el.style.color = color;
            el.textContent = msg;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 2000);
      }

      show(mode: 'buy' | 'sell' = 'buy'): void {
            this._mode = mode;
            this._visible = true;
            this._el.style.display = 'block';
            this._render();
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      dispose(): void { this._el.remove(); }
}
