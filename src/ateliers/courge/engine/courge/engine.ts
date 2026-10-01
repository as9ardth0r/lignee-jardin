/**
 * Moteur de croisement des courges, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques des courges (Cucurbita) :
 *  - Plante MONOÏQUE : fleurs mâles et femelles séparées sur la même
 *    plante, pollinisées par les insectes. Au jardin, les variétés d’une
 *    même espèce se croisent donc facilement (allogamie). L’autofécondation
 *    reste possible à la main (pollen d’une fleur mâle de la même plante),
 *    et la dépression de consanguinité est modeste : fruits un peu plus
 *    petits et moins nombreux au fil des autofécondations, graines
 *    normales. Les F1 bénéficient d’une hétérosis sur le rendement.
 *  - PLUSIEURS ESPÈCES (pepo, maxima, moschata, argyrosperma, ficifolia)
 *    séparées par des barrières de croisement (voir compat.ts) : croisement
 *    refusé, ou très peu de graines et hybride F1 stérile ou peu fertile.
 *    La MÈRE (A) porte le fruit : le sens du croisement compte.
 *  - AMERTUME (Bi) : un seul allèle dominant rend le fruit amer et TOXIQUE.
 *
 * Traits quantitatifs (10 loci additifs chacun, phénotype = valeur
 * génétique + bruit environnemental tiré une fois à la naissance) :
 * poids du fruit, fruits par plante, jours jusqu’à la récolte, °Brix,
 * conservation, forme (rapport longueur/diamètre), côtes.
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossCompat } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, SQUASH_LOCI, VARIANT_ALLELE, type SpeciesId, type SquashLocusId, type VariantId } from './loci';
import type { SquashVariety } from './varieties';

export type QuantTraitId = 'weight' | 'fruits' | 'days' | 'brix' | 'storage' | 'shape' | 'ribs';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'fruits', 'days', 'brix', 'storage', 'shape', 'ribs'];
/** Traits affichés sur les cartes (les autres sur la fiche). */
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'fruits', 'days', 'brix'];

/** Loci polygéniques par trait : plus nombreux pour les traits à très
 * grande amplitude (le poids va de 50 g à plusieurs centaines de kg). */
