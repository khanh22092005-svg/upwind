#!/usr/bin/env node
// Downloads the visual assets the videos and carousels use, and only the ones in use:
//   assets/icons/*.svg     Tabler icons (https://tabler.io/icons, MIT) for small UI glyphs
//   assets/emoji/*.json    Noto animated emoji (https://googlefonts.github.io/noto-emoji-animation/, CC BY 4.0)
//   assets/vendor/lottie_svg.min.js   lottie-web player (MIT), plays the emoji animations
//   assets/fonts/*.ttf     Be Vietnam Pro (SIL OFL) for burned-in video subtitles
// Run it after adding families or changing `icon` / `anim` values:  node fetch-assets.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT_DIR, loadFamilies, ensureDir } from "./lib/common.mjs";
import { UI_ICONS } from "./lib/icons.mjs";

const families = loadFamilies();
const names = new Set(Object.values(UI_ICONS));
const anims = new Set();
for (const f of families) {
  if (f.icon) names.add(f.icon);
  if (f.anim) anims.add(f.anim);
  for (const w of f.words) {
    if (w.icon) names.add(w.icon);
    if (w.anim) anims.add(w.anim);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tabler-"));
console.log("Downloading @tabler/icons ...");
const tgz = execFileSync("npm", ["pack", "@tabler/icons", "--silent"], { cwd: tmp }).toString().trim().split("\n").pop();
execFileSync("tar", ["xzf", tgz], { cwd: tmp });
const src = path.join(tmp, "package", "icons", "outline");
const dest = path.join(ROOT_DIR, "assets", "icons");
ensureDir(dest);

const missing = [];
for (const n of [...names].sort()) {
  const file = path.join(src, `${n}.svg`);
  if (fs.existsSync(file)) fs.copyFileSync(file, path.join(dest, `${n}.svg`));
  else missing.push(n);
}
fs.copyFileSync(path.join(tmp, "package", "LICENSE"), path.join(dest, "LICENSE"));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${names.size - missing.length} icons in assets/icons`);

// lottie-web player
execFileSync("npm", ["pack", "lottie-web", "--silent"], { cwd: tmp2() });
function tmp2() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "lottie-"));
  globalThis.__lottieTmp = d;
  return d;
}
const lt = globalThis.__lottieTmp;
const ltgz = fs.readdirSync(lt).find((f) => f.endsWith(".tgz"));
execFileSync("tar", ["xzf", ltgz], { cwd: lt });
ensureDir(path.join(ROOT_DIR, "assets", "vendor"));
fs.copyFileSync(path.join(lt, "package", "build", "player", "lottie_svg.min.js"), path.join(ROOT_DIR, "assets", "vendor", "lottie_svg.min.js"));
fs.copyFileSync(path.join(lt, "package", "LICENSE.md"), path.join(ROOT_DIR, "assets", "vendor", "LICENSE-lottie-web.md"));
fs.rmSync(lt, { recursive: true, force: true });
console.log("✓ lottie-web player in assets/vendor");

// Noto animated emoji (Lottie JSON)
const edir = path.join(ROOT_DIR, "assets", "emoji");
ensureDir(edir);
let got = 0;
for (const cp of anims) {
  const out = path.join(edir, `${cp}.json`);
  if (fs.existsSync(out)) continue;
  const res = await fetch(`https://fonts.gstatic.com/s/e/notoemoji/latest/${cp}/lottie.json`);
  if (!res.ok) {
    missing.push(`emoji ${cp} (HTTP ${res.status})`);
    continue;
  }
  fs.writeFileSync(out, await res.text());
  got++;
}
fs.writeFileSync(path.join(edir, "LICENSE.txt"),
  "Noto Emoji Animation by Google, https://googlefonts.github.io/noto-emoji-animation/\nLicensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/\n");
console.log(`✓ ${anims.size} animated emoji in assets/emoji (${got} downloaded)`);

// Be Vietnam Pro (SIL OFL) for the burned-in subtitles
const fdir = path.join(ROOT_DIR, "assets", "fonts");
ensureDir(fdir);
const FONT_BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/";
for (const f of ["BeVietnamPro-SemiBold.ttf", "BeVietnamPro-Bold.ttf", "BeVietnamPro-ExtraBold.ttf", "OFL.txt"]) {
  const out = path.join(fdir, f);
  if (fs.existsSync(out)) continue;
  const res = await fetch(FONT_BASE + f);
  if (!res.ok) {
    missing.push(`font ${f} (HTTP ${res.status})`);
    continue;
  }
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
}
console.log("✓ Be Vietnam Pro fonts in assets/fonts");
if (missing.length) {
  console.error(`✗ not in Tabler: ${missing.join(", ")}. Pick names from https://tabler.io/icons`);
  process.exit(1);
}
