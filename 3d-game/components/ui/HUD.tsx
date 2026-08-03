"use client";
import { useEffect, useRef } from "react";
import { sim } from "@/lib/game/sim";
import { useGame } from "@/lib/game/store";

function fmtTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Red flash overlay driven straight from the sim (no react state churn). */
function HurtVignette() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) ref.current.style.opacity = String(sim.hurtFlash * 0.55);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 transition-none"
      style={{
        opacity: 0,
        background: "radial-gradient(ellipse at center, transparent 35%, rgba(255,30,40,0.85) 100%)",
      }}
    />
  );
}

function PowerChip({ label, time, max, color }: { label: string; time: number; max: number; color: string }) {
  if (time <= 0) return null;
  return (
    <div className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
      <div className="text-[10px] font-bold tracking-widest" style={{ color }}>{label}</div>
      <div className="mt-0.5 h-1 w-16 overflow-hidden rounded bg-white/10">
        <div className="h-full rounded" style={{ width: `${(time / max) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export function HUD() {
  const phase = useGame((s) => s.phase);
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const score = useGame((s) => s.score);
  const best = useGame((s) => s.best);
  const wave = useGame((s) => s.wave);
  const mult = useGame((s) => s.mult);
  const time = useGame((s) => s.time);
  const shards = useGame((s) => s.shards);
  const shardsNeed = useGame((s) => s.shardsNeed);
  const weaponLvl = useGame((s) => s.weaponLvl);
  const dashCd = useGame((s) => s.dashCd);
  const triple = useGame((s) => s.triple);
  const rapid = useGame((s) => s.rapid);
  const shield = useGame((s) => s.shield);
  const intermission = useGame((s) => s.intermission);

  if (phase !== "playing" && phase !== "paused") return null;

  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 55 ? "#3dff8a" : hpPct > 25 ? "#ffd23d" : "#ff3d5a";
  const multColor = mult >= 7 ? "#ff3dcd" : mult >= 4 ? "#ffae3d" : mult >= 2 ? "#3de8ff" : "#9aa7bd";
  const dashReady = dashCd <= 0;

  return (
    <div className="pointer-events-none fixed inset-0 select-none font-mono">
      <HurtVignette />

      {/* top-left: vitals */}
      <div className="absolute left-4 top-4 w-60">
        <div className="mb-1 flex items-baseline justify-between text-[11px] tracking-widest text-cyan-200/70">
          <span>HULL</span>
          <span style={{ color: hpColor }}>{hp}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-sm border border-white/15 bg-black/60">
          <div
            className="h-full rounded-sm transition-[width] duration-150"
            style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, ${hpColor}88, ${hpColor})`, boxShadow: `0 0 8px ${hpColor}` }}
          />
        </div>
        {shield > 0 && (
          <div className="mt-1.5 text-[11px] font-bold tracking-widest text-blue-300 neon-flicker">⬡ SHIELD ACTIVE</div>
        )}
      </div>

      {/* top-center: wave */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">
        <div className="text-[11px] tracking-[0.3em] text-cyan-200/60">WAVE</div>
        <div className="text-2xl font-bold text-cyan-100 neon-text">{intermission > 0 ? wave + 1 : wave}</div>
        <div className="mt-0.5 text-[10px] tracking-widest text-white/40">{fmtTime(time)}</div>
      </div>

      {/* top-right: score */}
      <div className="absolute right-4 top-4 text-right">
        <div className="text-[11px] tracking-[0.3em] text-cyan-200/60">SCORE</div>
        <div className="text-2xl font-bold tabular-nums text-white neon-text">{score.toLocaleString()}</div>
        <div className="mt-0.5 flex items-center justify-end gap-2">
          <span className="text-[10px] tracking-widest text-white/40">BEST {Math.max(best, score).toLocaleString()}</span>
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-bold"
            style={{ color: multColor, border: `1px solid ${multColor}55`, textShadow: `0 0 6px ${multColor}` }}
          >
            ×{mult}
          </span>
        </div>
      </div>

      {/* wave banner */}
      {intermission > 0 && wave >= 1 && (
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 text-center animate-banner">
          <div className="text-5xl font-bold tracking-[0.25em] text-cyan-100 neon-text">WAVE {wave + 1}</div>
          <div className="mt-2 text-xs tracking-[0.5em] text-cyan-300/70">INCOMING</div>
        </div>
      )}

      {/* bottom-left: powerups */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <PowerChip label="TRIPLE" time={triple} max={12} color="#ffae3d" />
        <PowerChip label="RAPID" time={rapid} max={12} color="#ffe83d" />
        <PowerChip label="SHIELD" time={shield} max={6} color="#5a8aff" />
      </div>

      {/* bottom-center: weapon progress */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <div className="mb-1 flex items-center justify-center gap-1.5">
          {[1, 2, 3].map((l) => (
            <span
              key={l}
              className="inline-block h-1.5 w-6 rounded-sm"
              style={{
                background: l <= weaponLvl ? "#3de8ff" : "rgba(255,255,255,0.12)",
                boxShadow: l <= weaponLvl ? "0 0 6px #3de8ff" : "none",
              }}
            />
          ))}
        </div>
        <div className="h-1 w-36 overflow-hidden rounded bg-white/10">
          <div
            className="h-full bg-cyan-300 transition-[width] duration-200"
            style={{ width: weaponLvl >= 3 ? "100%" : `${(shards / shardsNeed) * 100}%` }}
          />
        </div>
        <div className="mt-1 text-[9px] tracking-widest text-white/35">
          {weaponLvl >= 3 ? "WEAPON MAXED" : `SHARDS ${shards}/${shardsNeed}`}
        </div>
      </div>

      {/* bottom-right: dash + hints */}
      <div className="absolute bottom-4 right-4 text-right">
        <div
          className="mb-1 inline-block rounded px-2 py-1 text-[11px] font-bold tracking-widest"
          style={{
            color: dashReady ? "#3de8ff" : "#5a6a80",
            border: `1px solid ${dashReady ? "#3de8ff66" : "#ffffff22"}`,
            textShadow: dashReady ? "0 0 8px #3de8ff" : "none",
          }}
        >
          {dashReady ? "DASH READY" : `DASH ${dashCd.toFixed(1)}`}
        </div>
        <div className="text-[9px] tracking-widest text-white/30">[P] PAUSE · [M] MUTE</div>
      </div>
    </div>
  );
}
