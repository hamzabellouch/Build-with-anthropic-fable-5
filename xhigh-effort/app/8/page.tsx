import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bloomly — Tiny Garden Adventures That Teach Reading & Math",
  description:
    "Bloomly is the joyful learning app for kids ages 4–8. Ten-minute garden adventures grow reading, counting, logic, and kindness — ad-free, COPPA-aligned, and parent approved.",
};

/* ---------- Tiny inline-SVG doodles ---------- */

function DoodleStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M20 3 Q22 14 26 15.5 Q35 17 36 20 Q35 23 26 24.5 Q22 26 20 37 Q18 26 14 24.5 Q5 23 4 20 Q5 17 14 15.5 Q18 14 20 3 Z"
        fill="#fde047"
        stroke="#a855f7"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoodleFlower({
  className = "",
  petal = "#f9a8d4",
}: {
  className?: string;
  petal?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g stroke="#7e22ce" strokeWidth="2">
        <ellipse cx="24" cy="10" rx="7" ry="9" fill={petal} />
        <ellipse cx="24" cy="38" rx="7" ry="9" fill={petal} />
        <ellipse cx="10" cy="24" rx="9" ry="7" fill={petal} />
        <ellipse cx="38" cy="24" rx="9" ry="7" fill={petal} />
        <circle cx="24" cy="24" r="7.5" fill="#fde047" />
      </g>
      <circle cx="21.5" cy="23" r="1.2" fill="#7e22ce" />
      <circle cx="26.5" cy="23" r="1.2" fill="#7e22ce" />
      <path d="M21 26.5 Q24 29 27 26.5" stroke="#7e22ce" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function DoodleSun({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
        <line x1="32" y1="3" x2="32" y2="11" />
        <line x1="32" y1="53" x2="32" y2="61" />
        <line x1="3" y1="32" x2="11" y2="32" />
        <line x1="53" y1="32" x2="61" y2="32" />
        <line x1="11.5" y1="11.5" x2="17" y2="17" />
        <line x1="47" y1="47" x2="52.5" y2="52.5" />
        <line x1="52.5" y1="11.5" x2="47" y2="17" />
        <line x1="17" y1="47" x2="11.5" y2="52.5" />
      </g>
      <circle cx="32" cy="32" r="15" fill="#fde047" stroke="#f59e0b" strokeWidth="3" />
      <circle cx="27" cy="30" r="2" fill="#92400e" />
      <circle cx="37" cy="30" r="2" fill="#92400e" />
      <path d="M26 36 Q32 41 38 36" stroke="#92400e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="23.5" cy="34" r="2.2" fill="#fda4af" opacity="0.8" />
      <circle cx="40.5" cy="34" r="2.2" fill="#fda4af" opacity="0.8" />
    </svg>
  );
}

/* ---------- Mascots built from simple circles & faces ---------- */

function SproutMascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      {/* leaves */}
      <path d="M60 28 Q38 8 22 16 Q26 38 54 36 Z" fill="#86efac" stroke="#15803d" strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 28 Q82 8 98 16 Q94 38 66 36 Z" fill="#4ade80" stroke="#15803d" strokeWidth="3" strokeLinejoin="round" />
      <line x1="60" y1="30" x2="60" y2="48" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
      {/* head/body */}
      <circle cx="60" cy="88" r="44" fill="#bbf7d0" stroke="#15803d" strokeWidth="3.5" />
      {/* eyes */}
      <circle cx="46" cy="82" r="5.5" fill="#14532d" />
      <circle cx="74" cy="82" r="5.5" fill="#14532d" />
      <circle cx="48" cy="80" r="2" fill="#fff" />
      <circle cx="76" cy="80" r="2" fill="#fff" />
      {/* cheeks + smile */}
      <circle cx="38" cy="94" r="5" fill="#f9a8d4" opacity="0.85" />
      <circle cx="82" cy="94" r="5" fill="#f9a8d4" opacity="0.85" />
      <path d="M48 98 Q60 110 72 98" stroke="#14532d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function LadybugMascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
      <circle cx="50" cy="24" r="14" fill="#1f2937" />
      <circle cx="44" cy="22" r="3" fill="#fff" />
      <circle cx="56" cy="22" r="3" fill="#fff" />
      <circle cx="44.8" cy="22.8" r="1.4" fill="#1f2937" />
      <circle cx="56.8" cy="22.8" r="1.4" fill="#1f2937" />
      <path d="M45 28 Q50 32 55 28" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="42" y1="12" x2="36" y2="4" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="58" y1="12" x2="64" y2="4" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="36" cy="4" r="2.5" fill="#1f2937" />
      <circle cx="64" cy="4" r="2.5" fill="#1f2937" />
      <ellipse cx="50" cy="56" rx="34" ry="28" fill="#fb7185" stroke="#be123c" strokeWidth="3" />
      <line x1="50" y1="30" x2="50" y2="84" stroke="#be123c" strokeWidth="3" />
      <circle cx="36" cy="48" r="4.5" fill="#1f2937" />
      <circle cx="64" cy="48" r="4.5" fill="#1f2937" />
      <circle cx="32" cy="64" r="4.5" fill="#1f2937" />
      <circle cx="68" cy="64" r="4.5" fill="#1f2937" />
    </svg>
  );
}

