"""Rasterize shaped words and split them into drawable parts.

A word is rendered the way a calligrapher thinks about it:
  * rasm  — the connected letter bodies (one merged bitmap per component)
  * dots  — the i'jam, detached small components found by labeling
  * marks — tashkil glyphs (fatha, damma, kasra, shadda, sukun, ...)
"""
from __future__ import annotations

from dataclasses import dataclass, field

import freetype
import numpy as np
from scipy import ndimage

from .text import PlacedWord, TextLayout

EIGHT = np.ones((3, 3), dtype=np.uint8)


@dataclass
class Patch:
    x: int
    y: int
    a: np.ndarray  # uint8 alpha

    @property
    def bbox(self):
        h, w = self.a.shape
        return (self.x, self.y, self.x + w, self.y + h)


@dataclass
class DrawComp:
    patch: Patch
    kind: str            # 'rasm' | 'dot' | 'mark' | 'flourish'
    order_x: float       # ordering anchor (center / right edge)
    logical: int = 0     # stable tiebreak (glyph writing order)
    strokes: list = field(default_factory=list)


@dataclass
class WordArt:
    placed: PlacedWord
    rasm: list[DrawComp]
    dots: list[DrawComp]
    marks: list[DrawComp]
    bbox: tuple[int, int, int, int]

    @property
    def all_comps(self):
        return self.rasm + self.dots + self.marks

    @property
    def text(self):
        return self.placed.shaped.text


class GlyphRenderer:
    def __init__(self, font_path: str, font_px: float, upem: int):
        self.face = freetype.Face(str(font_path))
        self.face.set_char_size(int(round(font_px * 64)), 0, 72, 72)
        self.font_px = font_px
        self.scale = font_px / upem
        self.flags = (freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_HINTING)
        self._cache: dict[int, tuple[np.ndarray, int, int]] = {}

    def glyph_bitmap(self, gid: int):
        """-> (alpha uint8 HxW, bitmap_left, bitmap_top); origin on baseline."""
        hit = self._cache.get(gid)
        if hit is not None:
            return hit
        self.face.load_glyph(gid, self.flags)
        slot = self.face.glyph
        bmp = slot.bitmap
        if bmp.rows == 0 or bmp.width == 0:
            out = (np.zeros((0, 0), np.uint8), 0, 0)
        else:
            buf = np.asarray(bmp.buffer, dtype=np.uint8)
            pitch = abs(bmp.pitch)
            arr = buf.reshape(bmp.rows, pitch)[:, :bmp.width].copy()
            out = (arr, slot.bitmap_left, slot.bitmap_top)
        self._cache[gid] = out
        return out


def _paste_max(canvas, arr, x, y):
    h, w = arr.shape
    H, W = canvas.shape
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    sub = arr[y0 - y:y1 - y, x0 - x:x1 - x]
    np.maximum(canvas[y0:y1, x0:x1], sub, out=canvas[y0:y1, x0:x1])


def _crop_patch(canvas, ox, oy) -> Patch | None:
    ys, xs = np.nonzero(canvas)
    if len(xs) == 0:
        return None
    x0, x1 = xs.min(), xs.max() + 1
    y0, y1 = ys.min(), ys.max() + 1
    return Patch(ox + x0, oy + y0, np.ascontiguousarray(canvas[y0:y1, x0:x1]))


