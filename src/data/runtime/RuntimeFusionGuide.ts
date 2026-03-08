import fusionRuntimeRaw from './fusion.runtime.json';
import worldSpawnRaw from './world.spawn.json';
import { getRuntimeMapByZoneId } from './RuntimeMapCatalog';

export interface RuntimeMapRef {
      mapKey: string;
      runtimeZoneId: number;
      name: string;
      displayName: string;
      sceneZoneId: string | null;
}

export interface RuntimeFusionGuideEntry {
      recipeId: number;
      mainType: number;
      subType: number;
      resultType: number;
      mainName: string;
      subName: string;
      resultName: string;
      mainLevel: number;
      subLevel: number;
      resultLevel: number;
      mainSeries: string | null;
      subSeries: string | null;
      resultSeries: string | null;
      mainDropEgg: boolean | null;
      subDropEgg: boolean | null;
      resultDropEgg: boolean | null;
      mainMaps: string[];
      subMaps: string[];
      resultMaps: string[];
      mainMapKeys: string[];
      subMapKeys: string[];
      resultMapKeys: string[];
      mainMapRefs: RuntimeMapRef[];
      subMapRefs: RuntimeMapRef[];
      resultMapRefs: RuntimeMapRef[];
      mainMapZoneIds: number[];
      subMapZoneIds: number[];
      resultMapZoneIds: number[];
      mainPrimaryMapKey: string | null;
      subPrimaryMapKey: string | null;
      resultPrimaryMapKey: string | null;
      mainPrimaryZoneId: number | null;
      subPrimaryZoneId: number | null;
      resultPrimaryZoneId: number | null;
      mainAdjust: number;
      subAdjust: number;
}

interface FusionRuntimeRecipeRow {
      recipeId: number;
      mainType: number;
      subType: number;
      resultType: number;
      mainGrade?: number;
      subGrade?: number;
      names?: {
            main?: string;
            sub?: string;
            result?: string;
      };
}

interface SpawnCatalogRow {
      monsterType: number;
      name?: string;
      race?: number;
      startBaseLevel?: number;
      coreRate?: number;
}

interface SpawnMobRow {
      monsterType: number;
      slots?: Array<{ zoneId?: number }>;
}

interface RuntimeMonsterMeta {
      name: string;
      level: number;
      series: string | null;
      dropEgg: boolean | null;
      maps: string[];
      mapKeys: string[];
      mapRefs: RuntimeMapRef[];
      mapZoneIds: number[];
}

let CACHE: RuntimeFusionGuideEntry[] | null = null;

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const n = Number(value);
      if (!Number.isFinite(n)) return fallback;
      return Math.floor(n);
}

function raceToSeriesLabel(race: number): string | null {
      switch (race) {
            case 0: return '龍系';
            case 1: return '惡魔系';
            case 2: return '獸系';
            case 3: return '鳥系';
            case 4: return '蟲系';
            case 5: return '植物系';
            case 6: return '金屬系';
            case 7: return '神秘系';
            default: return null;
      }
}

