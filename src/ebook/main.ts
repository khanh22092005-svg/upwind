// Flip-book reader for the UpWind ebook "Học Từ, Từ Gốc".
// Page curl, drag and swipe come from StPageFlip (github.com/Nodlik/StPageFlip, MIT, npm "page-flip").
// Pages are pre-rendered WebP images in public/ebook/hoc-tu-tu-goc/pages/NNN.webp (see tools/social-content/docs/ebook.md),
// loaded a few at a time around the open page.
import { PageFlip } from "page-flip/dist/js/page-flip.module.js";
import "page-flip/src/Style/stPageFlip.css";
import "./style.css";
import book from "./hoc-tu-tu-goc.json";

const PAGES = book.pages;
const RATIO = 1000 / 1416; // A4 page images
const BASE = "/ebook/hoc-tu-tu-goc/pages/";
const STORE = "upwind-ebook-hoc-tu-tu-goc-page";
const src = (i: number) => `${BASE}${String(i + 1).padStart(3, "0")}.webp`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const wrap = $("bookwrap");
const slider = $<HTMLInputElement>("slider");
const pageNum = $("pageNum");
const fullNum = $("fullNum");
const hint = $("hint");
const tocBtn = $<HTMLButtonElement>("tocBtn");
const toc = $("toc");

slider.max = String(PAGES);

/* ---------- start page: #p=N in the URL, else where the reader left off ---------- */
function startPage(): number {
  const m = location.hash.match(/p=(\d+)/);
  const n = m ? Number(m[1]) : Number(localStorage.getItem(STORE) || 1);
  return Math.min(Math.max(1, n || 1), PAGES) - 1;
}

/* ---------- pages ---------- */
function makePages(): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (let i = 0; i < PAGES; i++) {
    const el = document.createElement("div");
    el.className = "page";
    if (i === 0 || i === PAGES - 1) el.dataset.density = "hard";
    const img = document.createElement("img");
    img.alt = `Trang ${i + 1}`;
    img.decoding = "async";
    img.draggable = false;
    el.appendChild(img);
    out.push(el);
  }
  return out;
}

let pages: HTMLElement[] = [];
// Fetch and decode pages ahead of time, so a flip never waits for an image to decode mid-animation.
function loadAround(i: number) {
  for (let k = i - 4; k <= i + 8; k++) {
    if (k < 0 || k >= PAGES) continue;
    const img = pages[k].firstElementChild as HTMLImageElement;
    if (!img.getAttribute("src")) {
      img.src = src(k);
      img.decode?.().catch(() => {});
    }
  }
}

/* ---------- the book; rebuilt only when the layout should switch between one page and a spread ---------- */
let flip: PageFlip | null = null;
let spread: boolean | null = null;

function wantSpread(): boolean {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  // A spread is worth it only if each page stays at least ~80% of the size it would have alone.
  return Math.min(w / 2, h * RATIO) >= 0.8 * Math.min(w, h * RATIO) && w >= 560;
}

function build(at: number) {
  flip?.destroy();
  wrap.innerHTML = "";
  const el = document.createElement("div");
  el.id = "book";
  wrap.appendChild(el);
  pages = makePages();
  el.append(...pages);
  loadAround(at);

  spread = wantSpread();
  const w = wrap.clientWidth;
  flip = new PageFlip(el, {
    width: 500,
    height: Math.round(500 / RATIO),
    size: "stretch",
    // Portrait whenever the block is narrower than 2 × minWidth, so this picks the layout.
    minWidth: spread ? 100 : Math.ceil(w / 2) + 50,
    maxWidth: 1400,
    minHeight: 100,
    maxHeight: 2000,
    autoSize: false,
    showCover: true,
    usePortrait: true,
    drawShadow: true,
    maxShadowOpacity: 0.4,
    flippingTime: 600,
    mobileScrollSupport: false,
    swipeDistance: 20,
    showPageCorners: true,
    startPage: at,
  });
  flip.loadFromHTML(pages);
  flip.on("flip", (e) => onPage(e.data as number));
  onPage(at);
}

function current(): number {
  return flip ? flip.getCurrentPageIndex() : 0;
}