/* ---------- Hero garden scene ---------- */

function GardenScene() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative rounded-[2.5rem] border-4 border-purple-200 bg-gradient-to-b from-[#e0f2fe] via-[#f5f3ff] to-[#dcfce7] p-4 shadow-[0_18px_0_0_#e9d5ff] sm:p-6">
        <svg viewBox="0 0 420 330" className="h-auto w-full" role="img" aria-label="Sprout the Bloomly mascot waving in a sunny garden">
          {/* sky doodles */}
          <g className="lp8-spin-slow" style={{ transformOrigin: "62px 56px" }}>
            <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
              <line x1="62" y1="22" x2="62" y2="32" />
              <line x1="62" y1="80" x2="62" y2="90" />
              <line x1="28" y1="56" x2="38" y2="56" />
              <line x1="86" y1="56" x2="96" y2="56" />
              <line x1="38" y1="32" x2="45" y2="39" />
              <line x1="79" y1="73" x2="86" y2="80" />
              <line x1="86" y1="32" x2="79" y2="39" />
              <line x1="45" y1="73" x2="38" y2="80" />
            </g>
          </g>
          <circle cx="62" cy="56" r="20" fill="#fde047" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="56" cy="53" r="2.4" fill="#92400e" />
          <circle cx="68" cy="53" r="2.4" fill="#92400e" />
          <path d="M55 61 Q62 67 69 61" stroke="#92400e" strokeWidth="2.6" fill="none" strokeLinecap="round" />

          {/* puffy clouds */}
          <g fill="#ffffff" stroke="#c4b5fd" strokeWidth="2.5">
            <g className="lp8-float-slow">
              <ellipse cx="300" cy="48" rx="34" ry="16" />
              <circle cx="282" cy="42" r="14" />
              <circle cx="308" cy="36" r="17" />
            </g>
            <g className="lp8-float">
              <ellipse cx="170" cy="80" rx="26" ry="12" />
              <circle cx="160" cy="74" r="11" />
              <circle cx="180" cy="71" r="12" />
            </g>
          </g>

          {/* butterfly */}
          <g className="lp8-wiggle" style={{ transformOrigin: "356px 110px" }}>
            <ellipse cx="346" cy="106" rx="11" ry="14" fill="#f9a8d4" stroke="#be185d" strokeWidth="2.4" transform="rotate(-20 346 106)" />
            <ellipse cx="366" cy="106" rx="11" ry="14" fill="#fbcfe8" stroke="#be185d" strokeWidth="2.4" transform="rotate(20 366 106)" />
            <rect x="353.5" y="98" width="5" height="22" rx="2.5" fill="#581c87" />
            <line x1="354" y1="98" x2="349" y2="90" stroke="#581c87" strokeWidth="2" strokeLinecap="round" />
            <line x1="358" y1="98" x2="363" y2="90" stroke="#581c87" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* hills */}
          <path d="M-10 280 Q100 200 220 260 Q330 310 430 250 L430 340 L-10 340 Z" fill="#86efac" stroke="#22c55e" strokeWidth="3" />
          <path d="M-10 310 Q120 260 250 300 Q350 328 430 300 L430 340 L-10 340 Z" fill="#4ade80" />

          {/* counting stones */}
          <g fontSize="15" fontWeight="900" fill="#581c87" textAnchor="middle">
            <circle cx="58" cy="300" r="16" fill="#fef9c3" stroke="#eab308" strokeWidth="3" />
            <text x="58" y="306">1</text>
            <circle cx="100" cy="312" r="16" fill="#fbcfe8" stroke="#db2777" strokeWidth="3" />
            <text x="100" y="318">2</text>
            <circle cx="142" cy="304" r="16" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="3" />
            <text x="142" y="310">3</text>
          </g>

          {/* flowers on the hill */}
          <g>
            <line x1="320" y1="296" x2="320" y2="262" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
            <g stroke="#be185d" strokeWidth="2">
              <circle cx="320" cy="248" r="9" fill="#f9a8d4" />
              <circle cx="308" cy="256" r="9" fill="#f9a8d4" />
              <circle cx="332" cy="256" r="9" fill="#f9a8d4" />
              <circle cx="312" cy="266" r="9" fill="#f9a8d4" />
              <circle cx="328" cy="266" r="9" fill="#f9a8d4" />
            </g>
            <circle cx="320" cy="257" r="8" fill="#fde047" stroke="#eab308" strokeWidth="2" />
          </g>
          <g>
            <line x1="380" y1="306" x2="380" y2="278" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
            <g stroke="#7c3aed" strokeWidth="2">
              <circle cx="380" cy="266" r="8" fill="#ddd6fe" />
              <circle cx="369" cy="273" r="8" fill="#ddd6fe" />
              <circle cx="391" cy="273" r="8" fill="#ddd6fe" />
              <circle cx="373" cy="282" r="8" fill="#ddd6fe" />
              <circle cx="387" cy="282" r="8" fill="#ddd6fe" />
            </g>
            <circle cx="380" cy="274" r="7" fill="#fde047" stroke="#eab308" strokeWidth="2" />
          </g>

          {/* ABC letter seeds */}
          <g fontSize="17" fontWeight="900" textAnchor="middle">
            <rect x="186" y="288" width="30" height="30" rx="10" fill="#fff" stroke="#7c3aed" strokeWidth="3" />
            <text x="201" y="310" fill="#7c3aed">A</text>
            <rect x="224" y="296" width="30" height="30" rx="10" fill="#fff" stroke="#db2777" strokeWidth="3" />
            <text x="239" y="318" fill="#db2777">B</text>
          </g>

          {/* Sprout mascot */}
          <g className="lp8-float">
            <path d="M260 150 Q238 130 222 138 Q226 160 254 158 Z" fill="#86efac" stroke="#15803d" strokeWidth="3" strokeLinejoin="round" />
            <path d="M260 150 Q282 130 298 138 Q294 160 266 158 Z" fill="#4ade80" stroke="#15803d" strokeWidth="3" strokeLinejoin="round" />
            <line x1="260" y1="152" x2="260" y2="170" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
            <circle cx="260" cy="212" r="46" fill="#bbf7d0" stroke="#15803d" strokeWidth="3.5" />
            <circle cx="245" cy="206" r="6" fill="#14532d" />
            <circle cx="275" cy="206" r="6" fill="#14532d" />
            <circle cx="247" cy="204" r="2.2" fill="#fff" />
            <circle cx="277" cy="204" r="2.2" fill="#fff" />
            <circle cx="236" cy="219" r="5.5" fill="#f9a8d4" opacity="0.85" />
            <circle cx="284" cy="219" r="5.5" fill="#f9a8d4" opacity="0.85" />
            <path d="M246 224 Q260 237 274 224" stroke="#14532d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* waving arm */}
            <path d="M302 196 Q322 184 328 166" stroke="#15803d" strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="329" cy="163" r="7" fill="#bbf7d0" stroke="#15803d" strokeWidth="3" />
          </g>

          {/* ladybug friend */}
          <g className="lp8-wiggle" style={{ transformOrigin: "120px 240px" }}>
            <circle cx="120" cy="222" r="10" fill="#1f2937" />
            <circle cx="116" cy="220" r="2.2" fill="#fff" />
            <circle cx="124" cy="220" r="2.2" fill="#fff" />
            <ellipse cx="120" cy="246" rx="24" ry="20" fill="#fb7185" stroke="#be123c" strokeWidth="3" />
            <line x1="120" y1="227" x2="120" y2="266" stroke="#be123c" strokeWidth="3" />
            <circle cx="110" cy="240" r="3.5" fill="#1f2937" />
            <circle cx="130" cy="240" r="3.5" fill="#1f2937" />
            <circle cx="108" cy="252" r="3.5" fill="#1f2937" />
            <circle cx="132" cy="252" r="3.5" fill="#1f2937" />
          </g>
        </svg>

        {/* floating reward pill */}
        <div className="lp8-float absolute -right-3 -top-5 rounded-full border-4 border-yellow-200 bg-white px-4 py-2 text-sm font-black text-purple-900 shadow-[0_8px_0_0_#fef08a] sm:-right-5">
          ⭐ +3 stars earned!
        </div>
        <div className="lp8-float-slow absolute -bottom-5 -left-3 rounded-full border-4 border-pink-200 bg-white px-4 py-2 text-sm font-black text-pink-600 shadow-[0_8px_0_0_#fbcfe8] sm:-left-5">
          📖 Maya read &quot;bug&quot;!
        </div>
      </div>
    </div>
  );
}

