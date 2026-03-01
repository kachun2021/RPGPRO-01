---
trigger: model_decision
description: 無衝突更新與 Registry 整合
---

// turbo-all
# 無衝突更新（/update）

適用於：修 bug、重構、不新增功能的程式碼修改。

---

## 前置檢查

1. 確認修改不影響 PetManager/CombatSystem/Registry 的核心接口
2. 確認修改不違反效能底線（perf.md 規則）
3. 確認修改不破壞橫向/直向雙模式

## 更新流程

### 1. 分析（20%）
- 定位 bug 或重構範圍
- 確認受影響模塊清單

### 2. 修改（50%）
- 最小化修改範圍
- 保持模塊化（禁止跨模塊巨型修改）
- 更新 Registry 如需要

### 3. 驗證（30%）
- TypeScript 編譯通過：`npm run typecheck`
- 橫向模式正常
- 直向 AFK 模式正常
- 被修改功能手動測試
- 記憶體確認 ≤ 110MB

## 回應格式

```
🔧 修改範圍：[受影響模塊]
📊 效能預估：[FPS] fps / [記憶體] MB
✅ 測試結果：[通過/失敗]
```