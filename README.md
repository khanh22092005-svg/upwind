# upwind.asia

Source for **https://upwind.asia**, hosted on Cloudflare (moved from Replit).

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

Hosted on Cloudflare (Workers static assets, configured in `wrangler.jsonc`; no Worker code).

```sh
pnpm build
npx wrangler deploy     # needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
```

`public/404.html` is served for unknown URLs and `public/_headers` sets cache headers.

## Known issue

The Green Finance **Apply** form (`src/green-finance/ApplyModal.tsx`) only logs the form
to the browser console; applications are not saved anywhere yet.