/* ---------- Small building blocks ---------- */

function SectionBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className={`inline-block rounded-full border-4 px-5 py-1.5 text-sm font-black uppercase tracking-wider ${color}`}
    >
      {children}
    </span>
  );
}

const learnCards = [
  {
    emoji: "📖",
    title: "Reading",
    blurb:
      "Phonics seeds sprout into first words. Kids sound out letters to help flowers bloom — 320+ levels from ABCs to full sentences.",
    bg: "bg-pink-50",
    border: "border-pink-200",
    shadow: "shadow-[0_10px_0_0_#fbcfe8]",
    pill: "bg-pink-100 text-pink-700",
    pillText: "Ages 4–8",
  },
  {
    emoji: "🔢",
    title: "Counting & Math",
    blurb:
      "Count ladybug spots, share strawberries fairly, and build number sense up to early addition and subtraction — no flashcards, just play.",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    shadow: "shadow-[0_10px_0_0_#fef08a]",
    pill: "bg-yellow-100 text-yellow-700",
    pillText: "1, 2, 3… go!",
  },
  {
    emoji: "🧩",
    title: "Logic & Puzzles",
    blurb:
      "Sort seeds by shape, finish patterns of petals, and plan tiny watering routes. Sneaky little brain workouts disguised as garden chores.",
    bg: "bg-green-50",
    border: "border-green-200",
    shadow: "shadow-[0_10px_0_0_#bbf7d0]",
    pill: "bg-green-100 text-green-700",
    pillText: "Think & grow",
  },
  {
    emoji: "💛",
    title: "Kindness",
    blurb:
      "Help a worried worm find home, share sunshine with a droopy daisy. Every adventure plants one small social-emotional lesson.",
    bg: "bg-purple-50",
    border: "border-purple-200",
    shadow: "shadow-[0_10px_0_0_#e9d5ff]",
    pill: "bg-purple-100 text-purple-700",
    pillText: "Heart skills",
  },
];

