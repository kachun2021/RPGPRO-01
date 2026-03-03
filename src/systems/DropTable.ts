/**
 * DropTable - drop rate configuration and roll logic.
 * Supports base drops, boss-only drops, boss-set drops and zone-limited drops.
 */

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
      { itemId: 'gold', name: 'Gold', type: 'gold', rarity: 'common', chance: 1.0, minQty: 5, maxQty: 30, icon: '$', description: 'Common currency' },
      { itemId: 'exp_stone', name: 'EXP Stone', type: 'consumable', rarity: 'common', chance: 0.3, minQty: 1, maxQty: 2, icon: 'E', description: 'Gain bonus experience' },
      { itemId: 'herb', name: 'Herb', type: 'material', rarity: 'common', chance: 0.2, minQty: 1, maxQty: 3, icon: 'H', description: 'Crafting material' },
      { itemId: 'iron_ore', name: 'Iron Ore', type: 'material', rarity: 'common', chance: 0.15, minQty: 1, maxQty: 2, icon: 'I', description: 'Enhancement material' },
      { itemId: 'hp_potion', name: 'HP Potion', type: 'consumable', rarity: 'common', chance: 0.12, minQty: 1, maxQty: 1, icon: 'P', description: 'Recover HP 50' },
      { itemId: 'mp_potion', name: 'MP Potion', type: 'consumable', rarity: 'uncommon', chance: 0.08, minQty: 1, maxQty: 1, icon: 'M', description: 'Recover MP 30' },
      { itemId: 'scroll_atk', name: 'ATK Scroll', type: 'consumable', rarity: 'uncommon', chance: 0.05, minQty: 1, maxQty: 1, icon: 'S', description: 'ATK +10% for 60s' },
      { itemId: 'crystal', name: 'Crystal', type: 'material', rarity: 'rare', chance: 0.03, minQty: 1, maxQty: 1, icon: 'C', description: 'High-grade material' },
      { itemId: 'equip_recipe', name: 'Equip Recipe', type: 'recipe', rarity: 'rare', chance: 0.02, minQty: 1, maxQty: 1, icon: 'R', description: 'Crafting recipe' },
];

const BOSS_DROPS: DropEntry[] = [
      { itemId: 'boss_set_piece', name: 'Boss Set Fragment', type: 'equipment', rarity: 'epic', chance: 0.10, minQty: 1, maxQty: 1, icon: 'B', description: 'Boss exclusive set part' },
      { itemId: 'rare_crystal', name: 'Rare Crystal', type: 'material', rarity: 'epic', chance: 0.15, minQty: 1, maxQty: 2, icon: 'X', description: 'Rare enhancement material' },
      { itemId: 'skill_book', name: 'Skill Book', type: 'recipe', rarity: 'epic', chance: 0.08, minQty: 1, maxQty: 1, icon: 'K', description: 'Learn advanced skills' },
];

const BOSS_SET_DROPS: Record<string, DropEntry[]> = {
      default: [
            { itemId: 'boss_helm', name: 'Boss Helm', type: 'equipment', rarity: 'legendary', chance: 0.04, minQty: 1, maxQty: 1, icon: 'H', description: 'Boss set helmet' },
            { itemId: 'boss_armor', name: 'Boss Armor', type: 'equipment', rarity: 'legendary', chance: 0.03, minQty: 1, maxQty: 1, icon: 'A', description: 'Boss set armor' },
            { itemId: 'boss_ring', name: 'Boss Ring', type: 'equipment', rarity: 'legendary', chance: 0.02, minQty: 1, maxQty: 1, icon: 'G', description: 'Boss set ring' },
      ],
      mon_fivetail: [
            { itemId: 'fivetail_mask', name: 'FiveTail Mask', type: 'equipment', rarity: 'legendary', chance: 0.05, minQty: 1, maxQty: 1, icon: 'F', description: 'FiveTail exclusive drop' },
            { itemId: 'fivetail_cloak', name: 'FiveTail Cloak', type: 'equipment', rarity: 'legendary', chance: 0.03, minQty: 1, maxQty: 1, icon: 'C', description: 'FiveTail exclusive drop' },
      ],
};

const ZONE_DROPS: Record<string, DropEntry[]> = {
      starter_meadow: [
            { itemId: 'meadow_leaf', name: 'Meadow Leaf', type: 'material', rarity: 'common', chance: 0.22, minQty: 1, maxQty: 3, icon: 'L', description: 'Starter meadow material' },
            { itemId: 'soft_fur', name: 'Soft Fur', type: 'material', rarity: 'uncommon', chance: 0.12, minQty: 1, maxQty: 2, icon: 'F', description: 'Beast crafting material' },
      ],
      forest_edge: [
            { itemId: 'forest_resin', name: 'Forest Resin', type: 'material', rarity: 'uncommon', chance: 0.18, minQty: 1, maxQty: 2, icon: 'R', description: 'Forest-only material' },
      ],
      volcanic_rim: [
            { itemId: 'molten_shard', name: 'Molten Shard', type: 'material', rarity: 'rare', chance: 0.10, minQty: 1, maxQty: 2, icon: 'V', description: 'Volcanic-only material' },
      ],
};

export class DropTable {
      /**
       * Roll drops for a killed monster.
       * @param monsterLevel used to scale gold quantity
       * @param isBoss whether killed monster is a boss
       * @param zoneId optional zone identifier for zone-limited drops
       * @param bossId optional boss identifier for boss-set table lookup
       */
      rollDrops(monsterLevel: number, isBoss: boolean, zoneId?: string, bossId?: string): DroppedItem[] {
            const results: DroppedItem[] = [];

            this._appendRolls(results, BASE_DROPS, monsterLevel);

            const zoneDrops = zoneId ? (ZONE_DROPS[zoneId] ?? []) : [];
            this._appendRolls(results, zoneDrops, monsterLevel);

            if (isBoss) {
                  this._appendRolls(results, BOSS_DROPS, monsterLevel);
                  const setDrops = BOSS_SET_DROPS[bossId ?? ''] ?? BOSS_SET_DROPS.default;
                  this._appendRolls(results, setDrops, monsterLevel);
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
