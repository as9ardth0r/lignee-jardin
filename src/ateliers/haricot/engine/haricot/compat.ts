/**
 * Barrières entre espèces de haricots : ce qui se croise, ce qui ne se
 * croise pas, et dans quel sens.
 *
 * Les cinq espèces cultivées ont toutes 2n = 22, mais forment des « pools
 * géniques » de plus en plus éloignés du haricot commun (Singh 2001 ;
 * Mejía-Jiménez et al. 1994) :
 *  - P. coccineus (haricot d’Espagne) et P. dumosus (haricot « d’un an »)
 *    forment le pool secondaire : avec P. vulgaris EN MÈRE, on obtient des
 *    hybrides assez facilement, partiellement fertiles ; dans l’autre sens
 *    (coccineus ou dumosus en mère), les embryons avortent le plus souvent
 *    (sauvetage d’embryon nécessaire). coccineus × dumosus se croisent
 *    bien (dumosus serait issu d’un tel croisement ancien) ;
 *  - P. acutifolius (tépari), pool tertiaire : seulement P. vulgaris ♀ ×
 *    tépari ♂, et presque toujours avec sauvetage d’embryon ; hybrides
 *    presque stériles, la fertilité revient par rétrocroisements ;
 *  - P. lunatus (Lima), pool quaternaire : aucun hybride fertile avec les
 *    autres haricots cultivés.
 *
 * Valeurs = ordres de grandeur pédagogiques (« graines viables » au jardin,
 * sans laboratoire). Sources : Singh 2001 (Crop Sci. 41:1659) ; Mejía-
 * Jiménez et al. 1994 ; Parker & Michaels 1986 ; Mendel 1866 (P. vulgaris ×
 * P. multiflorus, aujourd’hui coccineus).
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
  'vulgaris>coccineus': { level: 'difficult', seedSet: 0.3, f1Fertility: 0.45, reason: 'vulCoc' },
  'coccineus>vulgaris': { level: 'difficult', seedSet: 0.03, f1Fertility: 0.45, reason: 'cocVul' },
  'vulgaris>dumosus': { level: 'difficult', seedSet: 0.3, f1Fertility: 0.5, reason: 'vulDum', uncertain: true },
  'dumosus>vulgaris': { level: 'difficult', seedSet: 0.05, f1Fertility: 0.5, reason: 'dumVul', uncertain: true },
  'coccineus>dumosus': { level: 'related', seedSet: 0.7, f1Fertility: 0.8, reason: 'cocDum' },
  'dumosus>coccineus': { level: 'related', seedSet: 0.7, f1Fertility: 0.8, reason: 'cocDum' },
  'vulgaris>acutifolius': { level: 'difficult', seedSet: 0.01, f1Fertility: 0.05, reason: 'vulAcu' },
};

const SAME: CrossCompat = { level: 'same', seedSet: 1, f1Fertility: 1, reason: 'same' };

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  if (mother === father) return SAME;
  if (mother === 'lunatus' || father === 'lunatus') return { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'lunatus' };
  if (mother === 'acutifolius') return { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'acuVul' };
  return TABLE[`${mother}>${father}`] ?? { level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'unknown' };
}

/** Deux espèces peuvent-elles se croiser au jardin, par les insectes ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  if (a === b) return true;
  const pair = [a, b].sort().join('+');
  return pair === 'coccineus+dumosus' || pair === 'coccineus+vulgaris';
}
