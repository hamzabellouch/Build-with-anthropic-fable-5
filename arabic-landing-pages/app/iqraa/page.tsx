"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ─────────────────────────── البيانات ─────────────────────────── */

type Course = {
  title: string;
  instructor: string;
  hours: number;
  level: string;
  rating: number;
  price: string;
  category: string;
  emoji: string;
};

const categories = ["الكل", "برمجة", "تصميم", "أعمال", "لغات", "تسويق"];

const courses: Course[] = [
  {
    title: "أساسيات تطوير الويب الحديث",
    instructor: "م. خالد العمري",
    hours: 32,
    level: "مبتدئ",
    rating: 4.8,
    price: "٢٤٩ ر.س",
    category: "برمجة",
    emoji: "💻",
  },
  {
    title: "احتراف لغة بايثون وتحليل البيانات",
    instructor: "د. سارة الحربي",
    hours: 45,
    level: "متوسط",
    rating: 4.9,
    price: "٣٤٩ ر.س",
    category: "برمجة",
    emoji: "🐍",
  },
  {
    title: "تصميم واجهات المستخدم UI/UX",
    instructor: "أ. ليان القحطاني",
    hours: 28,
    level: "مبتدئ",
    rating: 4.7,
    price: "٢٩٩ ر.س",
    category: "تصميم",
    emoji: "🎨",
  },
  {
    title: "الهوية البصرية وتصميم الشعارات",
    instructor: "أ. عمر الشهري",
    hours: 18,
    level: "متقدم",
    rating: 4.6,
    price: "١٩٩ ر.س",
    category: "تصميم",
    emoji: "✒️",
  },
  {
    title: "إدارة المشاريع الاحترافية PMP",
    instructor: "م. فهد الدوسري",
    hours: 40,
    level: "متقدم",
    rating: 4.8,
    price: "٣٩٩ ر.س",
    category: "أعمال",
    emoji: "📊",
  },
  {
    title: "ريادة الأعمال وبناء الشركات الناشئة",
    instructor: "أ. نورة العتيبي",
    hours: 22,
    level: "مبتدئ",
    rating: 4.5,
    price: "٢٧٩ ر.س",
    category: "أعمال",
    emoji: "🚀",
  },
  {
    title: "الإنجليزية للأعمال والمراسلات",
    instructor: "أ. ريم المالكي",
    hours: 35,
    level: "متوسط",
    rating: 4.7,
    price: "٢٢٩ ر.س",
    category: "لغات",
    emoji: "🇬🇧",
  },
  {
    title: "اللغة اليابانية من الصفر",
    instructor: "أ. يوسف الزهراني",
    hours: 50,
    level: "مبتدئ",
    rating: 4.9,
    price: "٣١٩ ر.س",
    category: "لغات",
    emoji: "🗾",
  },
  {
    title: "التسويق الرقمي عبر منصات التواصل",
    instructor: "أ. منى الغامدي",
    hours: 26,
    level: "متوسط",
    rating: 4.6,
    price: "٢٥٩ ر.س",
    category: "تسويق",
    emoji: "📱",
  },
  {
    title: "تحسين محركات البحث SEO باحتراف",
    instructor: "م. طلال السبيعي",
    hours: 20,
    level: "متقدم",
    rating: 4.7,
    price: "٢٣٩ ر.س",
    category: "تسويق",
    emoji: "🔍",
  },
];

