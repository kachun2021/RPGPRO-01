import { Scene } from "@babylonjs/core/scene";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";

/**
 * Premium Virtual Joystick — Mobile-first Touch Input
 * Uses CAPTURE-PHASE DOM pointer events so our handler fires
 * BEFORE BabylonJS engine's own pointer handlers.
 * Document-level move/up for global drag tracking.
 */
export class TouchJoystick {
      public readonly onMove = new Observable<Vector2>();

      private ui: AdvancedDynamicTexture;
      private outerRing!: Ellipse;
      private innerKnob!: Ellipse;
      private glowRing!: Ellipse;

      private centerX = 0;
      private centerY = 0;
      private maxRadius = 60;
      private active = false;
      private activePointerId = -1;
      private currentDir = Vector2.Zero();
      private pulsePhase = 0;

      private outerSize = 230;
      private knobSize = 95;

      constructor(private scene: Scene) {
            this.ui = AdvancedDynamicTexture.CreateFullscreenUI("joystickUI", true, scene);
            this.ui.idealHeight = 1624;
            this.ui.renderAtIdealSize = false;

            this.createVisuals();
            this.bindPointerEvents();
            this.startIdlePulse();

            console.log("[TouchJoystick] Mobile joystick initialized ✓");
      }

      // ═══════════════════════════════════════════════════════════════
      // ── VISUALS ───────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private createVisuals(): void {
            // Glow ring
            this.glowRing = new Ellipse("joyGlow");
            this.glowRing.width = `${this.outerSize + 24}px`;
            this.glowRing.height = `${this.outerSize + 24}px`;
            this.glowRing.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.glowRing.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.glowRing.left = "22px";
            this.glowRing.top = "-32px";
            this.glowRing.color = "rgba(255, 60, 40, 0.0)";
            this.glowRing.thickness = 4;
            this.glowRing.background = "transparent";
            this.glowRing.isHitTestVisible = false;
            this.ui.addControl(this.glowRing);

            // Outer ring
            this.outerRing = new Ellipse("joyOuter");
            this.outerRing.width = `${this.outerSize}px`;
            this.outerRing.height = `${this.outerSize}px`;
            this.outerRing.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.outerRing.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.outerRing.left = "34px";
            this.outerRing.top = "-44px";
            this.outerRing.background = "rgba(15, 2, 8, 0.6)";
            this.outerRing.color = "rgba(255, 80, 60, 0.35)";
            this.outerRing.thickness = 3;
            this.outerRing.isHitTestVisible = false;
            this.ui.addControl(this.outerRing);

            this.addDirectionIndicators();

            // Inner knob
            this.innerKnob = new Ellipse("joyKnob");
            this.innerKnob.width = `${this.knobSize}px`;
            this.innerKnob.height = `${this.knobSize}px`;
            this.innerKnob.background = "rgba(255, 80, 60, 0.5)";
            this.innerKnob.color = "rgba(255, 100, 70, 0.75)";
            this.innerKnob.thickness = 3;
            this.innerKnob.isHitTestVisible = false;
            this.outerRing.addControl(this.innerKnob);

