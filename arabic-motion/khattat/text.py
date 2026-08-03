"""Text shaping and layout.

Words are shaped with HarfBuzz in font units and laid out on a supersampled
canvas. Each word keeps its glyphs in *logical* (writing) order so the
animation can draw them the way a hand would, while positions follow visual
(RTL) order.
"""
from __future__ import annotations

import unicodedata
from dataclasses import dataclass, field
from functools import lru_cache

import uharfbuzz as hb

ARABIC_INDIC = {ord(str(i)): chr(0x0660 + i) for i in range(10)}
WESTERN = {0x0660 + i: str(i) for i in range(10)}


def normalize_text(text: str, digits: str = "keep") -> str:
    text = unicodedata.normalize("NFC", text)
    if digits == "arabic":
        text = text.translate(ARABIC_INDIC)
    elif digits == "western":
        text = text.translate(WESTERN)
    return text


def token_direction(token: str, base: str = "rtl") -> str:
    """First strong character wins; digit-only tokens run LTR internally."""
    saw_digit = False
    for ch in token:
        b = unicodedata.bidirectional(ch)
        if b in ("R", "AL"):
            return "rtl"
        if b == "L":
            return "ltr"
        if b in ("EN", "AN"):
            saw_digit = True
    return "ltr" if saw_digit else base


def has_tashkil(text: str) -> bool:
    return any(unicodedata.combining(ch) for ch in text)

# ---------------------------------------------------------------- shaping


@dataclass
class ShapedGlyph:
    gid: int
    x: float          # font units, word-local, x grows rightward
    y: float          # font units, positive = up (HarfBuzz convention)
    cluster: int
    char: str
    is_mark: bool
    logical: int      # 0 = written first


@dataclass
class ShapedWord:
    text: str
    direction: str
    glyphs: list[ShapedGlyph]
    width: float      # advance width in font units


class Shaper:
    def __init__(self, font_path):
        self.path = str(font_path)
        blob = hb.Blob.from_file_path(self.path)
        face = hb.Face(blob)
        self.upem = face.upem
        self.font = hb.Font(face)
        self.font.scale = (self.upem, self.upem)
        try:
            ext = self.font.get_font_h_extents()
            self.ascender = ext.ascender
            self.descender = ext.descender
        except Exception:  # noqa: BLE001
            self.ascender, self.descender = int(self.upem * 0.8), -int(self.upem * 0.2)
        self._cache: dict[tuple[str, str], ShapedWord] = {}
        self.space_advance = self._space_advance()

    def _space_advance(self) -> float:
        buf = hb.Buffer()
        buf.add_str(" ")
        buf.guess_segment_properties()
        hb.shape(self.font, buf)
        pos = buf.glyph_positions
        return float(pos[0].x_advance) if pos else self.upem * 0.25

    def shape_word(self, text: str, direction: str) -> ShapedWord:
        key = (text, direction)
        if key in self._cache:
            return self._cache[key]
        buf = hb.Buffer()
        buf.add_str(text)
        buf.cluster_level = 1  # monotone characters: marks keep their own cluster
        buf.guess_segment_properties()
        buf.direction = direction
        hb.shape(self.font, buf)
        infos, positions = buf.glyph_infos, buf.glyph_positions

        # absolute positions in visual order (origin = left edge of word)
        pen_x = 0.0
        placed = []
        for info, pos in zip(infos, positions):
            cluster = min(info.cluster, len(text) - 1)
            ch = text[cluster]
            is_mark = unicodedata.combining(ch) != 0 or unicodedata.category(ch).startswith("M")
            placed.append(ShapedGlyph(
                gid=info.codepoint,
                x=pen_x + pos.x_offset,
                y=pos.y_offset,
                cluster=cluster,
                char=ch,
                is_mark=is_mark,
                logical=-1,
            ))
            pen_x += pos.x_advance
        width = pen_x

        # logical (writing) order: group runs of identical cluster, reverse
        # the group sequence for RTL, keep base-then-mark order inside groups.
        groups: list[list[ShapedGlyph]] = []
        for g in placed:
            if groups and groups[-1][0].cluster == g.cluster:
                groups[-1].append(g)
            else:
                groups.append([g])
        if direction == "rtl":
            groups.reverse()
        n = 0
        for grp in groups:
            for g in grp:
                g.logical = n
                n += 1
        word = ShapedWord(text=text, direction=direction, glyphs=placed, width=width)
        self._cache[key] = word
        return word

    def measure(self, text: str, direction: str) -> float:
        return self.shape_word(text, direction).width

# ---------------------------------------------------------------- layout


@dataclass
class PlacedWord:
    shaped: ShapedWord
    x: float           # canvas px: left edge of word advance box
    y: float           # canvas px: baseline
    line: int
    index: int         # logical order across the whole text


@dataclass
class TextLayout:
    words: list[PlacedWord]
    font_px: float     # canvas px (supersampled)
    scale: float       # px per font unit
    width: int
    height: int
    baselines: list[float]
    line_height: float
    space_px: float
    has_marks: bool


