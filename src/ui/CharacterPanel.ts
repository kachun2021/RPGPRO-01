import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Player, PlayerStats, EquipmentSlots } from "../entities/Player";

/**
 * Vertical Character Panel — Premium Dark Gothic RPG
 * Full-screen overlay showing stats, equipment, and gear swap.
 * Slides in from right with animated transitions.
 */
export class CharacterPanel {
      private ui: AdvancedDynamicTexture;
      private container!: Rectangle;
      private backdrop!: Rectangle;
      private isOpen = false;

      // Dynamic text elements
      private levelText!: TextBlock;
      private hpText!: TextBlock;
      private mpText!: TextBlock;
      private staText!: TextBlock;
      private atkText!: TextBlock;
      private defText!: TextBlock;
      private expText!: TextBlock;
      private expFill!: Rectangle;
      private helmetSlotText!: TextBlock;
      private armorSlotText!: TextBlock;
      private weaponSlotText!: TextBlock;
      private accessorySlotText!: TextBlock;
      private helmetNameText!: TextBlock;

      constructor(private scene: Scene, private player: Player) {
            this.ui = AdvancedDynamicTexture.CreateFullscreenUI("charPanel", true, scene);
            this.ui.idealHeight = 1624;
            this.ui.renderAtIdealSize = false;
            this.ui.isForeground = true;

            this.buildPanel();
            this.bindPlayerData();
            this.hide(); // Start hidden

            console.log("[CharacterPanel] Initialized ✓");
      }

      // ═══════════════════════════════════════════════════════════════
      // ── PANEL CONSTRUCTION ────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private buildPanel(): void {
            // Dark backdrop
            this.backdrop = new Rectangle("charBackdrop");
            this.backdrop.width = "100%";
            this.backdrop.height = "100%";
            this.backdrop.background = "rgba(0, 0, 0, 0.75)";
            this.backdrop.color = "transparent";
            this.backdrop.thickness = 0;
            this.backdrop.isPointerBlocker = true;
            this.ui.addControl(this.backdrop);

            // Main panel container
            this.container = new Rectangle("charContainer");
            this.container.width = "92%";
            this.container.height = "88%";
            this.container.background = "rgba(12, 2, 8, 0.96)";
            this.container.color = "rgba(255, 80, 60, 0.4)";
            this.container.thickness = 2;
            this.container.cornerRadius = 24;
            this.container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            this.backdrop.addControl(this.container);

            // ── HEADER ──
            this.createHeader();

            // ── CHARACTER PREVIEW AREA ──
            this.createCharacterPreview();

            // ── STATS SECTION ──
            this.createStatsSection();

            // ── EQUIPMENT SECTION ──
            this.createEquipmentSection();

