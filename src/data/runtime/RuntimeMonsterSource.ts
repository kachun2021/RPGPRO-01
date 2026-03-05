import { PetSeries } from '../../pets/PetData';
import worldSpawnRaw from './world.spawn.json';
import worldTopologyRaw from './world.topology.json';
import progressionRaw from './progression.json';
import { canonicalRuntimeMapName, matchRuntimeMapToSceneZone } from './RuntimeZoneBridge';

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

interface RuntimeMonsterCatalogRow {
      monsterType: number;
      name: string;
      race?: number;
      startBaseLevel?: number;
      coreRate?: number;
      statRate?: number;
      hpRate?: number;
}

interface RuntimeMobSlotRow {
      zoneId: number;
      appearRate?: number;
      intervalTime?: number;
}

interface RuntimeMobSpawnRow {
      mobIdx: number;
      monsterType: number;
      mobItemIdx?: number;
      aggressive?: number;
      slots?: RuntimeMobSlotRow[];
}

interface RuntimeMonsterLevelRow {
      lv: number;
      hp?: number;
      att?: number;
      dp?: number;
}

interface RuntimeZoneRow {
      zoneId: number;
      name: string;
      level?: { min?: number; max?: number };
}

let POOL_BY_SCENE_ZONE: Map<string, RuntimeMonsterTemplate[]> | null = null;

function mapRaceToSeries(race: number): PetSeries {
      switch (race) {
            case 0: return PetSeries.Dragon;
            case 1: return PetSeries.Demon;
            case 2: return PetSeries.Beast;
            case 3: return PetSeries.Bird;
            case 4: return PetSeries.Insect;
            case 5: return PetSeries.Plant;
            case 6: return PetSeries.Metal;
            case 7: return PetSeries.Mystery;
            default: return PetSeries.Mystery;
      }
}

function clamp(value: number, min: number, max: number): number {
      if (!Number.isFinite(value)) return min;
      return Math.max(min, Math.min(max, value));
}

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const n = Number(value);
      if (!Number.isFinite(n)) return fallback;
      return Math.floor(n);
}

function findNearestMonsterLevel(levelRows: RuntimeMonsterLevelRow[], level: number): RuntimeMonsterLevelRow | null {
      if (levelRows.length === 0) return null;
      const target = clamp(Math.floor(level), 1, 210);
      let lo = 0;
      let hi = levelRows.length - 1;
      while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const lv = toInt(levelRows[mid].lv, 1);
            if (lv === target) return levelRows[mid];
            if (lv < target) lo = mid + 1;
            else hi = mid - 1;
      }
      const idx = clamp(hi, 0, levelRows.length - 1);
      return levelRows[idx] ?? null;
}

function isBossByHeuristic(name: string, level: number, intervalSec: number, coreRate: number): boolean {
      const n = name.toLowerCase();
      if (/(boss|魔王|之王|女王|大王|皇|王)/.test(n)) return true;
      if (intervalSec >= 300) return true;
      if (level >= 120 && coreRate <= 0) return true;
      return false;
}

