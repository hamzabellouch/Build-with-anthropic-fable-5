import type { Seg, Token, Utterance } from './types.ts';

/** Merge word tokens into speech segments, joining gaps below `mergeGap`. */
export function speechSegments(tokens: Token[], mergeGap = 0.4): Seg[] {
  const segs: Seg[] = [];
  for (const t of tokens) {
    const last = segs[segs.length - 1];
    if (last && t.startS - last.end <= mergeGap) last.end = Math.max(last.end, t.endS);
    else segs.push({ start: t.startS, end: t.endS });
  }
  return segs;
}

/**
 * Group tokens into utterances (sentence-ish units) — the granularity at
 * which the LLM proposes bad-take cuts. Splits on pauses > 0.7 s or
 * sentence-ending punctuation once the utterance has some substance.
 */
export function toUtterances(tokens: Token[]): Utterance[] {
  const utts: Utterance[] = [];
  let cur: { startS: number; endS: number; text: string } | null = null;

  const flush = () => {
    if (cur && cur.text.trim().length > 0) {
      utts.push({ idx: utts.length, startS: cur.startS, endS: cur.endS, text: cur.text.trim() });
    }
    cur = null;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!cur) cur = { startS: t.startS, endS: t.endS, text: '' };
    cur.text += t.text;
    cur.endS = Math.max(cur.endS, t.endS);

    const next = tokens[i + 1];
    const gap = next ? next.startS - t.endS : Infinity;
    const sentenceEnd = /[.!?…]["')\]]?\s*$/.test(cur.text) && cur.text.trim().length > 20;
    if (gap > 0.7 || (sentenceEnd && gap > 0.15) || cur.text.length > 320) flush();
  }
  flush();
  return utts;
}

/** Plain text of all tokens overlapping [t0, t1]. */
export function sliceText(tokens: Token[], t0: number, t1: number): string {
  return tokens
    .filter((t) => t.endS >= t0 && t.startS <= t1)
    .map((t) => t.text)
    .join('')
    .trim();
}
