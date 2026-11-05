import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { api, ApiError, type HomeworkRow } from "./api";
import { ErrorBox, fmtDate, fmtDue, go, Loading, Shell, useRoute } from "./ui";
// SurveyJS is large, so it loads only when a student opens a homework.
const DoHomework = lazy(() => import("./DoHomework"));
import ErrorLog from "./ErrorLog";
import TeacherApp from "./teacher/TeacherApp";

type Me = Awaited<ReturnType<typeof api.me>>;

export default function App() {
  const route = useRoute();
  if (route.startsWith("giao-vien")) return <TeacherApp route={route.replace(/^giao-vien\/?/, "")} />;
  return <StudentApp route={route} />;
}

function StudentApp({ route }: { route: string }) {
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "out" | "in">("loading");
  const load = useCallback(() => {
    api
      .me()
      .then((m) => (setMe(m), setState("in")))
      .catch((e) => (e instanceof ApiError && (e.status === 401 || e.status === 403) ? setState("out") : setState("out")));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    if (state === "in" && route === "") load();
  }, [route]); // refresh the list when coming back home

  if (state === "loading") return <Shell><Loading /></Shell>;
  if (state === "out") return <Shell><Login onIn={load} /></Shell>;

  const logout = (
    <button className="hw-link" onClick={() => api.logout().then(() => setState("out"))}>
      {me!.me.name} · Đăng xuất
    </button>
  );
  const [page, arg] = route.split("/");
  if (page === "bai" && arg) return <Shell right={logout}><Suspense fallback={<Loading />}><DoHomework lesson={decodeURIComponent(arg)} /></Suspense></Shell>;
  if (page === "so-loi") return <Shell right={logout}><ErrorLog name={me!.me.name} /></Shell>;
  return <Shell right={logout}><Home me={me!} /></Shell>;
}

function statusOf(h: HomeworkRow) {
  const past = new Date() > new Date(h.due_at);
  if (h.submitted_at) return h.is_late ? { label: "Nộp muộn", cls: "late" } : { label: "Đã nộp", cls: "done" };
  if (past) return { label: "Quá hạn", cls: "overdue" };
  return h.has_draft ? { label: "Đang làm", cls: "doing" } : { label: "Chưa làm", cls: "todo" };
}

function Home({ me }: { me: Me }) {
  return (
    <>
      <h1 className="hw-h1">Chào {me.me.name}!</h1>
      <p className="hw-muted">Lớp {me.me.class_name}. Làm bài ngay trên trang này: nộp xong là có điểm và lời giải thích của cô.</p>
      <a className="hw-card hw-errlog-link" href="#/so-loi">
        <b>Sổ lỗi của tôi</b>
        <span>Các câu đã sai, lỗi hay mắc và lần sau nên làm gì →</span>
      </a>
      <h2 className="hw-h2">Bài tập</h2>
      {me.homeworks.length === 0 && <p className="hw-muted">Chưa có bài tập nào được mở.</p>}
      <ul className="hw-list">
        {me.homeworks.map((h) => {
          const st = statusOf(h);
          return (
            <li key={h.lesson}>
              <a className="hw-card hw-row" href={`#/bai/${encodeURIComponent(h.lesson)}`}>
                <div>
                  <div className="hw-row-title">
                    {h.lesson} · {h.title}
                  </div>
                  <div className="hw-muted small">
                    Buổi {fmtDate(h.lesson_date)} · Hạn nộp {fmtDue(h.due_at)}
                  </div>
                </div>
                <div className="hw-row-end">
                  {h.submitted_at && h.total ? <span className="hw-score">{h.score}/{h.total}</span> : null}
                  <span className={`hw-badge ${st.cls}`}>{st.label}</span>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Login({ onIn }: { onIn: () => void }) {
  const params = new URLSearchParams(window.location.search);
  const [classId, setClassId] = useState(params.get("lop") || "l3-1");
  const [code, setCode] = useState("");
  const [students, setStudents] = useState<{ id: number; name: string }[] | null>(null);
  const [err, setErr] = useState("");
  const check = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    api.classStudents(classId.trim(), code).then((r) => setStudents(r.students)).catch((x) => setErr(x.message));
  };
  const pick = (id: number) => api.login(classId.trim(), code, id).then(onIn).catch((x) => setErr(x.message));
  return (
    <div className="hw-login">
      <h1 className="hw-h1">Bài tập về nhà</h1>
      <p className="hw-muted">Làm bài ngay trên trang này: nộp xong là có điểm, lời giải thích của cô và sổ lỗi của riêng bạn.</p>
      {!students ? (
        <form onSubmit={check} className="hw-card hw-form">
          <label>
            Lớp
            <input value={classId} onChange={(e) => setClassId(e.target.value)} autoCapitalize="off" />
          </label>
          <label>
            Mã lớp (cô gửi trong nhóm Zalo)
            <input value={code} onChange={(e) => setCode(e.target.value)} autoFocus autoCapitalize="characters" />
          </label>
          <button className="hw-btn" disabled={!code.trim()}>Tiếp tục</button>
          {err && <ErrorBox message={err} />}
        </form>
      ) : (
        <div className="hw-card hw-form">
          <p><b>Bạn là ai?</b></p>
          <div className="hw-names">
            {students.map((s) => (
              <button key={s.id} className="hw-btn ghost" onClick={() => pick(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
          {err && <ErrorBox message={err} />}
          <button className="hw-link" onClick={() => setStudents(null)}>← Nhập lại mã lớp</button>
        </div>
      )}
      <p className="hw-muted small">
        Giáo viên? <a href="#/giao-vien" onClick={() => go("giao-vien")}>Vào trang giáo viên</a>
      </p>
    </div>
  );
}