const POLY_LOCI: Record<QuantTraitId, number> = { weight: 24, fruits: 12, days: 10, brix: 10, storage: 10, shape: 16, ribs: 10 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Poids moyen d’un fruit à la récolte (kg). */
  weight: { min: 0.05, max: 600, log: true, noise: 0.012, digits: 2 },
  /** Fruits récoltés par plante. */
  fruits: { min: 1, max: 30, log: true, noise: 0.06, digits: 0 },
  /** Jours du semis à la première récolte. */
  days: { min: 40, max: 140, noise: 0.04, digits: 0 },
  /** Sucres de la chair (°Brix). */
  brix: { min: 2.5, max: 16, noise: 0.05, digits: 1 },
  /** Conservation après récolte, au frais et au sec (mois). */
  storage: { min: 0.1, max: 12, noise: 0.05, digits: 1 },
  /** Forme : rapport longueur / diamètre du fruit. */
  shape: { min: 0.35, max: 7, log: true, noise: 0.02, digits: 2 },
  /** Côtes marquées (0 = lisse, 100 = très côtelé). */
  ribs: { min: 0, max: 100, noise: 0.06, digits: 0 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof SquashPhenotype> = {
  weight: 'weightKg',
  fruits: 'fruits',
  days: 'days',
  brix: 'brix',
  storage: 'storageMonths',
  shape: 'shapeRatio',
  ribs: 'ribs',
};

/** Bonus de rendement maximal d’un individu totalement hétérozygote. */
const MAX_HETEROSIS = 0.15;
/** Mois de conservation ajoutés par une écorce dure (Hr). */
const HARD_RIND_STORAGE_BONUS = 1.5;

export type SquashGenotype = Record<SquashLocusId, Diploid<string>>;

export interface SquashPhenotype {
  weightKg: number;
  fruits: number;
  days: number;
  brix: number;
  storageMonths: number;
  shapeRatio: number;
  ribs: number;
}

export interface SquashIndividual {
  /** Espèce (celle de la lignée maternelle pour un hybride). */
  species: SpeciesId;
  /** Autre espèce présente dans l’ascendance (hybride interspécifique). */
  hybridWith?: SpeciesId;
  /** Fertilité 0–1 (1 = normale ; 0 = hybride stérile). */
  fertility: number;
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  selfed: boolean;
  varietyId?: string;
  hybridFounder?: boolean;
  genotype: SquashGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: SquashPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: SquashJournalEntry[];
}

export type SquashStage = 'sowing' | 'emergence' | 'planting' | 'running' | 'maleFlowers' | 'femaleFlowers' | 'fruitset' | 'harvest' | 'curing' | 'seeds';
export const SQUASH_STAGES: SquashStage[] = ['sowing', 'emergence', 'planting', 'running', 'maleFlowers', 'femaleFlowers', 'fruitset', 'harvest', 'curing', 'seeds'];

export interface SquashJournalEntry {
  id: string;
  date: number;
  stage?: SquashStage;
  /** Longueur des tiges (cm). */
  heightCm?: number;
  fruits?: number;
  /** Récolte du jour (kg). */
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type RindColor = 'darkgreen' | 'green' | 'lightgreen' | 'cream' | 'white' | 'yellow' | 'orange' | 'red' | 'pink' | 'blue' | 'grey' | 'tan';
export type FleshColor = 'white' | 'cream' | 'yellow' | 'orange';
export type FruitShape = 'disc' | 'flat' | 'round' | 'turban' | 'oval' | 'pear' | 'elongated' | 'butternut' | 'crookneck';
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';

export interface FruitAppearance {
  rind: RindColor;
  flesh: FleshColor;
  striped: boolean;
  warty: boolean;
  shape: FruitShape;
  /** 0–1 : intensité des côtes (portrait). */
  ribs: number;
  ratio: number;
  hardRind: boolean;
  hullless: boolean;
  bitter: boolean;
  mottledLeaves: boolean;
  bush: 'bush' | 'semi' | 'vine';
  blackSeeds: boolean;
}

export interface TheoreticalRatio {
  variant: VariantId;
  /** Probabilité que l’allèle d’intérêt s’exprime chez un descendant. */
  pExpressed: number;
}

export interface CrossCheck extends CrossCompat {
  /** Parent stérile (hybride interspécifique) : croisement impossible. */
  sterileParent?: 'a' | 'b';
  /** Part effective des graines viables (compat × fertilité des parents). */
  effectiveSeedSet: number;
}

export class SquashEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('CRG');

  constructor(seed = 20260930) {
    const traitRng = mulberry32(seed + 7);
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
      const d = v < 1 ? 2 : v < 10 ? 1 : 0;
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

  unitOf(trait: QuantTraitId, ind: SquashIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Rendement par plante (kg) = poids moyen × nombre de fruits. */
  yieldKg(ind: SquashIndividual): number {
    const y = ind.pheno.weightKg * ind.pheno.fruits;
    return y < 10 ? Math.round(y * 10) / 10 : Math.round(y);
  }

  // --- Construction ----------------------------------------------------------

  private computePhenotype(genotype: SquashGenotype, haps: SquashIndividual['haps']): SquashPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const het = this.polygenicHeterozygosity(haps);
    const fruitsRaw = this.fromUnit('fruits', value('fruits'));
    const fruits = Math.max(1, Math.round(fruitsRaw * (1 + MAX_HETEROSIS * het)));
    let storageMonths = this.fromUnit('storage', value('storage'));
    if (this.has(genotype, 'Hr')) storageMonths = Math.round((storageMonths + HARD_RIND_STORAGE_BONUS) * 10) / 10;
    const weightKg = this.round('weight', this.fromUnit('weight', value('weight')) * (1 + 0.5 * MAX_HETEROSIS * het));
    return {
      weightKg,
      fruits,
      days: this.fromUnit('days', value('days')),
      brix: this.fromUnit('brix', value('brix')),
      storageMonths,
      shapeRatio: this.fromUnit('shape', value('shape')),
      ribs: this.fromUnit('ribs', value('ribs')),
    };
  }

  private build(
    genotype: SquashGenotype,
    haps: SquashIndividual['haps'],
    meta: Pick<SquashIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility'> & Partial<Pick<SquashIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder'>>
  ): SquashIndividual {
    return {
      id: this.ids.next(),
      ...meta,
      genotype,
      haps,
      pheno: this.computePhenotype(genotype, haps),
      createdAt: Date.now(),
    };
  }

  /** Valeurs cibles (unités réelles) d’une variété pour chaque trait. */
  varietyTargets(v: SquashVariety): Record<QuantTraitId, number> {
    return {
      weight: v.weightKg,
      fruits: v.fruits,
      days: v.days,
      brix: v.brix,
      storage: Math.max(TRAIT_SCALE.storage.min, v.storageMonths - (v.variants.includes('Hr') ? HARD_RIND_STORAGE_BONUS : 0)),
      shape: v.shapeRatio,
      ribs: v.ribs,
    };
  }

  createFromVariety(v: SquashVariety, label?: string): SquashIndividual {
    const genotype = this.genotypeFromVariants(v.variants);
    const meta = { label: label || v.name, generation: 0, parentIds: null, selfed: false, varietyId: v.id, species: v.species, fertility: 1 } as const;

    if (v.haps) {
      const haps = {} as SquashIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, { ...meta, hybridWith: v.hybridWith, fertility: v.fertility ?? 1 });
    }

    const targets = this.varietyTargets(v);
    const haps = {} as SquashIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      let tv = targets[trait];
      if (v.hybrid && trait === 'fruits') tv = tv / (1 + MAX_HETEROSIS * 0.5);
      const u = this.toUnit(trait, tv);
      if (v.hybrid) {
        haps[trait] = [this.traits[trait].haplotypeForTarget(u + 0.1, this.rng), this.traits[trait].haplotypeForTarget(u - 0.1, this.rng)];
      } else {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      }
    }

    if (v.hybrid) {
      // Hybride F1 du commerce : les résistances et les caractères dominants
      // sont le plus souvent apportés par un seul parent (hétérozygotes).
      for (const def of SQUASH_LOCI) {
        const pair = genotype[def.id];
        const dominantVariant = def.alleles[0].id && pair[0] === def.alleles[0].allele && def.standard !== def.alleles[0].allele;
        if (dominantVariant && (def.category === 'resistance' || def.id === 'bu' || def.id === 'b')) {
          genotype[def.id] = this.rng() < 0.5 ? [pair[0], def.standard] : [def.standard, pair[0]];
        }
      }
      const interspecific = v.hybridWith && v.hybridWith !== v.species;
      return this.build(genotype, haps, { ...meta, hybridFounder: true, hybridWith: v.hybridWith, fertility: interspecific ? (v.fertility ?? 0) : 1 });
    }
    return this.build(genotype, haps, meta);
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>> }): SquashIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as SquashIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1 });
  }

  /** Bouture de tige marcottée : copie génétique exacte. */
  cloneOf(ind: SquashIndividual, label?: string): SquashIndividual {
    const haps = {} as SquashIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as SquashGenotype;
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
    });
    return { ...clone, clonedFromId: ind.id };
  }

  fixedVariants(ind: SquashIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of SQUASH_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: SquashIndividual): Record<SquashLocusId, string> {
    const g = {} as Record<SquashLocusId, string>;
    for (const id of LOCUS_IDS) g[id] = gameteAllele(ind.genotype[id], this.rng);
    return g;
  }

  // --- Barrières de croisement ---------------------------------------------

  /** Le croisement a (mère) × b (père) est-il possible, et avec quel succès ? */
  crossCheck(a: SquashIndividual, b: SquashIndividual): CrossCheck {
    const compat = speciesCompat(a.species, b.species);
    if (a.fertility <= 0.001) return { ...compat, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...compat, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    const effectiveSeedSet = compat.level === 'blocked' ? 0 : compat.seedSet * Math.sqrt(a.fertility * b.fertility);
    const level = compat.level === 'same' && effectiveSeedSet < 0.999 ? 'difficult' : compat.level;
    return { ...compat, level, reason: compat.level === 'same' && level === 'difficult' ? 'lowFertility' : compat.reason, effectiveSeedSet };
  }

  /** Croisement (a = mère, porte le fruit) × b (père, donne le pollen), ou
   * autofécondation manuelle (a × a). Renvoie uniquement les graines
   * VIABLES : moins que `n` (voire aucune) entre espèces différentes. */
  cross(a: SquashIndividual, b: SquashIndividual, n: number, labelPrefix?: string): SquashIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const interspecific = a.species !== b.species;
    const hybridWith = interspecific ? b.species : a.hybridWith ?? b.hybridWith;
    // Fertilité des descendants : F1 interspécifique selon la table ;
    // sinon elle se rétablit peu à peu à chaque génération.
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const fertility = interspecific ? check.f1Fertility : parentsFert >= 0.999 ? 1 : Math.min(1, parentsFert + (1 - parentsFert) * 0.35);

    const out: SquashIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as SquashGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as SquashIndividual['haps'];
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
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  /** Allèle exprimé à un locus : le plus dominant des deux. */
  expressedAllele(g: SquashGenotype, locus: SquashLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  /** L’allèle d’intérêt s’exprime-t-il (au moins partiellement) ? */
  has(g: SquashGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete) {
      // Dominance incomplète : un seul allèle suffit à un effet partiel,
      // sauf pour bl (récessif incomplet), qui demande deux copies pour le bleu.
      return id === 'bl' ? countAllele(g[locus], allele) === 2 : countAllele(g[locus], allele) >= 1;
    }
    return this.expressedAllele(g, locus) === allele;
  }

  /** Nombre de copies d’un allèle (0, 1, 2). */
  dose(g: SquashGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  /** Porteur masqué d’une variante récessive. */
  isCarrier(g: SquashGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): SquashGenotype {
    const g = {} as SquashGenotype;
    for (const locus of SQUASH_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      if (g[locus][0] === LOCUS_BY_ID[locus].standard) g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: SquashIndividual): SquashIndividual {
    const missingLoci = SQUASH_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base = { ...ind, fertility: ind.fertility ?? 1 };
    if (!missingLoci.length && !missingTraits.length) return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) {
      const h = this.traits[t].haplotypeForTarget(0.5, this.rng);
      haps[t] = [h, [...h]];
    }
    const pheno = { ...this.computePhenotype(genotype, haps), ...ind.pheno };
    return { ...base, genotype, haps, pheno };
  }

  appearance(ind: SquashIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.species, ind.pheno.shapeRatio, ind.pheno.ribs);
  }

  appearanceFromVariety(v: Pick<SquashVariety, 'variants' | 'species' | 'shapeRatio' | 'ribs'>): FruitAppearance {
    return this.appearanceOf(this.genotypeFromVariants(v.variants), v.species, v.shapeRatio, v.ribs);
  }

  appearanceOf(g: SquashGenotype, sp: SpeciesId, ratio: number, ribs: number): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const L2 = g.l2.includes('L2');
    const l1 = this.expressedAllele(g, 'l1');

    let rind: RindColor;
    let striped = false;
    let flesh: FleshColor;

    if (sp === 'pepo') {
      if (has('B')) rind = 'yellow';
      else if (has('W')) rind = has('Wf') ? 'white' : 'cream';
      else if (has('D')) rind = 'darkgreen';
      else if (has('mo')) rind = L2 ? 'orange' : 'yellow';
      else if (has('Y')) rind = 'yellow';
      else if (l1 === 'L1') rind = L2 ? 'green' : 'lightgreen';
      else if (l1 === 'st') rind = 'cream';
      else rind = L2 ? 'lightgreen' : 'cream';
      striped = l1 === 'st' && !has('B') && !has('W') && !has('D');
      flesh = has('Wf') ? 'white' : L2 && (has('B') || has('mo')) ? 'orange' : has('mo') ? 'yellow' : 'cream';
    } else if (sp === 'maxima') {
      if (has('Rd')) rind = 'red';
      else if (has('B')) rind = 'yellow';
      else if (has('W')) rind = 'white';
      else if (has('bl')) rind = 'blue';
      else if (this.dose(g, 'bl') === 1) rind = 'grey';
      else if (has('pk')) rind = 'pink';
      else if (has('mo')) rind = 'orange';
      else rind = 'darkgreen';
      flesh = 'orange';
    } else if (sp === 'moschata') {
      rind = has('B') ? 'orange' : has('Gr') ? 'darkgreen' : 'tan';
      flesh = 'orange';
    } else if (sp === 'argyrosperma') {
      rind = has('W') ? 'white' : 'cream';
      striped = l1 === 'st' && !has('W');
      flesh = 'yellow';
    } else {
      // Courge de Siam : vert marbré de blanc, chair blanche, graines noires
      rind = 'green';
      striped = true;
      flesh = 'white';
    }

    let shape: FruitShape;
    if (sp === 'pepo' && has('Di')) shape = 'disc';
    else if (sp === 'maxima' && has('Tu') && ratio < 1.3) shape = 'turban';
    else if (ratio < 0.72) shape = 'flat';
    else if (ratio < 1.25) shape = 'round';
    else if (ratio < 1.9) shape = sp === 'moschata' ? 'pear' : 'oval';
    else if (sp === 'moschata') shape = has('Bn') ? 'butternut' : 'crookneck';
    else shape = 'elongated';

    const hardRind = has('Hr');
    const warty = has('Wt') && (sp !== 'pepo' || hardRind);
    const buDose = this.dose(g, 'Bu');
    return {
      rind,
      flesh,
      striped,
      warty,
      shape,
      ribs: Math.max(0, Math.min(1, ribs / 100)),
      ratio,
      hardRind,
      hullless: has('n'),
      bitter: has('Bi'),
      mottledLeaves: has('M'),
      bush: buDose === 2 ? 'bush' : buDose === 1 ? 'semi' : 'vine',
      blackSeeds: sp === 'ficifolia',
    };
  }

  isBitter(ind: SquashIndividual) {
    return this.has(ind.genotype, 'Bi');
  }

  bushLevel(ind: SquashIndividual): 'bush' | 'semi' | 'vine' {
    const d = this.dose(ind.genotype, 'Bu');
    return d === 2 ? 'bush' : d === 1 ? 'semi' : 'vine';
  }

  /** Résistances exprimées, avec leur niveau (Pm-0 : partielle à l’état hétérozygote). */
  resistances(ind: SquashIndividual): Array<{ id: VariantId; full: boolean }> {
    const out: Array<{ id: VariantId; full: boolean }> = [];
    const pm = this.dose(ind.genotype, 'Pm0');
    if (pm > 0) out.push({ id: 'Pm0', full: pm === 2 });
    if (this.has(ind.genotype, 'Zym')) out.push({ id: 'Zym', full: true });
    return out;
  }

  sizeClass(ind: SquashIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightKg);
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: SquashIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: SquashIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: SquashIndividual): number {
    const nM = LOCUS_IDS.length;
    const nP = TOTAL_POLY_LOCI;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * nP) / (nM + nP);
  }

  isFixed(ind: SquashIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: SquashIndividual): SquashLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  /** Probabilité d’expression de chaque allèle d’intérêt dans la descendance
   * (loci indépendants : 4 combinaisons de gamètes équiprobables). */
  predict(a: SquashIndividual, b: SquashIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    for (const def of SQUASH_LOCI) {
      const pa = a.genotype[def.id];
      const pb = b.genotype[def.id];
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!pa.includes(al.allele) && !pb.includes(al.allele)) continue;
        let p = 0;
        for (const x of pa)
          for (const y of pb) {
            const g = { ...a.genotype, [def.id]: [x, y] } as SquashGenotype;
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

  genotypeCode(ind: SquashIndividual): string {
    const parts: string[] = [];
    for (const def of SQUASH_LOCI) {
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
  return kg < 0.5 ? 'mini' : kg < 2 ? 'small' : kg < 6 ? 'medium' : kg < 25 ? 'large' : 'giant';
}
