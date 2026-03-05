from __future__ import annotations

import hashlib
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Paths:
    root: Path
    source_dir: Path
    out_dir: Path
    report_dir: Path


def resolve_paths() -> Paths:
    root = Path(__file__).resolve().parents[2]
    return Paths(
        root=root,
        source_dir=root / 'scripts' / 'gamedb',
        out_dir=root / 'src' / 'data' / 'runtime',
        report_dir=root / 'scripts' / 'gamedb' / 'reports',
    )


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def to_int(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).strip()
    if not text:
        return default
    try:
        return int(float(text))
    except Exception:
        return default


def to_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return default
    try:
        return float(text)
    except Exception:
        return default


def to_bool_int(value: Any) -> bool:
    return to_int(value) != 0


def pick(row: dict[str, Any], key: str, default: Any = None) -> Any:
    return row.get(key, default)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def load_source_tables(source_dir: Path) -> dict[str, list[dict[str, Any]]]:
    tables: dict[str, list[dict[str, Any]]] = {}
    for json_file in sorted(source_dir.glob('*.json')):
        if json_file.name == '_index.json':
            continue
        payload = load_json(json_file)
        if isinstance(payload, list):
            tables[json_file.stem] = payload
    return tables


def load_reference_overrides(source_dir: Path) -> dict[str, Any]:
    path = source_dir / 'reference_overrides.json'
    if not path.exists():
        return {}
    payload = load_json(path)
    return payload if isinstance(payload, dict) else {}


