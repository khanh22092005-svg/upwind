import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { affixKey, strangeFruit } from "./bridges";
import { shortRoot, type Family, type Part, type Word, type WordForm } from "./data";
import { PartBuilder } from "./PartBuilder";
import { formIn, recallWords, rootIn, spellings, splitAt } from "./lib";
import { markSeen } from "./progress";
import { Recall } from "./Recall";

type Fruit = ReturnType<typeof strangeFruit>[number];
type Q = ({ kind: "recall"; w: Word } | { kind: "wf"; q: WordForm } | { kind: "fruit"; fruit: Fruit }) & { retry?: boolean };

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
/** "inaudible" or "inaudible / unheard" -> every accepted answer */
const accepted = (a: string) => a.split(/\s*\/\s*/).map(norm);

/**
 * Thử thách: no word bank and no "pick the word". Type the word into its sentence (recall), the ebook's
 * Word form items, then "quả lạ": a word from another branch to build and work out. Score = right on the first
 * try without a hint.
 */
export function Practice({ f, onFinish }: { f: Family; onFinish: (score: number, total: number, fruit: Fruit[]) => void }) {
  const fruit = useMemo(() => strangeFruit(f, 2), [f]);
  const [queue, setQueue] = useState<Q[]>(() => {
    const recall = recallWords(f, fruit.length < 2 ? 6 - fruit.length : 4);
    return [
      ...recall.map((w) => ({ kind: "recall" as const, w })),
      ...(f.wf ?? []).slice(0, 2).map((q) => ({ kind: "wf" as const, q })),
      ...fruit.map((x) => ({ kind: "fruit" as const, fruit: x })),
    ];
  });
  const total = useMemo(() => queue.length, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const q = queue[i];

  const result = (firstTryOk: boolean, retryable = true) => {
    setAnswered(true);
    if (q.retry) return;
    if (firstTryOk) setScore((s) => s + 1);
    else if (retryable) setQueue((qs) => [...qs, { ...q, retry: true }]);
  };
  const next = () => {
    if (i + 1 >= queue.length) return onFinish(score, total, fruit);
    setI(i + 1);
    setAnswered(false);
  };

  return (
    <section className="screen practice">
      <p className="kicker">
        Thử thách · {Math.min(i + 1, total)}/{total}
        {q.retry && " · làm lại câu sai"}
      </p>
      <div className="dots" aria-hidden="true">
        {queue.map((x, k) => (
          <i key={k} className={(k < i ? "past" : k === i ? "now" : "") + (x.kind === "fruit" ? " fruit" : "")} />
        ))}
      </div>

      {q.kind === "recall" && <RecallQ key={i} w={q.w} onResult={(ok, hints) => result(ok && hints === 0)} />}
      {q.kind === "wf" && <WordFormQ key={i} q={q.q} onResult={(ok) => result(ok)} />}
      {q.kind === "fruit" && <FruitQ key={i} f={f} fruit={q.fruit} onResult={(ok) => result(ok, false)} />}

      <div className="bottombar">
        <button className="btn primary wide" onClick={next} disabled={!answered}>
          {i + 1 >= queue.length ? "Xem kết quả →" : "Tiếp →"}
        </button>
      </div>
    </section>
  );
}

function RecallQ({ w, onResult }: { w: Word; onResult: (ok: boolean, hints: number) => void }) {
  const [before, , after] = splitAt(w);
  const target = formIn(w);
  return (
    <>
      <p className="q small">Gõ từ còn thiếu, đúng dạng trong câu</p>
      <p className="meaning-cue">{w.meaning}</p>
      <p className="sentence" lang="en">
        {before}
        <span className="blank">{" ".repeat(8)}</span>
        {after}
      </p>
      <p className="vi">{w.example_vi}</p>
      <Recall
        target={target}
        scaffold={rootIn(w, target)}
        otherForms={spellings(w).filter((s) => s !== target.toLowerCase())}
        onResult={(r) => onResult(r.ok, r.hints)}
      />
    </>
  );
}

function WordFormQ({ q, onResult }: { q: WordForm; onResult: (ok: boolean) => void }) {
  const [typed, setTyped] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const right = pick !== null && accepted(q.a).includes(norm(pick));
  return (
    <form
      className="wf"
      onSubmit={(e) => {
        e.preventDefault();
        if (pick !== null || !typed.trim()) return;
        setPick(typed);
        onResult(accepted(q.a).includes(norm(typed)));
      }}
    >
      <p className="q small">Viết dạng đúng của từ in hoa</p>
      <p className="sentence" lang="en">
        {q.s.split("___").map((part, k, arr) => (
          <span key={k}>
            {part}
            {k < arr.length - 1 && (
              <span className={"blank" + (pick !== null ? (right ? " ok" : " bad") : "")}>
                {pick !== null ? (right ? q.a.split("/")[0].trim() : pick) : " ".repeat(10)}
              </span>
            )}
          </span>
        ))}
      </p>
      <p className="base-word">
        Từ gốc: <b>{q.base}</b>
      </p>
      <div className="wf-input">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={pick !== null}
          placeholder="Gõ từ..."
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          lang="en"
          aria-label="Câu trả lời"
        />
        <button className="btn primary" type="submit" disabled={pick !== null || !typed.trim()}>
          Kiểm tra
        </button>
      </div>
      {pick !== null && (
        <div className={"feedback " + (right ? "ok" : "bad")} role="status">
          {right ? "✓ Chính xác!" : <>✗ Đáp án: <b>{q.a}</b></>}
        </div>
      )}
    </form>
  );
}

/** "Quả lạ": a word from another branch that shares a prefix/suffix with this one. Build it from its parts, then work out the meaning. */
function FruitQ({ f, fruit, onResult }: { f: Family; fruit: Fruit; onResult: (ok: boolean) => void }) {
  const [built, setBuilt] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const right = pick === fruit.w.meaning;
  return (
    <div className="fruit-q">
      <p className="fruit-tag">
        <span className="fruit-dot" /> Quả lạ từ nhánh khác
      </p>
      <p className="q small">
        Bạn chưa học từ này. Nhưng nó có <b>{fruit.via.k === "pre" ? `${fruit.via.t}-` : `-${fruit.via.t}`}</b>, giống một từ
        trong gốc {shortRoot(f)}. Ghép nó lại rồi đoán nghĩa.
      </p>
      <PartBuilder w={fruit.w} onDone={() => setBuilt(true)} />
      {built && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="q">
            Vậy <b lang="en">{fruit.w.word}</b> nghĩa là gì?
          </p>
          <div className="options">
            {fruit.options.map((o) => (
              <button
                key={o}
                type="button"
                className={"option" + (pick !== null && o === fruit.w.meaning ? " ok" : "") + (pick === o && !right ? " bad" : "")}
                disabled={pick !== null}
                onClick={() => {
                  setPick(o);
                  markSeen(fruit.w.word);
                  onResult(o === fruit.w.meaning);
                }}
              >
                {o}
              </button>
            ))}
          </div>
          {pick !== null && (
            <div className={"feedback " + (right ? "ok" : "bad")} role="status">
              {right ? "✓ Đoán đúng!" : "✗ Chưa đúng."} <b>{fruit.w.word}</b> = {fruit.w.meaning}. <i>{fruit.w.story}</i>
              <div className="small">
                Quả này thuộc nhánh gốc <b>{fruit.family.root}</b> (bài {fruit.family.n}). Nó đã được đánh dấu trên cây.
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
