/**
 * Barrières de croisement dans le genre Pisum.
 *
 * Le pois cultivé et son ancêtre sauvage (subsp. elatius) se croisent
 * librement. P. fulvum se croise avec le pois cultivé surtout quand le pois
 * cultivé est la MÈRE ; les hybrides portent des translocations (des
 * morceaux de chromosomes échangés) et sont à moitié stériles. P.
 * abyssinicum, domestiqué à part en Éthiopie, donne des hybrides encore
 * moins fertiles (Ben-Ze’ev & Zohary 1973 ; Trněný et al. 2018).
 * Ordres de grandeur pédagogiques.
 */

import type { SpeciesId } from './loci';

export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';

export interface CrossCompat {
  level: CrossLevel;
  seedSet: number;
  /** Fertilité des hybrides F1. */
  hybridFertility: number;
  reason: string;
  uncertain?: boolean;
}

/** Groupe génétique : sativum et elatius forment une seule espèce biologique. */
function group(sp: SpeciesId): 'sat' | 'ful' | 'aby' {
  return sp === 'fulvum' ? 'ful' : sp === 'abyssinicum' ? 'aby' : 'sat';
}

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return { level: 'same', seedSet: 1, hybridFertility: 1, reason: 'same' };
  const gm = group(mother);
  const gf = group(father);
  if (gm === gf) return { level: 'related', seedSet: 1, hybridFertility: 1, reason: 'elatius' };
  const pair = [gm, gf].sort().join('-');
  if (pair === 'ful-sat') return gm === 'sat' ? { level: 'difficult', seedSet: 0.4, hybridFertility: 0.5, reason: 'fulvum' } : { level: 'difficult', seedSet: 0.08, hybridFertility: 0.5, reason: 'fulvumMother' };
  if (pair === 'aby-sat') return { level: 'difficult', seedSet: 0.3, hybridFertility: 0.3, reason: 'abyssinicum' };
  return { level: 'difficult', seedSet: 0.1, hybridFertility: 0.2, reason: 'distant', uncertain: true };
}

/** Deux plantes se croisent-elles au jardin ? Rarement : le pois s’autoféconde avant d’ouvrir sa fleur. */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  return group(a) === group(b);
}
