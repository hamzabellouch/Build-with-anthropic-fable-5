"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ---------- Helpers ---------- */

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function ChevronStart({ className = "w-5 h-5" }: { className?: string }) {
  // points to the right (towards the start in RTL)
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronEnd({ className = "w-5 h-5" }: { className?: string }) {
  // points to the left (towards the end in RTL)
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight" aria-label={`التقييم ${rating} من 5`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-slate-300">{"★".repeat(5 - Math.round(rating))}</span>
      <span className="text-slate-500 mr-1 text-xs">({rating})</span>
    </span>
  );
}

function Counter({ target, duration = 1600 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.max(1, Math.round(duration / 30));
    const interval = setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress >= 1) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [target, duration]);
  return <span>{formatNumber(value)}</span>;
}

/* ---------- Data ---------- */

type Category = "الكل" | "وجهات عربية" | "أوروبا" | "آسيا" | "شواطئ";

interface Destination {
  name: string;
  country: string;
  category: Exclude<Category, "الكل">;
  price: number;
  duration: string;
  rating: number;
  gradient: string;
  emoji: string;
  tagline: string;
}

const destinations: Destination[] = [
  { name: "مراكش", country: "المغرب", category: "وجهات عربية", price: 2450, duration: "5 أيام", rating: 4.8, gradient: "from-rose-400 via-orange-300 to-amber-200", emoji: "🕌", tagline: "سحر المدينة الحمراء وأسواقها العتيقة" },
  { name: "القاهرة والأقصر", country: "مصر", category: "وجهات عربية", price: 2900, duration: "7 أيام", rating: 4.7, gradient: "from-amber-400 via-yellow-300 to-sky-300", emoji: "🛕", tagline: "رحلة عبر سبعة آلاف عام من الحضارة" },
  { name: "صلالة", country: "سلطنة عمان", category: "وجهات عربية", price: 1850, duration: "4 أيام", rating: 4.9, gradient: "from-emerald-400 via-teal-300 to-sky-200", emoji: "🌴", tagline: "خريف صلالة وضبابها الساحر" },
  { name: "باريس", country: "فرنسا", category: "أوروبا", price: 5200, duration: "6 أيام", rating: 4.6, gradient: "from-indigo-400 via-violet-300 to-rose-200", emoji: "🗼", tagline: "مدينة النور والفن والمقاهي العريقة" },
  { name: "روما والبندقية", country: "إيطاليا", category: "أوروبا", price: 5600, duration: "8 أيام", rating: 4.8, gradient: "from-orange-400 via-amber-300 to-teal-200", emoji: "🛶", tagline: "تاريخ يتنفس في كل زاوية وقناة" },
  { name: "إنترلاكن", country: "سويسرا", category: "أوروبا", price: 6900, duration: "7 أيام", rating: 4.9, gradient: "from-sky-400 via-cyan-300 to-emerald-200", emoji: "🏔️", tagline: "قمم الألب وبحيرات الفيروز" },
  { name: "طوكيو وكيوتو", country: "اليابان", category: "آسيا", price: 7400, duration: "9 أيام", rating: 4.9, gradient: "from-pink-400 via-rose-300 to-violet-200", emoji: "⛩️", tagline: "حيث يلتقي المستقبل بعبق التقاليد" },
  { name: "بالي", country: "إندونيسيا", category: "شواطئ", price: 4300, duration: "7 أيام", rating: 4.7, gradient: "from-teal-400 via-emerald-300 to-lime-200", emoji: "🏝️", tagline: "جزيرة الآلهة ومدرجات الأرز الخضراء" },
  { name: "المالديف", country: "المالديف", category: "شواطئ", price: 8200, duration: "5 أيام", rating: 5.0, gradient: "from-cyan-400 via-sky-300 to-blue-200", emoji: "🐠", tagline: "أكواخ فوق الماء ومياه بلورية" },
  { name: "لنكاوي", country: "ماليزيا", category: "آسيا", price: 3600, duration: "6 أيام", rating: 4.5, gradient: "from-green-400 via-teal-300 to-cyan-200", emoji: "🦅", tagline: "جزيرة النسور وغاباتها الاستوائية" },
  { name: "بيروت وجبيل", country: "لبنان", category: "وجهات عربية", price: 2100, duration: "4 أيام", rating: 4.4, gradient: "from-red-400 via-rose-300 to-sky-200", emoji: "⛵", tagline: "جبال وبحر ومطبخ لا يقاوم" },
  { name: "بوكيت", country: "تايلاند", category: "شواطئ", price: 3900, duration: "7 أيام", rating: 4.6, gradient: "from-blue-400 via-cyan-300 to-amber-100", emoji: "🛥️", tagline: "خلجان زمردية وجزر منحوتة من الأحلام" },
];

