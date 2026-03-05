import saveSchemaRaw from '../data/runtime/save_schema.json';
import type { Player } from '../entities/Player';
import type { Inventory, InventoryItem } from './Inventory';
import type { PetManager } from '../pets/PetManager';
import type { Gender } from '../pets/PetData';
import type { StatAllocation, BaseStats } from './StatAllocation';
import type { SkillTree } from './SkillTree';
import type { AwakeningSystem } from './AwakeningSystem';
import type { RebirthSystem } from './RebirthSystem';

const STORAGE_KEY = 'fpo.save.runtime.v1';

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

interface SavedGamePayload {
      version: number;
      savedAt: string;
      schemaMeta: {
            sourceRows: number;
      };
      player: {
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
            questChapter: number;
      };
      inventory: {
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
      };
      pets: SavedPet[];
      growth: {
            statBase: BaseStats;
            statPoints: number;
            rebirthBonus: number;
            skillPoints: number;
            skillNodeLevels: Record<string, number>;
            isAwakened: boolean;
            rebirthCount: number;
      };
}

export interface RuntimeSaveContext {
      player: Player;
      inventory: Inventory;
      petManager: PetManager;
      statAlloc: StatAllocation;
      skillTree: SkillTree;
      awakening: AwakeningSystem;
      rebirth: RebirthSystem;
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

function cloneInventoryItems(items: InventoryItem[]): SavedGamePayload['inventory']['items'] {
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

export function saveRuntimeGame(ctx: RuntimeSaveContext): { ok: true; savedAt: string } | { ok: false; message: string } {
      try {
            const payload: SavedGamePayload = {
                  version: 1,
                  savedAt: new Date().toISOString(),
                  schemaMeta: {
                        sourceRows: getSchemaRows(),
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
                        questChapter: ctx.player.stats.questChapter,
                  },
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
                              ctx.skillTree.nodes.map((node) => [node.id, node.currentLevel])
                        ),
                        isAwakened: ctx.awakening.isAwakened,
                        rebirthCount: ctx.rebirth.rebirthCount,
                  },
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            return { ok: true, savedAt: payload.savedAt };
      } catch (err) {
            return { ok: false, message: err instanceof Error ? err.message : 'save_failed' };
      }
}

export function loadRuntimeGame(ctx: RuntimeSaveContext): { ok: true; savedAt: string } | { ok: false; message: string } {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ok: false, message: 'no_save' };

      let payload: SavedGamePayload;
      try {
            payload = JSON.parse(raw) as SavedGamePayload;
      } catch {
            return { ok: false, message: 'save_corrupt' };
      }

      // Player core
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
      ctx.player.stats.questChapter = Math.max(0, toInt(payload.player?.questChapter, 0));

      // Growth
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

      // Inventory
      const invItems = Array.isArray(payload.inventory?.items)
            ? payload.inventory.items
            : [];
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
            }))
      );
      ctx.inventory.totalKills = Math.max(0, toInt(payload.inventory?.totals?.kills, 0));
      ctx.inventory.totalGoldGained = Math.max(0, toInt(payload.inventory?.totals?.goldGained, 0));
      ctx.inventory.totalExpGained = Math.max(0, toInt(payload.inventory?.totals?.expGained, 0));
      ctx.inventory.totalItemsFound = Math.max(0, toInt(payload.inventory?.totals?.itemsFound, 0));
      ctx.player.stats.gold = ctx.inventory.gold;

      // Pets
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

      return { ok: true, savedAt: String(payload.savedAt ?? '') };
}
