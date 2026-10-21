"""Record each spoken line, time the lesson to the recordings, and write productions/are/main.svml.

Run from the project root: python3 -I tools/build_voice.py
"""
import asyncio, json, os, re, ssl, subprocess, sys

import edge_tts
import edge_tts.communicate as communicate

# The session proxy re-signs TLS; trust its CA (verification stays on).
communicate._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "productions/are")
VOICE_DIR = os.path.join(OUT, "voice")
VOICES = {
    "narrator": ("vi-VN-HoaiMyNeural", "+4%"),
    "examiner": ("en-GB-RyanNeural", "-4%"),
    "candidate": ("en-US-EmmaNeural", "+0%"),
}

# (id, beat kind, on-screen text, speaker, spoken text, pause after, extra)
LINES = [
    ("phu-hook", "phu", "squeeze@hook", None, None, 0, {}),
    ("hook", "hook", "Mẹo từ UpWind|3 bước để không *'đứng hình'* ở IELTS Speaking Part 1", "narrator",
     "Ba bước để không đứng hình ở IELTS Speaking Part 1.", 0.35, {"take": "hook"}),
    ("skit", "section", "skit", None, None, 0, {}),
    ("phu-off", "phu", "off@off", None, None, 0.3, {}),
    ("q1", "examiner", "Do you enjoy cooking?", "examiner", "Do you enjoy cooking?", 0.5, {}),
    ("a1", "candidate", "Yes.", "candidate", "Yes.", 0.4, {}),
    ("phu-peek", "phu", "idle@peek", None, None, 0, {}),
    ("pen-a1", "pen", "quá ngắn!", None, None, 0, {"target": "b-a1"}),
    ("hush", "silence", "...im lặng 3 giây", None, None, 3.0, {}),
    ("q2", "examiner", "Um... could you tell me why?", "examiner", "Um... could you tell me why?", 0.5, {}),
    ("a2", "candidate", "Because... it's fun.", "candidate", "Because... it's fun.", 1.0, {}),
    ("teach", "section", "teach", None, None, 0, {}),
    ("phu-teach", "phu", "focus@teach", None, None, 0.2, {}),
    ("t1", "teach", "Trả lời *1 câu* rồi im lặng?", "narrator", "Trả lời một câu, rồi im lặng?", 0.35, {}),
    ("t2", "teach", "Giám khảo không có gì để chấm *Fluency* cả.", "narrator", "Như vậy, giám khảo không có gì để chấm Fluency cả.", 0.35, {}),
    ("t3", "teach", "Kéo dài câu trả lời với công thức *A.R.E*", "narrator", "Hãy kéo dài câu trả lời với công thức ba bước.", 0.4, {"stack": "A,R,E"}),
    ("tA", "teach", "*Answer* — trả lời thẳng, đừng vòng vo.", "narrator", "Một. Answer: trả lời thẳng vào câu hỏi, đừng vòng vo.", 0.4, {"step": "A|Answer|Trả lời thẳng câu hỏi"}),
    ("tR", "teach", "*Reason* — thêm một lý do cho ý của bạn.", "narrator", "Hai. Reason: thêm một lý do cho ý của bạn.", 0.4, {"step": "R|Reason|Nói lý do: vì sao?"}),
    ("tE", "teach", "*Example* — kể một chuyện nhỏ của chính bạn.", "narrator", "Ba. Example: kể một chuyện nhỏ của chính bạn.", 0.3, {"step": "E|Example|Một ví dụ có thật"}),
    ("goal", "note", "Mục tiêu mỗi câu Part 1|2–3 câu · 15–20 giây", None, None, 2.6, {}),
    ("redo", "section", "redo", None, None, 0, {}),
    ("phu-redo", "phu", "focus@redo", None, None, 0.1, {}),
    ("relabel", "label", "Làm lại với A.R.E", "narrator", "Giờ mình làm lại nhé!", 0.4, {}),
    ("q3", "examiner", "Do you enjoy cooking?", "examiner", "Do you enjoy cooking?", 0.5, {}),
    ("rA", "candidate", "Yes, I really do, especially at weekends.", "candidate", "Yes, I really do, especially at weekends.", 0.45, {"letter": "A"}),
    ("rR", "candidate", "It helps me relax after a long week of studying.", "candidate", "It helps me relax after a long week of studying.", 0.45, {"letter": "R"}),
    ("rE", "candidate", "Last Sunday I cooked phở for my whole family. It took four hours, but everyone loved it!",
     "candidate", "Last Sunday, I cooked pho for my whole family. It took four hours, but everyone loved it!", 0.5, {"letter": "E"}),
    ("ticks", "ticks", "Tự nhiên hơn hẳn!", None, None, 0, {}),
    ("phu-wave", "phu", "wave@redo", None, None, 0, {}),
    ("nice", "examiner", "That sounds wonderful.", "examiner", "That sounds wonderful.", 1.4, {}),
    ("cta", "section", "cta", None, None, 0, {}),
    ("phu-cta", "phu", "wave@cta", None, None, 0.1, {}),
    ("ctacard", "cta", "Lưu lại để luyện mỗi ngày|Mỗi câu Part 1: Answer, Reason, Example|upwind.asia",
     "narrator", "Lưu video này lại, và luyện mỗi ngày cùng UpWind nhé!", 1.6, {}),
]


