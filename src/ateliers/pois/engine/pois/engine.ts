/**
 * Moteur de croisement du pois, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques :
 *  - AUTOGAMIE et CLÉISTOGAMIE : la fleur s’autoféconde dans le bouton ;
 *    l’autofécondation est la règle (moins de 1 % de croisements au
 *    jardin). Pour croiser, on castre le bouton à la pince (Mendel) ;
 *  - CARACTÈRES DE LA GRAINE : forme (R) et couleur des cotylédons (I)
 *    appartiennent à l’EMBRYON, donc à la génération suivante : on les lit
 *    sur les graines récoltées, comme Mendel (5 474 rondes / 1 850 ridées).
 *    Le TÉGUMENT, lui, est un tissu de la mère : chez une mère A (fleurs
 *    pourpres), il est gris-brun et cache la couleur des cotylédons ;
 *  - LIAISON sur les chromosomes (Kosambi), dont Le–V à ~12 cM ;
 *  - Le nain (le) raccourcit tous les entrenœuds : la hauteur combine ce
 *    gène majeur et un fond polygénique.
 *
 * Traits quantitatifs : graines par plante (g), jours jusqu’à la récolte,
 * hauteur, poids de 100 graines.
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossLevel } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, PS_LOCI, VARIANT_ALLELE, type PsLocusId, type SpeciesId, type VariantId } from './loci';
import type { PsVariety } from './varieties';

export type QuantTraitId = 'weight' | 'days' | 'height' | 'seed';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'days', 'height', 'seed'];
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'days', 'height', 'seed'];

const POLY_LOCI: Record<QuantTraitId, number> = { weight: 22, days: 20, height: 16, seed: 18 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Graines par plante (g, à maturité). */
  weight: { min: 3, max: 160, log: true, noise: 0.012, digits: 0 },
  /** Jours du semis à la récolte. */
  days: { min: 45, max: 230, noise: 0.012, digits: 0 },
  /** Hauteur « génétique de fond » (cm), avant l’effet du gène le. */
  height: { min: 40, max: 300, log: true, noise: 0.015, digits: 0 },
  /** Poids de 100 graines sèches (g). */
  seed: { min: 6, max: 50, log: true, noise: 0.012, digits: 0 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof PsPhenotype> = {
  weight: 'weightG',
  days: 'days',
  height: 'heightCm',
  seed: 'seed100',
};

/** Un pois nain (le/le) n’atteint qu’environ 30 % de la hauteur d’un pois à rames. */
export const DWARF_FACTOR = 0.3;
/** Bonus de vigueur des hybrides (faible chez une plante autogame). */
const MAX_HETEROSIS = 0.12;

export type SeedCoat = 'clear' | 'grey';
export type PsGenotype = Record<PsLocusId, Diploid<string>>;

export interface PsPhenotype {
  weightG: number;
  days: number;
  heightCm: number;
  seed100: number;
}

export interface PsIndividual {
  crop: 'pois';
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
  /** Tégument de la graine dont la plante est née (tissu de sa mère). */
  seedCoat: SeedCoat;
  genotype: PsGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: PsPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: PsJournalEntry[];
}

export type PsStage = 'sowing' | 'emergence' | 'tendrils' | 'flowering' | 'pods' | 'greenPeas' | 'dry' | 'harvest' | 'threshing' | 'seeds';
export const PS_STAGES: PsStage[] = ['sowing', 'emergence', 'tendrils', 'flowering', 'pods', 'greenPeas', 'dry', 'harvest', 'threshing', 'seeds'];

export interface PsJournalEntry {
  id: string;
  date: number;
  stage?: PsStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type SeedShape = 'round' | 'wrinkled';
export type Cotyledon = 'yellow' | 'green';
export type FlowerColor = 'purple' | 'white' | 'tawny';
export type PodType = 'shelling' | 'snow' | 'snap';
export const POD_TYPES: PodType[] = ['shelling', 'snow', 'snap'];
export type LeafType = 'normal' | 'afila' | 'acacia' | 'parsley';
export const LEAF_TYPES: LeafType[] = ['normal', 'afila', 'acacia', 'parsley'];
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';

export interface FruitAppearance {
  seedShape: SeedShape;
  cotyledon: Cotyledon;
  flower: FlowerColor;
  /** Tégument des graines que cette plante PORTE (son propre gène A). */
  coat: SeedCoat;
  pod: PodType;
  podColor: 'green' | 'yellow';
  terminal: boolean;
  dwarf: boolean;
  leaf: LeafType;
  winter: boolean;
  species: SpeciesId;
}

export interface TheoreticalRatio {
  variant: VariantId;
  pExpressed: number;
}

export interface CrossCheck {
  level: CrossLevel;
  seedSet: number;
  reason: string;
  uncertain?: boolean;
  sterileParent?: 'a' | 'b';
  effectiveSeedSet: number;
  f1Fertility: number;
}

export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

const LINKAGE_GROUPS: PsLocusId[][] = (() => {
  const m = new Map<number, PsLocusId[]>();
  for (const l of PS_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: PsLocusId[] = PS_LOCI.filter((l) => !l.chromosome).map((l) => l.id);
const VISIBLE_LOCI = PS_LOCI.filter((l) => !l.silent);

export function sizeClassOf(g: number): SizeClass {
  return g < 10 ? 'mini' : g < 25 ? 'small' : g < 50 ? 'medium' : g < 90 ? 'large' : 'giant';
}

export class PsEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('POI');

  constructor(seed = 20261001) {
    const traitRng = mulberry32(seed + 41);
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
    if (trait === 'height') return Math.max(0, Math.min(1, (Math.log(Math.max(8, value)) - Math.log(10)) / (Math.log(300) - Math.log(10))));
    return Math.max(0, Math.min(1, this.toUnit(trait, value)));
  }

  unitOf(trait: QuantTraitId, ind: PsIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Récolte par plante (kg) — graines sèches. */
  yieldKg(ind: PsIndividual): number {
    return Math.round(ind.pheno.weightG) / 1000;
  }

  // --- Construction ----------------------------------------------------------

  private computePhenotype(genotype: PsGenotype, haps: PsIndividual['haps']): PsPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const het = this.polygenicHeterozygosity(haps);
    const vigor = 1 + MAX_HETEROSIS * Math.min(1, het * 2);
    const dwarf = this.has(genotype, 'le');
    return {
      weightG: Math.max(1, Math.round(this.fromUnit('weight', value('weight')) * vigor)),
      days: this.fromUnit('days', value('days')),
      heightCm: Math.max(8, Math.round(this.fromUnit('height', value('height')) * (dwarf ? DWARF_FACTOR : 1))),
      seed100: this.fromUnit('seed', value('seed')),
    };
  }

  private build(
    genotype: PsGenotype,
    haps: PsIndividual['haps'],
    meta: Pick<PsIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility' | 'seedCoat'> & Partial<Pick<PsIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder'>>
  ): PsIndividual {
    return { crop: 'pois', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(genotype, haps), createdAt: Date.now() };
  }

  varietyTargets(v: PsVariety): Record<QuantTraitId, number> {
    const vig = v.hybrid ? 1 + MAX_HETEROSIS : 1;
    const dwarf = v.variants.includes('le');
    return { weight: v.weightG / vig, days: v.days, height: v.heightCm / (dwarf ? DWARF_FACTOR : 1), seed: v.seed100 };
  }

  createFromVariety(v: PsVariety, label?: string): PsIndividual {
    const genotype = this.genotypeFromVariants(v.variants);
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      genotype[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    const meta = {
      label: label || v.name,
      generation: 0,
      parentIds: null,
      selfed: false,
      varietyId: v.id,
      species: v.species,
      fertility: v.fertility ?? 1,
      hybridWith: v.hybridWith,
      seedCoat: (this.has(genotype, 'A') ? 'grey' : 'clear') as SeedCoat,
    };
    const haps = {} as PsIndividual['haps'];
    if (v.haps) {
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, meta);
    }
    const targets = this.varietyTargets(v);
    for (const trait of QUANT_TRAITS) {
      const u = this.toUnit(trait, targets[trait]);
      if (v.hybrid) haps[trait] = [this.traits[trait].haplotypeForTarget(u + 0.05, this.rng), this.traits[trait].haplotypeForTarget(u - 0.05, this.rng)];
      else {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      }
    }
    return this.build(genotype, haps, { ...meta, hybridFounder: v.hybrid || undefined });
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>> }): PsIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as PsIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1, seedCoat: this.has(genotype, 'A') ? 'grey' : 'clear' });
  }

  private copyParts(ind: PsIndividual): { genotype: PsGenotype; haps: PsIndividual['haps'] } {
    const haps = {} as PsIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as PsGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    return { genotype, haps };
  }

  /** Bouture de tige (le pois s’enracine dans l’eau) : copie exacte. */
  cloneOf(ind: PsIndividual, label?: string): PsIndividual {
    const { genotype, haps } = this.copyParts(ind);
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
      seedCoat: ind.seedCoat,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  fixedVariants(ind: PsIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of PS_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: PsIndividual): Record<PsLocusId, string> {
    const g = {} as Record<PsLocusId, string>;
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

  // --- Fleurs et barrières -----------------------------------------------------

  isMaleSterile(ind: PsIndividual): boolean {
    return ind.fertility <= 0.001;
  }

  /** Toujours autocompatible (et autogame). */
  isSelfCompatible(_ind: PsIndividual): boolean {
    return true;
  }

  canPollinate(ind: PsIndividual): boolean {
    return ind.fertility > 0.001;
  }

  needsEmasculation(_ind: PsIndividual): boolean {
    return true;
  }

  /** Croisements naturels au jardin : très rares (fleur cléistogame). */
  outcrossingRate(ind: PsIndividual): number {
    return ind.species === 'fulvum' || ind.species === 'elatius' ? 0.02 : 0.005;
  }

  crossCheck(a: PsIndividual, b: PsIndividual): CrossCheck {
    const selfing = a.id === b.id;
    const compat = selfing ? { level: 'same' as CrossLevel, seedSet: 1, hybridFertility: 1, reason: 'selfNatural' } : speciesCompat(a.species, b.species);
    const base = { uncertain: compat.uncertain, f1Fertility: compat.hybridFertility };
    if (a.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    const effectiveSeedSet = compat.seedSet * Math.sqrt(a.fertility * b.fertility);
    let level = compat.level;
    let reason = compat.reason;
    if (level === 'same' && effectiveSeedSet < 0.999) {
      level = 'difficult';
      reason = 'lowFertility';
    }
    return { ...base, level, seedSet: compat.seedSet, reason, effectiveSeedSet };
  }

  cross(a: PsIndividual, b: PsIndividual, n: number, labelPrefix?: string): PsIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const interspecific = a.species !== b.species && check.f1Fertility < 1;
    const coat: SeedCoat = this.has(a.genotype, 'A') ? 'grey' : 'clear';
    const out: PsIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as PsGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as PsIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const t = this.traits[trait];
        haps[trait] = [t.gamete(a.haps[trait][0], a.haps[trait][1], this.rng), t.gamete(b.haps[trait][0], b.haps[trait][1], this.rng)];
      }
      // Hybrides entre espèces : demi-stériles (translocations), fertilité qui remonte au fil des générations.
      const fertility = interspecific ? check.f1Fertility : parentsFert >= 0.999 ? 1 : Math.min(1, parentsFert + (1 - parentsFert) * 0.35);
      const hybridWith = a.species !== b.species ? b.species : a.hybridWith ?? b.hybridWith;
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
          seedCoat: coat,
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: PsGenotype, locus: PsLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: PsGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete || def.silent) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: PsGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: PsGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): PsGenotype {
    const g = {} as PsGenotype;
    for (const locus of PS_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: PsIndividual): PsIndividual {
    const missingLoci = PS_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: PsIndividual = { ...ind, crop: 'pois', fertility: ind.fertility ?? 1, seedCoat: ind.seedCoat ?? 'clear' };
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

  appearance(ind: PsIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.species);
  }

  appearanceFromVariety(v: Pick<PsVariety, 'variants' | 'species' | 'het'>): FruitAppearance {
    const g = this.genotypeFromVariants(v.variants);
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      g[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    return this.appearanceOf(g, v.species);
  }

  appearanceOf(g: PsGenotype, sp: SpeciesId): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const a = has('A');
    const af = has('af');
    const tl = has('tl');
    return {
      seedShape: has('r') ? 'wrinkled' : 'round',
      cotyledon: has('i') ? 'green' : 'yellow',
      flower: a ? (sp === 'fulvum' ? 'tawny' : 'purple') : 'white',
      coat: a ? 'grey' : 'clear',
      pod: has('v') ? (has('n') ? 'snap' : 'snow') : 'shelling',
      podColor: has('gp') ? 'yellow' : 'green',
      terminal: has('fa'),
      dwarf: has('le'),
      leaf: af && tl ? 'parsley' : af ? 'afila' : tl ? 'acacia' : 'normal',
      winter: has('Hr'),
      species: sp,
    };
  }

  resistances(ind: PsIndividual): VariantId[] {
    return (['er1', 'er3', 'Fw', 'sbm1'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  /** Code des résistances (« Ep · Fop:1 · PSbMV »). */
  resistanceCode(ind: PsIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    if (r.has('er1') || r.has('er3')) parts.push(`Ep (${[r.has('er1') ? 'er1' : '', r.has('er3') ? 'Er3' : ''].filter(Boolean).join('+')})`);
    if (r.has('Fw')) parts.push('Fop:1');
    if (r.has('sbm1')) parts.push('PSbMV');
    return parts.join(' · ');
  }

  sizeClass(ind: PsIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightG);
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: PsIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: PsIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: PsIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: PsIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: PsIndividual): PsLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  predict(a: PsIndividual, b: PsIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    for (const def of VISIBLE_LOCI) {
      const pa = a.genotype[def.id];
      const pb = b.genotype[def.id];
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!pa.includes(al.allele) && !pb.includes(al.allele)) continue;
        let p = 0;
        for (const x of pa)
          for (const y of pb) {
            const g = { ...a.genotype, [def.id]: [x, y] } as PsGenotype;
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

  genotypeCode(ind: PsIndividual): string {
    const parts: string[] = [];
    for (const def of PS_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.join(' ') || '+';
  }
}
