// UpWind design system components used by the Intensive page (ported from the Claude Design bundle).
import React, { useEffect, useState } from "react";

type Css = React.CSSProperties;

const NARROW = "(max-width: 759px)";

// True on phones. Inline styles can't use media queries, so components switch on this.
export function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return narrow;
}

const BTN_SIZES: Record<string, Css> = {
  sm: { fontSize: 14, padding: "10px 18px" },
  md: { fontSize: 16, padding: "15px 26px" },
  lg: { fontSize: 17, padding: "17px 30px", lineHeight: 1.35 },
};
const BTN_VARIANTS: Record<string, Css> = {
  primary: { background: "var(--uw-blue-700)", color: "var(--uw-white)" },
  inverse: { background: "var(--uw-white)", color: "var(--uw-blue-700)" },
  ghost: { background: "var(--ghost-on-brand)", color: "var(--uw-white)" },
  outline: { background: "transparent", color: "var(--uw-blue-900)", border: "1.5px solid oklch(0.60 0.13 240 / 0.45)" },
};

export function Button({ children, variant = "primary", size = "md", href, target, onClick, style }: {
  children: React.ReactNode;
  variant?: "primary" | "inverse" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  target?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: Css;
}) {
  const css: Css = {
    display: "inline-flex", boxSizing: "border-box", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "var(--font-sans)", fontWeight: 700, lineHeight: 1.2, borderRadius: 999, border: "none",
    textDecoration: "none", cursor: "pointer", whiteSpace: "nowrap",
    boxShadow: variant === "primary" && size === "lg" ? "var(--shadow-cta)" : "none",
    ...BTN_SIZES[size], ...BTN_VARIANTS[variant], ...style,
  };
  if (variant === "outline") css.padding = size === "sm" ? "9px 17px" : size === "lg" ? "15px 28px" : "13px 22px";
  if (href) return <a className="uw-cta" href={href} target={target} rel={target ? "noreferrer" : undefined} onClick={onClick} style={css}>{children}</a>;
  return <button className="uw-cta" type="button" onClick={onClick} style={css}>{children}</button>;
}

const DOODLES = {
  gust: { vb: "0 0 64 32", d: ["M4 10 H38 Q48 10 48 4 Q48 0 44 0", "M4 18 H52 Q60 18 60 24 Q60 30 54 30", "M12 26 H30"], fillIdx: -1 },
  boat: { vb: "0 0 48 40", d: ["M24 4 L24 26 L8 26 Z", "M24 2 L24 30", "M10 30 Q24 35 38 30", "M4 36 Q24 42 44 36"], fillIdx: 0 },
};

