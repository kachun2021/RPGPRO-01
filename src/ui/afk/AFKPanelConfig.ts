import { getRuntimeMonstersForSceneZone } from '../../data/runtime/RuntimeMonsterSource';
import { getSceneZonePrimaryRuntimeName } from '../../data/runtime/RuntimeWorldRoutes';
import { listRuntimeSceneZones } from '../../world/RuntimeZoneCatalog';

export type AFKTabId = 'quick' | 'combat' | 'loot' | 'safety';
export type AFKMode = 'safe' | 'balanced' | 'efficient';
export type TargetPriority = 'nearest' | 'elite' | 'bossLast';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BagFullAction = 'town' | 'mail' | 'stop';
export type DeathAction = 'revive' | 'town' | 'stop';
export type FilterListKey = 'whitelist' | 'blacklist';

export interface LootZoneMonsterOption {
      name: string;
      level: number;
      isBoss: boolean;
}

export interface LootZoneOption {
      id: string;
      label: string;
      monsters: LootZoneMonsterOption[];
}

export interface AFKSettings {
      mode: AFKMode;
      autoFindEnabled: boolean;
      autoPotionEnabled: boolean;
      autoLootEnabled: boolean;
      detectRadius: number;
      targetPriority: TargetPriority;
      mpReservePct: number;
      forceHealThreshold: number;
      rarityThreshold: ItemRarity;
      bagFullAction: BagFullAction;
      whitelist: string;
      blacklist: string;
      hpPotionPct: number;
      mpPotionPct: number;
      deathAction: DeathAction;
      reconnectEnabled: boolean;
      stopOnBoss: boolean;
      simpleRiskCheck: boolean;
}

export interface AFKSaveState {
      version: number;
      settings: AFKSettings;
      lootZoneId: string;
}

export const STORAGE_KEY = 'fpo.afk.settings.v3';
export const LOOT_ZONE_STORAGE_KEY = 'fpo.afk.settings.v3.loot.zone';
export const TAB_IDS: AFKTabId[] = ['quick', 'combat', 'loot', 'safety'];
export const MODE_IDS: AFKMode[] = ['safe', 'balanced', 'efficient'];
export const FILTER_CHAR_LIMIT = 300;
export const AFK_SAVE_VERSION = 1;

export const LOOT_ZONES: LootZoneOption[] = listRuntimeSceneZones()
      .filter((zone) => !zone.isTown)
      .map((zone) => {
            const monsterMap = new Map<string, LootZoneMonsterOption>();
            const runtimeMonsters = getRuntimeMonstersForSceneZone(zone.id);
            runtimeMonsters.forEach((monster) => {
                  const name = String(monster.name ?? '').trim();
                  if (!name) return;
                  const key = name.toLowerCase();
                  const existing = monsterMap.get(key);
                  if (!existing || monster.level < existing.level) {
                        monsterMap.set(key, {
                              name,
                              level: monster.level,
                              isBoss: Boolean(monster.isBoss),
                        });
                        return;
                  }
                  if (monster.isBoss) existing.isBoss = true;
            });
            const monsters = Array.from(monsterMap.values()).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'zh-Hant'));
            const levelMin = monsters.length > 0 ? Math.min(...monsters.map((row) => row.level)) : zone.levelMin;
            const levelMax = monsters.length > 0 ? Math.max(...monsters.map((row) => row.level)) : zone.levelMax;
            const runtimeName = zone.nameCN || getSceneZonePrimaryRuntimeName(zone.id) || zone.name;
            return {
                  id: zone.id,
                  label: `${runtimeName} (Lv.${levelMin}-${levelMax})`,
                  monsters,
            };
      })
      .filter((zone) => zone.monsters.length > 0);

export const DEFAULT_SETTINGS: AFKSettings = {
      mode: 'balanced',
      autoFindEnabled: true,
      autoPotionEnabled: true,
      autoLootEnabled: true,
      detectRadius: 20,
      targetPriority: 'nearest',
      mpReservePct: 20,
      forceHealThreshold: 30,
      rarityThreshold: 'rare',
      bagFullAction: 'town',
      whitelist: '',
      blacklist: '',
      hpPotionPct: 35,
      mpPotionPct: 30,
      deathAction: 'town',
      reconnectEnabled: true,
      stopOnBoss: true,
      simpleRiskCheck: true,
};

export const MODE_PRESETS: Record<AFKMode, Partial<AFKSettings>> = {
      safe: {
            detectRadius: 16,
            targetPriority: 'nearest',
            hpPotionPct: 40,
            mpPotionPct: 35,
            mpReservePct: 30,
            forceHealThreshold: 40,
            rarityThreshold: 'rare',
            bagFullAction: 'town',
            stopOnBoss: true,
      },
      balanced: {
            detectRadius: 22,
            targetPriority: 'bossLast',
            hpPotionPct: 35,
            mpPotionPct: 30,
            mpReservePct: 20,
            forceHealThreshold: 30,
            rarityThreshold: 'uncommon',
            bagFullAction: 'town',
            stopOnBoss: true,
      },
      efficient: {
            detectRadius: 30,
            targetPriority: 'elite',
            hpPotionPct: 28,
            mpPotionPct: 24,
            mpReservePct: 10,
            forceHealThreshold: 25,
            rarityThreshold: 'common',
            bagFullAction: 'mail',
            stopOnBoss: false,
      },
};

export function clampSetting(n: number, min: number, max: number): number {
      if (!Number.isFinite(n)) return min;
      return Math.max(min, Math.min(max, n));
}

export function normalizeEnumValue<T extends string>(value: unknown, list: readonly T[], fallback: T): T {
      return typeof value === 'string' && list.includes(value as T) ? (value as T) : fallback;
}

export function modeLabel(mode: AFKMode): string {
      switch (mode) {
            case 'safe': return '安全';
            case 'balanced': return '平衡';
            case 'efficient': return '效率';
      }
}

export function parseFilterList(raw: string): string[] {
      const result: string[] = [];
      const seen = new Set<string>();
      raw.split(/[\n,;]+/).forEach((part) => {
            const value = part.trim();
            if (!value) return;
            const key = value.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            result.push(value);
      });
      return result;
}

export function stringifyFilterList(values: string[], maxLength: number): string {
      const result: string[] = [];
      let currentLength = 0;
      values.forEach((raw) => {
            const value = raw.trim();
            if (!value) return;
            const key = value.toLowerCase();
            if (result.some((item) => item.toLowerCase() === key)) return;
            const nextLength = currentLength === 0 ? value.length : currentLength + 1 + value.length;
            if (nextLength > maxLength) return;
            result.push(value);
            currentLength = nextLength;
      });
      return result.join(',');
}
