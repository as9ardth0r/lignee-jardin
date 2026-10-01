/**
 * Besoins nutritifs d’un pied de pois, calculés à partir de son rendement
 * simulé (graines sèches).
 *
 * Le pois est une LÉGUMINEUSE : ses nodosités (Rhizobium leguminosarum)
 * fixent l’azote de l’air ; il n’a besoin d’azote qu’au démarrage. Il
 * laisse même 30 à 50 kg d’azote par hectare à la culture suivante.
 * Prélèvements de la plante entière par tonne de graines (Terres Inovia,
 * guides Yara) : N ≈ 50 (fixé à 70 % environ) · P₂O₅ ≈ 10 · K₂O ≈ 25 ·
 * CaO ≈ 15 · MgO ≈ 4 kg. Ordres de grandeur, pas une prescription.
 */

import type { PsEngine, PsIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 50, P2O5: 10, K2O: 25, CaO: 15, MgO: 4 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];
/** Part de l’azote fournie par les nodosités. */
export const FIXED_SHARE = 0.7;

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'growth' | 'flowering' | 'filling';
  nG: number;
  k2oG: number;
}

export interface PsNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  /** Azote fixé par les nodosités (g). */
  fixedNG: number;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'nodules' | 'nitrogen' | 'potash' | 'water' | 'support' | 'rotation'>;
}

export function psNutrientPlan(engine: PsEngine, ind: PsIndividual): PsNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const fixedNG = Math.round(season.N * FIXED_SHARE * 10) / 10;
  const soilN = season.N - fixedNG;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.6, 0.15],
    ['growth', 0.3, 0.35],
    ['flowering', 0.1, 0.3],
    ['filling', 0, 0.2],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(soilN * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = 'light';
  const tips: PsNutrientPlan['tips'] = ['nodules', 'nitrogen', 'potash', 'water', 'support', 'rotation'];
  const compostKg = Math.max(0.1, Math.round((season.K2O / 5) * 10) / 10);
  const generic436G = Math.round(Math.max(soilN / 0.04, season.P2O5 / 0.03, season.K2O / 0.06));
  return { appetite, season, fixedNG, stages, compostKg, generic436G, tips };
}
