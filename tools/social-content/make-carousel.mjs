#!/usr/bin/env node
// Swipeable image posts ("ảnh cuộn") for Facebook, Instagram and TikTok photo mode, from the same data.
//
//   node make-carousel.mjs voc               # -> out/carousel/voc/01.png ... + caption.txt  (1080x1350, 4:5)
//   node make-carousel.mjs all
//   node make-carousel.mjs voc --size 9:16   # 1080x1920 for TikTok photo mode
//   node make-carousel.mjs rupt --series quiz  # "Đoán từ · gốc từ": question slide, swipe, answer slide (x5)
//   node make-carousel.mjs spect --max 4     # split big families into parts (FB/IG cap posts at 10-20 images)
//
// Slides: duo cover ("Tại sao A…, còn B…?"; bait cover if the family has no duo) -> hook + word wall -> root -> one card per word -> recap -> quiz -> CTA.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { ROOT_DIR, OUT_DIR, COLORS, loadFamilies, esc, plain, coloredWord, highlight, ensureDir, captionText, nextFamily } from "./lib/common.mjs";
import { buildScenes, partsBlocks, posVi } from "./lib/scenes.mjs";
import { icon, UI_ICONS as UI } from "./lib/icons.mjs";
import { animEmoji, lottieScripts, ensureEmojiAssets } from "./lib/emoji.mjs";
import { css, wave, header, FONT_LINK } from "./lib/template.mjs";
import { buildQuizScenes, QUIZ_STYLE, quizCaption } from "./lib/quiz-scenes.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const VALUED = new Set(["size", "max", "series"]);
const target = args.find((a, i) => !a.startsWith("--") && !VALUED.has(args[i - 1]?.slice(2)));
if (!target) {
  console.error("Usage: node make-carousel.mjs <family-id>[,<id>...] | all  [--size 4:5|9:16] [--max N]");
  process.exit(1);
}
const SIZES = { "4:5": [1080, 1350], "9:16": [1080, 1920] };
const size = opt("size", "4:5");
if (!SIZES[size]) {
  console.error(`--size must be one of ${Object.keys(SIZES).join(", ")}`);
  process.exit(1);
}
const [CW, CH] = SIZES[size];
const MAX = Number(opt("max", 0)) || 0;
const QUIZ = opt("series", "roots") === "quiz";
const tall = CH > 1500;

const EXTRA = `
.static *{animation:none!important}
.counter{top:-10px}
${tall ? "" : `
.bait .bword{font-size:120px;margin-top:30px}.bait .lit{font-size:68px}.bait .badge{margin-top:24px}.rootcard .badge{margin-bottom:20px}
.hook .q{font-size:44px;margin:22px 0 34px}.cw{font-size:44px;padding:8px 22px}.cloud{gap:16px 18px}.hook .big1{font-size:96px}.hook .big2{font-size:124px}
.bait .nl{font-size:48px;margin:14px 0 10px}.bait .lit{font-size:80px}
.duo .dword{font-size:108px}.duorow{margin-top:22px}.duo .dmean{font-size:54px;margin-top:4px}.duo .vs{font-size:40px;margin-top:18px}.duo .qmark{font-size:110px;margin-top:6px}.duo .tag{font-size:40px}
.rootcard .big{font-size:180px}.rootword{font-size:130px}.core{font-size:76px}
.recap .row{padding:14px 22px;font-size:38px}.recap .w{font-size:46px}.recap .title{font-size:50px;margin-bottom:22px}
.quiz .en{font-size:58px}.opt{font-size:52px}.cta .ctalogo{width:220px;height:220px}.cta .big{font-size:84px}`}
.card .word{font-size:${tall ? 130 : 110}px}
header{top:46px}
.card .head,.card .ipa{padding-right:190px}
.follow br{display:block} main{top:180px;height:${CH - 180 - 190}px}
.cta .ctalogo{width:170px;height:170px}.nextroot{font-size:110px;margin-top:20px}.nextcore{font-size:62px}
.nextwords{margin-top:24px}.follow{margin-top:32px;font-size:48px;padding:16px 30px}.nexttag{margin-top:20px}
.card .ex{margin-top:22px}.card .rel{margin-top:10px;padding:8px 18px}.card .story{margin-top:14px}.card .mean{margin-top:26px}
.dots{background:#fff;border-radius:999px;padding:4px 18px}
`;

