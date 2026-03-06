import worldTopologyRaw from '../data/runtime/world.topology.json';
import { matchRuntimeZoneToSceneZone } from '../data/runtime/RuntimeZoneBridge';
import { getSceneZonePrimaryRuntimeName } from '../data/runtime/RuntimeWorldRoutes';
import { SCENE_ZONE_PROFILES } from './SceneZoneProfiles';

export type RuntimeBiomeType =
      | 'grass'
      | 'forest'
      | 'desert'
      | 'snow'
      | 'cave'
      | 'beach'
      | 'lava'
      | 'town';

export interface RuntimeSceneZoneDef {
      id: string;
      name: string;
      nameCN: string;
      biome: RuntimeBiomeType;
      levelMin: number;
      levelMax: number;
      isTown: boolean;
      spawnPoint: { x: number; y: number; z: number };
      runtimeZoneIds: number[];
}

interface RuntimeZoneRow {
      zoneId?: number;
      name?: string;
      mobAble?: boolean;
      level?: { min?: number; max?: number };
      rules?: { restriction?: number; pkZoneFlag?: number };
}

interface SceneZoneAggregate {
      sceneZoneId: string;
      runtimeZoneIds: Set<number>;
      runtimeNames: Map<string, number>;
      levelMin: number;
      levelMax: number;
      total: number;
      townVotes: number;
      pkVotes: number;
      restrictionMax: number;
}

interface SceneZoneCache {
      list: RuntimeSceneZoneDef[];
      byId: Map<string, RuntimeSceneZoneDef>;
}

const DEFAULT_SCENE_ZONE_ID = 'starter_meadow';
const DEFAULT_SPAWN_POINT = { x: 0, y: 0, z: 0 };

let CACHE: SceneZoneCache | null = null;

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

function sanitizeRuntimeMapName(raw: string, runtimeZoneId: number): string {
      const text = String(raw ?? '').trim();
      if (!text) return `地區 #${runtimeZoneId}`;
      return text.replace(/\s+/g, ' ');
}

function titleCaseFromSceneZoneId(sceneZoneId: string): string {
      const parts = String(sceneZoneId ?? '')
            .trim()
            .split('_')
            .filter(Boolean);
      if (parts.length <= 0) return 'Unknown Zone';
      return parts
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
}

function pickRuntimeName(agg: SceneZoneAggregate): string {
      const primary = getSceneZonePrimaryRuntimeName(agg.sceneZoneId);
      if (primary && primary.trim()) return sanitizeRuntimeMapName(primary, agg.runtimeZoneIds.values().next().value ?? 0);

      let bestName = '';
      let bestCount = -1;
      for (const [name, count] of agg.runtimeNames.entries()) {
            if (count > bestCount) {
                  bestCount = count;
                  bestName = name;
            }
      }
      if (bestName) return bestName;
      return `地區 ${agg.sceneZoneId}`;
}

function inferBiome(agg: SceneZoneAggregate): RuntimeBiomeType {
      const avg = (agg.levelMin + agg.levelMax) / 2;
      const isTown = agg.townVotes > agg.total / 2;
      if (isTown) return 'town';
      if (agg.pkVotes > 0 && avg >= 80) return 'lava';
      if (agg.restrictionMax >= 4 && avg >= 60) return 'cave';
      if (avg <= 20) return 'grass';
      if (avg <= 45) return 'forest';
      if (avg <= 70) return 'desert';
      if (avg <= 100) return 'beach';
      if (avg <= 145) return 'cave';
      if (avg <= 190) return 'snow';
      return 'lava';
}

function createFallbackSceneZone(sceneZoneId: string): RuntimeSceneZoneDef {
      return {
            id: sceneZoneId,
            name: titleCaseFromSceneZoneId(sceneZoneId),
            nameCN: `地區 ${sceneZoneId}`,
            biome: sceneZoneId === 'main_city' ? 'town' : 'grass',
            levelMin: 1,
            levelMax: 20,
            isTown: sceneZoneId === 'main_city',
            spawnPoint: { ...DEFAULT_SPAWN_POINT },
            runtimeZoneIds: [],
      };
}

