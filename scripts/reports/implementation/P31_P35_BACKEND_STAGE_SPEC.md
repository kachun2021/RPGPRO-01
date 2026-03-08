# P31-P35 後端與上線階段規格（Deferred Stage Spec）
日期：2026-03-08（Asia/Hong_Kong）
狀態：HOLD

## 1. 文件定位
- 本文件定義 `Supabase + Colyseus` 階段的後續工作。
- 本階段不得在 `P1-P30` 未驗收前提前啟動。
- 本文件不是當前執行主規格；它是下一階段的 gating spec。

## 2. 啟動條件
- `P1-P30` 已完成並有正式驗收報告。
- 以下 smoke 全部通過：
  - 新角流程
  - 世界映射
  - 玩家死亡/復活
  - 寵物復活扣費
  - 手機橫向操作
  - `render_game_to_text` 一致性
- `SaveService/AuthService/SocialService/RoomService` 已存在 local adapter。
- save schema 版本與 migration 規則已穩定。
- `CommunityPanel` / `ChatBox` 已先完成產品誠實度整理：
  - 未連線前只可呈現離線 bulletin / information center
  - 不可再偽裝為 live social

## 3. 執行順序原則
- 先 `Supabase`，後 `Colyseus`。
- 先非即時資料，後即時房間同步。
- 先登入與雲存檔，後社交與同場。
- 先低風險功能，後 server-authoritative 判定。

## 4. 前置 Interface 合約
- `AuthService`
  - 至少提供：
    - `getSession()`
    - `signIn()`
    - `signOut()`
    - `getProfile()`
    - `upgradeIdentity()` 或等效匿名升級流程
- `SaveService`
  - 至少提供：
    - `listSlots()`
    - `loadSlot(slotId)`
    - `saveSlot(slotId, payload)`
    - `deleteSlot(slotId)`
    - `migrateSnapshot(payload, version)`
- `SocialService`
  - 在 local 階段先提供 offline adapter。
  - 未上線前至少要能區分：
    - bulletin/info mode
    - live presence mode
- `RoomService`
  - 至少提供：
    - `connectRoom(roomType, roomId?)`
    - `leaveRoom()`
    - `sendChat(message)`
    - `onPresenceChanged()`
    - `onMessage()`

## 5. P31-P35

### P31：接入 `Supabase Auth + Profile + Cloud Save`
- 目標：讓單機檔可安全升級成帳號化個人資料。
- 主要檔案：
  - `src/services/AuthService.ts`
  - `src/services/SaveService.ts`
  - `src/services/adapters/*`
  - `src/ui/SystemPanel.ts`
- 必做：
  - Email / magic link / anonymous upgrade 擇一作為 v1。
  - 玩家 profile、hero profile、save slots 上雲。
  - 本地存檔與雲存檔需有衝突策略。
- 不要做：
  - 一開始就做複雜社交關係表
- 驗收：
  - 換裝置可登入並拉回角色進度。

### P32：分拆雲端持久化模型與遷移
- 目標：把當前本地大 save 拆成可維護的雲端資料結構。
- 主要檔案：
  - `src/services/SaveService.ts`
  - `supabase` schema / migration 檔
  - `src/systems/RuntimeSaveManager.ts`
- 必做：
  - 拆分：
    - account/profile
    - hero save header
    - inventory snapshot
    - pet roster
    - progression flags
    - settings
  - 建立 migration policy。
- 不要做：
  - 把暫態戰鬥狀態直接寫進長期雲端存檔
- 驗收：
  - 從舊本地版升級到雲端版可保留資料。

### P33：接入 `Colyseus`，先從低風險房間開始
- 目標：先做「同場存在」與「輕社交」，不要直接同步整個戰鬥世界。
- 主要檔案：
  - `src/services/RoomService.ts`
  - `src/services/adapters/colyseus/*`
  - `src/ui/CommunityPanel.ts`
  - `src/ui/ChatBox.ts`
- 必做：
  - 先做 town room / lobby room。
  - 先同步：
    - 玩家存在
    - 基本位置
    - 名稱
    - 簡單聊天
  - 不先同步掉落、寵物 AI、完整戰鬥。
- 不要做：
  - 一上來就做全域 MMO 世界同步
- 驗收：
  - 兩個玩家可同城看見彼此並聊天。

### P34：定義 server-authoritative 邊界
- 目標：找出哪些資料必須由伺服器裁定，避免未來作弊與資料衝突。
- 主要檔案：
  - `src/services/RoomService.ts`
  - `src/services/SaveService.ts`
  - 後端 room handlers
- 必做：
  - 列出 authoritative 清單：
    - 帳號身份
    - 雲存檔版本
    - 排行榜
    - 交易
    - 活動獎勵
  - 先不要把單機戰鬥核心全部 server 化。
- 不要做：
  - 在沒有完整 trust boundary 前開放交易或排行榜寫入
- 驗收：
  - 每個跨裝置或跨玩家資料都有單一真實來源。

### P35：正式上線與維運基線
- 目標：建立可發版、可回滾、可追查的上線流程。
- 主要檔案：
  - 部署腳本
  - 環境設定
  - smoke / task_done
  - 發版報告文件
- 必做：
  - staging / production 分環境
  - 版本號、migration 順序、rollback 指引
  - 上線前檢查：
    - local-first smoke
    - cloud save smoke
    - room smoke
    - 30 分鐘穩定測試
- 不要做：
  - 無 staging 就直接把存檔 schema 改上 production
- 驗收：
  - 可在不刪玩家資料的情況下安全升級。

## 6. 本階段風險提示
- 對 `0 經驗` 狀況，最容易失控的是：
  - 太早接 `Colyseus`
  - 把單機主流程和網路同步耦合在一起
  - 沒有先穩定 save schema 就上雲
- 所以本階段必須遵守：
  - `P31 -> P32 -> P33 -> P34 -> P35`
  - 不允許跳步

## 7. 開始前必查清單
- `P1-P30` 驗收報告是否存在
- `progress.md` 是否標記 `P1-P30` 完成
- `render_game_to_text` 是否已擴充
- `PanelRegistry` 是否已統一
- `SaveService` / `AuthService` / `RoomService` local adapter 是否可單獨測試
