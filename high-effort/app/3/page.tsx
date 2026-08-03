import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HEXBIN — deploy like you mean it",
  description:
    "Hexbin is the CLI that ships your app before your CI pipeline finishes waking up. No YAML. No dashboards. No mercy.",
};

const SHOCK = "#ff2e88";
const ACID = "#e8ff2e";

function MarqueeStrip({ items, invert = false }: { items: string[]; invert?: boolean }) {
  const row = Array.from({ length: 3 }, () => items).flat();
  return (
    <div
      className={`overflow-hidden border-y-4 border-black py-2 ${
        invert ? "bg-black text-[#e8ff2e]" : "bg-[#e8ff2e] text-black"
      }`}
    >
      <div className="flex w-max whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="px-6 text-sm font-bold uppercase tracking-widest">
            {item} <span style={{ color: SHOCK }}>✶</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TerminalWindow() {
  return (
    <div className="border-4 border-black bg-black shadow-[10px_10px_0_#ff2e88]">
      <div className="flex items-center gap-2 border-b-4 border-black bg-[#e8ff2e] px-4 py-2">
        <span className="h-3 w-3 border-2 border-black bg-white" />
        <span className="h-3 w-3 border-2 border-black bg-[#ff2e88]" />
        <span className="h-3 w-3 border-2 border-black bg-black" />
        <span className="ml-auto text-xs font-bold uppercase text-black">~/prod — hexbin</span>
      </div>
      <div className="space-y-1.5 px-5 py-6 text-sm leading-relaxed">
        <p className="text-[#e8ff2e]">
          <span className="text-[#ff2e88]">$</span> hexbin deploy --env prod
        </p>
        <p className="text-white">▸ sniffing repo... found next.js (obviously)</p>
        <p className="text-white">▸ building... done in 9.4s</p>
        <p className="text-white">▸ provisioning edge nodes [██████████] 14/14</p>
        <p className="text-white">▸ ssl, dns, cdn: handled. stop asking.</p>
        <p className="text-[#e8ff2e]">
          ✔ live at <span className="underline">https://yourapp.hexb.in</span> (11.2s total)
        </p>
        <p className="text-zinc-500"># your old pipeline is still installing node_modules</p>
        <p className="text-[#e8ff2e]">
          <span className="text-[#ff2e88]">$</span> <span className="animate-pulse">█</span>
        </p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    num: "01",
    title: "ZERO YAML",
    body: "We read your repo and figure it out. If you miss writing 400 lines of indentation-sensitive config, see a therapist.",
    bg: "bg-white",
  },
  {
    num: "02",
    title: "11-SECOND DEPLOYS",
    body: "Push, deploy, done before your standup excuse is finished. Rollbacks are one keystroke because you WILL need them.",
    bg: "bg-[#e8ff2e]",
  },
  {
    num: "03",
    title: "EDGE EVERYWHERE",
    body: "14 regions, anycast routing, zero cold starts. Your app loads fast even for that one user in Antarctica.",
    bg: "bg-white",
  },
  {
    num: "04",
    title: "LOGS THAT DON'T LIE",
    body: "Live-tail structured logs in your terminal. No web console, no 45-second 'loading insights...' spinner.",
    bg: "bg-[#ff2e88]",
  },
  {
    num: "05",
    title: "PREVIEW EVERY BRANCH",
    body: "Every git branch gets a URL. Send it to your PM so they can break it before your users do.",
    bg: "bg-[#e8ff2e]",
  },
  {
    num: "06",
    title: "SECRETS, KEPT",
    body: "Encrypted env vars synced across your team. Nobody pastes the prod key in Slack ever again. Probably.",
    bg: "bg-white",
  },
];

const STEPS = [
  { n: "1", title: "INSTALL", body: "curl -fsSL hexb.in/yolo | sh — yes, pipe to shell. Live a little." },
  { n: "2", title: "POINT", body: "cd into literally any repo. Monorepo? Spaghetti? We've seen worse." },
  { n: "3", title: "DEPLOY", body: "hexbin deploy. That's the whole tutorial. The docs are mostly memes." },
  { n: "4", title: "BRAG", body: "Tell your team it took all sprint. We won't snitch. Invoice us later." },
];

const PLANS = [
  {
    name: "FREELOADER",
    price: "$0",
    period: "/forever",
    tagline: "For side projects you'll abandon in 3 weeks.",
    features: ["3 apps", "100GB bandwidth", "Preview deploys", "Community support (good luck)"],
    cta: "START FREE",
    featured: false,
  },
  {
    name: "SHIPPER",
    price: "$24",
    period: "/mo",
    tagline: "For people whose apps have actual users. Wild.",
    features: [
      "Unlimited apps",
      "1TB bandwidth",
      "Instant rollbacks",
      "Live log tail",
      "Human support, real ones",
    ],
    cta: "SHIP IT",
    featured: true,
  },
  {
    name: "CORPO",
    price: "$249",
    period: "/mo",
    tagline: "SSO, SLAs, and someone to yell at. The full enterprise cosplay.",
    features: ["Everything in Shipper", "SSO / SAML", "99.99% SLA", "Audit logs", "Priority everything"],
    cta: "TALK TO SALES",
    featured: false,
  },
];

export default function Page() {
  return (
    <div className={`${mono.className} min-h-screen bg-white text-black`}>
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b-4 border-black bg-[#e8ff2e]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="#" className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
              <polygon
                points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5"
                fill="#000"
                stroke="#000"
                strokeWidth="2"
              />
              <polygon points="16,8 23.5,12.25 23.5,19.75 16,24 8.5,19.75 8.5,12.25" fill={SHOCK} />
            </svg>
            <span className="text-xl font-extrabold uppercase tracking-tighter">HEXBIN</span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-bold uppercase md:flex">
            <a href="#features" className="hover:bg-black hover:text-[#e8ff2e]">
              Features
            </a>
            <a href="#how" className="hover:bg-black hover:text-[#e8ff2e]">
              How
            </a>
            <a href="#pricing" className="hover:bg-black hover:text-[#e8ff2e]">
              Pricing
            </a>
          </div>
          <a
            href="#pricing"
            className="border-2 border-black bg-[#ff2e88] px-4 py-2 text-sm font-extrabold uppercase shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000]"
          >
            Get the CLI
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section className="border-b-4 border-black bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-4 inline-block border-2 border-black bg-[#e8ff2e] px-3 py-1 text-xs font-bold uppercase shadow-[4px_4px_0_#000]">
              v3.2 — now 0% more YAML
            </p>
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] tracking-tighter md:text-7xl">
              Deploy
              <br />
              <span className="bg-black px-2 text-[#e8ff2e]">stupid</span>
              <br />
              fast.
            </h1>
            <p className="mt-6 max-w-md border-l-4 border-[#ff2e88] pl-4 text-base font-medium">
              Hexbin is the CLI that takes your repo from `git push` to production in 11 seconds.
              No dashboards. No config. No 47-step onboarding wizard. Just type the thing.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#pricing"
                className="border-4 border-black bg-[#e8ff2e] px-8 py-4 text-lg font-extrabold uppercase shadow-[6px_6px_0_#000] transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_#000]"
              >
                Install now
              </a>
              <a
                href="#how"
                className="border-4 border-black bg-white px-8 py-4 text-lg font-extrabold uppercase shadow-[6px_6px_0_#ff2e88] transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_#ff2e88]"
              >
                How it works
              </a>
            </div>
            <p className="mt-6 select-all border-2 border-dashed border-black bg-zinc-100 px-3 py-2 text-sm">
              $ curl -fsSL hexb.in/yolo | sh
            </p>
          </div>
          <TerminalWindow />
        </div>
      </section>

      <MarqueeStrip
        items={["NO YAML", "NO DASHBOARDS", "NO MEETINGS", "JUST DEPLOY", "11 SECONDS", "ZERO COLD STARTS"]}
      />

      {/* FEATURES */}
      <section id="features" className="border-b-4 border-black bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-2 text-4xl font-extrabold uppercase tracking-tighter md:text-5xl">
            Features<span style={{ color: SHOCK }}>_</span>
          </h2>
          <p className="mb-10 max-w-xl text-sm font-medium">
            Everything your platform team promised in Q1 of 2023. Delivered, in a binary, today.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.num}
                className={`border-4 border-black p-6 shadow-[6px_6px_0_#000] transition-transform hover:-translate-y-1 ${f.bg}`}
              >
                <div className="mb-4 inline-block border-2 border-black bg-black px-2 py-1 text-sm font-extrabold text-[#e8ff2e]">
                  {f.num}
                </div>
                <h3 className="mb-3 text-xl font-extrabold uppercase tracking-tight">{f.title}</h3>
                <p className="text-sm font-medium leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-b-4 border-black bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-10 text-4xl font-extrabold uppercase tracking-tighter text-[#e8ff2e] md:text-5xl">
            How it works<span style={{ color: SHOCK }}>_</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="border-4 border-[#e8ff2e] bg-black p-6 shadow-[6px_6px_0_#ff2e88]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-[#e8ff2e] text-2xl font-extrabold text-black">
                  {s.n}
                </div>
                <h3 className="mb-2 text-lg font-extrabold uppercase text-[#e8ff2e]">{s.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-300">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarqueeStrip invert items={["$ HEXBIN DEPLOY", "✔ LIVE IN 11s", "$ HEXBIN ROLLBACK", "✔ CRISIS AVERTED"]} />

      {/* PRICING */}
      <section id="pricing" className="border-b-4 border-black bg-[#e8ff2e]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-2 text-4xl font-extrabold uppercase tracking-tighter md:text-5xl">
            Pricing<span style={{ color: SHOCK }}>_</span>
          </h2>
          <p className="mb-10 max-w-xl text-sm font-medium">
            No "contact us" pricing mazes. Numbers, on a page, like civilized people.
          </p>
          <div className="grid items-start gap-8 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`border-4 border-black p-6 ${
                  p.featured
                    ? "relative bg-[#ff2e88] shadow-[10px_10px_0_#000] md:-translate-y-3"
                    : "bg-white shadow-[6px_6px_0_#000]"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-4 left-4 border-2 border-black bg-black px-3 py-1 text-xs font-extrabold uppercase text-[#e8ff2e]">
                    Most deployed
                  </span>
                )}
                <h3 className="text-xl font-extrabold uppercase tracking-tight">{p.name}</h3>
                <p className="mt-2 text-5xl font-extrabold tracking-tighter">
                  {p.price}
                  <span className="text-base font-bold">{p.period}</span>
                </p>
                <p className="mt-3 border-b-2 border-black pb-4 text-sm font-medium">{p.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm font-medium">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex gap-2">
                      <span className="font-extrabold">▸</span> {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`mt-6 block border-4 border-black py-3 text-center text-sm font-extrabold uppercase shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] ${
                    p.featured ? "bg-[#e8ff2e]" : "bg-white"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-b-4 border-black bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-4xl font-extrabold uppercase leading-tight tracking-tighter md:text-6xl">
            Stop reading.
            <br />
            <span className="bg-[#ff2e88] px-2">Start shipping.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-sm font-medium">
            Your competitors deployed twice while you read this page. Three times if they use Hexbin.
          </p>
          <a
            href="#pricing"
            className="mt-8 inline-block border-4 border-black bg-[#e8ff2e] px-10 py-5 text-xl font-extrabold uppercase shadow-[8px_8px_0_#000] transition-transform hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0_#000]"
          >
            $ hexbin deploy
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true">
                <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill={ACID} />
                <polygon points="16,8 23.5,12.25 23.5,19.75 16,24 8.5,19.75 8.5,12.25" fill={SHOCK} />
              </svg>
              <span className="text-lg font-extrabold uppercase tracking-tighter text-[#e8ff2e]">
                HEXBIN
              </span>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Deploy tooling for people with deadlines. Made with caffeine and spite.
            </p>
          </div>
          {[
            { h: "PRODUCT", links: ["CLI", "Edge Network", "Previews", "Changelog"] },
            { h: "DOCS", links: ["Quickstart", "Memes", "API Reference", "Status (it's fine)"] },
            { h: "COMPANY", links: ["About", "Blog", "Careers", "Legal-ish"] },
          ].map((col) => (
            <div key={col.h}>
              <h4 className="mb-3 border-b-2 border-[#ff2e88] pb-1 text-sm font-extrabold text-[#e8ff2e]">
                {col.h}
              </h4>
              <ul className="space-y-2 text-xs text-zinc-300">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:bg-[#e8ff2e] hover:text-black">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t-4 border-[#e8ff2e] py-4 text-center text-xs uppercase tracking-widest text-zinc-400">
          © 2026 Hexbin Industries — all data on this page is gloriously fake
        </div>
      </footer>
    </div>
  );
}
