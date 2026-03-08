import type { ZoneManager } from '../world/ZoneManager';
import worldTopologyRaw from '../data/runtime/world.topology.json';
import worldSpawnRaw from '../data/runtime/world.spawn.json';
import fusionRuntimeRaw from '../data/runtime/fusion.runtime.json';
import listPetsRaw from '../data/fusion/list_pets.json';
import type { ListPetPayload, ListPetRow } from '../data/fusion/types';
import { canonicalPetName, normalizeFusionNameKey } from '../data/fusion/FusionNameUtils';
import { canonicalRuntimeMapName, matchRuntimeZoneToSceneZone, type RuntimeZoneMatchMode } from '../data/runtime/RuntimeZoneBridge';
import { getRuntimeMapByZoneId, listRuntimeMapNeighbors, resolveRuntimeMapEntry } from '../data/runtime/RuntimeMapCatalog';

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
      mapKey: string;
      name: string;
      baseName: string;
      region: string;
      monsterCount: number;
      targetCount: number;
      minLevel: number;
      maxLevel: number;
      runtimeZoneId: number | null;
      teleportSceneZoneId: string | null;
      teleportMode: RuntimeZoneMatchMode;
      neighborMapKeys: string[];
}

type MapLevelBand = 'all' | '1-30' | '31-60' | '61-90' | '91+';

export class WorldMapPanel {
      private _el: HTMLDivElement;
      private _listCol!: HTMLDivElement;
      private _listFilterCol!: HTMLDivElement;
      private _listZoneCol!: HTMLDivElement;
      private _detailCol!: HTMLDivElement;
      private _visible = false;
      private _zoneManager: ZoneManager;
      private _selectedMapKey: string | null = null;
      private _mapSearchKeyword = '';
      private _regionFilter = 'all';
      private _levelBand: MapLevelBand = 'all';
      private _onlyFusible = false;
      private _onlyDropEgg = false;
      private _minLevel = 1;
      private _focusedPetName: string | null = null;
      private _trackedTargetMapKey: string | null = null;
      private _trackedRouteNodes = new Set<string>();
      private readonly _trackStorageKey = 'fpo.worldmap.route.track.v1';

      private _mapSummaries: MapSummary[] = [];
      private _monstersByMap = new Map<string, MapMonsterInfo[]>();
      private _targetsByMap = new Map<string, MapFusionTargetInfo[]>();
      private _listPetsByName = new Map<string, ListPetRow>();
      private _listPetsByKey = new Map<string, ListPetRow>();
      private _ingredientCountByName = new Map<string, number>();

