# UI25 Before / After Summary
日期：2026-03-12（Asia/Hong_Kong）
狀態：DONE

## Before
- `book` root scrollHeight 失控：
  - `932x430 targetScrollY = 34139`
  - `667x375 targetScrollY = 33727`
- `resonance` 仍是舊垂直 row 版型：
  - `932x430 targetScrollY = 201`
  - `667x375 targetScrollY = 248`
- compact HUD 還有實際重疊：
  - `667x375 overlapCount = 1`
  - `skillbar` 與 `auto_controls` 相交
- `book` / `resonance` 沒有完整 debug state，smoke / audit 只能看 panel root，無法看主要操作與關鍵資料。
- `ui-refresh.css`、`legacy-panels.css`、`adventure-atlas-batch2.css` 已經不該再作為來源，但檔案仍留在 repo。

## After
- `book` 已回到內部滾動、外層不撐高的 atlas split panel：
  - `932x430 targetScrollY = 0`
  - `667x375 targetScrollY = 0`
- `resonance` 改成 atlas card grid：
  - `932x430 targetScrollY = 0`
  - `667x375 targetScrollY = 0`
- compact HUD 無重疊：
  - `667x375 overlapCount = 0`
- `book` / `resonance` 現在會輸出：
  - `activeTab`
  - `visiblePrimaryActions`
  - `keyDataSummary`
- audit 可由 `scripts/run_ui_panel_audit.ps1` 自動起 server 並重跑。
- 未使用 legacy CSS 已從 repo 移除，主樣式來源收斂到：
  - `src/styles/panels.css`
  - `src/styles/rpg-premium.css`
  - `src/styles/panels/adventure-atlas.css`
  - `src/styles/ui-overhaul.css`

## Evidence
- Audit summary:
  - `D:\AI-RPGGAME\output\ui-audit-step-25\audit-summary.json`
- Key screenshots:
  - `D:\AI-RPGGAME\output\ui-audit-step-25\landscape-large\book.png`
  - `D:\AI-RPGGAME\output\ui-audit-step-25\landscape-compact\book.png`
  - `D:\AI-RPGGAME\output\ui-audit-step-25\landscape-large\resonance.png`
  - `D:\AI-RPGGAME\output\ui-audit-step-25\landscape-compact\resonance.png`
  - `D:\AI-RPGGAME\output\ui-audit-step-25\landscape-compact\hud.png`
