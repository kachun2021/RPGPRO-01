---
trigger: model_decision
description: 開放世界與程序化地圖生成（Prompt 3, 4 / 16–32%）
---

// turbo-all
# 開放世界與程序化地圖生成（/world）

對應 **Prompt 2（15–30%）**：WorldManager + 6區域 + 結界 + Phantom Presence
嚴格遵守 GEMINI.md 全局規則：Babylon.js 8.x+ 唯一框架，禁止 Three.js/R3F。

---

## 強制技術規範

- 地形：Babylon.js `DynamicTexture` + `GroundMesh` with Perlin Noise
- 草叢 / 樹木：`ThinInstance`（比 InstancedMesh 快 30%）
- 粒子：`GPUParticleSystem`（非 CPU ParticleSystem）
- LOD：Babylon 內建 `mesh.addLODLevel()`
- 結界：`StandardMaterial` + `alpha` + Fresnel + GPU Particle

---

## 執行步驟

### 1. 0–20% 分析對標
檢查現有 WorldGenerator.ts、地形 Mesh、LOD 設定、ProceduralTexture 使用情況。
確認 ChunkLoader 與 EngineManager 的連接點（Registry.ts）。

### 2. 20–40% 設計

**6大區域設計：**
| 區域 | 色調 | 特效 | LOD | 危險等級 |
|------|------|------|-----|---------|
| 起始幽暗森林 | 紫灰 | 薄霧粒子 | LOD 0-3 | 安全 |
| 暮光荒原 | 藍灰 | 閃電粒子 | LOD 0-3 | 低 |
| 熔岩裂谷 | 橙紅 | 火星GPUParticle | LOD 0-3 | 中 |
| 幻影沼澤 | 墨綠 | 毒氣粒子 | LOD 0-3 | 高 |
| 薄冥冰原 | 冰藍 | 雪花粒子 | LOD 0-3 | 極高 |
| 血月要塞 | 血紅 | 血粒子+永恆光柱 | LOD 0-3 | Boss |

- 紅色能量結界：`alpha blend + Fresnel + GPUParticle` 破碎特效
- Phantom Presence：半透明灰色腳印 ThinInstance + 地面血跡 DecalMesh

### 3. 40–60% 程式碼
直接修改：
- `WorldManager.ts`：6區域 Perlin noise 地形 + 色調材質
- `ChunkLoader.ts`：擴展至 10km×10km，視錐裁剪 + ThinInstance 草叢
- `Registry.ts`：加入 `currentZone` / `chunkCache` 狀態

### 4. 60–80% 集成測試
- 無縫 Chunk 切換（目標：切換時間 < 16ms）
- 垂直模式視野裁剪（FOV 65-75°）
- 低階裝置自動降 LOD（WebGL2 fallback 時強制 LOD 2）
- ThinInstance 草叢記憶體測試（目標 < 25MB）

### 5. 80–100% 立即可玩步驟 + 報告
現在 `npm run dev` → 垂直模式 → 移動角色穿越 5 個 Chunk，觀察：
- 無縫載入（無卡頓）
- 結界紅色效果
- ThinInstance 植被生成
- Phantom Presence 腳印出現

效能預估：中階手機 68fps，記憶體 98MB。

**資源狀態（Prompt 2 完成後觸發 /asset-gen）：**
- 地形紋理：⏳ 純色 Material → **必須立即觸發 /asset-gen 替換 KTX2 紋理（★★★★☆）**
- 結界粒子：⏳ 純色 Material → 建議替換
- 環境裝飾 GLB：✅ ThinInstance placeholder 暫緩至 90%