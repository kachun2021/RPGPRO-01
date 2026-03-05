# P7 Summary - Save Schema Alignment + Ops Message Hook

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Added runtime save manager:
  - `src/systems/RuntimeSaveManager.ts`
  - Local save/load pipeline now persists and restores:
    - player core stats
    - inventory (items + gold + AFK counters)
    - pet roster (owned + active slots + pet stats)
    - growth systems (stat allocation, skill tree levels/SP, awakening flag, rebirth count)
  - Save payload includes runtime `save_schema.json` row-count metadata to keep alignment traceability.

- Connected system UI callbacks to actual save/load logic in `main.ts`:
  - `onSaveProgress` now calls `saveRuntimeGame(...)`
  - `onLoadProgress` now calls `loadRuntimeGame(...)`
  - Post-load refresh hooks: pet panel + HUD + viewport fit.

- Added inventory/pet reset/replace helpers needed by restore flow:
  - `Inventory.replaceFromSave(...)`
  - `Inventory.resetAll()`
  - `PetManager.clearAll()`

- Added runtime ops bridge:
  - `src/data/runtime/RuntimeOpsSource.ts`
  - Rewrote `EggDropSystem` with clean Traditional Chinese copy and periodic runtime server message rotation (`ops.zoneServerMessages`).

## Validation

- `npm run -s typecheck` passed.
- `npm run -s test:smoke` passed all scenarios.
- Visual check: system panel still renders and remains usable after callback wiring.

## Notes / Risks

- Save format is local runtime snapshot (not direct DB row replay), but includes schema alignment metadata and stable restoration paths.
- Legacy encoded strings in some unrelated modules still exist and should be handled in a dedicated i18n/encoding cleanup pass.
