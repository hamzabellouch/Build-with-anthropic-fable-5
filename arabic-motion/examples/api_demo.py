"""Khattat Python API examples.

Run from the repo root:  .venv/bin/python examples/api_demo.py
"""
import khattat

# 1 — one-liner with a preset
khattat.render_text(
    "العِلْمُ نُورٌ",
    out="examples/out_manuscript.mp4",
    preset="manuscript",
    duration=10,
)

# 2 — full manual control through RenderConfig
cfg = khattat.RenderConfig(
    text="الصَّبْرُ مِفْتَاحُ الفَرَجِ",
    out="examples/out_custom.mp4",
    font="scheherazade",
    size=(1280, 720),
    pen="fountain",
    ink="#15406e",
    paper="lined",
    guidelines=True,
    order="glyph",       # letter by letter, like a careful student
    speed=0.8,
    karaoke="crimson",   # current word highlighted
    srt=True,            # word-timed subtitles
    timeline=True,       # machine-readable timing JSON
    seed=21,
)
result = khattat.render(cfg)
print(result)
