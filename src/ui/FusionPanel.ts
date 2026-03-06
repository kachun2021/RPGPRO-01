import type { PetManager } from '../pets/PetManager';
import { PetFusion } from '../pets/PetFusion';
import type { FusionMatch } from '../pets/PetFusion';
import { PET_DEFS, PetSeries, SERIES_EMOJI, SERIES_ICONS, type FusionIngredient, type PetDef } from '../pets/PetData';
import type { Pet } from '../pets/Pet';
import listPetsRaw from '../data/fusion/list_pets.json';
import type { ListPetPayload, ListPetRow } from '../data/fusion/types';
import { canonicalPetName, normalizeFusionNameKey } from '../data/fusion/FusionNameUtils';
import { getRuntimeFusionGuideEntries } from '../data/runtime/RuntimeFusionGuide';

type SeriesFilter = 'all' | PetSeries;
type NoticeTone = 'ok' | 'warn';
type MainFusionTab = 'machine' | 'recipes' | 'tree';

interface FormulaEntry {
      key: string;
      source: 'runtime' | 'pet_defs';
      resultName: string;
      resultDef: PetDef;
      isResolvedResult: boolean;
      resultBaseLevel: number;
      resultDropEgg: boolean | null;
      resultDropEggRaw: string | null;
      resultMapNames: string[];
      recipe: FusionIngredient;
      mainName: string;
      mainDef: PetDef | null;
      isResolvedMain: boolean;
      mainBaseLevel: number;
      subName: string;
      subDef: PetDef | null;
      isResolvedSub: boolean;
      subBaseLevel: number;
      mainAdjust: number;
      subAdjust: number;
}

interface OwnedSnapshot {
      usable: Pet[];
      alive: Pet[];
      usableById: Map<string, Pet[]>;
      aliveById: Map<string, Pet[]>;
}

interface FormulaEstimate {
      rate: number | null;
      riskLabel: string;
      riskColor: string;
      summary: string;
}

const TRACKING_STORAGE_KEY = 'fpo.fusion.panel.tracked.v2';
const GUIDE_RENDER_STEP = 120;

const SERIES_LABELS: Record<PetSeries, string> = {
      [PetSeries.Plant]: '植物',
      [PetSeries.Dragon]: '龍系',
      [PetSeries.Beast]: '獸系',
      [PetSeries.Insect]: '昆蟲',
      [PetSeries.Metal]: '機械',
      [PetSeries.Mystery]: '神秘',
      [PetSeries.Demon]: '惡魔',
      [PetSeries.Bird]: '飛禽',
};

// 匯出資料存在少量命名差異，統一映射後可正確回填等級與系列資料。


export class FusionPanel {
      private _el: HTMLDivElement;
      private _backdrop: HTMLDivElement;
      private _petManager: PetManager;

      private _mainTab: MainFusionTab = 'recipes';
      private _seriesFilter: SeriesFilter = 'all';
      private _recipeTrackedOnly = false;
      private _treeTargetResultId: string | null = null;
      private _treeExpandedNodes = new Set<string>();
      private _treeExpandAll = false;
      private _treeRecommendedOnly = false;

      private _mainPet: Pet | null = null;
      private _subPet: Pet | null = null;
      private _hasProtection = false;
      private _selectingSlot: 'main' | 'sub' | null = null;
      private _onClose: (() => void) | null = null;

      private _formulaEntries: FormulaEntry[] = [];
      private _formulaEntriesByResultId = new Map<string, FormulaEntry[]>();
      private _petDefById = new Map<string, PetDef>();
      private _externalDefById = new Map<string, PetDef>();
      private _externalIdByName = new Map<string, string>();
      private _trackedRecipeKeys = new Set<string>();
      private _lastAppliedFormulaKey: string | null = null;
      private _recipeRenderLimit = GUIDE_RENDER_STEP;
      private _listPetsByName = new Map<string, ListPetRow>();
      private _listPetsByKey = new Map<string, ListPetRow>();
      private _petDefIdByName = new Map<string, string>();
      private _displayLevelByDefId = new Map<string, number>();
      private _recipeResultNameFilter: string | null = null;
      private _recipeIngredientNameFilter: string | null = null;
      private _recipeMapFilterName: string | null = null;
      private _recipeKeywordFilter = '';
      private _onNavigateMap: ((mapName: string, petName?: string) => void) | null = null;
      private _onResize = (): void => {
            if (this._el.style.display === 'none') return;
            this._syncResponsiveMode();
      };

      private _notice: { tone: NoticeTone; text: string } | null = null;
      private _noticeTimer = 0;

      constructor(petManager: PetManager) {
            this._petManager = petManager;
            this._petDefById = new Map(PET_DEFS.map(def => [def.id, def]));
            this._indexListPetData();
            this._formulaEntries = this._buildFormulaEntries();
            this._formulaEntriesByResultId = this._buildFormulaEntryIndex(this._formulaEntries);
            this._rebuildPetDefNameIndex();
            this._rebuildDisplayLevelIndex();
            this._trackedRecipeKeys = this._loadTrackedRecipes();

            this._backdrop = document.createElement('div');
            this._backdrop.className = 'fusion-backdrop';
            this._backdrop.addEventListener('click', () => this.close());
            document.getElementById('ui-layer')?.appendChild(this._backdrop);

            this._el = document.createElement('div');
            this._el.id = 'fusionPanel';
            this._el.className = 'fusion-root';
            this._el.addEventListener('click', (e) => e.stopPropagation());
            this._el.addEventListener('mousedown', (e) => e.stopPropagation());
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      get element(): HTMLElement { return this._el; }

      setMapNavigator(handler: ((mapName: string, petName?: string) => void) | null): void {
            this._onNavigateMap = handler;
      }

      openToRecipesByTargetName(targetName: string, sourceMap?: string): void {
            this.open();
            this._mainTab = 'recipes';
            this._recipeResultNameFilter = this._canonicalPetName(targetName);
            this._recipeIngredientNameFilter = null;
            this._recipeMapFilterName = sourceMap ? sourceMap.trim() : null;
            this._recipeKeywordFilter = '';
            this._recipeTrackedOnly = false;
            this._recipeRenderLimit = GUIDE_RENDER_STEP;
            this._setNotice(`已切到配方：${this._recipeResultNameFilter}`, 'ok');
            this._render();
      }

      openToRecipesByIngredientName(ingredientName: string, sourceMap?: string): void {
            this.open();
            this._mainTab = 'recipes';
            this._recipeResultNameFilter = null;
            this._recipeIngredientNameFilter = this._canonicalPetName(ingredientName);
            this._recipeMapFilterName = sourceMap ? sourceMap.trim() : null;
            this._recipeKeywordFilter = '';
            this._recipeTrackedOnly = false;
            this._recipeRenderLimit = GUIDE_RENDER_STEP;
            this._setNotice(`已按素材篩選：${this._recipeIngredientNameFilter}`, 'ok');
            this._render();
      }

      openToTreeByName(targetName: string, sourceMap?: string): void {
            this.open();
            const targetId = this._findPetDefIdByName(targetName);
            this._mainTab = 'tree';
            this._treeTargetResultId = targetId;
            this._treeExpandedNodes.clear();
            this._treeExpandAll = false;
            this._recipeResultNameFilter = null;
            this._recipeIngredientNameFilter = null;
            this._recipeMapFilterName = sourceMap ? sourceMap.trim() : null;
            this._recipeKeywordFilter = '';
            this._recipeTrackedOnly = false;
            this._recipeRenderLimit = GUIDE_RENDER_STEP;
            this._setNotice(targetId ? `已切到合成樹：${this._canonicalPetName(targetName)}` : `找不到目標寵物：${targetName}`, targetId ? 'ok' : 'warn');
            this._render();
      }

      open(onClose?: () => void): void {
            this._onClose = onClose || null;
            this._mainPet = null;
            this._subPet = null;
            this._hasProtection = false;
            this._selectingSlot = null;
            this._mainTab = 'recipes';
            this._treeTargetResultId = null;
            this._treeExpandedNodes.clear();
            this._treeExpandAll = false;
            this._treeRecommendedOnly = false;
            this._recipeRenderLimit = GUIDE_RENDER_STEP;
            this._recipeResultNameFilter = null;
            this._recipeIngredientNameFilter = null;
            this._recipeMapFilterName = null;
            this._recipeKeywordFilter = '';
            this._recipeTrackedOnly = false;
            this._notice = null;

            this._backdrop.style.display = 'block';
            requestAnimationFrame(() => { this._backdrop.style.opacity = '1'; });

            this._el.style.display = 'block';
            this._syncResponsiveMode();
            requestAnimationFrame(() => {
                  this._el.style.transform = 'translate(-50%, -50%) scale(1)';
                  this._el.style.opacity = '1';
            });

            this._render();
      }

      close(): void {
            this._el.style.transform = 'translate(-50%, -50%) scale(0.92)';
            this._el.style.opacity = '0';
            this._backdrop.style.opacity = '0';
            setTimeout(() => {
                  this._el.style.display = 'none';
                  this._backdrop.style.display = 'none';
            }, 200);
            this._onClose?.();
      }

      refresh(): void {
            this._mainPet = null;
            this._subPet = null;
            this._hasProtection = false;
            this._selectingSlot = null;
            this._recipeResultNameFilter = null;
            this._recipeIngredientNameFilter = null;
            this._recipeMapFilterName = null;
            this._recipeKeywordFilter = '';
            this._notice = null;
            if (this._el.style.display !== 'none') this._render();
      }

      private _render(): void {
            this._syncResponsiveMode();
            this._el.innerHTML = '';
            const snapshot = this._buildOwnedSnapshot();
            this._normalizeRecipePanelState(snapshot);

            this._el.appendChild(this._buildHeader(snapshot));
            this._el.appendChild(this._buildPrimaryTabs(snapshot));

            const body = document.createElement('div');
            body.className = 'fpo-body';

            const content = this._mainTab === 'machine'
                  ? this._buildMachineView(snapshot)
                  : this._buildRecipePanelView(snapshot);
            content.classList.add('fpo-content');
            body.appendChild(content);
            this._el.appendChild(body);

            this._el.appendChild(this._buildBottomBar());
      }

      private _buildHeader(snapshot: OwnedSnapshot): HTMLDivElement {
            const header = document.createElement('div');
            header.className = 'fpo-header';

            const title = document.createElement('span');
            title.className = 'fpo-header-title';
            title.textContent = '🔮 合成中心';

            const subtitle = document.createElement('span');
            subtitle.className = 'fpo-header-subtitle';
            subtitle.textContent = '資料來源：GAME DB s_mix（runtime）';

            const craftableCount = this._formulaEntries.filter(entry => this._isEntryCraftable(entry, snapshot)).length;
            const mappedCount = this._formulaEntries.filter(entry => this._isEntryFullyMapped(entry)).length;
            const stats = document.createElement('span');
            stats.className = 'fpo-header-stats';
            stats.textContent = `可直接合成 ${craftableCount}/${this._formulaEntries.length} · 本服可用公式 ${mappedCount}`;

            const closeBtn = document.createElement('span');
            closeBtn.className = 'fpo-header-close';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());

            header.appendChild(title);
            header.appendChild(subtitle);
            header.appendChild(stats);
            header.appendChild(closeBtn);
            return header;
      }