function ensureCache(): SceneZoneCache {
      if (CACHE) return CACHE;

      const payload = worldTopologyRaw as { zones?: RuntimeZoneRow[] };
      const zones = Array.isArray(payload.zones) ? payload.zones : [];
      const aggregateBySceneZone = new Map<string, SceneZoneAggregate>();
      const profileBySceneZone = new Map(SCENE_ZONE_PROFILES.map((profile) => [profile.id, profile] as const));

      for (const zone of zones) {
            const runtimeZoneId = toInt(zone.zoneId, 0);
            if (runtimeZoneId <= 0) continue;

            const minLevel = Math.max(1, toInt(zone.level?.min, 1));
            const maxLevel = Math.max(minLevel, toInt(zone.level?.max, minLevel));
            const restriction = Math.max(0, toInt(zone.rules?.restriction, 0));
            const pkZoneFlag = Math.max(0, toInt(zone.rules?.pkZoneFlag, 0));
            const mobAble = zone.mobAble !== false;

            const match = matchRuntimeZoneToSceneZone({
                  runtimeZoneId,
                  zoneName: String(zone.name ?? ''),
                  minLevel,
                  maxLevel,
                  mobAble,
                  restriction,
                  pkZoneFlag,
            });
            if (!match.zoneId) continue;

            let agg = aggregateBySceneZone.get(match.zoneId);
            if (!agg) {
                  agg = {
                        sceneZoneId: match.zoneId,
                        runtimeZoneIds: new Set<number>(),
                        runtimeNames: new Map<string, number>(),
                        levelMin: minLevel,
                        levelMax: maxLevel,
                        total: 0,
                        townVotes: 0,
                        pkVotes: 0,
                        restrictionMax: 0,
                  };
                  aggregateBySceneZone.set(match.zoneId, agg);
            }

            agg.runtimeZoneIds.add(runtimeZoneId);
            agg.levelMin = Math.min(agg.levelMin, minLevel);
            agg.levelMax = Math.max(agg.levelMax, maxLevel);
            agg.total += 1;
            if (!mobAble) agg.townVotes += 1;
            if (pkZoneFlag > 0) agg.pkVotes += 1;
            agg.restrictionMax = Math.max(agg.restrictionMax, restriction);

            const runtimeName = sanitizeRuntimeMapName(String(zone.name ?? ''), runtimeZoneId);
            agg.runtimeNames.set(runtimeName, (agg.runtimeNames.get(runtimeName) ?? 0) + 1);
      }

      const list = Array.from(aggregateBySceneZone.values()).map((agg) => {
            const profile = profileBySceneZone.get(agg.sceneZoneId);
            const isTown = agg.townVotes > agg.total / 2;
            return {
                  id: agg.sceneZoneId,
                  name: profile?.name ?? titleCaseFromSceneZoneId(agg.sceneZoneId),
                  nameCN: profile?.nameCN ?? pickRuntimeName(agg),
                  biome: profile?.biome ?? inferBiome(agg),
                  levelMin: profile?.levelMin ?? agg.levelMin,
                  levelMax: profile?.levelMax ?? agg.levelMax,
                  isTown: profile?.isTown ?? isTown,
                  spawnPoint: { ...DEFAULT_SPAWN_POINT },
                  runtimeZoneIds: Array.from(agg.runtimeZoneIds).sort((a, b) => a - b),
            } satisfies RuntimeSceneZoneDef;
      });

      const byId = new Map<string, RuntimeSceneZoneDef>();
      for (const row of list) byId.set(row.id, row);

      for (const profile of SCENE_ZONE_PROFILES) {
            if (byId.has(profile.id)) continue;
            const row: RuntimeSceneZoneDef = {
                  id: profile.id,
                  name: profile.name,
                  nameCN: profile.nameCN,
                  biome: profile.biome,
                  levelMin: profile.levelMin,
                  levelMax: profile.levelMax,
                  isTown: profile.isTown,
                  spawnPoint: { ...DEFAULT_SPAWN_POINT },
                  runtimeZoneIds: [],
            };
            list.push(row);
            byId.set(row.id, row);
      }

      if (!byId.has(DEFAULT_SCENE_ZONE_ID)) {
            const fallback = createFallbackSceneZone(DEFAULT_SCENE_ZONE_ID);
            list.unshift(fallback);
            byId.set(fallback.id, fallback);
      }

      list.sort((a, b) => {
            if (a.levelMin !== b.levelMin) return a.levelMin - b.levelMin;
            return a.id.localeCompare(b.id);
      });

      CACHE = { list, byId };
      return CACHE;
}

export function listRuntimeSceneZones(): RuntimeSceneZoneDef[] {
      return ensureCache().list.slice();
}

export function getRuntimeSceneZone(sceneZoneId: string): RuntimeSceneZoneDef | undefined {
      return ensureCache().byId.get(sceneZoneId);
}

export function getRuntimeSceneZoneOrFallback(sceneZoneId: string): RuntimeSceneZoneDef {
      return getRuntimeSceneZone(sceneZoneId) ?? createFallbackSceneZone(sceneZoneId);
}

export function getRuntimeSceneZoneName(sceneZoneId: string): string {
      return getRuntimeSceneZone(sceneZoneId)?.nameCN ?? `地區 ${sceneZoneId}`;
}

export function getDefaultRuntimeSceneZoneId(): string {
      const cache = ensureCache();
      if (cache.byId.has(DEFAULT_SCENE_ZONE_ID)) return DEFAULT_SCENE_ZONE_ID;
      return cache.list[0]?.id ?? DEFAULT_SCENE_ZONE_ID;
}

export function __resetRuntimeSceneZoneCacheForTests(): void {
      CACHE = null;
}
