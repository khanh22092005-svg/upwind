# upwind.asia

Source for **https://upwind.asia**, hosted on Cloudflare (moved from Replit).

| Page | URL | Code |
|---|---|---|
| UpWind IELTS & Self Study | `/ielts-self-study/` (`/` redirects here) | `ielts-self-study/index.html`, `src/ielts/` |
| UpWind IELTS & Self Study · 4.0 → 5.5 | `/ielts-foundation/` | `ielts-foundation/index.html`, `src/ielts-foundation/` (shares `src/ielts/index.css`) |
| Intensive Mastery · Writing & Speaking | `/Intensive-Writing-Speaking/` | `Intensive-Writing-Speaking/index.html`, `src/intensive/` |
| Học từ từ gốc (interactive word-roots handbook) | `/goc-tu/` | `goc-tu/index.html`, `src/goc-tu/` (data: `tools/word-roots/data/families.json`) |
| Upwind Green Finance (test, not indexed) | `/test/green-finance/` | `test/green-finance/index.html`, `src/green-finance/` |

Other folders:
- `src/assets/` – images imported by the pages
- `public/` – files copied as-is (favicon, social images, `roadmap.pdf`, `404.html`, `_headers`, `_redirects`)
- `templates/landing.html` – old standalone HTML template, not deployed

## Học từ từ gốc (`/goc-tu/`)

Interactive version of the word-roots handbook. It reads `tools/word-roots/data/families.json` directly, so a new
family added for the videos/handbook also appears here after a build. Each root is a chapter (bait → root → build
each word from its parts → guess the meaning → word card → 8 practice questions taken from the handbook), with spaced
review (`ts-fsrs`) and a prefix/suffix table. Progress is saved in the browser (`localStorage` key `upwind-goc-tu-v1`);
there are no accounts yet. Deep links: `/goc-tu/#/rupt` (a root), `/goc-tu/#/rupt/erupt` (a word), `#/on-tap`, `#/bang-phu-to`.

## Edit & preview

```sh
pnpm install
pnpm dev        # http://localhost:5173/ielts-self-study/, /ielts-foundation/, /Intensive-Writing-Speaking/, /goc-tu/ and /test/green-finance/
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
