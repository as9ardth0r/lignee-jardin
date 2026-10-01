/**
 * Moteur de croisement des pommes de terre, bâti sur le noyau commun
 * (../core) mais généralisé à TOUTES LES PLOÏDIES : un génotype porte
 * autant de copies de chaque gène que la plante a de jeux de chromosomes
 * (2 chez Phureja, 4 chez la pomme de terre, 6 chez S. demissum).
 *
 * Particularités biologiques :
 *  - MÉIOSE POLYSOMIQUE : un gamète d’un tétraploïde reçoit 2 des 4 copies,
 *    tirées au hasard (ségrégation chromosomique aléatoire, sans double
 *    réduction). Un AAaa autofécondé donne donc 1/36 de aaaa, pas 1/4 ;
 *  - GAMÈTES NON RÉDUITS (2n) : fréquents chez les diploïdes ps/ps, ils
 *    transmettent tout le génotype du parent ;
 *  - EBN (voir compat.ts) : la graine n’avorte pas si ovule et pollen
 *    apportent le même EBN ;
 *  - AUTO-INCOMPATIBILITÉ GAMÉTOPHYTIQUE : un tube pollinique est arrêté
 *    s’il porte UN SEUL allèle S présent chez la mère ; Sli dans le pollen
 *    lève le rejet. Le rejet est pré-zygotique : un autre grain de pollen
 *    peut prendre le relais. L’avortement EBN est post-zygotique ;
 *  - INDUCTEUR D’HAPLOÏDES (Phureja IVP101) : une partie des graines naît
 *    d’un ovule non fécondé → « dihaploïde » (2x) de la mère ;
 *  - CLONAGE : replanter le tubercule donne une copie exacte (la variété) ;
 *    sans gène Ry, le virus Y s’accumule de génération en génération (la
 *    « dégénérescence »), que la graine vraie remet à zéro ;
 *  - VIGUEUR : la pomme de terre souffre beaucoup de la consanguinité ;
 *    la vigueur dépend de la diversité des copies (hétérozygotie relative).
 *
 * Traits quantitatifs : poids de tubercules par plante, jours jusqu’à la
 * maturité, matière sèche (%), gel supporté (°C).
 */

import { PolygenicTrait, gaussian, makeIdGenerator, mulberry32, type Rng } from '../core';
import { gameteEbn, ploidyFertility } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, PT_LOCI, SPECIES_PLOIDY, VARIANT_ALLELE, type PtLocusId, type SpeciesId, type VariantId } from './loci';
import type { PtVariety } from './varieties';

export type QuantTraitId = 'weight' | 'days' | 'dm' | 'frost';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'days', 'dm', 'frost'];
/** Traits affichés sur les cartes. */
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'days', 'dm', 'frost'];

