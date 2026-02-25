import { Scene } from "@babylonjs/core/scene";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";

export interface SwipeData {
      direction: Vector2;       // normalized direction
      magnitude: number;        // swipe length in px
      velocity: number;         // px per ms
      startPos: Vector2;
      endPos: Vector2;
}

export interface TapData {
      position: Vector2;
      timestamp: number;
}

/**
 * Central touch event router.
 * - Left 40% of screen → joystick zone (forwarded to TouchJoystick)
 * - Right 60% of screen → attack/camera gestures
 * - Manages multi-touch separation
 */
export class InputManager {
      // Observables for game systems to subscribe to
      public readonly onSwipeAttack = new Observable<SwipeData>();
      public readonly onTap = new Observable<TapData>();
      public readonly onCameraDrag = new Observable<Vector2>();

      private canvas: HTMLCanvasElement;
      private activeTouches: Map<number, { startX: number; startY: number; startTime: number; isJoystick: boolean }> = new Map();
      private joystickBoundary: number = 0.4; // left 40% is joystick zone
      private swipeThreshold: number = 40;    // min px for swipe
      private tapThreshold: number = 15;      // max px for tap
      private lastCameraPos: Vector2 | null = null;

      // External: joystick callbacks
      public onJoystickStart: ((id: number, x: number, y: number) => void) | null = null;
      public onJoystickMove: ((id: number, x: number, y: number) => void) | null = null;
      public onJoystickEnd: ((id: number) => void) | null = null;

      constructor(private scene: Scene) {
            this.canvas = scene.getEngine().getRenderingCanvas()!;
            this.setupListeners();
            console.log("[InputManager] Initialized ✓");
      }

      private setupListeners(): void {
            const opts: AddEventListenerOptions = { passive: false };

            this.canvas.addEventListener("touchstart", (e) => this.onTouchStart(e), opts);
            this.canvas.addEventListener("touchmove", (e) => this.onTouchMove(e), opts);
            this.canvas.addEventListener("touchend", (e) => this.onTouchEnd(e), opts);
            this.canvas.addEventListener("touchcancel", (e) => this.onTouchEnd(e), opts);

            // Mouse fallback for desktop testing
            this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
            this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
            this.canvas.addEventListener("mouseup", (e) => this.onMouseUp(e));
      }

      private isJoystickZone(x: number): boolean {
            return x < this.canvas.clientWidth * this.joystickBoundary;
      }

      private onTouchStart(e: TouchEvent): void {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                  const t = e.changedTouches[i];
                  const isJoy = this.isJoystickZone(t.clientX);
                  this.activeTouches.set(t.identifier, {
                        startX: t.clientX,
                        startY: t.clientY,
                        startTime: performance.now(),
                        isJoystick: isJoy,
                  });
                  if (isJoy && this.onJoystickStart) {
                        this.onJoystickStart(t.identifier, t.clientX, t.clientY);
                  }
            }
      }

      private onTouchMove(e: TouchEvent): void {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                  const t = e.changedTouches[i];
                  const data = this.activeTouches.get(t.identifier);
                  if (!data) continue;

                  if (data.isJoystick) {
                        if (this.onJoystickMove) {
                              this.onJoystickMove(t.identifier, t.clientX, t.clientY);
                        }
                  } else {
                        // Camera drag
                        const delta = new Vector2(
                              t.clientX - data.startX,
                              t.clientY - data.startY
                        );
                        this.onCameraDrag.notifyObservers(delta);
                  }
            }
      }

      private onTouchEnd(e: TouchEvent): void {
            for (let i = 0; i < e.changedTouches.length; i++) {
                  const t = e.changedTouches[i];
                  const data = this.activeTouches.get(t.identifier);
                  if (!data) continue;

                  if (data.isJoystick) {
                        if (this.onJoystickEnd) {
                              this.onJoystickEnd(t.identifier);
                        }
                  } else {
                        // Check for swipe or tap
                        const dx = t.clientX - data.startX;
                        const dy = t.clientY - data.startY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const dt = performance.now() - data.startTime;

                        if (dist > this.swipeThreshold && dt < 500) {
                              // Swipe attack detected
                              const dir = new Vector2(dx, dy).normalize();
                              this.onSwipeAttack.notifyObservers({
                                    direction: dir,
                                    magnitude: dist,
                                    velocity: dist / dt,
                                    startPos: new Vector2(data.startX, data.startY),
                                    endPos: new Vector2(t.clientX, t.clientY),
                              });
                              console.log(`[Input] Swipe attack! dir=(${dir.x.toFixed(2)},${dir.y.toFixed(2)}) vel=${(dist / dt).toFixed(1)}`);
                        } else if (dist < this.tapThreshold) {
                              // Tap
                              this.onTap.notifyObservers({
                                    position: new Vector2(t.clientX, t.clientY),
                                    timestamp: performance.now(),
                              });
                        }
                  }

                  this.activeTouches.delete(t.identifier);
            }
      }

      // ── Mouse fallback for desktop ────────────────────────────────────
      private mouseDown = false;
      private mouseIsJoystick = false;
      private mouseStartX = 0;
      private mouseStartY = 0;
      private mouseStartTime = 0;

      private onMouseDown(e: MouseEvent): void {
            this.mouseDown = true;
            this.mouseIsJoystick = this.isJoystickZone(e.clientX);
            this.mouseStartX = e.clientX;
            this.mouseStartY = e.clientY;
            this.mouseStartTime = performance.now();

            if (this.mouseIsJoystick && this.onJoystickStart) {
                  this.onJoystickStart(-1, e.clientX, e.clientY);
            }
      }

      private onMouseMove(e: MouseEvent): void {
            if (!this.mouseDown) return;

            if (this.mouseIsJoystick) {
                  if (this.onJoystickMove) {
                        this.onJoystickMove(-1, e.clientX, e.clientY);
                  }
            }
      }

      private onMouseUp(e: MouseEvent): void {
            if (!this.mouseDown) return;
            this.mouseDown = false;

            if (this.mouseIsJoystick) {
                  if (this.onJoystickEnd) this.onJoystickEnd(-1);
            } else {
                  const dx = e.clientX - this.mouseStartX;
                  const dy = e.clientY - this.mouseStartY;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const dt = performance.now() - this.mouseStartTime;

                  if (dist > this.swipeThreshold && dt < 500) {
                        const dir = new Vector2(dx, dy).normalize();
                        this.onSwipeAttack.notifyObservers({
                              direction: dir,
                              magnitude: dist,
                              velocity: dist / dt,
                              startPos: new Vector2(this.mouseStartX, this.mouseStartY),
                              endPos: new Vector2(e.clientX, e.clientY),
                        });
                        console.log(`[Input] Mouse swipe! dir=(${dir.x.toFixed(2)},${dir.y.toFixed(2)})`);
                  }
            }
      }

      public dispose(): void {
            this.onSwipeAttack.clear();
            this.onTap.clear();
            this.onCameraDrag.clear();
      }
}