      private _onOpenEncyclopedia: ((petName: string, mapKey: string) => void) | null = null;
      private _onOpenFusionByIngredient: ((petName: string, mapKey: string) => void) | null = null;
      private _onOpenFusionByTarget: ((targetName: string, mapKey: string) => void) | null = null;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._syncResponsiveMode();
      };

      constructor(zoneManager: ZoneManager) {
            this._zoneManager = zoneManager;
            this._indexListPetData();
            this._buildMapDataFromFusion();
            this._trackedTargetMapKey = this._loadTrackedTarget();
            this._refreshTrackedRouteFromCurrent();

            this._el = document.createElement('div');
            this._el.id = 'world-map-panel';
            this._el.className = 'sa-panel wmp-root ui-panel-fullscreen';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      setNavigationHandlers(handlers: {
            onOpenEncyclopedia?: (petName: string, mapKey: string) => void;
            onOpenFusionByIngredient?: (petName: string, mapKey: string) => void;
            onOpenFusionByTarget?: (targetName: string, mapKey: string) => void;
      }): void {
            this._onOpenEncyclopedia = handlers.onOpenEncyclopedia ?? null;
            this._onOpenFusionByIngredient = handlers.onOpenFusionByIngredient ?? null;
            this._onOpenFusionByTarget = handlers.onOpenFusionByTarget ?? null;
      }

      openAtMap(mapKeyOrName: string, petName?: string): void {
            this.show();
            this._mapSearchKeyword = '';
            this._regionFilter = 'all';
            this._levelBand = 'all';
            this._focusedPetName = petName ? this._canonicalName(petName) : null;
            const matched = this._findMapKey(mapKeyOrName);
            if (matched) this._selectMap(matched);
      }

      private _buildShell(): void {
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span class="wmp-title-icon">🗺️</span> 世界地圖';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const note = document.createElement('div');
            note.className = 'wmp-note';
            note.textContent = '依地區快速查怪物、合成來源與傳送。';
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
            this._detailCol.innerHTML = '<div class="wmp-detail-empty">← 先選擇左側地圖</div>';

            body.appendChild(this._listCol);
            body.appendChild(this._detailCol);
            this._el.appendChild(body);
      }

      private _render(): void {
            this._syncResponsiveMode();
            this._listFilterCol.innerHTML = '';
            this._listZoneCol.innerHTML = '';
            const currentZoneId = this._zoneManager.currentZone.id;
            this._refreshTrackedRouteFromCurrent();

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
            if (!this._selectedMapKey || !mapList.some(item => item.mapKey === this._selectedMapKey)) {
                  this._selectedMapKey = mapList[0]?.mapKey ?? null;
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
                  if (this._selectedMapKey === map.mapKey) row.classList.add('wmp-selected');
                  if (this._trackedTargetMapKey === map.mapKey) row.classList.add('wmp-tracked');
                  if (this._trackedRouteNodes.has(map.mapKey)) row.classList.add('wmp-on-route');
                  const info = document.createElement('div');
                  info.className = 'wmp-zone-info';
                  info.innerHTML = `
                        <div class="wmp-zone-top">
                              <span class="wmp-zone-emoji">\u5340</span>
                              <span class="wmp-zone-name">${this._escapeHtml(map.name)}</span>
                        </div>
                        <div class="wmp-zone-lv">Lv.${map.minLevel}-${map.maxLevel} · 怪${map.monsterCount} · 合${map.targetCount}</div>
                  `;
                  info.addEventListener('click', () => this._selectMap(map.mapKey));

                  const teleBtn = document.createElement('button');
                  teleBtn.className = 'wmp-teleport-btn rpg-op-btn rpg-op-btn-sm rpg-op-btn-primary';
                  const sceneZoneId = map.teleportSceneZoneId;
                  if (!sceneZoneId) {
                        teleBtn.textContent = '\u7121\u6620\u5c04';
                        teleBtn.disabled = true;
                        teleBtn.classList.add('wmp-btn-disabled');
                  } else if (sceneZoneId === currentZoneId) {
                        teleBtn.textContent = '\u6240\u5728\u5730';
                        teleBtn.disabled = true;
                        teleBtn.classList.add('wmp-btn-disabled');
                  } else if (!this._zoneManager.isUnlocked(sceneZoneId)) {
                        teleBtn.textContent = '\ud83d\udd12 \u672a\u89e3\u9396';
                        teleBtn.disabled = true;
                        teleBtn.classList.add('wmp-btn-disabled');
                  } else {
                        teleBtn.textContent = map.teleportMode === 'level'
                              ? '\u8fd1\u4f3c\u50b3\u9001'
                              : '\u50b3\u9001';
                        teleBtn.addEventListener('click', (e) => {
                              e.stopPropagation();
                              this.hide();
                              this._zoneManager.travelTo(sceneZoneId);
                        });
                  }

                  if ((this._isLandscapeFocusMode() || this._isPhoneLandscapeMode()) && !teleBtn.disabled) teleBtn.textContent = '\u50b3\u9001';
                  row.appendChild(info);
                  row.appendChild(teleBtn);
                  this._listZoneCol.appendChild(row);
            }

            if (mapList.length === 0) {
                  this._detailCol.innerHTML = '<div class="wmp-detail-empty">找不到符合條件的地圖</div>';
                  return;
            }

            if (!this._selectedMapKey && mapList.length > 0) {
                  this._selectedMapKey = mapList[0].mapKey;
            }
            if (this._selectedMapKey) {
                  this._renderDetail(this._selectedMapKey);
            }
      }

      private _selectMap(mapKey: string): void {
            this._selectedMapKey = mapKey;
            this._render();
      }

      private _renderDetail(mapKey: string): void {
            const summary = this._mapSummaries.find(item => item.mapKey === mapKey);
            if (!summary) {
                  this._detailCol.innerHTML = '<div class="wmp-detail-empty">找不到地圖資料</div>';
                  return;
            }

            const monstersAll = this._monstersByMap.get(mapKey) ?? [];
            const targetsAll = this._targetsByMap.get(mapKey) ?? [];

            const minLevel = Math.max(1, this._minLevel);
            const focusMode = this._isLandscapeFocusMode();
            const compactMode = focusMode || this._isPhoneLandscapeMode();
            const monsterRenderLimit = compactMode ? 40 : 120;
            const targetRenderLimit = compactMode ? 32 : 80;
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

            const sceneZoneId = summary.teleportSceneZoneId;

            this._detailCol.innerHTML = '';
            const sticky = document.createElement('div');
            sticky.className = 'wmp-detail-sticky';
            const content = document.createElement('div');
            content.className = 'wmp-detail-content';

            const header = document.createElement('div');
            header.className = 'wmp-detail-header';
            header.innerHTML = `
                  <div class="wmp-detail-title">${this._escapeHtml(summary.name)}</div>
                  <div class="wmp-detail-sub">${this._escapeHtml(summary.region)} · Lv.${summary.minLevel}-${summary.maxLevel} · 怪${monsters.length}/${summary.monsterCount} · 合${targets.length}/${summary.targetCount}</div>
            `;
            sticky.appendChild(header);

            const navRow = document.createElement('div');
            navRow.className = 'wmp-nav-row';
            if (compactMode) navRow.classList.add('is-compact');
            const teleportLabel = sceneZoneId
                  ? `傳送點：${sceneZoneId}${this._teleportModeSuffix(summary.teleportMode)}`
                  : '傳送點：無';
            const neighborLabel = summary.neighborMapKeys.length > 0
                  ? `連接：${summary.neighborMapKeys.length}`
                  : '連接：0';
            navRow.innerHTML = `
                  <span class="sa-tag">資料：DB</span>
                  <span class="sa-tag">${teleportLabel}</span>
                  <span class="sa-tag">${neighborLabel}</span>
            `;
            sticky.appendChild(navRow);

            if (summary.neighborMapKeys.length > 0) {
                  const linkRow = document.createElement('div');
                  linkRow.className = 'wmp-link-row';
                  for (const neighborKey of summary.neighborMapKeys.slice(0, 12)) {
                        const neighborMap = this._mapSummaries.find((item) => item.mapKey === neighborKey);
                        if (!neighborMap) continue;
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = 'wmp-link-chip rpg-chip rpg-chip-filter';
                        chip.textContent = neighborMap.name;
                        chip.addEventListener('click', () => this._selectMap(neighborMap.mapKey));
                        linkRow.appendChild(chip);
                  }
                  if (summary.neighborMapKeys.length > 12) {
                        const more = document.createElement('span');
                        more.className = 'wmp-link-more';
                        more.textContent = `+${summary.neighborMapKeys.length - 12}`;
                        linkRow.appendChild(more);
                  }
                  sticky.appendChild(linkRow);
            }

            const currentMapKey = this._getCurrentMapKey();
            const route = currentMapKey ? this._findRoute(currentMapKey, mapKey) : [];
            const routeCard = document.createElement('div');
            routeCard.className = 'wmp-route-card';
            const routeTitle = document.createElement('div');
            routeTitle.className = 'wmp-route-title';
            routeTitle.textContent = '路線導引';
            routeCard.appendChild(routeTitle);

            const routeText = document.createElement('div');
            routeText.className = 'wmp-route-path';
            if (!currentMapKey) {
                  routeText.textContent = '目前區域未映射，無法計算路線。';
            } else if (currentMapKey === mapKey) {
                  routeText.textContent = `目前所在：${summary.name}`;
            } else if (route.length <= 0) {
                  routeText.textContent = `不可達：${this._getMapNameByKey(currentMapKey) ?? currentMapKey} -> ${summary.name}`;
            } else {
                  routeText.textContent = route.map((routeMapKey) => this._getMapNameByKey(routeMapKey) ?? routeMapKey).join(' -> ');
            }
            routeCard.appendChild(routeText);

            const routeActions = document.createElement('div');
            routeActions.className = 'wmp-route-actions';
            const trackBtn = document.createElement('button');
            trackBtn.type = 'button';
            trackBtn.className = 'wmp-route-btn rpg-op-btn rpg-op-btn-sm rpg-op-btn-primary';
            trackBtn.textContent = this._trackedTargetMapKey === mapKey ? '已追蹤' : '追蹤';
            trackBtn.disabled = !currentMapKey || route.length <= 0 || this._trackedTargetMapKey === mapKey;
            trackBtn.addEventListener('click', () => {
                  this._setTrackedTarget(mapKey);
                  this._render();
            });
            routeActions.appendChild(trackBtn);

            if (this._trackedTargetMapKey) {
                  const clearBtn = document.createElement('button');
                  clearBtn.type = 'button';
                  clearBtn.className = 'wmp-route-btn rpg-op-btn rpg-op-btn-sm rpg-op-btn-secondary';
                  clearBtn.textContent = '清除';
                  clearBtn.addEventListener('click', () => {
                        this._setTrackedTarget(null);
                        this._render();
                  });
                  routeActions.appendChild(clearBtn);
            }

            routeCard.appendChild(routeActions);
            content.appendChild(routeCard);

            const filterRow = document.createElement('div');
            filterRow.className = 'wmp-detail-filters';
            if (compactMode) filterRow.classList.add('is-compact');
            const createToggle = (label: string, active: boolean, onToggle: () => void): HTMLButtonElement => {
                  const btn = document.createElement('button');
                  btn.type = 'button';
                  btn.textContent = label;
                  btn.className = `wmp-toggle-chip rpg-chip rpg-chip-filter${active ? ' is-active' : ''}`;
                  btn.addEventListener('click', onToggle);
                  return btn;
            };
            filterRow.appendChild(createToggle('可合成', this._onlyFusible, () => {
                  this._onlyFusible = !this._onlyFusible;
                  this._render();
            }));
            filterRow.appendChild(createToggle('可掉蛋', this._onlyDropEgg, () => {
                  this._onlyDropEgg = !this._onlyDropEgg;
                  this._render();
            }));

            const minWrap = document.createElement('label');
            minWrap.className = 'wmp-min-level-wrap';
            minWrap.textContent = '最低Lv';
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
            sticky.appendChild(filterRow);

            const monsterTitle = document.createElement('div');
            monsterTitle.className = 'wmp-section-title';
            monsterTitle.textContent = `🐾 地圖怪物（${monsters.length}/${monstersAll.length}）`;
            content.appendChild(monsterTitle);

            if (monsters.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'wmp-detail-empty';
                  empty.textContent = '此地圖沒有怪物分佈資料。';
                  content.appendChild(empty);
            } else {
                  const list = document.createElement('div');
                  list.className = 'wmp-result-list';
                  for (const mon of monsters.slice(0, monsterRenderLimit)) {
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
                        sourceTag.textContent = mon.asIngredientCount > 0 ? `可作素材(${mon.asIngredientCount})` : '無合成用途';
                        if (compactMode) sourceTag.classList.add('is-hidden');
                        actions.appendChild(sourceTag);

                        const bookBtn = document.createElement('button');
                        bookBtn.type = 'button';
                        bookBtn.className = 'wmp-teleport-btn wmp-card-btn rpg-op-btn rpg-op-btn-sm rpg-op-btn-secondary';
                        bookBtn.textContent = compactMode ? '圖鑑' : '查看圖鑑';
                        bookBtn.addEventListener('click', () => {
                              this.hide();
                              this._onOpenEncyclopedia?.(mon.name, mapKey);
                        });
                        actions.appendChild(bookBtn);

                        const fusionBtn = document.createElement('button');
                        fusionBtn.type = 'button';
                        fusionBtn.className = 'wmp-teleport-btn wmp-card-btn rpg-op-btn rpg-op-btn-sm rpg-op-btn-primary';
                        fusionBtn.textContent = compactMode ? '合成' : '查看可合成目標';
                        fusionBtn.disabled = mon.asIngredientCount <= 0;
                        if (mon.asIngredientCount <= 0) fusionBtn.classList.add('wmp-btn-disabled');
                        fusionBtn.addEventListener('click', () => {
                              this.hide();
                              this._onOpenFusionByIngredient?.(mon.name, mapKey);
                        });
                        actions.appendChild(fusionBtn);

                        card.appendChild(actions);
                        list.appendChild(card);
                  }

                  if (monsters.length > monsterRenderLimit) {
                        const more = document.createElement('div');
                        more.className = 'wmp-more-line';
                        more.textContent = `還有 ${monsters.length - monsterRenderLimit} 隻怪物未展開。`;
                        list.appendChild(more);
                  }

                  content.appendChild(list);
            }

            const targetTitle = document.createElement('div');
            targetTitle.className = 'wmp-section-title';
            targetTitle.textContent = `⚗️ 可合成目標（${targets.length}/${targetsAll.length}）`;
            content.appendChild(targetTitle);

            if (targets.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'wmp-detail-empty';
                  empty.textContent = '此地圖暫無合成目標。';
                  content.appendChild(empty);
            } else {
                  const list = document.createElement('div');
                  list.className = 'wmp-result-list';
                  for (const target of targets.slice(0, targetRenderLimit)) {
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
                        bookBtn.className = 'wmp-teleport-btn wmp-card-btn rpg-op-btn rpg-op-btn-sm rpg-op-btn-secondary';
                        bookBtn.textContent = compactMode ? '圖鑑' : '查看圖鑑';
                        bookBtn.addEventListener('click', () => {
                              this.hide();
                              this._onOpenEncyclopedia?.(target.resultName, mapKey);
                        });

                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'wmp-teleport-btn wmp-card-btn rpg-op-btn rpg-op-btn-sm rpg-op-btn-primary';
                        btn.textContent = compactMode ? '配方' : '查看配方';
                        btn.addEventListener('click', () => {
                              this.hide();
                              this._onOpenFusionByTarget?.(target.resultName, mapKey);
                        });

                        const row = document.createElement('div');
                        row.className = 'wmp-card-actions';
                        row.appendChild(bookBtn);
                        row.appendChild(btn);
                        item.appendChild(row);
                        list.appendChild(item);
                  }
                  if (targets.length > targetRenderLimit) {
                        const more = document.createElement('div');
                        more.className = 'wmp-more-line';
                        more.textContent = `還有 ${targets.length - targetRenderLimit} 個目標未展開。`;
                        list.appendChild(more);
                  }
                  content.appendChild(list);
            }

            const footer = document.createElement('div');
            footer.className = 'wmp-detail-footer';
            const teleBtn = document.createElement('button');
            teleBtn.className = 'wmp-teleport-footer-btn rpg-op-btn rpg-op-btn-md rpg-op-btn-primary';
            if (!sceneZoneId) {
                  teleBtn.textContent = '無傳送';
                  teleBtn.disabled = true;
                  teleBtn.classList.add('wmp-btn-disabled');
            } else if (sceneZoneId === this._zoneManager.currentZone.id) {
                  teleBtn.textContent = '所在';
                  teleBtn.disabled = true;
                  teleBtn.classList.add('wmp-btn-disabled');
            } else if (!this._zoneManager.isUnlocked(sceneZoneId)) {
                  teleBtn.textContent = '未解鎖';
                  teleBtn.disabled = true;
                  teleBtn.classList.add('wmp-btn-disabled');
            } else {
                  teleBtn.textContent = summary.teleportMode === 'level' ? '近似傳送' : '⚡ 傳送';
                  teleBtn.addEventListener('click', () => {
                        this.hide();
                        this._zoneManager.travelTo(sceneZoneId);
                  });
            }
            if (compactMode && !teleBtn.disabled) teleBtn.textContent = '傳送';
            footer.appendChild(teleBtn);
            this._detailCol.appendChild(sticky);
            this._detailCol.appendChild(content);
            this._detailCol.appendChild(footer);
      }

      private _filteredMapSummaries(): MapSummary[] {
            const key = this._mapSearchKeyword.trim().toLowerCase();
            return this._mapSummaries.filter(item => {
                  if (key) {
                        const haystacks = [
                              item.name.toLowerCase(),
                              item.baseName.toLowerCase(),
                              this._canonicalMapName(item.name).toLowerCase(),
                              this._canonicalMapName(item.baseName).toLowerCase(),
                        ];
                        if (!haystacks.some((value) => value.includes(key))) return false;
                  }
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
            btn.className = `wmp-quick-chip rpg-chip rpg-chip-filter${active ? ' is-active' : ''}`;
            btn.addEventListener('click', onClick);
            return btn;
      }

      private _teleportModeSuffix(mode: RuntimeZoneMatchMode): string {
            if (mode === 'explicit') return '（顯式映射）';
            if (mode === 'town') return '（城鎮路由）';
            if (mode === 'level') return '（等級近似）';
            if (mode === 'none') return '（未映射）';
            return '';
      }

      private _deriveRegionFromTopology(zone: {
            mobAble?: boolean;
            rules?: { restriction?: number; pkZoneFlag?: number };
      } | undefined): string {
            if (!zone || zone.mobAble === false) return '城鎮/安全區';
            const restriction = Number(zone.rules?.restriction ?? 0);
            const pkZoneFlag = Number(zone.rules?.pkZoneFlag ?? 0);
            if (restriction > 0) return `限制區（R${restriction}）`;
            if (pkZoneFlag > 0) return 'PK 區域';
            return '一般狩獵區';
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
            const topology = worldTopologyRaw as {
                  zones?: Array<{
                        zoneId: number;
                        name: string;
                        mobAble?: boolean;
                        level?: { min?: number; max?: number };
                        rules?: { restriction?: number; pkZoneFlag?: number };
                  }>;
                  gates?: Array<{
                        fromZoneId: number;
                        toZoneId: number;
                  }>;
            };
            const spawnData = worldSpawnRaw as {
                  monsterCatalog?: Array<{ monsterType: number; name: string; race?: number; startBaseLevel?: number; coreRate?: number }>;
                  mobSpawns?: Array<{
                        monsterType: number;
                        slots?: Array<{ zoneId: number }>;
                  }>;
            };
            const fusionData = fusionRuntimeRaw as {
                  recipes?: Array<{
                        mainType: number;
                        subType: number;
                        resultType: number;
                  }>;
            };

            const zones = Array.isArray(topology.zones) ? topology.zones : [];
            const gates = Array.isArray(topology.gates) ? topology.gates : [];
            const monsterCatalog = Array.isArray(spawnData.monsterCatalog) ? spawnData.monsterCatalog : [];
            const mobSpawns = Array.isArray(spawnData.mobSpawns) ? spawnData.mobSpawns : [];
            const fusionRecipes = Array.isArray(fusionData.recipes) ? fusionData.recipes : [];

            const monsterByType = new Map<number, { name: string; race: number; level: number; coreRate: number }>();
            for (const row of monsterCatalog) {
                  const type = Number(row.monsterType ?? 0);
                  if (!Number.isFinite(type) || type <= 0) continue;
                  monsterByType.set(type, {
                        name: this._canonicalName(String(row.name ?? '').trim()),
                        race: Number(row.race ?? 7),
                        level: this._toLevel(row.startBaseLevel, 1),
                        coreRate: Number(row.coreRate ?? 0),
                  });
            }

            const raceToSeries = (race: number): string => {
                  switch (race) {
                        case 0: return '龍系';
                        case 1: return '惡系';
                        case 2: return '獸系';
                        case 3: return '鳥系';
                        case 4: return '昆蟲';
                        case 5: return '植物';
                        case 6: return '金屬';
                        case 7: return '神秘';
                        default: return '神秘';
                  }
            };

            this._ingredientCountByName = new Map<string, number>();
            for (const recipe of fusionRecipes) {
                  const main = monsterByType.get(Number(recipe.mainType ?? 0))?.name ?? '';
                  const sub = monsterByType.get(Number(recipe.subType ?? 0))?.name ?? '';
                  if (main) this._ingredientCountByName.set(main, (this._ingredientCountByName.get(main) ?? 0) + 1);
                  if (sub) this._ingredientCountByName.set(sub, (this._ingredientCountByName.get(sub) ?? 0) + 1);
            }

            const monsterTypeSetByZone = new Map<number, Set<number>>();
            for (const spawn of mobSpawns) {
                  const monType = Number(spawn.monsterType ?? 0);
                  if (!Number.isFinite(monType) || monType <= 0) continue;
                  const slots = Array.isArray(spawn.slots) ? spawn.slots : [];
                  for (const slot of slots) {
                        const zoneId = Number(slot.zoneId ?? 0);
                        if (!Number.isFinite(zoneId) || zoneId <= 0) continue;
                        let set = monsterTypeSetByZone.get(zoneId);
                        if (!set) {
                              set = new Set<number>();
                              monsterTypeSetByZone.set(zoneId, set);
                        }
                        set.add(monType);
                  }
            }

            const monsterByMap = new Map<string, Map<string, MapMonsterInfo>>();
            for (const zone of zones) {
                  const zoneId = Number(zone.zoneId ?? 0);
                  if (!Number.isFinite(zoneId) || zoneId <= 0) continue;
                  const mapEntry = getRuntimeMapByZoneId(zoneId);
                  if (!mapEntry) continue;
                  const mapKey = mapEntry.mapKey;

                  const monsterTypes = Array.from(monsterTypeSetByZone.get(zoneId) ?? []);
                  if (monsterTypes.length === 0) continue;

                  let entries = monsterByMap.get(mapKey);
                  if (!entries) {
                        entries = new Map<string, MapMonsterInfo>();
                        monsterByMap.set(mapKey, entries);
                  }

                  for (const type of monsterTypes) {
                        const mon = monsterByType.get(type);
                        if (!mon || !mon.name) continue;

                        const level = this._toLevel(mon.level, this._findListPetLevel(mon.name) ?? 1);
                        const dropEgg = mon.coreRate > 0;
                        const asIngredientCount = this._ingredientCountByName.get(mon.name) ?? 0;
                        const fusible = asIngredientCount > 0;

                        const prev = entries.get(mon.name);
                        if (!prev) {
                              entries.set(mon.name, {
                                    name: mon.name,
                                    level,
                                    dropEgg,
                                    series: raceToSeries(mon.race),
                                    fusible,
                                    asIngredientCount,
                              });
                        } else {
                              prev.level = Math.max(prev.level, level);
                              prev.dropEgg = this._mergeDropEgg(prev.dropEgg, dropEgg);
                              prev.asIngredientCount = Math.max(prev.asIngredientCount, asIngredientCount);
                              if (prev.fusible === null) prev.fusible = fusible;
                        }
                  }
            }

            const targetsByMapRaw = new Map<string, Map<string, MapFusionTargetInfo>>();
            for (const zone of zones) {
                  const zoneId = Number(zone.zoneId ?? 0);
                  if (!Number.isFinite(zoneId) || zoneId <= 0) continue;
                  const mapEntry = getRuntimeMapByZoneId(zoneId);
                  if (!mapEntry) continue;
                  const mapKey = mapEntry.mapKey;
                  const ingredients = monsterTypeSetByZone.get(zoneId);
                  if (!ingredients || ingredients.size === 0) continue;

                  let mapTargets = targetsByMapRaw.get(mapKey);
                  if (!mapTargets) {
                        mapTargets = new Map<string, MapFusionTargetInfo>();
                        targetsByMapRaw.set(mapKey, mapTargets);
                  }

                  for (const recipe of fusionRecipes) {
                        const mainType = Number(recipe.mainType ?? 0);
                        const subType = Number(recipe.subType ?? 0);
                        const resultType = Number(recipe.resultType ?? 0);
                        if (!ingredients.has(mainType) || !ingredients.has(subType)) continue;

                        const main = monsterByType.get(mainType);
                        const sub = monsterByType.get(subType);
                        const result = monsterByType.get(resultType);
                        if (!main || !sub || !result) continue;

                        const key = `${result.name}|${main.name}|${sub.name}`;
                        if (mapTargets.has(key)) continue;
                        mapTargets.set(key, {
                              resultName: result.name,
                              resultLevel: this._toLevel(result.level, this._findListPetLevel(result.name) ?? 1),
                              resultDropEgg: result.coreRate > 0,
                              mainName: main.name,
                              subName: sub.name,
                        });
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

            const zonesByMapKey = new Map<string, {
                  zoneId: number;
                  name: string;
                  displayName: string;
                  mobAble: boolean;
                  levelMin: number;
                  levelMax: number;
                  restriction: number;
                  pkZoneFlag: number;
                  sceneZoneId: string | null;
            }>();
            const mapKeys = new Set<string>();
            for (const zone of zones) {
                  const runtimeZoneId = Number(zone.zoneId ?? 0);
                  const mapEntry = getRuntimeMapByZoneId(runtimeZoneId);
                  if (!mapEntry) continue;
                  zonesByMapKey.set(mapEntry.mapKey, {
                        zoneId: mapEntry.runtimeZoneId,
                        name: mapEntry.name,
                        displayName: mapEntry.displayName,
                        mobAble: mapEntry.mobAble,
                        levelMin: mapEntry.minLevel,
                        levelMax: mapEntry.maxLevel,
                        restriction: mapEntry.restriction,
                        pkZoneFlag: mapEntry.pkZoneFlag,
                        sceneZoneId: mapEntry.sceneZoneId,
                  });
                  mapKeys.add(mapEntry.mapKey);
            }
            for (const mapKey of this._monstersByMap.keys()) mapKeys.add(mapKey);
            for (const mapKey of this._targetsByMap.keys()) mapKeys.add(mapKey);

            this._mapSummaries = Array.from(mapKeys).map((mapKey) => {
                  const mons = this._monstersByMap.get(mapKey) ?? [];
                  const targets = this._targetsByMap.get(mapKey) ?? [];
                  const zone = zonesByMapKey.get(mapKey);

                  const minLevel = zone
                        ? Math.max(1, zone.levelMin)
                        : (mons.length > 0 ? Math.min(...mons.map(item => item.level)) : 1);
                  const maxLevel = zone
                        ? Math.max(minLevel, zone.levelMax)
                        : (mons.length > 0 ? Math.max(...mons.map(item => item.level)) : minLevel);

                  const zoneMatch = zone
                        ? matchRuntimeZoneToSceneZone({
                              runtimeZoneId: zone.zoneId,
                              zoneName: zone.name,
                              minLevel,
                              maxLevel,
                              mobAble: zone.mobAble,
                              restriction: zone.restriction,
                              pkZoneFlag: zone.pkZoneFlag,
                        })
                        : { zoneId: null, mode: 'none' as RuntimeZoneMatchMode };
                  const region = this._deriveRegionFromTopology(zone ? {
                        mobAble: zone.mobAble,
                        rules: { restriction: zone.restriction, pkZoneFlag: zone.pkZoneFlag },
                  } : undefined);
                  const neighbors = listRuntimeMapNeighbors(mapKey)
                        .filter((neighborKey) => zonesByMapKey.has(neighborKey))
                        .sort((a, b) => {
                              const aName = zonesByMapKey.get(a)?.displayName ?? a;
                              const bName = zonesByMapKey.get(b)?.displayName ?? b;
                              return aName.localeCompare(bName, 'zh-Hant');
                        });

                  return {
                        mapKey,
                        name: zone?.displayName ?? mapKey,
                        baseName: zone?.name ?? mapKey,
                        region,
                        monsterCount: mons.length,
                        targetCount: targets.length,
                        minLevel,
                        maxLevel,
                        runtimeZoneId: zone?.zoneId ?? null,
                        teleportSceneZoneId: zoneMatch.zoneId,
                        teleportMode: zoneMatch.mode,
                        neighborMapKeys: neighbors,
                  };
            }).sort((a, b) => {
                  if (a.minLevel !== b.minLevel) return a.minLevel - b.minLevel;
                  return a.name.localeCompare(b.name, 'zh-Hant');
            });
      }

      private _getCurrentMapKey(): string | null {
            const currentSceneZoneId = this._zoneManager.currentZone.id;
            const candidates = this._mapSummaries.filter((item) => item.teleportSceneZoneId === currentSceneZoneId);
            if (candidates.length <= 0) return null;
            const selected = this._selectedMapKey
                  ? candidates.find((item) => item.mapKey === this._selectedMapKey)
                  : null;
            if (selected) return selected.mapKey;
            candidates.sort((a, b) => a.minLevel - b.minLevel);
            return candidates[0]?.mapKey ?? null;
      }

      private _findRoute(fromMapKey: string, toMapKey: string): string[] {
            if (fromMapKey === toMapKey) return [fromMapKey];
            const graph = new Map<string, Set<string>>();
            const ensureNode = (mapKey: string): Set<string> => {
                  let row = graph.get(mapKey);
                  if (!row) {
                        row = new Set<string>();
                        graph.set(mapKey, row);
                  }
                  return row;
            };

            for (const map of this._mapSummaries) {
                  const row = ensureNode(map.mapKey);
                  for (const next of map.neighborMapKeys) {
                        row.add(next);
                        ensureNode(next).add(map.mapKey);
                  }
            }

            if (!graph.has(fromMapKey) || !graph.has(toMapKey)) return [];
            const queue: string[] = [fromMapKey];
            const prev = new Map<string, string | null>([[fromMapKey, null]]);

            while (queue.length > 0) {
                  const now = queue.shift()!;
                  if (now === toMapKey) break;
                  for (const next of graph.get(now) ?? []) {
                        if (prev.has(next)) continue;
                        prev.set(next, now);
                        queue.push(next);
                  }
            }

            if (!prev.has(toMapKey)) return [];
            const path: string[] = [];
            let cursor: string | null = toMapKey;
            while (cursor) {
                  path.push(cursor);
                  cursor = prev.get(cursor) ?? null;
            }
            path.reverse();
            return path;
      }

      private _refreshTrackedRouteFromCurrent(): void {
            if (!this._trackedTargetMapKey) {
                  this._trackedRouteNodes.clear();
                  return;
            }
            const mappedTarget = this._findMapKey(this._trackedTargetMapKey);
            if (!mappedTarget) {
                  this._trackedTargetMapKey = null;
                  this._trackedRouteNodes.clear();
                  return;
            }
            this._trackedTargetMapKey = mappedTarget;
            const currentMapKey = this._getCurrentMapKey();
            if (!currentMapKey) {
                  this._trackedRouteNodes = new Set([mappedTarget]);
                  return;
            }
            const route = this._findRoute(currentMapKey, mappedTarget);
            this._trackedRouteNodes = new Set(route.length > 0 ? route : [mappedTarget]);
      }

      private _setTrackedTarget(targetMapKey: string | null): void {
            this._trackedTargetMapKey = targetMapKey;
            this._refreshTrackedRouteFromCurrent();
            try {
                  if (targetMapKey) localStorage.setItem(this._trackStorageKey, targetMapKey);
                  else localStorage.removeItem(this._trackStorageKey);
            } catch {
                  // ignore storage write failures
            }
      }

      private _loadTrackedTarget(): string | null {
            try {
                  const saved = localStorage.getItem(this._trackStorageKey);
                  const normalized = this._findMapKey(saved ?? '');
                  return normalized ?? null;
            } catch {
                  return null;
            }
      }

      private _findMapKey(input: string): string | null {
            const resolved = resolveRuntimeMapEntry(input, this._zoneManager.currentZone.id);
            if (resolved) return resolved.mapKey;

            const key = this._canonicalMapName(input);
            if (!key) return null;
            const direct = this._mapSummaries.find(item => this._canonicalMapName(item.name) === key || this._canonicalMapName(item.baseName) === key);
            if (direct) return direct.mapKey;
            const lowered = key.toLowerCase();
            const includes = this._mapSummaries.find(item => {
                  const targets = [
                        this._canonicalMapName(item.name).toLowerCase(),
                        this._canonicalMapName(item.baseName).toLowerCase(),
                  ];
                  return targets.some((target) => target.includes(lowered) || lowered.includes(target));
            });
            return includes?.mapKey ?? null;
      }

      private _getMapNameByKey(mapKey: string): string | null {
            return this._mapSummaries.find((item) => item.mapKey === mapKey)?.name ?? null;
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
            return canonicalRuntimeMapName(raw);
      }

      private _normalizeNameKey(raw: string): string {
            return normalizeFusionNameKey(raw);
      }

      private _toLevel(raw: unknown, fallback = 1): number {
            if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
            return Math.max(1, Math.floor(fallback));
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
            if (!this._selectedMapKey && this._mapSummaries.length > 0) this._selectedMapKey = this._mapSummaries[0].mapKey;
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

