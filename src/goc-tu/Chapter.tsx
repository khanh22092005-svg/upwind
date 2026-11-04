import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { COLORS, DAYS, families, iconSvg, nextFamily, parts, shortRoot, type Family, type Word } from "./data";
import { splitAt } from "./lib";
import { Branch, type TwigState } from "./Branch";
import { bridgesFor } from "./bridges";
import { PartBuilder } from "./PartBuilder";
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
  const [result, setResult] = useState<{ score: number; total: number; fruit: { family: Family; w: Word }[] } | null>(null);
  const twigStates = (current: number): TwigState[] => f.words.map((_, i) => (i < current ? "leaf" : i === current ? "now" : "bare"));

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
          <small>
            Bài {f.n}/{families.length} · Tuần {f.week} · {DAYS[f.day - 1]}
          </small>
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
          {step === 1 && <RootCard f={f} onNext={next} twigs={twigStates(-1)} />}
          {step >= 2 && step < PRACTICE && (
            <WordScreen
              key={f.words[step - 2].word}
              f={f}
              w={f.words[step - 2]}
              index={step - 2}
              twigs={twigStates(step - 2)}
              onNext={next}
              onBack={() => setStep((s) => s - 1)}
            />
          )}
          {step === PRACTICE && (
            <Practice
              f={f}
              onFinish={(score, total, fruit) => {
                completeChapter(f.id, f.words.map((w) => w.word), score, total);
                setResult({ score, total, fruit });
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
            Khám phá gốc {shortRoot(f)} →
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

function RootCard({ f, onNext, twigs }: { f: Family; onNext: () => void; twigs: TwigState[] }) {
  return (
    <section className="screen">
      <p className="kicker">Gốc từ · Phần {f.part + 1}: {parts[f.part].title}</p>
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
      <Branch f={f} states={twigs} />
      <p className="muted center">
        Một gốc, {f.words.length} nhánh con. Giữ hình ảnh này trong đầu: mỗi từ là một nhánh mọc ra từ nó. Cắt từng từ ra để nó mọc lá.
      </p>
      <KindLegend />
      <BottomBar>
        <button className="btn primary wide" onClick={onNext}>
          Cho nhánh đầu tiên mọc lá →
        </button>
      </BottomBar>
    </section>
  );
}

const badgeSvg = (name?: string) =>
  `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconSvg(name)}</svg>`;

type Phase = "build" | "guess" | "card";

function WordScreen({
  f,
  w,
  index,
  twigs,
  onNext,
  onBack,
}: {
  f: Family;
  w: Word;
  index: number;
  twigs: TwigState[];
  onNext: () => void;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("build");
  const [shown, setShown] = useState(false);
  const last = index === f.words.length - 1;
  const grown = twigs.map((t, i) => (i === index && phase === "card" ? "leaf" : t));
  return (
    <section className="screen">
      <Branch f={f} states={grown} />
      <p className="kicker">
        Nhánh {index + 1}/{f.words.length} · {phase === "build" ? "Ghép từ" : phase === "guess" ? "Đoán nghĩa" : "Lá mới"}
      </p>

      {phase === "build" && (
        <PartBuilder
          w={w}
          prompt="Ghép các mảnh thành một từ. Nghĩa của từ thì bạn sẽ tự đoán sau."
          onDone={() => {
            speak(w.word);
            burst();
            setPhase("guess");
          }}
        />
      )}

      {phase === "guess" && (
        <div className="guess">
          <div className="word-big">
            <ColoredWord w={w} /> <Speak text={w.word} big />
          </div>
          <PartGloss parts={w.parts} />
          <p className="q">→ Ghép nghĩa các mảnh lại: từ này nghĩa là gì? Nghĩ trong đầu rồi mới xem.</p>
          {shown && <p className="q small">Bạn đoán thế nào? Chọn ở dưới để cành mọc lá.</p>}
          <AnimatePresence>
            {shown && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className={"story" + (w.tale ? " tale" : "")}>
                  <small>Câu chuyện</small>
                  {w.tale ? <Tale text={w.tale} /> : w.story}
                </div>
                <div className="meaning">
                  <small>Nghĩa</small>
                  {w.meaning}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {phase === "card" && <WordCard w={w} f={f} />}

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
        {phase === "guess" && !shown && (
          <button className="btn primary wide" onClick={() => setShown(true)}>
            Xem nghĩa
          </button>
        )}
        {phase === "guess" && shown && (
          <div className="selfcheck" role="group" aria-label="Bạn đoán thế nào?">
            {["Đoán đúng", "Gần đúng", "Chưa đúng"].map((label, k) => (
              <button key={k} type="button" className={"btn " + (k === 0 ? "primary" : "ghost")} onClick={() => setPhase("card")}>
                {label}
              </button>
            ))}
          </div>
        )}
        {phase === "card" && (
          <button className="btn primary wide" onClick={onNext}>
            {last ? "Vào thử thách →" : "Nhánh tiếp theo →"}
          </button>
        )}
      </BottomBar>
    </section>
  );
}

export function WordCard({ w, f }: { w: Word; f?: Family }) {
  const [before, form, after] = splitAt(w);
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
      {!!w.col?.length && (
        <div className="related">
          <small>Hay đi cùng</small>
          <span lang="en">{w.col.join(" · ")}</span>
        </div>
      )}
      {f && <Bridges w={w} f={f} />}
      {w.trap && (
        <div className="trap">
          ⚠ <Rich text={w.trap} />
        </div>
      )}
    </article>
  );
}

/** "Cũng mọc trên…": the same prefix (or suffix) on other branches. Tap to jump there. */
function Bridges({ w, f }: { w: Word; f: Family }) {
  const affixes = w.parts.filter((p) => p.k === "pre");
  const list = (affixes.length ? affixes : w.parts.filter((p) => p.k === "suf")).map((p) => ({ p, words: bridgesFor(p, f) })).filter((x) => x.words.length);
  if (!list.length) return null;
  return (
    <div className="bridges">
      {list.map(({ p, words }) => (
        <div key={p.t}>
          <small>
            <b style={{ color: COLORS[p.k] }}>{p.k === "pre" ? `${p.t}-` : `-${p.t}`}</b> cũng mọc trên {words.length} nhánh khác:
          </small>
          <div className="bridge-words">
            {words.slice(0, 6).map((x) => (
              <a key={x.family.id + x.w.word} className="chip small" href={`#/${x.family.id}/${encodeURIComponent(x.w.word)}`} lang="en">
                {x.w.word} <small>· {shortRoot(x.family)}</small>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Done({
  f,
  result,
  onRestart,
}: {
  f: Family;
  result: { score: number; total: number; fruit: { family: Family; w: Word }[] } | null;
  onRestart: () => void;
}) {
  const p = useProgress();
  const rec = p.chapters[f.id];
  const score = result?.score ?? rec?.best ?? 0;
  const total = result?.total ?? rec?.total ?? 8;
  const nf = nextFamily(f);
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `https://upwind.asia/goc-tu/#/${f.id}`;
    const text = `Mình vừa học ${f.words.length} từ gốc ${shortRoot(f)} ${"★".repeat(stars(score, total))} với UpWind. Thử xem bạn được mấy sao?`;
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
      <Branch f={f} states={f.words.map(() => "leaf")} />
      <Stars n={stars(score, total)} />
      <p className="score">
        Đúng ngay lần đầu: <b>{score}/{total}</b>
      </p>
      <p className="muted center">
        {f.words.length} từ đã vào lịch <a href="#/on-tap">ôn tập</a>. Hẹn bạn vài ngày nữa để ôn lại trước khi quên.
        {rec?.doneAt && <> · {new Date(rec.doneAt).toLocaleDateString("vi-VN")}</>}
      </p>
      {!!result?.fruit.length && (
        <div className="bridges">
          <small>Nhánh mới bạn vừa chạm tới:</small>
          <div className="bridge-words">
            {result.fruit.map((x) => (
              <a key={x.w.word} className="chip small fruit-chip" href={`#/${x.family.id}/${encodeURIComponent(x.w.word)}`}>
                <span className="fruit-dot" /> {x.w.word} <small>· gốc {shortRoot(x.family)}</small>
              </a>
            ))}
          </div>
        </div>
      )}
      <div className="done-actions">
        <button className="btn primary wide" onClick={() => go(nf.id)}>
          Bài tiếp theo: gốc {nf.root} →
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

/** A tale: **word parts** in bold, {{word}} as the English word. */
function Tale({ text }: { text: string }) {
  return (
    <p className="tale-text">
      {text.split(/(\*\*[^*]+\*\*|\{\{[^}]+\}\})/).map((s, i) =>
        s.startsWith("**") ? (
          <b key={i}>{s.slice(2, -2)}</b>
        ) : s.startsWith("{{") ? (
          <em key={i} className="tale-word" lang="en">
            {s.slice(2, -2)}
          </em>
        ) : (
          s
        ),
      )}
    </p>
  );
}
