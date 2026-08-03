"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BALL_R_MAX,
  BALL_R_MIN,
  World,
  type ContactEvent,
} from "@/lib/physics";
import { ChimeAudio } from "@/lib/audio";

const DT = 1 / 240; // fixed physics timestep, s (4 substeps per 60 Hz frame)
const MAX_BALLS = 60;

const DEFAULTS = {
  gravity: 9.81, // m/s² — Earth
  restitution: 0.9,
  spin: 0.28, // rad/s — one turn every ~22 s
  balls: 14,
  radius: 2.6, // m — container circumradius
  sides: 6,
  wallFriction: 0.05,
};

const PALETTE: [number, number, number][] = [
  [126, 240, 196], // mint
  [255, 159, 178], // rose
  [183, 169, 255], // lavender
  [143, 208, 255], // sky
  [255, 200, 158], // peach
  [244, 230, 168], // butter
];

interface View {
  w: number;
  h: number;
  dpr: number;
  scale: number; // px per metre
  cx: number;
  cy: number;
}

interface Spark {
  x: number; // world m
  y: number;
  born: number; // s
  life: number; // s
  impact: number; // m/s
  colorIndex: number;
}

interface Sprite {
  canvas: HTMLCanvasElement;
  size: number; // logical px
}

declare global {
  interface Window {
    __asmr?: { world: World | null; World: typeof World };
  }
}

const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const mix = (c: [number, number, number], target: number, t: number) =>
  `rgb(${c.map((ch) => Math.round(ch + (target - ch) * t)).join(",")})`;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** Deterministic PRNG so the starfield doesn't jump on resize. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildBackground(w: number, h: number, dpr: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  g.fillStyle = "#05060f";
  g.fillRect(0, 0, w, h);
  const grad = g.createRadialGradient(
    w / 2,
    h * 0.46,
    0,
    w / 2,
    h * 0.46,
    Math.max(w, h) * 0.72,
  );
  grad.addColorStop(0, "#11142c");
  grad.addColorStop(0.55, "#0a0c1d");
  grad.addColorStop(1, "#04050d");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  const rand = mulberry32(7);
  for (let i = 0; i < 110; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 0.4 + rand() * 1.1;
    g.fillStyle = `rgba(200,215,255,${0.03 + rand() * 0.12})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

function getSprite(
  cache: Map<string, Sprite>,
  colorIndex: number,
  rLogical: number,
  dpr: number,
): Sprite {
  const rpx = Math.max(2, Math.round(rLogical));
  const key = `${colorIndex}:${rpx}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const color = PALETTE[colorIndex % PALETTE.length];
  const pad = Math.ceil(rpx * 2);
  const size = (rpx + pad) * 2;
  const c = document.createElement("canvas");
  c.width = size * dpr;
  c.height = size * dpr;
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const cx = size / 2;
  const cy = size / 2;

  // Soft halo.
  let grad = g.createRadialGradient(cx, cy, rpx * 0.5, cx, cy, rpx + pad);
  grad.addColorStop(0, rgba(color, 0.3));
  grad.addColorStop(0.55, rgba(color, 0.08));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);

  // Glass body with an off-centre light.
  grad = g.createRadialGradient(
    cx - rpx * 0.38,
    cy - rpx * 0.44,
    rpx * 0.1,
    cx,
    cy,
    rpx,
  );
  grad.addColorStop(0, mix(color, 255, 0.82));
  grad.addColorStop(0.35, mix(color, 255, 0.3));
  grad.addColorStop(0.78, mix(color, 0, 0));
  grad.addColorStop(1, mix(color, 0, 0.45));
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, rpx, 0, Math.PI * 2);
  g.fill();

  // Specular glint.
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.beginPath();
  g.ellipse(
    cx - rpx * 0.36,
    cy - rpx * 0.44,
    rpx * 0.17,
    rpx * 0.11,
    -0.6,
    0,
    Math.PI * 2,
  );
  g.fill();

  const sprite = { canvas: c, size };
  cache.set(key, sprite);
  return sprite;
}

