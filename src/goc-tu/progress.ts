// Progress kept in this browser (localStorage). Every item carries updatedAt so a later
// account sync (step 2) can merge guest progress into an account without losing anything.
import { useSyncExternalStore } from "react";
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from "ts-fsrs";
import { todayKey } from "./lib";

const KEY = "upwind-goc-tu-v1";

export type ChapterRec = { step: number; best?: number; total?: number; doneAt?: number; updatedAt: number };
export type CardRec = { card: Card; lapses: number; reviews: number; updatedAt: number };
export type Progress = {
  version: 1;
  chapters: Record<string, ChapterRec>;
  cards: Record<string, CardRec>;
  days: string[];
  /** words met as "quả lạ" on another branch (word -> time); optional, so v1 data still loads */
  seen?: Record<string, number>;
};

const empty = (): Progress => ({ version: 1, chapters: {}, cards: {}, days: [] });

// Spaced review: no same-day learning steps ("Quên" is re-asked inside the session instead).
export const scheduler = fsrs(generatorParameters({ enable_short_term: false, enable_fuzz: true }));

function reviveCard(c: Card): Card {
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined };
}

function load(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null") as Progress | null;
    if (!p || p.version !== 1) return empty();
    for (const r of Object.values(p.cards)) r.card = reviveCard(r.card);
    return { ...empty(), ...p };
  } catch {
    return empty();
  }
}

let state: Progress = typeof localStorage === "undefined" ? empty() : load();
const listeners = new Set<() => void>();

function commit(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / full storage: keep working in memory */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined")
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });

export const progressStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
export const useProgress = () => useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.get);

const markToday = (days: string[]) => (days.includes(todayKey()) ? days : [...days, todayKey()].slice(-400));

/** Remember how far into a chapter the learner got (only moves forward until the chapter is done). */
export function saveStep(id: string, step: number) {
  const ch = state.chapters[id];
  if (ch?.doneAt || (ch && ch.step >= step)) return;
  commit({ ...state, chapters: { ...state.chapters, [id]: { ...ch, step, updatedAt: Date.now() } } });
}

/** Chapter finished: keep the best score and put its words into the review schedule. */
export function completeChapter(id: string, words: string[], score: number, total: number) {
  const now = new Date();
  const ch = state.chapters[id];
  const cards = { ...state.cards };
  for (const w of words)
    if (!cards[w]) {
      // Learning the word in the chapter counts as a first "Nhớ" review.
      const card = scheduler.next(createEmptyCard(now), now, Rating.Good).card;
      cards[w] = { card, lapses: 0, reviews: 0, updatedAt: now.getTime() };
    }
  const better = ch?.best === undefined || score >= ch.best;
  commit({
    ...state,
    cards,
    days: markToday(state.days),
    chapters: {
      ...state.chapters,
      [id]: {
        step: 0,
        best: better ? score : ch!.best,
        total,
        doneAt: now.getTime(),
        updatedAt: now.getTime(),
      },
    },
  });
}

/** Restart a finished chapter from the top without losing its best score. */
export function restartChapter(id: string) {
  const ch = state.chapters[id];
  if (!ch) return;
  commit({ ...state, chapters: { ...state.chapters, [id]: { ...ch, step: 0, updatedAt: Date.now() } } });
}

export function gradeWord(word: string, grade: Grade) {
  const rec = state.cards[word];
  if (!rec) return;
  const now = new Date();
  const card = scheduler.next(rec.card, now, grade).card;
  commit({
    ...state,
    days: markToday(state.days),
    cards: {
      ...state.cards,
      [word]: { card, reviews: rec.reviews + 1, lapses: rec.lapses + (grade === Rating.Again ? 1 : 0), updatedAt: now.getTime() },
    },
  });
}

/** A word met as "quả lạ" (strange fruit) in another unit's challenge. */
export function markSeen(word: string) {
  if (state.seen?.[word] || state.cards[word]) return;
  commit({ ...state, seen: { ...state.seen, [word]: Date.now() } });
}

export const resetProgress = () => commit(empty());

export type LeafState = "bare" | "seen" | "growing" | "learned" | "strong" | "due";
/** What a word's leaf on the tree looks like. */
export function leafState(p: Progress, word: string, growing = false, now = Date.now()): LeafState {
  const r = p.cards[word];
  if (r) {
    if (r.card.due.getTime() <= now) return "due";
    return r.reviews >= 3 || r.card.stability >= 21 ? "strong" : "learned";
  }
  if (growing) return "growing";
  return p.seen?.[word] ? "seen" : "bare";
}

export function dueWords(p: Progress, now = new Date()) {
  return Object.entries(p.cards)
    .filter(([, r]) => r.card.due.getTime() <= now.getTime())
    .sort((a, b) => a[1].card.due.getTime() - b[1].card.due.getTime())
    .map(([w]) => w);
}

export function nextDue(p: Progress) {
  const t = Object.values(p.cards).map((r) => r.card.due.getTime());
  return t.length ? new Date(Math.min(...t)) : null;
}

/** Consecutive days with activity, ending today (or yesterday, so the streak is not lost before you study). */
export function streak(p: Progress) {
  const set = new Set(p.days);
  const d = new Date();
  if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(todayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const stars = (score: number, total: number) => (score >= total ? 3 : score >= total - 2 ? 2 : 1);

export { Rating };
