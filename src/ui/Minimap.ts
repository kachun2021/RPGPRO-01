/**
 * Minimap — Collapsible/Expandable dark premium radar
 * Shows player (gold), monsters (red), bosses (pulsing red), NPCs (green)
 * Click header to toggle collapsed/expanded state
 */

/** Entity dot data for radar display */
export interface MinimapEntity {
      x: number;
      z: number;
      isBoss?: boolean;
      npcType?: string; // 'monster' | 'npc' — determined by which array it's in
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

      /** Radar config */
      private readonly RADAR_RADIUS = 30;  // world units visible
      private readonly CANVAS_W = 148;
      private readonly CANVAS_H = 110;

      /** Pulse animation for bosses */
      private _pulsePhase = 0;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            // — Container —
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
                  transition: 'box-shadow 0.3s ease',
            });

            // — Header (clickable toggle) —
            this._header = document.createElement('div');
            Object.assign(this._header.style, {
                  padding: '4px 8px',
                  borderBottom: '1px solid rgba(160,130,80,0.2)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  userSelect: 'none',
                  transition: 'background 0.2s ease',
            });
            this._header.addEventListener('mouseenter', () => {
                  this._header.style.background = 'rgba(160,130,80,0.08)';
            });
            this._header.addEventListener('mouseleave', () => {
                  this._header.style.background = 'transparent';
            });
            this._header.addEventListener('click', () => this._toggle());

            // Arrow indicator
            this._arrow = document.createElement('span');
            Object.assign(this._arrow.style, {
                  fontSize: '8px', color: 'rgba(232,201,106,0.6)',
                  transition: 'transform 0.3s ease',
                  display: 'inline-block',
            });
            this._arrow.textContent = '▲';

            // Zone name
            this._zoneName = document.createElement('span');
            Object.assign(this._zoneName.style, {
                  fontFamily: 'Cinzel, serif', fontSize: '11px', fontWeight: '700',
                  color: 'rgba(232,201,106,0.9)', letterSpacing: '0.5px',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                  flex: '1',
            });
            this._zoneName.textContent = '《 Starter Meadow 》';

            this._header.appendChild(this._arrow);
            this._header.appendChild(this._zoneName);
            this._el.appendChild(this._header);

            // — Body (collapsible) —
            this._body = document.createElement('div');
            Object.assign(this._body.style, {
                  maxHeight: '140px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-out, opacity 0.25s ease-out',
                  opacity: '1',
            });

            // Coordinates
            this._coords = document.createElement('div');
            Object.assign(this._coords.style, {
                  fontSize: '10px', color: 'rgba(200,195,185,0.5)',
                  padding: '2px 8px 0',
            });
            this._coords.textContent = 'X:000, Y:000';
            this._body.appendChild(this._coords);

            // Canvas
            this._canvas = document.createElement('canvas');
            this._canvas.width = this.CANVAS_W;
            this._canvas.height = this.CANVAS_H;
            this._canvas.style.cssText = 'width:100%;display:block';
            this._ctx = this._canvas.getContext('2d')!;
            this._body.appendChild(this._canvas);

            this._el.appendChild(this._body);
            uiLayer.appendChild(this._el);

            this._drawGrid();
      }

      // ── Toggle collapse ──

      private _toggle(): void {
            this._collapsed = !this._collapsed;
            if (this._collapsed) {
                  this._body.style.maxHeight = '0';
                  this._body.style.opacity = '0';
                  this._arrow.textContent = '▼';
                  this._arrow.style.transform = 'rotate(0deg)';
                  this._header.style.borderBottom = 'none';
            } else {
                  this._body.style.maxHeight = '140px';
                  this._body.style.opacity = '1';
                  this._arrow.textContent = '▲';
                  this._arrow.style.transform = 'rotate(0deg)';
                  this._header.style.borderBottom = '1px solid rgba(160,130,80,0.2)';
            }
      }

      // ── Drawing ──

      private _drawGrid(): void {
            const ctx = this._ctx;
            const w = this.CANVAS_W;
            const h = this.CANVAS_H;

            ctx.fillStyle = 'rgba(15,12,25,0.6)';
            ctx.fillRect(0, 0, w, h);

            // Grid lines
            ctx.strokeStyle = 'rgba(160,130,80,0.08)';
            ctx.lineWidth = 0.5;
            for (let x = 0; x <= w; x += 25) {
                  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y <= h; y += 25) {
                  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }

            // Radar range circle (subtle)
            const cx = w / 2;
            const cy = (h - 14) / 2; // offset for legend at bottom
            ctx.strokeStyle = 'rgba(160,130,80,0.1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(cx, cy) - 4, 0, Math.PI * 2);
            ctx.stroke();
      }

      /**
       * Full update: player position + entity radar
       * Called every frame from the game loop
       */
      updatePosition(
            playerX: number,
            playerZ: number,
            monsters?: MinimapEntity[],
            npcs?: MinimapEntity[],
      ): void {
            // Update coordinates text
            this._coords.textContent = `X:${Math.round(playerX).toString().padStart(3, '0')}, Y:${Math.round(playerZ).toString().padStart(3, '0')}`;

            // Skip canvas redraw if collapsed
            if (this._collapsed) return;

            // Advance boss pulse phase
            this._pulsePhase = (this._pulsePhase + 0.06) % (Math.PI * 2);
            const bossPulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);

            // Redraw background + grid
            this._drawGrid();

            const ctx = this._ctx;
            const w = this.CANVAS_W;
            const h = this.CANVAS_H;
            const legendH = 14;
            const mapH = h - legendH;
            const cx = w / 2;
            const cy = mapH / 2;
            const scale = Math.min(cx, cy) / this.RADAR_RADIUS;

            // — Draw NPC dots (green) —
            if (npcs) {
                  for (const npc of npcs) {
                        const dx = (npc.x - playerX) * scale;
                        const dz = (npc.z - playerZ) * scale;
                        const sx = cx + dx;
                        const sy = cy - dz; // negate: canvas Y↓ but world Z↑ = forward

                        // Skip if outside canvas map area
                        if (sx < 2 || sx > w - 2 || sy < 2 || sy > mapH - 2) continue;

                        // NPC glow
                        const ng = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5);
                        ng.addColorStop(0, 'rgba(39,174,96,0.35)');
                        ng.addColorStop(1, 'rgba(39,174,96,0)');
                        ctx.fillStyle = ng;
                        ctx.fillRect(sx - 5, sy - 5, 10, 10);

                        // NPC dot
                        ctx.fillStyle = '#27AE60';
                        ctx.beginPath();
                        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                  }
            }

            // — Draw Monster dots (red) —
            if (monsters) {
                  for (const mon of monsters) {
                        const dx = (mon.x - playerX) * scale;
                        const dz = (mon.z - playerZ) * scale;
                        const sx = cx + dx;
                        const sy = cy - dz; // negate: canvas Y↓ but world Z↑ = forward

                        if (sx < 2 || sx > w - 2 || sy < 2 || sy > mapH - 2) continue;

                        if (mon.isBoss) {
                              // Boss — larger pulsing dot
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

                              // Boss ring
                              ctx.strokeStyle = `rgba(255,215,0,${0.4 + bossPulse * 0.4})`;
                              ctx.lineWidth = 0.8;
                              ctx.beginPath();
                              ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                              ctx.stroke();
                        } else {
                              // Normal monster — small red dot
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

            // — Draw Player dot (gold, always centered) —
            const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 7);
            pg.addColorStop(0, 'rgba(232,201,106,0.8)');
            pg.addColorStop(1, 'rgba(232,201,106,0)');
            ctx.fillStyle = pg;
            ctx.fillRect(cx - 7, cy - 7, 14, 14);

            ctx.fillStyle = '#E8C96A';
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();

            // Player direction indicator (small triangle) — subtle
            ctx.fillStyle = 'rgba(232,201,106,0.5)';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 5);
            ctx.lineTo(cx - 2.5, cy - 2);
            ctx.lineTo(cx + 2.5, cy - 2);
            ctx.closePath();
            ctx.fill();

            // — Legend bar at bottom —
            this._drawLegend(mapH);
      }

      private _drawLegend(startY: number): void {
            const ctx = this._ctx;
            const w = this.CANVAS_W;

            // Legend background
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
            // Player
            ctx.fillStyle = '#E8C96A';
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(200,195,185,0.5)';
            ctx.fillText('你', x + 5, y);
            x += 22;

            // Monster
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(200,195,185,0.5)';
            ctx.fillText('怪', x + 5, y);
            x += 22;

            // Boss
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,215,0,0.6)';
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(200,195,185,0.5)';
            ctx.fillText('首', x + 7, y);
            x += 24;

            // NPC
            ctx.fillStyle = '#27AE60';
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(200,195,185,0.5)';
            ctx.fillText('NPC', x + 5, y);
      }

      setZoneName(name: string): void {
            this._zoneName.textContent = `《 ${name} 》`;
      }

      get collapsed(): boolean { return this._collapsed; }

      dispose(): void { this._el.remove(); }
}
