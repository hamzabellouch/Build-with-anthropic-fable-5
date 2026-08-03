import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Synthral — Autonomous AI Agents for the Enterprise",
  description:
    "Deploy, orchestrate, and govern fleets of autonomous AI agents across your enterprise stack. Audited. Sandboxed. Relentless.",
};

const logLines: { time: string; level: "OK" | "RUN" | "SYS"; text: string }[] = [
  { time: "09:41:02.118", level: "SYS", text: "agent.fleet/billing-recon spawned — 14 workers" },
  { time: "09:41:02.341", level: "RUN", text: "ingesting ledger deltas from netsuite.prod (8,422 rows)" },
  { time: "09:41:03.005", level: "OK", text: "reconciled 8,419 / 8,422 — 3 anomalies escalated to human queue" },
  { time: "09:41:03.290", level: "RUN", text: "agent.fleet/sec-triage parsing 212 SIEM alerts" },
  { time: "09:41:04.114", level: "OK", text: "207 alerts auto-resolved · 5 promoted to P2 with full evidence chains" },
  { time: "09:41:04.508", level: "SYS", text: "policy.guardrail v3.2 verified — zero out-of-bounds tool calls" },
  { time: "09:41:05.001", level: "OK", text: "fleet heartbeat nominal · 1,284 agents · 0 interventions required" },
];

const capabilities = [
  {
    code: "MOD-01",
    title: "Agent Orchestration",
    body: "Compose multi-agent workflows with deterministic handoffs, retries, and rollback. One control plane for a thousand concurrent agents.",
  },
  {
    code: "MOD-02",
    title: "Policy Guardrails",
    body: "Every tool call is intercepted, evaluated, and logged against your policy graph before execution. Out-of-bounds actions never leave the sandbox.",
  },
  {
    code: "MOD-03",
    title: "Memory Fabric",
    body: "Shared, permission-aware long-term memory across your fleet. Agents learn your org once — and never forget on your behalf.",
  },
  {
    code: "MOD-04",
    title: "Human Escalation",
    body: "Confidence-thresholded escalation routes edge cases to the right human with full evidence chains. No silent failures, ever.",
  },
  {
    code: "MOD-05",
    title: "Audit Ledger",
    body: "Immutable, exportable record of every decision, prompt, and side effect. SOC 2 Type II and ISO 27001 evidence on tap.",
  },
  {
    code: "MOD-06",
    title: "Self-Healing Runtime",
    body: "Agents that crash, drift, or degrade are quarantined, diagnosed, and redeployed automatically — mean time to recovery under 900ms.",
  },
];

const metrics = [
  { value: "1.2M+", label: "agent_runs / day" },
  { value: "99.99%", label: "uptime_slo" },
  { value: "<900ms", label: "p99_recovery" },
  { value: "0", label: "ungoverned_calls" },
];

const integrations = [
  "SALESFORCE",
  "SNOWFLAKE",
  "SLACK",
  "JIRA",
  "NETSUITE",
  "DATADOG",
  "GITHUB",
  "WORKDAY",
  "SAP",
  "OKTA",
  "SERVICENOW",
  "POSTGRES",
];

const levelColor: Record<string, string> = {
  OK: "text-[#22ff88]",
  RUN: "text-cyan-400",
  SYS: "text-zinc-500",
};

function Divider() {
  return (
    <div
      aria-hidden
      className="overflow-hidden whitespace-nowrap font-mono text-[10px] leading-none text-[#22ff88]/20 select-none"
    >
      {"//".repeat(20)}
      {" [ SYNTHRAL :: SECURE CHANNEL ] "}
      {"\\\\".repeat(20)}
      {"//".repeat(20)}
    </div>
  );
}

