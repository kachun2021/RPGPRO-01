import progressionRaw from './progression.json';
import type { SkillDef } from '../../combat/CombatSystem';

interface RuntimeUserLevelRow {
      lv?: number;
      lvUpExp?: number;
}

interface RuntimeHeroRow {
      type?: number;
      name?: string;
      sex?: number;
      birthZoneId?: number;
      birthLayer?: number;
      baseStats?: {
            str?: number;
            dex?: number;
            aim?: number;
            luck?: number;
            ap?: number;
            dp?: number;
            hp?: number;
            mp?: number;
      };
}

interface RuntimeSkillPropertyRow {
      skillIndex?: number;
      name?: string;
      maxLevel?: number;
      learningSP?: number;
      learningGold?: number;
      targetClass?: string;
      pkTargetClass?: string;
      targetRangeClass?: number;
      positiveEffect?: number;
      effectIndex?: number;
      effectingStat?: number;
}

interface RuntimeSkillLevelRow {
      skillIndex?: number;
      level?: number;
      consumedMp?: number;
      coolTime?: number;
      requireSP?: number;
      maxTargetDistance?: number;
      targetRange?: number;
      continuityTime?: number;
}

interface RuntimeProgressionPayload {
      heroes?: RuntimeHeroRow[];
      userLevels?: RuntimeUserLevelRow[];
      skills?: {
            properties?: RuntimeSkillPropertyRow[];
            levels?: RuntimeSkillLevelRow[];
      };
}

export interface RuntimeHeroTemplate {
      type: number;
      name: string;
      sex: number;
      birthZoneId: number;
      birthLayer: number;
      baseStr: number;
      baseDex: number;
      baseAim: number;
      baseLuck: number;
      baseAtk: number;
      baseDef: number;
      baseHp: number;
      baseMp: number;
}

export interface RuntimeSkillUpgradeMeta {
      maxLevel: number;
      nextUpgradeSp: number;
      runtimeName: string | null;
}

export interface RuntimeSkillDetail {
      runtimeIndex: number;
      runtimeName: string | null;
      currentLevel: number;
      maxLevel: number;
      consumedMp: number;
      coolTime: number;
      requireSp: number;
      targetClass: string | null;
      pkTargetClass: string | null;
      targetRangeClass: number;
      maxTargetDistance: number;
      targetRange: number;
      continuityTime: number;
      positiveEffect: boolean;
      effectIndex: number;
      effectingStat: number;
      learningGold: number;
      learningSP: number;
}

interface RuntimeSkillTuneResult {
      mpCost: number;
      cooldown: number;
      runtimeName: string | null;
      maxLevel: number;
}

const RUNTIME = progressionRaw as RuntimeProgressionPayload;

const SKILL_ID_TO_RUNTIME_INDEX: Record<string, number> = {
      evade: 1,
      slash: 2,
      counter: 3,
      stun: 4,
      steal: 5,
      power_strike: 14,
      whirlwind: 28,
      fire_bolt: 8,
      ice_shard: 27,
      thunder: 13,
      heal: 6,
      group_heal: 12,
      shield: 7,
      berserk: 21,
      weaken: 9,
      bind: 10,
      aoe_stun: 11,
      poison: 23,
      power_strike_alt: 14,
      stun_alt: 15,
      steal_alt: 16,
      heal_alt: 17,
      shield_alt: 18,
      fire_bolt_alt: 19,
      weaken_alt: 20,
      thunder_alt: 22,
      fire_poison: 24,
      detox: 25,
      thorns: 26,
      haste: 29,
      group_detox: 30,
      group_poison: 31,
};

const USER_LEVELS: RuntimeUserLevelRow[] = Array.isArray(RUNTIME.userLevels) ? RUNTIME.userLevels : [];
const HERO_ROWS: RuntimeHeroRow[] = Array.isArray(RUNTIME.heroes) ? RUNTIME.heroes : [];
const SKILL_PROPERTIES: RuntimeSkillPropertyRow[] = Array.isArray(RUNTIME.skills?.properties)
      ? RUNTIME.skills!.properties!
      : [];
const SKILL_LEVELS: RuntimeSkillLevelRow[] = Array.isArray(RUNTIME.skills?.levels)
      ? RUNTIME.skills!.levels!
      : [];

const EXP_BY_LEVEL = new Map<number, number>();
for (const row of USER_LEVELS) {
      const lv = toInt(row.lv, 0);
      const exp = toInt(row.lvUpExp, 0);
      if (lv <= 0 || exp <= 0) continue;
      EXP_BY_LEVEL.set(lv, exp);
}

