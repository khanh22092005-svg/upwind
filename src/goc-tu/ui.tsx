import { useEffect, useState, type ReactNode } from "react";
import { COLORS, KIND_VI, iconSvg, type Part, type Word } from "./data";
import { chunks } from "./lib";
import { canSpeak, speak } from "./speech";

export const ZALO_URL = "https://zalo.me/84375810412";

/** Hash routes: #/ · #/voc · #/voc/evoke · #/on-tap · #/bang-phu-to */
export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
export const go = (path: string) => {
  window.location.hash = "#/" + path;
};

/** The official UpWind mark (same drawing as the nav logo on the other pages and public/favicon.svg). */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="UpWind - IELTS & Self Study">
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-upwind-primary)" strokeWidth="3"></circle>
      <path d="M50 24 L50 60 L24 60 Z" fill="var(--color-upwind-primary)"></path>
      <line x1="50" y1="20" x2="50" y2="70" stroke="var(--color-upwind-primary)" strokeWidth="4" strokeLinecap="round"></line>
      <path d="M28 70 Q50 78 72 70" fill="none" stroke="var(--color-upwind-primary)" strokeWidth="4" strokeLinecap="round"></path>
      <path d="M24 78 Q50 86 76 78" fill="none" stroke="oklch(0.78 0.10 225)" strokeWidth="4" strokeLinecap="round"></path>
    </svg>
  );
}

export function Icon({ name, size = 24, stroke = 1.8 }: { name?: string; size?: number; stroke?: number }) {
  return (
    <svg
      className="ico"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: iconSvg(name) }}
    />
  );
}

export function Speak({ text, rate, label = "Nghe phát âm", big }: { text: string; rate?: number; label?: string; big?: boolean }) {
  if (!canSpeak) return null;
  return (
    <button type="button" className={"speak" + (big ? " big" : "")} onClick={(e) => (e.stopPropagation(), speak(text, rate))} aria-label={label} title={label}>
      <Icon name="volume" size={big ? 22 : 18} stroke={2} />
    </button>
  );
}

export const partText = (p: Part) => p.t;

/** prefix orange · root blue · suffix green */
export function ColoredWord({ w, className }: { w: Word; className?: string }) {
  return (
    <span className={className} aria-label={w.word}>
      {w.parts.map((p, i) => (
        <span key={i} style={{ color: COLORS[p.k] }} aria-hidden="true">
          {p.t}
        </span>
      ))}
    </span>
  );
}

export function PartGloss({ parts }: { parts: Part[] }) {
  return (
    <span className="gloss">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="plus"> + </span>}
          <b style={{ color: COLORS[p.k] }}>{p.t}</b> <small>({p.vi})</small>
        </span>
      ))}
    </span>
  );
}

/** Vietnamese text with {{English}} spans set in bold. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {chunks(text).map((c, i) =>
        c.en ? (
          <b key={i} className="en">
            {c.text}
          </b>
        ) : (
          <span key={i}>{c.text}</span>
        ),
      )}
    </>
  );
}

export function KindLegend() {
  return (
    <p className="legend">
      {(["pre", "root", "suf"] as const).map((k) => (
        <span key={k}>
          <i style={{ background: COLORS[k] }} />
          {KIND_VI[k]}
        </span>
      ))}
    </p>
  );
}

export function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span className="stars" aria-label={`${n}/${of} sao`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < n ? "on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ZaloCta({ children }: { children?: ReactNode }) {
  return (
    <div className="zalo-cta">
      <div>
        <b>Muốn học IELTS cùng UpWind?</b>
        <p>{children ?? "Lớp IELTS online tối đa 8 học viên, 2 giáo viên IELTS 8.0. Nhắn Zalo để được tư vấn lộ trình miễn phí."}</p>
      </div>
      <a className="btn primary" href={ZALO_URL} target="_blank" rel="noreferrer">
        Nhắn Zalo
      </a>
    </div>
  );
}