function normalizeMapNames(input: string[]): string[] {
      return Array.from(new Set(input.map(name => String(name ?? '').trim()).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
}

function buildMonsterMetaByType(): Map<number, RuntimeMonsterMeta> {
      const worldSpawn = worldSpawnRaw as {
            monsterCatalog?: SpawnCatalogRow[];
            mobSpawns?: SpawnMobRow[];
      };

      const catalogRows = Array.isArray(worldSpawn.monsterCatalog) ? worldSpawn.monsterCatalog : [];
      const mobRows = Array.isArray(worldSpawn.mobSpawns) ? worldSpawn.mobSpawns : [];

      const metaByType = new Map<number, RuntimeMonsterMeta>();
      for (const row of catalogRows) {
            const type = toInt(row.monsterType, 0);
            if (type <= 0) continue;
            const name = String(row.name ?? '').trim();
            if (!name) continue;
            metaByType.set(type, {
                  name,
                  level: Math.max(1, toInt(row.startBaseLevel, 1)),
                  series: raceToSeriesLabel(toInt(row.race, -1)),
                  dropEgg: toInt(row.coreRate, 0) > 0,
                  maps: [],
                  mapKeys: [],
                  mapRefs: [],
                  mapZoneIds: [],
            });
      }

      for (const row of mobRows) {
            const type = toInt(row.monsterType, 0);
            if (type <= 0) continue;
            const meta = metaByType.get(type);
            if (!meta) continue;
            const slots = Array.isArray(row.slots) ? row.slots : [];
            const mapRefsByKey = new Map<string, RuntimeMapRef>(
                  meta.mapRefs.map((mapRef) => [mapRef.mapKey, mapRef] as const),
            );
            for (const slot of slots) {
                  const zoneId = toInt(slot?.zoneId, 0);
                  if (zoneId <= 0) continue;
                  const mapEntry = getRuntimeMapByZoneId(zoneId);
                  if (!mapEntry) continue;
                  const mapRef: RuntimeMapRef = {
                        mapKey: mapEntry.mapKey,
                        runtimeZoneId: mapEntry.runtimeZoneId,
                        name: mapEntry.name,
                        displayName: mapEntry.displayName,
                        sceneZoneId: mapEntry.sceneZoneId,
                  };
                  mapRefsByKey.set(mapRef.mapKey, mapRef);
                  meta.maps.push(mapRef.displayName);
                  meta.mapKeys.push(mapRef.mapKey);
                  meta.mapZoneIds.push(zoneId);
            }
            meta.mapRefs = Array.from(mapRefsByKey.values());
      }

      for (const meta of metaByType.values()) {
            meta.maps = normalizeMapNames(meta.maps);
            meta.mapKeys = Array.from(new Set(meta.mapKeys.filter(Boolean)))
                  .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
            meta.mapRefs = meta.mapRefs
                  .slice()
                  .sort((a, b) => a.runtimeZoneId - b.runtimeZoneId);
            meta.mapZoneIds = Array.from(new Set(meta.mapZoneIds.filter((id) => Number.isFinite(id) && id > 0)))
                  .sort((a, b) => a - b);
      }

      return metaByType;
}

function buildEntries(): RuntimeFusionGuideEntry[] {
      const fusion = fusionRuntimeRaw as {
            recipes?: FusionRuntimeRecipeRow[];
      };
      const recipes = Array.isArray(fusion.recipes) ? fusion.recipes : [];
      const metaByType = buildMonsterMetaByType();
      const dedupe = new Set<string>();
      const entries: RuntimeFusionGuideEntry[] = [];

      for (const row of recipes) {
            const mainType = toInt(row.mainType, 0);
            const subType = toInt(row.subType, 0);
            const resultType = toInt(row.resultType, 0);
            if (mainType <= 0 || subType <= 0 || resultType <= 0) continue;

            const mainMeta = metaByType.get(mainType);
            const subMeta = metaByType.get(subType);
            const resultMeta = metaByType.get(resultType);

            const mainName = String(row.names?.main ?? mainMeta?.name ?? '').trim();
            const subName = String(row.names?.sub ?? subMeta?.name ?? '').trim();
            const resultName = String(row.names?.result ?? resultMeta?.name ?? '').trim();
            if (!mainName || !subName || !resultName) continue;

            const mainAdjust = toInt(row.mainGrade, 0);
            const subAdjust = toInt(row.subGrade, 0);
            const dedupeKey = `${resultType}|${mainType}|${subType}|${mainAdjust}|${subAdjust}`;
            if (dedupe.has(dedupeKey)) continue;
            dedupe.add(dedupeKey);

            entries.push({
                  recipeId: toInt(row.recipeId, 0),
                  mainType,
                  subType,
                  resultType,
                  mainName,
                  subName,
                  resultName,
                  mainLevel: Math.max(1, toInt(mainMeta?.level, 1)),
                  subLevel: Math.max(1, toInt(subMeta?.level, 1)),
                  resultLevel: Math.max(1, toInt(resultMeta?.level, 1)),
                  mainSeries: mainMeta?.series ?? null,
                  subSeries: subMeta?.series ?? null,
                  resultSeries: resultMeta?.series ?? null,
                  mainDropEgg: mainMeta?.dropEgg ?? null,
                  subDropEgg: subMeta?.dropEgg ?? null,
                  resultDropEgg: resultMeta?.dropEgg ?? null,
                  mainMaps: mainMeta?.maps ?? [],
                  subMaps: subMeta?.maps ?? [],
                  resultMaps: resultMeta?.maps ?? [],
                  mainMapKeys: mainMeta?.mapKeys ?? [],
                  subMapKeys: subMeta?.mapKeys ?? [],
                  resultMapKeys: resultMeta?.mapKeys ?? [],
                  mainMapRefs: mainMeta?.mapRefs ?? [],
                  subMapRefs: subMeta?.mapRefs ?? [],
                  resultMapRefs: resultMeta?.mapRefs ?? [],
                  mainMapZoneIds: mainMeta?.mapZoneIds ?? [],
                  subMapZoneIds: subMeta?.mapZoneIds ?? [],
                  resultMapZoneIds: resultMeta?.mapZoneIds ?? [],
                  mainPrimaryMapKey: mainMeta?.mapKeys?.[0] ?? null,
                  subPrimaryMapKey: subMeta?.mapKeys?.[0] ?? null,
                  resultPrimaryMapKey: resultMeta?.mapKeys?.[0] ?? null,
                  mainPrimaryZoneId: mainMeta?.mapZoneIds?.[0] ?? null,
                  subPrimaryZoneId: subMeta?.mapZoneIds?.[0] ?? null,
                  resultPrimaryZoneId: resultMeta?.mapZoneIds?.[0] ?? null,
                  mainAdjust,
                  subAdjust,
            });
      }

      return entries.sort((a, b) => {
            if (a.resultLevel !== b.resultLevel) return a.resultLevel - b.resultLevel;
            return a.resultName.localeCompare(b.resultName, 'zh-Hant');
      });
}

export function getRuntimeFusionGuideEntries(): RuntimeFusionGuideEntry[] {
      if (!CACHE) CACHE = buildEntries();
      return CACHE.map(entry => ({
            ...entry,
            mainMaps: [...entry.mainMaps],
            subMaps: [...entry.subMaps],
            resultMaps: [...entry.resultMaps],
            mainMapKeys: [...entry.mainMapKeys],
            subMapKeys: [...entry.subMapKeys],
            resultMapKeys: [...entry.resultMapKeys],
            mainMapRefs: entry.mainMapRefs.map((mapRef) => ({ ...mapRef })),
            subMapRefs: entry.subMapRefs.map((mapRef) => ({ ...mapRef })),
            resultMapRefs: entry.resultMapRefs.map((mapRef) => ({ ...mapRef })),
            mainMapZoneIds: [...entry.mainMapZoneIds],
            subMapZoneIds: [...entry.subMapZoneIds],
            resultMapZoneIds: [...entry.resultMapZoneIds],
      }));
}
