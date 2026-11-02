// "Đoán từ · gốc từ": a 5-word guessing game built from a root family (data/families.json).
// Each word: the root is already in the blanks ("_ _ RUPT"), the Vietnamese meaning is the clue, a 3-second
// countdown runs, then the missing letters type in (prefix orange, root blue, suffix green) with IPA and the
// prefix + root breakdown. Scenes: intro -> (ask, reveal) x 5 -> end (score + ebook offer).
//
// The ask scene's countdown starts after its narration, so its HTML is built after the audio is known:
// `scene.html` is a function of `scene.__speech` (seconds), called by make-video.mjs.
import { COLORS, esc } from "./common.mjs";
import { css, wave, header, FONT_LINK } from "./template.mjs";
import { offerSay, offerHtml, offerCaption } from "./offer.mjs";
import { animEmoji, lottieScripts } from "./emoji.mjs";
import { shortMeaning } from "./scenes.mjs";

export const QUIZ_COUNT = 5;
export const COUNTDOWN = 3; // seconds
const NUM_VI = ["một", "hai", "ba", "bốn", "năm", "sáu", "bảy"];
const mainRoot = (f) => f.root.split("/")[0].trim();
const clean = (t) => t.replace(/[()]/g, "");
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/** The words in the game: `quiz` (list of words) in the data if set, else the first five. */
export function quizWords(f) {
  const pick = f.quiz ? f.quiz.map((q) => f.words.find((w) => w.word === q)).filter(Boolean) : f.words;
  return pick.slice(0, QUIZ_COUNT);
}

/** One slot per letter; k = pre | root | suf. Root slots are filled from the start. */
function letters(w) {
  return w.parts.flatMap((p) => [...clean(p.t)].map((ch) => ({ ch, k: p.k })));
}

/** Letter slots. mode "ask": root shown, rest blank. mode "reveal": the rest types in (staggered). */
function slots(w, mode, d = 0) {
  const ls = letters(w);
  const size = Math.min(118, Math.floor(860 / ls.length / 0.78));
  let n = 0;
  const html = ls
    .map(({ ch, k }) => {
      const shown = k === "root" || mode !== "ask";
      const anim = mode === "reveal" && k !== "root" ? ` a-type" style="--d:${d + n++ * 70}ms` : "";
      return `<span class="sl ${k}${shown ? "" : " empty"}${anim}">${shown ? esc(ch.toUpperCase()) : ""}</span>`;
    })
    .join("");
  return `<div class="slots" style="--fs:${size}px">${html}</div>`;
}

const head = (n, total) => `<div class="qhead"><span>Từ ${n}/${total}</span><span class="dot">·</span><span>Đoán từ</span></div>`;

