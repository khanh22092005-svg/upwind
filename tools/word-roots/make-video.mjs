#!/usr/bin/env node
// Word-root explainer videos, mass-produced from data/families.json.
//
//   node make-video.mjs voc                     # one family  -> out/voc/video.mp4
//   node make-video.mjs all                     # every family
//   node make-video.mjs spect --max 4           # split long families into ~60 s parts (spect-p1, spect-p2)
//   node make-video.mjs voc --speed 1.3         # pace (default 1.2; pitch is preserved)
//   node make-video.mjs voc --voice "Hải Đăng"  # VieNeu voice for the Vietnamese narration
//   node make-video.mjs voc --en-tts gtts       # English voice engine: auto (edge, else gtts) | edge | gtts | vieneu
//   node make-video.mjs voc --tts none          # silent draft to check visuals quickly
//   node make-video.mjs voc --no-sfx            # no pop sounds on reveals
//   node make-video.mjs voc --bgm music.mp3     # quiet background music (use music you own the rights to)
//
// Voices: Vietnamese -> VieNeu-TTS (pip install vieneu). English words and example sentences -> a dedicated
// English voice (edge-tts en-GB, or gTTS British). VieNeu reads English inconsistently (the same word can
// come out right in one scene and wrong in the next), so every English word/sentence is rendered once by
// the English voice and that same clip is reused everywhere it appears: identical, correct pronunciation.
//
// Output: out/<id>[-pN]/video.mp4 + caption.txt (post text + pinned-comment answer) + one PNG per scene.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { ROOT_DIR, OUT_DIR, loadFamilies, chunks, plain, ensureDir, captionText, nextFamily } from "./lib/common.mjs";
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
const flag = (name) => args.includes(`--${name}`);
const VALUED = new Set(["tts", "en-tts", "voice", "en-voice", "speed", "max", "bgm"]);
const target = args.find((a, i) => !a.startsWith("--") && !VALUED.has(args[i - 1]?.slice(2))) ?? "all";
let VI_TTS = opt("tts", "vieneu");
let EN_TTS = opt("en-tts", "auto");
const SPEED = Number(opt("speed", 1.2)) || 1.2;
const MAX = Number(opt("max", 0)) || 0;
const BGM = opt("bgm", "");
const SFX = !flag("no-sfx");
const FPS = 30;
const VIENEU_VOICE = opt("voice", "Ngọc Huyền");
const EDGE_VOICE = { vi: "vi-VN-HoaiMyNeural", en: opt("en-voice", "en-GB-SoniaNeural") };
const PY = process.env.VIENEU_PYTHON || "python3";
const VIENEU_SCRIPT = path.join(ROOT_DIR, "lib", "vieneu_tts.py");

const run = (cmd, a) => execFileSync(cmd, a, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 }).toString();
const duration = (f) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

/* ---------- TTS ---------- */
const CACHE = path.join(OUT_DIR, ".tts-cache");
ensureDir(CACHE);
const engineFor = (lang) => (lang === "en" ? EN_TTS : VI_TTS);
const voiceFor = (engine, lang) => (engine === "vieneu" ? VIENEU_VOICE : engine === "edge" ? EDGE_VOICE[lang] : lang);
const cachePath = (text, lang) => {
  const engine = engineFor(lang);
  const key = crypto.createHash("sha1").update(`${engine}|${lang}|${voiceFor(engine, lang)}|${text}`).digest("hex").slice(0, 16);
  return path.join(CACHE, key + (engine === "vieneu" ? ".wav" : ".mp3"));
};
const cached = (f) => fs.existsSync(f) && fs.statSync(f).size > 0;

/** VieNeu: render every missing line in one Python process (the model loads once, ~10 s). */
function prefetchVieneu(scenes) {
  const jobs = [];
  for (const s of scenes)
    for (const c of chunks(s.say)) {
      if (engineFor(c.lang) !== "vieneu") continue;
      const out = cachePath(c.text, c.lang);
      if (!cached(out) && !jobs.some((j) => j.out === out)) jobs.push({ text: c.text, out });
    }
  if (!jobs.length) return;
  const file = path.join(CACHE, "jobs.json");
  fs.writeFileSync(file, JSON.stringify({ voice: VIENEU_VOICE, jobs }));
  console.log(`  VieNeu-TTS: ${jobs.length} new lines, voice "${VIENEU_VOICE}"`);
  execFileSync(PY, [VIENEU_SCRIPT, file], { stdio: ["ignore", "inherit", "inherit"] });
}

