"""Render configuration, ink styles, and presets."""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from pathlib import Path

from .util import darken, lighten, mix, parse_color


@dataclass
class InkStyle:
    color: tuple
    wet: tuple
    glow: tuple | None = None        # additive halo color
    glow_strength: float = 0.0
    grain: float = 0.0               # 0..1: how much paper grain breaks the ink
    gradient: tuple | None = None    # (top RGB, bottom RGB) per word
    edge_dark: float = 0.0           # darken ink edges on bake (gold leaf look)
    sparkle: float = 0.0


INKS: dict[str, InkStyle] = {
    "black": InkStyle((26, 22, 20), wet=(6, 5, 5)),
    "sepia": InkStyle((82, 48, 22), wet=(48, 26, 11)),
    "blue": InkStyle((18, 40, 116), wet=(8, 20, 72)),
    "crimson": InkStyle((142, 24, 32), wet=(92, 10, 16)),
    "emerald": InkStyle((18, 92, 58), wet=(8, 56, 34)),
    "white": InkStyle((242, 240, 234), wet=(255, 255, 255)),
    "chalk": InkStyle((238, 238, 232), wet=(255, 255, 255), grain=0.55),
    "graphite": InkStyle((92, 90, 92), wet=(60, 58, 60), grain=0.32),
    "gold": InkStyle((188, 142, 38), wet=(132, 94, 22),
                     gradient=((236, 196, 96), (150, 102, 24)),
                     edge_dark=0.38, sparkle=0.5),
    "neon": InkStyle((225, 255, 247), wet=(255, 255, 255),
                     glow=(36, 255, 198), glow_strength=1.0),
    "neon-pink": InkStyle((255, 235, 248), wet=(255, 255, 255),
                          glow=(255, 64, 170), glow_strength=1.0),
}

PEN_DEFAULT_INK = {"pencil": "graphite", "chalk": "chalk"}


def resolve_ink(spec: str | None, pen: str = "qalam") -> InkStyle:
    if spec is None:
        spec = PEN_DEFAULT_INK.get(pen, "black")
    s = str(spec).strip().lower()
    if s in INKS:
        return INKS[s]
    rgb = parse_color(s)
    return InkStyle(rgb, wet=darken(rgb, 0.45) if sum(rgb) > 150 else lighten(rgb, 0.25))


@dataclass
class RenderConfig:
    text: str = ""
    out: str = "khattat.mp4"
    font: str = "amiri"
    size: tuple = (1280, 720)
    fps: int = 30
    supersample: int = 2
    font_size: int | None = None      # output px
    align: str = "center"
    margin: float = 0.08
    order: str = "word"               # word | glyph | line
    mode: str = "write"               # write | typewriter
    speed: float = 1.0
    duration: float | None = None
    hold: float = 1.8
    lead: float = 0.7
    pen: str = "qalam"                # qalam|fountain|pencil|chalk|brush|none
    ink: str | None = None
    paper: str = "cream"
    guidelines: bool = False
    flourish: bool = False
    karaoke: str | None = None        # highlight color for the active word
    camera: str = "static"            # static | follow
    zoom: float = 1.55
    audio: bool = True
    volume: float = 1.0
    seed: int = 7
    digits: str = "keep"              # keep | arabic | western
    wrap: bool = True
    srt: bool = False
    timeline: bool = False
    fmt: str | None = None            # mp4|webm|gif|frames|png (else from ext)
    crf: int = 18
    particles: str = "auto"           # auto | on | off
    wet_seconds: float = 0.85
    show_pen: bool = True
    title: str | None = None          # small caption at the bottom

    def resolved_format(self) -> str:
        if self.fmt:
            return self.fmt
        ext = Path(self.out).suffix.lower().lstrip(".")
        return {"mp4": "mp4", "webm": "webm", "gif": "gif", "png": "png",
                "apng": "png"}.get(ext, "mp4")


PRESETS: dict[str, dict] = {
    "classic": dict(
        paper="cream", pen="qalam", ink="black", font="amiri",
    ),
    "manuscript": dict(
        paper="parchment", pen="qalam", ink="sepia", font="amiri",
        flourish=True, speed=0.9,
    ),
    "golden": dict(
        paper="parchment", pen="qalam", ink="gold", font="amiri-bold",
        flourish=True, speed=0.9,
    ),
    "mashq": dict(
        paper="lined", pen="fountain", ink="blue", font="scheherazade",
        guidelines=True, order="glyph", speed=0.85,
    ),
    "chalkboard": dict(
        paper="blackboard", pen="chalk", ink="chalk", font="lateef",
        speed=0.8, particles="on",
    ),
    "neon": dict(
        paper="dark", pen="fountain", ink="neon", font="reem-kufi",
        hold=2.2,
    ),
    "reel": dict(
        size=(1080, 1920), paper="dark", pen="fountain", ink="white",
        font="amiri", camera="follow", hold=2.4, flourish=True,
    ),
    "diwan": dict(
        paper="parchment", pen="qalam", ink="black", font="gulzar",
        speed=0.85, flourish=True,
    ),
    "typewriter": dict(
        mode="typewriter", paper="white", pen="none", ink="black",
        font="noto-naskh", camera="static",
    ),
    "ghost": dict(
        paper="none", pen="none", ink="white", audio=False, hold=1.0,
    ),
    "karaoke": dict(
        paper="dark", pen="fountain", ink="white", karaoke="amber",
        font="amiri", srt=True,
    ),
}

PRESET_BLURBS = {
    "classic": "cream paper, reed qalam, black ink — timeless naskh",
    "manuscript": "aged parchment, sepia ink, a closing flourish",
    "golden": "gold-leaf lettering on parchment, bold Amiri",
    "mashq": "practice sheet: ruled lines, blue fountain pen, letter by letter",
    "chalkboard": "a teacher's hand on a dusty blackboard, with falling chalk",
    "neon": "glowing neon tubes on a midnight wall (Reem Kufi)",
    "reel": "1080×1920 vertical, follow-cam — made for shorts and reels",
    "diwan": "Nastaliq poetry (Gulzar) with a sweeping flourish",
    "typewriter": "mechanical stamping with clacks, dings, and dead-key tashkil",
    "ghost": "transparent WebM overlay, white ink, no pen — for video editors",
    "karaoke": "active word glows amber; writes an .srt beside the video",
}


def apply_preset(cfg: RenderConfig, name: str) -> RenderConfig:
    if name not in PRESETS:
        raise KeyError(f"unknown preset '{name}' — try: {', '.join(PRESETS)}")
    return replace(cfg, **PRESETS[name])
