import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, type Family, type Part, type Word } from "../data";
import { shuffle } from "../lib";
import { completeChapter } from "../progress";
import { speak } from "../speech";
import { go, Icon, Rich, Speak, Stars } from "../ui";
import { blankOf, fill, gameLesson, glued, moveFor, PRE, SUF, type Duel, type GameLesson, type Morph } from "./gameData";
import { click, setSound, soundOn, thud } from "./sound";

/*
 * The new lesson format (game brief, step 1: one sample root). Every screen is a question:
 * Đoán mù (unscored hook) → Lắp Mảnh × n, each followed by its Thẻ Từ → Đấu Tay Đôi → the opening
 * sentence returns (khép vòng) → result. No lives: a wrong answer resets the combo and the item comes
 * back at the end of the queue with another sentence.
 */

type Item =
  | { kind: "blind" }
  | { kind: "morph"; m: Morph; retry?: boolean }
  | { kind: "duel"; d: Duel; retry?: boolean }
  | { kind: "close" };

const SAVE = "upwind-goc-tu-game-v0";
function saveResult(id: string, rec: { stars: number; pairs: string[]; guessClosed: boolean }) {
  try {
    const all = JSON.parse(localStorage.getItem(SAVE) ?? "{}");
    all[id] = { ...rec, at: Date.now() };
    localStorage.setItem(SAVE, JSON.stringify(all));
  } catch {
    /* private mode: fine */
  }
}

const bigBurst = () =>
  confetti({
    particleCount: 150,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.4 },
    colors: ["#f2711c", "#004b9b", "#1a9c5b", "#6ac5e8", "#ffd166"],
    disableForReducedMotion: true,
  });

export function GameLessonPage({ family: f }: { family: Family }) {
  const lesson = gameLesson(f.id);
  if (!lesson)
    return (
      <section className="screen">
        <p className="kicker">Bản thử nghiệm</p>
        <p>Gốc này chưa có bài kiểu mới. Hiện mới có bài mẫu gốc voc.</p>
        <a className="btn primary" href="#/thu/voc">
          Thử bài voc →
        </a>
      </section>
    );
  return <Game f={f} L={lesson} />;
}

