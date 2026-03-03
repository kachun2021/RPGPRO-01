# Fantasy Pet Online — 10步開發指令集（Stone Age Premium Dark · Production v6）
# 基於代碼審計重設計 — 從現有 60 個 TS 文件出發，不重寫已完成功能
# 每步 80% 預定義 + 20% 用戶反饋空間

---

## 全局品質基準

### 渲染管線（已建立，後續維持）
```typescript
// DefaultRenderingPipeline — P1 已建立，後續不得移除
pipeline.bloomEnabled = true;
pipeline.bloomThreshold = 0.7;
pipeline.bloomWeight = 0.3;
pipeline.bloomKernel = 64;
pipeline.fxaaEnabled = true;
pipeline.imageProcessingEnabled = true;
pipeline.imageProcessing.toneMappingEnabled = true;
pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
pipeline.imageProcessing.exposure = 1.1;
pipeline.imageProcessing.contrast = 1.15;
// SSAO
const ssao = new SSAO2RenderingPipeline("ssao", scene, { ssaoRatio: 0.5, blurRatio: 1 });
ssao.radius = 2.0; ssao.totalStrength = 0.8; ssao.base = 0.1;
```

### 光照基準（已建立）
```typescript
const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.3), scene);
sun.intensity = 1.8;
sun.diffuse = new Color3(1.0, 0.95, 0.85);
const shadowGen = new ShadowGenerator(2048, sun);
shadowGen.usePercentageCloserFiltering = true;
shadowGen.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
const hemi = new HemisphericLight("hemi", new Vector3(0,1,0), scene);
hemi.intensity = 0.4;
hemi.diffuse = new Color3(0.7, 0.8, 1.0);
hemi.groundColor = new Color3(0.3, 0.25, 0.2);
```

### CSS 面板模板（所有面板共用 — Stone Age Premium Dark）
```css
.sa-panel {
  background: linear-gradient(180deg, rgba(25,20,38,0.94), rgba(15,12,25,0.96));
  border: 1px solid rgba(160,130,80,0.3);
  border-radius: 6px;
  box-shadow: 2px 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  pointer-events: auto; overflow: hidden; max-height: 85vh;
}
.sa-panel-title {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; position: relative;
  background: linear-gradient(180deg, rgba(40,30,55,0.9), rgba(25,20,38,0.95));
  color: rgba(232,201,106,0.9); font-weight: 700; font-size: 13px;
  border-bottom: 1px solid rgba(160,130,80,0.2);
}
.panel-close {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: rgba(200,195,185,0.5);
  cursor: pointer; border-radius: 4px; transition: all 0.15s;
}
.panel-close:hover { color: #E74C3C; background: rgba(231,76,60,0.15); }
.btn-gold {
  background: linear-gradient(180deg, #E8C96A, #C4993D);
  color: #0A0E1A; border: none; border-radius: 6px;
  font-weight: 700; cursor: pointer;
}
.dark-slot {
  background: rgba(20,16,30,0.6);
  border: 1px solid rgba(160,130,80,0.2); border-radius: 4px;
}
.dark-slot:hover { border-color: rgba(232,201,106,0.4); }
```

---

## 已完成基礎（不可破壞）

| 模組 | 文件數 | 狀態 |
|------|--------|------|
| Core (Engine/Registry/AssetLoader/Orientation) | 4 | ✅ |
| Scene (MainScene) | 1 | ✅ |
| Input (Joystick/Camera) | 2 | ✅ |
| Player | 1 | ✅ |
| Pets (Data/Manager/Pet/AI/Fusion/Encyclopedia/Equipment/Buff) | 8 | ✅ |
| Combat (CombatSystem/ElementSystem/FloatingDamage/ProjectileSystem) | 4 | ✅ |
| HUD/Minimap/SkillBar/ChatBox/NavBar | 5 | ✅ |
| PetPanel/FusionPanel/EncyclopediaPanel/RenamePanel/RevivalPanel | 5 | ✅ |
| InventoryPanel (含裝備穿脫) | 1 | ✅ |
| QuestPanel (CHM風格)/QuestTracker/DialoguePanel (CHM風格) | 3 | ✅ |
| CommunityPanel (好友/隊伍/公會) | 1 | ✅ |
| WorldMapPanel/ZoneTransition/TeleportSystem | 3 | ✅ |
| Inventory/EggDropSystem | 2 | ✅ |

---

