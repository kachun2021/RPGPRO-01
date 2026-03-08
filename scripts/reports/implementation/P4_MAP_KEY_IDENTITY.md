# P4 實作報告：全地圖切換到唯一 `mapKey`
日期：2026-03-08（Asia/Hong_Kong）
狀態：DONE

## 1. 目標
- 停止用地圖名稱當內部 identity。
- 解掉 `巴爾克牧場 / 釣魚島 / 地下石洞 / 訓練場` 這類重名地圖的碰撞。
- 讓世界地圖、圖鑑、融合面板可以用唯一 key 互相跳轉。

## 2. 本次修正

### 2.1 新增 RuntimeMapCatalog
- `src/data/runtime/RuntimeMapCatalog.ts`
  - 建立 runtime map 單一索引來源。
  - 每張 map 現在都有：
    - `mapKey` (`rz:<runtimeZoneId>`)
    - `runtimeZoneId`
    - `name`
    - `displayName`
    - `sceneZoneId`
    - `neighbor map keys`
  - 重名地圖會自動顯示為：
    - `巴爾克牧場 #183`
    - `巴爾克牧場 #184`
    - ...
  - 提供：
    - `getRuntimeMapByZoneId()`
    - `getRuntimeMapByKey()`
    - `listRuntimeMapNeighbors()`
    - `resolveRuntimeMapEntry()`

### 2.2 Fusion guide 開始輸出 map identity
- `src/data/runtime/RuntimeFusionGuide.ts`
  - 新增 `RuntimeMapRef`。
  - 每條 fusion entry 現在除了舊的地圖名稱外，還輸出：
    - `mainMapKeys / subMapKeys / resultMapKeys`
    - `mainMapRefs / subMapRefs / resultMapRefs`
    - `mainPrimaryMapKey / subPrimaryMapKey / resultPrimaryMapKey`
  - 圖鑑與融合面板不再需要自己猜哪個同名地圖才是正確來源。

### 2.3 圖鑑改用 `sourceMapKey`
- `src/ui/EncyclopediaPanel.ts`
  - `_selectedSourceMap` 改為 `_selectedSourceMapKey`。
  - `onOpenRecipe / onOpenMap` 改傳 `mapKey`。
  - 詳情頁使用 `RuntimeMapRef.displayName` 顯示來源地圖。
  - 地圖 chip 與按鈕都改成 key-driven，名稱只作展示。

### 2.4 Fusion panel 改用 `mapKey` 篩選/跳轉
- `src/ui/FusionPanel.ts`
  - `_recipeMapFilterName` 改為 `_recipeMapFilterKey`。
  - 配方卡上的「去地圖」按鈕現在帶 `mapKey`。
  - 配方篩選不再比對名稱字串，而是比對 `resultMapKeys`。
  - filter pill 顯示 `displayName`，內部仍只保存 key。

### 2.5 WorldMapPanel 內部 identity 改為 `mapKey`
- `src/ui/WorldMapPanel.ts`
  - `_selectedMapName` -> `_selectedMapKey`
  - `_trackedTargetMapName` -> `_trackedTargetMapKey`
  - `_trackedRouteNodes` 改存 mapKey
  - `MapSummary` 新增：
    - `mapKey`
    - `baseName`
    - `neighborMapKeys`
  - 地圖列表、詳情、追蹤、路徑導引全部改在 key 層運作。
  - 搜尋仍支援顯示名稱與原始名稱，但不再把名稱當 identity。
  - `openAtMap()` 現在可接受 `mapKey` 或舊名稱輸入；舊名稱會經由 catalog resolve 到唯一 mapKey。

## 3. 驗證重點
- duplicate map identity：
  - `巴爾克牧場` 目前可正確分解為：
    - `rz:183 -> 巴爾克牧場 #183`
    - `rz:184 -> 巴爾克牧場 #184`
    - `rz:185 -> 巴爾克牧場 #185`
    - `rz:186 -> 巴爾克牧場 #186`
    - `rz:213 -> 巴爾克牧場 #213`
    - `rz:214 -> 巴爾克牧場 #214`
- world map screenshot 已可見重名區加上 `#zoneId` 後綴，避免誤選。
- `resolveRuntimeMapEntry('巴爾克牧場')` 仍可向下相容解析到一個穩定 mapKey。

## 4. 變更檔案
- `src/data/runtime/RuntimeMapCatalog.ts`
- `src/data/runtime/RuntimeFusionGuide.ts`
- `src/ui/EncyclopediaPanel.ts`
- `src/ui/FusionPanel.ts`
- `src/ui/WorldMapPanel.ts`

## 5. 驗證
- `npm run -s typecheck`：通過
- `npm run -s build`：通過
- `npm run -s test:smoke`：通過（10/10）
- `npm run -s ci:guardrails`：通過

## 6. 已知未完成項
- `main.ts` 的函式命名仍保留 `mapName` 字樣，但實際上已能接 `mapKey`；後續可再清理語意名稱。
- world map detail header 仍顯示 scene id（如 `baluk_farm`）而不是 scene 中文名，這是 UI 文案層問題，不影響 identity 正確性。
- `render_game_to_text` 尚未輸出 `currentPanel / modalStack / settingsApplied / runtimeZoneIds`，這屬於 `P26`。

## 7. 下一步
- 進入 `P5-P8`：
  - 讓怪物池、怪物空間分佈、scene layout 與新的 scene/map identity 對齊
