import type { ZoneManager } from '../world/ZoneManager';
import { ZONE_DEFS } from '../world/ZoneDefinitions';
import mixmasterRecipesRaw from '../data/fusion/mixmaster_recipes.json';
import listPetsRaw from '../data/fusion/list_pets.json';
import type { ListPetPayload, ListPetRow, MixmasterRecipePayload } from '../data/fusion/types';
import { canonicalPetName, normalizeFusionNameKey } from '../data/fusion/FusionNameUtils';

interface MapMonsterInfo {
      name: string;
      level: number;
      dropEgg: boolean | null;
      series: string | null;
      fusible: boolean | null;
      asIngredientCount: number;
}

interface MapFusionTargetInfo {
      resultName: string;
      resultLevel: number;
      resultDropEgg: boolean | null;
      mainName: string;
      subName: string;
}

interface MapSummary {
      name: string;
      region: string;
      monsterCount: number;
      targetCount: number;
      minLevel: number;
      maxLevel: number;
      teleportZoneId: string | null;
      teleportMode: TeleportMatchMode;
}

type TeleportMatchMode = 'exact' | 'keyword' | 'series' | 'level' | 'none';
type MapLevelBand = 'all' | '1-30' | '31-60' | '61-90' | '91+';



const MAP_EXACT_ZONE: Record<string, string> = {
      '巴尔克牧场低': 'starter_meadow',
      '巴尔克牧场中': 'echo_valley',
      '巴尔克牧场高': 'iron_ridge',
      '巴尔克牧场a': 'starter_meadow',
      '巴尔克牧场b': 'echo_valley',
      '巴尔克牧场c': 'iron_ridge',
      '河谷农场': 'echo_valley',
      '3号巴尔干入口': 'thunder_plains',
      '25号巴尔干峡谷': 'thunder_plains',
      '6号命运的沙漠岔道': 'thunder_plains',
      '黑暗森林': 'dark_hollow',
      '迷幻沼泽': 'moonlit_grove',
      '鲁那特地狱入口': 'lava_sanctum',
      '鲁那特地狱1层': 'lava_sanctum',
      '鲁那特地狱2层': 'lava_sanctum',
      '鲁那特地狱3层': 'lava_sanctum',
      '鲁那特地狱4层': 'lava_sanctum',
      '鲁那特地狱5层': 'lava_sanctum',
      '鲁狄斯地城废墟': 'ancient_ruins',
      '2号鲁狄斯南部': 'ancient_ruins',
      '鲁狄斯废墟[高]': 'ancient_ruins',
      '鲁狄斯废墟[低]': 'ancient_ruins',
      '29号静音废墟': 'ancient_ruins',
      '贝赫鲁废墟[高]': 'storm_coast',
      '贝赫鲁废墟[低]': 'storm_coast',
      '马吉利塔废墟[高]': 'storm_coast',
      '马吉利塔废墟[低]': 'storm_coast',
      '13号马吉利塔西部海岸': 'storm_coast',
      '26号布买': 'ancient_ruins',
      '布买废墟': 'ancient_ruins',
      '4号白色荒野': 'frost_peaks',
      '5号双胞胎峡谷': 'thunder_plains',
      '28号伊斯凯森林': 'misty_forest',
      '地城-机械之屋': 'dragon_nest',
      '地城-龙之屋': 'dragon_nest',
      '地城-鸟之屋': 'dragon_nest',
      '地城-植物之屋': 'dragon_nest',
      '地城-恶魔之屋': 'dragon_nest',
      '地城-兽之屋': 'dragon_nest',
      '地城-神秘之屋': 'dragon_nest',
      '地城-虫之屋': 'dragon_nest',
      '勇气试炼城1层': 'sky_temple',
      '勇气试炼城2层': 'sky_temple',
      '勇气试炼城3层': 'sky_temple',
      '勇气试炼城4层': 'sky_temple',
      '劳吉塔地牢6层': 'dragon_nest',
      '劳吉塔地牢7层': 'dragon_nest',
      '劳吉塔地牢8层': 'dragon_nest',
      '劳吉塔地牢9层': 'dragon_nest',
      '希南的秘密通道': 'main_city',
      '西奈的遗址': 'ancient_ruins',
      '混乱的岛': 'coral_beach',
      '流氓兔地图': 'main_city',
};

const MAP_KEYWORD_ZONE: Array<{ keyword: string; zoneId: string }> = [
      { keyword: '巴尔克牧场', zoneId: 'starter_meadow' },
      { keyword: '巴尔干', zoneId: 'thunder_plains' },
      { keyword: '河谷农场', zoneId: 'echo_valley' },
      { keyword: '鲁那特地狱', zoneId: 'lava_sanctum' },
      { keyword: '鲁狄斯', zoneId: 'ancient_ruins' },
      { keyword: '布买', zoneId: 'ancient_ruins' },
      { keyword: '静音废墟', zoneId: 'ancient_ruins' },
      { keyword: '贝赫鲁', zoneId: 'storm_coast' },
      { keyword: '马吉利塔', zoneId: 'storm_coast' },
      { keyword: '海岸', zoneId: 'storm_coast' },
      { keyword: '遗址', zoneId: 'ancient_ruins' },
      { keyword: '森林', zoneId: 'misty_forest' },
      { keyword: '沼泽', zoneId: 'moonlit_grove' },
      { keyword: '废墟', zoneId: 'ancient_ruins' },
      { keyword: '地城', zoneId: 'dragon_nest' },
      { keyword: '地牢', zoneId: 'dragon_nest' },
      { keyword: '试炼城', zoneId: 'sky_temple' },
      { keyword: '海', zoneId: 'coral_beach' },
      { keyword: '秘密通道', zoneId: 'main_city' },
];

