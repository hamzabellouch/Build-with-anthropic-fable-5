"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ---------------------------------- البيانات ---------------------------------- */

type RoastKey = "light" | "medium" | "dark";

const roastLevels: {
  key: RoastKey;
  label: string;
  productName: string;
  origin: string;
  notes: string[];
  price: number;
  desc: string;
  gradient: string;
}[] = [
  {
    key: "light",
    label: "تحميصة فاتحة",
    productName: "إثيوبيا يرغاتشيف",
    origin: "مرتفعات يرغاتشيف – إثيوبيا",
    notes: ["توت بري", "ياسمين", "حمضيات منعشة"],
    price: 89,
    desc: "تحميصة فاتحة تُبرز الحموضة الزاهية والنكهات الزهرية التي تشتهر بها البُن الإثيوبية، مثالية لعشاق القهوة المقطّرة.",
    gradient: "from-amber-300 to-amber-500",
  },
  {
    key: "medium",
    label: "تحميصة وسط",
    productName: "كولومبيا هويلا",
    origin: "مزارع هويلا – كولومبيا",
    notes: ["كراميل", "شوكولاتة بالحليب", "بندق محمّص"],
    price: 79,
    desc: "توازن مثالي بين الحلاوة والقوام، تحميصة وسط تناسب جميع طرق التحضير وتُرضي كل الأذواق على مدار اليوم.",
    gradient: "from-amber-600 to-orange-700",
  },
  {
    key: "dark",
    label: "تحميصة داكنة",
    productName: "سومطرة ماندلينغ",
    origin: "جزيرة سومطرة – إندونيسيا",
    notes: ["شوكولاتة داكنة", "توابل دافئة", "قوام كثيف"],
    price: 75,
    desc: "تحميصة داكنة جريئة بقوام ممتلئ ومرارة لطيفة، خيار العاشقين للإسبريسو والقهوة مع الحليب.",
    gradient: "from-stone-700 to-stone-900",
  },
];

const brewMethods = [
  {
    key: "dallah",
    label: "دلة عربية",
    icon: "☕",
    grind: "ناعمة جداً",
    ratio: "1 : 12",
    time: "15 – 20 دقيقة",
    steps: [
      "أضف الماء إلى الدلة واتركه حتى يغلي على نار هادئة.",
      "أضف البُن المطحون ناعماً مع الهيل المهروش واترك المزيج يغلي برفق.",
      "خفّف النار واترك القهوة تتخمّر لمدة عشر دقائق دون تحريك.",
      "أضف الزعفران وقليلاً من ماء الورد حسب الرغبة.",
      "صفِّ القهوة في دلة التقديم وقدّمها في فناجين صغيرة مع التمر.",
    ],
  },
  {
    key: "v60",
    label: "V60",
    icon: "⏳",
    grind: "متوسطة الخشونة",
    ratio: "1 : 16",
    time: "3 دقائق تقريباً",
    steps: [
      "ضع الفلتر الورقي واشطفه بالماء الساخن لإزالة طعم الورق وتسخين الأداة.",
      "أضف 15 غراماً من البُن المطحون وسوِّ السطح بلطف.",
      "اسكب 45 مل من الماء بحرارة 93 درجة وانتظر 30 ثانية للإزهار.",
      "أكمل السكب بحركات دائرية بطيئة حتى تصل إلى 240 مل.",
      "انتظر اكتمال التقطير ثم قدّم القهوة فوراً واستمتع بالنكهات الزاهية.",
    ],
  },
  {
    key: "espresso",
    label: "إسبريسو",
    icon: "🔥",
    grind: "ناعمة",
    ratio: "1 : 2",
    time: "25 – 30 ثانية",
    steps: [
      "اطحن 18 غراماً من البُن طحنة ناعمة مخصصة للإسبريسو.",
      "وزّع البُن في الفلتر بالتساوي ثم اكبسه بضغط ثابت ومستوٍ.",
      "ثبّت الذراع في المكينة وابدأ الاستخلاص مباشرة.",
      "استهدف 36 غراماً من الإسبريسو خلال 25 إلى 30 ثانية.",
      "راقب لون الكريما الذهبية وعدّل الطحنة إن كان الاستخلاص سريعاً أو بطيئاً.",
    ],
  },
  {
    key: "coldbrew",
    label: "كولد برو",
    icon: "🧊",
    grind: "خشنة",
    ratio: "1 : 8",
    time: "12 – 16 ساعة",
    steps: [
      "اطحن 100 غرام من البُن طحنة خشنة تشبه ملح البحر.",
      "أضف البُن إلى 800 مل من الماء البارد في وعاء زجاجي محكم.",
      "حرّك المزيج برفق وتأكد من تشبّع كامل البُن بالماء.",
      "ضع الوعاء في الثلاجة لمدة 12 إلى 16 ساعة.",
      "صفِّ المركّز عبر فلتر قماشي وخفّفه بالماء أو الحليب عند التقديم.",
    ],
  },
];

