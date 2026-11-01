#!/usr/bin/env node
// "Nâng band câu này": IELTS Writing carousels. One sentence, upgraded band 5 -> 6 -> 7, every upgrade
// highlighted and explained. Data: data/upgrades.json.
//
//   node make-upgrade.mjs tech-children            # -> out/carousel/upgrade-tech-children/01.png ... + caption.txt
//   node make-upgrade.mjs tech-children --size 9:16
//   node make-upgrade.mjs all
//
// Write new sets from docs/nang-band.md (band anchors, tags, error bank, checklist).
// Text markup in the data: [[upgraded phrase]] is highlighted, {{weak phrase}} gets a red wavy underline.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { ROOT_DIR, OUT_DIR, esc, ensureDir } from "./lib/common.mjs";
import { css, wave, header, FONT_LINK } from "./lib/template.mjs";
import { icon, UI_ICONS as UI } from "./lib/icons.mjs";
import { BAND, chips, critNames, markup, plainText, bandPill, loadUpgrades, nextSet, upgradeCaption } from "./lib/upgrade.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const target = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--size");
if (!target) {
  console.error("Usage: node make-upgrade.mjs <set-id>[,<id>...] | all  [--size 4:5|9:16]");
  process.exit(1);
}
const SIZES = { "4:5": [1080, 1350], "9:16": [1080, 1920] };
const size = opt("size", "4:5");
const [CW, CH] = SIZES[size] ?? SIZES["4:5"];

const sentence = (lvl, { marks = true, small = false } = {}) =>
  `<div class="sent${small ? " small" : ""}" style="--b:${BAND[lvl.band]}">${marks ? markup(lvl.text) : esc(plainText(lvl.text))}</div>`;

const TIGHT = CH < 1500;
const EXTRA = `
.static *{animation:none!important}
.prompt b,.nowrap{white-space:nowrap}
header{top:46px} main{top:170px;height:${CH - 170 - 180}px;flex-direction:column;align-items:stretch;justify-content:center}
.slide{width:100%}
.kicker{display:inline-flex;align-items:center;gap:10px;font-size:34px;font-weight:800;color:#fff;background:#004b9b;border-radius:14px;padding:8px 20px}
.h1{font-size:76px;font-weight:800;line-height:1.12;letter-spacing:-1px;margin:22px 0 30px;text-wrap:balance}
.h2{display:flex;align-items:center;gap:18px;font-size:56px;font-weight:800;line-height:1.15;margin-bottom:26px;text-wrap:balance}
.sent{background:#fff;border:3px solid #e3f1fa;border-left:14px solid var(--b);border-radius:24px;padding:30px 34px;
  font-size:50px;font-weight:600;line-height:1.42;color:#0b2545;text-wrap:pretty}
.sent.small{font-size:36px;padding:20px 26px;line-height:1.4}
.sent mark.up{background:linear-gradient(transparent 12%,#ffe08a 12%,#ffe08a 92%,transparent 92%);color:#0b2545;padding:0 4px;border-radius:6px;font-weight:800}
.sent .bad{text-decoration:underline wavy #b42318 3px;text-underline-offset:10px;color:#7a1a12}
.bandpill{display:inline-block;font-size:30px;font-weight:800;color:#fff;background:var(--b);border-radius:999px;padding:6px 20px;vertical-align:middle}
.bandpill.big{font-size:40px;padding:8px 26px}
.scorewrap{position:relative;margin-top:30px}
.score{position:absolute;right:24px;top:-26px;font-size:40px;font-weight:800;color:#fff;background:#b42318;border-radius:18px;padding:6px 20px;box-shadow:0 10px 24px -12px #b42318}
.list{display:flex;flex-direction:column;gap:14px;margin-top:26px}
.item{display:grid;grid-template-columns:56px 1fr;gap:18px;align-items:start;background:#fff;border:3px solid #e3f1fa;border-radius:20px;padding:16px 22px}
.num{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#fff;background:var(--c,#004b9b)}
.item .t{font-size:34px;font-weight:800;line-height:1.25}
.item .t .ph{color:#004b9b}
.item .d{font-size:30px;color:#4a6b8a;line-height:1.35;margin-top:4px;text-wrap:pretty}
.crit{display:inline-block;font-size:22px;font-weight:800;color:var(--c);border:3px solid var(--c);border-radius:999px;padding:1px 12px;margin-left:10px;vertical-align:4px}
.ladder{display:flex;flex-direction:column;gap:22px}
.step .bandpill{margin-bottom:10px}
.arrow{color:#9fb3c8;text-align:center;line-height:0}
.formula{font-size:38px;font-weight:800;color:#004b9b}
.note{font-size:26px;color:#4a6b8a;margin-top:22px;text-wrap:balance}
.prompt{font-size:44px;font-weight:800;line-height:1.3;margin-top:34px;text-wrap:balance}
.prompt b{color:#004b9b}
.hintline{display:flex;align-items:center;gap:12px;font-size:34px;font-weight:700;color:#4a6b8a;margin-top:22px}
.center{text-align:center}
.follow{margin-top:40px;font-size:50px;font-weight:800;line-height:1.3;color:#0b2545;background:#fff3b0;border-radius:24px;padding:18px 34px;display:inline-block}
.follow b{color:#004b9b}
${TIGHT ? `
.h1{font-size:68px;margin:18px 0 24px}
.h2{font-size:48px;margin-bottom:18px}
.sent{font-size:43px;padding:22px 28px;line-height:1.38}
.sent.small{font-size:29px;padding:12px 20px;border-left-width:10px}
.list{gap:10px;margin-top:16px}
.item{padding:12px 18px;gap:14px;grid-template-columns:48px 1fr}
.num{width:48px;height:48px;font-size:26px}
.item .t{font-size:30px}.item .d{font-size:26px}
.formula{font-size:34px}
.ladder{gap:8px}.step .bandpill{margin-bottom:6px;font-size:24px;padding:4px 16px}
.prompt{font-size:40px;margin-top:26px}` : ""}
`;

