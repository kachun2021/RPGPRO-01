export class Minimap {
      private _el: HTMLDivElement;
      private _canvas: HTMLCanvasElement;
      private _ctx: CanvasRenderingContext2D;
      private _zoneEl: HTMLSpanElement;
      private _coordEl: HTMLSpanElement;
      private _collapsed = false;
      private _toggleBtn: HTMLDivElement;

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'minimap';
            this._el.className = 'sa-frame sa-collapsible interactive';
            Object.assign(this._el.style, {
                  position: 'fixed', left: '8px', top: '8px', zIndex: '150',
            });

            // Toggle
            this._toggleBtn = document.createElement('div');
            this._toggleBtn.className = 'sa-toggle-btn';
            this._toggleBtn.textContent = '▼ Map';
            this._toggleBtn.addEventListener('click', () => this._toggleCollapse());
            this._el.appendChild(this._toggleBtn);

            // Content
            const content = document.createElement('div');
            content.id = 'minimapContent';

            // Zone + Coords
            const info = document.createElement('div');
            info.style.cssText = 'display:flex;justify-content:space-between;padding:4px 6px;font-size:11px';
            this._zoneEl = document.createElement('span');
            this._zoneEl.style.cssText = 'color:#5C3D1A;font-weight:700';
            this._zoneEl.textContent = 'Starter Meadow';
            this._coordEl = document.createElement('span');
            this._coordEl.style.cssText = 'color:#8B7355';
            this._coordEl.textContent = 'K:000, Y:000';
            info.appendChild(this._zoneEl);
            info.appendChild(this._coordEl);
            content.appendChild(info);

            // Canvas
            this._canvas = document.createElement('canvas');
            this._canvas.width = 168;
            this._canvas.height = 130;
            this._canvas.style.cssText = 'display:block;border-top:1px solid #C4A97D;background:#D4C4A0';
            this._ctx = this._canvas.getContext('2d')!;
            content.appendChild(this._canvas);

            this._el.appendChild(content);
            document.getElementById('ui-layer')?.appendChild(this._el);

            this._drawDefault();
      }

      updatePosition(x: number, z: number): void {
            this._coordEl.textContent = `K:${Math.round(x).toString().padStart(3, '0')}, Y:${Math.round(z).toString().padStart(3, '0')}`;
            this._drawDefault();

            // Draw player dot
            const cx = 84 + (x % 50) * 1.5;
            const cy = 65 - (z % 50) * 1.5;
            this._ctx.fillStyle = '#FF3333';
            this._ctx.beginPath();
            this._ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            this._ctx.fill();
      }

      setZone(name: string): void {
            this._zoneEl.textContent = name;
      }

      private _drawDefault(): void {
            const ctx = this._ctx;
            ctx.fillStyle = '#D4C4A0';
            ctx.fillRect(0, 0, 168, 130);

            // Grid lines
            ctx.strokeStyle = '#C4A97D';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 168; i += 14) {
                  ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 130); ctx.stroke();
            }
            for (let i = 0; i < 130; i += 14) {
                  ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(168, i); ctx.stroke();
            }

            // Roads (simple cross)
            ctx.strokeStyle = '#B8A888';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(84, 0); ctx.lineTo(84, 130); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 65); ctx.lineTo(168, 65); ctx.stroke();
      }

      private _toggleCollapse(): void {
            this._collapsed = !this._collapsed;
            const content = this._el.querySelector('#minimapContent') as HTMLElement;
            content.style.display = this._collapsed ? 'none' : '';
            this._toggleBtn.textContent = this._collapsed ? '▶ Map' : '▼ Map';
      }

      dispose(): void { this._el.remove(); }
}
