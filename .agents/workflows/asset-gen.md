---
trigger: model_decision
description: 資源生成與替換（GLB/KTX2/紋理/音效）
---

// turbo-all
# 資源生成與替換（/asset-gen）

開發期間用 `generate_image` 即時生成 2D 素材。
GLB 3D 模型 P10 後由用戶統一替換。

---

## generate_image 強制規則

| 規則 | 說明 |
|------|------|
| **獨立生成** | 每個資源獨立一次 generate_image（禁止堆疊） |
| **Prompt 格式** | `"Single [類型]: [描述], on dark bg rgba(20,16,30), [尺寸]px, Stone Age fantasy MMO RPG style, clean edges, no text"` |
| **尺寸** | 圖標 128×128px，紋理 512×512px，天空 1024×512px |
| **立即替換** | 生成 → Copy-Item → `src/assets/` → 代碼中替換 emoji |
| **風格** | Stone Age Premium Dark：柔和金色、深紫暗底、fantasy RPG |

## 完整資源清單（~86 張）

### 場景紋理（12 張）
| 資源 | Step | 規格 |
|------|------|------|
| grass diffuse/normal | 已完成 | 512px tileable |
| sky gradient | 已完成 | 1024×512 |
| 5 biome diffuse | P2 | 512px |
| 5 biome normal | P2 | 512px |
| teleport portal | P2 | 256px |
| zone loading bg | P2 | 1280×720 |
| worldmap parchment | P2 | 800×500 |
| water diffuse | P2 | 512px |

### UI 圖標（49 張）
| 資源 | Step | 數量 |
|------|------|------|
| 導航欄 | 已完成 | 7 |
| 貨幣(金/鑽) | 已完成 | 2 |
| HUD 框 | 已完成 | 1 |
| 系列圖標 | 已完成 | 8 |
| 寵物頭像框 | 已完成 | 1 |
| 裝備(頭/身/爪) | P4 | 3 |
| 合成(箭頭/成功) | 已完成 | 2 |
| 技能圖標 | P1 | 12 |
| 元素克制 | P1 | 2 |
| 怪物HP框 | P1 | 1 |
| 暴擊裝飾 | P1 | 1 |
| 稀有度框×4 | P4 | 4 |
| AUTO 圖標 | P1 | 1 |
| 商城分類 | P8 | 7 |

### 效果（15 張）
| 資源 | Step |
|------|------|
| AFK 背景 | P9 |
| 掉落光效 | P1 |
| 強化光效 | P4 |
| 共鳴藥水 | P4 |
| 套裝效果 | P4 |
| 任務!/?標 | P5 |
| 對話框 | P5 |
| 完成✓ | P5 |
| 覺醒光環 | P3 |
| 轉生圖標 | P3 |

## GLB 替換（P10 後）

| 資源 | Placeholder |
|------|------------|
| 主角 | 正常比例 capsule |
| 寵物(40種) | Geometry + 系列色 |
| 怪物 | 組合幾何體 |
| NPC | 組合幾何體 |
