---
trigger: model_decision
description: 通用開發流程 — 新增/修改功能
---

// turbo-all
# 通用開發流程（/dev）

適用於：新增功能、修改現有功能、擴充系統。

---

## 流程

### 1. 理解需求
- 確認用戶想要什麼（不假設）
- 查閱 `GAME_STEPS.md` 了解功能現狀
- 如涉及數據：確認 `tables/` 下的數據源

### 2. 分析影響
- 哪些模塊受影響？
- 是否需要新文件？
- 是否影響其他已完成功能？

### 3. 設計（用戶確認後再寫代碼）
- 提出方案，讓用戶決定
- 不要自作主張設計完整系統

### 4. 實作
- 遵循模塊化架構（見 `src/` 目錄結構）
- 新 UI 一律用 DOM overlay + `sa-panel` 主題
- 3D 效果用 GPUParticleSystem (非 CPU)
- 完成後更新 `GAME_STEPS.md` 對應功能狀態

### 5. 驗證
- `npm run typecheck`
- `npm run test:smoke`（如可用）
- 瀏覽器手動確認
