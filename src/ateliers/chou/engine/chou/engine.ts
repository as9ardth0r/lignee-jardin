/**
 * Moteur de croisement des choux et de leurs cousins (Brassica, radis),
 * bâti sur le noyau commun (../core).
 *
 * Particularités biologiques :
 *  - fleurs HERMAPHRODITES, pollinisées par les insectes ; mais la plupart
 *    des choux sont AUTO-INCOMPATIBLES (locus S) : le stigmate rejette le
 *    pollen qui porte un de ses propres allèles S. Pour autoféconder, on
 *    pollinise les BOUTONS 2 à 4 jours avant l’ouverture, avant que le
 *    rejet ne s’installe (moins de graines). Deux plantes qui partagent un
 *    allèle S ne se croisent presque pas non plus ;
 *  - pour croiser : on castre le bouton de la mère (anthères retirées),
 *    sauf si elle est mâle stérile (cytoplasme OGURA, venu du radis, sans
 *    restaurateur Rfo) ;
 *  - GÉNOMES du triangle de U (voir compat.ts) : hybrides entre espèces,
 *    presque stériles, que l’on « répare » en doublant les chromosomes ;
 *    simplification : le génotype reste noté comme celui d’un diploïde,
 *    quel que soit le nombre de génomes ;
 *  - MORPHOTYPES (pomme, chou-fleur, brocoli, chou de Bruxelles, chou-rave,
 *    navet…) résumés par quelques loci majeurs (voir loci.ts).
 *
 * Traits quantitatifs : poids de l’organe récolté, jours du semis à la
 * récolte, hauteur, résistance au froid (°C supportés).
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { doubled, genomeCompat, genomeFertility, isBalanced, isDoublable, sortGenome, speciesOfGenome, type CrossCompat } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, BR_LOCI, SPECIES_GENOME, VARIANT_ALLELE, type BrLocusId, type SpeciesId, type VariantId } from './loci';
import type { BrVariety } from './varieties';

export type QuantTraitId = 'weight' | 'days' | 'height' | 'frost';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'days', 'height', 'frost'];
/** Traits affichés sur les cartes. */
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'days', 'height', 'frost'];

