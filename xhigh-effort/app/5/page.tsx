import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PixelPunch Arcade — SLIME RIOT | Wishlist the Co-op Brawler Now",
  description:
    "SLIME RIOT is the 4-player couch co-op brawler from scrappy indie studio PixelPunch Arcade. Punch goo, ride slimes, topple King Glob. Wishlist now — out Fall 2026.",
};

/* ---------------------------------- data ---------------------------------- */

const MARQUEE_ITEMS = [
  "👾 SLIME RIOT",
  "WISHLIST NOW",
  "4-PLAYER CO-OP",
  "💥 OUT FALL 2026",
  "🕹️ PIXELPUNCH ARCADE",
  "100% GOO. 0% MERCY.",
];

const FEATURES = [
  {
    emoji: "🥊",
    title: "Punch the goo",
    body: "37 slime types, each with its own splat physics. Uppercut a Jelly Junior into a ceiling fan. Science!",
    bg: "bg-red-500",
    text: "text-white",
    rotate: "-rotate-2",
  },
  {
    emoji: "🛋️",
    title: "4-player couch chaos",
    body: "Drop-in co-op for you and three frenemies. Friendly fire is ON by default. We’re not sorry.",
    bg: "bg-blue-600",
    text: "text-white",
    rotate: "rotate-1",
  },
  {
    emoji: "🐸",
    title: "Ride your enemies",
    body: "Mount any boss-size slime and steer it through walls. Property damage adds to your combo meter.",
    bg: "bg-green-500",
    text: "text-black",
    rotate: "rotate-2",
  },
  {
    emoji: "🎚️",
    title: "Chiptune fight club",
    body: "A 42-track FM-synth soundtrack by DJ Sawtooth that speeds up as your combo climbs. Earplugs sold separately.",
    bg: "bg-pink-400",
    text: "text-black",
    rotate: "-rotate-1",
  },
];

const QUOTES = [
  {
    stars: "★★★★★",
    quote: "The most fun I’ve had punching dessert since 1994.",
    source: "Pixel Gazette",
    rotate: "-rotate-2",
  },
  {
    stars: "★★★★★",
    quote: "Slime Riot turned my living room into a war crime tribunal. 10/10.",
    source: "Couch Critic Weekly",
    rotate: "rotate-1",
  },
  {
    stars: "★★★★☆",
    quote: "Docked one star because my brother is still riding King Glob and won’t come to dinner.",
    source: "Retro Wreckage",
    rotate: "rotate-2",
  },
];

const STATS = [
  { num: "14,802", label: "wishlists & counting" },
  { num: "37", label: "punchable slime types" },
  { num: "4", label: "players, one couch" },
  { num: "9,941", label: "beta KOs logged" },
];

const ROADMAP = [
  {
    tag: "JUN 2026",
    title: "Closed beta: Goo Camp",
    body: "500 testers. One sewer. Sign up below before the slots dissolve.",
    done: true,
  },
  {
    tag: "OCT 2026",
    title: "Steam Next Fest demo",
    body: "Free 2-level slice featuring the Neon Sewers and a very angry pudding.",
    done: false,
  },
  {
    tag: "FALL 2026",
    title: "Full launch",
    body: "PC first, consoles right behind. 12 zones, 8 bosses, infinite goo.",
    done: false,
  },
  {
    tag: "2027",
    title: "Free DLC: Goo Harder",
    body: "New Frostbite Foundry zone + ranked riot mode. Because you asked. Loudly.",
    done: false,
  },
];

const SLIME_SPRITE = [
  "....####....",
  "...#gggg#...",
  "..#gggggg#..",
  ".#gwwggwwg#.",
  ".#gwbggwbg#.",
  "#gggggggggg#",
  "#ggg#gg#ggg#",
  "#gggg##gggg#",
  ".#gggggggg#.",
  "..########..",
];

/* ------------------------------- components ------------------------------- */

function PixelSlime({
  className = "",
  body = "#22c55e",
}: {
  className?: string;
  body?: string;
}) {
  const fills: Record<string, string> = {
    "#": "#000000",
    g: body,
    w: "#ffffff",
    b: "#000000",
  };
  return (
    <svg
      viewBox="0 0 12 10"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {SLIME_SPRITE.flatMap((row, y) =>
        row.split("").map((ch, x) =>
          ch === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fills[ch]}
            />
          )
        )
      )}
    </svg>
  );
}

