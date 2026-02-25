import { Scene } from "@babylonjs/core/scene";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { InputManager } from "./InputManager";

/**
 * Premium Virtual Joystick — HD resolution (idealHeight 1624)
 * Loads optional sprite texture, full visual feedback.
 */
export class TouchJoystick {
      public readonly onMove = new Observable<Vector2>();

      private ui: AdvancedDynamicTexture;
      private outerRing!: Ellipse;
      private innerKnob!: Ellipse;
      private glowRing!: Ellipse;
      private knobSprite!: Image | null;

      private centerX = 0;
      private centerY = 0;
      private maxRadius = 100;
      private active = false;
      private currentDir = Vector2.Zero();

      // Sizes (in 1624 ideal units)
      private outerSize = 230;
      private knobSize = 95;
      private pulsePhase = 0;

      constructor(
            private scene: Scene,
            private inputManager: InputManager
      ) {
            this.ui = AdvancedDynamicTexture.CreateFullscreenUI("joystickUI", false, scene);
            this.ui.idealHeight = 1624;
            this.ui.renderAtIdealSize = false;

            this.createVisuals();
            this.bindInput();
            this.startIdlePulse();

            console.log("[TouchJoystick] Initialized ✓");
      }

      private createVisuals(): void {
            // Glow ring (behind outer ring)
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
            this.ui.addControl(this.glowRing);

            // Outer ring (base)
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
            this.ui.addControl(this.outerRing);

            // Directional notch markers
            this.addDirectionIndicators();

            // Inner knob
            this.innerKnob = new Ellipse("joyKnob");
            this.innerKnob.width = `${this.knobSize}px`;
            this.innerKnob.height = `${this.knobSize}px`;
            this.innerKnob.background = "rgba(255, 80, 60, 0.5)";
            this.innerKnob.color = "rgba(255, 100, 70, 0.75)";
            this.innerKnob.thickness = 3;
            this.outerRing.addControl(this.innerKnob);

            // Joystick sprite overlay
            this.knobSprite = new Image("joySprite", "assets/ui/joystick.png");
            this.knobSprite.width = `${this.knobSize - 14}px`;
            this.knobSprite.height = `${this.knobSize - 14}px`;
            this.knobSprite.stretch = Image.STRETCH_UNIFORM;
            this.knobSprite.alpha = 0.85;
            this.knobSprite.onImageLoadedObservable.add(() => {
                  console.log("[TouchJoystick] Joystick sprite loaded ✓");
            });
            this.innerKnob.addControl(this.knobSprite);

            // Center dot (fallback when sprite missing)
            const centerDot = new Ellipse("joyCenterDot");
            centerDot.width = "20px";
            centerDot.height = "20px";
            centerDot.background = "rgba(255, 150, 100, 0.6)";
            centerDot.color = "rgba(255, 200, 150, 0.4)";
            centerDot.thickness = 2;
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
                  if (d.name === "left" || d.name === "right") {
                        arrow.left = d.left;
                  }
                  arrow.top = d.top;
                  this.outerRing.addControl(arrow);
            }

            // Ring tick marks (8 cardinal/diagonal)
            for (let i = 0; i < 8; i++) {
                  const tick = new Ellipse(`joyTick_${i}`);
                  tick.width = "7px";
                  tick.height = "7px";
                  tick.background = "rgba(255, 100, 70, 0.12)";
                  tick.color = "transparent";
                  tick.thickness = 0;
                  const angle = (i / 8) * Math.PI * 2;
                  const r = this.outerSize / 2 - 18;
                  tick.left = `${Math.cos(angle) * r}px`;
                  tick.top = `${Math.sin(angle) * r}px`;
                  this.outerRing.addControl(tick);
            }
      }

      private bindInput(): void {
            this.inputManager.onJoystickStart = (_id: number, x: number, y: number) => {
                  this.active = true;
                  this.centerX = x;
                  this.centerY = y;

                  this.glowRing.color = "rgba(255, 60, 40, 0.35)";
                  this.outerRing.color = "rgba(255, 80, 60, 0.65)";
                  this.outerRing.background = "rgba(25, 4, 12, 0.7)";
                  this.innerKnob.scaleX = 1.08;
                  this.innerKnob.scaleY = 1.08;
            };

            this.inputManager.onJoystickMove = (_id: number, x: number, y: number) => {
                  if (!this.active) return;

                  let dx = x - this.centerX;
                  let dy = y - this.centerY;
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  if (dist > this.maxRadius) {
                        dx = (dx / dist) * this.maxRadius;
                        dy = (dy / dist) * this.maxRadius;
                  }

                  this.currentDir.x = dx / this.maxRadius;
                  this.currentDir.y = dy / this.maxRadius;

                  this.innerKnob.left = `${dx}px`;
                  this.innerKnob.top = `${dy}px`;

                  const intensity = Math.min(dist / this.maxRadius, 1);
                  const glowAlpha = (0.15 + intensity * 0.4).toFixed(2);
                  this.glowRing.color = `rgba(255, 60, 40, ${glowAlpha})`;

                  this.onMove.notifyObservers(this.currentDir.clone());
            };

            this.inputManager.onJoystickEnd = (_id: number) => {
                  this.active = false;
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
            };
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
