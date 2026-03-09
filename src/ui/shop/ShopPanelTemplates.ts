import type { ShopCategory, ShopCatalogScope, ShopItem } from '../../systems/ShopManager';
import { SHOP_CATEGORIES } from '../../systems/ShopManager';
import type { InventoryItem } from '../../systems/Inventory';
import {
      getRuntimeCommerceItemMetaByIdx,
      type RuntimeProductionRecipe,
} from '../../data/runtime/RuntimeEconomyCommerceSource';

const RARITY_LABELS: Record<string, string> = {
      common: '普通',
      uncommon: '優秀',
      rare: '稀有',
      epic: '史詩',
      legendary: '傳說',
};

const RARITY_COLORS: Record<string, string> = {
      common: 'rgba(200,195,185,0.5)',
      uncommon: 'rgba(39,174,96,0.7)',
      rare: 'rgba(52,152,219,0.8)',
      epic: 'rgba(155,89,182,0.8)',
      legendary: 'rgba(232,201,106,0.9)',
};

export function buildShopCategoryTabs(category: ShopCategory, buyCatalogScope: ShopCatalogScope): string {
      return `
            <div class="shop-cat-bar shop-scope-bar">
                  <button class="shop-scope-btn rpg-chip rpg-chip-filter${buyCatalogScope === 'starter' ? ' active is-active' : ''}" data-scope="starter">新手精選</button>
                  <button class="shop-scope-btn rpg-chip rpg-chip-filter${buyCatalogScope === 'all' ? ' active is-active' : ''}" data-scope="all">完整目錄</button>
            </div>
            <div class="shop-cat-bar">${SHOP_CATEGORIES.map((cat) => `
            <button class="shop-cat-btn rpg-chip rpg-chip-filter${cat.id === category ? ' active is-active' : ''}" data-cat="${cat.id}">
                  <span class="shop-cat-icon">${buildCategoryMarker(cat.id)}</span>
                  <span class="shop-cat-label">${cat.label}</span>
            </button>
            `).join('')}</div>
      `;
}

export function getShopRarityColor(rarity: string | null | undefined): string {
      return RARITY_COLORS[rarity || 'common'] ?? RARITY_COLORS.common;
}

export function getShopRarityLabel(rarity: string | null | undefined): string {
      return RARITY_LABELS[rarity || 'common'] ?? RARITY_LABELS.common;
}

export function buildShopCraftDetail(
      recipe: RuntimeProductionRecipe,
      craftable: boolean,
      getInventoryCount: (itemId: string) => number,
): string {
      const resultMeta = getRuntimeCommerceItemMetaByIdx(recipe.resultIdx);
      const successRatePct = recipe.defaultPro > 0 ? Math.min(100, recipe.defaultPro / 1000) : 100;
      const materialRows = recipe.materials.map((mat) => {
            const have = getInventoryCount(`db_item_${mat.itemIdx}`);
            const ok = have >= mat.count;
            const materialMeta = getRuntimeCommerceItemMetaByIdx(mat.itemIdx);
            const sourceHint = buildCraftMaterialSourceHint(mat.itemName, materialMeta?.category, materialMeta?.itemType);
            return `
                  <div class="shop-detail-source-item">
                        <div class="shop-detail-row">
                              <span>${mat.itemName}</span>
                              <span class="${ok ? '' : 'insufficient'}">${have}/${mat.count}</span>
                        </div>
                        <div class="shop-detail-source-text">來源：${sourceHint}</div>
                  </div>
            `;
      }).join('');
      const useHint = buildCraftUseHint(recipe.resultName, resultMeta?.itemType, resultMeta?.category);
      return `
            <div class="shop-detail-header">
                  <div class="shop-detail-icon">作</div>
                  <div class="shop-detail-title-wrap">
                        <div class="shop-detail-title">${recipe.resultName}</div>
                        <div class="shop-detail-sub">${recipe.docName}</div>
                  </div>
            </div>
            <div class="shop-detail-body">
                  <div class="shop-detail-desc">製作後可獲得 ${recipe.resultName} x${recipe.resultCount}</div>
                  <div class="shop-detail-tip">
                        <span class="shop-detail-tip-label">用途</span>
                        <span class="shop-detail-tip-text">${useHint}</span>
                  </div>
                  <div class="shop-detail-row"><span>金幣費用</span><span>${recipe.costGold} GP</span></div>
                  <div class="shop-detail-row"><span>成功率</span><span>${successRatePct.toFixed(1)}%</span></div>
                  <div class="shop-detail-source-list">${materialRows}</div>
            </div>
            <button class="shop-action-btn shop-detail-action rpg-op-btn rpg-op-btn-md rpg-op-btn-primary${craftable ? '' : ' disabled is-disabled'}" type="button">${craftable ? '確認製作' : '材料不足'}</button>
      `;
}

