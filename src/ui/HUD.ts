import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Control } from "@babylonjs/gui/2D/controls/control";

export class HUD {
     private ui: AdvancedDynamicTexture;

     constructor(private scene: Scene) {
          this.ui = AdvancedDynamicTexture.CreateFullscreenUI("hud", true, scene);
          this.ui.idealHeight = 900; // Smaller ref = larger UI elements on screen
          this.ui.renderAtIdealSize = false; // Render at full native resolution

          this.createTopBar();
          this.createAvatarPanel();
          this.createRightSidebar();
          this.createBottomBar();
          this.createMinimap();
     }

     // ── TOP BAR: Location + Menu ──────────────────────────────────────
     private createTopBar(): void {
          // Top gradient
          const topBar = new Rectangle("topBar");
          topBar.width = "100%";
          topBar.height = "50px";
          topBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          topBar.background = "rgba(10, 0, 8, 0.8)";
          topBar.color = "transparent";
          topBar.thickness = 0;
          this.ui.addControl(topBar);

          // Location name (top-center)
          const locationBar = new Rectangle("locationBar");
          locationBar.width = "200px";
          locationBar.height = "30px";
          locationBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          locationBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          locationBar.top = "10px";
          locationBar.background = "rgba(120, 15, 20, 0.6)";
          locationBar.color = "rgba(255, 80, 60, 0.7)";
          locationBar.thickness = 1;
          locationBar.cornerRadius = 15;
          this.ui.addControl(locationBar);

          const locationText = new TextBlock("locationText", "⚔ Ashen Wasteland");
          locationText.color = "#ff6644";
          locationText.fontSize = 13;
          locationText.fontFamily = "Georgia, serif";
          locationText.fontWeight = "bold";
          locationBar.addControl(locationText);

          // Menu button (top-right)
          const menuBtn = Button.CreateSimpleButton("menuBtn", "☰");
          menuBtn.width = "40px";
          menuBtn.height = "40px";
          menuBtn.color = "#ff6644";
          menuBtn.fontSize = 22;
          menuBtn.background = "rgba(120, 15, 20, 0.65)";
          menuBtn.cornerRadius = 10;
          menuBtn.thickness = 1.5;
          menuBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          menuBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          menuBtn.top = "8px";
          menuBtn.left = "-8px";
          menuBtn.onPointerDownObservable.add(() => {
               menuBtn.scaleX = 0.9;
               menuBtn.scaleY = 0.9;
          });
          menuBtn.onPointerUpObservable.add(() => {
               menuBtn.scaleX = 1.0;
               menuBtn.scaleY = 1.0;
          });
          menuBtn.onPointerClickObservable.add(() => {
               console.log("[HUD] Menu pressed");
          });
          this.ui.addControl(menuBtn);
     }

     // ── AVATAR + HP/MP/STAMINA (top-left) ─────────────────────────────
     private createAvatarPanel(): void {
          const panel = new Rectangle("avatarPanel");
          panel.width = "190px";
          panel.height = "95px";
          panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          panel.top = "8px";
          panel.left = "8px";
          panel.background = "rgba(15, 2, 8, 0.82)";
          panel.color = "rgba(255, 80, 60, 0.5)";
          panel.thickness = 1.5;
          panel.cornerRadius = 10;
          this.ui.addControl(panel);

          // Avatar circle
          const avatarFrame = new Ellipse("avatarFrame");
          avatarFrame.width = "55px";
          avatarFrame.height = "55px";
          avatarFrame.color = "#ff5533";
          avatarFrame.thickness = 2.5;
          avatarFrame.background = "rgba(120, 15, 20, 0.7)";
          avatarFrame.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          avatarFrame.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          avatarFrame.left = "6px";
          avatarFrame.top = "6px";
          panel.addControl(avatarFrame);

          const avatarText = new TextBlock("avatarTxt", "🗡");
          avatarText.fontSize = 24;
          avatarFrame.addControl(avatarText);

          // Level badge
          const levelBadge = new Ellipse("levelBadge");
          levelBadge.width = "22px";
          levelBadge.height = "22px";
          levelBadge.color = "#ff5533";
          levelBadge.thickness = 1.5;
          levelBadge.background = "rgba(180, 30, 20, 0.95)";
          levelBadge.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          levelBadge.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          levelBadge.left = "42px";
          levelBadge.top = "46px";
          panel.addControl(levelBadge);

          const levelText = new TextBlock("levelNum", "1");
          levelText.color = "#fff";
          levelText.fontSize = 10;
          levelText.fontWeight = "bold";
          levelBadge.addControl(levelText);

          // Player name
          const nameText = new TextBlock("playerName", "Dark Knight");
          nameText.color = "#ffd0b8";
          nameText.fontSize = 13;
          nameText.fontFamily = "Georgia, serif";
          nameText.fontWeight = "bold";
          nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          nameText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          nameText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          nameText.left = "68px";
          nameText.top = "7px";
          panel.addControl(nameText);

          // HP Bar
          this.createStatusBar(panel, "hp", "HP", 85, "#c4302b", "68px", "26px", "112px");
          // MP Bar
          this.createStatusBar(panel, "mp", "MP", 60, "#3355cc", "68px", "44px", "112px");
          // Stamina Bar
          this.createStatusBar(panel, "sta", "ST", 100, "#55aa30", "68px", "62px", "112px");
     }

