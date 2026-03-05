# P8 Summary - Anti-Duplication Guardrails

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Removed dead legacy file:
  - `src/world/ZoneMonsterData.ts`

- Added legacy usage guard script:
  - `scripts/gamedb/check_legacy_usage.mjs`
  - Checks `src/**/*.ts` for forbidden legacy patterns, including:
    - `ZoneMonsterData` imports
    - `mixmaster_recipes.json` imports
    - legacy fusion payload imports
    - direct `scripts/gamedb` bypass imports in runtime code
  - Also fails if forbidden legacy files still exist.

- Added npm command:
  - `gamedb:check-legacy`

## Validation

- `npm run -s gamedb:check-legacy` passed.
- `npm run -s typecheck` passed.
- `npm run -s test:smoke` passed all scenarios.

## Outcome

- Runtime integration now has an automated guardrail to prevent reintroducing dual-source logic and stale legacy paths.
