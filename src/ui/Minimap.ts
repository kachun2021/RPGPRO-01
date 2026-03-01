/**
 * Minimap — Minimal floating text (Stone Age style)
 * Shows zone name + coordinates, no canvas grid
 */
export class Minimap {
      private _el: HTMLDivElement;
      private _zoneName: HTMLSpanElement;
      private _coords: HTMLSpanElement;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            this._el = document.createElement('div');
            this._el.id = 'minimap';
            this._el.className = 'interactive';
            Object.assign(this._el.style, {
                  position: 'fixed', left: '12px', top: '8px', zIndex: '160',
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  pointerEvents: 'auto',
            });

            // Zone name
            this._zoneName = document.createElement('span');
            this._zoneName.style.cssText = 'font-family:Cinzel,serif;font-size:13px;font-weight:700;color:rgba(232,201,106,0.9);text-shadow:0 1px 4px rgba(0,0,0,0.7),0 0 8px rgba(232,201,106,0.2);letter-spacing:1px';
            this._zoneName.textContent = '《 Starter Meadow 》';

            // Coordinates
            this._coords = document.createElement('span');
            this._coords.style.cssText = 'font-family:Inter,sans-serif;font-size:11px;font-weight:500;color:rgba(220,215,200,0.6);text-shadow:0 1px 3px rgba(0,0,0,0.6)';
            this._coords.textContent = 'X:000, Y:000';

            this._el.appendChild(this._zoneName);
            this._el.appendChild(this._coords);
            uiLayer.appendChild(this._el);
      }

      updatePosition(x: number, z: number): void {
            this._coords.textContent = `X:${Math.round(x).toString().padStart(3, '0')}, Y:${Math.round(z).toString().padStart(3, '0')}`;
      }

      setZoneName(name: string): void {
            this._zoneName.textContent = `《 ${name} 》`;
      }

      dispose(): void { this._el.remove(); }
}
