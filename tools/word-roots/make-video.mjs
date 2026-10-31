#!/usr/bin/env node
// Word-root explainer videos, mass-produced from data/families.json.
//
//   node make-video.mjs voc                 # one family
//   node make-video.mjs all                 # every family
//   node make-video.mjs spect --max 4       # split long families: part 1 = words 1-4 ...
//   node make-video.mjs voc --tts edge      # better voices (needs: pip install edge-tts)
//   node make-video.mjs voc --tts none      # silent draft, timed from text length
//   node make-video.mjs voc --bgm music.mp3 # quiet background music under the voice
//
// Output: out/<id>[-pN]/video.mp4 + caption.txt (post text + pinned-comment answer) + scene PNGs.
// Needs: node + playwright, ffmpeg/ffprobe, and gtts-cli (pip install gTTS) or edge-tts.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { ROOT_DIR, OUT_DIR, loadFamilies, chunks, plain, ensureDir } from "./lib/common.mjs";
import { buildScenes } from "./lib/scenes.mjs";
import { frameHtml, W, H } from "./lib/template.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

/* ---------- args ---------- */
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const target = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true) ?? "all";
const TTS = opt("tts", "gtts");
const MAX = Number(opt("max", 0)) || 0;
const BGM = opt("bgm", "");
const VOICES = {
  edge: { vi: opt("vi-voice", "vi-VN-HoaiMyNeural"), en: opt("en-voice", "en-GB-SoniaNeural") },
  gtts: { vi: "vi", en: "en" },
};

const run = (cmd, a) => execFileSync(cmd, a, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const duration = (f) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

/* ---------- TTS (cached per sentence) ---------- */
const CACHE = path.join(OUT_DIR, ".tts-cache");
ensureDir(CACHE);

function ttsChunk(text, lang) {
  const key = crypto.createHash("sha1").update(`${TTS}|${lang}|${VOICES[TTS]?.[lang]}|${text}`).digest("hex").slice(0, 16);
  const mp3 = path.join(CACHE, `${key}.mp3`);
  if (fs.existsSync(mp3) && fs.statSync(mp3).size > 0) return mp3;
  for (let attempt = 1; ; attempt++) {
    try {
      if (TTS === "edge") {
        run("edge-tts", ["--voice", VOICES.edge[lang], "--rate", lang === "en" ? "-8%" : "+0%", "--text", text, "--write-media", mp3]);
      } else {
        run("gtts-cli", ["-l", VOICES.gtts[lang], "-o", mp3, text]);
      }
      return mp3;
    } catch (e) {
      if (attempt >= 3) throw new Error(`TTS failed for "${text}": ${e.stderr ?? e.message}`);
    }
  }
}

/** Narration for one scene -> a single 44.1k stereo WAV; returns its path. */
function sceneAudio(scene, dir, idx) {
  const wav = path.join(dir, `s${String(idx).padStart(2, "0")}.wav`);
  const hold = scene.hold ?? 0.45;
  if (TTS === "none") {
    const secs = Math.max(2, plain(scene.say).length / 14) + hold;
    run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", secs.toFixed(2), wav]);
    return wav;
  }
  const parts = chunks(scene.say).map((c) => ttsChunk(c.text, c.lang));
  const inputs = parts.flatMap((p) => ["-i", p]);
  // gTTS pads each clip with silence; trim it so the English words sit inside the sentence naturally.
  const trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse";
  const speed = TTS === "gtts" ? ",atempo=1.15" : "";
  const filt =
    parts.map((_, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=stereo,${trim}${speed},apad=pad_dur=0.12[a${i}]`).join(";") +
    `;${parts.map((_, i) => `[a${i}]`).join("")}concat=n=${parts.length}:v=0:a=1,apad=pad_dur=${hold}[out]`;
  run("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", filt, "-map", "[out]", wav]);
  return wav;
}

/* ---------- video ---------- */
function segment(png, wav, mp4, secs) {
  const frames = Math.round(secs * 30);
  // slow push-in + quick fade from white so every cut feels alive
  const vf = `scale=${W * 1.5}:${H * 1.5},zoompan=z='1+0.035*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=30,fade=t=in:st=0:d=0.18:color=white,format=yuv420p`;
  run("ffmpeg", ["-y", "-v", "error", "-loop", "1", "-framerate", "30", "-i", png, "-i", wav,
    "-vf", vf, "-t", secs.toFixed(3), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", "-shortest", mp4]);
}

async function makeOne(browser, family, logo, part) {
  const id = part ? `${family.id}-p${part.n}` : family.id;
  const dir = path.join(OUT_DIR, id);
  ensureDir(dir);
  const { scenes, words, quizAnswer } = buildScenes(family, part ? { from: part.from, max: MAX } : {});
  console.log(`▶ ${id}: ${words.length} words, ${scenes.length} scenes`);

  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const list = [];
  for (const [i, scene] of scenes.entries()) {
    const png = path.join(dir, `s${String(i).padStart(2, "0")}-${scene.kind}.png`);
    await page.setContent(frameHtml({ family, scene, logo }), { waitUntil: "networkidle" }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: png });
    const wav = sceneAudio(scene, dir, i);
    const secs = duration(wav);
    const mp4 = path.join(dir, `s${String(i).padStart(2, "0")}.mp4`);
    segment(png, wav, mp4, secs);
    list.push(mp4);
    process.stdout.write(`  ${scene.kind} ${secs.toFixed(1)}s\n`);
  }
  await page.close();

  const concat = path.join(dir, "concat.txt");
  fs.writeFileSync(concat, list.map((f) => `file '${path.basename(f)}'`).join("\n"));
  const joined = path.join(dir, BGM ? "voice.mp4" : "video.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", "-movflags", "+faststart", joined]);
  if (BGM) {
    run("ffmpeg", ["-y", "-v", "error", "-i", joined, "-stream_loop", "-1", "-i", BGM, "-filter_complex",
      "[1:a]volume=0.12[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]",
      "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
      path.join(dir, "video.mp4")]);
    fs.rmSync(joined);
  }
  for (const f of list) fs.rmSync(f);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".wav"))) fs.rmSync(path.join(dir, f));
  fs.rmSync(concat);

  const partLabel = part ? ` (Phần ${part.n})` : "";
  const caption = [
    `${plain(family.hook)}${partLabel}`,
    "",
    `Gốc "${family.root}" (${family.origin}) = ${family.core}`,
    ...words.map((w) => `• ${w.word} (${w.pos}): ${w.meaning}`),
    "",
    "💾 Lưu lại để ôn · Theo dõi UpWind: mỗi ngày 1 gốc từ",
    `#upwind #goctu #ielts #tuvungtienganh #hoctienganh #${family.id}`,
    "",
    "--- Bình luận ghim (đáp án thử thách) ---",
    `Đáp án: ${quizAnswer}`,
  ].join("\n");
  fs.writeFileSync(path.join(dir, "caption.txt"), caption + "\n");
  console.log(`  ✓ ${path.relative(ROOT_DIR, path.join(dir, "video.mp4"))} (${duration(path.join(dir, "video.mp4")).toFixed(0)}s)`);
}

const families = loadFamilies();
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
      for (let from = 0, n = 1; from < f.words.length; from += MAX, n++) await makeOne(browser, f, logo, { from, n });
    } else await makeOne(browser, f, logo);
  }
} finally {
  await browser.close();
}