const instructors = [
  {
    name: "د. سارة الحربي",
    specialty: "علوم البيانات والذكاء الاصطناعي",
    students: "٤٢ ألف طالب",
    courses: "٨ دورات",
    emoji: "👩‍💻",
    bio: "حاصلة على الدكتوراه في علوم الحاسب، وعملت في كبرى شركات التقنية قبل أن تتفرّغ للتعليم.",
  },
  {
    name: "م. خالد العمري",
    specialty: "تطوير الويب والتطبيقات",
    students: "٣٨ ألف طالب",
    courses: "١٢ دورة",
    emoji: "👨‍💻",
    bio: "مهندس برمجيات بخبرة تتجاوز ١٥ عامًا في بناء منتجات رقمية تخدم ملايين المستخدمين.",
  },
  {
    name: "أ. ليان القحطاني",
    specialty: "تصميم تجربة المستخدم",
    students: "٢٩ ألف طالب",
    courses: "٦ دورات",
    emoji: "👩‍🎨",
    bio: "مصممة منتجات رقمية قادت فرق تصميم في شركات ناشئة وصلت إلى العالمية.",
  },
  {
    name: "م. فهد الدوسري",
    specialty: "إدارة المشاريع والقيادة",
    students: "٢٥ ألف طالب",
    courses: "٥ دورات",
    emoji: "👨‍💼",
    bio: "مستشار إداري معتمد ساعد عشرات المؤسسات على تطوير عملياتها وفرقها.",
  },
  {
    name: "أ. منى الغامدي",
    specialty: "التسويق الرقمي والمحتوى",
    students: "٣١ ألف طالب",
    courses: "٧ دورات",
    emoji: "👩‍💼",
    bio: "خبيرة تسويق أدارت حملات رقمية لعلامات تجارية رائدة في المنطقة العربية.",
  },
];

const faqs = [
  {
    q: "هل أحصل على شهادة معتمدة بعد إتمام الدورة؟",
    a: "نعم، تحصل عند إكمال أي دورة على شهادة إتمام رقمية موقّعة من المدرّب ومنصة إقرأ، يمكنك مشاركتها على لينكدإن أو إرفاقها بسيرتك الذاتية. كما نوفر شهادات احترافية معتمدة لبعض المسارات المتخصصة.",
  },
  {
    q: "ما هي سياسة استرداد الأموال؟",
    a: "نوفر ضمان استرداد كامل خلال ١٤ يومًا من تاريخ الاشتراك دون أي أسئلة. إذا لم تكن راضيًا عن تجربتك لأي سبب، تواصل مع فريق الدعم وسنعيد لك المبلغ كاملًا.",
  },
  {
    q: "هل يوجد تطبيق للهواتف الذكية؟",
    a: "بالتأكيد! تطبيق إقرأ متوفر على متجري آبل وجوجل، ويتيح لك متابعة دوراتك ومزامنة تقدمك بين جميع أجهزتك بسلاسة تامة.",
  },
  {
    q: "هل يمكنني مشاهدة الدروس دون اتصال بالإنترنت؟",
    a: "نعم، يمكنك تحميل الدروس عبر التطبيق ومشاهدتها في أي وقت دون الحاجة إلى اتصال بالإنترنت — وهي ميزة مثالية أثناء السفر أو التنقل.",
  },
  {
    q: "هل المحتوى مناسب للمبتدئين تمامًا؟",
    a: "صُممت مساراتنا التعليمية لتناسب جميع المستويات. كل دورة موسومة بمستواها (مبتدئ، متوسط، متقدم)، والمسارات التأسيسية تبدأ معك من الصفر خطوة بخطوة.",
  },
  {
    q: "كم تستمر صلاحية وصولي إلى الدورات؟",
    a: "طوال فترة اشتراكك تحصل على وصول غير محدود لكامل المكتبة. وفي خطة المؤسسات يمكن تخصيص فترات وصول دائمة لدورات محددة.",
  },
];

const testimonials = [
  {
    name: "عبدالله الراشد",
    role: "مطوّر برمجيات",
    text: "بدأت من الصفر في مسار تطوير الويب، وبعد ثمانية أشهر حصلت على أول وظيفة لي كمطوّر. جودة الشرح والتطبيق العملي فاقت توقعاتي.",
    emoji: "👨‍💻",
  },
  {
    name: "هند المطيري",
    role: "مصممة منتجات",
    text: "المسار التعليمي في تصميم تجربة المستخدم غيّر مساري المهني بالكامل. المشاريع التطبيقية أصبحت معرض أعمالي الذي أُوظَّف به اليوم.",
    emoji: "👩‍🎨",
  },
  {
    name: "محمد الشمراني",
    role: "رائد أعمال",
    text: "دورات ريادة الأعمال أعطتني الأدوات العملية لإطلاق مشروعي. المدرّبون يتحدثون من خبرة حقيقية وليس من الكتب فقط.",
    emoji: "🚀",
  },
];

