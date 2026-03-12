from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from pathlib import Path
from typing import Callable

from playwright.sync_api import Browser, BrowserContext, Page, TimeoutError as PlaywrightTimeoutError, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_URL = "http://127.0.0.1:3000/?autotest=1"
OUTPUT_DIR = ROOT / "artifacts" / "ui-audit"


VIEWPORTS = [
    {"name": "landscape-large", "width": 932, "height": 430},
    {"name": "landscape-compact", "width": 667, "height": 375},
]


PANEL_SELECTORS = {
    "hud": None,
    "quest": "#quest-panel",
    "inventory": "#inventory-panel",
    "map": "#world-map-panel",
    "pet": "#petPanel",
    "book": "#encyclopediaPanel",
    "shop": "#shop-panel",
    "character": "#char-panel",
    "skill": "#skill-panel",
    "settings": "#sys-panel",
    "afk": "#afk-panel",
    "resonance": "#resonance-panel",
    "fusion": "#fusionPanel",
    "community": "#community-panel",
    "dialogue": "#dialogue-panel",
    "revival": "#revivalPanel",
}


VISIBLE_IDS = [
    ("identity", "#hudIdentity"),
    ("focus_banner", ".hud-focus-banner"),
    ("minimap", ".minimap-root"),
    ("quest_tracker", ".quest-tracker"),
    ("top_right", ".hud-top-right"),
    ("skillbar", ".skillbar-root"),
    ("auto_controls", ".auto-grind-controls"),
    ("nav", "#hudNav"),
    ("quest_panel", "#quest-panel"),
    ("inventory_panel", "#inventory-panel"),
    ("map_panel", "#world-map-panel"),
    ("pet_panel", "#petPanel"),
    ("book_panel", "#encyclopediaPanel"),
    ("shop_panel", "#shop-panel"),
    ("character_panel", "#char-panel"),
    ("skill_panel", "#skill-panel"),
    ("settings_panel", "#sys-panel"),
    ("afk_panel", "#afk-panel"),
    ("resonance_panel", "#resonance-panel"),
    ("fusion_panel", "#fusionPanel"),
    ("community_panel", "#community-panel"),
    ("dialogue_panel", "#dialogue-panel"),
    ("revival_panel", "#revivalPanel"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Capture mobile landscape UI screenshots for all major panels.")
    parser.add_argument("--url", default=DEFAULT_URL, help="App URL to audit.")
    parser.add_argument("--output-dir", default=str(OUTPUT_DIR), help="Directory for screenshots and reports.")
    parser.add_argument("--keep", action="store_true", help="Keep existing output instead of resetting it.")
    return parser.parse_args()


def wait_for_play_mode(page: Page, timeout_ms: int = 30000) -> None:
    deadline = time.time() + (timeout_ms / 1000.0)
    last_raw = None
    while time.time() < deadline:
        try:
            raw = page.evaluate(
                """() => {
                    if (typeof window.render_game_to_text !== 'function') return null;
                    return window.render_game_to_text();
                }"""
            )
        except Exception:
            raw = None
        last_raw = raw
        if raw:
            payload = json.loads(raw)
            if payload.get("mode") == "play":
                return
        page.wait_for_timeout(250)
    raise RuntimeError(f"Timed out waiting for play mode. Last state: {last_raw}")


def click_dom(page: Page, selector: str) -> None:
    page.evaluate(
        """(targetSelector) => {
            const node = document.querySelector(targetSelector);
            if (!(node instanceof HTMLElement)) {
                throw new Error(`Missing element: ${targetSelector}`);
            }
            node.click();
        }""",
        selector,
    )


def wait_for_visible(page: Page, selector: str | None, timeout_ms: int = 12000) -> None:
    if not selector:
        page.wait_for_timeout(700)
        return
    page.locator(selector).wait_for(state="visible", timeout=timeout_ms)
    page.wait_for_timeout(500)


def collect_layout_report(page: Page, capture_name: str, selector: str | None) -> dict:
    return page.evaluate(
        """(payload) => {
            const { captureName, targetSelector, trackedSelectors } = payload;
            const vw = window.innerWidth || 0;
            const vh = window.innerHeight || 0;

            const rectFor = (element) => {
                const rect = element.getBoundingClientRect();
                return {
                    left: Number(rect.left.toFixed(2)),
                    top: Number(rect.top.toFixed(2)),
                    right: Number(rect.right.toFixed(2)),
                    bottom: Number(rect.bottom.toFixed(2)),
                    width: Number(rect.width.toFixed(2)),
                    height: Number(rect.height.toFixed(2)),
                };
            };

            const overflowFor = (rect) => ({
                left: Math.max(0, 0 - rect.left),
                top: Math.max(0, 0 - rect.top),
                right: Math.max(0, rect.right - vw),
                bottom: Math.max(0, rect.bottom - vh),
            });

            const visibleNodes = [];
            for (const [name, selector] of trackedSelectors) {
                const node = document.querySelector(selector);
                if (!(node instanceof HTMLElement)) continue;
                const style = window.getComputedStyle(node);
                const rect = node.getBoundingClientRect();
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
                if (rect.width <= 2 || rect.height <= 2) continue;
                const normalized = rectFor(node);
                visibleNodes.push({
                    name,
                    selector,
                    rect: normalized,
                    overflow: overflowFor(normalized),
                });
            }

            const overlaps = [];
            for (let i = 0; i < visibleNodes.length; i += 1) {
                for (let j = i + 1; j < visibleNodes.length; j += 1) {
                    const a = visibleNodes[i];
                    const b = visibleNodes[j];
                    const left = Math.max(a.rect.left, b.rect.left);
                    const top = Math.max(a.rect.top, b.rect.top);
                    const right = Math.min(a.rect.right, b.rect.right);
                    const bottom = Math.min(a.rect.bottom, b.rect.bottom);
                    const width = Math.max(0, right - left);
                    const height = Math.max(0, bottom - top);
                    const area = Number((width * height).toFixed(2));
                    if (area < 600) continue;
                    overlaps.push({
                        a: a.name,
                        b: b.name,
                        area,
                    });
                }
            }

            const rawState = typeof window.render_game_to_text === 'function' ? window.render_game_to_text() : null;
            const state = rawState ? JSON.parse(rawState) : null;
            const targetNode = targetSelector ? document.querySelector(targetSelector) : null;
            const target = targetNode instanceof HTMLElement ? {
                rect: rectFor(targetNode),
                overflow: overflowFor(rectFor(targetNode)),
                scrollWidth: targetNode.scrollWidth,
                clientWidth: targetNode.clientWidth,
                scrollHeight: targetNode.scrollHeight,
                clientHeight: targetNode.clientHeight,
            } : null;

            return {
                captureName,
                viewport: { width: vw, height: vh },
                state,
                target,
                visibleNodes,
                overlaps,
            };
        }""",
        {
            "captureName": capture_name,
            "targetSelector": selector,
            "trackedSelectors": VISIBLE_IDS,
        },
    )


def reset_to_hud(page: Page) -> None:
    page.evaluate(
        """() => {
            document.querySelectorAll('.panel-close').forEach((node) => {
                if (node instanceof HTMLElement) node.click();
            });
        }"""
    )
    page.wait_for_timeout(350)


def open_by_click(selector: str) -> Callable[[Page], None]:
    def run(page: Page) -> None:
        click_dom(page, selector)

    return run


def open_by_debug(js: str) -> Callable[[Page], None]:
    def run(page: Page) -> None:
        page.evaluate(js)

    return run


CAPTURES = [
    {"name": "hud", "selector": None, "open": lambda page: reset_to_hud(page)},
    {"name": "quest", "selector": "#quest-panel", "open": open_by_click("#nav-quest")},
    {"name": "inventory", "selector": "#inventory-panel", "open": open_by_click("#nav-bag")},
    {"name": "map", "selector": "#world-map-panel", "open": open_by_click("#nav-map")},
    {"name": "pet", "selector": "#petPanel", "open": open_by_click("#nav-pet")},
    {"name": "book", "selector": "#encyclopediaPanel", "open": open_by_click("#nav-book")},
    {"name": "shop", "selector": "#shop-panel", "open": open_by_click("#nav-shop")},
    {"name": "character", "selector": "#char-panel", "open": open_by_click("#nav-char")},
    {"name": "skill", "selector": "#skill-panel", "open": open_by_click("#nav-skill")},
    {"name": "settings", "selector": "#sys-panel", "open": open_by_click("#nav-settings")},
    {"name": "afk", "selector": "#afk-panel", "open": open_by_click("#auto-settings-btn")},
    {"name": "resonance", "selector": "#resonance-panel", "open": open_by_debug("() => window.__fpoDebug?.openResonancePanel?.()")},
    {"name": "fusion", "selector": "#fusionPanel", "open": open_by_debug("() => window.__fpoDebug?.openFusionPanel?.()")},
    {"name": "community", "selector": "#community-panel", "open": open_by_debug("() => window.__fpoDebug?.openCommunityPanel?.()")},
    {"name": "dialogue", "selector": "#dialogue-panel", "open": open_by_debug("() => window.__fpoDebug?.openNpcDialogue?.()")},
    {"name": "revival", "selector": "#revivalPanel", "open": open_by_debug("() => { window.__fpoDebug?.killPet?.(0); return window.__fpoDebug?.openRevivalPanel?.(); }")},
]


def capture_viewport(browser: Browser, url: str, output_dir: Path, viewport: dict) -> list[dict]:
    context = browser.new_context(
        viewport={"width": viewport["width"], "height": viewport["height"]},
        device_scale_factor=2,
        has_touch=True,
        is_mobile=True,
        color_scheme="dark",
    )
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    wait_for_play_mode(page)
    page.wait_for_timeout(1800)

    viewport_dir = output_dir / viewport["name"]
    viewport_dir.mkdir(parents=True, exist_ok=True)

    reports: list[dict] = []
    for capture in CAPTURES:
        reset_to_hud(page)
        capture["open"](page)
        wait_for_visible(page, capture["selector"])

        image_path = viewport_dir / f"{capture['name']}.png"
        page.screenshot(path=str(image_path), full_page=False)
        report = collect_layout_report(page, capture["name"], capture["selector"])
        report["image"] = str(image_path)
        reports.append(report)

    context.close()
    return reports


def create_contact_sheet(output_dir: Path) -> Path | None:
    try:
        from PIL import Image, ImageOps, ImageDraw
    except ImportError:
        return None

    image_paths = sorted(output_dir.glob("*/*.png"))
    if not image_paths:
        return None

    thumb_w = 320
    thumb_h = 180
    cols = 2
    rows = (len(image_paths) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + 28)), "#06131d")
    draw = ImageDraw.Draw(canvas)

    for index, image_path in enumerate(image_paths):
        with Image.open(image_path) as image:
            thumb = ImageOps.contain(image.convert("RGB"), (thumb_w - 12, thumb_h - 12))
            x = (index % cols) * thumb_w
            y = (index // cols) * (thumb_h + 28)
            canvas.paste(thumb, (x + 6, y + 6))
            draw.text((x + 8, y + thumb_h + 4), f"{image_path.parent.name} / {image_path.stem}", fill="#dce8ef")

    contact_sheet = output_dir / "contact-sheet.png"
    canvas.save(contact_sheet)
    return contact_sheet


def summarize_reports(reports: list[dict]) -> list[dict]:
    summary = []
    for report in reports:
        target = report.get("target") or {}
        overflow = (target.get("overflow") or {}) if target else {}
        overflow_total = sum(float(overflow.get(key, 0) or 0) for key in ("left", "top", "right", "bottom"))
        visible_nodes = report.get("visibleNodes") or []
        visible_overflow_total = 0.0
        nodes_with_overflow: list[dict] = []
        for entry in visible_nodes:
            node_overflow = entry.get("overflow") or {}
            node_overflow_total = sum(float(node_overflow.get(key, 0) or 0) for key in ("left", "top", "right", "bottom"))
            visible_overflow_total += node_overflow_total
            if node_overflow_total > 0:
                nodes_with_overflow.append(
                    {
                        "name": entry.get("name"),
                        "selector": entry.get("selector"),
                        "overflow": node_overflow,
                        "overflowTotal": node_overflow_total,
                    }
                )

        overlaps = report.get("overlaps") or []
        target_scroll_x = max(0, int((target.get("scrollWidth") or 0) - (target.get("clientWidth") or 0))) if target else 0
        target_scroll_y = max(0, int((target.get("scrollHeight") or 0) - (target.get("clientHeight") or 0))) if target else 0
        state = report.get("state") or {}
        summary.append(
            {
                "capture": report["captureName"],
                "viewport": report["viewport"],
                "currentPanel": state.get("currentPanel"),
                "activeTab": state.get("activeTab"),
                "visiblePrimaryActions": state.get("visiblePrimaryActions"),
                "keyDataSummary": state.get("keyDataSummary"),
                "modalStack": state.get("modalStack"),
                "targetOverflow": overflow,
                "targetOverflowTotal": overflow_total,
                "targetScrollX": target_scroll_x,
                "targetScrollY": target_scroll_y,
                "visibleOverflowTotal": round(visible_overflow_total, 2),
                "visibleOverflowNodes": nodes_with_overflow,
                "overlapCount": len(overlaps),
                "largestOverlap": max((entry["area"] for entry in overlaps), default=0),
                "image": report["image"],
            }
        )
    return summary


def main() -> int:
    args = parse_args()
    output_dir = Path(args.output_dir).resolve()
    if not args.keep and output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            all_reports = []
            for viewport in VIEWPORTS:
                viewport_reports = capture_viewport(browser, args.url, output_dir, viewport)
                all_reports.extend(viewport_reports)
        finally:
            browser.close()

    report_path = output_dir / "audit-report.json"
    summary_path = output_dir / "audit-summary.json"
    report_path.write_text(json.dumps(all_reports, ensure_ascii=False, indent=2), encoding="utf-8")
    summary_path.write_text(json.dumps(summarize_reports(all_reports), ensure_ascii=False, indent=2), encoding="utf-8")

    contact_sheet = create_contact_sheet(output_dir)
    print(f"Wrote {report_path}")
    print(f"Wrote {summary_path}")
    if contact_sheet:
        print(f"Wrote {contact_sheet}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
