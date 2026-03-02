import { ZONE_DEFS, type ZoneDef } from '../world/ZoneDefinitions';
import type { ZoneManager } from '../world/ZoneManager';

/**
 * WorldMapPanel — Center popup showing 17 zones as a node map.
 * Click an unlocked zone to teleport.
 */
export class WorldMapPanel {
      private _el: HTMLDivElement;
      private _body!: HTMLDivElement;
      private _visible = false;
      private _zoneManager: ZoneManager;

      constructor(zoneManager: ZoneManager) {
            this._zoneManager = zoneManager;

            this._el = document.createElement('div');
            this._el.id = 'world-map-panel';
            this._el.className = 'sa-panel';
            this._el.style.display = 'none';
            Object.assign(this._el.style, {
                  position: 'fixed', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%) scale(1)',
                  width: '480px', maxHeight: '80vh', zIndex: '300',
                  overflow: 'auto',
            });

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      private _buildShell(): void {
            // Title
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '🗺️ 世界地圖';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Body
            this._body = document.createElement('div');
            this._body.className = 'panel-body';
            this._body.style.cssText = 'padding:8px 12px;overflow-y:auto;max-height:65vh';
            this._el.appendChild(this._body);
      }

      private _render(): void {
            this._body.innerHTML = '';

            const currentId = this._zoneManager.currentZone.id;

            // Zone grid
            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px';

            for (const zone of ZONE_DEFS) {
                  const isUnlocked = this._zoneManager.isUnlocked(zone.id);
                  const isCurrent = zone.id === currentId;

                  const card = document.createElement('div');
                  card.className = 'zone-card';
                  if (isCurrent) card.classList.add('zone-current');
                  if (!isUnlocked) card.classList.add('zone-locked');

                  const biomeEmoji: Record<string, string> = {
                        grass: '🌿', forest: '🌲', desert: '🏜️', snow: '❄️',
                        cave: '🕳️', beach: '🏖️', lava: '🌋', town: '🏰',
                  };

                  card.innerHTML = `
                        <div class="zone-card-header">
                              <span class="zone-card-emoji">${biomeEmoji[zone.biome] ?? '🗺️'}</span>
                              <span class="zone-card-name">${zone.nameCN}</span>
                        </div>
                        <div class="zone-card-info">
                              ${zone.isTown ? '🏰 城鎮' : `Lv.${zone.levelMin}-${zone.levelMax}`}
                              ${isCurrent ? ' <span class="zone-here">📍 所在地</span>' : ''}
                              ${!isUnlocked ? ' <span class="zone-lock">🔒</span>' : ''}
                        </div>
                  `;

                  if (isUnlocked && !isCurrent) {
                        card.style.cursor = 'pointer';
                        card.addEventListener('click', () => {
                              this.hide();
                              this._zoneManager.travelTo(zone.id);
                        });
                  }

                  grid.appendChild(card);
            }

            this._body.appendChild(grid);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._render(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
