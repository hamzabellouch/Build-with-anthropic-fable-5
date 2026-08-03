import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATELIER MONO — Architecture & Interior Design | Copenhagen / Tokyo",
  description:
    "ATELIER MONO is a minimalist architecture and interior design studio working between Copenhagen and Tokyo. Buildings, interiors, objects — reduced to what remains necessary.",
};

const NAV_LINKS = [
  { index: "01", label: "Studio", href: "#studio" },
  { index: "02", label: "Works", href: "#works" },
  { index: "03", label: "Services", href: "#services" },
  { index: "04", label: "Recognition", href: "#recognition" },
  { index: "05", label: "Contact", href: "#contact" },
];

const PROJECTS = [
  {
    index: "01",
    title: "Hus Vinter",
    year: "2025",
    location: "Copenhagen, DK",
    type: "Private Residence",
    tone: "bg-black",
    numberTone: "text-white",
  },
  {
    index: "02",
    title: "Kanda Void",
    year: "2024",
    location: "Tokyo, JP",
    type: "Gallery",
    tone: "bg-neutral-800",
    numberTone: "text-white",
  },
  {
    index: "03",
    title: "Monolit",
    year: "2024",
    location: "Reykjavík, IS",
    type: "Hotel, 22 Rooms",
    tone: "bg-neutral-500",
    numberTone: "text-white",
  },
  {
    index: "04",
    title: "Paper Archive",
    year: "2023",
    location: "Kyoto, JP",
    type: "Private Library",
    tone: "bg-neutral-300",
    numberTone: "text-black",
  },
  {
    index: "05",
    title: "Grid House",
    year: "2022",
    location: "Aarhus, DK",
    type: "Residence",
    tone: "bg-neutral-200",
    numberTone: "text-black",
  },
  {
    index: "06",
    title: "Stille Works",
    year: "2021",
    location: "Berlin, DE",
    type: "Office, 1,400 m²",
    tone: "bg-neutral-900",
    numberTone: "text-white",
  },
];

const SERVICES = [
  {
    index: "01",
    name: "Architecture",
    detail:
      "New builds and structural transformations in concrete, timber and stone. From first sketch to handover.",
    scope: "Full Commission",
  },
  {
    index: "02",
    name: "Interiors",
    detail:
      "Spatial choreography, custom joinery and material palettes for residences, hotels and galleries.",
    scope: "Full / Partial",
  },
  {
    index: "03",
    name: "Furniture & Objects",
    detail:
      "Limited editions in solid oak, blackened steel and washi paper. Produced in Jutland and Gifu.",
    scope: "Edition of 24",
  },
  {
    index: "04",
    name: "Master Planning",
    detail:
      "Urban fragments, courtyard typologies and density studies for municipalities and developers.",
    scope: "Study / Brief",
  },
  {
    index: "05",
    name: "Research",
    detail:
      "Material archives, daylight studies and the studio journal MONO PAPERS, published twice a year.",
    scope: "Ongoing",
  },
];

const RECOGNITION = [
  {
    year: "2026",
    award: "Nordic Architecture Prize — Building of the Year, Winner",
    project: "Hus Vinter",
  },
  {
    year: "2025",
    award: "Tokyo Interior Biennale — Gold Medal",
    project: "Kanda Void",
  },
  {
    year: "2024",
    award: "European Hotel Design Award — Shortlist",
    project: "Monolit",
  },
  {
    year: "2023",
    award: "Kyoto Craft & Space Prize — Jury Selection",
    project: "Paper Archive",
  },
  {
    year: "2022",
    award: "Danish Design Council — Studio of the Year, Nominee",
    project: "Atelier Mono",
  },
];