# Vietnamese narration uses Vbee when its credentials are in the environment; English lines stay on edge-tts.
VBEE_APP_ID, VBEE_TOKEN = os.environ.get("VBEE_APP_ID"), os.environ.get("VBEE_TOKEN")
VBEE_VOICE = os.environ.get("VBEE_VOICE", "hn_female_ngochuyen_full_48k-fhg")
VBEE_SPEED = float(os.environ.get("VBEE_SPEED", "1.05"))
NARRATOR_TEMPO = float(os.environ.get("NARRATOR_TEMPO", "1.2"))


def record_vbee(spoken, path):
    import urllib.error, urllib.request
    body = json.dumps({"text": spoken, "mode": "sync", "voiceCode": VBEE_VOICE,
                       "outputFormat": "mp3", "bitrate": 128, "speed": VBEE_SPEED}).encode()
    request = urllib.request.Request("https://api.vbee.vn/v1/tts", data=body, method="POST", headers={
        "Authorization": f"Bearer {VBEE_TOKEN}", "App-Id": VBEE_APP_ID, "Content-Type": "application/json"})
    context = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
    try:
        with urllib.request.urlopen(request, context=context, timeout=60) as response:
            audio = response.read()
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Vbee {error.code}: {error.read().decode(errors='replace')}") from None
    if audio[:1] == b"{":
        raise RuntimeError(f"Vbee error: {audio.decode(errors='replace')}")
    open(path, "wb").write(audio)


# A single narration take (e.g. exported from the Vbee website): the narrator lines in order, ~1s apart.
NARRATION_TAKE = os.path.join(VOICE_DIR, "source", "vbee-narration.mp3")


def split_take(line_ids, min_gap=0.8, pad=0.08):
    """Cut the narration take at its long pauses into one file per narrator line."""
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", NARRATION_TAKE, "-af", f"silencedetect=n=-40dB:d={min_gap}",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(v) for v in re.findall(r"silence_start: ([0-9.]+)", probe)]
    ends = [float(v) for v in re.findall(r"silence_end: ([0-9.]+)", probe)]
    total = duration(NARRATION_TAKE)
    # Drop a trailing silence; the remaining gaps separate the lines.
    gaps = [(s, e) for s, e in zip(starts, ends) if e < total - 0.05]
    if len(gaps) != len(line_ids) - 1:
        raise RuntimeError(f"Narration take has {len(gaps) + 1} lines, expected {len(line_ids)}.")
    bounds = [0.0] + [b for gap in gaps for b in gap] + [starts[-1] if len(starts) > len(gaps) else total]
    for line_id, (a, b) in zip(line_ids, zip(bounds[::2], bounds[1::2])):
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", NARRATION_TAKE, "-ss", f"{max(0, a - pad):.3f}",
                        "-to", f"{min(total, b + pad):.3f}", "-c:a", "libmp3lame", "-q:a", "2",
                        os.path.join(VOICE_DIR, f"{line_id}.mp3")], check=True)


