#!/usr/bin/env node
// Add (or update) a flip-book ebook on upwind.asia from a PDF. One command, then push to main.
//
//   node tools/ebook/add-ebook.mjs book.pdf --slug my-book --title "Tên sách" --description "Một câu giới thiệu"
//   node tools/ebook/add-ebook.mjs book.pdf --slug my-book          # update an existing book (keeps title/description)
//
// What it does:
//   1. PDF pages -> public/ebook/<slug>/pages/NNN.webp (1000 px wide)
//   2. page count, page shape and contents (from the PDF's bookmarks) -> the book data in ebook/<slug>/index.html
//   3. ebook/<slug>/index.html with all the tags CLAUDE.md asks for (vite.config.ts finds it by itself)
//   4. social preview: builds the site, opens the reader at 1200×630 and saves public/ebook/<slug>/social-preview.jpg
//      (skip with --no-preview). Look at the image before committing.
// The reader itself (page curl, swipe, contents, mobile, page-only mode) is shared: src/ebook/.
// Needs: pdftoppm (poppler-utils), python3 with Pillow and pypdf, and the repo's node_modules (pnpm install).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url); // so a globally installed playwright (NODE_PATH) is found too

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SITE = "https://upwind.asia";

/* ---------- arguments ---------- */
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : undefined;
};
const pdf = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--") && /\.pdf$/i.test(a));
const slug = opt("slug");
if (!pdf || !slug) {
  console.error('Usage: node tools/ebook/add-ebook.mjs book.pdf --slug my-book [--title "Tên sách"] [--description "..."] [--no-preview]');
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("--slug: lowercase letters, digits and dashes only (it becomes the URL /ebook/<slug>/)");
  process.exit(1);
}
const pageDir = path.join(ROOT, "ebook", slug);
const htmlFile = path.join(pageDir, "index.html");
const pubDir = path.join(ROOT, "public", "ebook", slug);
const imgDir = path.join(pubDir, "pages");

