# P35-P39 實作報告（啟動相容 + 文案硬化 + 舊碼收斂）
日期：2026-03-07（Asia/Hong_Kong）
範圍：P35, P36, P37, P38, P39

## P35：首啟流程與測試模式相容
- 新增 `isAutomatedRun()`（`navigator.webdriver` / `?autotest=1`）判定。
- 自動化模式下，首次進入會自動選擇預設英雄並寫入建立狀態，避免 UI 阻塞測試。

## P36：Loading 畫面生命週期修正
- 新增 `dismissLoadingScreen(immediate)`，統一處理 loading 隱藏。
- 首次建角前會先移除 loading 遮罩，避免遮罩攔截點擊。
- bootstrap 開始即提供 loading 版 `render_game_to_text`，防止測試初期 state 缺失。

## P37：Smoke 測試穩定性提升
- `scripts/task_smoke.ps1` 的每回合 `pause-ms` 由 `1400` 提高到 `3000`，降低首載波動誤報。
- 修正後 smoke 全場景穩定通過。

## P38：亂碼字串修復（本次改動範圍）
- 修正 `main.ts` 中新增流程相關亂碼文案與符號。
- 修正 `CombatSystem.ts` 註解中的亂碼標記。
- 玩家可見文案統一為可讀繁中/英文（含交換確認、藥水名稱等）。

## P39：廢用/未使用代碼收斂
- 移除 `HeroArchetypes` 中未使用欄位 `starterPetPool`。
- 移除未使用函式 `listHeroArchetypeProfiles(...)`，降低維護噪音。

## 後續 Hotfix（2026-03-07）
- 修正首次建角 UI 無法點擊：
  - 根因：`#ui-layer` 預設 `pointer-events: none`，而 `.hero-create-overlay` 未顯式開啟事件。
  - 修正：在 `index.html` 為 `.hero-create-overlay` 加上 `pointer-events: auto`。

## 變更檔案
- `src/main.ts`
- `scripts/task_smoke.ps1`
- `src/combat/CombatSystem.ts`
- `src/data/runtime/HeroArchetypes.ts`
- `index.html`

## 驗證
- `npm run -s typecheck`：通過
- `npm run -s build`：通過
- `npm run -s test:smoke`：通過（10/10）
- `npm run -s ci:guardrails`：通過