export function Doodle({ kind, size = 40, color = "var(--uw-blue-400)", className, style }: {
  kind: keyof typeof DOODLES; size?: number; color?: string; className?: string; style?: Css;
}) {
  const p = DOODLES[kind];
  const [w, h] = p.vb.split(" ").slice(2).map(Number);
  return (
    <svg aria-hidden="true" viewBox={p.vb} width={size} height={(size * h) / w} className={className}
      style={{ display: "inline-block", flex: "0 0 auto", overflow: "visible", ...style }}>
      {p.d.map((d, i) => (
        <path key={i} d={d} fill={p.fillIdx === i ? color : "none"} stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return <mark style={{ background: "var(--uw-blue-250)", color: "inherit", padding: "1px 6px", borderRadius: 5, fontWeight: 700 }}>{children}</mark>;
}

export function Squiggle({ children, color = "var(--uw-blue-400)" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ position: "relative", whiteSpace: "nowrap" }}>
      {children}
      <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"
        style={{ position: "absolute", left: 0, right: 0, bottom: "-0.05em", width: "100%", height: "0.16em" }}>
        <path d="M2 9 Q 60 2 100 7 T 198 5" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function WaveDivider({ fill, reverse = false }: { fill: string; reverse?: boolean }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: -1, height: 76, overflow: "hidden", lineHeight: 0, pointerEvents: "none" }}>
      <svg className={reverse ? "uw-drift2" : "uw-drift"} viewBox="0 0 1200 82" preserveAspectRatio="none" style={{ width: "200%", height: "100%", display: "block" }}>
        <path d="M0 46 Q75 12 150 46 T300 46 T450 46 T600 46 T750 46 T900 46 T1050 46 T1200 46 L1200 0 L0 0 Z" fill={fill} />
      </svg>
    </div>
  );
}

const LOGO_TONES = {
  primary: { c: "var(--uw-blue-700)", w: "var(--uw-blue-400)" },
  ink: { c: "var(--uw-ink)", w: "var(--uw-line)" },
};

export function Logo({ tone = "primary", size = 34, detail, wordmark = true }: {
  tone?: keyof typeof LOGO_TONES; size?: number; detail?: string; wordmark?: boolean;
}) {
  const t = LOGO_TONES[tone];
  const ring = size < 32 ? 4 : 3;
  const sw = size < 32 ? 5 : 4;
  const mark = (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="UpWind" style={{ flex: "0 0 auto", display: "block" }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={t.c} strokeWidth={ring} />
      <path d="M50 24 L50 60 L24 60 Z" fill={t.c} />
      <line x1="50" y1="20" x2="50" y2="70" stroke={t.c} strokeWidth={sw} strokeLinecap="round" />
      <path d="M28 70 Q50 78 72 70" fill="none" stroke={t.c} strokeWidth={sw} strokeLinecap="round" />
      <path d="M24 78 Q50 86 76 78" fill="none" stroke={t.w} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
  if (!wordmark) return <span style={{ display: "inline-flex" }}>{mark}</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.max(8, Math.round(size * 0.3)) }}>
      {mark}
      <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: Math.round(size * 0.65), lineHeight: 1, color: t.c, whiteSpace: "nowrap" }}>
        UpWind{detail && <span className="brand-detail" style={{ fontSize: "0.72em" }}> {detail}</span>}
      </span>
    </span>
  );
}

export function Eyebrow({ children, tone = "tint" }: { children: React.ReactNode; tone?: "tint" | "plain" }) {
  if (tone === "plain") {
    return <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--uw-blue-500)" }}>{children}</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "var(--uw-blue-100)", color: "var(--uw-blue-900)", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "7px 14px", borderRadius: 8 }}>
      <svg aria-hidden="true" viewBox="0 0 30 10" style={{ flex: "0 0 30px", width: 30, height: 10 }}>
        <path d="M0 5 Q3.75 1.5 7.5 5 T15 5 T22.5 5 T30 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {children}
    </span>
  );
}

const PILL_TONES: Record<string, Css> = {
  white: { background: "var(--uw-white)", color: "var(--uw-ink)" },
  primary: { background: "var(--uw-blue-700)", color: "var(--uw-white)" },
  light: { background: "var(--uw-blue-100)", color: "var(--uw-blue-900)" },
  accent: { background: "var(--uw-blue-500)", color: "var(--uw-white)" },
};

export function Pill({ children, tone = "light", size = "md" }: {
  children: React.ReactNode; tone?: "white" | "primary" | "light" | "accent"; size?: "sm" | "md";
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, flex: "0 0 auto", lineHeight: 1.4, fontWeight: 700, borderRadius: 999, whiteSpace: "nowrap",
      ...(size === "sm" ? { fontSize: 13, padding: "6px 13px" } : { fontSize: 14, padding: "10px 16px" }),
      ...PILL_TONES[tone],
    }}>{children}</span>
  );
}

export function Sticker({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--uw-white)", color: "var(--uw-blue-900)", fontSize: 13, fontWeight: 800, lineHeight: 1.45, padding: "11px 18px", borderRadius: 999, boxShadow: "var(--shadow-sticker)" }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--uw-blue-500)", flex: "0 0 7px" }} />
      <span>{children}</span>
    </span>
  );
}

