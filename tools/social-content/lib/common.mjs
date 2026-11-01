// Shared helpers for the word-root video + handbook generators.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const OUT_DIR = path.join(ROOT_DIR, "out");

export const COLORS = { pre: "#f2711c", root: "#004b9b", suf: "#1a9c5b" };
export const KIND_VI = { pre: "tiền tố", root: "gốc từ", suf: "hậu tố" };

export function loadFamilies(file = path.join(ROOT_DIR, "data", "families.json")) {
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const f of list) {
    if (!f.id || !f.root || !Array.isArray(f.words) || !f.words.length) {
      throw new Error(`Family ${f.id ?? "?"} is missing id/root/words`);
    }
    for (const w of f.words) {
      const joined = w.parts.map((p) => p.t.replace(/[()]/g, "")).join("");
      if (joined.toLowerCase() !== w.word.toLowerCase().replace(/[()]/g, "") && !w.parts.some((p) => p.t.includes("("))) {
        console.warn(`  ! ${f.id}/${w.word}: parts join to "${joined}"`);
      }
    }
  }
  return list;
}

export const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** "Vì vậy {{evoke}} nghĩa là..." -> [{lang:"vi",text:"Vì vậy"},{lang:"en",text:"evoke"},...] */
export function chunks(text) {
  const out = [];
  const re = /\{\{(.+?)\}\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ lang: "vi", text: text.slice(last, m.index) });
    out.push({ lang: "en", text: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ lang: "vi", text: text.slice(last) });
  return out.map((c) => ({ ...c, text: c.text.trim() })).filter((c) => /[\p{L}\p{N}]/u.test(c.text));
}

/** Plain caption text: strip the {{ }} markers. */
export const plain = (text) => text.replace(/\{\{(.+?)\}\}/g, "$1");

/** Colour-coded word: prefix orange, root blue, suffix green. */
export function coloredWord(w) {
  return w.parts.map((p) => `<span style="color:${COLORS[p.k]}">${esc(p.t)}</span>`).join("");
}

/** Example sentence with the target word (or its inflected form) highlighted. */
export function highlight(sentence, word) {
  const stem = word.replace(/e$/, "").slice(0, Math.max(4, word.length - 2));
  const re = new RegExp(`\\b(${stem}[a-z]*)`, "i");
  return esc(sentence).replace(re, "<mark>$1</mark>");
}

/** Sentence with the target word blanked out, for quizzes. */
export function blank(sentence, word) {
  const stem = word.replace(/e$/, "").slice(0, Math.max(4, word.length - 2));
  return sentence.replace(new RegExp(`\\b${stem}[a-z]*`, "i"), "_____");
}

export const ensureDir = (d) => fs.mkdirSync(d, { recursive: true });

/** Post text for Facebook / TikTok / Instagram, with the quiz answer as a ready-to-pin comment. */
/** The family the end-of-video teaser points to: `next` in the data, else the next one in file order. */
export function nextFamily(families, f) {
  if (f.next) {
    const hit = families.find((x) => x.id === f.next);
    if (hit) return hit;
    console.warn(`  ! ${f.id}: next "${f.next}" not found, using file order`);
  }
  return families[(families.indexOf(f) + 1) % families.length];
}

/** One line teasing the next video (next family, or the next part of a split family). */
export function nextLine(next, part) {
  if (part?.hasNext) return `👉 Phần ${part.n + 1} lên sóng ngay sau. Theo dõi để không bỏ lỡ!`;
  if (!next) return "";
  return `👉 Tập sau: gốc ${next.root.split("/")[0].trim()} (${next.core}). Theo dõi để học 1 họ từ mỗi ngày!`;
}

/* Ebook offer lines (kept here, not imported from offer.mjs, to avoid a circular import). */
const OFFER_LINES = [
  '🎁 UpWind có ebook "Học Từ, Từ Gốc": 40 gốc từ · 252 từ IELTS · bài tập có đáp án.',
  '👉 Muốn một bản? Bình luận "GỐC TỪ", UpWind gửi bạn link vào cộng đồng để nhận ebook này và nhiều tài liệu khác.',
];
export function captionText(family, words, quizAnswer, part, next) {
  const partLabel = part ? ` (Phần ${part.n})` : "";
  const nForms = words.reduce((n, w) => n + 1 + (w.related?.length ?? 0), 0);
  const bait = family.bait ? `🤯 Ít ai biết: ${family.bait.word} nghĩa đen là... ${family.bait.literal}!\n` : "";
  return [
    `📚 Học từ từ gốc | ${family.root.split("/")[0].trim()}${partLabel}`,
    "",
    `${bait}👉 1 gốc ${family.root.split("/")[0].trim()} = ${nForms} từ IELTS. ${plain(family.hook)}`,
    "",
    `Gốc "${family.root}" (${family.origin}) = ${family.core}`,
    ...words.map((w) => `• ${w.word} (${w.pos}): ${w.meaning}${(w.related ?? []).map((r) => ` | ${r.w} (${r.pos}): ${r.vi}`).join("")}`),
    "",
    "💾 Lưu lại để ôn · Theo dõi UpWind: mỗi ngày 1 họ từ",
    nextLine(next, part),
    "",
    ...OFFER_LINES,
    `#hoctututugoc #upwind #goctu #ielts #tuvungtienganh #hoctienganh #${family.id}`,
    "",
    "--- Bình luận ghim (đáp án thử thách) ---",
    `Đáp án: ${quizAnswer}`,
  ].join("\n");
}