const HERO_BY_TYPE = new Map<number, RuntimeHeroTemplate>();
for (const row of HERO_ROWS) {
      const type = toInt(row.type, -1);
      if (type < 0) continue;
      HERO_BY_TYPE.set(type, {
            type,
            name: String(row.name ?? '').trim(),
            sex: toInt(row.sex, 0),
            birthZoneId: toInt(row.birthZoneId, 0),
            birthLayer: toInt(row.birthLayer, 0),
            baseStr: Math.max(1, toInt(row.baseStats?.str, 4)),
            baseDex: Math.max(1, toInt(row.baseStats?.dex, 4)),
            baseAim: Math.max(1, toInt(row.baseStats?.aim, 4)),
            baseLuck: Math.max(1, toInt(row.baseStats?.luck, 4)),
            baseAtk: Math.max(1, toInt(row.baseStats?.ap, 10)),
            baseDef: Math.max(1, toInt(row.baseStats?.dp, 5)),
            baseHp: Math.max(1, toInt(row.baseStats?.hp, 100)),
            baseMp: Math.max(1, toInt(row.baseStats?.mp, 120)),
      });
}

const SKILL_PROPERTY_BY_INDEX = new Map<number, RuntimeSkillPropertyRow>();
for (const row of SKILL_PROPERTIES) {
      const idx = toInt(row.skillIndex, 0);
      if (idx <= 0) continue;
      SKILL_PROPERTY_BY_INDEX.set(idx, row);
}

const SKILL_LEVELS_BY_INDEX = new Map<number, RuntimeSkillLevelRow[]>();
for (const row of SKILL_LEVELS) {
      const idx = toInt(row.skillIndex, 0);
      const level = toInt(row.level, 0);
      if (idx <= 0 || level <= 0) continue;
      let arr = SKILL_LEVELS_BY_INDEX.get(idx);
      if (!arr) {
            arr = [];
            SKILL_LEVELS_BY_INDEX.set(idx, arr);
      }
      arr.push(row);
}
for (const arr of SKILL_LEVELS_BY_INDEX.values()) {
      arr.sort((a, b) => toInt(a.level, 1) - toInt(b.level, 1));
}

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

function clampInt(value: number, min: number, max: number): number {
      if (!Number.isFinite(value)) return min;
      return Math.max(min, Math.min(max, Math.round(value)));
}

function clampFloat(value: number, min: number, max: number): number {
      if (!Number.isFinite(value)) return min;
      return Math.max(min, Math.min(max, value));
}

function getRuntimeSkillIndex(skillId: string): number | null {
      const idx = SKILL_ID_TO_RUNTIME_INDEX[skillId];
      return typeof idx === 'number' && idx > 0 ? idx : null;
}

function findRuntimeSkillLevelRow(skillIndex: number, level: number): RuntimeSkillLevelRow | null {
      const rows = SKILL_LEVELS_BY_INDEX.get(skillIndex);
      if (!rows || rows.length === 0) return null;
      const wanted = Math.max(1, level);
      let candidate: RuntimeSkillLevelRow | null = null;
      for (const row of rows) {
            const lv = toInt(row.level, 1);
            if (lv > wanted) break;
            candidate = row;
      }
      return candidate ?? rows[0] ?? null;
}

function resolveSkillMaxLevel(skillIndex: number): number {
      const property = SKILL_PROPERTY_BY_INDEX.get(skillIndex);
      const fromProperty = Math.max(0, toInt(property?.maxLevel, 0));
      if (fromProperty > 0) return fromProperty;
      const rows = SKILL_LEVELS_BY_INDEX.get(skillIndex) ?? [];
      return Math.max(1, rows.reduce((max, row) => Math.max(max, toInt(row.level, 1)), 1));
}

export function resolveRuntimeExpToNext(level: number): number {
      const lv = Math.max(1, Math.floor(level));
      const fromTable = EXP_BY_LEVEL.get(lv);
      if (typeof fromTable === 'number' && fromTable > 0) return fromTable;
      return lv * 100;
}

export function getRuntimeHeroTemplate(heroType = 0): RuntimeHeroTemplate | null {
      const direct = HERO_BY_TYPE.get(heroType);
      if (direct) return { ...direct };
      const fallback = HERO_BY_TYPE.get(0);
      return fallback ? { ...fallback } : null;
}