function Game({ f, L }: { f: Family; L: GameLesson }) {
  const words = useMemo(() => new Map(f.words.map((w) => [w.word, w])), [f]);
  const [queue, setQueue] = useState<Item[]>(() => [
    { kind: "blind" },
    ...L.morph.map((m) => ({ kind: "morph" as const, m })),
    ...L.duels.map((d) => ({ kind: "duel" as const, d })),
    { kind: "close" },
  ]);
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState<string | null>(null);
  const [combo, setCombo] = useState(1);
  const [stats, setStats] = useState({ first: 0, total: 0, maxCombo: 1, hints: 0, pairs: [] as string[], closeFirst: false });
  const [done, setDone] = useState(false);
  const [sound, setSoundState] = useState(soundOn);

  const item = queue[i];
  const scored = L.morph.length + L.duels.length + 1;
  const pct = Math.round((Math.min(stats.total, scored) / scored) * 100);

  /** An answer to a scored item. Returns the combo shown next to the answer. */
  const answer = (it: Item, right: boolean, usedHint: boolean) => {
    const retry = "retry" in it && !!it.retry;
    const clean = right && !usedHint;
    const nextCombo = clean ? combo + (retry ? 0 : 1) : 1;
    setCombo(nextCombo);
    setStats((s) => ({
      ...s,
      first: s.first + (!retry && clean ? 1 : 0),
      total: s.total + (retry ? 0 : 1),
      maxCombo: Math.max(s.maxCombo, nextCombo),
      hints: s.hints + (usedHint ? 1 : 0),
      pairs: it.kind === "duel" && right && !s.pairs.includes(it.d.pair.join("|")) ? [...s.pairs, it.d.pair.join("|")] : s.pairs,
      closeFirst: it.kind === "close" ? clean : s.closeFirst,
    }));
    // a miss comes back at the end of the queue, with the other sentence when there is one
    if (!right && it.kind === "morph") setQueue((q) => [...q.slice(0, -1), { kind: "morph", m: it.m, retry: true }, q[q.length - 1]]);
    if (!right && it.kind === "duel") setQueue((q) => [...q.slice(0, -1), { kind: "duel", d: it.d, retry: true }, q[q.length - 1]]);
    return clean ? nextCombo : 0;
  };

  const next = () => {
    if (i + 1 < queue.length) setI(i + 1);
    else {
      const ratio = stats.total ? stats.first / stats.total : 0;
      let st = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
      if (!stats.closeFirst) st = Math.min(st, 2);
      completeChapter(f.id, f.words.map((w) => w.word), stats.first, stats.total);
      saveResult(f.id, { stars: st, pairs: stats.pairs, guessClosed: true });
      setDone(true);
    }
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="chapter game">
      <div className="ch-top">
        <a href="#/" className="icon-btn" aria-label="Về trang chính">
          <Icon name="arrow-left" size={22} stroke={2} />
        </a>
        <div className="ch-title">
          <small>Bài mới · thử nghiệm</small>
          <b>{f.root}</b>
        </div>
        <div className="ch-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: (done ? 100 : pct) + "%" }} />
        </div>
        <button
          type="button"
          className="icon-btn g-sound"
          aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          aria-pressed={sound}
          onClick={() => (setSound(!sound), setSoundState(!sound))}
        >
          {sound ? "♪" : "♪̸"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={done ? "done" : i}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          {done ? (
            <Result f={f} L={L} stats={stats} />
          ) : item.kind === "blind" ? (
            <Blind L={L} onPick={(g) => setGuess(g)} picked={guess} onNext={next} />
          ) : item.kind === "morph" ? (
            <MorphScreen
              key={i}
              m={item.m}
              w={words.get(item.m.word)!}
              extra={L.words[item.m.word] ?? {}}
              retry={!!item.retry}
              index={L.morph.indexOf(item.m)}
              of={L.morph.length}
              onAnswer={(r, h) => answer(item, r, h)}
              onNext={next}
            />
          ) : item.kind === "duel" ? (
            <DuelScreen key={i} d={item.d} retry={!!item.retry} onAnswer={(r) => answer(item, r, false)} onNext={next} />
          ) : (
            <Close L={L} root={f.root.split("/")[0].trim()} first={guess} onAnswer={(r) => answer(item, r, false)} onNext={next} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return <div className="bottombar">{children}</div>;
}

/** Sentence with its blank: [before][glued-left][slot][glued-right][after]. */
function Sentence({ s, slot, big }: { s: string; slot: React.ReactNode; big?: boolean }) {
  const b = blankOf(s);
  const g = glued(b.before, b.after);
  return (
    <p className={"g-sentence" + (big ? " big" : "")} lang="en">
      {g.before}
      <span className="g-word">
        {g.l}
        {slot}
        {g.r}
      </span>
      {g.after}
    </p>
  );
}

/** A piece as text-only graphics: prefix with its arrow, ‹root›, -suffix with its part of speech. */
export function Piece({ t, showVi }: { t: string; showVi?: boolean }) {
  const pre = PRE[t];
  const suf = SUF[t];
  if (pre)
    return (
      <span className="pc pre">
        <b>{t}</b>
        <i aria-hidden="true">{pre.sym}</i>
        {showVi && <small>{pre.vi}</small>}
      </span>
    );
  if (suf)
    return (
      <span className="pc suf">
        <b>-{t}</b>
        <i>{suf.pos}</i>
        {showVi && <small>{suf.vi}</small>}
      </span>
    );
  return (
    <span className="pc root">
      <b>‹{t}›</b>
    </span>
  );
}

function ComboPop({ n }: { n: number }) {
  if (n < 2) return null;
  return (
    <motion.span key={n} className="g-combo" initial={{ opacity: 0, y: 6, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: -18, scale: 1.2 }} transition={{ duration: 1.4 }}>
      ×{n}
    </motion.span>
  );
}

/* ---------- 0. Đoán mù ---------- */

function Blind({ L, picked, onPick, onNext }: { L: GameLesson; picked: string | null; onPick: (g: string) => void; onNext: () => void }) {
  return (
    <section className="screen">
      <p className="kicker">Đoán mù · không tính điểm</p>
      <p className="muted">Bạn chưa học gì cả. Cứ đoán theo cảm giác:</p>
      <Sentence s={L.blind.s} big slot={<span className={"g-slot wide" + (picked ? " filled" : "")}>{picked ?? "______"}</span>} />
      <div className="g-options">
        {L.blind.options.map((o) => (
          <button key={o} type="button" className={"option" + (picked === o ? " picked" : "")} onClick={() => onPick(o)} lang="en">
            {o}
          </button>
        ))}
      </div>
      {picked && (
        <motion.p className="g-hold" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          Giữ câu này lại. Cuối bài ta sẽ quay lại nó.
        </motion.p>
      )}
      <Bar>
        <button className="btn primary wide" disabled={!picked} onClick={onNext}>
          Bắt đầu →
        </button>
      </Bar>
    </section>
  );
}

/* ---------- 1. Lắp Mảnh + Thẻ Từ ---------- */

function MorphScreen({
  m,
  w,
  extra,
  retry,
  index,
  of,
  onAnswer,
  onNext,
}: {
  m: Morph;
  w: Word;
  extra: { drift?: string; lure?: string };
  retry: boolean;
  index: number;
  of: number;
  onAnswer: (right: boolean, usedHint: boolean) => number;
  onNext: () => void;
}) {
  const s = retry && m.alt ? m.alt : m.s;
  const ans = blankOf(s).answer;
  const options = useMemo(() => shuffle(m.options ?? [], m.word + (retry ? "r" : "")), [m, retry]);
  const [hint, setHint] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [pop, setPop] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const showVi = m.dir === "full" || hint >= 1;
  const removed = hint >= 2 ? options.find((o) => o !== ans) : undefined;
  const maxHint = m.type ? 2 : m.dir === "full" ? 1 : 2; // "full" already shows the meanings: only "loại 1 lựa chọn" is left
  const right = pick !== null && pick.toLowerCase() === ans.toLowerCase();

  const submit = (p: string) => {
    if (pick !== null) return;
    setPick(p);
    const ok = p.trim().toLowerCase() === ans.toLowerCase();
    if (ok) {
      click();
      setTimeout(() => speak(fill(s), 0.9), 450);
    } else {
      thud();
    }
    setPop(onAnswer(ok, hint > 0));
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 900);
  };
  const useHint = () => {
    setHint((h) => Math.min(h + (m.dir === "full" && !m.type && h === 0 ? 2 : 1), 2));
  };

  return (
    <section className="screen">
      <p className="kicker">
        Lắp mảnh · {index + 1}/{of}
        {retry && " · làm lại"}
      </p>
      <div className="g-stage">
        <Sentence
          s={s}
          big
          slot={
            <span className={"g-slot" + (pick ? (right ? " ok" : " fix") : "")}>
              <AnimatePresence mode="popLayout">
                {pick ? (
                  <motion.span key={right ? ans : "x"} initial={{ opacity: 0, ...moveFor(ans) }} animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                    {ans}
                  </motion.span>
                ) : (
                  <span className="g-q">?</span>
                )}
              </AnimatePresence>
            </span>
          }
        />
        <ComboPop n={pop} />
      </div>

      {!m.type ? (
        <div className="g-pieces">
          {options.map((o) => {
            const mv = moveFor(o);
            const out = pick === o && !right;
            return (
              <motion.button
                key={o}
                type="button"
                className={"g-piece" + (pick === o ? (right ? " ok" : " bad") : "") + (pick && o === ans && !right ? " was" : "")}
                disabled={pick !== null || o === removed}
                style={{ opacity: o === removed ? 0.25 : 1 }}
                animate={out ? { x: [0, -(mv.x ?? 0) * 0.5, 0], y: [0, -(mv.y ?? 0) * 0.5, 0], rotate: [0, -(mv.rotate ?? 0) * 0.1, 0] } : {}}
                transition={{ duration: 0.45 }}
                onClick={() => submit(o)}
              >
                <Piece t={o} showVi={showVi} />
              </motion.button>
            );
          })}
        </div>
      ) : (
        <form
          className="g-type"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) submit(typed);
          }}
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={pick !== null}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Gõ mảnh còn thiếu"
            placeholder="gõ mảnh còn thiếu"
            lang="en"
          />
          <button className="btn primary" type="submit" disabled={pick !== null || !typed.trim()}>
            Lắp
          </button>
        </form>
      )}

      {pick === null && m.type && hint >= 1 && <p className="g-hint">{hint >= 2 ? `${m.hint1} ${m.hint2}` : m.hint1}</p>}
      {pick === null && !m.type && hint >= 2 && <p className="g-hint">Đã loại bớt một lựa chọn.</p>}

      {pick !== null && (
        <motion.div ref={cardRef} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 26 }}>
          <p className={"feedback " + (right ? "ok" : "bad")} role="status">
            {right ? "✓ " : "✗ "}
            <Rich text={right ? m.ok : (m.why[pick] ?? m.why["*"] ?? m.ok)} />
            {!right && <span className="g-requeue"> Câu này sẽ quay lại cuối bài, với một câu khác.</span>}
          </p>
          {!retry && <TheCard w={w} extra={extra} s={s} />}
        </motion.div>
      )}

      <Bar>
        {pick === null ? (
          <button className="btn ghost wide" disabled={hint >= maxHint} onClick={useHint}>
            {hint >= maxHint ? "Hết gợi ý" : hint === 0 ? "Gợi ý (mất combo)" : "Gợi ý thêm"}
          </button>
        ) : (
          <button className="btn primary wide" onClick={onNext}>
            Tiếp →
          </button>
        )}
      </Bar>
    </section>
  );
}

