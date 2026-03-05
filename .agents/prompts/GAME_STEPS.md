# Fantasy Pet Online — 功能進度追蹤

> 本文件是**進度總覽**，不是實作指令。每項功能標記狀態後供 AI 助手理解上下文。
> 你可以按任意順序開發任何功能。

**狀態圖例**: ✅ 已完成 | 🔧 開發中 | 📋 未開始

---

## 當前代碼狀態（67 TS 文件）

| 模組 | 文件 | 狀態 |
|------|------|------|
| Core | EngineManager, Registry, AssetLoader, OrientationManager | ✅ |
| Scene | MainScene (PBR+Shadow+Bloom+SSAO+FXAA) | ✅ |
| Input | TouchJoystick, LandscapeCamera | ✅ |
| Player | Player | ✅ |
| Pets | Pet, PetManager, PetData, PetAI, PetFusion, PetEncyclopedia, PetEquipment, PetBuff | ✅ |
| Combat | CombatSystem, CombatLoop, ElementSystem, FloatingDamage, ProjectileSystem | ✅ |
| Entities | Monster, MonsterManager, NPC, DropItem | ✅ |
| World | ZoneManager, ZoneDefinitions, ZoneRenderer, TeleportSystem, VegetationSystem | ✅ |
| Systems | Inventory, QuestManager, ShopManager, EquipmentSystem, EnhanceSystem, ResonanceSystem, StatAllocation, SkillTree, AwakeningSystem, RebirthSystem, DropTable, EggDropSystem | ✅ |
| UI | HUD, Minimap, SkillBar, ChatBox, PanelManager, PetPanel, FusionPanel, EncyclopediaPanel, RenamePanel, RevivalPanel, InventoryPanel, QuestPanel, QuestTracker, DialoguePanel, CommunityPanel, WorldMapPanel, ZoneTransition, CharacterPanel, AFKPanel, ShopPanel, SkillPanel, SystemPanel, PetControlBar, ResonancePanel | ✅ |

---

## 功能清單

### ⚔️ 戰鬥系統

| 功能 | 狀態 | 備註 |
|------|------|------|
| 基礎攻擊 + 目標鎖定 | ✅ | CombatSystem |
| 元素相剋 (1.5x/0.7x) | ✅ | ElementSystem |
| 浮動傷害數字 | ✅ | FloatingDamage |
| 投射物系統 (遠攻寵物) | ✅ | ProjectileSystem |
| 自動技能輪轉 (AutoSkillConfig) | 🔧 | CombatLoop — 需完善 CD 隊列 |
| 技能 CD 旋轉遮罩 (conic-gradient) | 🔧 | SkillBar |
| 技能升級 + SP 分配 | 🔧 | SkillPanel |
| Boss 金色名牌 + 2x 尺寸 | 📋 | Monster.ts |
| Boss 3600s respawn + 專屬掉落 | 📋 | MonsterManager |
| Boss 死亡爆炸特效 | 📋 | GPUParticleSystem |
| 蛋掉落公告 (全屏金字) | 📋 | EggDropSystem |

### 🐾 寵物系統

| 功能 | 狀態 | 備註 |
|------|------|------|
| 8 系列 + 40 種定義 | ✅ | PetData |
| 100 攜帶 + 3 出戰 | ✅ | PetManager |
| 系列色 placeholder 跟隨 | ✅ | Pet |
| PEF 合成 (CHM MixMon 數據) | ✅ | PetFusion + FusionPanel |
| 圖鑑 40 種收集 | ✅ | PetEncyclopedia |
| 寵物裝備 3 欄位 | ✅ | PetEquipment |
| 寵物 Buff 系統 | ✅ | PetBuff |
| 寵物技能自動升級 | 📋 | PetAI |
| NPC 孵蛋功能 | 📋 | NPC + PetManager |

### 🗺️ 世界地圖

| 功能 | 狀態 | 備註 |
|------|------|------|
| 17 區域定義 | ✅ | ZoneDefinitions |
| 區域切換 + 傳送門 | ✅ | ZoneManager + TeleportSystem |
| 區域過渡動畫 | ✅ | ZoneTransition |
| 世界地圖面板 | ✅ | WorldMapPanel |
| ThinInstance 植被 | ✅ | VegetationSystem |
| CHM 怪物數據完整整合 | 🔧 | 147→17 區域映射 |
| 各區域不同 PBR 光照/天空 | 📋 | ZoneRenderer |
| 區域解鎖綁定主線任務 | 📋 | MapUnlockSystem (未建) |

### 📊 角色成長

