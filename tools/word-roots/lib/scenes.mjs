// Turns one root family into an ordered list of scenes: { kind, say, hold, html }.
// `say` is the narration; {{...}} marks English, voiced by the English voice (see make-video.mjs).
// Narration is written so English always sits at a clean boundary ("Vì vậy, {{erupt}} nghĩa là ..."),
// never glued mid-syllable, so the spliced audio sounds natural.
import { COLORS, KIND_VI, esc, plain, coloredWord, highlight, blank } from "./common.mjs";
import { icon, UI_ICONS as UI } from "./icons.mjs";
import { animEmoji } from "./emoji.mjs";

const POS_VI = { "n.": "danh từ", "v.": "động từ", "adj.": "tính từ", "adv.": "trạng từ" };
export const posVi = (pos) => pos.split("/").map((p) => POS_VI[p.trim()] ?? p.trim()).join(" và ");
// Force colour (emoji) presentation, e.g. 🎶 otherwise renders as a grey text glyph.
export const emo = (e) => (e.includes("️") ? e : e + "️");
const mainRoot = (f) => f.root.split("/")[0].trim();
const clean = (t) => t.replace(/[()]/g, "");

function splitSay(w) {
  const pre = w.parts.find((p) => p.k === "pre");
  const root = w.parts.find((p) => p.k === "root");
  const suf = w.parts.filter((p) => p.k === "suf");
  const s = pre
    ? `{{${clean(pre.t)}}} là tiền tố, nghĩa là ${pre.vi}. {{${clean(root.t)}}} là gốc từ, nghĩa là ${root.vi}.`
    : `{{${clean(root.t)}}} là gốc từ, nghĩa là ${root.vi}. Thêm hậu tố {{${suf[0].t}}}, chỉ ${suf[0].vi}.`;
  return `${s} Hãy tưởng tượng: ${w.story}.`;
}

function meaningSay(w) {
  let s = `Vì vậy, {{${w.word}}} nghĩa là ${w.meaning}.`;
  for (const r of (w.related ?? []).slice(0, 2)) s += ` {{${r.w}}} là ${posVi(r.pos)}, nghĩa là ${r.vi}.`;
  if (w.trap) s += ` ${w.trap}`;
  return s;
}

/* ---------- visual blocks ---------- */

export function partsBlocks(w, animate = true) {
  const n = w.parts.length;
  const a = (cls) => (animate ? cls : "");
  return `<div class="parts">${w.parts
    .map((p, i) => {
      const dir = i === 0 && n > 1 ? "a-left" : i === n - 1 ? "a-right" : "a-drop";
      return `<div class="part">
        <div class="tile ${a(dir)}" style="--c:${COLORS[p.k]};--i:${i * 2}">${esc(p.t)}</div>
        <div class="kind ${a("a-up")}" style="--i:${i * 2 + 3}">${KIND_VI[p.k]}</div>
        <div class="gloss ${a("a-up")}" style="--i:${i * 2 + 4}">${esc(p.vi ?? "")}</div>
      </div>`;
    })
    .join(`<div class="plus ${a("a-pop")}" style="--i:2">+</div>`)}</div>`;
}

/** The word assembled from its parts: each part slides in from its side and snaps together. */
function mergedWord(w) {
  const n = w.parts.length;
  return w.parts
    .map((p, i) => {
      const dx = n === 1 ? 0 : Math.round(((i - (n - 1) / 2) / ((n - 1) / 2)) * 220);
      return `<span class="a-merge" style="color:${COLORS[p.k]};--dx:${dx}px">${esc(p.t)}</span>`;
    })
    .join("");
}

/** Sentence revealed word by word; the target word's highlight pops a beat later. */
function wordByWord(sentence, word) {
  return highlight(sentence, word)
    .split(/(<mark>.*?<\/mark>|\s+)/)
    .filter((t) => t && !/^\s+$/.test(t))
    .map((t, i) => {
      const inner = t.startsWith("<mark>") ? t.replace("<mark>", `<mark class="a-pop" style="--i:${i};--d:300ms">`) : t;
      return `<span class="a-word" style="--i:${i}">${inner}</span>`;
    })
    .join(" ");
}

