// The same data as the videos, carousels and PDF handbook (tools/word-roots/data/families.json).
import raw from "../../tools/word-roots/data/families.json";

export type PartKind = "pre" | "root" | "suf";
export type Part = { t: string; k: PartKind; vi: string };
export type Word = {
  word: string;
  pos: string;
  ipa: string;
  parts: Part[];
  meaning: string;
  story: string;
  example: string;
  example_vi: string;
  related?: { w: string; pos: string; vi: string }[];
  trap?: string;
  icon?: string;
};
export type Family = {
  id: string;
  root: string;
  say_root?: string;
  origin: string;
  core: string;
  image: string;
  hook: string;
  bait: { word: string; literal: string; say?: string };
  next?: string;
  icon?: string;
  words: Word[];
};

export const families = raw as unknown as Family[];
export const allWords = families.flatMap((f) => f.words.map((w) => ({ family: f, w })));
export const familyById = (id: string) => families.find((f) => f.id === id);

/** Same rule as nextFamily() in tools/word-roots/lib/common.mjs, so the app follows the video series. */
export function nextFamily(f: Family) {
  const hit = f.next ? familyById(f.next) : undefined;
  return hit ?? families[(families.indexOf(f) + 1) % families.length];
}

export const COLORS: Record<PartKind, string> = { pre: "#f2711c", root: "#004b9b", suf: "#1a9c5b" };
export const KIND_VI: Record<PartKind, string> = { pre: "tiền tố", root: "gốc từ", suf: "hậu tố" };

const iconFiles = import.meta.glob("../../tools/word-roots/assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const ICONS = new Map(
  Object.entries(iconFiles).map(([file, svg]) => [
    file.split("/").pop()!.replace(/\.svg$/, ""),
    svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>")),
  ]),
);
// A few UI icons the video kit doesn't use (same Tabler outline set, MIT).
const UI: Record<string, string> = {
  volume: "M15 8a5 5 0 0 1 0 8 M17.7 5a9 9 0 0 1 0 14 M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5",
  "arrow-left": "M5 12l14 0 M5 12l6 6 M5 12l6 -6",
  x: "M18 6l-12 12 M6 6l12 12",
  check: "M5 12l5 5l10 -10",
  flame: "M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235",
  share: "M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M8.7 10.7l6.6 -3.4 M8.7 13.3l6.6 3.4",
  refresh: "M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4 M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4",
};
for (const [k, d] of Object.entries(UI)) if (!ICONS.has(k)) ICONS.set(k, `<path d="${d}"/>`);

/** Inner SVG markup of a Tabler icon (MIT, copied by tools/word-roots/fetch-assets.mjs). */
export const iconSvg = (name?: string) => ICONS.get(name ?? "") ?? ICONS.get("bulb") ?? "";
