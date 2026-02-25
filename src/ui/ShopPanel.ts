import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Observable } from "@babylonjs/core/Misc/observable";
import { ItemDatabase, ItemDef, RARITY_COLORS, RARITY_BG } from "../systems/ItemDatabase";
import { Inventory } from "../systems/Inventory";
import { Player } from "../entities/Player";

/**
 * ShopPanel — Buy/Sell overlay with tabs
 * Glassmorphic aesthetic matching the HUD and Inventory
 */
export class ShopPanel {
      private ui: AdvancedDynamicTexture;
      private panel!: Rectangle;
      private shopList!: StackPanel;
      private goldDisplay!: TextBlock;
      private feedbackText!: TextBlock;
      private isOpen = false;

      public readonly onPurchase = new Observable<{ itemId: string; price: number }>();

      constructor(private scene: Scene, private player: Player, private inventory: Inventory) {
            this.ui = AdvancedDynamicTexture.CreateFullscreenUI("shopUI", true, scene);
            this.ui.idealHeight = 1624;
            this.ui.renderAtIdealSize = true;
            this.ui.isForeground = true;
            this.buildPanel();
            this.hide();
      }

      private buildPanel(): void {
            this.panel = new Rectangle("shopPanel");
            this.panel.width = "100%";
            this.panel.height = "100%";
            this.panel.background = "rgba(5, 5, 10, 0.94)";
            this.panel.thickness = 0;
            this.ui.addControl(this.panel);

            // Header
            const header = new TextBlock("shopHeader", "🛒 MERCHANT SHOP");
            header.color = "#faad14";
            header.fontSize = 30;
            header.fontFamily = "'Cinzel', serif";
            header.fontWeight = "700";
            header.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            header.top = "60px";
            header.shadowColor = "rgba(0,0,0,0.8)";
            header.shadowBlur = 6;
            this.panel.addControl(header);

            // Gold display
            this.goldDisplay = new TextBlock("shopGold", "🪙 0");
            this.goldDisplay.color = "#faad14";
            this.goldDisplay.fontSize = 22;
            this.goldDisplay.fontFamily = "'Inter', sans-serif";
            this.goldDisplay.fontWeight = "600";
            this.goldDisplay.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.goldDisplay.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            this.goldDisplay.top = "66px";
            this.goldDisplay.left = "-30px";
            this.panel.addControl(this.goldDisplay);

            // Close button
            const closeBtn = new Rectangle("shopClose");
            closeBtn.width = "48px";
            closeBtn.height = "48px";
            closeBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            closeBtn.top = "55px";
            closeBtn.left = "20px";
            closeBtn.background = "rgba(255,255,255,0.1)";
            closeBtn.color = "rgba(255,255,255,0.3)";
            closeBtn.thickness = 1;
            closeBtn.cornerRadius = 24;
            this.panel.addControl(closeBtn);

            const closeTxt = new TextBlock("shopCloseX", "✕");
            closeTxt.color = "#ffffff";
            closeTxt.fontSize = 24;
            closeBtn.addControl(closeTxt);
            closeBtn.onPointerClickObservable.add(() => this.hide());

            // Feedback text (e.g. "Not enough gold!")
            this.feedbackText = new TextBlock("shopFeedback", "");
            this.feedbackText.color = "#ff4d4f";
            this.feedbackText.fontSize = 18;
            this.feedbackText.fontFamily = "'Inter', sans-serif";
            this.feedbackText.fontWeight = "600";
            this.feedbackText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.feedbackText.top = "108px";
            this.feedbackText.alpha = 0;
            this.panel.addControl(this.feedbackText);

            // ScrollViewer for shop items
            const scroll = new ScrollViewer("shopScroll");
            scroll.width = "500px";
            scroll.height = "1100px";
            scroll.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            scroll.top = "140px";
            scroll.barSize = 6;
            scroll.barColor = "rgba(255,255,255,0.3)";
            scroll.thickness = 0;
            this.panel.addControl(scroll);

            this.shopList = new StackPanel("shopList");
            this.shopList.isVertical = true;
            this.shopList.width = "480px";
            this.shopList.spacing = 8;
            scroll.addControl(this.shopList);

            this.populateShop();
      }