const filterChips: Category[] = ["الكل", "وجهات عربية", "أوروبا", "آسيا", "شواطئ"];

interface TravelPackage {
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  price: number;
  duration: string;
  features: string[];
}

const packages: TravelPackage[] = [
  {
    title: "باقة العمرة الميسّرة",
    subtitle: "روحانية متكاملة بإشراف مرشدين متخصصين",
    emoji: "🕋",
    gradient: "from-teal-700 via-teal-500 to-amber-300",
    price: 3200,
    duration: "10 أيام",
    features: ["فنادق قريبة من الحرمين", "نقل فاخر بين مكة والمدينة", "مرشد ديني مرافق", "وجبات يومية متنوعة"],
  },
  {
    title: "باقة شهر العسل",
    subtitle: "بداية حياة لا تُنسى في أجمل بقاع الأرض",
    emoji: "💞",
    gradient: "from-rose-500 via-pink-400 to-amber-200",
    price: 9800,
    duration: "8 أيام",
    features: ["أجنحة رومانسية مطلة على البحر", "عشاء خاص على الشاطئ", "جلسة تصوير احترافية", "رحلة بحرية عند الغروب"],
  },
  {
    title: "الباقة العائلية الشاملة",
    subtitle: "متعة وأمان لكل أفراد الأسرة",
    emoji: "👨‍👩‍👧‍👦",
    gradient: "from-sky-600 via-cyan-400 to-emerald-200",
    price: 6500,
    duration: "7 أيام",
    features: ["غرف عائلية متصلة", "أنشطة مخصصة للأطفال", "تذاكر المدن الترفيهية", "سيارة عائلية مع سائق"],
  },
  {
    title: "باقة المغامرات",
    subtitle: "لعشاق الأدرينالين والطبيعة البكر",
    emoji: "🧗",
    gradient: "from-emerald-600 via-teal-400 to-amber-200",
    price: 5400,
    duration: "6 أيام",
    features: ["هايكنج بصحبة أدلّاء محترفين", "تخييم صحراوي فاخر", "غوص ورياضات مائية", "تأمين شامل للمغامرات"],
  },
  {
    title: "باقة رجال الأعمال",
    subtitle: "سفر مريح يواكب إيقاع أعمالك",
    emoji: "💼",
    gradient: "from-slate-700 via-sky-600 to-teal-300",
    price: 7900,
    duration: "5 أيام",
    features: ["درجة أعمال على خطوط عالمية", "استقبال خاص في المطارات", "قاعات اجتماعات عند الطلب", "خدمة كونسيرج على مدار الساعة"],
  },
];

const faqs = [
  {
    q: "هل تساعدونني في استخراج التأشيرة؟",
    a: "نعم، نتولى عنك كامل إجراءات التأشيرة لمعظم الوجهات: تجهيز المستندات، حجز المواعيد، وتعبئة الطلبات، مع متابعة مستمرة حتى صدورها. كما نقدم استشارة مجانية حول متطلبات كل دولة قبل الحجز.",
  },
  {
    q: "كيف أحجز رحلتي معكم؟",
    a: "يمكنك الحجز عبر نموذج البحث في الموقع، أو بالتواصل معنا هاتفيًا أو عبر الواتساب. بعد اختيار الباقة ندفع عربونًا بسيطًا لتثبيت الحجز، ويُسدد المبلغ المتبقي قبل موعد السفر بأسبوعين.",
  },
  {
    q: "ما هي سياسة الإلغاء والاسترداد؟",
    a: "نوفر إلغاءً مجانيًا كاملًا حتى 14 يومًا قبل موعد الرحلة. وفي حال الإلغاء خلال فترة أقصر، يُسترد المبلغ بعد خصم الرسوم الفعلية غير القابلة للاسترداد من الفنادق وشركات الطيران فقط، دون أي رسوم إدارية من طرفنا.",
  },
  {
    q: "هل تشمل الباقات تذاكر الطيران والإقامة؟",
    a: "جميع باقاتنا شاملة لتذاكر الطيران ذهابًا وإيابًا، والإقامة الفندقية مع الإفطار، والتنقلات الداخلية، والجولات السياحية المذكورة في البرنامج. كما يمكنك تخصيص أي باقة بإضافة أو حذف خدمات حسب رغبتك.",
  },
  {
    q: "هل يمكن تعديل تواريخ الرحلة بعد الحجز؟",
    a: "بالتأكيد، يمكنك تعديل التواريخ مرة واحدة مجانًا قبل 10 أيام من موعد السفر، حسب توفر المقاعد والغرف. فريق خدمة العملاء لدينا متاح يوميًا لمساعدتك في إعادة الجدولة بأسرع وقت.",
  },
  {
    q: "هل توفرون مرشدين يتحدثون العربية في الخارج؟",
    a: "نعم، نتعاون مع شبكة من المرشدين الناطقين بالعربية في أكثر من 40 وجهة حول العالم، لتستمتع برحلتك وتفهم تفاصيل كل معلم دون حاجز لغة.",
  },
];