function page(family, logo, body, n, total, { swipe = false, chip } = {}) {
  const label = typeof swipe === "string" ? swipe : "Lướt để xem";
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">${FONT_LINK}
<style>${css(CW, CH, { video: false })}${EXTRA}${QUIZ ? QUIZ_STYLE : ""}</style></head><body class="static">
${wave(false)}${QUIZ ? header(family, logo, { series: "Đoán từ · gốc từ", chip }) : header(family, logo)}
<main>${body.replaceAll("__LOGO__", logo)}</main>
<div class="dots">${n}/${total}</div>
${lottieScripts(body, { freezeAt: 0.97 })}
${swipe ? `<div class="swipe">${label} ${icon(UI.swipe, 40, 2.6)}</div>` : ""}
</body></html>`;
}

function wordCard(f, w, n, total) {
  const rel = (w.related ?? []).map((r) => `<div class="rel"><b>${esc(r.w)}</b> <i>${esc(r.pos)}</i> ${esc(r.vi)}</div>`).join("");
  return `<div class="card" style="position:relative">
    ${animEmoji(w.anim ? w : f, 170)}
    <div class="head"><div class="word">${coloredWord(w)}</div></div>
    <div class="ipa">${esc(w.ipa)} · <i>${esc(w.pos)}</i>${w.pos.includes("/") ? "" : ` (${esc(posVi(w.pos))})`}</div>
    ${partsBlocks(w, false)}
    <div><span class="mean a-sweep">${esc(w.meaning)}</span></div>
    <div class="story">${icon(UI.story, 40)} ${w.literal ? `<b>Nghĩa đen: ${esc(w.literal)}.</b> ${esc(w.story.charAt(0).toUpperCase() + w.story.slice(1))}` : esc(w.story)}</div>
    <div class="ex"><div class="en">“${highlight(w.example, w.word)}”</div><div class="vi">${esc(w.example_vi)}</div></div>
    ${rel}
    ${w.trap ? `<div class="trap">${icon(UI.trap, 38)} ${esc(plain(w.trap))}</div>` : ""}
  </div>`;
}

/** Quiz carousel: intro, then for each word a question slide ("Lướt xem đáp án") and its answer, then the end. */
function quizBodies(family) {
  const { scenes, words } = buildQuizScenes(family);
  const html = (s) => (typeof s.html === "function" ? s.html() : s.html);
  const bodies = scenes.map((s) => ({
    html: html(s),
    chip: s.chip,
    swipe: s.kind === "intro" ? "Bắt đầu" : s.kind === "ask" ? "Lướt xem đáp án" : s.kind === "reveal" ? "Từ tiếp theo" : false,
  }));
  return { bodies, caption: quizCaption(family, words) };
}

async function makeOne(browser, family, logo, part) {
  const id = QUIZ ? `doan-${family.id}` : part ? `${family.id}-p${part.n}` : family.id;
  const dir = path.join(OUT_DIR, "carousel", size === "4:5" ? id : `${id}-${size.replace(":", "x")}`);
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
  const quiz = QUIZ ? quizBodies(family) : null;
  const { scenes, words, quizAnswer } = buildScenes(family, { ...(part ? { from: part.from, max: MAX, part } : {}), next: nextFamily(families, family) });
  const byKind = (k) => scenes.find((s) => s.kind === k)?.html;

  const bodies = quiz ? quiz.bodies : [];
  if (quiz);
  else if (byKind("duo")) bodies.push({ html: byKind("duo"), swipe: "Lướt để biết vì sao" });
  else if (byKind("bait")) bodies.push({ html: byKind("bait"), swipe: "Lướt để biết vì sao" });
  if (!quiz) bodies.push({ html: byKind("hook").replace(/<div class="tease[^]*?<\/div>/, ""), swipe: "Cùng học nào" });
  if (!quiz) {
    bodies.push({ html: byKind("root") });
    words.forEach((w, i) => bodies.push({ html: wordCard(family, w, i + 1, words.length) }));
    bodies.push({ html: byKind("recap") });
    bodies.push({ html: byKind("quiz") });
    bodies.push({ html: byKind("cta") });
  }

  const pg = await browser.newPage({ viewport: { width: CW, height: CH } });
  for (const [i, b] of bodies.entries()) {
    await pg.setContent(page(family, logo, b.html, i + 1, bodies.length, b), { waitUntil: "networkidle" }).catch(() => {});
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForFunction(() => window.__lotReady === true, null, { timeout: 15000 });
    const overflow = await pg.evaluate(() => {
      const m = document.querySelector("main");
      return m.scrollHeight > m.clientHeight + 4 || m.scrollWidth > m.clientWidth + 4;
    });
    if (overflow) console.warn(`  ! ${id} slide ${i + 1} overflows; shorten the text or use --size 9:16`);
    await pg.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, "0")}.png`) });
  }
  await pg.close();
  const caption = quiz ? quiz.caption : captionText(family, words, quizAnswer, part, nextFamily(families, family)).replace("Theo dõi UpWind", "Lướt hết để làm thử thách · Theo dõi UpWind");
  fs.writeFileSync(path.join(dir, "caption.txt"), caption + "\n");
  console.log(`✓ ${path.relative(ROOT_DIR, dir)}: ${bodies.length} slides (${CW}x${CH})`);
}

const families = loadFamilies();
ensureEmojiAssets(families);
const chosen = target === "all" ? families : families.filter((f) => target.split(",").includes(f.id));
if (!chosen.length) {
  console.error(`No family "${target}". Available: ${families.map((f) => f.id).join(", ")}`);
  process.exit(1);
}
const logo = "data:image/svg+xml;base64," + fs.readFileSync(path.join(ROOT_DIR, "../../public/favicon.svg")).toString("base64");
const browser = await chromium.launch();
try {
  for (const f of chosen) {
    if (MAX && f.words.length > MAX) {
      for (let from = 0, n = 1; from < f.words.length; from += MAX, n++)
        await makeOne(browser, f, logo, { from, n, hasNext: from + MAX < f.words.length });
    } else await makeOne(browser, f, logo);
  }
} finally {
  await browser.close();
}
