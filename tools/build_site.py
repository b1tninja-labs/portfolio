"""Build the static site into a directory for GitHub Pages. Standard library only.

The site is one page, index.html, that renders data/index.json (schema 3, contract: DATA.md). The data is
written by `projecthub site --out data` from Project 1 on every Pages run, so nothing here is committed by
hand. A <base> tag makes every relative path work at the site root (labs.b1tninja.com) and under a
repository path (/portfolio/) alike.

    python tools/build_site.py --out _site --base /portfolio/ [--data data] [--version SHA] [--cname labs.b1tninja.com]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ("site.css", "site.js", "install.json")
NAME_RE = re.compile(r"^[A-Za-z0-9._-]+$")
BASE_TAG = '<base href="/">'
SCHEMA_VERSION = 3


def render(page: str, base: str, version: str) -> str:
    if BASE_TAG not in page:
        raise SystemExit(f"page has no {BASE_TAG}")
    html = page.replace(BASE_TAG, f'<base href="{base}">')
    if version:
        html = re.sub(r'(href|src)="site\.(css|js)"', rf'\1="site.\2?v={version}"', html)
    return html


def check(data: dict) -> int:
    """The parts of DATA.md the page relies on. Returns the number of projects."""
    if data.get("schema_version") != SCHEMA_VERSION:
        raise SystemExit(f"data is schema {data.get('schema_version')!r}, not {SCHEMA_VERSION}")
    projects = [*data["active"], *data["others"]]
    names = [p["name"] for p in projects]
    for name in names:
        if not NAME_RE.match(name):
            raise SystemExit(f"bad project name: {name!r}")
    if len(set(names)) != len(names):
        raise SystemExit("duplicate project names")
    for p in data["active"]:
        for event in p["activity"]:
            if set(event) != {"at", "kind"}:
                raise SystemExit(f"{p['name']}: activity carries more than kind and time")
    return len(names)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--data", type=Path, default=ROOT / "data", help="the directory projecthub site wrote")
    ap.add_argument("--base", default="/", help="URL path the site is served under, with slashes")
    ap.add_argument("--version", default="", help="cache-busting tag for site.css and site.js")
    ap.add_argument("--cname", default="", help="custom domain to write to CNAME")
    args = ap.parse_args(argv)

    if not re.fullmatch(r"/([A-Za-z0-9._-]+/)*", args.base):
        raise SystemExit(f"bad --base: {args.base!r}")
    index_json = args.data / "index.json"
    if not index_json.is_file():
        raise SystemExit(f"{index_json} is missing: run `projecthub site --out {args.data}` first")
    count = check(json.loads(index_json.read_text(encoding="utf-8")))

    out: Path = args.out
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    (out / "index.html").write_text(render(index, args.base, args.version), encoding="utf-8", newline="\n")
    for name in ASSETS:
        shutil.copy2(ROOT / name, out / name)
    (out / "data").mkdir()
    shutil.copy2(index_json, out / "data" / "index.json")

    (out / ".nojekyll").write_text("", encoding="utf-8")
    if args.cname:
        (out / "CNAME").write_text(args.cname + "\n", encoding="utf-8", newline="\n")
    print(f"built the status page for {count} projects into {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
