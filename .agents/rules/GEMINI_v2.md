# Fantasy Pet Online GEMINI_v3

## 1. Game Content Priority
- **Pet System** (8 series, PEF fusion, encyclopedia, AI, equipment, counters) >= 40%
- Combat (realtime 1+3 pet RTS, element counters) >= 30%
- UI, HUD, input, social <= 30%

## 2. Tech Stack
1. **Babylon.js 8.x+ ONLY (no Three.js / R3F)**
2. WebGPU Engine -> WebGL2 fallback
3. Snapshot Rendering + Thin Instances + Node Render Graph
4. DOM overlay UI (no Babylon.GUI)
5. Firebase Realtime DB (multiplayer + same-map players)
6. No deprecated APIs

## 3. Performance Baseline
- Mid-range mobile (Snapdragon 778G / iPhone 13 / Pixel 7a)
- Landscape >= 60 fps
- Memory <= 110 MB
- First paint <= 1.2s

## 4. Orientation
- Primary: Landscape (combat/explore/panels/fusion/PVP)
- Secondary: Portrait (AUTO AFK/chat/inventory)
- `screen.orientation.lock('landscape')`

## 5. Live Ops
- JSON-driven, hot-update, no forced reload

## 6. Environment
- Windows / PowerShell
- Path: d:\AI-RPGGAME
- GitHub: https://github.com/kachun2021/RPGPRO-01

## 7. Response Footer
```
📊 Performance: [FPS] fps / [Memory] MB
🐾 Pets: [X species/X recipes/X series]
🔋 Live Ops: [reload needed?]
📦 Assets: [placeholder/final] -> next: [Prompt X]
```

## 8. Module Architecture
```
src/
├── core/          <- EngineManager, Registry, AssetLoader, SaveSystem, OrientationManager, PerformanceOptimizer
├── pets/          <- Pet, PetManager, PetData, PetAI, PetFusion, PetEncyclopedia, PetEquipment, PetBuff
├── entities/      <- Player, Monster, MonsterManager, DropItem, NPC
├── combat/        <- CombatSystem, SkillManager, ElementSystem, FloatingDamage, AutoGrind, PvPSystem
├── world/         <- ZoneManager, ZoneDefinitions, ZoneRenderer, TeleportSystem, VegetationSystem, MapUnlockSystem
├── systems/       <- Inventory, QuestManager, ShopManager, EquipmentSystem, ResonanceSystem, EnhanceSystem, StatAllocation, SkillTree, AwakeningSystem, RebirthSystem, TechTree, TradeMarket, TransformSystem
├── network/       <- NetworkManager, RemotePlayerManager, PlayerInterpolation, GuildManager, PartyManager, FriendManager
├── input/         <- TouchJoystick, LandscapeCamera
├── ui/            <- HUD, Minimap, PanelManager, PetPanel, FusionPanel, SkillBar, ChatBox, AFKPanel, ZoneTransition...
├── assets/icons/  <- generate_image individual icons
├── assets/textures/ <- generate_image terrain textures
└── main.ts        <- entry point
```

## 9. Visual Design System — Stone Age Premium Dark Theme

### Color System
```css
--bg-deep:      rgba(20,16,30,0.95);     /* 深紫黑背景 */
--bg-panel:     rgba(25,20,38,0.94);     /* 面板背景 */
--bg-section:   rgba(20,16,30,0.6);      /* 格子/槽位背景 */
--border-gold:  rgba(160,130,80,0.3);    /* 金色邊框 */
--border-hover: rgba(232,201,106,0.4);   /* hover 金色 */
--accent-gold:  rgba(232,201,106,0.9);   /* 金色主強調 */
--accent-dim:   rgba(200,195,185,0.5);   /* 次要文字 */
--text-primary: rgba(220,215,200,0.8);   /* 主文字 */
--text-label:   rgba(232,201,106,0.8);   /* 標籤金字 */
--hp-bar:       #E74C3C;                 /* HP 紅 */
--mp-bar:       #3498DB;                 /* MP 藍 */
--success:      #27AE60;
--danger:       #E74C3C;
```

