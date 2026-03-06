/**
 * CommunityPanel — CHM-style social panel with tabs: 好友/隊伍/公會/公告
 * Center popup with bottom tab bar, friend table, watermark icon.
 */

import {
      getRuntimeEventConfigs,
      getRuntimeEventDropMaps,
      getRuntimeServerMessages,
} from '../data/runtime/RuntimeOpsSource';

type CommTab = 'friends' | 'party' | 'guild' | 'bulletin';

interface FriendEntry {
      name: string;
      online: boolean;
      zone: string;
      level: number;
}

interface PartyMember {
      name: string;
      level: number;
      hp: number;
      maxHp: number;
      role: string;
}

const SOCIAL_FEATURES_LIVE = false;

// Mock data
const MOCK_FRIENDS: FriendEntry[] = [
      { name: '劍士小明', online: true, zone: '新手草原', level: 12 },
      { name: '法師阿花', online: true, zone: '暗影森林', level: 25 },
      { name: '弓手大衛', online: false, zone: '離線', level: 8 },
      { name: '盾衛阿寶', online: false, zone: '離線', level: 18 },
      { name: '獵人小紅', online: true, zone: '火山地帶', level: 31 },
];

const MOCK_PARTY: PartyMember[] = [];

export class CommunityPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _currentTab: CommTab = 'friends';
      private _showOnlineOnly = false;
      private _fitFrameId = 0;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._scheduleFit();
      };

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'community-panel';
            this._el.className = 'sa-panel comm-root';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      private _render(): void {
            this._el.innerHTML = '';

            // Title bar
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            const tabIcons: Record<CommTab, string> = { friends: '👥', party: '⚔️', guild: '🏰', bulletin: '📢' };
            const tabNames: Record<CommTab, string> = { friends: '好友', party: '隊伍', guild: '公會', bulletin: '公告' };
            title.innerHTML = `${tabIcons[this._currentTab]} ${tabNames[this._currentTab]}`;
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            if (!SOCIAL_FEATURES_LIVE) {
                  const banner = document.createElement('div');
                  banner.className = 'comm-dev-banner';
                  banner.textContent = '社交系統開發中：好友/隊伍/公會目前為展示資料，暫不會影響遊戲進度。';
                  this._el.appendChild(banner);
            }

            // Body
            const body = document.createElement('div');
            body.className = 'comm-body';

            switch (this._currentTab) {
                  case 'friends': this._renderFriends(body); break;
                  case 'party': this._renderParty(body); break;
                  case 'guild': this._renderGuild(body); break;
                  case 'bulletin': this._renderBulletin(body); break;
            }
            this._el.appendChild(body);

            // Bottom tab bar
            const tabBar = document.createElement('div');
            tabBar.className = 'comm-tab-bar';
            const tabs: { id: CommTab; label: string }[] = [
                  { id: 'friends', label: '好友' },
                  { id: 'party', label: '隊伍' },
                  { id: 'guild', label: '公會' },
                  { id: 'bulletin', label: '公告' },
            ];
            for (const t of tabs) {
                  const btn = document.createElement('button');
                  btn.className = 'comm-tab-btn';
                  if (t.id === this._currentTab) btn.classList.add('comm-tab-active');
                  btn.textContent = t.label;
                  btn.addEventListener('click', () => {
                        this._currentTab = t.id;
                        this._render();
                  });
                  tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);

            this._scheduleFit();
      }

      private _scheduleFit(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            this._fitPanelScale();
            this._fitFrameId = requestAnimationFrame(() => this._fitPanelScale());
      }

      private _fitPanelScale(): void {
            this._el.style.transformOrigin = 'center center';
            this._el.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');

            const vh = window.innerHeight || 0;
            const available = Math.max(0, Math.floor(vh * 0.88) - 6);
            if (available <= 0) return;

            const needed = this._el.scrollHeight;
            if (needed <= 0 || needed <= available) return;

            const scale = Math.max(0.62, Math.min(1, available / needed));
            this._el.style.setProperty('transform', `translate(-50%, -50%) scale(${scale})`, 'important');
      }

      private _renderFriends(body: HTMLDivElement): void {
            // Column headers
            const header = document.createElement('div');
            header.className = 'comm-table-header';
            header.innerHTML = `
                  <span class="comm-col-status">狀態</span>
                  <span class="comm-col-name">姓名</span>
                  <span class="comm-col-zone">位 置</span>
            `;
            body.appendChild(header);

            // Friend list (scrollable)
            const list = document.createElement('div');
            list.className = 'comm-friend-list';

            // Watermark
            const watermark = document.createElement('div');
            watermark.className = 'comm-watermark';
            watermark.textContent = '👥';
            list.appendChild(watermark);

            const friends = this._showOnlineOnly ? MOCK_FRIENDS.filter(f => f.online) : MOCK_FRIENDS;

            if (friends.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'comm-empty';
                  empty.textContent = '暫無好友';
                  list.appendChild(empty);
            } else {
                  for (const f of friends) {
                        const row = document.createElement('div');
                        row.className = 'comm-friend-row';
                        if (!f.online) row.classList.add('comm-offline');
                        row.innerHTML = `
                              <span class="comm-col-status">${f.online ? '🟢' : '⚫'}</span>
                              <span class="comm-col-name">Lv.${f.level} ${f.name}</span>
                              <span class="comm-col-zone">${f.zone}</span>
                        `;
                        list.appendChild(row);
                  }
            }

            // Empty grid rows to fill space
            const emptyRows = Math.max(0, 6 - friends.length);
            for (let i = 0; i < emptyRows; i++) {
                  const row = document.createElement('div');
                  row.className = 'comm-friend-row comm-empty-row';
                  row.innerHTML = `
                        <span class="comm-col-status"></span>
                        <span class="comm-col-name"></span>
                        <span class="comm-col-zone"></span>
                  `;
                  list.appendChild(row);
            }

            body.appendChild(list);

            // Bottom controls
            const controls = document.createElement('div');
            controls.className = 'comm-controls';
            controls.innerHTML = `
                  <button class="comm-status-btn ${SOCIAL_FEATURES_LIVE ? '' : 'is-disabled'}" ${SOCIAL_FEATURES_LIVE ? '' : 'disabled'}>狀態變更</button>
                  <label class="comm-online-label">
                        <input type="checkbox" class="comm-online-check" ${this._showOnlineOnly ? 'checked' : ''}>
                        只查看在線好友
                  </label>
            `;
            controls.querySelector('.comm-online-check')?.addEventListener('change', (e) => {
                  this._showOnlineOnly = (e.target as HTMLInputElement).checked;
                  this._render();
            });
            body.appendChild(controls);
      }

      private _renderParty(body: HTMLDivElement): void {
            const header = document.createElement('div');
            header.className = 'comm-section-title';
            header.textContent = SOCIAL_FEATURES_LIVE ? '目前隊伍成員' : '目前隊伍成員（展示）';
            body.appendChild(header);

            if (MOCK_PARTY.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'comm-party-empty';
                  empty.innerHTML = `
                        <div class="comm-watermark">⚔️</div>
                        <div class="comm-empty-text">${SOCIAL_FEATURES_LIVE ? '尚未加入隊伍' : '隊伍功能開發中'}</div>
                        <button class="comm-create-btn btn-gold ${SOCIAL_FEATURES_LIVE ? '' : 'is-disabled'}" ${SOCIAL_FEATURES_LIVE ? '' : 'disabled'}>${SOCIAL_FEATURES_LIVE ? '創建隊伍' : '即將開放'}</button>
                  `;
                  body.appendChild(empty);
            } else {
                  for (const m of MOCK_PARTY) {
                        const card = document.createElement('div');
                        card.className = 'comm-party-card';
                        const hpPct = Math.round((m.hp / m.maxHp) * 100);
                        card.innerHTML = `
                              <span class="comm-party-name">Lv.${m.level} ${m.name}</span>
                              <span class="comm-party-role">${m.role}</span>
                              <div class="comm-party-hp">
                                    <div class="comm-party-hp-fill"></div>
                              </div>
                        `;
                        const fill = card.querySelector('.comm-party-hp-fill') as HTMLDivElement | null;
                        if (fill) fill.style.width = `${hpPct}%`;
                        body.appendChild(card);
                  }
            }

            // Action buttons
            const actions = document.createElement('div');
            actions.className = 'comm-party-actions';
            actions.innerHTML = `
                  <button class="comm-action-btn ${SOCIAL_FEATURES_LIVE ? '' : 'is-disabled'}" ${SOCIAL_FEATURES_LIVE ? '' : 'disabled'}>📢 招募隊員</button>
                  <button class="comm-action-btn ${SOCIAL_FEATURES_LIVE ? '' : 'is-disabled'}" ${SOCIAL_FEATURES_LIVE ? '' : 'disabled'}>🔍 搜索隊伍</button>
            `;
            body.appendChild(actions);
      }

      private _renderGuild(body: HTMLDivElement): void {
            const empty = document.createElement('div');
            empty.className = 'comm-guild-empty';
            empty.innerHTML = `
                  <div class="comm-watermark">🏰</div>
                  <div class="comm-empty-text">${SOCIAL_FEATURES_LIVE ? '尚未加入公會' : '公會功能開發中'}</div>
                  <div class="comm-guild-actions">
                        <button class="comm-action-btn btn-gold ${SOCIAL_FEATURES_LIVE ? '' : 'is-disabled'}" ${SOCIAL_FEATURES_LIVE ? '' : 'disabled'}>${SOCIAL_FEATURES_LIVE ? '創建公會' : '即將開放'}</button>
                        <button class="comm-action-btn ${SOCIAL_FEATURES_LIVE ? '' : 'is-disabled'}" ${SOCIAL_FEATURES_LIVE ? '' : 'disabled'}>搜索公會</button>
                  </div>
                  <div class="comm-guild-info">
                        <p>• 創建公會需要 5000 GP</p>
                        <p>• 公會最多容納 50 名成員</p>
                        <p>• 公會可發起公會戰</p>
                  </div>
            `;
            body.appendChild(empty);
      }

      private _renderBulletin(body: HTMLDivElement): void {
            const events = getRuntimeEventConfigs();
            const messages = getRuntimeServerMessages();
            const dropMaps = getRuntimeEventDropMaps().slice(0, 8);

            const sectionTop = document.createElement('div');
            sectionTop.className = 'comm-section-title';
            sectionTop.textContent = '系統公告';
            body.appendChild(sectionTop);

            const list = document.createElement('div');
            list.className = 'comm-friend-list';
            if (messages.length <= 0) {
                  const empty = document.createElement('div');
                  empty.className = 'comm-empty';
                  empty.textContent = '目前沒有公告訊息';
                  list.appendChild(empty);
            } else {
                  for (const msg of messages) {
                        const row = document.createElement('div');
                        row.className = 'comm-friend-row';
                        row.innerHTML = `
                              <span class="comm-col-status">📣</span>
                              <span class="comm-col-name">${msg.message}</span>
                              <span class="comm-col-zone">${msg.type || 'SYSTEM'}</span>
                        `;
                        list.appendChild(row);
                  }
            }
            body.appendChild(list);

            const sectionMid = document.createElement('div');
            sectionMid.className = 'comm-section-title';
            sectionMid.textContent = '活動倍率';
            body.appendChild(sectionMid);
            const eventCard = document.createElement('div');
            eventCard.className = 'comm-party-card';
            const active = events[0];
            if (!active) {
                  eventCard.innerHTML = '<span class="comm-party-name">目前無活動設定</span>';
            } else {
                  eventCard.innerHTML = `
                        <span class="comm-party-name">掉蛋 x${active.coreRate || 0} · 經驗 x${active.expRate || 0} · 掉寶 x${active.itemRate || 0} · GP x${active.gpRate || 0}</span>
                        <span class="comm-party-role">${active.eventStart || '-'} ~ ${active.eventEnd || '-'}</span>
                  `;
            }
            body.appendChild(eventCard);

            const sectionBottom = document.createElement('div');
            sectionBottom.className = 'comm-section-title';
            sectionBottom.textContent = '活動地圖掉落配置';
            body.appendChild(sectionBottom);
            const mapWrap = document.createElement('div');
            mapWrap.className = 'comm-guild-info';
            if (dropMaps.length <= 0) {
                  mapWrap.innerHTML = '<p>• 目前沒有活動地圖掉落設定</p>';
            } else {
                  for (const row of dropMaps) {
                        const p = document.createElement('p');
                        p.textContent = `• ${row.mapName}：${row.configuredDropSlots} 格活動掉落`;
                        mapWrap.appendChild(p);
                  }
            }
            body.appendChild(mapWrap);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void {
            this._visible = true;
            this._el.hidden = false;
            this._render();
      }
      hide(): void {
            this._visible = false;
            this._el.hidden = true;
            this._el.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
      }
      dispose(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
