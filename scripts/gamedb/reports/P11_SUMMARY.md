# P11 Summary - Topology-Driven World Map Routing (Hardcode Removal)

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Replaced legacy hardcoded runtime map bridge:
  - Rewrote `src/data/runtime/RuntimeZoneBridge.ts`
  - Removed map-name exact/keyword/series hardcoded dictionaries.
  - Added topology-first route API:
    - `matchRuntimeZoneToSceneZone(...)`
  - Matching now uses runtime zone stats:
    - `min/max level`, `mobAble`, `restriction`, `pkZoneFlag`
    - scene zone ranges from `ZONE_DEFS`

- World map panel switched to topology route input:
  - `src/ui/WorldMapPanel.ts`
  - Teleport mapping now calls `matchRuntimeZoneToSceneZone(...)`.
  - Region label no longer uses manual level-band hardcoding; now derived from topology fields (`mobAble/restriction/pkZoneFlag`).
  - Teleport mode suffix updated to:
    - `topology`, `town`, `level`, `none`

- Runtime monster source switched from map-name routing to zone routing:
  - `src/data/runtime/RuntimeMonsterSource.ts`
  - Spawn-to-scene-zone mapping now uses runtime zone id + topology metadata.

## Hardcode Cleanup Check

- `rg` scan on updated files found no legacy `EXACT_ZONE_MAP/KEYWORD_ZONE_MAP` usages in runtime bridge/map runtime flow.

## Validation

- `npm run -s typecheck` passed.
- `npm run -s gamedb:check-legacy` passed.
- `npm run -s build` passed.
- `npm run -s test:smoke` passed all scenarios.

## Outcome

- World-map teleport and grouping logic now depends on runtime topology data instead of map-name hardcoded dictionaries.
