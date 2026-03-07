# P31-P34 實作報告（地圖鍵值重構 + 角色建立流程）
日期：2026-03-07（Asia/Hong_Kong）
範圍：P31, P32, P33, P34

## P31：世界地圖改用 `zone:<id>` 唯一鍵
- `WorldMapPanel` 的地圖識別從 `mapName` 改為 `mapKey`（`zone:<runtimeZoneId>`）。
- 清除同名地圖衝突風險，路徑追蹤、選取、搜尋、儲存都改用唯一鍵。
- 地圖列表新增區域 ID 顯示（`#zoneId`），並支援以區域 ID 搜尋。

## P32：拓撲路由與跨面板跳轉統一區域語意
- `WorldMapPanel` 路徑計算改以 mapKey graph（不再依賴地圖名稱）。
- 世界地圖 -> 合成中心 / 圖鑑 的深連結改為攜帶 `runtimeZoneId`。
- 合成中心地圖過濾優先使用 `resultMapZoneIds`，無 zoneId 時才回退到地圖名稱。

## P33：角色模板衍生的開局配置
- 新增 `HeroArchetypes`，由 hero type 對應開局技能與寵物。
- `main.ts` 開局初始化改為使用 archetype：
  - `PetManager.giveStarterPets({ starterPetIds })`
  - `SkillBar.setPlayerLoadout(starterSkillIds)`

## P34：首次進入角色建立流程
- 新增 `HeroCreationPanel`，首次進入可選職業 + 輸入名稱。
- 新增本地儲存鍵：
  - `fpo.hero.created.v1`
  - `fpo.player.name.v1`
- `CharacterPanel` 名稱顯示改讀取 `fpo.player.name.v1`，與建立流程一致。

## 變更檔案
- `src/ui/WorldMapPanel.ts`
- `src/ui/FusionPanel.ts`
- `src/data/runtime/RuntimeFusionGuide.ts`
- `src/main.ts`
- `src/data/runtime/HeroArchetypes.ts`
- `src/ui/HeroCreationPanel.ts`
- `src/pets/PetManager.ts`
- `src/ui/SkillBar.ts`
- `src/ui/CharacterPanel.ts`
- `index.html`

## 驗證
- `npm run -s typecheck`：通過
- `npm run -s build`：通過
- `npm run -s test:smoke`：通過（10/10）
- `npm run -s ci:guardrails`：通過

