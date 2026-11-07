# UpWind social content kit

One shared engine (voices, subtitles, animated emoji, UpWind frame, overflow checks) that turns data files into
videos, swipeable image posts ("ảnh cuộn") and handouts. Each content type is a **series** with its own data
file, script and doc; everything shared lives here and in `lib/`.

## Series

| series | makes | data | script | read first |
|---|---|---|---|---|
| **Học từ từ gốc** (word roots) | 9:16 videos, 4:5 carousels, A4 handbook | `data/families.json` | `make-video.mjs`, `make-carousel.mjs`, `make-handbook.mjs` | [`docs/goc-tu.md`](docs/goc-tu.md) |
| **Đoán từ · gốc từ** (5-word guessing game) | 9:16 videos, 4:5 carousels | `data/families.json` | `make-video.mjs --series quiz`, `make-carousel.mjs --series quiz` | [`docs/doan-tu.md`](docs/doan-tu.md) |
| **Nâng band câu này** (IELTS Writing) | 4:5 carousels, 9:16 videos | `data/upgrades.json` | `make-upgrade.mjs`, `make-video.mjs --series writing` | [`docs/nang-band.md`](docs/nang-band.md) |
| **Phim gốc từ** (illustrated cinematic cut, one root) | 9:16 video | `lib/film-scenes.mjs` (script in `scripts/rupt-veo.md`) | `make-video.mjs --series film rupt` | `lib/film-scenes.mjs` header |
| **Học Từ, Từ Gốc · Từ vựng IELTS từ gốc Latin** (ebook) | A4 PDF, 40 units | `data/families.json` + `data/ebook/` | `make-ebook.mjs` | [`docs/ebook.md`](docs/ebook.md) |

