import { PetSeries } from '../../pets/PetData';
import { getRuntimeSceneZone } from '../../world/RuntimeZoneCatalog';
import zoneTemplatesRaw from './world.spawn.zone_templates.json';

export type RuntimeMonsterBehavior = 'aggressive' | 'passive';

export interface RuntimeMonsterTemplate {
      sourceMobIdx: number;
      monsterType: number;
      mobItemIdx: number;
      name: string;
      level: number;
      series: PetSeries;
      behavior: RuntimeMonsterBehavior;
      respawnSec: number;
      isBoss: boolean;
      maxHp: number;
      atk: number;
      def: number;
      eggDropRate: number;
      spawnWeight: number;
}

interface RuntimeZoneMonsterTemplateRow {
      sourceMobIdx?: number;
      monsterType?: number;
      mobItemIdx?: number;
      name?: string;
      level?: number;
      series?: string;
      behavior?: string;
      respawnSec?: number;
      isBoss?: boolean;
      maxHp?: number;
      atk?: number;
      def?: number;
      eggDropRate?: number;
      spawnWeight?: number;
}

interface RuntimeZoneTemplatePayload {
      zoneTemplates?: Record<string, RuntimeZoneMonsterTemplateRow[]>;
}

const DATA = zoneTemplatesRaw as RuntimeZoneTemplatePayload;
const CACHE_BY_SCENE_ZONE = new Map<string, RuntimeMonsterTemplate[]>();

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

function toNumber(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return parsed;
}

function toBool(value: unknown): boolean {
      return value === true || value === 1 || value === '1';
}

function toBehavior(value: unknown): RuntimeMonsterBehavior {
      return String(value ?? '').toLowerCase() === 'aggressive' ? 'aggressive' : 'passive';
}

function toSeries(value: unknown): PetSeries {
      const raw = String(value ?? '').trim();
      switch (raw) {
            case PetSeries.Plant:
            case PetSeries.Dragon:
            case PetSeries.Beast:
            case PetSeries.Insect:
            case PetSeries.Metal:
            case PetSeries.Mystery:
            case PetSeries.Demon:
            case PetSeries.Bird:
                  return raw;
            default:
                  return PetSeries.Mystery;
      }
}