export function buildShopBuyDetail(item: ShopItem, qty: number, gold: number): string {
      const totalCost = item.price * qty;
      const canAfford = gold >= totalCost;
      return `
            <div class="shop-detail-header">
                  <div class="shop-detail-icon">${iconForItemType(item.itemType)}</div>
                  <div class="shop-detail-title-wrap">
                        <div class="shop-detail-title">${item.name}</div>
                        <div class="shop-detail-sub">${buildItemTypeText(item.itemType)} · ${getShopRarityLabel(item.rarity)}</div>
                  </div>
            </div>
            <div class="shop-detail-body">
                  <div class="shop-detail-desc">${item.description}</div>
                  <div class="shop-detail-row"><span>單價</span><span>${item.price} GP</span></div>
                  <div class="shop-detail-row">
                        <span>數量</span>
                        <div class="shop-qty-control">
                              <button class="shop-qty-btn minus" type="button">-</button>
                              <span class="shop-qty-num">${qty}</span>
                              <button class="shop-qty-btn plus" type="button">+</button>
                        </div>
                  </div>
                  <div class="shop-detail-row shop-detail-row-total">
                        <span>總價</span>
                        <span class="${canAfford ? '' : 'insufficient'}">${totalCost} GP</span>
                  </div>
            </div>
            <button class="shop-action-btn shop-detail-action rpg-op-btn rpg-op-btn-md rpg-op-btn-primary${canAfford ? '' : ' disabled is-disabled'}" type="button">${canAfford ? '確認購買' : '金幣不足'}</button>
      `;
}

export function buildShopSellDetail(item: InventoryItem, unitSellPrice: number, qty: number): string {
      return `
            <div class="shop-detail-header">
                  <div class="shop-detail-icon">${iconForItemType(item.type)}</div>
                  <div class="shop-detail-title-wrap">
                        <div class="shop-detail-title">${item.name}</div>
                        <div class="shop-detail-sub">出售 · ${getShopRarityLabel(item.rarity)}</div>
                  </div>
            </div>
            <div class="shop-detail-body">
                  <div class="shop-detail-desc">${item.description}</div>
                  <div class="shop-detail-row"><span>庫存</span><span>${item.qty}</span></div>
                  <div class="shop-detail-row"><span>單件可得</span><span class="sell">+${unitSellPrice} GP</span></div>
                  <div class="shop-detail-row">
                        <span>數量</span>
                        <div class="shop-qty-control">
                              <button class="shop-qty-btn minus" type="button">-</button>
                              <span class="shop-qty-num">${qty}</span>
                              <button class="shop-qty-btn plus" type="button">+</button>
                        </div>
                  </div>
                  <div class="shop-detail-row shop-detail-row-total"><span>總計可得</span><span class="sell">+${unitSellPrice * qty} GP</span></div>
            </div>
            <button class="shop-action-btn shop-detail-action rpg-op-btn rpg-op-btn-md rpg-op-btn-secondary" type="button">確認出售</button>
      `;
}