      private _buildPrimaryTabs(snapshot: OwnedSnapshot): HTMLDivElement {
            const row = document.createElement('div');
            row.className = 'fpo-tabs-row';

            row.appendChild(this._makePrimaryTabButton('machine', '合成機'));
            row.appendChild(this._makePrimaryTabButton('recipes', '配方'));
            row.appendChild(this._makePrimaryTabButton('tree', '合成樹'));

            if (this._lastAppliedFormulaKey) {
                  const last = this._formulaEntries.find(entry => entry.key === this._lastAppliedFormulaKey);
                  if (last) {
                        const pill = document.createElement('span');
                        pill.className = 'fpo-last-pill';
                        pill.textContent = `已選配方：${last.resultName}`;
                        row.appendChild(pill);

                        const mainOwned = snapshot.usableById.get(last.recipe.main)?.length ?? 0;
                        const subOwned = snapshot.usableById.get(last.recipe.sub)?.length ?? 0;
                        const needMain = last.recipe.main === last.recipe.sub ? 2 : 1;
                        const needSub = 1;

                        const stock = document.createElement('span');
                        stock.className = 'fpo-stock-pill';
                        stock.innerHTML = `主 <b class="fpo-stock-num ${this._stockToneClass(mainOwned >= needMain)}">${mainOwned}/${needMain}</b> · 副 <b class="fpo-stock-num ${this._stockToneClass(subOwned >= needSub)}">${subOwned}/${needSub}</b>`;
                        row.appendChild(stock);
                  }
            }

            return row;
      }

      private _makePrimaryTabButton(id: MainFusionTab, label: string): HTMLButtonElement {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `fpo-tab-btn${this._mainTab === id ? ' is-active' : ''}`;
            btn.textContent = label;
            btn.addEventListener('click', () => {
                  this._mainTab = id;
                  this._render();
            });
            return btn;
      }

      private _buildRecipePanelView(snapshot: OwnedSnapshot): HTMLDivElement {
            const root = document.createElement('div');
            root.className = 'fpo-recipe-root';

            const split = document.createElement('div');
            split.className = 'fpo-recipe-split';

            const side = document.createElement('aside');
            side.className = 'fpo-recipe-side';
            side.appendChild(this._buildSeriesChips());
            if (this._mainTab === 'tree') {
                  side.appendChild(this._buildTreeTargetSelector(snapshot));
            } else {
                  side.appendChild(this._buildRecipeFilterBar());
            }

            const main = document.createElement('section');
            main.className = 'fpo-recipe-main';

            const list = document.createElement('div');
            list.className = 'fpo-recipe-list';

            if (this._mainTab === 'tree') {
                  list.appendChild(this._buildFusionTree(snapshot));
            } else {
                  if (!this._isCompactRecipeLayout()) {
                        list.appendChild(this._buildFormulaListHeader());
                  }
                  const entries = this._getRecipeEntries(snapshot);
                  if (entries.length === 0) {
                        const empty = document.createElement('div');
                        empty.className = 'fpo-empty';
                        empty.textContent = '目前沒有符合條件的配方';
                        list.appendChild(empty);
                  } else {
                        const visibleEntries = entries.slice(0, this._recipeRenderLimit);
                        for (const entry of visibleEntries) {
                              list.appendChild(this._createFormulaCard(entry, snapshot));
                        }

                        if (entries.length > visibleEntries.length) {
                              const more = document.createElement('div');
                              more.className = 'fpo-more-wrap';
                              const btn = document.createElement('button');
                              btn.type = 'button';
                              btn.className = 'fpo-more-btn';
                              btn.textContent = `顯示更多 (${visibleEntries.length}/${entries.length})`;
                              btn.addEventListener('click', () => {
                                    this._recipeRenderLimit += GUIDE_RENDER_STEP;
                                    this._render();
                              });
                              more.appendChild(btn);
                              list.appendChild(more);
                        }
                  }
            }

            main.appendChild(list);
            split.appendChild(side);
            split.appendChild(main);
            root.appendChild(split);
            return root;
      }

      private _buildRecipeFilterBar(): HTMLDivElement {
            const row = document.createElement('div');
            row.className = 'fpo-filter-row';

            const addInfo = (text: string, tone: 'normal' | 'warn' = 'normal'): void => {
                  const pill = document.createElement('span');
                  pill.className = `fpo-filter-pill${tone === 'warn' ? ' is-warn' : ''}`;
                  pill.textContent = text;
                  row.appendChild(pill);
            };

            const modeWrap = document.createElement('div');
            modeWrap.className = 'fpo-filter-mode';
            const makeModeBtn = (label: string, active: boolean, onClick: () => void): HTMLButtonElement => {
                  const btn = document.createElement('button');
                  btn.type = 'button';
                  btn.className = `fpo-filter-mode-btn${active ? ' is-active' : ''}`;
                  btn.textContent = label;
                  btn.addEventListener('click', onClick);
                  return btn;
            };
            modeWrap.appendChild(makeModeBtn('全部', !this._recipeTrackedOnly, () => {
                  if (!this._recipeTrackedOnly) return;
                  this._recipeTrackedOnly = false;
                  this._recipeRenderLimit = GUIDE_RENDER_STEP;
                  this._render();
            }));
            modeWrap.appendChild(makeModeBtn(`收藏 ${this._trackedRecipeKeys.size}`, this._recipeTrackedOnly, () => {
                  if (this._recipeTrackedOnly) return;
                  this._recipeTrackedOnly = true;
                  this._recipeRenderLimit = GUIDE_RENDER_STEP;
                  this._render();
            }));
            row.appendChild(modeWrap);

            const keywordInput = document.createElement('input');
            keywordInput.type = 'search';
            keywordInput.className = 'fpo-filter-search';
            keywordInput.placeholder = '搜尋寵物/素材';
            keywordInput.value = this._recipeKeywordFilter;
            keywordInput.addEventListener('input', () => {
                  this._recipeKeywordFilter = keywordInput.value.trim();
                  this._recipeRenderLimit = GUIDE_RENDER_STEP;
                  this._render();
            });
            row.appendChild(keywordInput);

            if (this._recipeResultNameFilter) addInfo(`目標：${this._recipeResultNameFilter}`);
            if (this._recipeIngredientNameFilter) addInfo(`素材：${this._recipeIngredientNameFilter}`);
            if (this._recipeMapFilterName) addInfo(`地圖：${this._recipeMapFilterName}`);
            if (this._recipeKeywordFilter) addInfo(`關鍵字：${this._recipeKeywordFilter}`);

            if (!this._recipeResultNameFilter && !this._recipeIngredientNameFilter && !this._recipeMapFilterName && !this._recipeTrackedOnly && !this._recipeKeywordFilter) {
                  addInfo('顯示全部配方');
            }

            if (this._recipeResultNameFilter || this._recipeIngredientNameFilter || this._recipeMapFilterName || this._recipeTrackedOnly || this._recipeKeywordFilter) {
                  const clearBtn = document.createElement('button');
                  clearBtn.type = 'button';
                  clearBtn.className = 'fpo-filter-clear';
                  clearBtn.textContent = '清除篩選';
                  clearBtn.addEventListener('click', () => {
                        this._recipeResultNameFilter = null;
                        this._recipeIngredientNameFilter = null;
                        this._recipeMapFilterName = null;
                        this._recipeKeywordFilter = '';
                        this._recipeTrackedOnly = false;
                        this._recipeRenderLimit = GUIDE_RENDER_STEP;
                        this._render();
                  });
                  row.appendChild(clearBtn);
            }

            if (this._onNavigateMap === null) {
                  addInfo('尚未連接世界地圖跳轉', 'warn');
            }

            return row;
      }

      private _isCompactRecipeLayout(): boolean {
            const width = this._el.clientWidth || window.innerWidth || 0;
            const height = window.innerHeight || 0;
            if (this._isLandscapeFocusMode() || this._isPhoneLandscapeMode()) return true;
            const portrait = height > width;
            if (portrait) return width < 980;
            if (height > 0 && height < 340) return true;
            return width < 760;
      }

      private _isLandscapeFocusMode(): boolean {
            const width = window.innerWidth || this._el.clientWidth || 0;
            const height = window.innerHeight || 0;
            return width > height && width <= 1600 && height <= 900;
      }

      private _isPhoneLandscapeMode(): boolean {
            const width = window.innerWidth || this._el.clientWidth || 0;
            const height = window.innerHeight || 0;
            return width > height && width <= 1280 && height <= 560;
      }

      private _syncResponsiveMode(): void {
            this._el.classList.toggle('is-focus-mode', this._isLandscapeFocusMode());
            this._el.classList.toggle('is-phone-landscape', this._isPhoneLandscapeMode());
      }

