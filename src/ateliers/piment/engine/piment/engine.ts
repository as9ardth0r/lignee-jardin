/**
 * Moteur de croisement des piments et poivrons, bâti sur le noyau commun
 * (../core).
 *
 * Particularités biologiques des piments (Capsicum) :
 *  - fleurs HERMAPHRODITES qui s’autofécondent en grande partie, mais les
 *    insectes croisent 10 à 40 % des fleurs au jardin. Pour croiser à la
 *    main, on CASTRE la fleur mère (on retire les étamines du bouton) ;
 *  - PLUSIEURS ESPÈCES (annuum, chinense, frutescens, baccatum, pubescens),
 *    séparées par des barrières (voir compat.ts). La MÈRE (A) porte le
 *    fruit : le sens du croisement compte ;
 *  - STÉRILITÉ MÂLE CYTOPLASMIQUE (CMS) : le cytoplasme (mitochondries)
 *    se transmet uniquement par la mère. Une plante à cytoplasme S sans
 *    restaurateur Rf n’a pas de pollen : pas besoin de la castrer, mais
 *    elle ne peut ni être père ni s’autoféconder ;
 *  - PIQUANT : Pun1 décide s’il y a de la capsaïcine ; son niveau (échelle
 *    de Scoville) est polygénique ;
 *  - LIAISONS : les gènes portés par le même chromosome se transmettent
 *    ensemble, sauf crossing-over (fonction de Kosambi).
 *
 * Traits quantitatifs (phénotype = valeur génétique + bruit environnemental
 * tiré une fois à la naissance) : poids du fruit, fruits par plante, jours
 * de la plantation au premier fruit mûr, piquant (unités Scoville), forme
 * (rapport longueur/diamètre), hauteur de la plante.
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossCompat } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, PEPPER_LOCI, VARIANT_ALLELE, type PepperLocusId, type SpeciesId, type VariantId } from './loci';
import type { PepperVariety } from './varieties';

export type QuantTraitId = 'weight' | 'fruits' | 'days' | 'heat' | 'shape' | 'height';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'fruits', 'days', 'heat', 'shape', 'height'];
/** Traits affichés sur les cartes (les autres sur la fiche). */
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'heat', 'days', 'fruits'];

