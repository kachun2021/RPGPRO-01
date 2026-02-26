import { Scene } from "@babylonjs/core/scene";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { Observable } from "@babylonjs/core/Misc/observable";

/**
 * Premium Virtual Joystick — Pure DOM/CSS Implementation
 * Uses standard pointer events attached to a fixed UI element.
 */
export class TouchJoystick {
      public readonly onMove = new Observable<Vector2>();

      private container!: HTMLElement;
      private outerRing!: HTMLElement;
      private innerKnob!: HTMLElement;
      private glowRing!: HTMLElement;

      private centerX = 0;
      private centerY = 0;
      private maxRadius = 60;
      private active = false;
      private activePointerId = -1;
      private currentDir = Vector2.Zero();
      private pulsePhase = 0;

      private outerSize = 160;
      private knobSize = 70;

      constructor(private scene: Scene) {
            this.injectCSS();
            this.createVisuals();
            this.bindPointerEvents();
            this.startIdlePulse();
      }

      private injectCSS() {
            if (document.getElementById("joystick-styles")) return;
            const style = document.createElement("style");
            style.id = "joystick-styles";
            style.textContent = `
            #joy-container {
                position: absolute;
                bottom: 40px;
                left: 40px;
                width: 200px;
                height: 200px;
                pointer-events: none;
                z-index: 100;
            }
            #joy-glow {
                position: absolute;
                width: 184px;
                height: 184px;
                left: 8px;
                top: 8px;
                border-radius: 50%;
                border: 4px solid rgba(168, 85, 247, 0.0);
                box-sizing: border-box;
                transition: border-color 0.2s;
            }
            #joy-outer {
                position: absolute;
                width: 160px;
                height: 160px;
                left: 20px;
                top: 20px;
                border-radius: 50%;
                background: rgba(10, 6, 20, 0.7);
                border: 3px solid rgba(140, 90, 255, 0.35);
                box-sizing: border-box;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                display: flex;
                justify-content: center;
                align-items: center;
            }
            #joy-knob {
                position: absolute;
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: rgba(168, 85, 247, 0.5);
                border: 3px solid rgba(192, 132, 252, 0.75);
                box-sizing: border-box;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: transform 0.1s;
                transform: translate(0px, 0px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
            #joy-center-dot {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: rgba(200, 160, 255, 0.6);
                border: 2px solid rgba(220, 190, 255, 0.4);
            }
            .joy-arrow {
                position: absolute;
                color: rgba(192, 132, 252, 0.2);
                font-size: 14px;
                user-select: none;
            }
            .joy-arrow.up { top: 6px; }
            .joy-arrow.down { bottom: 6px; }
            .joy-arrow.left { left: 6px; }
            .joy-arrow.right { right: 6px; }
            
            .joy-tick {
                position: absolute;
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: rgba(192, 132, 252, 0.12);
            }
            
            /* Responsive positioning for different aspect ratios */
            @media (max-width: 600px) {
                #joy-container { bottom: 20px; left: 20px; transform: scale(0.85); transform-origin: bottom left;}
            }
        `;
            document.head.appendChild(style);
      }

      private createVisuals(): void {
            const uiLayer = document.getElementById("ui-layer") || document.body;

            this.container = document.createElement("div");
            this.container.id = "joy-container";

            this.glowRing = document.createElement("div");
            this.glowRing.id = "joy-glow";

            this.outerRing = document.createElement("div");
            this.outerRing.id = "joy-outer";

            this.innerKnob = document.createElement("div");
            this.innerKnob.id = "joy-knob";

            const centerDot = document.createElement("div");
            centerDot.id = "joy-center-dot";

            this.innerKnob.appendChild(centerDot);
            this.outerRing.appendChild(this.innerKnob);

            this.addDirectionIndicators(this.outerRing);

            this.container.appendChild(this.glowRing);
            this.container.appendChild(this.outerRing);
            uiLayer.appendChild(this.container);
      }

      private addDirectionIndicators(parent: HTMLElement): void {
            const dirs = [
                  { class: "up", char: "▲" },
                  { class: "down", char: "▼" },
                  { class: "left", char: "◀" },
                  { class: "right", char: "▶" }
            ];

            for (const d of dirs) {
                  const arrow = document.createElement("div");
                  arrow.className = `joy-arrow ${d.class}`;
                  arrow.innerText = d.char;
                  parent.appendChild(arrow);
            }

            const radius = (this.outerSize / 2) - 14;
            for (let i = 0; i < 8; i++) {
                  const tick = document.createElement("div");
                  tick.className = "joy-tick";
                  const angle = (i / 8) * Math.PI * 2;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  tick.style.transform = `translate(${x}px, ${y}px)`;
                  parent.appendChild(tick);
            }
      }

