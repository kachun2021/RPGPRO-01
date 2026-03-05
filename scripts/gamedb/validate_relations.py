from __future__ import annotations

import json
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
    bad_count: int
    total: int
    sample_bad: list[dict[str, Any]]


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
    total = 0

    for row in rows:
        key = to_int(key_fn(row))
        if key in ignore_values:
            continue
        total += 1
        if key not in valid_set:
            if len(bad) < sample_limit:
                bad.append({'key': key, 'row': row})

    bad_count = len(bad)
    passed = bad_count == 0
    return CheckResult(name=name, passed=passed, bad_count=bad_count, total=total, sample_bad=bad)


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
    lines.append('')
    lines.append('## Check Results')
    lines.append('')
    lines.append('| Check | Status | Invalid / Checked |')
    lines.append('|---|---:|---:|')
    for check in payload['checks']:
        status = 'PASS' if check['passed'] else 'FAIL'
        lines.append(f"| {check['name']} | {status} | {check['badCount']} / {check['total']} |")

    failed = [c for c in payload['checks'] if not c['passed']]
    if failed:
        lines.append('')
        lines.append('## Failed Samples')
        lines.append('')
        for check in failed:
            lines.append(f"### {check['name']}")
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
    report_dir.mkdir(parents=True, exist_ok=True)

    tables: dict[str, list[dict[str, Any]]] = {}
    for json_file in sorted(source_dir.glob('*.json')):
        if json_file.name == '_index.json':
            continue
        payload = load_json(json_file)
        if isinstance(payload, list):
            tables[json_file.stem] = payload

    zone_ids = {to_int(r.get('idx')) for r in tables.get('s_zone', [])}
    monster_types = {to_int(r.get('type')) for r in tables.get('s_monster', [])}
    mobitem_ids = {to_int(r.get('idx')) for r in tables.get('s_mobitem', [])}
    item_ids = {to_int(r.get('idx')) for r in tables.get('s_item', [])}
    npc_ids = {to_int(r.get('idx')) for r in tables.get('s_npc', [])}

    checks: list[CheckResult] = []

    checks.append(
        run_fk_check(
            name='s_gate.from_zone_idx -> s_zone.idx',
            rows=tables.get('s_gate', []),
            key_fn=lambda r: r.get('from_zone_idx'),
            valid_set=zone_ids,
        )
    )
    checks.append(
        run_fk_check(
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
            run_fk_check(
                name=f's_mob.zone_idx{slot} -> s_zone.idx',
                rows=mob_rows,
                key_fn=lambda r, s=slot: r.get(f'zone_idx{s}'),
                valid_set=zone_ids,
                ignore_values={0},
            )
        )

    checks.append(
        run_fk_check(
            name='s_mob.monster_type -> s_monster.type',
            rows=mob_rows,
            key_fn=lambda r: r.get('monster_type'),
            valid_set=monster_types,
            ignore_values={0},
        )
    )
    checks.append(
        run_fk_check(
            name='s_mob.mobitem_idx -> s_mobitem.idx',
            rows=mob_rows,
            key_fn=lambda r: r.get('mobitem_idx'),
            valid_set=mobitem_ids,
            ignore_values={0},
        )
    )

    # mix refs
    mix_rows = tables.get('s_mix', [])
    checks.append(
        run_fk_check(
            name='s_mix.mainnum -> s_monster.type',
            rows=mix_rows,
            key_fn=lambda r: r.get('mainnum'),
            valid_set=monster_types,
        )
    )
    checks.append(
        run_fk_check(
            name='s_mix.subnum -> s_monster.type',
            rows=mix_rows,
            key_fn=lambda r: r.get('subnum'),
            valid_set=monster_types,
        )
    )
    checks.append(
        run_fk_check(
            name='s_mix.result -> s_monster.type',
            rows=mix_rows,
            key_fn=lambda r: r.get('result'),
            valid_set=monster_types,
        )
    )

    # npc refs
    checks.append(
        run_fk_check(
            name='s_npc.birth_zone_idx -> s_zone.idx',
            rows=tables.get('s_npc', []),
            key_fn=lambda r: r.get('birth_zone_idx'),
            valid_set=zone_ids,
            ignore_values={0},
        )
    )
    checks.append(
        run_fk_check(
            name='s_npc_sale.npc_idx -> s_npc.idx',
            rows=tables.get('s_npc_sale', []),
            key_fn=lambda r: r.get('npc_idx'),
            valid_set=npc_ids,
            ignore_values={0},
        )
    )
    checks.append(
        run_fk_check(
            name='s_npc_sale.sale_idx -> s_item.idx',
            rows=tables.get('s_npc_sale', []),
            key_fn=lambda r: r.get('sale_idx'),
            valid_set=item_ids,
            ignore_values={0},
        )
    )

    # mob drop item refs
    for slot in range(10):
        checks.append(
            run_fk_check(
                name=f's_mobitem.item_idx{slot} -> s_item.idx',
                rows=tables.get('s_mobitem', []),
                key_fn=lambda r, s=slot: r.get(f'item_idx{s}'),
                valid_set=item_ids,
                ignore_values={0, 9999},
            )
        )

    # production item refs
    prod_rows = tables.get('s_Production', [])
    checks.append(
        run_fk_check(
            name='s_Production.result_idx -> s_item.idx',
            rows=prod_rows,
            key_fn=lambda r: r.get('result_idx'),
            valid_set=item_ids,
            ignore_values={0},
        )
    )
    for slot in range(1, 11):
        checks.append(
            run_fk_check(
                name=f's_Production.stuff_idx{slot} -> s_item.idx',
                rows=prod_rows,
                key_fn=lambda r, s=slot: r.get(f'stuff_idx{s}'),
                valid_set=item_ids,
                ignore_values={0},
            )
        )

    # event drop refs
    event_drop_rows = tables.get('s_event_drop', [])
    for slot in range(1, 11):
        checks.append(
            run_fk_check(
                name=f's_event_drop.item_{slot:02d} -> s_item.idx',
                rows=event_drop_rows,
                key_fn=lambda r, s=slot: r.get(f'item_{s:02d}'),
                valid_set=item_ids,
                ignore_values={0},
            )
        )

    checks.append(
        run_fk_check(
            name='s_hero.birth_zone_idx -> s_zone.idx',
            rows=tables.get('s_hero', []),
            key_fn=lambda r: r.get('birth_zone_idx'),
            valid_set=zone_ids,
            ignore_values={0},
        )
    )

    checks.append(
        run_fk_check(
            name='s_CastleWarInfo.zone_idx -> s_zone.idx',
            rows=tables.get('s_CastleWarInfo', []),
            key_fn=lambda r: r.get('zone_idx'),
            valid_set=zone_ids,
            ignore_values={0},
        )
    )

    checks.append(
        run_fk_check(
            name='s_CastleWarInfo.npc_idx -> s_npc.idx',
            rows=tables.get('s_CastleWarInfo', []),
            key_fn=lambda r: r.get('npc_idx'),
            valid_set=npc_ids,
            ignore_values={0},
        )
    )

    checks.append(
        run_fk_check(
            name='u_item.item_idx -> s_item.idx',
            rows=tables.get('u_item', []),
            key_fn=lambda r: r.get('item_idx'),
            valid_set=item_ids,
            ignore_values={0},
        )
    )

    checks.append(
        run_fk_check(
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
            'badCount': c.bad_count,
            'total': c.total,
            'sampleBad': c.sample_bad,
        }
        for c in checks
    ]

    passed = sum(1 for c in checks if c.passed)
    failed = len(checks) - passed

    report_payload = {
        'builtAt': now_iso(),
        'sourceDir': str(source_dir),
        'summary': {
            'totalChecks': len(checks),
            'passedChecks': passed,
            'failedChecks': failed,
        },
        'checks': check_payloads,
    }

    json_path = report_dir / 'validation_report.json'
    md_path = report_dir / 'validation_report.md'
    write_json(json_path, report_payload)
    write_markdown(md_path, report_payload)

    print(f'[validate_relations] checks={len(checks)} passed={passed} failed={failed}')
    print(f'[validate_relations] json={json_path}')
    print(f'[validate_relations] md={md_path}')


if __name__ == '__main__':
    main()
