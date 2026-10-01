/**
 * Besoins nutritifs d’une plante de maïs, calculés à partir de son
 * rendement simulé en grain sec.
 *
 * Prélèvements de la plante entière, par tonne de grain : ordres de
 * grandeur recoupés (Arvalis ; guides Yara et IPNI) : N ≈ 22 · P₂O₅ ≈ 9 ·
 * K₂O ≈ 22 · CaO ≈ 5 · MgO ≈ 5 kg. L’azote est absorbé surtout entre 8
 * feuilles et la floraison (la « phase de croissance active »).
 * Ordres de grandeur, pas une prescription.
 */

import type { MzEngine, MzIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 22, P2O5: 9, K2O: 22, CaO: 5, MgO: 5 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'growth' | 'flowering' | 'filling';
  nG: number;
  k2oG: number;
}

export interface MzNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'nitrogen' | 'phosphorus' | 'water' | 'block' | 'zinc' | 'legume'>;
}

export function mzNutrientPlan(engine: MzEngine, ind: MzIndividual): MzNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.1, 0.1],
    ['growth', 0.55, 0.6],
    ['flowering', 0.25, 0.25],
    ['filling', 0.1, 0.05],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = yieldKg >= 0.2 ? 'heavy' : yieldKg >= 0.08 ? 'moderate' : 'light';
  const tips: MzNutrientPlan['tips'] = ['nitrogen', 'phosphorus', 'water', 'block', 'zinc', 'legume'];
  const compostKg = Math.max(0.5, Math.round((season.N * 0.6) / 5 * 2) / 2);
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;
  return { appetite, season, stages, compostKg, generic436G, tips };
}
