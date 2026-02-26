import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Inventory, InventorySlot } from "../systems/Inventory";
import { ItemDatabase, ItemDef, RARITY_COLORS, RARITY_BG } from "../systems/ItemDatabase";
import { Player } from "../entities/Player";

/**
 * InventoryPanel — Full-screen Dark Abyss 5×6 grid overlay
 * Deep dark panels with purple electric borders
 */
export class InventoryPanel {
      private ui: AdvancedDynamicTexture;
      private panel!: Rectangle;
      private gridContainer!: Rectangle;
      private detailPanel!: Rectangle;
      private detailName!: TextBlock;
      private detailDesc!: TextBlock;
      private detailStats!: TextBlock;
      private detailPrice!: TextBlock;
      private selectedItem: ItemDef | null = null;
      private slotCells: Rectangle[] = [];
      private isOpen = false;

      constructor(private scene: Scene, private inventory: Inventory, private player: Player) {
            this.ui = AdvancedDynamicTexture.CreateFullscreenUI("inventoryUI", true, scene);
            // removed renderAtIdealSize
            this.ui.isForeground = true;
            this.buildPanel();
            this.inventory.onChanged.add(() => this.refreshGrid());
            this.hide();
      }

      private buildPanel(): void {
            // Backdrop
            this.panel = new Rectangle("invPanel");
            this.panel.width = "100%";
            this.panel.height = "100%";
            this.panel.background = "rgba(4, 4, 8, 0.96)";
            this.panel.thickness = 0;
            this.ui.addControl(this.panel);

            // Header
            const header = new TextBlock("invHeader", "🎒 INVENTORY");
            header.color = "#e2e8f0";
            header.fontSize = 32;
            header.fontFamily = "'Cinzel', serif";
            header.fontWeight = "700";
            header.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            header.top = "60px";
            header.shadowColor = "rgba(120, 60, 255, 0.5)";
            header.shadowBlur = 10;
            this.panel.addControl(header);

            // Close button
            const closeBtn = new Rectangle("invClose");
            closeBtn.width = "48px";
            closeBtn.height = "48px";
            closeBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            closeBtn.top = "55px";
            closeBtn.left = "-20px";
            closeBtn.background = "rgba(120, 90, 255, 0.12)";
            closeBtn.color = "rgba(168, 85, 247, 0.4)";
            closeBtn.thickness = 1;
            closeBtn.cornerRadius = 24;
            this.panel.addControl(closeBtn);

            const closeTxt = new TextBlock("closeX", "✕");
            closeTxt.color = "#ffffff";
            closeTxt.fontSize = 24;
            closeBtn.addControl(closeTxt);
            closeBtn.onPointerClickObservable.add(() => this.hide());

            // Grid area (5×6)
            this.gridContainer = new Rectangle("invGrid");
            this.gridContainer.width = "480px";
            this.gridContainer.height = "600px";
            this.gridContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.gridContainer.top = "130px";
            this.gridContainer.thickness = 0;
            this.panel.addControl(this.gridContainer);

            this.createGrid();

            // Detail panel (bottom)
            this.detailPanel = new Rectangle("invDetail");
            this.detailPanel.width = "480px";
            this.detailPanel.height = "280px";
            this.detailPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.detailPanel.top = "-80px";
            this.detailPanel.background = "rgba(8, 8, 14, 0.92)";
            this.detailPanel.color = "rgba(120, 90, 255, 0.25)";
            this.detailPanel.thickness = 1.5;
            this.detailPanel.cornerRadius = 16;
            this.detailPanel.isVisible = false;
            this.panel.addControl(this.detailPanel);

            this.detailName = new TextBlock("detName", "");
            this.detailName.color = "#e2e8f0";
            this.detailName.fontSize = 24;
            this.detailName.fontFamily = "'Inter', sans-serif";
            this.detailName.fontWeight = "700";
            this.detailName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.detailName.top = "20px";
            this.detailPanel.addControl(this.detailName);

            this.detailDesc = new TextBlock("detDesc", "");
            this.detailDesc.color = "rgba(255,255,255,0.7)";
            this.detailDesc.fontSize = 16;
            this.detailDesc.fontFamily = "'Inter', sans-serif";
            this.detailDesc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.detailDesc.top = "55px";
            this.detailDesc.textWrapping = true;
            this.detailDesc.width = "440px";
            this.detailPanel.addControl(this.detailDesc);

            this.detailStats = new TextBlock("detStats", "");
            this.detailStats.color = "#22d3ee";
            this.detailStats.fontSize = 16;
            this.detailStats.fontFamily = "'Inter', sans-serif";
            this.detailStats.fontWeight = "600";
            this.detailStats.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.detailStats.top = "95px";
            this.detailPanel.addControl(this.detailStats);

            this.detailPrice = new TextBlock("detPrice", "");
            this.detailPrice.color = "#fbbf24";
            this.detailPrice.fontSize = 16;
            this.detailPrice.fontFamily = "'Inter', sans-serif";
            this.detailPrice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.detailPrice.top = "125px";
            this.detailPanel.addControl(this.detailPrice);

            // Use / Sell buttons
            const useBtn = new Rectangle("useBtn");
            useBtn.width = "140px";
            useBtn.height = "44px";
            useBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            useBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            useBtn.left = "30px";
            useBtn.top = "-20px";
            useBtn.background = "rgba(34, 211, 238, 0.2)";
            useBtn.color = "rgba(34, 211, 238, 0.5)";
            useBtn.thickness = 1.5;
            useBtn.cornerRadius = 22;
            this.detailPanel.addControl(useBtn);

            const useTxt = new TextBlock("useTxt", "⚡ USE");
            useTxt.color = "#22d3ee";
            useTxt.fontSize = 16;
            useTxt.fontFamily = "'Inter', sans-serif";
            useTxt.fontWeight = "700";
            useBtn.addControl(useTxt);
            useBtn.onPointerClickObservable.add(() => this.useSelectedItem());

            const sellBtn = new Rectangle("sellBtn");
            sellBtn.width = "140px";
            sellBtn.height = "44px";
            sellBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            sellBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            sellBtn.left = "-30px";
            sellBtn.top = "-20px";
            sellBtn.background = "rgba(251, 191, 36, 0.15)";
            sellBtn.color = "rgba(251, 191, 36, 0.4)";
            sellBtn.thickness = 1.5;
            sellBtn.cornerRadius = 22;
            this.detailPanel.addControl(sellBtn);

            const sellTxt = new TextBlock("sellTxt", "🪙 SELL");
            sellTxt.color = "#fbbf24";
            sellTxt.fontSize = 16;
            sellTxt.fontFamily = "'Inter', sans-serif";
            sellTxt.fontWeight = "700";
            sellBtn.addControl(sellTxt);
            sellBtn.onPointerClickObservable.add(() => this.sellSelectedItem());
      }