| 功能 | 狀態 | 備註 |
|------|------|------|
| 五維配點 (str/agi/acc/int/attr) | ✅ | StatAllocation (需完善衍生計算) |
| 技能樹 3 列 | ✅ | SkillTree (需完善前置鎖) |
| 覺醒系統 | ✅ | AwakeningSystem (需接入條件判斷) |
| 轉生系統 | ✅ | RebirthSystem (需接入條件判斷) |
| 角色面板 (雷達圖+技能樹 Tab) | ✅ | CharacterPanel |

### 📦 裝備系統

| 功能 | 狀態 | 備註 |
|------|------|------|
| 8 部位穿脫 | ✅ | EquipmentSystem |
| 強化 +1~+10 | ✅ | EnhanceSystem (需完善特效) |
| 共鳴系統 | ✅ | ResonanceSystem (需接入真實加成) |
| 套裝效果 (Boss/PVP 雙軌) | 📋 | EquipmentSystem |
| 裝備分解→材料 | 📋 | InventoryPanel |

### 📜 任務 + NPC

| 功能 | 狀態 | 備註 |
|------|------|------|
| 任務框架 + 追蹤 | ✅ | QuestManager + QuestTracker |
| NPC 對話系統 | ✅ | DialoguePanel |
| 任務面板 (CHM 風格) | ✅ | QuestPanel |
| 擴充至 25 章主線 | 📋 | QuestManager |
| 支線 + 每日任務 | 📋 | QuestManager |
| NPC 商店邏輯 | ✅ | ShopManager + ShopPanel |
| 技能導師 NPC | 📋 | NPC |
| 換寵 NPC | 📋 | NPC |

### 🔗 多人 + Firebase

| 功能 | 狀態 | 備註 |
|------|------|------|
| NetworkManager (Firebase + Mock) | 📋 | |
| 同區域遠端玩家 (max 20) | 📋 | |
| 線性插值同步 | 📋 | |
| 好友系統 | 📋 | CommunityPanel 已有 UI 框架 |
| 公會 CRUD | 📋 | CommunityPanel 已有 UI 框架 |
| 組隊系統 | 📋 | CommunityPanel 已有 UI 框架 |

### ⚔️ PVP

| 功能 | 狀態 | 備註 |
|------|------|------|
| 和平/PK/競技 3 模式 | 📋 | |
| 擊殺獎勵 + 死亡懲罰 | 📋 | |

### 🛒 商城 + 進階系統

| 功能 | 狀態 | 備註 |
|------|------|------|
| NPC 基礎商店 | ✅ | ShopManager + ShopPanel |
| 鑽石/泡點商城 | 📋 | |
| 公會科技樹 | 📋 | |
| 變身系統 | 📋 | |

### 💬 社交 + 生活品質

| 功能 | 狀態 | 備註 |
|------|------|------|
| 聊天 3 頻道 UI | ✅ | ChatBox |
| Firebase 即時聊天 | 📋 | |
| AFK 掛機面板 | ✅ | AFKPanel (需接真實數據) |
| 系統設定面板 | ✅ | SystemPanel |
| 活動系統 (JSON 驅動) | 📋 | |

### 🎓 收尾

| 功能 | 狀態 | 備註 |
|------|------|------|
| 本地存檔 (localStorage) | 📋 | |
| 音效系統 (BGM + SFX) | 📋 | |
| 新手引導 4 步 | 📋 | |
| 升級特效 | 📋 | |
| 效能自適應 (FPS<55 降畫質) | 📋 | |

---

## 品質基準（已建立，後續維持）

### 渲染管線
- DefaultRenderingPipeline: Bloom + FXAA + ACES Tone Mapping
- SSAO2: r=2.0, strength=0.8
- DirectionalLight + PCF Shadow (2048)
- HemisphericLight ambient

### CSS 面板系統
- 所有面板使用 `sa-panel` class（Stone Age Premium Dark）
- 配色：深紫黑背景 + 金色邊框/文字
- 字體：Cinzel (標題) + Inter (內文)

### 資源管理
- 2D 素材用 generate_image 即時生成（見 `/asset-gen` workflow）
- 3D GLB 模型 = P10 後用戶替換，開發期用 geometry placeholder

---

## 數據源

| 數據 | 位置 | 用途 |
|------|------|------|
| 怪物分佈表 (147 區域) | `tables/Monster_Spawns.md` | 區域怪物配置 |
| 合成配方 (MixMon) | `tables/Fusion_Recipes.md` | PEF 合成 |
| MySQL 導出 (JSON) | `output/` | NPC/物品/英雄/區域數據 |
