import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export class TouchJoystick {
      public direction = Vector3.Zero();
      private _container: HTMLDivElement;
      private _knob: HTMLDivElement;
      private _active = false;
      private _startX = 0;
      private _startY = 0;
      private _keys = { w: false, a: false, s: false, d: false };
      private _radius = 50;

      constructor() {
            // Container
            this._container = document.createElement('div');
            this._container.id = 'joystick';
            this._container.className = 'interactive';
            Object.assign(this._container.style, {
                  position: 'fixed', left: '16px', bottom: '64px',
                  width: '120px', height: '120px', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '2px solid rgba(180,200,255,0.1)',
                  zIndex: '200', touchAction: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
            });

            // Knob
            this._knob = document.createElement('div');
            Object.assign(this._knob.style, {
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(232,201,106,0.25) 0%, rgba(232,201,106,0.08) 100%)',
                  border: '1px solid rgba(232,201,106,0.2)',
                  transition: 'transform 0.05s',
                  pointerEvents: 'none',
            });
            this._container.appendChild(this._knob);

            document.getElementById('ui-layer')?.appendChild(this._container);

            // Touch events
            this._container.addEventListener('pointerdown', this._onDown.bind(this));
            window.addEventListener('pointermove', this._onMove.bind(this));
            window.addEventListener('pointerup', this._onUp.bind(this));

            // WASD fallback
            window.addEventListener('keydown', (e) => this._onKey(e.key.toLowerCase(), true));
            window.addEventListener('keyup', (e) => this._onKey(e.key.toLowerCase(), false));
      }

      private _onDown(e: PointerEvent): void {
            this._active = true;
            this._startX = e.clientX;
            this._startY = e.clientY;
            this._container.setPointerCapture(e.pointerId);
      }

      private _onMove(e: PointerEvent): void {
            if (!this._active) return;
            let dx = e.clientX - this._startX;
            let dy = e.clientY - this._startY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this._radius) {
                  dx = (dx / dist) * this._radius;
                  dy = (dy / dist) * this._radius;
            }

            this._knob.style.transform = `translate(${dx}px, ${dy}px)`;

            // Normalize to -1..1
            const nx = dx / this._radius;
            const ny = -dy / this._radius; // invert Y for 3D
            this.direction.set(nx, 0, ny);
      }

      private _onUp(e: PointerEvent): void {
            this._active = false;
            this._knob.style.transform = 'translate(0, 0)';
            this.direction.set(0, 0, 0);
      }

      private _onKey(key: string, pressed: boolean): void {
            if (key in this._keys) {
                  (this._keys as any)[key] = pressed;
            }
            // Compute WASD direction
            let x = 0, z = 0;
            if (this._keys.w) z += 1;
            if (this._keys.s) z -= 1;
            if (this._keys.a) x -= 1;
            if (this._keys.d) x += 1;

            if (x !== 0 || z !== 0) {
                  const len = Math.sqrt(x * x + z * z);
                  this.direction.set(x / len, 0, z / len);
            } else if (!this._active) {
                  this.direction.set(0, 0, 0);
            }
      }

      dispose(): void {
            this._container.remove();
      }
}
