"""Find and download freely licensed real footage and photos from Wikimedia Commons.

Every file on Commons carries a free licence (CC BY, CC BY-SA, CC0, public domain),
and the credit line this module returns is the attribution those licences require.
"""

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
# Wikimedia asks API clients for a descriptive User-Agent with a contact link.
USER_AGENT = "NKExploringPipeline/0.1 (https://github.com/khanh22092005-svg/upwind)"
VIDEO_EXT = (".webm", ".mp4", ".ogv", ".mov")


def _get(url: str, binary: bool = False):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                body = r.read()
            if binary:
                return body
            return json.loads(body)
        except (urllib.error.HTTPError, json.JSONDecodeError) as e:
            # 429 / "too many requests" page: back off and retry.
            if attempt == 4 or (isinstance(e, urllib.error.HTTPError) and e.code not in (429, 503)):
                raise
            time.sleep(5 * 2 ** attempt)


def _clean(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


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
        params.update(iiprop="url|size|extmetadata", iiurlwidth=2560,
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
            if (info.get("height") or 0) < 360 or (info.get("duration") or 0) < 4:
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
