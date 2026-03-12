import type { PlayerStats } from '../entities/Player';
import { formatStarterPetSummary, type PlayerIdentitySnapshot } from '../core/PlayerIdentity';
import type { PetManager } from '../pets/PetManager';
import { renderUiIcon, type UiIconId } from './UiIconCatalog';
import { HUD_NAV_ITEMS, type HudNavDefinition } from './PanelManifest';

interface HudNavItem {
      panelId: string;
      id: string;
      label: string;
      icon: UiIconId;
      primary: boolean;
}

const NAV_ITEMS: HudNavItem[] = HUD_NAV_ITEMS.map((item: HudNavDefinition) => ({
      panelId: item.panelId,
      id: item.navId,
      label: item.label,
      icon: item.icon,
      primary: item.primary,
}));

/**
 * HUD
 * - Top-left profile card
 * - Top-right party rail
 * - Bottom quick dock + expandable menu hub
 * - Transient focus banner for current objective
 */
export class HUD {
      private _identityBar: HTMLDivElement;
      private _identityName: HTMLDivElement;
      private _identityMeta: HTMLDivElement;
      private _identityObjective: HTMLDivElement;
      private _focusBanner: HTMLDivElement;
      private _focusBannerTitle: HTMLDivElement;
      private _focusBannerText: HTMLDivElement;
      private _topRight: HTMLDivElement;
      private _navBar: HTMLDivElement;
      private _quickDock: HTMLDivElement;
      private _menuPanel: HTMLDivElement;
      private _navButtons = new Map<string, HTMLButtonElement>();
      private _navButtonsById = new Map<string, HTMLButtonElement>();
      private _portraits: HTMLDivElement[] = [];
      private _petLabelCache: (string | null)[] = [null, null, null];
      private _collapsed = false;
      private _menuExpanded = false;
      private _toggleBtn: HTMLDivElement;
      private _menuToggleBtn: HTMLButtonElement;
      private _identity: PlayerIdentitySnapshot | null = null;
      private _zoneName = '新手草原';
      private _primaryPetName = '未設定';
      private _objectiveHint = '先找村長接主線';
      private _bannerTimer = 0;
      private readonly _handleDocPointerDown = (event: PointerEvent): void => {
            if (!this._menuExpanded) return;
            const target = event.target as HTMLElement | null;
            if (target?.closest('.hud-nav')) return;
            this._setMenuExpanded(false);
      };

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            this._identityBar = document.createElement('div');
            this._identityBar.id = 'hudIdentity';
            this._identityBar.className = 'hud-identity';
            this._identityBar.dataset.chromeGroup = 'identity';
            this._identityBar.innerHTML = `
                  <div class="hud-identity-kicker">冒險手冊</div>
            `;
            this._identityName = document.createElement('div');
            this._identityName.className = 'hud-identity-name';
            this._identityMeta = document.createElement('div');
            this._identityMeta.className = 'hud-identity-meta';
            this._identityObjective = document.createElement('div');
            this._identityObjective.className = 'hud-identity-objective';
            this._identityBar.appendChild(this._identityName);
            this._identityBar.appendChild(this._identityMeta);
            this._identityBar.appendChild(this._identityObjective);
            uiLayer.appendChild(this._identityBar);

            this._focusBanner = document.createElement('div');
            this._focusBanner.className = 'hud-focus-banner';
            this._focusBanner.dataset.chromeGroup = 'guidance';
            this._focusBanner.innerHTML = '<div class="hud-focus-banner-kicker">目前目標</div>';
            this._focusBannerTitle = document.createElement('div');
            this._focusBannerTitle.className = 'hud-focus-banner-title';
            this._focusBannerText = document.createElement('div');
            this._focusBannerText.className = 'hud-focus-banner-text';
            this._focusBanner.appendChild(this._focusBannerTitle);
            this._focusBanner.appendChild(this._focusBannerText);
            uiLayer.appendChild(this._focusBanner);

            this._topRight = document.createElement('div');
            this._topRight.id = 'hudPortraits';
            this._topRight.className = 'interactive hud-top-right';
            this._topRight.dataset.chromeGroup = 'combat';

            const labels = ['P', 'Pet1', 'Pet2', 'Pet3'];
            for (let i = 0; i < 4; i++) {
                  const p = this._createPortrait(labels[i]);
                  this._portraits.push(p);
                  this._topRight.appendChild(p);
            }

