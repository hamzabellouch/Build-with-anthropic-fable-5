"use client";

import Link from "next/link";
import { useState } from "react";

const pages = [
  {
    slug: "bun",
    name: "بُن",
    tagline: "محمصة قهوة مختصة تقدم أجود حبوب البن العربي",
    category: "مأكولات ومشروبات",
    emoji: "☕",
    gradient: "from-amber-500 to-orange-700",
  },
  {
    slug: "mandi",
    name: "بيت المندي",
    tagline: "مطعم مأكولات شعبية أصيلة على الطريقة الحضرمية",
    category: "مأكولات ومشروبات",
    emoji: "🍛",
    gradient: "from-red-600 to-orange-600",
  },
  {
    slug: "rahhal",
    name: "رحّال",
    tagline: "وكالة سفر ورحلات لأجمل الوجهات العربية والعالمية",
    category: "سفر وسياحة",
    emoji: "✈️",
    gradient: "from-teal-500 to-sky-600",
  },
  {
    slug: "layali",
    name: "ليالي",
    tagline: "تنظيم أعراس وفعاليات لا تُنسى بأدق التفاصيل",
    category: "فعاليات",
    emoji: "🎉",
    gradient: "from-purple-600 to-fuchsia-600",
  },
  {
    slug: "iqraa",
    name: "إقرأ",
    tagline: "منصة تعليم إلكتروني بالعربية لكل المهارات",
    category: "تعليم",
    emoji: "📚",
    gradient: "from-indigo-500 to-blue-600",
  },
  {
    slug: "liyaqa",
    name: "لياقة",
    tagline: "نادٍ رياضي وتطبيق متكامل لحياة أكثر صحة",
    category: "صحة ورياضة",
    emoji: "💪",
    gradient: "from-lime-500 to-emerald-600",
  },
  {
    slug: "sahab",
    name: "سحاب",
    tagline: "منصة سحابية تساعد الشركات العربية على النمو",
    category: "تقنية",
    emoji: "☁️",
    gradient: "from-violet-500 to-purple-700",
  },
  {
    slug: "mahfaza",
    name: "محفظة",
    tagline: "تطبيق مالي رقمي للدفع والادخار بكل سهولة",
    category: "تقنية",
    emoji: "💳",
    gradient: "from-emerald-500 to-teal-700",
  },
  {
    slug: "dar",
    name: "دار",
    tagline: "منصة عقارية للبحث عن منزل أحلامك وتمويله",
    category: "عقارات",
    emoji: "🏠",
    gradient: "from-blue-700 to-indigo-900",
  },
  {
    slug: "khuyut",
    name: "خيوط",
    tagline: "دار أزياء عصرية تمزج الأصالة بالموضة الحديثة",
    category: "أزياء",
    emoji: "👗",
    gradient: "from-rose-500 to-pink-700",
  },
];

const categories = ["الكل", ...Array.from(new Set(pages.map((p) => p.category)))];

export default function Home() {
  const [active, setActive] = useState("الكل");
  const filtered =
    active === "الكل" ? pages : pages.filter((p) => p.category === active);

  return (
    <main className="flex-1 bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-12 text-center">
          <p className="mb-4 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            معرض صفحات الهبوط العربية
          </p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
            عشر صفحات هبوط{" "}
            <span className="bg-gradient-to-l from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              عربية تفاعلية
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            علامات تجارية افتراضية من قطاعات مختلفة، صُممت كل صفحة منها بهوية
            بصرية مستقلة وتجربة استخدام كاملة باللغة العربية ومن اليمين إلى
            اليسار.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active === cat
                  ? "bg-indigo-500 text-white"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((page) => (
            <Link
              key={page.slug}
              href={`/${page.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10"
            >
              <div
                className={`pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-br ${page.gradient} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`}
              />
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${page.gradient} text-3xl shadow-lg`}
              >
                {page.emoji}
              </div>
              <span className="mb-2 inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs text-slate-300">
                {page.category}
              </span>
              <h2 className="mb-2 text-2xl font-bold">{page.name}</h2>
              <p className="text-sm leading-6 text-slate-400">{page.tagline}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-300 transition-transform duration-300 group-hover:-translate-x-1">
                زيارة الصفحة
                <svg
                  className="h-4 w-4 rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        جميع العلامات التجارية في هذا المعرض افتراضية ولأغراض العرض فقط
      </footer>
    </main>
  );
}
