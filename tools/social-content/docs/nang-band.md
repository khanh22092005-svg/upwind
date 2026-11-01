# Series: Nâng band câu này (IELTS Writing), start here

Every piece of IELTS Writing content ("Nâng band câu này" carousels, Writing slides, handouts) is built
from the same rules the teacher uses to **grade** students' essays (the `ielts-writing-grader` skill).
That way a post on Facebook says the same thing as a comment in a student's doc.
Read this file before writing a new set in `data/upgrades.json`.


Shared setup and visual rules are in the [README](../README.md). Sets so far: `tech-children`, `because-so`, `comma-splice`, `learn-knowledge`.

## Render: `make-upgrade.mjs`

One weak sentence upgraded from band 5 to 6 to 7, every upgrade highlighted and explained, plus a toolkit, a practice sentence
(model answers in the pinned comment) and a follow slide. 8 slides.

```bash
node make-upgrade.mjs tech-children         # 4:5
node make-upgrade.mjs tech-children --size 9:16
```

**Data** lives in `data/upgrades.json`:
- `levels[]`: each has a `band`, a `text` with `[[upgrade]]` and `{{weak spot}}` markup, and either `problems[]` (band 5) or `moves[]` (phrase, label, criterion TR/CC/LX/GR, one or two per item; LR/GRA still work as aliases, why). Band-5 problems are tagged too.
- `toolkit[]`
- `practice {sentence, answer6, answer7}`

## Render the video: `make-video.mjs --series writing`

The same set as a vertical 9:16 video, using the shared video engine (voice, animations, highlighted subtitles, progress bar).
Every `make-video.mjs` option works.

```bash
node make-video.mjs --series writing because-so            # -> out/writing-because-so/video.mp4 + caption.txt + scene PNGs
node make-video.mjs --series writing because-so --tts none # silent draft to check the layout
```

Scenes: hook (band 5 sentence, stamped 5.0) → one scene per problem → band 6 sentence → one scene per upgrade →
band 7 the same way → save-this ladder → your turn (comment challenge) → next set teaser + follow. The phrase being
explained lights up in the sentence. Post the sets in file order so the "Tập sau" teaser is kept. The narration is
built from the data, so the rules for `why` in §5 matter. Code: `lib/upgrade.mjs` (shared with the carousel) and
`lib/upgrade-scenes.mjs`.

IELTS bands apply to whole essays, so slide 1 and the caption call these "câu kiểu band 5/6/7". The drafting prompt is §7 below.


## 1. The four tags (same as the grading comments)

| tag | criterion | use it for |
|---|---|---|
| **TR** | Task Response | answering the prompt, position, developing an idea, examples, over-generalising |
| **CC** | Coherence & Cohesion | linkers, referencing (it/this/they), one idea per sentence, topic sentences |
| **LX** | Lexical Resource | word choice, collocation, word form, spelling, register, natural phrasing |
| **GR** | Grammatical Range & Accuracy | tense, agreement, articles, plurals, sentence structure, comma splices, punctuation |

In the data, `criterion` is one tag (`"LX"`) or at most two (`["LX", "GR"]`, main one first).
`LR` and `GRA` still work as aliases, but write `LX` and `GR` in new sets.
Tag **every** `problems[]` item on the band-5 sentence as well as every `moves[]` item.

## 2. What a "band 5 / 6 / 7 sentence" means

IELTS gives bands to a whole essay, so the slides and caption always say these are *sentences typical of*
band 5/6/7 (the generator prints that note for you). Set the levels from the May 2023 descriptors:

| band | LX | GR | CC |
|---|---|---|---|
| **5** | limited, repetitive or vague words ("many", "very bad", "good"); noticeable word-form or collocation errors | simple sentences; complex ones attempted but faulty; frequent errors | over-used or wrong linkers ("Because… so…", "and it…") |
| **6** | adequate range; tries less common words, maybe slightly off | mix of simple and complex forms, errors rarely get in the way | linkers work but can be mechanical |
| **7** | some less common items **with good collocation and the right register**; occasional slips only | a variety of complex structures, mostly error-free | ideas flow; reference words and linkers used flexibly |

**The band 5 sentence must look like a real student wrote it.** Build it from §4, or better, from the
"Phần 3: Diễn đạt tự nhiên hơn" pairs in essays the teacher has actually graded.
It can contain real errors (agreement, comma splice) as well as weak words.

