# upwind.asia

Source for **https://upwind.asia**, hosted on Cloudflare Pages (moved from Replit).

| Page | URL | Code |
|---|---|---|
| Upwind Green Finance | `/` | `index.html`, `src/green-finance/` |
| UpWind IELTS & Self Study | `/ielts-self-study/` | `ielts-self-study/index.html`, `src/ielts/` |

Other folders:
- `src/assets/` – images imported by the pages
- `public/` – files copied as-is (favicon, social images, `roadmap.pdf`, `404.html`, `_headers`)
- `templates/landing.html` – old standalone HTML template, not deployed

## Edit & preview

```sh
pnpm install
pnpm dev        # http://localhost:5173/ and /ielts-self-study/
pnpm build      # typecheck + build into dist/
pnpm preview    # serve dist/ locally
```

## Deploy

Cloudflare Pages is connected to this repo. Every push to `main` builds and publishes the site
(about 1 minute); every other branch or PR gets its own preview URL.

Cloudflare Pages build settings:
| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Node version | from `.node-version` (22) |

`public/404.html` is served for unknown URLs and `public/_headers` sets cache headers.

## Known issue

The Green Finance **Apply** form (`src/green-finance/ApplyModal.tsx`) only logs the form
to the browser console; applications are not saved anywhere yet.
