"""Voiceover (edge-tts), scene clips and the final video (ffmpeg)."""

import asyncio
import re
import subprocess
import time
from pathlib import Path

import edge_tts

FPS = 30
GAP = 0.35  # seconds of silence after each scene
BANNER_SECONDS = 3.0
# Every clip is encoded identically so they can be joined without re-encoding video.
VIDEO_OUT = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
             "-profile:v", "high", "-level", "4.1", "-r", str(FPS)]
AUDIO_OUT = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
FIT = "scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},setsar=1"


def tts(text: str, out: Path, voice: str, rate: str) -> None:
    # The free edge-tts service occasionally returns nothing; a retry usually works.
    for attempt in range(3):
        try:
            asyncio.run(edge_tts.Communicate(text, voice, rate=rate).save(str(out)))
            if out.stat().st_size == 0:
                raise edge_tts.exceptions.NoAudioReceived("empty audio file")
            return
        except edge_tts.exceptions.EdgeTTSException:
            out.unlink(missing_ok=True)
            if attempt == 2:
                raise
            time.sleep(3 * (attempt + 1))


def _probe(path: Path, *args) -> str:
    out = subprocess.run(["ffprobe", "-v", "error", *args, "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True)
    return out.stdout.strip()


def duration(path: Path) -> float:
    return float(_probe(path, "-show_entries", "format=duration"))


def has_audio(path: Path) -> bool:
    return bool(_probe(path, "-select_streams", "a", "-show_entries", "stream=index"))


def _ffmpeg(*args) -> None:
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


def scene_clip(source: dict, audio: Path, out: Path, index: int,
               overlay: Path | None = None, banner: Path | None = None) -> float:
    """Render one scene to `out` and return its length in seconds.

    source is one of:
      {"still": png}            slow Ken Burns zoom/drift over a still frame
      {"frames": pattern, "n"}  an animation (chart) that holds on its last frame
      {"video": file}           real footage, trimmed/looped and cropped to 16:9
    overlay is shown for the whole scene, banner for its first seconds.
    Input 0 is the picture, input 1 the narration, then the overlay PNGs.
    """
    length = duration(audio) + GAP
    frames = round(length * FPS)
    fit = FIT.format(w=1920, h=1080)
    if "still" in source:
        zoom = f"1+0.10*on/{frames}" if index % 2 == 0 else f"1.10-0.10*on/{frames}"
        drift = ["iw/2-(iw/zoom/2)", "iw/2-(iw/zoom/2)+on*0.15", "iw/2-(iw/zoom/2)-on*0.15"][index % 3]
        inputs = ["-loop", "1", "-i", str(source["still"])]
        chain = (f"[0]{FIT.format(w=2560, h=1440)},zoompan=z='{zoom}':x='{drift}':"
                 f"y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps={FPS}[v0]")
    elif "frames" in source:
        hold = max(length - source["n"] / FPS, 0)
        inputs = ["-framerate", str(FPS), "-i", str(source["frames"])]
        chain = f"[0]tpad=stop_mode=clone:stop_duration={hold:.3f},{fit}[v0]"
    else:
        clip = Path(source["video"])
        start = max(min(duration(clip) * 0.2, duration(clip) - length), 0)
        inputs = ["-stream_loop", "-1", "-ss", f"{start:.2f}", "-i", str(clip)]
        chain = f"[0]{fit},fps={FPS}[v0]"
    inputs += ["-i", str(audio)]

    label, idx = "v0", 2
    for png, until in ((overlay, length), (banner, BANNER_SECONDS)):
        if png is None:
            continue
        inputs += ["-loop", "1", "-i", str(png)]
        chain += f";[{label}][{idx}]overlay=0:0:enable='lte(t,{until:.2f})'[v{idx}]"
        label, idx = f"v{idx}", idx + 1
    # Footage keeps a little of its own sound (crowds, chants) under the voice.
    if "video" in source and has_audio(Path(source["video"])):
        chain += (f";[1]apad=pad_dur={GAP}[n];[0:a]volume=0.12[amb];"
                  "[n][amb]amix=inputs=2:duration=first:normalize=0[a]")
    else:
        chain += f";[1]apad=pad_dur={GAP}[a]"
    _ffmpeg(*inputs, "-filter_complex", chain, "-map", f"[{label}]", "-map", "[a]",
            "-t", f"{length:.3f}", *VIDEO_OUT, *AUDIO_OUT, str(out))
    return length


def still_clip(frame: Path, seconds: float, out: Path) -> None:
    """A silent clip of a still (used for the end card)."""
    _ffmpeg("-loop", "1", "-i", str(frame), "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
            "-filter_complex", f"[0]{FIT.format(w=1920, h=1080)}[v]", "-map", "[v]", "-map", "1:a",
            "-t", f"{seconds:.2f}", *VIDEO_OUT, *AUDIO_OUT, str(out))


def concat(clips: list[Path], out: Path, music: Path | None) -> None:
    listing = clips[0].parent / "concat.txt"
    listing.write_text("".join(f"file '{c.resolve()}'\n" for c in clips))
    # Video is copied; audio is re-encoded so the joined file has one clean timeline
    # (phone players can refuse stream-copied joins).
    if music is None:
        _ffmpeg("-f", "concat", "-safe", "0", "-i", str(listing), "-c:v", "copy", *AUDIO_OUT,
                "-avoid_negative_ts", "make_zero", "-movflags", "+faststart", str(out))
        return
    # Loop the music quietly under the narration and fade it out at the end.
    total = sum(duration(c) for c in clips)
    _ffmpeg(
        "-f", "concat", "-safe", "0", "-i", str(listing),
        "-stream_loop", "-1", "-i", str(music),
        "-filter_complex",
        f"[1]volume=0.10,afade=t=out:st={max(total - 3, 0):.2f}:d=3[m];"
        "[0:a][m]amix=inputs=2:duration=first:normalize=0[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", *AUDIO_OUT,
        "-avoid_negative_ts", "make_zero", "-movflags", "+faststart", str(out),
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
