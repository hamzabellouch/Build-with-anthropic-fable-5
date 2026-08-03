import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wildroot — Organic Small-Batch Skincare",
  description:
    "Wildroot crafts small-batch, botanical skincare from cold-pressed wild plants. Honest ingredients, glass packaging, and rituals rooted in nature.",
};

/* ---------- Botanical inline SVGs ---------- */

function LeafMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 28C16 28 4 22 4 12C4 6 9 3 16 3C23 3 28 6 28 12C28 22 16 28 16 28Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M16 28C16 28 4 22 4 12C4 6 9 3 16 3C23 3 28 6 28 12C28 22 16 28 16 28Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 26V8M16 14L11 10M16 19L21 14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 116C32 80 32 44 32 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M32 24C20 22 14 14 14 6C24 8 31 14 32 24Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 24C44 22 50 14 50 6C40 8 33 14 32 24Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 52C20 50 13 42 12 32C23 34 31 41 32 52Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 52C44 50 51 42 52 32C41 34 33 41 32 52Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 82C21 80 14 72 13 62C24 64 31 71 32 82Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 82C43 80 50 72 51 62C40 64 33 71 32 82Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BotanicalDivider() {
  return (
    <div
      className="flex items-center justify-center gap-4 text-[#c4673b]"
      aria-hidden="true"
    >
      <span className="h-px w-16 bg-current opacity-40 sm:w-24" />
      <svg viewBox="0 0 80 24" fill="none" className="h-5 w-16">
        <path
          d="M4 12H76"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.5"
        />
        <path
          d="M40 4C36 7 34 10 34 12C34 14 36 17 40 20C44 17 46 14 46 12C46 10 44 7 40 4Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="12" r="2" fill="currentColor" />
        <circle cx="58" cy="12" r="2" fill="currentColor" />
      </svg>
      <span className="h-px w-16 bg-current opacity-40 sm:w-24" />
    </div>
  );
}

function Stars() {
  return (
    <div className="flex gap-1 text-[#c4673b]" aria-label="5 out of 5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4 fill-current">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

/* ---------- Pure-CSS product illustrations ---------- */

function DropperBottle() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-3 w-3 rounded-t-full bg-stone-800" />
      <div className="h-6 w-7 rounded-sm bg-stone-800" />
      <div className="relative h-28 w-16 rounded-b-2xl rounded-t-md bg-gradient-to-b from-[#b08840] to-[#8a6628] shadow-inner">
        <div className="absolute left-2 top-3 h-16 w-1.5 rounded-full bg-white/25" />
        <div className="absolute inset-x-2.5 top-8 flex h-12 items-center justify-center rounded-sm bg-[#f4ecdc]">
          <span className="[font-family:Georgia,'Times_New_Roman',serif] text-[9px] italic tracking-wide text-emerald-900">
            wildroot
          </span>
        </div>
      </div>
    </div>
  );
}

function CreamJar() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-7 w-24 rounded-t-xl rounded-b-sm bg-gradient-to-b from-emerald-900 to-emerald-950" />
      <div className="relative h-20 w-28 rounded-b-3xl rounded-t-md bg-gradient-to-b from-[#f4ecdc] to-[#e7dcc4] shadow-inner">
        <div className="absolute left-3 top-2 h-12 w-1.5 rounded-full bg-white/60" />
        <div className="absolute inset-x-5 top-5 flex h-10 items-center justify-center rounded-sm border border-emerald-900/20">
          <span className="[font-family:Georgia,'Times_New_Roman',serif] text-[9px] italic tracking-wide text-emerald-900">
            wildroot
          </span>
        </div>
      </div>
    </div>
  );
}

function PumpBottle() {
  return (
    <div className="flex flex-col items-center">
      <div className="mr-7 h-2.5 w-10 rounded-full bg-stone-800" />
      <div className="h-5 w-3 bg-stone-800" />
      <div className="h-4 w-8 rounded-t-md bg-stone-700" />
      <div className="relative h-28 w-14 rounded-b-xl rounded-t-md bg-gradient-to-b from-[#5b7350] to-[#3c5236] shadow-inner">
        <div className="absolute left-1.5 top-3 h-16 w-1.5 rounded-full bg-white/20" />
        <div className="absolute inset-x-2 top-8 flex h-12 items-center justify-center rounded-sm bg-[#f4ecdc]">
          <span className="[font-family:Georgia,'Times_New_Roman',serif] text-[9px] italic tracking-wide text-emerald-900">
            wildroot
          </span>
        </div>
      </div>
    </div>
  );
}

