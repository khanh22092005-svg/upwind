"""NK Exploring video pipeline.

    python -m nk new "Why Iran can hold the world economy hostage"   # research + script
    python -m nk build episodes/why-iran-can-hold...                 # footage, voice, video
    python -m nk all "topic"                                          # both in one go

Edit episodes/<slug>/script.json between `new` and `build` - that is where you fact-check,
rewrite lines in your own voice, and swap visuals. To use your own clip or photo for a
scene, save it as assets/scene_NN.<ext> and put its credit in assets/credits.json.
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPISODES = ROOT / "episodes"
CHART_FRAMES = 40  # chart grow animation, ~1.3 s
END_CARD_SECONDS = 6.0
VIDEO_EXT = {".webm", ".mp4", ".ogv", ".mov", ".mkv"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60]


def cmd_new(args) -> Path:
    from nk import writer

    ep = EPISODES / slugify(args.topic)
    ep.mkdir(parents=True, exist_ok=True)
    research = ep / "research.md"
    if not research.exists():
        print("Researching (web search)...")
        research.write_text(f"# {args.topic}\n\n" + writer.research(args.topic))
    print("Writing script...")
    script = writer.write_script(args.topic, research.read_text(), args.minutes)
    script["topic"] = args.topic
    (ep / "script.json").write_text(json.dumps(script, indent=2, ensure_ascii=False) + "\n")
    words = sum(len(s["narration"].split()) for s in script["scenes"])
    print(f"Wrote {ep / 'script.json'}: {len(script['scenes'])} scenes, {words} words "
          f"(~{words / 150:.1f} min). Review it, then: python -m nk build {ep.relative_to(ROOT)}")
    return ep


def _asset(ep: Path, index: int) -> Path | None:
    for p in sorted((ep / "assets").glob(f"scene_{index:02}.*")):
        if p.suffix.lower() in VIDEO_EXT | IMAGE_EXT:
            return p
    return None


def _gather_footage(scenes: list[dict], ep: Path) -> dict:
    """Download Commons footage for footage/image scenes that have no asset yet.
    credits.json maps scene number -> {"credit", "page", ...}; edit it for your own clips."""
    from nk import footage

    path = ep / "assets" / "credits.json"
    credits = json.loads(path.read_text()) if path.exists() else {}
    used = {c.get("page") for c in credits.values()}
    for i, scene in enumerate(scenes):
        v = scene["visual"]
        if v["kind"] not in ("footage", "image") or not v["footage_query"] or _asset(ep, i):
            continue
        print(f"Footage for scene {i}: {v['footage_query']!r}")
        stem = ep / "assets" / f"scene_{i:02}"
        try:
            got = footage.fetch(v["footage_query"], v["kind"] == "footage", stem, used)
            if got is None and v["kind"] == "footage":  # no video: try a photo
                got = footage.fetch(v["footage_query"], False, stem, used)
        except OSError as e:
            print(f"  failed ({e}); scene falls back to a map/text card")
            if getattr(e, "code", None) == 429:
                print("Wikimedia is rate-limiting this network; skipping the remaining "
                      "downloads this run. Re-run build later to fill them in.")
                break
            continue
        if got:
            credits[str(i)] = got
            used.add(got["page"])
            path.write_text(json.dumps(credits, indent=2, ensure_ascii=False) + "\n")
        else:
            print("  nothing found; scene falls back to a map/text card")
    return credits


def _picture(scene: dict, index: int, ep: Path, build: Path, credits: dict):
    """Return (source for media.scene_clip, credit line or "", caption already drawn)."""
    from nk import charts, maps

    v = scene["visual"]
    frame = build / "frames" / f"scene_{index:02}.png"
    asset = _asset(ep, index)
    credit = credits.get(str(index), {}).get("credit", "")
    if asset and asset.suffix.lower() in VIDEO_EXT:
        return {"video": asset}, credit, False
    if asset:
        maps.render_image(asset).save(frame)
        return {"still": frame}, credit, False
    chart = v.get("chart") or {}
    if v["kind"] == "chart" and chart.get("type") and chart.get("values"):
        pattern = build / "frames" / f"scene_{index:02}_%03d.png"
        for f in range(CHART_FRAMES):
            charts.render_chart(chart, f / (CHART_FRAMES - 1), seed=index).save(
                str(pattern) % f)
        return {"frames": pattern, "n": CHART_FRAMES}, "", False
    if v["kind"] in ("map", "footage", "image") and (v["highlight"] or v["focus"]):
        maps.render_map(v["highlight"], v["focus"], v["caption"], seed=index).save(frame)
    else:
        maps.render_text(v["caption"] or scene["chapter"] or "", seed=index).save(frame)
    return {"still": frame}, "", True


def cmd_build(args) -> None:
    from nk import charts, maps, media

    ep = Path(args.episode).resolve()
    script = json.loads((ep / "script.json").read_text())
    scenes = script["scenes"]
    build = ep / "build"
    for sub in ("audio", "frames", "clips", "overlays"):
        (build / sub).mkdir(parents=True, exist_ok=True)
    credits = _gather_footage(scenes, ep)

    clips, lengths = [], []
    for i, scene in enumerate(scenes):
        print(f"Scene {i + 1}/{len(scenes)}", end="\r", flush=True)
        audio = build / "audio" / f"scene_{i:02}.mp3"
        clip = build / "clips" / f"scene_{i:02}.mp4"
        if not audio.exists() or audio.stat().st_size == 0:  # empty = interrupted run
            media.tts(scene["narration"], audio, args.voice, args.rate)
        source, credit, drawn = _picture(scene, i, ep, build, credits)
        overlay = banner = None
        # Map and text frames draw their own caption; everything else gets an overlay.
        caption = "" if drawn else scene["visual"]["caption"]
        if caption or credit:
            overlay = build / "overlays" / f"scene_{i:02}.png"
            charts.overlay(caption, credit).save(overlay)
        if scene["chapter"] and i > 0:
            banner = build / "overlays" / f"chapter_{i:02}.png"
            charts.chapter_banner(scene["chapter"]).save(banner)
        lengths.append(media.scene_clip(source, audio, clip, i, overlay, banner))
        clips.append(clip)
    print()

    footage_lines = [f"{c['credit']} - {c['page']}" for _, c in sorted(
        credits.items(), key=lambda kv: int(kv[0]))]
    end = build / "frames" / "end_card.png"
    charts.end_card(script.get("sources", []) + footage_lines).save(end)
    media.still_clip(end, END_CARD_SECONDS, build / "clips" / "end_card.mp4")
    clips.append(build / "clips" / "end_card.mp4")

    music = next((p for p in (ep / "music.mp3", ROOT / "music" / "default.mp3") if p.exists()), None)
    video = ep / "video.mp4"
    media.concat(clips, video, music)
    (ep / "captions.srt").write_text(media.captions(scenes, lengths))

    thumb = script["thumbnail"]
    maps.render_map(thumb["highlight"], thumb["highlight"], thumb["headline"],
                    size=(1280, 720), seed=99, headline_size=130).save(ep / "thumbnail.png")

    chapters, t = [], 0.0
    for scene, length in zip(scenes, lengths):
        if scene["chapter"]:
            chapters.append(f"{media.chapter_stamp(t)} {scene['chapter']}")
        t += length
    if chapters and not chapters[0].startswith("0:00"):
        chapters.insert(0, "0:00 Intro")
    titles = "\n".join(f"- {x}" for x in script["title_options"])
    footage_md = "\n".join(f"- {line}" for line in footage_lines) or "- none"
    (ep / "upload.md").write_text(
        f"# Upload checklist\n\n## Title (pick one)\n{titles}\n\n"
        f"## Description\n{script['description']}\n\nChapters:\n" + "\n".join(chapters)
        + f"\n\nFootage and photos (free licences, attribution required):\n{footage_md}\n"
        + f"\n## Tags\n{', '.join(script['tags'])}\n\n"
        "## In YouTube Studio\n- Upload video.mp4, thumbnail.png, captions.srt (English)\n"
        "- Paste the description including the footage credits (CC BY / BY-SA require it)\n"
        "- Altered or synthetic content: answer honestly (AI voice = realistic synthetic voice)\n"
    )
    total = t + END_CARD_SECONDS
    print(f"Done: {video} ({total / 60:.1f} min), thumbnail.png, captions.srt, upload.md")


def main() -> None:
    p = argparse.ArgumentParser(prog="nk", description="NK Exploring video pipeline")
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("new", "all"):
        s = sub.add_parser(name)
        s.add_argument("topic")
        s.add_argument("--minutes", type=int, default=9)
    b = sub.add_parser("build")
    b.add_argument("episode")
    for s in (b, sub.choices["all"]):
        s.add_argument("--voice", default="en-US-AndrewNeural",
                       help="any `edge-tts --list-voices` name")
        s.add_argument("--rate", default="+4%")
    args = p.parse_args()

    if args.cmd == "new":
        cmd_new(args)
    elif args.cmd == "build":
        cmd_build(args)
    else:
        args.episode = cmd_new(args)
        cmd_build(args)


if __name__ == "__main__":
    sys.exit(main())
