/**
 * Barrières de croisement chez les pommes de terre : la règle de l’EBN.
 *
 * Chez les Solanum tubérifères, ce n’est pas la ploïdie qui décide si une
 * graine se forme, mais l’ÉQUILIBRE DE L’ALBUMEN (Johnston, den Nijs,
 * Peloquin & Hanneman 1980) : l’albumen doit recevoir deux « doses » EBN
 * maternelles pour une paternelle. En pratique, la graine se forme quand
 * l’ovule et le grain de pollen apportent le MÊME EBN.
 *
 *  - Un gamète normal (réduit) apporte la moitié de l’EBN de sa plante ;
 *  - un gamète non réduit (2n) en apporte la totalité.
 *
 * Exemples : pomme de terre (4x, 4EBN → gamète 2) × Phureja (2x, 2EBN →
 * gamète 1) : ça échoue (« blocage triploïde »)… sauf avec le pollen 2n de
 * Phureja (gamète 2) → descendants tétraploïdes. S. bulbocastanum (2x,
 * 1EBN) ne se croise avec personne, sauf une fois ses chromosomes doublés
 * (4x, 2EBN) avec les espèces 2EBN : c’est le « pont » des sélectionneurs.
 */

import { SPECIES_PLOIDY, type SpeciesId } from './loci';

export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';

export interface CrossCompat {
  level: CrossLevel;
  seedSet: number;
  reason: string;
  uncertain?: boolean;
}

/** EBN apporté par un gamète. */
export function gameteEbn(ebn: number, unreduced: boolean): number {
  return unreduced ? ebn : ebn / 2;
}

/** Ploïdie d’un gamète (réduit : la moitié, arrondie au hasard si impaire). */
export function gametePloidy(ploidy: number, unreduced: boolean): number {
  return unreduced ? ploidy : ploidy / 2;
}

/**
 * Fertilité selon la ploïdie : les ploïdies impaires (3x, 5x) ont une
 * méiose irrégulière et des gamètes déséquilibrés, presque stériles.
 */
export function ploidyFertility(ploidy: number): number {
  if (ploidy % 2 === 1) return ploidy === 5 ? 0.15 : 0.05;
  return 1;
}

/** Libellé de ploïdie : « 2x », « 4x »… */
export function ploidyLabel(ploidy: number): string {
  return `${ploidy}x`;
}

/** Compatibilité théorique entre deux espèces (gamètes réduits, puis 2n). */
export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  const m = SPECIES_PLOIDY[mother];
  const f = SPECIES_PLOIDY[father];
  if (mother === father) return { level: 'same', seedSet: 1, reason: 'same' };
  if (m.ebn === f.ebn) return { level: 'related', seedSet: 1, reason: 'ebnMatch' };
  if (gameteEbn(m.ebn, false) === gameteEbn(f.ebn, true)) return { level: 'difficult', seedSet: 0.3, reason: 'twoNPollen' };
  if (gameteEbn(m.ebn, true) === gameteEbn(f.ebn, false)) return { level: 'difficult', seedSet: 0.02, reason: 'twoNEgg' };
  return { level: 'blocked', seedSet: 0, reason: 'ebn' };
}

/** Deux espèces se croisent-elles au jardin (bourdons) ? Seulement si leurs EBN concordent. */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  return SPECIES_PLOIDY[a].ebn === SPECIES_PLOIDY[b].ebn;
}
