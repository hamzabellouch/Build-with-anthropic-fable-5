"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* أدوات مساعدة                                                        */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "،");
}

/* ------------------------------------------------------------------ */
/* البيانات                                                            */
/* ------------------------------------------------------------------ */

type ListingMode = "buy" | "rent";

interface Listing {
  id: number;
  title: string;
  district: string;
  city: string;
  type: string;
  mode: ListingMode;
  price: number;
  rooms: number;
  baths: number;
  area: number;
  gradient: string;
  emoji: string;
  badge?: string;
  description: string;
}

const CITIES = ["كل المدن", "الرياض", "جدة", "الدمام", "الخبر"];
const TYPES = ["الكل", "شقة", "فيلا", "دوبلكس", "أرض"];

const LISTINGS: Listing[] = [
  {
    id: 1,
    title: "فيلا فاخرة بمسبح خاص",
    district: "حي الملقا",
    city: "الرياض",
    type: "فيلا",
    mode: "buy",
    price: 2450000,
    rooms: 6,
    baths: 5,
    area: 420,
    gradient: "from-indigo-800 via-indigo-600 to-amber-400",
    emoji: "🏡",
    badge: "مميز",
    description:
      "فيلا حديثة التصميم في أرقى أحياء شمال الرياض، تتميز بمسبح خاص وحديقة داخلية ومجلس خارجي، مع تشطيبات فاخرة ونظام منزل ذكي متكامل.",
  },
  {
    id: 2,
    title: "شقة عصرية بإطلالة بحرية",
    district: "حي الشاطئ",
    city: "جدة",
    type: "شقة",
    mode: "buy",
    price: 780000,
    rooms: 3,
    baths: 2,
    area: 145,
    gradient: "from-slate-800 via-indigo-700 to-sky-400",
    emoji: "🌊",
    badge: "جديد",
    description:
      "شقة أنيقة بإطلالة مباشرة على كورنيش جدة، قريبة من الواجهة البحرية والمرافق الحيوية، بتصميم مفتوح وإضاءة طبيعية وافرة.",
  },
  {
    id: 3,
    title: "دوبلكس عائلي واسع",
    district: "حي النرجس",
    city: "الرياض",
    type: "دوبلكس",
    mode: "buy",
    price: 1650000,
    rooms: 5,
    baths: 4,
    area: 310,
    gradient: "from-indigo-900 via-violet-700 to-rose-300",
    emoji: "🏠",
    description:
      "دوبلكس بمدخلين منفصلين وملحق علوي، مثالي للعائلات الكبيرة، قريب من المدارس العالمية والحدائق العامة في شمال الرياض.",
  },
  {
    id: 4,
    title: "شقة مفروشة قرب الجامعة",
    district: "حي السليمانية",
    city: "الرياض",
    type: "شقة",
    mode: "rent",
    price: 45000,
    rooms: 2,
    baths: 2,
    area: 110,
    gradient: "from-slate-700 via-slate-500 to-amber-300",
    emoji: "🛋️",
    description:
      "شقة مفروشة بالكامل بأثاث عصري، تشمل خدمات الصيانة والأمن على مدار الساعة، على بعد دقائق من جامعة الملك سعود.",
  },
  {
    id: 5,
    title: "أرض سكنية على شارعين",
    district: "حي الفيصلية",
    city: "الدمام",
    type: "أرض",
    mode: "buy",
    price: 950000,
    rooms: 0,
    baths: 0,
    area: 600,
    gradient: "from-amber-700 via-amber-500 to-yellow-200",
    emoji: "📐",
    badge: "فرصة",
    description:
      "أرض سكنية مستوية على شارعين بعرض 20 متراً، في مخطط معتمد ومكتمل الخدمات، مناسبة لبناء فيلا أو مشروع دوبلكسات.",
  },
  {
    id: 6,
    title: "فيلا مودرن بحي راقٍ",
    district: "حي الزهراء",
    city: "جدة",
    type: "فيلا",
    mode: "rent",
    price: 120000,
    rooms: 5,
    baths: 4,
    area: 380,
    gradient: "from-indigo-950 via-indigo-800 to-emerald-300",
    emoji: "🌴",
    description:
      "فيلا بتصميم عصري وحديقة خارجية مزروعة، مجلس رجال ونساء منفصلان، وموقف يتسع لثلاث سيارات، في موقع هادئ وراقٍ.",
  },
  {
    id: 7,
    title: "شقة تمليك بسعر منافس",
    district: "حي العقربية",
    city: "الخبر",
    type: "شقة",
    mode: "buy",
    price: 620000,
    rooms: 3,
    baths: 2,
    area: 130,
    gradient: "from-violet-900 via-purple-700 to-amber-300",
    emoji: "🏙️",
    badge: "جديد",
    description:
      "شقة تمليك ضمن مشروع سكني متكامل الخدمات، مع نادٍ رياضي ومواقف خاصة، على بعد خمس دقائق من كورنيش الخبر.",
  },
  {
    id: 8,
    title: "دوبلكس بإيجار سنوي مميز",
    district: "حي الشاطئ الغربي",
    city: "الدمام",
    type: "دوبلكس",
    mode: "rent",
    price: 85000,
    rooms: 4,
    baths: 3,
    area: 260,
    gradient: "from-slate-900 via-indigo-700 to-cyan-300",
    emoji: "🔑",
    description:
      "دوبلكس نظيف وجاهز للسكن الفوري، بصالة واسعة ومطبخ راكب، قريب من الواجهة البحرية والمراكز التجارية الكبرى.",
  },
  {
    id: 9,
    title: "فيلا درج صالة مع ملحق",
    district: "حي اليرموك",
    city: "الخبر",
    type: "فيلا",
    mode: "buy",
    price: 1980000,
    rooms: 6,
    baths: 5,
    area: 450,
    gradient: "from-indigo-900 via-blue-700 to-amber-400",
    emoji: "✨",
    badge: "مميز",
    description:
      "فيلا فخمة بدرج داخلي وملحق خارجي مستقل، مدخل سيارة مظلل، وتأسيس كامل للتكييف المركزي، في موقع قريب من الخدمات.",
  },
];

