import type { Settings, Vault, VaultNode, UIState } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 17.5,
  lineWidth: 1180,
  accent: "#8a7cf0",
  spellcheck: false,
};

interface SeedDef {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  children?: SeedDef[];
  content?: string;
}

const FOUR_STAGES = `# الـ4 مراحل الأساسية للعمل مع الذكاء الاصطناعي

- مقدمة
- التخطيط
- التنفيذ
- التأكّد
- المراجعة
- أتمتة هذا الأمر

## المقدمة

العمل الفعّال مع أدوات الذكاء الاصطناعي لا يعتمد على الحظ، بل على **منهجية واضحة** تتكرّر في كل مهمة. في هذه الملاحظة نلخّص المراحل الأربع التي نعتمدها في كل فيديو من فيديوهات القناة، مع أمثلة عملية باستخدام [[شرح Claude Code للمهندسين|Claude Code]] ونموذج [[Fable 5]].

> الفكرة الأساسية: كلّما كان *السياق* الذي تعطيه للنموذج أوضح، كانت النتيجة أدقّ وأسرع.

## التخطيط

قبل كتابة أي أمر، حدّد ثلاثة أشياء:

1. الهدف النهائي للمهمة بجملة واحدة
2. المعطيات المتوفرة: ملفات، توثيق، أمثلة سابقة
3. معايير النجاح التي ستتحقق منها في مرحلة التأكّد

كلما صغّرت المهمة كان التنفيذ أنظف. المهمة الكبيرة تُقسَّم إلى مهام صغيرة **قابلة للتحقق**.

## التنفيذ

ابدأ بأصغر خطوة ممكنة ثم وسّع تدريجيًا. مثال لتشغيل مهمة من الطرفية:

\`\`\`bash
claude -p "أصلح الاختبارات الفاشلة في هذا المشروع ثم شغّلها للتأكد"
\`\`\`

أثناء التنفيذ راقب ما يفعله النموذج، ولا تتردد في المقاطعة إذا انحرف عن الهدف.

## التأكّد

لا تثق بالنتيجة قبل أن تختبرها بنفسك:

- [x] شغّل الاختبارات بعد كل تعديل
- [x] راجع الفروقات سطرًا سطرًا قبل الحفظ
- [ ] جرّب الحالات الحدّية يدويًا
- [ ] افتح التطبيق وتأكد أن السلوك صحيح فعلًا

## المراجعة

راجع النتيجة النهائية كما لو كانت من زميل جديد في الفريق: هل الكود **قابل للقراءة**؟ هل تغطي الاختبارات الحالات المهمة؟ سجّل ما تعلمته في [[أفكار للفيديوهات القادمة]] حتى لا تكرر نفس الأخطاء.

## أتمتة هذا الأمر

عندما تنجح العملية مرتين أو ثلاثًا بنفس الخطوات، حان وقت الأتمتة: حوّل الخطوات إلى *سكربت* أو أمر مخصّص يعمل دون تدخّل منك، واجعل المراجعة البشرية في النهاية فقط.

---

المرجع الكامل في ملاحظة [[جلسة 01 — أساسيات الوكلاء]].
`;

const CLAUDE_CODE = `# شرح Claude Code للمهندسين

أداة \`Claude Code\` هي وكيل برمجي يعمل من الطرفية، يقرأ المشروع ويعدّل الملفات وينفّذ الأوامر بنفسه.

## لماذا تهمّ المهندسين؟

- تختصر الأعمال المتكررة: إصلاح اختبارات، تحديث مكتبات، كتابة توثيق
- تفهم سياق المشروع كاملًا وليس ملفًا واحدًا
- تعمل ضمن [[الـ4 مراحل الأساسية للعمل مع الذكاء الاصطناعي|المنهجية الأساسية]] نفسها: خطّط ثم نفّذ ثم تأكّد ثم راجع

## أوامر أساسية

\`\`\`bash
# جلسة تفاعلية داخل مجلد المشروع
claude

# مهمة واحدة من دون جلسة
claude -p "اكتب اختبارات لوحدة المصادقة"
\`\`\`

## نصائح للفيديو

1. ابدأ بمثال صغير وواضح
2. أرِ المشاهد **الفرق** قبل التعديل وبعده
3. اختم بمقطع عن حدود الأداة ومتى لا تستخدمها

راجع أيضًا ملاحظات النموذج في [[Fable 5]].
`;

