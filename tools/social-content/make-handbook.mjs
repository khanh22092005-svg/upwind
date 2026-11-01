#!/usr/bin/env node
// Printable study handbook (HTML + A4 PDF) built from the same data as the videos.
//   node make-handbook.mjs            -> out/handbook/upwind-goc-tu.html + .pdf
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { icon, iconOf } from "./lib/icons.mjs";
import { ROOT_DIR, OUT_DIR, COLORS, loadFamilies, esc, plain, coloredWord, highlight, blank, ensureDir } from "./lib/common.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const families = loadFamilies();
const allWords = families.flatMap((f) => f.words);
const logo = "data:image/svg+xml;base64," + fs.readFileSync(path.join(ROOT_DIR, "../../public/favicon.svg")).toString("base64");

/* ---------- prefix / suffix index built from the data ---------- */
function affixIndex(kind) {
  const map = new Map();
  for (const w of allWords)
    for (const p of w.parts.filter((p) => p.k === kind)) {
      const key = p.t.replace(/[()]/g, "");
      const e = map.get(key) ?? { vi: new Set(), words: [] };
      e.vi.add(p.vi);
      e.words.push(w.word);
      map.set(key, e);
    }
  return [...map.entries()].sort((a, b) => b[1].words.length - a[1].words.length || a[0].localeCompare(b[0]));
}
const affixTable = (kind) =>
  `<table class="affix"><tr><th>${kind === "pre" ? "Tiền tố" : "Hậu tố"}</th><th>Nghĩa</th><th>Gặp trong</th></tr>${affixIndex(kind)
    .map(([k, e]) => `<tr><td style="color:${COLORS[kind]}"><b>${kind === "pre" ? esc(k) + "-" : "-" + esc(k)}</b></td><td>${esc([...e.vi].join(" · "))}</td><td>${esc(e.words.join(", "))}</td></tr>`)
    .join("")}</table>`;

