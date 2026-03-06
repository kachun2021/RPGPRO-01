# P19 Inline Style Audit (Post-Refactor)

Date: 2026-03-06

## Result
- `Object.assign(...style)` in `src/ui`: **0**
- Remaining `.style.*` assignments: mostly runtime-dynamic updates (show/hide, transforms, cooldown/width, icon background, tooltip positioning).

## Top files by dynamic style assignment count
- `src/ui/SkillBar.ts`: 31
- `src/ui/InventoryPanel.ts`: 30
- `src/ui/FusionPanel.ts`: 12
- `src/ui/SkillPanel.ts`: 12
- `src/ui/PetPanel.ts`: 11

## Interpretation
- Static style payloads were migrated to CSS classes in this pass.
- Remaining assignments are primarily state-driven values that need runtime updates.

## Next low-risk cleanup targets
1. `SkillBar` static color/filter cases -> CSS state classes.
2. `InventoryPanel` tooltip positioning/styles -> class presets + minimal dynamic coordinates.
3. `FusionPanel` open/close animation styles -> class toggles only.