      private _buildFormulaListHeader(): HTMLDivElement {
            const head = document.createElement('div');
            head.className = 'fpo-list-head';

            head.innerHTML = `
                  <div class="fpo-list-head-grid">
                        <div class="fpo-list-head-item">目標寵物</div>
                        <div class="fpo-list-head-item">合成公式</div>
                        <div class="fpo-list-head-item">等級</div>
                        <div class="fpo-list-head-item">掉蛋</div>
                        <div class="fpo-list-head-item">所在地圖</div>
                        <div class="fpo-list-head-item">操作</div>
                  </div>
            `;
            return head;
      }

      private _buildSeriesChips(): HTMLDivElement {
            const row = document.createElement('div');
            row.className = 'fpo-series-row';

            row.appendChild(this._createSeriesChip('all', '全部'));
            const seriesValues = Object.values(PetSeries) as PetSeries[];
            for (const series of seriesValues) {
                  const emoji = SERIES_EMOJI[series] || '🐾';
                  row.appendChild(this._createSeriesChip(series, `${emoji} ${SERIES_LABELS[series]}`));
            }
            return row;
      }

      private _buildTreeTargetSelector(_snapshot: OwnedSnapshot): HTMLDivElement {
            const row = document.createElement('div');
            row.className = 'fpo-tree-selector-row';

            const label = document.createElement('span');
            label.className = 'fpo-tree-selector-label';
            label.textContent = '想合成哪一隻';

            const select = document.createElement('select');
            select.className = 'fpo-tree-selector-select';

            const targets = this._listTreeTargets();
            if (targets.length === 0) {
                  const option = document.createElement('option');
                  option.value = '';
                  option.textContent = '此系列暫無可選目標';
                  select.appendChild(option);
                  select.disabled = true;
            } else {
                  for (const def of targets) {
                        const option = document.createElement('option');
                        option.value = def.id;
                        option.textContent = `${SERIES_EMOJI[def.series] || '🐾'} ${def.nameCN} · Lv.${this._getDefDisplayLevel(def)}`;
                        select.appendChild(option);
                  }
                  select.value = this._treeTargetResultId ?? targets[0].id;
            }

            select.addEventListener('change', () => {
                  this._treeTargetResultId = select.value || null;
                  this._treeExpandedNodes.clear();
                  this._treeExpandAll = false;
                  this._render();
            });

            const expandBtn = document.createElement('button');
            expandBtn.type = 'button';
            expandBtn.className = `fpo-tree-toggle${this._treeExpandAll ? ' is-active' : ''}`;
            expandBtn.textContent = this._treeExpandAll ? '收合階層' : '展開階層';
            expandBtn.addEventListener('click', () => {
                  this._treeExpandAll = !this._treeExpandAll;
                  this._render();
            });

            const recOnlyBtn = document.createElement('button');
            recOnlyBtn.type = 'button';
            recOnlyBtn.className = `fpo-tree-toggle${this._treeRecommendedOnly ? ' is-active' : ''}`;
            recOnlyBtn.textContent = '只看推薦';
            recOnlyBtn.addEventListener('click', () => {
                  this._treeRecommendedOnly = !this._treeRecommendedOnly;
                  this._render();
            });

            row.appendChild(label);
            row.appendChild(select);
            row.appendChild(expandBtn);
            row.appendChild(recOnlyBtn);
            return row;
      }
      private _buildFusionTree(snapshot: OwnedSnapshot): HTMLDivElement {
            const wrap = document.createElement('div');
            wrap.className = 'fpo-tree-wrap';

            if (!this._treeTargetResultId) {
                  const empty = document.createElement('div');
                  empty.className = 'fpo-empty';
                  empty.textContent = '請先選擇你要合成的目標寵物';
                  wrap.appendChild(empty);
                  return wrap;
            }

            const recommendedKeys = this._buildRecommendedPathKeys(this._treeTargetResultId, snapshot);
            wrap.appendChild(
                  this._createTreeNode(
                        this._treeTargetResultId,
                        snapshot,
                        0,
                        new Set<string>(),
                        this._treeTargetResultId,
                        recommendedKeys
                  )
            );
            return wrap;
      }

      private _createTreeNode(
            resultId: string,
            snapshot: OwnedSnapshot,
            depth: number,
            visited: Set<string>,
            nodeKey: string,
            recommendedKeys: Set<string>
      ): HTMLDivElement {
            const compactActionMode = this._isLandscapeFocusMode() || this._isPhoneLandscapeMode();
            const card = document.createElement('div');
            card.className = 'fpo-tree-node';
            card.style.marginLeft = `${depth * 14}px`;

            const def = this._petDefById.get(resultId);
            if (!def) {
                  card.innerHTML = `<div class="fpo-tree-note is-warn">找不到此寵物資料：${this._escapeHtml(resultId)}</div>`;
                  return card;
            }

            const entries = this._formulaEntriesByResultId.get(resultId) ?? [];
            const craftableCount = entries.filter(entry => this._isEntryCraftable(entry, snapshot)).length;
            const canExpandDepth = depth < 2;
            const hasChildFusion = entries.some(entry =>
                  this._canExpandTreeChild(entry.mainDef) || this._canExpandTreeChild(entry.subDef)
            );
            const expanded = depth === 0 || this._treeExpandAll || this._treeExpandedNodes.has(nodeKey);

            const title = document.createElement('div');
            title.className = 'fpo-tree-node-head';

            const left = document.createElement('div');
            left.className = 'fpo-tree-node-left';
            left.innerHTML = `
                  <span class="fpo-tree-node-emoji">${SERIES_EMOJI[def.series] || '🐾'}</span>
                  <div class="fpo-tree-node-main">
                        <div class="fpo-tree-node-name">${this._escapeHtml(def.nameCN)}</div>
                        <div class="fpo-tree-node-level">Lv.${this._getDefDisplayLevel(def)}</div>
                  </div>
            `;
            title.appendChild(left);

            const right = document.createElement('div');
            right.className = 'fpo-tree-node-right';

            const status = document.createElement('span');
            status.className = `fpo-tree-node-status ${craftableCount > 0 ? 'is-ok' : 'is-warn'}`;
            status.textContent = `${craftableCount}/${entries.length || 1} 可直接合成`;
            right.appendChild(status);

            if (depth > 0 && canExpandDepth && hasChildFusion) {
                  const toggleBtn = document.createElement('button');
                  toggleBtn.type = 'button';
                  toggleBtn.className = `fpo-tree-toggle${expanded ? ' is-active' : ''}`;
                  toggleBtn.textContent = expanded ? '收合' : '展開';
                  toggleBtn.addEventListener('click', () => {
                        if (expanded) this._treeExpandedNodes.delete(nodeKey);
                        else this._treeExpandedNodes.add(nodeKey);
                        this._render();
                  });
                  right.appendChild(toggleBtn);
            }

            title.appendChild(right);
            card.appendChild(title);

            if (visited.has(resultId)) {
                  const loop = document.createElement('div');
                  loop.className = 'fpo-tree-note is-warn';
                  loop.textContent = '已偵測到循環路徑，避免重複展開。';
                  card.appendChild(loop);
                  return card;
            }

            if (entries.length === 0) {
                  const leaf = document.createElement('div');
                  leaf.className = 'fpo-tree-note';
                  leaf.textContent = '此寵物目前沒有可用配方（可能為掉落或活動）。';
                  card.appendChild(leaf);
                  return card;
            }

            if (!expanded && canExpandDepth && hasChildFusion) {
                  const collapsed = document.createElement('div');
                  collapsed.className = 'fpo-tree-note';
                  collapsed.textContent = `此目標共有 ${entries.length} 個配方，點擊展開查看。`;
                  card.appendChild(collapsed);
                  return card;
            }

            const nextVisited = new Set(visited);
            nextVisited.add(resultId);
            let visibleEntryCount = 0;

            for (const entry of entries) {
                  const isRecommended = recommendedKeys.has(entry.key);
                  if (this._treeRecommendedOnly && !isRecommended) continue;
                  visibleEntryCount += 1;

                  const line = document.createElement('div');
                  line.className = `fpo-tree-entry${isRecommended ? ' is-recommended' : ''}`;

                  const estimate = this._estimateFormula(entry, snapshot);
                  const fullyMapped = this._isEntryFullyMapped(entry);
                  const canApply = fullyMapped;
                  const row = document.createElement('div');
                  row.className = 'fpo-tree-row';
                  row.innerHTML = `
                        <div class="fpo-tree-recipe">
                              ${this._ingredientLabel(entry.mainDef, entry.mainName, entry.mainBaseLevel)} + ${this._ingredientLabel(entry.subDef, entry.subName, entry.subBaseLevel)}
                        </div>
                        <div class="fpo-tree-badges">
                              ${isRecommended ? '<span class="fpo-pill fpo-pill-rec">推薦</span>' : ''}
                              <span class="fpo-pill fpo-pill-risk ${this._toneClassByColor(estimate.riskColor)}">
                                    ${estimate.rate === null ? '未知' : `${estimate.rate}%`} · ${estimate.riskLabel}
                              </span>
                        </div>
                  `;
                  line.appendChild(row);

                  const controls = document.createElement('div');
                  controls.className = 'fpo-tree-controls';

                  const meta = document.createElement('span');
                  meta.className = 'fpo-tree-meta';
                  meta.textContent = estimate.summary;
                  controls.appendChild(meta);

                  const applyBtn = document.createElement('button');
                  applyBtn.type = 'button';
                  applyBtn.className = `game-btn ${canApply ? 'game-btn-primary' : 'game-btn-secondary'} fpo-tree-apply`;
                  applyBtn.textContent = canApply
                        ? (compactActionMode ? '合成' : '去合成機')
                        : (compactActionMode ? '缺資料' : '資料缺失');
                  applyBtn.disabled = !canApply;
                  applyBtn.addEventListener('click', () => {
                        if (!canApply) return;
                        this._applyFormula(entry);
                  });
                  controls.appendChild(applyBtn);
                  line.appendChild(controls);

                  card.appendChild(line);

                  if (!canExpandDepth) continue;
                  const children = [entry.mainDef, entry.subDef]
                        .filter((ingredient): ingredient is PetDef => this._canExpandTreeChild(ingredient));
                  const childDedup = new Set<string>();
                  for (const child of children) {
                        if (childDedup.has(child.id)) continue;
                        childDedup.add(child.id);
                        card.appendChild(
                              this._createTreeNode(
                                    child.id,
                                    snapshot,
                                    depth + 1,
                                    nextVisited,
                                    `${nodeKey}>${child.id}:${entry.key}`,
                                    recommendedKeys
                              )
                        );
                  }
            }

            if (visibleEntryCount === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'fpo-tree-note';
                  empty.textContent = '目前模式下沒有可顯示配方（可關閉「只看推薦」）。';
                  card.appendChild(empty);
            }

            if (!canExpandDepth) {
                  const collapsed = document.createElement('div');
                  collapsed.className = 'fpo-tree-note is-dim';
                  collapsed.textContent = '已達展開上限（最多 3 層）。';
                  card.appendChild(collapsed);
            }
            return card;
      }

