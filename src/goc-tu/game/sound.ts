// Tiny game sounds made with Web Audio (no files) + a light vibration on phones. One switch turns both off.
const KEY = "upwind-goc-tu-sound";
let ctx: AudioContext | null = null;

export const soundOn = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};
export const setSound = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
};

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx ??= new AC();
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** The piece clicks into place. */
export function click() {
  if (!soundOn()) return;
  tone(880, 0.07, "triangle", 0.18);
  tone(1320, 0.09, "triangle", 0.12, 0.05);
  navigator.vibrate?.(12);
}
/** The piece bounces out. */
export function thud() {
  if (!soundOn()) return;
  tone(150, 0.16, "sine", 0.25);
  navigator.vibrate?.([30, 40, 30]);
}
