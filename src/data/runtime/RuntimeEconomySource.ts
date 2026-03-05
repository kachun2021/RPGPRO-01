import economyRaw from './economy.json';

export type EconomyItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EconomyItemType = 'gold' | 'material' | 'consumable' | 'equipment' | 'egg' | 'recipe' | 'quest';
export type EconomyShopCategory = 'weapon' | 'armor' | 'accessory' | 'potion' | 'pet_food' | 'scroll';

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

interface EconomyItemRow {
      idx?: number;
      name?: string;
      type?: number;
      rarity?: number;
      price?: number;
      isVirtual?: boolean;
}

interface EconomyShopCatalogRow {
      itemIdx?: number;
      itemName?: string;
      price?: number;
}

interface EconomyMobDropRow {
      idx?: number;
      base_money?: number;
      bonus_money?: number;
      [key: string]: unknown;
}

interface EconomyPayload {
      items?: EconomyItemRow[];
      validItems?: EconomyItemRow[];
      virtualItems?: EconomyItemRow[];
      shopCatalog?: EconomyShopCatalogRow[];
      mobDrops?: EconomyMobDropRow[];
}

interface RuntimeEconomyCache {
      itemByIdx: Map<number, RuntimeEconomyItemMeta>;
      shopItems: RuntimeEconomyShopItem[];
      mobDropByIdx: Map<number, RuntimeMobDropTable>;
}

const DATA = economyRaw as EconomyPayload;
let CACHE: RuntimeEconomyCache | null = null;

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

function clamp01(value: number): number {
      if (!Number.isFinite(value)) return 0;
      return Math.max(0, Math.min(1, value));
}

function mapRarity(raw: number): EconomyItemRarity {
      if (raw >= 4) return 'legendary';
      if (raw === 3) return 'epic';
      if (raw === 2) return 'rare';
      if (raw === 1) return 'uncommon';
      return 'common';
}

function mapTypeByName(typeNum: number, name: string): EconomyItemType {
      if (/蛋/.test(name)) return 'egg';
      if (/(配方|食譜|合成書|製作書)/.test(name)) return 'recipe';
      if (/(卷|卷軸|證|卡|票|鑰|喇叭|徽章|藥水|聖水|箱|箱子)/.test(name)) return 'consumable';
      if (/(劍|刀|弓|槍|拳|杖|杖子|盾|甲|盔|帽|鞋|靴|袍|鎧|手套|腰帶|戒|項鍊|耳環|護符)/.test(name)) {
            return 'equipment';
      }
      if (typeNum === 2 || typeNum === 8 || typeNum === 9 || typeNum === 10) return 'consumable';
      if (typeNum === 1 || typeNum === 4 || typeNum === 5 || typeNum >= 50) return 'equipment';
      if (/(任務|通行證|入場證)/.test(name)) return 'quest';
      return 'material';
}

function mapShopCategory(itemType: EconomyItemType, name: string): EconomyShopCategory {
      if (/寵物飼料|飼料|寵糧|寵食/.test(name)) return 'pet_food';

      if (itemType === 'equipment') {
            if (/(劍|刀|弓|槍|拳|杖|武器)/.test(name)) return 'weapon';
            if (/(甲|盔|帽|鞋|靴|袍|鎧|盾|手套)/.test(name)) return 'armor';
            if (/(戒|項鍊|耳環|護符|腰帶)/.test(name)) return 'accessory';
            return 'armor';
      }

      if (itemType === 'consumable' && /(藥水|聖水|恢復|體力|魔法|補給)/.test(name)) return 'potion';
      return 'scroll';
}

function iconByCategory(category: EconomyShopCategory): string {
      switch (category) {
            case 'weapon': return '⚔️';
            case 'armor': return '🛡️';
            case 'accessory': return '💎';
            case 'potion': return '🧪';
            case 'pet_food': return '🍖';
            case 'scroll': return '📜';
            default: return '📦';
      }
}

