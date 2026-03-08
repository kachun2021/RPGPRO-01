import saveSchemaRaw from '../data/runtime/save_schema.json';
import type { HeroProfileRecord } from '../services/AuthService';
import { localKeyValueStore } from '../services/adapters/local/LocalStorageKV';
import type { Player } from '../entities/Player';
import type { Inventory, InventoryItem } from './Inventory';
import type { PetManager } from '../pets/PetManager';
import type { Gender } from '../pets/PetData';
import type { StatAllocation, BaseStats } from './StatAllocation';
import type { SkillTree } from './SkillTree';
import type { AwakeningSystem } from './AwakeningSystem';
import type { RebirthSystem } from './RebirthSystem';
import type { SystemSettings } from '../ui/SystemPanel';
import type { AFKSaveState } from '../ui/AFKPanel';
import type { OnboardingSaveState } from './OnboardingManager';
import type { QuestSaveState } from './QuestManager';

const STORAGE_KEY = 'fpo.save.runtime.v2';
const LEGACY_STORAGE_KEY = 'fpo.save.runtime.v1';
const SAVE_VERSION = 2;

interface SavedPet {
      defId: string;
      gender: Gender;
      nickname: string;
      activeSlot: number;
      stats: {
            hp: number;
            maxHp: number;
            mp: number;
            maxMp: number;
            str: number;
            agi: number;
            acc: number;
            luk: number;
            atkMin: number;
            atkMax: number;
            hitRate: number;
            dodgeRate: number;
            element: number;
            level: number;
            exp: number;
      };
}

export interface RuntimeWorldSaveState {
      currentZoneId: string;
      unlockedZoneIds: string[];
      questChapter: number;
}

interface SavedPlayerState {
      hp: number;
      maxHp: number;
      mp: number;
      maxMp: number;
      atk: number;
      def: number;
      level: number;
      exp: number;
      gold: number;
      diamond: number;
}

interface SavedInventoryState {
      gold: number;
      items: Array<{
            itemId: string;
            name: string;
            type: InventoryItem['type'];
            rarity: InventoryItem['rarity'];
            qty: number;
            icon: string;
            description: string;
      }>;
      totals: {
            kills: number;
            goldGained: number;
            expGained: number;
            itemsFound: number;
      };
}

interface SavedGrowthState {
      statBase: BaseStats;
      statPoints: number;
      rebirthBonus: number;
      skillPoints: number;
      skillNodeLevels: Record<string, number>;
      isAwakened: boolean;
      rebirthCount: number;
}

interface SavedGamePayloadV1 {
      version?: number;
      savedAt?: string;
      schemaMeta?: {
            sourceRows?: number;
      };
      player?: SavedPlayerState & {
            questChapter?: number;
      };
      inventory?: SavedInventoryState;
      pets?: SavedPet[];
      growth?: SavedGrowthState;
}

interface SavedGamePayloadV2 {
      version: number;
      savedAt: string;
      schemaMeta: {
            sourceRows: number;
      };
      profile: {
            heroProfile: HeroProfileRecord | null;
      };
      player: SavedPlayerState;
      world: RuntimeWorldSaveState;
      inventory: SavedInventoryState;
      pets: SavedPet[];
      growth: SavedGrowthState;
      settings: {
            system: SystemSettings | null;
            afk: AFKSaveState | null;
      };
      onboarding: OnboardingSaveState | null;
      quests: QuestSaveState | null;
}

