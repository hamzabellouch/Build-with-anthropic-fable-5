import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Maison Vautrin — Haute Horlogerie depuis 1887",
  description:
    "Maison Vautrin crafts mechanical timepieces in the Vallée de Joux, Switzerland. Heritage, precision, and quiet luxury since 1887.",
};

const GOLD = "#c9a227";

function WatchFace({ size = 420 }: { size?: number }) {
  const marks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 420 420"
      width={size}
      height={size}
      role="img"
      aria-label="Maison Vautrin watch face"
      className="max-w-full h-auto"
    >
      {/* outer case */}
      <circle cx="210" cy="210" r="206" fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.9" />
      <circle cx="210" cy="210" r="196" fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.4" />
      <circle cx="210" cy="210" r="188" fill="#0a0a09" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* minute track */}
      {marks.map((i) => {
        const major = i % 5 === 0;
        const angle = (i * 6 * Math.PI) / 180;
        const r1 = major ? 168 : 176;
        const r2 = 182;
        const x1 = 210 + r1 * Math.sin(angle);
        const y1 = 210 - r1 * Math.cos(angle);
        const x2 = 210 + r2 * Math.sin(angle);
        const y2 = 210 - r2 * Math.cos(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={major ? GOLD : "rgba(255,255,255,0.25)"}
            strokeWidth={major ? 1.5 : 0.5}
          />
        );
      })}
      {/* inner hairline */}
      <circle cx="210" cy="210" r="150" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
      {/* small seconds sub-dial */}
      <circle cx="210" cy="290" r="34" fill="none" stroke="rgba(201,162,39,0.45)" strokeWidth="0.75" />
      <line x1="210" y1="290" x2="222" y2="268" stroke={GOLD} strokeWidth="1" />
      <circle cx="210" cy="290" r="2" fill={GOLD} />
      {/* wordmark */}
      <text
        x="210"
        y="138"
        textAnchor="middle"
        fill={GOLD}
        fontSize="15"
        letterSpacing="6"
        fontFamily="serif"
      >
        VAUTRIN
      </text>
      <text
        x="210"
        y="158"
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize="7"
        letterSpacing="3"
        fontFamily="serif"
      >
        GENÈVE · 1887
      </text>
      {/* hour hand — pointing toward 10 */}
      <line x1="210" y1="210" x2="156" y2="166" stroke="#e8d9a0" strokeWidth="3.5" strokeLinecap="round" />
      {/* minute hand — pointing toward 2 */}
      <line x1="210" y1="210" x2="282" y2="92" stroke="#e8d9a0" strokeWidth="2" strokeLinecap="round" />
      {/* centre */}
      <circle cx="210" cy="210" r="5" fill={GOLD} />
      <circle cx="210" cy="210" r="1.8" fill="#0a0a09" />
    </svg>
  );
}

const collection = [
  {
    name: "Calibre Souverain",
    line: "Réf. VS-1887",
    desc: "Hand-wound, 41 mm rose gold. A 96-hour reserve finished to Geneva Seal standards.",
    price: "CHF 24,800",
    accent: "from-[#c9a227]/25 via-[#0d0c09] to-black",
  },
  {
    name: "Heure Nocturne",
    line: "Réf. VN-1923",
    desc: "Grand feu enamel dial in lacquer black, moonphase complication accurate to 122 years.",
    price: "CHF 38,400",
    accent: "from-[#3a3526]/40 via-[#0a0a09] to-black",
  },
  {
    name: "Tourbillon Léman",
    line: "Réf. VT-1956",
    desc: "One-minute flying tourbillon, openworked bridges hand-bevelled over eleven days.",
    price: "CHF 96,200",
    accent: "from-[#c9a227]/15 via-[#15120a] to-black",
  },
];

const details = [
  {
    n: "01",
    title: "Hand-finished movements",
    body: "Every bridge is anglaged, every screw black-polished. A single calibre passes through forty-two pairs of hands before it is cased.",
  },
  {
    n: "02",
    title: "Grand feu enamel",
    body: "Dials are fired at 820°C up to twelve times. One in three survives the kiln; the rest are broken by the enameller herself.",
  },
  {
    n: "03",
    title: "The 1,000-hour rule",
    body: "No Vautrin leaves the manufacture before a thousand hours of regulation across six positions and three temperatures.",
  },
  {
    n: "04",
    title: "Archived for a century",
    body: "Each movement number is entered by fountain pen into the Grand Registre, as it has been since 1887.",
  },
];

