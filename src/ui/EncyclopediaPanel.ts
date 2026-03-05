import { PetEncyclopedia } from '../pets/PetEncyclopedia';
import { PET_DEFS, PetSeries, SERIES_EMOJI, type PetDef } from '../pets/PetData';
import mixmasterRecipesRaw from '../data/fusion/mixmaster_recipes.json';
import listPetsRaw from '../data/fusion/list_pets.json';

type SeriesFilter = 'all' | PetSeries;

interface MixmasterMonsterRow {
      name: string;
      baseLevel?: number | null;
      dropEggRaw?: string | null;
      dropEgg?: boolean | null;
      maps?: string[] | string | null;
}

interface MixmasterRecipeRow {
      resultName: string;
      resultBaseLevel?: number | null;
      resultDropEggRaw?: string | null;
      resultDropEgg?: boolean | null;
      resultMaps?: string[] | string | null;
}

interface MixmasterRecipePayload {
      monsters?: MixmasterMonsterRow[];
      recipes?: MixmasterRecipeRow[];
}

interface ListPetRow {
      name: string;
      level?: number | null;
      fusible?: boolean | null;
}

interface ListPetPayload {
      pets?: ListPetRow[];
}

interface EncyclopediaMeta {
      level: number;
      dropEgg: boolean | null;
      mapNames: string[];
      fusible: boolean;
}

const SERIES_NAMES: Record<PetSeries, string> = {
      [PetSeries.Plant]: '植物',
      [PetSeries.Dragon]: '龍族',
      [PetSeries.Beast]: '野獸',
      [PetSeries.Insect]: '昆蟲',
      [PetSeries.Metal]: '金屬',
      [PetSeries.Mystery]: '神祕',
      [PetSeries.Demon]: '惡魔',
      [PetSeries.Bird]: '飛禽',
};

