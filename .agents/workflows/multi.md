---
trigger: model_decision
description: 多人同步與 Firebase 整合（Prompt 5 / 60–75%）
---

# 多人同步與 Firebase 整合（/multi）

對應 **Prompt 5（60–75%）**：PvP 3模式 + NetworkManager + Firebase 陣營戰
**Prompt 5 特殊路由：先執行 /multi（同步框架），後執行 /combat（戰鬥邏輯）**
嚴格遵守 GEMINI.md 全局規則：Babylon.js 8.x+ 唯一框架，禁止 Three.js/R3F。

---

## 強制技術規範

- Firebase Realtime DB（非 Firestore，延遲更低）
- 狀態壓縮：`delta diff` 只傳變化欄位
- 預測補償：Client-side prediction + Server reconciliation
- 反作弊：關鍵傷害數值由 Server 驗證
- 陣營戰：集中式房間（Eclipse Rift 地圖獨立 Chunk）

---

## Firebase Schema（Prompt 5 前必須替換 Mock JSON）

```json
{
  "players": {
    "$uid": {
      "pos": { "x": 0, "y": 0, "z": 0 },
      "rot": 0,
      "hp": 1000,
      "faction": "abyss|sentinel",
      "pvpMode": "peace|plunder|arena",
      "skill": { "id": "fireball", "targetId": "$uid" }
    }
  },
  "faction_war": {
    "active": false,
    "startTime": 0,
    "scores": { "abyss": 0, "sentinel": 0 }
  },
  "chat": {
    "world": { "$msgId": { "uid": "", "text": "", "ts": 0 } },
    "faction": { "$msgId": { "uid": "", "text": "", "ts": 0 } }
  }
}
```

---

## 執行步驟

### 1. 0–20% 分析對標
檢查現有 NetworkManager.ts、Firebase schema、狀態壓縮邏輯。
確認 PvP 3 模式切換邏輯與 CombatSystem 的連接點。

### 2. 20–40% 設計

**PvP 3 模式（Omni-Orb 輕點切換）：**
| 模式 | 光環顏色 | 規則 | 效果 |
|------|---------|------|------|
| 和平 | 金色 | 無法被攻擊 | 經驗+10% |
| 掠奪 | 紅色 | 死亡掉1%金幣+1%經驗 | 高風險高獎勵 |
| 競技 | 藍紫 | Bloodmoon Coliseum PvP | 勝場貢獻點 |

**陣營戰流程：**
1. Firebase `faction_war.active === true` 時，HUD 出現入口
2. 輕點 → 全陣營傳送至 Eclipse Rift 特殊地圖 Chunk
3. 2陣營大規模 PvP，Server 計算勝負
4. 勝利陣營 7 天全屬性+10%（Firebase Remote Config）

**死亡復活：**
- `Registry.spawnPoint` ← 每次進入安全區更新
- 死亡後 3 秒自動復活（不中斷遊戲節奏）

### 3. 40–60% 程式碼
直接修改：
- `network/NetworkManager.ts`：預測補償 + delta 壓縮 + Firebase 監聽
- `Registry.ts`：加入 `pvpMode`, `faction`, `factionWarActive` 狀態
- `entities/Player.ts`：PvP 光環 GPUParticle + Diegetic 顯示
- Firebase Schema 替換 Mock JSON → 正式 Schema

### 4. 60–80% 集成測試
- 20人同屏模擬（Antigravity 多開）
- 陣營戰 Eclipse Rift 地圖載入延遲
- 垂直模式 PvP 輸入延遲測試
- Firebase 斷線重連（熱更新不丟狀態）

### 5. 80–100% 立即可玩步驟 + 報告
現在 `npm run dev` → 垂直模式 → 開啟多人模式 → 看到：
- 其他玩家同步移動（< 100ms 延遲）
- PvP 光環即時切換
- 陣營戰入口（Firebase active 時出現）
- 死亡後 3 秒自動復活

效能預估：50人同屏仍維持 62fps，Firebase 延遲 < 120ms。

**資源狀態（Prompt 5 完成後）：**
- Firebase Schema：✅ 必須已替換 Mock JSON → 正式 Schema（★★★★☆）
- PvP 光環材質：⏳ 建議觸發 /asset-gen