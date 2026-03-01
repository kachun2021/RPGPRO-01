/**
 * Minimap — Dark premium theme with canvas map
 */
export class Minimap {
      private _el: HTMLDivElement;
      private _zoneName: HTMLSpanElement;
      private _coords: HTMLSpanElement;
      private _canvas: HTMLCanvasElement;
      private _ctx: CanvasRenderingContext2D;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            this._el = document.createElement('div');
            this._el.id = 'minimap';
            this._el.className = 'interactive';
            Object.assign(this._el.style, {
                  position: 'fixed', left: '10px', top: '6px', zIndex: '160',
                  width: '150px',
                  background: 'linear-gradient(180deg, rgba(20,16,30,0.88), rgba(12,10,20,0.92))',
                  border: '1px solid rgba(160,130,80,0.3)',
                  borderRadius: '6px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                  overflow: 'hidden', pointerEvents: 'auto',
            });

            // Zone + coords header
            const header = document.createElement('div');
            header.style.cssText = 'padding:4px 8px;border-bottom:1px solid rgba(160,130,80,0.2)';

            this._zoneName = document.createElement('div');
            this._zoneName.style.cssText = 'font-family:Cinzel,serif;font-size:11px;font-weight:700;color:rgba(232,201,106,0.9);letter-spacing:0.5px;text-shadow:0 1px 3px rgba(0,0,0,0.6)';
            this._zoneName.textContent = '《 Starter Meadow 》';

            this._coords = document.createElement('div');
            this._coords.style.cssText = 'font-size:10px;color:rgba(200,195,185,0.5);margin-top:1px';
            this._coords.textContent = 'X:000, Y:000';

            header.appendChild(this._zoneName);
            header.appendChild(this._coords);
            this._el.appendChild(header);

            // Canvas
            this._canvas = document.createElement('canvas');
            this._canvas.width = 148;
            this._canvas.height = 100;
            this._canvas.style.cssText = 'width:100%;display:block';
            this._ctx = this._canvas.getContext('2d')!;
            this._el.appendChild(this._canvas);

            uiLayer.appendChild(this._el);
            this._drawGrid();
      }

      private _drawGrid(): void {
            const ctx = this._ctx;
            const w = this._canvas.width;
            const h = this._canvas.height;

            ctx.fillStyle = 'rgba(15,12,25,0.6)';
            ctx.fillRect(0, 0, w, h);

            // Grid lines
            ctx.strokeStyle = 'rgba(160,130,80,0.12)';
            ctx.lineWidth = 0.5;
            for (let x = 0; x <= w; x += 25) {
                  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y <= h; y += 25) {
                  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }
      }

      updatePosition(x: number, z: number): void {
            this._coords.textContent = `X:${Math.round(x).toString().padStart(3, '0')}, Y:${Math.round(z).toString().padStart(3, '0')}`;

            // Redraw with player dot
            this._drawGrid();
            const ctx = this._ctx;
            const px = (this._canvas.width / 2) + (x % 50);
            const py = (this._canvas.height / 2) + (z % 50);

            // Player dot glow
            const g = ctx.createRadialGradient(px, py, 0, px, py, 6);
            g.addColorStop(0, 'rgba(232,201,106,0.8)');
            g.addColorStop(1, 'rgba(232,201,106,0)');
            ctx.fillStyle = g;
            ctx.fillRect(px - 6, py - 6, 12, 12);

            // Player dot
            ctx.fillStyle = '#E8C96A';
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
      }

      setZoneName(name: string): void {
            this._zoneName.textContent = `《 ${name} 》`;
      }

      dispose(): void { this._el.remove(); }
}
