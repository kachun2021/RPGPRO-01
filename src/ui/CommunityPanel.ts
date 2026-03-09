import {
      getRuntimeEventConfigs,
      getRuntimeEventDropMaps,
      getRuntimeServerMessages,
      type RuntimeEventConfig,
      type RuntimeEventDropMap,
      type RuntimeServerMessage,
} from '../data/runtime/RuntimeOpsSource';

type CommTab = 'bulletin' | 'preview';

export class CommunityPanel {
      readonly panelId = 'community';
      private _el: HTMLDivElement;
      private _visible = false;
      private _currentTab: CommTab = 'preview';
      private _fitFrameId = 0;

      private _bulletinLoading = false;
      private _bulletinError: string | null = null;
      private _bulletinData: {
            events: RuntimeEventConfig[];
            messages: RuntimeServerMessage[];
            dropMaps: RuntimeEventDropMap[];
      } | null = null;

      private _onResize = (): void => {
            if (!this._visible) return;
            this._scheduleFit();
      };

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'community-panel';
            this._el.className = 'sa-panel comm-root ui-panel-fullscreen';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      get isVisible(): boolean {
            return this._visible;
      }

      toggle(): void {
            this._visible ? this.hide() : this.show();
      }

      show(): void {
            this._visible = true;
            this._el.hidden = false;
            this._render();
      }

      hide(): void {
            this._visible = false;
            this._el.hidden = true;
            if (!this._el.classList.contains('ui-panel-fullscreen')) {
                  this._el.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
            } else {
                  this._el.style.removeProperty('transform');
                  this._el.style.removeProperty('transform-origin');
            }
      }

      dispose(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }

      private _render(): void {
            this._el.innerHTML = '';

            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '社交預覽';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const banner = document.createElement('div');
            banner.className = 'comm-dev-banner';
            banner.textContent = '此頁只呈現已落地公告與未來服務邊界，不再偽裝成已上線多人系統。';
            this._el.appendChild(banner);

            const body = document.createElement('div');
            body.className = 'comm-body';
            if (this._currentTab === 'bulletin') {
                  this._renderBulletin(body);
            } else {
                  this._renderPreview(body);
            }
            this._el.appendChild(body);

            const tabBar = document.createElement('div');
            tabBar.className = 'comm-tab-bar';
            const tabs: Array<{ id: CommTab; label: string }> = [
                  { id: 'bulletin', label: '公告' },
                  { id: 'preview', label: '服務邊界' },
            ];
            for (const tab of tabs) {
                  const btn = document.createElement('button');
                  btn.className = 'comm-tab-btn';
                  if (tab.id === this._currentTab) btn.classList.add('comm-tab-active');
                  btn.textContent = tab.label;
                  btn.addEventListener('click', () => {
                        this._currentTab = tab.id;
                        this._render();
                  });
                  tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);

            this._scheduleFit();
      }

      private _renderPreview(body: HTMLDivElement): void {
            body.innerHTML = `
                  <div class="comm-section-title">目前狀態</div>
                  <div class="comm-guild-info">
                        <p>· 帳號、存檔與進度仍是 local-first 單機架構。</p>
                        <p>· 好友 / 隊伍 / 公會 UI 已降級為預覽，不會修改遊戲進度。</p>
                        <p>· 後續若接多人或房間服務，會從 System 入口而非主循環導航進入。</p>
                  </div>
                  <div class="comm-section-title">預覽中的服務</div>
                  <div class="comm-preview-grid">
                        ${this._previewCard('好友', '尚未上線', '未接即時在線狀態、邀請與追蹤。')}
                        ${this._previewCard('隊伍', '尚未上線', '未接房間服務、同步戰鬥與掉落規則。')}
                        ${this._previewCard('公會', '尚未上線', '未接公會資料、公告與權限邏輯。')}
                  </div>
                  <div class="comm-section-title">已落地內容</div>
                  <div class="comm-party-card">
                        <span class="comm-party-name">系統公告 / 活動倍率 / 活動掉落配置</span>
                        <span class="comm-party-role">可讀取 runtime ops 資料，作為日後 live ops 的唯讀入口。</span>
                  </div>
            `;
      }

      private _previewCard(title: string, status: string, copy: string): string {
            return `
                  <div class="comm-preview-card">
                        <div class="comm-preview-top">
                              <span class="comm-preview-title">${title}</span>
                              <span class="comm-preview-status">${status}</span>
                        </div>
                        <div class="comm-preview-copy">${copy}</div>
                  </div>
            `;
      }

      private _renderBulletin(body: HTMLDivElement): void {
            if (!this._bulletinData && !this._bulletinLoading) {
                  void this._loadBulletinData();
            }

            const events = this._bulletinData?.events ?? [];
            const messages = this._bulletinData?.messages ?? [];
            const dropMaps = (this._bulletinData?.dropMaps ?? []).slice(0, 8);

            const sectionTop = document.createElement('div');
            sectionTop.className = 'comm-section-title';
            sectionTop.textContent = '系統公告';
            body.appendChild(sectionTop);

            const list = document.createElement('div');
            list.className = 'comm-friend-list';
            if (this._bulletinLoading) {
                  const loading = document.createElement('div');
                  loading.className = 'comm-empty';
                  loading.textContent = '公告資料載入中...';
                  list.appendChild(loading);
            } else if (this._bulletinError) {
                  const error = document.createElement('div');
                  error.className = 'comm-empty';
                  error.textContent = this._bulletinError;
                  list.appendChild(error);
            } else if (messages.length <= 0) {
                  const empty = document.createElement('div');
                  empty.className = 'comm-empty';
                  empty.textContent = '目前沒有公告訊息';
                  list.appendChild(empty);
            } else {
                  for (const msg of messages) {
                        const row = document.createElement('div');
                        row.className = 'comm-friend-row';
                        row.innerHTML = `
                              <span class="comm-col-status">📚</span>
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
                  eventCard.innerHTML = '<span class="comm-party-name">目前沒有活動配置</span>';
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
                  mapWrap.innerHTML = '<p>· 目前沒有活動地圖掉落設定</p>';
            } else {
                  for (const row of dropMaps) {
                        const p = document.createElement('p');
                        p.textContent = `· ${row.mapName}：${row.configuredDropSlots} 格活動掉落`;
                        mapWrap.appendChild(p);
                  }
            }
            body.appendChild(mapWrap);
      }

      private _scheduleFit(): void {
            if (this._el.classList.contains('ui-panel-fullscreen')) return;
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            this._fitPanelScale();
            this._fitFrameId = requestAnimationFrame(() => this._fitPanelScale());
      }

      private _fitPanelScale(): void {
            if (this._el.classList.contains('ui-panel-fullscreen')) {
                  this._el.style.removeProperty('transform');
                  this._el.style.removeProperty('transform-origin');
                  return;
            }
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

      private async _loadBulletinData(): Promise<void> {
            this._bulletinLoading = true;
            this._bulletinError = null;
            try {
                  const [events, messages, dropMaps] = await Promise.all([
                        getRuntimeEventConfigs(),
                        getRuntimeServerMessages(),
                        getRuntimeEventDropMaps(),
                  ]);
                  this._bulletinData = { events, messages, dropMaps };
            } catch (err) {
                  console.warn('[CommunityPanel] Failed to load runtime bulletin data.', err);
                  this._bulletinData = { events: [], messages: [], dropMaps: [] };
                  this._bulletinError = '公告資料暫時無法讀取';
            } finally {
                  this._bulletinLoading = false;
                  if (this._visible && this._currentTab === 'bulletin') {
                        this._render();
                  }
            }
      }
}
