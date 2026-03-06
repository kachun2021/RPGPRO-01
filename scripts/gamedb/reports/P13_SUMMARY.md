# P13 Summary - Core Duplicate-Risk Removal + Reference Rationalization

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Removed dual-patch risk in validation pipeline:
  - `scripts/gamedb/validate_relations.py` now reads `reference_runtime_repairs.json` directly.
  - Item / mobitem / zone / npc checks apply runtime normalization before effective validation.
  - Validation payload now exposes both raw and effective deltas:
    - `suppressedByRuntimeRepair`
    - `suppressedByOverride`

- Deleted legacy override dependency:
  - Removed `scripts/gamedb/reference_overrides.json`.
  - Check-level ignore/extra-valid patching is no longer required for current dataset.

- Fixed runtime build blocker:
  - Corrected indentation issue in `scripts/gamedb/build_runtime.py` production-material loop.

## Rationalized Missing-Reference Strategy (Single Source)

Source file: `scripts/gamedb/reference_runtime_repairs.json`

- Item alias (`itemAlias`):
  - `4369 -> 4370`
  - `4371 -> 4372`

- Virtual items (`virtualItems`):
  - `5729..5746` (18 rows) with explicit player-readable names/prices/rarity.

- Mob drop alias (`mobItemAlias`):
  - `645 -> 644`

- NPC/zone repair:
  - `npcBirthZoneAlias`: `248/249/250 -> 130`
  - `syntheticNpcs`: add npc `idx=35` (`修復商人`) for dangling `s_npc_sale.npc_idx` rows.

## Data Correctness Outcome

After rebuild + validate:

- Validation summary:
  - `totalChecks=52`
  - `passedChecks=52`
  - `failedChecks=0`
  - `invalidRefsTotal=0` (effective runtime-usable)
  - `rawInvalidRefsTotal=81` (source still has 81 dangling refs)
  - `suppressedByRuntimeRepairsTotal=81`
  - `suppressedByOverridesTotal=0`

- Runtime economy stats:
  - `virtualItemCount=18`
  - `aliasedItemCount=2`
  - `aliasedMobDropSlots=12`
  - `shopCatalogRows=1269`

## Verification

- `npm run -s gamedb:p0` passed.
- `npm run -s gamedb:check-legacy` passed.
- `npm run -s typecheck` passed.
- `npm run -s build` passed.
- `npm run -s test:smoke` passed all scenarios.

## Result

- Runtime repair logic is centralized in one source.
- Core duplicate-risk path (`reference_overrides` + runtime repairs double path) is removed.
- Game-side runtime data is fully usable while preserving visibility of raw source gaps.
