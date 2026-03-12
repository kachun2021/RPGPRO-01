import {
      getRuntimeEventConfigs,
      getRuntimeEventDropMaps,
      getRuntimeServerMessages,
      type RuntimeEventConfig,
      type RuntimeEventDropMap,
      type RuntimeServerMessage,
} from '../data/runtime/RuntimeOpsSource';
import { createPanelHeader } from './layout/PanelHeader';
import { buildDebugSummary, collectVisibleButtonLabels } from './layout/PanelDebugState';

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
            this._el.className = 'sa-panel comm-root ui-panel-atlas';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      get isVisible(): boolean {
            return this._visible;
      }

      getDebugState() {
            return {
                  activeTab: this._currentTab,
                  visiblePrimaryActions: collectVisibleButtonLabels(this._el, 4),
                  keyDataSummary: buildDebugSummary({
                        bulletinCount: this._bulletinData?.messages.length ?? 0,
                        eventCount: this._bulletinData?.events.length ?? 0,
                        loading: this._bulletinLoading,
                  }),
            };
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
            if (!this._el.classList.contains('ui-panel-atlas')) {
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
            const bulletinCount = this._bulletinData?.messages.length ?? 0;
            const headerSummary = this._currentTab === 'bulletin'
                  ? `公告 ${bulletinCount}`
                  : 'Live Ops 邊界';

            const { root: title } = createPanelHeader({
                  icon: 'menu',
                  kicker: 'Service Surface',
                  title: '營運與社群',
                  subtitle: '已落地公告、活動倍率與未來多人邊界摘要',
                  summaryText: headerSummary,
                  summaryClassName: 'comm-header-pill',
                  closeLabel: '關閉營運與社群面板',
                  closeText: '✕',
                  onClose: () => this.hide(),
            });
            this._el.appendChild(title);

            const tabBar = document.createElement('div');
            tabBar.className = 'comm-tab-bar';
            const tabs: Array<{ id: CommTab; label: string }> = [
                  { id: 'preview', label: '服務邊界' },
                  { id: 'bulletin', label: '公告看板' },
            ];
            for (const tab of tabs) {
                  const btn = document.createElement('button');
                  btn.className = 'comm-tab-btn rpg-chip rpg-chip-tab';
                  if (tab.id === this._currentTab) btn.classList.add('comm-tab-active', 'is-active');
                  btn.textContent = tab.label;
                  btn.addEventListener('click', () => {
                        this._currentTab = tab.id;
                        this._render();
                  });
                  tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);

            const banner = document.createElement('div');
            banner.className = 'comm-dev-banner';
            banner.textContent = '只顯示已接線公告與活動資料；好友、房間與公會仍是預留邊界。';
            this._el.appendChild(banner);

            const body = document.createElement('div');
            body.className = 'comm-body';
            if (this._currentTab === 'bulletin') {
                  this._renderBulletin(body);
            } else {
                  this._renderPreview(body);
            }
            this._el.appendChild(body);

            this._scheduleFit();
      }

      private _renderPreview(body: HTMLDivElement): void {
            body.innerHTML = `
                  <div class="comm-overview-grid">
                        ${this._overviewCard('存檔模式', 'Local-first', '角色與進度仍寫入本機。')}
                        ${this._overviewCard('即時系統', '唯讀公告', '目前只讀公告與活動倍率。')}
                        ${this._overviewCard('多人功能', '未開放', '好友、隊伍、公會仍屬預留。')}
                  </div>
                  <div class="comm-section-title">目前邊界</div>
                  <div class="comm-overview-grid">
                        ${this._overviewCard('進度寫入', '本機存檔', '不經伺服器')}
                        ${this._overviewCard('好友 / 隊伍 / 公會', '保留入口', '不改角色資料')}
                        ${this._overviewCard('未來多人接點', 'System 入口', '不綁主 HUD')}
                  </div>
                  <div class="comm-section-title">預覽中的服務</div>
                  <div class="comm-preview-grid">
                        ${this._previewCard('好友', '尚未上線', '尚未接在線狀態與邀請。')}
                        ${this._previewCard('隊伍', '尚未上線', '尚未接房間與同步掉落。')}
                        ${this._previewCard('公會', '尚未上線', '尚未接公告與權限邏輯。')}
                  </div>
                  <div class="comm-section-title">已落地內容</div>
                  <div class="comm-live-card atlas-card">
                        <div class="comm-live-title">公告 / 活動倍率 / 掉落配置</div>
                        <div class="comm-live-copy">目前已能讀取 runtime ops，作為 live ops 的唯讀入口。</div>
                  </div>
            `;
      }

      private _overviewCard(title: string, value: string, copy: string): string {
            return `
                  <div class="comm-overview-card atlas-card">
                        <span class="comm-overview-label">${title}</span>
                        <span class="comm-overview-value">${value}</span>
                        <span class="comm-overview-copy">${copy}</span>
                  </div>
            `;
      }

      private _previewCard(title: string, status: string, copy: string): string {
            return `
                  <div class="comm-preview-card atlas-card">
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

            const overview = document.createElement('div');
            overview.className = 'comm-overview-grid';
            overview.innerHTML = `
                  ${this._overviewCard('公告', `${messages.length}`, '目前載入的公告數量')}
                  ${this._overviewCard('活動檔', `${events.length}`, 'runtime 活動倍率')}
                  ${this._overviewCard('地圖掉落', `${dropMaps.length}`, '活動掉落配置')}
            `;
            body.appendChild(overview);

            const sectionTop = document.createElement('div');
            sectionTop.className = 'comm-section-title';
            sectionTop.textContent = '最新公告';
            body.appendChild(sectionTop);

            const list = document.createElement('div');
            list.className = 'comm-notice-list atlas-card';
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
                        row.className = 'comm-notice-row';
                        row.innerHTML = `
                              <span class="comm-notice-type">${this._escapeHtml(msg.type || 'SYSTEM')}</span>
                              <span class="comm-notice-text">${this._escapeHtml(msg.message)}</span>
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
            eventCard.className = 'comm-live-card atlas-card';
            const active = events[0];
            if (!active) {
                  eventCard.innerHTML = '<div class="comm-live-title">目前沒有活動配置</div><div class="comm-live-copy">當前沒有生效中的倍率活動。</div>';
            } else {
                  eventCard.innerHTML = `
                        <div class="comm-live-title">掉蛋 x${active.coreRate || 0} · 經驗 x${active.expRate || 0} · 掉寶 x${active.itemRate || 0} · GP x${active.gpRate || 0}</div>
                        <div class="comm-live-copy">${this._escapeHtml(active.eventStart || '-')} 至 ${this._escapeHtml(active.eventEnd || '-')}</div>
                  `;
            }
            body.appendChild(eventCard);

            const sectionBottom = document.createElement('div');
            sectionBottom.className = 'comm-section-title';
            sectionBottom.textContent = '活動地圖掉落配置';
            body.appendChild(sectionBottom);

            const mapWrap = document.createElement('div');
            mapWrap.className = 'comm-runtime-grid';
            if (dropMaps.length <= 0) {
                  mapWrap.innerHTML = '<div class="comm-live-card atlas-card">目前沒有活動地圖掉落設定</div>';
            } else {
                  for (const row of dropMaps) {
                        const card = document.createElement('div');
                        card.className = 'comm-runtime-card atlas-card';
                        card.innerHTML = `
                              <div class="comm-runtime-name">${this._escapeHtml(row.mapName)}</div>
                              <div class="comm-runtime-copy">${row.configuredDropSlots} 格活動掉落</div>
                        `;
                        mapWrap.appendChild(card);
                  }
            }
            body.appendChild(mapWrap);
      }

      private _scheduleFit(): void {
            if (this._el.classList.contains('ui-panel-atlas')) return;
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            this._fitPanelScale();
            this._fitFrameId = requestAnimationFrame(() => this._fitPanelScale());
      }

      private _fitPanelScale(): void {
            if (this._el.classList.contains('ui-panel-atlas')) {
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

      private _escapeHtml(value: string): string {
            return String(value ?? '')
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }
}

