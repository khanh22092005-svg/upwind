# Series: Đoán từ · gốc từ (5-word guessing game)

Format adapted from a "C1 VOCABULARY · guess the word" reel (5 words, first letter + blanks + meaning, a 3-second
countdown, then the word types in with IPA). UpWind's twist: **the root is already in the blanks** (`_ _ _ _ _ RUPT`
= ngắt lời → **interrupt**), so the game teaches that one root unlocks many words. It works for every family in
`data/families.json`; no extra data is needed.

## Make one

```bash
cd tools/social-content
node make-carousel.mjs rupt --series quiz   # -> out/carousel/doan-rupt/01.png … 12.png + caption.txt
node make-video.mjs --series quiz rupt      # -> out/doan-rupt/video.mp4 + caption.txt (~60 s)
```

## Structure

| scene | screen | narration |
|---|---|---|
| intro | "ĐOÁN TỪ · 5 TỪ · 3 GIÂY", root = meaning, the 5 blank patterns, "Bạn đoán được mấy/5?" | "Thử thách năm từ, mỗi từ ba giây! Gợi ý: tất cả đều có gốc {{rupt}}, nghĩa là vỡ…" |
| ask ×5 | dark card: blanks with the root filled in, Vietnamese meaning, root hint, 3-2-1 ring + bar | "Từ số một: phun trào." then 3 s of ticks |
| reveal ×5 | missing letters type in (prefix orange, root blue, suffix green), IPA, prefix + root tiles, emoji; chime | "{{The answer is erupt}}. Vỡ toang ra ngoài như núi lửa." (`story` from the data) |
| end | "Bạn được ?/5", the 5 answers colour-coded, ebook offer | "Bạn được mấy trên năm?" + the shared offer line |

- **Words:** the first five of the family, or set `"quiz": ["erupt", "disrupt", …]` on the family to choose.
- **Countdown** starts when the ask narration ends (the scene's HTML is built after its audio; see `lib/quiz-scenes.mjs`).
- **Caption:** asks for the score in the comments; the answers go in the pinned comment.
- Carousel: question slide ("Lướt xem đáp án") then answer slide, so the swipe is the reveal.

## Voice note (learned on the first render)

The local "Hải Đăng" reads a lone English word badly ("Erupt." came out as "E-rap"; corrupt as "come up"). A short
English carrier sentence fixes it: **"{{The answer is erupt}}."** came back right for all five rupt words. Keep that
wording. Always run `python3 lib/check_voice.py` on the answer clips; a bad local clip can be re-made by deleting just
that clip from `out/.tts-cache` (local clips are free; never delete cloud clips).
