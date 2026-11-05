// Error codes, in the teacher's own words. E1–E6 come from the Homework 2 self-reflection table,
// T0–T7 from the Class 4 slides (Listening: Multiple Choice, "Distractors"). BLANK was added for
// questions left empty. Students only ever see `name` and `fix`, never the code.

export interface ErrorCode {
  code: string;
  name: string;
  fix: string;
}

export const CODES: ErrorCode[] = [
  { code: "E1", name: "Biết từ nhưng nghe không ra", fix: "Nghe lại 5 giây quanh đáp án 3–5 lần, chép lại mọi từ nghe được rồi so với transcript." },
  { code: "E2", name: "Không biết từ này", fix: "Ghi cả cụm từ trong bài vào sổ từ vựng (nghĩa, chủ đề), thêm 1 từ đồng nghĩa." },
  { code: "E3", name: "Lạc chỗ, để lỡ đáp án", fix: "Gạch 1–2 từ khoá mỗi câu trước khi làm và theo dõi 2 câu cùng lúc." },
  { code: "E4", name: "Bị bẫy: thông tin bị đổi ở sau", fix: "Chờ người nói chốt rồi mới ghi; để ý \"actually / sorry, I mean / already booked\"." },
  { code: "E5", name: "Hiểu đúng nhưng viết sai (chính tả, -s, loại từ, số từ, ghi nhầm chữ cái)", fix: "Trước khi nộp kiểm tra: số từ → ngữ pháp → số ít/nhiều → chính tả → chữ cái đã ghi đúng ô." },
  { code: "E6", name: "Đoán sai loại từ cần điền", fix: "Trước khi làm, ghi loại từ cho từng chỗ trống: danh từ / động từ / tính từ / số, số ít hay số nhiều." },
  { code: "T0", name: "Chọn ý mà bài không hề nói", fix: "Chỉ chọn khi tìm được câu chứng minh trong bài; không tìm được thì loại." },
  { code: "T1", name: "Thông tin đúng nhưng không trả lời câu hỏi, hoặc nằm ở đoạn khác", fix: "Đọc lại câu hỏi đang hỏi gì (lý do, kết quả, mục đích…) và kiểm tra đúng đoạn đang nói." },
  { code: "T2", name: "Đúng nội dung nhưng nhầm người", fix: "Ghi tên người nói / người được nhắc cạnh mỗi ý." },
  { code: "T3", name: "Nhầm giữa nhiều số, tên, địa điểm", fix: "Khi nghe hoặc đọc danh sách, ghi từng chi tiết cạnh đúng mục của nó." },
  { code: "T4", name: "Nhầm thời điểm (trước đây / bây giờ)", fix: "Để ý \"used to, originally, at first, now\"." },
  { code: "T5", name: "Sai mức độ (only, mainly, all / some, might)", fix: "Gạch chân từ chỉ mức độ trong câu hỏi và so với câu trong bài." },
  { code: "T6", name: "Đúng sự việc nhưng sai đánh giá (khó ↔ dễ, khen ↔ chê)", fix: "Để ý \"surprisingly, turned out, not as … as I expected\"." },
  { code: "T7", name: "Bị lật lại ở cuối (but, actually, phủ định, đổi ý)", fix: "Chờ hết ý mới chọn; nghe tiếp sau \"but / actually / no wait\"." },
  { code: "BLANK", name: "Bỏ trống hoặc quên ghi đáp án", fix: "Không bao giờ để trống: luôn đoán một đáp án và ghi vào ô Your answer." },
];

export const codeInfo = (code?: string) => CODES.find((c) => c.code === code);
