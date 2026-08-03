"""End-to-end render pipeline: text → shapes → strokes → schedule → video."""
from __future__ import annotations

import sys
import tempfile
import time
from pathlib import Path

import numpy as np

from . import fonts as fontlib
from .compose import Compositor
from .glyphs import WordArt, build_all_words
from .media import (VideoSink, have_ffmpeg, synth_audio, write_srt,
                    write_timeline)
from .paper import draw_guidelines, make_paper
from .pens import PenSprite
from .plan import attach_strokes, build_schedule
from .strokes import build_flourish
from .style import RenderConfig, resolve_ink
from .text import PlacedWord, ShapedWord, Shaper, layout_text, normalize_text


def _log(msg, quiet=False):
    if not quiet:
        print(msg, file=sys.stderr, flush=True)


def _make_flourish_art(arts, layout, rng):
    last_line = max(a.placed.line for a in arts)
    line_arts = [a for a in arts if a.placed.line == last_line]
    x0 = min(a.bbox[0] for a in line_arts)
    x1 = max(a.bbox[2] for a in line_arts)
    y_low = max(a.bbox[3] for a in line_arts)
    em = layout.font_px
    y = min(max(y_low + 0.32 * em, layout.baselines[-1] + 0.85 * em),
            layout.height - 0.30 * em)
    width = max((x1 - x0) * 0.62, 2.2 * em)
    comp = build_flourish((x0 + x1) / 2, y, width, em, rng)
    placed = PlacedWord(shaped=ShapedWord("﹏", "rtl", [], 0.0),
                        x=(x0 + x1) / 2, y=y, line=last_line,
                        index=max(a.placed.index for a in arts) + 1)
    return WordArt(placed=placed, rasm=[comp], dots=[], marks=[],
                   bbox=comp.patch.bbox)