async def record(line_id, speaker, spoken):
    voice, rate = VOICES[speaker]
    path = os.path.join(VOICE_DIR, f"{line_id}.mp3")
    take = dict((l[0], l[6].get("take")) for l in LINES).get(line_id)
    own = take and os.path.join(VOICE_DIR, "source", f"vbee-{take}.mp3")
    if own and os.path.exists(own):
        # Trim leading/trailing silence from a single-line take.
        trim = "silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", own, "-af", trim, "-c:a", "libmp3lame", "-q:a", "2", path], check=True)
        return path
    if speaker == "narrator" and os.path.exists(NARRATION_TAKE) and not take:
        return path  # already cut from the take
    if speaker != "narrator" and os.path.exists(path) and "--rerecord" not in sys.argv:
        return path  # keep accepted English takes
    if speaker == "narrator" and VBEE_APP_ID and VBEE_TOKEN:
        await asyncio.to_thread(record_vbee, spoken, path)
        return path
    for attempt in range(4):
        try:
            await edge_tts.Communicate(spoken, voice, rate=rate).save(path)
            return path
        except edge_tts.exceptions.NoAudioReceived:
            await asyncio.sleep(2 ** attempt)
    raise RuntimeError(f"No audio for {line_id}: {spoken!r}")


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         check=True, capture_output=True, text=True).stdout
    return float(out)


def frames(seconds):
    return round(seconds * 30)


async def main():
    os.makedirs(VOICE_DIR, exist_ok=True)
    spoken = [(l[0], l[3], l[4]) for l in LINES if l[3]]
    if os.path.exists(NARRATION_TAKE):
        own_takes = {l[0] for l in LINES if l[6].get("take")}
        split_take([s[0] for s in spoken if s[1] == "narrator" and s[0] not in own_takes])
    paths = {s[0]: await record(*s) for s in spoken}
    # Speed up the Vietnamese narration (pitch preserved). Narrator files are re-cut from their takes each run.
    if NARRATOR_TEMPO != 1.0:
        for line_id, speaker, _ in spoken:
            if speaker == "narrator":
                fast = paths[line_id] + ".tmp.mp3"
                subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", paths[line_id], "-af", f"atempo={NARRATOR_TEMPO}",
                                "-c:a", "libmp3lame", "-q:a", "2", fast], check=True)
                os.replace(fast, paths[line_id])
    lengths = {k: duration(p) for k, p in paths.items()}

    # Lay lines end to end; times are whole frames so Windows land on frame boundaries.
    t, rows = 0.0, []
    for line_id, kind, text, speaker, _, pause, extra in LINES:
        start = frames(t)
        length = frames(lengths[line_id]) if speaker else 0
        rows.append(dict(id=line_id, kind=kind, text=text, speaker=speaker, start=start, length=length, extra=extra))
        t = (start + length) / 30 + pause
    end = frames(t)
    json.dump(dict(end=end, rows=rows), open(os.path.join(OUT, "timing.json"), "w"), ensure_ascii=False, indent=1)
    write_svml(rows, end)
    print(f"{len(paths)} lines recorded, film length {end / 30:.1f}s")


