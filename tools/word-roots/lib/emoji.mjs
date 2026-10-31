// Noto animated emoji (Lottie JSON, CC BY 4.0) rendered with lottie-web inside the scene HTML.
// make-video.mjs steps every animation frame by frame (window.__setT), so capture is exact;
// carousels freeze each emoji on a nice frame.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT_DIR, esc } from "./common.mjs";

const EDIR = path.join(ROOT_DIR, "assets", "emoji");
const LOTTIE_JS = path.join(ROOT_DIR, "assets", "vendor", "lottie_svg.min.js");

/** Download any missing emoji / player (runs fetch-assets.mjs once if needed). */
export function ensureEmojiAssets(families) {
  const need = new Set();
  for (const f of families) for (const x of [f, ...f.words]) if (x.anim) need.add(x.anim);
  const missing = [...need].filter((cp) => !fs.existsSync(path.join(EDIR, `${cp}.json`)));
  if (missing.length || !fs.existsSync(LOTTIE_JS)) {
    console.log(`Fetching ${missing.length} animated emoji ...`);
    execFileSync(process.execPath, [path.join(ROOT_DIR, "fetch-assets.mjs")], { stdio: "inherit" });
  }
}

/** Big animated emoji for a family/word; falls back to the static emoji glyph. */
export function animEmoji(x, size = 240, cls = "") {
  if (x?.anim && fs.existsSync(path.join(EDIR, `${x.anim}.json`)))
    return `<span class="lot ${cls}" data-cp="${x.anim}" style="width:${size}px;height:${size}px"></span>`;
  return `<span class="emoji ${cls}" style="font-size:${Math.round(size * 0.82)}px;line-height:1">${esc(x?.emoji ?? "✨")}</span>`;
}

/**
 * Scripts that turn every .lot placeholder in `html` into a paused Lottie animation.
 * Exposes window.__lotReady, window.__lotDur (longest loop, ms) and window.__setT(ms).
 * `freezeAt` (0..1): show a fixed point of each animation (carousels).
 */
export function lottieScripts(html, { freezeAt = null } = {}) {
  const cps = [...new Set([...html.matchAll(/data-cp="([0-9a-f_]+)"/g)].map((m) => m[1]))];
  if (!cps.length) return `<script>window.__lotReady=true;window.__lotDur=0;window.__setT=()=>{};</script>`;
  const data = cps.map((cp) => `${JSON.stringify(cp)}:${fs.readFileSync(path.join(EDIR, `${cp}.json`), "utf8")}`).join(",");
  return `<script>${fs.readFileSync(LOTTIE_JS, "utf8")}</script>
<script>
(() => {
  const D = {${data}};
  const els = [...document.querySelectorAll(".lot")];
  let loaded = 0;
  window.__lotReady = false;
  window.__lots = els.map((el) => {
    const a = lottie.loadAnimation({ container: el, renderer: "svg", loop: true, autoplay: false,
      animationData: JSON.parse(JSON.stringify(D[el.dataset.cp])) });
    a.addEventListener("DOMLoaded", () => {
      if (++loaded === els.length) {
        window.__lotDur = Math.max(...window.__lots.map((x) => x.getDuration(false) * 1000));
        ${freezeAt == null ? "" : `window.__lots.forEach((x) => x.goToAndStop(x.getDuration(false) * 1000 * ${freezeAt}, false));`}
        window.__lotReady = true;
      }
    });
    return a;
  });
  window.__setT = (ms) => window.__lots.forEach((a) => {
    const d = a.getDuration(false) * 1000;
    a.goToAndStop(((ms % d) + d) % d, false);
  });
})();
</script>`;
}