/* deterministic shuffle so the PDF is the same on every build */
const shuffle = (arr, seed) => {
  const a = [...arr];
  let s = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const answers = [];
const familyPages = families
  .map((f, fi) => {
    const rows = f.words
      .map(
        (w) => `<tr>
        <td class="w">${coloredWord(w)}<div class="ipa">${esc(w.ipa)}</div></td>
        <td class="pos">${esc(w.pos)}</td>
        <td>${w.parts.map((p) => `<span style="color:${COLORS[p.k]}">${esc(p.t)}</span> <small>(${esc(p.vi)})</small>`).join(" + ")}<div class="story">→ ${esc(w.story)}</div></td>
        <td><b>${esc(w.meaning)}</b>${(w.related ?? []).map((r) => `<div class="rel">${esc(r.w)} <i>${esc(r.pos)}</i> ${esc(r.vi)}</div>`).join("")}${w.trap ? `<div class="trap">⚠ ${esc(plain(w.trap))}</div>` : ""}</td>
      </tr>
      <tr class="ex"><td colspan="4">“${highlight(w.example, w.word)}” <span class="vi">${esc(w.example_vi)}</span></td></tr>`
      )
      .join("");
    const qs = shuffle(f.words, f.id).slice(0, Math.min(5, f.words.length));
    const bank = shuffle(f.words.map((w) => w.word), f.id + "bank");
    answers.push(`<div class="ans"><b>${fi + 1}. ${esc(f.root)}</b>: ${qs.map((q, i) => `${i + 1}) ${esc(q.example.match(new RegExp(`\\b${q.word.replace(/e$/, "").slice(0, Math.max(4, q.word.length - 2))}[a-z]*`, "i"))?.[0] ?? q.word)}`).join(" · ")}</div>`);
    return `<section class="family">
      <div class="fhead"><div class="num">${fi + 1}</div>
        <div><div class="root" style="color:${COLORS.root}">${esc(f.root)} <span class="emo">${icon(iconOf(f), 30, 1.8)}</span></div>
        <div class="origin">${esc(f.origin)} · <b>${esc(f.core)}</b> · Hình dung: ${esc(f.image)}</div></div></div>
      <table class="words"><tr><th>Từ</th><th>Loại</th><th>Phân tích → hình dung</th><th>Nghĩa & từ liên quan</th></tr>${rows}</table>
      <div class="exercise"><h4>Luyện tập: điền dạng đúng của từ</h4>
        <div class="bank">${bank.map((b) => `<span>${esc(b)}</span>`).join("")}</div>
        <ol>${qs.map((q) => `<li>${esc(blank(q.example, q.word))}</li>`).join("")}</ol>
        <div class="self">Tự kiểm tra: che cột nghĩa, nhìn phân tích và đoán nghĩa từng từ.  ☐ Ngày 1  ☐ Ngày 3  ☐ Ngày 7  ☐ Ngày 14  ☐ Ngày 30</div>
      </div>
    </section>`;
  })
  .join("");

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>UpWind · Học từ từ gốc</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,600;0,800;1,400&display=block" rel="stylesheet">
<style>
@page{size:A4;margin:14mm 13mm}
*{box-sizing:border-box}
body{font-family:"Be Vietnam Pro","Inter",sans-serif;color:#0b2545;font-size:10.5pt;line-height:1.45;margin:0}
h1{font-size:30pt;line-height:1.15;margin:0 0 8px;color:#004b9b}
h2{font-size:17pt;color:#004b9b;margin:22px 0 8px;border-bottom:3px solid #6ac5e8;padding-bottom:4px}
h3{font-size:12.5pt;margin:14px 0 4px}
h4{margin:0 0 6px;font-size:11pt}
.cover{height:265mm;display:flex;flex-direction:column;justify-content:center;page-break-after:always}
.cover img{width:90px}
.cover .sub{font-size:14pt;color:#4a6b8a;margin-top:6px}
.cover .stats{display:flex;gap:16px;margin-top:30px}
.cover .stat{border:2px solid #cfe9f7;border-radius:12px;padding:12px 18px}
.cover .stat b{display:block;font-size:22pt;color:#f2711c}
.legend span{font-weight:800;margin-right:14px}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.step{border:2px solid #cfe9f7;border-radius:12px;padding:10px 12px}
.step b{color:#f2711c}
.note{background:#fff3b0;border-radius:10px;padding:8px 12px;margin:10px 0}
table{width:100%;border-collapse:collapse;margin:6px 0}
th{background:#004b9b;color:#fff;text-align:left;padding:5px 7px;font-size:9.5pt}
td{border-bottom:1px solid #e3edf5;padding:5px 7px;vertical-align:top}
.affix td:first-child{white-space:nowrap}
.family{page-break-before:always}
.fhead{display:flex;gap:14px;align-items:center;margin-bottom:8px}
.fhead .num{background:#004b9b;color:#fff;font-weight:800;font-size:18pt;border-radius:12px;width:46px;height:46px;display:flex;align-items:center;justify-content:center}
.fhead .root{font-size:22pt;font-weight:800}
.emo{color:#004b9b;vertical-align:-4px}.ico{display:inline-block}
.origin{color:#4a6b8a}
.words .w{font-weight:800;font-size:12.5pt;white-space:nowrap}
.ipa{font-weight:400;font-size:9pt;color:#4a6b8a}
.pos{font-style:italic;color:#4a6b8a;white-space:nowrap}
.story{color:#4a6b8a;font-size:9.5pt}
.rel{font-size:9.5pt}.rel i{color:#4a6b8a}
.trap{color:#b42318;font-size:9.5pt;font-weight:600}
tr.ex td{border-bottom:2px solid #cfe9f7;font-size:9.5pt;padding-top:0;color:#0b2545}
tr.ex .vi{color:#4a6b8a;font-style:italic;margin-left:6px}
mark{background:#ffd166;padding:0 3px;border-radius:3px}
.exercise{margin-top:12px;border:2px dashed #6ac5e8;border-radius:12px;padding:10px 14px;page-break-inside:avoid}
.bank span{display:inline-block;border:1.5px solid #004b9b;border-radius:999px;padding:1px 10px;margin:2px 4px 2px 0;font-weight:600;font-size:9.5pt}
.exercise ol{margin:8px 0 6px 18px;padding:0}.exercise li{margin:4px 0}
.self{font-size:9pt;color:#4a6b8a}
.answers{page-break-before:always}
.ans{margin:4px 0}
</style></head><body>
<div class="cover">
  <img src="${logo}" alt="">
  <h1>Học từ từ gốc</h1>
  <div class="sub">Học từ vựng tiếng Anh từ gốc · UpWind IELTS · Học một gốc, nhớ cả họ từ</div>
  <div class="stats"><div class="stat"><b>${families.length}</b>gốc từ La-tinh</div><div class="stat"><b>${allWords.length}</b>từ chính</div>
  <div class="stat"><b>${allWords.reduce((n, w) => n + (w.related?.length ?? 0), 0)}</b>từ phái sinh</div></div>
  <p class="legend" style="margin-top:30px">Mã màu xuyên suốt tài liệu và video: <span style="color:${COLORS.pre}">tiền tố</span><span style="color:${COLORS.root}">gốc từ</span><span style="color:${COLORS.suf}">hậu tố</span></p>
</div>

<h2>Phương pháp: 4 bước cho mỗi gốc từ</h2>
<div class="steps">
  <div class="step"><b>1. Neo gốc bằng một hình ảnh.</b> Mỗi gốc chỉ có một nghĩa lõi (voc = gọi, spect = nhìn). Gắn nó với một cảnh cụ thể, ví dụ một người đang cất tiếng gọi, rồi dùng lại đúng cảnh đó cho mọi từ trong họ.</div>
  <div class="step"><b>2. Tách: tiền tố + gốc + hậu tố.</b> Tiền tố cho biết <i>hướng</i> (ra, vào, lại, trước...), hậu tố cho biết <i>loại từ</i> (-tion danh từ, -able tính từ, -ate động từ).</div>
  <div class="step"><b>3. Kể một câu chuyện nhỏ.</b> “e (ra) + voke (gọi) = gọi ra ngoài → <b>evoke</b>: khơi gợi ký ức.” Câu chuyện là cầu nối giữa nghĩa đen và nghĩa thật; đừng học thuộc nghĩa trước khi có câu chuyện.</div>
  <div class="step"><b>4. Gắn vào câu thật và ôn cách quãng.</b> Mỗi từ có một câu ví dụ kiểu IELTS. Ôn vào ngày 1, 3, 7, 14, 30 (ô ☐ cuối mỗi bài) bằng cách che cột nghĩa và tự đoán.</div>
</div>
<div class="note"><b>Dùng trong phòng thi:</b> gặp từ lạ trong IELTS Reading, hãy tách nó ra. “irrevocable” = ir (không) + re (lại) + voc (gọi) + able (có thể) → không thể gọi lại → không thể thay đổi. Thường đủ để chọn đúng đáp án mà không cần biết từ trước.</div>
<div class="note"><b>Cẩn thận:</b> gốc từ cho hướng đoán, không phải định nghĩa. Nghĩa hiện đại có thể đã trôi xa (<i>addict</i>, <i>bankrupt</i>), và có những cặp “bẫy” trông giống nhau nhưng khác gốc (<i>vocation</i> và <i>vacation</i>). Luôn kiểm tra lại bằng câu ví dụ.</div>

<h2>Bảng tiền tố gặp trong tài liệu</h2>${affixTable("pre")}
<h2>Bảng hậu tố gặp trong tài liệu</h2>${affixTable("suf")}

${familyPages}

<section class="answers"><h2>Đáp án luyện tập</h2>${answers.join("")}</section>
</body></html>`;

const dir = path.join(OUT_DIR, "handbook");
ensureDir(dir);
const htmlFile = path.join(dir, "upwind-goc-tu.html");
fs.writeFileSync(htmlFile, html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + htmlFile, { waitUntil: "networkidle" }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.join(dir, "upwind-goc-tu.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`✓ ${path.relative(ROOT_DIR, htmlFile)} + .pdf (${families.length} families, ${allWords.length} words)`);
