import { Scene } from "@babylonjs/core/scene";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { InputManager } from "./InputManager";

/**
 * Functional virtual joystick — renders on the Babylon GUI layer
 * and publishes normalized movement vectors.
 */
export class TouchJoystick {
      public readonly onMove = new Observable<Vector2>();

      private ui: AdvancedDynamicTexture;
      private outerRing!: Ellipse;
      private innerKnob!: Ellipse;
      private glowRing!: Ellipse;

      private centerX = 0;
      private centerY = 0;
      private maxRadius = 55;
      private active = false;
      private currentDir = Vector2.Zero();

      // Sizes (in GUI ideal units)
      private outerSize = 120;
      private knobSize = 48;

      constructor(
            private scene: Scene,
            private inputManager: InputManager
      ) {
            // Use the same GUI texture from HUD (get existing or create)
            const existing = scene.getEngine().getRenderingCanvas();
            this.ui = AdvancedDynamicTexture.CreateFullscreenUI("joystickUI", false, scene);
            this.ui.idealHeight = 900;
            this.ui.renderAtIdealSize = false;

            this.createVisuals();
            this.bindInput();

            console.log("[TouchJoystick] Initialized ✓");
      }

      private createVisuals(): void {
            // Outer ring (base)
            this.outerRing = new Ellipse("joyOuter");
            this.outerRing.width = `${this.outerSize}px`;
            this.outerRing.height = `${this.outerSize}px`;
            this.outerRing.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.outerRing.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.outerRing.left = "20px";
            this.outerRing.top = "-25px";
            this.outerRing.background = "rgba(15, 2, 8, 0.55)";
            this.outerRing.color = "rgba(255, 80, 60, 0.4)";
            this.outerRing.thickness = 2;
            this.ui.addControl(this.outerRing);

            // Glow ring (animated on press)
            this.glowRing = new Ellipse("joyGlow");
            this.glowRing.width = `${this.outerSize + 10}px`;
            this.glowRing.height = `${this.outerSize + 10}px`;
            this.glowRing.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.glowRing.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.glowRing.left = "15px";
            this.glowRing.top = "-20px";
            this.glowRing.color = "rgba(255, 60, 40, 0.0)";
            this.glowRing.thickness = 2;
            this.glowRing.background = "transparent";
            this.ui.addControl(this.glowRing);

            // Inner knob
            this.innerKnob = new Ellipse("joyKnob");
            this.innerKnob.width = `${this.knobSize}px`;
            this.innerKnob.height = `${this.knobSize}px`;
            this.innerKnob.background = "rgba(255, 80, 60, 0.45)";
            this.innerKnob.color = "rgba(255, 100, 70, 0.7)";
            this.innerKnob.thickness = 2;
            this.outerRing.addControl(this.innerKnob);

            // Directional arrows (visual hint)
            this.addDirectionIndicators();
      }

      private addDirectionIndicators(): void {
            const dirs = [
                  { name: "up", char: "▲", top: "6px", left: "0px", vAlign: Control.VERTICAL_ALIGNMENT_TOP },
                  { name: "down", char: "▼", top: "-6px", left: "0px", vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM },
                  { name: "left", char: "◀", top: "0px", left: "6px", vAlign: Control.VERTICAL_ALIGNMENT_CENTER },
                  { name: "right", char: "▶", top: "0px", left: "-6px", vAlign: Control.VERTICAL_ALIGNMENT_CENTER },
            ];

            for (const d of dirs) {
                  const arrow = new TextBlock(`joyArrow_${d.name}`, d.char);
                  arrow.fontSize = 8;
                  arrow.color = "rgba(255, 100, 70, 0.25)";
                  arrow.verticalAlignment = d.vAlign;
                  if (d.name === "left") {
                        arrow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                        arrow.left = d.left;
                  } else if (d.name === "right") {
                        arrow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                        arrow.left = d.left;
                  }
                  arrow.top = d.top;
                  this.outerRing.addControl(arrow);
            }
      }

      private bindInput(): void {
            // Register with InputManager
            this.inputManager.onJoystickStart = (_id: number, x: number, y: number) => {
                  this.active = true;
                  this.centerX = x;
                  this.centerY = y;

                  // Visual feedback: glow
                  this.glowRing.color = "rgba(255, 60, 40, 0.3)";
                  this.outerRing.color = "rgba(255, 80, 60, 0.6)";
            };

            this.inputManager.onJoystickMove = (_id: number, x: number, y: number) => {
                  if (!this.active) return;

                  let dx = x - this.centerX;
                  let dy = y - this.centerY;
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  // Clamp to max radius
                  if (dist > this.maxRadius) {
                        dx = (dx / dist) * this.maxRadius;
                        dy = (dy / dist) * this.maxRadius;
                  }

                  // Normalized direction (-1 to 1)
                  this.currentDir.x = dx / this.maxRadius;
                  this.currentDir.y = dy / this.maxRadius;

                  // Move knob visually
                  this.innerKnob.left = `${dx}px`;
                  this.innerKnob.top = `${dy}px`;

                  this.onMove.notifyObservers(this.currentDir.clone());
            };

            this.inputManager.onJoystickEnd = (_id: number) => {
                  this.active = false;
                  this.currentDir.x = 0;
                  this.currentDir.y = 0;
                  this.innerKnob.left = "0px";
                  this.innerKnob.top = "0px";

                  // Reset glow
                  this.glowRing.color = "rgba(255, 60, 40, 0.0)";
                  this.outerRing.color = "rgba(255, 80, 60, 0.4)";

                  this.onMove.notifyObservers(Vector2.Zero());
            };
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