function BalmTin() {
  return (
    <div className="flex flex-col items-center justify-end pt-10">
      <div className="relative flex h-9 w-32 items-center justify-center rounded-2xl bg-gradient-to-b from-[#d8845a] to-[#c4673b] shadow-inner">
        <div className="absolute left-3 top-1.5 h-2 w-12 rounded-full bg-white/30" />
      </div>
      <div className="flex h-12 w-[8.5rem] items-center justify-center rounded-b-2xl rounded-t-sm bg-gradient-to-b from-[#b25a31] to-[#8f4a26]">
        <span className="[font-family:Georgia,'Times_New_Roman',serif] text-[10px] italic tracking-wide text-[#f8f3e8]">
          wildroot
        </span>
      </div>
    </div>
  );
}

/* ---------- Data ---------- */

const products = [
  {
    name: "Meadow Dew Face Oil",
    blurb: "Cold-pressed rosehip, calendula & sea buckthorn",
    price: "$42",
    tag: "Bestseller",
    art: <DropperBottle />,
    bg: "bg-[#efe7d6]",
  },
  {
    name: "Clay & Nettle Mask",
    blurb: "Pink kaolin clay with wild-harvested nettle",
    price: "$28",
    tag: "New batch",
    art: <CreamJar />,
    bg: "bg-[#e8e2cf]",
  },
  {
    name: "Forest Bath Cleanser",
    blurb: "Pine needle, oat milk & white willow bark",
    price: "$24",
    tag: "Staff pick",
    art: <PumpBottle />,
    bg: "bg-[#ece4d2]",
  },
  {
    name: "Rootworker Balm",
    blurb: "Comfrey, beeswax & smoked clay salve",
    price: "$19",
    tag: "Back in stock",
    art: <BalmTin />,
    bg: "bg-[#efe5d3]",
  },
];

