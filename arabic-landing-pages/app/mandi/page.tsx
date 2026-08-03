"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ---------------------------------- البيانات ---------------------------------- */

type Dish = {
  name: string;
  desc: string;
  price: number;
  spice: 0 | 1 | 2 | 3;
  emoji: string;
  popular?: boolean;
};

const menuCategories: { key: string; label: string; icon: string; dishes: Dish[] }[] = [
  {
    key: "mandi",
    label: "مندي",
    icon: "🍛",
    dishes: [
      {
        name: "مندي لحم حضرمي",
        desc: "لحم ضأن نعيمي يُطهى في حفرة المندي على حطب السمر حتى يذوب على أرز البسمتي المبهّر.",
        price: 68,
        spice: 1,
        emoji: "🐑",
        popular: true,
      },
      {
        name: "مندي دجاج",
        desc: "نصف دجاجة طازجة متبّلة بخلطة البيت، تُحنّذ ببطء فوق أرز ذهبي معطّر بالزعفران.",
        price: 38,
        spice: 1,
        emoji: "🍗",
      },
      {
        name: "مندي ريش",
        desc: "ريش ضأن مختارة تُشوى على الجمر ثم تُكمل نضجها بخار المندي لطراوة لا تُقاوم.",
        price: 78,
        spice: 2,
        emoji: "🍖",
      },
      {
        name: "مندي مشكّل عائلي",
        desc: "صحن العزائم: لحم ودجاج وريش على جبل من الأرز يكفي أربعة أشخاص، مع السلطات والمقبلات.",
        price: 165,
        spice: 1,
        emoji: "🍽️",
        popular: true,
      },
    ],
  },
  {
    key: "madhbi",
    label: "مظبي",
    icon: "🪨",
    dishes: [
      {
        name: "مظبي دجاج على الحجر",
        desc: "دجاج مفرود يُشوى مباشرة على الحجر البركاني الساخن فيكتسب نكهة مدخّنة فريدة.",
        price: 42,
        spice: 2,
        emoji: "🔥",
        popular: true,
      },
      {
        name: "مظبي لحم",
        desc: "شرائح لحم طرية متبّلة بالملح والفلفل الأسود على الطريقة اليمنية الأصيلة.",
        price: 72,
        spice: 2,
        emoji: "🥩",
      },
      {
        name: "مظبي حاشي",
        desc: "لحم حاشي فتي يُظبى على الحجر ويُقدّم مع أرز الكبسة والسحاوق الأخضر.",
        price: 85,
        spice: 3,
        emoji: "🐪",
      },
    ],
  },
  {
    key: "haneeth",
    label: "حنيذ",
    icon: "🕳️",
    dishes: [
      {
        name: "حنيذ غنم بلدي",
        desc: "قطع غنم تُلف بورق الموز وتُدفن في التنور الطيني ست ساعات حتى تنفصل عن العظم.",
        price: 82,
        spice: 1,
        emoji: "🐐",
        popular: true,
      },
      {
        name: "حنيذ كتف",
        desc: "كتف ضأن كامل محنوذ ببطء، يكفي شخصين ويُقدّم مع أرز المندي والمرق الحضرمي.",
        price: 120,
        spice: 1,
        emoji: "🍖",
      },
      {
        name: "فخذ حنيذ ملكي",
        desc: "فخذ ضأن فاخر للمناسبات، يُحنّذ على الطريقة الحضرمية ويُزيّن بالمكسرات والزبيب.",
        price: 190,
        spice: 1,
        emoji: "👑",
      },
    ],
  },
  {
    key: "grills",
    label: "مشويات",
    icon: "🍢",
    dishes: [
      {
        name: "كباب حضرمي",
        desc: "لحم مفروم طازج بالبهارات والبقدونس، يُشوى على الفحم ويُقدّم مع خبز التميس.",
        price: 36,
        spice: 2,
        emoji: "🍢",
      },
      {
        name: "شيش طاووق",
        desc: "مكعبات دجاج متبّلة بالثوم والليمون تُشوى حتى تكتسب لوناً ذهبياً شهياً.",
        price: 34,
        spice: 1,
        emoji: "🍗",
      },
      {
        name: "ريش مشوية",
        desc: "ريش ضأن على الفحم بتتبيلة سرية تتوارثها عائلة البيت منذ ثلاثة أجيال.",
        price: 75,
        spice: 2,
        emoji: "🥩",
        popular: true,
      },
      {
        name: "سمك سيادية مشوي",
        desc: "هامور طازج من سواحل جازان، يُشوى بالكزبرة والليمون الأسود على الجمر.",
        price: 88,
        spice: 3,
        emoji: "🐟",
      },
    ],
  },
  {
    key: "drinks",
    label: "مشروبات وحلويات",
    icon: "🍮",
    dishes: [
      {
        name: "شاهي عدني",
        desc: "شاي بالحليب والهيل والقرنفل يُغلى على نار هادئة كما في مقاهي عدن القديمة.",
        price: 8,
        spice: 0,
        emoji: "🫖",
        popular: true,
      },
      {
        name: "قهوة عربية بالتمر",
        desc: "دلة قهوة خولانية بالهيل والزعفران تُقدّم مع تمر سكري فاخر.",
        price: 14,
        spice: 0,
        emoji: "☕",
      },
      {
        name: "معصوب ملكي",
        desc: "خبز برّي مهروس بالموز والعسل والقشطة، تاج الحلويات الحجازية واليمنية.",
        price: 26,
        spice: 0,
        emoji: "🍌",
      },
      {
        name: "كنافة بالقشطة",
        desc: "كنافة ذهبية محشوة بالقشطة الطازجة ومسقية بالقطر وماء الزهر.",
        price: 24,
        spice: 0,
        emoji: "🍯",
      },
    ],
  },
];

