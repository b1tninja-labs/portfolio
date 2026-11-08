"use strict";
// Shared helpers for index.html and project.html. Data comes from
// data/index.json and data/p/<name>.json (contract: DATA.md). Everything is
// built with DOM APIs: text goes in through textContent, and only https://
// URLs become links.

const NAME_RE = /^[A-Za-z0-9._-]+$/;
const KNOWN_STATUS = new Set(["active", "shipped", "planned", "blocked", "archived"]);

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) node.setAttribute(k, v);
  for (const c of children) if (c != null && c !== false) node.append(c);
  return node;
}

function link(url, text, attrs) {
  return typeof url === "string" && /^https:\/\/\S+$/.test(url) ? el("a", { href: url, ...attrs }, text) : text;
}

function projectLink(name, text) {
  return NAME_RE.test(name) ? el("a", { href: "p/" + name + "/" }, text || name) : text || name;
}

// GitHub linguist colors for the languages in the portfolio.
const LANG_COLORS = {
  Python: "#3572A5", Rust: "#dea584", TypeScript: "#3178c6", JavaScript: "#f1e05a", "C++": "#f34b7d",
  C: "#555555", "C#": "#178600", Go: "#00ADD8", PowerShell: "#012456", HCL: "#844FBA", Shell: "#89e051",
  Java: "#b07219", Kotlin: "#A97BFF", HTML: "#e34c26", CSS: "#563d7c", Lua: "#000080", Ruby: "#701516",
  PHP: "#4F5D95", Dockerfile: "#384d54", Makefile: "#427819", Swift: "#F05138", "Jupyter Notebook": "#DA5B0B",
  mIRC: "#3d57c3", Assembly: "#6E4C13", Batchfile: "#C1F12E", Perl: "#0298c3", Haskell: "#5e5086",
};

// 16px line icons per project kind (stroke uses currentColor).
const KIND_ICONS = {
  sdk: "M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4M9 3 7 13",
  library: "M3 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 0 7 11.5H3zM13 3.5H9.5A1.5 1.5 0 0 0 8 5",
  mcp: "M6 2v3M10 2v3M4.5 5h7v2.5a3.5 3.5 0 0 1-7 0zM8 11v3",
  tool: "M9.5 2.5a3 3 0 0 0-3.4 4L2.5 10a1.4 1.4 0 0 0 2 2l3.5-3.6a3 3 0 0 0 4-3.4L10.2 6.8 9 5.8z",
  hardware: "M4.5 4.5h7v7h-7zM6.5 2v2.5M9.5 2v2.5M6.5 11.5V14M9.5 11.5V14M2 6.5h2.5M2 9.5h2.5M11.5 6.5H14M11.5 9.5H14",
  reference: "M4 2.5h8v11l-4-2.5-4 2.5z",
  app: "M2.5 3.5h11v9h-11zM2.5 6h11",
  service: "M3 3h10v4H3zM3 9h10v4H3zM5 5h.01M5 11h.01",
  plan: "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM10.5 5.5 9 9l-3.5 1.5L7 7z",
};

function svgIcon(d) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  for (const [k, v] of Object.entries({ viewBox: "0 0 16 16", width: "14", height: "14", fill: "none", stroke: "currentColor", "stroke-width": "1.4", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) svg.setAttribute(k, v);
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
}

function kindLabel(kind) {
  const k = String(kind || "");
  return el("span", { class: "kind" }, KIND_ICONS[k] ? svgIcon(KIND_ICONS[k]) : null, k);
}

function langLabel(lang) {
  if (!lang) return null;
  const dot = el("span", { class: "lang-dot", "aria-hidden": "true" });
  dot.style.background = LANG_COLORS[lang] || "var(--off)";
  return el("span", { class: "lang" }, dot, lang);
}

// "3 days ago", with the exact date in the tooltip.
function ago(iso) {
  if (typeof iso !== "string") return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const s = Math.max(0, (Date.now() - t) / 1000);
  const [n, u] = s < 3600 ? [Math.round(s / 60), "minute"] : s < 86400 ? [Math.round(s / 3600), "hour"]
    : s < 86400 * 45 ? [Math.round(s / 86400), "day"] : s < 86400 * 548 ? [Math.round(s / 2629800), "month"]
    : [Math.round(s / 31557600), "year"];
  const text = n <= 0 ? "just now" : `${n} ${u}${n === 1 ? "" : "s"} ago`;
  return el("time", { datetime: iso, title: iso.slice(0, 10) }, text);
}

// Obligation states reuse the project status colors.
const STATE_CLASS = { done: "active", in_progress: "progress", open: "planned", blocked: "blocked", parked: "parked" };

function statusBadge(status) {
  const s = String(status || "unknown");
  return el("span", { class: "status" + (KNOWN_STATUS.has(s) ? " s-" + s : "") }, s);
}

function stateBadge(state) {
  const s = String(state || "open");
  const cls = STATE_CLASS[s];
  return el("span", { class: "status" + (cls ? " s-" + cls : "") }, s.replace("_", " "));
}

// progress = { done, total, unit } where unit is "obligations" or "milestones".
function progressText(progress) {
  if (!progress || !(progress.total > 0)) return null;
  return `${progress.done}/${progress.total} ${progress.unit}`;
}

function progressRow(progress) {
  if (!progress || !(progress.total > 0)) return null;
  const pct = Math.max(0, Math.min(100, Math.floor((100 * progress.done) / progress.total)));
  return el("div", { class: "progress", title: `${progress.done} of ${progress.total} ${progress.unit} done` },
    el("div", { class: "bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(progress.total), "aria-valuenow": String(progress.done), "aria-label": progress.unit },
      el("span", { style: `width:${pct}%` })),
    el("span", { class: "num" }, progressText(progress)));
}

function day(iso) {
  return typeof iso === "string" ? iso.slice(0, 10) : null;
}

function stamp(iso) {
  return typeof iso === "string" ? iso.replace("T", " ").slice(0, 16) + " UTC" : "";
}

async function getJSON(path) {
  const r = await fetch(path, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

// install.json is site content (deployed with the pages), not portfolio data.
async function getInstall() {
  try { return (await getJSON("install.json")).projects || {}; } catch { return {}; }
}

function copyButton(getText) {
  const b = el("button", { type: "button", class: "copy", "aria-label": "Copy to clipboard" }, "Copy");
  b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(getText()); b.textContent = "Copied"; }
    catch { b.textContent = "Select and copy"; }
    setTimeout(() => { b.textContent = "Copy"; }, 1600);
  });
  return b;
}

function snippet(s) {
  const code = el("code", {}, s.code);
  return el("figure", { class: "snippet" },
    el("figcaption", {}, el("span", {}, s.label), el("span", { class: "lang" }, s.lang || ""), copyButton(() => s.code)),
    el("pre", {}, code),
    s.note ? el("p", { class: "note" }, s.note) : null);
}

function loadFailed(root, what) {
  root.replaceChildren(el("p", { class: "empty" }, `${what} could not be loaded. All repositories are on `, link("https://github.com/b1tninja", "GitHub"), "."));
}
