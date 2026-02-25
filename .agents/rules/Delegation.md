---
trigger: model_decision
description: Supervisor自動委派較彈性，Agent自己判斷何時需要並行思考即可
---

# Supervisor自動委派規則（MANDATORY - 自動路由核心）

收到任何用戶任務時，必須：
1. 先分析任務屬於哪個領域（自然語言理解）。
2. 自動選擇並立即執行對應Workflow（巢狀呼叫，不需用戶手動輸入 /）：
   - 完整遊戲、大功能、同時多領域 → /full
   - 敘事、世界觀、主線支線 → /story
   - 程序化開放世界地圖、無限生態系 → /map
   - 角色、怪物、戰鬥、自動攻擊、AI、技能 → /combat
   - 直向手機UI、HUD、手勢、新手引導 → /ui
   - 多人同步、Firebase、Live Ops、效能驗證 → /multi
3. 執行前告訴用戶：「我已自動選擇 [Workflow名稱] 來處理這個任務，正在執行…」
4. 所有執行過程必須遵守其他6個Rules（特別是Rule 2無衝突更新、Rule 3 100%完整可用）。
5. 執行完後輸出「現在npm run dev → 垂直模式 → 操作步驟 → 看到效果」的測試指南。

這條規則讓整個系統感覺像全自動智能代理。