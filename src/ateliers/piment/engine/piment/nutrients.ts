/**
 * Besoins nutritifs d’une plante de piment ou de poivron, calculés à partir
 * de son rendement simulé.
 *
 * Prélèvements de la culture (plante entière) selon Haifa Group, « Crop
 * guide: pepper » : sous serre, 390–920 kg N, 200–330 P₂O₅, 640–1 530 K₂O,
 * 100–210 CaO et 60–150 MgO par hectare pour 75 à 200 t de fruits.
 * → retenu par tonne de fruits : N 4,5 · P₂O₅ 1,6 · K₂O 7,5 · CaO 1,3 ·
 *   MgO 0,8 kg.
 * Répartition : faibles besoins jusqu’à la floraison (rapport N-P-K ≈ 1-1-1),
 * puis la potasse domine de la nouaison à la récolte (≈ 2-1-3).
 * Ordres de grandeur, pas une prescription.
 */

import type { PepperEngine, PepperIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 4.5, P2O5: 1.6, K2O: 7.5, CaO: 1.3, MgO: 0.8 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'flowering' | 'fruiting' | 'harvest';
  nG: number;
  k2oG: number;
}

export interface PepperNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  /** Compost bien décomposé à apporter avant plantation (kg par plante). */
  compostKg: number;
  /** Engrais organique générique NPK 4-3-6 couvrant la saison (g). */
  generic436G: number;
  tips: Array<'nitrogen' | 'potassium' | 'calcium' | 'water' | 'pot' | 'slow' | 'magnesium'>;
}

export function pepperNutrientPlan(engine: PepperEngine, ind: PepperIndividual): PepperNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.1, 0.05],
    ['flowering', 0.3, 0.25],
    ['fruiting', 0.35, 0.35],
    ['harvest', 0.25, 0.35],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = yieldKg >= 3 ? 'heavy' : yieldKg >= 1.2 ? 'moderate' : 'light';
  const tips: PepperNutrientPlan['tips'] = ['nitrogen', 'potassium'];
  if (ind.pheno.weightKg >= 0.06) tips.push('calcium');
  tips.push('water', 'magnesium');
  if (ind.pheno.heightCm < 40) tips.push('pot');
  if (ind.species !== 'annuum' && ind.species !== 'frutescens') tips.push('slow');
  const compostKg = Math.min(10, Math.max(1, Math.round((season.N * 0.6) / 5)));
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;
  return { appetite, season, stages, compostKg, generic436G, tips };
}
