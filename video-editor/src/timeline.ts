import type { Cut, Overlay, ResolvedOverlay, ResolvedTimeline, Seg } from './types.ts';
import { clamp, round3 } from './util.ts';

/** Sort + merge segments whose gap is <= joinGap. Drops empty/invalid segs. */
export function mergeSegs(segs: Seg[], joinGap = 0): Seg[] {
  const sorted = segs
    .filter((s) => s.end > s.start)
    .map((s) => ({ ...s }))
    .sort((a, b) => a.start - b.start);
  const out: Seg[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.start - last.end <= joinGap) last.end = Math.max(last.end, s.end);
    else out.push(s);
  }
  return out;
}

/**
 * Turn enabled cuts into keep-segments over [0, duration].
 * Keeps shorter than minKeep are absorbed into the surrounding cut (a few
 * frames flashing between two cuts looks like a glitch).
 * Guarantees at least one keep — if everything would be cut, the full video
 * is kept and `degenerate` is set.
 */
export function cutsToKeeps(
  cuts: Pick<Cut, 'startS' | 'endS'>[],
  duration: number,
  minKeep = 0.35,
): { keeps: Seg[]; degenerate: boolean } {
  const merged = mergeSegs(
    cuts.map((c) => ({ start: clamp(c.startS, 0, duration), end: clamp(c.endS, 0, duration) })),
    0.001,
  );
  let keeps: Seg[] = [];
  let cursor = 0;
  for (const c of merged) {
    if (c.start > cursor) keeps.push({ start: cursor, end: c.start });
    cursor = Math.max(cursor, c.end);
  }
  if (cursor < duration) keeps.push({ start: cursor, end: duration });
  keeps = keeps.filter((k) => k.end - k.start >= minKeep);
  if (keeps.length === 0) return { keeps: [{ start: 0, end: duration }], degenerate: true };
  return { keeps: keeps.map((k) => ({ start: round3(k.start), end: round3(k.end) })), degenerate: false };
}

export function outDuration(keeps: Seg[]): number {
  return round3(keeps.reduce((acc, k) => acc + (k.end - k.start), 0));
}

/**
 * Map a source timestamp to the output (edited) timeline.
 * Inside a cut → maps to the moment the cut closes (start of next keep).
 * Before the first keep → 0; after the last keep → output duration.
 */
export function makeSourceToOutput(keeps: Seg[]): (srcT: number) => number {
  const starts: number[] = [];
  let acc = 0;
  for (const k of keeps) {
    starts.push(acc);
    acc += k.end - k.start;
  }
  const total = acc;
  return (srcT: number): number => {
    for (let i = 0; i < keeps.length; i++) {
      const k = keeps[i];
      if (srcT < k.start) return round3(starts[i]);
      if (srcT <= k.end) return round3(starts[i] + (srcT - k.start));
    }
    return round3(total);
  };
}

/** Inverse mapping: output timestamp → source timestamp (for UI seeking). */
export function makeOutputToSource(keeps: Seg[]): (outT: number) => number {
  return (outT: number): number => {
    let acc = 0;
    for (const k of keeps) {
      const len = k.end - k.start;
      if (outT <= acc + len) return round3(k.start + Math.max(0, outT - acc));
      acc += len;
    }
    return round3(keeps.length ? keeps[keeps.length - 1].end : 0);
  };
}

/**
 * Place enabled overlays on the output timeline.
 * - intro: pinned at output t=0
 * - concept: anchored in source time, mapped through the cuts
 * Overlapping concept overlays are pushed apart (minGap); ones pushed off the
 * end are dropped.
 */
export function scheduleOverlays(
  overlays: Overlay[],
  keeps: Seg[],
  overlaysDir: string,
  minGap = 1.5,
): ResolvedOverlay[] {
  const map = makeSourceToOutput(keeps);
  const total = outDuration(keeps);
  const out: ResolvedOverlay[] = [];

  const intro = overlays.find((o) => o.enabled && o.kind === 'intro');
  if (intro) {
    const end = Math.min(intro.durationS, Math.max(1, total - 0.2));
    out.push(resolve(intro, 0, end, overlaysDir));
  }
  const introEnd = out.length ? out[0].endOut : 0;

  const concepts = overlays
    .filter((o) => o.enabled && o.kind === 'concept')
    .map((o) => ({ o, start: o.anchorSpace === 'source' ? map(o.anchorS) : o.anchorS }))
    .sort((a, b) => a.start - b.start);

  let prevEnd = introEnd + 0.8;
  for (const { o, start } of concepts) {
    let s = Math.max(start, prevEnd + (out.length > 1 ? minGap : 0));
    const e = s + o.durationS;
    if (s >= total - 3 || e > total - 0.2) {
      const clippedEnd = Math.min(e, total - 0.2);
      if (clippedEnd - s < 3) continue; // not enough room left — drop
      out.push(resolve(o, s, clippedEnd, overlaysDir));
      prevEnd = clippedEnd;
      continue;
    }
    out.push(resolve(o, s, e, overlaysDir));
    prevEnd = e;
  }
  return out;
}

function resolve(o: Overlay, startOut: number, endOut: number, overlaysDir: string): ResolvedOverlay {
  return {
    id: o.id,
    kind: o.kind,
    startOut: round3(startOut),
    endOut: round3(endOut),
    layers: o.layers.map((l) => ({ pngPath: `${overlaysDir}/${l.file}`, anim: l.anim })),
  };
}

export function resolveTimeline(
  cuts: Cut[],
  overlays: Overlay[],
  duration: number,
  overlaysDir: string,
  minKeep = 0.35,
): ResolvedTimeline & { degenerate: boolean } {
  const enabled = cuts.filter((c) => c.enabled);
  const { keeps, degenerate } = cutsToKeeps(enabled, duration, minKeep);
  return {
    keeps,
    degenerate,
    outDuration: outDuration(keeps),
    overlays: scheduleOverlays(overlays, keeps, overlaysDir),
  };
}