function MarqueeRow() {
  return (
    <div className="flex w-max items-center gap-8 pr-8">
      {MARQUEE_ITEMS.map((item) => (
        <span
          key={item}
          className="flex items-center gap-8 whitespace-nowrap font-mono text-lg font-black uppercase tracking-widest md:text-xl"
        >
          {item}
          <span aria-hidden="true">✦</span>
        </span>
      ))}
    </div>
  );
}

const BTN =
  "inline-block border-4 border-black font-black uppercase tracking-wide transition-all duration-150 shadow-[6px_6px_0_0_#000] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

/* ---------------------------------- page ---------------------------------- */

export default function SlimeRiotLanding() {
  return (
    <div className="min-h-screen bg-[#ffde2e] font-sans text-black">
      <style>{`
        @keyframes lp5-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .lp5-marquee { animation: lp5-scroll 22s linear infinite; }
        .lp5-marquee-rev { animation: lp5-scroll 28s linear infinite reverse; }
        @keyframes lp5-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        .lp5-bob { animation: lp5-bob 1.6s steps(4, end) infinite; }
        @keyframes lp5-blink {
          0%, 88% { opacity: 1; }
          89%, 94% { opacity: 0; }
          95%, 100% { opacity: 1; }
        }
        .lp5-blink { animation: lp5-blink 2.4s steps(1, end) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lp5-marquee, .lp5-marquee-rev, .lp5-bob, .lp5-blink { animation: none; }
        }
      `}</style>

      {/* ------------------------------- nav ------------------------------- */}
      <header className="sticky top-3 z-50 px-3 sm:px-6">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 border-4 border-black bg-white px-3 py-2 shadow-[6px_6px_0_0_#000] sm:px-5">
          <a href="#top" className="flex items-center gap-2">
            <span className="-rotate-3 border-4 border-black bg-pink-400 px-2 py-1 text-sm font-black uppercase shadow-[3px_3px_0_0_#000] sm:text-base">
              PixelPunch
            </span>
            <span className="rotate-2 border-4 border-black bg-blue-600 px-2 py-1 text-sm font-black uppercase text-white shadow-[3px_3px_0_0_#000] sm:text-base">
              Arcade 👾
            </span>
          </a>
          <div className="hidden items-center gap-2 md:flex">
            {[
              ["Features", "#features"],
              ["Screens", "#screens"],
              ["Press", "#press"],
              ["Roadmap", "#roadmap"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="border-2 border-black bg-yellow-300 px-3 py-1 font-mono text-xs font-bold uppercase shadow-[3px_3px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
              >
                {label}
              </a>
            ))}
          </div>
          <a
            href="#signup"
            className={`${BTN} bg-red-500 px-3 py-1.5 text-xs text-white sm:px-4 sm:text-sm`}
          >
            Wishlist 💥
          </a>
        </nav>
      </header>

      {/* ------------------------------- hero ------------------------------- */}
      <section id="top" className="px-4 pb-16 pt-12 sm:px-6 md:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[3fr_2fr]">
          <div>
            <p className="inline-block -rotate-2 border-4 border-black bg-black px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-yellow-300 shadow-[4px_4px_0_0_#ef4444] sm:text-sm">
              ⚠ New from PixelPunch Arcade ⚠
            </p>
            <h1 className="mt-5 text-6xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
              <span className="block [text-shadow:5px_5px_0_#ef4444]">
                Slime
              </span>
              <span className="block text-blue-600 [text-shadow:5px_5px_0_#000]">
                Riot
              </span>
            </h1>
            <p className="mt-6 max-w-xl border-l-8 border-black pl-4 text-lg font-bold leading-snug sm:text-xl">
              A 4-player co-op brawler where the enemies are made of goo and so
              are your problems. Punch, splat, and ride your way through 12
              dripping zones before King Glob absorbs the city. 🕹️
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#signup"
                className={`${BTN} bg-green-500 px-7 py-4 text-lg sm:text-xl`}
              >
                ▶ Wishlist now
              </a>
              <a
                href="#screens"
                className={`${BTN} bg-white px-7 py-4 text-lg sm:text-xl`}
              >
                Watch goo
              </a>
            </div>
            <p className="mt-5 font-mono text-sm font-bold uppercase">
              Out Fall 2026 · PC + consoles · Rated G for Goo
            </p>
          </div>

          {/* hero sprite card */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rotate-3 border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000] sm:p-8">
              <div className="border-4 border-black bg-blue-600 p-6">
                <PixelSlime className="lp5-bob mx-auto w-40 sm:w-52" />
              </div>
              <p className="mt-4 text-center font-mono text-sm font-bold uppercase tracking-widest">
                Glorb · Slime #001
              </p>
            </div>
            <span className="absolute -left-4 -top-5 -rotate-6 border-4 border-black bg-red-500 px-3 py-1 font-black uppercase text-white shadow-[4px_4px_0_0_#000]">
              He bites!
            </span>
            <span className="lp5-blink absolute -bottom-4 -right-3 rotate-6 border-4 border-black bg-pink-400 px-3 py-1 font-mono text-sm font-black uppercase shadow-[4px_4px_0_0_#000]">
              Insert coin
            </span>
          </div>
        </div>
      </section>

      {/* ----------------------------- marquee ----------------------------- */}
      <div className="-rotate-1 overflow-hidden border-y-4 border-black bg-black py-3 text-yellow-300">
        <div className="lp5-marquee flex w-max">
          <MarqueeRow />
          <div aria-hidden="true">
            <MarqueeRow />
          </div>
        </div>
      </div>

      {/* ----------------------------- features ----------------------------- */}
      <section id="features" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="inline-block -rotate-1 border-4 border-black bg-white px-5 py-2 text-3xl font-black uppercase shadow-[8px_8px_0_0_#000] sm:text-4xl md:text-5xl">
            Why riot? 💥
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`${f.bg} ${f.text} ${f.rotate} border-4 border-black p-6 shadow-[8px_8px_0_0_#000] transition-transform duration-150 hover:rotate-0 hover:scale-[1.03]`}
              >
                <span className="inline-block border-4 border-black bg-white px-3 py-2 text-3xl shadow-[4px_4px_0_0_#000]">
                  {f.emoji}
                </span>
                <h3 className="mt-4 text-xl font-black uppercase leading-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm font-bold leading-snug">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- screenshots ---------------------------- */}
      <section
        id="screens"
        className="border-y-4 border-black bg-blue-600 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="inline-block rotate-1 border-4 border-black bg-yellow-300 px-5 py-2 text-3xl font-black uppercase shadow-[8px_8px_0_0_#000] sm:text-4xl md:text-5xl">
            Hot goo footage 📺
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {/* screen 1: Goo Grotto */}
            <figure className="-rotate-2">
              <div className="relative aspect-video overflow-hidden border-4 border-black bg-sky-300 shadow-[8px_8px_0_0_#000]">
                <div className="absolute right-4 top-3 h-7 w-7 border-2 border-black bg-yellow-300" />
                <div className="absolute left-10 top-5 h-3 w-12 border-2 border-black bg-white" />
                <div className="absolute bottom-0 left-0 right-0 h-1/4 border-t-4 border-black bg-green-600" />
                <div className="absolute bottom-1/3 left-6 h-3 w-20 border-2 border-black bg-amber-700" />
                <PixelSlime className="absolute bottom-1/4 left-1/2 w-12 -translate-x-1/2" />
                <PixelSlime
                  className="absolute bottom-1/4 right-6 w-8"
                  body="#f472b6"
                />
                <div className="absolute left-2 top-2 flex gap-1">
                  <span className="h-3 w-3 border border-black bg-red-500" />
                  <span className="h-3 w-3 border border-black bg-red-500" />
                  <span className="h-3 w-3 border border-black bg-red-500" />
                </div>
                <span className="absolute right-2 top-2 font-mono text-[10px] font-bold">
                  SCORE 048230
                </span>
              </div>
              <figcaption className="mt-3 inline-block border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold uppercase shadow-[3px_3px_0_0_#000]">
                Zone 01 · Goo Grotto
              </figcaption>
            </figure>

            {/* screen 2: King Glob boss */}
            <figure className="rotate-1 md:translate-y-4">
              <div className="relative aspect-video overflow-hidden border-4 border-black bg-purple-400 shadow-[8px_8px_0_0_#000]">
                <div className="absolute left-2 right-2 top-2 h-3 border-2 border-black bg-white">
                  <div className="h-full w-2/3 bg-red-500" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/5 border-t-4 border-black bg-stone-700" />
                <PixelSlime
                  className="lp5-bob absolute bottom-1/5 left-1/2 w-24 -translate-x-1/2"
                  body="#f472b6"
                />
                <div className="absolute left-1/2 top-[18%] -translate-x-1/2 font-mono text-[10px] font-black uppercase">
                  ♛ KING GLOB ♛
                </div>
                <PixelSlime className="absolute bottom-1/5 left-3 w-8" />
                <span className="absolute bottom-2 right-2 -rotate-6 border-2 border-black bg-yellow-300 px-1 font-mono text-[10px] font-black">
                  POW!
                </span>
              </div>
              <figcaption className="mt-3 inline-block border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold uppercase shadow-[3px_3px_0_0_#000]">
                Boss 08 · King Glob
              </figcaption>
            </figure>

            {/* screen 3: Neon Sewers */}
            <figure className="-rotate-1">
              <div className="relative aspect-video overflow-hidden border-4 border-black bg-slate-900 shadow-[8px_8px_0_0_#000]">
                <div className="absolute left-0 right-0 top-1/4 h-3 border-y-2 border-black bg-green-500" />
                <div className="absolute bottom-0 left-0 right-0 h-1/4 border-t-4 border-black bg-teal-500" />
                <div className="absolute left-6 top-1/4 h-1/2 w-3 border-2 border-black bg-green-500" />
                <PixelSlime
                  className="absolute bottom-1/4 left-1/3 w-10"
                  body="#3b82f6"
                />
                <PixelSlime
                  className="absolute bottom-1/4 right-8 w-10"
                  body="#3b82f6"
                />
                <span className="absolute right-2 top-2 rotate-3 border-2 border-black bg-pink-400 px-1 font-mono text-[10px] font-black">
                  COMBO x12
                </span>
                <span className="absolute bottom-2 left-2 font-mono text-[10px] font-bold text-green-400">
                  P3 JOINED THE RIOT
                </span>
              </div>
              <figcaption className="mt-3 inline-block border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold uppercase shadow-[3px_3px_0_0_#000]">
                Zone 07 · Neon Sewers
              </figcaption>
            </figure>
          </div>
          <p className="mt-10 border-4 border-black bg-white p-3 text-center font-mono text-xs font-bold uppercase tracking-widest shadow-[6px_6px_0_0_#000] sm:text-sm">
            * Actual in-game pixels. We counted every single one. Twice.
          </p>
        </div>
      </section>

      {/* ------------------------------ press ------------------------------ */}
      <section id="press" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="inline-block -rotate-1 border-4 border-black bg-white px-5 py-2 text-3xl font-black uppercase shadow-[8px_8px_0_0_#000] sm:text-4xl md:text-5xl">
            The press is rioting 📰
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {QUOTES.map((q) => (
              <blockquote
                key={q.source}
                className={`${q.rotate} border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000] transition-transform duration-150 hover:rotate-0`}
              >
                <p className="text-2xl tracking-widest text-red-500">
                  {q.stars}
                </p>
                <p className="mt-3 text-lg font-bold leading-snug">
                  {`“${q.quote}”`}
                </p>
                <footer className="mt-4 font-mono text-sm font-bold uppercase">
                  — {q.source}
                </footer>
              </blockquote>
            ))}
          </div>

          {/* stats strip */}
          <div className="mt-16 grid gap-6 border-4 border-black bg-black p-6 shadow-[8px_8px_0_0_#ef4444] sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="border-4 border-yellow-300 p-4 text-center"
              >
                <p className="font-mono text-3xl font-black text-yellow-300 sm:text-4xl">
                  {s.num}
                </p>
                <p className="mt-1 font-mono text-xs font-bold uppercase tracking-widest text-white">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- roadmap ----------------------------- */}
      <section
        id="roadmap"
        className="border-y-4 border-black bg-pink-400 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="inline-block rotate-1 border-4 border-black bg-white px-5 py-2 text-3xl font-black uppercase shadow-[8px_8px_0_0_#000] sm:text-4xl md:text-5xl">
            Riot roadmap 🗺️
          </h2>
          <ol className="mt-12 space-y-8">
            {ROADMAP.map((step, i) => (
              <li
                key={step.tag}
                className={`flex flex-col gap-4 border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000] sm:flex-row sm:items-start ${
                  i % 2 === 0 ? "-rotate-1" : "rotate-1"
                }`}
              >
                <span
                  className={`inline-block shrink-0 border-4 border-black px-3 py-1 font-mono text-sm font-black uppercase shadow-[4px_4px_0_0_#000] ${
                    step.done
                      ? "bg-green-500 text-black"
                      : "bg-yellow-300 text-black"
                  }`}
                >
                  {step.done ? "✔ " : "▷ "}
                  {step.tag}
                </span>
                <div>
                  <h3 className="text-xl font-black uppercase">{step.title}</h3>
                  <p className="mt-1 font-bold leading-snug">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------- second marquee ------------------------- */}
      <div className="rotate-1 overflow-hidden border-y-4 border-black bg-red-500 py-3 text-white">
        <div className="lp5-marquee-rev flex w-max">
          <MarqueeRow />
          <div aria-hidden="true">
            <MarqueeRow />
          </div>
        </div>
      </div>

      {/* ----------------------------- signup ----------------------------- */}
      <section id="signup" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl -rotate-1 border-4 border-black bg-white p-8 text-center shadow-[12px_12px_0_0_#000] sm:p-12">
          <PixelSlime className="lp5-bob mx-auto w-20" body="#f472b6" />
          <h2 className="mt-6 text-3xl font-black uppercase leading-tight sm:text-5xl">
            Join the riot list 📬
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-bold">
            Beta keys, dev-log doodles, and one (1) legally binding slime fact
            per month. No spam — only goo. Unsubscribe whenever, we&apos;ll cry
            quietly.
          </p>
          <form className="mx-auto mt-8 flex max-w-xl flex-col gap-4 sm:flex-row">
            <label htmlFor="lp5-email" className="sr-only">
              Email address
            </label>
            <input
              id="lp5-email"
              type="email"
              required
              placeholder="player1@arcade.gg"
              className="w-full border-4 border-black bg-yellow-300 px-4 py-4 font-mono font-bold placeholder:text-black/50 focus:outline-none focus:ring-4 focus:ring-blue-600"
            />
            <button
              type="submit"
              className={`${BTN} shrink-0 bg-blue-600 px-7 py-4 text-lg text-white`}
            >
              Sign me up
            </button>
          </form>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest">
            14,802 rioters already in · 0 slimes harmed*
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase text-black/60">
            *in the making of this newsletter. The game is another story.
          </p>
        </div>
      </section>

      {/* ------------------------------ footer ------------------------------ */}
      <footer className="border-t-4 border-black bg-black px-4 py-14 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <PixelSlime className="w-12" />
              <p className="text-2xl font-black uppercase text-yellow-300">
                PixelPunch Arcade
              </p>
            </div>
            <p className="mt-4 max-w-sm font-bold leading-snug text-white/80">
              Seven devs, one garage, infinite goo. Making loud little games in
              Asbury Park, NJ since 2019.
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/60">
              © 2026 PixelPunch Arcade LLC. Slime Riot™ and Glorb™ are
              extremely real trademarks.
            </p>
          </div>
          <nav aria-label="Game">
            <p className="border-b-4 border-yellow-300 pb-2 font-mono text-sm font-black uppercase tracking-widest text-yellow-300">
              Game
            </p>
            <ul className="mt-4 space-y-2 font-bold">
              {[
                ["Features", "#features"],
                ["Screens", "#screens"],
                ["Roadmap", "#roadmap"],
                ["Wishlist", "#signup"],
              ].map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="underline decoration-pink-400 decoration-4 underline-offset-4 hover:bg-pink-400 hover:text-black"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Studio">
            <p className="border-b-4 border-yellow-300 pb-2 font-mono text-sm font-black uppercase tracking-widest text-yellow-300">
              Studio
            </p>
            <ul className="mt-4 space-y-2 font-bold">
              {["Dev log", "Press kit", "Jobs (1 open)", "Contact"].map(
                (label) => (
                  <li key={label}>
                    <a
                      href="#top"
                      className="underline decoration-green-500 decoration-4 underline-offset-4 hover:bg-green-500 hover:text-black"
                    >
                      {label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </nav>
        </div>
        <p className="mx-auto mt-12 max-w-6xl border-t-4 border-white/20 pt-6 text-center font-mono text-xs font-bold uppercase tracking-[0.3em] text-white/60">
          👾 Insert coin to continue · Press start to riot 🕹️
        </p>
      </footer>
    </div>
  );
}
