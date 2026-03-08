import type { RuntimeHeroTemplate } from '../data/runtime/RuntimeProgression';
import { getHeroArchetypeProfile } from '../data/runtime/HeroArchetypes';
import { PET_DEFS } from '../pets/PetData';

export interface HeroCreationResult {
      heroType: number;
      playerName: string;
}

export class HeroCreationPanel {
      private readonly _heroes: RuntimeHeroTemplate[];
      private _el: HTMLDivElement | null = null;
      private _selectedHeroType = 0;
      private _resolve: ((value: HeroCreationResult) => void) | null = null;
      private readonly _petNameById = new Map(PET_DEFS.map((pet) => [pet.id, pet.name] as const));

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
                        <div class="hero-create-sub">先選擇開局定位，再沿著新手導引完成找村長、首戰、補給、寵物、融合這條基本流程。</div>
                        <div class="hero-create-brief">
                              <div class="hero-create-brief-card">
                                    <div class="hero-create-brief-title">開局 5 分鐘</div>
                                    <div class="hero-create-brief-text">接主線、出村打一場、撿第一個掉落。</div>
                              </div>
                              <div class="hero-create-brief-card">
                                    <div class="hero-create-brief-title">接著做什麼</div>
                                    <div class="hero-create-brief-text">補給藥水、確認主寵編隊，再看第一個融合目標。</div>
                              </div>
                        </div>
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
                              <div class="hero-create-starter-label">起始寵物</div>
                              <div class="hero-create-pet-row">
                                    ${profile.starterPetIds
                                          .slice(0, 3)
                                          .map((petId) => `<span class="hero-create-pet-chip">${this._escape(this._petNameById.get(petId) ?? petId)}</span>`)
                                          .join('')}
                              </div>
                              <div class="hero-create-route">成長方向：先穩定完成新手主線，再沿著推薦融合線往上推。</div>
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
