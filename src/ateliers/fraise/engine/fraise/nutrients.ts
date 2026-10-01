/**
 * Besoins nutritifs d’un fraisier, calculés à partir de sa récolte simulée.
 *
 * Prélèvements de la culture entière par tonne de fruits (CTIFL ; guides
 * Yara et IPNI) : N ≈ 6 · P₂O₅ ≈ 2,5 · K₂O ≈ 10 · CaO ≈ 3 · MgO ≈ 1,5 kg.
 * Le fraisier est surtout gourmand en POTASSE, qui fait la couleur et le
 * sucre du fruit ; trop d’azote donne des feuilles, des fruits mous et de
 * la pourriture grise. Racines superficielles, sensibles au sel : apports
 * fractionnés. Ordres de grandeur, pas une prescription.
 */

import type { FaEngine, FaIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 6, P2O5: 2.5, K2O: 10, CaO: 3, MgO: 1.5 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'start' | 'leaves' | 'flowering' | 'fruiting';
  nG: number;
  k2oG: number;
}

export interface FaNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  compostKg: number;
  generic436G: number;
  tips: Array<'manure' | 'potash' | 'nitrogen' | 'water' | 'soil' | 'rotation'>;
}

export function faNutrientPlan(engine: FaEngine, ind: FaIndividual): FaNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 100) / 100])) as Record<Nutrient, number>;
  const everbearing = engine.appearance(ind).everbearing;
  // Les remontantes demandent un apport continu pendant toute la fructification.
  const split: Array<[StagePlan['stage'], number, number]> = everbearing
    ? [
        ['start', 0.15, 0.1],
        ['leaves', 0.25, 0.15],
        ['flowering', 0.25, 0.3],
        ['fruiting', 0.35, 0.45],
      ]
    : [
        ['start', 0.25, 0.1],
        ['leaves', 0.35, 0.25],
        ['flowering', 0.25, 0.35],
        ['fruiting', 0.15, 0.3],
      ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 100) / 100, k2oG: Math.round(season.K2O * k * 100) / 100 }));
  const appetite: Appetite = yieldKg >= 0.6 ? 'heavy' : yieldKg >= 0.25 ? 'moderate' : 'light';
  const tips: FaNutrientPlan['tips'] = ['manure', 'potash', 'nitrogen', 'water', 'soil', 'rotation'];
  const compostKg = Math.max(0.2, Math.round((season.K2O / 6) * 10) / 10);
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06));
  return { appetite, season, stages, compostKg, generic436G, tips };
}