def esc(value):
    return value.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def write_svml(rows, end):
    sec = lambda f: f"{f}f"
    instants, beats, assets, clips = [], [], [], []
    for r in rows:
        instants.append(f'    <time:Instant id="{r["id"]}" at="{sec(r["start"])}"/>')
        if r["extra"].get("stack"):
            stack_at = r["start"] + int(r["length"] * 0.7)
            instants.append(f'    <time:Instant id="{r["id"]}-stack" at="{sec(stack_at)}"/>')
        step = r["extra"].get("letter") or r["extra"].get("target")
        step_attr = f' step="{step}"' if step else ""
        if r["extra"].get("step"):
            beats.append(f'    <upwind:Beat id="b-{r["id"]}-step" kind="step" text="{esc(r["extra"]["step"])}" at={{t.{r["id"]}}}/>')
        beats.append(f'    <upwind:Beat id="b-{r["id"]}" kind="{r["kind"]}"{step_attr} text="{esc(r["text"])}" at={{t.{r["id"]}}}/>')
        if r["extra"].get("stack"):
            beats.append(f'    <upwind:Beat id="b-{r["id"]}-stack" kind="stack" text="{r["extra"]["stack"]}" at={{t.{r["id"]}-stack}}/>')
        if r["speaker"]:
            vid = f'vo-{r["id"]}'
            assets.append(f'  <asset:Audio id="{vid}-file" src="./voice/{r["id"]}.mp3"/>\n'
                          f'  <mediaop:Normalize id="{vid}" source={{{vid}-file}} clock={{clock}} video="none" audio="default" span-authority="audio"/>\n'
                          f'  <time:Window id="{vid}-window" timeline={{t.timeline}} from={{t.{r["id"]}}} for="{sec(r["length"])}"/>')
            clips.append(f'    <audio:Clip id="{vid}-clip" source={{{vid}.media}} during={{{vid}-window}}/>')
    # A step beat shares its caption's instant but must come first; Beats are chronological either way.
    svml = f'''<?svml using="@hypit/markup@1"?>
<!-- Generated by tools/build_voice.py: edit LINES there, then re-run it. -->
<svml>
  <import as="time" from="@hypit/timeline-author@1"/>
  <import as="spatial" from="@hypit/spatial@1"/>
  <import as="media" from="@hypit/media@1"/>
  <import as="asset" from="@hypit/media@1"/>
  <import as="mediaop" from="@hypit/media-operations@1"/>
  <import as="audio" from="@hypit/audio-track@1"/>
  <import as="fonts" from="@hypit/fontsource@1"/>
  <import as="upwind" from="@upwind/lesson-scene@1"/>
  <import as="film" from="@hypit/film@1"/>
  <import as="html" from="@hypit/html-video@1"/>
  <import as="look" source="./look.svs"/>

  <time:Clock id="clock" frame-rate="30"/>
  <time:Timeline id="t" clock={{clock}} end="{sec(end)}">
{chr(10).join(instants)}
  </time:Timeline>
  <spatial:Canvas id="canvas" width="1080" height="1920"/>

  <fonts:Face id="nunito-700" package="@fontsource-variable/nunito" weight="700" style="normal"/>
  <fonts:Face id="nunito-800" package="@fontsource-variable/nunito" weight="800" style="normal"/>
  <fonts:Face id="lora-600" package="@fontsource-variable/lora" weight="600" style="normal"/>
  <fonts:Face id="patrick-hand" package="@fontsource/patrick-hand" weight="400" style="normal"/>
  <media:FontStack id="body" primary={{nunito-700}}/>
  <media:FontStack id="heavy" primary={{nunito-800}}/>
  <media:FontStack id="serif" primary={{lora-600}}/>
  <media:FontStack id="hand" primary={{patrick-hand}}/>

  <upwind:Lesson id="lesson" timeline={{t.timeline}} within={{canvas.bounds}} during={{t.window}}
    font={{body}} heavy={{heavy}} serif={{serif}} hand={{hand}} tag="Speaking · Part 1">
{chr(10).join(beats)}
  </upwind:Lesson>

{chr(10).join(assets)}
  <audio:Track id="voiceover" timeline={{t.timeline}}>
{chr(10).join(clips)}
  </audio:Track>

  <film:Film id="main" canvas={{canvas.canvas}} timeline={{t.timeline}} appearance={{look.film.main}}>
    <film:Track source={{lesson.visual}}/>
    <film:Track source={{voiceover.audio}}/>
  </film:Film>
  <html:Video id="final" composition={{main.composition}} timeline={{t.timeline}}/>
</svml>
'''
    open(os.path.join(OUT, "main.svml"), "w").write(svml)


asyncio.run(main())
