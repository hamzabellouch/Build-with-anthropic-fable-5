// ============================================================
// بايت — قناة تقنية بالعربي
// ============================================================

// ---------- Icons ----------
const icons = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1 2 7v1a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-1a4 4 0 0 1 2-7V6a4 4 0 0 1 4-4Z"/><circle cx="9" cy="11" r="1" fill="currentColor"/><circle cx="15" cy="11" r="1" fill="currentColor"/><path d="M9 15h6"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 6-6 6 6 6M16 6l6 6-6 6"/></svg>',
  security: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  hardware: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/></svg>',
  startup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8a2.1 2.1 0 0 0-3 0Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0m1 7v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  future: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.5 12 4.5 12 4.5s-7 0-8.9.6A3 3 0 0 0 1 7.2 31.2 31.2 0 0 0 .5 12 31.2 31.2 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.6 8.9.6 8.9.6s7 0 8.9-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 23.5 12 31.2 31.2 0 0 0 23 7.2ZM9.8 15.3V8.7l5.8 3.3-5.8 3.3Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.2 2h6.4l4.4 5.9L18.9 2Zm-1.1 18.1h1.7L7 3.7H5.2l12.6 16.4Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m21.9 3.4-3 16.1c-.2 1-.9 1.3-1.7.8l-4.8-3.6-2.3 2.3c-.3.3-.5.5-1 .5l.4-5 9-8.2c.4-.3-.1-.5-.6-.2L6.7 13.2 1.9 11.7c-1-.3-1-1 .2-1.5L20.5 2c.9-.3 1.7.2 1.4 1.5Z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .8a11.2 11.2 0 0 0-3.5 21.8c.5.1.7-.2.7-.5v-2c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.2 1 .1-.8.4-1.3.7-1.6-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-3 0 0 1-.3 3.1 1.2a10.7 10.7 0 0 1 5.6 0c2.2-1.5 3.1-1.2 3.1-1.2.6 1.6.2 2.7.1 3 .7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.2-5.1 5.5.4.3.8 1 .8 2.1v3.1c0 .3.2.6.7.5A11.2 11.2 0 0 0 12 .8Z"/></svg>',
};

// ---------- Data ----------
const categories = {
  ai: { label: 'ذكاء اصطناعي', thumb: 'thumb-ai' },
  code: { label: 'برمجة', thumb: 'thumb-code' },
  security: { label: 'أمن سيبراني', thumb: 'thumb-security' },
  hardware: { label: 'عتاد', thumb: 'thumb-hardware' },
  startup: { label: 'ريادة أعمال', thumb: 'thumb-startup' },
  future: { label: 'تقنيات المستقبل', thumb: 'thumb-future' },
};

const episodes = [
  { title: 'الذكاء الاصطناعي التوليدي: كيف يعمل فعلاً؟', cat: 'ai', duration: '18:42', views: '٤٢٠ ألف مشاهدة', date: 'قبل ٣ أيام' },
  { title: 'بنيت تطبيقاً كاملاً بدون كتابة سطر كود واحد', cat: 'code', duration: '24:10', views: '٣١٥ ألف مشاهدة', date: 'قبل أسبوع' },
  { title: 'كيف تحمي حساباتك من الاختراق في ٢٠٢٦؟', cat: 'security', duration: '15:33', views: '٥٨٠ ألف مشاهدة', date: 'قبل أسبوعين' },
  { title: 'مراجعة أقوى معالجات ARM للحواسيب المحمولة', cat: 'hardware', duration: '21:05', views: '٢٧٠ ألف مشاهدة', date: 'قبل ٣ أسابيع' },
  { title: 'قصة شركة ناشئة عربية وصلت إلى العالمية', cat: 'startup', duration: '28:50', views: '٤٩٠ ألف مشاهدة', date: 'قبل شهر' },
  { title: 'حوسبة الكم ببساطة: هل هي نهاية التشفير؟', cat: 'future', duration: '19:27', views: '٣٦٠ ألف مشاهدة', date: 'قبل شهر' },
];

const topics = [
  { icon: 'ai', title: 'الذكاء الاصطناعي', desc: 'نماذج اللغة، الوكلاء، وأدوات الذكاء' },
  { icon: 'code', title: 'البرمجة', desc: 'لغات، أطر عمل، ومسارات تعلّم' },
  { icon: 'security', title: 'الأمن السيبراني', desc: 'حماية، اختراق أخلاقي، وخصوصية' },
  { icon: 'hardware', title: 'العتاد', desc: 'معالجات، حواسيب، ومراجعات أجهزة' },
  { icon: 'startup', title: 'ريادة الأعمال', desc: 'شركات ناشئة وقصص نجاح عربية' },
  { icon: 'future', title: 'تقنيات المستقبل', desc: 'حوسبة الكم، الروبوتات، والفضاء' },
];

const articles = [
  {
    tag: 'دليل شامل',
    title: 'دليلك الكامل لتعلّم بايثون من الصفر حتى أول وظيفة',
    excerpt: 'خارطة طريق عملية بالعربي: من تثبيت بايثون إلى بناء مشاريع حقيقية تضعها في معرض أعمالك.',
    meta: '١٢ دقيقة قراءة · برمجة',
  },
  {
    tag: 'شرح مبسّط',
    title: 'ما هو RAG ولماذا تحتاجه نماذج الذكاء الاصطناعي؟',
    excerpt: 'كيف تجعل نموذج الذكاء الاصطناعي يجيب من مستنداتك أنت؟ نشرح الاسترجاع المعزّز بالتوليد بأبسط صورة.',
    meta: '٨ دقائق قراءة · ذكاء اصطناعي',
  },
  {
    tag: 'قائمة مختارة',
    title: 'أفضل ١٠ أدوات مفتوحة المصدر ننصح بها في ٢٠٢٦',
    excerpt: 'أدوات جرّبناها فعلاً على مدار السنة ووفّرت علينا مئات الساعات — من المحرّر إلى النشر.',
    meta: '١٠ دقائق قراءة · أدوات',
  },
];

