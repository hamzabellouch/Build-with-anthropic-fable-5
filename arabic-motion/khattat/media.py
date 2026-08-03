"""Encoding (ffmpeg / PIL fallback), procedural audio, SRT, timeline JSON.

All sound is synthesized from the schedule itself: nib friction follows pen
velocity, dots land as soft taps, the typewriter gets thump+click+ring and a
line-feed ding. Stereo position tracks the pen across the page.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

from .plan import Schedule

SR = 44100

PEN_VOICES = {  # (band centers Hz, band sigmas, band gains, master gain)
    "qalam": ((1700, 5200), (950, 2100), (1.0, 0.38), 0.85),
    "fountain": ((1450, 3800), (800, 1500), (1.0, 0.22), 0.7),
    "pencil": ((2600, 6000), (1400, 2400), (1.0, 0.30), 0.8),
    "chalk": ((850, 2300), (480, 1300), (1.0, 0.35), 1.0),
    "brush": ((520, 1600), (380, 900), (1.0, 0.25), 0.45),
    "none": ((1500,), (900,), (1.0,), 0.6),
}


def _shaped_noise(rng, n, centers, sigmas, gains):
    noise = rng.standard_normal(n).astype(np.float32)
    spec = np.fft.rfft(noise)
    f = np.fft.rfftfreq(n, 1 / SR)
    H = np.zeros_like(f)
    for c, s, g in zip(centers, sigmas, gains):
        H += g * np.exp(-0.5 * ((f - c) / s) ** 2)
    out = np.fft.irfft(spec * H, n).astype(np.float32)
    peak = np.abs(out).max() or 1.0
    return out / peak


def _add_burst(track, t0, dur, wave_fn, amp):
    i0 = int(t0 * SR)
    n = int(dur * SR)
    if i0 >= len(track) or n <= 0:
        return
    n = min(n, len(track) - i0)
    t = np.arange(n, dtype=np.float32) / SR
    track[i0:i0 + n] += wave_fn(t).astype(np.float32) * amp


def synth_audio(schedule: Schedule, pen: str, em: float, width: int,
                out_wav: Path, seed: int = 7, volume: float = 1.0,
                paper_chalky: bool = False) -> Path:
    rng = np.random.default_rng(seed + 1000)
    dur = schedule.duration
    n = int(dur * SR) + SR // 10
    mono = np.zeros(n, np.float32)

    centers, sigmas, gains, master = PEN_VOICES.get(pen, PEN_VOICES["qalam"])
    if paper_chalky:
        centers = tuple(c * 0.75 for c in centers)

    # --- friction bed driven by pen velocity --------------------------------
    env_hz = 240
    ts = np.arange(0, dur, 1 / env_hz)
    speed = np.zeros(len(ts), np.float32)
    lift = np.ones(len(ts), np.float32)
    xs = np.full(len(ts), 0.5, np.float32)
    for i, t in enumerate(ts):
        pos, lf, sp = schedule.pen_state(float(t))
        if pos is not None:
            xs[i] = float(pos[0]) / max(width, 1)
        speed[i] = sp
        lift[i] = lf
    v_ref = 2.1 * em
    amp = np.clip(speed / v_ref, 0, 1.8) ** 0.72
    amp *= (lift < 0.22)
    # smooth the envelope a touch
    k = np.ones(9, np.float32) / 9
    amp = np.convolve(amp, k, mode="same")

    if not schedule.typewriter:
        sample_t = np.arange(n, dtype=np.float32) / SR
        amp_s = np.interp(sample_t, ts, amp, left=0, right=0)
        scratch = _shaped_noise(rng, n, centers, sigmas, gains)
        # fiber crackle: slow random gate squared, stronger for reed and chalk
        gate = np.interp(sample_t,
                         np.arange(0, dur, 1 / 60),
                         rng.random(len(np.arange(0, dur, 1 / 60))).astype(np.float32),
                         left=0, right=0)
        crackle = 0.55 + 0.45 * gate ** 2 if pen in ("qalam", "chalk", "pencil") else 1.0
        mono += scratch * amp_s * crackle * 0.40 * master

    # --- discrete events ----------------------------------------------------
    prev_line = None
    tap_noise = _shaped_noise(rng, SR // 4, (3000,), (1600,), (1.0,))
    for e in schedule.events:
        if e.kind != "stamp":
            if e.word is not None and prev_line is None:
                prev_line = e.word.placed.line
            continue
        if schedule.typewriter:
            _add_burst(mono, e.t0, 0.030,
                       lambda t: np.sin(2 * np.pi * 64 * t) * np.exp(-t / 0.014), 0.55)
            seg = tap_noise[:int(0.025 * SR)]
            _add_burst(mono, e.t0, 0.025,
                       lambda t, s=seg: s[:len(t)] * np.exp(-t / 0.005), 0.8)
            _add_burst(mono, e.t0 + 0.002, 0.08,
                       lambda t: np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.025), 0.05)
            line = e.word.placed.line if e.word is not None else prev_line
            if prev_line is not None and line is not None and line != prev_line:
                _add_burst(mono, e.t0 - 0.05, 0.9,
                           lambda t: (np.sin(2 * np.pi * 1568 * t)
                                      + 0.5 * np.sin(2 * np.pi * 2349 * t))
                           * np.exp(-t / 0.30), 0.17)
            if e.word is not None:
                prev_line = e.word.placed.line
        else:
            size = float(e.stroke.radii[0]) if e.stroke is not None else 4.0
            a = min(0.5, 0.16 + size / em * 1.6)
            seg = tap_noise[:int(0.03 * SR)]
            _add_burst(mono, e.t0, 0.03,
                       lambda t, s=seg: s[:len(t)] * np.exp(-t / 0.009), a)

    # --- room tone, master, stereo -----------------------------------------
    bed = _shaped_noise(rng, n, (300,), (260,), (1.0,)) * 0.012
    mono += bed
    peak = np.abs(mono).max()
    if peak > 1e-4:
        mono *= min(0.74 / peak, 9.0)  # normalize up or down, but never blow up
    mono *= volume
    fade = int(0.35 * SR)
    if n > 2 * fade:
        mono[-fade:] *= np.linspace(1, 0, fade)
        mono[:int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))

    sample_t = np.arange(n, dtype=np.float32) / SR
    pan = np.interp(sample_t, ts, np.clip(xs, 0, 1), left=0.5, right=0.5)
    pan = 0.5 + (pan - 0.5) * 0.55
    left = mono * np.cos(pan * np.pi / 2).astype(np.float32)
    right = mono * np.sin(pan * np.pi / 2).astype(np.float32)

    stereo = np.stack([left, right], axis=1)
    pcm = np.clip(stereo * 32767, -32768, 32767).astype(np.int16)
    with wave.open(str(out_wav), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return out_wav

# ---------------------------------------------------------------- encoding


def have_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


class VideoSink:
    """Pipes raw frames into ffmpeg (or buffers for the PIL GIF fallback)."""

    def __init__(self, out: Path, size, fps, fmt="mp4", crf=18,
                 audio: Path | None = None, alpha=False):
        self.out = Path(out)
        self.size = size
        self.fps = fps
        self.fmt = fmt
        self.alpha = alpha and fmt in ("webm", "frames")
        self.frames_dir = None
        self.proc = None
        self._pil_frames = []
        self.frame_count = 0

        if fmt == "frames":
            self.frames_dir = self.out
            self.frames_dir.mkdir(parents=True, exist_ok=True)
            return
        if not have_ffmpeg():
            if fmt == "gif":
                return  # PIL fallback
            raise RuntimeError(
                "ffmpeg not found — install it, or render --to gif/frames/png")

        pix_in = "rgba" if self.alpha else "rgb24"
        cmd = ["ffmpeg", "-y", "-loglevel", "error",
               "-f", "rawvideo", "-pix_fmt", pix_in,
               "-s", f"{size[0]}x{size[1]}", "-r", str(fps), "-i", "-"]
        if audio and fmt in ("mp4", "webm"):
            cmd += ["-i", str(audio)]
        if fmt == "mp4":
            cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
        elif fmt == "webm":
            cmd += ["-c:v", "libvpx-vp9", "-crf", str(max(24, crf + 12)),
                    "-b:v", "0", "-row-mt", "1",
                    "-pix_fmt", "yuva420p" if self.alpha else "yuv420p"]
        elif fmt == "gif":
            vf = (f"fps={min(fps, 18)},split[a][b];[a]palettegen=max_colors=160[p];"
                  f"[b][p]paletteuse=dither=bayer:bayer_scale=4")
            cmd += ["-vf", vf, "-loop", "0"]
        if audio and fmt == "mp4":
            cmd += ["-c:a", "aac", "-b:a", "160k", "-shortest"]
        elif audio and fmt == "webm":
            cmd += ["-c:a", "libopus", "-b:a", "128k", "-shortest"]
        cmd += [str(self.out)]
        self.proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    def write(self, img):
        self.frame_count += 1
        if self.frames_dir is not None:
            img.save(self.frames_dir / f"frame_{self.frame_count:05d}.png")
            return
        if self.proc is None:  # PIL gif fallback
            if self.frame_count % max(1, round(self.fps / 14)) == 0:
                self._pil_frames.append(img.convert("P", palette=1, colors=160))
            return
        mode = "RGBA" if self.alpha else "RGB"
        if img.mode != mode:
            img = img.convert(mode)
        self.proc.stdin.write(img.tobytes())

    def close(self):
        if self.proc is not None:
            self.proc.stdin.close()
            ret = self.proc.wait()
            if ret != 0:
                raise RuntimeError(f"ffmpeg exited with {ret}")
        elif self.frames_dir is None and self._pil_frames:
            self._pil_frames[0].save(
                self.out, save_all=True, append_images=self._pil_frames[1:],
                duration=int(1000 / 14), loop=0, optimize=True)

# ---------------------------------------------------------------- sidecars


def _srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(schedule: Schedule, path: Path):
    lines = []
    spans = [(a, t0, t1) for a, t0, t1 in schedule.word_spans
             if a.text and a.text != "﹏"]
    for i, (art, t0, t1) in enumerate(spans, 1):
        end = spans[i][1] if i < len(spans) else t1 + 0.6
        lines += [str(i), f"{_srt_time(t0)} --> {_srt_time(max(t1, min(end, t1 + 2)))}",
                  art.text, ""]
    Path(path).write_text("\n".join(lines), encoding="utf-8")
    return path


def write_timeline(schedule: Schedule, cfg, path: Path):
    data = {
        "text": cfg.text,
        "duration": round(schedule.duration, 3),
        "ink_end": round(schedule.ink_end, 3),
        "fps": cfg.fps,
        "size": list(cfg.size),
        "font": cfg.font,
        "pen": cfg.pen,
        "mode": cfg.mode,
        "words": [
            {"text": a.text, "line": a.placed.line,
             "start": round(t0, 3), "end": round(t1, 3)}
            for a, t0, t1 in schedule.word_spans if a.text != "﹏"
        ],
        "events": len(schedule.events),
    }
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2),
                          encoding="utf-8")
    return path
