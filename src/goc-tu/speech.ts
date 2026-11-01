// Pronunciation with the browser's own voices (Web Speech API). No files, no keys.
export const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

let voice: SpeechSynthesisVoice | null = null;
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang === "en-GB" && /natural|online|google/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;
}
if (canSpeak) {
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

export function speak(text: string, rate = 0.95) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? "en-GB";
  if (voice) u.voice = voice;
  u.rate = rate;
  speechSynthesis.speak(u);
}
