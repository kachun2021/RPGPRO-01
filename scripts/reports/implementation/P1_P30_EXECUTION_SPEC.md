# P1-P30 可實作主規格（Canonical Execution Spec）
日期：2026-03-08（Asia/Hong_Kong）
狀態：ACTIVE

## 1. 文件定位
- 本文件是 `D:\AI-RPGGAME` 後續本地優先版本的唯一主規格。
- 本文件覆蓋的是「未來要做的事」，不是歷史報告。
- `scripts/reports/implementation/` 內既有 `P15` 到 `P44` 文件仍保留，但只作為「歷史實作紀錄」，不再作為後續 roadmap 依據。

## 2. 目前 Repo 已確認的基線問題
- `src/data/runtime/RuntimeZoneBridge.ts`
  - `matchRuntimeZoneToSceneZone()` 仍以等級 overlap/平均值 heuristic 作為主要分派依據，這是世界失真的主因。
- `src/ui/WorldMapPanel.ts`
  - 面板內部仍以 `_selectedMapName`、`_trackedTargetMapName`、`_trackedRouteNodes` 為主語意，說明 map identity 仍殘留名稱導向狀態。
- `src/world/ZoneRenderer.ts`
  - 場景目前固定使用 `200x200` 地板，gate 以固定半徑環形分布；場景語意尚未進入資料驅動版型。
- `src/entities/MonsterManager.ts`
  - 一般怪與 Boss 仍主要依 `_randomPosition()` / 中心區隨機點生成，缺少 spawn anchor、safe zone 與 boss arena。
- `src/ui/RevivalPanel.ts`
  - UI 已顯示 `GP` 復活成本，但目前按鈕直接呼叫 `pet.revive()`，沒有金額驗證與扣款。
- `src/input/LandscapeCamera.ts`
  - 相機目前透過 `buttons = [1]` 依賴桌面右鍵旋轉，手機右半屏鏡頭操作尚未成立。
- `src/ui/SystemPanel.ts`
  - `SystemSettings` 已能儲存，但仍缺少真正的 runtime adapter；多數設定不會即時驅動遊戲。
- `src/main.ts`
  - `closeSubPanels()` 是事實上的 panel router。
  - `render_game_to_text()` 仍靠 DOM style 推測 panel 狀態，未輸出玩家生命狀態、currentPanel、modal stack。

## 3. 全域執行規則
- 禁止雙軌系統：新系統落地時，必須同步刪除、收斂或封鎖舊邏輯入口，不能留下兩套同時生效的 code path。
- 禁止名稱語意漂移：地圖、區域、傳送、圖鑑、融合、追蹤，全部以唯一 key 傳遞，顯示名稱只供 UI 顯示。
- 單機狀態暫時保留，但資料與同步邊界必須先抽象成 service/interface，為後續 `Supabase + Colyseus` 做準備。
- 任何出現在 `SystemPanel` 的設定，只能是：
  - 已接線並且立即生效
  - 或先隱藏，不可保留假設定
- 任何 UI/戰鬥/地圖重構，必須同步更新：
  - smoke 可觀測層
  - `render_game_to_text`
  - `progress.md`
- 任何步驟完成時，都要確認沒有新增死檔、重複文件、無用 helper、或只被新文件引用但不再被主流程使用的模組。

## 4. 參考還原目標（新奇幻寶貝 ONLINE / MixMaster 方向）
- 保持 3 寵同場、寵物打怪、掉蛋/掉核心、城鎮 NPC、圖鑑/合成表、寵物復活、合成失敗保護等 reference 核心感。
- 本輪不做 MMO 完整還原；優先還原的是：
  - 世界節奏
  - 寵物養成循環
  - 手機橫向可玩性
  - 子介面資料閉環

## 5. 架構鎖定

### 5.1 世界語意
- 新增單一 mapping source：
  - 建議新增 `src/data/runtime/RuntimeZoneSceneMap.ts`
  - 由此定義：
    - `runtimeZoneId -> sceneZoneId`
    - `sceneZoneId -> runtimeZoneIds[]`
    - `starter runtime zone`
    - 高價值 town / field / dungeon 對照
