"""Procedural pen sprites: qalam, fountain, pencil, chalk, brush.

Each pen is drawn vertically (nib at bottom-center) at 2× and rotated to the
writing angle. The compositor pastes it with its nib on the ink frontier.
"""
from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TILT_DEG = 38.0  # body leans up-right, the right-handed Arabic grip


def _rotate(img: Image.Image, nib_xy, deg):
    w, h = img.size
    cx, cy = w / 2, h / 2
    rot = img.rotate(deg, resample=Image.BICUBIC, expand=True)
    rad = math.radians(deg)
    dx, dy = nib_xy[0] - cx, nib_xy[1] - cy
    # PIL rotates counter-clockwise; y axis points down
    rx = dx * math.cos(rad) + dy * math.sin(rad)
    ry = -dx * math.sin(rad) + dy * math.cos(rad)
    return rot, (rot.size[0] / 2 + rx, rot.size[1] / 2 + ry)


def _shade_body(d, poly, base, hi, lo):
    """Polygon body with a simple three-band sheen."""
    d.polygon(poly, fill=base)
    xs = [p[0] for p in poly]
    x0, x1 = min(xs), max(xs)
    wdt = x1 - x0
    ys = [p[1] for p in poly]
    y0, y1 = min(ys), max(ys)
    d.polygon([(x0 + wdt * 0.18, y0), (x0 + wdt * 0.38, y0),
               (x0 + wdt * 0.38, y1), (x0 + wdt * 0.18, y1)], fill=hi)
    d.polygon([(x0 + wdt * 0.78, y0), (x0 + wdt * 0.97, y0),
               (x0 + wdt * 0.97, y1), (x0 + wdt * 0.78, y1)], fill=lo)


