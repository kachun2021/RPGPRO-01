from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


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


@dataclass
class CheckResult:
    name: str
    passed: bool
    bad_total: int
    total: int
    sample_bad: list[dict[str, Any]]
    bad_key_counts: dict[str, int]
    raw_bad_total: int
    suppressed_by_runtime_repair: int
    suppressed_by_override: int


def run_fk_check(
    *,
    name: str,
    rows: Iterable[dict[str, Any]],
    key_fn,
    valid_set: set[int],
    ignore_values: set[int] | None = None,
    sample_limit: int = 20,
) -> CheckResult:
    ignore_values = ignore_values or set()
    bad: list[dict[str, Any]] = []
    bad_total = 0
    bad_key_counter: Counter[int] = Counter()
    total = 0

    for row in rows:
        key = to_int(key_fn(row))
        if key in ignore_values:
            continue
        total += 1
        if key not in valid_set:
            bad_total += 1
            bad_key_counter[key] += 1
            if len(bad) < sample_limit:
                bad.append({'key': key, 'row': row})

    passed = bad_total == 0
    return CheckResult(
        name=name,
        passed=passed,
        bad_total=bad_total,
        total=total,
        sample_bad=bad,
        bad_key_counts={str(k): v for k, v in sorted(bad_key_counter.items(), key=lambda kv: (-kv[1], kv[0]))},
        raw_bad_total=bad_total,
        suppressed_by_runtime_repair=0,
        suppressed_by_override=0,
    )


def load_runtime_repairs(source_dir: Path) -> dict[str, Any]:
    path = source_dir / 'reference_runtime_repairs.json'
    if not path.exists():
        return {}
    payload = load_json(path)
    if not isinstance(payload, dict):
        return {}
    return payload


