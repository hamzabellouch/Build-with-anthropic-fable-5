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

function CountUp({
  target,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1600,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
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
      {prefix}
      {arNum(display.toFixed(decimals))}
      {suffix}
    </span>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 shrink-0 text-violet-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* البيانات                                                            */
/* ------------------------------------------------------------------ */

const navLinks = [
  { label: "المزايا", href: "#features" },
  { label: "التكاملات", href: "#integrations" },
  { label: "الأمان", href: "#security" },
  { label: "آراء العملاء", href: "#testimonials" },
  { label: "الأسعار", href: "#pricing" },
];

const stats = [
  { target: 4800, suffix: "+", decimals: 0, label: "شركة عربية تثق بنا" },
  { target: 12, suffix: " مليون+", decimals: 0, label: "مهمة منجزة عبر المنصة" },
  { target: 99.9, suffix: "٪", decimals: 1, label: "وقت تشغيل مضمون" },
  { target: 27, suffix: "", decimals: 0, label: "دولة يعمل فيها عملاؤنا" },
];

const integrations = [
  { icon: "💬", name: "سلاك" },
  { icon: "🐙", name: "جيت هاب" },
  { icon: "📁", name: "جوجل درايف" },
  { icon: "🎥", name: "زووم" },
  { icon: "📝", name: "نوشن" },
  { icon: "🧩", name: "جيرا" },
  { icon: "🎨", name: "فيغما" },
  { icon: "📧", name: "آوتلوك" },
  { icon: "📊", name: "إكسل" },
  { icon: "☁️", name: "أمازون ويب سيرفيسز" },
  { icon: "🗂️", name: "دروب بوكس" },
  { icon: "🤖", name: "واتساب للأعمال" },
];

const securityCards = [
  {
    icon: "🔐",
    title: "تشفير من الطراز العسكري",
    body: "تشفير AES-256 لبياناتك أثناء التخزين وTLS 1.3 أثناء النقل، مع إدارة مفاتيح معزولة بالكامل.",
  },
  {
    icon: "🏅",
    title: "شهادات الامتثال الدولية",
    body: "حاصلون على SOC 2 النوع الثاني وISO 27001، مع توافق كامل مع أنظمة حماية البيانات الخليجية.",
  },
  {
    icon: "🗄️",
    title: "نسخ احتياطي مستمر",
    body: "نسخ احتياطية مشفرة كل ساعة موزعة على ثلاث مناطق جغرافية، واستعادة كاملة خلال دقائق.",
  },
  {
    icon: "🧑‍💼",
    title: "صلاحيات دقيقة",
    body: "تحكم بمستوى الحقل الواحد: حدد من يرى وماذا يعدل، مع سجل تدقيق كامل لكل عملية.",
  },
];

const plans = [
  {
    name: "ناشئة",
    tagline: "للفرق الصغيرة التي تنطلق للتو",
    monthly: 49,
    yearly: 39,
    featured: false,
    features: [
      "حتى ١٠ أعضاء في الفريق",
      "٥ مشاريع نشطة",
      "لوحات مهام وتقويم",
      "تقارير أسبوعية أساسية",
      "دعم عبر البريد الإلكتروني",
    ],
  },
  {
    name: "نمو",
    tagline: "الخيار الأكثر شيوعاً للشركات المتوسعة",
    monthly: 129,
    yearly: 99,
    featured: true,
    features: [
      "حتى ٥٠ عضواً في الفريق",
      "مشاريع غير محدودة",
      "تحليلات متقدمة ولوحات مخصصة",
      "أتمتة سير العمل بلا حدود",
      "تكاملات كاملة مع جميع الأدوات",
      "دعم ذو أولوية على مدار الساعة",
    ],
  },
  {
    name: "مؤسسات",
    tagline: "حلول مخصصة للمؤسسات الكبرى",
    monthly: 299,
    yearly: 239,
    featured: false,
    features: [
      "أعضاء غير محدودين",
      "استضافة مخصصة داخل المنطقة",
      "تسجيل دخول موحد SSO وSCIM",
      "مدير نجاح مخصص",
      "اتفاقية مستوى خدمة ٩٩٫٩٪",
      "تدريب وتأهيل للفرق",
    ],
  },
];

const testimonials = [
  {
    quote:
      "انتقلنا إلى سحاب خلال أسبوع واحد فقط، وانخفضت الاجتماعات التنسيقية لدينا إلى النصف. اليوم يرى الجميع تقدم العمل لحظة بلحظة دون أن يسأل أحد.",
    name: "ليان الحربي",
    role: "مديرة العمليات",
    company: "شركة تمكين للتقنية",
    initials: "ل",
  },
  {
    quote:
      "التقارير التي كانت تستغرق منا يومين أصبحت تُولَّد تلقائياً كل صباح. فريق التحليلات لدينا تفرّغ أخيراً للتحليل بدل تجميع الجداول.",
    name: "عمر بن سليمان",
    role: "الرئيس التنفيذي",
    company: "مجموعة بنيان القابضة",
    initials: "ع",
  },
  {
    quote:
      "أتمتة سحاب وفرت علينا أكثر من ٣٠٠ ساعة عمل شهرياً. كل طلب جديد يتحول إلى مهام موزعة على الفريق المناسب دون تدخل بشري.",
    name: "سارة المهيري",
    role: "مديرة المنتجات",
    company: "مدى للحلول الرقمية",
    initials: "س",
  },
  {
    quote:
      "كوننا شركة خليجية، كان وجود منصة عربية بالكامل وبدعم محلي سريع نقطة تحول حقيقية. سحاب يفهم طريقة عملنا.",
    name: "خالد العتيبي",
    role: "مدير تقنية المعلومات",
    company: "نخبة للاستشارات",
    initials: "خ",
  },
];

const customerLogos = [
  "تمكين",
  "بنيان",
  "مدى للتقنية",
  "نخبة",
  "الواحة كابيتال",
  "رواد الأعمال",
];

const teamSizes = ["١ – ١٠", "١١ – ٥٠", "٥١ – ٢٠٠", "أكثر من ٢٠٠"];

/* ------------------------------------------------------------------ */
/* لوحات المزايا التفاعلية                                             */
/* ------------------------------------------------------------------ */

function PanelFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-2xl shadow-violet-950/40">
      <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/60 px-4 py-3">
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500/70" />
          <span className="h-3 w-3 rounded-full bg-amber-400/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

const projectTasks = [
  { title: "إطلاق الحملة التسويقية للربع الثالث", status: "قيد التنفيذ", color: "bg-violet-500/20 text-violet-300", progress: 65 },
  { title: "تطوير واجهة تطبيق الجوال", status: "قيد المراجعة", color: "bg-amber-500/20 text-amber-300", progress: 80 },
  { title: "ترحيل قاعدة البيانات", status: "مكتملة", color: "bg-emerald-500/20 text-emerald-300", progress: 100 },
  { title: "تحديث سياسة الخصوصية", status: "متأخرة", color: "bg-rose-500/20 text-rose-300", progress: 30 },
];

function PanelProjects() {
  return (
    <PanelFrame title="لوحة المشاريع — فريق المنتج">
      <ul className="space-y-3">
        {projectTasks.map((task) => (
          <li
            key={task.title}
            className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 transition-colors hover:border-violet-500/50"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-100">{task.title}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${task.color}`}>
                {task.status}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-l from-violet-500 to-fuchsia-500 transition-all duration-700"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <div className="mt-2 text-left text-xs text-slate-400">{arNum(task.progress)}٪</div>
          </li>
        ))}
      </ul>
    </PanelFrame>
  );
}

const chartBars = [
  { label: "محرم", value: 45 },
  { label: "صفر", value: 62 },
  { label: "ربيع ١", value: 55 },
  { label: "ربيع ٢", value: 78 },
  { label: "جمادى ١", value: 68 },
  { label: "جمادى ٢", value: 90 },
  { label: "رجب", value: 84 },
];

function PanelAnalytics() {
  return (
    <PanelFrame title="التحليلات — نظرة عامة على الأداء">
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "المهام المنجزة", value: "١٬٢٤٨", delta: "+١٨٪" },
          { label: "متوسط زمن الإنجاز", value: "٢٫٤ يوم", delta: "-١٢٪" },
          { label: "إنتاجية الفريق", value: "٩٢٪", delta: "+٧٪" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <div className="text-xs text-slate-400">{kpi.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{kpi.value}</span>
              <span className="text-xs font-semibold text-emerald-400">{kpi.delta}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex h-44 items-end justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 sm:gap-4">
        {chartBars.map((bar) => (
          <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-fuchsia-400 transition-all duration-500 hover:from-violet-500 hover:to-fuchsia-300"
              style={{ height: `${bar.value}%` }}
            />
            <span className="text-[10px] text-slate-400">{bar.label}</span>
          </div>
        ))}
      </div>
    </PanelFrame>
  );
}

function AutomationRule({ name, desc }: { name: string; desc: string }) {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
      <div>
        <div className="text-sm font-medium text-slate-100">{name}</div>
        <div className="mt-1 text-xs text-slate-400">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => setOn(!on)}
        aria-label={`تفعيل ${name}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          on ? "bg-violet-500" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${
            on ? "right-0.5" : "right-[22px]"
          }`}
        />
      </button>
    </div>
  );
}

function PanelAutomation() {
  return (
    <PanelFrame title="الأتمتة — قواعد سير العمل">
      <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 p-4 sm:flex-row sm:justify-center">
        <div className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200 ring-1 ring-violet-500/40">
          📨 وصول طلب جديد
        </div>
        <span className="text-violet-400 sm:rotate-0">←</span>
        <div className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200 ring-1 ring-violet-500/40">
          🧮 تصنيف تلقائي بالذكاء الاصطناعي
        </div>
        <span className="text-violet-400">←</span>
        <div className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200 ring-1 ring-violet-500/40">
          ✅ إسناد للفريق المناسب
        </div>
      </div>
      <div className="space-y-3">
        <AutomationRule name="تذكير قبل الموعد النهائي" desc="إرسال تنبيه للمسؤول قبل ٢٤ ساعة من استحقاق أي مهمة" />
        <AutomationRule name="تصعيد المهام المتأخرة" desc="إشعار مدير القسم تلقائياً عند تأخر مهمة أكثر من يومين" />
        <AutomationRule name="تقرير الإنجاز الأسبوعي" desc="توليد ملخص الأداء وإرساله صباح كل أحد" />
      </div>
    </PanelFrame>
  );
}

function PanelReports() {
  return (
    <PanelFrame title="التقارير — مركز التقارير الذكية">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-700/50 bg-slate-800/40 p-6">
          <div
            className="flex h-36 w-36 items-center justify-center rounded-full"
            style={{
              background:
                "conic-gradient(#8b5cf6 0% 45%, #22d3ee 45% 70%, #f472b6 70% 85%, #334155 85% 100%)",
            }}
          >
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-slate-900">
              <span className="text-lg font-bold text-white">٨٥٪</span>
              <span className="text-[10px] text-slate-400">نسبة الإنجاز</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> تطوير</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> تسويق</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-400" /> عمليات</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-600" /> متبقٍ</span>
          </div>
        </div>
        <ul className="space-y-3">
          {[
            { name: "تقرير الأداء الربعي", date: "محدّث اليوم" },
            { name: "تقرير استهلاك الموارد", date: "محدّث قبل ساعتين" },
            { name: "تقرير رضا العملاء", date: "محدّث أمس" },
            { name: "تقرير الميزانية التشغيلية", date: "محدّث هذا الأسبوع" },
          ].map((report) => (
            <li
              key={report.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 transition-colors hover:border-violet-500/50"
            >
              <div>
                <div className="text-sm font-medium text-slate-100">📄 {report.name}</div>
                <div className="mt-1 text-xs text-slate-400">{report.date}</div>
              </div>
              <button
                type="button"
                className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/30"
              >
                تصدير
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PanelFrame>
  );
}

const featureTabs = [
  {
    id: "projects",
    icon: "📋",
    label: "إدارة المشاريع",
    desc: "لوحات مرنة، مهام مترابطة، ومواعيد لا تفلت من أحد. خطط ونفّذ وتابع كل شيء من مكان واحد.",
    panel: <PanelProjects />,
  },
  {
    id: "analytics",
    icon: "📈",
    label: "التحليلات",
    desc: "مؤشرات أداء حية ولوحات قابلة للتخصيص تكشف لك أين يتقدم فريقك وأين يحتاج دعمك.",
    panel: <PanelAnalytics />,
  },
  {
    id: "automation",
    icon: "⚡",
    label: "الأتمتة",
    desc: "حوّل المهام المتكررة إلى قواعد ذكية تعمل وحدها، ووفر مئات الساعات لفريقك كل شهر.",
    panel: <PanelAutomation />,
  },
  {
    id: "reports",
    icon: "🗒️",
    label: "التقارير",
    desc: "تقارير جاهزة للمشاركة تُولَّد تلقائياً بالعربية، من ملخص الإدارة إلى تفاصيل الميزانية.",
    panel: <PanelReports />,
  },
];

/* ------------------------------------------------------------------ */
/* الصفحة الرئيسية                                                     */
/* ------------------------------------------------------------------ */

export default function SahabPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [yearly, setYearly] = useState(false);
  const [slide, setSlide] = useState(0);

  const [form, setForm] = useState({ name: "", email: "", company: "", teamSize: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % testimonials.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  const activePanel = featureTabs.find((t) => t.id === activeTab) ?? featureTabs[0];

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "يرجى إدخال الاسم الكامل";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = "يرجى إدخال بريد عمل صحيح";
    if (form.company.trim().length < 2) next.company = "يرجى إدخال اسم الشركة";
    if (!form.teamSize) next.teamSize = "يرجى اختيار حجم الفريق";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (validate()) setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500/40">
      {/* ---------------- شريط التنقل ---------------- */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-bl from-violet-500 to-fuchsia-600 text-lg shadow-lg shadow-violet-900/50">
              ☁️
            </span>
            <span className="bg-gradient-to-l from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              سحاب
            </span>
          </a>

          <ul className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-slate-300 transition-colors hover:text-violet-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <a
              href="#demo"
              className="rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold shadow-lg shadow-violet-900/40 transition-all hover:shadow-violet-700/50 hover:brightness-110"
            >
              اطلب عرضاً تجريبياً
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="فتح القائمة"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition-colors hover:border-violet-500 md:hidden"
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
          <div className="border-t border-slate-800 bg-slate-950/95 px-4 py-4 md:hidden">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-violet-500/10 hover:text-violet-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#demo"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 block rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-3 py-2.5 text-center text-sm font-bold"
                >
                  اطلب عرضاً تجريبياً
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>

      <main id="top">
        {/* ---------------- البطل ---------------- */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="pointer-events-none absolute top-40 left-0 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                منصة عربية ١٠٠٪ — مبنية للشركات في منطقتنا
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.2] sm:text-5xl lg:text-6xl">
                أدر أعمالك من
                <span className="bg-gradient-to-l from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                  {" "}السحاب{" "}
                </span>
                بذكاء وسرعة
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                سحاب يجمع إدارة المشاريع والتحليلات والأتمتة في منصة واحدة صممت خصيصاً
                للفرق العربية. خطط بوضوح، نفذ بثقة، وراقب كل شيء لحظة بلحظة.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#demo"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-7 py-3.5 text-base font-bold shadow-xl shadow-violet-900/40 transition-all hover:scale-[1.02] hover:shadow-violet-700/50"
                >
                  اطلب عرضاً تجريبياً مجانياً
                  <span className="transition-transform group-hover:-translate-x-1">←</span>
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-7 py-3.5 text-base font-bold text-slate-200 transition-all hover:border-violet-500 hover:bg-violet-500/10"
                >
                  استكشف المزايا
                </a>
              </div>
              <p className="mt-5 text-sm text-slate-400">
                ✦ تجربة مجانية ١٤ يوماً — دون بطاقة ائتمانية
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-bl from-violet-600/30 to-fuchsia-600/20 blur-2xl" />
              <div className="relative">
                <PanelFrame title="لوحة سحاب — اليوم">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "مشاريع نشطة", value: "١٨" },
                      { label: "مهام اليوم", value: "٤٢" },
                      { label: "أعضاء متصلون", value: "٢٧" },
                      { label: "تنبيهات", value: "٣" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
                        <div className="text-xs text-slate-400">{card.label}</div>
                        <div className="mt-1 text-2xl font-bold text-white">{card.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex h-24 items-end gap-2 rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
                    {[40, 65, 50, 85, 70, 95, 60, 75, 88, 55, 92, 78].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-600 to-fuchsia-400"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </PanelFrame>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- الإحصاءات ---------------- */}
        <section className="border-y border-slate-800/80 bg-slate-900/40">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="bg-gradient-to-l from-violet-300 to-fuchsia-300 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
                  <CountUp target={stat.target} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="mt-2 text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- المزايا ---------------- */}
        <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              منصة واحدة…
              <span className="bg-gradient-to-l from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {" "}كل ما يحتاجه فريقك
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              تنقّل بين الوحدات الأربع وشاهد كيف تعمل كل واحدة منها على بيانات حقيقية.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {featureTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-900/40"
                    : "border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-violet-500/60 hover:text-violet-300"
                }`}
              >
                <span className="ms-0 me-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-base text-slate-300">
            {activePanel.desc}
          </p>

          <div className="mx-auto mt-8 max-w-4xl">{activePanel.panel}</div>
        </section>

        {/* ---------------- التكاملات ---------------- */}
        <section id="integrations" className="scroll-mt-20 border-y border-slate-800/80 bg-slate-900/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold sm:text-4xl">يتكامل مع أدواتك المفضلة</h2>
              <p className="mt-4 text-lg text-slate-400">
                أكثر من ٨٠ تكاملاً جاهزاً، إضافة إلى واجهة برمجية مفتوحة تربط سحاب بأي نظام داخلي.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {integrations.map((tool) => (
                <div
                  key={tool.name}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-950/50"
                >
                  <span className="text-3xl transition-transform duration-300 group-hover:scale-110">
                    {tool.icon}
                  </span>
                  <span className="text-center text-sm font-semibold text-slate-300 group-hover:text-violet-300">
                    {tool.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- الأمان ---------------- */}
        <section id="security" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300">
                أمان على مستوى المؤسسات
              </span>
              <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">
                بياناتك أمانة…
                <br />
                ونحن نحرسها على مدار الساعة
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-400">
                من التشفير الكامل إلى شهادات الامتثال الدولية، بُني سحاب من اليوم الأول
                وفق أعلى معايير الأمن السيبراني، مع خيار استضافة البيانات داخل المنطقة
                لتلبية المتطلبات التنظيمية المحلية.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["SOC 2", "ISO 27001", "نظام حماية البيانات الشخصية"].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300"
                  >
                    🛡️ {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {securityCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-all duration-300 hover:border-violet-500/50 hover:bg-slate-900"
                >
                  <span className="text-3xl">{card.icon}</span>
                  <h3 className="mt-4 text-base font-bold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- آراء العملاء ---------------- */}
        <section id="testimonials" className="scroll-mt-20 border-y border-slate-800/80 bg-slate-900/40 py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold sm:text-4xl">شركات رائدة تعتمد على سحاب</h2>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {customerLogos.map((logo) => (
                <span
                  key={logo}
                  className="text-lg font-extrabold tracking-wide text-slate-500 transition-colors hover:text-violet-300"
                >
                  {logo}
                </span>
              ))}
            </div>

            <div className="relative mt-12">
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-violet-950/30 sm:p-12">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-violet-500/50">
                  <path d="M9.5 8C7 8 5 10 5 12.5S7 17 9.5 17c.3 0 .6 0 .9-.1-.6 1.6-1.9 2.8-3.4 3.4l.8 1.7C10.9 20.7 13 17.9 13 14.5 13 11 11.5 8 9.5 8zm9 0C16 8 14 10 14 12.5S16 17 18.5 17c.3 0 .6 0 .9-.1-.6 1.6-1.9 2.8-3.4 3.4l.8 1.7c3.1-1.3 5.2-4.1 5.2-7.5C22 11 20.5 8 18.5 8z" />
                </svg>
                <blockquote className="mt-6 min-h-28 text-lg leading-relaxed text-slate-200 sm:text-xl">
                  {testimonials[slide].quote}
                </blockquote>
                <div className="mt-8 flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-bl from-violet-500 to-fuchsia-600 text-lg font-bold">
                    {testimonials[slide].initials}
                  </span>
                  <div>
                    <div className="font-bold text-white">{testimonials[slide].name}</div>
                    <div className="text-sm text-slate-400">
                      {testimonials[slide].role} — {testimonials[slide].company}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s - 1 + testimonials.length) % testimonials.length)}
                  aria-label="الرأي السابق"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition-all hover:border-violet-500 hover:bg-violet-500/10 hover:text-violet-300"
                >
                  <ChevronRight />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlide(i)}
                      aria-label={`الانتقال إلى الرأي ${arNum(i + 1)}`}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        slide === i ? "w-8 bg-violet-500" : "w-2.5 bg-slate-600 hover:bg-slate-500"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s + 1) % testimonials.length)}
                  aria-label="الرأي التالي"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition-all hover:border-violet-500 hover:bg-violet-500/10 hover:text-violet-300"
                >
                  <ChevronLeft />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- الأسعار ---------------- */}
        <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">أسعار واضحة تنمو معك</h2>
            <p className="mt-4 text-lg text-slate-400">
              ابدأ مجاناً ثم اختر الخطة المناسبة. يمكنك الترقية أو الإلغاء في أي وقت.
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${!yearly ? "text-white" : "text-slate-500"}`}>شهري</span>
            <button
              type="button"
              onClick={() => setYearly(!yearly)}
              aria-label="تبديل الفوترة بين شهري وسنوي"
              className="relative h-8 w-16 rounded-full bg-slate-700 transition-colors hover:bg-slate-600"
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-gradient-to-bl from-violet-500 to-fuchsia-600 shadow transition-all duration-300 ${
                  yearly ? "right-9" : "right-1"
                }`}
              />
            </button>
            <span className={`text-sm font-bold ${yearly ? "text-white" : "text-slate-500"}`}>
              سنوي
              <span className="ms-2 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                وفر ٢٠٪
              </span>
            </span>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl p-8 transition-all duration-300 ${
                  plan.featured
                    ? "border-2 border-violet-500 bg-gradient-to-b from-violet-950/60 to-slate-900 shadow-2xl shadow-violet-900/30 lg:-translate-y-3"
                    : "border border-slate-800 bg-slate-900/70 hover:border-violet-500/40"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-4 right-1/2 translate-x-1/2 rounded-full bg-gradient-to-l from-violet-600 to-fuchsia-600 px-4 py-1 text-xs font-bold shadow-lg">
                    الأكثر اختياراً ⭐
                  </span>
                )}
                <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-white">
                    {arNum(yearly ? plan.yearly : plan.monthly)}
                  </span>
                  <span className="text-sm text-slate-400">ريال / شهرياً</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {yearly ? "تُدفع سنوياً — لكل مستخدم" : "تُدفع شهرياً — لكل مستخدم"}
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckIcon />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="#demo"
                  className={`mt-8 rounded-xl py-3 text-center text-sm font-bold transition-all ${
                    plan.featured
                      ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-900/40 hover:brightness-110"
                      : "border border-slate-600 text-slate-200 hover:border-violet-500 hover:bg-violet-500/10"
                  }`}
                >
                  {plan.name === "مؤسسات" ? "تواصل مع المبيعات" : "ابدأ التجربة المجانية"}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- لافتة الدعوة ---------------- */}
        <section className="px-4 py-10 sm:px-6">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-l from-violet-700 via-fuchsia-700 to-violet-800 px-8 py-16 text-center shadow-2xl shadow-violet-900/40">
            <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
            <h2 className="relative text-3xl font-extrabold sm:text-4xl">
              جاهز لترفع إنتاجية فريقك إلى السحاب؟
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-violet-100">
              انضم إلى آلاف الشركات العربية التي تدير أعمالها اليوم بمنصة سحاب.
            </p>
            <a
              href="#demo"
              className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-extrabold text-violet-800 shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl"
            >
              احجز عرضك التجريبي الآن
              <span>←</span>
            </a>
          </div>
        </section>

        {/* ---------------- نموذج طلب العرض ---------------- */}
        <section id="demo" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">اطلب عرضاً تجريبياً مخصصاً</h2>
            <p className="mt-4 text-lg text-slate-400">
              سيتواصل معك أحد خبرائنا خلال يوم عمل واحد لجولة كاملة في المنصة بحسب احتياج شركتك.
            </p>
          </div>

          {submitted ? (
            <div className="mt-10 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
                ✅
              </div>
              <h3 className="mt-5 text-2xl font-extrabold text-emerald-300">تم استلام طلبك بنجاح!</h3>
              <p className="mt-3 text-slate-300">
                شكراً لك {form.name.trim()}. أرسلنا رسالة تأكيد إلى بريدك، وسيتواصل معك فريقنا
                خلال ٢٤ ساعة لتنسيق موعد العرض.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", email: "", company: "", teamSize: "" });
                  setErrors({});
                }}
                className="mt-6 rounded-xl border border-emerald-500/50 px-6 py-2.5 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/10"
              >
                إرسال طلب آخر
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-violet-950/30 sm:p-10"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="demo-name" className="mb-2 block text-sm font-bold text-slate-200">
                    الاسم الكامل
                  </label>
                  <input
                    id="demo-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="مثال: نورة الفهد"
                    className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
                      errors.name ? "border-rose-500" : "border-slate-700"
                    }`}
                  />
                  {errors.name && <p className="mt-2 text-xs font-semibold text-rose-400">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="demo-email" className="mb-2 block text-sm font-bold text-slate-200">
                    بريد العمل
                  </label>
                  <input
                    id="demo-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@company.com"
                    dir="ltr"
                    className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-left text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
                      errors.email ? "border-rose-500" : "border-slate-700"
                    }`}
                  />
                  {errors.email && <p className="mt-2 text-xs font-semibold text-rose-400">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="demo-company" className="mb-2 block text-sm font-bold text-slate-200">
                    اسم الشركة
                  </label>
                  <input
                    id="demo-company"
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="مثال: شركة الريادة للتقنية"
                    className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
                      errors.company ? "border-rose-500" : "border-slate-700"
                    }`}
                  />
                  {errors.company && (
                    <p className="mt-2 text-xs font-semibold text-rose-400">{errors.company}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="demo-team" className="mb-2 block text-sm font-bold text-slate-200">
                    حجم الفريق
                  </label>
                  <select
                    id="demo-team"
                    value={form.teamSize}
                    onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                    className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
                      errors.teamSize ? "border-rose-500" : "border-slate-700"
                    }`}
                  >
                    <option value="">اختر حجم الفريق…</option>
                    {teamSizes.map((size) => (
                      <option key={size} value={size}>
                        {size} موظفاً
                      </option>
                    ))}
                  </select>
                  {errors.teamSize && (
                    <p className="mt-2 text-xs font-semibold text-rose-400">{errors.teamSize}</p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="mt-8 w-full rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 py-4 text-base font-extrabold shadow-xl shadow-violet-900/40 transition-all hover:scale-[1.01] hover:brightness-110"
              >
                أرسل الطلب — مجاناً تماماً
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">
                بإرسالك النموذج فأنت توافق على سياسة الخصوصية الخاصة بسحاب. لن نشارك بياناتك مع أي طرف ثالث.
              </p>
            </form>
          )}
        </section>
      </main>

      {/* ---------------- التذييل ---------------- */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 text-2xl font-extrabold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-bl from-violet-500 to-fuchsia-600 text-lg">
                  ☁️
                </span>
                <span className="bg-gradient-to-l from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  سحاب
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                منصة سحابية عربية متكاملة لإدارة المشاريع والتحليلات والأتمتة،
                تساعد الشركات في المنطقة على العمل بوضوح وسرعة وثقة.
              </p>
              <div className="mt-6 flex gap-3">
                {["𝕏", "in", "▶", "✉"].map((icon) => (
                  <span
                    key={icon}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-700 text-sm text-slate-400 transition-all hover:border-violet-500 hover:text-violet-300"
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>
            {[
              {
                title: "المنتج",
                links: ["إدارة المشاريع", "التحليلات", "الأتمتة", "التقارير", "الأسعار"],
              },
              {
                title: "الشركة",
                links: ["من نحن", "الوظائف", "المدونة", "الشركاء", "غرفة الأخبار"],
              },
              {
                title: "الدعم",
                links: ["مركز المساعدة", "حالة النظام", "دليل المطورين", "الأمان", "تواصل معنا"],
              },
            ].map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-extrabold text-white">{column.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((label) => (
                    <li key={label}>
                      <span className="cursor-pointer text-sm text-slate-400 transition-colors hover:text-violet-300">
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
            <p className="text-xs text-slate-500">
              © ١٤٤٧هـ / ٢٠٢٦م سحاب للتقنية — جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-6 text-xs text-slate-500">
              <span className="cursor-pointer transition-colors hover:text-violet-300">شروط الاستخدام</span>
              <span className="cursor-pointer transition-colors hover:text-violet-300">سياسة الخصوصية</span>
              <span className="cursor-pointer transition-colors hover:text-violet-300">ملفات الارتباط</span>
            </div>
          </div>
        </div>
      </footer>

      {/* شارة العودة لجميع الصفحات */}
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-50 rounded-full border border-violet-500/50 bg-slate-900/90 px-4 py-2 text-xs font-bold text-violet-300 shadow-lg shadow-violet-950/50 backdrop-blur transition-all hover:bg-violet-600 hover:text-white"
      >
        جميع الصفحات
      </Link>
    </div>
  );
}
