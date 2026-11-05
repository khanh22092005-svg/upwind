#!/usr/bin/env node
// Brings the class's results from before the site (Google Doc homework) into /homework/, so every student's
// "Sổ lỗi" carries on. Input: the Scores and Errors tabs of the "UpWind L3-1 Error Log (auto)" Google Sheet,
// exported as JSON { Scores: [[header…], …rows], Errors: [[header…], …rows] } (student data: keep it out of the repo).
//
//   TEACHER_CODE=… node tools/homework/import-history.mjs log.json homework/content/l3-1/history-lessons.json https://upwind.asia
//
// For each lesson in history-lessons.json:
//   - "archived" lessons get a placeholder homework (one section per test, no questions) so they show in the lists;
//   - lessons that already exist on the site (e.g. L6) keep their content, and wrong answers are matched to its sections.
// Then one imported submission per student per lesson with at least one graded test: the score as graded, a summary
// row per test (graded / not done / incomplete), and every wrong answer with the teacher's note. Re-running replaces them.
import fs from "node:fs";

const [dataFile, lessonsFile, base = "http://localhost:8787"] = process.argv.slice(2);
if (!dataFile || !lessonsFile) {
  console.error("Usage: TEACHER_CODE=… node tools/homework/import-history.mjs <log.json> <history-lessons.json> [base-url]");
  process.exit(1);
}
const code = process.env.TEACHER_CODE;
if (!code) throw new Error("Set TEACHER_CODE");

const { classId, lessons } = JSON.parse(fs.readFileSync(lessonsFile, "utf8"));
const raw = JSON.parse(fs.readFileSync(dataFile, "utf8"));
const table = (rows) => {
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").toString().trim()])));
};
const scores = table(raw.Scores);
const errors = table(raw.Errors);
const plainTest = (t) => t.replace(/\s*\(Q[^)]*\)\s*$/, "").trim();
// Spreadsheet exports turn numbers into "1995.0"; answers and question numbers are text.
const clean = (v) => String(v ?? "").replace(/^(\d+)\.0$/, "$1");
// Notes in the Scores tab are partly English; students see them in Vietnamese.
const NOTES = [
  [/^First attempt$/, "Tính lần làm đầu"],
  [/^Question 1 and 2 \(gap analysis\) not done$/, "Chưa làm Question 1 và 2 (phân tích chỗ trống)"],
  [/^Question 1 and 2 not done$/, "Chưa làm Question 1 và 2"],
  [/^Question (\d) not done$/, "Chưa làm Question $1"],
  [/^Bonus outline not done$/, "Chưa làm phần Bonus outline"],
  [/^Paraphrase practice not done$/, "Chưa làm phần Paraphrase"],
  [/^3 blanks: Q3, Q5, Q9$/, "Bỏ trống câu 3, 5, 9"],
  [/^Outline to P4 only, no answers$/, "Mới outline đến P4, chưa có đáp án"],
  [/^Answers not final; Q7, 11, 12, 13 blank$/, "Chưa chốt đáp án; bỏ trống câu 7, 11, 12, 13"],
  [/^Outline and keywords only, no answers$/, "Mới có outline và keyword, chưa có đáp án"],
  [/^Q29, Q30 not done$/, "Chưa làm câu 29, 30"],
  [/^No .* tab for L2 in the homework doc$/, "Không có tab bài này trong file bài tập"],
  [/^Tab is empty.*$/, "Tab còn trống"],
];
const vnNote = (n) => NOTES.reduce((t, [re, vi]) => t.replace(re, vi), n || "") || undefined;
const num = (v) => (v === "" ? null : Math.round(Number(v)));

// ---- API ----
const login = await fetch(`${base}/api/teacher/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
if (!login.ok) throw new Error(`Teacher login failed (${login.status})`);
const cookie = login.headers.get("set-cookie").split(";")[0];
async function api(method, path, body) {
  const res = await fetch(`${base}/api${path}`, { method, headers: { "content-type": "application/json", cookie }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${data.error || ""}`);
  return data;
}

const { students } = await api("GET", "/teacher/classes");
const names = new Set(students.filter((s) => s.class_id === classId && s.active).map((s) => s.name));
const missing = [...new Set(scores.map((r) => r.Student))].filter((n) => !names.has(n));
if (missing.length) throw new Error(`Add these students on the Lớp tab first: ${missing.join(", ")}`);

let subs = 0,
  errs = 0;
for (const L of lessons) {
  const rows = scores.filter((r) => r.Lesson === L.lesson);
  let hw;
  if (L.archived) {
    const tests = [...new Map(rows.map((r) => [plainTest(r.Test), r])).values()];
    hw = {
      lesson: L.lesson, classId, title: L.title, date: L.date, due: L.due, status: "approved", archived: true,
      sections: tests.map((r, i) => {
        const qtype = errors.find((e) => e.Lesson === L.lesson && plainTest(e.Test) === plainTest(r.Test))?.["Question type"] || r.Part;
        return { id: `s${i + 1}`, kind: "auto", skill: r.Skill, qtype, test: plainTest(r.Test), items: [] };
      }),
    };
    await api("PUT", `/teacher/hw/${classId}/${L.lesson}`, { homework: hw });
  } else {
    hw = (await api("GET", `/teacher/hw/${classId}/${L.lesson}`)).homework;
  }
  const sectionFor = (test, q) => {
    const cands = hw.sections.filter((s) => s.kind === "auto" && plainTest(s.test) === plainTest(test));
    return (cands.find((s) => s.items.some((it) => it.q === q)) || cands[0])?.id;
  };

  for (const student of [...new Set(rows.map((r) => r.Student))]) {
    const mine = rows.filter((r) => r.Student === student);
    const graded = mine.filter((r) => r.Status === "Graded");
    if (!graded.length) continue;
    const late = graded.some((r) => (r["Người chấm"] || "").startsWith("Claude"));
    const due = new Date(L.due || hw.due);
    const submittedAt = new Date(due.getTime() + (late ? 24 : -1) * 3600_000).toISOString();
    const wrong = errors
      .filter((e) => e.Lesson === L.lesson && e.Student === student)
      .map((e) => ({
        sectionId: sectionFor(e.Test, clean(e.Q)),
        q: clean(e.Q),
        value: clean(e["Student answer"]),
        expected: clean(e["Correct answer"]),
        explain: e["Teacher note (full)"].replace(/^\[Nộp muộn · Claude chấm, cô chưa xem\]\s*/, ""),
        code: e.Code,
      }));
    const lost = wrong.filter((w) => !w.sectionId);
    if (lost.length) throw new Error(`${L.lesson} ${student}: no section for ${lost.map((w) => w.q).join(", ")}`);
    await api("POST", "/teacher/import", {
      classId, lesson: L.lesson, student, submittedAt, late,
      score: graded.reduce((n, r) => n + num(r.Correct), 0),
      total: graded.reduce((n, r) => n + num(r.Total), 0),
      summary: mine.map((r) => ({ test: plainTest(r.Test), skill: r.Skill, score: num(r.Correct), total: num(r.Total), status: r.Status, note: vnNote(r.Note), grader: r["Người chấm"] || undefined })),
      errors: wrong,
    });
    subs++;
    errs += wrong.length;
  }
  console.log(`${L.lesson}: done`);
}
console.log(`Imported ${subs} submissions with ${errs} wrong answers.`);
