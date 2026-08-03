"""Pipeline invariants. Run:  .venv/bin/python tests/test_invariants.py"""
import numpy as np
from khattat.text import Shaper, layout_text, normalize_text, token_direction
from khattat.glyphs import build_all_words
from khattat.plan import attach_strokes, build_schedule
from khattat.fonts import resolve


def main():
    path = resolve('amiri')
    sh = Shaper(path)

    # marks identified
    w = sh.shape_word('كَتَبَ', 'rtl')
    marks = [g for g in w.glyphs if g.is_mark]
    assert len(marks) == 3, f"expected 3 fathas, got {len(marks)}"

    # logical order: rightmost base glyph written first
    bases = sorted((g for g in w.glyphs if not g.is_mark), key=lambda g: g.logical)
    assert bases[0].x > bases[-1].x, "first written base should be rightmost"

    # direction detection
    assert token_direction('مرحبا') == 'rtl'
    assert token_direction('hello') == 'ltr'
    assert token_direction('1990') == 'ltr'

    # full pipeline invariants
    layout = layout_text(sh, normalize_text('العِلْمُ نُورٌ وَالجَهْلُ ظَلَامٌ'), 1600, 900)
    arts = build_all_words(layout, path, sh.upem)
    assert [a.placed.index for a in arts] == sorted(a.placed.index for a in arts)
    seq = attach_strokes(arts, layout)
    assert len(seq) > 10
    phase_rank = {'rasm': 0, 'dot': 1, 'mark': 2, 'flourish': 3}
    seen_phase = {}
    for art, comp, st in seq:
        k = art.placed.index
        r = phase_rank[comp.kind]
        assert r >= seen_phase.get(k, 0), f"phase regression in word {k}"
        seen_phase[k] = r

    sched = build_schedule(seq, layout, seed=7)
    ts = [e.t0 for e in sched.events]
    assert ts == sorted(ts), "events must be time-ordered"
    assert sched.ink_end > 0 and sched.duration > sched.ink_end
    spans = sched.word_spans
    assert all(t0 < t1 for _, t0, t1 in spans)
    starts = [t0 for _, t0, _ in spans]
    assert starts == sorted(starts), "word start times must be monotonic"
    print("all invariants hold ✓")


if __name__ == "__main__":
    main()
