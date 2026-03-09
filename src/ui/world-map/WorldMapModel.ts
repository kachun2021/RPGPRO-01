import worldTopologyRaw from '../../data/runtime/world.topology.json';
import worldSpawnRaw from '../../data/runtime/world.spawn.json';
import fusionRuntimeRaw from '../../data/runtime/fusion.runtime.json';
import listPetsRaw from '../../data/fusion/list_pets.json';
import type { ListPetPayload, ListPetRow } from '../../data/fusion/types';
import { canonicalPetName, normalizeFusionNameKey } from '../../data/fusion/FusionNameUtils';
import { getRuntimeMapByZoneId, listRuntimeMapNeighbors } from '../../data/runtime/RuntimeMapCatalog';
import { resolveSceneZoneForRuntimeZone } from '../../data/runtime/RuntimeSceneRouteApi';
import type { RuntimeZoneMatchMode } from '../../data/runtime/RuntimeZoneBridge';

export interface MapMonsterInfo {
      name: string;
      level: number;
      dropEgg: boolean | null;
      series: string | null;
      fusible: boolean | null;
      asIngredientCount: number;
}

export interface MapFusionTargetInfo {
      resultName: string;
      resultLevel: number;
      resultDropEgg: boolean | null;
      mainName: string;
      subName: string;
}

export interface MapSummary {
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

export type MapLevelBand = 'all' | '1-30' | '31-60' | '61-90' | '91+';

export interface WorldMapRuntimeData {
      mapSummaries: MapSummary[];
      monstersByMap: Map<string, MapMonsterInfo[]>;
      targetsByMap: Map<string, MapFusionTargetInfo[]>;
      listPetsByName: Map<string, ListPetRow>;
      listPetsByKey: Map<string, ListPetRow>;
      ingredientCountByName: Map<string, number>;
}

function canonicalName(raw: string): string {
      return canonicalPetName(raw);
}

function normalizeNameKey(raw: string): string {
      return normalizeFusionNameKey(raw);
}

function canonicalMapName(raw: string): string {
      return canonicalPetName(raw);
}

function toLevel(raw: unknown, fallback = 1): number {
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) return fallback;
      return Math.max(1, Math.floor(numeric));
}

function mergeDropEgg(a: boolean | null, b: boolean | null): boolean | null {
      if (a === true || b === true) return true;
      if (a === false || b === false) return false;
      return null;
}

