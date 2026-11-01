#!/usr/bin/env node
// Word-root explainer videos, mass-produced from data/families.json.
//
//   node make-video.mjs voc                     # one family  -> out/voc/video.mp4
//   node make-video.mjs all                     # every family
//   node make-video.mjs spect --max 4           # split long families into ~60 s parts (spect-p1, spect-p2)
//   node make-video.mjs voc --speed 1.2         # pace (default 1.1; pitch is preserved)
//   node make-video.mjs voc --voice "Hải Đăng"  # VieNeu voice for the Vietnamese narration
//   node make-video.mjs voc --en-tts gtts       # English voice engine: auto (edge, else gtts) | edge | gtts | vieneu
//   node make-video.mjs voc --tts none          # silent draft to check visuals quickly
//   node make-video.mjs voc --no-sfx            # no pop sounds on reveals
//   node make-video.mjs voc --bgm music.mp3     # quiet background music (use music you own the rights to)
//   node make-video.mjs --series writing because-so   # "Nâng band câu này" Writing video from data/upgrades.json
//                                                     #   -> out/writing-because-so/video.mp4 (all options above apply)
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
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { ROOT_DIR, OUT_DIR, loadFamilies, chunks, plain, ensureDir, captionText, nextFamily } from "./lib/common.mjs";
import { buildScenes } from "./lib/scenes.mjs";
import { buildAss } from "./lib/subtitles.mjs";
import { ensureEmojiAssets } from "./lib/emoji.mjs";
import { frameHtml, W, H } from "./lib/template.mjs";
import { loadUpgrades, nextSet, upgradeCaption } from "./lib/upgrade.mjs";
import { buildUpgradeScenes, writingFrameHtml } from "./lib/upgrade-scenes.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

/* ---------- args ---------- */
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);
const VALUED = new Set(["tts", "en-tts", "voice", "en-voice", "speed", "max", "bgm", "one-voice", "series"]);
const target = args.find((a, i) => !a.startsWith("--") && !VALUED.has(args[i - 1]?.slice(2))) ?? "all";
// VieNeu V4 (the model on vieneu.io) via its cloud API when VIENEU_API_KEY is set; else VieNeu v3 Turbo locally.
const CLOUD_KEY = process.env.VIENEU_API_KEY || "";
let VI_TTS = opt("tts", CLOUD_KEY ? "vieneu-cloud" : "vieneu");
let EN_TTS = opt("en-tts", "vieneu"); // one VieNeu voice for both languages; "auto" = separate English voice
// --one-voice [name]: one Microsoft multilingual voice for both languages (needs edge-tts + internet).
const ONE_VOICE_I = args.indexOf("--one-voice");
const ONE_VOICE = ONE_VOICE_I < 0 ? "" : args[ONE_VOICE_I + 1] && !args[ONE_VOICE_I + 1].startsWith("--") ? args[ONE_VOICE_I + 1] : "en-US-EmmaMultilingualNeural";
if (ONE_VOICE && VI_TTS !== "none") {
  VI_TTS = "edge-multi";
  EN_TTS = "edge-multi";
}
const SERIES = opt("series", "roots"); // roots (data/families.json) | writing (data/upgrades.json)
// Writing videos explain grammar slowly, so they default to natural pace; word-root videos keep 1.1.
const SPEED = Number(opt("speed", SERIES === "writing" ? 1.0 : 1.1)) || 1.1;
const MAX = Number(opt("max", 0)) || 0;
const BGM = opt("bgm", "");
const SFX = !flag("no-sfx");
const AUDIO_ONLY = flag("audio-only"); // narration MP3 only, no video (out/<id>-audio-<engine>-<voice>/)
const FPS = 30;
const VIENEU_VOICE = opt("voice", "Hải Đăng"); // local v3 Turbo; same voice as the V4 default, so every video sounds the same
let CLOUD_VOICE = opt("voice", "Hải Đăng"); // V4 voice id, or the name the vieneu.io web app shows (e.g. "Hải Đăng")
const EDGE_VOICE = { vi: "vi-VN-HoaiMyNeural", en: opt("en-voice", "en-GB-SoniaNeural") };
const PY = process.env.VIENEU_PYTHON || "python3";
const VIENEU_SCRIPT = path.join(ROOT_DIR, "lib", "vieneu_tts.py");