## P1/10：⚔️ 戰鬥完善 + 技能系統 + Boss 機制（0-10%）

**目標**: 戰鬥系統完全可玩 — 自動技能、CD 旋轉、Boss 掉落

**完善現有（不重寫）：**

### [MODIFY] `src/combat/CombatLoop.ts`
- 加入 **AutoSkillConfig**: 每個實體 (玩家+寵物) 可設定技能施放優先順序
- 檢查隊列頂部：CD OK + MP 足夠 → 自動施展 → 下一個
- HP < 30% 時優先回血技能
- Toggle: auto-cast ON/OFF per entity

### [MODIFY] `src/ui/SkillBar.ts`
- CD 旋轉遮罩 `conic-gradient` 動畫
- 技能綁定：點擊/F1-F8 觸發，0.1s scale 回彈
- 自動施法啟用時：外框呼吸光暈

### [MODIFY] `src/ui/SkillPanel.ts`
- 技能列表 + 升級按鈕 (花費 SP)
- 拖放技能到 SkillBar 綁定
- 顯示 MP Cost / CD / Multiplier

### [MODIFY] `src/entities/Monster.ts`
- Boss 金色名牌 + 2x 尺寸
- Boss 死亡: 1s 爆炸 + 金色粒子

### [MODIFY] `src/entities/MonsterManager.ts`
- Boss 3600s respawn 計時器
- Boss 專屬掉落邏輯

### [MODIFY] `src/systems/DropTable.ts`
- Boss 套裝掉落配置
- 區域限定掉落

### [MODIFY] `src/ui/PanelManager.ts`
- 全面啟用面板互斥邏輯

**用戶反饋空間 (20%)**: 技能名稱/效果調整、Boss 難度/掉落率

**驗收**: 自動技能循環 + CD 旋轉 + Boss 金名牌+respawn + 面板互斥

---

## P2/10：🗺️ 世界地圖完善 + 怪物數據整合（10-20%）

**目標**: 17 區域完整可切換，怪物等級正確

### [MODIFY] `src/world/ZoneDefinitions.ts`
- 完整 17 區域怪物等級映射 (對照 Monster_Spawns.md)
- 每區域配置：minLevel, maxLevel, bossId, bossLevel

### [MODIFY] `src/world/ZoneMonsterData.ts`
- CHM 數據完整整合 (147區域→17區域映射)
- 每區域怪物種類+出現率

### [MODIFY] `src/world/ZoneManager.ts`
- 區域切換時 NPC 正確重生 (spawnForZone)
- 確保 DropItem 清理

### [MODIFY] `src/world/ZoneRenderer.ts`
- 各區域不同地形 PBR 顏色/光照

**generate_image**: 5 biome × diffuse+normal = 10 張 terrain textures

**用戶反饋空間**: 區域難度曲線、地圖連接、NPC 位置

**驗收**: 17 區域傳送 + 不同光照/地形 + 怪物等級正確

---

## P3/10：📊 角色成長 — 五維配點 + 技能樹 + 覺醒 + 轉生（20-30%）

**目標**: 角色有完整成長體系

### [NEW] `src/systems/StatAllocation.ts`（≤100行）
- 五維：力(str)/敏(agi)/準(acc)/智(int)/屬(attr)
- 升級每獲 5 點，轉生額外 3 點
- 衍生：`atk=str*2.5 / def=acc*1.5 / hp=str*10+acc*5 / mp=int*8 / dodge=agi*0.3%`

### [NEW] `src/systems/SkillTree.ts`（≤120行）
- 3 列（攻擊/防禦/魔法）+ 一階→二階前置鎖
- SP 分配：每級 +1 SP
- 二階需一階滿 + 特定地圖 NPC

### [NEW] `src/systems/AwakeningSystem.ts`（≤80行）
- 條件：Lv>=50 + 主線 15 章 + NPC
- 獎勵：+10 屬性點 + +5 SP + 光環

### [NEW] `src/systems/RebirthSystem.ts`（≤80行）
- 條件：覺醒後 + Lv>=80
- 重置 Lv.1，永久 +3 全屬性/次

### [MODIFY] `src/ui/CharacterPanel.ts`
- 五維雷達圖 (SVG pentagon) + +/- 按鈕
- 技能樹 Tab (3列橫向+前置連線)
- 覺醒/轉生條件顯示

**用戶反饋空間**: 五維數值、技能效果、覺醒獎勵

