

# Delegate Auto-Routing Rules

When receiving a task, match keywords in priority order and execute the corresponding WORKFLOW.
Before executing, announce: "I'm using /xxx for this task"

## Routing Table (High to Low Priority)

| Priority | Keywords | WORKFLOW |
|----------|----------|----------|
| 1 | FPS, memory, WebGPU, Snapshot, Live Ops, GPU, frame drop, performance | /perf |
| 2 | pet, fusion, PEF, encyclopedia, 8 series, egg, pet AI, pet equipment, counter | /pet |
| 3 | map, world, zone, teleport, biome, terrain | /world |
| 4 | combat, skill, element, damage, Boss, hit stop, cooldown, counter, monster, grind, mob | /combat |
| 5 | equipment, enhance, resonance, set bonus, wear, dismantle | /combat |
| 6 | stat allocation, awakening, rebirth, skill tree, five stats | /combat |
| 7 | multiplayer, sync, Firebase, matchmaking, anti-cheat, PvP, guild, party, friend, same-map | /multi |
| 8 | UI, HUD, touch, panel, tooltip, joystick, navbar, landscape, portrait, AFK | /mixed |
| 9 | quest, NPC, dialogue, main story, side quest, daily quest, pet swap | /mixed |
| 10 | shop, payment, AFK points, tech tree, transform, costume, fashion | /mixed |
| 11 | event, world boss event, seasonal, limited-time, activity | /mixed |
| 12 | resource, GLB, KTX2, material, texture, sound, audio, BGM, SFX, asset, placeholder, icon, generate_image | /asset-gen |
| 13 | new feature, new system, from scratch, initialize, new module | /init |
| 14 | complete, verify, playable, test, finalize, deliver | /complete |
| 15 | bug fix, fix, refactor, code-only change | /update |
| 16 | (none match) | /init + explain why |

## Conflict Resolution

```
Feature: /perf > /pet > /world > /combat > /multi > /mixed > /asset-gen > /init
Maintenance: /complete > /update
```

## Workflow Registry

| Command | Purpose | Steps |
|---------|---------|-------|
| /perf | Performance guard (always_on rule) | all |
| /pet | Pet system | P3, P4 |
| /world | Zone world (ZoneManager) | P6 |
| /combat | Combat + Equipment + Progression | P5, P8, P10 |
| /multi | Multiplayer + Firebase | P11, P12 |
| /mixed | UI + Quest + Shop + Events + AFK | P2, P7, P9, P13, P14 |
| /asset-gen | Asset generation (individual generate_image) | all |
| /init | Engine initialization | P1 |
| /complete | Final verification (27 items) | P15 |
| /update | Bug fixes / refactors | any |