const branches = [
  {
    city: "الرياض",
    name: "فرع حي النخيل",
    address: "طريق الملك فهد، حي النخيل، مقابل برج المملكة",
    phone: "+966 11 456 7890",
    hours: "يومياً من 11 ظهراً حتى 2 بعد منتصف الليل",
    note: "قسم عائلات منفصل + مجالس أرضية تراثية",
  },
  {
    city: "جدة",
    name: "فرع شارع التحلية",
    address: "شارع الأمير محمد بن عبدالعزيز (التحلية)، حي الأندلس",
    phone: "+966 12 654 3210",
    hours: "يومياً من 12 ظهراً حتى 1 بعد منتصف الليل",
    note: "تراس خارجي مطل + خدمة صف السيارات",
  },
  {
    city: "الدمام",
    name: "فرع الكورنيش",
    address: "طريق الكورنيش، حي الشاطئ، بجوار واجهة الدمام البحرية",
    phone: "+966 13 789 0123",
    hours: "يومياً من 12 ظهراً حتى 12 منتصف الليل",
    note: "إطلالة بحرية + جلسات خارجية شتوية",
  },
];

const testimonials = [
  {
    name: "محمد الشهري",
    city: "الرياض",
    text: "أصدق مندي ذقته خارج حضرموت. اللحم ينفصل عن العظم من أول لمسة، والأرز معطّر بنكهة الحطب الحقيقية. صار مطعمنا الرسمي لعزائم العائلة.",
    stars: 5,
  },
  {
    name: "أبو سلطان الغامدي",
    city: "جدة",
    text: "حجزت قسم العائلات لعزيمة ثلاثين شخصاً، والتنظيم كان فوق الممتاز. الحنيذ الملكي أبهر الجميع، والقهوة العربية لمسة كرم ختمت السهرة.",
    stars: 5,
  },
  {
    name: "ريم العنزي",
    city: "الدمام",
    text: "المظبي على الحجر تجربة مختلفة تماماً، نكهة التدخين طبيعية مو صناعية. الجلسة المطلة على البحر مع الشاهي العدني لا تُنسى.",
    stars: 4,
  },
  {
    name: "خالد باوزير",
    city: "الرياض",
    text: "أنا حضرمي وأعرف المندي الأصلي، وأشهد أن بيت المندي حافظ على الطريقة التقليدية بحذافيرها. حفرة الحطب والصبر الطويل يفرقان كثيراً في الطعم.",
    stars: 5,
  },
];

const cookingSteps = [
  {
    title: "اختيار الذبيحة",
    icon: "🐑",
    desc: "نختار يومياً ذبائح نعيمي فتية من مزارع محلية موثوقة، وتصل المطبخ طازجة قبل الفجر ليبدأ التجهيز مع أذان الصبح.",
  },
  {
    title: "التتبيلة الحضرمية",
    icon: "🧂",
    desc: "خلطة بهارات سرية من الكركم والكمون والفلفل الأسود والهيل، تتوارثها عائلة البيت منذ عام 1962 وتُحضّر يدوياً كل صباح.",
  },
  {
    title: "إشعال حطب السمر",
    icon: "🪵",
    desc: "نشعل حطب السمر النجدي في حفرة المندي قبل الطهي بساعتين، حتى يتحول إلى جمر هادئ يمنح اللحم نكهته المدخّنة المميزة.",
  },
  {
    title: "الدفن والصبر",
    icon: "⏳",
    desc: "يُعلّق اللحم فوق الأرز داخل الحفرة وتُغلق بإحكام بالطين، ليطهى بحرارة الجمر وبخار الأرز من أربع إلى ست ساعات كاملة.",
  },
  {
    title: "الفتح والتقديم",
    icon: "🍽️",
    desc: "لحظة فتح الحفرة هي عرسنا اليومي: يخرج اللحم ذائباً فوق أرز تشرّب كل النكهات، ويُقدّم فوراً مع السحاوق والسلطات الطازجة.",
  },
];

