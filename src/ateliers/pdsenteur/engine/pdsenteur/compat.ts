/**
 * Barrières de croisement dans le genre Lathyrus.
 *
 * Le pois de senteur (2n = 14) se croise avec L. belinensis : les hybrides
 * obtenus par Keith Hammett (Nouvelle-Zélande) dans les années 1990 sont
 * fertiles et ont apporté de nouvelles teintes. L. chloranthus ne donne
 * que de rares hybrides. L. tingitanus, L. latifolius et L. sativus ne
 * donnent pas d’hybride fertile avec lui (Yunus & Jackson 1991 ; Hammett
 * et al. 1994). Ordres de grandeur pédagogiques.
 */

import type { SpeciesId } from './loci';

export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';

export interface CrossCompat {
  level: CrossLevel;
  seedSet: number;
  hybridFertility: number;
  reason: string;
  uncertain?: boolean;
}

const FAR = new Set<SpeciesId>(['tingitanus', 'latifolius', 'sativus']);

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return { level: 'same', seedSet: 1, hybridFertility: 1, reason: 'same' };
  if (FAR.has(mother) || FAR.has(father)) return { level: 'blocked', seedSet: 0, hybridFertility: 0, reason: 'farSpecies' };
  const pair = new Set([mother, father]);
  if (pair.has('odoratus') && pair.has('belinensis')) return { level: 'difficult', seedSet: 0.5, hybridFertility: 0.7, reason: 'belinensis' };
  return { level: 'difficult', seedSet: 0.15, hybridFertility: 0.3, reason: 'chloranthus', uncertain: true };
}

/** Deux plantes peuvent-elles se croiser au jardin ? Presque jamais : le pois de senteur est autogame. */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  return !FAR.has(a) && !FAR.has(b);
}
