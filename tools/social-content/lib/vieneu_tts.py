"""Batch TTS with VieNeu-TTS (https://github.com/pnnbao97/VieNeu-TTS).

Called by make-video.mjs. Loads the model once, then renders every job:
    python3 lib/vieneu_tts.py jobs.json
jobs.json = {"voice": "Ngọc Huyền", "jobs": [{"text": "...", "out": "/abs/path.wav"}, ...]}

`python3 lib/vieneu_tts.py --check` exits 0 if vieneu can be imported (used for the gTTS fallback).
`python3 lib/vieneu_tts.py --voices` lists the built-in voices.
"""
import json
import re
import sys


_PIPE = None


def marked_phonemes(text: str) -> str:
    """'Thứ nhất, {{Because}} và {{so}}.' -> phonemes, each {{English}} part phonemized alone (forced English)."""
    global _PIPE
    if _PIPE is None:
        from sea_g2p import SEAPipeline

        _PIPE = SEAPipeline(lang="vi")
    out = ""
    for seg in re.split(r"(\{\{.+?\}\})", text):
        english = seg.startswith("{{")
        seg = seg[2:-2] if english else seg
        if not seg.strip():
            continue
        body = seg.strip()
        if not re.search(r"\w", body):  # punctuation only: glue it to what came before
            out = out.rstrip() + body
            continue
        ph = _PIPE.run(body).strip()
        tail = re.search(r"[.,;:!?]+$", body)
        if tail and not re.search(r"[.,;:!?]$", ph):
            ph += tail.group(0)  # keep the clause's own punctuation (the pipeline drops a trailing comma)
        out += (" " if out else "") + ph
    return out


def infer_phonemes(tts, phonemes: str, voice: str):
    """Synthesize a ready phoneme string. Vieneu().infer() only takes text: it would phonemize the phonemes a second
    time (it ignores unknown options such as skip_phonemize), so call the inner engine the way infer() does."""
    from vieneu.v3turbo import _cap_frames, max_expected_frames

    speaker_emb, ref_codes = tts._resolve_ref(voice, None, True, True)
    sampling = dict(temperature=0.8, top_k=25, top_p=0.95, max_new_frames=300, repetition_penalty=1.2)
    wav = tts.engine.infer(
        phonemes=phonemes, speaker_emb=speaker_emb, ref_codes=ref_codes, use_ref_codes=True,
        **_cap_frames(sampling, max_expected_frames(phonemes)),
    )
    return tts._apply_watermark(wav)


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        import vieneu  # noqa: F401

        return 0

    from vieneu import Vieneu

    tts = Vieneu()
    if sys.argv[1] == "--voices":
        for label, _ in tts.list_preset_voices():
            print(label)
        return 0

    with open(sys.argv[1], encoding="utf-8") as f:
        spec = json.load(f)
    jobs = spec["jobs"]
    for i, job in enumerate(jobs, 1):
        text = job["text"]
        if "{{" in text:
            # English marked with {{ }}: phonemize each part on its own, so a short English word ("so", "to",
            # "an", "do") is read as English instead of as the Vietnamese syllable it also spells.
            audio = infer_phonemes(tts, marked_phonemes(text), spec["voice"])
        else:
            audio = tts.infer(text, voice=spec["voice"])
        tts.save(audio, job["out"])
        print(f"    tts {i}/{len(jobs)}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