const deliveryApps = [
  { name: "هنقرستيشن", icon: "🛵", color: "from-yellow-400 to-amber-500", time: "35 – 45 دقيقة" },
  { name: "جاهز", icon: "📦", color: "from-red-500 to-rose-600", time: "30 – 40 دقيقة" },
  { name: "مرسول", icon: "🛒", color: "from-emerald-500 to-teal-600", time: "40 – 50 دقيقة" },
  { name: "تويو", icon: "🚗", color: "from-sky-500 to-blue-600", time: "35 – 50 دقيقة" },
];

const navLinks = [
  { href: "#menu", label: "قائمة الطعام" },
  { href: "#cooking", label: "طريقتنا" },
  { href: "#branches", label: "فروعنا" },
  { href: "#testimonials", label: "آراء ضيوفنا" },
  { href: "#reservation", label: "احجز طاولة" },
  { href: "#delivery", label: "التوصيل" },
];

/* ---------------------------------- مكونات مساعدة ---------------------------------- */

function SpiceLevel({ level }: { level: 0 | 1 | 2 | 3 }) {
  if (level === 0) {
    return <span className="text-xs font-semibold text-stone-400">بدون حار</span>;
  }
  const labels = ["", "حار خفيف", "حار متوسط", "حار جداً"];
  return (
    <span className="flex items-center gap-1.5" title={labels[level]}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`text-sm ${i <= level ? "" : "opacity-20 grayscale"}`}>
            🌶️
          </span>
        ))}
      </span>
      <span className="text-xs font-semibold text-orange-300">{labels[level]}</span>
    </span>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex justify-center gap-1 text-xl text-amber-400" aria-label={`تقييم ${count} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= count ? "" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub, dark }: { eyebrow: string; title: string; sub?: string; dark?: boolean }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <span className="mb-3 inline-block rounded-full bg-red-800/15 px-4 py-1 text-sm font-bold text-red-400">
        {eyebrow}
      </span>
      <h2 className={`text-3xl font-extrabold md:text-4xl ${dark ? "text-stone-900" : "text-amber-50"}`}>{title}</h2>
      {sub ? (
        <p className={`mt-4 leading-relaxed ${dark ? "text-stone-600" : "text-stone-400"}`}>{sub}</p>
      ) : null}
    </div>
  );
}

type ReservationErrors = Partial<Record<"name" | "phone" | "date" | "time" | "guests", string>>;

/* ---------------------------------- الصفحة ---------------------------------- */

