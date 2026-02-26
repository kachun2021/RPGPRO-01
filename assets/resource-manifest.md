# Abyssal Wardens: Phantom Dominion — 資源清單
# 自動維護：每次 /asset-gen 執行後更新此文件
# 狀態說明：🔴 未開始 | 🟡 Placeholder | ✅ 正式資源 | ⏳ 外部製作中

---

## 🧑 角色模型

| 資源 ID | 文件路徑 | 狀態 | 規格 | 替換時機 |
|---------|---------|------|------|---------|
| player_model | assets/models/entities/player.glb | 🟡 SphereGeometry | 1.8m高，~15k tris，含Idle/Run/Attack動畫 | ★★★★★ Prompt 1後 |
| player_idle_anim | assets/animations/player_idle.glb | 🟡 placeholder | Babylon AnimationGroup | ★★★★★ Prompt 1後 |
| player_run_anim | assets/animations/player_run.glb | 🟡 placeholder | 跑步循環 | ★★★★★ Prompt 1後 |
| player_attack_anim | assets/animations/player_attack.glb | 🟡 placeholder | 攻擊揮劍動作 | ★★★★★ Prompt 3前 |

## 👾 怪物模型

| 資源 ID | 文件路徑 | 狀態 | 規格 | 替換時機 |
|---------|---------|------|------|---------|
| monster_shadow_wolf | assets/models/monsters/shadow_wolf.glb | 🟡 BoxGeometry | ~8k tris，LOD 0-3，含Idle/Walk/Attack動畫 | ★★★★★ Prompt 3後 |
| monster_phantom_shade | assets/models/monsters/phantom_shade.glb | 🟡 BoxGeometry | 半透明飄浮型，~6k tris | ★★★★★ Prompt 3後 |
| monster_lava_golem | assets/models/monsters/lava_golem.glb | 🔴 未開始 | 大型Boss，~25k tris | ★★★★★ Prompt 3後 |
| monster_frost_wraith | assets/models/monsters/frost_wraith.glb | 🔴 未開始 | 冰原區域，~7k tris | ★★★★★ Prompt 3後 |
| monster_bloodmoon_boss | assets/models/monsters/bloodmoon_boss.glb | 🔴 未開始 | 終Boss，~40k tris | ★★★★★ Prompt 3後 |

## 🐾 寵物模型

| 資源 ID | 文件路徑 | 狀態 | 規格 | 替換時機 |
|---------|---------|------|------|---------|
| pet_spirit_fox | assets/models/pets/spirit_fox.glb | 🟡 ConeGeometry | 0.5m高，~5k tris，含Idle/Follow動畫 | ★★★☆☆ Prompt 4後 |
| pet_void_orb | assets/models/pets/void_orb.glb | 🟡 ConeGeometry | 飄浮球型，~3k tris | ★★★☆☆ Prompt 4後 |
| pet_egg_pickup | assets/models/pets/pet_egg.glb | 🟡 ConeGeometry | 掉落蛋，~2k tris | ★★★☆☆ Prompt 4後 |

## 🌍 地形紋理

| 資源 ID | 文件路徑 | 狀態 | 規格 | 替換時機 |
|---------|---------|------|------|---------|
| terrain_forest_diffuse | assets/textures/terrain/forest_d.ktx2 | 🟡 純色 | 1024×1024 KTX2，暗紫苔蘚地面 | ★★★★☆ Prompt 2後 |
| terrain_forest_normal | assets/textures/terrain/forest_n.ktx2 | 🟡 純色 | 512×512 法線貼圖 | ★★★★☆ Prompt 2後 |
| terrain_lava_diffuse | assets/textures/terrain/lava_d.ktx2 | 🟡 純色 | 1024×1024 KTX2，紅橙岩漿 | ★★★★☆ Prompt 2後 |
| terrain_frost_diffuse | assets/textures/terrain/frost_d.ktx2 | 🟡 純色 | 1024×1024 KTX2，冰藍 | ★★★★☆ Prompt 2後 |
| terrain_bloodmoon_diffuse | assets/textures/terrain/bloodmoon_d.ktx2 | 🟡 純色 | 1024×1024 KTX2，血紅 | ★★★★☆ Prompt 2後 |
| skybox_dark_fantasy | assets/textures/skybox/ | 🟡 純色 | 6面 512×512，暗紫星空 | ★★★★☆ Prompt 2後 |

## ✨ 粒子 / 特效材質

| 資源 ID | 文件路徑 | 狀態 | 規格 | 替換時機 |
|---------|---------|------|------|---------|
| particle_spark | assets/textures/particles/spark.png | 🟡 白點 | 64×64，金黃色火花 | ★★★★☆ Prompt 3後 |
| particle_phantom | assets/textures/particles/phantom.png | 🟡 白點 | 64×64，半透明灰紫 | ★★★★☆ Prompt 2後 |
| particle_pickup_gold | assets/textures/particles/pickup_gold.png | 🟡 白點 | 32×32，金紫磁吸特效 | ★★★★☆ Prompt 3後 |
| particle_fire_elem | assets/textures/particles/fire_element.png | 🟡 白點 | 64×64，火元素技能 | ★★★★☆ Prompt 3後 |
| particle_ice_elem | assets/textures/particles/ice_element.png | 🟡 白點 | 64×64，冰元素技能 | ★★★★☆ Prompt 3後 |
| particle_thunder_elem | assets/textures/particles/thunder_element.png | 🟡 白點 | 64×64，雷元素技能 | ★★★★☆ Prompt 3後 |
| particle_barrier_break | assets/textures/particles/barrier_break.png | 🟡 白點 | 128×128，結界破碎 | ★★★★☆ Prompt 2後 |