      private createGrid(): void {
            const cols = 5, rows = 6;
            const cellSize = 88, gap = 8;
            const totalW = cols * (cellSize + gap);
            const totalH = rows * (cellSize + gap);
            const offsetX = -(totalW / 2) + cellSize / 2;
            const offsetY = -(totalH / 2) + cellSize / 2;

            for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                        const idx = row * cols + col;
                        const cell = new Rectangle(`invSlot_${idx}`);
                        cell.width = `${cellSize}px`;
                        cell.height = `${cellSize}px`;
                        cell.left = `${offsetX + col * (cellSize + gap)}px`;
                        cell.top = `${offsetY + row * (cellSize + gap)}px`;
                        cell.background = "rgba(255, 255, 255, 0.05)";
                        cell.color = "rgba(255, 255, 255, 0.15)";
                        cell.thickness = 1;
                        cell.cornerRadius = 10;
                        this.gridContainer.addControl(cell);
                        this.slotCells.push(cell);

                        cell.onPointerClickObservable.add(() => this.selectSlot(idx));
                  }
            }
      }

      private refreshGrid(): void {
            const slots = this.inventory.getAllSlots();
            for (let i = 0; i < this.slotCells.length; i++) {
                  const cell = this.slotCells[i];
                  // Clear existing children (keep only cell itself)
                  while (cell.children.length > 0) {
                        cell.removeControl(cell.children[0]);
                  }

                  const slot = i < slots.length ? slots[i] : null;
                  if (!slot) {
                        cell.background = "rgba(255, 255, 255, 0.05)";
                        cell.color = "rgba(255, 255, 255, 0.15)";
                        continue;
                  }

                  const def = ItemDatabase.get(slot.itemId);
                  if (!def) continue;

                  cell.background = RARITY_BG[def.rarity];
                  cell.color = RARITY_COLORS[def.rarity] + "88";

                  // Item icon
                  const icon = new TextBlock(`icon_${i}`, def.icon);
                  icon.fontSize = 36;
                  icon.top = "-6px";
                  cell.addControl(icon);

                  // Quantity badge
                  if (slot.quantity > 1) {
                        const qty = new TextBlock(`qty_${i}`, `x${slot.quantity}`);
                        qty.color = "#e2e8f0";
                        qty.fontSize = 14;
                        qty.fontFamily = "'Inter', sans-serif";
                        qty.fontWeight = "700";
                        qty.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                        qty.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                        qty.left = "-6px";
                        qty.top = "-4px";
                        qty.shadowColor = "rgba(0,0,0,0.9)";
                        qty.shadowBlur = 3;
                        cell.addControl(qty);
                  }
            }
      }

      private selectSlot(index: number): void {
            const slot = this.inventory.getSlot(index);
            if (!slot) {
                  this.detailPanel.isVisible = false;
                  this.selectedItem = null;
                  return;
            }

            const def = ItemDatabase.get(slot.itemId);
            if (!def) return;

            this.selectedItem = def;
            this.detailPanel.isVisible = true;
            this.detailName.text = `${def.icon} ${def.name}`;
            this.detailName.color = RARITY_COLORS[def.rarity];
            this.detailDesc.text = def.description;

            const statsArr: string[] = [];
            if (def.stats?.atk) statsArr.push(`ATK +${def.stats.atk}`);
            if (def.stats?.def) statsArr.push(`DEF +${def.stats.def}`);
            if (def.stats?.hp) statsArr.push(`HP +${def.stats.hp}`);
            if (def.stats?.mp) statsArr.push(`MP +${def.stats.mp}`);
            this.detailStats.text = statsArr.join("  ·  ");

            this.detailPrice.text = `Sell: 🪙 ${def.sellPrice}`;

            // Highlight selected cell
            for (let i = 0; i < this.slotCells.length; i++) {
                  this.slotCells[i].thickness = i === index ? 2.5 : 1;
            }
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
                        this.detailPanel.isVisible = false;
                        this.selectedItem = null;
                  }
            } else {

            }
      }

      private sellSelectedItem(): void {
            if (!this.selectedItem) return;
            const def = this.selectedItem;
            if (this.inventory.removeItem(def.id, 1)) {
                  this.player.addGold(def.sellPrice);

                  if (!this.inventory.hasItem(def.id)) {
                        this.detailPanel.isVisible = false;
                        this.selectedItem = null;
                  }
            }
      }

      public show(): void {
            this.isOpen = true;
            this.panel.isVisible = true;
            this.refreshGrid();
      }

      public hide(): void {
            this.isOpen = false;
            this.panel.isVisible = false;
            this.detailPanel.isVisible = false;
            this.selectedItem = null;
      }

      public toggle(): void {
            this.isOpen ? this.hide() : this.show();
      }

      public getIsOpen(): boolean {
            return this.isOpen;
      }

      public dispose(): void {
            this.ui.dispose();
      }
}
