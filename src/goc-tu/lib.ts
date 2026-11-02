// TS ports of the helpers in tools/social-content/make-ebook.mjs,
// so the practice questions and answers match the printed ebook.
import { allWords, type Family, type PartKind, type Word } from "./data";

/** "Tại sao {{evoke}}..." -> segments, English ones flagged. */
export function chunks(text: string) {
  const out: { en: boolean; text: string }[] = [];
  const re = /\{\{(.+?)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ en: false, text: text.slice(last, m.index) });
    out.push({ en: true, text: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ en: false, text: text.slice(last) });
  return out;
}
export const plain = (text: string) => text.replace(/\{\{(.+?)\}\}/g, "$1");

/** All spellings of a word we may meet in text: the word, its forms, related words. */
export function spellings(w: Word) {
  const list = [w.word, ...Object.values(w.forms ?? {}).flatMap((v) => v.split(",")), ...(w.related ?? []).map((r) => r.w)];
  return [...new Set(list.map((s) => s.replace(/\(.*?\)/g, "").trim().toLowerCase()).filter(Boolean))];
}
const stemOf = (s: string) => s.replace(/e$/, "").slice(0, Math.max(4, s.length - 2));
/** Regex that finds any form of the word (provoke, provoked, provocative...), as in make-ebook.mjs. */
export function formRe(w: Word, flags = "i") {
  const stems = [...new Set(spellings(w).filter((s) => !s.includes(" ")).map(stemOf))].sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(${stems.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[a-z]*`, flags);
}
/** The form of the word used in its example sentence ("evoked"), or the word itself. */
export const formIn = (w: Word) => w.example.match(formRe(w))?.[0] ?? w.word;
/** Split the example sentence around the target word: [before, form, after]. */
export function splitAt(w: Word): [string, string, string] {
  const m = w.example.match(formRe(w));
  if (!m || m.index === undefined) return [w.example, "", ""];
  return [w.example.slice(0, m.index), m[0], w.example.slice(m.index + m[0].length)];
}

/** Deterministic shuffle, identical to make-ebook.mjs, so the ebook and the app ask the same questions. */
const seeded = (seed: string) => {
  let s = [...String(seed)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296;
};
export function shuffle<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  const r = seeded(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Prefix / suffix index built from the data, most frequent first (as in the handbook). */
export function affixIndex(kind: Exclude<PartKind, "root">) {
  const map = new Map<string, { vi: Set<string>; words: { family: Family; word: string }[] }>();
  for (const { family, w } of allWords)
    for (const p of w.parts.filter((p) => p.k === kind)) {
      const key = p.t.replace(/[()]/g, "");
      const e = map.get(key) ?? { vi: new Set(), words: [] };
      e.vi.add(p.vi);
      e.words.push({ family, word: w.word });
      map.set(key, e);
    }
  return [...map.entries()]
    .map(([key, e]) => ({ key, vi: [...e.vi].join(" · "), words: e.words }))
    .sort((a, b) => b.words.length - a.words.length || a.key.localeCompare(b.key));
}

/** The words a unit's challenge asks to type: the ebook's "Hoàn thành câu" order (same seed as make-ebook.mjs). */
export const recallWords = (f: Family, n = 4) => shuffle(f.words, f.id + "C").slice(0, Math.min(n, f.words.length));

/** The root's letters as they appear in `text`, to give as a scaffold (none if the form changes the root). */
export function rootIn(w: Word, text: string) {
  const root = w.parts.find((p) => p.k === "root");
  const t = root?.t.replace(/\(.*?\)/g, "").toLowerCase();
  return t && text.toLowerCase().includes(t) ? t : undefined;
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function fold(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim();
}
