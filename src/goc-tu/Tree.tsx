import { useEffect, useMemo, useRef, useState } from "react";
import { families, parts, shortRoot, type Family } from "./data";
import { leafState, type LeafState, type Progress } from "./progress";
import { go } from "./ui";

/* ---------- static layout (SVG units) ---------- */
type Box = { x: number; y: number; w: number; h: number };
const FULL: Box = { x: -40, y: -30, w: 1080, h: 1300 };

// one crown per ebook part; part 1 grows lowest, like the tree is read from the roots up
const CROWNS = [
  { cx: 240, cy: 820, ring: 150, from: { x: 500, y: 985 } },
  { cx: 760, cy: 760, ring: 190, from: { x: 500, y: 930 } },
  { cx: 270, cy: 330, ring: 150, from: { x: 500, y: 540 } },
  { cx: 730, cy: 270, ring: 130, from: { x: 500, y: 470 } },
];
const NODE_R = 28;
const LEAF_D = 48;

type LeafPos = { word: string; x: number; y: number; deg: number };
type NodePos = { f: Family; x: number; y: number; a: number; leaves: LeafPos[] };

function layout() {
  return CROWNS.map((c, pi) => {
    const units = families.filter((f) => f.part === pi);
    const nodes: NodePos[] = units.map((f, k) => {
      const a = -Math.PI / 2 + (2 * Math.PI * k) / units.length; // clockwise from the top
      const x = c.cx + Math.cos(a) * c.ring;
      const y = c.cy + Math.sin(a) * c.ring;
      const n = f.words.length;
      const leaves = f.words.map((w, j) => {
        const la = a + ((j - (n - 1) / 2) * (Math.PI * 0.62)) / Math.max(1, n - 1);
        return { word: w.word, x: x + Math.cos(la) * LEAF_D, y: y + Math.sin(la) * LEAF_D, deg: (la * 180) / Math.PI };
      });
      return { f, x, y, a, leaves };
    });
    const ext = c.ring + NODE_R + LEAF_D + 16;
    const box: Box = { x: c.cx - ext, y: c.cy - ext, w: ext * 2, h: ext * 2 };
    return { ...c, pi, nodes, box };
  });
}