const steps = [
  {
    num: "1",
    emoji: "🌱",
    title: "Plant your sprout",
    blurb:
      "Your child picks a garden buddy and waters their very first seed. We tune the adventures to their age and reading level in under a minute.",
    color: "border-pink-200 bg-pink-50",
    numColor: "bg-pink-400",
  },
  {
    num: "2",
    emoji: "🦋",
    title: "Play 10-minute adventures",
    blurb:
      "Each day brings one bite-sized quest — rescue a letter from the mud, count fireflies at dusk. Short by design, so goodbye is easy.",
    color: "border-yellow-200 bg-yellow-50",
    numColor: "bg-yellow-400",
  },
  {
    num: "3",
    emoji: "🌻",
    title: "Watch skills bloom",
    blurb:
      "Every word read and puzzle solved grows their garden for real. Parents get a sweet weekly note: “Theo mastered the letter S!”",
    color: "border-green-200 bg-green-50",
    numColor: "bg-green-400",
  },
];

const testimonials = [
  {
    quote:
      "My daughter asked to “water her words” before breakfast. Before breakfast! She went from guessing letters to reading bedtime books to ME in about four months.",
    name: "Priya M.",
    role: "Mom of Anaya, age 5",
    face: "#f9a8d4",
    cheeks: "#fb7185",
    border: "border-pink-200",
    shadow: "shadow-[0_10px_0_0_#fbcfe8]",
  },
  {
    quote:
      "The 10-minute sessions are genius. The app literally tells him the garden is sleepy and waves goodnight. Zero tantrums when screen time ends. Zero!",
    name: "Marcus T.",
    role: "Dad of Theo, age 6",
    face: "#fde047",
    cheeks: "#fb923c",
    border: "border-yellow-200",
    shadow: "shadow-[0_10px_0_0_#fef08a]",
  },
  {
    quote:
      "As a kindergarten teacher AND a mom, I am picky. Bloomly’s phonics order actually matches what we teach in class, and the kindness quests are a lovely bonus.",
    name: "Sofia R.",
    role: "Mom of twins, age 4",
    face: "#bbf7d0",
    cheeks: "#f9a8d4",
    border: "border-green-200",
    shadow: "shadow-[0_10px_0_0_#bbf7d0]",
  },
];

