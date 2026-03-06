# P15 Inline Style Unification (Panel Core)

Date: 2026-03-06

## Scope
- Convert high-maintenance static inline styles to class-based CSS for core subpanels.

## Updated
- `src/ui/Minimap.ts`
- `src/ui/PetPanel.ts`
- `src/ui/RenamePanel.ts`
- `src/ui/RevivalPanel.ts`
- `src/ui/EncyclopediaPanel.ts`
- `src/ui/FusionPanel.ts`
- `index.html`

## Key Changes
- Removed `Object.assign(...style)` usage from the above panel files.
- Added CSS classes for panel roots/backdrop and minimap blocks:
  - `.minimap-root`, `.minimap-header`, `.minimap-body`, `.minimap-coords`
  - `.rename-root`, `.revival-root`, `.book-root`
  - `.fusion-backdrop`, `.fusion-root`
- Pet panel slot sizing moved to classes:
  - `.sa-pet-slot-36`, `.sa-pet-slot-32`, `.sa-pet-slot-grid`
- Minimap collapse now controlled by class state (`.is-collapsed`) instead of per-element style overrides.

## Outcome
- Static style logic centralized in CSS.
- Reduced style-drift risk when iterating UI themes/layout.
- Kept runtime dynamic style updates only for values that must be computed at runtime.
