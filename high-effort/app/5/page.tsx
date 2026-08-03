import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Wigglewords — Reading adventures for kids 4–8",
  description:
    "Wigglewords turns learning to read into a giggly, wiggly adventure. Phonics games, silly stories, and a cheering squad of friendly monsters for kids 4–8.",
};

/* ---------- Tiny SVG doodles ---------- */

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 1.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 16.7 5.9 20.1l1.4-6.8L2.2 8.6l6.9-.8L12 1.5z" />
    </svg>
  );
}

function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 12c8-12 16 12 24 0s16 12 24 0 16 12 24 0 16 12 24 0 16 12 20 4"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Smiley({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="currentColor" />
      <circle cx="16" cy="19" r="3.5" fill="#1f2937" />
      <circle cx="32" cy="19" r="3.5" fill="#1f2937" />
      <path d="M14 29c3 5 7 7 10 7s7-2 10-7" stroke="#1f2937" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ---------- Page ---------- */

export default function WigglewordsLanding() {
  return (
    <div className={`${baloo.className} min-h-screen bg-amber-50 text-slate-800 overflow-x-hidden`}>
      {/* ===== Pill nav ===== */}
      <header className="sticky top-4 z-50 mx-auto max-w-5xl px-4">
        <nav className="flex items-center justify-between rounded-full border-4 border-slate-800 bg-white px-5 py-3 shadow-[6px_6px_0_0_#0f172a]">
          <a href="#top" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Smiley className="h-9 w-9 text-yellow-400 -rotate-6" />
            <span>
              Wiggle<span className="text-sky-500">words</span>
            </span>
          </a>
          <div className="hidden items-center gap-6 font-bold text-slate-600 md:flex">
            <a href="#features" className="hover:text-rose-500">Why kids love it</a>
            <a href="#how" className="hover:text-sky-500">How it works</a>
            <a href="#parents" className="hover:text-green-600">Parents</a>
          </div>
          <a
            href="#cta"
            className="rounded-full border-[3px] border-slate-800 bg-rose-400 px-5 py-2 font-extrabold text-white shadow-[3px_3px_0_0_#0f172a] transition hover:-translate-y-0.5 hover:shadow-[4px_5px_0_0_#0f172a]"
          >
            Try it free
          </a>
        </nav>
      </header>

      {/* ===== Hero ===== */}
      <section id="top" className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 text-center">
        <Star className="absolute left-6 top-10 h-10 w-10 rotate-12 text-yellow-400" />
        <Star className="absolute right-10 top-24 h-7 w-7 -rotate-12 text-sky-400" />
        <Star className="absolute bottom-10 left-16 h-6 w-6 rotate-45 text-rose-400" />

        <span className="inline-block -rotate-2 rounded-full border-[3px] border-slate-800 bg-green-300 px-4 py-1.5 text-sm font-extrabold shadow-[3px_3px_0_0_#0f172a]">
          🐛 New: The Wiggly Word Worm levels are here!
        </span>

        <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
          Reading that <span className="inline-block rotate-2 rounded-3xl bg-yellow-300 px-4 py-1 shadow-[5px_5px_0_0_#0f172a] border-4 border-slate-800">wiggles</span>,{" "}
          <span className="inline-block -rotate-2 rounded-3xl bg-sky-300 px-4 py-1 border-4 border-slate-800 shadow-[5px_5px_0_0_#0f172a]">giggles</span> &amp; sticks!
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-xl font-semibold text-slate-600 sm:text-2xl">
          Wigglewords turns letters into laugh-out-loud adventures for kids 4–8. Ten minutes a day,
          one happy reader for life. 📚✨
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#cta"
            className="inline-block rounded-full border-4 border-slate-800 bg-rose-400 px-10 py-4 text-2xl font-extrabold text-white shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-1 hover:shadow-[8px_9px_0_0_#0f172a]"
          >
            Start the adventure 🚀
          </a>
          <a
            href="#how"
            className="inline-block rounded-full border-4 border-slate-800 bg-white px-8 py-4 text-xl font-extrabold text-slate-700 shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-1"
          >
            Peek inside 👀
          </a>
        </div>

        <Squiggle className="mx-auto mt-14 h-6 w-48 text-rose-300" />
        <p className="mt-3 text-sm font-bold text-slate-500">
          Free for 14 days · No ads, ever · Made with grown-up-approved phonics
        </p>
      </section>

      {/* ===== Feature stickers ===== */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-center text-4xl font-extrabold sm:text-5xl">
          Why kids beg for <span className="text-sky-500">one more story</span>
        </h2>
        <Squiggle className="mx-auto mt-4 h-5 w-40 text-yellow-400" />

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          <div className="rotate-2 rounded-3xl border-4 border-slate-800 bg-yellow-300 p-8 shadow-[8px_8px_0_0_#0f172a] transition hover:-translate-y-2 hover:rotate-1">
            <div className="text-6xl">🦖</div>
            <h3 className="mt-4 text-2xl font-extrabold">Silly stories, serious phonics</h3>
            <p className="mt-3 text-lg font-semibold text-slate-700">
              A dinosaur who only eats words that rhyme? Yes please. Every giggle hides a
              carefully sequenced phonics lesson.
            </p>
          </div>

          <div className="-rotate-3 rounded-3xl border-4 border-slate-800 bg-sky-300 p-8 shadow-[8px_8px_0_0_#0f172a] transition hover:-translate-y-2 hover:-rotate-1 md:mt-6">
            <div className="text-6xl">🎤</div>
            <h3 className="mt-4 text-2xl font-extrabold">Read-aloud magic</h3>
            <p className="mt-3 text-lg font-semibold text-slate-700">
              Kids read out loud and our friendly listening buddy cheers every sound — gently
              nudging tricky words along the way.
            </p>
          </div>

          <div className="rotate-2 rounded-3xl border-4 border-slate-800 bg-green-300 p-8 shadow-[8px_8px_0_0_#0f172a] transition hover:-translate-y-2 hover:rotate-1">
            <div className="text-6xl">🏆</div>
            <h3 className="mt-4 text-2xl font-extrabold">Stickers &amp; star badges</h3>
            <p className="mt-3 text-lg font-semibold text-slate-700">
              Finish a story, hatch a wiggle-monster, earn a shiny badge. Progress kids can
              see, collect, and show off at dinner.
            </p>
          </div>
        </div>
      </section>

      {/* ===== How kids learn ===== */}
      <section id="how" className="bg-sky-100 py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-4xl font-extrabold sm:text-5xl">
            How kids learn with Wigglewords
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-xl font-semibold text-slate-600">
            Three tiny steps a day. Zero tears. Maximum wiggle.
          </p>

          <div className="mt-16 space-y-10">
            {[
              {
                n: "1",
                bg: "bg-rose-400",
                tilt: "-rotate-1",
                emoji: "🔤",
                title: "Sound it out",
                text: "Quick, bouncy phonics games warm up little brains — match sounds, pop letter bubbles, sing the silly sound song.",
              },
              {
                n: "2",
                bg: "bg-yellow-400",
                tilt: "rotate-1",
                emoji: "📖",
                title: "Read a wiggly story",
                text: "A just-right story unlocks, starring words your child just practiced. They read, the characters react. Pure magic.",
              },
              {
                n: "3",
                bg: "bg-green-500",
                tilt: "-rotate-1",
                emoji: "🎉",
                title: "Celebrate & grow",
                text: "Confetti! Badges! A proud little reader. Tomorrow's adventure adapts to exactly what they're ready for next.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className={`${step.tilt} flex flex-col items-center gap-6 rounded-3xl border-4 border-slate-800 bg-white p-8 shadow-[8px_8px_0_0_#0f172a] sm:flex-row`}
              >
                <div
                  className={`${step.bg} flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-slate-800 text-4xl font-extrabold text-white shadow-[4px_4px_0_0_#0f172a]`}
                >
                  {step.n}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-extrabold">
                    {step.emoji} {step.title}
                  </h3>
                  <p className="mt-2 text-lg font-semibold text-slate-600">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Parent testimonials ===== */}
      <section id="parents" className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="text-center text-4xl font-extrabold sm:text-5xl">
          Grown-ups are grinning too 😄
        </h2>
        <Squiggle className="mx-auto mt-4 h-5 w-40 text-green-400" />

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {[
            {
              quote:
                "My daughter used to hide at reading time. Now she chases me around the house yelling new words. Send help (and more stories)!",
              name: "Maya P.",
              kid: "mom of Luna, age 5",
              tilt: "rotate-1",
              accent: "bg-yellow-300",
            },
            {
              quote:
                "Theo went from guessing words to actually sounding them out in about six weeks. His teacher asked what changed. Wigglewords did.",
              name: "Daniel R.",
              kid: "dad of Theo, age 6",
              tilt: "-rotate-2",
              accent: "bg-sky-300",
            },
            {
              quote:
                "It's the only screen time that ends with my twins reading paper books to each other. Worth every penny and then some.",
              name: "Priya S.",
              kid: "mom of twins, age 7",
              tilt: "rotate-2",
              accent: "bg-rose-300",
            },
          ].map((t) => (
            <figure key={t.name} className={`${t.tilt} relative`}>
              <blockquote className="relative rounded-3xl border-4 border-slate-800 bg-white p-7 shadow-[7px_7px_0_0_#0f172a]">
                <Star className="absolute -top-4 -right-3 h-8 w-8 rotate-12 text-yellow-400" />
                <p className="text-lg font-semibold leading-relaxed text-slate-700">
                  “{t.quote}”
                </p>
                {/* speech-bubble tail */}
                <span className="absolute -bottom-[14px] left-10 h-6 w-6 rotate-45 border-b-4 border-r-4 border-slate-800 bg-white" />
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3 pl-4">
                <span
                  className={`${t.accent} flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-slate-800 text-xl`}
                >
                  ⭐
                </span>
                <span>
                  <span className="block font-extrabold">{t.name}</span>
                  <span className="block text-sm font-bold text-slate-500">{t.kid}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ===== Fun stats ===== */}
      <section className="bg-yellow-300 py-20 border-y-4 border-slate-800">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 text-center sm:grid-cols-2 lg:grid-cols-4">
          {[
            { big: "12 million", small: "stories read out loud 📚", tilt: "-rotate-2", bg: "bg-white" },
            { big: "98%", small: "of kids ask for “one more!” 🙋", tilt: "rotate-2", bg: "bg-sky-200" },
            { big: "650+", small: "silly stories & songs 🎵", tilt: "-rotate-1", bg: "bg-rose-200" },
            { big: "4.9 ★", small: "from very happy grown-ups 💛", tilt: "rotate-1", bg: "bg-green-200" },
          ].map((s) => (
            <div
              key={s.big}
              className={`${s.tilt} ${s.bg} rounded-3xl border-4 border-slate-800 p-6 shadow-[6px_6px_0_0_#0f172a]`}
            >
              <div className="text-4xl font-extrabold sm:text-5xl">{s.big}</div>
              <div className="mt-2 text-lg font-bold text-slate-600">{s.small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Grown-ups CTA band ===== */}
      <section id="cta" className="mx-auto max-w-5xl px-4 py-24">
        <div className="relative -rotate-1 rounded-[2.5rem] border-4 border-slate-800 bg-sky-400 px-8 py-14 text-center shadow-[10px_10px_0_0_#0f172a]">
          <Star className="absolute -top-6 left-10 h-12 w-12 -rotate-12 text-yellow-300" />
          <Star className="absolute -bottom-5 right-12 h-9 w-9 rotate-12 text-rose-300" />
          <Smiley className="absolute -top-7 right-16 h-14 w-14 rotate-6 text-green-300" />

          <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
            Hey grown-ups — ready for happier reading time?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl font-semibold text-sky-50">
            Start a free 14-day adventure. No ads, no in-app surprises, cancel anytime.
            Just one wiggly reader in the making.
          </p>
          <a
            href="#top"
            className="mt-9 inline-block rotate-1 rounded-full border-4 border-slate-800 bg-yellow-300 px-12 py-5 text-2xl font-extrabold text-slate-800 shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-1 hover:shadow-[8px_9px_0_0_#0f172a]"
          >
            Start the adventure 🌈
          </a>
          <p className="mt-5 text-sm font-bold text-sky-100">
            Loved by 200,000 families · Built with reading specialists · COPPA-friendly
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t-4 border-slate-800 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-12 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 text-2xl font-extrabold md:justify-start">
              <Smiley className="h-8 w-8 text-yellow-400 rotate-3" />
              Wiggle<span className="text-sky-500">words</span>
            </div>
            <p className="mt-2 max-w-xs font-semibold text-slate-500">
              Raising giggly, confident readers — one wiggly word at a time.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-bold text-slate-600">
            <a href="#features" className="hover:text-rose-500">Features</a>
            <a href="#how" className="hover:text-sky-500">How it works</a>
            <a href="#parents" className="hover:text-green-600">Parents</a>
            <a href="#cta" className="hover:text-yellow-500">Free trial</a>
          </div>
          <div className="text-3xl" aria-hidden="true">
            🐛📚⭐🌈
          </div>
        </div>
        <div className="border-t-2 border-dashed border-slate-300 py-5 text-center text-sm font-bold text-slate-400">
          © 2026 Wigglewords Inc. Made with crayons, care &amp; a little bit of magic. ✨
        </div>
      </footer>
    </div>
  );
}
