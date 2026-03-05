# Runtime Data Validation Report

- Built At: 2026-03-05T17:19:21.068778+00:00
- Source Dir: `D:\AI-RPGGAME\scripts\gamedb`
- Total Checks: 52
- Passed: 45
- Failed: 7

## Check Results

| Check | Status | Invalid / Checked |
|---|---:|---:|
| s_gate.from_zone_idx -> s_zone.idx | PASS | 0 / 140 |
| s_gate.dest_zone_idx -> s_zone.idx | PASS | 0 / 140 |
| s_mob.zone_idx0 -> s_zone.idx | PASS | 0 / 889 |
| s_mob.zone_idx1 -> s_zone.idx | PASS | 0 / 216 |
| s_mob.zone_idx2 -> s_zone.idx | PASS | 0 / 205 |
| s_mob.zone_idx3 -> s_zone.idx | PASS | 0 / 0 |
| s_mob.zone_idx4 -> s_zone.idx | PASS | 0 / 0 |
| s_mob.zone_idx5 -> s_zone.idx | PASS | 0 / 0 |
| s_mob.monster_type -> s_monster.type | PASS | 0 / 889 |
| s_mob.mobitem_idx -> s_mobitem.idx | FAIL | 1 / 847 |
| s_mix.mainnum -> s_monster.type | PASS | 0 / 720 |
| s_mix.subnum -> s_monster.type | PASS | 0 / 720 |
| s_mix.result -> s_monster.type | PASS | 0 / 720 |
| s_npc.birth_zone_idx -> s_zone.idx | FAIL | 3 / 1035 |
| s_npc_sale.npc_idx -> s_npc.idx | FAIL | 2 / 1792 |
| s_npc_sale.sale_idx -> s_item.idx | FAIL | 20 / 1792 |
| s_mobitem.item_idx0 -> s_item.idx | PASS | 0 / 93 |
| s_mobitem.item_idx1 -> s_item.idx | PASS | 0 / 466 |
| s_mobitem.item_idx2 -> s_item.idx | PASS | 0 / 337 |
| s_mobitem.item_idx3 -> s_item.idx | PASS | 0 / 257 |
| s_mobitem.item_idx4 -> s_item.idx | FAIL | 12 / 189 |
| s_mobitem.item_idx5 -> s_item.idx | PASS | 0 / 134 |
| s_mobitem.item_idx6 -> s_item.idx | PASS | 0 / 90 |
| s_mobitem.item_idx7 -> s_item.idx | PASS | 0 / 52 |
| s_mobitem.item_idx8 -> s_item.idx | PASS | 0 / 23 |
| s_mobitem.item_idx9 -> s_item.idx | PASS | 0 / 6 |
| s_Production.result_idx -> s_item.idx | FAIL | 18 / 167 |
| s_Production.stuff_idx1 -> s_item.idx | PASS | 0 / 167 |
| s_Production.stuff_idx2 -> s_item.idx | FAIL | 14 / 167 |
| s_Production.stuff_idx3 -> s_item.idx | PASS | 0 / 133 |
| s_Production.stuff_idx4 -> s_item.idx | PASS | 0 / 65 |
| s_Production.stuff_idx5 -> s_item.idx | PASS | 0 / 38 |
| s_Production.stuff_idx6 -> s_item.idx | PASS | 0 / 0 |
| s_Production.stuff_idx7 -> s_item.idx | PASS | 0 / 0 |
| s_Production.stuff_idx8 -> s_item.idx | PASS | 0 / 0 |
| s_Production.stuff_idx9 -> s_item.idx | PASS | 0 / 0 |
| s_Production.stuff_idx10 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_01 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_02 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_03 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_04 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_05 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_06 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_07 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_08 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_09 -> s_item.idx | PASS | 0 / 0 |
| s_event_drop.item_10 -> s_item.idx | PASS | 0 / 0 |
| s_hero.birth_zone_idx -> s_zone.idx | PASS | 0 / 4 |
| s_CastleWarInfo.zone_idx -> s_zone.idx | PASS | 0 / 2 |
| s_CastleWarInfo.npc_idx -> s_npc.idx | PASS | 0 / 2 |
| u_item.item_idx -> s_item.idx | PASS | 0 / 13 |
| u_hench_1.monster_type -> s_monster.type | PASS | 0 / 6 |

