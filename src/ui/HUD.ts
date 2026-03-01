import type { PlayerStats } from '../entities/Player';
import type { PetManager } from '../pets/PetManager';
import { SERIES_COLORS } from '../pets/PetData';

/**
 * HUD — Premium Dark Theme
 * - Top-right: 4 floating circles, HP=red arc left, MP=blue arc right
 * - Bottom: dark glass nav bar with emoji icons
 */
export class HUD {
      private _topRight: HTMLDivElement;
      private _navBar: HTMLDivElement;
      private _portraits: HTMLDivElement[] = [];
      private _collapsed = false;
      private _toggleBtn: HTMLDivElement;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            // ── PORTRAITS: floating, no bg ──
            this._topRight = document.createElement('div');
            this._topRight.id = 'hudPortraits';
            this._topRight.className = 'interactive';
            Object.assign(this._topRight.style, {
                  position: 'fixed', right: '70px', top: '6px', zIndex: '160',
                  display: 'flex', gap: '4px',
            });

            this._toggleBtn = document.createElement('div');
            this._toggleBtn.style.cssText = 'position:absolute;left:-14px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:10px;color:rgba(255,255,255,0.4)';
            this._toggleBtn.textContent = '◀';
            this._toggleBtn.addEventListener('click', () => this._togglePortraits());
            this._topRight.appendChild(this._toggleBtn);

            const labels = ['P', 'Pet1', 'Pet2', 'Pet3'];
            const colors = ['#CC4444', '#8B6B3D', '#8B6B3D', '#8B6B3D'];
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
                  background: 'linear-gradient(180deg, rgba(25,20,35,0.92), rgba(15,12,22,0.95))',
                  borderRadius: '6px', border: '1px solid rgba(160,130,80,0.35)',
                  boxShadow: '0 -2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
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

      private _createPortrait(label: string, borderColor: string): HTMLDivElement {
            const wrapper = document.createElement('div');
            wrapper.className = 'hud-portrait';

            const size = 58;
            const r = 25;
            const cx = size / 2;
            const cy = size / 2;

            // Inner circle
            const inner = document.createElement('div');
            inner.className = 'hud-portrait-inner';
            inner.innerHTML = `<span style="font-size:10px;color:#ddd;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.8)">${label}</span>`;

            // SVG for HP (red, left half) + MP (blue, right half)
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', `${size}`);
            svg.setAttribute('height', `${size}`);
            svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
            svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none';

            // HP: left arc (180→360 = bottom-left to top-left)
            const hpBg = this._arc(cx, cy, r, 180, 360, 'rgba(255,255,255,0.08)', 5);
            const hpFill = this._arc(cx, cy, r, 180, 360, '#E74C3C', 5);
            hpFill.classList.add('hp-arc');

            // MP: right arc (0→180 = top-right to bottom-right)
            const mpBg = this._arc(cx, cy, r, 0, 180, 'rgba(255,255,255,0.08)', 5);
            const mpFill = this._arc(cx, cy, r, 0, 180, '#3498DB', 5);
            mpFill.classList.add('mp-arc');

            svg.appendChild(hpBg);
            svg.appendChild(hpFill);
            svg.appendChild(mpBg);
            svg.appendChild(mpFill);

            wrapper.appendChild(svg);
            wrapper.appendChild(inner);
            return wrapper;
      }

      private _arc(cx: number, cy: number, r: number, s: number, e: number, color: string, w: number): SVGPathElement {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const sr = (s - 90) * Math.PI / 180;
            const er = (e - 90) * Math.PI / 180;
            const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr);
            const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er);
            const la = e - s > 180 ? 1 : 0;
            p.setAttribute('d', `M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`);
            p.setAttribute('fill', 'none');
            p.setAttribute('stroke', color);
            p.setAttribute('stroke-width', `${w}`);
            p.setAttribute('stroke-linecap', 'round');
            return p;
      }

      private _setArc(el: HTMLDivElement, cls: string, pct: number, s: number, e: number): void {
            const arc = el.querySelector(`.${cls}`) as SVGPathElement | null;
            if (!arc) return;
            const total = Math.PI * 25 * (e - s) / 180;
            const fill = total * Math.max(0, Math.min(1, pct));
            arc.setAttribute('stroke-dasharray', `${fill} ${total}`);
      }

      updateStats(stats: PlayerStats): void {
            const p = this._portraits[0];
            if (!p) return;
            this._setArc(p, 'hp-arc', stats.hp / stats.maxHp, 180, 360);
            this._setArc(p, 'mp-arc', stats.mp / stats.maxMp, 0, 180);
      }

      updatePets(petManager: PetManager): void {
            for (let i = 0; i < 3; i++) {
                  const w = this._portraits[i + 1];
                  if (!w) continue;
                  const pet = petManager.active[i];
                  const inner = w.querySelector('.hud-portrait-inner') as HTMLDivElement;
                  if (pet) {
                        const c = SERIES_COLORS[pet.def.series];
                        inner.innerHTML = `<span style="font-size:9px;color:#ddd;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.8)">${pet.def.name.substring(0, 3)}</span>`;
                        this._setArc(w, 'hp-arc', pet.stats.hp / pet.stats.maxHp, 180, 360);
                        this._setArc(w, 'mp-arc', pet.stats.mp / pet.stats.maxMp, 0, 180);
                  } else {
                        inner.innerHTML = '<span style="font-size:10px;color:#555">—</span>';
                        this._setArc(w, 'hp-arc', 0, 180, 360);
                        this._setArc(w, 'mp-arc', 0, 0, 180);
                  }
            }
      }

      getNavButton(id: string): HTMLElement | null { return document.getElementById(id); }

      private _togglePortraits(): void {
            this._collapsed = !this._collapsed;
            this._portraits.forEach(p => p.style.display = this._collapsed ? 'none' : '');
            this._toggleBtn.textContent = this._collapsed ? '▶' : '◀';
      }

      dispose(): void { this._topRight.remove(); this._navBar.remove(); }
}
