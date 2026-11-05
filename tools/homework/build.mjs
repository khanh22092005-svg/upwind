#!/usr/bin/env node
// Builds a homework (JSON for /homework/) from a short answer sheet the teacher can write in a few minutes.
//
//   node tools/homework/build.mjs homework/content/l3-1/L7.txt            # writes L7.json next to it
//   node tools/homework/build.mjs L7.txt --upload https://upwind.asia     # also uploads it as a draft
//                                                                         # (needs TEACHER_CODE in the environment)
//
// Answer sheet format (lines starting with # are comments):
//
//   class: l3-1
//   lesson: L7
//   title: Reading: Matching
//   date: 2026-11-03
//   due: 2026-11-07 18:00            (Vietnam time)
//
//   ## Reading | Matching headings | Cam 20 Test 3 Passage 2 | https://engnovate.com/... | options i-vii
//   > Optional instructions shown above the questions
//   14 Section A = v | explanation shown to students who get it wrong | T1
//   15 = ii
//   17-18 = C, E                     (two answers → "choose TWO")
//
//   ## Listening | Gap-filling | Cam 16 Test 4 Part 1 | https://... | words 1
//   4 = garage | explanation | E5
//   6 = parking / parking spaces     (accepted spellings separated by /)
//   9 =                              (answer left empty: the teacher fills it in on the site)
//
//   ## open | Paraphrase practice
//   1 Sleep loss makes it harder to concentrate.
//
//   ## writing | Task 2 | Some people think… Discuss both views. | 250
import fs from "node:fs";
import path from "node:path";

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];
function optionRange(spec) {
  const m = spec.match(/^([a-z]+)\s*-\s*([a-z]+)$/i);
  if (!m) return spec.split(/[,\s]+/).filter(Boolean);
  const [a, b] = [m[1], m[2]];
  if (ROMAN.includes(a.toLowerCase())) return ROMAN.slice(ROMAN.indexOf(a.toLowerCase()), ROMAN.indexOf(b.toLowerCase()) + 1);
  const out = [];
  for (let c = a.toUpperCase().charCodeAt(0); c <= b.toUpperCase().charCodeAt(0); c++) out.push(String.fromCharCode(c));
  return out;
}

function vietnamIso(s) {
  const m = s.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (!m) throw new Error(`due: "${s}" is not "YYYY-MM-DD HH:MM"`);
  return `${m[1]}T${(m[2] || "23").padStart(2, "0")}:${m[3] || "59"}:00+07:00`;
}

export function parseSheet(text) {
  const meta = {};
  const sections = [];
  let cur = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") && !line.startsWith("##")) continue;
    if (line.startsWith("##")) {
      const parts = line.slice(2).split("|").map((p) => p.trim());
      const id = `s${sections.length + 1}`;
      if (parts[0].toLowerCase() === "open") cur = { id, kind: "open", title: parts[1] || "Bài tập", items: [] };
      else if (parts[0].toLowerCase() === "writing")
        cur = { id, kind: "writing", title: parts[1] || "Writing", prompt: parts[2] || "", minWords: parts[3] ? Number(parts[3]) : undefined };
      else {
        const [skill, qtype, test, ...rest] = parts;
        cur = { id, kind: "auto", skill, qtype, test, items: [], _opts: undefined, _words: undefined };
        for (const r of rest) {
          if (/^https?:\/\//.test(r)) cur.link = r;
          else if (/^options\s+/i.test(r)) cur._opts = optionRange(r.replace(/^options\s+/i, ""));
          else if (/^words\s+\d+/i.test(r)) cur._words = Number(r.match(/\d+/)[0]);
        }
      }
      sections.push(cur);
      continue;
    }
    if (!cur) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m) meta[m[1].toLowerCase()] = m[2].trim();
      continue;
    }
    if (line.startsWith(">")) {
      cur.instructions = [cur.instructions, line.slice(1).trim()].filter(Boolean).join(" ");
      continue;
    }
    if (cur.kind === "open") {
      const m = line.match(/^(\S+)\s+(.*)$/);
      if (m) cur.items.push({ q: m[1], prompt: m[2] });
      continue;
    }
    if (cur.kind !== "auto") continue;
    // 14 Section A = v | explanation | T1
    const m = line.match(/^(\d+(?:-\d+)?)\s*(.*?)\s*=\s*(.*)$/);
    if (!m) throw new Error(`Cannot read line: "${line}"`);
    const [, q, label, rest] = m;
    const [ans = "", explain = "", code = ""] = rest.split("|").map((p) => p.trim());
    const isWord = cur._words !== undefined || (!cur._opts && !/^[A-Za-z]{1,4}(\s*,\s*[A-Za-z]{1,4})*$/.test(ans || "A"));
    let item;
    if (isWord) item = { q, type: "word", answer: ans ? ans.split("/").map((x) => x.trim()).filter(Boolean) : [], maxWords: cur._words };
    else {
      const answer = ans ? ans.split(/\s*,\s*/).filter(Boolean) : [];
      const multi = answer.length > 1 || q.includes("-");
      item = { q, type: multi ? "multi" : "choice", options: cur._opts, answer };
      if (multi && !answer.length) throw new Error(`${q}: a "choose TWO" question needs its answers (e.g. "C, E")`);
    }
    if (label) item.label = label;
    if (explain) item.explain = explain;
    if (code) item.code = code.toUpperCase();
    cur.items.push(item);
  }
  for (const s of sections) {
    delete s._opts;
    delete s._words;
  }
  for (const k of ["class", "lesson", "title", "date", "due"]) if (!meta[k]) throw new Error(`Missing "${k}:" at the top of the sheet`);
  return { lesson: meta.lesson, classId: meta.class, title: meta.title, date: meta.date, due: vietnamIso(meta.due), status: "draft", sections };
}

async function main() {
  const [file, ...args] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: node tools/homework/build.mjs <answer-sheet.txt> [--upload https://upwind.asia]");
    process.exit(1);
  }
  const hw = parseSheet(fs.readFileSync(file, "utf8"));
  const out = file.replace(/\.txt$/, ".json");
  fs.writeFileSync(out, JSON.stringify(hw, null, 2) + "\n");
  const missing = hw.sections.flatMap((s) => (s.kind === "auto" ? s.items.filter((i) => !i.answer.length).map((i) => `${s.test} Q${i.q}`) : []));
  console.log(`Wrote ${path.relative(process.cwd(), out)}: ${hw.sections.length} sections${missing.length ? `; no answer yet: ${missing.join(", ")}` : ""}`);

  const i = args.indexOf("--upload");
  if (i >= 0) {
    const base = args[i + 1] || "https://upwind.asia";
    const code = process.env.TEACHER_CODE;
    if (!code) throw new Error("Set TEACHER_CODE to upload");
    const login = await fetch(`${base}/api/teacher/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    if (!login.ok) throw new Error(`Teacher login failed (${login.status})`);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const res = await fetch(`${base}/api/teacher/hw/${hw.classId}/${hw.lesson}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ homework: hw }),
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
    console.log(`Uploaded as a draft: ${base}/homework/#/giao-vien/bai/${hw.lesson}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => (console.error(e.message), process.exit(1)));
