import { useEffect, useMemo, useRef, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import "survey-core/i18n/vietnamese";
import { api, type Result } from "./api";
import { answerKey, chooseCount } from "./grading";
import type { Answers, Homework } from "./types";
import Results from "./Results";
import { ErrorBox, fmtDate, fmtDue, Loading } from "./ui";

// SurveyJS question names cannot hold "/", so `${sectionId}/${q}` becomes `${sectionId}__${q}`.
const toName = (key: string) => key.replace("/", "__");
const fromName = (name: string) => name.replace("__", "/");

/** Turns our homework format into a SurveyJS form definition: one panel per section. */
export function surveyJson(hw: Homework) {
  const elements = hw.sections.map((s) => {
    if (s.kind === "auto") {
      const head = [s.instructions && `<p>${escapeHtml(s.instructions)}</p>`, s.link && `<p><a href="${s.link}" target="_blank" rel="noopener">Mở bài ${escapeHtml(s.test)} ↗</a></p>`]
        .filter(Boolean)
        .join("");
      return {
        type: "panel",
        name: s.id,
        title: `${s.skill} · ${s.qtype} · ${s.test}`,
        elements: [
          ...(head ? [{ type: "html", name: `${s.id}__head`, html: head }] : []),
          ...s.items.map((it) => {
            const name = toName(answerKey(s.id, it.q));
            const title = `Câu ${it.q}${it.label ? ` · ${it.label}` : ""}`;
            if (it.type === "word") return { type: "text", name, title, placeholder: it.maxWords ? `Tối đa ${it.maxWords} từ` : "", autocomplete: "off" };
            if (it.type === "multi") {
              const n = chooseCount(it);
              return { type: "checkbox", name, title: `${title} (chọn ${n})`, choices: it.options ?? [], maxSelectedChoices: n, colCount: 0 };
            }
            const opts = it.options ?? [];
            // Short options (letters, i–viii) are buttons in one row: easier to tap on a phone than a dropdown.
            return opts.length <= 5 || opts.every((o) => o.length <= 4)
              ? { type: "radiogroup", name, title, choices: opts, colCount: 0 }
              : { type: "dropdown", name, title, choices: opts, searchEnabled: false, placeholder: "Chọn…" };
          }),
        ],
      };
    }
    if (s.kind === "open")
      return {
        type: "panel",
        name: s.id,
        title: s.title,
        description: s.instructions,
        elements: s.items.map((it) => ({ type: "comment", name: toName(answerKey(s.id, it.q)), title: it.prompt, rows: 2, autoGrow: true })),
      };
    return {
      type: "panel",
      name: s.id,
      title: s.title,
      elements: [{ type: "comment", name: toName(answerKey(s.id, "essay")), title: s.prompt, description: s.minWords ? `Tối thiểu ${s.minWords} từ.` : undefined, rows: 14, autoGrow: true }],
    };
  });
  return { locale: "vi", showQuestionNumbers: "off", completeText: "Nộp bài", showCompletedPage: false, questionErrorLocation: "bottom", pages: [{ name: "p1", elements }] };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

const THEME = {
  cssVariables: {
    "--sjs-font-family": "Nunito, system-ui, sans-serif",
    "--sjs-primary-backcolor": "oklch(0.42 0.15 253)",
    "--sjs-primary-backcolor-dark": "oklch(0.36 0.14 253)",
    "--sjs-primary-backcolor-light": "oklch(0.96 0.022 235)",
    "--sjs-general-backcolor-dim": "oklch(0.985 0.006 235)",
    "--sjs-corner-radius": "10px",
    "--sjs-base-unit": "7px",
  },
};

const storageKey = (lesson: string) => `upwind-hw-${lesson}`;

export default function DoHomework({ lesson }: { lesson: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.homework>> | null>(null);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ result: Result; late: boolean } | null>(null);
  const [saved, setSaved] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    api
      .homework(lesson)
      .then((d) => {
        setData(d);
        if (d.result) setResult({ result: d.result, late: d.late });
      })
      .catch((e) => setErr(e.message));
  }, [lesson]);

  const model = useMemo(() => {
    if (!data || data.result) return null;
    const m = new Model(surveyJson(data.homework));
    m.applyTheme(THEME as any);
    let local: Answers = {};
    try {
      local = JSON.parse(localStorage.getItem(storageKey(lesson)) || "{}");
    } catch {}
    const start = { ...data.draft, ...local };
    m.data = Object.fromEntries(Object.entries(start).map(([k, v]) => [toName(k), v]));
    const collect = (): Answers => Object.fromEntries(Object.entries(m.data).map(([k, v]) => [fromName(k), v as string | string[]]));
    m.onValueChanged.add(() => {
      const answers = collect();
      try {
        localStorage.setItem(storageKey(lesson), JSON.stringify(answers));
      } catch {}
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => api.saveDraft(lesson, answers).then(() => setSaved("Đã lưu nháp")).catch(() => setSaved("Chưa lưu được, đang thử lại khi bạn sửa tiếp")), 1500);
    });
    m.onCompleting.add((_, opt) => {
      const blank = m.getAllQuestions().filter((q) => q.isEmpty() && q.getType() !== "html").length;
      if (blank && !window.confirm(`Còn ${blank} câu để trống. Vẫn nộp bài?`)) opt.allow = false;
    });
    m.onComplete.add(() => {
      window.clearTimeout(timer.current);
      api
        .submit(lesson, collect())
        .then((r) => {
          try {
            localStorage.removeItem(storageKey(lesson));
          } catch {}
          setResult({ result: r.result, late: r.late });
          window.scrollTo(0, 0);
        })
        .catch((e) => setErr(e.message));
    });
    return m;
  }, [data, lesson]);

  if (err) return <ErrorBox message={err} />;
  if (!data) return <Loading />;
  const hw = data.homework;
  const past = new Date() > new Date(hw.due);
  return (
    <>
      <a href="#/" className="hw-link">← Danh sách bài</a>
      <h1 className="hw-h1">
        {hw.lesson} · {hw.title}
      </h1>
      <p className="hw-muted">
        Buổi {fmtDate(hw.date)} · Hạn nộp {fmtDue(hw.due)}
        {!result && past && <span className="hw-badge late"> Đã quá hạn: vẫn nộp được, bài sẽ ghi là nộp muộn</span>}
      </p>
      {result ? (
        <Results lesson={lesson} hw={hw} result={result.result} late={result.late} />
      ) : (
        <>
          <p className="hw-muted small">Làm bài trên trang gốc (link trong từng phần), rồi ghi đáp án vào đây. Bài được lưu nháp tự động. {saved}</p>
          {model && <Survey model={model} />}
        </>
      )}
    </>
  );
}
