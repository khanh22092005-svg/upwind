"""Find and download freely licensed real footage and photos from Wikimedia Commons.

Every file on Commons carries a free licence (CC BY, CC BY-SA, CC0, public domain),
and the credit line this module returns is the attribution those licences require.
"""

import json
import platform
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
# Wikimedia's robot policy: "<client>/<version> (<contact>) <library>/<version>".
USER_AGENT = (f"NKExploringPipeline/0.1 (https://github.com/khanh22092005-svg/upwind) "
              f"python-urllib/{platform.python_version()}")
PAUSE = 1.5  # seconds between requests; Wikimedia rate-limits bursts
MAX_WAIT = 60  # longest Retry-After we sit through
VIDEO_EXT = (".webm", ".mp4", ".ogv", ".mov")


def _get(url: str, binary: bool = False):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        time.sleep(PAUSE)
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                body = r.read()
            return body if binary else json.loads(body)
        except urllib.error.HTTPError as e:
            if attempt == 3 or e.code not in (429, 503):
                raise
            wait = e.headers.get("Retry-After", "")
            wait = int(wait) if wait.isdigit() else 10 * 2 ** attempt
            if wait > MAX_WAIT:  # a long ban: give up now rather than stall the build
                raise
            time.sleep(wait)


def _clean(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def _words(text: str) -> set[str]:
    plain = unicodedata.normalize("NFKD", text.lower()).encode("ascii", "ignore").decode()
    return {w for w in re.findall(r"[a-z0-9]+", plain) if len(w) > 3}


def search(query: str, video: bool, limit: int = 12) -> list[dict]:
    """Candidates as {"title", "url", "page", "credit"}, best first."""
    kind = "video" if video else "bitmap"
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrnamespace": 6, "gsrsearch": f"{query} filetype:{kind}", "gsrlimit": limit,
        "prop": "videoinfo" if video else "imageinfo",
        "maxlag": 5,
    }
    if video:
        params.update(viprop="url|size|derivatives|extmetadata",
                      viextmetadatafilter="LicenseShortName|Artist")
    else:
        params.update(iiprop="url|size|extmetadata", iiurlwidth=1920,  # a standard thumbnail width; others get refused
                      iiextmetadatafilter="LicenseShortName|Artist")
    data = _get(f"{API}?{urllib.parse.urlencode(params)}")
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p["index"])
    out = []
    for p in pages:
        info = (p.get("videoinfo") or p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        artist = _clean(meta.get("Artist", {}).get("value", "")) or "Unknown author"
        licence = meta.get("LicenseShortName", {}).get("value", "see file page")
        if video:
            if (info.get("height") or 0) < 360 or (info.get("duration") or 0) < 10:
                continue
            # Prefer a 720p (or smaller) transcode: originals can be gigabytes.
            derived = [d for d in info.get("derivatives", [])
                       if d.get("height") and d["height"] <= 720 and d["src"].endswith(VIDEO_EXT)]
            url = max(derived, key=lambda d: d["height"])["src"] if derived else info["url"]
            if not derived and info.get("size", 0) > 300e6:
                continue
        else:
            if (info.get("width") or 0) < 1200:
                continue
            url = info.get("thumburl") or info["url"]
        title = p["title"].removeprefix("File:")
        # Search also matches description text, which lets in near misses (the
        # Luxembourg parliament for "Assemblée nationale"). Require at least half
        # the query's words in the file name itself.
        wanted = _words(query)
        hits = len(wanted & _words(title))
        if wanted and hits < max(1, len(wanted) / 2):
            continue
        out.append({
            "title": title,
            "url": url,
            "page": info.get("descriptionurl", ""),
            "credit": f"{'Video' if video else 'Photo'}: {artist} / {licence} / Wikimedia Commons",
        })
    return out


def fetch(query: str, video: bool, dest_stem: Path, used: set[str]) -> dict | None:
    """Download the best result not already used in this episode."""
    for cand in search(query, video):
        if cand["page"] in used:
            continue
        ext = Path(urllib.parse.urlparse(cand["url"]).path).suffix.lower() or ".jpg"
        dest = dest_stem.with_suffix(ext)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(_get(cand["url"], binary=True))
        return {**cand, "file": dest.name, "query": query}
    return None
