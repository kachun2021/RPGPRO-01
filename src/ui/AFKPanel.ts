import type { Inventory } from '../systems/Inventory';
import { ZONE_DEFS } from '../world/ZoneDefinitions';
import { getRuntimeMonstersForSceneZone } from '../data/runtime/RuntimeMonsterSource';

type AFKTabId = 'quick' | 'combat' | 'loot' | 'safety';
type AFKMode = 'safe' | 'balanced' | 'efficient';
type TargetPriority = 'nearest' | 'elite' | 'bossLast';
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type BagFullAction = 'town' | 'mail' | 'stop';
type DeathAction = 'revive' | 'town' | 'stop';
type FilterListKey = 'whitelist' | 'blacklist';

interface LootZoneMonsterOption {
      name: string;
      level: number;
      isBoss: boolean;
}

interface LootZoneOption {
      id: string;
      label: string;
      monsters: LootZoneMonsterOption[];
}

const STORAGE_KEY = 'fpo.afk.settings.v3';
const LOOT_ZONE_STORAGE_KEY = 'fpo.afk.settings.v3.loot.zone';
const TAB_IDS: AFKTabId[] = ['quick', 'combat', 'loot', 'safety'];
const MODE_IDS: AFKMode[] = ['safe', 'balanced', 'efficient'];
const FILTER_CHAR_LIMIT = 300;

const LOOT_ZONES: LootZoneOption[] = ZONE_DEFS
      .filter((zone) => !zone.isTown)
      .map((zone) => {
            const monsterMap = new Map<string, LootZoneMonsterOption>();
            const runtimeMonsters = getRuntimeMonstersForSceneZone(zone.id);
            runtimeMonsters.forEach((monster) => {
                  const name = String(monster.name ?? '').trim();
                  if (!name) return;
                  const key = name.toLowerCase();
                  const existing = monsterMap.get(key);
                  if (!existing || monster.level < existing.level) {
                        monsterMap.set(key, {
                              name,
                              level: monster.level,
                              isBoss: Boolean(monster.isBoss),
                        });
                        return;
                  }
                  if (monster.isBoss) existing.isBoss = true;
            });
            const monsters = Array.from(monsterMap.values()).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'zh-Hant'));
            return {
                  id: zone.id,
                  label: `${zone.nameCN} (Lv.${zone.levelMin}-${zone.levelMax})`,
                  monsters,
            };
      })
      .filter((zone) => zone.monsters.length > 0);

function clamp(n: number, min: number, max: number): number {
      if (!Number.isFinite(n)) return min;
      return Math.max(min, Math.min(max, n));
}

function normalizeEnum<T extends string>(value: unknown, list: readonly T[], fallback: T): T {
      return typeof value === 'string' && list.includes(value as T) ? (value as T) : fallback;
}

function modeLabel(mode: AFKMode): string {
      switch (mode) {
            case 'safe': return '安全';
            case 'balanced': return '平衡';
            case 'efficient': return '效率';
      }
}

function parseFilterList(raw: string): string[] {
      const result: string[] = [];
      const seen = new Set<string>();
      raw.split(/[\n,;]+/).forEach((part) => {
            const value = part.trim();
            if (!value) return;
            const key = value.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            result.push(value);
      });
      return result;
}

function stringifyFilterList(values: string[], maxLength: number): string {
      const result: string[] = [];
      let currentLength = 0;
      values.forEach((raw) => {
            const value = raw.trim();
            if (!value) return;
            const key = value.toLowerCase();
            if (result.some((item) => item.toLowerCase() === key)) return;
            const nextLength = currentLength === 0 ? value.length : currentLength + 1 + value.length;
            if (nextLength > maxLength) return;
            result.push(value);
            currentLength = nextLength;
      });
      return result.join(',');
}

export interface AFKSettings {
      mode: AFKMode;
      autoFindEnabled: boolean;
      autoPotionEnabled: boolean;
      autoLootEnabled: boolean;
      detectRadius: number;
      targetPriority: TargetPriority;
      mpReservePct: number;
      forceHealThreshold: number;
      rarityThreshold: ItemRarity;
      bagFullAction: BagFullAction;
      whitelist: string;
      blacklist: string;
      hpPotionPct: number;
      mpPotionPct: number;
      deathAction: DeathAction;
      reconnectEnabled: boolean;
      stopOnBoss: boolean;
      simpleRiskCheck: boolean;
}

