import { PET_DEFS } from '../pets/PetData';
import { getRuntimeServerMessages, type RuntimeServerMessage } from '../data/runtime/RuntimeOpsSource';

/**
 * EggDropSystem - handles egg/fusion/boss announcements.
 * Also rotates runtime server messages from ops.json.
 */
export class EggDropSystem {
      private _container: HTMLDivElement;
      private _runtimeMessages: RuntimeServerMessage[] = [];
      private _runtimeCursor = 0;
      private _runtimeTimer: number | null = null;

      constructor() {
            this._container = document.createElement('div');
            this._container.id = 'egg-drop-layer';
            Object.assign(this._container.style, {
                  position: 'fixed',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                  zIndex: '600',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
            });
            document.getElementById('ui-layer')?.appendChild(this._container);

            this._runtimeMessages = getRuntimeServerMessages();
            if (this._runtimeMessages.length > 0) {
                  this._runtimeTimer = window.setInterval(() => this._announceNextRuntimeMessage(), 90_000);
            }
      }

      rollDrop(dropRate: number, eggPetId?: string): string | null {
            if (!eggPetId) return null;
            if (Math.random() > dropRate) return null;
            return eggPetId;
      }

      /** Egg drop announcement */
      announce(playerName: string, petId: string): void {
            const petDef = PET_DEFS.find((pet) => pet.id === petId);
            const petName = petDef?.nameCN ?? petId;
            this._showBanner(
                  '🥚',
                  `恭喜: <span class="ann-player">${playerName}</span> 獲得 <span class="ann-pet">${petName}</span> 的蛋！`,
                  'egg',
            );
      }

      /** Fusion success announcement */
      announceFusion(playerName: string, petId: string, level: number): void {
            const petDef = PET_DEFS.find((pet) => pet.id === petId);
            const petName = petDef?.nameCN ?? petId;
            this._showBanner(
                  '✨',
                  `恭喜: <span class="ann-player">${playerName}</span> 成功合成寵物 <span class="ann-pet">${petName}</span> LV:${level}`,
                  'fusion',
            );
      }

      /** Boss kill announcement */
      announceBossKill(playerName: string, bossName: string, zoneName: string): void {
            this._showBanner(
                  '🏆',
                  `恭喜: <span class="ann-player">${playerName}</span> 擊敗了 <span class="ann-boss">${bossName}</span>（${zoneName}）`,
                  'boss',
            );
      }

      private _announceNextRuntimeMessage(): void {
            if (this._runtimeMessages.length <= 0) return;
            const row = this._runtimeMessages[this._runtimeCursor % this._runtimeMessages.length];
            this._runtimeCursor += 1;
            this._showBanner('📣', this._escapeHtml(row.message), 'system');
      }

      /** Create the scroll-style server banner */
      private _showBanner(icon: string, html: string, type: 'egg' | 'fusion' | 'boss' | 'system'): void {
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

      private _escapeHtml(text: string): string {
            return text
                  .replaceAll('&', '&amp;')
                  .replaceAll('<', '&lt;')
                  .replaceAll('>', '&gt;')
                  .replaceAll('"', '&quot;')
                  .replaceAll("'", '&#39;');
      }

      dispose(): void {
            if (this._runtimeTimer !== null) {
                  window.clearInterval(this._runtimeTimer);
                  this._runtimeTimer = null;
            }
            this._container.remove();
      }
}

