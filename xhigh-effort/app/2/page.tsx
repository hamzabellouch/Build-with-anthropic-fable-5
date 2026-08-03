import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEONDRIFT — Browser-Based Synthwave Studio",
  description:
    "NEONDRIFT is a browser-based synth studio for synthwave producers. Analog-modeled oscillators, a neon step sequencer, and realtime cloud collaboration — no install, just drift.",
};

const EQ_BARS = [38, 72, 54, 90, 64, 82, 46, 70, 58, 88, 50, 76, 42, 66, 84, 60];

const STEPS = [
  true, false, true, false, true, true, false, true,
  false, true, false, true, true, false, true, false,
];

export default function NeondriftLanding() {
  return (
    <div className="min-h-screen bg-[#0a0118] text-zinc-100 antialiased overflow-x-hidden selection:bg-fuchsia-500/40">
      <style>{`
        @keyframes lp2-glow-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes lp2-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.08); }
          66% { transform: translate(-30px, 25px) scale(0.95); }
        }
        @keyframes lp2-eq {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        @keyframes lp2-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .lp2-glow { animation: lp2-glow-pulse 3.2s ease-in-out infinite; }
        .lp2-orb { animation: lp2-drift 14s ease-in-out infinite; }
        .lp2-orb-slow { animation: lp2-drift 22s ease-in-out infinite reverse; }
        .lp2-eq-bar { animation: lp2-eq 1.1s ease-in-out infinite; transform-origin: bottom; }
        .lp2-scanline { animation: lp2-scan 7s linear infinite; }
      `}</style>

      {/* ===== ambient orbs ===== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="lp2-orb absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="lp2-orb-slow absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="lp2-orb absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="lp2-scanline absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </div>

      {/* ===== nav ===== */}
      <header className="relative z-20 border-b border-fuchsia-500/15 bg-[#0a0118]/80 backdrop-blur-md sticky top-0">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-3 group">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-fuchsia-500 to-cyan-400 shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-shadow group-hover:shadow-[0_0_35px_rgba(217,70,239,0.8)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#0a0118]" fill="currentColor" aria-hidden="true">
                <path d="M3 12h3l2-7 4 14 3-10 2 3h4" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-mono text-lg font-bold tracking-[0.25em] text-white">
              NEON<span className="text-fuchsia-400">DRIFT</span>
            </span>
          </a>
          <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-widest text-zinc-400 md:flex">
            <a href="#engine" className="transition-colors hover:text-cyan-300">Engine</a>
            <a href="#sequencer" className="transition-colors hover:text-cyan-300">Sequencer</a>
            <a href="#collab" className="transition-colors hover:text-cyan-300">Collab</a>
            <a href="#artists" className="transition-colors hover:text-cyan-300">Artists</a>
            <a href="#pricing" className="transition-colors hover:text-cyan-300">Pricing</a>
          </div>
          <a
            href="#pricing"
            className="rounded-md border border-fuchsia-500/60 bg-fuchsia-500/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-fuchsia-300 transition-all hover:bg-fuchsia-500 hover:text-white hover:shadow-[0_0_25px_rgba(217,70,239,0.6)]"
          >
            Launch Studio
          </a>
        </nav>
      </header>

      {/* ===== hero ===== */}
      <section className="relative z-10 overflow-hidden">
        {/* retro perspective grid horizon */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 sm:h-96" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lp2GridFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" stopOpacity="0" />
                <stop offset="45%" stopColor="#d946ef" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="lp2Horizon" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                <stop offset="50%" stopColor="#d946ef" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* horizon line */}
            <line x1="0" y1="60" x2="1200" y2="60" stroke="url(#lp2Horizon)" strokeWidth="2" />
            {/* converging vertical lines */}
            {Array.from({ length: 21 }, (_, i) => {
              const xTop = 600 + (i - 10) * 28;
              const xBottom = 600 + (i - 10) * 130;
              return (
                <line key={`v${i}`} x1={xTop} y1="60" x2={xBottom} y2="400" stroke="url(#lp2GridFade)" strokeWidth="1" />
              );
            })}
            {/* horizontal rows, spacing widens toward viewer */}
            {[70, 84, 102, 126, 158, 200, 254, 322, 398].map((y, i) => (
              <line key={`h${i}`} x1="0" y1={y} x2="1200" y2={y} stroke="url(#lp2GridFade)" strokeWidth={i < 3 ? 0.6 : 1.1} />
            ))}
            {/* setting sun */}
            <circle cx="600" cy="58" r="90" fill="#d946ef" opacity="0.12" />
            <circle cx="600" cy="58" r="55" fill="#f0abfc" opacity="0.18" />
          </svg>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0118] via-[#0a0118]/60 to-transparent" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-48 pt-20 sm:pt-28 lg:grid-cols-2 lg:items-center lg:gap-10">
          <div>
            <p className="lp2-glow mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" />
              v2.0 — Outrun Update Live
            </p>
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
                Produce the
              </span>
              <br />
              <span className="text-white drop-shadow-[0_0_25px_rgba(217,70,239,0.45)]">future of 1984.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
              NEONDRIFT is a full synthwave studio that runs in your browser tab. Analog-modeled
              oscillators, a 16-step neon sequencer, and zero-latency cloud sessions — no installs,
              no dongles, just the drive.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <a
                href="#pricing"
                className="rounded-md bg-gradient-to-r from-fuchsia-500 to-purple-600 px-8 py-4 text-center font-mono text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_30px_rgba(217,70,239,0.45)] transition-all hover:shadow-[0_0_50px_rgba(217,70,239,0.8)] hover:brightness-110"
              >
                Start Free Session
              </a>
              <a
                href="#mockup"
                className="rounded-md border border-cyan-400/50 px-8 py-4 text-center font-mono text-sm font-bold uppercase tracking-widest text-cyan-300 transition-all hover:bg-cyan-400/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)]"
              >
                Watch the Rig ▸
              </a>
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-zinc-500">
              No credit card · Runs on any laptop made after 1986*
            </p>
          </div>

          {/* fake synth panel */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/20 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-xl border border-fuchsia-500/30 bg-[#120726]/90 p-5 shadow-[0_0_60px_rgba(168,85,247,0.25)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fuchsia-300">
                  OSC-A // Midnight Saw
                </span>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/70" />
                </div>
              </div>
              {/* eq visualizer */}
              <div className="flex h-28 items-end justify-between gap-1.5 rounded-md border border-cyan-400/20 bg-black/50 p-3">
                {EQ_BARS.map((h, i) => (
                  <div
                    key={i}
                    className="lp2-eq-bar w-full rounded-sm bg-gradient-to-t from-fuchsia-500 via-purple-400 to-cyan-300"
                    style={{ height: `${h}%`, animationDelay: `${(i % 5) * 0.13}s` }}
                  />
                ))}
              </div>
              {/* knobs */}
              <div className="mt-5 grid grid-cols-4 gap-4">
                {[
                  ["CUTOFF", "62%", "-rotate-45"],
                  ["RESO", "38%", "rotate-12"],
                  ["DRIVE", "81%", "rotate-45"],
                  ["DRIFT", "55%", "rotate-90"],
                ].map(([label, val, rot]) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="relative h-12 w-12 rounded-full border-2 border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                      <span className={`absolute left-1/2 top-1 h-4 w-0.5 -translate-x-1/2 bg-cyan-300 ${rot}`} style={{ transformOrigin: "50% 130%" }} />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">{label}</span>
                    <span className="font-mono text-[10px] text-cyan-300">{val}</span>
                  </div>
                ))}
              </div>
              {/* mini keys */}
              <div className="mt-5 flex h-14 overflow-hidden rounded-md border border-white/10">
                {Array.from({ length: 14 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 border-r border-zinc-800 last:border-r-0 transition-colors hover:bg-fuchsia-500/40 ${
                      [1, 2, 4, 5, 6, 8, 9, 11, 12, 13].includes(i) ? "bg-zinc-100/90" : "bg-zinc-900"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== stats strip ===== */}
      <section className="relative z-10 border-y border-fuchsia-500/15 bg-[#0d0220]/80">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 text-center md:grid-cols-4">
          {[
            ["412K", "Producers drifting"],
            ["9.4M", "Tracks rendered"],
            ["38ms", "Avg. collab latency"],
            ["1986", "Vibe accuracy, in year"],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
                {num}
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== features ===== */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-400">{"// The Toolkit"}</p>
        <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
          Three machines.{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
            One endless highway.
          </span>
        </h2>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {/* synth engine */}
          <article
            id="engine"
            className="group rounded-xl border border-fuchsia-500/20 bg-[#120726]/60 p-8 transition-all hover:border-fuchsia-400/60 hover:shadow-[0_0_40px_rgba(217,70,239,0.25)]"
          >
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.2)] transition-shadow group-hover:shadow-[0_0_30px_rgba(217,70,239,0.5)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M2 12c2 0 2-6 4-6s2 12 4 12 2-12 4-12 2 12 4 12 2-6 4-6" />
              </svg>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-fuchsia-400">01 / Synth Engine</p>
            <h3 className="mt-3 text-2xl font-bold text-white">VHS-grade oscillators</h3>
            <p className="mt-4 leading-relaxed text-zinc-400">
              Six analog-modeled voices with tape wobble, chorus haze, and a &quot;Drift&quot; macro
              that detunes everything just enough to hurt — in the good way. 300+ presets from
              gated snares to laser toms.
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-cyan-300 transition-colors group-hover:text-cyan-200">
              Hear the saw wave →
            </p>
          </article>

          {/* sequencer */}
          <article
            id="sequencer"
            className="group rounded-xl border border-purple-500/20 bg-[#120726]/60 p-8 transition-all hover:border-purple-400/60 hover:shadow-[0_0_40px_rgba(168,85,247,0.25)]"
          >
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-purple-500/15 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-shadow group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="4" width="4" height="4" rx="1" /><rect x="10" y="4" width="4" height="4" rx="1" />
                <rect x="17" y="10" width="4" height="4" rx="1" /><rect x="3" y="16" width="4" height="4" rx="1" />
                <rect x="10" y="16" width="4" height="4" rx="1" />
              </svg>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-purple-400">02 / Sequencer</p>
            <h3 className="mt-3 text-2xl font-bold text-white">The Neon Grid</h3>
            <p className="mt-4 leading-relaxed text-zinc-400">
              A 16-step polyrhythmic sequencer with per-step glide, ratchets, and probability.
              Chain patterns into full arrangements, then humanize the whole grid with one
              &quot;Loose Tape&quot; dial.
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-cyan-300 transition-colors group-hover:text-cyan-200">
              Program a bassline →
            </p>
          </article>

          {/* cloud collab */}
          <article
            id="collab"
            className="group rounded-xl border border-cyan-400/20 bg-[#120726]/60 p-8 transition-all hover:border-cyan-300/60 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]"
          >
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-cyan-400/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-shadow group-hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 18a4.5 4.5 0 1 1 .9-8.9 6 6 0 0 1 11.6 1.6A3.5 3.5 0 0 1 18 18H7z" />
                <path d="M9.5 14.5 12 12l2.5 2.5M12 12v6" />
              </svg>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">03 / Cloud Collab</p>
            <h3 className="mt-3 text-2xl font-bold text-white">Sessions that never sleep</h3>
            <p className="mt-4 leading-relaxed text-zinc-400">
              Invite up to eight producers into one live session. Cursors glow per collaborator,
              every knob twist syncs in under 40ms, and version history rewinds like a cassette —
              all the way back to take one.
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-cyan-300 transition-colors group-hover:text-cyan-200">
              Start a session →
            </p>
          </article>
        </div>
      </section>

      {/* ===== interface mockup ===== */}
      <section id="mockup" className="relative z-10 border-y border-fuchsia-500/15 bg-[#0d0220]/60 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-fuchsia-400">{"// Inside the Studio"}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              A console that{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">glows back.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-zinc-400">
              The full NEONDRIFT rig: sequencer grid, channel rack, and live collaborators — all in one tab.
            </p>
          </div>

          <div className="relative mt-14">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-fuchsia-600/20 via-purple-600/15 to-cyan-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-[#0c0420] shadow-[0_0_80px_rgba(168,85,247,0.3)]">
              {/* window chrome */}
              <div className="flex items-center justify-between border-b border-white/5 bg-[#120726] px-4 py-3">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-fuchsia-500" />
                  <span className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="h-3 w-3 rounded-full bg-cyan-400" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                  midnight_chase_final_FINAL_v3.drift
                </span>
                <div className="flex -space-x-2">
                  {["bg-fuchsia-500", "bg-cyan-400", "bg-purple-500"].map((c, i) => (
                    <span key={i} className={`grid h-6 w-6 place-items-center rounded-full ${c} border-2 border-[#120726] font-mono text-[9px] font-bold text-[#0a0118]`}>
                      {["VX", "KZ", "M8"][i]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-px bg-white/5 md:grid-cols-[200px_1fr]">
                {/* channel rack */}
                <div className="hidden flex-col gap-px bg-[#0c0420] md:flex">
                  {["KICK-88", "GATED SNR", "LAZER TOM", "BASS: NIGHTCRWL", "PAD: OZONE", "LEAD: CHROME"].map((ch, i) => (
                    <div key={ch} className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-fuchsia-500/10">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">{ch}</span>
                      <span className={`h-2 w-2 rounded-full ${i % 2 === 0 ? "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)]" : "bg-fuchsia-500 shadow-[0_0_6px_rgba(217,70,239,0.9)]"}`} />
                    </div>
                  ))}
                </div>

                {/* step grid */}
                <div className="bg-[#0c0420] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300">PTN-04 // Midnight Chase</span>
                    <span className="font-mono text-[10px] text-fuchsia-300">118 BPM · Am</span>
                  </div>
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((row) => (
                      <div key={row} className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
                        {STEPS.map((on, i) => {
                          const active = (i + row * 3) % (row + 2) === 0 ? !on : on;
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded-sm transition-all hover:scale-110 ${
                                active
                                  ? row % 2 === 0
                                    ? "bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]"
                                    : "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                                  : "bg-zinc-800/80 hover:bg-zinc-700"
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {/* transport */}
                  <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                    <button className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-[0_0_18px_rgba(217,70,239,0.6)] transition-transform hover:scale-110">
                      <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <div className="lp2-glow h-full w-2/3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" />
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">02:41 / 04:04</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== testimonials ===== */}
      <section id="artists" className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-400">{"// Transmission Log"}</p>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Artists already{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">on the grid.</span>
        </h2>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            {
              quote:
                "I sketched the title theme for a whole indie racing game on a train with spotty wifi. NEONDRIFT cached every take. It’s sorcery.",
              name: "Vexa Nyght",
              role: "Composer · Chrome Skyline OST",
              initials: "VN",
              ring: "border-fuchsia-500/60",
              chip: "bg-fuchsia-500",
            },
            {
              quote:
                "The Drift macro is the first software detune that actually sounds like my dying Juno. I haven’t opened my desktop DAW in three months.",
              name: "Kaz Parallax",
              role: "Producer · 2.1M monthly listeners",
              initials: "KP",
              ring: "border-cyan-400/60",
              chip: "bg-cyan-400",
            },
            {
              quote:
                "My duo lives nine time zones apart. We track live in one session and it never once glitched — “cloud collab” finally means something.",
              name: "Mirage Eighty-Four",
              role: "Synthwave duo · Berlin / Osaka",
              initials: "M8",
              ring: "border-purple-500/60",
              chip: "bg-purple-500",
            },
          ].map((t) => (
            <figure
              key={t.name}
              className={`flex flex-col justify-between rounded-xl border ${t.ring} bg-[#120726]/60 p-8 transition-all hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(168,85,247,0.25)]`}
            >
              <blockquote className="text-base leading-relaxed text-zinc-300">
                <span className="mr-1 font-mono text-2xl text-fuchsia-400">&ldquo;</span>
                {t.quote}
                <span className="ml-1 font-mono text-2xl text-fuchsia-400">&rdquo;</span>
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <span className={`grid h-11 w-11 place-items-center rounded-full ${t.chip} font-mono text-xs font-bold text-[#0a0118] shadow-[0_0_15px_rgba(217,70,239,0.4)]`}>
                  {t.initials}
                </span>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ===== pricing / early access ===== */}
      <section id="pricing" className="relative z-10 border-t border-fuchsia-500/15 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-fuchsia-400">{"// Boarding Pass"}</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Get on the{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
              night highway.
            </span>
          </h2>

          <div className="mt-14 grid gap-6 text-left md:grid-cols-2">
            {/* free tier */}
            <div className="rounded-xl border border-zinc-700/60 bg-[#120726]/50 p-8 transition-all hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300">Cruiser</p>
              <p className="mt-4 text-5xl font-black text-white">
                $0<span className="text-base font-normal text-zinc-500"> / forever</span>
              </p>
              <ul className="mt-7 space-y-3 text-sm text-zinc-400">
                {["2 synth voices + drum machine", "8-step sequencer", "3 cloud projects", "Export to MP3 (with a tasteful tape hiss)"].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 text-cyan-400">▸</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-9 block rounded-md border border-cyan-400/50 py-3.5 text-center font-mono text-xs font-bold uppercase tracking-widest text-cyan-300 transition-all hover:bg-cyan-400/10"
              >
                Start Cruising
              </a>
            </div>

            {/* pro tier */}
            <div className="relative rounded-xl border border-fuchsia-500/60 bg-[#180935]/80 p-8 shadow-[0_0_45px_rgba(217,70,239,0.3)] transition-all hover:shadow-[0_0_70px_rgba(217,70,239,0.5)]">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0a0118]">
                Early Access — 40% Off
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fuchsia-300">Interceptor</p>
              <p className="mt-4 text-5xl font-black text-white">
                $9<span className="text-base font-normal text-zinc-500"> / month</span>
                <span className="ml-3 align-middle text-lg font-normal text-zinc-600 line-through">$15</span>
              </p>
              <ul className="mt-7 space-y-3 text-sm text-zinc-300">
                {[
                  "All 6 voices + full FX rack",
                  "16-step Neon Grid with ratchets",
                  "Unlimited projects & 8-seat live collab",
                  "Lossless WAV / stems export",
                  "Founding member badge that glows",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 text-fuchsia-400">▸</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-9 block rounded-md bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 text-center font-mono text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all hover:shadow-[0_0_45px_rgba(217,70,239,0.8)] hover:brightness-110"
              >
                Claim Early Access
              </a>
            </div>
          </div>

          <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-zinc-600">
            Early access pricing locked for life · Cancel anytime · *Performance on actual 1986 hardware not guaranteed
          </p>
        </div>
      </section>

      {/* ===== footer ===== */}
      <footer className="relative z-10 border-t border-fuchsia-500/15 bg-[#080112]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-lg font-bold tracking-[0.25em] text-white">
                NEON<span className="text-fuchsia-400">DRIFT</span>
              </p>
              <p className="mt-2 max-w-xs text-sm text-zinc-500">
                The browser-based synthwave studio. Built for the night shift, mixed for the sunrise.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              {["Engine", "Sequencer", "Collab", "Pricing", "Changelog", "Status"].map((l) => (
                <a key={l} href="#" className="transition-colors hover:text-cyan-300">
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 font-mono text-[10px] uppercase tracking-widest text-zinc-600 sm:flex-row sm:items-center">
            <p>© 2026 Neondrift Audio Labs · All synths reserved</p>
            <p className="text-fuchsia-500/70">Stay rad. Stay rendering.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