- `RuntimeZoneBridge.ts` 只保留：
  - 顯式對照查詢
  - 受控 fallback
- 不再允許「大量 zone 靠 level heuristic 落進同一 scene」成為主要行為。

### 5.2 可見性語意
- 所有主 panel 必須提供一致介面：
  - `show()`
  - `hide()`
  - `toggle()`
  - `isVisible`
  - `panelId`
- 新增單一 panel 狀態管理：
  - 建議新增 `src/ui/PanelRegistry.ts`
  - 主流程只查 registry，不再混用 `hidden` / `style.display` / class 名猜測狀態。

### 5.3 生存語意
- 新增玩家生命狀態：
  - `alive`
  - `down`
  - `revive_pending`
  - `revived`
- 玩家死亡、AFK、自動戰鬥、HUD、系統訊息、復活流程都必須讀同一套狀態。

### 5.4 設定語意
- 新增 runtime settings adapter：
  - 建議新增 `src/core/GameSettingsRuntime.ts`
- `SystemPanel` 只負責讀寫與觸發；真正生效由 adapter 處理。

### 5.5 場景版型語意
- 建議新增資料驅動場景布局來源：
  - `src/data/runtime/world.scene.layouts.json`
- 由此定義：
  - safe zone
  - lane / patrol / elite pocket
  - boss arena
  - gate anchors
  - landmark anchors
- `ZoneRenderer.ts` 與 `MonsterManager.ts` 只讀此資料，不直接在 class 內硬編碼整張圖布局。

### 5.6 測試語意
- `render_game_to_text` 擴充後至少輸出：
  - `sceneZoneId`
  - `runtimeZoneIds`
  - `playerLifeState`
  - `playerDead`
  - `currentPanel`
  - `modalStack`
  - `settingsApplied`
  - `autoConfig`

## 6. 執行批次與相依順序
- Batch A `P1-P4`
  - 先修世界真實來源：出生點、zone mapping、route graph、mapKey。
  - 未完成前，不做大量場景美術與 onboarding 文案重構，避免重工。
- Batch B `P5-P8`
  - 再修怪物池、怪物空間分佈、scene 布局與資料敘事一致性。
  - 這一批完成後，世界內容與 UI 資料才有共同 truth。
- Batch C `P9-P14`
  - 補生命狀態機、死亡閉環、寵物復活扣費、手機鏡頭與設定接線。
  - 未完成前，不把 AFK 或 mobile HUD 視為完成。
- Batch D `P15-P20`
  - 重做 HUD、觸控尺寸、可讀性、視覺語言、onboarding、角色身份。
  - 這一批只建立在前面世界/生存/控制已穩定的基礎上。
- Batch E `P21-P25`
  - 重做 progression、商店、製作、融合與 system setting 誠實度。
  - 這一批完成後，產品層才算具備首輪 retention loop。
- Batch F `P26-P30`
  - 最後統一 observability、panel framework、smoke gate、service 邊界與 save schema。
  - 這一批完成後，才允許進入 `P31-P35`。

## 7. P1-P30 執行步驟

### P1：修正新手出生與首 5 分鐘體驗
- 目標：新角一定出生在真正新手 scene，並可在 5 分鐘內完成移動、接任務、買藥、打怪、撿物。
- 主要檔案：
  - `src/main.ts`
  - `src/data/runtime/progression.json`
  - `src/data/runtime/RuntimeZoneBridge.ts`
  - `src/world/RuntimeZoneCatalog.ts`
  - `src/entities/NPC.ts`
  - `src/systems/QuestManager.ts`
- 必做：
  - 直接收斂 `main.ts` 內 `resolveHeroStartZoneId()` 的開局入口，不可同時存在多條開局 zone 決策路徑。
  - 明確把 `birthZoneId=130` 導向 `starter_meadow` 或新的顯式新手 scene。
  - 確保新手 scene 內有商人、技能導師、任務 NPC、低等怪。
  - 確保 starter inventory / starter pets / starter skills 與新手區節奏匹配。
