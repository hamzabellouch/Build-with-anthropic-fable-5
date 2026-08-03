"""Procedural paper textures — no image assets, fully deterministic."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .util import fbm_noise, parse_color, smooth_noise


def _vignette(rgb: np.ndarray, strength=0.16):
    h, w = rgb.shape[:2]
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    r2 = (((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    fall = 1.0 - strength * np.clip(r2, 0, 1.4) ** 1.4
    return (rgb * fall[..., None]).astype(np.uint8)


def _grainy(rgb, rng, amount=3.0):
    noise = rng.standard_normal(rgb.shape[:2])[..., None] * amount
    return np.clip(rgb.astype(np.float32) + noise, 0, 255).astype(np.uint8)


def make_paper(name: str, w: int, h: int, rng: np.random.Generator,
               baselines=None, em: float = 100.0, margin: float = 0.0):
    """-> (rgb uint8 HxWx3 or None for transparent, meta dict)."""
    name = (name or "cream").lower()
    meta = {"dark": False, "guideline": (140, 158, 178), "chalky": False}

    if name in ("none", "transparent", "alpha"):
        return None, {**meta, "dark": True, "guideline": (120, 120, 130)}

    if name == "white":
        base = np.full((h, w, 3), 251, np.float32)
        base += (smooth_noise(rng, w, h, 90, -1.5, 1.5))[..., None]
        return _vignette(_grainy(base, rng, 1.2), 0.06), meta

    if name == "cream":
        base = np.zeros((h, w, 3), np.float32)
        base[:] = (248, 242, 228)
        blotch = fbm_noise(rng, w, h)[..., None]
        base *= (0.985 + 0.03 * blotch)
        return _vignette(_grainy(base, rng, 1.6), 0.10), meta

    if name == "parchment":
        base = np.zeros((h, w, 3), np.float32)
        base[:] = (226, 206, 168)
        blotch = fbm_noise(rng, w, h, ((4, 0.5), (13, 0.3), (60, 0.2)))
        base *= (0.86 + 0.22 * blotch[..., None])
        # warm stains
        img = Image.fromarray(np.zeros((h, w), np.uint8))
        d = ImageDraw.Draw(img)
        for _ in range(7):
            cx, cy = rng.uniform(0, w), rng.uniform(0, h)
            rx, ry = rng.uniform(0.06, 0.22) * w, rng.uniform(0.05, 0.16) * h
            d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry],
                      fill=int(rng.uniform(26, 60)))
        stains = np.asarray(
            img.filter(ImageFilter.GaussianBlur(0.05 * w)), np.float32) / 255.0
        tint = np.array([142, 112, 70], np.float32)
        base = base * (1 - 0.5 * stains[..., None]) + tint * (0.5 * stains[..., None])
        out = _vignette(_grainy(base, rng, 2.4), 0.30)
        return out, {**meta, "guideline": (150, 122, 84)}

    if name == "lined":
        base = np.full((h, w, 3), 250, np.float32)
        base += smooth_noise(rng, w, h, 70, -1.2, 1.2)[..., None]
        img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(img, "RGBA")
        lw = max(1, int(em * 0.013))
        if baselines:
            step = baselines[1] - baselines[0] if len(baselines) > 1 else em * 1.7
            y = baselines[0] % step if step > 0 else em
            while y < h:
                d.line([(0, y), (w, y)], fill=(118, 150, 196, 150), width=lw)
                y += step
        else:
            step = em * 1.6
            for y in np.arange(step, h, step):
                d.line([(0, y), (w, y)], fill=(118, 150, 196, 150), width=lw)
        xm = w - margin if margin else w * 0.93
        d.line([(xm, 0), (xm, h)], fill=(214, 92, 92, 170), width=lw)
        return _vignette(np.asarray(img, np.uint8).copy(), 0.05), meta

    if name == "blackboard":
        base = np.zeros((h, w, 3), np.float32)
        base[:] = (24, 36, 31)
        cloud = fbm_noise(rng, w, h, ((5, 0.5), (18, 0.3), (70, 0.2)))
        base += (cloud[..., None] * np.array([26, 28, 26]) * 0.55)
        # eraser smudge streaks
        streak = smooth_noise(rng, w, max(2, h // 6), 16)
        streak = np.asarray(Image.fromarray((streak * 255).astype(np.uint8), "L")
                            .resize((w, h), Image.BILINEAR), np.float32) / 255.0
        base += (streak[..., None] * 14)
        out = _vignette(_grainy(base, rng, 2.0), 0.26)
        return out, {**meta, "dark": True, "chalky": True,
                     "guideline": (200, 210, 200)}

    if name == "dark":
        base = np.zeros((h, w, 3), np.float32)
        base[:] = (17, 17, 22)
        base += fbm_noise(rng, w, h)[..., None] * 7
        return _vignette(_grainy(base, rng, 1.4), 0.28), \
            {**meta, "dark": True, "guideline": (90, 90, 105)}

    if name == "midnight":
        base = np.zeros((h, w, 3), np.float32)
        y = np.linspace(0, 1, h)[:, None, None]
        top = np.array([12, 16, 34], np.float32)
        bot = np.array([28, 18, 44], np.float32)
        base[:] = top + (bot - top) * y
        base += fbm_noise(rng, w, h)[..., None] * 6
        return _vignette(_grainy(base, rng, 1.4), 0.24), \
            {**meta, "dark": True, "guideline": (96, 92, 120)}

    # custom flat color
    rgb = parse_color(name, fallback=(248, 242, 228))
    base = np.zeros((h, w, 3), np.float32)
    base[:] = rgb
    base += fbm_noise(rng, w, h)[..., None] * 4 - 2
    dark = sum(rgb) < 360
    return _vignette(_grainy(base, rng, 1.5), 0.12), \
        {**meta, "dark": dark,
         "guideline": (110, 110, 122) if dark else (150, 160, 175)}


def draw_guidelines(rgb: np.ndarray, baselines, em: float, color,
                    margin: float = 0.0):
    """Faint dotted baselines drawn onto the paper."""
    img = Image.fromarray(rgb)
    d = ImageDraw.Draw(img, "RGBA")
    lw = max(1, int(em * 0.012))
    dash, gap = int(em * 0.16), int(em * 0.12)
    w = rgb.shape[1]
    for y in baselines:
        x = margin
        while x < w - margin:
            d.line([(x, y), (min(x + dash, w - margin), y)],
                   fill=(*color, 110), width=lw)
            x += dash + gap
    return np.asarray(img, np.uint8).copy()
