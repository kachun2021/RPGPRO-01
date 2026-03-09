import worldTopologyRaw from './world.topology.json';
import { matchRuntimeZoneToSceneZone, type RuntimeZoneMatchMode, type RuntimeZoneRouteInput } from './RuntimeZoneBridge';
import { getExplicitSceneZoneIdForRuntimeZoneId } from './RuntimeZoneSceneMap';
import { SCENE_ZONE_PROFILES, type SceneZoneProfile } from '../../world/SceneZoneProfiles';

interface RuntimeZoneRow {
      zoneId?: number;
      name?: string;
      mobAble?: boolean;
      level?: { min?: number; max?: number };
      rules?: { restriction?: number; pkZoneFlag?: number };
}

export interface RuntimeSceneZoneResolution {
      runtimeZoneId: number | null;
      sceneZoneId: string | null;
      mode: RuntimeZoneMatchMode;
}

const PROFILE_BY_ID = new Map<string, SceneZoneProfile>(SCENE_ZONE_PROFILES.map((profile) => [profile.id, profile]));
let RUNTIME_ZONE_BY_ID: Map<number, RuntimeZoneRow> | null = null;

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

function ensureRuntimeZoneIndex(): Map<number, RuntimeZoneRow> {
      if (RUNTIME_ZONE_BY_ID) return RUNTIME_ZONE_BY_ID;
      const payload = worldTopologyRaw as { zones?: RuntimeZoneRow[] };
      const zones = Array.isArray(payload.zones) ? payload.zones : [];
      RUNTIME_ZONE_BY_ID = new Map<number, RuntimeZoneRow>();
      for (const zone of zones) {
            const runtimeZoneId = toInt(zone.zoneId, 0);
            if (runtimeZoneId <= 0) continue;
            RUNTIME_ZONE_BY_ID.set(runtimeZoneId, zone);
      }
      return RUNTIME_ZONE_BY_ID;
}

export function resolveSceneZoneForRuntimeZone(input: RuntimeZoneRouteInput): RuntimeSceneZoneResolution {
      const runtimeZoneId = toInt(input.runtimeZoneId, 0);
      const explicit = runtimeZoneId > 0 ? getExplicitSceneZoneIdForRuntimeZoneId(runtimeZoneId) : null;
      if (explicit) {
            return {
                  runtimeZoneId: runtimeZoneId > 0 ? runtimeZoneId : null,
                  sceneZoneId: explicit,
                  mode: 'explicit',
            };
      }

      const match = matchRuntimeZoneToSceneZone(input);
      return {
            runtimeZoneId: runtimeZoneId > 0 ? runtimeZoneId : null,
            sceneZoneId: match.zoneId,
            mode: match.mode,
      };
}

export function resolveSceneZoneForRuntimeZoneId(runtimeZoneId: number): RuntimeSceneZoneResolution {
      const zoneId = toInt(runtimeZoneId, 0);
      if (zoneId <= 0) {
            return {
                  runtimeZoneId: null,
                  sceneZoneId: null,
                  mode: 'none',
            };
      }

      const explicit = getExplicitSceneZoneIdForRuntimeZoneId(zoneId);
      if (explicit) {
            return {
                  runtimeZoneId: zoneId,
                  sceneZoneId: explicit,
                  mode: 'explicit',
            };
      }

      const zone = ensureRuntimeZoneIndex().get(zoneId);
      if (!zone) {
            return {
                  runtimeZoneId: zoneId,
                  sceneZoneId: null,
                  mode: 'none',
            };
      }

      const minLevel = Math.max(1, toInt(zone.level?.min, 1));
      const maxLevel = Math.max(minLevel, toInt(zone.level?.max, minLevel));
      return resolveSceneZoneForRuntimeZone({
            runtimeZoneId: zoneId,
            zoneName: String(zone.name ?? ''),
            minLevel,
            maxLevel,
            mobAble: zone.mobAble !== false,
            restriction: toInt(zone.rules?.restriction, 0),
            pkZoneFlag: toInt(zone.rules?.pkZoneFlag, 0),
      });
}

export function resolveSceneZoneMeta(sceneZoneId: string | null | undefined): SceneZoneProfile | null {
      if (!sceneZoneId) return null;
      return PROFILE_BY_ID.get(sceneZoneId) ?? null;
}

export function __resetRuntimeSceneRouteApiCacheForTests(): void {
      RUNTIME_ZONE_BY_ID = null;
}
