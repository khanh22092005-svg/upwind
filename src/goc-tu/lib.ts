// TS ports of the helpers in tools/word-roots/lib/common.mjs and make-handbook.mjs,
// so the practice questions and answers match the printed handbook.
import { allWords, type Family, type PartKind } from "./data";

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

const stemRe = (word: string) => {
  const stem = word.replace(/e$/, "").slice(0, Math.max(4, word.length - 2));
  return new RegExp(`\\b(${stem}[a-z]*)`, "i");
};
/** The form of `word` used in `sentence` ("evoked"), or the word itself. */
export const formIn = (sentence: string, word: string) => sentence.match(stemRe(word))?.[1] ?? word;
/** Split a sentence around the target word: [before, form, after]. */
export function splitAt(sentence: string, word: string): [string, string, string] {
  const m = sentence.match(stemRe(word));
  if (!m || m.index === undefined) return [sentence, "", ""];
  return [sentence.slice(0, m.index), m[1], sentence.slice(m.index + m[1].length)];
}

/** Deterministic shuffle, identical to make-handbook.mjs, so the PDF and the app ask the same questions. */
export function shuffle<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  let s = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
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

/** Practice set for one family: the handbook's 5 gap-fill sentences + word bank, then 3 meaning questions. */
export function practiceFor(f: Family) {
  const gaps = shuffle(f.words, f.id).slice(0, Math.min(5, f.words.length));
  const bank = shuffle(f.words.map((w) => w.word), f.id + "bank");
  const mcq = shuffle(f.words, f.id + "mcq")
    .slice(0, 3)
    .map((w) => {
      const others = shuffle(f.words.filter((o) => o.word !== w.word), w.word).slice(0, 3);
      return { w, options: shuffle([w, ...others], w.word + "opt").map((o) => o.meaning) };
    });
  return { gaps, bank, mcq };
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function fold(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim();
}
