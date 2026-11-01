# Ebooks on upwind.asia (flip-book reader)

Every ebook is read at `https://upwind.asia/ebook/<slug>/` in the same reader: page curl, swipe, a two-page spread on
wide screens and one page on phones, contents menu (from the PDF's bookmarks), page slider, page-only mode, links like
`#p=33`, and it reopens where the reader left off.

## Add a book (or update one)

```bash
node tools/ebook/add-ebook.mjs book.pdf --slug my-book --title "Tên sách" --description "Một câu giới thiệu"
```

Then look at `public/ebook/my-book/social-preview.jpg`, commit, and push to main (that deploys it).
To update a book after changing its PDF, run the same command with just `--slug` (title and description are kept).
`--no-preview` skips the build and screenshot.

The script turns the pages into WebP images (`public/ebook/<slug>/pages/`), reads the page count, page shape and
bookmarks, writes `ebook/<slug>/index.html` with all the tags CLAUDE.md asks for, and takes the 1200×630 social preview.
`vite.config.ts` picks up every `ebook/<slug>/index.html` by itself.

Needs `pdftoppm` (poppler-utils), python3 with Pillow and pypdf, and `pnpm install`.
Give the PDF bookmarks (an outline) if you want the "Mục lục" menu; without them the button is hidden.

## The reader (shared by all books)

`src/ebook/main.ts` + `style.css`. Page curl comes from StPageFlip (`page-flip` on npm, MIT), with a small speed patch in
`patches/page-flip@2.0.7.patch` (applied by `pnpm install`). Change the reader once and every book gets it.
