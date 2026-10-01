/**
 * Besoins nutritifs d'un plant de tomate, calculés à partir de ce que le
 * moteur simule déjà (rendement, port, calibre, forme, nanisme).
 *
 * Références :
 *  - Exportations par tonne de fruits produite (plante entière) :
 *    N 2,9 · P₂O₅ 0,8 · K₂O 4,7 · CaO 2,2 · MgO 0,6 kg/t
 *    (Cabildo de Tenerife, fiche « Tomate », 2025).
 *  - Rapport N:K₂O par phase : croissance 1:0,8 → début de récolte 1:1,4
 *    → pleine production 1:1,8 → fin de cycle 1:2,0 (même source).
 *  - Eau d'irrigation ≤ 2,5 dS/m ; engrais dilué à 0,6–0,8 g/L en
 *    fertirrigation (même source). pH du sol visé 6,0–6,8.
 *  - Nécrose apicale (« cul noir ») : liée au transport du calcium vers
 *    l'extrémité du fruit, bien plus fréquente sur les fruits allongés
 *    (corrélation longueur/nécrose R² = 0,61 ; Acta Sci. Agron. 2020) et
 *    les gros calibres, aggravée par un arrosage irrégulier et un excès
 *    de potassium ou d'azote ammoniacal (antagonistes du calcium).
 *
 * Ce sont des ordres de grandeur pour un plant, à ajuster au sol (analyse)
 * et à l'observation — pas une prescription.
 */

import type { TomatoEngine, TomatoIndividual } from './engine';

/** kg exportés par tonne de fruits. */
export const EXTRACTION_PER_TONNE = { N: 2.9, P2O5: 0.8, K2O: 4.7, CaO: 2.2, MgO: 0.6 } as const;
export type Nutrient = keyof typeof EXTRACTION_PER_TONNE;
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O', 'CaO', 'MgO'];

export type Appetite = 'light' | 'moderate' | 'heavy';
export type Risk = 'low' | 'medium' | 'high';

export interface StagePlan {
  stage: 'growth' | 'earlyHarvest' | 'fullProduction' | 'endOfCycle';
  /** Rapport N:K₂O conseillé (K₂O pour 1 de N). */
  kRatio: number;
  /** Quantités pour cette phase, en g par plant. */
  nG: number;
  k2oG: number;
}

export interface TomatoNutrientPlan {
  appetite: Appetite;
  /** Besoins de la saison, en g par plant. */
  season: Record<Nutrient, number>;
  stages: StagePlan[];
  /** Quantité d'un engrais organique « tomate » générique NPK 4-3-6 couvrant la saison (g/plant). */
  generic436G: number;
  berRisk: Risk;
  berReasons: Array<'elongated' | 'pear' | 'large' | 'pot'>;
  /** Conseils ciblés (clés de traduction). */
  tips: Array<'pot' | 'det' | 'indet' | 'brix' | 'magnesium' | 'heavy' | 'light'>;
}

export function tomatoNutrientPlan(engine: TomatoEngine, ind: TomatoIndividual): TomatoNutrientPlan {
  const yieldT = ind.pheno.yieldKg / 1000;
  const season = Object.fromEntries(
    NUTRIENTS.map((n) => [n, Math.round(EXTRACTION_PER_TONNE[n] * yieldT * 1000 * 10) / 10])
  ) as Record<Nutrient, number>;

  const det = engine.isDeterminate(ind);
  const dwarf = engine.isDwarf(ind);
  const app = engine.appearance(ind);
  const size = engine.sizeClass(ind);

  // Répartition de l'azote par phase : un port déterminé concentre la
  // production (pas de longue phase de récolte ni de « fin de cycle »).
  const split: Array<[StagePlan['stage'], number, number]> = det
    ? [
        ['growth', 0.3, 0.8],
        ['earlyHarvest', 0.4, 1.4],
        ['fullProduction', 0.3, 1.8],
      ]
    : [
        ['growth', 0.2, 0.8],
        ['earlyHarvest', 0.25, 1.4],
        ['fullProduction', 0.4, 1.8],
        ['endOfCycle', 0.15, 2.0],
      ];
  const rawK = split.map(([, share, r]) => season.N * share * r);
  const kScale = season.K2O / rawK.reduce((a, b) => a + b, 0);
  const stages: StagePlan[] = split.map(([stage, share, kRatio], i) => ({
    stage,
    kRatio,
    nG: Math.round(season.N * share * 10) / 10,
    k2oG: Math.round(rawK[i] * kScale * 10) / 10,
  }));

  const appetite: Appetite = ind.pheno.yieldKg >= 5 || (!det && ind.pheno.yieldKg >= 4) ? 'heavy' : ind.pheno.yieldKg >= 3 ? 'moderate' : 'light';

  const berReasons: TomatoNutrientPlan['berReasons'] = [];
  if (app.shape === 'elongated') berReasons.push('elongated');
  if (app.shape === 'pear' || app.shape === 'oval' || app.shape === 'heart') berReasons.push('pear');
  if (size === 'large') berReasons.push('large');
  if (dwarf) berReasons.push('pot');
  const berScore = (app.shape === 'elongated' ? 2 : 0) + (berReasons.includes('pear') ? 1 : 0) + (size === 'large' ? 1 : 0) + (dwarf ? 1 : 0);
  const berRisk: Risk = berScore >= 2 ? 'high' : berScore === 1 ? 'medium' : 'low';

  const tips: TomatoNutrientPlan['tips'] = [];
  if (dwarf) tips.push('pot');
  tips.push(det ? 'det' : 'indet');
  if (ind.pheno.brix >= 7) tips.push('brix');
  tips.push('magnesium');
  if (appetite === 'heavy') tips.push('heavy');
  if (appetite === 'light') tips.push('light');

  const generic436G = Math.round(Math.max(season.N / 0.04, season.P2O5 / 0.03, season.K2O / 0.06) / 10) * 10;

  return { appetite, season, stages, generic436G, berRisk, berReasons, tips };
}
