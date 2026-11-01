// Obsidian-style graph maps for the ebook: grey edges, round nodes sized by links, labels under nodes.
import { COLORS, esc } from "./common.mjs";

/* Assimilated prefix spellings grouped under one name, so in-/im-/ir- or con-/com-/cor- count as one link. */
const CANON = {
  e: "ex", ef: "ex", ex: "ex",
  co: "con", com: "con", col: "con", cor: "con", con: "con",
  ac: "ad", af: "ad", ag: "ad", al: "ad", ap: "ad", ar: "ad", as: "ad", at: "ad", ad: "ad",
  im: "in", il: "in", ir: "in", in: "in",
  suc: "sub", suf: "sub", sup: "sub", sus: "sub", sub: "sub",
  di: "dis", dif: "dis", dis: "dis",
  oc: "ob", of: "ob", op: "ob", ob: "ob",
};
export const canonPrefix = (t) => {
  const k = t.toLowerCase().replace(/[()]/g, "");
  return CANON[k] ?? k;
};
/** Real prefixes only: the first "pre" part of a word, unless it is a word-like element (photo, bio, bank). */
const NOT_PREFIX = new Set(["photo", "bio", "geo", "demo", "bank", "tele", "auto", "chrono", "port", "manu", "jur", "credit", "vers", "mis", "psycho", "eco", "techno", "manu"]);
export function prefixesOf(w) {
  return w.parts.filter((p) => p.k === "pre" && !NOT_PREFIX.has(p.t.toLowerCase())).map((p) => canonPrefix(p.t));
}

/* deterministic random */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Fruchterman–Reingold layout, fixed seed so the PDF is identical on every build. */
function layout(nodes, edges, W, H, iters = 700, seed = 7) {
  const r = rng(seed);
  for (const n of nodes) { n.x ??= W * (0.15 + 0.7 * r()); n.y ??= H * (0.15 + 0.7 * r()); }
  const k = Math.sqrt((W * H) / nodes.length) * 0.82;
  let t = W / 8;
  for (let it = 0; it < iters; it++) {
    for (const n of nodes) { n.dx = 0; n.dy = 0; }
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.max(0.01, Math.hypot(dx, dy));
        const f = (k * k) / d;
        dx = (dx / d) * f; dy = (dy / d) * f;
        a.dx += dx; a.dy += dy; b.dx -= dx; b.dy -= dy;
      }
    for (const e of edges) {
      const a = e.a, b = e.b;
      let dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.max(0.01, Math.hypot(dx, dy));
      const f = (d * d) / k;
      dx = (dx / d) * f; dy = (dy / d) * f;
      a.dx -= dx; a.dy -= dy; b.dx += dx; b.dy += dy;
    }
    for (const n of nodes) {
      // weak pull to the centre keeps small islands on the page
      n.dx += (W / 2 - n.x) * 0.05; n.dy += (H / 2 - n.y) * 0.05;
      const d = Math.max(0.01, Math.hypot(n.dx, n.dy));
      n.x += (n.dx / d) * Math.min(d, t);
      n.y += (n.dy / d) * Math.min(d, t);
      n.x = Math.min(W - 60, Math.max(60, n.x));
      n.y = Math.min(H - 30, Math.max(30, n.y));
    }
    t *= 0.993;
  }
}

/** The whole book on one page: every root linked to the prefixes its words use. */
export function globalMap(chapters, W = 700, H = 900) {
  const prefixCount = new Map();
  const rootPre = chapters.map((c) => {
    const s = new Set(c.words.flatMap(prefixesOf));
    for (const p of s) prefixCount.set(p, (prefixCount.get(p) ?? 0) + 1);
    return s;
  });
  const nodes = [], edges = [];
  const roots = chapters.map((c, i) => {
    const n = { kind: "root", label: c.root.split("/")[0].trim(), n: i + 1, deg: 0, href: `#ch-${c.id}`, part: c.part };
    nodes.push(n);
    return n;
  });
  const pre = new Map();
  for (const [p, cnt] of prefixCount) if (cnt >= 2) { const n = { kind: "pre", label: p + "-", deg: 0 }; pre.set(p, n); nodes.push(n); }
  chapters.forEach((c, i) => {
    for (const p of rootPre[i]) if (pre.has(p)) { edges.push({ a: roots[i], b: pre.get(p) }); roots[i].deg++; pre.get(p).deg++; }
  });
  // root-to-root links: a word in one unit contains another unit's root (biology → bio, chronological → log)
  chapters.forEach((a, i) => {
    for (const [j, b] of chapters.entries()) {
      if (i === j) continue;
      const key = b.root.split("/")[0].trim().toLowerCase();
      if (key.length < 3) continue;
      if (a.words.some((w) => w.parts.some((p) => p.k !== "suf" && p.t.toLowerCase().replace(/[()]/g, "").startsWith(key))) && !edges.some((e) => (e.a === roots[j] && e.b === roots[i]) || (e.a === roots[i] && e.b === roots[j]))) {
        edges.push({ a: roots[i], b: roots[j], rr: true }); roots[i].deg++; roots[j].deg++;
      }
    }
  });
  layout(nodes, edges, W, H, 900, 11);
  const PART_COL = ["#004b9b", "#6a3fb5", "#0e7c86", "#b4410f"];
  const svgEdges = edges.map((e) => `<line${e.rr ? ' class="rr"' : ""} x1="${e.a.x.toFixed(1)}" y1="${e.a.y.toFixed(1)}" x2="${e.b.x.toFixed(1)}" y2="${e.b.y.toFixed(1)}" />`).join("");
  const svgNodes = nodes
    .map((n) => {
      const r = n.kind === "root" ? 7 + Math.sqrt(n.deg) * 2.2 : 4 + Math.sqrt(n.deg) * 2.6;
      const fill = n.kind === "root" ? PART_COL[n.part] : COLORS.pre;
      const label = n.kind === "root" ? `${n.n}·${esc(n.label)}` : esc(n.label);
      const g = `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>
        <text x="${n.x.toFixed(1)}" y="${(n.y + r + 11).toFixed(1)}" class="${n.kind}">${label}</text>`;
      return n.href ? `<a href="${n.href}">${g}</a>` : g;
    })
    .join("");
  return `<svg class="gmap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <style>line{stroke:#b9c4cf;stroke-width:1}line.rr{stroke:#004b9b;stroke-width:1.6;stroke-dasharray:4 3}text{font:600 10.5px 'Be Vietnam Pro';text-anchor:middle;fill:#3a4a5c}text.root{font-weight:800;font-size:12px;fill:#0b2545}text.pre{fill:${COLORS.pre}}</style>
    ${svgEdges}${svgNodes}</svg>`;
}

