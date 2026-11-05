// Marking, shared by the page (instant result) and the Worker (the result that is stored).
import type { Answers, AutoItem, Homework, ItemResult } from "./types";

export const answerKey = (sectionId: string, q: string) => `${sectionId}/${q}`;

/** Lowercase, trim, one space between words, straight quotes, no trailing full stop. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.。]+$/, "");
}

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const asList = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? [v] : []).map((x) => String(x).trim()).filter(Boolean);

/** Marks one question. Questions with no answer set yet (teacher still to fill in) are skipped by gradeHomework. */
export function gradeItem(sectionId: string, item: AutoItem, raw: string | string[] | undefined): ItemResult {
  const given = asList(raw);
  const max = item.type === "multi" ? item.answer.length : 1;
  const base = {
    sectionId,
    q: item.q,
    value: given.join(", "),
    max,
    expected: item.answer.join(item.type === "word" ? " / " : ", "),
    explain: item.explain,
  };
  if (!given.length) return { ...base, correct: false, marks: 0, code: "BLANK" };

  if (item.type === "multi") {
    const want = new Set(item.answer.map(normalize));
    // Choosing more options than asked scores only the first N, as on the real test.
    const marks = [...new Set(given.map(normalize))].slice(0, max).filter((g) => want.has(g)).length;
    return { ...base, correct: marks === max, marks, code: marks === max ? undefined : item.code };
  }

  const value = normalize(given[0]);
  const accepted = item.answer.map(normalize);
  if (item.type === "choice") {
    const ok = accepted.includes(value);
    return { ...base, correct: ok, marks: ok ? 1 : 0, code: ok ? undefined : item.code };
  }

  // word
  if (item.maxWords && wordCount(value) > item.maxWords && !accepted.includes(value))
    return { ...base, correct: false, marks: 0, code: "E5", hint: `Quá số từ cho phép (tối đa ${item.maxWords})` };
  if (accepted.includes(value)) return { ...base, correct: true, marks: 1 };
  const near = accepted.some((a) => a.length >= 4 && editDistance(a, value) <= (a.length >= 8 ? 2 : 1));
  if (near) return { ...base, correct: false, marks: 0, code: "E5", hint: "Gần đúng: kiểm tra lại chính tả" };
  return { ...base, correct: false, marks: 0, code: item.code };
}

/** Marks every auto-marked question of a homework. Open and Writing sections are marked by the teacher. */
export function gradeHomework(hw: Homework, answers: Answers) {
  const items: ItemResult[] = [];
  for (const s of hw.sections) {
    if (s.kind !== "auto") continue;
    for (const it of s.items) {
      if (!it.answer.length) continue;
      items.push(gradeItem(s.id, it, answers[answerKey(s.id, it.q)]));
    }
  }
  const score = items.reduce((n, r) => n + r.marks, 0);
  const total = items.reduce((n, r) => n + r.max, 0);
  return { items, score, total };
}

/** The homework without answers, explanations or codes: what a student may see before submitting. */
export function publicHomework(hw: Homework): Homework {
  return {
    ...hw,
    sections: hw.sections.map((s) =>
      s.kind === "auto" ? { ...s, items: s.items.map(({ q, label, type, options, maxWords, answer }) => ({ q, label, type, options, maxWords, answer: type === "multi" ? answer.map(() => "") : [] })) } : s,
    ),
  };
}

/** How many options a "choose N" question asks for (publicHomework keeps the count, not the answers). */
export const chooseCount = (it: AutoItem) => Math.max(1, it.answer.length);
