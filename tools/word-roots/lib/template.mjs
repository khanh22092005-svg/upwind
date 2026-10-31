// HTML frame for one scene. Videos are 1080x1920 (Reels / TikTok / Shorts); carousels reuse the same
// look at 1080x1350 or 1080x1080. In videos, text stays clear of the bottom ~300px and the right edge,
// where the apps draw their own buttons.
//
// Animation: elements with class .a-<name> animate on load; `style="--i:n"` staggers them.
// make-video.mjs pauses every animation and steps currentTime frame by frame, so capture is exact.
import { esc, plain } from "./common.mjs";
import { lottieScripts } from "./emoji.mjs";

export const W = 1080;
export const H = 1920;

export function css(w = W, h = H, { video = true } = {}) {
  const mainH = video ? 1130 : h - 230 - 200;
  return `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:"Be Vietnam Pro","Inter","Noto Sans",sans-serif;color:#0b2545;
  background:radial-gradient(1200px 900px at 50% 0%,#e8f6fc 0%,#ffffff 60%),#fff;position:relative}
body:before{content:"";position:absolute;inset:0;background:
  repeating-linear-gradient(0deg,transparent 0 59px,rgba(0,75,155,.05) 59px 60px),
  repeating-linear-gradient(90deg,transparent 0 59px,rgba(0,75,155,.05) 59px 60px)}
.emoji{font-family:"Noto Color Emoji","Apple Color Emoji",sans-serif}
.ico{display:inline-block;vertical-align:-0.14em;flex:none}
.q,.lit,.mean,.story,.caption,.image,.en,.vi,.follow,.trap,.hint,.core,.gloss{text-wrap:balance}
.lot{display:inline-block;vertical-align:middle;line-height:0}
.lot svg{display:block}
.nextroot .lot{vertical-align:-0.15em;margin-left:6px}
.card .lot{position:absolute;right:0;top:0}
.badge{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#004b9b;
  background:radial-gradient(circle at 35% 30%,#ffffff 0%,#e8f6fc 70%);box-shadow:0 0 0 8px #cfe9f7,0 18px 40px rgba(0,75,155,.18)}
header{position:absolute;top:70px;left:70px;right:70px;display:flex;align-items:center;gap:22px}
header img{width:92px;height:92px}
header .brand{font-weight:800;font-size:40px;color:#004b9b;letter-spacing:.5px}
header .series{font-weight:700;font-size:28px;color:#4a6b8a;text-transform:uppercase;letter-spacing:3px}
header .chip{margin-left:auto;background:#004b9b;color:#fff;font-weight:800;font-size:40px;padding:12px 30px;border-radius:999px}
main{position:absolute;top:230px;left:70px;right:70px;height:${mainH}px;display:flex;align-items:center;justify-content:center}
.counter{position:absolute;top:0;right:0;font-weight:800;font-size:34px;color:#6ac5e8}
.caption{position:absolute;left:70px;right:70px;top:1400px;min-height:150px;background:#0b2545;color:#fff;
  border-radius:28px;padding:30px 40px;font-size:42px;line-height:1.35;font-weight:600;text-align:center}
.caption b{color:#ffd166}
.wave{position:absolute;left:0;bottom:0;width:100%;height:${video ? 320 : 210}px;display:block}

/* ---------- animations ---------- */
.a-pop,.a-up,.a-left,.a-right,.a-slam,.a-stamp,.a-drop,.a-wipe,.a-merge,.a-shake,.a-sweep,.a-word{
  animation-fill-mode:both;animation-delay:calc(var(--i,0) * 90ms + var(--d,0ms))}
.a-pop{animation-name:pop;animation-duration:.45s;animation-timing-function:cubic-bezier(.2,.9,.3,1.4)}
.a-up{animation-name:up;animation-duration:.4s;animation-timing-function:cubic-bezier(.2,.8,.2,1)}
.a-left{animation-name:fromLeft;animation-duration:.5s;animation-timing-function:cubic-bezier(.2,.9,.3,1.2)}
.a-right{animation-name:fromRight;animation-duration:.5s;animation-timing-function:cubic-bezier(.2,.9,.3,1.2)}
.a-slam{animation-name:slam;animation-duration:.42s;animation-timing-function:cubic-bezier(.3,.7,.3,1)}
.a-stamp{animation-name:stamp;animation-duration:.35s;animation-timing-function:cubic-bezier(.3,.7,.3,1.3)}
.a-drop{animation-name:drop;animation-duration:.6s;animation-timing-function:cubic-bezier(.3,1.6,.5,1)}
.a-wipe{animation-name:wipe;animation-duration:.5s;animation-timing-function:ease-out}
.a-merge{animation-name:merge;animation-duration:.55s;animation-timing-function:cubic-bezier(.2,.9,.3,1.15)}
.a-shake{animation-name:shake;animation-duration:.4s;animation-timing-function:linear}
.a-word{animation-name:word;animation-duration:.28s;animation-timing-function:ease-out;display:inline-block}
.a-sweep{animation-name:sweep;animation-duration:.5s;animation-timing-function:ease-out;
  background:linear-gradient(#ffd166,#ffd166) no-repeat left center;background-size:100% 100%}
@keyframes pop{0%{transform:scale(.2);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes up{0%{transform:translateY(70px);opacity:0}100%{transform:none;opacity:1}}
@keyframes fromLeft{0%{transform:translateX(-700px) rotate(-14deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes fromRight{0%{transform:translateX(700px) rotate(14deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes slam{0%{transform:scale(3.2);opacity:0}65%{transform:scale(.93);opacity:1}100%{transform:scale(1)}}
@keyframes stamp{0%{transform:rotate(-8deg) scale(2.6);opacity:0}70%{transform:rotate(2deg) scale(.96);opacity:1}100%{transform:none;opacity:1}}
@keyframes drop{0%{transform:translateY(-500px);opacity:0}100%{transform:none;opacity:1}}
@keyframes wipe{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}}
@keyframes merge{0%{transform:translateX(var(--dx,0)) scale(.9);opacity:.2}100%{transform:none;opacity:1}}
@keyframes shake{0%,100%{transform:none}20%{transform:translateX(-16px) rotate(-2deg)}40%{transform:translateX(14px) rotate(2deg)}
  60%{transform:translateX(-10px)}80%{transform:translateX(8px)}}
@keyframes word{0%{transform:translateY(30px);opacity:0}100%{transform:none;opacity:1}}
@keyframes sweep{0%{background-size:0% 100%}100%{background-size:100% 100%}}

/* bait */
.bait{text-align:center;width:100%}
.bait .tag{display:inline-block;font-size:44px;font-weight:800;color:#fff;background:#f2711c;border-radius:16px;padding:10px 26px}
.bait .bword{font-size:140px;font-weight:800;color:#004b9b;letter-spacing:-2px;line-height:1.05;margin-top:50px}
.bait .nl{font-size:56px;font-weight:700;color:#4a6b8a;margin:24px 0 16px}
.bait .eq{font-size:80px;font-weight:800;color:#9fb3c8;margin:24px 0 10px}
.bait .lit{font-size:92px;font-weight:800;line-height:1.2;color:#0b2545;padding:10px 24px;border-radius:20px;display:inline-block}
.bait .badge{margin-top:40px}

/* hook */
.hook{text-align:center;width:100%}
.hook .big1{font-size:110px;font-weight:800;line-height:1.05;letter-spacing:-1px}
.hook .big2{font-size:150px;font-weight:800;line-height:1.05;color:#f2711c;letter-spacing:-2px}
.hook .q{font-size:44px;font-weight:700;line-height:1.3;margin:24px 0 34px;color:#4a6b8a}
.cloud{display:flex;flex-wrap:wrap;justify-content:center;gap:18px 26px}
.cw{font-size:48px;font-weight:800;color:#004b9b;background:#fff;border:4px solid #cfe9f7;border-radius:20px;padding:8px 22px}
.cw:nth-child(3n){color:#f2711c}.cw:nth-child(4n){color:#1a9c5b}
.hook .tease{margin-top:50px;font-size:46px;font-weight:800;color:#fff;background:#0b2545;display:inline-block;padding:14px 30px;border-radius:999px}

/* root */
.rootcard{text-align:center}
.rootcard .badge{margin-bottom:30px}
.rootword{white-space:nowrap;font-size:150px;font-weight:800;letter-spacing:-2px;line-height:1.1}
.origin{font-size:44px;color:#4a6b8a;font-style:italic;margin-top:10px}
.core{font-size:90px;font-weight:800;color:#f2711c;margin-top:30px}
.image{font-size:42px;color:#4a6b8a;margin-top:30px;max-width:860px;margin-inline:auto;line-height:1.35}

/* split */
.split{text-align:center;width:100%}
.parts{display:flex;align-items:flex-start;justify-content:center;gap:16px;flex-wrap:nowrap}
.part{display:flex;flex-direction:column;align-items:center;min-width:180px}
.tile{font-size:118px;font-weight:800;color:var(--c);background:#fff;border:6px solid var(--c);border-radius:30px;
  padding:6px 30px;box-shadow:0 14px 0 color-mix(in srgb,var(--c) 22%,transparent)}
.kind{font-size:30px;font-weight:700;color:#4a6b8a;margin-top:26px;text-transform:uppercase;letter-spacing:2px}
.gloss{font-size:44px;font-weight:800;margin-top:6px;max-width:300px;line-height:1.2}
.plus{font-size:90px;font-weight:800;color:#9fb3c8;margin-top:28px}
.split .badge{margin-top:60px}
.story{font-size:48px;font-weight:600;line-height:1.35;margin-top:30px;color:#0b2545}

/* meaning */
.meaning{text-align:center;width:100%}
.meaning .word{font-size:160px;font-weight:800;letter-spacing:-2px;line-height:1.1}
.meaning .word span{display:inline-block}
.ipa{font-size:50px;color:#4a6b8a;margin-top:16px}
.mean{font-size:76px;font-weight:800;margin-top:50px;line-height:1.25;display:inline-block;padding:10px 30px;border-radius:20px}
.rels{margin-top:60px;display:flex;flex-direction:column;gap:18px}
.rel{font-size:44px;background:#fff;border:3px solid #cfe9f7;border-radius:20px;padding:16px 26px}
.rel b{color:#004b9b}.rel i{color:#4a6b8a}
.trap{margin-top:30px;font-size:44px;font-weight:700;color:#b42318}

/* example */
.example{width:100%;text-align:center}
.label{font-size:36px;font-weight:800;color:#6ac5e8;text-transform:uppercase;letter-spacing:3px;margin-bottom:30px}
.example .en,.quiz .en{font-size:70px;font-weight:700;line-height:1.3}
mark{background:#ffd166;color:#0b2545;padding:0 10px;border-radius:12px}
.example .vi{font-size:48px;color:#4a6b8a;margin-top:50px;line-height:1.35}

/* recap */
.recap{width:100%}
.recap .title{font-size:58px;font-weight:800;text-align:center;margin-bottom:34px}
.recap .rows{display:grid;grid-template-columns:auto auto 1fr;row-gap:12px}
.recap .row{display:grid;grid-column:1/-1;grid-template-columns:subgrid;column-gap:22px;align-items:center;background:#fff;
  border:3px solid #e3f1fa;border-radius:18px;padding:14px 22px;font-size:38px;line-height:1.25;column-gap:18px}
.recap .row>span:last-child{text-wrap:balance}
.recap .w{font-weight:800;font-size:46px;white-space:nowrap}.recap .p{color:#4a6b8a;font-style:italic;white-space:nowrap}

/* quiz */
.quiz{width:100%;text-align:center}
.opts{display:flex;flex-direction:column;gap:22px;margin-top:60px;align-items:center}
.opt{font-size:60px;font-weight:800;background:#fff;border:5px solid #004b9b;border-radius:24px;padding:14px 40px;min-width:620px;text-align:left}
.opt b{color:#f2711c;margin-right:20px}
.hint{font-size:46px;font-weight:700;color:#f2711c;margin-top:50px}

/* cta */
.cta{text-align:center}
.ctalogo{width:300px;height:300px}
.cta .big{font-size:100px;font-weight:800;margin-top:40px;color:#004b9b}
.cta .sub{font-size:54px;margin-top:24px;color:#4a6b8a}
.cta .ctalogo{width:200px;height:200px}
.nexttag{display:inline-block;margin-top:30px;font-size:44px;font-weight:800;color:#fff;background:#f2711c;border-radius:16px;padding:10px 26px}
.nextroot{font-size:130px;font-weight:800;letter-spacing:-2px;line-height:1.1;margin-top:30px;white-space:nowrap}
.nextroot .ico{color:#004b9b;margin-left:10px;vertical-align:-0.1em}
.nextcore{font-size:72px;font-weight:800;color:#f2711c;margin-top:10px}
.nextwords{display:flex;flex-wrap:wrap;justify-content:center;gap:16px 20px;margin-top:36px}
.follow{margin-top:60px;font-size:50px;font-weight:800;line-height:1.3;color:#0b2545;background:#fff3b0;border-radius:24px;padding:20px 36px;display:inline-block}
.follow b{color:#004b9b}

/* carousel extras */
.swipe{position:absolute;right:70px;bottom:16px;z-index:2;display:flex;align-items:center;gap:10px;font-size:40px;font-weight:800;color:#fff;background:#f2711c;border-radius:999px;padding:12px 30px}
.dots{position:absolute;left:70px;bottom:22px;z-index:2;font-size:34px;font-weight:800;color:#004b9b}
.card{width:100%}
.card .head{display:flex;align-items:baseline;gap:24px;flex-wrap:wrap}
.card .word{font-size:120px;font-weight:800;letter-spacing:-2px;line-height:1.05}
.card .ipa{font-size:42px;margin:0}
.card .parts{justify-content:flex-start;margin-top:30px;gap:10px}
.card .tile{font-size:64px;padding:2px 20px;border-width:5px;border-radius:20px;box-shadow:none}
.card .part{min-width:0}
.card .kind{font-size:22px;margin-top:12px}.card .gloss{font-size:32px}
.card .plus{font-size:54px;margin-top:10px}
.card .mean{font-size:58px;margin-top:34px;padding:6px 20px}
.card .story{font-size:38px;margin-top:20px}
.card .ex{margin-top:30px;background:#fff;border-left:10px solid #6ac5e8;border-radius:16px;padding:20px 26px}
.card .ex .en{font-size:42px;font-weight:700;line-height:1.3}
.card .ex .vi{font-size:34px;color:#4a6b8a;margin-top:10px}
.card .rel{font-size:34px;padding:10px 20px;margin-top:16px}
.card .badge{position:absolute;right:6px;top:6px}
.card .trap{font-size:36px}
`;
}

