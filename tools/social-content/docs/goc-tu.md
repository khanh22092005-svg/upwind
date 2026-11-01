# Series: Học từ từ gốc (word roots)


Shared setup, voices, subtitles and visual rules are in the [README](../README.md).

## Commands

### Videos: `make-video.mjs`

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

### Carousels: `make-carousel.mjs`

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

### Handbook: `make-handbook.mjs`

The handbook (A4 PDF) contains the method, prefix and suffix tables, one page per family, exercises with a word bank, and an answer key.

### Add a word-root family

Copy an object in `data/families.json`, or generate one with the prompt in §6 below, then run `node fetch-assets.mjs`.

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


## 1. Teardown of the reference reel

Source: “Gốc từ VOKE” by Chợ Ngôn Ngữ (Facebook reel 1550734343408161), 3:32, landscape, about 32K views.
Facebook would not list the page's other reels without a login, but this one shows the whole format.
The frames carry a Douyin watermark (多推) and Chinese labels (叫喊, 向外...), so the reel is a
Chinese Douyin video re-voiced in Vietnamese. The page's other reels are almost certainly the same template with a different root.

**Script structure (timestamps from the transcript):**

| time | beat | what it does |
|---|---|---|
| 0:00 | **Hook question** | “Why do evoke, invoke and provoke all mean ‘cause’, yet are used completely differently?” It opens a curiosity gap with words the viewer half-knows. |
| 0:05 | **Promise + word wall** | “Learn the root and prefixes and you learn all these words at once.” About 20 words on screen show how much you'll get. |
| 0:10 | **Root + one image** | voc/voke = Latin *vocare*, “to call”, shown as a character calling out. That one image carries the whole video. |
| 0:20 | **Per-word loop ×10** | prefix meaning → *“hãy tưởng tượng...”* (picture this) → real meaning → derived forms → 1–2 movie clips using the word. |
| 3:20 | **Recap table** | All words + meanings on one screen (made to be screenshotted). |
| 3:30 | **CTA** | “Follow for more roots.” |

**Why it works**

1. *Curiosity gap with familiar words.* Viewers know **provoke**, so they want to know how it relates to **evoke**.
2. *One anchor image per root.* Every word becomes “the caller + a direction”, so memory piggybacks on one scene.
3. *Fixed formula.* Prefix → picture → meaning → example repeats ten times. Viewers learn the rhythm and keep watching.
4. *Colour coding.* Prefix in orange, root in blue. The brain separates the parts before the narration explains them.
5. *Proof of use.* Movie clips show the word in real speech.
6. *Saveable recap.* The table at the end earns saves, and saves push distribution.

**What to avoid copying**

- **Movie clips** are copyrighted and can get the page struck or muted. Our version uses written IELTS-style example sentences read by the same narrator (English, then the Vietnamese translation).
- **Re-uploading Douyin videos** is someone else's content, and the Chinese labels don't help Vietnamese learners.
- **3.5 minutes, landscape.** Reels, TikTok and Shorts reward vertical videos of about 45–90 s. Split long families into parts (`--max 4`).
- **Word overload.** Rare words (convoke, vociferous) dilute the payoff. We keep words an IELTS 6.0–7.5 learner will actually meet.

## 2. Our format (what `make-video.mjs` produces)

`Bait → Hook (1 gốc = N từ + challenge tease) → Root card → [Split → Meaning → Example] × N → Recap → Quiz → Next-video teaser`.

- **Frame:** 1080×1920 at **1.1×** pace, every scene animated in, animated Noto emoji, and a progress bar across the top.
- **Subtitles:** one light line at a time, burned in, with the spoken word in orange. Most people watch muted.
- **Branding:** UpWind header ("Học từ từ gốc"), and the orange prefix / blue root / green suffix colour code.

Additions to the reference:

- **Bait opener (first 3 s).** "ÍT AI BIẾT: *bankrupt* nghĩa đen là… **cái bàn bị gãy**". A true, surprising literal meaning stops the scroll.
- **Concrete promise.** "1 gốc *rupt* = **13 từ**". N counts every form on screen (main words plus related forms), so the number is honest.
- **Open loop.** "Xem hết: thử thách cuối video" keeps people to the end.
- **Next-video teaser.** The last scene names tomorrow's root and its words and asks for the follow (Vietnamese narration only). Post families in file order so the promise is kept.
- **One natural voice.** VieNeu V4 "Hải Đăng" reads both Vietnamese and English. Each line is read in one pass, so there's no stitching, and all clips are loudness-matched.
- **Quiz with the answer in the pinned comment.** It turns watchers into commenters, and comments are the strongest ranking signal on Facebook and TikTok.

