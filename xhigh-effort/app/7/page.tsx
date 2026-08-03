import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgekit — Ephemeral preview environments from any branch",
  description:
    "Forgekit is a developer CLI + API that spins up isolated, production-like preview environments from any git branch in seconds. Deploy, share, tear down on merge.",
};

/* ---------------------------------- data ---------------------------------- */

const features = [
  {
    cmd: "forgekit deploy",
    title: "instant_envs",
    desc: "Cold-start a full preview environment in under 40s. Containers, database fork, seeded data — one command from any branch.",
    tag: "[core]",
  },
  {
    cmd: "forgekit secrets sync",
    title: "secrets_sync",
    desc: "Pull encrypted env vars from your vault into every preview. Scoped per-branch, rotated on teardown, never written to disk.",
    tag: "[core]",
  },
  {
    cmd: "auto on merge",
    title: "teardown_on_merge",
    desc: "Merged or closed the PR? The environment, DNS record, and database fork are gone in seconds. Zero orphaned infra, zero surprise bills.",
    tag: "[core]",
  },
  {
    cmd: "forgekit db fork",
    title: "db_branching",
    desc: "Copy-on-write forks of Postgres and MySQL. Every preview gets real data shape without touching production rows.",
    tag: "[beta]",
  },
  {
    cmd: "*.preview.forgekit.dev",
    title: "shareable_urls",
    desc: "Every deploy gets a stable HTTPS URL with optional password gate and SSO. Drop it in the PR, Slack, or a Linear ticket.",
    tag: "[core]",
  },
  {
    cmd: "forgekit logs -f",
    title: "live_logs_+_ssh",
    desc: "Tail structured logs, exec into any container, or port-forward straight from your terminal. It is your env — poke at it.",
    tag: "[core]",
  },
];

const stats = [
  { value: "38s", label: "median cold boot" },
  { value: "1.2M", label: "envs created / month" },
  { value: "99.98%", label: "deploy success rate" },
  { value: "$0", label: "cost of an idle env" },
];

const testimonials = [
  {
    type: "commit",
    hash: "a4f9c2e",
    author: "mara-okafor",
    role: "platform lead @ northwind",
    text: "removed our hand-rolled staging scripts (-2,400 LOC). forgekit boots a full env faster than our old one pulled images.",
  },
  {
    type: "pr-comment",
    hash: "#1842",
    author: "dvc-jensen",
    role: "senior eng @ lumber.io",
    text: "Reviewed on the preview URL instead of pulling the branch. Caught a checkout bug in 5 minutes that tests missed. Approving. LGTM.",
  },
  {
    type: "commit",
    hash: "c91b07d",
    author: "yuki-tanaka",
    role: "cto @ parcelbase",
    text: "ci: wire forgekit into PR pipeline. designers now QA every branch themselves. eng interruptions down ~60% in two sprints.",
  },
];

const pricing = [
  {
    name: "free",
    price: "$0",
    period: "/forever",
    featured: false,
    cta: "$ forgekit init",
    rows: [
      ["concurrent envs", "2"],
      ["env lifetime", "48h"],
      ["team seats", "3"],
      ["db forks", "—"],
      ["support", "community"],
    ],
  },
  {
    name: "pro",
    price: "$24",
    period: "/dev/mo",
    featured: true,
    cta: "$ forgekit upgrade pro",
    rows: [
      ["concurrent envs", "20"],
      ["env lifetime", "until merge"],
      ["team seats", "unlimited"],
      ["db forks", "included"],
      ["support", "next business day"],
    ],
  },
  {
    name: "team",
    price: "$199",
    period: "/org/mo",
    featured: false,
    cta: "$ forgekit contact sales",
    rows: [
      ["concurrent envs", "unlimited"],
      ["env lifetime", "custom TTLs"],
      ["team seats", "unlimited + SSO"],
      ["db forks", "included + PITR"],
      ["support", "slack channel, 4h SLA"],
    ],
  },
];

const trustedBy = [
  "northwind",
  "parcelbase",
  "lumber.io",
  "hexa.dev",
  "railgun",
  "okto labs",
  "ferrite",
];

