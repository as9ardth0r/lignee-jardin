/**
 * Besoins nutritifs d’un pied de tournesol, calculés à partir de sa taille
 * simulée (biomasse fraîche ≈ 6 g par cm de hauteur, plus pour un grand
 * capitule ou une plante ramifiée).
 *
 * Le tournesol explore le sol en profondeur (racine pivotante de plus de
 * 1,5 m) : il demande beaucoup de potasse, assez peu d’azote (l’excès
 * fait verser la tige) et il est sensible au manque de BORE. Ordres de
 * grandeur (références grandes cultures, Terres Inovia).
 */

import type { HaEngine, HaIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 3.5, P2O5: 1.5, K2O: 7, CaO: 3, MgO: 1 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'leaves' | 'buds' | 'bloom';
  nG: number;
  k2oG: number;
}

export interface HaNutrientPlan {
  appetite: Appetite;
  /** Biomasse fraîche estimée d’un pied (kg). */
  biomassKg: number;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'nitrogen' | 'potash' | 'lime' | 'water' | 'drainage' | 'rotation'>;
}

export function biomassKg(engine: HaEngine, ind: HaIndividual): number {
  void engine;
  return Math.round(ind.pheno.heightCm * 6 * (0.7 + 0.01 * ind.pheno.florets + 0.01 * ind.pheno.stems)) / 1000;
}

export function haNutrientPlan(engine: HaEngine, ind: HaIndividual): HaNutrientPlan {
  const bio = biomassKg(engine, ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * bio * 100) / 100])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.1, 0.1],
    ['leaves', 0.5, 0.45],
    ['buds', 0.3, 0.35],
    ['bloom', 0.1, 0.1],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 100) / 100, k2oG: Math.round(season.K2O * k * 100) / 100 }));
  const appetite: Appetite = bio >= 2 ? 'heavy' : bio >= 0.6 ? 'moderate' : 'light';
  const compostKg = Math.max(0.1, Math.round((season.K2O / 6) * 10) / 10);
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06));
  return { appetite, biomassKg: bio, season, stages, compostKg, generic436G, tips: ['nitrogen', 'potash', 'lime', 'water', 'drainage', 'rotation'] };
}
