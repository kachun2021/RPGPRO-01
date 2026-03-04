import type { DroppedItem } from './DropTable';
import type { ItemType, ItemRarity } from './DropTable';

export interface InventoryItem {
      itemId: string;
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      qty: number;
      maxStack: number;
      icon: string;
      description: string;
}

type InventoryTab = 'equipment' | 'consumable' | 'material' | 'quest';

const TAB_TYPES: Record<InventoryTab, ItemType[]> = {
      equipment: ['equipment'],
      consumable: ['consumable', 'recipe'],
      material: ['material', 'gold'],
      quest: ['quest', 'egg'],
};

const MAX_STACKS: Record<ItemType, number> = {
      gold: 999999,
      material: 99,
      consumable: 99,
      equipment: 1,
      egg: 1,
      recipe: 1,
      quest: 1,
};

/**
 * Inventory — Data model for player's bag.
 * Supports stacking, tabs, and sorting.
 */
export class Inventory {
      private _items: InventoryItem[] = [];
      private _gold = 0;
      private _onChange: (() => void) | null = null;

      /** Stats tracking for AFK panel */
      totalKills = 0;
      totalGoldGained = 0;
      totalExpGained = 0;
      totalItemsFound = 0;

      get items(): InventoryItem[] { return this._items; }
      get gold(): number { return this._gold; }

      set onChange(cb: (() => void) | null) { this._onChange = cb; }

      addItem(drop: DroppedItem): void {
            // Gold is special — just add to counter
            if (drop.type === 'gold') {
                  this._gold += drop.qty;
                  this.totalGoldGained += drop.qty;
                  this.totalItemsFound++;
                  this._onChange?.();
                  return;
            }

            // Try to stack
            const maxStack = MAX_STACKS[drop.type] ?? 99;
            const existing = this._items.find(i => i.itemId === drop.itemId && i.qty < maxStack);
            if (existing) {
                  existing.qty = Math.min(existing.qty + drop.qty, maxStack);
            } else {
                  this._items.push({
                        itemId: drop.itemId, name: drop.name,
                        type: drop.type, rarity: drop.rarity,
                        qty: drop.qty, maxStack,
                        icon: drop.icon, description: drop.description,
                  });
            }
            this.totalItemsFound++;
            this._onChange?.();
      }

      removeItem(itemId: string, qty: number = 1): boolean {
            const idx = this._items.findIndex(i => i.itemId === itemId);
            if (idx < 0) return false;
            this._items[idx].qty -= qty;
            if (this._items[idx].qty <= 0) this._items.splice(idx, 1);
            this._onChange?.();
            return true;
      }

      getByTab(tab: InventoryTab): InventoryItem[] {
            const types = TAB_TYPES[tab];
            return this._items.filter(i => types.includes(i.type));
      }

      sort(): void {
            this._items.sort((a, b) => {
                  const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
                  const ra = rarityOrder.indexOf(a.rarity);
                  const rb = rarityOrder.indexOf(b.rarity);
                  if (ra !== rb) return ra - rb;
                  return a.name.localeCompare(b.name);
            });
            this._onChange?.();
      }

      get count(): number { return this._items.length; }

      // ── P4 additions ──

      /** Check if player has item with sufficient qty */
      hasItem(itemId: string, qty: number = 1): boolean {
            const item = this._items.find(i => i.itemId === itemId);
            return item ? item.qty >= qty : false;
      }

      /** Spend gold, returns false if insufficient */
      spendGold(amount: number): boolean {
            if (this._gold < amount) return false;
            this._gold -= amount;
            this._onChange?.();
            return true;
      }

      /** Add gold directly */
      addGold(amount: number): void {
            this._gold += amount;
            this._onChange?.();
      }

      /** Use a consumable item — returns effect description or null */
      useItem(itemId: string, stats: { hp: number; maxHp: number; mp: number; maxMp: number }): string | null {
            const item = this._items.find(i => i.itemId === itemId);
            if (!item || item.type !== 'consumable') return null;

            let effect = '';
            switch (itemId) {
                  // From DropTable
                  case 'hp_potion':
                        stats.hp = Math.min(stats.hp + 50, stats.maxHp);
                        effect = 'HP +50';
                        break;
                  case 'mp_potion':
                        stats.mp = Math.min(stats.mp + 30, stats.maxMp);
                        effect = 'MP +30';
                        break;
                  case 'exp_stone':
                        effect = 'EXP +100';
                        break;
                  case 'scroll_atk':
                        effect = 'ATK +10% (60s)';
                        break;

                  // From ShopManager (tiered potions)
                  case 'hp_potion_s':
                        stats.hp = Math.min(stats.hp + 50, stats.maxHp);
                        effect = 'HP +50';
                        break;
                  case 'hp_potion_m':
                        stats.hp = Math.min(stats.hp + 150, stats.maxHp);
                        effect = 'HP +150';
                        break;
                  case 'hp_potion_l':
                        stats.hp = stats.maxHp;
                        effect = 'HP 全回復';
                        break;
                  case 'mp_potion_s':
                        stats.mp = Math.min(stats.mp + 30, stats.maxMp);
                        effect = 'MP +30';
                        break;
                  case 'mp_potion_m':
                        stats.mp = Math.min(stats.mp + 80, stats.maxMp);
                        effect = 'MP +80';
                        break;
                  case 'mp_potion_l':
                        stats.mp = stats.maxMp;
                        effect = 'MP 全回復';
                        break;
                  default:
                        return null;
            }

            this.removeItem(itemId, 1);
            return effect;
      }

      /** Decompose equipment item into gold + materials */
      decomposeEquipment(itemId: string): { goldGained: number; materialName: string } | null {
            const item = this._items.find(i => i.itemId === itemId && i.type === 'equipment');
            if (!item) return null;

            // Gold based on rarity
            const goldTable: Record<string, number> = {
                  common: 20, uncommon: 50, rare: 120, epic: 300, legendary: 800,
            };
            const goldGained = goldTable[item.rarity] ?? 20;

            this.removeItem(itemId, 1);
            this.addGold(goldGained);

            // Add material
            this.addItem({
                  itemId: 'essence_shard', name: '精華碎片',
                  type: 'material', rarity: 'common',
                  qty: 1, icon: '💎', description: '裝備分解所得的材料',
            });

            return { goldGained, materialName: '精華碎片' };
      }
}

