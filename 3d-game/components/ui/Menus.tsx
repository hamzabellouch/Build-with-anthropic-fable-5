"use client";
import { useEffect } from "react";
import { useGame } from "@/lib/game/store";

function NeonButton({ children, onClick, primary = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group relative rounded px-8 py-3 font-mono text-sm font-bold tracking-[0.3em] transition-all duration-150
        ${primary
          ? "border border-cyan-300/70 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-300/25 hover:shadow-[0_0_24px_rgba(61,232,255,0.5)]"
          : "border border-white/20 bg-white/5 text-white/70 hover:border-white/50 hover:text-white hover:bg-white/10"}`}
      style={primary ? { textShadow: "0 0 10px #3de8ff" } : undefined}
    >
      {children}
    </button>
  );
}

function MuteToggle() {
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  return (
    <button
      onClick={toggleMute}
      className="pointer-events-auto fixed bottom-4 left-4 z-50 rounded border border-white/15 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] tracking-widest text-white/50 backdrop-blur-sm transition-colors hover:text-white"
    >
      {muted ? "🔇 MUTED" : "🔊 SOUND"}
    </button>
  );
}

function ControlRow({ k, action }: { k: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] text-cyan-200">{k}</span>
      <span className="text-[11px] tracking-wider text-white/55">{action}</span>
    </div>
  );
}

function TitleScreen() {
  const start = useGame((s) => s.start);
  const best = useGame((s) => s.best);
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/35 font-mono backdrop-blur-[2px] animate-fadein">
      <div className="text-center">
        <div className="mb-1 text-xs tracking-[0.7em] text-magenta neon-text-magenta">ARENA SURVIVAL</div>
        <h1 className="neon-title text-7xl font-bold tracking-[0.18em] text-cyan-100 sm:text-8xl">
          NEON&nbsp;VOID
        </h1>
        <p className="mt-4 text-xs tracking-[0.25em] text-white/45">
          THE SWARM IS ENDLESS · HOW LONG CAN YOU LAST?
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-2 rounded-lg border border-white/10 bg-black/40 p-5 backdrop-blur-sm">
        <ControlRow k="W A S D" action="MOVE" />
        <ControlRow k="MOUSE" action="AIM" />
        <ControlRow k="CLICK / SPACE" action="FIRE" />
        <ControlRow k="SHIFT" action="DASH" />
        <ControlRow k="P / ESC" action="PAUSE" />
        <ControlRow k="M" action="MUTE" />
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <NeonButton primary onClick={start}>▶ ENGAGE</NeonButton>
        <span className="text-[10px] tracking-widest text-white/30">OR PRESS ENTER</span>
      </div>

      {best > 0 && (
        <div className="mt-8 text-xs tracking-[0.3em] text-amber-200/80">
          ★ BEST SCORE {best.toLocaleString()}
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-[9px] tracking-widest text-white/25">
        COLLECT SHARDS TO UPGRADE YOUR WEAPON · KILL STREAKS RAISE YOUR MULTIPLIER
      </div>
    </div>
  );
}

function PauseScreen() {
  const resume = useGame((s) => s.resume);
  const restart = useGame((s) => s.restart);
  const quitToMenu = useGame((s) => s.quitToMenu);
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/60 font-mono backdrop-blur-sm animate-fadein">
      <h2 className="neon-title text-5xl font-bold tracking-[0.3em] text-cyan-100">PAUSED</h2>
      <div className="mt-10 flex flex-col gap-3">
        <NeonButton primary onClick={resume}>RESUME</NeonButton>
        <NeonButton onClick={restart}>RESTART</NeonButton>
        <NeonButton onClick={quitToMenu}>ABANDON RUN</NeonButton>
      </div>
      <span className="mt-6 text-[10px] tracking-widest text-white/30">ESC TO RESUME</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] tracking-[0.3em] text-white/40">{label}</div>
      <div className="mt-1 text-xl font-bold text-cyan-100">{value}</div>
    </div>
  );
}

function GameOverScreen() {
  const score = useGame((s) => s.score);
  const best = useGame((s) => s.best);
  const newBest = useGame((s) => s.newBest);
  const wave = useGame((s) => s.wave);
  const kills = useGame((s) => s.kills);
  const time = useGame((s) => s.time);
  const restart = useGame((s) => s.restart);
  const quitToMenu = useGame((s) => s.quitToMenu);

  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/65 font-mono backdrop-blur-sm animate-fadein">
      <div className="text-xs tracking-[0.6em] text-red-400 neon-text-red">SIGNAL LOST</div>
      <h2 className="neon-title mt-2 text-6xl font-bold tracking-[0.2em] text-white">GAME OVER</h2>

      <div className="mt-8 text-center">
        <div className="text-[11px] tracking-[0.4em] text-white/40">FINAL SCORE</div>
        <div className="text-5xl font-bold tabular-nums text-cyan-100 neon-text">{score.toLocaleString()}</div>
        {newBest ? (
          <div className="mt-2 text-sm font-bold tracking-[0.3em] text-amber-300 neon-flicker">★ NEW BEST ★</div>
        ) : (
          <div className="mt-2 text-[11px] tracking-widest text-white/35">BEST {best.toLocaleString()}</div>
        )}
      </div>

      <div className="mt-8 flex gap-10 rounded-lg border border-white/10 bg-black/40 px-8 py-4">
        <Stat label="WAVE" value={String(wave)} />
        <Stat label="KILLS" value={String(kills)} />
        <Stat label="SURVIVED" value={`${m}:${s.toString().padStart(2, "0")}`} />
      </div>

      <div className="mt-10 flex gap-4">
        <NeonButton primary onClick={restart}>↻ RETRY</NeonButton>
        <NeonButton onClick={quitToMenu}>MENU</NeonButton>
      </div>
      <span className="mt-5 text-[10px] tracking-widest text-white/30">ENTER TO RETRY</span>
    </div>
  );
}

export function Menus() {
  const phase = useGame((s) => s.phase);
  const loadPersisted = useGame((s) => s.loadPersisted);

  useEffect(() => {
    loadPersisted();
  }, [loadPersisted]);

  return (
    <>
      {phase === "menu" && <TitleScreen />}
      {phase === "paused" && <PauseScreen />}
      {phase === "gameover" && <GameOverScreen />}
      {phase !== "playing" && <MuteToggle />}
    </>
  );
}
