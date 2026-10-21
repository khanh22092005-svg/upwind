import { sealVisualTrack } from "@hypit/composition";
import type { VisualElement } from "@hypit/composition";
import { htmlVisual } from "@hypit/html-program";
import type { FontStackRef } from "@hypit/media";
import type { Timeline } from "@hypit/timeline";
import type { SpatialFrame } from "@hypit/spatial";
import { assertTemporalWindowFor } from "@hypit/temporal";
import type { TemporalInstant, TemporalWindow } from "@hypit/temporal";
import { PHU } from "./phu.js";
import type { PhuPose } from "./phu.js";

export const BEAT_KINDS = ["section", "examiner", "candidate", "silence", "label", "teach", "stack", "step", "cta", "hook",
  "phu", "pen", "note", "ticks"] as const;
export type BeatKind = typeof BEAT_KINDS[number];
export type Beat = { id: string; kind: BeatKind; text: string; step: string; at: TemporalInstant };
export type LessonOptions = { id: string; tag: string };
export type LessonFonts = { font: FontStackRef; heavy: FontStackRef; serif: FontStackRef; hand: FontStackRef };

// UpWind design system tokens (PPTX-safe hex set from tokens/colors.css).
const deep = "#004b9b", mid = "#1a89c5", sky = "#e4f5ff", pale = "#cbeafb", light = "#9ddbf8", wave = "#6ac5e8",
  ink = "#1a2029", body = "#3c434d", muted = "#4f5661", line = "#d2e1ea", marker = "oklch(0.86 0.075 228)",
  pen = "#d9412b", sunSoft = "#fbf3d2", sunInk = "#6b5414", squiggle = "oklch(0.78 0.10 225)";
const sections = ["skit", "teach", "redo", "cta"];
const logo = (cls: string, color: string, waveColor: string) => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill="none" stroke="${color}" stroke-width="3"/><path d="M50 24 L50 60 L24 60 Z" fill="${color}"/>
  <line x1="50" y1="20" x2="50" y2="70" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  <path d="M28 70 Q50 78 72 70" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  <path d="M24 78 Q50 86 76 78" fill="none" stroke="${waveColor}" stroke-width="4" stroke-linecap="round"/></svg>`;
// Hand-drawn marks: brand squiggle underline, red-pen ring and tick (drawn on via stroke-dashoffset).
const squiggleSvg = `<svg class="squig" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9 Q 60 2 100 7 T 198 5" pathLength="1"/></svg>`;
const ringSvg = `<svg class="ring" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M14 58 C 6 22, 120 4, 186 30 C 210 48, 176 92, 96 94 C 30 96, 4 72, 22 40 C 34 22, 70 14, 98 12" pathLength="1"/></svg>`;
const tickSvg = `<svg class="tick" viewBox="0 0 60 50" aria-hidden="true"><path d="M6 28 C 12 32, 18 40, 22 45 C 30 30, 42 14, 56 4" pathLength="1"/></svg>`;

// Where Phu flies in each part: the body centre lands on (x, y) at scale k. Wind always points at the content.
const PHU_SLOTS: Record<string, { x: number; y: number; k: number }> = {
  hook: { x: 240, y: 1335, k: 1.25 }, peek: { x: 230, y: 1300, k: 0.95 }, teach: { x: 210, y: 1400, k: 1 },
  redo: { x: 210, y: 1400, k: 1 }, cta: { x: 540, y: 560, k: 1.5 },
};
// Cloud-body centre of each pose in its own viewBox coordinates, so poses swap in place.
const PHU_CENTRE: Record<PhuPose, [number, number]> = { squeeze: [155, 157], focus: [146, 157], wave: [171, 163], idle: [149, 163] };

