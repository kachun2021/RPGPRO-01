/**
 * Minimap - collapsible radar widget.
 * Shows player (gold), monsters (red), bosses (pulsing red), NPCs (green).
 */

/** Entity dot data for radar display. */
export interface MinimapEntity {
      x: number;
      z: number;
      isBoss?: boolean;
      npcType?: string;
}

export class Minimap {
      private _el: HTMLDivElement;
      private _header: HTMLDivElement;
      private _arrow: HTMLSpanElement;
      private _zoneName: HTMLSpanElement;
      private _body: HTMLDivElement;
      private _coords: HTMLSpanElement;
      private _canvas: HTMLCanvasElement;
      private _ctx: CanvasRenderingContext2D;
      private _collapsed = false;

      private readonly RADAR_RADIUS = 30;
      private readonly CANVAS_W = 148;
      private readonly CANVAS_H = 110;

      private _pulsePhase = 0;
      private _manualToggle = false;
      private readonly _onResize = (): void => {
            if (this._manualToggle) return;
            this._applyResponsiveCollapsedState();
      };

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            this._el = document.createElement('div');
            this._el.id = 'minimap';
            this._el.className = 'interactive minimap-root';
            this._el.dataset.chromeGroup = 'utility';

            this._header = document.createElement('div');
            this._header.className = 'minimap-header';
            this._header.addEventListener('click', () => this._toggle());

            this._arrow = document.createElement('span');
            this._arrow.className = 'minimap-arrow';
            this._arrow.textContent = '▼';

            this._zoneName = document.createElement('span');
            this._zoneName.className = 'minimap-zone-name';
            this._zoneName.textContent = '《 新手草原 》';

            this._header.appendChild(this._arrow);
            this._header.appendChild(this._zoneName);
            this._el.appendChild(this._header);

            this._body = document.createElement('div');
            this._body.className = 'minimap-body';

            this._coords = document.createElement('div');
            this._coords.className = 'minimap-coords';
            this._coords.textContent = 'X:000, Y:000';
            this._body.appendChild(this._coords);

            this._canvas = document.createElement('canvas');
            this._canvas.width = this.CANVAS_W;
            this._canvas.height = this.CANVAS_H;
            this._canvas.className = 'minimap-canvas';
            this._ctx = this._canvas.getContext('2d')!;
            this._body.appendChild(this._canvas);

            this._el.appendChild(this._body);
            uiLayer.appendChild(this._el);

