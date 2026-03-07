import { PetEncyclopedia } from '../pets/PetEncyclopedia';
import { PET_DEFS, PetSeries, SERIES_EMOJI, type PetDef } from '../pets/PetData';
import listPetsRaw from '../data/fusion/list_pets.json';
import type { ListPetPayload, ListPetRow } from '../data/fusion/types';
import { canonicalPetName, normalizeFusionNameKey } from '../data/fusion/FusionNameUtils';
import { getRuntimeFusionGuideEntries } from '../data/runtime/RuntimeFusionGuide';

type SeriesFilter = 'all' | PetSeries;

interface EncyclopediaMeta {
      level: number;
      dropEgg: boolean | null;
      mapNames: string[];
      fusible: boolean;
}

const SERIES_NAMES: Record<PetSeries, string> = {
      [PetSeries.Plant]: '\u690d\u7269',
      [PetSeries.Dragon]: '\u9f8d\u65cf',
      [PetSeries.Beast]: '\u91ce\u7378',
      [PetSeries.Insect]: '\u6606\u87f2',
      [PetSeries.Metal]: '\u6a5f\u68b0',
      [PetSeries.Mystery]: '\u795e\u7955',
      [PetSeries.Demon]: '\u60e1\u9b54',
      [PetSeries.Bird]: '\u98db\u79bd',
};



export class EncyclopediaPanel {
      private _el: HTMLDivElement;
      private _enc: PetEncyclopedia;
      private _seriesFilter: SeriesFilter = 'all';
      private _searchKeyword = '';
      private _onlyDiscovered = false;
      private _onlyFusible = false;
      private _onlyDropEgg = false;
      private _selectedPetId: string | null = null;
      private _selectedSourceMap: string | null = null;
      private _metaByDefId = new Map<string, EncyclopediaMeta>();
      private _petDefIdByName = new Map<string, string>();
      private _onResize = (): void => {
            if (this._el.style.display === 'none') return;
            this._syncResponsiveMode();
      };

      private _onOpenRecipe: ((petName: string, sourceMap?: string) => void) | null = null;
      private _onOpenMap: ((mapName: string, petName?: string) => void) | null = null;