/** Thẻ Từ: opens only after an answer. */
function TheCard({ w, extra, s }: { w: Word; extra: { drift?: string; lure?: string }; s: string }) {
  return (
    <article className="word-card g-card">
      <header>
        <div className="word-big">
          <span className="g-built">
            {w.parts.map((p, k) => (
              <PartSym key={k} p={p} />
            ))}
          </span>
          <Speak text={w.word} big />
        </div>
        <div className="ipa">
          {w.ipa} · <i>{w.pos}</i>
        </div>
      </header>
      <p className="g-formula">
        {w.parts.map((p, k) => (
          <span key={k}>
            {k > 0 && " + "}
            <Piece t={p.t} />
          </span>
        ))}{" "}
        = {w.story}
      </p>
      <p className="meaning-line">{w.meaning}</p>
      {w.tale && (
        <div className="story tale">
          <small>Câu chuyện</small>
          <TaleText text={w.tale} />
        </div>
      )}
      <div className="example">
        <p lang="en">
          “{fill(s)}” <Speak text={fill(s)} rate={0.85} label="Nghe câu" />
        </p>
      </div>
      {!!w.related?.length && (
        <div className="related">
          <small>Từ liên quan</small>
          {w.related.map((r) => (
            <span key={r.w}>
              <b>{r.w}</b> <i>{r.pos}</i> {r.vi}
            </span>
          ))}
        </div>
      )}
      {extra.drift && (
        <div className="g-drift">
          <small>Nghĩa đã trôi</small>
          {extra.drift}
        </div>
      )}
      {extra.lure && (
        <div className="trap">
          ⚠ <Rich text={extra.lure} />
        </div>
      )}
    </article>
  );
}

