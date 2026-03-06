import commerceRaw from './economy.commerce.json';
import {
      buildItemMetaMap,
      cloneItemMeta,
      iconByCategory,
      type EconomyItemRow,
      type EconomyProductionRow,
      type EconomyShopCatalogRow,
      type EconomyShopCategory,
      type RuntimeEconomyItemMeta,
      type RuntimeEconomyShopItem,
      type RuntimeProductionRecipe,
      toInt,
} from './RuntimeEconomyShared';

export type { RuntimeProductionRecipe, RuntimeEconomyItemMeta, RuntimeEconomyShopItem } from './RuntimeEconomyShared';

interface EconomyCommercePayload {
      validItems?: EconomyItemRow[];
      virtualItems?: EconomyItemRow[];
      shopCatalog?: EconomyShopCatalogRow[];
      production?: EconomyProductionRow[];
}

interface RuntimeEconomyCommerceCache {
      itemByIdx: Map<number, RuntimeEconomyItemMeta>;
      shopItems: RuntimeEconomyShopItem[];
      productionRecipes: RuntimeProductionRecipe[];
}

const DATA = commerceRaw as EconomyCommercePayload;
let CACHE: RuntimeEconomyCommerceCache | null = null;

function ensureCache(): RuntimeEconomyCommerceCache {
      if (CACHE) return CACHE;

      const itemRows = Array.isArray(DATA.validItems) ? DATA.validItems : [];
      const virtualRows = Array.isArray(DATA.virtualItems) ? DATA.virtualItems : [];
      const catalogRows = Array.isArray(DATA.shopCatalog) ? DATA.shopCatalog : [];
      const productionRows = Array.isArray(DATA.production) ? DATA.production : [];

      const itemByIdx = buildItemMetaMap(itemRows, virtualRows);

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

      const categoryOrder: EconomyShopCategory[] = ['weapon', 'armor', 'accessory', 'potion', 'pet_food', 'scroll'];
      const shopItems: RuntimeEconomyShopItem[] = [];
      for (const category of categoryOrder) {
            const rows = (grouped.get(category) ?? [])
                  .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, 'zh-Hant'))
                  .slice(0, 36);
            shopItems.push(...rows);
      }

      const productionRecipes: RuntimeProductionRecipe[] = [];
      for (const row of productionRows) {
            const recipeIdx = toInt(row.idx, 0);
            const resultIdx = toInt(row.resultIdx, 0);
            if (recipeIdx <= 0 || resultIdx <= 0) continue;
            const meta = itemByIdx.get(resultIdx);
            const resultName = String(row.resultName ?? '').trim() || meta?.name || `製作結果 #${resultIdx}`;
            const materials: RuntimeProductionRecipe['materials'] = [];
            const rawMaterials = Array.isArray(row.materials) ? row.materials : [];
            for (const mat of rawMaterials) {
                  const itemIdx = toInt(mat.itemIdx, 0);
                  if (itemIdx <= 0) continue;
                  const itemMeta = itemByIdx.get(itemIdx);
                  const itemName = String(mat.itemName ?? '').trim() || itemMeta?.name || `材料 #${itemIdx}`;
                  materials.push({
                        slot: Math.max(1, toInt(mat.slot, materials.length + 1)),
                        itemIdx,
                        itemName,
                        count: Math.max(1, toInt(mat.count, 1)),
                  });
            }
            productionRecipes.push({
                  recipeIdx,
                  docIdx: Math.max(0, toInt(row.docIdx, 0)),
                  docName: String(row.docName ?? '').trim() || `[配方] ${resultName}`,
                  resultIdx,
                  resultName,
                  resultCount: Math.max(1, toInt(row.resultCount, 1)),
                  costGold: Math.max(0, toInt(row.money, 0)),
                  defaultPro: Math.max(0, toInt(row.defaultPro, 0)),
                  addPro: Math.max(0, toInt(row.addPro, 0)),
                  materials,
            });
      }

      productionRecipes.sort((a, b) => a.costGold - b.costGold || a.resultName.localeCompare(b.resultName, 'zh-Hant'));

      CACHE = { itemByIdx, shopItems, productionRecipes };
      return CACHE;
}

export function getRuntimeShopItems(): RuntimeEconomyShopItem[] {
      return ensureCache().shopItems.map((row) => ({ ...row }));
}

export function getRuntimeCommerceItemMetaByIdx(itemIdx: number): RuntimeEconomyItemMeta | null {
      const row = ensureCache().itemByIdx.get(itemIdx);
      if (row) return cloneItemMeta(row);
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
            description: `DB道具 #${normalizedIdx}（商店子集缺少映射）`,
      };
}

export function getRuntimeProductionRecipes(): RuntimeProductionRecipe[] {
      return ensureCache().productionRecipes.map((row) => ({
            ...row,
            materials: row.materials.map((m) => ({ ...m })),
      }));
}
