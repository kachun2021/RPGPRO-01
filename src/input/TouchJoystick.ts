import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * TouchJoystick — 虛擬搖桿（左下角）+ WASD 鍵盤
 * ✅ 修復：pointer events 正確處理
 * ✅ 修復：knob 視覺跟隨手指/滑鼠移動
 * ✅ 修復：WASD 事件監聽不依賴 canvas focus
 */
export class TouchJoystick {
      private _container!: HTMLDivElement;
      private _knob!: HTMLDivElement;
      private _dir = new Vector3(0, 0, 0);
      private _active = false;
      private _startX = 0;
      private _startY = 0;
      private _mounted = false;

      // Keyboard state — use a simple flat object for zero GC
      private _keys: Record<string, boolean> = {};

      private static readonly RADIUS = 55;
      private static readonly KNOB_SIZE = 40;

      init(): void {
            const uiLayer = document.getElementById("ui-layer");
            if (!uiLayer || this._mounted) return;
            this._mounted = true;

            // ── Outer ring (base) ─────────────────────────────
            this._container = document.createElement("div");
            this._container.id = "joystick";
            this._container.style.cssText = `
                position: absolute;
                bottom: 28px;
                left: 20px;
                width: ${TouchJoystick.RADIUS * 2}px;
                height: ${TouchJoystick.RADIUS * 2}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(30,5,60,0.75) 0%, rgba(10,0,25,0.55) 100%);
                border: 2px solid rgba(120,60,255,0.45);
                box-shadow: 0 0 18px rgba(100,40,220,0.25), inset 0 0 12px rgba(0,0,0,0.4);
                pointer-events: auto;
                z-index: 200;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                cursor: pointer;
            `;

            // ── Knob (inner circle) ────────────────────────────
            this._knob = document.createElement("div");
            this._knob.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: ${TouchJoystick.KNOB_SIZE}px;
                height: ${TouchJoystick.KNOB_SIZE}px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 35%, rgba(160,80,255,0.9), rgba(80,20,200,0.75));
                border: 2px solid rgba(180,100,255,0.7);
                box-shadow: 0 0 12px rgba(140,60,255,0.6);
                transform: translate(-50%, -50%);
                pointer-events: none;
                transition: transform 0.04s ease-out;
                will-change: transform;
            `;
            this._container.appendChild(this._knob);

            // ── Pointer events (touch + mouse) ─────────────────
            this._container.addEventListener("pointerdown", (e: PointerEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this._active = true;
                  this._container.setPointerCapture(e.pointerId);
                  // Center of the joystick base in screen space
                  const r = this._container.getBoundingClientRect();
                  this._startX = r.left + r.width / 2;
                  this._startY = r.top + r.height / 2;
                  this._updateFromPointer(e.clientX, e.clientY);
            }, { passive: false });

            this._container.addEventListener("pointermove", (e: PointerEvent) => {
                  if (!this._active) return;
                  e.preventDefault();
                  this._updateFromPointer(e.clientX, e.clientY);
            }, { passive: false });

            const release = () => {
                  this._active = false;
                  this._dir.x = 0;
                  this._dir.z = 0;
                  // Animate knob back to center
                  this._knob.style.transform = "translate(-50%, -50%)";
            };
            this._container.addEventListener("pointerup", release);
            this._container.addEventListener("pointercancel", release);
            this._container.addEventListener("lostpointercapture", release);

            uiLayer.appendChild(this._container);

            // ── WASD + Arrow keys ───────────────────────────────
            // capture:true = 在 Babylon 引擎之前收到事件
            // 同時監聽 window + document 確保任何 focus 狀態都能捕獲
            window.addEventListener("keydown", this._onKeyDown, true);
            window.addEventListener("keyup", this._onKeyUp, true);
            document.addEventListener("keydown", this._onKeyDown, true);
            document.addEventListener("keyup", this._onKeyUp, true);
      }

      private _onKeyDown = (e: KeyboardEvent): void => {
            this._keys[e.code] = true; // use e.code for layout-independent detection
            this._keys[e.key.toLowerCase()] = true;
      };

      private _onKeyUp = (e: KeyboardEvent): void => {
            this._keys[e.code] = false;
            this._keys[e.key.toLowerCase()] = false;
      };

      private _updateFromPointer(clientX: number, clientY: number): void {
            let dx = clientX - this._startX;
            let dy = clientY - this._startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const max = TouchJoystick.RADIUS;

            if (dist > max) {
                  dx = (dx / dist) * max;
                  dy = (dy / dist) * max;
            }

            // Visual knob position
            this._knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

            // Direction: screen X → world X, screen Y (up = negative) → world Z (forward = positive)
            const mag = Math.min(dist / max, 1);
            this._dir.x = (dx / max) * mag;
            this._dir.z = -(dy / max) * mag;  // screen up = world forward
      }

      /** Get combined direction from joystick + WASD (normalized, Y=0) */
      getDirection(): Vector3 {
            let x = this._dir.x;
            let z = this._dir.z;

            // WASD (use KeyCode for layout independence)
            if (this._keys["KeyW"] || this._keys["ArrowUp"] || this._keys["w"]) z += 1;
            if (this._keys["KeyS"] || this._keys["ArrowDown"] || this._keys["s"]) z -= 1;
            if (this._keys["KeyA"] || this._keys["ArrowLeft"] || this._keys["a"]) x -= 1;
            if (this._keys["KeyD"] || this._keys["ArrowRight"] || this._keys["d"]) x += 1;

            if (Math.abs(x) < 0.01 && Math.abs(z) < 0.01) return Vector3.Zero();
            const len = Math.sqrt(x * x + z * z);
            return new Vector3(x / len, 0, z / len);
      }

      dispose(): void {
            this._container?.remove();
            window.removeEventListener("keydown", this._onKeyDown, true);
            window.removeEventListener("keyup", this._onKeyUp, true);
            document.removeEventListener("keydown", this._onKeyDown, true);
            document.removeEventListener("keyup", this._onKeyUp, true);
            this._mounted = false;
      }
}
