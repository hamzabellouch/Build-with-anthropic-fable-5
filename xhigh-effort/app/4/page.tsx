import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aurelius Private — Private Wealth, Quietly Managed",
  description:
    "Aurelius Private is a by-invitation private wealth management firm, est. 1987. Wealth structuring, private markets, and legacy counsel for a limited number of families.",
};

const GOLD = "#c9a96a";

function Crest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="32" cy="32" r="30" stroke={GOLD} strokeWidth="0.75" />
      <circle
        cx="32"
        cy="32"
        r="25"
        stroke={GOLD}
        strokeWidth="0.5"
        opacity="0.5"
      />
      {/* Laurel marks */}
      <path
        d="M14 40c2.5 1 5 0.5 6.5-1M14 34c2.5 1 5 0.5 6.5-1M14 28c2.5 1 5 0.5 6.5-1"
        stroke={GOLD}
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M50 40c-2.5 1-5 0.5-6.5-1M50 34c-2.5 1-5 0.5-6.5-1M50 28c-2.5 1-5 0.5-6.5-1"
        stroke={GOLD}
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Monogram A */}
      <path
        d="M32 18 23 46h3.5l2.2-7h6.6l2.2 7H41L32 18Zm0 9.5 2.4 8h-4.8l2.4-8Z"
        fill={GOLD}
      />
    </svg>
  );
}

