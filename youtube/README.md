# NK Exploring – video pipeline

Turns a topic into a ready-to-upload YouTube video in the style of
[STRABO](https://www.youtube.com/@strabomedia): research → script → voiceover → maps,
animated charts and real footage → video, thumbnail, captions and upload notes, with
every source and footage credit on screen and in the description.

Sample: [`episodes/france-welfare-state`](episodes/france-welfare-state), *Can France
Still Afford Its Welfare State?* (about 6 minutes, 36 scenes).

This folder is separate from the website. Vite, Wrangler and `pnpm build` ignore it.

## What STRABO does (checked 2026-10-21)

| | |
|---|---|
| Niche | Geopolitics and geography explainers. Tagline: *"Borders, power, places, and stories hiding in plain sight"* |
| Size | 1.85K subscribers, 6 videos, all from the last 12 days (one every ~2 days) |
| Length | 8:39 – 10:18 |
| Titles | Curiosity-gap questions: *Why France Never Stops Protesting?*, *Why Iran Can Hold the World's Economy Hostage?*, *Why America Needs Greenland More Than Ever?* |
| Thumbnails | Textured relief map, one country painted red with a white outline, a black name tag, a 1–2 word headline in a black box (white + yellow), plus one prop (a price tag, Uncle Sam's hand) |

**Is it AI?** Almost certainly mostly. The thumbnails show the marks of image generators:
painted-looking terrain, a perfect hand holding a country, a price tag on a rope. Six
10-minute researched videos in 12 days, with no face and no personal voice, is the
usual AI-assisted faceless setup: an LLM script, a TTS or cloned voice, AI images and
maps, and an editor such as CapCut. YouTube blocked this server from opening the videos,
so I could not check the voice itself.

**Two YouTube rules to know before copying this:**
1. **Inauthentic content** (the YouTube Partner Program policy, formerly "repetitious content").
   Mass-produced, template-only videos can be refused monetization. What keeps a channel
   safe is visible human input: your own angle, edited script lines, your own voice if
   you can, and checked facts. The pipeline stops after the script so you can do this.
2. **Altered or synthetic content.** When you upload, YouTube asks whether the video has
   realistic AI content. A realistic AI voice counts, so answer honestly.

## The workflow

```
topic ──► research.md ──► script.json ──► [you review/edit] ──► footage + voice + visuals ──► video.mp4
          (Claude +        (Claude,                              (Commons, edge-tts,            thumbnail.png
           web search)      structured)                           maps, charts)                 captions.srt
                                                                                                upload.md
```

1. **Pick a topic** (5 min). Use the "Why X…?" pattern. Find topics in the news this
   week, in what STRABO and bigger channels (RealLifeLore, Caspian Report) just
   covered, and in your own comments.
2. **`python -m nk new "topic"`** (2–4 min). Claude searches the web and writes
   `research.md` with sources, then `script.json`: 3 title options, a description, tags,
   the thumbnail text, a source list, and about 50 scenes. Each scene has narration and
   one of five visuals (see [Scene visuals](#scene-visuals)).
3. **Review** (20–30 min, the important part). Check the numbers against the sources,
   rewrite lines in your own words, and pick a title. To use your own clip or photo for
   a scene, see [Your own footage](#your-own-footage-social-media-news-clips).
4. **`python -m nk build episodes/<slug>`** (about 15 min for a 9-minute video). This
   downloads the footage, then makes the voiceover, the scenes, chapter banners, a
   sources end card, the video, the thumbnail and the captions. Re-run it after any
   edit; voice clips and footage are reused.
5. **Upload** with `upload.md`: the title, the description with chapters, the tags, and
   a checklist. Upload `captions.srt` as English subtitles.

You can run steps 2 and 4 together with `python -m nk all "topic"`. You can also run the
whole thing from GitHub, phone included: **Actions → NK Exploring video → Run workflow**.
The finished files appear as a downloadable artifact on the run page.

## Scene visuals

| kind | What you see | Where it comes from |
|---|---|---|
| `map` | Textured map, countries painted red and labelled, slow zoom | Natural Earth country shapes (public domain) |
| `footage` | Real video, cropped to 16:9, its own sound kept low under the voice, credit bottom-left | Wikimedia Commons search (`footage_query`), or your own file |
| `image` | Real photo with slow zoom and a credit | Wikimedia Commons, or your own file |
| `chart` | Bars that grow, or a line that draws itself, with the source underneath | Numbers in the script (taken from the research) |
| `text` | One big number or quote | The caption |

Each new chapter also gets a lower-third title banner. The last 6 seconds are an
end card that lists every source and footage credit.

## Your own footage (social media, news clips)

You can put any clip or photo on any scene. Save it as
`episodes/<slug>/assets/scene_NN.mp4` (or `.jpg`/`.png`), where NN is the scene number
counting from 00. Then add its credit to `assets/credits.json`:

```json
"7": {"credit": "Video: @username on X", "page": "https://x.com/username/status/..."}
```

The credit appears on screen, on the end card and in the description.

**A credit is not permission.** Commons footage is free to use as long as you credit
it, which the pipeline does. Clips from X, TikTok, Instagram or TV news belong to
whoever filmed them. A credit alone does not stop a copyright claim, and three claims
end a channel. Safe options:
- **Ask the poster.** Most people say yes to "can I use your video with credit?".
  Keep a screenshot of the reply.
- **Fair use.** A few seconds that you comment on (not as background filler) can count
  as fair use in the US. It is a judgement call, not a guarantee.
- **Free sources:** Wikimedia Commons (built in), the
  [EU Audiovisual Service](https://audiovisual.ec.europa.eu/) (free with credit),
  government press photos, and Pexels or Pixabay for generic city and people shots.

The pipeline automatically downloads from Wikimedia Commons only, where every file's
licence is known.

## Setup

```sh
cd youtube
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# also needs ffmpeg on PATH (Windows: winget install ffmpeg; Mac: brew install ffmpeg)
export ANTHROPIC_API_KEY=sk-ant-...                 # from console.anthropic.com
```

For the GitHub button, add the same key under **Settings → Secrets and variables →
Actions → New repository secret**, named `ANTHROPIC_API_KEY`.

Try the render without an API key: `python -m nk build episodes/example-greenland`.

## Costs

- Claude (research + script): roughly $0.30–$1 per video. Web search is billed per search, on top of tokens.
- Voice: free with edge-tts (Microsoft neural voices). For a more human voice, record
  yourself or use ElevenLabs. Save each line as `build/audio/scene_NN.mp3` and the build
  uses your file instead.
- Maps: free. Country shapes come from Natural Earth (public domain) and the font is Anton (OFL).
- Music: put a royalty-free track (for example from the YouTube Audio Library) at
  `music/default.mp3` or `episodes/<slug>/music.mp3`. It plays quietly under the voice.

## Files

| Path | What |
|---|---|
| `nk/writer.py` | Claude prompts for research and the script, plus the script's JSON schema |
| `nk/maps.py` | Map, text-card, image and thumbnail renderer |
| `nk/charts.py` | Animated charts, caption/credit overlays, chapter banners, end card |
| `nk/footage.py` | Wikimedia Commons search and download, with licence credits |
| `nk/media.py` | Voiceover, Ken Burns scene clips, final mix and captions |
| `nk/__main__.py` | The `new` / `build` / `all` commands |
| `episodes/<slug>/` | One folder per video. Only text files are committed; renders are gitignored |
| `../.github/workflows/nk-video.yml` | The GitHub Actions run button |

Voices: `edge-tts --list-voices`. Good narrators include `en-US-AndrewNeural`,
`en-US-BrianNeural` and `en-GB-RyanNeural`. Change them with `--voice` and `--rate "+8%"`.
