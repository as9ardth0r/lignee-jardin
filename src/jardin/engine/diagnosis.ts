/**
 * Diagnostic par symptômes : classe les causes plausibles d'après l'organe
 * touché, les signes observés, le contexte (météo récente, serre) et la
 * famille de la plante. Un score n'est pas une certitude : l'app montre
 * ce qui concorde, ce qui manque, et ce qu'il faut vérifier.
 */
import { PROBLEMS, type Context, type Organ, type Problem, type Sign } from '../data/problems';
import type { Family } from '../model';

export interface DiagnosisInput {
  organ?: Organ;
  signs: Sign[];
  context: Context[];
  family?: Family;
}

export interface Hypothesis {
  problem: Problem;
  /** Score relatif (0–1) parmi les hypothèses retenues. */
  confidence: number;
  matched: Sign[];
  /** Signes caractéristiques du problème que vous n'avez pas cochés. */
  missing: Sign[];
  contextMatched: Context[];
}

/** Signes caractéristiques (poids ≥ 4). */
function keySigns(p: Problem): Sign[] {
  return (Object.entries(p.signs) as Array<[Sign, number]>).filter(([, w]) => w >= 4).map(([s]) => s);
}

export function diagnose(input: DiagnosisInput, max = 3): Hypothesis[] {
  if (input.signs.length === 0) return [];
  const scored: Array<{ h: Omit<Hypothesis, 'confidence'>; score: number }> = [];
  for (const p of PROBLEMS) {
    if (input.family && p.hosts.length && !p.hosts.includes(input.family)) continue;
    const matched = input.signs.filter((s) => p.signs[s]);
    if (!matched.length) continue;
    let score = matched.reduce((s, x) => s + (p.signs[x] ?? 0), 0);
    // Signes cochés que ce problème n'explique pas : pénalité légère.
    score -= 0.75 * (input.signs.length - matched.length);
    const missing = keySigns(p).filter((s) => !input.signs.includes(s));
    score -= 1.5 * missing.length;
    if (input.organ) score += p.organs.includes(input.organ) ? 1 : -2;
    const contextMatched = input.context.filter((c) => p.context?.[c]);
    score += contextMatched.reduce((s, c) => s + (p.context?.[c] ?? 0), 0) * 0.75;
    if (score > 0) scored.push({ h: { problem: p, matched, missing, contextMatched }, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, max);
  const total = top.reduce((s, x) => s + x.score, 0);
  return top.map(({ h, score }) => ({ ...h, confidence: total > 0 ? score / total : 0 }));
}
