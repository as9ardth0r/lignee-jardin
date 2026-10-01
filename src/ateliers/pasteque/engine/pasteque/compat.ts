/**
 * Barrières de croisement chez les pastèques : entre espèces de Citrullus,
 * et entre niveaux de ploïdie (diploïde 2x, tétraploïde 4x, triploïde 3x).
 *
 * Espèces (toutes 2n = 22 ; Levi et al. 2017 ; Chomicki & Renner 2015) :
 *  - C. lanatus (pastèque) × C. mucosospermus (égousi) : même pool génique,
 *    hybrides pleinement fertiles ;
 *  - × C. amarus (citre) : hybrides fertiles, un peu de stérilité
 *    (translocations) ; c’est la source de nombreuses résistances ;
 *  - × C. colocynthis (coloquinte) : hybrides viables mais à méiose
 *    irrégulière, fertilité réduite ;
 *  - × C. ecirrhosus (Namib) : hybrides obtenus, partiellement fertiles
 *    (peu de données).
 *
 * Ploïdie : c’est ainsi qu’on fait les pastèques SANS PÉPINS. On double les
 * chromosomes d’une lignée (colchicine) pour obtenir un tétraploïde 4x,
 * qu’on croise EN MÈRE avec un diploïde 2x : les graines donnent des plantes
 * triploïdes 3x, stériles, dont les fruits n’ont que des pépins blancs
 * avortés. Le croisement inverse (2x ♀ × 4x ♂) ne donne presque pas de
 * graines viables. Les triploïdes ne font ni pollen ni graines : il faut un
 * diploïde « pollinisateur » à côté pour que leurs fruits nouent.
 *
 * Valeurs = ordres de grandeur pédagogiques (Kihara 1951 ; Wehner 2008 ;
 * Levi et al. 2017).
 */

import type { SpeciesId } from './loci';

export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';
export type Ploidy = 2 | 3 | 4;

export interface CrossCompat {
  level: CrossLevel;
  seedSet: number;
  f1Fertility: number;
  reason: string;
  uncertain?: boolean;
}

const SAME: CrossCompat = { level: 'same', seedSet: 1, f1Fertility: 1, reason: 'same' };

/** Table symétrique (les deux sens se valent à peu près chez Citrullus). */
const PAIRS: Record<string, CrossCompat> = {
  'lanatus+mucosospermus': { level: 'related', seedSet: 0.95, f1Fertility: 0.95, reason: 'lanMuc' },
  'amarus+lanatus': { level: 'related', seedSet: 0.85, f1Fertility: 0.75, reason: 'lanAma' },
  'amarus+mucosospermus': { level: 'related', seedSet: 0.85, f1Fertility: 0.75, reason: 'lanAma' },
  'colocynthis+lanatus': { level: 'difficult', seedSet: 0.5, f1Fertility: 0.35, reason: 'lanCol' },
  'colocynthis+mucosospermus': { level: 'difficult', seedSet: 0.5, f1Fertility: 0.35, reason: 'lanCol' },
  'amarus+colocynthis': { level: 'difficult', seedSet: 0.45, f1Fertility: 0.35, reason: 'lanCol', uncertain: true },
  'ecirrhosus+lanatus': { level: 'difficult', seedSet: 0.35, f1Fertility: 0.4, reason: 'lanEci', uncertain: true },
  'ecirrhosus+mucosospermus': { level: 'difficult', seedSet: 0.35, f1Fertility: 0.4, reason: 'lanEci', uncertain: true },
  'amarus+ecirrhosus': { level: 'difficult', seedSet: 0.35, f1Fertility: 0.4, reason: 'lanEci', uncertain: true },
  'colocynthis+ecirrhosus': { level: 'difficult', seedSet: 0.3, f1Fertility: 0.3, reason: 'lanEci', uncertain: true },
};

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return SAME;
  return PAIRS[[mother, father].sort().join('+')] ?? { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'unknown' };
}

export interface PloidyCompat {
  level: CrossLevel;
  seedSet: number;
  childPloidy: Ploidy;
  /** Fertilité des descendants (0 pour un triploïde). */
  childFertility: number;
  reason: string;
}

/** Ce que donne le croisement mère × père selon leur ploïdie. */
export function ploidyCompat(mother: Ploidy, father: Ploidy): PloidyCompat {
  if (mother === 3 || father === 3) return { level: 'blocked', seedSet: 0, childPloidy: 3, childFertility: 0, reason: 'triploid' };
  if (mother === 2 && father === 2) return { level: 'same', seedSet: 1, childPloidy: 2, childFertility: 1, reason: 'same' };
  if (mother === 4 && father === 4) return { level: 'difficult', seedSet: 0.5, childPloidy: 4, childFertility: 0.6, reason: 'tetraTetra' };
  if (mother === 4) return { level: 'difficult', seedSet: 0.6, childPloidy: 3, childFertility: 0, reason: 'seedless' };
  return { level: 'difficult', seedSet: 0.03, childPloidy: 3, childFertility: 0, reason: 'diploidMother' };
}

/** Deux espèces peuvent-elles se croiser au jardin, par les abeilles ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  return speciesCompat(a, b).level !== 'blocked';
}
