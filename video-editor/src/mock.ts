import type { ConceptSpec, IntroSpec, Seg, Token, Transcript, Utterance } from './types.ts';

/**
 * MOCK mode lets the whole pipeline (including render + UI) run without any
 * API key or network. A synthetic transcript is laid over the detected speech
 * regions, and "LLM" decisions are deterministic canned responses.
 */

const SCRIPT: string[] = [
  'Hey everyone, welcome back to the channel.',
  'Today we are building an automated video editor from scratch.',
  'So the first step is to extract the — ugh, wait, let me say that again.',
  'So the first step is extracting the audio track from your raw footage.',
  'We send that audio to a speech to text model with word level timestamps.',
  'Every long pause becomes a candidate cut, and bad takes get detected by an LLM.',
  'Um, okay, that part was confusing, scratch that.',
  'Then a vision model watches for moments where the screen looks static.',
  'When things get stale, it designs a graphic to illustrate the concept.',
  'The intro gets the heaviest visual treatment, the rest stays subtle.',
  'Finally everything is rendered with ffmpeg in a single pass.',
  'Thanks for watching, see you in the next one.',
];

/** Distribute the canned script over real speech regions as word tokens. */
export function mockTranscript(speech: Seg[], durationS: number): Transcript {
  const regions = speech.length
    ? speech
    : [{ start: 0.5, end: Math.max(1.5, durationS - 0.5) }];
  const tokens: Token[] = [];
  let si = 0;
  for (const r of regions) {
    if (si >= SCRIPT.length) break;
    let t = r.start;
    while (si < SCRIPT.length) {
      const words = SCRIPT[si].split(' ');
      const need = words.length * 0.32;
      if (t + need > r.end + 0.4 && t > r.start) break; // sentence won't fit, next region
      for (let w = 0; w < words.length; w++) {
        const dur = 0.22 + Math.min(0.2, words[w].length * 0.015);
        tokens.push({
          text: (w === 0 ? '' : ' ') + words[w],
          startS: Math.round(t * 100) / 100,
          endS: Math.round((t + dur) * 100) / 100,
          confidence: 0.97,
        });
        t += dur + 0.06;
      }
      t += 0.45; // small inter-sentence pause
      si++;
      if (t > r.end) break;
    }
  }
  return { model: 'mock', text: tokens.map((t) => t.text).join(''), tokens };
}

export interface TakeCut {
  from: number;
  to: number;
  kind: 'retake' | 'false-start' | 'filler' | 'mistake';
  reason: string;
  confidence: number;
}

/** Deterministic stand-in for the LLM bad-take pass: regex the obvious flubs. */
export function mockBadTakes(utterances: Utterance[]): TakeCut[] {
  const cuts: TakeCut[] = [];
  for (const u of utterances) {
    if (/let me (say|try) that again|start over|scratch that|take two/i.test(u.text)) {
      cuts.push({
        from: u.idx,
        to: u.idx,
        kind: /scratch that/i.test(u.text) ? 'mistake' : 'retake',
        reason: 'speaker flubbed the line and asked to redo it',
        confidence: 0.92,
      });
    }
  }
  return cuts;
}

export function mockIntroSpec(): IntroSpec {
  return {
    kicker: 'درس جديد',
    title: 'بناء محرر فيديو آلي',
    subtitle: 'القص الصامت وإزالة الأخطاء تلقائيًا',
    backdrop: '',
  };
}

const MOCK_CONCEPTS: ConceptSpec[] = [
  {
    element: 'info-card',
    headline: 'مراحل المونتاج',
    sub: 'من التسجيل إلى الفيديو النهائي',
    lines: ['تفريغ الكلام نصيًا', 'حذف الصمت والأخطاء', 'إخراج نهائي واحد'],
    side: 'right',
    durationS: 9,
    illustration: '',
  },
  {
    element: 'lower-third',
    headline: 'كشف الشاشة الثابتة',
    sub: 'تحليل الفيديو بالذكاء الاصطناعي',
    lines: [],
    side: 'right',
    durationS: 8,
  },
  {
    element: 'arrow',
    headline: 'انظر هنا',
    sub: '',
    lines: [],
    target: { x: 0.3, y: 0.35, w: 0, h: 0 },
    side: 'right',
    durationS: 7,
  },
  {
    element: 'highlight',
    headline: 'الجزء المهم',
    sub: '',
    lines: [],
    target: { x: 0.55, y: 0.25, w: 0.3, h: 0.32 },
    side: 'right',
    durationS: 7,
  },
];

export function mockConceptSpec(i: number): ConceptSpec {
  return { ...MOCK_CONCEPTS[i % MOCK_CONCEPTS.length] };
}