const steps = [
  {
    title: "اختر مسارك",
    desc: "تصفّح أكثر من ١٢٠٠ دورة ومسار تعليمي مصمم بعناية في مختلف التخصصات.",
    emoji: "🧭",
  },
  {
    title: "تعلّم بالتطبيق",
    desc: "شاهد الدروس، وطبّق على مشاريع حقيقية، واختبر معرفتك بتقييمات تفاعلية.",
    emoji: "🛠️",
  },
  {
    title: "اسأل وتفاعل",
    desc: "تواصل مع المدرّبين ومجتمع الطلاب للحصول على إجابات وملاحظات على أعمالك.",
    emoji: "💬",
  },
  {
    title: "احصل على شهادتك",
    desc: "أكمل المسار وتسلّم شهادة إتمام تعزز سيرتك الذاتية وملفك المهني.",
    emoji: "🎓",
  },
];

const navLinks = [
  { href: "#courses", label: "الدورات" },
  { href: "#path", label: "كيف نعمل" },
  { href: "#instructors", label: "المدرّبون" },
  { href: "#pricing", label: "الأسعار" },
  { href: "#faq", label: "الأسئلة الشائعة" },
];

/* ─────────────────────── مكوّنات مساعدة ─────────────────────── */

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-amber-500 text-sm">
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.3 4.02a1 1 0 0 0 .95.69h4.22c.97 0 1.37 1.24.59 1.81l-3.42 2.48a1 1 0 0 0-.36 1.12l1.3 4.02c.3.92-.75 1.69-1.54 1.12l-3.41-2.48a1 1 0 0 0-1.18 0l-3.41 2.48c-.79.57-1.84-.2-1.54-1.12l1.3-4.02a1 1 0 0 0-.36-1.12L2 9.45c-.78-.57-.38-1.81.6-1.81H6.8a1 1 0 0 0 .95-.69l1.3-4.02Z" />
      </svg>
      <span className="font-semibold text-slate-700">{rating}</span>
    </span>
  );
}

function Counter({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix: string;
  label: string;
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
      <div className="text-4xl md:text-5xl font-extrabold text-white tabular-nums">
        {value.toLocaleString("ar-EG")}
        {suffix}
      </div>
      <div className="mt-2 text-indigo-200 text-sm md:text-base">{label}</div>
    </div>
  );
}

/* ─────────────────────────── الصفحة ─────────────────────────── */

