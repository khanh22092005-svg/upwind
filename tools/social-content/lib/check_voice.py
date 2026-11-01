"""Transcribe a rendered video (or clip) to check that the voice says what the script says, English especially.

    pip install faster-whisper                      # once; the "small" model downloads on first run
    python3 lib/check_voice.py out/writing-because-so/video.mp4:vi
    python3 lib/check_voice.py out/writing-because-so/video.mp4:en:3:9   # file:lang:start:seconds

Audio is decoded with ffmpeg (faster-whisper's own loader breaks with newer PyAV: "unexpected keyword argument
'metadata_errors'"). In Vietnamese mode English comes back as readable English when it is right, and as letter soup
("BKZDTUMA NICAZE…") when the voice is broken. Small slips ("ban" for "band") are the recognizer, not the voice.
"""
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

m = WhisperModel("small", device="cpu", compute_type="int8")


def load(f, start=None, dur=None):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", str(start)] if start is not None else []) + ["-i", f]
    cmd += (["-t", str(dur)] if dur else []) + ["-ac", "1", "-ar", "16000", "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, dtype=np.float32)


def tr(f, lang=None, start=None, dur=None):
    segs, _ = m.transcribe(load(f, start, dur), language=lang, beam_size=5)
    return " ".join(s.text.strip() for s in segs)


# usage: asr.py file[:lang[:start:dur]] ...
for arg in sys.argv[1:]:
    parts = arg.split(":")
    f = parts[0]
    lang = parts[1] if len(parts) > 1 and parts[1] else None
    start = float(parts[2]) if len(parts) > 2 else None
    dur = float(parts[3]) if len(parts) > 3 else None
    print(f.split("/")[-1], parts[2:] if len(parts) > 2 else "", "|", tr(f, lang, start, dur), flush=True)
