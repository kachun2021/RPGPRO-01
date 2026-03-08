# P6 Scene Layouts And Gate Layout

## Scope
- Step: `P6`
- Goal: replace flat `200x200` scenes plus radial gate rings with scene-aware layouts, safe zones, roads, obstacles, landmarks, and anchor-based gate placement.

## Implemented
- Added explicit layout data in [world.scene.layouts.json](/D:/AI-RPGGAME/src/data/runtime/world.scene.layouts.json).
- Added layout resolver in [RuntimeSceneLayout.ts](/D:/AI-RPGGAME/src/data/runtime/RuntimeSceneLayout.ts).
- Updated [ZoneRenderer.ts](/D:/AI-RPGGAME/src/world/ZoneRenderer.ts) to:
  - size ground per scene layout
  - place gates from layout anchors instead of always using a circle
  - render safe-zone discs
  - render roads
  - render obstacles and landmarks
- Updated [MonsterManager.ts](/D:/AI-RPGGAME/src/entities/MonsterManager.ts) to spawn against layout pockets instead of center-random positions.

## Coverage
- Explicit custom layouts added for `11` key scenes:
  - `starter_meadow`
  - `misty_forest`
  - `ancient_ruins`
  - `crystal_caves`
  - `baluk_farm`
  - `storm_coast`
  - `dark_hollow`
  - `sky_temple`
  - `town_magilita`
  - `town_migrita`
  - `town_beheru`
- Remaining scenes now use biome-aware fallback layouts instead of the old fixed plane.

## Validation
- `npm run -s typecheck`
- `npm run -s build`
- `npm run -s test:smoke`
- `npm run -s ci:guardrails`
- Visual inspection:
  - [move-baseline screenshot](/D:/AI-RPGGAME/output/web-game/task-smoke/move-baseline/shot-0.png)
  - [map-panel screenshot](/D:/AI-RPGGAME/output/web-game/task-smoke/map-panel/shot-0.png)

## Notes
- The scene language is now structurally correct: spawn/safe zone, combat pockets, and gate anchors are no longer arbitrary.
- Some town and field landmarks are still visually primitive cylinders/boxes; that is acceptable for this step and should be upgraded during later visual polish.
