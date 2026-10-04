/**
 * Barrières de croisement dans le genre Helianthus.
 *
 * Le tournesol cultivé (H. annuus, 2n = 34) se croise avec ses cousins
 * diploïdes annuels : H. argophyllus très facilement (hybrides fertiles),
 * H. petiolaris et H. debilis plus difficilement (hybrides en partie
 * stériles à cause de réarrangements chromosomiques : Rieseberg et al.
 * 1995 ont montré que trois espèces hybrides sont nées de croisements
 * annuus × petiolaris). Les vivaces (H. maximiliani) ne donnent que de
 * rares hybrides, et le topinambour (hexaploïde) aucun au jardin (les
 * sélectionneurs y arrivent par sauvetage d’embryons). Ordres de grandeur
 * pédagogiques.
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

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return { level: 'same', seedSet: 1, hybridFertility: 1, reason: 'same' };
  const pair = new Set([mother, father]);
  if (pair.has('tuberosus')) return { level: 'blocked', seedSet: 0, hybridFertility: 0, reason: 'polyploid' };
  if (pair.has('maximiliani')) return { level: 'difficult', seedSet: 0.1, hybridFertility: 0.15, reason: 'perennial', uncertain: true };
  if (pair.has('annuus') && pair.has('argophyllus')) return { level: 'related', seedSet: 0.85, hybridFertility: 0.85, reason: 'argophyllus' };
  return { level: 'difficult', seedSet: 0.5, hybridFertility: 0.35, reason: 'annualWild' };
}

/** Deux plantes peuvent-elles se croiser au jardin (abeilles) ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  return a !== 'tuberosus' && b !== 'tuberosus';
}
