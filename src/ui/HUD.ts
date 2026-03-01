import type { PlayerStats } from '../entities/Player';

export class HUD {
      private _topBar: HTMLDivElement;
      private _navBar: HTMLDivElement;
      private _hpFill!: HTMLDivElement;
      private _mpFill!: HTMLDivElement;
      private _levelEl!: HTMLSpanElement;
      private _goldEl!: HTMLSpanElement;
      private _diamondEl!: HTMLSpanElement;
      private _zoneEl!: HTMLSpanElement;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            // --- Top Bar ---
            this._topBar = document.createElement('div');
            this._topBar.className = 'hud-top interactive';
            this._topBar.innerHTML = `
      <div class="hud-hp"><div class="hud-hp-fill" id="hpFill" style="width:100%"></div></div>
      <div class="hud-mp"><div class="hud-mp-fill" id="mpFill" style="width:100%"></div></div>
      <span class="hud-stat hud-gold" id="hudLevel">Lv.1</span>
      <img src="assets/icons/coin_gold.png" style="width:16px;height:16px;opacity:0.9" alt="gold">
      <span class="hud-stat hud-gold" id="hudGold">500</span>
      <img src="assets/icons/gem_diamond.png" style="width:14px;height:14px;opacity:0.9" alt="diamond">
      <span class="hud-stat" id="hudDiamond" style="color:#7BA4DB">10</span>
      <span class="hud-zone" id="hudZone">Starter Meadow</span>
    `;
            uiLayer.appendChild(this._topBar);

            // Cache elements
            this._hpFill = document.getElementById('hpFill') as HTMLDivElement;
            this._mpFill = document.getElementById('mpFill') as HTMLDivElement;
            this._levelEl = document.getElementById('hudLevel') as HTMLSpanElement;
            this._goldEl = document.getElementById('hudGold') as HTMLSpanElement;
            this._diamondEl = document.getElementById('hudDiamond') as HTMLSpanElement;
            this._zoneEl = document.getElementById('hudZone') as HTMLSpanElement;

            // --- Bottom NavBar ---
            this._navBar = document.createElement('div');
            this._navBar.className = 'hud-nav interactive';

            const navItems = [
                  { id: 'nav-char', icon: 'nav_char.png', label: 'Char' },
                  { id: 'nav-bag', icon: 'nav_bag.png', label: 'Bag' },
                  { id: 'nav-quest', icon: 'nav_quest.png', label: 'Quest' },
                  { id: 'nav-pet', icon: 'nav_pet.png', label: 'Pet' },
                  { id: 'nav-shop', icon: 'nav_shop.png', label: 'Shop' },
                  { id: 'nav-chat', icon: 'nav_chat.png', label: 'Chat' },
                  { id: 'nav-settings', icon: 'nav_settings.png', label: 'Set' },
            ];

            for (const item of navItems) {
                  const btn = document.createElement('div');
                  btn.className = 'nav-btn';
                  btn.id = item.id;
                  btn.innerHTML = `<img src="assets/icons/${item.icon}" alt="${item.label}">`;
                  btn.addEventListener('pointerdown', () => {
                        btn.style.transform = 'scale(0.9)';
                        setTimeout(() => btn.style.transform = '', 120);
                  });
                  this._navBar.appendChild(btn);
            }
            uiLayer.appendChild(this._navBar);
      }

      updateStats(stats: PlayerStats): void {
            this._hpFill.style.width = `${(stats.hp / stats.maxHp) * 100}%`;
            this._mpFill.style.width = `${(stats.mp / stats.maxMp) * 100}%`;
            this._levelEl.textContent = `Lv.${stats.level}`;
            this._goldEl.textContent = stats.gold.toLocaleString();
            this._diamondEl.textContent = stats.diamond.toLocaleString();
      }

      setZone(name: string): void {
            this._zoneEl.textContent = name;
      }

      getNavButton(id: string): HTMLElement | null {
            return document.getElementById(id);
      }

      dispose(): void {
            this._topBar.remove();
            this._navBar.remove();
      }
}
