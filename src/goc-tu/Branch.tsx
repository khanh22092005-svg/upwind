import { motion } from "motion/react";
import type { Family } from "./data";

export type TwigState = "bare" | "now" | "leaf";

const ROW = 28;
const PILL_H = 22;
const ROOT_W = 132;
const COL_X = 182; // left edge of the word column
const W = 340;

/** One root as a tree diagram: the root on the left, one branch per word; a word appears once it is reached. */
export function Branch({ f, states, onTwig }: { f: Family; states: TwigState[]; onTwig?: (i: number) => void }) {
  const n = f.words.length;
  const H = n * ROW + 8;
  const rootY = H / 2;
  const rootH = 50;
  const from = { x: 8 + ROOT_W, y: rootY };
  const learned = states.filter((s) => s === "leaf").length;
  return (
    <svg className="branch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Sơ đồ gốc ${f.root}: ${learned}/${n} từ`}>
      {f.words.map((w, i) => {
        const s = states[i] ?? "bare";
        const y = 4 + ROW * i + ROW / 2;
        const midX = (from.x + COL_X) / 2;
        return (
          <path
            key={"l" + w.word}
            d={`M${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${y}, ${COL_X} ${y}`}
            className={"br-link " + s}
          />
        );
      })}

      <g className="br-rootnode">
        <rect x={8} y={rootY - rootH / 2} width={ROOT_W} height={rootH} rx={14} />
        <text x={8 + ROOT_W / 2} y={rootY - 3} textAnchor="middle" className="br-root-t">
          {f.root.split("/")[0].trim()}
        </text>
        <text x={8 + ROOT_W / 2} y={rootY + 14} textAnchor="middle" className="br-root-core">
          {f.core.length > 20 ? f.core.slice(0, 19) + "…" : f.core}
        </text>
      </g>

      {f.words.map((w, i) => {
        const s = states[i] ?? "bare";
        const y = 4 + ROW * i + ROW / 2;
        const pw = s === "bare" ? 44 : Math.min(W - COL_X - 2, w.word.length * 7.6 + 24);
        return (
          <motion.g
            key={w.word}
            className={"br-node " + s}
            onClick={onTwig ? () => onTwig(i) : undefined}
            style={{ cursor: onTwig ? "pointer" : undefined, transformOrigin: `${COL_X}px ${y}px` }}
            initial={false}
            animate={{ scale: s === "leaf" ? [1.12, 1] : 1 }}
            transition={{ duration: 0.35 }}
          >
            <rect x={COL_X} y={y - PILL_H / 2} width={pw} height={PILL_H} rx={PILL_H / 2} />
            {s === "bare" ? (
              <text x={COL_X + pw / 2} y={y + 4} textAnchor="middle" className="br-dots">
                • • •
              </text>
            ) : (
              <text x={COL_X + 12} y={y + 4.5} className="br-word">
                {w.word}
              </text>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