const trustItems = [
  {
    emoji: "🛡️",
    title: "COPPA-aligned privacy",
    blurb: "No ads, no trackers, no chat with strangers. Kid data never leaves the garden — and never gets sold. Ever.",
  },
  {
    emoji: "⏰",
    title: "Built-in screen-time limits",
    blurb: "Adventures end themselves after 10–20 minutes (you choose). Sprout waves goodnight so you don’t have to be the bad guy.",
  },
  {
    emoji: "👩‍👧",
    title: "Parent gate on everything",
    blurb: "Settings, billing, and links live behind a grown-ups-only gate. Kids only ever see the garden.",
  },
  {
    emoji: "🎓",
    title: "Teacher-built curriculum",
    blurb: "Designed with early-childhood educators and aligned to common pre-K through 2nd grade standards.",
  },
];

const pricingPlans = [
  {
    name: "Little Seed",
    price: "Free",
    period: "forever",
    blurb: "Perfect for testing the soil.",
    features: ["1 child profile", "First 3 garden worlds", "Weekly parent note", "No ads — even on free"],
    border: "border-purple-200",
    shadow: "shadow-[0_12px_0_0_#e9d5ff]",
    button: "border-4 border-purple-300 bg-white text-purple-700 hover:bg-purple-50",
    cta: "Plant a free seed",
    featured: false,
  },
  {
    name: "Family Garden",
    price: "$7",
    period: "/month for the whole family",
    blurb: "Our most-loved plan. 🌟",
    features: [
      "Up to 4 child profiles",
      "All 24 worlds + new ones monthly",
      "Offline mode for car rides",
      "Printable activity sheets",
      "Detailed skill-bloom reports",
    ],
    border: "border-pink-300",
    shadow: "shadow-[0_12px_0_0_#fbcfe8]",
    button: "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600",
    cta: "Start free adventure",
    featured: true,
  },
  {
    name: "Forever Meadow",
    price: "$59",
    period: "/year (save 30%)",
    blurb: "For families in it for the long bloom.",
    features: ["Everything in Family Garden", "2 bonus grandparent logins", "Early access to new worlds", "Plants one real tree 🌳"],
    border: "border-green-200",
    shadow: "shadow-[0_12px_0_0_#bbf7d0]",
    button: "border-4 border-green-300 bg-white text-green-700 hover:bg-green-50",
    cta: "Grow the meadow",
    featured: false,
  },
];

/* ---------- Page ---------- */

