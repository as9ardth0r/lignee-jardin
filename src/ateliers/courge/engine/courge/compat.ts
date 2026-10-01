/**
 * Barrières entre espèces de courges : ce qui se croise, ce qui ne se
 * croise pas, et dans quel sens.
 *
 * Les 5 espèces cultivées ont toutes 2n = 40, mais les croisements entre
 * elles échouent le plus souvent : fruit sans graines viables, embryons
 * avortés, ou hybride F1 stérile. Valeurs retenues (ordres de grandeur) :
 *
 *  - même espèce : croisement normal, F1 fertile. Au jardin, les abeilles
 *    croisent sans difficulté toutes les variétés d’une même espèce.
 *  - C. maxima ♀ × C. moschata ♂ : possible (hybrides commerciaux type
 *    ‘Tetsukabuto’, 1951) ; F1 stérile, il donne des fruits s’il est
 *    pollinisé par un potiron, mais pas de graines utilisables.
 *    Sens inverse : graines rares et mal remplies.
 *  - C. argyrosperma ♀ × C. moschata ♂ : le couple le plus compatible
 *    (73 % de nouaison chez la sous-espèce sororia) ; F1 partiellement
 *    fertile. Seul croisement entre espèces qui arrive parfois au jardin.
 *  - C. pepo ♀ × C. moschata ♂ : très rare (57 graines fertiles pour 134
 *    pollinisations, Connecticut Field × Large Cheese) ; F1 quasi stérile.
 *    Sens inverse : fruits sans graines (parthénocarpiques).
 *  - C. pepo × C. argyrosperma : faible et peu fiable (≈ 10 % selon une
 *    étude chinoise, jamais obtenu selon d’autres sélectionneurs).
 *  - C. pepo × C. maxima : 0 à 0,3 % de graines fertiles → impossible
 *    en pratique sans laboratoire.
 *  - C. maxima × C. argyrosperma : une seule étude, résultat incertain.
 *  - C. ficifolia × toute autre espèce : uniquement par sauvetage
 *    d’embryon au laboratoire, hybrides stériles.
 *
 * Sources : Baggett 1979 (CGC Rep. 2) ; Zhang, Yu & Medina 2012
 * (HortScience 47:452) ; CGC Rep. 25:20 ; Merrick 1990 (CGC Rep. 13) ;
 * Oregon State EM 9270 ; DIYseeds ; Southern Exposure.
 */

import type { SpeciesId } from './loci';

export type CrossLevel = 'same' | 'difficult' | 'blocked';

export interface CrossCompat {
  level: CrossLevel;
  /** Part des graines demandées qui seront viables (0–1). */
  seedSet: number;
  /** Fertilité des hybrides F1 (0 = stériles, 1 = normaux). */
  f1Fertility: number;
  /** Clé de traduction de l’explication (i18n `compat.*`). */
  reason: string;
  /** Résultat peu documenté (une seule étude, études contradictoires). */
  uncertain?: boolean;
}

type Key = `${SpeciesId}>${SpeciesId}`;

/** Clé « mère>père » ; le sens compte. */
const TABLE: Partial<Record<Key, CrossCompat>> = {
  'maxima>moschata': { level: 'difficult', seedSet: 0.25, f1Fertility: 0, reason: 'maxMos' },
  'moschata>maxima': { level: 'difficult', seedSet: 0.05, f1Fertility: 0, reason: 'mosMax' },
  'argyrosperma>moschata': { level: 'difficult', seedSet: 0.5, f1Fertility: 0.5, reason: 'argMos' },
  'moschata>argyrosperma': { level: 'difficult', seedSet: 0.1, f1Fertility: 0.5, reason: 'mosArg' },
  'pepo>moschata': { level: 'difficult', seedSet: 0.02, f1Fertility: 0.05, reason: 'pepMos' },
  'moschata>pepo': { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'mosPep' },
  'pepo>argyrosperma': { level: 'difficult', seedSet: 0.05, f1Fertility: 0.3, reason: 'pepArg', uncertain: true },
  'argyrosperma>pepo': { level: 'difficult', seedSet: 0.05, f1Fertility: 0.3, reason: 'pepArg', uncertain: true },
  'pepo>maxima': { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'pepMax' },
  'maxima>pepo': { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'pepMax' },
  'maxima>argyrosperma': { level: 'difficult', seedSet: 0.02, f1Fertility: 0, reason: 'maxArg', uncertain: true },
  'argyrosperma>maxima': { level: 'difficult', seedSet: 0.02, f1Fertility: 0, reason: 'maxArg', uncertain: true },
};

const SAME: CrossCompat = { level: 'same', seedSet: 1, f1Fertility: 1, reason: 'same' };
const FICIFOLIA: CrossCompat = { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'ficifolia' };

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return SAME;
  if (mother === 'ficifolia' || father === 'ficifolia') return FICIFOLIA;
  return TABLE[`${mother}>${father}`] ?? { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'unknown' };
}

/** Deux espèces peuvent-elles se croiser au jardin, par les abeilles ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  if (a === b) return true;
  const pair = [a, b].sort().join('+');
  return pair === 'argyrosperma+moschata';
}
