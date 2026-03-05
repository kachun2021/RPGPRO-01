/**
 * SystemPanel — 系統設定子界面
 * 4 tabs: General / Controls / Account / About
 * All settings persisted to localStorage.
 */

type SysTabId = 'general' | 'controls' | 'account' | 'about';

export interface SystemSettings {
      graphicsQuality: 'low' | 'medium' | 'high';
      resolutionScale: number;     // 0.5 – 1.0
      showFps: boolean;
      bgmVolume: number;           // 0 – 100
      sfxVolume: number;           // 0 – 100
      language: 'zh-TW' | 'en';
      joystickSensitivity: number; // 0.5 – 2.0
      cameraSensitivity: number;   // 0.5 – 2.0
      invertCameraY: boolean;
      autoLockTarget: boolean;
}

export interface SystemPanelCallbacks {
      onSettingsChange?: (settings: SystemSettings) => void;
      onSaveProgress?: () => void;
      onLoadProgress?: () => void;
      onResetAll?: () => void;
}

const STORAGE_KEY = 'fpo.system.settings.v1';

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

const QUALITY_LABELS: Record<string, string> = { low: '低', medium: '中', high: '高' };
const LANG_LABELS: Record<string, string> = { 'zh-TW': '繁體中文', en: 'English' };

export class SystemPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _tab: SysTabId = 'general';
      private _settings: SystemSettings;
      private _callbacks: SystemPanelCallbacks;

      constructor(callbacks: SystemPanelCallbacks = {}) {
            this._callbacks = callbacks;
            this._settings = this._loadSettings();

            this._el = document.createElement('div');
            this._el.id = 'sys-panel';
            this._el.className = 'sa-panel sys-root';
            this._el.style.display = 'none';
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      // ─── Rendering ───

      private _render(): void {
            this._el.innerHTML = `
                  <div class="sa-panel-title">
                        ⚙️ 系統設定
                        <span class="panel-close" id="sys-close">×</span>
                  </div>
                  <div class="sys-tabs">
                        <button class="sa-tag${this._tab === 'general' ? ' sa-tag-active' : ''}" data-tab="general">🎮 一般</button>
                        <button class="sa-tag${this._tab === 'controls' ? ' sa-tag-active' : ''}" data-tab="controls">🕹️ 操控</button>
                        <button class="sa-tag${this._tab === 'account' ? ' sa-tag-active' : ''}" data-tab="account">💾 帳號</button>
                        <button class="sa-tag${this._tab === 'about' ? ' sa-tag-active' : ''}" data-tab="about">ℹ️ 關於</button>
                  </div>
                  <div class="sys-body" id="sys-body"></div>
            `;

            // Tab events
            this._el.querySelector('#sys-close')?.addEventListener('click', () => this.hide());
            this._el.querySelectorAll('.sa-tag[data-tab]').forEach(btn => {
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
                  case 'about': this._renderAboutTab(body); break;
            }
      }

      // ─── Tab 1: General ───

      private _renderGeneralTab(body: HTMLDivElement): void {
            const s = this._settings;

            body.innerHTML = `
                  <div class="sys-section-header">🖥️ 畫面</div>

                  <div class="sys-row">
                        <span class="sys-label">畫質</span>
                        <div class="sys-quality-group">
                              ${(['low', 'medium', 'high'] as const).map(q => `
                                    <button class="sys-quality-btn${s.graphicsQuality === q ? ' active' : ''}" data-quality="${q}">
                                          ${QUALITY_LABELS[q]}
                                    </button>
                              `).join('')}
                        </div>
                  </div>

                  <div class="sys-row">
                        <span class="sys-label">解析度縮放</span>
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

            // Quality buttons
            body.querySelectorAll('.sys-quality-btn').forEach(btn => {
                  btn.addEventListener('click', () => {
                        this._settings.graphicsQuality = (btn as HTMLElement).dataset.quality as SystemSettings['graphicsQuality'];
                        this._save();
                        this._render();
                  });
            });

            // Resolution slider
            this._bindSlider(body, 'sys-resolution', 'sys-resolution-val', v => {
                  this._settings.resolutionScale = v / 100;
            }, v => `${Math.round(v)}%`);

            // FPS toggle
            body.querySelector('#sys-fps')?.addEventListener('change', (e) => {
                  this._settings.showFps = (e.target as HTMLInputElement).checked;
                  this._save();
            });

            // BGM slider
            this._bindSlider(body, 'sys-bgm', 'sys-bgm-val', v => {
                  this._settings.bgmVolume = v;
            });

            // SFX slider
            this._bindSlider(body, 'sys-sfx', 'sys-sfx-val', v => {
                  this._settings.sfxVolume = v;
            });

            // Language
            body.querySelector('#sys-lang')?.addEventListener('change', (e) => {
                  this._settings.language = (e.target as HTMLSelectElement).value as SystemSettings['language'];
                  this._save();
            });
      }

      // ─── Tab 2: Controls ───

      private _renderControlsTab(body: HTMLDivElement): void {
            const s = this._settings;

            body.innerHTML = `
                  <div class="sys-section-header">🕹️ 移動</div>

                  <div class="sys-row">
                        <span class="sys-label">搖桿靈敏度</span>
                        <div class="sys-slider-group">
                              <input type="range" class="sys-slider" id="sys-joy" min="50" max="200" step="10" value="${s.joystickSensitivity * 100}">
                              <span class="sys-value" id="sys-joy-val">${s.joystickSensitivity.toFixed(1)}x</span>
                        </div>
                  </div>

                  <div class="sys-section-header">📷 鏡頭</div>

                  <div class="sys-row">
                        <span class="sys-label">鏡頭靈敏度</span>
                        <div class="sys-slider-group">
                              <input type="range" class="sys-slider" id="sys-cam" min="50" max="200" step="10" value="${s.cameraSensitivity * 100}">
                              <span class="sys-value" id="sys-cam-val">${s.cameraSensitivity.toFixed(1)}x</span>
                        </div>
                  </div>

                  <div class="sys-row">
                        <span class="sys-label">Y軸反轉</span>
                        <label class="sys-toggle-wrap">
                              <input type="checkbox" class="sys-toggle-input" id="sys-invert" ${s.invertCameraY ? 'checked' : ''}>
                              <span class="sys-toggle-track"><span class="sys-toggle-thumb"></span></span>
                        </label>
                  </div>

                  <div class="sys-section-header">🎯 戰鬥</div>

                  <div class="sys-row">
                        <span class="sys-label">自動鎖定目標</span>
                        <label class="sys-toggle-wrap">
                              <input type="checkbox" class="sys-toggle-input" id="sys-autolock" ${s.autoLockTarget ? 'checked' : ''}>
                              <span class="sys-toggle-track"><span class="sys-toggle-thumb"></span></span>
                        </label>
                  </div>
            `;

            // Joystick sensitivity
            this._bindSlider(body, 'sys-joy', 'sys-joy-val', v => {
                  this._settings.joystickSensitivity = v / 100;
            }, v => `${(v / 100).toFixed(1)}x`);

            // Camera sensitivity
            this._bindSlider(body, 'sys-cam', 'sys-cam-val', v => {
                  this._settings.cameraSensitivity = v / 100;
            }, v => `${(v / 100).toFixed(1)}x`);

            // Invert Y
            body.querySelector('#sys-invert')?.addEventListener('change', (e) => {
                  this._settings.invertCameraY = (e.target as HTMLInputElement).checked;
                  this._save();
            });

            // Auto lock
            body.querySelector('#sys-autolock')?.addEventListener('change', (e) => {
                  this._settings.autoLockTarget = (e.target as HTMLInputElement).checked;
                  this._save();
            });
      }

      // ─── Tab 3: Account ───

      private _renderAccountTab(body: HTMLDivElement): void {
            const uid = this._generateUID();

            body.innerHTML = `
                  <div class="sys-section-header">🆔 帳號資訊</div>

                  <div class="sys-row">
                        <span class="sys-label">玩家 UID</span>
                        <span class="sys-info">${uid}</span>
                  </div>

                  <div class="sys-section-header">💾 存檔管理</div>

                  <div class="sys-btn-group">
                        <button class="sys-btn btn-gold" id="sys-save">
                              💾 儲存進度
                        </button>
                        <button class="sys-btn" id="sys-load">
                              📂 讀取進度
                        </button>
                  </div>

                  <div class="sys-section-header">⚠️ 危險操作</div>

                  <div class="sys-btn-group">
                        <button class="sys-btn sys-btn-danger" id="sys-reset">
                              🗑️ 重置所有資料
                        </button>
                  </div>

                  <div class="sys-danger-note">
                        重置將清除所有存檔資料，此操作無法撤銷。
                  </div>
            `;

            body.querySelector('#sys-save')?.addEventListener('click', () => {
                  this._callbacks.onSaveProgress?.();
                  this._showToast('✅ 進度已儲存');
            });

            body.querySelector('#sys-load')?.addEventListener('click', () => {
                  if (confirm('讀取進度將覆蓋目前資料，確定嗎？')) {
                        this._callbacks.onLoadProgress?.();
                        this._showToast('📂 進度已讀取');
                  }
            });

            body.querySelector('#sys-reset')?.addEventListener('click', () => {
                  if (confirm('⚠️ 確定要重置所有資料嗎？\n此操作無法撤銷！')) {
                        if (confirm('再次確認：所有角色、寵物、裝備、金幣都將被清除。')) {
                              this._callbacks.onResetAll?.();
                              this._showToast('🗑️ 資料已重置');
                        }
                  }
            });
      }

      // ─── Tab 4: About ───

      private _renderAboutTab(body: HTMLDivElement): void {
            body.innerHTML = `
                  <div class="sys-about-hero">
                        <div class="sys-about-title">Fantasy Pet Online</div>
                        <div class="sys-about-subtitle">Stone Age Fantasy MMO RPG</div>
                        <div class="sys-about-version">v0.9.0 — GEMINI_v3</div>
                  </div>

                  <div class="sys-section-header">👨‍💻 製作團隊</div>

                  <div class="sys-credits">
                        <div class="sys-credit-row">
                              <span class="sys-credit-role">Game Design</span>
                              <span class="sys-credit-name">kachun2021</span>
                        </div>
                        <div class="sys-credit-row">
                              <span class="sys-credit-role">Engine</span>
                              <span class="sys-credit-name">Babylon.js 8.x</span>
                        </div>
                        <div class="sys-credit-row">
                              <span class="sys-credit-role">AI Assistant</span>
                              <span class="sys-credit-name">Antigravity</span>
                        </div>
                  </div>

                  <div class="sys-section-header">🔗 連結</div>

                  <div class="sys-links">
                        <a href="https://github.com/kachun2021/RPGPRO-01" target="_blank" class="sys-link">
                              📦 GitHub Repository
                        </a>
                  </div>

                  <div class="sys-about-footer">
                        © 2026 Fantasy Pet Online. All rights reserved.
                  </div>
            `;
      }

      // ─── Helpers ───

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
                  const v = parseFloat(slider.value);
                  onUpdate(v);
                  if (valueEl) valueEl.textContent = format ? format(v) : `${Math.round(v)}`;
            });
            slider.addEventListener('change', () => {
                  this._save();
            });
      }

      private _generateUID(): string {
            let uid = localStorage.getItem('fpo.player.uid');
            if (!uid) {
                  uid = 'FPO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
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
            } catch { /* quota full — ignore */ }
            this._callbacks.onSettingsChange?.(this._settings);
      }

      private _loadSettings(): SystemSettings {
            try {
                  const raw = localStorage.getItem(STORAGE_KEY);
                  if (raw) {
                        const parsed = JSON.parse(raw);
                        return { ...DEFAULT_SETTINGS, ...parsed };
                  }
            } catch { /* corrupt — use defaults */ }
            return { ...DEFAULT_SETTINGS };
      }

      // ─── Public API ───

      get settings(): SystemSettings { return this._settings; }
      get isVisible(): boolean { return this._visible; }

      toggle(): void { this._visible ? this.hide() : this.show(); }

      show(): void {
            this._visible = true;
            this._el.style.display = 'block';
            this._render();
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
      }

      dispose(): void {
            this._el.remove();
      }
}
