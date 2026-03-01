import type { PlayerStats } from '../entities/Player';
import type { PetManager } from '../pets/PetManager';
import { SERIES_COLORS } from '../pets/PetData';

export class HUD {
      private _topRight: HTMLDivElement;
      private _navBar: HTMLDivElement;
      private _portraits: HTMLDivElement[] = [];
      private _collapsed = false;
      private _toggleBtn: HTMLDivElement;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            // ── RIGHT TOP: 4 Portrait Circles ──
            this._topRight = document.createElement('div');
            this._topRight.id = 'hudPortraits';
            this._topRight.className = 'sa-frame sa-collapsible interactive';
            Object.assign(this._topRight.style, {
                  position: 'fixed', right: '70px', top: '8px', zIndex: '160',
                  display: 'flex', gap: '6px', padding: '6px 10px',
            });

            // Toggle
            this._toggleBtn = document.createElement('div');
            this._toggleBtn.className = 'sa-toggle-btn-mini';
            this._toggleBtn.textContent = '◀';
            this._toggleBtn.style.cssText = 'position:absolute;left:-18px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:10px;color:#8B7355';
            this._toggleBtn.addEventListener('click', () => this._togglePortraits());
            this._topRight.appendChild(this._toggleBtn);

            // Create 4 portrait slots (index 0=player, 1-3=pets)
            const labels = ['Player', 'Pet 1', 'Pet 2', 'Pet 3'];
            const borderColors = ['#CC3333', '#E8C96A', '#E8C96A', '#E8C96A'];
            for (let i = 0; i < 4; i++) {
                  const portrait = this._createPortrait(labels[i], borderColors[i]);
                  this._portraits.push(portrait);
                  this._topRight.appendChild(portrait);
            }
            uiLayer.appendChild(this._topRight);

            // ── BOTTOM: 10 Nav Buttons ──
            this._navBar = document.createElement('div');
            this._navBar.id = 'hudNav';
            this._navBar.className = 'sa-frame interactive';
            Object.assign(this._navBar.style, {
                  position: 'fixed', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
                  zIndex: '160', display: 'flex', gap: '0',
            });

            const navItems = [
                  { id: 'nav-book', label: 'BOOK' },
                  { id: 'nav-shop', label: '商店' },
                  { id: 'nav-char', label: '角色' },
                  { id: 'nav-pet', label: '寵物' },
                  { id: 'nav-bag', label: '物品' },
                  { id: 'nav-skill', label: '技能' },
                  { id: 'nav-community', label: '社區' },
                  { id: 'nav-quest', label: '任務' },
                  { id: 'nav-map', label: '地圖' },
                  { id: 'nav-settings', label: '系統' },
            ];
            for (const item of navItems) {
                  const btn = document.createElement('div');
                  btn.className = 'sa-nav-btn';
                  btn.id = item.id;
                  btn.textContent = item.label;
                  btn.addEventListener('pointerdown', () => {
                        btn.style.background = '#6B4E2A';
                        setTimeout(() => btn.style.background = '', 120);
                  });
                  this._navBar.appendChild(btn);
            }
            uiLayer.appendChild(this._navBar);
      }

      private _createPortrait(label: string, borderColor: string): HTMLDivElement {
            const wrapper = document.createElement('div');
            wrapper.className = 'sa-portrait-wrapper';

            // Circle
            const circle = document.createElement('div');
            circle.className = 'sa-portrait';
            circle.style.borderColor = borderColor;
            circle.innerHTML = `<span style="font-size:10px;color:#5C3D1A">${label.charAt(0)}</span>`;
            wrapper.appendChild(circle);

            // HP bar
            const hpBar = document.createElement('div');
            hpBar.className = 'sa-bar sa-bar-hp';
            hpBar.innerHTML = '<div class="sa-bar-fill sa-bar-hp-fill" style="width:100%"></div>';
            wrapper.appendChild(hpBar);

            // MP bar
            const mpBar = document.createElement('div');
            mpBar.className = 'sa-bar sa-bar-mp';
            mpBar.innerHTML = '<div class="sa-bar-fill sa-bar-mp-fill" style="width:100%"></div>';
            wrapper.appendChild(mpBar);

            return wrapper;
      }

      /** Update player portrait (index 0) */
      updateStats(stats: PlayerStats): void {
            const p = this._portraits[0];
            if (!p) return;
            const hpFill = p.querySelector('.sa-bar-hp-fill') as HTMLDivElement;
            const mpFill = p.querySelector('.sa-bar-mp-fill') as HTMLDivElement;
            if (hpFill) hpFill.style.width = `${(stats.hp / stats.maxHp) * 100}%`;
            if (mpFill) mpFill.style.width = `${(stats.mp / stats.maxMp) * 100}%`;
      }

      /** Update pet portraits (index 1-3) */
      updatePets(petManager: PetManager): void {
            for (let i = 0; i < 3; i++) {
                  const p = this._portraits[i + 1];
                  if (!p) continue;
                  const pet = petManager.active[i];
                  const circle = p.querySelector('.sa-portrait') as HTMLDivElement;
                  const hpFill = p.querySelector('.sa-bar-hp-fill') as HTMLDivElement;
                  const mpFill = p.querySelector('.sa-bar-mp-fill') as HTMLDivElement;

                  if (pet) {
                        const color = SERIES_COLORS[pet.def.series];
                        const cssColor = `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;
                        circle.style.borderColor = cssColor;
                        circle.innerHTML = `<span style="font-size:9px;color:#5C3D1A">${pet.def.name.substring(0, 3)}</span>`;
                        if (hpFill) hpFill.style.width = `${(pet.stats.hp / pet.stats.maxHp) * 100}%`;
                        if (mpFill) mpFill.style.width = `${(pet.stats.mp / pet.stats.maxMp) * 100}%`;
                  } else {
                        circle.style.borderColor = '#999';
                        circle.innerHTML = '<span style="font-size:10px;color:#999">—</span>';
                        if (hpFill) hpFill.style.width = '0%';
                        if (mpFill) mpFill.style.width = '0%';
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

      dispose(): void {
            this._topRight.remove();
            this._navBar.remove();
      }
}
