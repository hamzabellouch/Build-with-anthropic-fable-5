"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ─────────────────────────── البيانات ─────────────────────────── */

type GymClass = {
  name: string;
  time: string;
  coach: string;
  intensity: "منخفضة" | "متوسطة" | "عالية";
  emoji: string;
};

const weekDays = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
] as const;

const schedule: Record<(typeof weekDays)[number], GymClass[]> = {
  السبت: [
    { name: "كروس فيت", time: "٦:٠٠ ص", coach: "كابتن بدر", intensity: "عالية", emoji: "🏋️" },
    { name: "يوغا الصباح", time: "٨:٣٠ ص", coach: "كابتن لمى", intensity: "منخفضة", emoji: "🧘" },
    { name: "سباحة حرة", time: "٥:٠٠ م", coach: "كابتن زياد", intensity: "متوسطة", emoji: "🏊" },
    { name: "تمارين القوة", time: "٨:٠٠ م", coach: "كابتن سلطان", intensity: "عالية", emoji: "💪" },
  ],
  الأحد: [
    { name: "بيلاتس", time: "٧:٠٠ ص", coach: "كابتن دانة", intensity: "منخفضة", emoji: "🤸" },
    { name: "ملاكمة لياقة", time: "٦:٣٠ م", coach: "كابتن فيصل", intensity: "عالية", emoji: "🥊" },
    { name: "دراجات داخلية", time: "٨:٣٠ م", coach: "كابتن ريما", intensity: "متوسطة", emoji: "🚴" },
  ],
  الاثنين: [
    { name: "كروس فيت", time: "٦:٠٠ ص", coach: "كابتن بدر", intensity: "عالية", emoji: "🏋️" },
    { name: "زومبا", time: "١٠:٠٠ ص", coach: "كابتن نوف", intensity: "متوسطة", emoji: "💃" },
    { name: "سباحة تدريبية", time: "٥:٣٠ م", coach: "كابتن زياد", intensity: "عالية", emoji: "🏊" },
    { name: "يوغا مسائية", time: "٩:٠٠ م", coach: "كابتن لمى", intensity: "منخفضة", emoji: "🧘" },
  ],
  الثلاثاء: [
    { name: "تمارين وظيفية", time: "٧:٣٠ ص", coach: "كابتن سلطان", intensity: "متوسطة", emoji: "⚙️" },
    { name: "ملاكمة لياقة", time: "٦:٣٠ م", coach: "كابتن فيصل", intensity: "عالية", emoji: "🥊" },
    { name: "إطالات واستشفاء", time: "٩:٠٠ م", coach: "كابتن دانة", intensity: "منخفضة", emoji: "🪷" },
  ],
  الأربعاء: [
    { name: "كروس فيت", time: "٦:٠٠ ص", coach: "كابتن بدر", intensity: "عالية", emoji: "🏋️" },
    { name: "بيلاتس", time: "٩:٠٠ ص", coach: "كابتن دانة", intensity: "منخفضة", emoji: "🤸" },
    { name: "دراجات داخلية", time: "٧:٠٠ م", coach: "كابتن ريما", intensity: "عالية", emoji: "🚴" },
    { name: "سباحة حرة", time: "٩:٠٠ م", coach: "كابتن زياد", intensity: "متوسطة", emoji: "🏊" },
  ],
  الخميس: [
    { name: "زومبا", time: "١٠:٠٠ ص", coach: "كابتن نوف", intensity: "متوسطة", emoji: "💃" },
    { name: "تمارين القوة", time: "٥:٠٠ م", coach: "كابتن سلطان", intensity: "عالية", emoji: "💪" },
    { name: "يوغا مسائية", time: "٨:٣٠ م", coach: "كابتن لمى", intensity: "منخفضة", emoji: "🧘" },
  ],
  الجمعة: [
    { name: "جري جماعي", time: "٤:٣٠ م", coach: "كابتن فيصل", intensity: "متوسطة", emoji: "🏃" },
    { name: "سباحة عائلية", time: "٦:٠٠ م", coach: "كابتن زياد", intensity: "منخفضة", emoji: "🏊" },
  ],
};