      private _createSeriesChip(filter: SeriesFilter, label: string): HTMLButtonElement {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            const active = this._seriesFilter === filter;
            btn.className = `fpo-series-chip${active ? ' is-active' : ''}`;
            btn.addEventListener('click', () => {
                  this._seriesFilter = filter;
                  this._recipeRenderLimit = GUIDE_RENDER_STEP;
                  this._render();
            });
            return btn;
      }

      private _createFormulaCard(entry: FormulaEntry, snapshot: OwnedSnapshot): HTMLDivElement {
            const card = document.createElement('div');
            card.className = 'fpo-formula-card game-card';

            const craftable = this._isEntryCraftable(entry, snapshot);
            const fullyMapped = this._isEntryFullyMapped(entry);
            const tracked = this._trackedRecipeKeys.has(entry.key);
            const status = fullyMapped ? (craftable ? '可直接合成' : '材料不足') : '資料缺失';
            const statusColor = fullyMapped ? (craftable ? '#27AE60' : '#E74C3C') : '#95A5A6';

            const mainCount = snapshot.usableById.get(entry.recipe.main)?.length ?? 0;
            const subCount = snapshot.usableById.get(entry.recipe.sub)?.length ?? 0;
            const requiredMain = entry.recipe.main === entry.recipe.sub ? 2 : 1;
            const estimate = this._estimateFormula(entry, snapshot);
            const dropEggLabel = this._formatDropEggLabel(entry.resultDropEgg);
            const compact = this._isCompactRecipeLayout();
            const focusMode = this._isLandscapeFocusMode();
            const compactActionMode = focusMode || this._isPhoneLandscapeMode();
            const dropEggToneClass = this._dropEggToneClass(entry.resultDropEgg);
            const riskToneClass = this._toneClassByColor(estimate.riskColor);
            const statusToneClass = this._toneClassByColor(statusColor);
            const mainStockClass = this._stockToneClass(mainCount >= requiredMain);
            const subStockClass = this._stockToneClass(subCount >= 1);

            const formulaGrid = document.createElement('div');
            if (compact) {
                  formulaGrid.className = 'fpo-formula-grid is-compact';
                  formulaGrid.innerHTML = `
                        <div class="fpo-formula-compact-left">
                              <div class="fpo-formula-target">
                                    ${this._seriesIconMarkup(entry.resultDef.series, 28)}
                                    <div class="fpo-formula-target-text">
                                          <div class="fpo-formula-target-name">${this._escapeHtml(entry.resultName)}</div>
                                          <div class="fpo-formula-target-sub">公式目標</div>
                                    </div>
                              </div>
                              <div class="fpo-formula-ingredients">
                                    ${this._ingredientLabel(entry.mainDef, entry.mainName, entry.mainBaseLevel)} + ${this._ingredientLabel(entry.subDef, entry.subName, entry.subBaseLevel)}
                              </div>
                              <div class="fpo-map-chip-row">${this._mapBadgeMarkup(entry.resultMapNames)}</div>
                        </div>
                        <div class="fpo-formula-compact-right">
                              <span class="fpo-formula-value">Lv.${entry.resultBaseLevel}</span>
                              <span class="fpo-formula-value ${dropEggToneClass}">${dropEggLabel}</span>
                              <span class="fpo-pill ${riskToneClass}">${estimate.rate === null ? '未知' : `${estimate.rate}%`} · ${estimate.riskLabel}</span>
                              <span class="fpo-pill ${statusToneClass}">${status}</span>
                        </div>
                  `;
            } else {
                  formulaGrid.className = 'fpo-formula-grid is-full';
                  formulaGrid.innerHTML = `
                        <div class="fpo-formula-target">
                              ${this._seriesIconMarkup(entry.resultDef.series, 28)}
                              <div class="fpo-formula-target-text">
                                    <div class="fpo-formula-target-name">${this._escapeHtml(entry.resultName)}</div>
                                    <div class="fpo-formula-target-sub">公式目標</div>
                              </div>
                        </div>
                        <div class="fpo-formula-ingredients">
                              ${this._ingredientLabel(entry.mainDef, entry.mainName, entry.mainBaseLevel)} + ${this._ingredientLabel(entry.subDef, entry.subName, entry.subBaseLevel)}
                        </div>
                        <div class="fpo-formula-value">Lv.${entry.resultBaseLevel}</div>
                        <div class="fpo-formula-value ${dropEggToneClass}">${dropEggLabel}</div>
                        <div class="fpo-map-chip-row">${this._mapBadgeMarkup(entry.resultMapNames)}</div>
                        <div class="fpo-formula-pill-row">
                              <span class="fpo-pill ${riskToneClass}">${estimate.rate === null ? '未知' : `${estimate.rate}%`} · ${estimate.riskLabel}</span>
                              <span class="fpo-pill ${statusToneClass}">${status}</span>
                        </div>
                  `;
            }
            card.appendChild(formulaGrid);

            const brief = document.createElement('div');
            brief.className = 'fpo-brief-line';
            brief.innerHTML = `材料庫存：主 <b class="fpo-stock-num ${mainStockClass}">${mainCount}/${requiredMain}</b> · 副 <b class="fpo-stock-num ${subStockClass}">${subCount}/1</b> · 估算：${this._escapeHtml(estimate.summary)}`;
            if (compactActionMode) {
                  brief.innerHTML = `主 <b class="fpo-stock-num ${mainStockClass}">${mainCount}/${requiredMain}</b> · 副 <b class="fpo-stock-num ${subStockClass}">${subCount}/1</b>`;
            }
            card.appendChild(brief);

            const actions = document.createElement('div');
            actions.className = `fpo-action-row ${compact ? 'is-compact' : 'is-full'}`;

            const applyBtn = document.createElement('button');
            applyBtn.type = 'button';
            const canApply = fullyMapped;
            applyBtn.className = `game-btn ${canApply ? 'game-btn-primary' : 'game-btn-secondary'} fpo-card-btn`;
            applyBtn.textContent = canApply
                  ? (compactActionMode ? '合成' : '去合成機')
                  : (compactActionMode ? '缺資料' : '資料缺失');
            if (!canApply) applyBtn.disabled = true;
            applyBtn.addEventListener('click', () => {
                  if (!canApply) return;
                  this._applyFormula(entry);
            });

            const trackBtn = document.createElement('button');
            trackBtn.type = 'button';
            trackBtn.className = 'game-btn game-btn-secondary';
            trackBtn.textContent = tracked
                  ? (compactActionMode ? '已收藏' : '★ 取消收藏')
                  : (compactActionMode ? '收藏' : '☆ 加入收藏');
            if (tracked) trackBtn.classList.add('is-active');
            trackBtn.classList.add('fpo-card-btn');
            trackBtn.addEventListener('click', () => {
                  this._toggleTracked(entry.key);
                  this._render();
            });

            const mapBtn = document.createElement('button');
            mapBtn.type = 'button';
            mapBtn.className = 'game-btn game-btn-ghost fpo-card-btn fpo-card-btn-map';
            const mapName = entry.resultMapNames[0] ?? '';
            const canMapJump = Boolean(mapName && this._onNavigateMap);
            mapBtn.textContent = mapName
                  ? (compactActionMode ? '地圖' : '去地圖')
                  : (compactActionMode ? '無地圖' : '暫無地圖');
            mapBtn.title = mapName ? `前往地圖：${mapName}` : '暫無地圖';
            mapBtn.disabled = !canMapJump;
            mapBtn.addEventListener('click', () => {
                  if (!canMapJump || !mapName || !this._onNavigateMap) return;
                  this._onNavigateMap(mapName, entry.resultName);
            });

            actions.appendChild(applyBtn);
            actions.appendChild(trackBtn);
            actions.appendChild(mapBtn);
            card.appendChild(actions);

            return card;
      }
      private _buildMachineView(snapshot: OwnedSnapshot): HTMLDivElement {
            const root = document.createElement('div');
            root.className = 'fpo-machine-root';

            root.appendChild(this._buildMachineStepBar());
            root.appendChild(this._buildMachineCard(snapshot));
            return root;
      }

      private _buildMachineStepBar(): HTMLDivElement {
            const bar = document.createElement('div');
            bar.className = 'fpo-machine-step';
            bar.innerHTML = `
                  <span class="fpo-machine-step-accent">步驟 1</span> 選配方
                  <span class="fpo-machine-step-arrow">→</span>
                  <span class="fpo-machine-step-accent">步驟 2</span> 手動放入主寵 + 副寵
                  <span class="fpo-machine-step-arrow">→</span>
                  <span class="fpo-machine-step-accent">步驟 3</span> 開始合成
            `;
            return bar;
      }

