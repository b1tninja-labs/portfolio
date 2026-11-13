"use strict";
// Shared helpers for index.html. Data comes from data/index.json (schema 3,
// contract: DATA.md), built from Project 1 by `projecthub site`. Everything is
// built with DOM APIs: text goes in through textContent, and only https://
// URLs become links. The page makes no request to the GitHub API.

const NAME_RE = /^[A-Za-z0-9._-]+$/;
// Project 1's Status options, in its own order, and the color class of each.
const STATUS_CLASS = {
  "Triage": "triage", "Backlog": "backlog", "Ready": "ready", "In progress": "progress",
  "In review": "review", "Blocked": "blocked", "Done": "done", "No status": "none",
};

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) node.setAttribute(k, v);
  for (const c of children) if (c != null && c !== false) node.append(c);
  return node;
}

function link(url, text, attrs) {
  return typeof url === "string" && /^https:\/\/\S+$/.test(url) ? el("a", { href: url, ...attrs }, text) : text;
}

function statusClass(status) {
  return STATUS_CLASS[status] || "none";
}

function statusBadge(status) {
  const s = status == null ? "No card" : String(status);
  return el("span", { class: "status s-" + statusClass(status) }, s);
}

// "3 days ago", with the exact time in the tooltip.
function ago(iso) {
  if (typeof iso !== "string") return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const s = Math.max(0, (Date.now() - t) / 1000);
  const [n, u] = s < 3600 ? [Math.round(s / 60), "minute"] : s < 86400 ? [Math.round(s / 3600), "hour"]
    : s < 86400 * 45 ? [Math.round(s / 86400), "day"] : s < 86400 * 548 ? [Math.round(s / 2629800), "month"]
    : [Math.round(s / 31557600), "year"];
  const text = n <= 0 ? "just now" : `${n} ${u}${n === 1 ? "" : "s"} ago`;
  return el("time", { datetime: iso, title: stamp(iso) }, text);
}

function stamp(iso) {
  if (typeof iso !== "string") return "";
  return iso.length > 10 ? iso.replace("T", " ").slice(0, 16) + " UTC" : iso;
}

// progress = { done, total } in rows.
function progressRow(progress) {
  if (!progress || !(progress.total > 0)) return null;
  const pct = Math.max(0, Math.min(100, Math.floor((100 * progress.done) / progress.total)));
  return el("div", { class: "progress", title: `${progress.done} of ${progress.total} rows done` },
    el("div", { class: "bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(progress.total), "aria-valuenow": String(progress.done), "aria-label": "rows done" },
      el("span", { style: `width:${pct}%` })),
    el("span", { class: "num" }, `${progress.done}/${progress.total} done`));
}

// counts = { Status: n }, in the Project's order: a stacked bar and its legend.
function statusMix(counts, legend) {
  const entries = Object.entries(counts || {}).filter(([, n]) => n > 0);
  const total = entries.reduce((t, [, n]) => t + n, 0);
  if (!total) return null;
  const bar = el("div", { class: "mix", role: "img", "aria-label": entries.map(([s, n]) => `${n} ${s}`).join(", ") });
  for (const [s, n] of entries) {
    const seg = el("span", { class: "m-" + statusClass(s), title: `${n} ${s}` });
    seg.style.flexGrow = String(n);
    bar.append(seg);
  }
  if (!legend) return bar;
  const ul = el("ul", { class: "legend" }, ...entries.map(([s, n]) =>
    el("li", {}, el("span", { class: "dot m-" + statusClass(s), "aria-hidden": "true" }), `${s} `, el("b", {}, String(n)))));
  return el("div", { class: "mixbox" }, bar, ul);
}

async function getJSON(path) {
  const r = await fetch(path, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

// install.json is site content (deployed with the page), not Project data.
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
