# P20 - Style-State 收斂與世界地圖路徑追蹤

日期: 2026-03-06  
範圍: `SkillBar`, `InventoryPanel`, `WorldMapPanel`, `ZoneDefinitions`

## 目標
- 收斂 `SkillBar` / `InventoryPanel` 剩餘動態 style，改為 class state + CSS 變數。
- 世界地圖補齊「拓撲路徑導引（A→B）」與「一鍵追蹤」可視化。
- 清理可安全刪除的舊地圖殘留欄位，降低維護成本。

## 變更摘要
1. SkillBar
- 冷卻遮罩改用 `--skill-cd-deg`（CSS 變數）驅動。
- 技能圖示改用 `--skill-icon-url`（CSS 變數）驅動。
- 狀態統一以 class 表達：`is-on-cooldown` / `is-pressed` / `is-ready-flash` / `is-empty` / `has-pet-name`。

2. InventoryPanel
- 面板顯示改為 class state：`is-open`（取代 `style.display`）。
- 面板縮放改為 `--inv2-panel-scale` + `is-scaled`（取代 `style.transform` 直寫）。
- 浮動提示顏色改為 class state：
  - `pickup-text--success`
  - `pickup-text--error`
  - `pickup-text--info`
  - `pickup-text--gold`

3. WorldMap 路徑追蹤 UI
- 補齊路徑卡樣式：`wmp-route-card`, `wmp-route-title`, `wmp-route-path`, `wmp-route-actions`, `wmp-route-btn`。
- 列表追蹤高亮：
  - 路徑節點 `wmp-on-route`
  - 追蹤目標 `wmp-tracked`
- 手機橫向/焦點模式新增路徑卡字級與按鈕尺寸調整。

4. 舊地圖殘留清理
- 刪除 `ZoneDefinitions` 中未被任何程式引用的 `mapMonIds` 欄位（型別與資料列皆移除）。
- 保留 `ZoneDefinitions` 主結構（仍供 `ZoneManager/ZoneRenderer/MonsterManager` 使用）。

## 驗證
- `npm run -s typecheck` ✅
- `npm run -s build` ✅
- `npm run -s test:smoke` ✅（含 map/pet/afk/combat-auto 場景）

## 風險與後續
- 目前仍有舊 `ZoneDefinitions` 中文註記與文案，屬內容品質問題，不影響功能。
- 若後續進行 `P11` 最終化，可把 `ZoneManager/ZoneRenderer` 逐步改為完全由 `world.topology` 驅動，再評估移除更多舊場景定義。