export function TeacherCard({ name, role, photo, badges, bullets, tone = "light" }: {
  name: string; role: string; photo: string; badges: string[]; bullets: string[]; tone?: "light" | "brand";
}) {
  const brand = tone === "brand";
  const narrow = useNarrow();
  return (
    <article className="uw-tilt" style={{
      background: brand ? "var(--uw-blue-700)" : "var(--uw-white)", color: brand ? "var(--uw-white)" : "var(--uw-ink)",
      border: brand ? undefined : "1.5px solid var(--uw-line)", borderRadius: narrow ? 24 : 28, padding: narrow ? 20 : 28,
      display: "flex", flexWrap: "wrap", gap: narrow ? 20 : 28, alignItems: "flex-start",
    }}>
      <div style={{ flex: "1 1 180px", maxWidth: narrow ? 180 : 230, minWidth: 0 }}>
        <div style={{ borderRadius: "20px 20px 110px 20px", overflow: "hidden", aspectRatio: "4 / 5", background: brand ? "var(--uw-blue-500)" : "var(--uw-blue-100)" }}>
          <img src={photo} alt={name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </div>
      <div style={{ flex: "3 1 300px", minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {badges.map((b, i) => (
            <Pill key={b} size="sm" tone={i === 0 ? (brand ? "white" : "primary") : brand ? "accent" : "light"}>{b}</Pill>
          ))}
        </div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(27px, 3vw, 34px)", lineHeight: 1.15, margin: "18px 0 0", color: brand ? "var(--uw-white)" : "var(--uw-blue-700)" }}>{name}</h3>
        <p style={{ fontSize: 16, lineHeight: "26px", margin: "10px 0 0", color: brand ? "var(--uw-blue-200)" : "var(--uw-ink)" }}>{role}</p>
        <blockquote style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(18px, 2vw, 21px)", lineHeight: 1.5, margin: "20px 0 0", color: brand ? "var(--uw-white)" : "var(--uw-ink-2)" }}>
          {bullets.map((b) => <div key={b}>- {b}</div>)}
        </blockquote>
      </div>
    </article>
  );
}

export function Accordion({ items, defaultOpen = -1 }: { items: { q: string; a: string }[]; defaultOpen?: number }) {
  return (
    <div style={{ display: "grid", borderTop: "1px solid var(--uw-line)", marginTop: 32 }}>
      {items.map((it, i) => (
        <details key={it.q} open={i === defaultOpen} style={{ borderBottom: "1px solid var(--uw-line)", padding: "clamp(18px, 5vw, 24px) 4px" }}>
          <summary style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "clamp(18px, 4.8vw, 20px)", lineHeight: 1.45, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "baseline" }}>
            {it.q}
            <span className="uw-sign" aria-hidden="true" style={{ flex: "0 0 auto", color: "var(--uw-blue-500)", fontSize: 24, lineHeight: 1, display: "inline-block" }}>+</span>
          </summary>
          <p style={{ fontSize: 16, lineHeight: "28px", margin: "14px 0 0", color: "var(--uw-ink-2)", maxWidth: "62ch" }}>{it.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const narrow = useNarrow();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "var(--scrim)", display: "grid", placeItems: narrow ? "end center" : "center", padding: narrow ? 10 : 20, overflowY: "auto", overscrollBehavior: "contain", animation: "uw-fade 300ms var(--ease-sail)" }}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 520, boxSizing: "border-box", background: "var(--uw-white)", borderRadius: narrow ? 24 : 28, padding: narrow ? "28px 20px 22px" : "36px 32px 30px", boxShadow: "var(--shadow-pop)", animation: "uw-pop 400ms var(--ease-sail)" }}>
        <button aria-label="Đóng" onClick={onClose} className="uw-cta" style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 999, border: "none", background: "var(--uw-blue-100)", color: "var(--uw-blue-900)", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>✕</button>
        <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: narrow ? 24 : 28, lineHeight: 1.16, margin: "0 44px 0 0", color: "var(--uw-ink)" }}>{title}</h3>
        <div style={{ fontSize: 16, lineHeight: "26px", color: "var(--uw-ink-2)", marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

const FIELD: Css = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--uw-ink)",
  background: "var(--uw-white)", border: "1.5px solid var(--uw-line)", borderRadius: 14, padding: "13px 16px", outline: "none", lineHeight: "24px",
};
const LABEL: Css = { fontSize: 14, fontWeight: 700, color: "var(--uw-ink)" };

export function Input({ label, placeholder, value, onChange, error, type = "text", autoComplete }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={LABEL}>{label}</span>
      <input className="uw-field" type={type} placeholder={placeholder} value={value} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined}
        style={{ ...FIELD, borderColor: error ? "var(--status-danger)" : undefined }} />
      {error && <span style={{ fontSize: 13, color: "var(--status-danger)" }}>{error}</span>}
    </label>
  );
}

