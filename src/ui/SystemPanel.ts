import dataHealthRaw from '../data/runtime/data.health.json';
import { listRuntimeHeroTemplates, type RuntimeHeroTemplate } from '../data/runtime/RuntimeProgression';
import { localKeyValueStore } from '../services/adapters/local/LocalStorageKV';
import { createPanelHeader } from './layout/PanelHeader';

type SysTabId = 'controls' | 'account' | 'data' | 'about';

export interface SystemSettings {
      joystickSensitivity: number;
      cameraSensitivity: number;
      invertCameraY: boolean;
      autoLockTarget: boolean;
}

export interface SystemPanelActionResult {
      ok: boolean;
      message: string;
}

export interface SystemPanelAccountView {
      uid: string;
      storageLabel: string;
      currentHeroType?: number;
      socialNote?: string;
      roomNote?: string;
}

export interface SystemPanelCallbacks {
      onSettingsChange?: (settings: SystemSettings) => void;
      onSaveProgress?: () => Promise<SystemPanelActionResult> | SystemPanelActionResult;
      onLoadProgress?: () => Promise<SystemPanelActionResult> | SystemPanelActionResult;
      onResetAll?: () => Promise<SystemPanelActionResult> | SystemPanelActionResult;
      getAccountView?: () => SystemPanelAccountView;
      onHeroTypeChange?: (heroType: number) => Promise<SystemPanelActionResult> | SystemPanelActionResult;
      onOpenSocialPreview?: () => void;
}

interface RuntimeDataHealthPayload {
      builtAt?: string;
      validation?: {
            totalChecks?: number;
            passedChecks?: number;
            failedChecks?: number;
            invalidRefsTotal?: number;
            rawInvalidRefsTotal?: number;
            suppressedByRuntimeRepairsTotal?: number;
            suppressedByOverridesTotal?: number;
      };
      runtime?: {
            sourceTableCount?: number;
            sourceDigest?: string;
            unassignedSourceTables?: string[];
            assignedButMissingSourceTables?: string[];
            outputs?: Record<string, Record<string, unknown>>;
      };
}

const STORAGE_KEY = 'fpo.system.settings.v2';
const DATA_HEALTH = (dataHealthRaw as RuntimeDataHealthPayload) ?? {};
const HEROES = listRuntimeHeroTemplates();

const DEFAULT_SETTINGS: SystemSettings = {
      joystickSensitivity: 1.0,
      cameraSensitivity: 1.0,
      invertCameraY: false,
      autoLockTarget: true,
};

function clampSetting(value: number, min: number, max: number, fallback: number): number {
      if (!Number.isFinite(value)) return fallback;
      return Math.max(min, Math.min(max, value));
}

