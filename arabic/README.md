# بايت — قناة تقنية بالعربي 💚

**Bayt** (بايت — a pun on "Byte" and بيت "home") is the website for a fictional Arabic tech channel. Fully RTL, Arabic-first, with a dark navy theme and a cyan→green gradient accent.

## التشغيل / Getting started

```bash
npm install
npm run dev      # خادم التطوير — dev server
npm run build    # بناء نسخة الإنتاج — production build
npm run preview  # معاينة نسخة الإنتاج — preview the build
```

## المحتويات / What's inside

- **الهوية** — اسم «بايت»، شعار SVG متدرّج، وخط Cairo / IBM Plex Sans Arabic.
- **الواجهة** — صفحة واحدة: بطل (hero) مع نافذة طرفية متحركة، شبكة حلقات مع تصفية حسب الموضوع، مواضيع، مقالات، من نحن، ونشرة بريدية.
- **مظهران** — داكن (افتراضي) وفاتح، مع حفظ الاختيار في `localStorage`.
- **بدون أطر عمل** — HTML/CSS/JS فقط، مع Vite كخادم تطوير وأداة بناء.

## البنية / Structure

```
index.html          الصفحة الرئيسية (RTL)
public/favicon.svg  الشعار
src/style.css       التنسيقات والمظهران
src/main.js         البيانات، العرض، والتفاعلات
```
