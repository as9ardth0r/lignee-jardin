/**
 * Besoins nutritifs d’une plante de haricot, calculés à partir de son
 * rendement simulé en grains secs.
 *
 * Prélèvements de la culture entière, par tonne de grains : ordres de
 * grandeur recoupés (étude ESALQ/USP sur 90 cultivars ; références
 * agronomiques courantes) : N ≈ 55 · P₂O₅ ≈ 14 · K₂O ≈ 45 · CaO ≈ 20 ·
 * MgO ≈ 8 kg.
 * Particularité des légumineuses : une partie de l’azote vient de l’air,
 * fixé par les bactéries Rhizobium des nodosités. Le haricot commun fixe
 * moins que le pois ou le soja : ~40 % de ses besoins en moyenne.
 * Ordres de grandeur, pas une prescription.
 */

import type { BeanEngine, BeanIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 55, P2O5: 14, K2O: 45, CaO: 20, MgO: 8 } as const;
/** Part de l’azote fournie par la fixation symbiotique (Rhizobium). */
export const N_FIXED = 0.4;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'flowering' | 'podfill' | 'ripening';
  nG: number;
  k2oG: number;
}

export interface BeanNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  /** Azote à apporter (besoin moins la fixation), g par plante. */
  nToApply: number;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'rhizobium' | 'nitrogen' | 'potassium' | 'water' | 'pole' | 'acid'>;
}

export function beanNutrientPlan(engine: BeanEngine, ind: BeanIndividual): BeanNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const nToApply = Math.round(season.N * (1 - N_FIXED) * 10) / 10;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.15, 0.15],
    ['flowering', 0.35, 0.35],
    ['podfill', 0.4, 0.4],
    ['ripening', 0.1, 0.1],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(nToApply * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = yieldKg >= 0.25 ? 'heavy' : yieldKg >= 0.1 ? 'moderate' : 'light';
  const tips: BeanNutrientPlan['tips'] = ['rhizobium', 'nitrogen', 'potassium', 'water'];
  if (!engine.appearance(ind).bush) tips.push('pole');
  tips.push('acid');
  const compostKg = Math.max(0.5, Math.round((nToApply * 0.6) / 5 * 2) / 2);
  const generic436G = Math.round(Math.max(nToApply / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;
  return { appetite, season, nToApply, stages, compostKg, generic436G, tips };
}