function deriveRegionFromTopology(zone: {
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

function buildListPetIndexes(): {
      listPetsByName: Map<string, ListPetRow>;
      listPetsByKey: Map<string, ListPetRow>;
} {
      const payload = listPetsRaw as ListPetPayload;
      const rows = Array.isArray(payload.pets) ? payload.pets : [];
      const listPetsByName = new Map<string, ListPetRow>();
      const listPetsByKey = new Map<string, ListPetRow>();
      for (const row of rows) {
            const name = canonicalName(String(row?.name ?? '').trim());
            if (!name) continue;
            listPetsByName.set(name, row);
            listPetsByKey.set(normalizeNameKey(name), row);
      }
      return { listPetsByName, listPetsByKey };
}

function findListPetLevel(
      name: string,
      listPetsByName: Map<string, ListPetRow>,
      listPetsByKey: Map<string, ListPetRow>,
): number | null {
      const clean = canonicalName(name.trim());
      if (!clean) return null;
      const direct = listPetsByName.get(clean) ?? listPetsByKey.get(normalizeNameKey(clean));
      return typeof direct?.level === 'number' && Number.isFinite(direct.level) ? direct.level : null;
}

export function buildWorldMapRuntimeData(): WorldMapRuntimeData {
      const topology = worldTopologyRaw as {
            zones?: Array<{
                  zoneId: number;
                  name: string;
                  mobAble?: boolean;
                  level?: { min?: number; max?: number };
                  rules?: { restriction?: number; pkZoneFlag?: number };
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
      const monsterCatalog = Array.isArray(spawnData.monsterCatalog) ? spawnData.monsterCatalog : [];
      const mobSpawns = Array.isArray(spawnData.mobSpawns) ? spawnData.mobSpawns : [];
      const fusionRecipes = Array.isArray(fusionData.recipes) ? fusionData.recipes : [];
      const { listPetsByName, listPetsByKey } = buildListPetIndexes();

      const monsterByType = new Map<number, { name: string; race: number; level: number; coreRate: number }>();
      for (const row of monsterCatalog) {
            const type = Number(row.monsterType ?? 0);
            if (!Number.isFinite(type) || type <= 0) continue;
            monsterByType.set(type, {
                  name: canonicalName(String(row.name ?? '').trim()),
                  race: Number(row.race ?? 7),
                  level: toLevel(row.startBaseLevel, 1),
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

      const ingredientCountByName = new Map<string, number>();
      for (const recipe of fusionRecipes) {
            const main = monsterByType.get(Number(recipe.mainType ?? 0))?.name ?? '';
            const sub = monsterByType.get(Number(recipe.subType ?? 0))?.name ?? '';
            if (main) ingredientCountByName.set(main, (ingredientCountByName.get(main) ?? 0) + 1);
            if (sub) ingredientCountByName.set(sub, (ingredientCountByName.get(sub) ?? 0) + 1);
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

      const monstersByMapRaw = new Map<string, Map<string, MapMonsterInfo>>();
      for (const zone of zones) {
            const zoneId = Number(zone.zoneId ?? 0);
            if (!Number.isFinite(zoneId) || zoneId <= 0) continue;
            const mapEntry = getRuntimeMapByZoneId(zoneId);
            if (!mapEntry) continue;
            const mapKey = mapEntry.mapKey;
            const monsterTypes = Array.from(monsterTypeSetByZone.get(zoneId) ?? []);
            if (monsterTypes.length === 0) continue;

            let entries = monstersByMapRaw.get(mapKey);
            if (!entries) {
                  entries = new Map<string, MapMonsterInfo>();
                  monstersByMapRaw.set(mapKey, entries);
            }

            for (const type of monsterTypes) {
                  const mon = monsterByType.get(type);
                  if (!mon || !mon.name) continue;

                  const level = toLevel(mon.level, findListPetLevel(mon.name, listPetsByName, listPetsByKey) ?? 1);
                  const dropEgg = mon.coreRate > 0;
                  const asIngredientCount = ingredientCountByName.get(mon.name) ?? 0;
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
                        prev.dropEgg = mergeDropEgg(prev.dropEgg, dropEgg);
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
                        resultLevel: toLevel(result.level, findListPetLevel(result.name, listPetsByName, listPetsByKey) ?? 1),
                        resultDropEgg: result.coreRate > 0,
                        mainName: main.name,
                        subName: sub.name,
                  });
            }
      }

      const monstersByMap = new Map<string, MapMonsterInfo[]>();
      for (const [mapKey, entries] of monstersByMapRaw) {
            const list = Array.from(entries.values()).sort((a, b) => {
                  if (a.level !== b.level) return a.level - b.level;
                  return a.name.localeCompare(b.name, 'zh-Hant');
            });
            monstersByMap.set(mapKey, list);
      }

      const targetsByMap = new Map<string, MapFusionTargetInfo[]>();
      for (const [mapKey, entries] of targetsByMapRaw) {
            const list = Array.from(entries.values()).sort((a, b) => {
                  if (a.resultLevel !== b.resultLevel) return a.resultLevel - b.resultLevel;
                  return a.resultName.localeCompare(b.resultName, 'zh-Hant');
            });
            targetsByMap.set(mapKey, list);
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
            });
            mapKeys.add(mapEntry.mapKey);
      }
      for (const mapKey of monstersByMap.keys()) mapKeys.add(mapKey);
      for (const mapKey of targetsByMap.keys()) mapKeys.add(mapKey);

      const mapSummaries = Array.from(mapKeys).map((mapKey) => {
            const mons = monstersByMap.get(mapKey) ?? [];
            const targets = targetsByMap.get(mapKey) ?? [];
            const zone = zonesByMapKey.get(mapKey);

            const minLevel = zone
                  ? Math.max(1, zone.levelMin)
                  : (mons.length > 0 ? Math.min(...mons.map((item) => item.level)) : 1);
            const maxLevel = zone
                  ? Math.max(minLevel, zone.levelMax)
                  : (mons.length > 0 ? Math.max(...mons.map((item) => item.level)) : minLevel);

            const zoneMatch = zone
                  ? resolveSceneZoneForRuntimeZone({
                        runtimeZoneId: zone.zoneId,
                        zoneName: zone.name,
                        minLevel,
                        maxLevel,
                        mobAble: zone.mobAble,
                        restriction: zone.restriction,
                        pkZoneFlag: zone.pkZoneFlag,
                  })
                  : { sceneZoneId: null, mode: 'none' as RuntimeZoneMatchMode };
            const region = deriveRegionFromTopology(zone ? {
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
                  teleportSceneZoneId: zoneMatch.sceneZoneId,
                  teleportMode: zoneMatch.mode,
                  neighborMapKeys: neighbors,
            };
      }).sort((a, b) => {
            if (a.minLevel !== b.minLevel) return a.minLevel - b.minLevel;
            return a.name.localeCompare(b.name, 'zh-Hant');
      });

      return {
            mapSummaries,
            monstersByMap,
            targetsByMap,
            listPetsByName,
            listPetsByKey,
            ingredientCountByName,
      };
}

export function filterWorldMapSummaries(
      mapSummaries: MapSummary[],
      searchKeyword: string,
      regionFilter: string,
      levelBand: MapLevelBand,
): MapSummary[] {
      const key = searchKeyword.trim().toLowerCase();
      return mapSummaries.filter((item) => {
            if (key) {
                  const haystacks = [
                        item.name.toLowerCase(),
                        item.baseName.toLowerCase(),
                        canonicalMapName(item.name).toLowerCase(),
                        canonicalMapName(item.baseName).toLowerCase(),
                  ];
                  if (!haystacks.some((value) => value.includes(key))) return false;
            }
            if (regionFilter !== 'all' && item.region !== regionFilter) return false;
            return passesMapLevelBand(item, levelBand);
      });
}

export function passesMapLevelBand(item: MapSummary, levelBand: MapLevelBand): boolean {
      const avg = (item.minLevel + item.maxLevel) / 2;
      switch (levelBand) {
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

export function findWorldMapRoute(mapSummaries: MapSummary[], fromMapKey: string, toMapKey: string): string[] {
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

      for (const map of mapSummaries) {
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
