// Inline SVG icons (Tabler outline set, MIT; copied into assets/icons by fetch-assets.mjs).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "icons");

/** Small icons used by the templates in place of emoji. */
export const UI_ICONS = {
  literal: "bulb",
  challenge: "brain",
  comment: "message-circle",
  trap: "alert-triangle",
  story: "bulb",
  follow: "bell",
  next: "arrow-right",
  swipe: "arrow-right",
  save: "bookmark",
};

const cache = new Map();
function inner(name) {
  if (!cache.has(name)) {
    const file = path.join(DIR, `${name}.svg`);
    if (!fs.existsSync(file)) throw new Error(`Icon "${name}" missing: run node fetch-assets.mjs`);
    const svg = fs.readFileSync(file, "utf8");
    cache.set(name, svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>")));
  }
  return cache.get(name);
}

/** Bare icon, sized in px, drawn with currentColor (so CSS `color` sets it). */
export function icon(name, size = 48, stroke = 2) {
  return `<svg class="ico" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner(name)}</svg>`;
}

/** Icon in the brand badge: sky-blue disc, light ring, deep-blue strokes. */
export function badge(name, size = 240, cls = "") {
  return `<span class="badge ${cls}" style="width:${size}px;height:${size}px">${icon(name, Math.round(size * 0.56), 1.6)}</span>`;
}

/** Family/word icon if set, else a neutral one. */
export const iconOf = (x, fallback = "bulb") => x?.icon ?? fallback;
