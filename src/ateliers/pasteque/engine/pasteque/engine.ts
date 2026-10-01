/**
 * Moteur de croisement des pastèques, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques des pastèques (Citrullus) :
 *  - plante MONOÏQUE : fleurs mâles et fleurs femelles séparées sur la même
 *    plante, pollinisées par les abeilles (rien à castrer) ; quelques
 *    lignées andromonoïques (a/a) ont des fleurs femelles à étamines, à
 *    castrer ; le mutant gms est mâle stérile (mère idéale pour les F1) ;
 *  - CINQ ESPÈCES (lanatus, mucosospermus, amarus, colocynthis,
 *    ecirrhosus), séparées par des barrières plus ou moins fortes ;
 *  - PLOÏDIE : doubler les chromosomes (colchicine) donne un tétraploïde 4x ;
 *    4x ♀ × 2x ♂ donne des graines triploïdes 3x : plantes stériles aux fruits
 *    SANS PÉPINS (voir compat.ts). Simplification : le génotype reste noté
 *    comme celui d’un diploïde (les doses d’allèles des polyploïdes ne sont
 *    pas modélisées) ;
 *  - ÉPISTASIE de la couleur de la chair : Wf > C > série Y (voir loci.ts) ;
 *  - DOMINANCE INCOMPLÈTE de la forme (O) ;
 *  - LIAISONS : Bi, Y et Fo-1 sur le chromosome 1, O et t sur le 3…
 *
 * Traits quantitatifs (phénotype = valeur génétique + bruit environnemental
 * tiré une fois à la naissance) : poids du fruit, sucre (°Brix), jours du
 * semis à la récolte, fruits par plante.
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { ploidyCompat, speciesCompat, type CrossCompat, type Ploidy } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, WM_LOCI, VARIANT_ALLELE, type WmLocusId, type SpeciesId, type VariantId } from './loci';
import type { WmVariety } from './varieties';

export type { Ploidy } from './compat';

export type QuantTraitId = 'weight' | 'brix' | 'days' | 'fruits';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'brix', 'days', 'fruits'];
/** Traits affichés sur les cartes (les autres sur la fiche). */
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'brix', 'days', 'fruits'];