export interface RuntimeSaveContext {
      player: Player;
      inventory: Inventory;
      petManager: PetManager;
      statAlloc: StatAllocation;
      skillTree: SkillTree;
      awakening: AwakeningSystem;
      rebirth: RebirthSystem;
      getSystemSettings?: () => SystemSettings;
      applySystemSettings?: (settings: SystemSettings) => void;
      getAfkState?: () => AFKSaveState | null;
      applyAfkState?: (state: AFKSaveState | null) => void;
      getOnboardingState?: () => OnboardingSaveState | null;
      applyOnboardingState?: (state: OnboardingSaveState | null) => void;
      getQuestState?: () => QuestSaveState | null;
      applyQuestState?: (state: QuestSaveState | null) => void;
      getHeroProfile?: () => HeroProfileRecord | null;
      applyHeroProfile?: (profile: HeroProfileRecord | null) => void;
      getWorldState?: () => RuntimeWorldSaveState | null;
      applyWorldState?: (state: RuntimeWorldSaveState | null) => Promise<void> | void;
}

export interface RuntimeSaveResult {
      ok: boolean;
      message: string;
      savedAt?: string;
      version?: number;
}

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

function clamp(value: number, min: number, max: number): number {
      return Math.max(min, Math.min(max, value));
}

function getSchemaRows(): number {
      const schema = saveSchemaRaw as { player?: unknown[]; uHench?: unknown[]; uItem?: unknown[]; uMixSkill?: unknown[] };
      return (schema.player?.length ?? 0) + (schema.uHench?.length ?? 0) + (schema.uItem?.length ?? 0) + (schema.uMixSkill?.length ?? 0);
}

function cloneInventoryItems(items: InventoryItem[]): SavedInventoryState['items'] {
      return items.map((item) => ({
            itemId: item.itemId,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            qty: item.qty,
            icon: item.icon,
            description: item.description,
      }));
}

function buildDefaultWorldState(ctx: RuntimeSaveContext): RuntimeWorldSaveState {
      return ctx.getWorldState?.() ?? {
            currentZoneId: 'starter_meadow',
            unlockedZoneIds: ['starter_meadow'],
            questChapter: ctx.player.stats.questChapter,
      };
}

function buildSavePayload(ctx: RuntimeSaveContext): SavedGamePayloadV2 {
      return {
            version: SAVE_VERSION,
            savedAt: new Date().toISOString(),
            schemaMeta: {
                  sourceRows: getSchemaRows(),
            },
            profile: {
                  heroProfile: ctx.getHeroProfile?.() ?? null,
            },
            player: {
                  hp: ctx.player.stats.hp,
                  maxHp: ctx.player.stats.maxHp,
                  mp: ctx.player.stats.mp,
                  maxMp: ctx.player.stats.maxMp,
                  atk: ctx.player.stats.atk,
                  def: ctx.player.stats.def,
                  level: ctx.player.stats.level,
                  exp: ctx.player.stats.exp,
                  gold: ctx.inventory.gold,
                  diamond: ctx.player.stats.diamond,
            },
            world: buildDefaultWorldState(ctx),
            inventory: {
                  gold: ctx.inventory.gold,
                  items: cloneInventoryItems(ctx.inventory.items),
                  totals: {
                        kills: ctx.inventory.totalKills,
                        goldGained: ctx.inventory.totalGoldGained,
                        expGained: ctx.inventory.totalExpGained,
                        itemsFound: ctx.inventory.totalItemsFound,
                  },
            },
            pets: ctx.petManager.owned.map((pet) => ({
                  defId: pet.def.id,
                  gender: pet.gender,
                  nickname: pet.nickname,
                  activeSlot: pet.slotIndex,
                  stats: {
                        hp: pet.stats.hp,
                        maxHp: pet.stats.maxHp,
                        mp: pet.stats.mp,
                        maxMp: pet.stats.maxMp,
                        str: pet.stats.str,
                        agi: pet.stats.agi,
                        acc: pet.stats.acc,
                        luk: pet.stats.luk,
                        atkMin: pet.stats.atkMin,
                        atkMax: pet.stats.atkMax,
                        hitRate: pet.stats.hitRate,
                        dodgeRate: pet.stats.dodgeRate,
                        element: pet.stats.element,
                        level: pet.stats.level,
                        exp: pet.stats.exp,
                  },
            })),
            growth: {
                  statBase: { ...ctx.statAlloc.base },
                  statPoints: ctx.statAlloc.statPoints,
                  rebirthBonus: ctx.statAlloc.rebirthBonus,
                  skillPoints: ctx.skillTree.skillPoints,
                  skillNodeLevels: Object.fromEntries(
                        ctx.skillTree.nodes.map((node) => [node.id, node.currentLevel]),
                  ),
                  isAwakened: ctx.awakening.isAwakened,
                  rebirthCount: ctx.rebirth.rebirthCount,
            },
            settings: {
                  system: ctx.getSystemSettings?.() ?? null,
                  afk: ctx.getAfkState?.() ?? null,
            },
            onboarding: ctx.getOnboardingState?.() ?? null,
            quests: ctx.getQuestState?.() ?? null,
      };
}