      private _buildMachineCard(snapshot: OwnedSnapshot): HTMLDivElement {
            const card = document.createElement('div');
            card.className = 'fpo-machine-card';

            const head = document.createElement('div');
            head.className = 'fpo-machine-head';
            head.innerHTML = '<span class="fpo-machine-title">⚗️ 合成機</span>';

            const swapBtn = document.createElement('button');
            swapBtn.type = 'button';
            swapBtn.textContent = '互換主/副';
            swapBtn.className = 'fpo-machine-mini-btn ml-auto';
            swapBtn.addEventListener('click', () => {
                  const oldMain = this._mainPet;
                  this._mainPet = this._subPet;
                  this._subPet = oldMain;
                  this._render();
            });

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.textContent = '清空';
            clearBtn.className = 'fpo-machine-mini-btn';
            clearBtn.addEventListener('click', () => {
                  this._mainPet = null;
                  this._subPet = null;
                  this._selectingSlot = null;
                  this._render();
            });

            head.appendChild(swapBtn);
            head.appendChild(clearBtn);
            card.appendChild(head);

            if (this._notice) {
                  const notice = document.createElement('div');
                  notice.className = `fpo-machine-notice ${this._notice.tone === 'ok' ? 'is-ok' : 'is-warn'}`;
                  notice.textContent = this._notice.text;
                  card.appendChild(notice);
            }

            const slotsRow = document.createElement('div');
            slotsRow.className = 'fpo-machine-slots';
            slotsRow.appendChild(this._createPetSlot('主寵', this._mainPet, 'main'));
            const plus = document.createElement('div');
            plus.textContent = '+';
            plus.className = 'fpo-machine-plus';
            slotsRow.appendChild(plus);
            slotsRow.appendChild(this._createPetSlot('副寵', this._subPet, 'sub'));
            card.appendChild(slotsRow);

            card.appendChild(this._buildResultBox());
            card.appendChild(this._buildProtectionRow());

            if (this._selectingSlot) {
                  card.appendChild(this._buildPickerList(snapshot));
            }

            return card;
      }

      private _buildResultBox(): HTMLDivElement {
            const resultBox = document.createElement('div');
            resultBox.className = 'fpo-result-box';

            if (this._mainPet && this._subPet) {
                  const matches = PetFusion.findRecipes(this._mainPet, this._subPet);
                  if (matches.length > 0) {
                        const match = matches[0];
                        const rate = PetFusion.getSuccessRate(this._mainPet, this._subPet, match.resultDef);
                        const emoji = SERIES_EMOJI[match.resultDef.series] || '🐾';
                        const risk = this._riskInfoFromRate(rate);
                        const riskToneClass = this._toneClassByColor(risk.color);
                        resultBox.innerHTML = `
                              <div class="fpo-result-label">成功率</div>
                              <div class="fpo-result-rate ${riskToneClass}">${rate}%</div>
                              <div class="fpo-result-risk ${riskToneClass}">${risk.label}</div>
                              <div class="fpo-result-name">${emoji} ${this._escapeHtml(match.resultDef.nameCN)}</div>
                              ${matches.length > 1 ? `<div class="fpo-result-more">另有 ${matches.length - 1} 種可用結果</div>` : ''}
                        `;
                  } else {
                        resultBox.innerHTML = `
                              <div class="fpo-result-fail-title">無法進行合成</div>
                              <div class="fpo-result-fail-sub">請更換主寵/副寵，或回說明書查看可用配方</div>
                        `;
                  }
            } else {
                  resultBox.innerHTML = `
                        <div class="fpo-result-placeholder-title">合成結果預覽</div>
                        <div class="fpo-result-placeholder-sub">先手動放入主寵與副寵，再開始合成</div>
                  `;
            }
            return resultBox;
      }

      private _buildProtectionRow(): HTMLDivElement {
            const row = document.createElement('div');
            row.className = 'fpo-protect-row';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this._hasProtection;
            checkbox.className = 'fpo-protect-check';
            checkbox.addEventListener('change', () => { this._hasProtection = checkbox.checked; });

            const label = document.createElement('span');
            label.className = 'fpo-protect-label';
            label.textContent = '啟用保護石（失敗不降主寵等級）';

            row.appendChild(checkbox);
            row.appendChild(label);
            return row;
      }

      private _buildPickerList(snapshot: OwnedSnapshot): HTMLDivElement {
            const listSec = document.createElement('div');
            listSec.className = 'fpo-picker-list';

            const title = document.createElement('div');
            title.className = 'fpo-picker-title';
            title.textContent = this._selectingSlot === 'main' ? '選擇主寵' : '選擇副寵';
            listSec.appendChild(title);

            const rows = [...snapshot.usable].filter((pet) => {
                  if (this._selectingSlot === 'main' && pet === this._subPet) return false;
                  if (this._selectingSlot === 'sub' && pet === this._mainPet) return false;
                  return true;
            }).sort((a, b) => b.stats.level - a.stats.level);

            if (rows.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'fpo-picker-empty';
                  empty.textContent = '沒有可用寵物';
                  listSec.appendChild(empty);
                  return listSec;
            }

            for (const pet of rows) {
                  const row = document.createElement('div');
                  row.className = 'fpo-picker-row';
                  row.innerHTML = `
                        <span class="fpo-picker-emoji">${SERIES_EMOJI[pet.def.series] || '🐾'}</span>
                        <div class="fpo-picker-main">
                              <div class="fpo-picker-name">${pet.def.nameCN}</div>
                              <div class="fpo-picker-sub">${pet.def.name} · Lv.${pet.stats.level}</div>
                        </div>
                  `;
                  row.addEventListener('click', () => {
                        if (this._selectingSlot === 'main') this._mainPet = pet;
                        else this._subPet = pet;
                        this._selectingSlot = null;
                        this._render();
                  });
                  listSec.appendChild(row);
            }
            return listSec;
      }

      private _buildBottomBar(): HTMLDivElement {
            const bar = document.createElement('div');
            bar.className = 'fpo-bottom-bar';
            const compactActionMode = this._isLandscapeFocusMode() || this._isPhoneLandscapeMode();

            const left = document.createElement('span');
            left.innerHTML = '<span class="fpo-bottom-gp-label">GP</span>';
            left.className = 'fpo-bottom-gp';
            bar.appendChild(left);

            const action = document.createElement('button');
            action.className = 'game-btn game-btn-primary fpo-bottom-action';

            if (this._mainTab === 'machine') {
                  const canFuse = Boolean(this._mainPet && this._subPet && PetFusion.findRecipes(this._mainPet, this._subPet).length > 0);
                  action.textContent = '合成';
                  if (!canFuse) {
                        action.disabled = true;
                        action.classList.remove('game-btn-primary');
                        action.classList.add('game-btn-secondary');
                  }
                  action.addEventListener('click', () => { if (canFuse) this._executeFusion(); });
            } else {
                  action.textContent = compactActionMode ? '合成機' : '回合成機';
                  action.addEventListener('click', () => {
                        this._mainTab = 'machine';
                        this._render();
                  });
            }
            bar.appendChild(action);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'game-btn game-btn-ghost fpo-bottom-close';
            closeBtn.textContent = '關閉';
            closeBtn.addEventListener('click', () => this.close());
            bar.appendChild(closeBtn);

            return bar;
      }

      private _applyFormula(entry: FormulaEntry): void {
            if (!this._isEntryFullyMapped(entry)) {
                  this._setNotice('此配方資料不完整，暫時無法使用。', 'warn');
                  this._render();
                  return;
            }
            this._mainPet = null;
            this._subPet = null;
            this._selectingSlot = null;
            this._lastAppliedFormulaKey = entry.key;
            this._mainTab = 'machine';
            this._setNotice(
                  `已選擇配方：${entry.resultName}，請到合成機手動放入主寵與副寵。`,
                  'ok'
            );
            this._render();
      }

      private _getRecipeEntries(snapshot: OwnedSnapshot): FormulaEntry[] {
            const bySeries = this._formulaEntries.filter(entry => this._seriesFilter === 'all' || entry.resultDef.series === this._seriesFilter);
            let entries = bySeries;

            if (this._recipeTrackedOnly) {
                  entries = entries.filter(entry => this._trackedRecipeKeys.has(entry.key));
            }

            if (this._recipeResultNameFilter) {
                  const target = this._canonicalPetName(this._recipeResultNameFilter);
                  entries = entries.filter(entry => this._canonicalPetName(entry.resultName) === target);
            }

            if (this._recipeIngredientNameFilter) {
                  const ingredient = this._canonicalPetName(this._recipeIngredientNameFilter);
                  entries = entries.filter(entry =>
                        this._canonicalPetName(entry.mainName) === ingredient ||
                        this._canonicalPetName(entry.subName) === ingredient
                  );
            }

            if (this._recipeMapFilterName) {
                  const mapName = this._recipeMapFilterName.trim();
                  entries = entries.filter(entry => entry.resultMapNames.some(name => name === mapName));
            }

            if (this._recipeKeywordFilter) {
                  const key = this._normalizeNameKey(this._canonicalPetName(this._recipeKeywordFilter));
                  entries = entries.filter(entry => {
                        const result = this._normalizeNameKey(this._canonicalPetName(entry.resultName));
                        const main = this._normalizeNameKey(this._canonicalPetName(entry.mainName));
                        const sub = this._normalizeNameKey(this._canonicalPetName(entry.subName));
                        return result.includes(key) || main.includes(key) || sub.includes(key);
                  });
            }

            return entries.sort((a, b) => {
                  const ac = this._isEntryCraftable(a, snapshot) ? 0 : 1;
                  const bc = this._isEntryCraftable(b, snapshot) ? 0 : 1;
                  if (ac !== bc) return ac - bc;
                  if (a.resultBaseLevel !== b.resultBaseLevel) return a.resultBaseLevel - b.resultBaseLevel;
                  return a.resultName.localeCompare(b.resultName, 'zh-Hant');
            });
      }

      private _toggleTracked(key: string): void {
            if (this._trackedRecipeKeys.has(key)) this._trackedRecipeKeys.delete(key);
            else this._trackedRecipeKeys.add(key);
            this._saveTrackedRecipes();
      }

      private _isEntryCraftable(entry: FormulaEntry, snapshot: OwnedSnapshot): boolean {
            if (!this._isEntryFullyMapped(entry)) return false;
            const mainCount = snapshot.usableById.get(entry.recipe.main)?.length ?? 0;
            const subCount = snapshot.usableById.get(entry.recipe.sub)?.length ?? 0;
            if (entry.recipe.main === entry.recipe.sub) return mainCount >= 2;
            return mainCount >= 1 && subCount >= 1;
      }

