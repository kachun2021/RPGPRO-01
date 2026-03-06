# P23-P27 實作報告（核心邏輯 + 體驗穩定 + 維護收斂）

日期：2026-03-07  
範圍：P23, P24, P25, P26, P27

## 1) 目標
- 修正會影響核心流程的 P0 問題（主線解鎖、章節進度、NPC 互動、地圖解鎖邏輯）。
- 補上 P1 快修（社交面板真實狀態、重置安全、inline style 收斂、打包切塊優化）。
- 保持現有功能可用，不破壞既有子界面流程。

## 2) 本次修改

### P23：主線解鎖與章節進度正確化
- 調整主線每 5 章解鎖地圖 ID，對齊現行 scene zone：
  - `5 -> misty_forest`
  - `10 -> crystal_caves`
  - `15 -> ancient_ruins`
  - `20 -> frost_peaks`
  - `25 -> dark_hollow`
- 任務領獎後 `questChapter` 更新改為「以本次剛領取的主線任務章節」為準，避免 `find()` 拿到第一筆已完成章節導致卡章。

涉及檔案：
- `src/systems/QuestManager.ts`
- `src/ui/QuestPanel.ts`

### P24：NPC 點擊監聽生命週期修正
- `NPCManager` 增加 pointer observer 持有與釋放機制。
- `spawnForZone()` 前會先清理舊 observer；`despawnAll()/dispose()` 也會移除 observer。
- 無 NPC 的地區不再掛 pointer observer。
- NPC 提示氣泡改成 class 狀態控制（`is-hidden` / `is-clickable`），減少無必要 inline style。

涉及檔案：
- `src/entities/NPC.ts`
- `index.html`（NPC prompt class 樣式）

### P25：地圖解鎖 fallback 改為「安全降級」
- 移除「拓撲稀疏時直接全地圖解鎖」。
- 新策略：
  1. 先解鎖當前區 + 一圈鄰接。
  2. 若仍不足，再嘗試二圈鄰接。
  3. 若依舊稀疏，僅補 2 個低等非城鎮區，避免死局但不破壞 progression。

涉及檔案：
- `src/world/ZoneManager.ts`

### P26：社交面板真實化 + 重置安全
- 社交面板新增「開發中」提示 Banner，避免玩家誤判功能故障。
- 好友狀態、隊伍、公會的動作按鈕在非 live 模式會顯示禁用態（`disabled + is-disabled`）。
- 系統「重置全部」從 `localStorage.clear()` 改為僅刪除 `fpo` 前綴 keys（`^fpo([._]|$)`），避免誤刪同網域其他資料。

涉及檔案：
- `src/ui/CommunityPanel.ts`
- `src/main.ts`
- `index.html`（社交 banner / disabled 樣式）

### P27：inline style 收斂 + 打包切塊優化
- `FusionPanel` 開關動畫改成 class state（`is-visible` / `is-active`），移除大量 inline `display/opacity/transform`。
- `PetPanel` 改為 `is-open` 狀態 class 管理顯示。
- `QuestPanel` / `SkillPanel` / `CommunityPanel` 顯示狀態改用 `hidden`；補上 `#ui-layer [hidden]{display:none!important}` 避免隱藏面板攔截點擊。
- Vite 切塊調整：
  - `vendor-babylon`（Babylon 相關）
  - `vendor`（其餘 node_modules）
  - `runtime-data`（`src/data/runtime/*.json`）

涉及檔案：
- `src/ui/FusionPanel.ts`
- `src/ui/PetPanel.ts`
- `src/ui/QuestPanel.ts`
- `src/ui/SkillPanel.ts`
- `src/ui/CommunityPanel.ts`
- `index.html`
- `vite.config.ts`

## 3) 驗證結果

### 編譯/型別/流程
- `npm run -s typecheck`：通過
- `npm run -s build`：通過
- `npm run -s test:smoke`：通過（10/10 scenario）

### 重要校驗
- 主線解鎖 ID 與 scene profiles 對照：無無效 ID。
- 之前隱藏面板攔截點擊問題已修正（`hidden` 強制 display none）。

## 4) 指標變化
- inline style 使用數（`src/ui src/world src/systems`）：
  - 之前：`119`
  - 現在：`91`

## 5) 目前可接受但需知
- `runtime-data` chunk 仍很大（資料量本身造成）；目前屬可接受狀態，但首載時間仍受資料規模影響。
- inline style 尚未完全清零；剩餘多為動態尺寸/位置/顏色（屬合理動態），與個別面板歷史碼。

## 6) 後續建議（下一輪）
1. 針對 `SkillPanel/CharacterPanel/SystemPanel` 持續收斂 style state，目標 < 70。  
2. 進一步做 runtime data lazy loading（按面板/功能分段載入），降低首載。  
3. 社交面板接真實資料源前，保留「開發中」標示，避免玩家誤解。  