export default function IqraaPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [yearly, setYearly] = useState(false);
  const [instructorIndex, setInstructorIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const filteredCourses = courses.filter((c) => {
    const matchesCategory =
      activeCategory === "الكل" || c.category === activeCategory;
    const q = search.trim();
    const matchesSearch =
      q === "" || c.title.includes(q) || c.instructor.includes(q);
    return matchesCategory && matchesSearch;
  });

  const currentInstructor = instructors[instructorIndex];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed === "") {
      setEmailError("يرجى إدخال بريدك الإلكتروني.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setEmailError("صيغة البريد الإلكتروني غير صحيحة، يرجى التحقق منها.");
      return;
    }
    setEmailError("");
    setSubscribed(true);
  };

  const plans = [
    {
      name: "الأساسية",
      monthly: 49,
      yearlyMonthly: 39,
      desc: "للمتعلم الفردي الذي يبدأ رحلته",
      features: [
        "الوصول إلى ٣٠٠ دورة أساسية",
        "شهادات إتمام رقمية",
        "مشاهدة على جهاز واحد",
        "دعم عبر البريد الإلكتروني",
      ],
      featured: false,
    },
    {
      name: "الاحترافية",
      monthly: 99,
      yearlyMonthly: 79,
      desc: "الخيار الأكثر شيوعًا للمتعلمين الجادين",
      features: [
        "الوصول الكامل لأكثر من ١٢٠٠ دورة",
        "مسارات تعليمية وشهادات احترافية",
        "تحميل الدروس للمشاهدة دون اتصال",
        "جلسات أسئلة مباشرة مع المدرّبين",
        "مشاهدة على ٣ أجهزة",
      ],
      featured: true,
    },
    {
      name: "المؤسسات",
      monthly: 249,
      yearlyMonthly: 199,
      desc: "لتطوير فرق العمل في شركتك",
      features: [
        "كل مزايا الخطة الاحترافية",
        "لوحة تحكم لمتابعة تقدم الفريق",
        "تقارير أداء شهرية مفصلة",
        "مدير حساب مخصص",
        "حتى ٢٥ مقعدًا",
      ],
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* ───────── شريط التنقل ───────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-indigo-100 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#top" className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center text-lg font-bold shadow-md">
                إ
              </span>
              <span className="text-2xl font-extrabold text-indigo-700">
                إقرأ
              </span>
            </a>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#cta"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                ابدأ مجانًا
              </a>
            </div>

            <button
              type="button"
              aria-label="فتح القائمة"
              className="md:hidden p-2 rounded-lg text-indigo-700 hover:bg-indigo-50 transition-colors"
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
            <div className="md:hidden pb-4 flex flex-col gap-1 border-t border-indigo-50 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#cta"
                onClick={() => setMenuOpen(false)}
                className="mt-2 bg-indigo-600 text-white text-center px-4 py-2 rounded-full font-semibold"
              >
                ابدأ مجانًا
              </a>
            </div>
          )}
        </nav>
      </header>

      {/* ───────── البطل ───────── */}
      <section
        id="top"
        className="relative overflow-hidden bg-gradient-to-bl from-indigo-700 via-indigo-600 to-blue-600"
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-white/15 text-indigo-100 text-sm px-4 py-1.5 rounded-full mb-6 border border-white/20">
                ✨ منصة التعلم العربية الأولى
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                تعلّم مهارات المستقبل
                <span className="block mt-2 bg-gradient-to-l from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  بلغتك وعلى طريقتك
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-indigo-100 leading-relaxed max-w-xl">
                أكثر من ١٢٠٠ دورة احترافية في البرمجة والتصميم والأعمال واللغات
                والتسويق، يقدّمها نخبة من الخبراء العرب بمحتوى عملي يأخذك من
                الصفر إلى الاحتراف.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="#cta"
                  className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-3.5 rounded-full font-bold text-lg text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  جرّب ٧ أيام مجانًا
                </a>
                <a
                  href="#courses"
                  className="border-2 border-white/60 text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-bold text-lg text-center transition-colors"
                >
                  تصفّح الدورات
                </a>
              </div>
              <div className="mt-8 flex items-center gap-3 text-indigo-100 text-sm">
                <div className="flex -space-x-2">
                  {["👨‍🎓", "👩‍🎓", "🧑‍💻", "👩‍💼"].map((e, i) => (
                    <span
                      key={i}
                      className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-base"
                    >
                      {e}
                    </span>
                  ))}
                </div>
                <span>انضم إلى أكثر من ٢٥٠ ألف متعلم نشط</span>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-2xl">
                      🎓
                    </span>
                    <div>
                      <div className="text-white font-bold">
                        مسار تطوير الويب
                      </div>
                      <div className="text-indigo-200 text-sm">
                        ١٢ دورة • ١٨٠ ساعة
                      </div>
                    </div>
                  </div>
                  {[
                    { label: "HTML و CSS", pct: "w-full" },
                    { label: "JavaScript", pct: "w-4/5" },
                    { label: "React", pct: "w-3/5" },
                    { label: "Next.js", pct: "w-1/4" },
                  ].map((row) => (
                    <div key={row.label} className="mb-4">
                      <div className="flex justify-between text-sm text-indigo-100 mb-1.5">
                        <span>{row.label}</span>
                      </div>
                      <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${row.pct} bg-gradient-to-l from-amber-300 to-yellow-200 rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="mt-5 flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3">
                    <span className="text-white text-sm font-semibold">
                      التقدم الكلي
                    </span>
                    <span className="text-amber-300 font-extrabold text-lg">
                      ٦٤٪
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-2">
                  <span className="text-2xl">🏅</span>
                  <div className="text-sm">
                    <div className="font-bold text-slate-800">شهادة جديدة!</div>
                    <div className="text-slate-500">أساسيات JavaScript</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── الإحصاءات ───────── */}
      <section className="bg-gradient-to-l from-indigo-800 to-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter target={250000} suffix="+" label="طالب مسجّل" />
          <Counter target={1200} suffix="+" label="دورة احترافية" />
          <Counter target={180} suffix="+" label="مدرّب خبير" />
          <Counter target={96} suffix="٪" label="نسبة رضا الطلاب" />
        </div>
      </section>

      {/* ───────── كتالوج الدورات ───────── */}
      <section id="courses" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              اكتشف دوراتنا
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              ابحث وصفِّ حسب التخصص لتجد الدورة المثالية لأهدافك المهنية.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-5">
            <div className="relative max-w-xl mx-auto w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن دورة أو مدرّب…"
                className="w-full rounded-full border border-slate-200 bg-white px-12 py-3.5 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="mt-14 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-2xl py-14">
              <div className="text-4xl mb-3">🔎</div>
              لا توجد نتائج مطابقة لبحثك، جرّب كلمات أخرى أو غيّر التصنيف.
            </div>
          ) : (
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <article
                  key={course.title}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-bl from-indigo-100 via-blue-50 to-white flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                    {course.emoji}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {course.category}
                      </span>
                      <Stars rating={course.rating} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 leading-snug">
                      {course.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      {course.instructor}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        ⏱️ {course.hours.toLocaleString("ar-EG")} ساعة
                      </span>
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {course.level}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xl font-extrabold text-indigo-700">
                        {course.price}
                      </span>
                      <button
                        type="button"
                        className="text-sm font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 px-4 py-1.5 rounded-full transition-colors"
                      >
                        سجّل الآن
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────── كيف نعمل ───────── */}
      <section id="path" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              رحلتك التعليمية في أربع خطوات
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              منهجية واضحة تأخذك من الفضول الأول إلى الشهادة الاحترافية.
            </p>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
              >
                <span className="absolute -top-4 right-6 w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                  {(i + 1).toLocaleString("ar-EG")}
                </span>
                <div className="text-4xl mb-4">{step.emoji}</div>
                <h3 className="font-bold text-lg text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── المدرّبون ───────── */}
      <section
        id="instructors"
        className="py-20 bg-gradient-to-bl from-indigo-50 via-blue-50 to-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              تعلّم على يد الخبراء
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              نخبة من المدرّبين العرب بخبرات عملية في كبرى الشركات.
            </p>
          </div>

          <div className="mt-12 relative">
            <div className="bg-white rounded-3xl shadow-lg border border-indigo-100 p-8 md:p-10 text-center transition-all">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-5xl border-4 border-indigo-200 shadow-inner">
                {currentInstructor.emoji}
              </div>
              <h3 className="mt-5 text-2xl font-extrabold text-slate-900">
                {currentInstructor.name}
              </h3>
              <p className="mt-1 text-indigo-600 font-semibold">
                {currentInstructor.specialty}
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed max-w-xl mx-auto">
                {currentInstructor.bio}
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <span className="bg-indigo-50 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-full">
                  👥 {currentInstructor.students}
                </span>
                <span className="bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full">
                  📚 {currentInstructor.courses}
                </span>
              </div>
            </div>

            {/* في RTL "السابق" يتجه يمينًا و"التالي" يسارًا */}
            <button
              type="button"
              aria-label="المدرّب السابق"
              onClick={() =>
                setInstructorIndex(
                  (i) => (i - 1 + instructors.length) % instructors.length
                )
              }
              className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-7 w-12 h-12 rounded-full bg-white shadow-lg border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-5 h-5"
              >
                <path
                  d="m9 6 6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="المدرّب التالي"
              onClick={() =>
                setInstructorIndex((i) => (i + 1) % instructors.length)
              }
              className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-7 w-12 h-12 rounded-full bg-white shadow-lg border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-5 h-5"
              >
                <path
                  d="m15 6-6 6 6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="mt-6 flex justify-center gap-2">
              {instructors.map((ins, i) => (
                <button
                  key={ins.name}
                  type="button"
                  aria-label={`عرض ${ins.name}`}
                  onClick={() => setInstructorIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === instructorIndex
                      ? "w-8 bg-indigo-600"
                      : "w-2.5 bg-indigo-200 hover:bg-indigo-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── آراء الطلاب ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              قصص نجاح طلابنا
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              آلاف المتعلمين غيّروا مساراتهم المهنية مع إقرأ.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="bg-slate-50 rounded-2xl p-7 border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all"
              >
                <div className="text-amber-500 text-lg mb-3">★★★★★</div>
                <blockquote className="text-slate-700 leading-relaxed">
                  &laquo;{t.text}&raquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
                    {t.emoji}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-sm text-indigo-600">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── الأسعار ───────── */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              خطط مرنة تناسب الجميع
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              ابدأ بالخطة المناسبة وارتقِ في أي وقت. إلغاء الاشتراك متاح دائمًا.
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <span
              className={`font-semibold transition-colors ${
                !yearly ? "text-indigo-700" : "text-slate-400"
              }`}
            >
              شهري
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              aria-label="التبديل بين الفوترة الشهرية والسنوية"
              onClick={() => setYearly((v) => !v)}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                yearly ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${
                  yearly ? "left-1" : "left-9"
                }`}
              />
            </button>
            <span
              className={`font-semibold transition-colors ${
                yearly ? "text-indigo-700" : "text-slate-400"
              }`}
            >
              سنوي
            </span>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
              يوفّر ٢٠٪
            </span>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const price = yearly ? plan.yearlyMonthly : plan.monthly;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl p-8 flex flex-col transition-all hover:-translate-y-1 ${
                    plan.featured
                      ? "bg-gradient-to-bl from-indigo-700 to-blue-600 text-white shadow-2xl scale-100 md:scale-105"
                      : "bg-white border border-slate-200 shadow-sm hover:shadow-lg"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-4 right-1/2 translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-extrabold px-4 py-1.5 rounded-full shadow">
                      الأكثر شيوعًا
                    </span>
                  )}
                  <h3
                    className={`text-xl font-extrabold ${
                      plan.featured ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-1.5 text-sm ${
                      plan.featured ? "text-indigo-100" : "text-slate-500"
                    }`}
                  >
                    {plan.desc}
                  </p>
                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold tabular-nums">
                      {price.toLocaleString("ar-EG")}
                    </span>
                    <span
                      className={`pb-1 text-sm ${
                        plan.featured ? "text-indigo-100" : "text-slate-500"
                      }`}
                    >
                      ر.س / شهريًا
                    </span>
                  </div>
                  {yearly && (
                    <span
                      className={`mt-1 text-xs font-semibold ${
                        plan.featured ? "text-amber-300" : "text-emerald-600"
                      }`}
                    >
                      تُدفع سنويًا — وفّرت{" "}
                      {((plan.monthly - plan.yearlyMonthly) * 12).toLocaleString(
                        "ar-EG"
                      )}{" "}
                      ر.س
                    </span>
                  )}
                  <ul className="mt-7 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            plan.featured ? "text-amber-300" : "text-indigo-600"
                          }`}
                        >
                          <path
                            d="m5 13 4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          className={
                            plan.featured ? "text-indigo-50" : "text-slate-600"
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`mt-8 w-full py-3 rounded-full font-bold transition-colors ${
                      plan.featured
                        ? "bg-white text-indigo-700 hover:bg-indigo-50"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
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

      {/* ───────── الأسئلة الشائعة ───────── */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              الأسئلة الشائعة
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              كل ما تحتاج معرفته قبل أن تبدأ رحلتك معنا.
            </p>
          </div>
          <div className="mt-12 space-y-4">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={faq.q}
                  className={`border rounded-2xl overflow-hidden transition-colors ${
                    open
                      ? "border-indigo-300 bg-indigo-50/50"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-right"
                  >
                    <span className="font-bold text-slate-900">{faq.q}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`w-5 h-5 shrink-0 text-indigo-600 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {open && (
                    <p className="px-6 pb-6 text-slate-600 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── دعوة لاتخاذ إجراء ───────── */}
      <section id="cta" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-indigo-700 via-indigo-600 to-blue-600 px-6 py-14 md:p-16 text-center shadow-2xl">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                ابدأ تجربتك المجانية اليوم
              </h2>
              <p className="mt-4 text-indigo-100 text-lg max-w-2xl mx-auto">
                ٧ أيام كاملة من الوصول غير المحدود لجميع الدورات — دون بطاقة
                ائتمانية، ودون أي التزام.
              </p>

              {subscribed ? (
                <div className="mt-8 max-w-md mx-auto bg-emerald-500/20 border border-emerald-300/50 rounded-2xl px-6 py-5 text-emerald-100">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-bold text-white">
                    تم تفعيل تجربتك المجانية بنجاح!
                  </p>
                  <p className="mt-1 text-sm">
                    أرسلنا رابط البدء إلى بريدك الإلكتروني، نتمنى لك رحلة تعلم
                    ممتعة.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  noValidate
                  className="mt-8 max-w-md mx-auto"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      placeholder="بريدك الإلكتروني"
                      aria-label="البريد الإلكتروني"
                      className={`flex-1 rounded-full px-6 py-3.5 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-shadow ${
                        emailError
                          ? "ring-2 ring-red-400 focus:ring-red-300/60"
                          : "focus:ring-amber-300/60"
                      }`}
                    />
                    <button
                      type="submit"
                      className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-colors shadow-lg"
                    >
                      ابدأ الآن
                    </button>
                  </div>
                  {emailError && (
                    <p className="mt-3 text-sm font-semibold text-red-200 bg-red-500/20 rounded-full px-4 py-2 inline-block">
                      ⚠️ {emailError}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── التذييل ───────── */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-400 text-white flex items-center justify-center text-lg font-bold">
                  إ
                </span>
                <span className="text-2xl font-extrabold text-white">إقرأ</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                منصة عربية رائدة في التعليم الرقمي، نمكّن المتعلمين من اكتساب
                مهارات المستقبل بمحتوى عالي الجودة وبلغتهم الأم.
              </p>
              <div className="mt-5 flex gap-3">
                {["𝕏", "in", "▶", "📷"].map((icon) => (
                  <span
                    key={icon}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-indigo-600 flex items-center justify-center text-sm cursor-pointer transition-colors"
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">التخصصات</h4>
              <ul className="space-y-2.5 text-sm">
                {["البرمجة وتطوير الويب", "التصميم والإبداع", "إدارة الأعمال", "اللغات العالمية", "التسويق الرقمي"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#courses"
                        className="hover:text-indigo-400 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">المنصة</h4>
              <ul className="space-y-2.5 text-sm">
                {["عن إقرأ", "انضم كمدرّب", "برنامج الشركاء", "الوظائف", "المدونة"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#top"
                        className="hover:text-indigo-400 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">تواصل معنا</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5">
                  <span>📧</span> support@iqraa.example
                </li>
                <li className="flex items-center gap-2.5">
                  <span>📞</span>
                  <span dir="ltr">+966 11 234 5678</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span>📍</span> الرياض، المملكة العربية السعودية
                </li>
                <li className="flex items-center gap-2.5">
                  <span>🕘</span> الدعم متاح على مدار الساعة
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <span>© ٢٠٢٦ منصة إقرأ التعليمية — جميع الحقوق محفوظة.</span>
            <div className="flex gap-6">
              <a href="#top" className="hover:text-indigo-400 transition-colors">
                سياسة الخصوصية
              </a>
              <a href="#top" className="hover:text-indigo-400 transition-colors">
                شروط الاستخدام
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ───────── شارة العودة ───────── */}
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-50 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-xl border border-indigo-500/50 transition-all hover:-translate-y-0.5"
      >
        جميع الصفحات
      </Link>
    </div>
  );
}