const features = [
  { emoji: "🛡️", title: "أمان وموثوقية", text: "تراخيص رسمية وشراكات مع كبرى شركات الطيران والفنادق العالمية." },
  { emoji: "🎯", title: "برامج مصممة لك", text: "نفصّل كل رحلة على مقاس اهتماماتك وميزانيتك، لا برامج جاهزة مكررة." },
  { emoji: "📞", title: "دعم على مدار الساعة", text: "فريقنا معك قبل السفر وأثناءه وبعده، بالعربية وفي أي توقيت." },
  { emoji: "💰", title: "أسعار شفافة", text: "لا رسوم خفية ولا مفاجآت؛ السعر الذي تراه هو ما تدفعه بالضبط." },
];

const testimonials = [
  { name: "أحمد العتيبي", trip: "رحلة عائلية إلى تركيا", text: "نظّموا لنا رحلة متكاملة دون أي تعب؛ من المطار إلى الفندق إلى الجولات اليومية، كل شيء كان مرتبًا بدقة. أطفالي ما زالوا يتحدثون عن الرحلة حتى اليوم.", emoji: "👨🏻" },
  { name: "نورة الشمري", trip: "شهر عسل في المالديف", text: "تجربة فاقت كل توقعاتنا! الكوخ المائي، العشاء على الشاطئ، وحتى المفاجآت الصغيرة التي رتبها الفريق. شكرًا رحّال على بداية لا تُنسى.", emoji: "👩🏻" },
  { name: "خالد المنصور", trip: "عمرة مع الوالدين", text: "كان همّي الأكبر راحة والديّ كبار السن، وكان فريق رحّال عند حسن الظن؛ كراسي متحركة، فنادق ملاصقة للحرم، ومرافقة في كل خطوة.", emoji: "🧔🏻" },
];

const stats = [
  { target: 48500, label: "مسافر سعيد", emoji: "😄", suffix: "+" },
  { target: 120, label: "وجهة حول العالم", emoji: "🗺️", suffix: "+" },
  { target: 15, label: "سنة خبرة", emoji: "🏆", suffix: "" },
  { target: 27, label: "جائزة سياحية", emoji: "🥇", suffix: "" },
];

const navLinks = [
  { href: "#destinations", label: "الوجهات" },
  { href: "#packages", label: "الباقات" },
  { href: "#why-us", label: "لماذا رحّال" },
  { href: "#testimonials", label: "آراء عملائنا" },
  { href: "#faq", label: "الأسئلة الشائعة" },
];

/* ---------- Search form types ---------- */

interface SearchForm {
  destination: string;
  date: string;
  travelers: string;
  tripType: string;
}

type SearchErrors = Partial<Record<keyof SearchForm, string>>;

/* ---------- Page ---------- */

