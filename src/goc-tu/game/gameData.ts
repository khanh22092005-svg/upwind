// Data for the new lesson format (game brief "Học Từ, Từ Gốc"): hand-written per root in
// tools/social-content/data/game/<id>.json, plus one shared table of prefix arrows.
import dir from "../../../tools/social-content/data/game/affix-dir.json";
import voc from "../../../tools/social-content/data/game/voc.json";

export type Morph = {
  word: string;
  s: string;
  alt?: string;
  options?: string[];
  type?: boolean;
  dir?: "full" | "symbol";
  ok: string;
  why: Record<string, string>;
  hint1?: string;
  hint2?: string;
};
export type Duel = { pair: [string, string]; a: string; b: string; alt?: [string, string]; why: string; share: string };
export type GameLesson = {
  id: string;
  blind: { s: string; options: string[]; why: string };
  morph: Morph[];
  words: Record<string, { drift?: string; lure?: string }>;
  duels: Duel[];
};

export const PRE = dir.pre as Record<string, { sym: string; vi: string }>;
export const SUF = dir.suf as Record<string, { pos: string; vi: string }>;

const lessons = [voc] as unknown as GameLesson[];
export const gameLesson = (id: string) => lessons.find((l) => l.id === id);
export const hasGame = (id: string) => lessons.some((l) => l.id === id);

/** "The old song [e]voked memories." -> { before: "The old song ", answer: "e", after: "voked memories." } */
export function blankOf(s: string) {
  const m = s.match(/^(.*?)\[(.+?)\](.*)$/);
  return m ? { before: m[1], answer: m[2], after: m[3] } : { before: s, answer: "", after: "" };
}
export const fill = (s: string) => s.replace(/\[(.+?)\]/, "$1");

/** Letters glued to the blank on each side: "The old song " + [e] + "voked memories" -> "", "voked". */
export function glued(before: string, after: string) {
  const l = before.match(/[A-Za-z]+$/)?.[0] ?? "";
  const r = after.match(/^[A-Za-z]+/)?.[0] ?? "";
  return { l, r, before: before.slice(0, before.length - l.length), after: after.slice(r.length) };
}

// How each prefix arrow moves a piece into its slot (and the other way when it bounces out).
const MOVE: Record<string, { x?: number; y?: number; rotate?: number; scale?: number }> = {
  "→": { x: -60 },
  "⇢": { x: -90 },
  "↓": { y: -60 },
  "⇣": { y: -60 },
  "↺": { rotate: -200, scale: 0.4 },
  "+": { scale: 0.2 },
  "=": { x: 60 },
  "⇉": { x: -60 },
  "⤵": { y: -50, x: -30 },
};
export function moveFor(piece: string) {
  const sym = PRE[piece]?.sym;
  return (sym && MOVE[sym]) || { y: 40 };
}
