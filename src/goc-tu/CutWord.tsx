import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { COLORS, type Word } from "./data";

/** Letters of each part as they appear in the word: "o(b)" -> "o". */
const shown = (t: string) => t.replace(/\(.*?\)/g, "");

/**
 * "Cắt từ": the word is shown letter by letter; the learner taps between letters to cut it into its parts.
 * A wrong cut wobbles; after two wrong cuts the next right gap glows. When every cut is made, each part takes its
 * colour and shows its Vietnamese meaning.
 */
export function CutWord({ w, onDone, known }: { w: Word; onDone: () => void; known?: (p: Word["parts"][number]) => boolean }) {
  const letters = useMemo(() => [...w.word], [w.word]);
  // gap g sits between letters[g-1] and letters[g]
  const cuts = useMemo(() => {
    const out: number[] = [];
    let n = 0;
    for (const p of w.parts.slice(0, -1)) out.push((n += shown(p.t).length));
    return out;
  }, [w.parts]);
  const [made, setMade] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const done = cuts.every((c) => made.includes(c));

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [done, onDone]);

  const tap = (g: number) => {
    if (done || made.includes(g)) return;
    if (cuts.includes(g)) {
      setMade((m) => [...m, g]);
      setMisses(0);
    } else {
      setWrong(g);
      setMisses((m) => m + 1);
      setTimeout(() => setWrong(null), 420);
    }
  };

  // which part each letter belongs to (for colouring once it's cut)
  const partOf = useMemo(() => {
    const out: number[] = [];
    w.parts.forEach((p, i) => [...shown(p.t)].forEach(() => out.push(i)));
    return out;
  }, [w.parts]);
  const nextCut = cuts.find((c) => !made.includes(c));

  return (
    <div className="cut">
      <p className="q">
        {done ? "Đã tách xong!" : `Chạm vào khe giữa các chữ cái để cắt từ thành ${w.parts.length} mảnh`}
      </p>
      <div className={"cut-word" + (done ? " done" : "")} lang="en" aria-label={w.word}>
        {letters.map((ch, i) => {
          const pi = partOf[i];
          const part = w.parts[pi];
          return (
            <span key={i} className={"cut-letter" + (made.includes(i + 1) ? " cut-after" : "")}>
              <motion.span
                className="ch"
                animate={{ color: done ? COLORS[part.k] : "var(--color-upwind-ink)" }}
                transition={{ delay: done ? pi * 0.08 : 0 }}
              >
                {ch}
              </motion.span>
              {i < letters.length - 1 && (
                <button
                  type="button"
                  className={
                    "gap" +
                    (made.includes(i + 1) ? " made" : "") +
                    (wrong === i + 1 ? " wrong" : "") +
                    (misses >= 2 && nextCut === i + 1 ? " hint" : "")
                  }
                  onClick={() => tap(i + 1)}
                  disabled={done}
                  aria-label={`Cắt sau chữ ${ch} (vị trí ${i + 1})`}
                >
                  <i />
                </button>
              )}
            </span>
          );
        })}
      </div>
      <div className="cut-parts" aria-live="polite">
        {done &&
          w.parts.map((p, i) => (
            <motion.span
              key={i}
              className="cut-part"
              style={{ borderColor: COLORS[p.k] }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <b style={{ color: COLORS[p.k] }}>{p.t}</b>
              <small>{p.vi}</small>
              {known?.(p) && <em>bạn đã gặp</em>}
            </motion.span>
          ))}
      </div>
    </div>
  );
}
