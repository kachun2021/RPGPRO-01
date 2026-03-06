export type EconomyItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EconomyItemType = 'gold' | 'material' | 'consumable' | 'equipment' | 'egg' | 'recipe' | 'quest';
export type EconomyShopCategory = 'weapon' | 'armor' | 'accessory' | 'potion' | 'pet_food' | 'scroll';

export interface RuntimeEconomyItemMeta {
      sourceItemIdx: number;
      itemId: string;
      name: string;
      itemType: EconomyItemType;
      rarity: EconomyItemRarity;
      price: number;
      category: EconomyShopCategory;
      description: string;
}

export interface RuntimeEconomyShopItem {
      id: string;
      sourceItemIdx: number;
      name: string;
      category: EconomyShopCategory;
      price: number;
      icon: string;
      description: string;
      itemType: EconomyItemType;
      rarity: EconomyItemRarity;
}

export interface RuntimeMobDropTable {
      idx: number;
      baseMoney: number;
      bonusMoney: number;
      slots: Array<{
            itemIdx: number;
            chance: number;
            count: number;
      }>;
}

export interface RuntimeProductionRecipe {
      recipeIdx: number;
      docIdx: number;
      docName: string;
      resultIdx: number;
      resultName: string;
      resultCount: number;
      costGold: number;
      defaultPro: number;
      addPro: number;
      materials: Array<{
            slot: number;
            itemIdx: number;
            itemName: string;
            count: number;
      }>;
}

export interface EconomyItemRow {
      idx?: number;
      name?: string;
      type?: number;
      rarity?: number;
      price?: number;
      isVirtual?: boolean;
}

export interface EconomyShopCatalogRow {
      itemIdx?: number;
      itemName?: string;
      price?: number;
}

export interface EconomyMobDropRow {
      idx?: number;
      base_money?: number;
      bonus_money?: number;
      [key: string]: unknown;
}

export interface EconomyProductionMaterialRow {
      slot?: number;
      itemIdx?: number;
      itemName?: string;
      count?: number;
}

export interface EconomyProductionRow {
      idx?: number;
      docIdx?: number;
      docName?: string;
      resultIdx?: number;
      resultName?: string;
      resultCount?: number;
      money?: number;
      defaultPro?: number;
      addPro?: number;
      materials?: EconomyProductionMaterialRow[];
}

export function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

export function clamp01(value: number): number {
      if (!Number.isFinite(value)) return 0;
      return Math.max(0, Math.min(1, value));
}

export function mapRarity(raw: number): EconomyItemRarity {
      if (raw >= 4) return 'legendary';
      if (raw === 3) return 'epic';
      if (raw === 2) return 'rare';
      if (raw === 1) return 'uncommon';
      return 'common';
}

function hasKeyword(name: string, keywords: readonly string[]): boolean {
      const lower = name.toLowerCase();
      return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

const EGG_KEYWORDS = ['蛋', 'egg'];
const RECIPE_KEYWORDS = ['配方', '卷軸', '图纸', '圖紙', 'recipe', 'scroll'];
const POTION_KEYWORDS = ['藥水', '藥劑', 'potion', 'hp', 'mp'];
const QUEST_KEYWORDS = ['任務', '任务', 'quest'];
const PET_FOOD_KEYWORDS = ['寵物飼料', '宠物饲料', '飼料', '饲料', 'pet food'];
const WEAPON_KEYWORDS = ['劍', '刀', '槍', '弓', '法杖', 'weapon'];
const ARMOR_KEYWORDS = ['盔', '甲', '盾', '靴', '手套', 'armor'];
const ACCESSORY_KEYWORDS = ['戒', '項鍊', '项链', '耳環', '耳环', '護符', 'accessory'];

export function mapTypeByName(typeNum: number, name: string): EconomyItemType {
      const text = String(name ?? '').trim();
      if (hasKeyword(text, EGG_KEYWORDS)) return 'egg';
      if (hasKeyword(text, RECIPE_KEYWORDS)) return 'recipe';
      if (hasKeyword(text, QUEST_KEYWORDS)) return 'quest';
      if (hasKeyword(text, POTION_KEYWORDS)) return 'consumable';

      if (typeNum === 2 || typeNum === 8 || typeNum === 9 || typeNum === 10) return 'consumable';
      if (typeNum === 1 || typeNum === 4 || typeNum === 5 || typeNum >= 50) return 'equipment';
      return 'material';
}

export function mapShopCategory(itemType: EconomyItemType, name: string): EconomyShopCategory {
      const text = String(name ?? '').trim();
      if (hasKeyword(text, PET_FOOD_KEYWORDS)) return 'pet_food';

      if (itemType === 'equipment') {
            if (hasKeyword(text, WEAPON_KEYWORDS)) return 'weapon';
            if (hasKeyword(text, ARMOR_KEYWORDS)) return 'armor';
            if (hasKeyword(text, ACCESSORY_KEYWORDS)) return 'accessory';
            return 'armor';
      }

      if (itemType === 'consumable' && hasKeyword(text, POTION_KEYWORDS)) return 'potion';
      return 'scroll';
}

export function iconByCategory(category: EconomyShopCategory): string {
      switch (category) {
            case 'weapon': return '⚔️';
            case 'armor': return '🛡️';
            case 'accessory': return '💍';
            case 'potion': return '🧪';
            case 'pet_food': return '🍖';
            case 'scroll': return '📜';
            default: return '📦';
      }
}

export function buildItemMetaMap(
      itemRows: EconomyItemRow[],
      virtualRows: EconomyItemRow[],
): Map<number, RuntimeEconomyItemMeta> {
      const mergedRows: EconomyItemRow[] = [...itemRows];
      const mergedIds = new Set<number>();
      for (const row of mergedRows) {
            const idx = toInt(row.idx, 0);
            if (idx > 0) mergedIds.add(idx);
      }
      for (const row of virtualRows) {
            const idx = toInt(row.idx, 0);
            if (idx <= 0 || mergedIds.has(idx)) continue;
            mergedRows.push(row);
            mergedIds.add(idx);
      }

      const itemByIdx = new Map<number, RuntimeEconomyItemMeta>();
      for (const row of mergedRows) {
            const idx = toInt(row.idx, 0);
            if (idx <= 0) continue;
            const rawName = String(row.name ?? '').trim();
            const name = rawName.length > 0 ? rawName : `未知道具 #${idx}`;
            const price = Math.max(1, toInt(row.price, 1));
            const typeNum = toInt(row.type, 0);
            const itemType = mapTypeByName(typeNum, name);
            const category = mapShopCategory(itemType, name);
            itemByIdx.set(idx, {
                  sourceItemIdx: idx,
                  itemId: `db_item_${idx}`,
                  name,
                  itemType,
                  rarity: mapRarity(toInt(row.rarity, 0)),
                  price,
                  category,
                  description: `DB道具 #${idx}`,
            });
      }
      return itemByIdx;
}

export function cloneItemMeta(meta: RuntimeEconomyItemMeta): RuntimeEconomyItemMeta {
      return { ...meta };
}