export function buildQuizScenes(f, { speed = 1.1 } = {}) {
  const words = quizWords(f);
  const total = words.length;
  const root = mainRoot(f);
  const sayRoot = f.say_root ?? root;
  const scenes = [];

  // 1. Intro: the root and the rules
  scenes.push({
    kind: "intro",
    chip: root,
    say: `Thử thách ${NUM_VI[total - 1]} từ, mỗi từ ${NUM_VI[COUNTDOWN - 1]} giây! Gợi ý: tất cả đều có gốc {{${sayRoot}}}, nghĩa là ${shortMeaning(f.core)}. Bạn đoán được mấy từ?`,
    hold: 0.6,
    html: `<div class="qintro">
      <div class="qtag a-stamp">ĐOÁN TỪ · ${total} TỪ · ${COUNTDOWN} GIÂY</div>
      <div class="qroot a-slam" style="--d:350ms">${esc(f.root)}</div>
      <div class="qcore a-wipe" style="--d:700ms">= ${esc(f.core)}</div>
      <div class="qrow a-up" style="--d:1000ms">${words.map((w) => `<span class="mini">${letters(w).map((l) => (l.k === "root" ? `<b>${esc(l.ch.toUpperCase())}</b>` : "_")).join("")}</span>`).join("")}</div>
      <div class="qscore a-pop" style="--d:1300ms">Bạn đoán được mấy/${total}?</div>
    </div>`,
  });

  words.forEach((w, i) => {
    const n = i + 1;
    // 2. Ask: meaning as the clue, root in the blanks, countdown after the narration.
    const ask = {
      kind: "ask",
      chip: `${n}/${total}`,
      say: `Từ số ${NUM_VI[i]}: ${shortMeaning(w.meaning)}.`,
      hold: (COUNTDOWN + 0.35) * speed,
      countdown: true,
    };
    ask.html = (speech = 1.2) => {
      const t0 = Math.round((0.12 + speech + 0.1) * 1000);
      return `<div class="qcard">
        ${head(n, total)}
        ${slots(w, "ask")}
        <div class="qmean a-up" style="--d:150ms">${esc(w.meaning)}</div>
        <div class="qhint a-up" style="--d:300ms"><b>${esc(root)}</b> = ${esc(f.core)} · <i>${esc(w.pos)}</i></div>
        <div class="timer" style="--t0:${t0}ms">
          <svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="52"/><circle class="arc" cx="60" cy="60" r="52"/></svg>
          <span class="tn n3">3</span><span class="tn n2">2</span><span class="tn n1">1</span>
        </div>
        <div class="tbar"><span style="--t0:${t0}ms"></span></div>
      </div>`;
    };
    ask.t0 = (speech) => 0.12 + speech + 0.1;
    scenes.push(ask);

    // 3. Reveal: letters type in, then IPA + breakdown + mnemonic.
    const typed = letters(w).filter((l) => l.k !== "root").length;
    const after = 250 + typed * 70 + 200;
    const formula = w.parts
      .map((p) => `<span class="fp" style="--c:${COLORS[p.k]}"><b>${esc(p.t)}</b><small>${esc(p.vi)}</small></span>`)
      .join(`<span class="fplus">+</span>`);
    scenes.push({
      kind: "reveal",
      chip: `${n}/${total}`,
      ding: true,
      say: `{{The answer is ${w.word}}}. ${cap(w.story)}.`,
      hold: 0.5,
      html: `<div class="qcard reveal">
        ${head(n, total)}
        ${slots(w, "reveal", 250)}
        <div class="qipa a-up" style="--d:${after}ms">${esc(w.ipa)} · <i>${esc(w.pos)}</i></div>
        <div class="qmean a-up" style="--d:${after + 100}ms">${esc(w.meaning)}</div>
        <div class="formula a-up" style="--d:${after + 350}ms">${formula}</div>
        <div class="qemo a-pop" style="--d:${after + 500}ms">${animEmoji(w, 150)}</div>
      </div>`,
    });
  });

  // 4. End: score + the ebook offer (shared call to action).
  scenes.push({
    kind: "end",
    chip: root,
    say: `Bạn được mấy trên ${NUM_VI[total - 1]}? ${offerSay()}`,
    hold: 1,
    html: `<div class="qend">
      <div class="qscore big a-slam">Bạn được <span>?/${total}</span></div>
      <div class="answers">${words
        .map((w, k) => `<span class="ans a-pop" style="--i:${k};--d:400ms">${w.parts.map((p) => `<b style="color:${COLORS[p.k]}">${esc(p.t)}</b>`).join("")}</span>`)
        .join("")}</div>
      ${offerHtml(1100)}
    </div>`,
  });
  return { scenes, words };
}

