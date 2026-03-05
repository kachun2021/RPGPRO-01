# P6 Summary - Economy Runtime Integration (Shop + Drops)

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Added runtime economy adapter:
  - `src/data/runtime/RuntimeEconomySource.ts`
  - Normalizes runtime `economy.json` into:
    - shop item list (deduped, categorized, capped per category)
    - item metadata lookup by DB item index
    - mob drop table lookup by `mobitem_idx`

- Shop integration:
  - Reworked `src/systems/ShopManager.ts` to runtime-first item source.
  - Keeps essential potion SKUs as guaranteed fallback (`hp_potion_*`, `mp_potion_*`) for gameplay continuity.
  - Sell-price now supports runtime-backed items (`db_item_<idx>`) through metadata lookup.

- Drop integration:
  - Reworked `src/systems/DropTable.ts` to runtime-first drop rolling via `mobitem_idx`.
  - Supports runtime slot chances/counts and special `item_idx=9999` money token handling.
  - Preserves legacy fallback tables when runtime mob drop data is unavailable.

- Runtime drop chain wiring:
  - `RuntimeMonsterSource` now exposes `mobItemIdx`.
  - `MonsterDef` extended with source identifiers (`sourceMonsterType`, `sourceMobIdx`, `mobItemIdx`).
  - `MonsterManager` forwards runtime source fields into monster defs.
  - `CombatLoop` now passes `mobItemIdx` into drop roll call.

## Validation

- `npm run -s typecheck` passed.
- `npm run -s test:smoke` passed all scenarios.
- Visual check: shop panel screenshot confirms runtime DB item list is rendered in categories.

## Notes / Risks

- Runtime item-type/category mapping is heuristic-based due mixed legacy schema semantics.
- If you want strict official category mapping, next step should add a curated mapping table keyed by `s_item.type` and keyword rules per region build.