export function listRuntimeHeroTemplates(): RuntimeHeroTemplate[] {
      return Array.from(HERO_BY_TYPE.values())
            .map((row) => ({ ...row }))
            .sort((a, b) => a.type - b.type);
}

export function getRuntimeSkillUpgradeMeta(skillId: string, currentLevel: number): RuntimeSkillUpgradeMeta {
      const index = getRuntimeSkillIndex(skillId);
      if (!index) {
            return {
                  maxLevel: 99,
                  nextUpgradeSp: 1,
                  runtimeName: null,
            };
      }
      const maxLevel = resolveSkillMaxLevel(index);
      const nextLevel = Math.min(maxLevel, Math.max(1, currentLevel + 1));
      const nextRow = findRuntimeSkillLevelRow(index, nextLevel);
      const requireSp = Math.max(1, Math.ceil(toInt(nextRow?.requireSP, 0) / 10));
      const property = SKILL_PROPERTY_BY_INDEX.get(index);
      return {
            maxLevel,
            nextUpgradeSp: requireSp,
            runtimeName: String(property?.name ?? '').trim() || null,
      };
}

export function resolveRuntimeSkillTuning(skillId: string, level: number, base: SkillDef): RuntimeSkillTuneResult {
      const index = getRuntimeSkillIndex(skillId);
      if (!index) {
            return {
                  mpCost: base.mpCost,
                  cooldown: base.cooldown,
                  runtimeName: null,
                  maxLevel: 99,
            };
      }

      const property = SKILL_PROPERTY_BY_INDEX.get(index);
      const maxLevel = resolveSkillMaxLevel(index);
      const safeLevel = Math.min(maxLevel, Math.max(1, Math.floor(level)));
      const row = findRuntimeSkillLevelRow(index, safeLevel);
      const runtimeMp = Math.max(0, toInt(row?.consumedMp, base.mpCost));
      const runtimeCdSec = Math.max(0.3, toInt(row?.coolTime, Math.round(base.cooldown * 1000)) / 1000);

      const tunedMp = base.mpCost <= 0
            ? 0
            : clampInt(base.mpCost * 0.65 + runtimeMp * 0.35, 0, Math.max(base.mpCost + 30, base.mpCost * 4));
      const tunedCd = clampFloat(
            base.cooldown * 0.7 + runtimeCdSec * 0.3,
            Math.max(0.4, base.cooldown * 0.6),
            Math.max(base.cooldown + 3, base.cooldown * 2.6),
      );

      return {
            mpCost: tunedMp,
            cooldown: Number(tunedCd.toFixed(1)),
            runtimeName: String(property?.name ?? '').trim() || null,
            maxLevel,
      };
}

export function getRuntimeSkillDetail(skillId: string, level: number): RuntimeSkillDetail | null {
      const runtimeIndex = getRuntimeSkillIndex(skillId);
      if (!runtimeIndex) return null;

      const property = SKILL_PROPERTY_BY_INDEX.get(runtimeIndex);
      const maxLevel = resolveSkillMaxLevel(runtimeIndex);
      const currentLevel = Math.min(maxLevel, Math.max(1, Math.floor(level)));
      const row = findRuntimeSkillLevelRow(runtimeIndex, currentLevel);

      return {
            runtimeIndex,
            runtimeName: String(property?.name ?? '').trim() || null,
            currentLevel,
            maxLevel,
            consumedMp: Math.max(0, toInt(row?.consumedMp, 0)),
            coolTime: Math.max(0, toInt(row?.coolTime, 0)),
            requireSp: Math.max(0, toInt(row?.requireSP, 0)),
            targetClass: String(property?.targetClass ?? '').trim() || null,
            pkTargetClass: String(property?.pkTargetClass ?? '').trim() || null,
            targetRangeClass: Math.max(0, toInt(property?.targetRangeClass, 0)),
            maxTargetDistance: Math.max(0, toInt(row?.maxTargetDistance, 0)),
            targetRange: Math.max(0, toInt(row?.targetRange, 0)),
            continuityTime: Math.max(0, toInt(row?.continuityTime, 0)),
            positiveEffect: toInt(property?.positiveEffect, 1) > 0,
            effectIndex: Math.max(0, toInt(property?.effectIndex, 0)),
            effectingStat: Math.max(0, toInt(property?.effectingStat, 0)),
            learningGold: Math.max(0, toInt(property?.learningGold, 0)),
            learningSP: Math.max(0, toInt(property?.learningSP, 0)),
      };
}
