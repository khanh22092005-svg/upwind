# UpWind word-root kit (Gốc từ)

Turns one data file into (1) vertical explainer videos for Reels, TikTok and Shorts and
(2) a printable study handbook. Every root family in `data/families.json` becomes one video.

Read `METHOD.md` for why the format works, how to scale it, and the prompt for writing new families.

## Setup (once)

```bash
pip install gTTS edge-tts      # voices; edge-tts sounds better, gTTS is the fallback
# ffmpeg + Node 18+ with Playwright (npm i -g playwright && npx playwright install chromium)
```

## Make videos

```bash
cd tools/word-roots
node make-video.mjs voc                 # one family  -> out/voc/video.mp4
node make-video.mjs voc,spect,dict      # several
node make-video.mjs all                 # everything
node make-video.mjs spect --max 4       # split into ~60–90 s parts: out/spect-p1, spect-p2
node make-video.mjs voc --tts edge      # Microsoft neural voices (vi-VN-HoaiMyNeural + en-GB-SoniaNeural)
node make-video.mjs voc --tts none      # silent draft to check the visuals quickly
node make-video.mjs voc --bgm lofi.mp3  # quiet background music (use music you own the rights to)
```

Each output folder has:

- `video.mp4`: 1080×1920, 30 fps, H.264 + AAC, with Vietnamese captions burned in
- `caption.txt`: post text, hashtags, and the **pinned comment** with the quiz answer
- `sNN-*.png`: every scene as an image, ready to reuse as a carousel or a Threads post

Narration is Vietnamese. Anything inside `{{ }}` in the data (English words, example sentences)
is spoken by the English voice, so learners hear the correct pronunciation.
TTS clips are cached in `out/.tts-cache`, so re-rendering after a visual tweak is fast.

## Make the handbook

```bash
node make-handbook.mjs                  # -> out/handbook/upwind-goc-tu.pdf (+ .html)
```

It holds the method, prefix and suffix tables built from the data, one page per family
(breakdown, story, meaning, derived words, example), exercises with a word bank, and an answer key.

## Add a family

Copy any object in `data/families.json`, or generate one with the prompt in `METHOD.md`.
Fields:

| field | what |
|---|---|
| `id` | short slug, used for the folder name and the CLI |
| `root`, `origin`, `core` | `"voc / voke"`, `"Latin vocare"`, `"gọi, cất tiếng"` |
| `say_root` | optional: how the English voice should say the root (`"voke"` reads better than `"voc"`) |
| `emoji`, `image` | the one picture every word in the family hangs on |
| `hook` | opening question; wrap English in `{{ }}` |
| `words[]` | `word, pos, ipa, parts[{t, k: pre/root/suf, vi}], meaning, story, emoji, example, example_vi, related[{w,pos,vi}], trap?` |

`parts` must join to spell the word (the script warns if not). Keep `story` to one sentence
that starts from the literal parts and ends at the real meaning.
