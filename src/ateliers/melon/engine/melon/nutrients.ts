/**
 * Besoins nutritifs d’une plante de melon, calculés sur son rendement simulé.
 *
 * Besoins par tonne de fruits (plante entière) : N 4 · P₂O₅ 1,4 · K₂O 7,3 ·
 * CaO 5 · MgO 1,3 kg (LAT Nitrogen ; recoupé par Cajamar / Ramos & Pomares
 * 2010 : N 3,2–4 · P₂O₅ 1,4–1,6 · K₂O 7,1–9,4 kg/t).
 * Répartition des prélèvements (LAT Nitrogen) : de la plantation au début
 * du grossissement ~8 % de N, 3 % de K mais 40 % de P ; puis nouaison,
 * grossissement et fin de cycle se partagent le reste, la potasse culminant
 * du grossissement à la maturité. Le calcium est absorbé tôt (Yara).
 */

import type { MelonEngine, MelonIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 4.0, P2O5: 1.4, K2O: 7.3, CaO: 5.0, MgO: 1.3 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'fruitset' | 'swelling' | 'ripening';
  nG: number;
  k2oG: number;
}

export interface MelonNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'nitrogen' | 'potassium' | 'calcium' | 'water' | 'stopWater' | 'winter' | 'snake'>;
}

export function melonNutrientPlan(engine: MelonEngine, ind: MelonIndividual): MelonNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.08, 0.03],
    ['fruitset', 0.32, 0.31],
    ['swelling', 0.33, 0.32],
    ['ripening', 0.27, 0.34],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = yieldKg >= 6 ? 'heavy' : yieldKg >= 3 ? 'moderate' : 'light';
  const app = engine.appearance(ind);
  const tips: MelonNutrientPlan['tips'] = ['nitrogen', 'potassium', 'calcium', 'water'];
  if (app.shape === 'snake') tips.push('snake');
  else tips.push('stopWater');
  if (!app.slips) tips.push('winter');
  const compostKg = Math.min(20, Math.max(2, Math.round((season.N * 0.6) / 5)));
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;
  return { appetite, season, stages, compostKg, generic436G, tips };
}