## 3. Production line (about 15 minutes per video once set up)

1. **Write the data.** Paste the prompt in §6 into Claude or ChatGPT with a root (e.g. `graph/gram`), then add the JSON to `data/families.json`.
   Pick `anim` codes from googlefonts.github.io/noto-emoji-animation and run `node fetch-assets.mjs`.
2. **Fact-check (5 min).** Check the IPA, the part of speech, and that the example sounds natural. Etymology (and the bait) may simplify but must never be false.
   Drop any word a 6.5 student wouldn't need.
3. **Draft:** `node make-video.mjs graph --tts none` (no API cost). Skim `out/graph/s*.png` and fix any "overflows" warning.
4. **Final:** with `VIENEU_API_KEY` set, run `node make-video.mjs graph`. That's about 30 API calls; later re-renders are free thanks to the cache.
   Watch it once, listening for mispronounced English or repeated words.
5. **Carousel:** `node make-carousel.mjs graph`. Post it a few hours after the video, or on Instagram while the video goes to TikTok.
6. **Post** with `caption.txt`, then pin the answer comment right away. Add the Noto emoji credit.
7. **Hand-off:** `cd out && zip -r graph.zip graph carousel/graph`. Outputs are never committed.

Batch it: write 5 families on Sunday, render with `node make-video.mjs a,b,c,d,e`, and schedule one per day.

## 4. Ways to expand the method

**More series on the same engine**, mostly by changing data rather than code:

| series | hook pattern | example |
|---|---|---|
| Gốc từ (root) | “Why do X, Y, Z all contain ‘voke’?” | spect, dict, port... |
| Tiền tố (prefix) | “One letter that flips the meaning: re-” | re-, dis-, mis-, over-, under- across many roots |
| Hậu tố & word form | “Is it *economic* or *economical*?” | -ic/-ical, -able/-ible, -ive/-ory, built for IELTS word-form questions |
| Cặp bẫy (false friends) | “vocation ≠ vacation” | affect/effect, adapt/adopt, principal/principle |
| Từ theo chủ đề IELTS | “10 environment words you can decode yourself” | emission, sustainable, deforestation, all decoded by root |
| Giải mã bài Reading | “Use roots to guess 5 words in this Cambridge passage” | turns the method into an exam skill and points to UpWind's Reading course |

**Beyond word roots** (ideas from the planning session; ★ = built)

| area | series | format |
|---|---|---|
| Vocabulary | **Nghĩa đen bất ngờ** | one word with a surprising true origin: disaster = "ngôi sao xấu", muscle = "chú chuột nhỏ", companion = "người cùng ăn bánh mì", sarcasm = "xé thịt", quarantine = "40 ngày". 30–45 s. |
| Vocabulary | **Âm thanh mang nghĩa** | gl- = ánh sáng (glow, glitter, glare), sn- = mũi (sniff, sneeze, snore), fl- = nhanh (flash, flicker, flutter). Same template as roots. |
| Vocabulary | **Phrasal verb theo tiểu từ** | up = hoàn toàn (eat up, use up), out = ra ngoài / biến mất (run out, wipe out), off = tách ra / dừng (call off, put off). |
| Vocabulary | **Từ con lai / cặp dễ nhầm** | brunch, smog, staycation as a flip-reveal quiz; affect/effect, economic/economical on a split screen. |
| Grammar | **Lỗi người Việt hay mắc** | wrong sentence struck out in red, then the right one, plus one-line reason: *I very like*, *Although… but*, *discuss about*, *explain me*. |
| Grammar | **Thì trên trục thời gian** | present perfect as an arrow from the past touching "now"; in/on/at as box, surface, point. |
| Writing | **Nâng band câu này ★** | `make-upgrade.mjs`: band 5 → 6 → 7 with every upgrade explained. |
| Speaking | **Shadowing** | V4 reads a model Part 1 answer, karaoke subtitles, then a 3 s "đến lượt bạn". |
| Listening | **Bạn nghe ra không?** | minimal pairs (thirteen/thirty, ship/sheep) and Section 1 spelling and number traps, with a countdown before the reveal. |
| Reading | **Săn paraphrase** | question and passage side by side; find *ancient ↔ old* in 5 s. |
| Practice | **Thử thách 7 ngày, phiếu bài tập, mini game** | daily quiz with streak boxes; worksheet carousels with answers on the last slide; a flashcard game on upwind.asia built from `families.json`. |

