"""Draw STRABO-style map frames: textured terrain, countries painted red, bold labels."""

import json
import math
import random
import urllib.request
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

CACHE = Path(__file__).resolve().parent.parent / ".cache"
COUNTRIES_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
    "geojson/ne_50m_admin_0_countries.geojson"
)
FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf"
FALLBACK_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

OCEAN = (24, 66, 96)
OCEAN_DEEP = (14, 44, 70)
LAND = (196, 182, 140)
BORDER = (110, 98, 72)
RED = (192, 36, 40)
YELLOW = (255, 212, 0)


def _download(url: str, name: str) -> Path:
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, path)
    return path


@lru_cache(maxsize=None)
def font(size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(str(_download(FONT_URL, "Anton-Regular.ttf")), size)
    except OSError:
        return ImageFont.truetype(FALLBACK_FONT, size)


@lru_cache(maxsize=1)
def countries() -> dict:
    """ISO3 code -> {"name", "polygons": [[outer ring, holes...], ...]}."""
    data = json.loads(_download(COUNTRIES_URL, "countries50m.geojson").read_text())
    out = {}
    for f in data["features"]:
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        # ISO_A3 is -99 for France and Norway; ADM0_A3 is always set.
        out[f["properties"]["ADM0_A3"]] = {"name": f["properties"]["NAME"], "polygons": polys}
    return out


def _merc_y(lat: float) -> float:
    lat = max(-85.0, min(85.0, lat))
    return math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))


def _ring_area(ring) -> float:
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:]))) / 2


def _centroid(ring):
    """Area-weighted centroid; a plain vertex mean drifts toward detailed coastlines."""
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        cross = x0 * y1 - x1 * y0
        a += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    if abs(a) < 1e-9:
        return ring[0]
    return cx / (3 * a), cy / (3 * a)


def _main_polygons(code: str):
    """Drop far-flung islands and overseas territories (French Guiana, Alaska's
    Aleutians...) so framing and labels sit on the country people picture."""
    polys = countries()[code]["polygons"]
    areas = [_ring_area(p[0]) for p in polys]
    return [p for p, a in zip(polys, areas) if a >= 0.15 * max(areas)]


def _frame(codes, aspect: float):
    """Bounding box (lon0, lon1, y0, y1) in Mercator degrees around the codes."""
    pts = [pt for c in codes for p in _main_polygons(c) for pt in p[0]]
    lon0, lon1 = min(p[0] for p in pts), max(p[0] for p in pts)
    y0, y1 = _merc_y(min(p[1] for p in pts)), _merc_y(max(p[1] for p in pts))
    cx, cy = (lon0 + lon1) / 2, (y0 + y1) / 2
    w = max(lon1 - lon0, (y1 - y0) * aspect, 10.0) * 1.7
    h = w / aspect
    return cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2