const PRESS = ["FORM JOURNAL", "AXIS TOKYO", "STRUKTUR", "KINFOLK SPACES", "BAUWELT NORD"];

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-black antialiased selection:bg-red-600 selection:text-white">
      {/* ───────────────── NAV ───────────────── */}
      <header className="sticky top-0 z-50 border-b border-black bg-white">
        <nav className="mx-auto flex max-w-7xl items-stretch justify-between">
          <a
            href="#top"
            className="flex items-center gap-3 px-4 py-4 sm:px-6"
            aria-label="Atelier Mono — home"
          >
            <span className="block h-3 w-3 bg-red-600" aria-hidden="true" />
            <span className="text-sm font-bold uppercase tracking-tighter sm:text-base">
              Atelier&nbsp;Mono
            </span>
          </a>
          <div className="hidden items-stretch divide-x divide-black border-l border-black md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.index}
                href={link.href}
                className="flex items-center gap-2 px-5 text-[11px] uppercase tracking-widest transition-colors hover:bg-black hover:text-white"
              >
                <span className="text-red-600">{link.index}</span>
                {link.label}
              </a>
            ))}
          </div>
          <a
            href="#contact"
            className="flex items-center border-l border-black px-4 text-[11px] uppercase tracking-widest transition-colors hover:bg-black hover:text-white md:hidden"
          >
            <span className="mr-2 text-red-600">05</span>Contact
          </a>
        </nav>
      </header>

      <main id="top" className="mx-auto max-w-7xl">
        {/* ───────────────── HERO ───────────────── */}
        <section className="grid grid-cols-1 border-b border-black lg:grid-cols-12">
          <div className="px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:col-span-9 lg:border-r lg:border-black">
            <p className="mb-10 text-[11px] uppercase tracking-widest">
              Architecture &amp; Interior Design — Est. 2009
            </p>
            <h1 className="text-7xl font-bold uppercase leading-[0.9] tracking-tighter sm:text-8xl lg:text-9xl">
              Space
              <br />
              Is the
              <br />
              Material
              <span className="ml-2 inline-block h-[0.14em] w-[0.14em] bg-red-600 align-baseline" />
            </h1>
          </div>
          <div className="flex flex-col justify-end lg:col-span-3">
            <div className="border-t border-black px-4 py-5 sm:px-6 lg:border-t-0">
              <p className="text-[11px] uppercase tracking-widest text-red-600">Copenhagen</p>
              <p className="mt-1 text-sm">55.6761° N, 12.5683° E</p>
            </div>
            <div className="border-t border-black px-4 py-5 sm:px-6">
              <p className="text-[11px] uppercase tracking-widest text-red-600">Tokyo</p>
              <p className="mt-1 text-sm">35.6762° N, 139.6503° E</p>
            </div>
            <div className="border-t border-black px-4 py-5 sm:px-6">
              <p className="text-[11px] uppercase tracking-widest">Currently</p>
              <p className="mt-1 text-sm">14 projects on site, 3 continents</p>
            </div>
          </div>
        </section>

        {/* ───────────────── 01 — MANIFESTO ───────────────── */}
        <section id="studio" className="border-b border-black">
          <div className="flex items-baseline gap-4 border-b border-black px-4 py-4 sm:px-6">
            <span className="text-sm font-bold text-red-600">01</span>
            <h2 className="text-[11px] uppercase tracking-widest">Studio Manifesto</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="px-4 py-10 sm:px-6 md:col-span-5 md:border-r md:border-black">
              <p className="max-w-md text-2xl font-bold leading-tight tracking-tight">
                We remove until the building argues for itself. What survives the
                deletion is architecture.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 md:col-span-7">
              <div className="space-y-4 text-sm leading-relaxed">
                <p>
                  Atelier Mono was founded in 2009 by Astrid Vinter and Kenji
                  Hara, between a former print shop in Copenhagen&apos;s Nordvest
                  and a two-tatami office in Kanda. The studio still occupies
                  both — eighteen people, one drawing standard, no second
                  language of ornament.
                </p>
                <p>
                  We work slowly and in small numbers: never more than six
                  buildings in the office at once. Each commission begins with a
                  subtraction list — what the site does not need — before a
                  single line is drawn.
                </p>
              </div>
              <div className="space-y-4 text-sm leading-relaxed">
                <p>
                  Our palette is short by contract: in-situ concrete, Dinesen
                  oak, shikkui plaster, blackened steel. Repetition is not a
                  limitation; it is how a detail becomes a discipline.
                </p>
                <p>
                  The result, we hope, is silence you can stand inside. Rooms
                  that hold light the way a shelf holds a single object —
                  precisely, and without comment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── 02 — SELECTED WORKS ───────────────── */}
        <section id="works" className="border-b border-black">
          <div className="flex items-baseline justify-between border-b border-black px-4 py-4 sm:px-6">
            <div className="flex items-baseline gap-4">
              <span className="text-sm font-bold text-red-600">02</span>
              <h2 className="text-[11px] uppercase tracking-widest">Selected Works</h2>
            </div>
            <p className="text-[11px] uppercase tracking-widest">2021 — 2025</p>
          </div>
          <div className="grid grid-cols-1 gap-px bg-black sm:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((project) => (
              <article
                key={project.index}
                className="group bg-white transition-colors hover:bg-black hover:text-white"
              >
                <div className={`relative aspect-[4/3] ${project.tone}`}>
                  <span
                    className={`absolute bottom-3 left-4 text-5xl font-bold tracking-tighter ${project.numberTone}`}
                  >
                    {project.index}
                  </span>
                  <span className="absolute right-4 top-4 block h-2 w-2 bg-red-600" aria-hidden="true" />
                </div>
                <div className="border-t border-black px-4 py-4 group-hover:border-white sm:px-5">
                  <h3 className="text-lg font-bold uppercase tracking-tight">
                    {project.title}
                  </h3>
                  <div className="mt-2 flex items-baseline justify-between text-[11px] uppercase tracking-widest">
                    <span>{project.location}</span>
                    <span className="text-red-600">{project.year}</span>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-widest opacity-60">
                    {project.type}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ───────────────── 03 — SERVICES ───────────────── */}
        <section id="services" className="border-b border-black">
          <div className="flex items-baseline gap-4 border-b border-black px-4 py-4 sm:px-6">
            <span className="text-sm font-bold text-red-600">03</span>
            <h2 className="text-[11px] uppercase tracking-widest">Disciplines</h2>
          </div>
          <div>
            {SERVICES.map((service, i) => (
              <div
                key={service.index}
                className={`grid grid-cols-12 items-baseline gap-x-4 px-4 py-6 transition-colors hover:bg-black hover:text-white sm:px-6 ${
                  i > 0 ? "border-t border-black" : ""
                }`}
              >
                <span className="col-span-2 text-sm font-bold text-red-600 sm:col-span-1">
                  {service.index}
                </span>
                <h3 className="col-span-10 text-xl font-bold uppercase tracking-tight sm:col-span-4 sm:text-2xl">
                  {service.name}
                </h3>
                <p className="col-span-10 col-start-3 mt-2 text-sm leading-relaxed sm:col-span-5 sm:col-start-auto sm:mt-0">
                  {service.detail}
                </p>
                <p className="col-span-10 col-start-3 mt-2 text-[11px] uppercase tracking-widest sm:col-span-2 sm:col-start-auto sm:mt-0 sm:text-right">
                  {service.scope}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────────── 04 — RECOGNITION ───────────────── */}
        <section id="recognition" className="border-b border-black">
          <div className="flex items-baseline gap-4 border-b border-black px-4 py-4 sm:px-6">
            <span className="text-sm font-bold text-red-600">04</span>
            <h2 className="text-[11px] uppercase tracking-widest">Awards &amp; Press</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <ul className="lg:col-span-8 lg:border-r lg:border-black">
              {RECOGNITION.map((item, i) => (
                <li
                  key={`${item.year}-${item.project}`}
                  className={`grid grid-cols-12 gap-x-4 px-4 py-4 text-sm sm:px-6 ${
                    i > 0 ? "border-t border-black" : ""
                  }`}
                >
                  <span className="col-span-2 font-bold sm:col-span-1">{item.year}</span>
                  <span className="col-span-10 sm:col-span-8">{item.award}</span>
                  <span className="col-span-10 col-start-3 text-[11px] uppercase tracking-widest text-red-600 sm:col-span-3 sm:col-start-auto sm:text-right">
                    {item.project}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-black px-4 py-6 sm:px-6 lg:col-span-4 lg:border-t-0">
              <p className="text-[11px] uppercase tracking-widest">Published In</p>
              <ul className="mt-4 space-y-2">
                {PRESS.map((title) => (
                  <li key={title} className="text-sm font-bold uppercase tracking-tight">
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ───────────────── 05 — CONTACT ───────────────── */}
        <section id="contact" className="border-b border-black">
          <div className="flex items-baseline gap-4 border-b border-black px-4 py-4 sm:px-6">
            <span className="text-sm font-bold text-red-600">05</span>
            <h2 className="text-[11px] uppercase tracking-widest">Commissions 2027 —</h2>
          </div>
          <div className="px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="text-7xl font-bold uppercase leading-[0.9] tracking-tighter sm:text-8xl lg:text-9xl">
              Let&apos;s
              <br />
              Build
              <span className="ml-2 inline-block h-[0.14em] w-[0.14em] bg-red-600 align-baseline" />
            </h2>
            <a
              href="mailto:studio@ateliermono.dk"
              className="mt-12 inline-block border-b-2 border-red-600 pb-1 text-xl font-bold tracking-tight transition-colors hover:bg-black hover:text-white sm:text-2xl"
            >
              studio@ateliermono.dk
            </a>
          </div>
          <div className="grid grid-cols-1 border-t border-black sm:grid-cols-2">
            <address className="px-4 py-6 text-sm not-italic leading-relaxed sm:px-6 sm:border-r sm:border-black">
              <p className="mb-2 text-[11px] uppercase tracking-widest text-red-600">Copenhagen</p>
              Glentevej 61, 2. sal
              <br />
              2400 København NV, Denmark
              <br />
              +45 31 14 28 06
            </address>
            <address className="border-t border-black px-4 py-6 text-sm not-italic leading-relaxed sm:border-t-0 sm:px-6">
              <p className="mb-2 text-[11px] uppercase tracking-widest text-red-600">Tokyo</p>
              2-8-11 Kanda Tsukasamachi
              <br />
              Chiyoda-ku, Tokyo 101-0048, Japan
              <br />
              +81 3 5577 6190
            </address>
          </div>
        </section>
      </main>

      {/* ───────────────── FOOTER ───────────────── */}
      <footer className="border-t border-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-[11px] uppercase tracking-widest sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="block h-2 w-2 bg-red-600" aria-hidden="true" />
            <span>© 2026 Atelier Mono ApS — CVR 38 44 12 90</span>
          </div>
          <div className="flex gap-6">
            {NAV_LINKS.slice(0, 3).map((link) => (
              <a key={link.index} href={link.href} className="hover:text-red-600">
                {link.index} {link.label}
              </a>
            ))}
          </div>
          <span>Copenhagen / Tokyo — All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
