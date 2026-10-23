# upwind.asia — notes for Claude

Pushing to `main` deploys automatically (Cloudflare Workers Builds). There is no separate deploy step.

## Every new or changed page must have

1. **Social media preview**: a 1200×630 JPEG at `public/<page-folder>/social-preview.jpg`. Make it by building,
   running `pnpm preview`, and taking a screenshot of the page's hero at a 1200×630 viewport (fonts loaded,
   animations paused). Look at the image before you commit it. Then put the full set of tags in the page's `index.html`:
   `og:image` (absolute `https://upwind.asia/...` URL), `og:image:secure_url`, `og:image:type`,
   `og:image:width` 1200, `og:image:height` 630, `og:image:alt`, `twitter:card` = `summary_large_image`,
   `twitter:image`, `twitter:image:alt`.
2. **Correct browser-tab icon**: `<link rel="icon" type="image/svg+xml" href="/ielts-self-study/favicon.svg?v=2" />`
   (the UpWind sailboat logo).

Do **not** use `/favicon.svg` (an orange placeholder square) or `/opengraph.jpg` (a screenshot of a build
error) for anything.
