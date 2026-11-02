import { motion } from "motion/react";
import type { Family } from "./data";

export type TwigState = "bare" | "now" | "leaf";

/** One root as a small tree: the root at the base, one twig per word; a twig gets a leaf when its word is learned. */
export function Branch({ f, states, onTwig }: { f: Family; states: TwigState[]; onTwig?: (i: number) => void }) {
  const n = f.words.length;
  const W = 340;
  const H = 188;
  const base = { x: W / 2, y: H - 22 };
  const fork = { x: W / 2, y: H - 70 };
  const twigs = f.words.map((w, i) => {
    const a = Math.PI * (1.14 + (0.72 * i) / Math.max(1, n - 1)); // fan upward, from ~205° to ~335°
    const r = i % 2 ? 72 : 92;
    const end = { x: fork.x + Math.cos(a) * r * 1.55, y: fork.y + Math.sin(a) * r };
    return { w, a, end, mid: { x: (fork.x + end.x) / 2, y: Math.min(fork.y, end.y) + 10 } };
  });
  return (
    <svg className="branch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Nhánh gốc ${f.root}: ${states.filter((s) => s === "leaf").length}/${n} lá`}>
      <path d={`M${base.x} ${base.y} Q ${base.x - 4} ${base.y - 22} ${fork.x} ${fork.y}`} className="br-trunk" />
      {twigs.map((t, i) => {
        const s = states[i] ?? "bare";
        const deg = (t.a * 180) / Math.PI;
        return (
          <g key={t.w.word} className={"twig " + s} onClick={onTwig ? () => onTwig(i) : undefined} style={onTwig ? { cursor: "pointer" } : undefined}>
            <path d={`M${fork.x} ${fork.y} Q ${t.mid.x} ${t.mid.y} ${t.end.x} ${t.end.y}`} className="br-twig" />
            {s === "leaf" ? (
              <motion.ellipse
                cx={t.end.x}
                cy={t.end.y}
                rx={12}
                ry={6.5}
                transform={`rotate(${deg} ${t.end.x} ${t.end.y})`}
                className="br-leaf"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                style={{ transformOrigin: `${t.end.x}px ${t.end.y}px` }}
              />
            ) : (
              <circle cx={t.end.x} cy={t.end.y} r={s === "now" ? 6 : 3.5} className={s === "now" ? "br-bud" : "br-tip"} />
            )}
            <text x={t.end.x} y={t.end.y - 11} textAnchor="middle" className="br-label">
              {s === "bare" ? "" : t.w.word}
            </text>
          </g>
        );
      })}
      <text x={base.x} y={H - 4} textAnchor="middle" className="br-root">
        {f.root.split("/")[0].trim()} · {f.core}
      </text>
    </svg>
  );
}
