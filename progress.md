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
- 2026-03-05 (global inline-style cleanup + class unification):
  - Removed all style="..." and style.cssText usage across src/ui (scan result now zero for both patterns).
  - Reworked panel rendering to class-based markup and centralized CSS in index.html helper block.
  - Major rewrites (UTF-8 cleanup + class-first): ChatBox, HUD, SkillBar, SkillPanel, PetPanel, ShopPanel, EncyclopediaPanel, RevivalPanel, RenamePanel, QuestTracker, PetControlBar.
  - Updated existing panels to remove template inline styles (progress bars/labels/cards) in CharacterPanel, QuestPanel, CommunityPanel, DialoguePanel, WorldMapPanel, Minimap, InventoryPanel.
  - Added class-based style hooks for new elements: chatbox/hud/skillbar/pet panel/book panel/revival/rename/world-map note/icons and rarity-color CSS variable hooks.
  - Validation:
    - 
pm run -s typecheck passed.
    - 
pm run -s test:smoke passed all scenarios.

- 2026-03-05 (cleanup before data phase):
  - Removed unreachable dead files: `src/core/AssetLoader.ts`, `src/pets/PetAI.ts`, `src/ui/PanelManager.ts`, `src/ui/PetControlBar.ts`.
  - Added missing script: `scripts/export_fusion_mdb.ps1` (safe no-op when no valid MDB path), so `fusion:export-mdb` no longer points to a missing file.
  - Fixed build blocker: removed stale `firebase` manual chunk from `vite.config.ts`; production build now succeeds.
  - Extracted shared fusion name logic to `src/data/fusion/FusionNameUtils.ts` and replaced duplicated alias/normalize implementations in:
    - `src/pets/PetFusion.ts`
    - `src/ui/FusionPanel.ts`
    - `src/ui/EncyclopediaPanel.ts`
    - `src/ui/WorldMapPanel.ts`
  - Extracted shared fusion payload/list typings to `src/data/fusion/types.ts` and adopted in fusion/map/book/pet-fusion modules.
  - Removed old unused PanelManager backdrop/style remnants from `index.html` (`.panel-backdrop`, `.panel`, `.panel.open`, and `#panelBackdrop` node).
  - Validation:
    - `npm run -s typecheck` passed.
    - `npm run -s build` passed.
    - `npm run -s test:smoke` passed all scenarios.
    - Post-clean dependency graph check: `UNREACHABLE_FROM_MAIN = 0`, `ZERO_INBOUND_NON_ENTRY = 0`.
