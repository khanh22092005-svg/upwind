// "Phim gốc từ": one cinematic word-root video, flat-vector illustration style in the UpWind palette.
// Script: scripts/rupt-veo.md (written for Veo; here every shot is drawn as an animated SVG instead).
//
//   node make-video.mjs --series film rupt     # -> out/film-rupt/video.mp4 + caption.txt
//
// Each scene = a big illustrated "stage" (top) + a text panel (middle) + burned-in subtitles (bottom).
// Timing: placeholders in the HTML are replaced once the scene's narration exists, so the action lands on the words:
//   __D__      scene length in ms (the slow camera push lasts the whole scene)
//   __C2__     start of narration clause 2 (clauses are split at . , ; : ! ? like the voice)
//   __C2_60__  60% of the way through clause 2
import { esc } from "./common.mjs";
import { FONT_LINK, header, wave } from "./template.mjs";
import { lottieScripts } from "./emoji.mjs";
import { offerSay, offerHtml } from "./offer.mjs";
import { css as baseCss } from "./template.mjs";

const C = {
  blue: "#004b9b", blue7: "#1d5fae", blue5: "#3d8fd1", sky: "#6ac5e8", sky2: "#cfe9f7", sky1: "#e8f6fc",
  ink: "#0b2545", ink2: "#4a6b8a", orange: "#f2711c", orange2: "#c95a12", yellow: "#ffd166", cream: "#fff8ec",
  wood: "#d98a4a", wood2: "#a95f28", green: "#1a9c5b",
};

/* ---------- data: the RUPT film ---------- */
export const FILMS = [
  {
    id: "rupt",
    root: "rupt",
    origin: "Latin rumpere",
    core: "gãy, vỡ",
    quizAnswer: "A. abrupt = đột ngột (ab = rời ra + rupt = gãy: gãy rời ra bất ngờ). The meeting came to an abrupt end.",
  },
];
export const loadFilms = () => FILMS;

/* ---------- small helpers ---------- */
// An element that animates once at time `t` (a placeholder like "__C2__") for `len` seconds.
const at = (t, len = 0.5) => `style="--t:${t}ms;--len:${len}s"`;
const atv = (t, len, vars) => `style="--t:${t}ms;--len:${len}s;${vars}"`;

function tiles(parts, t0) {
  return `<div class="ftiles">${parts
    .map((p, i) => `<div class="ftile ev e-pop" data-k="${p.k}" style="--t:${t0}ms;--len:.45s;--c:${p.k === "pre" ? C.orange : C.blue};animation-delay:calc(${t0}ms + ${i * 160}ms)">
      <b>${esc(p.t)}</b><span>${esc(p.vi)}</span></div>`)
    .join(`<div class="fplus ev e-pop" style="--t:${t0}ms;--len:.4s;animation-delay:calc(${t0}ms + 80ms)">+</div>`)}</div>`;
}

/** Text panel for one word: tiles (prefix + rupt) → the word → meaning → example. */
function wordPanel({ parts, word, meaning, en, vi, tWord, tEx }) {
  const colored = parts.map((p) => `<span style="color:${p.k === "pre" ? C.orange : C.blue}">${esc(p.t)}</span>`).join("");
  const mark = en.replace(new RegExp(`\\b(${word.slice(0, -1)}[a-z]*)`, "i"), "<mark>$1</mark>");
  return `<div class="fpanel">
    <div class="fswap">
      <div class="fpart ev e-out" ${at(tWord, 0.3)}>${tiles(parts, 0)}</div>
      <div class="fword ev e-slam" ${at(tWord, 0.45)}>${colored}</div>
    </div>
    <div class="fmean ev e-sweep" ${at(tWord + "+350", 0.5)}>= ${esc(meaning)}</div>
    <div class="fex ev e-up" ${at(tEx, 0.45)}><div class="en">“${mark}”</div><div class="vi">${esc(vi)}</div></div>
  </div>`;
}