const values = [
  {
    title: "Cold-pressed botanicals",
    text: "Every extract is pressed within 48 hours of harvest from our partner farms in the Willamette Valley — never heat-treated, never diluted.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <path
          d="M16 4C10 10 7 15 7 20a9 9 0 0018 0c0-5-3-10-9-16z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M16 24c-2.5-1-4-3-4-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Small batches, dated by hand",
    text: "We blend in runs of 200 jars or fewer. Each label carries the batch date and the name of the person who poured it.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <rect
          x="7"
          y="9"
          width="18"
          height="17"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M11 6v5M21 6v5M7 14h18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="16" cy="20" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Glass, tin & compost",
    text: "Amber glass, recyclable tin, and mailers that compost in 90 days. Send five empties back and your sixth refill is on us.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <path
          d="M12 6h8M13 6v4l-4 6v8a2 2 0 002 2h10a2 2 0 002-2v-8l-4-6V6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 20h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Nothing synthetic, ever",
    text: "No synthetic fragrance, parabens, PEGs or fillers. If we can’t trace an ingredient to a field or a forest, it doesn’t go in the jar.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <circle
          cx="16"
          cy="16"
          r="11"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M11 16.5l3.5 3.5L21 13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const testimonials = [
  {
    quote:
      "The Meadow Dew oil calmed my winter redness in about a week. It smells like a field after rain — not perfume, an actual field.",
    name: "Imogen R.",
    detail: "Meadow Dew Face Oil · Portland, OR",
  },
  {
    quote:
      "I’ve repurchased the Rootworker Balm four times. My hands survive a whole season in the garden now, and the tin lives in my apron pocket.",
    name: "Saoirse K.",
    detail: "Rootworker Balm · Hudson, NY",
  },
  {
    quote:
      "Knowing the batch date and who poured it sounds like a gimmick until you try it. Batch 112, poured by Mara — best mask I’ve ever used.",
    name: "Theo M.",
    detail: "Clay & Nettle Mask · Asheville, NC",
  },
];

/* ---------- Page ---------- */

export default function WildrootLanding() {
  return (
    <div className="min-h-screen w-full bg-[#faf6ef] text-stone-700 antialiased">
      <style>{`
        @keyframes lp3-sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes lp3-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .lp3-sway { animation: lp3-sway 7s ease-in-out infinite; transform-origin: bottom center; }
        .lp3-drift { animation: lp3-drift 6s ease-in-out infinite; }
      `}</style>

      {/* Announcement bar */}
      <div className="bg-emerald-950 px-4 py-2.5 text-center text-xs tracking-widest text-[#e9dfc8] uppercase">
        Batch No. 114 just poured — free carbon-neutral shipping over $45
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-[#faf6ef]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="#" className="flex items-center gap-2 text-emerald-900">
            <LeafMark className="h-7 w-7" />
            <span className="[font-family:Georgia,'Times_New_Roman',serif] text-2xl tracking-tight">
              Wildroot
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
            <a href="#shop" className="transition-colors hover:text-[#c4673b]">
              Shop
            </a>
            <a
              href="#philosophy"
              className="transition-colors hover:text-[#c4673b]"
            >
              Philosophy
            </a>
            <a
              href="#ingredients"
              className="transition-colors hover:text-[#c4673b]"
            >
              Ingredients
            </a>
            <a
              href="#stories"
              className="transition-colors hover:text-[#c4673b]"
            >
              Stories
            </a>
          </div>
          <a
            href="#shop"
            className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-medium text-[#faf6ef] transition-colors hover:bg-[#c4673b]"
          >
            Shop the batch
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <Sprig className="lp3-sway absolute -left-4 top-12 hidden h-44 text-emerald-900/15 lg:block" />
        <Sprig className="lp3-sway absolute -right-2 bottom-8 hidden h-56 -scale-x-100 text-[#c4673b]/20 lg:block" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-8">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c4673b]/30 bg-[#c4673b]/10 px-4 py-1.5 text-xs tracking-widest text-[#a04f28] uppercase">
              <LeafMark className="h-4 w-4" /> Organic · Small-batch · Traceable
            </p>
            <h1 className="[font-family:Georgia,'Times_New_Roman',serif] text-4xl leading-tight text-emerald-950 sm:text-5xl lg:text-6xl">
              Skincare that remembers{" "}
              <em className="text-[#c4673b]">where it grew.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">
              Wildroot blends cold-pressed botanicals into honest formulas —
              poured by hand in batches of two hundred, sealed in glass, and
              traced back to the field on every label.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#shop"
                className="rounded-full bg-[#c4673b] px-7 py-3.5 text-sm font-semibold text-[#faf6ef] shadow-lg shadow-[#c4673b]/25 transition hover:-translate-y-0.5 hover:bg-[#a04f28]"
              >
                Explore bestsellers
              </a>
              <a
                href="#philosophy"
                className="[font-family:Georgia,'Times_New_Roman',serif] text-sm italic text-emerald-900 underline decoration-[#c4673b]/50 underline-offset-4 transition-colors hover:text-[#c4673b]"
              >
                Read our philosophy →
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs tracking-wide text-stone-500">
              <span>★ 4.9 from 2,300+ ritual keepers</span>
              <span>·</span>
              <span>Certified organic since 2019</span>
            </div>
          </div>

          {/* Hero still-life built from CSS shapes */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 m-auto h-72 w-72 rounded-full bg-gradient-to-br from-[#efe5d0] to-[#e4d6ba] sm:h-80 sm:w-80" />
            <div className="lp3-drift relative flex items-end justify-center gap-6 pb-6 pt-16">
              <div className="origin-bottom scale-110">
                <DropperBottle />
              </div>
              <CreamJar />
              <div className="hidden sm:block">
                <PumpBottle />
              </div>
            </div>
            <div className="relative mx-auto h-3 w-64 rounded-full bg-emerald-950/10 blur-sm" />
            <p className="[font-family:Georgia,'Times_New_Roman',serif] mt-6 text-center text-sm italic text-stone-500">
              Batch No. 114 — poured June 2, 2026, by Mara &amp; Felix
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="bg-emerald-950 text-[#e9dfc8]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-xs tracking-[0.3em] text-[#d8845a] uppercase">
            Our philosophy
          </p>
          <h2 className="[font-family:Georgia,'Times_New_Roman',serif] mt-4 text-3xl leading-snug sm:text-4xl">
            We don&apos;t manufacture skincare.
            <br />
            <em className="text-[#d8845a]">We tend it.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#cfc4a8] sm:text-lg">
            Wildroot began in a drafty barn kitchen with a copper still, a
            rosehip harvest, and a stubborn belief: skin doesn&apos;t need more
            chemistry — it needs better farming. Seven years on, we still press
            every botanical within two days of picking, still pour by hand, and
            still print the field of origin on every jar. Slow is not our
            limitation. It&apos;s our recipe.
          </p>
          <div className="mt-10 flex justify-center text-[#d8845a]">
            <BotanicalDivider />
          </div>
          <div className="mt-10 grid gap-8 text-left sm:grid-cols-3">
            <div>
              <p className="[font-family:Georgia,'Times_New_Roman',serif] text-3xl text-[#d8845a]">
                48h
              </p>
              <p className="mt-2 text-sm text-[#cfc4a8]">
                from harvest to cold-press, for every botanical we use
              </p>
            </div>
            <div>
              <p className="[font-family:Georgia,'Times_New_Roman',serif] text-3xl text-[#d8845a]">
                11
              </p>
              <p className="mt-2 text-sm text-[#cfc4a8]">
                regenerative family farms in our growing circle
              </p>
            </div>
            <div>
              <p className="[font-family:Georgia,'Times_New_Roman',serif] text-3xl text-[#d8845a]">
                0
              </p>
              <p className="mt-2 text-sm text-[#cfc4a8]">
                synthetic fragrances, fillers, or shortcuts — ever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section id="shop" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-12 text-center">
          <p className="text-xs tracking-[0.3em] text-[#c4673b] uppercase">
            From the current batch
          </p>
          <h2 className="[font-family:Georgia,'Times_New_Roman',serif] mt-3 text-3xl text-emerald-950 sm:text-4xl">
            Bestsellers, <em className="text-[#c4673b]">freshly poured</em>
          </h2>
          <div className="mt-6">
            <BotanicalDivider />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <article
              key={p.name}
              className="group overflow-hidden rounded-3xl border border-emerald-900/10 bg-white/60 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-950/10"
            >
              <div
                className={`relative flex h-56 items-end justify-center ${p.bg} pb-6`}
              >
                <span className="absolute left-4 top-4 rounded-full bg-emerald-900 px-3 py-1 text-[10px] font-medium tracking-widest text-[#faf6ef] uppercase">
                  {p.tag}
                </span>
                <div className="transition-transform duration-300 group-hover:scale-105">
                  {p.art}
                </div>
              </div>
              <div className="p-5">
                <h3 className="[font-family:Georgia,'Times_New_Roman',serif] text-lg text-emerald-950">
                  {p.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">
                  {p.blurb}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-emerald-900">
                    {p.price}
                  </span>
                  <button className="rounded-full border border-emerald-900/20 px-4 py-2 text-xs font-medium text-emerald-900 transition-colors hover:border-[#c4673b] hover:bg-[#c4673b] hover:text-[#faf6ef]">
                    Add to ritual
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Ingredients / values */}
      <section id="ingredients" className="bg-[#f2ebdd]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <p className="text-xs tracking-[0.3em] text-[#c4673b] uppercase">
                Ingredients &amp; values
              </p>
              <h2 className="[font-family:Georgia,'Times_New_Roman',serif] mt-3 text-3xl leading-snug text-emerald-950 sm:text-4xl">
                Grown slow.
                <br />
                Pressed fresh.
                <br />
                <em className="text-[#c4673b]">Kept honest.</em>
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone-600">
                Every Wildroot formula starts in the soil. These are the four
                promises printed inside the lid of every jar we ship.
              </p>
              <Sprig className="mt-8 hidden h-32 text-emerald-900/20 lg:block" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-3xl border border-emerald-900/10 bg-[#faf6ef] p-6 transition duration-300 hover:border-[#c4673b]/40 hover:shadow-lg hover:shadow-emerald-950/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-900/10 text-emerald-900">
                    {v.icon}
                  </div>
                  <h3 className="[font-family:Georgia,'Times_New_Roman',serif] mt-4 text-lg text-emerald-950">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {v.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="stories" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-12 text-center">
          <p className="text-xs tracking-[0.3em] text-[#c4673b] uppercase">
            From the ritual keepers
          </p>
          <h2 className="[font-family:Georgia,'Times_New_Roman',serif] mt-3 text-3xl text-emerald-950 sm:text-4xl">
            Skin stories, <em className="text-[#c4673b]">told plainly</em>
          </h2>
          <div className="mt-6">
            <BotanicalDivider />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-3xl border border-emerald-900/10 bg-white/70 p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/10"
            >
              <Stars />
              <blockquote className="[font-family:Georgia,'Times_New_Roman',serif] mt-4 flex-1 text-base italic leading-relaxed text-stone-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-emerald-900/10 pt-4">
                <p className="text-sm font-semibold text-emerald-950">
                  {t.name}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">{t.detail}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#c4673b] to-[#a04f28] px-6 py-14 text-center sm:px-12 sm:py-16">
          <Sprig className="absolute -left-3 -top-6 h-36 rotate-12 text-[#faf6ef]/15" />
          <Sprig className="absolute -bottom-8 -right-2 h-40 -rotate-[160deg] text-[#faf6ef]/15" />
          <h2 className="[font-family:Georgia,'Times_New_Roman',serif] relative text-3xl text-[#faf6ef] sm:text-4xl">
            Be first to the <em>next batch</em>
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#f6e3d4]">
            Batches sell through in days. Join the Field Notes letter for pour
            dates, harvest dispatches, and 10% off your first ritual.
          </p>
          <form className="relative mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              placeholder="you@meadow.com"
              aria-label="Email address"
              className="w-full flex-1 rounded-full border border-[#faf6ef]/30 bg-[#faf6ef]/15 px-5 py-3.5 text-sm text-[#faf6ef] placeholder:text-[#f6e3d4]/70 focus:border-[#faf6ef] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-950 px-7 py-3.5 text-sm font-semibold text-[#faf6ef] transition hover:-translate-y-0.5 hover:bg-emerald-900"
            >
              Join Field Notes
            </button>
          </form>
          <p className="relative mt-4 text-xs text-[#f6e3d4]/80">
            One letter per batch. Unsubscribe any season.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 text-[#cfc4a8]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-[#e9dfc8]">
              <LeafMark className="h-6 w-6" />
              <span className="[font-family:Georgia,'Times_New_Roman',serif] text-xl">
                Wildroot
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Small-batch botanical skincare, pressed and poured in McMinnville,
              Oregon. Rooted in eleven regenerative farms and one drafty barn.
            </p>
          </div>
          <div>
            <h3 className="text-xs tracking-[0.25em] text-[#d8845a] uppercase">
              Shop
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#shop" className="transition-colors hover:text-[#d8845a]">
                  Face oils
                </a>
              </li>
              <li>
                <a href="#shop" className="transition-colors hover:text-[#d8845a]">
                  Masks &amp; clays
                </a>
              </li>
              <li>
                <a href="#shop" className="transition-colors hover:text-[#d8845a]">
                  Cleansers
                </a>
              </li>
              <li>
                <a href="#shop" className="transition-colors hover:text-[#d8845a]">
                  Balms &amp; salves
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs tracking-[0.25em] text-[#d8845a] uppercase">
              Roots
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="#philosophy"
                  className="transition-colors hover:text-[#d8845a]"
                >
                  Our philosophy
                </a>
              </li>
              <li>
                <a
                  href="#ingredients"
                  className="transition-colors hover:text-[#d8845a]"
                >
                  Ingredient index
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#d8845a]">
                  Refill &amp; return
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#d8845a]">
                  Farm partners
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#e9dfc8]/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[#cfc4a8]/70 sm:flex-row sm:px-6">
            <p>© 2026 Wildroot Botanicals LLC. All rights reserved.</p>
            <p className="[font-family:Georgia,'Times_New_Roman',serif] italic">
              Grown slow. Pressed fresh. Kept honest.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
