import type { BreedingEngine, Individual } from './genetics';

/**
 * Estimation illustrative du rendement — dérivée de la vigueur et de la
 * hauteur (traits polygéniques déjà présents dans le moteur), PAS une
 * mesure. Le rendement réel dépend d'abord des conditions de culture
 * (puissance lumineuse, volume de pot, palissage/topping, durée de
 * végétation choisie par le cultivateur) bien plus que de la seule
 * génétique — cette estimation sert à comparer des spécimens entre eux
 * dans le catalogue, pas à prédire une récolte.
 */

export type YieldBand = 'faible' | 'moyen' | 'élevé';

export interface YieldEstimate {
  band: YieldBand;
  /** Fourchette illustrative en g/m² pour une culture en intérieur
   * correctement menée — pas une valeur mesurée sur cette génétique. */
  indoorRangeGramsPerM2: [number, number];
  notes: string[];
}

/** Fourchette de référence pour un hybride photopériode moyen en bonnes
 * conditions — un ordre de grandeur communément cité, pas une norme. */
const BASE_RANGE_G_PER_M2: [number, number] = [300, 600];

function roundTo10(n: number): number {
  return Math.round(n / 10) * 10;
}

export function estimateYield(ind: Individual, engine: BreedingEngine): YieldEstimate {
  const vigorPercent = engine.vigorPercent(ind);
  const heightPercent = engine.heightPercent(ind);
  // La vigueur pèse plus lourd : c'est le trait le plus directement lié
  // à la biomasse produite. La hauteur contribue modérément (plus de
  // sites de floraison potentiels sur une plante plus développée), sans
  // dominer — une plante très haute mais peu vigoureuse ne rendra pas
  // forcément plus qu'une plante compacte et vigoureuse (cf. les
  // variétés naines très productives en culture réelle).
  const combined = vigorPercent * 0.7 + heightPercent * 0.3;
  const band: YieldBand = combined >= 65 ? 'élevé' : combined >= 35 ? 'moyen' : 'faible';

  const scale = 0.6 + (combined / 100) * 0.8; // ×0,6 à ×1,4 de la fourchette de base
  let lo = roundTo10(BASE_RANGE_G_PER_M2[0] * scale);
  let hi = roundTo10(BASE_RANGE_G_PER_M2[1] * scale);

  const notes: string[] = [];

  if (ind.autoflower) {
    lo = roundTo10(lo * 0.5);
    hi = roundTo10(hi * 0.55);
    notes.push(
      'autoflorissante : cycle et végétation plus courts → rendement par plante nettement inférieur à une photopériode équivalente, compensé par la possibilité d\'enchaîner plusieurs cycles par an.'
    );
  }

  const inbreedingPercent = engine.inbreedingPercent(ind);
  if (inbreedingPercent >= 25) {
    lo = roundTo10(lo * 0.85);
    hi = roundTo10(hi * 0.85);
    notes.push(
      `consanguinité élevée (F≈${inbreedingPercent}%) : la dépression de vigueur associée réduit aussi le potentiel de rendement.`
    );
  }

  notes.push(
    "ordre de grandeur illustratif pour une culture en intérieur bien menée — dépend avant tout des conditions de culture (lumière, volume de pot, palissage), bien plus que de la génétique seule."
  );

  return { band, indoorRangeGramsPerM2: [Math.max(10, lo), Math.max(20, hi)], notes };
}
