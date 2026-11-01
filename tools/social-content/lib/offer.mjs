// The ebook offer used as the call to action in every series: comment the keyword, get the community link.
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, esc } from "./common.mjs";
import { icon, UI_ICONS as UI } from "./icons.mjs";

export const OFFER = {
  keyword: "GỐC TỪ",
  book: "Học Từ, Từ Gốc",
  pitch: "40 gốc từ · 252 từ IELTS · bài tập có đáp án",
};

/** Caption lines (post text). */
export const offerCaption = () => [
  `🎁 UpWind có ebook "${OFFER.book}": ${OFFER.pitch}.`,
  `👉 Muốn một bản? Bình luận "${OFFER.keyword}", UpWind gửi bạn link vào cộng đồng để nhận ebook này và nhiều tài liệu khác.`,
];

/** Narration line (English marked with {{ }} so the voice reads it as English). */
export const offerSay = () =>
  `Muốn có cuốn {{ebook}} ${OFFER.book}? Bình luận chữ ${OFFER.keyword}, UpWind gửi bạn link vào cộng đồng để nhận {{ebook}} và nhiều tài liệu khác nhé!`;

const thumbFile = path.join(ROOT_DIR, "assets", "ebook", "cover-thumb.jpg");
const thumb = fs.existsSync(thumbFile) ? "data:image/jpeg;base64," + fs.readFileSync(thumbFile).toString("base64") : "";

/** The offer card shown on the last slide / last scene. `d` = animation delay in ms. */
export function offerHtml(d = 1300) {
  return `<div class="offer a-up" style="--d:${d}ms">
    ${thumb ? `<img class="offer-book" src="${thumb}" alt="">` : ""}
    <div class="offer-text">
      <div class="offer-kick">Muốn 1 bản ebook này?</div>
      <div class="offer-cta">${icon(UI.comment, 54, 2.2)} Bình luận <b>${esc(OFFER.keyword)}</b></div>
      <div class="offer-sub">UpWind gửi link vào cộng đồng: nhận ebook <b>${esc(OFFER.book)}</b> và nhiều tài liệu khác</div>
    </div>
  </div>`;
}
