# P2 Summary - Monster Runtime Integration

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Replaced monster spawn source in `MonsterManager` from legacy hand-authored `ZoneMonsterData` to runtime DB data.
- Added runtime monster pipeline module:
  - `src/data/runtime/RuntimeMonsterSource.ts`
- Added shared DB map-to-scene bridge helper:
  - `src/data/runtime/RuntimeZoneBridge.ts`
- Extended `MonsterDef` with optional `spawnWeight` for weighted spawn distribution.

## Main Logic Changes

1. **Spawn data source switched to runtime**
- `MonsterManager` now builds zone monsters from:
  - `world.spawn.json` (`s_mob + s_monster`)
  - `world.topology.json` (`s_zone`)
  - `progression.json` (`s_LvMonInfo`)

2. **Stat generation aligned to DB curves**
- Monster HP/ATK/DEF now derive from DB monster level curve + monster multipliers (`hpRate/statRate`) instead of static `level * k` placeholders.

3. **Scene-zone mapping bridge introduced**
- Runtime zone names are mapped into current 17 scene zones via exact/keyword/series/level fallback matching.
- This keeps current scene cost low while making runtime DB the authoritative spawn distribution source.

4. **Spawn quality improvements**
- Added weighted spawn sampling (`appearRate`-driven) for normal monsters.
- Boss detection uses low-cost heuristic (name/interval/coreRate+level), with max 2 bosses spawned per zone.

## Validation

- `npm run -s typecheck` passed.
- `npm run -s test:smoke` passed all scenarios.
- Smoke state confirms active monsters after replacement:
  - `world.aliveMonsters = 20` in all panel scenarios.

## Notes / Risks

- `AFKPanel` still reads legacy `ZoneMonsterData` for its monster picker list; spawn runtime is already switched, AFK list source migration is planned in follow-up phases.

## Next Phase Entry

- P3 will unify fusion formula source to runtime DB (`fusion.runtime`) so formula logic and map/source displays stay on a single source-of-truth.
