---
trigger: model_decision
description: 元素戰鬥系統設計與實作（Prompt 5, 6 / 32–48%）
---

// turbo-all
# 元素戰鬥系統設計與實作（/combat）

對應 **Prompt 3（30–45%）**：CombatSystem + SmartGrindAI + SkillManager
Also covers **Prompt 5 PvP 戰鬥部分**（配合 /multi 使用）
嚴格遵守 GEMINI.md 全局規則：Babylon.js 8.x+ 唯一框架，禁止 Three.js/R3F。

---

## 強制技術規範

- 技能特效：`GPUParticleSystem`（嚴禁 CPU 粒子）
- 傷害數字：`LinkedMesh` + Billboard（跟隨世界座標）
- AI 尋路：Babylon.js `RecastNavigationPlugin` A* 尋路
- Hit Stop：`engine.setHardwareScalingLevel()` 短暫降幀模擬頓挫感
- 狀態機：State Pattern（BaseState / IdleState / AutoGrindState / ManualOverrideState）
- 嚴禁：巢狀 if-else 控制戰鬥流程

---

## 執行步驟

### 1. 0–20% 分析對標
檢查現有 CombatSystem.ts、SkillManager.ts、ParticleSystem、Hit Stop 實作。
確認怪物 AI 尋路與 Player 位置的 Registry 連接。

### 2. 20–40% 設計

**元素反應表：**
| 元素A | 元素B | 反應 | 特效 |
|------|------|------|------|
| 火 | 冰 | 蒸發（2x傷害） | 白色蒸氣GPUParticle |
| 雷 | 水 | 超導（範圍） | 藍色電弧LinkedMesh |
| 暗 | 光 | 湮滅（DoT） | 紫黑漩渦GPUParticle |

**Smart Grind AI（Prompt 3核心）：**
- 自動 A* 尋路 → 優先最低HP怪物
- 自動施放 4-6 技能（優先元素反應觸發）
- 自動磁吸拾取（0.6秒 lerp 飛行動畫）
- 風險滑桿（0-100）控制 AI 是否進入高危區

**PvP AUTO模式（Prompt 5配套）：**
- 頭頂「FULL AUTO」光環 Diegetic 顯示
- 技能全自動放出，無逃跑功能
- 死亡：自動復活最近安全點

### 3. 40–60% 程式碼
直接修改：
- `CombatSystem.ts`：元素反應表 + 傷害計算 + Hit Stop
- `SkillManager.ts`：4-6 技能 + GPUParticle 特效
- `entities/Monster.ts`：行為樹 + A* 尋路 + LOD BoxGeometry placeholder
- `ui/HUD.ts`：技能冷卻 DOM overlay + 傷害數字 LinkedMesh

### 4. 60–80% 集成測試
- 連擊元素反應視覺（GPUParticle 觸發確認）
- 垂直觸控技能按鈕大拇指熱區
- AI 反應時間（目標 < 200ms 決策週期）
- Hit Stop 不影響整體 FPS（應在 localTimeFactor 層實作）

### 5. 80–100% 立即可玩步驟 + 報告
現在 `npm run dev` → 垂直模式 → 點擊怪物 → 施放元素技能 → 看到：
- GPUParticle 爆炸特效
- 元素反應觸發（蒸發/超導/湮滅）
- 傷害數字 LinkedMesh 跟隨
- Smart Grind AI 自動循環

效能預估：戰鬥中 65fps，GPUParticle 50個粒子系統同時，中階手機。

**資源狀態（Prompt 3 完成後觸發 /asset-gen）：**
- 核心怪物 GLB：⏳ BoxGeometry → **必須立即觸發 /asset-gen（★★★★★）**
- 粒子材質：⏳ 白點 → **必須立即觸發 /asset-gen（★★★★☆）**
- 主角 GLB：確認是否已在 Prompt 1 後替換