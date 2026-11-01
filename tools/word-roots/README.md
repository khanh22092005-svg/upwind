# UpWind social content kit: “Học từ từ gốc” + “Nâng band câu này”

Turns data files into:

1. **Animated vertical videos** (Reels / TikTok / Shorts), one per word-root family
2. **Swipeable image posts** (“ảnh cuộn”), one per family
3. **IELTS Writing carousels** (“Nâng band câu này”), one per sentence set
4. A printable **study handbook** (PDF)

Read `METHOD.md` for why the formats work, the production routine, ideas for new series, and the prompts that
write new data.

## Quick start (reproduces the approved rupt video, carousels and handbook)

```bash
cd tools/word-roots
export VIENEU_API_KEY="vn_sk_..."         # vieneu.io → Developer. Never commit it, never paste it in files.
node make-video.mjs rupt                   # -> out/rupt/video.mp4 + caption.txt (V4 voice "Hải Đăng")
node make-carousel.mjs rupt                # -> out/carousel/rupt/01.png … 12.png + caption.txt
node make-upgrade.mjs all                  # -> out/carousel/upgrade-<set>/01.png … + caption.txt (every Writing set)
node make-handbook.mjs                     # -> out/handbook/upwind-goc-tu.pdf
```

Everything lands in `out/`, which is **gitignored**: outputs never go into the repo. To hand them over, zip a folder:

```bash
cd out && zip -r upwind-rupt.zip rupt carousel/rupt
```

Re-running a family replaces only that family's output. Video builds go to a scratch folder first, so a failed
run never deletes the last good video.

## Setup (once per machine)

- **Node 18+ with Playwright and Chromium:** `npm i -g playwright && npx playwright install chromium`
- **ffmpeg built with libass**, for the burned-in subtitles. Check with `ffmpeg -filters | grep subtitles`.
- **Python voice packages:** `pip install vieneu gTTS edge-tts`. `vieneu` is the free local voice; the others are optional English voices.
- **Assets:** `node fetch-assets.mjs` downloads the Noto animated emoji, the lottie player, the Tabler icons and the
  Be Vietnam Pro fonts. The video and carousel scripts run it automatically when something is missing.
- **If local VieNeu fails** with "External data path ... escapes model directory", run
  `pip install "onnxruntime==1.24.4" "huggingface_hub<1.0"`, delete `~/.cache/huggingface/hub/blobs/??` and retry.

## Videos: `make-video.mjs`

```bash
node make-video.mjs rupt                    # one family
node make-video.mjs rupt,vert               # several
node make-video.mjs spect --max 4           # split into ~60 s parts: out/spect-p1, spect-p2
node make-video.mjs rupt --voice "Thiền Tâm Đức"  # another voice (V4 or local, depending on the key)
node make-video.mjs rupt --speed 1.2        # pace (default 1.1, pitch preserved)
node make-video.mjs rupt --audio-only       # narration MP3 only, to compare voices/models fast
node make-video.mjs rupt --tts none         # silent draft to check visuals (no TTS at all)
node make-video.mjs rupt --tts vieneu       # force the free local model even if a key is set
node make-video.mjs rupt --en-tts auto      # separate English voice (edge-tts, else gTTS) instead of one voice
node make-video.mjs rupt --one-voice        # one Microsoft multilingual voice for both languages (needs internet)
node make-video.mjs rupt --no-sfx           # no pop sounds
node make-video.mjs rupt --bgm lofi.mp3     # quiet background music (use music you own the rights to)
```

**Scene order:**
1. **Bait.** "ÍT AI BIẾT: *bankrupt* nghĩa đen là… cái bàn bị gãy" plus an animated emoji.
2. **Hook.** "1 gốc *rupt* = 13 từ" (N counts every form shown: main words plus related forms), the hook question, the full word wall, and the tease "Xem hết: thử thách cuối video".
3. **Root card.**
4. **For each word:** parts split, then the parts snapping into the word with its meaning, then an example (read in English, then Vietnamese).
5. **Recap table** of the main words.
6. **Quiz.** A/B/C, with the answer in the pinned comment.
7. **Next-video teaser.** Vietnamese only: "Tập sau: gốc … = …" plus "Theo dõi UpWind / mỗi ngày 1 họ từ".