/* ---------- illustrations (SVG, viewBox 0 0 980 800) ---------- */
const svg = (inner, cls = "") => `<svg class="art ${cls}" viewBox="0 0 980 800" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;

const skyBg = (top = C.sky1, bottom = C.sky2) => `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
  <rect width="980" height="800" fill="url(#sky)"/>
  <circle cx="800" cy="150" r="70" fill="#fff" opacity=".7"/>
  <g class="drift" fill="#fff" opacity=".85"><ellipse cx="200" cy="130" rx="90" ry="26"/><ellipse cx="250" cy="112" rx="50" ry="26"/>
  <ellipse cx="620" cy="220" rx="70" ry="20"/><ellipse cx="660" cy="206" rx="40" ry="20"/></g>`;

const ground = (y = 630, c = "#bfe3f5") => `<rect x="0" y="${y}" width="980" height="${800 - y}" fill="${c}"/>
  <path d="M0 ${y} H980" stroke="${C.blue}" stroke-width="6" opacity=".15"/>`;

const coin = (x, y, i, dx, dy, rot, t) => `<g class="ev e-fly" ${atv(t, 0.9, `--dx:${dx}px;--dy:${dy}px;--r:${rot}deg;animation-delay:calc(${t}ms + ${i * 40}ms)`)}>
  <ellipse cx="${x}" cy="${y}" rx="30" ry="11" fill="#e0a800"/><ellipse cx="${x}" cy="${y - 6}" rx="30" ry="11" fill="${C.yellow}"/></g>`;

/** The moneylender's bench; it snaps in two at `t`. */
function bench(t, { withHammer = false } = {}) {
  const half = (side) => {
    const x0 = side === "L" ? 250 : 490;
    const legX = side === "L" ? 285 : 655;
    return `<g class="ev ${side === "L" ? "e-tipL" : "e-tipR"}" ${at(t, 0.55)}>
      <rect x="${legX}" y="470" width="40" height="160" rx="8" fill="${C.wood2}"/>
      <path d="M${x0} 430 H${x0 + 240} ${side === "L" ? "l-14 22 l14 14 l-10 14" : ""} V480 H${x0} ${side === "R" ? "l-10 -14 l14 -14 l-14 -22" : ""} Z" fill="${C.wood}"/>
      <rect x="${x0}" y="430" width="240" height="14" fill="#efa868"/>
    </g>`;
  };
  const coins = [
    [320, 420, -170, 210, -40], [380, 420, -60, 205, 30], [345, 404, -120, 220, 70],
    [600, 420, 90, 205, 50], [660, 420, 190, 212, -60], [630, 404, 130, 224, 20],
  ].map(([x, y, dx, dy, r], i) => coin(x, y, i, dx, dy, r, t)).join("");
  const hammer = withHammer
    ? `<g class="ev e-hammer" ${at(t + "-420", 0.42)}>
        <rect x="474" y="80" width="30" height="300" rx="10" fill="${C.wood2}"/>
        <rect x="420" y="330" width="140" height="80" rx="16" fill="${C.ink}"/><rect x="420" y="330" width="140" height="18" rx="9" fill="${C.ink2}"/></g>`
    : "";
  return `${coins}${half("L")}${half("R")}${hammer}
    <g class="ev e-burst" ${at(t, 0.5)}><path d="M490 400 l18 -50 l12 46 l44 -26 l-24 44 l50 6 l-48 18 l30 40 l-46 -20 l-6 50 l-20 -46 l-34 34 l10 -48 l-48 -4 l46 -22 l-34 -36 l46 14 Z" fill="${C.yellow}" stroke="#fff" stroke-width="8"/></g>`;
}

function marketBg() {
  const arch = (x) => `<path d="M${x} 630 V330 a90 90 0 0 1 180 0 V630" fill="#d6ecf8" stroke="#bcdcf0" stroke-width="6"/>`;
  return `${skyBg()}<rect x="40" y="250" width="900" height="380" fill="#e6f3fb"/>${arch(70)}${arch(400)}${arch(730)}${ground(630)}`;
}

function twig(t) {
  const crumbs = [[-90, -120], [60, -150], [120, -60], [-140, -40], [10, -170], [160, -130]]
    .map(([dx, dy], i) => `<circle cx="490" cy="400" r="${8 + (i % 3) * 3}" fill="${i % 2 ? C.wood : C.yellow}" class="ev e-fly" ${atv(t, 0.8, `--dx:${dx}px;--dy:${dy}px;--r:0deg`)}/>`).join("");
  const half = (side) => `<g class="ev ${side === "L" ? "e-snapL" : "e-snapR"}" ${at(t, 0.6)}>
      <g class="ev ${side === "L" ? "e-bendL" : "e-bendR"}" style="--t:0ms;--len:${t}ms">
        <rect x="${side === "L" ? 170 : 490}" y="384" width="320" height="34" rx="17" fill="${C.wood}"/>
        <rect x="${side === "L" ? 170 : 490}" y="384" width="320" height="10" rx="5" fill="#efa868"/>
        <circle cx="${side === "L" ? 205 : 775}" cy="401" r="62" fill="${C.sky}"/><circle cx="${side === "L" ? 205 : 775}" cy="401" r="62" fill="none" stroke="${C.blue}" stroke-width="8"/>
      </g></g>`;
  return `${skyBg()}${ground(640)}${half("L")}${half("R")}${crumbs}
    <g class="ev e-burst" ${at(t, 0.45)}><path d="M490 330 l10 40 l34 -20 l-16 36 l40 6 l-38 14 l20 32 l-36 -18 l-4 40 l-14 -38 l-28 26 l8 -38 l-38 -6 l38 -16 l-24 -30 l36 12 Z" fill="${C.yellow}" stroke="#fff" stroke-width="6"/></g>`;
}

function volcano(t) {
  const blobs = [[-260, -330], [-120, -420], [40, -460], [180, -380], [300, -300], [-30, -360], [110, -440]]
    .map(([dx, dy], i) => `<circle cx="490" cy="330" r="${18 + (i % 3) * 8}" fill="${i % 2 ? C.orange : C.yellow}" class="ev e-arc" style="--t:${t}ms;--len:1.3s;--dx:${dx}px;--dy:${dy}px;animation-delay:calc(${t}ms + ${i * 70}ms)"/>`).join("");
  const smoke = [0, 1, 2].map((i) => `<circle cx="${450 + i * 40}" cy="${290 - i * 30}" r="60" fill="#fff" opacity=".9" class="ev e-smoke" style="--t:${t}ms;--len:1.6s;animation-delay:calc(${t}ms + ${i * 180}ms)"/>`).join("");
  return `${skyBg()}${smoke}${blobs}
    <path d="M150 680 L410 330 H570 L830 680 Z" fill="${C.blue7}"/>
    <path d="M410 330 H570 L620 400 Q560 380 530 420 Q490 380 450 420 Q420 380 360 400 Z" fill="${C.blue}"/>
    <path class="ev e-flow" ${at(t + "+300", 1.6)} d="M440 340 Q420 450 380 520 T330 670" stroke="${C.orange}" stroke-width="26" fill="none" stroke-linecap="round" pathLength="1"/>
    <path class="ev e-flow" ${at(t + "+500", 1.6)} d="M540 340 Q560 460 610 540 T650 670" stroke="${C.orange}" stroke-width="22" fill="none" stroke-linecap="round" pathLength="1"/>
    <ellipse cx="490" cy="334" rx="80" ry="14" fill="${C.orange}" class="ev e-glow" ${at(t + "-600", 0.6)}/>
    ${ground(670, "#a9d6ef")}`;
}

function interrupt(t) {
  return `${skyBg()}${ground(660)}
    <g class="bob"><path d="M70 200 h260 a30 30 0 0 1 30 30 v120 a30 30 0 0 1 -30 30 h-170 l-40 50 v-50 h-50 a30 30 0 0 1 -30 -30 v-120 a30 30 0 0 1 30 -30 Z" fill="${C.blue}"/>
      <circle cx="150" cy="290" r="14" fill="#fff"/><circle cx="200" cy="290" r="14" fill="#fff"/><circle cx="250" cy="290" r="14" fill="#fff"/></g>
    <g class="bob2"><path d="M650 200 h260 a30 30 0 0 1 30 30 v120 a30 30 0 0 1 -30 30 h-50 v50 l-40 -50 h-170 a30 30 0 0 1 -30 -30 v-120 a30 30 0 0 1 30 -30 Z" fill="${C.sky}"/>
      <circle cx="730" cy="290" r="14" fill="#fff"/><circle cx="780" cy="290" r="14" fill="#fff"/><circle cx="830" cy="290" r="14" fill="#fff"/></g>
    <g class="ev e-cut" ${at(t, 0.3)}><path class="flowline" d="M360 300 C430 230 550 370 620 300" stroke="${C.yellow}" stroke-width="18" fill="none" stroke-linecap="round" stroke-dasharray="30 22"/></g>
    <g class="ev e-ends" ${at(t, 0.5)}>
      <path d="M360 300 C390 270 420 300 440 340" stroke="${C.yellow}" stroke-width="18" fill="none" stroke-linecap="round" stroke-dasharray="30 22"/>
      <path d="M620 300 C590 330 560 300 540 260" stroke="${C.yellow}" stroke-width="18" fill="none" stroke-linecap="round" stroke-dasharray="30 22"/></g>
    <g class="ev e-dropin" ${at(t + "-300", 0.4)}>
      <rect x="430" y="210" width="120" height="180" rx="22" fill="${C.orange}"/><rect x="430" y="210" width="120" height="30" rx="15" fill="#ff9a52"/>
      <text x="490" y="335" text-anchor="middle" font-size="110" font-weight="800" fill="#fff" font-family="Be Vietnam Pro">!</text></g>
    <g class="ev e-burst" ${at(t, 0.4)}><circle cx="490" cy="300" r="120" fill="none" stroke="#fff" stroke-width="10"/></g>`;
}

function train(t) {
  const dirs = [[-240, -260, -40], [-80, -330, 25], [90, -300, -30], [250, -240, 45]];
  const cars = dirs.map(([dx, dy, r], i) => {
    const x = 110 + i * 195;
    return `<g class="ev e-scatter" style="--t:${t}ms;--len:.9s;--dx:${dx}px;--dy:${dy}px;--r:${r}deg;animation-delay:calc(${t}ms + ${i * 60}ms)">
      <rect x="${x}" y="${i === 0 ? 380 : 410}" width="170" height="${i === 0 ? 170 : 140}" rx="22" fill="${i === 0 ? C.orange : C.blue7}"/>
      ${i === 0 ? `<rect x="${x + 20}" y="350" width="60" height="50" rx="10" fill="${C.ink}"/>` : ""}
      <rect x="${x + 22}" y="${i === 0 ? 410 : 435}" width="56" height="44" rx="10" fill="${C.sky1}"/><rect x="${x + 92}" y="${i === 0 ? 410 : 435}" width="56" height="44" rx="10" fill="${C.sky1}"/>
      <circle cx="${x + 40}" cy="560" r="26" fill="${C.ink}"/><circle cx="${x + 130}" cy="560" r="26" fill="${C.ink}"/>
      <circle cx="${x + 40}" cy="560" r="9" fill="${C.sky2}"/><circle cx="${x + 130}" cy="560" r="9" fill="${C.sky2}"/></g>`;
  }).join("");
  return `${skyBg()}${ground(590, "#bfe3f5")}
    <rect x="0" y="584" width="980" height="16" fill="${C.ink2}"/>
    ${[...Array(14)].map((_, i) => `<rect x="${i * 72 + 10}" y="600" width="40" height="14" rx="4" fill="${C.ink2}" opacity=".6"/>`).join("")}
    <g class="ev e-burst" ${at(t, 0.45)}><path d="M490 560 l20 -60 l14 54 l50 -30 l-28 50 l58 8 l-56 20 l34 46 l-52 -22 l-8 56 l-22 -52 l-38 38 l12 -54 l-56 -4 l52 -24 l-38 -40 l52 16 Z" fill="${C.yellow}" stroke="#fff" stroke-width="8"/></g>
    <g class="roll">${cars}</g>`;
}

function apple(t) {
  const dust = [...Array(10)].map((_, i) => `<circle cx="${400 + i * 20}" cy="${430 + (i % 3) * 30}" r="${10 + (i % 4) * 3}" fill="${i % 2 ? "#6b4a35" : "#8a6a4a"}" class="ev e-fall" style="--t:${t}ms;--len:1.2s;--dx:${(i - 5) * 22}px;animation-delay:calc(${t}ms + ${i * 50}ms)"/>`).join("");
  return `${skyBg()}${ground(640)}
    <rect x="360" y="600" width="260" height="40" rx="10" fill="${C.blue}"/><rect x="390" y="560" width="200" height="40" rx="10" fill="${C.blue7}"/>
    <g class="ev e-crumble" ${at(t, 1)}>
      <path d="M490 270 C380 200 280 290 300 400 C320 520 420 560 490 530 C560 560 660 520 680 400 C700 290 600 200 490 270 Z" fill="${C.orange}"/>
      <path class="ev e-rot" ${at("__C1__", 1.2)} d="M490 270 C380 200 280 290 300 400 C320 520 420 560 490 530 C560 560 660 520 680 400 C700 290 600 200 490 270 Z" fill="#6b4a35"/>
      <ellipse cx="400" cy="340" rx="34" ry="54" fill="#fff" opacity=".35" transform="rotate(25 400 340)"/>
      <path d="M490 270 q0 -60 20 -90" stroke="${C.wood2}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M505 200 q60 -40 110 -10 q-50 40 -110 10 Z" fill="${C.green}"/>
      <path class="ev e-draw" ${at("__C1__", 0.9)} pathLength="1" d="M490 290 l-30 60 l40 40 l-50 70 M500 390 l60 30 l10 60 M460 350 l-80 20 l-30 60" stroke="${C.ink}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>${dust}`;
}