const SERIES_MAP_PATTERN = /^(植物|龙系|兽系|虫系|机械|神秘|恶魔|鸟系)\d+层$/;

export class WorldMapPanel {
      private _el: HTMLDivElement;
      private _listCol!: HTMLDivElement;
      private _listFilterCol!: HTMLDivElement;
      private _listZoneCol!: HTMLDivElement;
      private _detailCol!: HTMLDivElement;
      private _visible = false;
      private _zoneManager: ZoneManager;
      private _selectedMapName: string | null = null;
      private _mapSearchKeyword = '';
      private _regionFilter = 'all';
      private _levelBand: MapLevelBand = 'all';
      private _onlyFusible = false;
      private _onlyDropEgg = false;
      private _minLevel = 1;
      private _focusedPetName: string | null = null;

      private _mapSummaries: MapSummary[] = [];
      private _monstersByMap = new Map<string, MapMonsterInfo[]>();
      private _targetsByMap = new Map<string, MapFusionTargetInfo[]>();
      private _listPetsByName = new Map<string, ListPetRow>();
      private _listPetsByKey = new Map<string, ListPetRow>();
      private _ingredientCountByName = new Map<string, number>();

      private _onOpenEncyclopedia: ((petName: string, mapName: string) => void) | null = null;
      private _onOpenFusionByIngredient: ((petName: string, mapName: string) => void) | null = null;
      private _onOpenFusionByTarget: ((targetName: string, mapName: string) => void) | null = null;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._syncResponsiveMode();
      };

      constructor(zoneManager: ZoneManager) {
            this._zoneManager = zoneManager;
            this._indexListPetData();
            this._buildMapDataFromFusion();

            this._el = document.createElement('div');
            this._el.id = 'world-map-panel';
            this._el.className = 'sa-panel wmp-root';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      setNavigationHandlers(handlers: {
            onOpenEncyclopedia?: (petName: string, mapName: string) => void;
            onOpenFusionByIngredient?: (petName: string, mapName: string) => void;
            onOpenFusionByTarget?: (targetName: string, mapName: string) => void;
      }): void {
            this._onOpenEncyclopedia = handlers.onOpenEncyclopedia ?? null;
            this._onOpenFusionByIngredient = handlers.onOpenFusionByIngredient ?? null;
            this._onOpenFusionByTarget = handlers.onOpenFusionByTarget ?? null;
      }

      openAtMap(mapName: string, petName?: string): void {
            this.show();
            this._mapSearchKeyword = '';
            this._regionFilter = 'all';
            this._levelBand = 'all';
            this._focusedPetName = petName ? this._canonicalName(petName) : null;
            const matched = this._findMapName(mapName);
            if (matched) this._selectMap(matched);
      }

      private _buildShell(): void {
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span class="wmp-title-icon">🗺️</span> 世界地圖（合成器分佈）';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const note = document.createElement('div');
            note.className = 'wmp-note';
            note.textContent = '資料地圖以合成器分佈為準；可用快篩：只看可合成、只看可掉蛋、最低等級。';
            this._el.appendChild(note);

            const body = document.createElement('div');
            body.className = 'wmp-body';

            this._listCol = document.createElement('div');
            this._listCol.className = 'wmp-list';
            this._listFilterCol = document.createElement('div');
            this._listFilterCol.className = 'wmp-list-controls';
            this._listZoneCol = document.createElement('div');
            this._listZoneCol.className = 'wmp-zone-list';
            this._listCol.appendChild(this._listFilterCol);
            this._listCol.appendChild(this._listZoneCol);

            this._detailCol = document.createElement('div');
            this._detailCol.className = 'wmp-detail';
            this._detailCol.innerHTML = '<div class="wmp-detail-empty">← 選擇地圖查看怪物分佈與合成目標</div>';

            body.appendChild(this._listCol);
            body.appendChild(this._detailCol);
            this._el.appendChild(body);
      }

      private _render(): void {
            this._syncResponsiveMode();
            this._listFilterCol.innerHTML = '';
            this._listZoneCol.innerHTML = '';
            const currentZoneId = this._zoneManager.currentZone.id;

            const searchWrap = document.createElement('div');
            searchWrap.className = 'wmp-filter-wrap';
            const searchInput = document.createElement('input');
            searchInput.type = 'search';
            searchInput.placeholder = '搜尋地圖名稱';
            searchInput.value = this._mapSearchKeyword;
            searchInput.className = 'wmp-search-input';
            searchInput.addEventListener('input', () => {
                  this._mapSearchKeyword = searchInput.value.trim();
                  this._render();
            });
            searchWrap.appendChild(searchInput);

            const chipsRow = document.createElement('div');
            chipsRow.className = 'wmp-chip-row';
            const regionValues = Array.from(new Set(this._mapSummaries.map(item => item.region))).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
            chipsRow.appendChild(this._buildQuickChip('全部地區', this._regionFilter === 'all', () => {
                  this._regionFilter = 'all';
                  this._render();
            }));
            for (const region of regionValues) {
                  chipsRow.appendChild(this._buildQuickChip(region, this._regionFilter === region, () => {
                        this._regionFilter = region;
                        this._render();
                  }));
            }
            searchWrap.appendChild(chipsRow);

            const bandRow = document.createElement('div');
            bandRow.className = 'wmp-chip-row';
            const bands: Array<{ key: MapLevelBand; label: string }> = [
                  { key: 'all', label: '全部等級' },
                  { key: '1-30', label: 'Lv.1-30' },
                  { key: '31-60', label: 'Lv.31-60' },
                  { key: '61-90', label: 'Lv.61-90' },
                  { key: '91+', label: 'Lv.91+' },
            ];
            for (const band of bands) {
                  bandRow.appendChild(this._buildQuickChip(band.label, this._levelBand === band.key, () => {
                        this._levelBand = band.key;
                        this._render();
                  }));
            }
            searchWrap.appendChild(bandRow);
            this._listFilterCol.appendChild(searchWrap);

            const mapList = this._filteredMapSummaries();
            if (!this._selectedMapName || !mapList.some(item => item.name === this._selectedMapName)) {
                  this._selectedMapName = mapList[0]?.name ?? null;
            }

            let lastRegion = '';
            for (const map of mapList) {
                  if (map.region !== lastRegion) {
                        lastRegion = map.region;
                        const groupHead = document.createElement('div');
                        groupHead.className = 'wmp-region-head';
                        groupHead.textContent = map.region;
                        this._listZoneCol.appendChild(groupHead);
                  }

                  const row = document.createElement('div');
                  row.className = 'wmp-zone-row';
                  if (this._selectedMapName === map.name) row.classList.add('wmp-selected');

                  const info = document.createElement('div');
                  info.className = 'wmp-zone-info';
                  info.style.cursor = 'pointer';
                  info.innerHTML = `
                        <div class="wmp-zone-top">
                              <span class="wmp-zone-emoji">🧭</span>
                              <span class="wmp-zone-name">${this._escapeHtml(map.name)}</span>
                        </div>
                        <div class="wmp-zone-lv">${this._escapeHtml(map.region)} · Lv.${map.minLevel}-${map.maxLevel} · 怪 ${map.monsterCount} / 目標 ${map.targetCount}</div>
                  `;
                  info.addEventListener('click', () => this._selectMap(map.name));

                  const teleBtn = document.createElement('button');
                  teleBtn.className = 'wmp-teleport-btn game-btn game-btn-primary';
                  const zoneDef = map.teleportZoneId ? ZONE_DEFS.find(z => z.id === map.teleportZoneId) : null;
                  if (!zoneDef) {
                        teleBtn.textContent = '資料地圖';
                        teleBtn.disabled = true;
                        teleBtn.classList.add('wmp-btn-disabled');
                  } else if (zoneDef.id === currentZoneId) {
                        teleBtn.textContent = '所在地';
                        teleBtn.disabled = true;
                        teleBtn.classList.add('wmp-btn-disabled');
                  } else if (!this._zoneManager.isUnlocked(zoneDef.id)) {
                        teleBtn.textContent = '🔒';
                        teleBtn.disabled = true;
                        teleBtn.classList.add('wmp-btn-disabled');
                  } else {
                        teleBtn.textContent = map.teleportMode === 'level' ? '近似傳送' : '⚡ 傳送';
                        teleBtn.addEventListener('click', (e) => {
                              e.stopPropagation();
                              this.hide();
                              this._zoneManager.travelTo(zoneDef.id);
                        });
                  }

                  if ((this._isLandscapeFocusMode() || this._isPhoneLandscapeMode()) && !teleBtn.disabled) teleBtn.textContent = '傳送';
                  row.appendChild(info);
                  row.appendChild(teleBtn);
                  this._listZoneCol.appendChild(row);
            }

            if (mapList.length === 0) {
                  this._detailCol.innerHTML = '<div class="wmp-detail-empty">找不到符合搜尋條件的地圖</div>';
                  return;
            }

            if (!this._selectedMapName && mapList.length > 0) {
                  this._selectedMapName = mapList[0].name;
            }
            if (this._selectedMapName) {
                  this._renderDetail(this._selectedMapName);
            }
      }

      private _selectMap(mapName: string): void {
            this._selectedMapName = mapName;
            this._render();
      }

      private _renderDetail(mapName: string): void {
            const summary = this._mapSummaries.find(item => item.name === mapName);
            if (!summary) {
                  this._detailCol.innerHTML = '<div class="wmp-detail-empty">找不到地圖資料</div>';
                  return;
            }

            const monstersAll = this._monstersByMap.get(mapName) ?? [];
            const targetsAll = this._targetsByMap.get(mapName) ?? [];

            const minLevel = Math.max(1, this._minLevel);
            const focusMode = this._isLandscapeFocusMode();
            const compactMode = focusMode || this._isPhoneLandscapeMode();
            this._detailCol.classList.toggle('is-compact', compactMode);
            const monsters = monstersAll.filter(mon => {
                  if (mon.level < minLevel) return false;
                  if (this._onlyDropEgg && mon.dropEgg !== true) return false;
                  if (this._onlyFusible && mon.asIngredientCount <= 0) return false;
                  return true;
            });
            const targets = targetsAll.filter(target => {
                  if (target.resultLevel < minLevel) return false;
                  if (this._onlyDropEgg && target.resultDropEgg !== true) return false;
                  return true;
            });

            const zoneDef = summary.teleportZoneId ? ZONE_DEFS.find(z => z.id === summary.teleportZoneId) : null;

            this._detailCol.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'wmp-detail-header';
            header.innerHTML = `
                  <div class="wmp-detail-title">${this._escapeHtml(mapName)}</div>
                  <div class="wmp-detail-sub">${this._escapeHtml(summary.region)} · Lv.${summary.minLevel}-${summary.maxLevel} · 怪物 ${monsters.length}/${summary.monsterCount} · 合成目標 ${targets.length}/${summary.targetCount}</div>
            `;
            this._detailCol.appendChild(header);

            const navRow = document.createElement('div');
            navRow.className = 'wmp-nav-row';
            if (compactMode) navRow.classList.add('is-compact');
            navRow.innerHTML = `
                  <span class="sa-tag">資料來源：合成器分佈</span>
                  <span class="sa-tag">${zoneDef ? `傳送映射：${this._escapeHtml(zoneDef.nameCN)}${this._teleportModeSuffix(summary.teleportMode)}` : '傳送映射：無'}</span>
            `;
            this._detailCol.appendChild(navRow);

            const filterRow = document.createElement('div');
            filterRow.className = 'wmp-detail-filters';
            if (compactMode) filterRow.classList.add('is-compact');
            const createToggle = (label: string, active: boolean, onToggle: () => void): HTMLButtonElement => {
                  const btn = document.createElement('button');
                  btn.type = 'button';
                  btn.textContent = label;
                  btn.className = `wmp-toggle-chip${active ? ' is-active' : ''}`;
                  btn.addEventListener('click', onToggle);
                  return btn;
            };
            filterRow.appendChild(createToggle('只看可合成', this._onlyFusible, () => {
                  this._onlyFusible = !this._onlyFusible;
                  this._render();
            }));
            filterRow.appendChild(createToggle('只看可掉蛋', this._onlyDropEgg, () => {
                  this._onlyDropEgg = !this._onlyDropEgg;
                  this._render();
            }));

            const minWrap = document.createElement('label');
            minWrap.className = 'wmp-min-level-wrap';
            minWrap.textContent = '最低等級';
            const minInput = document.createElement('input');
            minInput.type = 'number';
            minInput.min = '1';
            minInput.max = '300';
            minInput.step = '1';
            minInput.value = String(this._minLevel);
            minInput.className = 'wmp-min-level-input';
            const applyMin = (): void => {
                  const parsed = Number.parseInt(minInput.value, 10);
                  this._minLevel = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
                  minInput.value = String(this._minLevel);
                  this._render();
            };
            minInput.addEventListener('change', applyMin);
            minInput.addEventListener('blur', applyMin);
            minWrap.appendChild(minInput);
            filterRow.appendChild(minWrap);
            this._detailCol.appendChild(filterRow);

            const monsterTitle = document.createElement('div');
            monsterTitle.className = 'wmp-section-title';
            monsterTitle.textContent = `🐾 地圖怪物（${monsters.length}/${monstersAll.length}）`;
            this._detailCol.appendChild(monsterTitle);

            if (monsters.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'wmp-detail-empty';
                  empty.textContent = '此地圖沒有怪物分佈資料。';
                  this._detailCol.appendChild(empty);
            } else {
                  const list = document.createElement('div');
                  list.className = 'wmp-result-list';
                  for (const mon of monsters.slice(0, 120)) {
                        const focused = this._focusedPetName !== null && this._focusedPetName === this._canonicalName(mon.name);
                        const card = document.createElement('div');
                        card.className = `wmp-result-card wmp-monster-card game-card${focused ? ' is-focused' : ''}`;
                        const line1 = document.createElement('div');
                        line1.className = 'wmp-card-line';
                        const name = document.createElement('span');
                        name.className = 'wmp-card-name';
                        name.textContent = mon.name;
                        const lv = document.createElement('span');
                        lv.className = 'wmp-card-lv';
                        lv.textContent = `Lv.${mon.level} · ${this._dropEggText(mon.dropEgg)}`;
                        line1.appendChild(name);
                        line1.appendChild(lv);
                        card.appendChild(line1);

                        const actions = document.createElement('div');
                        actions.className = 'wmp-card-actions';

                        const sourceTag = document.createElement('span');
                        sourceTag.className = 'wmp-source-tag';
                        sourceTag.textContent = mon.asIngredientCount > 0 ? `可作素材(${mon.asIngredientCount})` : '暫無合成用途';
                        if (compactMode) sourceTag.classList.add('is-hidden');
                        actions.appendChild(sourceTag);

                        const bookBtn = document.createElement('button');
                        bookBtn.type = 'button';
                        bookBtn.className = 'wmp-teleport-btn game-btn game-btn-secondary wmp-card-btn';
                        bookBtn.textContent = compactMode ? '圖鑑' : '查看圖鑑';
                        bookBtn.addEventListener('click', () => {
                              this.hide();
                              this._onOpenEncyclopedia?.(mon.name, mapName);
                        });
                        actions.appendChild(bookBtn);

                        const fusionBtn = document.createElement('button');
                        fusionBtn.type = 'button';
                        fusionBtn.className = 'wmp-teleport-btn game-btn game-btn-primary wmp-card-btn';
                        fusionBtn.textContent = compactMode ? '合成' : '查看可合成目標';
                        fusionBtn.disabled = mon.asIngredientCount <= 0;
                        if (mon.asIngredientCount <= 0) fusionBtn.classList.add('wmp-btn-disabled');
                        fusionBtn.addEventListener('click', () => {
                              this.hide();
                              this._onOpenFusionByIngredient?.(mon.name, mapName);
                        });
                        actions.appendChild(fusionBtn);

                        card.appendChild(actions);
                        list.appendChild(card);
                  }

                  if (monsters.length > 120) {
                        const more = document.createElement('div');
                        more.className = 'wmp-more-line';
                        more.textContent = `還有 ${monsters.length - 120} 隻怪物未展開。`;
                        list.appendChild(more);
                  }

                  this._detailCol.appendChild(list);
            }

            const targetTitle = document.createElement('div');
            targetTitle.className = 'wmp-section-title';
            targetTitle.textContent = `⚗️ 此地圖可合成目標（${targets.length}/${targetsAll.length}）`;
            this._detailCol.appendChild(targetTitle);

            if (targets.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'wmp-detail-empty';
                  empty.textContent = '此地圖暫無合成目標資料。';
                  this._detailCol.appendChild(empty);
            } else {
                  const list = document.createElement('div');
                  list.className = 'wmp-result-list';
                  for (const target of targets.slice(0, 80)) {
                        const focused = this._focusedPetName !== null && this._focusedPetName === this._canonicalName(target.resultName);
                        const item = document.createElement('div');
                        item.className = `wmp-result-card wmp-target-card game-card${focused ? ' is-focused' : ''}`;
                        const head = document.createElement('div');
                        head.className = 'wmp-card-line';
                        const name = document.createElement('span');
                        name.className = 'wmp-card-name';
                        name.textContent = target.resultName;
                        const lv = document.createElement('span');
                        lv.className = 'wmp-card-lv';
                        lv.textContent = `Lv.${target.resultLevel} · ${this._dropEggText(target.resultDropEgg)}`;
                        head.appendChild(name);
                        head.appendChild(lv);
                        item.appendChild(head);

                        const recipe = document.createElement('div');
                        recipe.className = 'wmp-card-recipe';
                        recipe.textContent = `${target.mainName} + ${target.subName}`;
                        if (compactMode) recipe.classList.add('is-hidden');
                        item.appendChild(recipe);

                        const bookBtn = document.createElement('button');
                        bookBtn.type = 'button';
                        bookBtn.className = 'wmp-teleport-btn game-btn game-btn-secondary wmp-card-btn';
                        bookBtn.textContent = compactMode ? '圖鑑' : '查看圖鑑';
                        bookBtn.addEventListener('click', () => {
                              this.hide();
                              this._onOpenEncyclopedia?.(target.resultName, mapName);
                        });

                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'wmp-teleport-btn game-btn game-btn-primary wmp-card-btn';
                        btn.textContent = compactMode ? '配方' : '查看配方';
                        btn.addEventListener('click', () => {
                              this.hide();
                              this._onOpenFusionByTarget?.(target.resultName, mapName);
                        });

                        const row = document.createElement('div');
                        row.className = 'wmp-card-actions';
                        row.appendChild(bookBtn);
                        row.appendChild(btn);
                        item.appendChild(row);
                        list.appendChild(item);
                  }
                  if (targets.length > 80) {
                        const more = document.createElement('div');
                        more.className = 'wmp-more-line';
                        more.textContent = `還有 ${targets.length - 80} 個目標未展開。`;
                        list.appendChild(more);
                  }
                  this._detailCol.appendChild(list);
            }

            const footer = document.createElement('div');
            footer.className = 'wmp-detail-footer';
            const teleBtn = document.createElement('button');
            teleBtn.className = 'wmp-teleport-footer-btn game-btn game-btn-primary';
            if (!zoneDef) {
                  teleBtn.textContent = '此地圖暫無傳送映射';
                  teleBtn.disabled = true;
                  teleBtn.classList.add('wmp-btn-disabled');
            } else if (zoneDef.id === this._zoneManager.currentZone.id) {
                  teleBtn.textContent = '📍 目前所在';
                  teleBtn.disabled = true;
                  teleBtn.classList.add('wmp-btn-disabled');
            } else if (!this._zoneManager.isUnlocked(zoneDef.id)) {
                  teleBtn.textContent = '🔒 尚未解鎖';
                  teleBtn.disabled = true;
                  teleBtn.classList.add('wmp-btn-disabled');
            } else {
                  teleBtn.textContent = `${summary.teleportMode === 'level' ? '近似傳送至' : '⚡ 傳送至'} ${zoneDef.nameCN}`;
                  teleBtn.addEventListener('click', () => {
                        this.hide();
                        this._zoneManager.travelTo(zoneDef.id);
                  });
            }
            if (compactMode && !teleBtn.disabled) teleBtn.textContent = '傳送';
            footer.appendChild(teleBtn);
            this._detailCol.appendChild(footer);
      }

      private _filteredMapSummaries(): MapSummary[] {
            const key = this._mapSearchKeyword.trim().toLowerCase();
            return this._mapSummaries.filter(item => {
                  if (key && !item.name.toLowerCase().includes(key)) return false;
                  if (this._regionFilter !== 'all' && item.region !== this._regionFilter) return false;
                  if (!this._passesLevelBand(item)) return false;
                  return true;
            });
      }

      private _passesLevelBand(item: MapSummary): boolean {
            const avg = (item.minLevel + item.maxLevel) / 2;
            switch (this._levelBand) {
                  case '1-30':
                        return avg <= 30;
                  case '31-60':
                        return avg > 30 && avg <= 60;
                  case '61-90':
                        return avg > 60 && avg <= 90;
                  case '91+':
                        return avg > 90;
                  case 'all':
                  default:
                        return true;
            }
      }

      private _buildQuickChip(label: string, active: boolean, onClick: () => void): HTMLButtonElement {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            btn.className = `wmp-quick-chip${active ? ' is-active' : ''}`;
            btn.addEventListener('click', onClick);
            return btn;
      }

      private _teleportModeSuffix(mode: TeleportMatchMode): string {
            if (mode === 'level') return '（等級近似）';
            if (mode === 'keyword' || mode === 'series') return '（關鍵字映射）';
            if (mode === 'none') return '（無）';
            return '';
      }

      private _indexListPetData(): void {
            const payload = listPetsRaw as ListPetPayload;
            const rows = Array.isArray(payload.pets) ? payload.pets : [];
            for (const row of rows) {
                  const name = this._canonicalName(String(row?.name ?? '').trim());
                  if (!name) continue;
                  this._listPetsByName.set(name, row);
                  this._listPetsByKey.set(this._normalizeNameKey(name), row);
            }
      }

      private _buildMapDataFromFusion(): void {
            const payload = mixmasterRecipesRaw as MixmasterRecipePayload;
            const monsters = Array.isArray(payload.monsters) ? payload.monsters : [];
            const recipes = Array.isArray(payload.recipes) ? payload.recipes : [];

            this._ingredientCountByName = new Map<string, number>();
            for (const recipe of recipes) {
                  const main = this._canonicalName(recipe.mainName);
                  const sub = this._canonicalName(recipe.subName);
                  if (main) this._ingredientCountByName.set(main, (this._ingredientCountByName.get(main) ?? 0) + 1);
                  if (sub) this._ingredientCountByName.set(sub, (this._ingredientCountByName.get(sub) ?? 0) + 1);
            }

            const monsterByMap = new Map<string, Map<string, MapMonsterInfo>>();
            for (const row of monsters) {
                  const name = this._canonicalName(row.name);
                  if (!name) continue;
                  const level = this._toLevel(row.baseLevel, this._findListPetLevel(name) ?? 1);
                  const dropEgg = typeof row.dropEgg === 'boolean'
                        ? row.dropEgg
                        : this._parseDropEgg(typeof row.dropEggRaw === 'string' ? row.dropEggRaw : null);
                  const maps = this._normalizeMapArray(row.maps);
                  for (const mapName of maps) {
                        const cleanMap = this._canonicalMapName(mapName);
                        if (!cleanMap) continue;
                        let mapEntries = monsterByMap.get(cleanMap);
                        if (!mapEntries) {
                              mapEntries = new Map<string, MapMonsterInfo>();
                              monsterByMap.set(cleanMap, mapEntries);
                        }
                        const prev = mapEntries.get(name);
                        const fusible = this._findListPetByName(name)?.fusible ?? null;
                        const asIngredientCount = this._ingredientCountByName.get(name) ?? 0;
                        if (!prev) {
                              mapEntries.set(name, {
                                    name,
                                    level,
                                    dropEgg,
                                    series: typeof row.series === 'string' ? row.series : null,
                                    fusible: typeof fusible === 'boolean' ? fusible : null,
                                    asIngredientCount,
                              });
                        } else {
                              prev.level = Math.max(prev.level, level);
                              prev.dropEgg = this._mergeDropEgg(prev.dropEgg, dropEgg);
                              prev.asIngredientCount = Math.max(prev.asIngredientCount, asIngredientCount);
                              if (prev.fusible === null && typeof fusible === 'boolean') prev.fusible = fusible;
                        }
                  }
            }

            const targetsByMapRaw = new Map<string, Map<string, MapFusionTargetInfo>>();
            for (const row of recipes) {
                  const resultName = this._canonicalName(row.resultName);
                  const mainName = this._canonicalName(row.mainName);
                  const subName = this._canonicalName(row.subName);
                  if (!resultName || !mainName || !subName) continue;
                  const maps = this._normalizeMapArray(row.resultMaps);
                  const level = this._toLevel(row.resultBaseLevel, this._findListPetLevel(resultName) ?? 1);
                  const dropEgg = typeof row.resultDropEgg === 'boolean'
                        ? row.resultDropEgg
                        : this._parseDropEgg(typeof row.resultDropEggRaw === 'string' ? row.resultDropEggRaw : null);
                  for (const mapName of maps) {
                        const cleanMap = this._canonicalMapName(mapName);
                        if (!cleanMap) continue;
                        let mapTargets = targetsByMapRaw.get(cleanMap);
                        if (!mapTargets) {
                              mapTargets = new Map<string, MapFusionTargetInfo>();
                              targetsByMapRaw.set(cleanMap, mapTargets);
                        }
                        const key = `${resultName}|${mainName}|${subName}`;
                        if (!mapTargets.has(key)) {
                              mapTargets.set(key, {
                                    resultName,
                                    resultLevel: level,
                                    resultDropEgg: dropEgg,
                                    mainName,
                                    subName,
                              });
                        }
                  }
            }

            this._monstersByMap = new Map<string, MapMonsterInfo[]>();
            for (const [mapName, entries] of monsterByMap) {
                  const list = Array.from(entries.values()).sort((a, b) => {
                        if (a.level !== b.level) return a.level - b.level;
                        return a.name.localeCompare(b.name, 'zh-Hant');
                  });
                  this._monstersByMap.set(mapName, list);
            }

            this._targetsByMap = new Map<string, MapFusionTargetInfo[]>();
            for (const [mapName, entries] of targetsByMapRaw) {
                  const list = Array.from(entries.values()).sort((a, b) => {
                        if (a.resultLevel !== b.resultLevel) return a.resultLevel - b.resultLevel;
                        return a.resultName.localeCompare(b.resultName, 'zh-Hant');
                  });
                  this._targetsByMap.set(mapName, list);
            }

            const mapNames = new Set<string>();
            for (const mapName of this._monstersByMap.keys()) mapNames.add(mapName);
            for (const mapName of this._targetsByMap.keys()) mapNames.add(mapName);

            this._mapSummaries = Array.from(mapNames).map((name) => {
                  const mons = this._monstersByMap.get(name) ?? [];
                  const targets = this._targetsByMap.get(name) ?? [];
                  const levels = mons.map(item => item.level).filter(level => Number.isFinite(level));
                  const minLevel = levels.length > 0 ? Math.min(...levels) : 1;
                  const maxLevel = levels.length > 0 ? Math.max(...levels) : 1;
                  const zoneMatch = this._mapToZoneMatch(name, minLevel, maxLevel);
                  return {
                        name,
                        region: this._resolveRegionLabel(name),
                        monsterCount: mons.length,
                        targetCount: targets.length,
                        minLevel,
                        maxLevel,
                        teleportZoneId: zoneMatch.zoneId,
                        teleportMode: zoneMatch.mode,
                  };
            }).sort((a, b) => {
                  if (a.minLevel !== b.minLevel) return a.minLevel - b.minLevel;
                  return a.name.localeCompare(b.name, 'zh-Hant');
            });
      }

      private _mapToZoneMatch(mapName: string, minLevel: number, maxLevel: number): { zoneId: string | null; mode: TeleportMatchMode } {
            const key = this._canonicalMapName(mapName);
            if (!key) return { zoneId: null, mode: 'none' };

            const lower = key.toLowerCase();
            for (const [exact, zoneId] of Object.entries(MAP_EXACT_ZONE)) {
                  if (lower === exact.toLowerCase()) return { zoneId, mode: 'exact' };
            }

            if (SERIES_MAP_PATTERN.test(key)) {
                  return { zoneId: 'dragon_nest', mode: 'series' };
            }

            for (const hint of MAP_KEYWORD_ZONE) {
                  if (key.includes(hint.keyword)) return { zoneId: hint.zoneId, mode: 'keyword' };
            }

            const zones = ZONE_DEFS.filter(zone => !zone.isTown);
            if (zones.length === 0) return { zoneId: null, mode: 'none' };

            const avgLevel = (Math.max(1, minLevel) + Math.max(1, maxLevel)) / 2;
            let bestZone = zones[0];
            let bestScore = Number.POSITIVE_INFINITY;

            for (const zone of zones) {
                  const center = (zone.levelMin + zone.levelMax) / 2;
                  let score = Math.abs(center - avgLevel);
                  if (avgLevel < zone.levelMin) score += (zone.levelMin - avgLevel) * 0.6;
                  if (avgLevel > zone.levelMax) score += (avgLevel - zone.levelMax) * 0.6;
                  if (score < bestScore) {
                        bestScore = score;
                        bestZone = zone;
                  }
            }

            return { zoneId: bestZone.id, mode: 'level' };
      }

      private _resolveRegionLabel(mapName: string): string {
            if (/巴尔克牧场|河谷农场|巴尔干/.test(mapName)) return '牧場地帶';
            if (/鲁那特地狱/.test(mapName)) return '地獄地帶';
            if (/鲁狄斯|遗址|废墟|布买|静音/.test(mapName)) return '遺跡地帶';
            if (/贝赫鲁|马吉利塔|海岸|混乱的岛/.test(mapName)) return '海岸地帶';
            if (/森林|沼泽/.test(mapName)) return '森林地帶';
            if (/地城|地牢/.test(mapName) || SERIES_MAP_PATTERN.test(mapName)) return '系別地城';
            if (/试炼城/.test(mapName)) return '試煉地帶';
            if (/白色荒野/.test(mapName)) return '冰原地帶';
            if (/秘密通道/.test(mapName)) return '城鎮周邊';
            if (/流氓兔地图/.test(mapName)) return '活動地圖';
            return '其他區域';
      }

      private _findMapName(input: string): string | null {
            const key = this._canonicalMapName(input);
            if (!key) return null;
            const direct = this._mapSummaries.find(item => this._canonicalMapName(item.name) === key);
            if (direct) return direct.name;
            const lowered = key.toLowerCase();
            const includes = this._mapSummaries.find(item => {
                  const target = this._canonicalMapName(item.name).toLowerCase();
                  return target.includes(lowered) || lowered.includes(target);
            });
            return includes?.name ?? null;
      }

      private _findListPetByName(name: string): ListPetRow | null {
            const clean = this._canonicalName(name.trim());
            if (!clean) return null;
            const direct = this._listPetsByName.get(clean);
            if (direct) return direct;
            return this._listPetsByKey.get(this._normalizeNameKey(clean)) ?? null;
      }

      private _findListPetLevel(name: string): number | null {
            const level = this._findListPetByName(name)?.level;
            if (typeof level === 'number' && Number.isFinite(level)) return Math.max(1, Math.floor(level));
            return null;
      }

      private _canonicalName(raw: string): string {
            return canonicalPetName(raw);
      }

      private _canonicalMapName(raw: string): string {
            let clean = String(raw ?? '').trim();
            if (!clean) return clean;
            clean = clean.replace(/［/g, '[').replace(/］/g, ']');
            clean = clean.replace(/\s+/g, '');
            clean = clean.replace(/巴尔克牧场([abc])/i, (_all, s: string) => `巴尔克牧场${String(s).toUpperCase()}`);
            clean = clean.replace(/\?+$/g, '');
            return clean;
      }

      private _normalizeNameKey(raw: string): string {
            return normalizeFusionNameKey(raw);
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

      private _normalizeMapArray(value: unknown): string[] {
            return this._normalizeStringArray(value)
                  .map(name => this._canonicalMapName(name))
                  .filter(Boolean);
      }

      private _toLevel(raw: unknown, fallback = 1): number {
            if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
            return Math.max(1, Math.floor(fallback));
      }

      private _parseDropEgg(value: string | null): boolean | null {
            if (!value) return null;
            const v = value.trim();
            if (!v) return null;
            return v !== '0';
      }

      private _mergeDropEgg(a: boolean | null, b: boolean | null): boolean | null {
            if (a === null) return b;
            if (b === null) return a;
            return a || b;
      }

      private _dropEggText(dropEgg: boolean | null): string {
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

      private _isLandscapeFocusMode(): boolean {
            const w = window.innerWidth || 0;
            const h = window.innerHeight || 0;
            return w > h && w <= 980 && h <= 560;
      }

      private _isPhoneLandscapeMode(): boolean {
            const w = window.innerWidth || 0;
            const h = window.innerHeight || 0;
            return w > h && h <= 560 && w <= 1280;
      }

      private _syncResponsiveMode(): void {
            this._el.classList.toggle('is-focus-mode', this._isLandscapeFocusMode());
            this._el.classList.toggle('is-phone-landscape', this._isPhoneLandscapeMode());
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }

      show(): void {
            this._visible = true;
            this._syncResponsiveMode();
            this._el.style.display = 'block';
            if (!this._selectedMapName && this._mapSummaries.length > 0) this._selectedMapName = this._mapSummaries[0].name;
            this._render();
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
      }

      dispose(): void {
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}