function PartSym({ p }: { p: Part }) {
  return (
    <span style={{ color: COLORS[p.k] }}>
      {p.t}
      {p.k === "pre" && PRE[p.t] && <sup className="g-sym">{PRE[p.t].sym}</sup>}
    </span>
  );
}

function TaleText({ text }: { text: string }) {
  return (
    <p className="tale-text">
      {text.split(/(\*\*[^*]+\*\*|\{\{[^}]+\}\})/).map((x, k) =>
        x.startsWith("**") ? <b key={k}>{x.slice(2, -2)}</b> : x.startsWith("{{") ? <em key={k} className="tale-word" lang="en">{x.slice(2, -2)}</em> : x,
      )}
    </p>
  );
}

/* ---------- 2. Đấu Tay Đôi ---------- */

function DuelScreen({ d, retry, onAnswer, onNext }: { d: Duel; retry: boolean; onAnswer: (right: boolean) => number; onNext: () => void }) {
  const [sa, sb] = retry && d.alt ? d.alt : [d.a, d.b];
  const need = [blankOf(sa).answer, blankOf(sb).answer];
  const tiles = useMemo(() => shuffle([...need], d.pair.join() + (retry ? "r" : "")), [d, retry]); // eslint-disable-line react-hooks/exhaustive-deps
  const [slots, setSlots] = useState<(string | null)[]>([null, null]);
  const [checked, setChecked] = useState(false);
  const [pop, setPop] = useState(0);
  const right = slots[0] === need[0] && slots[1] === need[1];

  const place = (t: string) => {
    if (checked) return;
    setSlots((s) => {
      const k = s.indexOf(null);
      if (k < 0) return s;
      const n = [...s];
      n[k] = t;
      return n;
    });
  };
  const check = () => {
    setChecked(true);
    if (right) click();
    else thud();
    setPop(onAnswer(right));
  };

  return (
    <section className="screen">
      <p className="kicker">Đấu tay đôi{retry && " · làm lại"}</p>
      <p className="muted">Hai từ na ná nhau. Đặt đúng cả hai câu mới qua.</p>
      <div className="g-duel">
        {[sa, sb].map((s, k) => (
          <div key={k} className="g-duel-row">
            <b className="g-ab">{k ? "B" : "A"}</b>
            <Sentence
              s={s}
              slot={
                <button
                  type="button"
                  className={"g-slot wide" + (slots[k] ? " filled" : "") + (checked ? (slots[k] === need[k] ? " ok" : " bad") : "")}
                  onClick={() => !checked && setSlots((x) => x.map((v, j) => (j === k ? null : v)))}
                  aria-label={slots[k] ? `Bỏ ${slots[k]} ra khỏi câu ${k ? "B" : "A"}` : `Ô trống câu ${k ? "B" : "A"}`}
                >
                  {slots[k] ?? "______"}
                </button>
              }
            />
          </div>
        ))}
        <ComboPop n={pop} />
      </div>
      <div className="g-pieces">
        {tiles.map((t) => (
          <button key={t} type="button" className="g-piece word" disabled={checked || slots.includes(t)} onClick={() => place(t)} lang="en">
            {t}
          </button>
        ))}
      </div>
      {checked && (
        <motion.p className={"feedback " + (right ? "ok" : "bad")} role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {right ? "✓ Phân biệt được rồi! " : `✗ Đáp án: A ${need[0]}, B ${need[1]}. `}
          <Rich text={d.why} />
          {!right && <span className="g-requeue"> Cặp này sẽ quay lại cuối bài.</span>}
        </motion.p>
      )}
      <Bar>
        {!checked ? (
          <button className="btn primary wide" disabled={slots.includes(null)} onClick={check}>
            Kiểm tra
          </button>
        ) : (
          <button className="btn primary wide" onClick={onNext}>
            Tiếp →
          </button>
        )}
      </Bar>
    </section>
  );
}

