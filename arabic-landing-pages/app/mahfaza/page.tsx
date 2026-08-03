"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/* أدوات مساعدة                                                        */
/* ------------------------------------------------------------------ */

function arNum(value: number | string): string {
  const str = typeof value === "number" ? value.toString() : value;
  const [int, frac] = str.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  const full = frac ? `${grouped}٫${frac}` : grouped;
  return full.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function monthsLabel(m: number): string {
  if (m === 1) return "شهر واحد";
  if (m === 2) return "شهران";
  if (m >= 3 && m <= 10) return `${arNum(m)} أشهر`;
  return `${arNum(m)} شهراً`;
}

function yearsLabel(y: number): string {
  if (y === 1) return "سنة واحدة";
  if (y === 2) return "سنتان";
  if (y >= 3 && y <= 10) return `${arNum(y)} سنوات`;
  return `${arNum(y)} سنة`;
}

function CountUp({
  target,
  suffix = "",
  decimals = 0,
  duration = 1600,
}: {
  target: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let intervalId: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const steps = Math.max(1, Math.round(duration / 30));
          let step = 0;
          intervalId = window.setInterval(() => {
            step += 1;
            const eased = 1 - Math.pow(1 - step / steps, 3);
            setDisplay(Number((target * eased).toFixed(decimals)));
            if (step >= steps && intervalId !== undefined) {
              window.clearInterval(intervalId);
            }
          }, 30);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [target, duration, decimals]);

  return (
    <span ref={ref}>
      {arNum(display.toFixed(decimals))}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* البيانات                                                            */
/* ------------------------------------------------------------------ */

const navLinks = [
  { label: "المزايا", href: "#features" },
  { label: "حاسبة الادخار", href: "#calculator" },
  { label: "الرسوم", href: "#fees" },
  { label: "الأمان", href: "#security" },
  { label: "آراء المستخدمين", href: "#testimonials" },
];

const stats = [
  { target: 2.5, suffix: " مليون+", decimals: 1, label: "مستخدم نشط شهرياً" },
  { target: 850, suffix: " مليون", decimals: 0, label: "ريال مدخرات محققة" },
  { target: 4.9, suffix: " ★", decimals: 1, label: "تقييم على متاجر التطبيقات" },
  { target: 60, suffix: "+", decimals: 0, label: "دولة للتحويلات الفورية" },
];

const steps = [
  {
    num: "١",
    icon: "📲",
    title: "حمّل التطبيق",
    body: "متوفر مجاناً على آيفون وأندرويد. التسجيل يستغرق أقل من دقيقتين برقم جوالك فقط.",
  },
  {
    num: "٢",
    icon: "🪪",
    title: "وثّق هويتك",
    body: "تحقق فوري وآمن عبر نفاذ الوطني. لا أوراق، لا فروع، لا انتظار في الطوابير.",
  },
  {
    num: "٣",
    icon: "🚀",
    title: "اشحن وابدأ",
    body: "اشحن محفظتك من أي بطاقة أو حساب بنكي، وابدأ الدفع والتحويل والادخار فوراً.",
  },
];

const feesRows = [
  { label: "التحويل المحلي الفوري", mahfaza: "مجاناً", bank: "١٥ ريالاً" },
  { label: "التحويل الدولي", mahfaza: "١٪ فقط بسعر الصرف الحقيقي", bank: "٣٪ – ٥٪ + رسوم ثابتة" },
  { label: "الرسوم الشهرية", mahfaza: "٠ ريال", bank: "١٠ – ٢٥ ريالاً" },
  { label: "السحب من الصراف", mahfaza: "مجاناً حتى ٥ عمليات", bank: "رسوم على كل عملية" },
  { label: "صرف العملات", mahfaza: "السعر اللحظي دون هامش", bank: "هامش مخفي يصل إلى ٤٪" },
  { label: "إصدار البطاقة الرقمية", mahfaza: "فوري ومجاني", bank: "أيام عمل ورسوم إصدار" },
];

const securityItems = [
  {
    icon: "🔐",
    title: "تشفير من الدرجة المصرفية",
    body: "جميع بياناتك ومعاملاتك مشفرة بمعيار AES-256 أثناء التخزين وTLS 1.3 أثناء النقل. حتى فريقنا لا يستطيع الاطلاع على بيانات بطاقاتك، فهي مرمّزة بالكامل عبر تقنية Tokenization.",
  },
  {
    icon: "📱",
    title: "مصادقة ثنائية وبصمة حيوية",
    body: "كل عملية دخول أو تحويل تتطلب تحققاً ثنائياً عبر بصمة الوجه أو الإصبع إضافة إلى رمز لمرة واحدة. ويمكنك تفعيل تنبيهات فورية لأي نشاط على حسابك مهما كان صغيراً.",
  },
  {
    icon: "🏛️",
    title: "ترخيص البنك المركزي",
    body: "محفظة شركة تقنية مالية مرخصة من البنك المركزي وتخضع لرقابته الكاملة. أموال العملاء محفوظة في حسابات مصرفية معزولة تماماً عن أموال الشركة التشغيلية.",
  },
  {
    icon: "🛡️",
    title: "حماية متقدمة من الاحتيال",
    body: "أنظمة ذكاء اصطناعي تراقب المعاملات على مدار الساعة وتوقف أي عملية مشبوهة قبل اكتمالها. وفي الحالات النادرة للاحتيال المثبت، نعيد لك أموالك وفق سياسة الحماية الشاملة.",
  },
];

const testimonials = [
  {
    quote:
      "كنت أدفع رسوماً شهرية وأنتظر يومين لكل حوالة. مع محفظة صارت التحويلات فورية ومجانية، وميزة الادخار التلقائي جمعت لي مقدم سيارة دون أن أشعر.",
    name: "ريم العبدالله",
    role: "مصممة جرافيك — الرياض",
    initials: "ر",
  },
  {
    quote:
      "أحوّل لأهلي خارج المملكة كل شهر. الفرق في سعر الصرف وحده وفّر لي أكثر من ألفي ريال خلال سنة. التطبيق بالعربية وسهل حتى لوالدي.",
    name: "محمد نور",
    role: "مهندس برمجيات — جدة",
    initials: "م",
  },
  {
    quote:
      "أكثر ما يطمئنني هو التنبيهات الفورية والتحكم الكامل بالبطاقة: أجمدها وأفك تجميدها بضغطة. أخيراً تطبيق مالي يحترم وقتي وذكائي.",
    name: "هند القحطاني",
    role: "طالبة ماجستير — الدمام",
    initials: "هـ",
  },
];

const partners = ["مدى", "فيزا", "ماستركارد", "سداد", "أبل باي", "جوجل باي"];

/* ------------------------------------------------------------------ */
/* مكونات الهاتف                                                       */
/* ------------------------------------------------------------------ */

const qrPattern =
  "1111101010111110000101110100010111010101011101000101111101010111110000000110000000101011110110101101000111000110111010010100010100110110011011000".slice(0, 121);

function PhoneMockup({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-[290px] rounded-[3rem] border-[10px] border-zinc-800 bg-zinc-950 shadow-2xl shadow-emerald-950/60">
      <div className="absolute left-1/2 top-2.5 h-5 w-28 -translate-x-1/2 rounded-full bg-zinc-800" />
      <div className="h-[560px] overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 pb-5 pt-12">
        {children}
      </div>
    </div>
  );
}

function BalanceCard() {
  return (
    <div className="rounded-2xl bg-gradient-to-bl from-emerald-500 to-teal-700 p-4 shadow-lg shadow-emerald-950/50">
      <div className="text-xs text-emerald-100">الرصيد المتاح</div>
      <div className="mt-1 text-2xl font-extrabold text-white">١٢٬٤٥٠٫٧٥ ر.س</div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-100">
        <span>محفظة ●●●● ٤٨٢١</span>
        <span className="font-bold">محفظة</span>
      </div>
    </div>
  );
}

function ScreenPay() {
  return (
    <div className="flex h-full flex-col gap-4">
      <BalanceCard />
      <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
        <div className="text-center text-xs font-bold text-zinc-300">امسح للدفع</div>
        <div className="mx-auto mt-3 grid w-fit grid-cols-11 gap-[3px] rounded-lg bg-white p-3">
          {qrPattern.split("").map((cell, i) => (
            <span
              key={i}
              className={`h-[9px] w-[9px] rounded-[1px] ${cell === "1" ? "bg-zinc-900" : "bg-white"}`}
            />
          ))}
        </div>
        <div className="mt-3 text-center text-[10px] text-zinc-500">
          صالح لمدة ٥ دقائق — يتجدد تلقائياً
        </div>
      </div>
      <button
        type="button"
        className="rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-emerald-950 transition-colors hover:bg-emerald-400"
      >
        ادفع الآن
      </button>
    </div>
  );
}

function ScreenTransfers() {
  const contacts = [
    { emoji: "👩🏻", name: "أمل سعد", note: "إيجار الشقة", amount: "-١٬٥٠٠ ر.س" },
    { emoji: "👨🏽", name: "فهد العلي", note: "عشاء أمس", amount: "+٨٥ ر.س" },
    { emoji: "👵🏼", name: "الوالدة ❤️", note: "تحويل شهري", amount: "-٢٬٠٠٠ ر.س" },
    { emoji: "🧑🏻‍💻", name: "مشروع التخرج", note: "مجموعة — ٤ أعضاء", amount: "+٣٢٠ ر.س" },
  ];
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
        <div className="text-xs text-zinc-400">تحويل سريع</div>
        <div className="mt-1 text-xl font-extrabold text-emerald-400">برقم الجوال فقط</div>
      </div>
      <div className="flex-1 space-y-2.5 overflow-hidden">
        {contacts.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-base">
                {c.emoji}
              </span>
              <div>
                <div className="text-xs font-bold text-zinc-100">{c.name}</div>
                <div className="text-[10px] text-zinc-500">{c.note}</div>
              </div>
            </div>
            <span
              className={`text-xs font-bold ${
                c.amount.startsWith("+") ? "text-emerald-400" : "text-zinc-300"
              }`}
            >
              {c.amount}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-emerald-950 transition-colors hover:bg-emerald-400"
      >
        تحويل جديد ←
      </button>
    </div>
  );
}

function ScreenSavings() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
        <div className="text-xs text-zinc-400">هدف الادخار: رحلة العمرة</div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full"
          style={{ background: "conic-gradient(#10b981 0% 68%, #27272a 68% 100%)" }}
        >
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-zinc-950">
            <span className="text-2xl font-extrabold text-emerald-400">٦٨٪</span>
            <span className="text-[10px] text-zinc-500">٣٬٤٠٠ من ٥٬٠٠٠ ر.س</span>
          </div>
        </div>
        <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
          <div className="text-[10px] text-emerald-300">الادخار التلقائي مفعل ✓</div>
          <div className="mt-0.5 text-xs font-bold text-zinc-200">
            تقريب كل عملية شراء لأقرب ٥ ريالات
          </div>
        </div>
      </div>
      <button
        type="button"
        className="rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-emerald-950 transition-colors hover:bg-emerald-400"
      >
        أضف هدفاً جديداً
      </button>
    </div>
  );
}

function ScreenCards() {
  const [frozen, setFrozen] = useState(false);
  return (
    <div className="flex h-full flex-col gap-4">
      <div
        className={`rounded-2xl p-4 shadow-lg transition-all duration-500 ${
          frozen
            ? "bg-gradient-to-bl from-zinc-600 to-zinc-800 opacity-70 grayscale"
            : "bg-gradient-to-bl from-teal-500 via-emerald-600 to-emerald-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">محفظة • بطاقة رقمية</span>
          <span className="text-base">{frozen ? "🧊" : "💳"}</span>
        </div>
        <div className="mt-6 flex items-center gap-3 text-white" dir="ltr">
          <span className="tracking-widest">••••</span>
          <span className="tracking-widest">••••</span>
          <span className="tracking-widest">••••</span>
          <span className="font-bold tracking-widest">4821</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] text-emerald-100">
          <span>ريم العبدالله</span>
          <span>تنتهي ٠٩/٢٩</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5">
        {[
          { icon: "🛒", name: "متجر التمور الفاخرة", amount: "-٦٤ ر.س" },
          { icon: "☕", name: "قهوة سحابة", amount: "-١٨ ر.س" },
          { icon: "⛽", name: "محطة الواحة", amount: "-١٢٠ ر.س" },
        ].map((tx) => (
          <div
            key={tx.name}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3"
          >
            <span className="text-xs text-zinc-200">
              <span className="me-2">{tx.icon}</span>
              {tx.name}
            </span>
            <span className="text-xs font-bold text-zinc-400">{tx.amount}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setFrozen(!frozen)}
        className={`rounded-xl py-3 text-sm font-extrabold transition-all duration-300 ${
          frozen
            ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            : "border border-zinc-700 text-zinc-200 hover:border-emerald-500 hover:text-emerald-400"
        }`}
      >
        {frozen ? "فك تجميد البطاقة" : "تجميد البطاقة مؤقتاً 🧊"}
      </button>
    </div>
  );
}

const featureTabs = [
  {
    id: "pay",
    icon: "💳",
    label: "الدفع",
    title: "ادفع في ثانية… بهاتفك فقط",
    desc: "ادفع لدى مئات الآلاف من المتاجر برمز QR أو عبر البطاقة الرقمية، مع استرداد نقدي يصل إلى ٥٪ على مشترياتك اليومية.",
    screen: <ScreenPay />,
  },
  {
    id: "transfer",
    icon: "↔️",
    label: "التحويلات",
    title: "حوّل لأي شخص برقم جواله",
    desc: "تحويلات محلية فورية مجانية على مدار الساعة، وتحويلات دولية لأكثر من ٦٠ دولة بسعر الصرف الحقيقي دون هوامش خفية.",
    screen: <ScreenTransfers />,
  },
  {
    id: "save",
    icon: "🌱",
    label: "الادخار",
    title: "ادخر دون أن تشعر",
    desc: "حدد أهدافك وفعّل التقريب التلقائي: كل عملية شراء تقرّب لأقرب ٥ ريالات والفرق يذهب مباشرة إلى هدفك.",
    screen: <ScreenSavings />,
  },
  {
    id: "cards",
    icon: "🧊",
    label: "البطاقات",
    title: "بطاقتك… تحت سيطرتك الكاملة",
    desc: "أصدر بطاقة رقمية فورية مجاناً، وجمّدها أو فك تجميدها بضغطة واحدة، وحدد سقوف إنفاق لكل فئة من المشتريات.",
    screen: <ScreenCards />,
  },
];

/* ------------------------------------------------------------------ */
/* الصفحة الرئيسية                                                     */
/* ------------------------------------------------------------------ */

export default function MahfazaPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pay");
  const [feesFocus, setFeesFocus] = useState<"mahfaza" | "bank">("mahfaza");
  const [openItem, setOpenItem] = useState<number | null>(0);

  const [goalInput, setGoalInput] = useState("50000");
  const [monthlyInput, setMonthlyInput] = useState("1500");
  const [savedInput, setSavedInput] = useState("5000");

  const [waitName, setWaitName] = useState("");
  const [waitPhone, setWaitPhone] = useState("");
  const [waitErrors, setWaitErrors] = useState<Record<string, string>>({});
  const [waitDone, setWaitDone] = useState(false);

  const activeFeature = featureTabs.find((t) => t.id === activeTab) ?? featureTabs[0];

  /* حسابات الادخار الحية */
  const goal = Math.max(0, Number(normalizeDigits(goalInput)) || 0);
  const monthly = Math.max(0, Number(normalizeDigits(monthlyInput)) || 0);
  const saved = Math.max(0, Number(normalizeDigits(savedInput)) || 0);
  const remaining = Math.max(0, goal - saved);
  const months = monthly > 0 && remaining > 0 ? Math.ceil(remaining / monthly) : 0;
  const progress = goal > 0 ? Math.min(100, Math.round((saved / goal) * 100)) : 0;
  const years = Math.floor(months / 12);
  const restMonths = months % 12;

  function validateWaitlist(): boolean {
    const next: Record<string, string> = {};
    if (waitName.trim().length < 2) next.name = "يرجى إدخال اسمك الكريم";
    const phone = normalizeDigits(waitPhone).replace(/[\s-]/g, "");
    if (!/^05\d{8}$/.test(phone)) {
      next.phone = "يرجى إدخال رقم جوال صحيح يبدأ بـ ٠٥ ويتكون من ١٠ أرقام";
    }
    setWaitErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleWaitlist(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (validateWaitlist()) setWaitDone(true);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/40">
      {/* ---------------- شريط التنقل ---------------- */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-bl from-emerald-400 to-teal-600 text-lg shadow-lg shadow-emerald-950/60">
              👛
            </span>
            <span className="bg-gradient-to-l from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              محفظة
            </span>
          </a>

          <ul className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-zinc-300 transition-colors hover:text-emerald-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <a
              href="#download"
              className="rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-extrabold text-emerald-950 shadow-lg shadow-emerald-950/50 transition-all hover:brightness-110"
            >
              حمّل التطبيق
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="فتح القائمة"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 text-zinc-200 transition-colors hover:border-emerald-500 md:hidden"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-zinc-800 bg-zinc-950/95 px-4 py-4 md:hidden">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#download"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 block rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 px-3 py-2.5 text-center text-sm font-extrabold text-emerald-950"
                >
                  حمّل التطبيق
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>

      <main id="top">
        {/* ---------------- البطل ---------------- */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 right-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute top-52 left-0 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                مرخصة من البنك المركزي — أموالك في أمان
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.2] sm:text-5xl lg:text-6xl">
                مالك كله…
                <span className="bg-gradient-to-l from-emerald-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  {" "}في جيبك
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
                محفظة هي تطبيقك المالي الشامل: ادفع بلمسة، حوّل مجاناً خلال ثوانٍ،
                وادخر تلقائياً نحو أهدافك — كل ذلك دون رسوم شهرية ودون فروع ودون تعقيد.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#download"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 px-7 py-3.5 text-base font-extrabold text-emerald-950 shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.02] hover:brightness-110"
                >
                  افتح حسابك مجاناً
                  <span className="transition-transform group-hover:-translate-x-1">←</span>
                </a>
                <a
                  href="#calculator"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-7 py-3.5 text-base font-bold text-zinc-200 transition-all hover:border-emerald-500 hover:bg-emerald-500/10"
                >
                  جرّب حاسبة الادخار
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400">
                <span>✓ بلا رسوم شهرية</span>
                <span>✓ فتح الحساب في دقيقتين</span>
                <span>✓ دعم بالعربية ٢٤/٧</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-gradient-to-bl from-emerald-500/25 to-teal-600/15 blur-3xl" />
              <div className="relative">
                <PhoneMockup>
                  <ScreenPay />
                </PhoneMockup>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- الإحصاءات ---------------- */}
        <section className="border-y border-zinc-800/80 bg-zinc-900/40">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="bg-gradient-to-l from-emerald-300 to-teal-300 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
                  <CountUp target={stat.target} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="mt-2 text-sm text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- كيف تعمل ---------------- */}
        <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">ثلاث خطوات… وتبدأ حياتك المالية الجديدة</h2>
            <p className="mt-4 text-lg text-zinc-400">من التحميل إلى أول عملية دفع في أقل من خمس دقائق.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="group relative rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/40"
              >
                <span className="absolute -top-5 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-bl from-emerald-400 to-teal-600 text-lg font-extrabold text-emerald-950 shadow-lg">
                  {step.num}
                </span>
                <span className="text-4xl">{step.icon}</span>
                <h3 className="mt-5 text-xl font-extrabold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- المزايا (تبويبات الهاتف) ---------------- */}
        <section id="features" className="scroll-mt-20 border-y border-zinc-800/80 bg-zinc-900/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                تطبيق واحد…
                <span className="bg-gradient-to-l from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                  {" "}يغنيك عن أربعة
                </span>
              </h2>
              <p className="mt-4 text-lg text-zinc-400">تنقل بين الشاشات وشاهد التطبيق كما ستستخدمه تماماً.</p>
            </div>

            <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex flex-wrap gap-3">
                  {featureTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-xl px-5 py-3 text-sm font-extrabold transition-all duration-300 ${
                        activeTab === tab.id
                          ? "bg-gradient-to-l from-emerald-500 to-teal-500 text-emerald-950 shadow-lg shadow-emerald-950/50"
                          : "border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-emerald-500/60 hover:text-emerald-300"
                      }`}
                    >
                      <span className="me-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <h3 className="mt-8 text-2xl font-extrabold text-white sm:text-3xl">
                  {activeFeature.title}
                </h3>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-zinc-400">
                  {activeFeature.desc}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                  {[
                    "إشعار فوري لكل عملية مهما صغرت",
                    "سجل كامل قابل للبحث والتصدير",
                    "تصنيف تلقائي ذكي للمصروفات",
                  ].map((point) => (
                    <li key={point} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-400">
                        ✓
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <PhoneMockup>{activeFeature.screen}</PhoneMockup>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- حاسبة الادخار ---------------- */}
        <section id="calculator" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">حاسبة أهداف الادخار</h2>
            <p className="mt-4 text-lg text-zinc-400">
              حدد هدفك وشاهد فوراً متى ستصل إليه مع الإيداع التلقائي من محفظة.
            </p>
          </div>

          <div className="mt-12 grid gap-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl shadow-emerald-950/30 lg:grid-cols-2 sm:p-10">
            <div className="space-y-6">
              <div>
                <label htmlFor="calc-goal" className="mb-2 block text-sm font-bold text-zinc-200">
                  قيمة الهدف (ريال)
                </label>
                <input
                  id="calc-goal"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </div>
              <div>
                <label htmlFor="calc-monthly" className="mb-2 block text-sm font-bold text-zinc-200">
                  الإيداع الشهري (ريال)
                </label>
                <input
                  id="calc-monthly"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </div>
              <div>
                <label htmlFor="calc-saved" className="mb-2 block text-sm font-bold text-zinc-200">
                  المدخر حالياً (ريال)
                </label>
                <input
                  id="calc-saved"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={savedInput}
                  onChange={(e) => setSavedInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </div>
              <p className="text-xs text-zinc-500">
                * حساب تقديري لا يشمل أي عوائد استثمارية، والأرقام تتحدث لحظياً مع كل تعديل.
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-transparent p-8">
              {goal === 0 ? (
                <p className="text-center text-lg font-bold text-zinc-300">
                  حدد قيمة هدفك أولاً لتبدأ الحسبة 🎯
                </p>
              ) : remaining === 0 ? (
                <div className="text-center">
                  <div className="text-5xl">🎉</div>
                  <p className="mt-4 text-2xl font-extrabold text-emerald-300">تهانينا! حققت هدفك بالفعل</p>
                  <p className="mt-2 text-sm text-zinc-400">حان وقت هدف جديد أكبر وأجرأ.</p>
                </div>
              ) : monthly === 0 ? (
                <p className="text-center text-lg font-bold text-amber-300">
                  أدخل مبلغ إيداع شهري أكبر من صفر لنحسب لك المدة ⏳
                </p>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-sm text-zinc-400">ستصل إلى هدفك خلال</div>
                    <div className="mt-2 text-5xl font-extrabold text-emerald-300">
                      {monthsLabel(months)}
                    </div>
                    {months >= 12 && (
                      <div className="mt-2 text-sm text-zinc-400">
                        أي ما يعادل {yearsLabel(years)}
                        {restMonths > 0 && ` و${monthsLabel(restMonths)}`}
                      </div>
                    )}
                  </div>
                  <div className="mt-8">
                    <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                      <span>تقدمك الحالي نحو الهدف</span>
                      <span className="font-bold text-emerald-300">{arNum(progress)}٪</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500 transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span>المدخر: {arNum(saved)} ر.س</span>
                      <span>المتبقي: {arNum(remaining)} ر.س</span>
                    </div>
                  </div>
                  <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs text-emerald-200">
                    💡 فعّل التقريب التلقائي وقد تختصر المدة بعدة أشهر إضافية!
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ---------------- مقارنة الرسوم ---------------- */}
        <section id="fees" className="scroll-mt-20 border-y border-zinc-800/80 bg-zinc-900/40 py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold sm:text-4xl">رسومنا مقابل البنوك التقليدية</h2>
              <p className="mt-4 text-lg text-zinc-400">
                الأرقام تتحدث: مستخدم محفظة يوفر في المتوسط ٨٤٠ ريالاً سنوياً من الرسوم وحدها.
              </p>
            </div>

            <div className="mt-10 flex justify-center">
              <div className="inline-flex rounded-xl border border-zinc-700 bg-zinc-900 p-1.5">
                <button
                  type="button"
                  onClick={() => setFeesFocus("mahfaza")}
                  className={`rounded-lg px-6 py-2.5 text-sm font-extrabold transition-all duration-300 ${
                    feesFocus === "mahfaza"
                      ? "bg-gradient-to-l from-emerald-500 to-teal-500 text-emerald-950 shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  👛 محفظة
                </button>
                <button
                  type="button"
                  onClick={() => setFeesFocus("bank")}
                  className={`rounded-lg px-6 py-2.5 text-sm font-extrabold transition-all duration-300 ${
                    feesFocus === "bank"
                      ? "bg-zinc-600 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  🏦 البنوك التقليدية
                </button>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/60">
              <div className="grid grid-cols-3 border-b border-zinc-800 bg-zinc-900/80 text-center text-sm font-extrabold">
                <div className="p-4 text-right text-zinc-300">الخدمة</div>
                <div
                  className={`p-4 transition-all duration-500 ${
                    feesFocus === "mahfaza" ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400"
                  }`}
                >
                  محفظة
                </div>
                <div
                  className={`p-4 transition-all duration-500 ${
                    feesFocus === "bank" ? "bg-zinc-700/40 text-white" : "text-zinc-400"
                  }`}
                >
                  البنوك التقليدية
                </div>
              </div>
              {feesRows.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-3 text-center text-sm transition-colors hover:bg-zinc-900/60 ${
                    i < feesRows.length - 1 ? "border-b border-zinc-800/70" : ""
                  }`}
                >
                  <div className="p-4 text-right font-bold text-zinc-200">{row.label}</div>
                  <div
                    className={`p-4 transition-all duration-500 ${
                      feesFocus === "mahfaza"
                        ? "scale-[1.03] bg-emerald-500/15 font-extrabold text-emerald-300"
                        : "text-zinc-400"
                    }`}
                  >
                    {row.mahfaza}
                  </div>
                  <div
                    className={`p-4 transition-all duration-500 ${
                      feesFocus === "bank"
                        ? "scale-[1.03] bg-zinc-700/40 font-extrabold text-white"
                        : "text-zinc-500"
                    }`}
                  >
                    {row.bank}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-zinc-500">
              المقارنة استرشادية بناءً على متوسط الرسوم المعلنة لدى خمسة بنوك محلية كبرى.
            </p>
          </div>
        </section>

        {/* ---------------- الأمان (أكورديون) ---------------- */}
        <section id="security" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
              أمانك أولويتنا الأولى
            </span>
            <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">كيف نحمي أموالك وبياناتك؟</h2>
          </div>

          <div className="mt-12 space-y-4">
            {securityItems.map((item, i) => (
              <div
                key={item.title}
                className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                  openItem === i
                    ? "border-emerald-500/50 bg-zinc-900/80"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenItem(openItem === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-right"
                >
                  <span className="flex items-center gap-3 text-base font-extrabold text-white">
                    <span className="text-2xl">{item.icon}</span>
                    {item.title}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`h-5 w-5 shrink-0 text-emerald-400 transition-transform duration-300 ${
                      openItem === i ? "rotate-180" : ""
                    }`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openItem === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- آراء المستخدمين ---------------- */}
        <section id="testimonials" className="scroll-mt-20 border-y border-zinc-800/80 bg-zinc-900/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold sm:text-4xl">ماذا يقول مستخدمونا؟</h2>
              <p className="mt-4 text-lg text-zinc-400">
                أكثر من مليونين ونصف يديرون أموالهم اليوم عبر محفظة.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure
                  key={t.name}
                  className="flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900/70 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/40"
                >
                  <div className="text-amber-400">★★★★★</div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-zinc-800 pt-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-bl from-emerald-400 to-teal-600 font-extrabold text-emerald-950">
                      {t.initials}
                    </span>
                    <div>
                      <div className="text-sm font-extrabold text-white">{t.name}</div>
                      <div className="text-xs text-zinc-500">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- الشركاء ---------------- */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-center text-sm font-bold text-zinc-500">
            شبكة مدفوعات تغطيك أينما كنت — بالشراكة مع
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {partners.map((p) => (
              <span
                key={p}
                className="text-xl font-extrabold tracking-wide text-zinc-600 transition-colors hover:text-emerald-300"
              >
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* ---------------- التحميل / قائمة الانتظار ---------------- */}
        <section id="download" className="scroll-mt-20 px-4 py-10 sm:px-6">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-600 via-teal-700 to-emerald-800 px-6 py-16 shadow-2xl shadow-emerald-950/50 sm:px-12">
            <div className="pointer-events-none absolute -top-24 right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

            <div className="relative grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-extrabold sm:text-4xl">جاهز تبدأ؟ حمّل محفظة الآن</h2>
                <p className="mt-4 max-w-md text-lg text-emerald-50">
                  سجل رقم جوالك وسنرسل لك رابط التحميل فوراً، مع رصيد ترحيبي ٢٥ ريالاً
                  عند أول عملية دفع.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-xl bg-zinc-950 px-5 py-3 text-right transition-all hover:scale-[1.03] hover:bg-zinc-900"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white">
                      <path d="M12 5.2c.2-1.6 1.4-2.9 3-3.2.2 1.6-1 3.1-3 3.2z" />
                      <path d="M15.6 6.2c-1.3 0-2.1.7-3.6.7s-2.3-.7-3.6-.7C5.8 6.2 3.8 8.5 3.8 12c0 3.8 2.7 9 4.9 9 1 0 1.6-.7 3.3-.7s2.3.7 3.3.7c2.2 0 4.9-5.2 4.9-9 0-3.5-2-5.8-4.6-5.8z" />
                    </svg>
                    <span>
                      <span className="block text-[10px] text-zinc-400">حمّله من</span>
                      <span className="block text-sm font-extrabold text-white">آب ستور</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-xl bg-zinc-950 px-5 py-3 text-right transition-all hover:scale-[1.03] hover:bg-zinc-900"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-emerald-400">
                      <path d="M5 3.5v17c0 .6.7 1 1.2.7l14-8.5c.5-.3.5-1 0-1.3l-14-8.5C5.7 2.5 5 2.9 5 3.5z" />
                    </svg>
                    <span>
                      <span className="block text-[10px] text-zinc-400">متوفر على</span>
                      <span className="block text-sm font-extrabold text-white">جوجل بلاي</span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-zinc-950/40 p-8 backdrop-blur">
                {waitDone ? (
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 text-3xl">
                      ✅
                    </div>
                    <h3 className="mt-5 text-2xl font-extrabold text-emerald-200">
                      تم التسجيل بنجاح!
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-emerald-50">
                      أهلاً {waitName.trim()} 👋 أرسلنا رسالة نصية إلى جوالك تحتوي رابط
                      التحميل ورمز الرصيد الترحيبي. نراك داخل التطبيق!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setWaitDone(false);
                        setWaitName("");
                        setWaitPhone("");
                        setWaitErrors({});
                      }}
                      className="mt-6 rounded-xl border border-emerald-300/50 px-6 py-2.5 text-sm font-bold text-emerald-100 transition-colors hover:bg-emerald-400/10"
                    >
                      تسجيل رقم آخر
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} noValidate>
                    <h3 className="text-xl font-extrabold text-white">أرسل لي رابط التحميل</h3>
                    <div className="mt-6 space-y-5">
                      <div>
                        <label htmlFor="wait-name" className="mb-2 block text-sm font-bold text-emerald-50">
                          الاسم
                        </label>
                        <input
                          id="wait-name"
                          type="text"
                          value={waitName}
                          onChange={(e) => setWaitName(e.target.value)}
                          placeholder="مثال: سلمان الراشد"
                          className={`w-full rounded-xl border bg-zinc-950/70 px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/70 ${
                            waitErrors.name ? "border-rose-400" : "border-white/20"
                          }`}
                        />
                        {waitErrors.name && (
                          <p className="mt-2 text-xs font-semibold text-rose-300">{waitErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="wait-phone" className="mb-2 block text-sm font-bold text-emerald-50">
                          رقم الجوال
                        </label>
                        <input
                          id="wait-phone"
                          type="tel"
                          value={waitPhone}
                          onChange={(e) => setWaitPhone(e.target.value)}
                          placeholder="05XXXXXXXX"
                          dir="ltr"
                          className={`w-full rounded-xl border bg-zinc-950/70 px-4 py-3 text-left text-sm text-white placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/70 ${
                            waitErrors.phone ? "border-rose-400" : "border-white/20"
                          }`}
                        />
                        {waitErrors.phone && (
                          <p className="mt-2 text-xs font-semibold text-rose-300">{waitErrors.phone}</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-zinc-950 py-4 text-base font-extrabold text-emerald-300 shadow-xl transition-all hover:scale-[1.01] hover:bg-zinc-900"
                      >
                        أرسل الرابط الآن ←
                      </button>
                      <p className="text-center text-[11px] text-emerald-100/70">
                        بالتسجيل أنت توافق على شروط الاستخدام وسياسة الخصوصية. لن نرسل لك أي رسائل تسويقية دون إذنك.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- التذييل ---------------- */}
      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 text-2xl font-extrabold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-bl from-emerald-400 to-teal-600 text-lg">
                  👛
                </span>
                <span className="bg-gradient-to-l from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                  محفظة
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
                تطبيق مالي شامل للدفع والتحويل والادخار، مبني ليكون أبسط وأرخص وأكثر
                أماناً من أي خيار تقليدي.
              </p>
              <div className="mt-6 flex gap-3">
                {["𝕏", "in", "▶", "✉"].map((icon) => (
                  <span
                    key={icon}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-700 text-sm text-zinc-400 transition-all hover:border-emerald-500 hover:text-emerald-300"
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>
            {[
              {
                title: "المنتج",
                links: ["الدفع بالرمز", "التحويلات الدولية", "أهداف الادخار", "البطاقة الرقمية", "الاسترداد النقدي"],
              },
              {
                title: "الشركة",
                links: ["من نحن", "الوظائف", "المدونة المالية", "الشركاء", "المركز الإعلامي"],
              },
              {
                title: "المساعدة",
                links: ["مركز الدعم", "الرسوم والحدود", "الإبلاغ عن احتيال", "حالة الخدمة", "تواصل معنا"],
              },
            ].map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-extrabold text-white">{column.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((label) => (
                    <li key={label}>
                      <span className="cursor-pointer text-sm text-zinc-400 transition-colors hover:text-emerald-300">
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-3 border-t border-zinc-800 pt-8 text-[11px] leading-relaxed text-zinc-500">
            <p>
              محفظة للتقنية المالية — شركة مرخصة من البنك المركزي لمزاولة نشاط المحافظ
              الإلكترونية بموجب الترخيص رقم ٤٢/أش/١٤٤٦. أموال العملاء محفوظة في حسابات
              مصرفية معزولة لدى بنوك محلية مرخصة، ولا تستخدم في أي أنشطة تشغيلية للشركة.
            </p>
            <p>
              الخدمات الاستثمارية والادخارية لا تضمن عوائد محددة، وقيمة المدخرات لا تشمل
              أثر التضخم. الاسترداد النقدي يخضع للشروط والأحكام المعلنة داخل التطبيق وقد
              يتغير بإشعار مسبق مدته ٣٠ يوماً.
            </p>
            <div className="flex flex-col items-start justify-between gap-3 pt-2 sm:flex-row sm:items-center">
              <span>© ١٤٤٧هـ / ٢٠٢٦م محفظة للتقنية المالية — جميع الحقوق محفوظة.</span>
              <div className="flex gap-5">
                <span className="cursor-pointer transition-colors hover:text-emerald-300">شروط الاستخدام</span>
                <span className="cursor-pointer transition-colors hover:text-emerald-300">سياسة الخصوصية</span>
                <span className="cursor-pointer transition-colors hover:text-emerald-300">اتفاقية العميل</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* شارة العودة لجميع الصفحات */}
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-50 rounded-full border border-emerald-500/50 bg-zinc-900/90 px-4 py-2 text-xs font-bold text-emerald-300 shadow-lg shadow-emerald-950/60 backdrop-blur transition-all hover:bg-emerald-500 hover:text-emerald-950"
      >
        جميع الصفحات
      </Link>
    </div>
  );
}