def _texture(size, seed: int) -> Image.Image:
    """Grey noise blurred at two scales, for a painted, grainy look."""
    random.seed(seed)
    w, h = size
    coarse = Image.effect_noise((w // 16, h // 16), 60).resize(size, Image.BICUBIC)
    fine = Image.effect_noise(size, 30).filter(ImageFilter.GaussianBlur(1))
    return Image.blend(coarse, fine, 0.35)


def _tint(img: Image.Image, tex: Image.Image, strength: float) -> Image.Image:
    shade = Image.merge("RGB", [tex] * 3)
    return Image.blend(img, ImageChops.multiply(img, shade.point(lambda v: 140 + v // 2)), strength)


def label(draw: ImageDraw.ImageDraw, xy, text: str, size: int, fill=(255, 255, 255),
          box=(0, 0, 0), anchor="mm"):
    f = font(size)
    l, t, r, b = draw.textbbox(xy, text, font=f, anchor=anchor)
    pad = size // 4
    draw.rectangle((l - pad, t - pad, r + pad, b + pad), fill=box)
    draw.text(xy, text, font=f, fill=fill, anchor=anchor)


def headline(draw: ImageDraw.ImageDraw, text: str, width: int, height: int, size: int):
    """Thumbnail-style block in the top right: white words, last word yellow."""
    words = text.upper().split()
    lines = [" ".join(words[:-1]), words[-1]] if len(words) > 1 else words
    f = font(size)
    widths = [draw.textlength(line, font=f) for line in lines]
    pad = size // 5
    box_w, line_h = max(widths) + 2 * pad, int(size * 1.1)
    x1, y0 = width - int(width * 0.04), int(height * 0.06)
    x0 = x1 - box_w
    draw.rectangle((x0, y0, x1, y0 + line_h * len(lines) + pad), fill=(0, 0, 0))
    for i, line in enumerate(lines):
        color = YELLOW if i == len(lines) - 1 and len(lines) > 1 else (255, 255, 255)
        draw.text((x0 + pad, y0 + pad // 2 + i * line_h), line, font=f, fill=color)


def render_map(highlight, focus=(), caption="", size=(2560, 1440), seed=0,
               headline_size=0) -> Image.Image:
    known = countries()
    highlight = [c for c in highlight if c in known]
    focus = [c for c in focus if c in known] or highlight or ["FRA", "DEU", "POL"]
    w, h = size
    lon0, lon1, y0, y1 = _frame(focus, w / h)

    def project(ring):
        return [((lon - lon0) / (lon1 - lon0) * w, (y1 - _merc_y(lat)) / (y1 - y0) * h)
                for lon, lat in ring]

    tex = _texture(size, seed)
    ocean = Image.new("RGB", size, OCEAN)
    ocean = Image.composite(ocean, Image.new("RGB", size, OCEAN_DEEP), tex)
    land_mask = Image.new("L", size, 0)
    red_mask = Image.new("L", size, 0)
    lines = Image.new("RGBA", size, (0, 0, 0, 0))
    lm, rm, ld = ImageDraw.Draw(land_mask), ImageDraw.Draw(red_mask), ImageDraw.Draw(lines)
    scale = max(2, w // 900)

    for code, c in known.items():
        for poly in c["polygons"]:
            rings = [project(r) for r in poly]
            xs = [x for x, _ in rings[0]]
            if max(xs) < -w or min(xs) > 2 * w:
                continue
            for i, ring in enumerate(rings):
                lm.polygon(ring, fill=0 if i else 255)
                if code in highlight:
                    rm.polygon(ring, fill=0 if i else 255)
            ld.line(rings[0] + rings[0][:1], fill=BORDER + (200,), width=scale)

    land = _tint(Image.new("RGB", size, LAND), tex, 0.6)
    img = Image.composite(land, ocean, land_mask.filter(ImageFilter.GaussianBlur(1)))
    # Soft coastline glow, then borders.
    coast = land_mask.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(6))
    img = Image.composite(Image.new("RGB", size, (220, 230, 225)), img, coast.point(lambda v: v // 2))
    img.paste(lines, (0, 0), lines)

    if highlight:
        red = _tint(Image.new("RGB", size, RED), tex, 0.8)
        outline = red_mask.filter(ImageFilter.MaxFilter(scale * 2 + 1))
        img = Image.composite(Image.new("RGB", size, (255, 255, 255)), img, outline)
        img = Image.composite(red, img, red_mask)

    draw = ImageDraw.Draw(img)
    for code in highlight:
        main = max(_main_polygons(code), key=lambda p: _ring_area(p[0]))
        cx, cy = _centroid(project(main[0]))
        if 0 < cx < w and 0 < cy < h:
            label(draw, (cx, cy), known[code]["name"].upper(), size=h // 22)
    if headline_size:
        headline(draw, caption, w, h, headline_size)
    elif caption:
        label(draw, (w * 0.05, h * 0.08), caption.upper(), size=h // 14,
              fill=YELLOW, anchor="lt")
    return img


def render_text(text: str, size=(2560, 1440), seed=0) -> Image.Image:
    """Big statement card for numbers and quotes."""
    w, h = size
    tex = _texture(size, seed)
    img = Image.composite(Image.new("RGB", size, (30, 30, 34)), Image.new("RGB", size, (12, 12, 14)), tex)
    draw = ImageDraw.Draw(img)
    words, lines, line = text.upper().split(), [], ""
    f = font(h // 7)
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=f) > w * 0.8 and line:
            lines.append(line)
            line = word
        else:
            line = trial
    lines.append(line)
    step = h // 6
    top = h / 2 - step * (len(lines) - 1) / 2
    for i, line in enumerate(lines):
        color = YELLOW if i == len(lines) - 1 else (255, 255, 255)
        draw.text((w / 2, top + i * step), line, font=f, fill=color, anchor="mm")
    return img


def render_image(path: Path, size=(2560, 1440)) -> Image.Image:
    """Fill the frame with a user-supplied image, cropping to 16:9."""
    img = Image.open(path).convert("RGB")
    w, h = size
    s = max(w / img.width, h / img.height)
    img = img.resize((math.ceil(img.width * s), math.ceil(img.height * s)), Image.LANCZOS)
    left, top = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))
