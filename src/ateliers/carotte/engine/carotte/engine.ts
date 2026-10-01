/**
 * Moteur de croisement de la carotte, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques :
 *  - ALLOGAMIE : fleurs protandres (le pollen sort avant que le stigmate ne
 *    soit réceptif), pollinisées par les mouches et les abeilles ; on peut
 *    autoféconder une plante en ensachant ses ombelles, mais la carotte
 *    souffre beaucoup de la CONSANGUINITÉ : la vigueur dépend de
 *    l’hétérozygotie, les lignées fixées sont chétives et l’hybride F1 de
 *    deux lignées retrouve toute sa vigueur ;
 *  - STÉRILITÉ MÂLE CYTOPLASMIQUE pétaloïde (Sp) ou « brown anther » (Ba),
 *    transmise par la mère, que lèvent les restaurateurs Rfp / Rfb ;
 *  - COULEUR de la racine par épistasie (voir loci.ts) ;
 *  - FORME : longueur polygénique (ronde, courte, demi-longue, longue).
 *
 * Traits quantitatifs : poids de la racine, longueur, jours jusqu’à la
 * récolte, taux de sucre (°Brix).
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossLevel } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, DC_LOCI, VARIANT_ALLELE, type DcLocusId, type SpeciesId, type VariantId } from './loci';
import type { DcVariety } from './varieties';

export type QuantTraitId = 'weight' | 'length' | 'days' | 'brix';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'length', 'days', 'brix'];
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'length', 'days', 'brix'];

const POLY_LOCI: Record<QuantTraitId, number> = { weight: 22, length: 18, days: 20, brix: 16 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Poids de la racine (g). */
  weight: { min: 5, max: 600, log: true, noise: 0.012, digits: 0 },
  /** Longueur de la racine (cm). */
  length: { min: 3, max: 40, log: true, noise: 0.012, digits: 0 },
  /** Jours du semis à la récolte. */
  days: { min: 50, max: 180, noise: 0.012, digits: 0 },
  /** Sucres solubles (°Brix). */
  brix: { min: 3, max: 15, noise: 0.015, digits: 1 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof DcPhenotype> = {
  weight: 'weightG',
  length: 'lengthCm',
  days: 'days',
  brix: 'brix',
};

/** Vigueur d’une lignée totalement consanguine (fraction du poids de racine). */
const INBRED_VIGOR = 0.5;

export type Cytoplasm = 'N' | 'Sp' | 'Ba';
export type DcGenotype = Record<DcLocusId, Diploid<string>>;

export interface DcPhenotype {
  weightG: number;
  lengthCm: number;
  days: number;
  brix: number;
}

export interface DcIndividual {
  crop: 'carotte';
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility: number;
  cyto: Cytoplasm;
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  selfed: boolean;
  varietyId?: string;
  hybridFounder?: boolean;
  genotype: DcGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: DcPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: DcJournalEntry[];
}

export type DcStage = 'sowing' | 'emergence' | 'thinning' | 'rooting' | 'harvest' | 'storage' | 'replanting' | 'bolting' | 'flowering' | 'seeds';
export const DC_STAGES: DcStage[] = ['sowing', 'emergence', 'thinning', 'rooting', 'harvest', 'storage', 'replanting', 'bolting', 'flowering', 'seeds'];

export interface DcJournalEntry {
  id: string;
  date: number;
  stage?: DcStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type CoreColor = 'white' | 'yellow' | 'orange' | 'red';
export const CORE_COLORS: CoreColor[] = ['white', 'yellow', 'orange', 'red'];
export type PurpleType = 'none' | 'outer' | 'full';
export type RootShape = 'round' | 'short' | 'medium' | 'long';
export const ROOT_SHAPES: RootShape[] = ['round', 'short', 'medium', 'long'];
export type RootColor = CoreColor | 'purple';
export const ROOT_COLORS: RootColor[] = ['white', 'yellow', 'orange', 'red', 'purple'];
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';

export interface FruitAppearance {
  /** Couleur visible de l’extérieur. */
  color: RootColor;
  core: CoreColor;
  purple: PurpleType;
  annual: boolean;
  maleSterile: boolean;
  sterility: 'petaloid' | 'brownAnther' | null;
  species: SpeciesId;
  cyto: Cytoplasm;
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

const LINKAGE_GROUPS: DcLocusId[][] = (() => {
  const m = new Map<number, DcLocusId[]>();
  for (const l of DC_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: DcLocusId[] = DC_LOCI.filter((l) => !l.chromosome).map((l) => l.id);
const VISIBLE_LOCI = DC_LOCI.filter((l) => !l.silent);

export function sizeClassOf(g: number): SizeClass {
  return g < 30 ? 'mini' : g < 80 ? 'small' : g < 160 ? 'medium' : g < 300 ? 'large' : 'giant';
}

export function rootShapeOf(lengthCm: number, weightG: number): RootShape {
  if (lengthCm < 7 && weightG > 15) return 'round';
  return lengthCm < 13 ? 'short' : lengthCm < 21 ? 'medium' : 'long';
}

export class DcEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('CAR');

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
    return Math.max(0, Math.min(1, this.toUnit(trait, value)));
  }

  unitOf(trait: QuantTraitId, ind: DcIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Récolte par plante (kg) : une racine. */
  yieldKg(ind: DcIndividual): number {
    return Math.round(ind.pheno.weightG) / 1000;
  }

  // --- Vigueur et haplotypes -------------------------------------------------

  /** Hétérozygotie relative d’un trait (0 = lignée, ~1 = population non consanguine). */
  relativeHeterozygosity(trait: QuantTraitId, haps: [number[], number[]]): number {
    const [a, b] = haps;
    let het = 0;
    let mean = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) het++;
      mean += (a[i] + b[i]) / 2;
    }
    het /= a.length;
    mean /= a.length;
    const expected = 2 * mean * (1 - mean);
    void trait;
    return expected > 0.02 ? Math.min(1.3, het / expected) : het > 0 ? 1 : 0;
  }

  vigor(haps: DcIndividual['haps']): number {
    let rel = 0;
    for (const t of QUANT_TRAITS) rel += Math.min(1.3, this.relativeHeterozygosity(t, haps[t]));
    const x = Math.min(1, rel / QUANT_TRAITS.length / 0.95);
    return INBRED_VIGOR + (1 - INBRED_VIGOR) * Math.pow(x, 1.4);
  }

  /** Deux haplotypes non apparentés dont la valeur moyenne approche `target`. */
  private outbredHaps(trait: QuantTraitId, target: number): [number[], number[]] {
    const t = this.traits[trait];
    const u = Math.max(0.04, Math.min(0.96, target));
    const haps: [number[], number[]] = [t.randomHaplotype(this.rng, u), t.randomHaplotype(this.rng, u)];
    let score = t.score(haps[0], haps[1]);
    const tot = t.effects.reduce((x, y) => x + y, 0) * 2;
    for (let pass = 0; pass < 6 && Math.abs(score - target) > 0.004; pass++) {
      for (let l = 0; l < t.nLoci; l++) {
        const k = this.rng() < 0.5 ? 0 : 1;
        const delta = ((haps[k][l] ? -1 : 1) * t.effects[l]) / tot;
        if (Math.abs(score + delta - target) < Math.abs(score - target)) {
          haps[k][l] = 1 - haps[k][l];
          score += delta;
        }
      }
    }
    return haps;
  }

  // --- Construction ----------------------------------------------------------

  private computePhenotype(haps: DcIndividual['haps']): DcPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const vig = this.vigor(haps);
    return {
      weightG: Math.max(2, Math.round(this.fromUnit('weight', value('weight')) * vig)),
      lengthCm: Math.max(2, Math.round(this.fromUnit('length', value('length')) * (0.75 + 0.25 * vig))),
      days: this.fromUnit('days', value('days')),
      brix: this.fromUnit('brix', value('brix')),
    };
  }

  private build(
    genotype: DcGenotype,
    haps: DcIndividual['haps'],
    meta: Pick<DcIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility' | 'cyto'> & Partial<Pick<DcIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder'>>
  ): DcIndividual {
    return { crop: 'carotte', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(haps), createdAt: Date.now() };
  }

  varietyTargets(v: DcVariety): Record<QuantTraitId, number> {
    const vig = v.inbred ? INBRED_VIGOR : 1;
    return { weight: v.weightG / vig, length: v.lengthCm / (v.inbred ? 0.75 + 0.25 * INBRED_VIGOR : 1), days: v.days, brix: v.brix };
  }

  createFromVariety(v: DcVariety, label?: string): DcIndividual {
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
      cyto: v.cyto ?? 'N',
      hybridWith: v.hybridWith,
    } as const;
    const haps = {} as DcIndividual['haps'];
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
      if (v.inbred) {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      } else haps[trait] = this.outbredHaps(trait, u);
    }
    return this.build(genotype, haps, { ...meta, hybridFounder: v.hybrid || undefined });
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>>; cyto?: Cytoplasm }): DcIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as DcIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = this.outbredHaps(trait, opts.targets[trait] ?? 0.5);
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1, cyto: opts.cyto ?? 'N' });
  }

  private copyParts(ind: DcIndividual): { genotype: DcGenotype; haps: DcIndividual['haps'] } {
    const haps = {} as DcIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as DcGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    return { genotype, haps };
  }

  /** Repiquer le collet (la racine coupée repousse) : copie exacte, l’astuce des sélectionneurs pour garder un porte-graine. */
  cloneOf(ind: DcIndividual, label?: string): DcIndividual {
    const { genotype, haps } = this.copyParts(ind);
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (collet)`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      hybridFounder: ind.hybridFounder,
      species: ind.species,
      hybridWith: ind.hybridWith,
      fertility: ind.fertility,
      cyto: ind.cyto,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  fixedVariants(ind: DcIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of DC_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: DcIndividual): Record<DcLocusId, string> {
    const g = {} as Record<DcLocusId, string>;
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

  isMaleSterile(ind: DcIndividual): boolean {
    if (ind.cyto === 'Sp') return !this.has(ind.genotype, 'Rfp');
    if (ind.cyto === 'Ba') return !this.has(ind.genotype, 'Rfb');
    return false;
  }

  isSelfCompatible(_ind: DcIndividual): boolean {
    return true;
  }

  canPollinate(ind: DcIndividual): boolean {
    return ind.fertility > 0.001 && !this.isMaleSterile(ind);
  }

  /** On castre la mère (étamines retirées fleur à fleur), sauf si elle est mâle stérile. */
  needsEmasculation(ind: DcIndividual): boolean {
    return !this.isMaleSterile(ind);
  }

  /** Croisements naturels : la carotte est allogame (fleurs protandres, insectes). */
  outcrossingRate(ind: DcIndividual): number {
    return this.canPollinate(ind) ? 0.9 : 1;
  }

  crossCheck(a: DcIndividual, b: DcIndividual): CrossCheck {
    const selfing = a.id === b.id;
    const compat = selfing ? { level: 'related' as CrossLevel, seedSet: 1, hybridFertility: 1, reason: 'selfInbreeding', uncertain: undefined } : speciesCompat(a.species, b.species);
    const base = { uncertain: compat.uncertain, f1Fertility: compat.hybridFertility };
    if (a.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (this.isMaleSterile(b)) return { ...base, level: 'blocked', seedSet: 0, reason: b.cyto === 'Sp' ? 'petaloidFather' : 'brownFather', sterileParent: 'b', effectiveSeedSet: 0 };
    if (compat.level === 'blocked') return { ...base, level: 'blocked', seedSet: 0, reason: compat.reason, effectiveSeedSet: 0 };
    const effectiveSeedSet = compat.seedSet * Math.sqrt(a.fertility * b.fertility);
    let level = compat.level;
    let reason = compat.reason;
    if (level === 'same' && effectiveSeedSet < 0.999) {
      level = 'difficult';
      reason = 'lowFertility';
    }
    return { ...base, level, seedSet: compat.seedSet, reason, effectiveSeedSet };
  }

  cross(a: DcIndividual, b: DcIndividual, n: number, labelPrefix?: string): DcIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const interspecific = a.species !== b.species && check.f1Fertility < 1;
    const out: DcIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as DcGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as DcIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const t = this.traits[trait];
        haps[trait] = [t.gamete(a.haps[trait][0], a.haps[trait][1], this.rng), t.gamete(b.haps[trait][0], b.haps[trait][1], this.rng)];
      }
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
          cyto: a.cyto,
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: DcGenotype, locus: DcLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: DcGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete || def.silent) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: DcGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: DcGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): DcGenotype {
    const g = {} as DcGenotype;
    for (const locus of DC_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: DcIndividual): DcIndividual {
    const missingLoci = DC_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: DcIndividual = { ...ind, crop: 'carotte', fertility: ind.fertility ?? 1, cyto: ind.cyto ?? 'N' };
    if (!missingLoci.length && !missingTraits.length) return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) haps[t] = this.outbredHaps(t, 0.5);
    return { ...base, genotype, haps, pheno: { ...this.computePhenotype(haps), ...ind.pheno } };
  }

  appearance(ind: DcIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.species, ind.cyto);
  }

  appearanceFromVariety(v: Pick<DcVariety, 'variants' | 'species' | 'het' | 'cyto'>): FruitAppearance {
    const g = this.genotypeFromVariants(v.variants);
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      g[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    return this.appearanceOf(g, v.species, v.cyto ?? 'N');
  }

  appearanceOf(g: DcGenotype, sp: SpeciesId, cyto: Cytoplasm = 'N'): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const core: CoreColor = has('Y') ? 'white' : !has('y2') ? 'yellow' : has('l') ? 'red' : 'orange';
    const purple: PurpleType = has('P1') ? (has('Px') ? 'full' : 'outer') : 'none';
    const sterileSp = cyto === 'Sp' && !has('Rfp');
    const sterileBa = cyto === 'Ba' && !has('Rfb');
    return {
      color: purple !== 'none' ? 'purple' : core,
      core: purple === 'full' ? core : core,
      purple,
      annual: has('Vrn1'),
      maleSterile: sterileSp || sterileBa,
      sterility: sterileSp ? 'petaloid' : sterileBa ? 'brownAnther' : null,
      species: sp,
      cyto,
    };
  }

  rootShape(ind: DcIndividual): RootShape {
    return rootShapeOf(ind.pheno.lengthCm, ind.pheno.weightG);
  }

  resistances(ind: DcIndividual): VariantId[] {
    return (['Mj1', 'Alt', 'cf'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  /** Code des résistances (« Mj · Ad · Pr »). */
  resistanceCode(ind: DcIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    if (r.has('Mj1')) parts.push('Mj-1');
    if (r.has('Alt')) parts.push('Ad');
    if (r.has('cf')) parts.push('Pr');
    return parts.join(' · ');
  }

  sizeClass(ind: DcIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightG);
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: DcIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: DcIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: DcIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: DcIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: DcIndividual): DcLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  predict(a: DcIndividual, b: DcIndividual): TheoreticalRatio[] {
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
            const g = { ...a.genotype, [def.id]: [x, y] } as DcGenotype;
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

  genotypeCode(ind: DcIndividual): string {
    const parts: string[] = [];
    for (const def of DC_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    const head = ind.cyto === 'N' ? '' : `[${ind.cyto}] `;
    return `${head}${parts.join(' ') || '+'}`;
  }
}
