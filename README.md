# upwind.asia

Source for **https://upwind.asia**, hosted on Cloudflare (moved from Replit).

| Page | URL | Code |
|---|---|---|
| UpWind IELTS & Self Study | `/ielts-self-study/` (`/` redirects here) | `ielts-self-study/index.html`, `src/ielts/` |
| UpWind IELTS & Self Study · 4.0 → 5.5 | `/ielts-foundation/` | `ielts-foundation/index.html`, `src/ielts-foundation/` (shares `src/ielts/index.css`) |
| Intensive Mastery · Writing & Speaking | `/Intensive-Writing-Speaking/` | `Intensive-Writing-Speaking/index.html`, `src/intensive/` |
| Học từ từ gốc, interactive version of the ebook | `/goc-tu/` | `goc-tu/index.html`, `src/goc-tu/` (data: `tools/social-content/data/ebook/`) |
| Upwind Green Finance (test, not indexed) | `/test/green-finance/` | `test/green-finance/index.html`, `src/green-finance/` |

Other folders:
- `src/assets/` – images imported by the pages
- `public/` – files copied as-is (favicon, social images, `roadmap.pdf`, `404.html`, `_headers`, `_redirects`)
- `templates/landing.html` – old standalone HTML template, not deployed

## Học từ từ gốc (`/goc-tu/`)

Interactive version of the ebook "Học Từ, Từ Gốc" (`/ebook/hoc-tu-tu-goc/`). It reads the ebook's own data,
`tools/social-content/data/ebook/order.json` + `<id>.json` (merged with `data/families.json` the same way as
`make-ebook.mjs`), so after a data change and a build the two always match. Only the fields the app uses are bundled
(`?fields=` imports, see `jsonFields()` in `vite.config.ts`).

Home is one tree (`src/goc-tu/Tree.tsx`): trunk "Latin" → the ebook's 4 parts as crowns → 40 roots as branches →
252 words as leaves, coloured by progress (due words show as fruit). Each unit grows one branch: build each word from its
parts (`PartBuilder.tsx`), guess the meaning, then the word card with "bridges" to other branches that share the prefix
(`bridges.ts`). The challenge has no word bank: type the word into the ebook's sentences (`Recall.tsx`), 2 "Word form"
items, and 2 "quả lạ" (a word from another branch with a known prefix: build it and work out the meaning). Review
(`ts-fsrs`) flips young words and asks for older ones (3+ reviews) to be typed. There is also a prefix/suffix table and
word search. Progress is saved in the browser
(`localStorage` key `upwind-goc-tu-v1`); there are no accounts yet. Deep links: `/goc-tu/#/rupt` (a unit),
`/goc-tu/#/rupt/erupt` (a word), `#/on-tap`, `#/bang-phu-to`.

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
