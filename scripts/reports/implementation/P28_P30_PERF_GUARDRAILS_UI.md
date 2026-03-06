# P28-P30 實作報告（效能分包 + 邏輯防回歸 + UI 維護收斂）

日期：2026-03-07  
範圍：P28、P29、P30

## P28：效能與資料載入重構

### 目標
- 降低首載壓力，避免把合成/地圖/圖鑑/商店重資料在啟動時全部載入。
- 讓手機橫向場景先進入可玩，再按需開啟重面板資料。

### 已落地
1. 主流程改為懶載入重面板（首次打開才 import）
- `FusionPanel`
- `EncyclopediaPanel`
- `WorldMapPanel`
- `ShopPanel`

2. 主程式新增 lazy ensure/open 流程（含錯誤保護）
- `ensureFusionPanel / ensureEncyclopediaPanel / ensureWorldMapPanel / ensureShopPanel`
- 導航互跳改為透過 async open helper，不再依賴啟動時一次建完所有重面板。

3. 打包切塊重構（runtime data 依領域拆分）
- `runtime-world-data`
- `runtime-fusion-data`
- `runtime-economy-data`
- `runtime-progression-data`
- `runtime-ops-data`
- `runtime-meta-data`
- `vendor-babylon`

### 效果（build 觀察）
- 主入口 JS 約 `428KB -> 288KB`（minified，未含 vendor-babylon）。
- 合成/圖鑑/地圖/商店 UI 變為獨立 chunk，降低首屏同步壓力。

> 備註：`runtime-economy-data` 仍大，因掉落與經濟資料是核心戰鬥流程依賴（非純 UI 可延後資料）。

---

## P29：邏輯防回歸（CI guardrails）

### 新增
- `scripts/ci/guardrails.mjs`
- npm script：`npm run ci:guardrails`

### 檢查項目
1. 主線解鎖地圖 ID 必須都存在於 scene profiles。  
2. 禁止 `src/main.ts` 出現 `localStorage.clear(...)`。  
3. NPC pointer observer 生命週期必須存在（含 `despawnAll/dispose` 清理）。  
4. ZoneManager 不可回到「全圖解鎖 fallback」。  
5. `index.html` 必須保有 `#ui-layer [hidden]` 安全規則。  
6. 主重面板 lazy import token 必須存在（Fusion/Book/Map/Shop）。  
7. inline style 監控門檻（目前上限：95）。  

### 執行結果
- `ci:guardrails`：PASS  
- inline style 使用數：`82`（門檻 `95`）

---

## P30：UI 維護收斂（class state 優先）

### 已做
1. 顯示/隱藏狀態改為 `hidden` / class state（減少 display inline 操作）
- `CharacterPanel`
- `SystemPanel`
- `ShopPanel`
- 前序已完成：`QuestPanel`, `SkillPanel`, `CommunityPanel`, `PetPanel`, `FusionPanel`

2. `FusionPanel` 開關動畫維持 class state
- `is-visible`
- `is-active`

3. 以 `#ui-layer [hidden]{display:none!important}` 避免隱藏面板攔截點擊。

### 指標
- inline style 總數（`src/ui + src/world + src/systems`）目前：`82`

---

## 驗證
- `npm run -s typecheck`：PASS  
- `npm run -s build`：PASS  
- `npm run -s test:smoke`：PASS（10/10 scenario）  
- `npm run -s ci:guardrails`：PASS

---

## 仍需關注
- `runtime-economy-data` 仍為大型 chunk（核心經濟 + 掉落資料），若要再降首載需進一步把「戰鬥即時必需」與「商店/製作可延後」資料拆開，屬下一輪資料工程工作。
