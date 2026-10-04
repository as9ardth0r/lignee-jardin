/**
 * Moteur de croisement du pois de senteur, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques :
 *  - AUTOGAME : la fleur se féconde dans le bouton, avant de s’ouvrir ;
 *    au jardin les variétés voisines ne se croisent presque pas (moins de
 *    1 %). Pour un croisement voulu, on ouvre le bouton encore vert la
 *    veille de l’ouverture, on retire les 10 étamines, puis on dépose le
 *    pollen du père sur le stigmate ;
 *  - COULEUR par des gènes complémentaires (C et R), une paire pourpre /
 *    rouge (B) LIÉE à la forme du pollen (L), et un modèle simplifié
 *    d’intensité et de motif ;
 *  - FORME : étendard en capuchon, pétales ondulés Spencer, port nain Cupid.
 *  - Dépression de consanguinité faible (plante autogame : les variétés
 *    sont déjà des lignées).
 *
 * Traits quantitatifs : hauteur, fleurs par tige, jours du semis à la
 * floraison, parfum (0 à 10).
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossLevel } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, LO_LOCI, VARIANT_ALLELE, functionalS, type LoLocusId, type SpeciesId, type VariantId } from './loci';
import type { LoVariety } from './varieties';

export type QuantTraitId = 'height' | 'florets' | 'days' | 'scent';
export const QUANT_TRAITS: QuantTraitId[] = ['height', 'florets', 'days', 'scent'];
export const MAIN_TRAITS: QuantTraitId[] = ['height', 'florets', 'days', 'scent'];

const POLY_LOCI: Record<QuantTraitId, number> = { height: 22, florets: 18, days: 20, scent: 14 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Hauteur de la plante grimpante en fleur (cm), avant l’effet du gène nain Cupid. */
  height: { min: 60, max: 300, log: true, noise: 0.012, digits: 0 },
  /** Fleurs par tige florale. */
  florets: { min: 2, max: 8, noise: 0.03, digits: 0 },
  /** Jours du semis à la première fleur (semis de printemps). */
  days: { min: 70, max: 150, noise: 0.012, digits: 0 },
  /** Parfum (0 = aucun, 10 = très parfumé). */
  scent: { min: 0, max: 10, noise: 0.02, digits: 1 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof LoPhenotype> = {
  height: 'heightCm',
  florets: 'florets',
  days: 'days',
  scent: 'scent',
};

/** Vigueur d’une lignée totalement consanguine (plante autogame : dépression faible). */
const INBRED_VIGOR = 0.93;
/** Hauteur d’un pois de senteur nain Cupid, rapportée à celle d’un grimpant. */
const CUPID_FACTOR = 0.15;

export type LoGenotype = Record<LoLocusId, Diploid<string>>;

export interface LoPhenotype {
  heightCm: number;
  florets: number;
  days: number;
  scent: number;
  /** Tiges florales cueillies par plante sur la saison (dérivé de la vigueur et des fleurs par tige). */
  stems: number;
}

export interface LoIndividual {
  crop: 'pdsenteur';
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
  genotype: LoGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: LoPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: LoJournalEntry[];
}

export type LoStage = 'sowing' | 'pinching' | 'planting' | 'tendrils' | 'buds' | 'flowering' | 'cutting' | 'pollination' | 'pods' | 'seeds';
export const LO_STAGES: LoStage[] = ['sowing', 'pinching', 'planting', 'tendrils', 'buds', 'flowering', 'cutting', 'pollination', 'pods', 'seeds'];

export interface LoJournalEntry {
  id: string;
  date: number;
  stage?: LoStage;
  heightCm?: number;
  stems?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type FlowerColor = 'white' | 'cream' | 'blush' | 'pink' | 'red' | 'orange' | 'lavender' | 'purple' | 'maroon';
export const FLOWER_COLORS: FlowerColor[] = ['white', 'cream', 'blush', 'pink', 'red', 'orange', 'lavender', 'purple', 'maroon'];
export type FlowerShape = 'normal' | 'semi' | 'peloric';
/** normal = grandiflora (pétales lisses), semi = Spencer (ondulé), peloric = étendard en capuchon (hooded). */
export const FLOWER_SHAPES: FlowerShape[] = ['normal', 'semi', 'peloric'];
export type HeightClass = 'dwarf' | 'medium' | 'tall';
export const HEIGHT_CLASSES: HeightClass[] = ['dwarf', 'medium', 'tall'];

export interface FlowerAppearance {
  color: FlowerColor;
  /** Ailes plus claires que l’étendard (bicolore). */
  face: boolean;
  /** Pollen long (L) ; faux = pollen rond. */
  veins: boolean;
  /** Port nain Cupid. */
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

const LINKAGE_GROUPS: LoLocusId[][] = (() => {
  const m = new Map<number, LoLocusId[]>();
  for (const l of LO_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: LoLocusId[] = LO_LOCI.filter((l) => !l.chromosome).map((l) => l.id);
/** Groupes de loci visibles pour la prédiction (le locus S, invisible, est exclu). */
const VISIBLE_GROUPS: LoLocusId[][] = [...LINKAGE_GROUPS.map((g) => g.filter((id) => !LOCUS_BY_ID[id].silent)), ...UNLINKED.filter((id) => !LOCUS_BY_ID[id].silent).map((id) => [id])].filter((g) => g.length);
/** Loci pris en compte pour la fixation : le locus S d’une lignée auto-incompatible reste forcément hétérozygote. */
const FIX_LOCI: LoLocusId[] = LOCUS_IDS.filter((id) => id !== 's');

export function heightClassOf(cm: number): HeightClass {
  return cm < 50 ? 'dwarf' : cm < 120 ? 'medium' : 'tall';
}

export function appearanceKey(app: FlowerAppearance): string {
  return `${app.color}|${app.face ? 1 : 0}|${app.veins ? 1 : 0}|${app.flecked ? 1 : 0}|${app.shape}`;
}

export class LoEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('PDS');

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

  unitOf(trait: QuantTraitId, ind: LoIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Tiges florales à couper par plante (pincée ou non selon le jardin). */
  stems(ind: LoIndividual): number {
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

  vigor(haps: LoIndividual['haps']): number {
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

  /** Le gène nain Cupid (cu/cu) réduit fortement la hauteur. */
  private withHabit(p: LoPhenotype, g: LoGenotype): LoPhenotype {
    return this.has(g, 'cu') ? { ...p, heightCm: Math.max(10, Math.round(p.heightCm * CUPID_FACTOR)) } : p;
  }

  private computePhenotype(haps: LoIndividual['haps']): LoPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const vig = this.vigor(haps);
    const hu = value('height');
    const heightCm = Math.max(10, Math.round(this.fromUnit('height', hu) * (0.8 + 0.2 * vig)));
    // Un pied cueilli régulièrement donne des dizaines de tiges ; plus vigoureux et plus haut, il en donne davantage.
    const stems = Math.max(5, Math.round((20 + 30 * Math.max(0, Math.min(1, hu))) * vig));
    return {
      heightCm,
      florets: Math.max(1, Math.round(this.fromUnit('florets', value('florets')) * (0.85 + 0.15 * vig))),
      days: this.fromUnit('days', value('days')),
      scent: Math.max(0, this.fromUnit('scent', value('scent'))),
      stems,
    };
  }

  private build(
    genotype: LoGenotype,
    haps: LoIndividual['haps'],
    meta: Pick<LoIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility'> & Partial<Pick<LoIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder' | 'sib'>>
  ): LoIndividual {
    return { crop: 'pdsenteur', id: this.ids.next(), ...meta, genotype, haps, pheno: this.withHabit(this.computePhenotype(haps), genotype), createdAt: Date.now() };
  }

  varietyTargets(v: LoVariety): Record<QuantTraitId, number> {
    const vig = v.inbred ? INBRED_VIGOR : 1;
    const cupid = v.variants.includes('cu') ? CUPID_FACTOR : 1;
    return { height: v.heightCm / cupid / (0.8 + 0.2 * vig), florets: v.florets / (0.85 + 0.15 * vig), days: v.days, scent: v.scent };
  }

  private varietyGenotype(v: Pick<LoVariety, 'variants' | 'het' | 'sAlleles'>): LoGenotype {
    const genotype = this.genotypeFromVariants(v.variants);
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      genotype[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    if (v.sAlleles) genotype.s = [v.sAlleles[0], v.sAlleles[1]];
    return genotype;
  }

  createFromVariety(v: LoVariety, label?: string): LoIndividual {
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
    const haps = {} as LoIndividual['haps'];
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

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>>; sAlleles?: [string, string] }): LoIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    if (opts.sAlleles) genotype.s = [...opts.sAlleles];
    const haps = {} as LoIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = this.outbredHaps(trait, opts.targets[trait] ?? 0.5);
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1 });
  }

  private copyParts(ind: LoIndividual): { genotype: LoGenotype; haps: LoIndividual['haps'] } {
    const haps = {} as LoIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as LoGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    return { genotype, haps };
  }

  /** Bouturage d’une tige non fleurie : copie exacte de la plante. */
  cloneOf(ind: LoIndividual, label?: string): LoIndividual {
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
  fixedVariants(ind: LoIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of LO_LOCI) {
      if (def.id === 's') continue;
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: LoIndividual): Record<LoLocusId, string> {
    const g = {} as Record<LoLocusId, string>;
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
  acceptsPollen(mother: LoIndividual, s: string): boolean {
    return s === 'Sc' || !functionalS(mother.genotype.s).includes(s);
  }

  /** Part du pollen de `father` acceptée par le pistil de `mother` (0, ½ ou 1). */
  sCompatibility(mother: LoIndividual, father: LoIndividual): number {
    return father.genotype.s.filter((s) => this.acceptsPollen(mother, s)).length / 2;
  }

  /** Auto-incompatible : rejette TOUT son propre pollen. */
  isSelfIncompatible(ind: LoIndividual): boolean {
    return this.sCompatibility(ind, ind) === 0;
  }

  isSelfCompatible(ind: LoIndividual): boolean {
    return !this.isSelfIncompatible(ind);
  }

  canPollinate(ind: LoIndividual): boolean {
    return ind.fertility > 0.001;
  }

  /** On castre toujours le bouton de la mère (sauf auto-incompatible, où c’est une simple précaution). */
  needsEmasculation(ind: LoIndividual): boolean {
    return this.isSelfCompatible(ind);
  }

  /** Autogame : la fleur se féconde dans le bouton ; moins de 1 % de croisements naturels. */
  outcrossingRate(ind: LoIndividual): number {
    return this.isSelfIncompatible(ind) ? 1 : 0.01;
  }

  crossCheck(a: LoIndividual, b: LoIndividual): CrossCheck {
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

  cross(a: LoIndividual, b: LoIndividual, n: number, labelPrefix?: string): LoIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const interspecific = a.species !== b.species && check.f1Fertility < 1;
    const out: LoIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      // Seul un grain de pollen accepté par le pistil féconde l’ovule.
      let gb = this.gamete(b);
      for (let t = 0; t < 30 && !this.acceptsPollen(a, gb.s); t++) gb = this.gamete(b);
      if (!this.acceptsPollen(a, gb.s)) continue;
      const genotype = {} as LoGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as LoIndividual['haps'];
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
  sibCross(a: LoIndividual, b: LoIndividual, n: number, labelPrefix?: string): LoIndividual[] {
    return this.cross(a, b, n, labelPrefix || `${a.label} × ${b.label} (sœurs)`).map((x) => ({ ...x, sib: true }));
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: LoGenotype, locus: LoLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: LoGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete || def.silent) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: LoGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: LoGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): LoGenotype {
    const g = {} as LoGenotype;
    for (const locus of LO_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: LoIndividual): LoIndividual {
    const missingLoci = LO_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: LoIndividual = { ...ind, crop: 'pdsenteur', fertility: ind.fertility ?? 1 };
    if (!missingLoci.length && !missingTraits.length && typeof ind.pheno?.stems === 'number') return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) haps[t] = this.outbredHaps(t, 0.5);
    return { ...base, genotype, haps, pheno: { ...this.withHabit(this.computePhenotype(haps), genotype), ...ind.pheno } };
  }

  appearance(ind: LoIndividual): FlowerAppearance {
    return this.appearanceOf(ind.genotype, ind.species);
  }

  appearanceFromVariety(v: Pick<LoVariety, 'variants' | 'species' | 'het' | 'sAlleles'>): FlowerAppearance {
    return this.appearanceOf(this.varietyGenotype(v), v.species);
  }

  appearanceOf(g: LoGenotype, sp: SpeciesId): FlowerAppearance {
    const colored = !this.has(g, 'c') && !this.has(g, 'r');
    const yellow = this.has(g, 'Yel');
    const tone = this.expressedAllele(g, 'd');
    const dark = tone === 'D' ? 2 : tone === 'Dm' ? 1 : 0;
    const blue = !this.has(g, 'b');
    let color: FlowerColor;
    if (!colored) color = yellow ? 'cream' : 'white';
    else if (blue) color = dark === 2 ? 'maroon' : dark === 1 ? 'purple' : 'lavender';
    else if (yellow) color = 'orange';
    else color = dark === 2 ? 'red' : dark === 1 ? 'pink' : 'blush';
    return {
      color,
      face: colored && this.has(g, 'Bi'),
      veins: !this.has(g, 'l'),
      flecked: this.has(g, 'cu'),
      shape: this.has(g, 'h') ? 'peloric' : this.has(g, 'wav') ? 'semi' : 'normal',
      selfIncompatible: functionalS(g.s).length === 2,
      species: sp,
    };
  }

  heightClass(ind: LoIndividual): HeightClass {
    return heightClassOf(ind.pheno.heightCm);
  }

  /** Aucune résistance mendélienne connue chez le pois de senteur (oïdium, virus). */
  resistances(_ind: LoIndividual): VariantId[] {
    return [];
  }

  resistanceCode(_ind: LoIndividual): string {
    return '';
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: LoIndividual): number {
    return FIX_LOCI.filter((id) => !isHomozygous(ind.genotype[id])).length / FIX_LOCI.length;
  }

  polygenicHeterozygosity(haps: LoIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: LoIndividual): number {
    const nM = FIX_LOCI.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: LoIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: LoIndividual): LoLocusId[] {
    return FIX_LOCI.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne (exacte, liaisons comprises) ----------------------

  private gameteDist(ind: LoIndividual, group: LoLocusId[]): Array<{ alleles: string[]; p: number }> {
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
  predict(a: LoIndividual, b: LoIndividual): PredictedClass[] {
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
    const g = {} as LoGenotype;
    for (const id of LOCUS_IDS) g[id] = ['Sc', 'Sc'];
    const rec = (i: number, p: number) => {
      if (i === groupDists.length) {
        const app = this.appearanceOf(g, a.species);
        const rust = false;
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

  genotypeCode(ind: LoIndividual): string {
    const parts: string[] = [];
    for (const def of LO_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.join(' ') || '+';
  }
}
