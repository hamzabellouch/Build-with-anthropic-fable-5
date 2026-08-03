import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Driftaway — Group Trips, Finally on the Same Page",
  description:
    "Driftaway turns chaotic group chats into beautiful shared itineraries. Plan together, vote on stays, split budgets, and drift away with your crew.",
};

const steps = [
  {
    num: "01",
    emoji: "🗺️",
    title: "Start a trip",
    body: "Drop in a destination and rough dates. Driftaway spins up a shared trip board in seconds — no spreadsheet required.",
  },
  {
    num: "02",
    emoji: "💌",
    title: "Invite the crew",
    body: "Send one link to the group chat. Everyone adds stays, eats, and can’t-miss ideas straight onto the board.",
  },
  {
    num: "03",
    emoji: "🌅",
    title: "Drift away",
    body: "Votes become a day-by-day itinerary that syncs to every phone — with maps, budgets, and reservations in one place.",
  },
];

const destinations = [
  {
    name: "Santorini",
    country: "Greece",
    meta: "5-day island crawl",
    trips: "2.4k crews",
    gradient: "from-orange-300 via-rose-400 to-indigo-500",
    emoji: "🏛️",
  },
  {
    name: "Kyoto",
    country: "Japan",
    meta: "7-day temple loop",
    trips: "3.1k crews",
    gradient: "from-rose-300 via-fuchsia-400 to-violet-600",
    emoji: "⛩️",
  },
  {
    name: "Banff",
    country: "Canada",
    meta: "4-day alpine escape",
    trips: "1.8k crews",
    gradient: "from-sky-300 via-cyan-400 to-emerald-500",
    emoji: "🏔️",
  },
  {
    name: "Lisbon",
    country: "Portugal",
    meta: "6-day coastal wander",
    trips: "2.9k crews",
    gradient: "from-amber-300 via-orange-400 to-rose-500",
    emoji: "🚋",
  },
  {
    name: "Tulum",
    country: "Mexico",
    meta: "5-day beach reset",
    trips: "2.2k crews",
    gradient: "from-teal-300 via-emerald-400 to-cyan-600",
    emoji: "🏝️",
  },
  {
    name: "Queenstown",
    country: "New Zealand",
    meta: "8-day thrill run",
    trips: "1.3k crews",
    gradient: "from-indigo-300 via-blue-400 to-sky-600",
    emoji: "🪂",
  },
];

const features = [
  {
    emoji: "💸",
    title: "Shared budgets",
    body: "Set a trip budget together, log costs as you go, and let Driftaway do the awkward math. Everyone sees who owes what — settled in two taps.",
    chip: "$1,240 of $1,500 spent",
  },
  {
    emoji: "📍",
    title: "Live maps",
    body: "Every pin your crew saves lands on one shared map. See who’s where in real time, get walking routes, and keep it all offline-ready.",
    chip: "4 friends nearby",
  },
  {
    emoji: "🗳️",
    title: "Group votes",
    body: "Swipe right on the rooftop bar, left on the 6 a.m. hike. The itinerary builds itself from what the group actually wants.",
    chip: "Sunset cruise · 5/6 yes",
  },
];

const testimonials = [
  {
    name: "Mia Okafor",
    trip: "Lisbon with 5 college friends",
    initials: "MO",
    gradient: "from-rose-400 to-orange-300",
    quote:
      "We went from 400 unread messages to a finished itinerary in one evening. Nobody argued. I didn’t know group trips could feel like this.",
  },
  {
    name: "Jonas Wieland",
    trip: "Kyoto bachelor trip, 8 people",
    initials: "JW",
    gradient: "from-sky-400 to-indigo-400",
    quote:
      "The budget split alone saved the friendship group. Eight guys, one trip, zero Venmo drama. The live map was the cherry on top.",
  },
  {
    name: "Priya Raman",
    trip: "Banff family reunion",
    initials: "PR",
    gradient: "from-emerald-400 to-teal-300",
    quote:
      "Three generations, one app. My dad voted on hikes from his recliner and my niece planned the food. Everyone felt heard — that’s rare.",
  },
];

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function PlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M104 52v408c0 13.6 14.7 22.1 26.5 15.2l349.4-204c11.7-6.8 11.7-23.6 0-30.4l-349.4-204C118.7 29.9 104 38.4 104 52z" />
    </svg>
  );
}

