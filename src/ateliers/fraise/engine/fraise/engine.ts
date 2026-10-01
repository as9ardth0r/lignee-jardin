/**
 * Moteur de croisement du fraisier, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques :
 *  - UNE VARIÉTÉ EST UN CLONE. Le fraisier cultivé est très hétérozygote
 *    et souffre beaucoup de la consanguinité : ses graines (les akènes)
 *    donnent des plantes toutes différentes. L’obtenteur croise deux
 *    parents, sème des centaines de pépins, repère LE semis qui réunit ce
 *    qu’il cherche, puis le multiplie à l’identique par ses STOLONS. Pas
 *    besoin de « fixer » une lignée : le clone garde son génotype, hybride
 *    compris, pour toujours (Gariguette est un seul et même plant depuis
 *    1976).
 *  - Le fraisier des bois (diploïde) tolère au contraire la consanguinité :
 *    les fraises des quatre saisons se ressèment fidèlement, ce sont des
 *    lignées.
 *  - Hérédité disomique de l’octoploïde : chaque locus se transmet comme
 *    chez un diploïde (voir loci.ts).
 *  - Plantes FEMELLES chez les fraisiers sauvages octoploïdes ; hybrides
 *    entre ploïdies différentes stériles, mais multipliables par stolons.
 *
 * Traits quantitatifs : poids du fruit, fermeté, sucres (°Brix), précocité
 * (jour de la première fraise mûre, compté depuis le 1er avril), nombre de
 * stolons.
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossLevel } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, FA_LOCI, VARIANT_ALLELE, type FaLocusId, type SpeciesId, type VariantId } from './loci';
import type { FaVariety } from './varieties';

export type QuantTraitId = 'weight' | 'firmness' | 'brix' | 'early' | 'runners';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'firmness', 'brix', 'early', 'runners'];
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'firmness', 'brix', 'early'];

const POLY_LOCI: Record<QuantTraitId, number> = { weight: 22, firmness: 16, brix: 16, early: 18, runners: 14 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Poids moyen d’un fruit (g). */
  weight: { min: 1, max: 60, log: true, noise: 0.015, digits: 1 },
  /** Fermeté de la chair (note 1 à 9). */
  firmness: { min: 1, max: 9, noise: 0.02, digits: 1 },
  /** Sucres solubles (°Brix). */
  brix: { min: 4, max: 14, noise: 0.02, digits: 1 },
  /** Première fraise mûre, en jours après le 1er avril (plein champ, climat océanique). */
  early: { min: 15, max: 90, noise: 0.015, digits: 0 },
  /** Stolons par plante et par saison. */
  runners: { min: 0, max: 30, noise: 0.03, digits: 0 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof FaPhenotype> = {
  weight: 'weightG',
  firmness: 'firmness',
  brix: 'brix',
  early: 'early',
  runners: 'runners',
};

/** Vigueur d’une plante totalement consanguine (fraction de la vigueur d’un hybride), selon l’espèce. */
export const INBRED_VIGOR: Record<SpeciesId, number> = { ananassa: 0.45, virginiana: 0.5, chiloensis: 0.5, moschata: 0.65, vesca: 0.95 };

/** Fruits par plante et par saison (plante vigoureuse, non remontante). */
const FRUITS: Record<SpeciesId, number> = { ananassa: 25, virginiana: 35, chiloensis: 20, moschata: 40, vesca: 60 };
/** Gain de récolte d’une plante remontante sur la saison. */
const EVERBEARING_GAIN = 1.7;

export type Cytoplasm = 'N';
export type FaGenotype = Record<FaLocusId, Diploid<string>>;

export interface FaPhenotype {
  weightG: number;
  firmness: number;
  brix: number;
  early: number;
  runners: number;
  /** Fruits par plante et par saison. */
  fruits: number;
}

export interface FaIndividual {
  crop: 'fraise';
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
  genotype: FaGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: FaPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  /** Plante obtenue par stolon (ou division) d’une autre : même génotype. */
  clonedFromId?: string;
  /** Mode de multiplication du clone. */
  cloneBy?: 'runner' | 'division';
  journal?: FaJournalEntry[];
}

export type FaStage = 'planting' | 'rooting' | 'flowering' | 'fruiting' | 'harvest' | 'runners' | 'dormancy' | 'renewal';
export const FA_STAGES: FaStage[] = ['planting', 'rooting', 'flowering', 'fruiting', 'harvest', 'runners', 'dormancy', 'renewal'];

export interface FaJournalEntry {
  id: string;
  date: number;
  stage?: FaStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type FruitColor = 'red' | 'white' | 'yellow';
export const FRUIT_COLORS: FruitColor[] = ['red', 'white', 'yellow'];
export type SizeClass = 'tiny' | 'small' | 'medium' | 'large' | 'giant';
export type Habit = 'juneBearing' | 'everbearing';

export interface FruitAppearance {
  color: FruitColor;
  everbearing: boolean;
  runnerless: boolean;
  peach: boolean;
  caramel: boolean;
  maleSterile: boolean;
  sterility: 'female' | null;
  /** Hybride entre ploïdies différentes : pas de graines, mais des stolons. */
  sterileHybrid: boolean;
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

const LINKAGE_GROUPS: FaLocusId[][] = (() => {
  const m = new Map<number, FaLocusId[]>();
  for (const l of FA_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: FaLocusId[] = FA_LOCI.filter((l) => !l.chromosome).map((l) => l.id);
const VISIBLE_LOCI = FA_LOCI.filter((l) => !l.silent);

export function sizeClassOf(g: number): SizeClass {
  return g < 3 ? 'tiny' : g < 10 ? 'small' : g < 20 ? 'medium' : g < 35 ? 'large' : 'giant';
}

export class FaEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('FRA');

  constructor(seed = 20261001) {
    const traitRng = mulberry32(seed + 59);
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

  unitOf(trait: QuantTraitId, ind: FaIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Récolte par plante et par saison (kg). */
  yieldKg(ind: FaIndividual): number {
    return Math.round(ind.pheno.weightG * ind.pheno.fruits) / 1000;
  }

  // --- Vigueur et haplotypes -------------------------------------------------

  /** Hétérozygotie relative d’un trait (0 = lignée, ~1 = population non consanguine). */
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

  /** Vigueur 0–1 : baisse avec la consanguinité, beaucoup chez le fraisier cultivé, à peine chez le fraisier des bois. */
  vigor(haps: FaIndividual['haps'], species: SpeciesId = 'ananassa'): number {
    let rel = 0;
    for (const t of QUANT_TRAITS) rel += Math.min(1.3, this.relativeHeterozygosity(haps[t]));
    const x = Math.min(1, rel / QUANT_TRAITS.length / 0.95);
    const floor = INBRED_VIGOR[species];
    return floor + (1 - floor) * Math.pow(x, 1.4);
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

  private computePhenotype(genotype: FaGenotype, haps: FaIndividual['haps'], species: SpeciesId): FaPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const vig = this.vigor(haps, species);
    const everbearing = this.isEverbearing(genotype, species);
    const runnerless = species === 'vesca' && this.has(genotype, 'r');
    // Les remontants font peu de stolons (effet de PFRU) ; les vesca r/r n’en font pas.
    const runners = runnerless ? 0 : Math.max(0, Math.round(this.fromUnit('runners', value('runners')) * vig * (everbearing && species !== 'vesca' ? 0.4 : 1)));
    const weightG = Math.max(0.3, Math.round(this.fromUnit('weight', value('weight')) * vig * 10) / 10);
    const fruits = Math.max(1, Math.round(FRUITS[species] * vig * (everbearing ? EVERBEARING_GAIN : 1)));
    return { weightG, firmness: this.fromUnit('firmness', value('firmness')), brix: this.fromUnit('brix', value('brix')), early: this.fromUnit('early', value('early')), runners, fruits };
  }

  private build(
    genotype: FaGenotype,
    haps: FaIndividual['haps'],
    meta: Pick<FaIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility' | 'cyto'> & Partial<Pick<FaIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder'>>
  ): FaIndividual {
    return { crop: 'fraise', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(genotype, haps, meta.species), createdAt: Date.now() };
  }

  /** Valeurs « génétiques » visées pour qu’une plante vigoureuse (ou une lignée) reproduise la fiche de la variété. */
  varietyTargets(v: FaVariety): Record<QuantTraitId, number> {
    const vig = v.inbred ? INBRED_VIGOR[v.species] : 1;
    const g = this.genotypeFromVariety(v);
    const everbearing = this.isEverbearing(g, v.species);
    const runnerFactor = everbearing && v.species !== 'vesca' ? 0.4 : 1;
    return { weight: v.weightG / vig, firmness: v.firmness, brix: v.brix, early: v.early, runners: Math.min(30, v.runners / vig / runnerFactor) };
  }

  private genotypeFromVariety(v: Pick<FaVariety, 'variants' | 'het'>): FaGenotype {
    const genotype = this.genotypeFromVariants(v.variants);
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      genotype[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    return genotype;
  }

  createFromVariety(v: FaVariety, label?: string): FaIndividual {
    const genotype = this.genotypeFromVariety(v);
    const meta = {
      label: label || v.name,
      generation: 0,
      parentIds: null,
      selfed: false,
      varietyId: v.id,
      species: v.species,
      fertility: v.fertility ?? 1,
      cyto: 'N' as Cytoplasm,
      hybridWith: v.hybridWith,
    };
    const haps = {} as FaIndividual['haps'];
    if (v.clone) {
      for (const trait of QUANT_TRAITS) {
        const pair = v.clone[trait];
        haps[trait] = pair ? [[...pair[0]], [...pair[1]]] : this.outbredHaps(trait, 0.5);
      }
      return this.build(genotype, haps, meta);
    }
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
    return this.build(genotype, haps, { ...meta, hybridFounder: v.inbred ? undefined : true });
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>> }): FaIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as FaIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = this.outbredHaps(trait, opts.targets[trait] ?? 0.5);
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1, cyto: 'N' });
  }

  private copyParts(ind: FaIndividual): { genotype: FaGenotype; haps: FaIndividual['haps'] } {
    const haps = {} as FaIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as FaGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    return { genotype, haps };
  }

  /** La plante fait-elle des stolons (multiplication facile) ? */
  makesRunners(ind: FaIndividual): boolean {
    return ind.pheno.runners >= 1;
  }

  /**
   * Multiplier une plante à l’identique : par un STOLON (le fraisier en
   * fait naturellement) ou, faute de stolons, en divisant la touffe.
   * C’est ainsi qu’une variété de fraisier se fixe : le clone garde tout
   * son génotype, y compris son hétérozygotie (et donc sa vigueur).
   */
  cloneOf(ind: FaIndividual, label?: string): FaIndividual {
    const { genotype, haps } = this.copyParts(ind);
    const by = this.makesRunners(ind) ? 'runner' : 'division';
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (${by === 'runner' ? 'stolon' : 'division'})`,
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
    return { ...clone, clonedFromId: ind.id, cloneBy: by };
  }

  fixedVariants(ind: FaIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of FA_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: FaIndividual): Record<FaLocusId, string> {
    const g = {} as Record<FaLocusId, string>;
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

  /** Plante femelle (étamines avortées) : seulement chez les sauvages octoploïdes et le capron. */
  isMaleSterile(ind: FaIndividual): boolean {
    return ind.species !== 'ananassa' && ind.species !== 'vesca' && this.has(ind.genotype, 'F');
  }

  isSelfCompatible(_ind: FaIndividual): boolean {
    return true;
  }

  canPollinate(ind: FaIndividual): boolean {
    return ind.fertility > 0.001 && !this.isMaleSterile(ind);
  }

  /** Pour croiser, on retire les étamines de la fleur mère avant l’ouverture, sauf si elle est femelle. */
  needsEmasculation(ind: FaIndividual): boolean {
    return !this.isMaleSterile(ind);
  }

  /** Croisements naturels au jardin : le fraisier cultivé s’autoféconde surtout ; les femelles, toujours croisées. */
  outcrossingRate(ind: FaIndividual): number {
    if (!this.canPollinate(ind)) return 1;
    return ind.species === 'vesca' ? 0.1 : 0.3;
  }

  crossCheck(a: FaIndividual, b: FaIndividual): CrossCheck {
    const selfing = a.id === b.id || (a.clonedFromId ?? a.id) === (b.clonedFromId ?? b.id);
    const compat = selfing ? { level: 'related' as CrossLevel, seedSet: 1, hybridFertility: 1, reason: 'selfInbreeding', uncertain: undefined } : speciesCompat(a.species, b.species);
    const base = { uncertain: compat.uncertain, f1Fertility: compat.hybridFertility };
    if (a.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...base, level: 'blocked', seedSet: 0, reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (this.isMaleSterile(b)) return { ...base, level: 'blocked', seedSet: 0, reason: 'femaleFather', sterileParent: 'b', effectiveSeedSet: 0 };
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

  cross(a: FaIndividual, b: FaIndividual, n: number, labelPrefix?: string): FaIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id || (a.clonedFromId ?? a.id) === (b.clonedFromId ?? b.id);
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const interploid = check.f1Fertility < 1;
    const out: FaIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (check.effectiveSeedSet < 1 && this.rng() > check.effectiveSeedSet) continue;
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as FaGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as FaIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const t = this.traits[trait];
        haps[trait] = [t.gamete(a.haps[trait][0], a.haps[trait][1], this.rng), t.gamete(b.haps[trait][0], b.haps[trait][1], this.rng)];
      }
      const fertility = interploid ? check.f1Fertility : parentsFert >= 0.999 ? 1 : Math.min(1, parentsFert + (1 - parentsFert) * 0.35);
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
          cyto: 'N',
        })
      );
    }
    return out;
  }

  // --- Lecture du génotype ----------------------------------------------------

  expressedAllele(g: FaGenotype, locus: FaLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: FaGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete || def.silent) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: FaGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: FaGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  /** Remontant : PFRU chez les octoploïdes, sfl/sfl chez le fraisier des bois. */
  isEverbearing(g: FaGenotype, species: SpeciesId): boolean {
    return species === 'vesca' ? this.has(g, 'sfl') : this.has(g, 'PFRU');
  }

  genotypeFromVariants(variants: readonly VariantId[]): FaGenotype {
    const g = {} as FaGenotype;
    for (const locus of FA_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: FaIndividual): FaIndividual {
    const missingLoci = FA_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: FaIndividual = { ...ind, crop: 'fraise', fertility: ind.fertility ?? 1, cyto: 'N' };
    if (!missingLoci.length && !missingTraits.length && ind.pheno.fruits !== undefined) return base;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) haps[t] = this.outbredHaps(t, 0.5);
    return { ...base, genotype, haps, pheno: { ...this.computePhenotype(genotype, haps, ind.species), ...ind.pheno } };
  }

  appearance(ind: FaIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.species, ind.fertility);
  }

  appearanceFromVariety(v: Pick<FaVariety, 'variants' | 'species' | 'het' | 'fertility'>): FruitAppearance {
    return this.appearanceOf(this.genotypeFromVariety(v), v.species, v.fertility ?? 1);
  }

  appearanceOf(g: FaGenotype, sp: SpeciesId, fertility = 1): FruitAppearance {
    const has = (id: VariantId) => this.has(g, id);
    const pale = has('myb10');
    const female = sp !== 'ananassa' && sp !== 'vesca' && has('F');
    return {
      color: pale ? (sp === 'vesca' ? 'yellow' : 'white') : 'red',
      everbearing: this.isEverbearing(g, sp),
      runnerless: sp === 'vesca' && has('r'),
      peach: has('FAD1'),
      caramel: has('OMT'),
      maleSterile: female,
      sterility: female ? 'female' : null,
      sterileHybrid: fertility <= 0.001,
      species: sp,
      cyto: 'N',
    };
  }

  habit(ind: FaIndividual): Habit {
    return this.isEverbearing(ind.genotype, ind.species) ? 'everbearing' : 'juneBearing';
  }

  resistances(ind: FaIndividual): VariantId[] {
    return (['Rpf1', 'RCa1', 'FW1', 'Pm'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  /** Code des résistances (« Pf · Ca · Fo · Pa »). */
  resistanceCode(ind: FaIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    if (r.has('Rpf1')) parts.push('Pf');
    if (r.has('RCa1')) parts.push('Ca');
    if (r.has('FW1')) parts.push('Fof');
    if (r.has('Pm')) parts.push('Pa');
    return parts.join(' · ');
  }

  sizeClass(ind: FaIndividual): SizeClass {
    return sizeClassOf(ind.pheno.weightG);
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: FaIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: FaIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: FaIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  /** Lignée fixée (se ressème fidèlement) : utile surtout pour le fraisier des bois. */
  isFixed(ind: FaIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: FaIndividual): FaLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  predict(a: FaIndividual, b: FaIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    for (const def of VISIBLE_LOCI) {
      if (def.id === 'sdr' && a.species === 'ananassa') continue;
      const pa = a.genotype[def.id];
      const pb = b.genotype[def.id];
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!pa.includes(al.allele) && !pb.includes(al.allele)) continue;
        let p = 0;
        for (const x of pa)
          for (const y of pb) {
            const g = { ...a.genotype, [def.id]: [x, y] } as FaGenotype;
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

  hetLabel(id: VariantId): string {
    const [locus, allele] = VARIANT_ALLELE[id];
    return `${allele}/${LOCUS_BY_ID[locus].standard}`;
  }

  genotypeCode(ind: FaIndividual): string {
    const parts: string[] = [];
    for (const def of FA_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.join(' ') || '+';
  }
}