const POLY_LOCI: Record<QuantTraitId, number> = { weight: 22, days: 22, height: 14, frost: 18 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Poids de l’organe récolté par plante (kg). */
  weight: { min: 0.03, max: 8, log: true, noise: 0.01, digits: 2 },
  /** Jours du semis à la récolte. */
  days: { min: 30, max: 260, noise: 0.01, digits: 0 },
  /** Hauteur de la plante (cm). */
  height: { min: 10, max: 220, log: true, noise: 0.015, digits: 0 },
  /** Gel supporté (°C, plus bas = plus rustique). Valeur codée de −25 à 0. */
  frost: { min: -25, max: 0, noise: 0.012, digits: 0 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof BrPhenotype> = {
  weight: 'weightKg',
  days: 'days',
  height: 'heightCm',
  frost: 'frostC',
};

/** Bonus de vigueur maximal d’un individu très hétérozygote (hybrides F1). */
const MAX_HETEROSIS = 0.2;
/** Graines par bouton autofécondé, relatif à une pollinisation compatible. */
export const BUD_SELF_SET = 0.4;
/** Graines quand deux plantes partagent un allèle S (fleurs ouvertes). */
export const SI_LEAK = 0.05;
/** Fertilité d’un hybride juste doublé (méiose encore irrégulière). */
export const DOUBLED_FERTILITY = 0.7;

export type Cytoplasm = 'N' | 'Ogu';
export type BrGenotype = Record<BrLocusId, Diploid<string>>;

export interface BrPhenotype {
  weightKg: number;
  days: number;
  heightCm: number;
  frostC: number;
}

export interface BrIndividual {
  crop: 'chou';
  species: SpeciesId;
  /** Génome (ex. « CC », « AACC », « AC »). */
  genome: string;
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
  doubledFromId?: string;
  genotype: BrGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: BrPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: BrJournalEntry[];
}

export type BrStage = 'sowing' | 'transplant' | 'rosette' | 'heading' | 'harvest' | 'winter' | 'bolting' | 'flowering' | 'siliques' | 'seeds';
export const BR_STAGES: BrStage[] = ['sowing', 'transplant', 'rosette', 'heading', 'harvest', 'winter', 'bolting', 'flowering', 'siliques', 'seeds'];

export interface BrJournalEntry {
  id: string;
  date: number;
  stage?: BrStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type Morphotype = 'cabbage' | 'looseHead' | 'kale' | 'cauliflower' | 'romanesco' | 'broccoli' | 'sprouts' | 'kohlrabi' | 'turnip' | 'radish' | 'leafy';
export const MORPHOTYPES: Morphotype[] = ['cabbage', 'looseHead', 'kale', 'cauliflower', 'romanesco', 'broccoli', 'sprouts', 'kohlrabi', 'turnip', 'radish', 'leafy'];
export type CurdColor = 'white' | 'orange' | 'green' | 'purple';
export const CURD_COLORS: CurdColor[] = ['white', 'orange', 'green', 'purple'];
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';

export interface FruitAppearance {
  morphotype: Morphotype;
  purple: boolean;
  curd: CurdColor;
  savoy: boolean;
  curly: boolean;
  glossy: boolean;
  annual: boolean;
  selfCompatible: boolean;
  maleSterile: boolean;
  highGlucoraphanin: boolean;
  genome: string;
  species: SpeciesId;
  cyto: Cytoplasm;
}

export interface TheoreticalRatio {
  variant: VariantId;
  pExpressed: number;
}

export interface CrossCheck extends Omit<CrossCompat, 'reason'> {
  reason: string;
  sterileParent?: 'a' | 'b';
  effectiveSeedSet: number;
  /** Fertilité attendue des descendants. */
  f1Fertility: number;
  /** Génome type des descendants (le plus probable). */
  childGenome: string;
  /** Autofécondation faite en boutons (auto-incompatibilité). */
  budSelf?: boolean;
  /** Allèles S partagés entre la mère et le père. */
  sharedS?: string[];
}

export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

const LINKAGE_GROUPS: BrLocusId[][] = (() => {
  const m = new Map<number, BrLocusId[]>();
  for (const l of BR_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: BrLocusId[] = BR_LOCI.filter((l) => !l.chromosome).map((l) => l.id);
const VISIBLE_LOCI = BR_LOCI.filter((l) => !l.silent);
const LEVEL_RANK = { same: 0, related: 1, difficult: 2, blocked: 3 } as const;

export function sizeClassOf(kg: number): SizeClass {
  return kg < 0.2 ? 'mini' : kg < 0.6 ? 'small' : kg < 1.5 ? 'medium' : kg < 3 ? 'large' : 'giant';
}

/** Allèles S fonctionnels d’une paire (Sf exclu). */
export function functionalS(pair: Diploid<string>): string[] {
  return [...new Set(pair.filter((a) => a !== 'Sf'))];
}

/** Génome d’un gamète : la moitié de chaque paire de jeux ; les jeux isolés passent au hasard. */
function gameteGenome(g: string, rng: Rng): string {
  const counts: Record<string, number> = {};
  for (const x of g) counts[x] = (counts[x] ?? 0) + 1;
  let out = '';
  for (const [x, n] of Object.entries(counts)) {
    const half = Math.floor(n / 2) + (n % 2 === 1 && rng() < 0.5 ? 1 : 0);
    out += x.repeat(half);
  }
  if (!out) out = g[Math.floor(rng() * g.length)];
  return out;
}

export class BrEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('CHO');

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

  unitOf(trait: QuantTraitId, ind: BrIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Récolte par plante (kg) : l’organe récolté. */
  yieldKg(ind: BrIndividual): number {
    return Math.round(ind.pheno.weightKg * 100) / 100;
  }

  // --- Construction ----------------------------------------------------------

  private computePhenotype(haps: BrIndividual['haps']): BrPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const het = this.polygenicHeterozygosity(haps);
    const vigor = 1 + MAX_HETEROSIS * Math.min(1, het * 2);
    return {
      weightKg: Math.max(0.02, Math.round(this.fromUnit('weight', value('weight')) * vigor * 100) / 100),
      days: this.fromUnit('days', value('days')),
      heightCm: this.fromUnit('height', value('height')),
      frostC: this.fromUnit('frost', value('frost')),
    };
  }

  private build(
    genotype: BrGenotype,
    haps: BrIndividual['haps'],
    meta: Pick<BrIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility' | 'cyto' | 'genome'> &
      Partial<Pick<BrIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder' | 'doubledFromId'>>
  ): BrIndividual {
    return { crop: 'chou', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(haps), createdAt: Date.now() };
  }

  varietyTargets(v: BrVariety): Record<QuantTraitId, number> {
    const vig = v.hybrid ? 1 + MAX_HETEROSIS : 1;
    return { weight: v.weightKg / vig, days: v.days, height: v.heightCm, frost: v.frostC };
  }

  createFromVariety(v: BrVariety, label?: string): BrIndividual {
    const genotype = this.genotypeFromVariants(v.variants);
    genotype.s = [v.s?.[0] ?? 'S1', v.s?.[1] ?? v.s?.[0] ?? 'S1'];
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      genotype[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    const genome = SPECIES_GENOME[v.species];
    const meta = {
      label: label || v.name,
      generation: 0,
      parentIds: null,
      selfed: false,
      varietyId: v.id,
      species: v.species,
      genome,
      fertility: genomeFertility(genome),
      cyto: v.cyto ?? 'N',
      hybridWith: v.hybridWith,
    } as const;
    if (v.haps) {
      const haps = {} as BrIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, meta);
    }
    const targets = this.varietyTargets(v);
    const haps = {} as BrIndividual['haps'];
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

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>>; cyto?: Cytoplasm }): BrIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const sVar = opts.variants.filter((x) => VARIANT_ALLELE[x]?.[0] === 's');
    genotype.s = [sVar[0] ?? 'S1', sVar[1] ?? sVar[0] ?? 'S1'];
    const haps = {} as BrIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    const genome = SPECIES_GENOME[opts.species];
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, genome, fertility: genomeFertility(genome), cyto: opts.cyto ?? 'N' });
  }

  private copyParts(ind: BrIndividual): { genotype: BrGenotype; haps: BrIndividual['haps'] } {
    const haps = {} as BrIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as BrGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    return { genotype, haps };
  }

  /** Bouture (les choux s’enracinent par tronçons de tige) : copie exacte. */
  cloneOf(ind: BrIndividual, label?: string): BrIndividual {
    const { genotype, haps } = this.copyParts(ind);
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (bouture)`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      hybridFounder: ind.hybridFounder,
      species: ind.species,
      genome: ind.genome,
      hybridWith: ind.hybridWith,
      fertility: ind.fertility,
      cyto: ind.cyto,
      doubledFromId: ind.doubledFromId,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  /** Doubler les chromosomes d’un hybride entre espèces (colchicine) : « AC » → « AACC ». */
  canDouble(ind: BrIndividual): boolean {
    return isDoublable(ind.genome);
  }

  doubleChromosomes(ind: BrIndividual, label?: string): BrIndividual {
    const { genotype, haps } = this.copyParts(ind);
    const genome = doubled(ind.genome);
    const sp = speciesOfGenome(genome);
    return this.build(genotype, haps, {
      label: label || `${ind.label} 2n`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      species: sp ?? ind.species,
      genome,
      hybridWith: sp ? undefined : ind.hybridWith,
      fertility: Math.min(genomeFertility(genome), DOUBLED_FERTILITY),
      cyto: ind.cyto,
      doubledFromId: ind.id,
    });
  }

  fixedVariants(ind: BrIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of BR_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: BrIndividual): Record<BrLocusId, string> {
    const g = {} as Record<BrLocusId, string>;
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

  // --- Fleurs, auto-incompatibilité et barrières ------------------------------

  /** Stérilité mâle cytoplasmique Ogura (cytoplasme de radis sans Rfo). */
  isMaleSterile(ind: BrIndividual): boolean {
    return ind.cyto === 'Ogu' && !this.has(ind.genotype, 'Rfo');
  }

  /** Auto-compatible : aucun allèle S fonctionnel (Sf/Sf). */
  isSelfCompatible(ind: BrIndividual): boolean {
    return functionalS(ind.genotype.s).length === 0;
  }

  canPollinate(ind: BrIndividual): boolean {
    return ind.fertility > 0.001 && !this.isMaleSterile(ind);
  }

  /** On castre toujours le bouton de la mère, sauf si elle est mâle stérile. */
  needsEmasculation(ind: BrIndividual): boolean {
    return !this.isMaleSterile(ind);
  }

  /** Part des graines croisées au jardin (insectes) ; ~100 % chez les plantes auto-incompatibles. */
  outcrossingRate(ind: BrIndividual): number {
    if (!this.canPollinate(ind)) return 1;
    return this.isSelfCompatible(ind) ? 0.3 : 0.95;
  }

  /** Génome le plus probable des descendants. */
  private typicalChildGenome(a: BrIndividual, b: BrIndividual): string {
    const half = (g: string) => {
      const c: Record<string, number> = {};
      for (const x of g) c[x] = (c[x] ?? 0) + 1;
      return Object.entries(c)
        .map(([x, n]) => x.repeat(Math.max(1, Math.floor(n / 2))))
        .join('');
    };
    return sortGenome(half(a.genome) + half(b.genome));
  }

  crossCheck(a: BrIndividual, b: BrIndividual): CrossCheck {
    const compat = genomeCompat(a.genome, b.genome);
    const childGenome = this.typicalChildGenome(a, b);
    const f1Fertility = a.genome === b.genome && a.species === b.species && !a.hybridWith && !b.hybridWith ? 1 : genomeFertility(childGenome);
    const base = { uncertain: compat.uncertain, childGenome, f1Fertility };
    if (a.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (this.isMaleSterile(b)) return { ...base, level: 'blocked', seedSet: 0, reason: 'oguraFather', sterileParent: 'b', effectiveSeedSet: 0 };
    let seedSet = compat.seedSet;
    let level = compat.level;
    let reason = compat.reason;
    let budSelf = false;
    let sharedS: string[] | undefined;
    const selfing = a.id === b.id;
    const sA = functionalS(a.genotype.s);
    const sB = functionalS(b.genotype.s);
    if (selfing && sA.length) {
      budSelf = true;
      seedSet *= BUD_SELF_SET;
      if (LEVEL_RANK[level] < LEVEL_RANK.difficult) level = 'difficult';
      reason = 'budSelf';
    } else if (!selfing) {
      const shared = sA.filter((s) => sB.includes(s));
      if (shared.length) {
        sharedS = shared;
        seedSet *= SI_LEAK;
        level = 'difficult';
        reason = 'siShared';
      }
    }
    const effectiveSeedSet = seedSet * Math.sqrt(a.fertility * b.fertility);
    if (level === 'same' && effectiveSeedSet < 0.999) {
      level = 'difficult';
      reason = 'lowFertility';
    }
    return { ...base, level, seedSet, reason, effectiveSeedSet, budSelf, sharedS };
  }

  cross(a: BrIndividual, b: BrIndividual, n: number, labelPrefix?: string): BrIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const out: BrIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as BrGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as BrIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const t = this.traits[trait];
        haps[trait] = [t.gamete(a.haps[trait][0], a.haps[trait][1], this.rng), t.gamete(b.haps[trait][0], b.haps[trait][1], this.rng)];
      }
      const genome = sortGenome(gameteGenome(a.genome, this.rng) + gameteGenome(b.genome, this.rng));
      const gSp = speciesOfGenome(genome);
      // Espèce : celle du génome s’il en existe une, sinon celle de la mère (hybride).
      const species = gSp ?? a.species;
      const sameLineage = a.genome === b.genome && genome === a.genome;
      const fertility = sameLineage
        ? parentsFert >= 0.999
          ? 1
          : Math.min(1, parentsFert + (1 - parentsFert) * 0.35)
        : isBalanced(genome) && genome === a.genome
          ? Math.min(1, parentsFert + (1 - parentsFert) * 0.35)
          : genomeFertility(genome);
      const hybridWith = gSp ? (a.species !== b.species ? (species === a.species ? b.species : a.species) : a.hybridWith ?? b.hybridWith) : b.species !== a.species ? b.species : a.hybridWith ?? b.hybridWith;
      k++;
      out.push(
        this.build(genotype, haps, {
          label: `${prefix} #${k}`,
          generation,
          parentIds: [a.id, b.id],
          selfed,
          species,
          genome,
          hybridWith: hybridWith && hybridWith !== species ? hybridWith : undefined,
          fertility,
          cyto: a.cyto,
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: BrGenotype, locus: BrLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: BrGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete || def.silent) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: BrGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: BrGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): BrGenotype {
    const g = {} as BrGenotype;
    for (const locus of BR_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      if (g[locus][0] === LOCUS_BY_ID[locus].standard) g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: BrIndividual): BrIndividual {
    const missingLoci = BR_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: BrIndividual = { ...ind, crop: 'chou', fertility: ind.fertility ?? 1, cyto: ind.cyto ?? 'N', genome: ind.genome ?? SPECIES_GENOME[ind.species] ?? 'CC' };
    if (!missingLoci.length && !missingTraits.length) return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) {
      const h = this.traits[t].haplotypeForTarget(0.5, this.rng);
      haps[t] = [h, [...h]];
    }
    return { ...base, genotype, haps, pheno: { ...this.computePhenotype(haps), ...ind.pheno } };
  }

  appearance(ind: BrIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.genome, ind.species, ind.cyto);
  }

  appearanceFromVariety(v: Pick<BrVariety, 'variants' | 'species' | 'cyto' | 'het' | 's'>): FruitAppearance {
    const g = this.genotypeFromVariants(v.variants);
    g.s = [v.s?.[0] ?? 'S1', v.s?.[1] ?? v.s?.[0] ?? 'S1'];
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      g[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    return this.appearanceOf(g, SPECIES_GENOME[v.species], v.species, v.cyto ?? 'N');
  }

  morphotypeOf(g: BrGenotype, genome: string): Morphotype {
    const has = (id: VariantId) => this.has(g, id);
    const radish = genome.includes('R') && !genome.includes('C');
    if (radish) return has('Tu') ? 'radish' : 'leafy';
    if (this.dose(g, 'Kr') === 2) return 'kohlrabi';
    if (has('sp')) return 'sprouts';
    if (has('cu')) return has('fr') ? 'romanesco' : 'cauliflower';
    if (has('br')) return 'broccoli';
    const he = this.dose(g, 'He');
    if (he === 2) return 'cabbage';
    if (he === 1) return 'looseHead';
    if (has('Tu')) return 'turnip';
    return genome.includes('C') && !genome.includes('A') && !genome.includes('B') ? 'kale' : 'leafy';
  }

  /** Aspect de la plante : morphotype, couleurs, feuilles, fleurs. */
  appearanceOf(g: BrGenotype, genome: string, sp: SpeciesId, cyto: Cytoplasm = 'N'): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const purple = has('Pr');
    const curd: CurdColor = purple ? 'purple' : has('Or') ? 'orange' : has('Gc') ? 'green' : 'white';
    return {
      morphotype: this.morphotypeOf(g, genome),
      purple,
      curd,
      savoy: has('Sav'),
      curly: has('Cr'),
      glossy: has('gl'),
      annual: has('an'),
      selfCompatible: functionalS(g.s).length === 0,
      maleSterile: cyto === 'Ogu' && !has('Rfo'),
      highGlucoraphanin: has('Gr'),
      genome,
      species: sp,
      cyto,
    };
  }

  resistances(ind: BrIndividual): VariantId[] {
    return (['Foc1', 'Pp523', 'CRa'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  /** Code catalogue (« HR: Foc:1 · Pb · Hpa »). */
  resistanceCode(ind: BrIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    if (r.has('Foc1')) parts.push('Foc:1');
    if (r.has('CRa')) parts.push('Pb');
    if (r.has('Pp523')) parts.push('Hpa');
    return parts.join(' · ');
  }

  sizeClass(ind: BrIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightKg);
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: BrIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: BrIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: BrIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: BrIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: BrIndividual): BrLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  predict(a: BrIndividual, b: BrIndividual): TheoreticalRatio[] {
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
            const g = { ...a.genotype, [def.id]: [x, y] } as BrGenotype;
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

  genotypeCode(ind: BrIndividual): string {
    const parts: string[] = [];
    for (const def of BR_LOCI) {
      const pair = ind.genotype[def.id];
      if (def.silent) {
        parts.push(`${pair[0]}/${pair[1]}`);
        continue;
      }
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    const head = `${ind.genome}${ind.cyto === 'Ogu' ? ' [Ogu]' : ''}`;
    return `${head} · ${parts.join(' ')}`;
  }
}