     private createStatusBar(
          parent: Rectangle,
          id: string,
          label: string,
          percent: number,
          fillColor: string,
          left: string,
          top: string,
          width: string
     ): void {
          const container = new Rectangle(`${id}BarContainer`);
          container.width = width;
          container.height = "15px";
          container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          container.left = left;
          container.top = top;
          container.background = "rgba(0, 0, 0, 0.7)";
          container.color = "rgba(255,255,255,0.15)";
          container.thickness = 0.5;
          container.cornerRadius = 4;
          parent.addControl(container);

          // Fill
          const fill = new Rectangle(`${id}BarFill`);
          fill.width = `${percent}%`;
          fill.height = "100%";
          fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          fill.background = fillColor;
          fill.color = "transparent";
          fill.thickness = 0;
          fill.cornerRadius = 4;
          container.addControl(fill);

          // Label
          const text = new TextBlock(`${id}Label`, `${label} ${percent}%`);
          text.color = "#ffffff";
          text.fontSize = 9;
          text.fontWeight = "bold";
          text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          text.shadowColor = "rgba(0,0,0,0.95)";
          text.shadowBlur = 3;
          container.addControl(text);
     }

     // ── RIGHT SIDEBAR: Quick Actions ──────────────────────────────────
     private createRightSidebar(): void {
          const sidebar = new StackPanel("rightSidebar");
          sidebar.width = "48px";
          sidebar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          sidebar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          sidebar.left = "-6px";
          sidebar.isVertical = true;
          sidebar.spacing = 6;
          this.ui.addControl(sidebar);

          const icons = [
               { id: "events", icon: "📅", label: "Events" },
               { id: "rankings", icon: "🏆", label: "Rank" },
               { id: "faction", icon: "⚔", label: "Guild" },
               { id: "shop", icon: "🛒", label: "Shop" },
               { id: "mail", icon: "📧", label: "Mail" },
          ];

          for (const item of icons) {
               const btn = this.createSidebarButton(item.id, item.icon, item.label);
               sidebar.addControl(btn);
          }
     }

     private createSidebarButton(id: string, icon: string, label: string): Rectangle {
          const container = new Rectangle(`sidebar_${id}`);
          container.width = "44px";
          container.height = "50px";
          container.background = "rgba(120, 15, 20, 0.55)";
          container.color = "rgba(255, 80, 60, 0.5)";
          container.thickness = 1;
          container.cornerRadius = 8;

          const iconText = new TextBlock(`${id}Icon`, icon);
          iconText.fontSize = 18;
          iconText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          iconText.top = "5px";
          container.addControl(iconText);

          const labelText = new TextBlock(`${id}Label`, label);
          labelText.color = "rgba(255, 180, 160, 0.9)";
          labelText.fontSize = 8;
          labelText.fontWeight = "bold";
          labelText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          labelText.top = "-4px";
          container.addControl(labelText);

          return container;
     }