def render(cfg: RenderConfig, quiet: bool = False) -> dict:
    t_wall = time.time()
    if not cfg.text or not cfg.text.strip():
        raise ValueError("no text given")

    w = cfg.size[0] - (cfg.size[0] % 2)
    h = cfg.size[1] - (cfg.size[1] % 2)
    cfg.size = (max(64, w), max(64, h))
    ss = max(1, cfg.supersample)
    W, H = cfg.size[0] * ss, cfg.size[1] * ss

    font_path = fontlib.resolve(cfg.font)
    _log(f"✼ font     {Path(font_path).name}", quiet)
    shaper = Shaper(font_path)
    text = normalize_text(cfg.text, cfg.digits)

    typewriter = cfg.mode == "typewriter"
    reserve = 0.0
    if cfg.flourish and not typewriter:
        reserve += 0.085 * H
    if cfg.title:
        reserve += 0.075 * H

    layout = layout_text(
        shaper, text, W, H, margin_frac=cfg.margin, align=cfg.align,
        font_px=cfg.font_size * ss if cfg.font_size else None,
        reserve_bottom=reserve, wrap=cfg.wrap)
    arts = build_all_words(layout, font_path, shaper.upem,
                           reserve_bottom=reserve)
    em = layout.font_px
    _log(f"✼ layout   {len(arts)} words · {len(layout.baselines)} line(s)"
         f" · {em / ss:.0f}px letters", quiet)

    rng = np.random.default_rng(cfg.seed)
    sequence = attach_strokes(arts, layout, order=cfg.order,
                              typewriter=typewriter)
    if cfg.flourish and not typewriter:
        fart = _make_flourish_art(arts, layout, rng)
        sequence.append((fart, fart.rasm[0], fart.rasm[0].strokes[0]))

    schedule = build_schedule(
        sequence, layout, speed=cfg.speed, lead=cfg.lead, hold=cfg.hold,
        duration=cfg.duration, seed=cfg.seed, typewriter=typewriter)
    n_strokes = sum(1 for e in schedule.events if e.kind in ("stroke", "stamp"))
    _log(f"✼ plan     {n_strokes} strokes · {schedule.duration:.1f}s"
         f" · order={'typewriter' if typewriter else cfg.order}", quiet)

    paper_rgb, meta = make_paper(cfg.paper, W, H, rng,
                                 baselines=layout.baselines, em=em,
                                 margin=cfg.margin * min(W, H))
    if cfg.guidelines and paper_rgb is not None:
        paper_rgb = draw_guidelines(paper_rgb, layout.baselines, em,
                                    meta["guideline"],
                                    margin=cfg.margin * min(W, H))
    if cfg.title and paper_rgb is not None:
        paper_rgb = _burn_title(paper_rgb, cfg.title, font_path, H, W, meta)

    ink = resolve_ink(cfg.ink, cfg.pen)
    pen_sprite = None
    if cfg.show_pen and cfg.pen not in ("none", "off") and not typewriter:
        pen_sprite = PenSprite(cfg.pen, em)

    comp = Compositor(cfg, layout, arts, schedule, ink, paper_rgb, meta,
                      pen_sprite, rng)

    fmt = cfg.resolved_format()
    out = Path(cfg.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    result = {"out": str(out), "duration": schedule.duration, "format": fmt}

    if fmt == "png":
        img = comp.final_still()
        img.save(out)
        _log(f"✼ still    {out}", quiet)
        return _sidecars(cfg, schedule, out, result, quiet, t_wall)

    audio_path = None
    if cfg.audio and fmt in ("mp4", "webm") and have_ffmpeg():
        audio_path = Path(tempfile.mkstemp(suffix=".wav", prefix="khattat_")[1])
        synth_audio(schedule, cfg.pen if not typewriter else "none", em, W,
                    audio_path, seed=cfg.seed, volume=cfg.volume,
                    paper_chalky=meta.get("chalky", False))
        _log("✼ audio    nib friction, taps & room tone", quiet)

    alpha = paper_rgb is None
    sink = VideoSink(out, cfg.size, cfg.fps, fmt=fmt, crf=cfg.crf,
                     audio=audio_path, alpha=alpha)
    n_frames = int(np.ceil(schedule.duration * cfg.fps))
    mark = max(1, n_frames // 10)
    for i in range(n_frames):
        t = (i + 0.5) / cfg.fps
        img = comp.frame_at(t)
        if alpha and img.mode != "RGBA":
            img = img.convert("RGBA")
        sink.write(img)
        if not quiet and (i % mark == 0 or i == n_frames - 1):
            pct = 100 * (i + 1) // n_frames
            print(f"\r✼ render   {pct:3d}%  ({i + 1}/{n_frames} frames)",
                  end="" if i < n_frames - 1 else "\n",
                  file=sys.stderr, flush=True)
    sink.close()
    if audio_path is not None:
        audio_path.unlink(missing_ok=True)

    return _sidecars(cfg, schedule, out, result, quiet, t_wall)


def _sidecars(cfg, schedule, out, result, quiet, t_wall):
    if cfg.srt:
        p = out.with_suffix(".srt")
        write_srt(schedule, p)
        result["srt"] = str(p)
        _log(f"✼ srt      {p}", quiet)
    if cfg.timeline:
        p = out.with_suffix(".timeline.json")
        write_timeline(schedule, cfg, p)
        result["timeline"] = str(p)
        _log(f"✼ timeline {p}", quiet)
    dt = time.time() - t_wall
    _log(f"✼ done     {out}  ({dt:.1f}s)", quiet)
    result["wall_seconds"] = dt
    return result


def _burn_title(paper_rgb, title, font_path, H, W, meta):
    from PIL import Image, ImageDraw, ImageFont

    from .text import token_direction
    img = Image.fromarray(paper_rgb)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    fnt = ImageFont.truetype(str(font_path), int(0.034 * H))
    color = (235, 230, 220, 150) if meta.get("dark") else (70, 60, 50, 150)
    direction = "rtl" if token_direction(title, "rtl") == "rtl" else "ltr"
    try:
        d.text((W // 2, int(H * 0.962)), title, font=fnt, fill=color,
               anchor="mm", direction=direction)
    except Exception:  # raqm missing
        d.text((W // 2, int(H * 0.962)), title, font=fnt, fill=color, anchor="mm")
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return np.asarray(img, np.uint8).copy()
