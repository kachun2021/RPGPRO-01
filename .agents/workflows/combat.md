---
trigger: model_decision
description: Combat + Equipment + Progression (Prompt 5, 8, 10 / 27-70%)
---

// turbo-all
# Combat + Equipment + Progression (/combat)

Covers **P5**(combat+skills+monsters+Boss), **P8**(equipment+enhance+resonance), **P10**(stat allocation+awakening+rebirth)

---

## P5 Combat + Monsters + Boss

- CombatSystem + 8-element counters 1.5x/0.7x
- SkillManager: 12 skills, **8 vertical F1-F8 dark slots** (right side)
  - `dark-skill-slot` 44×44px, keyboard F1-F8 hotkeys
  - CD conic-gradient mask overlay
- FloatingDamage Billboard + counter colors
- Monster + MonsterManager: normal mobs + **Boss monsters**
- Boss: 2x size, gold name, special AI (charge/spin/summon), 5min respawn
- Boss drops: equipment recipes + rare eggs (5%)
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