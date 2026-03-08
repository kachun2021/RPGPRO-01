# P7 Player Death And Revive Loop

## Scope
- Step: `P7`
- Goal: replace raw `hp=0` behavior with a complete player life-state loop covering death, revive pending, revive protection, and town return.

## Implemented
- Added player life-state module:
  - [PlayerLifeStateMachine.ts](/D:/AI-RPGGAME/src/systems/PlayerLifeStateMachine.ts)
  - states: `alive`, `down`, `revive_pending`, `revived`
- Added death overlay UI:
  - [PlayerDeathOverlay.ts](/D:/AI-RPGGAME/src/ui/PlayerDeathOverlay.ts)
  - supports `原地復活`, `回城復活`, `停止掛機`
- Updated [ZoneManager.ts](/D:/AI-RPGGAME/src/world/ZoneManager.ts) with:
  - `getSafeRespawnPoint()`
  - `getSpawnPoint()`
  - `findNearestTownZoneId()`
  - `travelTo(..., { ignoreLock: true })` for forced town respawn
- Updated [main.ts](/D:/AI-RPGGAME/src/main.ts) to:
  - route incoming player damage through the life-state machine
  - stop combat/teleport/item pickup while down or revive pending
  - clear target and AUTO on death
  - perform field revive or forced town revive
  - add `6s` revive protection
  - expose life state in `render_game_to_text`

## Validation
- `npm run -s typecheck`
- `npm run -s build`
- `npm run -s test:smoke`
- `npm run -s ci:guardrails`
- Manual browser verification:
  - [death overlay](/D:/AI-RPGGAME/output/web-game/manual-life-revival/death-overlay.png)
  - [town revive result](/D:/AI-RPGGAME/output/web-game/manual-life-revival/after-town-revive.png)
  - [state.json](/D:/AI-RPGGAME/output/web-game/manual-life-revival/state.json)

## Verified Behavior
- Forced debug damage transitions player from `alive` to `down`.
- Town revive now relocates player from `starter_meadow` to `town_helsper`.
- `render_game_to_text` reports:
  - `lifeState: "down"` after death
  - `lifeState: "revived"` after recovery
  - positive `invulnerabilitySec` during protection window
- Post-revive town scene has `aliveMonsters: 0`, confirming safe-town recovery.

## Notes
- The revive loop is now closed and testable.
- A new `window.__fpoDebug` hook was added to support deterministic death/revive checks and later smoke coverage.
