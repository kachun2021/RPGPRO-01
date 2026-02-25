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
 * idealHeight = 1624 (iPhone 14 Pro portrait native)
 * All sizes are tuned for crisp HD rendering on modern phones.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  [Avatar+Stats]  [Location] [≡] │
 * │  [EXP][Currency]        [🗺]   │
 * │                    [Events]     │
 * │                    [Rankings]   │
 * │                    [Faction]    │
 * │                    [Shop]       │
 * │                    [Mail]       │
 * │                    [Quest]      │
 * │                       [AUTO]    │
 * │  [🕹]          [⚡][❄][🔥][⚔]  │
 * │                   [💨] [☄]     │
 * └─────────────────────────────────┘
 */
export class HUD {
     private ui: AdvancedDynamicTexture;

     constructor(private scene: Scene) {
          this.ui = AdvancedDynamicTexture.CreateFullscreenUI("hud", true, scene);
          this.ui.idealHeight = 1624;
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
          const topBar = new Rectangle("topBar");
          topBar.width = "100%";
          topBar.height = "96px";
          topBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          topBar.background = "rgba(10, 0, 8, 0.92)";
          topBar.color = "transparent";
          topBar.thickness = 0;
          this.ui.addControl(topBar);

          // Bottom accent line
          const topAccent = new Rectangle("topAccent");
          topAccent.width = "100%";
          topAccent.height = "2px";
          topAccent.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          topAccent.top = "96px";
          topAccent.background = "rgba(255, 60, 40, 0.18)";
          topAccent.color = "transparent";
          topAccent.thickness = 0;
          this.ui.addControl(topAccent);

          // ── Location Bar (top-center, ornate) ──────────────────────
          const locationBar = new Rectangle("locationBar");
          locationBar.width = "380px";
          locationBar.height = "56px";
          locationBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          locationBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          locationBar.top = "18px";
          locationBar.background = "rgba(100, 12, 18, 0.5)";
          locationBar.color = "rgba(255, 80, 60, 0.55)";
          locationBar.thickness = 1.5;
          locationBar.cornerRadius = 28;
          this.ui.addControl(locationBar);

          const locLeft = new TextBlock("locLeftOrn", "◆");
          locLeft.color = "rgba(255, 80, 60, 0.5)";
          locLeft.fontSize = 14;
          locLeft.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          locLeft.left = "18px";
          locationBar.addControl(locLeft);

          const locRight = new TextBlock("locRightOrn", "◆");
          locRight.color = "rgba(255, 80, 60, 0.5)";
          locRight.fontSize = 14;
          locRight.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          locRight.left = "-18px";
          locationBar.addControl(locRight);

          const locationText = new TextBlock("locationText", "⚔ Ashen Wasteland");
          locationText.color = "#ffaa77";
          locationText.fontSize = 24;
          locationText.fontFamily = "'Georgia', serif";
          locationText.fontWeight = "bold";
          locationText.shadowColor = "rgba(0,0,0,0.95)";
          locationText.shadowBlur = 5;
          locationBar.addControl(locationText);

          // ── Menu Button (top-right) ─────────────────────────────────
          const menuBtn = Button.CreateSimpleButton("menuBtn", "☰");
          menuBtn.width = "76px";
          menuBtn.height = "76px";
          menuBtn.color = "#ff6644";
          menuBtn.fontSize = 38;
          menuBtn.background = "rgba(100, 12, 18, 0.6)";
          menuBtn.cornerRadius = 18;
          menuBtn.thickness = 2;
          menuBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          menuBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          menuBtn.top = "10px";
          menuBtn.left = "-10px";
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
          panel.width = "360px";
          panel.height = "165px";
          panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          panel.top = "10px";
          panel.left = "10px";
          panel.background = "rgba(12, 2, 6, 0.88)";
          panel.color = "rgba(255, 80, 60, 0.4)";
          panel.thickness = 2;
          panel.cornerRadius = 20;
          this.ui.addControl(panel);

          // Avatar glow ring
          const avatarGlow = new Ellipse("avatarGlow");
          avatarGlow.width = "72px";
          avatarGlow.height = "72px";
          avatarGlow.color = "rgba(255, 60, 40, 0.2)";
          avatarGlow.thickness = 4;
          avatarGlow.background = "transparent";
          avatarGlow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          avatarGlow.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          avatarGlow.left = "8px";
          avatarGlow.top = "8px";
          panel.addControl(avatarGlow);

          const avatarFrame = new Ellipse("avatarFrame");
          avatarFrame.width = "64px";
          avatarFrame.height = "64px";
          avatarFrame.color = "#ff5533";
          avatarFrame.thickness = 3;
          avatarFrame.background = "rgba(100, 12, 18, 0.75)";
          avatarFrame.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          avatarFrame.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          avatarFrame.left = "12px";
          avatarFrame.top = "12px";
          panel.addControl(avatarFrame);

          const avatarText = new TextBlock("avatarTxt", "🗡");
          avatarText.fontSize = 28;
          avatarFrame.addControl(avatarText);

          // Level badge
          const levelBadge = new Ellipse("levelBadge");
          levelBadge.width = "28px";
          levelBadge.height = "28px";
          levelBadge.color = "#ff5533";
          levelBadge.thickness = 2;
          levelBadge.background = "rgba(180, 25, 18, 0.95)";
          levelBadge.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          levelBadge.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          levelBadge.left = "56px";
          levelBadge.top = "56px";
          panel.addControl(levelBadge);

          const levelText = new TextBlock("levelNum", "1");
          levelText.color = "#fff";
          levelText.fontSize = 14;
          levelText.fontWeight = "bold";
          levelText.shadowColor = "rgba(0,0,0,0.9)";
          levelText.shadowBlur = 3;
          levelBadge.addControl(levelText);

          // Player name
          const nameText = new TextBlock("playerName", "Dark Knight");
          nameText.color = "#ffe0cc";
          nameText.fontSize = 22;
          nameText.height = "26px";
          nameText.resizeToFit = true;
          nameText.fontFamily = "'Georgia', serif";
          nameText.fontWeight = "bold";
          nameText.shadowColor = "rgba(0,0,0,0.95)";
          nameText.shadowBlur = 5;
          nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          nameText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          nameText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          nameText.left = "95px";
          nameText.top = "12px";
          panel.addControl(nameText);

          // Server / Faction tag
          const serverTag = new TextBlock("serverTag", "S1 · Crimson Order");
          serverTag.color = "rgba(255, 160, 130, 0.7)";
          serverTag.fontSize = 14;
          serverTag.height = "20px";
          serverTag.resizeToFit = true;
          serverTag.fontFamily = "'Georgia', serif";
          serverTag.shadowColor = "rgba(0,0,0,0.8)";
          serverTag.shadowBlur = 3;
          serverTag.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          serverTag.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          serverTag.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          serverTag.left = "95px";
          serverTag.top = "38px";
          panel.addControl(serverTag);

          // Status Bars (HP, MP, ST) properly spaced below the name
          this.createStatusBar(panel, "hp", "HP", 85, "#c4302b", "#8b1a18", "95px", "65px", "250px");
          this.createStatusBar(panel, "mp", "MP", 60, "#3355cc", "#1a2b66", "95px", "95px", "250px");
          this.createStatusBar(panel, "sta", "ST", 100, "#55aa30", "#2d5518", "95px", "125px", "250px");
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
          container.height = "26px";
          container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          container.left = left;
          container.top = top;
          container.background = "rgba(0, 0, 0, 0.75)";
          container.color = `${bgGlow}44`;
          container.thickness = 1;
          container.cornerRadius = 7;
          parent.addControl(container);

          const fill = new Rectangle(`${id}BarFill`);
          fill.width = `${percent}%`;
          fill.height = "100%";
          fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          fill.background = fillColor;
          fill.color = "transparent";
          fill.thickness = 0;
          fill.cornerRadius = 7;
          container.addControl(fill);

          // Shimmer highlight
          const shimmer = new Rectangle(`${id}Shimmer`);
          shimmer.width = "40%";
          shimmer.height = "35%";
          shimmer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          shimmer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          shimmer.background = "rgba(255,255,255,0.06)";
          shimmer.color = "transparent";
          shimmer.thickness = 0;
          shimmer.cornerRadius = 5;
          fill.addControl(shimmer);

          const text = new TextBlock(`${id}Label`, `${label} ${percent}%`);
          text.color = "#ffffff";
          text.fontSize = 16;
          text.fontWeight = "bold";
          text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          text.shadowColor = "rgba(0,0,0,1.0)";
          text.shadowBlur = 5;
          container.addControl(text);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── EXP BAR ──────────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createExpBar(): void {
          const expContainer = new Rectangle("expBarContainer");
          expContainer.width = "360px";
          expContainer.height = "18px";
          expContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          expContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          expContainer.left = "10px";
          expContainer.top = "172px";
          expContainer.background = "rgba(0, 0, 0, 0.6)";
          expContainer.color = "rgba(255, 200, 100, 0.3)";
          expContainer.thickness = 1;
          expContainer.cornerRadius = 9;
          this.ui.addControl(expContainer);

          const expFill = new Rectangle("expFill");
          expFill.width = "35%";
          expFill.height = "100%";
          expFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          expFill.background = "rgba(255, 180, 60, 0.7)";
          expFill.color = "transparent";
          expFill.thickness = 0;
          expFill.cornerRadius = 9;
          expContainer.addControl(expFill);

          const expLabel = new TextBlock("expLabel", "EXP 350/1000");
          expLabel.color = "rgba(255, 220, 150, 0.9)";
          expLabel.fontSize = 13;
          expLabel.fontWeight = "bold";
          expLabel.shadowColor = "rgba(0,0,0,0.9)";
          expLabel.shadowBlur = 3;
          expContainer.addControl(expLabel);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── CURRENCY BAR ─────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createCurrencyBar(): void {
          const currencyPanel = new StackPanel("currencyPanel");
          currencyPanel.width = "350px";
          currencyPanel.height = "34px";
          currencyPanel.isVertical = false;
          currencyPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          currencyPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          currencyPanel.left = "10px";
          currencyPanel.top = "196px";
          this.ui.addControl(currencyPanel);

          const currencies = [
               { icon: "💰", value: "12.5K", color: "#ffcc44" },
               { icon: "💎", value: "340", color: "#88ccff" },
               { icon: "⚡", value: "80/80", color: "#ff8844" },
          ];

          for (const c of currencies) {
               const item = new Rectangle(`currency_${c.icon}`);
               item.width = "114px";
               item.height = "30px";
               item.background = "rgba(12, 2, 6, 0.75)";
               item.color = "rgba(255, 80, 60, 0.2)";
               item.thickness = 1;
               item.cornerRadius = 7;
               currencyPanel.addControl(item);

               const txt = new TextBlock(`currTxt_${c.icon}`, `${c.icon} ${c.value}`);
               txt.color = c.color;
               txt.fontSize = 16;
               txt.fontWeight = "bold";
               txt.shadowColor = "rgba(0,0,0,0.95)";
               txt.shadowBlur = 4;
               item.addControl(txt);
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── RIGHT SIDEBAR ────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createRightSidebar(): void {
          const sidebar = new StackPanel("rightSidebar");
          sidebar.width = "86px";
          sidebar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          sidebar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          sidebar.left = "-8px";
          sidebar.top = "50px";
          sidebar.isVertical = true;
          sidebar.spacing = 8;
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
          container.width = "82px";
          container.height = "88px";
          container.background = "rgba(100, 12, 18, 0.45)";
          container.color = "rgba(255, 80, 60, 0.35)";
          container.thickness = 1.5;
          container.cornerRadius = 14;

          const iconText = new TextBlock(`${id}Icon`, icon);
          iconText.fontSize = 32;
          iconText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          iconText.top = "10px";
          container.addControl(iconText);

          const labelText = new TextBlock(`${id}Label`, label);
          labelText.color = "#ffccbb";
          labelText.fontSize = 16;
          labelText.fontWeight = "bold";
          labelText.shadowColor = "rgba(0,0,0,0.95)";
          labelText.shadowBlur = 4;
          labelText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          labelText.top = "-8px";
          container.addControl(labelText);

          if (badge) {
               const badgeCircle = new Ellipse(`${id}Badge`);
               badgeCircle.width = "28px";
               badgeCircle.height = "28px";
               badgeCircle.background = "#e03030";
               badgeCircle.color = "#ff6644";
               badgeCircle.thickness = 1.5;
               badgeCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               badgeCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
               badgeCircle.left = "6px";
               badgeCircle.top = "-6px";
               container.addControl(badgeCircle);

               const badgeText = new TextBlock(`${id}BadgeTxt`, badge);
               badgeText.color = "#ffffff";
               badgeText.fontSize = 15;
               badgeText.fontWeight = "bold";
               badgeText.shadowColor = "rgba(0,0,0,0.8)";
               badgeText.shadowBlur = 3;
               badgeCircle.addControl(badgeText);
          }

          return container;
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── BOTTOM BAR: Skills + Auto-Battle ─────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createBottomBar(): void {
          const bottomBg = new Rectangle("bottomBg");
          bottomBg.width = "100%";
          bottomBg.height = "280px";
          bottomBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          bottomBg.background = "rgba(8, 0, 6, 0.78)";
          bottomBg.color = "transparent";
          bottomBg.thickness = 0;
          this.ui.addControl(bottomBg);

          const bottomAccent = new Rectangle("bottomAccent");
          bottomAccent.width = "100%";
          bottomAccent.height = "2px";
          bottomAccent.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          bottomAccent.top = "-280px";
          bottomAccent.background = "rgba(255, 60, 40, 0.12)";
          bottomAccent.color = "transparent";
          bottomAccent.thickness = 0;
          this.ui.addControl(bottomAccent);

          this.createSkillButtons();

          // Auto-Battle toggle
          const autoBg = new Rectangle("autoBg");
          autoBg.width = "112px";
          autoBg.height = "52px";
          autoBg.cornerRadius = 26;
          autoBg.background = "rgba(100, 12, 18, 0.5)";
          autoBg.color = "rgba(255, 80, 60, 0.45)";
          autoBg.thickness = 1.5;
          autoBg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          autoBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          autoBg.left = "-16px";
          autoBg.top = "-286px";
          this.ui.addControl(autoBg);

          const autoBtn = Button.CreateSimpleButton("autoBtn", "⚙ AUTO");
          autoBtn.width = "108px";
          autoBtn.height = "48px";
          autoBtn.color = "#ff6644";
          autoBtn.fontSize = 20;
          autoBtn.fontFamily = "'Georgia', serif";
          autoBtn.fontWeight = "bold";
          autoBtn.background = "transparent";
          autoBtn.cornerRadius = 24;
          autoBtn.thickness = 0;
          autoBg.addControl(autoBtn);

          let autoActive = false;
          this.addPressAnimation(autoBtn);
          autoBtn.onPointerClickObservable.add(() => {
               autoActive = !autoActive;
               autoBg.background = autoActive ? "rgba(255, 80, 60, 0.5)" : "rgba(100, 12, 18, 0.5)";
               autoBtn.color = autoActive ? "#ffffff" : "#ff6644";
               console.log(`[HUD] Auto-Battle: ${autoActive ? "ON" : "OFF"}`);
          });

          // Speed toggle
          const speedBtn = Button.CreateSimpleButton("speedBtn", "×1");
          speedBtn.width = "64px";
          speedBtn.height = "40px";
          speedBtn.color = "rgba(255, 180, 140, 0.7)";
          speedBtn.fontSize = 18;
          speedBtn.background = "rgba(100, 12, 18, 0.4)";
          speedBtn.cornerRadius = 20;
          speedBtn.thickness = 1;
          speedBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          speedBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          speedBtn.left = "-136px";
          speedBtn.top = "-292px";
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
          // Main attack (large)
          const atkGlow = new Ellipse("atkGlow");
          atkGlow.width = "146px";
          atkGlow.height = "146px";
          atkGlow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          atkGlow.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkGlow.left = "-118px";
          atkGlow.top = "-62px";
          atkGlow.background = "transparent";
          atkGlow.color = "rgba(255, 60, 40, 0.12)";
          atkGlow.thickness = 4;
          this.ui.addControl(atkGlow);

          const atkBtn = new Ellipse("atkBtn");
          atkBtn.width = "130px";
          atkBtn.height = "130px";
          atkBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          atkBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkBtn.left = "-126px";
          atkBtn.top = "-70px";
          atkBtn.background = "rgba(255, 50, 35, 0.3)";
          atkBtn.color = "rgba(255, 80, 60, 0.75)";
          atkBtn.thickness = 3;
          this.ui.addControl(atkBtn);

          const atkIcon = new TextBlock("atkIcon", "⚔");
          atkIcon.fontSize = 52;
          atkBtn.addControl(atkIcon);

          const atkLabel = new TextBlock("atkLabel", "ATK");
          atkLabel.color = "rgba(255, 200, 160, 0.5)";
          atkLabel.fontSize = 13;
          atkLabel.fontWeight = "bold";
          atkLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkLabel.top = "-8px";
          atkBtn.addControl(atkLabel);

          // Skills
          const skills = [
               { id: "skill1", icon: "🔥", label: "Flame", x: -30, y: -216, cd: "3s" },
               { id: "skill2", icon: "❄", label: "Frost", x: -240, y: -100, cd: "" },
               { id: "skill3", icon: "⚡", label: "Storm", x: -240, y: -216, cd: "8s" },
               { id: "dodge", icon: "💨", label: "Dodge", x: -30, y: -100, cd: "" },
               { id: "ult", icon: "☄", label: "ULT", x: -135, y: -216, cd: "25s" },
          ];

          for (const s of skills) {
               const btn = new Ellipse(`${s.id}Btn`);
               btn.width = "90px";
               btn.height = "90px";
               btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
               btn.left = `${s.x}px`;
               btn.top = `${s.y}px`;
               btn.background = "rgba(100, 12, 18, 0.35)";
               btn.color = "rgba(255, 80, 60, 0.45)";
               btn.thickness = 2;
               this.ui.addControl(btn);

               const icon = new TextBlock(`${s.id}Icon`, s.icon);
               icon.fontSize = 34;
               icon.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
               icon.top = "12px";
               btn.addControl(icon);

               const skillLabel = new TextBlock(`${s.id}SkillLabel`, s.label);
               skillLabel.color = "rgba(255, 180, 160, 0.6)";
               skillLabel.fontSize = 13;
               skillLabel.fontWeight = "bold";
               skillLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
               skillLabel.top = "-6px";
               btn.addControl(skillLabel);

               if (s.cd) {
                    const cd = new TextBlock(`${s.id}CD`, s.cd);
                    cd.color = "rgba(255, 255, 255, 0.45)";
                    cd.fontSize = 14;
                    cd.fontWeight = "bold";
                    cd.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                    cd.shadowColor = "rgba(0,0,0,0.95)";
                    cd.shadowBlur = 4;
                    btn.addControl(cd);
               }
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── MINIMAP ──────────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createMinimap(): void {
          const mapContainer = new Rectangle("minimapContainer");
          mapContainer.width = "130px";
          mapContainer.height = "130px";
          mapContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          mapContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          mapContainer.left = "-8px";
          mapContainer.top = "94px";
          mapContainer.background = "rgba(12, 2, 6, 0.82)";
          mapContainer.color = "rgba(255, 80, 60, 0.4)";
          mapContainer.thickness = 2;
          mapContainer.cornerRadius = 65;
          this.ui.addControl(mapContainer);

          const mapLabel = new TextBlock("mapLabel", "🗺");
          mapLabel.fontSize = 38;
          mapLabel.color = "rgba(255, 180, 160, 0.45)";
          mapContainer.addControl(mapLabel);

          const playerDot = new Ellipse("playerDot");
          playerDot.width = "10px";
          playerDot.height = "10px";
          playerDot.background = "#ff5533";
          playerDot.color = "#ff8866";
          playerDot.thickness = 2;
          mapContainer.addControl(playerDot);

          const compass = new TextBlock("compass", "N");
          compass.color = "rgba(255, 80, 60, 0.85)";
          compass.fontSize = 16;
          compass.fontWeight = "bold";
          compass.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          compass.top = "10px";
          mapContainer.addControl(compass);

          const cardinals = [
               { char: "E", hAlign: Control.HORIZONTAL_ALIGNMENT_RIGHT, vAlign: Control.VERTICAL_ALIGNMENT_CENTER, left: "-10px", top: "0px" },
               { char: "W", hAlign: Control.HORIZONTAL_ALIGNMENT_LEFT, vAlign: Control.VERTICAL_ALIGNMENT_CENTER, left: "10px", top: "0px" },
               { char: "S", hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM, left: "0px", top: "-10px" },
          ];
          for (const c of cardinals) {
               const txt = new TextBlock(`compass_${c.char}`, c.char);
               txt.color = "rgba(255, 80, 60, 0.35)";
               txt.fontSize = 13;
               txt.fontWeight = "bold";
               txt.horizontalAlignment = c.hAlign;
               txt.verticalAlignment = c.vAlign;
               txt.left = c.left;
               txt.top = c.top;
               mapContainer.addControl(txt);
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── NOTIFICATION BADGE ───────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createNotificationBadge(): void {
          const notifBar = new Rectangle("notifBar");
          notifBar.width = "330px";
          notifBar.height = "48px";
          notifBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          notifBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          notifBar.top = "82px";
          notifBar.background = "rgba(180, 25, 18, 0.45)";
          notifBar.color = "rgba(255, 80, 60, 0.45)";
          notifBar.thickness = 1;
          notifBar.cornerRadius = 24;
          notifBar.alpha = 0.95;
          this.ui.addControl(notifBar);

          const notifText = new TextBlock("notifText", "🔥 Blood Moon Rising Event!");
          notifText.color = "#ffcc88";
          notifText.fontSize = 17;
          notifText.fontWeight = "bold";
          notifText.fontFamily = "'Georgia', serif";
          notifBar.addControl(notifText);

          setTimeout(() => { notifBar.alpha = 0; }, 5000);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── UTILITY ──────────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private addPressAnimation(btn: Button): void {
          btn.onPointerDownObservable.add(() => {
               btn.scaleX = 0.92;
               btn.scaleY = 0.92;
          });
          btn.onPointerUpObservable.add(() => {
               btn.scaleX = 1.0;
               btn.scaleY = 1.0;
          });
     }
}
