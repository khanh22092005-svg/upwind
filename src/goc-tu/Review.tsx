import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { allWords, families } from "./data";
import { dueWords, gradeWord, nextDue, progressStore, Rating, scheduler, streak, useProgress } from "./progress";
import { ColoredWord, go, Icon, PartGloss, Speak } from "./ui";
import type { Grade } from "ts-fsrs";

const byWord = new Map(allWords.map((x) => [x.w.word, x]));
const LIMIT = 20;

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: Rating.Again, label: "Quên", cls: "again" },
  { g: Rating.Hard, label: "Khó", cls: "hard" },
  { g: Rating.Good, label: "Nhớ", cls: "good" },
  { g: Rating.Easy, label: "Dễ", cls: "easy" },
];

export function fmtWait(ms: number) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(1, min)} phút`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} giờ`;
  const d = Math.round(h / 24);
  if (d < 45) return `${d} ngày`;
  const m = Math.round(d / 30);
  if (m < 12) return `${m} tháng`;
  return `${Math.round(d / 365)} năm`;
}

export function Review() {
  const p = useProgress();
  const [queue, setQueue] = useState(() => dueWords(progressStore.get()).filter((w) => byWord.has(w)).slice(0, LIMIT));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const word = queue[i];
  const item = word ? byWord.get(word) : undefined;
  const rec = word ? p.cards[word] : undefined;
  const preview = useMemo(() => (rec ? scheduler.repeat(rec.card, new Date()) : null), [rec]);

  const restart = () => {
    setQueue(dueWords(progressStore.get()).filter((w) => byWord.has(w)).slice(0, LIMIT));
    setI(0);
    setDone(0);
    setFlipped(false);
  };
  const grade = (g: Grade) => {
    gradeWord(word, g);
    if (g === Rating.Again) setQueue((q) => [...q, word]);
    else setDone((d) => d + 1);
    setI((x) => x + 1);
    setFlipped(false);
  };

  if (!Object.keys(p.cards).length)
    return (
      <section className="screen center">
        <h2>Ôn tập</h2>
        <p className="muted">Chưa có từ nào để ôn. Học xong một gốc, các từ của gốc đó sẽ tự vào lịch ôn tập.</p>
        <button className="btn primary" onClick={() => go(families[0].id)}>
          Học gốc đầu tiên →
        </button>
      </section>
    );

  if (!item || !rec) {
    const nd = nextDue(p);
    const s = streak(p);
    const fresh = families.find((f) => !p.chapters[f.id]?.doneAt);
    return (
      <section className="screen center">
        <h2>{done ? `Xong ${done} từ!` : "Hôm nay không còn từ cần ôn"}</h2>
        {s > 0 && (
          <p className="streak big">
            <Icon name="flame" size={26} /> Chuỗi {s} ngày
          </p>
        )}
        {nd && <p className="muted">Lần ôn tiếp theo: {nd.getTime() <= Date.now() ? "ngay bây giờ" : `sau ${fmtWait(nd.getTime() - Date.now())}`}.</p>}
        {nd && nd.getTime() <= Date.now() && (
          <button className="btn ghost" onClick={restart}>
            Ôn tiếp
          </button>
        )}
        {fresh && (
          <button className="btn primary" onClick={() => go(fresh.id)}>
            Học gốc mới: {fresh.root} →
          </button>
        )}
        <p>
          <a href="#/">← Về trang chính</a>
        </p>
      </section>
    );
  }

  const { w, family } = item;
  return (
    <section className="screen review">
      <div className="ch-top">
        <a href="#/" className="icon-btn" aria-label="Về trang chính">
          <Icon name="arrow-left" size={22} stroke={2} />
        </a>
        <div className="ch-title">
          <small>Ôn tập</small>
          <b>
            {Math.min(i + 1, queue.length)}/{queue.length}
          </b>
        </div>
        <div className="ch-bar">
          <i style={{ width: Math.round((i / queue.length) * 100) + "%" }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
          <button type="button" className="review-card" onClick={() => setFlipped(true)} aria-expanded={flipped}>
            <small className="muted">gốc {family.root}</small>
            <span className="word-big">
              <ColoredWord w={w} />
            </span>
            <PartGloss parts={w.parts} />
            {!flipped ? (
              <span className="hint">Nghĩa là gì? Nghĩ xong thì chạm để lật</span>
            ) : (
              <span className="back">
                <span className="meaning-line">{w.meaning}</span>
                <span className="story-line">→ {w.story}</span>
                <span className="example-mini" lang="en">
                  “{w.example}”
                </span>
                <span className="vi">{w.example_vi}</span>
              </span>
            )}
          </button>
          <div className="center">
            <Speak text={w.word} big />
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="bottombar">
        {!flipped ? (
          <button className="btn primary wide" onClick={() => setFlipped(true)}>
            Lật thẻ
          </button>
        ) : (
          <div className="grades">
            {GRADES.map(({ g, label, cls }) => (
              <button key={g} className={"grade " + cls} onClick={() => grade(g)}>
                <b>{label}</b>
                <small>{g === Rating.Again ? "hỏi lại" : preview ? fmtWait(preview[g].card.due.getTime() - Date.now()) : ""}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