function ttsChunk(text, lang) {
  const out = cachePath(text, lang);
  if (cached(out)) return out;
  const engine = engineFor(lang);
  if (engine === "vieneu") throw new Error(`VieNeu did not produce audio for "${text}"`);
  for (let attempt = 1; ; attempt++) {
    try {
      if (engine === "edge") {
        run("edge-tts", ["--voice", EDGE_VOICE[lang], "--rate", lang === "en" ? "-5%" : "+0%", "--text", text, "--write-media", out]);
      } else {
        run("gtts-cli", ["-l", lang, ...(lang === "en" ? ["--tld", "co.uk"] : []), "-o", out, text]);
      }
      if (!cached(out)) throw new Error("empty audio");
      return out;
    } catch (e) {
      if (attempt >= 3) throw new Error(`TTS (${engine}) failed for "${text}": ${e.stderr ?? e.message}`);
    }
  }
}

/** Pick the English engine: edge-tts if it actually works here, otherwise gTTS. */
function resolveEnglishEngine() {
  if (EN_TTS !== "auto") return;
  try {
    const probe = path.join(CACHE, "edge-probe.mp3");
    run("edge-tts", ["--voice", EDGE_VOICE.en, "--text", "Hello.", "--write-media", probe]);
    if (!cached(probe)) throw new Error("no audio");
    EN_TTS = "edge";
  } catch {
    EN_TTS = "gtts";
  }
  console.log(`English voice: ${EN_TTS === "edge" ? `edge-tts ${EDGE_VOICE.en}` : "gTTS (British)"}`);
}

const TRIM =
  "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse";

/** Narration for one scene -> a single 44.1k stereo WAV at SPEED; returns its path. */
function sceneAudio(scene, file) {
  const hold = (scene.hold ?? 0.35) / SPEED;
  if (VI_TTS === "none") {
    const secs = Math.max(1.5, plain(scene.say).length / 14 / SPEED) + hold;
    run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", secs.toFixed(2), file]);
    return file;
  }
  const parts = chunks(scene.say).map((c) => ({ ...c, file: ttsChunk(c.text, c.lang) }));
  const inputs = parts.flatMap((p) => ["-i", p.file]);
  // Each clip: same format, edges trimmed, loudness matched so the two voices sit at the same level.
  const filt =
    parts
      .map((p, i) => {
        const gap = i < parts.length - 1 ? (parts[i + 1].lang !== p.lang ? 0.1 : 0.05) : 0;
        return `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,${TRIM},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100,apad=pad_dur=${gap}[a${i}]`;
      })
      .join(";") +
    `;${parts.map((_, i) => `[a${i}]`).join("")}concat=n=${parts.length}:v=0:a=1,atempo=${SPEED},adelay=120|120,apad=pad_dur=${hold.toFixed(2)}[out]`;
  run("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", filt, "-map", "[out]", "-ar", "44100", file]);
  return file;
}

/* ---------- sound effect (synthesised, so no licensing questions) ---------- */
const POP = path.join(CACHE, "pop.wav");
if (SFX && !cached(POP)) {
  const e = "0.6*sin(2*PI*(520+900*exp(-28*t))*t)*exp(-22*t)";
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `aevalsrc=${e}|${e}:s=44100:d=0.22`, POP]);
}

