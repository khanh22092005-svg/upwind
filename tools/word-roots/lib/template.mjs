// HTML frame for one 1080x1920 scene (Reels / TikTok / Shorts).
// Text is kept clear of the bottom ~300px and the right edge, where the apps draw their own buttons.
import { esc, plain } from "./common.mjs";

export const W = 1080;
export const H = 1920;

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:"Be Vietnam Pro","Inter","Noto Sans",sans-serif;color:#0b2545;
  background:radial-gradient(1200px 900px at 50% 0%,#e8f6fc 0%,#ffffff 60%) ,#fff;position:relative}
body:before{content:"";position:absolute;inset:0;background:
  repeating-linear-gradient(0deg,transparent 0 59px,rgba(0,75,155,.05) 59px 60px),
  repeating-linear-gradient(90deg,transparent 0 59px,rgba(0,75,155,.05) 59px 60px)}
.emoji,.big.emoji{font-family:"Noto Color Emoji","Apple Color Emoji",sans-serif}
header{position:absolute;top:70px;left:70px;right:70px;display:flex;align-items:center;gap:22px}
header img{width:92px;height:92px}
header .brand{font-weight:800;font-size:40px;color:#004b9b;letter-spacing:.5px}
header .series{font-weight:700;font-size:28px;color:#4a6b8a;text-transform:uppercase;letter-spacing:3px}
header .chip{margin-left:auto;background:#004b9b;color:#fff;font-weight:800;font-size:40px;padding:12px 30px;border-radius:999px}
main{position:absolute;top:230px;left:70px;right:70px;height:1130px;display:flex;align-items:center;justify-content:center}
.counter{position:absolute;top:0;right:0;font-weight:800;font-size:34px;color:#6ac5e8}
.caption{position:absolute;left:70px;right:70px;top:1400px;min-height:150px;background:#0b2545;color:#fff;
  border-radius:28px;padding:30px 40px;font-size:42px;line-height:1.35;font-weight:600;text-align:center}
.caption b{color:#ffd166}
.wave{position:absolute;left:0;right:0;bottom:0;height:320px}

/* hook */
.hook{text-align:center;width:100%}
.hook .q{font-size:66px;font-weight:800;line-height:1.25;margin-bottom:60px}
.cloud{display:flex;flex-wrap:wrap;justify-content:center;gap:18px 26px}
.cw{font-size:48px;font-weight:800;color:#004b9b;background:#fff;border:4px solid #cfe9f7;border-radius:20px;
  padding:8px 22px;transform:rotate(calc(var(--d)*1.5deg))}
.cw:nth-child(3n){color:#f2711c}.cw:nth-child(4n){color:#1a9c5b}

/* root */
.rootcard{text-align:center}
.rootcard .big{font-size:260px;line-height:1.1}
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
.split .emoji{font-size:230px;margin-top:70px;line-height:1.1}
.story{font-size:48px;font-weight:600;line-height:1.35;margin-top:30px;color:#0b2545}

/* meaning */
.meaning{text-align:center;width:100%}
.meaning .word{font-size:160px;font-weight:800;letter-spacing:-2px;line-height:1.1}
.ipa{font-size:50px;color:#4a6b8a;margin-top:16px}
.mean{font-size:76px;font-weight:800;margin-top:50px;line-height:1.25;background:#fff3b0;display:inline-block;padding:10px 30px;border-radius:20px}
.rels{margin-top:60px;display:flex;flex-direction:column;gap:18px}
.rel{font-size:44px;background:#fff;border:3px solid #cfe9f7;border-radius:20px;padding:16px 26px}
.rel b{color:#004b9b}.rel i{color:#4a6b8a}
.trap{margin-top:30px;font-size:44px;font-weight:700;color:#b42318}

/* example */
.example{width:100%}
.label{font-size:36px;font-weight:800;color:#6ac5e8;text-transform:uppercase;letter-spacing:3px;margin-bottom:30px}
.example .en,.quiz .en{font-size:70px;font-weight:700;line-height:1.3}
mark{background:#ffd166;color:#0b2545;padding:0 10px;border-radius:12px}
.example .vi{font-size:48px;color:#4a6b8a;margin-top:50px;line-height:1.35}

/* recap */
.recap{width:100%}
.recap .title{font-size:58px;font-weight:800;text-align:center;margin-bottom:34px}
.recap table{width:100%;border-collapse:separate;border-spacing:0 12px}
.recap td{font-size:38px;padding:14px 18px;background:#fff;vertical-align:middle}
.recap td:first-child{border-radius:16px 0 0 16px}.recap td:last-child{border-radius:0 16px 16px 0}
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
`;

const WAVE = `<svg class="wave" viewBox="0 0 1080 320" preserveAspectRatio="none" aria-hidden="true">
<path d="M0 120 Q270 60 540 120 T1080 120 V320 H0Z" fill="#e8f6fc"/>
<path d="M0 170 Q270 120 540 170 T1080 170" fill="none" stroke="#6ac5e8" stroke-width="10"/>
<path d="M0 215 Q270 165 540 215 T1080 215" fill="none" stroke="#004b9b" stroke-width="10"/></svg>`;

export function frameHtml({ family, scene, logo }) {
  const cap = scene.caption ?? plain(scene.say);
  const capHtml = esc(cap).replace(/\b([A-Za-z][a-z]+)\b/g, (m) =>
    family.words.some((w) => w.word === m.toLowerCase()) ? `<b>${m}</b>` : m
  );
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700;800&display=block" rel="stylesheet">
<style>${CSS}</style></head><body>
${WAVE}
<header><img src="${logo}" alt=""><div><div class="brand">UpWind</div><div class="series">Gốc từ tiếng Anh</div></div>
<div class="chip">${esc(family.root.split("/")[0].trim())}</div></header>
<main>${scene.html.replaceAll("__LOGO__", logo)}</main>
<div class="caption">${capHtml}</div>
</body></html>`;
}