export default function MandiPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("mandi");
  const [activeBranch, setActiveBranch] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [slide, setSlide] = useState(0);

  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", guests: "2" });
  const [errors, setErrors] = useState<ReservationErrors>({});
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slide]);

  const category = menuCategories.find((c) => c.key === activeCategory) ?? menuCategories[0];
  const branch = branches[activeBranch];

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleReservation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: ReservationErrors = {};
    if (form.name.trim().length < 3) {
      next.name = "يرجى إدخال الاسم الكامل (ثلاثة أحرف على الأقل)";
    }
    if (!/^05\d{8}$/.test(form.phone.trim())) {
      next.phone = "يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05 ويتكون من 10 أرقام";
    }
    if (!form.date) {
      next.date = "يرجى اختيار تاريخ الحجز";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.date) < today) {
        next.date = "لا يمكن الحجز في تاريخ سابق";
      }
    }
    if (!form.time) {
      next.time = "يرجى اختيار وقت الحجز";
    }
    const guests = Number(form.guests);
    if (!form.guests || Number.isNaN(guests) || guests < 1 || guests > 30) {
      next.guests = "عدد الضيوف يجب أن يكون بين 1 و 30 (للمجموعات الأكبر اتصل بنا)";
    }
    setErrors(next);
    if (Object.values(next).every((v) => !v)) {
      setConfirmed(true);
    }
  };

  const goPrev = () => setSlide((s) => (s - 1 + testimonials.length) % testimonials.length);
  const goNext = () => setSlide((s) => (s + 1) % testimonials.length);

  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-200">
      {/* ----------------------------- شريط التنقل ----------------------------- */}
      <header className="sticky top-0 z-50 border-b border-red-900/30 bg-stone-950/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#home" className="flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-700 to-orange-700 text-2xl shadow-lg shadow-red-900/40">
              🍛
            </span>
            <span>
              <span className="block text-xl font-extrabold leading-tight text-amber-50">بيت المندي</span>
              <span className="block text-[11px] font-semibold text-orange-400">مذاق حضرموت الأصيل</span>
            </span>
          </a>

          <ul className="hidden items-center gap-5 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-semibold text-stone-300 transition-colors hover:text-orange-400"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href="#reservation"
              className="hidden rounded-full bg-gradient-to-l from-red-700 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/30 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:block"
            >
              احجز طاولتك
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-stone-700 lg:hidden"
              aria-label="القائمة"
              aria-expanded={menuOpen}
            >
              <span
                className={`h-0.5 w-5 bg-amber-50 transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span className={`h-0.5 w-5 bg-amber-50 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span
                className={`h-0.5 w-5 bg-amber-50 transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </nav>

        {menuOpen ? (
          <ul className="border-t border-stone-800 bg-stone-950 px-4 py-3 lg:hidden">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 font-semibold text-stone-300 transition-colors hover:bg-stone-900 hover:text-orange-400"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {/* ----------------------------- البطل ----------------------------- */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-b from-red-950 via-stone-950 to-stone-950"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-red-700/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 -left-20 h-72 w-72 rounded-full bg-orange-600/15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-bold text-orange-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
              على حطب السمر منذ 1962
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-amber-50 md:text-5xl lg:text-6xl">
              مندي يُطهى بالجمر
              <span className="block bg-gradient-to-l from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">
                ويُقدَّم بالكرم
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-400">
              من حفرة الحطب إلى سفرتك، نطهو المندي والحنيذ والمظبي على الطريقة الحضرمية الأصيلة: ذبائح طازجة، بهارات
              تتوارثها الأجيال، وصبر ست ساعات كاملة حتى يذوب اللحم على أرز يفوح بعبق السمر.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#menu"
                className="rounded-full bg-gradient-to-l from-red-700 to-orange-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-red-900/40 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                استعرض القائمة
              </a>
              <a
                href="#reservation"
                className="rounded-full border-2 border-orange-500/60 px-8 py-3.5 font-bold text-orange-300 transition-colors hover:bg-orange-500 hover:text-stone-950"
              >
                احجز طاولة
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              {[
                { num: "60+", label: "عاماً من الأصالة" },
                { num: "3", label: "فروع في المملكة" },
                { num: "4.8 ★", label: "تقييم الضيوف" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-extrabold text-orange-400">{s.num}</div>
                  <div className="text-sm text-stone-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative rounded-[2.5rem] bg-gradient-to-br from-red-800 via-red-900 to-stone-900 p-1 shadow-2xl shadow-red-950/60">
              <div className="rounded-[2.3rem] bg-stone-950/60 p-8 text-center backdrop-blur">
                <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-t from-orange-600/30 to-transparent blur-xl" />
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-700 text-7xl shadow-inner">
                    🍛
                  </div>
                  <span className="absolute -top-1 right-2 animate-bounce text-3xl">💨</span>
                </div>
                <div className="mt-5 text-sm font-bold text-orange-400">طبق اليوم</div>
                <div className="mt-1 text-2xl font-extrabold text-amber-50">مندي لحم حضرمي</div>
                <p className="mt-2 text-sm text-stone-400">يُفتح من حفرة الحطب يومياً الساعة 12 ظهراً</p>
                <div className="mt-5 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-orange-400">6</div>
                    <div className="text-xs text-stone-500">ساعات طهي</div>
                  </div>
                  <div className="h-8 w-px bg-stone-700" />
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-orange-400">68 ر.س</div>
                    <div className="text-xs text-stone-500">للوجبة الكاملة</div>
                  </div>
                  <div className="h-8 w-px bg-stone-700" />
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-orange-400">100٪</div>
                    <div className="text-xs text-stone-500">ذبح محلي طازج</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-5 py-3 text-stone-900 shadow-xl">
              <span className="text-2xl">🔥</span>
              <span>
                <span className="block text-xs text-stone-500">الطهي اليوم على</span>
                <span className="block text-sm font-extrabold">حطب سمر نجدي</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- قصتنا ----------------------------- */}
      <section id="story" className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative order-2 md:order-1">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🏜️", label: "بدأنا في خيمة على طريق المسافرين" },
                { icon: "🪵", label: "حطب السمر سرّ النكهة منذ اليوم الأول" },
                { icon: "👨‍🍳", label: "ثلاثة أجيال من الطهاة الحضارمة" },
                { icon: "🏆", label: "أفضل مطعم تراثي بالمملكة 2024" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border border-stone-800 bg-stone-900/60 p-6 text-center transition-all hover:-translate-y-1 hover:border-orange-500/40 ${
                    i % 2 === 1 ? "mt-6" : ""
                  }`}
                >
                  <div className="text-4xl">{item.icon}</div>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-stone-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <span className="mb-3 inline-block rounded-full bg-red-800/15 px-4 py-1 text-sm font-bold text-red-400">
              حكاية بيت المندي
            </span>
            <h2 className="text-3xl font-extrabold text-amber-50 md:text-4xl">من خيمة على طريق المسافرين إلى بيتٍ لكل ضيف</h2>
            <p className="mt-6 leading-loose text-stone-400">
              في عام 1962، نصب الجد سالم باهارون خيمته الصغيرة على طريق المسافرين، وحفر أول حفرة مندي وأشعل فيها حطب
              السمر. كان يقدّم المندي للمسافرين بلا لوحة ولا إعلان، فصار عابرو الطريق يتواصون: قفوا عند بيت المندي.
              اليوم، وبعد ثلاثة أجيال، ما زلنا نطهو بالطريقة نفسها: حفرة وجمر وصبر طويل، وما زال كل ضيف يدخل أبوابنا
              يُستقبل كما كان يُستقبل المسافرون في خيمة الجد: بالقهوة والتمر وترحيبة من القلب.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#cooking"
                className="rounded-full bg-stone-800 px-6 py-3 font-bold text-amber-50 transition-colors hover:bg-red-800"
              >
                شاهد طريقتنا في الطهي
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- القائمة ----------------------------- */}
      <section id="menu" className="bg-gradient-to-b from-stone-950 via-red-950/30 to-stone-950 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="قائمة الطعام"
            title="أطباق من حفرة الحطب مباشرة"
            sub="كل طبق يُحضّر يومياً بمكونات طازجة، والكميات محدودة بعدد الذبائح، فاحجز طبقك مبكراً."
          />
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {menuCategories.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`flex items-center gap-2 rounded-full px-6 py-3 font-bold transition-all ${
                  activeCategory === c.key
                    ? "bg-gradient-to-l from-red-700 to-orange-600 text-white shadow-lg shadow-red-900/40"
                    : "bg-stone-900 text-stone-400 ring-1 ring-stone-800 hover:text-orange-300 hover:ring-orange-500/40"
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {category.dishes.map((dish) => (
              <div
                key={dish.name}
                className="group relative flex gap-5 rounded-2xl border border-stone-800 bg-stone-900/70 p-6 transition-all hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl hover:shadow-red-950/40"
              >
                {dish.popular ? (
                  <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-l from-amber-500 to-orange-600 px-3 py-1 text-xs font-extrabold text-stone-950">
                    الأكثر طلباً ⭐
                  </span>
                ) : null}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-900/60 to-orange-900/40 text-4xl transition-transform group-hover:scale-110">
                  {dish.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-extrabold text-amber-50">{dish.name}</h3>
                    <span className="whitespace-nowrap text-lg font-extrabold text-orange-400">
                      {dish.price} <span className="text-xs font-medium text-stone-500">ر.س</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">{dish.desc}</p>
                  <div className="mt-3">
                    <SpiceLevel level={dish.spice} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- كيف نطبخ ----------------------------- */}
      <section id="cooking" className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="طريقتنا"
          title="رحلة ست ساعات من الجمر إلى السفرة"
          sub="اضغط على أي خطوة لتتعرف على تفاصيلها — هكذا نطبخ كل يوم منذ أكثر من ستين عاماً."
        />
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-row flex-wrap justify-center gap-3 lg:flex-col">
            {cookingSteps.map((step, i) => (
              <button
                key={step.title}
                onClick={() => setActiveStep(i)}
                className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-right transition-all ${
                  activeStep === i
                    ? "border-orange-500/60 bg-gradient-to-l from-red-900/50 to-stone-900 shadow-lg shadow-red-950/40"
                    : "border-stone-800 bg-stone-900/50 hover:border-orange-500/30"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                    activeStep === i ? "bg-orange-500 text-stone-950" : "bg-stone-800 text-stone-400"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`font-bold ${activeStep === i ? "text-amber-50" : "text-stone-400"}`}>
                  {step.title}
                </span>
              </button>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-900 to-red-950/40 p-10">
            <div aria-hidden className="absolute -bottom-8 -left-8 text-[10rem] opacity-10">
              {cookingSteps[activeStep].icon}
            </div>
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-700 text-5xl shadow-lg shadow-red-950/50">
                {cookingSteps[activeStep].icon}
              </div>
              <div className="mt-6 text-sm font-bold text-orange-400">
                الخطوة {activeStep + 1} من {cookingSteps.length}
              </div>
              <h3 className="mt-2 text-2xl font-extrabold text-amber-50">{cookingSteps[activeStep].title}</h3>
              <p className="mt-4 max-w-xl text-lg leading-loose text-stone-300">{cookingSteps[activeStep].desc}</p>
              <div className="mt-8 flex gap-2">
                {cookingSteps.map((s, i) => (
                  <span
                    key={s.title}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeStep ? "w-10 bg-orange-500" : "w-4 bg-stone-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- الفروع ----------------------------- */}
      <section id="branches" className="bg-gradient-to-b from-stone-950 via-red-950/20 to-stone-950 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="فروعنا"
            title="أقرب بيت مندي إليك"
            sub="ثلاثة فروع في المملكة، وكلها تطبخ في حفرة حطب حقيقية — اختر مدينتك."
          />
          <div className="mb-8 flex justify-center gap-3">
            {branches.map((b, i) => (
              <button
                key={b.city}
                onClick={() => setActiveBranch(i)}
                className={`rounded-full px-7 py-3 font-bold transition-all ${
                  activeBranch === i
                    ? "bg-gradient-to-l from-red-700 to-orange-600 text-white shadow-lg shadow-red-900/40"
                    : "bg-stone-900 text-stone-400 ring-1 ring-stone-800 hover:text-orange-300"
                }`}
              >
                {b.city}
              </button>
            ))}
          </div>
          <div className="grid overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/70 md:grid-cols-2">
            <div className="relative flex min-h-64 items-center justify-center bg-gradient-to-br from-red-900/50 via-stone-900 to-orange-900/30 p-10">
              <div aria-hidden className="absolute inset-0 opacity-20">
                <div className="absolute top-8 right-10 text-5xl">🕌</div>
                <div className="absolute bottom-10 left-12 text-5xl">🌴</div>
                <div className="absolute top-1/2 left-1/3 text-4xl">🏙️</div>
              </div>
              <div className="relative text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-700 text-5xl shadow-xl shadow-red-950/50">
                  📍
                </div>
                <div className="mt-4 text-3xl font-extrabold text-amber-50">{branch.city}</div>
                <div className="mt-1 font-semibold text-orange-300">{branch.name}</div>
              </div>
            </div>
            <div className="space-y-5 p-8 md:p-10">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-xl">
                  🗺️
                </span>
                <div>
                  <div className="text-sm font-bold text-orange-400">العنوان</div>
                  <p className="mt-1 leading-relaxed text-stone-300">{branch.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-xl">
                  🕐
                </span>
                <div>
                  <div className="text-sm font-bold text-orange-400">ساعات العمل</div>
                  <p className="mt-1 text-stone-300">{branch.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-xl">
                  📞
                </span>
                <div>
                  <div className="text-sm font-bold text-orange-400">للتواصل والحجز</div>
                  <p className="mt-1 font-bold text-stone-200" dir="ltr">
                    {branch.phone}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 px-5 py-4 text-sm font-semibold text-orange-200">
                ✨ {branch.note}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- آراء الضيوف ----------------------------- */}
      <section id="testimonials" className="mx-auto max-w-4xl px-4 py-20">
        <SectionHeading eyebrow="آراء ضيوفنا" title="كلام من قلب السفرة" />
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-900 to-red-950/30">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(${slide * 100}%)` }}
            >
              {testimonials.map((t) => (
                <figure key={t.name} className="w-full shrink-0 px-8 py-12 text-center md:px-16">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-700 text-2xl font-extrabold text-white shadow-lg">
                    {t.name.charAt(0)}
                  </div>
                  <Stars count={t.stars} />
                  <blockquote className="mx-auto mt-6 max-w-2xl text-lg leading-loose text-stone-300">
                    «{t.text}»
                  </blockquote>
                  <figcaption className="mt-6">
                    <span className="block font-extrabold text-amber-50">{t.name}</span>
                    <span className="mt-1 block text-sm text-orange-400">ضيف من {t.city}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <button
            onClick={goPrev}
            aria-label="الرأي السابق"
            className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-stone-800/90 text-amber-50 shadow-lg transition-all hover:bg-orange-600 md:-right-5"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <button
            onClick={goNext}
            aria-label="الرأي التالي"
            className="absolute top-1/2 left-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-stone-800/90 text-amber-50 shadow-lg transition-all hover:bg-orange-600 md:-left-5"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          <div className="mt-6 flex justify-center gap-2.5">
            {testimonials.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setSlide(i)}
                aria-label={`الانتقال إلى الرأي ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  slide === i ? "w-8 bg-orange-500" : "w-2.5 bg-stone-700 hover:bg-stone-500"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- الحجز ----------------------------- */}
      <section id="reservation" className="bg-gradient-to-b from-stone-950 via-red-950/30 to-stone-950 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionHeading
            eyebrow="احجز طاولتك"
            title="مكانك على السفرة بانتظارك"
            sub="املأ النموذج وسيتصل بك فريق الفرع خلال ساعة لتأكيد الحجز نهائياً."
          />
          <div className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/70">
            {confirmed ? (
              <div className="px-8 py-16 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-4xl shadow-lg shadow-emerald-900/40">
                  ✓
                </div>
                <h3 className="mt-6 text-2xl font-extrabold text-amber-50">تم استلام طلب الحجز بنجاح!</h3>
                <p className="mx-auto mt-3 max-w-md leading-relaxed text-stone-400">
                  شكراً لك يا {form.name.trim()}. حجزك لعدد {form.guests} ضيوف بتاريخ {form.date} الساعة {form.time} قيد
                  التأكيد، وسنتصل بك على الرقم <span dir="ltr">{form.phone}</span> خلال ساعة.
                </p>
                <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-5 py-2.5 text-sm font-bold text-orange-300">
                  🍛 جهّزنا لك القهوة والتمر للاستقبال
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => {
                      setConfirmed(false);
                      setForm({ name: "", phone: "", date: "", time: "", guests: "2" });
                    }}
                    className="rounded-full bg-stone-800 px-7 py-3 font-bold text-amber-50 transition-colors hover:bg-red-800"
                  >
                    إجراء حجز آخر
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReservation} noValidate className="grid gap-6 p-8 md:grid-cols-2 md:p-10">
                <div>
                  <label htmlFor="res-name" className="mb-2 block text-sm font-bold text-stone-300">
                    الاسم الكامل
                  </label>
                  <input
                    id="res-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="مثال: سالم أحمد باهارون"
                    className={`w-full rounded-xl border bg-stone-950 px-4 py-3.5 text-amber-50 placeholder-stone-600 outline-none transition-colors focus:border-orange-500 ${
                      errors.name ? "border-red-500" : "border-stone-700"
                    }`}
                  />
                  {errors.name ? <p className="mt-2 text-sm font-semibold text-red-400">{errors.name}</p> : null}
                </div>
                <div>
                  <label htmlFor="res-phone" className="mb-2 block text-sm font-bold text-stone-300">
                    رقم الجوال
                  </label>
                  <input
                    id="res-phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="05XXXXXXXX"
                    className={`w-full rounded-xl border bg-stone-950 px-4 py-3.5 text-amber-50 placeholder-stone-600 outline-none transition-colors focus:border-orange-500 ${
                      errors.phone ? "border-red-500" : "border-stone-700"
                    }`}
                  />
                  {errors.phone ? <p className="mt-2 text-sm font-semibold text-red-400">{errors.phone}</p> : null}
                </div>
                <div>
                  <label htmlFor="res-date" className="mb-2 block text-sm font-bold text-stone-300">
                    تاريخ الحجز
                  </label>
                  <input
                    id="res-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className={`w-full rounded-xl border bg-stone-950 px-4 py-3.5 text-amber-50 outline-none transition-colors focus:border-orange-500 ${
                      errors.date ? "border-red-500" : "border-stone-700"
                    }`}
                  />
                  {errors.date ? <p className="mt-2 text-sm font-semibold text-red-400">{errors.date}</p> : null}
                </div>
                <div>
                  <label htmlFor="res-time" className="mb-2 block text-sm font-bold text-stone-300">
                    وقت الحجز
                  </label>
                  <select
                    id="res-time"
                    value={form.time}
                    onChange={(e) => updateField("time", e.target.value)}
                    className={`w-full rounded-xl border bg-stone-950 px-4 py-3.5 text-amber-50 outline-none transition-colors focus:border-orange-500 ${
                      errors.time ? "border-red-500" : "border-stone-700"
                    }`}
                  >
                    <option value="">اختر الوقت</option>
                    {["12:30 ظهراً", "1:30 ظهراً", "2:30 ظهراً", "7:00 مساءً", "8:30 مساءً", "10:00 مساءً", "11:30 مساءً"].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      )
                    )}
                  </select>
                  {errors.time ? <p className="mt-2 text-sm font-semibold text-red-400">{errors.time}</p> : null}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="res-guests" className="mb-2 block text-sm font-bold text-stone-300">
                    عدد الضيوف
                  </label>
                  <input
                    id="res-guests"
                    type="number"
                    min={1}
                    max={30}
                    value={form.guests}
                    onChange={(e) => updateField("guests", e.target.value)}
                    className={`w-full rounded-xl border bg-stone-950 px-4 py-3.5 text-amber-50 outline-none transition-colors focus:border-orange-500 md:w-1/2 ${
                      errors.guests ? "border-red-500" : "border-stone-700"
                    }`}
                  />
                  {errors.guests ? <p className="mt-2 text-sm font-semibold text-red-400">{errors.guests}</p> : null}
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-gradient-to-l from-red-700 to-orange-600 py-4 text-lg font-extrabold text-white shadow-lg shadow-red-900/40 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99]"
                  >
                    أرسل طلب الحجز
                  </button>
                  <p className="mt-3 text-center text-xs text-stone-500">
                    الحجز مجاني تماماً، وتُحفظ الطاولة لمدة 15 دقيقة من الموعد المحدد.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------- التوصيل ----------------------------- */}
      <section id="delivery" className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="نوصل لباب بيتك"
          title="المندي الساخن أينما كنت"
          sub="نغلّف أطباقنا في عبوات حرارية خاصة تحفظ السخونة والنكهة، واطلبنا عبر تطبيقك المفضل."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {deliveryApps.map((app) => (
            <div
              key={app.name}
              className="group cursor-pointer rounded-2xl border border-stone-800 bg-stone-900/70 p-7 text-center transition-all hover:-translate-y-1.5 hover:border-orange-500/40 hover:shadow-xl hover:shadow-red-950/30"
            >
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} text-3xl shadow-lg transition-transform group-hover:scale-110`}
              >
                {app.icon}
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-amber-50">{app.name}</h3>
              <p className="mt-1 text-sm text-stone-500">متوسط وقت التوصيل</p>
              <p className="mt-0.5 text-sm font-bold text-orange-400">{app.time}</p>
              <span className="mt-4 inline-block rounded-full bg-stone-800 px-4 py-1.5 text-xs font-bold text-stone-300 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                اطلب الآن
              </span>
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-6 py-4 text-center text-sm font-semibold text-orange-200">
          🚚 توصيل مجاني للطلبات فوق 150 ريالاً ضمن نطاق 10 كيلومترات من أي فرع
        </p>
      </section>

      {/* ----------------------------- التذييل ----------------------------- */}
      <footer className="border-t border-red-900/30 bg-stone-950 pt-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-700 to-orange-700 text-2xl">
                🍛
              </span>
              <span>
                <span className="block text-xl font-extrabold text-amber-50">بيت المندي</span>
                <span className="block text-[11px] font-semibold text-orange-400">مذاق حضرموت الأصيل</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-500">
              ثلاثة أجيال من الطهي على حطب السمر، وحفرة مندي تشتعل كل فجر لتقدّم لكم أصدق نكهات الموروث الحضرمي
              والخليجي.
            </p>
            <div className="mt-5 flex gap-3">
              {["𝕏", "📷", "🎵"].map((icon) => (
                <span
                  key={icon}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-stone-900 transition-colors hover:bg-red-800"
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 font-extrabold text-amber-50">روابط سريعة</h3>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-stone-500 transition-colors hover:text-orange-400">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-extrabold text-amber-50">ساعات العمل</h3>
            <ul className="space-y-3 text-sm text-stone-500">
              <li className="flex justify-between gap-4">
                <span>السبت – الخميس</span>
                <span className="font-bold text-stone-300">11 ظهراً – 2 ليلاً</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>الجمعة</span>
                <span className="font-bold text-stone-300">1:30 ظهراً – 2 ليلاً</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>فتح حفرة المندي</span>
                <span className="font-bold text-orange-400">12 ظهراً يومياً</span>
              </li>
              <li className="mt-2 rounded-xl bg-stone-900 px-4 py-3 text-xs leading-relaxed">
                في رمضان: من بعد المغرب حتى السحور، مع بوفيه إفطار خاص.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-extrabold text-amber-50">تواصل معنا</h3>
            <ul className="space-y-3 text-sm text-stone-500">
              <li className="flex items-center gap-2">
                <span>📞</span> <span dir="ltr">9200 12345</span> (رقم موحد)
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span> guests@baytalmandi.sa
              </li>
              <li className="flex items-center gap-2">
                <span>🏢</span> الإدارة العامة: الرياض، حي النخيل
              </li>
              <li className="flex items-center gap-2">
                <span>🎉</span> قسم خاص لحجوزات المناسبات والولائم
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-900 py-6 text-center text-sm text-stone-600">
          جميع الحقوق محفوظة لمطاعم بيت المندي © 2026 — من حفرة الحطب إلى سفرتك بكل حب
        </div>
      </footer>

      {/* ----------------------------- شارة جميع الصفحات ----------------------------- */}
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-stone-900/90 px-4 py-2.5 text-sm font-bold text-amber-50 shadow-xl ring-1 ring-stone-700 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-red-800"
      >
        <span>🗂️</span> جميع الصفحات
      </Link>
    </div>
  );
}
