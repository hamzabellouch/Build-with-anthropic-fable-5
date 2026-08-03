import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atelier Nord — Architecture & Interior Design",
  description:
    "Atelier Nord is a Scandinavian architecture and interior design studio. We design quiet buildings for loud cities.",
};

const projects = [
  {
    index: "01",
    name: "Fjordhus Pavilion",
    location: "Oslo, Norway",
    year: "2025",
    gradient: "from-neutral-200 via-neutral-100 to-neutral-50",
  },
  {
    index: "02",
    name: "Kalkstein Residence",
    location: "Copenhagen, Denmark",
    year: "2024",
    gradient: "from-neutral-300 via-neutral-200 to-neutral-100",
  },
  {
    index: "03",
    name: "Stille Library",
    location: "Gothenburg, Sweden",
    year: "2024",
    gradient: "from-neutral-100 via-neutral-200 to-neutral-100",
  },
  {
    index: "04",
    name: "Norra Tower",
    location: "Stockholm, Sweden",
    year: "2023",
    gradient: "from-neutral-200 via-neutral-300 to-neutral-200",
  },
  {
    index: "05",
    name: "Havn Bathhouse",
    location: "Aarhus, Denmark",
    year: "2023",
    gradient: "from-neutral-50 via-neutral-200 to-neutral-100",
  },
  {
    index: "06",
    name: "Lys Gallery",
    location: "Bergen, Norway",
    year: "2022",
    gradient: "from-neutral-300 via-neutral-100 to-neutral-200",
  },
];

const services = [
  {
    index: "01",
    name: "Architecture",
    detail: "Civic, cultural, and residential buildings from first sketch to handover.",
  },
  {
    index: "02",
    name: "Interior Design",
    detail: "Spatial planning, material palettes, and bespoke joinery for calm interiors.",
  },
  {
    index: "03",
    name: "Master Planning",
    detail: "District strategies that privilege daylight, silence, and slow movement.",
  },
  {
    index: "04",
    name: "Adaptive Reuse",
    detail: "Careful transformation of existing structures with minimal intervention.",
  },
  {
    index: "05",
    name: "Research",
    detail: "Studies on acoustic comfort, northern light, and low-carbon construction.",
  },
];

const awards = [
  { year: "2025", title: "Nordic Architecture Prize — Fjordhus Pavilion" },
  { year: "2024", title: "Mies van der Rohe Award, Shortlist — Stille Library" },
  { year: "2024", title: "Dezeen — Studio of the Year, Finalist" },
  { year: "2023", title: "Träpriset Timber Award — Havn Bathhouse" },
  { year: "2022", title: "Wallpaper* Design Awards — Best New Gallery" },
];

const press = [
  { source: "Domus", title: "The discipline of restraint: Atelier Nord at twelve" },
  { source: "Dwell", title: "Inside Kalkstein, a house that almost isn't there" },
  { source: "Arkitektur N", title: "Quiet density — rethinking the northern block" },
];

function PlanMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="8" y="8" width="104" height="104" stroke="currentColor" strokeWidth="1" />
      <line x1="8" y1="64" x2="72" y2="64" stroke="currentColor" strokeWidth="1" />
      <line x1="72" y1="64" x2="72" y2="112" stroke="currentColor" strokeWidth="1" />
      <line x1="44" y1="8" x2="44" y2="40" stroke="currentColor" strokeWidth="1" />
      <path d="M44 40 A 14 14 0 0 1 58 54" stroke="currentColor" strokeWidth="0.75" />
      <line x1="92" y1="8" x2="92" y2="64" stroke="currentColor" strokeWidth="1" />
      <circle cx="92" cy="88" r="6" stroke="currentColor" strokeWidth="0.75" />
    </svg>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
      <span className="text-[#9a6b56]">{index}</span>
      <span className="mx-3 text-neutral-300">—</span>
      <span className="text-neutral-500">{label}</span>
    </p>
  );
}

