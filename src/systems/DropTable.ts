/**
 * DropTable - drop rate configuration and roll logic.
 * Runtime-first: uses economy mob-drop tables when available.
 */

import { getRuntimeItemMetaByIdx, getRuntimeMobDropTable } from '../data/runtime/RuntimeEconomySource';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'gold' | 'material' | 'consumable' | 'equipment' | 'egg' | 'recipe' | 'quest';

export interface DropEntry {
      itemId: string;
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      chance: number; // 0.0 ~ 1.0
      minQty: number;
      maxQty: number;
      icon: string;
      description: string;
}

export interface DroppedItem {
      itemId: string;
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      qty: number;
      icon: string;
      description: string;
}

const BASE_DROPS: DropEntry[] = [
      { itemId: 'gold', name: '金幣', type: 'gold', rarity: 'common', chance: 1.0, minQty: 5, maxQty: 30, icon: '🪙', description: '通用貨幣' },
      { itemId: 'exp_stone', name: '經驗石', type: 'consumable', rarity: 'common', chance: 0.3, minQty: 1, maxQty: 2, icon: '🔷', description: '額外經驗值道具' },
      { itemId: 'herb', name: '草藥', type: 'material', rarity: 'common', chance: 0.2, minQty: 1, maxQty: 3, icon: '🌿', description: '製作材料' },
      { itemId: 'iron_ore', name: '鐵礦', type: 'material', rarity: 'common', chance: 0.15, minQty: 1, maxQty: 2, icon: '⛏️', description: '強化材料' },
      { itemId: 'hp_potion', name: 'HP藥水', type: 'consumable', rarity: 'common', chance: 0.12, minQty: 1, maxQty: 1, icon: '🧪', description: '回復 HP 50' },
      { itemId: 'mp_potion', name: 'MP藥水', type: 'consumable', rarity: 'uncommon', chance: 0.08, minQty: 1, maxQty: 1, icon: '🧴', description: '回復 MP 30' },
      { itemId: 'scroll_atk', name: '攻擊卷軸', type: 'consumable', rarity: 'uncommon', chance: 0.05, minQty: 1, maxQty: 1, icon: '📜', description: 'ATK +10%（60秒）' },
      { itemId: 'crystal', name: '水晶', type: 'material', rarity: 'rare', chance: 0.03, minQty: 1, maxQty: 1, icon: '💎', description: '高級材料' },
      { itemId: 'equip_recipe', name: '裝備配方', type: 'recipe', rarity: 'rare', chance: 0.02, minQty: 1, maxQty: 1, icon: '📘', description: '製作配方' },
];

const BOSS_DROPS: DropEntry[] = [
      { itemId: 'boss_set_piece', name: 'Boss 套裝碎片', type: 'equipment', rarity: 'epic', chance: 0.10, minQty: 1, maxQty: 1, icon: '🧩', description: 'Boss 專屬套裝部件' },
      { itemId: 'rare_crystal', name: '稀有水晶', type: 'material', rarity: 'epic', chance: 0.15, minQty: 1, maxQty: 2, icon: '💠', description: '稀有強化材料' },
      { itemId: 'skill_book', name: '技能書', type: 'recipe', rarity: 'epic', chance: 0.08, minQty: 1, maxQty: 1, icon: '📗', description: '學習進階技能' },
];

const BOSS_SET_DROPS: Record<string, DropEntry[]> = {
      default: [
            { itemId: 'boss_helm', name: 'Boss 頭盔', type: 'equipment', rarity: 'legendary', chance: 0.04, minQty: 1, maxQty: 1, icon: '🪖', description: 'Boss 套裝頭盔' },
            { itemId: 'boss_armor', name: 'Boss 胸甲', type: 'equipment', rarity: 'legendary', chance: 0.03, minQty: 1, maxQty: 1, icon: '🥋', description: 'Boss 套裝胸甲' },
            { itemId: 'boss_ring', name: 'Boss 戒指', type: 'equipment', rarity: 'legendary', chance: 0.02, minQty: 1, maxQty: 1, icon: '💍', description: 'Boss 套裝戒指' },
      ],
};

const ZONE_DROPS: Record<string, DropEntry[]> = {
      starter_meadow: [
            { itemId: 'meadow_leaf', name: '草原葉片', type: 'material', rarity: 'common', chance: 0.22, minQty: 1, maxQty: 3, icon: '🍃', description: '新手草原材料' },
            { itemId: 'soft_fur', name: '柔軟毛皮', type: 'material', rarity: 'uncommon', chance: 0.12, minQty: 1, maxQty: 2, icon: '🧶', description: '野獸材料' },
      ],
      misty_forest: [
            { itemId: 'forest_resin', name: '森林樹脂', type: 'material', rarity: 'uncommon', chance: 0.18, minQty: 1, maxQty: 2, icon: '🪵', description: '森林限定材料' },
      ],
      lava_sanctum: [
            { itemId: 'molten_shard', name: '熔岩碎片', type: 'material', rarity: 'rare', chance: 0.10, minQty: 1, maxQty: 2, icon: '🔥', description: '火山限定材料' },
      ],
};

