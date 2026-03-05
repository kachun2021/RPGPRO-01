# P4 Summary - World Topology & Teleport Bridge Consolidation

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Introduced shared runtime zone matcher:
  - `src/data/runtime/RuntimeZoneBridge.ts`
- Refactored `WorldMapPanel` to use shared matcher, removing duplicated local exact/keyword/level match code.
- Switched AFK loot-zone monster picker source from legacy `ZoneMonsterData` to runtime monster pools.

## Main Logic Changes

1. **Shared map match logic**
- Added canonical map-name normalization + scene-zone matching API in one place:
  - exact
  - keyword
  - series-floor pattern
  - level fallback
- `WorldMapPanel` now directly calls shared `matchRuntimeMapToSceneZone(...)`.

2. **Duplicate mapping logic removed**
- Deleted `WorldMapPanel` internal mapping constants/methods:
  - local exact-map map
  - local keyword map
  - local `_mapToZoneMatch(...)`
  - unused local region resolver branch tied to old matcher constants

3. **AFK panel runtime alignment**
- `AFKPanel` no longer reads `ZoneMonsterData` mapMon tables.
- AFK monster dropdown now comes from `getRuntimeMonstersForSceneZone(zoneId)`.

## Validation

- `npm run -s typecheck` passed.
- `npm run -s test:smoke` passed all scenarios.

## Notes / Risks

- Runtime matcher now serves both world map and runtime spawn pipeline; future mapping adjustments only need one edit point.

## Next Phase Entry

- P5 will wire player progression and skill metadata to runtime progression tables (`s_LvUserInfo`, `s_SkillProperty`, `s_SkillData`) with low-risk runtime adapter.
