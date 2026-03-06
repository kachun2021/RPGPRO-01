# P17 Skill Effect/Range Explanation Expansion

Date: 2026-03-06

## Scope
- Expand skill card explanation text using runtime detail fields so players can read effect/range context directly.

## Updated
- `src/ui/SkillPanel.ts`

## Key Changes
- Runtime meta line now includes:
  - target class
  - max target distance
  - area range
  - duration
  - polarity (buff/debuff)
  - affected stat
  - target-range class id
- Added stat formatter helper:
  - `_formatEffectStat(code)`

## Outcome
- Skill cards now expose actionable effect/range semantics from runtime data instead of only damage multiplier/cd/mp.
- Improves player decision quality when configuring auto/manual skill strategies.
