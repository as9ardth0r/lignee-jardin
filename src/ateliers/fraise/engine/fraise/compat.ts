/**
 * Barrières de croisement dans le genre Fragaria : une affaire de ploïdie.
 *
 * Les trois octoploïdes (fraisier cultivé, de Virginie, du Chili ; 8x) se
 * croisent librement : le fraisier cultivé est justement né, vers 1750 en
 * Bretagne et à Versailles, du croisement du fraisier du Chili (rapporté
 * par Frézier en 1714) et du fraisier de Virginie.
 * Entre niveaux de ploïdie différents, les graines sont rares et les
 * hybrides STÉRILES : octoploïde × fraisier des bois (2x) → pentaploïde ;
 * octoploïde × fraisier musqué (6x) → heptaploïde ; fraisier musqué ×
 * fraisier des bois → tétraploïde. Ces hybrides poussent et se
 * multiplient par stolons, mais ne donnent pas de graines.
 * Ordres de grandeur pédagogiques (Hancock 1999 ; Staudt 1989).
 */

import { SPECIES_INFO, type SpeciesId } from './loci';

export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';

export interface CrossCompat {
  level: CrossLevel;
  seedSet: number;
  hybridFertility: number;
  reason: string;
  uncertain?: boolean;
}

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return { level: 'same', seedSet: 1, hybridFertility: 1, reason: 'same' };
  const pa = SPECIES_INFO[mother].ploidy;
  const pb = SPECIES_INFO[father].ploidy;
  if (pa === 8 && pb === 8) return { level: 'related', seedSet: 1, hybridFertility: 1, reason: 'octoploids' };
  // Ploïdies différentes : quelques graines, hybrides stériles (multipliables par stolons).
  const seedSet = pa === 8 || pb === 8 ? (pa === 2 || pb === 2 ? 0.12 : 0.2) : 0.15;
  return { level: 'difficult', seedSet, hybridFertility: 0, reason: pa === 2 || pb === 2 ? 'ploidyVesca' : 'ploidyMoschata', uncertain: pa === 6 || pb === 6 };
}

/** Deux fraisiers se croisent-ils au jardin (abeilles) ? Seulement à même ploïdie. */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  return SPECIES_INFO[a].ploidy === SPECIES_INFO[b].ploidy;
}
