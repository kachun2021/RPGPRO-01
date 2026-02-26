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
 * Vertical Character Panel — Dark Abyss Theme
 * Full-screen overlay showing stats, equipment, and gear swap.
 * Slides in from right with deep dark panels and purple accents.
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
            this.ui.renderAtIdealSize = false;
            this.ui.isForeground = true;

            this.buildPanel();
            this.bindPlayerData();
            this.hide(); // Start hidden


      }

      // ═══════════════════════════════════════════════════════════════
      // ── PANEL CONSTRUCTION ────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private buildPanel(): void {
            // Dark backdrop
            this.backdrop = new Rectangle("charBackdrop");
            this.backdrop.width = "100%";
            this.backdrop.height = "100%";
            this.backdrop.background = "rgba(2, 2, 6, 0.82)";
            this.backdrop.color = "transparent";
            this.backdrop.thickness = 0;
            this.backdrop.isPointerBlocker = true;
            this.ui.addControl(this.backdrop);

            // Main panel container
            this.container = new Rectangle("charContainer");
            this.container.width = "90%";
            this.container.height = "88%";
            this.container.background = "rgba(8, 8, 14, 0.96)";
            this.container.color = "rgba(120, 90, 255, 0.25)";
            this.container.thickness = 1.5;
            this.container.cornerRadius = 24;
            this.container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            this.backdrop.addControl(this.container);

            this.createHeader();
            this.createCharacterPreview();
            this.createStatsSection();
            this.createEquipmentSection();
            this.createCloseButton();
      }

      private createHeader(): void {
            const header = new Rectangle("charHeader");
            header.width = "100%";
            header.height = "80px";
            header.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            header.background = "rgba(120, 90, 255, 0.05)";
            header.color = "transparent";
            header.thickness = 0;
            header.cornerRadius = 24;
            this.container.addControl(header);

            const title = new TextBlock("charTitle", "CHARACTER");
            title.color = "#e2e8f0";
            title.fontSize = 28;
            title.fontFamily = "'Cinzel', serif";
            title.fontWeight = "700";
            title.shadowColor = "rgba(0,0,0,0.8)";
            title.shadowBlur = 4;
            title.resizeToFit = true;
            header.addControl(title);

            // Accent line
            const accent = new Rectangle("charAccent");
            accent.width = "80%";
            accent.height = "1px";
            accent.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            accent.top = "80px";
            accent.background = "rgba(120, 90, 255, 0.2)";
            accent.color = "transparent";
            accent.thickness = 0;
            this.container.addControl(accent);
      }

      private createCharacterPreview(): void {
            // Character name + level area
            const previewArea = new Rectangle("charPreviewArea");
            previewArea.width = "90%";
            previewArea.height = "160px";
            previewArea.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            previewArea.top = "105px";
            previewArea.background = "rgba(6, 6, 12, 0.6)";
            previewArea.color = "rgba(120, 90, 255, 0.15)";
            previewArea.thickness = 1;
            previewArea.cornerRadius = 16;
            this.container.addControl(previewArea);

            // Character avatar large
            const avatar = new Ellipse("charAvatarLg");
            avatar.width = "90px";
            avatar.height = "90px";
            avatar.color = "rgba(168, 85, 247, 0.6)";
            avatar.thickness = 2;
            avatar.background = "rgba(14, 10, 28, 0.95)";
            avatar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            avatar.left = "20px";
            previewArea.addControl(avatar);

            const avatarIcon = new TextBlock("charAvatarIcon", "👤");
            avatarIcon.fontSize = 42;
            avatarIcon.resizeToFit = true;
            avatar.addControl(avatarIcon);

            // Name
            const name = new TextBlock("charName", "Wanderer");
            name.color = "#e2e8f0";
            name.fontSize = 24;
            name.fontFamily = "'Inter', sans-serif";
            name.fontWeight = "700";
            name.shadowColor = "rgba(0,0,0,0.6)";
            name.shadowBlur = 4;
            name.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            name.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            name.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            name.left = "130px";
            name.top = "30px";
            name.resizeToFit = true;
            previewArea.addControl(name);

            // Class
            const cls = new TextBlock("charClass", "Exploration Vanguard");
            cls.color = "rgba(255, 255, 255, 0.5)";
            cls.fontSize = 14;
            cls.fontFamily = "'Inter', sans-serif";
            cls.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            cls.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            cls.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            cls.left = "130px";
            cls.top = "62px";
            cls.height = "20px";
            cls.resizeToFit = true;
            previewArea.addControl(cls);

            // Level badge (large)
            this.levelText = new TextBlock("charLevel", "Lv.1");
            this.levelText.color = "#c084fc";
            this.levelText.fontSize = 20;
            this.levelText.fontFamily = "'Inter', sans-serif";
            this.levelText.fontWeight = "700";
            this.levelText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.levelText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.levelText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.levelText.left = "130px";
            this.levelText.top = "88px";
            this.levelText.height = "24px";
            this.levelText.resizeToFit = true;
            previewArea.addControl(this.levelText);

            // EXP bar
            const expContainer = new Rectangle("charExpContainer");
            expContainer.width = "90%";
            expContainer.height = "16px";
            expContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            expContainer.top = "-12px";
            expContainer.background = "rgba(6, 4, 14, 0.7)";
            expContainer.color = "rgba(120, 90, 255, 0.15)";
            expContainer.thickness = 1;
            expContainer.cornerRadius = 8;
            previewArea.addControl(expContainer);

            this.expFill = new Rectangle("charExpFill");
            this.expFill.width = "35%";
            this.expFill.height = "100%";
            this.expFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.expFill.background = "#c084fc";
            this.expFill.color = "transparent";
            this.expFill.thickness = 0;
            this.expFill.cornerRadius = 8;
            expContainer.addControl(this.expFill);

            this.expText = new TextBlock("charExpText", "EXP 350 / 1000");
            this.expText.color = "rgba(255, 255, 255, 0.9)";
            this.expText.fontSize = 12;
            this.expText.fontFamily = "'Inter', sans-serif";
            this.expText.fontWeight = "600";
            this.expText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            this.expText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            this.expText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            this.expText.height = "16px";
            this.expText.resizeToFit = true;
            expContainer.addControl(this.expText);
      }

      private createStatsSection(): void {
            const statsPanel = new Rectangle("charStatsPanel");
            statsPanel.width = "90%";
            statsPanel.height = "200px";
            statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            statsPanel.top = "280px";
            statsPanel.background = "rgba(6, 6, 12, 0.6)";
            statsPanel.color = "rgba(120, 90, 255, 0.15)";
            statsPanel.thickness = 1;
            statsPanel.cornerRadius = 16;
            this.container.addControl(statsPanel);

            const statsTitle = new TextBlock("statsTitle", "Combat Stats");
            statsTitle.color = "#e2e8f0";
            statsTitle.fontSize = 16;
            statsTitle.fontFamily = "'Inter', sans-serif";
            statsTitle.fontWeight = "700";
            statsTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            statsTitle.top = "16px";
            statsTitle.shadowColor = "rgba(0,0,0,0.6)";
            statsTitle.shadowBlur = 3;
            statsTitle.resizeToFit = true;
            statsPanel.addControl(statsTitle);

            // Stats grid: 2 columns
            const stats = [
                  { id: "hp", label: "HP", color: "#ef4444" },
                  { id: "mp", label: "MP", color: "#818cf8" },
                  { id: "sta", label: "STA", color: "#c084fc" },
                  { id: "atk", label: "ATK", color: "#f87171" },
                  { id: "def", label: "DEF", color: "#e2e8f0" },
            ];

            const refs: Record<string, TextBlock> = {};
            let row = 0;
            let col = 0;
            for (const s of stats) {
                  const x = col === 0 ? "20px" : "50%";
                  const y = `${48 + row * 34}px`;

                  const statLine = new TextBlock(`stat_${s.id}`, `${s.label}: ---`);
                  statLine.color = s.color;
                  statLine.fontSize = 16;
                  statLine.fontFamily = "'Inter', sans-serif";
                  statLine.fontWeight = "600";
                  statLine.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  statLine.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  statLine.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  statLine.height = "24px";
                  statLine.left = x;
                  statLine.top = y;
                  statLine.resizeToFit = true;
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
            equipPanel.width = "90%";
            equipPanel.height = "290px";
            equipPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            equipPanel.top = "475px";
            equipPanel.background = "rgba(6, 6, 12, 0.6)";
            equipPanel.color = "rgba(120, 90, 255, 0.15)";
            equipPanel.thickness = 1;
            equipPanel.cornerRadius = 16;
            this.container.addControl(equipPanel);

            const equipTitle = new TextBlock("equipTitle", "Equipment");
            equipTitle.color = "#e2e8f0";
            equipTitle.fontSize = 16;
            equipTitle.fontFamily = "'Inter', sans-serif";
            equipTitle.fontWeight = "700";
            equipTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            equipTitle.top = "16px";
            equipTitle.resizeToFit = true;
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
                  const yPos = `${44 + i * 58}px`;

                  // Slot container
                  const slotBg = new Rectangle(`equip_${s.id}_bg`);
                  slotBg.width = "92%";
                  slotBg.height = "54px";
                  slotBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  slotBg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                  slotBg.top = yPos;
                  slotBg.background = "rgba(14, 12, 28, 0.7)";
                  slotBg.color = "rgba(120, 90, 255, 0.1)";
                  slotBg.thickness = 1;
                  slotBg.cornerRadius = 10;
                  equipPanel.addControl(slotBg);

                  // Icon
                  const icon = new TextBlock(`equip_${s.id}_icon`, s.icon);
                  icon.fontSize = 24;
                  icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  icon.left = "14px";
                  icon.resizeToFit = true;
                  slotBg.addControl(icon);

                  // Label
                  const label = new TextBlock(`equip_${s.id}_label`, s.label);
                  label.color = "rgba(148, 163, 184, 0.6)";
                  label.fontSize = 12;
                  label.fontFamily = "'Inter', sans-serif";
                  label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  label.height = "16px";
                  label.left = "56px";
                  label.top = "8px";
                  label.resizeToFit = true;
                  slotBg.addControl(label);

                  // Value text
                  const value = new TextBlock(`equip_${s.id}_value`, "---");
                  value.color = "#e2e8f0";
                  value.fontSize = 16;
                  value.fontFamily = "'Inter', sans-serif";
                  value.fontWeight = "600";
                  value.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  value.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                  value.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                  value.height = "22px";
                  value.left = "56px";
                  value.top = "24px";
                  value.resizeToFit = true;
                  slotBg.addControl(value);
                  slotRefs[s.id] = value;

                  // Swap button for helmet
                  if (s.id === "helmet") {
                        const swapBtn = Button.CreateSimpleButton(`swap_${s.id}`, "⟲ Swap");
                        swapBtn.width = "80px";
                        swapBtn.height = "36px";
                        swapBtn.color = "#a855f7";
                        swapBtn.fontSize = 14;
                        swapBtn.fontFamily = "'Inter', sans-serif";
                        swapBtn.fontWeight = "700";
                        swapBtn.background = "rgba(168, 85, 247, 0.15)";
                        swapBtn.cornerRadius = 8;
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
            const closeBtn = Button.CreateSimpleButton("charCloseBtn", "✕ CLOSE");
            closeBtn.width = "140px";
            closeBtn.height = "50px";
            closeBtn.color = "rgba(255, 255, 255, 0.8)";
            closeBtn.fontSize = 16;
            closeBtn.fontFamily = "'Inter', sans-serif";
            closeBtn.fontWeight = "700";
            closeBtn.background = "rgba(120, 90, 255, 0.12)";
            closeBtn.cornerRadius = 25;
            closeBtn.thickness = 1;
            closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            closeBtn.top = "-24px";
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
            this.hpText.text = `HP: ${s.hp}/${s.maxHp}`;
            this.mpText.text = `MP: ${s.mp}/${s.maxMp}`;
            this.staText.text = `STA: ${s.stamina}/${s.maxStamina}`;
            this.atkText.text = `ATK: ${s.atk}`;
            this.defText.text = `DEF: ${s.def}`;
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

      }

      public hide(): void {
            this.isOpen = false;
            this.backdrop.isVisible = false;

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
