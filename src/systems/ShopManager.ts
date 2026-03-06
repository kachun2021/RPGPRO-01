/**
 * ShopManager - NPC shop data and buy/sell logic.
 * Runtime commerce data is loaded lazily to keep startup path light.
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
      { id: 'accessory', label: '飾品', icon: '💍' },
      { id: 'potion', label: '藥水', icon: '🧪' },
      { id: 'pet_food', label: '寵糧', icon: '🍖' },
      { id: 'scroll', label: '卷軸', icon: '📜' },
];

const ESSENTIAL_ITEMS: ShopItem[] = [
      { id: 'hp_potion_s', name: 'HP藥水(小)', category: 'potion', price: 30, icon: '🧪', description: 'HP +50', itemType: 'consumable', rarity: 'common' },
      { id: 'hp_potion_m', name: 'HP藥水(中)', category: 'potion', price: 80, icon: '🧪', description: 'HP +150', itemType: 'consumable', rarity: 'uncommon' },
      { id: 'hp_potion_l', name: 'HP藥水(大)', category: 'potion', price: 200, icon: '🧪', description: 'HP 全回復', itemType: 'consumable', rarity: 'rare' },
      { id: 'mp_potion_s', name: 'MP藥水(小)', category: 'potion', price: 30, icon: '💧', description: 'MP +30', itemType: 'consumable', rarity: 'common' },
      { id: 'mp_potion_m', name: 'MP藥水(中)', category: 'potion', price: 80, icon: '💧', description: 'MP +80', itemType: 'consumable', rarity: 'uncommon' },
      { id: 'mp_potion_l', name: 'MP藥水(大)', category: 'potion', price: 200, icon: '💧', description: 'MP 全回復', itemType: 'consumable', rarity: 'rare' },
];

type RuntimeEconomyCommerceModule = typeof import('../data/runtime/RuntimeEconomyCommerceSource');

function parseRuntimeItemIdx(itemId: string): number | null {
      if (!itemId.startsWith('db_item_')) return null;
      const raw = Number(itemId.slice('db_item_'.length));
      if (!Number.isFinite(raw) || raw <= 0) return null;
      return Math.floor(raw);
}

function buildShopItemsFromRuntime(
      runtimeItems: ReturnType<RuntimeEconomyCommerceModule['getRuntimeShopItems']>,
): ShopItem[] {
      const fromRuntime: ShopItem[] = runtimeItems.map((row) => ({
            id: row.id,
            name: row.name,
            category: row.category as ShopCategory,
            price: Math.max(1, row.price),
            icon: row.icon,
            description: row.description,
            itemType: row.itemType as ItemType,
            rarity: row.rarity as ItemRarity,
      }));

      const itemById = new Map<string, ShopItem>();
      for (const item of fromRuntime) itemById.set(item.id, item);
      for (const fallback of ESSENTIAL_ITEMS) {
            if (!itemById.has(fallback.id)) itemById.set(fallback.id, fallback);
      }

      return Array.from(itemById.values()).sort((a, b) => {
            const catOrder: ShopCategory[] = ['weapon', 'armor', 'accessory', 'potion', 'pet_food', 'scroll'];
            const ca = catOrder.indexOf(a.category);
            const cb = catOrder.indexOf(b.category);
            if (ca !== cb) return ca - cb;
            if (a.price !== b.price) return a.price - b.price;
            return a.name.localeCompare(b.name, 'zh-Hant');
      });
}

export class ShopManager {
      private _items: ShopItem[];
      private _runtimeModule: RuntimeEconomyCommerceModule | null = null;
      private _runtimeLoadPromise: Promise<void> | null = null;
      private _runtimeLoaded = false;

      constructor() {
            this._items = [...ESSENTIAL_ITEMS];
      }

      async ensureRuntimeLoaded(): Promise<void> {
            if (this._runtimeLoaded) return;
            if (this._runtimeLoadPromise) return this._runtimeLoadPromise;

            this._runtimeLoadPromise = import('../data/runtime/RuntimeEconomyCommerceSource')
                  .then((mod) => {
                        this._runtimeModule = mod;
                        const runtimeItems = buildShopItemsFromRuntime(mod.getRuntimeShopItems());
                        if (runtimeItems.length > 0) {
                              this._items = runtimeItems;
                        }
                        this._runtimeLoaded = true;
                  })
                  .catch((err) => {
                        console.warn('[ShopManager] Failed to load runtime commerce data; using essentials fallback.', err);
                  })
                  .finally(() => {
                        this._runtimeLoadPromise = null;
                  });

            return this._runtimeLoadPromise;
      }

      getByCategory(cat: ShopCategory): ShopItem[] {
            return this._items.filter((item) => item.category === cat);
      }

      get allItems(): ShopItem[] {
            return this._items;
      }

      buy(itemId: string, qty: number, inventory: Inventory): boolean {
            const item = this._items.find((entry) => entry.id === itemId);
            if (!item) return false;

            const amount = Math.max(1, Math.floor(qty));
            const totalCost = item.price * amount;
            if (!inventory.spendGold(totalCost)) return false;

            inventory.addItem({
                  itemId: item.id,
                  name: item.name,
                  type: item.itemType,
                  rarity: item.rarity,
                  qty: amount,
                  icon: item.icon,
                  description: item.description,
            });
            return true;
      }

      sell(itemId: string, qty: number, inventory: Inventory): number {
            const amount = Math.max(1, Math.floor(qty));
            const sellPrice = this.getSellPrice(itemId) * amount;
            if (!inventory.removeItem(itemId, amount)) return 0;
            inventory.addGold(sellPrice);
            return sellPrice;
      }

      getSellPrice(itemId: string): number {
            const direct = this._items.find((entry) => entry.id === itemId);
            if (direct) return Math.max(1, Math.floor(direct.price * 0.5));

            const runtimeIdx = parseRuntimeItemIdx(itemId);
            if (runtimeIdx && this._runtimeModule) {
                  const meta = this._runtimeModule.getRuntimeCommerceItemMetaByIdx(runtimeIdx);
                  if (meta) return Math.max(1, Math.floor(meta.price * 0.5));
            }

            return 10;
      }
}

