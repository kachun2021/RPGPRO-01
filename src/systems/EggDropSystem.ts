import { PET_DEFS } from '../pets/PetData';

/**
 * EggDropSystem — Handles egg drops + server-wide announcements.
 * CHM scroll banner style: ornamental scroll edges, gold text, slide-in from top.
 */
export class EggDropSystem {
      private _container: HTMLDivElement;

      constructor() {
            this._container = document.createElement('div');
            this._container.id = 'egg-drop-layer';
            Object.assign(this._container.style, {
                  position: 'fixed', top: '60px', left: '50%',
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                  zIndex: '600',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '8px',
            });
            document.getElementById('ui-layer')?.appendChild(this._container);
      }

      rollDrop(dropRate: number, eggPetId?: string): string | null {
            if (!eggPetId) return null;
            if (Math.random() > dropRate) return null;
            return eggPetId;
      }

      /** Egg drop announcement */
      announce(playerName: string, petId: string): void {
            const petDef = PET_DEFS.find(p => p.id === petId);
            const petName = petDef?.nameCN ?? petId;
            this._showBanner(
                  '🥚',
                  `恭喜: <span class="ann-player">${playerName}</span> 獲得 <span class="ann-pet">${petName}</span> 的蛋！`,
                  'egg'
            );
      }

      /** Fusion success announcement */
      announceFusion(playerName: string, petId: string, level: number): void {
            const petDef = PET_DEFS.find(p => p.id === petId);
            const petName = petDef?.nameCN ?? petId;
            this._showBanner(
                  '✨',
                  `恭喜: <span class="ann-player">${playerName}</span> 成功合成寵物 <span class="ann-pet">${petName}</span> LV:${level}`,
                  'fusion'
            );
      }

      /** Boss kill announcement */
      announceBossKill(playerName: string, bossName: string, zoneName: string): void {
            this._showBanner(
                  '💀',
                  `恭喜: <span class="ann-player">${playerName}</span> 擊敗了 <span class="ann-boss">${bossName}</span>（${zoneName}）`,
                  'boss'
            );
      }

      /** Create the CHM-style scroll banner */
      private _showBanner(icon: string, html: string, type: 'egg' | 'fusion' | 'boss'): void {
            const banner = document.createElement('div');
            banner.className = `server-announce sa-${type}`;
            banner.innerHTML = `
                  <div class="sa-scroll-edge sa-scroll-left">〖</div>
                  <div class="sa-scroll-body">
                        <span class="sa-icon">${icon}</span>
                        <span class="sa-text">${html}</span>
                  </div>
                  <div class="sa-scroll-edge sa-scroll-right">〗</div>
            `;

            this._container.appendChild(banner);
            requestAnimationFrame(() => {
                  requestAnimationFrame(() => banner.classList.add('show'));
            });

            // Auto-remove after 5s
            setTimeout(() => {
                  banner.classList.add('hide');
                  setTimeout(() => banner.remove(), 600);
            }, 5000);
      }

      dispose(): void {
            this._container.remove();
      }
}
