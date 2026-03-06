# P12 Summary - Hero Creation Flow from `progression.heroes`

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Runtime hero template expansion:
  - `src/data/runtime/RuntimeProgression.ts`
  - `RuntimeHeroTemplate` now exposes base attributes from DB hero rows:
    - `baseStr/baseDex/baseAim/baseLuck/baseAtk/baseDef/baseHp/baseMp`
  - Added `listRuntimeHeroTemplates()` for UI/account flow.

- Bootstrap hero selection now runtime-driven:
  - `src/main.ts`
  - Introduced persisted hero selection key:
    - `fpo.hero.type.v1`
  - Startup flow:
    1. Resolve selected hero type from runtime hero list
    2. Build player initial stats from selected hero template (HP/MP/ATK/DEF)
    3. Resolve birth-zone route from topology (`world.topology`) to scene zone
    4. Spawn initial zone by resolved scene zone id

- Account tab hero template control:
  - `src/ui/SystemPanel.ts`
  - Added hero template select in account tab (readonly list from runtime heroes + apply callback).
  - Apply behavior stores selected template for next launch (restart required).

## Data Correctness Check

- Runtime heroes loaded from `progression.heroes`: 4 rows
  - Type 0: 迪特
  - Type 1: 簡
  - Type 2: 芬利
  - Type 3: 波伊
- Birth-zone and base stats now sourced from runtime payload, not static hardcoded role constants.

## Validation

- `npm run -s typecheck` passed.
- `npm run -s gamedb:p0` passed.
- `npm run -s build` passed.
- `npm run -s test:smoke` passed all scenarios.

## Outcome

- Character bootstrap path is unified to runtime DB hero definitions for class/birth/base attributes.
