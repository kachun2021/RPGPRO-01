import { Scene } from "@babylonjs/core/scene";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { PlayerStats } from "../entities/Player";
import { AssetManager } from "../core/AssetManager";

/**
 * Premium Vertical HUD — Dark Abyss Theme (Responsive)
 *
 * Uses idealWidth = 750 for stable portrait-first coordinate system.
 * ALL layout uses percentage-based positioning — no pixel overflow.
 * Internal element sizes (font, border) use small px in ideal coords.
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

     public readonly onSkillUse = new Observable<string>();
     public readonly onAutoBattleToggle = new Observable<boolean>();

     private skillCDOverlays = new Map<string, Rectangle>();
     private skillCDTexts = new Map<string, TextBlock>();

     public onCharacterButton: (() => void) | null = null;
     public onInventoryButton: (() => void) | null = null;
     public onShopButton: (() => void) | null = null;

     constructor(private scene: Scene) {
          this.ui = AdvancedDynamicTexture.CreateFullscreenUI("hud", true, scene);
          // 1:1 GUI coordinate scaling to ensure crisp fonts and vector layouts
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

     // ── ICON HELPER ─────────────────────────────────────────────────
     private drawVectorIcon(parent: Container, name: string, fallback: string, size = 64): void {
          AssetManager.getUITextureUrl(`assets/ui/${name}.png`, fallback, size, size).then((url) => {
               if (url.startsWith('data:')) {
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d')!;
                    ctx.clearRect(0, 0, size, size);
                    ctx.font = `bold ${Math.floor(size * 0.55)}px 'Inter', 'Segoe UI Emoji', sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 4;
                    ctx.fillText(fallback, size / 2, size / 2);
                    url = canvas.toDataURL();
               }
               const bgImg = new Image(`img_${name}`, url);
               bgImg.stretch = Image.STRETCH_UNIFORM;
               bgImg.isHitTestVisible = false;
               parent.addControl(bgImg);
          });
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── ZONE 1: TOP BAR (Location Title) ─────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createTopBar(): void {
          const bar = new Rectangle("topBar");
          bar.width = "60%";
          bar.height = "10%";
          bar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          bar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          bar.top = "0.5%";
          bar.thickness = 0;
          this.ui.addControl(bar);

          const title = new TextBlock("locationText", "Ashen Wasteland");
          title.color = "#e2e8f0";
          title.fontSize = 28;
          title.fontFamily = "'Cinzel', serif";
          title.fontWeight = "700";
          title.shadowColor = "rgba(120, 60, 255, 0.6)";
          title.shadowBlur = 12;
          title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          bar.addControl(title);

          const sub = new TextBlock("subText", "EXPLORATION REGION");
          sub.color = "rgba(148, 163, 184, 0.8)";
          sub.fontSize = 12;
          sub.fontFamily = "'Inter', sans-serif";
          sub.fontWeight = "600";
          sub.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          bar.addControl(sub);
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── ZONE 2: AVATAR PANEL (Top-Left) ──────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createAvatarPanel(): void {
          const panel = new Rectangle("avatarPanel");
          panel.width = "44%";
          panel.height = "10%";
          panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          panel.top = "7.5%";
          panel.left = "2%";
          panel.background = "rgba(8, 8, 14, 0.92)";
          panel.color = "rgba(120, 90, 255, 0.25)";
          panel.thickness = 1.5;
          panel.cornerRadius = 14;
          this.ui.addControl(panel);

          // Avatar circle
          const avatar = new Ellipse("avatarFrame");
          avatar.width = "55px";
          avatar.height = "55px";
          avatar.color = "rgba(168, 85, 247, 0.6)";
          avatar.thickness = 2;
          avatar.background = "rgba(14, 10, 28, 0.95)";
          avatar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          avatar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          avatar.left = "6px";
          panel.addControl(avatar);
          this.drawVectorIcon(avatar, "avatar", "👤", 32);

          // Level badge
          const lvl = new Ellipse("levelBadge");
          lvl.width = "24px";
          lvl.height = "24px";
          lvl.color = "rgba(192, 132, 252, 0.8)";
          lvl.thickness = 2;
          lvl.background = "#0e0a1c";
          lvl.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          lvl.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          lvl.left = "50px";
          lvl.top = "-2px";
          panel.addControl(lvl);

          const lvlTxt = new TextBlock("levelNum", "1");
          lvlTxt.color = "#c084fc";
          lvlTxt.fontSize = 12;
          lvlTxt.fontFamily = "'Inter', sans-serif";
          lvlTxt.fontWeight = "700";
          lvl.addControl(lvlTxt);
          this.levelText = lvlTxt;

          // Info stack: Name → HP → MP (uses StackPanel for correct flow)
          const infoStack = new StackPanel("infoStack");
          infoStack.isVertical = true;
          infoStack.width = "60%";
          infoStack.height = "90%";
          infoStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          infoStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          infoStack.left = "-4%";
          panel.addControl(infoStack);

          // Name
          const name = new TextBlock("playerName", "Wanderer");
          name.color = "#e2e8f0";
          name.fontSize = 15;
          name.fontFamily = "'Inter', sans-serif";
          name.fontWeight = "700";
          name.height = "24px";
          name.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          name.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          name.shadowColor = "rgba(100, 60, 200, 0.4)";
          name.shadowBlur = 4;
          infoStack.addControl(name);

          // HP bar
          this.createStatusBar(infoStack, "hp", 100, "#ef4444", "100%", "16px");
          // MP bar
          this.createStatusBar(infoStack, "mp", 100, "#818cf8", "85%", "14px");
     }

     private createStatusBar(
          parent: StackPanel, id: string, percent: number,
          fillColor: string, width: string, height: string
     ): void {
          const row = new Rectangle(`${id}Row`);
          row.width = width;
          row.height = height;
          row.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          row.background = "rgba(6, 6, 12, 0.75)";
          row.color = "rgba(120, 90, 255, 0.2)";
          row.thickness = 1;
          row.cornerRadius = 6;
          parent.addControl(row);

          const fill = new Rectangle(`${id}BarFill`);
          fill.width = `${percent}%`;
          fill.height = "100%";
          fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          fill.background = fillColor;
          fill.thickness = 0;
          fill.cornerRadius = 6;
          row.addControl(fill);

          const label = new TextBlock(`${id}Label`, "");
          label.fontFamily = "'Inter', sans-serif";
          label.color = "#e2e8f0";
          label.fontSize = 10;
          label.fontWeight = "700";
          label.shadowColor = "rgba(0,0,0,0.9)";
          label.shadowBlur = 3;
          row.addControl(label);

          if (id === "hp") { this.hpFill = fill; this.hpLabel = label; }
          if (id === "mp") { this.mpFill = fill; this.mpLabel = label; }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── ZONE 3: CURRENCY (Top-Right) ─────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createCurrencyBar(): void {
          const panel = new StackPanel("currencyPanel");
          panel.width = "28%";
          panel.height = "3.5%";
          panel.isVertical = false;
          panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          panel.left = "-1%";
          panel.top = "0.5%";
          this.ui.addControl(panel);

          for (const c of [
               { id: "gold", icon: "🪙", color: "#faad14" },
               { id: "gems", icon: "💠", color: "#69c0ff" },
          ]) {
               const item = new Rectangle(`currency_${c.id}`);
               item.width = "48%";
               item.height = "100%";
               item.background = "rgba(8, 8, 14, 0.85)";
               item.color = "rgba(120, 90, 255, 0.2)";
               item.thickness = 1;
               item.cornerRadius = 14;
               panel.addControl(item);

               const txt = new TextBlock(`currTxt_${c.id}`, `${c.icon} 0`);
               txt.color = "#fbbf24";
               txt.fontSize = 12;
               txt.fontFamily = "'Inter', sans-serif";
               txt.fontWeight = "600";
               item.addControl(txt);

               if (c.id === "gold") this.goldText = txt;
               if (c.id === "gems") this.gemsText = txt;
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── ZONE 3B: MINIMAP (Top-Right below currency) ──────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createMinimap(): void {
          const wrapper = new Rectangle("minimapWrapper");
          wrapper.width = "16%";
          wrapper.height = "16%";
          wrapper.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          wrapper.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          wrapper.left = "-2%";
          wrapper.top = "6%";
          wrapper.thickness = 0;
          this.ui.addControl(wrapper);

          const mapCircle = new Ellipse("minimapContainer");
          mapCircle.width = "85%";
          mapCircle.height = "85%";
          mapCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          mapCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          mapCircle.background = "rgba(6, 6, 12, 0.88)";
          mapCircle.color = "rgba(120, 90, 255, 0.35)";
          mapCircle.thickness = 2;
          wrapper.addControl(mapCircle);

          // Player dot
          const dot = new Ellipse("playerDot");
          dot.width = "10px";
          dot.height = "10px";
          dot.background = "#c084fc";
          dot.color = "rgba(192,132,252,0.6)";
          dot.thickness = 2;
          mapCircle.addControl(dot);

          // Direction arrow
          const arrow = new TextBlock("dirArrow", "▲");
          arrow.color = "#c084fc";
          arrow.fontSize = 12;
          arrow.top = "-14px";
          mapCircle.addControl(arrow);

          // Compass labels
          for (const c of [
               { id: "N", vA: Control.VERTICAL_ALIGNMENT_TOP, hA: Control.HORIZONTAL_ALIGNMENT_CENTER, t: "4px", l: "0px" },
               { id: "S", vA: Control.VERTICAL_ALIGNMENT_BOTTOM, hA: Control.HORIZONTAL_ALIGNMENT_CENTER, t: "-4px", l: "0px" },
               { id: "E", vA: Control.VERTICAL_ALIGNMENT_CENTER, hA: Control.HORIZONTAL_ALIGNMENT_RIGHT, t: "0px", l: "-4px" },
               { id: "W", vA: Control.VERTICAL_ALIGNMENT_CENTER, hA: Control.HORIZONTAL_ALIGNMENT_LEFT, t: "0px", l: "4px" },
          ]) {
               const txt = new TextBlock(`compass_${c.id}`, c.id);
               txt.fontFamily = "'Inter', sans-serif";
               txt.color = c.id === "N" ? "rgba(192,132,252,0.95)" : "rgba(148,163,184,0.5)";
               txt.fontSize = c.id === "N" ? 12 : 9;
               txt.fontWeight = "700";
               txt.verticalAlignment = c.vA;
               txt.horizontalAlignment = c.hA;
               txt.top = c.t;
               txt.left = c.l;
               mapCircle.addControl(txt);
          }

          // Toggle button
          const toggle = new Rectangle("mapToggle");
          toggle.width = "50px";
          toggle.height = "22px";
          toggle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          toggle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          toggle.background = "rgba(8, 8, 14, 0.8)";
          toggle.color = "rgba(120, 90, 255, 0.25)";
          toggle.thickness = 1;
          toggle.cornerRadius = 11;
          toggle.isPointerBlocker = true;
          wrapper.addControl(toggle);

          const toggleTxt = new TextBlock("mapToggleTxt", "▲ MAP");
          toggleTxt.fontFamily = "'Inter', sans-serif";
          toggleTxt.fontSize = 9;
          toggleTxt.fontWeight = "700";
          toggleTxt.color = "rgba(192, 132, 252, 0.7)";
          toggle.addControl(toggleTxt);

          let expanded = true;
          toggle.onPointerClickObservable.add(() => {
               expanded = !expanded;
               mapCircle.isVisible = expanded;
               toggleTxt.text = expanded ? "▲ MAP" : "▼ MAP";
               toggle.verticalAlignment = expanded
                    ? Control.VERTICAL_ALIGNMENT_BOTTOM
                    : Control.VERTICAL_ALIGNMENT_TOP;
               wrapper.height = expanded ? "16%" : "4%";
          });
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── ZONE 4: RIGHT SIDEBAR ────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createRightSidebar(): void {
          const sidebar = new StackPanel("rightSidebar");
          sidebar.width = "9%";
          sidebar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          sidebar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          sidebar.left = "-1%";
          sidebar.top = "5%";
          sidebar.isVertical = true;
          sidebar.spacing = 10;
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
                    btn.onPointerClickObservable.add(() => { if (this.onCharacterButton) this.onCharacterButton(); });
               } else if (item.id === "inventory") {
                    btn.onPointerClickObservable.add(() => { if (this.onInventoryButton) this.onInventoryButton(); });
               } else if (item.id === "gacha") {
                    btn.onPointerClickObservable.add(() => { if (this.onShopButton) this.onShopButton(); });
               }
               sidebar.addControl(btn);
          }
     }

     private createSidebarButton(id: string, icon: string, badge: string): Rectangle {
          const btn = new Rectangle(`sidebar_${id}`);
          btn.width = "50px";
          btn.height = "50px";
          btn.background = "rgba(14, 16, 24, 0.88)";
          btn.color = "rgba(120, 90, 255, 0.3)";
          btn.thickness = 2;
          btn.cornerRadius = 25;
          this.drawVectorIcon(btn, id, icon, 40);

          if (badge) {
               const b = new Ellipse(`badge_${id}`);
               b.width = "18px";
               b.height = "18px";
               b.background = "#ef4444";
               b.thickness = 0;
               b.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               b.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
               b.left = "4px";
               b.top = "-2px";
               btn.addControl(b);

               const bt = new TextBlock(`badgeTxt_${id}`, badge);
               bt.color = "#fff";
               bt.fontSize = 10;
               bt.fontWeight = "700";
               b.addControl(bt);
          }
          return btn;
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── ZONE 5: BOTTOM-RIGHT COMBAT ──────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createBottomBar(): void {
          // AUTO toggle
          const autoBtn = new Rectangle("autoBtn");
          autoBtn.width = "14%";
          autoBtn.height = "3.5%";
          autoBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          autoBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          autoBtn.left = "-2%";
          autoBtn.top = "-28%";
          autoBtn.background = "rgba(14, 10, 30, 0.75)";
          autoBtn.color = "rgba(168, 85, 247, 0.45)";
          autoBtn.thickness = 2;
          autoBtn.cornerRadius = 18;
          this.ui.addControl(autoBtn);

          const autoTxt = new TextBlock("autoTxt", "⚙ AUTO");
          autoTxt.fontFamily = "'Inter', sans-serif";
          autoTxt.fontSize = 13;
          autoTxt.fontWeight = "700";
          autoTxt.color = "rgba(192, 132, 252, 0.8)";
          autoBtn.addControl(autoTxt);

          let autoActive = false;
          autoBtn.onPointerClickObservable.add(() => {
               autoActive = !autoActive;
               autoBtn.background = autoActive ? "rgba(168, 85, 247, 0.7)" : "rgba(14, 10, 30, 0.75)";
               autoTxt.color = autoActive ? "#e2e8f0" : "rgba(192, 132, 252, 0.8)";
               this.onAutoBattleToggle.notifyObservers(autoActive);
          });

          this.createSkillButtons();
     }

     private createSkillButtons(): void {
          // ATK button — anchored to bottom-right with percentage offsets
          const atkBtn = new Ellipse("atkBtn");
          atkBtn.width = "13%";
          atkBtn.height = "9%";
          atkBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          atkBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          atkBtn.left = "-12%";
          atkBtn.top = "-6%";
          atkBtn.background = "rgba(15, 10, 30, 0.7)";
          atkBtn.color = "rgba(180, 120, 255, 0.5)";
          atkBtn.thickness = 3;
          this.ui.addControl(atkBtn);

          const atkInner = new Ellipse("atkInner");
          atkInner.width = "80%";
          atkInner.height = "80%";
          atkInner.background = "rgba(168, 85, 247, 0.15)";
          atkInner.thickness = 0;
          atkBtn.addControl(atkInner);

          this.drawVectorIcon(atkBtn, "atk", "⚔️", 48);
          this.addCooldownOverlay(atkBtn, "atk");

          atkBtn.onPointerDownObservable.add(() => { atkBtn.scaleX = 0.9; atkBtn.scaleY = 0.9; atkBtn.background = "rgba(168, 85, 247, 0.35)"; });
          atkBtn.onPointerUpObservable.add(() => { atkBtn.scaleX = 1; atkBtn.scaleY = 1; atkBtn.background = "rgba(15, 10, 30, 0.7)"; });
          atkBtn.onPointerClickObservable.add(() => { this.onSkillUse.notifyObservers("atk"); });

          // Skill buttons — percentage-based positions
          // Positions are offsets from bottom-right in %
          const skills = [
               { id: "dodge", icon: "💨", leftPct: "-24%", topPct: "-9%" },
               { id: "skill1", icon: "⚡", leftPct: "-28%", topPct: "-16%" },
               { id: "skill2", icon: "❄️", leftPct: "-18%", topPct: "-19%" },
               { id: "ult", icon: "💥", leftPct: "-7%", topPct: "-18%" },
          ];

          for (const s of skills) {
               const isUlt = s.id === "ult";
               const btn = new Ellipse(`${s.id}Btn`);
               btn.width = isUlt ? "10%" : "9%";
               btn.height = isUlt ? "7%" : "6%";
               btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
               btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
               btn.left = s.leftPct;
               btn.top = s.topPct;
               btn.background = isUlt ? "rgba(168, 85, 247, 0.45)" : "rgba(15, 10, 30, 0.65)";
               btn.color = isUlt ? "rgba(192, 132, 252, 0.7)" : "rgba(120, 90, 255, 0.35)";
               btn.thickness = 2;
               this.ui.addControl(btn);

               this.drawVectorIcon(btn, s.id, s.icon, isUlt ? 36 : 28);
               this.addCooldownOverlay(btn, s.id);

               btn.onPointerDownObservable.add(() => { btn.scaleX = 0.9; btn.scaleY = 0.9; btn.background = "rgba(168, 85, 247, 0.35)"; });
               btn.onPointerUpObservable.add(() => { btn.scaleX = 1; btn.scaleY = 1; btn.background = isUlt ? "rgba(168, 85, 247, 0.45)" : "rgba(15, 10, 30, 0.65)"; });
               btn.onPointerClickObservable.add(() => { this.onSkillUse.notifyObservers(s.id); });
          }
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── ZONE 6: EXP BAR (Bottom edge) ────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createExpBar(): void {
          const bar = new Rectangle("expBarContainer");
          bar.width = "100%";
          bar.height = "0.5%";
          bar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          bar.background = "rgba(6, 4, 14, 0.7)";
          bar.thickness = 0;
          this.ui.addControl(bar);

          const fill = new Rectangle("expFill");
          fill.width = "35%";
          fill.height = "100%";
          fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          fill.background = "#c084fc";
          fill.thickness = 0;
          bar.addControl(fill);
          this.expFill = fill;
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── COOLDOWN OVERLAY ──────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private addCooldownOverlay(parent: Ellipse, skillId: string): void {
          const overlay = new Rectangle(`cd_${skillId}`);
          overlay.width = "100%";
          overlay.height = "0%";
          overlay.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          overlay.background = "rgba(6, 4, 14, 0.75)";
          overlay.color = "transparent";
          overlay.thickness = 0;
          overlay.isVisible = false;
          overlay.isHitTestVisible = false;
          parent.addControl(overlay);
          this.skillCDOverlays.set(skillId, overlay);

          const txt = new TextBlock(`cdTxt_${skillId}`, "");
          txt.color = "#e2e8f0";
          txt.fontSize = 18;
          txt.fontFamily = "'Inter', sans-serif";
          txt.fontWeight = "700";
          txt.isVisible = false;
          txt.isHitTestVisible = false;
          parent.addControl(txt);
          this.skillCDTexts.set(skillId, txt);
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
     // ── STATS UPDATE ──────────────────────────────────────────────────
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
          if (this.gemsText) this.gemsText.text = `💎 ${s.gems}`;
     }

     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // ── NOTIFICATION BADGE ────────────────────────────────────────────
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     private createNotificationBadge(): void {
          const bar = new Rectangle("notifBar");
          bar.width = "55%";
          bar.height = "5%";
          bar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          bar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          bar.top = "12%";
          bar.background = "rgba(8, 8, 14, 0.9)";
          bar.color = "rgba(120, 90, 255, 0.2)";
          bar.thickness = 1;
          bar.cornerRadius = 8;
          bar.alpha = 0;
          this.ui.addControl(bar);

          const icon = new TextBlock("nIcon", "✨");
          icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          icon.fontSize = 22;
          icon.left = "12px";
          bar.addControl(icon);

          const txt = new TextBlock("notifText", "Unlocked: Resonance Nexus");
          txt.color = "#e2e8f0";
          txt.fontSize = 14;
          txt.fontFamily = "'Inter', sans-serif";
          txt.fontWeight = "600";
          txt.left = "16px";
          bar.addControl(txt);

          let t = 0;
          this.scene.onBeforeRenderObservable.add(() => {
               if (t < 60) {
                    bar.alpha = Math.min(1, t / 30);
               } else if (t > 150) {
                    bar.alpha = Math.max(0, 1 - (t - 150) / 30);
               }
               t++;
          });
     }
}
