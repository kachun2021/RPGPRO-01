import { Scene } from "@babylonjs/core/scene";
import { Inventory, InventorySlot } from "../systems/Inventory";
import { ItemDatabase, ItemDef, RARITY_COLORS, RARITY_BG } from "../systems/ItemDatabase";
import { Player } from "../entities/Player";

/**
 * Premium DOM-based Inventory Panel
 * 5x6 Grid with Glassmorphism and CSS transitions
 */
export class InventoryPanel {
      private isOpen = false;
      private container: HTMLElement;
      private rootDiv: HTMLElement;

      private gridContainer!: HTMLElement;
      private detailPanel!: HTMLElement;
      private detailName!: HTMLElement;
      private detailDesc!: HTMLElement;
      private detailStats!: HTMLElement;
      private detailPrice!: HTMLElement;

      private useBtn!: HTMLElement;
      private sellBtn!: HTMLElement;
      private closeBtn!: HTMLElement;

      private selectedItem: ItemDef | null = null;
      private selectedIndex: number = -1;

      constructor(private scene: Scene, private inventory: Inventory, private player: Player) {
            this.container = document.getElementById("ui-layer") || document.body;
            this.injectCSS();

            this.rootDiv = document.createElement("div");
            this.rootDiv.className = "inv-panel-root";
            this.container.appendChild(this.rootDiv);

            this.buildDOM();
            this.inventory.onChanged.add(() => this.refreshGrid());
            this.hide(); // Start hidden
      }

      private injectCSS() {
            if (document.getElementById("inv-styles")) return;
            const style = document.createElement("style");
            style.id = "inv-styles";
            style.textContent = `
            .inv-panel-root { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; z-index: 55; transition: background 0.3s; font-family: 'Inter', sans-serif;}
            .inv-panel-root.open { pointer-events: auto; background: rgba(2, 2, 6, 0.85); }
            
            .inv-container { width: 92%; max-width: 500px; height: 90%; background: rgba(10, 10, 16, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(120, 90, 255, 0.25); border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; transform: scale(0.95); opacity: 0; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1); position: relative; overflow: hidden; }
            .inv-panel-root.open .inv-container { transform: scale(1); opacity: 1; }
            
            .inv-header { height: 70px; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, rgba(120, 90, 255, 0.15) 0%, transparent 100%); border-bottom: 1px solid rgba(120, 90, 255, 0.15); }
            .inv-title { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: #e2e8f0; text-shadow: 0 2px 8px rgba(120,90,255,0.6); letter-spacing: 2px;}
            
            .inv-content { flex: 1; display: flex; flex-direction: column; padding: 16px; gap: 16px; overflow-y: auto; }
            .inv-content::-webkit-scrollbar { width: 4px; }
            .inv-content::-webkit-scrollbar-thumb { background: rgba(120,90,255,0.4); border-radius: 4px; }
            
            .inv-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 16px; border: 1px inset rgba(255,255,255,0.05);}
            .inv-slot { aspect-ratio: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center; position: relative; cursor: pointer; transition: all 0.2s; user-select: none; }
            .inv-slot:hover { border-color: rgba(120,90,255,0.6); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(120,90,255,0.2); }
            .inv-slot.selected { border: 2px solid #a855f7; box-shadow: 0 0 16px rgba(168,85,247,0.5); transform: scale(0.95); }
            
            .inv-slot-icon { font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8)); pointer-events: none;}
            .inv-slot-qty { position: absolute; bottom: 2px; right: 6px; font-size: 13px; font-weight: 800; color: #fff; text-shadow: 0 1px 3px #000, 0 -1px 1px #000, 1px 0 1px #000, -1px 0 1px #000; pointer-events: none; }
            
            .inv-detail { background: rgba(6, 6, 12, 0.7); border: 1px solid rgba(120, 90, 255, 0.2); border-radius: 16px; padding: 20px; display: none; flex-direction: column; gap: 12px; animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1); }
            .inv-detail.active { display: flex; }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            
            .det-name { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
            .det-desc { font-size: 14px; color: rgba(226,232,240,0.7); line-height: 1.4; }
            .det-stats { font-size: 14px; color: #22d3ee; font-weight: 600; background: rgba(34,211,238,0.1); padding: 8px 12px; border-radius: 8px; display: inline-block;}
            .det-price { font-size: 14px; color: #fbbf24; font-weight: 600; }
            
            .det-actions { display: flex; gap: 12px; margin-top: 8px; }
            .btn-use { flex: 1; padding: 12px; background: rgba(34, 211, 238, 0.15); border: 1px solid #22d3ee; border-radius: 20px; color: #22d3ee; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; }
            .btn-use:active { transform: scale(0.95); background: rgba(34,211,238,0.3); }
            .btn-sell { flex: 1; padding: 12px; background: rgba(251, 191, 36, 0.15); border: 1px solid #fbbf24; border-radius: 20px; color: #fbbf24; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; }
            .btn-sell:active { transform: scale(0.95); background: rgba(251,191,36,0.3); }
            
            .btn-close { position: absolute; top: 15px; right: 15px; width: 40px; height: 40px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.2s; font-size: 20px;}
            .btn-close:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }
        `;
            document.head.appendChild(style);
      }