/* ------------------------------- tiny pieces ------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-green-400/80 tracking-wider mb-3">
      <span className="text-gray-600">{"//"}</span> {children}
    </p>
  );
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="5.5"
        y="5.5"
        width="8"
        height="8"
        rx="1"
        stroke="currentColor"
      />
      <path
        d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"
        stroke="currentColor"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/* --------------------------------- page ----------------------------------- */

export default function ForgekitLanding() {
  return (
    <div className="min-h-screen w-full bg-[#0d1117] font-mono text-gray-300 selection:bg-green-400/30 selection:text-green-100">
      <style>{`
        @keyframes lp7-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .lp7-cursor { animation: lp7-blink 1.1s step-end infinite; }
        @keyframes lp7-pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .lp7-live-dot { animation: lp7-pulse-dot 1.6s ease-in-out infinite; }
      `}</style>

      {/* ------------------------------- nav ------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0d1117]/90 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2 text-sm">
            <span className="text-green-400">$</span>
            <span className="font-semibold text-gray-100">forgekit</span>
            <span className="hidden rounded border border-green-400/30 bg-green-400/10 px-1.5 py-0.5 text-[10px] leading-none text-green-400 sm:inline-block">
              v2.4.1
            </span>
          </a>
          <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm">
            <a
              href="#features"
              className="hidden text-gray-400 transition-colors hover:text-green-400 md:inline"
            >
              ./features
            </a>
            <a
              href="#pricing"
              className="hidden text-gray-400 transition-colors hover:text-green-400 md:inline"
            >
              ./pricing
            </a>
            <a
              href="#"
              className="text-gray-400 transition-colors hover:text-green-400"
            >
              docs
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-green-400"
            >
              <GitHubIcon />
              <span className="hidden sm:inline">github</span>
            </a>
            <span className="hidden cursor-pointer select-all items-center gap-2 rounded border border-gray-800 bg-[#161b22] px-2.5 py-1.5 text-xs text-gray-300 transition-colors hover:border-green-400/50 hover:text-green-400 sm:flex">
              <span className="text-gray-600">$</span> npm i -g forgekit
              <CopyIcon />
            </span>
          </div>
        </nav>
      </header>

      <main>
        {/* ------------------------------ hero ------------------------------ */}
        <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 text-center">
          {/* faint grid background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(48,54,61,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(48,54,61,0.25)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
          />

          <div className="relative">
            <p className="mb-5 inline-flex items-center gap-2 rounded border border-dashed border-gray-700 px-3 py-1 text-xs text-gray-400">
              <span className="lp7-live-dot inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
              forgekit 2.4 shipped: copy-on-write db forks{" "}
              <span className="text-green-400">[beta]</span>
            </p>

            <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-gray-100 sm:text-5xl">
              Every branch gets a<br className="hidden sm:block" />{" "}
              <span className="text-green-400">live environment.</span>
              <span className="lp7-cursor text-green-400">_</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
              Forgekit is a CLI + API that spins up ephemeral, production-like
              preview environments from any git branch — and tears them down
              when you merge. No staging queue. No &quot;works on my
              machine.&quot;
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#pricing"
                className="w-full rounded bg-green-400 px-6 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-green-300 sm:w-auto"
              >
                $ get started — free
              </a>
              <a
                href="#config"
                className="w-full rounded border border-gray-700 px-6 py-2.5 text-sm text-gray-300 transition-colors hover:border-green-400/60 hover:text-green-400 sm:w-auto"
              >
                read the docs &gt;
              </a>
            </div>

            {/* terminal window */}
            <div className="mx-auto mt-14 max-w-3xl rounded-md border border-gray-800 bg-[#010409] text-left shadow-[0_0_60px_-15px_rgba(74,222,128,0.15)]">
              <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-gray-500">
                  ~/projects/storefront — zsh
                </span>
              </div>
              <div className="overflow-x-auto p-4 sm:p-5">
                <pre className="text-xs leading-6 sm:text-sm sm:leading-7">
                  <code>
                    <span className="text-green-400">$</span>{" "}
                    <span className="text-gray-100">forgekit deploy</span>{" "}
                    <span className="text-cyan-400">--branch</span>{" "}
                    <span className="text-gray-100">feat/checkout</span>
                    {"\n"}
                    <span className="text-gray-500">
                      ▸ resolving branch...{" "}
                    </span>
                    <span className="text-gray-400">
                      feat/checkout @ 9f3ac1d
                    </span>
                    {"\n"}
                    <span className="text-green-400">✓</span>{" "}
                    <span className="text-gray-400">
                      build image
                    </span>{" "}
                    <span className="text-gray-600">
                      ································
                    </span>{" "}
                    <span className="text-gray-500">12.4s (cached)</span>
                    {"\n"}
                    <span className="text-green-400">✓</span>{" "}
                    <span className="text-gray-400">fork database</span>{" "}
                    <span className="text-gray-600">
                      ·····························
                    </span>{" "}
                    <span className="text-gray-500">3.1s (copy-on-write)</span>
                    {"\n"}
                    <span className="text-green-400">✓</span>{" "}
                    <span className="text-gray-400">sync secrets</span>{" "}
                    <span className="text-gray-600">
                      ······························
                    </span>{" "}
                    <span className="text-gray-500">0.8s (14 vars)</span>
                    {"\n"}
                    <span className="text-green-400">✓</span>{" "}
                    <span className="text-gray-400">provision env</span>{" "}
                    <span className="text-gray-600">
                      ·····························
                    </span>{" "}
                    <span className="text-gray-500">19.2s</span>
                    {"\n\n"}
                    <span className="text-gray-400">
                      environment ready in
                    </span>{" "}
                    <span className="text-green-400">35.5s</span>
                    {"\n\n"}
                    <span className="text-gray-500">→ url </span>
                    <span className="text-cyan-400 underline underline-offset-2">
                      https://feat-checkout.acme.preview.forgekit.dev
                    </span>
                    {"\n"}
                    <span className="text-gray-500">→ ttl </span>
                    <span className="text-gray-300">
                      auto-teardown on merge of
                    </span>{" "}
                    <span className="text-yellow-300">#482</span>
                    {"\n\n"}
                    <span className="text-green-400">$</span>{" "}
                    <span className="lp7-cursor inline-block h-3.5 w-2 translate-y-0.5 bg-green-400 align-baseline" />
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- trusted by --------------------------- */}
        <section className="border-y border-gray-800 bg-[#010409]/60">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <p className="mb-5 text-center text-xs tracking-widest text-gray-600">
              {"// trusted in CI pipelines at"}
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
              {trustedBy.map((name) => (
                <li
                  key={name}
                  className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-300"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------------------- features ---------------------------- */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionLabel>features</SectionLabel>
          <h2 className="max-w-2xl text-2xl font-bold text-gray-100 sm:text-3xl">
            Everything between <span className="text-green-400">git push</span>{" "}
            and &quot;LGTM&quot;
          </h2>
          <p className="mt-3 max-w-xl text-sm text-gray-400">
            Stop sharing one staging server like it is 2014. Forgekit gives
            every branch its own disposable copy of production.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-gray-800 bg-gray-800 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="group bg-[#0d1117] p-6 transition-colors hover:bg-[#161b22]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-cyan-400/80">
                    <span className="text-gray-600">$ </span>
                    {f.cmd}
                  </p>
                  <span
                    className={`shrink-0 text-[10px] ${
                      f.tag === "[beta]" ? "text-yellow-300" : "text-gray-600"
                    }`}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-gray-100 transition-colors group-hover:text-green-400">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                  {f.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------------- config sample -------------------------- */}
        <section id="config" className="border-y border-gray-800 bg-[#010409]/60">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <SectionLabel>configuration</SectionLabel>
              <h2 className="text-2xl font-bold text-gray-100 sm:text-3xl">
                One YAML file.
                <br />
                Zero infra tickets.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
                Drop a <span className="text-green-400">forgekit.yaml</span> in
                your repo root and every branch becomes deployable. Services,
                database forks, seed scripts, secrets scopes — all declared,
                all versioned with your code.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "auto-detected runtimes for Node, Go, Rust, Python, JVM",
                  "per-env resource limits so previews stay cheap",
                  "lifecycle hooks: seed, migrate, smoke-test",
                  "works with GitHub Actions, GitLab CI, Buildkite",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-gray-400">
                    <span className="text-green-400">&gt;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-gray-800 bg-[#010409]">
              <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5">
                <span className="text-xs text-gray-400">forgekit.yaml</span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <CopyIcon /> copy
                </span>
              </div>
              <div className="overflow-x-auto p-4 sm:p-5">
                <pre className="text-xs leading-6">
                  <code>
                    <span className="text-gray-600"># forgekit.yaml — previews for every branch</span>{"\n"}
                    <span className="text-cyan-400">version</span>
                    <span className="text-gray-500">:</span>{" "}
                    <span className="text-green-400">2</span>{"\n\n"}
                    <span className="text-cyan-400">env</span>
                    <span className="text-gray-500">:</span>{"\n"}
                    {"  "}<span className="text-cyan-400">name</span>
                    <span className="text-gray-500">:</span>{" "}
                    <span className="text-yellow-300">
                      &quot;{"{{ branch | slug }}"}&quot;
                    </span>{"\n"}
                    {"  "}<span className="text-cyan-400">ttl</span>
                    <span className="text-gray-500">:</span>{" "}
                    <span className="text-green-400">on-merge</span>{" "}
                    <span className="text-gray-600"># or 72h</span>{"\n\n"}
                    <span className="text-cyan-400">services</span>
                    <span className="text-gray-500">:</span>{"\n"}
                    {"  "}<span className="text-cyan-400">web</span>
                    <span className="text-gray-500">:</span>{"\n"}
                    {"    "}<span className="text-cyan-400">build</span>
                    <span className="text-gray-500">:</span>{" "}
                    <span className="text-yellow-300">./Dockerfile</span>{"\n"}
                    {"    "}<span className="text-cyan-400">port</span>
                    <span className="text-gray-500">:</span>{" "}
                    <span className="text-green-400">3000</span>{"\n"}
                    {"    "}<span className="text-cyan-400">cpu</span>
                    <span className="text-gray-500">:</span>{" "}
                    <span className="text-green-400">0.5</span>{"\n\n"}
                    <span className="text-cyan-400">database</span>
                    <span className="text-gray-500">:</span>{"\n"}
                    {"  "}<span className="text-cyan-400">engine</span>
                    <span className="text-gray-500">:</span>{" "}
                    <span className="text-yellow-300">postgres@16</span>{"\n"}
                    {"  "}<span className="text-cyan-400">fork_from</span>
                    <span className="text-gray-500">:</span>{" "}
                    <span className="text-yellow-300">staging</span>{" "}
                    <span className="text-gray-600"># copy-on-write</span>{"\n\n"}
                    <span className="text-cyan-400">hooks</span>
                    <span className="text-gray-500">:</span>{"\n"}
                    {"  "}<span className="text-cyan-400">post_deploy</span>
                    <span className="text-gray-500">:</span>{"\n"}
                    {"    "}<span className="text-gray-500">-</span>{" "}
                    <span className="text-yellow-300">npm run db:migrate</span>{"\n"}
                    {"    "}<span className="text-gray-500">-</span>{" "}
                    <span className="text-yellow-300">npm run seed:demo</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ stats ------------------------------ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="mb-8 text-center text-xs tracking-widest text-gray-600">
            {"// benchmarks — last 30 days, all regions"}
          </p>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-gray-800 bg-gray-800 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-[#0d1117] px-6 py-8 text-center transition-colors hover:bg-[#161b22]"
              >
                <p className="text-2xl font-bold text-green-400 sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-2 text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --------------------------- testimonials -------------------------- */}
        <section className="border-y border-gray-800 bg-[#010409]/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionLabel>git log --grep=&quot;forgekit&quot;</SectionLabel>
            <h2 className="text-2xl font-bold text-gray-100 sm:text-3xl">
              Shipped by people who hate staging
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure
                  key={t.hash}
                  className="flex flex-col rounded-md border border-gray-800 bg-[#0d1117] transition-colors hover:border-green-400/40"
                >
                  <div className="flex items-center gap-2 border-b border-dashed border-gray-800 px-4 py-2.5 text-xs">
                    {t.type === "commit" ? (
                      <>
                        <span className="text-yellow-300">commit</span>
                        <span className="text-gray-500">{t.hash}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-green-400">✓ approved</span>
                        <span className="text-gray-500">PR {t.hash}</span>
                      </>
                    )}
                  </div>
                  <blockquote className="flex-1 px-4 py-4 text-xs leading-relaxed text-gray-300">
                    {t.text}
                  </blockquote>
                  <figcaption className="border-t border-gray-800 px-4 py-3 text-[11px]">
                    <span className="text-cyan-400">@{t.author}</span>{" "}
                    <span className="text-gray-600">— {t.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------- pricing ----------------------------- */}
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionLabel>pricing</SectionLabel>
          <h2 className="text-2xl font-bold text-gray-100 sm:text-3xl">
            Pay for builds, not for idle
          </h2>
          <p className="mt-3 max-w-xl text-sm text-gray-400">
            Environments hibernate when nobody is looking at them. You are
            never billed for a preview that is asleep.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-md border bg-[#0d1117] ${
                  plan.featured
                    ? "border-green-400/60 shadow-[0_0_40px_-12px_rgba(74,222,128,0.3)]"
                    : "border-gray-800"
                }`}
              >
                <div className="border-b border-gray-800 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-100">
                      <span className="text-gray-600">~/</span>
                      {plan.name}
                    </h3>
                    {plan.featured && (
                      <span className="rounded border border-green-400/40 bg-green-400/10 px-1.5 py-0.5 text-[10px] text-green-400">
                        [most popular]
                      </span>
                    )}
                  </div>
                  <p className="mt-3">
                    <span className="text-3xl font-bold text-gray-100">
                      {plan.price}
                    </span>
                    <span className="text-xs text-gray-500">{plan.period}</span>
                  </p>
                </div>
                <table className="w-full flex-1 text-xs">
                  <tbody>
                    {plan.rows.map(([k, v]) => (
                      <tr
                        key={k}
                        className="border-b border-dashed border-gray-800/70 last:border-0"
                      >
                        <td className="px-5 py-2.5 text-gray-500">{k}</td>
                        <td className="px-5 py-2.5 text-right text-gray-200">
                          {v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-5">
                  <a
                    href="#"
                    className={`block w-full rounded px-4 py-2.5 text-center text-xs font-semibold transition-colors ${
                      plan.featured
                        ? "bg-green-400 text-[#0d1117] hover:bg-green-300"
                        : "border border-gray-700 text-gray-300 hover:border-green-400/60 hover:text-green-400"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------- CTA ------------------------------- */}
        <section className="border-t border-gray-800 bg-[#010409]/60">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
            <p className="text-xs tracking-widest text-gray-600">
              {"// ready when you are"}
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-bold text-gray-100 sm:text-4xl">
              Your next PR deserves its own URL
              <span className="lp7-cursor text-green-400">_</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-gray-400">
              Free for 2 concurrent environments. No credit card. First deploy
              in under a minute.
            </p>
            <div className="mx-auto mt-8 inline-flex max-w-full flex-col items-center gap-3 sm:flex-row">
              <span className="max-w-full cursor-pointer select-all items-center gap-3 overflow-x-auto rounded border border-gray-700 bg-[#010409] px-5 py-3 text-sm text-gray-200 transition-colors hover:border-green-400/60 inline-flex">
                <span className="text-green-400">$</span> npm i -g forgekit
                &amp;&amp; forgekit init
                <span className="text-gray-600">
                  <CopyIcon />
                </span>
              </span>
              <a
                href="#"
                className="w-full rounded bg-green-400 px-6 py-3 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-green-300 sm:w-auto"
              >
                create account &gt;
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------ footer ------------------------------ */}
      <footer className="border-t border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm">
                <span className="text-green-400">$</span>{" "}
                <span className="font-semibold text-gray-100">forgekit</span>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                Ephemeral preview environments from any branch. Built by
                infrastructure engineers tired of staging.
              </p>
              <p className="mt-4 flex items-center gap-2 text-[11px] text-gray-600">
                <span className="lp7-live-dot inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                all systems operational
              </p>
            </div>
            {[
              {
                head: "product",
                links: ["cli reference", "api docs", "changelog", "status"],
              },
              {
                head: "company",
                links: ["about", "blog", "careers [hiring]", "security"],
              },
              {
                head: "legal",
                links: ["privacy", "terms", "dpa", "subprocessors"],
              },
            ].map((col) => (
              <div key={col.head}>
                <p className="text-xs tracking-widest text-gray-600">
                  {"// "}
                  {col.head}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-xs text-gray-400 transition-colors hover:text-green-400"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-dashed border-gray-800 pt-6 text-[11px] text-gray-600 sm:flex-row sm:items-center">
            <p>© 2026 Forgekit Systems, Inc. — all data on this page is fake.</p>
            <p>
              exit code <span className="text-green-400">0</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
