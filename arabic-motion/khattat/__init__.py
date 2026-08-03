"""خطّاط (khattat) — Arabic calligraphy handwriting videos.

>>> import khattat
>>> khattat.render_text("العِلْمُ نُورٌ", out="ilm.mp4", preset="manuscript")
"""
from __future__ import annotations

__version__ = "1.0.0"

from .pipeline import render
from .style import INKS, PRESETS, RenderConfig, apply_preset

__all__ = ["render", "render_text", "RenderConfig", "PRESETS", "INKS",
           "apply_preset", "__version__"]


def render_text(text: str, out: str = "khattat.mp4", preset: str | None = None,
                quiet: bool = False, **options):
    """One-call API: render `text` to `out` with optional preset + overrides."""
    cfg = RenderConfig(text=text, out=out)
    if preset:
        cfg = apply_preset(cfg, preset)
        cfg.text, cfg.out = text, out
    for k, v in options.items():
        if not hasattr(cfg, k):
            raise TypeError(f"unknown option {k!r}")
        setattr(cfg, k, v)
    return render(cfg, quiet=quiet)