## 🎮 UI 圖標

| 資源 ID | 文件路徑 | 狀態 | 規格 | 替換時機 |
|---------|---------|------|------|---------|
| icon_omni_orb | assets/ui/icons/omni_orb.svg | 🟡 純色CSS | 80px圓，黑紫半透明 | ★★★☆☆ Prompt 6後 |
| icon_intent | assets/ui/icons/intent.svg | 🟡 純色CSS | 48px，徑向選單圖標 | ★★★☆☆ Prompt 6後 |
| icon_forge | assets/ui/icons/forge.svg | 🟡 純色CSS | 48px，鍛造符文 | ★★★☆☆ Prompt 6後 |
| icon_pet | assets/ui/icons/pet.svg | 🟡 純色CSS | 48px，寵物爪印 | ★★★☆☆ Prompt 6後 |
| icon_faction | assets/ui/icons/faction.svg | 🟡 純色CSS | 48px，陣營旗幟 | ★★★☆☆ Prompt 6後 |
| icon_bag | assets/ui/icons/bag.svg | 🟡 純色CSS | 48px，背包 | ★★★☆☆ Prompt 4後 |
| halo_peace | assets/ui/halos/peace.png | 🟡 純色 | 128×128，金色光環 | ★★★☆☆ Prompt 5後 |
| halo_plunder | assets/ui/halos/plunder.png | 🟡 純色 | 128×128，紅色光環 | ★★★☆☆ Prompt 5後 |
| halo_arena | assets/ui/halos/arena.png | 🟡 純色 | 128×128，藍紫光環 | ★★★☆☆ Prompt 5後 |

## 🔊 音效 / BGM

| 資源 ID | 文件路徑 | 狀態 | 規格 | 替換時機 |
|---------|---------|------|------|---------|
| bgm_dark_forest | assets/sounds/bgm/dark_forest.ogg | 🟡 Web Audio | 暗夜森林循環，< 2MB | ★★★☆☆ Prompt 4後 |
| bgm_combat | assets/sounds/bgm/combat.ogg | 🟡 Web Audio | 戰鬥音樂循環，< 2MB | ★★★☆☆ Prompt 4後 |
| sfx_attack_hit | assets/sounds/sfx/attack_hit.ogg | 🟡 Web Audio | 擊中短音效，< 100KB | ★★★☆☆ Prompt 4後 |
| sfx_skill_fire | assets/sounds/sfx/skill_fire.ogg | 🟡 Web Audio | 火技能音效，< 150KB | ★★★☆☆ Prompt 3後 |
| sfx_pickup | assets/sounds/sfx/pickup.ogg | 🟡 Web Audio | 撿取音效，< 50KB | ★★★☆☆ Prompt 3後 |
| sfx_barrier_break | assets/sounds/sfx/barrier_break.ogg | 🟡 Web Audio | 結界破碎，< 200KB | ★★★☆☆ Prompt 2後 |
| sfx_phantom_ambient | assets/sounds/sfx/phantom_ambient.ogg | 🟡 Web Audio | 幽靈低鳴，< 100KB | ★★★☆☆ Prompt 2後 |

## 🌿 環境裝飾 GLB

| 資源 ID | 文件路徑 | 狀態 | 規格 | 替換時機 |
|---------|---------|------|------|---------|
| env_dark_tree | assets/models/environment/dark_tree.glb | 🟡 ThinInstanceBox | 暗紫樹，~500 tris LOD0 | ★★☆☆☆ Prompt 7 |
| env_crystal | assets/models/environment/crystal.glb | 🟡 ThinInstanceBox | 發光水晶，~800 tris | ★★☆☆☆ Prompt 7 |
| env_ruin_pillar | assets/models/environment/ruin_pillar.glb | 🟡 ThinInstanceBox | 廢墟柱，~600 tris | ★★☆☆☆ Prompt 7 |

## ⚙️ Firebase Schema

| 資源 ID | 文件路徑 | 狀態 | 替換時機 |
|---------|---------|------|---------|
| firebase_schema | firebase/database.rules.json | 🟡 Mock JSON | ★★★★☆ Prompt 5前 |
| firebase_remote_config | firebase/remote_config.json | 🔴 未開始 | ★★★★☆ Prompt 5前 |

---

## 📊 替換進度追蹤

```
總資源數：44
✅ 正式資源：0 (0%)
🟡 Placeholder：44 (100%)
🔴 未開始：0 (0%)
```

**上次更新：Prompt 0（項目初始化）**
