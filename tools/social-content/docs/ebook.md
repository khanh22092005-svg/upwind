# Ebook: "Học Từ, Từ Gốc · Từ vựng IELTS từ gốc Latin" (A4 PDF)

```bash
node make-ebook.mjs                 # -> out/ebook/upwind-giai-ma-tu-vung.pdf (40 units)
node make-ebook.mjs voc,vid          # quick preview of a few units -> out/ebook/preview.pdf
```

Pearson-style units in UpWind colours: unit band, "In this unit you will", Lead-in, Word map (top-down tree: root →
words → word family → collocations), Vocabulary cards, Reading + exam tip, Vocabulary practice, Language focus,
Speaking, Writing, Review. One skill per unit, in UpWind Student Roadmap order (`order.json` "skills": Reading 1–15, Speaking Part 1 16–20, Writing Task 2 21–30, Speaking Part 3 31–35, Part 2 36–40). Front matter: contents grid (Unit × Skill), IELTS goals, an 8–10 week study plan (5 units a week, Saturday review, weeks 9–10 for topic review and the final test), placement test, affix tables, a
map of all 40 roots. Back: final test, answer key, topic list, A–Z index. Needs `pdftotext` and `pypdf`.

Data: `data/families.json` (shared with the videos) plus `data/ebook/<id>.json`, which either adds ebook fields to a
video family or holds a whole new family. `data/ebook/order.json` sets the parts and unit order.
Per unit: `reading`, `rq` (Reading task: `gap` | `mcq` | `tfng` | `sent` | `ynng`), `spk` (Speaking Part 1/2/3),
`wt` (Task 2 type), `write`, `wf` (word form), `err` (error correction), `pa` (sentence paraphrase), `syn`
(paraphrase pairs); per word `forms`, `col` (collocations), `tp` (IELTS topic). Task types and exam tips follow the
UpWind Student Roadmap (sheet "Roadmap v2").

## Page fit (automatic)

Each unit starts on a new page, so a unit that runs a little long used to leave a nearly empty last page (just the Review
table, or only the "Lịch ôn" line). `make-ebook.mjs` now checks where each unit ends (an invisible `@@E<n>@@` marker,
read with `pdftotext -bbox`) and, if the last page is under 42% full, tightens that unit step by step (`.fit1` spacing,
`.fit2`/`.fit3` slightly smaller type, in `lib/ebook.css`) and renders again. If even `.fit3` can't pull the tail back,
the unit keeps its normal spacing. The run prints which units were tightened and any short last pages left.

## Online reader (flip book): https://upwind.asia/ebook/hoc-tu-tu-goc/

After changing the ebook, rebuild the PDF and refresh the online copy (see `tools/ebook/README.md`):

```bash
node tools/social-content/make-ebook.mjs
node tools/ebook/add-ebook.mjs tools/social-content/out/ebook/upwind-giai-ma-tu-vung.pdf --slug hoc-tu-tu-goc
```
