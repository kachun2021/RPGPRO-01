import worldTopologyRaw from './world.topology.json';
import { canonicalRuntimeMapName } from './RuntimeZoneBridge';
import { resolveSceneZoneForRuntimeZone } from './RuntimeSceneRouteApi';

interface RuntimeZoneRow {
      zoneId?: number;
      name?: string;
      mobAble?: boolean;
      level?: { min?: number; max?: number };
      rules?: { restriction?: number; pkZoneFlag?: number };
}

interface RuntimeGateRow {
      fromZoneId?: number;
      toZoneId?: number;
}

export interface RuntimeMapEntry {
      mapKey: string;
      runtimeZoneId: number;
      name: string;
      displayName: string;
      canonicalName: string;
      sceneZoneId: string | null;
      mobAble: boolean;
      minLevel: number;
      maxLevel: number;
      restriction: number;
      pkZoneFlag: number;
}

interface RuntimeMapCatalogCache {
      list: RuntimeMapEntry[];
      byKey: Map<string, RuntimeMapEntry>;
      byZoneId: Map<number, RuntimeMapEntry>;
      neighborsByKey: Map<string, string[]>;
      keysByCanonicalName: Map<string, string[]>;
}

let CACHE: RuntimeMapCatalogCache | null = null;

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

export function buildRuntimeMapKey(runtimeZoneId: number): string {
      return `rz:${Math.max(0, Math.floor(runtimeZoneId))}`;
}

export function isRuntimeMapKey(value: string): boolean {
      return /^rz:\d+$/.test(String(value ?? '').trim());
}

function ensureCache(): RuntimeMapCatalogCache {
      if (CACHE) return CACHE;

      const topology = worldTopologyRaw as { zones?: RuntimeZoneRow[]; gates?: RuntimeGateRow[] };
      const zones = Array.isArray(topology.zones) ? topology.zones : [];
      const gates = Array.isArray(topology.gates) ? topology.gates : [];

      const duplicateCountByCanonicalName = new Map<string, number>();
      for (const zone of zones) {
            const canonicalName = canonicalRuntimeMapName(String(zone.name ?? '').trim());
            if (!canonicalName) continue;
            duplicateCountByCanonicalName.set(canonicalName, (duplicateCountByCanonicalName.get(canonicalName) ?? 0) + 1);
      }

      const list: RuntimeMapEntry[] = [];
      const byKey = new Map<string, RuntimeMapEntry>();
      const byZoneId = new Map<number, RuntimeMapEntry>();
      const keysByCanonicalName = new Map<string, string[]>();

      for (const zone of zones) {
            const runtimeZoneId = toInt(zone.zoneId, 0);
            if (runtimeZoneId <= 0) continue;

            const name = String(zone.name ?? '').trim() || `地圖 #${runtimeZoneId}`;
            const canonicalName = canonicalRuntimeMapName(name);
            const duplicateCount = duplicateCountByCanonicalName.get(canonicalName) ?? 0;
            const displayName = duplicateCount > 1 ? `${name} #${runtimeZoneId}` : name;
            const minLevel = Math.max(1, toInt(zone.level?.min, 1));
            const maxLevel = Math.max(minLevel, toInt(zone.level?.max, minLevel));
            const restriction = Math.max(0, toInt(zone.rules?.restriction, 0));
            const pkZoneFlag = Math.max(0, toInt(zone.rules?.pkZoneFlag, 0));
            const mappedScene = resolveSceneZoneForRuntimeZone({
                  runtimeZoneId,
                  zoneName: name,
                  minLevel,
                  maxLevel,
                  mobAble: zone.mobAble !== false,
                  restriction,
                  pkZoneFlag,
            }).sceneZoneId;

            const entry: RuntimeMapEntry = {
                  mapKey: buildRuntimeMapKey(runtimeZoneId),
                  runtimeZoneId,
                  name,
                  displayName,
                  canonicalName,
                  sceneZoneId: mappedScene,
                  mobAble: zone.mobAble !== false,
                  minLevel,
                  maxLevel,
                  restriction,
                  pkZoneFlag,
            };

            list.push(entry);
            byKey.set(entry.mapKey, entry);
            byZoneId.set(runtimeZoneId, entry);
            const keys = keysByCanonicalName.get(canonicalName);
            if (keys) keys.push(entry.mapKey);
            else keysByCanonicalName.set(canonicalName, [entry.mapKey]);
      }

      const neighborsByKey = new Map<string, Set<string>>();
      const ensureNeighborSet = (mapKey: string): Set<string> => {
            let set = neighborsByKey.get(mapKey);
            if (!set) {
                  set = new Set<string>();
                  neighborsByKey.set(mapKey, set);
            }
            return set;
      };

      for (const gate of gates) {
            const fromZoneId = toInt(gate.fromZoneId, 0);
            const toZoneId = toInt(gate.toZoneId, 0);
            if (fromZoneId <= 0 || toZoneId <= 0) continue;
            const fromKey = buildRuntimeMapKey(fromZoneId);
            const toKey = buildRuntimeMapKey(toZoneId);
            if (!byKey.has(fromKey) || !byKey.has(toKey) || fromKey === toKey) continue;
            ensureNeighborSet(fromKey).add(toKey);
      }

      CACHE = {
            list,
            byKey,
            byZoneId,
            neighborsByKey: new Map(
                  Array.from(neighborsByKey.entries()).map(([mapKey, set]) => [mapKey, Array.from(set)]),
            ),
            keysByCanonicalName,
      };
      return CACHE;
}

export function listRuntimeMaps(): RuntimeMapEntry[] {
      return ensureCache().list.map((entry) => ({ ...entry }));
}

export function getRuntimeMapByKey(mapKey: string): RuntimeMapEntry | null {
      const entry = ensureCache().byKey.get(mapKey);
      return entry ? { ...entry } : null;
}

export function getRuntimeMapByZoneId(runtimeZoneId: number): RuntimeMapEntry | null {
      const entry = ensureCache().byZoneId.get(Math.floor(runtimeZoneId));
      return entry ? { ...entry } : null;
}

export function listRuntimeMapNeighbors(mapKey: string): string[] {
      return [...(ensureCache().neighborsByKey.get(mapKey) ?? [])];
}

export function listRuntimeMapsForSceneZone(sceneZoneId: string): RuntimeMapEntry[] {
      return ensureCache().list
            .filter((entry) => entry.sceneZoneId === sceneZoneId)
            .map((entry) => ({ ...entry }));
}

export function resolveRuntimeMapEntry(input: string, preferredSceneZoneId?: string | null): RuntimeMapEntry | null {
      const value = String(input ?? '').trim();
      if (!value) return null;
      if (isRuntimeMapKey(value)) return getRuntimeMapByKey(value);

      const normalized = canonicalRuntimeMapName(value);
      if (!normalized) return null;
      const keys = ensureCache().keysByCanonicalName.get(normalized) ?? [];
      if (keys.length <= 0) return null;

      const entries = keys
            .map((mapKey) => ensureCache().byKey.get(mapKey))
            .filter((entry): entry is RuntimeMapEntry => !!entry);

      if (preferredSceneZoneId) {
            const preferred = entries.find((entry) => entry.sceneZoneId === preferredSceneZoneId);
            if (preferred) return { ...preferred };
      }

      return entries
            .slice()
            .sort((a, b) => {
                  if (a.minLevel !== b.minLevel) return a.minLevel - b.minLevel;
                  return a.runtimeZoneId - b.runtimeZoneId;
            })[0] ?? null;
}