const FABLE5 = `# Fable 5

Fable 5 is Anthropic's latest frontier model, and the one powering most of our recent demos.

## Why it matters for the channel

- Long-horizon agentic work: it plans, executes, and verifies on its own
- Strong Arabic understanding and generation — perfect for our audience
- Pairs well with [[شرح Claude Code للمهندسين|Claude Code]] for end-to-end builds

## Quick facts

| Aspect | Notes |
| ------ | ----- |
| Strengths | Coding, agents, long context |
| Best use | Multi-step engineering tasks |
| Access | API and Claude Code |

## Video angle

Show a real task following [[الـ4 مراحل الأساسية للعمل مع الذكاء الاصطناعي|the 4 stages]]: plan → execute → verify → review, then automate it.

> Don't benchmark-talk. Show real work instead.
`;

const SESSION_01 = `# جلسة 01 — أساسيات الوكلاء

ملاحظات الجلسة المسجّلة الأولى.

## ما الوكيل أصلًا؟

الوكيل = نموذج + أدوات + حلقة تنفيذ. النموذج يقرر، الأدوات تنفّذ، والحلقة تعيد النتيجة للنموذج.

- [x] تسجيل المقدمة
- [x] مثال حي: وكيل يصلح اختبارًا فاشلًا
- [ ] مونتاج الفصل الثاني
`;

const SESSION_02 = `# جلسة 02 — خوادم MCP

بروتوكول MCP يسمح بربط النموذج بأدوات خارجية: قواعد بيانات، متصفح، أنظمة داخلية.

- [x] شرح الفكرة على السبورة
- [ ] عرض خادم MCP بسيط بلغة TypeScript
- [ ] أسئلة الجمهور
`;

const IDEAS_NOTE = `# أفكار للفيديوهات القادمة

- مقارنة عملية بين الوكلاء المحلية والسحابية
- بناء نسخة ويب من تطبيق مشهور خلال ساعة
- سلسلة عن [[الـ4 مراحل الأساسية للعمل مع الذكاء الاصطناعي|المراحل الأربع]] بأمثلة من مشاريع حقيقية
- فيديو قصير: أخطاء شائعة عند كتابة الأوامر

> القاعدة: فكرة واحدة واضحة لكل فيديو.
`;

const LINKS_NOTE = `# روابط مهمة

- [توثيق Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [موقع Obsidian](https://obsidian.md)
- [قناة اليوتيوب](https://youtube.com)

ملاحظات داخلية: [[أفكار للفيديوهات القادمة]] و [[Fable 5]].
`;

const TEMPLATE_NOTE = `# قالب سكربت الفيديو

## الافتتاحية

جملة خطّاف واحدة تشدّ الانتباه خلال ٥ ثوانٍ.

## جسم الفيديو

1. المشكلة
2. الحل خطوة بخطوة
3. مثال حي

## الخاتمة

تلخيص + دعوة لمشاهدة الفيديو التالي.
`;

const WEEK1_D1 = `# اليوم الأول — تهيئة البيئة

- [x] تثبيت الأدوات الأساسية
- [x] إعداد المستودع
- [ ] أول مهمة حقيقية

الانطلاقة من [[الـ4 مراحل الأساسية للعمل مع الذكاء الاصطناعي|المنهجية]].
`;

const WEEK1_D2 = `# اليوم الثاني — أول مشروع

بناء مشروع صغير من الصفر مع التركيز على مرحلة **التخطيط** قبل أي سطر كود.
`;

const WEEK3_REVIEW = `# مراجعة مشاريع الأسبوع

ملاحظات عامة على تسليمات المتدربين:

1. التخطيط ما زال أضعف مرحلة
2. قلة كتابة الاختبارات قبل التسليم
3. تحسّن ملحوظ في صياغة الأوامر
`;

