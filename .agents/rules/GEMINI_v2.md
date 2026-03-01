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
├── pets/          <- Pet, PetManager, PetData, PetAI, PetFusion, PetEncyclopedia, PetEquipment
├── entities/      <- Player, Monster, MonsterManager, DropItem, NPC
├── combat/        <- CombatSystem, SkillManager, ElementSystem, FloatingDamage, AutoGrind, PvPSystem
├── world/         <- ZoneManager, ZoneDefinitions, ZoneRenderer, TeleportSystem, VegetationSystem, MapUnlockSystem
├── systems/       <- Inventory, QuestManager, ShopManager, EquipmentSystem, ResonanceSystem, EnhanceSystem, StatAllocation, SkillTree, AwakeningSystem, RebirthSystem, TechTree, TradeMarket, TransformSystem
├── network/       <- NetworkManager, RemotePlayerManager, PlayerInterpolation, GuildManager, PartyManager, FriendManager
├── input/         <- TouchJoystick, LandscapeCamera
├── ui/            <- HUD, PanelManager, panels, ChatSystem, AFKPanel, ZoneTransition...
├── assets/icons/  <- generate_image individual icons
├── assets/textures/ <- generate_image terrain textures
└── main.ts        <- entry point
```

## 9. Visual Design System (Genshin Impact Style)

### Color System
```css
--bg-deep:     #0A0E1A;
--bg-panel:    rgba(15,20,40,0.85);
--border-glow: rgba(180,200,255,0.15);
--accent-gold: #E8C96A;
--accent-blue: #7BA4DB;
--text-primary: #ECE8E0;
--text-dim:    rgba(200,195,185,0.5);
--hp-bar:      #C0392B;
--mp-bar:      #2E86C1;
--success:     #27AE60;
--danger:      #E74C3C;
```

### Fonts
```css
font-family: 'Cinzel', serif;     /* titles */
font-family: 'Inter', sans-serif; /* body/numbers */
```

### Landscape 5-Zone Layout
```
+--------------------------------------------------+
| A Top(44px): HP/MP/Lv/Gold/Diamond/ZoneName       |
+--------+-----------------------------+-----------+
|B Stick |   C Center 3D Scene         |D Skill+Pet|
|(120px) |                             |  (100px)  |
+--------+-----------------------------+-----------+
| E Bottom(48px): Char/Bag/Quest/Pet/Shop/Chat/Set  |
+--------------------------------------------------+
```

### Panel System (Center Popup)
- All panels = center popup (NOT slide-in)
- Dark backdrop overlay (.panel-backdrop)
- scale(0.9->1) + opacity(0->1) animation
- PanelManager exclusive management
- Panel CSS: multi-layer glass + gold title lines + custom scrollbar

### Panel CSS Template
```css
.panel {
  background: linear-gradient(135deg, rgba(10,14,30,0.92), rgba(20,28,55,0.88));
  border: 1px solid rgba(180,200,255,0.12);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
}
.btn-gold {
  background: linear-gradient(180deg, #E8C96A, #C4993D);
  color: #0A0E1A; border-radius: 8px; font-weight: 600;
}
```

### Animation Specs
```
Panel open: scale(0.9)->scale(1) + opacity 0->1, 0.25s cubic-bezier
Panel close: reverse 0.2s
Button press: scale(0.92), 0.1s
Skill CD: conic-gradient mask
Orientation switch: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)
```

## 10. generate_image Rules
1. **Each asset = one independent generate_image call** (no sprite sheets)
2. Prompt includes: "Genshin Impact anime RPG style" + background #0A0E1A + exact size
3. After generation: Copy to src/assets/ and replace emoji in code immediately
4. Total ~80 individual images (see ASSET_PROMPTS.md)
5. Must use exact prompts from `.agents/prompts/ASSET_PROMPTS.md`

## 11. 15-Step Development Map (Optimized Order)

| Step | Progress | Core Module |
|------|----------|-------------|
| P1 | 0-7% | Engine + PBR Scene + Post-processing |
| P2 | 7-13% | Player + HUD + Joystick + Camera |
| P3 | 13-20% | 8 Pet Series + PetManager + 3 Active |
| P4 | 20-27% | PEF Fusion + Encyclopedia + Pet Equipment |
| P5 | 27-35% | Combat + Element Counters + Skills + Monsters |
| P6 | 35-42% | Zone World + Teleport + Monster Spawning |
| P7 | 42-49% | AUTO Grind + Drops + Inventory |
| P8 | 49-56% | Equipment + Enhance + Resonance |
| P9 | 56-63% | Quests 25 Chapters + NPC |
| P10 | 63-70% | Stat Allocation + Skill Tree + Awakening + Rebirth |
| P11 | 70-77% | Firebase + Same-Map Multiplayer + Social |
| P12 | 77-84% | PVP + Guild + Party |
| P13 | 84-90% | Shop + Tech Tree + Transform |
| P14 | 90-95% | All UI + Chat + AFK + Trade Market |
| P15 | 95-100% | Tutorial + Save + Performance + Polish |

## 12. Pet System Core Rules

### 8 Series Counter Cycle
```
Plant -> Dragon -> Beast -> Insect -> Metal -> Mystery -> Demon -> Bird -> Plant
```
Counter 1.5x / Resisted 0.7x / Neutral 1.0x

### PEF Fusion
- Male + Female, each at base level
- New pet level = floor((parentA_Lv + parentB_Lv)/2) + random(1,6)
- Failure: secondary pet destroyed + primary loses 3-6 levels
- Protection items prevent destruction

### Pet Management
- Max carry 20, max active 3
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
| UI | Genshin-level glass panels + animations |
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

See delegate.md for automatic workflow routing.
