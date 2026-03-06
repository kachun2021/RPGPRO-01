# P16 World Map Runtime Topology Refactor

Date: 2026-03-06

## Scope
- Remove user-facing dependency on legacy zone naming in world map panel.
- Use runtime topology data as the primary map semantic source.

## Updated
- `src/ui/WorldMapPanel.ts`
- `src/data/runtime/RuntimeWorldRoutes.ts`
- `src/ui/AFKPanel.ts`
- `index.html`

## Key Changes
- `WorldMapPanel` summary model extended:
  - `runtimeZoneId`
  - `teleportSceneZoneId`
  - `neighborMaps`
- Teleport buttons now reference runtime-derived scene mapping (`teleportSceneZoneId`) directly.
- Added topology neighbor display chips in map detail (`neighborMaps`) for clearer route context.
- World map no longer shows old `ZONE_DEFS` display names in mapping labels.
- `RuntimeWorldRoutes` rebuilt with clean labels and new export:
  - `getSceneZonePrimaryRuntimeName(sceneZoneId)`
- AFK map labels now prefer runtime map name from topology mapping.

## UI Additions
- New map detail neighbor styles:
  - `.wmp-link-row`
  - `.wmp-link-chip`
  - `.wmp-link-more`

## Outcome
- Player-facing map understanding now aligns with GAME DB topology/zone data.
- Reduced duplicated map concept between “legacy scene names” and “runtime map names”.
