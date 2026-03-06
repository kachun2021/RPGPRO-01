from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    lines: list[str] = []
    lines.append('# GameDB Repair Audit Report')
    lines.append('')
    lines.append(f"- Built At: {payload['builtAt']}")
    lines.append(f"- Source Dir: `{payload['sourceDir']}`")
    lines.append(f"- Name-Like Fields Scanned: {payload['summary']['nameFieldsScanned']}")
    lines.append(f"- Question-Mark Name Hits: {payload['summary']['questionNameHits']}")
    lines.append(f"- Repairable Hits: {payload['summary']['repairableHits']}")
    lines.append(f"- Violations (blocking): {payload['summary']['violations']}")
    lines.append('')

    if payload['violations']:
        lines.append('## Violations')
        lines.append('')
        lines.append('| Table | Row | Field | Value | Reason |')
        lines.append('|---|---:|---|---|---|')
        for row in payload['violations'][:120]:
            value = str(row.get('value', '')).replace('|', '\\|')
            reason = str(row.get('reason', '')).replace('|', '\\|')
            lines.append(
                f"| {row.get('table', '')} | {row.get('row', '')} | {row.get('field', '')} | {value} | {reason} |"
            )
        lines.append('')

    lines.append('## Repairable Hits')
    lines.append('')
    lines.append('| Table | Row | Field | Value | Repair Strategy |')
    lines.append('|---|---:|---|---|---|')
    for row in payload['repairable'][:120]:
        value = str(row.get('value', '')).replace('|', '\\|')
        strategy = str(row.get('strategy', '')).replace('|', '\\|')
        lines.append(
            f"| {row.get('table', '')} | {row.get('row', '')} | {row.get('field', '')} | {value} | {strategy} |"
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(lines), encoding='utf-8')


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


def to_int_text_map(value: Any) -> dict[int, str]:
    if not isinstance(value, dict):
        return {}
    out: dict[int, str] = {}
    for k, v in value.items():
        key = to_int(k, 0)
        text = str(v or '').strip()
        if key <= 0 or not text:
            continue
        out[key] = text
    return out


def sanitize_display_name(value: Any, fallback: str = '') -> str:
    text = str(value or '').strip()
    if not text:
        return fallback
    if any(ord(ch) < 32 for ch in text):
        return fallback or text
    if '?' in text:
        return fallback or text
    return text


def is_name_key(key: str) -> bool:
    key_l = key.lower()
    return 'name' in key_l or key_l == 'shuoming'


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    source_dir = root / 'scripts' / 'gamedb'
    report_dir = source_dir / 'reports'
    report_dir.mkdir(parents=True, exist_ok=True)

    repairs = {}
    repairs_path = source_dir / 'reference_runtime_repairs.json'
    if repairs_path.exists():
        loaded = load_json(repairs_path)
        if isinstance(loaded, dict):
            repairs = loaded

    item_name_overrides = to_int_text_map(repairs.get('itemNameOverrides'))

    items = load_json(source_dir / 's_item.json')
    item_rows: list[dict[str, Any]] = items if isinstance(items, list) else []
    item_name_by_idx: dict[int, str] = {}
    for row in item_rows:
        if not isinstance(row, dict):
            continue
        idx = to_int(row.get('idx'))
        name = str(row.get('name', '')).strip()
        if idx in item_name_overrides:
            name = item_name_overrides[idx]
        item_name_by_idx[idx] = name

    question_hits = 0
    name_fields_scanned = 0
    repairable: list[dict[str, Any]] = []
    violations: list[dict[str, Any]] = []

    for table_path in sorted(source_dir.glob('*.json')):
        if table_path.name in {'_index.json', 'reference_runtime_repairs.json'}:
            continue
        payload = load_json(table_path)
        if not isinstance(payload, list):
            continue
        table = table_path.stem

        for row_idx, row in enumerate(payload):
            if not isinstance(row, dict):
                continue
            row_id = to_int(row.get('idx'), row_idx)
            for key, value in row.items():
                if not is_name_key(key):
                    continue
                if not isinstance(value, str):
                    continue
                name_fields_scanned += 1
                if '?' not in value:
                    continue
                question_hits += 1

                if table == 's_item' and key == 'name':
                    item_idx = to_int(row.get('idx'))
                    repaired_name = item_name_overrides.get(item_idx, '')
                    if repaired_name and '?' not in repaired_name:
                        repairable.append(
                            {
                                'table': table,
                                'row': row_id,
                                'field': key,
                                'value': value,
                                'strategy': f'itemNameOverrides[{item_idx}]',
                            }
                        )
                        continue
                    violations.append(
                        {
                            'table': table,
                            'row': row_id,
                            'field': key,
                            'value': value,
                            'reason': 'missing itemNameOverrides for source item name',
                        }
                    )
                    continue

                if table == 's_ItemEffectiveData' and key == 'name':
                    item_idx = to_int(row.get('item_idx'))
                    linked_name = sanitize_display_name(item_name_by_idx.get(item_idx, ''), '')
                    if linked_name and '?' not in linked_name:
                        repairable.append(
                            {
                                'table': table,
                                'row': row_id,
                                'field': key,
                                'value': value,
                                'strategy': f'link by item_idx={item_idx}',
                            }
                        )
                        continue
                    violations.append(
                        {
                            'table': table,
                            'row': row_id,
                            'field': key,
                            'value': value,
                            'reason': 'itemEffectiveData name not recoverable from s_item mapping',
                        }
                    )
                    continue

                violations.append(
                    {
                        'table': table,
                        'row': row_id,
                        'field': key,
                        'value': value,
                        'reason': 'unhandled question-mark name in source data',
                    }
                )

    report_payload = {
        'builtAt': now_iso(),
        'sourceDir': str(source_dir),
        'summary': {
            'nameFieldsScanned': name_fields_scanned,
            'questionNameHits': question_hits,
            'repairableHits': len(repairable),
            'violations': len(violations),
        },
        'repairSource': {
            'file': str(repairs_path),
            'itemNameOverrides': len(item_name_overrides),
        },
        'repairable': repairable,
        'violations': violations,
    }

    json_path = report_dir / 'repair_audit_report.json'
    md_path = report_dir / 'repair_audit_report.md'
    write_json(json_path, report_payload)
    write_markdown(md_path, report_payload)

    print(
        f"[repair_audit] scanned={name_fields_scanned} question_hits={question_hits} "
        f"repairable={len(repairable)} violations={len(violations)}"
    )
    print(f"[repair_audit] json={json_path}")
    print(f"[repair_audit] md={md_path}")

    if violations:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