def build_word_art(renderer: GlyphRenderer, placed: PlacedWord, em: float) -> WordArt | None:
    """Rasterize one word and split into rasm / dots / marks."""
    s = renderer.scale
    base_parts, mark_parts = [], []
    for g in placed.shaped.glyphs:
        arr, left, top = renderer.glyph_bitmap(g.gid)
        if arr.size == 0:
            continue
        gx = int(round(placed.x + g.x * s + left))
        gy = int(round(placed.y - g.y * s - top))
        (mark_parts if g.is_mark else base_parts).append((g, arr, gx, gy))

    if not base_parts and not mark_parts:
        return None

    rasm: list[DrawComp] = []
    dots: list[DrawComp] = []
    marks: list[DrawComp] = []

    if base_parts:
        x0 = min(p[2] for p in base_parts)
        y0 = min(p[3] for p in base_parts)
        x1 = max(p[2] + p[1].shape[1] for p in base_parts)
        y1 = max(p[3] + p[1].shape[0] for p in base_parts)
        canvas = np.zeros((y1 - y0, x1 - x0), np.uint8)
        glyph_order = np.full(canvas.shape, 10 ** 6, np.int32)  # earliest glyph touching each px
        for g, arr, gx, gy in base_parts:
            _paste_max(canvas, arr, gx - x0, gy - y0)
            sl = (slice(gy - y0, gy - y0 + arr.shape[0]),
                  slice(gx - x0, gx - x0 + arr.shape[1]))
            region = glyph_order[sl]
            np.minimum(region, np.where(arr > 24, g.logical, 10 ** 6), out=region)

        labels, n = ndimage.label(canvas >= 96, structure=EIGHT)
        dot_dim = 0.20 * em
        dot_area = 0.024 * em * em
        for ci in range(1, n + 1):
            mask = labels == ci
            comp = np.where(mask, canvas, 0)
            p = _crop_patch(comp, x0, y0)
            if p is None:
                continue
            h, w = p.a.shape
            area = int(np.count_nonzero(mask))
            first_glyph = int(glyph_order[mask].min())
            comp_obj = DrawComp(patch=p, kind="rasm",
                                order_x=p.x + w,  # right edge
                                logical=first_glyph)
            if max(h, w) <= dot_dim and area <= dot_area:
                comp_obj.kind = "dot"
                comp_obj.order_x = p.x + w / 2
                dots.append(comp_obj)
            else:
                rasm.append(comp_obj)

    for g, arr, gx, gy in mark_parts:
        p = Patch(gx, gy, arr.copy())
        marks.append(DrawComp(patch=p, kind="mark",
                              order_x=gx + arr.shape[1] / 2, logical=g.logical))

    parts = rasm + dots + marks
    if not parts:
        return None
    bx0 = min(c.patch.x for c in parts)
    by0 = min(c.patch.y for c in parts)
    bx1 = max(c.patch.x + c.patch.a.shape[1] for c in parts)
    by1 = max(c.patch.y + c.patch.a.shape[0] for c in parts)

    rtl = placed.shaped.direction == "rtl"
    # writing order inside the word: rasm by glyph order, then by edge position
    rasm.sort(key=lambda c: (c.logical, -c.order_x if rtl else c.order_x))
    dots.sort(key=lambda c: -c.order_x if rtl else c.order_x)
    marks.sort(key=lambda c: -c.order_x if rtl else c.order_x)

    return WordArt(placed=placed, rasm=rasm, dots=dots, marks=marks,
                   bbox=(bx0, by0, bx1, by1))


def build_all_words(layout: TextLayout, font_path: str, upem: int,
                    recentre: bool = True, reserve_bottom: float = 0.0):
    renderer = GlyphRenderer(font_path, layout.font_px, upem)
    arts = []
    for pw in layout.words:
        art = build_word_art(renderer, pw, em=layout.font_px)
        if art is not None:
            arts.append(art)
    if not arts:
        raise ValueError("nothing rendered — does the font cover this text?")

    if recentre:
        y0 = min(a.bbox[1] for a in arts)
        y1 = max(a.bbox[3] for a in arts)
        target_mid = (layout.height - reserve_bottom) / 2
        shift = int(round(target_mid - (y0 + y1) / 2))
        shift = max(-y0, min(layout.height - y1, shift))
        if shift:
            for a in arts:
                for c in a.all_comps:
                    c.patch.y += shift
                a.bbox = (a.bbox[0], a.bbox[1] + shift, a.bbox[2], a.bbox[3] + shift)
                a.placed.y += shift
    return arts
