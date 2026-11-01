// Burned-in subtitles (ASS, rendered by ffmpeg/libass): one line at a time, the word being spoken highlighted.
// Timing is estimated from each spoken clip's length and the characters in it: close, not frame-perfect.
const INK = "&H0045250B"; // #0b2545 (ASS colours are &HAABBGGRR)
const ACTIVE = "&H001C71F2"; // #f2711c
const OUTLINE = "&H00FFFFFF";
const MAX_CHARS = 32;

/** Capitalise the first letter of each sentence ("..." is a pause, not a sentence end). */
export const capitalizeSentences = (t) => t.replace(/(^|(?<!\.)[.!?]\s+)(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase());

const ts = (s) => {
  const cs = Math.max(0, Math.round(s * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const sec = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
};
const assText = (t) => t.replace(/\\/g, "/").replace(/[{}]/g, "");
const weight = (t) => Math.max(1, t.replace(/[^\p{L}\p{N}]/gu, "").length);

/** Wrap words into n evenly sized lines (used only when a clause is longer than one line). */
function balanced(words) {
  const text = words.join(" ");
  const n = Math.ceil(text.length / MAX_CHARS);
  const target = text.length / n;
  const out = [];
  let cur = [];
  for (const w of words) {
    if (cur.length && [...cur, w].join(" ").length > target + 4 && out.length < n - 1) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Split into lines of ≤ MAX_CHARS. A line never straddles two sentences; inside a sentence, breaks go
 *  after commas when possible (so "bất thình / lình" never happens), and only long clauses are word-wrapped. */
export function splitLines(text) {
  const lines = [];
  for (const sentence of text.split(/(?<=[.!?…:])\s+(?=\S)/)) {
    const clauses = sentence.split(/(?<=,)\s+/).map((c) => c.split(/\s+/).filter(Boolean));
    let cur = [];
    for (const clause of clauses) {
      if (cur.length && [...cur, ...clause].join(" ").length <= MAX_CHARS) {
        cur.push(...clause);
        continue;
      }
      if (cur.length) lines.push(cur);
      cur = [];
      if (clause.join(" ").length <= MAX_CHARS) cur = [...clause];
      else lines.push(...balanced(clause));
    }
    if (cur.length) lines.push(cur);
  }
  return lines;
}

/**
 * entries: [{ start, speech, end, chunks: [{ text, weight }] }] in video seconds.
 * start = scene start, speech = seconds of narration, end = scene end.
 */
export function buildAss(entries, { width = 1080, height = 1920, marginV = 400, fontSize = 62 } = {}) {
  const events = [];
  for (const e of entries) {
    let t = e.start + 0.12;
    const total = e.chunks.reduce((n, c) => n + (c.weight || 1), 0);
    e.chunks.forEach((c, ci) => {
      const chunkDur = e.speech * ((c.weight || 1) / total);
      const lines = splitLines(capitalizeSentences(c.text));
      const lineW = lines.map((l) => weight(l.join(" ")));
      const sumL = lineW.reduce((a, b) => a + b, 0);
      lines.forEach((words, li) => {
        const lineDur = chunkDur * (lineW[li] / sumL);
        const lastLine = ci === e.chunks.length - 1 && li === lines.length - 1;
        const lineEnd = lastLine ? Math.min(e.end - 0.05, t + lineDur + 0.6) : t + lineDur;
        const ww = words.map(weight);
        const sumW = ww.reduce((a, b) => a + b, 0);
        let wt = t;
        words.forEach((_, wi) => {
          const wEnd = wi === words.length - 1 ? lineEnd : wt + lineDur * (ww[wi] / sumW);
          const txt = words
            .map((w, k) => (k === wi ? `{\\c${ACTIVE}&\\b800}${assText(w)}{\\r}` : assText(w)))
            .join(" ");
          events.push(`Dialogue: 0,${ts(wt)},${ts(wEnd)},Sub,,0,0,0,,${wi === 0 ? "{\\fad(120,0)}" : ""}${txt}`);
          wt = wEnd;
        });
        t += lineDur;
      });
    });
  }
  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Be Vietnam Pro,${fontSize},${INK},${INK},${OUTLINE},&H00000000,600,0,0,0,100,100,0,0,1,5,0,2,70,70,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join("\n")}
`;
}