function StoreButtons({ invert = false }: { invert?: boolean }) {
  const base = invert
    ? "bg-white/90 text-slate-900 hover:bg-white"
    : "bg-slate-900/90 text-white hover:bg-slate-900";
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <a
        href="#download"
        className={`${base} flex w-56 items-center gap-3 rounded-full px-6 py-3 shadow-lg shadow-slate-900/20 backdrop-blur transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
      >
        <AppleLogo className="h-7 w-7 shrink-0" />
        <span className="text-left leading-tight">
          <span className="block text-[10px] uppercase tracking-widest opacity-70">
            Download on the
          </span>
          <span className="block text-base font-semibold">App Store</span>
        </span>
      </a>
      <a
        href="#download"
        className={`${base} flex w-56 items-center gap-3 rounded-full px-6 py-3 shadow-lg shadow-slate-900/20 backdrop-blur transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
      >
        <PlayLogo className="h-6 w-6 shrink-0" />
        <span className="text-left leading-tight">
          <span className="block text-[10px] uppercase tracking-widest opacity-70">
            Get it on
          </span>
          <span className="block text-base font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  );
}

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden="true">
      <ellipse cx="60" cy="55" rx="55" ry="24" fill="white" />
      <ellipse cx="110" cy="42" rx="48" ry="28" fill="white" />
      <ellipse cx="155" cy="56" rx="42" ry="20" fill="white" />
    </svg>
  );
}

function PhoneMockup() {
  return (
    <div className="lp6-float relative mx-auto w-[290px] sm:w-[320px]">
      {/* phone frame */}
      <div className="rounded-[3rem] border border-white/50 bg-white/30 p-3 shadow-2xl shadow-rose-500/20 backdrop-blur-xl">
        <div className="overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-white/95 to-white/75">
          {/* notch */}
          <div className="flex justify-center pt-3">
            <div className="h-6 w-28 rounded-full bg-slate-900/90" />
          </div>
          {/* screen content */}
          <div className="space-y-3 px-4 pb-6 pt-4">
            <div className="rounded-2xl bg-gradient-to-r from-sky-400 to-rose-400 p-4 text-white shadow-md">
              <p className="text-[10px] uppercase tracking-widest text-white/80">
                Trip · 6 travelers
              </p>
              <p className="text-lg font-semibold">Lisbon, Portugal</p>
              <p className="text-xs text-white/90">Jun 12 – Jun 18 · Day 3 of 6</p>
            </div>
            {[
              { time: "9:30", title: "Pastéis at Manteigaria", emoji: "🥐", votes: "6/6" },
              { time: "11:00", title: "Tram 28 to Alfama", emoji: "🚋", votes: "5/6" },
              { time: "14:30", title: "Tile Museum", emoji: "🎨", votes: "4/6" },
              { time: "19:00", title: "Sunset at Miradouro", emoji: "🌅", votes: "6/6" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm"
              >
                <span className="text-xl">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.time} · added by Mia</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {item.votes} ✓
                </span>
              </div>
            ))}
            <button className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white">
              + Add to itinerary
            </button>
          </div>
        </div>
      </div>
      {/* floating notification cards */}
      <div className="lp6-float-delay absolute -left-10 top-24 hidden rounded-2xl border border-white/50 bg-white/60 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
        <p className="text-xs font-semibold text-slate-800">🗳️ Jonas voted yes</p>
        <p className="text-[11px] text-slate-600">Sunset sailing cruise</p>
      </div>
      <div className="lp6-float-delay-2 absolute -right-12 bottom-28 hidden rounded-2xl border border-white/50 bg-white/60 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
        <p className="text-xs font-semibold text-slate-800">💸 Budget on track</p>
        <p className="text-[11px] text-slate-600">$1,240 of $1,500</p>
      </div>
    </div>
  );
}