function normalizePayload(raw: unknown): SavedGamePayloadV2 | null {
      if (!raw || typeof raw !== 'object') return null;
      const candidate = raw as Partial<SavedGamePayloadV2> & SavedGamePayloadV1;
      const version = toInt(candidate.version, 1);

      if (version >= SAVE_VERSION && candidate.player && candidate.inventory && candidate.growth) {
            return candidate as SavedGamePayloadV2;
      }

      const legacy = candidate as SavedGamePayloadV1;
      if (!legacy.player || !legacy.inventory || !legacy.growth) return null;

      return {
            version: SAVE_VERSION,
            savedAt: String(legacy.savedAt ?? ''),
            schemaMeta: {
                  sourceRows: toInt(legacy.schemaMeta?.sourceRows, getSchemaRows()),
            },
            profile: {
                  heroProfile: null,
            },
            player: {
                  hp: toInt(legacy.player.hp, 1),
                  maxHp: toInt(legacy.player.maxHp, 1),
                  mp: toInt(legacy.player.mp, 1),
                  maxMp: toInt(legacy.player.maxMp, 1),
                  atk: toInt(legacy.player.atk, 1),
                  def: toInt(legacy.player.def, 0),
                  level: toInt(legacy.player.level, 1),
                  exp: toInt(legacy.player.exp, 0),
                  gold: toInt(legacy.player.gold, 0),
                  diamond: toInt(legacy.player.diamond, 0),
            },
            world: {
                  currentZoneId: 'starter_meadow',
                  unlockedZoneIds: ['starter_meadow'],
                  questChapter: toInt(legacy.player.questChapter, 0),
            },
            inventory: legacy.inventory,
            pets: Array.isArray(legacy.pets) ? legacy.pets : [],
            growth: legacy.growth,
            settings: {
                  system: null,
                  afk: null,
            },
            onboarding: null,
            quests: null,
      };
}

function applyCorePlayerState(ctx: RuntimeSaveContext, payload: SavedGamePayloadV2): void {
      ctx.player.stats.level = Math.max(1, toInt(payload.player?.level, 1));
      ctx.player.stats.exp = Math.max(0, toInt(payload.player?.exp, 0));
      ctx.player.stats.atk = Math.max(1, toInt(payload.player?.atk, 1));
      ctx.player.stats.def = Math.max(0, toInt(payload.player?.def, 0));
      ctx.player.stats.maxHp = Math.max(1, toInt(payload.player?.maxHp, 1));
      ctx.player.stats.maxMp = Math.max(1, toInt(payload.player?.maxMp, 1));
      ctx.player.stats.hp = clamp(toInt(payload.player?.hp, ctx.player.stats.maxHp), 0, ctx.player.stats.maxHp);
      ctx.player.stats.mp = clamp(toInt(payload.player?.mp, ctx.player.stats.maxMp), 0, ctx.player.stats.maxMp);
      ctx.player.stats.gold = Math.max(0, toInt(payload.player?.gold, 0));
      ctx.player.stats.diamond = Math.max(0, toInt(payload.player?.diamond, 0));
      ctx.player.stats.questChapter = Math.max(0, toInt(payload.world?.questChapter, 0));
}

