# P3 實作報告：scene route graph 重建
日期：2026-03-08（Asia/Hong_Kong）
狀態：DONE

## 1. 目標
- 讓 scene route graph 不再只靠 DB gate collapse。
- 補上必要的 synthetic links，讓 starter、town、sky/special scenes 有可解釋路徑。
- 把 `ZoneManager` 的 fallback unlock 從常態邏輯降級為受控 debug 開關。

## 2. 本次修正

### 2.1 RuntimeWorldRoutes 改成 scene-aware graph
- `src/data/runtime/RuntimeWorldRoutes.ts`
  - 重寫 route cache 建立流程。
  - runtime zone -> scene zone 現在先查 `RuntimeZoneSceneMap`，顯式 mapping 仍是 primary。
  - edge label 改為優先使用 scene 中文名，而不是直接拿任意 runtime zone 名稱。

### 2.2 synthetic neighbors 正式進 graph
- `src/data/runtime/RuntimeZoneSceneMap.ts`
  - 保留 synthetic route 定義，作為顯式世界修補層。
  - 首輪重點補上：
    - `starter_meadow -> misty_forest`
    - `pk_arena <-> town_magilita`
    - `office_hub <-> town_bumai`
    - `sky_temple <-> 各系天空`
    - `kambu_* <-> 對應天空`
  - 去掉雙向重複宣告，避免 label 被反向文案覆蓋。

### 2.3 ZoneManager fallback 不再默默補 progression
- `src/world/ZoneManager.ts`
  - constructor 不再無條件呼叫 fallback unlock。
  - 新增 `fpo.debug.unlockFallback=1` 才會啟用的 debug escape hatch。
  - 正常流程下，scene 解鎖只讀：
    - 目前區域
    - route graph 鄰接
  - 這讓 unlock 狀態回到真正的世界路徑，而不是隱性補洞。

## 3. 實測結果
- starter scene route：
  - `starter_meadow -> misty_forest`
- town scene route：
  - `town_magilita -> echo_valley, pk_arena`
- sky hub route：
  - `sky_temple -> beast_sky / dragon_sky / demon_sky / plant_sky / mystery_sky / bird_sky / insect_sky / machine_sky`
- debug unlock fallback：
  - 預設不啟用
  - 只有手動設定 `localStorage['fpo.debug.unlockFallback']='1'` 才生效

## 4. 變更檔案
- `src/data/runtime/RuntimeWorldRoutes.ts`
- `src/data/runtime/RuntimeZoneSceneMap.ts`
- `src/world/ZoneManager.ts`

## 5. 驗證
- `npm run -s typecheck`：通過
- `npm run -s build`：通過
- `npm run -s test:smoke`：通過（10/10）
- `npm run -s ci:guardrails`：通過

## 6. 已知未完成項
- `WorldMapPanel` 內部 route card 仍是 map-name graph，不是唯一 key graph；完整修正屬於 `P4`。
- scene 之間雖已可解釋相鄰，但地圖 layout / gate anchor 仍是舊版固定環形配置，這屬於 `P6-P7`。

## 7. 下一步
- 直接進入 `P4`：
  - 把 `WorldMapPanel / FusionPanel / EncyclopediaPanel / RuntimeFusionGuide` 全部切到唯一 `mapKey`
  - 清除重名地圖碰撞與錯跳轉