      private isInJoystickZone(x: number, y: number): boolean {
            // Left 40%, bottom 40% of the screen
            const w = window.innerWidth;
            const h = window.innerHeight;
            return x < w * 0.4 && y > h * 0.6;
      }

      private bindPointerEvents(): void {
            // Document level listeners to capture outside of elements
            document.addEventListener("pointerdown", (e: PointerEvent) => {
                  if (this.active) return;

                  // Only activate if we click in the bottom-left zone to prevent conflict with other UI
                  if (!this.isInJoystickZone(e.clientX, e.clientY)) return;
                  // Ignore if clicking on other UI elements
                  if ((e.target as HTMLElement).closest('.action-btn, .shop-panel-root, .inv-panel-root, .char-panel-root')) return;

                  this.active = true;
                  this.activePointerId = e.pointerId;

                  // Re-center joystick visually on pointer down
                  this.container.style.left = `${e.clientX - 100}px`; // 100 is half container width
                  this.container.style.top = `${e.clientY - 100}px`;
                  this.container.style.bottom = 'auto'; // Override CSS bottom

                  this.centerX = e.clientX;
                  this.centerY = e.clientY;
                  this.maxRadius = this.outerSize / 2;

                  this.glowRing.style.borderColor = "rgba(168, 85, 247, 0.35)";
                  this.outerRing.style.borderColor = "rgba(140, 90, 255, 0.65)";
                  this.outerRing.style.background = "rgba(14, 8, 28, 0.8)";
                  this.innerKnob.style.transform = `translate(0px, 0px) scale(1.08)`;

            }, { passive: false });

            document.addEventListener("pointermove", (e: PointerEvent) => {
                  if (!this.active || e.pointerId !== this.activePointerId) return;

                  // Prevent default scrolling/zooming while dragging joystick
                  e.preventDefault();

                  let dx = e.clientX - this.centerX;
                  let dy = e.clientY - this.centerY;
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  if (dist > this.maxRadius) {
                        dx = (dx / dist) * this.maxRadius;
                        dy = (dy / dist) * this.maxRadius;
                  }

                  this.currentDir.x = dx / this.maxRadius;
                  this.currentDir.y = -dy / this.maxRadius; // Babylon Y is inverted relative to DOM Y

                  this.innerKnob.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;

                  const intensity = Math.min(dist / this.maxRadius, 1);
                  this.glowRing.style.borderColor = `rgba(168, 85, 247, ${(0.15 + intensity * 0.4).toFixed(2)})`;

                  this.onMove.notifyObservers(this.currentDir.clone());
            }, { passive: false });

            const endDrag = (e: PointerEvent) => {
                  if (e.pointerId !== this.activePointerId) return;
                  this.resetJoystick();
            };

            document.addEventListener("pointerup", endDrag);
            document.addEventListener("pointercancel", endDrag);

            // Reset position on window resize
            window.addEventListener('resize', () => {
                  if (!this.active) {
                        this.container.style.bottom = "40px";
                        this.container.style.left = "40px";
                        this.container.style.top = "auto";
                  }
            });
      }

      private resetJoystick(): void {
            this.active = false;
            this.activePointerId = -1;
            this.currentDir.x = 0;
            this.currentDir.y = 0;

            this.innerKnob.style.transform = `translate(0px, 0px) scale(1.0)`;
            this.glowRing.style.borderColor = "rgba(168, 85, 247, 0.0)";
            this.outerRing.style.borderColor = "rgba(140, 90, 255, 0.35)";
            this.outerRing.style.background = "rgba(10, 6, 20, 0.7)";

            // Return to default resting position
            this.container.style.bottom = "40px";
            this.container.style.left = "40px";
            this.container.style.top = "auto";

            this.onMove.notifyObservers(Vector2.Zero());
      }

      private startIdlePulse(): void {
            this.scene.onBeforeRenderObservable.add(() => {
                  if (this.active) return;
                  this.pulsePhase += 0.02;
                  const pulse = Math.sin(this.pulsePhase) * 0.08 + 0.35;
                  this.outerRing.style.borderColor = `rgba(140, 90, 255, ${pulse.toFixed(2)})`;
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
            if (this.container && this.container.parentNode) {
                  this.container.parentNode.removeChild(this.container);
            }
      }
}
