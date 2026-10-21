"""Animated bar and line charts in the channel style, plus on-screen overlays."""

from functools import lru_cache

from PIL import Image, ImageDraw

from nk.maps import YELLOW, RED, _texture, font

SIZE = (1920, 1080)
SAND = (214, 196, 150)
GRID = (70, 70, 76)


def _ease(t: float) -> float:
    return 1 - (1 - t) ** 3


def _fmt(v: float, unit: str) -> str:
    text = f"{v:,.1f}".rstrip("0").rstrip(".")
    return f"{text}{unit}" if unit in ("%", "°") else f"{text} {unit}".strip()


@lru_cache(maxsize=8)
def _cached_background(seed: int) -> Image.Image:
    tex = _texture(SIZE, seed)
    return Image.composite(Image.new("RGB", SIZE, (34, 34, 38)), Image.new("RGB", SIZE, (16, 16, 18)), tex)


def _background(seed: int) -> Image.Image:
    return _cached_background(seed).copy()


def render_chart(spec: dict, progress: float, seed: int = 0) -> Image.Image:
    """One frame of the chart; progress 0..1 grows bars / draws the line."""
    img = _background(seed)
    d = ImageDraw.Draw(img)
    w, h = SIZE
    labels, values, unit = spec["labels"], spec["values"], spec["unit"]
    d.text((120, 80), spec["title"].upper(), font=font(84), fill=(255, 255, 255))
    if spec["source"]:
        d.text((120, h - 70), f"Source: {spec['source']}", font=font(30), fill=(150, 150, 150))

    left, right, top, bottom = 160, w - 120, 260, h - 170
    hi = max(max(values), 0) * 1.15 or 1
    lo = min(min(values), 0)
    lo = lo * 1.15 if lo < 0 else 0

    def y(v):
        return bottom - (v - lo) / (hi - lo) * (bottom - top)

    for i in range(5):
        gy = top + (bottom - top) * i / 4
        d.line((left, gy, right, gy), fill=GRID, width=2)
    d.line((left, y(0), right, y(0)), fill=(120, 120, 126), width=3)

    n = len(values)
    p = _ease(min(progress, 1.0))
    slot = (right - left) / n
    if spec["type"] == "line":
        pts = [(left + slot * (i + 0.5), y(v)) for i, v in enumerate(values)]
        reach = p * (n - 1)
        shown = [pts[i] for i in range(int(reach) + 1)]
        if int(reach) < n - 1:
            a, b = pts[int(reach)], pts[int(reach) + 1]
            f = reach - int(reach)
            shown.append((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f))
        if len(shown) > 1:
            d.line(shown, fill=RED, width=10, joint="curve")
        for i, (px, py) in enumerate(pts[: int(reach) + 1]):
            last = i == n - 1
            r = 14 if last else 9
            d.ellipse((px - r, py - r, px + r, py + r), fill=YELLOW if last else RED)
            d.text((px, py - 34), _fmt(values[i], unit), font=font(40 if last else 32),
                   fill=YELLOW if last else (235, 235, 235), anchor="ms")
            d.text((px, bottom + 24), labels[i], font=font(34), fill=(200, 200, 200), anchor="mt")
    else:
        bar_w = slot * 0.62
        peak = max(range(n), key=lambda i: values[i])
        for i, v in enumerate(values):
            cx = left + slot * (i + 0.5)
            top_y = y(v * p)
            color = RED if i == peak else SAND
            d.rectangle((cx - bar_w / 2, min(top_y, y(0)), cx + bar_w / 2, max(top_y, y(0))), fill=color)
            d.text((cx, top_y - 16), _fmt(v * p, unit), font=font(44),
                   fill=YELLOW if i == peak else (255, 255, 255), anchor="ms")
            d.text((cx, bottom + 24), labels[i], font=font(34 if n > 6 else 40),
                   fill=(200, 200, 200), anchor="mt")
    return img


def overlay(caption: str = "", credit: str = "") -> Image.Image:
    """Transparent 1920x1080 layer: caption tag top-left, source credit bottom-left."""
    img = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if caption:
        f = font(72)
        l, t, r, b = d.textbbox((96, 80), caption.upper(), font=f)
        d.rectangle((l - 18, t - 14, r + 18, b + 14), fill=(0, 0, 0, 255))
        d.text((96, 80), caption.upper(), font=f, fill=YELLOW)
    if credit:
        f = font(28)
        text = credit if len(credit) < 110 else credit[:107] + "..."
        l, t, r, b = d.textbbox((40, SIZE[1] - 40), text, font=f, anchor="ls")
        d.rectangle((l - 12, t - 8, r + 12, b + 8), fill=(0, 0, 0, 170))
        d.text((40, SIZE[1] - 40), text, font=f, fill=(235, 235, 235), anchor="ls")
    return img


def chapter_banner(title: str) -> Image.Image:
    """Lower-third chapter title shown for the first seconds of a chapter."""
    img = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font(64)
    x, y = 96, SIZE[1] - 230
    l, t, r, b = d.textbbox((x, y), title.upper(), font=f)
    d.rectangle((l - 22, t - 16, r + 22, b + 16), fill=(0, 0, 0, 235))
    d.rectangle((l - 22, t - 16, l - 10, b + 16), fill=RED + (255,))
    d.text((x, y), title.upper(), font=f, fill=(255, 255, 255))
    return img


def end_card(lines: list[str]) -> Image.Image:
    """Sources and credits card for the last seconds of the video."""
    img = _background(7)
    d = ImageDraw.Draw(img)
    d.text((120, 90), "SOURCES & CREDITS", font=font(80), fill=YELLOW)
    f = font(30)
    y = 230
    for line in lines[:22]:
        text = line if len(line) < 120 else line[:117] + "..."
        d.text((120, y), text, font=f, fill=(225, 225, 225))
        y += 36
    return img
