/**
 * Besoins nutritifs d’une plante de carotte, calculés à partir de son
 * rendement simulé (poids de la racine).
 *
 * Prélèvements de la culture entière par tonne de racines (CTIFL ; guides
 * Yara et IPNI) : N ≈ 4 · P₂O₅ ≈ 1,6 · K₂O ≈ 6 · CaO ≈ 3 · MgO ≈ 0,8 kg.
 * La carotte est surtout gourmande en POTASSE ; trop d’azote, et surtout
 * le fumier frais, font des racines fourchues et des fanes énormes.
 * Ordres de grandeur, pas une prescription.
 */

import type { DcEngine, DcIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 4, P2O5: 1.6, K2O: 6, CaO: 3, MgO: 0.8 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'leaves' | 'root' | 'finish';
  nG: number;
  k2oG: number;
}

export interface DcNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'manure' | 'potash' | 'nitrogen' | 'water' | 'soil' | 'rotation'>;
}

export function dcNutrientPlan(engine: DcEngine, ind: DcIndividual): DcNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 100) / 100])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.15, 0.1],
    ['leaves', 0.45, 0.3],
    ['root', 0.35, 0.5],
    ['finish', 0.05, 0.1],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 100) / 100, k2oG: Math.round(season.K2O * k * 100) / 100 }));
  const appetite: Appetite = yieldKg >= 0.25 ? 'moderate' : 'light';
  const tips: DcNutrientPlan['tips'] = ['manure', 'potash', 'nitrogen', 'water', 'soil', 'rotation'];
  const compostKg = Math.max(0.1, Math.round((season.K2O / 6) * 10) / 10);
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06));
  return { appetite, season, stages, compostKg, generic436G, tips };
}