def _wrap(tokens, dirs, widths, space, avail):
    """Greedy wrap by advance width (direction-agnostic). Returns line slices."""
    lines, cur, cur_w = [], [], 0.0
    for tok, w in zip(tokens, widths):
        add = w if not cur else w + space
        if cur and cur_w + add > avail:
            lines.append(cur)
            cur, cur_w = [tok], w
        else:
            cur.append(tok)
            cur_w += add
    if cur:
        lines.append(cur)
    return lines


def layout_text(shaper: Shaper, text: str, width: int, height: int, *,
                margin_frac: float = 0.08, align: str = "center",
                font_px: float | None = None, base_dir: str = "rtl",
                reserve_bottom: float = 0.0, max_font_frac: float = 0.27,
                wrap: bool = True) -> TextLayout:
    """Lay text out on a width×height canvas (already supersampled)."""
    paragraphs = [p for p in text.split("\n")]
    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    if not paragraphs:
        raise ValueError("no text to render")

    marks = has_tashkil(text)
    line_factor = 1.82 if marks else 1.52
    upem = shaper.upem
    margin = margin_frac * min(width, height)
    avail_w = width - 2 * margin
    avail_h = height - 2 * margin - reserve_bottom

    para_tokens = []
    for p in paragraphs:
        toks = p.split()
        dirs = [token_direction(t, base_dir) for t in toks]
        widths = [shaper.measure(t, d) for t, d in zip(toks, dirs)]
        para_tokens.append((toks, dirs, widths))

    def lines_for(px: float):
        """Wrap every paragraph at font size px; None if a word can't fit."""
        s = px / upem
        out = []
        for toks, dirs, widths in para_tokens:
            if max(widths) * s > avail_w:
                return None
            if wrap:
                wrapped = _wrap(toks, dirs, [w * s for w in widths],
                                shaper.space_advance * s, avail_w)
            else:
                wrapped = [toks]
                if sum(widths) * s + (len(toks) - 1) * shaper.space_advance * s > avail_w:
                    return None
            idx = 0
            for line in wrapped:
                k = len(line)
                out.append((toks[idx:idx + k], dirs[idx:idx + k], widths[idx:idx + k]))
                idx += k
        return out

    def fits(px: float) -> bool:
        ls = lines_for(px)
        if ls is None:
            return False
        block = (len(ls) - 1) * line_factor * px + 1.35 * px
        return block <= avail_h

    if font_px is None:
        lo, hi = 8.0, max_font_frac * height
        if not fits(lo):
            raise ValueError("text too long for this canvas — raise --size or shorten it")
        for _ in range(28):
            mid = (lo + hi) / 2
            if fits(mid):
                lo = mid
            else:
                hi = mid
        font_px = lo * 0.97
    elif not fits(font_px):
        # honor the user's size but warn-by-shrinking only if impossible
        while font_px > 8 and not fits(font_px):
            font_px *= 0.94

    font_px = max(8.0, font_px)
    s = font_px / upem
    lines = lines_for(font_px)
    line_height = line_factor * font_px
    space_px = shaper.space_advance * s

    asc = min(shaper.ascender, 1.45 * upem) * s
    desc = min(-shaper.descender, 0.95 * upem) * s
    n = len(lines)
    block_h = (n - 1) * line_height + asc + desc
    top = (height - reserve_bottom - block_h) / 2
    baselines = [top + asc + i * line_height for i in range(n)]

    words: list[PlacedWord] = []
    index = 0
    for li, (toks, dirs, widths) in enumerate(lines):
        line_w = sum(w * s for w in widths) + space_px * (len(toks) - 1)
        if align == "center":
            right = width / 2 + line_w / 2
        elif align == "left":
            right = margin + line_w
        else:  # right
            right = width - margin
        baseline = baselines[li]

        shaped = [shaper.shape_word(t, d) for t, d in zip(toks, dirs)]
        i = 0
        cursor = right
        order = []
        while i < len(shaped):
            if dirs[i] == "ltr":
                j = i
                while j + 1 < len(shaped) and dirs[j + 1] == "ltr":
                    j += 1
                group_w = sum(sh.width * s for sh in shaped[i:j + 1]) + space_px * (j - i)
                x_left = cursor - group_w
                for k in range(i, j + 1):
                    order.append((k, x_left))
                    x_left += shaped[k].width * s + space_px
                cursor -= group_w + space_px
                i = j + 1
            else:
                w_px = shaped[i].width * s
                order.append((i, cursor - w_px))
                cursor -= w_px + space_px
                i += 1
        # `order` was appended in logical (writing) order; keep it that way
        order.sort(key=lambda kx: kx[0])
        for k, x_left in order:
            words.append(PlacedWord(shaped=shaped[k], x=x_left, y=baseline,
                                    line=li, index=index))
            index += 1

    return TextLayout(words=words, font_px=font_px, scale=s, width=width,
                      height=height, baselines=baselines, line_height=line_height,
                      space_px=space_px, has_marks=marks)
