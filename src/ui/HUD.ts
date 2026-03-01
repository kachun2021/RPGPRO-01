import type { PlayerStats } from '../entities/Player';
import type { PetManager } from '../pets/PetManager';
import { SERIES_COLORS } from '../pets/PetData';

/**
 * Stone Age HUD — Premium Style
 * - Top-right: 4 floating portrait circles with SVG arc HP/MP
 * - Bottom: 10 icon+label nav buttons
 */
export class HUD {
      private _topRight: HTMLDivElement;
      private _navBar: HTMLDivElement;
      private _portraits: HTMLDivElement[] = [];
      private _collapsed = false;
      private _toggleBtn: HTMLDivElement;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            // ── PORTRAITS: no background, floating circles ──
            this._topRight = document.createElement('div');
            this._topRight.id = 'hudPortraits';
            this._topRight.className = 'interactive';
            Object.assign(this._topRight.style, {
                  position: 'fixed', right: '70px', top: '8px', zIndex: '160',
                  display: 'flex', gap: '8px', padding: '4px',
            });

            // Toggle
            this._toggleBtn = document.createElement('div');
            this._toggleBtn.style.cssText = 'position:absolute;left:-16px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:10px;color:rgba(255,255,255,0.5)';
            this._toggleBtn.textContent = '◀';
            this._toggleBtn.addEventListener('click', () => this._togglePortraits());
            this._topRight.appendChild(this._toggleBtn);

            // Player + 3 pets
            const labels = ['P', 'Pet1', 'Pet2', 'Pet3'];
            const colors = ['#E06060', '#E8C96A', '#E8C96A', '#E8C96A'];
            for (let i = 0; i < 4; i++) {
                  const p = this._createPortrait(labels[i], colors[i]);
                  this._portraits.push(p);
                  this._topRight.appendChild(p);
            }
            uiLayer.appendChild(this._topRight);

            // ── BOTTOM NAV ──
            this._navBar = document.createElement('div');
            this._navBar.id = 'hudNav';
            this._navBar.className = 'interactive';
            Object.assign(this._navBar.style, {
                  position: 'fixed', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
                  zIndex: '160', display: 'flex', gap: '0',
                  background: 'linear-gradient(180deg, rgba(40,28,18,0.92), rgba(28,18,10,0.95))',
                  borderRadius: '6px', border: '1px solid rgba(196,153,61,0.4)',
                  boxShadow: '0 -2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                  overflow: 'hidden',
            });