/** Skit, teaching captions, the A.R.E stack, Phu and the CTA share one scene so sections hand off together. */
export function renderLesson(timeline: Timeline, within: SpatialFrame, window: TemporalWindow,
  fonts: LessonFonts, beats: readonly Beat[], options: LessonOptions) {
  assertTemporalWindowFor(window, { subjectId: options.id, timeline });
  if (beats.some(beat => beat.at.frame < window.span.startFrame || beat.at.frame >= window.span.endFrameExclusive)) throw new Error("Lesson beats must appear inside the scene's window.");
  const local = (beat: Beat) => beat.at.frame - window.span.startFrame;
  let order = 0;
  const elements: VisualElement[] = [];
  const text = (id: string, value: string, face: FontStackRef, size: number, color: string, extra: { name: string; value: string | number }[] = []) => {
    elements.push({ id, kind: "text", parent: "lesson", order: ++order, text: value, fonts: face.faces,
      style: [{ name: "font-size", value: `${size}px` }, { name: "line-height", value: 1.22 }, { name: "color", value: color }, ...extra] });
    return `{{${id}}}`;
  };
  // Text marked *like this* is the keyword: marker highlight, or the one squiggle a headline may carry.
  const marked = (id: string, value: string, size: number, face: FontStackRef, keyClass = "key") => value.split("*").flatMap((part, index) => index % 2
    ? [`<span class="${keyClass}">${text(`${id}-${index}`, part.trim(), face, size, deep)}${keyClass === "squiggled" ? squiggleSvg : ""}</span>`]
    : part.trim().split(/\s+/).filter(Boolean).map((word, w) => `<span class="seg">${text(`${id}-${index}-${w}`, word, face, size, ink)}</span>`)).join("");

  const sectionStarts = sections.map(name => { const beat = beats.find(b => b.kind === "section" && b.text === name); return beat ? local(beat) : -1; });
  const stackBeat = beats.find(b => b.kind === "stack");
  const letters = stackBeat ? stackBeat.text.split(",").map(l => l.trim()) : [];
  const steps = beats.filter(b => b.kind === "step").map(b => { const [letter = "", word = "", gloss = ""] = b.text.split("|"); return { letter, word, gloss, at: local(b) }; });
  const sectionOf = (frame: number) => sectionStarts.reduce((found, start, i) => start >= 0 && frame >= start ? i : found, 0);

  const pens = beats.filter(b => b.kind === "pen");
  const chatBeats = beats.filter(b => ["examiner", "candidate", "silence", "label"].includes(b.kind));
  const chatHtml = chatBeats.map((beat, i) => {
    if (beat.kind === "label") return `<article class="label" data-i="${i}"><span>${text(`label-${i}`, beat.text, fonts.heavy, 30, deep)}</span></article>`;
    const side = beat.kind === "examiner" ? "left" : "right";
    const who = text(`who-${i}`, beat.kind === "examiner" ? "Giám khảo" : "Bạn", fonts.heavy, 24, muted);
    const chip = beat.step ? `<b class="chip">${text(`chip-${i}`, beat.step, fonts.serif, 30, "#fff")}</b>` : "";
    const pen = pens.find(p => p.step === beat.id);
    const penHtml = pen ? `${ringSvg}<div class="pen-note">${text(`pen-${i}`, pen.text, fonts.hand, 58, "#d9412b")}</div>` : "";
    const content = beat.kind === "silence"
      ? `<div class="bubble silence"><div class="dots"><i></i><i></i><i></i></div></div><div class="note">${text(`note-${i}`, beat.text, fonts.font, 28, muted)}</div>`
      : `<div class="bubble">${chip}${text(`msg-${i}`, beat.text, fonts.heavy, 42, beat.kind === "examiner" ? "#fff" : ink)}${penHtml}</div>`;
    return `<article class="${side} ${beat.kind}" data-i="${i}"><div class="who">${who}</div>${content}</article>`;
  }).join("");

  const teachBeats = beats.filter(b => b.kind === "teach");
  const noteBeat = beats.find(b => b.kind === "note");
  const [noteHead = "", noteBody = ""] = noteBeat ? noteBeat.text.split("|") : [];
  const teachHtml = teachBeats.map((beat, i) => `<div class="caption" data-i="${i}">${marked(`teach-${i}`, beat.text, 72, fonts.serif)}</div>`).join("")
    + (noteBeat ? `<div class="sticky"><i class="tape"></i>${text("sticky-head", noteHead, fonts.hand, 46, sunInk)}${text("sticky-body", noteBody, fonts.hand, 84, ink)}</div>` : "");
  const stackHtml = letters.map((letter, i) => {
    const step = steps.find(s => s.letter === letter);
    return `<div class="row" data-i="${i}"><b class="letter">${text(`letter-${i}`, letter, fonts.serif, 62, "#fff")}</b>
      <div class="words"><div class="word">${text(`word-${i}`, step?.word ?? "", fonts.heavy, 50, ink)}</div>
      <div class="gloss">${text(`gloss-${i}`, step?.gloss ?? "", fonts.font, 32, body)}</div></div>${tickSvg}</div>`;
  }).join("");
  const ticksBeat = beats.find(b => b.kind === "ticks");
  const hookBeat = beats.find(b => b.kind === "hook");
  const [hookKicker = "", hookHead = ""] = hookBeat ? hookBeat.text.split("|") : [];
  const hookHtml = hookBeat ? `<div class="kicker"><svg class="glyph" viewBox="0 0 30 10" aria-hidden="true"><path d="M1 6 Q 8 1 15 5 T 29 4"/></svg>${text("hook-kicker", hookKicker.toLocaleUpperCase("vi"), fonts.heavy, 30, deep, [{ name: "letter-spacing", value: "0.08em" }])}</div>
    <div class="headline">${marked("hook-head", hookHead, 96, fonts.serif, "squiggled")}</div>
    <div class="tiles">${letters.map((letter, i) => `<div class="tilerow"><b class="tile">${text(`hook-letter-${i}`, letter, fonts.serif, 64, "#fff")}</b>
      ${text(`hook-word-${i}`, steps.find(s => s.letter === letter)?.word ?? "", fonts.heavy, 58, ink)}</div>`).join("")}</div>` : "";
  const ctaBeat = beats.find(b => b.kind === "cta");
  const [ctaHead = "", ctaSub = "", ctaUrl = ""] = ctaBeat ? ctaBeat.text.split("|") : [];
  const ctaHtml = ctaBeat ? `<div class="cta-brand">${logo("logo mid", deep, squiggle)}${text("cta-brand", "UpWind", fonts.serif, 92, deep)}</div>
    <div class="cta-head">${text("cta-head", ctaHead, fonts.serif, 66, ink, [{ name: "text-align", value: "center" }])}</div>
    <div class="cta-sub">${text("cta-sub", ctaSub, fonts.font, 36, body, [{ name: "text-align", value: "center" }])}</div>
    <div class="cta-url">${text("cta-url", ctaUrl, fonts.heavy, 44, "#fff")}</div>` : "";

  const phuBeats = beats.filter(b => b.kind === "phu").map(b => {
    const [pose = "off", slot = "off"] = b.text.split("@");
    const place = PHU_SLOTS[slot];
    if (pose !== "off" && (!(pose in PHU) || !place)) throw new Error(`Phu beat "${b.text}" needs pose@slot with a known pose and slot.`);
    return { at: local(b), pose, slot, ...(place ?? { x: 0, y: 0, k: 1 }) };
  });
  const poses = Object.keys(PHU) as PhuPose[];
  const phuHtml = `<div class="phu">${poses.map(pose => `<div class="pose" data-pose="${pose}">${PHU[pose].svg}</div>`).join("")}</div>`;

  const program = htmlVisual({
    html: `<div class="bg"><svg class="waves" viewBox="0 0 1080 1920" preserveAspectRatio="none">
        <path class="w1" d="M-200 470 C 100 410, 380 540, 700 470 S 1180 420, 1400 470"/>
        <path class="w2" d="M-200 1640 C 120 1580, 420 1700, 720 1640 S 1200 1590, 1400 1640"/>
        <path class="w3" d="M-200 1712 C 140 1660, 460 1772, 760 1712 S 1220 1668, 1400 1712"/></svg></div>
      <header>${logo("logo", deep, squiggle)}${text("brand", "UpWind", fonts.serif, 54, deep)}
        <span class="tag">${text("tag", options.tag, fonts.heavy, 26, deep)}</span></header>
      <section class="stack">${stackHtml}</section>
      <section class="chat"><div class="viewport"><div class="list">${chatHtml}</div></div></section>
      <section class="teach">${teachHtml}</section>
      <section class="hook">${hookHtml}</section>
      <div class="ticknote">${ticksBeat ? text("ticknote", ticksBeat.text, fonts.hand, 60, pen) : ""}</div>
      <section class="cta"><svg class="cta-waves" viewBox="0 0 1080 300" preserveAspectRatio="none"><path d="M-40 120 C 240 60, 520 180, 820 110 S 1100 80, 1140 110 L 1140 300 L -40 300 Z"/><path class="front" d="M-40 190 C 260 140, 560 250, 860 180 S 1100 160, 1140 180 L 1140 300 L -40 300 Z"/></svg>${ctaHtml}</section>
      ${phuHtml}`,
    css: `:scope{background:#fff;overflow:hidden}
      .bg,.bg svg{position:absolute;inset:0;width:100%;height:100%}
      .waves path{fill:none;stroke:${line};stroke-width:5;stroke-linecap:round}
      header{position:absolute;left:64px;right:150px;top:150px;display:flex;align-items:center;gap:18px;z-index:2}
      .logo{width:72px;height:72px;flex:none}.logo.mid{width:120px;height:120px}
      .tag{margin-left:auto;padding:10px 22px;border-radius:999px;background:${sky};border:2px solid ${line}}
      .stack{position:absolute;left:64px;right:120px;top:270px;padding:20px 24px;border-radius:28px;background:#fff;border:2px solid ${line};display:flex;flex-direction:column;gap:8px}
      .row{position:relative;display:flex;align-items:center;gap:26px;padding:12px 16px;border-radius:20px}
      .row.active{background:${sky}}
      .letter{flex:none;width:96px;height:96px;border-radius:24px;background:${pale};display:flex;align-items:center;justify-content:center}
      .row.filled .letter{background:${deep}}.row.active .letter{background:${mid}}
      .words{display:flex;flex-direction:column;gap:2px}
      .tick{position:absolute;right:26px;top:50%;width:84px;height:70px;margin-top:-35px;overflow:visible}
      .tick path,.ring path{fill:none;stroke:${pen};stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;vector-effect:non-scaling-stroke}
      .chat{position:absolute;left:56px;right:120px;top:290px;bottom:560px}
      .viewport{position:absolute;inset:0;overflow:visible}.list{position:relative}
      article{position:relative;margin:0 0 34px;max-width:86%;width:fit-content}article.right{margin-left:auto}
      .who{margin:0 14px 10px}.right .who{text-align:right}
      .bubble{position:relative;padding:26px 34px;border-radius:36px 36px 36px 10px;background:${ink}}
      .right .bubble{background:${sky};border:2px solid ${line};border-radius:36px 36px 10px 36px}
      .right .bubble.on{border-color:${mid};background:#fff}
      .chip{position:absolute;left:-26px;top:-26px;width:60px;height:60px;border-radius:18px;background:${mid};display:flex;align-items:center;justify-content:center}
      .ring{position:absolute;left:-34px;right:-34px;top:-30px;bottom:-30px;width:calc(100% + 68px);height:calc(100% + 60px);overflow:visible}
      .pen-note{position:absolute;right:calc(100% + 54px);top:-6px;white-space:nowrap;transform:rotate(-7deg);transform-origin:right center}
      .silence{display:inline-block}.right .silence{float:right}
      .dots{display:flex;gap:14px;padding:6px}.dots i{width:18px;height:18px;border-radius:50%;background:${mid}}
      .note{clear:both;text-align:right;padding:14px 12px 0;opacity:0}
      article.label{max-width:100%;width:auto;text-align:center}
      article.label span{display:inline-block;padding:14px 30px;border-radius:999px;background:${sky};border:2px solid ${line}}
      .teach{position:absolute;left:64px;right:130px;top:720px;height:560px}
      .caption{position:absolute;inset:0;display:flex;flex-wrap:wrap;align-content:center;column-gap:18px;row-gap:8px}
      .key{padding:0 12px;border-radius:5px;background:linear-gradient(transparent 52%,${marker} 52%)}
      .sticky{position:absolute;left:40px;right:60px;top:90px;padding:58px 48px 46px;background:${sunSoft};border-radius:6px;transform:rotate(-2deg);display:flex;flex-direction:column;gap:12px;opacity:0}
      .tape{position:absolute;left:50%;top:-22px;width:180px;height:46px;margin-left:-90px;background:oklch(0.97 0.02 230 / 0.82);transform:rotate(3deg)}
      .hook{position:absolute;left:64px;right:130px;top:270px;height:870px;display:flex;flex-direction:column;justify-content:flex-start;gap:30px;padding-top:40px}
      .kicker{display:flex;align-items:center;gap:14px}.glyph{width:44px;height:16px}.glyph path{fill:none;stroke:${squiggle};stroke-width:3;stroke-linecap:round}
      .headline{display:flex;flex-wrap:wrap;column-gap:20px;row-gap:4px}
      .squiggled{position:relative}.squig{position:absolute;left:0;right:0;bottom:-6px;width:100%;height:26px;overflow:visible}
      .squig path{fill:none;stroke:${squiggle};stroke-width:7;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;vector-effect:non-scaling-stroke}
      .tiles{display:flex;flex-direction:column;gap:18px;margin-top:22px}.tilerow{display:flex;align-items:center;gap:28px}
      .tile{width:108px;height:108px;border-radius:26px;background:${deep};display:flex;align-items:center;justify-content:center}
      .tilerow:nth-child(2) .tile{background:${mid}}.tilerow:nth-child(3) .tile{background:${light}}
      .ticknote{position:absolute;left:430px;top:1376px;transform:rotate(-5deg);transform-origin:left center;opacity:0;z-index:3}
      .cta{position:absolute;inset:0;background:${sky};display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:30px;padding:820px 90px 0;opacity:0;z-index:4}
      .cta-waves{position:absolute;left:0;right:0;bottom:0;width:100%;height:300px}.cta-waves path{fill:${pale}}.cta-waves path.front{fill:${light};opacity:.55}
      .cta-brand{display:flex;align-items:center;gap:22px}
      .cta-url{padding:20px 52px;border-radius:999px;background:${deep};margin-top:18px}
      .phu{position:absolute;inset:0;pointer-events:none;z-index:5}
      .pose{position:absolute;opacity:0;transform-origin:50% 50%}.pose svg{display:block;width:100%;height:100%}`,
    data: { sectionStarts, chat: chatBeats.map(b => ({ at: local(b), section: sectionOf(local(b)), step: b.step,
        pen: pens.find(p => p.step === b.id) ? local(pens.find(p => p.step === b.id)!) : -1 })),
      teach: teachBeats.map(local), noteAt: noteBeat ? local(noteBeat) : -1, ticksAt: ticksBeat ? local(ticksBeat) : -1,
      stackAt: stackBeat ? local(stackBeat) : -1, letters, steps: steps.map(s => ({ letter: s.letter, at: s.at })),
      hookAt: hookBeat ? local(hookBeat) : -1, ctaAt: ctaBeat ? local(ctaBeat) : -1, fps: timeline.frameRate.numerator / timeline.frameRate.denominator,
      phu: phuBeats, poses: Object.fromEntries(poses.map(p => [p, { vb: PHU[p].viewBox, c: PHU_CENTRE[p] }])) },
    setup: `const q=s=>root.querySelector(s), qa=s=>[...root.querySelectorAll(s)];
      const cards=qa('article'), list=q('.list'), viewport=q('.viewport'), chat=q('.chat'), stack=q('.stack'), rows=qa('.row'),
        captions=qa('.caption'), teach=q('.teach'), sticky=q('.sticky'), hook=q('.hook'), tiles=qa('.tilerow'), squig=q('.squig path'),
        cta=q('.cta'), ticknote=q('.ticknote'), waves=qa('.waves path'), poseEls=qa('.pose'), F=data.fps;
      const clamp=t=>Math.max(0,Math.min(1,t)), ease=t=>1-Math.pow(1-clamp(t),4), easeIO=t=>{t=clamp(t);return t<.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2;};
      const rise=(el,age,len)=>{const p=ease(age/len);el.style.opacity=String(p);el.style.transform='translateY('+(22*(1-p))+'px)';};
      const draw=(path,age,len)=>{if(!path)return;path.style.strokeDashoffset=String(1-ease(age/len));path.ownerSVGElement.style.opacity=age>0?'1':'0';};
      const section=f=>data.sectionStarts.reduce((s,start,i)=>start>=0&&f>=start?i:s,0);
      const phuAt=f=>{let cur=-1;data.phu.forEach((b,i)=>{if(f>=b.at)cur=i;});return cur;};
      return frame=>{
        const sec=section(frame), secAge=frame-(data.sectionStarts[sec]??0), enter=Math.round(F*.6), t=frame/F;
        waves.forEach((w,i)=>w.style.transform='translateX('+(Math.sin(t*2*Math.PI/(i%2?34:26))*60*(i%2?-1:1))+'px)');
        // Chat: only the current section's messages; scroll so the newest stays in view.
        let last=-1;
        cards.forEach((card,i)=>{const c=data.chat[i], age=frame-c.at, show=c.section===sec&&age>=0;
          card.style.display=show?'block':'none'; if(!show)return; last=i; rise(card,age,enter);
          const note=card.querySelector('.note'); if(note)note.style.opacity=String(ease((age-F*1.6)/enter));
          card.querySelectorAll('.dots i').forEach((d,k)=>d.style.transform='translateY('+(-10*Math.max(0,Math.sin(frame*.25-k*.9)))+'px)');
          const ring=card.querySelector('.ring path'), penNote=card.querySelector('.pen-note');
          if(ring){const pa=frame-c.pen; draw(ring,c.pen<0||pa<0?-1:pa,Math.round(F*.5));
            penNote.style.opacity=String(c.pen<0?0:ease((pa-F*.35)/Math.round(F*.3)));}});
        chat.style.top=(sec===2?740:290)+'px'; chat.style.bottom=(sec===2?620:560)+'px';
        viewport.style.overflow=sec===2?'hidden':'visible';
        viewport.style.webkitMaskImage=viewport.style.maskImage=sec===2?'linear-gradient(transparent 0,transparent 26px,#000 120px)':'none';
        chat.style.opacity=String(sec===0||sec===2?ease(secAge/enter):0);
        const bottom=last<0?0:cards[last].offsetTop+cards[last].offsetHeight;
        let prevLast=-1; cards.forEach((card,i)=>{const c=data.chat[i]; if(i<last&&c.section===sec&&frame>=c.at)prevLast=i;});
        const prevBottom=prevLast<0?0:cards[prevLast].offsetTop+cards[prevLast].offsetHeight;
        const st=last<0?1:ease((frame-data.chat[last].at)/enter);
        const before=Math.max(0,prevBottom-viewport.clientHeight), after=Math.max(0,bottom-viewport.clientHeight);
        list.style.transform='translateY('+(-(before+(after-before)*st))+'px)';
        // Acronym stack: appears in teach, persists through redo; active row follows the newest step; red ticks at the end.
        const stackOn=data.stackAt>=0&&frame>=data.stackAt&&sec<3;
        stack.style.display=stackOn?'flex':'none';
        if(stackOn){rise(stack,frame-data.stackAt,enter);
          let active=-1;
          if(sec===1){data.steps.forEach(s=>{if(frame>=s.at)active=data.letters.indexOf(s.letter);});}
          else data.chat.forEach(c=>{if(c.section===sec&&c.step&&frame>=c.at)active=data.letters.indexOf(c.step);});
          const ticked=data.ticksAt>=0&&frame>=data.ticksAt;
          rows.forEach((row,i)=>{const s=data.steps.find(s=>s.letter===data.letters[i]), filled=s&&frame>=s.at;
            row.classList.toggle('filled',!!filled); row.classList.toggle('active',i===active&&!ticked);
            const words=row.querySelector('.words'); words.style.opacity=filled?String(ease((frame-s.at)/enter)):'0';
            words.style.transform='translateX('+(filled?18*(1-ease((frame-s.at)/enter)):18)+'px)';
            draw(row.querySelector('.tick path'),data.ticksAt<0?-1:frame-data.ticksAt-i*Math.round(F*.22),Math.round(F*.3));});
          cards.forEach((card,i)=>{const b=card.querySelector('.bubble'); if(b)b.classList.toggle('on',sec===2&&!ticked&&data.chat[i].step===data.letters[active]);});
        }
        ticknote.style.opacity=String(sec===2&&data.ticksAt>=0?ease((frame-data.ticksAt-F*.7)/Math.round(F*.3)):0);
        // Teaching captions: the newest replaces the previous; the sticky note takes over at the end.
        teach.style.display=sec===1?'block':'none';
        teach.style.top=(stackOn?720:560)+'px';
        let cur=-1; data.teach.forEach((at,i)=>{if(frame>=at)cur=i;});
        const noteOn=data.noteAt>=0&&frame>=data.noteAt;
        captions.forEach((cap,i)=>{if(i!==cur||noteOn){cap.style.opacity='0';return;} rise(cap,frame-data.teach[i],enter);});
        if(sticky){const a=frame-data.noteAt, p=noteOn?ease(a/enter):0; sticky.style.opacity=String(p);
          sticky.style.transform='rotate(-2deg) translateY('+(40*(1-p))+'px) scale('+(0.94+0.06*p)+')';}
        // Hook: readable on the very first frame; squiggle draws, tiles slide in, then it lifts away as the skit starts.
        if(data.hookAt>=0){const end=data.sectionStarts[0], out=Math.round(F*.35), age=frame-data.hookAt;
          const on=frame>=data.hookAt&&frame<end; hook.style.display=on?'flex':'none';
          if(on){const x=ease((frame-(end-out))/out);
            hook.style.opacity=String(1-x); hook.style.transform='translateY('+(-40*x)+'px)';
            draw(squig,age-F*.15,Math.round(F*.45));
            tiles.forEach((tl,i)=>{const p=ease((age-F*(.3+.16*i))/Math.round(F*.3)); tl.style.opacity=String(p); tl.style.transform='translateX('+(-30*(1-p))+'px)';});}
        } else hook.style.display='none';
        // CTA card.
        if(data.ctaAt>=0){const p=ease((frame-data.ctaAt)/enter); cta.style.opacity=String(p);}
        // Phu: one mascot, flies between slots, bobs (4s), puffs while blowing (2.4s), crossfades poses in place.
        const ci=phuAt(frame), cb=data.phu[ci], pb=data.phu[ci-1];
        const show=cb&&cb.pose!=='off', age=cb?frame-cb.at:0, fly=Math.round(F*.7), swap=Math.round(F*.22);
        let x=cb?cb.x:0, y=cb?cb.y:0, k=cb?cb.k:1, vis=0, cbPose=cb?cb.pose:'off';
        if(show){vis=1;
          if(pb&&pb.pose!=='off'&&(pb.slot==='cta')===(cb.slot==='cta')){const m=easeIO(age/fly); x=pb.x+(cb.x-pb.x)*m; y=pb.y+(cb.y-pb.y)*m; k=pb.k+(cb.k-pb.k)*m;}
          else if(pb&&pb.pose!=='off'){const out=Math.round(F*.2);
            if(age<out){vis=1-ease(age/out); x=pb.x; y=pb.y; k=pb.k; cbPose=pb.pose;}
            else {vis=ease((age-out)/Math.round(F*.45)); y+=50*(1-vis);}}
          else {vis=ease(age/Math.round(F*.45)); y+=50*(1-vis);}}
        else if(pb&&pb.pose!=='off'){vis=1-ease(age/Math.round(F*.3)); x=pb.x; y=pb.y-40*(1-vis); k=pb.k;}
        const bob=8*Math.sin(t*2*Math.PI/4);
        poseEls.forEach(el=>{const pose=el.dataset.pose, geo=data.poses[pose], vb=geo.vb;
          let o=0;
          if(show&&cbPose===pose)o=pb&&pb.pose!=='off'&&pb.pose!==pose&&cbPose===cb.pose?clamp(age/swap):1;
          else if(show&&pb&&pb.pose===pose&&pb.pose!==cbPose)o=1-clamp(age/swap);
          else if(!show&&pb&&pb.pose===pose)o=1;
          o*=vis; el.style.opacity=String(o); if(o<=0)return;
          const w=vb[2]*k, h=vb[3]*k, cx=(geo.c[0]-vb[0])*k, cy=(geo.c[1]-vb[1])*k;
          const blowing=pose==='squeeze'||pose==='focus', puff=blowing?1+0.025*Math.sin(t*2*Math.PI/2.4):1;
          const pop=show&&cb.pose===pose&&pb&&pb.pose!==pose?0.9+0.1*ease(age/swap):1;
          el.style.left=(x-cx)+'px'; el.style.top=(y-cy+bob)+'px'; el.style.width=w+'px'; el.style.height=h+'px';
          el.style.transformOrigin=cx+'px '+cy+'px'; el.style.transform='scale('+(puff*pop)+')';});
      };`,
  });
  return sealVisualTrack({ id: options.id, timelineId: timeline.id, visualIr: "hypit.visual-ir@1",
    presents: [{ id: options.id, order: 0, z: 0, span: window.span,
      elements: [{ id: "lesson", kind: "program", order: 0, program,
        style: [{ name: "position", value: "absolute" }, { name: "left", value: `${within.xPx}px` }, { name: "top", value: `${within.yPx}px` },
          { name: "width", value: `${within.widthPx}px` }, { name: "height", value: `${within.heightPx}px` }] }, ...elements] }] });
}
