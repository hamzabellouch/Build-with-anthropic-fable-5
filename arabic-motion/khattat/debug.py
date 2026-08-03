"""Debug renders: static composite, skeleton overlay, stroke-order map."""
from __future__ import annotations

import numpy as np
from PIL import Image

from .fonts import resolve
from .glyphs import build_all_words
from .text import Shaper, layout_text, normalize_text


def prepare(text, font="amiri", size=(1280, 720), ss=2, font_px=None, align="center"):
    path = resolve(font)
    shaper = Shaper(path)
    W, H = size[0] * ss, size[1] * ss
    text = normalize_text(text)
    layout = layout_text(shaper, text, W, H, align=align,
                         font_px=font_px * ss if font_px else None)
    arts = build_all_words(layout, path, shaper.upem)
    return shaper, layout, arts


def render_stroke_order(text, out="debug_order.png", font="amiri", size=(1280, 720), ss=2):
    """Rainbow map of writing order: red = written first, violet = last."""
    import colorsys

    from .plan import attach_strokes

    _, layout, arts = prepare(text, font, size, ss)
    order = attach_strokes(arts, layout)
    canvas = np.zeros((layout.height, layout.width, 3), np.uint8)
    canvas[:] = 255
    # faint glyph alphas underneath
    for art in arts:
        for comp in art.all_comps:
            p = comp.patch
            sl = (slice(p.y, p.y + p.a.shape[0]), slice(p.x, p.x + p.a.shape[1]))
            a = (p.a.astype(np.float32) / 255.0 * 0.14)[..., None]
            canvas[sl] = (canvas[sl] * (1 - a)).astype(np.uint8)

    total = sum(len(s.pts) for _, _, s in order) or 1
    img = Image.fromarray(canvas)
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    seen = 0
    for k, (_art, _comp, st) in enumerate(order):
        for i, (x, y) in enumerate(st.pts):
            hue = 0.83 * seen / total
            seen += 1
            r, g, b = (int(c * 255) for c in colorsys.hsv_to_rgb(hue, 0.95, 0.92))
            rr = max(1.5, float(st.radii[min(i, len(st.radii) - 1)]) * 0.35)
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(r, g, b))
        x0, y0 = st.pts[0]
        d.ellipse([x0 - 6, y0 - 6, x0 + 6, y0 + 6], outline=(0, 0, 0), width=3)
    img = img.resize(size, Image.LANCZOS)
    img.save(out)
    print(f"strokes={len(order)} skeleton_pts={total}")
    return out


def render_static(text, out="debug_static.png", font="amiri", size=(1280, 720), ss=2):
    _, layout, arts = prepare(text, font, size, ss)
    canvas = np.zeros((layout.height, layout.width), np.uint8)
    tint = np.zeros((layout.height, layout.width, 3), np.uint8)
    tint[:] = (255, 255, 255)
    colors = {"rasm": (20, 20, 30), "dot": (180, 30, 30), "mark": (20, 110, 200)}
    for art in arts:
        for comp in art.all_comps:
            p = comp.patch
            h, w = p.a.shape
            sl = (slice(p.y, p.y + h), slice(p.x, p.x + w))
            a = p.a.astype(np.float32)[..., None] / 255.0
            col = np.array(colors[comp.kind], np.float32)
            tint[sl] = (tint[sl] * (1 - a) + col * a).astype(np.uint8)
            np.maximum(canvas[sl], p.a, out=canvas[sl])
    img = Image.fromarray(tint).resize(size, Image.LANCZOS)
    img.save(out)
    n_comps = sum(len(a.rasm) for a in arts), sum(len(a.dots) for a in arts), sum(len(a.marks) for a in arts)
    print(f"words={len(arts)} rasm={n_comps[0]} dots={n_comps[1]} marks={n_comps[2]} font_px={layout.font_px:.0f}")
    return out