/** One chapter: root in the middle, its words around it, and faded nodes for other chapters that share a prefix. */
export function chapterMap(ch, chapters, W = 660, H = 330) {
  const cx = W / 2, cy = H / 2;
  const words = ch.words;
  const nodes = [], edges = [];
  const center = { x: cx, y: cy, label: ch.root.split("/")[0].trim(), kind: "root", fx: true };
  nodes.push(center);
  const wn = words.map((w, i) => {
    const a = -Math.PI / 2 + (i / words.length) * Math.PI * 2;
    const n = { x: cx + Math.cos(a) * 165, y: cy + Math.sin(a) * 92, label: w.word, kind: "word", w, a };
    nodes.push(n);
    edges.push({ a: center, b: n, cls: "e1" });
    return n;
  });
  // links to other chapters through shared prefixes (at most 8 outer nodes)
  const links = new Map(); // chapter id -> {ch, from:Set(word nodes), via:Set(prefix)}
  for (const n of wn)
    for (const p of prefixesOf(n.w))
      for (const other of chapters) {
        if (other.id === ch.id) continue;
        if (!other.words.some((ow) => prefixesOf(ow).includes(p))) continue;
        const l = links.get(other.id) ?? { ch: other, from: new Set(), via: new Set() };
        l.from.add(n); l.via.add(p);
        links.set(other.id, l);
      }
  const outer = [...links.values()].sort((a, b) => b.from.size - a.from.size || a.ch.n - b.ch.n).slice(0, 8);
  const placed = outer.map((l) => {
    // place each outer node beyond the average angle of the words it links to
    const ax = [...l.from].reduce((s, n) => s + Math.cos(n.a), 0), ay = [...l.from].reduce((s, n) => s + Math.sin(n.a), 0);
    return { l, a: Math.atan2(ay, ax) };
  });
  placed.sort((p, q) => p.a - q.a);
  // spread outer nodes so they never sit on top of each other
  for (let pass = 0; pass < 40; pass++)
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i], q = placed[(i + 1) % placed.length];
      if (placed.length < 2) break;
      let d = q.a - p.a; if (d < 0) d += Math.PI * 2;
      const min = 0.5;
      if (d < min) { p.a -= (min - d) / 2; q.a += (min - d) / 2; }
    }
  for (const { l, a } of placed) {
    const n = { x: cx + Math.cos(a) * 292, y: cy + Math.sin(a) * 143, label: `${l.ch.n}·${l.ch.root.split("/")[0].trim()}`, kind: "other", href: `#ch-${l.ch.id}`, via: [...l.via] };
    n.x = Math.min(W - 34, Math.max(34, n.x)); n.y = Math.min(H - 22, Math.max(14, n.y));
    nodes.push(n);
    for (const f of l.from) edges.push({ a: f, b: n, cls: "e2" });
  }
  const line = (e) => `<line class="${e.cls}" x1="${e.a.x.toFixed(1)}" y1="${e.a.y.toFixed(1)}" x2="${e.b.x.toFixed(1)}" y2="${e.b.y.toFixed(1)}"/>`;
  const node = (n) => {
    if (n.kind === "root")
      return `<circle cx="${n.x}" cy="${n.y}" r="30" fill="${COLORS.root}"/><text x="${n.x}" y="${n.y + 5}" class="root">${esc(n.label)}</text>`;
    if (n.kind === "word") {
      const pre = prefixesOf(n.w).length;
      return `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="8" fill="${pre ? COLORS.pre : "#7d8ea1"}"/>
        <text x="${n.x.toFixed(1)}" y="${(n.y + 21).toFixed(1)}" class="word">${esc(n.label)}</text>`;
    }
    return `<a href="${n.href}"><circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.5" fill="#c7d2dd"/>
      <text x="${n.x.toFixed(1)}" y="${(n.y + 16).toFixed(1)}" class="other">${esc(n.label)}</text>
      <text x="${n.x.toFixed(1)}" y="${(n.y + 26).toFixed(1)}" class="via">${esc(n.via.map((v) => v + "-").join(" "))}</text></a>`;
  };
  return `<svg class="cmap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <style>line.e1{stroke:#9fb3c8;stroke-width:1.4}line.e2{stroke:#d5dde5;stroke-width:1;stroke-dasharray:3 3}
    text{font-family:'Be Vietnam Pro';text-anchor:middle}text.root{font-weight:800;font-size:15px;fill:#fff}
    text.word{font-weight:700;font-size:12px;fill:#0b2545}text.other{font-weight:600;font-size:10px;fill:#7d8ea1}text.via{font-size:9px;fill:${COLORS.pre}}</style>
    ${edges.map(line).join("")}${nodes.map(node).join("")}</svg>`;
}