const BANKS = [
  "مصرف الراجحي",
  "البنك الأهلي السعودي",
  "بنك الرياض",
  "بنك الإنماء",
  "البنك السعودي الفرنسي",
  "بنك البلاد",
];

const FEATURES = [
  {
    emoji: "🛡️",
    title: "موثوقية كاملة",
    text: "جميع العقارات موثقة ومرخصة من الهيئة العامة للعقار، مع فحص قانوني شامل لكل صك قبل الإدراج.",
  },
  {
    emoji: "💰",
    title: "تمويل ميسر",
    text: "شراكات مباشرة مع أكبر البنوك السعودية لتوفير حلول تمويل عقاري بأفضل هامش ربح وأسرع موافقة.",
  },
  {
    emoji: "📋",
    title: "إدارة المعاملات",
    text: "فريق متخصص يتولى عنك كامل الإجراءات: الإفراغ، نقل الملكية، والتسجيل في منصات الدولة الرسمية.",
  },
  {
    emoji: "🔍",
    title: "تقييم احترافي",
    text: "تقارير تقييم معتمدة من مقيمين مرخصين تضمن لك شراء العقار بسعره العادل دون مبالغة أو مخاطرة.",
  },
  {
    emoji: "🤝",
    title: "مستشار شخصي",
    text: "مستشار عقاري مخصص يرافقك من أول بحث حتى استلام المفتاح، ويجيب عن استفساراتك على مدار الساعة.",
  },
  {
    emoji: "📱",
    title: "تجربة رقمية",
    text: "جولات افتراضية وحجز معاينات وتوقيع عقود إلكترونياً، لتنجز صفقتك العقارية وأنت في مكانك.",
  },
];

