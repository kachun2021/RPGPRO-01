# P3 Summary - Fusion Formula Source Unification

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Added runtime fusion guide aggregator:
  - `src/data/runtime/RuntimeFusionGuide.ts`
- Switched fusion-center formula data source from external `mixmaster_recipes.json` to runtime DB outputs.
- Updated gameplay fusion lookup (`PetFusion`) to use runtime fusion guide as primary source.
- Updated encyclopedia meta build to use runtime fusion guide for level/drop/map hints.

## Main Logic Changes

1. **Single fusion source for UI formulas**
- `FusionPanel` now builds formula entries from runtime data (`s_mix` + runtime monster/map metadata), not from legacy mixmaster JSON.
- Header source label updated to `GAME DB s_mix（runtime）`.

2. **Runtime fusion metadata enrichment**
- New guide module composes:
  - recipe: `fusion.runtime`
  - monster level/race/drop: `world.spawn`
  - map distribution: `world.topology`
- Exposes normalized entries with:
  - 主/副/結果名稱
  - 等級
  - 系別
  - 掉蛋
  - 出沒地圖
  - 配方調整值

3. **Fusion gameplay lookup bridge**
- `PetFusion` now reads runtime fusion guide first.
- If runtime entries cannot map to current playable PET definitions, it keeps safe fallback to existing PET_DEFS formulas to avoid gameplay break.

4. **Encyclopedia consistency**
- `EncyclopediaPanel` now builds pet meta from runtime fusion guide instead of old mixmaster payload, reducing data source divergence.

## Validation

- `npm run -s typecheck` passed.
- `npm run -s test:smoke` passed all scenarios.

## Notes / Risks

- Current playable pet pool is still limited to existing PET_DEFS; runtime has much larger monster universe. Runtime formulas are now authoritative in guide/UI, while non-mappable gameplay formulas still require staged PET data expansion.

## Next Phase Entry

- P4 will refactor map/teleport bridge into shared runtime matcher usage across map + related panels, removing duplicated matching logic and improving consistency.
