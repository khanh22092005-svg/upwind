// Shared by the "Nâng band câu này" carousel (make-upgrade.mjs) and video (make-video.mjs --series writing).
// Data: data/upgrades.json. Rules for writing it: docs/nang-band.md.
import fs from "node:fs";
import { offerCaption } from "./offer.mjs";
import path from "node:path";
import { ROOT_DIR, esc } from "./common.mjs";

export const BAND = { 5: "#b42318", 6: "#2b8fc4", 7: "#004b9b" };

// Same four tags the teacher uses when grading essays. LR/GRA are accepted as aliases.
export const CRIT = {
  TR: ["TR", "Trả lời đề", "#7a4cc2"],
  CC: ["CC", "Mạch lạc", "#1a9c5b"],
  LX: ["LX", "Từ vựng", "#004b9b"],
  GR: ["GR", "Ngữ pháp", "#2b8fc4"],
};
const ALIAS = { LR: "LX", GRA: "GR", TA: "TR" };
/** criterion: "LX" | ["LX","GR"] (max two, main one first). */
export const tags = (c) => [c ?? "LX"].flat().slice(0, 2).map((t) => CRIT[ALIAS[t] ?? t] ?? CRIT.LX);
export const chips = (c) =>
  tags(c).map(([tag, name, col]) => `<span class="crit" style="--c:${col}">${tag} · ${name}</span>`).join("");
/** "Mạch lạc, Từ vựng và Ngữ pháp" from every criterion used in a set. */
export function critNames(set) {
  const items = set.levels.flatMap((l) => [...(l.moves ?? []), ...(l.problems ?? [])]);
  const used = new Set(items.flatMap((m) => tags(m.criterion).map((t) => t[0])));
  const names = Object.values(CRIT).filter(([t]) => used.has(t)).map(([, n]) => n);
  return names.length > 1 ? names.slice(0, -1).join(", ") + " và " + names.at(-1) : names[0] ?? "Từ vựng";
}

export const plainText = (t) => t.replace(/\[\[|\]\]|\{\{|\}\}/g, "");
export const bandPill = (b, big = false) => `<span class="bandpill${big ? " big" : ""}" style="--b:${BAND[b]}">Band ${b}</span>`;

const words = (t) => (t.toLowerCase().match(/[a-z']+/g) ?? []).map((w) => w.replace(/^'|'$/g, ""));
/** Indices of the marked spans ([[…]] / {{…}}) in `text` that a problem/move phrase points at. */
export function spansFor(text, phrase) {
  const want = new Set(words(phrase));
  const out = [];
  let i = 0;
  for (const m of text.matchAll(/\[\[(.+?)\]\]|\{\{(.+?)\}\}/g)) {
    const w = words(m[1] ?? m[2]);
    if (w.length && w.every((x) => want.has(x))) out.push(i);
    i++;
  }
  return out;
}

/** [[up]] -> highlight, {{weak}} -> red wavy underline. `active`: span indices to emphasise (video). */
export function markup(t, active = null) {
  let i = 0;
  const cls = () => (active ? (active.includes(i++) ? " on" : " off") : "");
  return esc(t).replace(/\[\[(.+?)\]\]|\{\{(.+?)\}\}/g, (_, up, bad) =>
    up != null ? `<mark class="up${cls()}">${up}</mark>` : `<span class="bad${cls()}">${bad}</span>`,
  );
}

/* ---------- narration ---------- */
/** Explanation text -> narration: “English” becomes {{English}} (voiced/marked as English). */
export const sayText = (t) =>
  t
    .replace(/[“"]([^”"]+)[”"]/g, (_, x) => `{{${x.replace(/…/g, "").trim()}}}`)
    .replace(/\s*→\s*/g, ", thành ")
    .replace(/\s+\/\s+/g, " hoặc ")
    .replace(/…/g, "")
    .trim();
/** A phrase as it is said aloud: ", you" -> {{you}}, "you / don't" -> {{you}} và {{don't}}. */
export const sayPhrase = (p) =>
  p
    .split(/\s*(?:\/|…)\s*/)
    .map((x) => x.replace(/^[\s,.;:]+|[\s,.;:]+$/g, ""))
    .filter(Boolean)
    .map((x) => `{{${x}}}`)
    .join(" và ");
/** Make sure a line ends in a full stop before the next one is appended. */
export const stop = (t) => (/[.!?]$/.test(t.trim()) ? t.trim() : t.trim().replace(/[…:]+$/, "") + ".");

/* ---------- data ---------- */
export const loadUpgrades = () => JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "upgrades.json"), "utf8"));
/** Next set in file order (post them in that order so the "Tập sau" teaser is kept). */
export const nextSet = (sets, set) => sets[sets.indexOf(set) + 1] ?? null;

/** Post text + pinned comment, shared by the carousel and the video. */
export function upgradeCaption(set, next = null) {
  const [b5, b6, b7] = set.levels;
  return [
    `✍️ Nâng band câu này | ${set.topic}`,
    "",
    `${stop(set.hook)} Sửa ${b5.problems.length} chỗ là lên band 7 👇`,
    "",
    `🔴 Band 5: ${plainText(b5.text)}`,
    `🔵 Band 6: ${plainText(b6.text)}`,
    `🔷 Band 7: ${plainText(b7.text)}`,
    "",
    "🧰 Công cụ:",
    ...set.toolkit.map((t) => `• ${t.formula}: ${t.use}`),
    "",
    `✏️ Đến lượt bạn: "${set.practice.sentence}" Viết bản band 7 vào bình luận nhé!`,
    "",
    `(Band chấm theo cả bài; đây là câu kiểu band 5/6/7 theo tiêu chí ${critNames(set)}.)`,
    ...(next ? [`⏭️ Tập sau: ${next.hook}`] : []),
    "💾 Lưu lại · Theo dõi UpWind: mỗi tuần 1 câu",
    "",
    ...offerCaption(),
    "#nangbandcaunay #ieltswriting #upwind #ielts #hoctienganh",
    "",
    "--- Bình luận ghim (đáp án mẫu) ---",
    `Band 6: ${set.practice.answer6}`,
    `Band 7: ${set.practice.answer7}`,
  ].join("\n");
}