const programs = [
  {
    title: "تدريب شخصي",
    desc: "خطة مخصصة بالكامل مع مدرب معتمد يتابع تقدمك أسبوعيًا ويعدّل برنامجك حسب نتائجك.",
    emoji: "🎯",
  },
  {
    title: "حصص جماعية",
    desc: "أكثر من ٤٠ حصة أسبوعيًا تجمع بين الحماس الجماعي وإشراف المدربين المحترفين.",
    emoji: "🤝",
  },
  {
    title: "تغذية رياضية",
    desc: "خطط غذائية يعدّها أخصائيون معتمدون لتتكامل تغذيتك مع تدريبك وأهدافك.",
    emoji: "🥗",
  },
  {
    title: "مسبح أولمبي",
    desc: "مسابح داخلية مدفّأة بمسارات تدريبية وحصص سباحة لجميع الأعمار والمستويات.",
    emoji: "🏊",
  },
  {
    title: "استشفاء وساونا",
    desc: "غرف ساونا وبخار وأحواض ثلجية لتسريع الاستشفاء العضلي بعد التمارين المكثفة.",
    emoji: "🧖",
  },
  {
    title: "متابعة ذكية",
    desc: "تطبيق لياقة يسجّل تمارينك وسعراتك ونومك ويحوّل بياناتك إلى خطة عمل واضحة.",
    emoji: "📲",
  },
];

const trainers = [
  {
    name: "كابتن بدر العنزي",
    specialty: "كروس فيت ورفع الأثقال",
    experience: "١٢ عامًا خبرة",
    badge: "مدرب معتمد CF-L3",
    emoji: "🏋️‍♂️",
    quote:
      "القوة لا تأتي من الجسد، بل من إرادة تتجاوز حدودها كل يوم. مهمتي أن أوصلك إلى نسخة أقوى منك.",
  },
  {
    name: "كابتن لمى الجهني",
    specialty: "يوغا وبيلاتس",
    experience: "٩ أعوام خبرة",
    badge: "مدربة يوغا RYT-500",
    emoji: "🧘‍♀️",
    quote:
      "التوازن بين الجسد والذهن هو أساس كل إنجاز رياضي. ابدأ من الداخل وسيتغير كل شيء.",
  },
  {
    name: "كابتن فيصل الحارثي",
    specialty: "ملاكمة ولياقة قتالية",
    experience: "١٠ أعوام خبرة",
    badge: "بطل وطني سابق",
    emoji: "🥊",
    quote:
      "كل جولة على الحلبة درس في الانضباط. سأعلّمك كيف تقاتل من أجل أهدافك داخل النادي وخارجه.",
  },
  {
    name: "كابتن ريما الشهراني",
    specialty: "لياقة قلبية ودراجات",
    experience: "٧ أعوام خبرة",
    badge: "أخصائية لياقة معتمدة",
    emoji: "🚴‍♀️",
    quote:
      "نبضك هو موسيقاك. في حصصي ستكتشف طاقة لم تكن تعلم أنها بداخلك.",
  },
];

const branches = ["فرع الرياض — العليا", "فرع جدة — الشاطئ", "فرع الدمام — الكورنيش", "فرع المدينة — قباء"];

const goals = ["خسارة الوزن", "بناء العضلات", "تحسين اللياقة العامة", "الاستعداد لمنافسة"];

const navLinks = [
  { href: "#programs", label: "برامجنا" },
  { href: "#bmi", label: "حاسبة الكتلة" },
  { href: "#schedule", label: "جدول الحصص" },
  { href: "#trainers", label: "المدربون" },
  { href: "#pricing", label: "العضويات" },
];

