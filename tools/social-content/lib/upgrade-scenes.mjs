// "Nâng band câu này" as a vertical video: one set from data/upgrades.json -> scenes { kind, say, hold, html }.
// Rendered by make-video.mjs --series writing (same voice, animation capture, subtitles and progress bar as
// the word-root videos). Each fix gets its own short scene, so the highlighted phrase matches the narration.
//
// hook (band 5 sentence) -> why band 5 (one scene per problem) -> band 6 (sentence + one scene per move)
// -> band 7 (same) -> save-this ladder -> your turn (comment) -> next set teaser + follow.
import { esc } from "./common.mjs";
import { css, wave, header, FONT_LINK } from "./template.mjs";
import { icon, UI_ICONS as UI } from "./icons.mjs";
import { lottieScripts } from "./emoji.mjs";
import { BAND, chips, markup, plainText, bandPill, spansFor, sayText, sayPhrase, stop } from "./upgrade.mjs";

const ORDINAL = ["Thứ nhất", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu"];

const STYLE = `
.wr{width:100%}
.wr .kicker{display:inline-flex;align-items:center;gap:12px;font-size:40px;font-weight:800;color:#fff;background:#004b9b;border-radius:16px;padding:10px 24px}
.wr .h1{font-size:84px;font-weight:800;line-height:1.12;letter-spacing:-1px;margin:30px 0 40px;text-wrap:balance}
.wr .h2{display:flex;align-items:center;gap:20px;font-size:66px;font-weight:800;line-height:1.15;margin-bottom:34px}
.wr .sent{background:#fff;border:3px solid #e3f1fa;border-left:16px solid var(--b);border-radius:28px;padding:34px 38px;
  font-size:56px;font-weight:600;line-height:1.42;color:#0b2545;text-wrap:pretty;box-shadow:0 18px 40px -24px rgba(0,75,155,.35)}
.wr .sent.dense{font-size:47px;padding:26px 32px}
.wr .sent.small{font-size:40px;padding:18px 24px;border-left-width:12px;line-height:1.34}
.wr mark.up{background:linear-gradient(transparent 12%,#ffe08a 12%,#ffe08a 92%,transparent 92%);color:#0b2545;padding:0 4px;border-radius:6px;font-weight:800}
.wr mark.up.off{background:linear-gradient(transparent 12%,#fff3c9 12%,#fff3c9 92%,transparent 92%);font-weight:700;color:#4a6b8a}
.wr mark.up.on{background:#ffd166;box-shadow:0 0 0 5px #f2711c;border-radius:10px}
.wr .bad{text-decoration:underline wavy #b42318 3px;text-underline-offset:12px;color:#7a1a12}
.wr .bad.off{text-decoration-color:#e8a29b;color:#0b2545}
.wr .bad.on{background:#ffe1dc;border-radius:10px;box-shadow:0 0 0 5px #ffe1dc;font-weight:800}
.wr .bandpill{display:inline-block;font-size:34px;font-weight:800;color:#fff;background:var(--b);border-radius:999px;padding:6px 22px;vertical-align:middle}
.wr .bandpill.big{font-size:52px;padding:8px 30px}
.wr .scorewrap{position:relative;margin-top:34px}
.wr .score{position:absolute;right:26px;top:-34px;font-size:52px;font-weight:800;color:#fff;background:#b42318;border-radius:20px;padding:6px 24px;box-shadow:0 10px 24px -12px #b42318}
.wr .list{display:flex;flex-direction:column;gap:18px;margin-top:34px}
.wr .item{display:grid;grid-template-columns:64px 1fr;gap:20px;align-items:start;background:#fff;border:3px solid #e3f1fa;border-radius:22px;padding:18px 24px}
.wr .item.now{border-color:#f2711c;box-shadow:0 14px 34px -18px rgba(242,113,28,.6)}
.wr .item.done{opacity:.55;padding:12px 24px;align-items:center}
.wr .item.done .d{display:none}
.wr .item.done .num{width:52px;height:52px;font-size:28px}
main.top{align-items:flex-start;padding-top:30px}
.wr .num{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800;color:#fff;background:var(--c,#004b9b)}
.wr .item .t{font-size:42px;font-weight:800;line-height:1.25}
.wr .item .t .ph{color:#004b9b}
.wr .item .d{font-size:36px;color:#4a6b8a;line-height:1.35;margin-top:6px;text-wrap:pretty}
.wr .crit{display:inline-block;font-size:26px;font-weight:800;color:var(--c);border:3px solid var(--c);border-radius:999px;padding:1px 14px;margin-left:12px;vertical-align:6px;white-space:nowrap}
.wr .ladder{display:flex;flex-direction:column;gap:8px}
.wr .ladder .bandpill{margin-bottom:8px}
.wr .arrow{color:#9fb3c8;text-align:center;line-height:0}
.wr .prompt{font-size:54px;font-weight:800;line-height:1.3;margin-top:44px;text-wrap:balance}
.wr .prompt b{color:#004b9b}
.wr .note{font-size:32px;color:#4a6b8a;margin-top:26px;text-wrap:balance}
.wr .hintline{display:flex;align-items:center;gap:14px;font-size:42px;font-weight:700;color:#4a6b8a;margin-top:26px}
.wr.center{text-align:center}
.wr .nexthook{font-size:82px;font-weight:800;line-height:1.15;letter-spacing:-1px;margin-top:40px;color:#004b9b;text-wrap:balance}
.wr .nexttopic{font-size:44px;font-weight:700;color:#4a6b8a;margin-top:20px}
`;

export function writingFrameHtml({ scene, logo }) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">${FONT_LINK}
<style>${css()}${STYLE}</style></head><body class="video">
${wave()}
${header({}, logo, { series: "Nâng band câu này", chip: "Writing" })}
<main${scene.top ? ' class="top"' : ""}>${scene.html}</main>
${lottieScripts(scene.html)}
</body></html>`;
}

/** Long sentence + many items would run into the subtitles: set the sentence a little smaller. */
const dense = (lvl, list) => (list.length >= 4 && plainText(lvl.text).length > 100 ? "dense" : "");
const sent = (lvl, { active = null, plain = false, small = false, cls = "" } = {}) =>
  `<div class="sent${small ? " small" : ""} ${cls}" style="--b:${BAND[lvl.band]}">${plain ? esc(plainText(lvl.text)) : markup(lvl.text, active)}</div>`;

/** Items 1..k of a list: earlier ones settled, item k animated in and outlined. */
function items(list, k, band, render) {
  return `<div class="list">${list
    .slice(0, k + 1)
    .map((m, i) => {
      const now = i === k;
      return `<div class="item${now ? " now a-left" : " done"}"><div class="num" style="--c:${BAND[band]}">${i + 1}</div><div>${render(m)}</div></div>`;
    })
    .join("")}</div>`;
}

export function buildUpgradeScenes(set, { next = null } = {}) {
  const [b5, b6, b7] = set.levels;
  const n = b5.problems.length;
  const scenes = [];

  // 1. Hook: the band 5 sentence, stamped 5.0, and the challenge
  scenes.push({
    kind: "hook",
    say: `${sayText(stop(set.hook))} {{${plainText(b5.text)}}} Sửa ${n} chỗ là lên band 7. Bạn đoán được chỗ nào không?`,
    hold: 0.6,
    html: `<div class="wr">
      <div class="kicker a-stamp">${icon(UI.write, 40, 2.4)} NÂNG BAND CÂU NÀY</div>
      <div class="h1 a-slam" style="--d:150ms">${esc(set.hook)}</div>
      <div class="scorewrap a-up" style="--d:500ms">${sent(b5, { plain: true })}<div class="score a-stamp" style="--d:1100ms">5.0</div></div>
      <div class="prompt a-pop" style="--d:1500ms">Sửa ${n} chỗ là lên <b>band 7</b>. Bạn đoán được chỗ nào không?</div>
    </div>`,
  });

  // 2. Why only band 5: one scene per problem, its phrase lit up in the sentence
  b5.problems.forEach((p, k) => {
    scenes.push({
      kind: "problem",
      top: true,
      say: `${k === 0 ? "Vì sao chỉ band 5? " : ""}${ORDINAL[k] ?? ""}, ${sayPhrase(p.phrase)}. ${sayText(p.why)}`,
      html: `<div class="wr">
        <div class="h2${k ? "" : " a-up"}">Vì sao chỉ ${bandPill(5, true)}</div>
        ${sent(b5, { active: spansFor(b5.text, p.phrase), cls: `${k ? "" : "a-up"} ${dense(b5, b5.problems)}` })}
        ${items(b5.problems, k, 5, (x) => `<div class="t" style="color:#7a1a12">“${esc(x.phrase)}”${x.criterion ? chips(x.criterion) : ""}</div><div class="d">${esc(x.why)}</div>`)}
      </div>`,
    });
  });

  // 3-4. Band 6 and band 7: the new sentence read in full, then one scene per upgrade
  for (const lvl of [b6, b7]) {
    scenes.push({
      kind: `band${lvl.band}`,
      top: true,
      say: `Lên band ${lvl.band}. {{${plainText(lvl.text)}}}`,
      hold: 0.5,
      html: `<div class="wr">
        <div class="h2 a-pop">Lên ${bandPill(lvl.band, true)}</div>
        <div class="a-up" style="--d:250ms">${sent(lvl)}</div>
      </div>`,
    });
    lvl.moves.forEach((m, k) => {
      scenes.push({
        kind: `move${lvl.band}`,
        top: true,
        say: `${sayPhrase(m.phrase)}. ${sayText(m.why)}`,
        html: `<div class="wr">
          <div class="h2">Lên ${bandPill(lvl.band, true)}</div>
          ${sent(lvl, { active: spansFor(lvl.text, m.phrase), cls: dense(lvl, lvl.moves) })}
          ${items(lvl.moves, k, lvl.band, (x) => `<div class="t"><span class="ph">${esc(x.phrase)}</span>${chips(x.criterion)}</div><div class="d"><b>${esc(x.label)}:</b> ${esc(x.why)}</div>`)}
        </div>`,
      });
    });
  }

  // 5. Save-this ladder
  scenes.push({
    kind: "ladder",
    say: "Lưu lại ba bậc này nhé: band 5, band 6, band 7. Chụp màn hình lại để ôn!",
    hold: 2,
    html: `<div class="wr">
      <div class="h2 a-up">${icon(UI.save, 60, 2.2)} Lưu lại: 5 → 6 → 7</div>
      <div class="ladder">${[b5, b6, b7]
        .map((l, i) => `${i ? `<div class="arrow a-pop" style="--d:${i * 500}ms">${icon(UI.down, 34, 2.6)}</div>` : ""}<div class="a-left" style="--d:${i * 500}ms">${bandPill(l.band)}${sent(l, { small: true })}</div>`)
        .join("")}</div>
    </div>`,
  });

  // 6. Your turn: the comment challenge (model answers live in the pinned comment)
  scenes.push({
    kind: "practice",
    say: `Đến lượt bạn! {{${set.practice.sentence}}} Viết lại thành câu band 7 trong phần bình luận nhé. Đáp án mẫu ở bình luận ghim.`,
    hold: 1.5,
    html: `<div class="wr">
      <div class="kicker a-stamp">${icon(UI.challenge, 40, 2.4)} ĐẾN LƯỢT BẠN</div>
      <div class="scorewrap a-up" style="--d:300ms;margin-top:60px">${sent({ band: 5, text: set.practice.sentence }, { plain: true })}<div class="score a-stamp" style="--d:800ms">5.0</div></div>
      <div class="prompt a-pop" style="--d:1100ms">Viết lại thành câu <b>band 7</b> trong phần bình luận.</div>
      <div class="hintline a-up" style="--d:1500ms">${icon(UI.comment, 46)} Đáp án mẫu ở bình luận ghim</div>
    </div>`,
  });

  // 7. Next set teaser + follow
  scenes.push({
    kind: "cta",
    say: next
      ? `Tập sau: ${sayText(stop(next.hook))} Theo dõi UpWind, mỗi tuần nâng band một câu nhé!`
      : "Theo dõi UpWind, mỗi tuần nâng band một câu nhé!",
    hold: 1,
    html: `<div class="wr center">
      ${next ? `<div><span class="nexttag a-stamp" style="--d:200ms">TẬP SAU ${icon(UI.next, 44, 2.4)}</span></div>
      <div class="nexthook a-slam" style="--d:400ms">${esc(next.hook)}</div>
      <div class="nexttopic a-up" style="--d:800ms">${esc(next.topic)}</div>` : ""}
      <div class="follow a-up" style="--d:1300ms">${icon(UI.follow, 52)} Theo dõi <b>UpWind</b><br>mỗi tuần nâng band 1 câu</div>
    </div>`,
  });

  return { scenes };
}