**驗收**: 配點→屬性變化 + 技能樹學習 + 覺醒光環 + 轉生

---

## P4/10：📦 裝備完善 + 強化 + 共鳴 + 套裝（30-40%）

**目標**: 裝備系統完全可用

### [MODIFY] `src/systems/EquipmentSystem.ts`
- 套裝效果：Boss 套 2/4/6 件 → 寵傷 +15%/+25%/+35%
- PVP 套：減傷 +10%/+20%/+30%
- 裝備等級分段：Lv.141/150/160/170/180

### [MODIFY] `src/systems/EnhanceSystem.ts`
- 保護道具防降級 (checkbox)
- 失敗 -1 級 (+0 不降)
- 強化特效：成功閃光/失敗震動

### [MODIFY] `src/systems/ResonanceSystem.ts`
- 實際加成計算：`{ series, level, atkBonus, defBonus }`
- 藥水消耗

### [MODIFY] `src/ui/ResonancePanel.ts`
- 選裝備+選藥水→效果預覽→確認按鈕
- 接入 ResonanceSystem 真實邏輯

### [MODIFY] `src/ui/InventoryPanel.ts`
- 道具使用功能 (消耗品)
- 分解功能 (裝備→材料)

**用戶反饋空間**: 強化成功率、套裝名/效果、共鳴種類

**驗收**: 套裝 2/4/6 件效果 + 強化成功/失 + 共鳴加成 + 分解

---

## P5/10：📜 任務擴充 25 章 + NPC 商店 + 技能學習（40-50%）

**目標**: 任務系統完整可推進

### [MODIFY] `src/systems/QuestManager.ts`
- 擴充至 25 章主線 (每 5 章解鎖新地圖)
- 10+ 支線任務
- 每日 3 任務 (00:00 重置)
- 換寵任務

### [MODIFY] `src/entities/NPC.ts`
- 商人 NPC: 開啟 ShopPanel
- 技能導師 NPC: 開啟 SkillPanel (學習)
- 換寵 NPC: 對話→交換

### [NEW] `src/systems/ShopManager.ts`（≤200行）
- NPC 商店：武器/防具/飾品/藥水/寵糧/卷軸
- 買賣邏輯 (金幣扣除/增加)

### [NEW] `src/ui/ShopPanel.ts`（≤200行）
- 左分類 Tab + 右商品 Grid
- 價格 (金幣圖標+數值)
- 購買確認彈窗

### [MODIFY] `src/ui/DialoguePanel.ts`
- 商人→開 ShopPanel, 技能師→開 SkillPanel

**用戶反饋空間**: 任務劇情、商品列表、任務獎勵

**驗收**: 25 章推進 + NPC 買賣 + 技能學習 + 換寵

---

## P6/10：🔗 Firebase + 多人同屏 + 社交（50-60%）

**目標**: 同區域可見其他玩家

### [NEW] `src/network/NetworkManager.ts`（≤200行）
- Firebase RTDB + Mock 模式 (localStorage)
- Delta sync 100ms(己)/200ms(遠)
- onDisconnect() 清理

### [NEW] `src/network/RemotePlayerManager.ts`（≤150行）
- 監聽 `zones/$zoneId/players` → 渲染遠端 (max 20)
- Billboard: 名字+等級+公會

### [NEW] `src/network/PlayerInterpolation.ts`（≤80行）
- 100ms delta → 線性插值

### [NEW] `src/network/FriendManager.ts`（≤80行）
- 好友列表 + Presence (在線/離線)
- 私聊 `chat/$pair`

### [NEW] `src/network/SecurityRules.ts`（≤100行）
- database.rules.json

### [MODIFY] `src/ui/CommunityPanel.ts`
- 接入 Firebase 好友真實數據

**用戶反饋空間**: 同步頻率、遠端渲染、社交優先級

**驗收**: Mock 同步 + 遠端玩家 + 好友列表+在線狀態

---

## P7/10：⚔️ PVP + 公會 + 組隊（60-70%）

### [NEW] `src/combat/PvPSystem.ts`（≤120行）
- 3 模式：和平/PK/競技
- 擊殺獎勵 + 死亡掉金 10%

### [NEW] `src/network/GuildManager.ts`（≤150行）
- 創建 Lv30+100萬GP / 成員管理 / 倉庫 / 留言板

### [NEW] `src/network/PartyManager.ts`（≤100行）
- 8 人隊 + 經驗加成 (2人+25%~8人+100%)

