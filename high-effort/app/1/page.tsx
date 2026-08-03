import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Lumenpay — Instant Global Payments Infrastructure",
  description:
    "Move money across 140+ countries in seconds. Lumenpay is the payments platform built for modern finance teams — one API, every currency, zero friction.",
};

const features = [
  {
    title: "Instant Settlement",
    body: "Payments land in seconds, not days. Our rail-agnostic routing engine picks the fastest path across SEPA, FedNow, UPI, and 40+ local networks.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "One Global API",
    body: "A single integration for payouts, collections, and FX in 87 currencies. Idempotent, versioned, and documented like we actually care — because we do.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13 4l-2 16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Smart FX Engine",
    body: "Mid-market rates with transparent, locked-in pricing. Auto-hedging shields your margins from volatility while you sleep.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 17l5-6 4 4 6-8 3 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 21h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Bank-Grade Security",
    body: "SOC 2 Type II, PCI DSS Level 1, and end-to-end encryption by default. Funds are safeguarded in tier-1 banking partners worldwide.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3 4 6v6c0 4.4 3.4 8.4 8 9 4.6-.6 8-4.6 8-9V6l-8-3z" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Real-Time Treasury",
    body: "Multi-currency balances, automated sweeps, and live cash visibility across every entity — all from one dashboard your CFO will love.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M8 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Compliance, Automated",
    body: "KYC, KYB, and sanctions screening built into every transaction flow. Launch in new markets without hiring a new legal team.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="m10 12 1.5 1.5L15 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const stats = [
  { value: "$8.2B+", label: "processed annually" },
  { value: "140+", label: "countries supported" },
  { value: "<3s", label: "median settlement time" },
  { value: "99.99%", label: "platform uptime" },
];

const logos = ["Northwind", "Vexel", "Orbita", "Kitefin", "Draftly", "Hexa Labs"];

export default function LumenpayLanding() {
  return (
    <div className={`${grotesk.className} min-h-screen bg-[#05060a] text-slate-200 antialiased selection:bg-violet-500/30 selection:text-white`}>
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05060a]/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-600 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-white" stroke="currentColor" strokeWidth="2.2">
                <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7z" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">Lumenpay</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-white">Product</a>
            <a href="#stats" className="transition hover:text-white">Network</a>
            <a href="#testimonials" className="transition hover:text-white">Customers</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="hidden rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:text-white sm:block">
              Sign in
            </a>
            <a
              href="#pricing"
              className="rounded-lg bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition hover:shadow-[0_0_36px_rgba(99,102,241,0.55)]"
            >
              Get started
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* glow backdrop */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-20rem] h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500/20 via-indigo-500/15 to-violet-600/20 blur-3xl" />
            <div className="absolute bottom-[-10rem] right-[-10rem] h-[24rem] w-[24rem] rounded-full bg-violet-600/10 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-24 text-center sm:pt-32">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Now live in Brazil, Nigeria &amp; Vietnam
            </span>
            <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-7xl">
              Move money at the{" "}
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
                speed of light
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Lumenpay is the payments infrastructure for ambitious companies. Send, receive, and hold funds in
              87 currencies across 140+ countries — settled in seconds, through one elegant API.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#pricing"
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] transition hover:scale-[1.02] hover:shadow-[0_0_56px_rgba(99,102,241,0.6)] sm:w-auto"
              >
                Start building free
              </a>
              <a
                href="#features"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-slate-200 backdrop-blur transition hover:border-white/25 hover:bg-white/10 sm:w-auto"
              >
                Talk to sales →
              </a>
            </div>

            {/* mock dashboard card */}
            <div className="relative mx-auto mt-20 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-[0_8px_80px_rgba(80,90,255,0.15)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <span className="text-xs text-slate-500">lumenpay.com/dashboard</span>
              </div>
              <div className="grid gap-6 pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Total balance</p>
                  <p className="mt-1 text-2xl font-semibold text-white">$4,829,310.42</p>
                  <p className="mt-1 text-xs text-emerald-400">▲ 12.4% this month</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Payout · USD → BRL</p>
                  <p className="mt-1 text-2xl font-semibold text-white">R$ 182,400</p>
                  <p className="mt-1 text-xs text-sky-400">Settled in 2.1s</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Active corridors</p>
                  <p className="mt-1 text-2xl font-semibold text-white">38</p>
                  <p className="mt-1 text-xs text-slate-400">across 6 continents</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Logos strip ──────────────────────────────── */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-500">
              Trusted by finance teams at 2,400+ companies
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {logos.map((name) => (
                <span key={name} className="text-lg font-semibold tracking-wide text-slate-600 transition hover:text-slate-300">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────── */}
        <section id="features" className="relative mx-auto max-w-7xl px-6 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-400">Why Lumenpay</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Everything money movement{" "}
              <span className="bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text text-transparent">should be</span>
            </h2>
            <p className="mt-5 text-lg text-slate-400">
              We rebuilt cross-border payments from first principles so your team never has to think about rails,
              banks, or borders again.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.03] p-8 backdrop-blur transition hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-white/[0.05] hover:shadow-[0_8px_48px_rgba(99,102,241,0.15)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 text-sky-300 ring-1 ring-white/10 transition group-hover:from-sky-500/30 group-hover:to-violet-600/30 group-hover:text-sky-200">
                  {f.icon}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────── */}
        <section id="stats" className="relative border-y border-white/5">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/5 via-transparent to-violet-600/5" />
          <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-20 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="bg-gradient-to-r from-sky-300 to-violet-400 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────── */}
        <section id="testimonials" className="mx-auto max-w-7xl px-6 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-400">Customers</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-white">Loved by teams who move fast</h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {[
              {
                quote:
                  "We replaced three banking partners and a mess of CSV reconciliations with one Lumenpay integration. Payouts to 28 markets went from 4 days to 4 seconds — our sellers noticed immediately.",
                name: "Amara Okafor",
                role: "VP of Finance, Kitefin Marketplaces",
                initials: "AO",
              },
              {
                quote:
                  "The FX engine alone pays for the platform. We're saving roughly 80 basis points per transaction, and the treasury dashboard finally gives our CFO real-time visibility across every entity.",
                name: "Lucas Meijer",
                role: "Head of Payments, Orbita Travel",
                initials: "LM",
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border border-white/5 bg-white/[0.03] p-8 backdrop-blur transition hover:border-white/15"
              >
                <div className="flex gap-1 text-amber-400" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-5 text-base leading-relaxed text-slate-300">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-sm font-semibold text-white">
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── CTA banner ───────────────────────────────── */}
        <section id="pricing" className="mx-auto max-w-7xl px-6 pb-28">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-violet-600/15 px-8 py-16 text-center backdrop-blur-xl sm:px-16">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
            <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your first $50,000 in volume is on us
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-slate-300">
              No setup fees. No monthly minimums. Transparent per-transaction pricing from 0.4% — and a sandbox
              you can ship against in under five minutes.
            </p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#"
                className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[#05060a] transition hover:scale-[1.02] hover:bg-slate-100 sm:w-auto"
              >
                Create free account
              </a>
              <a
                href="#"
                className="w-full rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition hover:border-white/40 hover:bg-white/5 sm:w-auto"
              >
                View pricing
              </a>
            </div>
            <p className="relative mt-6 text-xs text-slate-500">No credit card required · SOC 2 Type II · Cancel anytime</p>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-600">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth="2.2">
                    <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7z" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-semibold text-white">Lumenpay</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                Payments infrastructure for the borderless economy. Headquartered in Amsterdam, operating everywhere.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-3">
              {[
                { heading: "Product", links: ["Payouts", "Collections", "FX & Treasury", "API Docs"] },
                { heading: "Company", links: ["About", "Careers", "Press", "Blog"] },
                { heading: "Legal", links: ["Privacy", "Terms", "Licenses", "Security"] },
              ].map((col) => (
                <div key={col.heading}>
                  <p className="font-semibold text-white">{col.heading}</p>
                  <ul className="mt-4 space-y-3">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-slate-500 transition hover:text-white">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-slate-600 sm:flex-row">
            <p>© 2026 Lumenpay B.V. All rights reserved. All data on this page is fictional.</p>
            <p>Licensed EMI · DNB &amp; FinCEN registered</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
