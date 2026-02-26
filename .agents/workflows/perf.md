---
trigger: model_decision
description: 效能優化與 Live Ops 熱更新（Prompt 12 / 88–100%）
---

// turbo-all
# 效能優化與 Live Ops 熱更（/perf）

對應 **Prompt 7（90–100%）**：Diegetic光環 + 性能最終優化 + Mock資料驗收
嚴格遵守 GEMINI.md 全局規則：Babylon.js 8.x+ 唯一框架，禁止 Three.js/R3F。

---

## 效能目標（必須達標才算完成）

| 指標 | 目標 | 測試裝置 |
|------|------|---------|
| FPS（開放世界） | ≥ 60fps | Snapdragon 778G / Pixel 7a |
| FPS（戰鬥50粒子） | ≥ 58fps | iPhone 13 |
| 記憶體峰值 | ≤ 110MB | 所有目標裝置 |
| 首畫面時間 | ≤ 1.2s | 冷啟動 |
| Chunk 切換 | < 16ms | 60fps預算內 |

---

## 執行步驟

### 1. 0–20% 分析對標
使用 Babylon Inspector + Chrome Performance 記錄：
- 當前 FPS / 記憶體 / GPU 使用率
- Thin Instance 使用率
- Snapshot Rendering 狀態
- Draw Call 數量（目標 < 100 per frame）

### 2. 20–40% 設計優化方案

**效能三寶：**
1. **Snapshot Rendering**：靜態場景截圖緩存（草叢/裝飾物）
2. **Thin Instances**：樹木/怪物批次渲染
3. **Node Render Graph**：後處理管線（Bloom → SSR → FXAA 可動態開關）

**Vite Chunk 分離（Live Ops 關鍵）：**
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'babylon': ['@babylonjs/core', '@babylonjs/loaders'],
        'assets': ['./src/core/AssetLoader'],
        'ui': ['./src/ui/HUD', './src/ui/InventoryPanel'],
        'network': ['./src/network/NetworkManager'],
      }
    }
  }
}
```

**Diegetic 光環（Prompt 7 特有）：**
- 根據 PvP模式 + 教義 + 陣營 顯示不同符文光環
- 使用 Babylon.js `ShaderMaterial` GPU Shader
- 光環整合到角色 Mesh，非 DOM overlay

### 3. 40–60% 程式碼
直接修改：
- `core/EngineManager.ts`：開啟 Snapshot Rendering + 動態解析度縮放
- `world/ChunkLoader.ts`：Thin Instances 草叢 + LOD 自動切換
- `combat/ParticleSystem.ts`：GPUParticle 合批（減少 Draw Call）
- `vite.config.ts`：Chunk 分離設定

### 4. 60–80% 集成測試
在 Antigravity 內建瀏覽器測試：
- iPhone 13 portrait 模式完整流程：登入 → 刷怪 → 背包 → PvP 切換 → 陣營戰
- 低電量模式（Safari 限速 CPU）
- 網路斷線重連（Firebase 熱更新不丟狀態）
- WebGL2 fallback 完整測試

### 5. 80–100% 立即可玩步驟 + 報告
現在 `npm run dev` → 垂直模式（iPhone 14 portrait）→ 完整流程：
1. F5 冷啟動 → 1.2秒內進入幽暗森林
2. Smart Grind AI 自動刷怪 → 磁吸拾取
3. 開啟背包一鍵合成 → Whisper Menu 出現
4. Omni-Orb 切換 PvP 掠奪模式
5. 陣營戰入口 → Eclipse Rift 傳送
6. Diegetic 光環切換顯示

FPS / 記憶體對比：
- 優化前：48fps / 168MB
- 優化後：78fps / 92MB（中階手機）

Live Ops 影響：
- 本月活動推送 → 只更新 `ui.chunk`（玩家無需重載）
- Firebase Remote Config → 即時調整怪物掉落率/陣營加成

**最終資源狀態確認（Prompt 7 完成）：**
- 主角 GLB：✅ 正式資源
- 核心怪物 GLB：✅ 正式資源
- 地形 KTX2：✅ 正式資源
- 粒子材質：✅ 正式資源
- 寵物 GLB：✅ 正式資源
- 音效 / BGM：✅ 正式資源
- UI 圖標：✅ 正式資源
- 環境裝飾 GLB：✅ 正式資源（本 Prompt 完成）