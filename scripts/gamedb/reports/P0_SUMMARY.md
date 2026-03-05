# P0 Summary - Data Governance & Runtime Pipeline

Date: 2026-03-06 (Asia/Hong_Kong)

## Scope Completed

- Added runtime build pipeline:
  - `scripts/gamedb/build_runtime.py`
- Added cross-table validation pipeline:
  - `scripts/gamedb/validate_relations.py`
- Added npm commands:
  - `gamedb:build-runtime`
  - `gamedb:validate`
  - `gamedb:p0`

## Runtime Outputs (Generated)

Location: `src/data/runtime`

- `_manifest.json`
- `world.topology.json`
- `world.spawn.json`
- `progression.json`
- `fusion.runtime.json`
- `economy.json`
- `ops.json`
- `save_schema.json`

## Validation Outputs (Generated)

Location: `scripts/gamedb/reports`

- `runtime_build_report.json`
- `validation_report.json`
- `validation_report.md`

## Coverage

- Source tables assigned to runtime domains: **38 / 38**
- Manifest check: **no unassigned source table**

## Data Quality Check Result

- Total FK/consistency checks: **52**
- Passed: **45**
- Failed: **7**

Main failed groups identified:

1. `s_mob.mobitem_idx -> s_mobitem.idx` (1 dangling ref)
2. `s_npc.birth_zone_idx -> s_zone.idx` (3 dangling refs)
3. `s_npc_sale` references to missing npc/item ids
4. `s_mobitem.item_idx4` has missing item ids (e.g. 4369/4371 family)
5. `s_Production` has missing result/material item ids for a subset

## Design Decision Locked In

- Keep `scripts/gamedb` as Source-of-Truth input.
- Use `src/data/runtime` as normalized runtime layer.
- Do **not** read full raw `scripts/gamedb` directly from UI runtime.

## Next Phase Entry

- Start P1: wire world topology (`s_zone/s_gate`) into runtime consumers and replace hardcoded world mapping paths step-by-step.
