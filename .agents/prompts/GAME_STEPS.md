# Abyssal Wardens: Phantom Dominion — 12步開發指令集
# AI 自動讀取本文件執行對應 Prompt
# 用戶在 IDE 中輸入對應 Prompt 指令即可
# 所有終端指令使用 Windows PowerShell。純 .ts，禁止 React/JSX/TailwindCSS。

---

## Prompt 1/12：引擎骨架 + Registry + WebGPU（0–8%）

清空 src/ 後從零開始。

**新建：**
1. `src/core/EngineManager.ts`（≤100行）— WebGPUEngine async init + WebGL2 fallback + resize + portrait
2. `src/core/Registry.ts`（≤80行）— 靜態 class，屬性初始 null：engine/scene/player/chunkLoader/combatSystem/aiSystem/petManager/networkManager/questManager/shopManager/panelManager/currentZone/pvpMode/inventory/totalKills/unlockedZones(string[])
3. `src/core/AssetLoader.ts`（≤120行）— static loadGLB/loadTexture/fileExists，graceful fallback
4. `src/scenes/MainScene.ts`（≤150行）— Scene + ArcRotateCamera + HemisphericLight + Ground(#1A0030) + 暗色天空盒
5. `src/main.ts`（≤60行）— EngineManager → MainScene.init() → runRenderLoop → loading fade out

**驗收：** `npm run dev` → 暗紫地面 + 暗色天空 + loading fade out + Console 無 error

---

## Prompt 2/12：角色 + HUD + Omni-Orb + 搖桿（8–16%）

延續 P1。遵守 GEMINI.md §9 UI 設計系統。

**新建：**
1. `src/entities/Player.ts`（≤250行）— Capsule body + Sphere head + #7B3FE4 emissive + PlayerStats{hp,mp,atk,def,level,exp,gold,diamond,totalKills} + IPlayerState{enter,update,exit} + IdleState/AutoGrindState/ManualOverrideState 骨架 + tempLoot[] 暫存
2. `src/ui/HUD.ts`（≤200行）— #ui-layer 內：頂部 HP/MP/Level/Gold 條 + 底部按鈕列(背包/角色 44px)
3. `src/ui/OmniOrb.ts`（≤150行）— 底部中央 80px 圓 + 輕點展開4圖標(Intent/鍛造/寵物/陣營) + stagger動畫 + 點外收合
4. `src/input/TouchJoystick.ts`（≤120行）— 底部左側 + 觸控+WASD + 回傳方向向量
5. `src/input/PortraitCamera.ts`（≤80行）— ArcRotateCamera FOV65° + lerp跟隨 + beta=1.2 radius=12
6. `src/particles/PickupParticles.ts`（≤80行）— GPUParticle 金紫色磁吸軌跡（預建，P5使用）

**修改：** MainScene.ts 加入 Player/HUD/OmniOrb/Joystick/Camera

**驗收：** 搖桿移動 + WASD + Omni-Orb 彈性展開 + HUD 正確位置

---

## Prompt 3/12：開放世界 6 區域 + ChunkLoader + 羅盤（16–24%）

延續 P1-2。6 大區域使用 GEMINI.md §10 區域表。

**新建：**
1. `src/world/WorldManager.ts`（≤150行）— 10km×10km，6區域定義（起始幽暗森林(0,0)/暗影沼澤(2000,0)/腐朽古道(4000,0)/血月高地(0,3000)/亡者廢墟(2000,3000)/血月要塞(4000,3000)），根據 Player.pos 判斷 currentZone
2. `src/world/ChunkLoader.ts`（≤200行）— 128m Chunk + 3×3 活躍 + Map管理 + dispose < 16ms
3. `src/world/TerrainGenerator.ts`（≤120行）— Perlin noise + 每區域色調 StandardMaterial placeholder
4. `src/world/VegetationSystem.ts`（≤100行）— ThinInstance 樹木+草叢 ≤500/Chunk
5. `src/ui/MiniCompass.ts`（≤60行）— 頂部40px圓 + 方向箭頭 + 區域名

**驗收：** 移動看到不同顏色地形 + 羅盤顯示區域名 + Chunk load/unload

---

## Prompt 4/12：結界 + Phantom Presence + 區域特效（24–32%）

延續 P1-3。

**新建：**
1. `src/world/BarrierSystem.ts`（≤150行）— 紅色結界牆(alpha:0.3+Fresnel+emissive紅) + DynamicTexture「Zone Lock: Lv XX + Quest X + Kill XXX Required」+ 解鎖破碎 GPUParticle
2. `src/world/PhantomPresence.ts`（≤100行）— 灰色腳印ThinInstance(≤200 FIFO) + 血跡DecalMesh + 50Hz oscillator低鳴
3. `src/world/ZoneEffects.ts`（≤120行）— 每區域1個GPUParticle（森林霧/沼澤毒/古道沙/高地火/廢墟雪/要塞血雨）
4. `src/world/PvPZoneVisuals.ts`（≤80行）— 4層PvP視覺

**驗收：** 走到區域邊界 → 紅色結界+三條件文字 + 環境粒子

---

## Prompt 5/12：戰鬥 + 技能 + 怪物 + HP條 + 浮動傷害（32–40%）

延續 P1-4。

**新建：**
1. `src/combat/CombatSystem.ts`（≤200行）— 傷害公式 + 元素反應Map + Hit Stop 100ms
2. `src/combat/SkillManager.ts`（≤150行）— 4技能(火球/冰矛/雷擊/暗影波) + DOM按鈕弧形排列 + 冷卻conic-gradient + GPUParticle技能特效
3. `src/entities/Monster.ts`（≤200行）— 進階Placeholder(body+head+紅眼) + HP/等級/巡邏 + **Billboard HP血條** + 死亡縮小fade→dispose→掉落 + 死亡時 Registry.player.totalKills++
4. `src/entities/MonsterManager.ts`（≤100行）— 根據currentZone等級生成5-10隻/Chunk + 15s respawn
5. `src/entities/DropItem.ts`（≤100行）— Cylinder placeholder + 旋轉 + GPUParticle拖尾 + lerp飛向Player 0.6s → Player.tempLoot[] → dispose
6. `src/combat/FloatingDamage.ts`（≤80行）— DynamicTexture數字 Billboard + 向上飄1m + fade 1s

**驗收：** 怪物HP條 + 按技能 → 粒子爆炸 + 浮動傷害 + Hit Stop → 死亡 → 磁吸拾取

---

## Prompt 6/12：Smart Grind AI + Intent + 教義 + 升級（40–48%）

延續 P1-5。

**新建：**
1. `src/combat/AISystem.ts`（≤200行）— 自動尋路→最近怪物 + 自動施放技能 + AUTO Billboard
2. `src/combat/IntentSystem.ts`（≤100行）— 4 Intent 影響AI目標權重
3. `src/combat/DoctrineSystem.ts`（≤80行）— 3 教義影響技能順序
4. `src/ui/RiskSlider.ts`（≤80行）— DOM range 0-100 + glass-panel 滑入
5. `src/particles/LevelUpEffect.ts`（≤60行）— 金色GPUParticle環繞爆發 2s + HUD「LEVEL UP!」

**修改：** Player.ts 狀態機實作 + OmniOrb.ts + addExp()觸發LevelUp

**驗收：** AUTO刷怪 + 切換Intent → 行為變 + 升級金色爆發

---

## Prompt 7/12：任務系統 + 隱藏NPC + 區域解鎖（48–56%）⭐新增

延續 P1-6。這是區域解鎖的核心——綁定主線任務+等級+刷怪數。

**新建：**
1. `src/systems/QuestManager.ts`（≤250行）
   - **主線任務 25 章**（每章=1個簡單目標）：
     - 1-3：森林教學（殺10怪/拾取5物/到達座標）→ 完成3章解鎖暗影沼澤
     - 4-7：沼澤探索（殺指定怪/累計傷害/使用技能）→ 完成7章解鎖腐朽古道
     - 8-12：古道挑戰（Boss級怪/連殺/元素反應）→ 完成12章解鎖血月高地
     - 13-18：高地深入（PvP模式嘗試/陣營加入）→ 完成18章解鎖亡者廢墟
     - 19-25：廢墟+要塞（終極挑戰）→ 完成25章解鎖血月要塞
   - **支線任務**（隨機生成）：殺X怪/收集X物/限時到達/護送NPC，獎勵金幣+經驗+稀有裝備
   - 任務資料用 JSON 常量定義
   - 進度存 localStorage（P9 建立 Firebase 後自動同步到 quest_progress/$uid）

2. `src/entities/HiddenNPC.ts`（≤120行）
   - 每區域 1-2 個隱藏NPC（隨機位置，SphereGeometry+光環GPUParticle）
   - 走近自動顯示「！」標記（Billboard）
   - 輕點觸發 → 彈出對話面板 → 接受/拒絕支線任務
   - 每 10 分鐘重新刷新位置

3. `src/ui/QuestPanel.ts`（≤150行）
   - 底部 glass-panel（67vh）
   - 主線進度條（25章）+ 目前任務目標 + 獎勵預覽
   - 支線列表（可接受/進行中/已完成）
   - HUD 右上角小任務追蹤器（當前目標文字 Inter 11px）

4. `src/ui/DialoguePanel.ts`（≤80行）
   - NPC 對話面板：NPC名 + 對話文字 + 接受/拒絕按鈕
   - 底部中央彈出，簡潔風格

5. `src/world/ZoneUnlockSystem.ts`（≤100行）
   - 解鎖條件檢查：level >= X && questCompleted >= Y && totalKills >= Z
   - 解鎖瞬間：BarrierSystem 播放破碎 GPUParticle + 血月光芒大增（HemisphericLight intensity 短暫 2x → 恢復）
   - Registry.unlockedZones[] 追蹤

**修改：** HUD（加入任務按鈕+追蹤器）+ BarrierSystem（整合解鎖條件）+ Registry

**驗收：** 任務面板開關 + 殺怪推進主線 + 完成3章→結界破碎→暗影沼澤解鎖 + 隱藏NPC觸發支線

---

## Prompt 8/12：寵物 + 背包 + Whisper Menu（56–64%）

延續 P1-7。

**新建：**
1. `src/entities/Pet.ts`（≤150行）— ConeGeometry + emissive稀有度(白/綠/藍/紫/金) + GPUParticle光環 + lerp跟隨 + 1.2s自動攻擊
2. `src/entities/PetManager.ts`（≤120行）— 最多2隻 + 0.1%掉落蛋 + 3同→1進階合成
3. `src/systems/Inventory.ts`（≤150行）— 裝備陣列{id,name,rarity,stats,level} + 自動替換最新 + 分解/合成 + Player.tempLoot 自動遷移到正式背包
4. `src/ui/InventoryPanel.ts`（≤180行）— glass-panel 67vh + Cinzel標題 + 裝備列表 + 4按鈕(分解/合成/替換/自動)
5. `src/ui/WhisperMenu.ts`（≤60行）— 底部小視窗 滑入2s消失

**驗收：** 刷怪→掉蛋→寵物跟隨→背包面板→一鍵操作→Whisper

---

## Prompt 9/12：PvP + Firebase + 陣營戰 + 死亡（64–72%）

延續 P1-8。Firebase 極簡架構，無 Cloud Functions。

**新建：**
1. `src/combat/PvPSystem.ts`（≤150行）— 3模式(和平金/掠奪紅/競技藍紫) + GPUParticle光環
2. `src/network/NetworkManager.ts`（≤200行）— Firebase Realtime DB 直連 + Mock模式 + Delta sync 100ms + 斷線重連 + Schema: players/$uid{x,y,z,hp,pvpMode,faction,level} + faction_war{active,scores} + chat/$msgId{uid,text,ts} + quest_progress/$uid{mainQuest,totalKills,unlockedZones[]}
3. `src/network/FactionWarManager.ts`（≤150行）— 每週觸發 + Eclipse Rift Chunk + 勝利7天+10%
4. `src/combat/DeathRespawn.ts`（≤80行）— 「YOU DIED」Cinzel 28px紅 + 3s復活 + 3s無敵閃爍

**修改：** OmniOrb + HUD + Registry + QuestManager（P9的 NetworkManager 建立後自動將 localStorage 任務進度同步到 Firebase quest_progress/$uid）

**驗收：** PvP切換→光環變色→模擬死亡→復活

---

## Prompt 10/12：商城 + 養成 + 科技樹（72–80%）⭐新增

延續 P1-9。

**新建：**
1. `src/systems/ShopManager.ts`（≤150行）
   - **金幣商店**：裝備(武器/防具/飾品) + 消耗品(HP藥/MP藥/經驗卷) + 寵物糧食
   - **鑽石商店**：外觀皮膚(僅視覺) + 額外背包格 + 經驗加倍卡(24h) + 復活不掉落卡
   - **鑽石充值**：顯示充值按鈕（$0.99=60鑽 / $4.99=330鑽 / $9.99=700鑽 / $29.99=2200鑽 / $49.99=4000鑽）
   - 充值按鈕暫時 alert("充值功能開發中")，預留 Web Payment API 接口
   - 禁止 VIP 系統

2. `src/ui/ShopPanel.ts`（≤200行）
   - 底部 glass-panel（67vh）
   - 2 Tab：金幣商店(金色邊框) / 鑽石商店(紫色邊框)
   - 每行：物品圖標(純色CSS) + 名稱 + 價格 + 購買按鈕
   - 鑽石充值區：5個充值包按鈕 + 當前鑽石餘額

3. `src/systems/ProgressionSystem.ts`（≤120行）— 5被動技能升級 + Dark Forge一鍵強化
4. `src/systems/FactionTechTree.ts`（≤100行）— 10層Mock資料 + 殺怪+捐獻解鎖
5. `src/ui/TechTreePanel.ts`（≤150行）— 10層橫向滑動 + scroll-snap + 節點圓40px

**修改：** HUD（加入商城按鈕）+ Registry + Player.diamond

**驗收：** 商城面板開關 → 金幣購買 → 鑽石餘額 → 充值按鈕 → 科技樹滑動

---

## Prompt 11/12：聊天 + 設定 + 角色面板 + 全UI（80–88%）

延續 P1-10。所有面板統一管理，互斥開關。

**新建：**
1. `src/ui/PanelManager.ts`（≤80行）— 統一管理 角色/背包/任務/商城/科技/聊天/設定 互斥
2. `src/ui/ChatSystem.ts`（≤150行）— 右下角小面板 + 3Tab(世界/陣營/私聊) + Mesh Billboard氣泡3s fade
3. `src/ui/CharacterPanel.ts`（≤120行）— glass-panel + 角色3D預覽(RenderTargetTexture) + stats + 裝備6格
4. `src/ui/SettingsPanel.ts`（≤100行）— 畫質(高/中/低) + BGM/SFX音量 + 存檔/讀檔按鈕

**修改：** HUD（按鈕列完善）+ MainScene + Registry

**驗收：** 所有面板互斥開關 + 聊天氣泡 + 設定調畫質即時 + 角色3D預覽

---

## Prompt 12/12：Diegetic光環 + 存檔 + 效能 + 新手引導（88–100%）

延續 P1-11。最終收尾。

**新建：**
1. `src/shaders/DiegeticHalo.ts`（≤100行）— ShaderMaterial 符文光環（pvpMode+doctrine+faction）
2. `src/core/PerformanceOptimizer.ts`（≤80行）— FPS<55→降解析度 + GPUParticle限制
3. `src/core/SaveSystem.ts`（≤100行）— localStorage：stats/inventory/position/quest/faction/settings/petData + 30s自動存
4. `src/ui/TutorialOverlay.ts`（≤80行）— 首次3步引導(搖桿→攻擊→Omni-Orb) + localStorage已完成標記

**修改：** vite.config.ts manualChunks + MainScene最終整合 + EngineManager

**最終驗收（20項）：**
| # | 項目 | 預期 |
|---|------|------|
| 1 | 冷啟動 | ≤1.2s |
| 2 | 搖桿+WASD | 60fps |
| 3 | AUTO刷怪 | 自動找怪→攻擊→拾取 |
| 4 | Omni-Orb | 4圖標彈性動畫 |
| 5 | 6區域切換 | 不同色調+Chunk卸載 |
| 6 | 羅盤 | 方向+區域名 |
| 7 | 結界 | 三條件文字+紅牆 |
| 8 | 結界破碎 | 完成任務→華麗特效→解鎖 |
| 9 | 技能 | 冷卻遮罩+GPUParticle |
| 10 | 怪物HP條+浮動傷害 | Billboard跟隨 |
| 11 | 升級 | 金色爆發 |
| 12 | 任務系統 | 主線推進+支線接取 |
| 13 | 隱藏NPC | 輕點觸發任務 |
| 14 | 寵物 | 2隻跟隨+自動攻擊 |
| 15 | 背包+Whisper | 滑入滑出+一鍵 |
| 16 | PvP切換 | 光環變色 |
| 17 | 商城 | 金幣/鑽石購買+充值 |
| 18 | 聊天 | 頭頂氣泡 |
| 19 | 存檔 | 關閉重開恢復 |
| 20 | 記憶體 | ≤110MB |