      private _isEntryFullyMapped(entry: FormulaEntry): boolean {
            return entry.isResolvedResult && entry.isResolvedMain && entry.isResolvedSub;
      }

      private _estimateFormula(entry: FormulaEntry, snapshot: OwnedSnapshot): FormulaEstimate {
            if (!this._isEntryFullyMapped(entry)) {
                  return {
                        rate: null,
                        riskLabel: '資料缺失',
                        riskColor: '#95A5A6',
                        summary: '配方資料不完整，暫時無法估算。',
                  };
            }
            if (!this._isEntryCraftable(entry, snapshot)) {
                  return {
                        rate: null,
                        riskLabel: '材料不足',
                        riskColor: '#95A5A6',
                        summary: '材料不足，請先收集主寵與副寵。',
                  };
            }
            return {
                  rate: null,
                  riskLabel: '待放入',
                  riskColor: '#5DADE2',
                  summary: '請到合成機手動放入主寵與副寵後查看成功率。',
            };
      }

      private _riskInfoFromRate(rate: number): { label: string; color: string } {
            if (rate >= 75) return { label: '低風險', color: '#27AE60' };
            if (rate >= 50) return { label: '中風險', color: '#F39C12' };
            return { label: '高風險', color: '#E74C3C' };
      }

      private _toneClassByColor(color: string): string {
            const key = color.trim().toUpperCase();
            if (key === '#27AE60') return 'is-ok';
            if (key === '#E74C3C') return 'is-warn';
            if (key === '#F39C12') return 'is-mid';
            if (key === '#5DADE2') return 'is-info';
            return 'is-neutral';
      }

      private _dropEggToneClass(dropEgg: boolean | null): string {
            if (dropEgg === true) return 'is-ok';
            if (dropEgg === false) return 'is-warn';
            return 'is-neutral';
      }

      private _stockToneClass(hasEnough: boolean): string {
            return hasEnough ? 'is-ok' : 'is-warn';
      }

      private _buildRecommendedPathKeys(rootResultId: string, snapshot: OwnedSnapshot): Set<string> {
            const keys = new Set<string>();
            const visited = new Set<string>();

            const walk = (resultId: string, depth: number): void => {
                  if (visited.has(resultId) || depth > 2) return;
                  visited.add(resultId);

                  const entries = this._formulaEntriesByResultId.get(resultId) ?? [];
                  if (entries.length === 0) return;
                  const best = this._pickRecommendedEntry(entries, snapshot);
                  if (!best) return;

                  keys.add(best.key);
                  if (depth >= 2) return;

                  const children = [best.mainDef, best.subDef]
                        .filter((def): def is PetDef => this._canExpandTreeChild(def));
                  const childDedup = new Set<string>();
                  for (const child of children) {
                        if (childDedup.has(child.id)) continue;
                        childDedup.add(child.id);
                        walk(child.id, depth + 1);
                  }
            };

            walk(rootResultId, 0);
            return keys;
      }

      private _pickRecommendedEntry(entries: FormulaEntry[], snapshot: OwnedSnapshot): FormulaEntry | null {
            if (entries.length === 0) return null;
            let best = entries[0];
            let bestScore = this._scoreEntryForRecommendedPath(best, snapshot);

            for (let i = 1; i < entries.length; i += 1) {
                  const score = this._scoreEntryForRecommendedPath(entries[i], snapshot);
                  if (score > bestScore) {
                        best = entries[i];
                        bestScore = score;
                  }
            }
            return best;
      }

      private _scoreEntryForRecommendedPath(entry: FormulaEntry, snapshot: OwnedSnapshot): number {
            const estimate = this._estimateFormula(entry, snapshot);
            const rate = estimate.rate ?? 0;
            const craftableBonus = this._isEntryCraftable(entry, snapshot) ? 300 : 0;
            const missingPenalty = this._missingIngredientCount(entry, snapshot) * 80;
            return craftableBonus + rate - missingPenalty;
      }

      private _missingIngredientCount(entry: FormulaEntry, snapshot: OwnedSnapshot): number {
            const mainCount = snapshot.usableById.get(entry.recipe.main)?.length ?? 0;
            const subCount = snapshot.usableById.get(entry.recipe.sub)?.length ?? 0;
            if (entry.recipe.main === entry.recipe.sub) return Math.max(0, 2 - mainCount);
            return Math.max(0, 1 - mainCount) + Math.max(0, 1 - subCount);
      }

      private _canExpandTreeChild(def: PetDef | null): def is PetDef {
            if (!def) return false;
            const entries = this._formulaEntriesByResultId.get(def.id);
            return Boolean(entries && entries.length > 0);
      }

      private _listTreeTargets(): PetDef[] {
            const targetMap = new Map<string, PetDef>();
            for (const entry of this._formulaEntries) {
                  if (!entry.isResolvedResult) continue;
                  if (this._seriesFilter !== 'all' && entry.resultDef.series !== this._seriesFilter) continue;
                  targetMap.set(entry.resultDef.id, entry.resultDef);
            }
            return Array.from(targetMap.values()).sort((a, b) => {
                  const la = this._getDefDisplayLevel(a);
                  const lb = this._getDefDisplayLevel(b);
                  if (la !== lb) return la - lb;
                  return a.nameCN.localeCompare(b.nameCN, 'zh-Hant');
            });
      }

      private _ingredientLabel(def: PetDef | null, fallbackName: string, baseLevel?: number): string {
            const levelTag = Number.isFinite(baseLevel)
                  ? ` <span class="fpo-ingredient-level">Lv.${Math.max(1, Math.floor(baseLevel!))}</span>`
                  : '';
            if (!def) return `<span class="fpo-ingredient-missing">[資料缺少] ${this._escapeHtml(fallbackName)}</span>${levelTag}`;
            return `<span class="fpo-ingredient-name">${SERIES_EMOJI[def.series] || '🐾'} ${this._escapeHtml(def.nameCN)}</span>${levelTag}`;
      }

      private _normalizeRecipePanelState(_snapshot: OwnedSnapshot): void {
            if (this._mainTab === 'tree') {
                  const targets = this._listTreeTargets();
                  if (!this._treeTargetResultId || !targets.some(def => def.id === this._treeTargetResultId)) {
                        this._treeTargetResultId = targets[0]?.id ?? null;
                        this._treeExpandedNodes.clear();
                  }
                  return;
            }

            if (this._recipeResultNameFilter) {
                  this._recipeResultNameFilter = this._canonicalPetName(this._recipeResultNameFilter);
            }
            if (this._recipeIngredientNameFilter) {
                  this._recipeIngredientNameFilter = this._canonicalPetName(this._recipeIngredientNameFilter);
            }
            if (this._recipeMapFilterName && !this._isKnownMapName(this._recipeMapFilterName)) {
                  this._recipeMapFilterName = null;
            }
      }

      private _isKnownMapName(mapName: string): boolean {
            const target = mapName.trim();
            if (!target) return false;
            return this._formulaEntries.some(entry => entry.resultMapNames.some(name => name === target));
      }

      private _buildOwnedSnapshot(): OwnedSnapshot {
            const usable = this._petManager.owned.filter(p => !p.isActive && !p.isDead);
            const alive = this._petManager.owned.filter(p => !p.isDead);

            const usableById = new Map<string, Pet[]>();
            for (const pet of usable) {
                  const list = usableById.get(pet.def.id);
                  if (list) list.push(pet);
                  else usableById.set(pet.def.id, [pet]);
            }

            const aliveById = new Map<string, Pet[]>();
            for (const pet of alive) {
                  const list = aliveById.get(pet.def.id);
                  if (list) list.push(pet);
                  else aliveById.set(pet.def.id, [pet]);
            }

            return { usable, alive, usableById, aliveById };
      }

      private _buildFormulaEntries(): FormulaEntry[] {
            const fromRuntime = this._buildFormulaEntriesFromRuntime();
            if (fromRuntime.length > 0) return fromRuntime;
            return this._buildFormulaEntriesFromPetDefs();
      }
      private _buildFormulaEntriesFromPetDefs(): FormulaEntry[] {
            const entries: FormulaEntry[] = [];
            for (const def of PET_DEFS) {
                  if (def.acquisition !== 'fusion' || def.fusionRecipes.length === 0) continue;
                  def.fusionRecipes.forEach((recipe, index) => {
                        const mainDef = this._petDefById.get(recipe.main) ?? null;
                        const subDef = this._petDefById.get(recipe.sub) ?? null;
                        entries.push({
                              key: `${def.id}::${index}::${recipe.main}+${recipe.sub}`,
                              source: 'pet_defs',
                              resultName: def.nameCN,
                              resultDef: def,
                              isResolvedResult: true,
                              resultBaseLevel: def.baseLevel,
                              resultDropEgg: null,
                              resultDropEggRaw: null,
                              resultMapNames: [],
                              recipe,
                              mainName: mainDef?.nameCN ?? recipe.main,
                              mainDef,
                              isResolvedMain: Boolean(mainDef),
                              mainBaseLevel: mainDef?.baseLevel ?? 1,
                              subName: subDef?.nameCN ?? recipe.sub,
                              subDef,
                              isResolvedSub: Boolean(subDef),
                              subBaseLevel: subDef?.baseLevel ?? 1,
                              mainAdjust: 0,
                              subAdjust: 0,
                        });
                  });
            }
            return entries.sort((a, b) => {
                  if (a.resultBaseLevel !== b.resultBaseLevel) return a.resultBaseLevel - b.resultBaseLevel;
                  return a.resultName.localeCompare(b.resultName, 'zh-Hant');
            });
      }