def build_world_topology(tables: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    zrows = tables.get('s_zone', [])
    grows = tables.get('s_gate', [])

    zones: list[dict[str, Any]] = []
    for row in zrows:
        zones.append(
            {
                'zoneId': to_int(pick(row, 'idx')),
                'name': str(pick(row, 'name', '')).strip(),
                'mobAble': to_bool_int(pick(row, 'mob_able')),
                'level': {
                    'min': to_int(pick(row, 'min_level'), 1),
                    'max': to_int(pick(row, 'max_level'), 1),
                },
                'mobDensity': {
                    'min': to_int(pick(row, 'min_mob')),
                    'max': to_int(pick(row, 'max_mob')),
                    'perUser': to_int(pick(row, 'mob_peruser')),
                },
                'rules': {
                    'restriction': to_int(pick(row, 'restriction')),
                    'itemIdx': to_int(pick(row, 'item_idx')),
                    'collisionLayer': to_int(pick(row, 'CollisionLayer')),
                    'rootZone': to_int(pick(row, 'RootZone')),
                    'ability': to_int(pick(row, 'Ability')),
                    'mobDamageRate': to_float(pick(row, 'mob_damage_rate'), 1.0),
                    'pkZoneFlag': to_int(pick(row, 'PkZoneFlag')),
                    'dropItemIdx': to_int(pick(row, 'dropitemidx')),
                    'dropItemCond': to_int(pick(row, 'dropItemCond')),
                    'reviveLayer': to_int(pick(row, 'revive_zone_layernum')),
                    'nonPkLayer': to_int(pick(row, 'nonPkZoneLayernum')),
                    'dualLayer': to_int(pick(row, 'dual_zone_layernum')),
                },
            }
        )

    gates: list[dict[str, Any]] = []
    adjacency: dict[str, list[dict[str, Any]]] = defaultdict(list)
    incoming_count: dict[int, int] = defaultdict(int)

    for row in grows:
        edge = {
            'fromZoneId': to_int(pick(row, 'from_zone_idx')),
            'fromAttr': to_int(pick(row, 'from_zone_attr')),
            'toZoneId': to_int(pick(row, 'dest_zone_idx')),
            'toLayer': to_int(pick(row, 'dest_zone_layer')),
        }
        gates.append(edge)
        adjacency[str(edge['fromZoneId'])].append(
            {
                'toZoneId': edge['toZoneId'],
                'fromAttr': edge['fromAttr'],
                'toLayer': edge['toLayer'],
            }
        )
        incoming_count[edge['toZoneId']] += 1

    zone_ids = {z['zoneId'] for z in zones}
    zones_with_out = {to_int(k) for k in adjacency.keys()}
    zones_with_in = set(incoming_count.keys())
    zones_with_gate = zones_with_out | zones_with_in

    isolated = sorted(zone_ids - zones_with_gate)

    return {
        'meta': {
            'builtAt': now_iso(),
            'sourceTables': {'s_zone': len(zrows), 's_gate': len(grows)},
        },
        'zones': sorted(zones, key=lambda x: x['zoneId']),
        'gates': gates,
        'adjacency': dict(sorted(adjacency.items(), key=lambda kv: int(kv[0]))),
        'stats': {
            'zoneCount': len(zones),
            'gateCount': len(gates),
            'zonesWithOutgoingGate': len(zones_with_out),
            'zonesWithIncomingGate': len(zones_with_in),
            'isolatedZoneCount': len(isolated),
            'isolatedZoneIds': isolated,
        },
    }


def build_world_spawn(tables: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    mrows = tables.get('s_mob', [])
    monster_rows = tables.get('s_monster', [])

    monster_catalog: list[dict[str, Any]] = []
    monster_name_by_type: dict[int, str] = {}

    for row in monster_rows:
        mon_type = to_int(pick(row, 'type'))
        name = str(pick(row, 'name', '')).strip()
        monster_name_by_type[mon_type] = name
        monster_catalog.append(
            {
                'monsterType': mon_type,
                'name': name,
                'race': to_int(pick(row, 'race')),
                'startBaseLevel': to_int(pick(row, 'start_base_level'), 1),
                'coreRate': to_int(pick(row, 'core_rate')),
                'statRate': to_float(pick(row, 'stat_rate'), 1.0),
                'hpRate': to_float(pick(row, 'hp_rate'), 1.0),
                'expRate': to_float(pick(row, 'exp_rate'), 1.0),
                'attackRange': to_int(pick(row, 'attack_range')),
                'speed': {
                    'move': to_int(pick(row, 'speed_move')),
                    'attack': to_int(pick(row, 'speed_attack')),
                    'skill': to_int(pick(row, 'speed_skill')),
                },
                'mixRestrict': to_int(pick(row, 'mix_restrict')),
                'sp': to_int(pick(row, 'sp')),
            }
        )

    mob_spawns: list[dict[str, Any]] = []
    zone_spawn_index: dict[str, list[int]] = defaultdict(list)
    monster_spawn_index: dict[str, list[int]] = defaultdict(list)

    for row in mrows:
        mob_idx = to_int(pick(row, 'idx'))
        monster_type = to_int(pick(row, 'monster_type'))
        slots: list[dict[str, Any]] = []

        for slot in range(6):
            zone_id = to_int(pick(row, f'zone_idx{slot}'))
            if zone_id <= 0:
                continue
            slot_data = {
                'slot': slot,
                'zoneId': zone_id,
                'layer': to_int(pick(row, f'birth_zone_layernum{slot}')),
                'appearRate': to_int(pick(row, f'appear_rate{slot}')),
                'waitTime': to_int(pick(row, f'wait_time{slot}')),
                'intervalTime': to_int(pick(row, f'interval_time{slot}')),
                'lifeTime': to_int(pick(row, f'life_time{slot}')),
                'unableAttackLayer': to_int(pick(row, f'unable_attack_layer{slot}')),
                'blockingLayer': to_int(pick(row, f'blocking_layer{slot}')),
                'blockingValue': to_int(pick(row, f'blocking_value{slot}')),
            }
            slots.append(slot_data)
            zone_spawn_index[str(zone_id)].append(mob_idx)

        spawn = {
            'mobIdx': mob_idx,
            'monsterType': monster_type,
            'monsterName': monster_name_by_type.get(monster_type, str(pick(row, 'name', '')).strip()),
            'spawnName': str(pick(row, 'name', '')).strip(),
            'moveType': to_int(pick(row, 'move_type')),
            'aggressive': to_int(pick(row, 'agressive')),
            'sightRange': to_int(pick(row, 'sight_range')),
            'mobItemIdx': to_int(pick(row, 'mobitem_idx')),
            'slots': slots,
        }
        mob_spawns.append(spawn)
        monster_spawn_index[str(monster_type)].append(mob_idx)

    return {
        'meta': {
            'builtAt': now_iso(),
            'sourceTables': {'s_mob': len(mrows), 's_monster': len(monster_rows)},
        },
        'monsterCatalog': sorted(monster_catalog, key=lambda x: x['monsterType']),
        'mobSpawns': mob_spawns,
        'indexes': {
            'zoneToMobIdx': dict(sorted(zone_spawn_index.items(), key=lambda kv: int(kv[0]))),
            'monsterTypeToMobIdx': dict(sorted(monster_spawn_index.items(), key=lambda kv: int(kv[0]))),
        },
        'stats': {
            'mobSpawnCount': len(mob_spawns),
            'monsterCatalogCount': len(monster_catalog),
            'zonesWithSpawn': len(zone_spawn_index),
        },
    }


def build_progression(tables: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    heroes_raw = tables.get('s_hero', [])
    user_lv_raw = tables.get('s_LvUserInfo', [])
    mon_lv_raw = tables.get('s_LvMonInfo', [])
    skill_prop_raw = tables.get('s_SkillProperty', [])
    skill_data_raw = tables.get('s_SkillData', [])
    mix_skill_raw = tables.get('s_MixSkill', [])

    heroes = [
        {
            'type': to_int(pick(r, 'type')),
            'name': str(pick(r, 'name', '')).strip(),
            'sex': to_int(pick(r, 'sex')),
            'birthZoneId': to_int(pick(r, 'birth_zone_idx')),
            'birthLayer': to_int(pick(r, 'birth_zone_layernum')),
            'baseStats': {
                'str': to_int(pick(r, 'base_str')),
                'dex': to_int(pick(r, 'base_dex')),
                'aim': to_int(pick(r, 'base_aim')),
                'luck': to_int(pick(r, 'base_luck')),
                'ap': to_int(pick(r, 'base_ap')),
                'dp': to_int(pick(r, 'base_dp')),
                'hc': to_int(pick(r, 'base_hc')),
                'hd': to_int(pick(r, 'base_hd')),
                'hp': to_int(pick(r, 'base_hp')),
                'mp': to_int(pick(r, 'base_mp')),
            },
            'speed': {
                'move': to_int(pick(r, 'speed_move')),
                'attack': to_int(pick(r, 'speed_attack')),
                'skill': to_int(pick(r, 'speed_skill')),
            },
            'resistance': {
                'fire': to_int(pick(r, 'res_fire')),
                'water': to_int(pick(r, 'res_water')),
                'earth': to_int(pick(r, 'res_earth')),
                'wind': to_int(pick(r, 'res_wind')),
                'devil': to_int(pick(r, 'res_devil')),
            },
            'makeFreePoint': to_int(pick(r, 'make_freepoint')),
            'skillAble': to_int(pick(r, 'skill_able')),
            'equipAble': to_int(pick(r, 'equip_able')),
        }
        for r in heroes_raw
    ]

    user_levels = sorted(
        [
            {
                'lv': to_int(pick(r, 'Lv'), 1),
                'lvUpExp': to_int(pick(r, 'LvUpExp'), 0),
            }
            for r in user_lv_raw
        ],
        key=lambda x: x['lv'],
    )

    monster_levels = sorted(
        [
            {
                'lv': to_int(pick(r, 'Lv'), 1),
                'hp': to_int(pick(r, 'HP')),
                'mp': to_int(pick(r, 'MP')),
                'str': to_int(pick(r, 'STR')),
                'dex': to_int(pick(r, 'DEX')),
                'aim': to_int(pick(r, 'AIM')),
                'luck': to_int(pick(r, 'Luck')),
                'att': to_int(pick(r, 'ATT')),
                'ap': to_int(pick(r, 'AP')),
                'dp': to_int(pick(r, 'DP')),
                'hitCnt': to_int(pick(r, 'HitCnt')),
                'hitDice': to_int(pick(r, 'HitDice')),
                'giveExp': to_int(pick(r, 'GiveExp')),
                'mixRate': to_int(pick(r, 'MixRate')),
            }
            for r in mon_lv_raw
        ],
        key=lambda x: x['lv'],
    )

    skill_properties = [
        {
            'skillIndex': to_int(pick(r, 'skillIndex')),
            'name': str(pick(r, 'name', '')).strip(),
            'targetClass': str(pick(r, 'targetClass', '')).strip(),
            'pkTargetClass': str(pick(r, 'pkTargetClass', '')).strip(),
            'targetRangeClass': to_int(pick(r, 'targetRangeClass')),
            'positiveEffect': to_int(pick(r, 'positiveEffect')),
            'effectIndex': to_int(pick(r, 'effectIndex')),
            'effectingStat': to_int(pick(r, 'effectingStat')),
            'maxLevel': to_int(pick(r, 'maxLevel')),
            'upgradeType': to_int(pick(r, 'upgradeType')),
            'requireUpdateType': to_int(pick(r, 'rquireUpdateType')),
            'learningGold': to_int(pick(r, 'learningGold')),
            'learningSP': to_int(pick(r, 'learningSP')),
        }
        for r in skill_prop_raw
    ]

    skill_levels = [
        {
            'skillIndex': to_int(pick(r, 'skill_index')),
            'level': to_int(pick(r, 'level'), 1),
            'consumedMp': to_int(pick(r, 'consumedMp')),
            'maxTargetDistance': to_int(pick(r, 'maxTargetDistance')),
            'targetRange': to_int(pick(r, 'targetRange')),
            'requireSP': to_int(pick(r, 'requireSP')),
            'continuityTime': to_int(pick(r, 'continuityTime')),
            'coolTime': to_int(pick(r, 'coolTime')),
        }
        for r in skill_data_raw
    ]

    mix_skills = sorted(
        [
            {
                'mixSkillLevel': to_int(pick(r, 'MixSkillLevel')),
                'startHenchLevel': to_int(pick(r, 'StartHenchLevel')),
                'endHenchLevel': to_int(pick(r, 'EndHenchLevel')),
                'mixSkillBasis': to_int(pick(r, 'MixSkillBasis')),
                'mixSkillStart': to_int(pick(r, 'MixSkillStart')),
                'mixSkillMaster': to_int(pick(r, 'MixSkillMaster')),
                'mixSkillBonus': to_int(pick(r, 'MixSkillBonus')),
                'mixSkillMaxRate': to_int(pick(r, 'MixSkillMaxRate')),
            }
            for r in mix_skill_raw
        ],
        key=lambda x: x['mixSkillLevel'],
    )

    return {
        'meta': {
            'builtAt': now_iso(),
            'sourceTables': {
                's_hero': len(heroes_raw),
                's_LvUserInfo': len(user_lv_raw),
                's_LvMonInfo': len(mon_lv_raw),
                's_SkillProperty': len(skill_prop_raw),
                's_SkillData': len(skill_data_raw),
                's_MixSkill': len(mix_skill_raw),
                's_hero_skill': len(tables.get('s_hero_skill', [])),
            },
        },
        'heroes': sorted(heroes, key=lambda x: x['type']),
        'userLevels': user_levels,
        'monsterLevels': monster_levels,
        'skills': {
            'properties': sorted(skill_properties, key=lambda x: x['skillIndex']),
            'levels': sorted(skill_levels, key=lambda x: (x['skillIndex'], x['level'])),
            'heroSkill': tables.get('s_hero_skill', []),
        },
        'mixSkills': mix_skills,
        'party': {
            'expRates': tables.get('s_PartyExpRate', []),
            'penaltyRates': tables.get('s_PartyPenaltyRate', []),
        },
        'stats': {
            'heroCount': len(heroes),
            'userLevelRows': len(user_levels),
            'monsterLevelRows': len(monster_levels),
            'skillCount': len(skill_properties),
            'skillLevelRows': len(skill_levels),
        },
    }


def build_fusion_runtime(tables: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    mix_rows = tables.get('s_mix', [])
    monster_rows = tables.get('s_monster', [])

    monster_name_by_type = {to_int(r.get('type')): str(r.get('name', '')).strip() for r in monster_rows}

    recipes: list[dict[str, Any]] = []
    by_result: dict[str, list[int]] = defaultdict(list)
    by_ingredient: dict[str, list[int]] = defaultdict(list)

    for idx, row in enumerate(mix_rows):
        recipe = {
            'recipeId': idx,
            'mode': to_int(pick(row, 'mode')),
            'mainType': to_int(pick(row, 'mainnum')),
            'mainGrade': to_int(pick(row, 'maingrade')),
            'subType': to_int(pick(row, 'subnum')),
            'subGrade': to_int(pick(row, 'subgrade')),
            'resultType': to_int(pick(row, 'result')),
            'names': {
                'main': monster_name_by_type.get(to_int(pick(row, 'mainnum')), ''),
                'sub': monster_name_by_type.get(to_int(pick(row, 'subnum')), ''),
                'result': monster_name_by_type.get(to_int(pick(row, 'result')), ''),
            },
        }
        recipes.append(recipe)
        by_result[str(recipe['resultType'])].append(idx)
        by_ingredient[str(recipe['mainType'])].append(idx)
        by_ingredient[str(recipe['subType'])].append(idx)

    unresolved_types = sorted(
        {
            t
            for r in recipes
            for t in (r['mainType'], r['subType'], r['resultType'])
            if t not in monster_name_by_type
        }
    )

    return {
        'meta': {
            'builtAt': now_iso(),
            'sourceTables': {'s_mix': len(mix_rows), 's_monster': len(monster_rows)},
        },
        'recipes': recipes,
        'indexes': {
            'byResultType': dict(sorted(by_result.items(), key=lambda kv: int(kv[0]))),
            'byIngredientType': dict(sorted(by_ingredient.items(), key=lambda kv: int(kv[0]))),
        },
        'stats': {
            'recipeCount': len(recipes),
            'resultTypeCount': len(by_result),
            'ingredientTypeCount': len(by_ingredient),
            'unresolvedMonsterTypeCount': len(unresolved_types),
            'unresolvedMonsterTypes': unresolved_types,
        },
    }


def build_economy(tables: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    items = tables.get('s_item', [])
    item_by_idx = {to_int(r.get('idx')): r for r in items}

    npcs_raw = tables.get('s_npc', [])
    npcs_fixed = tables.get('s_npc_fixed', [])
    npcs = npcs_fixed if npcs_fixed else npcs_raw
    npc_by_idx = {to_int(r.get('idx')): r for r in npcs}
    npc_sales = tables.get('s_npc_sale', [])
    mob_drops = tables.get('s_mobitem', [])

    # Build a virtual item map for DB ids referenced by drop/sale/production but
    # missing in s_item. This preserves source-of-truth references and keeps UI usable.
    missing_item_names: dict[int, str] = {}

    def register_missing_item_name(item_idx: int, name: str) -> None:
        if item_idx <= 0 or item_idx in item_by_idx:
            return
        text = str(name or '').strip()
        if item_idx not in missing_item_names:
            missing_item_names[item_idx] = '' if text == '0' else text
            return
        if not missing_item_names[item_idx] and text and text != '0':
            missing_item_names[item_idx] = text

    for row in mob_drops:
        for i in range(10):
            idx = to_int(pick(row, f'item_idx{i}'))
            if idx <= 0 or idx == 9999:
                continue
            register_missing_item_name(idx, '')

    production_rows = tables.get('s_Production', [])
    for row in production_rows:
        register_missing_item_name(to_int(pick(row, 'result_idx')), str(pick(row, 'result_name', '')).strip())
        for slot in range(1, 11):
            register_missing_item_name(to_int(pick(row, f'stuff_idx{slot}')), str(pick(row, f'stuff_name{slot}', '')).strip())

    for row in npc_sales:
        register_missing_item_name(to_int(pick(row, 'sale_idx')), '')

    virtual_items: list[dict[str, Any]] = []
    for item_idx in sorted(k for k in missing_item_names.keys() if k > 0):
        virtual_items.append(
            {
                'idx': item_idx,
                'name': missing_item_names[item_idx] or f'未知道具 #{item_idx}',
                'price': 0,
                'rarity': 0,
                'type': 0,
                'isVirtual': True,
            }
        )
    virtual_item_by_idx = {to_int(r['idx']): r for r in virtual_items}

    shop_catalog: list[dict[str, Any]] = []
    for row in npc_sales:
        npc_idx = to_int(pick(row, 'npc_idx'))
        item_idx = to_int(pick(row, 'sale_idx'))
        npc = npc_by_idx.get(npc_idx)
        item = item_by_idx.get(item_idx)
        virtual = virtual_item_by_idx.get(item_idx)
        resolved_item = item if item else virtual
        if not npc or not resolved_item:
            continue
        shop_catalog.append(
            {
                'npcIdx': npc_idx,
                'npcName': str(pick(npc, 'name', '')).strip(),
                'saleType': to_int(pick(row, 'sale_type')),
                'buyRatio': to_int(pick(row, 'buy_ratio')),
                'itemIdx': item_idx,
                'itemName': str(pick(resolved_item, 'name', '')).strip(),
                'itemType': to_int(pick(resolved_item, 'type')),
                'price': to_int(pick(resolved_item, 'price')),
                'rarity': to_int(pick(resolved_item, 'rarity')),
                'isVirtualItem': bool(virtual and not item),
            }
        )

    # Normalize production materials dynamically from stuff_idxN/stuff_countN
    production_recipes: list[dict[str, Any]] = []
    slot_pattern = re.compile(r'^stuff_idx(\d+)$')
    for row in production_rows:
        mats: list[dict[str, Any]] = []
        for key, value in row.items():
            m = slot_pattern.match(key)
            if not m:
                continue
            slot = int(m.group(1))
            mat_idx = to_int(value)
            if mat_idx <= 0:
                continue
                mats.append(
                {
                    'slot': slot,
                    'itemIdx': mat_idx,
                    'itemName': str(
                        pick(item_by_idx.get(mat_idx, {}), 'name')
                        or pick(virtual_item_by_idx.get(mat_idx, {}), 'name')
                        or pick(row, f'stuff_name{slot}', '')
                    ).strip(),
                    'count': to_int(pick(row, f'stuff_count{slot}')),
                }
            )

        result_idx = to_int(pick(row, 'result_idx'))
        production_recipes.append(
            {
                'idx': to_int(pick(row, 'idx')),
                'docIdx': to_int(pick(row, 'doc_idx')),
                'docName': str(pick(row, 'doc_name', '')).strip(),
                'resultIdx': result_idx,
                'resultName': str(
                    pick(item_by_idx.get(result_idx, {}), 'name')
                    or pick(virtual_item_by_idx.get(result_idx, {}), 'name')
                    or pick(row, 'result_name', '')
                ).strip(),
                'resultCount': to_int(pick(row, 'result_count'), 1),
                'money': to_int(pick(row, 'money')),
                'defaultPro': to_int(pick(row, 'default_pro')),
                'addPro': to_int(pick(row, 'add_pro')),
                'optSlotCnt': to_int(pick(row, 'opt_slot_cnt')),
                'materials': sorted(mats, key=lambda x: x['slot']),
            }
        )

    valid_items = [
        r
        for r in items
        if to_int(pick(r, 'idx')) >= 16 and str(pick(r, 'name', '')).strip() not in {'B', 'C', 'F', 'G', 'H'}
    ]

    return {
        'meta': {
            'builtAt': now_iso(),
            'sourceTables': {
                's_item': len(items),
                's_ItemEffectiveData': len(tables.get('s_ItemEffectiveData', [])),
                's_mobitem': len(tables.get('s_mobitem', [])),
                's_npc': len(npcs),
                's_npc_sale': len(npc_sales),
                's_Production': len(production_rows),
                's_npc_fixed': len(tables.get('s_npc_fixed', [])),
            },
        },
        'items': items,
        'virtualItems': virtual_items,
        'validItems': valid_items,
        'itemEffectiveData': tables.get('s_ItemEffectiveData', []),
        'mobDrops': mob_drops,
        'npcs': npcs,
        'npcSales': npc_sales,
        'shopCatalog': shop_catalog,
        'production': production_recipes,
        'itemRankInfo': tables.get('s_ItemRankInfo', []),
        'itemTypeInfo': tables.get('s_ItemTypeInfo', []),
        'itemPowerAdd': tables.get('s_Itempoweradd', []),
        'itemBox': tables.get('s_ItemBox', []),
        'lootRankInfo': tables.get('s_LootRankInfo', []),
        'lootTypeInfo': tables.get('s_LootTypeInfo', []),
        'optInfo': tables.get('s_OptInfo', []),
        'optLvInfo': tables.get('s_OptLvInfo', []),
        'stats': {
            'itemCount': len(items),
            'virtualItemCount': len(virtual_items),
            'validItemCount': len(valid_items),
            'npcCount': len(npcs),
            'npcSaleCount': len(npc_sales),
            'shopCatalogRows': len(shop_catalog),
            'productionRecipeCount': len(production_recipes),
        },
    }


def build_ops(tables: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    return {
        'meta': {
            'builtAt': now_iso(),
            'sourceTables': {
                's_event': len(tables.get('s_event', [])),
                's_event_drop': len(tables.get('s_event_drop', [])),
                's_CastleWarInfo': len(tables.get('s_CastleWarInfo', [])),
                'ZoneServerMessage': len(tables.get('ZoneServerMessage', [])),
                's_QuestScheduler': len(tables.get('s_QuestScheduler', [])),
            },
        },
        'event': tables.get('s_event', []),
        'eventDrops': tables.get('s_event_drop', []),
        'castleWarInfo': tables.get('s_CastleWarInfo', []),
        'zoneServerMessages': tables.get('ZoneServerMessage', []),
        'questScheduler': tables.get('s_QuestScheduler', []),
    }


def build_save_schema(tables: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    sensitive_fields = {'Passwd', 'Passwd_A', 'JuminNo', 'ParentJuminNo'}

    def scrub(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for row in rows:
            c = dict(row)
            for key in sensitive_fields:
                if key in c:
                    c[key] = '***'
            out.append(c)
        return out

    return {
        'meta': {
            'builtAt': now_iso(),
            'sourceTables': {
                'Player': len(tables.get('Player', [])),
                'u_hero': len(tables.get('u_hero', [])),
                'u_hench_1': len(tables.get('u_hench_1', [])),
                'u_item': len(tables.get('u_item', [])),
                'u_MixSkill': len(tables.get('u_MixSkill', [])),
            },
        },
        'player': scrub(tables.get('Player', [])),
        'uHero': tables.get('u_hero', []),
        'uHench': tables.get('u_hench_1', []),
        'uItem': tables.get('u_item', []),
        'uMixSkill': tables.get('u_MixSkill', []),
    }


def build_manifest(
    index_payload: dict[str, Any],
    domain_map: dict[str, list[str]],
    outputs: dict[str, dict[str, Any]],
    source_tables_actual: dict[str, int],
) -> dict[str, Any]:
    source_tables_from_index = index_payload.get('tables', {}) if isinstance(index_payload, dict) else {}
    if not isinstance(source_tables_from_index, dict):
        source_tables_from_index = {}

    source_row_counts = dict(source_tables_actual)
    for key, value in source_tables_from_index.items():
        if key not in source_row_counts:
            source_row_counts[key] = to_int(value)

    known_source = set(source_row_counts.keys())
    assigned_tables = {table for tables in domain_map.values() for table in tables}

    unassigned = sorted(known_source - assigned_tables)
    unknown_assigned = sorted(assigned_tables - known_source)

    digest_parts = [f"{k}:{source_row_counts.get(k, -1)}" for k in sorted(known_source)]
    digest = sha256_text('|'.join(digest_parts)) if digest_parts else ''

    return {
        'builtAt': now_iso(),
        'sourceTableCount': len(known_source),
        'sourceRowCounts': source_row_counts,
        'domainTableUsage': domain_map,
        'unassignedSourceTables': unassigned,
        'assignedButMissingSourceTables': unknown_assigned,
        'sourceDigest': digest,
        'outputs': {
            name: {
                'stats': payload.get('stats', {}),
                'meta': payload.get('meta', {}),
            }
            for name, payload in outputs.items()
        },
    }


def main() -> None:
    paths = resolve_paths()
    paths.out_dir.mkdir(parents=True, exist_ok=True)
    paths.report_dir.mkdir(parents=True, exist_ok=True)

    tables = load_source_tables(paths.source_dir)
    reference_overrides = load_reference_overrides(paths.source_dir)
    index_payload = load_json(paths.source_dir / '_index.json')

    domain_table_usage = {
        'world_topology': ['s_zone', 's_gate'],
        'world_spawn': ['s_mob', 's_monster'],
        'progression': ['s_hero', 's_LvUserInfo', 's_LvMonInfo', 's_SkillProperty', 's_SkillData', 's_MixSkill', 's_hero_skill', 's_PartyExpRate', 's_PartyPenaltyRate'],
        'fusion_runtime': ['s_mix'],
        'economy': ['s_item', 's_ItemEffectiveData', 's_mobitem', 's_npc', 's_npc_sale', 's_Production', 's_ItemRankInfo', 's_Itempoweradd', 's_ItemBox', 's_ItemTypeInfo', 's_LootRankInfo', 's_LootTypeInfo', 's_OptInfo', 's_OptLvInfo', 's_npc_fixed'],
        'ops': ['s_event', 's_event_drop', 's_CastleWarInfo', 'ZoneServerMessage', 's_QuestScheduler'],
        'save_schema': ['Player', 'u_hero', 'u_hench_1', 'u_item', 'u_MixSkill'],
    }

    outputs = {
        'world.topology': build_world_topology(tables),
        'world.spawn': build_world_spawn(tables),
        'progression': build_progression(tables),
        'fusion.runtime': build_fusion_runtime(tables),
        'economy': build_economy(tables),
        'ops': build_ops(tables),
        'save_schema': build_save_schema(tables),
    }

    for name, payload in outputs.items():
        write_json(paths.out_dir / f'{name}.json', payload)

    source_tables_actual = {name: len(rows) for name, rows in tables.items()}
    manifest = build_manifest(
        index_payload=index_payload,
        domain_map=domain_table_usage,
        outputs=outputs,
        source_tables_actual=source_tables_actual,
    )
    write_json(paths.out_dir / '_manifest.json', manifest)

    build_report = {
        'builtAt': now_iso(),
        'outDir': str(paths.out_dir),
        'files': sorted([f.name for f in paths.out_dir.glob('*.json')]),
        'manifest': manifest,
        'referenceOverrides': reference_overrides,
    }
    write_json(paths.report_dir / 'runtime_build_report.json', build_report)

    print('[build_runtime] generated files:')
    for f in sorted(paths.out_dir.glob('*.json')):
        print(f'  - {f.name} ({f.stat().st_size} bytes)')

    if manifest['unassignedSourceTables']:
        print('[build_runtime] warning: unassigned source tables ->', ', '.join(manifest['unassignedSourceTables']))
    else:
        print('[build_runtime] all source tables are assigned to runtime domains.')


if __name__ == '__main__':
    main()
