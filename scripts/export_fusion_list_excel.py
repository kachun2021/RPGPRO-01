from __future__ import annotations

import argparse
import json
import os
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, Tuple
from zipfile import BadZipFile, ZipFile

CELL_REF_RE = re.compile(r"([A-Z]+)(\d+)")
NOT_FUSIBLE_TOKENS = {"-", "无法合成", "不能合成", "無法合成", "不能合成"}
SUPPORTED_EXTENSIONS = {".xlsx", ".xlsm"}


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).replace("\xa0", " ").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _parse_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    text = _clean_text(value)
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def _to_positive_int(value: Any) -> int | None:
    number = _parse_int(value)
    if number is None or number <= 0:
        return None
    return number


def _is_formula(formula: str) -> bool:
    token = _clean_text(formula)
    if not token:
        return False
    return token not in NOT_FUSIBLE_TOKENS


def _normalize_series(header: str) -> str:
    raw = _clean_text(header)
    if any(k in raw for k in ("龍", "龙")):
        return "龙系"
    if any(k in raw for k in ("惡魔", "恶魔")):
        return "恶魔系"
    if any(k in raw for k in ("獸", "兽")):
        return "兽系"
    if any(k in raw for k in ("鳥", "鸟")):
        return "鸟系"
    if any(k in raw for k in ("蟲", "虫")):
        return "虫系"
    if "植物" in raw:
        return "植物系"
    if "神秘" in raw:
        return "神秘系"
    if any(k in raw for k in ("機械", "机械", "金屬", "金属")):
        return "机械系"
    return "未知系"


def _read_mdb_sibling_list_file() -> Path | None:
    repo_root = Path(__file__).resolve().parents[1]
    mix_json = repo_root / "src" / "data" / "fusion" / "mixmaster_recipes.json"
    if not mix_json.exists():
        return None

    try:
        payload = json.loads(mix_json.read_text(encoding="utf-8"))
    except Exception:
        return None

    mdb_path = payload.get("meta", {}).get("mdbPath")
    if not isinstance(mdb_path, str) or not mdb_path.strip():
        return None

    base_dir = Path(mdb_path).parent
    for name in ("LIST.xlsm", "LIST.xlsx"):
        candidate = base_dir / name
        if candidate.exists():
            return candidate
    return None


def _find_default_excel() -> Path:
    env_path = os.getenv("FUSION_LIST_EXCEL", "").strip()
    if env_path:
        candidate = Path(env_path)
        if candidate.exists():
            return candidate
        raise FileNotFoundError(f"FUSION_LIST_EXCEL does not exist: {candidate}")

    from_mdb = _read_mdb_sibling_list_file()
    if from_mdb:
        return from_mdb

    home = Path.home()
    common_dirs = [
        home / "OneDrive" / "桌面" / "白嫖猎人MM[合成器]",
        home / "OneDrive" / "Desktop" / "白嫖猎人MM[合成器]",
        home / "桌面" / "白嫖猎人MM[合成器]",
        home / "Desktop" / "白嫖猎人MM[合成器]",
    ]
    for folder in common_dirs:
        for name in ("LIST.xlsm", "LIST.xlsx"):
            candidate = folder / name
            if candidate.exists():
                return candidate

    raise FileNotFoundError(
        "Cannot auto-locate LIST workbook. "
        "Pass --excel <LIST.xlsm|LIST.xlsx> or set FUSION_LIST_EXCEL."
    )


def _tag_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _col_to_index(ref: str) -> int:
    match = CELL_REF_RE.match(ref)
    if not match:
        return 0
    letters = match.group(1)
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch) - 64)
    return idx


def _sheet_xml_path(zip_file: ZipFile) -> str:
    names = zip_file.namelist()
    default = "xl/worksheets/sheet1.xml"
    if default in names:
        return default
    sheets = sorted(
        name for name in names if name.startswith("xl/worksheets/") and name.endswith(".xml")
    )
    if not sheets:
        raise FileNotFoundError("Worksheet xml not found in workbook")
    return sheets[0]


