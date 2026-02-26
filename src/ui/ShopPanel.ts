import { Scene } from "@babylonjs/core/scene";
import { Observable } from "@babylonjs/core/Misc/observable";
import { ItemDatabase, ItemDef, RARITY_COLORS, RARITY_BG } from "../systems/ItemDatabase";
import { Inventory } from "../systems/Inventory";
import { Player } from "../entities/Player";

/**
 * Premium DOM-based Shop Panel
 * Scrolling list with Glassmorphism and CSS animations
 */
export class ShopPanel {
      private isOpen = false;
      private container: HTMLElement;
      private rootDiv: HTMLElement;

      private shopList!: HTMLElement;
      private goldDisplay!: HTMLElement;
      private feedbackText!: HTMLElement;

      public readonly onPurchase = new Observable<{ itemId: string; price: number }>();

      constructor(private scene: Scene, private player: Player, private inventory: Inventory) {
            this.container = document.getElementById("ui-layer") || document.body;
            this.injectCSS();

            this.rootDiv = document.createElement("div");
            this.rootDiv.className = "shop-panel-root";
            this.container.appendChild(this.rootDiv);

            this.buildDOM();
            this.populateShop();
            this.hide(); // Start hidden
      }

      private injectCSS() {
            if (document.getElementById("shop-styles")) return;
            const style = document.createElement("style");
            style.id = "shop-styles";
            style.textContent = `
            .shop-panel-root { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; z-index: 55; transition: background 0.3s; font-family: 'Inter', sans-serif;}
            .shop-panel-root.open { pointer-events: auto; background: rgba(2, 2, 6, 0.85); }
            
            .shop-container { width: 92%; max-width: 550px; height: 90%; background: rgba(10, 10, 16, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(120, 90, 255, 0.25); border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; transform: scale(0.95); opacity: 0; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1); position: relative; overflow: hidden; }
            .shop-panel-root.open .shop-container { transform: scale(1); opacity: 1; }
            
            .shop-header { height: 75px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: linear-gradient(180deg, rgba(80, 50, 200, 0.15) 0%, transparent 100%); border-bottom: 1px solid rgba(120, 90, 255, 0.15); }
            .shop-title { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: #c084fc; text-shadow: 0 2px 8px rgba(120,90,255,0.6); letter-spacing: 2px;}
            
            .shop-gold { font-size: 20px; font-weight: 600; color: #fbbf24; background: rgba(251,191,36,0.1); padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(251,191,36,0.2); }
            
            .shop-feedback { height: 30px; display: flex; justify-content: center; align-items: center; font-size: 15px; font-weight: 600; opacity: 0; transition: opacity 0.3s; margin-top: 5px;}
            
            .shop-list-container { flex: 1; overflow-y: auto; padding: 10px 20px 24px 20px; }
            .shop-list-container::-webkit-scrollbar { width: 6px; }
            .shop-list-container::-webkit-scrollbar-thumb { background: rgba(120,90,255,0.4); border-radius: 6px; }
            .shop-list { display: flex; flex-direction: column; gap: 12px; }
            
            .shop-item { display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; transition: transform 0.2s, background 0.2s, box-shadow 0.2s; }
            .shop-item:hover { transform: translateY(-2px); background: rgba(255,255,255,0.05); box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
            
            .shop-icon { font-size: 44px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8)); }
            .shop-info { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
            
            .shop-name { font-size: 18px; font-weight: 700; }
            .shop-desc { font-size: 13px; color: rgba(226,232,240,0.6); line-height: 1.4; }
            .shop-stats { font-size: 12px; font-weight: 600; color: #22d3ee; margin-top: 2px;}
            
            .btn-buy { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; background: rgba(192, 132, 252, 0.15); border: 1px solid rgba(192, 132, 252, 0.4); border-radius: 20px; color: #fbbf24; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; min-width: 100px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);}
            .btn-buy:active { transform: scale(0.95); background: rgba(192,132,252,0.3); }
            
            .btn-close-shop { position: absolute; top: -15px; right: -15px; width: 44px; height: 44px; border-radius: 22px; background: #e11d48; border: 2px solid #fff; color: #fff; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 20px; font-weight: bold; box-shadow: 0 4px 12px rgba(225,29,72,0.6); transition: transform 0.2s; z-index: 2;}
            .btn-close-shop:active { transform: scale(0.9); }
        `;
            document.head.appendChild(style);
      }