      constructor(enc: PetEncyclopedia) {
            this._enc = enc;
            this._buildPetDefNameIndex();
            this._buildMetaIndex();
            this._el = document.createElement('div');
            this._el.id = 'encyclopediaPanel';
            this._el.className = 'sa-panel book-root ui-panel-fullscreen';
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      get element(): HTMLElement { return this._el; }

      setNavigationHandlers(handlers: {
            onOpenRecipe?: (petName: string, sourceMap?: string) => void;
            onOpenMap?: (mapName: string, petName?: string) => void;
      }): void {
            this._onOpenRecipe = handlers.onOpenRecipe ?? null;
            this._onOpenMap = handlers.onOpenMap ?? null;
      }

      open(): void {
            this._selectedSourceMap = null;
            if (!this._selectedPetId) this._selectedPetId = PET_DEFS[0]?.id ?? null;
            this._el.style.display = 'block';
            this._syncResponsiveMode();
            this._render();
      }

      openPetByName(petName: string, sourceMap?: string): void {
            const id = this._findPetDefIdByName(petName);
            this._selectedPetId = id ?? this._selectedPetId ?? PET_DEFS[0]?.id ?? null;
            this._selectedSourceMap = sourceMap?.trim() || null;
            this._el.style.display = 'block';
            this._syncResponsiveMode();
            this._render();
      }

      close(): void {
            this._el.style.display = 'none';
      }

      refresh(): void {
            if (this._el.style.display !== 'none') this._render();
      }

      dispose(): void {
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }

      private _render(): void {
            this._syncResponsiveMode();
            this._el.innerHTML = '';
            this._el.appendChild(this._buildHeader());
            this._el.appendChild(this._buildUnifiedView());
      }

      private _isLandscapeFocusMode(): boolean {
            const w = window.innerWidth || this._el.clientWidth || 0;
            const h = window.innerHeight || 0;
            return w > h && w <= 980 && h <= 560;
      }

      private _syncResponsiveMode(): void {
            this._el.classList.toggle('is-focus-mode', this._isLandscapeFocusMode());
      }

      private _buildHeader(): HTMLDivElement {
            const header = document.createElement('div');
            header.className = 'sa-panel-title';

            const title = document.createElement('span');
            title.textContent = '📖 寵物圖鑑';

            const progress = document.createElement('span');
            progress.className = 'book-progress';
            progress.textContent = `${this._enc.discoveredCount} / ${this._enc.totalCount}`;

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.textContent = 'X';
            closeBtn.setAttribute('aria-label', '關閉圖鑑');
            closeBtn.className = 'book-close-btn';
            closeBtn.addEventListener('click', () => this.close());

            header.appendChild(title);
            header.appendChild(progress);
            header.appendChild(closeBtn);
            return header;
      }

      private _buildUnifiedView(): HTMLDivElement {
            const root = document.createElement('div');
            root.className = 'book-unified-root';

            const filterRow = document.createElement('div');
            filterRow.className = 'book-filter-row';
            filterRow.appendChild(this._buildSeriesFilterChip('all', '全部'));
            for (const series of Object.values(PetSeries) as PetSeries[]) {
                  filterRow.appendChild(this._buildSeriesFilterChip(series, `${SERIES_EMOJI[series]} ${SERIES_NAMES[series]}`));
            }

            const search = document.createElement('input');
            search.type = 'search';
            search.placeholder = '搜尋寵物名稱';
            search.value = this._searchKeyword;
            search.className = 'book-search-input';
            search.addEventListener('input', () => {
                  this._searchKeyword = search.value.trim();
                  this._render();
            });
            filterRow.appendChild(search);

            filterRow.appendChild(this._buildQuickToggle('只看已發現', this._onlyDiscovered, () => {
                  this._onlyDiscovered = !this._onlyDiscovered;
                  this._render();
            }));
            filterRow.appendChild(this._buildQuickToggle('只看可合成', this._onlyFusible, () => {
                  this._onlyFusible = !this._onlyFusible;
                  this._render();
            }));
            filterRow.appendChild(this._buildQuickToggle('只看可掉蛋', this._onlyDropEgg, () => {
                  this._onlyDropEgg = !this._onlyDropEgg;
                  this._render();
            }));
            root.appendChild(filterRow);

            const split = document.createElement('div');
            const compact = this._shouldUseStackLayout();
            split.className = `book-split${compact ? ' is-compact' : ''}`;
            split.appendChild(this._buildPetListPane(compact));
            split.appendChild(this._buildDetailPane(compact));
            root.appendChild(split);
            return root;
      }

      private _shouldUseStackLayout(): boolean {
            const vw = window.innerWidth || this._el.clientWidth || 0;
            const vh = window.innerHeight || 0;
            if (vh > vw) return true;
            return vw < 700 && vh < 360;
      }

      private _buildSeriesFilterChip(filter: SeriesFilter, label: string): HTMLButtonElement {
            const active = this._seriesFilter === filter;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            btn.className = `book-chip${active ? ' is-active' : ''}`;
            btn.addEventListener('click', () => {
                  if (this._seriesFilter === filter) return;
                  this._seriesFilter = filter;
                  this._render();
            });
            return btn;
      }

      private _buildQuickToggle(label: string, active: boolean, onClick: () => void): HTMLButtonElement {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            btn.className = `book-chip book-chip-toggle${active ? ' is-active' : ''}`;
            btn.addEventListener('click', onClick);
            return btn;
      }

      private _buildPetListPane(compact: boolean): HTMLDivElement {
            const pane = document.createElement('div');
            pane.className = `book-pane${compact ? ' is-compact-list' : ''}`;

            const defs = this._filteredDefs();
            if (!this._selectedPetId || !defs.some((def) => def.id === this._selectedPetId)) {
                  this._selectedPetId = defs[0]?.id ?? null;
            }

            const head = document.createElement('div');
            head.className = 'book-pane-head';
            head.innerHTML = `
                  <span class="book-pane-title">寵物列表</span>
                  <span class="book-pane-count">共 ${defs.length} 隻</span>
            `;
            pane.appendChild(head);

            const list = document.createElement('div');
            list.className = 'book-pane-list';
            for (const def of defs) list.appendChild(this._buildPetListRow(def));

            if (defs.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'book-empty';
                  empty.textContent = '此篩選條件沒有資料';
                  list.appendChild(empty);
            }
            pane.appendChild(list);
            return pane;
      }

      private _buildPetListRow(def: PetDef): HTMLButtonElement {
            const discovered = this._enc.isDiscovered(def.id);
            const count = this._enc.getCount(def.id);
            const meta = this._metaByDefId.get(def.id);
            const dropEgg = this._dropEggLabel(meta?.dropEgg ?? null);
            const fusible = meta?.fusible ? '可合成' : '不可合成';
            const level = meta?.level ?? def.baseLevel;

            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'book-row game-card';
            if (this._selectedPetId === def.id) row.classList.add('is-selected');
            if (!discovered) row.classList.add('is-undiscovered');
            row.innerHTML = `
                  <span class="book-row-icon">${SERIES_EMOJI[def.series]}</span>
                  <div class="book-row-main">
                        <div class="book-row-titleline">
                              <span class="book-row-name">${this._escapeHtml(def.nameCN)}</span>
                              <span class="book-row-level">Lv.${level}</span>
                        </div>
                        <div class="book-row-meta">${dropEgg} · ${fusible}</div>
                        <div class="book-row-count">收藏數：${count}</div>
                  </div>
            `;
            row.addEventListener('click', () => {
                  this._selectedPetId = def.id;
                  this._selectedSourceMap = null;
                  this._render();
            });
            return row;
      }

      private _buildDetailPane(compact: boolean): HTMLDivElement {
            const pane = document.createElement('div');
            pane.className = `book-pane book-detail-pane${compact ? ' is-compact-detail' : ''}`;

            const def = this._selectedPetDef();
            if (!def) {
                  const empty = document.createElement('div');
                  empty.className = 'book-empty';
                  empty.textContent = '找不到寵物資料';
                  pane.appendChild(empty);
                  return pane;
            }

            const meta = this._metaByDefId.get(def.id);
            const level = meta?.level ?? def.baseLevel;
            const mapNames = meta?.mapNames ?? [];
            const preferredMap = this._selectedSourceMap && mapNames.includes(this._selectedSourceMap)
                  ? this._selectedSourceMap
                  : (mapNames[0] ?? null);

            const card = document.createElement('div');
            card.className = 'book-card game-card';
            card.innerHTML = `
                  <div class="book-card-head">
                        <span class="book-card-icon">${SERIES_EMOJI[def.series]}</span>
                        <div class="book-card-main">
                              <div class="book-card-name">${this._escapeHtml(def.nameCN)}</div>
                              <div class="book-card-sub">${SERIES_NAMES[def.series]} · Lv.${level}</div>
                        </div>
                  </div>
            `;
            card.appendChild(this._buildDetailRow('主要地圖', preferredMap ? this._escapeHtml(preferredMap) : '尚無資料'));
            card.appendChild(this._buildDetailRow('掉蛋', this._dropEggLabel(meta?.dropEgg ?? null)));
            card.appendChild(this._buildDetailRow('是否可合成', meta?.fusible ? '是' : '否'));
            card.appendChild(this._buildDetailRow('來源地圖', this._mapChipsMarkup(mapNames)));
            pane.appendChild(card);

            const actionRow = document.createElement('div');
            actionRow.className = 'book-action-row';

            const recipeBtn = document.createElement('button');
            recipeBtn.type = 'button';
            recipeBtn.className = `game-btn ${meta?.fusible ? 'game-btn-primary' : 'game-btn-secondary'} book-action-btn`;
            recipeBtn.textContent = '查看配方';
            recipeBtn.disabled = !meta?.fusible;
            recipeBtn.addEventListener('click', () => {
                  if (!this._onOpenRecipe) return;
                  this.close();
                  this._onOpenRecipe(def.nameCN, preferredMap ?? undefined);
            });

            const mapBtn = document.createElement('button');
            mapBtn.type = 'button';
            mapBtn.className = 'game-btn game-btn-ghost book-action-btn';
            mapBtn.textContent = preferredMap ? '前往地圖' : '無來源地圖';
            mapBtn.disabled = !preferredMap;
            mapBtn.addEventListener('click', () => {
                  if (!preferredMap || !this._onOpenMap) return;
                  this.close();
                  this._onOpenMap(preferredMap, def.nameCN);
            });

            actionRow.appendChild(recipeBtn);
            actionRow.appendChild(mapBtn);
            pane.appendChild(actionRow);
            return pane;
      }

      private _buildDetailRow(label: string, valueHtml: string): HTMLDivElement {
            const row = document.createElement('div');
            row.className = 'book-detail-row';
            row.innerHTML = `
                  <div class="book-detail-key">${label}</div>
                  <div class="book-detail-value">${valueHtml}</div>
            `;
            return row;
      }

      private _mapChipsMarkup(mapNames: string[]): string {
            if (mapNames.length === 0) return '<span class="book-map-chip-empty">尚無地圖資料</span>';
            const chips = mapNames.slice(0, 10).map((name) => `<span class="book-map-chip">${this._escapeHtml(name)}</span>`);
            if (mapNames.length > 10) chips.push(`<span class="book-map-chip-more">+${mapNames.length - 10}</span>`);
            return chips.join('');
      }

      private _filteredDefs(): PetDef[] {
            return PET_DEFS
                  .filter((def) => this._seriesFilter === 'all' || def.series === this._seriesFilter)
                  .filter((def) => {
                        if (this._searchKeyword) {
                              const key = this._normalizeNameKey(this._canonicalPetName(this._searchKeyword));
                              const nameCN = this._normalizeNameKey(this._canonicalPetName(def.nameCN));
                              const nameEN = this._normalizeNameKey(this._canonicalPetName(def.name));
                              if (!nameCN.includes(key) && !nameEN.includes(key)) return false;
                        }
                        const meta = this._metaByDefId.get(def.id);
                        if (this._onlyDiscovered && !this._enc.isDiscovered(def.id)) return false;
                        if (this._onlyFusible && !(meta?.fusible ?? false)) return false;
                        if (this._onlyDropEgg && meta?.dropEgg !== true) return false;
                        return true;
                  })
                  .sort((a, b) => {
                        const la = this._metaByDefId.get(a.id)?.level ?? a.baseLevel;
                        const lb = this._metaByDefId.get(b.id)?.level ?? b.baseLevel;
                        if (la !== lb) return la - lb;
                        return a.nameCN.localeCompare(b.nameCN, 'zh-Hant');
                  });
      }

      private _selectedPetDef(): PetDef | null {
            if (!this._selectedPetId) return PET_DEFS[0] ?? null;
            return PET_DEFS.find((def) => def.id === this._selectedPetId) ?? PET_DEFS[0] ?? null;
      }

      private _buildPetDefNameIndex(): void {
            this._petDefIdByName = new Map<string, string>();
            for (const def of PET_DEFS) {
                  this._indexName(def.nameCN, def.id);
                  this._indexName(def.name, def.id);
            }
      }

      private _indexName(raw: string, defId: string): void {
            const clean = raw.trim();
            if (!clean) return;
            this._petDefIdByName.set(clean, defId);
            this._petDefIdByName.set(this._normalizeNameKey(clean), defId);
            const canonical = this._canonicalPetName(clean);
            this._petDefIdByName.set(canonical, defId);
            this._petDefIdByName.set(this._normalizeNameKey(canonical), defId);
      }

      private _findPetDefIdByName(name: string): string | null {
            const clean = name.trim();
            if (!clean) return null;
            const canonical = this._canonicalPetName(clean);
            const direct = this._petDefIdByName.get(canonical);
            if (direct) return direct;
            return this._petDefIdByName.get(this._normalizeNameKey(canonical)) ?? null;
      }

      private _buildMetaIndex(): void {
            const metaById = new Map<string, EncyclopediaMeta>();
            const ensureMeta = (def: PetDef): EncyclopediaMeta => {
                  const prev = metaById.get(def.id);
                  if (prev) return prev;
                  const base = {
                        level: Math.max(1, Math.floor(def.baseLevel || 1)),
                        dropEgg: null,
                        mapNames: [] as string[],
                        fusible: def.acquisition === 'fusion' || def.fusionRecipes.length > 0,
                  };
                  metaById.set(def.id, base);
                  return base;
            };

            const listByCanonicalName = new Map<string, ListPetRow>();
            const listPayload = listPetsRaw as ListPetPayload;
            const listRows = Array.isArray(listPayload.pets) ? listPayload.pets : [];
            for (const row of listRows) {
                  const name = this._canonicalPetName(String(row?.name ?? '').trim());
                  if (!name) continue;
                  listByCanonicalName.set(name, row);
                  listByCanonicalName.set(this._normalizeNameKey(name), row);

                  const defId = this._findPetDefIdByName(name);
                  if (!defId) continue;
                  const def = PET_DEFS.find((item) => item.id === defId);
                  if (!def) continue;
                  const meta = ensureMeta(def);
                  const lv = this._toLevel(row.level, meta.level);
                  if (lv > meta.level) meta.level = lv;
                  if (typeof row.fusible === 'boolean') meta.fusible = meta.fusible || row.fusible;
            }

            const runtimeRows = getRuntimeFusionGuideEntries();
            for (const row of runtimeRows) {
                  const resultName = this._canonicalPetName(String(row.resultName ?? '').trim());
                  const resultDefId = this._findPetDefIdByName(resultName);
                  if (resultDefId) {
                        const def = PET_DEFS.find((item) => item.id === resultDefId);
                        if (def) {
                              const meta = ensureMeta(def);
                              const listHint = listByCanonicalName.get(resultName)?.level;
                              meta.level = Math.max(meta.level, this._toLevel(row.resultLevel, this._toLevel(listHint, meta.level)));
                              meta.dropEgg = this._mergeDropEgg(meta.dropEgg, row.resultDropEgg ?? null);
                              meta.mapNames = this._mergeStringArray(meta.mapNames, this._normalizeStringArray(row.resultMaps));
                              meta.fusible = true;
                        }
                  }

                  const ingredientNames = [row.mainName, row.subName];
                  const ingredientMaps = [row.mainMaps, row.subMaps];
                  const ingredientEggs = [row.mainDropEgg, row.subDropEgg];
                  const ingredientLevels = [row.mainLevel, row.subLevel];
                  for (let i = 0; i < ingredientNames.length; i++) {
                        const ingredientName = this._canonicalPetName(String(ingredientNames[i] ?? '').trim());
                        const defId = this._findPetDefIdByName(ingredientName);
                        if (!defId) continue;
                        const def = PET_DEFS.find((item) => item.id === defId);
                        if (!def) continue;
                        const meta = ensureMeta(def);
                        const listHint = listByCanonicalName.get(ingredientName)?.level;
                        meta.level = Math.max(meta.level, this._toLevel(ingredientLevels[i], this._toLevel(listHint, meta.level)));
                        meta.dropEgg = this._mergeDropEgg(meta.dropEgg, ingredientEggs[i] ?? null);
                        meta.mapNames = this._mergeStringArray(meta.mapNames, this._normalizeStringArray(ingredientMaps[i]));
                  }
            }

            for (const def of PET_DEFS) {
                  const meta = ensureMeta(def);
                  meta.mapNames = Array.from(new Set(meta.mapNames.map((name) => name.trim()).filter(Boolean)))
                        .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
            }

            this._metaByDefId = metaById;
      }

      private _canonicalPetName(raw: string): string {
            return canonicalPetName(raw);
      }

      private _normalizeNameKey(raw: string): string {
            return normalizeFusionNameKey(raw);
      }

      private _normalizeStringArray(value: unknown): string[] {
            if (Array.isArray(value)) {
                  const arr = value.map((item) => String(item ?? '').trim()).filter(Boolean);
                  return Array.from(new Set(arr));
            }
            if (typeof value === 'string') {
                  const one = value.trim();
                  return one ? [one] : [];
            }
            return [];
      }

      private _mergeStringArray(a: string[], b: string[]): string[] {
            const set = new Set<string>(a);
            for (const item of b) set.add(item);
            return Array.from(set);
      }

      private _toLevel(raw: unknown, fallback = 1): number {
            if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
            return Math.max(1, Math.floor(fallback));
      }

      private _parseDropEgg(flag: boolean | null | undefined, raw: string | null | undefined): boolean | null {
            if (typeof flag === 'boolean') return flag;
            if (!raw) return null;
            const value = raw.trim();
            if (!value) return null;
            return value !== '0';
      }

      private _mergeDropEgg(a: boolean | null, b: boolean | null): boolean | null {
            if (a === null) return b;
            if (b === null) return a;
            return a || b;
      }

      private _dropEggLabel(dropEgg: boolean | null): string {
            if (dropEgg === null) return '\u6389\u86cb\u672a\u77e5';
            return dropEgg ? '\u53ef\u6389\u86cb' : '\u4e0d\u6389\u86cb';
      }

      private _escapeHtml(value: string): string {
            return value
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }
}
