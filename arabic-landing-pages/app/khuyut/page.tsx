"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* البيانات                                                            */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  "الكل",
  "عبايات",
  "قفاطين",
  "فساتين سهرة",
  "ملابس محتشمة عصرية",
];

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  gradient: string;
  pattern: string;
  tag?: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "عباءة الوسام المطرزة",
    category: "عبايات",
    price: 890,
    gradient: "from-neutral-900 via-neutral-800 to-rose-200",
    pattern: "🪡",
    tag: "الأكثر مبيعاً",
  },
  {
    id: 2,
    name: "قفطان زهر الرمان",
    category: "قفاطين",
    price: 1250,
    gradient: "from-rose-300 via-rose-200 to-amber-100",
    pattern: "🌸",
    tag: "جديد",
  },
  {
    id: 3,
    name: "فستان ليالي الحرير",
    category: "فساتين سهرة",
    price: 1890,
    gradient: "from-rose-900 via-rose-700 to-rose-300",
    pattern: "✨",
  },
  {
    id: 4,
    name: "طقم الكتان العصري",
    category: "ملابس محتشمة عصرية",
    price: 720,
    gradient: "from-amber-100 via-stone-200 to-rose-100",
    pattern: "🧵",
  },
  {
    id: 5,
    name: "عباءة الغيمة بأكمام واسعة",
    category: "عبايات",
    price: 760,
    gradient: "from-stone-300 via-rose-100 to-stone-100",
    pattern: "☁️",
  },
  {
    id: 6,
    name: "قفطان مخمل الليل",
    category: "قفاطين",
    price: 1480,
    gradient: "from-neutral-900 via-rose-950 to-rose-700",
    pattern: "🌙",
    tag: "إصدار محدود",
  },
  {
    id: 7,
    name: "فستان وردة المساء",
    category: "فساتين سهرة",
    price: 1640,
    gradient: "from-rose-400 via-rose-300 to-amber-50",
    pattern: "🥀",
  },
  {
    id: 8,
    name: "تنورة وبلوزة الصباح",
    category: "ملابس محتشمة عصرية",
    price: 590,
    gradient: "from-rose-100 via-amber-50 to-stone-200",
    pattern: "🤍",
    tag: "جديد",
  },
  {
    id: 9,
    name: "عباءة الخيط الذهبي",
    category: "عبايات",
    price: 980,
    gradient: "from-neutral-800 via-stone-700 to-amber-200",
    pattern: "💛",
  },
  {
    id: 10,
    name: "قفطان شمس المغرب",
    category: "قفاطين",
    price: 1320,
    gradient: "from-amber-200 via-rose-200 to-rose-400",
    pattern: "🌅",
  },
];

const COLORS = [
  {
    name: "أسود فاحم",
    swatch: "bg-neutral-900",
    gradient: "from-neutral-900 via-neutral-800 to-neutral-600",
  },
  {
    name: "وردي مغبر",
    swatch: "bg-rose-300",
    gradient: "from-rose-400 via-rose-300 to-rose-100",
  },
  {
    name: "بيج رملي",
    swatch: "bg-amber-200",
    gradient: "from-amber-200 via-stone-200 to-amber-50",
  },
  {
    name: "نبيذي عميق",
    swatch: "bg-rose-900",
    gradient: "from-rose-950 via-rose-800 to-rose-500",
  },
];

const SIZES = [
  { label: "S", extra: 0 },
  { label: "M", extra: 0 },
  { label: "L", extra: 40 },
  { label: "XL", extra: 60 },
];

const SIZE_GUIDE = [
  { size: "S", bust: "88 — 92", waist: "68 — 72", length: "135" },
  { size: "M", bust: "93 — 97", waist: "73 — 78", length: "138" },
  { size: "L", bust: "98 — 104", waist: "79 — 86", length: "141" },
  { size: "XL", bust: "105 — 112", waist: "87 — 95", length: "144" },
];