export interface AFKPanelCallbacks {
      onToggleAuto?: () => boolean;
      onApplyConfig?: (settings: AFKSettings) => void;
      onVisibilityChange?: (visible: boolean) => void;
}

const DEFAULT_SETTINGS: AFKSettings = {
      mode: 'balanced',
      autoFindEnabled: true,
      autoPotionEnabled: true,
      autoLootEnabled: true,
      detectRadius: 20,
      targetPriority: 'nearest',
      mpReservePct: 20,
      forceHealThreshold: 30,
      rarityThreshold: 'rare',
      bagFullAction: 'town',
      whitelist: '',
      blacklist: '',
      hpPotionPct: 35,
      mpPotionPct: 30,
      deathAction: 'town',
      reconnectEnabled: true,
      stopOnBoss: true,
      simpleRiskCheck: true,
};

const MODE_PRESETS: Record<AFKMode, Partial<AFKSettings>> = {
      safe: {
            detectRadius: 16,
            targetPriority: 'nearest',
            hpPotionPct: 40,
            mpPotionPct: 35,
            mpReservePct: 30,
            forceHealThreshold: 40,
            rarityThreshold: 'rare',
            bagFullAction: 'town',
            stopOnBoss: true,
      },
      balanced: {
            detectRadius: 22,
            targetPriority: 'bossLast',
            hpPotionPct: 35,
            mpPotionPct: 30,
            mpReservePct: 20,
            forceHealThreshold: 30,
            rarityThreshold: 'uncommon',
            bagFullAction: 'town',
            stopOnBoss: true,
      },
      efficient: {
            detectRadius: 30,
            targetPriority: 'elite',
            hpPotionPct: 28,
            mpPotionPct: 24,
            mpReservePct: 10,
            forceHealThreshold: 25,
            rarityThreshold: 'common',
            bagFullAction: 'mail',
            stopOnBoss: false,
      },
};

type AFKSettingKey = keyof AFKSettings;

