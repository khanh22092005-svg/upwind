// The ebook "Học Từ, Từ Gốc" (tools/social-content/make-ebook.mjs), read from the same data:
// data/ebook/order.json gives the parts and unit order, data/ebook/<id>.json each unit.
// A unit whose `words` is an object only adds fields to the family of the same id in data/families.json
// (the same merge as make-ebook.mjs).
import base from "../../tools/social-content/data/families.json";
import order from "../../tools/social-content/data/ebook/order.json";

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
  forms?: Record<string, string>;
  col?: string[];
  tp?: string;
};
export type WordForm = { s: string; base: string; a: string };
export type Family = {
  id: string;
  root: string;
  say_root?: string;
  origin: string;
  core: string;
  image: string;
  hook: string;
  bait: { word: string; literal: string; say?: string };
  icon?: string;
  words: Word[];
  wf?: WordForm[];
  /** added here: position in the ebook */
  n: number;
  part: number;
  week: number;
  day: number;
};

type Raw = Omit<Family, "n" | "part" | "week" | "day" | "words"> & { words: Word[] | Record<string, Partial<Word>> };
// Only the fields this app uses (see jsonFields() in vite.config.ts): the reading texts,
// Speaking questions etc. of the ebook stay out of the bundle.
const unitFiles = import.meta.glob(["../../tools/social-content/data/ebook/*.json", "!**/order.json"], {
  query: { fields: "id,root,say_root,origin,core,image,hook,bait,icon,words,wf" },
  import: "default",
  eager: true,
}) as Record<string, Raw>;
const unitsById = new Map(Object.values(unitFiles).map((u) => [u.id, u]));
const baseById = new Map((base as unknown as Family[]).map((f) => [f.id, f]));

export const parts = order.parts.map((p) => ({ title: p.title, sub: p.sub }));
export const topics = order.topics as Record<string, string>;
const PART_ICONS = ["message-circle", "arrows-exchange", "building-factory", "brain"];

export const families: Family[] = [];
order.parts.forEach((part, pi) =>
  part.ids.forEach((id) => {
    const extra = unitsById.get(id);
    if (!extra) return;
    let unit: Omit<Family, "n" | "part" | "week" | "day">;
    if (Array.isArray(extra.words)) unit = { ...(extra as Omit<Family, "n" | "part" | "week" | "day">) };
    else {
      const f = baseById.get(id);
      if (!f) return;
      const overlay = extra.words;
      unit = { ...f, ...extra, words: f.words.map((w) => ({ ...w, ...(overlay[w.word] ?? {}) })) };
    }
    const i = families.length;
    families.push({
      ...unit,
      icon: unit.icon ?? baseById.get(id)?.icon ?? PART_ICONS[pi],
      n: i + 1,
      part: pi,
      week: Math.floor(i / 5) + 1,
      day: (i % 5) + 1,
    });
  }),
);

export const allWords = families.flatMap((f) => f.words.map((w) => ({ family: f, w })));
export const familyById = (id: string) => families.find((f) => f.id === id);
/** The next unit in the ebook. */
export const nextFamily = (f: Family) => families[(families.indexOf(f) + 1) % families.length];
export const shortRoot = (f: Family) => f.root.split("/")[0].trim();
export const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"];

export const COLORS: Record<PartKind, string> = { pre: "#f2711c", root: "#004b9b", suf: "#1a9c5b" };
export const KIND_VI: Record<PartKind, string> = { pre: "tiền tố", root: "gốc từ", suf: "hậu tố" };
export const EBOOK_URL = "/ebook/hoc-tu-tu-goc/";

const iconFiles = import.meta.glob("../../tools/social-content/assets/icons/*.svg", {
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
// A few UI icons the content kit doesn't use (same Tabler outline set, MIT).
const UI: Record<string, string> = {
  volume: "M15 8a5 5 0 0 1 0 8 M17.7 5a9 9 0 0 1 0 14 M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5",
  "arrow-left": "M5 12l14 0 M5 12l6 6 M5 12l6 -6",
  x: "M18 6l-12 12 M6 6l12 12",
  check: "M5 12l5 5l10 -10",
  flame: "M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235",
  share: "M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M8.7 10.7l6.6 -3.4 M8.7 13.3l6.6 3.4",
  refresh: "M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4 M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4",
  book: "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0 M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0 M3 6l0 13 M12 6l0 13 M21 6l0 13",
};
for (const [k, d] of Object.entries(UI)) if (!ICONS.has(k)) ICONS.set(k, `<path d="${d}"/>`);

/** Inner SVG markup of a Tabler icon (MIT, copied by tools/social-content/fetch-assets.mjs). */
export const iconSvg = (name?: string) => ICONS.get(name ?? "") ?? ICONS.get("bulb") ?? "";
