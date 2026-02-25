/**
 * ItemDatabase — Central item definitions for the RPG
 * Covers weapons, armor, consumables, and materials
 */

export type ItemRarity = "common" | "uncommon" | "rare" | "epic";
export type ItemType = "weapon" | "armor" | "helmet" | "accessory" | "consumable" | "material";

export interface ItemDef {
      id: string;
      name: string;
      icon: string;
      rarity: ItemRarity;
      type: ItemType;
      price: number;        // buy price (gold)
      sellPrice: number;    // sell price
      stackable: boolean;
      maxStack: number;
      description: string;
      stats?: {
            atk?: number;
            def?: number;
            hp?: number;
            mp?: number;
      };
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
      common: "#9d9d9d",
      uncommon: "#1eff00",
      rare: "#0070dd",
      epic: "#a335ee",
};

export const RARITY_BG: Record<ItemRarity, string> = {
      common: "rgba(157,157,157,0.15)",
      uncommon: "rgba(30,255,0,0.12)",
      rare: "rgba(0,112,221,0.15)",
      epic: "rgba(163,53,238,0.15)",
};

const ITEMS: ItemDef[] = [
      // ── Weapons ──────────────────────────────
      { id: "iron_sword", name: "Iron Sword", icon: "🗡️", rarity: "common", type: "weapon", price: 200, sellPrice: 80, stackable: false, maxStack: 1, description: "A basic iron blade.", stats: { atk: 15 } },
      { id: "flame_blade", name: "Flame Blade", icon: "🔥", rarity: "uncommon", type: "weapon", price: 800, sellPrice: 320, stackable: false, maxStack: 1, description: "Sword infused with fire.", stats: { atk: 35 } },
      { id: "frost_edge", name: "Frost Edge", icon: "❄️", rarity: "rare", type: "weapon", price: 2500, sellPrice: 1000, stackable: false, maxStack: 1, description: "Razor-sharp ice blade.", stats: { atk: 65 } },
      { id: "void_cleaver", name: "Void Cleaver", icon: "⚔️", rarity: "epic", type: "weapon", price: 8000, sellPrice: 3200, stackable: false, maxStack: 1, description: "Tears through dimensions.", stats: { atk: 120 } },

      // ── Armor ────────────────────────────────
      { id: "leather_vest", name: "Leather Vest", icon: "🧥", rarity: "common", type: "armor", price: 150, sellPrice: 60, stackable: false, maxStack: 1, description: "Basic leather armor.", stats: { def: 10 } },
      { id: "chain_mail", name: "Chain Mail", icon: "🛡️", rarity: "uncommon", type: "armor", price: 600, sellPrice: 240, stackable: false, maxStack: 1, description: "Interlocking chain rings.", stats: { def: 25 } },
      { id: "shadow_plate", name: "Shadow Plate", icon: "🖤", rarity: "rare", type: "armor", price: 2000, sellPrice: 800, stackable: false, maxStack: 1, description: "Darkness-forged plate.", stats: { def: 50, hp: 200 } },
      { id: "dragon_aegis", name: "Dragon Aegis", icon: "🐉", rarity: "epic", type: "armor", price: 7500, sellPrice: 3000, stackable: false, maxStack: 1, description: "Scales of an ancient dragon.", stats: { def: 90, hp: 500 } },

      // ── Helmets ──────────────────────────────
      { id: "iron_helm", name: "Iron Helm", icon: "⛑️", rarity: "common", type: "helmet", price: 100, sellPrice: 40, stackable: false, maxStack: 1, description: "Simple iron head guard.", stats: { def: 5 } },
      { id: "crimson_crown", name: "Crimson Crown", icon: "👑", rarity: "rare", type: "helmet", price: 1500, sellPrice: 600, stackable: false, maxStack: 1, description: "Blood-red crown of power.", stats: { def: 30, atk: 15 } },

      // ── Accessories ──────────────────────────
      { id: "silver_ring", name: "Silver Ring", icon: "💍", rarity: "common", type: "accessory", price: 100, sellPrice: 40, stackable: false, maxStack: 1, description: "Simple silver band.", stats: { hp: 50 } },
      { id: "ember_pendant", name: "Ember Pendant", icon: "🔮", rarity: "uncommon", type: "accessory", price: 500, sellPrice: 200, stackable: false, maxStack: 1, description: "Warm ember glow.", stats: { atk: 10, mp: 100 } },
      { id: "void_amulet", name: "Void Amulet", icon: "🌀", rarity: "epic", type: "accessory", price: 6000, sellPrice: 2400, stackable: false, maxStack: 1, description: "Channels void energy.", stats: { atk: 40, def: 20, mp: 300 } },

      // ── Consumables ──────────────────────────
      { id: "hp_potion", name: "HP Potion", icon: "🧪", rarity: "common", type: "consumable", price: 50, sellPrice: 20, stackable: true, maxStack: 99, description: "Restores 200 HP.", stats: { hp: 200 } },
      { id: "mp_potion", name: "MP Potion", icon: "💧", rarity: "common", type: "consumable", price: 60, sellPrice: 24, stackable: true, maxStack: 99, description: "Restores 150 MP.", stats: { mp: 150 } },
      { id: "elixir", name: "Grand Elixir", icon: "⚗️", rarity: "rare", type: "consumable", price: 500, sellPrice: 200, stackable: true, maxStack: 20, description: "Full HP + MP restore." },
      { id: "atk_scroll", name: "ATK Scroll", icon: "📜", rarity: "uncommon", type: "consumable", price: 300, sellPrice: 120, stackable: true, maxStack: 10, description: "+50 ATK for 60s.", stats: { atk: 50 } },

      // ── Materials ────────────────────────────
      { id: "iron_ore", name: "Iron Ore", icon: "🪨", rarity: "common", type: "material", price: 30, sellPrice: 12, stackable: true, maxStack: 99, description: "Raw iron ore for crafting." },
      { id: "shadow_shard", name: "Shadow Shard", icon: "💎", rarity: "uncommon", type: "material", price: 150, sellPrice: 60, stackable: true, maxStack: 50, description: "Crystallized darkness." },
      { id: "dragon_scale", name: "Dragon Scale", icon: "🐲", rarity: "epic", type: "material", price: 2000, sellPrice: 800, stackable: true, maxStack: 10, description: "Incredibly durable scale." },
];

