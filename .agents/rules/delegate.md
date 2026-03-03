

# Delegate Auto-Routing Rules

When receiving a task, match keywords in priority order and execute the corresponding WORKFLOW.
Before executing, announce: "I'm using /xxx for this task"

## Routing Table (High to Low Priority)

| Priority | Keywords | WORKFLOW |
|----------|----------|----------|
| 1 | FPS, memory, WebGPU, Snapshot, Live Ops, GPU, frame drop, performance | /perf |
| 2 | pet, fusion, PEF, encyclopedia, 8 series, egg, pet follow, pet equipment, counter | /pet |
| 3 | map, world, zone, teleport, biome, terrain | /world |
| 4 | combat, skill, element, damage, Boss, cooldown, counter, monster, grind, mob, projectile, auto-skill, egg drop | /combat |
| 5 | equipment, enhance, resonance, set bonus, wear, dismantle | /combat |
| 6 | stat allocation, awakening, rebirth, skill tree, five stats | /combat |
| 7 | multiplayer, sync, Firebase, matchmaking, anti-cheat, PvP, guild, party, friend, same-map | /multi |
| 8 | UI, HUD, touch, panel, tooltip, joystick, navbar, landscape, portrait, AFK | /mixed |
| 9 | quest, NPC, dialogue, main story, side quest, daily quest, pet swap, shop, payment | /mixed |
| 10 | event, world boss event, seasonal, limited-time, activity, chat, settings | /mixed |
| 11 | resource, GLB, KTX2, material, texture, sound, audio, BGM, SFX, asset, icon, generate_image | /asset-gen |
| 12 | save, tutorial, level up, performance optimizer | /complete |
| 13 | new feature, new system, from scratch, initialize, new module | /init |
| 14 | complete, verify, playable, test, finalize, deliver | /complete |
| 15 | bug fix, fix, refactor, code-only change | /update |
| 16 | (none match) | /init + explain why |

## Conflict Resolution

```
Feature: /perf > /pet > /world > /combat > /multi > /mixed > /asset-gen > /init
Maintenance: /complete > /update
```

## Workflow Registry (v6 — 10 Steps)

| Command | Purpose | New Steps |
|---------|---------|-----------|
| /perf | Performance guard (always_on rule) | all |
| /pet | Pet system (DONE, maintenance only) | - |
| /world | Zone world completion | P2 |
| /combat | Combat + Skills + Equipment + Stats | P1, P3, P4 |
| /multi | Multiplayer + Firebase + PVP | P6, P7 |
| /mixed | UI + Quest + Shop + Events + AFK + Chat | P5, P8, P9 |
| /asset-gen | Asset generation (individual generate_image) | all |
| /init | Engine initialization (DONE) | - |
| /complete | Final verification (25 items) + Save + Audio | P10 |
| /update | Bug fixes / refactors | any |