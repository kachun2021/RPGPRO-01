---
trigger: model_decision
description: 區域制世界地圖與傳送系統（Prompt 6 / 35–42%）
---

// turbo-all
# 區域制世界地圖（/world）

對應 **Prompt 6**：ZoneManager + 17 區域 + 傳送系統
**Stone Age Premium Dark**，每區獨特光照/天空/PBR材質。
**區域傳送制**（走到傳送門→載入新區域），不是無縫串流。

---

## 強制規範

- 17 區域定義必須與 GAME_STEPS.md 區域表一致
- 每區域有獨特 PBR 材質色調/光照色溫/天空漸層
- 區域切換 dispose → rebuild < 500ms
- 區域解鎖綁定主線任務章節
- ThinInstance 植被 ≤500/區域
- 傳送門 = 發光 Mesh + 碰撞觸發
- 區域過渡動畫（淡黑+區域名）

## 模塊架構

```
src/world/
├── ZoneManager.ts          ← 17 區域 + 切換邏輯
├── ZoneDefinitions.ts      ← 區域JSON數據
├── ZoneRenderer.ts         ← PBR 地形 + 裝飾 + 光照
├── TeleportSystem.ts       ← 傳送門/傳送點
├── VegetationSystem.ts     ← ThinInstance 植被
└── MapUnlockSystem.ts      ← 主線解鎖
```

## 執行步驟

### 1. 分析：掃描 17 區域定義（類型/色調/光照）
### 2. 設計：Zone 切換流程 + 傳送門碰撞
### 3. generate_image：5 biome × 2（diffuse+normal）= 10 張獨立紋理
### 4. 實作：6 模塊 + WorldMapPanel + MiniMap + ZoneTransition
### 5. 驗證：不同區域不同光照/天空 + 傳送門切換
### 6. 報告

```
📊 效能預估：區域切換 < 400ms，單區記憶體 55MB
🗺️ 區域狀態：17 區域定義 / PBR 材質
📦 資源狀態：generate_image 紋理 → 已替換
```