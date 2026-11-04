import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { allWords, COLORS, type Part, type Word } from "./data";
import { shuffle } from "./lib";
import { ColoredWord } from "./ui";

type Chip = { id: number; part: Part; slot: number | null };

/**
 * "Ghép từ": the word's parts are shuffled into tiles with one extra tile from another word. Each empty slot shows the
 * Vietnamese meaning of the part that goes there; the learner taps the tiles in order. A wrong tile shakes; after two
 * wrong taps the right one glows.
 */
export function PartBuilder({ w, onDone, prompt }: { w: Word; onDone: () => void; prompt?: React.ReactNode }) {
  const chips = useMemo<Chip[]>(() => {
    const own = new Set(w.parts.map((p) => p.t));
    const kind = w.parts.find((p) => p.k !== "root")?.k ?? "pre";
    const pool = allWords.flatMap(({ w: o }) => o.parts).filter((p) => p.k === kind && !own.has(p.t));
    const distractor = shuffle(pool, w.word)[0];
    const list: Chip[] = w.parts.map((part, i) => ({ id: i, part, slot: i }));
    if (distractor) list.push({ id: 99, part: distractor, slot: null });
    return shuffle(list, w.word);
  }, [w]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const complete = placed.length === w.parts.length;

  useEffect(() => {
    if (!complete) return;
    const t = setTimeout(onDone, 1000);
    return () => clearTimeout(t);
  }, [complete, onDone]);

  const tap = (c: Chip) => {
    if (complete || placed.includes(c.id)) return;
    if (c.slot === placed.length) {
      setPlaced((p) => [...p, c.id]);
      setMistakes(0);
    } else {
      setShake(c.id);
      setMistakes((m) => m + 1);
      setTimeout(() => setShake(null), 450);
    }
  };

  return (
    <div className="builder">
      <p className="q">{prompt ?? "Ghép các mảnh thành một từ."}</p>
      <div className="slots">
        {w.parts.map((p, i) => {
          const chip = chips.find((c) => c.slot === i && placed.includes(c.id));
          return (
            <div key={i} className={"slot" + (chip ? " filled" : "")} style={chip ? { borderColor: COLORS[p.k] } : undefined}>
              <span className="slot-word" style={{ color: COLORS[p.k] }}>
                {chip && (
                  <motion.span layoutId={`chip-${w.word}-${chip.id}`} transition={{ type: "spring", stiffness: 500, damping: 32 }}>
                    {p.t}
                  </motion.span>
                )}
              </span>
              <small>{p.vi}</small>
            </div>
          );
        })}
      </div>
      {complete && (
        <motion.div className="built" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <ColoredWord w={w} /> ✓
        </motion.div>
      )}
      <div className="chips">
        {chips.map((c) =>
          placed.includes(c.id) ? (
            <span key={c.id} className="chip ghost-chip" aria-hidden="true">
              {c.part.t}
            </span>
          ) : (
            <motion.button
              key={c.id}
              layoutId={`chip-${w.word}-${c.id}`}
              type="button"
              className={"chip" + (shake === c.id ? " shake" : "") + (mistakes >= 2 && c.slot === placed.length ? " glow" : "")}
              style={{ color: COLORS[c.part.k], borderColor: COLORS[c.part.k] }}
              onClick={() => tap(c)}
            >
              {c.part.t}
            </motion.button>
          ),
        )}
      </div>
      <p className="muted center small">Gợi ý: mỗi ô ghi nghĩa của mảnh cần đặt vào. Có một mảnh thừa.</p>
    </div>
  );
}