export const QUIZ_STYLE = `
.qhead{font-size:34px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:#9fc4e4;display:flex;gap:14px;justify-content:center}
.qhead .dot{color:#f2711c}
.qcard{width:100%;min-height:860px;background:#0b2545;border-radius:44px;padding:56px 50px 60px;text-align:center;color:#fff;
  box-shadow:0 30px 60px rgba(0,48,102,.28),0 0 0 8px #cfe9f7}
.slots{display:flex;justify-content:center;gap:calc(var(--fs) * .1);margin:48px 0 10px;font-size:var(--fs);font-weight:800;line-height:1}
.sl{display:inline-flex;align-items:flex-end;justify-content:center;width:calc(var(--fs) * .78);height:calc(var(--fs) * 1.12);
  border-bottom:calc(var(--fs) * .07) solid #4a6b8a;padding-bottom:calc(var(--fs) * .06)}
.sl.root{color:#6ac5e8;border-color:#6ac5e8}
.reveal .sl.pre{color:#ff9a52;border-color:#ff9a52}.reveal .sl.suf{color:#4cd38a;border-color:#4cd38a}
.a-type{animation:type .22s cubic-bezier(.2,.9,.3,1.5) both;animation-delay:var(--d,0ms)}
@keyframes type{0%{transform:translateY(-40px) scale(1.6);opacity:0}100%{transform:none;opacity:1}}
.qmean{font-size:62px;font-weight:800;color:#ffd166;margin-top:34px;line-height:1.2;text-wrap:balance}
.qhint{font-size:38px;font-weight:600;color:#cfe0ef;margin-top:22px}
.qhint b{color:#004b9b;background:#fff;border-radius:10px;padding:0 12px}
.qipa{font-size:44px;color:#9fc4e4;margin-top:22px}
.timer{position:relative;width:200px;height:200px;margin:44px auto 0}
.timer svg{width:100%;height:100%;transform:rotate(-90deg)}
.timer circle{fill:none;stroke-width:12}
.timer .trk{stroke:#1d3a5c}
.timer .arc{stroke:#f2711c;stroke-linecap:round;stroke-dasharray:327;stroke-dashoffset:0;
  animation:arc ${COUNTDOWN}s linear both;animation-delay:var(--t0)}
@keyframes arc{to{stroke-dashoffset:327}}
.tn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:96px;font-weight:800;opacity:0;
  animation:tick 1s steps(1,end) forwards}
.n3{opacity:1}
.n3{animation-delay:var(--t0)}
.n2{animation-delay:calc(var(--t0) + 1s)}
.n1{animation-delay:calc(var(--t0) + 2s);color:#ffd166}
@keyframes tick{0%{opacity:1}100%{opacity:0}}
.tbar{height:16px;border-radius:999px;background:#1d3a5c;margin:40px 40px 0;overflow:hidden}
.tbar span{display:block;height:100%;background:linear-gradient(90deg,#f2711c,#ffd166);border-radius:999px;transform-origin:left;
  animation:bar ${COUNTDOWN}s linear both;animation-delay:var(--t0)}
@keyframes bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.formula{display:flex;justify-content:center;align-items:flex-start;gap:14px;margin-top:40px;flex-wrap:wrap}
.fp{display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:22px;padding:10px 26px 12px;min-width:150px}
.fp b{font-size:56px;color:var(--c);line-height:1.1}
.fp small{font-size:30px;font-weight:700;color:#4a6b8a;max-width:260px;text-wrap:balance}
.fplus{font-size:56px;font-weight:800;color:#9fc4e4;margin-top:8px}
.qemo{margin-top:24px;line-height:0}
.qintro,.qend{text-align:center;width:100%}
.qtag{display:inline-block;font-size:42px;font-weight:800;color:#fff;background:#f2711c;border-radius:16px;padding:10px 28px;letter-spacing:1px}
.qroot{font-size:170px;font-weight:800;color:#004b9b;letter-spacing:-2px;line-height:1.05;margin-top:50px;white-space:nowrap}
.qcore{font-size:84px;font-weight:800;color:#f2711c;margin-top:6px}
.qrow{display:flex;flex-wrap:wrap;justify-content:center;gap:16px 20px;margin-top:56px}
.mini{font-size:44px;font-weight:800;color:#9fb3c8;background:#fff;border:4px solid #cfe9f7;border-radius:18px;padding:6px 20px;letter-spacing:7px}
.mini b{color:#004b9b}
.qscore{display:inline-block;margin-top:56px;font-size:58px;font-weight:800;color:#0b2545;background:#fff3b0;border-radius:24px;padding:16px 36px}
.qscore.big{font-size:84px;margin-top:0}
.qscore.big span{color:#f2711c}
.answers{display:flex;flex-wrap:wrap;justify-content:center;gap:16px 20px;margin-top:44px}
.ans{font-size:52px;font-weight:800;background:#fff;border:4px solid #cfe9f7;border-radius:20px;padding:8px 24px}
/* carousel: no countdown, a "Lướt xem đáp án" hint instead */
.static .timer,.static .tbar{display:none}
.static .qcard{padding:44px 44px 48px;min-height:0}
.static .slots{margin-top:36px}
.static .qemo{display:none}
`;

export function quizFrameHtml({ family, scene, logo }) {
  const html = typeof scene.html === "function" ? scene.html(scene.__speech) : scene.html;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">${FONT_LINK}
<style>${css()}${QUIZ_STYLE}</style></head><body class="video">
${wave()}
${header(family, logo, { series: "Đoán từ · gốc từ", chip: scene.chip })}
<main>${html}</main>
${lottieScripts(html)}
</body></html>`;
}

/** Post text: the game, the answers in the pinned comment (so people guess first), the offer. */
export function quizCaption(f, words) {
  return [
    `🎯 Đoán từ · gốc ${mainRoot(f)} | Bạn đoán được mấy/${words.length} từ?`,
    "",
    `Gợi ý: cả ${words.length} từ đều có gốc "${f.root}" (${f.origin}) = ${f.core}. Mỗi từ ${COUNTDOWN} giây!`,
    "👇 Bình luận số điểm của bạn: ?/" + words.length,
    "",
    ...offerCaption(),
    `#doantu #hoctututugoc #upwind #goctu #ielts #tuvungtienganh #hoctienganh #${f.id}`,
    "",
    "--- Bình luận ghim (đáp án) ---",
    ...words.map((w, i) => `${i + 1}. ${w.word} (${w.pos}): ${w.meaning}  [${w.parts.map((p) => `${p.t} = ${p.vi}`).join(" + ")}]`),
  ].join("\n");
}
