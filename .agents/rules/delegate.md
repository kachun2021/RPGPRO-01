---
trigger: always_on
---

# 自動路由規則（delegate）

收到任務時，依以下優先順序比對關鍵字，並執行對應 WORKFLOW。
執行前必須先宣告：「我選擇 /xxx 來處理這個任務」

## 路由表（優先順序由高到低）

| 優先 | 關鍵字 | WORKFLOW |
|------|--------|----------|
| 1 | 效能、FPS、記憶體、WebGPU、Snapshot、Live Ops、熱更新、GPU、掉幀 | /perf |
| 2 | 地圖、開放世界、程序化、無縫、生態、LOD、Chunk、地形、Biome | /world |
| 3 | 戰鬥、技能、元素、傷害、連擊、Boss、粒子爆炸、技能冷卻、Hit Stop | /combat |
| 4 | 多人、同步、Firebase、Lag、匹配、反作弊、NetworkManager、PvP、陣營戰 | /multi |
| 5 | UI、HUD、觸控、手勢、Tooltip、虛擬搖桿、大拇指、InputManager | /mixed |
| 6 | 資源、GLB、KTX2、材質、紋理、音效、asset、生成模型、替換、placeholder | /asset-gen |
| 7 | 新功能、新系統、從頭開始、初始化、新增模組 | /init |
| 8 | 完成、驗證、可玩、測試、收尾、交付 | /complete |
| 9 | 修 bug、修正、重構、不新增功能的程式碼修改 | /update |
| 10 | （以上都不符合） | /init + 說明理由 |

## 衝突解決規則（Tie-breaker）

當多個 WORKFLOW 同時命中時，**功能類 > 維護類**：

```
功能類（高優先）：/perf > /world > /combat > /multi > /mixed > /asset-gen > /init
維護類（低優先）：/complete > /update
```

**特殊衝突範例：**
- 「修Boss傷害bug」→ Boss 屬功能關鍵字 → **選 /combat**（非 /update）
- 「優化戰鬥FPS」→ FPS 優先級最高 → **選 /perf**（非 /combat）
- 「多人同步修bug」→ 多人優先 → **選 /multi**（非 /update）
- 「PvP陣營戰 + 戰鬥技能」→ 兩者命中 → **先 /multi 再 /combat**（Prompt 8情境）
- 「替換主角GLB」→ **選 /asset-gen**（非 /init）

## AI 關鍵字特別說明

`AI` 一詞有歧義，判斷規則：
- 「AI 行為、AI 攻擊、AI 巡邏、怪物AI、Smart Grind AI」→ /combat
- 「AI 生成、AI 功能」→ /init

## 現有 WORKFLOW 清單

| 指令 | 檔案路徑 | 用途 | 對應 Prompt |
|------|---------|------|------------|
| /perf | .agents/workflows/perf.md | 效能優化與 Live Ops 熱更新 | Prompt 12 |
| /world | .agents/workflows/world.md | 開放世界與程序化地圖生成 | Prompt 3, 4 |
| /combat | .agents/workflows/combat.md | 元素戰鬥系統設計與實作 | Prompt 5, 6 |
| /multi | .agents/workflows/multi.md | 多人同步與 Firebase 整合 | Prompt 9 |
| /mixed | .agents/workflows/mixed.md | Babylon 與 DOM 混合 UI 實現 | Prompt 7, 8, 10, 11 |
| /asset-gen | .agents/workflows/asset-gen.md | 資源生成與替換（GLB/KTX2/音效） | 各 Prompt 完成後 |
| /init | .agents/workflows/init.md | 場景與功能階段化初始化 | Prompt 1, 2 |
| /complete | .agents/workflows/complete.md | 功能完整性與立即可玩驗證 | Prompt 12 |
| /update | .agents/workflows/update.md | 無衝突更新與 Registry 整合 | 任何修改 |