// Homework content, as stored in D1 (homeworks.content) and in homework/content/<class>/<lesson>.json.
// The teacher never writes this by hand: tools/homework/build.mjs makes it from a short answer table,
// and the teacher edits answers and explanations on /homework/#/giao-vien.

/** One question that is marked automatically. */
export interface AutoItem {
  /** Question number as printed in the test, e.g. "25" or "17-18" for "choose TWO". */
  q: string;
  /** Optional label shown before the answer box, e.g. "Lyocell" or "Section A". */
  label?: string;
  /**
   * choice: one option (MCQ, matching, headings, T/F/NG)
   * multi:  choose N options, any order, 1 mark per correct option
   * word:   type the answer (gap-fill); `answer` lists every accepted spelling
   */
  type: "choice" | "multi" | "word";
  /** Options for choice/multi, e.g. ["A","B","C"] or ["i","ii","iii"]. Omit for word. */
  options?: string[];
  /** Accepted answers. choice: one entry. multi: every correct option. word: accepted variants. Empty = not set yet. */
  answer: string[];
  /** Word limit for word answers ("ONE WORD AND/OR A NUMBER" = 1). */
  maxWords?: number;
  /** The teacher's explanation, shown to every student who gets this question wrong. */
  explain?: string;
  /** Suggested error code (see codes.ts) for a wrong answer. */
  code?: string;
}

export interface OpenItem {
  q: string;
  prompt: string;
}

export type Section =
  | {
      id: string;
      kind: "auto";
      skill: "Reading" | "Listening" | "Vocabulary";
      qtype: string;
      test: string;
      link?: string;
      instructions?: string;
      items: AutoItem[];
    }
  | { id: string; kind: "open"; title: string; instructions?: string; items: OpenItem[] }
  | { id: string; kind: "writing"; title: string; prompt: string; minWords?: number };

export interface Homework {
  /** Lesson id within the class, e.g. "L6". */
  lesson: string;
  classId: string;
  title: string;
  /** Lesson date, YYYY-MM-DD. */
  date: string;
  /** Deadline, ISO 8601 with offset, e.g. "2026-11-03T18:00:00+07:00". */
  due: string;
  status: "draft" | "approved";
  /** Done on Google Doc before the site existed: shown with its imported results, cannot be submitted here. */
  archived?: boolean;
  sections: Section[];
}

/** Answers a student sends: key = `${sectionId}/${q}`. multi answers are arrays. */
export type Answers = Record<string, string | string[] | undefined>;

export interface ItemResult {
  sectionId: string;
  q: string;
  value: string;
  correct: boolean;
  marks: number;
  max: number;
  /** Correct answer for display, e.g. "G" or "C, E" or "parking". */
  expected: string;
  explain?: string;
  /** Code for the error log: BLANK for no answer, otherwise the item's suggested code. */
  code?: string;
  /** Short hint, e.g. "Gần đúng: kiểm tra chính tả" or "Quá số từ cho phép". */
  hint?: string;
}