      private _buildFormulaEntriesFromRuntime(): FormulaEntry[] {
            const rows = getRuntimeFusionGuideEntries();
            if (rows.length === 0) return [];

            const nameIndex = new Map<string, PetDef>();
            for (const def of PET_DEFS) {
                  const canonical = this._canonicalPetName(def.nameCN.trim());
                  nameIndex.set(canonical, def);
                  nameIndex.set(this._normalizeNameKey(canonical), def);
            }

            const dedupe = new Set<string>();
            const entries: FormulaEntry[] = [];

            for (let i = 0; i < rows.length; i += 1) {
                  const row = rows[i];
                  const resultName = this._canonicalPetName((row.resultName ?? '').trim());
                  const mainName = this._canonicalPetName((row.mainName ?? '').trim());
                  const subName = this._canonicalPetName((row.subName ?? '').trim());
                  if (!resultName || !mainName || !subName) continue;

                  const dedupeKey = `${resultName}|${mainName}|${subName}|${row.mainAdjust ?? 0}|${row.subAdjust ?? 0}`;
                  if (dedupe.has(dedupeKey)) continue;
                  dedupe.add(dedupeKey);

                  const resultResolved = this._resolvePetDefByName(resultName, nameIndex);
                  const mainResolved = this._resolvePetDefByName(mainName, nameIndex);
                  const subResolved = this._resolvePetDefByName(subName, nameIndex);

                  const resultLevelHint = this._resolveLevelHint(resultName, row.resultLevel, resultResolved?.baseLevel ?? 1);
                  const mainLevelHint = this._resolveLevelHint(mainName, row.mainLevel, mainResolved?.baseLevel ?? 1);
                  const subLevelHint = this._resolveLevelHint(subName, row.subLevel, subResolved?.baseLevel ?? 1);

                  const resultSeriesHint = row.resultSeries ?? this._seriesHintFromList(resultName);
                  const mainSeriesHint = row.mainSeries ?? this._seriesHintFromList(mainName);
                  const subSeriesHint = row.subSeries ?? this._seriesHintFromList(subName);

                  const resultDef = resultResolved ?? this._getOrCreateExternalDef(resultName, resultSeriesHint, resultLevelHint);
                  const mainDef = mainResolved ?? this._getOrCreateExternalDef(mainName, mainSeriesHint, mainLevelHint);
                  const subDef = subResolved ?? this._getOrCreateExternalDef(subName, subSeriesHint, subLevelHint);
                  const resultBaseLevel = this._resolveLevelHint(resultName, row.resultLevel, resultDef.baseLevel);
                  const mainBaseLevel = this._resolveLevelHint(mainName, row.mainLevel, mainDef.baseLevel);
                  const subBaseLevel = this._resolveLevelHint(subName, row.subLevel, subDef.baseLevel);
                  const resultDropEggRaw = typeof row.resultDropEgg === 'boolean' ? (row.resultDropEgg ? '1' : '0') : null;
                  const resultDropEgg = typeof row.resultDropEgg === 'boolean' ? row.resultDropEgg : null;
                  const resultMapNames = this._normalizeStringArray(row.resultMaps);

                  entries.push({
                        key: `runtime::${row.recipeId ?? 0}::${dedupeKey}::${i}`,
                        source: 'runtime',
                        resultName,
                        resultDef,
                        isResolvedResult: true,
                        resultBaseLevel,
                        resultDropEgg,
                        resultDropEggRaw,
                        resultMapNames,
                        recipe: {
                              main: mainResolved?.id ?? mainDef.id,
                              sub: subResolved?.id ?? subDef.id,
                        },
                        mainName,
                        mainDef,
                        isResolvedMain: true,
                        mainBaseLevel,
                        subName,
                        subDef,
                        isResolvedSub: true,
                        subBaseLevel,
                        mainAdjust: Number.isFinite(Number(row.mainAdjust)) ? Number(row.mainAdjust) : 0,
                        subAdjust: Number.isFinite(Number(row.subAdjust)) ? Number(row.subAdjust) : 0,
                  });
            }

            return entries.sort((a, b) => {
                  if (a.resultBaseLevel !== b.resultBaseLevel) return a.resultBaseLevel - b.resultBaseLevel;
                  return a.resultName.localeCompare(b.resultName, 'zh-Hant');
            });
      }

      private _buildFormulaEntryIndex(entries: FormulaEntry[]): Map<string, FormulaEntry[]> {
            const index = new Map<string, FormulaEntry[]>();
            for (const entry of entries) {
                  const list = index.get(entry.resultDef.id);
                  if (list) list.push(entry);
                  else index.set(entry.resultDef.id, [entry]);
            }
            return index;
      }

      private _resolvePetDefByName(name: string, nameIndex: Map<string, PetDef>): PetDef | null {
            const canonicalName = this._canonicalPetName(name);
            const direct = nameIndex.get(canonicalName);
            if (direct) return direct;
            return nameIndex.get(this._normalizeNameKey(canonicalName)) ?? null;
      }

      private _normalizeNameKey(raw: string): string {
            return normalizeFusionNameKey(raw);
      }

      private _canonicalPetName(raw: string): string {
            return canonicalPetName(raw);
      }

      private _rebuildPetDefNameIndex(): void {
            this._petDefIdByName = new Map<string, string>();
            for (const def of this._petDefById.values()) {
                  this._addPetDefNameIndex(def.nameCN, def.id);
                  this._addPetDefNameIndex(def.name, def.id);
            }
      }

      private _addPetDefNameIndex(name: string, id: string): void {
            const clean = name.trim();
            if (!clean) return;
            this._petDefIdByName.set(clean, id);
            this._petDefIdByName.set(this._normalizeNameKey(clean), id);
            const canonical = this._canonicalPetName(clean);
            this._petDefIdByName.set(canonical, id);
            this._petDefIdByName.set(this._normalizeNameKey(canonical), id);
      }

      private _findPetDefIdByName(name: string): string | null {
            const clean = name.trim();
            if (!clean) return null;
            const canonical = this._canonicalPetName(clean);
            const direct = this._petDefIdByName.get(canonical);
            if (direct) return direct;
            return this._petDefIdByName.get(this._normalizeNameKey(canonical)) ?? null;
      }

      private _rebuildDisplayLevelIndex(): void {
            const levelById = new Map<string, number>();

            const pushLevel = (defId: string | null | undefined, rawLevel: number | null | undefined): void => {
                  if (!defId || !Number.isFinite(rawLevel)) return;
                  const level = Math.max(1, Math.floor(rawLevel!));
                  const prev = levelById.get(defId) ?? 0;
                  if (level > prev) levelById.set(defId, level);
            };

            for (const def of this._petDefById.values()) {
                  pushLevel(def.id, def.baseLevel);
            }
            for (const [name, row] of this._listPetsByName) {
                  const level = typeof row.level === 'number' && Number.isFinite(row.level) ? row.level : null;
                  if (level === null) continue;
                  const defId = this._findPetDefIdByName(name);
                  pushLevel(defId, level);
            }
            for (const entry of this._formulaEntries) {
                  pushLevel(entry.resultDef.id, entry.resultBaseLevel);
                  pushLevel(entry.mainDef?.id, entry.mainBaseLevel);
                  pushLevel(entry.subDef?.id, entry.subBaseLevel);
            }

            this._displayLevelByDefId = levelById;
      }

      private _getDefDisplayLevel(def: PetDef, fallbackLevel?: number): number {
            const indexed = this._displayLevelByDefId.get(def.id);
            if (Number.isFinite(indexed)) return Math.max(1, Math.floor(indexed!));
            if (Number.isFinite(fallbackLevel)) return Math.max(1, Math.floor(fallbackLevel!));
            return Math.max(1, Math.floor(def.baseLevel));
      }

      private _indexListPetData(): void {
            const payload = listPetsRaw as ListPetPayload;
            const rows = Array.isArray(payload.pets) ? payload.pets : [];
            this._listPetsByName = new Map<string, ListPetRow>();
            this._listPetsByKey = new Map<string, ListPetRow>();

            for (const row of rows) {
                  const name = this._canonicalPetName(String(row?.name ?? '').trim());
                  if (!name) continue;
                  this._listPetsByName.set(name, row);
                  this._listPetsByKey.set(this._normalizeNameKey(name), row);
            }
      }

      private _findListPetByName(name: string): ListPetRow | null {
            const cleanName = this._canonicalPetName(name.trim());
            if (!cleanName) return null;
            const direct = this._listPetsByName.get(cleanName);
            if (direct) return direct;
            return this._listPetsByKey.get(this._normalizeNameKey(cleanName)) ?? null;
      }

      private _seriesHintFromList(name: string): string | null {
            const row = this._findListPetByName(name);
            const series = typeof row?.series === 'string' ? row.series.trim() : '';
            return series || null;
      }

      private _resolveLevelHint(name: string, rawLevel: unknown, fallbackLevel: number): number {
            const rowLevel = typeof rawLevel === 'number' && Number.isFinite(rawLevel) ? Math.floor(rawLevel) : null;
            const listRow = this._findListPetByName(name);
            const listLevelRaw = listRow?.level;
            const listLevel = typeof listLevelRaw === 'number' && Number.isFinite(listLevelRaw)
                  ? Math.floor(listLevelRaw)
                  : null;

            if (rowLevel !== null && rowLevel > 1) return rowLevel;
            if (listLevel !== null && listLevel > 1) return listLevel;
            if (rowLevel !== null) return Math.max(1, rowLevel);
            if (listLevel !== null) return Math.max(1, listLevel);
            return Math.max(1, Math.floor(fallbackLevel));
      }

      private _parseDropEgg(value: string | null): boolean | null {
            if (!value) return null;
            const v = value.trim();
            if (!v) return null;
            return v !== '0';
      }

      private _normalizeStringArray(value: unknown): string[] {
            if (Array.isArray(value)) {
                  const list = value
                        .map(item => String(item ?? '').trim())
                        .filter(item => item.length > 0);
                  return Array.from(new Set(list));
            }
            if (typeof value === 'string') {
                  const one = value.trim();
                  return one ? [one] : [];
            }
            return [];
      }

      private _formatDropEggLabel(dropEgg: boolean | null): string {
            if (dropEgg === null) return '未知';
            return dropEgg ? '會掉蛋' : '不掉蛋';
      }