     // ── BOTTOM BAR: Skills + Auto-Battle + Joystick Area ──────────────
     private createBottomBar(): void {
          // Bottom gradient
          const bottomBg = new Rectangle("bottomBg");
          bottomBg.width = "100%";
          bottomBg.height = "150px";
          bottomBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          bottomBg.background = "rgba(10, 0, 8, 0.7)";
          bottomBg.color = "transparent";
          bottomBg.thickness = 0;
          this.ui.addControl(bottomBg);

          // NOTE: Joystick is rendered by TouchJoystick.ts, not here

          // Skill buttons
          this.createSkillButtons();

          // Auto-Battle toggle
          const autoBtn = Button.CreateSimpleButton("autoBtn", "AUTO");
          autoBtn.width = "58px";
          autoBtn.height = "28px";
          autoBtn.color = "#ff6644";
          autoBtn.fontSize = 11;
          autoBtn.fontFamily = "Georgia, serif";
          autoBtn.background = "rgba(120, 15, 20, 0.6)";
          autoBtn.cornerRadius = 14;
          autoBtn.thickness = 1;
          autoBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          autoBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          autoBtn.left = "-12px";
          autoBtn.top = "-150px";
          let autoActive = false;
          autoBtn.onPointerDownObservable.add(() => {
               autoBtn.scaleX = 0.9;
               autoBtn.scaleY = 0.9;
          });
          autoBtn.onPointerUpObservable.add(() => {
               autoBtn.scaleX = 1.0;
               autoBtn.scaleY = 1.0;
          });
          autoBtn.onPointerClickObservable.add(() => {
               autoActive = !autoActive;
               autoBtn.background = autoActive ? "rgba(255, 80, 60, 0.6)" : "rgba(120, 15, 20, 0.6)";
               console.log(`[HUD] Auto-Battle: ${autoActive ? "ON" : "OFF"}`);
          });
          this.ui.addControl(autoBtn);
     }

     private createSkillButtons(): void {
          // Main attack button (large)
          const atkBtn = new Ellipse("atkBtn");
          atkBtn.width = "70px";
          atkBtn.height = "70px";
          atkBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          atkBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkBtn.left = "-70px";
          atkBtn.top = "-40px";
          atkBtn.background = "rgba(255, 60, 40, 0.4)";
          atkBtn.color = "rgba(255, 80, 60, 0.8)";
          atkBtn.thickness = 2.5;
          this.ui.addControl(atkBtn);

          const atkIcon = new TextBlock("atkIcon", "⚔");
          atkIcon.fontSize = 30;
          atkBtn.addControl(atkIcon);

          // Skill slots around attack
          const skills = [
               { id: "skill1", icon: "🔥", x: -18, y: -120 },
               { id: "skill2", icon: "❄", x: -130, y: -58 },
               { id: "skill3", icon: "⚡", x: -130, y: -120 },
               { id: "dodge", icon: "💨", x: -18, y: -58 },
          ];

          for (const s of skills) {
               const btn = new Ellipse(`${s.id}Btn`);
               btn.width = "48px";
               btn.height = "48px";
               btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
               btn.left = `${s.x}px`;
               btn.top = `${s.y}px`;
               btn.background = "rgba(120, 15, 20, 0.45)";
               btn.color = "rgba(255, 80, 60, 0.55)";
               btn.thickness = 1.5;
               this.ui.addControl(btn);

               const icon = new TextBlock(`${s.id}Icon`, s.icon);
               icon.fontSize = 20;
               btn.addControl(icon);

               // Cooldown label
               const cd = new TextBlock(`${s.id}CD`, "");
               cd.color = "#fff";
               cd.fontSize = 10;
               cd.fontWeight = "bold";
               cd.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
               cd.top = "-2px";
               cd.shadowColor = "rgba(0,0,0,0.95)";
               cd.shadowBlur = 3;
               btn.addControl(cd);
          }
     }

     // ── MINIMAP (top-right, below menu) ───────────────────────────────
     private createMinimap(): void {
          const mapContainer = new Rectangle("minimapContainer");
          mapContainer.width = "70px";
          mapContainer.height = "70px";
          mapContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          mapContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          mapContainer.left = "-8px";
          mapContainer.top = "52px";
          mapContainer.background = "rgba(15, 2, 8, 0.75)";
          mapContainer.color = "rgba(255, 80, 60, 0.5)";
          mapContainer.thickness = 1.5;
          mapContainer.cornerRadius = 35;
          this.ui.addControl(mapContainer);

          // Map placeholder
          const mapLabel = new TextBlock("mapLabel", "🗺");
          mapLabel.fontSize = 22;
          mapLabel.color = "rgba(255, 180, 160, 0.6)";
          mapContainer.addControl(mapLabel);

          // Player dot
          const playerDot = new Ellipse("playerDot");
          playerDot.width = "6px";
          playerDot.height = "6px";
          playerDot.background = "#ff5533";
          playerDot.color = "#ff8866";
          playerDot.thickness = 1;
          mapContainer.addControl(playerDot);

          // Compass
          const compass = new TextBlock("compass", "N");
          compass.color = "rgba(255, 80, 60, 0.8)";
          compass.fontSize = 9;
          compass.fontWeight = "bold";
          compass.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          compass.top = "6px";
          mapContainer.addControl(compass);
     }
}
