# Runtime Data Validation Report

- Built At: 2026-03-05T20:07:27.054388+00:00
- Source Dir: `D:\AI-RPGGAME\scripts\gamedb`
- Total Checks: 52
- Passed: 52
- Failed: 0
- Invalid Refs (Effective): 0
- Invalid Refs (Raw): 81
- Suppressed By Overrides: 81

## Check Results

| Check | Status | Effective Invalid / Checked | Raw Invalid | Suppressed |
|---|---:|---:|---:|---:|
| s_gate.from_zone_idx -> s_zone.idx | PASS | 0 / 140 | 0 | 0 |
| s_gate.dest_zone_idx -> s_zone.idx | PASS | 0 / 140 | 0 | 0 |
| s_mob.zone_idx0 -> s_zone.idx | PASS | 0 / 889 | 0 | 0 |
| s_mob.zone_idx1 -> s_zone.idx | PASS | 0 / 216 | 0 | 0 |
| s_mob.zone_idx2 -> s_zone.idx | PASS | 0 / 205 | 0 | 0 |
| s_mob.zone_idx3 -> s_zone.idx | PASS | 0 / 0 | 0 | 0 |
| s_mob.zone_idx4 -> s_zone.idx | PASS | 0 / 0 | 0 | 0 |
| s_mob.zone_idx5 -> s_zone.idx | PASS | 0 / 0 | 0 | 0 |
| s_mob.monster_type -> s_monster.type | PASS | 0 / 889 | 0 | 0 |
| s_mob.mobitem_idx -> s_mobitem.idx | PASS | 0 / 846 | 1 | 1 |
| s_mix.mainnum -> s_monster.type | PASS | 0 / 720 | 0 | 0 |
| s_mix.subnum -> s_monster.type | PASS | 0 / 720 | 0 | 0 |
| s_mix.result -> s_monster.type | PASS | 0 / 720 | 0 | 0 |
| s_npc.birth_zone_idx -> s_zone.idx | PASS | 0 / 1032 | 3 | 3 |
| s_npc_sale.npc_idx -> s_npc.idx | PASS | 0 / 1790 | 2 | 2 |
| s_npc_sale.sale_idx -> s_item.idx | PASS | 0 / 1792 | 31 | 31 |
| s_mobitem.item_idx0 -> s_item.idx | PASS | 0 / 93 | 0 | 0 |
| s_mobitem.item_idx1 -> s_item.idx | PASS | 0 / 466 | 0 | 0 |
| s_mobitem.item_idx2 -> s_item.idx | PASS | 0 / 337 | 0 | 0 |
| s_mobitem.item_idx3 -> s_item.idx | PASS | 0 / 257 | 0 | 0 |
| s_mobitem.item_idx4 -> s_item.idx | PASS | 0 / 189 | 12 | 12 |
| s_mobitem.item_idx5 -> s_item.idx | PASS | 0 / 134 | 0 | 0 |
| s_mobitem.item_idx6 -> s_item.idx | PASS | 0 / 90 | 0 | 0 |
| s_mobitem.item_idx7 -> s_item.idx | PASS | 0 / 52 | 0 | 0 |
| s_mobitem.item_idx8 -> s_item.idx | PASS | 0 / 23 | 0 | 0 |
| s_mobitem.item_idx9 -> s_item.idx | PASS | 0 / 6 | 0 | 0 |
| s_Production.result_idx -> s_item.idx | PASS | 0 / 167 | 18 | 18 |
| s_Production.stuff_idx1 -> s_item.idx | PASS | 0 / 167 | 0 | 0 |
| s_Production.stuff_idx2 -> s_item.idx | PASS | 0 / 167 | 14 | 14 |
| s_Production.stuff_idx3 -> s_item.idx | PASS | 0 / 133 | 0 | 0 |
| s_Production.stuff_idx4 -> s_item.idx | PASS | 0 / 65 | 0 | 0 |
| s_Production.stuff_idx5 -> s_item.idx | PASS | 0 / 38 | 0 | 0 |
| s_Production.stuff_idx6 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_Production.stuff_idx7 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_Production.stuff_idx8 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_Production.stuff_idx9 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_Production.stuff_idx10 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_01 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_02 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_03 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_04 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_05 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_06 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_07 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_08 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_09 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_event_drop.item_10 -> s_item.idx | PASS | 0 / 0 | 0 | 0 |
| s_hero.birth_zone_idx -> s_zone.idx | PASS | 0 / 4 | 0 | 0 |
| s_CastleWarInfo.zone_idx -> s_zone.idx | PASS | 0 / 2 | 0 | 0 |
| s_CastleWarInfo.npc_idx -> s_npc.idx | PASS | 0 / 2 | 0 | 0 |
| u_item.item_idx -> s_item.idx | PASS | 0 / 13 | 0 | 0 |
| u_hench_1.monster_type -> s_monster.type | PASS | 0 / 6 | 0 | 0 |