            const navItems = [
                  { id: 'nav-book', label: 'BOOK', icon: '📖' },
                  { id: 'nav-shop', label: '商店', icon: '🏪' },
                  { id: 'nav-char', label: '角色', icon: '🧑' },
                  { id: 'nav-pet', label: '寵物', icon: '🐾' },
                  { id: 'nav-bag', label: '物品', icon: '🎒' },
                  { id: 'nav-skill', label: '技能', icon: '⚡' },
                  { id: 'nav-community', label: '社區', icon: '👥' },
                  { id: 'nav-quest', label: '任務', icon: '📜' },
                  { id: 'nav-map', label: '地圖', icon: '🗺️' },
                  { id: 'nav-settings', label: '系統', icon: '⚙️' },
            ];
            for (const item of navItems) {
                  const btn = document.createElement('div');
                  btn.className = 'sa-nav-btn interactive';
                  btn.id = item.id;
                  btn.innerHTML = `<span style="font-size:15px;line-height:1">${item.icon}</span><span style="font-size:9px;opacity:0.8">${item.label}</span>`;
                  btn.addEventListener('pointerdown', () => {
                        btn.style.background = 'rgba(196,153,61,0.25)';
                        setTimeout(() => btn.style.background = '', 120);
                  });
                  this._navBar.appendChild(btn);
            }
            uiLayer.appendChild(this._navBar);
      }

      /** Create a portrait with SVG arc HP/MP around the circle */
      private _createPortrait(label: string, borderColor: string): HTMLDivElement {
            const wrapper = document.createElement('div');
            wrapper.className = 'hud-portrait';

            // SVG ring for HP (left arc) + MP (right arc)
            const size = 64;
            const r = 28;
            const cx = size / 2;
            const cy = size / 2;
            const strokeW = 4;

            // Inner circle (character)
            const inner = document.createElement('div');
            inner.className = 'hud-portrait-inner';
            inner.style.borderColor = borderColor;
            inner.innerHTML = `<span style="font-size:10px;color:#ddd;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.7)">${label}</span>`;

            // SVG overlay for HP/MP arcs
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', `${size}`);
            svg.setAttribute('height', `${size}`);
            svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
            svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none';

            // HP arc (left half, from bottom to top = 180° ccw)
            const hpBg = this._createArc(cx, cy, r, 180, 360, '#333', strokeW);
            const hpFill = this._createArc(cx, cy, r, 180, 360, '#FFD700', strokeW);
            hpFill.classList.add('hp-arc');

            // MP arc (right half, from top to bottom = 0° to 180°)
            const mpBg = this._createArc(cx, cy, r, 0, 180, '#333', strokeW);
            const mpFill = this._createArc(cx, cy, r, 0, 180, '#E06060', strokeW);
            mpFill.classList.add('mp-arc');

            svg.appendChild(hpBg);
            svg.appendChild(hpFill);
            svg.appendChild(mpBg);
            svg.appendChild(mpFill);

            wrapper.appendChild(svg);
            wrapper.appendChild(inner);
            return wrapper;
      }

      /** Create an SVG arc path element */
      private _createArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, color: string, strokeWidth: number): SVGPathElement {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = this._describeArc(cx, cy, r, startAngle, endAngle);
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', `${strokeWidth}`);
            path.setAttribute('stroke-linecap', 'round');
            return path;
      }

      /** SVG arc path descriptor */
      private _describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
      }

      /** Update HP/MP arcs by adjusting stroke-dasharray */
      private _updateArc(portrait: HTMLDivElement, selector: string, pct: number, startAngle: number, endAngle: number): void {
            const arc = portrait.querySelector(`.${selector}`) as SVGPathElement | null;
            if (!arc) return;
            const r = 28;
            const totalLen = Math.PI * r * (endAngle - startAngle) / 180;
            const fillLen = totalLen * Math.max(0, Math.min(1, pct));
            arc.setAttribute('stroke-dasharray', `${fillLen} ${totalLen}`);
      }

      updateStats(stats: PlayerStats): void {
            const p = this._portraits[0];
            if (!p) return;
            this._updateArc(p, 'hp-arc', stats.hp / stats.maxHp, 180, 360);
            this._updateArc(p, 'mp-arc', stats.mp / stats.maxMp, 0, 180);
      }

      updatePets(petManager: PetManager): void {
            for (let i = 0; i < 3; i++) {
                  const wrapper = this._portraits[i + 1];
                  if (!wrapper) continue;
                  const pet = petManager.active[i];
                  const inner = wrapper.querySelector('.hud-portrait-inner') as HTMLDivElement;

                  if (pet) {
                        const c = SERIES_COLORS[pet.def.series];
                        const css = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
                        inner.style.borderColor = css;
                        inner.innerHTML = `<span style="font-size:9px;color:#ddd;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.7)">${pet.def.name.substring(0, 3)}</span>`;
                        this._updateArc(wrapper, 'hp-arc', pet.stats.hp / pet.stats.maxHp, 180, 360);
                        this._updateArc(wrapper, 'mp-arc', pet.stats.mp / pet.stats.maxMp, 0, 180);
                  } else {
                        inner.style.borderColor = '#555';
                        inner.innerHTML = '<span style="font-size:10px;color:#555">—</span>';
                        this._updateArc(wrapper, 'hp-arc', 0, 180, 360);
                        this._updateArc(wrapper, 'mp-arc', 0, 0, 180);
                  }
            }
      }

      getNavButton(id: string): HTMLElement | null {
            return document.getElementById(id);
      }

      private _togglePortraits(): void {
            this._collapsed = !this._collapsed;
            this._portraits.forEach(p => p.style.display = this._collapsed ? 'none' : '');
            this._toggleBtn.textContent = this._collapsed ? '▶' : '◀';
      }

      dispose(): void { this._topRight.remove(); this._navBar.remove(); }
}
