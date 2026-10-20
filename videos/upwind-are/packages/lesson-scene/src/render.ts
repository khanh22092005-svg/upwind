import { sealVisualTrack } from "@hypit/composition";
import type { VisualElement } from "@hypit/composition";
import { htmlVisual } from "@hypit/html-program";
import type { FontStackRef } from "@hypit/media";
import type { Timeline } from "@hypit/timeline";
import type { SpatialFrame } from "@hypit/spatial";
import { assertTemporalWindowFor } from "@hypit/temporal";
import type { TemporalInstant, TemporalWindow } from "@hypit/temporal";

export const BEAT_KINDS = ["section", "examiner", "candidate", "silence", "label", "teach", "stack", "step", "cta", "hook"] as const;
export type BeatKind = typeof BEAT_KINDS[number];
export type Beat = { id: string; kind: BeatKind; text: string; step: string; at: TemporalInstant };
export type LessonOptions = { id: string; tag: string };
export type LessonFonts = { font: FontStackRef; heavy: FontStackRef; serif: FontStackRef };

// UpWind design tokens (upwind.asia src/ielts/index.css).
const ink = "oklch(0.24 0.02 260)", ink2 = "oklch(0.38 0.02 260)", primary = "oklch(0.42 0.15 253)",
  primaryLight = "oklch(0.96 0.022 235)", accent = "oklch(0.60 0.13 240)", softBlue = "oklch(0.86 0.075 228)",
  border = "oklch(0.9 0.02 235)", highlight = "oklch(0.92 0.04 230)";