function page(set, logo, body, n, total, swipe) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">${FONT_LINK}
<style>${css(CW, CH, { video: false })}${EXTRA}</style></head><body class="static">
${wave(false)}${header({}, logo, { series: "Nâng band câu này", chip: "Writing" })}
<main><div class="slide">${body}</div></main>
<div class="dots">${n}/${total}</div>
${swipe ? `<div class="swipe">${swipe} ${icon(UI.swipe, 40, 2.6)}</div>` : ""}
</body></html>`;
}

function slides(set) {
  const [b5, b6, b7] = set.levels;
  const fixes = b5.problems.length;
  const moves = (lvl) =>
    `<div class="list">${lvl.moves
      .map((m, i) => {
        return `<div class="item"><div class="num" style="--c:${BAND[lvl.band]}">${i + 1}</div><div>
          <div class="t"><span class="ph">${esc(m.phrase)}</span>${chips(m.criterion)}</div>
          <div class="d"><b>${esc(m.label)}:</b> ${esc(m.why)}</div></div></div>`;
      })
      .join("")}</div>`;
  return [
    {
      swipe: "Lướt để lên band 7",
      html: `<div class="kicker">${icon(UI.write, 34, 2.4)} NÂNG BAND CÂU NÀY</div>
        <div class="h1">${esc(set.hook)}</div>
        <div class="scorewrap">${sentence(b5, { marks: false })}<div class="score">5.0</div></div>
        <div class="prompt">Sửa ${fixes} chỗ là lên <b>band 7</b>. Bạn đoán được chỗ nào không?</div>
        <div class="note">Band chấm theo cả bài. Ở đây là “câu kiểu band 5/6/7” theo tiêu chí ${critNames(set)}.</div>`,
    },
    {
      swipe: "Xem cách sửa",
      html: `<div class="h2">Vì sao chỉ ${bandPill(5, true)}?</div>
        ${sentence(b5)}
        <div class="list">${b5.problems
          .map((p, i) => `<div class="item"><div class="num" style="--c:${BAND[5]}">${i + 1}</div><div>
            <div class="t" style="color:#7a1a12">“${esc(p.phrase)}”${p.criterion ? chips(p.criterion) : ""}</div><div class="d">${esc(p.why)}</div></div></div>`)
          .join("")}</div>`,
    },
    { html: `<div class="h2">Lên ${bandPill(6, true)}</div>${sentence(b6)}${moves(b6)}` },
    { html: `<div class="h2">Lên ${bandPill(7, true)}</div>${sentence(b7)}${moves(b7)}` },
    {
      html: `<div class="h2">${icon(UI.save, 52, 2.2)} Lưu lại: 5 → 6 → 7</div>
        <div class="ladder">${[b5, b6, b7]
          .map((l, i) => `${i ? `<div class="arrow">${icon(UI.down, 30, 2.6)}</div>` : ""}<div class="step">${bandPill(l.band)}${sentence(l, { small: true })}</div>`)
          .join("")}</div>`,
    },
    {
      html: `<div class="h2">${icon(UI.toolkit, 52, 2.2)} Hộp công cụ</div>
        <div class="list">${set.toolkit
          .map((t, i) => `<div class="item"><div class="num">${i + 1}</div><div><div class="formula">${esc(t.formula)}</div><div class="d">${esc(t.use)}</div></div></div>`)
          .join("")}</div>`,
    },
    {
      html: `<div class="h2">${icon(UI.write, 52, 2.2)} Đến lượt bạn</div>
        <div class="scorewrap">${sentence({ band: 5, text: set.practice.sentence }, { marks: false })}<div class="score">5.0</div></div>
        <div class="prompt">Viết lại thành câu <b>band 7</b> trong phần bình luận.</div>
        <div class="hintline">${icon(UI.story, 40)} Dùng ít nhất 2 công cụ ở trang trước</div>
        <div class="hintline">${icon(UI.comment, 40)} Đáp án mẫu ở bình luận ghim</div>`,
    },
    {
      html: `<div class="center">
        <div class="kicker">${icon(UI.next, 34, 2.6)} MỖI TUẦN 1 CÂU</div>
        <div class="h1" style="margin-top:30px">Nâng band từng câu,<br>lên band cả bài</div>
        <div class="follow">${icon(UI.follow, 50)} Theo dõi <b>UpWind</b><br>để không bỏ lỡ</div></div>`,
    },
  ];
}

const sets = loadUpgrades();
const chosen = target === "all" ? sets : sets.filter((s) => target.split(",").includes(s.id));
if (!chosen.length) {
  console.error(`No set "${target}". Available: ${sets.map((s) => s.id).join(", ")}`);
  process.exit(1);
}
const logo = "data:image/svg+xml;base64," + fs.readFileSync(path.join(ROOT_DIR, "../../public/favicon.svg")).toString("base64");
const browser = await chromium.launch();
try {
  for (const set of chosen) {
    const dir = path.join(OUT_DIR, "carousel", `upgrade-${set.id}${size === "4:5" ? "" : "-" + size.replace(":", "x")}`);
    ensureDir(dir);
    const all = slides(set);
    const pg = await browser.newPage({ viewport: { width: CW, height: CH } });
    for (const [i, s] of all.entries()) {
      await pg.setContent(page(set, logo, s.html, i + 1, all.length, s.swipe), { waitUntil: "networkidle" }).catch(() => {});
      await pg.evaluate(() => document.fonts.ready);
      const overflow = await pg.evaluate(() => {
        const m = document.querySelector("main");
        return m.scrollHeight > m.clientHeight + 4 || m.scrollWidth > m.clientWidth + 4;
      });
      if (overflow) console.warn(`  ! ${set.id} slide ${i + 1} overflows; shorten the text or use --size 9:16`);
      await pg.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, "0")}.png`) });
    }
    await pg.close();
    fs.writeFileSync(path.join(dir, "caption.txt"), upgradeCaption(set, nextSet(sets, set)) + "\n");
    console.log(`✓ ${path.relative(ROOT_DIR, dir)}: ${all.length} slides (${CW}x${CH})`);
  }
} finally {
  await browser.close();
}