## Failed Samples

### s_mob.mobitem_idx -> s_mobitem.idx

- invalidKey=`645` row={"idx": 910, "zone_idx0": 207, "zone_idx1": 0, "zone_idx2": 0, "zone_idx3": 0, "zone_idx4": 0, "zone_idx5": 0, "birth_zone_layernum0": 1, "birth_zone_layernum1": 0, "birth_zone_layernum2": 0, "birth_zone_layernum3": 0, "birth_zone_layernum4": 0, "birth_zone_layernum5": 0, "move_type": 0, "monster_type": 1879, "name": "石洞領主", "agressive": 0, "sight_range": 5, "mobitem_idx": 645, "appear_rate0": 1, "appear_rate1": 0, "appear_rate2": 0, "appear_rate3": 0, "appear_rate4": 0, "appear_rate5": 0, "wait_time0": 0, "wait_time1": 0, "wait_time2": 0, "wait_time3": 0, "wait_time4": 0, "wait_time5": 0, "interval_time0": 10, "interval_time1": 0, "interval_time2": 0, "interval_time3": 0, "interval_time4": 0, "interval_time5": 0, "life_time0": 0, "life_time1": 0, "life_time2": 0, "life_time3": 0, "life_time4": 0, "life_time5": 0, "unable_attack_layer0": 0, "unable_attack_layer1": 0, "unable_attack_layer2": 0, "unable_attack_layer3": 0, "unable_attack_layer4": 0, "unable_attack_layer5": 0, "blocking_layer0": 0, "blocking_layer1": 0, "blocking_layer2": 0, "blocking_layer3": 0, "blocking_layer4": 0, "blocking_layer5": 0, "blocking_value0": 0, "blocking_value1": 0, "blocking_value2": 0, "blocking_value3": 0, "blocking_value4": 0, "blocking_value5": 0}

### s_npc.birth_zone_idx -> s_zone.idx

- invalidKey=`248` row={"idx": 302, "name": "模擬大師", "type": 51, "birth_zone_idx": 248, "birth_zone_x": 53, "birth_zone_y": 133, "move_zone_layernum": 0, "sell_type": 0, "sell_ratio": 0, "barter_item_idx": 0}
- invalidKey=`250` row={"idx": 303, "name": "木匠師", "type": 51, "birth_zone_idx": 250, "birth_zone_x": 140, "birth_zone_y": 140, "move_zone_layernum": 0, "sell_type": 0, "sell_ratio": 0, "barter_item_idx": 0}
- invalidKey=`249` row={"idx": 318, "name": "千金飾品", "type": 51, "birth_zone_idx": 249, "birth_zone_x": 140, "birth_zone_y": 140, "move_zone_layernum": 0, "sell_type": 0, "sell_ratio": 0, "barter_item_idx": 0}

### s_npc_sale.npc_idx -> s_npc.idx

- invalidKey=`35` row={"npc_idx": 35, "sale_type": 2, "sale_idx": 259, "buy_ratio": 50}
- invalidKey=`35` row={"npc_idx": 35, "sale_type": 2, "sale_idx": 259, "buy_ratio": 50}

### s_npc_sale.sale_idx -> s_item.idx

