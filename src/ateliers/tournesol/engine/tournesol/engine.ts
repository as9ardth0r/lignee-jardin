/**
 * Moteur de croisement du tournesol, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques :
 *  - le capitule est une inflorescence : des centaines de fleurons
 *    tubulaires (le cœur) s’ouvrent en spirale, de l’extérieur vers le
 *    centre, sur une à deux semaines ; les ligules colorées du bord sont
 *    stériles ;
 *  - PROTANDRIE : chaque fleuron libère son pollen la veille de présenter
 *    son stigmate ; le tournesol cultivé est auto-compatible mais très
 *    visité par les abeilles (environ la moitié des graines sont croisées
 *    au jardin) ; le tournesol sauvage est AUTO-INCOMPATIBLE ;
 *  - pour croiser : ensacher le capitule avant l’ouverture, retirer le
 *    pollen de la mère (ou utiliser une mère sans pollen), puis frotter le
 *    capitule du père ;
 *  - forte VIGUEUR HYBRIDE : une lignée consanguine perd beaucoup de vigueur,
 *    d’où les variétés hybrides F1.
 *
 * Traits quantitatifs : hauteur, diamètre du capitule, jours du semis à la
 * floraison, remplissage en graines (0 à 10).
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossLevel } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, HA_LOCI, VARIANT_ALLELE, functionalS, type HaLocusId, type SpeciesId, type VariantId } from './loci';
import type { HaVariety } from './varieties';

export type QuantTraitId = 'height' | 'florets' | 'days' | 'scent';
export const QUANT_TRAITS: QuantTraitId[] = ['height', 'florets', 'days', 'scent'];
export const MAIN_TRAITS: QuantTraitId[] = ['height', 'florets', 'days', 'scent'];

const POLY_LOCI: Record<QuantTraitId, number> = { height: 22, florets: 18, days: 20, scent: 14 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Hauteur en fleur (cm), avant l’effet du gène nain. */
  height: { min: 50, max: 450, log: true, noise: 0.012, digits: 0 },
  /** Diamètre du capitule principal (cm), avant l’effet de la ramification. */
  florets: { min: 6, max: 45, log: true, noise: 0.02, digits: 0 },
  /** Jours du semis à la floraison. */
  days: { min: 50, max: 110, noise: 0.012, digits: 0 },
  /** Remplissage en graines (0 = vide, 10 = capitule bien plein). */
  scent: { min: 0, max: 10, noise: 0.02, digits: 1 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof HaPhenotype> = {
  height: 'heightCm',
  florets: 'florets',
  days: 'days',
  scent: 'scent',
};

/** Vigueur d’une lignée totalement consanguine (forte dépression de consanguinité). */
const INBRED_VIGOR = 0.8;
/** Hauteur d’un tournesol nain (dw/dw), rapportée à celle d’une plante normale. */
const DWARF_FACTOR = 0.35;
/** Diamètre des capitules d’une plante ramifiée, rapporté à celui d’un capitule unique. */
const BRANCH_FACTOR = 0.4;

export type HaGenotype = Record<HaLocusId, Diploid<string>>;

export interface HaPhenotype {
  heightCm: number;
  florets: number;
  days: number;
  scent: number;
  /** Capitules par plante sur la saison (1 pour une tige unique ; davantage si ramifiée). */
  stems: number;
}

export interface HaIndividual {
  crop: 'tournesol';
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility: number;
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  selfed: boolean;
  /** Croisement entre sœurs (repli des lignées auto-incompatibles). */
  sib?: boolean;
  varietyId?: string;
  hybridFounder?: boolean;
  genotype: HaGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: HaPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: HaJournalEntry[];
}

export type HaStage = 'sowing' | 'thinning' | 'staking' | 'buds' | 'bagging' | 'flowering' | 'pollination' | 'cutting' | 'ripening' | 'seeds';
export const HA_STAGES: HaStage[] = ['sowing', 'thinning', 'staking', 'buds', 'bagging', 'flowering', 'pollination', 'cutting', 'ripening', 'seeds'];

export interface HaJournalEntry {
  id: string;
  date: number;
  stage?: HaStage;
  heightCm?: number;
  stems?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type FlowerColor = 'cream' | 'lemon' | 'yellow' | 'orange' | 'bronze' | 'red' | 'mahogany';
export const FLOWER_COLORS: FlowerColor[] = ['cream', 'lemon', 'yellow', 'orange', 'bronze', 'red', 'mahogany'];
export type FlowerShape = 'normal' | 'semi' | 'peloric';
/** normal = capitule simple, semi = semi-double (Dbl une dose), peloric = double « nounours » (Dbl/Dbl). */
export const FLOWER_SHAPES: FlowerShape[] = ['normal', 'semi', 'peloric'];
export type HeightClass = 'dwarf' | 'medium' | 'tall';
export const HEIGHT_CLASSES: HeightClass[] = ['dwarf', 'medium', 'tall'];

export interface FlowerAppearance {
  color: FlowerColor;
  /** Cœur foncé (P). */
  face: boolean;
  /** Sans pollen (ms/ms). */
  veins: boolean;
  /** Plante ramifiée (b/b). */
  flecked: boolean;
  shape: FlowerShape;
  selfIncompatible: boolean;
  species: SpeciesId;
}

export interface PredictedClass {
  app: FlowerAppearance;
  rust: boolean;
  p: number;
}

export interface CrossCheck {
  level: CrossLevel;
  seedSet: number;
  reason: string;
  uncertain?: boolean;
  sterileParent?: 'a' | 'b';
  effectiveSeedSet: number;
  f1Fertility: number;
  /** Part du pollen accepté par le pistil (allèles S). */
  sCompat: number;
}

export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

const LINKAGE_GROUPS: HaLocusId[][] = (() => {
  const m = new Map<number, HaLocusId[]>();
  for (const l of HA_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: HaLocusId[] = HA_LOCI.filter((l) => !l.chromosome).map((l) => l.id);
/** Groupes de loci visibles pour la prédiction (le locus S, invisible, est exclu). */
const VISIBLE_GROUPS: HaLocusId[][] = [...LINKAGE_GROUPS.map((g) => g.filter((id) => !LOCUS_BY_ID[id].silent)), ...UNLINKED.filter((id) => !LOCUS_BY_ID[id].silent).map((id) => [id])].filter((g) => g.length);
/** Loci pris en compte pour la fixation : le locus S d’une lignée auto-incompatible reste forcément hétérozygote. */
const FIX_LOCI: HaLocusId[] = LOCUS_IDS.filter((id) => id !== 's');

export function heightClassOf(cm: number): HeightClass {
  return cm < 100 ? 'dwarf' : cm < 200 ? 'medium' : 'tall';
}

export function appearanceKey(app: FlowerAppearance): string {
  return `${app.color}|${app.face ? 1 : 0}|${app.veins ? 1 : 0}|${app.flecked ? 1 : 0}|${app.shape}`;
}

export class HaEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('TRN');

  constructor(seed = 20261002) {
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

  unitOf(trait: QuantTraitId, ind: HaIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Capitules par plante (tiges à couper ou têtes à graines). */
  stems(ind: HaIndividual): number {
    return ind.pheno.stems;
  }

  // --- Vigueur et haplotypes -------------------------------------------------

  relativeHeterozygosity(haps: [number[], number[]]): number {
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
    return expected > 0.02 ? Math.min(1.3, het / expected) : het > 0 ? 1 : 0;
  }

  vigor(haps: HaIndividual['haps']): number {
    let rel = 0;
    for (const t of QUANT_TRAITS) rel += Math.min(1.3, this.relativeHeterozygosity(haps[t]));
    const x = Math.min(1, rel / QUANT_TRAITS.length / 0.95);
    return INBRED_VIGOR + (1 - INBRED_VIGOR) * Math.pow(x, 1.4);
  }

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

  /** Nanisme (dw/dw) et ramification (b/b) : hauteur, taille et nombre des capitules. */
  private withHabit(p: HaPhenotype, g: HaGenotype): HaPhenotype {
    const out = { ...p };
    if (this.has(g, 'dw')) out.heightCm = Math.max(20, Math.round(p.heightCm * DWARF_FACTOR));
    if (this.has(g, 'b')) out.florets = Math.max(3, Math.round(p.florets * BRANCH_FACTOR));
    else out.stems = 1;
    return out;
  }

  private computePhenotype(haps: HaIndividual['haps']): HaPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const vig = this.vigor(haps);
    const hu = value('height');
    const heightCm = Math.max(10, Math.round(this.fromUnit('height', hu) * (0.8 + 0.2 * vig)));
    // Une plante ramifiée porte une à plusieurs dizaines de capitules, d’autant plus qu’elle est haute et vigoureuse.
    const stems = Math.max(4, Math.round((8 + 22 * Math.max(0, Math.min(1, hu))) * vig));
    return {
      heightCm,
      florets: Math.max(3, Math.round(this.fromUnit('florets', value('florets')) * (0.7 + 0.3 * vig))),
      days: this.fromUnit('days', value('days')),
      scent: Math.max(0, this.fromUnit('scent', value('scent'))),
      stems,
    };
  }

  private build(
    genotype: HaGenotype,
    haps: HaIndividual['haps'],
    meta: Pick<HaIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility'> & Partial<Pick<HaIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder' | 'sib'>>
  ): HaIndividual {
    return { crop: 'tournesol', id: this.ids.next(), ...meta, genotype, haps, pheno: this.withHabit(this.computePhenotype(haps), genotype), createdAt: Date.now() };
  }

  varietyTargets(v: HaVariety): Record<QuantTraitId, number> {
    const vig = v.inbred ? INBRED_VIGOR : 1;
    const dwarf = v.variants.includes('dw') ? DWARF_FACTOR : 1;
    const branch = v.variants.includes('b') ? BRANCH_FACTOR : 1;
    return { height: v.heightCm / dwarf / (0.8 + 0.2 * vig), florets: v.florets / branch / (0.7 + 0.3 * vig), days: v.days, scent: v.scent };
  }

  private varietyGenotype(v: Pick<HaVariety, 'variants' | 'het' | 'sAlleles'>): HaGenotype {
    const genotype = this.genotypeFromVariants(v.variants);
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      genotype[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    if (v.sAlleles) genotype.s = [v.sAlleles[0], v.sAlleles[1]];
    return genotype;
  }

  createFromVariety(v: HaVariety, label?: string): HaIndividual {
    const genotype = this.varietyGenotype(v);
    const meta = {
      label: label || v.name,
      generation: 0,
      parentIds: null,
      selfed: false,
      varietyId: v.id,
      species: v.species,
      fertility: v.fertility ?? 1,
      hybridWith: v.hybridWith,
    } as const;
    const haps = {} as HaIndividual['haps'];
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

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>>; sAlleles?: [string, string] }): HaIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    if (opts.sAlleles) genotype.s = [...opts.sAlleles];
    const haps = {} as HaIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = this.outbredHaps(trait, opts.targets[trait] ?? 0.5);
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1 });
  }

  private copyParts(ind: HaIndividual): { genotype: HaGenotype; haps: HaIndividual['haps'] } {
    const haps = {} as HaIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as HaGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    return { genotype, haps };
  }

  /** Bouturage d’une tige non fleurie : copie exacte de la plante. */
  cloneOf(ind: HaIndividual, label?: string): HaIndividual {
    const { genotype, haps } = this.copyParts(ind);
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (bouture)`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      sib: ind.sib,
      varietyId: ind.varietyId,
      hybridFounder: ind.hybridFounder,
      species: ind.species,
      hybridWith: ind.hybridWith,
      fertility: ind.fertility,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  /** Variantes d’une lignée fixée (le locus S n’est pas exigé homozygote). */
  fixedVariants(ind: HaIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of HA_LOCI) {
      if (def.id === 's') continue;
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: HaIndividual): Record<HaLocusId, string> {
    const g = {} as Record<HaLocusId, string>;
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

  /** Le pistil de `mother` accepte-t-il un grain de pollen portant `s` ? */
  acceptsPollen(mother: HaIndividual, s: string): boolean {
    return s === 'Sc' || !functionalS(mother.genotype.s).includes(s);
  }

  /** Part du pollen de `father` acceptée par le pistil de `mother` (0, ½ ou 1). */
  sCompatibility(mother: HaIndividual, father: HaIndividual): number {
    return father.genotype.s.filter((s) => this.acceptsPollen(mother, s)).length / 2;
  }

  /** Auto-incompatible : rejette TOUT son propre pollen. */
  isSelfIncompatible(ind: HaIndividual): boolean {
    return this.sCompatibility(ind, ind) === 0;
  }

  isSelfCompatible(ind: HaIndividual): boolean {
    return !this.isSelfIncompatible(ind);
  }

  /** Plante sans pollen (stérilité mâle) : elle ne peut être que mère. */
  isPollenless(ind: HaIndividual): boolean {
    return this.has(ind.genotype, 'ms');
  }

  canPollinate(ind: HaIndividual): boolean {
    return ind.fertility > 0.001 && !this.isPollenless(ind);
  }

  /** Il faut retirer le pollen de la mère si elle accepte le sien (ni sans pollen, ni auto-incompatible). */
  needsEmasculation(ind: HaIndividual): boolean {
    return this.isSelfCompatible(ind) && !this.isPollenless(ind);
  }

  /** Part des graines croisées au jardin : environ la moitié chez le tournesol cultivé (abeilles), toutes chez le sauvage ou sans pollen. */
  outcrossingRate(ind: HaIndividual): number {
    return this.isSelfIncompatible(ind) || this.isPollenless(ind) ? 1 : 0.5;
  }

  crossCheck(a: HaIndividual, b: HaIndividual): CrossCheck {
    const selfing = a.id === b.id;
    const compat = selfing ? { level: 'related' as CrossLevel, seedSet: 1, hybridFertility: 1, reason: 'selfing', uncertain: undefined } : speciesCompat(a.species, b.species);
    const sCompat = this.sCompatibility(a, b);
    const base = { uncertain: compat.uncertain, f1Fertility: compat.hybridFertility, sCompat };
    if (a.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (compat.level === 'blocked') return { ...base, level: 'blocked', seedSet: 0, reason: compat.reason, effectiveSeedSet: 0 };
    if (this.isPollenless(b)) return { ...base, level: 'blocked', seedSet: 0, reason: 'pollenless', sterileParent: 'b', effectiveSeedSet: 0 };
    if (sCompat === 0) return { ...base, level: 'blocked', seedSet: 0, reason: selfing ? 'selfIncompatible' : 'sameS', effectiveSeedSet: 0 };
    // Moitié du pollen rejeté : l’autre moitié suffit, mais la capsule se remplit un peu moins.
    const sFactor = sCompat < 1 ? 0.85 : 1;
    const effectiveSeedSet = compat.seedSet * Math.sqrt(a.fertility * b.fertility) * sFactor;
    let level = compat.level;
    let reason = compat.reason;
    if (sCompat < 1 && !selfing && level !== 'difficult') reason = 'halfS';
    else if (sCompat < 1 && selfing) reason = 'selfHalfS';
    else if (level === 'same' && effectiveSeedSet < 0.999) {
      level = 'difficult';
      reason = 'lowFertility';
    }
    return { ...base, level, seedSet: compat.seedSet, reason, effectiveSeedSet };
  }

  cross(a: HaIndividual, b: HaIndividual, n: number, labelPrefix?: string): HaIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const interspecific = a.species !== b.species && check.f1Fertility < 1;
    const out: HaIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      // Seul un grain de pollen accepté par le pistil féconde l’ovule.
      let gb = this.gamete(b);
      for (let t = 0; t < 30 && !this.acceptsPollen(a, gb.s); t++) gb = this.gamete(b);
      if (!this.acceptsPollen(a, gb.s)) continue;
      const genotype = {} as HaGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as HaIndividual['haps'];
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
        })
      );
    }
    return out;
  }

  /** Croisement entre sœurs (repli quand l’autofécondation est impossible). */
  sibCross(a: HaIndividual, b: HaIndividual, n: number, labelPrefix?: string): HaIndividual[] {
    return this.cross(a, b, n, labelPrefix || `${a.label} × ${b.label} (sœurs)`).map((x) => ({ ...x, sib: true }));
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: HaGenotype, locus: HaLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: HaGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete || def.silent) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: HaGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: HaGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): HaGenotype {
    const g = {} as HaGenotype;
    for (const locus of HA_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: HaIndividual): HaIndividual {
    const missingLoci = HA_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: HaIndividual = { ...ind, crop: 'tournesol', fertility: ind.fertility ?? 1 };
    if (!missingLoci.length && !missingTraits.length && typeof ind.pheno?.stems === 'number') return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) haps[t] = this.outbredHaps(t, 0.5);
    return { ...base, genotype, haps, pheno: { ...this.withHabit(this.computePhenotype(haps), genotype), ...ind.pheno } };
  }

  appearance(ind: HaIndividual): FlowerAppearance {
    return this.appearanceOf(ind.genotype, ind.species);
  }

  appearanceFromVariety(v: Pick<HaVariety, 'variants' | 'species' | 'het' | 'sAlleles'>): FlowerAppearance {
    return this.appearanceOf(this.varietyGenotype(v), v.species);
  }

  appearanceOf(g: HaGenotype, sp: SpeciesId): FlowerAppearance {
    const base: FlowerColor = this.has(g, 'cr') ? 'cream' : this.has(g, 'ly') ? 'lemon' : this.has(g, 'Or') ? 'orange' : 'yellow';
    const red = this.dose(g, 'Rd');
    const color: FlowerColor = red === 2 ? (base === 'orange' ? 'mahogany' : 'red') : red === 1 ? 'bronze' : base;
    const dbl = this.dose(g, 'Dbl');
    return {
      color,
      face: !this.has(g, 'p'),
      veins: this.has(g, 'ms'),
      flecked: this.has(g, 'b'),
      shape: dbl === 2 ? 'peloric' : dbl === 1 ? 'semi' : 'normal',
      selfIncompatible: functionalS(g.s).length === 2,
      species: sp,
    };
  }

  heightClass(ind: HaIndividual): HeightClass {
    return heightClassOf(ind.pheno.heightCm);
  }

  /** Gènes de résistance exprimés (Pl : mildiou). */
  resistances(ind: HaIndividual): VariantId[] {
    return this.has(ind.genotype, 'Pl') ? ['Pl'] : [];
  }

  resistanceCode(ind: HaIndividual): string {
    return this.resistances(ind).join(' ');
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: HaIndividual): number {
    return FIX_LOCI.filter((id) => !isHomozygous(ind.genotype[id])).length / FIX_LOCI.length;
  }

  polygenicHeterozygosity(haps: HaIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: HaIndividual): number {
    const nM = FIX_LOCI.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: HaIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: HaIndividual): HaLocusId[] {
    return FIX_LOCI.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne (exacte, liaisons comprises) ----------------------

  private gameteDist(ind: HaIndividual, group: HaLocusId[]): Array<{ alleles: string[]; p: number }> {
    const out: Array<{ alleles: string[]; p: number }> = [];
    const walk = (i: number, strand: number, p: number, acc: string[]) => {
      if (i === group.length) {
        out.push({ alleles: acc, p });
        return;
      }
      const id = group[i];
      if (i === 0) {
        walk(1, 0, p * 0.5, [ind.genotype[id][0]]);
        walk(1, 1, p * 0.5, [ind.genotype[id][1]]);
        return;
      }
      const r = kosambi(LOCUS_BY_ID[id].cM - LOCUS_BY_ID[group[i - 1]].cM);
      walk(i + 1, strand, p * (1 - r), [...acc, ind.genotype[id][strand]]);
      if (r > 0) walk(i + 1, 1 - strand, p * r, [...acc, ind.genotype[id][1 - strand]]);
    };
    walk(0, 0, 1, []);
    return out;
  }

  /** Proportions attendues des phénotypes visibles dans la descendance de a × b. */
  predict(a: HaIndividual, b: HaIndividual): PredictedClass[] {
    // Pour chaque groupe de liaison : distribution des génotypes du descendant.
    const groupDists = VISIBLE_GROUPS.map((group) => {
      const m = new Map<string, { pairs: Array<[string, string]>; p: number }>();
      for (const ga of this.gameteDist(a, group))
        for (const gb of this.gameteDist(b, group)) {
          const pairs = group.map((_, i) => [ga.alleles[i], gb.alleles[i]].sort() as [string, string]);
          const key = pairs.map((x) => x.join('/')).join(' ');
          const cur = m.get(key);
          if (cur) cur.p += ga.p * gb.p;
          else m.set(key, { pairs, p: ga.p * gb.p });
        }
      return { group, outcomes: Array.from(m.values()) };
    });
    const result = new Map<string, PredictedClass>();
    const g = {} as HaGenotype;
    for (const id of LOCUS_IDS) g[id] = ['Sc', 'Sc'];
    const rec = (i: number, p: number) => {
      if (i === groupDists.length) {
        const app = this.appearanceOf(g, a.species);
        const rust = this.has(g, 'Pl');
        const key = `${appearanceKey(app)}|${rust ? 1 : 0}`;
        const cur = result.get(key);
        if (cur) cur.p += p;
        else result.set(key, { app, rust, p });
        return;
      }
      const { group, outcomes } = groupDists[i];
      for (const o of outcomes) {
        group.forEach((id, k) => (g[id] = o.pairs[k]));
        rec(i + 1, p * o.p);
      }
    };
    rec(0, 1);
    return Array.from(result.values()).sort((x, y) => y.p - x.p);
  }

  variantLabel(id: VariantId): string {
    const v = VARIANT_ALLELE[id][1];
    return `${v}/${v}`;
  }

  genotypeCode(ind: HaIndividual): string {
    const parts: string[] = [];
    for (const def of HA_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.join(' ') || '+';
  }
}
