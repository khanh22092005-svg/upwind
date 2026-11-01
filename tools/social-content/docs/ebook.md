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

## Online reader (flip book): https://upwind.asia/ebook/hoc-tu-tu-goc/

Page curl and swipe come from StPageFlip (`page-flip` on npm, MIT). Code: `ebook/hoc-tu-tu-goc/index.html` and `src/ebook/`.
The reader shows pre-rendered pages, not the PDF. After changing the ebook, rebuild them from the repo root:

```bash
node tools/social-content/make-ebook.mjs
rm -rf /tmp/pg && mkdir /tmp/pg && pdftoppm -scale-to-x 1000 -scale-to-y -1 -png tools/social-content/out/ebook/upwind-giai-ma-tu-vung.pdf /tmp/pg/p
rm -f public/ebook/hoc-tu-tu-goc/pages/*.webp && i=0; for f in /tmp/pg/*.png; do i=$((i+1)); python3 -c "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],'WEBP',quality=74)" "$f" "public/ebook/hoc-tu-tu-goc/pages/$(printf %03d $i).webp"; done
```

Then refresh `src/ebook/hoc-tu-tu-goc.json` (page count + contents from the PDF outline) if units or pages moved.