- 禁止殘留：
  - 新角進 `lava_sanctum`
  - 新手流程依賴只有 `starter_meadow` 才存在但出生不到的 NPC
- 驗收：
  - 清空 localStorage 後新建角色，開局地區正確，NPC 可互動，能買藥與擊殺低等怪。

### P2：建立顯式 `runtimeZone -> sceneZone` 對照表
- 目標：停止讓 185 個 runtime zone 壓進同一 scene。
- 主要檔案：
  - `src/data/runtime/RuntimeZoneSceneMap.ts`（新增）
  - `src/data/runtime/RuntimeZoneBridge.ts`
  - `src/world/RuntimeZoneCatalog.ts`
  - `src/data/runtime/RuntimeWorldRoutes.ts`
- 必做：
  - 建立明確 mapping source。
  - 把目前 heuristic 降成 fallback，而不是 primary。
  - 優先覆蓋 town、新手區、主要狩獵區、地標區、Boss 區。
  - `RuntimeZoneCatalog.ts` 的 scene 聚合結果必須直接可追溯到 mapping source。
- 禁止殘留：
  - 任何主流程仍直接用 level average 猜 scene
- 驗收：
  - mapping 統計不再出現 185 個 zone 集中於 `lava_sanctum`。

### P3：重建 scene route graph
- 目標：傳送與路徑引導可反映顯式世界結構。
- 主要檔案：
  - `src/data/runtime/RuntimeWorldRoutes.ts`
  - `src/world/ZoneManager.ts`
  - `src/world/TeleportSystem.ts`
  - `src/ui/WorldMapPanel.ts`
- 必做：
  - route graph 以 sceneZone 為節點、顯式 gate/鄰接為邊。
  - 解鎖邏輯依 scene graph 運作。
  - `ZoneManager._applyFallbackUnlockPolicy()` 只能保留為受控 debug fallback，不能再是常態 progression 補洞手段。
- 禁止殘留：
  - route 為空時直接把大量區域視作可達
- 驗收：
  - 當前地圖可解釋「從哪裡來、可以到哪裡去、目前為何未解鎖」。

### P4：全地圖切換到唯一 `mapKey`
- 目標：移除重名地圖碰撞與錯誤深連結。
- 主要檔案：
  - `src/ui/WorldMapPanel.ts`
  - `src/ui/FusionPanel.ts`
  - `src/ui/EncyclopediaPanel.ts`
  - `src/data/runtime/RuntimeFusionGuide.ts`
  - `src/main.ts`
- 必做：
  - `WorldMapPanel` 的 `_selectedMapName`、`_trackedTargetMapName`、`_trackedRouteNodes` 與 storage key 都要遷移到 `mapKey`。
  - UI 選取、路徑追蹤、收藏、地圖跳轉全部傳遞 `mapKey`。
  - `mapName` 保留顯示用途，不再用於內部 identity。
- 禁止殘留：
  - localStorage 追蹤 key 僅存名稱
  - 圖鑑/融合跳地圖仍只帶字串名稱
- 驗收：
  - `流氓兔的地盤` 等重名地圖不再出現錯跳。

### P5：重做 scene-zone 怪物池承載規則
- 目標：每個 scene 只承擔合理的等級帶與怪物主題。
- 主要檔案：
  - `src/data/runtime/RuntimeMonsterSource.ts`
  - `src/entities/MonsterManager.ts`
  - `src/data/runtime/world.spawn.zone_templates.json`
  - `src/data/runtime/world.scene.layouts.json`（新增）
- 必做：
  - 依 mapping 後的 runtimeZoneIds 分層建池。
  - 區分 town / starter / field / elite / boss pool。
  - 控制池大小，避免單 scene 混入數百 monster type。
- 禁止殘留：
  - 一個 scene 內同時存在大量不相干等級層
