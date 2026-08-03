import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "FORGE Athletics — No Shortcuts. Only Work.",
  description:
    "High-intensity strength, conditioning, and combat training. Earn every rep at FORGE Athletics.",
};

const programs = [
  {
    name: "STRENGTH",
    tag: "01",
    desc: "Barbell-first programming. Squat, press, pull. Progressive overload with zero fluff. Get under the bar and stay there.",
    points: ["5 sessions / week", "Coached lifting blocks", "Force-plate testing"],
  },
  {
    name: "CONDITIONING",
    tag: "02",
    desc: "Engine work that hurts on purpose. Sleds, ergs, hills, intervals. Build a gas tank that refuses to quit.",
    points: ["HR-zone programming", "Sled & erg circuits", "Monthly benchmark tests"],
  },
  {
    name: "COMBAT",
    tag: "03",
    desc: "Boxing and kickboxing fundamentals fused with fight-camp conditioning. Hit hard. Move harder. Recover fastest.",
    points: ["Pad & bag rounds", "Footwork drills", "Sparring-ready prep"],
  },
];

const stats = [
  { value: "2,400+", label: "Athletes Forged" },
  { value: "14", label: "Years of Iron" },
  { value: "98%", label: "Stick With It" },
  { value: "06", label: "National Titles" },
];

const coaches = [
  { initials: "DK", name: "Dana Kruger", role: "Head of Strength", record: "3x Powerlifting National Champ" },
  { initials: "MV", name: "Marco Vance", role: "Combat Director", record: "22-3 Pro Kickboxing" },
  { initials: "RA", name: "Rae Achebe", role: "Conditioning Lead", record: "Sub-2:40 Marathoner" },
  { initials: "JT", name: "Jonas Thorn", role: "Athlete Development", record: "D1 S&C, 9 Seasons" },
];

const tiers = [
  {
    name: "IRON",
    price: "79",
    blurb: "For the self-starter.",
    features: ["Open gym access", "1 program track", "Locker room", "Community events"],
    highlighted: false,
  },
  {
    name: "FORGED",
    price: "149",
    blurb: "The full fire. Most chosen.",
    features: [
      "All 3 program tracks",
      "Unlimited coached classes",
      "Quarterly testing & plan",
      "Recovery lounge access",
      "Nutrition blueprint",
    ],
    highlighted: true,
  },
  {
    name: "RELENTLESS",
    price: "299",
    blurb: "For competitors only.",
    features: [
      "Everything in FORGED",
      "2x weekly 1-on-1 coaching",
      "Fight-camp / meet prep",
      "24/7 keycard access",
    ],
    highlighted: false,
  },
];

