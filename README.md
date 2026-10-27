# upwind.asia

Source for **https://upwind.asia**, hosted on Cloudflare (moved from Replit).

| Page | URL | Code |
|---|---|---|
| UpWind IELTS & Self Study | `/ielts-self-study/` (`/` redirects here) | `ielts-self-study/index.html`, `src/ielts/` |
| UpWind IELTS & Self Study · 4.0 → 5.5 | `/ielts-foundation/` | `ielts-foundation/index.html`, `src/ielts-foundation/` (shares `src/ielts/index.css`) |
| Intensive Mastery · Writing & Speaking | `/Intensive-Writing-Speaking/` | `Intensive-Writing-Speaking/index.html`, `src/intensive/` |
| Upwind Green Finance (test, not indexed) | `/test/green-finance/` | `test/green-finance/index.html`, `src/green-finance/` |

Other folders:
- `src/assets/` – images imported by the pages
- `public/` – files copied as-is (favicon, social images, `roadmap.pdf`, `404.html`, `_headers`, `_redirects`)
- `templates/landing.html` – old standalone HTML template, not deployed

## Edit & preview

```sh
pnpm install
pnpm dev        # http://localhost:5173/ielts-self-study/, /ielts-foundation/, /Intensive-Writing-Speaking/ and /test/green-finance/
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

## Known issues

The Green Finance **Apply** form (`src/green-finance/ApplyModal.tsx`) and the Intensive
**placement test** form (`src/intensive/Landing.tsx`) only log the form to the browser
console; sign-ups are not saved anywhere yet.