**Look:**
- Every scene animates in. Animated emoji keep moving for the whole scene.
- An orange progress bar runs across the top.
- **Subtitles** (`lib/subtitles.mjs`, ffmpeg/libass):
  - one line at a time, never splitting a word, breaking by sentence and then by comma
  - the word being spoken in orange
  - timed from each spoken clip's length (close, not frame-perfect)
  - Be Vietnam Pro 62 px, ink with a white outline, no box
- **Layout:** content area 1230 px high, scenes scaled ×1.07. The hook is not scaled, so its 13 chips fit.
- **Audio:** pace 1.1×. Every clip is loudness-matched to −17 LUFS, with a soft synthesised pop on each scene.

**Output:** `video.mp4` (1080×1920, 30 fps), `caption.txt` (post text, the next-video line, the **pinned comment**
with the quiz answer), and one PNG per scene.

### Voices

| situation | voice | quality |
|---|---|---|
| `VIENEU_API_KEY` set (default) | **VieNeu V4 cloud, "Hải Đăng"** (V4 id "Minh Quân Pro") | best; English clearly better than local |
| no key | local VieNeu v3 Turbo, "Mai Anh" | free; English sometimes off |
| `--en-tts auto` | local Vietnamese plus a separate English voice per word | exact English, two voices |
| `--one-voice` | Microsoft Emma Multilingual for both | perfect English, Vietnamese slightly accented |

- **Voice names:** `--voice` accepts the names shown in the vieneu.io web app; the tool resolves them to API ids. List V4 voices with
  `curl "https://api.vieneu.io/api/tts/voices"` and local ones with `python3 lib/vieneu_tts.py --voices`.
- **V4 cost:** one video is about 30 API calls and ~10,000 tokens. Clips are cached in `out/.tts-cache` per text and voice,
  so re-rendering after visual changes costs **nothing**. Change the narration and only the changed lines are re-generated.
