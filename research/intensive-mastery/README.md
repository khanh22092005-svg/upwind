# Intensive Mastery Writing & Speaking — research and course design

Working notes for a new UpWind product: a 90-day, 1 teacher : 3 students Writing & Speaking
program with teacher marking within 48 hours. Not part of the website build.

| File | What it is |
|---|---|
| `01-social-listening-findings.md` | Pain points of Vietnamese IELTS learners, from Threads replies and YouTube comments (Oct 2026), plus a comparison with Diagnostic–Prescriptive Teaching and Summit Learning |
| `02-landing-page-brief.md` | Landing page brief for Claude Design: MECE problem tree, Summit + Diagnostic–Prescriptive framework, offer, page structure, copy |
| `03-course-design.md` | Course architecture (Vietnamese): learning outcomes, skill map from the Roadmap v2 tab, 90-day roadmap, 6 live sessions, error-log codes, weekly task rhythm |
| `img/` | Diagrams exported from the docs |
| `scripts/` | Threads scraper used for the social listening |

The live, editable versions are Claude Docs:
[social listening](https://claude.ai/artifact/MgjxxT4ke7bgteL9Y96YxQ) and
[brief + course design](https://claude.ai/artifact/QMndYxJ7htixqVNFSDVwui).

## Re-running the Threads scrape

Needs Node with Playwright and a Chromium build. Threads search works logged out but only
returns "top" posts; replies load on each post page.

```sh
node scripts/threads_search.js threads.jsonl "ielts speaking" "ielts writing" "writing task 2"
node scripts/threads_replies.js threads.jsonl threads_replies.jsonl
python3 scripts/clean.py .   # writes threads_clean.json from threads_replies.jsonl
```

Raw scraped data is not committed: it contains other people's posts and handles.
