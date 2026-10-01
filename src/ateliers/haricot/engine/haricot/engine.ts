/**
 * Moteur de croisement des haricots, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques des haricots (Phaseolus) :
 *  - fleurs HERMAPHRODITES ; chez le haricot commun, le pollen tombe sur le
 *    stigmate la veille de l’ouverture (autogamie quasi totale, 1 à 3 %
 *    de croisements au jardin). Pour croiser, il faut castrer le jeune
 *    bouton. Le haricot d’Espagne, lui, a besoin des bourdons pour « déclencher »
 *    ses fleurs et se croise beaucoup (30 % et plus) ;
 *  - CINQ ESPÈCES (vulgaris, coccineus, dumosus, acutifolius, lunatus),
 *    séparées par des barrières (voir compat.ts) ; la MÈRE porte le fruit et
 *    le sens compte ;
 *  - COULEUR DE LA GRAINE : P épistatique, puis V, G, B, R (voir loci.ts) ;
 *  - PLÉIOTROPIE : le gène fin (port nain) raccourcit toute la plante ;
 *  - LIAISONS : les gènes portés par le même chromosome se transmettent
 *    ensemble, sauf crossing-over (fonction de Kosambi) — B et I, à 1 cM,
 *    ne se séparent presque jamais.
 *
 * Traits quantitatifs (phénotype = valeur génétique + bruit environnemental
 * tiré une fois à la naissance) : poids de 100 graines, longueur des
 * gousses, gousses par plante, jours du semis aux premières gousses,
 * hauteur de la plante.
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossCompat } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, BEAN_LOCI, VARIANT_ALLELE, type BeanLocusId, type SpeciesId, type VariantId } from './loci';
import type { BeanVariety } from './varieties';

export type QuantTraitId = 'seed' | 'podLength' | 'pods' | 'days' | 'height';
export const QUANT_TRAITS: QuantTraitId[] = ['seed', 'podLength', 'pods', 'days', 'height'];
/** Traits affichés sur les cartes (les autres sur la fiche). */
export const MAIN_TRAITS: QuantTraitId[] = ['seed', 'podLength', 'days', 'pods'];