const products = [
  {
    id: 1,
    name: "يرغاتشيف الفاخرة",
    origin: "إثيوبيا",
    notes: "توت، ياسمين، عسل",
    price: 89,
    emoji: "🫘",
    badge: "الأكثر مبيعاً",
  },
  {
    id: 2,
    name: "هويلا المتوازنة",
    origin: "كولومبيا",
    notes: "كراميل، بندق، كاكاو",
    price: 79,
    emoji: "🌄",
    badge: null,
  },
  {
    id: 3,
    name: "خولاني يمني أصيل",
    origin: "اليمن",
    notes: "فواكه مجففة، توابل، عنب",
    price: 129,
    emoji: "🏔️",
    badge: "إصدار محدود",
  },
  {
    id: 4,
    name: "ماندلينغ الداكنة",
    origin: "إندونيسيا",
    notes: "شوكولاتة داكنة، أرز محمّص",
    price: 75,
    emoji: "🌋",
    badge: null,
  },
  {
    id: 5,
    name: "خلطة الدلة الملكية",
    origin: "خلطة خاصة",
    notes: "هيل، زعفران، قرنفل",
    price: 95,
    emoji: "👑",
    badge: "اختيار المحمّص",
  },
  {
    id: 6,
    name: "بوروندي المشمسة",
    origin: "بوروندي",
    notes: "برتقال، كرز، سكر بني",
    price: 85,
    emoji: "☀️",
    badge: null,
  },
];

const subscriptionPlans = [
  {
    name: "المستكشف",
    desc: "كيس واحد شهرياً من اختيار المحمّص",
    monthly: 79,
    features: ["250 غرام شهرياً", "بطاقة تذوّق مع كل كيس", "شحن مجاني", "إيقاف الاشتراك في أي وقت"],
    highlighted: false,
  },
  {
    name: "العاشق",
    desc: "كيسان شهرياً من محاصيل مختارة",
    monthly: 149,
    features: ["500 غرام شهرياً", "محاصيل موسمية نادرة", "خصم 10٪ على المتجر", "هدية ترحيبية مع أول صندوق"],
    highlighted: true,
  },
  {
    name: "المحمصة",
    desc: "ثلاثة أكياس شهرياً مع امتيازات حصرية",
    monthly: 219,
    features: ["750 غرام شهرياً", "وصول مبكر للإصدارات المحدودة", "جلسة تذوّق افتراضية شهرية", "خصم 15٪ على أدوات التحضير"],
    highlighted: false,
  },
];

