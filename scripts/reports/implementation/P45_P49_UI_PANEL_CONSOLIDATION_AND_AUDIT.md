# P45-P49 UI Panel Consolidation And Landscape Audit
日期：2026-03-12（Asia/Hong_Kong）
狀態：DONE

## 1. 目標
- 完成本輪 phone-landscape / atlas panel 收尾。
- 把 `book`、`resonance` 與剩餘 modal/panel 的樣式來源收斂到主樣式層。
- 清掉已拔掉 import 的 legacy CSS 殘留。
- 讓 smoke / audit 對 panel 狀態、主操作與關鍵資料有可觀測輸出。

## 2. STEP 01-25 執行紀錄

### STEP 01
- 重新比對 `output/ui-audit-step-25/audit-summary.json`，確認最後兩個紅點是：
  - `book` root `targetScrollY`
  - `resonance` root `targetScrollY`

### STEP 02
- 盤點現有 atlas panel 模板與 header helper，確認後續 unfinished panel 一律回到：
  - `createPanelHeader(...)`
  - `ui-panel-atlas`
  - `PanelRegistry` debug state

### STEP 03
- `src/ui/AFKPanel.ts`
  - 換成共用 atlas header
  - 加入 `afk-panel-shell`

### STEP 04
- `src/ui/CommunityPanel.ts`
  - 換成共用 atlas header
  - header summary 改為 `comm-header-pill`

### STEP 05
- `src/ui/DialoguePanel.ts`
  - 統一成 `sa-panel ui-panel-atlas dialogue-modal`
  - 改用 atlas header 與 `dlg-header-pill`

### STEP 06
- `src/ui/RenamePanel.ts`
  - modal chrome 改用 atlas header
  - 收斂為 `rename-header-pill`

### STEP 07
- `src/ui/RevivalPanel.ts`
  - modal chrome 改用 atlas header
  - 收斂為 `revival-header-pill`

### STEP 08
- `src/styles/index.css`
  - 移除已收斂來源的 import：
    - `src/styles/ui-refresh.css`
    - `src/styles/panels/legacy-panels.css`
    - `src/styles/panels/adventure-atlas-batch2.css`

### STEP 09
- `src/styles/panels.css`
  - 新增 AFK / Community / Dialogue / Rename / Revival 的 consolidated atlas block。

### STEP 10
- `src/styles/panels.css`
  - 補上 fusion backdrop / player death overlay 的統一樣式。

### STEP 11
- `scripts/ui_panel_audit.py`
  - 輸出新增：
    - `activeTab`
    - `visiblePrimaryActions`
    - `keyDataSummary`
    - `targetScrollX/Y`
    - `visibleOverflowTotal`
    - `visibleOverflowNodes`

### STEP 12
- `scripts/task_smoke_runner.mjs`
  - smoke assertion 改要求 panel 提供：
    - `visiblePrimaryActions`
    - `keyDataSummary`
  - summary rows 也補出同欄位。

### STEP 13
- `src/styles/rpg-premium.css`
  - 加上 compact landscape HUD 的最終勝出 override，避免被 `hud.css` 蓋回舊定位。

### STEP 14
- `src/styles/rpg-premium.css`
  - 進一步上移 compact `skillbar`，消除 `667x375` 下 `skillbar` 與 `auto_controls` 的 overlap。

### STEP 15
- `src/ui/EncyclopediaPanel.ts`
  - header 改用 `createPanelHeader(...)`
  - 新增 `getDebugState()`
  - 輸出目前篩選條件與 selected pet

### STEP 16
- `src/ui/EncyclopediaPanel.ts`
  - 新增 `_ensureSelectedPet(...)`
  - 避免 filter 改變後 header / detail 仍引用失效 selection

### STEP 17
- `src/styles/panels.css`
  - 把先前只存在於 `ui-refresh.css` / `legacy-panels.css` 的 `book` 核心 layout 約束搬回主樣式層：
    - `book-unified-root`
    - `book-filter-row`
    - `book-split`
    - `book-pane`
    - `book-pane-list`
    - `book-detail-pane`
    - `book-action-row`

### STEP 18
- `src/styles/panels.css`
  - 補 `book` icon sizing 規則，修正 detail series icon 被當成原尺寸圖片放大、導致 panel root scrollHeight 爆掉的問題。

### STEP 19
- `src/ui/ResonancePanel.ts`
  - `SERIES_NAMES` 從錯誤的 lowercase key 改成真正的 `PetSeries` key。
  - 修正系列名稱 fallback 成英文 enum 的邏輯漂移。

### STEP 20
- `src/ui/ResonancePanel.ts`
  - 改用 atlas header + `reso-header-pill`
  - 新增 `getDebugState()`

### STEP 21
- `src/ui/ResonancePanel.ts`
  - 舊垂直 row UI 改成 responsive card grid。
  - compact landscape 下維持首屏可見 CTA。

### STEP 22
- `src/ui/ResonancePanel.ts`
  - 修正升級回饋：
    - success / error toast 分離
    - `applyResonance` 失敗時不吞金幣
    - 藥水只在成功升級後扣除

### STEP 23
- 新增 `scripts/run_ui_panel_audit.ps1`
  - 自動起 dev server
  - 執行 `scripts/ui_panel_audit.py`
  - 結束後自動關閉自有 dev server

### STEP 24
- 刪除已無 import 的 legacy 樣式檔：
  - `src/styles/ui-refresh.css`
  - `src/styles/panels/legacy-panels.css`
  - `src/styles/panels/adventure-atlas-batch2.css`

### STEP 25
- 重新執行完整驗證：
  - `npm run -s typecheck`
  - `npm run -s build`
  - `pwsh -File ./scripts/task_smoke.ps1 -Profile landscape -Artifacts always -RenderMode lite`
  - `pwsh -File ./scripts/run_ui_panel_audit.ps1 -OutputDir D:\AI-RPGGAME\output\ui-audit-step-25`
- 最終 audit：
  - `book` large/compact `targetScrollY = 0`
  - `resonance` large/compact `targetScrollY = 0`
  - `hud 667x375 overlapCount = 0`

## 3. 產出檔案
- `src/ui/EncyclopediaPanel.ts`
- `src/ui/ResonancePanel.ts`
- `src/styles/panels.css`
- `src/styles/rpg-premium.css`
- `scripts/run_ui_panel_audit.ps1`
- `output/ui-audit-step-25/*`

## 4. 驗證結論
- 最終 `ui_panel_audit` 針對 `932x430` 與 `667x375` 的核心 capture 已達成：
  - `targetOverflowTotal = 0`
  - `targetScrollX = 0`
  - `targetScrollY = 0`
  - `visibleOverflowTotal = 0`
  - `overlapCount = 0`（含 compact HUD）
- `landscape` smoke 24 個 scenario 全部通過。
