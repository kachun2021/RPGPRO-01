import { Scene } from "@babylonjs/core/scene";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { PlayerStats } from "../entities/Player";

/**
 * Premium Vertical HUD — Genshin/Wuthering Waves Aesthetic
 * - Minimalist glassmorphic panels
 * - Inter & Cinzel fonts for crisp high-end typography
 * - Curved bottom-right combat layout
 * - Ultra-thin stat bars
 */
export class HUD {
     private ui: AdvancedDynamicTexture;
     private hpFill!: Rectangle;
     private mpFill!: Rectangle;
     private hpLabel!: TextBlock;
     private mpLabel!: TextBlock;
     private expFill!: Rectangle;
     private levelText!: TextBlock;
     private goldText!: TextBlock;
     private gemsText!: TextBlock;

     // Skill system observables
     public readonly onSkillUse = new Observable<string>();
     public readonly onAutoBattleToggle = new Observable<boolean>();

     // Cooldown overlays per skill button
     private skillCDOverlays = new Map<string, Rectangle>();
     private skillCDTexts = new Map<string, TextBlock>();

     /** Callback to toggle character sheet */
     public onCharacterButton: (() => void) | null = null;

     constructor(private scene: Scene) {
          // Render at ideal size for super crisp text on mobile displays
          this.ui = AdvancedDynamicTexture.CreateFullscreenUI("hud", true, scene);
          this.ui.idealHeight = 1624;
          this.ui.renderAtIdealSize = false;
          this.ui.isForeground = true;

          this.createTopBar();
          this.createAvatarPanel();
          this.createCurrencyBar();
          this.createMinimap();
          this.createRightSidebar();
          this.createExpBar();
          this.createBottomBar();
          this.createNotificationBadge();
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── TOP BAR: Location & Atmosphere ────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createTopBar(): void {
          const locationBar = new Rectangle("locationBar");
          locationBar.width = "440px";
          locationBar.height = "90px";
          locationBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          locationBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          locationBar.top = "12px";
          locationBar.thickness = 0;
          this.ui.addControl(locationBar);

          const locationText = new TextBlock("locationText", "Ashen Wasteland");
          locationText.color = "#ffffff";
          locationText.fontSize = 32;
          locationText.fontFamily = "'Cinzel', serif";
          locationText.fontWeight = "700";
          locationText.shadowColor = "rgba(0,0,0,0.8)";
          locationText.shadowBlur = 6;
          locationText.shadowOffsetX = 1;
          locationText.shadowOffsetY = 2;
          locationBar.addControl(locationText);

          const subText = new TextBlock("subText", "EXPLORATION REGION");
          subText.color = "rgba(255, 255, 255, 0.6)";
          subText.fontSize = 14;
          subText.fontFamily = "'Inter', sans-serif";
          subText.fontWeight = "600";
          subText.top = "28px";
          locationBar.addControl(subText);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── AVATAR PANEL: Minimalist Stats ───────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createAvatarPanel(): void {
          const panel = new Rectangle("avatarPanel");
          panel.width = "420px";
          panel.height = "100px";
          panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          panel.top = "70px";
          panel.left = "16px";
          panel.background = "rgba(0, 0, 0, 0.5)";
          panel.color = "rgba(255, 255, 255, 0.15)";
          panel.thickness = 1;
          panel.cornerRadius = 16;
          this.ui.addControl(panel);

          // Avatar circular frame
          const avatarFrame = new Ellipse("avatarFrame");
          avatarFrame.width = "70px";
          avatarFrame.height = "70px";
          avatarFrame.color = "rgba(255, 255, 255, 0.5)";
          avatarFrame.thickness = 2;
          avatarFrame.background = "rgba(30, 30, 40, 0.9)";
          avatarFrame.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          avatarFrame.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          avatarFrame.left = "14px";
          panel.addControl(avatarFrame);

          const avatarText = new TextBlock("avatarTxt", "👤");
          avatarText.fontSize = 34;
          avatarFrame.addControl(avatarText);

          // Level badge
          const levelBadge = new Ellipse("levelBadge");
          levelBadge.width = "28px";
          levelBadge.height = "28px";
          levelBadge.color = "rgba(255,255,255,0.8)";
          levelBadge.thickness = 2;
          levelBadge.background = "#1a1a2e";
          levelBadge.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          levelBadge.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          levelBadge.left = "62px";
          levelBadge.top = "-4px";
          panel.addControl(levelBadge);

          const levelText = new TextBlock("levelNum", "1");
          levelText.color = "#fff";
          levelText.fontSize = 14;
          levelText.fontFamily = "'Inter', sans-serif";
          levelText.fontWeight = "700";
          levelBadge.addControl(levelText);
          this.levelText = levelText;

          // Player name — positioned clearly right of avatar
          const nameText = new TextBlock("playerName", "Wanderer");
          nameText.color = "#ffffff";
          nameText.fontSize = 22;
          nameText.fontFamily = "'Inter', sans-serif";
          nameText.fontWeight = "700";
          nameText.shadowColor = "rgba(0,0,0,0.7)";
          nameText.shadowBlur = 4;
          nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          nameText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          nameText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          nameText.left = "100px";
          nameText.top = "12px";
          panel.addControl(nameText);

          // HP Bar
          this.createStatusBar(panel, "hp", "HP", 100, "#73d13d", "100px", "42px", "200px");
          // MP Bar
          this.createStatusBar(panel, "mp", "MP", 100, "#40a9ff", "100px", "64px", "180px");
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
          container.height = "14px";
          container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          container.left = left;
          container.top = top;
          container.background = "rgba(0, 0, 0, 0.6)";
          container.color = "rgba(255, 255, 255, 0.15)";
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

          // Value overlay (shifted right)
          const text = new TextBlock(`${id}Label`, `${percent}%`);
          text.fontFamily = "'Inter', sans-serif";
          text.color = "#ffffff";
          text.fontSize = 13;
          text.fontWeight = "700";
          text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          text.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          text.left = `${parseInt(width) + 8}px`; // display next to bar
          text.top = "-2px";
          text.shadowColor = "rgba(0,0,0,0.8)";
          text.shadowBlur = 2;
          container.addControl(text);

          if (id === "hp") { this.hpFill = fill; this.hpLabel = text; }
          if (id === "mp") { this.mpFill = fill; this.mpLabel = text; }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── BOTTOM EXP BAR ────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createExpBar(): void {
          const expContainer = new Rectangle("expBarContainer");
          expContainer.width = "100%";
          expContainer.height = "4px";
          expContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          expContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          expContainer.background = "rgba(0, 0, 0, 0.4)";
          expContainer.thickness = 0;
          this.ui.addControl(expContainer);

          const expFill = new Rectangle("expFill");
          expFill.width = "35%";
          expFill.height = "100%";
          expFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          expFill.background = "#faad14";
          expFill.thickness = 0;
          expContainer.addControl(expFill);

          this.expFill = expFill;
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── CURRENCY ──────────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createCurrencyBar(): void {
          const currencyPanel = new StackPanel("currencyPanel");
          currencyPanel.width = "300px";
          currencyPanel.height = "40px";
          currencyPanel.isVertical = false;
          currencyPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          currencyPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          currencyPanel.left = "-16px";
          currencyPanel.top = "12px";
          this.ui.addControl(currencyPanel);

          const currencies = [
               { id: "gold", icon: "🪙", color: "#faad14" },
               { id: "gems", icon: "💠", color: "#69c0ff" },
          ];

          for (const c of currencies) {
               const item = new Rectangle(`currency_${c.id}`);
               item.width = "130px";
               item.height = "40px";
               item.background = "rgba(0, 0, 0, 0.55)";
               item.color = "rgba(255, 255, 255, 0.15)";
               item.thickness = 1;
               item.cornerRadius = 20;
               currencyPanel.addControl(item);

               const txt = new TextBlock(`currTxt_${c.id}`, `${c.icon} 0`);
               txt.color = "#ffffff";
               txt.fontSize = 18;
               txt.fontFamily = "'Inter', sans-serif";
               txt.fontWeight = "600";
               item.addControl(txt);

               if (c.id === "gold") this.goldText = txt;
               if (c.id === "gems") this.gemsText = txt;
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── MINIMAP ───────────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createMinimap(): void {
          // Outer wrapper for collapse/expand
          const mapWrapper = new Rectangle("minimapWrapper");
          mapWrapper.width = "130px";
          mapWrapper.height = "170px";
          mapWrapper.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          mapWrapper.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          mapWrapper.left = "-10px";
          mapWrapper.top = "50px";
          mapWrapper.thickness = 0;
          this.ui.addControl(mapWrapper);

          // Main circular minimap
          const mapContainer = new Ellipse("minimapContainer");
          mapContainer.width = "110px";
          mapContainer.height = "110px";
          mapContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          mapContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          mapContainer.top = "0px";
          mapContainer.background = "rgba(10, 12, 18, 0.75)";
          mapContainer.color = "rgba(255, 255, 255, 0.35)";
          mapContainer.thickness = 2;
          mapWrapper.addControl(mapContainer);

          // Compass ring (outer)
          const compassRing = new Ellipse("compassRing");
          compassRing.width = "122px";
          compassRing.height = "122px";
          compassRing.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          compassRing.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          compassRing.top = "-6px";
          compassRing.color = "rgba(255, 255, 255, 0.12)";
          compassRing.thickness = 1;
          compassRing.background = "transparent";
          mapWrapper.addControl(compassRing);

          // Player dot
          const playerDot = new Ellipse("playerDot");
          playerDot.width = "10px";
          playerDot.height = "10px";
          playerDot.background = "#ffffff";
          playerDot.color = "rgba(255,255,255,0.6)";
          playerDot.thickness = 2;
          mapContainer.addControl(playerDot);

          // Direction indicator
          const dirArrow = new TextBlock("dirArrow", "▲");
          dirArrow.color = "#73d13d";
          dirArrow.fontSize = 14;
          dirArrow.top = "-16px";
          mapContainer.addControl(dirArrow);

          // Compass letters
          const compassData = [
               { id: "N", vAlign: Control.VERTICAL_ALIGNMENT_TOP, hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, t: "6px", l: "0px" },
               { id: "S", vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM, hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, t: "-6px", l: "0px" },
               { id: "E", vAlign: Control.VERTICAL_ALIGNMENT_CENTER, hAlign: Control.HORIZONTAL_ALIGNMENT_RIGHT, t: "0px", l: "-6px" },
               { id: "W", vAlign: Control.VERTICAL_ALIGNMENT_CENTER, hAlign: Control.HORIZONTAL_ALIGNMENT_LEFT, t: "0px", l: "6px" },
          ];
          for (const c of compassData) {
               const txt = new TextBlock(`compass_${c.id}`, c.id);
               txt.fontFamily = "'Inter', sans-serif";
               txt.color = c.id === "N" ? "rgba(255,100,100,0.9)" : "rgba(255,255,255,0.5)";
               txt.fontSize = c.id === "N" ? 14 : 11;
               txt.fontWeight = "700";
               txt.verticalAlignment = c.vAlign;
               txt.horizontalAlignment = c.hAlign;
               txt.top = c.t;
               txt.left = c.l;
               mapContainer.addControl(txt);
          }

          // Toggle / collapse button 
          const toggleBtn = new Rectangle("mapToggle");
          toggleBtn.width = "58px";
          toggleBtn.height = "28px";
          toggleBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          toggleBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          toggleBtn.top = "118px";
          toggleBtn.background = "rgba(0, 0, 0, 0.5)";
          toggleBtn.color = "rgba(255, 255, 255, 0.2)";
          toggleBtn.thickness = 1;
          toggleBtn.cornerRadius = 14;
          toggleBtn.isPointerBlocker = true;
          mapWrapper.addControl(toggleBtn);

          const toggleTxt = new TextBlock("mapToggleTxt", "▲ MAP");
          toggleTxt.fontFamily = "'Inter', sans-serif";
          toggleTxt.fontSize = 10;
          toggleTxt.fontWeight = "700";
          toggleTxt.color = "rgba(255, 255, 255, 0.6)";
          toggleBtn.addControl(toggleTxt);

          let mapExpanded = true;
          toggleBtn.onPointerClickObservable.add(() => {
               mapExpanded = !mapExpanded;
               mapContainer.isVisible = mapExpanded;
               compassRing.isVisible = mapExpanded;
               toggleTxt.text = mapExpanded ? "▲ MAP" : "▼ MAP";
               toggleBtn.top = mapExpanded ? "118px" : "0px";
               mapWrapper.height = mapExpanded ? "170px" : "36px";
          });
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── RIGHT SIDEBAR ─────────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createRightSidebar(): void {
          const sidebar = new StackPanel("rightSidebar");
          sidebar.width = "100px";
          sidebar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          sidebar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          sidebar.left = "-12px";
          sidebar.top = "80px";
          sidebar.isVertical = true;
          sidebar.spacing = 16;
          this.ui.addControl(sidebar);

          const icons = [
               { id: "character", icon: "✦", badge: "" },
               { id: "inventory", icon: "🎒", badge: "!" },
               { id: "quests", icon: "📜", badge: "" },
               { id: "gacha", icon: "🌟", badge: "1" },
          ];

          for (const item of icons) {
               const btn = this.createSidebarButton(item.id, item.icon, item.badge);
               btn.isPointerBlocker = true;
               if (item.id === "character") {
                    btn.onPointerClickObservable.add(() => {
                         if (this.onCharacterButton) this.onCharacterButton();
                    });
               }
               sidebar.addControl(btn);
          }
     }

     private createSidebarButton(id: string, icon: string, badge: string): Rectangle {
          const container = new Rectangle(`sidebar_${id}`);
          container.width = "72px";
          container.height = "72px";
          container.background = "rgba(10, 10, 15, 0.65)";
          container.color = "rgba(255, 255, 255, 0.35)";
          container.thickness = 2;
          container.cornerRadius = 36;

          const iconText = new TextBlock(`${id}Icon`, icon);
          iconText.fontSize = 36;
          iconText.color = "#ffffff";
          container.addControl(iconText);

          if (badge) {
               const badgeCircle = new Ellipse(`${id}Badge`);
               badgeCircle.width = "24px";
               badgeCircle.height = "24px";
               badgeCircle.background = "#ff4d4f";
               badgeCircle.color = "transparent";
               badgeCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               badgeCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
               badgeCircle.left = "4px";
               badgeCircle.top = "-4px";
               container.addControl(badgeCircle);

               if (badge !== "!") {
                    const badgeText = new TextBlock(`${id}BadgeTxt`, badge);
                    badgeText.color = "#ffffff";
                    badgeText.fontFamily = "'Inter', sans-serif";
                    badgeText.fontSize = 14;
                    badgeText.fontWeight = "700";
                    badgeCircle.addControl(badgeText);
               }
          }

          container.onPointerDownObservable.add(() => { container.scaleX = 0.9; container.scaleY = 0.9; });
          container.onPointerUpObservable.add(() => { container.scaleX = 1.0; container.scaleY = 1.0; });

          return container;
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── COMBAT SKILLS (Ultra Premium Curved Layout) ─────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createBottomBar(): void {
          const bottomBg = new Rectangle("bottomBg");
          bottomBg.width = "100%";
          bottomBg.height = "350px";
          bottomBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          bottomBg.background = "transparent";
          bottomBg.thickness = 0;
          this.ui.addControl(bottomBg);

          // Add Auto Battle toggle cleanly
          const autoBtn = new Rectangle("autoBtn");
          autoBtn.width = "120px";
          autoBtn.height = "48px";
          autoBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          autoBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          autoBtn.left = "-30px";
          autoBtn.top = "-300px";
          autoBtn.background = "rgba(10, 10, 15, 0.65)";
          autoBtn.color = "rgba(255, 255, 255, 0.4)";
          autoBtn.thickness = 2;
          autoBtn.cornerRadius = 24;
          this.ui.addControl(autoBtn);

          const autoTxt = new TextBlock("autoTxt", "⚙ AUTO");
          autoTxt.fontFamily = "'Inter', sans-serif";
          autoTxt.fontSize = 18;
          autoTxt.fontWeight = "700";
          autoTxt.color = "rgba(255, 255, 255, 0.7)";
          autoBtn.addControl(autoTxt);

          let autoActive = false;
          autoBtn.onPointerClickObservable.add(() => {
               autoActive = !autoActive;
               autoBtn.background = autoActive ? "rgba(255, 255, 255, 0.9)" : "rgba(10, 10, 15, 0.5)";
               autoTxt.color = autoActive ? "#000000" : "rgba(255, 255, 255, 0.7)";
               this.onAutoBattleToggle.notifyObservers(autoActive);
          });

          this.createSkillButtons();
     }

     private createSkillButtons(): void {
          const baseRight = -40;
          const baseBot = -60;

          // Main attack 
          const atkBtn = new Ellipse("atkBtn");
          atkBtn.width = "150px";
          atkBtn.height = "150px";
          atkBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          atkBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkBtn.left = `${baseRight}px`;
          atkBtn.top = `${baseBot}px`;
          atkBtn.background = "rgba(20, 20, 25, 0.55)";
          atkBtn.color = "rgba(255, 255, 255, 0.45)";
          atkBtn.thickness = 3;
          this.ui.addControl(atkBtn);

          const atkInner = new Ellipse("atkInner");
          atkInner.width = "128px";
          atkInner.height = "128px";
          atkInner.background = "rgba(255, 255, 255, 0.12)";
          atkInner.thickness = 0;
          atkBtn.addControl(atkInner);

          const atkIcon = new TextBlock("atkIcon", "⚔️");
          atkIcon.fontSize = 58;
          atkBtn.addControl(atkIcon);

          // Cooldown overlay for ATK
          this.addCooldownOverlay(atkBtn, "atk");

          atkBtn.onPointerDownObservable.add(() => { atkBtn.scaleX = 0.9; atkBtn.scaleY = 0.9; atkBtn.background = "rgba(255, 255, 255, 0.2)"; });
          atkBtn.onPointerUpObservable.add(() => { atkBtn.scaleX = 1; atkBtn.scaleY = 1; atkBtn.background = "rgba(20, 20, 25, 0.4)"; });
          atkBtn.onPointerClickObservable.add(() => { this.onSkillUse.notifyObservers("atk"); });

          // Curved Skills
          const skills = [
               { id: "dodge", icon: "💨", r: 120, angle: 165 },
               { id: "skill1", icon: "⚡", r: 150, angle: 120 },
               { id: "skill2", icon: "❄️", r: 150, angle: 80 },
               { id: "ult", icon: "💥", r: 130, angle: 30 },  // Ultimate
          ];

          for (const s of skills) {
               const rad = s.angle * Math.PI / 180;
               const btnSize = s.id === "ult" ? 105 : 90;
               const targetLeft = baseRight - (Math.cos(rad) * s.r);
               const targetTop = baseBot - (Math.sin(rad) * s.r);

               const btn = new Ellipse(`${s.id}Btn`);
               btn.width = `${btnSize}px`;
               btn.height = `${btnSize}px`;
               btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
               btn.left = `${targetLeft}px`;
               btn.top = `${targetTop}px`;
               btn.background = s.id === "ult" ? "rgba(250, 173, 20, 0.35)" : "rgba(20, 20, 25, 0.6)";
               btn.color = s.id === "ult" ? "rgba(250, 173, 20, 0.7)" : "rgba(255, 255, 255, 0.35)";
               btn.thickness = 2.5;
               this.ui.addControl(btn);

               const icon = new TextBlock(`${s.id}Icon`, s.icon);
               icon.fontSize = s.id === "ult" ? 46 : 38;
               btn.addControl(icon);

               // Cooldown overlay
               this.addCooldownOverlay(btn, s.id);

               btn.onPointerDownObservable.add(() => { btn.scaleX = 0.9; btn.scaleY = 0.9; btn.background = "rgba(255,255,255,0.2)"; });
               btn.onPointerUpObservable.add(() => { btn.scaleX = 1; btn.scaleY = 1; btn.background = s.id === "ult" ? "rgba(250, 173, 20, 0.2)" : "rgba(20, 20, 25, 0.45)"; });
               btn.onPointerClickObservable.add(() => { this.onSkillUse.notifyObservers(s.id); });
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── COOLDOWN OVERLAY ──────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private addCooldownOverlay(parent: Ellipse, skillId: string): void {
          const overlay = new Rectangle(`cd_${skillId}`);
          overlay.width = "100%";
          overlay.height = "0%"; // grows from bottom
          overlay.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          overlay.background = "rgba(0, 0, 0, 0.65)";
          overlay.color = "transparent";
          overlay.thickness = 0;
          overlay.isVisible = false;
          overlay.isHitTestVisible = false;
          parent.addControl(overlay);
          this.skillCDOverlays.set(skillId, overlay);

          const cdText = new TextBlock(`cdTxt_${skillId}`, "");
          cdText.color = "#ffffff";
          cdText.fontSize = 22;
          cdText.fontFamily = "'Inter', sans-serif";
          cdText.fontWeight = "700";
          cdText.isVisible = false;
          cdText.isHitTestVisible = false;
          parent.addControl(cdText);
          this.skillCDTexts.set(skillId, cdText);
     }

     public updateSkillCooldown(skillId: string, remaining: number, total: number): void {
          const overlay = this.skillCDOverlays.get(skillId);
          const text = this.skillCDTexts.get(skillId);
          if (!overlay || !text) return;

          if (remaining <= 0) {
               overlay.isVisible = false;
               text.isVisible = false;
          } else {
               const pct = Math.min(100, (remaining / total) * 100);
               overlay.isVisible = true;
               overlay.height = `${pct}%`;
               text.isVisible = true;
               text.text = remaining >= 1 ? `${Math.ceil(remaining)}` : "";
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── DYNAMIC UPDATES ───────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     public updateFromStats(s: PlayerStats): void {
          const hpPct = Math.max(0, Math.min(100, Math.round((s.hp / s.maxHp) * 100)));
          const mpPct = Math.max(0, Math.min(100, Math.round((s.mp / s.maxMp) * 100)));
          const expPct = Math.max(0, Math.min(100, Math.round((s.exp / s.maxExp) * 100)));

          if (this.hpFill) this.hpFill.width = `${hpPct}%`;
          if (this.mpFill) this.mpFill.width = `${mpPct}%`;
          if (this.hpLabel) this.hpLabel.text = `${hpPct}%`;
          if (this.mpLabel) this.mpLabel.text = `${mpPct}%`;
          if (this.expFill) this.expFill.width = `${expPct}%`;
          if (this.levelText) this.levelText.text = `${s.level}`;
          if (this.goldText) this.goldText.text = `🪙 ${(s.gold / 1000).toFixed(1)}K`;
          if (this.gemsText) this.gemsText.text = `💠 ${s.gems}`;
     }

     private createNotificationBadge(): void {
          const notifBar = new Rectangle("notifBar");
          notifBar.width = "400px";
          notifBar.height = "60px";
          notifBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          notifBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          notifBar.top = "120px";
          notifBar.background = "rgba(0, 0, 0, 0.6)";
          notifBar.color = "rgba(255, 255, 255, 0.1)";
          notifBar.thickness = 1;
          notifBar.cornerRadius = 8;
          notifBar.alpha = 0;
          this.ui.addControl(notifBar);

          const icon = new TextBlock("nIcon", "✨");
          icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          icon.fontSize = 28;
          icon.left = "15px";
          notifBar.addControl(icon);

          const notifText = new TextBlock("notifText", "Unlocked: Resonance Nexus");
          notifText.color = "#ffffff";
          notifText.fontSize = 18;
          notifText.fontFamily = "'Inter', sans-serif";
          notifText.fontWeight = "600";
          notifText.left = "20px";
          notifBar.addControl(notifText);

          let t = 0;
          this.scene.onBeforeRenderObservable.add(() => {
               if (t < 60) {
                    notifBar.alpha = Math.min(1, t / 30);
                    notifBar.top = `${120 + (1 - notifBar.alpha) * 20}px`;
               } else if (t > 150) {
                    notifBar.alpha = Math.max(0, 1 - (t - 150) / 30);
               }
               t++;
          });
     }
}
