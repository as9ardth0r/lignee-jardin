/**
 * Moteur de croisement du melon, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques du melon (Cucumis melo) :
 *  - UNE espèce, de nombreux groupes botaniques (Charentais, brodés, melons
 *    d’hiver, makuwa, melon serpent…) qui se croisent tous entre eux. Le
 *    melon ne se croise PAS avec le concombre, la pastèque ou les courges.
 *  - TYPE FLORAL gouverné par deux gènes (a, g) : monoïque (A_G_),
 *    andromonoïque (aaG_, ~2/3 des variétés : fleurs hermaphrodites à
 *    castrer avant un croisement), gynoïque (A_gg), hermaphrodite (aagg).
 *  - Pollinisé par les abeilles (semi-allogame) ; l’autofécondation à la
 *    main est facile et la dépression de consanguinité faible.
 *  - LIAISON GÉNÉTIQUE entre gènes d’un même groupe (Kosambi), positions
 *    approximatives sauf quelques paires publiées (voir loci.ts).
 *  - Pléiotropies modélisées : l’allèle monoïque A allonge le fruit ;
 *    suc/suc ajoute des sucres ; al/al (non climactérique) allonge la
 *    conservation.
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { LOCUS_BY_ID, LOCUS_IDS, MELON_LOCI, VARIANT_ALLELE, type MelonGroup, type MelonLocusId, type VariantId } from './loci';
import type { MelonVariety } from './varieties';

export type QuantTraitId = 'weight' | 'fruits' | 'days' | 'brix' | 'storage' | 'shape';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'fruits', 'days', 'brix', 'storage', 'shape'];
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'brix', 'days', 'storage'];

const POLY_LOCI: Record<QuantTraitId, number> = { weight: 18, fruits: 10, days: 10, brix: 12, storage: 12, shape: 14 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Poids moyen d’un fruit (kg). */
  weight: { min: 0.05, max: 8, log: true, noise: 0.015, digits: 2 },
  /** Fruits récoltés par plante. */
  fruits: { min: 1, max: 12, log: true, noise: 0.06, digits: 0 },
  /** Jours de la plantation à la première récolte. */
  days: { min: 50, max: 130, noise: 0.04, digits: 0 },
  /** Sucres de la chair (°Brix). */
  brix: { min: 3, max: 17, noise: 0.03, digits: 1 },
  /** Conservation après récolte (jours). */
  storage: { min: 1, max: 150, log: true, noise: 0.03, digits: 0 },
  /** Forme : rapport longueur / diamètre. */
  shape: { min: 0.6, max: 8, log: true, noise: 0.02, digits: 2 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof MelonPhenotype> = {
  weight: 'weightKg',
  fruits: 'fruits',
  days: 'days',
  brix: 'brix',
  storage: 'storageDays',
  shape: 'shapeRatio',
};

const MAX_HETEROSIS = 0.15;
/** Effets pléiotropes. */
const MONOECIOUS_ELONGATION = 1.3;
const SUC_BRIX_BONUS = 2.5;
/** al/al (non climactérique) : conservation ×3. */
const NONCLIMACTERIC_STORAGE_FACTOR = 3;

export type MelonGenotype = Record<MelonLocusId, Diploid<string>>;

export interface MelonPhenotype {
  weightKg: number;
  fruits: number;
  days: number;
  brix: number;
  storageDays: number;
  shapeRatio: number;
}

export interface MelonIndividual {
  crop: 'melon';
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  selfed: boolean;
  varietyId?: string;
  /** Groupe botanique (conservé tant que les deux parents sont du même groupe). */
  group?: MelonGroup;
  hybridFounder?: boolean;
  genotype: MelonGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: MelonPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: MelonJournalEntry[];
}

export type MelonStage = 'sowing' | 'emergence' | 'planting' | 'pinching' | 'maleFlowers' | 'femaleFlowers' | 'fruitset' | 'netting' | 'harvest' | 'seeds';
export const MELON_STAGES: MelonStage[] = ['sowing', 'emergence', 'planting', 'pinching', 'maleFlowers', 'femaleFlowers', 'fruitset', 'netting', 'harvest', 'seeds'];

export interface MelonJournalEntry {
  id: string;
  date: number;
  stage?: MelonStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  brix?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type FleshColor = 'orange' | 'green' | 'white';
export type RindColor = 'green' | 'yellow' | 'cream';
export type FruitShape = 'flat' | 'round' | 'oval' | 'elongated' | 'snake';
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';
export type SexType = 'monoecious' | 'andromonoecious' | 'gynoecious' | 'hermaphrodite';

export interface FruitAppearance {
  flesh: FleshColor;
  rind: RindColor;
  netted: boolean;
  sutures: boolean;
  mottled: boolean;
  striped: boolean;
  shape: FruitShape;
  ratio: number;
  slips: boolean;
  sour: boolean;
  bitter: boolean;
  sweet: boolean;
  whiteSeeds: boolean;
  sex: SexType;
}

export interface TheoreticalRatio {
  variant: VariantId;
  pExpressed: number;
}

const LINKAGE_GROUPS: MelonLocusId[][] = (() => {
  const m = new Map<number, MelonLocusId[]>();
  for (const l of MELON_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: MelonLocusId[] = MELON_LOCI.filter((l) => !l.chromosome).map((l) => l.id);

export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

export class MelonEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('MEL');

  constructor(seed = 20260930) {
    const traitRng = mulberry32(seed + 11);
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
    if (trait === 'weight') {
      const d = v < 1 ? 2 : 1;
      return Math.round(v * 10 ** d) / 10 ** d;
    }
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

  unitOf(trait: QuantTraitId, ind: MelonIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  yieldKg(ind: MelonIndividual): number {
    return Math.round(ind.pheno.weightKg * ind.pheno.fruits * 10) / 10;
  }

  // --- Construction ------------------------------------------------------------

  private computePhenotype(genotype: MelonGenotype, haps: MelonIndividual['haps']): MelonPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const het = this.polygenicHeterozygosity(haps);
    const fruits = Math.max(1, Math.round(this.fromUnit('fruits', value('fruits')) * (1 + MAX_HETEROSIS * het)));
    let brix = this.fromUnit('brix', value('brix'));
    if (this.has(genotype, 'suc')) brix = Math.min(TRAIT_SCALE.brix.max + 2, Math.round((brix + SUC_BRIX_BONUS) * 10) / 10);
    let storageDays = this.fromUnit('storage', value('storage'));
    if (this.has(genotype, 'al')) storageDays = Math.round(storageDays * NONCLIMACTERIC_STORAGE_FACTOR);
    let shapeRatio = this.fromUnit('shape', value('shape'));
    if (!this.has(genotype, 'a')) shapeRatio = Math.round(shapeRatio * MONOECIOUS_ELONGATION * 100) / 100;
    return {
      weightKg: this.round('weight', this.fromUnit('weight', value('weight')) * (1 + 0.5 * MAX_HETEROSIS * het)),
      fruits,
      days: this.fromUnit('days', value('days')),
      brix,
      storageDays,
      shapeRatio,
    };
  }

  private build(
    genotype: MelonGenotype,
    haps: MelonIndividual['haps'],
    meta: Pick<MelonIndividual, 'label' | 'generation' | 'parentIds' | 'selfed'> & Partial<Pick<MelonIndividual, 'varietyId' | 'group' | 'hybridFounder'>>
  ): MelonIndividual {
    return { crop: 'melon', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(genotype, haps), createdAt: Date.now() };
  }

  /** Valeurs cibles (unités réelles) d’une variété, corrigées des pléiotropies. */
  varietyTargets(v: MelonVariety): Record<QuantTraitId, number> {
    const g = this.genotypeFromVariants(v.variants);
    return {
      weight: v.weightKg,
      fruits: v.fruits,
      days: v.days,
      brix: this.has(g, 'suc') ? v.brix - SUC_BRIX_BONUS : v.brix,
      storage: Math.max(TRAIT_SCALE.storage.min, this.has(g, 'al') ? v.storageDays / NONCLIMACTERIC_STORAGE_FACTOR : v.storageDays),
      shape: this.has(g, 'a') ? v.shapeRatio : v.shapeRatio / MONOECIOUS_ELONGATION,
    };
  }

  createFromVariety(v: MelonVariety, label?: string): MelonIndividual {
    const genotype = this.genotypeFromVariants(v.variants);
    const meta = { label: label || v.name, generation: 0, parentIds: null, selfed: false, varietyId: v.id, group: v.group } as const;
    if (v.haps) {
      const haps = {} as MelonIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, meta);
    }
    const targets = this.varietyTargets(v);
    const haps = {} as MelonIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      let tv = targets[trait];
      if (v.hybrid && trait === 'fruits') tv = tv / (1 + MAX_HETEROSIS * 0.5);
      const u = this.toUnit(trait, tv);
      if (v.hybrid) haps[trait] = [this.traits[trait].haplotypeForTarget(u + 0.08, this.rng), this.traits[trait].haplotypeForTarget(u - 0.08, this.rng)];
      else {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      }
    }
    if (v.hybrid) {
      // F1 du commerce : résistances dominantes apportées par un seul parent ;
      // Charentais F1 monoïques : A apporté par un parent, l’autre andromonoïque.
      for (const def of MELON_LOCI) {
        const pair = genotype[def.id];
        const dom = def.alleles[0];
        if (def.category === 'resistance' && dom.id && pair[0] === dom.allele && def.standard !== dom.allele) {
          genotype[def.id] = this.rng() < 0.5 ? [pair[0], def.standard] : [def.standard, pair[0]];
        }
      }
      if (genotype.a[0] === 'A') genotype.a = this.rng() < 0.5 ? ['A', 'a'] : ['a', 'A'];
      return this.build(genotype, haps, { ...meta, hybridFounder: true });
    }
    return this.build(genotype, haps, meta);
  }

  createCustom(opts: { label: string; group?: MelonGroup; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>> }): MelonIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as MelonIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, group: opts.group });
  }

  /** Bouture de tige : copie génétique exacte. */
  cloneOf(ind: MelonIndividual, label?: string): MelonIndividual {
    const haps = {} as MelonIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as MelonGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (bouture)`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      hybridFounder: ind.hybridFounder,
      group: ind.group,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  fixedVariants(ind: MelonIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of MELON_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  /** Gamète : un chromosome de chaque paire, crossing-over entre loci liés. */
  gamete(ind: MelonIndividual): Record<MelonLocusId, string> {
    const g = {} as Record<MelonLocusId, string>;
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

  /** Croisement (a = mère) × b (père), ou autofécondation (a × a). Une
   * plante gynoïque n’a pas de fleurs mâles : elle ne peut ni s’autoféconder
   * ni servir de père. */
  canPollinate(ind: MelonIndividual): boolean {
    return this.sexType(ind) !== 'gynoecious';
  }

  cross(a: MelonIndividual, b: MelonIndividual, n: number, labelPrefix?: string): MelonIndividual[] {
    if (!this.canPollinate(b)) return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const group = a.group && a.group === b.group ? a.group : undefined;
    const out: MelonIndividual[] = [];
    for (let k = 0; k < n; k++) {
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as MelonGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as MelonIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const t = this.traits[trait];
        haps[trait] = [t.gamete(a.haps[trait][0], a.haps[trait][1], this.rng), t.gamete(b.haps[trait][0], b.haps[trait][1], this.rng)];
      }
      out.push(this.build(genotype, haps, { label: `${prefix} #${k + 1}`, generation, parentIds: [a.id, b.id], selfed, group }));
    }
    return out;
  }

  // --- Lecture du génotype ---------------------------------------------------------

  expressedAllele(g: MelonGenotype, locus: MelonLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: MelonGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: MelonGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: MelonGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): MelonGenotype {
    const g = {} as MelonGenotype;
    for (const locus of MELON_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      if (g[locus][0] === LOCUS_BY_ID[locus].standard) g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: MelonIndividual): MelonIndividual {
    const missingLoci = MELON_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    if (!missingLoci.length && !missingTraits.length) return ind;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) {
      const h = this.traits[t].haplotypeForTarget(0.5, this.rng);
      haps[t] = [h, [...h]];
    }
    return { ...ind, genotype, haps, pheno: { ...this.computePhenotype(genotype, haps), ...ind.pheno } };
  }

  sexTypeOf(g: MelonGenotype): SexType {
    const andro = this.has(g, 'a');
    const gyno = this.has(g, 'g');
    return andro ? (gyno ? 'hermaphrodite' : 'andromonoecious') : gyno ? 'gynoecious' : 'monoecious';
  }

  sexType(ind: MelonIndividual): SexType {
    return this.sexTypeOf(ind.genotype);
  }

  /** Les fleurs qui portent les fruits ont-elles des étamines (castration nécessaire) ? */
  needsEmasculation(ind: MelonIndividual): boolean {
    return this.has(ind.genotype, 'a');
  }

  appearance(ind: MelonIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.pheno.shapeRatio);
  }

  appearanceFromVariety(v: Pick<MelonVariety, 'variants' | 'shapeRatio'>): FruitAppearance {
    return this.appearanceOf(this.genotypeFromVariants(v.variants), v.shapeRatio);
  }

  appearanceOf(g: MelonGenotype, ratio: number): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const flesh: FleshColor = has('gf') ? 'green' : has('wf') ? 'white' : 'orange';
    const rind: RindColor = has('Y') ? 'yellow' : has('w') ? 'cream' : 'green';
    const shape: FruitShape = ratio < 0.85 ? 'flat' : ratio < 1.15 ? 'round' : ratio < 1.6 ? 'oval' : ratio < 3 ? 'elongated' : 'snake';
    return {
      flesh,
      rind,
      netted: has('Rn'),
      sutures: has('s'),
      mottled: has('Mt'),
      striped: has('st'),
      shape,
      ratio,
      slips: !has('al'),
      sour: has('So'),
      bitter: has('Bif'),
      sweet: has('suc'),
      whiteSeeds: has('Wt'),
      sex: this.sexTypeOf(g),
    };
  }

  isBitter(ind: MelonIndividual) {
    return this.has(ind.genotype, 'Bif');
  }

  isSour(ind: MelonIndividual) {
    return this.has(ind.genotype, 'So');
  }

  resistances(ind: MelonIndividual): VariantId[] {
    return MELON_LOCI.filter((l) => l.category === 'resistance')
      .flatMap((l) => l.alleles.filter((a) => a.id && this.has(ind.genotype, a.id)).map((a) => a.id!))
      .filter((id) => id !== undefined);
  }

  /** Code catalogue façon sachet (« Fom 0,1,2 · Px · Ag »). */
  resistanceCode(ind: MelonIndividual): string {
    const r = new Set(this.resistances(ind));
    const races = new Set<string>();
    if (r.has('Fom1')) ['0', '2'].forEach((x) => races.add(x));
    if (r.has('Fom2')) ['0', '1'].forEach((x) => races.add(x));
    const parts: string[] = [];
    if (races.size) parts.push(`Fom ${[...races].sort().join(',')}`);
    if (r.has('Pmw')) parts.push('Px 1,2,3');
    else if (r.has('Pm1')) parts.push('Px 1');
    if (r.has('Vat')) parts.push('Ag');
    if (r.has('Zym')) parts.push('ZYMV');
    if (r.has('Prv')) parts.push('PRSV');
    if (r.has('nsv')) parts.push('MNSV');
    return parts.join(' · ');
  }

  sizeClass(ind: MelonIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightKg);
  }

  // --- Fixation --------------------------------------------------------------------

  mendelianHeterozygosity(ind: MelonIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: MelonIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: MelonIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: MelonIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: MelonIndividual): MelonLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ---------------------------------------------------------

  predict(a: MelonIndividual, b: MelonIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    for (const def of MELON_LOCI) {
      const pa = a.genotype[def.id];
      const pb = b.genotype[def.id];
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!pa.includes(al.allele) && !pb.includes(al.allele)) continue;
        let p = 0;
        for (const x of pa)
          for (const y of pb) {
            const g = { ...a.genotype, [def.id]: [x, y] } as MelonGenotype;
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

  genotypeCode(ind: MelonIndividual): string {
    const parts: string[] = [];
    for (const def of MELON_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.length ? parts.join(' ') : '+';
  }
}

export function sizeClassOf(kg: number): SizeClass {
  return kg < 0.5 ? 'mini' : kg < 1 ? 'small' : kg < 2 ? 'medium' : kg < 4 ? 'large' : 'giant';
}
