import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Control } from "@babylonjs/gui/2D/controls/control";

/**
 * Premium Vertical HUD — Dark Gothic Fantasy 
 * Genshin Impact / Wuthering Waves portrait-mode quality.
 * 
 * Layout (top → bottom):
 * ┌─────────────────────────────────┐
 * │  [Avatar+Stats]  [Location] [≡] │ ← Top bar
 * │                          [🗺]   │ ← Minimap
 * │                    [Events]     │
 * │                    [Rankings]   │ ← Right sidebar
 * │                    [Faction]    │
 * │                    [Shop]       │
 * │                    [Mail]       │
 * │  [EXP Bar]                      │ ← Mid-left EXP
 * │                                 │
 * │                       [AUTO]    │
 * │  [🕹]          [⚡][❄][🔥][⚔]  │ ← Bottom bar
 * │                   [💨]          │
 * └─────────────────────────────────┘
 */
export class HUD {
     private ui: AdvancedDynamicTexture;

     constructor(private scene: Scene) {
          this.ui = AdvancedDynamicTexture.CreateFullscreenUI("hud", true, scene);
          this.ui.idealHeight = 900;
          this.ui.renderAtIdealSize = false;

          this.createTopBar();
          this.createAvatarPanel();
          this.createExpBar();
          this.createRightSidebar();
          this.createBottomBar();
          this.createMinimap();
          this.createCurrencyBar();
          this.createNotificationBadge();
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── TOP BAR: Location + Menu ─────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createTopBar(): void {
          // Top gradient backdrop
          const topBar = new Rectangle("topBar");
          topBar.width = "100%";
          topBar.height = "54px";
          topBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          topBar.background = "linear-gradient(rgba(10, 0, 8, 0.92), rgba(10, 0, 8, 0))";
          topBar.color = "transparent";
          topBar.thickness = 0;
          this.ui.addControl(topBar);

          // Bottom accent line
          const topAccent = new Rectangle("topAccent");
          topAccent.width = "100%";
          topAccent.height = "1px";
          topAccent.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          topAccent.top = "54px";
          topAccent.background = "rgba(255, 60, 40, 0.15)";
          topAccent.color = "transparent";
          topAccent.thickness = 0;
          this.ui.addControl(topAccent);

          // ── Location Bar (top-center, ornate) ──────────────────────
          const locationBar = new Rectangle("locationBar");
          locationBar.width = "220px";
          locationBar.height = "32px";
          locationBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          locationBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          locationBar.top = "10px";
          locationBar.background = "rgba(100, 12, 18, 0.55)";
          locationBar.color = "rgba(255, 80, 60, 0.6)";
          locationBar.thickness = 1;
          locationBar.cornerRadius = 16;
          this.ui.addControl(locationBar);

          // Location left ornament
          const locLeft = new TextBlock("locLeftOrn", "◆");
          locLeft.color = "rgba(255, 80, 60, 0.5)";
          locLeft.fontSize = 8;
          locLeft.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          locLeft.left = "10px";
          locationBar.addControl(locLeft);

          // Location right ornament
          const locRight = new TextBlock("locRightOrn", "◆");
          locRight.color = "rgba(255, 80, 60, 0.5)";
          locRight.fontSize = 8;
          locRight.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          locRight.left = "-10px";
          locationBar.addControl(locRight);

          const locationText = new TextBlock("locationText", "⚔ Ashen Wasteland");
          locationText.color = "#ff6644";
          locationText.fontSize = 13;
          locationText.fontFamily = "'Georgia', serif";
          locationText.fontWeight = "bold";
          locationBar.addControl(locationText);

          // ── Menu Button (top-right) ────────────────────────────────
          const menuBtn = Button.CreateSimpleButton("menuBtn", "☰");
          menuBtn.width = "42px";
          menuBtn.height = "42px";
          menuBtn.color = "#ff6644";
          menuBtn.fontSize = 22;
          menuBtn.background = "rgba(100, 12, 18, 0.65)";
          menuBtn.cornerRadius = 10;
          menuBtn.thickness = 1.5;
          menuBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          menuBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          menuBtn.top = "6px";
          menuBtn.left = "-6px";
          this.addPressAnimation(menuBtn);
          menuBtn.onPointerClickObservable.add(() => {
               console.log("[HUD] Menu pressed");
          });
          this.ui.addControl(menuBtn);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── AVATAR + HP/MP/STAMINA (top-left) ────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createAvatarPanel(): void {
          const panel = new Rectangle("avatarPanel");
          panel.width = "195px";
          panel.height = "100px";
          panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          panel.top = "6px";
          panel.left = "6px";
          panel.background = "rgba(12, 2, 6, 0.85)";
          panel.color = "rgba(255, 80, 60, 0.45)";
          panel.thickness = 1.5;
          panel.cornerRadius = 12;
          this.ui.addControl(panel);

          // Avatar circle with glow border
          const avatarGlow = new Ellipse("avatarGlow");
          avatarGlow.width = "62px";
          avatarGlow.height = "62px";
          avatarGlow.color = "rgba(255, 60, 40, 0.25)";
          avatarGlow.thickness = 3;
          avatarGlow.background = "transparent";
          avatarGlow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          avatarGlow.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          avatarGlow.left = "3px";
          avatarGlow.top = "3px";
          panel.addControl(avatarGlow);

          const avatarFrame = new Ellipse("avatarFrame");
          avatarFrame.width = "56px";
          avatarFrame.height = "56px";
          avatarFrame.color = "#ff5533";
          avatarFrame.thickness = 2.5;
          avatarFrame.background = "rgba(100, 12, 18, 0.75)";
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
          levelBadge.width = "24px";
          levelBadge.height = "24px";
          levelBadge.color = "#ff5533";
          levelBadge.thickness = 1.5;
          levelBadge.background = "rgba(180, 25, 18, 0.95)";
          levelBadge.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          levelBadge.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          levelBadge.left = "42px";
          levelBadge.top = "48px";
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
          nameText.fontFamily = "'Georgia', serif";
          nameText.fontWeight = "bold";
          nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          nameText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          nameText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          nameText.left = "70px";
          nameText.top = "7px";
          panel.addControl(nameText);

          // Server / Faction tag
          const serverTag = new TextBlock("serverTag", "S1 · Crimson Order");
          serverTag.color = "rgba(255, 150, 120, 0.55)";
          serverTag.fontSize = 8;
          serverTag.fontFamily = "'Georgia', serif";
          serverTag.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          serverTag.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          serverTag.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          serverTag.left = "70px";
          serverTag.top = "22px";
          panel.addControl(serverTag);

          // HP Bar
          this.createStatusBar(panel, "hp", "HP", 85, "#c4302b", "#8b1a18", "70px", "35px", "115px");
          // MP Bar
          this.createStatusBar(panel, "mp", "MP", 60, "#3355cc", "#1a2b66", "70px", "52px", "115px");
          // Stamina Bar
          this.createStatusBar(panel, "sta", "ST", 100, "#55aa30", "#2d5518", "70px", "69px", "115px");
     }

     private createStatusBar(
          parent: Rectangle,
          id: string,
          label: string,
          percent: number,
          fillColor: string,
          bgGlow: string,
          left: string,
          top: string,
          width: string
     ): void {
          const container = new Rectangle(`${id}BarContainer`);
          container.width = width;
          container.height = "14px";
          container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          container.left = left;
          container.top = top;
          container.background = "rgba(0, 0, 0, 0.7)";
          container.color = `${bgGlow}55`;
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

          // Shimmer highlight on fill
          const shimmer = new Rectangle(`${id}Shimmer`);
          shimmer.width = "30%";
          shimmer.height = "40%";
          shimmer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          shimmer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          shimmer.background = "rgba(255,255,255,0.08)";
          shimmer.color = "transparent";
          shimmer.thickness = 0;
          shimmer.cornerRadius = 3;
          fill.addControl(shimmer);

          // Label
          const text = new TextBlock(`${id}Label`, `${label} ${percent}%`);
          text.color = "#ffffff";
          text.fontSize = 8;
          text.fontWeight = "bold";
          text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          text.shadowColor = "rgba(0,0,0,0.95)";
          text.shadowBlur = 3;
          container.addControl(text);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── EXP BAR (below avatar panel, left side) ──────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createExpBar(): void {
          const expContainer = new Rectangle("expBarContainer");
          expContainer.width = "195px";
          expContainer.height = "10px";
          expContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          expContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          expContainer.left = "6px";
          expContainer.top = "110px";
          expContainer.background = "rgba(0, 0, 0, 0.6)";
          expContainer.color = "rgba(255, 200, 100, 0.3)";
          expContainer.thickness = 0.5;
          expContainer.cornerRadius = 5;
          this.ui.addControl(expContainer);

          const expFill = new Rectangle("expFill");
          expFill.width = "35%";
          expFill.height = "100%";
          expFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          expFill.background = "rgba(255, 180, 60, 0.7)";
          expFill.color = "transparent";
          expFill.thickness = 0;
          expFill.cornerRadius = 5;
          expContainer.addControl(expFill);

          const expLabel = new TextBlock("expLabel", "EXP 350/1000");
          expLabel.color = "rgba(255, 220, 150, 0.85)";
          expLabel.fontSize = 7;
          expLabel.fontWeight = "bold";
          expLabel.shadowColor = "rgba(0,0,0,0.9)";
          expLabel.shadowBlur = 2;
          expContainer.addControl(expLabel);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── CURRENCY BAR (below EXP) ─────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createCurrencyBar(): void {
          const currencyPanel = new StackPanel("currencyPanel");
          currencyPanel.width = "195px";
          currencyPanel.height = "20px";
          currencyPanel.isVertical = false;
          currencyPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          currencyPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          currencyPanel.left = "6px";
          currencyPanel.top = "124px";
          this.ui.addControl(currencyPanel);

          const currencies = [
               { icon: "💰", value: "12.5K", color: "#ffcc44" },
               { icon: "💎", value: "340", color: "#88ccff" },
               { icon: "⚡", value: "80/80", color: "#ff8844" },
          ];

          for (const c of currencies) {
               const item = new Rectangle(`currency_${c.icon}`);
               item.width = "63px";
               item.height = "18px";
               item.background = "rgba(12, 2, 6, 0.7)";
               item.color = "rgba(255, 80, 60, 0.25)";
               item.thickness = 0.5;
               item.cornerRadius = 4;
               currencyPanel.addControl(item);

               const txt = new TextBlock(`currTxt_${c.icon}`, `${c.icon} ${c.value}`);
               txt.color = c.color;
               txt.fontSize = 8;
               txt.fontWeight = "bold";
               txt.shadowColor = "rgba(0,0,0,0.8)";
               txt.shadowBlur = 2;
               item.addControl(txt);
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── RIGHT SIDEBAR: Quick Actions ─────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createRightSidebar(): void {
          const sidebar = new StackPanel("rightSidebar");
          sidebar.width = "50px";
          sidebar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          sidebar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          sidebar.left = "-5px";
          sidebar.top = "30px";
          sidebar.isVertical = true;
          sidebar.spacing = 5;
          this.ui.addControl(sidebar);

          const icons = [
               { id: "events", icon: "📅", label: "Events", badge: "!" },
               { id: "rankings", icon: "🏆", label: "Rank", badge: "" },
               { id: "faction", icon: "⚔", label: "Guild", badge: "" },
               { id: "shop", icon: "🛒", label: "Shop", badge: "3" },
               { id: "mail", icon: "📧", label: "Mail", badge: "5" },
               { id: "quest", icon: "📜", label: "Quest", badge: "" },
          ];

          for (const item of icons) {
               const btn = this.createSidebarButton(item.id, item.icon, item.label, item.badge);
               sidebar.addControl(btn);
          }
     }

     private createSidebarButton(id: string, icon: string, label: string, badge: string): Rectangle {
          const container = new Rectangle(`sidebar_${id}`);
          container.width = "46px";
          container.height = "52px";
          container.background = "rgba(100, 12, 18, 0.5)";
          container.color = "rgba(255, 80, 60, 0.4)";
          container.thickness = 1;
          container.cornerRadius = 8;

          const iconText = new TextBlock(`${id}Icon`, icon);
          iconText.fontSize = 18;
          iconText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          iconText.top = "5px";
          container.addControl(iconText);

          const labelText = new TextBlock(`${id}Label`, label);
          labelText.color = "rgba(255, 180, 160, 0.85)";
          labelText.fontSize = 8;
          labelText.fontWeight = "bold";
          labelText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          labelText.top = "-4px";
          container.addControl(labelText);

          // Notification badge
          if (badge) {
               const badgeCircle = new Ellipse(`${id}Badge`);
               badgeCircle.width = "16px";
               badgeCircle.height = "16px";
               badgeCircle.background = "#e03030";
               badgeCircle.color = "#ff6644";
               badgeCircle.thickness = 1;
               badgeCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               badgeCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
               badgeCircle.left = "4px";
               badgeCircle.top = "-4px";
               container.addControl(badgeCircle);

               const badgeText = new TextBlock(`${id}BadgeTxt`, badge);
               badgeText.color = "#fff";
               badgeText.fontSize = 8;
               badgeText.fontWeight = "bold";
               badgeCircle.addControl(badgeText);
          }

          return container;
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── BOTTOM BAR: Skills + Auto-Battle ─────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createBottomBar(): void {
          // Bottom gradient backdrop
          const bottomBg = new Rectangle("bottomBg");
          bottomBg.width = "100%";
          bottomBg.height = "155px";
          bottomBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          bottomBg.background = "rgba(8, 0, 6, 0.75)";
          bottomBg.color = "transparent";
          bottomBg.thickness = 0;
          this.ui.addControl(bottomBg);

          // Top accent line for bottom bar
          const bottomAccent = new Rectangle("bottomAccent");
          bottomAccent.width = "100%";
          bottomAccent.height = "1px";
          bottomAccent.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          bottomAccent.top = "-155px";
          bottomAccent.background = "rgba(255, 60, 40, 0.12)";
          bottomAccent.color = "transparent";
          bottomAccent.thickness = 0;
          this.ui.addControl(bottomAccent);

          // NOTE: Joystick is rendered by TouchJoystick.ts on bottom-left

          // Skill buttons
          this.createSkillButtons();

          // Auto-Battle toggle
          const autoBg = new Rectangle("autoBg");
          autoBg.width = "62px";
          autoBg.height = "30px";
          autoBg.cornerRadius = 15;
          autoBg.background = "rgba(100, 12, 18, 0.55)";
          autoBg.color = "rgba(255, 80, 60, 0.5)";
          autoBg.thickness = 1;
          autoBg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          autoBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          autoBg.left = "-10px";
          autoBg.top = "-158px";
          this.ui.addControl(autoBg);

          const autoBtn = Button.CreateSimpleButton("autoBtn", "⚙ AUTO");
          autoBtn.width = "60px";
          autoBtn.height = "28px";
          autoBtn.color = "#ff6644";
          autoBtn.fontSize = 10;
          autoBtn.fontFamily = "'Georgia', serif";
          autoBtn.fontWeight = "bold";
          autoBtn.background = "transparent";
          autoBtn.cornerRadius = 14;
          autoBtn.thickness = 0;
          autoBg.addControl(autoBtn);

          let autoActive = false;
          this.addPressAnimation(autoBtn);
          autoBtn.onPointerClickObservable.add(() => {
               autoActive = !autoActive;
               autoBg.background = autoActive ? "rgba(255, 80, 60, 0.55)" : "rgba(100, 12, 18, 0.55)";
               autoBtn.color = autoActive ? "#ffffff" : "#ff6644";
               console.log(`[HUD] Auto-Battle: ${autoActive ? "ON" : "OFF"}`);
          });

          // Speed toggle (2x)
          const speedBtn = Button.CreateSimpleButton("speedBtn", "×1");
          speedBtn.width = "36px";
          speedBtn.height = "22px";
          speedBtn.color = "rgba(255, 180, 140, 0.7)";
          speedBtn.fontSize = 9;
          speedBtn.background = "rgba(100, 12, 18, 0.45)";
          speedBtn.cornerRadius = 11;
          speedBtn.thickness = 0.5;
          speedBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          speedBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          speedBtn.left = "-78px";
          speedBtn.top = "-162px";
          let speedFast = false;
          this.addPressAnimation(speedBtn);
          speedBtn.onPointerClickObservable.add(() => {
               speedFast = !speedFast;
               (speedBtn.textBlock as TextBlock).text = speedFast ? "×2" : "×1";
               speedBtn.color = speedFast ? "#ffcc44" : "rgba(255, 180, 140, 0.7)";
               console.log(`[HUD] Speed: ${speedFast ? "2x" : "1x"}`);
          });
          this.ui.addControl(speedBtn);
     }

     private createSkillButtons(): void {
          // Main attack button (large, premium glow)
          const atkGlow = new Ellipse("atkGlow");
          atkGlow.width = "80px";
          atkGlow.height = "80px";
          atkGlow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          atkGlow.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkGlow.left = "-66px";
          atkGlow.top = "-36px";
          atkGlow.background = "transparent";
          atkGlow.color = "rgba(255, 60, 40, 0.15)";
          atkGlow.thickness = 3;
          this.ui.addControl(atkGlow);

          const atkBtn = new Ellipse("atkBtn");
          atkBtn.width = "72px";
          atkBtn.height = "72px";
          atkBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          atkBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkBtn.left = "-70px";
          atkBtn.top = "-40px";
          atkBtn.background = "rgba(255, 50, 35, 0.35)";
          atkBtn.color = "rgba(255, 80, 60, 0.8)";
          atkBtn.thickness = 2.5;
          this.ui.addControl(atkBtn);

          const atkIcon = new TextBlock("atkIcon", "⚔");
          atkIcon.fontSize = 30;
          atkBtn.addControl(atkIcon);

          const atkLabel = new TextBlock("atkLabel", "ATK");
          atkLabel.color = "rgba(255, 200, 160, 0.5)";
          atkLabel.fontSize = 7;
          atkLabel.fontWeight = "bold";
          atkLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkLabel.top = "-4px";
          atkBtn.addControl(atkLabel);

          // Skill slots around attack (enhanced layout)
          const skills = [
               { id: "skill1", icon: "🔥", label: "Flame", x: -18, y: -122, cd: "3s" },
               { id: "skill2", icon: "❄", label: "Frost", x: -134, y: -58, cd: "" },
               { id: "skill3", icon: "⚡", label: "Storm", x: -134, y: -122, cd: "8s" },
               { id: "dodge", icon: "💨", label: "Dodge", x: -18, y: -58, cd: "" },
               { id: "ult", icon: "☄", label: "ULT", x: -76, y: -122, cd: "25s" },
          ];

          for (const s of skills) {
               const btn = new Ellipse(`${s.id}Btn`);
               btn.width = "50px";
               btn.height = "50px";
               btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
               btn.left = `${s.x}px`;
               btn.top = `${s.y}px`;
               btn.background = "rgba(100, 12, 18, 0.4)";
               btn.color = "rgba(255, 80, 60, 0.5)";
               btn.thickness = 1.5;
               this.ui.addControl(btn);

               const icon = new TextBlock(`${s.id}Icon`, s.icon);
               icon.fontSize = 20;
               icon.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
               icon.top = "6px";
               btn.addControl(icon);

               // Skill label
               const skillLabel = new TextBlock(`${s.id}SkillLabel`, s.label);
               skillLabel.color = "rgba(255, 180, 160, 0.6)";
               skillLabel.fontSize = 7;
               skillLabel.fontWeight = "bold";
               skillLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
               skillLabel.top = "-3px";
               btn.addControl(skillLabel);

               // Cooldown overlay
               if (s.cd) {
                    const cd = new TextBlock(`${s.id}CD`, s.cd);
                    cd.color = "rgba(255, 255, 255, 0.5)";
                    cd.fontSize = 8;
                    cd.fontWeight = "bold";
                    cd.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                    cd.shadowColor = "rgba(0,0,0,0.95)";
                    cd.shadowBlur = 3;
                    btn.addControl(cd);
               }
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── MINIMAP (top-right, below menu) ──────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createMinimap(): void {
          const mapContainer = new Rectangle("minimapContainer");
          mapContainer.width = "72px";
          mapContainer.height = "72px";
          mapContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          mapContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          mapContainer.left = "-5px";
          mapContainer.top = "52px";
          mapContainer.background = "rgba(12, 2, 6, 0.8)";
          mapContainer.color = "rgba(255, 80, 60, 0.45)";
          mapContainer.thickness = 1.5;
          mapContainer.cornerRadius = 36;
          this.ui.addControl(mapContainer);

          // Map placeholder
          const mapLabel = new TextBlock("mapLabel", "🗺");
          mapLabel.fontSize = 22;
          mapLabel.color = "rgba(255, 180, 160, 0.5)";
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

          // Cardinal marks
          const cardinals = [
               { char: "E", hAlign: Control.HORIZONTAL_ALIGNMENT_RIGHT, vAlign: Control.VERTICAL_ALIGNMENT_CENTER, left: "-6px", top: "0px" },
               { char: "W", hAlign: Control.HORIZONTAL_ALIGNMENT_LEFT, vAlign: Control.VERTICAL_ALIGNMENT_CENTER, left: "6px", top: "0px" },
               { char: "S", hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM, left: "0px", top: "-6px" },
          ];
          for (const c of cardinals) {
               const txt = new TextBlock(`compass_${c.char}`, c.char);
               txt.color = "rgba(255, 80, 60, 0.35)";
               txt.fontSize = 7;
               txt.fontWeight = "bold";
               txt.horizontalAlignment = c.hAlign;
               txt.verticalAlignment = c.vAlign;
               txt.left = c.left;
               txt.top = c.top;
               mapContainer.addControl(txt);
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── NOTIFICATION BADGE (floating event alert) ────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createNotificationBadge(): void {
          const notifBar = new Rectangle("notifBar");
          notifBar.width = "180px";
          notifBar.height = "28px";
          notifBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          notifBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          notifBar.top = "48px";
          notifBar.background = "rgba(180, 25, 18, 0.5)";
          notifBar.color = "rgba(255, 80, 60, 0.5)";
          notifBar.thickness = 0.5;
          notifBar.cornerRadius = 14;
          notifBar.alpha = 0.9;
          this.ui.addControl(notifBar);

          const notifText = new TextBlock("notifText", "🔥 Blood Moon Rising Event!");
          notifText.color = "#ffcc88";
          notifText.fontSize = 9;
          notifText.fontWeight = "bold";
          notifText.fontFamily = "'Georgia', serif";
          notifBar.addControl(notifText);

          // Auto-hide after 5 seconds
          setTimeout(() => {
               notifBar.alpha = 0;
          }, 5000);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── UTILITY: Press Animation ─────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private addPressAnimation(btn: Button): void {
          btn.onPointerDownObservable.add(() => {
               btn.scaleX = 0.9;
               btn.scaleY = 0.9;
          });
          btn.onPointerUpObservable.add(() => {
               btn.scaleX = 1.0;
               btn.scaleY = 1.0;
          });
     }
}
