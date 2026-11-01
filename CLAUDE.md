# upwind.asia — notes for Claude

Pushing to `main` deploys automatically (Cloudflare Workers Builds). There is no separate deploy step.

## Every new or changed page must have

1. **Social media preview**: a 1200×630 JPEG at `public/<page-folder>/social-preview.jpg`. Make it by building,
   running `pnpm preview`, and taking a screenshot of the page's hero at a 1200×630 viewport (fonts loaded,
   animations paused). Look at the image before you commit it. Then put the full set of tags in the page's `index.html`:
   `og:image` (absolute `https://upwind.asia/...` URL), `og:image:secure_url`, `og:image:type`,
   `og:image:width` 1200, `og:image:height` 630, `og:image:alt`, `twitter:card` = `summary_large_image`,
   `twitter:image`, `twitter:image:alt`.
2. **Correct browser-tab icon**: `<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />`.
   `public/favicon.svg` is the official UpWind mark from the design system (ring, one sail, mast, deep-blue
   wave + sky wave), the same drawing as the nav logo. Never draw a different version.
   `public/ielts-self-study/favicon.svg` is a copy kept for old links; keep the two identical, and if the
   mark ever changes, bump `?v=` on every page.

`/opengraph.jpg` (a screenshot of a build error) was deleted; `public/_redirects` sends it to the IELTS preview. Do **not** use it for anything.

## IELTS Writing content

Any Writing band content (the "Nâng band câu này" carousels in `tools/word-roots`, slides, handouts) starts from
`tools/word-roots/WRITING-BANDS.md`. It follows the teacher's essay-grading rules (`ielts-writing-grader` skill): the tags
TR/CC/LX/GR, band 5/6/7 anchors from the official descriptors, natural expression before fancy words, and the error bank.

## Social content kit (`tools/word-roots/`)

Videos, carousels ("ảnh cuộn") and the handbook for the "Học từ từ gốc" and "Nâng band câu này" series are made by
`tools/word-roots/` (not part of the website build). Read its `README.md` (commands, voices, visual rules) and `METHOD.md`
(format, production line, data prompts) before changing anything there. Outputs go to its gitignored `out/` folder.
The VieNeu API key is passed only as the `VIENEU_API_KEY` environment variable; never write it into a file or commit it.
