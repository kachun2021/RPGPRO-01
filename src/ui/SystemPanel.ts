import dataHealthRaw from '../data/runtime/data.health.json';
import { listRuntimeHeroTemplates, type RuntimeHeroTemplate } from '../data/runtime/RuntimeProgression';

type SysTabId = 'general' | 'controls' | 'account' | 'data' | 'about';

export interface SystemSettings {
      graphicsQuality: 'low' | 'medium' | 'high';
      resolutionScale: number;
      showFps: boolean;
      bgmVolume: number;
      sfxVolume: number;
      language: 'zh-TW' | 'en';
      joystickSensitivity: number;
      cameraSensitivity: number;
      invertCameraY: boolean;
      autoLockTarget: boolean;
}

export interface SystemPanelCallbacks {
      onSettingsChange?: (settings: SystemSettings) => void;
      onSaveProgress?: () => void;
      onLoadProgress?: () => void;
      onResetAll?: () => void;
      getCurrentHeroType?: () => number;
      onHeroTypeChange?: (heroType: number) => void;
}

interface RuntimeDataHealthPayload {
      builtAt?: string;
      validation?: {
            totalChecks?: number;
            passedChecks?: number;
            failedChecks?: number;
            invalidRefsTotal?: number;
            rawInvalidRefsTotal?: number;
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

const STORAGE_KEY = 'fpo.system.settings.v1';
const DATA_HEALTH = (dataHealthRaw as RuntimeDataHealthPayload) ?? {};
const HEROES = listRuntimeHeroTemplates();

const DEFAULT_SETTINGS: SystemSettings = {
      graphicsQuality: 'high',
      resolutionScale: 1.0,
      showFps: false,
      bgmVolume: 70,
      sfxVolume: 80,
      language: 'zh-TW',
      joystickSensitivity: 1.0,
      cameraSensitivity: 1.0,
      invertCameraY: false,
      autoLockTarget: true,
};

const QUALITY_LABELS: Record<SystemSettings['graphicsQuality'], string> = {
      low: '低',
      medium: '中',
      high: '高',
};

const LANG_LABELS: Record<SystemSettings['language'], string> = {
      'zh-TW': '繁體中文',
      en: 'English',
};

export class SystemPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _tab: SysTabId = 'general';
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
            this._el.className = 'sa-panel sys-root';
            this._el.style.display = 'none';
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      private _render(): void {
            this._el.innerHTML = `
                  <div class="sa-panel-title">
                        ⚙️ 系統設定
                        <span class="panel-close" id="sys-close">✕</span>
                  </div>
                  <div class="sys-tabs">
                        <button class="sa-tag${this._tab === 'general' ? ' sa-tag-active' : ''}" data-tab="general">🎛 一般</button>
                        <button class="sa-tag${this._tab === 'controls' ? ' sa-tag-active' : ''}" data-tab="controls">🕹 操作</button>
                        <button class="sa-tag${this._tab === 'account' ? ' sa-tag-active' : ''}" data-tab="account">💾 帳號</button>
                        <button class="sa-tag${this._tab === 'data' ? ' sa-tag-active' : ''}" data-tab="data">📊 DATA</button>
                        <button class="sa-tag${this._tab === 'about' ? ' sa-tag-active' : ''}" data-tab="about">ℹ 關於</button>
                  </div>
                  <div class="sys-body" id="sys-body"></div>
            `;

            this._el.querySelector('#sys-close')?.addEventListener('click', () => this.hide());
            this._el.querySelectorAll('.sa-tag[data-tab]').forEach((btn) => {
                  btn.addEventListener('click', () => {
                        this._tab = (btn as HTMLElement).dataset.tab as SysTabId;
                        this._render();
                  });
            });

            const body = this._el.querySelector('#sys-body') as HTMLDivElement;
            switch (this._tab) {
                  case 'general': this._renderGeneralTab(body); break;
                  case 'controls': this._renderControlsTab(body); break;
                  case 'account': this._renderAccountTab(body); break;
                  case 'data': this._renderDataTab(body); break;
                  case 'about': this._renderAboutTab(body); break;
            }

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

            const scale = Math.max(0.6, Math.min(1, available / needed));
            this._el.style.setProperty('transform', `translate(-50%, -50%) scale(${scale})`, 'important');
      }

      private _renderGeneralTab(body: HTMLDivElement): void {
            const s = this._settings;
            body.innerHTML = `
                  <div class="sys-section-header">🖼 畫面</div>
                  <div class="sys-row">
                        <span class="sys-label">畫質</span>
                        <div class="sys-quality-group">
                              ${(['low', 'medium', 'high'] as const).map((q) => `
                                    <button class="sys-quality-btn${s.graphicsQuality === q ? ' active' : ''}" data-quality="${q}">
                                          ${QUALITY_LABELS[q]}
                                    </button>
                              `).join('')}
                        </div>
                  </div>
                  <div class="sys-row">
                        <span class="sys-label">解析度比例</span>
                        <div class="sys-slider-group">
                              <input type="range" class="sys-slider" id="sys-resolution" min="50" max="100" step="5" value="${s.resolutionScale * 100}">
                              <span class="sys-value" id="sys-resolution-val">${Math.round(s.resolutionScale * 100)}%</span>
                        </div>
                  </div>
                  <div class="sys-row">
                        <span class="sys-label">顯示 FPS</span>
                        <label class="sys-toggle-wrap">
                              <input type="checkbox" class="sys-toggle-input" id="sys-fps" ${s.showFps ? 'checked' : ''}>
                              <span class="sys-toggle-track"><span class="sys-toggle-thumb"></span></span>
                        </label>
                  </div>

                  <div class="sys-section-header">🔊 音量</div>
                  <div class="sys-row">
                        <span class="sys-label">背景音樂</span>
                        <div class="sys-slider-group">
                              <input type="range" class="sys-slider" id="sys-bgm" min="0" max="100" step="1" value="${s.bgmVolume}">
                              <span class="sys-value" id="sys-bgm-val">${s.bgmVolume}</span>
                        </div>
                  </div>
                  <div class="sys-row">
                        <span class="sys-label">音效</span>
                        <div class="sys-slider-group">
                              <input type="range" class="sys-slider" id="sys-sfx" min="0" max="100" step="1" value="${s.sfxVolume}">
                              <span class="sys-value" id="sys-sfx-val">${s.sfxVolume}</span>
                        </div>
                  </div>

                  <div class="sys-section-header">🌐 語言</div>
                  <div class="sys-row">
                        <span class="sys-label">語言</span>
                        <select class="sys-select" id="sys-lang">
                              ${Object.entries(LANG_LABELS).map(([k, v]) => `
                                    <option value="${k}" ${s.language === k ? 'selected' : ''}>${v}</option>
                              `).join('')}
                        </select>
                  </div>
            `;

            body.querySelectorAll('.sys-quality-btn').forEach((btn) => {
                  btn.addEventListener('click', () => {
                        this._settings.graphicsQuality = (btn as HTMLElement).dataset.quality as SystemSettings['graphicsQuality'];
                        this._save();
                        this._render();
                  });
            });
            this._bindSlider(body, 'sys-resolution', 'sys-resolution-val', (v) => { this._settings.resolutionScale = v / 100; }, (v) => `${Math.round(v)}%`);
            this._bindSlider(body, 'sys-bgm', 'sys-bgm-val', (v) => { this._settings.bgmVolume = v; });
            this._bindSlider(body, 'sys-sfx', 'sys-sfx-val', (v) => { this._settings.sfxVolume = v; });

            body.querySelector('#sys-fps')?.addEventListener('change', (e) => {
                  this._settings.showFps = (e.target as HTMLInputElement).checked;
                  this._save();
            });
            body.querySelector('#sys-lang')?.addEventListener('change', (e) => {
                  this._settings.language = (e.target as HTMLSelectElement).value as SystemSettings['language'];
                  this._save();
            });
      }

      private _renderControlsTab(body: HTMLDivElement): void {
            const s = this._settings;
            body.innerHTML = `
                  <div class="sys-section-header">🕹 移動</div>
                  <div class="sys-row">
                        <span class="sys-label">搖桿靈敏度</span>
                        <div class="sys-slider-group">
                              <input type="range" class="sys-slider" id="sys-joy" min="50" max="200" step="10" value="${s.joystickSensitivity * 100}">
                              <span class="sys-value" id="sys-joy-val">${s.joystickSensitivity.toFixed(1)}x</span>
                        </div>
                  </div>

                  <div class="sys-section-header">🎥 視角</div>
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

                  <div class="sys-section-header">⚔ 戰鬥</div>
                  <div class="sys-row">
                        <span class="sys-label">自動鎖定目標</span>
                        <label class="sys-toggle-wrap">
                              <input type="checkbox" class="sys-toggle-input" id="sys-autolock" ${s.autoLockTarget ? 'checked' : ''}>
                              <span class="sys-toggle-track"><span class="sys-toggle-thumb"></span></span>
                        </label>
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
            const uid = this._generateUID();
            const currentHeroType = this._callbacks.getCurrentHeroType?.();
            const canSwitchHero = HEROES.length > 0 && !!this._callbacks.onHeroTypeChange;

            body.innerHTML = `
                  <div class="sys-section-header">🔐 帳號資訊</div>
                  <div class="sys-row">
                        <span class="sys-label">玩家 UID</span>
                        <span class="sys-info">${uid}</span>
                  </div>

                  <div class="sys-section-header">👤 角色建立</div>
                  ${canSwitchHero ? `
                        <div class="sys-row">
                              <span class="sys-label">職業模板</span>
                              <select class="sys-select" id="sys-hero-type">
                                    ${HEROES.map((hero) => {
                                          const selected = currentHeroType === hero.type ? 'selected' : '';
                                          return `<option value="${hero.type}" ${selected}>${this._escapeHtml(hero.name)}（Type ${hero.type}）</option>`;
                                    }).join('')}
                              </select>
                        </div>
                        <div class="sys-btn-group">
                              <button class="sys-btn btn-gold" id="sys-hero-apply">套用職業（重開生效）</button>
                        </div>
                  ` : '<div class="sys-danger-note">目前未啟用職業切換。</div>'}

                  <div class="sys-section-header">💾 存檔管理</div>
                  <div class="sys-btn-group">
                        <button class="sys-btn btn-gold" id="sys-save">💾 儲存進度</button>
                        <button class="sys-btn" id="sys-load">📂 讀取進度</button>
                  </div>

                  <div class="sys-section-header">⚠ 危險操作</div>
                  <div class="sys-btn-group">
                        <button class="sys-btn sys-btn-danger" id="sys-reset">🗑 重置所有資料</button>
                  </div>
                  <div class="sys-danger-note">重置會清除本機儲存的所有資料，且不可復原。</div>
            `;

            if (canSwitchHero) {
                  body.querySelector('#sys-hero-apply')?.addEventListener('click', () => {
                        const select = body.querySelector('#sys-hero-type') as HTMLSelectElement | null;
                        const heroType = Number(select?.value ?? NaN);
                        if (!Number.isFinite(heroType)) return;
                        this._callbacks.onHeroTypeChange?.(Math.floor(heroType));
                        this._showToast('已更新職業模板，重開後生效');
                  });
            }

            body.querySelector('#sys-save')?.addEventListener('click', () => {
                  this._callbacks.onSaveProgress?.();
                  this._showToast('進度已儲存');
            });
            body.querySelector('#sys-load')?.addEventListener('click', () => {
                  if (!confirm('讀取進度將覆蓋目前資料，是否繼續？')) return;
                  this._callbacks.onLoadProgress?.();
                  this._showToast('已讀取進度');
            });
            body.querySelector('#sys-reset')?.addEventListener('click', () => {
                  if (!confirm('確定重置所有資料？此操作不可復原。')) return;
                  if (!confirm('再次確認：角色、寵物、背包都會清空。')) return;
                  this._callbacks.onResetAll?.();
                  this._showToast('資料已重置');
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

            body.innerHTML = `
                  <div class="sys-section-header">📊 資料健康（唯讀）</div>
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
                              <div class="sys-health-value">${Number(validation.suppressedByOverridesTotal ?? 0)}</div>
                              <div class="sys-health-sub">規則覆蓋</div>
                        </div>
                  </div>

                  <div class="sys-section-header">🧭 Runtime 摘要</div>
                  <div class="sys-row"><span class="sys-label">來源表數量</span><span class="sys-info">${Number(runtime.sourceTableCount ?? 0)}</span></div>
                  <div class="sys-row"><span class="sys-label">資料指紋</span><span class="sys-info">${this._escapeHtml(digestShort)}</span></div>
                  <div class="sys-row"><span class="sys-label">未分派來源表</span><span class="sys-info">${unassigned.length}</span></div>
                  <div class="sys-row"><span class="sys-label">分派缺失來源表</span><span class="sys-info">${missing.length}</span></div>

                  <div class="sys-section-header">🧩 輸出統計</div>
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
            `;
      }

      private _renderAboutTab(body: HTMLDivElement): void {
            body.innerHTML = `
                  <div class="sys-about-hero">
                        <div class="sys-about-title">Fantasy Pet Online</div>
                        <div class="sys-about-subtitle">Stone Age Fantasy MMO RPG</div>
                        <div class="sys-about-version">v0.9.0 · GEMINI_v3</div>
                  </div>
                  <div class="sys-section-header">👨‍💻 製作團隊</div>
                  <div class="sys-credits">
                        <div class="sys-credit-row"><span class="sys-credit-role">Game Design</span><span class="sys-credit-name">kachun2021</span></div>
                        <div class="sys-credit-row"><span class="sys-credit-role">Engine</span><span class="sys-credit-name">Babylon.js 8.x</span></div>
                        <div class="sys-credit-row"><span class="sys-credit-role">AI Assistant</span><span class="sys-credit-name">Antigravity</span></div>
                  </div>
                  <div class="sys-section-header">🔗 連結</div>
                  <div class="sys-links">
                        <a href="https://github.com/kachun2021/RPGPRO-01" target="_blank" class="sys-link">📝 GitHub Repository</a>
                  </div>
                  <div class="sys-about-footer">© 2026 Fantasy Pet Online. All rights reserved.</div>
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

      private _generateUID(): string {
            let uid = localStorage.getItem('fpo.player.uid');
            if (!uid) {
                  uid = `FPO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                  localStorage.setItem('fpo.player.uid', uid);
            }
            return uid;
      }

      private _showToast(message: string): void {
            const toast = document.createElement('div');
            toast.className = 'sys-toast';
            toast.textContent = message;
            document.getElementById('ui-layer')?.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                  toast.classList.remove('show');
                  setTimeout(() => toast.remove(), 300);
            }, 2000);
      }

      private _save(): void {
            try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
            } catch {
                  // Ignore quota errors.
            }
            this._callbacks.onSettingsChange?.(this._settings);
      }

      private _loadSettings(): SystemSettings {
            try {
                  const raw = localStorage.getItem(STORAGE_KEY);
                  if (!raw) return { ...DEFAULT_SETTINGS };
                  const parsed = JSON.parse(raw);
                  return { ...DEFAULT_SETTINGS, ...parsed };
            } catch {
                  return { ...DEFAULT_SETTINGS };
            }
      }

      private _escapeHtml(value: string): string {
            return value
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }

      get settings(): SystemSettings { return this._settings; }
      get isVisible(): boolean { return this._visible; }

      toggle(): void {
            this._visible ? this.hide() : this.show();
      }

      show(): void {
            this._visible = true;
            this._el.style.display = 'block';
            this._render();
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
            this._el.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
      }

      dispose(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
