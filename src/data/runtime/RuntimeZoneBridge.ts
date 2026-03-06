import { SCENE_ZONE_PROFILES, type SceneZoneProfile } from '../../world/SceneZoneProfiles';

export type RuntimeZoneMatchMode = 'topology' | 'town' | 'level' | 'none';

export interface RuntimeZoneRouteInput {
      runtimeZoneId?: number;
      zoneName?: string;
      minLevel: number;
      maxLevel: number;
      mobAble?: boolean;
      restriction?: number;
      pkZoneFlag?: number;
}

export function canonicalRuntimeMapName(raw: string): string {
      const text = String(raw ?? '').trim();
      if (!text) return '';
      return text.replace(/\s+/g, '');
}

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

function clampLevel(value: number, fallback: number): number {
      if (!Number.isFinite(value)) return Math.max(1, fallback);
      return Math.max(1, Math.floor(value));
}

function overlapScore(
      runtimeMin: number,
      runtimeMax: number,
      sceneMin: number,
      sceneMax: number,
): number {
      const overlapMin = Math.max(runtimeMin, sceneMin);
      const overlapMax = Math.min(runtimeMax, sceneMax);
      if (overlapMax < overlapMin) return 0;
      return overlapMax - overlapMin + 1;
}

function selectBestSceneZone(
      candidates: readonly SceneZoneProfile[],
      runtimeMin: number,
      runtimeMax: number,
      pkZoneFlag: number,
): string | null {
      if (candidates.length <= 0) return null;
      const runtimeAvg = (runtimeMin + runtimeMax) / 2;
      let bestId: string | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const zone of candidates) {
            const sceneAvg = (zone.levelMin + zone.levelMax) / 2;
            const overlap = overlapScore(runtimeMin, runtimeMax, zone.levelMin, zone.levelMax);
            const levelDistance = Math.abs(sceneAvg - runtimeAvg);
            const outOfRangePenalty = runtimeAvg < zone.levelMin
                  ? (zone.levelMin - runtimeAvg) * 0.8
                  : runtimeAvg > zone.levelMax
                        ? (runtimeAvg - zone.levelMax) * 0.8
                        : 0;

            const pkPenalty = pkZoneFlag > 0 && zone.levelMax < runtimeAvg ? 4 : 0;
            const overlapBonus = overlap > 0 ? Math.max(0, 10 - overlap * 0.3) : 0;
            const score = levelDistance + outOfRangePenalty + pkPenalty + overlapBonus;

            if (score < bestScore) {
                  bestScore = score;
                  bestId = zone.id;
            }
      }

      return bestId;
}

export function matchRuntimeZoneToSceneZone(input: RuntimeZoneRouteInput): { zoneId: string | null; mode: RuntimeZoneMatchMode } {
      const runtimeMin = clampLevel(toInt(input.minLevel, 1), 1);
      const runtimeMax = Math.max(runtimeMin, clampLevel(toInt(input.maxLevel, runtimeMin), runtimeMin));
      const mobAble = input.mobAble !== false;
      const restriction = Math.max(0, toInt(input.restriction, 0));
      const pkZoneFlag = Math.max(0, toInt(input.pkZoneFlag, 0));

      if (SCENE_ZONE_PROFILES.length <= 0) return { zoneId: null, mode: 'none' };

      const towns = SCENE_ZONE_PROFILES.filter((zone) => zone.isTown);
      const fields = SCENE_ZONE_PROFILES.filter((zone) => !zone.isTown);

      const preferTown = !mobAble || (restriction > 0 && runtimeMax <= 5);
      if (preferTown && towns.length > 0) {
            const townId = selectBestSceneZone(towns, runtimeMin, runtimeMax, pkZoneFlag);
            if (townId) return { zoneId: townId, mode: 'town' };
      }

      const fieldId = selectBestSceneZone(fields.length > 0 ? fields : SCENE_ZONE_PROFILES, runtimeMin, runtimeMax, pkZoneFlag);
      if (fieldId) return { zoneId: fieldId, mode: mobAble ? 'topology' : 'level' };

      return { zoneId: null, mode: 'none' };
}

export function matchRuntimeMapToSceneZone(_mapName: string, minLevel: number, maxLevel: number): { zoneId: string | null; mode: RuntimeZoneMatchMode } {
      return matchRuntimeZoneToSceneZone({
            minLevel,
            maxLevel,
            mobAble: true,
      });
}
