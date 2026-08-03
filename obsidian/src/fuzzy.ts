import { normalize } from "./store";

/** Simple fuzzy subsequence score. Higher is better; -1 means no match. */
export function fuzzyScore(query: string, target: string): number {
  return fuzzyScoreNorm(normalize(query), normalize(target));
}

/** Same scoring as fuzzyScore, but for inputs that are ALREADY normalized —
    callers ranking many targets against one query should normalize the query
    (and precompute target norms) once instead of per comparison. */
export function fuzzyScoreNorm(q: string, t: string): number {
  if (!q) return 0;
  const sub = t.indexOf(q);
  if (sub !== -1) return 1000 - sub - (t.length - q.length) * 0.5;
  let score = 0;
  let ti = 0;
  let lastHit = -2;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    if (found === lastHit + 1) score += 3;
    else if (found === 0 || t[found - 1] === " " || t[found - 1] === "-") score += 2;
    else score += 1;
    score -= (found - ti) * 0.05;
    lastHit = found;
    ti = found + 1;
  }
  return score;
}
