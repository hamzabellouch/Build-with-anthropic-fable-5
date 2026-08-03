import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ember & Oak — Small-Batch Coffee Roastery, Portland",
  description:
    "Ember & Oak has roasted single-origin coffee in small batches in Portland since 2014. Build a subscription, browse the spring shelf, or visit the café on SE Ankeny.",
};

const serif = "[font-family:Georgia,'Times_New_Roman',serif]";

const roasts = [
  {
    no: "01",
    origin: "Ethiopia Guji",
    farm: "Uraga Washing Station · Washed Heirloom",
    notes: ["Apricot", "Bergamot", "Honeysuckle"],
    level: 1,
    levelLabel: "Light",
    price: "$21",
    weight: "12 oz",
  },
  {
    no: "02",
    origin: "Colombia Huila",
    farm: "Finca El Mirador · Honey Caturra",
    notes: ["Panela", "Red Plum", "Cacao Nib"],
    level: 3,
    levelLabel: "Medium",
    price: "$19",
    weight: "12 oz",
  },
  {
    no: "03",
    origin: "Sumatra Kerinci",
    farm: "Gunung Tujuh Co-op · Wet-Hulled",
    notes: ["Dark Chocolate", "Fig", "Cedar"],
    level: 5,
    levelLabel: "Dark",
    price: "$20",
    weight: "12 oz",
  },
];

const steps = [
  {
    n: "01",
    title: "Source",
    body: "We buy from twenty-six farms and washing stations we have actually stood on, paying two to three times the commodity rate and returning season after season.",
  },
  {
    n: "02",
    title: "Sample",
    body: "Every lot is roasted three ways on the 100-gram sample roaster and cupped blind. If a coffee does not argue for itself at the table, it does not get a bag.",
  },
  {
    n: "03",
    title: "Roast",
    body: "Twelve kilos at a time on Hazel, our 1987 Probat. The roaster listens for first crack the way other people listen for the kettle — by ear, every batch.",
  },
  {
    n: "04",
    title: "Rest & Ship",
    body: "Beans rest forty-eight hours to off-gas, then ship the same week they were roasted. The roast date is printed by hand on every label.",
  },
];

const tiers = [
  {
    name: "The Apprentice",
    price: "$18",
    cadence: "per month",
    blurb: "A gentle on-ramp. One bag, our pick, every month.",
    features: [
      "One 12 oz bag, roaster's choice",
      "Tasting card with every shipment",
      "Free shipping in the lower 48",
      "Pause or cancel anytime",
    ],
    featured: false,
  },
  {
    name: "The Regular",
    price: "$34",
    cadence: "per month",
    blurb: "Our most poured plan. Two bags, your call.",
    features: [
      "Two 12 oz bags, you choose origins",
      "Early access to limited lots",
      "Swap roast levels each cycle",
      "One free café pour-over monthly",
    ],
    featured: true,
  },
  {
    name: "The Devotee",
    price: "$64",
    cadence: "per month",
    blurb: "For the household that measures water in grams.",
    features: [
      "Four 12 oz bags, fully customizable",
      "First dibs on micro-lots under 30 bags",
      "Quarterly cupping invitation",
      "Annual roastery dinner seat",
    ],
    featured: false,
  },
];

