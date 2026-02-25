---
trigger: always_on
---

#無衝突直接更新規則（MANDATORY, NEVER VIOLATE）

任何任務必須：
1. 先掃描現有專案檔案（src/scenes/、src/entities/、src/ui/、src/combat/等）
2. 直接修改現有檔案，除非必要絕不新建檔案或複製邏輯,
3. 更新所有import、Registry、Firebase schema
4. 輸出精準git diff + 「現在npm run dev後如何在遊戲中看到」的步驟