- 驗收：
  - starter scene 只刷 starter 段怪；高等區不混入 1 級怪。

### P6：重做怪物空間分佈
- 目標：從中心亂刷改為可理解的棲地分佈。
- 主要檔案：
  - `src/entities/MonsterManager.ts`
  - `src/world/ZoneRenderer.ts`
  - `src/world/RuntimeZoneCatalog.ts`
  - `src/data/runtime/world.scene.layouts.json`（新增）
- 必做：
  - 為 scene 定義 spawn anchors / lanes / boss arena / safe pockets。
  - 怪物依類型與危險度分區。
  - 玩家初始點附近保留安全觀察帶。
- 禁止殘留：
  - 所有怪都用 `(-30~30, -30~30)` 同一套中心隨機。
- 驗收：
  - 玩家進入新手區時，不會立刻被高密度怪包圍。

### P7：重做 scene 地圖版型
- 目標：固定平面升級為有道路、障礙、地標與導視的地圖。
- 主要檔案：
  - `src/world/ZoneRenderer.ts`
  - `src/world/SceneZoneProfiles.ts`
  - `src/data/runtime/world.scene.layouts.json`（新增）
  - `src/assets/textures/*`
- 必做：
  - 各 scene 加入基本地形構件：主路徑、區塊邊界、危險區、城鎮區、Boss 區。
  - 讓 gate 位置與版型對齊，而不是固定圓周排布。
- 禁止殘留：
  - 所有 gate 均勻排成環形入口
- 驗收：
  - 僅看場景就能辨識安全區、傳送點、練功區與 Boss 區。

### P8：建立地圖與怪物的一致敘事
- 目標：地圖名稱、怪物分佈、掉蛋、融合來源彼此一致。
- 主要檔案：
  - `src/ui/WorldMapPanel.ts`
  - `src/data/runtime/RuntimeFusionGuide.ts`
  - `src/data/runtime/RuntimeMonsterSource.ts`
- 必做：
  - 地圖面板只顯示該 scene 真的能遇到的怪與目標。
  - 圖鑑/融合來源以唯一 zone 集合回填。
- 禁止殘留：
  - 地圖列出 DB zone 統計，但 3D scene 實際不承載
- 驗收：
  - 地圖、圖鑑、融合、戰鬥現場資料能互相對上。

### P9：建立玩家生命狀態機
- 目標：HP=0 不再只是數值歸零。
- 主要檔案：
  - `src/entities/Player.ts`
  - `src/main.ts`
  - `src/combat/CombatLoop.ts`
  - `src/ui/HUD.ts`
- 必做：
  - 新增生命狀態欄位與狀態轉換。
  - 死亡時停用移動、停用一般攻擊/自動戰鬥、顯示對應 UI。
- 禁止殘留：
  - 玩家 `hp=0` 仍可當成正常活著的 actor
- 驗收：
  - 玩家死亡後無法持續戰鬥，並進入明確復活流程。

### P10：補齊玩家死亡閉環
- 目標：實裝原地復活、回城、短暫保護狀態與失敗提示。
- 主要檔案：
  - `src/ui/RevivalPanel.ts` 或新玩家復活面板
  - `src/world/ZoneManager.ts`
  - `src/ui/SystemPanel.ts`
  - `src/ui/AFKPanel.ts`
  - `src/main.ts`
- 必做：
  - 玩家死亡後提供：
    - 原地復活
    - 回安全區/新手村
    - 復活保護數秒
  - AFK 的 deathAction 需接線到真正流程。
- 禁止殘留：
  - AFK 上有死亡設定但主流程不讀
- 驗收：
  - 玩家死亡後所有入口與結果一致，無卡死狀態。

### P11：修正寵物復活成本與經濟扣款
- 目標：復活 UI 與實際 GP 扣除一致。
- 主要檔案：
  - `src/ui/RevivalPanel.ts`
  - `src/pets/Pet.ts`
  - `src/pets/PetManager.ts`
  - `src/systems/Inventory.ts`
  - `src/ui/InventoryPanel.ts`
