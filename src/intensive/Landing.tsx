import React, { useEffect, useState } from "react";
import teacherThuImg from "@assets/teacher-1.jpg";
import teacherPhuongImg from "@assets/teacher-2.jpg";
import markReversed from "@assets/mark-reversed.svg";
import {
  Accordion, Button, Checkbox, Dialog, Doodle, Eyebrow, Footer, Highlight, Input, NavBar, Pill, Select,
  Squiggle, Sticker, StickyBar, TeacherCard, WaveDivider,
} from "./ui";

const ZALO_URL = "https://zalo.me/84375810412";
const SEATS_LEFT = 2;

const WRAP: React.CSSProperties = { position: "relative", maxWidth: 1240, margin: "0 auto", padding: "0 clamp(20px,4vw,32px)" };
const SERIF: React.CSSProperties = { fontFamily: "var(--font-serif)", fontWeight: 600 };
const H2: React.CSSProperties = { ...SERIF, fontSize: "clamp(30px,4.2vw,50px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: "20px 0 0" };
const LABEL: React.CSSProperties = { fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" };
const GLASS = "oklch(1 0 0 / 0.08)";

const bands = ["Chưa thi bao giờ", "Dưới 5.0", "5.0", "5.5", "6.0", "6.5", "Trên 6.5"];

const pains = [
  { tag: "Writing", q: "\"Viết xong không biết mình sai ở đâu.\"" },
  { tag: "Speaking", q: "\"Vào Speaking là não trống rỗng.\"" },
  { tag: "Cả hai", q: "\"Mãi kẹt ở 5.5–6.5, AI chấm mỗi nơi một điểm.\"" },
];

const loop = [
  { n: "1", t: "Diagnose", d: "Giảng viên đọc bài và tìm ra lỗi đang kéo điểm bạn xuống nhiều nhất.", who: "Giảng viên · trong 48 giờ" },
  { n: "2", t: "Prescribe", d: "Bài hôm sau được chọn để gỡ đúng lỗi đó, không phải một đề ngẫu nhiên.", who: "Giảng viên" },
  { n: "3", t: "Practise", d: "Bạn làm bài lúc nào tiện, nhớ liếc lại Error log trước khi nộp.", who: "Bạn · mỗi ngày" },
  { n: "4", t: "Re-assess", d: "Lỗi đó còn quay lại không? Nếu hết, mình cùng chuyển sang lỗi tiếp theo.", who: "Giảng viên và bạn" },
];

const sessions = [
  { s: "S1 · Writing", t: "Examiner-lens Marking" },
  { s: "S3 · Writing", t: "Rapid Idea Generation" },
  { s: "S5 · Writing", t: "Timed Full Mock" },
  { s: "S2 · Speaking", t: "Idea Expansion for Part 3" },
  { s: "S4 · Speaking", t: "Natural Expression & Reuse" },
  { s: "S6 · Speaking", t: "Full Mock with Examiner" },
];

const dailyFocus = ["Gỡ 3 lỗi từ test đầu vào", "Lỗi mới trong sổ, đề khó hơn", "Bài trọn vẹn, bấm giờ thật"];

const diagnosis = [
  { k: "Tuần 0", t: "Test đầu vào, lập lộ trình riêng" },
  { k: "Giữa khóa", t: "Xem lại Error log, chỉnh lộ trình" },
  { k: "Cuối khóa", t: "Test lại, so với tuần 0" },
];

const intensiveSteps = [
  { k: "Trước buổi · 1 tuần", t: "Đọc lại Error log", d: "Giảng viên xem lại lỗi lặp nhiều nhất của từng bạn trong 2 tuần qua." },
  { k: "Trước buổi · 2 ngày", t: "Soạn session plan riêng", d: "Chọn kiến thức cần bổ sung, lỗi cần break down và bài luyện cho từng bạn. Không dùng giáo án chung." },
  { k: "Trong buổi", t: "Bổ sung kiến thức, break down lỗi, luyện tập", d: "Giảng viên dạy phần kiến thức bạn còn thiếu, cùng bạn break down từng lỗi để hiểu vì sao sai, rồi luyện lại ngay dưới áp lực thời gian." },
  { k: "Sau buổi", t: "Cập nhật Error log và lộ trình", d: "Lỗi đã sửa được gạch đi, bài mỗi ngày của 2 tuần tới được kê lại theo kết quả buổi học." },
];

const mentoringSteps = [
  { k: "Bất kỳ lúc nào", t: "Bạn nộp bài", d: "Một bài Writing hoặc một bản ghi Speaking." },
  { k: "Trong 48 giờ", t: "Giảng viên chấm", d: "Điểm theo 4 tiêu chí, ghi chú tới từng câu, chỉ ra từng lỗi từ nhỏ đến lớn." },
  { k: "Ngay sau khi chấm", t: "Lỗi vào Error log", d: "Các lỗi được theo dõi kỹ trong từng bài, để thiết kế bài học và bài tập." },
  { k: "Khi lỗi hết lặp", t: "Gạch khỏi Error log", d: "Bạn thấy rõ mình đã tiến bộ thế nào." },
];

const activeSteps = [
  { k: "Tuần 0", t: "Placement test", d: "Kết quả test thành lộ trình 90 ngày của riêng bạn." },
  { k: "Mỗi tuần", t: "Nhận bài của từng ngày", d: "Bài được cá nhân hóa theo các lỗi trong Error log." },
  { k: "Lúc nào tiện", t: "Làm bài 30–45 phút", d: "Đọc lại Error log trước khi nộp, dùng tài liệu và phần mềm khi cần." },
  { k: "Sau khi chấm", t: "Bài hôm sau được kê lại", d: "Lỗi còn lặp thì luyện tiếp, hết thì chuyển sang lỗi khác." },
];

const t1Badges = ["IELTS 8.0", "Đội tuyển Quốc gia 2022"];
const t1Bullets = ["Cựu Chuyên Anh, Chuyên Lê Quý Đôn (Khánh Hòa)", "3 năm dạy nhóm nhỏ, 20+ học sinh đạt aim >6.5"];
const t2Badges = ["IELTS 8.0", "HSG Thành phố 2021, 2022"];
const t2Bullets = ["Cựu Chuyên Anh, Chuyên Vĩnh Phúc", "4 năm tutor 1-1, 15+ học sinh đạt aim >6.5"];

const fitYes = ["Writing hoặc Speaking đang quanh 5.0–6.5, muốn lên thêm 0.5–1.0", "Đã học trung tâm hay tự ôn mà điểm vẫn chưa nhích", "Có 30–45 phút mỗi ngày cho bài luyện"];
const fitNo = ["Đang dưới 5.0, cần ôn lại ngữ pháp và từ vựng từ gốc", "Cần học cả Reading và Listening", "Muốn lên lớp mỗi tuần và được giảng bài"];

const priceItems = [
  "Test đầu vào và lộ trình 90 ngày riêng",
  "6 buổi Intensive nhóm 3 người: 3 Writing, 3 Speaking",
  "Chấm chữa không giới hạn, giảng viên 8.0 trả bài trong 48 giờ",
  "Error log cá nhân cho Writing và Speaking",
  "Tài liệu và phần mềm luyện phản xạ ở nhà",
];

const faq = [
  { q: "6 buổi có đủ không?", a: "Mỗi buổi Intensive gồm bổ sung kiến thức, break down lỗi và luyện tập, còn giữa các buổi bạn vẫn được chấm chữa mỗi ngày. Mỗi buổi chỉ 3 người nên bạn được nói và được chữa nhiều hơn một lớp đông, và không có tuần nào bạn luyện mà không ai sửa." },
  { q: "Không giới hạn là bao nhiêu bài?", a: "Bạn nộp bao nhiêu, tụi mình chấm bấy nhiêu, bài nào cũng trả trong 48 giờ. Để chất lượng chấm luôn đều, mỗi ngày bạn nộp tối đa 1 bài Writing và 1 bản ghi Speaking." },
  { q: "Ai chấm bài, giảng viên hay AI?", a: "Giảng viên. Hai giảng viên IELTS 8.0 đọc và sửa từng bài. Phần mềm chỉ dùng cho bài luyện phản xạ ở nhà, không dùng để chấm điểm." },
  { q: "Học 1 tháng thấy không hợp thì sao?", a: "Bạn dừng lại và không trả 50% còn lại. Không cần giải thích lý do." },
  { q: "Lịch học thế nào?", a: "Bài hằng ngày bạn tự chọn giờ làm. 6 buổi Intensive chốt theo lịch chung của nhóm 3 người, khoảng 2 tuần một buổi." },
  { q: "Test đầu vào gồm gì? Mình đang dưới 5.0 thì sao?", a: "Miễn phí, làm online: 1 bài Writing Task 2 và 1 bản ghi Speaking. Trong 48 giờ bạn nhận lại bài chấm và 3 lỗi nặng nhất. Nếu bài test cho thấy bạn cần học lại từ gốc, tụi mình sẽ nói thật và gợi ý hướng khác." },
];

const footerLinks = [
  { label: "Zalo", href: ZALO_URL, external: true },
  { label: "Facebook", href: "#" },
  { label: "Threads", href: "#" },
  { label: "Chính sách bảo mật", href: "#chinh-sach-bao-mat" },
];

function Num({ n, size, light }: { n: string; size: number; light?: boolean }) {
  return (
    <span style={{
      flex: "0 0 auto", width: size, height: size, borderRadius: 999,
      background: light ? "var(--uw-white)" : "var(--uw-blue-700)", color: light ? "var(--uw-blue-700)" : "var(--uw-white)",
      fontWeight: 800, fontSize: size >= 36 ? 15 : size >= 32 ? 14 : 12, display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>{n}</span>
  );
}

type Step = { k: string; t: string; d: string };

// Vertical 4-step timeline. "dark" sits on the blue Intensive card, the default sits on a tinted panel.
function Timeline({ title, steps, dark }: { title: string; steps: Step[]; dark?: boolean }) {
  const size = dark ? 36 : 32;
  return (
    <div style={{ background: dark ? GLASS : "var(--uw-blue-100)", borderRadius: dark ? 22 : 20, padding: dark ? "22px 20px" : "18px 16px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: dark ? "var(--uw-blue-250)" : "var(--uw-ink-3)", marginBottom: dark ? 16 : 14 }}>{title}</div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={s.t} style={{ display: "grid", gridTemplateColumns: `${size}px minmax(0,1fr)`, gap: dark ? 14 : 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Num n={String(i + 1)} size={size} light={dark} />
                {!last && <span style={{ flex: 1, width: 2, background: dark ? "oklch(1 0 0 / 0.22)" : "var(--uw-blue-250)", margin: "6px 0" }} />}
              </div>
              <div style={{ padding: dark ? `4px 0 ${last ? 0 : 18}px` : `3px 0 ${last ? 0 : 16}px` }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: dark ? "var(--uw-blue-250)" : "var(--uw-blue-500)" }}>{s.k}</div>
                {dark
                  ? <div style={{ ...SERIF, fontSize: 20, lineHeight: 1.3, marginTop: 2 }}>{s.t}</div>
                  : <div style={{ fontWeight: 800, fontSize: 16, lineHeight: "22px", marginTop: 2 }}>{s.t}</div>}
                <p style={dark
                  ? { fontSize: 15, lineHeight: "23px", margin: "4px 0 0", color: "var(--uw-blue-150)" }
                  : { fontSize: 14, lineHeight: "21px", margin: "2px 0 0", color: "var(--uw-ink-2)" }}>{s.d}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RowLabel({ n, title, note }: { n: string; title: string; note: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
      <Num n={n} size={22} />
      <span style={{ fontSize: 14, fontWeight: 800 }}>{title}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--uw-ink-3)" }}>· {note}</span>
    </div>
  );
}

function PlanCard() {
  const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 };
  const months = ["var(--uw-blue-150)", "var(--uw-blue-250)", "var(--uw-blue-500)"];
  return (
    <div style={{ position: "relative", background: "var(--uw-white)", borderRadius: 28, padding: "24px 22px 20px", boxShadow: "var(--shadow-pop)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ ...SERIF, fontSize: 22 }}>3 tháng của bạn</span>
        <span style={{ ...LABEL, color: "var(--uw-blue-500)" }}>3 học phần chính</span>
      </div>
      <div style={{ ...grid3, marginTop: 16 }}>
        {months.map((c, i) => (
          <div key={c} style={{ textAlign: "center", fontSize: 13, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--uw-ink-3)", paddingBottom: 6, borderBottom: `2px solid ${c}` }}>Tháng {i + 1}</div>
        ))}
      </div>

      <RowLabel n="1" title="Intensive sessions" note="cá nhân hóa, nhóm 3" />
      <div style={{ ...grid3, marginTop: 8 }}>
        {sessions.map((s, i) => {
          const writing = i < 3;
          return (
            <div key={s.s} style={{ background: writing ? "var(--uw-blue-700)" : "var(--uw-blue-500)", color: "var(--uw-white)", borderRadius: 12, padding: "8px 9px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: writing ? "var(--uw-blue-250)" : "var(--uw-blue-150)" }}>{s.s}</div>
              <div style={{ fontSize: 13, lineHeight: "17px", fontWeight: 700, marginTop: 2 }}>{s.t}</div>
            </div>
          );
        })}
      </div>

      <RowLabel n="2" title="Daily practice & feedback" note="không giới hạn" />
      <div style={{ marginTop: 8, background: "var(--uw-blue-100)", borderRadius: 14, padding: 6 }}>
        <div style={grid3}>
          {dailyFocus.map((t) => (
            <div key={t} style={{ fontSize: 13, lineHeight: "17px", fontWeight: 700, padding: "6px 7px", color: "var(--uw-blue-900)" }}>{t}</div>
          ))}
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "var(--uw-blue-500)", margin: "2px 6px 4px" }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--uw-ink-2)", padding: "0 6px 2px" }}>Active learning · nộp lúc nào tiện, giảng viên chấm trong 48 giờ</div>
      </div>

      <RowLabel n="3" title="Diagnosis & Re-assess" note="đo lại cả chặng" />
      <div style={{ ...grid3, marginTop: 8 }}>
        {diagnosis.map((d) => (
          <div key={d.k} style={{ background: "var(--uw-white)", color: "var(--uw-ink)", borderRadius: 12, padding: "7px 8px", border: "1.5px solid var(--uw-line)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--uw-blue-500)" }}>{d.k}</div>
            <div style={{ fontSize: 13, lineHeight: "17px", fontWeight: 700, marginTop: 2 }}>{d.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArrowList({ items, mark, muted, size = 17 }: { items: string[]; mark: string; muted?: boolean; size?: number }) {
  return (
    <ul style={{ display: "grid", margin: "16px 0 0", padding: 0, listStyle: "none" }}>
      {items.map((t) => (
        <li key={t} style={{ display: "flex", gap: 12, padding: size === 17 ? "14px 0" : "11px 0", borderTop: "1px solid var(--uw-line)", fontSize: size, lineHeight: size === 17 ? "26px" : "24px", color: muted ? "var(--uw-ink-2)" : undefined }}>
          <span aria-hidden="true" style={{ color: "var(--uw-blue-500)", fontWeight: 800 }}>{mark}</span><span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 760);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return narrow;
}

function BookingForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [zalo, setZalo] = useState("");
  const [band, setBand] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");
  const [consentErr, setConsentErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    const zaloErr = zalo.replace(/\D/g, "").length < 10 ? "Số Zalo cần đủ 10 chữ số." : "";
    const cErr = consent ? "" : "Bạn cần đồng ý để tụi mình gửi đề test qua Zalo.";
    setErr(zaloErr);
    setConsentErr(cErr);
    if (zaloErr || cErr) return;
    // TODO: send to a real backend. For now the registration is only logged, like the Green Finance form.
    console.log("Intensive placement test signup", { name, zalo, band });
    setDone(true);
  };

  if (done) {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <p style={{ margin: 0, ...SERIF, fontSize: 24, lineHeight: 1.3, color: "var(--uw-ink)" }}>Xong rồi, {name || "bạn"}.</p>
        <p style={{ margin: 0, fontSize: 16, lineHeight: "26px", color: "var(--uw-ink-2)" }}>Tụi mình sẽ nhắn đề test qua Zalo trong 24 giờ.</p>
        <div><Button onClick={onClose}>Đóng</Button></div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={{ margin: 0, fontSize: 16, lineHeight: "26px", color: "var(--uw-ink-2)" }}>Để lại Zalo, tụi mình gửi đề trong 24 giờ. Bạn làm 1 bài Writing và gửi 1 bản ghi Speaking, nhận bài chấm trong 48 giờ. Không gọi điện chèo kéo.</p>
      <Input label="Tên bạn" placeholder="Minh Anh" value={name} onChange={setName} autoComplete="name" />
      <Input label="Số Zalo" placeholder="09xx xxx xxx" type="tel" autoComplete="tel" value={zalo} onChange={(v) => { setZalo(v); setErr(""); }} error={err} />
      <Select label="Band Writing/Speaking gần nhất" placeholder="Chọn band" options={bands} value={band} onChange={setBand} />
      <div style={{ display: "grid", gap: 6 }}>
        <Checkbox label="Mình đồng ý để UpWind dùng tên và số Zalo này để gửi đề test, trả bài chấm và tư vấn về khóa học." checked={consent} onChange={(v) => { setConsent(v); setConsentErr(""); }} />
        <p style={{ margin: "0 0 0 30px", fontSize: 13, lineHeight: "20px", color: "var(--uw-ink-3)" }}>Xem <a href="#chinh-sach-bao-mat">Chính sách bảo mật</a>. Bạn có thể nhắn Zalo yêu cầu xóa thông tin bất cứ lúc nào. Tụi mình không chia sẻ cho bên thứ ba.</p>
        {consentErr && <p style={{ margin: "0 0 0 30px", fontSize: 13, fontWeight: 700, color: "var(--status-danger)" }}>{consentErr}</p>}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
        <Button onClick={submit}>Gửi đề cho mình</Button>
        <Button variant="outline" onClick={onClose}>Để sau</Button>
      </div>
    </div>
  );
}

export default function Landing() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const narrow = useNarrow();

  const openBook = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setFormKey((k) => k + 1);
    setOpen(true);
  };
  const closeBook = () => setOpen(false);

  return (
    <>
      <NavBar detail="· Intensive Mastery" ctaLabel="Làm test miễn phí" ctaHref="#dangky" onCta={openBook} />

      <main>
        {/* 1 HERO */}
        <section id="top" style={{ position: "relative", overflow: "hidden", background: "var(--uw-blue-100)", padding: "clamp(40px,7vw,80px) 0 clamp(64px,9vw,104px)" }}>
          <div style={{ ...WRAP, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))", gap: "56px 48px", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <Sticker>Intensive Mastery · Writing &amp; Speaking · 3 tháng</Sticker>
              <h1 style={{ ...SERIF, fontSize: "clamp(38px,6vw,68px)", lineHeight: 1.08, letterSpacing: "-0.022em", margin: "24px 0 0", maxWidth: "17ch", textWrap: "balance", position: "relative" }}>
                Khóa Writing &amp; Speaking <Squiggle>cuối cùng</Squiggle> bạn cần học.
              </h1>
              <p style={{ fontSize: "clamp(17px,2vw,20px)", lineHeight: 1.6, maxWidth: 560, margin: "24px 0 0", color: "var(--uw-ink-2)" }}>
                <strong style={{ color: "var(--uw-ink)" }}>6 buổi Intensive</strong> nhóm 3 người, soạn riêng theo lộ trình và Error log của từng bạn. Giữa các buổi, chấm chữa <strong style={{ color: "var(--uw-ink)" }}>không giới hạn</strong> trong <strong style={{ color: "var(--uw-ink)" }}>48 giờ</strong>. Chỉ <strong style={{ color: "var(--uw-ink)" }}>5 triệu</strong> cho 3 tháng, thay vì 30–60 triệu cho một khóa full.
              </p>
              <div style={{ display: "flex", gap: "16px 24px", flexWrap: "wrap", alignItems: "center", marginTop: 32 }}>
                <Button size="lg" onClick={openBook}>Test đầu vào miễn phí</Button>
                <a href={ZALO_URL} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: 16 }}>hoặc chat Zalo tư vấn →</a>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28 }}>
                <Pill tone="white">Giảng viên 8.0</Pill>
                <Pill tone="white">Chấm trong 48h</Pill>
                <Pill tone="primary">Chỉ 3 học viên/lớp</Pill>
              </div>
            </div>

            <div style={{ position: "relative", maxWidth: 500, width: "100%", justifySelf: "center", padding: "20px 0 28px" }}>
              <PlanCard />
              <Doodle kind="gust" size={60} color="var(--uw-blue-500)" style={{ position: "absolute", left: -18, top: -4 }} />
            </div>
          </div>
        </section>

        {/* 2 PAIN */}
        <section style={{ position: "relative", background: "var(--uw-white)", padding: "clamp(80px,10vw,112px) 0 clamp(64px,8vw,96px)" }}>
          <WaveDivider fill="var(--uw-blue-100)" />
          <div style={WRAP}>
            <Eyebrow>Có thấy mình trong này không</Eyebrow>
            <h2 style={H2}>Bạn có đang ở đây?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 16, marginTop: 36 }}>
              {pains.map((p) => (
                <div key={p.tag} style={{ background: "var(--uw-blue-100)", borderRadius: 22, padding: "26px 24px" }}>
                  <span style={{ fontWeight: 700, fontSize: 19, color: "var(--uw-blue-500)" }}>{p.tag}</span>
                  <p style={{ ...SERIF, fontSize: 22, lineHeight: 1.35, margin: "6px 0 0" }}>{p.q}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, margin: "14px 0 0", color: "var(--uw-ink-3)" }}>Câu nói thật của người học IELTS trên Threads.</p>
            <p style={{ ...SERIF, fontSize: "clamp(22px,2.6vw,30px)", lineHeight: 1.4, margin: "40px 0 0", maxWidth: 820 }}>
              Thường thì bạn không thiếu tài liệu đâu. Cái bạn cần là một người <Highlight>nhìn ra đúng chỗ</Highlight> mình đang vấp, rồi cùng bạn gỡ từng chỗ một.
            </p>
          </div>
        </section>

        {/* 2b FRAMEWORK */}
        <section style={{ position: "relative", background: "var(--uw-white)", padding: "clamp(24px,4vw,40px) 0 clamp(80px,10vw,112px)" }}>
          <div style={WRAP}>
            <Eyebrow tone="plain">Khóa học được thiết kế theo</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "32px 48px", marginTop: 28 }}>
              {[
                { k: "Cấu trúc khóa học", t: "Summit Learning", d: "Mô hình của Summit Public Schools (Mỹ): Mentoring, lộ trình cá nhân, áp dụng vào bài thật." },
                { k: "Mỗi ngày học", t: "Diagnostic–Prescriptive", d: "Chẩn đoán đúng lỗi của bạn trước, rồi mới kê bài để sửa lỗi đó." },
              ].map((f) => (
                <div key={f.t} style={{ paddingTop: 20, borderTop: "2px solid var(--uw-blue-700)" }}>
                  <div style={{ ...LABEL, color: "var(--uw-blue-500)" }}>{f.k}</div>
                  <div style={{ ...SERIF, fontSize: "clamp(26px,3vw,34px)", lineHeight: 1.15, marginTop: 8 }}>{f.t}</div>
                  <p style={{ fontSize: 17, lineHeight: "27px", margin: "10px 0 0", color: "var(--uw-ink-2)", maxWidth: "42ch" }}>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 HOW IT WORKS */}
        <section id="phuongphap" style={{ position: "relative", background: "var(--uw-blue-700)", color: "var(--uw-white)", padding: "clamp(96px,11vw,128px) 0 clamp(72px,9vw,104px)", overflow: "hidden" }}>
          <WaveDivider fill="var(--uw-white)" reverse />
          <img src={markReversed} alt="" aria-hidden="true" style={{ position: "absolute", right: -60, top: 80, width: 340, opacity: 0.08 }} />
          <div style={WRAP}>
            <span style={{ ...LABEL, color: "var(--uw-blue-250)" }}>Cách khóa học vận hành</span>
            <h2 style={{ ...SERIF, fontSize: "clamp(32px,4.8vw,58px)", lineHeight: 1.12, letterSpacing: "-0.02em", margin: "16px 0 0", maxWidth: "22ch", textWrap: "balance" }}>Giảng viên chỉ hướng. Bạn chủ động cầm lái.</h2>
            <p style={{ fontSize: "clamp(17px,2vw,20px)", lineHeight: 1.6, margin: "20px 0 0", maxWidth: 640, color: "var(--uw-blue-150)" }}>Mỗi ngày chạy qua một vòng 4 bước Diagnostic–Prescriptive. Giảng viên chẩn đoán và kê bài, bạn chủ động luyện. Sau 3 tháng, bạn biết tự tìm lỗi và tự sửa, không cần học thêm khóa nào nữa.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12, marginTop: 44 }}>
              {loop.map((s) => (
                <div key={s.n} style={{ background: GLASS, borderRadius: 22, padding: "22px 20px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Num n={s.n} size={34} light />
                    <span style={{ ...SERIF, fontSize: 24 }}>{s.t}</span>
                  </div>
                  <p style={{ fontSize: 16, lineHeight: "25px", margin: "12px 0 0", color: "var(--uw-blue-150)" }}>{s.d}</p>
                  <div style={{ fontSize: 13, fontWeight: 800, marginTop: 12, color: "var(--uw-blue-250)" }}>{s.who}</div>
                </div>
              ))}
            </div>
            <p style={{ fontWeight: 700, fontSize: 18, lineHeight: "28px", margin: "18px 0 0", color: "var(--uw-blue-250)" }}>↻ Lặp lại mỗi ngày, trong 90 ngày. Bước 4 hôm nay là bước 1 của ngày mai.</p>
          </div>
        </section>

        {/* 4 WHAT YOU GET */}
        <section id="baogom" style={{ position: "relative", background: "var(--uw-blue-100)", padding: "clamp(88px,10vw,112px) 0 clamp(64px,8vw,96px)" }}>
          <WaveDivider fill="var(--uw-blue-700)" />
          <div style={WRAP}>
            <Eyebrow tone="plain">Bạn nhận được gì</Eyebrow>
            <h2 style={{ ...H2, maxWidth: "22ch", textWrap: "balance" }}>Ba phần, mỗi phần gỡ <Squiggle>một nút thắt</Squiggle>.</h2>
            <p style={{ fontSize: 18, lineHeight: "30px", margin: "20px 0 0", maxWidth: 620, color: "var(--uw-ink-2)" }}>Khóa học được thiết kế theo 3 trụ cột của Summit Learning và phương pháp Diagnostic–Prescriptive Teaching, chỉnh lại cho Writing và Speaking.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "28px 40px", alignItems: "center", marginTop: 40, background: "var(--uw-blue-700)", color: "var(--uw-white)", borderRadius: 28, padding: "clamp(26px,4vw,40px)", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ ...LABEL, color: "var(--uw-blue-250)" }}>01 · Intensive sessions</span>
                <h3 style={{ ...SERIF, fontSize: "clamp(26px,3vw,36px)", lineHeight: 1.2, margin: "12px 0 0" }}>6 buổi Intensive, soạn riêng cho <Squiggle color="var(--uw-blue-250)">từng bạn</Squiggle>.</h3>
                <p style={{ fontSize: 17, lineHeight: "28px", margin: "14px 0 0", color: "var(--uw-blue-150)" }}>Không có giáo án chung. Trước mỗi buổi, giảng viên đọc lại lộ trình và Error log của từng người trong nhóm, rồi soạn phần kiến thức, phần chữa lỗi và bài luyện nhắm đúng lỗi của bạn.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 18, fontSize: 15, fontWeight: 800 }}>
                  <span>3 Writing + 3 Speaking</span><span style={{ color: "var(--uw-blue-250)" }}>·</span><span>Nhóm 3 người</span><span style={{ color: "var(--uw-blue-250)" }}>·</span><span>Khoảng 2 tuần một buổi</span>
                </div>
              </div>
              <Timeline dark title="Một buổi Intensive diễn ra thế nào" steps={intensiveSteps} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 16, marginTop: 16 }}>
              {[
                { k: "02 · Mentoring", t: "Giảng viên 8.0 chấm từng bài, trả trong 48 giờ.", d: "Chấm chữa không giới hạn cho cả Writing và Speaking, theo đủ 4 tiêu chí IELTS, có ghi chú tới từng câu.", tl: "Một bài được chấm như thế nào", steps: mentoringSteps },
                { k: "03 · Active learning", t: "Mỗi ngày một bài, kê đúng lỗi của bạn.", d: "Lộ trình 90 ngày riêng, có tài liệu và phần mềm đi kèm. Giờ làm do bạn chọn.", tl: "Một ngày học diễn ra thế nào", steps: activeSteps },
              ].map((c) => (
                <div key={c.k} style={{ background: "var(--uw-white)", borderRadius: 28, padding: "26px 24px 24px", display: "flex", flexDirection: "column" }}>
                  <span style={{ ...LABEL, color: "var(--uw-blue-500)" }}>{c.k}</span>
                  <h3 style={{ ...SERIF, fontSize: 24, lineHeight: 1.25, margin: "10px 0 0" }}>{c.t}</h3>
                  <p style={{ fontSize: 16, lineHeight: "26px", margin: "10px 0 0", color: "var(--uw-ink-2)" }}>{c.d}</p>
                  <div style={{ marginTop: "auto", paddingTop: 20 }}>
                    <Timeline title={c.tl} steps={c.steps} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 PROOF */}
        <section id="giangvien" style={{ position: "relative", background: "var(--uw-white)", padding: "clamp(88px,10vw,112px) 0 clamp(64px,8vw,96px)" }}>
          <WaveDivider fill="var(--uw-blue-100)" />
          <div style={WRAP}>
            <Eyebrow>Người đọc bài của bạn</Eyebrow>
            <h2 style={{ ...H2, maxWidth: "22ch", textWrap: "balance" }}>Hai giảng viên IELTS 8.0, từng là học sinh chuyên Anh, sẽ đọc từng bài của bạn.</h2>
            <div style={{ display: "grid", gap: 20, marginTop: 40 }}>
              <TeacherCard name="Thư Võ" photo={teacherThuImg} role="Chấm Writing · dạy 3 buổi Writing" badges={t1Badges} bullets={t1Bullets} />
              <TeacherCard tone="brand" name="Phượng Nguyễn" photo={teacherPhuongImg} role="Chấm Speaking · dạy 3 buổi Speaking" badges={t2Badges} bullets={t2Bullets} />
            </div>
          </div>
        </section>

        {/* 6 FIT */}
        <section style={{ position: "relative", background: "var(--uw-white)", padding: "clamp(24px,4vw,48px) 0 clamp(48px,6vw,64px)" }}>
          <div style={{ ...WRAP, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 40 }}>
            <div>
              <h2 style={{ ...SERIF, fontSize: "clamp(26px,3.2vw,36px)", lineHeight: 1.15, margin: 0 }}>Khóa này sẽ hợp với bạn nếu</h2>
              <ArrowList items={fitYes} mark="→" />
            </div>
            <div>
              <h2 style={{ ...SERIF, fontSize: "clamp(26px,3.2vw,36px)", lineHeight: 1.15, margin: 0 }}>Có lẽ chưa hợp lúc này nếu</h2>
              <ArrowList items={fitNo} mark="✕" muted />
            </div>
          </div>
        </section>

        {/* 7 PRICE */}
        <section id="hocphi" style={{ position: "relative", background: "var(--uw-white)", padding: "clamp(48px,6vw,64px) 0 clamp(80px,10vw,112px)" }}>
          <div style={WRAP}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 16, alignItems: "stretch" }}>
              <div style={{ border: "1.5px solid var(--uw-line)", borderRadius: 28, padding: "clamp(26px,4vw,36px)" }}>
                <span style={{ ...LABEL, color: "var(--uw-blue-500)" }}>Học phí trọn khóa</span>
                <div style={{ marginTop: 14, fontSize: 16, fontWeight: 700, color: "var(--uw-ink-3)" }}>Khóa full: <span style={{ textDecoration: "line-through" }}>30–60 triệu</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ ...SERIF, fontSize: "clamp(44px,5.4vw,62px)", lineHeight: 1, letterSpacing: "-0.02em" }}>5.000.000</span>
                  <span style={{ fontWeight: 800, fontSize: 22 }}>đ / 3 tháng</span>
                </div>
                <p style={{ fontSize: 15, lineHeight: "24px", margin: "12px 0 0", color: "var(--uw-ink-2)" }}>Tính ra chưa đến 56.000đ một ngày, cỡ một ly trà sữa.</p>
                <div style={{ marginTop: 4 }}><ArrowList items={priceItems} mark="→" size={16} /></div>
                <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                  <Button onClick={openBook}>Test đầu vào miễn phí</Button>
                  <span style={{ fontSize: 14, color: "var(--uw-ink-3)" }}>Giảng viên 8.0 · Chấm trong 48h · Chỉ 3 học viên/lớp</span>
                </div>
              </div>
              <div style={{ position: "relative", background: "var(--uw-blue-700)", color: "var(--uw-white)", borderRadius: 28, padding: "clamp(26px,4vw,36px)", overflow: "hidden" }}>
                <Doodle kind="boat" size={44} color="var(--uw-blue-250)" className="uw-bob" style={{ position: "absolute", top: 24, right: 24 }} />
                <span style={{ ...LABEL, color: "var(--uw-blue-250)", display: "block", paddingRight: 56 }}>Trả trước 50% · 50% còn lại sau 1 tháng học thử</span>
                <h3 style={{ ...SERIF, fontSize: "clamp(28px,3.2vw,38px)", lineHeight: 1.15, margin: "14px 0 0", maxWidth: "15ch" }}>Học thử một tháng. Thấy chưa hợp thì mình <Squiggle color="var(--uw-blue-250)">dừng</Squiggle>.</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
                  {["Trước khi học", "Sau tháng 1"].map((k) => (
                    <div key={k} style={{ background: "oklch(1 0 0 / 0.1)", borderRadius: 20, padding: "16px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--uw-blue-250)" }}>{k}</div>
                      <div style={{ ...SERIF, fontSize: 26, marginTop: 4 }}>2.500.000đ</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 16, lineHeight: "26px", margin: "18px 0 0", color: "var(--uw-blue-150)" }}>Tháng đầu bạn đã có 2 buổi Intensive và một tháng bài được chấm, đủ để cảm nhận khóa học có hợp với mình không. Nếu chưa thấy đáng, bạn dừng lại và không cần trả nửa còn lại.</p>
                <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, background: "var(--uw-white)", color: "var(--uw-blue-700)", fontWeight: 800, fontSize: 15, padding: "8px 14px", borderRadius: 999 }}>Chỉ 3 học viên/lớp · còn {SEATS_LEFT} chỗ</div>
              </div>
            </div>
          </div>
        </section>

        {/* 8 FAQ */}
        <section id="faq" style={{ position: "relative", background: "var(--uw-blue-100)", padding: "clamp(88px,10vw,112px) 0 clamp(64px,8vw,96px)" }}>
          <WaveDivider fill="var(--uw-white)" reverse />
          <div style={{ ...WRAP, maxWidth: 880 }}>
            <h2 style={{ ...H2, margin: 0 }}>Những điều bạn có thể đang thắc mắc</h2>
            <Accordion items={faq} defaultOpen={0} />
          </div>
        </section>

        {/* 9 FINAL CTA */}
        <section id="dangky" style={{ position: "relative", background: "var(--uw-blue-700)", color: "var(--uw-white)", padding: "clamp(104px,12vw,128px) 0 clamp(88px,10vw,112px)", overflow: "hidden" }}>
          <WaveDivider fill="var(--uw-blue-100)" />
          <img src={markReversed} alt="" aria-hidden="true" style={{ position: "absolute", right: -40, bottom: -150, width: 360, opacity: 0.14 }} />
          <div style={WRAP}>
            <h2 style={{ ...SERIF, fontSize: "clamp(32px,4.6vw,54px)", lineHeight: 1.12, letterSpacing: "-0.02em", margin: 0, maxWidth: "20ch", textWrap: "balance" }}>Mình bắt đầu bằng một bài test nhỏ nhé, miễn phí.</h2>
            <p style={{ fontSize: "clamp(17px,2vw,20px)", lineHeight: 1.6, margin: "20px 0 0", maxWidth: 600, color: "var(--uw-blue-150)" }}>Bạn làm 1 bài Writing và gửi 1 bản ghi Speaking. Trong 48 giờ, tụi mình gửi lại bài chấm cùng 3 lỗi đang kéo điểm bạn xuống, dù sau đó bạn có học cùng tụi mình hay không.</p>
            <div id="zalo" style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", marginTop: 32, alignItems: "center" }}>
              <Button variant="inverse" size="lg" onClick={openBook}>Test đầu vào miễn phí</Button>
              <Button variant="ghost" size="lg" href={ZALO_URL} target="_blank">Chat Zalo tư vấn</Button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginTop: 28, fontSize: 15, fontWeight: 700, color: "var(--uw-blue-150)" }}>
              <span>Giảng viên 8.0</span><span>·</span><span>Chấm trong 48h</span><span>·</span><span>Chỉ 3 học viên/lớp</span>
            </div>
          </div>
        </section>
      </main>

      <Footer links={footerLinks} />
      {narrow && <div style={{ height: 96 }} />}

      {narrow && !open && (
        <StickyBar title="Intensive Mastery · 5 triệu · 3 tháng" subtitle="Test đầu vào miễn phí, online" ctaLabel="Làm test" onCta={openBook} />
      )}

      <Dialog open={open} onClose={closeBook} title="Đăng ký test đầu vào miễn phí">
        <BookingForm key={formKey} onClose={closeBook} />
      </Dialog>
    </>
  );
}
