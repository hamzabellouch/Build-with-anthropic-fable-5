"""Draw planning and scheduling.

`attach_strokes` decides WHAT gets drawn in what order (the calligrapher's
discipline: a word's rasm first, then its dots, then its tashkil).
`build_schedule` decides WHEN: curvature-aware pen speed, micro-hesitations,
travel arcs between strokes, pauses at word and line boundaries.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from .glyphs import DrawComp, WordArt
from .strokes import Stroke, build_strokes
from .text import TextLayout
from .util import bezier_points, ease_in_out

# ---------------------------------------------------------------- ordering


def _assign_to_rasm(rasm: list[DrawComp], extras: list[DrawComp]):
    """Group dots/marks with the rasm component they sit over (glyph mode)."""
    groups: dict[int, list[DrawComp]] = {i: [] for i in range(len(rasm))}
    for e in extras:
        cx = e.order_x
        best, best_d = 0, float("inf")
        for i, r in enumerate(rasm):
            x0, _, x1, _ = r.patch.bbox
            d = 0.0 if x0 <= cx <= x1 else min(abs(cx - x0), abs(cx - x1))
            if d < best_d:
                best, best_d = i, d
        groups[best].append(e)
    return groups


def attach_strokes(arts: list[WordArt], layout: TextLayout, order: str = "word",
                   typewriter: bool = False):
    """Build strokes for every component and return the global writing order
    as a list of (word_art, comp, stroke) triples."""
    em = layout.font_px
    pen = np.array([layout.width + em, arts[0].placed.y], np.float32)
    sequence: list[tuple[WordArt, DrawComp, Stroke]] = []

    def emit(art, comp):
        nonlocal pen
        rtl = art.placed.shaped.direction == "rtl"
        if not comp.strokes:
            build_strokes(comp, em, pen_start=pen, rtl=rtl)
        for st in comp.strokes:
            sequence.append((art, comp, st))
            pen = st.pts[-1]

    if typewriter:
        for art in arts:
            comps = sorted(art.rasm + art.dots, key=lambda c: c.logical)
            mark_groups = _assign_to_rasm(comps, art.marks) if comps else {}
            for i, c in enumerate(comps):
                emit(art, c)
                for m in mark_groups.get(i, []):
                    emit(art, m)
        return sequence

    if order == "line":
        lines: dict[int, list[WordArt]] = {}
        for art in arts:
            lines.setdefault(art.placed.line, []).append(art)
        for li in sorted(lines):
            ws = lines[li]
            for art in ws:
                for c in art.rasm:
                    emit(art, c)
            for art in ws:
                for c in art.dots:
                    emit(art, c)
            for art in ws:
                for c in art.marks:
                    emit(art, c)
    elif order == "glyph":
        for art in arts:
            groups_d = _assign_to_rasm(art.rasm, art.dots)
            groups_m = _assign_to_rasm(art.rasm, art.marks)
            for i, c in enumerate(art.rasm):
                emit(art, c)
                for d in groups_d.get(i, []):
                    emit(art, d)
                for m in groups_m.get(i, []):
                    emit(art, m)
    else:  # word — the professional default
        for art in arts:
            for c in art.rasm:
                emit(art, c)
            for c in art.dots:
                emit(art, c)
            for c in art.marks:
                emit(art, c)
    return sequence

# ---------------------------------------------------------------- schedule


@dataclass
class Event:
    kind: str                  # 'stroke' | 'stamp' | 'travel' | 'pause'
    t0: float
    t1: float
    word: WordArt | None = None
    comp: DrawComp | None = None
    stroke: Stroke | None = None
    pts_t: np.ndarray | None = None   # per-point absolute times (stroke)
    path: np.ndarray | None = None    # travel pen path (M,2)
    lift: float = 0.0                 # 0 = nib on paper, 1 = fully lifted

    def pen_at(self, t):
        t = min(max(t, self.t0), self.t1)
        if self.kind == "stroke" and self.pts_t is not None and len(self.pts_t):
            i = int(np.searchsorted(self.pts_t, t))
            i = min(i, len(self.stroke.pts) - 1)
            return self.stroke.pts[i]
        if self.kind == "travel" and self.path is not None and len(self.path):
            u = 0.0 if self.t1 <= self.t0 else (t - self.t0) / (self.t1 - self.t0)
            i = int(ease_in_out(u) * (len(self.path) - 1))
            return self.path[i]
        if self.kind == "stamp" and self.stroke is not None:
            return self.stroke.pts[0]
        return None

    def lift_at(self, t):
        if self.kind == "travel":
            u = 0.0 if self.t1 <= self.t0 else (t - self.t0) / (self.t1 - self.t0)
            return float(np.sin(np.pi * np.clip(u, 0, 1)))
        if self.kind == "pause":
            return 0.35
        if self.kind == "stamp":
            u = 0.0 if self.t1 <= self.t0 else (t - self.t0) / (self.t1 - self.t0)
            return float(max(0.0, 0.5 - u))  # little dip onto the paper
        return 0.0


@dataclass
class Schedule:
    events: list[Event]
    duration: float            # full video length (incl. lead & hold)
    ink_end: float             # when the last ink lands
    word_spans: list[tuple[WordArt, float, float]]
    em: float
    typewriter: bool = False

    def pen_state(self, t):
        """-> (pos (2,) or None, lift 0..1, speed px/s)."""
        evs = self.events
        lo, hi = 0, len(evs) - 1
        idx = None
        while lo <= hi:
            mid = (lo + hi) // 2
            if evs[mid].t1 < t:
                lo = mid + 1
            elif evs[mid].t0 > t:
                hi = mid - 1
            else:
                idx = mid
                break
        if idx is None:
            idx = min(max(lo, 0), len(evs) - 1)
        e = evs[idx]
        pos = e.pen_at(t)
        k = idx
        while pos is None and k > 0:
            k -= 1
            pos = evs[k].pen_at(evs[k].t1)
        if pos is None:
            return None, 1.0, 0.0
        dt = 0.016
        p2 = e.pen_at(min(t + dt, e.t1))
        speed = float(np.linalg.norm((p2 - pos)) / dt) if p2 is not None else 0.0
        return np.asarray(pos, np.float32), e.lift_at(t), speed


def _stroke_times(st: Stroke, v_base: float, em: float, rng) -> np.ndarray:
    """Per-point relative times with curvature slow-down and human jitter."""
    pts = st.pts
    if len(pts) < 2:
        return np.zeros(len(pts), np.float32)
    seg = np.hypot(*(pts[1:] - pts[:-1]).T)
    tang = np.arctan2(*(pts[1:] - pts[:-1]).T[::-1])
    dtheta = np.abs(np.diff(np.unwrap(tang)))
    curv = np.concatenate([[0.0], dtheta]) / np.maximum(seg, 1e-3)   # rad/px
    k = min(len(curv), 9)
    if k > 2:
        kernel = np.ones(k) / k
        curv = np.convolve(curv, kernel, mode="same")
    slow = 1.0 + 0.55 * np.clip(curv * em * 0.55, 0, 2.2)
    wobble = 1.0 + 0.10 * np.sin(np.linspace(0, rng.uniform(2, 5) * np.pi, len(seg))
                                 + rng.uniform(0, 6.28))
    v = np.maximum(v_base / (slow * wobble), 0.18 * v_base)
    dt = seg / v
    return np.concatenate([[0.0], np.cumsum(dt)]).astype(np.float32)


def _travel_path(p0, p1, em):
    p0, p1 = np.asarray(p0, np.float32), np.asarray(p1, np.float32)
    d = float(np.linalg.norm(p1 - p0))
    lift = min(0.45 * em, 0.12 * em + 0.18 * d)
    c0 = p0 + (0.25 * (p1 - p0)) - (0, lift)
    c1 = p0 + (0.75 * (p1 - p0)) - (0, lift)
    n = max(8, int(d / 6))
    return bezier_points(p0, c0, c1, p1, n), d


def build_schedule(sequence, layout: TextLayout, *, speed=1.0, lead=0.7,
                   hold=1.8, duration=None, seed=7, typewriter=False,
                   flourish_comp=None) -> Schedule:
    em = layout.font_px
    rng = np.random.default_rng(seed)
    events: list[Event] = []
    word_starts: dict[int, float] = {}
    word_ends: dict[int, float] = {}
    word_of: dict[int, WordArt] = {}

    if typewriter:
        t = lead
        cadence = 0.130 / speed
        prev_art = None
        for art, comp, st in sequence:
            if prev_art is not None and art is not prev_art:
                t += cadence * (1.6 if art.placed.line == prev_art.placed.line else 4.5)
            dur = 0.045
            jitter = float(rng.uniform(0.82, 1.35))
            gap = cadence * jitter * (0.45 if comp.kind == "mark" else 1.0)
            ev = Event("stamp", t, t + dur, word=art, comp=comp, stroke=st)
            events.append(ev)
            wi = art.placed.index
            word_starts.setdefault(wi, t)
            word_ends[wi] = t + dur
            word_of[wi] = art
            t += dur + gap
            prev_art = art
        ink_end = t
    else:
        v_rasm = 2.05 * em * speed
        v_mark = 3.10 * em * speed
        v_travel = 7.5 * em * speed
        pen = np.array([layout.width + 0.6 * em,
                        sequence[0][2].pts[0][1] if sequence else layout.height / 2],
                       np.float32)
        t = 0.0
        prev_art, prev_kind = None, None
        first = True
        for art, comp, st in sequence:
            wi = art.placed.index
            target = st.pts[0]
            # pauses: between words, between passes (rasm→dots→marks)
            if prev_art is not None:
                if art is not prev_art:
                    t += (0.10 if art.placed.line == prev_art.placed.line
                          else 0.42) / speed
                elif prev_kind != comp.kind:
                    t += 0.085 / speed
            path, dist = _travel_path(pen, target, em)
            if first:
                tdur = lead
                first = False
            else:
                tdur = float(np.clip(dist / v_travel, 0.045, 0.5 / speed))
            if dist > 1.0 or first:
                events.append(Event("travel", t, t + tdur, word=art, path=path,
                                    lift=1.0))
                t += tdur

            if st.mode == "stamp":
                dur = 0.085 / speed
                events.append(Event("stamp", t, t + dur, word=art, comp=comp,
                                    stroke=st))
                word_starts.setdefault(wi, t)
                word_ends[wi] = t + dur
                t += dur + 0.03 / speed
                pen = st.pts[0]
            else:
                v = v_mark if comp.kind in ("mark", "flourish") else v_rasm
                v *= float(rng.uniform(0.93, 1.07))
                rel = _stroke_times(st, v, em, rng)
                dur = float(rel[-1]) if len(rel) else 0.0
                ev = Event("stroke", t, t + dur, word=art, comp=comp, stroke=st,
                           pts_t=t + rel)
                events.append(ev)
                word_starts.setdefault(wi, t)
                word_ends[wi] = t + dur
                t += dur + float(rng.uniform(0.015, 0.05)) / speed
                pen = st.pts[-1]
            word_of[wi] = art
            prev_art, prev_kind = art, comp.kind
        ink_end = t

    # optional uniform time-stretch to hit a target duration
    if duration is not None:
        target_ink = max(0.5, duration - hold)
        f = target_ink / max(ink_end, 1e-6)
        for e in events:
            e.t0 *= f
            e.t1 *= f
            if e.pts_t is not None:
                e.pts_t = e.pts_t * f
        word_starts = {k: v * f for k, v in word_starts.items()}
        word_ends = {k: v * f for k, v in word_ends.items()}
        ink_end *= f

    total = ink_end + hold
    spans = [(word_of[k], word_starts[k], word_ends[k]) for k in sorted(word_starts)
             if word_of[k] is not None]
    return Schedule(events=events, duration=total, ink_end=ink_end,
                    word_spans=spans, em=em, typewriter=typewriter)
