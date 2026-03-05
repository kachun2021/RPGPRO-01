Original prompt: 做 Web 遊戲自動化測試（啟動、操作、UI 流程、回歸檢查）如何自動化使用最佳SKILL?例如TASK完結自動化測試是否正確?

## 2026-03-05

- Added npm scripts:
  - `test:smoke`
  - `test:smoke:headed`
  - `task:done`
  - `task:done:headed`
  - `hooks:install`
- Added Playwright action payloads:
  - `scripts/playwright-actions/idle.json`
  - `scripts/playwright-actions/move-and-idle.json`
- Added `scripts/task_smoke.ps1`:
  - starts/uses dev server
  - runs develop-web-game Playwright client scenarios
  - fails on console/page errors
  - validates key UI panel visibility through `state-0.json`
  - writes screenshots/state under `output/web-game/task-smoke`
- Expanded smoke scenarios to include:
  - Shop / Map / Pet / AFK panel checks
  - Combat auto-grind toggle check (`world.autoGrind = true`)
  - Monster presence check (`world.aliveMonsters >= 1`)
- Added retry logic for transient Playwright context-destroyed failures.
- Added `scripts/task_done.ps1` as strict task completion gate (`typecheck` + `test:smoke`).
- Added Git hook tooling:
  - `.githooks/pre-push`
  - `scripts/install_git_hooks.ps1`
  - configured `core.hooksPath=.githooks`
- Exposed `window.render_game_to_text()` in `src/main.ts` for deterministic state assertions.
- Verified:
  - `npm run typecheck` passed.
  - `npm run test:smoke` passed for baseline movement + quest/inventory/skill/system panel scenarios.
  - `npm run task:done` passed with expanded scenarios.
  - `npm run hooks:install` passed and hook path is active.

## TODO / Next Agent

- Add a lightweight CI job to run `npm run test:smoke` on PRs.
- Consider adding `window.advanceTime(ms)` in-game for stricter deterministic stepping (currently shim handles timing).
- 2026-03-05 (layout pass):
  - WorldMap: left column split into `wmp-list-controls` (fixed filter area) + `wmp-zone-list` (scroll list), moved filter/map chips to class-based styles.
  - WorldMap: added detail filter classes (`wmp-nav-row`, `wmp-detail-filters`, `wmp-toggle-chip`, `wmp-min-level-*`) and compact rendering (`is-hidden` recipe row in compact cards).
  - WorldMap: added `is-phone-landscape` responsive mode and CSS for 2-line key actions (larger buttons, tighter cards, hidden secondary tags).
  - Fusion: added `is-phone-landscape` runtime mode; compact labels now apply to both focus mode and phone-landscape mode.
  - Fusion: bottom action text shortens in compact mode (`合成機`).
  - Validation: `npm run -s typecheck` passed; `npm run -s test:smoke` passed all scenarios; manual screenshot confirmed Fusion panel opens and uses split layout (`output/web-game/manual-fusion/shot-0.png`).
  - Note: `npm run -s build` still fails due pre-existing firebase package resolution (`Missing "." specifier in "firebase" package`).
- 2026-03-05 (Fusion inline-style cleanup):
  - Refactored FusionPanel recipe/tree/result rendering to class-based markup (`fpo-pill`, `fpo-tree-node*`, `fpo-formula-*`, `fpo-result-*`, `fpo-map-chip`, `fpo-ingredient-*`).
  - Removed remaining `style=`/`style.cssText` usage in Fusion content rendering; retained only required runtime style for panel open/close animation and per-node indent margin.
  - Refactored bottom GP label, picker icon, slot emoji, protection checkbox, and fusion flash overlay to CSS classes.
  - Validation: `npm run -s typecheck` passed; `npm run -s test:smoke` passed; manual Fusion screenshot verified (`output/web-game/manual-fusion/shot-0.png`).
