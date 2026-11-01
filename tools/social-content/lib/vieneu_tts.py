"""Batch TTS with VieNeu-TTS (https://github.com/pnnbao97/VieNeu-TTS).

Called by make-video.mjs. Loads the model once, then renders every job:
    python3 lib/vieneu_tts.py jobs.json
jobs.json = {"voice": "Ngọc Huyền", "jobs": [{"text": "...", "out": "/abs/path.wav"}, ...]}

`python3 lib/vieneu_tts.py --check` exits 0 if vieneu can be imported (used for the gTTS fallback).
`python3 lib/vieneu_tts.py --voices` lists the built-in voices.
"""
import json
import sys


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
        audio = tts.infer(job["text"], voice=spec["voice"])
        tts.save(audio, job["out"])
        print(f"    tts {i}/{len(jobs)}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