export class SystemPanel {
      readonly panelId = 'settings';
      private _el: HTMLDivElement;
      private _visible = false;
      private _tab: SysTabId = 'controls';
      private _settings: SystemSettings;
      private _callbacks: SystemPanelCallbacks;
      private _fitFrameId = 0;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._scheduleFit();
      };

      constructor(callbacks: SystemPanelCallbacks = {}) {
            this._callbacks = callbacks;
            this._settings = this._loadSettings();

            this._el = document.createElement('div');
            this._el.id = 'sys-panel';
            this._el.className = 'sa-panel sys-root ui-panel-atlas';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      private _render(): void {
            const account = this._getAccountView();
            const validation = DATA_HEALTH.validation ?? {};
            const passedChecks = Number(validation.passedChecks ?? 0);
            const totalChecks = Number(validation.totalChecks ?? 0);
            const headerMeta = this._panelSubtitle();
            const headerSummary = this._panelSummary(account, passedChecks, totalChecks);
            this._el.innerHTML = `
                  <div class="sys-header">
                        <div class="sys-overview">
                              <div class="sys-overview-main">
                                    <div class="atlas-kicker">Adventure Atlas</div>
                                    <div class="sys-overview-title">本機控制中心</div>
                                    <div class="sys-overview-copy">只保留已接線、會立即生效、而且真的存在於目前 build 的設定與服務邊界。</div>
                              </div>
                              <div class="sys-overview-card">
                                    <span>資料模式</span>
                                    <strong>${this._escapeHtml(account.storageLabel)}</strong>
                              </div>
                              <div class="sys-overview-card">
                                    <span>設定套用</span>
                                    <strong>即時生效</strong>
                              </div>
                              <div class="sys-overview-card">
                                    <span>Validation</span>
                                    <strong>${passedChecks}/${totalChecks}</strong>
                              </div>
                        </div>
                        <div class="sys-tabs">
                              <button class="sa-tag${this._tab === 'controls' ? ' sa-tag-active' : ''}" data-tab="controls">操作</button>
                              <button class="sa-tag${this._tab === 'account' ? ' sa-tag-active' : ''}" data-tab="account">帳號</button>
                              <button class="sa-tag${this._tab === 'data' ? ' sa-tag-active' : ''}" data-tab="data">DATA</button>
                              <button class="sa-tag${this._tab === 'about' ? ' sa-tag-active' : ''}" data-tab="about">關於</button>
                        </div>
                  </div>
                  <div class="sys-body" id="sys-body"></div>
            `;

            const { root: title } = createPanelHeader({
                  icon: 'settings',
                  kicker: 'Command Ledger',
                  title: '控制中心',
                  subtitle: headerMeta,
                  summaryText: headerSummary,
                  summaryClassName: 'sys-header-pill',
                  closeLabel: '關閉控制中心',
                  closeId: 'sys-close',
                  closeText: '✕',
                  onClose: () => this.hide(),
            });
            this._el.prepend(title);
            this._el.querySelectorAll('.sa-tag[data-tab]').forEach((btn) => {
                  btn.addEventListener('click', () => {
                        this._tab = (btn as HTMLElement).dataset.tab as SysTabId;
                        this._render();
                  });
            });

            const body = this._el.querySelector('#sys-body') as HTMLDivElement;
            switch (this._tab) {
                  case 'controls': this._renderControlsTab(body); break;
                  case 'account': this._renderAccountTab(body); break;
                  case 'data': this._renderDataTab(body); break;
                  case 'about': this._renderAboutTab(body); break;
            }

            this._scheduleFit();
      }

      private _panelSubtitle(): string {
            switch (this._tab) {
                  case 'account':
                        return '本機資料、角色模板與後續服務邊界整理';
                  case 'data':
                        return 'runtime 建置摘要、來源對應與輸出統計';
                  case 'about':
                        return '專案定位、版本狀態與工作入口';
                  case 'controls':
                  default:
                        return '搖桿、視角與戰鬥輔助只保留目前已接線項';
            }
      }

      private _panelSummary(account: SystemPanelAccountView, passedChecks: number, totalChecks: number): string {
            switch (this._tab) {
                  case 'account':
                        return account.storageLabel.includes('本機') ? '本機資料模式' : account.storageLabel;
                  case 'data':
                        return `驗證 ${passedChecks}/${totalChecks}`;
                  case 'about':
                        return 'runtime-aligned';
                  case 'controls':
                  default:
                        return '即時生效';
            }
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

            const scale = Math.max(0.6, Math.min(1, available / needed));
            this._el.style.setProperty('transform', `translate(-50%, -50%) scale(${scale})`, 'important');
      }

      private _renderControlsTab(body: HTMLDivElement): void {
            const s = this._settings;
            body.innerHTML = `
                  <div class="atlas-shell sys-shell">
                        <div class="sys-grid">
                              <section class="sys-card">
                                    <div class="atlas-kicker">Movement</div>
                                    <div class="sys-card-title">移動手感</div>
                                    <div class="sys-card-copy">針對手機橫向調整搖桿速度，變更後立即套用。</div>
                                    <div class="sys-row">
                                          <span class="sys-label">搖桿靈敏度</span>
                                          <div class="sys-slider-group">
                                                <input type="range" class="sys-slider" id="sys-joy" min="50" max="200" step="10" value="${s.joystickSensitivity * 100}">
                                                <span class="sys-value" id="sys-joy-val">${s.joystickSensitivity.toFixed(1)}x</span>
                                          </div>
                                    </div>
                              </section>

                              <section class="sys-card">
                                    <div class="atlas-kicker">Camera</div>
                                    <div class="sys-card-title">視角控制</div>
                                    <div class="sys-card-copy">保留必要的視角微調，避免堆一整頁還沒接線的假設定。</div>
                                    <div class="sys-row">
                                          <span class="sys-label">視角靈敏度</span>
                                          <div class="sys-slider-group">
                                                <input type="range" class="sys-slider" id="sys-cam" min="50" max="200" step="10" value="${s.cameraSensitivity * 100}">
                                                <span class="sys-value" id="sys-cam-val">${s.cameraSensitivity.toFixed(1)}x</span>
                                          </div>
                                    </div>
                                    <div class="sys-row">
                                          <span class="sys-label">反轉 Y 軸</span>
                                          <label class="sys-toggle-wrap">
                                                <input type="checkbox" class="sys-toggle-input" id="sys-invert" ${s.invertCameraY ? 'checked' : ''}>
                                                <span class="sys-toggle-track"><span class="sys-toggle-thumb"></span></span>
                                          </label>
                                    </div>
                              </section>

                              <section class="sys-card">
                                    <div class="atlas-kicker">Combat Assist</div>
                                    <div class="sys-card-title">戰鬥輔助</div>
                                    <div class="sys-card-copy">目前只保留自動鎖定這個真實存在的 combat helper。</div>
                                    <div class="sys-row">
                                          <span class="sys-label">自動鎖定目標</span>
                                          <label class="sys-toggle-wrap">
                                                <input type="checkbox" class="sys-toggle-input" id="sys-autolock" ${s.autoLockTarget ? 'checked' : ''}>
                                                <span class="sys-toggle-track"><span class="sys-toggle-thumb"></span></span>
                                          </label>
                                    </div>
                                    <div class="sys-card-note">畫質、音量、語言等項目仍未接線，因此不再佔用這個面板的空間。</div>
                              </section>

                              <section class="sys-card sys-card-wide">
                                    <div class="atlas-kicker">Scope</div>
                                    <div class="sys-card-title">目前接線範圍</div>
                                    <div class="sys-pill-row">
                                          <span class="sys-pill">joystickSensitivity</span>
                                          <span class="sys-pill">cameraSensitivity</span>
                                          <span class="sys-pill">invertCameraY</span>
                                          <span class="sys-pill">autoLockTarget</span>
                                    </div>
                                    <div class="sys-card-note">這四項會直接寫入 runtime settings，其他選項等真的落地後再回到這裡。</div>
                              </section>
                        </div>
                  </div>
            `;

            this._bindSlider(body, 'sys-joy', 'sys-joy-val', (v) => { this._settings.joystickSensitivity = v / 100; }, (v) => `${(v / 100).toFixed(1)}x`);
            this._bindSlider(body, 'sys-cam', 'sys-cam-val', (v) => { this._settings.cameraSensitivity = v / 100; }, (v) => `${(v / 100).toFixed(1)}x`);
            body.querySelector('#sys-invert')?.addEventListener('change', (e) => {
                  this._settings.invertCameraY = (e.target as HTMLInputElement).checked;
                  this._save();
            });
            body.querySelector('#sys-autolock')?.addEventListener('change', (e) => {
                  this._settings.autoLockTarget = (e.target as HTMLInputElement).checked;
                  this._save();
            });
      }

      private _renderAccountTab(body: HTMLDivElement): void {
            const account = this._getAccountView();
            const canSwitchHero = HEROES.length > 0 && !!this._callbacks.onHeroTypeChange;

            body.innerHTML = `
                  <div class="atlas-shell sys-shell">
                        <div class="sys-grid">
                              <section class="sys-card">
                                    <div class="atlas-kicker">Local Profile</div>
                                    <div class="sys-card-title">本機資料模式</div>
                                    <div class="sys-row">
                                          <span class="sys-label">玩家 UID</span>
                                          <span class="sys-info">${this._escapeHtml(account.uid)}</span>
                                    </div>
                                    <div class="sys-row">
                                          <span class="sys-label">資料儲存</span>
                                          <span class="sys-info">${this._escapeHtml(account.storageLabel)}</span>
                                    </div>
                                    <div class="sys-card-note">目前仍是 local-first 單機模式，尚未接入雲端帳號、多人房間或即時社交服務。</div>
                              </section>

                              <section class="sys-card">
                                    <div class="atlas-kicker">Hero Template</div>
                                    <div class="sys-card-title">角色模板</div>
                                    ${canSwitchHero ? `
                                          <div class="sys-row sys-row-stack">
                                                <span class="sys-label">職業模板</span>
                                                <select class="sys-select" id="sys-hero-type">
                                                      ${HEROES.map((hero) => {
                                                            const selected = account.currentHeroType === hero.type ? 'selected' : '';
                                                            return `<option value="${hero.type}" ${selected}>${this._escapeHtml(this._heroLabel(hero))}</option>`;
                                                      }).join('')}
                                                </select>
                                          </div>
                                          <div class="sys-btn-group">
                                                <button class="sys-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-primary" id="sys-hero-apply">套用職業（重開生效）</button>
                                          </div>
                                    ` : '<div class="sys-card-note">目前未啟用職業切換。</div>'}
                              </section>

                              <section class="sys-card">
                                    <div class="atlas-kicker">Service Boundary</div>
                                    <div class="sys-card-title">後續服務邊界</div>
                                    <div class="sys-row">
                                          <span class="sys-label">社交服務</span>
                                          <span class="sys-info">${this._escapeHtml(account.socialNote ?? '本機模式，尚未上線')}</span>
                                    </div>
                                    <div class="sys-row">
                                          <span class="sys-label">房間服務</span>
                                          <span class="sys-info">${this._escapeHtml(account.roomNote ?? '本機模式，尚未上線')}</span>
                                    </div>
                                    <div class="sys-btn-group">
                                          <button class="sys-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-secondary" id="sys-social-preview">社交預覽</button>
                                    </div>
                              </section>

                              <section class="sys-card">
                                    <div class="atlas-kicker">Save Flow</div>
                                    <div class="sys-card-title">存檔管理</div>
                                    <div class="sys-card-copy">本機快照會覆蓋目前進度，讀取前請先確認狀態。</div>
                                    <div class="sys-btn-group">
                                          <button class="sys-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-primary" id="sys-save">儲存進度</button>
                                          <button class="sys-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-secondary" id="sys-load">讀取進度</button>
                                    </div>
                              </section>

                              <section class="sys-card sys-card-danger">
                                    <div class="atlas-kicker">Danger Zone</div>
                                    <div class="sys-card-title">重置所有資料</div>
                                    <div class="sys-card-copy">這會清除本機角色、寵物、背包與進度，而且不可復原。</div>
                                    <div class="sys-btn-group">
                                          <button class="sys-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-danger" id="sys-reset">重置所有資料</button>
                                    </div>
                              </section>
                        </div>
                  </div>
            `;

            if (canSwitchHero) {
                  body.querySelector('#sys-hero-apply')?.addEventListener('click', async () => {
                        const select = body.querySelector('#sys-hero-type') as HTMLSelectElement | null;
                        const heroType = Number(select?.value ?? NaN);
                        if (!Number.isFinite(heroType)) return;
                        await this._runAction(this._callbacks.onHeroTypeChange?.(Math.floor(heroType)), '已更新職業模板，重開後生效');
                  });
            }

            body.querySelector('#sys-save')?.addEventListener('click', async () => {
                  await this._runAction(this._callbacks.onSaveProgress?.(), '進度已儲存');
            });
            body.querySelector('#sys-social-preview')?.addEventListener('click', () => {
                  this._callbacks.onOpenSocialPreview?.();
            });
            body.querySelector('#sys-load')?.addEventListener('click', async () => {
                  if (!confirm('讀取進度將覆蓋目前資料，是否繼續？')) return;
                  await this._runAction(this._callbacks.onLoadProgress?.(), '已讀取進度');
            });
            body.querySelector('#sys-reset')?.addEventListener('click', async () => {
                  if (!confirm('確定重置所有資料？此操作不可復原。')) return;
                  if (!confirm('再次確認：角色、寵物、背包都會清空。')) return;
                  await this._runAction(this._callbacks.onResetAll?.(), '資料已重置');
            });
      }

      private _renderDataTab(body: HTMLDivElement): void {
            const validation = DATA_HEALTH.validation ?? {};
            const runtime = DATA_HEALTH.runtime ?? {};
            const outputs = runtime.outputs ?? {};
            const digest = String(runtime.sourceDigest ?? '').trim();
            const digestShort = digest ? `${digest.slice(0, 12)}…${digest.slice(-8)}` : '-';
            const unassigned = Array.isArray(runtime.unassignedSourceTables) ? runtime.unassignedSourceTables : [];
            const missing = Array.isArray(runtime.assignedButMissingSourceTables) ? runtime.assignedButMissingSourceTables : [];
            const outputRows = Object.entries(outputs).sort((a, b) => a[0].localeCompare(b[0], 'zh-Hant'));
            const builtAt = String(DATA_HEALTH.builtAt ?? '').trim();

            body.innerHTML = `
                  <div class="atlas-shell sys-shell">
                        <div class="sys-health-grid">
                              <div class="sys-health-card">
                                    <div class="sys-health-label">Validation</div>
                                    <div class="sys-health-value">${Number(validation.passedChecks ?? 0)}/${Number(validation.totalChecks ?? 0)}</div>
                                    <div class="sys-health-sub">通過檢查</div>
                              </div>
                              <div class="sys-health-card">
                                    <div class="sys-health-label">Raw Ref</div>
                                    <div class="sys-health-value">${Number(validation.rawInvalidRefsTotal ?? 0)}</div>
                                    <div class="sys-health-sub">原始缺參照</div>
                              </div>
                              <div class="sys-health-card">
                                    <div class="sys-health-label">Effective Ref</div>
                                    <div class="sys-health-value">${Number(validation.invalidRefsTotal ?? 0)}</div>
                                    <div class="sys-health-sub">生效錯誤</div>
                              </div>
                              <div class="sys-health-card">
                                    <div class="sys-health-label">Suppressed</div>
                                    <div class="sys-health-value">${Number(validation.suppressedByRuntimeRepairsTotal ?? validation.suppressedByOverridesTotal ?? 0)}</div>
                                    <div class="sys-health-sub">資料修復補齊</div>
                              </div>
                        </div>

                        <div class="sys-grid sys-grid-data">
                              <section class="sys-card">
                                    <div class="atlas-kicker">Runtime Snapshot</div>
                                    <div class="sys-card-title">Runtime 摘要</div>
                                    <div class="sys-row"><span class="sys-label">來源表數量</span><span class="sys-info">${Number(runtime.sourceTableCount ?? 0)}</span></div>
                                    <div class="sys-row"><span class="sys-label">資料指紋</span><span class="sys-info">${this._escapeHtml(digestShort)}</span></div>
                                    <div class="sys-row"><span class="sys-label">未分派來源表</span><span class="sys-info">${unassigned.length}</span></div>
                                    <div class="sys-row"><span class="sys-label">分派缺失來源表</span><span class="sys-info">${missing.length}</span></div>
                                    <div class="sys-row"><span class="sys-label">建置時間</span><span class="sys-info">${this._escapeHtml(builtAt || '未知')}</span></div>
                              </section>

                              <section class="sys-card sys-card-table">
                                    <div class="atlas-kicker">Outputs</div>
                                    <div class="sys-card-title">輸出統計</div>
                                    <div class="sys-health-table">
                                          <div class="sys-health-head"><span>輸出</span><span>重點統計</span></div>
                                          ${outputRows.length > 0
                                                ? outputRows.map(([name, stats]) => {
                                                      const statText = Object.entries(stats ?? {})
                                                            .slice(0, 4)
                                                            .map(([k, v]) => `${k}=${v}`)
                                                            .join(' · ');
                                                      return `
                                                            <div class="sys-health-row">
                                                                  <span class="sys-health-out">${this._escapeHtml(name)}</span>
                                                                  <span class="sys-health-stat">${this._escapeHtml(statText || '-')}</span>
                                                            </div>
                                                      `;
                                                }).join('')
                                                : '<div class="sys-health-row"><span class="sys-health-out">-</span><span class="sys-health-stat">尚無資料</span></div>'}
                                    </div>
                              </section>
                        </div>
                  </div>
            `;
      }

      private _renderAboutTab(body: HTMLDivElement): void {
            body.innerHTML = `
                  <div class="atlas-shell sys-shell">
                        <section class="sys-card sys-card-hero">
                              <div class="atlas-kicker">About</div>
                              <div class="sys-about-title">Fantasy Pet Online</div>
                              <div class="sys-about-subtitle">Local-first Babylon.js pet RPG</div>
                              <div class="sys-about-version">v0.9.0 · runtime-aligned</div>
                              <div class="sys-card-note">本頁只呈現目前已落地能力，不再偽裝成已上線的 live service。</div>
                        </section>
                        <div class="sys-grid">
                              <section class="sys-card">
                                    <div class="atlas-kicker">Boundary</div>
                                    <div class="sys-card-title">目前邊界</div>
                                    <div class="sys-credits">
                                          <div class="sys-credit-row"><span class="sys-credit-role">存檔</span><span class="sys-credit-name">Versioned local DTO</span></div>
                                          <div class="sys-credit-row"><span class="sys-credit-role">帳號</span><span class="sys-credit-name">Local adapter only</span></div>
                                          <div class="sys-credit-row"><span class="sys-credit-role">社交 / 房間</span><span class="sys-credit-name">Reserved service interfaces</span></div>
                                    </div>
                              </section>
                              <section class="sys-card">
                                    <div class="atlas-kicker">Project</div>
                                    <div class="sys-card-title">專案入口</div>
                                    <div class="sys-links">
                                          <a href="https://github.com/kachun2021/RPGPRO-01" target="_blank" class="sys-link">GitHub Repository</a>
                                    </div>
                              </section>
                        </div>
                  </div>
            `;
      }

      private _bindSlider(
            container: HTMLElement,
            sliderId: string,
            valueId: string,
            onUpdate: (value: number) => void,
            format?: (value: number) => string,
      ): void {
            const slider = container.querySelector(`#${sliderId}`) as HTMLInputElement | null;
            const valueEl = container.querySelector(`#${valueId}`) as HTMLSpanElement | null;
            if (!slider) return;

            slider.addEventListener('input', () => {
                  const value = parseFloat(slider.value);
                  onUpdate(value);
                  if (valueEl) valueEl.textContent = format ? format(value) : `${Math.round(value)}`;
            });
            slider.addEventListener('change', () => this._save());
      }

      private async _runAction(
            pending: Promise<SystemPanelActionResult> | SystemPanelActionResult | void,
            fallbackSuccess: string,
      ): Promise<void> {
            if (!pending) {
                  this._showToast(fallbackSuccess);
                  return;
            }
            const result = await pending;
            if (result.ok) {
                  this._showToast(result.message || fallbackSuccess);
                  return;
            }
            this._showToast(result.message || '操作失敗', true);
      }

      private _heroLabel(hero: RuntimeHeroTemplate): string {
            return `${hero.name} · Type ${hero.type}`;
      }

      private _getAccountView(): SystemPanelAccountView {
            return this._callbacks.getAccountView?.() ?? {
                  uid: 'FPO-LOCAL',
                  storageLabel: '本機單機資料',
            };
      }

      private _showToast(message: string, isError = false): void {
            const toast = document.createElement('div');
            toast.className = 'sys-toast';
            if (isError) toast.classList.add('is-error');
            toast.textContent = message;
            document.getElementById('ui-layer')?.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                  toast.classList.remove('show');
                  setTimeout(() => toast.remove(), 300);
            }, 2200);
      }

      private _save(): void {
            localKeyValueStore.setJson(STORAGE_KEY, this._settings);
            this._callbacks.onSettingsChange?.(this._settings);
      }

      private _loadSettings(): SystemSettings {
            const raw = localKeyValueStore.getJson<Partial<SystemSettings>>(STORAGE_KEY);
            return this._normalizeSettings(raw ?? {});
      }

      private _normalizeSettings(raw: Partial<SystemSettings>): SystemSettings {
            return {
                  joystickSensitivity: clampSetting(Number(raw.joystickSensitivity ?? DEFAULT_SETTINGS.joystickSensitivity), 0.5, 2, DEFAULT_SETTINGS.joystickSensitivity),
                  cameraSensitivity: clampSetting(Number(raw.cameraSensitivity ?? DEFAULT_SETTINGS.cameraSensitivity), 0.5, 2, DEFAULT_SETTINGS.cameraSensitivity),
                  invertCameraY: raw.invertCameraY === true,
                  autoLockTarget: raw.autoLockTarget !== false,
            };
      }

      private _escapeHtml(value: string): string {
            return value
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }

      get settings(): SystemSettings { return { ...this._settings }; }
      get isVisible(): boolean { return this._visible; }

      applySettings(settings: Partial<SystemSettings>): void {
            this._settings = this._normalizeSettings(settings);
            this._save();
            if (this._visible) this._render();
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
}

