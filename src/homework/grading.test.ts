// Run with: node --test src/homework/grading.test.ts   (Node 22+ runs TypeScript directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeItem, gradeHomework, publicHomework } from "./grading.ts";
import type { Homework } from "./types.ts";

test("choice: case-insensitive, wrong answer keeps the suggested code", () => {
  const it = { q: "25", type: "choice" as const, options: ["A", "G", "H"], answer: ["G"], code: "T3" };
  assert.equal(gradeItem("s1", it, "g").correct, true);
  const r = gradeItem("s1", it, "H");
  assert.equal(r.correct, false);
  assert.equal(r.code, "T3");
});

test("blank answers get BLANK", () => {
  const r = gradeItem("s1", { q: "1", type: "word", answer: ["bulbs"] }, "  ");
  assert.equal(r.code, "BLANK");
  assert.equal(r.marks, 0);
});

test("multi: any order, one mark per correct option, extra choices ignored", () => {
  const it = { q: "17-18", type: "multi" as const, options: ["A", "B", "C", "D", "E"], answer: ["C", "E"], code: "T6" };
  assert.deepEqual([gradeItem("s", it, ["E", "C"]).marks, gradeItem("s", it, ["E", "C"]).correct], [2, true]);
  assert.equal(gradeItem("s", it, ["B", "C"]).marks, 1);
  assert.equal(gradeItem("s", it, ["B", "D", "C"]).marks, 0);
});

test("word: variants, word limit, near-miss spelling", () => {
  const it = { q: "4", type: "word" as const, answer: ["garage"], maxWords: 1, code: "E1" };
  assert.equal(gradeItem("s", it, "Garage.").correct, true);
  const spell = gradeItem("s", it, "garrage");
  assert.equal(spell.code, "E5");
  assert.match(spell.hint!, /chính tả/);
  const long = gradeItem("s", { ...it, answer: ["bridge"] }, "stone bridge");
  assert.match(long.hint!, /Quá số từ/);
  assert.equal(gradeItem("s", it, "farm").code, "E1");
});

test("gradeHomework skips questions with no answer set, and publicHomework hides answers", () => {
  const hw: Homework = {
    lesson: "L6", classId: "l3-1", title: "t", date: "2026-10-31", due: "2026-11-03T18:00:00+07:00", status: "approved",
    sections: [
      { id: "s1", kind: "auto", skill: "Listening", qtype: "Matching", test: "Cam 21 Test 3 Part 3", items: [
        { q: "25", type: "choice", options: ["G", "H"], answer: ["G"], explain: "secret" },
        { q: "26", type: "choice", options: ["A", "B"], answer: [] },
        { q: "27-28", type: "multi", options: ["A", "B", "C"], answer: ["A", "C"] },
      ] },
      { id: "s2", kind: "open", title: "Paraphrase", items: [{ q: "1", prompt: "…" }] },
    ],
  };
  const g = gradeHomework(hw, { "s1/25": "G", "s1/27-28": ["A"] });
  assert.deepEqual([g.score, g.total, g.items.length], [2, 3, 2]);
  const pub = JSON.stringify(publicHomework(hw));
  assert.ok(!pub.includes("secret"));
  assert.ok(!pub.includes('"G"],"explain'));
  const multi = (publicHomework(hw).sections[0] as any).items[2];
  assert.equal(multi.answer.length, 2);
  assert.ok(multi.answer.every((a: string) => a === ""));
});
