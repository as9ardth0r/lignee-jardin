/**
 * Barrières de croisement dans le genre Daucus.
 *
 * Carotte cultivée, carotte sauvage et carotte de mer forment une seule
 * espèce (D. carota, 2n = 18) : elles se croisent librement — d’où la
 * hantise des producteurs de semences, qui voient apparaître des racines
 * blanches et ligneuses quand une carotte sauvage fleurit à proximité.
 * D. capillifolius (2n = 18) se croise aussi, un peu moins bien. D. pusillus
 * (2n = 22) ne donne pas de graines avec la carotte.
 * Ordres de grandeur pédagogiques (McCollum 1975 ; Iorizzo et al. 2013).
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

const CAROTA = new Set<SpeciesId>(['sativus', 'carota', 'gummifer']);

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return { level: 'same', seedSet: 1, hybridFertility: 1, reason: 'same' };
  if (mother === 'pusillus' || father === 'pusillus') return { level: 'blocked', seedSet: 0, hybridFertility: 0, reason: 'pusillus' };
  if (CAROTA.has(mother) && CAROTA.has(father)) return { level: 'related', seedSet: 1, hybridFertility: 1, reason: 'wild' };
  return { level: 'difficult', seedSet: 0.5, hybridFertility: 0.8, reason: 'capillifolius' };
}

/** Deux plantes se croisent-elles au jardin (insectes, jusqu’à 1 km) ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  return a !== 'pusillus' && b !== 'pusillus';
}