function Steam({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 48"
      fill="none"
      aria-hidden="true"
      className={`lp10-steam ${className}`}
    >
      <path
        d="M12 44c-5-7 5-11 0-18 -5-7 5-11 0-18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M30 46c-5-7 5-12 0-19 -5-7 5-12 0-19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M48 44c-5-7 5-11 0-18 -5-7 5-11 0-18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function RoastDots({ level, dark = false }: { level: number; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Roast level ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i <= level
              ? "bg-[#c96f2f]"
              : dark
                ? "border border-[#f3ead9]/40"
                : "border border-[#2b1d14]/40"
          }`}
        />
      ))}
    </span>
  );
}

function ThickThinRule({ dark = false }: { dark?: boolean }) {
  const thick = dark ? "border-[#f3ead9]" : "border-[#2b1d14]";
  const thin = dark ? "border-[#f3ead9]/40" : "border-[#2b1d14]/40";
  return (
    <div aria-hidden="true">
      <div className={`border-t-4 ${thick}`} />
      <div className={`mt-1 border-t ${thin}`} />
    </div>
  );
}

export default function EmberAndOakPage() {
  return (
    <div className="min-h-screen bg-[#231711] text-[#f3ead9] antialiased">
      <style>{`
        @keyframes lp10-rise {
          0% { transform: translateY(4px); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translateY(-8px); opacity: 0; }
        }
        .lp10-steam path { animation: lp10-rise 3.4s ease-in-out infinite; }
        .lp10-steam path:nth-child(2) { animation-delay: 1.1s; }
        .lp10-steam path:nth-child(3) { animation-delay: 2.2s; }
      `}</style>

      {/* ===================== NAV ===================== */}
      <header className="border-b border-[#f3ead9]/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="#top" className={`${serif} text-2xl tracking-tight`}>
            Ember <span className="italic text-[#c96f2f]">&amp;</span> Oak
          </a>
          <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.2em] md:flex">
            <a href="#roasts" className="transition-colors hover:text-amber-600">
              The Shelf
            </a>
            <a href="#process" className="transition-colors hover:text-amber-600">
              Process
            </a>
            <a href="#subscriptions" className="transition-colors hover:text-amber-600">
              Subscriptions
            </a>
            <a href="#visit" className="transition-colors hover:text-amber-600">
              Visit
            </a>
          </nav>
          <a
            href="#subscriptions"
            className="border border-[#f3ead9]/40 px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors hover:border-[#c96f2f] hover:bg-[#c96f2f] hover:text-[#231711]"
          >
            Subscribe
          </a>
        </div>
      </header>

      {/* ===================== HERO ===================== */}
      <section id="top" className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-600">
              Vol. XII · The Spring List · Portland, Oregon — Est. 2014
            </p>
            <h1
              className={`${serif} mt-6 text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl`}
            >
              The slow art of a<br className="hidden sm:block" />{" "}
              <span className="italic text-amber-600">serious</span> roast.
            </h1>

            <div className="mt-8 max-w-xl">
              <ThickThinRule dark />
              <p
                className="mt-6 text-base leading-relaxed text-[#f3ead9]/85 first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-[#c96f2f] first-letter:[font-family:Georgia,'Times_New_Roman',serif]"
              >
                Twelve years ago we dragged a secondhand Probat into a drafty
                warehouse off SE Ankeny and burned our first three batches to
                charcoal. The fourth one changed everything. Ember &amp; Oak
                still roasts the same way — twelve kilos at a time, by ear and
                by nose — for the simple reason that small batches taste like
                someone was paying attention. Because someone was.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#subscriptions"
                className="bg-[#c96f2f] px-7 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#231711] transition-colors hover:bg-amber-600"
              >
                Build your subscription
              </a>
              <a
                href="#roasts"
                className="border border-[#f3ead9]/40 px-7 py-4 text-center text-sm uppercase tracking-[0.2em] transition-colors hover:border-[#f3ead9] hover:bg-[#f3ead9] hover:text-[#231711]"
              >
                Browse the roasts
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-[#f3ead9]/20 pt-6">
              {[
                ["12", "years at the roaster"],
                ["26", "partner farms"],
                ["48 hr", "rest before shipping"],
              ].map(([num, label]) => (
                <div key={label}>
                  <dt className={`${serif} text-3xl text-amber-600 sm:text-4xl`}>{num}</dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#f3ead9]/60">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Editorial cup illustration */}
          <div className="lg:col-span-5">
            <figure className="border border-[#f3ead9]/20 p-6 sm:p-8">
              <svg viewBox="0 0 320 330" fill="none" aria-hidden="true" className="mx-auto w-full max-w-xs">
                <g className="lp10-steam text-[#c96f2f]">
                  <path
                    d="M128 118c-7-11 7-17 0-29 -7-11 7-17 0-29"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M160 122c-7-12 7-18 0-31 -7-12 7-18 0-31"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M192 118c-7-11 7-17 0-29 -7-11 7-17 0-29"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
                <path
                  d="M82 158h156l-15 98c-2.2 14.5-14.7 25-29.4 25h-67.2c-14.7 0-27.2-10.5-29.4-25l-15-98z"
                  stroke="#f3ead9"
                  strokeWidth="3"
                />
                <ellipse cx="160" cy="158" rx="78" ry="12" stroke="#f3ead9" strokeWidth="3" />
                <ellipse cx="160" cy="160" rx="62" ry="8" stroke="#c96f2f" strokeWidth="2.5" />
                <path
                  d="M238 172c26-2 42 12 42 30 0 20-18 33-46 33"
                  stroke="#f3ead9"
                  strokeWidth="3"
                />
                <ellipse cx="160" cy="296" rx="96" ry="11" stroke="#f3ead9" strokeWidth="3" />
                <line x1="92" y1="296" x2="228" y2="296" stroke="#f3ead9" strokeWidth="2" opacity="0.4" />
              </svg>
              <figcaption className="mt-6 border-t border-[#f3ead9]/20 pt-4 text-center text-[11px] uppercase tracking-[0.25em] text-[#f3ead9]/60">
                Fig. 01 — The first pour, SE Ankeny café, 6:58 a.m.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ===================== FEATURED ROASTS ===================== */}
      <section id="roasts" className="bg-[#f3ead9] text-[#2b1d14]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-600">
                The Shelf — Spring 2026
              </p>
              <h2 className={`${serif} mt-3 text-4xl tracking-tight sm:text-5xl`}>
                Featured roasts
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#2b1d14]/70">
              Three coffees on the shelf right now, numbered the day they
              earned a spot. Each ships within a week of roasting.
            </p>
          </div>

          <div className="mt-6">
            <ThickThinRule />
          </div>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {roasts.map((r) => (
              <article
                key={r.no}
                className="group transition-transform duration-300 hover:-translate-y-2"
              >
                {/* coffee bag drawn in CSS: crimped seal, fold, body */}
                <div className="mx-12 h-3 rounded-t-sm bg-[#1a100b] [background-image:repeating-linear-gradient(90deg,transparent,transparent_5px,rgba(243,234,217,0.18)_5px,rgba(243,234,217,0.18)_6px)]" />
                <div className="mx-6 h-5 border-x border-t border-[#f3ead9]/10 bg-[#231711]" />
                <div className="relative rounded-t-[10px] rounded-b-2xl border border-[#1a100b] bg-[#2b1d14] px-5 pb-7 pt-7 shadow-[0_14px_30px_-12px_rgba(43,29,20,0.55)] transition-shadow duration-300 group-hover:shadow-[0_22px_40px_-12px_rgba(43,29,20,0.7)]">
                  <div
                    className="absolute right-6 top-3 h-2.5 w-2.5 rounded-full border border-[#f3ead9]/30"
                    title="One-way valve"
                  />
                  {/* label */}
                  <div className="rounded-md bg-[#f3ead9] px-5 py-6">
                    <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.25em] text-[#2b1d14]/60">
                      <span>Ember &amp; Oak</span>
                      <span>Roast No. {r.no}</span>
                    </div>
                    <div className="my-3 border-t-2 border-[#2b1d14]" />
                    <h3 className={`${serif} text-2xl italic tracking-tight`}>{r.origin}</h3>
                    <p className="mt-1 text-xs text-[#2b1d14]/70">{r.farm}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {r.notes.map((note) => (
                        <span
                          key={note}
                          className="rounded-full border border-[#2b1d14]/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-dashed border-[#2b1d14]/30 pt-4">
                      <RoastDots level={r.level} />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#2b1d14]/60">
                        {r.levelLabel} roast
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between px-1">
                    <p className="text-[#f3ead9]">
                      <span className={`${serif} text-2xl`}>{r.price}</span>
                      <span className="ml-2 text-xs text-[#f3ead9]/60">/ {r.weight}</span>
                    </p>
                    <a
                      href="#subscriptions"
                      className="text-xs uppercase tracking-[0.2em] text-[#c96f2f] underline-offset-4 transition-colors hover:text-amber-500 hover:underline"
                    >
                      Add to bag
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PROCESS ===================== */}
      <section id="process" className="bg-[#2b1d14]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-600">The Method</p>
            <h2 className={`${serif} mt-3 text-4xl tracking-tight sm:text-5xl`}>
              From crop to cup,{" "}
              <span className="italic text-amber-600">nothing rushed</span>
            </h2>
          </div>

          <div className="mt-6">
            <ThickThinRule dark />
          </div>

          <ol className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="border-t border-[#f3ead9]/20 pt-5">
                <div className="flex items-baseline justify-between">
                  <span className={`${serif} text-5xl italic text-[#c96f2f]`}>{s.n}</span>
                  <Steam className="h-7 w-9 text-[#f3ead9]/50" />
                </div>
                <h3 className={`${serif} mt-4 text-xl`}>{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#f3ead9]/75">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===================== SUBSCRIPTIONS ===================== */}
      <section id="subscriptions" className="bg-[#f3ead9] text-[#2b1d14]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-600">
              The Standing Order
            </p>
            <h2 className={`${serif} mt-3 text-4xl tracking-tight sm:text-5xl`}>
              Subscriptions, three ways
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#2b1d14]/70">
              Fresh-roasted beans on your doorstep, on your schedule. Every
              plan ships free, pauses freely, and cancels without a guilt
              trip. Roast dates handwritten, always.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-6">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative flex flex-col border-2 p-8 transition-transform duration-300 hover:-translate-y-1.5 ${
                  t.featured
                    ? "border-[#c96f2f] bg-[#2b1d14] text-[#f3ead9] shadow-[0_24px_50px_-20px_rgba(43,29,20,0.6)]"
                    : "border-[#2b1d14] bg-[#f3ead9]"
                }`}
              >
                {t.featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#c96f2f] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#231711]">
                    Most poured
                  </span>
                )}
                <h3 className={`${serif} text-2xl italic`}>{t.name}</h3>
                <p
                  className={`mt-2 text-sm ${
                    t.featured ? "text-[#f3ead9]/70" : "text-[#2b1d14]/70"
                  }`}
                >
                  {t.blurb}
                </p>
                <p className="mt-6">
                  <span className={`${serif} text-5xl`}>{t.price}</span>
                  <span
                    className={`ml-2 text-xs uppercase tracking-[0.2em] ${
                      t.featured ? "text-[#f3ead9]/60" : "text-[#2b1d14]/60"
                    }`}
                  >
                    {t.cadence}
                  </span>
                </p>
                <div
                  className={`my-6 border-t-2 ${
                    t.featured ? "border-[#c96f2f]" : "border-[#2b1d14]"
                  }`}
                />
                <ul className="flex-1 space-y-3 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c96f2f]"
                        aria-hidden="true"
                      />
                      <span className={t.featured ? "text-[#f3ead9]/85" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#newsletter"
                  className={`mt-8 block px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.25em] transition-colors ${
                    t.featured
                      ? "bg-[#c96f2f] text-[#231711] hover:bg-amber-600"
                      : "border-2 border-[#2b1d14] hover:bg-[#2b1d14] hover:text-[#f3ead9]"
                  }`}
                >
                  Choose {t.name.replace("The ", "the ")}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PULL QUOTE ===================== */}
      <section className="bg-[#231711]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 lg:py-24">
          <span className={`${serif} block text-8xl leading-none text-[#c96f2f]`} aria-hidden="true">
            &ldquo;
          </span>
          <blockquote
            className={`${serif} -mt-6 text-3xl italic leading-snug tracking-tight sm:text-4xl lg:text-[2.75rem]`}
          >
            The Guji tastes like Portland finally got a summer — bright,
            floral, and gone far too fast. I have rearranged trips around the
            shipping date.
          </blockquote>
          <div className="mx-auto mt-8 w-24 border-t-2 border-[#c96f2f]" />
          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-[#f3ead9]/60">
            Marisol Vega — Subscriber since 2019, Devotee tier
          </p>
        </div>
      </section>

      {/* ===================== VISIT ===================== */}
      <section id="visit" className="bg-[#2b1d14]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-600">The Café</p>
            <h2 className={`${serif} mt-3 text-4xl tracking-tight sm:text-5xl`}>
              Come stand at the bar
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#f3ead9]/75">
              The roastery and café share one long room on SE Ankeny. On
              roast days the whole block smells like first crack. Saturday
              cuppings are free, loud, and occasionally opinionated.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-8">
            {/* Ticket-stub visit card */}
            <div className="relative flex overflow-hidden rounded-lg bg-[#f3ead9] text-[#2b1d14] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.5)]">
              {/* main panel */}
              <div className="flex-1 p-7 sm:p-9">
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600">
                  Ember &amp; Oak Roastery &amp; Café
                </p>
                <h3 className={`${serif} mt-2 text-2xl italic tracking-tight`}>
                  1117 SE Ankeny St.
                </h3>
                <p className="text-sm text-[#2b1d14]/70">Portland, Oregon 97214</p>

                <div className="my-5 border-t-2 border-[#2b1d14]" />

                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="uppercase tracking-[0.15em] text-[#2b1d14]/60 text-xs pt-0.5">
                      Mon – Fri
                    </dt>
                    <dd className={`${serif}`}>7:00 a.m. – 5:00 p.m.</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="uppercase tracking-[0.15em] text-[#2b1d14]/60 text-xs pt-0.5">
                      Sat – Sun
                    </dt>
                    <dd className={`${serif}`}>8:00 a.m. – 4:00 p.m.</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="uppercase tracking-[0.15em] text-[#2b1d14]/60 text-xs pt-0.5">
                      Cuppings
                    </dt>
                    <dd className={`${serif}`}>Saturdays, 10:00 a.m.</dd>
                  </div>
                </dl>

                <p className="mt-5 border-t border-dashed border-[#2b1d14]/30 pt-4 text-xs leading-relaxed text-[#2b1d14]/60">
                  Roastery tours by appointment. Dogs welcome on the patio;
                  laptops welcome until the afternoon rush.
                </p>
              </div>

              {/* perforation */}
              <div className="relative w-px self-stretch border-l-2 border-dashed border-[#2b1d14]/40">
                <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#2b1d14]" />
                <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-[#2b1d14]" />
              </div>

              {/* stub */}
              <div className="flex w-16 items-center justify-center bg-[#c96f2f]/15 sm:w-20">
                <p className="rotate-180 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c96f2f] [writing-mode:vertical-rl]">
                  Admit one — first cupping free
                </p>
              </div>
            </div>

            {/* Map placeholder */}
            <figure className="overflow-hidden rounded-lg border border-[#f3ead9]/20">
              <div className="relative aspect-[4/3] bg-[#231711]">
                <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true">
                  {/* block grid */}
                  {[50, 100, 150, 200, 250, 300, 350].map((x) => (
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" stroke="#f3ead9" strokeWidth="1" opacity="0.12" />
                  ))}
                  {[50, 100, 150, 200, 250].map((y) => (
                    <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#f3ead9" strokeWidth="1" opacity="0.12" />
                  ))}
                  {/* main streets */}
                  <line x1="0" y1="150" x2="400" y2="150" stroke="#f3ead9" strokeWidth="4" opacity="0.35" />
                  <line x1="200" y1="0" x2="200" y2="300" stroke="#f3ead9" strokeWidth="4" opacity="0.35" />
                  {/* river */}
                  <path
                    d="M40 0c20 60-25 90 0 150 25 60-20 90 0 150"
                    stroke="#c96f2f"
                    strokeWidth="10"
                    opacity="0.3"
                    fill="none"
                  />
                  {/* street labels */}
                  <text x="244" y="142" fill="#f3ead9" opacity="0.55" fontSize="11" fontFamily="Georgia, serif" fontStyle="italic">
                    SE Ankeny St
                  </text>
                  <text x="208" y="40" fill="#f3ead9" opacity="0.55" fontSize="11" fontFamily="Georgia, serif" fontStyle="italic">
                    SE 11th Ave
                  </text>
                  {/* pin */}
                  <circle cx="200" cy="150" r="22" fill="#c96f2f" opacity="0.25" />
                  <path
                    d="M200 128c-9.4 0-17 7.6-17 17 0 12.8 17 29 17 29s17-16.2 17-29c0-9.4-7.6-17-17-17z"
                    fill="#c96f2f"
                  />
                  <circle cx="200" cy="145" r="6" fill="#231711" />
                </svg>
                <span className="absolute bottom-3 right-3 border border-[#f3ead9]/25 bg-[#231711]/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#f3ead9]/70">
                  SE Ankeny &amp; 11th
                </span>
              </div>
              <figcaption className="border-t border-[#f3ead9]/15 bg-[#231711] px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-[#f3ead9]/50">
                Map for orientation only — follow the smell of roasting
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ===================== NEWSLETTER ===================== */}
      <section id="newsletter" className="border-y border-[#f3ead9]/15 bg-[#231711]">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 lg:py-20">
          <Steam className="mx-auto h-10 w-14 text-[#c96f2f]" />
          <p className="mt-4 text-xs uppercase tracking-[0.35em] text-amber-600">
            The Sunday Pour
          </p>
          <h2 className={`${serif} mt-3 text-3xl tracking-tight sm:text-4xl`}>
            One letter a week,{" "}
            <span className="italic text-amber-600">worth waking up for</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#f3ead9]/70">
            What&apos;s on the roaster, what&apos;s landing on the shelf, and
            one brew recipe we argued about all week. No spam — unsubscribe
            whenever the mood sours.
          </p>
          <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="lp10-email" className="sr-only">
              Email address
            </label>
            <input
              id="lp10-email"
              type="email"
              required
              placeholder="you@example.com"
              className="flex-1 border border-[#f3ead9]/30 bg-transparent px-5 py-3.5 text-sm text-[#f3ead9] placeholder:text-[#f3ead9]/40 focus:border-[#c96f2f] focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#c96f2f] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#231711] transition-colors hover:bg-amber-600"
            >
              Sign me up
            </button>
          </form>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-[#1a100b]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className={`${serif} text-2xl tracking-tight`}>
                Ember <span className="italic text-[#c96f2f]">&amp;</span> Oak
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#f3ead9]/60">
                Small-batch coffee roastery &amp; café. Roasting on SE Ankeny,
                Portland, since 2014. Roast dates handwritten, opinions strong,
                refills honest.
              </p>
            </div>
            {[
              {
                head: "Shop",
                links: ["Subscriptions", "Single origins", "Blends", "Brew gear"],
              },
              {
                head: "Visit",
                links: ["The café", "Roastery tours", "Saturday cuppings", "Events"],
              },
              {
                head: "Company",
                links: ["Journal", "Wholesale", "Careers", "Contact"],
              },
            ].map((col) => (
              <div key={col.head} className="md:col-span-2">
                <h3 className="text-[11px] uppercase tracking-[0.3em] text-amber-600">
                  {col.head}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-[#f3ead9]/70">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#top" className="transition-colors hover:text-[#f3ead9]">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <div className="border-t-2 border-[#f3ead9]/30" />
            <div className="mt-1 border-t border-[#f3ead9]/15" />
          </div>

          <div className="mt-6 flex flex-col gap-3 text-xs text-[#f3ead9]/50 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; 2026 Ember &amp; Oak Coffee Roasters. All rights reserved.</p>
            <p className="uppercase tracking-[0.25em]">Roasted in Portland, Oregon</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
