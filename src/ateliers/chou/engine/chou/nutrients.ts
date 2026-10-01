/**
 * Besoins nutritifs d’une plante de chou, calculés à partir de son
 * rendement simulé (kg d’organe récolté).
 *
 * Prélèvements de la culture entière, par tonne de produit récolté : ordres
 * de grandeur recoupés (CTIFL ; guides Yara et Haifa pour les choux) :
 * N ≈ 4,5 · P₂O₅ ≈ 1,5 · K₂O ≈ 5,5 · CaO ≈ 4 · MgO ≈ 0,6 kg — et beaucoup
 * de SOUFRE (≈ 1,5 kg SO₃), qui sert à fabriquer les glucosinolates.
 * Ordres de grandeur, pas une prescription.
 */

import type { BrEngine, BrIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 4.5, P2O5: 1.5, K2O: 5.5, CaO: 4, MgO: 0.6 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];
/** Soufre (SO₃) par tonne. */
export const SULFUR_PER_TONNE = 1.5;

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'growth' | 'heading' | 'finish';
  nG: number;
  k2oG: number;
}

export interface BrNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  sulfurG: number;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'sulfur' | 'nitrogen' | 'boron' | 'lime' | 'water' | 'rotation'>;
}

export function brNutrientPlan(engine: BrEngine, ind: BrIndividual): BrNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.15, 0.1],
    ['growth', 0.45, 0.4],
    ['heading', 0.35, 0.4],
    ['finish', 0.05, 0.1],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = yieldKg >= 1.5 ? 'heavy' : yieldKg >= 0.4 ? 'moderate' : 'light';
  const tips: BrNutrientPlan['tips'] = ['sulfur', 'nitrogen', 'boron', 'lime', 'water', 'rotation'];
  const compostKg = Math.max(0.5, Math.round((season.N * 0.6) / 5 * 2) / 2);
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;
  return { appetite, season, sulfurG: Math.round(SULFUR_PER_TONNE * yieldKg * 10) / 10, stages, compostKg, generic436G, tips };
}