function bridge(t) {
  const planks = [...Array(8)].map((_, i) => `<rect x="${292 + i * 50}" y="402" width="38" height="22" rx="5" fill="${C.wood}"/>`).join("");
  return `${skyBg()}
    <path d="M0 400 H290 L250 800 H0 Z" fill="${C.blue7}"/><path d="M690 400 H980 V800 H730 Z" fill="${C.blue7}"/>
    <rect x="0" y="392" width="290" height="16" fill="${C.blue}"/><rect x="690" y="392" width="290" height="16" fill="${C.blue}"/>
    <rect x="270" y="330" width="16" height="80" fill="${C.wood2}"/><rect x="694" y="330" width="16" height="80" fill="${C.wood2}"/>
    <g class="ev e-swing" ${at(t, 0.9)}>
      <path d="M286 340 Q490 420 694 340" stroke="${C.wood2}" stroke-width="7" fill="none"/>
      <path d="M286 410 Q490 440 694 410" stroke="${C.wood2}" stroke-width="7" fill="none"/>${planks}</g>
    <g class="ev e-burst" ${at(t, 0.4)}><circle cx="694" cy="400" r="50" fill="none" stroke="#fff" stroke-width="10"/></g>`;
}

function book(cover) {
  return `<div class="bookstage"><img class="ev e-float" src="${cover}" style="--t:0ms;--len:.8s" alt=""></div>`;
}

