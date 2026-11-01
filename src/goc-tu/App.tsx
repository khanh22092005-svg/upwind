import { MotionConfig } from "motion/react";
import { Affixes } from "./Affixes";
import { Chapter } from "./Chapter";
import { familyById } from "./data";
import { Home } from "./Home";
import { dueWords, useProgress } from "./progress";
import { Review } from "./Review";
import { Logo, useRoute, ZALO_URL } from "./ui";

export default function App() {
  const route = useRoute();
  const p = useProgress();
  const due = dueWords(p).length;
  const [first, second] = route;
  const family = first ? familyById(first) : undefined;

  let view;
  if (first === "on-tap") view = <Review />;
  else if (first === "bang-phu-to") view = <Affixes />;
  else if (family) view = <Chapter key={family.id + (second ?? "")} family={family} startWord={second} />;
  else view = <Home />;

  return (
    <MotionConfig reducedMotion="user">
      <header className="nav">
        <div className="nav-in">
          <a href="#/" className="brand">
            <Logo />
            <span>
              UpWind <small>· Học từ từ gốc</small>
            </span>
          </a>
          <span style={{ flex: 1 }} />
          <a href="#/on-tap" className="nav-review">
            Ôn tập{due > 0 && <span className="count">{due}</span>}
          </a>
        </div>
      </header>
      {/* wrapped in a div: src/ielts/index.css pads every <section> directly inside <main> */}
      <main className={family || first === "on-tap" ? "app narrow" : "app"}>
        <div>{view}</div>
      </main>
      {!family && (
        <footer className="foot">
          <a href="/ielts-self-study/">UpWind - IELTS &amp; Self Study</a>
          <a href={ZALO_URL} target="_blank" rel="noreferrer">
            Zalo
          </a>
          <span>© 2026 UpWind</span>
        </footer>
      )}
    </MotionConfig>
  );
}