const sections = ["skit", "teach", "redo", "cta"];
const logo = (cls: string, color: string, wave: string) => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill="none" stroke="${color}" stroke-width="3"/><path d="M50 24 L50 60 L24 60 Z" fill="${color}"/>
  <line x1="50" y1="20" x2="50" y2="70" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  <path d="M28 70 Q50 78 72 70" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  <path d="M24 78 Q50 86 76 78" fill="none" stroke="${wave}" stroke-width="4" stroke-linecap="round"/></svg>`;
const waveBlue = "oklch(0.78 0.10 225)";

/** Skit, teaching captions, the A.R.E stack and the CTA share one scene so sections hand off together. */
export function renderLesson(timeline: Timeline, within: SpatialFrame, window: TemporalWindow,
  fonts: LessonFonts, beats: readonly Beat[], options: LessonOptions) {
  assertTemporalWindowFor(window, { subjectId: options.id, timeline });
  if (beats.some(beat => beat.at.frame < window.span.startFrame || beat.at.frame >= window.span.endFrameExclusive)) throw new Error("Lesson beats must appear inside the scene's window.");
  const local = (beat: Beat) => beat.at.frame - window.span.startFrame;
  let order = 0;
  const elements: VisualElement[] = [];
  const text = (id: string, value: string, face: FontStackRef, size: number, color: string, extra: { name: string; value: string | number }[] = []) => {
    elements.push({ id, kind: "text", parent: "lesson", order: ++order, text: value, fonts: face.faces,
      style: [{ name: "font-size", value: `${size}px` }, { name: "line-height", value: 1.25 }, { name: "color", value: color }, ...extra] });
    return `{{${id}}}`;
  };
  // Text marked *like this* is the keyword of a teaching caption.
  const marked = (id: string, value: string, size: number) => value.split("*").flatMap((part, index) => index % 2
    ? [`<span class="key">${text(`${id}-${index}`, part.trim(), fonts.heavy, size, primary)}</span>`]
    : part.trim().split(/\s+/).filter(Boolean).map((word, w) => `<span class="seg">${text(`${id}-${index}-${w}`, word, fonts.heavy, size, ink)}</span>`)).join("");

  const sectionStarts = sections.map(name => { const beat = beats.find(b => b.kind === "section" && b.text === name); return beat ? local(beat) : -1; });
  const stackBeat = beats.find(b => b.kind === "stack");
  const letters = stackBeat ? stackBeat.text.split(",").map(l => l.trim()) : [];
  const steps = beats.filter(b => b.kind === "step").map(b => { const [letter = "", word = "", gloss = ""] = b.text.split("|"); return { letter, word, gloss, at: local(b) }; });
  const sectionOf = (frame: number) => sectionStarts.reduce((found, start, i) => start >= 0 && frame >= start ? i : found, 0);

  const chatBeats = beats.filter(b => ["examiner", "candidate", "silence", "label"].includes(b.kind));
  const chatHtml = chatBeats.map((beat, i) => {
    if (beat.kind === "label") return `<article class="label" data-i="${i}"><span>${text(`label-${i}`, beat.text, fonts.heavy, 30, primary)}</span></article>`;
    const side = beat.kind === "examiner" ? "left" : "right";
    const who = text(`who-${i}`, beat.kind === "examiner" ? "Giám khảo" : "Bạn", fonts.heavy, 24, ink2);
    const chip = beat.step ? `<b class="chip">${text(`chip-${i}`, beat.step, fonts.serif, 30, "#fff")}</b>` : "";
    const body = beat.kind === "silence"
      ? `<div class="bubble silence"><div class="dots"><i></i><i></i><i></i></div></div><div class="note">${text(`note-${i}`, beat.text, fonts.font, 28, ink2)}</div>`
      : `<div class="bubble">${chip}${text(`msg-${i}`, beat.text, fonts.heavy, 42, beat.kind === "examiner" ? "#fff" : ink)}</div>`;
    return `<article class="${side} ${beat.kind}" data-i="${i}"><div class="who">${who}</div>${body}</article>`;
  }).join("");

  const teachBeats = beats.filter(b => b.kind === "teach");
  const teachHtml = teachBeats.map((beat, i) => `<div class="caption" data-i="${i}">${marked(`teach-${i}`, beat.text, 76)}</div>`).join("");
  const stackHtml = letters.map((letter, i) => {
    const step = steps.find(s => s.letter === letter);
    return `<div class="row" data-i="${i}"><b class="letter">${text(`letter-${i}`, letter, fonts.serif, 64, "#fff")}</b>
      <div class="words"><div class="word">${text(`word-${i}`, step?.word ?? "", fonts.heavy, 52, ink)}</div>
      <div class="gloss">${text(`gloss-${i}`, step?.gloss ?? "", fonts.font, 32, ink2)}</div></div></div>`;
  }).join("");
  const hookBeat = beats.find(b => b.kind === "hook");
  const [hookKicker = "", hookHead = ""] = hookBeat ? hookBeat.text.split("|") : [];
  const hookHtml = hookBeat ? `<div class="kicker">${text("hook-kicker", hookKicker, fonts.heavy, 34, primary)}</div>
    <div class="headline">${marked("hook-head", hookHead, 104)}</div>
    <div class="tiles">${letters.map((letter, i) => `<b class="tile">${text(`hook-letter-${i}`, letter, fonts.serif, 88, "#fff")}</b>`).join("")}</div>` : "";
  const ctaBeat = beats.find(b => b.kind === "cta");
  const [ctaHead = "", ctaSub = "", ctaUrl = ""] = ctaBeat ? ctaBeat.text.split("|") : [];
  const ctaHtml = ctaBeat ? `${logo("logo big", "#fff", softBlue)}
    <div class="cta-brand">${text("cta-brand", "UpWind", fonts.serif, 120, "#fff")}<span class="cta-ielts">${text("cta-ielts", "IELTS", fonts.heavy, 40, primary)}</span></div>
    <div class="cta-head">${text("cta-head", ctaHead, fonts.heavy, 64, "#fff", [{ name: "text-align", value: "center" }])}</div>
    <div class="cta-sub">${text("cta-sub", ctaSub, fonts.font, 40, softBlue, [{ name: "text-align", value: "center" }])}</div>
    <div class="cta-url">${text("cta-url", ctaUrl, fonts.heavy, 44, primary)}</div>` : "";

  const program = htmlVisual({
    html: `<div class="bg"><div class="blob a"></div><div class="blob b"></div>
      <svg class="wind" viewBox="0 0 1080 1920" preserveAspectRatio="none"><path d="M-40 520 C 260 440, 520 600, 1120 470"/><path d="M-40 1580 C 300 1500, 640 1680, 1120 1540"/><path d="M-40 1640 C 340 1580, 700 1720, 1120 1610"/></svg></div>
      <header>${logo("logo", primary, waveBlue)}${text("brand", "UpWind", fonts.serif, 54, primary)}
        <span class="tag">${text("tag", options.tag, fonts.heavy, 26, primary)}</span></header>
      <section class="stack">${stackHtml}</section>
      <section class="chat"><div class="viewport"><div class="list">${chatHtml}</div></div></section>
      <section class="teach">${teachHtml}</section>
      <section class="hook">${hookHtml}</section>
      <section class="cta">${ctaHtml}</section>`,
    css: `:scope{background:#fff;overflow:hidden}
      .bg,.bg svg{position:absolute;inset:0;width:100%;height:100%}
      .blob{position:absolute;border-radius:50%;filter:blur(10px)}
      .blob.a{width:760px;height:760px;right:-300px;top:-260px;background:radial-gradient(circle,${highlight},transparent 70%)}
      .blob.b{width:900px;height:900px;left:-420px;bottom:-380px;background:radial-gradient(circle,${primaryLight},transparent 70%)}
      .wind path{fill:none;stroke:${border};stroke-width:6;stroke-linecap:round}
      header{position:absolute;left:64px;right:150px;top:150px;display:flex;align-items:center;gap:18px}
      .logo{width:72px;height:72px;flex:none}.logo.big{width:220px;height:220px}
      .tag{margin-left:auto;padding:10px 22px;border-radius:999px;background:${primaryLight};border:2px solid ${border}}
      .stack{position:absolute;left:64px;right:120px;top:270px;padding:22px 26px;border-radius:36px;background:#fff;
        border:2px solid ${border};box-shadow:0 18px 50px -24px oklch(0.42 0.15 253 / .35);display:flex;flex-direction:column;gap:10px}
      .row{display:flex;align-items:center;gap:26px;padding:12px 16px;border-radius:24px}
      .row.active{background:${primaryLight};box-shadow:inset 0 0 0 2px ${softBlue}}
      .letter{flex:none;width:96px;height:96px;border-radius:28px;background:${softBlue};display:flex;align-items:center;justify-content:center}
      .row.filled .letter{background:${primary}}.row.active .letter{background:${accent}}
      .words{display:flex;flex-direction:column;gap:4px}
      .chat{position:absolute;left:56px;right:120px;top:270px;bottom:420px}
      .viewport{position:absolute;inset:0;overflow:hidden;-webkit-mask-image:linear-gradient(transparent 0,#000 48px);mask-image:linear-gradient(transparent 0,#000 48px)}.list{position:relative}
      article{margin:0 0 34px;max-width:86%}article.right{margin-left:auto}
      .who{margin:0 14px 10px}.right .who{text-align:right}
      .bubble{position:relative;padding:28px 34px;border-radius:38px 38px 38px 10px;background:${ink};box-shadow:0 10px 0 oklch(0.24 0.02 260 / .12)}
      .right .bubble{background:${primaryLight};border:2px solid ${border};border-radius:38px 38px 10px 38px}
      .right .bubble.on{border-color:${accent};box-shadow:0 0 0 6px ${highlight}}
      .chip{position:absolute;left:-26px;top:-26px;width:60px;height:60px;border-radius:20px;background:${accent};display:flex;align-items:center;justify-content:center}
      .silence{display:inline-block;margin-left:auto}.right .silence{float:right}
      .dots{display:flex;gap:14px;padding:6px 6px}.dots i{width:18px;height:18px;border-radius:50%;background:${accent}}
      .note{clear:both;text-align:right;padding:14px 12px 0;opacity:0}
      article.label{max-width:100%;text-align:center}
      article.label span{display:inline-block;padding:14px 30px;border-radius:999px;background:#fff;border:2px dashed ${softBlue}}
      .teach{position:absolute;left:64px;right:130px;top:700px;height:720px}
      .caption{position:absolute;inset:0;display:flex;flex-wrap:wrap;align-content:center;column-gap:18px;row-gap:10px}
      .caption .key{padding:0 14px;border-radius:16px;background:linear-gradient(transparent 55%,${highlight} 55%)}
      .hook{position:absolute;left:64px;right:130px;top:290px;bottom:430px;display:flex;flex-direction:column;justify-content:center;gap:44px;background:#fff0}
      .hook .kicker{align-self:flex-start;padding:12px 28px;border-radius:999px;background:${primaryLight};border:2px solid ${border}}
      .hook .headline{display:flex;flex-wrap:wrap;column-gap:22px;row-gap:12px}
      .hook .key{padding:0 14px;border-radius:18px;background:linear-gradient(transparent 52%,${highlight} 52%)}
      .tiles{display:flex;gap:26px}.tile{width:150px;height:150px;border-radius:40px;background:${primary};display:flex;align-items:center;justify-content:center;
        box-shadow:0 18px 40px -18px oklch(0.42 0.15 253 / .6)}.tile:nth-child(2){background:${accent}}.tile:nth-child(3){background:${softBlue}}
      .cta{position:absolute;inset:0;background:${primary};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;padding:0 90px 180px;opacity:0}
      .cta-brand{display:flex;align-items:center;gap:20px}.cta-ielts{padding:8px 20px;border-radius:999px;background:#fff}
      .cta-url{padding:18px 44px;border-radius:999px;background:#fff;margin-top:20px}`,
    data: { sectionStarts, chat: chatBeats.map(b => ({ at: local(b), section: sectionOf(local(b)), step: b.step })),
      teach: teachBeats.map(local), stackAt: stackBeat ? local(stackBeat) : -1, letters, steps: steps.map(s => ({ letter: s.letter, at: s.at })),
      hookAt: hookBeat ? local(hookBeat) : -1, ctaAt: ctaBeat ? local(ctaBeat) : -1, fps: timeline.frameRate.numerator / timeline.frameRate.denominator },
    setup: `const q=s=>root.querySelector(s), qa=s=>[...root.querySelectorAll(s)];
      const cards=qa('article'), list=q('.list'), viewport=q('.viewport'), chat=q('.chat'), stack=q('.stack'), rows=qa('.row'),
        captions=qa('.caption'), teach=q('.teach'), hook=q('.hook'), tiles=qa('.tile'), cta=q('.cta'), F=data.fps;
      const ease=t=>{t=Math.max(0,Math.min(1,t));return 1-Math.pow(1-t,4)};
      const rise=(el,age,len)=>{const p=ease(age/len);el.style.opacity=String(p);el.style.transform='translateY('+(22*(1-p))+'px)';};
      const section=f=>data.sectionStarts.reduce((s,start,i)=>start>=0&&f>=start?i:s,0);
      return frame=>{
        const sec=section(frame), secAge=frame-(data.sectionStarts[sec]??0), enter=Math.round(F*.6);
        // Chat: only the current section's messages; scroll so the newest stays in view.
        let last=-1;
        cards.forEach((card,i)=>{const c=data.chat[i], age=frame-c.at, show=c.section===sec&&age>=0;
          card.style.display=show?'block':'none'; if(!show)return; last=i; rise(card,age,enter);
          const note=card.querySelector('.note'); if(note)note.style.opacity=String(ease((age-F*1.6)/enter));
          card.querySelectorAll('.dots i').forEach((d,k)=>d.style.transform='translateY('+(-10*Math.max(0,Math.sin(frame*.25-k*.9)))+'px)');});
        const chatTop=sec===2?740:290; chat.style.top=chatTop+'px';
        chat.style.opacity=String(sec===0||sec===2?ease(secAge/enter):0);
        const bottom=last<0?0:cards[last].offsetTop+cards[last].offsetHeight;
        let prevLast=-1; cards.forEach((card,i)=>{const c=data.chat[i]; if(i<last&&c.section===sec&&frame>=c.at)prevLast=i;});
        const prevBottom=prevLast<0?0:cards[prevLast].offsetTop+cards[prevLast].offsetHeight;
        const st=last<0?1:ease((frame-data.chat[last].at)/enter);
        const before=Math.max(0,prevBottom-viewport.clientHeight), after=Math.max(0,bottom-viewport.clientHeight);
        list.style.transform='translateY('+(-(before+(after-before)*st))+'px)';
        // Acronym stack: appears in teach, persists through redo; active row follows the newest step.
        const stackOn=data.stackAt>=0&&frame>=data.stackAt&&sec<3;
        stack.style.display=stackOn?'flex':'none';
        if(stackOn){rise(stack,frame-data.stackAt,enter);
          let active=-1;
          if(sec===1){data.steps.forEach(s=>{if(frame>=s.at)active=data.letters.indexOf(s.letter);});}
          else data.chat.forEach(c=>{if(c.section===sec&&c.step&&frame>=c.at)active=data.letters.indexOf(c.step);});
          rows.forEach((row,i)=>{const s=data.steps.find(s=>s.letter===data.letters[i]), filled=s&&frame>=s.at;
            row.classList.toggle('filled',!!filled); row.classList.toggle('active',i===active);
            const words=row.querySelector('.words'); words.style.opacity=filled?String(ease((frame-s.at)/enter)):'0';
            words.style.transform='translateX('+(filled?18*(1-ease((frame-s.at)/enter)):18)+'px)';});
          cards.forEach((card,i)=>{const b=card.querySelector('.bubble'); if(b)b.classList.toggle('on',sec===2&&data.chat[i].step===data.letters[active]);});
        }
        // Teaching captions: the newest replaces the previous; sits lower once the stack is up.
        teach.style.display=sec===1?'block':'none';
        teach.style.top=(stackOn?720:560)+'px';
        let cur=-1; data.teach.forEach((at,i)=>{if(frame>=at)cur=i;});
        captions.forEach((cap,i)=>{if(i!==cur){cap.style.opacity='0';return;} rise(cap,frame-data.teach[i],enter);});
        // Hook: fully readable on the very first frame, tiles pop in, then it lifts away as the skit starts.
        if(data.hookAt>=0){const end=data.sectionStarts[0], out=Math.round(F*.35), age=frame-data.hookAt;
          const on=frame>=data.hookAt&&frame<end; hook.style.display=on?'flex':'none';
          if(on){const p=data.hookAt===0?1:ease(age/enter), x=ease((frame-(end-out))/out);
            hook.style.opacity=String(p*(1-x)); hook.style.transform='translateY('+(-40*x)+'px)';
            tiles.forEach((t,i)=>{const q=ease((age-F*(.25+.18*i))/Math.round(F*.3)); t.style.opacity=String(q); t.style.transform='scale('+(0.6+0.4*q)+')';});}
        } else hook.style.display='none';
        // CTA card.
        if(data.ctaAt>=0){const p=ease((frame-data.ctaAt)/enter); cta.style.opacity=String(p); cta.style.transform='scale('+(0.96+0.04*p)+')';}
      };`,
  });
  return sealVisualTrack({ id: options.id, timelineId: timeline.id, visualIr: "hypit.visual-ir@1",
    presents: [{ id: options.id, order: 0, z: 0, span: window.span,
      elements: [{ id: "lesson", kind: "program", order: 0, program,
        style: [{ name: "position", value: "absolute" }, { name: "left", value: `${within.xPx}px` }, { name: "top", value: `${within.yPx}px` },
          { name: "width", value: `${within.widthPx}px` }, { name: "height", value: `${within.heightPx}px` }] }, ...elements] }] });
}
