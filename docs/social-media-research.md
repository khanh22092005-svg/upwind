# Social media research: tools to use first

Purpose: when Claude needs to read Threads, TikTok, Instagram, YouTube or X for UpWind content
research, it should start with the cheapest tool that works. Don't web-search "how do I scrape X" again.
Checked 2026-10-31.

## 0. Already connected (no setup, try first)

| Need | Tool |
|---|---|
| Viral TikTok / Instagram posts on a topic | vidIQ MCP `vidiq_instagram_tiktok_outlier_search` |
| An IG profile and its reels | vidIQ `vidiq_ig_profile`, `vidiq_ig_profile_reels` |
| YouTube search, trending, video stats | vidIQ `vidiq_youtube_search`, `vidiq_trending_videos`, `vidiq_video_stats` |
| What a video actually says | vidIQ `vidiq_video_transcript` (cheaper than watching or describing it) |
| Writing Vietnamese Threads posts | skill `anthropic-skills:threads-content` |

vidIQ calls use vidIQ credits. Check `vidiq_balance` before a large batch.

## 1. Free command-line tools (run in Bash, cost only tokens)

- **yt-dlp** (`pip install yt-dlp`). Gets metadata and subtitles from TikTok, YouTube, Instagram and Facebook
  without downloading the video:
  `yt-dlp --skip-download --dump-json URL | jq '{title,description,view_count,like_count,comment_count,upload_date}'`
  `yt-dlp --skip-download --write-auto-subs --sub-langs vi,en URL`
- **instaloader** (`pip install instaloader`). Gets public Instagram profiles, posts and captions. Rate-limited
  when logged out, so keep batches small.
- **Threads profile stats (no login).** A plain `curl` of `https://www.threads.com/@handle` returns the
  `og:description` meta tag, which holds follower count, thread count and bio. Tested, it works.
  Post text is **not** in the logged-out HTML: it loads by JavaScript. For posts you need a scraper (below).

Token-saving rule: always pipe through `jq`/`grep` and print only the fields you need. Never dump raw HTML or
full JSON into the conversation.

## 2. Open-source scrapers (use when the above isn't enough)

- Threads: [alexdcd/Threads-Scraper](https://github.com/alexdcd/Threads-Scraper) (Playwright, no login, has
  rate limiting). Playwright and Chromium are pre-installed in Claude cloud sessions.
- Threads method write-up: [Scrapfly guide](https://scrapfly.io/blog/posts/how-to-scrape-threads). It catches
  the page's background GraphQL calls with Playwright. This is the most reliable way to get post text and likes.
- More options: [GitHub topic "threads-scraper"](https://github.com/topics/threads-scraper). Many projects there
  are stale. Check the last commit date before using one.

## 3. Paid APIs and MCP servers (only if you'll research often)

| Service | Platforms | Note |
|---|---|---|
| [SociaVault MCP](https://lobehub.com/tr/mcp/olamide-olaniyan-sociavault-mcp) | Threads, IG, TikTok, Facebook | The only one found that covers Threads + Facebook |
| [Xpoz](https://www.xpoz.ai/integrations/claude-code) | X, IG, TikTok, Reddit | Has a free tier |
| [CreatorCrawl](https://github.com/topics/creatorcrawl) | TikTok, IG, YouTube, LinkedIn, X, Reddit | 60+ MCP tools |
| [KonbiniAPI MCP](https://claudemarketplaces.com/mcp/com.konbiniapi/mcp) | IG, TikTok | Posts and comments |

Not verified: pricing, maintenance and terms. Scraping Meta platforms (Threads, IG, Facebook) can break their
terms of service. Read public data only, go slowly, and never use the UpWind account's login in a scraper.

## Suggested order for a typical research task

1. vidIQ outlier search for the topic → list of top posts.
2. `vidiq_video_transcript` or `yt-dlp --write-auto-subs` on the top 3–5 → what the hooks actually say.
3. Threads: `curl` profile stats for competitor accounts. Use the Playwright scraper only if post text is needed.
4. Write findings into the threads-content skill's format, not raw data dumps.
