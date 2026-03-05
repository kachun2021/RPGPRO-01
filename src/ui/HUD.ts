import type { PlayerStats } from '../entities/Player';
import type { PetManager } from '../pets/PetManager';

/**
 * HUD
 * - Top-right portraits (player + 3 pets)
 * - Bottom nav bar
 */
export class HUD {
      private _topRight: HTMLDivElement;
      private _navBar: HTMLDivElement;
      private _portraits: HTMLDivElement[] = [];
      private _collapsed = false;
      private _toggleBtn: HTMLDivElement;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            this._topRight = document.createElement('div');
            this._topRight.id = 'hudPortraits';
            this._topRight.className = 'interactive hud-top-right';

            const labels = ['P', 'Pet1', 'Pet2', 'Pet3'];
            for (let i = 0; i < 4; i++) {
                  const p = this._createPortrait(labels[i]);
                  this._portraits.push(p);
                  this._topRight.appendChild(p);
            }

            this._toggleBtn = document.createElement('div');
            this._toggleBtn.className = 'hud-portrait-toggle';
            this._toggleBtn.textContent = '▼';
            this._toggleBtn.addEventListener('mouseenter', () => this._toggleBtn.classList.add('is-hover'));
            this._toggleBtn.addEventListener('mouseleave', () => this._toggleBtn.classList.remove('is-hover'));
            this._toggleBtn.addEventListener('click', () => this._togglePortraits());
            this._topRight.appendChild(this._toggleBtn);
            uiLayer.appendChild(this._topRight);

            this._navBar = document.createElement('div');
            this._navBar.id = 'hudNav';
            this._navBar.className = 'interactive hud-nav';

            const navItems = [
                  { id: 'nav-book', label: 'BOOK', icon: '📉' },
                  { id: 'nav-shop', label: '商店', icon: '🛍️' },
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
                  btn.innerHTML = `
                        <span class="hud-nav-icon">${item.icon}</span>
                        <span class="hud-nav-label">${item.label}</span>
                  `;
                  btn.addEventListener('pointerdown', () => {
                        btn.classList.add('is-pressed');
                        setTimeout(() => btn.classList.remove('is-pressed'), 120);
                  });
                  this._navBar.appendChild(btn);
            }

            uiLayer.appendChild(this._navBar);
      }

      private _createPortrait(label: string): HTMLDivElement {
            const wrapper = document.createElement('div');
            wrapper.className = 'hud-portrait interactive';

            const expBar = document.createElement('div');
            expBar.className = 'hud-exp-track';
            const expFill = document.createElement('div');
            expFill.className = 'hud-exp-fill';
            expBar.appendChild(expFill);
            wrapper.appendChild(expBar);

            const size = 50;
            const r = 22;
            const cx = size / 2;
            const cy = size / 2;
            const sw = 4;

            const circleBox = document.createElement('div');
            circleBox.className = 'hud-portrait-circle';

            const inner = document.createElement('div');
            inner.className = 'hud-portrait-inner';
            inner.innerHTML = `<span class="hud-portrait-text">${label}</span>`;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', `${size}`);
            svg.setAttribute('height', `${size}`);
            svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
            svg.classList.add('hud-ring-svg');

            const hpBg = this._arc(cx, cy, r, 180, 360, 'rgba(255,255,255,0.1)', sw);
            const hpFill = this._arc(cx, cy, r, 180, 360, '#E74C3C', sw);
            hpFill.classList.add('hp-arc');

            const mpBg = this._arc(cx, cy, r, 0, 180, 'rgba(255,255,255,0.1)', sw);
            const mpFill = this._arc(cx, cy, r, 0, 180, '#3498DB', sw);
            mpFill.classList.add('mp-arc');

            svg.appendChild(hpBg);
            svg.appendChild(hpFill);
            svg.appendChild(mpBg);
            svg.appendChild(mpFill);

            circleBox.appendChild(svg);
            circleBox.appendChild(inner);
            wrapper.appendChild(circleBox);
            return wrapper;
      }

      private _arc(cx: number, cy: number, r: number, s: number, e: number, color: string, w: number): SVGPathElement {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const sr = (s - 90) * Math.PI / 180;
            const er = (e - 90) * Math.PI / 180;
            const x1 = cx + r * Math.cos(sr);
            const y1 = cy + r * Math.sin(sr);
            const x2 = cx + r * Math.cos(er);
            const y2 = cy + r * Math.sin(er);
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
            const total = (Math.PI * 22 * (e - s)) / 180;
            const fill = total * Math.max(0, Math.min(1, pct));
            arc.setAttribute('stroke-dasharray', `${fill} ${total}`);
      }

      updateStats(stats: PlayerStats): void {
            const p = this._portraits[0];
            if (!p) return;
            this._setArc(p, 'hp-arc', stats.hp / stats.maxHp, 180, 360);
            this._setArc(p, 'mp-arc', stats.mp / stats.maxMp, 0, 180);
            const expNeeded = stats.level * 100;
            const expPct = expNeeded > 0 ? Math.min(1, stats.exp / expNeeded) : 0;
            const expFill = p.querySelector('.hud-exp-fill') as HTMLDivElement | null;
            if (expFill) expFill.style.width = `${expPct * 100}%`;
      }

      updatePets(petManager: PetManager): void {
            for (let i = 0; i < 3; i++) {
                  const w = this._portraits[i + 1];
                  if (!w) continue;
                  const pet = petManager.active[i];
                  const inner = w.querySelector('.hud-portrait-inner') as HTMLDivElement;
                  const expFill = w.querySelector('.hud-exp-fill') as HTMLDivElement | null;
                  if (pet) {
                        inner.innerHTML = `<span class="hud-portrait-text is-pet">${pet.def.name.substring(0, 3)}</span>`;
                        this._setArc(w, 'hp-arc', pet.stats.hp / pet.stats.maxHp, 180, 360);
                        this._setArc(w, 'mp-arc', pet.stats.mp / pet.stats.maxMp, 0, 180);
                        const petExpNeeded = pet.stats.level * 80;
                        const petExpPct = petExpNeeded > 0 ? Math.min(1, (pet.stats.exp ?? 0) / petExpNeeded) : 0;
                        if (expFill) expFill.style.width = `${petExpPct * 100}%`;
                  } else {
                        inner.innerHTML = '<span class="hud-portrait-text is-empty">—</span>';
                        this._setArc(w, 'hp-arc', 0, 180, 360);
                        this._setArc(w, 'mp-arc', 0, 0, 180);
                        if (expFill) expFill.style.width = '0%';
                  }
            }
      }

      getNavButton(id: string): HTMLElement | null {
            return document.getElementById(id);
      }

      getPortrait(index: number): HTMLElement | undefined {
            return this._portraits[index];
      }

      private _togglePortraits(): void {
            this._collapsed = !this._collapsed;
            this._portraits.forEach((p) => {
                  p.style.display = this._collapsed ? 'none' : '';
            });
            this._toggleBtn.textContent = this._collapsed ? '▲' : '▼';
      }

      dispose(): void {
            this._topRight.remove();
            this._navBar.remove();
      }
}

