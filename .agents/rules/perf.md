---
trigger: always_on
---

# 效能底線守門規則（自動觸發）

每次修改 `src/**` 或 `vite.config.ts` 時自動啟動。
**以下為強制約束，任何修改違反時必須警告並拒絕：**

---

## ❌ 嚴禁行為（立即警告）

| 違規行為 | 原因 |
|---------|------|
| `new ParticleSystem()` CPU 粒子 | 必須用 `GPUParticleSystem` |
| `BABYLON.GUI.*` | 必須用 DOM overlay |
| 在 update loop 中操作 DOM | 每幀 DOM 導致 Reflow |
| 不呼叫 `.dispose()` | Memory leak |
| `drawElements` > 100/幀 | Draw call 過多 |
| Three.js / R3F | 禁止 |
| 單一 main.ts 累加 | 模塊化要求 |
| generate_image 多資源堆一張 | 每個資源獨立生成 |

---

## ✅ 效能底線

| 指標 | 目標 |
|------|------|
| FPS（一般場景） | ≥ 60fps |
| FPS（戰鬥 3寵+10怪+粒子） | ≥ 58fps |
| 記憶體峰值 | ≤ 110MB |
| 首畫面時間 | ≤ 1.2s |
| 區域切換 | < 500ms |
| 方向切換（橫↔直） | < 400ms |

---

## 📋 修改後聲明

```
📊 效能預估：[FPS] fps / [記憶體] MB（中階手機）
🐾 寵物狀態：[X種/X配方/X系列]
🔋 Live Ops 影響：[是否需要重載]
📦 資源狀態：[placeholder / 正式] → 下一替換：[Prompt X]
```

## WebGPU Fallback

修改 `EngineManager.ts` 時必須確認 WebGPU → WebGL2 fallback 存在。

## 橫向/直向

- 橫向 @media (orientation: landscape) 正常
- 直向 @media (orientation: portrait) AFK 正常