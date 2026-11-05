import { useEffect, useState } from "react";
import { api } from "../api";
import { CODES } from "../codes";
import { answerKey } from "../grading";
import type { AutoItem, Homework } from "../types";
import { ErrorBox, Loading } from "../ui";

// Deadline shown and typed in Vietnam time (UTC+7), stored as ISO with +07:00.
const toLocal = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 16);
const fromLocal = (v: string) => `${v}:00+07:00`;

export default function EditHomework({ classId, lesson }: { classId: string; lesson: string }) {
  const [hw, setHw] = useState<Homework | null>(null);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.stats>> | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api.teacherHomework(classId, lesson).then((r) => setHw(r.homework)).catch((e) => setErr(e.message));
    api.stats(classId, lesson).then(setStats).catch(() => {});
  }, [classId, lesson]);
  if (err) return <ErrorBox message={err} />;
  if (!hw) return <Loading />;

  const setItem = (si: number, ii: number, patch: Partial<AutoItem>) =>
    setHw((h) => {
      const next = structuredClone(h!);
      const s = next.sections[si];
      if (s.kind === "auto") Object.assign(s.items[ii], patch);
      return next;
    });
  const missing = hw.sections.flatMap((s) => (s.kind === "auto" ? s.items.filter((i) => !i.answer.length).map((i) => `${s.test} câu ${i.q}`) : []));
  const save = (status: Homework["status"]) =>
    api
      .saveHomework(classId, lesson, { ...hw, status })
      .then(() => (setHw({ ...hw, status }), setMsg(status === "approved" ? "Đã duyệt: học viên thấy bài này ngay." : "Đã lưu bản nháp.")))
      .catch((e) => setMsg(e.message));

  return (
    <div className="hw-edit">
      <a href="#/giao-vien/bai" className="hw-link">← Bài tập</a>
      <h1 className="hw-h1">
        {hw.lesson} · <input className="hw-inline" value={hw.title} onChange={(e) => setHw({ ...hw, title: e.target.value })} />
      </h1>
      <div className="hw-card hw-form row">
        <label>
          Hạn nộp (giờ Việt Nam)
          <input type="datetime-local" value={toLocal(hw.due)} onChange={(e) => setHw({ ...hw, due: fromLocal(e.target.value) })} />
        </label>
        <span className={`hw-badge ${hw.status === "approved" ? "done" : "todo"}`}>{hw.status === "approved" ? "Đã mở cho học viên" : "Bản nháp"}</span>
        {stats && <span className="hw-muted small">{stats.submitted} bạn đã nộp</span>}
      </div>

      {hw.sections.map((s, si) => {
        if (s.kind !== "auto")
          return (
            <section key={s.id} className="hw-card">
              <h2 className="hw-h2 tight">{s.title}</h2>
              <p className="hw-muted small">{s.kind === "writing" ? "Bài viết: học viên nộp, cô nhận xét sau." : `${s.items.length} câu mở: học viên tự viết, cô nhận xét sau.`}</p>
            </section>
          );
        return (
          <section key={s.id} className="hw-card">
            <h2 className="hw-h2 tight">
              {s.skill} · {s.qtype} · {s.test}
            </h2>
            {s.link && <a href={s.link} target="_blank" rel="noopener" className="small">{s.link}</a>}
            {s.items.map((it, ii) => {
              const st = stats?.stats[answerKey(s.id, it.q)];
              return (
                <div key={it.q} className={`hw-item ${it.answer.length ? "" : "needs"}`}>
                  <div className="hw-item-head">
                    <b>Câu {it.q}</b>
                    {it.label && <span className="hw-muted">{it.label}</span>}
                    <label>
                      Đáp án
                      <input
                        value={it.answer.join(it.type === "word" ? " / " : ", ")}
                        placeholder={it.type === "word" ? "parking / parking spaces" : it.type === "multi" ? "C, E" : "G"}
                        onChange={(e) => setItem(si, ii, { answer: e.target.value.split(it.type === "word" ? "/" : /[,\s]+/).map((x) => x.trim()).filter(Boolean) })}
                      />
                    </label>
                    <label>
                      Lỗi gợi ý
                      <select value={it.code || ""} onChange={(e) => setItem(si, ii, { code: e.target.value || undefined })}>
                        <option value="">–</option>
                        {CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
                        ))}
                      </select>
                    </label>
                    {st && st.done > 0 && (
                      <span className="hw-stat-chip" title="Các đáp án sai học viên đã chọn">
                        {st.wrong}/{st.done} sai
                        {Object.entries(st.values).sort((a, b) => b[1] - a[1]).map(([v, n]) => ` · ${v} (${n})`).join("")}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={it.explain || ""}
                    placeholder="Giải thích cho học viên làm sai câu này (viết một lần, mọi bạn sai đều thấy)"
                    onChange={(e) => setItem(si, ii, { explain: e.target.value })}
                  />
                </div>
              );
            })}
          </section>
        );
      })}

      <div className="hw-savebar">
        {missing.length > 0 && <span className="hw-error small">Chưa có đáp án: {missing.join(", ")} (câu này sẽ không được chấm)</span>}
        <button className="hw-btn ghost" onClick={() => save("draft")}>Lưu nháp</button>
        <button className="hw-btn" onClick={() => save("approved")}>{hw.status === "approved" ? "Lưu thay đổi" : "Duyệt và mở cho học viên"}</button>
        {msg && <span className="hw-ok">{msg}</span>}
      </div>
    </div>
  );
}