const run = (cmd, a) => execFileSync(cmd, a, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 }).toString();
const duration = (f) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

/* ---------- TTS ---------- */
const CACHE = path.join(OUT_DIR, ".tts-cache");
ensureDir(CACHE);
const engineFor = (lang) => (lang === "en" ? EN_TTS : VI_TTS);
const voiceFor = (engine, lang) =>
  engine === "vieneu" ? VIENEU_VOICE : engine === "vieneu-cloud" ? CLOUD_VOICE : engine === "edge" ? EDGE_VOICE[lang] : engine === "edge-multi" ? ONE_VOICE : lang;
// Bump when lib/vieneu_tts.py changes how the LOCAL voice turns text into audio: clips are cached by text, so
// without a bump, clips made by the old (possibly broken) code are silently reused. Cloud clips are not affected.
const LOCAL_TTS_REV = 2; // 2: marked English sent as phonemes to the inner engine (rev 1 read IPA as letters)
const cachePath = (text, lang) => {
  const engine = engineFor(lang);
  const rev = engine === "vieneu" ? `|r${LOCAL_TTS_REV}` : "";
  const key = crypto.createHash("sha1").update(`${engine}|${lang}|${voiceFor(engine, lang)}|${text}${rev}`).digest("hex").slice(0, 16);
  return path.join(CACHE, key + (engine === "vieneu" ? ".wav" : ".mp3"));
};
const cached = (f) => fs.existsSync(f) && fs.statSync(f).size > 0;