const POLY_LOCI: Record<QuantTraitId, number> = { weight: 24, brix: 18, days: 12, fruits: 12 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Poids moyen d’un fruit (kg) : 0,2 kg (coloquinte) à 40 kg (pastèques géantes). */
  weight: { min: 0.2, max: 40, log: true, noise: 0.01, digits: 1 },
  /** Sucres solubles de la chair (°Brix). */
  brix: { min: 1.5, max: 14, noise: 0.015, digits: 1 },
  /** Jours du semis à la première récolte. */
  days: { min: 60, max: 130, noise: 0.03, digits: 0 },
  /** Fruits récoltés par plante. */
  fruits: { min: 1, max: 40, log: true, noise: 0.02, digits: 0 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof WmPhenotype> = {
  weight: 'weightKg',
  brix: 'brix',
  days: 'days',
  fruits: 'fruits',
};

/** Bonus de vigueur maximal d’un individu totalement hétérozygote (hybrides F1). */
const MAX_HETEROSIS = 0.15;
/** Pléiotropie : le port nain (dw-1) donne des fruits un peu plus petits. */
export const DWARF_WEIGHT_FACTOR = 0.8;
/** Effets de la ploïdie sur le fruit (ordres de grandeur). */
const PLOIDY_WEIGHT: Record<Ploidy, number> = { 2: 1, 3: 1.05, 4: 0.85 };
const PLOIDY_BRIX: Record<Ploidy, number> = { 2: 0, 3: 0.4, 4: 0.3 };
/** Fertilité d’un tétraploïde fraîchement doublé (méiose irrégulière, peu de graines). */
export const TETRAPLOID_FERTILITY = 0.6;

export type WmGenotype = Record<WmLocusId, Diploid<string>>;

export interface WmPhenotype {
  weightKg: number;
  brix: number;
  days: number;
  fruits: number;
}

export interface WmIndividual {
  crop: 'pasteque';
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility: number;
  ploidy: Ploidy;
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  selfed: boolean;
  varietyId?: string;
  hybridFounder?: boolean;
  /** Tétraploïde obtenu par doublement des chromosomes (colchicine). */
  doubledFromId?: string;
  genotype: WmGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: WmPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: WmJournalEntry[];
}

export type WmStage = 'sowing' | 'emergence' | 'transplant' | 'running' | 'maleFlowers' | 'femaleFlowers' | 'fruitSet' | 'swelling' | 'harvest' | 'seeds';
export const WM_STAGES: WmStage[] = ['sowing', 'emergence', 'transplant', 'running', 'maleFlowers', 'femaleFlowers', 'fruitSet', 'swelling', 'harvest', 'seeds'];

export interface WmJournalEntry {
  id: string;
  date: number;
  stage?: WmStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type FleshColor = 'red' | 'orange' | 'salmon' | 'canary' | 'white';
export const FLESH_COLORS: FleshColor[] = ['red', 'orange', 'salmon', 'canary', 'white'];
export type RindColor = 'dark' | 'striped' | 'light';
export const RIND_COLORS: RindColor[] = ['dark', 'striped', 'light'];
export type FruitShape = 'round' | 'oval' | 'long';
export const FRUIT_SHAPES: FruitShape[] = ['round', 'oval', 'long'];
export type SeedColor = 'black' | 'tan' | 'red' | 'white';
export const SEED_COLORS: SeedColor[] = ['black', 'tan', 'red', 'white'];
export type SexType = 'monoecious' | 'andromonoecious';
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';

export interface FruitAppearance {
  flesh: FleshColor;
  rind: RindColor;
  spotted: boolean;
  golden: boolean;
  shape: FruitShape;
  seed: SeedColor;
  egusi: boolean;
  tinySeed: boolean;
  /** Triploïde : pépins blancs avortés seulement. */
  seedless: boolean;
  bush: boolean;
  bitter: boolean;
  explosive: boolean;
  sex: SexType;
  maleSterile: boolean;
  species: SpeciesId;
  ploidy: Ploidy;
}

export interface TheoreticalRatio {
  variant: VariantId;
  pExpressed: number;
}

export interface CrossCheck extends Omit<CrossCompat, 'reason'> {
  reason: string;
  sterileParent?: 'a' | 'b';
  effectiveSeedSet: number;
  childPloidy: Ploidy;
}

export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

const LINKAGE_GROUPS: WmLocusId[][] = (() => {
  const m = new Map<number, WmLocusId[]>();
  for (const l of WM_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: WmLocusId[] = WM_LOCI.filter((l) => !l.chromosome).map((l) => l.id);

export function sizeClassOf(kg: number): SizeClass {
  return kg < 2 ? 'mini' : kg < 5 ? 'small' : kg < 10 ? 'medium' : kg < 18 ? 'large' : 'giant';
}

const LEVEL_RANK = { same: 0, related: 1, difficult: 2, blocked: 3 } as const;

export class WmEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('PAS');

  constructor(seed = 20261001) {
    const traitRng = mulberry32(seed + 23);
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

  unitOf(trait: QuantTraitId, ind: WmIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Récolte par plante (kg) = fruits × poids moyen. */
  yieldKg(ind: WmIndividual): number {
    return Math.round(ind.pheno.fruits * ind.pheno.weightKg * 10) / 10;
  }

  // --- Construction ----------------------------------------------------------

  private computePhenotype(genotype: WmGenotype, haps: WmIndividual['haps'], ploidy: Ploidy): WmPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const het = this.polygenicHeterozygosity(haps);
    const vigor = 1 + MAX_HETEROSIS * het;
    const dwarf = this.has(genotype, 'dw') ? DWARF_WEIGHT_FACTOR : 1;
    const w = this.fromUnit('weight', value('weight')) * vigor * dwarf * PLOIDY_WEIGHT[ploidy];
    return {
      weightKg: Math.max(0.1, Math.round(w * 10) / 10),
      brix: Math.min(14, this.round('brix', this.fromUnit('brix', value('brix')) + PLOIDY_BRIX[ploidy])),
      days: this.fromUnit('days', value('days')),
      fruits: Math.max(1, Math.round(this.fromUnit('fruits', value('fruits')) * (1 + (MAX_HETEROSIS / 2) * het))),
    };
  }

  private build(
    genotype: WmGenotype,
    haps: WmIndividual['haps'],
    meta: Pick<WmIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility'> &
      Partial<Pick<WmIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder' | 'ploidy' | 'doubledFromId'>>
  ): WmIndividual {
    const ploidy = meta.ploidy ?? 2;
    return { crop: 'pasteque', id: this.ids.next(), ...meta, ploidy, genotype, haps, pheno: this.computePhenotype(genotype, haps, ploidy), createdAt: Date.now() };
  }

  /** Valeurs cibles d’une variété, « dépliées » des effets du port nain et de la ploïdie. */
  varietyTargets(v: WmVariety): Record<QuantTraitId, number> {
    const p = v.ploidy ?? 2;
    const dwarf = v.variants.includes('dw') ? DWARF_WEIGHT_FACTOR : 1;
    return {
      weight: v.weightKg / dwarf / PLOIDY_WEIGHT[p],
      brix: v.brix - PLOIDY_BRIX[p],
      days: v.days,
      fruits: v.fruits,
    };
  }

  createFromVariety(v: WmVariety, label?: string): WmIndividual {
    const genotype = this.genotypeFromVariants(v.variants);
    const ploidy = v.ploidy ?? 2;
    const meta = {
      label: label || v.name,
      generation: 0,
      parentIds: null,
      selfed: false,
      varietyId: v.id,
      species: v.species,
      fertility: ploidy === 3 ? 0 : ploidy === 4 ? TETRAPLOID_FERTILITY : (v.fertility ?? 1),
      ploidy,
      hybridWith: v.hybridWith,
    } as const;
    if (v.haps) {
      const haps = {} as WmIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, meta);
    }
    const targets = this.varietyTargets(v);
    const haps = {} as WmIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      let tv = targets[trait];
      if (v.hybrid && trait === 'weight') tv = tv / (1 + MAX_HETEROSIS * 0.5);
      const u = this.toUnit(trait, tv);
      if (v.hybrid) haps[trait] = [this.traits[trait].haplotypeForTarget(u + 0.06, this.rng), this.traits[trait].haplotypeForTarget(u - 0.06, this.rng)];
      else {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      }
    }
    if (v.hybrid) {
      // F1 : les résistances dominantes sont supposées apportées par un seul parent.
      for (const def of WM_LOCI) {
        const pair = genotype[def.id];
        const expressed = def.alleles.find((a) => a.allele === pair[0]);
        const dominantVariant = expressed?.id && def.alleles.indexOf(expressed) < def.alleles.findIndex((a) => a.allele === def.standard);
        if (dominantVariant && def.category === 'resistance') genotype[def.id] = this.rng() < 0.5 ? [pair[0], def.standard] : [def.standard, pair[0]];
      }
      return this.build(genotype, haps, { ...meta, hybridFounder: true });
    }
    return this.build(genotype, haps, meta);
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>> }): WmIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as WmIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1 });
  }

  private copyParts(ind: WmIndividual): { genotype: WmGenotype; haps: WmIndividual['haps'] } {
    const haps = {} as WmIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as WmGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    return { genotype, haps };
  }

  /** Bouture de tige (les pastèques s’enracinent bien) : copie génétique exacte. */
  cloneOf(ind: WmIndividual, label?: string): WmIndividual {
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
      ploidy: ind.ploidy,
      doubledFromId: ind.doubledFromId,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  /** Doublement des chromosomes (colchicine sur la jeune pousse) : 2x → 4x. */
  canDouble(ind: WmIndividual): boolean {
    return ind.ploidy === 2;
  }

  doubleChromosomes(ind: WmIndividual, label?: string): WmIndividual {
    const { genotype, haps } = this.copyParts(ind);
    return this.build(genotype, haps, {
      label: label || `${ind.label} 4x`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      species: ind.species,
      hybridWith: ind.hybridWith,
      fertility: Math.min(ind.fertility, TETRAPLOID_FERTILITY),
      ploidy: 4,
      doubledFromId: ind.id,
    });
  }

  fixedVariants(ind: WmIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of WM_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: WmIndividual): Record<WmLocusId, string> {
    const g = {} as Record<WmLocusId, string>;
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

  sexTypeOf(g: WmGenotype): SexType {
    return this.has(g, 'a') ? 'andromonoecious' : 'monoecious';
  }

  sexType(ind: WmIndividual): SexType {
    return this.sexTypeOf(ind.genotype);
  }

  isMaleSterile(ind: WmIndividual): boolean {
    return this.has(ind.genotype, 'gms');
  }

  /** Peut donner du pollen viable (pas triploïde, pas gms, pas un hybride stérile). */
  canPollinate(ind: WmIndividual): boolean {
    return ind.fertility > 0.001 && ind.ploidy !== 3 && !this.isMaleSterile(ind);
  }

  /** Faut-il castrer la mère ? Oui seulement si ses fleurs à fruit portent du pollen. */
  needsEmasculation(ind: WmIndividual): boolean {
    return this.sexType(ind) === 'andromonoecious' && this.canPollinate(ind);
  }

  /** Part des graines issues d’un autre plant au jardin (abeilles). */
  outcrossingRate(ind: WmIndividual): number {
    if (ind.ploidy === 3) return 0;
    if (!this.canPollinate(ind)) return 1;
    return this.sexType(ind) === 'andromonoecious' ? 0.15 : 0.35;
  }

  crossCheck(a: WmIndividual, b: WmIndividual): CrossCheck {
    const sp = speciesCompat(a.species, b.species);
    const pc = ploidyCompat(a.ploidy, b.ploidy);
    const base = { uncertain: sp.uncertain, childPloidy: pc.childPloidy };
    if (a.ploidy === 3) return { ...base, level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'triploid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.ploidy === 3) return { ...base, level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'triploid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (a.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (this.isMaleSterile(b)) return { ...base, level: 'blocked', seedSet: 0, f1Fertility: 0, reason: 'maleSterile', sterileParent: 'b', effectiveSeedSet: 0 };
    if (sp.level === 'blocked' || pc.level === 'blocked') return { ...base, level: 'blocked', seedSet: 0, f1Fertility: 0, reason: pc.level === 'blocked' ? pc.reason : sp.reason, effectiveSeedSet: 0 };
    const seedSet = sp.seedSet * pc.seedSet;
    const effectiveSeedSet = seedSet * Math.sqrt(a.fertility * b.fertility);
    let level = LEVEL_RANK[sp.level] >= LEVEL_RANK[pc.level] ? sp.level : pc.level;
    let reason = pc.level !== 'same' ? pc.reason : sp.reason;
    if (level === 'same' && effectiveSeedSet < 0.999) {
      level = 'difficult';
      reason = 'lowFertility';
    }
    const f1Fertility = Math.min(sp.f1Fertility, pc.childFertility);
    return { ...base, level, seedSet, f1Fertility, reason, effectiveSeedSet };
  }

  cross(a: WmIndividual, b: WmIndividual, n: number, labelPrefix?: string): WmIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const interspecific = a.species !== b.species;
    const hybridWith = interspecific ? b.species : a.hybridWith ?? b.hybridWith;
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const ploidy = check.childPloidy;
    let fertility = interspecific ? check.f1Fertility : parentsFert >= 0.999 ? 1 : Math.min(1, parentsFert + (1 - parentsFert) * 0.35);
    if (ploidy === 3) fertility = 0;
    else if (ploidy === 4) fertility = Math.min(fertility, TETRAPLOID_FERTILITY);
    const out: WmIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as WmGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as WmIndividual['haps'];
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
          ploidy,
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: WmGenotype, locus: WmLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: WmGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: WmGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: WmGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): WmGenotype {
    const g = {} as WmGenotype;
    for (const locus of WM_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      if (g[locus][0] === LOCUS_BY_ID[locus].standard) g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: WmIndividual): WmIndividual {
    const missingLoci = WM_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: WmIndividual = { ...ind, crop: 'pasteque', fertility: ind.fertility ?? 1, ploidy: ind.ploidy ?? 2 };
    if (!missingLoci.length && !missingTraits.length) return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) {
      const h = this.traits[t].haplotypeForTarget(0.5, this.rng);
      haps[t] = [h, [...h]];
    }
    return { ...base, genotype, haps, pheno: { ...this.computePhenotype(genotype, haps, base.ploidy), ...ind.pheno } };
  }

  appearance(ind: WmIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.species, ind.ploidy);
  }

  appearanceFromVariety(v: Pick<WmVariety, 'variants' | 'species' | 'ploidy'>): FruitAppearance {
    return this.appearanceOf(this.genotypeFromVariants(v.variants), v.species, v.ploidy ?? 2);
  }

  shapeOf(g: WmGenotype): FruitShape {
    const d = this.dose(g, 'O');
    return d === 2 ? 'long' : d === 1 ? 'oval' : 'round';
  }

  /** Couleur de la chair, de l’écorce, des graines ; forme ; fleurs. */
  appearanceOf(g: WmGenotype, sp: SpeciesId, ploidy: Ploidy = 2): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const flesh: FleshColor = has('Wf') ? 'white' : has('C') ? 'canary' : has('yo') ? 'orange' : has('y') ? 'salmon' : 'red';
    const rind: RindColor = has('G') ? 'dark' : has('gs') ? 'striped' : 'light';
    const seed: SeedColor = has('w') ? 'white' : has('r') ? 'red' : has('t') ? 'tan' : 'black';
    return {
      flesh,
      rind,
      spotted: has('Sp'),
      golden: has('go'),
      shape: this.shapeOf(g),
      seed,
      egusi: has('eg'),
      tinySeed: has('ts'),
      seedless: ploidy === 3,
      bush: has('dw'),
      bitter: has('Bi'),
      explosive: has('e'),
      sex: this.sexTypeOf(g),
      maleSterile: has('gms'),
      species: sp,
      ploidy,
    };
  }

  resistances(ind: WmIndividual): VariantId[] {
    return (['Fo1', 'Ar1', 'db', 'zym'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  /** Code catalogue (« HR: Fon:1 · Co:1 / IR: ZYMV »). */
  resistanceCode(ind: WmIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    if (r.has('Fo1')) parts.push('Fon:1');
    if (r.has('Ar1')) parts.push('Co:1,3');
    if (r.has('db')) parts.push('Db');
    if (r.has('zym')) parts.push('ZYMV');
    return parts.join(' · ');
  }

  sizeClass(ind: WmIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightKg);
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: WmIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: WmIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: WmIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: WmIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: WmIndividual): WmLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  predict(a: WmIndividual, b: WmIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    for (const def of WM_LOCI) {
      const pa = a.genotype[def.id];
      const pb = b.genotype[def.id];
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!pa.includes(al.allele) && !pb.includes(al.allele)) continue;
        let p = 0;
        for (const x of pa)
          for (const y of pb) {
            const g = { ...a.genotype, [def.id]: [x, y] } as WmGenotype;
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

  genotypeCode(ind: WmIndividual): string {
    const parts: string[] = [];
    for (const def of WM_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    const code = parts.length ? parts.join(' ') : '+';
    return ind.ploidy === 2 ? code : `${ind.ploidy}x · ${code}`;
  }
}