export default function SynthralLanding() {
  return (
    <main
      className={`${spaceGrotesk.className} relative min-h-screen overflow-hidden bg-black text-zinc-300 antialiased`}
    >
      {/* Grid + scanline texture overlays */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 [background-image:linear-gradient(rgba(34,255,136,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,255,136,0.04)_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0px,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_3px)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[480px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(34,255,136,0.10),transparent_70%)]"
      />

      <div className="relative z-10">
        {/* ===== NAV ===== */}
        <header className="border-b border-[#22ff88]/15 bg-black/80 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
                <rect x="1" y="1" width="24" height="24" stroke="#22ff88" strokeWidth="1.5" />
                <path d="M7 17 L13 7 L19 17" stroke="#22ff88" strokeWidth="1.5" />
                <circle cx="13" cy="13" r="1.8" fill="#22ff88" />
              </svg>
              <span className="text-lg font-bold tracking-[0.2em] text-white">SYNTHRAL</span>
            </div>
            <div className="hidden items-center gap-8 font-mono text-xs tracking-widest text-zinc-400 md:flex">
              <a href="#capabilities" className="transition-colors hover:text-[#22ff88]">/CAPABILITIES</a>
              <a href="#console" className="transition-colors hover:text-[#22ff88]">/CONSOLE</a>
              <a href="#metrics" className="transition-colors hover:text-[#22ff88]">/BENCHMARKS</a>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 border border-[#22ff88]/30 bg-[#22ff88]/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-[#22ff88] sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping bg-[#22ff88] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 bg-[#22ff88]" />
                </span>
                ALL SYSTEMS OPERATIONAL
              </div>
              <a
                href="#cta"
                className="border border-[#22ff88] bg-[#22ff88] px-4 py-1.5 font-mono text-xs font-bold tracking-widest text-black transition-shadow hover:shadow-[0_0_30px_rgba(34,255,136,0.45)]"
              >
                ./REQUEST_ACCESS
              </a>
            </div>
          </nav>
        </header>

        {/* ===== HERO ===== */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28">
          <p className="mb-6 inline-block border border-[#22ff88]/25 px-3 py-1 font-mono text-[11px] tracking-[0.25em] text-[#22ff88]/80">
            v4.2.0 — FLEET RUNTIME GA · ENTERPRISE-GRADE AGENTIC INFRASTRUCTURE
          </p>
          <h1 className="max-w-4xl text-4xl leading-tight font-bold text-white sm:text-5xl md:text-6xl">
            <span className="font-mono text-[#22ff88]">&gt;</span> deploy autonomous agents
            <br />
            <span className="text-zinc-500">that your auditors</span>{" "}
            <span className="relative text-[#22ff88] [text-shadow:0_0_24px_rgba(34,255,136,0.5)]">
              actually trust
            </span>
            <span className="ml-2 inline-block h-[0.9em] w-[0.45em] translate-y-1 animate-pulse bg-[#22ff88] align-baseline" />
          </h1>
          <p className="mt-8 max-w-2xl font-mono text-sm leading-relaxed text-zinc-400">
            Synthral is the control plane for enterprise AI agents. Orchestrate thousand-agent
            fleets across your stack with hard policy guardrails, immutable audit trails, and
            sub-second self-healing. Built for the Fortune 500. Hardened for the paranoid.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#cta"
              className="border border-[#22ff88] bg-[#22ff88]/10 px-7 py-3 font-mono text-sm font-bold tracking-widest text-[#22ff88] shadow-[0_0_30px_rgba(34,255,136,0.15)] transition-all hover:bg-[#22ff88] hover:text-black hover:shadow-[0_0_40px_rgba(34,255,136,0.5)]"
            >
              $ synthral init --fleet
            </a>
            <a
              href="#console"
              className="border border-zinc-700 px-7 py-3 font-mono text-sm tracking-widest text-zinc-400 transition-colors hover:border-[#22ff88]/50 hover:text-[#22ff88]"
            >
              watch the console -&gt;
            </a>
          </div>
          <p className="mt-6 font-mono text-[11px] tracking-widest text-zinc-600">
            SOC 2 TYPE II · ISO 27001 · FEDRAMP IN PROCESS · ZERO DATA RETENTION MODE
          </p>
        </section>

        <Divider />

        {/* ===== AGENT CONSOLE MOCKUP ===== */}
        <section id="console" className="mx-auto max-w-6xl px-6 py-16">
          <div className="border border-[#22ff88]/25 bg-[#030a06] shadow-[0_0_30px_rgba(34,255,136,0.12)]">
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-[#22ff88]/20 bg-black/60 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#22ff88]/80" />
              </div>
              <span className="font-mono text-[11px] tracking-widest text-zinc-500">
                synthral://fleet-console — production — us-east-1
              </span>
              <span className="font-mono text-[11px] text-[#22ff88]">● LIVE</span>
            </div>
            {/* Log body */}
            <div className="space-y-1.5 px-5 py-5 font-mono text-[12px] leading-relaxed sm:text-[13px]">
              <p className="text-zinc-500">
                <span className="text-[#22ff88]">hani@synthral</span>:<span className="text-cyan-400">~/fleet</span>$ synthral fleet tail --all --follow
              </p>
              {logLines.map((line) => (
                <p key={line.time} className="flex gap-3 whitespace-pre-wrap">
                  <span className="shrink-0 text-zinc-600">{line.time}</span>
                  <span className={`shrink-0 ${levelColor[line.level]}`}>[{line.level.padEnd(3)}]</span>
                  <span className="text-zinc-300">{line.text}</span>
                </p>
              ))}
              <p className="flex items-center gap-2 pt-2 text-zinc-500">
                <span className="text-[#22ff88]">hani@synthral</span>:<span className="text-cyan-400">~/fleet</span>$
                <span className="inline-block h-3.5 w-2 animate-pulse bg-[#22ff88]" />
              </p>
            </div>
            {/* Status strip */}
            <div className="grid grid-cols-2 gap-px border-t border-[#22ff88]/20 bg-[#22ff88]/10 sm:grid-cols-4">
              {[
                ["AGENTS ONLINE", "1,284"],
                ["TASKS / MIN", "12,007"],
                ["GUARDRAIL HITS", "0"],
                ["HUMAN ESCALATIONS", "5"],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#030a06] px-4 py-3 text-center">
                  <p className="font-mono text-lg font-bold text-[#22ff88]">{value}</p>
                  <p className="font-mono text-[10px] tracking-widest text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CAPABILITIES ===== */}
        <section id="capabilities" className="mx-auto max-w-6xl px-6 py-16">
          <p className="font-mono text-xs tracking-[0.3em] text-[#22ff88]">[ 01 ] CAPABILITY MODULES</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            Everything a fleet needs. Nothing your CISO fears.
          </h2>
          <div className="mt-12 grid gap-px border border-[#22ff88]/15 bg-[#22ff88]/15 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => (
              <div
                key={cap.code}
                className="group relative bg-black p-7 transition-all duration-300 hover:bg-[#04120a] hover:shadow-[0_0_30px_rgba(34,255,136,0.25)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-600 group-hover:text-[#22ff88]">
                    {cap.code}
                  </span>
                  <span className="font-mono text-xs text-[#22ff88]/0 transition-all group-hover:text-[#22ff88]">
                    -&gt;
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{cap.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400">
                  {cap.body}
                </p>
                <span className="absolute top-0 left-0 h-px w-0 bg-[#22ff88] transition-all duration-300 group-hover:w-full" />
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* ===== BENCHMARKS ===== */}
        <section id="metrics" className="mx-auto max-w-6xl px-6 py-16">
          <p className="font-mono text-xs tracking-[0.3em] text-[#22ff88]">[ 02 ] BENCHMARKS</p>
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="border border-[#22ff88]/20 bg-[#22ff88]/[0.03] px-6 py-8 text-center transition-shadow hover:shadow-[0_0_30px_rgba(34,255,136,0.2)]"
              >
                <p className="font-mono text-3xl font-bold text-[#22ff88] [text-shadow:0_0_18px_rgba(34,255,136,0.4)] sm:text-4xl">
                  {m.value}
                </p>
                <p className="mt-2 font-mono text-[11px] tracking-widest text-zinc-500">{m.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-right font-mono text-[10px] tracking-widest text-zinc-700">
            * MEASURED ACROSS PRODUCTION FLEETS, TRAILING 90 DAYS
          </p>
        </section>

        {/* ===== INTEGRATIONS ===== */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <p className="font-mono text-xs tracking-[0.3em] text-[#22ff88]">[ 03 ] CONNECTED SYSTEMS</p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Plugs into the stack you already run.
          </h2>
          <div className="mt-10 flex flex-wrap gap-3">
            {integrations.map((name) => (
              <span
                key={name}
                className="border border-zinc-800 bg-zinc-950 px-4 py-2 font-mono text-xs tracking-[0.2em] text-zinc-400 transition-all hover:border-[#22ff88]/50 hover:text-[#22ff88] hover:shadow-[0_0_30px_rgba(34,255,136,0.15)]"
              >
                {name}
              </span>
            ))}
            <span className="border border-dashed border-[#22ff88]/40 px-4 py-2 font-mono text-xs tracking-[0.2em] text-[#22ff88]/70">
              + 140 MORE VIA OPEN PROTOCOL
            </span>
          </div>
        </section>

        <Divider />

        {/* ===== CTA BAND ===== */}
        <section id="cta" className="mx-auto max-w-6xl px-6 py-20">
          <div className="relative overflow-hidden border border-[#22ff88]/40 bg-[#04120a] px-8 py-16 text-center shadow-[0_0_30px_rgba(34,255,136,0.2)] sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(45deg,rgba(34,255,136,0.05)_0px,rgba(34,255,136,0.05)_2px,transparent_2px,transparent_12px)]"
            />
            <p className="relative font-mono text-xs tracking-[0.3em] text-[#22ff88]">
              [ FINAL HANDSHAKE ]
            </p>
            <h2 className="relative mt-4 text-3xl font-bold text-white sm:text-4xl">
              <span className="font-mono text-[#22ff88]">&gt;</span> your competitors&apos; agents are
              already in production_
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl font-mono text-sm text-zinc-400">
              Get a dedicated fleet environment, a solutions engineer, and your first three agents
              live in under two weeks. No proof-of-concept purgatory.
            </p>
            <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                className="border border-[#22ff88] bg-[#22ff88] px-8 py-3.5 font-mono text-sm font-bold tracking-widest text-black transition-shadow hover:shadow-[0_0_40px_rgba(34,255,136,0.6)]"
              >
                ./REQUEST_ACCESS --priority
              </a>
              <a
                href="#"
                className="border border-zinc-600 px-8 py-3.5 font-mono text-sm tracking-widest text-zinc-300 transition-colors hover:border-[#22ff88] hover:text-[#22ff88]"
              >
                read the security whitepaper
              </a>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-[#22ff88]/15">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-sm font-bold tracking-[0.2em] text-white">SYNTHRAL</p>
                <p className="mt-2 max-w-xs font-mono text-[11px] leading-relaxed text-zinc-600">
                  Autonomous agent infrastructure for enterprises that cannot afford surprises.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] tracking-widest text-zinc-500">
                <a href="#" className="hover:text-[#22ff88]">/DOCS</a>
                <a href="#" className="hover:text-[#22ff88]">/SECURITY</a>
                <a href="#" className="hover:text-[#22ff88]">/STATUS</a>
                <a href="#" className="hover:text-[#22ff88]">/CAREERS</a>
                <a href="#" className="hover:text-[#22ff88]">/CONTACT</a>
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-2 border-t border-zinc-900 pt-6 font-mono text-[10px] tracking-widest text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 SYNTHRAL SYSTEMS, INC. ALL TRANSMISSIONS MONITORED.</p>
              <p className="text-[#22ff88]/50">EOF — CONNECTION HELD OPEN_</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