const TESTIMONIALS = [
  {
    name: "عبدالله الحربي",
    role: "اشترى فيلا في الرياض",
    text: "تجربة استثنائية من البداية للنهاية. المستشار العقاري تابع معي كل تفصيلة، وأنهيت التمويل والإفراغ خلال أسبوعين فقط. أنصح كل باحث عن عقار بمنصة دار.",
  },
  {
    name: "نورة القحطاني",
    role: "استأجرت شقة في جدة",
    text: "كنت أبحث عن شقة قريبة من عملي لأشهر دون جدوى، وعبر فلاتر البحث في دار وجدت شقتي المثالية في يوم واحد. العقد وُقّع إلكترونياً بكل سهولة.",
  },
  {
    name: "محمد العتيبي",
    role: "مستثمر عقاري",
    text: "أتعامل مع دار في كل صفقاتي الاستثمارية. تقارير التقييم الدقيقة وحاسبة التمويل وفّرت عليّ وقتاً وجهداً كبيرين، والأسعار المعروضة واقعية وعادلة.",
  },
];

/* ------------------------------------------------------------------ */
/* مكوّنات مساعدة                                                      */
/* ------------------------------------------------------------------ */

function StatCounter({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const steps = 50;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      setValue(Math.round((target * step) / steps));
      if (step >= steps) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [started, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-extrabold text-amber-400 md:text-5xl">
        {formatNumber(value)}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-indigo-200 md:text-base">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* الصفحة الرئيسية                                                     */
/* ------------------------------------------------------------------ */

export default function DarPage() {
  /* القائمة المتنقلة */
  const [menuOpen, setMenuOpen] = useState(false);

  /* البحث والتصفية */
  const [city, setCity] = useState("كل المدن");
  const [type, setType] = useState("الكل");
  const [mode, setMode] = useState<ListingMode>("buy");

  /* المفضلة */
  const [favorites, setFavorites] = useState<number[]>([]);

  /* نافذة التفاصيل */
  const [selected, setSelected] = useState<Listing | null>(null);

  /* حاسبة التمويل */
  const [price, setPrice] = useState(1000000);
  const [downPct, setDownPct] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(4);

  /* نموذج التواصل */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; time?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  /* منع تمرير الخلفية عند فتح النافذة */
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const filtered = useMemo(
    () =>
      LISTINGS.filter(
        (l) =>
          l.mode === mode &&
          (city === "كل المدن" || l.city === city) &&
          (type === "الكل" || l.type === type)
      ),
    [city, type, mode]
  );

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  /* حسابات التمويل */
  const loanAmount = price * (1 - downPct / 100);
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / months
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = monthlyPayment * months;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: { name?: string; phone?: string; time?: string } = {};
    if (name.trim().length < 3) {
      next.name = "يرجى إدخال الاسم الكامل (ثلاثة أحرف على الأقل)";
    }
    if (!/^05\d{8}$/.test(phone.trim())) {
      next.phone = "يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05 ويتكون من 10 أرقام";
    }
    if (!time) {
      next.time = "يرجى اختيار الوقت المفضل للمعاينة";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSubmitted(true);
    }
  };

  const navLinks = [
    { href: "#listings", label: "العقارات" },
    { href: "#calculator", label: "حاسبة التمويل" },
    { href: "#features", label: "لماذا دار" },
    { href: "#testimonials", label: "آراء العملاء" },
    { href: "#contact", label: "تواصل معنا" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* ------------------------------ الشريط العلوي ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-indigo-900/60 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-black text-slate-950 shadow-lg shadow-amber-500/20">
              د
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              دار
              <span className="text-amber-400">.</span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-indigo-200 transition-colors hover:text-amber-400"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-900/60 text-lg">
              ❤️
              <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-slate-950">
                {favorites.length}
              </span>
            </div>
            <a
              href="#contact"
              className="hidden rounded-full bg-gradient-to-l from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 md:block"
            >
              اطلب معاينة
            </a>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="فتح القائمة"
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg bg-indigo-900/60 transition-colors hover:bg-indigo-800 lg:hidden"
            >
              <span
                className={`h-0.5 w-5 bg-amber-400 transition-transform ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span className={`h-0.5 w-5 bg-amber-400 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span
                className={`h-0.5 w-5 bg-amber-400 transition-transform ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-indigo-900/60 bg-slate-950 px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-4 py-3 font-medium text-indigo-200 transition-colors hover:bg-indigo-900/50 hover:text-amber-400"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="top">
        {/* ------------------------------ القسم الترحيبي ------------------------------ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-950 to-slate-950">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-indigo-700/20 blur-3xl" />
            <div className="absolute top-32 right-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-300">
                ⭐ المنصة العقارية الأولى في المملكة
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                بيتك القادم يبدأ من
                <span className="bg-gradient-to-l from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  {" "}
                  دار
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-indigo-200">
                آلاف العقارات الموثقة للبيع والإيجار في أنحاء المملكة، مع حلول
                تمويل عقاري مرنة وفريق خبراء يرافقك خطوة بخطوة حتى تستلم مفتاح
                دارك.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#listings"
                  className="rounded-full bg-gradient-to-l from-amber-400 to-amber-500 px-8 py-3.5 font-bold text-slate-950 shadow-xl shadow-amber-500/25 transition-transform hover:scale-105"
                >
                  تصفح العقارات
                </a>
                <a
                  href="#calculator"
                  className="rounded-full border-2 border-indigo-400/40 px-8 py-3.5 font-bold text-indigo-100 transition-colors hover:border-amber-400 hover:text-amber-400"
                >
                  احسب تمويلك
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-indigo-300">
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> عقارات موثقة 100%
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> بدون عمولات خفية
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> دعم على مدار الساعة
                </span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative mx-auto h-96 w-full max-w-md rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-600 to-amber-400 p-1 shadow-2xl shadow-indigo-900/50">
                <div className="flex h-full w-full flex-col justify-end rounded-[22px] bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-6">
                  <div className="text-6xl">🏙️</div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">فيلا الملقا الفاخرة</div>
                        <div className="text-sm text-indigo-300">الرياض — حي الملقا</div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-extrabold text-amber-400">
                          2،450،000
                        </div>
                        <div className="text-xs text-indigo-300">ريال سعودي</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 rounded-2xl border border-amber-400/30 bg-slate-900 px-5 py-4 shadow-xl">
                <div className="text-2xl font-extrabold text-amber-400">+12،000</div>
                <div className="text-xs text-indigo-300">عقار مدرج حالياً</div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ البحث والعقارات ------------------------------ */}
        <section id="listings" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              ابحث عن عقارك المثالي
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-indigo-300">
              استخدم أدوات التصفية للوصول إلى العقار المناسب لاحتياجك وميزانيتك في
              ثوانٍ معدودة.
            </p>
          </div>

          {/* شريط التصفية */}
          <div className="mt-10 rounded-3xl border border-indigo-900/60 bg-slate-900/60 p-5 shadow-xl md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* تبديل بيع / إيجار */}
              <div className="flex rounded-full bg-slate-950 p-1">
                {(
                  [
                    { value: "buy", label: "للبيع" },
                    { value: "rent", label: "للإيجار" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={`rounded-full px-6 py-2 text-sm font-bold transition-colors ${
                      mode === opt.value
                        ? "bg-gradient-to-l from-amber-400 to-amber-500 text-slate-950"
                        : "text-indigo-300 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* اختيار المدينة */}
              <div className="flex items-center gap-3">
                <label htmlFor="city" className="text-sm font-semibold text-indigo-300">
                  المدينة
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl border border-indigo-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-amber-400"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* نوع العقار */}
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      type === t
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "bg-slate-950 text-indigo-300 hover:bg-indigo-900/60 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* نتائج البحث */}
          <div className="mt-6 text-sm text-indigo-300">
            عدد النتائج: <span className="font-bold text-amber-400">{filtered.length}</span> عقار
          </div>

          {filtered.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-indigo-800 bg-slate-900/40 p-16 text-center">
              <div className="text-5xl">🔎</div>
              <p className="mt-4 text-lg font-semibold text-indigo-200">
                لا توجد عقارات مطابقة لبحثك حالياً
              </p>
              <p className="mt-2 text-sm text-indigo-400">
                جرّب تغيير المدينة أو نوع العقار للحصول على نتائج أكثر.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((listing) => (
                <article
                  key={listing.id}
                  className="group overflow-hidden rounded-3xl border border-indigo-900/60 bg-slate-900/60 shadow-lg transition-all hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-2xl hover:shadow-indigo-900/40"
                >
                  <div
                    className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${listing.gradient}`}
                  >
                    <span className="text-6xl drop-shadow-lg transition-transform group-hover:scale-110">
                      {listing.emoji}
                    </span>
                    {listing.badge && (
                      <span className="absolute top-4 right-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-amber-400 backdrop-blur">
                        {listing.badge}
                      </span>
                    )}
                    <button
                      onClick={() => toggleFavorite(listing.id)}
                      aria-label="إضافة إلى المفضلة"
                      className={`absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-all hover:scale-110 ${
                        favorites.includes(listing.id)
                          ? "bg-rose-500 text-white"
                          : "bg-slate-950/70 text-indigo-200 hover:text-rose-400"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill={favorites.includes(listing.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {listing.mode === "buy" ? "للبيع" : "للإيجار"}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white">{listing.title}</h3>
                        <p className="mt-1 text-sm text-indigo-300">
                          📍 {listing.city} — {listing.district}
                        </p>
                      </div>
                      <span className="rounded-lg bg-indigo-900/60 px-2.5 py-1 text-xs font-semibold text-indigo-200">
                        {listing.type}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-4 border-y border-indigo-900/60 py-3 text-sm text-indigo-200">
                      {listing.rooms > 0 && <span>🛏️ {listing.rooms} غرف</span>}
                      {listing.baths > 0 && <span>🚿 {listing.baths} حمامات</span>}
                      <span>📏 {listing.area} م²</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-xl font-extrabold text-amber-400">
                          {formatNumber(listing.price)}
                        </span>
                        <span className="mr-1 text-sm text-indigo-300">
                          ريال{listing.mode === "rent" ? " / سنوياً" : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelected(listing)}
                        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-400 hover:text-slate-950"
                      >
                        التفاصيل
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ------------------------------ حاسبة التمويل ------------------------------ */}
        <section
          id="calculator"
          className="scroll-mt-24 border-y border-indigo-900/60 bg-gradient-to-b from-indigo-950/60 to-slate-950 py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white md:text-4xl">
                حاسبة التمويل العقاري
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-indigo-300">
                خطط لميزانيتك بدقة: حرّك المؤشرات لمعرفة قسطك الشهري التقريبي قبل
                أن تتقدم بطلب التمويل.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-5">
              {/* المدخلات */}
              <div className="space-y-8 rounded-3xl border border-indigo-900/60 bg-slate-900/60 p-6 md:p-8 lg:col-span-3">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label htmlFor="price" className="font-semibold text-white">
                      سعر العقار
                    </label>
                    <span className="rounded-lg bg-indigo-900/60 px-3 py-1 font-bold text-amber-400">
                      {formatNumber(price)} ريال
                    </span>
                  </div>
                  <input
                    id="price"
                    type="range"
                    min={200000}
                    max={5000000}
                    step={50000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="mt-1 flex justify-between text-xs text-indigo-400">
                    <span>200 ألف</span>
                    <span>5 ملايين</span>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label htmlFor="down" className="font-semibold text-white">
                      الدفعة الأولى
                    </label>
                    <span className="rounded-lg bg-indigo-900/60 px-3 py-1 font-bold text-amber-400">
                      {downPct}% — {formatNumber((price * downPct) / 100)} ريال
                    </span>
                  </div>
                  <input
                    id="down"
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={downPct}
                    onChange={(e) => setDownPct(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="mt-1 flex justify-between text-xs text-indigo-400">
                    <span>5%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label htmlFor="years" className="font-semibold text-white">
                      مدة التمويل
                    </label>
                    <span className="rounded-lg bg-indigo-900/60 px-3 py-1 font-bold text-amber-400">
                      {years} سنة
                    </span>
                  </div>
                  <input
                    id="years"
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="mt-1 flex justify-between text-xs text-indigo-400">
                    <span>5 سنوات</span>
                    <span>30 سنة</span>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label htmlFor="rate" className="font-semibold text-white">
                      معدل النسبة السنوي
                    </label>
                    <span className="rounded-lg bg-indigo-900/60 px-3 py-1 font-bold text-amber-400">
                      {rate.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    id="rate"
                    type="range"
                    min={1}
                    max={9}
                    step={0.1}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="mt-1 flex justify-between text-xs text-indigo-400">
                    <span>1%</span>
                    <span>9%</span>
                  </div>
                </div>
              </div>

              {/* النتائج */}
              <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-6 shadow-2xl shadow-indigo-900/50 md:p-8 lg:col-span-2">
                <div>
                  <div className="text-sm font-semibold text-indigo-200">
                    القسط الشهري التقريبي
                  </div>
                  <div className="mt-2 text-4xl font-extrabold text-amber-400 md:text-5xl">
                    {formatNumber(monthlyPayment)}
                    <span className="mr-2 text-lg font-bold text-indigo-200">ريال</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4 border-t border-white/10 pt-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-200">مبلغ التمويل</span>
                    <span className="font-bold text-white">
                      {formatNumber(loanAmount)} ريال
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">إجمالي المبلغ المسدد</span>
                    <span className="font-bold text-white">
                      {formatNumber(totalPayment)} ريال
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">إجمالي كلفة التمويل</span>
                    <span className="font-bold text-white">
                      {formatNumber(totalPayment - loanAmount)} ريال
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">عدد الأقساط</span>
                    <span className="font-bold text-white">{months} قسطاً</span>
                  </div>
                </div>

                <a
                  href="#contact"
                  className="mt-8 block rounded-full bg-gradient-to-l from-amber-400 to-amber-500 px-6 py-3.5 text-center font-bold text-slate-950 transition-transform hover:scale-105"
                >
                  قدّم طلب تمويل الآن
                </a>
                <p className="mt-4 text-xs leading-relaxed text-indigo-300">
                  * النتائج تقريبية لأغراض التخطيط فقط، والعرض النهائي يخضع لتقييم
                  الجهة التمويلية وسياساتها الائتمانية.
                </p>
              </div>
            </div>

            {/* شركاء التمويل */}
            <div className="mt-14">
              <p className="text-center text-sm font-semibold tracking-wide text-indigo-400">
                شركاؤنا في التمويل العقاري
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                {BANKS.map((bank) => (
                  <div
                    key={bank}
                    className="rounded-2xl border border-indigo-900/60 bg-slate-900/60 px-6 py-3 text-sm font-bold text-indigo-200 transition-all hover:border-amber-400/40 hover:text-amber-400"
                  >
                    🏦 {bank}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ لماذا دار ------------------------------ */}
        <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              لماذا يختارنا عشرات الآلاف؟
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-indigo-300">
              لأننا نؤمن أن شراء العقار قرار عمر، صممنا تجربة تجمع بين الموثوقية
              والسرعة والشفافية الكاملة.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-indigo-900/60 bg-slate-900/60 p-7 transition-all hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-2xl hover:shadow-indigo-900/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-3xl shadow-lg transition-transform group-hover:scale-110">
                  {feature.emoji}
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-indigo-300">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------ الإحصائيات ------------------------------ */}
        <section className="border-y border-indigo-900/60 bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-950 py-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 sm:grid-cols-3 sm:px-6">
            <StatCounter target={12000} suffix="+" label="عقار مدرج وموثق" />
            <StatCounter target={38000} suffix="+" label="عميل سعيد وثق بنا" />
            <StatCounter target={27} suffix="" label="مدينة نخدمها حول المملكة" />
          </div>
        </section>

        {/* ------------------------------ آراء العملاء ------------------------------ */}
        <section
          id="testimonials"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6"
        >
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              قالوا عن دار
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-indigo-300">
              شهادات حقيقية من عملاء وجدوا بيوتهم واستثماراتهم عبر منصتنا.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-3xl border border-indigo-900/60 bg-slate-900/60 p-7 transition-all hover:border-amber-400/40"
              >
                <div className="text-amber-400">★★★★★</div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-indigo-200">
                  «{t.text}»
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-indigo-900/60 pt-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 font-bold text-amber-300">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-xs text-indigo-400">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ------------------------------ نموذج التواصل ------------------------------ */}
        <section
          id="contact"
          className="scroll-mt-24 border-t border-indigo-900/60 bg-gradient-to-b from-slate-950 to-indigo-950/70 py-20"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold text-white md:text-4xl">
                اطلب معاينة مجانية
              </h2>
              <p className="mt-4 max-w-lg leading-relaxed text-indigo-300">
                اترك بياناتك وسيتواصل معك مستشارنا العقاري خلال ساعات العمل لترتيب
                موعد معاينة يناسبك، أو للإجابة عن أي استفسار حول التمويل والإجراءات.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-indigo-200">
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-900/60">📞</span>
                  920000123 — من الأحد إلى الخميس، 9 صباحاً حتى 9 مساءً
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-900/60">✉️</span>
                  care@daar.sa — نرد خلال يوم عمل واحد
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-900/60">📍</span>
                  برج المملكة، طريق الملك فهد، الرياض
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-indigo-900/60 bg-slate-900/70 p-7 shadow-2xl md:p-9">
              {submitted ? (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-4xl">
                    ✅
                  </div>
                  <h3 className="mt-6 text-2xl font-extrabold text-white">
                    تم استلام طلبك بنجاح!
                  </h3>
                  <p className="mt-3 leading-relaxed text-indigo-300">
                    شكراً لك {name.trim()}. سيتواصل معك مستشارنا العقاري على الرقم{" "}
                    <span className="font-bold text-amber-400" dir="ltr">
                      {phone}
                    </span>{" "}
                    في الوقت الذي اخترته لتأكيد موعد المعاينة.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setPhone("");
                      setTime("");
                    }}
                    className="mt-8 rounded-full border border-amber-400/50 px-6 py-2.5 text-sm font-bold text-amber-400 transition-colors hover:bg-amber-400 hover:text-slate-950"
                  >
                    إرسال طلب آخر
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-semibold text-white">
                      الاسم الكامل
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: سارة عبدالعزيز المطيري"
                      className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none transition-colors placeholder:text-indigo-500 focus:border-amber-400 ${
                        errors.name ? "border-rose-500" : "border-indigo-800"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm font-medium text-rose-400">⚠ {errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-white">
                      رقم الجوال
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                      className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-left text-white outline-none transition-colors placeholder:text-indigo-500 focus:border-amber-400 ${
                        errors.phone ? "border-rose-500" : "border-indigo-800"
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm font-medium text-rose-400">⚠ {errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="time" className="mb-2 block text-sm font-semibold text-white">
                      الوقت المفضل للمعاينة
                    </label>
                    <select
                      id="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400 ${
                        errors.time ? "border-rose-500" : "border-indigo-800"
                      }`}
                    >
                      <option value="">اختر الوقت المناسب لك</option>
                      <option value="morning">الفترة الصباحية (9 ص — 12 م)</option>
                      <option value="afternoon">فترة الظهيرة (12 م — 4 م)</option>
                      <option value="evening">الفترة المسائية (4 م — 9 م)</option>
                    </select>
                    {errors.time && (
                      <p className="mt-2 text-sm font-medium text-rose-400">⚠ {errors.time}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-gradient-to-l from-amber-400 to-amber-500 px-6 py-3.5 font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.02]"
                  >
                    أرسل طلب المعاينة
                  </button>
                  <p className="text-center text-xs text-indigo-400">
                    بإرسالك الطلب فأنت توافق على سياسة الخصوصية وشروط الاستخدام.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------ نافذة التفاصيل ------------------------------ */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-indigo-800 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`relative flex h-56 items-center justify-center rounded-t-3xl bg-gradient-to-br ${selected.gradient}`}
            >
              <span className="text-7xl drop-shadow-lg">{selected.emoji}</span>
              <button
                onClick={() => setSelected(null)}
                aria-label="إغلاق"
                className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur transition-colors hover:bg-rose-500"
              >
                ✕
              </button>
              <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {selected.mode === "buy" ? "للبيع" : "للإيجار"} — {selected.type}
              </span>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-extrabold text-white">{selected.title}</h3>
                  <p className="mt-1 text-sm text-indigo-300">
                    📍 {selected.city} — {selected.district}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(selected.id)}
                  aria-label="إضافة إلى المفضلة"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all hover:scale-110 ${
                    favorites.includes(selected.id)
                      ? "bg-rose-500 text-white"
                      : "bg-slate-950 text-indigo-300 hover:text-rose-400"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill={favorites.includes(selected.id) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              <p className="mt-5 leading-relaxed text-indigo-200">{selected.description}</p>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-950 p-4">
                  <div className="text-xl font-extrabold text-amber-400">
                    {selected.rooms > 0 ? selected.rooms : "—"}
                  </div>
                  <div className="mt-1 text-xs text-indigo-300">غرف النوم</div>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4">
                  <div className="text-xl font-extrabold text-amber-400">
                    {selected.baths > 0 ? selected.baths : "—"}
                  </div>
                  <div className="mt-1 text-xs text-indigo-300">دورات المياه</div>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4">
                  <div className="text-xl font-extrabold text-amber-400">{selected.area}</div>
                  <div className="mt-1 text-xs text-indigo-300">المساحة م²</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
                <div>
                  <div className="text-xs text-indigo-300">
                    {selected.mode === "buy" ? "سعر البيع" : "الإيجار السنوي"}
                  </div>
                  <div className="text-2xl font-extrabold text-amber-400">
                    {formatNumber(selected.price)} ريال
                  </div>
                </div>
                <a
                  href="#contact"
                  onClick={() => setSelected(null)}
                  className="rounded-full bg-gradient-to-l from-amber-400 to-amber-500 px-6 py-3 font-bold text-slate-950 transition-transform hover:scale-105"
                >
                  تواصل مع المستشار
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------ التذييل ------------------------------ */}
      <footer className="border-t border-indigo-900/60 bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-black text-slate-950">
                د
              </span>
              <span className="text-2xl font-extrabold text-white">
                دار<span className="text-amber-400">.</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-indigo-300">
              منصة عقارية سعودية تجمع البيع والإيجار والتمويل في مكان واحد، بمعايير
              موثوقية وشفافية تجعل قرارك العقاري أسهل وأكثر أماناً.
            </p>
            <div className="mt-5 flex gap-3">
              {["𝕏", "📷", "💼", "▶"].map((icon, i) => (
                <button
                  key={i}
                  aria-label="وسائل التواصل الاجتماعي"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-900/60 text-sm transition-all hover:scale-110 hover:bg-amber-400 hover:text-slate-950"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white">روابط سريعة</h4>
            <ul className="mt-4 space-y-3 text-sm text-indigo-300">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors hover:text-amber-400">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">خدماتنا</h4>
            <ul className="mt-4 space-y-3 text-sm text-indigo-300">
              <li className="transition-colors hover:text-amber-400">بيع وشراء العقارات</li>
              <li className="transition-colors hover:text-amber-400">الإيجار السكني والتجاري</li>
              <li className="transition-colors hover:text-amber-400">التمويل العقاري</li>
              <li className="transition-colors hover:text-amber-400">التقييم المعتمد</li>
              <li className="transition-colors hover:text-amber-400">إدارة الأملاك</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">تواصل معنا</h4>
            <ul className="mt-4 space-y-3 text-sm text-indigo-300">
              <li>📞 920000123</li>
              <li>✉️ care@daar.sa</li>
              <li>📍 برج المملكة، طريق الملك فهد، الرياض</li>
              <li>🕘 الأحد — الخميس: 9 ص حتى 9 م</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-indigo-900/60 py-6">
          <p className="text-center text-xs text-indigo-400">
            © 2026 منصة دار العقارية — جميع الحقوق محفوظة. مرخصة من الهيئة العامة
            للعقار برقم 1100254.
          </p>
        </div>
      </footer>

      {/* ------------------------------ شارة العودة ------------------------------ */}
      <Link
        href="/"
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full border border-amber-400/40 bg-slate-900/95 px-4 py-2.5 text-sm font-bold text-amber-400 shadow-xl backdrop-blur transition-all hover:scale-105 hover:bg-amber-400 hover:text-slate-950"
      >
        <span>🗂️</span> جميع الصفحات
      </Link>
    </div>
  );
}