function iconByType(type: ItemType): string {
      switch (type) {
            case 'gold': return '🪙';
            case 'material': return '🔩';
            case 'consumable': return '🧪';
            case 'equipment': return '⚔️';
            case 'egg': return '🥚';
            case 'recipe': return '📘';
            case 'quest': return '❗';
            default: return '📦';
      }
}

export class DropTable {
      /**
       * Roll drops for a killed monster.
       * @param monsterLevel used to scale fallback gold quantity
       * @param isBoss whether killed monster is a boss
       * @param zoneId optional zone identifier for zone-limited drops
       * @param bossId optional boss identifier for boss-set table lookup
       * @param mobItemIdx optional runtime mob-item table index (s_mob.mobitem_idx)
       */
      rollDrops(
            monsterLevel: number,
            isBoss: boolean,
            zoneId?: string,
            bossId?: string,
            mobItemIdx?: number,
      ): DroppedItem[] {
            const results: DroppedItem[] = [];

            const runtimeDrops = this._rollRuntimeDrops(monsterLevel, mobItemIdx);
            if (runtimeDrops.length > 0) {
                  results.push(...runtimeDrops);
            } else {
                  this._appendRolls(results, BASE_DROPS, monsterLevel);
                  const zoneDrops = zoneId ? (ZONE_DROPS[zoneId] ?? []) : [];
                  this._appendRolls(results, zoneDrops, monsterLevel);
            }

            if (isBoss) {
                  this._appendRolls(results, BOSS_DROPS, monsterLevel);
                  const setDrops = BOSS_SET_DROPS[bossId ?? ''] ?? BOSS_SET_DROPS.default;
                  this._appendRolls(results, setDrops, monsterLevel);
            }

            return results;
      }

      private _rollRuntimeDrops(monsterLevel: number, mobItemIdx?: number): DroppedItem[] {
            if (!mobItemIdx || mobItemIdx <= 0) return [];
            const table = getRuntimeMobDropTable(mobItemIdx);
            if (!table) return [];

            const results: DroppedItem[] = [];
            const baseMoney = Math.max(0, table.baseMoney + Math.floor(Math.random() * (table.bonusMoney + 1)));
            if (baseMoney > 0) {
                  results.push({
                        itemId: 'gold',
                        name: '金幣',
                        type: 'gold',
                        rarity: 'common',
                        qty: Math.max(1, Math.floor(baseMoney / 10)),
                        icon: '🪙',
                        description: `怪物金幣（掉落表#${mobItemIdx}）`,
                  });
            }

            for (const slot of table.slots) {
                  if (Math.random() > slot.chance) continue;

                  if (slot.itemIdx === 9999) {
                        const qty = Math.max(5, Math.floor(monsterLevel * 1.6) + Math.floor(Math.random() * 12));
                        results.push({
                              itemId: 'gold',
                              name: '金幣',
                              type: 'gold',
                              rarity: 'common',
                              qty,
                              icon: '🪙',
                              description: `怪物金幣（掉落表#${mobItemIdx}）`,
                        });
                        continue;
                  }

                  const meta = getRuntimeItemMetaByIdx(slot.itemIdx);
                  if (!meta) continue;
                  results.push({
                        itemId: meta.itemId,
                        name: meta.name,
                        type: meta.itemType as ItemType,
                        rarity: meta.rarity as ItemRarity,
                        qty: Math.max(1, slot.count),
                        icon: iconByType(meta.itemType as ItemType),
                        description: `DB道具 #${meta.sourceItemIdx}`,
                  });
            }

            return results;
      }

      private _appendRolls(results: DroppedItem[], table: DropEntry[], monsterLevel: number): void {
            for (const entry of table) {
                  if (Math.random() > entry.chance) continue;
                  let qty = this._rollQty(entry.minQty, entry.maxQty);
                  if (entry.type === 'gold') {
                        qty = Math.floor(qty * (1 + monsterLevel * 0.2));
                  }
                  results.push({
                        itemId: entry.itemId,
                        name: entry.name,
                        type: entry.type,
                        rarity: entry.rarity,
                        qty,
                        icon: entry.icon,
                        description: entry.description,
                  });
            }
      }

      private _rollQty(min: number, max: number): number {
            return min + Math.floor(Math.random() * (max - min + 1));
      }
}

