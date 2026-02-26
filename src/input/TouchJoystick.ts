import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Touch joystick (bottom-left) + WASD keyboard.
 * Returns normalized direction vector via getDirection().
 */
export class TouchJoystick {
      private _container!: HTMLDivElement;
      private _knob!: HTMLDivElement;
      private _dir = Vector3.Zero();
      private _active = false;
      private _startX = 0;
      private _startY = 0;
      private _mounted = false;

      // Keyboard state
      private _keys: Record<string, boolean> = {};
      private _keyDown = (e: KeyboardEvent) => { this._keys[e.key.toLowerCase()] = true; };
      private _keyUp = (e: KeyboardEvent) => { this._keys[e.key.toLowerCase()] = false; };

      private static RADIUS = 50;
      private static KNOB_SIZE = 36;

      init(): void {
            const uiLayer = document.getElementById("ui-layer");
            if (!uiLayer || this._mounted) return;
            this._mounted = true;

            // ── Container (touch zone) ───────────
            this._container = document.createElement("div");
            this._container.id = "joystick";
            this._container.className = "interactive";
            this._container.style.cssText = `
            position:absolute; bottom:24px; left:16px;
            width:${TouchJoystick.RADIUS * 2 + 20}px;
            height:${TouchJoystick.RADIUS * 2 + 20}px;
            border-radius:50%;
            background:rgba(10,0,20,0.5);
            border:1px solid rgba(120,60,255,0.2);
            pointer-events:auto; z-index:50;
            touch-action:none;
        `;

            // ── Knob ─────────────────────────
            this._knob = document.createElement("div");
            this._knob.style.cssText = `
            position:absolute; left:50%; top:50%;
            width:${TouchJoystick.KNOB_SIZE}px;
            height:${TouchJoystick.KNOB_SIZE}px;
            border-radius:50%;
            background:radial-gradient(circle, rgba(120,60,255,0.6), rgba(60,20,180,0.4));
            border:1px solid rgba(120,60,255,0.5);
            transform:translate(-50%,-50%);
            transition: transform 0.05s;
            pointer-events:none;
        `;
            this._container.appendChild(this._knob);

            // ── Touch events ─────────────────
            this._container.addEventListener("pointerdown", (e) => {
                  this._active = true;
                  const r = this._container.getBoundingClientRect();
                  this._startX = r.left + r.width / 2;
                  this._startY = r.top + r.height / 2;
                  this._handleMove(e.clientX, e.clientY);
                  this._container.setPointerCapture(e.pointerId);
            });
            this._container.addEventListener("pointermove", (e) => {
                  if (!this._active) return;
                  this._handleMove(e.clientX, e.clientY);
            });
            const release = () => {
                  this._active = false;
                  this._dir.set(0, 0, 0);
                  this._knob.style.transform = "translate(-50%,-50%)";
            };
            this._container.addEventListener("pointerup", release);
            this._container.addEventListener("pointercancel", release);

            uiLayer.appendChild(this._container);

            // ── WASD ─────────────────────────
            window.addEventListener("keydown", this._keyDown);
            window.addEventListener("keyup", this._keyUp);
      }

      private _handleMove(cx: number, cy: number): void {
            let dx = cx - this._startX;
            let dy = cy - this._startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const max = TouchJoystick.RADIUS;
            if (dist > max) {
                  dx = (dx / dist) * max;
                  dy = (dy / dist) * max;
            }
            this._knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            // Map screen axes → world XZ (screen Y → world Z)
            const mag = Math.min(dist / max, 1);
            this._dir.set(dx / max * mag, 0, -dy / max * mag);
      }

      /** Combined direction from touch + WASD (normalized) */
      getDirection(): Vector3 {
            let x = this._dir.x;
            let z = this._dir.z;

            // WASD overlay
            if (this._keys["w"] || this._keys["arrowup"]) z += 1;
            if (this._keys["s"] || this._keys["arrowdown"]) z -= 1;
            if (this._keys["a"] || this._keys["arrowleft"]) x -= 1;
            if (this._keys["d"] || this._keys["arrowright"]) x += 1;

            const v = new Vector3(x, 0, z);
            return v.lengthSquared() > 0.01 ? v.normalize() : Vector3.Zero();
      }

      dispose(): void {
            this._container?.remove();
            window.removeEventListener("keydown", this._keyDown);
            window.removeEventListener("keyup", this._keyUp);
            this._mounted = false;
      }
}