**Format variants**

- **Part 1 / Part 2**: use `--max 4` so one family becomes 2–3 short videos. More posts per family, and Part 1 drives follows for Part 2.
- **Duet challenge**: show only the split card for 3 seconds and ask “guess the meaning before the reveal”.
- **Daily 15-second root**: hook, root card, one word, quiz. Very cheap; good for testing which roots perform.
- **Live or class use**: the scene PNGs double as slides; the handbook pages work as homework.

**Funnel to UpWind**

- Lead magnet: “Comment GỐC TỪ to get the 23-page PDF” (`make-handbook.mjs`). Collect the leads through Messenger or Zalo.
- Each handbook family ends with a review tracker for days 1, 3, 7, 14 and 30. Offer a free 7-day “one root a day” Zalo group that leads into the IELTS course.
- Add the UpWind link to the pinned comment after the answer, not before.

**Measure.** Track 3-second hold, average watch time, saves and comments per video in a sheet. Keep the top 20% of hooks and re-use their pattern.
Roots with words that viewers already know (port, dict, spect) usually beat rare ones.

## 5. Root backlog (next 40)

graph/gram (write), scrib/script (write), aud (hear), vid/vis (see), log/logy (word/study), bio (life), geo (earth),
chron (time), phon (sound), path (feel), fer (carry), pos/pon (put), cap/cept (take), sens/sent (feel), struct (build),
form (shape), fact/fect (make), gen (birth), mov/mot (move), press (press), pel/puls (push), sist/stat (stand),
sequ/secu (follow), cur/curs (run), flu (flow), grad/gress (step), jud (judge), leg/lect (choose/read), loc (place),
man/manu (hand), mort (death), nov (new), ped/pod (foot), plic/ply (fold), quer/quest (ask), solv/solu (loosen),
tend/tens (stretch), vent (come), volv (roll), clud/clus (close).

## 6. Prompt for generating a new family

```
You are writing data for an English word-root video for Vietnamese IELTS learners (band 5.5–7.5).
Root: <ROOT, e.g. "graph / gram">

Return ONE JSON object (no prose) with this shape:
{
  "id": "<slug>", "root": "<root forms>", "say_root": "<how an English voice should say it, optional>",
  "origin": "<Latin/Greek source word>", "core": "<Vietnamese core meaning, 2-4 words>",
  "emoji": "<one emoji>", "anim": "<codepoint of a Noto ANIMATED emoji, e.g. 1f30b; see googlefonts.github.io/noto-emoji-animation>",
  "image": "<Vietnamese: one concrete scene that shows the core meaning>",
  "hook": "<Vietnamese curiosity question naming 3 familiar words wrapped in {{ }}>",
  "bait": {"word": "<one word of the family>", "literal": "<its surprising literal meaning, Vietnamese, max 6 words>",
           "say": "<Vietnamese: {{Word}}, <real meaning>, nghĩa đen là... <literal>!>"},
  "words": [ 6-8 items:
    { "word": "", "pos": "n. | v. | adj. | v. / n.", "ipa": "<British IPA>",
      "parts": [{"t": "<letters exactly as in the word>", "k": "pre|root|suf", "vi": "<Vietnamese meaning>"}],
      "meaning": "<Vietnamese, short>",
      "story": "<Vietnamese, ONE sentence: literal parts -> picture -> real meaning, no 'tưởng tượng' prefix>",
      "emoji": "", "anim": "<Noto animated emoji codepoint>", "example": "<natural IELTS-style English sentence, max 14 words>",
      "example_vi": "<Vietnamese translation>",
      "related": [{"w": "", "pos": "", "vi": ""}],  // 0-2 useful derived forms
      "trap": "<optional Vietnamese warning, English words in {{ }}>" } ]
}
Rules: words must be common in IELTS Reading/Writing; parts must concatenate to the word;
etymology may be simplified but never invented (this includes the bait); no movie quotes; Vietnamese must sound natural;
in every Vietnamese line, an English word wrapped in {{ }} must START its sentence or follow a comma — never end a
phrase like "… với {{word}}" or "Còn {{word}}" (the voice repeats the dangling word).
```

## 7. Writing content

“Nâng band câu này” and any other Writing content follow [`nang-band.md`](nang-band.md).
