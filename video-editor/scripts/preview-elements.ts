/**
 * Render every preconfigured design element with sample Arabic copy into
 * docs/elements/ — used to eyeball the design system without running the
 * full pipeline. `node scripts/preview-elements.ts [WxH]`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  elementSvg,
  introBackdropSvg,
  introDecoSvg,
  introTitleSvg,
  renderPng,
} from '../src/design.ts';
import { fontSetup } from '../src/brand.ts';
import type { ConceptSpec, IntroSpec } from '../src/types.ts';

const [W, H] = (process.argv[2] ?? '1280x720').split('x').map(Number);
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'elements');
fs.mkdirSync(outDir, { recursive: true });

const intro: IntroSpec = {
  kicker: 'درس برمجة',
  title: 'أساسيات قواعد البيانات',
  subtitle: 'تعلم كتابة أول استعلام SQL خطوة بخطوة',
  backdropFile: process.env.BACKDROP || undefined,
};

const concepts: Record<string, ConceptSpec> = {
  'info-card': {
    element: 'info-card',
    headline: 'أنواع قواعد البيانات',
    sub: 'الفرق الأساسي بينها',
    lines: ['علائقية مثل MySQL', 'وثائقية مثل MongoDB', 'مخازن مفاتيح وقيم'],
    side: 'right',
    durationS: 9,
    illustrationFile: process.env.ILLU || undefined,
  },
  'lower-third': {
    element: 'lower-third',
    headline: 'الاستعلام Query',
    sub: 'طلب بيانات محددة من الجدول',
    lines: [],
    side: 'right',
    durationS: 7,
  },
  arrow: {
    element: 'arrow',
    headline: 'اضغط هنا',
    sub: '',
    lines: [],
    target: { x: 0.28, y: 0.34, w: 0, h: 0 },
    side: 'right',
    durationS: 6,
  },
  highlight: {
    element: 'highlight',
    headline: 'الشرط المهم',
    sub: '',
    lines: [],
    target: { x: 0.52, y: 0.28, w: 0.34, h: 0.32 },
    side: 'right',
    durationS: 6,
  },
  subscribe: {
    element: 'subscribe',
    headline: '',
    sub: '',
    lines: [],
    side: 'left',
    durationS: 7,
  },
};

const { family } = await fontSetup();
console.log(`font: ${family}, canvas ${W}x${H}`);

await renderPng(introBackdropSvg(intro, W, H), path.join(outDir, 'intro-backdrop.png'));
await renderPng(introDecoSvg(intro, W, H), path.join(outDir, 'intro-deco.png'));
await renderPng(introTitleSvg(intro, W, H, family), path.join(outDir, 'intro-title.png'));
for (const [name, spec] of Object.entries(concepts)) {
  await renderPng(elementSvg(spec, W, H, family), path.join(outDir, `${name}.png`));
}
console.log(`wrote ${3 + Object.keys(concepts).length} PNGs to ${outDir}`);