      private populateShop(): void {
            const items = ItemDatabase.getShopItems();

            for (const item of items) {
                  const row = new Rectangle(`shop_${item.id}`);
                  row.width = "470px";
                  row.height = "100px";
                  row.background = RARITY_BG[item.rarity];
                  row.color = RARITY_COLORS[item.rarity] + "55";
                  row.thickness = 1.5;
                  row.cornerRadius = 12;
                  this.shopList.addControl(row);

                  // Icon
                  const icon = new TextBlock(`sIcon_${item.id}`, item.icon);
                  icon.fontSize = 38;
                  icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  icon.left = "18px";
                  row.addControl(icon);

                  // Name
                  const name = new TextBlock(`sName_${item.id}`, item.name);
                  name.color = RARITY_COLORS[item.rarity];
                  name.fontSize = 20;
                  name.fontFamily = "'Inter', sans-serif";
                  name.fontWeight = "700";
                  name.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  name.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  name.left = "72px";
                  name.top = "14px";
                  name.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  row.addControl(name);

                  // Description
                  const desc = new TextBlock(`sDesc_${item.id}`, item.description);
                  desc.color = "rgba(255,255,255,0.55)";
                  desc.fontSize = 14;
                  desc.fontFamily = "'Inter', sans-serif";
                  desc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  desc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  desc.left = "72px";
                  desc.top = "40px";
                  desc.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  row.addControl(desc);

                  // Stats
                  const statsArr: string[] = [];
                  if (item.stats?.atk) statsArr.push(`ATK+${item.stats.atk}`);
                  if (item.stats?.def) statsArr.push(`DEF+${item.stats.def}`);
                  if (item.stats?.hp) statsArr.push(`HP+${item.stats.hp}`);
                  if (item.stats?.mp) statsArr.push(`MP+${item.stats.mp}`);
                  if (statsArr.length) {
                        const stats = new TextBlock(`sStat_${item.id}`, statsArr.join(" "));
                        stats.color = "#73d13d";
                        stats.fontSize = 13;
                        stats.fontFamily = "'Inter', sans-serif";
                        stats.fontWeight = "600";
                        stats.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                        stats.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                        stats.left = "72px";
                        stats.top = "-10px";
                        stats.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                        row.addControl(stats);
                  }

                  // Buy button
                  const buyBtn = new Rectangle(`sBuy_${item.id}`);
                  buyBtn.width = "100px";
                  buyBtn.height = "38px";
                  buyBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                  buyBtn.left = "-12px";
                  buyBtn.background = "rgba(250, 173, 20, 0.25)";
                  buyBtn.color = "rgba(250, 173, 20, 0.6)";
                  buyBtn.thickness = 1.5;
                  buyBtn.cornerRadius = 19;
                  row.addControl(buyBtn);

                  const price = new TextBlock(`sPrice_${item.id}`, `🪙 ${item.price}`);
                  price.color = "#faad14";
                  price.fontSize = 15;
                  price.fontFamily = "'Inter', sans-serif";
                  price.fontWeight = "700";
                  buyBtn.addControl(price);

                  buyBtn.onPointerDownObservable.add(() => { buyBtn.scaleX = 0.92; buyBtn.scaleY = 0.92; });
                  buyBtn.onPointerUpObservable.add(() => { buyBtn.scaleX = 1; buyBtn.scaleY = 1; });
                  buyBtn.onPointerClickObservable.add(() => this.buyItem(item));
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
            this.showFeedback(`Purchased ${item.name}!`, "#73d13d");
            this.onPurchase.notifyObservers({ itemId: item.id, price: item.price });
            console.log(`[Shop] Bought ${item.name} for 🪙${item.price}`);
      }

      private showFeedback(msg: string, color: string): void {
            this.feedbackText.text = msg;
            this.feedbackText.color = color;
            this.feedbackText.alpha = 1;
            let t = 0;
            const obs = this.scene.onBeforeRenderObservable.add(() => {
                  t++;
                  if (t > 90) {
                        this.feedbackText.alpha = Math.max(0, this.feedbackText.alpha - 0.05);
                        if (this.feedbackText.alpha <= 0) {
                              this.scene.onBeforeRenderObservable.remove(obs);
                        }
                  }
            });
      }

      private updateGold(): void {
            const s = this.player.getStats();
            this.goldDisplay.text = `🪙 ${(s.gold / 1000).toFixed(1)}K`;
      }

      public show(): void {
            this.isOpen = true;
            this.panel.isVisible = true;
            this.updateGold();
      }

      public hide(): void {
            this.isOpen = false;
            this.panel.isVisible = false;
      }

      public toggle(): void {
            this.isOpen ? this.hide() : this.show();
      }

      public getIsOpen(): boolean {
            return this.isOpen;
      }

      public dispose(): void {
            this.ui.dispose();
            this.onPurchase.clear();
      }
}