export default function RahhalPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Category>("الكل");
  const [packageIndex, setPackageIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [search, setSearch] = useState<SearchForm>({ destination: "", date: "", travelers: "2", tripType: "" });
  const [searchErrors, setSearchErrors] = useState<SearchErrors>({});
  const [searchResult, setSearchResult] = useState<SearchForm | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterDone, setNewsletterDone] = useState(false);

  const visibleDestinations =
    activeFilter === "الكل" ? destinations : destinations.filter((d) => d.category === activeFilter);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: SearchErrors = {};
    if (!search.destination) errors.destination = "يرجى اختيار الوجهة";
    if (!search.date) {
      errors.date = "يرجى تحديد تاريخ السفر";
    } else if (new Date(search.date).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      errors.date = "تاريخ السفر يجب أن يكون في المستقبل";
    }
    const travelersNum = Number(search.travelers);
    if (!search.travelers || Number.isNaN(travelersNum) || travelersNum < 1 || travelersNum > 30) {
      errors.travelers = "عدد المسافرين يجب أن يكون بين 1 و30";
    }
    if (!search.tripType) errors.tripType = "يرجى اختيار نوع الرحلة";
    setSearchErrors(errors);
    if (Object.keys(errors).length === 0) {
      setSearchResult({ ...search });
    } else {
      setSearchResult(null);
    }
  }

  function handleNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!newsletterEmail.trim()) {
      setNewsletterError("يرجى إدخال بريدك الإلكتروني");
      setNewsletterDone(false);
      return;
    }
    if (!emailRegex.test(newsletterEmail.trim())) {
      setNewsletterError("صيغة البريد الإلكتروني غير صحيحة");
      setNewsletterDone(false);
      return;
    }
    setNewsletterError("");
    setNewsletterDone(true);
  }

  const nextPackage = () => setPackageIndex((i) => (i + 1) % packages.length);
  const prevPackage = () => setPackageIndex((i) => (i - 1 + packages.length) % packages.length);

  return (
    <div className="min-h-screen bg-[#fbf8f1] text-slate-800 font-sans">
      {/* ---------- Navbar ---------- */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-teal-100 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="#top" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white text-lg shadow-md group-hover:scale-110 transition-transform">
              ✈️
            </span>
            <span className="text-2xl font-extrabold bg-gradient-to-l from-teal-600 to-sky-600 bg-clip-text text-transparent">
              رحّال
            </span>
          </a>
          <ul className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-teal-600 transition-colors py-2 border-b-2 border-transparent hover:border-teal-500">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#search"
            className="hidden md:inline-block bg-gradient-to-l from-teal-600 to-sky-600 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            احجز رحلتك
          </a>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-teal-50 transition-colors"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-teal-700">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </nav>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-teal-100 shadow-lg">
            <ul className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#search"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center bg-gradient-to-l from-teal-600 to-sky-600 text-white font-bold px-3 py-2.5 rounded-lg mt-2"
                >
                  احجز رحلتك
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>

      <main id="top">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-700 via-teal-600 to-amber-100">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-300 rounded-full blur-3xl" />
          </div>
          {/* desert dunes */}
          <svg className="absolute bottom-0 inset-x-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,64 C240,120 480,0 720,48 C960,96 1200,24 1440,72 L1440,120 L0,120 Z" fill="#fbf8f1" />
          </svg>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-32 md:pt-24 md:pb-40 text-center">
            <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm mb-6 border border-white/30">
              🧭 وكالة سفر عربية بمعايير عالمية
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-md">
              من رمال الصحراء إلى شواطئ العالم
              <br />
              <span className="text-amber-200">رحلتك تبدأ من هنا</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-teal-50 max-w-2xl mx-auto leading-relaxed">
              نصمم لك تجارب سفر استثنائية إلى أكثر من 120 وجهة عربية وعالمية، بخدمة شخصية ترافقك من لحظة الحلم حتى العودة بذكريات لا تنسى.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#destinations"
                className="bg-amber-400 hover:bg-amber-300 text-teal-900 font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                استكشف الوجهات
              </a>
              <a
                href="#packages"
                className="bg-white/15 hover:bg-white/25 text-white font-bold px-8 py-3.5 rounded-full border border-white/40 backdrop-blur-sm transition-all"
              >
                تصفح الباقات
              </a>
            </div>

            {/* ---------- Search form ---------- */}
            <div id="search" className="mt-12 max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 text-start">
              <h2 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                <span>🔍</span> ابحث عن رحلتك المثالية
              </h2>
              <form onSubmit={handleSearchSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="search-destination" className="block text-sm font-semibold text-slate-600 mb-1.5">
                    الوجهة
                  </label>
                  <select
                    id="search-destination"
                    value={search.destination}
                    onChange={(e) => setSearch({ ...search, destination: e.target.value })}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition ${searchErrors.destination ? "border-red-400" : "border-slate-200"}`}
                  >
                    <option value="">اختر الوجهة...</option>
                    {destinations.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} — {d.country}
                      </option>
                    ))}
                  </select>
                  {searchErrors.destination && <p className="text-red-500 text-xs mt-1.5 font-semibold">{searchErrors.destination}</p>}
                </div>
                <div>
                  <label htmlFor="search-date" className="block text-sm font-semibold text-slate-600 mb-1.5">
                    تاريخ السفر
                  </label>
                  <input
                    id="search-date"
                    type="date"
                    value={search.date}
                    onChange={(e) => setSearch({ ...search, date: e.target.value })}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition ${searchErrors.date ? "border-red-400" : "border-slate-200"}`}
                  />
                  {searchErrors.date && <p className="text-red-500 text-xs mt-1.5 font-semibold">{searchErrors.date}</p>}
                </div>
                <div>
                  <label htmlFor="search-travelers" className="block text-sm font-semibold text-slate-600 mb-1.5">
                    عدد المسافرين
                  </label>
                  <input
                    id="search-travelers"
                    type="number"
                    min={1}
                    max={30}
                    value={search.travelers}
                    onChange={(e) => setSearch({ ...search, travelers: e.target.value })}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition ${searchErrors.travelers ? "border-red-400" : "border-slate-200"}`}
                  />
                  {searchErrors.travelers && <p className="text-red-500 text-xs mt-1.5 font-semibold">{searchErrors.travelers}</p>}
                </div>
                <div>
                  <label htmlFor="search-type" className="block text-sm font-semibold text-slate-600 mb-1.5">
                    نوع الرحلة
                  </label>
                  <select
                    id="search-type"
                    value={search.tripType}
                    onChange={(e) => setSearch({ ...search, tripType: e.target.value })}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition ${searchErrors.tripType ? "border-red-400" : "border-slate-200"}`}
                  >
                    <option value="">اختر النوع...</option>
                    <option value="عائلية">عائلية</option>
                    <option value="شهر عسل">شهر عسل</option>
                    <option value="مغامرات">مغامرات</option>
                    <option value="استرخاء وشواطئ">استرخاء وشواطئ</option>
                    <option value="ثقافية وتاريخية">ثقافية وتاريخية</option>
                  </select>
                  {searchErrors.tripType && <p className="text-red-500 text-xs mt-1.5 font-semibold">{searchErrors.tripType}</p>}
                </div>
                <button
                  type="submit"
                  className="sm:col-span-2 lg:col-span-4 bg-gradient-to-l from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  ابحث الآن
                </button>
              </form>
              {searchResult && (
                <div className="mt-5 bg-teal-50 border border-teal-200 rounded-xl p-5 animate-[fadeIn_0.4s_ease]">
                  <h3 className="font-bold text-teal-800 flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">✓</span>
                    نتائج البحث — وجدنا لك خيارات رائعة!
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    تتوفر <strong>3 باقات مميزة</strong> لرحلة <strong>{searchResult.tripType}</strong> إلى{" "}
                    <strong>{searchResult.destination}</strong> بتاريخ <strong>{searchResult.date}</strong> لعدد{" "}
                    <strong>{searchResult.travelers}</strong> {Number(searchResult.travelers) === 1 ? "مسافر" : "مسافرين"}. سيتواصل معك
                    مستشار السفر خلال 15 دقيقة لعرض التفاصيل والأسعار الحصرية.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------- Stats ---------- */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl shadow-md border border-amber-100 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="text-3xl mb-2">{s.emoji}</div>
                <div className="text-2xl md:text-3xl font-extrabold text-teal-700">
                  <Counter target={s.target} />
                  {s.suffix}
                </div>
                <div className="text-sm text-slate-500 font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Destinations ---------- */}
        <section id="destinations" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <span className="text-teal-600 font-bold text-sm tracking-wide">وجهاتنا المختارة</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mt-2">إلى أين تحلم أن تسافر؟</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              اختر تصنيفك المفضل وتصفح وجهات انتقيناها بعناية لتناسب كل الأذواق والميزانيات.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {filterChips.map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  activeFilter === chip
                    ? "bg-gradient-to-l from-teal-600 to-sky-600 text-white border-transparent shadow-md scale-105"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleDestinations.map((d) => (
              <article
                key={d.name}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className={`relative h-44 bg-gradient-to-br ${d.gradient} flex items-center justify-center`}>
                  <span className="text-6xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300">{d.emoji}</span>
                  <span className="absolute top-3 right-3 bg-white/85 backdrop-blur-sm text-xs font-bold text-slate-700 px-3 py-1 rounded-full">
                    {d.category}
                  </span>
                  <span className="absolute bottom-3 left-3 bg-teal-900/70 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⏱ {d.duration}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800">{d.name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{d.country}</p>
                    </div>
                    <StarRating rating={d.rating} />
                  </div>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{d.tagline}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400">يبدأ من</span>
                      <div className="text-teal-700 font-extrabold text-lg">
                        {formatNumber(d.price)} <span className="text-xs font-semibold">ر.س</span>
                      </div>
                    </div>
                    <a
                      href="#search"
                      className="text-sm font-bold text-sky-600 hover:text-white border border-sky-500 hover:bg-sky-500 px-4 py-2 rounded-full transition-all"
                    >
                      احجز الآن
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visibleDestinations.length === 0 && (
            <p className="text-center text-slate-500 py-10">لا توجد وجهات في هذا التصنيف حاليًا.</p>
          )}
        </section>

        {/* ---------- Packages carousel ---------- */}
        <section id="packages" className="bg-gradient-to-b from-teal-900 to-sky-900 py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-amber-300 font-bold text-sm tracking-wide">باقات مميزة</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">باقات صممناها لتناسب كل حكاية سفر</h2>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(${packageIndex * 100}%)` }}
                >
                  {packages.map((p) => (
                    <div key={p.title} className="w-full shrink-0 px-1">
                      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl md:flex">
                        <div className={`md:w-2/5 h-56 md:h-auto bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                          <span className="text-8xl drop-shadow-xl">{p.emoji}</span>
                        </div>
                        <div className="md:w-3/5 p-8">
                          <h3 className="text-2xl font-extrabold text-slate-800">{p.title}</h3>
                          <p className="text-slate-500 mt-1">{p.subtitle}</p>
                          <ul className="mt-5 space-y-2.5">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs shrink-0">
                                  ✓
                                </span>
                                {f}
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100">
                            <div>
                              <span className="text-xs text-slate-400">للشخص الواحد · {p.duration}</span>
                              <div className="text-2xl font-extrabold text-teal-700">
                                {formatNumber(p.price)} <span className="text-sm font-semibold">ر.س</span>
                              </div>
                            </div>
                            <a
                              href="#search"
                              className="bg-gradient-to-l from-teal-600 to-sky-600 text-white font-bold px-6 py-3 rounded-full shadow hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                              اطلب الباقة
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={prevPackage}
                aria-label="الباقة السابقة"
                className="absolute top-1/2 -translate-y-1/2 right-2 md:-right-6 bg-white/90 hover:bg-amber-300 text-teal-800 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-colors"
              >
                <ChevronStart />
              </button>
              <button
                onClick={nextPackage}
                aria-label="الباقة التالية"
                className="absolute top-1/2 -translate-y-1/2 left-2 md:-left-6 bg-white/90 hover:bg-amber-300 text-teal-800 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-colors"
              >
                <ChevronEnd />
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {packages.map((p, i) => (
                <button
                  key={p.title}
                  onClick={() => setPackageIndex(i)}
                  aria-label={`الانتقال إلى ${p.title}`}
                  className={`h-2.5 rounded-full transition-all ${i === packageIndex ? "w-8 bg-amber-300" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Why us ---------- */}
        <section id="why-us" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <span className="text-teal-600 font-bold text-sm tracking-wide">لماذا رحّال؟</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mt-2">لأن سفرك يستحق أكثر من مجرد حجز</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-200 hover:-translate-y-1 transition-all text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-100 to-sky-100 flex items-center justify-center text-3xl mb-4">
                  {f.emoji}
                </div>
                <h3 className="font-extrabold text-lg text-slate-800">{f.title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Testimonials ---------- */}
        <section id="testimonials" className="bg-gradient-to-b from-amber-50 to-[#fbf8f1] py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-teal-600 font-bold text-sm tracking-wide">قالوا عنا</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mt-2">ذكريات صنعناها مع مسافرينا</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <figure
                  key={t.name}
                  className="bg-white rounded-2xl p-7 shadow-sm border border-amber-100 hover:shadow-lg transition-shadow relative"
                >
                  <span className="absolute -top-4 right-6 text-5xl text-teal-200 select-none" aria-hidden="true">
                    ❝
                  </span>
                  <blockquote className="text-slate-600 text-sm leading-relaxed pt-3">{t.text}</blockquote>
                  <figcaption className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
                    <span className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-xl">
                      {t.emoji}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                      <div className="text-xs text-teal-600 font-semibold">{t.trip}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <span className="text-teal-600 font-bold text-sm tracking-wide">الأسئلة الشائعة</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mt-2">كل ما تريد معرفته قبل السفر</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between gap-4 p-5 text-start hover:bg-teal-50/50 transition-colors"
                >
                  <span className="font-bold text-slate-800">{faq.q}</span>
                  <span
                    className={`w-8 h-8 shrink-0 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-bold transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${openFaq === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Newsletter ---------- */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <div className="bg-gradient-to-l from-teal-700 via-sky-700 to-teal-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-300/20 rounded-full blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-300/20 rounded-full blur-2xl" aria-hidden="true" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-white relative">📬 عروض حصرية في بريدك</h2>
            <p className="text-teal-100 mt-3 max-w-lg mx-auto relative">
              اشترك في نشرتنا البريدية واحصل على خصومات تصل إلى 30% وعروض موسمية لا تظهر في أي مكان آخر.
            </p>
            {newsletterDone ? (
              <div className="mt-6 inline-flex items-center gap-2 bg-emerald-400/20 border border-emerald-300/50 text-emerald-100 font-bold px-6 py-3.5 rounded-full relative">
                <span className="w-6 h-6 rounded-full bg-emerald-400 text-teal-900 flex items-center justify-center text-sm">✓</span>
                تم الاشتراك بنجاح! ترقب أولى عروضنا في بريدك قريبًا.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} noValidate className="mt-6 max-w-md mx-auto relative">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    aria-label="البريد الإلكتروني"
                    className="flex-1 rounded-full px-5 py-3.5 text-sm bg-white/95 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-teal-900 font-bold px-7 py-3.5 rounded-full shadow transition-colors"
                  >
                    اشترك الآن
                  </button>
                </div>
                {newsletterError && <p className="text-amber-200 text-sm font-semibold mt-3">{newsletterError}</p>}
              </form>
            )}
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-teal-950 text-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-lg">✈️</span>
              <span className="text-2xl font-extrabold text-white">رحّال</span>
            </div>
            <p className="text-sm text-teal-300/80 leading-relaxed">
              وكالة سفر عربية تصنع تجارب لا تُنسى منذ عام 2011. رخصة سياحة رقم 73-1182، عضو الاتحاد الدولي لوكالات السفر.
            </p>
            <div className="flex gap-3 mt-5">
              {["𝕏", "📷", "▶️", "💬"].map((icon) => (
                <span
                  key={icon}
                  className="w-9 h-9 rounded-full bg-teal-900 hover:bg-teal-700 flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">روابط سريعة</h3>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-teal-300/80 hover:text-amber-300 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">وجهات رائجة</h3>
            <ul className="space-y-2.5 text-sm">
              {["المالديف", "طوكيو وكيوتو", "صلالة", "إنترلاكن", "مراكش"].map((d) => (
                <li key={d}>
                  <a href="#destinations" className="text-teal-300/80 hover:text-amber-300 transition-colors">
                    {d}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">تواصل معنا</h3>
            <ul className="space-y-3 text-sm text-teal-300/80">
              <li className="flex items-center gap-2.5">
                <span>📍</span> طريق الملك فهد، حي العليا، الرياض
              </li>
              <li className="flex items-center gap-2.5">
                <span>📞</span> <span dir="ltr">+966 11 234 5678</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span>✉️</span> <span dir="ltr">hello@rahhal.travel</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span>🕘</span> يوميًا من 9 صباحًا حتى 11 مساءً
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-teal-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-teal-400/70">
            <p>© 2026 رحّال للسفر والسياحة — جميع الحقوق محفوظة</p>
            <div className="flex gap-5">
              <span className="hover:text-amber-300 cursor-pointer transition-colors">الشروط والأحكام</span>
              <span className="hover:text-amber-300 cursor-pointer transition-colors">سياسة الخصوصية</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ---------- Back-to-all badge ---------- */}
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-50 bg-white/95 backdrop-blur border border-teal-200 text-teal-700 text-xs font-bold px-4 py-2.5 rounded-full shadow-lg hover:bg-teal-600 hover:text-white hover:shadow-xl transition-all"
      >
        🗂️ جميع الصفحات
      </Link>
    </div>
  );
}
