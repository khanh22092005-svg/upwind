// Illustrated "word tree" for the ebook cover: trunk, branches, leaves, word fruits, and the root in the soil.
import { COLORS, esc } from "./common.mjs";

function rng(seed) {
  let s = 2166136261;
  for (const ch of String(seed)) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
const f1 = (n) => n.toFixed(1);

/** A curved branch whose thickness tapers from w0 to w1 (quadratic Bézier, filled polygon). */
function taper(p0, c, p1, w0, w1, n = 18) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * p0.x + 2 * u * t * c.x + t * t * p1.x;
    const y = u * u * p0.y + 2 * u * t * c.y + t * t * p1.y;
    let dx = 2 * u * (c.x - p0.x) + 2 * t * (p1.x - c.x), dy = 2 * u * (c.y - p0.y) + 2 * t * (p1.y - c.y);
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push(`${f1(x - dy * w)},${f1(y + dx * w)}`); R.unshift(`${f1(x + dy * w)},${f1(y - dx * w)}`);
  }
  return `M${L.join(" L")} L${R.join(" L")} Z`;
}
const along = (p0, c, p1, t) => { const u = 1 - t; return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y }; };

export function coverTree(family) {
  const r = rng(family.id);
  const W = 600, H = 540, G = 408; // G = ground line
  const words = family.words.slice(0, 8);
  const cx = 300, cy = 222;
  const slots = [[300, 52], [168, 98], [432, 98], [72, 182], [228, 170], [372, 170], [528, 182], [300, 238]];
  const fruits = words.map((w, i) => ({ w, x: slots[i][0], y: slots[i][1] }));
  const T = { x: cx, y: 300 };
  const wood = [], leaves = [];
  const leaf = (x, y) => {
    const rot = r() * 360, s = 0.7 + r() * 0.8;
    leaves.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(7 * s)}" ry="${f1(3.4 * s)}" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})" fill="${r() < 0.55 ? "#8fe0b5" : "#6ac5e8"}" opacity="${f1(0.55 + r() * 0.4)}"/>`);
  };
  // recursive twigs for an organic canopy
  const twig = (p, ang, len, w, depth) => {
    const end = { x: p.x + Math.cos(ang) * len, y: p.y + Math.sin(ang) * len };
    const bend = (r() - 0.5) * 0.6;
    const c = { x: p.x + Math.cos(ang + bend) * len * 0.55, y: p.y + Math.sin(ang + bend) * len * 0.55 };
    wood.push(taper(p, c, end, w, Math.max(0.6, w * 0.45), 10));
    if (depth > 0) for (let k = 0; k < 2; k++) twig(along(p, c, end, 0.55 + r() * 0.4), ang + (k ? 1 : -1) * (0.35 + r() * 0.4), len * 0.62, w * 0.55, depth - 1);
    for (let k = 0; k < 2 + depth; k++) leaf(end.x + (r() - 0.5) * 16, end.y + (r() - 0.5) * 16);
  };
  // trunk
  wood.push(taper({ x: cx, y: G + 6 }, { x: cx - 6, y: 356 }, T, 50, 22, 20));
  wood.push(taper({ x: cx - 4, y: G + 4 }, { x: cx - 30, y: G }, { x: cx - 52, y: G + 8 }, 18, 2, 8));
  wood.push(taper({ x: cx + 4, y: G + 4 }, { x: cx + 30, y: G }, { x: cx + 56, y: G + 8 }, 18, 2, 8));
  // main branches to each fruit, with side twigs
  for (const f of fruits) {
    const start = { x: T.x + (f.x - T.x) * 0.06, y: T.y + 6 };
    const c = { x: T.x + (f.x - T.x) * 0.25, y: T.y + (f.y - T.y) * 0.8 };
    wood.push(taper(start, c, f, 15, 4.5));
    for (let k = 0; k < 3; k++) {
      const p = along(start, c, f, 0.35 + k * 0.2);
      const base = Math.atan2(f.y - c.y, f.x - c.x);
      twig(p, base + (k % 2 ? 0.9 : -0.9) + (r() - 0.5) * 0.4, 46 + r() * 26, 4, 2);
    }
    const out = Math.atan2(f.y - cy, f.x - cx);
    twig(f, out + (r() - 0.5) * 0.5, 40 + r() * 20, 3.5, 2);
  }
  // roots in the soil
  const roots = [];
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (0.12 + (k / 8) * 0.76);
    const len = 70 + r() * 70;
    const p0 = { x: cx + (k - 4) * 4, y: G + 8 };
    const p1 = { x: cx + Math.cos(a) * len * 1.7, y: G + 14 + Math.sin(a) * len * 0.5 };
    const c = { x: (p0.x + p1.x) / 2, y: p0.y + 6 };
    roots.push(taper(p0, c, p1, 9 - Math.abs(k - 4), 0.8, 14));
  }
  const word = (w) => w.parts.map((p) => `<tspan fill="${COLORS[p.k]}">${esc(p.t)}</tspan>`).join("");
  const fruitsSvg = fruits.map((f) => {
    const rx = Math.max(38, f.w.word.length * 4.3 + 12), ry = 29;
    return `<g filter="url(#ct-soft)">
      <path d="M${f1(f.x + 2)} ${f1(f.y - ry + 3)} q 9 -15 22 -11 q -7 13 -22 11 z" fill="#8fe0b5"/>
      <ellipse cx="${f1(f.x)}" cy="${f1(f.y)}" rx="${f1(rx)}" ry="${ry}" fill="url(#ct-fruit)" stroke="#ffffff" stroke-width="2"/></g>
      <text x="${f1(f.x)}" y="${f1(f.y + 1)}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="14">${word(f.w)}</text>
      <text x="${f1(f.x)}" y="${f1(f.y + 15)}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="600" font-size="8.6" fill="#4a6b8a">${esc(f.w.meaning.split(/[;,(]/)[0].trim())}</text>`;
  }).join("");
  return `<svg class="ctree" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ct-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe9f7"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
    <linearGradient id="ct-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00244d" stop-opacity=".0"/><stop offset=".12" stop-color="#00244d" stop-opacity=".75"/><stop offset="1" stop-color="#001a38" stop-opacity=".95"/></linearGradient>
    <radialGradient id="ct-fruit" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dff1fa"/></radialGradient>
    <radialGradient id="ct-soil2" cx="50%" cy="35%" r="60%"><stop offset="0" stop-color="#001a38" stop-opacity=".9"/><stop offset=".7" stop-color="#001a38" stop-opacity=".55"/><stop offset="1" stop-color="#001a38" stop-opacity="0"/></radialGradient>
    <linearGradient id="ct-line"><stop offset="0" stop-color="#6ac5e8" stop-opacity="0"/><stop offset=".5" stop-color="#6ac5e8"/><stop offset="1" stop-color="#6ac5e8" stop-opacity="0"/></linearGradient>
    <radialGradient id="ct-glow"><stop offset="0" stop-color="#6ac5e8" stop-opacity=".45"/><stop offset="1" stop-color="#6ac5e8" stop-opacity="0"/></radialGradient>
    <filter id="ct-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#00142b" flood-opacity=".45"/></filter>
  </defs>
  <ellipse cx="${cx}" cy="${cy + 10}" rx="270" ry="210" fill="url(#ct-glow)"/>
  <ellipse cx="${cx}" cy="${G + 66}" rx="285" ry="76" fill="url(#ct-soil2)"/>
  <path d="M40 ${G + 4} Q ${W / 2} ${G - 10} ${W - 40} ${G + 4}" stroke="url(#ct-line)" stroke-width="2.2" fill="none"/>
  <g fill="#9edcf3" opacity=".55">${roots.map((d) => `<path d="${d}"/>`).join("")}</g>
  <g fill="url(#ct-wood)">${wood.map((d) => `<path d="${d}"/>`).join("")}</g>
  <g>${leaves.join("")}</g>
  ${fruitsSvg}
  <g filter="url(#ct-soft)"><rect x="${cx - 100}" y="${G + 44}" width="200" height="60" rx="30" fill="#6ac5e8"/></g>
  <text x="${cx}" y="${G + 76}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="27" fill="#003066">${esc(family.root.split("/")[0].trim())}</text>
  <text x="${cx}" y="${G + 94}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="10.5" fill="#004b9b">${esc(family.origin)} · ${esc(family.core)}</text>
</svg>`;
}