def _load_shared_strings(zip_file: ZipFile) -> list[str]:
    path = "xl/sharedStrings.xml"
    if path not in zip_file.namelist():
        return []

    shared: list[str] = []
    with zip_file.open(path) as fh:
        context = ET.iterparse(fh, events=("start", "end"))
        in_item = False
        text_parts: list[str] = []
        for event, elem in context:
            tag = _tag_name(elem.tag)
            if event == "start" and tag == "si":
                in_item = True
                text_parts = []
            elif event == "end" and tag == "t" and in_item:
                text_parts.append(elem.text or "")
            elif event == "end" and tag == "si":
                shared.append("".join(text_parts))
                in_item = False
                text_parts = []
            if event == "end":
                elem.clear()
    return shared


def _iter_sheet_rows(
    zip_file: ZipFile, sheet_path: str, shared: list[str]
) -> Iterator[Tuple[int, Dict[int, str]]]:
    with zip_file.open(sheet_path) as fh:
        context = ET.iterparse(fh, events=("start", "end"))
        row_idx = 0
        row_values: Dict[int, str] = {}

        for event, elem in context:
            tag = _tag_name(elem.tag)
            if event == "start" and tag == "row":
                row_idx = _parse_int(elem.attrib.get("r")) or 0
                row_values = {}
                continue

            if event == "end" and tag == "c":
                col_idx = _col_to_index(elem.attrib.get("r", ""))
                if col_idx <= 0:
                    elem.clear()
                    continue

                cell_type = elem.attrib.get("t")
                value_text = ""
                if cell_type == "inlineStr":
                    value_text = "".join(
                        child.text or "" for child in elem.iter() if _tag_name(child.tag) == "t"
                    )
                else:
                    v_elem = next((child for child in elem if _tag_name(child.tag) == "v"), None)
                    if v_elem is not None and v_elem.text is not None:
                        if cell_type == "s":
                            ss_idx = _parse_int(v_elem.text)
                            if ss_idx is not None and 0 <= ss_idx < len(shared):
                                value_text = shared[ss_idx]
                        else:
                            value_text = v_elem.text

                if value_text:
                    row_values[col_idx] = value_text
                elem.clear()
                continue

            if event == "end" and tag == "row":
                if row_idx > 0:
                    yield row_idx, row_values
                elem.clear()


def export_excel_list(excel_path: Path, out_file: Path) -> None:
    if excel_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported excel format: {excel_path.suffix}. Use .xlsm or .xlsx.")

    block_starts = [1, 7, 13, 19, 25, 31, 37, 43]
    by_name: Dict[str, Dict[str, Any]] = {}
    headers: Dict[int, str] = {}

    try:
        workbook = ZipFile(excel_path, "r")
    except BadZipFile as err:
        raise ValueError(f"Cannot read workbook as .xlsx/.xlsm: {excel_path}") from err

    with workbook as zip_file:
        shared = _load_shared_strings(zip_file)
        sheet_path = _sheet_xml_path(zip_file)

        for row_idx, row in _iter_sheet_rows(zip_file, sheet_path, shared):
            if row_idx == 1:
                headers = row
                continue
            if row_idx < 3:
                continue

            for start_col in block_starts:
                series = _normalize_series(_clean_text(headers.get(start_col, "")))
                name = _clean_text(row.get(start_col + 1))
                level = _to_positive_int(row.get(start_col + 4))
                if not name or level is None:
                    continue

                formula_a = _clean_text(row.get(start_col + 2))
                formula_b = _clean_text(row.get(start_col + 3))
                fusible = _is_formula(formula_a) or _is_formula(formula_b)

                existing = by_name.get(name)
                if existing is None:
                    by_name[name] = {
                        "name": name,
                        "level": level,
                        "series": series,
                        "fusible": fusible,
                    }
                else:
                    existing["level"] = max(int(existing["level"]), level)
                    existing["fusible"] = bool(existing["fusible"]) or fusible
                    if existing.get("series") in {"", "未知系"} and series not in {"", "未知系"}:
                        existing["series"] = series

    pets = sorted(by_name.values(), key=lambda item: (int(item["level"]), item["name"]))
    payload = {
        "meta": {
            "source": excel_path.name,
            "excelPath": str(excel_path),
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "petCount": len(pets),
        },
        "pets": pets,
    }

    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Exported {len(pets)} pets to {out_file}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel", type=str, default="")
    parser.add_argument("--out", type=str, default="src/data/fusion/list_pets.json")
    args = parser.parse_args()

    excel_path = Path(args.excel).expanduser() if args.excel else _find_default_excel()
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel not found: {excel_path}")

    export_excel_list(excel_path, Path(args.out))


if __name__ == "__main__":
    main()
