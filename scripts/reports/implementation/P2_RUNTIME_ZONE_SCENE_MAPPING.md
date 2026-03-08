# P2 實作報告：顯式 runtimeZone -> sceneZone 對照表
日期：2026-03-08（Asia/Hong_Kong）
狀態：DONE

## 1. 目標
- 停止主流程依賴 level heuristic 決定 runtime zone 對應 scene。
- 建立可維護、可追溯的顯式 mapping source。
- 把 runtime scene 聚合結果改成直接來自 mapping source，而不是隱性猜測。

## 2. 本次修正

### 2.1 新增單一 mapping source
- `src/data/runtime/RuntimeZoneSceneMap.ts`
  - 新增 `37` 個顯式 scene group。
  - 直接覆蓋 `201 / 201` 個 runtime zone。
  - 提供：
    - `getExplicitSceneZoneIdForRuntimeZoneId()`
    - `listExplicitRuntimeZoneIdsForSceneZone()`
    - `listExplicitRuntimeSceneZoneGroups()`
    - `listSyntheticSceneNeighbors()`
    - `countExplicitRuntimeSceneMappings()`
  - 模組初始化時會檢查重複 runtime zone mapping，避免雙重分派靜默發生。

### 2.2 scene profile 從 17 個泛化 bucket 擴成 37 個可維護群組
- `src/world/SceneZoneProfiles.ts`
  - 保留既有主線相關 scene id：
    - `starter_meadow`
    - `misty_forest`
    - `ancient_ruins`
    - `crystal_caves`
    - `frost_peaks`
    - `dark_hollow`
    - `lava_sanctum`
  - 新增 town / sky / special groups：
    - `town_magilita`
    - `town_migrita`
    - `town_beheru`
    - `town_helsper`
    - `town_ludis`
    - `town_bumai`
    - `office_hub`
    - `pk_arena`
    - `beast_sky`
    - `dragon_sky`
    - `demon_sky`
    - `plant_sky`
    - `mystery_sky`
    - `bird_sky`
    - `insect_sky`
    - `machine_sky`
    - `kambu_beast`
    - `kambu_dragon`
    - `kambu_mystery`
    - `house_dungeons`
    - `baluk_farm`
    - `training_ground`
    - `sinan_ruins`
  - town scene 現在都有一致的 spawn point。

### 2.3 Bridge 降級為「顯式優先、heuristic 只做 fallback」
- `src/data/runtime/RuntimeZoneBridge.ts`
  - `matchRuntimeZoneToSceneZone()` 現在先查 `RuntimeZoneSceneMap`。
  - `RuntimeZoneMatchMode` 改為：
    - `explicit`
    - `town`
    - `level`
    - `none`
  - level overlap heuristic 不再是 primary code path。

### 2.4 Runtime scene catalog 改成可追溯聚合
- `src/world/RuntimeZoneCatalog.ts`
  - 聚合 runtime zone 時，先查顯式 mapping。
  - profile 補全時，會把該 scene 的 explicit runtime zone ids 一起寫回 `runtimeZoneIds`。
  - fallback scene 的 town 判定不再硬編碼 `main_city`，改為依 id 前綴推導。

### 2.5 開局入口與 mapping source 對齊
- `src/main.ts`
  - `resolveHeroStartZoneId()` 先查顯式 mapping source，再退回 bridge fallback。
  - 避免 birth zone 與世界 mapping 使用不同來源。

### 2.6 UI mode 語意同步
- `src/ui/WorldMapPanel.ts`
  - `teleportMode` 文案改成 `explicit / town / level / none`。
  - 移除對舊 `topology` mode 的型別殘留。

## 3. 分布結果
- runtime zones：`201`
- explicit mappings：`201`
- scene groups：`37`
- missing explicit mapping：`0`
- 最大單一 scene 承載數：
  - `ancient_ruins = 11`
  - `moonlit_grove = 11`
  - `dark_hollow = 10`
  - `crystal_caves = 9`
  - `misty_forest = 9`
- 舊問題已解除：
  - 不再出現 `185` 個 runtime zone 集中在 `lava_sanctum`

## 4. 變更檔案
- `src/data/runtime/RuntimeZoneSceneMap.ts`
- `src/world/SceneZoneProfiles.ts`
- `src/data/runtime/RuntimeZoneBridge.ts`
- `src/world/RuntimeZoneCatalog.ts`
- `src/main.ts`
- `src/ui/WorldMapPanel.ts`

## 5. 驗證
- `npm run -s typecheck`：通過
- `npm run -s build`：通過
- `npm run -s test:smoke`：通過（10/10）
- `npm run -s ci:guardrails`：通過

## 6. 實測觀察
- smoke `map-panel` 實際畫面已能列出新增 scene group 對應的地圖與傳送目標。
- 新手開局不受影響：
  - `zone.id = starter_meadow`
  - `player.z = -10`
  - `aliveMonsters = 6`

## 7. 已知未完成項
- `RuntimeWorldRoutes.ts` 雖然已受益於顯式 mapping，但 scene graph 仍未加入完整 synthetic route 策略，這屬於 `P3`。
- `WorldMapPanel` 內部 identity 目前仍是 map name，尚未完成 `mapKey` 遷移，這屬於 `P4`。
- 地圖與怪物敘事仍只是分群修正，不是 `P5-P8` 的資料驅動版型與空間錨點。

## 8. 下一步
- 直接進入 `P3`：
  - 重建 scene route graph
  - 讓 unlock 與 world map route 讀同一套 scene adjacency
  - 把 `ZoneManager` fallback unlock 收斂成受控 debug 路徑