const POLY_LOCI: Record<QuantTraitId, number> = { seed: 18, podLength: 14, pods: 12, days: 12, height: 10 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Poids de 100 graines sèches (g) : 10 g (tépari) à 250 g (haricot d’Espagne). */
  seed: { min: 8, max: 260, log: true, noise: 0.015, digits: 0 },
  /** Longueur des gousses (cm). */
  podLength: { min: 5, max: 50, log: true, noise: 0.02, digits: 0 },
  /** Gousses récoltées par plante. */
  pods: { min: 5, max: 150, log: true, noise: 0.04, digits: 0 },
  /** Jours du semis aux premières gousses mangeables. */
  days: { min: 40, max: 120, noise: 0.03, digits: 0 },
  /** Hauteur potentielle de la plante (cm), avant l’effet du gène fin. */
  height: { min: 30, max: 450, log: true, noise: 0.03, digits: 0 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof BeanPhenotype> = {
  seed: 'seed100',
  podLength: 'podCm',
  pods: 'pods',
  days: 'days',
  height: 'heightCm',
};

/** Bonus de rendement maximal d’un individu totalement hétérozygote (faible chez le haricot). */
const MAX_HETEROSIS = 0.08;
/** Pléiotropie : le port nain (fin/fin) raccourcit la plante. */
const BUSH_HEIGHT_FACTOR = 0.2;
/** Graines par gousse, selon l’espèce. */
export const SEEDS_PER_POD: Record<SpeciesId, number> = { vulgaris: 5, coccineus: 4, dumosus: 4, acutifolius: 5, lunatus: 3 };

export type BeanGenotype = Record<BeanLocusId, Diploid<string>>;

export interface BeanPhenotype {
  /** Poids de 100 graines (g). */
  seed100: number;
  podCm: number;
  pods: number;
  days: number;
  heightCm: number;
}

export interface BeanIndividual {
  crop: 'haricot';
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility: number;
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  selfed: boolean;
  varietyId?: string;
  hybridFounder?: boolean;
  genotype: BeanGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: BeanPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: BeanJournalEntry[];
}

export type BeanStage = 'sowing' | 'emergence' | 'firstLeaves' | 'staking' | 'flowering' | 'pods' | 'greenHarvest' | 'shellHarvest' | 'dryHarvest' | 'seeds';
export const BEAN_STAGES: BeanStage[] = ['sowing', 'emergence', 'firstLeaves', 'staking', 'flowering', 'pods', 'greenHarvest', 'shellHarvest', 'dryHarvest', 'seeds'];

export interface BeanJournalEntry {
  id: string;
  date: number;
  stage?: BeanStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type SeedColor = 'white' | 'black' | 'violet' | 'red' | 'brown' | 'olive' | 'yellow' | 'buff';
export const SEED_COLORS: SeedColor[] = ['white', 'black', 'violet', 'red', 'brown', 'olive', 'yellow', 'buff'];
export type SeedPattern = 'plain' | 'marbled' | 'eye';
export const SEED_PATTERNS: SeedPattern[] = ['plain', 'marbled', 'eye'];
export type PodColor = 'green' | 'yellow' | 'purple';
export const POD_COLORS: PodColor[] = ['green', 'yellow', 'purple'];
export type FlowerColor = 'white' | 'purple' | 'lilac' | 'scarlet' | 'bicolor' | 'greenish';
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';

export interface FruitAppearance {
  seed: SeedColor;
  pattern: SeedPattern;
  pod: PodColor;
  /** Gousse striée (Cst). */
  podStreaked: boolean;
  stringless: boolean;
  bush: boolean;
  flower: FlowerColor;
  species: SpeciesId;
}

export interface TheoreticalRatio {
  variant: VariantId;
  pExpressed: number;
}

export interface CrossCheck extends Omit<CrossCompat, 'reason'> {
  reason: string;
  sterileParent?: 'a' | 'b';
  effectiveSeedSet: number;
}

export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

const LINKAGE_GROUPS: BeanLocusId[][] = (() => {
  const m = new Map<number, BeanLocusId[]>();
  for (const l of BEAN_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: BeanLocusId[] = BEAN_LOCI.filter((l) => !l.chromosome).map((l) => l.id);

export function sizeClassOf(seed100: number): SizeClass {
  return seed100 < 20 ? 'mini' : seed100 < 30 ? 'small' : seed100 < 45 ? 'medium' : seed100 < 80 ? 'large' : 'giant';
}

export class BeanEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('HAR');

  constructor(seed = 20261001) {
    const traitRng = mulberry32(seed + 17);
    this.traits = {} as Record<QuantTraitId, PolygenicTrait>;
    for (const t of QUANT_TRAITS) this.traits[t] = new PolygenicTrait(POLY_LOCI[t], traitRng);
    this.rng = mulberry32(seed ^ Date.now());
  }

  reseed(seed: number) {
    this.rng = mulberry32(seed);
  }

  ensureIdsAbove(ids: string[]) {
    this.ids.ensureAbove(ids);
  }

  // --- Échelles ------------------------------------------------------------

  private toUnit(trait: QuantTraitId, value: number): number {
    const s = TRAIT_SCALE[trait];
    if (s.log) return (Math.log(Math.max(value, s.min * 0.5)) - Math.log(s.min)) / (Math.log(s.max) - Math.log(s.min));
    return (value - s.min) / (s.max - s.min);
  }

  private round(trait: QuantTraitId, v: number): number {
    const k = 10 ** TRAIT_SCALE[trait].digits;
    return Math.round(v * k) / k;
  }

  private fromUnit(trait: QuantTraitId, unit: number): number {
    const s = TRAIT_SCALE[trait];
    const u = Math.max(0, Math.min(1, unit));
    const v = s.log ? Math.exp(Math.log(s.min) + u * (Math.log(s.max) - Math.log(s.min))) : s.min + u * (s.max - s.min);
    return this.round(trait, v);
  }

  unitOfValue(trait: QuantTraitId, value: number): number {
    return Math.max(0, Math.min(1, this.toUnit(trait, value)));
  }

  unitOf(trait: QuantTraitId, ind: BeanIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Rendement en grains secs par plante (kg) = gousses × graines/gousse × poids d’une graine. */
  yieldKg(ind: BeanIndividual): number {
    const g = ind.pheno.pods * SEEDS_PER_POD[ind.species] * (ind.pheno.seed100 / 100);
    return Math.round(g) / 1000;
  }

  /** Rendement en gousses vertes par plante (kg), ordre de grandeur. */
  greenYieldKg(ind: BeanIndividual): number {
    const podG = 0.35 * ind.pheno.podCm * Math.sqrt(ind.pheno.seed100 / 35);
    return Math.round(ind.pheno.pods * podG) / 1000;
  }

  // --- Construction ----------------------------------------------------------

  private computePhenotype(genotype: BeanGenotype, haps: BeanIndividual['haps']): BeanPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const het = this.polygenicHeterozygosity(haps);
    const pods = Math.max(1, Math.round(this.fromUnit('pods', value('pods')) * (1 + MAX_HETEROSIS * het)));
    const height = this.fromUnit('height', value('height'));
    return {
      seed100: this.fromUnit('seed', value('seed')),
      podCm: this.fromUnit('podLength', value('podLength')),
      pods,
      days: this.fromUnit('days', value('days')),
      heightCm: this.has(genotype, 'fin') ? Math.max(25, Math.round(height * BUSH_HEIGHT_FACTOR)) : height,
    };
  }

  private build(
    genotype: BeanGenotype,
    haps: BeanIndividual['haps'],
    meta: Pick<BeanIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility'> & Partial<Pick<BeanIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder'>>
  ): BeanIndividual {
    return { crop: 'haricot', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(genotype, haps), createdAt: Date.now() };
  }

  /** Valeurs cibles d’une variété ; la hauteur d’une variété naine est « dépliée » (pléiotropie fin). */
  varietyTargets(v: BeanVariety): Record<QuantTraitId, number> {
    return {
      seed: v.seed100,
      podLength: v.podCm,
      pods: v.pods,
      days: v.days,
      height: v.variants.includes('fin') ? v.heightCm / BUSH_HEIGHT_FACTOR : v.heightCm,
    };
  }

  createFromVariety(v: BeanVariety, label?: string): BeanIndividual {
    const genotype = this.genotypeFromVariants(v.variants);
    const meta = { label: label || v.name, generation: 0, parentIds: null, selfed: false, varietyId: v.id, species: v.species, fertility: v.fertility ?? 1 } as const;
    if (v.haps) {
      const haps = {} as BeanIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, { ...meta, hybridWith: v.hybridWith });
    }
    const targets = this.varietyTargets(v);
    const haps = {} as BeanIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      let tv = targets[trait];
      if (v.hybrid && trait === 'pods') tv = tv / (1 + MAX_HETEROSIS * 0.5);
      const u = this.toUnit(trait, tv);
      if (v.hybrid) haps[trait] = [this.traits[trait].haplotypeForTarget(u + 0.06, this.rng), this.traits[trait].haplotypeForTarget(u - 0.06, this.rng)];
      else {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      }
    }
    if (v.hybrid) {
      for (const def of BEAN_LOCI) {
        const pair = genotype[def.id];
        const expressed = def.alleles.find((a) => a.allele === pair[0]);
        const dominantVariant = expressed?.id && def.alleles.indexOf(expressed) < def.alleles.findIndex((a) => a.allele === def.standard);
        if (dominantVariant && def.category === 'resistance') genotype[def.id] = this.rng() < 0.5 ? [pair[0], def.standard] : [def.standard, pair[0]];
      }
      return this.build(genotype, haps, { ...meta, hybridFounder: true, hybridWith: v.hybridWith });
    }
    return this.build(genotype, haps, { ...meta, hybridWith: v.hybridWith });
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>> }): BeanIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as BeanIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1 });
  }

  /** Bouture (rare chez le haricot, mais possible) : copie génétique exacte. */
  cloneOf(ind: BeanIndividual, label?: string): BeanIndividual {
    const haps = {} as BeanIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as BeanGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (bouture)`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      hybridFounder: ind.hybridFounder,
      species: ind.species,
      hybridWith: ind.hybridWith,
      fertility: ind.fertility,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  fixedVariants(ind: BeanIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of BEAN_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: BeanIndividual): Record<BeanLocusId, string> {
    const g = {} as Record<BeanLocusId, string>;
    for (const group of LINKAGE_GROUPS) {
      let strand = this.rng() < 0.5 ? 0 : 1;
      let prev = -1;
      for (const id of group) {
        const cM = LOCUS_BY_ID[id].cM;
        if (prev >= 0 && this.rng() < kosambi(cM - prev)) strand = 1 - strand;
        g[id] = ind.genotype[id][strand];
        prev = cM;
      }
    }
    for (const id of UNLINKED) g[id] = gameteAllele(ind.genotype[id], this.rng);
    return g;
  }

  // --- Fleurs et barrières de croisement -------------------------------------

  canPollinate(ind: BeanIndividual): boolean {
    return ind.fertility > 0.001;
  }

  /** Les fleurs de haricot sont hermaphrodites : on castre toujours la mère. */
  needsEmasculation(_ind: BeanIndividual): boolean {
    return true;
  }

  /** Part des fleurs croisées par les insectes au jardin. */
  outcrossingRate(ind: BeanIndividual): number {
    return ind.species === 'coccineus' ? 0.35 : ind.species === 'dumosus' ? 0.2 : ind.species === 'lunatus' ? 0.1 : 0.02;
  }

  crossCheck(a: BeanIndividual, b: BeanIndividual): CrossCheck {
    const compat = speciesCompat(a.species, b.species);
    if (a.fertility <= 0.001) return { ...compat, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...compat, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    const effectiveSeedSet = compat.level === 'blocked' ? 0 : compat.seedSet * Math.sqrt(a.fertility * b.fertility);
    const level = compat.level === 'same' && effectiveSeedSet < 0.999 ? 'difficult' : compat.level;
    return { ...compat, level, reason: compat.level === 'same' && level === 'difficult' ? 'lowFertility' : compat.reason, effectiveSeedSet };
  }

  cross(a: BeanIndividual, b: BeanIndividual, n: number, labelPrefix?: string): BeanIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const interspecific = a.species !== b.species;
    const hybridWith = interspecific ? b.species : a.hybridWith ?? b.hybridWith;
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const fertility = interspecific ? check.f1Fertility : parentsFert >= 0.999 ? 1 : Math.min(1, parentsFert + (1 - parentsFert) * 0.35);
    const out: BeanIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as BeanGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as BeanIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const t = this.traits[trait];
        haps[trait] = [t.gamete(a.haps[trait][0], a.haps[trait][1], this.rng), t.gamete(b.haps[trait][0], b.haps[trait][1], this.rng)];
      }
      k++;
      out.push(
        this.build(genotype, haps, {
          label: `${prefix} #${k}`,
          generation,
          parentIds: [a.id, b.id],
          selfed,
          species: a.species,
          hybridWith: hybridWith && hybridWith !== a.species ? hybridWith : undefined,
          fertility,
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: BeanGenotype, locus: BeanLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: BeanGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: BeanGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: BeanGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): BeanGenotype {
    const g = {} as BeanGenotype;
    for (const locus of BEAN_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      if (g[locus][0] === LOCUS_BY_ID[locus].standard) g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: BeanIndividual): BeanIndividual {
    const missingLoci = BEAN_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: BeanIndividual = { ...ind, crop: 'haricot', fertility: ind.fertility ?? 1 };
    if (!missingLoci.length && !missingTraits.length) return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) {
      const h = this.traits[t].haplotypeForTarget(0.5, this.rng);
      haps[t] = [h, [...h]];
    }
    return { ...base, genotype, haps, pheno: { ...this.computePhenotype(genotype, haps), ...ind.pheno } };
  }

  appearance(ind: BeanIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.species);
  }

  appearanceFromVariety(v: Pick<BeanVariety, 'variants' | 'species'>): FruitAppearance {
    return this.appearanceOf(this.genotypeFromVariants(v.variants), v.species);
  }

  /** Couleur et motif de la graine, couleur de la gousse et de la fleur. */
  appearanceOf(g: BeanGenotype, sp: SpeciesId): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const P = !has('p');
    const V = !has('v');
    const G = has('G');
    const B = has('B');
    let seed: SeedColor;
    if (!P) seed = 'white';
    else if (V) seed = G && B ? 'black' : 'violet';
    else if (has('R')) seed = 'red';
    else seed = G && B ? 'brown' : G ? 'yellow' : B ? 'olive' : 'buff';
    const pattern: SeedPattern = !P ? 'plain' : has('t') ? 'eye' : has('Cst') ? 'marbled' : 'plain';
    const pod: PodColor = has('Prp') && P ? 'purple' : has('y') ? 'yellow' : 'green';
    let flower: FlowerColor;
    if (sp === 'coccineus') flower = !P ? 'white' : V ? 'scarlet' : 'bicolor';
    else if (sp === 'lunatus') flower = 'greenish';
    else if (!P || !V) flower = 'white';
    else flower = has('t') || sp === 'dumosus' ? 'lilac' : 'purple';
    return { seed, pattern, pod, podStreaked: has('Cst') && P, stringless: has('St'), bush: has('fin'), flower, species: sp };
  }

  resistances(ind: BeanIndividual): VariantId[] {
    return (['I', 'bc3', 'Co2', 'Ur3', 'Pse1'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  /** Code catalogue (« HR: BCMV/BCMNV, Cl / IR: Psp »). */
  resistanceCode(ind: BeanIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    if (r.has('bc3')) parts.push('BCMV/BCMNV');
    else if (r.has('I')) parts.push('BCMV');
    if (r.has('Co2')) parts.push('Cl');
    if (r.has('Ur3')) parts.push('Ua');
    if (r.has('Pse1')) parts.push('Psp');
    return parts.join(' · ');
  }

  sizeClass(ind: BeanIndividual): SizeClass {
    return sizeClassOf(ind.pheno.seed100);
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: BeanIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: BeanIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: BeanIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: BeanIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: BeanIndividual): BeanLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  predict(a: BeanIndividual, b: BeanIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    for (const def of BEAN_LOCI) {
      const pa = a.genotype[def.id];
      const pb = b.genotype[def.id];
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!pa.includes(al.allele) && !pb.includes(al.allele)) continue;
        let p = 0;
        for (const x of pa)
          for (const y of pb) {
            const g = { ...a.genotype, [def.id]: [x, y] } as BeanGenotype;
            if (this.has(g, al.id)) p += 0.25;
          }
        const inA = this.has(a.genotype, al.id);
        const inB = this.has(b.genotype, al.id);
        if ((p > 0 && p < 1) || inA !== inB) out.push({ variant: al.id, pExpressed: p });
      }
    }
    return out;
  }

  variantLabel(id: VariantId): string {
    const v = VARIANT_ALLELE[id][1];
    return `${v}/${v}`;
  }

  genotypeCode(ind: BeanIndividual): string {
    const parts: string[] = [];
    for (const def of BEAN_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.length ? parts.join(' ') : '+';
  }
}