export function buildShopBottomBar(
      mode: 'buy' | 'sell' | 'craft',
      item: { name: string; price: number } | null,
      qty: number,
      gold: number,
): string {
      if (!item) {
            return `
                  <div class="shop-bottom-main">
                        <span class="shop-bottom-label">目前金幣</span>
                        <span class="shop-bottom-value">${gold.toLocaleString()} GP</span>
                  </div>
                  <span class="shop-bottom-hint">請先選擇物品</span>
            `;
      }

      const total = Math.max(1, item.price) * Math.max(1, qty);
      const hint = mode === 'buy'
            ? `購買 ${item.name} x${qty}`
            : mode === 'sell'
                  ? `出售 ${item.name} x${qty}`
                  : `製作 ${item.name} x${qty}`;
      const value = mode === 'buy'
            ? `需支付 ${total.toLocaleString()} GP`
            : mode === 'sell'
                  ? `可獲得 ${total.toLocaleString()} GP`
                  : `需消耗 ${total.toLocaleString()} GP`;
      return `
            <div class="shop-bottom-main">
                  <span class="shop-bottom-label">${hint}</span>
                  <span class="shop-bottom-value${mode === 'sell' ? ' sell' : ''}">${value}</span>
            </div>
            <span class="shop-bottom-hint">目前金幣：${gold.toLocaleString()} GP</span>
      `;
}

export function buildItemTypeText(itemType: ShopItem['itemType']): string {
      switch (itemType) {
            case 'equipment': return '裝備';
            case 'consumable': return '消耗品';
            case 'material': return '材料';
            case 'egg': return '蛋';
            case 'recipe': return '配方';
            case 'quest': return '任務道具';
            default: return '道具';
      }
}

export function iconForItemType(itemType: ShopItem['itemType']): string {
      switch (itemType) {
            case 'equipment': return '裝';
            case 'consumable': return '耗';
            case 'material': return '材';
            case 'egg': return '蛋';
            case 'recipe': return '配';
            case 'quest': return '任';
            default: return '物';
      }
}

function buildCategoryMarker(category: ShopCategory): string {
      switch (category) {
            case 'weapon': return '武';
            case 'armor': return '防';
            case 'accessory': return '飾';
            case 'potion': return '藥';
            case 'pet_food': return '糧';
            case 'scroll': return '卷';
            default: return '物';
      }
}

function buildCraftUseHint(
      resultName: string,
      itemType?: ShopItem['itemType'],
      category?: ShopCategory,
): string {
      const name = resultName.toLowerCase();
      if (itemType === 'equipment') {
            return '優先補空位或替換低階裝備，做完後先回背包確認是否能直接穿上。';
      }
      if (itemType === 'consumable' || category === 'potion' || /藥|potion/.test(name)) {
            return '屬於續戰補給，建議在離村前或長時間掛機前先做 3 到 5 份。';
      }
      if (itemType === 'egg') {
            return '可補收藏或交換線，通常比直接賣掉更有中期價值。';
      }
      if (itemType === 'recipe') {
            return '這是後續製作線的中繼品，先保留，別急著賣。';
      }
      if (/保護|protect/.test(name)) {
            return '適合留給高階強化使用，尤其是 +5 以上再用更划算。';
      }
      if (/卷|scroll|符/.test(name)) {
            return '多半會接到強化或功能線，先放背包，不建議早期脫手。';
      }
      return '通常是後續配方或主線周邊材料，先留著，等上位製作再消耗。';
}

function buildCraftMaterialSourceHint(
      materialName: string,
      category?: ShopCategory,
      itemType?: ShopItem['itemType'],
): string {
      const key = materialName.toLowerCase();
      if (/草|herb/.test(key)) {
            return '新手草原採集點與一般怪掉落最穩。';
      }
      if (/鐵|礦|ore|metal/.test(key)) {
            return '礦區、洞窟與岩系怪常見，先推主線到洞窟線會更快。';
      }
      if (/晶|crystal|魔力/.test(key)) {
            return '洞窟精英、魔力節點與中階採集線比較常出。';
      }
      if (/骨|牙|爪|皮|毛/.test(key)) {
            return '多刷對應野怪即可，這類材料通常靠清怪累積。';
      }
      if (/藥|potion/.test(key) || category === 'potion') {
            return '缺口太大時可先回商店補貨，再回來做高階配方。';
      }
      if (itemType === 'equipment') {
            return '先刷地圖掉裝或拆裝備回收，再回製作所補部位。';
      }
      return '先推主線、清怪與撿掉落；缺料時再回背包比對來源。';
}