export default function AsmrSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World | null>(null);
  const audioRef = useRef<ChimeAudio | null>(null);
  const viewRef = useRef<View>({ w: 0, h: 0, dpr: 1, scale: 100, cx: 0, cy: 0 });
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const spriteCacheRef = useRef<Map<string, Sprite>>(new Map());
  const trailsRef = useRef<Map<number, { x: number; y: number }[]>>(new Map());
  const sparksRef = useRef<Spark[]>([]);
  const statsLine1Ref = useRef<HTMLDivElement | null>(null);
  const statsLine2Ref = useRef<HTMLDivElement | null>(null);

  const pausedRef = useRef(false);
  const targetRef = useRef(DEFAULTS.balls);

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hasDropped, setHasDropped] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

  const [gravity, setGravity] = useState(DEFAULTS.gravity);
  const [restitution, setRestitution] = useState(DEFAULTS.restitution);
  const [spin, setSpin] = useState(DEFAULTS.spin);
  const [ballTarget, setBallTarget] = useState(DEFAULTS.balls);

  // Keep refs and the live world in sync with UI state.
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    targetRef.current = ballTarget;
  }, [ballTarget]);
  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);
  useEffect(() => {
    const w = worldRef.current;
    if (!w) return;
    w.params.gravity = gravity;
    w.params.restitution = restitution;
    w.params.spin = spin;
  }, [gravity, restitution, spin]);

  // Main simulation loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const world = new World({
      gravity: DEFAULTS.gravity,
      restitution: DEFAULTS.restitution,
      wallFriction: DEFAULTS.wallFriction,
      spin: DEFAULTS.spin,
      radius: DEFAULTS.radius,
      sides: DEFAULTS.sides,
    });
    worldRef.current = world;
    window.__asmr = {
      get world() {
        return worldRef.current;
      },
      World,
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      viewRef.current = {
        w,
        h,
        dpr,
        scale: (Math.min(w, h) * 0.44) / DEFAULTS.radius,
        cx: w / 2,
        cy: h / 2,
      };
      bgRef.current = buildBackground(w, h, dpr);
      spriteCacheRef.current.clear();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now() / 1000;
    let acc = 0;
    let lastStats = 0;

    const handleEvents = (events: ContactEvent[], now: number) => {
      const audio = audioRef.current;
      const sparks = sparksRef.current;
      for (const ev of events) {
        const sizeT = clamp(
          (ev.r - BALL_R_MIN) / (BALL_R_MAX - BALL_R_MIN),
          0,
          1,
        );
        const vel = clamp((ev.impact - 0.25) / 5, 0, 1) ** 1.25;
        const pan = clamp(ev.x / DEFAULTS.radius, -1, 1) * 0.85;
        if (audio && vel > 0.02) {
          if (ev.kind === "ball") audio.chime(sizeT, vel, pan, ev.id);
          else audio.thump(sizeT, vel * 0.9, pan, ev.id);
        }
        if (ev.impact > 0.8 && sparks.length < 70) {
          sparks.push({
            x: ev.x,
            y: ev.y,
            born: now,
            life: 0.55,
            impact: ev.impact,
            colorIndex: ev.colorIndex,
          });
        }
      }
    };

    const draw = (now: number) => {
      const { w, h, dpr, scale, cx, cy } = viewRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0, w, h);

      // Container vertices in screen space.
      const R = world.params.radius * scale;
      const sides = world.params.sides;
      const verts: [number, number][] = [];
      for (let i = 0; i < sides; i++) {
        const a = world.angle + (i / sides) * Math.PI * 2;
        verts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
      }
      const tracePolygon = () => {
        ctx.beginPath();
        ctx.moveTo(verts[0][0], verts[0][1]);
        for (let i = 1; i < sides; i++) ctx.lineTo(verts[i][0], verts[i][1]);
        ctx.closePath();
      };

      tracePolygon();
      ctx.fillStyle = "rgba(130,150,255,0.035)";
      ctx.fill();

      // Motion trails.
      ctx.globalCompositeOperation = "lighter";
      for (const b of world.balls) {
        const trail = trailsRef.current.get(b.id);
        if (!trail || trail.length < 2) continue;
        const color = PALETTE[b.colorIndex % PALETTE.length];
        const rpx = b.r * scale;
        for (let k = 0; k < trail.length; k++) {
          const f = (k + 1) / trail.length;
          ctx.fillStyle = rgba(color, 0.07 * f);
          ctx.beginPath();
          ctx.arc(
            cx + trail[k].x * scale,
            cy + trail[k].y * scale,
            rpx * (0.25 + 0.5 * f),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // Marbles.
      for (const b of world.balls) {
        const sprite = getSprite(
          spriteCacheRef.current,
          b.colorIndex,
          b.r * scale,
          dpr,
        );
        ctx.drawImage(
          sprite.canvas,
          cx + b.x * scale - sprite.size / 2,
          cy + b.y * scale - sprite.size / 2,
          sprite.size,
          sprite.size,
        );
      }

      // Impact ripples.
      ctx.globalCompositeOperation = "lighter";
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const t = (now - s.born) / s.life;
        if (t >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        const ease = 1 - (1 - t) * (1 - t);
        const k = clamp(s.impact / 6, 0, 1);
        const radius = scale * (0.05 + 0.11 * k) * (0.3 + 0.7 * ease);
        ctx.strokeStyle = rgba(
          PALETTE[s.colorIndex % PALETTE.length],
          0.5 * (1 - t),
        );
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + s.x * scale, cy + s.y * scale, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";

      // Glowing rim, drawn last so it reads as the front of the vessel.
      ctx.save();
      tracePolygon();
      ctx.shadowColor = "rgba(140,165,255,0.9)";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "rgba(195,208,255,0.85)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
      tracePolygon();
      ctx.strokeStyle = "rgba(150,170,255,0.07)";
      ctx.lineWidth = 7;
      ctx.stroke();
    };

    const frame = (tMs: number) => {
      raf = requestAnimationFrame(frame);
      const now = tMs / 1000;
      const ft = Math.min(now - last, 1 / 20);
      last = now;

      // Stream marbles in/out toward the slider target, one per frame.
      if (world.balls.length < targetRef.current) world.addBall();
      else if (world.balls.length > targetRef.current) {
        world.removeOldest();
        trailsRef.current.clear();
      }

      if (!pausedRef.current) {
        acc += ft;
        while (acc >= DT) {
          world.step(DT);
          acc -= DT;
        }
        for (const b of world.balls) {
          let trail = trailsRef.current.get(b.id);
          if (!trail) {
            trail = [];
            trailsRef.current.set(b.id, trail);
          }
          trail.push({ x: b.x, y: b.y });
          if (trail.length > 10) trail.shift();
        }
      }

      handleEvents(world.takeEvents(), now);
      draw(now);

      if (now - lastStats > 0.15) {
        lastStats = now;
        const { ke, pe, total } = world.energy();
        const p = world.params;
        if (statsLine1Ref.current) {
          statsLine1Ref.current.textContent = `${world.balls.length} marbles · g ${p.gravity.toFixed(2)} m/s² · e ${p.restitution.toFixed(2)} · ω ${p.spin.toFixed(2)} rad/s`;
        }
        if (statsLine2Ref.current) {
          statsLine2Ref.current.textContent = `Ek ${ke.toFixed(1)} J · Ep ${pe.toFixed(1)} J · E ${total.toFixed(1)} J`;
        }
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      delete window.__asmr;
      worldRef.current = null;
      void audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  // Auto-hide the controls while the pointer is idle.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setUiVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setUiVisible(false), 3800);
    };
    wake();
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
    };
  }, []);

  // Keyboard: space = pause, m = mute.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === "m" || e.key === "M") {
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const begin = useCallback(() => {
    const audio = audioRef.current ?? new ChimeAudio();
    audioRef.current = audio;
    audio.setMuted(muted);
    void audio.init();
    setStarted(true);
  }, [muted]);

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const world = worldRef.current;
      const canvas = canvasRef.current;
      if (!world || !canvas || !started) return;
      const rect = canvas.getBoundingClientRect();
      const { scale, cx, cy } = viewRef.current;
      const wx = (e.clientX - rect.left - cx) / scale;
      const wy = (e.clientY - rect.top - cy) / scale;
      if (
        Math.hypot(wx, wy) < world.params.radius * 0.92 &&
        world.balls.length < MAX_BALLS
      ) {
        world.addBall(wx, wy);
        setBallTarget(world.balls.length);
        setHasDropped(true);
      }
    },
    [started],
  );

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#05060f] text-white">
      <canvas
        ref={canvasRef}
        onPointerDown={onCanvasPointerDown}
        className="absolute inset-0 h-full w-full cursor-crosshair"
      />

      {/* Title */}
      <div
        className={`pointer-events-none absolute left-6 top-6 transition-opacity duration-1000 ${
          started ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="text-sm font-light uppercase tracking-[0.45em] text-white/70">
          marble chimes
        </h1>
        <p className="mt-1 text-[11px] tracking-wide text-white/30">
          an asmr physics simulation
        </p>
      </div>

      {/* Physics readout */}
      <div
        className={`pointer-events-none absolute right-6 top-6 text-right font-mono text-[11px] leading-5 text-white/35 transition-opacity duration-1000 ${
          started ? "opacity-100" : "opacity-0"
        }`}
      >
        <div ref={statsLine1Ref} />
        <div ref={statsLine2Ref} />
      </div>

      {/* Hint */}
      {started && !hasDropped && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 animate-pulse text-xs tracking-[0.25em] text-white/25">
          click anywhere to drop a marble
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-5 left-1/2 z-10 w-max max-w-[96vw] -translate-x-1/2 transition-opacity duration-700 ${
          uiVisible && started ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "resume" : "pause"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {paused ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 1.5 12 7 3 12.5z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2.5" y="1.5" width="3.2" height="11" rx="1" />
                <rect x="8.3" y="1.5" width="3.2" height="11" rx="1" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "unmute" : "mute"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.5 3.5 4.5 6H2v4h2.5l3 2.5z" fill="currentColor" stroke="none" />
                <path d="m10.5 6 4 4m0-4-4 4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M7.5 3.5 4.5 6H2v4h2.5l3 2.5z" fill="currentColor" stroke="none" />
                <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5" />
                <path d="M12.3 3.8a6 6 0 0 1 0 8.4" />
              </svg>
            )}
          </button>

          <div className="hidden h-9 w-px bg-white/10 sm:block" />

          <Slider
            label="gravity"
            value={gravity}
            min={0}
            max={20}
            step={0.01}
            display={`${gravity.toFixed(2)}`}
            onChange={setGravity}
          />
          <Slider
            label="bounce"
            value={restitution}
            min={0.5}
            max={1}
            step={0.01}
            display={restitution.toFixed(2)}
            onChange={setRestitution}
          />
          <Slider
            label="spin"
            value={spin}
            min={-0.8}
            max={0.8}
            step={0.01}
            display={spin.toFixed(2)}
            onChange={setSpin}
          />
          <Slider
            label="marbles"
            value={ballTarget}
            min={1}
            max={MAX_BALLS}
            step={1}
            display={`${ballTarget}`}
            onChange={(v) => setBallTarget(Math.round(v))}
          />
        </div>
      </div>

      {/* Begin overlay */}
      {!started && (
        <button
          onClick={begin}
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-7 bg-[#05060f]/55 backdrop-blur-md"
        >
          <h1 className="pl-[0.55em] text-2xl font-light uppercase tracking-[0.55em] text-white/85 sm:text-3xl">
            marble chimes
          </h1>
          <p className="max-w-md px-8 text-center text-sm leading-7 text-white/40">
            glass marbles drift inside a slowly turning hexagon — real gravity,
            conservation of momentum, and a soft pentatonic chime for every
            collision
          </p>
          <span className="rounded-full border border-white/25 px-10 py-3 text-sm uppercase tracking-[0.3em] text-white/80 transition hover:border-white/50 hover:bg-white/10">
            begin
          </span>
          <span className="text-xs tracking-[0.2em] text-white/30">
            headphones recommended
          </span>
        </button>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex w-28 flex-col gap-1.5 sm:w-32">
      <span className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.18em] text-white/40">
        <span>{label}</span>
        <span className="font-mono normal-case tracking-normal text-white/55">
          {display}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="asmr-range"
        aria-label={label}
      />
    </label>
  );
}