function ensureCache(): RuntimeEconomyCache {
      if (CACHE) return CACHE;

      const itemRows = Array.isArray(DATA.validItems) && DATA.validItems.length > 0
            ? DATA.validItems
            : (Array.isArray(DATA.items) ? DATA.items : []);
      const virtualRows = Array.isArray(DATA.virtualItems) ? DATA.virtualItems : [];
      const catalogRows = Array.isArray(DATA.shopCatalog) ? DATA.shopCatalog : [];
      const mobDropRows = Array.isArray(DATA.mobDrops) ? DATA.mobDrops : [];

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
            const name = String(row.name ?? '').trim();
            if (!name || name.length <= 1) continue;
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

      const shopPriceByItemIdx = new Map<number, number>();
      for (const row of catalogRows) {
            const itemIdx = toInt(row.itemIdx, 0);
            if (itemIdx <= 0) continue;
            const price = Math.max(1, toInt(row.price, 1));
            const prev = shopPriceByItemIdx.get(itemIdx);
            if (typeof prev !== 'number' || price < prev) {
                  shopPriceByItemIdx.set(itemIdx, price);
            }
      }

      const grouped = new Map<EconomyShopCategory, RuntimeEconomyShopItem[]>();
      for (const [itemIdx, price] of shopPriceByItemIdx) {
            const meta = itemByIdx.get(itemIdx);
            if (!meta) continue;
            const item: RuntimeEconomyShopItem = {
                  id: meta.itemId,
                  sourceItemIdx: itemIdx,
                  name: meta.name,
                  category: meta.category,
                  price,
                  icon: iconByCategory(meta.category),
                  description: `${meta.name}（DB #${itemIdx}）`,
                  itemType: meta.itemType,
                  rarity: meta.rarity,
            };
            let arr = grouped.get(item.category);
            if (!arr) {
                  arr = [];
                  grouped.set(item.category, arr);
            }
            arr.push(item);
      }

      const order: EconomyShopCategory[] = ['weapon', 'armor', 'accessory', 'potion', 'pet_food', 'scroll'];
      const shopItems: RuntimeEconomyShopItem[] = [];
      for (const category of order) {
            const rows = (grouped.get(category) ?? [])
                  .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, 'zh-Hant'))
                  .slice(0, 36);
            shopItems.push(...rows);
      }

      const mobDropByIdx = new Map<number, RuntimeMobDropTable>();
      for (const row of mobDropRows) {
            const idx = toInt(row.idx, 0);
            if (idx <= 0) continue;
            const slots: RuntimeMobDropTable['slots'] = [];
            for (let i = 0; i < 10; i++) {
                  const itemIdx = toInt(row[`item_idx${i}`], 0);
                  const percent = toInt(row[`item_drop_percent${i}`], 0);
                  const count = Math.max(1, toInt(row[`item_drop_count${i}`], 1));
                  if (itemIdx <= 0 || percent <= 0) continue;
                  slots.push({
                        itemIdx,
                        chance: clamp01(percent / 100000),
                        count,
                  });
            }
            mobDropByIdx.set(idx, {
                  idx,
                  baseMoney: Math.max(0, toInt(row.base_money, 0)),
                  bonusMoney: Math.max(0, toInt(row.bonus_money, 0)),
                  slots,
            });
      }

      CACHE = { itemByIdx, shopItems, mobDropByIdx };
      return CACHE;
}

export function getRuntimeShopItems(): RuntimeEconomyShopItem[] {
      return ensureCache().shopItems.map((row) => ({ ...row }));
}

export function getRuntimeItemMetaByIdx(itemIdx: number): RuntimeEconomyItemMeta | null {
      const row = ensureCache().itemByIdx.get(itemIdx);
      if (row) return { ...row };
      if (!Number.isFinite(itemIdx) || itemIdx <= 0) return null;
      const normalizedIdx = Math.floor(itemIdx);
      return {
            sourceItemIdx: normalizedIdx,
            itemId: `db_item_${normalizedIdx}`,
            name: `未知道具 #${normalizedIdx}`,
            itemType: 'material',
            rarity: 'common',
            price: 1,
            category: 'scroll',
            description: `DB道具 #${normalizedIdx}（缺少道具主檔）`,
      };
}

export function getRuntimeMobDropTable(mobItemIdx: number): RuntimeMobDropTable | null {
      const row = ensureCache().mobDropByIdx.get(mobItemIdx);
      if (!row) return null;
      return {
            ...row,
            slots: row.slots.map((slot) => ({ ...slot })),
      };
}
