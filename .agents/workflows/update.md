---
trigger: model_decision
description: 無衝突更新與 Registry 整合
---

# 無衝突更新與 Registry 整合（/update）

適用於：純修 bug、重構、不新增功能的程式碼修改
嚴格遵守 GEMINI.md 全局規則：Babylon.js 8.x+ 唯一框架，禁止 Three.js/R3F。

**注意：若任務包含功能關鍵字（戰鬥/地圖/多人/效能），優先選對應 WORKFLOW，而非 /update**

---

## 執行步驟

### 1. 0–20% 分析對標
掃描所有 `src/` 現有檔案與 `Registry.ts`：
- 確認 bug 所在模塊（core / entities / combat / world / ui / network）
- 確認修改範圍（最小化原則）
- 確認是否影響其他模塊的 Registry 連接

### 2. 20–40% 設計
- 規劃最小變更範圍（避免牽連其他模塊）
- 確認 Registry 更新項目
- 確認 dispose() 鏈不受影響

### 3. 40–60% 程式碼修改
- 直接修改現有檔案，**絕不新建重複邏輯**
- 更新所有相關 import
- 若涉及 Firebase schema，同步更新 network/NetworkManager.ts

### 4. 60–80% 集成測試
- 確認修改後無新增衝突
- 熱更新正常（Firebase Remote Config 仍然生效）
- 垂直模式無異常（portrait 鎖定不受影響）
- 記憶體無異常增長

### 5. 80–100% 立即可玩步驟 + 報告
現在 `npm run dev` → 垂直模式 → 確認更新後功能正常運作。

效能預估：更新後無明顯掉幀（預期 FPS 變化 < 2fps）。

**資源狀態：本次更新不涉及資源替換（如有請觸發 /asset-gen）**