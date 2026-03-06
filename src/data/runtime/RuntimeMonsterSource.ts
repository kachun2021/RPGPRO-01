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

      return Array.from(byMonsterType.values()).sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name, 'zh-Hant');
      });
}

export function getRuntimeMonstersForSceneZone(sceneZoneId: string): RuntimeMonsterTemplate[] {
      const cached = CACHE_BY_SCENE_ZONE.get(sceneZoneId);
      if (cached) return cached.map((entry) => ({ ...entry }));

      const rows = buildSceneZonePool(sceneZoneId);
      CACHE_BY_SCENE_ZONE.set(sceneZoneId, rows);
      return rows.map((entry) => ({ ...entry }));
}

