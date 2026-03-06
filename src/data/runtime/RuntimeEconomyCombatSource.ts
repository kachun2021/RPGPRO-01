import coreRaw from './economy.combat.core.json';
import {
      buildItemMetaMap,
      clamp01,
      cloneItemMeta,
      type EconomyItemRow,
      type EconomyMobDropRow,
      type RuntimeEconomyItemMeta,
      type RuntimeMobDropTable,
      toInt,
} from './RuntimeEconomyShared';

interface EconomyCombatPayload {
      combatItems?: EconomyItemRow[];
      virtualItems?: EconomyItemRow[];
      mobDrops?: EconomyMobDropRow[];
      meta?: {
            starterLevelCap?: number;
      };
}

interface RuntimeEconomyCombatCache {
      itemByIdx: Map<number, RuntimeEconomyItemMeta>;
      mobDropByIdx: Map<number, RuntimeMobDropTable>;
}

const CORE_DATA = coreRaw as EconomyCombatPayload;
const STARTER_LEVEL_CAP = Math.max(1, toInt(CORE_DATA.meta?.starterLevelCap, 30));

let CACHE: RuntimeEconomyCombatCache | null = null;
let EXT_LOADED = false;
let EXT_LOADING: Promise<void> | null = null;

function mergePayload(target: RuntimeEconomyCombatCache, payload: EconomyCombatPayload): void {
      const itemRows = Array.isArray(payload.combatItems) ? payload.combatItems : [];
      const virtualRows = Array.isArray(payload.virtualItems) ? payload.virtualItems : [];
      const mobDropRows = Array.isArray(payload.mobDrops) ? payload.mobDrops : [];

      const mergedMeta = buildItemMetaMap(itemRows, virtualRows);
      for (const [idx, meta] of mergedMeta.entries()) {
            target.itemByIdx.set(idx, meta);
      }

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
            target.mobDropByIdx.set(idx, {
                  idx,
                  baseMoney: Math.max(0, toInt(row.base_money, 0)),
                  bonusMoney: Math.max(0, toInt(row.bonus_money, 0)),
                  slots,
            });
      }
}

function ensureCache(): RuntimeEconomyCombatCache {
      if (CACHE) return CACHE;
      const cache: RuntimeEconomyCombatCache = {
            itemByIdx: new Map<number, RuntimeEconomyItemMeta>(),
            mobDropByIdx: new Map<number, RuntimeMobDropTable>(),
      };
      mergePayload(cache, CORE_DATA);
      CACHE = cache;
      return CACHE;
}

export async function ensureRuntimeCombatDropsForZoneLevel(levelMin: number): Promise<void> {
      if (levelMin <= STARTER_LEVEL_CAP) return;
      if (EXT_LOADED) return;
      if (EXT_LOADING) return EXT_LOADING;

      EXT_LOADING = import('./economy.combat.ext.json')
            .then((mod) => {
                  const cache = ensureCache();
                  mergePayload(cache, mod.default as EconomyCombatPayload);
                  EXT_LOADED = true;
            })
            .catch((err) => {
                  console.warn('[RuntimeEconomyCombat] Failed to load deferred combat economy payload.', err);
            })
            .finally(() => {
                  EXT_LOADING = null;
            });

      return EXT_LOADING;
}

export function getRuntimeCombatItemMetaByIdx(itemIdx: number): RuntimeEconomyItemMeta | null {
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
            description: `DB道具 #${normalizedIdx}（戰鬥資料缺少映射）`,
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