- 必做：
  - 單隻復活與全部復活都要檢查金額、扣款、失敗提示。
  - 支援復活不足額時的 disabled / warning 狀態。
- 禁止殘留：
  - 顯示 GP 成本但免費復活
- 驗收：
  - 每次復活都能在 gold、寵物狀態、toast 上一致反映。

### P12：對齊核心蛋/復活/寵物循環
- 目標：更接近 reference 的寵物收集閉環。
- 主要檔案：
  - `src/systems/EggDropSystem.ts`
  - `src/combat/CombatLoop.ts`
  - `src/ui/PetPanel.ts`
  - `src/ui/EncyclopediaPanel.ts`
- 必做：
  - 明確呈現掉蛋、寵物死亡、復活、圖鑑登錄、召喚上陣之間的關係。
  - 新手引導中讓玩家理解寵物不是純裝飾。
- 禁止殘留：
  - 掉蛋系統存在但 UI 不解釋其價值
- 驗收：
  - 新玩家能在 15 分鐘內理解寵物取得、上陣、死亡、復活。

### P13：補真正的手機右半屏鏡頭操作
- 目標：手機不再依賴桌面右鍵旋轉思維。
- 主要檔案：
  - `src/input/LandscapeCamera.ts`
  - `src/input/TouchJoystick.ts`
  - `src/main.ts`
- 必做：
  - 新增右半屏 drag rotate。
  - 與左搖桿區分工，不互相搶 pointer。
  - 桌面右鍵保留，但手機完全不依賴右鍵。
- 禁止殘留：
  - 手機上只有左搖桿，右手沒有鏡頭控制
- 驗收：
  - 真機/模擬手機橫向可單手左移動、右手調鏡頭。

### P14：把鏡頭/鎖敵設定接到實際控制
- 目標：系統設定不再是假資料。
- 主要檔案：
  - `src/ui/SystemPanel.ts`
  - `src/core/GameSettingsRuntime.ts`（新增）
  - `src/input/LandscapeCamera.ts`
  - `src/input/TouchJoystick.ts`
  - `src/combat/CombatLoop.ts`
- 必做：
  - `cameraSensitivity`、`invertCameraY`、`autoLockTarget` 即時生效。
  - `joystickSensitivity` 也要併入 runtime settings adapter，不再只存檔不使用。
  - 若某設定暫時不能做，從 UI 隱藏。
- 禁止殘留：
  - slider / toggle 有值但完全不影響遊戲
- 驗收：
  - 變更設定後玩家立刻感知差異。

### P15：重構 HUD 成雙拇指布局
- 目標：降低四角互搶空間與資訊分散。
- 主要檔案：
  - `src/ui/HUD.ts`
  - `src/ui/SkillBar.ts`
  - `src/ui/Minimap.ts`
  - `index.html`
- 必做：
  - 左下：搖桿
  - 右下：技能/auto/戰鬥高頻操作
  - 上方：主狀態/寵物/地區
  - 下中：縮減導航或可展開導航
- 禁止殘留：
  - 主戰鬥時保留過多低頻 nav 干擾
- 驗收：
  - 戰鬥畫面第一屏只保留必要操作與必要資訊。

### P16：全站觸控目標稽核
- 目標：常用按鈕、chip、tab、close 達手機可點標準。
- 主要檔案：
  - `index.html`
  - `src/ui/*`
- 必做：
  - 建立統一 touch token：
    - 按鈕最小高
    - close hit area
    - chip/tab 最小尺寸
  - 套用到高頻面板。
- 禁止殘留：
  - `26-30px` 高的核心互動元素
- 驗收：
  - iPhone landscape 模擬下不需精準點擊。

### P17：全域可讀性修復
- 目標：從「塞得下」升級到「一眼讀懂」。
- 主要檔案：
  - `index.html`
  - `src/ui/HUD.ts`
  - `src/ui/WorldMapPanel.ts`
  - `src/ui/PetPanel.ts`
  - `src/ui/ShopPanel.ts`