const LOOKBOOK = [
  {
    title: "إطلالة الصحراء الذهبية",
    text: "عباءة بيج رملي بقصة انسيابية مع حزام مطرز يدوياً، تكتمل بطرحة شيفون بدرجة الرمل الدافئ لإطلالة نهارية راقية.",
    gradient: "from-amber-300 via-amber-100 to-rose-100",
    emoji: "🏜️",
  },
  {
    title: "سهرة الورد الدمشقي",
    text: "فستان سهرة بدرجات الوردي المغبر مع تطريز ورود ثلاثية الأبعاد على الصدر والأكمام، مصمم ليخطف الأنظار في المناسبات.",
    gradient: "from-rose-500 via-rose-300 to-rose-100",
    emoji: "🌹",
  },
  {
    title: "أناقة المدينة الحديثة",
    text: "طقم كتان محتشم بخطوط هندسية نظيفة وألوان محايدة، صمم خصيصاً لإيقاع الحياة اليومية دون التنازل عن الأناقة.",
    gradient: "from-stone-400 via-stone-200 to-amber-50",
    emoji: "🏙️",
  },
  {
    title: "ليالي المخمل الفاخرة",
    text: "قفطان مخمل بلون نبيذي عميق مع خيوط ذهبية منسوجة يدوياً على الياقة والأطراف، قطعة استثنائية لليالي الشتاء.",
    gradient: "from-rose-950 via-rose-800 to-amber-300",
    emoji: "🌙",
  },
];

const CRAFT_FEATURES = [
  {
    emoji: "🪡",
    title: "تطريز يدوي خالص",
    text: "كل غرزة تنفذ بأيدي حرفيات متمرسات ورثن المهنة جيلاً بعد جيل، لتحمل كل قطعة بصمة لا تتكرر.",
  },
  {
    emoji: "🧵",
    title: "أقمشة منتقاة بعناية",
    text: "نستورد الحرير والكتان والكريب من أعرق المصانع، ونختبر كل قماش يدوياً قبل دخوله المشغل.",
  },
  {
    emoji: "✂️",
    title: "قصات مدروسة",
    text: "باترونات تصمم خصيصاً لتناسب القوام العربي، وتوازن بين الاحتشام والانسيابية وحرية الحركة.",
  },
  {
    emoji: "🔍",
    title: "فحص جودة ثلاثي",
    text: "تمر كل قطعة بثلاث مراحل تدقيق قبل تغليفها، لنضمن وصولها إليك بلا أدنى عيب في الخياطة أو التشطيب.",
  },
];

const PRESS_QUOTES = [
  {
    quote:
      "خيوط تعيد تعريف الأزياء المحتشمة: حرفية تراثية بروح معاصرة تنافس أرقى دور الأزياء العالمية.",
    source: "مجلة هي",
  },
  {
    quote:
      "من أكثر العلامات السعودية الصاعدة إثارة للإعجاب؛ عباءاتها المطرزة أصبحت حديث مواسم الأزياء.",
    source: "ڤوغ العربية",
  },
  {
    quote:
      "تفاصيل التطريز اليدوي في قطع خيوط تجعل كل إطلالة قطعة فنية تستحق الاقتناء والتوارث.",
    source: "سيدتي",
  },
];

const SHIPPING_PERKS = [
  { emoji: "🚚", title: "شحن مجاني", text: "للطلبات فوق 500 ريال داخل المملكة ودول الخليج" },
  { emoji: "↩️", title: "إرجاع مرن", text: "استبدال أو استرجاع خلال 14 يوماً دون أي رسوم" },
  { emoji: "🎁", title: "تغليف فاخر", text: "كل طلب يصل في علبة حريرية مع بطاقة إهداء مخملية" },
  { emoji: "🔒", title: "دفع آمن", text: "مدى، أبل باي، وجميع البطاقات عبر بوابة مشفرة" },
];

/* ------------------------------------------------------------------ */
/* الصفحة الرئيسية                                                     */
/* ------------------------------------------------------------------ */

