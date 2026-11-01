import { useMemo, useState } from "react";
import { COLORS, shortRoot } from "./data";
import { affixIndex } from "./lib";
import { go, Icon } from "./ui";

export function Affixes() {
  const [kind, setKind] = useState<"pre" | "suf">("pre");
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => affixIndex(kind), [kind]);
  return (
    <section className="screen affixes">
      <div className="ch-top">
        <a href="#/" className="icon-btn" aria-label="Về trang chính">
          <Icon name="arrow-left" size={22} stroke={2} />
        </a>
        <div className="ch-title">
          <b>Bảng tiền tố &amp; hậu tố</b>
        </div>
      </div>
      <p className="muted">
        Tiền tố cho biết <b>hướng</b> (ra, vào, lại, trước...), hậu tố cho biết <b>loại từ</b>. Nhớ bảng này là đoán được nghĩa của
        rất nhiều từ mới. Chạm vào một dòng để xem các từ.
      </p>
      <div className="tabs" role="tablist">
        {(["pre", "suf"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => (setKind(k), setOpen(null))}>
            {k === "pre" ? "Tiền tố" : "Hậu tố"}
          </button>
        ))}
      </div>
      <ul className="affix-list">
        {rows.map((r) => (
          <li key={r.key} className={open === r.key ? "open" : ""}>
            <button type="button" onClick={() => setOpen(open === r.key ? null : r.key)} aria-expanded={open === r.key}>
              <b style={{ color: COLORS[kind] }}>{kind === "pre" ? `${r.key}-` : `-${r.key}`}</b>
              <span>{r.vi}</span>
              <small>{r.words.length} từ</small>
            </button>
            {open === r.key && (
              <div className="affix-words">
                {r.words.map(({ family, word }) => (
                  <button key={family.id + word} className="chip small" onClick={() => go(`${family.id}/${encodeURIComponent(word)}`)}>
                    {word} <small>· {shortRoot(family)}</small>
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
