import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Northbeam — See exactly where your revenue comes from",
  description:
    "Northbeam is the product analytics platform for B2B teams. Trace every dollar of revenue back to the features, funnels, and campaigns that created it.",
};

/* ---------- Small building blocks ---------- */

function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" className="fill-indigo-600" />
      <path
        d="M7 16.5V7.5l10 9v-9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true">
      <path
        d="M4 10.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Fake dashboard mockup (pure CSS / inline SVG) ---------- */

function DashboardMockup() {
  const bars = [34, 52, 41, 63, 48, 74, 58, 82, 69, 91, 78, 96];
  const sidebarItems = ["Overview", "Revenue", "Funnels", "Cohorts", "Attribution", "Alerts"];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <div className="mx-auto hidden rounded-md border border-slate-200 bg-white px-16 py-1 text-[10px] text-slate-400 sm:block">
          app.northbeam.io/revenue
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-44 shrink-0 border-r border-slate-200 bg-slate-50/60 p-3 md:block">
          <div className="mb-4 flex items-center gap-2 px-2">
            <Logo className="h-4 w-4" />
            <span className="text-xs font-semibold text-slate-900">Northbeam</span>
          </div>
          <div className="space-y-1">
            {sidebarItems.map((item, i) => (
              <div
                key={item}
                className={`rounded-md px-2 py-1.5 text-[11px] ${
                  i === 1
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-slate-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "MRR attributed", value: "$412.6k", delta: "+12.4%" },
              { label: "Active accounts", value: "8,291", delta: "+6.1%" },
              { label: "Net revenue retention", value: "127%", delta: "+3.2%" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-slate-200 p-3">
                <div className="truncate text-[10px] text-slate-400">{kpi.label}</div>
                <div className="mt-1 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                  {kpi.value}
                </div>
                <div className="mt-0.5 text-[10px] font-medium text-emerald-600">{kpi.delta}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="mt-3 rounded-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-slate-700">Revenue by feature cohort</div>
              <div className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400">
                Last 12 weeks
              </div>
            </div>
            <div className="mt-3 flex h-24 items-end gap-1.5 sm:h-28 sm:gap-2">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-indigo-100" style={{ height: `${h}%` }}>
                  <div
                    className="w-full rounded-t-sm bg-indigo-600"
                    style={{ height: `${Math.round(h * 0.6)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-slate-300">
              <span>Mar 16</span>
              <span>Apr 13</span>
              <span>May 11</span>
              <span>Jun 8</span>
            </div>
          </div>

          {/* Sparkline + table row */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-[11px] font-medium text-slate-700">Expansion revenue</div>
              <svg viewBox="0 0 200 56" className="mt-2 h-14 w-full" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M0 44 L20 40 L40 42 L60 33 L80 36 L100 26 L120 29 L140 18 L160 21 L180 10 L200 6"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M0 44 L20 40 L40 42 L60 33 L80 36 L100 26 L120 29 L140 18 L160 21 L180 10 L200 6 L200 56 L0 56 Z"
                  fill="#4f46e5"
                  opacity="0.08"
                />
              </svg>
            </div>
            <div className="hidden rounded-lg border border-slate-200 p-3 sm:block">
              <div className="text-[11px] font-medium text-slate-700">Top converting paths</div>
              <div className="mt-2 space-y-2">
                {[
                  { name: "Docs → Trial → Paid", w: "82%" },
                  { name: "Demo → Pilot → Paid", w: "64%" },
                  { name: "Referral → Trial → Paid", w: "47%" },
                ].map((row) => (
                  <div key={row.name}>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="truncate">{row.name}</span>
                      <span className="font-medium text-slate-600">{row.w}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: row.w }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page data ---------- */

const features = [
  {
    title: "Revenue attribution",
    body: "Connect every closed-won dollar to the exact features, sessions, and campaigns that drove it — down to the individual account.",
    icon: (
      <path d="M3 17l5-5 4 4 7-8M14 8h5v5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Funnels that explain themselves",
    body: "Every drop-off comes with the why: segment breakdowns, session replays, and the property that best predicts conversion.",
    icon: (
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Warehouse-native sync",
    body: "Two-way sync with Snowflake, BigQuery, and Redshift. Your data team keeps SQL; your PMs get answers in seconds.",
    icon: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" strokeWidth="1.8" />
        <path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Cohort intelligence",
    body: "Auto-generated cohorts surface which behaviors separate accounts that expand from accounts that churn — before renewal.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" strokeWidth="1.8" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.6a3.5 3.5 0 010 6.8M18.5 14.5c1.9 1 3 2.9 3 5.5" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Anomaly alerts",
    body: "Northbeam watches every metric for you and pings Slack the moment activation, usage, or revenue moves off-trend.",
    icon: (
      <path d="M12 3a6 6 0 016 6c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6a6 6 0 016-6zM9.5 19a2.5 2.5 0 005 0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Privacy by default",
    body: "SOC 2 Type II, GDPR-ready, EU data residency, and field-level PII redaction. Ship analytics your legal team signs off on.",
    icon: (
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

const stats = [
  { value: "2.4B", label: "events processed daily" },
  { value: "1,900+", label: "B2B teams on Northbeam" },
  { value: "31%", label: "median lift in trial conversion" },
  { value: "99.99%", label: "ingestion uptime, last 12 months" },
];

const testimonials = [
  {
    quote:
      "We replaced three tools and a 400-line dbt model with Northbeam. For the first time, the board deck and the product roadmap are built from the same numbers.",
    name: "Priya Raghavan",
    role: "VP of Product, Ferrowave",
    initials: "PR",
  },
  {
    quote:
      "Attribution used to be a quarterly archaeology project. Now I can tell you which feature drove last week’s expansion revenue in about four clicks.",
    name: "Marcus Idehen",
    role: "Head of Growth, Lattisview",
    initials: "MI",
  },
];

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    blurb: "For early teams instrumenting their first funnels.",
    cta: "Start free",
    featured: false,
    items: [
      "Up to 100k events / month",
      "3 seats included",
      "Core funnels & retention",
      "Community support",
    ],
  },
  {
    name: "Growth",
    price: "$249",
    period: "/mo",
    blurb: "For teams tying product usage to pipeline and revenue.",
    cta: "Start 14-day trial",
    featured: true,
    items: [
      "Up to 10M events / month",
      "Unlimited seats",
      "Revenue attribution & cohorts",
      "Warehouse sync (hourly)",
      "Slack anomaly alerts",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    blurb: "For organizations with scale, security, and SLA needs.",
    cta: "Talk to sales",
    featured: false,
    items: [
      "Unlimited events",
      "SSO / SAML & SCIM",
      "EU data residency",
      "Dedicated success engineer",
      "99.99% uptime SLA",
    ],
  },
];

const footerCols = [
  {
    heading: "Product",
    links: ["Revenue attribution", "Funnels", "Cohorts", "Alerts", "Integrations", "Changelog"],
  },
  {
    heading: "Company",
    links: ["About", "Customers", "Careers", "Press", "Contact"],
  },
  {
    heading: "Resources",
    links: ["Docs", "API reference", "Guides", "Benchmarks report", "Status"],
  },
  {
    heading: "Legal",
    links: ["Privacy", "Terms", "DPA", "Security", "Subprocessors"],
  },
];

/* ---------- Page ---------- */

export default function NorthbeamLanding() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-500 antialiased">
      {/* ===== Sticky nav ===== */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-base font-semibold tracking-tight text-slate-900">Northbeam</span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-slate-500 transition-colors hover:text-slate-900">Product</a>
            <a href="#customers" className="text-slate-500 transition-colors hover:text-slate-900">Customers</a>
            <a href="#pricing" className="text-slate-500 transition-colors hover:text-slate-900">Pricing</a>
            <a href="#" className="text-slate-500 transition-colors hover:text-slate-900">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="hidden text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:block">
              Sign in
            </a>
            <a
              href="#pricing"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
            >
              Start free
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              New: Warehouse-native attribution is now GA
              <span aria-hidden="true" className="text-slate-400">→</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tighter text-slate-900 sm:text-6xl">
              See exactly where your revenue comes from
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
              Northbeam connects product usage to pipeline and revenue, so every roadmap
              decision is backed by dollars — not dashboards full of vanity metrics.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#pricing"
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 sm:w-auto"
              >
                Start free — no credit card
              </a>
              <a
                href="#features"
                className="w-full rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Book a live demo
              </a>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div
              aria-hidden="true"
              className="absolute -inset-x-8 -top-10 h-48 rounded-full bg-gradient-to-r from-indigo-100/60 via-slate-100 to-indigo-100/60 blur-3xl"
            />
            <div className="relative">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ===== Trusted by ===== */}
        <section className="border-y border-slate-200 bg-slate-50/50">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-400">
              Trusted by product teams at
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
              {["Ferrowave", "Lattisview", "Quillstack", "Orbital", "Hexaform", "Driftline"].map((brand) => (
                <span
                  key={brand}
                  className="text-base font-semibold tracking-tight text-slate-400 transition-colors hover:text-slate-600 sm:text-lg"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Features ===== */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Product</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Everything between an event and a dollar
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              One platform that takes you from raw clickstream to board-ready revenue
              insight — without a six-month data project.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Stats band ===== */}
        <section className="border-y border-slate-200 bg-slate-50/50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-6 py-16 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {s.value}
                </div>
                <div className="mx-auto mt-2 max-w-[12rem] text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Testimonials ===== */}
        <section id="customers" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Customers</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Loved by teams that answer to revenue
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <blockquote className="text-base leading-relaxed text-slate-600">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="text-sm text-slate-500">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ===== Pricing ===== */}
        <section id="pricing" className="border-t border-slate-200 bg-slate-50/50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Pricing</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Simple pricing that scales with you
              </h2>
              <p className="mt-4 text-base text-slate-500">
                Start free, upgrade when revenue attribution starts paying for itself.
                Annual plans save 20%.
              </p>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-xl border bg-white p-8 ${
                    tier.featured
                      ? "border-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-indigo-600"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {tier.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-base font-semibold tracking-tight text-slate-900">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight text-slate-900">{tier.price}</span>
                    {tier.period && <span className="text-sm text-slate-500">{tier.period}</span>}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{tier.blurb}</p>
                  <ul className="mt-7 space-y-3 text-sm text-slate-600">
                    {tier.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckIcon />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#"
                    className={`mt-8 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                      tier.featured
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Final CTA ===== */}
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-6 py-24 text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Stop guessing which features make money
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
              Instrument in an afternoon, see your first revenue attribution report
              before your next standup. Free for up to 100k events a month.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#pricing"
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 sm:w-auto"
              >
                Get started for free
              </a>
              <a
                href="#"
                className="w-full rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Talk to sales
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <Logo />
                <span className="text-base font-semibold tracking-tight text-slate-900">Northbeam</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
                The product analytics platform that traces every dollar of revenue back
                to the product decisions that earned it.
              </p>
            </div>
            {footerCols.map((col) => (
              <div key={col.heading}>
                <h4 className="text-sm font-semibold text-slate-900">{col.heading}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
            <p className="text-sm text-slate-400">© 2026 Northbeam Analytics, Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
