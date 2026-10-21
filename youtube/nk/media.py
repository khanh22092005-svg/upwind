"""Voiceover (edge-tts), scene clips and the final video (ffmpeg)."""

import asyncio
import re
import subprocess
from pathlib import Path

import edge_tts

FPS = 30
GAP = 0.35  # seconds of silence after each scene


def tts(text: str, out: Path, voice: str, rate: str) -> None:
    asyncio.run(edge_tts.Communicate(text, voice, rate=rate).save(str(out)))


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(out.stdout)


def _ffmpeg(*args) -> None:
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


def scene_clip(frame: Path, audio: Path, out: Path, index: int) -> float:
    """Slow Ken Burns move over the still frame, alternating zoom in/out and drift."""
    length = duration(audio) + GAP
    frames = round(length * FPS)
    zoom = f"1+0.10*on/{frames}" if index % 2 == 0 else f"1.10-0.10*on/{frames}"
    drift = ["iw/2-(iw/zoom/2)", "iw/2-(iw/zoom/2)+on*0.15", "iw/2-(iw/zoom/2)-on*0.15"][index % 3]
    _ffmpeg(
        "-loop", "1", "-i", str(frame), "-i", str(audio),
        "-filter_complex",
        f"[0]zoompan=z='{zoom}':x='{drift}':y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps={FPS},"
        f"format=yuv420p[v];[1]apad=pad_dur={GAP}[a]",
        "-map", "[v]", "-map", "[a]", "-t", f"{length:.3f}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(out),
    )
    return length


def concat(clips: list[Path], out: Path, music: Path | None) -> None:
    listing = clips[0].parent / "concat.txt"
    listing.write_text("".join(f"file '{c.resolve()}'\n" for c in clips))
    if music is None:
        _ffmpeg("-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy",
                "-movflags", "+faststart", str(out))
        return
    # Loop the music quietly under the narration and fade it out at the end.
    total = sum(duration(c) for c in clips)
    _ffmpeg(
        "-f", "concat", "-safe", "0", "-i", str(listing),
        "-stream_loop", "-1", "-i", str(music),
        "-filter_complex",
        f"[1]volume=0.10,afade=t=out:st={max(total - 3, 0):.2f}:d=3[m];"
        "[0:a][m]amix=inputs=2:duration=first:normalize=0[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", str(out),
    )


def _ts(seconds: float, srt: bool) -> str:
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if srt:
        return f"{int(h):02}:{int(m):02}:{int(s):02},{int((s % 1) * 1000):03}"
    return f"{int(h)}:{int(m):02}:{int(s):02}" if h else f"{int(m)}:{int(s):02}"


def chapter_stamp(seconds: float) -> str:
    return _ts(seconds, srt=False)


def captions(scenes: list[dict], lengths: list[float]) -> str:
    """SRT with one cue per sentence, timed by each sentence's share of the scene."""
    cues, start = [], 0.0
    for scene, length in zip(scenes, lengths):
        sentences = [s for s in re.split(r"(?<=[.!?])\s+", scene["narration"].strip()) if s]
        spoken = length - GAP
        total = sum(len(s) for s in sentences) or 1
        t = start
        for sentence in sentences:
            end = t + spoken * len(sentence) / total
            cues.append((t, end, sentence))
            t = end
        start += length
    return "\n".join(
        f"{i}\n{_ts(a, True)} --> {_ts(b, True)}\n{text}\n"
        for i, (a, b, text) in enumerate(cues, 1)
    )
