---
trigger: model_decision
description: 寵物系統開發（Prompt 3, 4 / 13–27%）— 核心系統
---

// turbo-all
# 寵物系統（/pet）

對應 **P3**（八大系列 + PetManager）和 **P4**（合成 + 圖鑑 + 裝備）

---

## P3 核心

- PetData：八大系列 + 相剋表 + 40種定義
- PetManager：**100攜帶** + 3出戰 + 蛋掉落0.1%
- Pet：正常比例 placeholder + 系列色 + lerp跟隨
- PetFollowSystem：跟隨玩家選定目標 + 近攻/遠攻 + 無獨立AI
- HUD portraits：SVG arc HP/MP 圈（右上 4 個浮動圈）

## P4 深度 ✅

- PetFusion：CHM MixMon 數據驅動，per-pet fusionRecipes（findRecipes API）
- PetData：40 寵物含 nameCN / acquisition(egg_drop|fusion) / fusionRecipes / SERIES_EMOJI
- FusionPanel：**Mix Master 風格獨立中心彈窗**（點擊格位→選擇列表）
- PetEncyclopedia：40種收集
- PetEquipment：3欄位
- PetPanel：**右側滑入 sa-panel**（drag-and-drop 部署/召回）
  - 3 垂直出戰格 + 5列倉庫網格
  - sa-sl/sa-sv 金色標籤 stat 顯示

## generate_image（獨立生成）

- P3：8系列圖標 + 寵物頭像框（共9張）
- P4：裝備圖標 + 合成箭頭 + 成功特效（共5張）
- 每張128px，Stone Age fantasy RPG style，dark bg rgba(20,16,30)