function ensurePool(): Map<string, RuntimeMonsterTemplate[]> {
      if (POOL_BY_SCENE_ZONE) return POOL_BY_SCENE_ZONE;

      const worldSpawn = worldSpawnRaw as {
            monsterCatalog?: RuntimeMonsterCatalogRow[];
            mobSpawns?: RuntimeMobSpawnRow[];
      };
      const worldTopology = worldTopologyRaw as {
            zones?: RuntimeZoneRow[];
      };
      const progression = progressionRaw as {
            monsterLevels?: RuntimeMonsterLevelRow[];
      };

      const monsterCatalog = Array.isArray(worldSpawn.monsterCatalog) ? worldSpawn.monsterCatalog : [];
      const mobSpawns = Array.isArray(worldSpawn.mobSpawns) ? worldSpawn.mobSpawns : [];
      const zones = Array.isArray(worldTopology.zones) ? worldTopology.zones : [];
      const levelRows = (Array.isArray(progression.monsterLevels) ? progression.monsterLevels : [])
            .slice()
            .sort((a, b) => toInt(a.lv, 1) - toInt(b.lv, 1));

      const monsterByType = new Map<number, RuntimeMonsterCatalogRow>();
      for (const row of monsterCatalog) {
            const type = toInt(row.monsterType, 0);
            if (type <= 0) continue;
            monsterByType.set(type, row);
      }

      const zoneById = new Map<number, RuntimeZoneRow>();
      for (const zone of zones) {
            const zoneId = toInt(zone.zoneId, 0);
            if (zoneId <= 0) continue;
            zoneById.set(zoneId, zone);
      }

      const aggregate = new Map<string, Map<number, RuntimeMonsterTemplate>>();

      for (const spawn of mobSpawns) {
            const monsterType = toInt(spawn.monsterType, 0);
            const catalog = monsterByType.get(monsterType);
            if (!catalog) continue;

            const name = String(catalog.name ?? '').trim();
            if (!name) continue;

            const baseLevel = Math.max(1, toInt(catalog.startBaseLevel, 1));
            const statRate = Number.isFinite(Number(catalog.statRate)) ? Number(catalog.statRate) : 1;
            const hpRate = Number.isFinite(Number(catalog.hpRate)) ? Number(catalog.hpRate) : 1;
            const race = toInt(catalog.race, 7);
            const coreRate = Math.max(0, toInt(catalog.coreRate, 0));
            const behavior: RuntimeMonsterBehavior = toInt(spawn.aggressive, 0) > 0 ? 'aggressive' : 'passive';
            const slots = Array.isArray(spawn.slots) ? spawn.slots : [];
            const levelCurve = findNearestMonsterLevel(levelRows, baseLevel);

            for (const slot of slots) {
                  const zoneId = toInt(slot.zoneId, 0);
                  if (zoneId <= 0) continue;

                  const zone = zoneById.get(zoneId);
                  const mapName = canonicalRuntimeMapName(String(zone?.name ?? ''));
                  if (!mapName) continue;

                  const levelMin = toInt(zone?.level?.min, baseLevel);
                  const levelMax = toInt(zone?.level?.max, Math.max(levelMin, baseLevel));
                  const match = matchRuntimeMapToSceneZone(mapName, levelMin, levelMax);
                  if (!match.zoneId) continue;

                  const intervalSec = Math.max(8, toInt(slot.intervalTime, 20));
                  const isBoss = isBossByHeuristic(name, baseLevel, intervalSec, coreRate);
                  const hpBase = Math.max(10, toInt(levelCurve?.hp, Math.round(baseLevel * 12)));
                  const atkBase = Math.max(2, toInt(levelCurve?.att, Math.round(baseLevel * 2.2)));
                  const defBase = Math.max(1, toInt(levelCurve?.dp, Math.round(baseLevel * 1.1)));

                  const maxHp = Math.max(
                        10,
                        Math.round(hpBase * Math.max(0.2, hpRate) * Math.max(0.2, statRate) * (isBoss ? 4.2 : 1.25))
                  );
                  const atk = Math.max(
                        1,
                        Math.round(atkBase * Math.max(0.2, statRate) * (isBoss ? 1.6 : 1.0))
                  );
                  const def = Math.max(1, Math.round(defBase * Math.max(0.2, statRate)));
                  const eggDropRate = clamp(coreRate / 1_200_000_000, 0, 0.08);
                  const spawnWeight = Math.max(1, toInt(slot.appearRate, 10));

                  let sceneMap = aggregate.get(match.zoneId);
                  if (!sceneMap) {
                        sceneMap = new Map<number, RuntimeMonsterTemplate>();
                        aggregate.set(match.zoneId, sceneMap);
                  }

                  const prev = sceneMap.get(monsterType);
                  if (!prev) {
                        sceneMap.set(monsterType, {
                              sourceMobIdx: toInt(spawn.mobIdx, 0),
                              monsterType,
                              mobItemIdx: Math.max(0, toInt(spawn.mobItemIdx, 0)),
                              name,
                              level: baseLevel,
                              series: mapRaceToSeries(race),
                              behavior,
                              respawnSec: clamp(intervalSec, 8, isBoss ? 1800 : 300),
                              isBoss,
                              maxHp,
                              atk,
                              def,
                              eggDropRate,
                              spawnWeight,
                        });
                        continue;
                  }

                  prev.level = Math.max(prev.level, baseLevel);
                  if (prev.mobItemIdx <= 0) prev.mobItemIdx = Math.max(0, toInt(spawn.mobItemIdx, 0));
                  prev.behavior = prev.behavior === 'aggressive' || behavior === 'aggressive' ? 'aggressive' : 'passive';
                  prev.respawnSec = Math.max(8, Math.min(prev.respawnSec, intervalSec));
                  prev.isBoss = prev.isBoss || isBoss;
                  prev.maxHp = Math.max(prev.maxHp, maxHp);
                  prev.atk = Math.max(prev.atk, atk);
                  prev.def = Math.max(prev.def, def);
                  prev.eggDropRate = Math.max(prev.eggDropRate, eggDropRate);
                  prev.spawnWeight += spawnWeight;
            }
      }

      const output = new Map<string, RuntimeMonsterTemplate[]>();
      for (const [sceneZoneId, byMonsterType] of aggregate) {
            const rows = Array.from(byMonsterType.values()).sort((a, b) => {
                  if (a.level !== b.level) return a.level - b.level;
                  return a.name.localeCompare(b.name, 'zh-Hant');
            });
            output.set(sceneZoneId, rows);
      }

      POOL_BY_SCENE_ZONE = output;
      return POOL_BY_SCENE_ZONE;
}

export function getRuntimeMonstersForSceneZone(sceneZoneId: string): RuntimeMonsterTemplate[] {
      const pool = ensurePool().get(sceneZoneId);
      return pool ? pool.map(entry => ({ ...entry })) : [];
}
