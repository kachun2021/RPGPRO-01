# P9 Mobile Camera And Runtime Controls

## Scope
- Step: `P9`
- Goal: make mobile camera drag real, and wire control settings into runtime instead of leaving them as localStorage-only placeholders.

## Implemented
- Updated [LandscapeCamera.ts](/D:/AI-RPGGAME/src/input/LandscapeCamera.ts):
  - added right-half touch drag camera control
  - added runtime sensitivity
  - added invert-Y support
  - preserved desktop right-click orbit
- Updated [TouchJoystick.ts](/D:/AI-RPGGAME/src/input/TouchJoystick.ts):
  - added joystick sensitivity setter
  - applied sensitivity to analog magnitude
- Updated [Player.ts](/D:/AI-RPGGAME/src/entities/Player.ts):
  - movement now respects analog strength instead of always normalizing to full speed
- Updated [CombatLoop.ts](/D:/AI-RPGGAME/src/combat/CombatLoop.ts):
  - added runtime `autoLockTarget` hook for nearby reacquire after a kill
- Updated [main.ts](/D:/AI-RPGGAME/src/main.ts):
  - `SystemPanel` settings now apply immediately to joystick, camera, and auto-lock runtime behavior
  - added debug helpers for deterministic camera-state verification

## Validation
- `npm run -s typecheck`
- `npm run -s build`
- `npm run -s test:smoke`
- `npm run -s ci:guardrails`
- Manual control verification:
  - [camera screenshot](/D:/AI-RPGGAME/output/web-game/manual-camera-controls/camera-test.png)
  - [camera state](/D:/AI-RPGGAME/output/web-game/manual-camera-controls/state.json)

## Verified Runtime Behavior
- Horizontal right-half drag changed camera `alpha` from `-1.5708` to `1.4532`.
- Vertical drag with normal Y clamped `beta` down to `0.5`.
- The same vertical drag with inverted Y pushed `beta` up to `1.4`.
- This confirms:
  - touch camera drag is active
  - sensitivity is being applied
  - invert Y is being applied in runtime

## Notes
- `graphicsQuality`, `resolutionScale`, `showFps`, and audio routing are still part of later system/runtime passes.
- This step specifically closes the mobile camera + core control wiring gap.
