# P10 Phone Landscape Combat HUD

## Scope
- Step: `P10`
- Goal: rebalance combat HUD for phone-landscape so left-thumb movement and right-thumb combat controls sit in usable zones, instead of spreading the battle UI across too many corners.

## Implemented
- Updated phone-landscape HUD CSS in [index.html](/D:/AI-RPGGAME/index.html):
  - compressed portrait strip
  - tightened bottom nav scale
  - moved skill bar into a compact right-thumb 2-column grid
  - moved AUTO/settings controls into the same right-thumb lane
  - preserved large enough touch areas for the combat cluster

## Validation
- `npm run -s typecheck`
- `npm run -s build`
- `npm run -s ci:guardrails`
- Manual phone-landscape capture:
  - [combat HUD screenshot](/D:/AI-RPGGAME/output/web-game/manual-combat-hud/combat-hud-phone-landscape.png)
  - [state.json](/D:/AI-RPGGAME/output/web-game/manual-combat-hud/state.json)

## Verified Layout Outcome
- On `932x430`, joystick remains isolated on the left-thumb side.
- Skill buttons render as a compact `2 x 4` action grid on the lower-right.
- AUTO/settings stack now sits adjacent to the skill cluster instead of floating as a separate distant corner control.
- Bottom navigation remains available but is visually compressed below the combat lane.

## Notes
- This is a layout pass, not a full HUD redesign.
- The underlying world still has placeholder geometry in some scenes, so combat readability is improved mainly through control placement, not background cleanup.
