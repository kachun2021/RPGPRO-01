# P9 Summary - Data Quality Hardening + Missing Reference Resolution

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Fixed relation validator counting bug:
  - `scripts/gamedb/validate_relations.py` now reports real `badTotal` (full invalid count), not just sampled rows.
  - Added `badKeyCounts` aggregation per check for fast diagnosis.
  - Added dual-quality metrics in report summary:
    - `rawInvalidRefsTotal` (source raw)
    - `invalidRefsTotal` (effective after overrides)
    - `suppressedByOverridesTotal`

- Added override layer for known legacy exceptions:
  - New file: `scripts/gamedb/reference_overrides.json`
  - Supports:
    - `checkIgnoreValues`
    - `checkExtraValidValues`
  - Validator now applies overrides per check-name.

- Added runtime-side missing item synthesis:
  - `scripts/gamedb/build_runtime.py` now creates `economy.virtualItems` from unresolved item references (drop/shop/production).
  - Production material/result names now prefer resolved item names (real item > virtual item > original row name).
  - Shop catalog can now keep rows pointing to virtual items (`isVirtualItem`), avoiding silent data loss.
  - NPC display source in economy runtime now prefers `s_npc_fixed` when available.

- Added runtime economy fallback behavior:
  - `src/data/runtime/RuntimeEconomySource.ts` now merges `virtualItems` into item meta cache.
  - Missing `db_item_<idx>` lookups now return a safe fallback meta object (instead of null), preventing unknown-item dead paths.

## Validation

- `npm run -s gamedb:validate` passed:
  - checks: 52
  - passed: 52
  - failed: 0
  - raw invalid refs: 81
  - effective invalid refs: 0
  - suppressed by overrides: 81
- `npm run -s gamedb:build-runtime` passed.
- `npm run -s typecheck` passed.
- `npm run -s gamedb:check-legacy` passed.
- `npm run -s test:smoke` passed all scenarios.

## Outcome

- Runtime data quality reporting is now accurate and actionable.
- Legacy DB dangling references are now explicitly controlled (override + virtual item synthesis), reducing front-end "missing/unknown data" regressions without introducing dual logic.
