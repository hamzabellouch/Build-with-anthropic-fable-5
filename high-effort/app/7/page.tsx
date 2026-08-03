import type { Metadata } from "next";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Wanderpine — Small-Group Adventure Travel",
  description:
    "Trails worth telling stories about. Small-group treks through the world's wildest backcountry, led by guides who know every switchback by name.",
};

const trips = [
  {
    name: "Patagonia Ridgeline",
    place: "Torres del Paine, Chile",
    days: "9 days",
    price: "$2,890",
    gradient: "from-[#2f4f3e] via-[#c45d3a] to-[#f2c879]",
    tag: "Most loved",
  },
  {
    name: "Dolomites Hut-to-Hut",
    place: "Alta Via 1, Italy",
    days: "7 days",
    price: "$2,140",
    gradient: "from-[#7a4a8c] via-[#c45d3a] to-[#f7d9a8]",
    tag: "New route",
  },
  {
    name: "High Atlas Traverse",
    place: "Toubkal, Morocco",
    days: "6 days",
    price: "$1,760",
    gradient: "from-[#b8552f] via-[#e09a4f] to-[#f6e3bf]",
    tag: "Sun-chaser",
  },
  {
    name: "Kungsleden North",
    place: "Lapland, Sweden",
    days: "8 days",
    price: "$2,420",
    gradient: "from-[#1f3d33] via-[#3f6b58] to-[#cfe3c8]",
    tag: "Midnight sun",
  },
];

