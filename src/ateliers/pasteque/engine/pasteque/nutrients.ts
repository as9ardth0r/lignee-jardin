/**
 * Besoins nutritifs d’une plante de pastèque, calculés à partir de son
 * rendement simulé (kg de fruits).
 *
 * Prélèvements de la culture entière, par tonne de fruits : ordres de
 * grandeur recoupés (guides Haifa et Yara pour la pastèque ; Hochmuth,
 * Univ. de Floride) : N ≈ 2,5 · P₂O₅ ≈ 0,8 · K₂O ≈ 4,2 · CaO ≈ 1,5 ·
 * MgO ≈ 0,5 kg. La potasse domine : c’est elle qui fait le sucre.
 * Ordres de grandeur, pas une prescription.
 */

import type { WmEngine, WmIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 2.5, P2O5: 0.8, K2O: 4.2, CaO: 1.5, MgO: 0.5 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'flowering' | 'swelling' | 'ripening';
  nG: number;
  k2oG: number;
}

export interface WmNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'potassium' | 'nitrogen' | 'water' | 'calcium' | 'mulch' | 'triploid'>;
}

export function wmNutrientPlan(engine: WmEngine, ind: WmIndividual): WmNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.3, 0.15],
    ['flowering', 0.3, 0.25],
    ['swelling', 0.35, 0.45],
    ['ripening', 0.05, 0.15],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = yieldKg >= 15 ? 'heavy' : yieldKg >= 6 ? 'moderate' : 'light';
  const tips: WmNutrientPlan['tips'] = ['potassium', 'nitrogen', 'water', 'calcium', 'mulch'];
  if (ind.ploidy === 3) tips.push('triploid');
  const compostKg = Math.max(1, Math.round((season.N * 0.6) / 5 * 2) / 2);
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;
  return { appetite, season, stages, compostKg, generic436G, tips };
}