function Slash({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block h-[1em] w-2 -skew-x-12 bg-[#e11] align-middle ${className}`} />;
}

export default function ForgeAthleticsPage() {
  return (
    <div
      className={`${anton.variable} ${archivo.variable} min-h-screen bg-[#0a0a0b] text-zinc-100 [font-family:var(--font-archivo)] selection:bg-[#e11] selection:text-black`}
    >
      {/* ===== NAV ===== */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0a0a0b]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-3">
            <span className="grid h-9 w-9 -skew-x-12 place-items-center bg-[#e11] [font-family:var(--font-anton)] text-xl text-black">
              <span className="skew-x-12">F</span>
            </span>
            <span className="[font-family:var(--font-anton)] text-xl uppercase tracking-widest">
              Forge<span className="text-[#e11]">/</span>Athletics
            </span>
          </a>
          <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 md:flex">
            <a href="#programs" className="transition hover:text-[#e11]">Programs</a>
            <a href="#results" className="transition hover:text-[#e11]">Results</a>
            <a href="#coaches" className="transition hover:text-[#e11]">Coaches</a>
            <a href="#pricing" className="transition hover:text-[#e11]">Pricing</a>
          </div>
          <a
            href="#pricing"
            className="-skew-x-12 bg-[#e11] px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-black transition hover:bg-white"
          >
            <span className="inline-block skew-x-12">Start Now</span>
          </a>
        </nav>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        {/* diagonal red slash backdrop */}
        <div
          aria-hidden
          className="absolute inset-y-0 right-[-10%] w-[45%] bg-[#e11]/10 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-[-10%] w-[10%] bg-[#e11] [clip-path:polygon(60%_0,100%_0,40%_100%,0_100%)]"
        />
        {/* giant outline ghost word */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 left-0 select-none [font-family:var(--font-anton)] text-[22vw] uppercase leading-none text-transparent opacity-30 [-webkit-text-stroke:1px_#3f3f46]"
        >
          Forge
        </span>

        <div className="relative mx-auto max-w-7xl px-6 pb-32 pt-20 md:pt-28">
          <p className="mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.35em] text-[#e11]">
            <Slash className="h-4" /> Est. 2012 — Iron District
          </p>
          <h1 className="[font-family:var(--font-anton)] text-[18vw] uppercase leading-[0.85] md:text-[9rem] lg:text-[11rem]">
            <span className="block">No Shortcuts.</span>
            <span className="block text-transparent [-webkit-text-stroke:2px_#e11]">Only Work.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg font-medium text-zinc-400">
            Strength. Conditioning. Combat. Three tracks, one standard:
            <span className="text-zinc-100"> show up and earn it.</span> Nobody is coming to do the reps for you.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#programs"
              className="-skew-x-12 bg-[#e11] px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:bg-white"
            >
              <span className="inline-block skew-x-12">Claim Free Week</span>
            </a>
            <a
              href="#results"
              className="-skew-x-12 border-2 border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] transition hover:border-[#e11] hover:text-[#e11]"
            >
              <span className="inline-block skew-x-12">See The Proof</span>
            </a>
          </div>
        </div>

        {/* marquee strip */}
        <div className="relative -skew-y-1 border-y-2 border-[#e11] bg-black py-3">
          <p className="truncate whitespace-nowrap text-center [font-family:var(--font-anton)] text-sm uppercase tracking-[0.4em] text-zinc-500">
            Sweat is currency <span className="text-[#e11]">//</span> Pain is data <span className="text-[#e11]">//</span> Discipline is freedom <span className="text-[#e11]">//</span> Sweat is currency <span className="text-[#e11]">//</span> Pain is data
          </p>
        </div>
      </section>

      {/* ===== PROGRAMS ===== */}
      <section id="programs" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-[#e11]">Pick Your Pain</p>
            <h2 className="[font-family:var(--font-anton)] text-5xl uppercase leading-none md:text-7xl">
              The Programs
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm text-zinc-500 md:block">
            Every track is coached, tested, and progressive. No random workouts. Ever.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {programs.map((p) => (
            <article
              key={p.name}
              className="group relative overflow-hidden border border-zinc-800 bg-zinc-950 p-8 transition hover:border-[#e11]"
            >
              {/* red accent bar */}
              <div className="absolute left-0 top-0 h-full w-1.5 bg-[#e11] transition-all group-hover:w-2.5" />
              <span className="[font-family:var(--font-anton)] text-6xl text-zinc-800 transition group-hover:text-[#e11]/40">
                {p.tag}
              </span>
              <h3 className="mt-4 [font-family:var(--font-anton)] text-3xl uppercase tracking-wide">
                {p.name}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">{p.desc}</p>
              <ul className="mt-6 space-y-2 text-xs font-bold uppercase tracking-widest text-zinc-300">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2">
                    <svg viewBox="0 0 12 12" className="h-3 w-3 fill-[#e11]" aria-hidden>
                      <path d="M7 0h5L5 12H0L7 0z" />
                    </svg>
                    {pt}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ===== RESULTS / STATS ===== */}
      <section id="results" className="relative -skew-y-1 border-y border-zinc-800 bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl skew-y-1 px-6">
          <div className="grid gap-10 text-center md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="[font-family:var(--font-anton)] text-6xl text-[#e11] md:text-7xl">{s.value}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COACHES ===== */}
      <section id="coaches" className="mx-auto max-w-7xl px-6 py-24">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-[#e11]">No Ego. All Standard.</p>
        <h2 className="[font-family:var(--font-anton)] text-5xl uppercase leading-none md:text-7xl">
          The Coaches
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {coaches.map((c) => (
            <div key={c.initials} className="group border border-zinc-800 bg-zinc-950 p-8 text-center transition hover:border-[#e11]">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-2 border-[#e11] bg-black [font-family:var(--font-anton)] text-3xl text-zinc-100 transition group-hover:bg-[#e11] group-hover:text-black">
                {c.initials}
              </div>
              <h3 className="mt-6 [font-family:var(--font-anton)] text-xl uppercase tracking-wide">{c.name}</h3>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.25em] text-[#e11]">{c.role}</p>
              <p className="mt-3 text-sm text-zinc-500">{c.record}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== QUOTE BAND ===== */}
      <section className="relative overflow-hidden bg-[#e11] py-24 text-black">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 select-none whitespace-nowrap [font-family:var(--font-anton)] text-[16vw] uppercase leading-none text-transparent opacity-25 [-webkit-text-stroke:1.5px_#000]"
        >
          Relentless
        </span>
        <blockquote className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="[font-family:var(--font-anton)] text-4xl uppercase leading-tight md:text-6xl">
            &ldquo;The bar doesn&rsquo;t care how you feel. Lift it anyway.&rdquo;
          </p>
          <footer className="mt-6 text-xs font-black uppercase tracking-[0.4em]">
            — Dana Kruger, Head of Strength
          </footer>
        </blockquote>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-[#e11]">Invest In Violence Of Effort</p>
          <h2 className="[font-family:var(--font-anton)] text-5xl uppercase leading-none md:text-7xl">
            Membership
          </h2>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col border p-8 ${
                t.highlighted
                  ? "border-[#e11] bg-zinc-950 shadow-[0_0_60px_-15px_#e11]"
                  : "border-zinc-800 bg-zinc-950/60"
              }`}
            >
              {t.highlighted && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 -skew-x-12 bg-[#e11] px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-black">
                  <span className="inline-block skew-x-12">Most Forged</span>
                </span>
              )}
              <h3 className="[font-family:var(--font-anton)] text-2xl uppercase tracking-widest">
                {t.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.blurb}</p>
              <p className="mt-6 flex items-end gap-1">
                <span className="[font-family:var(--font-anton)] text-6xl text-zinc-100">${t.price}</span>
                <span className="pb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">/ month</span>
              </p>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-zinc-300">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 fill-[#e11]" aria-hidden>
                      <path d="M7 0h5L5 12H0L7 0z" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`mt-10 -skew-x-12 px-6 py-3.5 text-center text-xs font-black uppercase tracking-[0.25em] transition ${
                  t.highlighted
                    ? "bg-[#e11] text-black hover:bg-white"
                    : "border-2 border-zinc-700 text-zinc-200 hover:border-[#e11] hover:text-[#e11]"
                }`}
              >
                <span className="inline-block skew-x-12">Lock It In</span>
              </a>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs uppercase tracking-[0.25em] text-zinc-600">
          No contracts. No excuses. Cancel anytime — but you won&rsquo;t.
        </p>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-zinc-800 bg-black">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <p className="[font-family:var(--font-anton)] text-2xl uppercase tracking-widest">
                Forge<span className="text-[#e11]">/</span>Athletics
              </p>
              <p className="mt-4 max-w-xs text-sm text-zinc-500">
                412 Anvil Street, Iron District. Doors open 5AM — the iron never sleeps and neither do we.
              </p>
            </div>
            <div className="text-sm">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#e11]">Train</p>
              <ul className="space-y-2 text-zinc-400">
                <li><a href="#programs" className="transition hover:text-[#e11]">Strength</a></li>
                <li><a href="#programs" className="transition hover:text-[#e11]">Conditioning</a></li>
                <li><a href="#programs" className="transition hover:text-[#e11]">Combat</a></li>
                <li><a href="#pricing" className="transition hover:text-[#e11]">Membership</a></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#e11]">Hours</p>
              <ul className="space-y-2 text-zinc-400">
                <li>Mon — Fri: 5AM – 11PM</li>
                <li>Sat: 6AM – 9PM</li>
                <li>Sun: 7AM – 6PM</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-900 pt-8 text-xs uppercase tracking-[0.25em] text-zinc-600 md:flex-row">
            <p>© 2026 Forge Athletics. All rights earned.</p>
            <p className="[font-family:var(--font-anton)]">
              No Shortcuts <span className="text-[#e11]">/</span> Only Work
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