/* ---------- 3. Khép vòng ---------- */

function Close({ L, root, first, onAnswer, onNext }: { L: GameLesson; root: string; first: string | null; onAnswer: (right: boolean) => number; onNext: () => void }) {
  const ans = blankOf(L.blind.s).answer;
  const [tries, setTries] = useState<string[]>([]);
  const won = tries.includes(ans);
  useEffect(() => {
    if (won) bigBurst();
  }, [won]);
  const pickIt = (o: string) => {
    if (won || tries.includes(o)) return;
    const ok = o === ans;
    if (tries.length === 0) onAnswer(ok);
    setTries((t) => [...t, o]);
    if (ok) {
      click();
      setTimeout(() => speak(fill(L.blind.s), 0.9), 400);
    } else thud();
  };
  return (
    <section className="screen g-close">
      <p className="kicker">Câu đầu bài quay lại</p>
      <p className="g-close-lead">Nhớ câu này không? Giờ bạn đã biết cả họ ‹{root}›.</p>
      <Sentence s={L.blind.s} big slot={<span className={"g-slot wide" + (won ? " ok" : "")}>{won ? ans : "______"}</span>} />
      {first && (
        <p className="g-then">
          Lúc đầu bạn đoán: <b lang="en">{first}</b> {first === ans ? "· đoán mù mà trúng!" : ""}
        </p>
      )}
      <div className="g-options">
        {L.blind.options.map((o) => (
          <button
            key={o}
            type="button"
            className={"option" + (tries.includes(o) ? (o === ans ? " ok" : " bad") : "")}
            disabled={won || tries.includes(o)}
            onClick={() => pickIt(o)}
            lang="en"
          >
            {o}
          </button>
        ))}
      </div>
      {tries.length > 0 && (
        <motion.p className={"feedback " + (won ? "ok" : "bad")} role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {won ? "✓ " : "✗ Chưa đúng, thử lại. "}
          {won && <Rich text={L.blind.why} />}
        </motion.p>
      )}
      <Bar>
        <button className="btn primary wide" disabled={!won} onClick={onNext}>
          Xem kết quả →
        </button>
      </Bar>
    </section>
  );
}