/** VieNeu: render every missing line in one Python process (the model loads once, ~10 s). */
function prefetchVieneu(scenes) {
  const jobs = [];
  for (const s of scenes)
    for (const c of speakable(s.say)) {
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
      if (engine === "vieneu-cloud") {
        const r = spawnSync("curl", ["-sS", "-m", "180", "-w", "%{http_code}", "-X", "POST", "https://api.vieneu.io/api/v1/audio/speech",
          "-H", `Authorization: Bearer ${CLOUD_KEY}`, "-H", "Content-Type: application/json",
          "-d", JSON.stringify({ input: plain(text), voice: CLOUD_VOICE, response_format: "mp3" }), "-o", out]);
        const code = r.stdout.toString().trim();
        if (code !== "200") {
          const body = fs.existsSync(out) ? fs.readFileSync(out, "utf8").slice(0, 300) : r.stderr.toString();
          fs.rmSync(out, { force: true });
          if (code === "429") throw new Error(`VieNeu API limit reached (HTTP 429): ${body}`);
          if (code === "401" || code === "403" || code === "400") { attempt = 99; }
          throw new Error(`VieNeu API HTTP ${code}: ${body}`);
        }
      } else if (engine === "edge-multi") {
        run("edge-tts", ["--voice", ONE_VOICE, "--text", plain(text), "--write-media", out]);
      } else if (engine === "edge") {
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

/** Chunks to voice. A lone one-word Vietnamese chunk between two English ones ("evoke, invoke và provoke")
 *  makes VieNeu stutter or repeat the word, so it becomes a short pause; the caption still shows it. */
function speakable(say) {
  if (VI_TTS === EN_TTS && /^vieneu/.test(VI_TTS)) return unifiedLines(say);
  const cs = chunks(say);
  return cs
    .filter((c, i) => {
      const lone = c.lang === "vi" && c.text.split(/\s+/).length === 1 && cs[i - 1]?.lang === "en" && cs[i + 1]?.lang === "en";
      return !(lone && VI_TTS === "vieneu");
    })
    .map((c, i, arr) => {
      // VieNeu repeats a trailing word when a line stops mid-phrase right before English
      // ("… với" + convert -> "với với"). Closing the phrase with a comma prevents it.
      if (c.lang === "vi" && arr[i + 1]?.lang === "en" && !/[.,:;!?…]$/.test(c.text)) {
        if (!WARNED.has(c.text)) {
          WARNED.add(c.text);
          console.warn(`  ! narration "${c.text}" runs into English; added a comma. Better: start the sentence with the English word.`);
        }
        return { ...c, text: c.text + "," };
      }
      return c;
    });
}
const WARNED = new Set();

/** Pause after each punctuation mark, in seconds before --speed (each clause is its own clip, so these are exact). */
const PAUSE = { ",": 0.4, ";": 0.55, ":": 0.55, ".": 0.7, "!": 0.7, "?": 0.75, "…": 0.6 };
const PUNCT_END = /[.,;:!?…]+$/;

/** One voice for both languages: one clip per clause (split at . , ; : ! ?), with a set pause after each.
 *  Short clips are read more clearly than long lines (fewer swallowed words) and the pauses no longer depend on
 *  the model. English keeps its {{ }} marks: the local VieNeu reads marked parts as English phonemes, so "so",
 *  "to", "an" or "do" are not read as Vietnamese syllables (lib/vieneu_tts.py). Other engines get plain text. */
function unifiedLines(say) {
  const words = [];
  for (const m of say.matchAll(/\{\{(.+?)\}\}|([^{]+)/g)) {
    const en = m[1] != null;
    for (const w of (m[1] ?? m[2]).split(/\s+/).filter(Boolean)) {
      if (!/[\p{L}\p{N}]/u.test(w) && words.length) words.at(-1).w += w; // lone punctuation joins the word before
      else words.push({ w, en });
    }
  }
  const clauses = [];
  let cur = [];
  for (const x of words) {
    cur.push(x);
    if (PUNCT_END.test(x.w)) (clauses.push(cur), (cur = []));
  }
  if (cur.length) clauses.push(cur);
  // A one-word lead-in ("Vì vậy," / "Lên,") would be a tiny clip: read it together with the next clause.
  for (let i = clauses.length - 2; i >= 0; i--)
    if (clauses[i].length === 1 && /,$/.test(clauses[i][0].w)) clauses.splice(i, 2, [...clauses[i], ...clauses[i + 1]]);
  return clauses.map((c, i) => {
    const text = c
      .map(({ w, en }) => {
        if (!en) return w;
        const tail = w.match(PUNCT_END)?.[0] ?? "";
        return `{{${w.slice(0, w.length - tail.length)}}}${tail}`;
      })
      .join(" ")
      .replace(/\}\} \{\{/g, " ");
    const mark = c.at(-1).w.match(PUNCT_END)?.[0].at(-1);
    return { lang: c.every((x) => x.en) ? "en" : "vi", text, pause: i < clauses.length - 1 ? PAUSE[mark] ?? 0.15 : 0 };
  });
}

/** Integrated loudness (LUFS) of a clip after trimming silence, cached next to the clip. */
function loudness(file) {
  const meta = file + ".lufs";
  if (cached(meta)) return Number(fs.readFileSync(meta, "utf8"));
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", `${TRIM},ebur128=framelog=quiet`, "-f", "null", "-"]);
  const m = [...r.stderr.toString().matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  let v = m ? Number(m[1]) : -20;
  if (!(v > -50)) v = -20; // clips too short to measure
  fs.writeFileSync(meta, String(v));
  return v;
}
const TARGET_LUFS = -17;

const TRIM =
  "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse";

/** Narration for one scene -> a single 44.1k stereo WAV at SPEED; returns its path. */
function sceneAudio(scene, file) {
  const hold = (scene.hold ?? 0.35) / SPEED;
  if (VI_TTS === "none") {
    const secs = Math.max(1.5, plain(scene.say).length / 14 / SPEED) + hold;
    run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", secs.toFixed(2), file]);
    scene.__chunks = [{ text: plain(scene.say), weight: 1 }];
    scene.__speech = secs - hold;
    return file;
  }
  const parts = speakable(scene.say).map((c) => {
    const file = ttsChunk(c.text, c.lang);
    return { ...c, file, lufs: loudness(file) };
  });
  const inputs = parts.flatMap((p) => ["-i", p.file]);
  // Each clip: same format, edges trimmed, loudness matched so the two voices sit at the same level.
  const filt =
    parts
      .map((p, i) => {
        const gap = p.pause ?? (i < parts.length - 1 ? (parts[i + 1].lang !== p.lang ? 0.1 : 0.05) : 0);
        const gain = Math.max(-12, Math.min(18, TARGET_LUFS - p.lufs)).toFixed(1);
        return `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,${TRIM},volume=${gain}dB,apad=pad_dur=${gap}[a${i}]`;
      })
      .join(";") +
    `;${parts.map((_, i) => `[a${i}]`).join("")}concat=n=${parts.length}:v=0:a=1,atempo=${SPEED},alimiter=limit=0.9:level=false,adelay=120|120,apad=pad_dur=${hold.toFixed(2)}[out]`;
  run("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", filt, "-map", "[out]", "-ar", "44100", file]);
  scene.__chunks = parts.map((p) => ({ text: p.text, weight: duration(p.file) }));
  scene.__speech = Math.max(0.5, duration(file) - hold - 0.12);
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
  await page.waitForFunction(() => window.__lotReady === true, null, { timeout: 15000 });
  const { endMs, lotMs } = await page.evaluate(() => {
    const anims = document.getAnimations();
    anims.forEach((a) => a.pause());
    window.__anims = anims;
    window.__at = (t) => {
      window.__anims.forEach((a) => (a.currentTime = t));
      window.__setT(t);
    };
    return { endMs: Math.max(0, ...anims.map((a) => a.effect.getComputedTiming().endTime)), lotMs: window.__lotDur || 0 };
  });
  const shot = (sub, i) => page.screenshot({ path: path.join(dir, sub, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 90 });
  ensureDir(path.join(dir, "intro"));
  const intro = Math.max(1, Math.ceil((endMs / 1000) * FPS) + 1);
  for (let f = 0; f < intro; f++) {
    await page.evaluate((t) => window.__at(t), (f * 1000) / FPS);
    await shot("intro", f);
  }
  // Overflow check on the settled layout (mid-animation transforms would give false alarms).
  const tooBig = await page.evaluate(() => {
    const m = document.querySelector("main");
    return m.scrollHeight > m.clientHeight + 4 || m.scrollWidth > m.clientWidth + 4;
  });
  if (tooBig) console.warn(`  ! scene ${path.basename(dir)} overflows its area; shorten the text`);
  // One full cycle of the emoji animation after the intro; ffmpeg loops it for the rest of the scene.
  let loop = 0;
  if (lotMs > 0) {
    ensureDir(path.join(dir, "loop"));
    const start = (intro * 1000) / FPS;
    const n = Math.max(2, Math.round((Math.min(lotMs, 6000) / 1000) * FPS));
    for (let f = 0; f < n; f++) {
      await page.evaluate((t) => window.__at(t), start + (f * lotMs) / n);
      await shot("loop", f);
    }
    loop = n;
  }
  await page.evaluate((t) => window.__at(t), (intro * 1000) / FPS + lotMs - ((intro * 1000) / FPS) % (lotMs || 1));
  await page.screenshot({ path: stillPng });
  return { intro, loop };
}

function segment(framesDir, frames, wav, mp4) {
  const { intro } = frames;
  const secs = Math.max(duration(wav), intro / FPS + 0.3);
  const hold = Math.max(0, secs - intro / FPS);
  const loop = hold > 0.1 ? frames.loop : 0;
  const audio = SFX
    ? `[1:a]apad=whole_dur=${secs.toFixed(3)}[v1];[2:a]volume=0.35[p];[v1][p]amix=inputs=2:duration=first:normalize=0[a]`
    : `[1:a]apad=whole_dur=${secs.toFixed(3)}[a]`;
  const introIn = ["-framerate", String(FPS), "-i", path.join(framesDir, "intro", "f%04d.jpg")];
  const video = loop
    ? `[0:v][L]concat=n=2:v=1:a=0,format=yuv420p[v]`
    : `[0:v]tpad=stop_mode=clone:stop_duration=${hold.toFixed(3)},format=yuv420p[v]`;
  const loopIn = loop ? ["-loop", "1", "-framerate", String(FPS), "-i", path.join(framesDir, "loop", "f%04d.jpg")] : [];
  // inputs: 0 intro, 1 wav, 2 pop (optional), last: loop (optional)
  const loopIdx = SFX ? 3 : 2;
  const loopTrim = loop ? `[${loopIdx}:v]trim=duration=${hold.toFixed(3)},setpts=PTS-STARTPTS[L];` : "";
  run("ffmpeg", ["-y", "-v", "error", ...introIn, "-i", wav,
    ...(SFX ? ["-i", POP] : []),
    ...loopIn,
    "-filter_complex", `${loopTrim}${video};${audio}`,
    "-map", "[v]", "-map", "[a]", "-t", secs.toFixed(3), "-r", String(FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", mp4]);
}

async function makeOne(browser, family, logo, part) {
  const writing = SERIES === "writing";
  const id = writing ? `writing-${family.id}` : part ? `${family.id}-p${part.n}` : family.id;
  // Build in a scratch folder; the previous output is only replaced once the new video is finished.
  const finalDir = path.join(OUT_DIR, id);
  const dir = path.join(OUT_DIR, `.building-${id}`);
  fs.rmSync(dir, { recursive: true, force: true });
  const tmp = path.join(dir, ".tmp");
  ensureDir(tmp);
  const { scenes, words, quizAnswer } = writing
    ? buildUpgradeScenes(family, { next: nextSet(families, family) })
    : buildScenes(family, { ...(part ? { from: part.from, max: MAX, part } : {}), next: nextFamily(families, family) });
  console.log(`▶ ${id}: ${writing ? "" : `${words.length} words, `}${scenes.length} scenes`);
  if (VI_TTS === "vieneu") prefetchVieneu(scenes);

  if (AUDIO_ONLY) {
    // Narration only: same lines, pace, loudness and pauses as the video, into its own folder.
    const voice = VI_TTS === "vieneu-cloud" ? CLOUD_VOICE : VI_TTS === "vieneu" ? VIENEU_VOICE : VI_TTS;
    const slug = voice.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const outDir = path.join(OUT_DIR, `${id}-audio-${VI_TTS}-${slug}`);
    const wavs = scenes.map((scene, i) => sceneAudio(scene, path.join(tmp, `s${String(i).padStart(2, "0")}.wav`)));
    const list = path.join(tmp, "concat.txt");
    fs.writeFileSync(list, wavs.map((f) => `file '${f}'`).join("\n"));
    run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-ar", "44100", "-ac", "2", "-b:a", "192k",
      path.join(dir, "narration.mp3")]);
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.renameSync(dir, outDir);
    console.log(`  ✓ ${path.relative(ROOT_DIR, path.join(outDir, "narration.mp3"))} (${duration(path.join(outDir, "narration.mp3")).toFixed(0)}s)`);
    return;
  }

  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const list = [];
  const subs = [];
  let clock = 0;
  for (const [i, scene] of scenes.entries()) {
    const tag = `s${String(i).padStart(2, "0")}`;
    const framesDir = path.join(tmp, tag);
    const n = await captureScene(page, (writing ? writingFrameHtml : frameHtml)({ family, scene, logo }), framesDir, path.join(dir, `${tag}-${scene.kind}.png`));
    const wav = sceneAudio(scene, path.join(tmp, `${tag}.wav`));
    const mp4 = path.join(tmp, `${tag}.mp4`);
    segment(framesDir, n, wav, mp4);
    list.push(mp4);
    const segDur = duration(mp4);
    subs.push({ start: clock, speech: scene.__speech, end: clock + segDur, chunks: scene.__chunks });
    clock += segDur;
    process.stdout.write(`  ${scene.kind.padEnd(8)} ${segDur.toFixed(1)}s\n`);
  }
  await page.close();

  // Join, then one final pass: progress bar across the top (+ optional music).
  const concat = path.join(tmp, "concat.txt");
  fs.writeFileSync(concat, list.map((f) => `file '${f}'`).join("\n"));
  const joined = path.join(tmp, "joined.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", joined]);
  const total = duration(joined);
  const assFile = path.join(tmp, "subs.ass");
  fs.writeFileSync(assFile, buildAss(subs, { width: W, height: H }));
  const fontsDir = path.join(ROOT_DIR, "assets", "fonts");
  const bar = `[1:v]format=rgba[bar];[0:v][bar]overlay=x='-w+w*t/${total.toFixed(3)}':y=0:shortest=1,subtitles=${assFile}:fontsdir=${fontsDir},format=yuv420p[v]`;
  const music = BGM ? `;[2:a]volume=0.12[m];[0:a][m]amix=inputs=2:duration=first:normalize=0[a]` : "";
  run("ffmpeg", ["-y", "-v", "error", "-i", joined, "-f", "lavfi", "-i", `color=c=0xf2711c:s=${W}x14:r=${FPS}`,
    ...(BGM ? ["-stream_loop", "-1", "-i", BGM] : []),
    "-filter_complex", bar + music, "-map", "[v]", "-map", BGM ? "[a]" : "0:a",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
    path.join(dir, "video.mp4")]);
  fs.rmSync(tmp, { recursive: true, force: true });

  const cap = writing ? upgradeCaption(family, nextSet(families, family)) : captionText(family, words, quizAnswer, part, nextFamily(families, family));
  fs.writeFileSync(path.join(dir, "caption.txt"), cap + "\n");
  fs.rmSync(finalDir, { recursive: true, force: true });
  fs.renameSync(dir, finalDir);
  console.log(`  ✓ ${path.relative(ROOT_DIR, path.join(finalDir, "video.mp4"))} (${duration(path.join(finalDir, "video.mp4")).toFixed(0)}s)`);
}

/* ---------- main ---------- */
if (VI_TTS === "vieneu-cloud") {
  EN_TTS = "vieneu-cloud";
  // The web app shows display names that differ from API ids ("Hải Đăng" is id "Minh Quân Pro"): resolve them.
  try {
    const list = JSON.parse(run("curl", ["-sS", "-m", "30", "https://api.vieneu.io/api/tts/voices"])).voices ?? [];
    const v4 = list.filter((v) => v.engine === "v4");
    const hit = v4.find((v) => v.id === CLOUD_VOICE) ?? v4.find((v) => v.name === CLOUD_VOICE);
    if (!hit) throw new Error(`no V4 voice called "${CLOUD_VOICE}"`);
    if (hit.id !== CLOUD_VOICE) console.log(`  "${CLOUD_VOICE}" on vieneu.io = V4 voice id "${hit.id}"`);
    CLOUD_VOICE = hit.id;
  } catch (e) {
    console.warn(`! Could not check the voice name (${e.message}); sending "${CLOUD_VOICE}" as is.`);
  }
  console.log(`Voice: VieNeu V4 cloud "${CLOUD_VOICE}" for both Vietnamese and English`);
}
if (VI_TTS === "vieneu" || EN_TTS === "vieneu") {
  try {
    execFileSync(PY, [VIENEU_SCRIPT, "--check"], { stdio: "ignore" });
  } catch {
    console.warn(`! VieNeu-TTS not found for ${PY} (pip install vieneu). Falling back to gTTS.`);
    if (VI_TTS === "vieneu") VI_TTS = "gtts";
    if (EN_TTS === "vieneu") EN_TTS = "auto";
  }
}
if (VI_TTS !== "none" && !/^vieneu/.test(EN_TTS)) resolveEnglishEngine();
if (VI_TTS === "vieneu" && EN_TTS === "vieneu") console.log(`Voice: VieNeu "${VIENEU_VOICE}" for both Vietnamese and English`);

// "families" = the items of the chosen series (root families, or Writing upgrade sets).
const families = SERIES === "writing" ? loadUpgrades() : loadFamilies();
if (SERIES !== "writing") ensureEmojiAssets(families);
const chosen = target === "all" ? families : families.filter((f) => target.split(",").includes(f.id));
if (!chosen.length) {
  console.error(`No family "${target}". Available: ${families.map((f) => f.id).join(", ")}`);
  process.exit(1);
}
const logo = "data:image/svg+xml;base64," + fs.readFileSync(path.join(ROOT_DIR, "../../public/favicon.svg")).toString("base64");
const browser = AUDIO_ONLY ? null : await chromium.launch();
try {
  for (const f of chosen) {
    if (MAX && f.words && f.words.length > MAX) {
      for (let from = 0, n = 1; from < f.words.length; from += MAX, n++)
        await makeOne(browser, f, logo, { from, n, hasNext: from + MAX < f.words.length });
    } else await makeOne(browser, f, logo);
  }
} finally {
  await browser?.close();
}
