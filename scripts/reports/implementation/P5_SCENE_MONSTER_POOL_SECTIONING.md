# P5 Scene Monster Pool Sectioning

## Scope
- Step: `P5`
- Goal: stop scene monster pools from being raw multi-zone dumps, and constrain them into scene-level sets with size caps and level-band heuristics.

## Implemented
- Added scene-pool capping in [RuntimeMonsterSource.ts](/D:/AI-RPGGAME/src/data/runtime/RuntimeMonsterSource.ts).
- Split normal and boss candidates before curation.
- Added scene-aware caps:
  - starter meadow: `8` catalog entries max
  - mid zones: `12`
  - higher zones: `16`
  - endgame zones: `18`
- Added level-band filtering so early scenes prefer monsters around the profile band instead of blindly inheriting all mapped runtime rows.
- Added separate boss-band filtering so event bosses do not automatically leak into every low-level scene.

## Validation
- `npm run -s typecheck`
- `npm run -s build`
- `npm run -s test:smoke`
- `npm run -s ci:guardrails`

## Spot Checks
- `starter_meadow`: normal pool now stays at `Lv.1` only.
- `misty_forest`: pool now resolves to `Lv.13-24` normals and excludes `Lv.200` holiday bosses.
- `baluk_farm`: pool now resolves to `Lv.20-43` normals and excludes `Lv.199-200` boss spillover.

## Notes
- The repository still has a few scene/profile pairs whose configured level labels do not match the actual mapped runtime families, especially later-game scenes such as `training_ground`, `storm_coast`, and some sky zones.
- This step fixes the worst scene-pool contamination and early-game distortion first. Full scene-profile normalization is still a later data pass.