/* ---------- scenes ---------- */
export function buildFilmScenes() {
  const scenes = [];
  const add = (kind, say, art, panel, extra = {}) => scenes.push({ kind, say, html: `<div class="stage">${art}</div><main>${panel}</main>`, hold: 0.5, ...extra });

  // 1. Hook. Clauses: c0 "Bankrupt là phá sản." c1 "Nhưng nghĩa đen của nó là…" c2 "chiếc bàn bị gãy!"
  add("hook", "{{Bankrupt}} là phá sản. Nhưng nghĩa đen của nó là… chiếc bàn bị gãy!",
    svg(marketBg() + bench("__C2_45__")),
    `<div class="fpanel">
      <div class="fword big ev e-slam" ${at(0, 0.45)}><span style="color:${C.blue}">bank</span><span style="color:${C.orange}">rupt</span></div>
      <div class="fmean ev e-sweep" ${at("__C0_40__", 0.5)}>= phá sản</div>
      <div class="flit ev e-stamp" ${at("__C2_45__", 0.4)}>nghĩa đen: <b>cái bàn bị gãy?!</b></div>
    </div>`, { sfx: "crack", sfxAt: "__C2_45__", shake: "__C2_45__" });

  // 2. The story. c0 "Ở Ý ngày xưa," c1 "người đổi tiền ngồi bên một chiếc bàn." c2 "Banca, nghĩa là cái bàn."
  //    c3 "Tương truyền," c4 "ai vỡ nợ thì bàn bị đập gãy." c5 "Banca rotta," c6 "cái bàn gãy."
  add("story", "Ở Ý ngày xưa, người đổi tiền ngồi bên một chiếc bàn. {{Banca}}, nghĩa là cái bàn. Tương truyền, ai vỡ nợ thì bàn bị đập gãy. {{Banca rotta}}, cái bàn gãy.",
    svg(marketBg() + bench("__C4_70__", { withHammer: true })),
    `<div class="fpanel">
      <div class="ftag ev e-up" ${at(0, 0.4)}>Nước Ý, thế kỷ 15</div>
      <div class="frow ev e-up" ${at("__C2__", 0.45)}><b class="it">banca</b> = cái bàn</div>
      <div class="frow ev e-up" ${at("__C5__", 0.45)}><b class="it">banca <span style="color:${C.orange}">rotta</span></b> = bàn <span style="color:${C.orange}">gãy</span></div>
      <div class="fnote ev e-up" ${at("__C6__", 0.45)}>→ tiếng Anh: <b>bankrupt</b></div>
    </div>`, { sfx: "smash", sfxAt: "__C4_70__", shake: "__C4_70__" });

  // 3. The root. c0 "Rupt nghĩa là gãy," c1 "vỡ." c2 "Nắm gốc này," c3 "bạn đoán được nghĩa của cả một họ từ."
  add("root", "{{Rupt}} nghĩa là gãy, vỡ. Nắm gốc này, bạn đoán được nghĩa của cả một họ từ.",
    svg(twig("__C0_70__")),
    `<div class="fpanel">
      <div class="froot ev e-slam" ${at(0, 0.45)}>rupt</div>
      <div class="forigin ev e-up" ${at("__C0_30__", 0.4)}>Latin <i>rumpere</i></div>
      <div class="fmean ev e-sweep" ${at("__C0_70__", 0.5)}>= gãy, vỡ</div>
      <div class="ffam ev e-up" ${at("__C3__", 0.45)}>${["erupt", "interrupt", "disrupt", "corrupt", "abrupt"].map((w) => `<span>${w.replace("rupt", "<b>rupt</b>")}</span>`).join("")}</div>
    </div>`, { sfx: "snap", sfxAt: "__C0_70__" });

  // 4. erupt. c0 "E nghĩa là ra ngoài." c1 "Vỡ bung ra ngoài." c2 "Erupt, phun trào," c3 "bùng nổ." c4 example
  add("erupt", "{{E}} nghĩa là ra ngoài. Vỡ bung ra ngoài. {{Erupt}}, phun trào, bùng nổ. {{Violence erupted after the election.}}",
    svg(volcano("__C1_30__")),
    wordPanel({ parts: [{ t: "e", k: "pre", vi: "ra ngoài" }, { t: "rupt", k: "root", vi: "vỡ" }], word: "erupt", meaning: "phun trào, bùng nổ",
      en: "Violence erupted after the election.", vi: "Bạo lực bùng phát sau cuộc bầu cử.", tWord: "__C2__", tEx: "__C4__" }),
    { sfx: "boom", sfxAt: "__C1_30__", shake: "__C1_30__" });

  // 5. interrupt. c0 "Inter là ở giữa." c1 "Chen vào giữa," c2 "làm gãy mạch." c3 "Interrupt, ngắt lời." c4 example
  add("interrupt", "{{Inter}} là ở giữa. Chen vào giữa, làm gãy mạch. {{Interrupt}}, ngắt lời. {{Please don't interrupt me while I'm speaking.}}",
    svg(interrupt("__C1_60__")),
    wordPanel({ parts: [{ t: "inter", k: "pre", vi: "ở giữa" }, { t: "rupt", k: "root", vi: "gãy" }], word: "interrupt", meaning: "ngắt lời, cắt ngang",
      en: "Please don't interrupt me while I'm speaking.", vi: "Làm ơn đừng ngắt lời khi tôi đang nói.", tWord: "__C3__", tEx: "__C4__" }),
    { sfx: "clack", sfxAt: "__C1_60__" });

  // 6. disrupt. c0 "Dis là tách ra." c1 "Vỡ tung mỗi mảnh một nơi." c2 "Disrupt, làm gián đoạn," c3 "đảo lộn." c4 example
  add("disrupt", "{{Dis}} là tách ra. Vỡ tung mỗi mảnh một nơi. {{Disrupt}}, làm gián đoạn, đảo lộn. {{The strike disrupted train services nationwide.}}",
    svg(train("__C1_25__")),
    wordPanel({ parts: [{ t: "dis", k: "pre", vi: "tách ra" }, { t: "rupt", k: "root", vi: "vỡ" }], word: "disrupt", meaning: "làm gián đoạn, đảo lộn",
      en: "The strike disrupted train services nationwide.", vi: "Cuộc đình công làm tàu hỏa cả nước bị gián đoạn.", tWord: "__C2__", tEx: "__C4__" }),
    { sfx: "crash", sfxAt: "__C1_25__", shake: "__C1_25__" });

  // 7. corrupt. c0 "Cor là hoàn toàn." c1 "Vỡ nát từ bên trong." c2 "Corrupt, thối nát," c3 "tham nhũng." c4 example
  add("corrupt", "{{Cor}} là hoàn toàn. Vỡ nát từ bên trong. {{Corrupt}}, thối nát, tham nhũng. {{Corrupt officials should be punished severely.}}",
    svg(apple("__C2__")),
    wordPanel({ parts: [{ t: "cor", k: "pre", vi: "hoàn toàn" }, { t: "rupt", k: "root", vi: "vỡ" }], word: "corrupt", meaning: "thối nát, tham nhũng",
      en: "Corrupt officials should be punished severely.", vi: "Quan chức tham nhũng cần bị trừng phạt nặng.", tWord: "__C2__", tEx: "__C4__" }),
    { sfx: "crumble", sfxAt: "__C1_20__" });

  // 8. Quiz. c0 "Thử nhé!" c1 "Ab là rời ra." c2 "Abrupt thì nghĩa là gì?" c3 "Bình luận đáp án của bạn nhé!"
  add("quiz", "Thử nhé! {{Ab}} là rời ra. {{Abrupt}} thì nghĩa là gì? Bình luận đáp án của bạn nhé!",
    svg(bridge("__C2_40__")),
    `<div class="fpanel">
      <div class="ftag orange ev e-stamp" ${at(0, 0.35)}>THỬ THÁCH</div>
      <div class="fq ev e-up" ${at("__C1__", 0.45)}><span style="color:${C.orange}">ab</span> (rời ra) + <span style="color:${C.blue}">rupt</span> (gãy) → <b>abrupt</b> = ?</div>
      <div class="fopts">${["A. đột ngột", "B. chậm rãi", "C. rõ ràng"].map((o, i) => `<div class="fopt ev e-pop" style="--t:__C2_60__ms;--len:.4s;animation-delay:calc(__C2_60__ms + ${i * 150}ms)">${o}</div>`).join("")}</div>
      <div class="fnote ev e-up" ${at("__C3__", 0.4)}>💬 Bình luận đáp án!</div>
    </div>`, { sfx: "snap", sfxAt: "__C2_40__" });

  // 9. Ebook offer (every UpWind post ends with it).
  add("cta", offerSay(), "__BOOK__", `<div class="fpanel">${offerHtml(300)}</div>`, { sfx: "pop", sfxAt: "0" });

  return { scenes, words: [] };
}

