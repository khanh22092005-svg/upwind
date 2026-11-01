#!/usr/bin/env node
// The UpWind word-root ebook (A4 PDF): 40 roots, word cards with collocations and word families,
// Obsidian-style maps, a reading text and six kinds of practice per chapter, spaced review, tests, answer key, index.
//   node make-ebook.mjs              -> out/ebook/upwind-giai-ma-tu-vung.pdf (+ .html)
//   node make-ebook.mjs voc,graph    -> only these chapters (quick layout check)
//
// Data: data/families.json (the video families) + data/ebook/<id>.json (ebook extras, or a whole new family)
// + data/ebook/order.json (parts and chapter order).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { ROOT_DIR, OUT_DIR, COLORS, loadFamilies, esc, ensureDir } from "./lib/common.mjs";
import { globalMap, prefixesOf, canonPrefix } from "./lib/ebook-map.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const TITLE = "Giải mã từ vựng IELTS bằng từ gốc";
const SUB = "Từ vựng học thuật cho IELTS band 5.5 → 7.0+ · 40 gốc từ · collocation · họ từ · bài tập Reading, Writing, Speaking có đáp án";
const DATA = path.join(ROOT_DIR, "data", "ebook");
const only = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2].split(",") : null;

/* ---------------- data ---------------- */
const base = new Map(loadFamilies().map((f) => [f.id, f]));
const order = JSON.parse(fs.readFileSync(path.join(DATA, "order.json"), "utf8"));
const TOPICS = order.topics;
const problems = [];
const chapters = [];
order.parts.forEach((part, pi) =>
  part.ids.forEach((id) => {
    if (only && !only.includes(id)) return;
    const file = path.join(DATA, id + ".json");
    if (!fs.existsSync(file)) return problems.push(`${id}: no data/ebook/${id}.json`);
    const extra = JSON.parse(fs.readFileSync(file, "utf8"));
    let ch;
    if (Array.isArray(extra.words)) ch = { ...extra };
    else {
      const f = base.get(id);
      if (!f) return problems.push(`${id}: not in families.json and no words[]`);
      ch = { ...f, ...extra, words: f.words.map((w) => ({ ...w, ...(extra.words?.[w.word] ?? {}) })) };
    }
    ch.part = pi;
    chapters.push(ch);
  })
);
chapters.forEach((c, i) => (c.n = i + 1));
const allWords = chapters.flatMap((c) => c.words.map((w) => ({ ...w, ch: c })));

for (const c of chapters) {
  for (const k of ["reading", "wf", "err", "write", "pa", "syn"]) if (!c[k]) problems.push(`${c.id}: missing ${k}`);
  for (const w of c.words) {
    for (const k of ["ipa", "meaning", "story", "example", "example_vi", "forms", "col", "tp"]) if (!w[k]) problems.push(`${c.id}/${w.word}: missing ${k}`);
    const joined = w.parts.map((p) => p.t.replace(/\(.*?\)/g, "")).join("").toLowerCase();
    if (joined !== w.word.toLowerCase()) problems.push(`${c.id}/${w.word}: parts join to "${joined}"`);
    if (w.tp && !TOPICS[w.tp]) problems.push(`${c.id}/${w.word}: unknown topic ${w.tp}`);
  }
}