            this._toggleBtn = document.createElement('div');
            this._toggleBtn.className = 'hud-portrait-toggle';
            this._toggleBtn.textContent = '收';
            this._toggleBtn.addEventListener('mouseenter', () => this._toggleBtn.classList.add('is-hover'));
            this._toggleBtn.addEventListener('mouseleave', () => this._toggleBtn.classList.remove('is-hover'));
            this._toggleBtn.addEventListener('click', () => this._togglePortraits());
            this._topRight.appendChild(this._toggleBtn);
            uiLayer.appendChild(this._topRight);

            this._navBar = document.createElement('div');
            this._navBar.id = 'hudNav';
            this._navBar.className = 'interactive hud-nav';
            this._navBar.dataset.chromeGroup = 'navigation';

            this._menuPanel = document.createElement('div');
            this._menuPanel.className = 'hud-menu-panel';
            this._quickDock = document.createElement('div');
            this._quickDock.className = 'hud-quick-dock';

            for (const item of NAV_ITEMS.filter((entry) => entry.primary)) {
                  this._quickDock.appendChild(this._createNavButton(item));
            }

            this._menuToggleBtn = document.createElement('button');
            this._menuToggleBtn.type = 'button';
            this._menuToggleBtn.id = 'nav-menu';
            this._menuToggleBtn.className = 'sa-nav-btn hud-menu-toggle interactive';
            this._menuToggleBtn.innerHTML = `
                  ${renderUiIcon('menu', 'hud-nav-icon')}
                  <span class="hud-nav-label">選單</span>
            `;
            this._menuToggleBtn.addEventListener('click', () => this._setMenuExpanded(!this._menuExpanded));
            this._quickDock.appendChild(this._menuToggleBtn);

            for (const item of NAV_ITEMS.filter((entry) => !entry.primary)) {
                  this._menuPanel.appendChild(this._createNavButton(item, true));
            }

            this._navBar.appendChild(this._menuPanel);
            this._navBar.appendChild(this._quickDock);
            uiLayer.appendChild(this._navBar);

            document.addEventListener('pointerdown', this._handleDocPointerDown);
            this._renderIdentity();
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
            const hpFill = this._arc(cx, cy, r, 180, 360, '#d86f5d', sw);
            hpFill.classList.add('hp-arc');

            const mpBg = this._arc(cx, cy, r, 0, 180, 'rgba(255,255,255,0.1)', sw);
            const mpFill = this._arc(cx, cy, r, 0, 180, '#7ea4cc', sw);
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