export default function KhuyutPage() {
  /* القائمة المتنقلة وحقيبة التسوق */
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagCount, setBagCount] = useState(0);
  const [addedFlash, setAddedFlash] = useState(false);

  /* تصفية المجموعة */
  const [category, setCategory] = useState("الكل");

  /* مُهيّئ القطعة المميزة */
  const [colorIndex, setColorIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(1);

  /* دليل المقاسات */
  const [guideOpen, setGuideOpen] = useState(false);

  /* عارض الإطلالات */
  const [slide, setSlide] = useState(0);

  /* النشرة البريدية */
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = guideOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [guideOpen]);

  useEffect(() => {
    if (!addedFlash) return;
    const id = setTimeout(() => setAddedFlash(false), 1800);
    return () => clearTimeout(id);
  }, [addedFlash]);

  const filteredProducts = useMemo(
    () =>
      category === "الكل"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === category),
    [category]
  );

  const basePrice = 890;
  const featuredPrice = basePrice + SIZES[sizeIndex].extra;
  const selectedColor = COLORS[colorIndex];

  const addToBag = () => {
    setBagCount((c) => c + 1);
    setAddedFlash(true);
  };

  const nextSlide = () => setSlide((s) => (s + 1) % LOOKBOOK.length);
  const prevSlide = () => setSlide((s) => (s - 1 + LOOKBOOK.length) % LOOKBOOK.length);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed.length === 0) {
      setEmailError("يرجى إدخال بريدك الإلكتروني أولاً");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setEmailError("صيغة البريد الإلكتروني غير صحيحة، مثال: name@example.com");
      return;
    }
    setEmailError("");
    setSubscribed(true);
  };

  const navLinks = [
    { href: "#collection", label: "المجموعة" },
    { href: "#atelier", label: "المشغل" },
    { href: "#lookbook", label: "إطلالات الموسم" },
    { href: "#story", label: "حكايتنا" },
    { href: "#newsletter", label: "النشرة" },
  ];

  return (
    <div className="min-h-screen bg-[#faf6f2] font-sans text-neutral-900">
      {/* ------------------------------ الشريط العلوي ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-rose-200/70 bg-[#faf6f2]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="#top" className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight text-neutral-900">
              خيوط
            </span>
            <span className="h-2 w-2 rounded-full bg-rose-400" />
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-wide text-neutral-600 transition-colors hover:text-rose-500"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all ${
                addedFlash ? "scale-110 bg-rose-400" : "bg-rose-100"
              }`}
            >
              🛍️
              <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-xs font-bold text-rose-200">
                {bagCount}
              </span>
            </div>
            <a
              href="#atelier"
              className="hidden rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-bold text-rose-100 transition-all hover:bg-rose-500 hover:text-white md:block"
            >
              تسوقي الآن
            </a>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="فتح القائمة"
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg bg-rose-100 transition-colors hover:bg-rose-200 lg:hidden"
            >
              <span
                className={`h-0.5 w-5 bg-neutral-900 transition-transform ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span className={`h-0.5 w-5 bg-neutral-900 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span
                className={`h-0.5 w-5 bg-neutral-900 transition-transform ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-rose-200/70 bg-[#faf6f2] px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-4 py-3 font-medium text-neutral-700 transition-colors hover:bg-rose-100 hover:text-rose-600"
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
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-rose-200/50 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-amber-100/70 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/70 px-4 py-1.5 text-sm font-semibold text-rose-600">
                ✨ مجموعة خريف وشتاء 2026
              </span>
              <h1 className="mt-6 text-4xl font-black leading-tight text-neutral-900 md:text-5xl lg:text-6xl">
                أناقة تُحاك
                <span className="relative mx-2 inline-block text-rose-500">
                  خيطاً
                  <svg
                    viewBox="0 0 100 12"
                    className="absolute -bottom-1 right-0 w-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 8 Q 25 2, 50 7 T 98 6"
                      fill="none"
                      stroke="#fb7185"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                بخيط
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600">
                دار أزياء عربية تمزج التطريز اليدوي التراثي بقصات معاصرة؛ عبايات
                وقفاطين وفساتين سهرة وملابس محتشمة عصرية، تُخاط كل قطعة منها في
                مشغلنا بشغف لا تعرفه خطوط الإنتاج.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#collection"
                  className="rounded-full bg-neutral-900 px-8 py-3.5 font-bold text-rose-100 shadow-xl shadow-neutral-900/20 transition-all hover:scale-105 hover:bg-rose-500 hover:text-white"
                >
                  اكتشفي المجموعة
                </a>
                <a
                  href="#lookbook"
                  className="rounded-full border-2 border-neutral-900 px-8 py-3.5 font-bold text-neutral-900 transition-colors hover:border-rose-400 hover:text-rose-500"
                >
                  إطلالات الموسم
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-neutral-500">
                <span className="flex items-center gap-2">
                  <span className="text-rose-500">✓</span> تطريز يدوي 100%
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-rose-500">✓</span> إصدارات محدودة
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-rose-500">✓</span> شحن خليجي سريع
                </span>
              </div>
            </div>

            {/* لوحة الأزياء */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex h-72 items-end justify-center rounded-t-[80px] rounded-b-3xl bg-gradient-to-b from-neutral-900 via-neutral-800 to-rose-300 pb-6 text-5xl shadow-2xl">
                  🖤
                </div>
                <div className="mt-10 flex h-72 items-end justify-center rounded-t-[80px] rounded-b-3xl bg-gradient-to-b from-rose-400 via-rose-300 to-amber-100 pb-6 text-5xl shadow-2xl">
                  🌸
                </div>
              </div>
              <div className="absolute -bottom-5 right-1/2 flex translate-x-1/2 items-center gap-3 rounded-full border border-rose-200 bg-white px-6 py-3 shadow-xl">
                <span className="text-2xl">🪡</span>
                <div>
                  <div className="text-sm font-extrabold text-neutral-900">صُنع بحب في مشغلنا</div>
                  <div className="text-xs text-neutral-500">أكثر من 40 حرفية ماهرة</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ المجموعة ------------------------------ */}
        <section id="collection" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="text-center">
            <span className="text-sm font-bold tracking-widest text-rose-500">المجموعة</span>
            <h2 className="mt-2 text-3xl font-black text-neutral-900 md:text-4xl">
              قطع تليق بكل مناسبة
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              تصفحي تشكيلتنا حسب الفئة، واختاري القطعة التي تشبه ذوقك.
            </p>
          </div>

          {/* أزرار التصفية */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 md:gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  category === cat
                    ? "bg-neutral-900 text-rose-100 shadow-lg shadow-neutral-900/20"
                    : "border border-rose-200 bg-white text-neutral-600 hover:border-rose-400 hover:text-rose-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {filteredProducts.length} قطعة في هذه الفئة
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-200/60"
              >
                <div
                  className={`relative flex h-64 items-center justify-center bg-gradient-to-b ${product.gradient}`}
                >
                  <span className="text-6xl drop-shadow-md transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                    {product.pattern}
                  </span>
                  {product.tag && (
                    <span className="absolute top-4 right-4 rounded-full bg-neutral-900/85 px-3 py-1 text-xs font-bold text-rose-100 backdrop-blur">
                      {product.tag}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/60 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="text-xs font-semibold tracking-wide text-rose-500">
                    {product.category}
                  </div>
                  <h3 className="mt-1 font-bold text-neutral-900">{product.name}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-neutral-900">
                      {product.price}
                      <span className="mr-1 text-sm font-medium text-neutral-500">ريال</span>
                    </span>
                    <button
                      onClick={addToBag}
                      className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-600 transition-all hover:bg-neutral-900 hover:text-rose-100"
                    >
                      أضيفي للحقيبة
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------------------ المشغل: القطعة المميزة ------------------------------ */}
        <section
          id="atelier"
          className="scroll-mt-24 bg-gradient-to-b from-rose-50 via-[#faf6f2] to-[#faf6f2] py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <span className="text-sm font-bold tracking-widest text-rose-500">قطعة الموسم</span>
              <h2 className="mt-2 text-3xl font-black text-neutral-900 md:text-4xl">
                صمميها على ذوقك
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
                عباءة الوسام المطرزة — اختاري اللون والمقاس وستُخاط خصيصاً لك في
                مشغلنا خلال خمسة أيام عمل.
              </p>
            </div>

            <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
              {/* بطاقة المعاينة */}
              <div className="mx-auto w-full max-w-md">
                <div
                  className={`relative flex h-[420px] items-center justify-center rounded-t-[110px] rounded-b-3xl bg-gradient-to-b ${selectedColor.gradient} shadow-2xl transition-all duration-500`}
                >
                  <span className="text-8xl drop-shadow-xl">🪡</span>
                  <span className="absolute top-6 right-6 rounded-full bg-white/85 px-4 py-1.5 text-xs font-bold text-neutral-900 backdrop-blur">
                    {selectedColor.name}
                  </span>
                  <span className="absolute top-6 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/85 text-sm font-black text-rose-100 backdrop-blur">
                    {SIZES[sizeIndex].label}
                  </span>
                  <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/40 bg-white/80 p-4 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-neutral-900">عباءة الوسام المطرزة</div>
                        <div className="text-xs text-neutral-500">
                          {selectedColor.name} — مقاس {SIZES[sizeIndex].label}
                        </div>
                      </div>
                      <div className="text-xl font-black text-rose-600">
                        {featuredPrice}
                        <span className="mr-1 text-xs font-bold text-neutral-500">ريال</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* خيارات التهيئة */}
              <div className="rounded-3xl border border-rose-100 bg-white p-7 shadow-xl md:p-9">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-bold text-neutral-900">اللون</span>
                    <span className="text-sm text-rose-500">{selectedColor.name}</span>
                  </div>
                  <div className="flex gap-3">
                    {COLORS.map((color, i) => (
                      <button
                        key={color.name}
                        onClick={() => setColorIndex(i)}
                        aria-label={color.name}
                        title={color.name}
                        className={`h-12 w-12 rounded-full ${color.swatch} shadow-inner transition-all hover:scale-110 ${
                          colorIndex === i
                            ? "ring-4 ring-rose-400 ring-offset-2 ring-offset-white"
                            : "ring-1 ring-neutral-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-bold text-neutral-900">المقاس</span>
                    <button
                      onClick={() => setGuideOpen(true)}
                      className="text-sm font-semibold text-rose-500 underline decoration-rose-300 underline-offset-4 transition-colors hover:text-rose-700"
                    >
                      دليل المقاسات 📏
                    </button>
                  </div>
                  <div className="flex gap-3">
                    {SIZES.map((size, i) => (
                      <button
                        key={size.label}
                        onClick={() => setSizeIndex(i)}
                        className={`flex h-12 w-14 items-center justify-center rounded-xl font-black transition-all ${
                          sizeIndex === i
                            ? "bg-neutral-900 text-rose-100 shadow-lg"
                            : "border border-rose-200 bg-rose-50 text-neutral-700 hover:border-rose-400"
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                  {SIZES[sizeIndex].extra > 0 && (
                    <p className="mt-3 text-xs text-neutral-500">
                      يضاف {SIZES[sizeIndex].extra} ريالاً لتكلفة القماش الإضافي في هذا المقاس.
                    </p>
                  )}
                </div>

                <div className="mt-8 flex items-center justify-between rounded-2xl bg-rose-50 p-5">
                  <div>
                    <div className="text-xs text-neutral-500">السعر الإجمالي</div>
                    <div className="text-3xl font-black text-neutral-900">
                      {featuredPrice}
                      <span className="mr-1 text-sm font-bold text-neutral-500">ريال</span>
                    </div>
                  </div>
                  <button
                    onClick={addToBag}
                    className="rounded-full bg-neutral-900 px-7 py-3.5 font-bold text-rose-100 shadow-lg transition-all hover:scale-105 hover:bg-rose-500 hover:text-white"
                  >
                    {addedFlash ? "أضيفت ✓" : "أضيفي للحقيبة 🛍️"}
                  </button>
                </div>

                <p className="mt-5 text-xs leading-relaxed text-neutral-500">
                  تشمل القطعة شماغاً حريرياً داخلياً وكيس حفظ قطني، مع شهادة أصالة
                  موقعة من الحرفية التي طرزتها.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ إطلالات الموسم ------------------------------ */}
        <section id="lookbook" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="text-center">
            <span className="text-sm font-bold tracking-widest text-rose-500">اللوك بوك</span>
            <h2 className="mt-2 text-3xl font-black text-neutral-900 md:text-4xl">
              إطلالات الموسم
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              أربع إطلالات نسّقها فريقنا لتلهمك في كل مناسبة، من صباحات العمل إلى
              ليالي السهر.
            </p>
          </div>

          <div className="relative mt-12">
            <div className="overflow-hidden rounded-[40px] shadow-2xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(${slide * 100}%)` }}
              >
                {LOOKBOOK.map((look) => (
                  <div key={look.title} className="w-full shrink-0">
                    <div
                      className={`grid min-h-[380px] items-center gap-8 bg-gradient-to-bl ${look.gradient} p-8 md:grid-cols-2 md:p-14`}
                    >
                      <div className="order-2 md:order-1">
                        <div className="inline-block rounded-full bg-neutral-900/85 px-4 py-1.5 text-xs font-bold text-rose-100 backdrop-blur">
                          إطلالة {LOOKBOOK.indexOf(look) + 1} من {LOOKBOOK.length}
                        </div>
                        <h3 className="mt-4 text-2xl font-black text-neutral-900 md:text-3xl">
                          {look.title}
                        </h3>
                        <p className="mt-4 max-w-md leading-relaxed text-neutral-800">
                          {look.text}
                        </p>
                        <a
                          href="#collection"
                          className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-rose-100 transition-all hover:scale-105 hover:bg-white hover:text-neutral-900"
                        >
                          تسوقي الإطلالة
                        </a>
                      </div>
                      <div className="order-1 flex justify-center md:order-2">
                        <div className="flex h-52 w-52 items-center justify-center rounded-full border-8 border-white/50 bg-white/30 text-8xl shadow-xl backdrop-blur md:h-64 md:w-64">
                          {look.emoji}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* أزرار التنقل: التالي يساراً والسابق يميناً في الاتجاه العربي */}
            <button
              onClick={prevSlide}
              aria-label="الإطلالة السابقة"
              className="absolute top-1/2 right-3 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-900 shadow-xl transition-all hover:scale-110 hover:bg-neutral-900 hover:text-rose-100 md:-right-5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              aria-label="الإطلالة التالية"
              className="absolute top-1/2 left-3 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-900 shadow-xl transition-all hover:scale-110 hover:bg-neutral-900 hover:text-rose-100 md:-left-5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* مؤشرات النقاط */}
            <div className="mt-6 flex justify-center gap-2.5">
              {LOOKBOOK.map((look, i) => (
                <button
                  key={look.title}
                  onClick={() => setSlide(i)}
                  aria-label={`الانتقال إلى ${look.title}`}
                  className={`h-2.5 rounded-full transition-all ${
                    slide === i ? "w-8 bg-rose-500" : "w-2.5 bg-rose-200 hover:bg-rose-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ حكايتنا ------------------------------ */}
        <section
          id="story"
          className="scroll-mt-24 bg-neutral-900 py-20 text-rose-50"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <span className="text-sm font-bold tracking-widest text-rose-400">حكايتنا</span>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">
                من إبرة جدّة إلى دار أزياء
              </h2>
              <p className="mt-6 leading-relaxed text-rose-100/80">
                بدأت خيوط عام 2018 في غرفة صغيرة بحي البلد في جدة، حيث كانت
                مؤسستنا تطرز العبايات لقريباتها بخيوط ورثت ألوانها عن جدتها. اليوم
                يضم مشغلنا أكثر من أربعين حرفية يحفظن أسرار غرز السدو والتلّي
                والمكينة اليدوية، وينسجن في كل قطعة حكاية تمتد لأجيال.
              </p>
              <p className="mt-4 leading-relaxed text-rose-100/80">
                نؤمن أن الاحتشام لا يعني التنازل عن الأناقة، وأن القطعة المخيطة
                يدوياً تحمل روحاً لا تستطيع المصانع تقليدها. لذلك نصدر مجموعات
                محدودة العدد، ونرقّم كل قطعة، ونوقعها باسم الحرفية التي أبدعتها.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl bg-white/5 p-5">
                  <div className="text-3xl font-black text-rose-400">+40</div>
                  <div className="mt-1 text-xs text-rose-100/70">حرفية في المشغل</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-5">
                  <div className="text-3xl font-black text-rose-400">+18</div>
                  <div className="mt-1 text-xs text-rose-100/70">ساعة تطريز للقطعة</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-5">
                  <div className="text-3xl font-black text-rose-400">8</div>
                  <div className="mt-1 text-xs text-rose-100/70">مجموعات سنوياً فقط</div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {CRAFT_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition-all hover:-translate-y-1 hover:border-rose-400/50 hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/15 text-2xl transition-transform group-hover:scale-110">
                    {feature.emoji}
                  </div>
                  <h3 className="mt-4 font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-rose-100/70">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ شهادات الصحافة ------------------------------ */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <span className="text-sm font-bold tracking-widest text-rose-500">قالوا عنا</span>
            <h2 className="mt-2 text-3xl font-black text-neutral-900 md:text-4xl">
              في عيون الصحافة
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRESS_QUOTES.map((press) => (
              <figure
                key={press.source}
                className="flex flex-col rounded-3xl border border-rose-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-200/50"
              >
                <span className="text-4xl text-rose-300">❝</span>
                <blockquote className="mt-3 flex-1 leading-relaxed text-neutral-700">
                  {press.quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-rose-100 pt-4 text-sm font-black tracking-wide text-neutral-900">
                  — {press.source}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ------------------------------ الشحن والإرجاع ------------------------------ */}
        <section className="border-y border-rose-200/70 bg-rose-50/70 py-12">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {SHIPPING_PERKS.map((perk) => (
              <div key={perk.title} className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  {perk.emoji}
                </span>
                <div>
                  <h3 className="font-bold text-neutral-900">{perk.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{perk.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------ النشرة البريدية ------------------------------ */}
        <section id="newsletter" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span className="text-5xl">💌</span>
            <h2 className="mt-4 text-3xl font-black text-neutral-900 md:text-4xl">
              كوني أول من يعرف
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-600">
              اشتركي في نشرتنا لتصلك الإصدارات المحدودة قبل نفادها، مع خصم ترحيبي
              بقيمة 15% على طلبك الأول.
            </p>

            {subscribed ? (
              <div className="mx-auto mt-10 max-w-md rounded-3xl border border-rose-200 bg-white p-10 shadow-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl">
                  🌷
                </div>
                <h3 className="mt-5 text-xl font-black text-neutral-900">
                  أهلاً بك في عائلة خيوط!
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  أرسلنا رمز الخصم الترحيبي إلى{" "}
                  <span className="font-bold text-rose-600" dir="ltr">
                    {email.trim()}
                  </span>
                  . تفقدي بريدك الوارد، وستصلك إصداراتنا القادمة قبل الجميع.
                </p>
                <button
                  onClick={() => {
                    setSubscribed(false);
                    setEmail("");
                  }}
                  className="mt-6 text-sm font-bold text-rose-500 underline decoration-rose-300 underline-offset-4 transition-colors hover:text-rose-700"
                >
                  الاشتراك ببريد آخر
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} noValidate className="mx-auto mt-10 max-w-md">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    aria-label="البريد الإلكتروني"
                    className={`flex-1 rounded-full border bg-white px-6 py-3.5 text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-rose-400 ${
                      emailError ? "border-rose-500" : "border-rose-200"
                    }`}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-neutral-900 px-8 py-3.5 font-bold text-rose-100 shadow-lg transition-all hover:scale-105 hover:bg-rose-500 hover:text-white"
                  >
                    اشتركي
                  </button>
                </div>
                {emailError && (
                  <p className="mt-3 text-sm font-medium text-rose-600">⚠ {emailError}</p>
                )}
                <p className="mt-4 text-xs text-neutral-400">
                  نرسل رسالتين شهرياً كحد أقصى، ويمكنك إلغاء الاشتراك في أي وقت.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* ------------------------------ نافذة دليل المقاسات ------------------------------ */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/70 p-4 backdrop-blur-sm"
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl md:p-9"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-black text-neutral-900">دليل المقاسات 📏</h3>
                <p className="mt-2 text-sm text-neutral-500">
                  جميع القياسات بالسنتيمتر، وتقاس على الجسم مباشرة فوق ملابس خفيفة.
                </p>
              </div>
              <button
                onClick={() => setGuideOpen(false)}
                aria-label="إغلاق"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-neutral-900 transition-colors hover:bg-rose-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-rose-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-900 text-rose-100">
                    <th className="px-4 py-3 text-right font-bold">المقاس</th>
                    <th className="px-4 py-3 text-right font-bold">محيط الصدر</th>
                    <th className="px-4 py-3 text-right font-bold">محيط الخصر</th>
                    <th className="px-4 py-3 text-right font-bold">الطول الكلي</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_GUIDE.map((row, i) => (
                    <tr
                      key={row.size}
                      className={i % 2 === 0 ? "bg-white" : "bg-rose-50/60"}
                    >
                      <td className="px-4 py-3 font-black text-rose-600">{row.size}</td>
                      <td className="px-4 py-3 text-neutral-700">{row.bust}</td>
                      <td className="px-4 py-3 text-neutral-700">{row.waist}</td>
                      <td className="px-4 py-3 text-neutral-700">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-xs leading-relaxed text-neutral-600">
              💡 إذا كان قياسك بين مقاسين ننصح باختيار المقاس الأكبر للحصول على
              الانسيابية المميزة لقصاتنا. ولأي استفسار، فريق التفصيل جاهز لمساعدتك
              عبر الواتساب.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------ التذييل ------------------------------ */}
      <footer className="bg-neutral-900 text-rose-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">خيوط</span>
              <span className="h-2 w-2 rounded-full bg-rose-400" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-rose-100/70">
              دار أزياء عربية تحتفي بالحرفية اليدوية والاحتشام العصري؛ كل قطعة
              تُرقّم وتُوقّع وتُحاك لتبقى معك سنوات، لا موسماً واحداً.
            </p>
            <div className="mt-5 flex gap-3">
              {["📷", "𝕏", "📌", "▶"].map((icon, i) => (
                <button
                  key={i}
                  aria-label="وسائل التواصل الاجتماعي"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm transition-all hover:scale-110 hover:bg-rose-400 hover:text-neutral-900"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white">تسوقي</h4>
            <ul className="mt-4 space-y-3 text-sm text-rose-100/70">
              {CATEGORIES.filter((c) => c !== "الكل").map((cat) => (
                <li key={cat}>
                  <a href="#collection" className="transition-colors hover:text-rose-300">
                    {cat}
                  </a>
                </li>
              ))}
              <li>
                <a href="#atelier" className="transition-colors hover:text-rose-300">
                  قطعة الموسم
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">خدمة العملاء</h4>
            <ul className="mt-4 space-y-3 text-sm text-rose-100/70">
              <li className="transition-colors hover:text-rose-300">سياسة الشحن والتوصيل</li>
              <li className="transition-colors hover:text-rose-300">الاستبدال والاسترجاع</li>
              <li className="transition-colors hover:text-rose-300">دليل العناية بالقطع</li>
              <li className="transition-colors hover:text-rose-300">الأسئلة الشائعة</li>
              <li className="transition-colors hover:text-rose-300">تفصيل حسب الطلب</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">تواصلي معنا</h4>
            <ul className="mt-4 space-y-3 text-sm text-rose-100/70">
              <li>💬 واتساب: 0550001122</li>
              <li>✉️ hello@khuyut.sa</li>
              <li>📍 المشغل: حي الروضة، جدة</li>
              <li>🕙 السبت — الخميس: 10 ص حتى 10 م</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6">
          <p className="text-center text-xs text-rose-100/50">
            © 2026 دار خيوط للأزياء — جميع الحقوق محفوظة. صنع بحب وإبرة وخيط في جدة.
          </p>
        </div>
      </footer>

      {/* ------------------------------ شارة العودة ------------------------------ */}
      <Link
        href="/"
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full border border-rose-300 bg-white/95 px-4 py-2.5 text-sm font-bold text-neutral-900 shadow-xl backdrop-blur transition-all hover:scale-105 hover:bg-neutral-900 hover:text-rose-100"
      >
        <span>🗂️</span> جميع الصفحات
      </Link>
    </div>
  );
}