let hinted = false;
function onPage(i: number) {
  loadAround(i);
  const n = i + 1;
  slider.value = String(n);
  // In a spread, show both page numbers.
  const pair = spread && i > 0 && i < PAGES - 1 ? (i % 2 ? `${n}–${n + 1}` : `${n - 1}–${n}`) : String(n);
  pageNum.textContent = `${pair} / ${PAGES}`;
  fullNum.textContent = `${pair} / ${PAGES}`;
  localStorage.setItem(STORE, String(n));
  history.replaceState(null, "", `#p=${n}`);
  markToc(n);
  if (i !== startAt && !hinted) {
    hinted = true;
    hint.classList.add("gone");
  }
}

const startAt = startPage();

// Build only once the reader area has a real size (in-app browsers like Zalo report 0 at first),
// then keep the book fitted: rebuild when one page <-> spread should switch, otherwise just re-measure.
let pending = 0;
function fit() {
  if (wrap.clientWidth < 50 || wrap.clientHeight < 50) return;
  if (!flip) build(startAt);
  else if (wantSpread() !== spread) build(current());
  else flip.update();
}
new ResizeObserver(() => {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(fit);
}).observe(wrap);
window.addEventListener("orientationchange", () => setTimeout(fit, 300));
fit();

/* ---------- controls ---------- */
$("prev").addEventListener("click", () => flip?.flipPrev());
$("next").addEventListener("click", () => flip?.flipNext());
slider.addEventListener("input", () => {
  const i = Number(slider.value) - 1;
  pageNum.textContent = `${slider.value} / ${PAGES}`;
  loadAround(i);
});
slider.addEventListener("change", () => flip?.turnToPage(Number(slider.value) - 1));
document.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).tagName === "INPUT") return;
  if (e.key === "ArrowRight" || e.key === "PageDown") flip?.flipNext();
  else if (e.key === "ArrowLeft" || e.key === "PageUp") flip?.flipPrev();
  else if (e.key === "Home") flip?.turnToPage(0);
  else if (e.key === "End") flip?.turnToPage(PAGES - 1);
  else if (e.key === "Escape") { closeToc(); setFull(false); }
  else if (e.key === "f") setFull(!document.body.classList.contains("full"));
});

/* ---------- page-only mode: hide the bars; also real fullscreen where the browser allows it (not iPhone) ---------- */
const fsBtn = $("fsBtn");
const exitBtn = $("exitFull");
function setFull(on: boolean) {
  document.body.classList.toggle("full", on);
  closeToc();
  if (on && document.fullscreenEnabled && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (!on && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}
fsBtn.addEventListener("click", () => setFull(true));
exitBtn.addEventListener("click", () => setFull(false));
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && document.body.classList.contains("full")) setFull(false);
});

/* ---------- contents (from the PDF outline) ---------- */
for (const item of book.toc) {
  const a = document.createElement("a");
  a.href = `#p=${item.p}`;
  a.dataset.p = String(item.p);
  a.className = item.d ? "sub" : "top";
  a.innerHTML = `<span></span><small>${item.p}</small>`;
  (a.firstElementChild as HTMLElement).textContent = item.t;
  a.addEventListener("click", (e) => {
    e.preventDefault();
    loadAround(item.p - 1);
    flip?.turnToPage(item.p - 1);
    onPage(item.p - 1);
    closeToc();
  });
  toc.appendChild(a);
}
function markToc(n: number) {
  let best: HTMLElement | null = null;
  for (const a of toc.querySelectorAll<HTMLElement>("a")) {
    a.classList.remove("on");
    if (Number(a.dataset.p) <= n) best = a;
  }
  best?.classList.add("on");
}
function closeToc() {
  toc.hidden = true;
  tocBtn.setAttribute("aria-expanded", "false");
}
tocBtn.addEventListener("click", () => {
  toc.hidden = !toc.hidden;
  tocBtn.setAttribute("aria-expanded", String(!toc.hidden));
  if (!toc.hidden) toc.querySelector(".on")?.scrollIntoView({ block: "center" });
});
document.addEventListener("click", (e) => {
  if (!toc.hidden && !toc.contains(e.target as Node) && e.target !== tocBtn) closeToc();
});
