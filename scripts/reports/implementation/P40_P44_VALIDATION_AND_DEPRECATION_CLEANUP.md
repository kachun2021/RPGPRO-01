# P40-P44 實作報告（驗證收斂 + 遺留依賴檢查 + 發佈可用性）
日期：2026-03-07（Asia/Hong_Kong）
範圍：P40, P41, P42, P43, P44

## P40：ZoneId 深連結完整打通
- 合成中心卡片「去地圖」可攜帶 `resultPrimaryZoneId`。
- 世界地圖支援 `openAtZone(runtimeZoneId)`，優先按 zoneId 精準定位。

## P41：地圖路徑追蹤持久化改為 mapKey
- 追蹤儲存值改存 `mapKey`（`zone:<id>`），不再受地圖改名影響。
- 載入追蹤資料時會做 key/zone/name 正規化，避免舊值失效。

## P42：資料來源一致性檢查
- `RuntimeFusionGuide` 增補 map zone id 欄位：
  - `main/sub/resultMapZoneIds`
  - `main/sub/resultPrimaryZoneId`
- 前端 FormulaEntry 同步接入，避免 UI 自行推斷來源地圖。

## P43：遺留依賴與舊路徑檢查
- 執行 `npm run -s gamedb:check-legacy`：通過（77 個 TS 檔案掃描）。
- 核對 map-name 舊欄位引用，確保不再依賴舊 `_selectedMapName` / `_trackedTargetMapName` 邏輯。

## P44：最終可用性驗證（可交付狀態）
- `typecheck`、`build`、`smoke`、`guardrails` 全通過。
- 本階段未新增 hardcoded fallback 來覆蓋 runtime 真值，保持資料單一來源策略。

## 驗證命令
- `npm run -s typecheck`
- `npm run -s build`
- `npm run -s test:smoke`
- `npm run -s ci:guardrails`
- `npm run -s gamedb:check-legacy`