### [MODIFY] `src/ui/CommunityPanel.ts`
- 接入公會/組隊真實數據

**用戶反饋空間**: PVP 規則、公會功能、死亡懲罰

**驗收**: PVP 切換 + 公會創建 + 組隊邀請

---

## P8/10：🛒 商城 + 科技樹 + 變身（70-80%）

### [MODIFY] `src/systems/ShopManager.ts`
- 鑽石商店 + 泡點商城 + 充值

### [NEW] `src/systems/TechTree.ts`（≤100行）
- 10 層公會科技 + 殺怪/捐獻解鎖

### [NEW] `src/systems/TransformSystem.ts`（≤100行）
- 變身鎧甲 + Mesh 替換 + 能力提升
- 限時 + 迴避主動怪

### [NEW] `src/ui/TechTreePanel.ts`（≤120行）
- 10 層橫向 scroll-snap + 節點連線

### [MODIFY] `src/ui/ShopPanel.ts`
- 多分類 (金幣/鑽石/泡點)

**用戶反饋空間**: 商品定價、科技效果、變身外觀

**驗收**: 商城購買 + 科技樹 + 變身

---

## P9/10：💬 聊天完善 + 設定 + AFK + 活動（80-90%）

### [MODIFY] `src/ui/ChatBox.ts`
- Firebase 世界/公會/私聊 4 頻道
- 頭頂氣泡 Billboard 3s fade

### [MODIFY] `src/ui/AFKPanel.ts`
- 接入真實數據：擊殺/經驗/金幣/DPS

### [NEW] `src/ui/SettingsPanel.ts`（≤100行）
- 畫質(高/中/低) + 音量滑桿 + 存檔/讀檔

### [NEW] `src/systems/EventManager.ts`（≤120行）
- 世界 Boss 活動 + 限時地圖
- Live Ops JSON 驅動

**用戶反饋空間**: 聊天功能、活動類型、AFK 獎勵

**驗收**: 聊天 4 頻道 + 設定生效 + AFK 統計 + 活動 Banner

---

## P10/10：🎓 存檔 + 音效 + 引導 + 效能收尾（90-100%）

### [NEW] `src/core/SaveSystem.ts`（≤120行）
- localStorage: stats/inventory/pets/quests/settings/position
- 30s 自動存 + Firebase 同步

### [NEW] `src/core/AudioManager.ts`（≤120行）
- BGM 每區域 + SFX 攻擊/技能/拾取/UI
- 音量控制 + 靜音 toggle

### [NEW] `src/core/PerformanceOptimizer.ts`（≤80行）
- FPS<55 → 降解析度
- GPUParticle 限制 + 畫質自調

### [NEW] `src/ui/TutorialOverlay.ts`（≤100行）
- 4 步引導：搖桿→攻擊→寵物→合成
- 聚焦遮罩 + 箭頭

### [NEW] `src/ui/LevelUpEffect.ts`（≤60行）
- 金色粒子爆發 + LEVEL UP 大字

**驗收 (最終 25 項)**:
| # | 項目 | 預期 |
|---|------|------|
| 1 | 冷啟動 | ≤1.2s |
| 2 | FPS | ≥60 |
| 3 | 3 寵跟隨 | 系列色 |
| 4 | PEF 合成 | 成功/失敗 |
| 5 | 寵物圖鑑 | 40 種 |
| 6 | 元素相剋 | 1.5x/0.7x |
| 7 | 技能 | CD+SP |
| 8 | 17 區域傳送 | 不同光照 |
| 9 | 普怪+Boss | HP+傷害+掉落 |
| 10 | AUTO | 循環 |
| 11 | AFK | 統計 |
| 12 | 裝備 8 部位 | Boss/PVP 套裝 |
| 13 | 強化+共鳴 | 成功率 |
| 14 | 任務 25 章 | 解鎖 |
| 15 | NPC+換寵 | 對話+交換 |
| 16 | 背包 Grid | 稀有度框 |
| 17 | 配點 | 五維 |
| 18 | 覺醒+轉生 | 光環+永久屬性 |
| 19 | 多人同屏 | ≤20人 |
| 20 | PVP+公會 | 3模式 |
| 21 | 商城 | 購買 |
| 22 | 音效 BGM/SFX | 每區域不同 |
| 23 | 存檔+離線 | 關閉恢復 |
| 24 | 活動系統 | 世界Boss+限時 |
| 25 | 記憶體 | ≤110MB |
