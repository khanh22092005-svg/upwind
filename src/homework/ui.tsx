import { useEffect, useState, type ReactNode } from "react";

/** The official UpWind mark (same drawing as the nav logo and public/favicon.svg). */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="UpWind">
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-upwind-primary)" strokeWidth="3"></circle>
      <path d="M50 24 L50 60 L24 60 Z" fill="var(--color-upwind-primary)"></path>
      <line x1="50" y1="20" x2="50" y2="70" stroke="var(--color-upwind-primary)" strokeWidth="4" strokeLinecap="round"></line>
      <path d="M28 70 Q50 78 72 70" fill="none" stroke="var(--color-upwind-primary)" strokeWidth="4" strokeLinecap="round"></path>
      <path d="M24 78 Q50 86 76 78" fill="none" stroke="oklch(0.78 0.10 225)" strokeWidth="4" strokeLinecap="round"></path>
    </svg>
  );
}

export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, "");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
export const go = (path: string) => (window.location.hash = "#/" + path);

export function Shell({ children, right, wide }: { children: ReactNode; right?: ReactNode; wide?: boolean }) {
  return (
    <div className="hw-shell">
      <header className="hw-top">
        <a href="#/" className="hw-brand">
          <Logo />
          <span>
            UpWind <b>Bài tập</b>
          </span>
        </a>
        <div className="hw-top-right">{right}</div>
      </header>
      <main className={wide ? "hw-main wide" : "hw-main"}>{children}</main>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
/** "18:00 · 07/11" in Vietnam time. */
export function fmtDue(iso: string) {
  const d = new Date(new Date(iso).getTime() + 7 * 3600_000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} · ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
}
export const fmtDate = (ymd: string) => ymd.slice(8, 10) + "/" + ymd.slice(5, 7);

export function Loading() {
  return <p className="hw-muted">Đang tải…</p>;
}
export function ErrorBox({ message }: { message: string }) {
  return <p className="hw-error">{message}</p>;
}