export default function DriftawayLanding() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-b from-sky-400 via-rose-300 to-amber-200 font-sans text-slate-800">
      <style>{`
        @keyframes lp6-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes lp6-drift { 0% { transform: translateX(-6%); } 100% { transform: translateX(6%); } }
        .lp6-float { animation: lp6-bob 6s ease-in-out infinite; }
        .lp6-float-delay { animation: lp6-bob 7s ease-in-out 1.2s infinite; }
        .lp6-float-delay-2 { animation: lp6-bob 8s ease-in-out 2.4s infinite; }
        .lp6-cloud { animation: lp6-drift 22s ease-in-out infinite alternate; }
        .lp6-cloud-slow { animation: lp6-drift 34s ease-in-out infinite alternate-reverse; }
      `}</style>

      {/* ambient sky decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 right-[-8rem] h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
        <div className="absolute top-[28rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-white/40 blur-3xl" />
        <div className="absolute bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-rose-200/60 blur-3xl" />
        <Cloud className="lp6-cloud absolute left-[6%] top-24 w-44 opacity-60 sm:w-56" />
        <Cloud className="lp6-cloud-slow absolute right-[10%] top-64 w-32 opacity-40 sm:w-44" />
        <Cloud className="lp6-cloud absolute left-[18%] top-[60rem] w-40 opacity-30" />
      </div>

      {/* nav */}
      <header className="sticky top-4 z-50 mx-auto w-[min(64rem,calc(100%-2rem))]">
        <nav className="flex items-center justify-between rounded-full border border-white/40 bg-white/30 px-5 py-3 shadow-lg shadow-sky-900/10 backdrop-blur-xl">
          <a href="#" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-400 text-lg text-white shadow-md">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M21.4 2.6a1.4 1.4 0 0 0-1.5-.3L3.2 8.9a1.4 1.4 0 0 0 .1 2.6l6.6 2.3 2.3 6.6a1.4 1.4 0 0 0 2.6.1l6.6-16.7a1.4 1.4 0 0 0 0-1.2zM10.5 12.1 5.7 10.4l11-4.3-6.2 6zm3.4 6.2-1.7-4.8 6-6.2-4.3 11z" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Driftaway</span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <a href="#how" className="transition-colors hover:text-slate-900">How it works</a>
            <a href="#destinations" className="transition-colors hover:text-slate-900">Destinations</a>
            <a href="#features" className="transition-colors hover:text-slate-900">Features</a>
            <a href="#stories" className="transition-colors hover:text-slate-900">Stories</a>
          </div>
          <a
            href="#download"
            className="rounded-full bg-slate-900/90 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lg"
          >
            Get the app
          </a>
        </nav>
      </header>

      {/* hero */}
      <section className="relative mx-auto grid w-[min(72rem,calc(100%-2rem))] items-center gap-12 pb-24 pt-16 sm:pt-20 lg:grid-cols-2 lg:gap-8">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-800 backdrop-blur-xl">
            ✈️ 180k crews planning right now
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
            Group trips, finally on the{" "}
            <span className="bg-gradient-to-r from-amber-100 to-rose-100 bg-clip-text text-transparent">
              same page.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/90 lg:mx-0">
            Driftaway turns your group chat&apos;s &ldquo;we should totally go&rdquo; into a real,
            shared itinerary — with votes, budgets, and maps the whole crew can see. Plan less.
            Wander more.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 lg:items-start">
            <StoreButtons />
            <p className="text-sm text-white/80">
              Free to download · iOS &amp; Android · No card required
            </p>
          </div>
        </div>
        <PhoneMockup />
      </section>

      {/* how it works */}
      <section id="how" className="relative mx-auto w-[min(72rem,calc(100%-2rem))] scroll-mt-28 pb-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl">
            From group chat to gate call in three steps
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="group rounded-3xl border border-white/40 bg-white/30 p-8 shadow-xl shadow-sky-900/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/40 hover:shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
                  {step.emoji}
                </span>
                <span className="text-sm font-semibold text-slate-600/70">{step.num}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* destinations */}
      <section
        id="destinations"
        className="relative mx-auto w-[min(72rem,calc(100%-2rem))] scroll-mt-28 pb-24"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
              Trending with crews
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Where everyone&apos;s drifting this season
            </h2>
          </div>
          <a
            href="#download"
            className="rounded-full border border-white/50 bg-white/30 px-5 py-2 text-sm font-semibold text-slate-800 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/50"
          >
            Browse all itineraries →
          </a>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <a
              key={d.name}
              href="#download"
              className="group overflow-hidden rounded-3xl border border-white/40 bg-white/30 shadow-xl shadow-sky-900/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
            >
              {/* gradient photo placeholder */}
              <div
                className={`relative flex h-44 items-end bg-gradient-to-br ${d.gradient} p-5 transition-transform duration-500`}
              >
                <span className="absolute right-4 top-4 rounded-full bg-white/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {d.trips}
                </span>
                <span className="absolute left-5 top-4 text-3xl drop-shadow transition-transform duration-300 group-hover:scale-110">
                  {d.emoji}
                </span>
                <div>
                  <p className="text-2xl font-semibold text-white drop-shadow-sm">{d.name}</p>
                  <p className="text-sm text-white/85">{d.country}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-sm font-medium text-slate-700">{d.meta}</p>
                <span className="text-sm font-semibold text-slate-900 transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* features */}
      <section
        id="features"
        className="relative mx-auto w-[min(72rem,calc(100%-2rem))] scroll-mt-28 pb-24"
      >
        <div className="rounded-[2.5rem] border border-white/40 bg-white/30 p-8 shadow-2xl shadow-rose-900/10 backdrop-blur-xl sm:p-12">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
              Built for the whole crew
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Everything a group trip needs, nothing it doesn&apos;t
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group flex flex-col rounded-3xl border border-white/50 bg-white/40 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/60 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/30 to-rose-400/30 text-2xl">
                  {f.emoji}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-700">{f.body}</p>
                <span className="mt-5 inline-flex w-fit items-center rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white">
                  {f.chip}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section
        id="stories"
        className="relative mx-auto w-[min(72rem,calc(100%-2rem))] scroll-mt-28 pb-24"
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
            Traveler stories
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Crews that came back still friends
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-3xl border border-white/40 bg-white/35 p-7 shadow-xl shadow-amber-900/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/50"
            >
              <div className="text-sm text-amber-500" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-semibold text-white shadow-md`}
                >
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{t.name}</span>
                  <span className="block text-xs text-slate-600">{t.trip}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* download CTA */}
      <section
        id="download"
        className="relative mx-auto w-[min(72rem,calc(100%-2rem))] scroll-mt-28 pb-24"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-500 via-rose-400 to-amber-300 p-10 text-center shadow-2xl shadow-rose-900/20 sm:p-16">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
            <Cloud className="lp6-cloud-slow absolute right-[12%] top-8 w-36 opacity-30" />
          </div>
          <div className="relative">
            <span className="text-5xl">🧳</span>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              Your next trip is one group link away
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
              Download Driftaway, drop the link in the chat, and watch the trip plan itself.
              Free forever for crews of up to ten.
            </p>
            <div className="mt-8 flex justify-center">
              <StoreButtons invert />
            </div>
            <p className="mt-5 text-sm text-white/80">
              4.9 ★ on the App Store · 120k+ reviews
            </p>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative border-t border-white/40 bg-white/20 backdrop-blur-xl">
        <div className="mx-auto grid w-[min(72rem,calc(100%-2rem))] gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-400 text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M21.4 2.6a1.4 1.4 0 0 0-1.5-.3L3.2 8.9a1.4 1.4 0 0 0 .1 2.6l6.6 2.3 2.3 6.6a1.4 1.4 0 0 0 2.6.1l6.6-16.7a1.4 1.4 0 0 0 0-1.2z" />
                </svg>
              </span>
              <span className="text-lg font-semibold text-slate-900">Driftaway</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-700">
              The travel app that gets your whole crew on the same page — itineraries, budgets,
              and votes in one dreamy place.
            </p>
          </div>
          {[
            {
              heading: "Product",
              links: ["How it works", "Destinations", "Features", "Pricing"],
            },
            {
              heading: "Company",
              links: ["About us", "Careers", "Press kit", "Travel blog"],
            },
            {
              heading: "Support",
              links: ["Help center", "Contact us", "Privacy", "Terms"],
            },
          ].map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-800">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-700 transition-colors hover:text-slate-900"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/40">
          <p className="mx-auto w-[min(72rem,calc(100%-2rem))] py-6 text-center text-xs text-slate-600 sm:text-left">
            © 2026 Driftaway Travel, Inc. All itineraries are dreams in progress. ☁️
          </p>
        </div>
      </footer>
    </div>
  );
}
