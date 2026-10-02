/**
 * Besoins nutritifs d’un pied de muflier, calculés à partir de sa taille
 * simulée (biomasse fraîche ≈ 3,5 g par cm de hauteur, ramifications
 * comprises).
 *
 * Prélèvements par tonne de biomasse fraîche (guides de fleurs coupées,
 * ordres de grandeur) : N ≈ 4 · P₂O₅ ≈ 1,5 · K₂O ≈ 5 · CaO ≈ 3 · MgO ≈ 0,7 kg.
 * Le muflier préfère un sol drainant, neutre à calcaire ; trop d’azote
 * donne des tiges molles qui versent et attire pucerons et rouille.
 * Ordres de grandeur, pas une prescription.
 */

import type { AmEngine, AmIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 4, P2O5: 1.5, K2O: 5, CaO: 3, MgO: 0.7 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'leaves' | 'buds' | 'bloom';
  nG: number;
  k2oG: number;
}

export interface AmNutrientPlan {
  appetite: Appetite;
  /** Biomasse fraîche estimée d’un pied (kg). */
  biomassKg: number;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'nitrogen' | 'potash' | 'lime' | 'water' | 'drainage' | 'rotation'>;
}

export function biomassKg(engine: AmEngine, ind: AmIndividual): number {
  void engine;
  return Math.round(ind.pheno.heightCm * 3.5 * (0.6 + 0.04 * ind.pheno.stems)) / 1000;
}

export function amNutrientPlan(engine: AmEngine, ind: AmIndividual): AmNutrientPlan {
  const bio = biomassKg(engine, ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * bio * 100) / 100])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['start', 0.15, 0.1],
    ['leaves', 0.45, 0.3],
    ['buds', 0.3, 0.4],
    ['bloom', 0.1, 0.2],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 100) / 100, k2oG: Math.round(season.K2O * k * 100) / 100 }));
  const appetite: Appetite = bio >= 0.3 ? 'moderate' : 'light';
  const compostKg = Math.max(0.1, Math.round((season.K2O / 6) * 10) / 10);
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06));
  return { appetite, biomassKg: bio, season, stages, compostKg, generic436G, tips: ['nitrogen', 'potash', 'lime', 'water', 'drainage', 'rotation'] };
}
