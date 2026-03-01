---
description: 寵物系統開發（Prompt 3, 4 / 13–27%）— 核心系統
---

// turbo-all
# 寵物系統（/pet）

對應 **P3**（八大系列+PetManager）和 **P4**（合成+圖鑑+裝備）

---

## P3 核心

- PetData：八大系列 + 相剋表 + 40種定義
- PetManager：50攜帶 + 3出戰 + 蛋掉落30%
- Pet：正常比例 placeholder + 系列色 + lerp跟隨
- PetAI：克制優先 + 技能骨架
- PetControlBar：右側3格 + HP弧形

## P4 深度

- PetFusion：30+配方 + 成功/失敗
- PetEncyclopedia：40種收集
- PetEquipment：3欄位
- PetPanel：居中面板 4Tab（原神風格玻璃面板）
- FusionPanel：合成動畫

## generate_image（獨立生成）

- P3：8系列圖標 + 寵物頭像框（共9張）
- P4：3裝備圖標 + 合成箭頭 + 成功特效（共5張）
- 每個128px，Genshin Impact style，dark bg #0A0E1A