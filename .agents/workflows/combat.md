---
trigger: model_decision
description: Combat + Equipment + Progression (Prompt 5, 8, 10 / 27-70%)
---

// turbo-all
# Combat + Equipment + Progression (/combat)

Covers **P5**(combat+skills+monsters+Boss), **P8**(equipment+enhance+resonance), **P10**(stat allocation+awakening+rebirth)

---

## P5 Combat + Monsters + Boss

- CombatSystem (no pet AI, player selects target), ProjectileSystem (ranged pets shoot emissive spheres, melee run up)
- AutoSkillConfig: Configurable skill queue for player and each pet + Toggle ON/OFF
- SkillManager: 12 skills, **8 vertical F1-F8 dark slots** (right side)
  - `dark-skill-slot` 44×44px, keyboard F1-F8 hotkeys
  - CD conic-gradient mask overlay
- FloatingDamage Billboard + counter colors (1.5x/0.7x)
- Monster + MonsterManager: behavior types Aggressive/Passive (主動/被動)
  - **CHM 數據源**：`tables/Monster_Spawns.md`（147 區域怪物分佈表）
  - 每區域怪物列表含系列/等級/出現率，映射到 17 區域系統
- Boss: 2x size, gold name, +5 levels, 3600s respawn
- EggDropSystem: 0.1%/5% drop rate + Full-screen announcement ("🥚 [Player] obtained [Pet] Egg!")
- generate_image: 12 skill icons + 4 combat effects (individual)

## P8 Equipment

- EquipmentSystem 8 slots + Boss/PVP dual-track sets
- Boss set: pet damage +15%/+25%/+35% (2/4/6 pieces)
- PVP set: damage reduction +10%/+20%/+30%
- ResonanceSystem: potion + equipment -> pet series buff
- EnhanceSystem: +1~+10, rates [90,80,70,60,50,40,30,20,15,10]%

## P10 Stat Allocation + Awakening

- StatAllocation: str/agi/acc/int/attr, 5 points/level
- SkillTree: 3 columns (atk/def/magic), tier 1 -> tier 2 prerequisite
- AwakeningSystem: Lv>=50 + quest ch.15 -> +10 stats + +5 SP + aura
- RebirthSystem: Lv>=80 -> reset to 1, +3 permanent stats per rebirth

## Visual Quality

- Damage numbers: gold crit + white normal + green counter + red resisted
- Skill effects: GPUParticleSystem
- Normal death: 0.5s shrink
- Boss death: 1s explosion + gold GPUParticle debris
- All UI panels: `sa-panel` dark premium theme