export class ItemDatabase {
      private static items = new Map<string, ItemDef>();

      static {
            for (const item of ITEMS) {
                  ItemDatabase.items.set(item.id, item);
            }
      }

      public static get(id: string): ItemDef | undefined {
            return ItemDatabase.items.get(id);
      }

      public static getAll(): ItemDef[] {
            return ITEMS;
      }

      public static getByType(type: ItemType): ItemDef[] {
            return ITEMS.filter(i => i.type === type);
      }

      public static getByRarity(rarity: ItemRarity): ItemDef[] {
            return ITEMS.filter(i => i.rarity === rarity);
      }

      public static getShopItems(): ItemDef[] {
            return [
                  ItemDatabase.get("hp_potion")!,
                  ItemDatabase.get("mp_potion")!,
                  ItemDatabase.get("iron_sword")!,
                  ItemDatabase.get("leather_vest")!,
                  ItemDatabase.get("flame_blade")!,
                  ItemDatabase.get("chain_mail")!,
                  ItemDatabase.get("ember_pendant")!,
                  ItemDatabase.get("atk_scroll")!,
            ];
      }

      /**
       * Random loot drop — weighted by rarity
       */
      public static getRandomDrop(): ItemDef {
            const roll = Math.random();
            let rarity: ItemRarity;
            if (roll < 0.03) rarity = "epic";
            else if (roll < 0.15) rarity = "rare";
            else if (roll < 0.40) rarity = "uncommon";
            else rarity = "common";

            const pool = ItemDatabase.getByRarity(rarity);
            return pool[Math.floor(Math.random() * pool.length)];
      }
}
