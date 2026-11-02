import { useMemo, useRef, useState, type ReactNode } from "react";

export type RecallResult = { ok: boolean; hints: number; ms: number; typed: string; wrongForm: boolean };

const norm = (s: string) => s.trim().toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ");

/**
 * Type the word (recall, not recognition). The root's letters are shown as a scaffold ("__voc____");
 * "Gợi ý" reveals one more letter from the left. Typing another form of the right word counts as wrong,
 * but says so ("đúng từ, sai dạng").
 */
export function Recall({
  target,
  scaffold,
  otherForms = [],
  onResult,
  children,
}: {
  /** the exact answer, e.g. "evoked" */
  target: string;
  /** letters given for free, e.g. the root "voc" */
  scaffold?: string;
  /** other forms of the same word (counted as "right word, wrong form") */
  otherForms?: string[];
  onResult: (r: RecallResult) => void;
  children?: ReactNode;
}) {
  const start = useRef(Date.now());
  const [typed, setTyped] = useState("");
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<RecallResult | null>(null);

  // which letters are visible in the pattern
  const given = useMemo(() => {
    const show = new Array(target.length).fill(false);
    const at = scaffold ? target.toLowerCase().indexOf(scaffold.toLowerCase()) : -1;
    if (at >= 0) for (let i = at; i < at + scaffold!.length; i++) show[i] = true;
    else show[0] = true;
    return show;
  }, [target, scaffold]);
  const visible = useMemo(() => {
    const show = [...given];
    let left = hints;
    for (let i = 0; i < show.length && left > 0; i++)
      if (!show[i] && target[i] !== " ") {
        show[i] = true;
        left--;
      }
    return show;
  }, [given, hints, target]);
  const hidden = visible.filter((v, i) => !v && target[i] !== " ").length;

  const check = () => {
    if (result || !typed.trim()) return;
    const ok = norm(typed) === norm(target);
    const wrongForm = !ok && otherForms.some((f) => norm(f) === norm(typed));
    const r = { ok, hints, ms: Date.now() - start.current, typed: typed.trim(), wrongForm };
    setResult(r);
    onResult(r);
  };

  return (
    <div className="recall">
      {children}
      <div className="pattern" aria-label={`Từ có ${target.length} chữ cái`} lang="en">
        {[...target].map((ch, i) =>
          ch === " " ? (
            <span key={i} className="sp" />
          ) : (
            <span key={i} className={"slotc" + (visible[i] ? " on" : "") + (given[i] ? " root" : "")}>
              {visible[i] || result ? ch : ""}
            </span>
          ),
        )}
      </div>
      <form
        className="wf-input"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={!!result}
          placeholder="Gõ từ..."
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          lang="en"
          aria-label="Gõ từ"
          enterKeyHint="done"
        />
        <button className="btn primary" type="submit" disabled={!!result || !typed.trim()}>
          Kiểm tra
        </button>
      </form>
      {!result && hidden > 1 && (
        <button type="button" className="linklike hint-btn" onClick={() => setHints((h) => h + 1)}>
          Gợi ý thêm 1 chữ{hints > 0 && ` (đã dùng ${hints})`}
        </button>
      )}
      {result && (
        <div className={"feedback " + (result.ok ? "ok" : "bad")} role="status">
          {result.ok ? (
            <>✓ Chính xác{result.hints ? " (có dùng gợi ý)" : "!"}</>
          ) : result.wrongForm ? (
            <>
              Đúng từ, nhưng câu này cần dạng <b>{target}</b>.
            </>
          ) : (
            <>
              ✗ Đáp án: <b>{target}</b>
            </>
          )}
        </div>
      )}
    </div>
  );
}