// keep title/description from an existing book unless new ones are given
let old = {};
if (fs.existsSync(htmlFile)) {
  const m = fs.readFileSync(htmlFile, "utf8").match(/<script id="book-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (m) old = JSON.parse(m[1]);
}
const title = opt("title") ?? old.title;
const description = opt("description") ?? old.description ?? `Đọc ebook "${title}" của UpWind. Lật trang như sách thật, trên điện thoại hoặc máy tính.`;
if (!title) {
  console.error("--title is needed for a new book");
  process.exit(1);
}

/* ---------- 1. pages -> WebP ---------- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ebook-"));
console.log("1/4 rendering pages…");
execFileSync("pdftoppm", ["-scale-to-x", "1000", "-scale-to-y", "-1", "-png", path.resolve(pdf), path.join(tmp, "p")], { stdio: "inherit" });
fs.mkdirSync(imgDir, { recursive: true });
for (const f of fs.readdirSync(imgDir)) if (f.endsWith(".webp")) fs.rmSync(path.join(imgDir, f));
const PY_WEBP = `
import os, sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
files = sorted(f for f in os.listdir(src) if f.endswith(".png"))
def conv(a):
    i, f = a
    Image.open(os.path.join(src, f)).convert("RGB").save(os.path.join(dst, "%03d.webp" % i), "WEBP", quality=74, method=4)
if __name__ == "__main__":
    with ProcessPoolExecutor() as ex: list(ex.map(conv, enumerate(files, 1)))
    w, h = Image.open(os.path.join(src, files[0])).size
    print(len(files), w, h)
`;
const pyFile = path.join(tmp, "webp.py");
fs.writeFileSync(pyFile, PY_WEBP);
const [pages, w, h] = execFileSync("python3", ["-I", pyFile, tmp, imgDir], { encoding: "utf8" }).trim().split(" ").map(Number);

/* ---------- 2. contents from the PDF bookmarks ---------- */
console.log("2/4 reading contents…");
const PY_TOC = `
import json, sys, pypdf
r = pypdf.PdfReader(sys.argv[1]); out = []
def walk(o, d=0):
    for x in o:
        if isinstance(x, list): walk(x, d + 1)
        else:
            try: out.append({"t": x.title, "p": r.get_destination_page_number(x) + 1, "d": d})
            except Exception: pass
try: walk(r.outline)
except Exception: pass  # no bookmarks: the reader hides the contents button
print(json.dumps(out, ensure_ascii=False))
`;
const tocFile = path.join(tmp, "toc.py");
fs.writeFileSync(tocFile, PY_TOC);
const toc = JSON.parse(execFileSync("python3", ["-I", tocFile, path.resolve(pdf)], { encoding: "utf8" }));
fs.rmSync(tmp, { recursive: true, force: true });

/* ---------- 3. the page ---------- */
console.log("3/4 writing the page…");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const url = `${SITE}/ebook/${slug}/`;
const img = `${url}social-preview.jpg`;
const alt = `Ebook ${title} của UpWind mở trên trình đọc lật trang`;
const book = { slug, title, description, pages, ratio: Math.round((w / h) * 10000) / 10000, toc };
const html = `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0b2545" />
    <title>${esc(title)} · Ebook | UpWind</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="book">
    <meta property="og:locale" content="vi_VN">
    <meta property="og:site_name" content="UpWind - IELTS &amp; Self Study">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${img}">
    <meta property="og:image:secure_url" content="${img}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${esc(alt)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)} · Ebook UpWind">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${img}">
    <meta name="twitter:image:alt" content="${esc(alt)}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />
    <link rel="preload" as="image" href="/ebook/${slug}/pages/001.webp" />
  </head>
  <body>
    <header class="bar">
      <a class="brand" href="/ielts-self-study/" aria-label="UpWind">
        <img src="/favicon.svg?v=3" alt="" width="28" height="28" />
        <span>${esc(title)}</span>
      </a>
      <div class="tools">
        <button id="tocBtn" class="btn" type="button" aria-haspopup="true" aria-expanded="false">Mục lục</button>
        <button id="fsBtn" class="btn icon" type="button" aria-label="Chỉ xem trang sách" title="Chỉ xem trang sách (F)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
      </div>
    </header>

    <nav id="toc" class="toc" hidden aria-label="Mục lục"></nav>

    <main class="stage" id="stage">
      <button id="prev" class="nav prev" type="button" aria-label="Trang trước">‹</button>
      <div class="bookwrap" id="bookwrap"><div id="book"></div></div>
      <button id="next" class="nav next" type="button" aria-label="Trang sau">›</button>
    </main>

    <footer class="bar bottom">
      <input id="slider" type="range" min="1" value="1" aria-label="Chọn trang" />
      <span id="pageNum" class="pnum">1 / 1</span>
    </footer>
    <button id="exitFull" class="exitfull" type="button" aria-label="Thoát chế độ chỉ xem trang">✕</button>
    <span id="fullNum" class="fullnum"></span>
    <p id="hint" class="hint">Vuốt hoặc kéo góc trang để lật</p>

    <script id="book-data" type="application/json">${JSON.stringify(book).replace(/</g, "\\u003c")}</script>
    <script type="module" src="/src/ebook/main.ts"></script>
  </body>
</html>
`;
fs.mkdirSync(pageDir, { recursive: true });
fs.writeFileSync(htmlFile, html);

/* ---------- 4. social preview ---------- */
if (args.includes("--no-preview")) {
  console.log("4/4 skipped social preview (--no-preview)");
} else {
  console.log("4/4 building the site and taking the social preview…");
  execFileSync("pnpm", ["build"], { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] });
  const port = 4300 + Math.floor(Math.random() * 500);
  const server = spawn("pnpm", ["exec", "vite", "preview", "--port", String(port), "--strictPort"], { cwd: ROOT, stdio: "ignore", detached: true });
  try {
    const { chromium } = require("playwright");
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    for (let i = 0; i < 40; i++) {
      try {
        await page.goto(`http://localhost:${port}/ebook/${slug}/#p=1`);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: ".hint{display:none} *{animation:none!important;transition:none!important}" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(pubDir, "social-preview.jpg"), type: "jpeg", quality: 88 });
    await browser.close();
  } finally {
    try { process.kill(-server.pid); } catch {}
  }
}

console.log(`
✓ ${title}: ${pages} pages, ${toc.length} contents entries
  page:    ebook/${slug}/index.html  ->  ${url}
  images:  public/ebook/${slug}/pages/
  preview: public/ebook/${slug}/social-preview.jpg (look at it before committing)
Next: commit and push to main (that deploys it).`);
