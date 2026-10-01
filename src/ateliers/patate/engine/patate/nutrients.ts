/**
 * Besoins nutritifs d’une plante de pomme de terre, calculés à partir de
 * son rendement simulé (kg de tubercules).
 *
 * Prélèvements de la culture entière, par tonne de tubercules : ordres de
 * grandeur recoupés (Arvalis, guides Yara et IPNI) : N ≈ 3,5 · P₂O₅ ≈ 1,5 ·
 * K₂O ≈ 6 · CaO ≈ 0,6 · MgO ≈ 0,8 kg. La pomme de terre est avant tout
 * gourmande en POTASSE. Ordres de grandeur, pas une prescription.
 */

import type { PtEngine, PtIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 3.5, P2O5: 1.5, K2O: 6, CaO: 0.6, MgO: 0.8 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'growth' | 'tuberization' | 'finish';
  nG: number;
  k2oG: number;
}

export interface PtNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'potash' | 'nitrogen' | 'scab' | 'water' | 'hilling' | 'rotation'>;
}

export function ptNutrientPlan(engine: PtEngine, ind: PtIndividual): PtNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.3, 0.2],
    ['growth', 0.4, 0.3],
    ['tuberization', 0.3, 0.45],
    ['finish', 0, 0.05],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = yieldKg >= 1.4 ? 'heavy' : yieldKg >= 0.5 ? 'moderate' : 'light';
  const tips: PtNutrientPlan['tips'] = ['potash', 'nitrogen', 'scab', 'water', 'hilling', 'rotation'];
  const compostKg = Math.max(0.5, Math.round((season.N * 0.6) / 5 * 2) / 2);
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;
  return { appetite, season, stages, compostKg, generic436G, tips };
}