- **Local voice choice:** in our test of the 10 recommended local voices, Mai Anh and Thiền Tâm Đức read English best (0.85);
  Ngọc Huyền scored 0.69. VieNeu v3 Turbo is the newest *open* model. V4 (the web app's model) is cloud-only.
- **Narration rule:** an English word must start its own sentence ("{{eruption}} là danh từ…"). When a Vietnamese phrase
  runs straight into English ("… với {{convert}}"), VieNeu repeats its last word ("với với", "còn còn"). The
  renderer closes such phrases with a comma and prints a warning so you can rewrite the line.

## Carousels: `make-carousel.mjs`

```bash
node make-carousel.mjs rupt                 # 1080×1350 (4:5) for Facebook / Instagram
node make-carousel.mjs rupt --size 9:16     # 1080×1920 for TikTok photo mode
node make-carousel.mjs spect --max 4        # split big families (FB/IG cap a post at 10–20 images)
```

**Slides:**
1. Bait cover, with the button "Lướt để biết vì sao".
2. "1 gốc *rupt* = 13 từ" with the whole word wall, and the button "Cùng học nào".
3. Root card.
4. One card per word: parts, meaning, story, example, related forms, and the emoji at rest.
5. Recap.
6. Quiz.
7. Next-family teaser.

The script must print **no** "overflows" warnings.

## “Nâng band câu này”: `make-upgrade.mjs`

One weak sentence upgraded from band 5 to 6 to 7, every upgrade highlighted and explained, plus a toolkit, a practice sentence
(model answers in the pinned comment) and a follow slide. 8 slides.

```bash
node make-upgrade.mjs tech-children         # 4:5
node make-upgrade.mjs tech-children --size 9:16
```

**Before writing a new set, read [`WRITING-BANDS.md`](WRITING-BANDS.md).** It turns the teacher's grading rules
(the same TR/CC/LX/GR tags, band anchors, natural-before-fancy, Vietnamese-learner error bank) into a checklist
and a drafting prompt. Sets so far: `tech-children`, `because-so`, `comma-splice`, `learn-knowledge`.

**Data** lives in `data/upgrades.json`:
- `levels[]`: each has a `band`, a `text` with `[[upgrade]]` and `{{weak spot}}` markup, and either `problems[]` (band 5) or `moves[]` (phrase, label, criterion TR/CC/LX/GR, one or two per item; LR/GRA still work as aliases, why). Band-5 problems are tagged too.
- `toolkit[]`
- `practice {sentence, answer6, answer7}`

IELTS bands apply to whole essays, so slide 1 and the caption call these "câu kiểu band 5/6/7". The drafting prompt for new sets is in `WRITING-BANDS.md`.

## Handbook: `make-handbook.mjs`

The handbook (A4 PDF) contains the method, prefix and suffix tables, one page per family, exercises with a word bank, and an answer key.

## Add a word-root family

Copy an object in `data/families.json`, or generate one with the prompt in `METHOD.md` §6, then run `node fetch-assets.mjs`.

| field | what |
|---|---|
| `id` | short slug for folder names and the CLI |
| `root`, `origin`, `core` | `"voc / voke"`, `"Latin vocare"`, `"gọi, cất tiếng"` |
| `say_root` | optional: how the voice should say the root (`"voke"` reads better than `"voc"`) |
| `anim` | Noto **animated** emoji codepoint (googlefonts.github.io/noto-emoji-animation); `emoji` / `icon` are fallbacks |
| `image` | the one picture every word in the family hangs on |
| `hook` | question naming 3 familiar words, English in `{{ }}` |
| `bait` | `{word, literal, say}`: e.g. `literal: "cái bàn bị gãy"`, `say: "{{Bankrupt}}, phá sản, nghĩa đen là... cái bàn bị gãy!"` |
| `next` | optional id of the family to tease at the end (default: next in file) |
| `words[]` | `word, pos, ipa, parts[{t, k: pre/root/suf, vi}], meaning, story, anim, example, example_vi, related[{w,pos,vi}], trap?` |

`parts` must join to spell the word (the script warns if not). The family order in the file is the posting order,
since each video teases the next one.

## Visual rules (keep these; each one fixed a real problem)

- **Stamped labels** ("ÍT AI BIẾT", "TẬP SAU", "Thử thách") animate in but **land straight**, with no leftover tilt.
- **Long text** uses balanced line breaks (`text-wrap: balance`), so no word is left alone on a line ("đảo / lộn").
- **Recap rows** share one grid (`subgrid`), so the word, part-of-speech and meaning columns line up.
- **Example quotes** are glued to the first and last word, so a lone `”` never wraps onto its own line. Examples are centred.
- **Emoji:** carousel emoji are frozen near the end of their loop, in the full pose (`freezeAt`); frame 0 is sometimes blank.
- **Last scene:** no second logo (the header already has it), and its narration is Vietnamese only.
- **Counts:** every count shown ("13 từ") includes all forms on screen.
- **Overflow:** both scripts check overflow on the settled layout; ship only with zero warnings.
- **Subtitles:** one line, light; never bring back the dark caption box.
- **Credit:** Noto emoji are CC BY 4.0. Add "Emoji: Google Noto Emoji Animation (CC BY 4.0)" when posting.
- **Palette** (brand-adjacent, not the website's exact set): deep blue #004b9b, sky #6ac5e8, orange #f2711c for
  prefixes and highlights, green #1a9c5b for suffixes, yellow #ffd166 / #fff3b0 for highlights.

## Assets and licences

| path | what | licence | in git? |
|---|---|---|---|
| `assets/emoji/*.json` | Noto animated emoji | CC BY 4.0 | no (downloaded) |
| `assets/icons/*.svg` | Tabler icons in use | MIT | yes |
| `assets/vendor/lottie_svg.min.js` | lottie-web player | MIT | yes |
| `assets/fonts/*.ttf` | Be Vietnam Pro, for subtitles | SIL OFL | yes |
