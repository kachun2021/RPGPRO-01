import { ZONE_DEFS, type ZoneDef } from '../world/ZoneDefinitions';
import type { ZoneManager } from '../world/ZoneManager';
import { ZONE_MONSTER_DATA, type ZoneMonsterEntry } from '../world/ZoneMonsterData';

/**
 * WorldMapPanel — Premium split-panel: zone list (left) + zone details (right).
 * Click zone → show monster list + drop info. Teleport button on each zone row.
 */
export class WorldMapPanel {
      private _el: HTMLDivElement;
      private _listCol!: HTMLDivElement;
      private _detailCol!: HTMLDivElement;
      private _visible = false;
      private _zoneManager: ZoneManager;
      private _selectedZone: ZoneDef | null = null;

      constructor(zoneManager: ZoneManager) {
            this._zoneManager = zoneManager;

            this._el = document.createElement('div');
            this._el.id = 'world-map-panel';
            this._el.className = 'sa-panel wmp-root';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      private _buildShell(): void {
            // Title bar
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span style="font-size:15px">🗺️</span> 世界地圖';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Split body
            const body = document.createElement('div');
            body.className = 'wmp-body';

            this._listCol = document.createElement('div');
            this._listCol.className = 'wmp-list';

            this._detailCol = document.createElement('div');
            this._detailCol.className = 'wmp-detail';
            this._detailCol.innerHTML = '<div class="wmp-detail-empty">← 選擇區域查看詳情</div>';

            body.appendChild(this._listCol);
            body.appendChild(this._detailCol);
            this._el.appendChild(body);
      }

      private _render(): void {
            this._listCol.innerHTML = '';
            const currentId = this._zoneManager.currentZone.id;

            const biomeEmoji: Record<string, string> = {
                  grass: '🌿', forest: '🌲', desert: '🏜️', snow: '❄️',
                  cave: '🕳️', beach: '🏖️', lava: '🌋', town: '🏰',
            };

            for (const zone of ZONE_DEFS) {
                  const isUnlocked = this._zoneManager.isUnlocked(zone.id);
                  const isCurrent = zone.id === currentId;
                  const isSelected = this._selectedZone?.id === zone.id;

                  const row = document.createElement('div');
                  row.className = 'wmp-zone-row';
                  if (isCurrent) row.classList.add('wmp-current');
                  if (isSelected) row.classList.add('wmp-selected');
                  if (!isUnlocked) row.classList.add('wmp-locked');

                  // Left info
                  const info = document.createElement('div');
                  info.className = 'wmp-zone-info';
                  info.style.cursor = 'pointer';
                  info.innerHTML = `
                        <div class="wmp-zone-top">
                              <span class="wmp-zone-emoji">${biomeEmoji[zone.biome] ?? '🗺️'}</span>
                              <span class="wmp-zone-name">${zone.nameCN}</span>
                              ${isCurrent ? '<span class="wmp-here">📍</span>' : ''}
                              ${!isUnlocked ? '<span class="wmp-lock">🔒</span>' : ''}
                        </div>
                        <div class="wmp-zone-lv">${zone.isTown ? '城鎮 · 安全區' : `Lv.${zone.levelMin}–${zone.levelMax}`}</div>
                  `;
                  info.addEventListener('click', () => this._selectZone(zone));

                  // Teleport button
                  const teleBtn = document.createElement('button');
                  teleBtn.className = 'wmp-teleport-btn';
                  if (isCurrent) {
                        teleBtn.textContent = '所在地';
                        teleBtn.disabled = true;
                        teleBtn.classList.add('wmp-btn-disabled');
                  } else if (!isUnlocked) {
                        teleBtn.textContent = '🔒';
                        teleBtn.disabled = true;
                        teleBtn.classList.add('wmp-btn-disabled');
                  } else {
                        teleBtn.textContent = '⚡ 傳送';
                        teleBtn.addEventListener('click', (e) => {
                              e.stopPropagation();
                              this.hide();
                              this._zoneManager.travelTo(zone.id);
                        });
                  }

                  row.appendChild(info);
                  row.appendChild(teleBtn);
                  this._listCol.appendChild(row);
            }

            // If we have a selected zone, refresh detail panel
            if (this._selectedZone) {
                  this._renderDetail(this._selectedZone);
            }
      }

      private _selectZone(zone: ZoneDef): void {
            this._selectedZone = zone;
            // Update selection highlight
            this._listCol.querySelectorAll('.wmp-zone-row').forEach(el => el.classList.remove('wmp-selected'));
            const idx = ZONE_DEFS.indexOf(zone);
            const rows = this._listCol.querySelectorAll('.wmp-zone-row');
            if (rows[idx]) rows[idx].classList.add('wmp-selected');
            this._renderDetail(zone);
      }

      private _renderDetail(zone: ZoneDef): void {
            const biomeNameCN: Record<string, string> = {
                  grass: '草原', forest: '森林', desert: '沙漠', snow: '雪地',
                  cave: '洞穴', beach: '海灘', lava: '熔岩', town: '城鎮',
            };

            const monsters = this._getZoneMonsters(zone);
            const isCurrent = zone.id === this._zoneManager.currentZone.id;
            const isUnlocked = this._zoneManager.isUnlocked(zone.id);

            let html = `
                  <div class="wmp-detail-header">
                        <div class="wmp-detail-title">${zone.nameCN}</div>
                        <div class="wmp-detail-sub">${biomeNameCN[zone.biome] ?? '未知'} · ${zone.isTown ? '安全區' : `Lv.${zone.levelMin}–${zone.levelMax}`}</div>
                  </div>
            `;

            // Monster table
            if (monsters.length > 0) {
                  html += `<div class="wmp-section-title">🐾 區域怪物</div>`;
                  html += `<div class="wmp-monster-table">
                        <div class="wmp-mt-header">
                              <span class="wmp-mt-name">名稱</span>
                              <span class="wmp-mt-lv">等級</span>
                              <span class="wmp-mt-mode">行為</span>
                              <span class="wmp-mt-egg">🥚掉蛋</span>
                        </div>`;
                  for (const m of monsters) {
                        const isBoss = m.respawnSec >= 3600;
                        const modeClass = m.mode === '主动式' ? 'wmp-aggro' : 'wmp-passive';
                        html += `
                              <div class="wmp-mt-row${isBoss ? ' wmp-mt-boss' : ''}">
                                    <span class="wmp-mt-name">${isBoss ? '👑 ' : ''}${m.name}</span>
                                    <span class="wmp-mt-lv">${m.level}</span>
                                    <span class="wmp-mt-mode ${modeClass}">${m.mode === '主动式' ? '⚔️ 主動' : '🛡️ 被動'}</span>
                                    <span class="wmp-mt-egg">${isBoss ? '5%' : '0.1%'}</span>
                              </div>`;
                  }
                  html += `</div>`;

                  // Drop summary
                  html += `<div class="wmp-section-title">💎 掉落物品</div>`;
                  html += `<div class="wmp-drop-list">`;
                  html += `<div class="wmp-drop-row"><span class="wmp-drop-item">💰 金幣</span><span class="wmp-drop-rate">100%</span></div>`;
                  html += `<div class="wmp-drop-row"><span class="wmp-drop-item">📦 經驗石</span><span class="wmp-drop-rate">30%</span></div>`;
                  html += `<div class="wmp-drop-row"><span class="wmp-drop-item">🧪 材料</span><span class="wmp-drop-rate">15%</span></div>`;
                  html += `<div class="wmp-drop-row"><span class="wmp-drop-item">📜 裝備書</span><span class="wmp-drop-rate">3%</span></div>`;
                  html += `<div class="wmp-drop-row"><span class="wmp-drop-item">🥚 寵物蛋</span><span class="wmp-drop-rate">0.1%</span></div>`;

                  // Boss specific drops
                  const bosses = monsters.filter(m => m.respawnSec >= 3600);
                  if (bosses.length > 0) {
                        html += `<div class="wmp-drop-row wmp-drop-boss"><span class="wmp-drop-item">👑 Boss套裝</span><span class="wmp-drop-rate">10%</span></div>`;
                        html += `<div class="wmp-drop-row wmp-drop-boss"><span class="wmp-drop-item">👑 Boss蛋</span><span class="wmp-drop-rate">5%</span></div>`;
                  }
                  html += `</div>`;
            } else {
                  html += `<div class="wmp-detail-empty" style="margin-top:24px">🏰 城鎮安全區<br><span style="font-size:10px;opacity:0.5">NPC · 商店 · 孵蛋 · 傳送</span></div>`;
            }

            // Teleport footer
            if (!zone.isTown || zone.id !== this._zoneManager.currentZone.id) {
                  html += `<div class="wmp-detail-footer">`;
                  if (isCurrent) {
                        html += `<button class="wmp-teleport-footer-btn wmp-btn-disabled" disabled>📍 目前所在</button>`;
                  } else if (!isUnlocked) {
                        html += `<button class="wmp-teleport-footer-btn wmp-btn-disabled" disabled>🔒 尚未解鎖</button>`;
                  } else {
                        html += `<button class="wmp-teleport-footer-btn" id="wmp-footer-tele">⚡ 傳送至 ${zone.nameCN}</button>`;
                  }
                  html += `</div>`;
            }

            this._detailCol.innerHTML = html;

            // Bind footer teleport
            const footerBtn = this._detailCol.querySelector('#wmp-footer-tele');
            if (footerBtn && isUnlocked && !isCurrent) {
                  footerBtn.addEventListener('click', () => {
                        this.hide();
                        this._zoneManager.travelTo(zone.id);
                  });
            }
      }

      private _getZoneMonsters(zone: ZoneDef): ZoneMonsterEntry[] {
            const entries: ZoneMonsterEntry[] = [];
            for (const mapId of zone.mapMonIds) {
                  const data = ZONE_MONSTER_DATA[mapId];
                  if (data) entries.push(...data);
            }
            return entries;
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._selectedZone = null; this._render(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
