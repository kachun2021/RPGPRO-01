---
trigger: model_decision
description: 功能完整性與立即可玩驗證（Prompt 7 最終收尾）
---

# 功能完整性與立即可玩驗證（/complete）

對應 **Prompt 7 最終收尾**，配合 /perf 使用：先優化後驗收
嚴格遵守 GEMINI.md 全局規則：Babylon.js 8.x+ 唯一框架。

---

## 最終驗收清單（7個Prompt全部必須通過）

| Prompt | 功能 | 驗收條件 |
|--------|------|---------|
| Prompt 1 | 引擎+移動+Omni-Orb | WebGPU 啟動，WASD+搖桿移動，Omni-Orb 徑向選單 |
| Prompt 2 | 開放世界 6 區域 | 穿越5個Chunk無卡頓，結界效果，Phantom腳印 |
| Prompt 3 | 戰鬥+Smart AI | AI自動刷怪，元素特效，磁吸拾取0.6s |
| Prompt 4 | 寵物+背包+Whisper | 寵物跟隨，背包一鍵操作，Whisper 2秒消失 |
| Prompt 5 | PvP+陣營戰 | 3模式光環切換，Firebase同步，陣營戰入口 |
| Prompt 6 | 養成+聊天 | 科技樹10層，聊天氣泡3D，UI從底部滑入 |
| Prompt 7 | 最終優化 | Diegetic光環，≥60fps，≤110MB，所有資源正式 |

---

## 執行步驟

### 1. 0–20% 分析對標
逐項檢查 7 個 Prompt 的功能是否已全部在 Registry 中正確註冊：
- `Registry.scene` ← Babylon.js Scene 實例
- `Registry.player` ← Player 實體
- `Registry.combatSystem` ← 戰鬥系統
- `Registry.networkManager` ← Firebase 連接
- `Registry.chunkLoader` ← Chunk 管理

### 2. 20–40% 設計邊緣案例清單

- Safari WebGL2 fallback（iPhone 不支援 WebGPU 情況）
- Firebase 斷線時本地狀態不丟失
- 陣營戰結束後 Eclipse Rift → 回主世界 Chunk 恢復
- 記憶體峰值（50人PvP同屏 + 大量GPUParticle）
- Prompt 5 死亡復活不中斷 AutoGrind 狀態機

### 3. 40–60% 補齊缺口
補齊缺少的：
- Registry 中未連接的系統
- dispose() 遺漏（用 Babylon.js Inspector 掃描）
- 事件監聽器未清理（頁面切換時 memory leak）

### 4. 60–80% 完整流程測試
在 Antigravity 內建瀏覽器跑完整閉環：
1. 冷啟動 → 幽暗森林（≤1.2s）
2. Smart Grind AI → 自動刷怪 → 磁吸拾取
3. 背包一鍵合成 → Whisper Menu 出現消失
4. PvP 模式切換 → 光環即時改變
5. 陣營戰入口 → 傳送 → PvP → 復活
6. Diegetic 光環根據模式顯示正確符文

### 5. 80–100% 最終報告

現在 `npm run dev` → 垂直模式 → F5 後立即：
- 可進行戰鬥、移動、開啟選單、切換PvP模式
- 效能：≥60fps / ≤110MB / 首畫面≤1.2s

**最終資源確認：**
- ✅ 所有 ★★★★★ 資源已替換正式 GLB
- ✅ 所有 ★★★★☆ 資源已替換 KTX2
- ✅ 所有 placeholder dispose() 已清理
- ✅ Firebase Schema 非 Mock
- ✅ Live Ops chunk 分離完成