/* ---------- Result ---------- */

function Result({ f, L, stats }: { f: Family; L: GameLesson; stats: { first: number; total: number; maxCombo: number; hints: number; pairs: string[]; closeFirst: boolean } }) {
  const ratio = stats.total ? stats.first / stats.total : 0;
  let st = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
  if (!stats.closeFirst) st = Math.min(st, 2);
  const shareLines = L.duels.filter((d) => stats.pairs.includes(d.pair.join("|"))).map((d) => d.share);
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `https://upwind.asia/goc-tu/#/thu/${f.id}`;
    const text = `${shareLines.join(". ") || `Mình vừa học gốc ${f.root}`} ${"★".repeat(st)} · UpWind`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Học từ từ gốc · UpWind", text, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard?.writeText(`${text} ${url}`);
      setCopied(true);
    }
  };
  return (
    <section className="screen done">
      <p className="kicker">Hoàn thành</p>
      <h2>
        Xong gốc <span style={{ color: COLORS.root }}>‹{f.root.split("/")[0].trim()}›</span>!
      </h2>
      <Stars n={st} />
      <div className="g-stats">
        <div>
          <b>
            {stats.first}/{stats.total}
          </b>
          <small>đúng ngay lần đầu</small>
        </div>
        <div>
          <b>×{stats.maxCombo}</b>
          <small>combo cao nhất</small>
        </div>
        <div>
          <b>{stats.pairs.length}</b>
          <small>cặp dễ nhầm đã phân biệt</small>
        </div>
      </div>
      {!stats.closeFirst && <p className="muted center small">Điền đúng câu đầu bài ngay lần đầu thì mới được 3 sao.</p>}
      {shareLines.map((l) => (
        <p key={l} className="g-share-line">
          “{l}”
        </p>
      ))}
      <p className="muted center">{f.words.length} từ đã vào lịch ôn tập.</p>
      <div className="done-actions">
        <button className="btn primary wide" onClick={share}>
          <Icon name="share" size={18} stroke={2} /> {copied ? "Đã copy link" : "Chia sẻ kết quả"}
        </button>
        <div className="row2">
          <button className="btn ghost" onClick={() => go("")}>
            Về trang chính
          </button>
          <button className="btn ghost" onClick={() => window.location.reload()}>
            <Icon name="refresh" size={18} stroke={2} /> Chơi lại
          </button>
        </div>
      </div>
    </section>
  );
}
