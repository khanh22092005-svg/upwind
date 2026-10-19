# upwind.asia

Source for **https://upwind.asia**, hosted on GitHub Pages (moved from Replit).

| Page | URL | Code |
|---|---|---|
| Upwind Green Finance | `/` | `index.html`, `src/green-finance/` |
| UpWind IELTS & Self Study | `/ielts-self-study/` | `ielts-self-study/index.html`, `src/ielts/` |

Other folders:
- `src/assets/` – images imported by the pages
- `public/` – files copied as-is (favicon, social images, `roadmap.pdf`, `CNAME`, `404.html`)
- `templates/landing.html` – old standalone HTML template, not deployed

## Edit & preview

```sh
pnpm install
pnpm dev        # http://localhost:5173/ and /ielts-self-study/
pnpm build      # typecheck + build into dist/
pnpm preview    # serve dist/ locally
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes `dist/` to GitHub Pages (about 1 minute).

One-time setup: **Settings → Pages → Source: GitHub Actions**, custom domain `upwind.asia`,
then tick **Enforce HTTPS**.

DNS at the domain registrar:
- `upwind.asia` A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `www` CNAME: `khanh22092005-svg.github.io`

## Known issue

The Green Finance **Apply** form (`src/green-finance/ApplyModal.tsx`) only logs the form
to the browser console; applications are not saved anywhere yet.