const faqs = [
  {
    q: "متى يتم تحميص البُن الذي أطلبه؟",
    a: "نحمّص جميع الطلبات يومي الأحد والأربعاء من كل أسبوع، ونشحنها في اليوم نفسه. ستجد تاريخ التحميص مطبوعاً على كل كيس لتستمتع بالقهوة في ذروة نضارتها.",
  },
  {
    q: "كم تستغرق مدة التوصيل؟",
    a: "نوصّل خلال يوم إلى يومي عمل داخل المدن الرئيسية، ومن ثلاثة إلى خمسة أيام لبقية المناطق. الشحن مجاني للطلبات التي تتجاوز 150 ريالاً.",
  },
  {
    q: "هل تطحنون البُن قبل الشحن؟",
    a: "نعم، يمكنك اختيار درجة الطحنة المناسبة لطريقة تحضيرك عند إتمام الطلب، لكننا ننصح دائماً بشراء حبوب كاملة وطحنها قبل التحضير مباشرة للحصول على أفضل نكهة.",
  },
  {
    q: "ما أفضل طريقة لتخزين القهوة؟",
    a: "احفظ الكيس محكم الإغلاق في مكان بارد وجاف بعيداً عن أشعة الشمس والرطوبة. تجنّب وضع القهوة في الثلاجة، واستهلكها خلال شهر من تاريخ التحميص للاستمتاع بأفضل النكهات.",
  },
  {
    q: "هل يمكنني تعديل اشتراكي أو إيقافه؟",
    a: "بالتأكيد، يمكنك تغيير الخطة أو تخطي شهر أو إلغاء الاشتراك في أي وقت من حسابك دون أي رسوم إضافية أو شروط مقيّدة.",
  },
  {
    q: "هل تقدمون قهوة منزوعة الكافيين؟",
    a: "نعم، نوفّر محصولاً كولومبياً منزوع الكافيين بطريقة سويسرية مائية طبيعية تحافظ على النكهات كاملة، ويتوفر ضمن قسم المتجر بشكل دائم.",
  },
];

const testimonials = [
  {
    name: "عبدالله الحربي",
    title: "مهندس برمجيات – الرياض",
    text: "منذ أن جرّبت يرغاتشيف من بُن لم أعد أستطيع شرب قهوة أخرى. النضارة واضحة من أول رشفة، وبطاقات التذوق علّمتني الكثير عن عالم القهوة المختصة.",
    stars: 5,
  },
  {
    name: "نورة العتيبي",
    title: "صاحبة مقهى – جدة",
    text: "أعتمد على خلطة الدلة الملكية في مقهاي منذ سنة كاملة. ضيوفي يسألون دائماً عن سر النكهة، والجواب ببساطة: بُن.",
    stars: 5,
  },
  {
    name: "فهد القحطاني",
    title: "مصوّر فوتوغرافي – الدمام",
    text: "اشتراك العاشق غيّر صباحاتي تماماً. كل شهر أكتشف محصولاً جديداً، وخدمة العملاء تتابع معي بشكل شخصي. تجربة تستحق كل ريال.",
    stars: 4,
  },
];

const navLinks = [
  { href: "#roast", label: "المحمصة" },
  { href: "#products", label: "المتجر" },
  { href: "#brew", label: "طرق التحضير" },
  { href: "#story", label: "حكايتنا" },
  { href: "#subscribe", label: "الاشتراكات" },
  { href: "#faq", label: "الأسئلة الشائعة" },
];

