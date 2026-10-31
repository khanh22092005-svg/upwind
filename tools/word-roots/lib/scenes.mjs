// Turns one root family into an ordered list of scenes: { kind, say, hold, html }.
// `say` is the narration; {{...}} marks English that is voiced by the English TTS voice.
import { COLORS, KIND_VI, esc, plain, coloredWord, highlight, blank } from "./common.mjs";

const POS_VI = { "n.": "danh từ", "v.": "động từ", "adj.": "tính từ", "adv.": "trạng từ" };
const posVi = (pos) => pos.split("/").map((p) => POS_VI[p.trim()] ?? p.trim()).join(" và ");
// Force colour (emoji) presentation, e.g. 🎶 otherwise renders as a grey text glyph.
const emo = (e) => (e.includes("\uFE0F") ? e : e + "\uFE0F");
const mainRoot = (f) => f.root.split("/")[0].trim();

function partsLine(w) {
  return w.parts.map((p) => `{{${p.t.replace(/[()]/g, "")}}}`).join(" cộng ");
}

function splitSay(w) {
  const pre = w.parts.find((p) => p.k === "pre");
  const suf = w.parts.filter((p) => p.k === "suf");
  let s = "";
  if (pre) s += `Tiền tố {{${pre.t.replace(/[()]/g, "")}}} nghĩa là ${pre.vi}. `;
  else if (suf.length) s += `Hậu tố {{${suf[0].t}}} là ${suf[0].vi}. `;
  s += `${partsLine(w)}: hãy tưởng tượng ${w.story}.`;
  return s;
}

function meaningSay(w) {
  let s = `Vì vậy, {{${w.word}}} nghĩa là ${w.meaning}.`;
  for (const r of (w.related ?? []).slice(0, 2)) s += ` {{${r.w}}} là ${posVi(r.pos)}: ${r.vi}.`;
  if (w.trap) s += ` ${w.trap}`;
  return s;
}

/* ---------- visual blocks ---------- */

function partsBlocks(w) {
  return `<div class="parts">${w.parts
    .map(
      (p) => `<div class="part">
        <div class="tile" style="--c:${COLORS[p.k]}">${esc(p.t)}</div>
        <div class="kind">${KIND_VI[p.k]}</div>
        <div class="gloss">${esc(p.vi ?? "")}</div>
      </div>`
    )
    .join('<div class="plus">+</div>')}</div>`;
}

function wordHeader(w, n, total) {
  return `<div class="counter">${n}/${total}</div>`;
}