const CONSULT_NOTES = `# ملاحظات الجلسات

ملخصات سريعة لجلسات الاستشارات، بدون أسماء.

- شركة تطوير: أتمتة مراجعة الكود
- فريق منتج: توليد توثيق تلقائي من المستودع
`;

const TREE: SeedDef[] = [
  {
    id: "files",
    name: "Files",
    icon: "files",
    color: "#9b9b9b",
    children: [
      { id: "links", name: "روابط مهمة", content: LINKS_NOTE },
      { id: "template", name: "قالب سكربت الفيديو", content: TEMPLATE_NOTE },
    ],
  },
  {
    id: "videos",
    name: "Videos",
    icon: "youtube",
    color: "#e84b4b",
    children: [
      {
        id: "scripts",
        name: "Scripts",
        icon: "book-open-text",
        color: "#c8b6f0",
        children: [
          {
            id: "recorded",
            name: "مُسجّلة",
            icon: "check-check",
            color: "#53b8a5",
            children: [
              { id: "session1", name: "جلسة 01 — أساسيات الوكلاء", content: SESSION_01 },
              { id: "session2", name: "جلسة 02 — خوادم MCP", content: SESSION_02 },
            ],
          },
          { id: "claude-code", name: "شرح Claude Code للمهندسين", content: CLAUDE_CODE },
          { id: "four-stages", name: "الـ4 مراحل الأساسية للعمل مع الذكاء الاصطناعي", content: FOUR_STAGES },
        ],
      },
      {
        id: "ideas",
        name: "Ideas",
        icon: "lightbulb",
        color: "#e9a23b",
        children: [{ id: "ideas-note", name: "أفكار للفيديوهات القادمة", content: IDEAS_NOTE }],
      },
    ],
  },
  { id: "fable5", name: "Fable 5", content: FABLE5 },
  {
    id: "consult",
    name: "استشارات",
    icon: "briefcase",
    color: "#4dabb5",
    children: [
      {
        id: "curriculum",
        name: "المنهاج",
        children: [
          {
            id: "week1",
            name: "الأسبوع الأول",
            children: [
              { id: "w1d1", name: "اليوم الأول — تهيئة البيئة", content: WEEK1_D1 },
              { id: "w1d2", name: "اليوم الثاني — أول مشروع", content: WEEK1_D2 },
            ],
          },
          {
            id: "week3",
            name: "الأسبوع الثالث",
            children: [{ id: "w3rev", name: "مراجعة مشاريع الأسبوع", content: WEEK3_REVIEW }],
          },
        ],
      },
      { id: "consult-notes", name: "ملاحظات الجلسات", content: CONSULT_NOTES },
    ],
  },
];

export function buildSeedVault(): Vault {
  const nodes: Record<string, VaultNode> = {};
  const walk = (def: SeedDef, parent: string | null): string => {
    const node: VaultNode = {
      id: def.id,
      type: def.children ? "folder" : "file",
      name: def.name,
      parent,
    };
    if (def.children) {
      node.children = def.children.map((c) => walk(c, def.id));
      if (def.icon) node.icon = def.icon;
      if (def.color) node.color = def.color;
    } else {
      node.content = def.content ?? "";
    }
    nodes[def.id] = node;
    return def.id;
  };
  const root = TREE.map((d) => walk(d, null));
  return { nodes, root, trash: [] };
}

export function buildSeedUI(): UIState {
  return {
    leftOpen: true,
    leftWidth: 380,
    leftTab: "files",
    rightOpen: false,
    rightWidth: 280,
    rightTab: "outline",
    tabs: [
      { id: "tab-1", fileId: "four-stages", mode: "live", history: ["four-stages"], hIndex: 0 },
      { id: "tab-2", fileId: "fable5", mode: "live", history: ["fable5"], hIndex: 0 },
    ],
    activeTab: "tab-1",
    expanded: { videos: true, scripts: true, consult: true, curriculum: true },
    bookmarks: [],
    recents: ["four-stages", "fable5"],
    sort: "custom",
    settings: { ...DEFAULT_SETTINGS },
  };
}
