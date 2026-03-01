---
trigger: model_decision
description: 資源生成與替換（GLB/KTX2/紋理/音效）
---

// turbo-all
# 資源生成與替換（/asset-gen）

開發期間用 `generate_image` 即時生成 2D 素材。
GLB 3D 模型 P15 後由用戶統一替換。

---

## generate_image 強制規則

| 規則 | 說明 |
|------|------|
| **獨立生成** | 每個資源獨立一次 generate_image（禁止堆疊） |
| **Prompt 格式** | `"Single [類型]: [描述], on dark bg (#0A0E1A), [尺寸]px, Genshin Impact anime RPG style, clean edges, no text"` |
| **尺寸** | 圖標 128×128px，紋理 512×512px，天空 1024×512px |
| **立即替換** | 生成 → Copy-Item → `src/assets/` → 代碼中替換 emoji |
| **風格** | 原神風格：柔和金色、深夜藍底、anime RPG |

## 完整資源清單（~86 張）

### 場景紋理（22 張）
| 資源 | Step | 規格 |
|------|------|------|
| grass diffuse/normal | P1 | 512px tileable |
| sky gradient | P1 | 1024×512 |
| 5 biome diffuse | P6 | 512px |
| 5 biome normal | P6 | 512px |
| teleport portal | P6 | 256px |
| zone loading bg | P6 | 1280×720 |
| worldmap parchment | P6 | 800×500 |
| water diffuse | P6 | 512px |

### UI 圖標（49 張）
| 資源 | Step | 數量 |
|------|------|------|
| 導航列 | P2 | 7 |
| 貨幣(金/鑽) | P2 | 2 |
| HUD 框 | P2 | 1 |
| 系列圖標 | P3 | 8 |
| 寵物頭像框 | P3 | 1 |
| 裝備(頭/身/爪) | P4 | 3 |
| 合成(箭頭/成功) | P4 | 2 |
| 技能圖標 | P5 | 12 |
| 元素克制 | P5 | 2 |
| 怪物HP框 | P5 | 1 |
| 暴擊裝飾 | P5 | 1 |
| 稀有度框×4 | P7 | 4 |
| AUTO 圖標 | P7 | 1 |
| 商城分類 | P13 | 7 |

### 效果（15 張）
| 資源 | Step |
|------|------|
| AFK 背景 | P7 |
| 掉落光效 | P7 |
| 強化光效 | P8 |
| 共鳴藥水 | P8 |
| 套裝效果 | P8 |
| 任務！/？ | P9 |
| 對話框 | P9 |
| 完成勾 | P9 |
| 覺醒光環 | P10 |
| 轉生圖標 | P10 |

## GLB 替換（P15 後）

| 資源 | Placeholder |
|------|------------|
| 主角 | 正常比例 capsule |
| 寵物(40種) | Geometry + 系列色 |
| 怪物 | 組合幾何體 |
| NPC | 組合幾何體 |
