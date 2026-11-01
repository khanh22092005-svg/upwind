import { useMemo, useState } from "react";
import { allWords, COLORS, families, iconSvg, type Family } from "./data";
import { fold } from "./lib";
import { dueWords, resetProgress, stars, streak, useProgress, type Progress } from "./progress";
import { go, Icon, KindLegend, Stars, ZaloCta } from "./ui";

const TOTAL = allWords.length;

function resumeTarget(p: Progress): { f: Family; label: string } {
  const open = families
    .filter((f) => p.chapters[f.id] && !p.chapters[f.id].doneAt && p.chapters[f.id].step > 0)
    .sort((a, b) => p.chapters[b.id].updatedAt - p.chapters[a.id].updatedAt)[0];
  if (open) {
    const step = p.chapters[open.id].step;
    const wi = Math.min(Math.max(step - 2, 0), open.words.length);
    return { f: open, label: `Học tiếp: gốc ${open.root.split(" ")[0]} · ${step >= 2 + open.words.length ? "luyện tập" : `từ ${wi + 1}/${open.words.length}`}` };
  }
  const fresh = families.find((f) => !p.chapters[f.id]?.doneAt);
  if (fresh) return { f: fresh, label: `${Object.keys(p.chapters).length ? "Học gốc tiếp theo" : "Bắt đầu"}: gốc ${fresh.root.split(" ")[0]}` };
  return { f: families[0], label: "Học lại từ gốc đầu tiên" };
}

export function Home() {
  const p = useProgress();
  const due = dueWords(p).length;
  const learned = Object.keys(p.cards).length;
  const s = streak(p);
  const resume = resumeTarget(p);

  return (
    <>
      <section className="hero">
        <svg className="hero-waves" viewBox="0 0 1400 500" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="oklch(0.78 0.10 225)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M-40 108 Q 260 72 560 108" opacity="0.45"></path>
            <path d="M860 396 Q 1140 356 1440 396" opacity="0.35"></path>
            <path d="M-60 456 Q 180 416 420 456 T 900 456" opacity="0.4"></path>
          </g>
        </svg>
        <div className="hero-in">
          <p className="eyebrow">Miễn phí · UpWind IELTS</p>
          <h1>
            Học từ <span className="u">từ gốc</span>
          </h1>
          <p className="lead">
            {families.length} gốc La-tinh, {TOTAL} từ IELTS. Tách từ thành <b style={{ color: COLORS.pre }}>tiền tố</b> +{" "}
            <b style={{ color: COLORS.root }}>gốc</b> + <b style={{ color: COLORS.suf }}>hậu tố</b>, hình dung nghĩa gốc, rồi tự đoán nghĩa từ
            mới. Học một gốc, nhớ cả họ từ.
          </p>
          <div className="hero-demo" aria-hidden="true">
            <span className="demo-part" style={{ color: COLORS.pre }}>
              e<small>ra ngoài</small>
            </span>
            <span className="plus">+</span>
            <span className="demo-part" style={{ color: COLORS.root }}>
              voke<small>gọi</small>
            </span>
            <span className="plus">=</span>
            <span className="demo-word">
              <span>
                <span style={{ color: COLORS.pre }}>e</span>
                <span style={{ color: COLORS.root }}>voke</span>
              </span>
              <small>khơi gợi</small>
            </span>
          </div>
          <button className="btn primary big" onClick={() => go(resume.f.id)}>
            {resume.label} →
          </button>
          <p className="muted small">Không cần đăng ký · khoảng 4 phút mỗi gốc · tiến độ lưu trên máy của bạn</p>
        </div>
      </section>

      <div className="page">
        {learned > 0 && (
          <a className="today" href="#/on-tap">
            <div>
              <p className="streak">
                <Icon name="flame" size={20} /> {s > 0 ? `Chuỗi ${s} ngày` : "Bắt đầu chuỗi ngày học"}
              </p>
              <b>{due ? `${due} từ cần ôn hôm nay` : "Chưa có từ cần ôn hôm nay"}</b>
              <div className="meter" aria-label={`Đã học ${learned}/${TOTAL} từ`}>
                <i style={{ width: (learned / TOTAL) * 100 + "%" }} />
              </div>
              <small>
                Đã học {learned}/{TOTAL} từ
              </small>
            </div>
            <span className="btn primary">{due ? "Ôn tập" : "Xem"}</span>
          </a>
        )}

        <Search />

        <h2 className="sec">{families.length} gốc từ</h2>
        <KindLegend />
        <div className="grid">
          {families.map((f, i) => {
            const rec = p.chapters[f.id];
            const state = rec?.doneAt ? "done" : rec?.step ? "doing" : "new";
            return (
              <a key={f.id} href={`#/${f.id}`} className={"fcard " + state}>
                <span className="num">{i + 1}</span>
                <span className="ficon" dangerouslySetInnerHTML={{ __html: svg(f.icon) }} />
                <b className="froot">{f.root}</b>
                <span className="fcore">{f.core}</span>
                <span className="fstate">
                  {state === "done" && rec?.best !== undefined ? (
                    <Stars n={stars(rec.best, rec.total ?? 8)} />
                  ) : state === "doing" ? (
                    `Đang học · ${Math.min(Math.max(rec!.step - 1, 0), f.words.length)}/${f.words.length}`
                  ) : (
                    `${f.words.length} từ`
                  )}
                </span>
              </a>
            );
          })}
        </div>

        <h2 className="sec">Phương pháp 4 bước</h2>
        <ol className="method">
          <li>
            <b>Neo gốc bằng một hình ảnh.</b> Mỗi gốc chỉ có một nghĩa lõi (voc = gọi, spect = nhìn). Gắn nó với một cảnh cụ thể rồi dùng lại
            cảnh đó cho mọi từ trong họ.
          </li>
          <li>
            <b>Tách: tiền tố + gốc + hậu tố.</b> Tiền tố cho biết <i>hướng</i> (ra, vào, lại, trước...), hậu tố cho biết <i>loại từ</i>{" "}
            (-tion danh từ, -able tính từ).
          </li>
          <li>
            <b>Kể một câu chuyện nhỏ.</b> “e (ra) + voke (gọi) = gọi ra ngoài → <b>evoke</b>: khơi gợi ký ức.” Đừng học thuộc nghĩa trước khi
            có câu chuyện.
          </li>
          <li>
            <b>Gắn vào câu thật và ôn cách quãng.</b> Mỗi từ có một câu ví dụ kiểu IELTS. Phần <a href="#/on-tap">Ôn tập</a> tự nhắc bạn đúng
            lúc sắp quên.
          </li>
        </ol>

        <a className="affix-link" href="#/bang-phu-to">
          <span>
            <b>Bảng tiền tố &amp; hậu tố</b>
            <small>Tất cả tiền tố, hậu tố trong {TOTAL} từ, kèm nghĩa. Chìa khoá để đoán từ mới.</small>
          </span>
          <Icon name="arrow-right" size={22} stroke={2} />
        </a>

        <ZaloCta />

        {(learned > 0 || Object.keys(p.chapters).length > 0) && (
          <p className="center small">
            <button
              className="linklike"
              onClick={() => confirm("Xoá toàn bộ tiến độ học trên máy này? Không thể hoàn tác.") && resetProgress()}
            >
              Xoá tiến độ trên máy này
            </button>
          </p>
        )}
      </div>
    </>
  );
}