/* ---------------------------------- مكونات مساعدة ---------------------------------- */

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label={`تقييم ${count} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= count ? "" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <span className="mb-3 inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-extrabold text-stone-900 md:text-4xl">{title}</h2>
      {sub ? <p className="mt-4 leading-relaxed text-stone-600">{sub}</p> : null}
    </div>
  );
}

/* ---------------------------------- الصفحة ---------------------------------- */

export default function BunPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [roast, setRoast] = useState<RoastKey>("medium");
  const [brewTab, setBrewTab] = useState("dallah");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const activeRoast = roastLevels.find((r) => r.key === roast) ?? roastLevels[1];
  const activeBrew = brewMethods.find((b) => b.key === brewTab) ?? brewMethods[0];

  const getQty = (id: number) => quantities[id] ?? 1;

  const changeQty = (id: number, delta: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.min(9, Math.max(1, (prev[id] ?? 1) + delta)) }));
  };

  const addToCart = (id: number, name: string) => {
    const qty = getQty(id);
    setCartCount((c) => c + qty);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(`تمت إضافة ${qty} × ${name} إلى السلة`);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const handleNewsletter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setEmailError("صيغة البريد الإلكتروني غير صحيحة");
      return;
    }
    setEmailError(null);
    setSubscribed(true);
  };

  return (
    <div className="min-h-screen bg-[#fdf8f0] font-sans text-stone-800">
      {/* ----------------------------- شريط التنقل ----------------------------- */}
      <header className="sticky top-0 z-50 border-b border-amber-100 bg-[#fdf8f0]/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#home" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-800 text-xl text-white shadow-md">
              ☕
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-stone-900">بُن</span>
          </a>

          <ul className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-stone-600 transition-colors hover:text-amber-700"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href="#products"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg transition-transform hover:scale-105"
              aria-label="سلة التسوق"
            >
              🛒
              {cartCount > 0 ? (
                <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-xs font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-amber-200 lg:hidden"
              aria-label="القائمة"
              aria-expanded={menuOpen}
            >
              <span
                className={`h-0.5 w-5 bg-stone-800 transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span className={`h-0.5 w-5 bg-stone-800 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span
                className={`h-0.5 w-5 bg-stone-800 transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </nav>

        {menuOpen ? (
          <ul className="border-t border-amber-100 bg-[#fdf8f0] px-4 py-3 lg:hidden">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 font-medium text-stone-700 transition-colors hover:bg-amber-50 hover:text-amber-700"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {/* ----------------------------- البطل ----------------------------- */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-[#fdf8f0] to-[#fdf8f0]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-amber-300/40 to-orange-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-gradient-to-tr from-orange-300/30 to-amber-200/40 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-600" />
              محمصة قهوة مختصة منذ 2015
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-stone-900 md:text-5xl lg:text-6xl">
              قهوة تُحمَّص بشغف
              <span className="block bg-gradient-to-l from-amber-600 to-orange-700 bg-clip-text text-transparent">
                وتُروى بحكاية
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
              في بُن نختار أجود المحاصيل من مزارع العالم، ونحمّصها بعناية في قلب الرياض، لتصلك نضِرة خلال أيام من
              التحميص. من الدلة العربية إلى الإسبريسو، فنجانك المثالي يبدأ من هنا.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#products"
                className="rounded-full bg-gradient-to-l from-amber-600 to-orange-700 px-8 py-3.5 font-bold text-white shadow-lg shadow-amber-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-600/30"
              >
                تسوّق المحاصيل
              </a>
              <a
                href="#subscribe"
                className="rounded-full border-2 border-amber-600 px-8 py-3.5 font-bold text-amber-700 transition-colors hover:bg-amber-600 hover:text-white"
              >
                اشترك شهرياً
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              {[
                { num: "+40", label: "محصولاً مختاراً" },
                { num: "+25 ألف", label: "عميل سعيد" },
                { num: "48 ساعة", label: "من التحميص إلى بابك" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-extrabold text-amber-700">{s.num}</div>
                  <div className="text-sm text-stone-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-3xl bg-gradient-to-br from-amber-700 via-orange-800 to-stone-900 p-8 shadow-2xl">
              <div className="rounded-2xl bg-[#fdf8f0]/95 p-6 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-5xl shadow-inner">
                  🫘
                </div>
                <div className="text-sm font-semibold text-amber-700">محصول الموسم</div>
                <div className="mt-1 text-xl font-extrabold text-stone-900">خولاني يمني أصيل</div>
                <div className="mt-2 text-sm text-stone-500">فواكه مجففة • توابل • عنب</div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Stars count={5} />
                  <span className="text-xs text-stone-500">(312 تقييماً)</span>
                </div>
                <div className="mt-4 text-2xl font-extrabold text-orange-700">129 ر.س</div>
              </div>
              <div className="mt-5 flex items-center justify-between text-amber-100">
                <span className="text-sm">حُمّص هذا الأسبوع</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">دفعة محدودة</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-5 rounded-2xl bg-white px-5 py-3 shadow-xl">
              <div className="text-xs text-stone-500">درجة المتجر</div>
              <div className="flex items-center gap-1 font-extrabold text-stone-900">
                4.9 <span className="text-amber-400">★</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- اختيار التحميصة ----------------------------- */}
      <section id="roast" className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle
          eyebrow="جرّب بنفسك"
          title="اختر درجة التحميص المفضلة لديك"
          sub="كل درجة تحميص تفتح عالماً مختلفاً من النكهات. اختر درجتك وشاهد ترشيحنا المثالي لها."
        />
        <div className="grid items-stretch gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-4">
            {roastLevels.map((r) => (
              <button
                key={r.key}
                onClick={() => setRoast(r.key)}
                className={`group flex items-center gap-4 rounded-2xl border-2 p-5 text-right transition-all ${
                  roast === r.key
                    ? "border-amber-600 bg-amber-50 shadow-lg shadow-amber-600/10"
                    : "border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <span
                  className={`h-12 w-12 shrink-0 rounded-full bg-gradient-to-br ${r.gradient} shadow-inner transition-transform group-hover:scale-110`}
                />
                <span className="flex-1">
                  <span className="block font-extrabold text-stone-900">{r.label}</span>
                  <span className="mt-0.5 block text-sm text-stone-500">{r.notes.join(" • ")}</span>
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    roast === r.key ? "border-amber-600 bg-amber-600 text-white" : "border-stone-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-xl">
            <div className={`h-40 bg-gradient-to-br ${activeRoast.gradient} relative flex items-end p-6`}>
              <span className="absolute top-6 left-6 text-6xl opacity-40">🫘</span>
              <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-stone-800">
                {activeRoast.label}
              </span>
            </div>
            <div className="p-7">
              <h3 className="text-2xl font-extrabold text-stone-900">{activeRoast.productName}</h3>
              <p className="mt-1 text-sm font-medium text-amber-700">{activeRoast.origin}</p>
              <p className="mt-4 leading-relaxed text-stone-600">{activeRoast.desc}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {activeRoast.notes.map((n) => (
                  <span key={n} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                    {n}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-5">
                <div>
                  <span className="text-3xl font-extrabold text-orange-700">{activeRoast.price}</span>
                  <span className="mr-1 text-sm text-stone-500">ر.س / 250غ</span>
                </div>
                <a
                  href="#products"
                  className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700"
                >
                  اطلبه الآن
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- المتجر ----------------------------- */}
      <section id="products" className="bg-gradient-to-b from-amber-50/60 to-[#fdf8f0] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle
            eyebrow="متجر بُن"
            title="محاصيل الموسم الحالي"
            sub="حبوب كاملة تُحمَّص أسبوعياً وتُشحن مباشرة من محمصتنا في الرياض إلى باب منزلك."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/10"
              >
                {p.badge ? (
                  <span className="absolute top-4 left-4 rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                    {p.badge}
                  </span>
                ) : null}
                <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-200 text-5xl transition-transform group-hover:scale-110">
                  {p.emoji}
                </div>
                <h3 className="text-center text-lg font-extrabold text-stone-900">{p.name}</h3>
                <p className="mt-1 text-center text-sm font-medium text-amber-700">{p.origin}</p>
                <p className="mt-2 text-center text-sm text-stone-500">{p.notes}</p>
                <div className="mt-4 text-center text-xl font-extrabold text-orange-700">
                  {p.price} <span className="text-sm font-medium text-stone-500">ر.س</span>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                  <div className="flex items-center rounded-full border border-stone-200">
                    <button
                      onClick={() => changeQty(p.id, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-amber-700 transition-colors hover:bg-amber-50"
                      aria-label="زيادة الكمية"
                    >
                      +
                    </button>
                    <span className="w-8 text-center font-bold text-stone-800">{getQty(p.id)}</span>
                    <button
                      onClick={() => changeQty(p.id, -1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-amber-700 transition-colors hover:bg-amber-50"
                      aria-label="تقليل الكمية"
                    >
                      −
                    </button>
                  </div>
                  <button
                    onClick={() => addToCart(p.id, p.name)}
                    className="flex-1 rounded-full bg-gradient-to-l from-amber-600 to-orange-700 px-4 py-2.5 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-amber-600/25 active:scale-95"
                  >
                    أضف للسلة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- طرق التحضير ----------------------------- */}
      <section id="brew" className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle
          eyebrow="دليل التحضير"
          title="حضّر فنجانك المثالي"
          sub="اختر طريقتك المفضلة واتبع خطواتنا المجرّبة في مختبر التذوق لدينا."
        />
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {brewMethods.map((b) => (
            <button
              key={b.key}
              onClick={() => setBrewTab(b.key)}
              className={`flex items-center gap-2 rounded-full px-6 py-3 font-bold transition-all ${
                brewTab === b.key
                  ? "bg-stone-900 text-white shadow-lg"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              <span>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
        <div className="grid gap-8 rounded-3xl border border-amber-100 bg-white p-8 shadow-xl md:grid-cols-[260px_1fr] md:p-10">
          <div className="flex flex-col gap-4">
            <div className="flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 text-6xl">
              {activeBrew.icon}
            </div>
            {[
              { label: "درجة الطحن", value: activeBrew.grind },
              { label: "نسبة القهوة للماء", value: activeBrew.ratio },
              { label: "زمن التحضير", value: activeBrew.time },
            ].map((info) => (
              <div key={info.label} className="rounded-xl bg-amber-50 px-4 py-3">
                <div className="text-xs font-semibold text-amber-700">{info.label}</div>
                <div className="font-extrabold text-stone-900">{info.value}</div>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-6 text-2xl font-extrabold text-stone-900">خطوات تحضير {activeBrew.label}</h3>
            <ol className="space-y-4">
              {activeBrew.steps.map((step, i) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-700 text-sm font-extrabold text-white">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed text-stone-600">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ----------------------------- الحكاية ----------------------------- */}
      <section id="story" className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 py-20 text-amber-50">
        <div aria-hidden className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-8xl">☕</div>
          <div className="absolute bottom-10 left-10 text-8xl">🫘</div>
          <div className="absolute top-1/2 left-1/3 text-7xl">🏺</div>
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-amber-400/15 px-4 py-1.5 text-sm font-semibold text-amber-300">
            حكايتنا مع القهوة
          </span>
          <h2 className="text-3xl font-extrabold md:text-4xl">من الدلة إلى المحمصة... إرث يتجدد</h2>
          <p className="mt-6 text-lg leading-loose text-amber-100/85">
            قبل خمسة قرون، انطلقت حبوب البُن من مرتفعات اليمن لتغزو العالم، وكانت الدلة العربية شاهدة على مجالس الكرم
            وقصائد الضيافة. في بُن، نحمل هذا الإرث على عاتقنا: نحمّص كما حمّص أجدادنا بالصبر والحس، ونضيف إليه دقة
            العلم الحديث وأدوات القياس المختصة. كل كيس يخرج من محمصتنا يحمل قصة مزارع، ورحلة محصول، ولمسة محمّص يعرف
            أن الفنجان الواحد قادر على جمع القلوب.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { icon: "🌱", title: "تجارة عادلة", desc: "نشتري مباشرة من المزارعين بأسعار تفوق السوق العالمي" },
              { icon: "🔬", title: "جودة مختبرية", desc: "كل دفعة تُقيَّم بدرجة +84 وفق معايير القهوة المختصة" },
              { icon: "🏺", title: "أصالة عربية", desc: "خلطات مستوحاة من تراث الضيافة في الجزيرة العربية" },
            ].map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-amber-400/20 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="text-4xl">{v.icon}</div>
                <h3 className="mt-3 font-extrabold text-amber-200">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-100/70">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- الاشتراكات ----------------------------- */}
      <section id="subscribe" className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle
          eyebrow="اشتراك بُن"
          title="قهوتك الطازجة تصلك كل شهر"
          sub="اختر خطتك ودعنا نفاجئك بأفضل محاصيل الموسم، مع شحن مجاني وحرية الإلغاء في أي وقت."
        />
        <div className="mb-10 flex items-center justify-center gap-4">
          <span className={`font-bold transition-colors ${yearly ? "text-stone-400" : "text-stone-900"}`}>شهري</span>
          <button
            onClick={() => setYearly((v) => !v)}
            className={`relative h-8 w-16 rounded-full transition-colors ${yearly ? "bg-amber-600" : "bg-stone-300"}`}
            aria-label="تبديل الفوترة بين شهري وسنوي"
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                yearly ? "left-1" : "left-9"
              }`}
            />
          </button>
          <span className={`font-bold transition-colors ${yearly ? "text-stone-900" : "text-stone-400"}`}>
            سنوي
            <span className="mr-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
              وفّر 20٪
            </span>
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const price = yearly ? Math.round(plan.monthly * 0.8) : plan.monthly;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl p-8 transition-all hover:-translate-y-1 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-amber-600 to-orange-800 text-white shadow-2xl shadow-amber-700/30"
                    : "border border-amber-100 bg-white shadow-md hover:shadow-xl"
                }`}
              >
                {plan.highlighted ? (
                  <span className="absolute -top-3.5 right-1/2 translate-x-1/2 rounded-full bg-stone-900 px-4 py-1 text-xs font-bold text-amber-300">
                    الأكثر شيوعاً
                  </span>
                ) : null}
                <h3 className={`text-xl font-extrabold ${plan.highlighted ? "text-white" : "text-stone-900"}`}>
                  {plan.name}
                </h3>
                <p className={`mt-1 text-sm ${plan.highlighted ? "text-amber-100" : "text-stone-500"}`}>{plan.desc}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-extrabold">{price}</span>
                  <span className={`pb-1 text-sm ${plan.highlighted ? "text-amber-100" : "text-stone-500"}`}>
                    ر.س / شهرياً
                  </span>
                </div>
                {yearly ? (
                  <p className={`mt-1 text-xs ${plan.highlighted ? "text-amber-200" : "text-green-600"}`}>
                    بدلاً من {plan.monthly} ر.س — تُدفع سنوياً ({price * 12} ر.س)
                  </p>
                ) : (
                  <p className={`mt-1 text-xs ${plan.highlighted ? "text-amber-200" : "text-stone-400"}`}>
                    دون التزام، ألغِ متى شئت
                  </p>
                )}
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          plan.highlighted ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        ✓
                      </span>
                      <span className={plan.highlighted ? "text-amber-50" : "text-stone-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 rounded-full py-3 font-bold transition-all active:scale-95 ${
                    plan.highlighted
                      ? "bg-white text-orange-800 hover:bg-amber-50"
                      : "bg-stone-900 text-white hover:bg-amber-700"
                  }`}
                >
                  ابدأ الاشتراك
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------- آراء العملاء ----------------------------- */}
      <section id="testimonials" className="bg-gradient-to-b from-amber-50/60 to-[#fdf8f0] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle
            eyebrow="آراء عملائنا"
            title="فناجين تتحدث عنا"
            sub="أكثر من 25 ألف عميل يبدؤون صباحهم مع بُن. هذه بعض كلماتهم."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-amber-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <Stars count={t.stars} />
                <blockquote className="mt-4 flex-1 leading-relaxed text-stone-600">«{t.text}»</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-700 font-extrabold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-bold text-stone-900">{t.name}</span>
                    <span className="block text-xs text-stone-500">{t.title}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- الأسئلة الشائعة ----------------------------- */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <SectionTitle eyebrow="نجيبك بكل وضوح" title="الأسئلة الشائعة" />
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <div
              key={item.q}
              className={`overflow-hidden rounded-2xl border transition-colors ${
                openFaq === i ? "border-amber-300 bg-amber-50/60" : "border-stone-200 bg-white hover:border-amber-200"
              }`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-right"
                aria-expanded={openFaq === i}
              >
                <span className="font-bold text-stone-900">{item.q}</span>
                <svg
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 shrink-0 text-amber-700 transition-transform duration-300 ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  openFaq === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 leading-relaxed text-stone-600">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------- النشرة البريدية ----------------------------- */}
      <section id="newsletter" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-amber-600 via-orange-700 to-amber-800 p-10 text-center text-white md:p-14">
          <div aria-hidden className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-3xl font-extrabold md:text-4xl">انضم إلى مجلس بُن</h2>
          <p className="relative mx-auto mt-4 max-w-xl leading-relaxed text-amber-100">
            نشرة أسبوعية تحمل إليك وصفات التحضير، وأخبار المحاصيل الجديدة، وخصومات حصرية للمشتركين فقط.
          </p>
          {subscribed ? (
            <div className="relative mx-auto mt-8 max-w-md rounded-2xl bg-white/15 p-6 backdrop-blur-sm">
              <div className="text-4xl">🎉</div>
              <p className="mt-2 text-lg font-extrabold">أهلاً بك في المجلس!</p>
              <p className="mt-1 text-sm text-amber-100">
                تم تسجيل بريدك بنجاح، وستصلك أول نشرة مع قسيمة خصم 10٪ على طلبك القادم.
              </p>
            </div>
          ) : (
            <form onSubmit={handleNewsletter} noValidate className="relative mx-auto mt-8 max-w-md">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 rounded-full border-2 border-transparent bg-white px-6 py-3.5 text-stone-800 placeholder-stone-400 outline-none transition-colors focus:border-amber-300"
                  aria-label="البريد الإلكتروني"
                />
                <button
                  type="submit"
                  className="rounded-full bg-stone-900 px-8 py-3.5 font-bold text-amber-50 transition-colors hover:bg-stone-800 active:scale-95"
                >
                  اشترك الآن
                </button>
              </div>
              {emailError ? (
                <p className="mt-3 rounded-full bg-red-900/40 px-4 py-2 text-sm font-semibold text-red-100">
                  {emailError}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </section>

      {/* ----------------------------- التذييل ----------------------------- */}
      <footer className="border-t border-amber-100 bg-stone-900 pt-14 text-stone-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-800 text-xl">
                ☕
              </span>
              <span className="text-2xl font-extrabold text-white">بُن</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              محمصة قهوة مختصة سعودية، نحمّص أجود محاصيل العالم في قلب الرياض ونوصلها إليك في ذروة نضارتها.
            </p>
            <div className="mt-5 flex gap-3">
              {["𝕏", "📷", "▶️"].map((icon) => (
                <span
                  key={icon}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-stone-800 transition-colors hover:bg-amber-700"
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 font-extrabold text-white">روابط سريعة</h3>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-stone-400 transition-colors hover:text-amber-400">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-extrabold text-white">خدمة العملاء</h3>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li>سياسة الشحن والإرجاع</li>
              <li>تتبع الطلب</li>
              <li>برنامج الولاء</li>
              <li>الطلبات بالجملة للمقاهي</li>
              <li>الشروط والأحكام</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-extrabold text-white">تواصل معنا</h3>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-center gap-2">
                <span>📍</span> حي العليا، شارع التحلية، الرياض
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> <span dir="ltr">+966 11 234 5678</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span> hello@bun.coffee
              </li>
              <li className="flex items-center gap-2">
                <span>🕐</span> المحمصة مفتوحة للزوار: السبت – الخميس، 8ص – 10م
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-800 py-6 text-center text-sm text-stone-500">
          جميع الحقوق محفوظة لمحمصة بُن © 2026 — صُنع بحب وفنجان قهوة مختصة
        </div>
      </footer>

      {/* ----------------------------- إشعار السلة ----------------------------- */}
      <div
        className={`fixed bottom-24 right-4 z-50 flex items-center gap-3 rounded-2xl bg-stone-900 px-5 py-4 text-white shadow-2xl transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600">🛒</span>
        <span className="text-sm font-bold">{toast}</span>
      </div>

      {/* ----------------------------- شارة جميع الصفحات ----------------------------- */}
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-stone-900/90 px-4 py-2.5 text-sm font-bold text-amber-50 shadow-xl backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-amber-700"
      >
        <span>🗂️</span> جميع الصفحات
      </Link>
    </div>
  );
}
