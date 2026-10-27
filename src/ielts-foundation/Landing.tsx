import React, { useEffect, useRef } from "react";
import teacher1Img from "@assets/teacher-1.jpg";
import teacher2Img from "@assets/teacher-2.jpg";
import founderImg from "@assets/founder.jpg";
import roadmapImg from "@assets/roadmap-summary.png";

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    const elements = document.querySelectorAll(".reveal, .bar");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "oklch(1 0 0 / 0.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--color-upwind-border)" }}>
        <div className="pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="34" height="34" viewBox="0 0 100 100" role="img" aria-label="UpWind - IELTS & Self Study">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-upwind-primary)" strokeWidth="3"></circle>
              <path d="M50 24 L50 60 L24 60 Z" fill="var(--color-upwind-primary)"></path>
              <line x1="50" y1="20" x2="50" y2="70" stroke="var(--color-upwind-primary)" strokeWidth="4" strokeLinecap="round"></line>
              <path d="M28 70 Q50 78 72 70" fill="none" stroke="var(--color-upwind-primary)" strokeWidth="4" strokeLinecap="round"></path>
              <path d="M24 78 Q50 86 76 78" fill="none" stroke="oklch(0.78 0.10 225)" strokeWidth="4" strokeLinecap="round"></path>
            </svg>
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 22, color: "var(--color-upwind-primary)" }}>UpWind <span className="brand-detail">- IELTS &amp; Self Study</span></span>
          </a>
          <div className="navspacer" style={{ flex: 1 }}></div>
          <a className="cta nav-cta" href="https://calendar.app.google/HNkKfyyWocDxwiE3A" target="_blank" rel="noreferrer" style={{ flex: "0 0 auto", background: "var(--color-upwind-primary)", color: "var(--color-upwind-bg)", textDecoration: "none", padding: "10px 18px", borderRadius: 999, whiteSpace: "nowrap" }}>Đặt lịch thi thử</a>
          <div className="navlinks" style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, fontWeight: 600 }}>
            <a href="#giangvien" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>Giảng viên</a>
            <a href="#tuhoc" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>Tự học</a>
            <a href="#cognitive" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>Cognitive skills</a>
            <a href="#lotrinh" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>Lộ trình</a>
            <a href="#hocphi" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>Học phí</a>
          </div>
        </div>
      </nav>

      <main id="top">
        <section id="hero" style={{ position: "relative", overflow: "hidden", background: "var(--color-upwind-primary-light)" }}>
          <svg viewBox="0 0 1400 700" aria-hidden="true" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.6 }}>
            <g className="swell" fill="none" stroke="oklch(0.78 0.10 225)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M-40 108 Q 260 72 560 108" opacity="0.45"></path>
              <path d="M-40 164 Q 320 118 680 164" opacity="0.3"></path>
              <path d="M860 486 Q 1140 446 1440 486" opacity="0.35"></path>
            </g>
            <g className="swell2" fill="none" stroke="oklch(0.78 0.10 225)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M-60 596 Q 180 556 420 596 T 900 596" opacity="0.4"></path>
              <path d="M-60 636 Q 220 600 500 636 T 1060 636" opacity="0.26"></path>
              <path d="M760 250 Q 1000 212 1240 250" opacity="0.22"></path>
            </g>
            <g transform="translate(1020 96) scale(4.4)" fill="none" stroke="var(--color-upwind-accent)" strokeWidth="1.7" opacity="0.2">
              <circle cx="50" cy="50" r="46"></circle>
              <path d="M50 24 L50 60 L24 60 Z"></path>
              <line x1="50" y1="20" x2="50" y2="70" strokeLinecap="round"></line>
              <path d="M28 70 Q50 78 72 70" strokeLinecap="round"></path>
              <path d="M24 78 Q50 86 76 78" strokeLinecap="round"></path>
            </g>
          </svg>
          <div className="pad" style={{ position: "relative", maxWidth: 1240, margin: "0 auto", padding: "88px 32px 104px" }}>
            <span className="sticker" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--color-upwind-bg)", color: "oklch(0.32 0.13 253)", fontSize: 13, fontWeight: 800, lineHeight: 1.45, padding: "11px 18px", borderRadius: 999, boxShadow: "0 3px 12px -6px oklch(0.42 0.15 253 / 0.6)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--color-upwind-accent)", flex: "0 0 7px" }}></span>
              <span>Lớp 4.0 → 5.5 · tối đa 8 học viên · khai giảng định kỳ</span>
            </span>
            <h1 className="reveal" style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(42px, 6.8vw, 84px)", lineHeight: 1.03, letterSpacing: "-0.022em", margin: "26px 0 0", maxWidth: 940 }}>
              Khóa IELTS
              <span style={{ position: "relative", whiteSpace: "nowrap" }}>
                {" "}cuối cùng
                <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: "-0.05em", width: "100%", height: "0.16em" }}>
                  <path d="M2 9 Q 60 2 100 7 T 198 5" fill="none" stroke="oklch(0.78 0.10 225)" strokeWidth="4" strokeLinecap="round"></path>
                </svg>
              </span>
              <br />bạn <span style={{ color: "var(--color-upwind-primary)" }}>phải</span> học.
            </h1>
            <p className="reveal" style={{ fontSize: 20, lineHeight: "32px", maxWidth: 620, margin: "30px 0 0", color: "var(--color-upwind-ink-2)" }}>
              Lớp online 18 tuần cho những bạn đang loay hoay ở ngưỡng 4.0 và muốn chạm mốc 5.5+. Chúng mình vừa dạy bạn IELTS theo nhóm nhỏ như một lớp học truyền thống, vừa giúp bạn học cách tự học.
            </p>
            
            <p className="reveal" style={{ fontSize: 18, lineHeight: "30px", maxWidth: 660, margin: "18px 0 0", color: "var(--color-upwind-ink-2)" }}>
              Học xong, bạn sẽ hai thứ: <mark style={{ background: "var(--color-upwind-yellow)", color: "inherit", padding: "1px 6px", borderRadius: 5, fontWeight: 700 }}>tấm bằng 5.5+</mark> và <mark style={{ background: "var(--color-upwind-yellow)", color: "inherit", padding: "1px 6px", borderRadius: 5, fontWeight: 700 }}>khả năng tự học</mark>. Tụi mình làm được điều này vì không dạy theo mẹo vặt. Toàn bộ lộ trình mổ xẻ <strong style={{ fontWeight: 700, color: "var(--color-upwind-ink)" }}>cognitive skills</strong> - các thao tác tư duy gốc rễ nằm sau từng câu hỏi, được huấn luyện như một kỹ năng độc lập: có tên gọi, có bài tập và có kiểm tra thực tế.
            </p>
            <div className="reveal hero-actions" style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", marginTop: 36 }}>
              <a className="cta hero-cta" href="https://calendar.app.google/HNkKfyyWocDxwiE3A" target="_blank" rel="noreferrer" style={{ background: "var(--color-upwind-primary)", color: "var(--color-upwind-bg)", textDecoration: "none", flex: "0 0 auto", lineHeight: 1.35, fontSize: 17, fontWeight: 700, padding: "17px 30px", borderRadius: 999, boxShadow: "0 16px 34px -20px oklch(0.42 0.15 253 / 0.9)" }}>
                Đặt lịch thi thử miễn phí
              </a>
              <span className="hero-note" style={{ display: "flex", alignItems: "flex-start", gap: 8, maxWidth: 260, fontSize: 14, lineHeight: "22px", color: "var(--color-upwind-ink-2)" }}>
                <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true" style={{ flex: "0 0 26px", marginTop: -4 }}>
                  <path d="M4 3 Q 2 16 12 22" fill="none" stroke="var(--color-upwind-accent)" strokeWidth="1.8" strokeLinecap="round"></path>
                  <path d="M8 21 L13 23 L11 18" fill="none" stroke="var(--color-upwind-accent)" strokeWidth="1.8" strokeLinecap="round"></path>
                </svg>
                Không chèo kéo hay ép sale. Buổi test cũng là lúc tụi mình xét: bạn nghẽn tư duy ở đâu, và lớp này có đúng là chỗ của bạn không.
              </span>
            </div>
            <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 64 }}>
              <span style={{ background: "var(--color-upwind-bg)", flex: "0 0 auto", lineHeight: 1.4, fontSize: 14, fontWeight: 700, padding: "10px 16px", borderRadius: 999 }}>2 GV 8.0 thực chiến</span>
              <span style={{ background: "var(--color-upwind-bg)", flex: "0 0 auto", lineHeight: 1.4, fontSize: 14, fontWeight: 700, padding: "10px 16px", borderRadius: 999 }}>8 học viên/lớp</span>
              <span style={{ background: "var(--color-upwind-bg)", flex: "0 0 auto", lineHeight: 1.4, fontSize: 14, fontWeight: 700, padding: "10px 16px", borderRadius: 999 }}>52.5 giờ học tương tác</span>
              <span style={{ background: "var(--color-upwind-primary)", color: "var(--color-upwind-bg)", flex: "0 0 auto", lineHeight: 1.4, fontSize: 14, fontWeight: 700, padding: "10px 16px", borderRadius: 999 }}>Chỉ đóng trước 50%, 50% sau 4 tuần</span>
            </div>
          </div>
        </section>

        <section id="giangvien" style={{ position: "relative", padding: "112px 0 104px" }}>
          <div className="wdiv">
            <svg className="drift" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-primary-light)"></path>
            </svg>
          </div>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <span className="sticker" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "var(--color-upwind-primary-light)", color: "oklch(0.32 0.13 253)", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "7px 14px", borderRadius: 8 }}>
              <svg aria-hidden="true" viewBox="0 0 30 10" style={{ flex: "0 0 30px", width: 30, height: 10 }}>
                <path d="M0 5 Q3.75 1.5 7.5 5 T15 5 T22.5 5 T30 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
              </svg>
              Hai người đứng lớp
            </span>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(32px, 4.2vw, 52px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: "20px 0 0", maxWidth: 860 }}>
              Chúng mình là 2 cựu chuyên Anh từng mò mẫm tự kéo điểm lên 8.0, và sẽ chỉ bạn cách đi ngắn nhất
            </h2>
            <p style={{ fontSize: 18, lineHeight: "30px", maxWidth: 760, margin: "24px 0 0", color: "var(--color-upwind-ink-2)" }}>
              Tụi mình ban đầu rất vất vả với tiếng Anh và IELTS dù xuất phát điểm là dân chuyên Anh. Cả hai từng ném tiền qua cửa sổ cho đủ loại trung tâm, từng chán nản bỏ ngang giữa chừng, rồi mới tự gò mình ngồi phân tích từng đề thi để mò lên con số 8.0. Quá trình trả giá bằng thời gian đó giúp tụi mình hiểu bản chất ngôn ngữ sâu hơn bất kỳ cuốn sách mẹo nào.
            </p>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: "34px", maxWidth: 620, margin: "20px 0 0", color: "var(--color-upwind-primary)" }}>
              UpWind dựng lên với một mục đích: để bạn không mất ba năm đi vòng vèo như tụi mình ngày xưa.
            </p>
          </div>

          <div className="reveal pad" style={{ maxWidth: 1240, margin: "56px auto 0", padding: "0 32px", display: "grid", gap: 24 }}>
            <article className="tilt" style={{ background: "var(--color-upwind-bg)", border: "1.5px solid var(--color-upwind-border)", borderRadius: 28, padding: 28, display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 210px", maxWidth: 250, minWidth: 0 }}>
                <div style={{ borderRadius: "20px 20px 110px 20px", overflow: "hidden", aspectRatio: "4 / 5", background: "var(--color-upwind-primary-light)" }}>
                  <img src={teacher1Img} alt="Thư Võ" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <div style={{ flex: "3 1 330px", minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ background: "var(--color-upwind-primary)", color: "var(--color-upwind-bg)", flex: "0 0 auto", lineHeight: 1.4, fontSize: 13, fontWeight: 700, padding: "6px 13px", borderRadius: 999 }}>IELTS 8.0</span>
                  <span style={{ background: "var(--color-upwind-primary-light)", color: "oklch(0.32 0.13 253)", flex: "0 0 auto", lineHeight: 1.4, fontSize: 13, fontWeight: 700, padding: "6px 13px", borderRadius: 999 }}>Đội Tuyển Quốc Gia Môn Tiếng Anh 2022</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(27px, 3vw, 34px)", lineHeight: 1.15, margin: "18px 0 0", color: "var(--color-upwind-primary)" }}>Thư Võ</h3>
                <p style={{ fontSize: 16, lineHeight: "26px", margin: "10px 0 0", color: "var(--color-upwind-ink)" }}>Phụ trách chính lớp học, Phụ trách Reading · Writing</p>
                <blockquote style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(19px, 2vw, 23px)", lineHeight: 1.5, margin: "22px 0 0", color: "var(--color-upwind-ink-2)", maxWidth: "46ch" }}>
                  <div>- Cựu Chuyên Anh, Chuyên Lê Quý Đôn (Khánh Hòa)</div>
                  <div>- Kinh nghiệm 3 năm dạy học nhóm nhỏ với hơn 20 học sinh đạt aim {'>'}6.5</div>
                </blockquote>
              </div>
            </article>

            <article className="tilt" style={{ background: "var(--color-upwind-primary)", borderRadius: 28, padding: 28, display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start", color: "var(--color-upwind-bg)" }}>
              <div style={{ flex: "1 1 210px", maxWidth: 250, minWidth: 0 }}>
                <div style={{ borderRadius: "20px 20px 110px 20px", overflow: "hidden", aspectRatio: "4 / 5", background: "var(--color-upwind-accent)" }}>
                  <img src={teacher2Img} alt="Phượng Nguyễn" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <div style={{ flex: "3 1 330px", minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ background: "var(--color-upwind-bg)", color: "oklch(0.32 0.13 253)", flex: "0 0 auto", lineHeight: 1.4, fontSize: 13, fontWeight: 700, padding: "6px 13px", borderRadius: 999 }}>IELTS 8.0</span>
                  <span style={{ background: "var(--color-upwind-accent)", color: "var(--color-upwind-bg)", flex: "0 0 auto", lineHeight: 1.4, fontSize: 13, fontWeight: 700, padding: "6px 13px", borderRadius: 999 }}>HSG Thành Phố năm 2022, 2021</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(27px, 3vw, 34px)", lineHeight: 1.15, margin: "18px 0 0" }}>Phượng Nguyễn</h3>
                <p style={{ fontSize: 16, lineHeight: "26px", margin: "10px 0 0", color: "var(--color-upwind-highlight)" }}>Phụ trách <strong style={{ color: "var(--color-upwind-bg)" }}>Listening · Speaking</strong></p>
                <blockquote style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(19px, 2vw, 23px)", lineHeight: 1.5, margin: "22px 0 0", maxWidth: "46ch" }}>
                  - Cựu Chuyên Anh, Chuyên Vĩnh Phúc<br/>
                  - Kinh Nghiệm 4 Năm Tutor 1-1 với hơn 15 học sinh đạt aim {'>'}6.5
                </blockquote>
              </div>
            </article>

            <aside style={{ background: "var(--color-upwind-primary-light)", borderRadius: 20, padding: "22px 26px", display: "flex", flexWrap: "wrap", gap: "14px 34px", alignItems: "flex-start" }}>
              <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, width: 124 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0, color: "oklch(0.32 0.13 253)", whiteSpace: "nowrap" }}>Về founder</h3>
                <div style={{ width: 124, borderRadius: "14px 14px 56px 14px", overflow: "hidden", aspectRatio: "4 / 5", background: "var(--color-upwind-highlight)" }}>
                  <img src={founderImg} alt="Nam Khánh" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                <p style={{ fontSize: 14, lineHeight: "22px", margin: "0 0 10px", color: "var(--color-upwind-ink-2)" }}>Bên cạnh hai giảng viên tài năng, team UpWind còn có <b>Nam Khánh - Founder</b></p>
                <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                  <li style={{ fontSize: 16, lineHeight: "26px", display: "grid", gridTemplateColumns: "18px 1fr", gap: 10 }}>
                    <span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span>
                    <span><strong style={{ fontWeight: 700 }}>Học bổng toàn phần duy nhất của Fulbright University</strong> (Nguyễn Phương Scholarship)</span>
                  </li>
                  <li style={{ fontSize: 16, lineHeight: "26px", display: "grid", gridTemplateColumns: "18px 1fr", gap: 10 }}>
                    <span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span>
                    <span>Từng làm việc tại 3 startup ed-tech, founding member của một quỹ đầu tư năng lượng.</span>
                  </li>
                  <li style={{ fontSize: 16, lineHeight: "26px", display: "grid", gridTemplateColumns: "18px 1fr", gap: 10 }}>
                    <span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span>
                    <span>Nếu bạn học IELTS để apply học bổng, tụi mình hỗ trợ luôn phần hồ sơ apply.</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section style={{ position: "relative", background: "var(--color-upwind-primary)", padding: "120px 0" }}>
          <div className="wdiv">
            <svg className="drift2" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-bg)"></path>
            </svg>
          </div>
          <div className="pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <h2 className="reveal" style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(32px, 4.8vw, 60px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0, maxWidth: 900, color: "var(--color-upwind-bg)" }}>
              Bạn không dốt tiếng Anh.<br />Bạn chỉ đang xử lý đề sai cách.
            </h2>
            <p id="tagline" className="reveal" style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(22px, 2.6vw, 32px)", lineHeight: 1.4, margin: "40px 0 0", maxWidth: 880, color: "var(--color-upwind-bg)" }}>
              Cày liên tục ba tháng. Giải nát mấy cuốn Cambridge. Học thuộc cả sổ tay mẹo làm bài. Thi thử điểm vẫn dậm chân ở 4.0.
            </p>
            <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: "24px 64px", marginTop: 40, maxWidth: 900 }}>
              <p style={{ margin: 0, flex: "1 1 260px", fontSize: 17, lineHeight: "28px", color: "var(--color-upwind-highlight)" }}>
                Bởi vì mẹo chỉ có tác dụng khi đề thi ra đúng kiểu bạn từng thấy. Giám khảo chỉ cần xoay cách hỏi một chút là bạn chới với vì không có gốc tư duy để bám.
              </p>
              <p style={{ margin: 0, flex: "1 1 260px", fontSize: 17, lineHeight: "28px", color: "var(--color-upwind-highlight)" }}>
                Và nguy hiểm nhất: hết khóa học, bạn quay lại vạch xuất phát. Không biết tự bơi tiếp kiểu gì, nên lại rút ví mua một khóa học khác.
              </p>
            </div>
          </div>
        </section>

        <section id="haiketqua" style={{ position: "relative", padding: "112px 0 96px" }}>
          <div className="wdiv">
            <svg className="drift" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-primary)"></path>
            </svg>
          </div>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(30px, 4vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: 0 }}>
              Một khóa học, <span style={{ position: "relative", whiteSpace: "nowrap" }}>hai đích đến<svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: "-0.05em", width: "100%", height: "0.16em" }}><path d="M2 9 Q 60 2 100 7 T 198 5" fill="none" stroke="oklch(0.78 0.10 225)" strokeWidth="4" strokeLinecap="round"></path></svg></span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 40 }}>
              <div className="tilt" style={{ background: "var(--color-upwind-primary-light)", borderRadius: 28, padding: "36px 32px" }}>
                <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 15, color: "var(--color-upwind-accent)" }}>Kết quả 01</span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(30px, 3.4vw, 40px)", lineHeight: 1.1, margin: "12px 0 0" }}>5.5+ IELTS</h3>
                <p style={{ fontSize: 17, lineHeight: "28px", margin: "16px 0 0", color: "var(--color-upwind-ink-2)" }}>
                  Con số thực tế bạn cần để nộp hồ sơ. 18 tuần cày cuốc với lộ trình công khai từng buổi ngay từ đầu.
                </p>
              </div>
              <div className="tilt" style={{ background: "var(--color-upwind-primary-light)", borderRadius: 28, padding: "36px 32px" }}>
                <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 15, color: "var(--color-upwind-accent)" }}>Kết quả 02</span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(30px, 3.4vw, 40px)", lineHeight: 1.1, margin: "12px 0 0" }}>Khả năng tự học</h3>
                <p style={{ fontSize: 17, lineHeight: "28px", margin: "16px 0 0", color: "var(--color-upwind-ink-2)" }}>
                  Thứ còn ở lại khi tấm bằng hết hạn sau 2 năm. Dùng được cho bài luận đại học, công việc và mọi thứ bạn cần học sau này.
                </p>
              </div>
            </div>
            <p style={{ fontSize: 18, lineHeight: "30px", margin: "28px 0 0", maxWidth: "52ch", color: "var(--color-upwind-ink-2)" }}>
              Các khóa học khác thường chỉ hứa với bạn vế đầu. Tụi mình thiết kế khung chương trình để bạn bắt buộc phải có cả hai.
            </p>
          </div>
        </section>

        <section id="tuhoc" style={{ position: "relative", background: "var(--color-upwind-primary-light)", padding: "112px 0" }}>
          <div className="wdiv">
            <svg className="drift2" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-bg)"></path>
            </svg>
          </div>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <span className="sticker" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "var(--color-upwind-bg)", color: "oklch(0.32 0.13 253)", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "7px 14px", borderRadius: 8 }}>
              <svg aria-hidden="true" viewBox="0 0 30 10" style={{ flex: "0 0 30px", width: 30, height: 10 }}>
                <path d="M0 5 Q3.75 1.5 7.5 5 T15 5 T22.5 5 T30 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
              </svg>
              Pillar 01 · Tự học
            </span>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(30px, 4.2vw, 50px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: "22px 0 0", maxWidth: 860 }}>
              Tự học không phải lý thuyết suông. Nó là thói quen rèn qua áp lực thật.
            </h2>
            <p style={{ fontSize: 18, lineHeight: "30px", maxWidth: 640, margin: "24px 0 0", color: "var(--color-upwind-ink-2)" }}>
              Chẳng ai nghe giảng đạo lý về "kỹ năng tự học" mà tự nhiên biết cách tự học. Bạn cần một áp lực đủ căng và một mục tiêu sát sườn để va chạm hàng ngày. Đó là lý do tụi mình mượn bài thi IELTS làm võ đài để bạn rèn năng lực này.
            </p>

            <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 24, lineHeight: 1.25, margin: "56px 0 0" }}>Tự học ở UpWind là làm những việc cụ thể:</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 24 }}>
              <div style={{ background: "var(--color-upwind-bg)", borderRadius: 22, padding: 26 }}>
                <strong style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, display: "block" }}>Error log</strong>
                <p style={{ fontSize: 16, lineHeight: "26px", margin: "8px 0 0", color: "var(--color-upwind-ink-2)" }}>Ghi chép để biết mình sai <em style={{ fontStyle: "normal", fontWeight: 700, color: "var(--color-upwind-ink)" }}>kiểu tư duy nào</em>, không phải chỉ đánh dấu đúng sai. Kỹ năng này áp dụng được cho mọi môn học.</p>
              </div>
              <div style={{ background: "var(--color-upwind-bg)", borderRadius: 22, padding: 26 }}>
                <strong style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, display: "block" }}>Paraphrase journal</strong>
                <p style={{ fontSize: 16, lineHeight: "26px", margin: "8px 0 0", color: "var(--color-upwind-ink-2)" }}>Tự đào bới và nhặt vốn diễn đạt của riêng mình, thay vì ngồi chờ phát danh sách từ vựng về học vẹt.</p>
              </div>
              <div style={{ background: "var(--color-upwind-bg)", borderRadius: 22, padding: 26 }}>
                <strong style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, display: "block" }}>Tự đo lường</strong>
                <p style={{ fontSize: 16, lineHeight: "26px", margin: "8px 0 0", color: "var(--color-upwind-ink-2)" }}>Tự nhìn ra tuần này mình chắc tay hơn ở điểm nào mà không cần đợi ai chấm điểm hộ.</p>
              </div>
              <div style={{ background: "var(--color-upwind-bg)", borderRadius: 22, padding: 26 }}>
                <strong style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, display: "block" }}>Bản đồ tự học 6 tháng</strong>
                <p style={{ fontSize: 16, lineHeight: "26px", margin: "8px 0 0", color: "var(--color-upwind-ink-2)" }}>Kế hoạch hành động chi tiết cho riêng từng người, nhận vào buổi học cuối cùng.</p>
              </div>
            </div>

            <p style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(24px, 3.2vw, 38px)", lineHeight: 1.24, letterSpacing: "-0.015em", margin: "64px 0 0", maxWidth: "22ch", color: "var(--color-upwind-primary)" }}>
              Mục tiêu của tụi mình không phải là bán cho bạn khóa học tiếp theo. Mục tiêu là để bạn đủ lông đủ cánh và không bao giờ cần đi học IELTS nữa.
            </p>
          </div>
        </section>

        <section id="cognitive" style={{ position: "relative", padding: "112px 0" }}>
          <div className="wdiv">
            <svg className="drift" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-primary-light)"></path>
            </svg>
          </div>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <span className="sticker" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "var(--color-upwind-primary-light)", color: "oklch(0.32 0.13 253)", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "7px 14px", borderRadius: 8 }}>
              <svg aria-hidden="true" viewBox="0 0 30 10" style={{ flex: "0 0 30px", width: 30, height: 10 }}>
                <path d="M0 5 Q3.75 1.5 7.5 5 T15 5 T22.5 5 T30 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
              </svg>
              Pillar 02 · Cognitive skills
            </span>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(30px, 4.2vw, 50px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: "22px 0 0", maxWidth: 800 }}>
              Xương sống của khóa học: Đào sâu vào Cognitive skills
            </h2>
            <p style={{ fontSize: 18, lineHeight: "30px", maxWidth: 680, margin: "24px 0 0", color: "var(--color-upwind-ink-2)" }}>
              <strong style={{ fontWeight: 700, color: "var(--color-upwind-ink)" }}>Cognitive skills là gì? Là toàn bộ thao tác não bộ bạn bật ra khi đối mặt với một câu hỏi:</strong> đọc hiểu bối cảnh, đánh hơi bẫy logic, tách ý chính khỏi ý rác, sắp xếp luận điểm và tự phản biện lỗi sai của mình.
            </p>
            <p style={{ fontSize: 18, lineHeight: "30px", maxWidth: 680, margin: "18px 0 0", color: "var(--color-upwind-ink-2)" }}>
              Bài thi IELTS thực chất là đang đo các thao tác tư duy này, nhưng hiếm nơi nào chịu dạy chúng trực diện. Lộ trình của UpWind đi ngược lại số đông: <strong style={{ fontWeight: 700, color: "var(--color-upwind-ink)" }}>mỗi buổi học mổ xẻ một cognitive skill cụ thể, gọi tên nó ra, dạy riêng và ép thực hành riêng.</strong>
            </p>

            <div className="sticker" style={{ margin: "48px 0 0", maxWidth: 720, background: "var(--color-upwind-primary-light)", borderRadius: 24, padding: 32 }}>
              <p style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(22px, 2.6vw, 30px)", lineHeight: 1.28, margin: 0 }}>
                Làm sai True / False / Not Given không phải lỗi dốt từ vựng. Đó là lỗi suy luận logic.
              </p>
              <p style={{ fontSize: 16, lineHeight: "26px", margin: "14px 0 0", color: "var(--color-upwind-ink-2)" }}>
                Hổng từ vựng thì phải nhặt từng từ. Nhưng đã sửa được tư duy logic thì đề nào bạn cũng tự xử lý được.
              </p>
            </div>

            <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(24px, 3vw, 34px)", lineHeight: 1.18, margin: "72px 0 0" }}>Hơn 30 kỹ năng trong 18 tuần, chia làm 5 nhóm:</h3>
            <div style={{ marginTop: 34 }}>
              <svg aria-hidden="true" viewBox="0 0 1200 20" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 17 }}>
                <path d="M0 10 Q75 1.5 150 10 T300 10 T450 10 T600 10 T750 10 T900 10 T1050 10 T1200 10" fill="none" stroke="oklch(0.84 0.05 230)" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
              </svg>
              
              <div className="row" style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "8px 32px", alignItems: "baseline", padding: "26px 0 30px", borderRadius: 12 }}>
                <span className="buoy" style={{ flex: "0 0 44px", alignSelf: "center", width: 44, height: 44, borderRadius: 999, background: "var(--color-upwind-primary-light)", color: "oklch(0.32 0.13 253)", fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, display: "grid", placeItems: "center" }}>01</span>
                <svg aria-hidden="true" viewBox="0 0 1200 20" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 17 }}>
                  <path className="wv" d="M0 10 Q75 1.5 150 10 T300 10 T450 10 T600 10 T750 10 T900 10 T1050 10 T1200 10" fill="none" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                </svg>
                <h4 style={{ flex: "1 1 220px", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 23, lineHeight: 1.2, margin: 0, minWidth: 0 }}>Input Decoding</h4>
                <p style={{ flex: "2 1 320px", margin: 0, fontSize: 17, lineHeight: "28px", color: "var(--color-upwind-ink-2)" }}>Quét nhanh và tóm gọn cả đoạn văn dài thành một cụm danh từ trong 20 giây, thay vì ngồi dịch từng mặt chữ.</p>
              </div>
              
              <div className="row" style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "8px 32px", alignItems: "baseline", padding: "26px 0 30px", borderRadius: 12 }}>
                <span className="buoy" style={{ flex: "0 0 44px", alignSelf: "center", width: 44, height: 44, borderRadius: 999, background: "var(--color-upwind-primary)", color: "var(--color-upwind-bg)", fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, display: "grid", placeItems: "center" }}>02</span>
                <svg aria-hidden="true" viewBox="0 0 1200 20" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 17, transform: "scaleX(-1)" }}>
                  <path className="wv" d="M0 10 Q75 1.5 150 10 T300 10 T450 10 T600 10 T750 10 T900 10 T1050 10 T1200 10" fill="none" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                </svg>
                <h4 style={{ flex: "1 1 220px", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 23, lineHeight: 1.2, margin: 0, minWidth: 0 }}>Inferential Reasoning</h4>
                <p style={{ flex: "2 1 320px", margin: 0, fontSize: 17, lineHeight: "28px", color: "var(--color-upwind-ink-2)" }}>Bắt bài 4 bẫy kinh điển đề thi luôn giăng ra: lặp từ ngữ cảnh, khái quát hóa thái quá, lật ngược nghĩa và nhắc-để-đánh-lạc-hướng.</p>
              </div>

              <div className="row" style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "8px 32px", alignItems: "baseline", padding: "26px 0 30px", borderRadius: 12 }}>
                <span className="buoy" style={{ flex: "0 0 44px", alignSelf: "center", width: 44, height: 44, borderRadius: 999, background: "var(--color-upwind-primary-light)", color: "oklch(0.32 0.13 253)", fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, display: "grid", placeItems: "center" }}>03</span>
                <svg aria-hidden="true" viewBox="0 0 1200 20" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 17 }}>
                  <path className="wv" d="M0 10 Q75 1.5 150 10 T300 10 T450 10 T600 10 T750 10 T900 10 T1050 10 T1200 10" fill="none" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                </svg>
                <h4 style={{ flex: "1 1 220px", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 23, lineHeight: 1.2, margin: 0, minWidth: 0 }}>Idea Gen & Structuring</h4>
                <p style={{ flex: "2 1 320px", margin: 0, fontSize: 17, lineHeight: "28px", color: "var(--color-upwind-ink-2)" }}>Nắm khung tư duy bật ý nhanh cho Task 2, ráp ý logic để bài viết có trọng lượng thay vì viết lan man.</p>
              </div>

              <div className="row" style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "8px 32px", alignItems: "baseline", padding: "26px 0 30px", borderRadius: 12 }}>
                <span className="buoy" style={{ flex: "0 0 44px", alignSelf: "center", width: 44, height: 44, borderRadius: 999, background: "var(--color-upwind-primary)", color: "var(--color-upwind-bg)", fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, display: "grid", placeItems: "center" }}>04</span>
                <svg aria-hidden="true" viewBox="0 0 1200 20" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 17, transform: "scaleX(-1)" }}>
                  <path className="wv" d="M0 10 Q75 1.5 150 10 T300 10 T450 10 T600 10 T750 10 T900 10 T1050 10 T1200 10" fill="none" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                </svg>
                <h4 style={{ flex: "1 1 220px", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 23, lineHeight: 1.2, margin: 0, minWidth: 0 }}>Flexible Expression</h4>
                <p style={{ flex: "2 1 320px", margin: 0, fontSize: 17, lineHeight: "28px", color: "var(--color-upwind-ink-2)" }}>Bí từ "florist" lúc đang nói? Bình tĩnh lái sang "the person who sells flowers" rồi nói tiếp, tuyệt đối không đứng hình.</p>
              </div>

              <div style={{ background: "var(--color-upwind-primary)", color: "var(--color-upwind-bg)", borderRadius: 24, marginTop: 20, padding: 32, display: "flex", flexWrap: "wrap", gap: "24px 48px", alignItems: "flex-start" }}>
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 700, color: "var(--color-upwind-yellow)" }}>05 · nơi hai pillar nối vào nhau</span>
                  <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(26px, 3vw, 34px)", lineHeight: 1.16, margin: "10px 0 0" }}>Metacognition</h4>
                  <svg aria-hidden="true" viewBox="0 0 600 12" preserveAspectRatio="none" style={{ display: "block", width: "100%", maxWidth: 260, height: 11, marginTop: 10 }}>
                    <path d="M0 6 Q37.5 2 75 6 T150 6 T225 6 T300 6 T375 6 T450 6 T525 6 T600 6" fill="none" stroke="var(--color-upwind-yellow)" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                  </svg>
                  <a href="#tuhoc" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, color: "var(--color-upwind-highlight)", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
                      <path d="M11 19 Q 4 13 6 4" fill="none" stroke="var(--color-upwind-yellow)" strokeWidth="1.8" strokeLinecap="round"></path>
                      <path d="M3 7 L6 3 L10 5" fill="none" stroke="var(--color-upwind-yellow)" strokeWidth="1.8" strokeLinecap="round"></path>
                    </svg>
                    chính là phần tự học ở trên
                  </a>
                </div>
                <p style={{ flex: "2 1 320px", margin: 0, fontSize: 18, lineHeight: "30px", color: "oklch(0.94 0.03 230)" }}>
                  Tư duy về chính cách mình học. Kỹ năng này chạy ngầm xuyên suốt từ tuần 1 đến tuần 18, không phải bài giảng đính kèm cho có ở cuối khóa. Bạn luyện nó bằng error log, paraphrase journal và các buổi tự đo lường — trong lúc vẫn đang luyện đề.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 72, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "start" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(26px, 3.2vw, 38px)", lineHeight: 1.14, margin: 0, maxWidth: "24ch" }}>
                Bằng IELTS sau 2 năm là hết hạn. Cognitive skills thì đi theo bạn cả đời.
              </h3>
              <p style={{ fontSize: 17, lineHeight: "28px", margin: 0, color: "var(--color-upwind-ink-2)" }}>
                Nắm được Distractor Analysis, bạn đọc tin tức hay quảng cáo mà không bị dắt mũi. Thuần thục Structured Brainstorming, bạn xử lý êm bài nghiên cứu, bài thuyết trình lẫn dự án công việc. Làm chủ Selective Scanning, bạn đọc giáo trình dày cộp mà không đuối sức.
              </p>
            </div>
          </div>
        </section>

        <section id="lotrinh" style={{ position: "relative", background: "var(--color-upwind-primary-light)", padding: "112px 0" }}>
          <div className="wdiv">
            <svg className="drift2" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-bg)"></path>
            </svg>
          </div>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(30px, 4.2vw, 50px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: 0, maxWidth: 760 }}>
              18 tuần, 35 buổi, 52.5 giờ — Mọi thứ minh bạch trên bàn
            </h2>
            <p style={{ fontSize: 18, lineHeight: "30px", maxWidth: 640, margin: "22px 0 0", color: "var(--color-upwind-ink-2)" }}>
              Thuyền không đi thẳng vào gió, nó vát từng chặng. Lộ trình cũng vậy — và bạn thấy hết ba chặng ngay từ buổi 1.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, marginTop: 44, alignItems: "start" }}>
              <div>
                <div style={{ display: "grid", gap: 14 }}>
                  <div className="tilt" style={{ background: "var(--color-upwind-bg)", borderRadius: 22, padding: 24 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-upwind-primary)", fontSize: 15, whiteSpace: "nowrap" }}>Chặng 1 · tháng 1</span>
                      <span style={{ flex: "1 1 auto", minWidth: 24, height: 10, display: "block" }}>
                        <svg aria-hidden="true" viewBox="0 0 600 10" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "100%" }}>
                          <path d="M0 5 Q37.5 1.5 75 5 T150 5 T225 5 T300 5 T375 5 T450 5 T525 5 T600 5" fill="none" stroke="oklch(0.84 0.05 230)" strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                        </svg>
                      </span>
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: "26px" }}>Tháng đầu tiên tập trung cày Reading và Listening, vì hai kỹ năng này kéo điểm lên nhanh nhất và bạn sẽ thấy rõ sự tiến bộ ngay ở bài mini mock tuần 4.</p>
                  </div>
                  <div className="tilt" style={{ background: "var(--color-upwind-bg)", borderRadius: 22, padding: 24 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-upwind-primary)", fontSize: 15, whiteSpace: "nowrap" }}>Chặng 2 · tháng 2–4</span>
                      <span style={{ flex: "1 1 auto", minWidth: 24, height: 10, display: "block" }}>
                        <svg aria-hidden="true" viewBox="0 0 600 10" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "100%" }}>
                          <path d="M0 5 Q37.5 1.5 75 5 T150 5 T225 5 T300 5 T375 5 T450 5 T525 5 T600 5" fill="none" stroke="oklch(0.84 0.05 230)" strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                        </svg>
                      </span>
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: "26px" }}>Từ tháng 2 đến tháng 4 dồn sức cho Writing và Speaking: tạo ý, tổ chức lập luận, diễn đạt linh hoạt, chữa bài cá nhân.</p>
                  </div>
                  <div className="tilt" style={{ background: "var(--color-upwind-bg)", borderRadius: 22, padding: 24 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-upwind-primary)", fontSize: 15, whiteSpace: "nowrap" }}>Chặng 3 · tháng 5</span>
                      <span style={{ flex: "1 1 auto", minWidth: 24, height: 10, display: "block" }}>
                        <svg aria-hidden="true" viewBox="0 0 600 10" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "100%" }}>
                          <path d="M0 5 Q37.5 1.5 75 5 T150 5 T225 5 T300 5 T375 5 T450 5 T525 5 T600 5" fill="none" stroke="oklch(0.84 0.05 230)" strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
                        </svg>
                      </span>
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: "26px" }}>Tháng cuối cùng là thực chiến: luyện đề bấm giờ ngặt nghèo và sửa lỗi cá nhân 1-1. Full mock bấm giờ chuẩn phòng thi tuần 17–18.</p>
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <a className="cta" href="https://drive.google.com/file/d/1iXpf9jzv4BPkyLdrmIvxOcWL7Kyyqx4t/view?usp=sharing" target="_blank" rel="noreferrer" style={{ display: "inline-block", color: "oklch(0.32 0.13 253)", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "13px 22px", borderRadius: 999, border: "1.5px solid oklch(0.60 0.13 240 / 0.45)" }}>
                    Tải lộ trình chi tiết (PDF)
                  </a>
                </div>
              </div>
              <figure style={{ margin: 0 }}>
                <div style={{ borderRadius: 24, overflow: "hidden", aspectRatio: "758 / 537", background: "var(--color-upwind-highlight)" }}>
                  <img src={roadmapImg} alt="Ảnh lộ trình 1 trang" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <figcaption style={{ fontSize: 14, lineHeight: "22px", margin: "14px 4px 0", color: "var(--color-upwind-ink-2)" }}></figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="nhanduoc" style={{ position: "relative", padding: "112px 0" }}>
          <div className="wdiv">
            <svg className="drift" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-primary-light)"></path>
            </svg>
          </div>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(30px, 4.2vw, 50px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: 0 }}>Những thứ bạn nhận về</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 44, marginTop: 40, alignItems: "start" }}>
              <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 16 }}>
                <li style={{ fontSize: 17, lineHeight: "26px", display: "grid", gridTemplateColumns: "20px 1fr", gap: 12, alignItems: "start" }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span><span>35 buổi học trực tiếp qua Zoom (1.5 giờ/buổi), 2 buổi/tuần</span></li>
                <li style={{ fontSize: 17, lineHeight: "26px", display: "grid", gridTemplateColumns: "20px 1fr", gap: 12, alignItems: "start" }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span><span>Lớp học giới hạn 8 người, không có ngoại lệ</span></li>
                <li style={{ fontSize: 17, lineHeight: "26px", display: "grid", gridTemplateColumns: "20px 1fr", gap: 12, alignItems: "start" }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span><span>Sửa Writing cá nhân chi tiết: 10 bài cho mỗi học viên</span></li>
                <li style={{ fontSize: 17, lineHeight: "26px", display: "grid", gridTemplateColumns: "20px 1fr", gap: 12, alignItems: "start" }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span><span>2 buổi kèm 1:1 riêng — rà soát lỗi giữa chặng và lên chiến lược chốt hạ cuối chặng</span></li>
                <li style={{ fontSize: 17, lineHeight: "26px", display: "grid", gridTemplateColumns: "20px 1fr", gap: 12, alignItems: "start" }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span><span>Thi thử thực tế: mini mock tuần 4, full mock bấm giờ tuần 17–18</span></li>
                <li style={{ fontSize: 17, lineHeight: "26px", display: "grid", gridTemplateColumns: "20px 1fr", gap: 12, alignItems: "start" }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>→</span><span>Nhóm Zalo trao đổi bài vở hàng ngày</span></li>
              </ul>
              <div className="tilt" style={{ background: "var(--color-upwind-primary-light)", borderRadius: 28, padding: 32 }}>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-upwind-primary)" }}>Nhận ở buổi cuối cùng</span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(26px, 3vw, 34px)", lineHeight: 1.16, margin: "14px 0 0" }}>Bản đồ tự học 6 tháng</h3>
                <p style={{ fontSize: 17, lineHeight: "28px", margin: "16px 0 0", color: "var(--color-upwind-ink-2)" }}>Vào buổi cuối, mỗi bạn sẽ nhận một bản kế hoạch được may đo riêng: chỗ nào còn lủng cần vá, tài liệu nào nên tự cày tiếp, lịch luyện đề phân bổ thế nào và cách tự kiểm tra trình độ.</p>
                <p style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 21, lineHeight: "32px", margin: "18px 0 0", color: "var(--color-upwind-primary)" }}>Tụi mình không bao giờ mời bạn mua khóa tiếp theo.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="hocphi" style={{ padding: "0 0 112px" }}>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ borderTop: "2px solid var(--color-upwind-ink)", paddingTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "start" }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-upwind-accent)" }}>Học phí</span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(40px, 5.4vw, 62px)", lineHeight: 1.02, letterSpacing: "-0.02em", margin: "14px 0 0" }}>6.750.000 ₫</h2>
                <p style={{ fontSize: 15, lineHeight: "24px", margin: "12px 0 0", color: "var(--color-upwind-ink-2)" }}>
                  <s style={{ opacity: 0.7 }}>7.750.000 ₫</s> · Ưu đãi đăng ký sớm, hạn chốt thông báo theo từng khóa
                </p>
                <p style={{ fontSize: 17, lineHeight: "28px", margin: "18px 0 0", maxWidth: "34ch" }}>
                  Tính ra khoảng <strong style={{ fontWeight: 700 }}>128.500 ₫/giờ</strong> cho 52.5 giờ tương tác trực tiếp ở lớp 8 người.
                </p>
                <div style={{ marginTop: 24 }}>
                  <a className="cta" href="https://calendar.app.google/HNkKfyyWocDxwiE3A" target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "var(--color-upwind-primary)", color: "var(--color-upwind-bg)", textDecoration: "none", fontSize: 16, fontWeight: 700, padding: "15px 26px", borderRadius: 999 }}>
                    Ứng tuyển bằng buổi test miễn phí
                  </a>
                </div>
              </div>
              <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 20 }}>
                <li style={{ fontSize: 17, lineHeight: "28px", paddingBottom: 20, borderBottom: "1px solid var(--color-upwind-border)" }}>Đăng ký cùng bạn bè: giảm ngay <strong style={{ fontWeight: 700 }}>400.000 ₫/người</strong></li>
                <li style={{ fontSize: 17, lineHeight: "28px", paddingBottom: 20, borderBottom: "1px solid var(--color-upwind-border)" }}>Chia nhỏ tiền học: <strong style={{ fontWeight: 700 }}>50% đóng trước khi vào học, 50% đóng sau khi học xong tháng đầu tiên</strong></li>
                <li style={{ fontSize: 17, lineHeight: "28px" }}><strong style={{ fontWeight: 700 }}>1 suất học bổng 50%</strong> mỗi khóa dành cho bạn có hoàn cảnh khó khăn nhưng thực sự muốn học. Cứ nhắn tin chia sẻ câu chuyện của bạn với tụi mình.</li>
              </ul>
            </div>
          </div>
        </section>

        <section style={{ position: "relative", background: "var(--color-upwind-ink)", padding: "104px 0" }}>
          <div className="wdiv">
            <svg className="drift2" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-bg)"></path>
            </svg>
          </div>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", color: "var(--color-upwind-bg)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(30px, 4.4vw, 54px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0, maxWidth: "18ch" }}>
              Học thử 4 tuần. Thấy không hợp, bạn có thể học tiếp đến giữa khóa và <span style={{ position: "relative", whiteSpace: "nowrap" }}>dừng lại<svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: "-0.05em", width: "100%", height: "0.16em" }}><path d="M2 9 Q 60 2 100 7 T 198 5" fill="none" stroke="var(--color-upwind-yellow)" strokeWidth="4" strokeLinecap="round"></path></svg></span>.
            </h2>
            <p style={{ fontSize: 18, lineHeight: "30px", maxWidth: "50ch", margin: "24px 0 0", color: "var(--color-upwind-yellow)" }}>
              UpWind còn là một lớp học mới, tụi mình hiểu bạn chưa có lý do gì để tin ngay. Vì vậy, thay vì giống những trung tâm khác, tụi mình không thu toàn bộ học phí một lần. Bạn chỉ cần đóng nốt phần còn lại sau khi đã học thử 4 tuần. Hết 4 tuần nếu thấy không hợp lộ trình, bạn hoàn toàn có thể chọn học hết nửa khóa rồi nghỉ mà không cần đóng thêm.
            </p>
          </div>
        </section>

        <section id="khongdanhcho" style={{ position: "relative", padding: "112px 0" }}>
          <div className="wdiv">
            <svg className="drift" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-ink)"></path>
            </svg>
          </div>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(28px, 3.8vw, 46px)", lineHeight: 1.12, margin: 0 }}>Lớp này không dành cho bạn nếu:</h2>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "14px 0 0", color: "var(--color-upwind-ink)" }}>Đừng đăng ký nếu bạn rơi vào các trường hợp sau:</p>
            <ul role="list" style={{ listStyle: "none", margin: "28px 0 0", padding: 0, display: "grid", gap: 0, borderTop: "1px solid var(--color-upwind-border)", maxWidth: 900 }}>
              <li style={{ fontSize: 17, lineHeight: "28px", padding: "20px 0", borderBottom: "1px solid var(--color-upwind-border)", display: "grid", gridTemplateColumns: "26px 1fr", gap: 10 }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>✕</span><span>Cần bằng 5.5 gấp trong 6 tuần. Lộ trình này cần 18 tuần nghiêm túc và tụi mình không thể đốt cháy giai đoạn.</span></li>
              <li style={{ fontSize: 17, lineHeight: "28px", padding: "20px 0", borderBottom: "1px solid var(--color-upwind-border)", display: "grid", gridTemplateColumns: "26px 1fr", gap: 10 }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>✕</span><span>Trình độ hiện tại dưới 4.0. Tụi mình sẽ nói thẳng trong buổi test và chỉ bạn chỗ học nền tảng phù hợp hơn.</span></li>
              <li style={{ fontSize: 17, lineHeight: "28px", padding: "20px 0", borderBottom: "1px solid var(--color-upwind-border)", display: "grid", gridTemplateColumns: "26px 1fr", gap: 10 }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>✕</span><span>Muốn xin bài mẫu để học thuộc lòng mang vào phòng thi chép. Tụi mình không dạy kiểu đó.</span></li>
              <li style={{ fontSize: 17, lineHeight: "28px", padding: "20px 0", borderBottom: "1px solid var(--color-upwind-border)", display: "grid", gridTemplateColumns: "26px 1fr", gap: 10 }}><span aria-hidden="true" style={{ color: "var(--color-upwind-accent)", fontWeight: 700 }}>✕</span><span>Không thể dành ra 5–7 tiếng tự học mỗi tuần ở nhà. Cognitive skills chỉ thành hình khi tay bạn tự làm bài.</span></li>
            </ul>
          </div>
        </section>

        <section id="faq" style={{ padding: "0 0 112px" }}>
          <div className="reveal pad" style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(28px, 3.8vw, 46px)", lineHeight: 1.12, margin: 0 }}>Câu hỏi thường gặp</h2>
            <div style={{ display: "grid", marginTop: 36, borderTop: "1px solid var(--color-upwind-border)" }}>
              <details style={{ borderBottom: "1px solid var(--color-upwind-border)", padding: "24px 4px" }}>
                <summary style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, lineHeight: "30px", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "baseline" }}>18 tuần có lâu quá không?<span className="sign" aria-hidden="true" style={{ flex: "0 0 auto", color: "var(--color-upwind-accent)", fontSize: 24, lineHeight: 1, display: "inline-block" }}>+</span></summary>
                <p style={{ fontSize: 16, lineHeight: "28px", margin: "14px 0 0", color: "var(--color-upwind-ink-2)", maxWidth: "62ch" }}>Dài hơn mấy khóa cấp tốc ngoài kia là thật. Nhưng từ 4.0 leo lên 5.5 là một hành trình thực tế cần sự tích lũy, tụi mình không muốn bán cho bạn một lời hứa ảo. Bạn có bài mini mock ở tuần 4 để nhìn rõ kết quả sớm, và luôn có quyền dừng lại sau 4 tuần đầu.</p>
              </details>
              <details style={{ borderBottom: "1px solid var(--color-upwind-border)", padding: "24px 4px" }}>
                <summary style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, lineHeight: "30px", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "baseline" }}>Học online có hiệu quả không?<span className="sign" aria-hidden="true" style={{ flex: "0 0 auto", color: "var(--color-upwind-accent)", fontSize: 24, lineHeight: 1, display: "inline-block" }}>+</span></summary>
                <p style={{ fontSize: 16, lineHeight: "28px", margin: "14px 0 0", color: "var(--color-upwind-ink-2)", maxWidth: "62ch" }}>Lớp tối đa 8 người, buổi nào bạn cũng bị gọi tên và sửa bài trực tiếp trước lớp. Vấn đề không nằm ở việc gặp nhau qua màn hình hay ngoài đời, mà là bạn có nhận được phản hồi riêng cho bài làm của mình hay không.</p>
              </details>
              <details style={{ borderBottom: "1px solid var(--color-upwind-border)", padding: "24px 4px" }}>
                <summary style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, lineHeight: "30px", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "baseline" }}>Bận việc nghỉ học thì sao?<span className="sign" aria-hidden="true" style={{ flex: "0 0 auto", color: "var(--color-upwind-accent)", fontSize: 24, lineHeight: 1, display: "inline-block" }}>+</span></summary>
                <p style={{ fontSize: 16, lineHeight: "28px", margin: "14px 0 0", color: "var(--color-upwind-ink-2)", maxWidth: "62ch" }}>Mọi buổi học đều có video ghi hình lại. Bạn có thể xem lại rồi nhắn tin vào nhóm Zalo hỏi phần chưa hiểu.</p>
              </details>
              <details style={{ borderBottom: "1px solid var(--color-upwind-border)", padding: "24px 4px" }}>
                <summary style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, lineHeight: "30px", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "baseline" }}>Có cam kết đầu ra bằng văn bản không?<span className="sign" aria-hidden="true" style={{ flex: "0 0 auto", color: "var(--color-upwind-accent)", fontSize: 24, lineHeight: 1, display: "inline-block" }}>+</span></summary>
                <p style={{ fontSize: 16, lineHeight: "28px", margin: "14px 0 0", color: "var(--color-upwind-ink-2)", maxWidth: "62ch" }}>Có. Tụi mình cam kết đầu ra nếu bạn thi thật trong vòng 3 tháng kể từ lúc kết thúc khóa học. Nếu không đạt mục tiêu, tụi mình sẽ hoàn 50% học phí hoặc bạn có thể chọn học lại miễn phí cho tới khi thi đạt thì thôi.</p>
              </details>
              <details style={{ borderBottom: "1px solid var(--color-upwind-border)", padding: "24px 4px" }}>
                <summary style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, lineHeight: "30px", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "baseline" }}>Lớp mới mở, lấy gì để tin?<span className="sign" aria-hidden="true" style={{ flex: "0 0 auto", color: "var(--color-upwind-accent)", fontSize: 24, lineHeight: 1, display: "inline-block" }}>+</span></summary>
                <p style={{ fontSize: 16, lineHeight: "28px", margin: "14px 0 0", color: "var(--color-upwind-ink-2)", maxWidth: "62ch" }}>Bạn chưa cần phải tin vội. Hãy đặt lịch làm bài test chẩn đoán miễn phí trước, xem cách tụi mình bắt lỗi tư duy của bạn có đúng hay không. Nếu 20 phút nói chuyện đó không mang lại cho bạn góc nhìn mới nào, đừng đăng ký.</p>
              </details>
            </div>
          </div>
        </section>

        <section id="dangky" style={{ background: "var(--color-upwind-primary)", position: "relative", overflow: "hidden", padding: "120px 0" }}>
          <div className="wdiv">
            <svg className="drift2" viewBox="0 0 1200 82" preserveAspectRatio="none">
              <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-bg)"></path>
            </svg>
          </div>
          <svg viewBox="0 0 400 400" aria-hidden="true" style={{ position: "absolute", right: -60, bottom: -80, width: 460, height: 460, opacity: 0.14 }}>
            <g transform="translate(70 70) scale(2.6)" fill="none" stroke="var(--color-upwind-bg)" strokeWidth="2">
              <circle cx="50" cy="50" r="46"></circle>
              <path d="M50 24 L50 60 L24 60 Z" fill="var(--color-upwind-bg)"></path>
              <line x1="50" y1="20" x2="50" y2="70" strokeLinecap="round"></line>
              <path d="M28 70 Q50 78 72 70" strokeLinecap="round"></path>
              <path d="M24 78 Q50 86 76 78" strokeLinecap="round"></path>
            </g>
          </svg>
          <div className="reveal pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 64, alignItems: "center" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(34px, 4.4vw, 54px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0, color: "var(--color-upwind-bg)" }}>Mỗi khóa tối đa <span style={{ color: "var(--color-upwind-yellow)" }}>8 chỗ</span>. Đặt lịch để giữ chỗ cho khóa gần nhất</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 36 }}>
                <a className="cta" href="https://calendar.app.google/HNkKfyyWocDxwiE3A" target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "var(--color-upwind-bg)", color: "var(--color-upwind-primary)", textDecoration: "none", fontSize: 16, fontWeight: 700, padding: "16px 28px", borderRadius: 999 }}>Đặt lịch thi thử miễn phí</a>
                <a className="cta" href="https://zalo.me/84375810412" target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", color: "var(--color-upwind-bg)", textDecoration: "none", fontSize: 16, fontWeight: 700, padding: "16px 28px", borderRadius: 999 }}>Nhắn tin Zalo</a>
                <a className="cta" href="https://drive.google.com/file/d/1iXpf9jzv4BPkyLdrmIvxOcWL7Kyyqx4t/view?usp=sharing" target="_blank" rel="noreferrer" style={{ display: "inline-block", color: "var(--color-upwind-highlight)", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "15px 4px" }}>Tải lộ trình 18 tuần (PDF)</a>
              </div>
              <div style={{ fontSize: 17, lineHeight: "28px", maxWidth: "56ch", margin: "28px 0 0", color: "var(--color-upwind-highlight)" }}>
                <p>Bạn chỉ cần làm một bài kiểm tra ngắn, tụi mình sẽ có một buổi meeting 20 phút để cùng bạn tìm ra những lỗi sai trong tư duy và hướng dẫn cách tự khắc phục.</p>
                <p>Sau buổi đó, tụi mình sẽ chọn 8 bạn phù hợp nhất với cách học này để đồng hành sâu hơn. Nếu lần này chưa phù hợp, tụi mình vẫn sẽ ưu tiên bạn cho các lớp sau hoặc gợi ý một nơi học phù hợp hơn với bạn.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ position: "relative", padding: "88px 0 96px", background: "var(--color-upwind-bg)" }}>
        <div className="wdiv" aria-hidden="true"><svg className="drift" viewBox="0 0 1200 82" preserveAspectRatio="none"><path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill="var(--color-upwind-primary)"></path></svg></div>
        <div className="pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px 48px", fontSize: 14, color: "var(--color-upwind-ink-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 100 100" role="img" aria-label="UpWind - IELTS & Self Study">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-upwind-ink)" strokeWidth="4"></circle>
              <path d="M50 24 L50 60 L24 60 Z" fill="var(--color-upwind-ink)"></path>
              <line x1="50" y1="20" x2="50" y2="70" stroke="var(--color-upwind-ink)" strokeWidth="5" strokeLinecap="round"></line>
              <path d="M28 70 Q50 78 72 70" fill="none" stroke="var(--color-upwind-ink)" strokeWidth="5" strokeLinecap="round"></path>
              <path d="M24 78 Q50 86 76 78" fill="none" stroke="var(--color-upwind-border)" strokeWidth="5" strokeLinecap="round"></path>
            </svg>
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 18, color: "var(--color-upwind-ink)" }}>UpWind - IELTS &amp; Self Study</span>
          </div>
          <span>Lấy điểm thật, học cách tự đi</span>
          <div style={{ flex: 1 }}></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", fontWeight: 600 }}>
            <a href="https://zalo.me/84375810412" target="_blank" rel="noreferrer" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>Zalo</a>
            <a href="#dangky" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>Facebook</a>
            <a href="#dangky" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>Threads</a>
            <span style={{ whiteSpace: "nowrap" }}>© 2026 UpWind - IELTS &amp; Self Study</span>
          </div>
        </div>
      </footer>
      <div className="bar" id="stickybar">
        <div style={{ background: "var(--color-upwind-primary)", borderRadius: 20, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 18px 40px -18px oklch(0.24 0.02 260 / 0.7)" }}>
          <div style={{ flex: 1, minWidth: 0, color: "var(--color-upwind-bg)" }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Tối đa 8 chỗ · khai giảng định kỳ</div>
            <div style={{ fontSize: 12, color: "var(--color-upwind-highlight)" }}>Test chẩn đoán 20 phút, miễn phí</div>
          </div>
          <a className="cta" href="https://calendar.app.google/HNkKfyyWocDxwiE3A" target="_blank" rel="noreferrer" style={{ background: "var(--color-upwind-bg)", color: "var(--color-upwind-primary)", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "12px 16px", borderRadius: 999, whiteSpace: "nowrap" }}>Đặt lịch thi thử</a>
        </div>
      </div>
    </div>
  );
}
