---
trigger: model_decision
description: 資源生成與替換（GLB/KTX2/紋理/音效）
---

// turbo-all
# 資源生成與替換（/asset-gen）

開發期間用 `generate_image` 即時生成 2D 素材。
GLB 3D 模型開發完成後由用戶統一替換。

---

## generate_image 規則

| 規則 | 說明 |
|------|------|
| **獨立生成** | 每個資源獨立一次 generate_image（禁止堆疊） |
| **Prompt 格式** | `"Single [類型]: [描述], on dark bg rgba(20,16,30), [尺寸]px, Stone Age fantasy MMO RPG style, clean edges, no text"` |
| **尺寸** | 圖標 128×128px，紋理 512×512px，天空 1024×512px |
| **立即替換** | 生成 → Copy-Item → `src/assets/` → 代碼中替換 emoji |
| **風格** | Stone Age Premium Dark：柔和金色、深紫暗底、fantasy RPG |

## 資源狀態

### 已生成 ✅
- 草地 diffuse/normal, 天空gradient
- 導航欄 7 圖標, 貨幣 2 圖標, HUD 框
- 8 系列圖標, 寵物頭像框
- 合成箭頭/成功特效

### 待生成 📋
- 5 biome × diffuse+normal (10 張)
- 技能圖標 12 張
- 裝備圖標, 稀有度框, 商城分類
- 效果紋理（掉落/強化/覺醒/轉生等）
- 其他 UI 圖標按需生成

## GLB Placeholder

| 資源 | 開發期 Placeholder | 替換時機 |
|------|-------------------|---------|
| 主角 | 正常比例 capsule | 用戶決定 |
| 寵物 (40種) | Geometry + 系列色 | 用戶決定 |
| 怪物 | 組合幾何體 | 用戶決定 |
| NPC | 組合幾何體 | 用戶決定 |
