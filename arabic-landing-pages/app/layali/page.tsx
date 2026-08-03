"use client";

import Link from "next/link";
import { useState } from "react";

/* ---------- Helpers ---------- */

function formatPrice(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function ChevronStart({ className = "w-5 h-5" }: { className?: string }) {
  // points right — towards the start in RTL
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronEnd({ className = "w-5 h-5" }: { className?: string }) {
  // points left — towards the end in RTL
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 mt-4" aria-hidden="true">
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-amber-400" />
      <span className="text-amber-400 text-lg">✦</span>
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-amber-400" />
    </div>
  );
}

/* ---------- Data ---------- */

type EventKey = "weddings" | "corporate" | "birthdays" | "graduation";

interface EventTab {
  key: EventKey;
  label: string;
  emoji: string;
  headline: string;
  description: string;
  services: string[];
}

const eventTabs: EventTab[] = [
  {
    key: "weddings",
    label: "أعراس",
    emoji: "💍",
    headline: "ليلة العمر كما حلمتِ بها تمامًا",
    description:
      "من كوشة العروس إلى آخر ضوء في القاعة، نرسم كل تفصيلة بعناية فنان وحرص أهل البيت. فريقنا النسائي والرجالي يضمن خصوصية تامة وتنفيذًا يليق بأرقى الأعراس.",
    services: ["تصميم كوشة وممر ملكي", "تنسيق قاعات وإضاءة سينمائية", "ضيافة فاخرة وتشكيلة حلويات", "تصوير احترافي بطاقم نسائي", "فرقة زفة وعروض ترحيبية", "تنظيم جدول الليلة دقيقة بدقيقة"],
  },
  {
    key: "corporate",
    label: "مؤتمرات وشركات",
    emoji: "🏢",
    headline: "فعاليات شركات تعكس هيبة علامتك",
    description:
      "مؤتمرات، حفلات إطلاق، وملتقيات سنوية ننفذها بانضباط سويسري ولمسة عربية مضيافة. نتولى التسجيل، والتجهيزات التقنية، والضيافة، لتتفرغ أنت لضيوفك وشركائك.",
    services: ["تجهيز مسارح وشاشات عرض ضخمة", "إدارة تسجيل الحضور والدعوات", "ترجمة فورية وأنظمة صوتية متقدمة", "أجنحة عرض ومناطق تواصل", "ضيافة كبار الشخصيات", "تقرير وتوثيق كامل بعد الفعالية"],
  },
  {
    key: "birthdays",
    label: "أعياد ميلاد",
    emoji: "🎂",
    headline: "احتفالات ميلاد تُروى حكاياتها لسنوات",
    description:
      "سواء كان عيد ميلاد طفلكم الأول أو احتفالًا مفاجئًا لشخص عزيز، نبتكر ثيمات غير مكررة ونحوّل أي مساحة إلى عالم من البهجة يناسب عمر المحتفى به وشخصيته.",
    services: ["ثيمات مبتكرة حسب شخصية المحتفى به", "ركن حلويات وكيك مصمم خصيصًا", "فقرات ترفيهية وشخصيات كرتونية", "ركن تصوير فوري للضيوف", "توزيعات وهدايا مخصصة", "تنسيق بالونات واستاندات ضخمة"],
  },
  {
    key: "graduation",
    label: "تخرّج",
    emoji: "🎓",
    headline: "لحظة التتويج تستحق احتفالًا يليق بالإنجاز",
    description:
      "سنوات من السهر والاجتهاد تستحق ليلة استثنائية. ننظم حفلات تخرج فردية وجماعية، للمدارس والجامعات والعائلات، بأجواء فخر تجمع الأهل والأصدقاء حول نجم الليلة.",
    services: ["تنسيق مسرح ومنصة تكريم", "شهادات وهدايا تذكارية مخصصة", "عروض ضوئية وعرض مسيرة الخريج", "تصوير وبث مباشر للأهل", "ضيافة وبوفيه احتفالي", "أركان توثيق اللحظات مع الزملاء"],
  },
];

interface ServiceLevel {
  key: string;
  label: string;
  base: number;
  perGuest: number;
  note: string;
}

const serviceLevels: ServiceLevel[] = [
  { key: "essential", label: "أساسي", base: 8000, perGuest: 110, note: "تنسيق أنيق يغطي الأساسيات بإتقان" },
  { key: "luxury", label: "فاخر", base: 20000, perGuest: 210, note: "تجربة متكاملة بتفاصيل مميزة وضيافة راقية" },
  { key: "royal", label: "ملكي", base: 45000, perGuest: 380, note: "إنتاج ضخم وتصميم حصري لا يتكرر" },
];

interface AddOn {
  key: string;
  label: string;
  price: number;
  emoji: string;
}

const addOns: AddOn[] = [
  { key: "cinema", label: "تصوير سينمائي 4K", price: 4500, emoji: "🎥" },
  { key: "band", label: "فرقة موسيقية حية", price: 7000, emoji: "🎻" },
  { key: "hospitality", label: "ركن قهوة وضيافة عربية", price: 2500, emoji: "☕" },
  { key: "fireworks", label: "عرض ألعاب نارية باردة", price: 3800, emoji: "🎆" },
];

interface Tier {
  name: string;
  emoji: string;
  price: number;
  tagline: string;
  popular: boolean;
  features: string[];
}

const tiers: Tier[] = [
  {
    name: "باقة همس",
    emoji: "🌙",
    price: 18000,
    tagline: "لحفل دافئ حتى 150 ضيفًا",
    popular: false,
    features: ["تنسيق قاعة وطاولات كامل", "إضاءة دافئة وممر مزين", "ضيافة ترحيبية وعصائر", "منسق فعاليات طوال الحفل", "تصوير فوتوغرافي 4 ساعات"],
  },
  {
    name: "باقة سهرة",
    emoji: "✨",
    price: 42000,
    tagline: "الأكثر طلبًا — حتى 350 ضيفًا",
    popular: true,
    features: ["تصميم ثيم حصري للمناسبة", "كوشة أو منصة رئيسية فاخرة", "بوفيه عشاء متكامل", "دي جي وتنظيم فقرات", "تصوير فوتو وفيديو كامل", "فريق إشراف من 6 منسقين"],
  },
  {
    name: "باقة ألف ليلة",
    emoji: "👑",
    price: 95000,
    tagline: "إنتاج ملكي يفوق 600 ضيف",
    popular: false,
    features: ["إخراج فني ومدير إنتاج خاص", "ديكورات تُبنى خصيصًا للحفل", "عشاء فاخر بإشراف شيف تنفيذي", "عروض ضوئية وشاشات محيطية", "أجنحة استقبال كبار الضيوف", "توثيق سينمائي بطائرة تصوير", "تجربة بروفة كاملة قبل الموعد"],
  },
];

interface GallerySlide {
  title: string;
  caption: string;
  gradient: string;
  emojis: [string, string, string];
}

const gallerySlides: GallerySlide[] = [
  {
    title: "عرس قصر الندى",
    caption: "ممر ملكي بأربعة آلاف وردة طبيعية وإضاءة قمرية معلقة",
    gradient: "from-purple-900 via-fuchsia-800 to-amber-500",
    emojis: ["💐", "👰", "🕯️"],
  },
  {
    title: "ملتقى الرؤية السنوي",
    caption: "مؤتمر لثمانمئة مشارك بمسرح بانورامي وترجمة فورية بثلاث لغات",
    gradient: "from-indigo-950 via-blue-800 to-cyan-500",
    emojis: ["🎤", "📊", "🤝"],
  },
  {
    title: "ميلاد لينا السابع",
    caption: "ثيم حديقة سحرية بفراشات مضيئة وركن حكايا قبل قص الكيك",
    gradient: "from-violet-800 via-purple-600 to-pink-400",
    emojis: ["🎈", "🦋", "🎂"],
  },
  {
    title: "تخرج دفعة الطموح",
    caption: "منصة تكريم لثلاثمئة خريج مع عرض ضوئي لمسيرة كل متفوق",
    gradient: "from-blue-950 via-indigo-800 to-amber-400",
    emojis: ["🎓", "🏅", "🎇"],
  },
  {
    title: "سهرة العود والياسمين",
    caption: "أمسية طربية خاصة بإضاءة شموع وعزف حي تحت سماء مفتوحة",
    gradient: "from-purple-950 via-violet-800 to-rose-500",
    emojis: ["🎻", "🌹", "🌌"],
  },
];

const timelineSteps = [
  { emoji: "🗒️", title: "استشارة وفهم الحلم", text: "نجلس معك لنسمع تصورك كاملًا: الأجواء، الضيوف، الميزانية، وأدق الأمنيات التي تتمنى رؤيتها." },
  { emoji: "🎨", title: "تصميم التجربة", text: "نحوّل الحلم إلى مخطط بصري متكامل: الثيم، الألوان، توزيع المساحات، وجدول الليلة لحظة بلحظة." },
  { emoji: "🛠️", title: "التحضير والتنفيذ", text: "فريق الإنتاج يبني الديكورات وينسق الموردين ويجري البروفات، مع تقارير دورية تصلك أولًا بأول." },
  { emoji: "🌟", title: "ليلة الحدث", text: "في الموعد، مدير الحفل وفريقه يديرون كل تفصيلة خلف الكواليس، ولا يصلك من الليلة إلا بهجتها." },
];

const layaliTestimonials = [
  { name: "سارة وفهد", event: "حفل زفاف — الرياض", emoji: "💑", text: "كل من حضر عرسنا ما زال يسأل: من نظّم هذه الليلة؟ تفاصيل لم تخطر على بالنا أصلًا وجدناها منفذة بإتقان. شكرًا ليالي من القلب." },
  { name: "م. عبدالله الراشد", event: "مؤتمر شركة أفق", emoji: "👨‍💼", text: "تعاملنا مع شركات كثيرة، لكن انضباط فريق ليالي والتزامهم بالجدول والميزانية كان استثنائيًا. المؤتمر خرج بصورة شرّفتنا أمام شركائنا الدوليين." },
  { name: "أم يزن", event: "عيد ميلاد — جدة", emoji: "👩‍👦", text: "حولوا حوش بيتنا إلى عالم سحري خلال يوم واحد! ابني لم يتوقف عن الابتسام، والصور التي وثقوها أجمل من خيالي." },
];

const venues = ["قصر الفيصلية", "قاعة نارسيس", "منتجع شاطئ اللؤلؤة", "فندق روز الورود", "مركز الواحة للمؤتمرات", "استراحة ليالي الشام"];

const navLinks = [
  { href: "#events", label: "خدماتنا" },
  { href: "#estimator", label: "حاسبة الميزانية" },
  { href: "#packages", label: "الباقات" },
  { href: "#gallery", label: "لحظاتنا" },
  { href: "#process", label: "كيف نعمل" },
  { href: "#booking", label: "احجز استشارة" },
];

/* ---------- Booking form types ---------- */

interface BookingForm {
  name: string;
  phone: string;
  eventDate: string;
  eventType: string;
}

type BookingErrors = Partial<Record<keyof BookingForm, string>>;

/* ---------- Page ---------- */

export default function LayaliPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EventKey>("weddings");
  const [guests, setGuests] = useState(200);
  const [level, setLevel] = useState<ServiceLevel>(serviceLevels[1]);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({});
  const [slide, setSlide] = useState(0);

  const [booking, setBooking] = useState<BookingForm>({ name: "", phone: "", eventDate: "", eventType: "" });
  const [bookingErrors, setBookingErrors] = useState<BookingErrors>({});
  const [bookingDone, setBookingDone] = useState(false);

  const currentTab = eventTabs.find((t) => t.key === activeTab) ?? eventTabs[0];

  const estimateBase = level.base + guests * level.perGuest;
  const estimateLow = estimateBase * 0.9;
  const estimateHigh = estimateBase * 1.18;

  function tierTotal(tierIndex: number): number {
    const extra = addOns.reduce(
      (sum, addon) => (selectedAddOns[`${tierIndex}-${addon.key}`] ? sum + addon.price : sum),
      0
    );
    return tiers[tierIndex].price + extra;
  }

  function toggleAddOn(tierIndex: number, addonKey: string) {
    const key = `${tierIndex}-${addonKey}`;
    setSelectedAddOns((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleBookingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: BookingErrors = {};
    if (!booking.name.trim() || booking.name.trim().length < 3) {
      errors.name = "يرجى إدخال الاسم الكامل (3 أحرف على الأقل)";
    }
    if (!booking.phone.trim()) {
      errors.phone = "يرجى إدخال رقم الجوال";
    } else if (!/^\+?\d{9,15}$/.test(booking.phone.replace(/[\s-]/g, ""))) {
      errors.phone = "رقم الجوال غير صحيح — أدخل أرقامًا فقط (9 إلى 15 رقمًا)";
    }
    if (!booking.eventDate) {
      errors.eventDate = "يرجى تحديد تاريخ المناسبة";
    } else if (new Date(booking.eventDate).getTime() < Date.now()) {
      errors.eventDate = "تاريخ المناسبة يجب أن يكون في المستقبل";
    }
    if (!booking.eventType) {
      errors.eventType = "يرجى اختيار نوع المناسبة";
    }
    setBookingErrors(errors);
    if (Object.keys(errors).length === 0) {
      setBookingDone(true);
    }
  }

  const nextSlide = () => setSlide((s) => (s + 1) % gallerySlides.length);
  const prevSlide = () => setSlide((s) => (s - 1 + gallerySlides.length) % gallerySlides.length);

  return (
    <div className="min-h-screen bg-[#0d0a1d] text-violet-100 font-sans">
      {/* ---------- Navbar ---------- */}
      <header className="sticky top-0 z-50 bg-[#0d0a1d]/85 backdrop-blur-md border-b border-amber-400/20">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="#top" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-[#0d0a1d] text-lg shadow-[0_0_18px_rgba(251,191,36,0.45)] group-hover:scale-110 transition-transform">
              🌙
            </span>
            <span className="text-2xl font-extrabold bg-gradient-to-l from-amber-200 to-amber-500 bg-clip-text text-transparent">
              ليالي
            </span>
          </a>
          <ul className="hidden lg:flex items-center gap-5 text-sm font-semibold text-violet-200">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-amber-300 transition-colors py-2 border-b-2 border-transparent hover:border-amber-400">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#booking"
            className="hidden lg:inline-block bg-gradient-to-l from-amber-400 to-amber-500 text-[#0d0a1d] text-sm font-extrabold px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:shadow-[0_0_28px_rgba(251,191,36,0.55)] hover:-translate-y-0.5 transition-all"
          >
            استشارة مجانية
          </a>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="lg:hidden p-2 rounded-lg hover:bg-violet-900/50 transition-colors"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-amber-300">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </nav>
        {menuOpen && (
          <div className="lg:hidden bg-[#16102e] border-t border-amber-400/20 shadow-2xl">
            <ul className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg font-semibold text-violet-100 hover:bg-violet-900/50 hover:text-amber-300 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <main id="top">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1a1140] via-[#241552] to-[#0d0a1d]">
          {/* stars */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <span className="absolute top-12 right-[12%] text-amber-200/70 text-xs">✦</span>
            <span className="absolute top-28 right-[35%] text-amber-200/40 text-sm">✦</span>
            <span className="absolute top-16 left-[20%] text-amber-200/60 text-xs">✧</span>
            <span className="absolute top-44 left-[8%] text-amber-200/40 text-base">✦</span>
            <span className="absolute top-56 right-[18%] text-amber-200/50 text-xs">✧</span>
            <span className="absolute top-72 left-[40%] text-amber-200/30 text-sm">✦</span>
            <div className="absolute -top-20 left-1/3 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
            <span className="inline-block bg-amber-400/10 text-amber-300 text-sm font-semibold px-4 py-1.5 rounded-full border border-amber-400/30 mb-6">
              ✨ مخططو مناسبات بخبرة تتجاوز 12 عامًا
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              نحوّل مناسباتكم إلى
              <span className="block mt-2 bg-gradient-to-l from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                ليالٍ تسكن الذاكرة
              </span>
            </h1>
            <GoldDivider />
            <p className="mt-6 text-lg md:text-xl text-violet-200/90 max-w-2xl mx-auto leading-relaxed">
              من همسة الفكرة الأولى حتى آخر تصفيق في القاعة، فريق ليالي يصمم وينفذ أعراسًا وفعاليات تليق بأجمل لحظات حياتكم.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#booking"
                className="bg-gradient-to-l from-amber-400 to-amber-500 text-[#0d0a1d] font-extrabold px-8 py-3.5 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:shadow-[0_0_35px_rgba(251,191,36,0.6)] hover:-translate-y-0.5 transition-all"
              >
                احجز استشارتك المجانية
              </a>
              <a
                href="#gallery"
                className="bg-white/5 hover:bg-white/10 text-violet-100 font-bold px-8 py-3.5 rounded-full border border-violet-400/30 transition-all"
              >
                شاهد لحظاتنا
              </a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-violet-300/80">
              <span className="flex items-center gap-2"><span className="text-amber-400">★</span> أكثر من 1,400 مناسبة منفذة</span>
              <span className="flex items-center gap-2"><span className="text-amber-400">★</span> تقييم 4.9 من 5 لدى عملائنا</span>
              <span className="flex items-center gap-2"><span className="text-amber-400">★</span> فرق نسائية ورجالية متخصصة</span>
            </div>
          </div>
        </section>

        {/* ---------- Event-type tabs ---------- */}
        <section id="events" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <span className="text-amber-400 font-bold text-sm tracking-wide">خدماتنا</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">لكل مناسبة عندنا حكاية تُحاك بإتقان</h2>
            <GoldDivider />
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {eventTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all border ${
                  activeTab === tab.key
                    ? "bg-gradient-to-l from-amber-400 to-amber-500 text-[#0d0a1d] border-transparent shadow-[0_0_20px_rgba(251,191,36,0.35)] scale-105"
                    : "bg-white/5 text-violet-200 border-violet-400/25 hover:border-amber-400/60 hover:text-amber-300"
                }`}
              >
                <span className="ml-1.5">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="bg-gradient-to-br from-[#1c1242] to-[#140d30] rounded-3xl border border-violet-500/20 p-8 md:p-10 shadow-2xl">
            <div className="md:flex md:items-start md:gap-10">
              <div className="md:w-1/2">
                <div className="text-5xl mb-4">{currentTab.emoji}</div>
                <h3 className="text-2xl font-extrabold text-amber-300">{currentTab.headline}</h3>
                <p className="text-violet-200/85 mt-4 leading-relaxed">{currentTab.description}</p>
                <a
                  href="#booking"
                  className="inline-block mt-6 text-sm font-bold text-amber-300 border border-amber-400/50 hover:bg-amber-400 hover:text-[#0d0a1d] px-6 py-2.5 rounded-full transition-all"
                >
                  اطلب عرض سعر لهذه المناسبة
                </a>
              </div>
              <ul className="md:w-1/2 mt-8 md:mt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentTab.services.map((service) => (
                  <li
                    key={service}
                    className="flex items-start gap-2.5 bg-white/5 rounded-xl px-4 py-3 text-sm text-violet-100 border border-violet-400/15 hover:border-amber-400/40 transition-colors"
                  >
                    <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- Budget estimator ---------- */}
        <section id="estimator" className="bg-gradient-to-b from-[#0d0a1d] via-[#170f35] to-[#0d0a1d] py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-amber-400 font-bold text-sm tracking-wide">حاسبة الميزانية</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">قدّر تكلفة مناسبتك في ثوانٍ</h2>
              <GoldDivider />
              <p className="text-violet-300/80 mt-4 max-w-xl mx-auto">
                حرّك المؤشر واختر مستوى الخدمة لتحصل على نطاق سعري تقديري فوري — والعرض النهائي نفصّله معك بالتفصيل في الاستشارة المجانية.
              </p>
            </div>
            <div className="bg-[#1a1140] rounded-3xl border border-amber-400/20 p-8 md:p-10 shadow-2xl">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="guests-range" className="font-bold text-violet-100">
                    👥 عدد الضيوف المتوقع
                  </label>
                  <span className="bg-amber-400/15 text-amber-300 font-extrabold px-4 py-1.5 rounded-full text-sm border border-amber-400/30">
                    {guests} ضيف
                  </span>
                </div>
                <input
                  id="guests-range"
                  type="range"
                  min={50}
                  max={1000}
                  step={10}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-violet-400 mt-1.5">
                  <span>50</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
              </div>
              <div className="mb-8">
                <span className="block font-bold text-violet-100 mb-3">🏆 مستوى الخدمة</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {serviceLevels.map((sl) => (
                    <button
                      key={sl.key}
                      onClick={() => setLevel(sl)}
                      aria-pressed={level.key === sl.key}
                      className={`rounded-2xl p-4 text-start border transition-all ${
                        level.key === sl.key
                          ? "bg-gradient-to-br from-amber-400/20 to-amber-500/10 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.25)]"
                          : "bg-white/5 border-violet-400/20 hover:border-amber-400/50"
                      }`}
                    >
                      <div className={`font-extrabold ${level.key === sl.key ? "text-amber-300" : "text-violet-100"}`}>{sl.label}</div>
                      <div className="text-xs text-violet-300/80 mt-1.5 leading-relaxed">{sl.note}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-l from-[#241552] to-[#1a1140] rounded-2xl border border-amber-400/30 p-6 text-center">
                <div className="text-sm text-violet-300 font-semibold">النطاق السعري التقديري لمناسبتك</div>
                <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-gradient-to-l from-amber-200 to-amber-400 bg-clip-text mt-2">
                  {formatPrice(estimateLow)} — {formatPrice(estimateHigh)} ر.س
                </div>
                <p className="text-xs text-violet-400 mt-3">
                  يشمل التقدير التنسيق والضيافة والإشراف لمستوى {level.label} مع {guests} ضيف. الأسعار النهائية تعتمد على القاعة والتفاصيل المختارة.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Packages comparison ---------- */}
        <section id="packages" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <span className="text-amber-400 font-bold text-sm tracking-wide">باقاتنا</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">ثلاث باقات... وكل واحدة ليلة بحالها</h2>
            <GoldDivider />
            <p className="text-violet-300/80 mt-4">أضف ما يحلو لك من الخدمات الإضافية وشاهد الإجمالي يتحدث مباشرة.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {tiers.map((tier, tierIndex) => (
              <div
                key={tier.name}
                className={`relative rounded-3xl p-7 border transition-all hover:-translate-y-1.5 duration-300 ${
                  tier.popular
                    ? "bg-gradient-to-b from-[#2a1a5e] to-[#1a1140] border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.25)]"
                    : "bg-[#16102e] border-violet-500/25 hover:border-amber-400/50"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3.5 right-1/2 translate-x-1/2 bg-gradient-to-l from-amber-400 to-amber-500 text-[#0d0a1d] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    ⭐ الأكثر طلبًا
                  </span>
                )}
                <div className="text-4xl">{tier.emoji}</div>
                <h3 className="text-xl font-extrabold text-white mt-3">{tier.name}</h3>
                <p className="text-sm text-violet-300/80 mt-1">{tier.tagline}</p>
                <div className="mt-5 pb-5 border-b border-violet-400/20">
                  <span className="text-xs text-violet-400">تبدأ من</span>
                  <div className="text-3xl font-extrabold text-amber-300">
                    {formatPrice(tier.price)} <span className="text-sm font-semibold text-violet-300">ر.س</span>
                  </div>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-violet-100/90">
                      <span className="text-amber-400 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-violet-400/20">
                  <span className="block text-xs font-bold text-violet-300 mb-3">إضافات اختيارية:</span>
                  <div className="space-y-2">
                    {addOns.map((addon) => {
                      const checked = Boolean(selectedAddOns[`${tierIndex}-${addon.key}`]);
                      return (
                        <label
                          key={addon.key}
                          className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs cursor-pointer border transition-all ${
                            checked
                              ? "bg-amber-400/15 border-amber-400/60 text-amber-200"
                              : "bg-white/5 border-violet-400/15 text-violet-200 hover:border-amber-400/40"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAddOn(tierIndex, addon.key)}
                              className="accent-amber-400 w-4 h-4"
                            />
                            <span>
                              {addon.emoji} {addon.label}
                            </span>
                          </span>
                          <span className="font-bold whitespace-nowrap">+{formatPrice(addon.price)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-5 bg-[#0d0a1d]/70 rounded-2xl p-4 flex items-center justify-between border border-amber-400/25">
                  <span className="text-sm font-bold text-violet-200">الإجمالي:</span>
                  <span className="text-xl font-extrabold text-amber-300">
                    {formatPrice(tierTotal(tierIndex))} <span className="text-xs text-violet-300">ر.س</span>
                  </span>
                </div>
                <a
                  href="#booking"
                  className={`block text-center mt-5 font-extrabold py-3 rounded-full transition-all ${
                    tier.popular
                      ? "bg-gradient-to-l from-amber-400 to-amber-500 text-[#0d0a1d] hover:shadow-[0_0_25px_rgba(251,191,36,0.45)]"
                      : "border border-amber-400/60 text-amber-300 hover:bg-amber-400 hover:text-[#0d0a1d]"
                  }`}
                >
                  اختر هذه الباقة
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Gallery carousel ---------- */}
        <section id="gallery" className="bg-gradient-to-b from-[#0d0a1d] via-[#1a1140] to-[#0d0a1d] py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-amber-400 font-bold text-sm tracking-wide">من ألبوم ليالي</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">لحظات صنعناها بأيدينا</h2>
              <GoldDivider />
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-amber-400/20 shadow-2xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(${slide * 100}%)` }}
                >
                  {gallerySlides.map((g) => (
                    <div key={g.title} className="w-full shrink-0">
                      <div className={`relative h-80 md:h-96 bg-gradient-to-br ${g.gradient} flex flex-col items-center justify-center overflow-hidden`}>
                        <span className="absolute top-6 right-8 text-amber-100/60 text-xl" aria-hidden="true">✦</span>
                        <span className="absolute top-14 left-10 text-amber-100/40 text-sm" aria-hidden="true">✧</span>
                        <span className="absolute bottom-20 right-14 text-amber-100/40 text-base" aria-hidden="true">✦</span>
                        <div className="flex items-center gap-5 text-6xl md:text-7xl drop-shadow-2xl">
                          <span>{g.emojis[0]}</span>
                          <span className="scale-125">{g.emojis[1]}</span>
                          <span>{g.emojis[2]}</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d0a1d]/95 to-transparent pt-16 pb-6 px-8 text-center">
                          <h3 className="text-xl font-extrabold text-amber-200">{g.title}</h3>
                          <p className="text-sm text-violet-200/90 mt-1.5">{g.caption}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={prevSlide}
                aria-label="اللقطة السابقة"
                className="absolute top-1/2 -translate-y-1/2 right-3 bg-[#0d0a1d]/70 hover:bg-amber-400 text-amber-300 hover:text-[#0d0a1d] w-11 h-11 rounded-full border border-amber-400/40 flex items-center justify-center backdrop-blur transition-colors"
              >
                <ChevronStart />
              </button>
              <button
                onClick={nextSlide}
                aria-label="اللقطة التالية"
                className="absolute top-1/2 -translate-y-1/2 left-3 bg-[#0d0a1d]/70 hover:bg-amber-400 text-amber-300 hover:text-[#0d0a1d] w-11 h-11 rounded-full border border-amber-400/40 flex items-center justify-center backdrop-blur transition-colors"
              >
                <ChevronEnd />
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {gallerySlides.map((g, i) => (
                <button
                  key={g.title}
                  onClick={() => setSlide(i)}
                  aria-label={`عرض ${g.title}`}
                  className={`h-2.5 rounded-full transition-all ${i === slide ? "w-8 bg-amber-400" : "w-2.5 bg-violet-500/40 hover:bg-violet-400/70"}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- How we work timeline ---------- */}
        <section id="process" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <span className="text-amber-400 font-bold text-sm tracking-wide">كيف نعمل</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">أربع خطوات تفصلك عن ليلتك المثالية</h2>
            <GoldDivider />
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
            <div className="hidden md:block absolute top-8 inset-x-12 h-0.5 bg-gradient-to-l from-amber-400/10 via-amber-400/60 to-amber-400/10" aria-hidden="true" />
            {timelineSteps.map((step, i) => (
              <div key={step.title} className="relative text-center group">
                <div className="relative z-10 w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#2a1a5e] to-[#1a1140] border-2 border-amber-400/60 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(251,191,36,0.2)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all">
                  {step.emoji}
                </div>
                <span className="inline-block mt-4 text-xs font-extrabold text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-3 py-1">
                  الخطوة {i + 1}
                </span>
                <h3 className="font-extrabold text-white mt-3">{step.title}</h3>
                <p className="text-sm text-violet-300/80 mt-2 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Testimonials ---------- */}
        <section className="bg-gradient-to-b from-[#0d0a1d] to-[#170f35] py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-amber-400 font-bold text-sm tracking-wide">شهادات عملائنا</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">فرحتهم... أصدق شهادة لنا</h2>
              <GoldDivider />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {layaliTestimonials.map((t) => (
                <figure
                  key={t.name}
                  className="bg-[#1a1140] rounded-3xl p-7 border border-violet-500/25 hover:border-amber-400/50 transition-colors relative"
                >
                  <span className="absolute -top-4 right-6 text-5xl text-amber-400/30 select-none" aria-hidden="true">❝</span>
                  <div className="text-amber-400 text-sm mb-3">★★★★★</div>
                  <blockquote className="text-violet-100/90 text-sm leading-relaxed">{t.text}</blockquote>
                  <figcaption className="flex items-center gap-3 mt-5 pt-4 border-t border-violet-400/15">
                    <span className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-xl">
                      {t.emoji}
                    </span>
                    <div>
                      <div className="font-bold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-amber-300/90 font-semibold">{t.event}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Venues / partners strip ---------- */}
        <section className="border-y border-amber-400/15 bg-[#120c28] py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-sm font-bold text-violet-300 mb-6">شركاؤنا من أرقى القاعات والمنتجعات</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {venues.map((v) => (
                <span
                  key={v}
                  className="text-violet-400/70 hover:text-amber-300 font-extrabold text-sm md:text-base tracking-wide transition-colors cursor-default flex items-center gap-2"
                >
                  <span className="text-amber-400/60">◆</span> {v}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Booking form ---------- */}
        <section id="booking" className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <span className="text-amber-400 font-bold text-sm tracking-wide">احجز استشارتك</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">لنبدأ التخطيط لليلتك الكبيرة</h2>
            <GoldDivider />
            <p className="text-violet-300/80 mt-4">
              املأ النموذج وسيتصل بك أحد مخططي المناسبات لدينا خلال 24 ساعة لجلسة استشارة مجانية دون أي التزام.
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1c1242] to-[#140d30] rounded-3xl border border-amber-400/25 p-8 md:p-10 shadow-2xl">
            {bookingDone ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-4xl text-[#0d0a1d] shadow-[0_0_35px_rgba(251,191,36,0.5)]">
                  ✓
                </div>
                <h3 className="text-2xl font-extrabold text-amber-300 mt-6">تم استلام طلبك بنجاح!</h3>
                <p className="text-violet-200/85 mt-3 max-w-md mx-auto leading-relaxed">
                  شكرًا لك {booking.name.trim()}. سجلنا طلب استشارة لمناسبة {booking.eventType} بتاريخ {booking.eventDate}، وسيتواصل
                  معك مخطط مناسباتك على الرقم <span dir="ltr">{booking.phone}</span> خلال 24 ساعة.
                </p>
                <button
                  onClick={() => {
                    setBookingDone(false);
                    setBooking({ name: "", phone: "", eventDate: "", eventType: "" });
                    setBookingErrors({});
                  }}
                  className="mt-7 text-sm font-bold text-amber-300 border border-amber-400/50 hover:bg-amber-400 hover:text-[#0d0a1d] px-6 py-2.5 rounded-full transition-all"
                >
                  إرسال طلب آخر
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="booking-name" className="block text-sm font-bold text-violet-200 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    id="booking-name"
                    type="text"
                    value={booking.name}
                    onChange={(e) => setBooking({ ...booking, name: e.target.value })}
                    placeholder="مثال: نوف العبدالله"
                    className={`w-full rounded-xl bg-[#0d0a1d]/60 border px-4 py-3 text-sm text-white placeholder:text-violet-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${bookingErrors.name ? "border-rose-500" : "border-violet-400/25"}`}
                  />
                  {bookingErrors.name && <p className="text-rose-400 text-xs mt-1.5 font-semibold">{bookingErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="booking-phone" className="block text-sm font-bold text-violet-200 mb-2">
                    رقم الجوال
                  </label>
                  <input
                    id="booking-phone"
                    type="tel"
                    dir="ltr"
                    value={booking.phone}
                    onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    className={`w-full rounded-xl bg-[#0d0a1d]/60 border px-4 py-3 text-sm text-white placeholder:text-violet-500 text-left focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${bookingErrors.phone ? "border-rose-500" : "border-violet-400/25"}`}
                  />
                  {bookingErrors.phone && <p className="text-rose-400 text-xs mt-1.5 font-semibold">{bookingErrors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="booking-date" className="block text-sm font-bold text-violet-200 mb-2">
                    تاريخ المناسبة
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    value={booking.eventDate}
                    onChange={(e) => setBooking({ ...booking, eventDate: e.target.value })}
                    className={`w-full rounded-xl bg-[#0d0a1d]/60 border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${bookingErrors.eventDate ? "border-rose-500" : "border-violet-400/25"}`}
                  />
                  {bookingErrors.eventDate && <p className="text-rose-400 text-xs mt-1.5 font-semibold">{bookingErrors.eventDate}</p>}
                </div>
                <div>
                  <label htmlFor="booking-type" className="block text-sm font-bold text-violet-200 mb-2">
                    نوع المناسبة
                  </label>
                  <select
                    id="booking-type"
                    value={booking.eventType}
                    onChange={(e) => setBooking({ ...booking, eventType: e.target.value })}
                    className={`w-full rounded-xl bg-[#0d0a1d]/60 border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${bookingErrors.eventType ? "border-rose-500" : "border-violet-400/25"}`}
                  >
                    <option value="">اختر نوع المناسبة...</option>
                    {eventTabs.map((t) => (
                      <option key={t.key} value={t.label}>
                        {t.emoji} {t.label}
                      </option>
                    ))}
                    <option value="مناسبة أخرى">🎉 مناسبة أخرى</option>
                  </select>
                  {bookingErrors.eventType && <p className="text-rose-400 text-xs mt-1.5 font-semibold">{bookingErrors.eventType}</p>}
                </div>
                <button
                  type="submit"
                  className="sm:col-span-2 bg-gradient-to-l from-amber-400 to-amber-500 text-[#0d0a1d] font-extrabold py-3.5 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.35)] hover:shadow-[0_0_35px_rgba(251,191,36,0.55)] hover:-translate-y-0.5 transition-all"
                >
                  أرسل طلب الاستشارة المجانية
                </button>
                <p className="sm:col-span-2 text-center text-xs text-violet-400">
                  🔒 بياناتك في أمان تام ولن تُستخدم إلا للتواصل بخصوص مناسبتك.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-[#080614] border-t border-amber-400/15 text-violet-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-lg text-[#0d0a1d]">🌙</span>
              <span className="text-2xl font-extrabold text-white">ليالي</span>
            </div>
            <p className="text-sm text-violet-400/90 leading-relaxed">
              شركة تخطيط أعراس وفعاليات تأسست عام 2014، نفذت أكثر من 1,400 مناسبة في مدن المملكة والخليج. سجل تجاري 4030-558912.
            </p>
            <div className="flex gap-3 mt-5">
              {["𝕏", "📷", "🎵", "💬"].map((icon) => (
                <span
                  key={icon}
                  className="w-9 h-9 rounded-full bg-violet-900/40 hover:bg-amber-400 hover:text-[#0d0a1d] flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-amber-300 mb-4">أقسام الموقع</h3>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-violet-400/90 hover:text-amber-300 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-amber-300 mb-4">خدماتنا</h3>
            <ul className="space-y-2.5 text-sm">
              {eventTabs.map((t) => (
                <li key={t.key}>
                  <a href="#events" className="text-violet-400/90 hover:text-amber-300 transition-colors">
                    {t.emoji} تنظيم {t.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#estimator" className="text-violet-400/90 hover:text-amber-300 transition-colors">
                  🧮 حاسبة الميزانية
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-amber-300 mb-4">تواصل معنا</h3>
            <ul className="space-y-3 text-sm text-violet-400/90">
              <li className="flex items-center gap-2.5">
                <span>📍</span> شارع الأمير سلطان، حي السلامة، جدة
              </li>
              <li className="flex items-center gap-2.5">
                <span>📞</span> <span dir="ltr">+966 12 987 6543</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span>✉️</span> <span dir="ltr">events@layali.sa</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span>🕗</span> السبت إلى الخميس، 10 صباحًا — 10 مساءً
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-violet-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-violet-500">
            <p>© 2026 ليالي لتخطيط الأعراس والفعاليات — جميع الحقوق محفوظة ✦</p>
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
        className="fixed bottom-4 left-4 z-50 bg-[#1a1140]/95 backdrop-blur border border-amber-400/40 text-amber-300 text-xs font-bold px-4 py-2.5 rounded-full shadow-lg hover:bg-amber-400 hover:text-[#0d0a1d] hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] transition-all"
      >
        🗂️ جميع الصفحات
      </Link>
    </div>
  );
}
