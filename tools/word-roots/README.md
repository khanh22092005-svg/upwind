# UpWind “Học từ từ gốc” kit

Turns one data file into (1) animated vertical explainer videos for Reels, TikTok and Shorts,
(2) swipeable image posts ("ảnh cuộn") and (3) a printable study handbook.
Every root family in `data/families.json` becomes one video and one carousel.

Read `METHOD.md` for why the format works, how to scale it, and the prompt for writing new families.

## Setup (once)

```bash
pip install vieneu gTTS edge-tts   # Vietnamese voice (VieNeu-TTS) + English voice (edge-tts, gTTS fallback)
# ffmpeg + Node 18+ with Playwright (npm i -g playwright && npx playwright install chromium)
```

If VieNeu fails to load with "External data path ... escapes model directory", your onnxruntime is too
new for the Hugging Face cache layout. Run `pip install "onnxruntime==1.24.4" "huggingface_hub<1.0"`,
delete `~/.cache/huggingface/hub/blobs/??` and try again.

## Make a video

```bash
cd tools/word-roots
node make-video.mjs rupt                    # one family -> out/rupt/video.mp4
node make-video.mjs rupt,vert               # several
node make-video.mjs spect --max 4           # split into ~60 s parts: out/spect-p1, spect-p2
node make-video.mjs rupt --speed 1.3        # pace (default 1.2, pitch preserved)
node make-video.mjs rupt --voice "Hải Đăng" # VieNeu voice (list: python3 lib/vieneu_tts.py --voices)
node make-video.mjs rupt --en-tts gtts      # English voice: auto (edge-tts if reachable, else gTTS) | edge | gtts
node make-video.mjs rupt --one-voice        # ONE voice for both languages (Microsoft en-US-EmmaMultilingualNeural, needs internet)
node make-video.mjs rupt --one-voice en-US-AvaMultilingualNeural
node make-video.mjs rupt --tts none         # silent draft to check the visuals quickly
node make-video.mjs rupt --no-sfx           # no pop sounds
node make-video.mjs rupt --bgm lofi.mp3     # quiet background music (use music you own the rights to)
```

What a video contains, in order: **bait** (a surprising literal meaning, e.g. "bankrupt nghĩa đen là… cái
bàn bị đập gãy") → hook question + word wall + "challenge at the end" tease → root → for each word:
split / meaning / example → recap → quiz → **next-video teaser** ("Tập sau: gốc vert…") + follow prompt.
Every scene animates in (slams, fly-ins, parts snapping into the word, word-by-word sentences),
with a progress bar across the top.

**Voices.** Vietnamese narration is VieNeu-TTS. Everything inside `{{ }}` (English words, example
sentences, the brand name) is spoken by a separate English voice. VieNeu reads English inconsistently
(the same word can come out right in one scene and wrong in the next), so each English word is rendered
once and that same clip is reused everywhere: correct and identical every time.
All clips are cached in `out/.tts-cache`, so re-rendering after a visual tweak is fast.
Example sentences are read in English, then their Vietnamese translation. The last scene (next-video teaser)
is Vietnamese only. Every clip is measured (EBU R128) and gained to the same loudness, so the English and
Vietnamese voices sit at the same level.

`--one-voice` swaps both voices for a single Microsoft multilingual voice: same voice throughout and
perfect English, but the Vietnamese can sound slightly accented. Try it and compare with the default.

**Rule for narration text:** an English word should start its own sentence ("{{eruption}} là danh từ…").
If a Vietnamese phrase runs straight into English ("… với {{convert}}"), VieNeu tends to repeat its last word
("với với", "còn còn"). The renderer closes such phrases with a comma automatically and prints a warning
so you can rewrite the line.

Output folder: `video.mp4` (1080×1920, 30 fps), `caption.txt` (post text, next-video line,
**pinned comment** with the quiz answer), and one PNG per scene.

## Make a carousel (ảnh cuộn)

```bash
node make-carousel.mjs rupt                 # -> out/carousel/rupt/01.png … + caption.txt (1080×1350, 4:5)
node make-carousel.mjs rupt --size 9:16     # 1080×1920 for TikTok photo mode
node make-carousel.mjs spect --max 4        # split big families (FB/IG cap a post at 10–20 images)
```

Slides: bait cover with "Lướt để xem →" → hook + word wall → root → one card per word (parts,
meaning, story, example, related forms) → recap → quiz → next-family teaser. The script warns if any
slide's text overflows.

## Emoji and icons

Big visuals are [Noto animated emoji](https://googlefonts.github.io/noto-emoji-animation/) (Google, CC BY 4.0),
played with lottie-web. Each family and word has an `anim` codepoint in the data (pick from that site; not every emoji
is animated). In videos the emoji keeps animating for the whole scene; carousels show its rest pose.
Small UI glyphs (tags, "bình luận", "theo dõi") are [Tabler Icons](https://tabler.io/icons) (MIT).

Assets are downloaded on demand into `assets/` (the emoji are not committed). After adding families or changing
`anim` / `icon` values, run:

```bash
node fetch-assets.mjs
```

Credit for posts (CC BY 4.0 asks for attribution): "Emoji: Google Noto Emoji Animation (CC BY 4.0)".

## Make the handbook

```bash
node make-handbook.mjs                      # -> out/handbook/upwind-goc-tu.pdf (+ .html)
```

## Add a family

Copy any object in `data/families.json`, or generate one with the prompt in `METHOD.md`.

| field | what |
|---|---|
| `id` | short slug, used for the folder name and the CLI |
| `root`, `origin`, `core` | `"voc / voke"`, `"Latin vocare"`, `"gọi, cất tiếng"` |
| `say_root` | optional: how the English voice should say the root (`"voke"` reads better than `"voc"`) |
| `anim`, `image` | Noto animated emoji codepoint and the one picture every word in the family hangs on (`emoji`/`icon` are fallbacks) |
| `hook` | opening question; wrap English in `{{ }}` |
| `bait` | `{word, literal, say}`: the surprising literal meaning that opens the video and the carousel |
| `next` | optional id of the family to tease at the end; default is the next one in the file |
| `words[]` | `word, pos, ipa, parts[{t, k: pre/root/suf, vi}], meaning, story, anim, example, example_vi, related[{w,pos,vi}], trap?` |

`parts` must join to spell the word (the script warns if not). Keep `story` to one sentence
that starts from the literal parts and ends at the real meaning. The family order in the file is the
posting order, since each video teases the next one.