function Hairline({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-px w-full bg-gradient-to-r from-transparent via-[#c9a96a]/30 to-transparent ${className}`}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.3em] text-[#c9a96a]">
      {children}
    </p>
  );
}

export default function AureliusPrivatePage() {
  return (
    <div className="min-h-screen bg-[#0c0c0a] text-stone-300 antialiased [font-family:Georgia,'Times_New_Roman',serif]">
      <style>{`
        @keyframes lp4-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp4-rise { animation: lp4-rise 1.1s ease-out both; }
        .lp4-rise-2 { animation: lp4-rise 1.1s ease-out 0.25s both; }
        .lp4-rise-3 { animation: lp4-rise 1.1s ease-out 0.5s both; }
      `}</style>

      {/* ── Navigation ─────────────────────────────────────── */}
      <header className="border-b border-[#c9a96a]/20">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <Crest className="h-9 w-9" />
            <span className="text-sm font-light uppercase tracking-[0.3em] text-stone-100">
              Aurelius <span className="text-[#c9a96a]">Private</span>
            </span>
          </a>
          <a
            href="#introduction"
            className="hidden border border-[#c9a96a]/50 px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] text-[#c9a96a] transition-colors duration-300 hover:border-[#c9a96a] hover:bg-[#c9a96a] hover:text-[#0c0c0a] sm:inline-block"
          >
            Request an Introduction
          </a>
        </nav>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
            <Crest className="h-[44rem] w-[44rem]" />
          </div>
          <div className="relative mx-auto max-w-4xl px-6 pb-28 pt-24 text-center sm:px-8 sm:pt-32 md:pb-36 md:pt-40">
            <p className="lp4-rise text-[11px] uppercase tracking-[0.3em] text-[#c9a96a]">
              By invitation &middot; Est. 1987
            </p>
            <h1 className="lp4-rise-2 mt-8 text-4xl font-light leading-[1.15] tracking-wide text-stone-100 sm:text-5xl md:text-6xl">
              Wealth, held to a
              <br />
              <span className="italic text-[#c9a96a]">higher standard</span> of
              quiet.
            </h1>
            <p className="lp4-rise-3 mx-auto mt-8 max-w-xl text-base font-light leading-relaxed text-stone-400 sm:text-lg">
              For nearly four decades, Aurelius Private has counselled a
              deliberately small number of families on the stewardship of
              significant wealth. We do not advertise. We are introduced.
            </p>
            <div className="lp4-rise-3 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#introduction"
                className="border border-[#c9a96a] px-10 py-3.5 text-[11px] uppercase tracking-[0.25em] text-[#c9a96a] transition-colors duration-300 hover:bg-[#c9a96a] hover:text-[#0c0c0a]"
              >
                Request an Introduction
              </a>
              <a
                href="#approach"
                className="px-10 py-3.5 text-[11px] uppercase tracking-[0.25em] text-stone-400 transition-colors duration-300 hover:text-stone-100"
              >
                Our Approach
              </a>
            </div>
          </div>
        </section>

        <Hairline />

        {/* ── Heritage / numbers band ───────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8 md:py-24">
          <div className="grid grid-cols-2 gap-x-6 gap-y-14 text-center md:grid-cols-4">
            {[
              { value: "$12B", caption: "Assets under advisement" },
              { value: "1987", caption: "Year of our founding" },
              { value: "4", caption: "Offices, by appointment" },
              { value: "61", caption: "Families in our care" },
            ].map((item) => (
              <div key={item.caption}>
                <p className="text-5xl font-light tracking-wide text-stone-100 md:text-6xl">
                  {item.value}
                </p>
                <div className="mx-auto mt-5 h-px w-10 bg-[#c9a96a]/50" />
                <p className="mt-5 text-[11px] uppercase tracking-[0.25em] text-stone-500">
                  {item.caption}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Hairline />

        {/* ── Service pillars ───────────────────────────────── */}
        <section id="approach" className="mx-auto max-w-6xl px-6 py-24 sm:px-8 md:py-32">
          <div className="text-center">
            <SectionLabel>What we attend to</SectionLabel>
            <h2 className="mt-6 text-3xl font-light tracking-wide text-stone-100 sm:text-4xl">
              Three disciplines. One mandate.
            </h2>
          </div>
          <div className="mt-16 grid gap-px bg-[#c9a96a]/15 md:grid-cols-3">
            {[
              {
                numeral: "I",
                title: "Wealth Structuring",
                body:
                  "Cross-border holding structures, tax-aware portfolio architecture, and liquidity planning designed to be examined in fifty years and found sound.",
              },
              {
                numeral: "II",
                title: "Private Markets",
                body:
                  "Direct co-investments, select buyout and credit partnerships, and real assets — allocated patiently, on terms negotiated for our families alone.",
              },
              {
                numeral: "III",
                title: "Legacy & Trusts",
                body:
                  "Trusteeship, governance for family councils, and philanthropic vehicles that carry intention — not merely capital — to the next generation.",
              },
            ].map((pillar) => (
              <article
                key={pillar.title}
                className="group bg-[#0c0c0a] px-8 py-12 transition-colors duration-500 hover:bg-[#121210] md:px-10 md:py-14"
              >
                <p className="text-sm tracking-[0.3em] text-[#c9a96a]/70 transition-colors duration-500 group-hover:text-[#c9a96a]">
                  {pillar.numeral}
                </p>
                <h3 className="mt-6 text-xl font-light tracking-wide text-stone-100">
                  {pillar.title}
                </h3>
                <div className="mt-5 h-px w-8 bg-[#c9a96a]/40 transition-all duration-500 group-hover:w-14 group-hover:bg-[#c9a96a]/80" />
                <p className="mt-5 text-sm font-light leading-relaxed text-stone-400">
                  {pillar.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <Hairline />

        {/* ── Client quote ──────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 md:py-32">
          <p
            className="text-6xl leading-none text-[#c9a96a]/40"
            aria-hidden="true"
          >
            &ldquo;
          </p>
          <blockquote className="mt-2 text-2xl font-light italic leading-relaxed text-stone-200 sm:text-3xl">
            They have advised three generations of us now. In thirty years, I
            have never once heard them raise their voice — or miss a detail.
          </blockquote>
          <div className="mx-auto mt-10 h-px w-12 bg-[#c9a96a]/50" />
          <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-stone-500">
            A client family &middot; Geneva &middot; Since 1994
          </p>
        </section>

        <Hairline />

        {/* ── How we engage ─────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-24 sm:px-8 md:py-32">
          <div className="text-center">
            <SectionLabel>How we engage</SectionLabel>
            <h2 className="mt-6 text-3xl font-light tracking-wide text-stone-100 sm:text-4xl">
              An unhurried beginning
            </h2>
          </div>
          <ol className="mx-auto mt-16 grid max-w-4xl gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Introduction",
                body: "A referral from an existing client or trusted counsel opens the conversation.",
              },
              {
                step: "02",
                title: "Private Audience",
                body: "A confidential meeting — at our offices or your residence — to understand your circumstances.",
              },
              {
                step: "03",
                title: "The Mandate",
                body: "A written articulation of objectives, constraints, and the standard to which we will be held.",
              },
              {
                step: "04",
                title: "Stewardship",
                body: "Ongoing counsel, reviewed in person each season, for as long as we earn your confidence.",
              },
            ].map((item) => (
              <li key={item.step} className="text-center sm:text-left">
                <p className="text-sm tracking-[0.3em] text-[#c9a96a]">
                  {item.step}
                </p>
                <h3 className="mt-4 text-lg font-light tracking-wide text-stone-100">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-stone-400">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Invitation CTA ────────────────────────────────── */}
        <section id="introduction" className="border-y border-[#c9a96a]/20 bg-[#0f0f0c]">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 md:py-28">
            <Crest className="mx-auto h-14 w-14" />
            <h2 className="mt-10 text-3xl font-light leading-snug tracking-wide text-stone-100 sm:text-4xl">
              We accept a small number of
              <br className="hidden sm:block" /> new families each year.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base font-light leading-relaxed text-stone-400">
              If you believe our manner of working suits your own, we would be
              pleased to arrange a private conversation. Discretion is assumed;
              no obligation attends it.
            </p>
            <a
              href="#"
              className="mt-12 inline-block border border-[#c9a96a] px-12 py-4 text-[11px] uppercase tracking-[0.25em] text-[#c9a96a] transition-colors duration-300 hover:bg-[#c9a96a] hover:text-[#0c0c0a]"
            >
              Request an Introduction
            </a>
            <p className="mt-8 text-[11px] uppercase tracking-[0.25em] text-stone-600">
              Replies within two business days &middot; Strictly confidential
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="mx-auto max-w-6xl px-6 py-16 sm:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <Crest className="h-8 w-8" />
              <span className="text-xs font-light uppercase tracking-[0.3em] text-stone-100">
                Aurelius <span className="text-[#c9a96a]">Private</span>
              </span>
            </div>
            <p className="mt-6 max-w-xs text-sm font-light leading-relaxed text-stone-500">
              Private wealth management for families of consequence.
              Established 1987.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 md:col-span-8">
            {[
              { city: "Geneva", lines: ["12 Quai du Léman", "+41 22 555 0187"] },
              { city: "London", lines: ["4 St James’s Place", "+44 20 7555 0187"] },
              { city: "New York", lines: ["730 Park Avenue", "+1 212 555 0187"] },
              { city: "Singapore", lines: ["1 Raffles Quay", "+65 6555 0187"] },
            ].map((office) => (
              <div key={office.city}>
                <h4 className="text-[11px] uppercase tracking-[0.25em] text-[#c9a96a]">
                  {office.city}
                </h4>
                {office.lines.map((line) => (
                  <p key={line} className="mt-3 text-sm font-light text-stone-500">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
        <Hairline className="mt-14" />
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-stone-600 sm:flex-row">
          <p>&copy; 2026 Aurelius Private Partners SA. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="transition-colors hover:text-[#c9a96a]">
              Regulatory
            </a>
            <a href="#" className="transition-colors hover:text-[#c9a96a]">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-[#c9a96a]">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
