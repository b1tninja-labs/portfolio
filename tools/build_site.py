"""Build the static site into a directory for GitHub Pages. Standard library only.

GitHub Pages has no URL rewriting, so each project gets a real page at
p/<name>/index.html, copied from project.html. A <base> tag makes every
relative path work at the site root (labs.b1tninja.com) and under a repository
path (/portfolio/) alike.

    python tools/build_site.py --out _site --base /portfolio/ [--version SHA] [--cname labs.b1tninja.com]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ("index.html", "project.html")
ASSETS = ("site.css", "site.js", "install.json")
NAME_RE = re.compile(r"^[A-Za-z0-9._-]+$")
BASE_TAG = '<base href="/">'


def render(page: str, base: str, version: str) -> str:
    if BASE_TAG not in page:
        raise SystemExit(f"page has no {BASE_TAG}")
    html = page.replace(BASE_TAG, f'<base href="{base}">')
    if version:
        html = re.sub(r'(href|src)="site\.(css|js)"', rf'\1="site.\2?v={version}"', html)
    return html


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--base", default="/", help="URL path the site is served under, with slashes")
    ap.add_argument("--version", default="", help="cache-busting tag for site.css and site.js")
    ap.add_argument("--cname", default="", help="custom domain to write to CNAME")
    args = ap.parse_args(argv)

    if not re.fullmatch(r"/([A-Za-z0-9._-]+/)*", args.base):
        raise SystemExit(f"bad --base: {args.base!r}")
    out: Path = args.out
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    project = (ROOT / "project.html").read_text(encoding="utf-8")
    (out / "index.html").write_text(render(index, args.base, args.version), encoding="utf-8", newline="\n")
    project_html = render(project, args.base, args.version)

    for name in ASSETS:
        shutil.copy2(ROOT / name, out / name)
    shutil.copytree(ROOT / "data", out / "data")

    data = json.loads((ROOT / "data" / "index.json").read_text(encoding="utf-8"))
    names = [p["name"] for p in data["projects"]]
    for name in names:
        if not NAME_RE.match(name):
            raise SystemExit(f"bad project name: {name!r}")
        if not (ROOT / "data" / "p" / f"{name}.json").is_file():
            raise SystemExit(f"{name}: no data file")
        page = out / "p" / name / "index.html"
        page.parent.mkdir(parents=True)
        page.write_text(project_html, encoding="utf-8", newline="\n")

    (out / ".nojekyll").write_text("", encoding="utf-8")
    if args.cname:
        (out / "CNAME").write_text(args.cname + "\n", encoding="utf-8", newline="\n")
    print(f"built {len(names)} project pages into {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