export function Select({ label, placeholder, options, value, onChange }: {
  label: string; placeholder: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={LABEL}>{label}</span>
      <span style={{ position: "relative", display: "block" }}>
        <select className="uw-field" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ ...FIELD, appearance: "none", WebkitAppearance: "none", paddingRight: 42, cursor: "pointer" }}>
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span aria-hidden="true" style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--uw-blue-500)", fontSize: 12, pointerEvents: "none" }}>▾</span>
      </span>
    </label>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 16, color: "var(--uw-ink)", position: "relative" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span aria-hidden="true" style={{
        width: 22, height: 22, flex: "0 0 22px", boxSizing: "border-box", borderRadius: 7,
        border: checked ? "none" : "1.5px solid var(--uw-blue-400)", background: checked ? "var(--uw-blue-700)" : "var(--uw-white)",
        display: "grid", placeItems: "center", color: "var(--uw-white)", fontSize: 13, fontWeight: 800, transition: "background 300ms var(--ease-sail)",
      }}>{checked && "✓"}</span>
      {label}
    </label>
  );
}

export function NavBar({ detail, ctaLabel, ctaHref, onCta }: { detail: string; ctaLabel: string; ctaHref: string; onCta: (e: React.MouseEvent) => void }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--nav-glass)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid var(--uw-line)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px clamp(20px,4vw,32px)", display: "flex", alignItems: "center", gap: 16 }}>
        <a href="#top" style={{ display: "flex", alignItems: "center", textDecoration: "none", minWidth: 0 }}>
          <Logo size={34} detail={detail} />
        </a>
        <div style={{ flex: 1 }} />
        <Button size="sm" href={ctaHref} onClick={onCta} style={{ flex: "0 0 auto" }}>{ctaLabel}</Button>
      </div>
    </nav>
  );
}

export function Footer({ links }: { links: { label: string; href: string; external?: boolean }[] }) {
  const name = "UpWind - IELTS & Self Study";
  const narrow = useNarrow();
  return (
    <footer style={{ position: "relative", padding: narrow ? "56px 0 40px" : "88px 0 96px", background: "var(--uw-white)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 clamp(20px,4vw,32px)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px 48px", fontSize: 14, color: "var(--uw-ink-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo tone="ink" size={28} wordmark={false} />
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 18, color: "var(--uw-ink)" }}>{name}</span>
        </div>
        <span>Lấy điểm thật, học cách tự đi</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", fontWeight: 600 }}>
          {links.map((l) => (
            <a key={l.label} href={l.href} target={l.external ? "_blank" : undefined} rel={l.external ? "noreferrer" : undefined} style={{ textDecoration: "none", whiteSpace: "nowrap" }}>{l.label}</a>
          ))}
          <span style={{ whiteSpace: "nowrap" }}>© 2026 {name}</span>
        </div>
      </div>
    </footer>
  );
}

export function StickyBar({ title, subtitle, ctaLabel, onCta }: { title: string; subtitle: string; ctaLabel: string; onCta: (e: React.MouseEvent) => void }) {
  return (
    <div style={{ position: "fixed", left: 12, right: 12, bottom: "calc(12px + env(safe-area-inset-bottom))", zIndex: 60 }}>
      <div style={{ background: "var(--uw-blue-700)", borderRadius: 20, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-float)" }}>
        <div style={{ flex: 1, minWidth: 0, color: "var(--uw-white)" }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--uw-blue-200)" }}>{subtitle}</div>
        </div>
        <a className="uw-cta" href="#dangky" onClick={onCta} style={{ background: "var(--uw-white)", color: "var(--uw-blue-700)", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "12px 16px", borderRadius: 999, whiteSpace: "nowrap", cursor: "pointer" }}>{ctaLabel}</a>
      </div>
    </div>
  );
}