export default function Page() {
  return (
    <div className={`${interTight.className} min-h-screen bg-white text-neutral-900 antialiased`}>
      {/* Nav */}
      <header className="border-b border-neutral-200">
        <nav className="mx-auto flex max-w-[1320px] items-baseline justify-between px-6 py-6 lg:px-10">
          <a href="#" className="text-sm font-medium uppercase tracking-[0.3em]">
            Atelier&nbsp;Nord
          </a>
          <div className="flex items-baseline gap-8 text-[11px] uppercase tracking-[0.25em] text-neutral-500">
            <a href="#works" className="transition-colors hover:text-neutral-900">
              Works
            </a>
            <a href="#practice" className="transition-colors hover:text-neutral-900">
              Practice
            </a>
            <a href="#contact" className="transition-colors hover:text-neutral-900">
              Contact
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-x-6 px-6 pb-24 pt-20 lg:px-10 lg:pb-36 lg:pt-32">
          <div className="col-span-12 mb-12 lg:col-span-3 lg:mb-0">
            <SectionLabel index="01" label="Practice" />
          </div>
          <div className="col-span-12 lg:col-span-9">
            <h1 className="text-[clamp(2.75rem,7vw,6.5rem)] font-extralight leading-[1.02] tracking-[-0.02em]">
              We design quiet buildings
              <br className="hidden md:block" /> for loud cities.
            </h1>
            <div className="mt-16 grid grid-cols-12 gap-x-6">
              <p className="col-span-12 max-w-md text-[15px] font-light leading-relaxed text-neutral-500 md:col-span-6">
                Atelier Nord is an architecture and interior design studio founded
                in Oslo in 2014. We work where density meets stillness — civic
                rooms, housing, and landscapes built from light, timber, and
                restraint.
              </p>
              <div className="col-span-12 mt-10 flex items-end justify-start md:col-span-6 md:mt-0 md:justify-end">
                <PlanMark className="h-24 w-24 text-neutral-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selected works */}
      <section id="works" className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="mb-14 flex items-baseline justify-between">
            <SectionLabel index="02" label="Selected Works" />
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
              2022 — 2025
            </p>
          </div>
          <div className="grid grid-cols-12 gap-x-6 gap-y-16">
            {projects.map((project) => (
              <article key={project.index} className="group col-span-12 md:col-span-6 lg:col-span-4">
                <div
                  className={`relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${project.gradient}`}
                >
                  <span className="absolute left-4 top-4 text-[11px] tracking-[0.25em] text-neutral-400">
                    {project.index}
                  </span>
                  <span className="absolute bottom-0 right-0 h-px w-10 bg-[#9a6b56] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="mt-5 flex items-baseline justify-between border-t border-neutral-200 pt-4">
                  <div>
                    <h3 className="text-base font-normal tracking-tight">{project.name}</h3>
                    <p className="mt-1 text-[13px] font-light text-neutral-500">
                      {project.location}
                    </p>
                  </div>
                  <p className="text-[13px] font-light tabular-nums text-neutral-400">
                    {project.year}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section id="practice" className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-x-6 px-6 py-20 lg:px-10 lg:py-28">
          <div className="col-span-12 mb-12 lg:col-span-3 lg:mb-0">
            <SectionLabel index="03" label="Philosophy" />
          </div>
          <div className="col-span-12 lg:col-span-9">
            <h2 className="max-w-2xl text-[clamp(1.75rem,3.2vw,2.75rem)] font-extralight leading-[1.15] tracking-tight">
              A building should hold the city at arm&rsquo;s length —
              and then let the light back in.
            </h2>
            <div className="mt-14 grid grid-cols-12 gap-x-6 gap-y-10">
              <div className="col-span-12 md:col-span-6">
                <p className="text-[15px] font-light leading-relaxed text-neutral-600">
                  We begin every project by subtracting. Programmes are reduced
                  to their essential rooms; materials are reduced to those that
                  age honestly. What remains is structure, proportion, and the
                  slow movement of northern light across a wall.
                </p>
                <p className="mt-6 text-[15px] font-light leading-relaxed text-neutral-600">
                  Our work is not silent — it is quiet. The difference is
                  attention. A quiet building listens to its street, its
                  climate, and the people who will outlive its architects.
                </p>
              </div>
              <div className="col-span-12 md:col-span-6">
                <p className="text-[15px] font-light leading-relaxed text-neutral-600">
                  The studio is deliberately small: nineteen architects and
                  designers across Oslo and Copenhagen. We take on six projects
                  a year, never more, so each receives the patience it asks
                  for.
                </p>
                <p className="mt-6 text-[15px] font-light leading-relaxed text-neutral-600">
                  We build in timber where we can, in stone where we must, and
                  we measure success in decades — how a threshold wears, how a
                  courtyard sounds on a winter morning, how a room teaches
                  calm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-x-6 px-6 py-20 lg:px-10 lg:py-28">
          <div className="col-span-12 mb-12 lg:col-span-3 lg:mb-0">
            <SectionLabel index="04" label="Services" />
          </div>
          <div className="col-span-12 lg:col-span-9">
            <ul>
              {services.map((service) => (
                <li
                  key={service.index}
                  className="group grid grid-cols-12 items-baseline gap-x-6 border-t border-neutral-200 py-7 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <span className="col-span-2 text-[11px] tracking-[0.25em] text-[#9a6b56] md:col-span-1">
                    {service.index}
                  </span>
                  <h3 className="col-span-10 text-xl font-light tracking-tight md:col-span-4">
                    {service.name}
                  </h3>
                  <p className="col-span-10 col-start-3 mt-2 text-[14px] font-light leading-relaxed text-neutral-500 md:col-span-7 md:col-start-6 md:mt-0">
                    {service.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Awards & press */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-x-6 gap-y-16 px-6 py-20 lg:px-10 lg:py-28">
          <div className="col-span-12 lg:col-span-6">
            <SectionLabel index="05" label="Awards" />
            <ul className="mt-10">
              {awards.map((award) => (
                <li
                  key={award.title}
                  className="flex items-baseline gap-8 border-t border-neutral-200 py-4 first:border-t-0 first:pt-0"
                >
                  <span className="w-12 shrink-0 text-[13px] font-light tabular-nums text-neutral-400">
                    {award.year}
                  </span>
                  <span className="text-[14px] font-light text-neutral-700">{award.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <SectionLabel index="06" label="Press" />
            <ul className="mt-10">
              {press.map((item) => (
                <li
                  key={item.title}
                  className="border-t border-neutral-200 py-4 first:border-t-0 first:pt-0"
                >
                  <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
                    {item.source}
                  </p>
                  <p className="mt-2 text-[14px] font-light text-neutral-700">
                    &ldquo;{item.title}&rdquo;
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Contact footer */}
      <footer id="contact">
        <div className="mx-auto max-w-[1320px] px-6 pb-12 pt-20 lg:px-10 lg:pt-28">
          <SectionLabel index="07" label="Contact" />
          <a
            href="mailto:studio@ateliernord.no"
            className="mt-12 block break-words text-[clamp(1.75rem,5.5vw,4.5rem)] font-extralight tracking-[-0.02em] text-neutral-900 underline decoration-neutral-200 decoration-1 underline-offset-8 transition-colors hover:decoration-[#9a6b56]"
          >
            studio@ateliernord.no
          </a>
          <div className="mt-20 grid grid-cols-12 gap-x-6 gap-y-8 border-t border-neutral-200 pt-8 text-[12px] font-light text-neutral-500">
            <div className="col-span-6 md:col-span-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Oslo</p>
              <p className="mt-3 leading-relaxed">
                Kirkegata 14
                <br />
                0153 Oslo, Norway
              </p>
            </div>
            <div className="col-span-6 md:col-span-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Copenhagen</p>
              <p className="mt-3 leading-relaxed">
                Strandgade 27B
                <br />
                1401 København K
              </p>
            </div>
            <div className="col-span-6 md:col-span-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Elsewhere</p>
              <p className="mt-3 leading-relaxed">
                Instagram
                <br />
                Are.na
              </p>
            </div>
            <div className="col-span-6 flex flex-col justify-between md:col-span-3 md:text-right">
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
                Atelier Nord
              </p>
              <p className="mt-3 leading-relaxed md:mt-auto">&copy; 2014 — 2026</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