export default function BloomlyLandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#fdf4ff] font-sans text-purple-950 antialiased">
      <style>{`
        @keyframes lp8-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes lp8-wiggle {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes lp8-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .lp8-float { animation: lp8-float 5s ease-in-out infinite; }
        .lp8-float-slow { animation: lp8-float 8s ease-in-out infinite; }
        .lp8-wiggle { animation: lp8-wiggle 3.5s ease-in-out infinite; }
        .lp8-spin-slow { animation: lp8-spin-slow 24s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lp8-float, .lp8-float-slow, .lp8-wiggle, .lp8-spin-slow { animation: none; }
        }
      `}</style>

      {/* ===== Nav ===== */}
      <header className="sticky top-3 z-50 px-4 sm:top-5 sm:px-6">
        <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full border-4 border-purple-200 bg-white/85 px-4 py-2.5 shadow-[0_8px_0_0_#e9d5ff] backdrop-blur-md sm:px-6">
          <a href="#" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-green-200 bg-green-100 text-lg">
              🌱
            </span>
            <span className="text-xl font-black tracking-tight text-purple-900 sm:text-2xl">
              Bloomly
            </span>
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {[
              ["What kids learn", "#learn"],
              ["How it works", "#how"],
              ["Parents", "#parents"],
              ["Safety", "#safety"],
              ["Pricing", "#pricing"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3.5 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-100 hover:text-purple-900"
              >
                {label}
              </a>
            ))}
          </div>
          <a
            href="#pricing"
            className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_5px_0_0_#d8b4fe] transition hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_#d8b4fe] sm:px-6"
          >
            Start free 🌟
          </a>
        </nav>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
        {/* background blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="lp8-float-slow absolute -left-28 -top-16 h-80 w-80 rounded-[40%_60%_55%_45%] bg-[#dcfce7] opacity-80 sm:h-[26rem] sm:w-[26rem]" />
          <div className="lp8-float absolute -right-24 top-24 h-72 w-72 rounded-[55%_45%_40%_60%] bg-[#fce7f3] opacity-80 sm:h-96 sm:w-96" />
          <div className="lp8-float-slow absolute bottom-0 left-1/3 h-56 w-56 rounded-[45%_55%_60%_40%] bg-[#fef9c3] opacity-70" />
          <DoodleStar className="lp8-wiggle absolute left-[8%] top-[14%] hidden h-9 w-9 md:block" />
          <DoodleStar className="lp8-wiggle absolute right-[12%] top-[8%] hidden h-7 w-7 lg:block" />
          <DoodleFlower className="lp8-float absolute bottom-[12%] left-[4%] hidden h-12 w-12 lg:block" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border-4 border-pink-200 bg-white px-5 py-2 text-sm font-black text-pink-600 shadow-[0_5px_0_0_#fbcfe8]">
              🐞 For curious kids ages 4–8
            </div>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-purple-900 sm:text-5xl lg:text-6xl">
              Little adventures.{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                  Big blooming
                </span>
                <svg viewBox="0 0 200 14" className="absolute -bottom-2 left-0 h-3 w-full" aria-hidden="true" preserveAspectRatio="none">
                  <path d="M3 10 Q35 3 70 8 Q105 13 140 6 Q170 2 197 8" stroke="#f472b6" strokeWidth="5" fill="none" strokeLinecap="round" />
                </svg>
              </span>{" "}
              brains. 🌱
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg font-medium leading-relaxed text-purple-700/90 sm:text-xl lg:mx-0">
              Bloomly turns reading and math practice into ten-minute garden quests your kid will beg for — and you&apos;ll feel
              great about. Teacher-built, ad-free, and gentle on screen time.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href="#pricing"
                className="group rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-9 py-4 text-lg font-black text-white shadow-[0_8px_0_0_#d8b4fe] transition hover:-translate-y-1 hover:shadow-[0_11px_0_0_#d8b4fe]"
              >
                Start free adventure
                <span className="ml-2 inline-block transition group-hover:translate-x-1">🦋</span>
              </a>
              <a
                href="#how"
                className="rounded-full border-4 border-purple-200 bg-white px-8 py-3.5 text-lg font-black text-purple-700 shadow-[0_6px_0_0_#e9d5ff] transition hover:-translate-y-1 hover:bg-purple-50 hover:shadow-[0_9px_0_0_#e9d5ff]"
              >
                Peek inside 👀
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-bold text-purple-600/80 lg:justify-start">
              <span>⭐ 4.9 on the app stores</span>
              <span>👨‍👩‍👧 Loved by 240,000+ families</span>
              <span>🚫 No ads, ever</span>
            </div>
          </div>

          <GardenScene />
        </div>
      </section>

      {/* ===== What kids learn ===== */}
      <section id="learn" className="relative scroll-mt-28 px-4 py-20 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 top-10 h-80 w-80 rounded-[60%_40%_45%_55%] bg-[#ccfbf1] opacity-60" />
          <DoodleSun className="lp8-spin-slow absolute left-[3%] top-8 hidden h-16 w-16 lg:block" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <SectionBadge color="border-green-200 bg-green-50 text-green-700">
              🌼 What kids learn
            </SectionBadge>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-purple-900 sm:text-4xl lg:text-5xl">
              Four little patches, one happy brain
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-purple-700/90">
              Every Bloomly garden grows real school skills — plus the heart skills report cards forget to mention.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {learnCards.map((card) => (
              <div
                key={card.title}
                className={`group rounded-[2.5rem] border-4 ${card.border} ${card.bg} ${card.shadow} p-7 transition hover:-translate-y-2`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/80 text-3xl shadow-sm transition group-hover:scale-110 group-hover:rotate-6">
                  {card.emoji}
                </div>
                <h3 className="mt-5 text-2xl font-black text-purple-900">{card.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-purple-800/80">
                  {card.blurb}
                </p>
                <span className={`mt-5 inline-block rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide ${card.pill}`}>
                  {card.pillText}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="relative scroll-mt-28 px-4 py-20 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-36 top-1/3 h-96 w-96 rounded-[50%_50%_40%_60%] bg-[#fce7f3] opacity-60" />
          <DoodleFlower petal="#ddd6fe" className="lp8-wiggle absolute right-[5%] top-6 hidden h-12 w-12 md:block" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <SectionBadge color="border-yellow-200 bg-yellow-50 text-yellow-700">
              ☀️ How it works
            </SectionBadge>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-purple-900 sm:text-4xl lg:text-5xl">
              Three tiny steps to a garden of know-how
            </h2>
          </div>
          <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-10">
            {/* dotted connector */}
            <svg
              aria-hidden="true"
              viewBox="0 0 800 40"
              className="absolute left-1/2 top-10 hidden w-2/3 -translate-x-1/2 md:block"
              preserveAspectRatio="none"
            >
              <path d="M10 30 Q200 0 400 25 Q600 50 790 15" stroke="#d8b4fe" strokeWidth="5" strokeDasharray="2 14" strokeLinecap="round" fill="none" />
            </svg>
            {steps.map((step) => (
              <div
                key={step.num}
                className={`relative rounded-[2.5rem] border-4 ${step.color} p-8 pt-12 text-center shadow-[0_10px_0_0_rgba(233,213,255,0.9)] transition hover:-translate-y-2`}
              >
                <div
                  className={`absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white ${step.numColor} text-2xl font-black text-white shadow-md`}
                >
                  {step.num}
                </div>
                <div className="lp8-float mx-auto flex h-20 w-20 items-center justify-center rounded-[45%_55%_50%_50%] border-4 border-white bg-white/80 text-4xl">
                  {step.emoji}
                </div>
                <h3 className="mt-5 text-xl font-black text-purple-900 sm:text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-purple-800/80">
                  {step.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Parent testimonials ===== */}
      <section id="parents" className="relative scroll-mt-28 px-4 py-20 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-[40%_60%_50%_50%] bg-[#fef9c3] opacity-70" />
          <DoodleStar className="lp8-wiggle absolute left-[6%] bottom-[15%] hidden h-8 w-8 lg:block" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <SectionBadge color="border-pink-200 bg-pink-50 text-pink-600">
              💬 From the grown-ups
            </SectionBadge>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-purple-900 sm:text-4xl lg:text-5xl">
              Parents are kind of obsessed
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-purple-700/90">
              (Their kids are too, but the kids mostly review us in crayon.)
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className={`flex flex-col rounded-[2.5rem] border-4 ${t.border} bg-white p-7 ${t.shadow} transition hover:-translate-y-2`}
              >
                <div className="text-lg tracking-widest text-amber-400" aria-label="5 out of 5 stars">
                  ★★★★★
                </div>
                <blockquote className="mt-4 flex-1 text-sm font-medium leading-relaxed text-purple-800/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
                    <circle cx="24" cy="24" r="22" fill={t.face} stroke="#7e22ce" strokeWidth="2.5" />
                    <circle cx="17" cy="21" r="2.6" fill="#581c87" />
                    <circle cx="31" cy="21" r="2.6" fill="#581c87" />
                    <circle cx="13" cy="28" r="2.8" fill={t.cheeks} opacity="0.7" />
                    <circle cx="35" cy="28" r="2.8" fill={t.cheeks} opacity="0.7" />
                    <path d="M17 29 Q24 36 31 29" stroke="#581c87" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                  </svg>
                  <div>
                    <div className="font-black text-purple-900">{t.name}</div>
                    <div className="text-xs font-bold text-purple-600/80">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Safety / screen-time trust band ===== */}
      <section id="safety" className="scroll-mt-28 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] border-4 border-purple-200 bg-gradient-to-br from-purple-100 via-[#fdf4ff] to-pink-100 p-8 shadow-[0_14px_0_0_#e9d5ff] sm:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div className="text-center lg:text-left">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-300 bg-white text-5xl shadow-[0_6px_0_0_#bbf7d0] lg:mx-0">
                🛡️
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-purple-900 sm:text-4xl">
                A garden with a fence
              </h2>
              <p className="mt-3 text-base font-medium leading-relaxed text-purple-700/90">
                We built Bloomly the way we&apos;d want any app built for our own kids: private, calm, and politely
                short. Certified by the (totally fictional) SafeSprout Seal of Approval. 🌿
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border-4 border-green-200 bg-white px-5 py-2 text-sm font-black text-green-700">
                ✅ Independently kid-safety audited, 2026
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border-4 border-white bg-white/80 p-5 transition hover:-translate-y-1 hover:bg-white"
                >
                  <div className="text-3xl">{item.emoji}</div>
                  <h3 className="mt-2 font-black text-purple-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm font-medium leading-relaxed text-purple-800/75">
                    {item.blurb}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="relative scroll-mt-28 px-4 py-20 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 top-16 h-80 w-80 rounded-[55%_45%_60%_40%] bg-[#dcfce7] opacity-60" />
          <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-[45%_55%_40%_60%] bg-[#fce7f3] opacity-60" />
          <LadybugMascot className="lp8-wiggle absolute right-[4%] top-10 hidden h-16 w-auto lg:block" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <SectionBadge color="border-purple-200 bg-purple-50 text-purple-700">
              🌷 Family pricing
            </SectionBadge>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-purple-900 sm:text-4xl lg:text-5xl">
              One garden, the whole family plays
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-purple-700/90">
              Every paid plan starts with a 14-day free adventure. Cancel anytime — your child&apos;s garden stays saved.
            </p>
          </div>
          <div className="mt-14 grid items-start gap-8 md:grid-cols-3 md:gap-5 lg:gap-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-[2.5rem] border-4 ${plan.border} bg-white p-8 ${plan.shadow} transition hover:-translate-y-2 ${
                  plan.featured ? "md:-mt-5 md:pb-10 ring-4 ring-pink-100" : ""
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-md">
                    🌟 Most loved
                  </div>
                )}
                <h3 className="text-2xl font-black text-purple-900">{plan.name}</h3>
                <p className="mt-1 text-sm font-bold text-purple-600/80">{plan.blurb}</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-purple-900">{plan.price}</span>
                  <span className="text-sm font-bold text-purple-600/80">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm font-semibold text-purple-800/85">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px]">
                        ✅
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`mt-8 block rounded-full px-6 py-3.5 text-center text-base font-black shadow-[0_6px_0_0_#e9d5ff] transition hover:-translate-y-0.5 ${plan.button}`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm font-bold text-purple-600/70">
            💜 Scholarships available — no kid gets left outside the garden. Just email hello@bloomly.app
          </p>
        </div>
      </section>

      {/* ===== Big CTA ===== */}
      <section className="px-4 py-16 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[3rem] border-4 border-purple-300 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 px-6 py-16 text-center shadow-[0_16px_0_0_#e9d5ff] sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="lp8-float-slow absolute -left-16 -top-16 h-56 w-56 rounded-[45%_55%_50%_50%] bg-white/10" />
            <div className="lp8-float absolute -bottom-20 -right-12 h-64 w-64 rounded-[55%_45%_60%_40%] bg-white/10" />
            <DoodleStar className="lp8-wiggle absolute left-[10%] top-[18%] h-8 w-8 opacity-90" />
            <DoodleStar className="lp8-wiggle absolute right-[12%] top-[30%] h-6 w-6 opacity-80" />
          </div>
          <div className="relative">
            <div className="lp8-float mx-auto w-28">
              <SproutMascot className="h-auto w-full drop-shadow-lg" />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to plant something amazing? 🌱
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-purple-100">
              Your child&apos;s first garden adventure takes two minutes to set up and costs exactly zero
              dollars. Sprout is already waving.
            </p>
            <a
              href="#pricing"
              className="mt-8 inline-block rounded-full bg-white px-10 py-4 text-lg font-black text-purple-700 shadow-[0_8px_0_0_rgba(88,28,135,0.45)] transition hover:-translate-y-1 hover:bg-yellow-50 hover:shadow-[0_11px_0_0_rgba(88,28,135,0.45)]"
            >
              Start free adventure 🦋
            </a>
            <p className="mt-4 text-sm font-bold text-purple-200">
              No credit card needed · Works on phones & tablets
            </p>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="px-4 pb-10 pt-6 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] border-4 border-purple-100 bg-white/70 p-8 sm:p-10">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-green-200 bg-green-100 text-lg">
                  🌱
                </span>
                <span className="text-2xl font-black text-purple-900">Bloomly</span>
              </div>
              <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-purple-700/80">
                Tiny garden adventures that grow big readers, counters, and kind little humans. Made with 💜 in
                Maplewood Grove.
              </p>
              <div className="mt-4 flex gap-2">
                {["🌻", "🐞", "🦋", "⭐"].map((e) => (
                  <span
                    key={e}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-purple-100 bg-purple-50 text-base transition hover:-translate-y-1 hover:border-pink-200 hover:bg-pink-50"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
            {[
              {
                heading: "Explore",
                links: ["What kids learn", "How it works", "Garden worlds", "Pricing"],
              },
              {
                heading: "Grown-ups",
                links: ["Parent dashboard", "Safety & privacy", "Teacher resources", "Scholarships"],
              },
              {
                heading: "Bloomly HQ",
                links: ["Our story", "Help center", "hello@bloomly.app", "Press kit"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h3 className="text-sm font-black uppercase tracking-wider text-purple-900">
                  {col.heading}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm font-semibold text-purple-700/80 transition hover:text-pink-600"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t-4 border-dotted border-purple-100 pt-6 sm:flex-row">
            <p className="text-xs font-bold text-purple-600/70">
              © 2026 Bloomly Learning Co. All rights reserved. A pretend company growing pretend gardens. 🌷
            </p>
            <div className="flex gap-5 text-xs font-bold text-purple-600/70">
              <a href="#" className="transition hover:text-pink-600">Privacy</a>
              <a href="#" className="transition hover:text-pink-600">Terms</a>
              <a href="#" className="transition hover:text-pink-600">COPPA notice</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