- invalidKey=`4369` row={"npc_idx": 8, "sale_type": 2, "sale_idx": 4369, "buy_ratio": 50}
- invalidKey=`4371` row={"npc_idx": 8, "sale_type": 2, "sale_idx": 4371, "buy_ratio": 50}
- invalidKey=`4369` row={"npc_idx": 59, "sale_type": 2, "sale_idx": 4369, "buy_ratio": 50}
- invalidKey=`4369` row={"npc_idx": 60, "sale_type": 2, "sale_idx": 4369, "buy_ratio": 50}
- invalidKey=`4369` row={"npc_idx": 61, "sale_type": 2, "sale_idx": 4369, "buy_ratio": 50}
- invalidKey=`4371` row={"npc_idx": 61, "sale_type": 2, "sale_idx": 4371, "buy_ratio": 50}
- invalidKey=`4369` row={"npc_idx": 62, "sale_type": 2, "sale_idx": 4369, "buy_ratio": 50}
- invalidKey=`4371` row={"npc_idx": 62, "sale_type": 2, "sale_idx": 4371, "buy_ratio": 50}
- invalidKey=`4369` row={"npc_idx": 63, "sale_type": 2, "sale_idx": 4369, "buy_ratio": 50}
- invalidKey=`4371` row={"npc_idx": 63, "sale_type": 2, "sale_idx": 4371, "buy_ratio": 50}

### s_mobitem.item_idx4 -> s_item.idx

