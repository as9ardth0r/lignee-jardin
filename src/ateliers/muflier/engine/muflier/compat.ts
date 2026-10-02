/**
 * Barrières de croisement chez les mufliers.
 *
 * Les quelque 25 espèces d’Antirrhinum ont toutes 2n = 16 et se croisent
 * entre elles au laboratoire : le genre est un « syngaméon », où les
 * barrières tiennent surtout à la géographie et aux pollinisateurs.
 * Les sous-espèces pseudomajus et striatum se croisent librement dans la
 * nature (zone hybride de Planès, Pyrénées-Orientales). A. hispanicum et
 * A. molle se croisent avec le muflier cultivé, un peu moins bien.
 * La linaire (Linaria) appartient à un autre genre : aucune graine.
 * Ordres de grandeur pédagogiques (Baur 1932 ; Stubbe 1966 ; Schwarz-Sommer et al. 2003).
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

const MAJUS = new Set<SpeciesId>(['majus', 'pseudomajus', 'striatum']);

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return { level: 'same', seedSet: 1, hybridFertility: 1, reason: 'same' };
  if (mother === 'linaria' || father === 'linaria') return { level: 'blocked', seedSet: 0, hybridFertility: 0, reason: 'linaria' };
  if (MAJUS.has(mother) && MAJUS.has(father)) return { level: 'related', seedSet: 1, hybridFertility: 1, reason: 'subspecies' };
  return { level: 'difficult', seedSet: 0.7, hybridFertility: 0.85, reason: 'otherSpecies', uncertain: true };
}

/** Deux plantes peuvent-elles se croiser au jardin (bourdons) ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  return a !== 'linaria' && b !== 'linaria';
}
