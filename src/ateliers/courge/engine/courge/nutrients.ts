/**
 * Besoins nutritifs d’une plante de courge, calculés à partir de son
 * rendement simulé.
 *
 * Besoins de la culture par tonne de fruits (plante entière), ordres de
 * grandeur recoupés :
 *  - Service du développement rural de Polynésie française, fiche
 *    « Potiron » : N 120, P 60, K 100 kg/ha et plus pour 30 t/ha ;
 *  - Haifa Group, « Growing pumpkins » : besoins de 110–140 kg N,
 *    30–45 P₂O₅, 220–300 K₂O, 90–135 CaO, 40–60 MgO par hectare ; moitié de
 *    l’azote au fond, moitié quand les tiges commencent à courir, avec la
 *    plus grosse part de la potasse.
 * → retenu : N 4,0 · P₂O₅ 1,5 · K₂O 6,5 · CaO 3,0 · MgO 1,3 kg par tonne.
 *
 * Les courges valorisent très bien la matière organique (compost, fumier
 * décomposé) ; l’excès d’azote fait des feuilles, favorise l’oïdium et
 * retarde la mise à fruit. Ordres de grandeur, pas une prescription.
 */

import type { SquashEngine, SquashIndividual } from './engine';

export const NEEDS_PER_TONNE = { N: 4.0, P2O5: 1.5, K2O: 6.5, CaO: 3.0, MgO: 1.3 } as const;
export type Nutrient = keyof typeof NEEDS_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';

export interface StagePlan {
  stage: 'base' | 'running' | 'fruiting';
  nG: number;
  k2oG: number;
}

export interface SquashNutrientPlan {
  appetite: Appetite;
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  /** Compost bien décomposé à apporter avant plantation (kg par plante). */
  compostKg: number;
  /** Engrais organique générique NPK 4-3-6 couvrant la saison (g). */
  generic436G: number;
  tips: Array<'compost' | 'nitrogen' | 'bush' | 'giant' | 'summer' | 'magnesium' | 'water'>;
}

export function squashNutrientPlan(engine: SquashEngine, ind: SquashIndividual): SquashNutrientPlan {
  const yieldKg = engine.yieldKg(ind);
  const season = Object.fromEntries(NUTRIENTS.map((n) => [n, Math.round(NEEDS_PER_TONNE[n] * yieldKg * 10) / 10])) as Record<Nutrient, number>;
  const split: Array<[StagePlan['stage'], number, number]> = [
    ['base', 0.5, 0.35],
    ['running', 0.3, 0.35],
    ['fruiting', 0.2, 0.3],
  ];
  const stages = split.map(([stage, n, k]) => ({ stage, nG: Math.round(season.N * n * 10) / 10, k2oG: Math.round(season.K2O * k * 10) / 10 }));
  const appetite: Appetite = yieldKg >= 12 ? 'heavy' : yieldKg >= 5 ? 'moderate' : 'light';
  const giant = ind.pheno.weightKg >= 25;
  const summer = ind.pheno.weightKg < 0.6 && ind.pheno.fruits >= 10;
  const tips: SquashNutrientPlan['tips'] = ['compost'];
  if (giant) tips.push('giant');
  if (summer) tips.push('summer');
  if (engine.bushLevel(ind) === 'bush') tips.push('bush');
  tips.push('nitrogen', 'magnesium', 'water');
  // ≈ 1 kg de compost mûr apporte ~5 g d’azote disponible sur la saison
  const compostKg = Math.min(60, Math.max(3, Math.round((season.N * 0.6) / 5)));
  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;
  return { appetite, season, stages, compostKg, generic436G, tips };
}
