import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Family, Word, WordForm } from "./data";
import { formIn, practiceFor, splitAt } from "./lib";
import { ColoredWord, Speak } from "./ui";

type Q =
  | { kind: "gap"; w: Word; retry?: boolean }
  | { kind: "wf"; q: WordForm; retry?: boolean }
  | { kind: "mcq"; w: Word; options: string[]; retry?: boolean };

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
/** "inaudible" or "inaudible / unheard" -> every accepted answer */
const accepted = (a: string) => a.split(/\s*\/\s*/).map(norm);

/** The ebook's "Hoàn thành câu" + "Word form" items, then meaning questions. Score = right on the first try. */
export function Practice({ f, onFinish }: { f: Family; onFinish: (score: number, total: number) => void }) {
  const set = useMemo(() => practiceFor(f), [f]);
  const total = set.gaps.length + set.wf.length + set.mcq.length;
  const [queue, setQueue] = useState<Q[]>(() => [
    ...set.gaps.map((w) => ({ kind: "gap" as const, w })),
    ...set.wf.map((q) => ({ kind: "wf" as const, q })),
    ...set.mcq.map((m) => ({ kind: "mcq" as const, w: m.w, options: m.options })),
  ]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const q = queue[i];
  const isRight = (v: string) =>
    q.kind === "gap" ? v === q.w.word : q.kind === "wf" ? accepted(q.q.a).includes(norm(v)) : v === q.w.meaning;
  const right = pick !== null && isRight(pick);

  const choose = (v: string) => {
    if (pick !== null || !v.trim()) return;
    setPick(v);
    const ok = isRight(v);
    if (ok && !q.retry) setScore((s) => s + 1);
    if (!ok && !q.retry) setQueue((qs) => [...qs, { ...q, retry: true }]);
  };
  const next = () => {
    if (i + 1 >= queue.length) return onFinish(score, total);
    setI(i + 1);
    setPick(null);
    setTyped("");
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

      {q.kind === "gap" && <Gap w={q.w} bank={set.bank} pick={pick} onPick={choose} />}

      {q.kind === "wf" && (
        <form
          className="wf"
          onSubmit={(e) => {
            e.preventDefault();
            choose(typed);
          }}
        >
          <p className="q small">Viết dạng đúng của từ in hoa</p>
          <p className="sentence" lang="en">
            {q.q.s.split("___").map((part, k, arr) => (
              <span key={k}>
                {part}
                {k < arr.length - 1 && (
                  <span className={"blank" + (pick !== null ? (right ? " ok" : " bad") : "")}>
                    {pick !== null ? (right ? q.q.a.split("/")[0].trim() : pick) : " ".repeat(10)}
                  </span>
                )}
              </span>
            ))}
          </p>
          <p className="base-word">
            Từ gốc: <b>{q.q.base}</b>
          </p>
          <div className="wf-input">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={pick !== null}
              placeholder="Gõ từ của bạn..."
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              lang="en"
              aria-label="Câu trả lời"
            />
            <button className="btn primary" type="submit" disabled={pick !== null || !typed.trim()}>
              Kiểm tra
            </button>
          </div>
        </form>
      )}

      {q.kind === "mcq" && (
        <div className="mcq">
          <p className="q">
            <ColoredWord w={q.w} className="word-mid" /> <Speak text={q.w.word} /> nghĩa là gì?
          </p>
          <div className="options">
            {q.options.map((o) => (
              <button
                key={o}
                type="button"
                className={"option" + (pick !== null && o === q.w.meaning ? " ok" : "") + (pick === o && !right ? " bad" : "")}
                onClick={() => choose(o)}
                disabled={pick !== null}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {pick !== null && (
        <motion.div className={"feedback " + (right ? "ok" : "bad")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="status">
          {right ? "✓ Chính xác!" : "✗ Chưa đúng."}{" "}
          {q.kind === "gap" && (
            <>
              Đáp án: <b>{q.w.word}</b>
              {formIn(q.w).toLowerCase() !== q.w.word.toLowerCase() && (
                <>
                  {" "}
                  → <i>{formIn(q.w)}</i>
                </>
              )}{" "}
              ({q.w.meaning})
            </>
          )}
          {q.kind === "wf" && !right && (
            <>
              Đáp án: <b>{q.q.a}</b>
            </>
          )}
          {q.kind === "mcq" && !right && (
            <>
              <b>{q.w.word}</b> = {q.w.meaning}
            </>
          )}
          {!right && !q.retry && <div className="small">Câu này sẽ được hỏi lại ở cuối.</div>}
        </motion.div>
      )}

      <div className="bottombar">
        <button className="btn primary wide" onClick={next} disabled={pick === null}>
          {i + 1 >= queue.length ? "Xem kết quả →" : "Câu tiếp →"}
        </button>
      </div>
    </section>
  );
}

function Gap({ w, bank, pick, onPick }: { w: Word; bank: string[]; pick: string | null; onPick: (v: string) => void }) {
  const [before, form, after] = splitAt(w);
  const right = pick === w.word;
  return (
    <div className="gap">
      <p className="q small">Điền từ trong khung vào chỗ trống. Chia đúng dạng nếu cần.</p>
      <p className="sentence" lang="en">
        {before}
        <span className={"blank" + (pick ? (right ? " ok" : " bad") : "")}>{pick ? (right ? form : pick) : " ".repeat(10)}</span>
        {after}
      </p>
      <p className="vi">{w.example_vi}</p>
      <div className="bank">
        {bank.map((b) => (
          <button
            key={b}
            type="button"
            className={"chip small" + (pick && b === w.word ? " ok" : "") + (pick === b && !right ? " bad" : "")}
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