const PET_NAME_ALIASES: Record<string, string> = {
      '达特凯彬': '达杉凯特',
      '超级达特凯彬': '超级达杉凯特',
      '達特凱彬': '达杉凯特',
      '超級達特凱彬': '超级达杉凯特',
      '達杉凱特': '达杉凯特',
      '超級達杉凱特': '超级达杉凯特',
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
            this._el.className = 'sa-panel book-root';
            Object.assign(this._el.style, {
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 'min(96vw, 760px)',
                  maxHeight: '86vh',
                  zIndex: '350',
                  display: 'none',
                  overflow: 'hidden',
            });
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
            this._el.style.display = '';
            this._syncResponsiveMode();
            this._render();
      }

      openPetByName(petName: string, sourceMap?: string): void {
            const id = this._findPetDefIdByName(petName);
            this._selectedPetId = id ?? this._selectedPetId ?? PET_DEFS[0]?.id ?? null;
            this._selectedSourceMap = sourceMap?.trim() || null;
            this._el.style.display = '';
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
            progress.style.cssText = 'margin-left:auto;margin-right:34px;font-size:11px;color:rgba(200,195,185,0.7)';
            progress.textContent = `${this._enc.discoveredCount} / ${this._enc.totalCount}`;

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.textContent = '✕';
            closeBtn.setAttribute('aria-label', '關閉圖鑑');
            closeBtn.style.cssText = `
                  position:absolute;
                  right:6px;
                  top:50%;
                  transform:translateY(-50%);
                  width:24px;
                  height:24px;
                  border:1px solid rgba(160,130,80,0.28);
                  border-radius:4px;
                  background:rgba(20,16,30,0.72);
                  color:rgba(220,215,200,0.9);
                  font-size:13px;
                  font-weight:700;
                  line-height:1;
                  cursor:pointer;
            `;
            closeBtn.addEventListener('mouseenter', () => {
                  closeBtn.style.color = '#E74C3C';
                  closeBtn.style.borderColor = 'rgba(231,76,60,0.45)';
                  closeBtn.style.background = 'rgba(231,76,60,0.12)';
            });
            closeBtn.addEventListener('mouseleave', () => {
                  closeBtn.style.color = 'rgba(220,215,200,0.9)';
                  closeBtn.style.borderColor = 'rgba(160,130,80,0.28)';
                  closeBtn.style.background = 'rgba(20,16,30,0.72)';
            });
            closeBtn.addEventListener('click', () => this.close());

            header.appendChild(title);
            header.appendChild(progress);
            header.appendChild(closeBtn);
            return header;
      }

      private _buildUnifiedView(): HTMLDivElement {
            const root = document.createElement('div');
            root.style.cssText = 'display:flex;flex-direction:column;max-height:calc(86vh - 40px);overflow:hidden';

            const filterRow = document.createElement('div');
            filterRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:8px;border-bottom:1px solid rgba(160,130,80,0.14);background:rgba(14,11,22,0.48)';
            filterRow.appendChild(this._buildSeriesFilterChip('all', '全部'));
            for (const series of Object.values(PetSeries) as PetSeries[]) {
                  filterRow.appendChild(this._buildSeriesFilterChip(series, `${SERIES_EMOJI[series]} ${SERIES_NAMES[series]}`));
            }

            const search = document.createElement('input');
            search.type = 'search';
            search.placeholder = '搜尋寵物名稱';
            search.value = this._searchKeyword;
            search.style.cssText = 'margin-left:auto;min-width:180px;max-width:220px;flex:1 1 200px;border:1px solid rgba(160,130,80,0.24);border-radius:6px;background:rgba(12,10,20,0.78);color:rgba(220,215,200,0.9);font-size:10px;padding:4px 8px';
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
            split.style.cssText = compact
                  ? 'display:flex;flex-direction:column;gap:8px;padding:8px;overflow:auto'
                  : 'display:grid;grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr);gap:8px;padding:8px;overflow:hidden';
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
            btn.style.cssText = `
                  border-radius:999px;
                  border:1px solid ${active ? 'rgba(232,201,106,0.52)' : 'rgba(160,130,80,0.24)'};
                  background:${active ? 'rgba(160,130,80,0.22)' : 'rgba(20,16,30,0.62)'};
                  color:${active ? 'rgba(232,201,106,0.95)' : 'rgba(200,195,185,0.7)'};
                  font-size:10px;
                  font-weight:700;
                  padding:3px 9px;
                  cursor:pointer;
            `;
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
            btn.style.cssText = `
                  border-radius:999px;
                  border:1px solid ${active ? 'rgba(232,201,106,0.52)' : 'rgba(160,130,80,0.24)'};
                  background:${active ? 'rgba(160,130,80,0.22)' : 'rgba(20,16,30,0.62)'};
                  color:${active ? 'rgba(232,201,106,0.95)' : 'rgba(200,195,185,0.7)'};
                  font-size:10px;
                  font-weight:700;
                  padding:3px 9px;
                  cursor:pointer;
            `;
            btn.addEventListener('click', onClick);
            return btn;
      }

      private _buildPetListPane(compact: boolean): HTMLDivElement {
            const pane = document.createElement('div');
            pane.className = `book-pane${compact ? ' is-compact-list' : ''}`;

            const defs = this._filteredDefs();
            if (!this._selectedPetId || !defs.some(def => def.id === this._selectedPetId)) {
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
            for (const def of defs) {
                  list.appendChild(this._buildPetListRow(def));
            }
            if (defs.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'book-empty';
                  empty.textContent = '此系列目前沒有資料';
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
                        <div style="min-width:0">
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
            mapBtn.className = `game-btn game-btn-ghost book-action-btn`;
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

            const key = document.createElement('div');
            key.className = 'book-detail-key';
            key.textContent = label;

            const value = document.createElement('div');
            value.className = 'book-detail-value';
            value.innerHTML = valueHtml;

            row.appendChild(key);
            row.appendChild(value);
            return row;
      }

      private _mapChipsMarkup(mapNames: string[]): string {
            if (mapNames.length === 0) {
                  return '<span class="book-map-chip-empty">尚無地圖資料</span>';
            }
            const chips = mapNames.slice(0, 10).map(name => `
                  <span class="book-map-chip">
                        ${this._escapeHtml(name)}
                  </span>
            `);
            if (mapNames.length > 10) {
                  chips.push(`<span class="book-map-chip-more">+${mapNames.length - 10}</span>`);
            }
            return chips.join('');
      }

      private _filteredDefs(): PetDef[] {
            return PET_DEFS
                  .filter(def => this._seriesFilter === 'all' || def.series === this._seriesFilter)
                  .filter(def => {
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
            return PET_DEFS.find(def => def.id === this._selectedPetId) ?? PET_DEFS[0] ?? null;
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
                  const def = PET_DEFS.find(item => item.id === defId);
                  if (!def) continue;
                  const meta = ensureMeta(def);
                  const lv = this._toLevel(row.level, meta.level);
                  if (lv > meta.level) meta.level = lv;
                  if (typeof row.fusible === 'boolean') meta.fusible = meta.fusible || row.fusible;
            }

            const payload = mixmasterRecipesRaw as MixmasterRecipePayload;
            const monsterRows = Array.isArray(payload.monsters) ? payload.monsters : [];
            const recipeRows = Array.isArray(payload.recipes) ? payload.recipes : [];

            for (const row of monsterRows) {
                  const name = this._canonicalPetName(String(row?.name ?? '').trim());
                  const defId = this._findPetDefIdByName(name);
                  if (!defId) continue;
                  const def = PET_DEFS.find(item => item.id === defId);
                  if (!def) continue;
                  const meta = ensureMeta(def);
                  const listHint = listByCanonicalName.get(name)?.level;
                  meta.level = Math.max(meta.level, this._toLevel(row.baseLevel, this._toLevel(listHint, meta.level)));
                  meta.dropEgg = this._mergeDropEgg(meta.dropEgg, this._parseDropEgg(row.dropEgg, row.dropEggRaw));
                  meta.mapNames = this._mergeStringArray(meta.mapNames, this._normalizeStringArray(row.maps));
            }

            for (const row of recipeRows) {
                  const name = this._canonicalPetName(String(row?.resultName ?? '').trim());
                  const defId = this._findPetDefIdByName(name);
                  if (!defId) continue;
                  const def = PET_DEFS.find(item => item.id === defId);
                  if (!def) continue;
                  const meta = ensureMeta(def);
                  const listHint = listByCanonicalName.get(name)?.level;
                  meta.level = Math.max(meta.level, this._toLevel(row.resultBaseLevel, this._toLevel(listHint, meta.level)));
                  meta.dropEgg = this._mergeDropEgg(meta.dropEgg, this._parseDropEgg(row.resultDropEgg, row.resultDropEggRaw));
                  meta.mapNames = this._mergeStringArray(meta.mapNames, this._normalizeStringArray(row.resultMaps));
                  meta.fusible = true;
            }

            for (const def of PET_DEFS) {
                  const meta = ensureMeta(def);
                  meta.mapNames = Array.from(new Set(meta.mapNames.map(name => name.trim()).filter(Boolean)))
                        .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
            }

            this._metaByDefId = metaById;
      }

      private _canonicalPetName(raw: string): string {
            const clean = raw.trim();
            if (!clean) return clean;
            return PET_NAME_ALIASES[clean] ?? clean;
      }

      private _normalizeNameKey(raw: string): string {
            return raw
                  .trim()
                  .replace(/\s+/g, '')
                  .replace(/[()（）\[\]【】._-]/g, '')
                  .toLowerCase();
      }

      private _normalizeStringArray(value: unknown): string[] {
            if (Array.isArray(value)) {
                  const arr = value.map(item => String(item ?? '').trim()).filter(Boolean);
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
            if (dropEgg === null) return '掉蛋未知';
            return dropEgg ? '可掉蛋' : '不掉蛋';
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