export function wave(video = true) {
  if (video)
    return `<svg class="wave" viewBox="0 0 1080 320" preserveAspectRatio="none" aria-hidden="true">
<path d="M0 120 Q270 60 540 120 T1080 120 V320 H0Z" fill="#e8f6fc"/>
<path d="M0 170 Q270 120 540 170 T1080 170" fill="none" stroke="#6ac5e8" stroke-width="10"/>
<path d="M0 215 Q270 165 540 215 T1080 215" fill="none" stroke="#004b9b" stroke-width="10"/></svg>`;
  // Carousel footer: drawn at its real size (no stretching), lines on top, a calm band below for the pills.
  return `<svg class="wave wave-c" viewBox="0 0 1080 210" aria-hidden="true">
<path d="M0 62 C180 22 360 22 540 62 S900 102 1080 62 V210 H0Z" fill="#e8f6fc"/>
<path d="M0 62 C180 22 360 22 540 62 S900 102 1080 62" fill="none" stroke="#6ac5e8" stroke-width="9"/>
<path d="M0 98 C180 58 360 58 540 98 S900 138 1080 98" fill="none" stroke="#004b9b" stroke-width="9"/>
<rect x="0" y="128" width="1080" height="82" fill="#e8f6fc"/></svg>`;
}

export const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700;800&display=block" rel="stylesheet">`;

export function header(family, logo, { series = "Học từ từ gốc", chip } = {}) {
  const chipText = chip ?? family.root.split("/")[0].trim();
  return `<header><img src="${logo}" alt=""><div><div class="brand">UpWind</div><div class="series">${esc(series)}</div></div>
<div class="chip">${esc(chipText)}</div></header>`;
}

export function frameHtml({ family, scene, logo }) {
  const cap = (scene.caption ?? plain(scene.say)).replace(/(^|(?<!\.)[.!?]\s+)(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase()); // "..." is a pause, not a sentence end
  const capHtml = esc(cap).replace(/\b([A-Za-z][a-z]+)\b/g, (m) =>
    family.words.some((w) => w.word === m.toLowerCase()) ? `<b>${m}</b>` : m
  );
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">${FONT_LINK}
<style>${css()}</style></head><body>
${wave()}
${header(family, logo)}
<main>${scene.html.replaceAll("__LOGO__", logo)}</main>
<div class="caption a-up" style="--d:120ms">${capHtml}</div>
${lottieScripts(scene.html)}
</body></html>`;
}
