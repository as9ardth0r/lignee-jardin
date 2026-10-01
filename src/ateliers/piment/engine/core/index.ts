/**
 * Noyau génétique commun à toutes les espèces de Lignée.
 *
 * Tout ce qui ne dépend PAS de la biologie d'une espèce particulière
 * vit ici : générateur pseudo-aléatoire reproductible, méiose d'un
 * locus mendélien diploïde, traits polygéniques additifs, mesures de
 *  fixation (homozygotie). Chaque espèce (ici les courges, dans ../piment/)
 * ne décrit que ses propres loci, ses règles d'expression (dominance,
 * épistasie) et sa bibliothèque de variétés.
 *
 * Ajouter une espèce (poivron, haricot…) = un nouveau dossier
 * engine/<espèce>/ qui importe ce noyau, plus son atelier dans src/.
 */

// --- Aléatoire reproductible -----------------------------------------------

/** RNG déterministe (mulberry32) : même graine → même session. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

/** Hachage FNV-1a d'une chaîne → graine 32 bits (ex. id de spécimen). */
export function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Tirage gaussien standard (Box-Muller). */
export function gaussian(rng: Rng): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// --- Loci mendéliens -------------------------------------------------------

/** Génotype diploïde à un locus : deux allèles, un par chromosome homologue. */
export type Diploid<A extends string = string> = [A, A];

/** Méiose d'un locus : chaque allèle a une chance sur deux de passer dans
 * le gamète (première loi de Mendel, ségrégation). */
export function gameteAllele<A extends string>(pair: Diploid<A>, rng: Rng): A {
  return rng() < 0.5 ? pair[0] : pair[1];
}

export function isHomozygous<A extends string>(pair: Diploid<A>): boolean {
  return pair[0] === pair[1];
}

export function countAllele<A extends string>(pair: Diploid<A>, allele: A): number {
  return (pair[0] === allele ? 1 : 0) + (pair[1] === allele ? 1 : 0);
}

/** Présente la paire dans un ordre stable (allèle dominant en premier)
 * pour l'affichage — l'ordre des homologues n'a pas de sens biologique. */
export function canonicalPair<A extends string>(pair: Diploid<A>, dominant: A): Diploid<A> {
  return pair[1] === dominant && pair[0] !== dominant ? [pair[1], pair[0]] : pair;
}

// --- Traits polygéniques ---------------------------------------------------

/**
 * Trait quantitatif additif sur `nLoci` loci bialléliques : chaque locus
 * porte soit l'allèle « + » (qui ajoute son effet), soit l'allèle « 0 ».
 * Un haplotype est un tableau de 0/1 ; le score génétique est la somme
 * pondérée des allèles « + » des deux haplotypes, normalisée 0–1.
 *
 * Les effets par locus sont inégaux (quelques loci à gros effet, beaucoup
 * à petit effet), ce qui correspond mieux à l'architecture réelle des
 * traits agronomiques qu'un modèle à effets égaux.
 */
export class PolygenicTrait {
  readonly effects: number[];
  private readonly total: number;
  readonly nLoci: number;

  constructor(nLoci: number, rng: Rng) {
    this.nLoci = nLoci;
    this.effects = Array.from({ length: nLoci }, () => 0.4 + rng() * 2.1);
    this.total = this.effects.reduce((a, b) => a + b, 0) * 2;
  }

  /** Haplotype aléatoire (fréquence `freq` de l'allèle « + »). */
  randomHaplotype(rng: Rng, freq = 0.5): number[] {
    return this.effects.map(() => (rng() < freq ? 1 : 0));
  }

  /**
   * Haplotype dont le score approche `target` (0–1) : on active les loci
   * dans un ordre aléatoire jusqu'à atteindre la cible. Utilisé pour les
   * variétés fixées (les deux haplotypes identiques → lignée homozygote).
   */
  haplotypeForTarget(target: number, rng: Rng): number[] {
    const order = this.effects.map((_, i) => i).sort(() => rng() - 0.5);
    const hap = this.effects.map(() => 0);
    const goal = Math.max(0, Math.min(1, target)) * (this.total / 2);
    let acc = 0;
    for (const i of order) {
      if (acc + this.effects[i] / 2 > goal) continue;
      hap[i] = 1;
      acc += this.effects[i];
    }
    // Affinage : bascule les loci qui rapprochent le score de la cible
    // (utile pour les traits à très grande amplitude, comme le poids).
    for (let pass = 0; pass < 3; pass++) {
      for (const i of order) {
        const next = acc + (hap[i] ? -this.effects[i] : this.effects[i]);
        if (Math.abs(next - goal) < Math.abs(acc - goal)) {
          hap[i] = 1 - hap[i];
          acc = next;
        }
      }
    }
    return hap;
  }

  /** Méiose : un allèle de chaque locus tiré au hasard entre les deux
   * haplotypes parentaux (loci indépendants). */
  gamete(hapA: number[], hapB: number[], rng: Rng): number[] {
    return hapA.map((_, i) => (rng() < 0.5 ? hapA[i] : hapB[i]));
  }

  /** Valeur génétique normalisée 0–1. */
  score(hapA: number[], hapB: number[]): number {
    let s = 0;
    for (let i = 0; i < this.nLoci; i++) s += (hapA[i] + hapB[i]) * this.effects[i];
    return this.total > 0 ? s / this.total : 0;
  }

  /** Proportion de loci hétérozygotes (0 = lignée fixée). */
  heterozygosity(hapA: number[], hapB: number[]): number {
    let h = 0;
    for (let i = 0; i < this.nLoci; i++) if (hapA[i] !== hapB[i]) h++;
    return h / this.nLoci;
  }
}

// --- Identifiants ----------------------------------------------------------

export function makeIdGenerator(prefix: string) {
  let counter = 0;
  return {
    next(): string {
      counter += 1;
      return `${prefix}-${String(counter).padStart(4, '0')}`;
    },
    /** Après rechargement d'un catalogue : ne jamais réutiliser un id. */
    ensureAbove(ids: string[]) {
      for (const id of ids) {
        const m = id.match(/-(\d+)$/);
        if (m) counter = Math.max(counter, parseInt(m[1], 10));
      }
    },
  };
}