const POLY_LOCI: Record<QuantTraitId, number> = { weight: 20, fruits: 14, days: 12, heat: 18, shape: 16, height: 10 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Poids moyen d’un fruit (kg) : 0,5 g (piment oiseau) à 400 g. */
  weight: { min: 0.0005, max: 0.45, log: true, noise: 0.015, digits: 3 },
  /** Fruits récoltés par plante. */
  fruits: { min: 2, max: 400, log: true, noise: 0.04, digits: 0 },
  /** Jours de la plantation au premier fruit mûr. */
  days: { min: 55, max: 160, noise: 0.03, digits: 0 },
  /** Piquant, unités Scoville (si Pun1 est présent). */
  heat: { min: 50, max: 2_200_000, log: true, noise: 0.012, digits: 0 },
  /** Forme : rapport longueur / diamètre du fruit. */
  shape: { min: 0.5, max: 16, log: true, noise: 0.02, digits: 2 },
  /** Hauteur de la plante (cm). */
  height: { min: 20, max: 200, noise: 0.04, digits: 0 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof PepperPhenotype> = {
  weight: 'weightKg',
  fruits: 'fruits',
  days: 'days',
  heat: 'shu',
  shape: 'shapeRatio',
  height: 'heightCm',
};

/** Bonus de rendement maximal d’un individu totalement hétérozygote. */
const MAX_HETEROSIS = 0.12;

export type PepperGenotype = Record<PepperLocusId, Diploid<string>>;
/** Cytoplasme, transmis par la mère : N normal, S stérilisant (CMS). */
export type Cytoplasm = 'N' | 'S';

export interface PepperPhenotype {
  weightKg: number;
  fruits: number;
  days: number;
  /** Unités Scoville (0 = doux). */
  shu: number;
  shapeRatio: number;
  heightCm: number;
}

export interface PepperIndividual {
  crop: 'piment';
  /** Espèce (celle de la lignée maternelle pour un hybride). */
  species: SpeciesId;
  /** Autre espèce présente dans l’ascendance (hybride interspécifique). */
  hybridWith?: SpeciesId;
  /** Fertilité 0–1 (1 = normale ; 0 = hybride stérile). */
  fertility: number;
  cyto: Cytoplasm;
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  selfed: boolean;
  varietyId?: string;
  hybridFounder?: boolean;
  genotype: PepperGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: PepperPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: PepperJournalEntry[];
}

export type PepperStage = 'sowing' | 'emergence' | 'pricking' | 'planting' | 'flowering' | 'fruitset' | 'green' | 'ripe' | 'harvest' | 'seeds';
export const PEPPER_STAGES: PepperStage[] = ['sowing', 'emergence', 'pricking', 'planting', 'flowering', 'fruitset', 'green', 'ripe', 'harvest', 'seeds'];

export interface PepperJournalEntry {
  id: string;
  date: number;
  stage?: PepperStage;
  /** Hauteur de la plante (cm). */
  heightCm?: number;
  fruits?: number;
  /** Récolte du jour (kg). */
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type RipeColor = 'red' | 'lightred' | 'orange' | 'paleorange' | 'yellow' | 'lemon' | 'cream' | 'white' | 'brown' | 'green';
export const RIPE_COLORS: RipeColor[] = ['red', 'lightred', 'orange', 'paleorange', 'yellow', 'lemon', 'cream', 'white', 'brown', 'green'];
export type UnripeColor = 'green' | 'purple' | 'ivory';
export type FruitShape = 'flat' | 'bell' | 'round' | 'lamuyo' | 'cone' | 'long' | 'thin';
export const FRUIT_SHAPES: FruitShape[] = ['flat', 'bell', 'round', 'lamuyo', 'cone', 'long', 'thin'];
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';
export type HeatClass = 'sweet' | 'mild' | 'medium' | 'hot' | 'veryhot' | 'extreme';
export const HEAT_CLASSES: HeatClass[] = ['sweet', 'mild', 'medium', 'hot', 'veryhot', 'extreme'];
export type FlowerColor = 'white' | 'greenish' | 'spotted' | 'purple';

export interface FruitAppearance {
  ripe: RipeColor;
  unripe: UnripeColor;
  shape: FruitShape;
  ratio: number;
  heat: HeatClass;
  sweet: boolean;
  erect: boolean;
  clustered: boolean;
  deciduous: boolean;
  flower: FlowerColor;
  blackSeeds: boolean;
  wrinkled: boolean;
  maleSterile: boolean;
}

export interface TheoreticalRatio {
  variant: VariantId;
  /** Probabilité que l’allèle d’intérêt s’exprime chez un descendant. */
  pExpressed: number;
}

export interface CrossCheck extends Omit<CrossCompat, 'reason'> {
  reason: string;
  /** Parent stérile (hybride interspécifique) : croisement impossible. */
  sterileParent?: 'a' | 'b';
  /** Part effective des graines viables (compat × fertilité des parents). */
  effectiveSeedSet: number;
}

/** Fonction de Kosambi : fréquence de recombinaison pour une distance en cM. */
export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

const LINKAGE_GROUPS: PepperLocusId[][] = (() => {
  const m = new Map<number, PepperLocusId[]>();
  for (const l of PEPPER_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: PepperLocusId[] = PEPPER_LOCI.filter((l) => !l.chromosome).map((l) => l.id);

export function heatClassOf(shu: number): HeatClass {
  return shu <= 0 ? 'sweet' : shu < 2500 ? 'mild' : shu < 30000 ? 'medium' : shu < 100000 ? 'hot' : shu < 500000 ? 'veryhot' : 'extreme';
}

export function sizeClassOf(kg: number): SizeClass {
  return kg < 0.005 ? 'mini' : kg < 0.03 ? 'small' : kg < 0.1 ? 'medium' : kg < 0.2 ? 'large' : 'giant';
}

function roundShu(v: number): number {
  if (v < 1000) return Math.round(v / 10) * 10;
  const p = 10 ** (Math.floor(Math.log10(v)) - 1);
  return Math.round(v / p) * p;
}

export class PepperEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('PIM');

  constructor(seed = 20260930) {
    const traitRng = mulberry32(seed + 13);
    this.traits = {} as Record<QuantTraitId, PolygenicTrait>;
    for (const t of QUANT_TRAITS) this.traits[t] = new PolygenicTrait(POLY_LOCI[t], traitRng);
    this.rng = mulberry32(seed ^ Date.now());
  }

  /** Pour les tests : RNG reproductible. */
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
      const d = v < 0.01 ? 4 : 3;
      return Math.round(v * 10 ** d) / 10 ** d;
    }
    if (trait === 'heat') return roundShu(v);
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
    if (trait === 'heat' && value <= 0) return 0;
    return Math.max(0, Math.min(1, this.toUnit(trait, value)));
  }

  unitOf(trait: QuantTraitId, ind: PepperIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Rendement par plante (kg) = poids moyen × nombre de fruits. */
  yieldKg(ind: PepperIndividual): number {
    const y = ind.pheno.weightKg * ind.pheno.fruits;
    return Math.round(y * 100) / 100;
  }

  // --- Construction ----------------------------------------------------------

  private computePhenotype(genotype: PepperGenotype, haps: PepperIndividual['haps']): PepperPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const het = this.polygenicHeterozygosity(haps);
    const fruits = Math.max(1, Math.round(this.fromUnit('fruits', value('fruits')) * (1 + MAX_HETEROSIS * het)));
    const weightKg = this.round('weight', this.fromUnit('weight', value('weight')) * (1 + 0.5 * MAX_HETEROSIS * het));
    const heatValue = this.fromUnit('heat', value('heat'));
    return {
      weightKg,
      fruits,
      days: this.fromUnit('days', value('days')),
      shu: this.has(genotype, 'pun1') ? 0 : heatValue,
      shapeRatio: this.fromUnit('shape', value('shape')),
      heightCm: this.fromUnit('height', value('height')),
    };
  }

  private build(
    genotype: PepperGenotype,
    haps: PepperIndividual['haps'],
    meta: Pick<PepperIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility' | 'cyto'> &
      Partial<Pick<PepperIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder'>>
  ): PepperIndividual {
    return {
      crop: 'piment',
      id: this.ids.next(),
      ...meta,
      genotype,
      haps,
      pheno: this.computePhenotype(genotype, haps),
      createdAt: Date.now(),
    };
  }

  /** Valeurs cibles (unités réelles) d’une variété pour chaque trait. Un
   * poivron doux a une valeur génétique de piquant « cachée » (révélée si
   * l’on réintroduit Pun1 par croisement) : on la fixe à un niveau doux. */
  varietyTargets(v: PepperVariety): Record<QuantTraitId, number> {
    return {
      weight: v.weightKg,
      fruits: v.fruits,
      days: v.days,
      heat: v.shu > 0 ? v.shu : v.hiddenShu ?? 1500,
      shape: v.shapeRatio,
      height: v.heightCm,
    };
  }

  createFromVariety(v: PepperVariety, label?: string): PepperIndividual {
    const genotype = this.genotypeFromVariants(v.variants);
    const cyto: Cytoplasm = v.cms ? 'S' : 'N';
    const meta = { label: label || v.name, generation: 0, parentIds: null, selfed: false, varietyId: v.id, species: v.species, fertility: v.fertility ?? 1, cyto } as const;

    if (v.haps) {
      const haps = {} as PepperIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, { ...meta, hybridWith: v.hybridWith });
    }

    const targets = this.varietyTargets(v);
    const haps = {} as PepperIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      let tv = targets[trait];
      if (v.hybrid && trait === 'fruits') tv = tv / (1 + MAX_HETEROSIS * 0.5);
      const u = this.toUnit(trait, tv);
      if (v.hybrid) {
        haps[trait] = [this.traits[trait].haplotypeForTarget(u + 0.08, this.rng), this.traits[trait].haplotypeForTarget(u - 0.08, this.rng)];
      } else {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      }
    }

    if (v.hybrid) {
      // Hybride F1 du commerce : les résistances dominantes (et le
      // restaurateur Rf d’un hybride produit sur CMS) viennent d’un seul
      // parent : hétérozygotes.
      for (const def of PEPPER_LOCI) {
        const pair = genotype[def.id];
        const expressed = def.alleles.find((a) => a.allele === pair[0]);
        const dominantVariant = expressed?.id && def.alleles.indexOf(expressed) < def.alleles.findIndex((a) => a.allele === def.standard);
        if (dominantVariant && (def.category === 'resistance' || def.id === 'rf')) {
          genotype[def.id] = this.rng() < 0.5 ? [pair[0], def.standard] : [def.standard, pair[0]];
        }
      }
      return this.build(genotype, haps, { ...meta, hybridFounder: true, hybridWith: v.hybridWith });
    }
    return this.build(genotype, haps, { ...meta, hybridWith: v.hybridWith });
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>>; cyto?: Cytoplasm }): PepperIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as PepperIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1, cyto: opts.cyto ?? 'N' });
  }

  /** Bouture : copie génétique exacte. */
  cloneOf(ind: PepperIndividual, label?: string): PepperIndividual {
    const haps = {} as PepperIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as PepperGenotype;
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
      cyto: ind.cyto,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  fixedVariants(ind: PepperIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of PEPPER_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  /** Gamète : un chromosome de chaque paire, crossing-over entre loci liés. */
  gamete(ind: PepperIndividual): Record<PepperLocusId, string> {
    const g = {} as Record<PepperLocusId, string>;
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

  /** Stérilité mâle cytoplasmique : cytoplasme S sans restaurateur Rf. */
  isCmsSterile(ind: PepperIndividual): boolean {
    return ind.cyto === 'S' && !this.has(ind.genotype, 'Rf');
  }

  /** La plante produit-elle du pollen fonctionnel ? */
  canPollinate(ind: PepperIndividual): boolean {
    return ind.fertility > 0.001 && !this.isCmsSterile(ind);
  }

  /** Faut-il castrer la mère ? Oui, sauf si elle n’a pas de pollen. */
  needsEmasculation(ind: PepperIndividual): boolean {
    return this.canPollinate(ind);
  }

  /** Le croisement a (mère) × b (père) est-il possible, et avec quel succès ? */
  crossCheck(a: PepperIndividual, b: PepperIndividual): CrossCheck {
    const compat = speciesCompat(a.species, b.species);
    if (a.fertility <= 0.001) return { ...compat, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...compat, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (!this.canPollinate(b)) return { ...compat, level: 'blocked', reason: a.id === b.id ? 'cmsSelf' : 'cmsFather', effectiveSeedSet: 0 };
    const effectiveSeedSet = compat.level === 'blocked' ? 0 : compat.seedSet * Math.sqrt(a.fertility * b.fertility);
    const level = compat.level === 'same' && effectiveSeedSet < 0.999 ? 'difficult' : compat.level;
    return { ...compat, level, reason: compat.level === 'same' && level === 'difficult' ? 'lowFertility' : compat.reason, effectiveSeedSet };
  }

  /** Croisement (a = mère, porte le fruit) × b (père, donne le pollen), ou
   * autofécondation (a × a). Renvoie uniquement les graines VIABLES : moins
   * que `n` (voire aucune) entre espèces éloignées. Le cytoplasme vient
   * toujours de la mère. */
  cross(a: PepperIndividual, b: PepperIndividual, n: number, labelPrefix?: string): PepperIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const interspecific = a.species !== b.species;
    const hybridWith = interspecific ? b.species : a.hybridWith ?? b.hybridWith;
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const fertility = interspecific ? check.f1Fertility : parentsFert >= 0.999 ? 1 : Math.min(1, parentsFert + (1 - parentsFert) * 0.35);

    const out: PepperIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as PepperGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as PepperIndividual['haps'];
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
          cyto: a.cyto,
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: PepperGenotype, locus: PepperLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: PepperGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: PepperGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: PepperGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): PepperGenotype {
    const g = {} as PepperGenotype;
    for (const locus of PEPPER_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      if (g[locus][0] === LOCUS_BY_ID[locus].standard) g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: PepperIndividual): PepperIndividual {
    const missingLoci = PEPPER_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: PepperIndividual = { ...ind, crop: 'piment', fertility: ind.fertility ?? 1, cyto: ind.cyto ?? 'N' };
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

  appearance(ind: PepperIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.species, ind.pheno.shapeRatio, ind.pheno.weightKg, ind.pheno.shu, this.isCmsSterile(ind));
  }

  appearanceFromVariety(v: Pick<PepperVariety, 'variants' | 'species' | 'shapeRatio' | 'weightKg' | 'shu' | 'cms'>): FruitAppearance {
    const g = this.genotypeFromVariants(v.variants);
    return this.appearanceOf(g, v.species, v.shapeRatio, v.weightKg, v.shu, Boolean(v.cms) && !this.has(g, 'Rf'));
  }

  appearanceOf(g: PepperGenotype, sp: SpeciesId, ratio: number, weightKg: number, shu: number, maleSterile: boolean): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const Y = !has('y');
    const C2 = !has('c2');
    const C1 = !has('c1');
    let ripe: RipeColor = Y ? (C2 ? (C1 ? 'red' : 'lightred') : C1 ? 'orange' : 'paleorange') : C2 ? (C1 ? 'yellow' : 'lemon') : C1 ? 'cream' : 'white';
    if (has('cl')) ripe = Y ? 'brown' : 'green';
    const unripe: UnripeColor = has('A') ? 'purple' : has('sw') ? 'ivory' : 'green';
    const big = weightKg >= 0.06;
    const shape: FruitShape =
      ratio < 0.85 ? 'flat' : ratio < 1.35 ? (big ? 'bell' : 'round') : ratio < 2.6 && big ? 'lamuyo' : ratio < 4.5 ? 'cone' : ratio < 9 ? 'long' : 'thin';
    const sweet = has('pun1');
    return {
      ripe,
      unripe,
      shape,
      ratio,
      heat: sweet ? 'sweet' : heatClassOf(shu),
      sweet,
      erect: has('up'),
      clustered: has('fa'),
      deciduous: has('S'),
      flower: sp === 'pubescens' || has('A') ? 'purple' : sp === 'baccatum' ? 'spotted' : sp === 'annuum' ? 'white' : 'greenish',
      blackSeeds: sp === 'pubescens',
      wrinkled: sp === 'chinense' && !big,
      maleSterile,
    };
  }

  /** Résistances exprimées (pour la série L : l’allèle le plus fort). */
  resistances(ind: PepperIndividual): VariantId[] {
    const out: VariantId[] = [];
    const l = this.expressedAllele(ind.genotype, 'l');
    if (l !== 'L+') out.push(l as VariantId);
    for (const id of ['Tsw', 'Bs2', 'pvr2', 'Pvr4', 'Me3'] as VariantId[]) if (this.has(ind.genotype, id)) out.push(id);
    return out;
  }

  /** Niveau de résistance aux tobamovirus : 0 (aucune) à 4 (L4). */
  lLevel(ind: PepperIndividual): number {
    const l = this.expressedAllele(ind.genotype, 'l');
    return l === 'L+' ? 0 : Number(l.slice(1));
  }

  /** Code catalogue façon sachet (« HR: Tm:0-3 / Xcv:0-3 / TSWV »). */
  resistanceCode(ind: PepperIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    const lv = this.lLevel(ind);
    if (lv) parts.push(`Tm:${['0', '0-1', '0-2', '0-3'][lv - 1]}`);
    if (r.has('Bs2')) parts.push('Xcv:0-3');
    if (r.has('Tsw')) parts.push('TSWV');
    if (r.has('Pvr4')) parts.push('PVY:0-1-2');
    else if (r.has('pvr2')) parts.push('PVY:0-1');
    if (r.has('Me3')) parts.push('Ma/Mi/Mj');
    return parts.join(' / ');
  }

  sizeClass(ind: PepperIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightKg);
  }

  isHot(ind: PepperIndividual): boolean {
    return ind.pheno.shu > 0;
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: PepperIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: PepperIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: PepperIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: PepperIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: PepperIndividual): PepperLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  /** Probabilité d’expression de chaque allèle d’intérêt dans la descendance
   * (locus par locus, sans tenir compte des liaisons). */
  predict(a: PepperIndividual, b: PepperIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    for (const def of PEPPER_LOCI) {
      const pa = a.genotype[def.id];
      const pb = b.genotype[def.id];
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!pa.includes(al.allele) && !pb.includes(al.allele)) continue;
        let p = 0;
        for (const x of pa)
          for (const y of pb) {
            const g = { ...a.genotype, [def.id]: [x, y] } as PepperGenotype;
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

  genotypeCode(ind: PepperIndividual): string {
    const parts: string[] = [];
    if (ind.cyto === 'S') parts.push('[S]');
    for (const def of PEPPER_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.length ? parts.join(' ') : '+';
  }
}
