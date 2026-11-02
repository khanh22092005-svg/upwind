// Bridges between branches: words in OTHER units that share a prefix (or suffix) with a word.
import { allWords, type Family, type Part, type Word } from "./data";
import { shuffle } from "./lib";

export const affixKey = (p: Part) => p.t.replace(/[()]/g, "").toLowerCase();

const index = new Map<string, { family: Family; w: Word }[]>();
for (const x of allWords)
  for (const p of x.w.parts)
    if (p.k !== "root") {
      const k = p.k + ":" + affixKey(p);
      index.set(k, [...(index.get(k) ?? []), x]);
    }

/** Other-unit words that share this part (prefix or suffix). */
export function bridgesFor(part: Part, from: Family) {
  return (index.get(part.k + ":" + affixKey(part)) ?? []).filter((x) => x.family.id !== from.id);
}

/** Up to n "quả lạ" for a unit's challenge: words from other branches that share one of this unit's prefixes
 * (suffixes if there are not enough), each with a different affix, plus 2 wrong meanings built from the same
 * root or the same affix, so the parts must be read to answer. */
export function strangeFruit(f: Family, n = 2) {
  const out: { family: Family; w: Word; via: Part; options: string[] }[] = [];
  const used = new Set<string>();
  for (const kind of ["pre", "suf"] as const) {
    const parts = shuffle(
      f.words.flatMap((w) => w.parts.filter((p) => p.k === kind)),
      f.id + kind,
    );
    for (const via of parts) {
      if (out.length >= n) break;
      const key = kind + ":" + affixKey(via);
      if (used.has(key)) continue;
      const cands = shuffle(bridgesFor(via, f), f.id + key).filter((x) => !out.some((o) => o.w.word === x.w.word));
      const pick = cands[0];
      if (!pick) continue;
      used.add(key);
      const sameRoot = shuffle(pick.family.words.filter((w) => w.word !== pick.w.word), pick.w.word + "r")[0];
      const sameAffix = cands.slice(1).find((x) => x.family.id !== pick.family.id)?.w;
      const wrong = [sameRoot, sameAffix]
        .filter((w): w is Word => !!w && w.meaning !== pick.w.meaning)
        .map((w) => w.meaning);
      if (wrong.length < 2) {
        const extra = shuffle(f.words, pick.w.word + "x").find((w) => w.meaning !== pick.w.meaning && !wrong.includes(w.meaning));
        if (extra) wrong.push(extra.meaning);
      }
      out.push({ ...pick, via, options: shuffle([pick.w.meaning, ...wrong.slice(0, 2)], pick.w.word + "o") });
    }
  }
  return out;
}
