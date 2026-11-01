import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Family, Word } from "./data";
import { formIn, practiceFor, splitAt } from "./lib";
import { ColoredWord, Speak } from "./ui";

type Q = { kind: "gap"; w: Word; retry?: boolean } | { kind: "mcq"; w: Word; options: string[]; retry?: boolean };

/** The handbook's gap-fill (same sentences and word bank) + 3 meaning questions. Score = right on the first try. */
export function Practice({ f, onFinish }: { f: Family; onFinish: (score: number, total: number) => void }) {
  const set = useMemo(() => practiceFor(f), [f]);
  const total = set.gaps.length + set.mcq.length;
  const [queue, setQueue] = useState<Q[]>(() => [
    ...set.gaps.map((w) => ({ kind: "gap" as const, w })),
    ...set.mcq.map((m) => ({ kind: "mcq" as const, w: m.w, options: m.options })),
  ]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const q = queue[i];
  const answer = q.kind === "gap" ? q.w.word : q.w.meaning;
  const right = pick === answer;

  const choose = (v: string) => {
    if (pick) return;
    setPick(v);
    if (v === answer && !q.retry) setScore((s) => s + 1);
    if (v !== answer && !q.retry) setQueue((qs) => [...qs, { ...q, retry: true }]);
  };
  const next = () => {
    if (i + 1 >= queue.length) return onFinish(score, total);
    setI(i + 1);
    setPick(null);
  };

  return (
    <section className="screen practice">
      <p className="kicker">
        Luyện tập · câu {Math.min(i + 1, total)}/{total}
        {q.retry && " · làm lại câu sai"}
      </p>
      <div className="dots" aria-hidden="true">
        {queue.map((_, k) => (
          <i key={k} className={k < i ? "past" : k === i ? "now" : ""} />
        ))}
      </div>

      {q.kind === "gap" ? (
        <Gap q={q} bank={set.bank} pick={pick} onPick={choose} />
      ) : (
        <div className="mcq">
          <p className="q">
            <ColoredWord w={q.w} className="word-mid" /> <Speak text={q.w.word} /> nghĩa là gì?
          </p>
          <div className="options">
            {q.options.map((o) => (
              <button
                key={o}
                type="button"
                className={"option" + (pick && o === answer ? " ok" : "") + (pick === o && !right ? " bad" : "")}
                onClick={() => choose(o)}
                disabled={!!pick}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {pick && (
        <motion.div
          className={"feedback " + (right ? "ok" : "bad")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          {right ? "✓ Chính xác!" : "✗ Chưa đúng."}{" "}
          {q.kind === "gap" ? (
            <>
              Đáp án: <b>{q.w.word}</b>
              {formIn(q.w.example, q.w.word).toLowerCase() !== q.w.word.toLowerCase() && (
                <> → <i>{formIn(q.w.example, q.w.word)}</i></>
              )}{" "}
              ({q.w.meaning})
            </>
          ) : (
            !right && (
              <>
                <b>{q.w.word}</b> = {q.w.meaning}
              </>
            )
          )}
          {!right && !q.retry && <div className="small">Câu này sẽ được hỏi lại ở cuối.</div>}
        </motion.div>
      )}

      <div className="bottombar">
        <button className="btn primary wide" onClick={next} disabled={!pick}>
          {i + 1 >= queue.length ? "Xem kết quả →" : "Câu tiếp →"}
        </button>
      </div>
    </section>
  );
}

function Gap({ q, bank, pick, onPick }: { q: Q; bank: string[]; pick: string | null; onPick: (v: string) => void }) {
  const [before, form, after] = splitAt(q.w.example, q.w.word);
  const right = pick === q.w.word;
  return (
    <div className="gap">
      <p className="q small">Điền dạng đúng của từ vào chỗ trống</p>
      <p className="sentence" lang="en">
        {before}
        <span className={"blank" + (pick ? (right ? " ok" : " bad") : "")}>{pick ? (right ? form : pick) : " ".repeat(10)}</span>
        {after}
      </p>
      <p className="vi">{q.w.example_vi}</p>
      <div className="bank">
        {bank.map((b) => (
          <button
            key={b}
            type="button"
            className={"chip small" + (pick && b === q.w.word ? " ok" : "") + (pick === b && !right ? " bad" : "")}
            onClick={() => onPick(b)}
            disabled={!!pick}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
