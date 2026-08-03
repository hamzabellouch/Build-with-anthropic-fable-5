import Link from "next/link";

const pages = [
  {
    href: "/1",
    brand: "Northbeam",
    theme: "Clean SaaS minimal",
    blurb: "B2B product analytics — white, slate, single indigo accent, Linear/Stripe feel.",
    swatch: "bg-indigo-600",
  },
  {
    href: "/2",
    brand: "NEONDRIFT",
    theme: "Synthwave neon dark",
    blurb: "Browser synth studio — near-black, fuchsia/cyan glows, retro grid horizon.",
    swatch: "bg-fuchsia-500",
  },
  {
    href: "/3",
    brand: "Wildroot",
    theme: "Earthy botanical",
    blurb: "Organic skincare — cream, forest green, terracotta, serif headlines, leaf SVGs.",
    swatch: "bg-emerald-800",
  },
  {
    href: "/4",
    brand: "Aurelius Private",
    theme: "Old-money luxury",
    blurb: "Private wealth — charcoal black, champagne gold hairlines, thin serif, restraint.",
    swatch: "bg-[#c9a96a]",
  },
  {
    href: "/5",
    brand: "PixelPunch Arcade",
    theme: "Neo-brutalist arcade",
    blurb: "Indie game studio — loud yellow, thick black borders, hard offset shadows.",
    swatch: "bg-yellow-300",
  },
  {
    href: "/6",
    brand: "Driftaway",
    theme: "Sunset glassmorphism",
    blurb: "Travel app — sky-to-peach gradients, frosted glass cards, floating clouds.",
    swatch: "bg-sky-400",
  },
  {
    href: "/7",
    brand: "Forgekit",
    theme: "Terminal hacker",
    blurb: "Dev CLI for preview envs — GitHub-dark, all monospace, green prompt accents.",
    swatch: "bg-green-500",
  },
  {
    href: "/8",
    brand: "Bloomly",
    theme: "Pastel playful",
    blurb: "Kids learning app — lavender/mint blobs, bubbly rounded cards, SVG mascots.",
    swatch: "bg-purple-300",
  },
  {
    href: "/9",
    brand: "ATELIER MONO",
    theme: "Swiss typographic",
    blurb: "Architecture studio — stark black on white, monumental type, hairline grid, red dot.",
    swatch: "bg-red-600",
  },
  {
    href: "/10",
    brand: "Ember & Oak",
    theme: "Warm editorial",
    blurb: "Coffee roastery — espresso browns, cream bands, magazine serif, drop caps.",
    swatch: "bg-amber-700",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex-1 bg-zinc-50 text-zinc-900 font-sans">
      <main className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">
          Landing page directory
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          10 themes, 10 brands
        </h1>
        <p className="mt-3 max-w-xl text-zinc-500">
          A showcase of distinct landing page designs. Every brand and all data
          are fictional.
        </p>
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pages.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${p.swatch}`} />
                  <span className="font-semibold">{p.brand}</span>
                  <span className="ml-auto text-sm text-zinc-400 group-hover:text-zinc-600">
                    {p.href}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-700">
                  {p.theme}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{p.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
