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
}
