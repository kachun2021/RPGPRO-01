/**
 * DropTable — Drop rate configuration and roll logic.
 * Returns items to spawn when a monster dies.
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'gold' | 'material' | 'consumable' | 'equipment' | 'egg' | 'recipe' | 'quest';

export interface DropEntry {
      itemId: string;
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      chance: number;     // 0.0 ~ 1.0
      minQty: number;
      maxQty: number;
      icon: string;       // emoji
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

/** Universal drop table (all monsters share base drops) */
const BASE_DROPS: DropEntry[] = [
      { itemId: 'gold', name: '金幣', type: 'gold', rarity: 'common', chance: 1.0, minQty: 5, maxQty: 30, icon: '💰', description: '通用貨幣' },
      { itemId: 'exp_stone', name: '經驗石', type: 'consumable', rarity: 'common', chance: 0.3, minQty: 1, maxQty: 2, icon: '💎', description: '使用可獲得經驗值' },
      { itemId: 'herb', name: '草藥', type: 'material', rarity: 'common', chance: 0.2, minQty: 1, maxQty: 3, icon: '🌿', description: '基礎合成材料' },
      { itemId: 'iron_ore', name: '鐵礦', type: 'material', rarity: 'common', chance: 0.15, minQty: 1, maxQty: 2, icon: '⛏️', description: '裝備強化材料' },
      { itemId: 'hp_potion', name: '回復藥水', type: 'consumable', rarity: 'common', chance: 0.12, minQty: 1, maxQty: 1, icon: '🧪', description: '回復 HP 50' },
      { itemId: 'mp_potion', name: '魔力藥水', type: 'consumable', rarity: 'uncommon', chance: 0.08, minQty: 1, maxQty: 1, icon: '💧', description: '回復 MP 30' },
      { itemId: 'scroll_atk', name: '攻擊卷軸', type: 'consumable', rarity: 'uncommon', chance: 0.05, minQty: 1, maxQty: 1, icon: '📜', description: '攻擊力 +10% (60s)' },
      { itemId: 'crystal', name: '魔力水晶', type: 'material', rarity: 'rare', chance: 0.03, minQty: 1, maxQty: 1, icon: '🔮', description: '高級合成材料' },
      { itemId: 'equip_recipe', name: '裝備書', type: 'recipe', rarity: 'rare', chance: 0.02, minQty: 1, maxQty: 1, icon: '📕', description: '可製作裝備' },
];

/** Boss-specific bonus drops */
const BOSS_DROPS: DropEntry[] = [
      { itemId: 'boss_set_piece', name: 'Boss套裝碎片', type: 'equipment', rarity: 'epic', chance: 0.10, minQty: 1, maxQty: 1, icon: '🛡️', description: 'Boss 專屬套裝部件' },
      { itemId: 'rare_crystal', name: '稀有水晶', type: 'material', rarity: 'epic', chance: 0.15, minQty: 1, maxQty: 2, icon: '💠', description: '稀有強化材料' },
      { itemId: 'skill_book', name: '技能書', type: 'recipe', rarity: 'epic', chance: 0.08, minQty: 1, maxQty: 1, icon: '📖', description: '學習新技能' },
];

export class DropTable {
      /** Roll drops for a killed monster */
      rollDrops(monsterLevel: number, isBoss: boolean): DroppedItem[] {
            const results: DroppedItem[] = [];

            // Scale gold by level
            for (const entry of BASE_DROPS) {
                  if (Math.random() <= entry.chance) {
                        let qty = this._rollQty(entry.minQty, entry.maxQty);
                        if (entry.type === 'gold') {
                              qty = Math.floor(qty * (1 + monsterLevel * 0.2));
                        }
                        results.push({
                              itemId: entry.itemId, name: entry.name,
                              type: entry.type, rarity: entry.rarity,
                              qty, icon: entry.icon, description: entry.description,
                        });
                  }
            }

            // Boss bonus
            if (isBoss) {
                  for (const entry of BOSS_DROPS) {
                        if (Math.random() <= entry.chance) {
                              results.push({
                                    itemId: entry.itemId, name: entry.name,
                                    type: entry.type, rarity: entry.rarity,
                                    qty: this._rollQty(entry.minQty, entry.maxQty),
                                    icon: entry.icon, description: entry.description,
                              });
                        }
                  }
            }

            return results;
      }

      private _rollQty(min: number, max: number): number {
            return min + Math.floor(Math.random() * (max - min + 1));
      }
}