def to_int_key_map(value: Any) -> dict[int, int]:
    if not isinstance(value, dict):
        return {}
    out: dict[int, int] = {}
    for k, v in value.items():
        key = to_int(k, 0)
        val = to_int(v, 0)
        if key <= 0 or val <= 0:
            continue
        out[key] = val
    return out


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    lines: list[str] = []
    lines.append('# Runtime Data Validation Report')
    lines.append('')
    lines.append(f"- Built At: {payload['builtAt']}")
    lines.append(f"- Source Dir: `{payload['sourceDir']}`")
    lines.append(f"- Total Checks: {payload['summary']['totalChecks']}")
    lines.append(f"- Passed: {payload['summary']['passedChecks']}")
    lines.append(f"- Failed: {payload['summary']['failedChecks']}")
    lines.append(f"- Invalid Refs (Effective): {payload['summary']['invalidRefsTotal']}")
    lines.append(f"- Invalid Refs (Raw): {payload['summary']['rawInvalidRefsTotal']}")
    lines.append(f"- Suppressed By Runtime Repairs: {payload['summary']['suppressedByRuntimeRepairsTotal']}")
    lines.append(f"- Suppressed By Overrides: {payload['summary']['suppressedByOverridesTotal']}")
    lines.append('')
    lines.append('## Check Results')
    lines.append('')
    lines.append('| Check | Status | Effective Invalid / Checked | Raw Invalid | Suppressed (Repair) | Suppressed (Override) |')
    lines.append('|---|---:|---:|---:|---:|---:|')
    for check in payload['checks']:
        status = 'PASS' if check['passed'] else 'FAIL'
        lines.append(
            f"| {check['name']} | {status} | {check['badTotal']} / {check['total']} | {check.get('rawBadTotal', check['badTotal'])} | {check.get('suppressedByRuntimeRepair', 0)} | {check.get('suppressedByOverride', 0)} |"
        )

    failed = [c for c in payload['checks'] if not c['passed']]
    if failed:
        lines.append('')
        lines.append('## Failed Samples')
        lines.append('')
        for check in failed:
            lines.append(f"### {check['name']}")
            lines.append('')
            if check.get('badKeyCounts'):
                lines.append('- Top invalid keys:')
                for key, count in list(check['badKeyCounts'].items())[:10]:
                    lines.append(f"  - `{key}` x {count}")
                lines.append('')
            for sample in check['sampleBad'][:10]:
                lines.append(f"- invalidKey=`{sample['key']}` row={json.dumps(sample['row'], ensure_ascii=False)}")
            lines.append('')

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(lines), encoding='utf-8')


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    source_dir = root / 'scripts' / 'gamedb'
    report_dir = source_dir / 'reports'
    runtime_dir = root / 'src' / 'data' / 'runtime'
    report_dir.mkdir(parents=True, exist_ok=True)

    tables: dict[str, list[dict[str, Any]]] = {}
    for json_file in sorted(source_dir.glob('*.json')):
        if json_file.name == '_index.json':
            continue
        payload = load_json(json_file)
        if isinstance(payload, list):
            tables[json_file.stem] = payload

    runtime_repairs = load_runtime_repairs(source_dir)

    zone_ids = {to_int(r.get('idx')) for r in tables.get('s_zone', [])}
    monster_types = {to_int(r.get('type')) for r in tables.get('s_monster', [])}
    mobitem_ids = {to_int(r.get('idx')) for r in tables.get('s_mobitem', [])}
    item_ids = {to_int(r.get('idx')) for r in tables.get('s_item', [])}
    npc_ids = {to_int(r.get('idx')) for r in tables.get('s_npc', [])}

    item_alias = to_int_key_map(runtime_repairs.get('itemAlias'))
    mobitem_alias = to_int_key_map(runtime_repairs.get('mobItemAlias'))
    npc_birth_zone_alias = to_int_key_map(runtime_repairs.get('npcBirthZoneAlias'))

    virtual_item_ids: set[int] = set()
    virtual_items_raw = runtime_repairs.get('virtualItems')
    if isinstance(virtual_items_raw, dict):
        for key in virtual_items_raw.keys():
            item_idx = to_int(key, 0)
            if item_idx > 0:
                virtual_item_ids.add(item_idx)

    synthetic_npc_ids: set[int] = set()
    synthetic_npcs_raw = runtime_repairs.get('syntheticNpcs')
    if isinstance(synthetic_npcs_raw, list):
        for row in synthetic_npcs_raw:
            if not isinstance(row, dict):
                continue
            npc_idx = to_int(row.get('idx'), 0)
            if npc_idx > 0:
                synthetic_npc_ids.add(npc_idx)

    item_ids_effective = set(item_ids) | virtual_item_ids
    mobitem_ids_effective = set(mobitem_ids) | set(mobitem_alias.values())
    zone_ids_effective = set(zone_ids) | set(npc_birth_zone_alias.values())
    npc_ids_effective = set(npc_ids) | synthetic_npc_ids

    def normalize_item_ref(value: Any) -> int:
        idx = to_int(value, 0)
        return item_alias.get(idx, idx)

    def normalize_mobitem_ref(value: Any) -> int:
        idx = to_int(value, 0)
        return mobitem_alias.get(idx, idx)

    def normalize_zone_ref(value: Any) -> int:
        idx = to_int(value, 0)
        return npc_birth_zone_alias.get(idx, idx)

    checks: list[CheckResult] = []

    def run_check(
        *,
        name: str,
        rows: Iterable[dict[str, Any]],
        key_fn,
        valid_set: set[int],
        ignore_values: set[int] | None = None,
        raw_key_fn=None,
        raw_valid_set: set[int] | None = None,
        raw_ignore_values: set[int] | None = None,
    ) -> CheckResult:
        base_valid = set(raw_valid_set if raw_valid_set is not None else valid_set)
        base_ignore = set(raw_ignore_values if raw_ignore_values is not None else ignore_values or set())
        raw_key = raw_key_fn if raw_key_fn is not None else key_fn

        raw = run_fk_check(
            name=name,
            rows=rows,
            key_fn=raw_key,
            valid_set=base_valid,
            ignore_values=base_ignore,
        )

        normalized_valid = set(valid_set)
        normalized_ignore = set(ignore_values or set())
        normalized = run_fk_check(
            name=name,
            rows=rows,
            key_fn=key_fn,
            valid_set=normalized_valid,
            ignore_values=normalized_ignore,
        )

        effective = normalized
        effective.raw_bad_total = raw.bad_total
        effective.suppressed_by_runtime_repair = max(0, raw.bad_total - normalized.bad_total)
        effective.suppressed_by_override = 0
        return effective

    checks.append(
        run_check(
            name='s_gate.from_zone_idx -> s_zone.idx',
            rows=tables.get('s_gate', []),
            key_fn=lambda r: r.get('from_zone_idx'),
            valid_set=zone_ids,
        )
    )
    checks.append(
        run_check(
            name='s_gate.dest_zone_idx -> s_zone.idx',
            rows=tables.get('s_gate', []),
            key_fn=lambda r: r.get('dest_zone_idx'),
            valid_set=zone_ids,
        )
    )

    # s_mob slot zone refs
    mob_rows = tables.get('s_mob', [])
    for slot in range(6):
        checks.append(
            run_check(
                name=f's_mob.zone_idx{slot} -> s_zone.idx',
                rows=mob_rows,
                key_fn=lambda r, s=slot: r.get(f'zone_idx{s}'),
                valid_set=zone_ids,
                ignore_values={0},
            )
        )

    checks.append(
        run_check(
            name='s_mob.monster_type -> s_monster.type',
            rows=mob_rows,
            key_fn=lambda r: r.get('monster_type'),
            valid_set=monster_types,
            ignore_values={0},
        )
    )
    checks.append(
        run_check(
            name='s_mob.mobitem_idx -> s_mobitem.idx',
            rows=mob_rows,
            key_fn=lambda r: normalize_mobitem_ref(r.get('mobitem_idx')),
            valid_set=mobitem_ids_effective,
            ignore_values={0},
            raw_key_fn=lambda r: r.get('mobitem_idx'),
            raw_valid_set=mobitem_ids,
            raw_ignore_values={0},
        )
    )

    # mix refs
    mix_rows = tables.get('s_mix', [])
    checks.append(
        run_check(
            name='s_mix.mainnum -> s_monster.type',
            rows=mix_rows,
            key_fn=lambda r: r.get('mainnum'),
            valid_set=monster_types,
        )
    )
    checks.append(
        run_check(
            name='s_mix.subnum -> s_monster.type',
            rows=mix_rows,
            key_fn=lambda r: r.get('subnum'),
            valid_set=monster_types,
        )
    )
    checks.append(
        run_check(
            name='s_mix.result -> s_monster.type',
            rows=mix_rows,
            key_fn=lambda r: r.get('result'),
            valid_set=monster_types,
        )
    )

    # npc refs
    checks.append(
        run_check(
            name='s_npc.birth_zone_idx -> s_zone.idx',
            rows=tables.get('s_npc', []),
            key_fn=lambda r: normalize_zone_ref(r.get('birth_zone_idx')),
            valid_set=zone_ids_effective,
            ignore_values={0},
            raw_key_fn=lambda r: r.get('birth_zone_idx'),
            raw_valid_set=zone_ids,
            raw_ignore_values={0},
        )
    )
    checks.append(
        run_check(
            name='s_npc_sale.npc_idx -> s_npc.idx',
            rows=tables.get('s_npc_sale', []),
            key_fn=lambda r: r.get('npc_idx'),
            valid_set=npc_ids_effective,
            ignore_values={0},
            raw_valid_set=npc_ids,
            raw_ignore_values={0},
        )
    )
    checks.append(
        run_check(
            name='s_npc_sale.sale_idx -> s_item.idx',
            rows=tables.get('s_npc_sale', []),
            key_fn=lambda r: normalize_item_ref(r.get('sale_idx')),
            valid_set=item_ids_effective,
            ignore_values={0},
            raw_key_fn=lambda r: r.get('sale_idx'),
            raw_valid_set=item_ids,
            raw_ignore_values={0},
        )
    )

    # mob drop item refs
    for slot in range(10):
        checks.append(
            run_check(
                name=f's_mobitem.item_idx{slot} -> s_item.idx',
                rows=tables.get('s_mobitem', []),
                key_fn=lambda r, s=slot: normalize_item_ref(r.get(f'item_idx{s}')),
                valid_set=item_ids_effective,
                ignore_values={0, 9999},
                raw_key_fn=lambda r, s=slot: r.get(f'item_idx{s}'),
                raw_valid_set=item_ids,
                raw_ignore_values={0, 9999},
            )
        )

    # production item refs
    prod_rows = tables.get('s_Production', [])
    checks.append(
        run_check(
            name='s_Production.result_idx -> s_item.idx',
            rows=prod_rows,
            key_fn=lambda r: normalize_item_ref(r.get('result_idx')),
            valid_set=item_ids_effective,
            ignore_values={0},
            raw_key_fn=lambda r: r.get('result_idx'),
            raw_valid_set=item_ids,
            raw_ignore_values={0},
        )
    )
    for slot in range(1, 11):
        checks.append(
            run_check(
                name=f's_Production.stuff_idx{slot} -> s_item.idx',
                rows=prod_rows,
                key_fn=lambda r, s=slot: normalize_item_ref(r.get(f'stuff_idx{s}')),
                valid_set=item_ids_effective,
                ignore_values={0},
                raw_key_fn=lambda r, s=slot: r.get(f'stuff_idx{s}'),
                raw_valid_set=item_ids,
                raw_ignore_values={0},
            )
        )

    # event drop refs
    event_drop_rows = tables.get('s_event_drop', [])
    for slot in range(1, 11):
        checks.append(
            run_check(
                name=f's_event_drop.item_{slot:02d} -> s_item.idx',
                rows=event_drop_rows,
                key_fn=lambda r, s=slot: normalize_item_ref(r.get(f'item_{s:02d}')),
                valid_set=item_ids_effective,
                ignore_values={0},
                raw_key_fn=lambda r, s=slot: r.get(f'item_{s:02d}'),
                raw_valid_set=item_ids,
                raw_ignore_values={0},
            )
        )

    checks.append(
        run_check(
            name='s_hero.birth_zone_idx -> s_zone.idx',
            rows=tables.get('s_hero', []),
            key_fn=lambda r: r.get('birth_zone_idx'),
            valid_set=zone_ids,
            ignore_values={0},
        )
    )

    checks.append(
        run_check(
            name='s_CastleWarInfo.zone_idx -> s_zone.idx',
            rows=tables.get('s_CastleWarInfo', []),
            key_fn=lambda r: r.get('zone_idx'),
            valid_set=zone_ids,
            ignore_values={0},
        )
    )

    checks.append(
        run_check(
            name='s_CastleWarInfo.npc_idx -> s_npc.idx',
            rows=tables.get('s_CastleWarInfo', []),
            key_fn=lambda r: r.get('npc_idx'),
            valid_set=npc_ids,
            ignore_values={0},
        )
    )

    checks.append(
        run_check(
            name='u_item.item_idx -> s_item.idx',
            rows=tables.get('u_item', []),
            key_fn=lambda r: normalize_item_ref(r.get('item_idx')),
            valid_set=item_ids_effective,
            ignore_values={0},
            raw_key_fn=lambda r: r.get('item_idx'),
            raw_valid_set=item_ids,
            raw_ignore_values={0},
        )
    )

    checks.append(
        run_check(
            name='u_hench_1.monster_type -> s_monster.type',
            rows=tables.get('u_hench_1', []),
            key_fn=lambda r: r.get('monster_type'),
            valid_set=monster_types,
            ignore_values={0},
        )
    )

    check_payloads = [
        {
            'name': c.name,
            'passed': c.passed,
            'badTotal': c.bad_total,
            'total': c.total,
            'sampleBad': c.sample_bad,
            'badKeyCounts': c.bad_key_counts,
            'rawBadTotal': c.raw_bad_total,
            'suppressedByRuntimeRepair': c.suppressed_by_runtime_repair,
            'suppressedByOverride': c.suppressed_by_override,
        }
        for c in checks
    ]

    passed = sum(1 for c in checks if c.passed)
    failed = len(checks) - passed
    invalid_refs_total = sum(c.bad_total for c in checks)
    raw_invalid_refs_total = sum(c.raw_bad_total for c in checks)
    suppressed_runtime_repair_total = sum(c.suppressed_by_runtime_repair for c in checks)
    suppressed_total = sum(c.suppressed_by_override for c in checks)

    report_payload = {
        'builtAt': now_iso(),
        'sourceDir': str(source_dir),
        'summary': {
            'totalChecks': len(checks),
            'passedChecks': passed,
            'failedChecks': failed,
            'invalidRefsTotal': invalid_refs_total,
            'rawInvalidRefsTotal': raw_invalid_refs_total,
            'suppressedByRuntimeRepairsTotal': suppressed_runtime_repair_total,
            'suppressedByOverridesTotal': suppressed_total,
        },
        'overridesApplied': {},
        'runtimeRepairsApplied': runtime_repairs,
        'checks': check_payloads,
    }

    json_path = report_dir / 'validation_report.json'
    md_path = report_dir / 'validation_report.md'
    write_json(json_path, report_payload)
    write_markdown(md_path, report_payload)

    # Publish a lightweight health snapshot for in-game readonly diagnostics.
    manifest_path = runtime_dir / '_manifest.json'
    manifest_payload: dict[str, Any] = {}
    if manifest_path.exists():
        loaded_manifest = load_json(manifest_path)
        if isinstance(loaded_manifest, dict):
            manifest_payload = loaded_manifest
    runtime_outputs = manifest_payload.get('outputs', {}) if isinstance(manifest_payload, dict) else {}
    if not isinstance(runtime_outputs, dict):
        runtime_outputs = {}

    runtime_stats: dict[str, Any] = {}
    for output_name, payload in runtime_outputs.items():
        if not isinstance(payload, dict):
            continue
        stats = payload.get('stats', {})
        if isinstance(stats, dict):
            runtime_stats[str(output_name)] = stats

    data_health_payload = {
        'builtAt': now_iso(),
        'validation': {
            **report_payload['summary'],
            'reportBuiltAt': report_payload['builtAt'],
        },
        'overridesApplied': {},
        'runtimeRepairsApplied': runtime_repairs,
        'runtime': {
            'manifestBuiltAt': manifest_payload.get('builtAt') if isinstance(manifest_payload, dict) else None,
            'sourceTableCount': manifest_payload.get('sourceTableCount') if isinstance(manifest_payload, dict) else 0,
            'sourceDigest': manifest_payload.get('sourceDigest') if isinstance(manifest_payload, dict) else '',
            'unassignedSourceTables': manifest_payload.get('unassignedSourceTables', []) if isinstance(manifest_payload, dict) else [],
            'assignedButMissingSourceTables': manifest_payload.get('assignedButMissingSourceTables', []) if isinstance(manifest_payload, dict) else [],
            'outputs': runtime_stats,
        },
    }
    write_json(runtime_dir / 'data.health.json', data_health_payload)

    print(f'[validate_relations] checks={len(checks)} passed={passed} failed={failed}')
    print(f'[validate_relations] json={json_path}')
    print(f'[validate_relations] md={md_path}')


if __name__ == '__main__':
    main()
