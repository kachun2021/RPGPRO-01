/**
 * CommunityPanel — CHM-style social panel with 3 tabs: 好友/隊伍/公會
 * Center popup with bottom tab bar, friend table, watermark icon.
 */

type CommTab = 'friends' | 'party' | 'guild';

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

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'community-panel';
            this._el.className = 'sa-panel comm-root';
            this._el.style.display = 'none';
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      private _render(): void {
            this._el.innerHTML = '';

            // Title bar
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            const tabIcons: Record<CommTab, string> = { friends: '👥', party: '⚔️', guild: '🏰' };
            const tabNames: Record<CommTab, string> = { friends: '好友', party: '隊伍', guild: '公會' };
            title.innerHTML = `${tabIcons[this._currentTab]} ${tabNames[this._currentTab]}`;
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Body
            const body = document.createElement('div');
            body.className = 'comm-body';

            switch (this._currentTab) {
                  case 'friends': this._renderFriends(body); break;
                  case 'party': this._renderParty(body); break;
                  case 'guild': this._renderGuild(body); break;
            }
            this._el.appendChild(body);

            // Bottom tab bar
            const tabBar = document.createElement('div');
            tabBar.className = 'comm-tab-bar';
            const tabs: { id: CommTab; label: string }[] = [
                  { id: 'friends', label: '好友' },
                  { id: 'party', label: '隊伍' },
                  { id: 'guild', label: '公會' },
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
                  <button class="comm-status-btn">狀態變更</button>
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
            header.textContent = '目前隊伍成員';
            body.appendChild(header);

            if (MOCK_PARTY.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'comm-party-empty';
                  empty.innerHTML = `
                        <div class="comm-watermark">⚔️</div>
                        <div class="comm-empty-text">尚未加入隊伍</div>
                        <button class="comm-create-btn btn-gold">創建隊伍</button>
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
                                    <div class="comm-party-hp-fill" style="width:${hpPct}%"></div>
                              </div>
                        `;
                        body.appendChild(card);
                  }
            }

            // Action buttons
            const actions = document.createElement('div');
            actions.className = 'comm-party-actions';
            actions.innerHTML = `
                  <button class="comm-action-btn">📢 招募隊員</button>
                  <button class="comm-action-btn">🔍 搜索隊伍</button>
            `;
            body.appendChild(actions);
      }

      private _renderGuild(body: HTMLDivElement): void {
            const empty = document.createElement('div');
            empty.className = 'comm-guild-empty';
            empty.innerHTML = `
                  <div class="comm-watermark">🏰</div>
                  <div class="comm-empty-text">尚未加入公會</div>
                  <div class="comm-guild-actions">
                        <button class="comm-action-btn btn-gold">創建公會</button>
                        <button class="comm-action-btn">搜索公會</button>
                  </div>
                  <div class="comm-guild-info">
                        <p>• 創建公會需要 5000 GP</p>
                        <p>• 公會最多容納 50 名成員</p>
                        <p>• 公會可發起公會戰</p>
                  </div>
            `;
            body.appendChild(empty);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._render(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