const POLY_LOCI: Record<QuantTraitId, number> = { weight: 24, days: 20, dm: 18, frost: 14 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Tubercules par plante (kg). */
  weight: { min: 0.02, max: 3.5, log: true, noise: 0.012, digits: 2 },
  /** Jours de la plantation à la maturité (défanage naturel). */
  days: { min: 60, max: 200, noise: 0.012, digits: 0 },
  /** Matière sèche du tubercule (%). */
  dm: { min: 13, max: 30, noise: 0.015, digits: 1 },
  /** Gel supporté par le feuillage (°C). */
  frost: { min: -7, max: 0, noise: 0.02, digits: 1 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof PtPhenotype> = {
  weight: 'weightKg',
  days: 'days',
  dm: 'dm',
  frost: 'frostC',
};

/** Vigueur d’une plante totalement consanguine (fraction du potentiel). */
const INBRED_VIGOR = 0.45;
/** Pollen 2n produit par un diploïde ps/ps, et « fuite » chez les autres. */
export const TWO_N_POLLEN_PS = 0.3;
const TWO_N_POLLEN_BASE = 0.01;
const TWO_N_EGG = 0.01;
/** Part des ovules qui donnent un dihaploïde avec un inducteur (IVP101). */
export const HAPLOID_INDUCTION = 0.05;
/** Grains de pollen qui tentent leur chance par ovule (rejet S → un autre). */
const POLLEN_TRIES = 3;
/** Fertilité d’une plante juste doublée (colchicine). */
export const DOUBLED_FERTILITY = 0.8;

export type Cytoplasm = 'T' | 'W';
export type PtGenotype = Record<PtLocusId, string[]>;

export interface PtPhenotype {
  weightKg: number;
  days: number;
  dm: number;
  frostC: number;
}

export interface PtIndividual {
  crop: 'patate';
  species: SpeciesId;
  hybridWith?: SpeciesId;
  /** Nombre de jeux de chromosomes (2, 3, 4, 5, 6…). */
  ploidy: number;
  /** Endosperm Balance Number. */
  ebn: number;
  fertility: number;
  cyto: Cytoplasm;
  /** Inducteur d’haploïdes (Phureja IVP101…). */
  inducer?: boolean;
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  selfed: boolean;
  varietyId?: string;
  hybridFounder?: boolean;
  doubledFromId?: string;
  /** Dihaploïde issu de cette mère (induction d’haploïdes). */
  dihaploidOf?: string;
  /** Replantations successives du tubercule (0 = plant certifié ou semis). */
  tuberGen: number;
  genotype: PtGenotype;
  /** Un haplotype par copie de chromosome. */
  haps: Record<QuantTraitId, number[][]>;
  pheno: PtPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: PtJournalEntry[];
}

export type PtStage = 'planting' | 'emergence' | 'hilling' | 'flowering' | 'berries' | 'tuberization' | 'haulm' | 'harvest' | 'storage' | 'seeds';
export const PT_STAGES: PtStage[] = ['planting', 'emergence', 'hilling', 'flowering', 'berries', 'tuberization', 'haulm', 'harvest', 'storage', 'seeds'];

export interface PtJournalEntry {
  id: string;
  date: number;
  stage?: PtStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type SkinColor = 'buff' | 'red' | 'purple';
export const SKIN_COLORS: SkinColor[] = ['buff', 'red', 'purple'];
export type FleshColor = 'white' | 'cream' | 'yellow' | 'orange' | 'red' | 'purple';
export const FLESH_COLORS: FleshColor[] = ['white', 'cream', 'yellow', 'orange', 'red', 'purple'];
export type TuberShape = 'round' | 'oval' | 'long';
export const TUBER_SHAPES: TuberShape[] = ['round', 'oval', 'long'];
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';

export interface FruitAppearance {
  skin: SkinColor;
  flesh: FleshColor;
  shape: TuberShape;
  deepEyes: boolean;
  /** Tubérise en jours longs (StCDF1). */
  longDay: boolean;
  selfCompatible: boolean;
  maleSterile: boolean;
  twoNPollen: boolean;
  ploidy: number;
  ebn: number;
  species: SpeciesId;
  cyto: Cytoplasm;
  inducer: boolean;
}

export interface TheoreticalRatio {
  variant: VariantId;
  pExpressed: number;
}

export type CrossLevel = 'same' | 'related' | 'difficult' | 'blocked';

export interface CrossCheck {
  level: CrossLevel;
  reason: string;
  /** Graines par ovule pollinisé (0–1). */
  effectiveSeedSet: number;
  seedSet: number;
  uncertain?: boolean;
  sterileParent?: 'a' | 'b';
  /** Ploïdie la plus fréquente des descendants. */
  childPloidy: number;
  f1Fertility: number;
  /** La plupart des graines viennent de gamètes 2n. */
  viaTwoN?: boolean;
  /** Part des graines qui sont des dihaploïdes (inducteur). */
  dihaploidShare?: number;
  /** Allèles S de la mère qui arrêtent une partie du pollen. */
  sharedS?: string[];
  /** Part du pollen arrêtée par l’auto-incompatibilité. */
  siRejected?: number;
}

export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

const LINKAGE_GROUPS: PtLocusId[][] = (() => {
  const m = new Map<number, PtLocusId[]>();
  for (const l of PT_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: PtLocusId[] = PT_LOCI.filter((l) => !l.chromosome).map((l) => l.id);
const VISIBLE_LOCI = PT_LOCI.filter((l) => !l.silent);

export function sizeClassOf(kg: number): SizeClass {
  return kg < 0.25 ? 'mini' : kg < 0.6 ? 'small' : kg < 1.2 ? 'medium' : kg < 2 ? 'large' : 'giant';
}

/** Choisit k indices distincts parmi n. */
function pickK(n: number, k: number, rng: Rng): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, k);
}

/** Toutes les combinaisons de k éléments parmi la liste. */
function combinations<T>(list: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (list.length < k) return [];
  const [head, ...rest] = list;
  return [...combinations(rest, k - 1).map((c) => [head, ...c]), ...combinations(rest, k)];
}

interface Gamete {
  alleles: Record<PtLocusId, string[]>;
  haps: Record<QuantTraitId, number[][]>;
  ploidy: number;
  ebn: number;
  unreduced: boolean;
}

export class PtEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('PDT');

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

  unitOf(trait: QuantTraitId, ind: PtIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Récolte par plante (kg de tubercules). */
  yieldKg(ind: PtIndividual): number {
    return Math.round(ind.pheno.weightKg * 100) / 100;
  }

  // --- Traits polygéniques à n copies --------------------------------------

  /** Valeur génétique 0–1 : moyenne pondérée des allèles « + » sur toutes les copies. */
  traitScore(trait: QuantTraitId, haps: number[][]): number {
    const eff = this.traits[trait].effects;
    let s = 0;
    let tot = 0;
    for (let l = 0; l < eff.length; l++) {
      let c = 0;
      for (const h of haps) c += h[l];
      s += eff[l] * (c / haps.length);
      tot += eff[l];
    }
    return tot ? s / tot : 0;
  }

  /** Diversité des copies, relative à ce qu’attend une plante issue de parents non apparentés (0 = consanguine, ~1 = normale). */
  relativeHeterozygosity(haps: number[][]): number {
    const p = haps.length;
    if (p < 2) return 0;
    const n = haps[0].length;
    let h = 0;
    let mean = 0;
    for (let l = 0; l < n; l++) {
      let c = 0;
      for (const x of haps) c += x[l];
      const f = c / p;
      h += 1 - f * f - (1 - f) * (1 - f);
      mean += f;
    }
    h /= n;
    mean /= n;
    const expected = 2 * mean * (1 - mean) * (1 - 1 / p);
    return expected > 0.02 ? Math.min(1.2, h / expected) : h > 0 ? 1 : 0;
  }

  /** Haplotypes (une par copie) d’une plante non consanguine dont la valeur approche `target`. */
  private hapsForTarget(trait: QuantTraitId, target: number, ploidy: number): number[][] {
    const t = this.traits[trait];
    const u = Math.max(0.03, Math.min(0.97, target));
    const haps = Array.from({ length: ploidy }, () => t.randomHaplotype(this.rng, u));
    const eff = t.effects;
    const tot = eff.reduce((a, b) => a + b, 0);
    let score = this.traitScore(trait, haps);
    for (let pass = 0; pass < 6 && Math.abs(score - target) > 0.004; pass++) {
      const order = pickK(eff.length, eff.length, this.rng);
      for (const l of order) {
        const k = Math.floor(this.rng() * ploidy);
        const delta = ((haps[k][l] ? -1 : 1) * eff[l]) / ploidy / tot;
        if (Math.abs(score + delta - target) < Math.abs(score - target)) {
          haps[k][l] = 1 - haps[k][l];
          score += delta;
        }
      }
    }
    return haps;
  }

  /** Vigueur (0,45 à 1) selon l’hétérozygotie relative des polygènes. */
  vigor(haps: PtIndividual['haps']): number {
    let rel = 0;
    for (const t of QUANT_TRAITS) rel += Math.min(1.2, this.relativeHeterozygosity(haps[t]));
    const x = Math.min(1, rel / QUANT_TRAITS.length / 1.05);
    return INBRED_VIGOR + (1 - INBRED_VIGOR) * x * x * x;
  }

  // --- Construction ----------------------------------------------------------

  private computePhenotype(haps: PtIndividual['haps']): PtPhenotype {
    const value = (trait: QuantTraitId) => this.traitScore(trait, haps[trait]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const vig = this.vigor(haps);
    return {
      weightKg: Math.max(0.01, Math.round(this.fromUnit('weight', value('weight')) * vig * 100) / 100),
      days: this.fromUnit('days', value('days')),
      dm: this.fromUnit('dm', value('dm')),
      frostC: this.fromUnit('frost', value('frost')),
    };
  }

  private build(
    genotype: PtGenotype,
    haps: PtIndividual['haps'],
    meta: Pick<PtIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility' | 'cyto' | 'ploidy' | 'ebn' | 'tuberGen'> &
      Partial<Pick<PtIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder' | 'doubledFromId' | 'inducer' | 'dihaploidOf'>>
  ): PtIndividual {
    return { crop: 'patate', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(haps), createdAt: Date.now() };
  }

  varietyTargets(v: PtVariety): Record<QuantTraitId, number> {
    return { weight: v.weightKg, days: v.days, dm: v.dm, frost: v.frostC };
  }

  varietyPloidy(v: Pick<PtVariety, 'species' | 'ploidy' | 'ebn'>): { ploidy: number; ebn: number } {
    const sp = SPECIES_PLOIDY[v.species];
    const ploidy = v.ploidy ?? sp.ploidy;
    return { ploidy, ebn: v.ebn ?? (sp.ebn * ploidy) / sp.ploidy };
  }

  /** Génotype d’une variété : `alleles` donne le nombre de copies de chaque variante. */
  genotypeFromVariety(v: Pick<PtVariety, 'alleles' | 's' | 'species' | 'ploidy' | 'ebn' | 'genotype'>): PtGenotype {
    const { ploidy } = this.varietyPloidy(v);
    if (v.genotype) return this.fillGenotype(v.genotype, ploidy);
    const g = {} as PtGenotype;
    for (const l of PT_LOCI) g[l.id] = Array.from({ length: ploidy }, () => l.standard);
    for (const [id, n] of Object.entries(v.alleles) as Array<[VariantId, number]>) {
      const pair = VARIANT_ALLELE[id];
      if (!pair || !n) continue;
      const [locus, allele] = pair;
      for (let i = 0; i < Math.min(ploidy, n); i++) g[locus][i] = allele;
    }
    const s = v.s?.length ? v.s : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    g.s = Array.from({ length: ploidy }, (_, i) => s[i % s.length]);
    return g;
  }

  private fillGenotype(g: Partial<PtGenotype>, ploidy: number): PtGenotype {
    const out = {} as PtGenotype;
    for (const l of PT_LOCI) out[l.id] = g[l.id] && g[l.id]!.length === ploidy ? [...g[l.id]!] : Array.from({ length: ploidy }, () => l.standard);
    return out;
  }

  createFromVariety(v: PtVariety, label?: string): PtIndividual {
    const genotype = this.genotypeFromVariety(v);
    const { ploidy, ebn } = this.varietyPloidy(v);
    const haps = {} as PtIndividual['haps'];
    const targets = this.varietyTargets(v);
    for (const trait of QUANT_TRAITS) {
      const saved = v.haps?.[trait];
      if (saved && saved.length === ploidy) haps[trait] = saved.map((h) => [...h]);
      else if (v.inbred) {
        const h = this.traits[trait].haplotypeForTarget(this.toUnit(trait, targets[trait] / (trait === 'weight' ? INBRED_VIGOR : 1)), this.rng);
        haps[trait] = Array.from({ length: ploidy }, () => [...h]);
      } else haps[trait] = this.hapsForTarget(trait, this.toUnit(trait, targets[trait]), ploidy);
    }
    return this.build(genotype, haps, {
      label: label || v.name,
      generation: 0,
      parentIds: null,
      selfed: false,
      varietyId: v.id,
      species: v.species,
      hybridWith: v.hybridWith,
      ploidy,
      ebn,
      fertility: v.fertility ?? ploidyFertility(ploidy),
      cyto: v.cyto ?? 'T',
      inducer: v.inducer || undefined,
      hybridFounder: v.hybrid || undefined,
      tuberGen: 0,
    });
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>>; cyto?: Cytoplasm }): PtIndividual {
    const sp = SPECIES_PLOIDY[opts.species];
    const ploidy = sp.ploidy;
    const alleles: Partial<Record<VariantId, number>> = {};
    for (const v of opts.variants) if (VARIANT_ALLELE[v]?.[0] !== 's') alleles[v] = ploidy;
    const sVar = opts.variants.filter((x) => VARIANT_ALLELE[x]?.[0] === 's');
    const genotype = this.genotypeFromVariety({ alleles, s: sVar.length ? sVar : undefined, species: opts.species });
    const haps = {} as PtIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = this.hapsForTarget(trait, opts.targets[trait] ?? 0.5, ploidy);
    return this.build(genotype, haps, {
      label: opts.label,
      generation: 0,
      parentIds: null,
      selfed: false,
      species: opts.species,
      ploidy,
      ebn: sp.ebn,
      fertility: ploidyFertility(ploidy),
      cyto: opts.cyto ?? 'T',
      tuberGen: 0,
    });
  }

  private copyParts(ind: PtIndividual, times = 1): { genotype: PtGenotype; haps: PtIndividual['haps'] } {
    const haps = {} as PtIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const list = ind.haps[trait].map((h) => [...h]);
      haps[trait] = times === 2 ? [...list, ...list.map((h) => [...h])] : list;
    }
    const genotype = {} as PtGenotype;
    for (const id of LOCUS_IDS) genotype[id] = times === 2 ? [...ind.genotype[id], ...ind.genotype[id]] : [...ind.genotype[id]];
    return { genotype, haps };
  }

  /** Replanter un tubercule : copie exacte du génotype (la variété). */
  cloneOf(ind: PtIndividual, label?: string): PtIndividual {
    const { genotype, haps } = this.copyParts(ind);
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (tubercule)`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      hybridFounder: ind.hybridFounder,
      species: ind.species,
      hybridWith: ind.hybridWith,
      ploidy: ind.ploidy,
      ebn: ind.ebn,
      fertility: ind.fertility,
      cyto: ind.cyto,
      inducer: ind.inducer,
      doubledFromId: ind.doubledFromId,
      dihaploidOf: ind.dihaploidOf,
      tuberGen: (ind.tuberGen ?? 0) + 1,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  /** Doubler les chromosomes (colchicine, ou culture de tissus) : 2x → 4x, 3x → 6x. */
  canDouble(ind: PtIndividual): boolean {
    return ind.ploidy <= 3;
  }

  doubleChromosomes(ind: PtIndividual, label?: string): PtIndividual {
    const { genotype, haps } = this.copyParts(ind, 2);
    const ploidy = ind.ploidy * 2;
    return this.build(genotype, haps, {
      label: label || `${ind.label} 2×`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      species: ind.species,
      hybridWith: ind.hybridWith,
      ploidy,
      ebn: ind.ebn * 2,
      fertility: Math.min(ploidyFertility(ploidy), DOUBLED_FERTILITY),
      cyto: ind.cyto,
      doubledFromId: ind.id,
      tuberGen: 0,
    });
  }

  // --- Méiose ----------------------------------------------------------------

  private twoNPollenRate(ind: PtIndividual): number {
    if (ind.ploidy === 2 && this.has(ind.genotype, 'ps')) return TWO_N_POLLEN_PS;
    return ind.ploidy === 2 ? TWO_N_POLLEN_BASE : TWO_N_POLLEN_BASE / 2;
  }

  /** Gamète : la moitié des copies (tirées au hasard, avec liaison) ou toutes si non réduit. */
  private gamete(ind: PtIndividual, unreduced: boolean): Gamete {
    const p = ind.ploidy;
    const alleles = {} as Record<PtLocusId, string[]>;
    const haps = {} as Record<QuantTraitId, number[][]>;
    if (unreduced) {
      for (const id of LOCUS_IDS) alleles[id] = [...ind.genotype[id]];
      for (const t of QUANT_TRAITS) haps[t] = ind.haps[t].map((h) => [...h]);
      return { alleles, haps, ploidy: p, ebn: gameteEbn(ind.ebn, true), unreduced };
    }
    const k = p % 2 === 0 ? p / 2 : this.rng() < 0.5 ? Math.floor(p / 2) : Math.ceil(p / 2);
    for (const group of LINKAGE_GROUPS) {
      let chosen = pickK(p, k, this.rng);
      let prev = -1;
      for (const id of group) {
        const cM = LOCUS_BY_ID[id].cM;
        if (prev >= 0) {
          const r = kosambi(cM - prev);
          chosen = chosen.map((c) => {
            if (this.rng() >= r) return c;
            const free = Array.from({ length: p }, (_, i) => i).filter((i) => !chosen.includes(i));
            return free.length ? free[Math.floor(this.rng() * free.length)] : c;
          });
          chosen = [...new Set(chosen)];
          while (chosen.length < k) {
            const free = Array.from({ length: p }, (_, i) => i).filter((i) => !chosen.includes(i));
            chosen.push(free[Math.floor(this.rng() * free.length)]);
          }
        }
        alleles[id] = chosen.map((c) => ind.genotype[id][c]);
        prev = cM;
      }
    }
    for (const id of UNLINKED) alleles[id] = pickK(p, k, this.rng).map((c) => ind.genotype[id][c]);
    for (const t of QUANT_TRAITS) {
      const src = ind.haps[t];
      const n = src[0].length;
      const out = Array.from({ length: k }, () => new Array<number>(n).fill(0));
      for (let l = 0; l < n; l++) {
        const pick = pickK(p, k, this.rng);
        for (let j = 0; j < k; j++) out[j][l] = src[pick[j]][l];
      }
      haps[t] = out;
    }
    return { alleles, haps, ploidy: k, ebn: (ind.ebn * k) / p, unreduced };
  }

  /** Le style de la mère arrête-t-il ce grain de pollen ? */
  private pollenRejected(mother: PtIndividual, pollen: Gamete): boolean {
    if (pollen.alleles.sli.includes('Sli')) return false;
    const kinds = [...new Set(pollen.alleles.s)];
    if (kinds.length !== 1) return false; // pollen hétéroallélique (2x) : pas de rejet
    return mother.genotype.s.includes(kinds[0]);
  }

  // --- Fleurs et barrières ------------------------------------------------------

  /** Cytoplasme W (S. stoloniferum, S. demissum) : anthères sans pollen viable. */
  isMaleSterile(ind: PtIndividual): boolean {
    return ind.cyto === 'W';
  }

  isSelfCompatible(ind: PtIndividual): boolean {
    if (ind.ploidy >= 4) return true;
    return this.has(ind.genotype, 'Sli');
  }

  canPollinate(ind: PtIndividual): boolean {
    return ind.fertility > 0.001 && !this.isMaleSterile(ind);
  }

  needsEmasculation(ind: PtIndividual): boolean {
    return !this.isMaleSterile(ind) && this.isSelfCompatible(ind);
  }

  /** Part des graines croisées au jardin (bourdons ; la fleur de pomme de terre ne donne pas de nectar). */
  outcrossingRate(ind: PtIndividual): number {
    if (!this.canPollinate(ind)) return 1;
    return this.isSelfCompatible(ind) ? 0.2 : 1;
  }

  /** Une tentative de graine : renvoie les gamètes qui ont réussi, ou null. */
  private trySeed(a: PtIndividual, b: PtIndividual, stats?: { siRejected: number; pollen: number; ebnFail: number }): { egg: Gamete; pollen: Gamete; dihaploid: boolean } | null {
    const fa = a.fertility;
    const fb = b.fertility;
    if (this.rng() > fa) return null;
    if (b.inducer && a.ploidy >= 2 && this.rng() < HAPLOID_INDUCTION) {
      const egg = this.gamete(a, false);
      return { egg, pollen: egg, dihaploid: true };
    }
    const eggUnreduced = this.rng() < TWO_N_EGG;
    const egg = this.gamete(a, eggUnreduced);
    const rate2n = this.twoNPollenRate(b);
    for (let t = 0; t < POLLEN_TRIES; t++) {
      if (this.rng() > Math.max(0.05, fb)) continue; // grain de pollen avorté
      const pollen = this.gamete(b, this.rng() < rate2n);
      if (stats) stats.pollen++;
      if (this.pollenRejected(a, pollen)) {
        if (stats) stats.siRejected++;
        continue;
      }
      if (Math.abs(egg.ebn - pollen.ebn) > 1e-9) {
        if (stats) stats.ebnFail++;
        return null; // l’albumen avorte : graine vide
      }
      return { egg, pollen, dihaploid: false };
    }
    return null;
  }

  crossCheck(a: PtIndividual, b: PtIndividual): CrossCheck {
    const base = { childPloidy: a.ploidy, f1Fertility: 1, seedSet: 0 };
    if (a.fertility <= 0.001) return { ...base, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...base, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (this.isMaleSterile(b)) return { ...base, level: 'blocked', reason: 'wFather', sterileParent: 'b', effectiveSeedSet: 0 };
    // Estimation par simulation, avec un générateur à part (affichage stable).
    const saved = this.rng;
    this.rng = mulberry32(0x5eed ^ a.ploidy * 31 ^ b.ploidy * 7);
    const N = 400;
    const stats = { siRejected: 0, pollen: 0, ebnFail: 0 };
    const ploidies = new Map<number, number>();
    let ok = 0;
    let twoN = 0;
    let dih = 0;
    for (let i = 0; i < N; i++) {
      const r = this.trySeed(a, b, stats);
      if (!r) continue;
      ok++;
      if (r.dihaploid) dih++;
      else if (r.egg.unreduced || r.pollen.unreduced) twoN++;
      const pl = r.dihaploid ? r.egg.ploidy : r.egg.ploidy + r.pollen.ploidy;
      ploidies.set(pl, (ploidies.get(pl) ?? 0) + 1);
    }
    this.rng = saved;
    const eff = ok / N;
    const childPloidy = [...ploidies.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? a.ploidy;
    const siRejected = stats.pollen ? stats.siRejected / stats.pollen : 0;
    const sharedS = siRejected > 0 ? [...new Set(a.genotype.s.filter((s) => b.genotype.s.includes(s)))] : undefined;
    const selfing = a.id === b.id;
    const parentsFert = Math.min(a.fertility, b.fertility);
    const f1Fertility = ploidyFertility(childPloidy) * (a.species !== b.species ? 0.85 : 1);
    const out: CrossCheck = { ...base, childPloidy, f1Fertility, seedSet: eff, effectiveSeedSet: eff, level: 'same', reason: 'same', sharedS, siRejected };
    if (b.inducer) {
      out.dihaploidShare = ok ? dih / ok : 0;
      out.level = eff > 0 ? 'difficult' : 'blocked';
      out.reason = 'inducer';
      return out;
    }
    if (eff === 0) {
      out.level = 'blocked';
      out.reason = a.ebn !== b.ebn ? 'ebn' : siRejected > 0.9 ? (selfing ? 'siSelf' : 'siShared') : 'lowFertility';
      return out;
    }
    if (ok && twoN / ok > 0.5) {
      out.viaTwoN = true;
      out.level = 'difficult';
      out.reason = 'twoNPollen';
      return out;
    }
    if (selfing && a.ploidy === 2 && this.has(a.genotype, 'Sli')) {
      out.level = 'related';
      out.reason = 'sli';
      return out;
    }
    if (a.species !== b.species || a.hybridWith || b.hybridWith) {
      out.level = eff >= 0.5 * parentsFert ? 'related' : 'difficult';
      out.reason = 'ebnMatch';
      return out;
    }
    if (eff < 0.9 * parentsFert) {
      out.level = 'difficult';
      out.reason = siRejected > 0.3 ? 'siPartial' : 'lowFertility';
      return out;
    }
    if (parentsFert < 0.999) {
      out.level = 'difficult';
      out.reason = 'lowFertility';
    }
    return out;
  }

  cross(a: PtIndividual, b: PtIndividual, n: number, labelPrefix?: string): PtIndividual[] {
    if (a.fertility <= 0.001 || b.fertility <= 0.001 || this.isMaleSterile(b)) return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const out: PtIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      const r = this.trySeed(a, b);
      if (!r) continue;
      k++;
      if (r.dihaploid) {
        out.push(
          this.build(r.egg.alleles as PtGenotype, r.egg.haps, {
            label: `${a.label} (2x) #${k}`,
            generation,
            parentIds: [a.id, b.id],
            selfed: false,
            species: a.species,
            hybridWith: a.hybridWith,
            ploidy: r.egg.ploidy,
            ebn: r.egg.ebn,
            fertility: ploidyFertility(r.egg.ploidy),
            cyto: a.cyto,
            dihaploidOf: a.id,
            tuberGen: 0,
          })
        );
        continue;
      }
      const genotype = {} as PtGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [...r.egg.alleles[id], ...r.pollen.alleles[id]];
      const haps = {} as PtIndividual['haps'];
      for (const t of QUANT_TRAITS) haps[t] = [...r.egg.haps[t], ...r.pollen.haps[t]];
      const ploidy = r.egg.ploidy + r.pollen.ploidy;
      const interspecific = a.species !== b.species;
      const hybridWith = interspecific ? b.species : a.hybridWith ?? b.hybridWith;
      out.push(
        this.build(genotype, haps, {
          label: `${prefix} #${k}`,
          generation,
          parentIds: [a.id, b.id],
          selfed,
          species: a.species,
          hybridWith: hybridWith && hybridWith !== a.species ? hybridWith : undefined,
          ploidy,
          ebn: r.egg.ebn + r.pollen.ebn,
          fertility: ploidyFertility(ploidy) * (interspecific ? 0.85 : 1),
          cyto: a.cyto,
          tuberGen: 0,
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: PtGenotype, locus: PtLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const list = g[locus];
    for (const a of def.alleles) if (list.includes(a.allele)) return a.allele;
    return list[0];
  }

  has(g: PtGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete || def.silent) return g[locus].includes(allele);
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: PtGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return g[locus].filter((x) => x === allele).length;
  }

  /** Porteur d’une variante récessive qui ne s’exprime pas. */
  isCarrier(g: PtGenotype, id: VariantId): boolean {
    return this.dose(g, id) >= 1 && !this.has(g, id);
  }

  normalize(ind: PtIndividual): PtIndividual {
    const sp = SPECIES_PLOIDY[ind.species] ?? { ploidy: 4, ebn: 4 };
    const ploidy = ind.ploidy ?? sp.ploidy;
    const base: PtIndividual = { ...ind, crop: 'patate', ploidy, ebn: ind.ebn ?? sp.ebn, fertility: ind.fertility ?? 1, cyto: ind.cyto ?? 'T', tuberGen: ind.tuberGen ?? 0 };
    const missingLoci = PT_LOCI.filter((l) => !ind.genotype[l.id] || ind.genotype[l.id].length !== ploidy);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t] || ind.haps[t].length !== ploidy);
    if (!missingLoci.length && !missingTraits.length) return base;
    const genotype = this.fillGenotype(ind.genotype, ploidy);
    const haps = { ...ind.haps };
    for (const t of missingTraits) haps[t] = this.hapsForTarget(t, 0.5, ploidy);
    return { ...base, genotype, haps, pheno: { ...this.computePhenotype(haps), ...ind.pheno } };
  }

  appearance(ind: PtIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.ploidy, ind.ebn, ind.species, ind.cyto, !!ind.inducer);
  }

  appearanceFromVariety(v: PtVariety): FruitAppearance {
    const g = this.genotypeFromVariety(v);
    const { ploidy, ebn } = this.varietyPloidy(v);
    return this.appearanceOf(g, ploidy, ebn, v.species, v.cyto ?? 'T', !!v.inducer);
  }

  appearanceOf(g: PtGenotype, ploidy: number, ebn: number, sp: SpeciesId, cyto: Cytoplasm = 'T', inducer = false): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const d = has('D');
    const purple = d && has('P');
    const red = d && !purple && has('R');
    const skin: SkinColor = purple ? 'purple' : red ? 'red' : 'buff';
    let flesh: FleshColor;
    if (has('Pf') && (purple || red)) flesh = purple ? 'purple' : 'red';
    else if (has('Y')) flesh = has('zep') ? 'orange' : this.dose(g, 'Y') / ploidy >= 0.5 ? 'yellow' : 'cream';
    else flesh = 'white';
    const ro = this.dose(g, 'Ro') / ploidy;
    const shape: TuberShape = ro === 0 ? 'long' : ro < 0.5 ? 'oval' : 'round';
    const sli = has('Sli');
    return {
      skin,
      flesh,
      shape,
      deepEyes: has('Eyd'),
      longDay: has('Cdf'),
      selfCompatible: ploidy >= 4 || sli,
      maleSterile: cyto === 'W',
      twoNPollen: ploidy === 2 && has('ps'),
      ploidy,
      ebn,
      species: sp,
      cyto,
      inducer,
    };
  }

  resistances(ind: PtIndividual): VariantId[] {
    return (['R1', 'Rpi-blb1', 'H1', 'Ry'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  /** Code de résistances (« R1 · Rpi-blb · H1 · Ry »). */
  resistanceCode(ind: PtIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    if (r.has('R1')) parts.push('R1');
    if (r.has('Rpi-blb1')) parts.push('Rpi-blb');
    if (r.has('H1')) parts.push('H1');
    if (r.has('Ry')) parts.push('Ry');
    return parts.join(' · ');
  }

  sizeClass(ind: PtIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightKg);
  }

  // --- Hétérozygotie ------------------------------------------------------------

  /** Part des loci mendéliens dont les copies ne sont pas toutes identiques. */
  mendelianHeterozygosity(ind: PtIndividual): number {
    return LOCUS_IDS.filter((id) => new Set(ind.genotype[id]).size > 1).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: PtIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += Math.min(1, this.relativeHeterozygosity(haps[trait]));
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: PtIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  /** Lignée entièrement homozygote (rare chez la pomme de terre : la variété est un clone). */
  isFixed(ind: PtIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: PtIndividual): PtLocusId[] {
    return LOCUS_IDS.filter((id) => new Set(ind.genotype[id]).size > 1);
  }

  // --- Prédiction mendélienne (gamètes réduits, ou 2n quand ils dominent) ------

  private locusGametes(list: string[], unreduced: boolean): string[][] {
    if (unreduced) return [list];
    const p = list.length;
    const k = Math.floor(p / 2);
    return combinations(
      list.map((_, i) => i),
      k
    ).map((c) => c.map((i) => list[i]));
  }

  predict(a: PtIndividual, b: PtIndividual): TheoreticalRatio[] {
    if (b.inducer) return [];
    const check = this.crossCheck(a, b);
    const pollen2n = !!check.viaTwoN && b.ploidy === 2 && a.ploidy !== 2;
    const out: TheoreticalRatio[] = [];
    for (const def of VISIBLE_LOCI) {
      const ga = this.locusGametes(a.genotype[def.id], false);
      const gb = this.locusGametes(b.genotype[def.id], pollen2n);
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!a.genotype[def.id].includes(al.allele) && !b.genotype[def.id].includes(al.allele)) continue;
        let p = 0;
        for (const x of ga)
          for (const y of gb) {
            const g = { ...a.genotype, [def.id]: [...x, ...y] } as PtGenotype;
            if (this.has(g, al.id)) p++;
          }
        p /= ga.length * gb.length;
        const inA = this.has(a.genotype, al.id);
        const inB = this.has(b.genotype, al.id);
        if ((p > 0 && p < 1) || inA !== inB) out.push({ variant: al.id, pExpressed: p });
      }
    }
    return out;
  }

  variantLabel(id: VariantId): string {
    return VARIANT_ALLELE[id][1];
  }

  /** Écriture d’un locus : « YYyy », ou « zep×2 » pour les symboles longs. */
  locusCode(list: string[], locus: PtLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
    const sorted = [...list].sort((x, y) => rank(x) - rank(y));
    if (def.silent) return sorted.join('');
    if (sorted.every((x) => x.length <= 2)) return sorted.join('');
    const counts = new Map<string, number>();
    for (const x of sorted) if (x !== def.standard) counts.set(x, (counts.get(x) ?? 0) + 1);
    return [...counts.entries()].map(([x, n]) => `${x}×${n}`).join(' ');
  }

  /** Code génotypique d’une variété du catalogue (sans créer de plante). */
  varietyCode(v: PtVariety): string {
    const g = this.genotypeFromVariety(v);
    return PT_LOCI.filter((d) => !d.silent && !g[d.id].every((x) => x === d.standard))
      .map((d) => this.locusCode(g[d.id], d.id))
      .join(' ');
  }

  genotypeCode(ind: PtIndividual): string {
    const parts: string[] = [];
    for (const def of PT_LOCI) {
      const list = ind.genotype[def.id];
      if (!def.silent && list.every((x) => x === def.standard)) continue;
      parts.push(this.locusCode(list, def.id));
    }
    const head = `${ind.ploidy}x ${ind.ebn}EBN${ind.cyto === 'W' ? ' [W]' : ''}`;
    return `${head} · ${parts.join(' ')}`;
  }
}