/* ---------------- helpers ---------------- */
const seeded = (seed) => {
  let s = [...String(seed)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
};
const shuffle = (arr, seed) => {
  const a = [...arr], r = seeded(seed);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const L = "abcd";
const en = (t) => esc(t).replace(/\{\{(.+?)\}\}/g, "<b class='en'>$1</b>");
const shortRoot = (c) => c.root.split("/")[0].trim();

/** All spellings of a word we may meet in text: the word, its forms, related words. */
function spellings(w) {
  const list = [w.word, ...Object.values(w.forms ?? {}).flatMap((v) => v.split(",")), ...(w.related ?? []).map((r) => r.w)];
  return [...new Set(list.map((s) => s.replace(/\(.*?\)/g, "").trim().toLowerCase()).filter(Boolean))];
}
const stemOf = (s) => s.replace(/e$/, "").slice(0, Math.max(4, s.length - 2));
/** Regex that finds any form of the word (provoke, provoked, provocative...). */
function formRe(w, flags = "i") {
  const stems = [...new Set(spellings(w).filter((s) => !s.includes(" ")).map(stemOf))].sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(${stems.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[a-z]*`, flags);
}
const coloredWord = (w) => w.parts.map((p) => `<span style="color:${COLORS[p.k]}">${esc(p.t)}</span>`).join("");
const partsLine = (w) =>
  w.parts.map((p) => `<span class="pt" style="--c:${COLORS[p.k]}"><b>${esc(p.t)}</b>${p.vi ? `<small>${esc(p.vi)}</small>` : ""}</span>`).join('<span class="plus">+</span>');
const POS = { n: "n.", v: "v.", adj: "adj.", adv: "adv." };

/* ---------------- chapter ---------------- */
const answers = [];
let totalEx = 0;
const TIPS = [
  "Trong IELTS Reading, đừng dừng lại ở từ lạ. Tách tiền tố và gốc để đoán hướng nghĩa, rồi kiểm tra bằng câu xung quanh.",
  "Đề IELTS hầu như không lặp lại từ trong bài đọc: câu hỏi dùng paraphrase. Họ từ (noun ↔ verb ↔ adjective) là kiểu paraphrase hay gặp nhất.",
  "Với TRUE / FALSE / NOT GIVEN: FALSE là bài nói điều ngược lại; NOT GIVEN là bài không hề nhắc tới. Đừng dùng kiến thức bên ngoài.",
  "Band 7 Lexical Resource yêu cầu dùng “từ ít phổ biến” và “ý thức về collocation”. Một collocation đúng giá trị hơn một từ khó dùng sai.",
  "Trong Writing Task 2, thay động từ chung chung (make, do, get) bằng động từ chính xác: provoke a reaction, conduct research, reach a verdict.",
  "Lỗi word form (economy / economic / economical) là lỗi phổ biến nhất khiến điểm Lexical Resource kẹt ở band 6. Luôn kiểm tra loại từ cần dùng.",
  "Ở Speaking Part 3, giám khảo đánh giá khả năng nói về ý tưởng trừu tượng. Collocation học thuật giúp câu trả lời nghe tự nhiên và chính xác hơn.",
  "Trong Writing Task 1, động từ chỉ xu hướng (reduce, exceed, recede, sustain) giúp bạn mô tả biểu đồ mà không lặp lại increase / decrease.",
  "Câu hỏi IELTS Listening thường paraphrase bằng từ cùng gốc: nghe thấy “the inspection” khi đề viết “check”. Nghe theo nghĩa, không chỉ theo âm.",
  "Đừng nhồi từ hiếm vào bài viết. Giám khảo chấm độ chính xác: từ đúng nghĩa, đúng collocation, đúng dạng.",
];
/* Skill focus per question type, from the UpWind Student Roadmap (sheet "Roadmap v2"). */
const SKILL = {
  gap: { name: "Summary completion", wk: "Roadmap tuần 1 · Gap filling", tip: "Đọc câu trước khi đọc bài: đoán chỗ trống cần loại từ gì (danh từ? động từ? số?) và nội dung gì. Lỗi hay gặp: chọn từ không hợp ngữ cảnh, và lạc vị trí thông tin. Gạch chân từ khoá rồi dò đúng đoạn." },
  sent: { name: "Sentence completion", wk: "Roadmap tuần 1 · Gap filling", tip: "Đáp án phải khớp ngữ pháp của câu và đúng giới hạn NO MORE THAN TWO WORDS. Câu hỏi là paraphrase của bài: tìm từ cùng nghĩa, không tìm từ y hệt." },
  mcq: { name: "Multiple choice", wk: "Roadmap tuần 2 · MCQ", tip: "4 bẫy cốt lõi: trùng từ nhưng sai ngữ cảnh, khái quát quá rộng hoặc quá hẹp, nghĩa ngược lại, có nhắc tới nhưng không trả lời câu hỏi. Loại trừ từng đáp án bằng lý lẽ, đừng chọn vì thấy trùng chữ." },
  tfng: { name: "TRUE / FALSE / NOT GIVEN", wk: "Roadmap tuần 2 · T/F/NG", tip: "FALSE là bài nói điều ngược lại; NOT GIVEN là bài không nói tới. Cẩn thận lượng từ all / most / some / only, và đừng dùng hiểu biết bên ngoài bài." },
  ynng: { name: "YES / NO / NOT GIVEN", wk: "Roadmap tuần 2 · Y/N/NG", tip: "Dạng này hỏi QUAN ĐIỂM của người viết, không phải sự thật. Phân biệt ý kiến của tác giả với ý kiến của người khác được nhắc trong bài (critics say, some argue)." },
  p1: { name: "Speaking Part 1", wk: "Roadmap tuần 5", tip: "Trả lời theo AREA: Answer – Reason – Example – Alternative. Dùng cụm tự nhiên (I'm really into…) thay cho câu dịch từng chữ." },
  p2: { name: "Speaking Part 2", wk: "Roadmap tuần 11–12", tip: "Có 1 phút chuẩn bị: ghi 5W1H và dàn câu chuyện mở đầu → diễn biến → cao trào → kết thúc. Lỗi hay gặp: liệt kê sự kiện, hết ý trước 2 phút." },
  p3: { name: "Speaking Part 3", wk: "Roadmap tuần 9–10", tip: "Trả lời từ góc nhìn xã hội, không chỉ bản thân. Luôn có lý do và ví dụ; dùng hedging (tend to, in many cases) thay cho “all people”, “definitely”." },
  opinion: { name: "Opinion essay", tip: "Nêu rõ quan điểm ở mở bài và giữ nhất quán đến kết bài. Mỗi đoạn thân bài: một ý chính, phát triển theo PEEL." },
  discussion: { name: "Discussion essay", tip: "Bàn cả hai quan điểm rồi nêu ý kiến của bạn. Dùng nhượng bộ và phản bác: Admittedly…, however…" },
  advdis: { name: "Advantages & disadvantages", tip: "Trả lời đúng câu hỏi: liệt kê lợi và hại, hay đánh giá bên nào lớn hơn? Đọc kỹ đề trước khi lên dàn ý." },
  problem: { name: "Problem & solution", tip: "Mỗi giải pháp phải khớp với một vấn đề đã nêu. Giải thích vì sao giải pháp có tác dụng, không chỉ liệt kê." },
  twopart: { name: "Two-part question", tip: "Đề có hai câu hỏi: trả lời đủ cả hai, mỗi câu một đoạn thân bài. Thiếu một phần là mất điểm Task Response." },
};
function chapterHTML(c, ci) {
  const words = c.words;
  const exs = []; // {sec, title, tag, rubric, body, ans}
  const ex = (o) => exs.push(o);
  const shortR = shortRoot(c);

  const cards = words
    .map(
      (w) => `<div class="card">
      <div class="cl">
        <div class="word">${coloredWord(w)}</div>
        <div class="ipa">${esc(w.ipa)} · <i>${esc(w.pos)}</i></div>
        <div class="parts">${partsLine(w)}</div>
      </div>
      <div class="cr">
        <div class="mean">${esc(w.meaning)}</div>
        <div class="story">${esc(w.story)}</div>
        <div class="ex">${esc(w.example).replace(formRe(w), "<mark>$&</mark>")} <span class="vi">${esc(w.example_vi)}</span></div>
        <div class="row"><span class="lab">Collocations</span>${(w.col ?? []).map((x) => `<span class="col">${esc(x).replace(formRe(w), "<b>$&</b>")}</span>`).join("")}</div>
        <div class="row"><span class="lab">Word family</span>${Object.entries(w.forms ?? {}).map(([k, v]) => `<span class="form"><i>${POS[k] ?? k}</i> ${esc(v)}</span>`).join("")}</div>
        ${w.trap ? `<div class="watch"><b>Watch out!</b> ${en(w.trap)}</div>` : ""}
      </div></div>`
    )
    .join("");

  /* ---- reading ---- */
  let text = esc(c.reading.text);
  const found = [];
  for (const w of words) {
    const re = formRe(w);
    const m = c.reading.text.match(re);
    if (m) { found.push({ w, form: m[0] }); text = text.replace(re, `<u>$&</u>`); }
  }
  if (found.length < 3) problems.push(`${c.id}: reading uses only ${found.length} family words`);
  const findQ = shuffle(found, c.id + "find").slice(0, 4);
  const rq = c.rq ?? (c.tf ? { type: "tfng", items: c.tf } : null);
  const LAB = { T: "TRUE", F: "FALSE", NG: "NOT GIVEN", Y: "YES", N: "NO" };
  if (rq) {
    const sk = SKILL[rq.type];
    let body = "", ans = "", rub = "";
    if (rq.type === "tfng" || rq.type === "ynng") {
      rub = rq.type === "tfng" ? "Các câu sau có đúng với thông tin trong bài không? Viết TRUE, FALSE hoặc NOT GIVEN." : "Các câu sau có khớp với quan điểm của người viết không? Viết YES, NO hoặc NOT GIVEN.";
      body = `<ol>${rq.items.map((q) => `<li>${esc(q.s)} <span class="blankline"></span></li>`).join("")}</ol>`;
      ans = rq.items.map((q, i) => `${i + 1} ${LAB[q.a]}`).join(" · ");
    } else if (rq.type === "mcq") {
      rub = "Chọn đáp án đúng A, B, C hoặc D.";
      body = `<ol>${rq.items.map((q) => `<li>${esc(q.q)}<div class="opts col">${q.o.map((o, j) => `<span><b>${"ABCD"[j]}</b> ${esc(o)}</span>`).join("")}</div></li>`).join("")}</ol>`;
      ans = rq.items.map((q, i) => `${i + 1} ${q.a}`).join(" · ");
    } else if (rq.type === "gap") {
      rub = "Hoàn thành tóm tắt. Chọn từ trong khung (A–H) cho mỗi chỗ trống.";
      const box = rq.box.map((b, j) => `<span><b>${"ABCDEFGH"[j]}</b> ${esc(b)}</span>`).join("");
      body = `<div class="gapbox">${box}</div><p class="summary">${esc(rq.text).replace(/\[(\d)\]/g, '<b class="gapn">$1</b> ________')}</p>`;
      ans = rq.a.map((a, i) => `${i + 1} ${"ABCDEFGH"[rq.box.indexOf(a)]} (${esc(a)})`).join(" · ");
    } else if (rq.type === "sent") {
      rub = "Hoàn thành câu. Dùng KHÔNG QUÁ HAI TỪ lấy từ bài đọc cho mỗi chỗ trống.";
      body = `<ol>${rq.items.map((q) => `<li>${esc(q.s).replace("____", "__________")}</li>`).join("")}</ol>`;
      ans = rq.items.map((q, i) => `${i + 1} ${esc(q.a)}`).join(" · ");
    }
    ex({ sec: "read", title: sk.name, tag: "IELTS Reading", rubric: rub, body, ans });
  }
  /* ---- vocabulary practice ---- */
  const aQ = shuffle(words, c.id + "A").slice(0, 3).map((w) => {
    const opts = shuffle([w, ...shuffle(words.filter((x) => x !== w), c.id + w.word).slice(0, 2)], w.word + "o");
    return { w, opts, a: opts.indexOf(w) };
  });
  ex({ sec: "vocab", title: "Đoán nghĩa từ các phần", tag: "Reading skill", rubric: "Che phần Vocabulary. Nhìn các mảnh ghép và chọn nghĩa đúng: a, b hoặc c.",
    body: `<ol>${aQ.map((q) => `<li><span class="wsplit">${q.w.parts.map((p) => `<span style="color:${COLORS[p.k]}">${esc(p.t)}</span>`).join(" + ")}</span> <small>(${q.w.parts.map((p) => esc(p.vi)).filter(Boolean).join(" + ")})</small>
        <div class="opts">${q.opts.map((o, j) => `<span><b>${L[j]}</b> ${esc(o.meaning)}</span>`).join("")}</div></li>`).join("")}</ol>`,
    ans: aQ.map((q, i) => `${i + 1}${L[q.a]}`).join(" · ") });

  if (c.syn?.length) {
    const sr = shuffle(c.syn, c.id + "syn");
    ex({ sec: "vocab", title: "Paraphrase pairs", tag: "Reading · Listening", rubric: "Đề IELTS hiếm khi lặp lại đúng từ trong bài. Nối mỗi từ 1–" + c.syn.length + " với cách diễn đạt tương đương a–" + "abcdef"[c.syn.length - 1] + ".",
      body: `<table class="match">${c.syn.map((p, i) => `<tr><td><b>${i + 1}</b> ${esc(p[0])}</td><td><b>${"abcdef"[i]}</b> ${esc(sr[i][1])}</td></tr>`).join("")}</table>`,
      ans: c.syn.map((p, i) => `${i + 1}${"abcdef"[sr.indexOf(p)]}`).join(" · ") });
  }
  {
    const pres = [...new Set(words.flatMap((w) => w.parts.filter((p) => p.k === "pre").map((p) => p.t)))];
    const bw = shuffle(words.filter((w) => w.parts.some((p) => p.k === "pre")), c.id + "build").slice(0, 4);
    if (bw.length >= 3)
      ex({ sec: "vocab", title: "Word building", tag: "Reading skill", rubric: `Ghép một tiền tố trong khung với gốc ${esc(c.root)} để tạo từ có nghĩa sau.`,
        body: `<div class="bank pre">${shuffle(pres, c.id + "pres").map((p) => `<span style="border-color:${COLORS.pre};color:${COLORS.pre}">${esc(p)}-</span>`).join("")}</div><ol>${bw.map((w) => `<li>${esc(w.meaning)} <span class="blankline"></span></li>`).join("")}</ol>`,
        ans: bw.map((w, i) => `${i + 1} ${esc(w.word)}`).join(" · ") });
  }
  const pairs = [];
  for (const w of shuffle(words, c.id + "B")) {
    for (const col of shuffle(w.col ?? [], w.word + "c")) {
      const m = col.match(formRe(w));
      if (!m) continue;
      const head = m[0], rest = col.replace(m[0], "____");
      if (rest === "____" || pairs.some((p) => p.head.toLowerCase() === head.toLowerCase() || p.rest === rest)) continue;
      pairs.push({ head, rest });
      break;
    }
    if (pairs.length === 6) break;
  }
  const right = shuffle(pairs, c.id + "Br");
  ex({ sec: "vocab", title: "Collocations", tag: "Lexical Resource", rubric: "Nối từ 1–6 với cụm a–f để tạo collocation.",
    body: `<table class="match">${pairs.map((p, i) => `<tr><td><b>${i + 1}</b> ${esc(p.head)}</td><td><b>${"abcdef"[i]}</b> ${esc(right[i].rest)}</td></tr>`).join("")}</table>`,
    ans: pairs.map((p, i) => `${i + 1}${"abcdef"[right.indexOf(p)]}`).join(" · ") });

  const order3 = shuffle(words, c.id + "C");
  const cQ = order3.slice(0, Math.min(5, words.length - 1)).map((w) => ({ w, s: w.example.replace(formRe(w), "__________"), a: w.example.match(formRe(w))?.[0] ?? w.word }));
  const bank = shuffle(words.map((w) => w.word), c.id + "bank");
  ex({ sec: "vocab", title: "Hoàn thành câu", tag: "Lexical Resource", rubric: "Điền từ trong khung vào chỗ trống. Chia đúng dạng nếu cần.",
    body: `<div class="bank">${bank.map((b) => `<span>${esc(b)}</span>`).join("")}</div><ol>${cQ.map((q) => `<li>${esc(q.s)}</li>`).join("")}</ol>`,
    ans: cQ.map((q, i) => `${i + 1} ${esc(q.a)}`).join(" · ") });

  /* ---- language focus: word families ---- */
  ex({ sec: "lang", title: "Word form", tag: "Grammar for writing", rubric: "Viết dạng đúng của từ in hoa.",
    body: `<ol>${c.wf.map((q) => `<li>${esc(q.s).replace(/___/, "__________")} <b class="base">${esc(q.base)}</b></li>`).join("")}</ol>`,
    ans: c.wf.map((q, i) => `${i + 1} ${esc(q.a)}`).join(" · ") });
  const KEYS = ["n", "v", "adj", "adv"];
  const eRows = shuffle(words.filter((w) => Object.keys(w.forms ?? {}).length >= 2), c.id + "E").slice(0, 4);
  ex({ sec: "lang", title: "Bảng họ từ", tag: "Lexical Resource", rubric: "Hoàn thành bảng. Để trống ô không có dạng từ.",
    body: `<table class="wftable"><tr><th>noun</th><th>verb</th><th>adjective</th><th>adverb</th></tr>
      ${eRows.map((w) => { const k0 = w.pos.split(/[ ./]/)[0]; const own = KEYS.includes(k0) ? k0 : KEYS.find((k) => w.forms[k]); return `<tr>${KEYS.map((k) => `<td>${k === own ? `<b>${esc(w.word)}</b>` : ""}</td>`).join("")}</tr>`; }).join("")}</table>`,
    ans: eRows.map((w, i) => `${i + 1} ${KEYS.filter((k) => w.forms[k]).map((k) => `${POS[k]} ${esc(w.forms[k])}`).join("; ")}`).join(" · ") });
  ex({ sec: "lang", title: "Sửa lỗi", tag: "Writing accuracy", rubric: "Mỗi câu có một lỗi ở phần gạch chân. Sửa lại.",
    body: `<ol>${c.err.map((q) => `<li>${esc(q.s).replace(/\*(.+?)\*/, "<u class='err'>$1</u>")}</li>`).join("")}</ol>`,
    ans: c.err.map((q, i) => `${i + 1} ${esc(q.s.match(/\*(.+?)\*/)?.[1] ?? "")} → ${esc(q.a)}`).join(" · ") });

  /* ---- speaking ---- */
  const useful = words.flatMap((w) => (w.col ?? []).slice(0, 1)).slice(0, 6);
  const spk = c.spk ?? (c.sp ? { part: 3, qs: [c.sp] } : null);
  if (spk) {
    const sk = SKILL["p" + spk.part];
    const bodyQ = spk.part === 2
      ? `<div class="cue"><b>${esc(spk.topic)}</b><p>You should say:</p><ul>${spk.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`
      : `<ol class="spl">${spk.qs.map((q) => `<li class="spq">${esc(q)}</li>`).join("")}</ol>`;
    const rub = spk.part === 1 ? "Trả lời mỗi câu trong 20–30 giây theo AREA. Dùng ít nhất một cụm trong khung." : spk.part === 2 ? "Chuẩn bị 1 phút, nói 1–2 phút. Dùng ít nhất ba cụm trong khung." : "Trả lời trong 45–60 giây, từ góc nhìn xã hội. Dùng ít nhất hai cụm trong khung.";
    ex({ sec: "speak", title: sk.name, tag: "IELTS Speaking", rubric: rub,
      body: `${bodyQ}<div class="useful"><b>Useful language</b>${useful.map((u) => `<span>${esc(u)}</span>`).join("")}</div><p class="sktip"><b>Tip</b> ${esc(sk.tip)} <i>(${esc(sk.wk)})</i></p>`, ans: "" });
  }

  /* ---- writing ---- */
  if (c.pa?.length)
    ex({ sec: "write", title: "Paraphrase", tag: "Writing", rubric: "Viết lại câu với nghĩa không đổi, dùng từ cho sẵn.",
      body: `<ol>${c.pa.map((q) => `<li>${esc(q.s)} <b class="base">${esc(q.k)}</b><div class="line1"></div></li>`).join("")}</ol>`,
      ans: c.pa.map((q, i) => `${i + 1} ${esc(q.a)}`).join(" · ") });
  const hWords = order3.slice(-2);
  ex({ sec: "write", title: "Dịch sang tiếng Anh", tag: "Writing", rubric: "Dịch câu, dùng từ cho sẵn.",
    body: `<ol>${hWords.map((w) => `<li>${esc(w.example_vi)} <b class="base">${esc(w.word)}</b><div class="line1"></div></li>`).join("")}</ol>`,
    ans: hWords.map((w, i) => `${i + 1} ${esc(w.example)}`).join(" · ") });
  const wt = SKILL[c.wt ?? "opinion"];
  ex({ sec: "write", title: "Writing Task 2 · " + wt.name, tag: "IELTS Writing", rubric: "Viết mở bài và một đoạn thân bài (120–150 từ). Dùng ít nhất 3 từ của unit.",
    body: `<p class="task">${en(c.write.replace(/ Viết 2–3 câu.*$/, ""))}</p><p class="sktip"><b>Tip</b> ${esc(wt.tip)} <i>(Roadmap tuần 6–8)</i></p><div class="lines"></div>`, ans: "" });

  /* ---- review ---- */
  const ownRev = [1, 3, 7].map((d) => chapters[ci - d]).filter(Boolean).map((pc) => ({ w: shuffle(pc.words, c.id + "rev" + pc.id)[0], ch: pc }));
  if (ownRev.length)
    ex({ sec: "review", title: "Ôn giãn cách", tag: "Review", rubric: `Từ của ${ownRev.length === 1 ? "unit trước" : "1, 3 và 7 unit trước"}. Viết nghĩa mà không lật lại.`,
      body: `<ol>${ownRev.map((r) => `<li><b>${coloredWord(r.w)}</b> <small>(Unit ${r.ch.n} · ${esc(shortRoot(r.ch))})</small> <span class="blankline long"></span></li>`).join("")}</ol>`,
      ans: ownRev.map((r, i) => `${i + 1} ${esc(r.w.word)}: ${esc(r.w.meaning)}`).join(" · ") });

  exs.forEach((e, i) => (e.n = i + 1));
  totalEx += exs.length;
  answers.push({ c, ans: exs.filter((e) => e.ans).map((e) => `<b>${e.n}</b> ${e.ans}`) });
  const exHTML = (sec) => exs.filter((e) => e.sec === sec).map((e) => `<div class="q"><div class="qh"><span class="qn">${e.n}</span><span class="qt">${esc(e.title)}</span><span class="tag">${esc(e.tag)}</span></div><p class="rubric">${e.rubric}</p>${e.body}</div>`).join("");
  const range = (sec) => { const l = exs.filter((e) => e.sec === sec); return l.length ? `${l[0].n}${l.length > 1 ? "–" + l[l.length - 1].n : ""}` : ""; };

  const topicNames = [...new Set(words.map((w) => TOPICS[w.tp]).filter(Boolean))].slice(0, 3);
  const nCol = words.reduce((n, w) => n + (w.col?.length ?? 0), 0);
  const recap = words.map((w) => `<tr><td class="rw">${coloredWord(w)}</td><td>${esc(w.meaning)}</td><td class="rc">${esc((w.col ?? []).slice(0, 2).join(" · "))}</td></tr>`).join("");
  const sec = (n, title, sub) => `<div class="sec"><span class="sn">${n}</span><span class="st">${title}</span>${sub ? `<span class="ss">${sub}</span>` : ""}</div>`;
  const part = order.parts[c.part];

  return `<section class="chapter" id="ch-${c.id}">
  <span class="mark">@@CH${c.n}@@</span>
  <div class="uband">
    <div class="ul"><div class="ulab">Unit</div><div class="unum">${c.n}</div></div>
    <div class="ur"><div class="upart">Part ${c.part + 1} · ${esc(part.title)}</div>
      <div class="utitle">${esc(c.root)}</div><div class="usub">${esc(c.origin)} · <b>${esc(c.core)}</b></div></div>
  </div>
  <div class="opener">
    <div class="goals"><h4>In this unit you will</h4><ul>
      <li><b>Reading</b> đoán nghĩa từ lạ chứa gốc <i>${esc(shortR)}</i>; luyện dạng ${esc(rq ? SKILL[rq.type].name : "")}</li>
      <li><b>Vocabulary</b> học ${words.length} từ học thuật và ${nCol} collocation chủ đề ${esc(topicNames.join(", ").toLowerCase())}</li>
      <li><b>Language focus</b> chuyển đúng dạng từ trong họ từ</li>
      <li><b>Speaking &amp; Writing</b> dùng từ mới trong ${esc(spk ? SKILL["p" + spk.part].name : "Speaking")} và ${esc(SKILL[c.wt ?? "opinion"].name)}</li></ul></div>
    <div class="leadin"><h4>Lead-in</h4>
      <p class="baitline"><b class="en">${esc(c.bait.word)}</b> nghĩa đen là… <b>${esc(c.bait.literal)}</b>.</p>
      <p>${en(c.hook)}</p>
      <p class="anchorline"><b>Hình neo:</b> ${esc(c.image)}.</p></div>
  </div>

  ${sec("1", "Word map", "Sơ đồ họ từ")}
  ${familyTree(c)}
  <p class="maphelp">Đọc từ trên xuống: gốc → từ → word family → collocations. <b style="color:${COLORS.pre}">tiền tố</b> · <b style="color:${COLORS.root}">gốc</b> · <b style="color:${COLORS.suf}">hậu tố</b></p>

  ${sec("2", "Vocabulary", "Từ vựng")}
  ${cards}

  <div class="readwrap">
  ${sec("3", "Reading", `Exercises ${range("read")}`)}
  <div class="readgrid">
    <div class="passage"><h4>${esc(c.reading.title)}</h4><p>${text}</p></div>
    <div class="tipbox"><b>Exam tip · ${esc(rq ? SKILL[rq.type].name : "Reading")}</b>${esc(rq ? SKILL[rq.type].tip : TIPS[(c.n - 1) % TIPS.length])}${rq?.type && SKILL[rq.type].wk ? `<small>${esc(SKILL[rq.type].wk)}</small>` : ""}</div>
  </div></div>
  ${exHTML("read")}

  ${sec("4", "Vocabulary practice", `Exercises ${range("vocab")}`)}
  ${exHTML("vocab")}

  ${sec("5", "Language focus: word families", `Exercises ${range("lang")}`)}
  ${exHTML("lang")}

  ${spk ? `${sec("6", "Speaking", `Exercise ${range("speak")}`)}${exHTML("speak")}` : ""}

  ${sec(spk ? "7" : "6", "Writing", `Exercises ${range("write")}`)}
  ${exHTML("write")}

  <div class="review">
    ${sec("✓", "Review", `Unit ${c.n} · ${esc(c.root)} = ${esc(c.core)}`)}
    ${exHTML("review")}
    <table class="recap"><tr><th>Word</th><th>Nghĩa</th><th>Collocations</th></tr>${recap}</table>
    <div class="tracker"><b>Lịch ôn</b> Che cột nghĩa và tự nói lại: <span>☐ Ngày 1</span><span>☐ Ngày 3</span><span>☐ Ngày 7</span><span>☐ Ngày 14</span><span>☐ Ngày 30</span></div>
  </div>
</section>`;
}

/* ---------------- family tree (top-down): root → words → word family → collocations ---------------- */
/** Colour a derived form: the root letters blue, what comes before orange, what comes after green. */
function colorForm(form, w, c) {
  const rootPart = w.parts.find((p) => p.k === "root")?.t ?? "";
  const variants = [rootPart, ...c.root.split("/").map((s) => s.trim()), rootPart.replace(/e$/, ""), rootPart.slice(0, -1), rootPart.slice(0, 3)]
    .filter((v) => v && v.length >= 2)
    .sort((a, b) => b.length - a.length);
  const lower = form.toLowerCase();
  for (const v of variants) {
    const i = lower.indexOf(v.toLowerCase());
    if (i < 0) continue;
    const pre = form.slice(0, i), mid = form.slice(i, i + v.length), post = form.slice(i + v.length);
    return `${pre ? `<span style="color:${COLORS.pre}">${esc(pre)}</span>` : ""}<span style="color:${COLORS.root}">${esc(mid)}</span>${post ? `<span style="color:${COLORS.suf}">${esc(post)}</span>` : ""}`;
  }
  return esc(form);
}
function familyTree(c) {
  const words = c.words;
  const kid = (w) => {
    const forms = ["n", "v", "adj", "adv"]
      .flatMap((k) => (w.forms?.[k] ?? "").split(",").map((f) => f.replace(/\(.*?\)/g, "").trim()).filter((f) => f && f.toLowerCase() !== w.word.toLowerCase()).map((f) => ({ k, f })))
      .slice(0, 4);
    const cols = (w.col ?? []).slice(0, 3).map((x) => {
      const m = x.match(formRe(w));
      return m ? esc(x.slice(0, m.index)) + `<b>${colorForm(m[0], w, c)}</b>` + esc(x.slice(m.index + m[0].length)) : esc(x);
    });
    return `<div class="tkid"><div class="tword">${coloredWord(w)}</div>
      ${forms.length ? `<div class="tstem"></div><div class="tforms">${forms.map((x) => `<div><i>${POS[x.k]}</i> ${colorForm(x.f, w, c)}</div>`).join("")}</div>` : ""}
      <div class="tstem"></div><div class="tcols">${cols.map((x) => `<div>${x}</div>`).join("")}</div></div>`;
  };
  // more than 5 words: two rows, so labels never get squeezed
  const rows = words.length > 5 ? [words.slice(0, Math.ceil(words.length / 2)), words.slice(Math.ceil(words.length / 2))] : [words];
  return `<div class="tree"><div class="troot"><b>${esc(c.root)}</b><small>${esc(c.core)}</small></div>
    ${rows.map((r, i) => `${i ? `<div class="tlink"></div>` : ""}<div class="tkids">${r.map(kid).join("")}</div>`).join("")}</div>`;
}

/* ---------------- front & back matter ---------------- */
function placementTest() {
  const r = shuffle(chapters, "placement");
  const qs = [];
  for (const c of r.slice(0, 8)) {
    const opts = shuffle([c.core, ...shuffle(chapters.filter((x) => x !== c), c.id + "pt").slice(0, 2).map((x) => x.core)], c.id + "po");
    qs.push({ q: `Gốc <b style="color:${COLORS.root}">${esc(c.root)}</b> nghĩa là?`, opts, a: opts.indexOf(c.core) });
  }
  const pre = new Map();
  for (const w of allWords) for (const p of w.parts.filter((p) => p.k === "pre" && prefixesOf(w).length)) if (!pre.has(canonPrefix(p.t)) && p.vi) pre.set(canonPrefix(p.t), p.vi);
  const preList = shuffle([...pre.entries()].filter(([k]) => ["re", "pro", "ex", "in", "sub", "trans", "inter", "dis", "pre", "con"].includes(k)), "pre");
  for (const [k, vi] of preList.slice(0, 6)) {
    const opts = shuffle([vi, ...shuffle(preList.filter(([x]) => x !== k), k).slice(0, 2).map(([, v]) => v)], k + "o");
    qs.push({ q: `Tiền tố <b style="color:${COLORS.pre}">${esc(k)}-</b> thường nghĩa là?`, opts, a: opts.indexOf(vi) });
  }
  for (const w of shuffle(allWords, "pw").slice(0, 20 - qs.length)) {
    const opts = shuffle([w.meaning, ...shuffle(allWords.filter((x) => x.word !== w.word), w.word).slice(0, 2).map((x) => x.meaning)], w.word + "p");
    qs.push({ q: `<b>${esc(w.word)}</b> nghĩa là?`, opts, a: opts.indexOf(w.meaning) });
  }
  return qs;
}

function finalTest() {
  return chapters.map((c) => {
    const w = shuffle(c.words, c.id + "final")[0];
    const others = shuffle(allWords.filter((x) => x.ch !== c && x.pos.split(" ")[0] === w.pos.split(" ")[0]), c.id + "fo").slice(0, 3);
    const m = w.example.match(formRe(w));
    const inflect = (x) => (m && /ed$/.test(m[0]) && !/ed$/.test(x.word) ? x.word.replace(/e$/, "") + "ed" : m && /s$/.test(m[0]) && !/s$/.test(x.word) ? x.word + "s" : x.word);
    const opts = shuffle([m?.[0] ?? w.word, ...others.map(inflect)], c.id + "fopt");
    return { s: w.example.replace(formRe(w), "_____"), opts, a: opts.indexOf(m?.[0] ?? w.word), c };
  });
}

const css = fs.readFileSync(path.join(ROOT_DIR, "lib", "ebook.css"), "utf8");
const logo = "data:image/svg+xml;base64," + fs.readFileSync(path.join(ROOT_DIR, "../../public/favicon.svg")).toString("base64");

function buildBody(pages) {
  answers.length = 0;
  totalEx = 0;
  const pg = (k) => (pages?.[k] ? pages[k] : "");
  const chapterHtml = [];
  order.parts.forEach((part, pi) => {
    const list = chapters.filter((c) => c.part === pi);
    if (!list.length) return;
    chapterHtml.push(`<section class="partpage" id="part-${pi + 1}"><span class="mark">@@P${pi + 1}@@</span>
      <div class="pnum">Part ${pi + 1}</div><h1>${esc(part.title)}</h1><p class="psub">${esc(part.sub)}</p>
      <div class="plist">${list.map((c) => `<a href="#ch-${c.id}"><b>${c.n}</b> <span>${esc(c.root)}</span> <small>${esc(c.core)}</small></a>`).join("")}</div></section>`);
    for (const c of list) chapterHtml.push(chapterHTML(c, chapters.indexOf(c)));
  });

  const pt = placementTest();
  const ft = finalTest();
  const preTable = (() => {
    const map = new Map();
    for (const w of allWords) for (const p of w.parts.filter((p) => p.k === "pre")) {
      if (!prefixesOf(w).includes(canonPrefix(p.t))) continue;
      const key = canonPrefix(p.t);
      const e = map.get(key) ?? { forms: new Set(), vi: new Set(), words: [] };
      e.forms.add(p.t); if (p.vi) e.vi.add(p.vi); e.words.push(w.word);
      map.set(key, e);
    }
    return [...map.entries()].filter(([, e]) => e.words.length >= 2).sort((a, b) => b[1].words.length - a[1].words.length || a[0].localeCompare(b[0]));
  })();
  const sufTable = (() => {
    const map = new Map();
    for (const w of allWords) for (const p of w.parts.filter((p) => p.k === "suf" && p.vi)) {
      const e = map.get(p.t) ?? { vi: new Set(), words: [] };
      e.vi.add(p.vi); e.words.push(w.word); map.set(p.t, e);
    }
    return [...map.entries()].sort((a, b) => b[1].words.length - a[1].words.length).slice(0, 18);
  })();

  const rqType = (c) => (c.rq ?? (c.tf ? { type: "tfng" } : null))?.type;
  const spPart = (c) => (c.spk ?? (c.sp ? { part: 3 } : null))?.part;
  const toc = order.parts
    .map((part, pi) => {
      const list = chapters.filter((c) => c.part === pi);
      if (!list.length) return "";
      return `<tr class="tpart"><td colspan="7"><a href="#part-${pi + 1}">Part ${pi + 1} · ${esc(part.title)}</a></td></tr>
        ${list.map((c) => `<tr><td class="tu"><a href="#ch-${c.id}"><b>${c.n}</b></a></td>
          <td><a href="#ch-${c.id}"><b class="troot2">${esc(c.root)}</b><br><small>${esc(c.core)}</small></a></td>
          <td>${esc([...new Set(c.words.map((w) => TOPICS[w.tp]))].slice(0, 2).join(", "))}<br><small>${c.words.length} từ · ${c.words.reduce((n, w) => n + w.col.length, 0)} collocations</small></td>
          <td>${esc(SKILL[rqType(c)]?.name ?? "")}</td>
          <td>${esc(SKILL["p" + spPart(c)]?.name ?? "")}</td>
          <td>Task 2: ${esc(SKILL[c.wt ?? "opinion"].name)}</td>
          <td class="tp">${pg("CH" + c.n)}</td></tr>`).join("")}`;
    })
    .join("");

  const index = [...allWords].sort((a, b) => a.word.localeCompare(b.word));
  const byTopic = Object.entries(TOPICS)
    .map(([k, name]) => [name, allWords.filter((w) => w.tp === k)])
    .filter(([, l]) => l.length);

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>UpWind · ${TITLE}</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,600;0,700;0,800;1,400&display=block" rel="stylesheet">
<style>${css}</style></head><body>

<section class="front">
  <h2 class="big">Bản quyền</h2>
  <p><b>${TITLE}</b><br>UpWind IELTS · upwind.asia · Phiên bản 1.0, ${new Date().getFullYear()}</p>
  <p>© UpWind. Sách điện tử này dành cho người mua sử dụng cá nhân. Vui lòng không chia sẻ, đăng lại hay bán lại file. Giáo viên muốn dùng cho cả lớp, hãy liên hệ UpWind để có giấy phép lớp học.</p>
  <p class="small">Nguồn gốc từ (etymology) được giản lược để dễ nhớ nhưng không bịa đặt; đã đối chiếu với từ điển từ nguyên. IPA theo giọng Anh–Anh. Mã màu dùng xuyên suốt sách:
    <b style="color:${COLORS.pre}">tiền tố</b> · <b style="color:${COLORS.root}">gốc từ</b> · <b style="color:${COLORS.suf}">hậu tố</b>.</p>
</section>

<section class="front" id="toc"><h2 class="big">Contents</h2>
  <div class="toc">
    <a href="#how"><b>Cách dùng sách & mục tiêu IELTS</b><span class="dots"></span><span>${pg("HOW")}</span></a>
    <a href="#placement"><b>Bài kiểm tra đầu vào</b><span class="dots"></span><span>${pg("PT")}</span></a>
    <a href="#affix"><b>Bảng tiền tố và hậu tố</b><span class="dots"></span><span>${pg("AFF")}</span></a>
    <a href="#map"><b>Bản đồ 40 gốc từ</b><span class="dots"></span><span>${pg("MAP")}</span></a>
    <a href="#final"><b>Bài kiểm tra cuối sách · Đáp án · Chủ đề · Chỉ mục</b><span class="dots"></span><span>${pg("FT")}</span></a>
  </div>
  <table class="sns"><tr><th>Unit</th><th>Root</th><th>Vocabulary</th><th>Reading</th><th>Speaking</th><th>Writing</th><th>Page</th></tr>${toc}</table>
  <p class="small">Mỗi unit còn có: Word map, Paraphrase pairs, Word building, Collocations, Word form, bảng họ từ, sửa lỗi, paraphrase câu, dịch và ôn giãn cách. Dạng bài Reading, Speaking, Writing được phân theo lộ trình UpWind Student Roadmap.</p>
</section>

<section class="front" id="how"><span class="mark">@@HOW@@</span>
  <h2 class="big">Cách dùng sách này</h2>
  <p class="lead">Mỗi gốc từ là một “hạt giống”: nắm được nó, bạn đoán được nghĩa của cả chục từ học thuật mà không cần học thuộc từng từ. Sách được thiết kế theo những gì nghiên cứu về học từ vựng đã chứng minh hiệu quả.</p>
  <div class="goalbox"><b>🎯 Mục tiêu: từ vựng cho IELTS band 5.5 → 7.0+</b>
    <p>Sách dành cho người học đang ở khoảng band 5.0–6.0 và muốn lên 6.5–7.5. Mọi từ đều được chọn vì hay xuất hiện trong IELTS Reading, Listening và hữu ích cho Writing Task 2, Speaking Part 3. Sách nhắm vào ba chỗ cụ thể trong bài thi:</p>
    <table><tr><th>Kỹ năng IELTS</th><th>Sách giúp gì</th><th>Bài tập</th></tr>
    <tr><td><b>Reading, Listening</b></td><td>Tách từ lạ thành gốc + tiền tố + hậu tố để đoán nghĩa; nhận ra paraphrase giữa câu hỏi và bài đọc.</td><td>Reading (5 dạng đề), Paraphrase pairs, Word building</td></tr>
    <tr><td><b>Writing (Lexical Resource, 25% điểm)</b></td><td>Band 7 yêu cầu “dùng từ ít phổ biến, có ý thức về collocation”. Mỗi từ đi kèm collocation và đủ họ từ để dùng đúng dạng.</td><td>Collocations, Word form, Sửa lỗi, Paraphrase, Writing Task 2</td></tr>
    <tr><td><b>Speaking (Lexical Resource, 25% điểm)</b></td><td>Câu hỏi Part 1, cue card Part 2 hoặc câu hỏi Part 3 theo chủ đề của unit để luyện nói bằng chính các collocation vừa học.</td><td>Speaking Part 1, 2, 3</td></tr></table>
  </div>
  <div class="steps">
    <div class="step"><b>1. Neo gốc bằng một hình ảnh</b>Mỗi gốc có một nghĩa lõi và một “hình neo”. Mọi từ trong unit chỉ là hình neo đó cộng thêm một hướng (tiền tố) và một loại từ (hậu tố).</div>
    <div class="step"><b>2. Tách từ, kể chuyện</b>Thẻ từ tách từ thành các mảnh có màu, rồi nối nghĩa đen với nghĩa thật bằng một câu chuyện ngắn. Học câu chuyện trước, nghĩa sau.</div>
    <div class="step"><b>3. Học cả cụm, không học từ lẻ</b>Mỗi từ có 3–4 collocation hay gặp trong IELTS và cả họ từ (danh, động, tính, trạng). Đây là thứ giúp bạn <i>dùng</i> được từ, không chỉ <i>nhận ra</i> nó.</div>
    <div class="step"><b>4. Gặp lại trong bài đọc</b>Bài đọc ngắn kiểu IELTS cho bạn thấy các từ hoạt động cùng nhau trong một đoạn văn thật.</div>
    <div class="step"><b>5. Tự nhớ lại, đừng đọc lại</b>Mỗi unit có khoảng 15 bài tập theo kỹ năng IELTS. Reading xoay vòng 5 dạng đề (Summary completion, Multiple choice, TRUE/FALSE/NOT GIVEN, Sentence completion, YES/NO/NOT GIVEN); Speaking xoay vòng Part 1, 2, 3; Writing Task 2 xoay vòng 5 dạng đề. Nhớ lại (retrieval) giúp bạn nhớ lâu hơn nhiều so với đọc đi đọc lại.</div>
    <div class="step"><b>6. Ôn giãn cách</b>Mỗi unit có bài ôn kéo từ của 1, 3 và 7 unit trước, và ô lịch ôn ngày 1, 3, 7, 14, 30. Đánh dấu ☐ mỗi lần ôn.</div>
  </div>
  <div class="note"><b>Lộ trình gợi ý:</b> một unit mỗi ngày, khoảng 40 phút: 10 phút Word map và Vocabulary, 20 phút bài tập, 10 phút Speaking và Writing. 40 ngày là xong sách. Làm bài kiểm tra đầu vào trước, bài cuối sách sau, để thấy mình tiến bộ bao nhiêu.</div>
  <div class="note"><b>Dùng trong phòng thi:</b> gặp từ lạ trong IELTS Reading, hãy tách nó ra. <i>irrevocable</i> = ir (không) + re (lại) + voc (gọi) + able (có thể) → không thể gọi lại → không thể thay đổi. Thường đủ để chọn đúng đáp án.</div>
  <div class="note warn"><b>Cẩn thận:</b> gốc từ cho hướng đoán, không phải định nghĩa. Nghĩa hiện đại có thể đã trôi xa (<i>addict</i>, <i>bankrupt</i>), và có cặp “bẫy” trông giống nhau nhưng khác gốc (<i>vocation</i> và <i>vacation</i>). Luôn kiểm tra bằng câu ví dụ; các mục ⚠ trong sách chỉ ra những bẫy này.</div>
</section>

<section class="front" id="placement"><span class="mark">@@PT@@</span>
  <h2 class="big">Bài kiểm tra đầu vào</h2>
  <p>20 câu, 8 phút, không đoán bừa: câu nào chưa biết thì bỏ trống. Đáp án ở cuối sách.</p>
  <ol class="mcq two">${pt.map((q) => `<li>${q.q}<div class="opts">${q.opts.map((o, j) => `<span>${L[j]}. ${esc(o)}</span>`).join("")}</div></li>`).join("")}</ol>
  <div class="note"><b>Kết quả:</b> 0–8 câu: học lần lượt từ Unit 1. 9–15: học theo thứ tự, lướt nhanh các từ đã biết nhưng vẫn làm hết bài tập. 16–20: bắt đầu từ phần luyện tập của mỗi unit, chỉ đọc thẻ từ khi làm sai.</div>
</section>

<section class="front" id="affix"><span class="mark">@@AFF@@</span>
  <h2 class="big">Bảng tiền tố và hậu tố</h2>
  <p>Tiền tố cho biết <b style="color:${COLORS.pre}">hướng</b> (ra, vào, lại, trước…), hậu tố cho biết <b style="color:${COLORS.suf}">loại từ</b>. Học bảng này một lần, bạn dùng nó cho cả 40 unit.</p>
  <table class="affix"><tr><th>Tiền tố</th><th>Nghĩa</th><th>Gặp trong</th></tr>${preTable
    .map(([k, e]) => `<tr><td style="color:${COLORS.pre}"><b>${esc([...e.forms].map((f) => f + "-").join(" "))}</b></td><td>${esc([...e.vi].slice(0, 3).join(" · "))}</td><td>${esc([...new Set(e.words)].slice(0, 8).join(", "))}${e.words.length > 8 ? "…" : ""}</td></tr>`)
    .join("")}</table>
  <table class="affix"><tr><th>Hậu tố</th><th>Tạo ra</th><th>Gặp trong</th></tr>${sufTable
    .map(([k, e]) => `<tr><td style="color:${COLORS.suf}"><b>-${esc(k)}</b></td><td>${esc([...e.vi].slice(0, 2).join(" · "))}</td><td>${esc([...new Set(e.words)].slice(0, 8).join(", "))}</td></tr>`)
    .join("")}</table>
</section>

<section class="front" id="map"><span class="mark">@@MAP@@</span>
  <h2 class="big">Bản đồ 40 gốc từ</h2>
  <p>Mỗi chấm lớn là một gốc từ (màu theo phần), mỗi chấm cam là một tiền tố. Đường xám: gốc đó có từ dùng tiền tố này. Đường xanh đứt nét: hai gốc gặp nhau trong cùng một từ (biology = bio + log). Tiền tố càng nhiều đường nối càng đáng học trước. Bấm vào một gốc để tới unit đó.</p>
  ${globalMap(chapters)}
  <div class="legend">${order.parts.map((p, i) => `<span><i style="background:${["#004b9b", "#6a3fb5", "#0e7c86", "#b4410f"][i]}"></i>Phần ${i + 1}: ${esc(p.title)}</span>`).join("")}<span><i style="background:${COLORS.pre}"></i>Tiền tố</span></div>
</section>

${chapterHtml.join("\n")}

<section class="back" id="final"><span class="mark">@@FT@@</span>
  <h2 class="big">Bài kiểm tra cuối sách</h2>
  <p>Mỗi câu một unit. Chọn từ đúng điền vào chỗ trống. So sánh điểm với bài đầu vào.</p>
  <ol class="mcq">${ft.map((q) => `<li>${esc(q.s)}<div class="opts">${q.opts.map((o, j) => `<span>${L[j]}. ${esc(o)}</span>`).join("")}</div></li>`).join("")}</ol>
</section>

<section class="back" id="answers"><span class="mark">@@ANS@@</span>
  <h2 class="big">Đáp án</h2>
  <h3>Bài kiểm tra đầu vào</h3><p>${pt.map((q, i) => `${i + 1}${L[q.a]}`).join(" · ")}</p>
  <h3>Bài kiểm tra cuối sách</h3><p>${ft.map((q, i) => `${i + 1}${L[q.a]}`).join(" · ")}</p>
  ${answers.map(({ c, ans }) => `<div class="ans"><h4><a href="#ch-${c.id}">Unit ${c.n} · ${esc(c.root)}</a></h4>${ans.map((a) => `<div>${a}</div>`).join("")}</div>`).join("")}
  <p class="small">Speaking và Writing Task 2 không có đáp án duy nhất. Tự kiểm tra: dùng đúng ít nhất 3 từ của unit, đúng collocation, đúng dạng từ.</p>
</section>

<section class="back" id="topics"><span class="mark">@@TOP@@</span>
  <h2 class="big">Từ vựng theo chủ đề IELTS</h2>
  <p>Ôn theo chủ đề trước khi luyện Writing Task 2 hoặc Speaking Part 3.</p>
  <div class="topics">${byTopic.map(([name, l]) => `<div class="topic"><h4>${esc(name)}</h4>${l.map((w) => `<a href="#ch-${w.ch.id}">${esc(w.word)}</a>`).join(", ")}</div>`).join("")}</div>
</section>

<section class="back" id="index"><span class="mark">@@IDX@@</span>
  <h2 class="big">Chỉ mục A–Z</h2>
  <div class="index">${index.map((w) => `<div><a href="#ch-${w.ch.id}"><b>${esc(w.word)}</b></a> <small>${esc(w.pos)} · Unit ${w.ch.n}</small></div>`).join("")}</div>
</section>
</body></html>`;
}

function coverHTML() {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;800&display=block" rel="stylesheet">
<style>@page{size:A4;margin:0}${css}</style></head><body class="coverbody">
<div class="cover">
  <div class="ctop"><img src="${logo}" alt=""><span>UpWind IELTS</span></div>
  <div class="cmid">
    <div class="ckick">IELTS band 5.5 → 7.0+ · Học 1 gốc, nhớ cả họ từ</div>
    <h1>${TITLE}</h1>
    <p class="csub">${SUB}</p>
    <div class="cword"><span style="color:#ffb27a">pro</span><span style="color:#ffffff">voke</span> · <span style="color:#ffb27a">ex</span><span style="color:#ffffff">port</span> · <span style="color:#ffb27a">in</span><span style="color:#ffffff">spect</span><span style="color:#8fe0b5">ion</span></div>
  </div>
  <div class="cstats"><div><b>${chapters.length}</b>gốc từ</div><div><b>${allWords.length}</b>từ chính</div><div><b>${allWords.reduce((n, w) => n + (w.col?.length ?? 0), 0)}</b>collocation</div><div><b>${totalEx}</b>bài luyện tập</div></div>
</div></body></html>`;
}

/* ---------------- render ---------------- */
if (problems.length) {
  console.warn(problems.map((p) => "  ! " + p).join("\n"));
  if (problems.some((p) => /no data|missing (reading|wf|err)|parts join/.test(p)) && !only) process.exitCode = 1;
}
const dir = path.join(OUT_DIR, "ebook");
ensureDir(dir);
const browser = await chromium.launch();
const page = await browser.newPage();
const footer = `<div style="width:100%;font:8px 'Be Vietnam Pro',sans-serif;color:#8094a8;padding:0 13mm;display:flex;justify-content:space-between;align-items:center">
  <span><b style="color:#004b9b">UpWind IELTS</b> · ${TITLE}</span><span class="pageNumber" style="background:#004b9b;color:#fff;font-weight:700;min-width:18px;padding:3px 5px;text-align:center;border-radius:4px"></span></div>`;
async function render(html, file, opts = {}) {
  const htmlFile = file.replace(/\.pdf$/, ".html");
  fs.writeFileSync(htmlFile, html);
  await page.goto("file://" + htmlFile, { waitUntil: "networkidle" }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: file, format: "A4", printBackground: true, preferCSSPageSize: true, ...opts });
}
const bodyPdf = path.join(dir, "body.pdf");
const pdfOpts = { displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: footer, tagged: true, outline: true };
// pass 1: find which page each marker lands on, pass 2: print those numbers in the table of contents
await render(buildBody(null), bodyPdf, pdfOpts);
const pages = {};
execFileSync("pdftotext", ["-layout", bodyPdf, "-"], { encoding: "utf8", maxBuffer: 1 << 28 })
  .split("\f")
  .forEach((t, i) => { for (const m of t.matchAll(/@@(\w+?)@@/g)) pages[m[1]] ??= i + 1; });
await render(buildBody(pages), bodyPdf, pdfOpts);
await render(coverHTML(), path.join(dir, "cover.pdf"));
await browser.close();

const out = path.join(dir, only ? "preview.pdf" : "upwind-giai-ma-tu-vung.pdf");
const outline = [
  ...order.parts.map((p, i) => ({ title: `Phần ${i + 1}. ${p.title}`, page: pages["P" + (i + 1)], kids: chapters.filter((c) => c.part === i).map((c) => ({ title: `${c.n}. ${c.root} (${c.core})`, page: pages["CH" + c.n] })) })),
];
execFileSync("python3", ["-I", path.join(ROOT_DIR, "lib", "ebook_merge.py"), path.join(dir, "cover.pdf"), bodyPdf, out, JSON.stringify({ outline, pages })], { stdio: "inherit" });
console.log(`✓ ${path.relative(ROOT_DIR, out)}: ${chapters.length} chapters, ${allWords.length} words`);