const LEAF_LABEL: Record<LeafState, string> = {
  bare: "chưa học",
  seen: "đã gặp (quả lạ)",
  growing: "đang học",
  learned: "đã học",
  strong: "nhớ chắc",
  due: "cần ôn hôm nay",
};

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** The whole ebook as one tree: trunk → 4 parts (crowns) → 40 roots (branches) → 252 words (leaves). */
export function Tree({ p, suggest }: { p: Progress; suggest?: string }) {
  const crowns = useMemo(layout, []);
  const [view, setView] = useState<Box>(FULL);
  const [focus, setFocus] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const anim = useRef<number>(0);
  const viewRef = useRef(view);
  viewRef.current = view;

  const animateTo = (to: Box) => {
    cancelAnimationFrame(anim.current);
    const from = viewRef.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setView(to);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = ease(Math.min(1, (t - t0) / 380));
      setView({
        x: from.x + (to.x - from.x) * k,
        y: from.y + (to.y - from.y) * k,
        w: from.w + (to.w - from.w) * k,
        h: from.h + (to.h - from.h) * k,
      });
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };
  const zoomPart = (pi: number | null) => {
    setFocus(pi);
    animateTo(pi === null ? FULL : crowns[pi].box);
  };
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  /* ---------- drag to pan, pinch / ctrl+wheel to zoom ---------- */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: number; start?: Box; dist?: number; mid?: { x: number; y: number } }>({ moved: 0 });
  const toUnits = (dx: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return Math.max(viewRef.current.w / r.width, viewRef.current.h / r.height) * dx;
  };
  const clamp = (b: Box): Box => {
    const w = Math.min(Math.max(b.w, 180), FULL.w * 1.1);
    const h = (w / b.w) * b.h;
    const x = Math.min(Math.max(b.x, FULL.x - w * 0.5), FULL.x + FULL.w - w * 0.5);
    const y = Math.min(Math.max(b.y, FULL.y - h * 0.5), FULL.y + FULL.h - h * 0.5);
    return { x, y, w, h };
  };
  const zoomBy = (factor: number, cx?: number, cy?: number) => {
    const v = viewRef.current;
    const px = cx ?? v.x + v.w / 2;
    const py = cy ?? v.y + v.h / 2;
    const w = v.w * factor;
    const h = v.h * factor;
    setView(clamp({ x: px - (px - v.x) * factor, y: py - (py - v.y) * factor, w, h }));
  };
  const svgPoint = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const v = viewRef.current;
    const s = Math.max(v.w / r.width, v.h / r.height);
    const ox = (r.width * s - v.w) / 2;
    const oy = (r.height * s - v.h) / 2;
    return { x: v.x - ox + (clientX - r.left) * s, y: v.y - oy + (clientY - r.top) * s };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = { moved: 0, start: viewRef.current };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.dist = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.mid = svgPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const zoomed = viewRef.current.w < FULL.w * 0.95;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && gesture.current.dist && gesture.current.start) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const f = gesture.current.dist / d;
      const s = gesture.current.start;
      const m = gesture.current.mid!;
      setView(clamp({ x: m.x - (m.x - s.x) * f, y: m.y - (m.y - s.y) * f, w: s.w * f, h: s.h * f }));
      gesture.current.moved = 99;
      return;
    }
    if (!zoomed) return; // whole tree: let the page scroll
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    gesture.current.moved += Math.abs(dx) + Math.abs(dy);
    const v = viewRef.current;
    setView(clamp({ ...v, x: v.x - toUnits(dx), y: v.y - toUnits(dy) }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };
  const tapped = () => gesture.current.moved < 8;
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return; // trackpad pinch; plain wheel scrolls the page (default blocked by the native listener below)
    const pt = svgPoint(e.clientX, e.clientY);
    zoomBy(Math.exp(e.deltaY * 0.01), pt.x, pt.y);
  };
  useEffect(() => {
    // React's onWheel is passive; block the browser zoom on ctrl+wheel over the tree
    const el = svgRef.current;
    const stop = (e: WheelEvent) => e.ctrlKey && e.preventDefault();
    el?.addEventListener("wheel", stop, { passive: false });
    return () => el?.removeEventListener("wheel", stop);
  }, []);

  const zoomed = view.w < FULL.w * 0.95;
  const states = useMemo(() => {
    const now = Date.now();
    const m = new Map<string, LeafState>();
    for (const f of families) {
      const ch = p.chapters[f.id];
      f.words.forEach((w, i) => m.set(w.word, leafState(p, w.word, !!ch && !ch.doneAt && ch.step > 2 + i, now)));
    }
    return m;
  }, [p]);
  const grown = [...states.values()].filter((s) => s === "learned" || s === "strong" || s === "due").length;

  const openUnit = (f: Family, word?: string) => tapped() && go(word ? `${f.id}/${encodeURIComponent(word)}` : f.id);

  return (
    <div className="tree-wrap">
      <div className="tree-tabs" role="tablist" aria-label="Phóng to một phần của cây">
        <button role="tab" aria-selected={focus === null} className={focus === null ? "on" : ""} onClick={() => zoomPart(null)}>
          Cả cây
        </button>
        {parts.map((pt, i) => (
          <button key={i} role="tab" aria-selected={focus === i} className={focus === i ? "on" : ""} onClick={() => zoomPart(i)} title={pt.title}>
            Phần {i + 1}
          </button>
        ))}
      </div>
      <div className="tree-stage">
        <svg
          ref={svgRef}
          className={"tree" + (zoomed ? " zoomed" : "")}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          role="img"
          aria-label={`Cây gốc từ: ${families.length} gốc, ${grown}/${states.size} lá đã mọc`}
        >
          {/* ground + trunk */}
          <ellipse cx={500} cy={1238} rx={300} ry={26} className="t-ground" />
          <path d="M470 1240 C 480 1000, 485 700, 492 230 L 508 230 C 515 700, 520 1000, 530 1240 Z" className="t-trunk" />
          <text x={500} y={1262} textAnchor="middle" className="t-trunk-label">
            Latin
          </text>
          {crowns.map((c) => (
            <path
              key={"limb" + c.pi}
              d={`M${c.from.x} ${c.from.y} Q ${(c.from.x + c.cx) / 2} ${c.from.y - 20} ${c.cx} ${c.cy}`}
              className="t-limb"
            />
          ))}

          {crowns.map((c) => (
            <g key={c.pi} className={"t-crown" + (focus === c.pi ? " focus" : "")}>
              <circle
                cx={c.cx}
                cy={c.cy}
                r={c.ring + NODE_R + LEAF_D - 6}
                className="t-canopy"
                onClick={() => tapped() && focus !== c.pi && zoomPart(c.pi)}
              />
              {c.nodes.map((n) => (
                <path key={"sp" + n.f.id} d={`M${c.cx} ${c.cy} L ${n.x} ${n.y}`} className="t-spoke" />
              ))}
              <g className="t-part-label" onClick={() => tapped() && zoomPart(c.pi)}>
                <circle cx={c.cx} cy={c.cy} r={58} className="t-part-disc" />
                <text x={c.cx} y={c.cy - 8} textAnchor="middle" className="t-part-n">
                  Phần {c.pi + 1}
                </text>
                {wrap(parts[c.pi].title, 16).map((line, k) => (
                  <text key={k} x={c.cx} y={c.cy + 12 + k * 15} textAnchor="middle" className="t-part-title">
                    {line}
                  </text>
                ))}
              </g>
              {c.nodes.map((n) => {
                const ch = p.chapters[n.f.id];
                const st = ch?.doneAt ? "done" : ch?.step ? "doing" : "new";
                return (
                  <g key={n.f.id} className={"t-node " + st + (suggest === n.f.id ? " suggest" : "")}>
                    {n.leaves.map((l) => {
                      const s = states.get(l.word) ?? "bare";
                      return (
                        <g
                          key={l.word}
                          className={"t-leaf " + s}
                          onClick={() => (zoomed ? openUnit(n.f, l.word) : tapped() && zoomPart(c.pi))}
                        >
                          <path d={`M${n.x} ${n.y} L ${l.x} ${l.y}`} className="t-stem" />
                          <ellipse cx={l.x} cy={l.y} rx={11} ry={6} transform={`rotate(${l.deg} ${l.x} ${l.y})`} />
                          {s === "due" && <circle cx={l.x + 7} cy={l.y + 7} r={6} className="t-fruit" />}
                          {s === "seen" && <circle cx={l.x} cy={l.y} r={4.5} className="t-seen" />}
                          <title>
                            {l.word}: {LEAF_LABEL[s]}
                          </title>
                        </g>
                      );
                    })}
                    {suggest === n.f.id && <circle cx={n.x} cy={n.y} r={NODE_R + 9} className="t-pulse" />}
                    <g onClick={() => (zoomed ? openUnit(n.f) : tapped() && zoomPart(c.pi))} className="t-node-hit">
                      <circle cx={n.x} cy={n.y} r={NODE_R} />
                      <text x={n.x} y={n.y + 5} textAnchor="middle">
                        {shortRoot(n.f)}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
        <div className="tree-zoom">
          <button type="button" onClick={() => zoomBy(0.7)} aria-label="Phóng to">
            +
          </button>
          <button type="button" onClick={() => zoomBy(1 / 0.7)} aria-label="Thu nhỏ">
            −
          </button>
        </div>
        <p className="tree-hint">
          {zoomed ? "Chạm một gốc để học · chạm một lá để xem từ · kéo để di chuyển" : "Chạm một tán cây để phóng to"}
        </p>
      </div>
      <div className="tree-legend">
        {(["bare", "growing", "learned", "strong", "due", "seen"] as LeafState[]).map((s) => (
          <span key={s}>
            <svg width="22" height="14" viewBox="-11 -7 22 14" className={"t-leaf " + s} aria-hidden="true">
              <ellipse rx={9} ry={5} />
              {s === "due" && <circle cx={6} cy={3} r={4} className="t-fruit" />}
              {s === "seen" && <circle r={3.5} className="t-seen" />}
            </svg>
            {LEAF_LABEL[s]}
          </span>
        ))}
      </div>
      <p className="tree-count">
        Đã mọc <b>{grown}</b>/{states.size} lá
      </p>
    </div>
  );
}

function wrap(text: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max && line) {
      out.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) out.push(line);
  return out.slice(0, 3);
}
