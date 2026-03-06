# P21 - ZoneManager / ZoneRenderer 100% topology-driven

日期: 2026-03-07  
範圍: `src/world/ZoneManager.ts`, `src/world/ZoneRenderer.ts`

## 目標
- 移除 `ZoneManager` / `ZoneRenderer` 對 `ZoneDefinitions` 的直接依賴。
- 讓場景區域資料改由 `world.topology` 聚合為單一來源。
- 保持現有傳送、切區、戰鬥與 UI 功能不退化。

## 實作

1. 新增 runtime 場景區域目錄
- 新檔: `src/world/RuntimeZoneCatalog.ts`
- 以 `world.topology` + `matchRuntimeZoneToSceneZone(...)` 聚合出 `RuntimeSceneZoneDef`。
- 提供 API:
  - `listRuntimeSceneZones()`
  - `getRuntimeSceneZone(...)`
  - `getRuntimeSceneZoneOrFallback(...)`
  - `getRuntimeSceneZoneName(...)`
  - `getDefaultRuntimeSceneZoneId()`

2. ZoneManager 改為 runtime 驅動
- 移除 `ZONE_DEFS/getZoneDef/ZoneDef` import。
- `currentZone` 型別改為 `RuntimeSceneZoneDef`。
- 初始化、buildInitialZone、travelTo、unlock 列表改讀 `RuntimeZoneCatalog`。

3. ZoneRenderer 改為 runtime 驅動
- 移除 `ZoneDefinitions` import。
- 內建 `RuntimeBiomeType` 對應的材質/PBR/光照表（非地圖清單，僅渲染主題）。
- `build(...)` 改吃 `RuntimeSceneZoneDef`。
- 傳送門來源改為 runtime route：
  - 優先 `getSceneGateLabels(...)`
  - 若無，退回 `getSceneZoneNeighbors(...)` + `getRuntimeSceneZoneName(...)` 組標籤

## 驗證
- `npm run -s typecheck` ✅
- `npm run -s build` ✅
- `npm run -s test:smoke` ✅（10/10 場景通過）

## 結果
- `ZoneManager` / `ZoneRenderer` 已不再直接讀取舊 `ZoneDefinitions` 地圖資料。
- 區域切換與傳送鏈路已統一由 runtime topology 驅動。

## 仍保留（非本步）
- `ZoneDefinitions` 目前仍被 `MonsterManager`、`AFKPanel`、`RuntimeZoneBridge` 等模組引用。
- 若要完全下線 `ZoneDefinitions`，建議下一步做 P22：把上述模組切到 `RuntimeZoneCatalog` / runtime source。
