import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { allWords, COLORS, families, iconSvg, nextFamily, type Family, type Part, type Word } from "./data";
import { shuffle } from "./lib";
import { completeChapter, progressStore, restartChapter, saveStep, stars, useProgress } from "./progress";
import { speak } from "./speech";
import { ColoredWord, go, Icon, KindLegend, PartGloss, Rich, Speak, Stars, ZaloCta } from "./ui";
import { Practice } from "./Practice";

const burst = (big = false) =>
  confetti({
    particleCount: big ? 140 : 40,
    spread: big ? 100 : 60,
    startVelocity: big ? 45 : 28,
    origin: { y: big ? 0.35 : 0.45 },
    colors: ["#f2711c", "#004b9b", "#1a9c5b", "#6ac5e8", "#ffd166"],
    disableForReducedMotion: true,
    scalar: big ? 1 : 0.8,
  });

export function Chapter({ family: f, startWord }: { family: Family; startWord?: string }) {
  const n = f.words.length;
  const PRACTICE = 2 + n;
  const DONE = 3 + n;
  const [step, setStep] = useState(() => {
    const wi = startWord ? f.words.findIndex((w) => w.word.toLowerCase() === startWord.toLowerCase()) : -1;
    if (wi >= 0) return 2 + wi;
    const rec = progressStore.get().chapters[f.id];
    return rec && !rec.doneAt && rec.step > 0 && rec.step <= PRACTICE ? rec.step : 0;
  });
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    if (step > 0 && step <= PRACTICE) saveStep(f.id, step);
  }, [f.id, step, PRACTICE]);

  const next = () => setStep((s) => Math.min(s + 1, DONE));
  const pct = Math.round((Math.min(step, PRACTICE) / PRACTICE) * 100);

  return (
    <div className="chapter">
      <div className="ch-top">
        <a href="#/" className="icon-btn" aria-label="Về trang chính">
          <Icon name="arrow-left" size={22} stroke={2} />
        </a>
        <div className="ch-title">
          <small>Gốc {families.indexOf(f) + 1}/{families.length}</small>
          <b>{f.root}</b>
        </div>
        <div className="ch-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: pct + "%" }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          {step === 0 && <Bait f={f} onNext={next} />}
          {step === 1 && <RootCard f={f} onNext={next} />}
          {step >= 2 && step < PRACTICE && (
            <WordScreen
              key={f.words[step - 2].word}
              f={f}
              w={f.words[step - 2]}
              index={step - 2}
              onNext={next}
              onBack={() => setStep((s) => s - 1)}
            />
          )}
          {step === PRACTICE && (
            <Practice
              f={f}
              onFinish={(score, total) => {
                completeChapter(f.id, f.words.map((w) => w.word), score, total);
                setResult({ score, total });
                setStep(DONE);
                burst(true);
              }}
            />
          )}
          {step === DONE && <Done f={f} result={result} onRestart={() => (restartChapter(f.id), setResult(null), setStep(0))} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return <div className="bottombar">{children}</div>;
}

function Bait({ f, onNext }: { f: Family; onNext: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="screen">
      <p className="kicker">Mồi câu</p>
      <button type="button" className={"flip" + (open ? " open" : "")} onClick={() => setOpen(true)} aria-live="polite">
        <span className="flip-in">
          <span className="face front">
            <b className="bait-word">{f.bait.word}</b>
            <span className="hint">Nghĩa đen là gì? Chạm để lật</span>
          </span>
          <span className="face back">
            <b className="bait-word">{f.bait.word}</b>
            <span className="bait-literal">= {f.bait.literal}</span>
          </span>
        </span>
      </button>
      <p className="hook">
        <Rich text={f.hook} />
      </p>
      <BottomBar>
        {open ? (
          <button className="btn primary wide" onClick={onNext}>
            Khám phá gốc {f.root.split(" ")[0]} →
          </button>
        ) : (
          <button className="btn primary wide" onClick={() => setOpen(true)}>
            Đoán xem?
          </button>
        )}
      </BottomBar>
    </section>
  );
}

function RootCard({ f, onNext }: { f: Family; onNext: () => void }) {
  return (
    <section className="screen">
      <p className="kicker">Gốc từ</p>
      <div className="root-card">
        <span className="badge" dangerouslySetInnerHTML={{ __html: badgeSvg(f.icon) }} />
        <div className="root-big">
          {f.root} <Speak text={f.say_root ?? f.root.split(" ")[0]} big />
        </div>
        <div className="origin">{f.origin}</div>
        <div className="core">
          = <b>{f.core}</b>
        </div>
        <div className="imagine">
          <small>Hình dung</small>
          {f.image}
        </div>
      </div>
      <p className="muted center">
        Giữ hình ảnh này trong đầu: cả {f.words.length} từ tiếp theo đều treo trên nó.
      </p>
      <KindLegend />
      <BottomBar>
        <button className="btn primary wide" onClick={onNext}>
          Bắt đầu với từ đầu tiên →
        </button>
      </BottomBar>
    </section>
  );
}

const badgeSvg = (name?: string) =>
  `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconSvg(name)}</svg>`;

type Phase = "build" | "guess" | "card";

function WordScreen({ f, w, index, onNext, onBack }: { f: Family; w: Word; index: number; onNext: () => void; onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("build");
  const [shown, setShown] = useState(0); // guess: 0 nothing, 1 story, 2 meaning
  const last = index === f.words.length - 1;
  return (
    <section className="screen">
      <p className="kicker">
        Từ {index + 1}/{f.words.length} ·{" "}
        {phase === "build" ? "Ghép từ" : phase === "guess" ? "Đoán nghĩa" : "Thẻ từ"}
      </p>

      {phase === "build" && <Builder f={f} w={w} onDone={() => setPhase("guess")} />}

      {phase === "guess" && (
        <div className="guess">
          <div className="word-big">
            <ColoredWord w={w} /> <Speak text={w.word} big />
          </div>
          <PartGloss parts={w.parts} />
          <p className="q">→ Nghĩa là gì? Đoán trước khi xem nhé.</p>
          <AnimatePresence>
            {shown >= 1 && (
              <motion.div className="story" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <small>Câu chuyện</small>
                {w.story}
              </motion.div>
            )}
            {shown >= 2 && (
              <motion.div className="meaning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <small>Nghĩa</small>
                {w.meaning}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {phase === "card" && <WordCard w={w} />}

      <BottomBar>
        {phase === "build" && index > 0 && (
          <button className="btn ghost" onClick={onBack} aria-label="Từ trước">
            ←
          </button>
        )}
        {phase === "build" && (
          <button className="btn ghost wide" onClick={() => setPhase("guess")}>
            Bỏ qua phần ghép
          </button>
        )}
        {phase === "guess" && shown < 2 && (
          <button className="btn primary wide" onClick={() => setShown((s) => s + 1)}>
            {shown === 0 ? "Xem câu chuyện" : "Xem nghĩa"}
          </button>
        )}
        {phase === "guess" && shown >= 2 && (
          <button className="btn primary wide" onClick={() => setPhase("card")}>
            Xem thẻ từ đầy đủ →
          </button>
        )}
        {phase === "card" && (
          <button className="btn primary wide" onClick={onNext}>
            {last ? "Vào luyện tập →" : "Từ tiếp theo →"}
          </button>
        )}
      </BottomBar>
    </section>
  );
}

export function WordCard({ w }: { w: Word }) {
  const [before, form, after] = splitExample(w);
  return (
    <article className="word-card">
      <header>
        <div className="word-big">
          <ColoredWord w={w} /> <Speak text={w.word} big />
        </div>
        <div className="ipa">
          {w.ipa} · <i>{w.pos}</i>
        </div>
      </header>
      <PartGloss parts={w.parts} />
      <p className="story-line">→ {w.story}</p>
      <p className="meaning-line">{w.meaning}</p>
      <div className="example">
        <p lang="en">
          “{before}
          <mark>{form}</mark>
          {after}” <Speak text={w.example} rate={0.85} label="Nghe câu ví dụ" />
        </p>
        <p className="vi">{w.example_vi}</p>
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
      {w.trap && (
        <div className="trap">
          ⚠ <Rich text={w.trap} />
        </div>
      )}
    </article>
  );
}

function splitExample(w: Word): [string, string, string] {
  const stem = w.word.replace(/e$/, "").slice(0, Math.max(4, w.word.length - 2));
  const m = w.example.match(new RegExp(`\\b(${stem}[a-z]*)`, "i"));
  if (!m || m.index === undefined) return [w.example, "", ""];
  return [w.example.slice(0, m.index), m[1], w.example.slice(m.index + m[1].length)];
}

type Chip = { id: number; part: Part; slot: number | null };

function Builder({ f, w, onDone }: { f: Family; w: Word; onDone: () => void }) {
  const chips = useMemo<Chip[]>(() => {
    const own = new Set(w.parts.map((p) => p.t));
    const kind = w.parts.find((p) => p.k !== "root")?.k ?? "pre";
    const pool = allWords.flatMap(({ w: o }) => o.parts).filter((p) => p.k === kind && !own.has(p.t));
    const distractor = shuffle(pool, w.word + f.id)[0];
    const list: Chip[] = w.parts.map((part, i) => ({ id: i, part, slot: i }));
    if (distractor) list.push({ id: 99, part: distractor, slot: null });
    return shuffle(list, w.word);
  }, [f.id, w]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const complete = placed.length === w.parts.length;

  useEffect(() => {
    if (!complete) return;
    burst();
    speak(w.word);
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, [complete, onDone, w.word]);

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
      <p className="q">
        Ghép các mảnh thành từ có nghĩa: <b>{w.meaning}</b>
      </p>
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

function Done({ f, result, onRestart }: { f: Family; result: { score: number; total: number } | null; onRestart: () => void }) {
  const p = useProgress();
  const rec = p.chapters[f.id];
  const score = result?.score ?? rec?.best ?? 0;
  const total = result?.total ?? rec?.total ?? 8;
  const nf = nextFamily(f);
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `https://upwind.asia/goc-tu/#/${f.id}`;
    const text = `Mình vừa học ${f.words.length} từ gốc ${f.root.split(" ")[0]} ${"★".repeat(stars(score, total))} với UpWind. Thử xem bạn được mấy sao?`;
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
        Xong gốc <span style={{ color: COLORS.root }}>{f.root}</span>!
      </h2>
      <Stars n={stars(score, total)} />
      <p className="score">
        Đúng ngay lần đầu: <b>{score}/{total}</b>
      </p>
      <p className="muted center">
        {f.words.length} từ đã vào lịch <a href="#/on-tap">ôn tập</a>. Hẹn bạn vài ngày nữa để ôn lại trước khi quên.
        {rec?.doneAt && <> · {new Date(rec.doneAt).toLocaleDateString("vi-VN")}</>}
      </p>
      <div className="done-actions">
        <button className="btn primary wide" onClick={() => go(nf.id)}>
          Gốc tiếp theo: {nf.root} →
        </button>
        <div className="row2">
          <button className="btn ghost" onClick={share}>
            <Icon name="share" size={18} stroke={2} /> {copied ? "Đã copy link" : "Chia sẻ"}
          </button>
          <button className="btn ghost" onClick={onRestart}>
            <Icon name="refresh" size={18} stroke={2} /> Học lại
          </button>
        </div>
      </div>
      <ZaloCta />
    </section>
  );
}