- 必做：
  - 提高 panel 背板不透明度。
  - 拉開標題/正文/輔助文字層級。
  - 手機最小字級與行高調整。
- 禁止殘留：
  - 背景滲透過強導致字貼在 3D 場景上
- 驗收：
  - 地圖、寵物、商店、AFK、系統面板在 `932x430` 可穩定閱讀。

### P18：統一視覺語言
- 目標：把 3D 畫面、字體、icon、顏色、按鈕統一成同一品牌。
- 主要檔案：
  - `index.html`
  - `src/ui/HUD.ts`
  - `src/ui/SystemPanel.ts`
  - `src/ui/CommunityPanel.ts`
- 必做：
  - 決定 icon 規則：減少 emoji 混用。
  - 決定中英混排規則。
  - 建立 rarity / series / state 的單一色票。
- 禁止殘留：
  - 同一層級按鈕有多種風格
  - `Player`、`BOOK`、中文混雜無規則
- 驗收：
  - 主要畫面與子介面看起來屬於同一款遊戲。

### P19：重做 onboarding
- 目標：讓新玩家在 15 分鐘內理解世界、寵物、戰鬥、合成方向。
- 主要檔案：
  - `src/ui/HeroCreationPanel.ts`
  - `src/ui/DialoguePanel.ts`
  - `src/ui/QuestTracker.ts`
  - `src/systems/QuestManager.ts`
  - `src/main.ts`
- 必做：
  - 建角後明確導向：
    - 找村長
    - 打首批怪
    - 撿首批掉落
    - 去商店
    - 開寵物面板
    - 看第一個融合目標
- 禁止殘留：
  - 建角後玩家不知道要做什麼
- 驗收：
  - 不看開發者說明也能順著 UI 走出基本流程。

### P20：統一角色身份顯示
- 目標：移除硬編碼 `Player`，把玩家身份接進 UI。
- 主要檔案：
  - `src/ui/CharacterPanel.ts`
  - `src/ui/HUD.ts`
  - `src/main.ts`
- 必做：
  - 顯示玩家名稱、職業/模板、主寵摘要。
  - 角色資訊與建角資料一致。
- 禁止殘留：
  - `CharacterPanel` 仍顯示 `Player`
- 驗收：
  - 建角輸入名稱後，HUD / 角色面板 / 存檔載入顯示一致。

### P21：把任務改成區域解鎖型 progression
- 目標：從 kill counter 提升成世界導引系統。
- 主要檔案：
  - `src/systems/QuestManager.ts`
  - `src/ui/QuestPanel.ts`
  - `src/ui/QuestTracker.ts`
  - `src/entities/NPC.ts`
  - `src/world/ZoneManager.ts`
- 必做：
  - 任務完成需回報 NPC 或觸發功能解鎖。
  - 主線任務與 scene 解鎖、商店、合成功能解鎖綁定。
- 禁止殘留：
  - 主線只剩無語境 kill 數字
- 驗收：
  - 主線進度能解釋玩家為何能去下一區。

### P22：重整商店經濟為新手精簡版優先
- 目標：手機端先看懂、先買對，不先吞 1000+ 商品。
- 主要檔案：
  - `src/systems/ShopManager.ts`
  - `src/ui/ShopPanel.ts`
  - `src/data/runtime/RuntimeEconomyCommerceSource.ts`
- 必做：
  - 新手商店建立 curated starter catalog。
  - 完整 DB 商品做後續解鎖或次級分類展開。
- 禁止殘留：
  - 新手一進商店就是巨量長清單
- 驗收：
  - 新手 30 秒內能找到藥水與基礎補給。

### P23：重整製作 UX
- 目標：製作從資料庫功能改成可理解的玩法入口。
- 主要檔案：
  - `src/ui/ShopPanel.ts`
  - `src/data/runtime/RuntimeEconomyCommerceSource.ts`
  - `src/systems/Inventory.ts`
  - `src/data/runtime/economy.commerce.json`
