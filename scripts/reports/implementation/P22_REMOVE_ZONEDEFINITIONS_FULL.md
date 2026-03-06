# P22 - 全專案去 ZoneDefinitions 化

日期: 2026-03-07  
目標: 移除 `ZoneDefinitions` 於全專案運行路徑中的依賴，統一改由 runtime data 驅動。

## 變更摘要

1. 新增場景映射基準檔
- 新增: `src/world/SceneZoneProfiles.ts`
- 內容: 保留 scene-zone 需要的基準欄位：
  - `id`
  - `name / nameCN`
  - `biome`
  - `levelMin / levelMax`
  - `isTown`
- 用途: 供 runtime zone 映射策略（`RuntimeZoneBridge`）使用，不再依賴舊 `ZoneDefinitions`。

2. RuntimeZoneBridge 去除 ZoneDefinitions 依賴
- 修改: `src/data/runtime/RuntimeZoneBridge.ts`
- `ZONE_DEFS` 改為 `SCENE_ZONE_PROFILES`。
- `selectBestSceneZone(...)` 候選型別改為 `SceneZoneProfile[]`。

3. MonsterManager 改走 runtime 場景目錄
- 修改: `src/entities/MonsterManager.ts`
- `getZoneDef(...)` 改為 `getRuntimeSceneZone(...)`。
- 城鎮判斷/等級區間依 `RuntimeZoneCatalog`。

4. AFKPanel 改走 runtime 場景目錄
- 修改: `src/ui/AFKPanel.ts`
- `LOOT_ZONES` 基礎來源由 `ZONE_DEFS` 改為 `listRuntimeSceneZones()`。

5. 移除舊檔
- 刪除: `src/world/ZoneDefinitions.ts`

## 資料正確性（本步）

- 區域主資料來源：`world.topology`（透過 `RuntimeZoneCatalog` 聚合）  
- runtime -> scene 映射來源：`SceneZoneProfiles`（穩定映射基準）  
- 傳送/鄰接：`RuntimeWorldRoutes`（由 runtime gate 關係生成）  
- 顯示名稱/生態主題：優先 `SceneZoneProfiles`，避免 runtime 原始地圖名稱編碼噪音直接污染玩家 UI。  
- 結果：世界切區、傳送、怪物刷出、AFK 地區列表均由 runtime 管線驅動。

## 驗證

- `npm run -s typecheck` ✅
- `npm run -s build` ✅
- `npm run -s test:smoke` ✅（10/10）

## 風險註記

- `SceneZoneProfiles` 仍是「場景層」映射基準檔（非 runtime 原始表），
  但已縮到最小必要欄位，且不再混入渲染/門點/地圖細節。
- 若要再往下一步，建議做 P23：
  - 將 `SceneZoneProfiles` 改為由 runtime manifest 生成（build 時產物），
    完全移除手寫場景基準。
