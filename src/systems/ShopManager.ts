/**
 * ShopManager — NPC shop items data + buy/sell logic.
 * 6 categories: weapon, armor, accessory, potion, pet_food, scroll
 */

import type { Inventory } from './Inventory';
import type { ItemType, ItemRarity } from './DropTable';

export type ShopCategory = 'weapon' | 'armor' | 'accessory' | 'potion' | 'pet_food' | 'scroll';

export interface ShopItem {
      id: string;
      name: string;
      category: ShopCategory;
      price: number;
      icon: string;
      description: string;
      itemType: ItemType;
      rarity: ItemRarity;
}

export const SHOP_CATEGORIES: { id: ShopCategory; label: string; icon: string }[] = [
      { id: 'weapon', label: '武器', icon: '⚔️' },
      { id: 'armor', label: '防具', icon: '🛡️' },
      { id: 'accessory', label: '飾品', icon: '💎' },
      { id: 'potion', label: '藥水', icon: '🧪' },
      { id: 'pet_food', label: '寵糧', icon: '🍖' },
      { id: 'scroll', label: '卷軸', icon: '📜' },
];

const SHOP_ITEMS: ShopItem[] = [
      // ── Weapons ──
      { id: 'shop_sword_lv10', name: '銅劍', category: 'weapon', price: 200, icon: '⚔️', description: 'ATK+12 (Lv.10)', itemType: 'equipment', rarity: 'common' },
      { id: 'shop_sword_lv30', name: '鋼劍', category: 'weapon', price: 800, icon: '⚔️', description: 'ATK+20 DEF+3 (Lv.30)', itemType: 'equipment', rarity: 'uncommon' },
      { id: 'shop_sword_lv60', name: '秘銀劍', category: 'weapon', price: 2500, icon: '⚔️', description: 'ATK+35 DEF+5 (Lv.60)', itemType: 'equipment', rarity: 'rare' },

      // ── Armor ──
      { id: 'shop_armor_lv10', name: '銅甲', category: 'armor', price: 250, icon: '🛡️', description: 'DEF+8 HP+40 (Lv.10)', itemType: 'equipment', rarity: 'common' },
      { id: 'shop_armor_lv30', name: '鋼甲', category: 'armor', price: 900, icon: '🛡️', description: 'DEF+15 HP+80 (Lv.30)', itemType: 'equipment', rarity: 'uncommon' },
      { id: 'shop_helm_lv10', name: '銅盔', category: 'armor', price: 180, icon: '🪖', description: 'DEF+5 HP+25 (Lv.10)', itemType: 'equipment', rarity: 'common' },

      // ── Accessories ──
      { id: 'shop_ring_lv10', name: '銅戒指', category: 'accessory', price: 300, icon: '💎', description: 'ATK+5 MP+20', itemType: 'equipment', rarity: 'common' },
      { id: 'shop_necklace_lv10', name: '銅項鏈', category: 'accessory', price: 350, icon: '📿', description: 'DEF+3 HP+30 MP+10', itemType: 'equipment', rarity: 'common' },

      // ── Potions ──
      { id: 'hp_potion_s', name: 'HP藥水(小)', category: 'potion', price: 30, icon: '🧪', description: 'HP +50', itemType: 'consumable', rarity: 'common' },
      { id: 'hp_potion_m', name: 'HP藥水(中)', category: 'potion', price: 80, icon: '🧪', description: 'HP +150', itemType: 'consumable', rarity: 'uncommon' },
      { id: 'hp_potion_l', name: 'HP藥水(大)', category: 'potion', price: 200, icon: '🧪', description: 'HP 全回復', itemType: 'consumable', rarity: 'rare' },
      { id: 'mp_potion_s', name: 'MP藥水(小)', category: 'potion', price: 30, icon: '💧', description: 'MP +30', itemType: 'consumable', rarity: 'common' },
      { id: 'mp_potion_m', name: 'MP藥水(中)', category: 'potion', price: 80, icon: '💧', description: 'MP +80', itemType: 'consumable', rarity: 'uncommon' },
      { id: 'mp_potion_l', name: 'MP藥水(大)', category: 'potion', price: 200, icon: '💧', description: 'MP 全回復', itemType: 'consumable', rarity: 'rare' },

      // ── Pet Food ──
      { id: 'pet_food_basic', name: '普通寵糧', category: 'pet_food', price: 50, icon: '🍖', description: '寵物EXP +100', itemType: 'consumable', rarity: 'common' },
      { id: 'pet_food_premium', name: '高級寵糧', category: 'pet_food', price: 200, icon: '🥩', description: '寵物EXP +500', itemType: 'consumable', rarity: 'uncommon' },

      // ── Scrolls ──
      { id: 'protect_scroll', name: '保護卷軸', category: 'scroll', price: 500, icon: '📜', description: '強化失敗時防止降級', itemType: 'consumable', rarity: 'rare' },
      { id: 'reso_potion', name: '共鳴藥水', category: 'scroll', price: 300, icon: '🔮', description: '共鳴升級時額外消耗', itemType: 'consumable', rarity: 'uncommon' },
      { id: 'teleport_scroll', name: '傳送卷軸', category: 'scroll', price: 100, icon: '🌀', description: '傳送至主城', itemType: 'consumable', rarity: 'common' },
];

export class ShopManager {
      private _items: ShopItem[] = SHOP_ITEMS;

      /** Get all items for a category */
      getByCategory(cat: ShopCategory): ShopItem[] {
            return this._items.filter(i => i.category === cat);
      }

      /** Get all shop items */
      get allItems(): ShopItem[] { return this._items; }

      /** Buy an item — deducts gold, adds to inventory */
      buy(itemId: string, qty: number, inventory: Inventory): boolean {
            const item = this._items.find(i => i.id === itemId);
            if (!item) return false;
            const totalCost = item.price * qty;
            if (!inventory.spendGold(totalCost)) return false;
            for (let i = 0; i < qty; i++) {
                  inventory.addItem({
                        itemId: item.id,
                        name: item.name,
                        type: item.itemType,
                        rarity: item.rarity,
                        qty: 1,
                        icon: item.icon,
                        description: item.description,
                  });
            }
            return true;
      }

      /** Sell an item — removes from inventory, adds 50% gold */
      sell(itemId: string, qty: number, inventory: Inventory): number {
            const item = this._items.find(i => i.id === itemId);
            // Non-shop items sell for flat 10g each
            const basePrice = item ? item.price : 20;
            const sellPrice = Math.floor(basePrice * 0.5) * qty;
            if (!inventory.removeItem(itemId, qty)) return 0;
            inventory.addGold(sellPrice);
            return sellPrice;
      }

      /** Get sell price for an item */
      getSellPrice(itemId: string): number {
            const item = this._items.find(i => i.id === itemId);
            return Math.floor((item ? item.price : 20) * 0.5);
      }
}