export function buildScenes(f, opts = {}) {
  const words = f.words.slice(opts.from ?? 0, (opts.from ?? 0) + (opts.max ?? f.words.length));
  const total = words.length;
  const root = mainRoot(f);
  const scenes = [];

  // 1. Hook: the question + the word cloud
  const cloud = f.words
    .flatMap((w) => [w.word, ...(w.related ?? []).map((r) => r.w)])
    .slice(0, 16)
    .map((x, i) => `<span class="cw" style="--d:${(i % 5) - 2}">${esc(x)}</span>`)
    .join("");
  scenes.push({
    kind: "hook",
    say: `${f.hook} Học một gốc từ, nhớ cả chục từ chỉ trong một video.`,
    html: `<div class="hook">
      <div class="q">${esc(plain(f.hook))}</div>
      <div class="cloud">${cloud}</div>
    </div>`,
  });

  // 2. The root itself
  scenes.push({
    kind: "root",
    say: `Tất cả đều có chung gốc từ {{${f.say_root ?? root}}}, bắt nguồn từ tiếng La-tinh {{${f.origin.replace(/^Latin\s*/, "")}}}, nghĩa là ${f.core}. Hãy tưởng tượng ${f.image}.`,
    html: `<div class="rootcard">
      <div class="emoji big">${emo(f.emoji)}</div>
      <div class="rootword" style="color:${COLORS.root}">${esc(f.root)}</div>
      <div class="origin">${esc(f.origin)}</div>
      <div class="core">= ${esc(f.core)}</div>
      <div class="image">${esc(f.image)}</div>
    </div>`,
  });

  // 3. Each word: split -> meaning -> example
  words.forEach((w, i) => {
    const n = i + 1;
    scenes.push({
      kind: "split",
      say: splitSay(w),
      html: `${wordHeader(w, n, total)}<div class="split">
        ${partsBlocks(w)}
        <div class="emoji">${emo(w.emoji ?? f.emoji)}</div>
        <div class="story">${esc(w.story)}</div>
      </div>`,
    });
    const rel = (w.related ?? [])
      .map((r) => `<div class="rel"><b>${esc(r.w)}</b> <i>${esc(r.pos)}</i> ${esc(r.vi)}</div>`)
      .join("");
    scenes.push({
      kind: "meaning",
      say: meaningSay(w),
      html: `${wordHeader(w, n, total)}<div class="meaning">
        <div class="word">${coloredWord(w)}</div>
        <div class="ipa">${esc(w.ipa)} · <i>${esc(w.pos)}</i></div>
        <div class="mean">${esc(w.meaning)}</div>
        ${rel ? `<div class="rels">${rel}</div>` : ""}
        ${w.trap ? `<div class="trap">⚠️ ${esc(plain(w.trap))}</div>` : ""}
      </div>`,
    });
    scenes.push({
      kind: "example",
      say: `{{${w.example}}}`,
      hold: 0.8,
      caption: w.example_vi,
      html: `${wordHeader(w, n, total)}<div class="example">
        <div class="label">Ví dụ · ${esc(w.word)}</div>
        <div class="en">“${highlight(w.example, w.word)}”</div>
        <div class="vi">${esc(w.example_vi)}</div>
      </div>`,
    });
  });

  // 4. Recap table
  scenes.push({
    kind: "recap",
    say: `Cùng ôn lại nhanh cả ${total} từ nhé. Chụp màn hình lại để học!`,
    hold: 3.5,
    html: `<div class="recap"><div class="title">Gốc <span style="color:${COLORS.root}">${esc(f.root)}</span> = ${esc(f.core)}</div>
      <table>${words
        .map((w) => `<tr><td class="w">${coloredWord(w)}</td><td class="p">${esc(w.pos)}</td><td>${esc(w.meaning)}</td></tr>`)
        .join("")}</table></div>`,
  });

  // 5. Quiz (answer goes in the pinned comment, which drives comments)
  const q = words[(opts.quizIndex ?? words.length - 1) % words.length];
  const others = words.filter((w) => w !== q).slice(0, 2);
  const options = [q, ...others].sort((a, b) => a.word.localeCompare(b.word));
  scenes.push({
    kind: "quiz",
    say: "Thử thách nhỏ: điền từ nào vào chỗ trống? Bình luận đáp án A, B hay C nhé!",
    hold: 2.5,
    quizAnswer: `${String.fromCharCode(65 + options.indexOf(q))}. ${q.word}`,
    html: `<div class="quiz">
      <div class="label">Thử thách 🧠</div>
      <div class="en">“${esc(blank(q.example, q.word))}”</div>
      <div class="opts">${options.map((o, i) => `<div class="opt"><b>${"ABC"[i]}</b> ${esc(o.word)}</div>`).join("")}</div>
      <div class="hint">Bình luận đáp án của bạn 👇</div>
    </div>`,
  });

  // 6. CTA
  scenes.push({
    kind: "cta",
    say: "Lưu video lại để ôn, và theo dõi UpWind để học thêm một gốc từ mỗi ngày nhé!",
    hold: 1,
    html: `<div class="cta">
      <img src="__LOGO__" class="ctalogo" alt="">
      <div class="big">Mỗi ngày 1 gốc từ</div>
      <div class="sub">Lưu lại · Theo dõi <b>UpWind</b></div>
    </div>`,
  });

  return { scenes, words, quizAnswer: scenes.find((s) => s.kind === "quiz").quizAnswer };
}
