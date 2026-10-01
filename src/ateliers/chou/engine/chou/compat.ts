/**
 * Barrières de croisement entre Brassica (triangle de U) et radis.
 *
 * Chaque plante porte un GÉNOME écrit en lettres, un jeu de chromosomes par
 * lettre : « CC » = chou diploïde, « AACC » = colza, « AC » = hybride
 * navet × chou (un seul jeu A et un seul jeu C : les chromosomes n’ont pas
 * de partenaire à la méiose, la plante est presque stérile). En doublant
 * ses chromosomes (colchicine), « AC » devient « AACC » : un colza de
 * synthèse fertile — exactement l’hypothèse de U (1935), refaite depuis au
 * laboratoire. De même radis × chou (« CR ») doublé donne le radis-chou de
 * Karpechenko (« CCRR », 1928).
 *
 * Ordres de grandeur pédagogiques (graines viables sans sauvetage
 * d’embryon, ou avec pour les croisements les plus éloignés) : U 1935 ;
 * Karpechenko 1928 ; FitzJohn et al. 2007 ; Prakash et al. 2009.
 */

import { SPECIES_GENOME, type SpeciesId } from './loci';

export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';

export interface CrossCompat {
  level: CrossLevel;
  seedSet: number;
  reason: string;
  uncertain?: boolean;
}

export function sortGenome(g: string): string {
  return g.split('').sort().join('');
}

export function genomeCounts(g: string): Record<string, number> {
  const c: Record<string, number> = {};
  for (const x of g) c[x] = (c[x] ?? 0) + 1;
  return c;
}

/** Génome équilibré : chaque jeu de chromosomes a son partenaire (méiose régulière). */
export function isBalanced(g: string): boolean {
  return Object.values(genomeCounts(g)).every((n) => n % 2 === 0);
}

/** Hybride « haploïde » de deux diploïdes (un jeu de chaque) : à doubler. */
export function isDoublable(g: string): boolean {
  const c = Object.values(genomeCounts(g));
  return c.length >= 2 && c.every((n) => n === 1);
}

export function doubled(g: string): string {
  return sortGenome(g + g);
}

const GENOME_SPECIES: Record<string, SpeciesId> = Object.fromEntries(Object.entries(SPECIES_GENOME).map(([sp, g]) => [sortGenome(g), sp as SpeciesId]));

/** Espèce correspondant à un génome, si elle existe. */
export function speciesOfGenome(g: string): SpeciesId | undefined {
  return GENOME_SPECIES[sortGenome(g)];
}

/** Fertilité d’une plante selon son génome. */
export function genomeFertility(g: string): number {
  if (isBalanced(g)) {
    const sp = speciesOfGenome(g);
    if (!sp) return 0.5;
    return sp === 'raphanobrassica' ? 0.6 : 1;
  }
  const c = Object.values(genomeCounts(g));
  if (c.every((n) => n === 1)) return 0.02;
  return 0.2;
}

/** Croisement mère × père selon leurs génomes. */
export function genomeCompat(mother: string, father: string): CrossCompat {
  const m = sortGenome(mother);
  const f = sortGenome(father);
  if (m === f) return { level: 'same', seedSet: 1, reason: 'same' };
  const ml = new Set(m);
  const fl = new Set(f);
  const shared = [...ml].some((x) => fl.has(x));
  if (shared) return { level: 'difficult', seedSet: 0.3, reason: 'bridge' };
  const pair = [...ml, ...fl].sort().join('');
  // Diploïdes sans génome commun : triangle de U et radis.
  const table: Record<string, [number, number, string]> = {
    // [mère = première lettre, mère = seconde lettre, raison]
    AC: [0.05, 0.01, 'uAC'],
    AB: [0.08, 0.04, 'uAB'],
    BC: [0.02, 0.02, 'uBC'],
    CR: [0.01, 0.03, 'karpechenko'],
    AR: [0.02, 0.02, 'radish'],
    BR: [0.01, 0.01, 'radish'],
  };
  const t = table[[...new Set(pair)].sort().join('')];
  if (!t) return { level: 'difficult', seedSet: 0.01, reason: 'distant', uncertain: true };
  const motherFirst = [...ml][0] === [...new Set(pair)].sort()[0];
  return { level: 'difficult', seedSet: motherFirst ? t[0] : t[1], reason: t[2] };
}

export function speciesCompat(mother: SpeciesId, father: SpeciesId): CrossCompat {
  return genomeCompat(SPECIES_GENOME[mother], SPECIES_GENOME[father]);
}

/** Deux espèces se croisent-elles au jardin, par les insectes ? */
export function crossInGarden(a: SpeciesId, b: SpeciesId): boolean {
  if (a === b) return true;
  const pair = [a, b].sort().join('+');
  return pair === 'napus+rapa' || pair === 'juncea+rapa' || pair === 'napus+oleracea';
}