Ideas for the next series (nghĩa đen bất ngờ, âm thanh mang nghĩa, phrasal verbs, lỗi người Việt, shadowing…) are
listed in [`docs/goc-tu.md` §4](docs/goc-tu.md#4-ways-to-expand-the-method).

## Quick start (reproduces every approved output)

Order for every new piece of content: **carousel first** (check it), **then the video** from the same data.

```bash
cd tools/social-content
export VIENEU_API_KEY="vn_sk_..."         # vieneu.io → Developer. Never commit it, never paste it in files.
node make-video.mjs rupt                   # -> out/rupt/video.mp4 + caption.txt (V4 voice "Hải Đăng")
node make-carousel.mjs rupt                # -> out/carousel/rupt/01.png … 12.png + caption.txt
node make-upgrade.mjs all                  # -> out/carousel/upgrade-<set>/01.png … + caption.txt (every Writing set)
node make-video.mjs --series writing all  # -> out/writing-<set>/video.mp4 + caption.txt (every Writing set)
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

## Voices (shared by every video series)

| situation | voice | quality |
|---|---|---|
| `VIENEU_API_KEY` set (default) | **VieNeu V4 cloud, "Hải Đăng"** (V4 id "Minh Quân Pro") | best; English clearly better than local |
| no key | local VieNeu v3 Turbo, **"Hải Đăng"** (same name, local preset) | free; English sometimes off |
| `--en-tts auto` | local Vietnamese plus a separate English voice per word | exact English, two voices |
| `--one-voice` | Microsoft Emma Multilingual for both | perfect English, Vietnamese slightly accented |

- **Voice names:** `--voice` accepts the names shown in the vieneu.io web app; the tool resolves them to API ids. List V4 voices with
  `curl "https://api.vieneu.io/api/tts/voices"` and local ones with `python3 lib/vieneu_tts.py --voices`.
- **V4 cost:** one video is about 30 API calls and ~10,000 tokens. Clips are cached in `out/.tts-cache` per text and voice,
  so re-rendering after visual changes costs **nothing**. Change the narration and only the changed lines are re-generated.
- **House voice: "Hải Đăng" only**, cloud or local, so every video sounds the same. (An earlier test of local voices
  scored Mai Anh and Thiền Tâm Đức best for English; use `--voice` only for experiments, not for posted videos.)
  VieNeu v3 Turbo is the newest *open* model. V4 (the web app's model) is cloud-only.
- **V4 trial plan:** 50 API calls a day, reset at 00:00 Vietnam time; a video needs ~20–30. When the limit hits, the run
  stops and the last good video is kept. Unset the key to finish with the local "Hải Đăng".
- **Pauses:** narration is voiced one clause at a time (split at `. , ; : ! ?`), with a fixed pause after each mark:
  comma 0.4 s, `;`/`:` 0.55 s, `.`/`!` 0.7 s, `?` 0.75 s (before `--speed`). Short clips are read more clearly than long
  lines, and the pauses no longer depend on the model. Tune them in `PAUSE` in `make-video.mjs`.
- **Marking English:** wrap English in `{{ }}` in narration (in data, write it in “quotes”; the scripts turn quotes into
  `{{ }}`). The local VieNeu then reads each marked part as English phonemes, so short words that are also Vietnamese
  syllables (so, to, an, do, con) are not read the Vietnamese way. Plain quotes alone do nothing for the voice. The V4
  cloud API takes plain text, so the marks are stripped for it (its own English detection is already good).
- **Pace:** 1.1× for word-root videos, 1.0× for Writing videos (`--speed` overrides).
- **Narration rule:** an English word must start its own sentence ("{{eruption}} là danh từ…"). When a Vietnamese phrase
  runs straight into English ("… với {{convert}}"), VieNeu repeats its last word ("với với", "còn còn"). The
  renderer closes such phrases with a comma and prints a warning so you can rewrite the line.

## Call to action: the ebook offer (all series)

Every post ends with the same offer, defined once in `lib/offer.mjs` (`OFFER.keyword` = "GỐC TỪ"): the last carousel
slide and the last video scene show the ebook cover with "Bình luận GỐC TỪ", the narration says it, and the caption adds
two lines (UpWind sends the commenter the community link for the ebook and more documents). Change the keyword or the
wording there; the caption lines in `lib/common.mjs` (`OFFER_LINES`) must match.

## Before you render: lessons from mistakes (read every time)

Each of these went wrong once. The fixes are in the code; these notes keep them from coming back.

1. **Order:** script → carousel → **one** video → the teacher listens → the rest. For a new format, write the narration
   as a script first (`scripts/<id>.md`) and get it approved before building scenes. Never render a whole batch on
   untested changes.
2. **English must sound English.** Mark every English word or phrase (`{{ }}` in narration, “quotes” in data). The local
   voice then gets English phonemes for it (`lib/vieneu_tts.py`). Never pass phonemes to `Vieneu().infer()`: it only
   takes text and silently ignores unknown options (`skip_phonemize`), so the phonemes get phonemized again and every
   English line becomes noise. Phonemes go to `tts.engine.infer(phonemes=…)` (see `infer_phonemes`).
3. **Check the voice by ear and by machine.** After any change to the voice code, render one video and run
   `python3 lib/check_voice.py out/<id>/video.mp4:vi`. Every English sentence must come back readable. Do this before
   sending anything.
4. **Stale clips:** clips are cached by text. After changing how the local voice makes audio, bump `LOCAL_TTS_REV` in
   `make-video.mjs` (or old clips are reused). Don't delete the cloud cache: those clips cost API calls.
5. **Pauses** (approved by the teacher): one clip per clause, then comma 0.4 s, `;`/`:` 0.55 s, `.`/`!` 0.7 s,
   `?` 0.75 s. Don't shorten them; words run together.
6. **Pace:** Writing videos 1.0×, word-root videos 1.1×.
7. **Voice:** "Hải Đăng" only (V4 cloud with a key, local preset without). The V4 trial plan allows 50 calls a day;
   when it runs out, render with the local voice. Never write the key into a file.
8. **Environment:** in a fresh container, local VieNeu needs `pip install "onnxruntime==1.24.4" "huggingface_hub<1.0"`
   (see Setup). edge-tts needs the proxy CA (`SSL_CERT_FILE`). Don't rebase, rename or move this folder while a render
   is running: the running render loses `lib/vieneu_tts.py` and dies.

## Subtitles, audio and the frame (shared)

- **Subtitles** (`lib/subtitles.mjs`, ffmpeg/libass):
  - one light line at a time, broken by sentence and then by comma, never mid-word
  - the spoken word in orange
  - timed from each clip's length
  - Be Vietnam Pro 62 px, ink with a white outline, no box
- **Audio:** pace 1.1× (`--speed`); every clip loudness-matched to −17 LUFS; a soft synthesised pop per scene (`--no-sfx`).
- **Frame** (`lib/template.mjs`): the UpWind header (series label + chip), the wave footer, an orange progress bar in videos, and
  CSS animations captured frame by frame. The content area is 1230 px in videos; carousels are 1080×1350 (4:5) or 1080×1920 (`--size 9:16`).
- **Outputs** go to `out/` (gitignored). Builds use a scratch folder, so a failed run never deletes the last good output.

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
## Adding a new series

1. **Data:** `data/<series>.json`, one object per post. Keep English for the voice in `{{ }}` and follow the narration rule in *Voices*.
2. **Script:** `make-<series>.mjs`. Copy the closest existing script and reuse the shared modules; don't copy their code.

   | module | gives you |
   |---|---|
   | `lib/template.mjs` | `css()`, `wave()`, `header(…, { series, chip })`, `FONT_LINK`, `frameHtml()` |
   | `lib/icons.mjs` | `icon()`, `UI_ICONS` (Tabler) |
   | `lib/emoji.mjs` | `animEmoji()`, `lottieScripts()`, `ensureEmojiAssets()` |
   | `lib/subtitles.mjs` | `buildAss()`, `splitLines()`, `capitalizeSentences()` |
   | `lib/common.mjs` | `esc()`, `plain()`, `chunks()`, `highlight()`, `blank()`, `captionText()`, paths |
   | `make-video.mjs` | TTS (V4 / local, cache, loudness), frame capture, the subtitle pass; a new video series should add its scene builder next to `lib/scenes.mjs` and reuse this pipeline |

3. **Doc:** `docs/<series>.md` with format, production steps, the data prompt and series-specific rules. Add a row to the *Series* table above.
4. **QA:** zero overflow warnings, the *Visual rules* above, and one look at a contact sheet of every slide or scene before posting.