def _build_vertical(kind: str, em: float):
    """Draw the pen pointing down in a tall canvas. Returns (img, nib_xy)."""
    s = 2  # internal supersample
    L = int(1.55 * em) * s
    W = int(0.34 * em) * s
    img = Image.new("RGBA", (W, L + 8 * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = W / 2
    nib = (cx, L + 4 * s)
    bw = 0.072 * em * s  # half body width

    if kind == "qalam":
        body = [(cx - bw, 0), (cx + bw, 0),
                (cx + bw * 0.72, L * 0.80), (cx - bw * 0.72, L * 0.80)]
        _shade_body(d, body, (172, 134, 86, 255), (196, 160, 110, 255), (140, 104, 62, 255))
        for fy in (0.18, 0.43, 0.66):
            d.line([(cx - bw * 0.9, L * fy), (cx + bw * 0.9, L * fy + 3 * s)],
                   fill=(120, 88, 52, 130), width=s)
        # oblique-cut nib
        d.polygon([(cx - bw * 0.72, L * 0.80), (cx + bw * 0.72, L * 0.80),
                   (cx + bw * 0.30, nib[1]), (cx - bw * 0.18, nib[1] - 2 * s)],
                  fill=(94, 64, 38, 255))
        d.polygon([(cx - bw * 0.35, L * 0.86), (cx - bw * 0.05, L * 0.86),
                   (cx + bw * 0.06, nib[1] - s), (cx - bw * 0.16, nib[1] - s)],
                  fill=(40, 26, 16, 255))
        d.line([(cx - bw * 0.02, L * 0.84), (cx + bw * 0.04, nib[1] - s)],
               fill=(30, 20, 14, 255), width=s)

    elif kind == "fountain":
        body = [(cx - bw, 0), (cx + bw, 0),
                (cx + bw * 0.92, L * 0.62), (cx - bw * 0.92, L * 0.62)]
        _shade_body(d, body, (36, 36, 42, 255), (90, 92, 104, 255), (18, 18, 22, 255))
        d.rectangle([cx - bw, L * 0.58, cx + bw, L * 0.62],
                    fill=(212, 178, 96, 255))
        d.polygon([(cx - bw * 0.92, L * 0.62), (cx + bw * 0.92, L * 0.62),
                   (cx + bw * 0.20, nib[1]), (cx - bw * 0.20, nib[1])],
                  fill=(226, 228, 234, 255))
        d.polygon([(cx - bw * 0.45, L * 0.70), (cx - bw * 0.15, L * 0.70),
                   (cx - bw * 0.02, nib[1] - 2 * s)],
                  fill=(176, 180, 190, 255))
        d.line([(cx, L * 0.74), (cx, nib[1] - 2 * s)], fill=(120, 124, 134, 255),
               width=s)
        e = 2.4 * s
        d.ellipse([cx - e, L * 0.74 - e, cx + e, L * 0.74 + e],
                  fill=(120, 124, 134, 255))

    elif kind == "pencil":
        body = [(cx - bw, 0), (cx + bw, 0), (cx + bw, L * 0.74), (cx - bw, L * 0.74)]
        _shade_body(d, body, (238, 178, 44, 255), (250, 206, 96, 255), (198, 140, 30, 255))
        d.line([(cx - bw * 0.36, 0), (cx - bw * 0.36, L * 0.74)],
               fill=(208, 148, 34, 190), width=s)
        d.line([(cx + bw * 0.36, 0), (cx + bw * 0.36, L * 0.74)],
               fill=(208, 148, 34, 190), width=s)
        d.rectangle([cx - bw, 0, cx + bw, L * 0.07], fill=(222, 120, 130, 255))
        d.rectangle([cx - bw, L * 0.07, cx + bw, L * 0.095], fill=(168, 170, 178, 255))
        d.polygon([(cx - bw, L * 0.74), (cx + bw, L * 0.74),
                   (cx + bw * 0.16, L * 0.94), (cx - bw * 0.16, L * 0.94)],
                  fill=(228, 192, 140, 255))
        d.polygon([(cx - bw * 0.16, L * 0.94), (cx + bw * 0.16, L * 0.94),
                   (cx, nib[1])], fill=(64, 64, 68, 255))

    elif kind == "chalk":
        top = L * 0.62
        body = [(cx - bw, top), (cx + bw, top),
                (cx + bw * 0.94, nib[1] - 2 * s), (cx - bw * 0.94, nib[1] - 2 * s)]
        _shade_body(d, body, (235, 235, 230, 255), (250, 250, 247, 255), (204, 204, 198, 255))
        d.ellipse([cx - bw, top - 3 * s, cx + bw, top + 3 * s],
                  fill=(242, 242, 238, 255))
        d.ellipse([cx - bw * 0.94, nib[1] - 5 * s, cx + bw * 0.94, nib[1] + s],
                  fill=(222, 222, 216, 255))
        nib = (cx, nib[1] - 2 * s)

    elif kind == "brush":
        body = [(cx - bw * 0.8, 0), (cx + bw * 0.8, 0),
                (cx + bw * 0.62, L * 0.60), (cx - bw * 0.62, L * 0.60)]
        _shade_body(d, body, (96, 56, 36, 255), (134, 86, 58, 255), (66, 36, 22, 255))
        d.rectangle([cx - bw * 0.66, L * 0.60, cx + bw * 0.66, L * 0.68],
                    fill=(196, 158, 78, 255))
        d.polygon([(cx - bw * 0.66, L * 0.68), (cx + bw * 0.66, L * 0.68),
                   (cx + bw * 0.10, nib[1]), (cx - bw * 0.02, nib[1])],
                  fill=(28, 24, 22, 255))
        for fx in (-0.4, -0.15, 0.18, 0.42):
            d.line([(cx + bw * fx, L * 0.70), (cx + bw * fx * 0.2, nib[1] - 4 * s)],
                   fill=(50, 44, 42, 200), width=s)

    else:
        raise KeyError(f"unknown pen '{kind}'")

    img = img.resize((W // s, (L + 8 * s) // s), Image.LANCZOS)
    return img, (nib[0] / s, nib[1] / s)


class PenSprite:
    def __init__(self, kind: str, em: float):
        self.kind = kind
        base, nib = _build_vertical(kind, em)
        self.img, self.nib = _rotate(base, nib, -TILT_DEG)
        sil = self.img.split()[3].point(lambda a: min(110, a))
        shadow = Image.merge("RGBA", (Image.new("L", self.img.size, 8),) * 3 + (sil,))
        self.shadow = shadow.filter(ImageFilter.GaussianBlur(em * 0.02))
        rad = math.radians(TILT_DEG)
        self.axis = np.array([math.sin(rad), -math.cos(rad)], np.float32)  # nib→body
        self._wobble_cache: dict[int, tuple] = {}

    def at_angle(self, extra_deg: float):
        """Rotated copy for wobble; quantized & cached."""
        key = int(round(extra_deg * 2))
        if key not in self._wobble_cache:
            img, nib = _rotate(self.img, self.nib, key / 2)
            if len(self._wobble_cache) > 60:
                self._wobble_cache.clear()
            self._wobble_cache[key] = (img, nib)
        return self._wobble_cache[key]
