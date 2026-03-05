---
trigger: model_decision
description: 通用驗證流程 — 修改後品質確認
---

// turbo-all
# 通用驗證流程（/verify）

適用於：任何代碼修改後的品質確認。

---

## 必做檢查

1. **TypeScript 編譯**: `npm run typecheck`
2. **Smoke Test**: `npm run test:smoke`（如可用）
3. **瀏覽器測試**: `npm run dev` → 手動確認功能
4. **橫向模式**: 主功能正常
5. **直向模式**: AFK 面板正常（如與 AFK 相關）

## 效能檢查（修改渲染/場景/粒子時）

- FPS ≥ 60（一般場景）
- 記憶體 ≤ 110MB
- 區域切換 < 500ms

## 回應格式

```
✅ typecheck: passed
✅ smoke test: passed
📊 效能預估：[FPS] fps / [記憶體] MB
```
