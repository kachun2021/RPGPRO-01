import type { Inventory, InventoryItem } from '../systems/Inventory';
import type { ItemRarity } from '../systems/DropTable';

type Tab = 'equipment' | 'consumable' | 'material' | 'quest';

const TAB_LABELS: { id: Tab; label: string; icon: string }[] = [
      { id: 'equipment', label: '裝備', icon: '🛡️' },
      { id: 'consumable', label: '消耗', icon: '🧪' },
      { id: 'material', label: '材料', icon: '⛏️' },
      { id: 'quest', label: '任務', icon: '📜' },
];

const RARITY_BORDER: Record<ItemRarity, string> = {
      common: 'rgba(160,160,160,0.35)',
      uncommon: 'rgba(60,130,255,0.6)',
      rare: 'rgba(155,80,220,0.6)',
      epic: 'rgba(232,201,106,0.7)',
      legendary: 'rgba(255,100,30,0.8)',
};

/**
 * InventoryPanel — Center popup with 4 tabs + 6-column grid.
 * Click item → tooltip. Actions: use/discard.
 */
export class InventoryPanel {
      private _el: HTMLDivElement;
      private _body!: HTMLDivElement;
      private _goldEl!: HTMLSpanElement;
      private _tooltip!: HTMLDivElement;
      private _visible = false;
      private _currentTab: Tab = 'equipment';
      private _inventory: Inventory;

      get element(): HTMLDivElement { return this._el; }

      constructor(inventory: Inventory) {
            this._inventory = inventory;

            this._el = document.createElement('div');
            this._el.id = 'inventory-panel';
            this._el.className = 'sa-panel inv-root';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);

            // Auto-refresh on inventory change
            inventory.onChange = () => { if (this._visible) this._renderGrid(); };
      }

      private _buildShell(): void {
            // Title
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '🎒 背包';
            this._goldEl = document.createElement('span');
            this._goldEl.className = 'inv-gold';
            this._goldEl.textContent = '💰 0';
            title.appendChild(this._goldEl);
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Tabs
            const tabBar = document.createElement('div');
            tabBar.className = 'inv-tabs';
            for (const t of TAB_LABELS) {
                  const btn = document.createElement('button');
                  btn.className = 'inv-tab';
                  btn.dataset.tab = t.id;
                  btn.textContent = `${t.icon} ${t.label}`;
                  if (t.id === this._currentTab) btn.classList.add('inv-tab-active');
                  btn.addEventListener('click', () => {
                        this._currentTab = t.id;
                        tabBar.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('inv-tab-active'));
                        btn.classList.add('inv-tab-active');
                        this._renderGrid();
                  });
                  tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);

            // Sort button
            const sortBtn = document.createElement('button');
            sortBtn.className = 'inv-sort-btn';
            sortBtn.textContent = '🔄 整理';
            sortBtn.addEventListener('click', () => { this._inventory.sort(); });
            tabBar.appendChild(sortBtn);

            // Grid body
            this._body = document.createElement('div');
            this._body.className = 'inv-grid';
            this._el.appendChild(this._body);

            // Tooltip (hidden)
            this._tooltip = document.createElement('div');
            this._tooltip.className = 'inv-tooltip';
            this._tooltip.style.display = 'none';
            this._el.appendChild(this._tooltip);
      }

      private _renderGrid(): void {
            this._body.innerHTML = '';
            this._goldEl.textContent = `💰 ${this._inventory.gold.toLocaleString()}`;

            const items = this._inventory.getByTab(this._currentTab);

            // Fill 6-column grid (min 18 slots shown)
            const slotCount = Math.max(18, Math.ceil(items.length / 6) * 6);
            for (let i = 0; i < slotCount; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'inv-slot';

                  if (i < items.length) {
                        const item = items[i];
                        slot.classList.add('inv-slot-filled');
                        slot.style.borderColor = RARITY_BORDER[item.rarity];
                        slot.innerHTML = `
                              <span class="inv-icon">${item.icon}</span>
                              ${item.qty > 1 ? `<span class="inv-qty">×${item.qty}</span>` : ''}
                        `;
                        slot.addEventListener('click', (e) => this._showTooltip(item, e));
                  }

                  this._body.appendChild(slot);
            }
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

            // Position near click
            const rect = this._el.getBoundingClientRect();
            const x = Math.min(e.clientX - rect.left + 8, rect.width - 180);
            const y = Math.min(e.clientY - rect.top + 8, rect.height - 140);
            this._tooltip.style.left = x + 'px';
            this._tooltip.style.top = y + 'px';

            // Bind actions
            this._tooltip.querySelector('.inv-use-btn')?.addEventListener('click', () => {
                  console.log('[Inventory] Used:', item.name);
                  this._inventory.removeItem(item.itemId, 1);
                  this._tooltip.style.display = 'none';
            });
            this._tooltip.querySelector('.inv-discard-btn')?.addEventListener('click', () => {
                  this._inventory.removeItem(item.itemId, item.qty);
                  this._tooltip.style.display = 'none';
            });

            // Close on outside click
            const closeTT = (ev: MouseEvent) => {
                  if (!this._tooltip.contains(ev.target as Node)) {
                        this._tooltip.style.display = 'none';
                        document.removeEventListener('click', closeTT);
                  }
            };
            setTimeout(() => document.addEventListener('click', closeTT), 10);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._renderGrid(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; this._tooltip.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