export function buildScenes(f, opts = {}) {
  const words = f.words.slice(opts.from ?? 0, (opts.from ?? 0) + (opts.max ?? f.words.length));
  const total = words.length;
  const root = mainRoot(f);
  const scenes = [];
  const counter = (n) => `<div class="counter a-pop">${n}/${total}</div>`;

  // 0. Bait: a surprising literal meaning, slammed on screen in the first second
  if (f.bait) {
    scenes.push({
      kind: "bait",
      say: f.bait.say,
      hold: 0.2,
      html: `<div class="bait">
        <div class="tag a-stamp">${icon(UI.literal, 44)} NGHĨA ĐEN</div>
        <div class="bword a-slam" style="--d:150ms">${esc(f.bait.word)}</div>
        <div class="eq a-pop" style="--d:550ms">=</div>
        <div class="a-pop" style="--d:700ms"><span class="lit a-sweep" style="--d:950ms">${esc(f.bait.literal)}</span></div>
        <div class="a-drop" style="--d:1150ms">${animEmoji(f, 230)}</div>
      </div>`,
    });
  }

  // 1. Hook: the question + the word cloud + tease of the end-of-video challenge
  const cloud = f.words
    .flatMap((w) => [w.word, ...(w.related ?? []).map((r) => r.w)])
    .slice(0, 16)
    .map((x, i) => `<span class="cw a-pop" style="--i:${i};--d:250ms">${esc(x)}</span>`)
    .join("");
  scenes.push({
    kind: "hook",
    say: `${f.hook} Học một gốc, nhớ cả ${total} từ. Cuối video có thử thách cho bạn đấy!`,
    html: `<div class="hook">
      <div class="q a-up">${esc(plain(f.hook))}</div>
      <div class="cloud">${cloud}</div>
      <div class="tease a-stamp" style="--d:1700ms">${icon(UI.challenge, 44)} Thử thách ở cuối video</div>
    </div>`,
  });

  // 2. The root itself
  scenes.push({
    kind: "root",
    say: `Tất cả đều có chung một gốc từ. {{${f.say_root ?? root}}}. {{${f.origin.replace(/^(Latin|Greek)\s*/, "")}}} trong tiếng ${/^Greek/.test(f.origin) ? "Hy Lạp" : "La-tinh"} nghĩa là ${f.core}. Hãy tưởng tượng ${f.image}.`,
    html: `<div class="rootcard">
      <div class="a-drop">${animEmoji(f, 250)}</div>
      <div class="rootword a-slam" style="color:${COLORS.root};--d:200ms">${esc(f.root)}</div>
      <div class="origin a-up" style="--d:500ms">${esc(f.origin)}</div>
      <div class="core a-wipe" style="--d:650ms">= ${esc(f.core)}</div>
      <div class="image a-up" style="--d:900ms">${esc(f.image)}</div>
    </div>`,
  });

  // 3. Each word: split -> meaning -> example
  words.forEach((w, i) => {
    const n = i + 1;
    scenes.push({
      kind: "split",
      say: splitSay(w),
      html: `${counter(n)}<div class="split">
        ${partsBlocks(w)}
        <div class="a-drop" style="--d:700ms">${animEmoji(w.anim ? w : f, 260)}</div>
        <div class="story a-up" style="--d:900ms">${esc(w.story)}</div>
      </div>`,
    });
    const rel = (w.related ?? [])
      .map((r, k) => `<div class="rel a-up" style="--i:${k};--d:800ms"><b>${esc(r.w)}</b> <i>${esc(r.pos)}</i> ${esc(r.vi)}</div>`)
      .join("");
    scenes.push({
      kind: "meaning",
      say: meaningSay(w),
      html: `${counter(n)}<div class="meaning">
        <div class="word">${mergedWord(w)}</div>
        <div class="ipa a-up" style="--d:350ms">${esc(w.ipa)} · <i>${esc(w.pos)}</i></div>
        <div class="a-pop" style="--d:450ms"><span class="mean a-sweep" style="--d:700ms">${esc(w.meaning)}</span></div>
        ${rel ? `<div class="rels">${rel}</div>` : ""}
        ${w.trap ? `<div class="trap a-shake" style="--d:1100ms">${icon(UI.trap, 44)} ${esc(plain(w.trap))}</div>` : ""}
      </div>`,
    });
    scenes.push({
      kind: "example",
      say: `{{${w.example}}} ${w.example_vi}`,
      hold: 0.7,
      caption: w.example_vi,
      html: `${counter(n)}<div class="example">
        <div class="label a-up">Ví dụ · ${esc(w.word)}</div>
        <div class="en">“${wordByWord(w.example, w.word)}”</div>
        <div class="vi a-up" style="--d:1400ms">${esc(w.example_vi)}</div>
      </div>`,
    });
  });

  // 4. Recap table
  scenes.push({
    kind: "recap",
    say: `Ôn lại nhanh cả ${total} từ nhé. Chụp màn hình lại để học!`,
    hold: 2.5,
    html: `<div class="recap"><div class="title a-up">Gốc <span style="color:${COLORS.root}">${esc(f.root)}</span> = ${esc(f.core)}</div>
      <div class="rows">${words
        .map((w, k) => `<div class="row a-left" style="--i:${k}"><span class="w">${coloredWord(w)}</span><span class="p">${esc(w.pos)}</span><span>${esc(w.meaning)}</span></div>`)
        .join("")}</div></div>`,
  });

  // 5. Quiz (answer goes in the pinned comment, which drives comments)
  const q = words[(opts.quizIndex ?? words.length - 1) % words.length];
  const others = words.filter((w) => w !== q).slice(0, 2);
  const options = [q, ...others].sort((a, b) => a.word.localeCompare(b.word));
  scenes.push({
    kind: "quiz",
    say: "Thử thách đây! Điền từ nào vào chỗ trống? Bình luận A, B hay C nhé!",
    hold: 2.5,
    quizAnswer: `${String.fromCharCode(65 + options.indexOf(q))}. ${q.word}`,
    quiz: { sentence: blank(q.example, q.word), options: options.map((o) => o.word) },
    html: `<div class="quiz">
      <div class="label a-stamp">${icon(UI.challenge, 40)} Thử thách</div>
      <div class="en a-up" style="--d:200ms">“${esc(blank(q.example, q.word))}”</div>
      <div class="opts">${options.map((o, i) => `<div class="opt a-pop" style="--i:${i};--d:500ms"><b>${"ABC"[i]}</b> ${esc(o.word)}</div>`).join("")}</div>
      <div class="hint a-shake" style="--d:1000ms">${icon(UI.comment, 46)} Bình luận đáp án của bạn</div>
    </div>`,
  });

  // 6. CTA: tease the next video (next family, or the next part), then ask for the follow
  const next = opts.next;
  const nextPart = opts.part?.hasNext;
  let teaseSay, teaseHtml;
  if (nextPart) {
    const nw = f.words.slice((opts.from ?? 0) + total, (opts.from ?? 0) + total + 3);
    teaseSay = `Phần ${opts.part.n + 1} có thêm ${nw.length} từ nữa cùng gốc này. Theo dõi kênh để không bỏ lỡ nhé!`;
    teaseHtml = `<div class="nextroot a-slam" style="--d:350ms;color:${COLORS.root}">Phần ${opts.part.n + 1}</div>
      <div class="nextwords">${nw.map((w, k) => `<span class="cw a-pop" style="--i:${k};--d:800ms">${esc(w.word)}</span>`).join("")}</div>`;
  } else if (next) {
    const nr = mainRoot(next);
    const nw = next.words.slice(0, 3);
    teaseSay = `Video tiếp theo: một gốc từ mang nghĩa ${next.core}, mở khóa thêm ${next.words.length} từ mới. Theo dõi kênh để mỗi ngày học trọn một họ từ nhé!`;
    teaseHtml = `<div class="nextroot a-slam" style="--d:350ms;color:${COLORS.root}">${esc(next.root)} ${animEmoji(next, 120)}</div>
      <div class="nextcore a-wipe" style="--d:650ms">= ${esc(next.core)}</div>
      <div class="nextwords">${nw.map((w, k) => `<span class="cw a-pop" style="--i:${k};--d:850ms">${esc(w.word)}</span>`).join("")}<span class="cw a-pop" style="--i:3;--d:850ms">…</span></div>`;
  } else {
    teaseSay = "Theo dõi kênh để mỗi ngày học trọn một họ từ nhé!";
    teaseHtml = "";
  }
  scenes.push({
    kind: "cta",
    say: teaseSay,
    hold: 1,
    html: `<div class="cta">
      <img src="__LOGO__" class="ctalogo a-drop" alt="">
      ${teaseHtml ? `<div><span class="nexttag a-stamp" style="--d:200ms">${nextPart ? "PHẦN SAU" : "TẬP SAU"} ${icon(UI.next, 44, 2.4)}</span></div>${teaseHtml}` : ""}
      <div class="follow a-up" style="--d:1300ms">${icon(UI.follow, 56)} Theo dõi <b>UpWind</b><br>mỗi ngày 1 họ từ</div>
    </div>`,
  });

  return { scenes, words, quizAnswer: scenes.find((s) => s.kind === "quiz").quizAnswer };
}