- 必做：
  - 顯示可做/缺料/成功率/成本/產物用途。
  - 與背包、掉落、任務材料來源對齊。
- 禁止殘留：
  - 製作配方只有結果名與 cost，缺少用途與材料來源導引
- 驗收：
  - 玩家能從背包或掉落理解材料用途。

### P24：重整融合 UX
- 目標：把大量公式收斂成推薦、追蹤、缺料、來源一體化。
- 主要檔案：
  - `src/ui/FusionPanel.ts`
  - `src/ui/EncyclopediaPanel.ts`
  - `src/ui/WorldMapPanel.ts`
  - `src/data/runtime/RuntimeFusionGuide.ts`
- 必做：
  - 新手只看到少量推薦公式。
  - 中期再開完整配方瀏覽。
  - 追蹤結果可一路跳圖鑑、地圖、來源怪。
- 禁止殘留：
  - 預設就暴露數百上千公式，且沒有分層
- 驗收：
  - 新玩家能看懂「下一隻要合什麼、缺什麼、去哪打」。

### P25：清理 `SystemPanel` 假設定
- 目標：只保留真的、會立即生效的設定。
- 主要檔案：
  - `src/ui/SystemPanel.ts`
  - `src/main.ts`
  - `src/core/GameSettingsRuntime.ts`
- 必做：
  - 隱藏未接線設定。
  - DATA tab 保留，但標明唯讀診斷用途。
  - account tab 若尚未接入 `AuthService`，明確標示為本地資料管理，不偽裝成 live account system。
- 禁止殘留：
  - 純假功能仍可操作
- 驗收：
  - 任何可點設定都能觀察到結果。

### P26：修正 `render_game_to_text`
- 目標：可觀測層與畫面一致。
- 主要檔案：
  - `src/main.ts`
  - `src/ui/PanelRegistry.ts`（新增）
- 必做：
  - 不再用 DOM style 猜 panel 狀態。
  - 由 panel registry / state machine 輸出真實狀態。
  - 補 `currentPanel`、`modalStack`、`playerDead` 等欄位。
  - `render_game_to_text` 的 zone 欄位需同時輸出 `sceneZoneId` 與承載的 `runtimeZoneIds`。
- 禁止殘留：
  - 畫面已開商店但 state 回報 `shop=false`
- 驗收：
  - smoke 截圖與 state 可逐場對上。

### P27：統一 panel framework
- 目標：消除 `hidden/display/class` 三套並存。
- 主要檔案：
  - `src/ui/*`
  - `index.html`
  - `src/ui/PanelRegistry.ts`
  - `src/main.ts`
- 必做：
  - 所有主 panel 註冊到 registry。
  - 關閉/開啟/互斥/stack 由單一流程處理。
  - `main.ts` 內 `closeSubPanels()` 必須收斂成 registry facade，不可繼續手動維護多份互斥名單。
- 禁止殘留：
  - 某些 panel 用 hidden，某些用 display，某些只切 class
- 驗收：
  - 全屏 panel 不再攔截下一個 nav click。

### P28：建立正式 smoke gate
- 目標：把新手流程與手機橫向納入常規驗收。
- 主要檔案：
  - `scripts/task_smoke.ps1`
  - `scripts/playwright-actions/*`
  - `progress.md`
- 必做：
  - 新增：
    - 新角建立流程 smoke
    - 玩家死亡/復活 smoke
    - 地圖 mapping smoke
    - 手機 landscape smoke
  - 用 state 驗證關鍵 flag。
- 禁止殘留：
  - 只測開 panel，不測核心 loop
- 驗收：
  - smoke 能攔下 starter spawn 錯位、panel state 錯誤、死亡流程缺口。