const socials = [
  { icon: 'youtube', label: 'يوتيوب', href: '#' },
  { icon: 'x', label: 'إكس', href: '#' },
  { icon: 'instagram', label: 'انستغرام', href: '#' },
  { icon: 'telegram', label: 'تيليغرام', href: '#' },
  { icon: 'github', label: 'جيتهاب', href: '#' },
];

// ---------- Render: episodes + filters ----------
const episodesGrid = document.getElementById('episodesGrid');
const filtersEl = document.getElementById('filters');

function renderEpisodes(filter = 'all') {
  const list = filter === 'all' ? episodes : episodes.filter((e) => e.cat === filter);
  episodesGrid.innerHTML = list
    .map(
      (e) => `
      <article class="card reveal">
        <a href="#" aria-label="تشغيل: ${e.title}">
          <div class="card-thumb ${categories[e.cat].thumb}">
            ${icons[e.cat]}
            <span class="card-play">${icons.play}</span>
            <span class="card-duration">${e.duration}</span>
          </div>
        </a>
        <div class="card-body">
          <span class="card-tag">${categories[e.cat].label}</span>
          <h3 class="card-title">${e.title}</h3>
          <div class="card-meta"><span>${e.views}</span><span>${e.date}</span></div>
        </div>
      </article>`
    )
    .join('');
  observeReveals(episodesGrid);
}

function renderFilters() {
  const chips = [['all', 'الكل'], ...Object.entries(categories).map(([k, v]) => [k, v.label])];
  filtersEl.innerHTML = chips
    .map(([key, label]) => `<button class="filter-chip${key === 'all' ? ' active' : ''}" data-filter="${key}">${label}</button>`)
    .join('');
  filtersEl.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.filter-chip');
    if (!chip) return;
    filtersEl.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    renderEpisodes(chip.dataset.filter);
  });
}

// ---------- Render: topics ----------
document.getElementById('topicsGrid').innerHTML = topics
  .map(
    (t) => `
    <a class="topic reveal" href="#episodes">
      <span class="topic-icon">${icons[t.icon]}</span>
      <span><h3>${t.title}</h3><p>${t.desc}</p></span>
    </a>`
  )
  .join('');

// ---------- Render: articles ----------
document.getElementById('articlesGrid').innerHTML = articles
  .map(
    (a) => `
    <article class="article reveal">
      <span class="article-tag">${a.tag}</span>
      <h3>${a.title}</h3>
      <p>${a.excerpt}</p>
      <span class="article-meta">${a.meta}</span>
      <a class="article-link" href="#">اقرأ المقال ←</a>
    </article>`
  )
  .join('');

// ---------- Render: socials ----------
document.getElementById('socials').innerHTML = socials
  .map((s) => `<a href="${s.href}" aria-label="${s.label}" title="${s.label}">${icons[s.icon]}</a>`)
  .join('');

// ---------- Reveal on scroll ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

function observeReveals(root = document) {
  root.querySelectorAll('.reveal:not(.visible)').forEach((el) => revealObserver.observe(el));
}

// ---------- Header shadow on scroll ----------
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ---------- Mobile nav ----------
const burger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});
navLinks.addEventListener('click', (ev) => {
  if (ev.target.tagName === 'A') {
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

// ---------- Theme toggle ----------
const themeToggle = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('bayt-theme');
if (storedTheme) document.documentElement.dataset.theme = storedTheme;
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('bayt-theme', next);
});

// ---------- Hero typing effect ----------
const phrases = ['افهم_التقنية --بعمق', 'تعلّم_البرمجة --بالعربي', 'اشترك_في_بايت --الآن'];
const typeTarget = document.getElementById('typeTarget');
let phraseIdx = 0, charIdx = 0, deleting = false;

function typeLoop() {
  const phrase = phrases[phraseIdx];
  typeTarget.textContent = phrase.slice(0, charIdx);
  let delay = deleting ? 35 : 75;
  if (!deleting && charIdx === phrase.length) {
    deleting = true;
    delay = 2000;
  } else if (deleting && charIdx === 0) {
    deleting = false;
    phraseIdx = (phraseIdx + 1) % phrases.length;
    delay = 400;
  } else {
    charIdx += deleting ? -1 : 1;
  }
  setTimeout(typeLoop, delay);
}

// ---------- Newsletter ----------
const form = document.getElementById('newsletterForm');
const msg = document.getElementById('newsletterMsg');
form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  msg.classList.toggle('error', !valid);
  msg.textContent = valid
    ? '🎉 أهلاً بك في عائلة بايت! تفقّد بريدك لتأكيد الاشتراك.'
    : 'الرجاء إدخال بريد إلكتروني صحيح.';
  if (valid) form.reset();
});

// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear().toLocaleString('ar-EG', { useGrouping: false });

// ---------- Init ----------
renderFilters();
renderEpisodes();
observeReveals();
typeLoop();
