import type { BreedingEngine, Individual, StrainInfo } from './genetics';

/**
 * Estimation de l'appétit nutritionnel d'un spécimen — PAS un plan de
 * fertilisation chiffré (aucun ppm, aucune marque d'engrais). Les
 * besoins de base (azote/phosphore/potassium/calcium/magnésium +
 * oligo-éléments) sont universels chez le cannabis ; ce qui varie
 * réellement d'une génétique à l'autre, c'est la TOLÉRANCE aux doses
 * et le RYTHME croissance/floraison — deux choses déjà représentées
 * dans le moteur (vigueur, consanguinité, autofloraison, durée de
 * floraison de la fiche de culture) plutôt qu'un nouveau champ
 * inventé et déconnecté du reste.
 */

export type NutrientAppetite = 'léger' | 'modéré' | 'soutenu';

export interface NutrientProfile {
  appetite: NutrientAppetite;
  /** Fraction indicative de la dose "standard" annoncée par un
   * fabricant d'engrais cannabis générique (souvent calibrée pour un
   * hybride moderne assez vigoureux) — un point de départ à ajuster à
   * l'observation (pointes qui jaunissent = trop faible, qui brûlent
   * = trop fort), pas une valeur mesurée sur cette génétique précise. */
  doseFactorRange: [number, number];
  notes: string[];
}

/** Ratio N-P-K indicatif par phase — universel chez le cannabis,
 * indépendant de la variété (voir la doc du fichier). */
export const NPK_STAGE_GUIDANCE = {
  vegetative: 'azote (N) dominant — ex. ratio proche de 3-1-2',
  bloom: 'phosphore (P) et potassium (K) dominants, azote réduit — ex. ratio proche de 1-3-2',
} as const;

export function estimateNutrientProfile(
  ind: Individual,
  engine: BreedingEngine,
  strainInfo?: StrainInfo
): NutrientProfile {
  const vigorPercent = engine.vigorPercent(ind);
  const inbreedingPercent = engine.inbreedingPercent(ind);
  const notes: string[] = [];

  let appetite: NutrientAppetite = vigorPercent >= 65 ? 'soutenu' : vigorPercent >= 35 ? 'modéré' : 'léger';
  let doseFactorRange: [number, number] =
    appetite === 'soutenu' ? [0.9, 1.15] : appetite === 'modéré' ? [0.7, 0.9] : [0.5, 0.7];

  if (ind.autoflower) {
    // La lignée ruderalis est réputée plus sensible aux excès (système
    // racinaire plus modeste, cycle de vie court qui laisse peu de
    // marge pour corriger une erreur) — pratique courante : doser à
    // 50-75% d'un programme photopériode classique, plafonné même
    // pour un individu par ailleurs très vigoureux.
    appetite = appetite === 'soutenu' ? 'modéré' : appetite;
    doseFactorRange = [Math.min(doseFactorRange[0], 0.5), Math.min(doseFactorRange[1], 0.75)];
    notes.push(
      "génétique autofloraison (ruderalis) : système racinaire plus modeste et cycle court — tolérance aux engrais généralement plus faible, mieux vaut sous-doser légèrement que brûler."
    );
  }

  if (inbreedingPercent >= 25) {
    doseFactorRange = [doseFactorRange[0] * 0.85, doseFactorRange[1] * 0.85];
    notes.push(
      `consanguinité élevée (F≈${inbreedingPercent}%) : la dépression de vigueur qui l'accompagne réduit aussi la tolérance aux excès de sels minéraux — commencer prudent et surveiller les pointes de feuilles.`
    );
  }

  if (strainInfo) {
    const [minFlower, maxFlower] = strainInfo.floweringWeeks;
    if (maxFlower >= 10) {
      notes.push(
        `floraison longue (${minFlower}-${maxFlower} sem.) : la fenêtre de forte demande en phosphore/potassium s'étale davantage qu'une variété à cycle court — prévoir de maintenir l'apport bloom plus longtemps.`
      );
    }
  }

  return { appetite, doseFactorRange, notes };
}