      private buildDOM() {
            this.rootDiv.innerHTML = `
            <div class="shop-container">
                <div class="shop-header">
                    <div class="shop-title">🛒 MERCHANT</div>
                    <div class="shop-gold" id="shop-gold">🪙 0</div>
                </div>
                
                <div class="shop-feedback" id="shop-feedback"></div>
                
                <div class="shop-list-container">
                    <div class="shop-list" id="shop-list"></div>
                </div>
                
                <button class="btn-close-shop" id="shop-btn-close">✕</button>
            </div>
        `;

            this.shopList = document.getElementById("shop-list")!;
            this.goldDisplay = document.getElementById("shop-gold")!;
            this.feedbackText = document.getElementById("shop-feedback")!;

            document.getElementById("shop-btn-close")!.addEventListener("pointerdown", () => this.hide());
            this.rootDiv.addEventListener("pointerdown", (e) => {
                  if (e.target === this.rootDiv) this.hide();
            });
      }

      private populateShop(): void {
            const items = ItemDatabase.getShopItems();
            this.shopList.innerHTML = ""; // Clear existing

            for (const item of items) {
                  const row = document.createElement("div");
                  row.className = "shop-item";
                  row.style.background = RARITY_BG[item.rarity];
                  row.style.borderColor = `${RARITY_COLORS[item.rarity]}44`;

                  let statsHtml = "";
                  const statsArr: string[] = [];
                  if (item.stats?.atk) statsArr.push(`ATK+${item.stats.atk}`);
                  if (item.stats?.def) statsArr.push(`DEF+${item.stats.def}`);
                  if (item.stats?.hp) statsArr.push(`HP+${item.stats.hp}`);
                  if (item.stats?.mp) statsArr.push(`MP+${item.stats.mp}`);
                  if (statsArr.length > 0) {
                        statsHtml = `<div class="shop-stats">${statsArr.join(" ")}</div>`;
                  }

                  row.innerHTML = `
                <div class="shop-icon">${item.icon}</div>
                <div class="shop-info">
                    <div class="shop-name" style="color: ${RARITY_COLORS[item.rarity]}">${item.name}</div>
                    <div class="shop-desc">${item.description}</div>
                    ${statsHtml}
                </div>
                <button class="btn-buy" id="buy-btn-${item.id}">
                    <span>🪙</span>
                    <span>${item.price}</span>
                </button>
            `;

                  this.shopList.appendChild(row);

                  const buyBtn = document.getElementById(`buy-btn-${item.id}`);
                  if (buyBtn) {
                        buyBtn.addEventListener("pointerdown", () => this.buyItem(item));
                  }
            }
      }

      private buyItem(item: ItemDef): void {
            const stats = this.player.getStats();
            if (stats.gold < item.price) {
                  this.showFeedback("Not enough gold!", "#ff4d4f");
                  return;
            }
            if (this.inventory.isFull() && !this.inventory.hasItem(item.id)) {
                  this.showFeedback("Inventory full!", "#ff4d4f");
                  return;
            }

            this.player.setStats({ gold: stats.gold - item.price });
            this.inventory.addItem(item.id, 1);
            this.updateGold();
            this.showFeedback(`Purchased ${item.name}!`, "#4ade80");
            this.onPurchase.notifyObservers({ itemId: item.id, price: item.price });
      }

      private feedbackTimeout: number | null = null;
      private showFeedback(msg: string, color: string): void {
            this.feedbackText.innerText = msg;
            this.feedbackText.style.color = color;
            this.feedbackText.style.opacity = "1";

            if (this.feedbackTimeout) window.clearTimeout(this.feedbackTimeout);
            this.feedbackTimeout = window.setTimeout(() => {
                  this.feedbackText.style.opacity = "0";
            }, 2000);
      }

      private updateGold(): void {
            const s = this.player.getStats();
            this.goldDisplay.innerText = `🪙 ${(s.gold / 1000).toFixed(1)}K`;
      }

      public show(): void {
            this.isOpen = true;
            this.rootDiv.classList.add("open");
            this.updateGold();
      }

      public hide(): void {
            this.isOpen = false;
            this.rootDiv.classList.remove("open");
      }

      public toggle(): void {
            this.isOpen ? this.hide() : this.show();
      }

      public getIsOpen(): boolean {
            return this.isOpen;
      }

      public dispose(): void {
            this.onPurchase.clear();
            this.rootDiv.remove();
            if (this.feedbackTimeout) window.clearTimeout(this.feedbackTimeout);
      }
}