function applyGrowthState(ctx: RuntimeSaveContext, payload: SavedGamePayloadV2): void {
      const base = payload.growth?.statBase;
      ctx.statAlloc.base = {
            str: Math.max(1, toInt(base?.str, 5)),
            agi: Math.max(1, toInt(base?.agi, 5)),
            acc: Math.max(1, toInt(base?.acc, 5)),
            int: Math.max(1, toInt(base?.int, 5)),
            attr: Math.max(1, toInt(base?.attr, 5)),
      };
      ctx.statAlloc.statPoints = Math.max(0, toInt(payload.growth?.statPoints, 0));
      ctx.statAlloc.rebirthBonus = Math.max(0, toInt(payload.growth?.rebirthBonus, 0));
      ctx.statAlloc.applyTo(ctx.player.stats);
      ctx.player.stats.hp = clamp(toInt(payload.player?.hp, ctx.player.stats.maxHp), 0, ctx.player.stats.maxHp);
      ctx.player.stats.mp = clamp(toInt(payload.player?.mp, ctx.player.stats.maxMp), 0, ctx.player.stats.maxMp);

      ctx.skillTree.skillPoints = Math.max(0, toInt(payload.growth?.skillPoints, 0));
      const levelMap = payload.growth?.skillNodeLevels ?? {};
      for (const node of ctx.skillTree.nodes) {
            const lv = toInt(levelMap[node.id], 0);
            node.currentLevel = clamp(lv, 0, node.maxLevel);
      }
      ctx.awakening.isAwakened = !!payload.growth?.isAwakened;
      ctx.rebirth.rebirthCount = Math.max(0, toInt(payload.growth?.rebirthCount, 0));
}

function applyInventoryState(ctx: RuntimeSaveContext, payload: SavedGamePayloadV2): void {
      const invItems = Array.isArray(payload.inventory?.items) ? payload.inventory.items : [];
      ctx.inventory.replaceFromSave(
            Math.max(0, toInt(payload.inventory?.gold, 0)),
            invItems.map((item) => ({
                  itemId: String(item.itemId ?? ''),
                  name: String(item.name ?? ''),
                  type: item.type,
                  rarity: item.rarity,
                  qty: Math.max(1, toInt(item.qty, 1)),
                  maxStack: 99,
                  icon: String(item.icon ?? '📦'),
                  description: String(item.description ?? ''),
            })),
      );
      ctx.inventory.totalKills = Math.max(0, toInt(payload.inventory?.totals?.kills, 0));
      ctx.inventory.totalGoldGained = Math.max(0, toInt(payload.inventory?.totals?.goldGained, 0));
      ctx.inventory.totalExpGained = Math.max(0, toInt(payload.inventory?.totals?.expGained, 0));
      ctx.inventory.totalItemsFound = Math.max(0, toInt(payload.inventory?.totals?.itemsFound, 0));
      ctx.player.stats.gold = ctx.inventory.gold;
}