/* ---------- animated capture ---------- */
/** Steps every CSS animation frame by frame and saves JPEGs; returns the number of intro frames. */
async function captureScene(page, html, dir, stillPng) {
  ensureDir(dir);
  await page.setContent(html, { waitUntil: "networkidle" }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  const endMs = await page.evaluate(() => {
    const anims = document.getAnimations();
    anims.forEach((a) => a.pause());
    window.__anims = anims;
    return Math.max(0, ...anims.map((a) => a.effect.getComputedTiming().endTime));
  });
  const frames = Math.max(1, Math.ceil((endMs / 1000) * FPS) + 1);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.__anims.forEach((a) => (a.currentTime = t)), (f * 1000) / FPS);
    await page.screenshot({ path: path.join(dir, `f${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 90 });
  }
  await page.screenshot({ path: stillPng });
  return frames;
}

function segment(framesDir, nFrames, wav, mp4) {
  const secs = Math.max(duration(wav), nFrames / FPS + 0.3);
  const hold = Math.max(0, secs - nFrames / FPS);
  const audio = SFX
    ? `[1:a]apad=whole_dur=${secs.toFixed(3)}[v1];[2:a]volume=0.35[p];[v1][p]amix=inputs=2:duration=first:normalize=0[a]`
    : `[1:a]apad=whole_dur=${secs.toFixed(3)}[a]`;
  run("ffmpeg", ["-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(framesDir, "f%04d.jpg"), "-i", wav,
    ...(SFX ? ["-i", POP] : []),
    "-filter_complex", `[0:v]tpad=stop_mode=clone:stop_duration=${hold.toFixed(3)},format=yuv420p[v];${audio}`,
    "-map", "[v]", "-map", "[a]", "-t", secs.toFixed(3), "-r", String(FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", mp4]);
}

async function makeOne(browser, family, logo, part) {
  const id = part ? `${family.id}-p${part.n}` : family.id;
  const dir = path.join(OUT_DIR, id);
  fs.rmSync(dir, { recursive: true, force: true });
  const tmp = path.join(dir, ".tmp");
  ensureDir(tmp);
  const { scenes, words, quizAnswer } = buildScenes(family, { ...(part ? { from: part.from, max: MAX, part } : {}), next: nextFamily(families, family) });
  console.log(`▶ ${id}: ${words.length} words, ${scenes.length} scenes`);
  if (VI_TTS === "vieneu") prefetchVieneu(scenes);

  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const list = [];
  for (const [i, scene] of scenes.entries()) {
    const tag = `s${String(i).padStart(2, "0")}`;
    const framesDir = path.join(tmp, tag);
    const n = await captureScene(page, frameHtml({ family, scene, logo }), framesDir, path.join(dir, `${tag}-${scene.kind}.png`));
    const wav = sceneAudio(scene, path.join(tmp, `${tag}.wav`));
    const mp4 = path.join(tmp, `${tag}.mp4`);
    segment(framesDir, n, wav, mp4);
    list.push(mp4);
    process.stdout.write(`  ${scene.kind.padEnd(8)} ${duration(mp4).toFixed(1)}s\n`);
  }
  await page.close();

  // Join, then one final pass: progress bar across the top (+ optional music).
  const concat = path.join(tmp, "concat.txt");
  fs.writeFileSync(concat, list.map((f) => `file '${f}'`).join("\n"));
  const joined = path.join(tmp, "joined.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", joined]);
  const total = duration(joined);
  const bar = `[1:v]format=rgba[bar];[0:v][bar]overlay=x='-w+w*t/${total.toFixed(3)}':y=0:shortest=1,format=yuv420p[v]`;
  const music = BGM ? `;[2:a]volume=0.12[m];[0:a][m]amix=inputs=2:duration=first:normalize=0[a]` : "";
  run("ffmpeg", ["-y", "-v", "error", "-i", joined, "-f", "lavfi", "-i", `color=c=0xf2711c:s=${W}x14:r=${FPS}`,
    ...(BGM ? ["-stream_loop", "-1", "-i", BGM] : []),
    "-filter_complex", bar + music, "-map", "[v]", "-map", BGM ? "[a]" : "0:a",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
    path.join(dir, "video.mp4")]);
  fs.rmSync(tmp, { recursive: true, force: true });

  fs.writeFileSync(path.join(dir, "caption.txt"), captionText(family, words, quizAnswer, part, nextFamily(families, family)) + "\n");
  console.log(`  ✓ ${path.relative(ROOT_DIR, path.join(dir, "video.mp4"))} (${duration(path.join(dir, "video.mp4")).toFixed(0)}s)`);
}

/* ---------- main ---------- */
if (VI_TTS === "vieneu" || EN_TTS === "vieneu") {
  try {
    execFileSync(PY, [VIENEU_SCRIPT, "--check"], { stdio: "ignore" });
  } catch {
    console.warn(`! VieNeu-TTS not found for ${PY} (pip install vieneu). Falling back to gTTS.`);
    if (VI_TTS === "vieneu") VI_TTS = "gtts";
    if (EN_TTS === "vieneu") EN_TTS = "auto";
  }
}
if (VI_TTS !== "none") resolveEnglishEngine();

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
      for (let from = 0, n = 1; from < f.words.length; from += MAX, n++)
        await makeOne(browser, f, logo, { from, n, hasNext: from + MAX < f.words.length });
    } else await makeOne(browser, f, logo);
  }
} finally {
  await browser.close();
}
