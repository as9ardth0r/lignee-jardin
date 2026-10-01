/**
 * Barrières de croisement du maïs avec ses parents sauvages.
 *
 *  - Z. mays subsp. parviglumis (téosinte de Balsas) : l’ancêtre direct du
 *    maïs ; même espèce, hybrides pleinement fertiles ;
 *  - Z. mays subsp. mexicana : hybrides fertiles, mais beaucoup de
 *    téosintes mexicana portent Tcb1-s : leurs soies rejettent le pollen du
 *    maïs (maïs ♀ × mexicana ♂ marche, l’inverse beaucoup moins) ;
 *  - Zea diploperennis : téosinte vivace, 2n = 20 ; hybrides obtenus assez
 *    facilement, fertilité réduite ;
 *  - Tripsacum dactyloides (2n = 72) : seulement maïs ♀ × Tripsacum ♂, avec
 *    sauvetage d’embryon au laboratoire ; hybrides presque stériles.
 *
 * Valeurs = ordres de grandeur pédagogiques (Kermicle & Evans 2010 ; Galinat
 * 1988 ; Mangelsdorf & Reeves 1931 ; de Wet & Harlan 1978).
 */

import type { SpeciesId } from './loci';

export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';

export interface CrossCompat {
  level: CrossLevel;
  seedSet: number;
  f1Fertility: number;
  reason: string;
  uncertain?: boolean;
}

type Key = `${SpeciesId}>${SpeciesId}`;

const TABLE: Partial<Record<Key, CrossCompat>> = {
  'mays>parviglumis': { level: 'related', seedSet: 0.95, f1Fertility: 1, reason: 'teoParv' },
  'parviglumis>mays': { level: 'related', seedSet: 0.9, f1Fertility: 1, reason: 'teoParv' },
  'mays>mexicana': { level: 'related', seedSet: 0.9, f1Fertility: 1, reason: 'teoMex' },
  'mexicana>mays': { level: 'difficult', seedSet: 0.15, f1Fertility: 1, reason: 'tcb1' },
  'parviglumis>mexicana': { level: 'related', seedSet: 0.9, f1Fertility: 1, reason: 'teoTeo' },
  'mexicana>parviglumis': { level: 'related', seedSet: 0.6, f1Fertility: 1, reason: 'teoTeo', uncertain: true },
  'mays>diploperennis': { level: 'difficult', seedSet: 0.5, f1Fertility: 0.6, reason: 'diplo' },
  'diploperennis>mays': { level: 'difficult', seedSet: 0.3, f1Fertility: 0.6, reason: 'diplo' },
  'parviglumis>diploperennis': { level: 'difficult', seedSet: 0.4, f1Fertility: 0.6, reason: 'diplo', uncertain: true },
  'diploperennis>parviglumis': { level: 'difficult', seedSet: 0.3, f1Fertility: 0.6, reason: 'diplo', uncertain: true },
  'mexicana>diploperennis': { level: 'difficult', seedSet: 0.3, f1Fertility: 0.6, reason: 'diplo', uncertain: true },
  'diploperennis>mexicana': { level: 'difficult', seedSet: 0.3, f1Fertility: 0.6, reason: 'diplo', uncertain: true },
  'mays>tripsacum': { level: 'difficult', seedSet: 0.02, f1Fertility: 0.03, reason: 'tripsacum' },
};

const SAME: CrossCompat = { level: 'same', seedSet: 1, f1Fertility: 1, reason: 'same' };

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return SAME;
  if (mother === 'tripsacum') return { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'tripsacumMother' };
  return TABLE[`${mother}>${father}`] ?? { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'unknown' };
}

/** Deux espèces peuvent-elles se croiser au champ, par le vent ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  if (a === b) return true;
  return a !== 'tripsacum' && b !== 'tripsacum' && a !== 'diploperennis' && b !== 'diploperennis';
}
