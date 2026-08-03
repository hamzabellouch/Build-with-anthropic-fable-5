"""Small shared helpers: colors, easing, noise, geometry."""
from __future__ import annotations

import numpy as np

# ---------------------------------------------------------------- colors

NAMED_COLORS = {
    "black": (24, 20, 18),
    "ink": (24, 20, 18),
    "sepia": (78, 46, 22),
    "blue": (16, 38, 110),
    "royal": (16, 38, 110),
    "red": (140, 22, 28),
    "green": (16, 86, 52),
    "white": (244, 242, 238),
    "chalk": (236, 236, 230),
    "gold": (178, 134, 32),
    "neon": (64, 255, 208),
    "magenta": (255, 64, 160),
    "amber": (255, 176, 32),
}


def parse_color(spec, fallback=(24, 20, 18)):
    """Accept '#rrggbb', '#rgb', 'r,g,b' or a named color."""
    if spec is None:
        return tuple(fallback)
    if isinstance(spec, (tuple, list)):
        return tuple(int(c) for c in spec[:3])
    s = str(spec).strip().lower()
    if s in NAMED_COLORS:
        return NAMED_COLORS[s]
    if s.startswith("#"):
        h = s[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        if len(h) >= 6:
            return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    if "," in s:
        parts = [p for p in s.split(",") if p.strip()]
        if len(parts) >= 3:
            return tuple(max(0, min(255, int(float(p)))) for p in parts[:3])
    raise ValueError(f"cannot parse color {spec!r}")


def darken(rgb, f):
    return tuple(int(c * (1.0 - f)) for c in rgb)


def lighten(rgb, f):
    return tuple(int(c + (255 - c) * f) for c in rgb)


def mix(a, b, t):
    return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))


def luma(rgb):
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]

# ---------------------------------------------------------------- easing


def ease_in_out(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def ease_out(t):
    t = np.clip(t, 0.0, 1.0)
    return 1.0 - (1.0 - t) ** 2.4


def clamp(v, lo, hi):
    return max(lo, min(hi, v))

# ---------------------------------------------------------------- noise


def smooth_noise(rng, w, h, cells, lo=0.0, hi=1.0):
    """Band-limited value noise: small random grid upscaled bicubically."""
    from PIL import Image
    cw = max(2, int(cells))
    ch = max(2, int(round(cells * h / max(1, w))))
    small = (rng.random((ch, cw)) * 255).astype(np.uint8)
    img = Image.fromarray(small, "L").resize((w, h), Image.BICUBIC)
    arr = np.asarray(img).astype(np.float32) / 255.0
    return lo + arr * (hi - lo)


def fbm_noise(rng, w, h, octaves=((6, 0.55), (24, 0.3), (90, 0.15))):
    """A few octaves of smooth noise, normalized to 0..1."""
    acc = np.zeros((h, w), np.float32)
    total = 0.0
    for cells, amp in octaves:
        acc += smooth_noise(rng, w, h, cells) * amp
        total += amp
    return acc / max(total, 1e-6)

# ---------------------------------------------------------------- geometry


def bezier_points(p0, p1, p2, p3, n):
    """Sample a cubic Bezier as an (n,2) float array."""
    t = np.linspace(0.0, 1.0, n)[:, None]
    p0, p1, p2, p3 = (np.asarray(p, np.float32) for p in (p0, p1, p2, p3))
    return ((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1
            + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3)


def polyline_length(pts):
    pts = np.asarray(pts, np.float32)
    if len(pts) < 2:
        return 0.0
    return float(np.sum(np.hypot(*(pts[1:] - pts[:-1]).T)))


def cumulative_arclength(pts):
    pts = np.asarray(pts, np.float32)
    if len(pts) == 0:
        return np.zeros(0, np.float32)
    seg = np.hypot(*(pts[1:] - pts[:-1]).T) if len(pts) > 1 else np.zeros(0)
    return np.concatenate([[0.0], np.cumsum(seg)]).astype(np.float32)


def resample_polyline(pts, step):
    """Resample to roughly uniform spacing `step` (keeps endpoints)."""
    pts = np.asarray(pts, np.float32)
    if len(pts) < 2:
        return pts
    cum = cumulative_arclength(pts)
    total = cum[-1]
    if total < step:
        return pts[[0, -1]]
    n = max(2, int(round(total / step)) + 1)
    s = np.linspace(0, total, n)
    x = np.interp(s, cum, pts[:, 0])
    y = np.interp(s, cum, pts[:, 1])
    return np.stack([x, y], axis=1).astype(np.float32)