export default function MaisonVautrinPage() {
  return (
    <div className={`${serif.className} min-h-screen bg-[#070706] text-[#ece7da] antialiased`}>
      {/* ───────── Nav ───────── */}
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-7xl items-baseline justify-between px-6 py-6 md:px-10">
          <a href="#" className="text-xl tracking-[0.35em] text-[#c9a227]">
            MAISON&nbsp;VAUTRIN
          </a>
          <ul className="hidden items-baseline gap-10 text-[11px] uppercase tracking-[0.3em] text-white/50 md:flex">
            <li><a href="#collection" className="transition-colors hover:text-[#c9a227]">Collection</a></li>
            <li><a href="#heritage" className="transition-colors hover:text-[#c9a227]">Heritage</a></li>
            <li><a href="#craft" className="transition-colors hover:text-[#c9a227]">Craft</a></li>
            <li><a href="#boutique" className="transition-colors hover:text-[#c9a227]">Boutiques</a></li>
          </ul>
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">Genève — 1887</span>
        </nav>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-24 pt-20 md:grid-cols-12 md:px-10 md:pt-28">
          <div className="md:col-span-7">
            <p className="mb-8 text-[11px] uppercase tracking-[0.45em] text-[#c9a227]">
              Haute Horlogerie — Vallée de Joux
            </p>
            <h1 className="text-6xl font-light leading-[0.95] md:text-[7.5rem]">
              Time,
              <br />
              <em className="font-light italic text-[#c9a227]">measured</em>
              <br />
              in centuries.
            </h1>
            <p className="mt-10 max-w-md text-lg font-light leading-relaxed text-white/60">
              Since 1887, four generations of the Vautrin family have built
              mechanical movements by hand in a single atelier above Lac Léman.
              Fewer than six hundred watches leave it each year.
            </p>
            <div className="mt-12 flex items-center gap-8">
              <a
                href="#collection"
                className="border border-[#c9a227] px-8 py-3 text-[11px] uppercase tracking-[0.35em] text-[#c9a227] transition-colors hover:bg-[#c9a227] hover:text-black"
              >
                The Collection
              </a>
              <a
                href="#boutique"
                className="text-[11px] uppercase tracking-[0.35em] text-white/50 underline decoration-white/20 underline-offset-8 transition-colors hover:text-white"
              >
                Request an audience
              </a>
            </div>
          </div>
          <div className="relative flex items-center justify-center md:col-span-5">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.10),transparent_65%)]" />
            <WatchFace />
          </div>
        </div>
        <p className="pointer-events-none absolute -bottom-10 right-0 select-none text-[12rem] font-light italic leading-none text-white/[0.03] md:text-[18rem]">
          1887
        </p>
      </section>

      {/* ───────── Heritage / pull-quote ───────── */}
      <section id="heritage" className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-28 md:grid-cols-12 md:px-10">
          <div className="md:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.45em] text-[#c9a227]">I. — Heritage</p>
            <div className="mt-6 h-px w-16 bg-[#c9a227]/50" />
          </div>
          <div className="md:col-span-9">
            <blockquote className="text-4xl font-light italic leading-tight text-white/90 md:text-6xl">
              “A watch is not finished when there is nothing left to add — it is
              finished when the <span className="not-italic text-[#c9a227]">fourth generation</span>{" "}
              would sign its name beneath yours.”
            </blockquote>
            <p className="mt-8 text-[11px] uppercase tracking-[0.35em] text-white/40">
              — Élise Vautrin, Maître Horlogère
            </p>
            <div className="mt-16 grid grid-cols-1 gap-10 border-t border-white/10 pt-12 md:grid-cols-3">
              <div>
                <p className="text-5xl font-light text-[#c9a227]">139</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/50">Years, one atelier</p>
              </div>
              <div>
                <p className="text-5xl font-light text-[#c9a227]">600</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/50">Watches per annum</p>
              </div>
              <div>
                <p className="text-5xl font-light text-[#c9a227]">42</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/50">Hands per calibre</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Collection ───────── */}
      <section id="collection" className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-28 md:px-10">
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-[#c9a227]">II. — The Collection</p>
              <h2 className="mt-4 text-5xl font-light md:text-6xl">Three expressions of patience</h2>
            </div>
            <p className="max-w-xs text-sm font-light leading-relaxed text-white/50">
              Each reference is produced in a numbered series and delivered, on
              average, eleven months after commission.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-3">
            {collection.map((w) => (
              <article key={w.name} className="group bg-[#070706] p-8 md:p-10">
                <div
                  className={`relative mb-10 flex aspect-[4/5] items-center justify-center bg-gradient-to-b ${w.accent}`}
                >
                  <div className="absolute inset-0 border border-white/5" />
                  <WatchFace size={200} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">{w.line}</p>
                <h3 className="mt-3 text-3xl font-light transition-colors group-hover:text-[#c9a227]">
                  {w.name}
                </h3>
                <p className="mt-4 text-sm font-light leading-relaxed text-white/55">{w.desc}</p>
                <div className="mt-8 flex items-baseline justify-between border-t border-white/10 pt-6">
                  <span className="text-lg text-[#c9a227]">{w.price}</span>
                  <a
                    href="#boutique"
                    className="text-[10px] uppercase tracking-[0.3em] text-white/50 transition-colors hover:text-[#c9a227]"
                  >
                    Enquire →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Craft details ───────── */}
      <section id="craft" className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-28 md:grid-cols-12 md:px-10">
          <div className="md:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.45em] text-[#c9a227]">III. — Craft</p>
            <h2 className="mt-4 text-5xl font-light leading-tight">
              The slow
              <br />
              <em className="italic text-[#c9a227]">disciplines</em>
            </h2>
            <p className="mt-8 max-w-xs text-sm font-light leading-relaxed text-white/50">
              Nothing here is efficient, and nothing is accidental. These are
              the four covenants our watchmakers keep.
            </p>
          </div>
          <div className="md:col-span-8">
            <ul>
              {details.map((d) => (
                <li
                  key={d.n}
                  className="grid grid-cols-12 gap-6 border-t border-white/10 py-10 first:border-t-0 first:pt-0"
                >
                  <span className="col-span-2 text-sm text-[#c9a227]/70 md:col-span-1">{d.n}</span>
                  <h3 className="col-span-10 text-2xl font-light md:col-span-4">{d.title}</h3>
                  <p className="col-span-12 text-sm font-light leading-relaxed text-white/55 md:col-span-7">
                    {d.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Boutique band ───────── */}
      <section id="boutique" className="border-b border-white/10 bg-[#0b0a08]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 md:grid-cols-12 md:px-10">
          <div className="md:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.45em] text-[#c9a227]">IV. — Boutiques</p>
            <h2 className="mt-4 text-5xl font-light leading-tight md:text-6xl">
              By appointment,
              <br />
              <em className="italic text-[#c9a227]">always.</em>
            </h2>
            <p className="mt-8 max-w-md text-sm font-light leading-relaxed text-white/55">
              Our salons in Geneva, Paris, and Tokyo receive no more than four
              guests each day. An hour with a watchmaker, a glass of Chasselas,
              and time enough to decide nothing at all.
            </p>
          </div>
          <div className="md:col-span-5">
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {[
                ["Genève", "Rue du Rhône 17", "+41 22 819 1887"],
                ["Paris", "Place Vendôme 9", "+33 1 42 61 18 87"],
                ["Tokyo", "Ginza Namiki-dōri 6", "+81 3 6263 1887"],
              ].map(([city, addr, tel]) => (
                <li key={city} className="flex items-baseline justify-between py-5">
                  <span className="text-xl text-[#c9a227]">{city}</span>
                  <span className="text-sm font-light text-white/50">{addr}</span>
                  <span className="hidden text-xs tracking-widest text-white/35 lg:inline">{tel}</span>
                </li>
              ))}
            </ul>
            <a
              href="mailto:rendezvous@maisonvautrin.ch"
              className="mt-10 inline-block w-full border border-[#c9a227] px-8 py-4 text-center text-[11px] uppercase tracking-[0.35em] text-[#c9a227] transition-colors hover:bg-[#c9a227] hover:text-black"
            >
              Request a private appointment
            </a>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer>
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-2xl tracking-[0.35em] text-[#c9a227]">MAISON&nbsp;VAUTRIN</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-white/40">
                Manufacture d&apos;Horlogerie — Le Brassus, Suisse
              </p>
            </div>
            <ul className="flex flex-wrap gap-8 text-[11px] uppercase tracking-[0.3em] text-white/45">
              <li><a href="#collection" className="transition-colors hover:text-[#c9a227]">Collection</a></li>
              <li><a href="#heritage" className="transition-colors hover:text-[#c9a227]">Heritage</a></li>
              <li><a href="#craft" className="transition-colors hover:text-[#c9a227]">Craft</a></li>
              <li><a href="#boutique" className="transition-colors hover:text-[#c9a227]">Boutiques</a></li>
            </ul>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-[10px] uppercase tracking-[0.25em] text-white/30 md:flex-row md:justify-between">
            <p>© 1887–2026 Maison Vautrin SA. All rights reserved.</p>
            <p>Crafted without haste, in the Vallée de Joux.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
