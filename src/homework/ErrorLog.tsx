import { useEffect, useState } from "react";
import { api } from "./api";
import { codeInfo } from "./codes";
import { ErrorBox, fmtDate, Loading } from "./ui";

type Data = Awaited<ReturnType<typeof api.errors>>;

export default function ErrorLog({ name }: { name: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.errors().then(setData).catch((e) => setErr(e.message));
  }, []);
  if (err) return <ErrorBox message={err} />;
  if (!data) return <Loading />;

  const counts = new Map<string, number>();
  for (const e of data.errors) if (e.code) counts.set(e.code, (counts.get(e.code) || 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const pct = data.total ? Math.round((100 * data.score) / data.total) : 0;

  return (
    <>
      <a href="#/" className="hw-link">← Danh sách bài</a>
      <h1 className="hw-h1">Sổ lỗi của {name}</h1>
      <div className="hw-stats">
        <div className="hw-stat"><b>{data.homeworks}</b><span>bài đã nộp</span></div>
        <div className="hw-stat"><b>{pct}%</b><span>câu làm đúng</span></div>
        <div className="hw-stat"><b>{data.errors.length}</b><span>câu sai đã ghi</span></div>
      </div>
      {top.length > 0 && (
        <div className="hw-card">
          <h2 className="hw-h2 tight">3 lỗi bạn hay mắc nhất</h2>
          <ol className="hw-top3">
            {top.map(([code, n], i) => (
              <li key={code}>
                <span className="hw-rank">{i + 1}</span>
                <span>
                  <b>{codeInfo(code)?.name ?? code}</b> <span className="hw-count">{n} lần</span>
                  <span className="hw-fix">Lần sau: {codeInfo(code)?.fix}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <h2 className="hw-h2">Từng câu sai (mới nhất ở trên)</h2>
      {data.errors.length === 0 && <p className="hw-muted">Chưa có câu sai nào. Làm bài để bắt đầu sổ lỗi nhé.</p>}
      {data.errors.map((e, i) => (
        <div key={i} className="hw-card hw-wrong">
          <div className="hw-muted small">
            {e.lesson} · {fmtDate(e.date)} · {e.test}
            {e.late && <span className="hw-badge late">Nộp muộn</span>}
          </div>
          <div className="hw-wrong-head">
            <b>Câu {e.q.replace(/ \(\d+\)$/, "")}</b>
            <span className="hw-tag">Bạn chọn</span>
            <span className="hw-yours">{e.value || "(bỏ trống)"}</span>
            <span className="hw-tag">Đáp án</span>
            <span className="hw-right">{e.expected && e.expected !== "(chưa có)" ? e.expected : "–"}</span>
          </div>
          {e.explain && <div className="hw-explain">{e.explain}</div>}
          {e.code && (
            <div className="small">
              <b>Lỗi:</b> {codeInfo(e.code)?.name} · <b>Lần sau:</b> {codeInfo(e.code)?.fix}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
