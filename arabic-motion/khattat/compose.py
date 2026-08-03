"""Frame compositor.

Keeps a baked background (paper + dried ink) and a small set of live word
layers. Per frame it only touches the regions where ink is fresh, then crops
through a smoothed camera and resizes straight to the output size.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np
from PIL import Image, ImageFilter

from .plan import Event, Schedule
from .style import InkStyle, RenderConfig
from .util import ease_in_out, ease_out, smooth_noise


@dataclass
class _CompState:
    comp: object
    sl: tuple          # slice in layer coords
    alpha: np.ndarray  # uint8, clipped to layer
    strokes_left: int


class Layer:
    def __init__(self, art, canvas_w, canvas_h, span, pad=3):
        x0, y0, x1, y1 = art.bbox
        self.x0 = max(0, x0 - pad)
        self.y0 = max(0, y0 - pad)
        self.x1 = min(canvas_w, x1 + pad)
        self.y1 = min(canvas_h, y1 + pad)
        h, w = self.y1 - self.y0, self.x1 - self.x0
        self.reveal = np.zeros((h, w), np.uint8)
        self.tstamp = np.full((h, w), np.inf, np.float32)
        self.baked = False
        self.any_ink = False
        self.last_ink = -1e9
        self.span = span                     # (t_start, t_end) of the word
        self.comps: dict[int, _CompState] = {}
        for comp in art.all_comps:
            p = comp.patch
            cx0, cy0 = max(p.x, self.x0), max(p.y, self.y0)
            cx1 = min(p.x + p.a.shape[1], self.x1)
            cy1 = min(p.y + p.a.shape[0], self.y1)
            if cx1 <= cx0 or cy1 <= cy0:
                continue
            alpha = p.a[cy0 - p.y:cy1 - p.y, cx0 - p.x:cx1 - p.x]
            sl = (slice(cy0 - self.y0, cy1 - self.y0),
                  slice(cx0 - self.x0, cx1 - self.x0))
            self.comps[id(comp)] = _CompState(comp, sl, alpha, len(comp.strokes))

    @property
    def sl_canvas(self):
        return (slice(self.y0, self.y1), slice(self.x0, self.x1))


class Camera:
    def __init__(self, w, h, ss, pos, zoom):
        self.w, self.h, self.ss = w, h, ss
        self.pos = np.asarray(pos, np.float32)
        self.zoom = zoom

    def update(self, target, tzoom, dt):
        a = 1.0 - math.exp(-3.4 * dt)
        self.pos += (np.asarray(target, np.float32) - self.pos) * a
        self.zoom += (tzoom - self.zoom) * (1.0 - math.exp(-2.4 * dt))

    def crop_rect(self, shake=(0.0, 0.0)):
        cw, ch = self.w * self.ss, self.h * self.ss
        vw, vh = cw / self.zoom, ch / self.zoom
        cx = float(np.clip(self.pos[0] + shake[0], vw / 2, cw - vw / 2))
        cy = float(np.clip(self.pos[1] + shake[1], vh / 2, ch - vh / 2))
        return (cx - vw / 2, cy - vh / 2, cx + vw / 2, cy + vh / 2)


class Compositor:
    def __init__(self, cfg: RenderConfig, layout, arts, schedule: Schedule,
                 ink: InkStyle, paper_rgb, paper_meta, pen_sprite, rng):
        self.cfg = cfg
        self.layout = layout
        self.schedule = schedule
        self.ink = ink
        self.rng = rng
        self.W, self.H = layout.width, layout.height
        self.out_w, self.out_h = cfg.size
        self.ss = cfg.supersample
        self.alpha_mode = paper_rgb is None
        self.paper_meta = paper_meta
        self.pen = pen_sprite

        if self.alpha_mode:
            self.baked = np.zeros((self.H, self.W, 4), np.uint8)
        else:
            self.baked = paper_rgb.copy()

        spans = {id(a): (t0, t1) for a, t0, t1 in schedule.word_spans}
        self.layers: dict[int, Layer] = {}
        for art, *_ in [(e.word,) for e in schedule.events if e.word is not None]:
            if id(art) not in self.layers:
                self.layers[id(art)] = Layer(art, self.W, self.H,
                                             spans.get(id(art), (0, 0)))

        self.tau = max(0.15, cfg.wet_seconds)
        self.dry_after = 3.2 * self.tau
        self.wet_rgb = np.array(ink.wet, np.float32)
        self.dry_rgb = np.array(ink.color, np.float32)
        self.karaoke_rgb = None
        if cfg.karaoke:
            from .util import parse_color
            self.karaoke_rgb = np.array(parse_color(cfg.karaoke), np.float32)

        self.grain = None
        if ink.grain > 0:
            g = smooth_noise(rng, min(self.W, 1024), min(self.H, 1024), 320,
                             1.0 - ink.grain, 1.0)
            g = np.asarray(Image.fromarray((g * 255).astype(np.uint8))
                           .resize((self.W, self.H), Image.BILINEAR),
                           np.float32) / 255.0
            self.grain = g

        # the last moment any event touches a word — safe-to-bake horizon
        self.word_final_t: dict[int, float] = {}
        for e in schedule.events:
            if e.word is not None:
                self.word_final_t[id(e.word)] = max(
                    self.word_final_t.get(id(e.word), 0.0), e.t1)

    # event machinery
        self.ev_i = 0
        self.open: list[dict] = []
        self.t_prev = 0.0
        self.disks: dict[int, np.ndarray] = {}

        first_pen = None
        for e in schedule.events:
            p = e.pen_at(e.t0)
            if p is not None:
                first_pen = p
                break
        if first_pen is None:
            first_pen = (self.W / 2, self.H / 2)
        follow = cfg.camera == "follow"
        self.cam = Camera(self.out_w, self.out_h, self.ss,
                          first_pen if follow else (self.W / 2, self.H / 2),
                          cfg.zoom if follow else 1.0)
        self.shakes: list[tuple[float, float, np.ndarray]] = []
        self.particles: list[list] = []
        em = layout.font_px
        self.particle_on = (cfg.particles == "on"
                            or (cfg.particles == "auto" and cfg.pen == "chalk"))
        self.em = em
        self.exit_t = schedule.ink_end + 0.15

    # ------------------------------------------------------------ disks

    def _disk(self, r: int) -> np.ndarray:
        d = self.disks.get(r)
        if d is None:
            y, x = np.mgrid[-r:r + 1, -r:r + 1]
            d = ((x * x + y * y) <= r * r + 0.5).astype(np.uint8) * 255
            self.disks[r] = d
        return d

    def _stamp_disk(self, layer: Layer, cs: _CompState, cx, cy, r, t):
        r_i = max(1, int(round(r)))
        disk = self._disk(r_i)
        gx, gy = int(round(cx)) - layer.x0, int(round(cy)) - layer.y0
        x0, y0 = gx - r_i, gy - r_i
        x1, y1 = gx + r_i + 1, gy + r_i + 1
        ly0, ly1 = cs.sl[0].start, cs.sl[0].stop
        lx0, lx1 = cs.sl[1].start, cs.sl[1].stop
        X0, Y0 = max(x0, lx0), max(y0, ly0)
        X1, Y1 = min(x1, lx1), min(y1, ly1)
        if X1 <= X0 or Y1 <= Y0:
            return
        dsk = disk[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
        alpha = cs.alpha[Y0 - ly0:Y1 - ly0, X0 - lx0:X1 - lx0]
        val = np.minimum(dsk, alpha)
        rv = layer.reveal[Y0:Y1, X0:X1]
        newly = (val > 40) & (layer.tstamp[Y0:Y1, X0:X1] == np.inf)
        np.maximum(rv, val, out=rv)
        layer.tstamp[Y0:Y1, X0:X1][newly] = t
        layer.last_ink = t
        layer.any_ink = True
        if self.particle_on and self.rng.random() < 0.30:
            self._spawn_particle(cx, cy)

    def _snap_comp(self, layer: Layer, cs: _CompState, t):
        rv = layer.reveal[cs.sl]
        newly = (cs.alpha > 40) & (layer.tstamp[cs.sl] == np.inf)
        np.maximum(rv, cs.alpha, out=rv)
        layer.tstamp[cs.sl][newly] = t
        layer.last_ink = max(layer.last_ink, t)
        layer.any_ink = True

    def _spawn_particle(self, x, y):
        if len(self.particles) > 220:
            return
        em = self.em
        r = self.rng
        self.particles.append([
            x + float(r.uniform(-0.02, 0.02)) * em,
            y + float(r.uniform(0.0, 0.03)) * em,
            float(r.uniform(-0.12, 0.12)) * em,
            float(r.uniform(0.05, 0.30)) * em,
            0.0,
            float(r.uniform(0.4, 0.95)),
            float(r.uniform(0.8, 2.2)) * self.ss,
        ])

    # ------------------------------------------------------------ events

    def _advance_events(self, t):
        evs = self.schedule.events
        while self.ev_i < len(evs) and evs[self.ev_i].t0 <= t:
            e = evs[self.ev_i]
            self.ev_i += 1
            if e.kind in ("stroke", "stamp") and e.comp is not None:
                self.open.append({"e": e, "i": 0})
                if e.kind == "stamp" and self.schedule.typewriter:
                    amp = 0.012 * self.em
                    ang = self.rng.uniform(0, 2 * np.pi)
                    self.shakes.append((e.t0, amp,
                                        np.array([np.cos(ang), 0.6 + 0.4 * abs(np.sin(ang))])))
        done = []
        for st in self.open:
            e: Event = st["e"]
            layer = self.layers.get(id(e.word))
            if layer is None or layer.baked:
                done.append(st)
                continue
            cs = layer.comps.get(id(e.comp))
            if cs is None:
                done.append(st)
                continue
            if e.kind == "stroke":
                pts_t = e.pts_t
                j = int(np.searchsorted(pts_t, t, side="right"))
                for k in range(st["i"], min(j, len(e.stroke.pts))):
                    x, y = e.stroke.pts[k]
                    self._stamp_disk(layer, cs, x, y,
                                     e.stroke.radii[min(k, len(e.stroke.radii) - 1)], t)
                st["i"] = j
                if t >= e.t1:
                    for k in range(st["i"], len(e.stroke.pts)):
                        x, y = e.stroke.pts[k]
                        self._stamp_disk(layer, cs, x, y,
                                         e.stroke.radii[min(k, len(e.stroke.radii) - 1)], t)
                    cs.strokes_left -= 1
                    if cs.strokes_left <= 0:
                        self._snap_comp(layer, cs, t)
                    done.append(st)
            else:  # stamp
                u = 1.0 if e.t1 <= e.t0 else (t - e.t0) / (e.t1 - e.t0)
                if self.schedule.typewriter:
                    rv = layer.reveal[cs.sl]
                    val = (cs.alpha.astype(np.float32)
                           * min(1.0, 0.25 + 0.75 * u)).astype(np.uint8)
                    newly = (val > 40) & (layer.tstamp[cs.sl] == np.inf)
                    np.maximum(rv, val, out=rv)
                    layer.tstamp[cs.sl][newly] = t
                    layer.any_ink = True
                    layer.last_ink = t
                else:
                    x, y = e.stroke.pts[0]
                    r = float(e.stroke.radii[0]) * ease_out(min(u, 1.0))
                    self._stamp_disk(layer, cs, x, y, max(1.5, r), t)
                if t >= e.t1:
                    self._snap_comp(layer, cs, t)
                    done.append(st)
        for st in done:
            if st in self.open:
                self.open.remove(st)

    # ------------------------------------------------------------ baking

    def _dry_color_patch(self, layer: Layer, alpha_f):
        """Per-pixel dry ink color (handles gradients)."""
        h, w = alpha_f.shape
        if self.ink.gradient:
            top = np.array(self.ink.gradient[0], np.float32)
            bot = np.array(self.ink.gradient[1], np.float32)
            ys = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
            return top + (bot - top) * ys
        return self.dry_rgb

    def _bake_layer(self, layer: Layer):
        a = np.zeros_like(layer.reveal)
        for cs in layer.comps.values():
            sub = a[cs.sl]
            np.maximum(sub, cs.alpha, out=sub)
        af = a.astype(np.float32) / 255.0
        if self.grain is not None:
            af *= self.grain[layer.sl_canvas]
        color = self._dry_color_patch(layer, af)
        if self.ink.edge_dark > 0:
            er = np.asarray(Image.fromarray(a).filter(ImageFilter.MinFilter(5)),
                            np.float32)
            edge = np.clip((a.astype(np.float32) - er) / 255.0, 0, 1)
            color = color * (1.0 - self.ink.edge_dark * edge[..., None] * 0.9)
        if self.ink.sparkle > 0:
            spark = self.rng.random(af.shape) > (1 - 0.0035 * self.ink.sparkle)
            spark &= af > 0.4
            color = np.where(spark[..., None], np.minimum(color * 1.8 + 60, 255), color)
        sl = layer.sl_canvas
        if self.alpha_mode:
            dst = self.baked[sl]
            srgb = dst[..., :3].astype(np.float32)
            sa = dst[..., 3].astype(np.float32) / 255.0
            oa = af + sa * (1 - af)
            safe = np.maximum(oa, 1e-5)[..., None]
            rgb = (np.asarray(color, np.float32) * af[..., None]
                   + srgb * (sa * (1 - af))[..., None]) / safe
            dst[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
            dst[..., 3] = np.clip(oa * 255, 0, 255).astype(np.uint8)
        else:
            dst = self.baked[sl].astype(np.float32)
            out = dst * (1 - af[..., None]) + np.asarray(color, np.float32) * af[..., None]
            if self.ink.glow:
                blur = np.asarray(Image.fromarray(a).filter(
                    ImageFilter.GaussianBlur(0.05 * self.em)), np.float32) / 255.0
                gc = np.array(self.ink.glow, np.float32)
                out = out + gc * (blur * self.ink.glow_strength * 0.55)[..., None]
            self.baked[sl] = np.clip(out, 0, 255).astype(np.uint8)
        layer.baked = True

    # ------------------------------------------------------------ frame

    def _composite_live(self, frame, layer: Layer, t):
        sl = layer.sl_canvas
        a = layer.reveal.astype(np.float32) / 255.0
        if self.grain is not None:
            a *= self.grain[sl]
        age = t - layer.tstamp
        wet = np.exp(-np.maximum(age, 0.0) / self.tau)
        wet[~np.isfinite(layer.tstamp)] = 0.0
        if self.karaoke_rgb is not None:
            active = t < layer.span[1] + 0.25
            if active:
                wet = np.maximum(wet, np.where(a > 0, 0.95, 0.0))
            wcol = self.karaoke_rgb
        else:
            wcol = self.wet_rgb
        color = self._dry_color_patch(layer, a)
        color = color + (wcol - color) * wet[..., None]
        if self.alpha_mode:
            dst = frame[sl]
            srgb = dst[..., :3].astype(np.float32)
            sa = dst[..., 3].astype(np.float32) / 255.0
            oa = a + sa * (1 - a)
            safe = np.maximum(oa, 1e-5)[..., None]
            rgb = (color * a[..., None] + srgb * (sa * (1 - a))[..., None]) / safe
            dst[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
            dst[..., 3] = np.clip(oa * 255, 0, 255).astype(np.uint8)
        else:
            dst = frame[sl].astype(np.float32)
            out = dst * (1 - a[..., None]) + color * a[..., None]
            if self.ink.glow:
                blur = np.asarray(Image.fromarray(layer.reveal).filter(
                    ImageFilter.GaussianBlur(0.05 * self.em)), np.float32) / 255.0
                gc = np.array(self.ink.glow, np.float32)
                pulse = 0.55 + 0.30 * float(np.exp(-max(t - layer.last_ink, 0) / 0.4))
                out = out + gc * (blur * self.ink.glow_strength * pulse)[..., None]
            frame[sl] = np.clip(out, 0, 255).astype(np.uint8)

    def _draw_particles(self, frame, t, dt):
        if not self.particles:
            return
        em = self.em
        alive = []
        H, W = frame.shape[:2]
        for p in self.particles:
            x, y, vx, vy, age, life, size = p
            age += dt
            if age < life:
                x += vx * dt
                y += vy * dt
                vy += 3.0 * em * dt
                p[0], p[1], p[3], p[4] = x, y, vy, age
                alive.append(p)
                ix, iy, r = int(x), int(y), max(1, int(size))
                if 0 <= ix < W and 0 <= iy < H:
                    fade = (1 - age / life) * 0.55
                    x0, x1 = max(0, ix - r), min(W, ix + r + 1)
                    y0, y1 = max(0, iy - r), min(H, iy + r + 1)
                    reg = frame[y0:y1, x0:x1, :3].astype(np.float32)
                    frame[y0:y1, x0:x1, :3] = np.clip(
                        reg + (np.array([230, 230, 224]) - reg) * fade, 0, 255
                    ).astype(np.uint8)
        self.particles = alive

    def _draw_pen(self, frame, t):
        if self.pen is None:
            return
        pos, lift, _speed = self.schedule.pen_state(t)
        if pos is None:
            return
        em = self.em
        alpha_mul = 1.0
        if t > self.exit_t:
            dt = t - self.exit_t
            pos = pos + np.array([2.2 * em * dt, 1.4 * em * dt])
            alpha_mul = max(0.0, 1.0 - dt / 0.7)
            if alpha_mul <= 0:
                return
        wob = 2.1 * math.sin(2.1 * t) + 1.3 * math.sin(5.3 * t + 1.7)
        img, nib = self.pen.at_angle(wob)
        sprite = np.asarray(img, np.uint8)
        axis = self.pen.axis
        draw = pos + axis * 0.0 - np.array([0.0, 0.18 * em * lift])
        sx = int(round(draw[0] - nib[0]))
        sy = int(round(draw[1] - nib[1]))
        shadow = np.asarray(self.pen.shadow, np.uint8)
        shx = sx + int(0.045 * em + 0.10 * em * lift)
        shy = sy + int(0.055 * em + 0.16 * em * lift)
        self._blit(frame, shadow, shx, shy, alpha_mul * (1.0 - 0.45 * lift))
        self._blit(frame, sprite, sx, sy, alpha_mul)

    def _blit(self, frame, sprite, x, y, alpha_mul=1.0):
        H, W = frame.shape[:2]
        h, w = sprite.shape[:2]
        X0, Y0 = max(0, x), max(0, y)
        X1, Y1 = min(W, x + w), min(H, y + h)
        if X1 <= X0 or Y1 <= Y0:
            return
        sub = sprite[Y0 - y:Y1 - y, X0 - x:X1 - x]
        a = sub[..., 3:4].astype(np.float32) / 255.0 * alpha_mul
        dst = frame[Y0:Y1, X0:X1]
        if dst.shape[-1] == 4:
            srgb = dst[..., :3].astype(np.float32)
            sa = dst[..., 3:4].astype(np.float32) / 255.0
            oa = a[..., 0] + sa[..., 0] * (1 - a[..., 0])
            safe = np.maximum(oa, 1e-5)[..., None]
            rgb = (sub[..., :3].astype(np.float32) * a + srgb * sa * (1 - a)) / safe
            dst[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
            dst[..., 3] = np.clip(oa * 255, 0, 255).astype(np.uint8)
        else:
            d = dst.astype(np.float32)
            dst[:] = np.clip(d * (1 - a) + sub[..., :3].astype(np.float32) * a,
                             0, 255).astype(np.uint8)

    def _shake_offset(self, t):
        off = np.zeros(2, np.float32)
        keep = []
        for (t0, amp, vec) in self.shakes:
            age = t - t0
            if 0 <= age < 0.25:
                off += vec * amp * math.exp(-age / 0.05) * math.cos(age * 70)
                keep.append((t0, amp, vec))
            elif age < 0:
                keep.append((t0, amp, vec))
        self.shakes = keep
        return off

    def frame_at(self, t) -> Image.Image:
        dt = max(1e-3, t - self.t_prev)
        self.t_prev = t
        self._advance_events(t)

        for lid, layer in self.layers.items():
            if (not layer.baked and layer.any_ink
                    and t > self.word_final_t.get(lid, 0.0) + self.dry_after
                    and t > layer.last_ink + self.dry_after
                    and (self.karaoke_rgb is None or t > layer.span[1] + 1.0)):
                self._bake_layer(layer)

        frame = self.baked.copy()
        for layer in self.layers.values():
            if not layer.baked and layer.any_ink:
                self._composite_live(frame, layer, t)

        if self.particle_on:
            self._draw_particles(frame, t, dt)
        if self.cfg.show_pen and not self.schedule.typewriter:
            self._draw_pen(frame, t)

        # camera
        if self.cfg.camera == "follow":
            if t < self.schedule.ink_end:
                pos, _, _ = self.schedule.pen_state(t)
                target = pos if pos is not None else (self.W / 2, self.H / 2)
                tz = self.cfg.zoom
            else:
                u = (t - self.schedule.ink_end) / 1.3
                target = (self.W / 2, self.H / 2)
                tz = self.cfg.zoom + (1.0 - self.cfg.zoom) * ease_in_out(min(u, 1.0))
            self.cam.update(target, tz, dt)
        shake = self._shake_offset(t) if self.shakes else (0.0, 0.0)
        rect = self.cam.crop_rect(shake)
        img = Image.fromarray(frame)
        img = img.resize((self.out_w, self.out_h), Image.LANCZOS, box=rect)
        return img

    def final_still(self) -> Image.Image:
        for layer in self.layers.values():
            if layer.baked:
                continue
            for cs in layer.comps.values():
                self._snap_comp(layer, cs, 0.0)
            self._bake_layer(layer)
        img = Image.fromarray(self.baked)
        return img.resize((self.out_w, self.out_h), Image.LANCZOS)
