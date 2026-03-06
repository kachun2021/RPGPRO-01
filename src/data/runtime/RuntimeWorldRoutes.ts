import worldTopologyRaw from './world.topology.json';
import { matchRuntimeZoneToSceneZone } from './RuntimeZoneBridge';

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

interface SceneRouteCache {
      adjacency: Map<string, Set<string>>;
      labelsBySceneZone: Map<string, Map<string, string>>;
      primaryRuntimeNameBySceneZone: Map<string, string>;
}

let CACHE: SceneRouteCache | null = null;

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const n = Number(value);
      if (!Number.isFinite(n)) return fallback;
      return Math.floor(n);
}

function ensureCache(): SceneRouteCache {
      if (CACHE) return CACHE;

      const topology = worldTopologyRaw as {
            zones?: RuntimeZoneRow[];
            gates?: RuntimeGateRow[];
      };
      const zones = Array.isArray(topology.zones) ? topology.zones : [];
      const gates = Array.isArray(topology.gates) ? topology.gates : [];

      const runtimeToScene = new Map<number, string>();
      const runtimeNameById = new Map<number, string>();
      const primaryRuntimeNameBySceneZone = new Map<string, string>();

      for (const zone of zones) {
            const zoneId = toInt(zone.zoneId, 0);
            if (zoneId <= 0) continue;
            const zoneName = String(zone.name ?? '').trim();
            const resolvedName = zoneName || `地區 #${zoneId}`;
            runtimeNameById.set(zoneId, resolvedName);
            const minLevel = Math.max(1, toInt(zone.level?.min, 1));
            const maxLevel = Math.max(minLevel, toInt(zone.level?.max, minLevel));
            const match = matchRuntimeZoneToSceneZone({
                  runtimeZoneId: zoneId,
                  zoneName,
                  minLevel,
                  maxLevel,
                  mobAble: zone.mobAble !== false,
                  restriction: toInt(zone.rules?.restriction, 0),
                  pkZoneFlag: toInt(zone.rules?.pkZoneFlag, 0),
            });
            if (!match.zoneId) continue;
            runtimeToScene.set(zoneId, match.zoneId);
            if (!primaryRuntimeNameBySceneZone.has(match.zoneId)) {
                  primaryRuntimeNameBySceneZone.set(match.zoneId, resolvedName);
            }
      }

      const adjacency = new Map<string, Set<string>>();
      const labelsBySceneZone = new Map<string, Map<string, string>>();

      const ensureEdge = (from: string, to: string, label: string): void => {
            let next = adjacency.get(from);
            if (!next) {
                  next = new Set<string>();
                  adjacency.set(from, next);
            }
            next.add(to);

            let labelMap = labelsBySceneZone.get(from);
            if (!labelMap) {
                  labelMap = new Map<string, string>();
                  labelsBySceneZone.set(from, labelMap);
            }
            if (!labelMap.has(to)) labelMap.set(to, label);
      };

      for (const gate of gates) {
            const fromRuntime = toInt(gate.fromZoneId, 0);
            const toRuntime = toInt(gate.toZoneId, 0);
            if (fromRuntime <= 0 || toRuntime <= 0) continue;
            const fromScene = runtimeToScene.get(fromRuntime);
            const toScene = runtimeToScene.get(toRuntime);
            if (!fromScene || !toScene || fromScene === toScene) continue;
            const toRuntimeName = runtimeNameById.get(toRuntime) ?? `地區 #${toRuntime}`;
            ensureEdge(fromScene, toScene, `前往 ${toRuntimeName}`);
      }

      CACHE = { adjacency, labelsBySceneZone, primaryRuntimeNameBySceneZone };
      return CACHE;
}

export function getSceneZoneNeighbors(sceneZoneId: string): string[] {
      return Array.from(ensureCache().adjacency.get(sceneZoneId) ?? []);
}

export function isSceneZonesConnected(fromSceneZoneId: string, toSceneZoneId: string): boolean {
      const next = ensureCache().adjacency.get(fromSceneZoneId);
      return !!next && next.has(toSceneZoneId);
}

export function getSceneGateLabels(
      sceneZoneId: string,
): Array<{ targetZoneId: string; label: string }> {
      const labels = ensureCache().labelsBySceneZone.get(sceneZoneId);
      if (!labels) return [];
      return Array.from(labels.entries()).map(([targetZoneId, label]) => ({
            targetZoneId,
            label,
      }));
}

export function getSceneZonePrimaryRuntimeName(sceneZoneId: string): string | null {
      return ensureCache().primaryRuntimeNameBySceneZone.get(sceneZoneId) ?? null;
}