## 3. Natural before fancy (the grader's top priority)

- **Keep the student's idea.** Band 6 and 7 change the *expression*, not the argument. Don't add new claims
  (e.g. "…and public health") that the band 5 sentence never made.
- **Each step is about one band up.** Band 6 fixes the errors and the vague words; band 7 adds precision and
  structure. It is not a pile of rare words.
- **Would a fluent writer say it?** No forced idioms, no memorised templates, no "plethora of". If a plain
  word is correct and natural, it stays.
- **One idea per sentence.** A band 7 sentence is tighter, not longer for the sake of it (aim for ≤ 30 words).
- **Hedge absolute claims** ("all", "always", "the best") because over-generalising costs TR.

## 4. Error bank (common mistakes Vietnamese learners make, from the grader)

Pick one to three per set; each set teaches a different one.

- **GR**: comma splices and run-ons · "Because…, so…" / "Although…, but…" · missing subject or verb ·
  agreement (gerund subject + V-s, "people is") · uncountable nouns ("many knowledge", "a lot of times") ·
  articles and plural -s · contractions ("don't") · pronoun shift to "you/we"
- **LX**: translated collocations: *learn knowledge* → gain knowledge, *see news* → watch the news,
  *make a crime* → commit a crime, *bring to benefits* → bring benefits to, *suit with* → suit,
  *know clearly about* → understand, *apply on* → apply for · vague words (good, bad, many, things) ·
  register ("kids", "stuff", "too much") · wrong word form
- **CC**: "and it is…" chains · *Next,* to add an idea · *On the other hand* without a contrast ·
  *As a result* opening a conclusion · vague "it/this"
- **TR**: absolute claims · a claim with no reason or example

## 5. How to write each line (same voice as the grading comments)

- `why` = **one short Vietnamese sentence**: the rule or the reason, e.g. "time không đếm được → much / a great deal of".
  This is how the teacher writes a comment, but for social posts we speak to the reader as "bạn", not "em".
- English stays English: tags, IELTS terms (collocation, comma splice), every example phrase.
- `label` names the technique (Collocation, Danh từ hoá, Mệnh đề quan hệ, Mệnh đề phân từ, Cụm chỉ nguyên nhân…).
- `toolkit` formulas must be reusable in other essays, and each one should match a move in the set.
- The video reads `why` aloud: put every English word or phrase in “quotes” (it is then marked as English) and use
  words, not symbols (no →, +, =, /). Write "nên dùng “much time” hoặc “a lot of time”", not "→ much time / a lot of time".
- `practice.sentence` has the **same error type** as the set, on a different topic. `answer6` fixes the errors;
  `answer7` follows §3 (same idea, natural, no forced words).

## 6. Checklist before rendering

1. Every `[[…]]` in band 6/7 has a matching `moves[]` item; every `{{…}}` in band 5 is covered by a `problems[]` item.
2. Every problem and move has a tag; at most two tags each.
3. Band 6 and band 7 sentences are error-free: articles, plurals, agreement, commas.
4. The idea stays the same across 5 → 6 → 7.
5. Read band 7 aloud. If it sounds like a thesaurus, simplify it.
6. `node make-upgrade.mjs <id>` and look at every slide (the script warns on overflow).
7. `node make-video.mjs --series writing <id> --tts none` for a quick layout check, then without `--tts none`
   for the voiced video. Watch it once before posting.

## 7. Prompt for drafting a new set

```
You write data for "Nâng band câu này", an IELTS Writing carousel for Vietnamese learners.
Follow tools/social-content/docs/nang-band.md exactly (tags TR/CC/LX/GR, band anchors, natural-before-fancy).
Topic: <topic>. Error type to teach (from the error bank): <e.g. Because… so…>.
Return ONE JSON object shaped like the existing items in data/upgrades.json:
id, topic, hook (Vietnamese, ≤ 8 words), levels[band 5 with {{weak}} markup + problems[{phrase, criterion, why}],
band 6 and band 7 with [[upgrade]] markup + moves[{phrase, label, criterion, why}]],
toolkit[{formula, use}] (4–5), practice {sentence, answer6, answer7}.
Vietnamese explanations: one short sentence each, addressed to "bạn".
```
