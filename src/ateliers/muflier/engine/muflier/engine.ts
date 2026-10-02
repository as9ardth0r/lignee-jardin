/**
 * Moteur de croisement du muflier, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques :
 *  - le muflier cultivé (A. majus) est AUTO-COMPATIBLE : il peut
 *    s’autoféconder, mais ses fleurs fermées sont ouvertes par les bourdons,
 *    qui le croisent souvent ; pour un croisement voulu, on CASTRE le bouton
 *    (on retire les 4 étamines avant qu’elles ne s’ouvrent) puis on dépose le
 *    pollen au pinceau. Les hybrides F1 du commerce sont faits ainsi, à la
 *    main : il n’y a pas de stérilité mâle chez le muflier ;
 *  - les mufliers SAUVAGES sont AUTO-INCOMPATIBLES (système gamétophytique
 *    à S-RNases) : le pistil rejette le pollen qui porte un allèle S présent
 *    chez la mère. Impossible de les autoféconder : on croise deux sœurs
 *    qui n’ont pas les mêmes allèles S ;
 *  - COULEUR par plusieurs gènes en interaction, dont deux à dominance
 *    incomplète (Rosea, Eluta) et un allèle instable à transposon
 *    (pallida-recurrens) ; FORME pélorique par deux gènes très liés.
 *  - Consanguinité : dépression modérée (le muflier cultivé se
 *    reproduit volontiers par autofécondation) et vigueur hybride des F1.
 *
 * Traits quantitatifs : hauteur, nombre de fleurs par épi, jours du semis à
 * la floraison, parfum (0 à 10).
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossLevel } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, AM_LOCI, VARIANT_ALLELE, functionalS, type AmLocusId, type SpeciesId, type VariantId } from './loci';
import type { AmVariety } from './varieties';

export type QuantTraitId = 'height' | 'florets' | 'days' | 'scent';
export const QUANT_TRAITS: QuantTraitId[] = ['height', 'florets', 'days', 'scent'];
export const MAIN_TRAITS: QuantTraitId[] = ['height', 'florets', 'days', 'scent'];

const POLY_LOCI: Record<QuantTraitId, number> = { height: 22, florets: 18, days: 20, scent: 14 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Hauteur de la plante en fleur (cm). */
  height: { min: 10, max: 150, log: true, noise: 0.012, digits: 0 },
  /** Fleurs (fleurons) sur l’épi principal. */
  florets: { min: 5, max: 60, log: true, noise: 0.015, digits: 0 },
  /** Jours du semis à la première fleur. */
  days: { min: 70, max: 170, noise: 0.012, digits: 0 },
  /** Parfum (0 = aucun, 10 = très parfumé). */
  scent: { min: 0, max: 10, noise: 0.02, digits: 1 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof AmPhenotype> = {
  height: 'heightCm',
  florets: 'florets',
  days: 'days',
  scent: 'scent',
};

/** Vigueur d’une lignée totalement consanguine (dépression modérée). */
const INBRED_VIGOR = 0.8;

export type AmGenotype = Record<AmLocusId, Diploid<string>>;

export interface AmPhenotype {
  heightCm: number;
  florets: number;
  days: number;
  scent: number;
  /** Tiges florales par plante (dérivé de la hauteur et de la vigueur). */
  stems: number;
}

export interface AmIndividual {
  crop: 'muflier';
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
  genotype: AmGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: AmPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: AmJournalEntry[];
}

export type AmStage = 'sowing' | 'pricking' | 'planting' | 'pinching' | 'buds' | 'flowering' | 'cutting' | 'pollination' | 'capsules' | 'seeds';
export const AM_STAGES: AmStage[] = ['sowing', 'pricking', 'planting', 'pinching', 'buds', 'flowering', 'cutting', 'pollination', 'capsules', 'seeds'];

export interface AmJournalEntry {
  id: string;
  date: number;
  stage?: AmStage;
  heightCm?: number;
  stems?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type FlowerColor = 'white' | 'ivory' | 'pale' | 'pink' | 'magenta' | 'yellow' | 'orange' | 'red';
export const FLOWER_COLORS: FlowerColor[] = ['white', 'ivory', 'pale', 'pink', 'magenta', 'yellow', 'orange', 'red'];
export type FlowerShape = 'normal' | 'semi' | 'peloric';
export const FLOWER_SHAPES: FlowerShape[] = ['normal', 'semi', 'peloric'];
export type HeightClass = 'dwarf' | 'medium' | 'tall';
export const HEIGHT_CLASSES: HeightClass[] = ['dwarf', 'medium', 'tall'];

export interface FlowerAppearance {
  color: FlowerColor;
  /** Face claire (Eluta) : fleur bicolore. */
  face: boolean;
  /** Nervures magenta (Venosa) sur fond pâle. */
  veins: boolean;
  /** Taches et stries magenta (pallida-recurrens). */
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

const LINKAGE_GROUPS: AmLocusId[][] = (() => {
  const m = new Map<number, AmLocusId[]>();
  for (const l of AM_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: AmLocusId[] = AM_LOCI.filter((l) => !l.chromosome).map((l) => l.id);
/** Groupes de loci visibles pour la prédiction (le locus S, invisible, est exclu). */
const VISIBLE_GROUPS: AmLocusId[][] = [...LINKAGE_GROUPS.map((g) => g.filter((id) => !LOCUS_BY_ID[id].silent)), ...UNLINKED.filter((id) => !LOCUS_BY_ID[id].silent).map((id) => [id])].filter((g) => g.length);
/** Loci pris en compte pour la fixation : le locus S d’une lignée auto-incompatible reste forcément hétérozygote. */
const FIX_LOCI: AmLocusId[] = LOCUS_IDS.filter((id) => id !== 's');

export function heightClassOf(cm: number): HeightClass {
  return cm < 35 ? 'dwarf' : cm < 65 ? 'medium' : 'tall';
}

export function appearanceKey(app: FlowerAppearance): string {
  return `${app.color}|${app.face ? 1 : 0}|${app.veins ? 1 : 0}|${app.flecked ? 1 : 0}|${app.shape}`;
}

export class AmEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('MUF');

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

  unitOf(trait: QuantTraitId, ind: AmIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Tiges florales à couper par plante (pincée ou non selon le jardin). */
  stems(ind: AmIndividual): number {
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

  vigor(haps: AmIndividual['haps']): number {
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

  private computePhenotype(haps: AmIndividual['haps']): AmPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const vig = this.vigor(haps);
    const hu = value('height');
    const heightCm = Math.max(5, Math.round(this.fromUnit('height', hu) * (0.8 + 0.2 * vig)));
    // Les mufliers nains ramifient beaucoup (massifs), les grands mufliers à couper font peu de tiges.
    const stems = Math.max(1, Math.round((3 + 9 * (1 - Math.max(0, Math.min(1, hu)))) * vig));
    return {
      heightCm,
      florets: Math.max(3, Math.round(this.fromUnit('florets', value('florets')) * vig)),
      days: this.fromUnit('days', value('days')),
      scent: Math.max(0, this.fromUnit('scent', value('scent'))),
      stems,
    };
  }

  private build(
    genotype: AmGenotype,
    haps: AmIndividual['haps'],
    meta: Pick<AmIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility'> & Partial<Pick<AmIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder' | 'sib'>>
  ): AmIndividual {
    return { crop: 'muflier', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(haps), createdAt: Date.now() };
  }

  varietyTargets(v: AmVariety): Record<QuantTraitId, number> {
    const vig = v.inbred ? INBRED_VIGOR : 1;
    return { height: v.heightCm / (0.8 + 0.2 * vig), florets: v.florets / vig, days: v.days, scent: v.scent };
  }

  private varietyGenotype(v: Pick<AmVariety, 'variants' | 'het' | 'sAlleles'>): AmGenotype {
    const genotype = this.genotypeFromVariants(v.variants);
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      genotype[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    if (v.sAlleles) genotype.s = [v.sAlleles[0], v.sAlleles[1]];
    return genotype;
  }

  createFromVariety(v: AmVariety, label?: string): AmIndividual {
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
    const haps = {} as AmIndividual['haps'];
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

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>>; sAlleles?: [string, string] }): AmIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    if (opts.sAlleles) genotype.s = [...opts.sAlleles];
    const haps = {} as AmIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = this.outbredHaps(trait, opts.targets[trait] ?? 0.5);
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1 });
  }

  private copyParts(ind: AmIndividual): { genotype: AmGenotype; haps: AmIndividual['haps'] } {
    const haps = {} as AmIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as AmGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    return { genotype, haps };
  }

  /** Bouturage d’une tige non fleurie : copie exacte de la plante. */
  cloneOf(ind: AmIndividual, label?: string): AmIndividual {
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
  fixedVariants(ind: AmIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of AM_LOCI) {
      if (def.id === 's') continue;
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: AmIndividual): Record<AmLocusId, string> {
    const g = {} as Record<AmLocusId, string>;
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
  acceptsPollen(mother: AmIndividual, s: string): boolean {
    return s === 'Sc' || !functionalS(mother.genotype.s).includes(s);
  }

  /** Part du pollen de `father` acceptée par le pistil de `mother` (0, ½ ou 1). */
  sCompatibility(mother: AmIndividual, father: AmIndividual): number {
    return father.genotype.s.filter((s) => this.acceptsPollen(mother, s)).length / 2;
  }

  /** Auto-incompatible : rejette TOUT son propre pollen. */
  isSelfIncompatible(ind: AmIndividual): boolean {
    return this.sCompatibility(ind, ind) === 0;
  }

  isSelfCompatible(ind: AmIndividual): boolean {
    return !this.isSelfIncompatible(ind);
  }

  canPollinate(ind: AmIndividual): boolean {
    return ind.fertility > 0.001;
  }

  /** On castre toujours le bouton de la mère (sauf auto-incompatible, où c’est une simple précaution). */
  needsEmasculation(ind: AmIndividual): boolean {
    return this.isSelfCompatible(ind);
  }

  /** Croisements naturels : les bourdons ouvrent les fleurs et apportent le pollen des voisins. */
  outcrossingRate(ind: AmIndividual): number {
    return this.isSelfIncompatible(ind) ? 1 : 0.4;
  }

  crossCheck(a: AmIndividual, b: AmIndividual): CrossCheck {
    const selfing = a.id === b.id;
    const compat = selfing ? { level: 'related' as CrossLevel, seedSet: 1, hybridFertility: 1, reason: 'selfing', uncertain: undefined } : speciesCompat(a.species, b.species);
    const sCompat = this.sCompatibility(a, b);
    const base = { uncertain: compat.uncertain, f1Fertility: compat.hybridFertility, sCompat };
    if (a.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (compat.level === 'blocked') return { ...base, level: 'blocked', seedSet: 0, reason: compat.reason, effectiveSeedSet: 0 };
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

  cross(a: AmIndividual, b: AmIndividual, n: number, labelPrefix?: string): AmIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const interspecific = a.species !== b.species && check.f1Fertility < 1;
    const out: AmIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      // Seul un grain de pollen accepté par le pistil féconde l’ovule.
      let gb = this.gamete(b);
      for (let t = 0; t < 30 && !this.acceptsPollen(a, gb.s); t++) gb = this.gamete(b);
      if (!this.acceptsPollen(a, gb.s)) continue;
      const genotype = {} as AmGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as AmIndividual['haps'];
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
  sibCross(a: AmIndividual, b: AmIndividual, n: number, labelPrefix?: string): AmIndividual[] {
    return this.cross(a, b, n, labelPrefix || `${a.label} × ${b.label} (sœurs)`).map((x) => ({ ...x, sib: true }));
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: AmGenotype, locus: AmLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: AmGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete || def.silent) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: AmGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: AmGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): AmGenotype {
    const g = {} as AmGenotype;
    for (const locus of AM_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: AmIndividual): AmIndividual {
    const missingLoci = AM_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: AmIndividual = { ...ind, crop: 'muflier', fertility: ind.fertility ?? 1 };
    if (!missingLoci.length && !missingTraits.length && typeof ind.pheno?.stems === 'number') return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) haps[t] = this.outbredHaps(t, 0.5);
    return { ...base, genotype, haps, pheno: { ...this.computePhenotype(haps), ...ind.pheno } };
  }

  appearance(ind: AmIndividual): FlowerAppearance {
    return this.appearanceOf(ind.genotype, ind.species);
  }

  appearanceFromVariety(v: Pick<AmVariety, 'variants' | 'species' | 'het' | 'sAlleles'>): FlowerAppearance {
    return this.appearanceOf(this.varietyGenotype(v), v.species);
  }

  appearanceOf(g: AmGenotype, sp: SpeciesId): FlowerAppearance {
    const white = this.has(g, 'niv');
    const pal = this.expressedAllele(g, 'pal');
    const yellow = this.has(g, 'sulf');
    const ros = countAllele(g.ros, 'Ros');
    const antho = white || pal !== 'Pal' ? 0 : ros;
    let color: FlowerColor;
    if (white) color = 'white';
    else if (yellow) color = antho === 2 ? 'red' : antho === 1 ? 'orange' : 'yellow';
    else color = antho === 2 ? 'magenta' : antho === 1 ? 'pink' : pal === 'Pal' ? 'pale' : 'ivory';
    const cyc = this.has(g, 'cyc');
    const dich = this.has(g, 'dich');
    return {
      color,
      face: !white && antho > 0 && this.has(g, 'El'),
      veins: !white && pal === 'Pal' && ros < 2 && this.has(g, 'Ven'),
      flecked: !white && pal === 'pal-rec',
      shape: cyc ? (dich ? 'peloric' : 'semi') : 'normal',
      selfIncompatible: functionalS(g.s).length === 2,
      species: sp,
    };
  }

  heightClass(ind: AmIndividual): HeightClass {
    return heightClassOf(ind.pheno.heightCm);
  }

  resistances(ind: AmIndividual): VariantId[] {
    return (['Pa'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  resistanceCode(ind: AmIndividual): string {
    return this.resistances(ind).includes('Pa') ? 'Pa' : '';
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: AmIndividual): number {
    return FIX_LOCI.filter((id) => !isHomozygous(ind.genotype[id])).length / FIX_LOCI.length;
  }

  polygenicHeterozygosity(haps: AmIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: AmIndividual): number {
    const nM = FIX_LOCI.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: AmIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: AmIndividual): AmLocusId[] {
    return FIX_LOCI.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne (exacte, liaisons comprises) ----------------------

  private gameteDist(ind: AmIndividual, group: AmLocusId[]): Array<{ alleles: string[]; p: number }> {
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
  predict(a: AmIndividual, b: AmIndividual): PredictedClass[] {
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
    const g = {} as AmGenotype;
    for (const id of LOCUS_IDS) g[id] = ['Sc', 'Sc'];
    const rec = (i: number, p: number) => {
      if (i === groupDists.length) {
        const app = this.appearanceOf(g, a.species);
        const rust = this.has(g, 'Pa');
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

  genotypeCode(ind: AmIndividual): string {
    const parts: string[] = [];
    for (const def of AM_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.join(' ') || '+';
  }
}
