# P1 實作報告：新手出生與首 5 分鐘閉環
日期：2026-03-08（Asia/Hong_Kong）
狀態：DONE

## 1. 目標
- 修正新角出生錯位。
- 保證新手區可安全看到 NPC、接到第一個任務、買藥與打第一批怪。
- 把開局寵物與技能切回 hero archetype，避免所有角色共用同一組開局配置。

## 2. 本次修正

### 2.1 新手出生點強制正確
- `src/data/runtime/RuntimeZoneBridge.ts`
  - 新增 `CRITICAL_RUNTIME_ZONE_OVERRIDES`。
  - 明確把 runtime zone `130` 映射到 `starter_meadow`。
- `src/world/SceneZoneProfiles.ts`
  - 為 `starter_meadow` 指定 spawn point：`(0, 0, -10)`。
- `src/world/RuntimeZoneCatalog.ts`
  - scene profile 的 `spawnPoint` 正式進入 runtime scene 定義。
- `src/world/ZoneManager.ts`
  - `buildInitialZone()` 現在會在首次建圖後把玩家重設到 zone spawn point。

### 2.2 新手區安全區與首批怪密度修正
- `src/entities/MonsterManager.ts`
  - `starter_meadow` 怪物最大活體數降到 4-6。
  - 新手怪生成點改為遠離村口安全區與 NPC 群聚區。
  - Boss 生成也改成遠離起始點。
- 實測結果：
  - smoke state 顯示新手區 `aliveMonsters = 6`
  - 玩家初始位置為 `z = -10`

### 2.3 第一個任務從「可看」變成「可接」
- `src/systems/QuestManager.ts`
  - 新增 `accepted` 狀態持久化。
  - 新增 `acceptQuest()` / `acceptFirstByNpc()`。
  - `main_1` 改成由 `npc_quest_01` 發放，必須接受後才開始計算進度。
  - `main_1` 擊殺需求從 7 降到 5，更符合首 5 分鐘節奏。
- `src/ui/QuestPanel.ts`
  - 新增 `接受任務` 按鈕。
  - `show(questId?)` 可直接聚焦指定任務。
  - 無選取任務時優先聚焦 active/complete quest。
- `src/main.ts`
  - 村長對話的 `accept` action 會先真正接任務，再打開任務面板。

### 2.4 Hero archetype 開局配置正式生效
- `src/main.ts`
  - 角色建立後會讀取 `getHeroArchetypeProfile(heroType)`。
  - 開局寵物改為 archetype 指定 starter pets。
  - 開局技能欄改為 archetype 指定 starter skill loadout。
- `src/ui/SkillBar.ts`
  - 新增 `setPlayerLoadout(skillIds)`。

### 2.5 新手導線與補給提示
- `src/entities/NPC.ts`
  - 村長、商人、技能導師台詞改為明確指向：
    - 先接任務
    - 先補藥
    - 再去草原外圍打怪
- `src/main.ts`
  - starter gold 改為 `240`
  - starter potions 改為：
    - `HP藥水(小) x2`
    - `MP藥水(小) x1`
  - 讓商人補給仍有價值，而不是一開始就送太滿。

### 2.6 可見性技術債順手收斂
- `src/ui/RenamePanel.ts`
- `src/ui/RevivalPanel.ts`
- `index.html`
  - 兩個舊 panel 從 `style.display` 改為 `hidden` 控制。
  - 修正後 `ci:guardrails` 重新通過，inline-style count 降為 `92`。

## 3. 變更檔案
- `src/data/runtime/RuntimeZoneBridge.ts`
- `src/world/SceneZoneProfiles.ts`
- `src/world/RuntimeZoneCatalog.ts`
- `src/world/ZoneManager.ts`
- `src/entities/MonsterManager.ts`
- `src/ui/SkillBar.ts`
- `src/systems/QuestManager.ts`
- `src/ui/QuestPanel.ts`
- `src/entities/NPC.ts`
- `src/ui/RevivalPanel.ts`
- `src/ui/RenamePanel.ts`
- `src/main.ts`
- `index.html`

## 4. 驗證
- `npm run -s typecheck`：通過
- `npm run -s build`：通過
- `npm run -s test:smoke`：通過（10/10）
- `npm run -s ci:guardrails`：通過

## 5. 實測觀察
- smoke `move-baseline` state：
  - `zone.id = starter_meadow`
  - `player.z = -10`
  - `aliveMonsters = 6`
- smoke 截圖可見：
  - 新手區已從安全點開場
  - 附近可直接看到 NPC 標記
  - 任務面板可見 `第 1 章` 與 `接受任務` 按鈕

## 6. 已知未完成項
- 這一輪只保證新手出生 `birthZoneId=130` 正確，尚未完成全域 `runtimeZone -> sceneZone` 顯式映射。
- 商店仍是 runtime 大型目錄，只是透過 starter gold / default potion category 把首輪補給流程拉回可用；完整 starter curated catalog 仍屬 `P22`。
- 地圖與怪物空間布局仍是 `P1` 等級的 starter-safe 修正，不是 `P5-P7` 目標的資料驅動版型。

## 7. 下一步
- 直接進入 `P2`：
  - 建立顯式 `RuntimeZoneSceneMap`
  - 把 `RuntimeZoneBridge` heuristic 降成 fallback
  - 準備修掉大量 zone 壓入單一 scene 的問題
