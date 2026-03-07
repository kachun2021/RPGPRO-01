import type { RuntimeHeroTemplate } from '../data/runtime/RuntimeProgression';
import { getHeroArchetypeProfile } from '../data/runtime/HeroArchetypes';

export interface HeroCreationResult {
      heroType: number;
      playerName: string;
}

export class HeroCreationPanel {
      private readonly _heroes: RuntimeHeroTemplate[];
      private _el: HTMLDivElement | null = null;
      private _selectedHeroType = 0;
      private _resolve: ((value: HeroCreationResult) => void) | null = null;

      constructor(heroes: RuntimeHeroTemplate[]) {
            this._heroes = heroes
                  .map((hero) => ({ ...hero }))
                  .sort((a, b) => a.type - b.type);
            this._selectedHeroType = this._heroes[0]?.type ?? 0;
      }

      show(): Promise<HeroCreationResult> {
            if (this._heroes.length <= 0) {
                  return Promise.resolve({ heroType: 0, playerName: '玩家' });
            }

            const uiLayer = document.getElementById('ui-layer');
            if (!uiLayer) {
                  const fallback = this._heroes[0];
                  return Promise.resolve({
                        heroType: fallback.type,
                        playerName: fallback.name || '玩家',
                  });
            }

            this._mount(uiLayer);
            return new Promise<HeroCreationResult>((resolve) => {
                  this._resolve = resolve;
            });
      }

      private _mount(uiLayer: HTMLElement): void {
            this._unmount();
            const root = document.createElement('div');
            root.className = 'hero-create-overlay';
            root.innerHTML = `
                  <div class="hero-create-panel">
                        <div class="hero-create-title">建立角色</div>
                        <div class="hero-create-sub">選擇職業與名稱，之後可在系統面板重設角色。</div>
                        <div class="hero-create-grid" id="hero-create-grid"></div>
                        <label class="hero-create-name-wrap">
                              <span>角色名稱</span>
                              <input id="hero-create-name" class="hero-create-name-input" type="text" maxlength="12" placeholder="請輸入角色名稱">
                        </label>
                        <div class="hero-create-actions">
                              <button id="hero-create-confirm" class="game-btn game-btn-primary hero-create-confirm">開始冒險</button>
                        </div>
                  </div>
            `;

            const grid = root.querySelector('#hero-create-grid') as HTMLDivElement | null;
            const nameInput = root.querySelector('#hero-create-name') as HTMLInputElement | null;
            const confirmBtn = root.querySelector('#hero-create-confirm') as HTMLButtonElement | null;

            if (grid) {
                  for (const hero of this._heroes) {
                        const profile = getHeroArchetypeProfile(hero.type);
                        const card = document.createElement('button');
                        card.type = 'button';
                        card.className = 'hero-create-card';
                        card.dataset.heroType = String(hero.type);
                        card.innerHTML = `
                              <div class="hero-create-card-head">
                                    <span class="hero-create-name">${this._escape(hero.name || `Hero ${hero.type}`)}</span>
                                    <span class="hero-create-type">Type ${hero.type}</span>
                              </div>
                              <div class="hero-create-role">${this._escape(profile.roleLabel)}</div>
                              <div class="hero-create-desc">${this._escape(profile.shortDesc)}</div>
                              <div class="hero-create-stat">HP ${hero.baseHp} · MP ${hero.baseMp}</div>
                        `;
                        card.addEventListener('click', () => {
                              this._selectedHeroType = hero.type;
                              this._syncSelectedCard(root);
                              if (nameInput && !nameInput.value.trim()) {
                                    nameInput.value = hero.name || '';
                              }
                        });
                        grid.appendChild(card);
                  }
            }

            this._syncSelectedCard(root);
            const selectedHero = this._heroes.find((hero) => hero.type === this._selectedHeroType) ?? this._heroes[0];
            if (nameInput) {
                  nameInput.value = selectedHero?.name || '';
                  nameInput.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter') {
                              event.preventDefault();
                              confirmBtn?.click();
                        }
                  });
            }

            confirmBtn?.addEventListener('click', () => {
                  const selected = this._heroes.find((hero) => hero.type === this._selectedHeroType) ?? this._heroes[0];
                  const rawName = nameInput?.value.trim() ?? '';
                  const playerName = rawName || selected.name || '玩家';
                  this._resolve?.({
                        heroType: selected.type,
                        playerName,
                  });
                  this._resolve = null;
                  this._unmount();
            });

            uiLayer.appendChild(root);
            this._el = root;
      }

      private _syncSelectedCard(root: HTMLElement): void {
            root.querySelectorAll<HTMLElement>('.hero-create-card').forEach((card) => {
                  const heroType = Number(card.dataset.heroType ?? NaN);
                  const active = Number.isFinite(heroType) && Math.floor(heroType) === this._selectedHeroType;
                  card.classList.toggle('is-active', active);
            });
      }

      private _unmount(): void {
            this._el?.remove();
            this._el = null;
      }

      private _escape(value: string): string {
            return value
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }
}

