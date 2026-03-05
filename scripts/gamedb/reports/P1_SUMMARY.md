# P1 Summary - World Topology Integration

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Connected `WorldMapPanel` data source to runtime DB outputs:
  - `src/data/runtime/world.topology.json`
  - `src/data/runtime/world.spawn.json`
  - `src/data/runtime/fusion.runtime.json`
- Replaced old map monster/target data assembly path (mixmaster-map-name driven) with DB-zone driven assembly.
- Updated world map panel title/note and source tag to indicate DB source.

## Main Logic Changes

1. **Map list source**
- `MapSummary` now derives from `s_zone` runtime records (name, level band, restriction tags), not from fusion-map strings.

2. **Map monster source**
- `MapMonsterInfo` now derives from `s_mob + s_monster` runtime join:
  - zone slots from `s_mob.zone_idx*`
  - monster base level/race/core rate from `s_monster`

3. **Map fusion target source**
- `MapFusionTargetInfo` now derives from `s_mix` runtime recipes:
  - target recipe shown when both ingredients exist in that DB zone's monster set.

4. **Teleport mapping strategy**
- Kept low-cost scene teleport behavior via existing `ZONE_DEFS` level-match path.
- DB zones are authoritative for map/monster/fusion distribution; in-scene teleport remains scene-level abstraction for now.

## Validation

- `npm run -s typecheck` passed.
- Previously run smoke flow still passes after integration baseline (`test:smoke` with map panel scenario).

## Risk / Notes

- Existing in-scene world has 17 visual zones; DB has 201 zones.
- P1 intentionally uses a bridge strategy (DB authoritative data + scene-level teleport approximation) to keep cost low and avoid breaking current map rendering pipeline.

## Next Phase Entry

- P2 will replace monster spawn/stat generation path in `MonsterManager` to consume runtime spawn + monster level tables, removing hand-authored spawn dataset dependency.