### P29：抽象未來後端接口
- 目標：現在仍單機，但把未來雲端與同步邊界抽出。
- 主要檔案：
  - `src/services/AuthService.ts`（新增）
  - `src/services/SaveService.ts`（新增）
  - `src/services/SocialService.ts`（新增）
  - `src/services/RoomService.ts`（新增）
  - `src/services/adapters/local/*`（新增）
  - `src/systems/RuntimeSaveManager.ts`
- 必做：
  - 先提供 local adapter。
  - `saveRuntimeGame()` / `loadRuntimeGame()` 需包進 local save adapter，不再由 UI 直接呼叫底層 storage 函式。
  - 主流程不要再直接綁 `localStorage` 與 UI。
- 禁止殘留：
  - 未來要上雲時才第一次抽 service，導致二次大重構
- 驗收：
  - 存檔/玩家身份/社交入口都可由 interface 替換。

### P30：穩定 save schema / DTO / 遷移規則
- 目標：為 `P31+` 雲端階段準備不易爆炸的資料邊界。
- 主要檔案：
  - `src/systems/RuntimeSaveManager.ts`
  - `src/data/runtime/save_schema.json`
  - `src/services/SaveService.ts`
- 必做：
  - 分離：
    - player profile
    - world progress
    - pets
    - inventory
    - settings
    - onboarding / feature unlock flags
  - 明確 version 與 migration hook。
- 禁止殘留：
  - UI 暫存、戰鬥暫態、local-only flag 全混在同一 save payload
- 驗收：
  - 儲存結構可以被本地與未來雲端共用，不必重寫 UI。

## 8. P1-P30 驗證門檻
- 新角 15 分鐘流程：
  - 建角
  - 新手區出生
  - NPC 互動
  - 買藥
  - 打怪
  - 撿物
  - 看任務
  - 開寵物
  - 看融合建議
- 手機橫向：
  - `932x430`
  - `844x390`
  - `1280x720`
- 世界一致性：
  - `birthZoneId=130`
  - 重名地圖
  - `mapKey`
  - teleport
  - scene monster pool
- 生存一致性：
  - 玩家死亡
  - 寵物死亡
  - 寵物復活扣費
  - AFK deathAction
- 可觀測一致性：
  - 截圖中的開 panel 狀態與 text state 一致
- 維護性：
  - 無新增 dead file
  - 無雙軌 helper
  - 無遺留舊 key/舊 tracker/舊 route path

## 9. 硬性淘汰清單
- 完成 `P2-P4` 後，以下舊語意不得再作為主流程依據：
  - `RuntimeZoneBridge.ts` 內以等級猜 scene 的 primary path
  - `WorldMapPanel.ts` 內 name-only route tracking / selection state
- 完成 `P3` 後，以下舊補洞不可留在正式流程：
  - `ZoneManager._applyFallbackUnlockPolicy()` 常態解鎖
- 完成 `P6-P7` 後，以下舊邏輯不得殘留：
  - `MonsterManager._randomPosition()` 當作主要怪物生成策略
  - `ZoneRenderer.ts` 固定 gate 圓環布局
- 完成 `P14-P25` 後，以下假功能不得殘留：
  - `SystemPanel` 中只儲存不生效的 slider / toggle
  - 假 account/live social 呈現
- 完成 `P26-P27` 後，以下舊架構不得殘留：
  - `render_game_to_text()` 以 DOM computed style 推測 panel 狀態
  - `main.ts` 手工維護的多面板互斥名單
- 完成 `P29-P30` 後，以下邊界不得殘留：
  - feature module 直接碰 `localStorage`
  - UI 直接呼叫底層 save payload 讀寫

## 10. 歷史文件使用規則
- 可參考的歷史落地證據：
  - `P23_P27_CORE_LOGIC_AND_QOL.md`
  - `P28_P30_PERF_GUARDRAILS_UI.md`
  - `P31_P34_RUNTIME_MAP_AND_HERO.md`
  - `P35_P39_BOOTSTRAP_AND_TEXT_HARDENING.md`
  - `P40_P44_VALIDATION_AND_DEPRECATION_CLEANUP.md`
- 不可再把上述文件視為未來 roadmap 的主定義。
