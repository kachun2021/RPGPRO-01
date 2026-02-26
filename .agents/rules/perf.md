---
trigger: glob
globs: src/**/*.ts,src/**/*.tsx,vite.config.ts,firebase/**,package.json
description: 效能底線自動守門（修改任何 src/ 文件時自動觸發）
---

# 效能底線守門規則（自動觸發）

每次修改 `src/**` 或 `vite.config.ts` 時自動啟動。
**以下為強制約束，任何修改違反時必須警告並拒絕：**

---

## ❌ 嚴禁行為（立即警告）

| 違規行為 | 原因 |
|---------|------|
| 使用 `new ParticleSystem()` CPU 粒子 | 必須用 `GPUParticleSystem` |
| 使用 `BABYLON.GUI.*` | 必須用 DOM overlay |
| 在 update loop 中操作 DOM | 每幀 DOM 操作導致 Reflow |
| 不呼叫 `.dispose()` | Memory leak，記憶體超標 |
| 新增 `drawElements` > 100 per frame | Draw call 過多 |
| 使用 Three.js / R3F / WebGLRenderer | 技術棧衝突，禁止 |
| 單一 App.tsx 累加所有功能 | 模塊化架構要求，禁止 |

---

## ✅ 效能底線（每次修改後必須確認）

| 指標 | 目標值 | 備註 |
|------|-------|------|
| FPS（一般場景） | ≥ 60fps | 中階手機基準 |
| FPS（戰鬥+GPUParticle） | ≥ 58fps | 50個粒子系統同時 |
| 記憶體峰值 | ≤ 110MB | 包含 Firebase 連接 |
| 首畫面時間 | ≤ 1.2s | 漸進載入 |
| Chunk 切換時間 | < 16ms | 60fps 預算內 |

---

## 📋 修改後必須聲明

每次回應結尾必須包含：
```
📊 效能預估：[FPS] fps / [記憶體] MB（中階手機）
🔋 Live Ops 影響：[是否需要玩家重載]
📦 資源狀態：[placeholder / 正式資源] - 下一個替換點：[Prompt X / XX%]
```

---

## WebGPU Fallback 檢查

修改 `EngineManager.ts` 時必須確認：
```typescript
// 必須存在此模式
const engine = await (async () => {
  try {
    const gpu = new WebGPUEngine(canvas);
    await gpu.initAsync();
    return gpu;
  } catch {
    return new Engine(canvas, true); // WebGL2 fallback
  }
})();
```