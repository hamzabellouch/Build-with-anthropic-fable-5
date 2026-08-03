import path from 'node:path';
import { CONFIG } from './config.ts';
import { extractClip, extractFrame } from './media.ts';
import { mockBadTakes, mockConceptSpec, mockIntroSpec, type TakeCut } from './mock.ts';
import { chatJson, imagePart, videoPart, type ContentPart } from './openrouter.ts';
import { sliceText, speechSegments } from './transcript.ts';
import type {
  ConceptSpec,
  Cut,
  ElementKind,
  IntroSpec,
  ProbeInfo,
  RegionTarget,
  SceneScore,
  Seg,
  Token,
  Utterance,
} from './types.ts';
import { clamp, fmtTime, logInfo, logWarn, round3 } from './util.ts';

const SYSTEM = `You are the editorial brain of CutRoom, an automated editor for SIMPLE ARABIC EDUCATIONAL videos. You make the same judgement calls a careful human editor would: tighten pacing, remove flubbed takes, and add a few calm, minimal supporting graphics. You are conservative — when unsure, you do not cut and you do not add graphics. All on-screen copy you write is Arabic. You always answer in strict JSON.`;

const ARABIC_RULES = `ARABIC COPY RULES (every text field):
- Modern Standard Arabic (فصحى مبسطة) only — even if the speaker uses another language. Never transliterate Arabic into Latin letters.
- Educational and calm: concrete everyday words a student understands instantly.
- EXTREMELY short. Respect every word limit; fewer words is always better.
- Latin technical terms (SQL, API, Git…) may stay Latin inside the Arabic text.
- Prefer Arabic-Indic numerals (٢٥ not 25).
- No exclamation marks, no clickbait, no emojis, no decorative punctuation.`;

let cutSeq = 0;
const cutId = () => `cut-${(++cutSeq).toString(36)}${Date.now().toString(36).slice(-3)}`;

// ---------------------------------------------------------------------------
// 1. silence cuts — pure timing math over transcript word gaps
// ---------------------------------------------------------------------------
export function planSilenceCuts(tokens: Token[], durationS: number, fallbackSilences: Seg[]): Cut[] {
  const cuts: Cut[] = [];
  const mk = (startS: number, endS: number, kind: Cut['kind'], reason: string): void => {
    startS = round3(clamp(startS, 0, durationS));
    endS = round3(clamp(endS, 0, durationS));
    if (endS - startS < 0.25) return;
    cuts.push({ id: cutId(), startS, endS, kind, reason, confidence: 0.95, enabled: true });
  };

  const speech = speechSegments(tokens, 0.4);
  if (speech.length === 0) {
    // no transcript (no speech, or STT skipped) — fall back to audio energy
    for (const s of fallbackSilences) {
      if (s.end - s.start >= CONFIG.minSilenceGap) {
        mk(s.start + CONFIG.keepAfterSpeech, s.end - CONFIG.keepBeforeSpeech, 'silence', `low audio energy for ${(s.end - s.start).toFixed(1)}s`);
      }
    }
    return cuts;
  }

  if (speech[0].start > 1.0) mk(0, speech[0].start - 0.4, 'lead', 'dead air before the first words');
  for (let i = 0; i < speech.length - 1; i++) {
    const gap = speech[i + 1].start - speech[i].end;
    if (gap >= CONFIG.minSilenceGap) {
      mk(
        speech[i].end + CONFIG.keepAfterSpeech,
        speech[i + 1].start - CONFIG.keepBeforeSpeech,
        'silence',
        `${gap.toFixed(1)}s pause`,
      );
    }
  }
  const last = speech[speech.length - 1];
  if (durationS - last.end > 1.2) mk(last.end + 0.5, durationS, 'tail', 'dead air after the last words');
  return cuts;
}

// ---------------------------------------------------------------------------
// 2. bad takes — LLM reads the utterances like an editor reads a transcript
// ---------------------------------------------------------------------------
function validateTakeCuts(x: unknown, maxIdx: number): string | null {
  const j = x as { cuts?: unknown };
  if (!j || !Array.isArray(j.cuts)) return 'expected {"cuts": [...]}';
  for (const c of j.cuts as any[]) {
    if (typeof c.from !== 'number' || typeof c.to !== 'number') return 'each cut needs numeric "from"/"to"';
    if (c.from < 0 || c.to > maxIdx || c.from > c.to) return `cut range ${c.from}-${c.to} out of bounds (max ${maxIdx})`;
  }
  return null;
}

