# The word-root video method: teardown, our version, and how to scale it

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

- **Movie clips** are copyrighted and can get the page struck or muted. Our version uses written IELTS-style example sentences voiced by an English TTS voice.
- **Re-uploading Douyin videos** is someone else's content, and the Chinese labels don't help Vietnamese learners.
- **3.5 minutes, landscape.** Reels, TikTok and Shorts reward vertical videos of about 45–90 s. Split long families into parts (`--max 4`).
- **Word overload.** Rare words (convoke, vociferous) dilute the payoff. We keep words an IELTS 6.0–7.5 learner will actually meet.

## 2. Our format (what `make-video.mjs` produces)

`Bait → Hook (+ challenge tease) → Root card → [Split → Meaning → Example] × N → Recap → Quiz → Next-video teaser`, 1080×1920, 1.2× pace,
every scene animated in, a progress bar across the top, Vietnamese captions burned in
(most people watch muted), UpWind branding, and the same orange/blue/green colour code.
Additions to the reference:

- **Bait opener (first 2–3 s).** A true but surprising literal meaning (“bankrupt nghĩa đen là… cái bàn bị đập gãy”) stops the scroll before the hook question.
- **Open loop.** The hook promises “cuối video có thử thách”, which keeps people to the end.
- **Next-video teaser.** The last scene names tomorrow's root and three of its words (“Tập sau: gốc vert…”) and asks for the follow. Post the families in file order so the promise is kept.
- **Correct English every time.** English is voiced by a separate English voice, rendered once per word and reused.
- The **quiz** and the **pinned-comment answer**. The quiz asks viewers to comment A, B or C,
and the answer lives only in the pinned comment (`caption.txt`), which turns watchers into commenters.
Comments are the strongest ranking signal on Facebook and TikTok.

## 3. Production line (about 15 minutes per video once set up)

1. **Write the data.** Paste the prompt in §6 into Claude or ChatGPT with a root (e.g. `graph/gram`). Paste the JSON into `data/families.json`.
2. **Fact-check (5 min).** IPA, part of speech, and whether the example sounds natural. Etymology stories may simplify, but they must not be false.
   Drop any word a 6.5 student wouldn't need.
3. **Draft render:** `node make-video.mjs graph --tts none`. Skim the PNGs for text overflow.
4. **Final render:** `node make-video.mjs graph --tts edge` (or gTTS).
5. **Post** with `caption.txt`, then pin the answer comment right away.
6. **Carousel the same day**: `node make-carousel.mjs <id>` gives a 12-slide 4:5 “ảnh cuộn” post (bait cover → word cards → recap → quiz → next-family teaser). Post it a few hours after the video, or on Instagram while the video goes to TikTok.

Batch it: write 5 families on Sunday, render overnight with `node make-video.mjs a,b,c,d,e`, and schedule one per day.

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
  "emoji": "<one emoji>", "image": "<Vietnamese: one concrete scene that shows the core meaning>",
  "hook": "<Vietnamese curiosity question naming 3 familiar words wrapped in {{ }}>",
  "bait": {"word": "<one word of the family>", "literal": "<its surprising literal meaning, Vietnamese, max 6 words>",
           "say": "<Vietnamese line: {{Word}} nghĩa đen là... <literal>!>"},
  "words": [ 6-8 items:
    { "word": "", "pos": "n. | v. | adj. | v. / n.", "ipa": "<British IPA>",
      "parts": [{"t": "<letters exactly as in the word>", "k": "pre|root|suf", "vi": "<Vietnamese meaning>"}],
      "meaning": "<Vietnamese, short>",
      "story": "<Vietnamese, ONE sentence: literal parts -> picture -> real meaning, no 'tưởng tượng' prefix>",
      "emoji": "", "example": "<natural IELTS-style English sentence, max 14 words>",
      "example_vi": "<Vietnamese translation>",
      "related": [{"w": "", "pos": "", "vi": ""}],  // 0-2 useful derived forms
      "trap": "<optional Vietnamese warning, English words in {{ }}>" } ]
}
Rules: words must be common in IELTS Reading/Writing; parts must concatenate to the word;
etymology may be simplified but never invented (this includes the bait); no movie quotes; Vietnamese must sound natural.
```
