---
trigger: model_decision
description: Babylon 與 DOM 混合 UI 實現（Prompt 4 / 45–60% 及 Prompt 6 / 75–90%）
---

# Babylon 與 DOM 混合 UI 實現（/mixed）

對應 **Prompt 4（45–60%）**：PetSystem + InventorySystem + WhisperMenu
對應 **Prompt 6（75–90%）**：ProgressionSystem + ChatSystem + 全UI子介面
嚴格遵守 GEMINI.md 全局規則：Babylon.js 8.x+ 唯一框架，禁止 Three.js/R3F。

---

## 強制技術規範

- HUD / UI：**DOM overlay**（非 Babylon.GUI，已驗證架構）
- 血條 / 傷害數字：`LinkedMesh` + Billboard（3D世界跟隨）
- 所有操作：**輕點 + 輕滑**（嚴禁長按、雙擊）
- 大拇指熱區：底部 40% 區域為主要互動區
- 底部彈出介面：佔2/3畫面，仍可見3D世界

---

## Prompt 4 功能設計（寵物 + 背包 + WhisperMenu）

**寵物系統：**
- Client 生成 ConeGeometry placeholder（Server 只決定0.1%掉落）
- 金紫色光環：`GPUParticleSystem` 環繞
- lerp 跟隨（最多2隻，優先位置 = 角色左右各1m）
- 每1.2秒自動攻擊最近怪物（CombatSystem 事件觸發）
- 3同→1進階 合成（DOM 確認彈窗）

**傳統極簡背包：**
- 底部背包圖標輕點展開 → 直向半透明列表（DOM）
- 一鍵操作：分解全部低級 / 合成所有同類 / 替換最新 / 自動替換（預設開）

**Whisper Menu：**
- 裝備自動替換時 → 底部滑入半透明視窗（2秒消失）
- 顯示：「新裝備已自動替換！戰力+12%」

---

## Prompt 6 功能設計（養成 + 聊天 + 所有UI）

**陣營科技樹：**
- 10層橫向滑動介面（DOM scroll）
- 解鎖條件：總殺怪+捐獻金
- 每層全陣營加成（Firebase Remote Config 即時生效）

**聊天系統：**
- 世界 / 陣營 / 私聊 三個 Tab
- 訊息氣泡：`LinkedMesh` Billboard 從角色頭上浮現（純3D，不用DOM）
- 右下角收起按鈕，輕點彈出

**UI子介面規則：**
- 全部從底部輕滑上來
- 佔2/3畫面（top: 33vh）
- 背景：`rgba(10,0,20,0.85)` + `backdrop-filter: blur(12px)`
- 仍可見3D世界（不全屏覆蓋）

---

## 執行步驟

### 1. 0–20% 分析對標
檢查現有 HUD.ts、PetSystem、Tooltip 系統、輸入事件衝突。

### 2. 20–40% 設計
- DOM overlay z-index 層級規劃（3D: 0, HUD: 10, Panel: 20, Modal: 30）
- 觸控事件穿透（pointer-events: none / auto 策略）
- Whisper Menu 動畫（CSS transform + transition）

### 3. 40–60% 程式碼
直接修改：
- `ui/HUD.ts`：血條 LinkedMesh + Omni-Orb DOM 徑向選單
- `entities/Pet.ts`：ConeGeometry + lerp + GPUParticle 光環
- `ui/InventoryPanel.ts`：新建，背包 DOM 面板
- `ui/WhisperMenu.ts`：新建，底部滑入通知

### 4. 60–80% 集成測試
- 射線穿透測試（DOM 觸控 vs Babylon 場景碰撞不衝突）
- 大拇指熱區（底部40% = 2隻手指可及）
- Tooltip 跟隨 3D 座標（LinkedMesh Billboard）
- 背包開啟時 3D 世界仍渲染（不停幀）

### 5. 80–100% 立即可玩步驟 + 報告
現在 `npm run dev` → 垂直模式 → 輕點背包 → 看到：
- 底部滑入背包面板（3D仍可見）
- 一鍵合成/分解執行
- Whisper Menu 自動彈出消失
- 寵物 lerp 跟隨 + 自動攻擊

效能預估：HUD 穩定 75fps，DOM overlay 不影響 Babylon 渲染。

**資源狀態（Prompt 4 完成後觸發 /asset-gen）：**
- 寵物 GLB：⏳ ConeGeometry → **必須觸發 /asset-gen（★★★☆☆）**
- 音效 / BGM：⏳ 靜音 → **必須觸發 /asset-gen（★★★☆☆）**
- UI 圖標：⏳ 純色 CSS → Prompt 6 後替換（★★★☆☆）