            // Center dot
            const centerDot = new Ellipse("joyCenterDot");
            centerDot.width = "20px";
            centerDot.height = "20px";
            centerDot.background = "rgba(255, 150, 100, 0.6)";
            centerDot.color = "rgba(255, 200, 150, 0.4)";
            centerDot.thickness = 2;
            centerDot.isHitTestVisible = false;
            this.innerKnob.addControl(centerDot);
      }

      private addDirectionIndicators(): void {
            const dirs = [
                  { name: "up", char: "▲", top: "14px", left: "0px", vAlign: Control.VERTICAL_ALIGNMENT_TOP, hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER },
                  { name: "down", char: "▼", top: "-14px", left: "0px", vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM, hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER },
                  { name: "left", char: "◀", top: "0px", left: "14px", vAlign: Control.VERTICAL_ALIGNMENT_CENTER, hAlign: Control.HORIZONTAL_ALIGNMENT_LEFT },
                  { name: "right", char: "▶", top: "0px", left: "-14px", vAlign: Control.VERTICAL_ALIGNMENT_CENTER, hAlign: Control.HORIZONTAL_ALIGNMENT_RIGHT },
            ];

            for (const d of dirs) {
                  const arrow = new TextBlock(`joyArrow_${d.name}`, d.char);
                  arrow.fontSize = 16;
                  arrow.color = "rgba(255, 100, 70, 0.2)";
                  arrow.verticalAlignment = d.vAlign;
                  arrow.horizontalAlignment = d.hAlign;
                  if (d.name === "left" || d.name === "right") arrow.left = d.left;
                  arrow.top = d.top;
                  arrow.isHitTestVisible = false;
                  this.outerRing.addControl(arrow);
            }

            for (let i = 0; i < 8; i++) {
                  const tick = new Ellipse(`joyTick_${i}`);
                  tick.width = "7px";
                  tick.height = "7px";
                  tick.background = "rgba(255, 100, 70, 0.12)";
                  tick.color = "transparent";
                  tick.thickness = 0;
                  tick.isHitTestVisible = false;
                  const angle = (i / 8) * Math.PI * 2;
                  const r = this.outerSize / 2 - 18;
                  tick.left = `${Math.cos(angle) * r}px`;
                  tick.top = `${Math.sin(angle) * r}px`;
                  this.outerRing.addControl(tick);
            }
      }

      // ═══════════════════════════════════════════════════════════════
      // ── POINTER EVENTS (CAPTURE PHASE — fires before BabylonJS) ──
      // ═══════════════════════════════════════════════════════════════

      private isInJoystickZone(x: number, y: number): boolean {
            const canvas = this.scene.getEngine().getRenderingCanvas()!;
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            // Left 40%, bottom 35% of the screen
            return x < w * 0.4 && y > h * 0.65;
      }

      private bindPointerEvents(): void {
            const canvas = this.scene.getEngine().getRenderingCanvas()!;

            // CAPTURE phase on canvas — fires BEFORE BabylonJS bubble-phase handlers
            canvas.addEventListener("pointerdown", (e: PointerEvent) => {
                  if (this.active) return;
                  if (!this.isInJoystickZone(e.clientX, e.clientY)) return;

                  this.active = true;
                  this.activePointerId = e.pointerId;
                  this.centerX = e.clientX;
                  this.centerY = e.clientY;

                  // MaxRadius in screen pixels
                  const scale = canvas.clientHeight / 1624;
                  this.maxRadius = (this.outerSize / 2) * scale;

                  // Visual feedback
                  this.glowRing.color = "rgba(255, 60, 40, 0.35)";
                  this.outerRing.color = "rgba(255, 80, 60, 0.65)";
                  this.outerRing.background = "rgba(25, 4, 12, 0.7)";
                  this.innerKnob.scaleX = 1.08;
                  this.innerKnob.scaleY = 1.08;

                  console.log(`[Joystick] DOWN id=${e.pointerId} (${e.clientX},${e.clientY})`);
            }, { capture: true, passive: false });

            // DOCUMENT-level move — tracks drag globally even outside canvas
            document.addEventListener("pointermove", (e: PointerEvent) => {
                  if (!this.active || e.pointerId !== this.activePointerId) return;

                  let dx = e.clientX - this.centerX;
                  let dy = e.clientY - this.centerY;
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  if (dist > this.maxRadius) {
                        dx = (dx / dist) * this.maxRadius;
                        dy = (dy / dist) * this.maxRadius;
                  }

                  this.currentDir.x = dx / this.maxRadius;
                  this.currentDir.y = dy / this.maxRadius;

                  // Move inner knob (screen px → ideal px)
                  const scale = canvas.clientHeight / 1624;
                  this.innerKnob.left = `${dx / scale}px`;
                  this.innerKnob.top = `${dy / scale}px`;

                  const intensity = Math.min(dist / this.maxRadius, 1);
                  this.glowRing.color = `rgba(255, 60, 40, ${(0.15 + intensity * 0.4).toFixed(2)})`;

                  this.onMove.notifyObservers(this.currentDir.clone());
            }, { capture: true, passive: true });

            // DOCUMENT-level up
            document.addEventListener("pointerup", (e: PointerEvent) => {
                  if (e.pointerId !== this.activePointerId) return;
                  console.log(`[Joystick] UP id=${e.pointerId}`);
                  this.resetJoystick();
            }, { capture: true });

            document.addEventListener("pointercancel", (e: PointerEvent) => {
                  if (e.pointerId !== this.activePointerId) return;
                  this.resetJoystick();
            }, { capture: true });
      }

      private resetJoystick(): void {
            this.active = false;
            this.activePointerId = -1;
            this.currentDir.x = 0;
            this.currentDir.y = 0;
            this.innerKnob.left = "0px";
            this.innerKnob.top = "0px";

            this.glowRing.color = "rgba(255, 60, 40, 0.0)";
            this.outerRing.color = "rgba(255, 80, 60, 0.35)";
            this.outerRing.background = "rgba(15, 2, 8, 0.6)";
            this.innerKnob.scaleX = 1.0;
            this.innerKnob.scaleY = 1.0;

            this.onMove.notifyObservers(Vector2.Zero());
      }

      private startIdlePulse(): void {
            this.scene.onBeforeRenderObservable.add(() => {
                  if (this.active) return;
                  this.pulsePhase += 0.02;
                  const pulse = Math.sin(this.pulsePhase) * 0.08 + 0.35;
                  this.outerRing.color = `rgba(255, 80, 60, ${pulse.toFixed(2)})`;
            });
      }

      public getDirection(): Vector2 {
            return this.currentDir;
      }

      public isActive(): boolean {
            return this.active;
      }

      public dispose(): void {
            this.onMove.clear();
            this.ui.dispose();
      }
}