const intensityStyles: Record<GymClass["intensity"], string> = {
  منخفضة: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  متوسطة: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  عالية: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

/* ─────────────────────── مكوّنات مساعدة ─────────────────────── */

function Counter({
  target,
  suffix,
  label,
  emoji,
}: {
  target: number;
  suffix: string;
  label: string;
  emoji: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 1600;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div className="text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-4xl md:text-5xl font-extrabold text-lime-400 tabular-nums">
        {value.toLocaleString("ar-EG")}
        {suffix}
      </div>
      <div className="mt-2 text-slate-400 text-sm md:text-base">{label}</div>
    </div>
  );
}

/* ─────────────────────────── الصفحة ─────────────────────────── */

export default function LiyaqaPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // حاسبة مؤشر كتلة الجسم
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // جدول الحصص
  const [activeDay, setActiveDay] =
    useState<(typeof weekDays)[number]>("السبت");

  // العضويات
  const [billing, setBilling] = useState<"شهري" | "ربع سنوي" | "سنوي">("شهري");

  // سلايدر المدربين
  const [trainerIndex, setTrainerIndex] = useState(0);

  // نموذج الحجز
  const [form, setForm] = useState({ name: "", phone: "", branch: "", goal: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [booked, setBooked] = useState(false);

  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  const validInputs = !Number.isNaN(h) && !Number.isNaN(w) && h >= 100 && h <= 250 && w >= 25 && w <= 300;
  const bmi = validInputs ? w / Math.pow(h / 100, 2) : null;

  let bmiCategory = "";
  let bmiColor = "";
  let bmiAdvice = "";
  if (bmi !== null) {
    if (bmi < 18.5) {
      bmiCategory = "نقص وزن";
      bmiColor = "text-sky-400";
      bmiAdvice = "ننصحك ببرنامج بناء العضلات مع خطة تغذية لزيادة الوزن الصحي.";
    } else if (bmi < 25) {
      bmiCategory = "وزن طبيعي";
      bmiColor = "text-lime-400";
      bmiAdvice = "رائع! حافظ على لياقتك مع حصصنا الجماعية وبرامج القوة.";
    } else if (bmi < 30) {
      bmiCategory = "زيادة وزن";
      bmiColor = "text-amber-400";
      bmiAdvice = "برنامج اللياقة القلبية مع متابعة التغذية سيعيدك إلى المعدل المثالي.";
    } else {
      bmiCategory = "سمنة";
      bmiColor = "text-rose-400";
      bmiAdvice = "ابدأ بخطة تدريب شخصي متدرجة مع أخصائي تغذية — نحن معك خطوة بخطوة.";
    }
  }
  // موضع المؤشر على المقياس (من ١٥ إلى ٤٠)
  const gaugePercent =
    bmi !== null ? Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100) : 0;

  const tiers = [
    {
      name: "برونزية",
      monthly: 199,
      desc: "دخول كامل للصالة والأجهزة",
      features: [
        "دخول غير محدود لفرع واحد",
        "خزانة شخصية يومية",
        "تقييم لياقة مبدئي",
        "الوصول إلى تطبيق لياقة",
      ],
      featured: false,
    },
    {
      name: "فضية",
      monthly: 349,
      desc: "الخيار الأشهر — حصص ومسبح",
      features: [
        "دخول لجميع الفروع",
        "جميع الحصص الجماعية",
        "المسبح والساونا",
        "جلسة تدريب شخصي شهريًا",
        "خطة تغذية أساسية",
      ],
      featured: true,
    },
    {
      name: "ذهبية",
      monthly: 549,
      desc: "تجربة متكاملة بلا حدود",
      features: [
        "كل مزايا العضوية الفضية",
        "٤ جلسات تدريب شخصي شهريًا",
        "خطة تغذية متقدمة ومتابعة أسبوعية",
        "مواقف خاصة ومناشف مجانية",
        "تجميد العضوية حتى ٣٠ يومًا",
      ],
      featured: false,
    },
  ];

  const billingMeta: Record<
    typeof billing,
    { months: number; discount: number; badge: string | null }
  > = {
    شهري: { months: 1, discount: 0, badge: null },
    "ربع سنوي": { months: 3, discount: 0.1, badge: "وفّر ١٠٪" },
    سنوي: { months: 12, discount: 0.25, badge: "وفّر ٢٥٪" },
  };

  const currentTrainer = trainers[trainerIndex];

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2) {
      errors.name = "يرجى إدخال الاسم الكامل (حرفان على الأقل).";
    }
    const phoneDigits = form.phone.replace(/[\s-]/g, "");
    if (!/^(\+?\d{9,15})$/.test(phoneDigits)) {
      errors.phone = "يرجى إدخال رقم جوال صحيح (٩ أرقام على الأقل).";
    }
    if (!form.branch) {
      errors.branch = "يرجى اختيار الفرع الأقرب إليك.";
    }
    if (!form.goal) {
      errors.goal = "يرجى تحديد هدفك الرياضي.";
    }
    return errors;
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setBooked(true);
    }
  };

  const inputClasses = (field: string) =>
    `w-full rounded-xl bg-slate-800 border px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-shadow ${
      formErrors[field]
        ? "border-rose-500 focus:ring-rose-500/50"
        : "border-slate-700 focus:ring-lime-400/50 focus:border-lime-400"
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* ───────── شريط التنقل ───────── */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#top" className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-xl shadow-lg shadow-lime-500/20">
                ⚡
              </span>
              <span className="text-2xl font-extrabold text-white">
                لياقة
              </span>
            </a>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-300 hover:text-lime-400 font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#booking"
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 px-5 py-2 rounded-full font-bold transition-all shadow-lg shadow-lime-500/20 hover:shadow-lime-400/40"
              >
                احجز تجربة مجانية
              </a>
            </div>

            <button
              type="button"
              aria-label="فتح القائمة"
              className="md:hidden p-2 rounded-lg text-lime-400 hover:bg-slate-800 transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-6 h-6"
                >
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-6 h-6"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4 flex flex-col gap-1 border-t border-slate-800 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-lime-400 font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#booking"
                onClick={() => setMenuOpen(false)}
                className="mt-2 bg-lime-400 text-slate-950 text-center px-4 py-2 rounded-full font-bold"
              >
                احجز تجربة مجانية
              </a>
            </div>
          )}
        </nav>
      </header>

      {/* ───────── البطل ───────── */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(132,204,22,0.15),transparent_55%)]" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-lime-400/10 text-lime-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-lime-400/20">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                ٤ فروع — مفتوحة على مدار الساعة
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                جسدك يستحق
                <span className="block mt-2 bg-gradient-to-l from-lime-400 to-emerald-400 bg-clip-text text-transparent">
                  نسخة أقوى منك
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl">
                سلسلة أندية لياقة بأحدث الأجهزة، ومدربين معتمدين، وتطبيق ذكي
                يتابع كل تمرين وكل سعرة — لتصل إلى هدفك أسرع مما تتخيل.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="#booking"
                  className="bg-gradient-to-l from-lime-400 to-emerald-400 text-slate-950 px-8 py-3.5 rounded-full font-extrabold text-lg text-center shadow-lg shadow-lime-500/25 hover:shadow-lime-400/40 transition-all hover:-translate-y-0.5"
                >
                  ابدأ ٧ أيام مجانًا
                </a>
                <a
                  href="#schedule"
                  className="border-2 border-slate-700 text-white hover:border-lime-400/60 hover:text-lime-400 px-8 py-3.5 rounded-full font-bold text-lg text-center transition-colors"
                >
                  جدول الحصص
                </a>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-lime-400 text-lg">✔</span> بدون رسوم تسجيل
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lime-400 text-lg">✔</span> إلغاء في أي وقت
                </div>
              </div>
            </div>

            <div className="hidden md:flex justify-center">
              <div className="relative w-80">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-400/20 to-emerald-500/10 rounded-[3rem] blur-2xl" />
                <div className="relative bg-slate-900 border border-slate-700 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-slate-950 rounded-[2.4rem] overflow-hidden">
                    <div className="h-7 flex items-center justify-center">
                      <div className="w-24 h-5 bg-slate-900 rounded-b-2xl" />
                    </div>
                    <div className="px-5 pb-7 pt-2">
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-white font-bold">تمرين اليوم</span>
                        <span className="text-lime-400 text-xl">⚡</span>
                      </div>
                      <div className="bg-gradient-to-l from-lime-400 to-emerald-400 rounded-2xl p-4 text-slate-950 mb-4">
                        <div className="font-extrabold text-lg">كروس فيت</div>
                        <div className="text-sm font-semibold">٤٥ دقيقة • كابتن بدر</div>
                      </div>
                      {[
                        { label: "السعرات المحروقة", value: "٦٤٠", pct: "w-4/5" },
                        { label: "الخطوات", value: "٨٬٤٥٠", pct: "w-3/5" },
                        { label: "دقائق النشاط", value: "٧٢", pct: "w-11/12" },
                      ].map((row) => (
                        <div key={row.label} className="mb-4">
                          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                            <span>{row.label}</span>
                            <span className="text-lime-400 font-bold">{row.value}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${row.pct} bg-gradient-to-l from-lime-400 to-emerald-400 rounded-full`} />
                          </div>
                        </div>
                      ))}
                      <div className="mt-5 flex justify-between bg-slate-900 rounded-2xl px-4 py-3 border border-slate-800">
                        <span className="text-slate-300 text-sm">سلسلة الأيام 🔥</span>
                        <span className="text-lime-400 font-extrabold">١٤ يومًا</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── الإحصاءات ───────── */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter target={18000} suffix="+" label="عضو نشط" emoji="🏃" />
          <Counter target={40} suffix="+" label="حصة أسبوعية" emoji="📅" />
          <Counter target={35} suffix="+" label="مدربًا معتمدًا" emoji="🏅" />
          <Counter target={4} suffix="" label="فروع حول المملكة" emoji="📍" />
        </div>
      </section>

      {/* ───────── البرامج ───────── */}
      <section id="programs" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              كل ما تحتاجه تحت سقف واحد
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              برامج ومرافق صُممت لتلائم كل هدف وكل مستوى لياقة.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p) => (
              <div
                key={p.title}
                className="group bg-slate-900 border border-slate-800 rounded-2xl p-7 hover:border-lime-400/40 hover:bg-slate-900/80 hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-400/15 to-emerald-500/10 border border-lime-400/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {p.emoji}
                </div>
                <h3 className="mt-5 font-bold text-xl text-white">{p.title}</h3>
                <p className="mt-2.5 text-slate-400 leading-relaxed text-sm">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── حاسبة مؤشر كتلة الجسم ───────── */}
      <section id="bmi" className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              احسب مؤشر كتلة جسمك
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              أدخل طولك ووزنك لتعرف موقعك الآن — ودعنا نرسم معك الطريق.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <label className="block mb-6">
                <span className="block text-sm font-semibold text-slate-300 mb-2">
                  الطول (سم)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="مثال: ١٧٥"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition-shadow"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-slate-300 mb-2">
                  الوزن (كجم)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={25}
                  max={300}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="مثال: ٧٢"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition-shadow"
                />
              </label>
              <p className="mt-6 text-xs text-slate-500 leading-relaxed">
                مؤشر كتلة الجسم أداة استرشادية ولا يغني عن تقييم اللياقة الشامل
                الذي نقدمه مجانًا عند زيارتك الأولى.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center">
              {bmi === null ? (
                <div className="text-center text-slate-500">
                  <div className="text-5xl mb-4">⚖️</div>
                  <p className="leading-relaxed">
                    أدخل طولًا بين ١٠٠ و٢٥٠ سم ووزنًا بين ٢٥ و٣٠٠ كجم لعرض
                    النتيجة فورًا.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-slate-400 text-sm font-semibold">
                    مؤشر كتلة جسمك
                  </div>
                  <div className={`mt-2 text-6xl font-extrabold tabular-nums ${bmiColor}`}>
                    {bmi.toLocaleString("ar-EG", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </div>
                  <div className={`mt-3 inline-block text-lg font-bold px-5 py-1.5 rounded-full bg-slate-800 ${bmiColor}`}>
                    {bmiCategory}
                  </div>

                  <div className="mt-8" dir="ltr">
                    <div className="relative h-4 rounded-full overflow-hidden flex">
                      <div className="h-full bg-sky-500" style={{ width: "14%" }} />
                      <div className="h-full bg-lime-500" style={{ width: "26%" }} />
                      <div className="h-full bg-amber-500" style={{ width: "20%" }} />
                      <div className="h-full bg-rose-500" style={{ width: "40%" }} />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-4 border-slate-900 shadow-lg transition-all duration-500"
                        style={{ left: `${gaugePercent}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-slate-500 font-semibold">
                      <span>١٥</span>
                      <span>١٨٫٥</span>
                      <span>٢٥</span>
                      <span>٣٠</span>
                      <span>٤٠</span>
                    </div>
                  </div>

                  <p className="mt-6 text-sm text-slate-400 leading-relaxed">
                    {bmiAdvice}
                  </p>
                  <a
                    href="#booking"
                    className="mt-6 inline-block bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold px-6 py-2.5 rounded-full transition-colors"
                  >
                    احجز تقييمك المجاني
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── جدول الحصص ───────── */}
      <section id="schedule" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              جدول الحصص الأسبوعي
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              اختر يومك وانضم إلى الحصة التي تناسب طاقتك وجدولك.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {weekDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeDay === day
                    ? "bg-lime-400 text-slate-950 shadow-lg shadow-lime-500/25"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-lime-400/40 hover:text-lime-400"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="mt-10 space-y-4">
            {schedule[activeDay].map((cls) => (
              <div
                key={`${activeDay}-${cls.name}-${cls.time}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-lime-400/40 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-lime-400/15 to-emerald-500/10 border border-lime-400/20 flex items-center justify-center text-3xl">
                    {cls.emoji}
                  </span>
                  <div>
                    <div className="font-bold text-lg text-white">{cls.name}</div>
                    <div className="text-sm text-slate-400">{cls.coach}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-5">
                  <span className="text-lime-400 font-bold tabular-nums">
                    🕐 {cls.time}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border ${intensityStyles[cls.intensity]}`}
                  >
                    شدة {cls.intensity}
                  </span>
                  <button
                    type="button"
                    className="text-sm font-bold text-slate-950 bg-lime-400 hover:bg-lime-300 px-4 py-1.5 rounded-full transition-colors"
                  >
                    انضم
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── المدربون ───────── */}
      <section id="trainers" className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              مدربون يصنعون الفرق
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              نخبة من المدربين المعتمدين دوليًا يقفون خلف كل قصة نجاح.
            </p>
          </div>

          <div className="mt-12 relative">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-lime-400/20 to-emerald-500/10 border-2 border-lime-400/40 flex items-center justify-center text-5xl">
                {currentTrainer.emoji}
              </div>
              <h3 className="mt-5 text-2xl font-extrabold text-white">
                {currentTrainer.name}
              </h3>
              <p className="mt-1 text-lime-400 font-semibold">
                {currentTrainer.specialty}
              </p>
              <blockquote className="mt-5 text-slate-300 leading-relaxed max-w-xl mx-auto text-lg">
                &laquo;{currentTrainer.quote}&raquo;
              </blockquote>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <span className="bg-slate-800 text-slate-300 text-sm font-semibold px-4 py-2 rounded-full border border-slate-700">
                  ⏳ {currentTrainer.experience}
                </span>
                <span className="bg-lime-400/10 text-lime-400 text-sm font-semibold px-4 py-2 rounded-full border border-lime-400/20">
                  🏅 {currentTrainer.badge}
                </span>
              </div>
            </div>

            {/* في RTL "السابق" يتجه يمينًا و"التالي" يسارًا */}
            <button
              type="button"
              aria-label="المدرب السابق"
              onClick={() =>
                setTrainerIndex((i) => (i - 1 + trainers.length) % trainers.length)
              }
              className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-7 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition-colors shadow-lg"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-5 h-5"
              >
                <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="المدرب التالي"
              onClick={() => setTrainerIndex((i) => (i + 1) % trainers.length)}
              className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-7 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition-colors shadow-lg"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-5 h-5"
              >
                <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="mt-6 flex justify-center gap-2">
              {trainers.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  aria-label={`عرض ${t.name}`}
                  onClick={() => setTrainerIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === trainerIndex
                      ? "w-8 bg-lime-400"
                      : "w-2.5 bg-slate-700 hover:bg-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── العضويات ───────── */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              اختر عضويتك
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              التزم لفترة أطول ووفّر أكثر — جميع العضويات تشمل تطبيق لياقة.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <div className="inline-flex bg-slate-900 border border-slate-800 rounded-full p-1.5 gap-1">
              {(["شهري", "ربع سنوي", "سنوي"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBilling(option)}
                  className={`relative px-5 sm:px-7 py-2.5 rounded-full text-sm font-bold transition-all ${
                    billing === option
                      ? "bg-lime-400 text-slate-950 shadow-lg shadow-lime-500/25"
                      : "text-slate-300 hover:text-lime-400"
                  }`}
                >
                  {option}
                  {billingMeta[option].badge && (
                    <span
                      className={`absolute -top-3 -left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        billing === option
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-800 text-lime-400 border border-lime-400/30"
                      }`}
                    >
                      {billingMeta[option].badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 items-stretch">
            {tiers.map((tier) => {
              const meta = billingMeta[billing];
              const monthlyPrice = Math.round(tier.monthly * (1 - meta.discount));
              const totalSaved = Math.round(
                tier.monthly * meta.discount * meta.months
              );
              return (
                <div
                  key={tier.name}
                  className={`relative rounded-3xl p-8 flex flex-col transition-all hover:-translate-y-1 ${
                    tier.featured
                      ? "bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-lime-400 shadow-2xl shadow-lime-500/10"
                      : "bg-slate-900 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {tier.featured && (
                    <span className="absolute -top-4 right-1/2 translate-x-1/2 bg-lime-400 text-slate-950 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-lg">
                      الأكثر طلبًا
                    </span>
                  )}
                  <h3 className="text-xl font-extrabold text-white">
                    عضوية {tier.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-400">{tier.desc}</p>
                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold text-white tabular-nums">
                      {monthlyPrice.toLocaleString("ar-EG")}
                    </span>
                    <span className="pb-1 text-sm text-slate-400">
                      ر.س / شهريًا
                    </span>
                  </div>
                  {totalSaved > 0 ? (
                    <span className="mt-2 inline-block w-fit bg-emerald-500/15 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                      توفّر {totalSaved.toLocaleString("ar-EG")} ر.س على{" "}
                      {billing === "سنوي" ? "السنة" : "الفترة"}
                    </span>
                  ) : (
                    <span className="mt-2 text-xs text-slate-500">
                      فوترة شهرية مرنة دون التزام
                    </span>
                  )}
                  <ul className="mt-7 space-y-3 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="w-4 h-4 mt-0.5 shrink-0 text-lime-400"
                        >
                          <path
                            d="m5 13 4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`mt-8 w-full py-3 rounded-full font-extrabold transition-colors ${
                      tier.featured
                        ? "bg-lime-400 text-slate-950 hover:bg-lime-300"
                        : "bg-slate-800 text-white border border-slate-700 hover:border-lime-400/50 hover:text-lime-400"
                    }`}
                  >
                    اشترك الآن
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── ترويج التطبيق ───────── */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-lime-400/10 text-lime-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-lime-400/20">
                📲 تطبيق لياقة
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                ناديك في جيبك،
                <span className="text-lime-400"> أينما كنت</span>
              </h2>
              <p className="mt-5 text-slate-400 text-lg leading-relaxed">
                احجز حصصك، وتابع تمارينك وسعراتك ونومك، وتنافس مع أصدقائك في
                تحديات أسبوعية — كل ذلك من تطبيق واحد متزامن مع ساعتك الذكية.
              </p>
              <ul className="mt-7 space-y-4">
                {[
                  "خطط تمارين مسجّلة بالفيديو لكل مستوى",
                  "حجز الحصص والمدربين بضغطة واحدة",
                  "تتبع التقدم برسوم بيانية أسبوعية وشهرية",
                  "تحديات ومكافآت تحفّزك على الاستمرار",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-lime-400/15 border border-lime-400/30 flex items-center justify-center text-lime-400 text-sm font-bold">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl px-5 py-3 transition-colors"
                >
                  <span className="text-2xl">🍏</span>
                  <span className="text-right">
                    <span className="block text-[11px] text-slate-400">حمّله من</span>
                    <span className="block text-white font-bold text-sm">App Store</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl px-5 py-3 transition-colors"
                >
                  <span className="text-2xl">▶️</span>
                  <span className="text-right">
                    <span className="block text-[11px] text-slate-400">حمّله من</span>
                    <span className="block text-white font-bold text-sm">Google Play</span>
                  </span>
                </button>
              </div>
            </div>

            {/* هاتف من CSS */}
            <div className="flex justify-center">
              <div className="relative w-72 rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 bg-lime-400/15 rounded-[3rem] blur-3xl" />
                <div className="relative bg-slate-800 border-4 border-slate-700 rounded-[3rem] p-2.5 shadow-2xl">
                  <div className="bg-slate-950 rounded-[2.4rem] overflow-hidden pb-6">
                    <div className="h-7 flex items-center justify-center">
                      <div className="w-20 h-4 bg-slate-800 rounded-b-xl" />
                    </div>
                    <div className="px-4 pt-2">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-[11px] text-slate-500">مساء الخير 👋</div>
                          <div className="text-white font-bold text-sm">يا بطل</div>
                        </div>
                        <span className="w-9 h-9 rounded-full bg-lime-400/15 border border-lime-400/30 flex items-center justify-center">
                          ⚡
                        </span>
                      </div>
                      <div className="relative mx-auto w-36 h-36 mb-4">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              "conic-gradient(#a3e635 0% 72%, #1e293b 72% 100%)",
                          }}
                        />
                        <div className="absolute inset-3 rounded-full bg-slate-950 flex flex-col items-center justify-center">
                          <span className="text-lime-400 text-2xl font-extrabold">٧٢٪</span>
                          <span className="text-slate-500 text-[10px]">هدف الأسبوع</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "سعرة", value: "٦٤٠", emoji: "🔥" },
                          { label: "دقيقة", value: "٧٢", emoji: "⏱️" },
                          { label: "خطوة", value: "٨٬٤٥٠", emoji: "👟" },
                          { label: "نقطة", value: "٣٢٠", emoji: "🏆" },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center"
                          >
                            <div className="text-base">{stat.emoji}</div>
                            <div className="text-lime-400 font-extrabold text-sm">
                              {stat.value}
                            </div>
                            <div className="text-slate-500 text-[10px]">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── حجز التجربة المجانية ───────── */}
      <section id="booking" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              احجز أسبوعك المجاني
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              ٧ أيام كاملة من الوصول لجميع المرافق والحصص — دون أي التزام.
            </p>
          </div>

          <div className="mt-10 bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10">
            {booked ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-lime-400/15 border-2 border-lime-400 flex items-center justify-center text-4xl mb-5">
                  🎉
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  تم استلام طلبك بنجاح!
                </h3>
                <p className="mt-3 text-slate-400 leading-relaxed max-w-md mx-auto">
                  شكرًا لك يا {form.name.trim()}! سيتواصل معك فريق{" "}
                  {form.branch} خلال ٢٤ ساعة لتأكيد موعد زيارتك الأولى وجدولة
                  تقييم اللياقة المجاني.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBooked(false);
                    setForm({ name: "", phone: "", branch: "", goal: "" });
                    setFormErrors({});
                  }}
                  className="mt-7 text-lime-400 font-bold hover:text-lime-300 transition-colors"
                >
                  حجز موعد آخر ←
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} noValidate className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="مثال: سعود الفهد"
                    className={inputClasses("name")}
                  />
                  {formErrors.name && (
                    <p className="mt-2 text-sm text-rose-400">⚠️ {formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    className={`${inputClasses("phone")} text-left`}
                  />
                  {formErrors.phone && (
                    <p className="mt-2 text-sm text-rose-400">⚠️ {formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    الفرع المفضل
                  </label>
                  <select
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className={inputClasses("branch")}
                  >
                    <option value="">اختر الفرع…</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {formErrors.branch && (
                    <p className="mt-2 text-sm text-rose-400">⚠️ {formErrors.branch}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    هدفك الرياضي
                  </label>
                  <select
                    value={form.goal}
                    onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className={inputClasses("goal")}
                  >
                    <option value="">اختر هدفك…</option>
                    {goals.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {formErrors.goal && (
                    <p className="mt-2 text-sm text-rose-400">⚠️ {formErrors.goal}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-l from-lime-400 to-emerald-400 text-slate-950 font-extrabold text-lg py-4 rounded-2xl shadow-lg shadow-lime-500/25 hover:shadow-lime-400/40 transition-all hover:-translate-y-0.5"
                  >
                    احجز تجربتك المجانية الآن
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    بإرسال النموذج فإنك توافق على تواصل فريقنا معك هاتفيًا لتأكيد الحجز.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ───────── التذييل ───────── */}
      <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-xl">
                  ⚡
                </span>
                <span className="text-2xl font-extrabold text-white">لياقة</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                سلسلة أندية لياقة سعودية تجمع بين أحدث التجهيزات والتدريب
                الاحترافي والتقنية الذكية، لنجعل الرياضة أسلوب حياة.
              </p>
              <div className="mt-5 flex gap-3">
                {["𝕏", "in", "▶", "📷"].map((icon) => (
                  <span
                    key={icon}
                    className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 hover:border-lime-400/50 hover:text-lime-400 flex items-center justify-center text-sm cursor-pointer transition-colors"
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="hover:text-lime-400 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#booking" className="hover:text-lime-400 transition-colors">
                    التجربة المجانية
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">فروعنا</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {branches.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span>📍</span> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">ساعات العمل</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li className="flex justify-between gap-4">
                  <span>السبت — الخميس</span>
                  <span className="text-lime-400 font-semibold">٢٤ ساعة</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>الجمعة</span>
                  <span className="text-lime-400 font-semibold">٢ م — ١٢ م</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>قسم السيدات</span>
                  <span className="text-lime-400 font-semibold">٦ ص — ١١ م</span>
                </li>
                <li className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800">
                  <span>📞</span>
                  <span dir="ltr">920 00 1234</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <span>© ٢٠٢٦ أندية لياقة — جميع الحقوق محفوظة.</span>
            <div className="flex gap-6">
              <a href="#top" className="hover:text-lime-400 transition-colors">
                سياسة الخصوصية
              </a>
              <a href="#top" className="hover:text-lime-400 transition-colors">
                شروط العضوية
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ───────── شارة العودة ───────── */}
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-50 bg-lime-400 hover:bg-lime-300 text-slate-950 text-sm font-extrabold px-4 py-2.5 rounded-full shadow-xl shadow-lime-500/25 transition-all hover:-translate-y-0.5"
      >
        جميع الصفحات
      </Link>
    </div>
  );
}
