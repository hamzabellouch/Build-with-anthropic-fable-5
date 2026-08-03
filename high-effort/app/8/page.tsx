import type { Metadata } from "next";
import { Alfa_Slab_One, Bricolage_Grotesque } from "next/font/google";

const slab = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });
const grotesque = Bricolage_Grotesque({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ember & Oak Roasting Co. — Small-Batch Coffee, Roasted Slow",
  description:
    "Small-batch coffee roasted over oak in Bell Hollow since 1972. Honest beans, patient fire, and a mug that tastes like home.",
};

/* ---------- Inline SVG bits ---------- */

function StampBadge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <path
          id="stamp-arc-top"
          d="M 100,100 m -72,0 a 72,72 0 1,1 144,0"
        />
        <path
          id="stamp-arc-bottom"
          d="M 100,100 m -72,0 a 72,72 0 1,0 144,0"
        />
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" />
      <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="2" />
      <text fontSize="17" letterSpacing="4" fill="currentColor" fontWeight="bold">
        <textPath href="#stamp-arc-top" startOffset="50%" textAnchor="middle">
          EMBER &amp; OAK
        </textPath>
      </text>
      <text fontSize="14" letterSpacing="5" fill="currentColor" fontWeight="bold">
        <textPath href="#stamp-arc-bottom" startOffset="50%" textAnchor="middle">
          BELL HOLLOW
        </textPath>
      </text>
      {/* Center flame-over-bean mark */}
      <path
        d="M100 66c6 8 12 13 12 21a12 12 0 0 1-24 0c0-8 6-13 12-21z"
        fill="currentColor"
      />
      <text x="100" y="118" textAnchor="middle" fontSize="15" fontWeight="bold" letterSpacing="2" fill="currentColor">
        EST. 1972
      </text>
      <circle cx="68" cy="100" r="3" fill="currentColor" />
      <circle cx="132" cy="100" r="3" fill="currentColor" />
    </svg>
  );
}

function CoffeeCup({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 18h26v12a10 10 0 0 1-10 10H18a10 10 0 0 1-10-10V18z" />
      <path d="M34 20h4a5 5 0 0 1 0 10h-4" />
      <path d="M15 12c0-3 3-3 3-6M23 12c0-3 3-3 3-6" />
      <path d="M6 44h32" />
    </svg>
  );
}

function Bean({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2C7 2 3.5 6.5 3.5 12S7 22 12 22s8.5-4.5 8.5-10S17 2 12 2zm0 2.2c-1.6 2.4-1.2 4.3-.2 6.6 1 2.4 1.5 4.7-.3 7-2.9-.9-5.8-3.4-5.8-5.8 0-4.3 2.7-7.4 6.3-7.8zm2.4.7c2.5 1.2 4.1 3.9 4.1 7.1 0 4.2-2.6 7.2-6 7.8 1.4-2.5 1-4.7 0-7-.9-2.2-1.4-4.4 1.9-7.9z" />
    </svg>
  );
}

function FlameIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 6c4 7 12 11 12 21a12 12 0 0 1-24 0C12 17 20 13 24 6z" />
      <path d="M24 24c2 3 5 5 5 9a5 5 0 0 1-10 0c0-4 3-6 5-9z" />
    </svg>
  );
}

function GlobeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="24" cy="24" r="18" />
      <path d="M6 24h36M24 6c5 5 7 11 7 18s-2 13-7 18c-5-5-7-11-7-18s2-13 7-18z" />
    </svg>
  );
}

function TruckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h26v22H4zM30 20h8l6 7v7h-14" />
      <circle cx="12" cy="36" r="4" />
      <circle cx="36" cy="36" r="4" />
    </svg>
  );
}

function RoastDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Roast level ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full border border-[#3e2616] ${
            i <= level ? "bg-[#3e2616]" : "bg-transparent"
          }`}
        />
      ))}
    </span>
  );
}

/* ---------- Data ---------- */

const roasts = [
  {
    name: "Morning Bell",
    style: "Light Roast · Washed",
    origin: "Huila, Colombia",
    notes: ["Honeycrisp apple", "Wildflower honey", "Soft cocoa"],
    level: 2,
    price: "$17",
    accent: "bg-[#c98a3d]",
  },
  {
    name: "Hearthside",
    style: "Medium Roast · Natural",
    origin: "Sidama, Ethiopia",
    notes: ["Stewed cherry", "Brown butter", "Graham cracker"],
    level: 3,
    price: "$18",
    accent: "bg-[#a8542c]",
  },
  {
    name: "Old Stove",
    style: "Dark Roast · Blend",
    origin: "Sumatra & Brazil",
    notes: ["Molasses", "Toasted walnut", "Pipe smoke"],
    level: 5,
    price: "$16",
    accent: "bg-[#5b3320]",
  },
];

const steps = [
  {
    icon: GlobeIcon,
    title: "Sourced by Handshake",
    copy: "We buy from eleven farming families we've known for decades — some since Pop ran the shop. Fair prices, no middlemen, lots of letters in the mail.",
  },
  {
    icon: FlameIcon,
    title: "Roasted Over Oak",
    copy: "Our 1968 cast-iron drum roaster runs on seasoned oak. Small twelve-pound batches, turned slow, pulled by ear and nose — never by timer alone.",
  },
  {
    icon: TruckIcon,
    title: "Shipped Same Week",
    copy: "Beans rest two days, get bagged by hand, stamped with the roast date, and ride out Thursday morning. Fresh enough to bloom like a soda fizz.",
  },
];

const quotes = [
  {
    quote:
      "Opening a bag of Hearthside smells exactly like my grandmother's kitchen in October. I haven't bought grocery-store coffee since '21.",
    name: "Marjorie T.",
    place: "Cedar Falls, IA",
  },
  {
    quote:
      "I toured the roastery on a whim and left with four bags and a new Saturday ritual. You can hear the beans crackle from the parking lot.",
    name: "Dele O.",
    place: "Asheville, NC",
  },
  {
    quote:
      "Old Stove is the only dark roast I've found that's bold without tasting burnt. My percolator and I are very happy.",
    name: "Ray & Lupe S.",
    place: "Tucson, AZ",
  },
];

/* ---------- Page ---------- */

export default function Page() {
  return (
    <div
      className={`${grotesque.className} min-h-screen bg-[#f5ead6] text-[#3e2616] antialiased [background-image:radial-gradient(rgba(62,38,22,0.05)_1px,transparent_1px),linear-gradient(rgba(201,138,61,0.05),transparent_40%)] [background-size:22px_22px,100%_100%]`}
    >
      {/* Nav */}
      <header className="border-b-4 border-double border-[#3e2616]/70 bg-[#f5ead6]/90 backdrop-blur-sm sticky top-0 z-50">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-3">
            <Bean className="h-7 w-7 text-[#a8542c]" />
            <span className={`${slab.className} text-lg tracking-wide`}>
              Ember <span className="text-[#a8542c]">&amp;</span> Oak
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-semibold uppercase tracking-[0.18em] md:flex">
            <a href="#roasts" className="hover:text-[#a8542c]">The Roasts</a>
            <a href="#process" className="hover:text-[#a8542c]">Our Process</a>
            <a href="#club" className="hover:text-[#a8542c]">Bean Club</a>
            <a href="#visit" className="hover:text-[#a8542c]">Visit</a>
          </div>
          <a
            href="#club"
            className="rounded-full border-2 border-[#3e2616] bg-[#a8542c] px-5 py-2 text-sm font-bold uppercase tracking-wider text-[#f5ead6] shadow-[3px_3px_0_#3e2616] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#3e2616]"
          >
            Shop Beans
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b-4 border-double border-[#3e2616]/70">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr] md:py-28">
          <div>
            <p className="mb-4 inline-block rounded-sm border border-[#3e2616] px-3 py-1 text-xs font-bold uppercase tracking-[0.3em]">
              Bell Hollow, North Carolina
            </p>
            <h1 className={`${slab.className} text-5xl leading-[1.05] md:text-7xl`}>
              Roasted slow.
              <br />
              <span className="text-[#a8542c]">Poured warm.</span>
              <br />
              Since 1972.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#3e2616]/85">
              Three generations of one stubborn family, one wood-fired drum
              roaster, and twelve-pound batches turned until they sing. We make
              coffee the way the valley remembers it — patient, smoky-sweet,
              and never in a hurry.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#roasts"
                className="rounded-sm border-2 border-[#3e2616] bg-[#3e2616] px-7 py-3 font-bold uppercase tracking-wider text-[#f5ead6] shadow-[4px_4px_0_#a8542c] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#a8542c]"
              >
                Browse the Lineup
              </a>
              <a
                href="#process"
                className="rounded-sm border-2 border-[#3e2616] px-7 py-3 font-bold uppercase tracking-wider transition hover:bg-[#3e2616]/5"
              >
                How We Roast
              </a>
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#3e2616]/60">
              Free shipping over $35 · Roast date on every bag
            </p>
          </div>
          <div className="relative mx-auto flex max-w-xs items-center justify-center md:max-w-sm">
            <div className="absolute inset-0 -rotate-6 rounded-full bg-[#c98a3d]/20" />
            <StampBadge className="relative w-64 rotate-[-8deg] text-[#a8542c] drop-shadow-[2px_3px_0_rgba(62,38,22,0.25)] md:w-80" />
          </div>
        </div>
      </section>

      {/* Roast lineup */}
      <section id="roasts" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#a8542c]">The Lineup</p>
          <h2 className={`${slab.className} mt-2 text-4xl md:text-5xl`}>Three honest roasts</h2>
          <p className="mx-auto mt-4 max-w-xl text-[#3e2616]/80">
            No seasonal gimmicks, no forty-bean wall of choices. Just three
            roasts we&apos;d serve our own mother — and do, every Sunday.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {roasts.map((r) => (
            <article
              key={r.name}
              className="relative flex flex-col border-2 border-[#3e2616] bg-[#fdf6e7] p-7 shadow-[5px_5px_0_rgba(62,38,22,0.8)] [mask-image:radial-gradient(circle_at_left_center,transparent_7px,black_7.5px),radial-gradient(circle_at_right_center,transparent_7px,black_7.5px)] [mask-composite:intersect]"
            >
              <div className={`mx-auto -mt-1 mb-5 h-2 w-24 rounded-b-full ${r.accent}`} />
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-[#a8542c]">
                {r.style}
              </p>
              <h3 className={`${slab.className} mt-2 text-center text-3xl`}>{r.name}</h3>
              <p className="mt-1 text-center text-sm italic text-[#3e2616]/70">{r.origin}</p>
              <div className="my-5 border-t border-dashed border-[#3e2616]/50" />
              <ul className="space-y-2 text-sm">
                {r.notes.map((n) => (
                  <li key={n} className="flex items-center gap-2.5">
                    <Bean className="h-3.5 w-3.5 shrink-0 text-[#a8542c]" />
                    {n}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between text-sm font-semibold">
                <span className="uppercase tracking-wider text-[#3e2616]/70">Roast</span>
                <RoastDots level={r.level} />
              </div>
              <div className="mt-auto pt-6">
                <a
                  href="#club"
                  className="block rounded-sm border-2 border-[#3e2616] bg-[#3e2616] py-2.5 text-center font-bold uppercase tracking-wider text-[#f5ead6] transition hover:bg-[#a8542c]"
                >
                  {r.price} · 12 oz bag
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Process */}
      <section id="process" className="border-y-4 border-double border-[#3e2616]/70 bg-[#3e2616] text-[#f5ead6]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#c98a3d]">Bean to Doorstep</p>
            <h2 className={`${slab.className} mt-2 text-4xl md:text-5xl`}>The long way round</h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-sm border border-[#f5ead6]/30 bg-[#f5ead6]/5 p-8 text-center">
                <span className={`${slab.className} absolute -top-5 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#f5ead6] bg-[#a8542c] px-4 py-1 text-sm`}>
                  No. {i + 1}
                </span>
                <s.icon className="mx-auto mt-2 h-12 w-12 text-[#c98a3d]" />
                <h3 className={`${slab.className} mt-5 text-xl`}>{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#f5ead6]/80">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription band */}
      <section id="club" className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-sm border-2 border-[#3e2616] bg-[#c98a3d]/15 shadow-[6px_6px_0_rgba(62,38,22,0.8)]">
          <div className="grid items-center gap-10 p-8 md:grid-cols-[1fr_auto] md:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#a8542c]">The Bean Club</p>
              <h2 className={`${slab.className} mt-2 text-4xl md:text-5xl`}>
                Fresh beans on your porch, every other Thursday
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-[#3e2616]/85">
                Pick your roast or let us surprise you. Every delivery includes
                brew notes scribbled by whoever pulled the batch, and a punch
                card — ten deliveries earns you a free roastery tour and a tin
                mug with your name stamped on it.
              </p>
              <ul className="mt-6 grid gap-2 text-sm font-semibold sm:grid-cols-2">
                <li className="flex items-center gap-2"><CoffeeCup className="h-4 w-4 text-[#a8542c]" /> Pause or swap anytime</li>
                <li className="flex items-center gap-2"><CoffeeCup className="h-4 w-4 text-[#a8542c]" /> Roasted within 48 hours of shipping</li>
                <li className="flex items-center gap-2"><CoffeeCup className="h-4 w-4 text-[#a8542c]" /> Free shipping, always</li>
                <li className="flex items-center gap-2"><CoffeeCup className="h-4 w-4 text-[#a8542c]" /> First bag of grounds for the compost, on us</li>
              </ul>
            </div>
            <div className="mx-auto w-full max-w-xs rounded-sm border-2 border-[#3e2616] bg-[#fdf6e7] p-7 text-center shadow-[4px_4px_0_#3e2616]">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a8542c]">Member Price</p>
              <p className={`${slab.className} mt-3 text-6xl`}>
                $14<span className="text-2xl">/bag</span>
              </p>
              <p className="mt-2 text-sm text-[#3e2616]/70">12 oz · every two weeks · cancel whenever</p>
              <a
                href="#"
                className="mt-6 block rounded-sm border-2 border-[#3e2616] bg-[#a8542c] py-3 font-bold uppercase tracking-wider text-[#f5ead6] transition hover:bg-[#3e2616]"
              >
                Join the Club
              </a>
              <p className="mt-3 text-xs italic text-[#3e2616]/60">First delivery ships this Thursday</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quotes */}
      <section className="border-t-4 border-double border-[#3e2616]/70 bg-[#efe0c4]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#a8542c]">Kind Words</p>
            <h2 className={`${slab.className} mt-2 text-4xl md:text-5xl`}>From the mailbag</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {quotes.map((q) => (
              <figure key={q.name} className="rounded-sm border-2 border-[#3e2616] bg-[#fdf6e7] p-7 shadow-[4px_4px_0_rgba(62,38,22,0.8)]">
                <p className={`${slab.className} text-4xl leading-none text-[#a8542c]`}>&ldquo;</p>
                <blockquote className="mt-1 text-sm leading-relaxed text-[#3e2616]/90">{q.quote}</blockquote>
                <figcaption className="mt-5 border-t border-dashed border-[#3e2616]/50 pt-4 text-sm">
                  <span className="font-bold">{q.name}</span>
                  <span className="text-[#3e2616]/60"> · {q.place}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Visit strip */}
      <section id="visit" className="border-y-4 border-double border-[#3e2616]/70 bg-[#a8542c] text-[#f5ead6]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-12 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-5">
            <CoffeeCup className="h-12 w-12 shrink-0" />
            <div>
              <h2 className={`${slab.className} text-2xl`}>Come smell the smoke</h2>
              <p className="mt-1 text-sm text-[#f5ead6]/85">
                14 Kiln Road, Bell Hollow, NC · Tasting bar open Wed–Sun, 7am–2pm
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-sm font-semibold md:items-end">
            <p>Free roastery tours every Saturday at 9am</p>
            <p className="text-[#f5ead6]/80">Bring a thermos — first fill is on the house.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3e2616] text-[#f5ead6]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Bean className="h-6 w-6 text-[#c98a3d]" />
              <span className={`${slab.className} text-lg`}>Ember &amp; Oak Roasting Co.</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#f5ead6]/70">
              Small-batch coffee roasted over oak fire in the Blue Ridge
              foothills. Family-run since 1972, opinionated about percolators
              since long before that.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#c98a3d]">Shop</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#f5ead6]/80">
              <li><a href="#roasts" className="hover:text-[#c98a3d]">Morning Bell</a></li>
              <li><a href="#roasts" className="hover:text-[#c98a3d]">Hearthside</a></li>
              <li><a href="#roasts" className="hover:text-[#c98a3d]">Old Stove</a></li>
              <li><a href="#club" className="hover:text-[#c98a3d]">Bean Club</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#c98a3d]">Roastery</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#f5ead6]/80">
              <li>14 Kiln Road, Bell Hollow, NC</li>
              <li>(828) 555-0172</li>
              <li>howdy@emberandoak.example</li>
              <li>Wed–Sun · 7am–2pm</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#f5ead6]/20">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs uppercase tracking-[0.2em] text-[#f5ead6]/50 md:flex-row">
            <p>&copy; 1972–2026 Ember &amp; Oak Roasting Co. All beans reserved.</p>
            <p>Roasted slow · Poured warm</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