            // ── CLOSE BUTTON ──
            this.createCloseButton();
      }

      private createHeader(): void {
            const header = new Rectangle("charHeader");
            header.width = "100%";
            header.height = "80px";
            header.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            header.background = "rgba(100, 12, 18, 0.5)";
            header.color = "transparent";
            header.thickness = 0;
            header.cornerRadius = 24;
            this.container.addControl(header);

            const title = new TextBlock("charTitle", "⚔ Character");
            title.color = "#ffcc88";
            title.fontSize = 32;
            title.fontFamily = "'Georgia', serif";
            title.fontWeight = "bold";
            title.shadowColor = "rgba(0,0,0,0.95)";
            title.shadowBlur = 6;
            header.addControl(title);

            // Accent line
            const accent = new Rectangle("charAccent");
            accent.width = "100%";
            accent.height = "2px";
            accent.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            accent.top = "80px";
            accent.background = "rgba(255, 80, 60, 0.25)";
            accent.color = "transparent";
            accent.thickness = 0;
            this.container.addControl(accent);
      }

      private createCharacterPreview(): void {
            // Character name + level area
            const previewArea = new Rectangle("charPreviewArea");
            previewArea.width = "94%";
            previewArea.height = "180px";
            previewArea.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            previewArea.top = "95px";
            previewArea.background = "rgba(25, 5, 12, 0.6)";
            previewArea.color = "rgba(255, 80, 60, 0.2)";
            previewArea.thickness = 1;
            previewArea.cornerRadius = 16;
            this.container.addControl(previewArea);

            // Character avatar large
            const avatar = new Ellipse("charAvatarLg");
            avatar.width = "100px";
            avatar.height = "100px";
            avatar.color = "#ff5533";
            avatar.thickness = 3;
            avatar.background = "rgba(100, 12, 18, 0.7)";
            avatar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            avatar.left = "20px";
            previewArea.addControl(avatar);

            const avatarIcon = new TextBlock("charAvatarIcon", "🗡");
            avatarIcon.fontSize = 48;
            avatar.addControl(avatarIcon);

            // Name
            const name = new TextBlock("charName", "Dark Knight");
            name.color = "#ffe0cc";
            name.fontSize = 28;
            name.fontFamily = "'Georgia', serif";
            name.fontWeight = "bold";
            name.shadowColor = "rgba(0,0,0,0.95)";
            name.shadowBlur = 5;
            name.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            name.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            name.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            name.left = "140px";
            name.top = "18px";
            previewArea.addControl(name);

            // Class
            const cls = new TextBlock("charClass", "Crimson Order · Dark Warrior");
            cls.color = "rgba(255, 160, 130, 0.7)";
            cls.fontSize = 16;
            cls.fontFamily = "'Georgia', serif";
            cls.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            cls.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            cls.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            cls.left = "140px";
            cls.top = "52px";
            previewArea.addControl(cls);

            // Level badge (large)
            this.levelText = new TextBlock("charLevel", "Lv.1");
            this.levelText.color = "#ffcc44";
            this.levelText.fontSize = 26;
            this.levelText.fontWeight = "bold";
            this.levelText.shadowColor = "rgba(0,0,0,0.9)";
            this.levelText.shadowBlur = 4;
            this.levelText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.levelText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.levelText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.levelText.left = "140px";
            this.levelText.top = "80px";
            previewArea.addControl(this.levelText);

            // EXP bar
            const expContainer = new Rectangle("charExpContainer");
            expContainer.width = "90%";
            expContainer.height = "22px";
            expContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            expContainer.top = "-16px";
            expContainer.background = "rgba(0, 0, 0, 0.7)";
            expContainer.color = "rgba(255, 200, 100, 0.3)";
            expContainer.thickness = 1;
            expContainer.cornerRadius = 11;
            previewArea.addControl(expContainer);

            this.expFill = new Rectangle("charExpFill");
            this.expFill.width = "35%";
            this.expFill.height = "100%";
            this.expFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.expFill.background = "rgba(255, 180, 60, 0.7)";
            this.expFill.color = "transparent";
            this.expFill.thickness = 0;
            this.expFill.cornerRadius = 11;
            expContainer.addControl(this.expFill);

            this.expText = new TextBlock("charExpText", "EXP 350/1000");
            this.expText.color = "rgba(255, 220, 150, 0.95)";
            this.expText.fontSize = 14;
            this.expText.fontWeight = "bold";
            this.expText.shadowColor = "rgba(0,0,0,0.9)";
            this.expText.shadowBlur = 3;
            expContainer.addControl(this.expText);
      }

      private createStatsSection(): void {
            const statsPanel = new Rectangle("charStatsPanel");
            statsPanel.width = "94%";
            statsPanel.height = "200px";
            statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            statsPanel.top = "290px";
            statsPanel.background = "rgba(25, 5, 12, 0.5)";
            statsPanel.color = "rgba(255, 80, 60, 0.2)";
            statsPanel.thickness = 1;
            statsPanel.cornerRadius = 16;
            this.container.addControl(statsPanel);

            const statsTitle = new TextBlock("statsTitle", "📊 Combat Stats");
            statsTitle.color = "#ffcc88";
            statsTitle.fontSize = 20;
            statsTitle.fontWeight = "bold";
            statsTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            statsTitle.top = "12px";
            statsTitle.shadowColor = "rgba(0,0,0,0.9)";
            statsTitle.shadowBlur = 3;
            statsPanel.addControl(statsTitle);

            // Stats grid: 2 columns
            const stats = [
                  { id: "hp", icon: "❤", label: "HP", color: "#ff4444" },
                  { id: "mp", icon: "💧", label: "MP", color: "#4488ff" },
                  { id: "sta", icon: "⚡", label: "STA", color: "#44cc33" },
                  { id: "atk", icon: "⚔", label: "ATK", color: "#ff8844" },
                  { id: "def", icon: "🛡", label: "DEF", color: "#6688ff" },
            ];

            const refs: Record<string, TextBlock> = {};
            let row = 0;
            let col = 0;
            for (const s of stats) {
                  const x = col === 0 ? "20px" : "50%";
                  const y = `${48 + row * 38}px`;

                  const statLine = new TextBlock(`stat_${s.id}`, `${s.icon} ${s.label}: ---`);
                  statLine.color = s.color;
                  statLine.fontSize = 20;
                  statLine.fontWeight = "bold";
                  statLine.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  statLine.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  statLine.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  statLine.left = x;
                  statLine.top = y;
                  statLine.shadowColor = "rgba(0,0,0,0.8)";
                  statLine.shadowBlur = 3;
                  statsPanel.addControl(statLine);
                  refs[s.id] = statLine;

                  col++;
                  if (col > 1) { col = 0; row++; }
            }

            this.hpText = refs["hp"];
            this.mpText = refs["mp"];
            this.staText = refs["sta"];
            this.atkText = refs["atk"];
            this.defText = refs["def"];
      }

      private createEquipmentSection(): void {
            const equipPanel = new Rectangle("charEquipPanel");
            equipPanel.width = "94%";
            equipPanel.height = "310px";
            equipPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            equipPanel.top = "505px";
            equipPanel.background = "rgba(25, 5, 12, 0.5)";
            equipPanel.color = "rgba(255, 80, 60, 0.2)";
            equipPanel.thickness = 1;
            equipPanel.cornerRadius = 16;
            this.container.addControl(equipPanel);

            const equipTitle = new TextBlock("equipTitle", "🛡 Equipment");
            equipTitle.color = "#ffcc88";
            equipTitle.fontSize = 20;
            equipTitle.fontWeight = "bold";
            equipTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            equipTitle.top = "12px";
            equipTitle.shadowColor = "rgba(0,0,0,0.9)";
            equipTitle.shadowBlur = 3;
            equipPanel.addControl(equipTitle);

            // Equipment slots
            const slots = [
                  { id: "helmet", icon: "⛑", label: "Helmet" },
                  { id: "armor", icon: "🛡", label: "Armor" },
                  { id: "weapon", icon: "⚔", label: "Weapon" },
                  { id: "accessory", icon: "💍", label: "Accessory" },
            ];

            const slotRefs: Record<string, TextBlock> = {};
            for (let i = 0; i < slots.length; i++) {
                  const s = slots[i];
                  const yPos = `${50 + i * 62}px`;

                  // Slot container
                  const slotBg = new Rectangle(`equip_${s.id}_bg`);
                  slotBg.width = "92%";
                  slotBg.height = "54px";
                  slotBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  slotBg.top = yPos;
                  slotBg.background = "rgba(40, 8, 16, 0.5)";
                  slotBg.color = "rgba(255, 80, 60, 0.15)";
                  slotBg.thickness = 1;
                  slotBg.cornerRadius = 10;
                  equipPanel.addControl(slotBg);

                  // Icon
                  const icon = new TextBlock(`equip_${s.id}_icon`, s.icon);
                  icon.fontSize = 28;
                  icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  icon.left = "14px";
                  slotBg.addControl(icon);

                  // Label
                  const label = new TextBlock(`equip_${s.id}_label`, s.label);
                  label.color = "rgba(255, 180, 160, 0.6)";
                  label.fontSize = 14;
                  label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  label.left = "56px";
                  label.top = "6px";
                  slotBg.addControl(label);

                  // Value text
                  const value = new TextBlock(`equip_${s.id}_value`, "---");
                  value.color = "#ffe0cc";
                  value.fontSize = 18;
                  value.fontWeight = "bold";
                  value.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  value.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                  value.left = "56px";
                  value.top = "-6px";
                  value.shadowColor = "rgba(0,0,0,0.8)";
                  value.shadowBlur = 3;
                  slotBg.addControl(value);
                  slotRefs[s.id] = value;

                  // Swap button for helmet
                  if (s.id === "helmet") {
                        const swapBtn = Button.CreateSimpleButton(`swap_${s.id}`, "⟲ Swap");
                        swapBtn.width = "90px";
                        swapBtn.height = "40px";
                        swapBtn.color = "#ff8844";
                        swapBtn.fontSize = 16;
                        swapBtn.fontWeight = "bold";
                        swapBtn.background = "rgba(180, 30, 18, 0.5)";
                        swapBtn.cornerRadius = 10;
                        swapBtn.thickness = 1;
                        swapBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                        swapBtn.left = "-8px";
                        swapBtn.isPointerBlocker = true;
                        slotBg.addControl(swapBtn);

                        swapBtn.onPointerDownObservable.add(() => {
                              swapBtn.scaleX = 0.92;
                              swapBtn.scaleY = 0.92;
                        });
                        swapBtn.onPointerUpObservable.add(() => {
                              swapBtn.scaleX = 1.0;
                              swapBtn.scaleY = 1.0;
                        });
                        swapBtn.onPointerClickObservable.add(() => {
                              const newHelmet = this.player.cycleHelmet();
                              console.log(`[CharacterPanel] Helmet swapped to: ${newHelmet}`);
                        });

                        // Helmet name under value
                        this.helmetNameText = value;
                  }
            }

            this.helmetSlotText = slotRefs["helmet"];
            this.armorSlotText = slotRefs["armor"];
            this.weaponSlotText = slotRefs["weapon"];
            this.accessorySlotText = slotRefs["accessory"];
      }

      private createCloseButton(): void {
            const closeBtn = Button.CreateSimpleButton("charCloseBtn", "✕ Close");
            closeBtn.width = "180px";
            closeBtn.height = "56px";
            closeBtn.color = "#ff6644";
            closeBtn.fontSize = 24;
            closeBtn.fontFamily = "'Georgia', serif";
            closeBtn.fontWeight = "bold";
            closeBtn.background = "rgba(100, 12, 18, 0.6)";
            closeBtn.cornerRadius = 28;
            closeBtn.thickness = 2;
            closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            closeBtn.top = "-20px";
            closeBtn.isPointerBlocker = true;
            this.container.addControl(closeBtn);

            closeBtn.onPointerDownObservable.add(() => {
                  closeBtn.scaleX = 0.92;
                  closeBtn.scaleY = 0.92;
            });
            closeBtn.onPointerUpObservable.add(() => {
                  closeBtn.scaleX = 1.0;
                  closeBtn.scaleY = 1.0;
            });
            closeBtn.onPointerClickObservable.add(() => {
                  this.hide();
            });
      }

      // ═══════════════════════════════════════════════════════════════
      // ── DATA BINDING ──────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private bindPlayerData(): void {
            // Initial update
            this.refreshStats(this.player.getStats());
            this.refreshEquipment(this.player.getEquipment());

            // Subscribe to changes
            this.player.onStatsChanged.add((stats) => this.refreshStats(stats));
            this.player.onEquipmentChanged.add((equip) => this.refreshEquipment(equip));
      }

      private refreshStats(s: PlayerStats): void {
            this.levelText.text = `Lv.${s.level}`;
            this.hpText.text = `❤ HP: ${s.hp}/${s.maxHp}`;
            this.mpText.text = `💧 MP: ${s.mp}/${s.maxMp}`;
            this.staText.text = `⚡ STA: ${s.stamina}/${s.maxStamina}`;
            this.atkText.text = `⚔ ATK: ${s.atk}`;
            this.defText.text = `🛡 DEF: ${s.def}`;
            this.expText.text = `EXP ${s.exp}/${s.maxExp}`;
            this.expFill.width = `${Math.round((s.exp / s.maxExp) * 100)}%`;
      }

      private refreshEquipment(e: EquipmentSlots): void {
            this.helmetSlotText.text = this.capitalize(e.helmet);
            this.armorSlotText.text = this.capitalize(e.armor.replace("_", " "));
            this.weaponSlotText.text = this.capitalize(e.weapon);
            this.accessorySlotText.text = this.capitalize(e.accessory.replace("_", " "));
      }

      private capitalize(str: string): string {
            return str.charAt(0).toUpperCase() + str.slice(1);
      }

      // ═══════════════════════════════════════════════════════════════
      // ── VISIBILITY ────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public show(): void {
            this.isOpen = true;
            this.backdrop.isVisible = true;
            // Refresh on open
            this.refreshStats(this.player.getStats());
            this.refreshEquipment(this.player.getEquipment());
            console.log("[CharacterPanel] Opened ✓");
      }

      public hide(): void {
            this.isOpen = false;
            this.backdrop.isVisible = false;
            console.log("[CharacterPanel] Closed ✓");
      }

      public toggle(): void {
            if (this.isOpen) this.hide(); else this.show();
      }

      public getIsOpen(): boolean {
            return this.isOpen;
      }

      public dispose(): void {
            this.ui.dispose();
      }
}