/* ---------- frame ---------- */
const filmCss = `
body.film{background:${C.sky1}}
body.film:before{display:none}
.stage{position:absolute;top:196px;left:44px;right:44px;height:820px;border-radius:56px;overflow:hidden;
  box-shadow:0 30px 60px -30px rgba(0,48,102,.55),0 0 0 6px #fff;background:${C.sky2}}
.stage .art{width:100%;height:100%;display:block;animation:push var(--D) linear both}
.stage.shake{animation:shake .45s linear both;animation-delay:var(--sh)}
body.film main{top:1036px;height:404px;left:60px;right:60px}
.ev{animation-fill-mode:both;animation-duration:var(--len,.5s);animation-delay:calc(var(--t,0ms));transform-box:view-box}
.drift{animation:drift var(--D) linear both}
.bob{animation:bob calc(var(--D) / 6) ease-in-out 6 alternate both}.bob2{animation:bob calc(var(--D) / 7) ease-in-out 7 alternate both}
.flowline{animation:dash var(--D) linear both}
.roll{animation:roll var(--D) linear both}
@keyframes push{from{transform:scale(1)}to{transform:scale(1.07)}}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(60px)}}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-12px)}}
@keyframes dash{from{stroke-dashoffset:0}to{stroke-dashoffset:-600}}
@keyframes roll{from{transform:translateX(-120px)}to{transform:translateX(40px)}}

/* event animations (each runs once at --t) */
.e-pop{animation-name:fpop;animation-timing-function:cubic-bezier(.2,.9,.3,1.4)}
.e-up{animation-name:fup;animation-timing-function:cubic-bezier(.32,.72,0,1)}
.e-slam{animation-name:fslam;animation-timing-function:cubic-bezier(.3,.7,.3,1)}
.e-stamp{animation-name:fstamp;animation-timing-function:cubic-bezier(.3,.7,.3,1.3)}
.e-out{animation-name:fout;animation-timing-function:ease-in}
.e-sweep{animation-name:fsweep;animation-timing-function:ease-out}
.e-burst{animation-name:fburst;animation-timing-function:ease-out;transform-box:fill-box;transform-origin:center;opacity:0}
.e-tipL{animation-name:tipL;animation-timing-function:cubic-bezier(.5,0,.6,1.4);transform-origin:300px 630px}
.e-tipR{animation-name:tipR;animation-timing-function:cubic-bezier(.5,0,.6,1.4);transform-origin:680px 630px}
.e-fly{animation-name:fly;animation-timing-function:cubic-bezier(.2,.6,.4,1)}
.e-hammer{animation-name:hammer;animation-timing-function:cubic-bezier(.6,0,.9,.6);transform-origin:490px 80px}
.e-bendL{animation-name:bendL;animation-timing-function:ease-in;transform-origin:490px 401px}
.e-bendR{animation-name:bendR;animation-timing-function:ease-in;transform-origin:490px 401px}
.e-snapL{animation-name:snapL;animation-timing-function:cubic-bezier(.3,1.3,.5,1);transform-origin:205px 401px}
.e-snapR{animation-name:snapR;animation-timing-function:cubic-bezier(.3,1.3,.5,1);transform-origin:775px 401px}
.e-arc{animation-name:arc;animation-timing-function:linear;opacity:0}
.e-smoke{animation-name:smoke;animation-timing-function:ease-out;transform-box:fill-box;transform-origin:center;opacity:0}
.e-flow{animation-name:flow;animation-timing-function:ease-out;stroke-dasharray:1;stroke-dashoffset:1}
.e-glow{animation-name:glow;animation-timing-function:ease-in;transform-box:fill-box;transform-origin:center}
.e-cut{animation-name:fout;animation-timing-function:ease-in}
.e-ends{animation-name:fin;animation-timing-function:ease-out}
.e-dropin{animation-name:dropin;animation-timing-function:cubic-bezier(.5,0,.6,1.5)}
.e-scatter{animation-name:scatter;animation-timing-function:cubic-bezier(.2,.7,.4,1)}
.e-crumble{animation-name:crumble;animation-timing-function:ease-in;transform-origin:490px 600px}
.e-rot{animation-name:fin;animation-timing-function:ease-in;opacity:0}
.e-draw{animation-name:draw;animation-timing-function:ease-out;stroke-dasharray:1;stroke-dashoffset:1}
.e-fall{animation-name:fall;animation-timing-function:cubic-bezier(.5,0,.8,.6);opacity:0}
.e-swing{animation-name:swing;animation-timing-function:cubic-bezier(.5,0,.4,1.3);transform-origin:286px 380px}
.e-float{animation-name:fup;animation-timing-function:cubic-bezier(.32,.72,0,1)}
@keyframes fpop{from{transform:scale(.2);opacity:0}to{transform:none;opacity:1}}
@keyframes fup{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
@keyframes fslam{0%{transform:scale(2.6);opacity:0}65%{transform:scale(.95);opacity:1}100%{transform:none;opacity:1}}
@keyframes fstamp{0%{transform:rotate(-8deg) scale(2.4);opacity:0}70%{transform:rotate(2deg) scale(.96);opacity:1}100%{transform:none;opacity:1}}
@keyframes fout{from{opacity:1;transform:none}to{opacity:0;transform:scale(.85)}}
@keyframes fin{from{opacity:0}to{opacity:1}}
@keyframes fsweep{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes fburst{0%{opacity:0;transform:scale(.2)}25%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1.5)}}
@keyframes tipL{from{transform:none}to{transform:rotate(-16deg) translate(-30px,20px)}}
@keyframes tipR{from{transform:none}to{transform:rotate(16deg) translate(30px,20px)}}
@keyframes fly{from{transform:none}to{transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}
@keyframes hammer{from{transform:rotate(-75deg)}to{transform:none}}
@keyframes bendL{from{transform:none}to{transform:rotate(7deg)}}
@keyframes bendR{from{transform:none}to{transform:rotate(-7deg)}}
@keyframes snapL{from{transform:none}to{transform:rotate(-22deg) translate(-20px,60px)}}
@keyframes snapR{from{transform:none}to{transform:rotate(22deg) translate(20px,60px)}}
@keyframes arc{0%{opacity:1;transform:none}50%{transform:translate(calc(var(--dx) * .5),var(--dy))}100%{opacity:1;transform:translate(var(--dx),calc(var(--dy) * -.2 + 300px))}}
@keyframes smoke{0%{opacity:0;transform:scale(.3)}30%{opacity:.9}100%{opacity:.75;transform:translateY(-180px) scale(1.9)}}
@keyframes flow{to{stroke-dashoffset:0}}
@keyframes glow{from{transform:scale(1);opacity:.6}to{transform:scale(1.5);opacity:1}}
@keyframes dropin{from{transform:translateY(-500px)}to{transform:none}}
@keyframes scatter{from{transform:none}to{transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}
@keyframes crumble{0%{transform:none;opacity:1}100%{transform:scaleY(.15) scaleX(1.15);opacity:0}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes fall{0%{opacity:0;transform:none}10%{opacity:1}100%{opacity:1;transform:translate(var(--dx),180px)}}
@keyframes swing{0%{transform:none}100%{transform:rotate(78deg)}}

/* text panel */
.fpanel{width:100%;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px}
.fswap{position:relative;height:136px;width:100%;display:flex;align-items:center;justify-content:center}
.fswap>*{position:absolute}
.ftiles{display:flex;align-items:center;gap:18px}
.ftile{display:flex;flex-direction:column;align-items:center;background:#fff;border:6px solid var(--c);border-radius:26px;padding:4px 28px 10px;
  box-shadow:0 10px 0 color-mix(in srgb,var(--c) 25%,transparent)}
.ftile b{font-size:84px;line-height:1.05;color:var(--c);font-weight:800}
.ftile span{font-size:30px;font-weight:700;color:${C.ink2}}
.fplus{font-size:70px;font-weight:800;color:#9fb3c8}
.fword{font-size:122px;font-weight:800;letter-spacing:-2px;line-height:1}
.fword.big{font-size:150px}
.fmean{font-size:62px;font-weight:800;color:${C.ink};background:${C.yellow};border-radius:20px;padding:4px 28px}
.flit{font-size:52px;font-weight:700;color:${C.ink2}}.flit b{color:${C.orange}}
.fex .en{font-size:40px;font-weight:700;line-height:1.25;color:${C.ink};text-wrap:balance}
.fex .vi{font-size:30px;color:${C.ink2};margin-top:6px;text-wrap:balance}
mark{background:#fff3b0;color:${C.ink};padding:0 8px;border-radius:10px}
.ftag{font-size:38px;font-weight:800;color:#fff;background:${C.blue};border-radius:999px;padding:8px 28px}
.ftag.orange{background:${C.orange};border-radius:14px}
.frow{font-size:64px;font-weight:700;color:${C.ink}}.frow .it{font-family:Lora,Georgia,serif;font-style:italic;color:${C.blue}}
.fnote{font-size:44px;font-weight:700;color:${C.ink2}}.fnote b{color:${C.blue}}
.froot{font-size:136px;font-weight:800;color:#fff;background:${C.blue};border-radius:36px;padding:0 50px;line-height:1.15}
.forigin{font-size:40px;color:${C.ink2}}
.ffam{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
.ffam span{font-size:34px;font-weight:700;color:${C.ink2};background:#fff;border:3px solid ${C.sky2};border-radius:16px;padding:4px 16px}
.ffam b{color:${C.blue}}
.fq{font-size:42px;font-weight:700;color:${C.ink}}.fq b{color:${C.ink};font-size:60px}
.fopts{display:flex;gap:18px}
.fopt{font-size:42px;font-weight:800;background:#fff;border:5px solid ${C.blue};border-radius:20px;padding:8px 22px;color:${C.ink}}
.bookstage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(600px 500px at 50% 45%,#fff 0%,${C.sky2} 70%)}
.bookstage img{width:440px;border-radius:16px;box-shadow:0 40px 70px -20px rgba(0,30,60,.55);transform:rotate(-4deg)}
body.film .offer{margin-top:0}
body.film .offer-book{display:none}
body.film .offer{padding:28px 40px}
`;

