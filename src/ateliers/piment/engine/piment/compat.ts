/**
 * Barrières entre espèces de piments : ce qui se croise, ce qui ne se
 * croise pas, et dans quel sens.
 *
 * Les cinq espèces cultivées ont toutes 2n = 24 et se répartissent en trois
 * « complexes » (Pickersgill 1991) :
 *  - complexe annuum : C. annuum, C. chinense, C. frutescens. Croisements
 *    assez faciles, F1 plus ou moins fertiles. chinense × frutescens sont
 *    presque la même espèce (F1 ~ 94 % de pollen viable) ; annuum ×
 *    frutescens donne des F1 assez fertiles (80–95 %) quand annuum est la
 *    mère, beaucoup moins dans l’autre sens (< 30 %) ; annuum × chinense
 *    donne des F1 à fertilité réduite (≈ 35–85 %, en moyenne ~55 %).
 *    Au jardin, les insectes croisent parfois ces trois espèces entre elles.
 *  - complexe baccatum : C. baccatum. Croisements avec le complexe annuum
 *    difficiles (nombreux embryons avortés, sauvetage d’embryon souvent
 *    nécessaire), F1 peu fertiles (≈ 25–55 % de pollen viable selon les
 *    couples et le sens).
 *  - complexe pubescens : C. pubescens (rocoto). Ne se croise qu’avec des
 *    espèces sauvages de son complexe (C. eximium, C. cardenasii) ; avec les
 *    autres piments cultivés, impossible sans laboratoire.
 *
 * Valeurs = ordres de grandeur ; les résultats varient beaucoup selon les
 * variétés utilisées. Sources : Pickersgill 1991 ; Martins et al. 2015
 * (Crop Breed. Appl. Biotechnol. 15:180) ; Onus & Pickersgill 2004 ;
 * Yoon et al. 2006 ; Manzur et al. 2015.
 */

import type { SpeciesId } from './loci';

/** « related » = espèces différentes mais très proches (croisement facile). */
export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';

export interface CrossCompat {
  level: CrossLevel;
  /** Part des graines demandées qui seront viables (0–1). */
  seedSet: number;
  /** Fertilité des hybrides F1 (0 = stériles, 1 = normaux). */
  f1Fertility: number;
  /** Clé de traduction de l’explication (i18n `compat.*`). */
  reason: string;
  uncertain?: boolean;
}

type Key = `${SpeciesId}>${SpeciesId}`;

/** Clé « mère>père » ; le sens compte. */
const TABLE: Partial<Record<Key, CrossCompat>> = {
  'chinense>frutescens': { level: 'related', seedSet: 0.9, f1Fertility: 0.9, reason: 'chiFru' },
  'frutescens>chinense': { level: 'related', seedSet: 0.9, f1Fertility: 0.9, reason: 'chiFru' },
  'annuum>frutescens': { level: 'difficult', seedSet: 0.7, f1Fertility: 0.85, reason: 'annFru' },
  'frutescens>annuum': { level: 'difficult', seedSet: 0.5, f1Fertility: 0.3, reason: 'fruAnn' },
  'annuum>chinense': { level: 'difficult', seedSet: 0.55, f1Fertility: 0.55, reason: 'annChi' },
  'chinense>annuum': { level: 'difficult', seedSet: 0.45, f1Fertility: 0.5, reason: 'annChi' },
  'annuum>baccatum': { level: 'difficult', seedSet: 0.08, f1Fertility: 0.35, reason: 'annBac', uncertain: true },
  'baccatum>annuum': { level: 'difficult', seedSet: 0.05, f1Fertility: 0.35, reason: 'annBac', uncertain: true },
  'baccatum>chinense': { level: 'difficult', seedSet: 0.12, f1Fertility: 0.25, reason: 'bacChi', uncertain: true },
  'chinense>baccatum': { level: 'difficult', seedSet: 0.1, f1Fertility: 0.25, reason: 'bacChi', uncertain: true },
  'baccatum>frutescens': { level: 'difficult', seedSet: 0.12, f1Fertility: 0.5, reason: 'bacFru', uncertain: true },
  'frutescens>baccatum': { level: 'difficult', seedSet: 0.1, f1Fertility: 0.5, reason: 'bacFru', uncertain: true },
};

const SAME: CrossCompat = { level: 'same', seedSet: 1, f1Fertility: 1, reason: 'same' };
const PUBESCENS: CrossCompat = { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'pubescens' };

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return SAME;
  if (mother === 'pubescens' || father === 'pubescens') return PUBESCENS;
  return TABLE[`${mother}>${father}`] ?? { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'unknown' };
}

/** Deux espèces peuvent-elles se croiser au jardin, par les insectes ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  if (a === b) return true;
  const complex: SpeciesId[] = ['annuum', 'chinense', 'frutescens'];
  return complex.includes(a) && complex.includes(b);
}