export class AFKPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _inventory: Inventory;
      private _callbacks: AFKPanelCallbacks;
      private _settings: AFKSettings;
      private _activeTab: AFKTabId = 'quick';
      private _intervalId = 0;
      private _autoEnabled = false;
      private _autoStartMs = 0;
      private _afkSeconds = 0;
      private _dirty = false;
      private _selectedLootZoneId = '';

      constructor(inventory: Inventory, callbacks: AFKPanelCallbacks = {}) {
            this._inventory = inventory;
            this._callbacks = callbacks;
            this._settings = this._loadSettings();
            this._selectedLootZoneId = this._loadLootZoneId();

            this._el = document.createElement('div');
            this._el.id = 'afk-panel';
            this._el.className = 'sa-panel afk-root';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      private _buildShell(): void {
            this._el.innerHTML = `
                  <div class="sa-panel-title">
                        ⚙ AFK 控制中心
                        <span class="panel-close" id="afk-close">×</span>
                  </div>
                  <div class="afk-headline">
                        <div class="afk-run-badge" id="afk-run-badge">已停止</div>
                        <label class="afk-mode-select">模式
                              <select data-key="mode">
                                    <option value="safe">安全</option>
                                    <option value="balanced">平衡</option>
                                    <option value="efficient">效率</option>
                              </select>
                        </label>
                        <button id="afk-toggle-auto" class="afk-btn afk-btn-primary">開始掛機</button>
                        <button id="afk-apply" class="afk-btn">套用設定</button>
                  </div>
                  <div class="afk-overview-strip">
                        <div class="afk-mini-card"><span>今日時長</span><b id="afk-time">00:00:00</b></div>
                        <div class="afk-mini-card"><span>收益</span><b id="afk-gold">0 金</b></div>
                        <div class="afk-mini-card"><span>擊殺</span><b id="afk-kills">0</b></div>
                        <div class="afk-mini-card"><span>效率</span><b id="afk-eff">0 金/分</b></div>
                        <div class="afk-mini-card"><span>異常</span><b id="afk-anomaly-count">0</b></div>
                  </div>
                  <div class="afk-layout">
                        <div class="afk-side-nav">
                              <button class="afk-menu-btn active" data-tab="quick">快速啟動</button>
                              <button class="afk-menu-btn" data-tab="combat">戰鬥與技能</button>
                              <button class="afk-menu-btn" data-tab="loot">拾取與背包</button>
                              <button class="afk-menu-btn" data-tab="safety">生存與安全</button>
                        </div>
                        <div class="afk-main-body">
                              <div class="afk-tab-panel active" data-panel="quick">
                                    <div class="afk-panel-title-line">核心開關（新手只需要調這裡）</div>
                                    <div class="afk-toggle-grid">
                                          <label class="afk-toggle-card" data-risk="low">
                                                <div class="afk-toggle-meta">
                                                      <span class="afk-toggle-title">自動尋怪</span>
                                                      <span class="afk-toggle-desc">關閉後只會原地待機</span>
                                                </div>
                                                <div class="afk-toggle-control">
                                                      <span class="afk-toggle-state">OFF</span>
                                                      <span class="afk-toggle-switch">
                                                            <input data-key="autoFindEnabled" type="checkbox">
                                                            <span class="afk-toggle-slider"></span>
                                                      </span>
                                                </div>
                                          </label>
                                          <label class="afk-toggle-card" data-risk="high">
                                                <div class="afk-toggle-meta">
                                                      <span class="afk-toggle-title">自動補血藍</span>
                                                      <span class="afk-toggle-desc">建議常開，避免暴斃</span>
                                                </div>
                                                <div class="afk-toggle-control">
                                                      <span class="afk-toggle-state">OFF</span>
                                                      <span class="afk-toggle-switch">
                                                            <input data-key="autoPotionEnabled" type="checkbox">
                                                            <span class="afk-toggle-slider"></span>
                                                      </span>
                                                </div>
                                          </label>
                                          <label class="afk-toggle-card" data-risk="low">
                                                <div class="afk-toggle-meta">
                                                      <span class="afk-toggle-title">自動拾取</span>
                                                      <span class="afk-toggle-desc">關閉時不會自動撿物</span>
                                                </div>
                                                <div class="afk-toggle-control">
                                                      <span class="afk-toggle-state">OFF</span>
                                                      <span class="afk-toggle-switch">
                                                            <input data-key="autoLootEnabled" type="checkbox">
                                                            <span class="afk-toggle-slider"></span>
                                                      </span>
                                                </div>
                                          </label>
                                          <label class="afk-toggle-card" data-risk="mid">
                                                <div class="afk-toggle-meta">
                                                      <span class="afk-toggle-title">Boss處理：停掛</span>
                                                      <span class="afk-toggle-desc">關閉後會照常打 Boss</span>
                                                </div>
                                                <div class="afk-toggle-control">
                                                      <span class="afk-toggle-state">OFF</span>
                                                      <span class="afk-toggle-switch">
                                                            <input data-key="stopOnBoss" type="checkbox">
                                                            <span class="afk-toggle-slider"></span>
                                                      </span>
                                                </div>
                                          </label>
                                          <label class="afk-toggle-card" data-risk="high">
                                                <div class="afk-toggle-meta">
                                                      <span class="afk-toggle-title">斷線重連</span>
                                                      <span class="afk-toggle-desc">建議開啟，避免中斷</span>
                                                </div>
                                                <div class="afk-toggle-control">
                                                      <span class="afk-toggle-state">OFF</span>
                                                      <span class="afk-toggle-switch">
                                                            <input data-key="reconnectEnabled" type="checkbox">
                                                            <span class="afk-toggle-slider"></span>
                                                      </span>
                                                </div>
                                          </label>
                                    </div>
                                    <div class="afk-row-grid">
                                          <label class="afk-field">尋怪半徑 <input data-key="detectRadius" type="number" min="6" max="60" step="1"></label>
                                    </div>
                              </div>
                              <div class="afk-tab-panel" data-panel="combat">
                                    <div class="afk-panel-title-line">戰鬥策略</div>
                                    <div class="afk-row-grid">
                                          <label class="afk-field">目標優先
                                                <select data-key="targetPriority">
                                                      <option value="nearest">最近目標</option>
                                                      <option value="elite">優先精英</option>
                                                      <option value="bossLast">Boss 最後</option>
                                                </select>
                                          </label>
                                          <label class="afk-field">MP 保留(%) <input data-key="mpReservePct" type="number" min="0" max="80" step="1"></label>
                                          <label class="afk-field">強制治療閾值(%) <input data-key="forceHealThreshold" type="number" min="5" max="80" step="1"></label>
                                    </div>
                              </div>
                              <div class="afk-tab-panel" data-panel="loot">
                                    <div class="afk-panel-title-line">拾取與背包</div>
                                    <div class="afk-row-grid">
                                          <label class="afk-field">最低稀有度
                                                <select data-key="rarityThreshold">
                                                      <option value="common">普通</option>
                                                      <option value="uncommon">高級</option>
                                                      <option value="rare">稀有</option>
                                                      <option value="epic">史詩</option>
                                                      <option value="legendary">傳說</option>
                                                </select>
                                          </label>
                                          <label class="afk-field">滿包處理
                                                <select data-key="bagFullAction">
                                                      <option value="town">回城清包</option>
                                                      <option value="mail">寄送倉庫</option>
                                                      <option value="stop">停止掛機</option>
                                                </select>
                                          </label>
                                    </div>
                                    <div class="afk-filter-builder">
                                          <div class="afk-row-grid">
                                                <label class="afk-field">掛機地圖
                                                      <select id="afk-loot-zone"></select>
                                                </label>
                                                <label class="afk-field">地圖怪物
                                                      <select id="afk-loot-monster"></select>
                                                </label>
                                          </div>
                                          <div class="afk-filter-actions">
                                                <button id="afk-add-whitelist" class="afk-btn afk-inline-btn" type="button">加入白名單</button>
                                                <button id="afk-add-blacklist" class="afk-btn afk-inline-btn" type="button">加入黑名單</button>
                                          </div>
                                          <div class="afk-note">白名單與黑名單改為下拉選擇，不需要手動輸入。</div>
                                    </div>
                                    <div class="afk-filter-lists">
                                          <div class="afk-filter-card">
                                                <div class="afk-filter-head">
                                                      <span>白名單（點擊可移除）</span>
                                                      <button id="afk-clear-whitelist" class="afk-link-btn" type="button">清空</button>
                                                </div>
                                                <div class="afk-tag-list" id="afk-whitelist-list"></div>
                                          </div>
                                          <div class="afk-filter-card">
                                                <div class="afk-filter-head">
                                                      <span>黑名單（點擊可移除）</span>
                                                      <button id="afk-clear-blacklist" class="afk-link-btn" type="button">清空</button>
                                                </div>
                                                <div class="afk-tag-list" id="afk-blacklist-list"></div>
                                          </div>
                                    </div>
                              </div>
                              <div class="afk-tab-panel" data-panel="safety">
                                    <div class="afk-panel-title-line">生存與安全</div>
                                    <div class="afk-row-grid">
                                          <label class="afk-field">補血閾值(%) <input data-key="hpPotionPct" type="number" min="5" max="90" step="1"></label>
                                          <label class="afk-field">補藍閾值(%) <input data-key="mpPotionPct" type="number" min="5" max="90" step="1"></label>
                                          <label class="afk-field">死亡處理
                                                <select data-key="deathAction">
                                                      <option value="revive">原地復活</option>
                                                      <option value="town">回城復活</option>
                                                      <option value="stop">停止掛機</option>
                                                </select>
                                          </label>
                                    </div>
                                    <div class="afk-toggle-grid afk-toggle-grid-single">
                                          <label class="afk-toggle-card" data-risk="high">
                                                <div class="afk-toggle-meta">
                                                      <span class="afk-toggle-title">簡單異常檢測</span>
                                                      <span class="afk-toggle-desc">關閉時不做基本風險提醒</span>
                                                </div>
                                                <div class="afk-toggle-control">
                                                      <span class="afk-toggle-state">OFF</span>
                                                      <span class="afk-toggle-switch">
                                                            <input data-key="simpleRiskCheck" type="checkbox">
                                                            <span class="afk-toggle-slider"></span>
                                                      </span>
                                                </div>
                                          </label>
                                    </div>
                                    <div class="afk-alert" id="afk-anomaly">異常檢測：正常</div>
                              </div>
                        </div>
                  </div>
                  <div class="afk-footer">
                        <div class="afk-status" id="afk-status">設定已載入（本地）</div>
                        <button id="afk-reset" class="afk-btn">重置</button>
                  </div>
            `;

            this._el.querySelector('#afk-close')?.addEventListener('click', () => this.hide());
            this._el.querySelector('#afk-toggle-auto')?.addEventListener('click', () => this._handleToggleAuto());
            this._el.querySelector('#afk-apply')?.addEventListener('click', () => this._handleApply());
            this._el.querySelector('#afk-reset')?.addEventListener('click', () => this._handleReset());
            this._el.querySelectorAll<HTMLButtonElement>('.afk-menu-btn').forEach(btn => {
                  btn.addEventListener('click', () => {
                        const tab = (btn.dataset.tab ?? 'quick') as AFKTabId;
                        if (!TAB_IDS.includes(tab)) return;
                        this._switchTab(tab);
                  });
            });
            this._el.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-key]').forEach(el => {
                  el.addEventListener('change', () => this._onFieldChange(el));
            });

            this._bindLootListUi();
            this._syncFormFromSettings();
            this._syncAutoButton();
            this._refreshAnomalyHint();
      }

      private _bindLootListUi(): void {
            const zoneSelect = this._el.querySelector<HTMLSelectElement>('#afk-loot-zone');
            const monsterSelect = this._el.querySelector<HTMLSelectElement>('#afk-loot-monster');
            if (!zoneSelect || !monsterSelect) return;

            zoneSelect.innerHTML = '';
            LOOT_ZONES.forEach((zone) => {
                  const option = document.createElement('option');
                  option.value = zone.id;
                  option.textContent = zone.label;
                  zoneSelect.appendChild(option);
            });

            if (LOOT_ZONES.length === 0) {
                  const empty = document.createElement('option');
                  empty.value = '';
                  empty.textContent = '無可用地圖資料';
                  zoneSelect.appendChild(empty);
                  zoneSelect.disabled = true;
                  monsterSelect.disabled = true;
                  return;
            }

            if (!LOOT_ZONES.some((zone) => zone.id === this._selectedLootZoneId)) {
                  this._selectedLootZoneId = LOOT_ZONES[0].id;
                  this._saveLootZoneId();
            }
            zoneSelect.value = this._selectedLootZoneId;
            this._syncLootMonsterOptions();

            zoneSelect.addEventListener('change', () => {
                  this._selectedLootZoneId = zoneSelect.value;
                  this._saveLootZoneId();
                  this._syncLootMonsterOptions();
            });

            this._el.querySelector('#afk-add-whitelist')?.addEventListener('click', () => this._handleAddMonster('whitelist'));
            this._el.querySelector('#afk-add-blacklist')?.addEventListener('click', () => this._handleAddMonster('blacklist'));
            this._el.querySelector('#afk-clear-whitelist')?.addEventListener('click', () => this._clearMonsterList('whitelist'));
            this._el.querySelector('#afk-clear-blacklist')?.addEventListener('click', () => this._clearMonsterList('blacklist'));
            this._el.querySelector('#afk-whitelist-list')?.addEventListener('click', (event) => this._handleTagClick(event, 'whitelist'));
            this._el.querySelector('#afk-blacklist-list')?.addEventListener('click', (event) => this._handleTagClick(event, 'blacklist'));
      }

      private _syncLootMonsterOptions(): void {
            const monsterSelect = this._el.querySelector<HTMLSelectElement>('#afk-loot-monster');
            if (!monsterSelect) return;
            monsterSelect.innerHTML = '';

            const zone = LOOT_ZONES.find((item) => item.id === this._selectedLootZoneId);
            if (!zone || zone.monsters.length === 0) {
                  const empty = document.createElement('option');
                  empty.value = '';
                  empty.textContent = '此地圖無怪物資料';
                  monsterSelect.appendChild(empty);
                  monsterSelect.disabled = true;
                  return;
            }

            zone.monsters.forEach((monster) => {
                  const option = document.createElement('option');
                  option.value = monster.name;
                  option.textContent = `${monster.name} (Lv.${monster.level}${monster.isBoss ? ', Boss' : ''})`;
                  monsterSelect.appendChild(option);
            });
            monsterSelect.disabled = false;
      }

      private _switchTab(tab: AFKTabId): void {
            this._activeTab = tab;
            this._el.querySelectorAll<HTMLButtonElement>('.afk-menu-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
            this._el.querySelectorAll<HTMLElement>('.afk-tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === tab));
      }

      private _onFieldChange(el: HTMLInputElement | HTMLSelectElement): void {
            const key = (el.dataset.key ?? '') as AFKSettingKey;
            if (!key) return;
            if (key === 'mode') {
                  this._applyModePreset(normalizeEnum<AFKMode>(el.value, MODE_IDS, this._settings.mode));
                  return;
            }
            const value = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : (el instanceof HTMLInputElement && el.type === 'number' ? Number(el.value) : el.value);
            this._settings = this._normalizeSettings({ ...this._settings, [key]: value });
            this._dirty = true;
            this._saveSettings();
            this._syncToggleVisuals();
            this._refreshAnomalyHint();
            this._setStatus('設定已變更，請按「套用設定」');
      }

      private _applyModePreset(mode: AFKMode): void {
            this._settings = this._normalizeSettings({ ...this._settings, ...MODE_PRESETS[mode], mode });
            this._syncFormFromSettings();
            this._dirty = true;
            this._saveSettings();
            this._refreshAnomalyHint();
            this._setStatus(`已切換${modeLabel(mode)}模式，請按「套用設定」`);
      }

      private _syncFormFromSettings(): void {
            (Object.keys(this._settings) as AFKSettingKey[]).forEach((key) => {
                  const value = this._settings[key];
                  this._el.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[data-key="${key}"]`).forEach(el => {
                        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
                              el.checked = Boolean(value);
                        } else {
                              el.value = String(value);
                        }
                  });
            });
            this._syncToggleVisuals();
            this._renderMonsterLists();
      }

      private _syncToggleVisuals(): void {
            this._el.querySelectorAll<HTMLElement>('.afk-toggle-card').forEach((card) => {
                  const input = card.querySelector<HTMLInputElement>('input[type="checkbox"][data-key]');
                  const state = card.querySelector<HTMLElement>('.afk-toggle-state');
                  if (!input || !state) return;

                  card.classList.remove('is-on', 'is-off', 'risk-low', 'risk-mid', 'risk-high');
                  if (input.checked) {
                        card.classList.add('is-on');
                        state.textContent = 'ON';
                        return;
                  }

                  card.classList.add('is-off');
                  state.textContent = 'OFF';
                  const risk = card.dataset.risk === 'high'
                        ? 'risk-high'
                        : (card.dataset.risk === 'mid' ? 'risk-mid' : 'risk-low');
                  card.classList.add(risk);
            });
      }

      private _handleAddMonster(target: FilterListKey): void {
            const monsterSelect = this._el.querySelector<HTMLSelectElement>('#afk-loot-monster');
            const monsterName = monsterSelect?.value?.trim() ?? '';
            if (!monsterName) {
                  this._setStatus('請先選擇怪物');
                  return;
            }

            const targetLabel = target === 'whitelist' ? '白名單' : '黑名單';
            const list = this._getMonsterList(target);
            if (list.some((item) => item.toLowerCase() === monsterName.toLowerCase())) {
                  this._setStatus(`${monsterName} 已在${targetLabel}`);
                  return;
            }

            const other: FilterListKey = target === 'whitelist' ? 'blacklist' : 'whitelist';
            const otherList = this._getMonsterList(other).filter((item) => item.toLowerCase() !== monsterName.toLowerCase());
            list.push(monsterName);

            this._setMonsterList(other, otherList);
            this._setMonsterList(target, list);
            this._dirty = true;
            this._saveSettings();
            this._renderMonsterLists();
            this._setStatus(`已加入${targetLabel}：${monsterName}`);
      }

      private _handleTagClick(event: Event, target: FilterListKey): void {
            const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.afk-tag');
            if (!button) return;
            const value = button.dataset.value?.trim();
            if (!value) return;
            const nextList = this._getMonsterList(target).filter((item) => item.toLowerCase() !== value.toLowerCase());
            this._setMonsterList(target, nextList);
            this._dirty = true;
            this._saveSettings();
            this._renderMonsterLists();
            this._setStatus(`已移除：${value}`);
      }

      private _clearMonsterList(target: FilterListKey): void {
            this._setMonsterList(target, []);
            this._dirty = true;
            this._saveSettings();
            this._renderMonsterLists();
            this._setStatus(target === 'whitelist' ? '白名單已清空' : '黑名單已清空');
      }

      private _getMonsterList(target: FilterListKey): string[] {
            return parseFilterList(this._settings[target]);
      }

      private _setMonsterList(target: FilterListKey, values: string[]): void {
            this._settings = this._normalizeSettings({
                  ...this._settings,
                  [target]: stringifyFilterList(values, FILTER_CHAR_LIMIT),
            });
      }

      private _renderMonsterLists(): void {
            this._renderMonsterList('whitelist', 'afk-whitelist-list', '白名單目前為空');
            this._renderMonsterList('blacklist', 'afk-blacklist-list', '黑名單目前為空');
      }

      private _renderMonsterList(target: FilterListKey, containerId: string, emptyText: string): void {
            const container = this._el.querySelector<HTMLElement>(`#${containerId}`);
            if (!container) return;
            container.innerHTML = '';

            const list = this._getMonsterList(target);
            if (list.length === 0) {
                  const empty = document.createElement('span');
                  empty.className = 'afk-list-empty';
                  empty.textContent = emptyText;
                  container.appendChild(empty);
                  return;
            }

            const tagClass = target === 'whitelist' ? 'afk-tag afk-tag-white' : 'afk-tag afk-tag-black';
            list.forEach((name) => {
                  const chip = document.createElement('button');
                  chip.type = 'button';
                  chip.className = tagClass;
                  chip.dataset.value = name;
                  chip.title = '點擊移除';
                  chip.textContent = name;

                  const close = document.createElement('span');
                  close.className = 'afk-tag-close';
                  close.textContent = '×';
                  chip.appendChild(close);
                  container.appendChild(chip);
            });
      }

      private _handleToggleAuto(): void {
            if (this._dirty) this._handleApply();
            const next = this._callbacks.onToggleAuto ? this._callbacks.onToggleAuto() : !this._autoEnabled;
            this.notifyAutoStateChanged(next);
            this._setStatus(next ? '掛機已啟動' : '掛機已停止');
      }

      private _handleApply(): void {
            this._callbacks.onApplyConfig?.(this._settings);
            this._dirty = false;
            this._saveSettings();
            this._setStatus('設定已套用');
      }

      private _handleReset(): void {
            this._settings = { ...DEFAULT_SETTINGS };
            this._syncFormFromSettings();
            this._dirty = true;
            this._saveSettings();
            this._refreshAnomalyHint();
            this._setStatus('已重置，請按「套用設定」');
      }

      private _syncAutoButton(): void {
            const btn = this._el.querySelector<HTMLButtonElement>('#afk-toggle-auto');
            const badge = this._el.querySelector<HTMLElement>('#afk-run-badge');
            if (btn) {
                  btn.textContent = this._autoEnabled ? '停止掛機' : '開始掛機';
                  btn.classList.toggle('active', this._autoEnabled);
            }
            if (badge) {
                  badge.textContent = this._autoEnabled ? '運行中' : '已停止';
                  badge.classList.toggle('active', this._autoEnabled);
            }
      }

      private _setStatus(msg: string): void {
            const el = this._el.querySelector<HTMLElement>('#afk-status');
            if (el) el.textContent = msg;
      }

      private _refreshAnomalyHint(): void {
            const hints: string[] = [];
            if (this._settings.detectRadius > 42) hints.push('半徑偏大');
            if (this._settings.hpPotionPct < 20) hints.push('補血偏低');
            if (!this._settings.reconnectEnabled) hints.push('無重連');
            if (!this._settings.simpleRiskCheck) hints.push('檢測關閉');
            const el = this._el.querySelector<HTMLElement>('#afk-anomaly');
            if (el) el.textContent = hints.length > 0 ? `異常檢測：${hints.join('、')}` : '異常檢測：正常';
            const count = this._el.querySelector<HTMLElement>('#afk-anomaly-count');
            if (count) count.textContent = String(hints.length);
      }

      private _updateStats(): void {
            const elapsed = this._afkSeconds + (this._autoEnabled && this._autoStartMs > 0 ? (Date.now() - this._autoStartMs) / 1000 : 0);
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = Math.floor(elapsed % 60);
            const setVal = (id: string, val: string): void => {
                  const el = this._el.querySelector<HTMLElement>(`#${id}`);
                  if (el) el.textContent = val;
            };
            setVal('afk-time', `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            setVal('afk-kills', this._inventory.totalKills.toLocaleString());
            setVal('afk-gold', `${this._inventory.totalGoldGained.toLocaleString()} 金`);
            const gpm = elapsed > 60 ? Math.round(this._inventory.totalGoldGained / (elapsed / 60)) : 0;
            setVal('afk-eff', `${gpm.toLocaleString()} 金/分`);
      }

      private _normalizeSettings(raw: Partial<AFKSettings>): AFKSettings {
            return {
                  mode: normalizeEnum<AFKMode>(raw.mode, MODE_IDS, DEFAULT_SETTINGS.mode),
                  autoFindEnabled: Boolean(raw.autoFindEnabled ?? DEFAULT_SETTINGS.autoFindEnabled),
                  autoPotionEnabled: Boolean(raw.autoPotionEnabled ?? DEFAULT_SETTINGS.autoPotionEnabled),
                  autoLootEnabled: Boolean(raw.autoLootEnabled ?? DEFAULT_SETTINGS.autoLootEnabled),
                  detectRadius: clamp(Number(raw.detectRadius ?? DEFAULT_SETTINGS.detectRadius), 6, 60),
                  targetPriority: normalizeEnum<TargetPriority>(raw.targetPriority, ['nearest', 'elite', 'bossLast'], DEFAULT_SETTINGS.targetPriority),
                  mpReservePct: clamp(Number(raw.mpReservePct ?? DEFAULT_SETTINGS.mpReservePct), 0, 80),
                  forceHealThreshold: clamp(Number(raw.forceHealThreshold ?? DEFAULT_SETTINGS.forceHealThreshold), 5, 80),
                  rarityThreshold: normalizeEnum<ItemRarity>(raw.rarityThreshold, ['common', 'uncommon', 'rare', 'epic', 'legendary'], DEFAULT_SETTINGS.rarityThreshold),
                  bagFullAction: normalizeEnum<BagFullAction>(raw.bagFullAction, ['town', 'mail', 'stop'], DEFAULT_SETTINGS.bagFullAction),
                  whitelist: stringifyFilterList(parseFilterList(String(raw.whitelist ?? DEFAULT_SETTINGS.whitelist)), FILTER_CHAR_LIMIT),
                  blacklist: stringifyFilterList(parseFilterList(String(raw.blacklist ?? DEFAULT_SETTINGS.blacklist)), FILTER_CHAR_LIMIT),
                  hpPotionPct: clamp(Number(raw.hpPotionPct ?? DEFAULT_SETTINGS.hpPotionPct), 5, 90),
                  mpPotionPct: clamp(Number(raw.mpPotionPct ?? DEFAULT_SETTINGS.mpPotionPct), 5, 90),
                  deathAction: normalizeEnum<DeathAction>(raw.deathAction, ['revive', 'town', 'stop'], DEFAULT_SETTINGS.deathAction),
                  reconnectEnabled: Boolean(raw.reconnectEnabled ?? DEFAULT_SETTINGS.reconnectEnabled),
                  stopOnBoss: Boolean(raw.stopOnBoss ?? DEFAULT_SETTINGS.stopOnBoss),
                  simpleRiskCheck: Boolean(raw.simpleRiskCheck ?? DEFAULT_SETTINGS.simpleRiskCheck),
            };
      }

      private _loadLootZoneId(): string {
            const fallback = LOOT_ZONES[0]?.id ?? '';
            try {
                  const raw = localStorage.getItem(LOOT_ZONE_STORAGE_KEY);
                  if (!raw) return fallback;
                  return LOOT_ZONES.some((zone) => zone.id === raw) ? raw : fallback;
            } catch {
                  return fallback;
            }
      }

      private _saveLootZoneId(): void {
            localStorage.setItem(LOOT_ZONE_STORAGE_KEY, this._selectedLootZoneId);
      }

      private _loadSettings(): AFKSettings {
            try {
                  const raw = localStorage.getItem(STORAGE_KEY);
                  if (!raw) return { ...DEFAULT_SETTINGS };
                  return this._normalizeSettings(JSON.parse(raw) as Partial<AFKSettings>);
            } catch {
                  return { ...DEFAULT_SETTINGS };
            }
      }

      private _saveSettings(): void {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
      }

      notifyAutoStateChanged(enabled: boolean): void {
            if (enabled === this._autoEnabled) {
                  this._syncAutoButton();
                  return;
            }
            if (enabled) {
                  this._autoStartMs = Date.now();
            } else if (this._autoStartMs > 0) {
                  this._afkSeconds += (Date.now() - this._autoStartMs) / 1000;
                  this._autoStartMs = 0;
            }
            this._autoEnabled = enabled;
            this._syncAutoButton();
            this._updateStats();
      }

      get settings(): AFKSettings {
            return { ...this._settings };
      }

      get isVisible(): boolean {
            return this._visible;
      }

      toggle(): void {
            this._visible ? this.hide() : this.show();
      }

      show(): void {
            this._visible = true;
            this._el.style.display = 'block';
            this._callbacks.onVisibilityChange?.(true);
            this._updateStats();
            this._intervalId = window.setInterval(() => this._updateStats(), 1000);
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
            this._callbacks.onVisibilityChange?.(false);
            if (this._intervalId) {
                  clearInterval(this._intervalId);
                  this._intervalId = 0;
            }
      }

      dispose(): void {
            if (this._autoStartMs > 0) {
                  this._afkSeconds += (Date.now() - this._autoStartMs) / 1000;
                  this._autoStartMs = 0;
            }
            this.hide();
            this._el.remove();
      }
}