export async function detectBadTakes(utterances: Utterance[]): Promise<Cut[]> {
  if (utterances.length < 3) return [];
  const raw: TakeCut[] = CONFIG.mock ? mockBadTakes(utterances) : await llmBadTakes(utterances);

  return raw.map((c) => {
    const a = utterances[c.from];
    const b = utterances[c.to];
    return {
      id: cutId(),
      startS: round3(Math.max(0, a.startS - 0.12)),
      endS: round3(b.endS + 0.12),
      kind: c.kind,
      reason: c.reason,
      confidence: clamp(c.confidence ?? 0.6, 0, 1),
      enabled: (c.confidence ?? 0.6) >= 0.5,
    };
  });
}

async function llmBadTakes(utterances: Utterance[]): Promise<TakeCut[]> {
  // chunk very long transcripts so each call stays comfortably inside context
  const CHUNK = 350;
  const chunks: Utterance[][] = [];
  for (let i = 0; i < utterances.length; i += CHUNK) {
    chunks.push(utterances.slice(Math.max(0, i - 10), i + CHUNK)); // 10-utterance overlap
  }
  const all: TakeCut[] = [];
  for (const chunk of chunks) {
    const listing = chunk
      .map((u) => `[${u.idx}] (${fmtTime(u.startS)}–${fmtTime(u.endS)}) ${u.text}`)
      .join('\n');
    const res = await chatJson<{ cuts: TakeCut[] }>({
      model: CONFIG.editModel,
      system: SYSTEM,
      label: 'bad-takes',
      temperature: 0.2,
      maxTokens: 6000,
      validate: (x) => validateTakeCuts(x, utterances.length - 1),
      user: `Below is a numbered transcript of a single-take video recording, one utterance per line.

Find segments a human editor would REMOVE:
- "retake": the speaker repeats roughly the same sentence because the earlier attempt was flubbed. Cut the failed attempt(s), KEEP THE LAST attempt (speakers re-record until satisfied).
- "false-start": an abandoned sentence fragment that goes nowhere.
- "mistake": explicit meta-commentary about messing up ("let me say that again", "scratch that", "cut this part", swearing at a mistake) — cut the flub AND the meta-commentary.
- "filler": an utterance that is ONLY filler ("um, uh, so, yeah okay"). Do not flag fillers inside otherwise good sentences.

Rules:
- Be conservative. Natural repetition for emphasis is NOT a retake. When unsure, do not cut.
- Cuts are ranges of utterance indices [from, to] inclusive, and must not include the good (kept) take.
- confidence: 0..1 — use < 0.5 for borderline suggestions.

Transcript:
${listing}

Return JSON: {"cuts": [{"from": int, "to": int, "kind": "retake"|"false-start"|"filler"|"mistake", "reason": "very short reason in Arabic", "confidence": number}]}
If nothing should be cut, return {"cuts": []}.`,
    });
    all.push(...res.cuts);
  }
  // dedupe overlapping ranges from chunk overlap
  const seen = new Set<string>();
  return all.filter((c) => {
    const k = `${c.from}-${c.to}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------------------------------------------------------------------------
// 3. intro copy — Arabic title card content from the transcript
// ---------------------------------------------------------------------------
const words = (s: string, n: number) => s.trim().split(/\s+/).filter(Boolean).slice(0, n).join(' ');

export async function makeIntroSpec(transcriptText: string, info: ProbeInfo): Promise<IntroSpec> {
  if (CONFIG.mock) return mockIntroSpec();
  const head = transcriptText.split(/\s+/).slice(0, 1200).join(' ');
  const spec = await chatJson<IntroSpec>({
    model: CONFIG.editModel,
    system: SYSTEM,
    label: 'intro',
    temperature: 0.4,
    maxTokens: 2500,
    validate: (x) => {
      const s = x as IntroSpec;
      if (!s?.title?.trim()) return 'missing "title"';
      return null;
    },
    user: `Write the opening title card for this ${Math.max(1, Math.round(info.durationS / 60))}-minute Arabic educational video. The transcript may be in any language — the card is ALWAYS Arabic. Transcript${head.length < transcriptText.length ? ' (beginning)' : ''}:

"""
${head || '(no speech detected — write a generic, calm educational title card)'}
"""

${ARABIC_RULES}

Return JSON:
{
  "kicker": "category chip, max 3 Arabic words (e.g. درس برمجة)",
  "title": "max 5 Arabic words — concrete: what the lesson teaches",
  "subtitle": "max 8 Arabic words — what the viewer will learn to do",
  "backdrop": "one-line ENGLISH brief for a flat minimal illustration of the topic (objects only — the image must contain NO text, letters or numbers), or \\"\\""
}`,
  });
  return {
    kicker: words(spec.kicker ?? '', 3).slice(0, 30),
    title: words(spec.title, 5).slice(0, 60),
    subtitle: words(spec.subtitle ?? '', 8).slice(0, 80),
    backdrop: String(spec.backdrop ?? '').trim().slice(0, 300),
  };
}

// ---------------------------------------------------------------------------
// 4. stale-screen detection + element design via the video-native model
// ---------------------------------------------------------------------------
export function findStaleWindows(scores: SceneScore[], minLen: number, maxScore: number): Seg[] {
  const wins: Seg[] = [];
  let start: number | null = null;
  let prevT = 0;
  for (const s of scores) {
    if (s.score < maxScore) {
      if (start === null) start = s.t;
    } else {
      if (start !== null && prevT - start >= minLen) wins.push({ start, end: prevT });
      start = null;
    }
    prevT = s.t;
  }
  if (start !== null && prevT - start >= minLen) wins.push({ start, end: prevT });
  return wins;
}

export interface GraphicMoment {
  anchorS: number;
  window: Seg;
}

/**
 * Choose where graphics go: longest stale windows first, anchored shortly
 * after the window begins, kept apart on the output timeline.
 */
export function pickGraphicMoments(
  staleWins: Seg[],
  keeps: Seg[],
  srcToOut: (t: number) => number,
  introSeconds: number,
  maxN: number,
  minSpacing: number,
): GraphicMoment[] {
  const kept = (t: number) => keeps.some((k) => t >= k.start && t < k.end);
  const candidates = staleWins
    .map((w) => {
      let anchor = w.start + Math.min(2.5, (w.end - w.start) * 0.15);
      // nudge the anchor into kept material
      for (let i = 0; i < 40 && !kept(anchor) && anchor < w.end; i++) anchor += 0.5;
      return { window: w, anchorS: round3(anchor), len: w.end - w.start };
    })
    .filter((c) => kept(c.anchorS) && srcToOut(c.anchorS) > introSeconds + 1.5)
    .sort((a, b) => b.len - a.len);

  const picked: GraphicMoment[] = [];
  for (const c of candidates) {
    if (picked.length >= maxN) break;
    const out = srcToOut(c.anchorS);
    if (picked.some((p) => Math.abs(srcToOut(p.anchorS) - out) < minSpacing)) continue;
    picked.push({ anchorS: c.anchorS, window: c.window });
  }
  return picked.sort((a, b) => a.anchorS - b.anchorS);
}

const ELEMENTS: ElementKind[] = ['info-card', 'lower-third', 'arrow', 'highlight'];

interface RawConcept {
  element?: string;
  headline?: string;
  sub?: string;
  lines?: unknown[];
  target?: Partial<RegionTarget> | null;
  side?: string;
  durationS?: number;
  illustration?: string;
}

function validateConcept(x: unknown): string | null {
  const s = x as RawConcept;
  if (!s || typeof s !== 'object') return 'expected a JSON object';
  if (s.element === 'none') return null;
  if (!ELEMENTS.includes(s.element as ElementKind)) return `"element" must be one of ${ELEMENTS.join(', ')} or "none"`;
  if (!s.headline?.trim()) return 'missing "headline"';
  if ((s.element === 'arrow' || s.element === 'highlight') && (typeof s.target?.x !== 'number' || typeof s.target?.y !== 'number'))
    return `element "${s.element}" needs a numeric "target" {x,y,w,h}`;
  return null;
}

function sanitizeConcept(s: RawConcept): ConceptSpec {
  const element = s.element as ElementKind;
  const maxHeadWords = element === 'arrow' ? 3 : 4;
  let target: RegionTarget | undefined;
  if (s.target && typeof s.target.x === 'number') {
    target = {
      x: clamp(Number(s.target.x) || 0, 0, 1),
      y: clamp(Number(s.target.y) || 0, 0, 1),
      w: clamp(Number(s.target.w) || 0, 0, 1),
      h: clamp(Number(s.target.h) || 0, 0, 1),
    };
  }
  return {
    element,
    headline: words(String(s.headline ?? ''), maxHeadWords).slice(0, 48),
    sub: words(String(s.sub ?? ''), 6).slice(0, 60),
    lines:
      element === 'info-card'
        ? (s.lines ?? []).slice(0, 3).map((b) => words(String(b), 4).slice(0, 40)).filter(Boolean)
        : [],
    target,
    side: s.side === 'left' ? 'left' : 'right',
    durationS: clamp(Number(s.durationS) || 7, 5, 12),
    illustration: element === 'info-card' ? String(s.illustration ?? '').trim().slice(0, 300) : '',
  };
}

/**
 * Design one supporting element for a stale stretch. The video-native model
 * (Gemini) watches an actual clip; if video input fails, we retry with a
 * single frame. Returns null when the model decides nothing would help.
 */
export async function makeConceptSpec(
  moment: GraphicMoment,
  idx: number,
  info: ProbeInfo,
  tokens: Token[],
  workDir: string,
): Promise<ConceptSpec | null> {
  if (CONFIG.mock) return mockConceptSpec(idx);

  const said = sliceText(tokens, moment.window.start - 8, moment.window.end + 8).slice(0, 2500);
  const prompt = `Attached is footage from an educational video, starting at ${fmtTime(moment.window.start)}. The screen stays visually static for ${Math.round(
    moment.window.end - moment.window.start,
  )}s. While it is on screen the speaker says:

"""
${said || '(no speech in this window)'}
"""

Pick AT MOST ONE pre-built overlay element to support what is being explained. The library:
- "info-card": side panel with a short title + up to 3 tiny points. For a concept with clear steps or parts.
- "lower-third": one-line bottom strip naming a term, definition or section.
- "arrow": an arrow pointing AT one specific thing visible on screen (a button, a line, part of a diagram) with a 1-3 word label. Only when the speech refers to a specific visible spot.
- "highlight": dims everything except one rectangular region. Only when one visible region (code block, formula, paragraph) is the focus of the explanation.
- "none": nothing would genuinely help. Choose this when in doubt — fewer, better graphics beat more graphics.

Look at the footage before deciding: take coordinates from what is actually visible, and put cards on the side with LESS important content (never cover the speaker's face or essential text).

${ARABIC_RULES}

Return JSON:
{
  "element": "info-card" | "lower-third" | "arrow" | "highlight" | "none",
  "headline": "Arabic, max 4 words (arrow label: max 3)",
  "sub": "Arabic supporting line, max 6 words, or \\"\\"",
  "lines": ["info-card only: 0-3 Arabic points, max 4 words each"],
  "target": {"x": 0..1, "y": 0..1, "w": 0..1, "h": 0..1} — normalized, top-left origin. arrow: the point (w=h=0). highlight: the box. Others: null.
  "side": "left" | "right" — info-card: which side of the frame is SAFE to cover,
  "durationS": 5-10,
  "illustration": "info-card only: one-line ENGLISH brief for a small flat illustration of the concept (objects only, NO text in the image), or \\"\\""
}`;

  let raw: RawConcept | null = null;
  // preferred path: the model watches the actual clip (video-native input)
  try {
    const clipPath = path.join(workDir, `clip-${idx}.mp4`);
    await extractClip(info.path, moment.window.start, moment.window.end, clipPath);
    const parts: ContentPart[] = [{ type: 'text', text: prompt }, videoPart(clipPath)];
    raw = await chatJson<RawConcept>({
      model: CONFIG.videoModel,
      fallbacks: CONFIG.videoFallbacks,
      system: SYSTEM,
      label: `concept-${idx} (video)`,
      temperature: 0.4,
      maxTokens: 2500,
      validate: validateConcept,
      user: parts,
    });
  } catch (e) {
    logWarn(`concept-${idx}: video analysis failed (${(e as Error).message}) — falling back to a single frame`);
  }

  if (!raw) {
    const framePath = path.join(workDir, `vision-frame-${idx}.jpg`);
    await extractFrame(info.path, moment.anchorS, framePath);
    raw = await chatJson<RawConcept>({
      model: CONFIG.videoModel,
      fallbacks: CONFIG.videoFallbacks,
      system: SYSTEM,
      label: `concept-${idx} (frame)`,
      temperature: 0.4,
      maxTokens: 2500,
      validate: validateConcept,
      user: [{ type: 'text', text: prompt.replace('Attached is footage', 'Attached is a frame') }, imagePart(framePath)],
    });
  }

  if (raw.element === 'none') {
    logInfo(`concept-${idx}: model chose "none" — skipping this moment`);
    return null;
  }
  return sanitizeConcept(raw);
}

export function logCutSummary(cuts: Cut[]): void {
  const enabled = cuts.filter((c) => c.enabled);
  const saved = enabled.reduce((a, c) => a + (c.endS - c.startS), 0);
  logInfo(`${enabled.length} cuts enabled (${cuts.length - enabled.length} suggestions disabled) — ${saved.toFixed(1)}s removed`);
}