/** Replace the timing placeholders with real milliseconds, from the scene's narration timing. */
export function resolveTimes(text, scene, durMs) {
  const starts = scene.__starts ?? [0];
  const lens = scene.__lens ?? [durMs];
  const clause = (c, pct = 0) => {
    const i = Math.min(c, starts.length - 1);
    return Math.round(starts[i] + (lens[i] ?? 0) * (pct / 100));
  };
  return text
    .replace(/__D__/g, String(Math.round(durMs)))
    .replace(/__C(\d+)(?:_(\d+))?__([+-]\d+)?/g, (_, c, p, off) => String(clause(+c, +(p ?? 0)) + (off ? +off : 0)))
    .replace(/(--t:|calc\()(\d+)([+-]\d+)ms/g, (_, a, n, off) => `${a}${+n + +off}ms`);
}

export function filmFrameHtml({ family, scene, logo, durMs, cover }) {
  let html = scene.html.replace("__BOOK__", book(cover));
  html = resolveTimes(html, scene, durMs);
  const shake = scene.shake != null ? resolveTimes(String(scene.shake), scene, durMs) : null;
  if (shake != null) html = html.replace('<div class="stage">', `<div class="stage shake" style="--sh:${shake}ms">`);
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">${FONT_LINK}
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@1,600&display=block" rel="stylesheet">
<style>${baseCss()}${filmCss}</style></head><body class="video film" style="--D:${Math.round(durMs)}ms">
${wave()}
${header({ root: family.root }, logo, { series: "Học từ từ gốc", chip: family.root })}
${html}
${lottieScripts("")}
</body></html>`;
}

export function filmCaption(f) {
  return [
    `🤯 Bankrupt (phá sản) nghĩa đen là... cái bàn bị gãy!`,
    "",
    `📚 Học từ từ gốc | ${f.root} (${f.origin}) = ${f.core}`,
    "• bankrupt: phá sản (banca rotta = cái bàn gãy)",
    "• erupt: phun trào, bùng nổ (e = ra ngoài)",
    "• interrupt: ngắt lời (inter = ở giữa)",
    "• disrupt: làm gián đoạn, đảo lộn (dis = tách ra)",
    "• corrupt: thối nát, tham nhũng (cor = hoàn toàn)",
    "",
    "❓ Thử thách: abrupt nghĩa là gì? Bình luận đáp án!",
    "",
    "💾 Lưu lại để ôn · Theo dõi UpWind: mỗi ngày 1 họ từ",
    '🎁 UpWind có ebook "Học Từ, Từ Gốc": 40 gốc từ · 252 từ IELTS · bài tập có đáp án.',
    '👉 Muốn một bản? Bình luận "GỐC TỪ", UpWind gửi bạn link vào cộng đồng để nhận ebook này và nhiều tài liệu khác.',
    `#hoctututugoc #upwind #goctu #ielts #tuvungtienganh #hoctienganh #${f.id}`,
    "",
    "--- Bình luận ghim (đáp án thử thách) ---",
    `Đáp án: ${f.quizAnswer}`,
  ].join("\n");
}