- invalidKey=`4369` row={"idx": 190, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 3505, "item_idx2": 80, "item_idx3": 3704, "item_idx4": 4369, "item_idx5": 4377, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 100, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4369` row={"idx": 191, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 158, "item_idx2": 431, "item_idx3": 3704, "item_idx4": 4369, "item_idx5": 4377, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 100, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4369` row={"idx": 192, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 917, "item_idx2": 895, "item_idx3": 314, "item_idx4": 4369, "item_idx5": 4377, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 80, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4369` row={"idx": 193, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 3505, "item_idx2": 80, "item_idx3": 3704, "item_idx4": 4369, "item_idx5": 4377, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 100, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4369` row={"idx": 194, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 158, "item_idx2": 431, "item_idx3": 3704, "item_idx4": 4369, "item_idx5": 4377, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 100, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4369` row={"idx": 195, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 917, "item_idx2": 895, "item_idx3": 314, "item_idx4": 4369, "item_idx5": 4377, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 80, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4371` row={"idx": 295, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 3505, "item_idx2": 80, "item_idx3": 3704, "item_idx4": 4371, "item_idx5": 4379, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 100, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4371` row={"idx": 296, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 158, "item_idx2": 431, "item_idx3": 3704, "item_idx4": 4371, "item_idx5": 4379, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 100, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4371` row={"idx": 297, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 917, "item_idx2": 895, "item_idx3": 316, "item_idx4": 4371, "item_idx5": 4379, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 80, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}
- invalidKey=`4371` row={"idx": 298, "base_money": 0, "bonus_money": 0, "item_idx0": 9999, "item_idx1": 3505, "item_idx2": 80, "item_idx3": 3704, "item_idx4": 4371, "item_idx5": 4379, "item_idx6": 0, "item_idx7": 0, "item_idx8": 0, "item_idx9": 0, "item_drop_percent0": 45000, "item_drop_percent1": 30, "item_drop_percent2": 60, "item_drop_percent3": 100, "item_drop_percent4": 60000, "item_drop_percent5": 40000, "item_drop_percent6": 0, "item_drop_percent7": 0, "item_drop_percent8": 0, "item_drop_percent9": 0, "item_drop_count0": 1, "item_drop_count1": 1, "item_drop_count2": 1, "item_drop_count3": 1, "item_drop_count4": 1, "item_drop_count5": 1, "item_drop_count6": 0, "item_drop_count7": 0, "item_drop_count8": 0, "item_drop_count9": 0}

### s_Production.result_idx -> s_item.idx

- invalidKey=`5729` row={"idx": 127, "doc_idx": 5194, "doc_name": "未知", "result_idx": 5729, "result_name": "未知", "result_count": 10, "money": 20, "default_pro": 90000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 10, "stuff_idx2": 5412, "stuff_name2": "紅色蛋", "stuff_count2": 10, "stuff_idx3": 0, "stuff_name3": 0, "stuff_count3": 0, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5730` row={"idx": 128, "doc_idx": 5195, "doc_name": "未知", "result_idx": 5730, "result_name": "未知", "result_count": 10, "money": 20, "default_pro": 90000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 10, "stuff_idx2": 5413, "stuff_name2": "藍色蛋", "stuff_count2": 10, "stuff_idx3": 0, "stuff_name3": 0, "stuff_count3": 0, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5731` row={"idx": 129, "doc_idx": 5196, "doc_name": "未知", "result_idx": 5731, "result_name": "未知", "result_count": 10, "money": 40, "default_pro": 90000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 10, "stuff_idx2": 5409, "stuff_name2": "黃色蛋", "stuff_count2": 10, "stuff_idx3": 0, "stuff_name3": 0, "stuff_count3": 0, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5732` row={"idx": 130, "doc_idx": 5197, "doc_name": "未知", "result_idx": 5732, "result_name": "未知", "result_count": 10, "money": 40, "default_pro": 90000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 10, "stuff_idx2": 5410, "stuff_name2": "綠色蛋", "stuff_count2": 10, "stuff_idx3": 0, "stuff_name3": 0, "stuff_count3": 0, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5733` row={"idx": 131, "doc_idx": 5198, "doc_name": "未知", "result_idx": 5733, "result_name": "未知", "result_count": 30, "money": 80, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 5406, "stuff_name2": "紫水晶", "stuff_count2": 15, "stuff_idx3": 5412, "stuff_name3": "紅色蛋", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5734` row={"idx": 132, "doc_idx": 5199, "doc_name": "未知", "result_idx": 5734, "result_name": "未知", "result_count": 30, "money": 80, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 5407, "stuff_name2": "鐵礦石", "stuff_count2": 15, "stuff_idx3": 5413, "stuff_name3": "藍色蛋", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5735` row={"idx": 133, "doc_idx": 5200, "doc_name": "未知", "result_idx": 5735, "result_name": "未知", "result_count": 30, "money": 300, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 5406, "stuff_name2": "紫水晶", "stuff_count2": 15, "stuff_idx3": 5409, "stuff_name3": "黃色蛋", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5736` row={"idx": 134, "doc_idx": 5201, "doc_name": "未知", "result_idx": 5736, "result_name": "未知", "result_count": 30, "money": 300, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 5407, "stuff_name2": "鐵礦石", "stuff_count2": 15, "stuff_idx3": 5410, "stuff_name3": "綠色蛋", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5737` row={"idx": 135, "doc_idx": 5202, "doc_name": "未知", "result_idx": 5737, "result_name": "未知", "result_count": 30, "money": 500, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 5406, "stuff_name2": "紫水晶", "stuff_count2": 15, "stuff_idx3": 5404, "stuff_name3": "帕荅的皮", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5738` row={"idx": 136, "doc_idx": 5203, "doc_name": "未知", "result_idx": 5738, "result_name": "未知", "result_count": 30, "money": 500, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 5407, "stuff_name2": "鐵礦石", "stuff_count2": 15, "stuff_idx3": 5404, "stuff_name3": "帕荅的皮", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}

### s_Production.stuff_idx2 -> s_item.idx

- invalidKey=`4369` row={"idx": 41, "doc_idx": 5300, "doc_name": "[模板]高級藥水(試管)", "result_idx": 5900, "result_name": "高級藥水(試管)", "result_count": 30, "money": 500, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 4369, "stuff_name2": "特殊藥水", "stuff_count2": 30, "stuff_idx3": 4370, "stuff_name3": "超級藥水", "stuff_count3": 30, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`4369` row={"idx": 42, "doc_idx": 5301, "doc_name": "[模板]高級藥水(試管)", "result_idx": 5900, "result_name": "高級藥水(試管)", "result_count": 60, "money": 1000, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 60, "stuff_idx2": 4369, "stuff_name2": "特殊藥水", "stuff_count2": 60, "stuff_idx3": 4370, "stuff_name3": "超級藥水", "stuff_count3": 60, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`4369` row={"idx": 43, "doc_idx": 5302, "doc_name": "[模板]高級藥水(試管)", "result_idx": 5900, "result_name": "高級藥水(試管)", "result_count": 90, "money": 1500, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 90, "stuff_idx2": 4369, "stuff_name2": "特殊藥水", "stuff_count2": 90, "stuff_idx3": 4370, "stuff_name3": "超級藥水", "stuff_count3": 90, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`4369` row={"idx": 47, "doc_idx": 5306, "doc_name": "[模板]高級藥水(長頸瓶)", "result_idx": 5902, "result_name": "高級藥水(長頸瓶)", "result_count": 30, "money": 2000, "default_pro": 56000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5416, "stuff_name1": "長頸瓶", "stuff_count1": 30, "stuff_idx2": 4369, "stuff_name2": "特殊藥水", "stuff_count2": 30, "stuff_idx3": 4372, "stuff_name3": "藍色恢復藥水", "stuff_count3": 30, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`4369` row={"idx": 48, "doc_idx": 5307, "doc_name": "[模板]高級藥水(長頸瓶)", "result_idx": 5902, "result_name": "高級藥水(長頸瓶)", "result_count": 60, "money": 2500, "default_pro": 56000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5416, "stuff_name1": "長頸瓶", "stuff_count1": 60, "stuff_idx2": 4369, "stuff_name2": "特殊藥水", "stuff_count2": 60, "stuff_idx3": 4372, "stuff_name3": "藍色恢復藥水", "stuff_count3": 60, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`4369` row={"idx": 49, "doc_idx": 5308, "doc_name": "[模板]高級藥水(長頸瓶)", "result_idx": 5902, "result_name": "高級藥水(長頸瓶)", "result_count": 90, "money": 3000, "default_pro": 56000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5416, "stuff_name1": "長頸瓶", "stuff_count1": 90, "stuff_idx2": 4369, "stuff_name2": "特殊藥水", "stuff_count2": 90, "stuff_idx3": 4372, "stuff_name3": "藍色恢復藥水", "stuff_count3": 90, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5737` row={"idx": 137, "doc_idx": 5204, "doc_name": "未知", "result_idx": 5739, "result_name": "未知", "result_count": 30, "money": 1000, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 5737, "stuff_name2": "未知", "stuff_count2": 15, "stuff_idx3": 5406, "stuff_name3": "紫水晶", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5738` row={"idx": 138, "doc_idx": 5205, "doc_name": "未知", "result_idx": 5740, "result_name": "未知", "result_count": 30, "money": 1000, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5415, "stuff_name1": "試管", "stuff_count1": 30, "stuff_idx2": 5738, "stuff_name2": "未知", "stuff_count2": 15, "stuff_idx3": 5407, "stuff_name3": "鐵礦石", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5739` row={"idx": 139, "doc_idx": 5206, "doc_name": "未知", "result_idx": 5741, "result_name": "未知", "result_count": 30, "money": 2500, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5416, "stuff_name1": "長頸瓶", "stuff_count1": 30, "stuff_idx2": 5739, "stuff_name2": "未知", "stuff_count2": 15, "stuff_idx3": 5406, "stuff_name3": "紫水晶", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
- invalidKey=`5740` row={"idx": 140, "doc_idx": 5207, "doc_name": "未知", "result_idx": 5742, "result_name": "未知", "result_count": 30, "money": 2500, "default_pro": 70000, "add_pro": 10000, "opt_slot_cnt": 0, "stuff_idx1": 5416, "stuff_name1": "長頸瓶", "stuff_count1": 30, "stuff_idx2": 5740, "stuff_name2": "未知", "stuff_count2": 15, "stuff_idx3": 5407, "stuff_name3": "鐵礦石", "stuff_count3": 15, "stuff_idx4": 0, "stuff_name4": 0, "stuff_count4": 0, "stuff_idx5": 0, "stuff_name5": 0, "stuff_count5": 0}
