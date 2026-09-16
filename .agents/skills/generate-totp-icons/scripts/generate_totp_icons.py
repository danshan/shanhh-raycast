#!/usr/bin/env python3

import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from collections import Counter
from pathlib import Path


ICONIFY_COLLECTIONS = ("logos", "devicon", "thesvg-color", "cib", "fa6-brands", "fa-brands")
KEYWORD_ALIASES = {
    "qcloud": "tencentcloud",
    "1password": "1password",
    "jumpserver": "jumpserver",
    "qiniu": "qiniu",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate exact-match TOTP logo assets.")
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--assets", type=Path, required=True)
    parser.add_argument("--simple-icons", type=Path)
    parser.add_argument("--dashboard-icons", type=Path)
    parser.add_argument("--iconify-json", type=Path)
    parser.add_argument("--apply", action="store_true")
    return parser.parse_args()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")


def resolve_icon_slug(value: str) -> str:
    slug = slugify(value)
    aliases = {target for keyword, target in KEYWORD_ALIASES.items() if keyword in slug.split("-")}
    return aliases.pop() if len(aliases) == 1 else slug


def read_config(path: Path) -> list[dict[str, object]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("TOTP configuration must be a JSON array")
    for entry in data:
        if not isinstance(entry, dict) or not all(isinstance(entry.get(key), str) for key in ("website", "account", "secret")):
            raise ValueError("Each TOTP entry must contain string website, account, and secret fields")
    return data


def resolve_svg_dir(path: Path | None, nested: str) -> Path | None:
    if path is None:
        return None
    candidate = path / nested
    return candidate if candidate.is_dir() else path


def file_source(name: str, path: Path | None) -> tuple[str, dict[str, str]] | None:
    if path is None or not path.is_dir():
        return None
    icons = {}
    for item in path.glob("*.svg"):
        try:
            content = item.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if "<svg" in content:
            icons[item.stem] = content
    return name, icons


def iconify_sources(path: Path | None) -> list[tuple[str, dict[str, str]]]:
    if path is None or not path.is_dir():
        return []
    sources = []
    for collection in ICONIFY_COLLECTIONS:
        collection_path = path / f"{collection}.json"
        if not collection_path.is_file():
            continue
        payload = json.loads(collection_path.read_text(encoding="utf-8"))
        width = payload.get("width", 24)
        height = payload.get("height", 24)
        icons = {}
        for name, icon in payload.get("icons", {}).items():
            icon_width = icon.get("width", width)
            icon_height = icon.get("height", height)
            body = icon["body"].replace("currentColor", "#111827")
            icons[name] = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {icon_width} {icon_height}">{body}</svg>'
        sources.append((f"iconify:{collection}", icons))
    return sources


def build_sources(args: argparse.Namespace) -> list[tuple[str, dict[str, str]]]:
    sources = []
    for source in (
        file_source("simple-icons", resolve_svg_dir(args.simple_icons, "icons")),
        file_source("dashboard-icons", resolve_svg_dir(args.dashboard_icons, "svg")),
    ):
        if source is not None:
            sources.append(source)
    sources.extend(iconify_sources(args.iconify_json))
    if not sources:
        raise ValueError("At least one icon source is required")
    return sources


def render_png(svg: str, output: Path, converter: str) -> None:
    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    wrapper = f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect x="2" y="2" width="124" height="124" rx="27" fill="#F5F7FA" stroke="#DDE3E8" stroke-width="4"/>
  <image x="24" y="24" width="80" height="80" preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;base64,{encoded}"/>
</svg>'''
    subprocess.run(
        [converter, "--width", "128", "--height", "128", "--output", str(output)],
        input=wrapper.encode("utf-8"),
        check=True,
    )


def write_config(path: Path, data: list[dict[str, object]]) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.chmod(temp_name, path.stat().st_mode)
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def main() -> None:
    args = parse_args()
    config = read_config(args.config)
    sources = build_sources(args)
    available = {path.stem for path in args.assets.glob("*.png")}
    matches: dict[str, tuple[str, str]] = {}
    source_counts: Counter[str] = Counter()

    for entry in config:
        current = entry.get("icon")
        if isinstance(current, str) and current not in ("", "default") and current in available:
            continue
        slug = resolve_icon_slug(str(entry["website"]))
        if not slug or slug in matches:
            continue
        for source_name, icons in sources:
            if slug in icons:
                matches[slug] = (source_name, icons[slug])
                source_counts[source_name] += 1
                break

    updated_entries = sum(
        1
        for entry in config
        if resolve_icon_slug(str(entry["website"])) in matches
        and (entry.get("icon") in (None, "", "default") or entry.get("icon") not in available)
    )

    if args.apply and matches:
        converter = shutil.which("rsvg-convert")
        if converter is None:
            raise RuntimeError("rsvg-convert is required to generate PNG assets")
        args.assets.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="totp-icons-") as temp_dir:
            temp_path = Path(temp_dir)
            for slug, (_, svg) in matches.items():
                render_png(svg, temp_path / f"{slug}.png", converter)
            for png in temp_path.glob("*.png"):
                os.replace(png, args.assets / png.name)
        for entry in config:
            slug = resolve_icon_slug(str(entry["website"]))
            if slug in matches and (entry.get("icon") in (None, "", "default") or entry.get("icon") not in available):
                entry["icon"] = slug
        write_config(args.config, config)

    unmatched = {
        resolve_icon_slug(str(entry["website"]))
        for entry in config
        if entry.get("icon") in (None, "", "default") and resolve_icon_slug(str(entry["website"])) not in matches
    }
    print(
        json.dumps(
            {
                "applied": args.apply,
                "matched_icons": len(matches),
                "updated_entries": updated_entries,
                "remaining_default_icons": len(unmatched),
                "sources": dict(source_counts),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": type(error).__name__}), file=sys.stderr)
        raise SystemExit(1) from None
