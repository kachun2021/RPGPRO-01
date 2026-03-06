# P14 Summary - Encoding Audit + Repair Pipeline Unification + Virtual Item Precision

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

### 1) Garbled Text Audit (Code + Runtime)

- Full scan executed across game runtime/code files (`src/**/*.ts|json|html|css`) for:
  - Unicode replacement char (`U+FFFD`)
  - Private-use chars (`U+E000..U+F8FF`)
- Result: **0 files hit** in `src`.
- Conclusion:
  - Most "亂碼" seen in terminal logs was PowerShell/codepage display behavior.
  - Actual game/runtime files are UTF-8 readable.

### 2) Repair Source Unification (Maintainability)

- Canonical repair source kept at:
  - `scripts/gamedb/reference_runtime_repairs.json`
- Runtime snapshot is now generated into:
  - `src/data/runtime/reference.repairs.json`
- `build_runtime.py` cleanup:
  - removed legacy `reference_overrides` reporting path.
  - writes `reference.repairs.json` together with other runtime outputs.

### 3) Validation Logic De-duplication

- `validate_relations.py` no longer applies `reference_overrides` patching logic.
- Validation is now two-stage and explicit:
  - **raw**: original source-table FK quality
  - **effective**: runtime-repaired FK quality
- New diagnostics now cleanly separate:
  - `suppressedByRuntimeRepairsTotal`
  - `suppressedByOverridesTotal` (kept for compatibility, now 0)

### 4) 4369 / 4371 Precision Upgrade (No Alias)

- Removed item alias mapping for these IDs.
- Added as independent virtual items (player-readable):
  - `4369`: `特殊藥水` (type 2, price 200)
  - `4371`: `魔力恢復藥水` (type 2, price 1000)
- Also normalized virtual alchemy names to player-friendly wording (`煉金...`).

### 5) Existing Item Name Mojibake Cleanup (Source-safe)

- Added `itemNameOverrides` in `reference_runtime_repairs.json` for known bad `s_item.name` rows:
  - `516`: `未知魚`
  - `5003`: `[模板]帕荅拳套`
  - `5404`: `帕荅的皮`
  - `5603`: `帕荅拳套`
- Runtime build now applies these overrides during `economy.items` generation without mutating source tables.
- `itemEffectiveData` names are now sanitized and auto-linked to `s_item` names by `item_idx`, fixing the previously broken rows (`9500..9507`) in runtime output.

## Data Correctness Outcome

After rebuild/validate:

- Validation summary:
  - `totalChecks=52`
  - `passedChecks=52`
  - `failedChecks=0`
  - `rawInvalidRefsTotal=81`
  - `invalidRefsTotal=0`
  - `suppressedByRuntimeRepairsTotal=81`
  - `suppressedByOverridesTotal=0`

- Economy runtime stats:
  - `virtualItemCount=20` (was 18, +4369/+4371)
  - `aliasedItemCount=0`
  - `shopCatalogRows=1299`
  - `economy` string fields containing `?`: `0`

- Mob drop reference repair remains valid:
  - `sourceMobItemIdx=645 -> mobItemIdx=644` still active.

## UI/Diagnostics Adjustment

- `SystemPanel` DATA tab now prefers runtime-repair metric display:
  - `suppressedByRuntimeRepairsTotal` fallback to old field if absent.
  - label updated to data-repair meaning.

## Verification

- `npm run -s gamedb:p0` passed.
- `npm run -s gamedb:check-legacy` passed.
- `npm run -s typecheck` passed.
- `npm run -s build` passed.
- `npm run -s test:smoke` passed all scenarios.

## Result

- Repair path is now **single-source + generated runtime snapshot**.
- 4369/4371 are now semantically explicit items, not alias shadows.
- Runtime remains fully usable while preserving raw-source quality visibility.