      private _mapBadgeMarkup(maps: string[]): string {
            if (maps.length === 0) {
                  return '<span class="fpo-map-chip is-empty">暫無地圖</span>';
            }
            const chips = maps.slice(0, 3).map(map => `
                  <span class="fpo-map-chip" title="${this._escapeHtml(map)}">
                        ${this._escapeHtml(map)}
                  </span>
            `);
            if (maps.length > 3) {
                  chips.push(`<span class="fpo-map-chip is-more">+${maps.length - 3}</span>`);
            }
            return chips.join('');
      }

      private _escapeHtml(value: string): string {
            return value
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }

      private _seriesIconMarkup(series: PetSeries, size = 24): string {
            const icon = SERIES_ICONS[series];
            const sizeClass = size >= 28 ? ' is-lg' : '';
            return `<img src="/assets/icons/${icon}" alt="" class="fpo-series-icon${sizeClass}" />`;
      }

      private _getOrCreateExternalDef(name: string, seriesHint: string | null, levelHint: number | null): PetDef {
            const cleanName = this._canonicalPetName(name.trim()) || '未知寵物';
            const cachedId = this._externalIdByName.get(cleanName);
            if (cachedId) {
                  const cached = this._externalDefById.get(cachedId);
                  if (cached) return cached;
            }

            const key = this._buildExternalDefKey(cleanName);
            const cached = this._externalDefById.get(key);
            if (cached) {
                  this._externalIdByName.set(cleanName, cached.id);
                  return cached;
            }

            const def: PetDef = {
                  id: key,
                  name: cleanName,
                  nameCN: cleanName,
                  series: this._mapSeriesHint(seriesHint),
                  acquisition: 'fusion',
                  fusionRecipes: [],
                  attackType: 'melee',
                  baseLevel: Math.max(1, Math.floor(levelHint ?? 1)),
                  baseStats: {
                        hp: 1,
                        mp: 1,
                        str: 1,
                        agi: 1,
                        acc: 1,
                        luk: 1,
                        atkMin: 1,
                        atkMax: 1,
                        hitRate: 1,
                        dodgeRate: 1,
                        element: 1,
                  },
                  skills: [],
            };
            this._externalDefById.set(def.id, def);
            this._externalIdByName.set(cleanName, def.id);
            this._petDefById.set(def.id, def);
            return def;
      }

      private _buildExternalDefKey(name: string): string {
            const base = `ext_${this._hashString(name)}`;
            let key = base;
            let i = 1;
            while (true) {
                  const existing = this._externalDefById.get(key);
                  if (!existing || existing.nameCN === name) return key;
                  i += 1;
                  key = `${base}_${i}`;
            }
      }

      private _hashString(value: string): string {
            let hash = 2166136261;
            for (let i = 0; i < value.length; i += 1) {
                  hash ^= value.charCodeAt(i);
                  hash = Math.imul(hash, 16777619);
            }
            return (hash >>> 0).toString(36);
      }

      private _mapSeriesHint(seriesHint: string | null): PetSeries {
            const raw = (seriesHint ?? '').trim();
            if (!raw) return PetSeries.Mystery;
            const value = raw.toLowerCase();
            if (value.includes('\u690d\u7269') || value.includes('plant')) return PetSeries.Plant;
            if (value.includes('\u9f8d') || value.includes('\u9f99') || value.includes('dragon')) return PetSeries.Dragon;
            if (value.includes('\u7378') || value.includes('\u517d') || value.includes('beast')) return PetSeries.Beast;
            if (value.includes('\u87f2') || value.includes('\u866b') || value.includes('insect')) return PetSeries.Insect;
            if (
                  value.includes('\u6a5f\u68b0') ||
                  value.includes('\u673a\u68b0') ||
                  value.includes('\u91d1\u5c6c') ||
                  value.includes('\u91d1\u5c5e') ||
                  value.includes('metal')
            ) return PetSeries.Metal;
            if (value.includes('\u795e\u79d8') || value.includes('mystery')) return PetSeries.Mystery;
            if (value.includes('\u60e1\u9b54') || value.includes('\u6076\u9b54') || value.includes('demon')) return PetSeries.Demon;
            if (value.includes('\u9ce5') || value.includes('\u9e1f') || value.includes('bird')) return PetSeries.Bird;
            return PetSeries.Mystery;
      }

      private _saveTrackedRecipes(): void {
            try {
                  localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(Array.from(this._trackedRecipeKeys)));
            } catch {
                  // ignore storage failures
            }
      }

      private _loadTrackedRecipes(): Set<string> {
            try {
                  const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
                  if (!raw) return new Set<string>();
                  const parsed = JSON.parse(raw);
                  if (!Array.isArray(parsed)) return new Set<string>();
                  const keys = parsed.filter((value): value is string => typeof value === 'string');
                  return new Set<string>(keys);
            } catch {
                  return new Set<string>();
            }
      }

      private _setNotice(text: string, tone: NoticeTone): void {
            this._notice = { text, tone };
            if (this._noticeTimer) clearTimeout(this._noticeTimer);
            this._noticeTimer = window.setTimeout(() => {
                  this._notice = null;
                  if (this._el.style.display !== 'none') this._render();
            }, 2200);
      }

      private _createPetSlot(label: string, pet: Pet | null, slot: 'main' | 'sub'): HTMLDivElement {
            const wrap = document.createElement('div');
            wrap.className = 'fpo-slot-wrap';

            const slotEl = document.createElement('div');
            slotEl.className = `fpo-slot ${pet ? 'is-filled' : 'is-empty'}`;

            if (pet) {
                  slotEl.innerHTML = `
                        <span class="fpo-slot-emoji">${SERIES_EMOJI[pet.def.series] || '🐾'}</span>
                        <span class="fpo-slot-name">${pet.def.nameCN}</span>
                        <span class="fpo-slot-level">Lv.${pet.stats.level}</span>
                  `;

                  const clearX = document.createElement('span');
                  clearX.textContent = '✕';
                  clearX.className = 'fpo-slot-clear';
                  clearX.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (slot === 'main') this._mainPet = null;
                        else this._subPet = null;
                        this._render();
                  });
                  slotEl.appendChild(clearX);
            } else {
                  slotEl.innerHTML = '<span class="fpo-slot-question">?</span>';
            }

            slotEl.addEventListener('click', () => {
                  this._selectingSlot = this._selectingSlot === slot ? null : slot;
                  this._render();
            });

            slotEl.addEventListener('dragover', (e) => {
                  e.preventDefault();
                  e.dataTransfer!.dropEffect = 'move';
            });
            slotEl.addEventListener('drop', (e) => {
                  e.preventDefault();
                  const idxStr = e.dataTransfer?.getData('text/pet-index');
                  if (!idxStr) return;
                  const idx = parseInt(idxStr, 10);
                  if (isNaN(idx) || idx < 0 || idx >= this._petManager.owned.length) return;

                  const droppedPet = this._petManager.owned[idx];
                  if (!droppedPet || droppedPet.isActive || droppedPet.isDead) return;
                  if (slot === 'main' && droppedPet === this._subPet) return;
                  if (slot === 'sub' && droppedPet === this._mainPet) return;

                  if (slot === 'main') this._mainPet = droppedPet;
                  else this._subPet = droppedPet;
                  this._selectingSlot = null;
                  this._render();
            });

            const labelEl = document.createElement('div');
            labelEl.className = 'fpo-slot-label';
            labelEl.textContent = label;

            wrap.appendChild(slotEl);
            wrap.appendChild(labelEl);
            return wrap;
      }

      private _executeFusion(): void {
            if (!this._mainPet || !this._subPet) return;
            const matches = PetFusion.findRecipes(this._mainPet, this._subPet);
            if (matches.length === 0) return;

            const match = matches[0];
            const result = PetFusion.fuse(this._mainPet, this._subPet, match.resultDef, this._hasProtection);
            this._showFusionResult(result, match);
      }

      private _showFusionResult(result: { success: boolean; resultId?: string; newLevel?: number; primaryLevelDrop?: number }, _match: FusionMatch): void {
            const subIdx = this._petManager.owned.indexOf(this._subPet!);
            if (subIdx >= 0) {
                  const pet = this._petManager.owned[subIdx];
                  if (pet.isActive) {
                        const activeIndex = this._petManager.active.indexOf(pet);
                        if (activeIndex >= 0) this._petManager.recall(activeIndex);
                  }
                  this._petManager.owned.splice(subIdx, 1);
                  pet.dispose();
            }

            if (result.success && result.resultId) {
                  const genders: Array<'male' | 'female'> = ['male', 'female'];
                  const gender = genders[Math.floor(Math.random() * 2)];
                  const newPet = this._petManager.addPet(result.resultId, gender);
                  if (newPet && result.newLevel) newPet.stats.level = result.newLevel;
                  const resultDef = PET_DEFS.find(def => def.id === result.resultId);
                  this._flashResult(true, `${resultDef?.nameCN ?? result.resultId} Lv.${result.newLevel}`);
            } else {
                  const dropText = result.primaryLevelDrop ? `，主寵降級 ${result.primaryLevelDrop} 級` : '';
                  this._flashResult(false, `合成失敗${dropText}`);
            }

            this._mainPet = null;
            this._subPet = null;
            setTimeout(() => this._render(), 1700);
      }

      private _flashResult(success: boolean, detail: string): void {
            const overlay = document.createElement('div');
            overlay.className = `fpo-flash-overlay ${success ? 'is-success' : 'is-fail'}`;
            overlay.innerHTML = `
                  <div class="fpo-flash-icon">${success ? '✓' : '✕'}</div>
                  <div class="fpo-flash-title">${success ? '合成成功' : '合成失敗'}</div>
                  <div class="fpo-flash-detail">${this._escapeHtml(detail)}</div>
            `;
            this._el.appendChild(overlay);
            setTimeout(() => overlay.remove(), 1500);
      }

      dispose(): void {
            if (this._noticeTimer) clearTimeout(this._noticeTimer);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
            this._backdrop.remove();
      }
}



