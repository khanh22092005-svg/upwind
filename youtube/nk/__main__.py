"""NK Exploring video pipeline.

    python -m nk new "Why Iran can hold the world economy hostage"   # research + script
    python -m nk build episodes/why-iran-can-hold...                 # voice, frames, video
    python -m nk all "topic"                                          # both in one go

Edit episodes/<slug>/script.json between `new` and `build` - that is where you fact-check,
rewrite lines in your own voice, and swap visuals.
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPISODES = ROOT / "episodes"


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
    shots = [
        f"- scene_{i:02}: {s['visual']['image_prompt']}"
        for i, s in enumerate(script["scenes"]) if s["visual"]["kind"] == "image"
    ]
    if shots:
        (ep / "shots.md").write_text(
            "# Images to make\n\nSave each as assets/scene_NN.png (or .jpg). "
            "Scenes without an image fall back to a map or text card.\n\n"
            + "\n".join(shots) + "\n"
        )
    words = sum(len(s["narration"].split()) for s in script["scenes"])
    print(f"Wrote {ep / 'script.json'}: {len(script['scenes'])} scenes, {words} words "
          f"(~{words / 150:.1f} min). Review it, then: python -m nk build {ep.relative_to(ROOT)}")
    return ep


def _frame_for(scene: dict, index: int, ep: Path):
    from nk import maps

    v = scene["visual"]
    for ext in ("png", "jpg", "jpeg", "webp"):
        asset = ep / "assets" / f"scene_{index:02}.{ext}"
        if asset.exists():
            return maps.render_image(asset)
    if v["kind"] == "text" and v["caption"]:
        return maps.render_text(v["caption"], seed=index)
    if v["kind"] == "image" and not (v["highlight"] or v["focus"]):
        return maps.render_text(v["caption"] or scene["chapter"] or "", seed=index)
    return maps.render_map(v["highlight"], v["focus"], v["caption"], seed=index)


def cmd_build(args) -> None:
    from nk import maps, media

    ep = Path(args.episode).resolve()
    script = json.loads((ep / "script.json").read_text())
    scenes = script["scenes"]
    build = ep / "build"
    for sub in ("audio", "frames", "clips"):
        (build / sub).mkdir(parents=True, exist_ok=True)

    clips, lengths = [], []
    for i, scene in enumerate(scenes):
        print(f"Scene {i + 1}/{len(scenes)}", end="\r", flush=True)
        audio = build / "audio" / f"scene_{i:02}.mp3"
        frame = build / "frames" / f"scene_{i:02}.png"
        clip = build / "clips" / f"scene_{i:02}.mp4"
        if not audio.exists():
            media.tts(scene["narration"], audio, args.voice, args.rate)
        _frame_for(scene, i, ep).save(frame)
        lengths.append(media.scene_clip(frame, audio, clip, i))
        clips.append(clip)
    print()

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
    (ep / "upload.md").write_text(
        f"# Upload checklist\n\n## Title (pick one)\n{titles}\n\n"
        f"## Description\n{script['description']}\n\nChapters:\n" + "\n".join(chapters)
        + f"\n\n## Tags\n{', '.join(script['tags'])}\n\n"
        "## In YouTube Studio\n- Upload video.mp4, thumbnail.png, captions.srt (English)\n"
        "- Altered or synthetic content: answer honestly (AI voice = realistic synthetic voice)\n"
    )
    print(f"Done: {video} ({t / 60:.1f} min), thumbnail.png, captions.srt, upload.md")


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