      private buildDOM() {
            this.rootDiv.innerHTML = `
            <div class="inv-container">
                <button class="btn-close" id="inv-btn-close">✕</button>
                <div class="inv-header">
                    <div class="inv-title">🎒 INVENTORY</div>
                </div>
                
                <div class="inv-content">
                    <div class="inv-grid" id="inv-grid">
                        <!-- Slots injected via JS -->
                    </div>
                    
                    <div class="inv-detail" id="inv-detail">
                        <div class="det-name" id="det-name">---</div>
                        <div class="det-desc" id="det-desc">---</div>
                        <div class="det-stats" id="det-stats">---</div>
                        <div class="det-price" id="det-price">---</div>
                        <div class="det-actions">
                            <button class="btn-use" id="btn-use">⚡ USE</button>
                            <button class="btn-sell" id="btn-sell">🪙 SELL</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

            this.gridContainer = document.getElementById("inv-grid")!;
            this.detailPanel = document.getElementById("inv-detail")!;
            this.detailName = document.getElementById("det-name")!;
            this.detailDesc = document.getElementById("det-desc")!;
            this.detailStats = document.getElementById("det-stats")!;
            this.detailPrice = document.getElementById("det-price")!;
            this.useBtn = document.getElementById("btn-use")!;
            this.sellBtn = document.getElementById("btn-sell")!;
            this.closeBtn = document.getElementById("inv-btn-close")!;

            // Generate 30 slots (5x6)
            for (let i = 0; i < 30; i++) {
                  const slot = document.createElement("div");
                  slot.className = "inv-slot";
                  slot.id = `inv-slot-${i}`;

                  const icon = document.createElement("div");
                  icon.className = "inv-slot-icon";
                  icon.id = `inv-icon-${i}`;

                  const qty = document.createElement("div");
                  qty.className = "inv-slot-qty";
                  qty.id = `inv-qty-${i}`;

                  slot.appendChild(icon);
                  slot.appendChild(qty);
                  this.gridContainer.appendChild(slot);

                  slot.addEventListener("pointerdown", () => this.selectSlot(i));
            }

            this.closeBtn.addEventListener("pointerdown", () => this.hide());
            this.rootDiv.addEventListener("pointerdown", (e) => {
                  if (e.target === this.rootDiv) this.hide();
            });

            this.useBtn.addEventListener("pointerdown", () => this.useSelectedItem());
            this.sellBtn.addEventListener("pointerdown", () => this.sellSelectedItem());
      }

      private refreshGrid(): void {
            const slots = this.inventory.getAllSlots();
            for (let i = 0; i < 30; i++) {
                  const slotEl = document.getElementById(`inv-slot-${i}`);
                  const iconEl = document.getElementById(`inv-icon-${i}`);
                  const qtyEl = document.getElementById(`inv-qty-${i}`);
                  if (!slotEl || !iconEl || !qtyEl) continue;

                  const memSlot = i < slots.length ? slots[i] : null;
                  if (!memSlot) {
                        slotEl.style.background = "rgba(255,255,255,0.05)";
                        slotEl.style.borderColor = "rgba(255,255,255,0.1)";
                        slotEl.classList.remove("selected");
                        iconEl.innerText = "";
                        qtyEl.innerText = "";
                        continue;
                  }

                  const def = ItemDatabase.get(memSlot.itemId);
                  if (!def) continue;

                  slotEl.style.background = RARITY_BG[def.rarity];
                  slotEl.style.borderColor = `${RARITY_COLORS[def.rarity]}66`;

                  if (i === this.selectedIndex) {
                        slotEl.classList.add("selected");
                  } else {
                        slotEl.classList.remove("selected");
                  }

                  iconEl.innerText = def.icon;
                  qtyEl.innerText = memSlot.quantity > 1 ? `x${memSlot.quantity}` : "";
            }
      }

      private selectSlot(index: number): void {
            const slot = this.inventory.getSlot(index);

            // Remove class from old selection
            if (this.selectedIndex >= 0) {
                  const old = document.getElementById(`inv-slot-${this.selectedIndex}`);
                  if (old) old.classList.remove("selected");
            }

            this.selectedIndex = index;

            if (!slot) {
                  this.detailPanel.classList.remove("active");
                  this.selectedItem = null;
                  return;
            }

            const def = ItemDatabase.get(slot.itemId);
            if (!def) return;

            const el = document.getElementById(`inv-slot-${index}`);
            if (el) el.classList.add("selected");

            this.selectedItem = def;
            this.detailPanel.classList.add("active");

            this.detailName.innerHTML = `<span style="color:${RARITY_COLORS[def.rarity]}">${def.icon} ${def.name}</span>`;
            this.detailDesc.innerText = def.description;

            const statsArr: string[] = [];
            if (def.stats?.atk) statsArr.push(`ATK +${def.stats.atk}`);
            if (def.stats?.def) statsArr.push(`DEF +${def.stats.def}`);
            if (def.stats?.hp) statsArr.push(`HP +${def.stats.hp}`);
            if (def.stats?.mp) statsArr.push(`MP +${def.stats.mp}`);

            if (statsArr.length > 0) {
                  this.detailStats.style.display = "inline-block";
                  this.detailStats.innerText = statsArr.join("  ·  ");
            } else {
                  this.detailStats.style.display = "none";
            }

            this.detailPrice.innerText = `Sell: 🪙 ${def.sellPrice}`;
      }

      private useSelectedItem(): void {
            if (!this.selectedItem) return;
            const def = this.selectedItem;

            if (def.type === "consumable") {
                  if (def.stats?.hp) this.player.heal(def.stats.hp);
                  if (def.stats?.mp) {
                        const s = this.player.getStats();
                        this.player.setStats({ mp: Math.min(s.maxMp, s.mp + def.stats.mp) });
                  }
                  this.inventory.removeItem(def.id, 1);

                  if (!this.inventory.hasItem(def.id)) {
                        this.detailPanel.classList.remove("active");
                        this.selectedItem = null;
                        this.selectedIndex = -1;
                  }
            } else {
                  // Equipment logic could go here if implemented
            }
      }

      private sellSelectedItem(): void {
            if (!this.selectedItem) return;
            const def = this.selectedItem;
            if (this.inventory.removeItem(def.id, 1)) {
                  this.player.addGold(def.sellPrice);

                  if (!this.inventory.hasItem(def.id)) {
                        this.detailPanel.classList.remove("active");
                        this.selectedItem = null;
                        this.selectedIndex = -1;
                  }
            }
      }

      public show(): void {
            this.isOpen = true;
            this.rootDiv.classList.add("open");
            this.refreshGrid();
      }

      public hide(): void {
            this.isOpen = false;
            this.rootDiv.classList.remove("open");
            this.detailPanel.classList.remove("active");
            this.selectedItem = null;
            if (this.selectedIndex >= 0) {
                  const old = document.getElementById(`inv-slot-${this.selectedIndex}`);
                  if (old) old.classList.remove("selected");
                  this.selectedIndex = -1;
            }
      }

      public toggle(): void {
            this.isOpen ? this.hide() : this.show();
      }

      public getIsOpen(): boolean {
            return this.isOpen;
      }

      public dispose(): void {
            this.rootDiv.remove();
      }
}
