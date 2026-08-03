import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Aurelia Botanica — Organic Skincare, Grown with Intention",
  description:
    "Small-batch organic skincare crafted from cold-pressed botanicals. Gentle rituals for radiant, balanced skin — cruelty-free, plant-powered, and beautifully simple.",
};

const products = [
  {
    name: "Dawn Dew Serum",
    note: "Rosehip · Sea Buckthorn",
    price: "$48",
    desc: "A featherweight morning serum that drapes skin in cold-pressed rosehip and a whisper of vitamin C.",
    gradient: "from-[#f6e3dc] via-[#f0d4c8] to-[#e8efe4]",
    blob: "bg-[#d9a795]/50",
  },
  {
    name: "Meadow Cream",
    note: "Calendula · Oat Milk",
    price: "$56",
    desc: "Our signature whipped moisturizer, steeped with calendula petals harvested at first light.",
    gradient: "from-[#e9f0e3] via-[#dde8d4] to-[#f7f1e6]",
    blob: "bg-[#9db48a]/50",
  },
  {
    name: "Evening Veil Oil",
    note: "Jasmine · Squalane",
    price: "$62",
    desc: "A slow-pressed facial oil that melts into skin overnight, leaving only softness by morning.",
    gradient: "from-[#f4ead9] via-[#efe0c9] to-[#f3dcd4]",
    blob: "bg-[#c9a86d]/40",
  },
] as const;

const ritualSteps = [
  {
    step: "01",
    title: "Cleanse softly",
    desc: "Warm a small amount of Meadow Cleanser between your palms and press into damp skin. Breathe in — this is your moment.",
  },
  {
    step: "02",
    title: "Drench in dew",
    desc: "Press three drops of Dawn Dew Serum onto cheeks, forehead, and chin while skin is still beautifully damp.",
  },
  {
    step: "03",
    title: "Seal with cream",
    desc: "Sweep Meadow Cream upward in gentle strokes, from the center of the face outward, sealing in every drop.",
  },
  {
    step: "04",
    title: "Rest & glow",
    desc: "On quiet evenings, finish with Evening Veil Oil. Let the botanicals work while you sleep.",
  },
] as const;

const LeafIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
    <path
      d="M5 19C5 11 9 4 19 4c0 10-6 15-14 15Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M5 19c3-5 7-9 11-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DropIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
    <path
      d="M12 3.5c3.5 4.5 6 7.8 6 11a6 6 0 1 1-12 0c0-3.2 2.5-6.5 6-11Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M9.5 14.5a2.6 2.6 0 0 0 2 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default function AureliaBotanicaPage() {
  return (
    <div className="min-h-screen bg-[#faf6ef] text-[#3c4636] antialiased">
      {/* ===== Nav ===== */}
      <header className="relative z-20">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
          <a href="#" className={`${serif.className} text-2xl font-semibold tracking-wide`}>
            Aurelia <span className="italic text-[#7d9270]">Botanica</span>
          </a>
          <div className="hidden items-center gap-9 text-sm tracking-widest uppercase text-[#5c6852] md:flex">
            <a href="#values" className="transition-colors hover:text-[#3c4636]">Philosophy</a>
            <a href="#collection" className="transition-colors hover:text-[#3c4636]">Collection</a>
            <a href="#ritual" className="transition-colors hover:text-[#3c4636]">The Ritual</a>
            <a href="#journal" className="transition-colors hover:text-[#3c4636]">Journal</a>
          </div>
          <a
            href="#newsletter"
            className="rounded-full border border-[#7d9270]/40 bg-white/60 px-5 py-2.5 text-sm tracking-wide text-[#5c6852] backdrop-blur transition-colors hover:bg-[#7d9270] hover:text-white"
          >
            Join the Garden
          </a>
        </nav>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        {/* organic blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[34rem] w-[34rem] rounded-full bg-[#dce8d2] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-[#f5ddd3] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#f0e6cf] opacity-60 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 pt-16 pb-24 md:grid-cols-2 md:pt-24 md:pb-32">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#7d9270]/10 px-4 py-1.5 text-xs tracking-[0.2em] uppercase text-[#5c6852]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7d9270]" />
              Certified organic · Small batch
            </p>
            <h1 className={`${serif.className} text-5xl leading-[1.08] font-medium md:text-7xl`}>
              Skincare that{" "}
              <span className="italic text-[#7d9270]">remembers</span> the garden it came from
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[#5c6852]">
              Cold-pressed botanicals, harvested by hand and bottled within days. Aurelia Botanica is a quiet ritual
              for skin that wants less — and glows with more.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href="#collection"
                className="rounded-full bg-[#7d9270] px-8 py-4 text-sm font-medium tracking-widest text-white uppercase shadow-lg shadow-[#7d9270]/25 transition-all hover:bg-[#6b7f5f] hover:shadow-xl"
              >
                Explore the Collection
              </a>
              <a href="#ritual" className="group text-sm tracking-widest text-[#5c6852] uppercase">
                Discover the ritual{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
            <div className="mt-12 flex items-center gap-8 text-xs tracking-widest text-[#8a9480] uppercase">
              <span>Cruelty-free</span>
              <span className="h-1 w-1 rounded-full bg-[#c5cdbb]" />
              <span>Vegan</span>
              <span className="h-1 w-1 rounded-full bg-[#c5cdbb]" />
              <span>Glass packaging</span>
            </div>
          </div>

          {/* hero visual */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
            <div className="absolute inset-0 rounded-[48%_52%_55%_45%/55%_45%_55%_45%] bg-gradient-to-br from-[#e7efdd] via-[#f2e6d8] to-[#f6ddd3] shadow-2xl shadow-[#d9c8b8]/40" />
            <div className="absolute inset-6 rounded-[52%_48%_45%_55%/45%_55%_45%_55%] border border-white/70 bg-white/30 backdrop-blur-sm" />
            {/* bottle silhouette */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="h-10 w-7 rounded-t-md bg-[#3c4636]/80" />
                <div className="h-44 w-24 rounded-[2rem] bg-gradient-to-b from-[#aebf9d] to-[#7d9270] shadow-inner" />
                <p className={`${serif.className} mt-5 text-lg italic text-[#5c6852]`}>Dawn Dew Serum</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-8 rounded-2xl bg-white/80 px-5 py-4 shadow-lg backdrop-blur">
              <p className={`${serif.className} text-2xl font-semibold text-[#7d9270]`}>98%</p>
              <p className="text-xs tracking-wide text-[#5c6852]">naturally derived</p>
            </div>
            <div className="absolute -top-3 -right-6 rounded-2xl bg-white/80 px-5 py-4 shadow-lg backdrop-blur">
              <p className={`${serif.className} text-2xl font-semibold text-[#c98b76]`}>72h</p>
              <p className="text-xs tracking-wide text-[#5c6852]">field to bottle</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Values trio ===== */}
      <section id="values" className="relative bg-white/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs tracking-[0.25em] text-[#8a9480] uppercase">Our philosophy</p>
          <h2 className={`${serif.className} mx-auto mt-4 max-w-2xl text-center text-4xl font-medium md:text-5xl`}>
            Three quiet promises, kept in every bottle
          </h2>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              {
                icon: <LeafIcon />,
                title: "Grown, not made",
                desc: "Every botanical is raised on our regenerative farm in the Loire Valley — no synthetics, no shortcuts, no compromise.",
              },
              {
                icon: <DropIcon />,
                title: "Cold-pressed purity",
                desc: "We press petals and seeds below 35°C, preserving the delicate enzymes and vitamins your skin actually recognizes.",
              },
              {
                icon: <SunIcon />,
                title: "Light-touch formulas",
                desc: "Fewer than twelve ingredients per formula. Skin thrives on simplicity, and so does our conscience.",
              },
            ].map((value) => (
              <div
                key={value.title}
                className="group rounded-[2.5rem] border border-[#e7e2d4] bg-[#faf6ef] p-10 text-center transition-shadow hover:shadow-xl hover:shadow-[#d9c8b8]/20"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7d9270]/10 text-[#7d9270] transition-colors group-hover:bg-[#7d9270] group-hover:text-white">
                  {value.icon}
                </div>
                <h3 className={`${serif.className} mt-6 text-2xl font-semibold`}>{value.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#5c6852]">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Product showcase ===== */}
      <section id="collection" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute top-1/3 -left-28 h-80 w-80 rounded-full bg-[#f5ddd3] opacity-50 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.25em] text-[#8a9480] uppercase">The collection</p>
              <h2 className={`${serif.className} mt-4 max-w-xl text-4xl font-medium md:text-5xl`}>
                Three rituals, <span className="italic text-[#7d9270]">one luminous routine</span>
              </h2>
            </div>
            <a href="#newsletter" className="text-sm tracking-widest text-[#5c6852] uppercase underline decoration-[#7d9270]/40 underline-offset-8 hover:text-[#3c4636]">
              View all botanicals →
            </a>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.name}
                className="group overflow-hidden rounded-[2.5rem] border border-[#e7e2d4] bg-white/70 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#d9c8b8]/30"
              >
                {/* product "shot" */}
                <div className={`relative flex aspect-square items-center justify-center bg-gradient-to-br ${product.gradient}`}>
                  <div className={`absolute h-48 w-48 rounded-[55%_45%_50%_50%/50%_55%_45%_50%] ${product.blob} blur-2xl`} />
                  <div className="relative flex flex-col items-center">
                    <div className="h-7 w-5 rounded-t bg-[#3c4636]/75" />
                    <div className="h-28 w-16 rounded-[1.4rem] bg-white/70 shadow-lg backdrop-blur-sm ring-1 ring-white/80" />
                  </div>
                  <span className="absolute top-5 left-5 rounded-full bg-white/80 px-3 py-1 text-[10px] tracking-[0.2em] text-[#5c6852] uppercase backdrop-blur">
                    {product.note}
                  </span>
                </div>
                <div className="p-8">
                  <div className="flex items-baseline justify-between">
                    <h3 className={`${serif.className} text-2xl font-semibold`}>{product.name}</h3>
                    <span className={`${serif.className} text-xl text-[#7d9270]`}>{product.price}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#5c6852]">{product.desc}</p>
                  <button
                    type="button"
                    className="mt-6 w-full rounded-full border border-[#7d9270]/40 py-3 text-xs font-medium tracking-[0.2em] text-[#5c6852] uppercase transition-colors group-hover:border-[#7d9270] group-hover:bg-[#7d9270] group-hover:text-white"
                  >
                    Add to Ritual
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Ritual steps ===== */}
      <section id="ritual" className="relative overflow-hidden bg-[#39432f] py-24 text-[#f2efe5]">
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-[#7d9270]/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-[#c98b76]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-xs tracking-[0.25em] text-[#aebf9d] uppercase">The evening ritual</p>
          <h2 className={`${serif.className} mt-4 max-w-2xl text-4xl font-medium md:text-5xl`}>
            Four minutes that feel like a <span className="italic text-[#d9c4a0]">walk through the meadow</span>
          </h2>
          <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {ritualSteps.map((item) => (
              <div key={item.step} className="relative">
                <span className={`${serif.className} text-5xl font-medium text-[#aebf9d]/50`}>{item.step}</span>
                <h3 className={`${serif.className} mt-4 text-2xl font-semibold`}>{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#cfd6c2]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonial ===== */}
      <section id="journal" className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute top-10 right-10 h-64 w-64 rounded-full bg-[#dce8d2] opacity-60 blur-3xl" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5ddd3] text-[#c98b76]">
            <span className={`${serif.className} text-3xl leading-none`}>”</span>
          </div>
          <blockquote className={`${serif.className} mt-8 text-3xl leading-snug font-medium italic md:text-4xl`}>
            “I have spent fifteen years testing serums for a living. Aurelia Botanica is the first brand that made me
            put down my notebook and simply enjoy the moment.”
          </blockquote>
          <p className="mt-8 text-sm tracking-[0.2em] text-[#5c6852] uppercase">Margaux Delacroix</p>
          <p className="mt-1 text-xs tracking-wide text-[#8a9480]">Beauty Editor, La Belle Saison</p>
          <div className="mt-6 flex items-center justify-center gap-1 text-[#c9a86d]" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M10 1.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L10 14.2 4.9 17l1.1-5.6L1.8 7.5l5.7-.7L10 1.6Z" />
              </svg>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Newsletter band ===== */}
      <section id="newsletter" className="px-6 pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#e7efdd] via-[#f2e6d8] to-[#f6ddd3] px-8 py-16 text-center shadow-xl shadow-[#d9c8b8]/30 md:px-16">
          <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-[#7d9270]/20 blur-2xl" />
          <p className="relative text-xs tracking-[0.25em] text-[#5c6852] uppercase">Letters from the garden 🌿</p>
          <h2 className={`${serif.className} relative mx-auto mt-4 max-w-xl text-4xl font-medium md:text-5xl`}>
            Seasonal recipes, harvest notes & 10% off your first ritual
          </h2>
          <form className="relative mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full flex-1 rounded-full border border-white/80 bg-white/80 px-6 py-4 text-sm text-[#3c4636] placeholder-[#8a9480] backdrop-blur outline-none focus:border-[#7d9270] focus:ring-2 focus:ring-[#7d9270]/30"
            />
            <button
              type="submit"
              className="rounded-full bg-[#3c4636] px-8 py-4 text-xs font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-[#7d9270]"
            >
              Subscribe
            </button>
          </form>
          <p className="relative mt-5 text-xs text-[#8a9480]">One letter a month. Unsubscribe anytime — no hard feelings.</p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-[#e7e2d4] bg-white/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className={`${serif.className} text-2xl font-semibold`}>
              Aurelia <span className="italic text-[#7d9270]">Botanica</span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#5c6852]">
              Organic skincare grown, pressed, and bottled on our regenerative farm in the Loire Valley. Gentle on
              skin, gentler on the earth.
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-[#8a9480] uppercase">Explore</p>
            <ul className="mt-4 space-y-3 text-sm text-[#5c6852]">
              <li><a href="#collection" className="hover:text-[#3c4636]">The Collection</a></li>
              <li><a href="#ritual" className="hover:text-[#3c4636]">The Ritual</a></li>
              <li><a href="#values" className="hover:text-[#3c4636]">Our Philosophy</a></li>
              <li><a href="#journal" className="hover:text-[#3c4636]">Journal</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-[#8a9480] uppercase">Care</p>
            <ul className="mt-4 space-y-3 text-sm text-[#5c6852]">
              <li><a href="#" className="hover:text-[#3c4636]">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-[#3c4636]">Ingredient Glossary</a></li>
              <li><a href="#" className="hover:text-[#3c4636]">Refill Program</a></li>
              <li><a href="#" className="hover:text-[#3c4636]">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#e7e2d4]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-[#8a9480]">
            <p>© 2026 Aurelia Botanica. Grown with intention.</p>
            <p className="tracking-widest uppercase">Certified Organic · B Corp · Carbon Neutral</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