            window.addEventListener('resize', this._onResize);
            this._applyResponsiveCollapsedState();
            this._drawGrid();
      }

      private _toggle(): void {
            this._manualToggle = true;
            this._collapsed = !this._collapsed;
            this._syncCollapsedUi();
      }

      private _applyResponsiveCollapsedState(): void {
            const width = window.innerWidth || 0;
            const height = window.innerHeight || 0;
            const shouldCollapse = width > height && (width <= 932 || height <= 620);
            this._collapsed = shouldCollapse;
            this._syncCollapsedUi();
      }

      private _syncCollapsedUi(): void {
            this._el.classList.toggle('is-collapsed', this._collapsed);
            this._arrow.textContent = this._collapsed ? '▶' : '▼';
      }

      private _drawGrid(): void {
            const ctx = this._ctx;
            const w = this.CANVAS_W;
            const h = this.CANVAS_H;

            ctx.fillStyle = 'rgba(15,12,25,0.6)';
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = 'rgba(160,130,80,0.08)';
            ctx.lineWidth = 0.5;
            for (let x = 0; x <= w; x += 25) {
                  ctx.beginPath();
                  ctx.moveTo(x, 0);
                  ctx.lineTo(x, h);
                  ctx.stroke();
            }
            for (let y = 0; y <= h; y += 25) {
                  ctx.beginPath();
                  ctx.moveTo(0, y);
                  ctx.lineTo(w, y);
                  ctx.stroke();
            }

            const cx = w / 2;
            const cy = (h - 14) / 2;
            ctx.strokeStyle = 'rgba(160,130,80,0.1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(cx, cy) - 4, 0, Math.PI * 2);
            ctx.stroke();
      }

      /**
       * Full update: player position + entity radar.
       * Called every frame from the game loop.
       */
      updatePosition(
            playerX: number,
            playerZ: number,
            monsters?: MinimapEntity[],
            npcs?: MinimapEntity[],
      ): void {
            this._coords.textContent = `X:${Math.round(playerX).toString().padStart(3, '0')}, Y:${Math.round(playerZ).toString().padStart(3, '0')}`;

            if (this._collapsed) return;

            this._pulsePhase = (this._pulsePhase + 0.06) % (Math.PI * 2);
            const bossPulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);

            this._drawGrid();

            const ctx = this._ctx;
            const w = this.CANVAS_W;
            const h = this.CANVAS_H;
            const legendH = 14;
            const mapH = h - legendH;
            const cx = w / 2;
            const cy = mapH / 2;
            const scale = Math.min(cx, cy) / this.RADAR_RADIUS;

            if (npcs) {
                  for (const npc of npcs) {
                        const dx = (npc.x - playerX) * scale;
                        const dz = (npc.z - playerZ) * scale;
                        const sx = cx + dx;
                        const sy = cy - dz;

                        if (sx < 2 || sx > w - 2 || sy < 2 || sy > mapH - 2) continue;

                        const ng = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5);
                        ng.addColorStop(0, 'rgba(39,174,96,0.35)');
                        ng.addColorStop(1, 'rgba(39,174,96,0)');
                        ctx.fillStyle = ng;
                        ctx.fillRect(sx - 5, sy - 5, 10, 10);

                        ctx.fillStyle = '#27AE60';
                        ctx.beginPath();
                        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                  }
            }

            if (monsters) {
                  for (const mon of monsters) {
                        const dx = (mon.x - playerX) * scale;
                        const dz = (mon.z - playerZ) * scale;
                        const sx = cx + dx;
                        const sy = cy - dz;

                        if (sx < 2 || sx > w - 2 || sy < 2 || sy > mapH - 2) continue;

                        if (mon.isBoss) {
                              const glowR = 6 + bossPulse * 3;
                              const bg = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
                              bg.addColorStop(0, `rgba(231,76,60,${0.4 + bossPulse * 0.3})`);
                              bg.addColorStop(1, 'rgba(231,76,60,0)');
                              ctx.fillStyle = bg;
                              ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);

                              ctx.fillStyle = '#E74C3C';
                              ctx.beginPath();
                              ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
                              ctx.fill();

                              ctx.strokeStyle = `rgba(255,215,0,${0.4 + bossPulse * 0.4})`;
                              ctx.lineWidth = 0.8;
                              ctx.beginPath();
                              ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                              ctx.stroke();
                        } else {
                              const mg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 4);
                              mg.addColorStop(0, 'rgba(231,76,60,0.3)');
                              mg.addColorStop(1, 'rgba(231,76,60,0)');
                              ctx.fillStyle = mg;
                              ctx.fillRect(sx - 4, sy - 4, 8, 8);

                              ctx.fillStyle = '#E74C3C';
                              ctx.beginPath();
                              ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                              ctx.fill();
                        }
                  }
            }

            const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 7);
            pg.addColorStop(0, 'rgba(232,201,106,0.8)');
            pg.addColorStop(1, 'rgba(232,201,106,0)');
            ctx.fillStyle = pg;
            ctx.fillRect(cx - 7, cy - 7, 14, 14);

            ctx.fillStyle = '#E8C96A';
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(232,201,106,0.5)';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 5);
            ctx.lineTo(cx - 2.5, cy - 2);
            ctx.lineTo(cx + 2.5, cy - 2);
            ctx.closePath();
            ctx.fill();

            this._drawLegend(mapH);
      }

      private _drawLegend(startY: number): void {
            const ctx = this._ctx;
            const w = this.CANVAS_W;

            ctx.fillStyle = 'rgba(15,12,25,0.7)';
            ctx.fillRect(0, startY, w, 14);
            ctx.strokeStyle = 'rgba(160,130,80,0.12)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, startY);
            ctx.lineTo(w, startY);
            ctx.stroke();

            const y = startY + 7;
            ctx.font = '7px Inter, sans-serif';
            ctx.textBaseline = 'middle';

            let x = 6;
            ctx.fillStyle = '#E8C96A';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(200,195,185,0.5)';
            ctx.fillText('玩家', x + 5, y);
            x += 22;

            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(200,195,185,0.5)';
            ctx.fillText('怪物', x + 5, y);
            x += 22;

            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,215,0,0.6)';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(200,195,185,0.5)';
            ctx.fillText('Boss', x + 7, y);
            x += 24;

            ctx.fillStyle = '#27AE60';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(200,195,185,0.5)';
            ctx.fillText('NPC', x + 5, y);
      }

      setZoneName(name: string): void {
            this._zoneName.textContent = `《 ${name} 》`;
      }

      get collapsed(): boolean {
            return this._collapsed;
      }

      dispose(): void {
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