function buildSceneZonePool(sceneZoneId: string): RuntimeMonsterTemplate[] {
      const zone = getRuntimeSceneZone(sceneZoneId);
      if (!zone || zone.isTown) return [];
      const zoneTemplates = DATA.zoneTemplates ?? {};

      const byMonsterType = new Map<number, RuntimeMonsterTemplate>();
      for (const runtimeZoneId of zone.runtimeZoneIds) {
            const rows = Array.isArray(zoneTemplates[String(runtimeZoneId)]) ? zoneTemplates[String(runtimeZoneId)] : [];
            for (const row of rows) {
                  const monsterType = toInt(row.monsterType, 0);
                  if (monsterType <= 0) continue;
                  const name = String(row.name ?? '').trim();
                  if (!name) continue;

                  const normalized: RuntimeMonsterTemplate = {
                        sourceMobIdx: Math.max(0, toInt(row.sourceMobIdx, 0)),
                        monsterType,
                        mobItemIdx: Math.max(0, toInt(row.mobItemIdx, 0)),
                        name,
                        level: Math.max(1, toInt(row.level, 1)),
                        series: toSeries(row.series),
                        behavior: toBehavior(row.behavior),
                        respawnSec: Math.max(8, toInt(row.respawnSec, 20)),
                        isBoss: toBool(row.isBoss),
                        maxHp: Math.max(10, toInt(row.maxHp, 30)),
                        atk: Math.max(1, toInt(row.atk, 5)),
                        def: Math.max(1, toInt(row.def, 2)),
                        eggDropRate: Math.max(0, Math.min(0.08, toNumber(row.eggDropRate, 0))),
                        spawnWeight: Math.max(1, toInt(row.spawnWeight, 1)),
                  };

                  const prev = byMonsterType.get(monsterType);
                  if (!prev) {
                        byMonsterType.set(monsterType, normalized);
                        continue;
                  }

                  prev.level = Math.max(prev.level, normalized.level);
                  if (prev.mobItemIdx <= 0) prev.mobItemIdx = normalized.mobItemIdx;
                  prev.behavior = prev.behavior === 'aggressive' || normalized.behavior === 'aggressive' ? 'aggressive' : 'passive';
                  prev.respawnSec = Math.max(8, Math.min(prev.respawnSec, normalized.respawnSec));
                  prev.isBoss = prev.isBoss || normalized.isBoss;
                  prev.maxHp = Math.max(prev.maxHp, normalized.maxHp);
                  prev.atk = Math.max(prev.atk, normalized.atk);
                  prev.def = Math.max(prev.def, normalized.def);
                  prev.eggDropRate = Math.max(prev.eggDropRate, normalized.eggDropRate);
                  prev.spawnWeight += normalized.spawnWeight;
            }
      }

      const rows = Array.from(byMonsterType.values()).sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name, 'zh-Hant');
      });

      const normalRows = rows
            .filter((row) => !row.isBoss)
            .sort((a, b) => {
                  const aDistance = Math.abs(a.level - zone.levelMin);
                  const bDistance = Math.abs(b.level - zone.levelMin);
                  if (aDistance !== bDistance) return aDistance - bDistance;
                  if (a.level !== b.level) return a.level - b.level;
                  return a.name.localeCompare(b.name, 'zh-Hant');
            });
      const bossRows = rows
            .filter((row) => row.isBoss)
            .sort((a, b) => b.level - a.level);

      const minNormalKeep = Math.max(4, Math.min(8, Math.ceil(normalRows.length * 0.35)));
      const profileAnchoredNormals = normalRows.filter((row) => row.level >= zone.levelMin - 4 && row.level <= zone.levelMax + 12);
      const sampledSourceRows = profileAnchoredNormals.length >= minNormalKeep
            ? profileAnchoredNormals
            : normalRows;

      const sampledNormalLevels = sampledSourceRows
            .map((row) => row.level)
            .sort((a, b) => a - b);
      const sampledMinLevel = sampledNormalLevels[0] ?? zone.levelMin;
      const sampledMaxLevel = sampledNormalLevels.length > 0
            ? sampledNormalLevels[Math.max(0, Math.ceil(sampledNormalLevels.length * 0.85) - 1)]
            : zone.levelMax;
      const targetLevelMin = sampledMinLevel;
      const targetLevelMax = Math.max(targetLevelMin, sampledMaxLevel);
      const sceneSpan = Math.max(1, targetLevelMax - targetLevelMin);
      const normalBandAttempts = [
            { min: targetLevelMin - 4, max: targetLevelMax + Math.max(8, Math.round(sceneSpan * 0.35)) },
            { min: targetLevelMin - 8, max: targetLevelMax + Math.max(14, Math.round(sceneSpan * 0.6)) },
            { min: targetLevelMin - 16, max: targetLevelMax + Math.max(22, Math.round(sceneSpan * 0.9)) },
      ];
      const bossBandAttempts = [
            { min: Math.max(1, targetLevelMax - Math.max(8, Math.round(sceneSpan * 0.25))), max: targetLevelMax + Math.max(18, Math.round(sceneSpan * 0.45)) },
            { min: Math.max(1, targetLevelMin - 4), max: targetLevelMax + Math.max(30, Math.round(sceneSpan * 0.8)) },
      ];

      const filterByBand = (
            source: RuntimeMonsterTemplate[],
            bands: Array<{ min: number; max: number }>,
            minKeep: number,
            fallbackToSource = true,
      ): RuntimeMonsterTemplate[] => {
            for (const band of bands) {
                  const filtered = source.filter((row) => row.level >= band.min && row.level <= band.max);
                  if (filtered.length >= minKeep) return filtered;
            }
            return fallbackToSource ? source : [];
      };

      const minBossKeep = Math.min(1, bossRows.length);
      const bandedNormals = filterByBand(normalRows, normalBandAttempts, minNormalKeep);
      const preferredBosses = filterByBand(bossRows, bossBandAttempts, minBossKeep, false);
      const bossTargetLevel = targetLevelMax + Math.max(4, Math.round(sceneSpan * 0.2));
      const bossGapAllowance = Math.max(18, Math.round(sceneSpan * 0.65));
      const sortedBossFallback = bossRows
            .slice()
            .sort((a, b) => {
                  const aGap = Math.abs(a.level - bossTargetLevel);
                  const bGap = Math.abs(b.level - bossTargetLevel);
                  if (aGap !== bGap) return aGap - bGap;
                  return a.level - b.level;
            });
      const bandedBosses = preferredBosses.length > 0
            ? preferredBosses
            : sortedBossFallback.filter((row) => Math.abs(row.level - bossTargetLevel) <= bossGapAllowance);

      const normalCap = zone.id === 'starter_meadow'
            ? 8
            : zone.levelMax >= 120
                  ? 18
                  : zone.levelMax >= 60
                        ? 16
                        : 12;
      const bossCap = zone.levelMax >= 120 ? 3 : 2;

      return [
            ...bandedNormals.slice(0, normalCap),
            ...bandedBosses.slice(0, bossCap),
      ];
}

export function getRuntimeMonstersForSceneZone(sceneZoneId: string): RuntimeMonsterTemplate[] {
      const cached = CACHE_BY_SCENE_ZONE.get(sceneZoneId);
      if (cached) return cached.map((entry) => ({ ...entry }));

      const rows = buildSceneZonePool(sceneZoneId);
      CACHE_BY_SCENE_ZONE.set(sceneZoneId, rows);
      return rows.map((entry) => ({ ...entry }));
}
