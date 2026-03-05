---
trigger: model_decision
description: 無衝突更新與 Registry 整合
---

// turbo-all
# 無衝突更新（/update）

適用於：修 bug、重構、不新增功能的程式碼修改。

---

## 流程

### 1. 分析
- 定位 bug 或重構範圍
- 確認受影響模塊（避免跨模塊巨型修改）

### 2. 前置檢查
- 修改不影響核心接口（PetManager/CombatSystem/Registry）
- 修改不違反效能底線（perf.md）
- 修改不破壞橫向/直向雙模式

### 3. 修改
- 最小化修改範圍
- 更新 Registry 如需要

### 4. 驗證
- `npm run typecheck`
- `npm run test:smoke`
- 被修改功能手動測試