function applyPetState(ctx: RuntimeSaveContext, payload: SavedGamePayloadV2): void {
      ctx.petManager.clearAll();
      const savedPets = Array.isArray(payload.pets) ? payload.pets : [];
      const restored: Array<{ index: number; activeSlot: number }> = [];
      for (const row of savedPets) {
            const pet = ctx.petManager.addPet(row.defId, row.gender);
            if (!pet) continue;
            pet.nickname = String(row.nickname ?? pet.nickname);
            pet.stats.level = Math.max(1, toInt(row.stats?.level, pet.stats.level));
            pet.stats.exp = Math.max(0, toInt(row.stats?.exp, pet.stats.exp));
            pet.stats.maxHp = Math.max(1, toInt(row.stats?.maxHp, pet.stats.maxHp));
            pet.stats.maxMp = Math.max(1, toInt(row.stats?.maxMp, pet.stats.maxMp));
            pet.stats.hp = clamp(toInt(row.stats?.hp, pet.stats.maxHp), 0, pet.stats.maxHp);
            pet.stats.mp = clamp(toInt(row.stats?.mp, pet.stats.maxMp), 0, pet.stats.maxMp);
            pet.stats.str = Math.max(1, toInt(row.stats?.str, pet.stats.str));
            pet.stats.agi = Math.max(1, toInt(row.stats?.agi, pet.stats.agi));
            pet.stats.acc = Math.max(1, toInt(row.stats?.acc, pet.stats.acc));
            pet.stats.luk = Math.max(1, toInt(row.stats?.luk, pet.stats.luk));
            pet.stats.atkMin = Math.max(1, toInt(row.stats?.atkMin, pet.stats.atkMin));
            pet.stats.atkMax = Math.max(pet.stats.atkMin, toInt(row.stats?.atkMax, pet.stats.atkMax));
            pet.stats.hitRate = Math.max(0, toInt(row.stats?.hitRate, pet.stats.hitRate));
            pet.stats.dodgeRate = Math.max(0, toInt(row.stats?.dodgeRate, pet.stats.dodgeRate));
            pet.stats.element = Math.max(0, toInt(row.stats?.element, pet.stats.element));

            if (row.activeSlot >= 0 && row.activeSlot < ctx.petManager.MAX_ACTIVE) {
                  restored.push({ index: ctx.petManager.owned.length - 1, activeSlot: row.activeSlot });
            }
      }
      restored
            .sort((a, b) => a.activeSlot - b.activeSlot)
            .forEach((row) => {
                  if (ctx.petManager.active.length < ctx.petManager.MAX_ACTIVE) {
                        ctx.petManager.deploy(row.index);
                  }
            });
}

export function saveRuntimeGame(ctx: RuntimeSaveContext): RuntimeSaveResult {
      try {
            const payload = buildSavePayload(ctx);
            localKeyValueStore.setJson(STORAGE_KEY, payload);
            localKeyValueStore.remove(LEGACY_STORAGE_KEY);
            return {
                  ok: true,
                  message: 'saved',
                  savedAt: payload.savedAt,
                  version: payload.version,
            };
      } catch (err) {
            return {
                  ok: false,
                  message: err instanceof Error ? err.message : 'save_failed',
            };
      }
}

export async function loadRuntimeGame(ctx: RuntimeSaveContext): Promise<RuntimeSaveResult> {
      const payloadRaw = localKeyValueStore.getJson<unknown>(STORAGE_KEY) ?? localKeyValueStore.getJson<unknown>(LEGACY_STORAGE_KEY);
      if (!payloadRaw) return { ok: false, message: 'no_save' };

      const payload = normalizePayload(payloadRaw);
      if (!payload) return { ok: false, message: 'save_corrupt' };

      applyCorePlayerState(ctx, payload);
      applyGrowthState(ctx, payload);
      applyInventoryState(ctx, payload);
      applyPetState(ctx, payload);

      if (payload.settings.system) ctx.applySystemSettings?.(payload.settings.system);
      if (payload.settings.afk) ctx.applyAfkState?.(payload.settings.afk);
      if (payload.onboarding) ctx.applyOnboardingState?.(payload.onboarding);
      if (payload.quests) ctx.applyQuestState?.(payload.quests);
      if (payload.profile.heroProfile) ctx.applyHeroProfile?.(payload.profile.heroProfile);
      await ctx.applyWorldState?.(payload.world);

      return {
            ok: true,
            message: 'loaded',
            savedAt: String(payload.savedAt ?? ''),
            version: payload.version,
      };
}

export function clearRuntimeSave(): void {
      localKeyValueStore.remove(STORAGE_KEY);
      localKeyValueStore.remove(LEGACY_STORAGE_KEY);
}