### Fonts
```css
font-family: 'Cinzel', serif;     /* titles, zone names */
font-family: 'Inter', sans-serif; /* body/numbers */
```

### Landscape 5-Zone Layout
```
+--------------------------------------------------+
| A Minimap(150px)  ←── 3D Scene ──→  Portraits(4) |
|   zone+coords+canvas              SVG arc HP/MP   |
+--------+-----------------------------+-----------+
|        |   C Center 3D Scene         |D SkillBar |
|        |                             | F1-F8 dark|
+--------+-----------------------------+-----------+
| ChatBox(280px)  ── Nav Bar (10 btn dark glass) ── |
+--------------------------------------------------+
```

### Portrait System (SVG Arc Rings)
- 4 floating circles (Player + 3 Pets), **no background frame**
- Each portrait: 50×50px container, 36×36px inner dark circle
- HP = **red arc** (#E74C3C) on **left** half (180°→360°)
- MP = **blue arc** (#3498DB) on **right** half (0°→180°)
- SVG arc: r=22, strokeWidth=4, stroke-dasharray for fill %
- Inner circle: `border: none`, `background: radial-gradient(dark purple)`

### Nav Bar (Bottom)
- Dark glass: `rgba(25,20,35,0.92)` bg, gold border
- 10 buttons: emoji icon + text label, flex-column
- Gold text `rgba(232,201,106,0.85)`, hover brightens to `#FFD700`

### Panel System
- **PetPanel**: right-side slide-in, 45% width, dark premium
- **Other panels**: center popup with backdrop
- All panels: `sa-panel` class — `rgba(25,20,38,0.94)` bg
- Title: `sa-panel-title` — dark gradient + gold text
- Sections: `sa-sec` — transparent bg + subtle gold border-bottom
- Tags: `sa-tag` / `sa-tag-active` — dark bg with gold text
- Close button: top-right × with hover red effect

### Panel CSS Template (All Panels)
```css
.sa-panel {
  background: linear-gradient(180deg, rgba(25,20,38,0.94), rgba(15,12,25,0.96));
  border: 1px solid rgba(160,130,80,0.3);
  border-radius: 6px;
  box-shadow: 2px 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  pointer-events: auto; overflow: hidden; max-height: 85vh;
}
.sa-panel-title {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(180deg, rgba(40,30,55,0.9), rgba(25,20,38,0.95));
  color: rgba(232,201,106,0.9); font-weight: 700; font-size: 13px;
  border-bottom: 1px solid rgba(160,130,80,0.2);
}
.sa-sec { padding: 3px 8px; border-bottom: 1px solid rgba(160,130,80,0.15); }
.sa-tag {
  background: rgba(160,130,80,0.12); border: 1px solid rgba(160,130,80,0.25);
  color: rgba(200,195,185,0.6); border-radius: 3px; cursor: pointer;
}
.sa-tag-active {
  background: rgba(160,130,80,0.25); color: rgba(232,201,106,0.9);
}
/* Slots (skill/equip/pet/buff) */
.dark-slot {
  background: rgba(20,16,30,0.6); border: 1px solid rgba(160,130,80,0.2);
  border-radius: 4px;
}
.dark-slot:hover { border-color: rgba(232,201,106,0.4); }
/* Gold action button */
.btn-gold {
  background: linear-gradient(180deg, #E8C96A, #C4993D);
  color: #0A0E1A; border: none; border-radius: 6px;
  font-weight: 700; cursor: pointer;
}
```

### Minimap
- Dark glass container: `rgba(20,16,30,0.88)` bg, gold border
- Zone name: Cinzel font, gold color
- Coordinates: Inter font, dim text
- Canvas grid: subtle gold lines, glowing player dot

### Animation Specs
```
Panel open: translateX(100%) → 0, 0.3s ease-out (slide-in panels)
           OR scale(0.92) → scale(1) + opacity, 0.25s (center popups)
Panel close: reverse 0.2s
Button press: scale(0.92), 0.1s
Skill CD: conic-gradient mask
Orientation switch: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)
```

## 10. generate_image Rules
1. **Each asset = one independent generate_image call** (no sprite sheets)
2. Prompt style: **"Stone Age fantasy MMO RPG style"** + dark bg `rgba(20,16,30)` + exact size
3. After generation: Copy to src/assets/ and replace placeholder in code immediately
4. Total ~80 individual images (see ASSET_PROMPTS.md)
5. Must use exact prompts from `.agents/prompts/ASSET_PROMPTS.md`

## 11. 15-Step Development Map

| Step | Progress | Core Module | Status |
|------|----------|-------------|--------|
| P1 | 0-7% | Engine + PBR Scene + Post-processing | ✅ DONE |
| P2 | 7-13% | Player + HUD (SVG portraits) + Joystick + Camera | ✅ DONE |
| P3 | 13-20% | 8 Pet Series + PetManager + 3 Active | ✅ DONE |
| P4 | 20-27% | PEF Fusion + Encyclopedia + Pet Equipment | ✅ DONE |
| P5 | 27-35% | Combat + Element Counters + Skills + Monsters | |
| P6 | 35-42% | Zone World + Teleport + Monster Spawning | |
| P7 | 42-49% | AUTO Grind + Drops + Inventory | |
| P8 | 49-56% | Equipment + Enhance + Resonance | |
| P9 | 56-63% | Quests 25 Chapters + NPC | |
| P10 | 63-70% | Stat Allocation + Skill Tree + Awakening + Rebirth | |
| P11 | 70-77% | Firebase + Same-Map Multiplayer + Social | |
| P12 | 77-84% | PVP + Guild + Party | |
| P13 | 84-90% | Shop + Tech Tree + Transform | |
| P14 | 90-95% | All UI + Chat + AFK + Trade Market | |
| P15 | 95-100% | Tutorial + Save + Performance + Polish | |

## 12. Pet System Core Rules

### 8 Series Counter Cycle
```
Plant -> Dragon -> Beast -> Insect -> Metal -> Mystery -> Demon -> Bird -> Plant
```
Counter 1.5x / Resisted 0.7x / Neutral 1.0x

### PEF Fusion
- Per-pet `fusionRecipes` in PetData.ts: `[{ main, sub }]` ingredient pairs from CHM MixMon data
- `findRecipes(pet1, pet2)` searches PET_DEFS, checks both directions (main↔sub swap)
- FusionPanel: **Mix Master-style center popup** (click 80×80 slots → select from list)
- New pet level = floor((parentA_Lv + parentB_Lv)/2) + random(1,6)
- Failure: secondary pet destroyed + primary loses 3-6 levels
- Protection items (checkbox in FusionPanel) prevent destruction

### Pet Management
- Max carry **100**, max active 3
- Core egg drop rate 0.1%, needs NPC to hatch
- Pet skills auto-upgrade with level

## 13. Map System: Zone-Based Teleport
- 17 zones (town/field/dungeon) connected by **teleport gates**
- Walk into gate -> loading transition -> new zone
- Main city NPC teleporter (paid teleport to unlocked zones)
- Same-zone players visible (Firebase sync, max 20)
- Each zone has unique sun color/sky gradient/PBR material

## 14. WebGPU Fallback
```typescript
const engine = await (async () => {
  try {
    const gpu = new WebGPUEngine(canvas);
    await gpu.initAsync();
    return gpu;
  } catch {
    return new Engine(canvas, true);
  }
})();
```

## 15. Scene Quality Baseline (Every Step)
| Item | Standard |
|------|----------|
| Lighting | DirectionalLight + cascaded shadow |
| Post-processing | SSAO + Bloom + FXAA + Color Grading |
| Sky | HDR gradient + cloud color temp |
| Terrain | PBR (diffuse + normal) |
| UI | Stone Age premium dark panels + SVG arc portraits |
| Assets | generate_image individual -> immediate replacement |

## 16. Resource Replacement Table

| Resource Type | Dev Placeholder | Replace When | By |
|--------------|----------------|-------------|-----|
| Player GLB + anim | Normal-proportion capsule (1.8 unit tall) | After P15 | User |
| Pet GLB (40 types) | Sphere + Series PBR emissive | After P15 | User |
| Monster GLB | Composite geometry + series color | After P15 | User |
| NPC GLB | Composite geometry | After P15 | User |
| Terrain textures (5 biome x diffuse+normal) | generate_image 512px | During P6 | AI |
| UI icons (49) | generate_image 128px | During each P | AI |
| Skill icons (12) | generate_image 128px | During P5 | AI |
| Effect textures (15) | generate_image 64-256px | During each P | AI |

> GLB 3D models replaced by user after P15 completion. Dev period uses normal-proportion placeholders.
> 2D icons/textures generated individually via generate_image (see ASSET_PROMPTS.md)

## 17. Asset Prompt Library
All exact prompts defined in `.agents/prompts/ASSET_PROMPTS.md`
Must use exact prompts from that file when calling generate_image.

## 18. UI Component Reference (Current Implementation)

### HUD Portraits (`src/ui/HUD.ts`)
- 4 floating circles: container=50px, inner=36px, no border
- SVG arcs: r=22, sw=4, HP red left, MP blue right
- `stroke-dasharray` controls fill percentage

### Minimap (`src/ui/Minimap.ts`)
- Dark glass container with canvas + zone text
- Player dot with radial gradient glow

### Nav Bar (in `HUD.ts`)
- 10 buttons: BOOK/商店/角色/寵物/物品/技能/社區/任務/地圖/系統
- Emoji icons + text, dark glass bar

### Skill Bar (`src/ui/SkillBar.ts`)
- 8 vertical slots (F1-F8), dark glass container
- Right side, below portraits

### Chat Box (`src/ui/ChatBox.ts`)
- 3 channels: System/World/Guild
- Dark glass, bottom-left

### Pet Panel (`src/ui/PetPanel.ts`)
- Right slide-in, drag-and-drop deploy/recall
- 3 vertical deploy slots + 5-col storage grid

See delegate.md for automatic workflow routing.

## 19. Combat System Rules

### Pet Attack Types
- `attackType: 'melee'` → pet runs to monster (2m range), physical strike
- `attackType: 'ranged'` → pet stays at 6-8m, shoots projectile sphere
- Projectile: series-colored emissive sphere, 15 units/s travel
- Pets follow player's selected target (no independent AI)

### Monster Behavior (CHM Data)
- 主動式 (aggressive) = attacks player within 8m detection range
- 被動式 (passive) = only retaliates when attacked
- Boss = 3600s respawn, +5 levels above zone average, gold nameplate

### Auto-Skill Queue
- Player + each pet has configurable skill rotation
- UI: SkillPanel → drag skills into priority order
- Engine: check queue top → if CD ready + MP sufficient → cast → next
- Toggle: auto-cast ON/OFF per entity

### Egg Drop Announcements
- Drop rate: 0.1% (normal) / 5% (boss)
- Full-screen gold text: "[Player] obtained [Pet] Egg!"
- Zone-wide notification to all players
- Egg → NPC hatch required

### Combat Data Sources
- Monster spawn tables: `tables/Monster_Spawns.md` (147 zones)
- Fusion recipes: `tables/Fusion_Recipes.md` (8 MixMon series)
- Levels range: Lv1 (starter) to Lv200+ (endgame)