const values = [
  {
    title: "Groups of 10, max",
    body: "Small enough to share one campfire and learn everyone's trail name by day two.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9.5" r="2.4" />
        <path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5" strokeLinecap="round" />
        <path d="M15.5 14.4c2.2.2 4 1.7 4.6 4.1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Guides who live there",
    body: "Local leaders who know which ridge catches sunrise and which bakery opens at five.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4 4-1.6z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Leave it wilder",
    body: "Every booking funds trail restoration. We've replanted 41,000 pines and counting.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M12 3l4.5 6h-2.5l3.5 5h-3l3 4.5H6.5l3-4.5h-3L10 9H7.5L12 3z" strokeLinejoin="round" />
        <path d="M12 18.5V21" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "No-surprise pricing",
    body: "Huts, hearty meals, and permits included. The only thing extra is the summit grin.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M4 8h16v11H4z" strokeLinejoin="round" />
        <path d="M4 8l2.5-4h11L20 8M9.5 12h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const itinerary = [
  { day: "Day 1", title: "Trailhead hellos", body: "Meet your crew, pack checks, first easy miles to a riverside camp." },
  { day: "Day 3", title: "The high pass", body: "Pre-dawn start, switchbacks, and a thermos of cocoa at 3,100m." },
  { day: "Day 5", title: "Valley rest day", body: "Hot springs, sketchbooks, naps in the meadow. Earned, thoroughly." },
  { day: "Day 7", title: "Summit & stories", body: "The big one. Then a farewell feast under more stars than you knew existed." },
];

const testimonials = [
  {
    quote:
      "I came for the mountains and left with eleven new friends and a frankly alarming number of marmot photos.",
    name: "Priya N.",
    trip: "Dolomites Hut-to-Hut '25",
    rotate: "-rotate-3",
    gradient: "from-[#c45d3a] to-[#f2c879]",
  },
  {
    quote:
      "Our guide Mateo knew every wildflower by name. Also exactly when to produce emergency chocolate. A wizard.",
    name: "Sam & Jordan T.",
    trip: "Patagonia Ridgeline '24",
    rotate: "rotate-2",
    gradient: "from-[#2f4f3e] to-[#7fae8e]",
  },
  {
    quote:
      "First trek ever at 58 years old. Wanderpine made me feel like a mountaineer, not a liability. Booked again for spring.",
    name: "Helene B.",
    trip: "High Atlas Traverse '25",
    rotate: "-rotate-1",
    gradient: "from-[#e09a4f] to-[#f6e3bf]",
  },
];

export default function WanderpinePage() {
  return (
    <div className={`${outfit.className} min-h-screen bg-[#faf3e7] text-[#2a2520] antialiased`}>
      {/* ===== Nav ===== */}
      <header className="absolute inset-x-0 top-0 z-30">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="#" className="flex items-center gap-2 text-[#fff7ea]">
            <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9">
              <circle cx="16" cy="16" r="15" stroke="#fff7ea" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M16 6l5 9h-3l4 7H10l4-7h-3l5-9z" fill="#fff7ea" />
              <path d="M16 22v4" stroke="#fff7ea" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold tracking-tight">Wanderpine</span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-[#fff7ea]/90 md:flex">
            <a href="#trips" className="transition hover:text-white">Trips</a>
            <a href="#why" className="transition hover:text-white">Why us</a>
            <a href="#journey" className="transition hover:text-white">The journey</a>
            <a href="#stories" className="transition hover:text-white">Stories</a>
          </div>
          <a
            href="#cta"
            className="rounded-full border-2 border-dashed border-[#fff7ea]/70 px-5 py-2 text-sm font-semibold text-[#fff7ea] transition hover:bg-[#fff7ea] hover:text-[#b8552f]"
          >
            Book a trek
          </a>
        </nav>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2c2a52] via-[#a34a3f] via-55% to-[#e8943f]">
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-72 pt-36 text-center sm:pb-80 sm:pt-44">
          <p className="mb-4 inline-block rounded-full border border-dashed border-[#fff7ea]/50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#ffd9a0]">
            Small-group treks since 2014
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight text-[#fff7ea] sm:text-7xl">
            Trails worth telling stories about
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-light text-[#ffe9c9] sm:text-xl">
            Ten strangers, one ridgeline, and a guide who knows every switchback by name.
            Come home with sore legs and a better campfire repertoire.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#trips"
              className="rounded-full bg-[#fff7ea] px-8 py-3.5 text-base font-bold text-[#b8552f] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Find your trail
            </a>
            <a
              href="#journey"
              className="rounded-full border-2 border-dashed border-[#fff7ea]/70 px-8 py-3 text-base font-semibold text-[#fff7ea] transition hover:bg-white/10"
            >
              See a sample week
            </a>
          </div>
        </div>

        {/* Sun */}
        <svg viewBox="0 0 200 200" className="absolute left-1/2 top-[46%] z-0 h-56 w-56 -translate-x-1/2 sm:h-72 sm:w-72" aria-hidden>
          <circle cx="100" cy="100" r="70" fill="#ffd98c" opacity="0.95" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="#ffd98c" strokeWidth="2" strokeDasharray="2 10" opacity="0.7" />
        </svg>

        {/* Layered mountain silhouettes */}
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute bottom-32 left-0 z-[1] h-48 w-full sm:bottom-36" aria-hidden>
          <path d="M0 220L160 110 280 170 430 60 560 150 720 40 880 160 1020 80 1180 170 1320 100 1440 160V220H0z" fill="#7d4a3a" opacity="0.55" />
        </svg>
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute bottom-16 left-0 z-[2] h-52 w-full" aria-hidden>
          <path d="M0 220L120 130 260 180 420 80 600 175 760 70 940 180 1100 100 1260 175 1440 110V220H0z" fill="#54392f" opacity="0.85" />
        </svg>
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute bottom-0 left-0 z-[3] h-44 w-full" aria-hidden>
          <path d="M0 200L100 120 220 165 360 70 500 160 660 55 830 165 980 95 1140 165 1290 115 1440 165V200H0z" fill="#2a2017" />
          {/* tiny treeline */}
          <g fill="#2a2017">
            <path d="M250 165l8-18 8 18h-16zM272 165l7-15 7 15h-14z" />
            <path d="M1040 165l8-18 8 18h-16zM1062 165l7-15 7 15h-14z" />
          </g>
        </svg>
      </section>

      {/* ===== Destination cards ===== */}
      <section id="trips" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#c45d3a]">Where to next</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-[#2f4f3e] sm:text-5xl">
              Four trails, zero crowds
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#6b5d4f]">
            Every departure is capped at ten travelers. Boots, snacks, and one
            unreasonable love of sunrises required.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trips.map((trip) => (
            <article
              key={trip.name}
              className="group flex flex-col overflow-hidden rounded-2xl border-2 border-dashed border-[#d8c4a4] bg-[#fffaf0] shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#c45d3a]/15"
            >
              <div className={`relative h-44 bg-gradient-to-br ${trip.gradient}`}>
                <svg viewBox="0 0 400 180" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-20 w-full" aria-hidden>
                  <path d="M0 180L70 90 140 150 220 70 300 150 360 100 400 140V180H0z" fill="#2a2017" opacity="0.45" />
                </svg>
                <span className="absolute left-3 top-3 rounded-full bg-[#fff7ea]/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#b8552f]">
                  {trip.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-[#2f4f3e]">{trip.name}</h3>
                <p className="mt-0.5 text-sm text-[#8a7a66]">{trip.place}</p>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="rounded-full bg-[#2f4f3e]/10 px-3 py-1 text-xs font-semibold text-[#2f4f3e]">
                    {trip.days}
                  </span>
                  <span className="text-lg font-extrabold text-[#c45d3a]">
                    {trip.price}
                    <span className="text-xs font-medium text-[#8a7a66]"> /person</span>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===== Why us ===== */}
      <section id="why" className="bg-[#2f4f3e] py-24 text-[#f4ecd9]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#e09a4f]">The Wanderpine way</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Built by people who'd rather be outside
            </h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="text-center sm:text-left">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#e09a4f]/60 text-[#f2c879] sm:mx-0">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#cfe0cb]">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Journey timeline ===== */}
      <section id="journey" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#c45d3a]">A week with us</p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-[#2f4f3e] sm:text-5xl">
            How the story usually goes
          </h2>
        </div>

        <div className="relative">
          {/* dotted route line */}
          <svg viewBox="0 0 1000 60" preserveAspectRatio="none" className="absolute left-0 top-7 hidden h-12 w-full lg:block" aria-hidden>
            <path
              d="M30 40 C 200 5, 320 55, 500 28 S 800 50, 970 22"
              fill="none"
              stroke="#c45d3a"
              strokeWidth="2.5"
              strokeDasharray="1 10"
              strokeLinecap="round"
            />
          </svg>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {itinerary.map((step, i) => (
              <div key={step.day} className="relative">
                <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#c45d3a] bg-[#fffaf0] font-extrabold text-[#c45d3a]">
                  {i + 1}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e09a4f]">{step.day}</p>
                <h3 className="mt-1 text-lg font-bold text-[#2f4f3e]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6b5d4f]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section id="stories" className="bg-[#f3e7d2] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#c45d3a]">Postcards home</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-[#2f4f3e] sm:text-5xl">
              Pinned to our fridge
            </h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className={`${t.rotate} rounded-sm bg-white p-4 pb-6 shadow-[0_12px_30px_rgba(42,32,23,0.18)] transition hover:rotate-0 hover:scale-[1.03]`}
              >
                <div className={`relative mb-4 h-36 bg-gradient-to-br ${t.gradient}`}>
                  <svg viewBox="0 0 300 140" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-16 w-full" aria-hidden>
                    <path d="M0 140L60 70 120 115 190 50 250 110 300 80V140H0z" fill="#2a2017" opacity="0.4" />
                  </svg>
                  {/* tape strip */}
                  <div className="absolute -top-6 left-1/2 h-7 w-24 -translate-x-1/2 rotate-2 bg-[#f2c879]/70" />
                </div>
                <blockquote className="text-sm leading-relaxed text-[#4a4036]">"{t.quote}"</blockquote>
                <figcaption className="mt-4 text-sm font-bold text-[#2f4f3e]">
                  {t.name}
                  <span className="block text-xs font-medium text-[#8a7a66]">{t.trip}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA band ===== */}
      <section id="cta" className="relative overflow-hidden bg-gradient-to-r from-[#b8552f] via-[#c45d3a] to-[#e09a4f] py-20">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-24 w-full opacity-25" aria-hidden>
          <path d="M0 120L140 50 280 95 440 30 600 95 760 25 940 100 1100 45 1280 95 1440 55V120H0z" fill="#2a2017" />
        </svg>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#fff7ea] sm:text-5xl">
            The trail won't hike itself
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#ffe9c9]">
            Spring departures are filling up faster than a hut bunkroom in a hailstorm.
            Grab a spot, or join the waitlist and we'll save you a seat by the fire.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#trips"
              className="rounded-full bg-[#2a2017] px-8 py-3.5 text-base font-bold text-[#f2c879] shadow-lg transition hover:-translate-y-0.5"
            >
              Reserve your spot
            </a>
            <a
              href="#"
              className="rounded-full border-2 border-dashed border-[#fff7ea]/80 px-8 py-3 text-base font-semibold text-[#fff7ea] transition hover:bg-white/10"
            >
              Get the trail guide (free)
            </a>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#2a2017] py-14 text-[#cbb795]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
            <div>
              <div className="flex items-center gap-2 text-[#f4ecd9]">
                <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8">
                  <circle cx="16" cy="16" r="15" stroke="#e09a4f" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M16 6l5 9h-3l4 7H10l4-7h-3l5-9z" fill="#e09a4f" />
                  <path d="M16 22v4" stroke="#e09a4f" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-lg font-bold">Wanderpine</span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">
                Small-group treks for people who think a perfect day starts before sunrise
                and ends smelling faintly of woodsmoke.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-3">
              <div>
                <h4 className="mb-3 font-bold uppercase tracking-wider text-[#e09a4f]">Treks</h4>
                <ul className="space-y-2">
                  <li><a href="#trips" className="transition hover:text-[#f4ecd9]">Patagonia</a></li>
                  <li><a href="#trips" className="transition hover:text-[#f4ecd9]">Dolomites</a></li>
                  <li><a href="#trips" className="transition hover:text-[#f4ecd9]">High Atlas</a></li>
                  <li><a href="#trips" className="transition hover:text-[#f4ecd9]">Lapland</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-bold uppercase tracking-wider text-[#e09a4f]">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#why" className="transition hover:text-[#f4ecd9]">Our guides</a></li>
                  <li><a href="#" className="transition hover:text-[#f4ecd9]">Trail fund</a></li>
                  <li><a href="#" className="transition hover:text-[#f4ecd9]">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-bold uppercase tracking-wider text-[#e09a4f]">Help</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="transition hover:text-[#f4ecd9]">Packing lists</a></li>
                  <li><a href="#" className="transition hover:text-[#f4ecd9]">FAQ</a></li>
                  <li><a href="#" className="transition hover:text-[#f4ecd9]">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-dashed border-[#cbb795]/30 pt-6 text-xs sm:flex-row">
            <p>© 2026 Wanderpine Expeditions. All trails reserved.</p>
            <p>Pack it in, pack it out.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