const svg = (name?: string) =>
  `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconSvg(name)}</svg>`;

type Hit = { label: string; sub: string; to: string };

function Search() {
  const [q, setQ] = useState("");
  const hits = useMemo<Hit[]>(() => {
    const k = fold(q);
    if (k.length < 2) return [];
    const out: Hit[] = [];
    for (const f of families) {
      if (fold(f.root).includes(k) || fold(f.core).includes(k)) out.push({ label: `gốc ${f.root}`, sub: f.core, to: f.id });
      for (const w of f.words) {
        if (fold(w.word).includes(k) || fold(w.meaning).includes(k))
          out.push({ label: w.word, sub: `${w.meaning} · gốc ${f.root.split(" ")[0]}`, to: `${f.id}/${encodeURIComponent(w.word)}` });
        for (const r of w.related ?? [])
          if (fold(r.w).includes(k)) out.push({ label: r.w, sub: `${r.vi} · xem ${w.word}`, to: `${f.id}/${encodeURIComponent(w.word)}` });
      }
    }
    return out.slice(0, 8);
  }, [q]);
  return (
    <div className="search">
      <label>
        <Icon name="search" size={20} stroke={2} />
        <input
          type="search"
          placeholder="Tra từ: inspect, provoke, thu hút..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && hits[0] && go(hits[0].to)}
          aria-label="Tra từ"
        />
      </label>
      {q.length >= 2 && (
        <ul className="hits">
          {hits.length ? (
            hits.map((h) => (
              <li key={h.label + h.to}>
                <a href={`#/${h.to}`}>
                  <b>{h.label}</b>
                  <small>{h.sub}</small>
                </a>
              </li>
            ))
          ) : (
            <li className="none">Chưa có từ này. Thử tách từ: tìm tiền tố trong bảng tiền tố &amp; hậu tố.</li>
          )}
        </ul>
      )}
    </div>
  );
}
