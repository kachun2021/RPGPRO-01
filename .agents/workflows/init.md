---
trigger: model_decision
description: 引擎與場景初始化（Prompt 1 / 0–7%）
---

// turbo-all
# 引擎初始化（/init）

對應 **Prompt 1**：EngineManager + Registry + **原神級場景**

---

## 強制規範

- WebGPUEngine → WebGL2 fallback
- **原神風格場景**：DirectionalLight + shadow + 後處理（SSAO/Bloom/FXAA/Color Grading）
- HDR 漸層天空 + 環境反射
- PBR 地面材質（草紋理 diffuse + normal）
- generate_image：草地紋理 + 法線貼圖 + 天空漸層（各獨立生成）
- 生成後立即替換到 PBRMaterial

## 模塊

```
src/core/
├── EngineManager.ts
├── Registry.ts
├── AssetLoader.ts
└── OrientationManager.ts
src/scenes/MainScene.ts  ← 原神級光影
src/main.ts
```

## 執行步驟

1. 清空 src/ 重建
2. generate_image × 3（草地 diffuse/normal/天空）
3. 實作 6 模塊
4. 驗證：PBR 地面 + 陰影 + Bloom + 天空

```
📊 效能預估：60fps / 40MB
📦 資源：generate_image 紋理已整合
```