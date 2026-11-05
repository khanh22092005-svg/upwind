import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Overview } from "../api";
import { codeInfo } from "../codes";
import type { Homework } from "../types";
import { ErrorBox, fmtDate, fmtDue, go, Loading, Shell } from "../ui";
import EditHomework from "./EditHomework";

export default function TeacherApp({ route }: { route: string }) {
  const [state, setState] = useState<"loading" | "out" | "in">("loading");
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof api.classes>> | null>(null);
  const [classId, setClassId] = useState(() => localStorage.getItem("upwind-hw-class") || "");
  const load = useCallback(() => {
    api
      .classes()
      .then((c) => {
        setClasses(c);
        setState("in");
        if (!classId && c.classes[0]) setClassId(c.classes[0].id);
      })
      .catch((e) => setState(e instanceof ApiError && (e.status === 401 || e.status === 403) ? "out" : "out"));
  }, [classId]);
  useEffect(load, []);
  useEffect(() => {
    if (classId) localStorage.setItem("upwind-hw-class", classId);
  }, [classId]);

  if (state === "loading") return <Shell><Loading /></Shell>;
  if (state === "out") return <Shell><TeacherLogin onIn={load} /></Shell>;

  const [page, arg] = route.split("/");
  const nav = (
    <nav className="hw-tabs">
      <a href="#/giao-vien" className={!page ? "on" : ""}>Tổng quan</a>
      <a href="#/giao-vien/bai" className={page === "bai" ? "on" : ""}>Bài tập</a>
      <a href="#/giao-vien/lop" className={page === "lop" ? "on" : ""}>Lớp</a>
      <select value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Lớp">
        {classes!.classes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        {!classes!.classes.length && <option value="">Chưa có lớp</option>}
      </select>
    </nav>
  );
  return (
    <Shell wide right={<button className="hw-link" onClick={() => api.logout().then(() => setState("out"))}>Đăng xuất</button>}>
      {nav}
      {page === "lop" ? (
        <ClassSetup classes={classes!} classId={classId} onSaved={(id) => (setClassId(id), load())} />
      ) : !classId ? (
        <p>Tạo lớp trước ở tab <a href="#/giao-vien/lop">Lớp</a>.</p>
      ) : page === "bai" && arg ? (
        <EditHomework classId={classId} lesson={decodeURIComponent(arg)} />
      ) : page === "bai" ? (
        <HomeworkList classId={classId} />
      ) : (
        <OverviewPage classId={classId} />
      )}
    </Shell>
  );
}

function TeacherLogin({ onIn }: { onIn: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  return (
    <form
      className="hw-card hw-form hw-login"
      onSubmit={(e) => {
        e.preventDefault();
        api.teacherLogin(code).then(onIn).catch((x) => setErr(x.message));
      }}
    >
      <h1 className="hw-h1">Trang giáo viên</h1>
      <label>
        Mã giáo viên
        <input type="password" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
      </label>
      <button className="hw-btn">Vào</button>
      {err && <ErrorBox message={err} />}
    </form>
  );
}

function OverviewPage({ classId }: { classId: string }) {
  const [o, setO] = useState<Overview | null>(null);
  const [err, setErr] = useState("");
  const load = () => api.overview(classId).then(setO).catch((e) => setErr(e.message));
  useEffect(() => void load(), [classId]);
  if (err) return <ErrorBox message={err} />;
  if (!o) return <Loading />;
  const hws = o.homeworks.filter((h) => h.status === "approved");
  const cell = (hid: string, sid: number) => o.cells.find((c) => c.homeworkId === hid && c.studentId === sid);
  const now = new Date();
  const pendingReview = o.cells.reduce((n, c) => n + (c.pending || 0), 0);
  return (
    <>
      <h1 className="hw-h1">Tổng quan lớp</h1>
      <p className="hw-muted">
        Điểm = số câu đúng / số câu chấm tự động. % chỉ tính bài đã nộp.
        {pendingReview > 0 && <> · <b>{pendingReview}</b> câu mở / bài viết đang chờ cô nhận xét.</>}
      </p>
      <div className="hw-legend" aria-label="Chú thích màu">
        <span className="done">Đã nộp</span>
        <span className="late">Nộp muộn</span>
        <span className="missing">Quá hạn, chưa nộp</span>
        <span>– chưa đến hạn</span>
      </div>
      <div className="hw-table-wrap">
        <table className="hw-table">
          <thead>
            <tr>
              <th>Học viên</th>
              {hws.map((h) => (
                <th key={h.id} title={h.title}>
                  <a href={`#/giao-vien/bai/${encodeURIComponent(h.lesson)}`}>{h.lesson}</a>
                  <div className="hw-muted small">hạn {fmtDue(h.due_at)}</div>
                </th>
              ))}
              <th>Câu đúng</th>
              <th className="left">Lỗi hay mắc nhất</th>
            </tr>
          </thead>
          <tbody>
            {o.students.map((s) => {
              let got = 0,
                max = 0;
              const top = Object.entries(o.codes[s.id] || {}).sort((a, b) => b[1] - a[1])[0];
              return (
                <tr key={s.id}>
                  <th>{s.name}</th>
                  {hws.map((h) => {
                    const c = cell(h.id, s.id);
                    if (c?.submittedAt) {
                      got += c.score || 0;
                      max += c.total || 0;
                      return (
                        <td key={h.id} className={c.late ? "late" : "done"} title={`Nộp lúc ${new Date(c.submittedAt).toLocaleString("vi-VN")} · ${c.device || ""}`}>
                          {c.score}/{c.total}
                          {c.late && <div className="small">muộn</div>}
                          {!!c.pending && <div className="small">{c.pending} chờ nhận xét</div>}
                          <button
                            className="hw-mini"
                            title="Xoá bài nộp để học viên làm lại"
                            onClick={() => window.confirm(`Xoá bài nộp ${h.lesson} của ${s.name}? Học viên sẽ phải nộp lại.`) && api.resetSubmission(c.id!).then(load)}
                          >
                            ↺
                          </button>
                        </td>
                      );
                    }
                    const overdue = now > new Date(h.due_at);
                    return (
                      <td key={h.id} className={overdue ? "missing" : ""}>
                        {overdue ? "chưa nộp" : c?.started ? "đang làm" : "–"}
                      </td>
                    );
                  })}
                  <td>{max ? Math.round((100 * got) / max) + "%" : "–"}</td>
                  <td className="small left wrap">{top ? `${codeInfo(top[0])?.name ?? top[0]} (${top[1]})` : "–"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th>Đã nộp</th>
              {hws.map((h) => (
                <td key={h.id}>
                  {o.cells.filter((c) => c.homeworkId === h.id && c.submittedAt).length}/{o.students.length}
                </td>
              ))}
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

function HomeworkList({ classId }: { classId: string }) {
  const [o, setO] = useState<Overview | null>(null);
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");
  const load = () => api.overview(classId).then(setO);
  useEffect(() => void load(), [classId]);
  const add = () => {
    try {
      const hw = JSON.parse(json) as Homework;
      api.saveHomework(classId, hw.lesson, { ...hw, status: "draft" }).then(() => (setMsg(`Đã thêm ${hw.lesson} (bản nháp). Mở để duyệt.`), setJson(""), load()));
    } catch {
      setMsg("Nội dung chưa đúng định dạng JSON.");
    }
  };
  if (!o) return <Loading />;
  return (
    <>
      <h1 className="hw-h1">Bài tập</h1>
      <ul className="hw-list">
        {[...o.homeworks].reverse().map((h) => (
          <li key={h.id}>
            <a className="hw-card hw-row" href={`#/giao-vien/bai/${encodeURIComponent(h.lesson)}`}>
              <div>
                <div className="hw-row-title">{h.lesson} · {h.title}</div>
                <div className="hw-muted small">Buổi {fmtDate(h.lesson_date)} · Hạn {fmtDue(h.due_at)}</div>
              </div>
              <span className={`hw-badge ${h.status === "approved" ? "done" : "todo"}`}>{h.status === "approved" ? "Đã mở" : "Bản nháp"}</span>
            </a>
          </li>
        ))}
      </ul>
      <details className="hw-card">
        <summary><b>Thêm bài mới</b> (dán nội dung do Claude tạo từ bảng đáp án)</summary>
        <textarea className="hw-code" rows={8} value={json} onChange={(e) => setJson(e.target.value)} placeholder='{"lesson":"L8", …}' />
        <button className="hw-btn" onClick={add} disabled={!json.trim()}>Thêm bản nháp</button>
        {msg && <p className="hw-muted">{msg}</p>}
      </details>
    </>
  );
}

function ClassSetup({ classes, classId, onSaved }: { classes: Awaited<ReturnType<typeof api.classes>>; classId: string; onSaved: (id: string) => void }) {
  const cur = classes.classes.find((c) => c.id === classId);
  const [id, setId] = useState(cur?.id || "l3-1");
  const [name, setName] = useState(cur?.name || "UpWind L3-1");
  const [code, setCode] = useState("");
  const [names, setNames] = useState(classes.students.filter((s) => s.class_id === (cur?.id || "") && s.active).map((s) => s.name).join("\n"));
  const [msg, setMsg] = useState("");
  return (
    <div className="hw-card hw-form">
      <h1 className="hw-h1">Lớp</h1>
      <label>Mã định danh lớp (dùng trong link, ví dụ l3-1)<input value={id} onChange={(e) => setId(e.target.value)} /></label>
      <label>Tên lớp<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>
        Mã lớp cho học viên {cur?.has_code ? "(đã đặt; nhập mã mới để đổi)" : "(chưa đặt: học viên chưa vào được)"}
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ví dụ: GIO-BIEN-7" />
      </label>
      <label>Học viên, mỗi dòng một tên<textarea rows={8} value={names} onChange={(e) => setNames(e.target.value)} /></label>
      <button
        className="hw-btn"
        onClick={() => api.saveClass(id.trim().toLowerCase(), name, code, names.split("\n")).then(() => (setMsg("Đã lưu."), setCode(""), onSaved(id.trim().toLowerCase())))}
      >
        Lưu lớp
      </button>
      {msg && <p className="hw-ok">{msg}</p>}
      <p className="hw-muted small">
        Link gửi học viên: <code>https://upwind.asia/homework/?lop={id}</code> kèm mã lớp. Bỏ một tên khỏi danh sách = ẩn học viên, không xoá bài đã nộp.
      </p>
      <button className="hw-link" onClick={() => go("giao-vien")}>← Tổng quan</button>
    </div>
  );
}
