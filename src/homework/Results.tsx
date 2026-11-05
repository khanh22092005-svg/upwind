import { useState } from "react";
import { api, type Result, type ResultItem } from "./api";
import { CODES, codeInfo } from "./codes";
import type { Homework } from "./types";

export default function Results({ lesson, hw, result, late }: { lesson: string; hw: Homework; result: Result; late: boolean }) {
  const pct = result.total ? Math.round((100 * result.score) / result.total) : 0;
  return (
    <div className="hw-results">
      <div className="hw-card hw-scorecard">
        <div className="hw-bigscore">
          {result.score}/{result.total}
        </div>
        <div>
          <b>{pct >= 80 ? "Rất tốt!" : pct >= 60 ? "Khá ổn, xem lại các câu sai nhé." : "Cùng xem lại từng câu sai nhé."}</b>
          <div className="hw-muted small">
            Câu đúng {pct}%{late && <span className="hw-badge late">Nộp muộn</span>}
          </div>
        </div>
      </div>
      {hw.sections.map((s) => {
        if (s.kind !== "auto") return null;
        const items = result.items.filter((i) => i.sectionId === s.id);
        if (!items.length) return null;
        const wrong = items.filter((i) => !i.correct);
        const got = items.reduce((n, i) => n + i.marks, 0);
        const max = items.reduce((n, i) => n + i.max, 0);
        return (
          <section key={s.id} className="hw-card">
            <h2 className="hw-h2 tight">
              {s.test} <span className="hw-muted">· {s.qtype} · {got}/{max}</span>
            </h2>
            {wrong.length === 0 && <p className="hw-ok">Đúng hết. Tốt lắm!</p>}
            {wrong.map((it) => (
              <Wrong key={it.q} lesson={lesson} it={it} />
            ))}
            {items.length > wrong.length && wrong.length > 0 && (
              <p className="hw-muted small">Đúng: câu {items.filter((i) => i.correct).map((i) => i.q).join(", ")}</p>
            )}
          </section>
        );
      })}
      {result.open.length > 0 && (
        <section className="hw-card">
          <h2 className="hw-h2 tight">Phần cô sẽ nhận xét</h2>
          {result.open.map((o) => (
            <div key={o.sectionId + o.q} className="hw-open">
              <div className="hw-answer">{String(o.value || "(bỏ trống)")}</div>
              {o.released ? <div className="hw-explain">{o.comment}</div> : <div className="hw-muted small">Cô chưa nhận xét.</div>}
            </div>
          ))}
        </section>
      )}
      <a className="hw-btn ghost" href="#/so-loi">Xem sổ lỗi của tôi →</a>
    </div>
  );
}

function Wrong({ lesson, it }: { lesson: string; it: ResultItem }) {
  const [reason, setReason] = useState(it.reason || "");
  const [saved, setSaved] = useState(false);
  const suggested = codeInfo(it.code);
  const choose = (v: string) => {
    setReason(v);
    setSaved(false);
    api.setReason(lesson, it.sectionId, it.q, v).then(() => setSaved(true));
  };
  return (
    <div className="hw-wrong">
      <div className="hw-wrong-head">
        <b>Câu {it.q}</b>
        <span className="hw-tag">Bạn chọn</span>
        <span className="hw-yours">{it.value || "(bỏ trống)"}</span>
        <span className="hw-tag">Đáp án</span>
        <span className="hw-right">{it.expected}</span>
        {it.max > 1 && (
          <span className="hw-muted small">
            ({it.marks}/{it.max})
          </span>
        )}
      </div>
      {it.hint && <div className="hw-hint">{it.hint}</div>}
      {it.explain && <div className="hw-explain">{it.explain}</div>}
      <label className="hw-reason">
        Vì sao mình sai?
        <select value={reason} onChange={(e) => choose(e.target.value)}>
          <option value="">{suggested ? `Cô đoán: ${suggested.name}` : "Chọn lý do…"}</option>
          {CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {saved && <span className="hw-ok small">Đã ghi vào sổ lỗi</span>}
      </label>
    </div>
  );
}