      private _createNavButton(item: HudNavItem, isMenuItem = false): HTMLButtonElement {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `sa-nav-btn interactive${isMenuItem ? ' is-menu-item' : ''}`;
            btn.id = item.id;
            btn.dataset.panelId = item.panelId;
            btn.dataset.navRole = item.primary ? 'primary' : 'secondary';
            btn.innerHTML = `
                  ${renderUiIcon(item.icon, 'hud-nav-icon')}
                  <span class="hud-nav-label">${item.label}</span>
            `;
            this._navButtons.set(item.panelId, btn);
            this._navButtonsById.set(item.id, btn);
            btn.addEventListener('pointerdown', () => {
                  btn.classList.add('is-pressed');
                  setTimeout(() => btn.classList.remove('is-pressed'), 150);
            });
            btn.addEventListener('click', () => {
                  if (!item.primary) this._setMenuExpanded(false);
            });
            return btn;
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

      private _setMenuExpanded(expanded: boolean): void {
            this._menuExpanded = expanded;
            this._navBar.classList.toggle('is-menu-open', expanded);
            this._menuToggleBtn.classList.toggle('is-active', expanded);
            this._menuToggleBtn.querySelector('.hud-nav-label')!.textContent = expanded ? '收合' : '選單';
      }

      private _setFocusBannerCopy(title: string, text: string): void {
            this._focusBannerTitle.textContent = title;
            this._focusBannerText.textContent = text;
      }

      private _showFocusBanner(title?: string, text?: string): void {
            if (title !== undefined || text !== undefined) {
                  this._setFocusBannerCopy(
                        title ?? this._focusBannerTitle.textContent ?? '',
                        text ?? this._focusBannerText.textContent ?? '',
                  );
            }
            this._focusBanner.classList.add('is-visible');
            if (this._bannerTimer) window.clearTimeout(this._bannerTimer);
            this._bannerTimer = window.setTimeout(() => {
                  this._focusBanner.classList.remove('is-visible');
                  this._bannerTimer = 0;
            }, 2200);
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
                        const petLabel = pet.def.name.substring(0, 3);
                        if (this._petLabelCache[i] !== petLabel) {
                              inner.innerHTML = `<span class="hud-portrait-text is-pet">${petLabel}</span>`;
                              this._petLabelCache[i] = petLabel;
                        }
                        this._setArc(w, 'hp-arc', pet.stats.hp / pet.stats.maxHp, 180, 360);
                        this._setArc(w, 'mp-arc', pet.stats.mp / pet.stats.maxMp, 0, 180);
                        const petExpNeeded = pet.stats.level * 80;
                        const petExpPct = petExpNeeded > 0 ? Math.min(1, (pet.stats.exp ?? 0) / petExpNeeded) : 0;
                        if (expFill) expFill.style.width = `${petExpPct * 100}%`;
                  } else {
                        if (this._petLabelCache[i] !== null) {
                              inner.innerHTML = '<span class="hud-portrait-text is-empty">—</span>';
                              this._petLabelCache[i] = null;
                        }
                        this._setArc(w, 'hp-arc', 0, 180, 360);
                        this._setArc(w, 'mp-arc', 0, 0, 180);
                        if (expFill) expFill.style.width = '0%';
                  }
            }
            const primaryPet = petManager.active[0]?.displayName ?? petManager.active[0]?.def.name ?? petManager.owned[0]?.displayName ?? '未設定';
            this.setPrimaryPet(primaryPet);
      }

      setPlayerIdentity(identity: PlayerIdentitySnapshot): void {
            this._identity = identity;
            this._primaryPetName = identity.starterPetNames[0] ?? this._primaryPetName;
            this._objectiveHint = identity.growthGoal;
            this._renderIdentity();
      }

      setZoneName(zoneName: string): void {
            const nextZone = zoneName || this._zoneName;
            const changed = nextZone !== this._zoneName;
            this._zoneName = nextZone;
            this._renderIdentity();
            if (changed) this._showFocusBanner();
      }

      setPrimaryPet(name: string | null): void {
            this._primaryPetName = (name ?? '').trim() || '未設定';
            this._renderIdentity();
      }

      setObjectiveHint(text: string | null): void {
            const nextHint = (text ?? '').trim() || this._objectiveHint;
            const changed = nextHint !== this._objectiveHint;
            this._objectiveHint = nextHint;
            this._renderIdentity();
            if (changed) this._showFocusBanner();
      }

      flashFocusBanner(title: string, text: string): void {
            const nextTitle = title.trim() || this._focusBannerTitle.textContent || '';
            const nextText = text.trim() || this._focusBannerText.textContent || '';
            this._showFocusBanner(nextTitle, nextText);
      }

      getNavButton(id: string): HTMLElement | null {
            return this._navButtons.get(id) ?? this._navButtonsById.get(id) ?? null;
      }

      getPortrait(index: number): HTMLElement | undefined {
            return this._portraits[index];
      }

      private _togglePortraits(): void {
            this._collapsed = !this._collapsed;
            this._topRight.classList.toggle('is-collapsed', this._collapsed);
            this._toggleBtn.textContent = this._collapsed ? '展' : '收';
      }

      private _renderIdentity(): void {
            const playerName = this._identity?.playerName ?? '冒險者';
            const roleLabel = this._identity?.roleLabel ?? '新手探索';
            const heroName = this._identity?.heroName ?? '旅者';
            const starterPetSummary = this._identity
                  ? formatStarterPetSummary(this._identity.starterPetNames, 2)
                  : this._primaryPetName;

            this._identityName.textContent = `${playerName}`;
            this._identityMeta.textContent = `${roleLabel} · ${heroName}`;
            this._identityObjective.textContent = `${this._zoneName} · 主寵 ${this._primaryPetName || starterPetSummary}`;
            this._setFocusBannerCopy(`${playerName} · ${roleLabel}`, this._objectiveHint);
      }

      dispose(): void {
            if (this._bannerTimer) window.clearTimeout(this._bannerTimer);
            document.removeEventListener('pointerdown', this._handleDocPointerDown);
            this._focusBanner.remove();
            this._identityBar.remove();
            this._topRight.remove();
            this._navBar.remove();
      }
}
