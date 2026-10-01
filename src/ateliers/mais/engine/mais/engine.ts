/**
 * Moteur de croisement du maïs, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques du maïs (Zea mays) :
 *  - plante MONOÏQUE : panicule mâle au sommet, épi femelle à mi-hauteur ;
 *    pollinisation par le vent, croisement naturel quasi total. Pour un
 *    croisement contrôlé : on ensache l’épi avant la sortie des soies et la
 *    panicule du père, puis on verse le pollen sur les soies ;
 *  - XÉNIE : la couleur et la texture des grains (aleurone, albumen)
 *    dépendent du génotype du GRAIN, donc du père : la ségrégation se voit
 *    sur l’épi récolté, la saison même du croisement. Le PÉRICARPE, lui, est
 *    un tissu de la mère (P1) ;
 *  - VIGUEUR HYBRIDE ET DÉPRESSION DE CONSANGUINITÉ : le maïs est la plante
 *    de l’hétérosis. Une lignée fixée (autofécondée) est chétive ; le
 *    croisement de deux lignées éloignées donne un hybride F1 vigoureux ;
 *  - STÉRILITÉ MÂLE CYTOPLASMIQUE T (CMS-T) : transmise par la mère,
 *    restaurée par Rf1 ; elle rend le maïs très sensible à
 *    l’helminthosporiose race T (épidémie américaine de 1970) ;
 *  - BARRIÈRE Ga1-s : les soies des pop-corns Ga1-s rejettent le pollen ga1 ;
 *  - P1-vv : allèle instable (transposon Ac) qui redevient P1-rr à ~1 % ;
 *  - TÉOSINTES : parents sauvages ; tb1 et tga1, gènes de la domestication.
 *
 * Traits quantitatifs : longueur d’épi, poids de 100 grains, épis par
 * plante, jours jusqu’à la maturité du grain, hauteur.
 */

import { PolygenicTrait, countAllele, gameteAllele, gaussian, isHomozygous, makeIdGenerator, mulberry32, type Diploid, type Rng } from '../core';
import { speciesCompat, type CrossCompat } from './compat';
import { LOCUS_BY_ID, LOCUS_IDS, MZ_LOCI, VARIANT_ALLELE, type MzLocusId, type SpeciesId, type VariantId } from './loci';
import type { MzVariety } from './varieties';

export type QuantTraitId = 'earLength' | 'kernel' | 'ears' | 'days' | 'height';
export const QUANT_TRAITS: QuantTraitId[] = ['earLength', 'kernel', 'ears', 'days', 'height'];
/** Traits affichés sur les cartes (les autres sur la fiche). */
export const MAIN_TRAITS: QuantTraitId[] = ['earLength', 'kernel', 'days', 'height'];

const POLY_LOCI: Record<QuantTraitId, number> = { earLength: 20, kernel: 18, ears: 12, days: 14, height: 14 };
const TOTAL_POLY_LOCI = Object.values(POLY_LOCI).reduce((a, b) => a + b, 0);

export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  /** Longueur de l’épi (cm) : 3 cm (épi de téosinte) à 35 cm. */
  earLength: { min: 3, max: 45, log: true, noise: 0.012, digits: 0 },
  /** Poids de 100 grains (g). */
  kernel: { min: 4, max: 70, log: true, noise: 0.012, digits: 0 },
  /** Épis (ou épillets femelles) par plante. */
  ears: { min: 1, max: 40, log: true, noise: 0.02, digits: 0 },
  /** Jours du semis à la maturité du grain. */
  days: { min: 60, max: 170, noise: 0.02, digits: 0 },
  /** Hauteur de la plante (cm). */
  height: { min: 50, max: 520, log: true, noise: 0.015, digits: 0 },
};

export const PHENO_KEY: Record<QuantTraitId, keyof MzPhenotype> = {
  earLength: 'earCm',
  kernel: 'kernel100',
  ears: 'ears',
  days: 'days',
  height: 'heightCm',
};

/** Vigueur d’une lignée totalement consanguine (fraction de la vigueur pleine). */
export const INBRED_VIGOR = 0.6;
/** Hétérozygotie (polygènes) à partir de laquelle la vigueur est pleine. */
const HET_FULL = 0.4;
/** Pléiotropies. */
const DWARF_HEIGHT = 0.3;
const DWARF_EAR = 0.6;
const BRACHYTIC_HEIGHT = 0.6;
const BRANCHED_EARS = 3;
const BRANCHED_EAR_LENGTH = 0.45;
/** Grains par cm d’épi (rangs × grains par cm de rang). */
export const KERNELS_PER_CM: Record<SpeciesId, number> = { mays: 32, parviglumis: 1.2, mexicana: 1.3, diploperennis: 1, tripsacum: 1.5 };
/** Taux de réversion de P1-vv en P1-rr par gamète (excision d’Ac). */
export const PVV_REVERSION = 0.01;
/** Part du pollen ga1 accepté par des soies Ga1-s. */
export const GA1S_LEAK = 0.03;

export type Cytoplasm = 'N' | 'T';
export type MzGenotype = Record<MzLocusId, Diploid<string>>;

export interface MzPhenotype {
  earCm: number;
  kernel100: number;
  ears: number;
  days: number;
  heightCm: number;
}

export interface MzIndividual {
  crop: 'mais';
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
  genotype: MzGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: MzPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  clonedFromId?: string;
  journal?: MzJournalEntry[];
}

export type MzStage = 'sowing' | 'emergence' | 'leaves' | 'tasseling' | 'silking' | 'pollination' | 'milk' | 'dent' | 'harvest' | 'seeds';
export const MZ_STAGES: MzStage[] = ['sowing', 'emergence', 'leaves', 'tasseling', 'silking', 'pollination', 'milk', 'dent', 'harvest', 'seeds'];

export interface MzJournalEntry {
  id: string;
  date: number;
  stage?: MzStage;
  heightCm?: number;
  fruits?: number;
  harvestKg?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type Pericarp = 'none' | 'red' | 'variegated';
export type Aleurone = 'none' | 'purple' | 'red' | 'bronze';
export type Endosperm = 'yellow' | 'white';
export type Texture = 'normal' | 'sugary' | 'shrunken' | 'waxy' | 'opaque';
export const TEXTURES: Texture[] = ['normal', 'sugary', 'shrunken', 'waxy', 'opaque'];
/** Couleur vue de l’extérieur du grain. */
export type KernelColor = 'yellow' | 'white' | 'purple' | 'blue' | 'red' | 'bronze' | 'variegated';
export const KERNEL_COLORS: KernelColor[] = ['yellow', 'white', 'purple', 'blue', 'red', 'bronze', 'variegated'];
export type PlantColor = 'green' | 'sunred' | 'purple';
export type FruitCase = 'naked' | 'half' | 'encased';
export type SizeClass = 'mini' | 'small' | 'medium' | 'large' | 'giant';

export interface Kernel {
  pericarp: Pericarp;
  redCob: boolean;
  aleurone: Aleurone;
  endosperm: Endosperm;
  texture: Texture;
}

export interface FruitAppearance {
  kernel: Kernel;
  color: KernelColor;
  plant: PlantColor;
  dwarf: boolean;
  brachytic: boolean;
  branched: boolean;
  fruitCase: FruitCase;
  maleSterile: boolean;
  popBarrier: boolean;
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
  /** Barrière Ga1-s active (soies de la mère qui trient le pollen). */
  ga1s?: boolean;
}

export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

const LINKAGE_GROUPS: MzLocusId[][] = (() => {
  const m = new Map<number, MzLocusId[]>();
  for (const l of MZ_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: MzLocusId[] = MZ_LOCI.filter((l) => !l.chromosome).map((l) => l.id);

export function sizeClassOf(earCm: number): SizeClass {
  return earCm < 8 ? 'mini' : earCm < 14 ? 'small' : earCm < 20 ? 'medium' : earCm < 26 ? 'large' : 'giant';
}

/** Couleur visible d’un grain : péricarpe d’abord, puis aleurone, puis albumen. */
export function kernelColor(k: Kernel): KernelColor {
  if (k.pericarp === 'red') return 'red';
  if (k.pericarp === 'variegated') return 'variegated';
  if (k.aleurone === 'purple') return k.endosperm === 'white' ? 'blue' : 'purple';
  if (k.aleurone === 'red') return 'red';
  if (k.aleurone === 'bronze') return 'bronze';
  return k.endosperm;
}

export function vigorOf(het: number): number {
  return INBRED_VIGOR + (1 - INBRED_VIGOR) * Math.min(1, Math.pow(het / HET_FULL, 0.7));
}

export class MzEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('MAI');

  constructor(seed = 20261001) {
    const traitRng = mulberry32(seed + 31);
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

  unitOf(trait: QuantTraitId, ind: MzIndividual): number {
    return this.unitOfValue(trait, ind.pheno[PHENO_KEY[trait]]);
  }

  /** Grains par épi. */
  kernelsPerEar(ind: MzIndividual): number {
    return Math.max(1, Math.round(ind.pheno.earCm * KERNELS_PER_CM[ind.species]));
  }

  /** Grain sec par plante (kg). */
  yieldKg(ind: MzIndividual): number {
    const g = ind.pheno.ears * this.kernelsPerEar(ind) * (ind.pheno.kernel100 / 100);
    return Math.round(g) / 1000;
  }

  /** Vigueur (1 = pleine ; INBRED_VIGOR = lignée consanguine). */
  vigor(ind: MzIndividual): number {
    return vigorOf(this.polygenicHeterozygosity(ind.haps));
  }

  // --- Construction ----------------------------------------------------------

  /** Facteurs de pléiotropie et de vigueur appliqués aux valeurs « génétiques ». */
  private factors(genotype: MzGenotype, f: number) {
    const dwarf = this.has(genotype, 'd1');
    const brach = this.has(genotype, 'br2');
    const branched = this.has(genotype, 'tbT');
    return {
      earLength: f * (dwarf ? DWARF_EAR : 1) * (branched ? BRANCHED_EAR_LENGTH : 1),
      kernel: 0.7 + 0.3 * f,
      ears: branched ? BRANCHED_EARS : 1,
      days: 1,
      height: (0.5 + 0.5 * f) * (dwarf ? DWARF_HEIGHT : 1) * (brach ? BRACHYTIC_HEIGHT : 1),
    } as Record<QuantTraitId, number>;
  }

  private computePhenotype(genotype: MzGenotype, haps: MzIndividual['haps']): MzPhenotype {
    const value = (trait: QuantTraitId) => this.traits[trait].score(haps[trait][0], haps[trait][1]) + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    const fac = this.factors(genotype, vigorOf(this.polygenicHeterozygosity(haps)));
    const v = (t: QuantTraitId, digits = 0) => {
      const x = this.fromUnit(t, value(t)) * fac[t];
      const k = 10 ** digits;
      return Math.round(x * k) / k;
    };
    return {
      earCm: Math.max(2, v('earLength')),
      kernel100: Math.max(3, v('kernel')),
      ears: Math.max(1, v('ears')),
      days: v('days'),
      heightCm: Math.max(30, v('height')),
    };
  }

  private build(
    genotype: MzGenotype,
    haps: MzIndividual['haps'],
    meta: Pick<MzIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'species' | 'fertility' | 'cyto'> &
      Partial<Pick<MzIndividual, 'varietyId' | 'hybridWith' | 'hybridFounder'>>
  ): MzIndividual {
    return { crop: 'mais', id: this.ids.next(), ...meta, genotype, haps, pheno: this.computePhenotype(genotype, haps), createdAt: Date.now() };
  }

  /** Valeurs « génétiques » cibles d’une variété (pléiotropie et vigueur dépliées). */
  varietyTargets(v: MzVariety): Record<QuantTraitId, number> {
    const g = this.genotypeFromVariants(v.variants);
    const fac = this.factors(g, v.inbred ? INBRED_VIGOR : 1);
    return {
      earLength: v.earCm / fac.earLength,
      kernel: v.kernel100 / fac.kernel,
      ears: v.ears / fac.ears,
      days: v.days,
      height: v.heightCm / fac.height,
    };
  }

  createFromVariety(v: MzVariety, label?: string): MzIndividual {
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
    if (v.haps) {
      const haps = {} as MzIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, meta);
    }
    const targets = this.varietyTargets(v);
    const haps = {} as MzIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const u = this.toUnit(trait, targets[trait]);
      if (v.inbred) {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      } else {
        // Population ou hybride : deux haplotypes de même valeur mais très différents (hétérozygote).
        haps[trait] = this.heteroPair(trait, u);
      }
    }
    return this.build(genotype, haps, { ...meta, hybridFounder: v.hybrid || undefined });
  }

  /** Deux haplotypes de score voisin de `u`, le plus hétérozygotes possible. */
  private heteroPair(trait: QuantTraitId, u: number): [number[], number[]] {
    const t = this.traits[trait];
    const h1 = t.haplotypeForTarget(u, this.rng);
    const h2 = [...h1];
    const on = h1.map((x, i) => (x ? i : -1)).filter((i) => i >= 0).sort(() => this.rng() - 0.5);
    const off = h1.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0).sort(() => this.rng() - 0.5);
    // Échange locus « + » ↔ locus « 0 » d’effets proches : même valeur, hétérozygotie maximale.
    const used = new Set<number>();
    for (const i of on) {
      let best = -1;
      for (const j of off) if (!used.has(j) && (best < 0 || Math.abs(t.effects[j] - t.effects[i]) < Math.abs(t.effects[best] - t.effects[i]))) best = j;
      if (best < 0) break;
      used.add(best);
      h2[i] = 0;
      h2[best] = 1;
    }
    // Ajustement fin : la valeur du couple doit rester celle visée.
    const order = h2.map((_, i) => i).sort(() => this.rng() - 0.5);
    let cur = t.score(h1, h2);
    for (let pass = 0; pass < 3; pass++) {
      for (const i of order) {
        h2[i] = 1 - h2[i];
        const next = t.score(h1, h2);
        if (Math.abs(next - u) < Math.abs(cur - u)) cur = next;
        else h2[i] = 1 - h2[i];
      }
    }
    return [h1, h2];
  }

  createCustom(opts: { label: string; species: SpeciesId; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>>; cyto?: Cytoplasm }): MzIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as MzIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false, species: opts.species, fertility: 1, cyto: opts.cyto ?? 'N' });
  }

  /** Bouture : impossible chez le maïs (annuel sans multiplication végétative). */
  canClone(ind: MzIndividual): boolean {
    return ind.species === 'diploperennis' || ind.species === 'tripsacum';
  }

  /** Éclat de souche (espèces vivaces seulement) : copie génétique exacte. */
  cloneOf(ind: MzIndividual, label?: string): MzIndividual {
    const haps = {} as MzIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as MzGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (éclat)`,
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

  fixedVariants(ind: MzIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of MZ_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      const a = def.alleles.find((x) => x.allele === pair[0]);
      if (a?.id) out.push(a.id);
    }
    return out;
  }

  gamete(ind: MzIndividual): Record<MzLocusId, string> {
    const g = {} as Record<MzLocusId, string>;
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
    // P1-vv : l’élément Ac s’excise parfois → allèle P1-rr restauré.
    if (g.p1 === 'Pvv' && this.rng() < PVV_REVERSION) g.p1 = 'Prr';
    return g;
  }

  // --- Fleurs et barrières de croisement -------------------------------------

  /** Stérilité mâle cytoplasmique : cytoplasme T sans restaurateur Rf1. */
  isMaleSterile(ind: MzIndividual): boolean {
    return ind.cyto === 'T' && !this.has(ind.genotype, 'Rf1');
  }

  canPollinate(ind: MzIndividual): boolean {
    return ind.fertility > 0.001 && !this.isMaleSterile(ind);
  }

  /** Jamais de castration de fleur : on ensache l’épi (au champ, on castre les panicules). */
  needsEmasculation(_ind: MzIndividual): boolean {
    return false;
  }

  /** Part des grains issus d’un autre plant au champ (pollinisation par le vent). */
  outcrossingRate(ind: MzIndividual): number {
    if (!this.canPollinate(ind)) return 1;
    return ind.species === 'tripsacum' ? 0.6 : 0.95;
  }

  /** Part du pollen du père acceptée par les soies de la mère (Ga1-s). */
  pollenAcceptance(a: MzIndividual, b: MzIndividual): number {
    if (!this.has(a.genotype, 'Ga1S')) return 1;
    const dose = this.dose(b.genotype, 'Ga1S');
    return dose / 2 + (1 - dose / 2) * GA1S_LEAK;
  }

  crossCheck(a: MzIndividual, b: MzIndividual): CrossCheck {
    const compat = speciesCompat(a.species, b.species);
    if (a.fertility <= 0.001) return { ...compat, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'a', effectiveSeedSet: 0 };
    if (b.fertility <= 0.001) return { ...compat, level: 'blocked', reason: 'sterileHybrid', sterileParent: 'b', effectiveSeedSet: 0 };
    if (this.isMaleSterile(b)) return { ...compat, level: 'blocked', reason: 'cmsFather', sterileParent: 'b', effectiveSeedSet: 0 };
    if (compat.level === 'blocked') return { ...compat, effectiveSeedSet: 0 };
    const acc = this.pollenAcceptance(a, b);
    const effectiveSeedSet = compat.seedSet * Math.sqrt(a.fertility * b.fertility) * acc;
    let level = compat.level;
    let reason = compat.reason;
    if (acc < 0.2) {
      level = 'difficult';
      reason = 'ga1s';
    } else if (level === 'same' && effectiveSeedSet < 0.999) {
      level = 'difficult';
      reason = acc < 1 ? 'ga1sHet' : 'lowFertility';
    }
    return { ...compat, level, reason, effectiveSeedSet, ga1s: acc < 1 };
  }

  cross(a: MzIndividual, b: MzIndividual, n: number, labelPrefix?: string): MzIndividual[] {
    const check = this.crossCheck(a, b);
    if (check.level === 'blocked') return [];
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const interspecific = a.species !== b.species;
    const hybridWith = interspecific ? b.species : a.hybridWith ?? b.hybridWith;
    const parentsFert = Math.sqrt(a.fertility * b.fertility);
    const fertility = interspecific ? check.f1Fertility : parentsFert >= 0.999 ? 1 : Math.min(1, parentsFert + (1 - parentsFert) * 0.35);
    const filter = this.has(a.genotype, 'Ga1S');
    const baseSet = check.effectiveSeedSet / (check.ga1s ? this.pollenAcceptance(a, b) : 1);
    const out: MzIndividual[] = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (baseSet < 1 && this.rng() > baseSet) continue;
      const gb = this.gamete(b);
      // Soies Ga1-s : le pollen ga1 est presque toujours rejeté.
      if (filter && gb.ga1 !== 'Ga1S' && this.rng() > GA1S_LEAK) continue;
      const ga = this.gamete(a);
      const genotype = {} as MzGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as MzIndividual['haps'];
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

  expressedAllele(g: MzGenotype, locus: MzLocusId): string {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    for (const a of def.alleles) if (pair.includes(a.allele)) return a.allele;
    return pair[0];
  }

  has(g: MzGenotype, id: VariantId): boolean {
    const [locus, allele] = VARIANT_ALLELE[id];
    const def = LOCUS_BY_ID[locus];
    if (def.incomplete) return countAllele(g[locus], allele) >= 1;
    return this.expressedAllele(g, locus) === allele;
  }

  dose(g: MzGenotype, id: VariantId): number {
    const [locus, allele] = VARIANT_ALLELE[id];
    return countAllele(g[locus], allele);
  }

  isCarrier(g: MzGenotype, id: VariantId): boolean {
    return this.dose(g, id) === 1 && !this.has(g, id);
  }

  genotypeFromVariants(variants: readonly VariantId[]): MzGenotype {
    const g = {} as MzGenotype;
    for (const locus of MZ_LOCI) g[locus.id] = [locus.standard, locus.standard];
    for (const v of variants) {
      const pair = VARIANT_ALLELE[v];
      if (!pair) continue;
      const [locus, allele] = pair;
      if (g[locus][0] === LOCUS_BY_ID[locus].standard) g[locus] = [allele, allele];
    }
    return g;
  }

  normalize(ind: MzIndividual): MzIndividual {
    const missingLoci = MZ_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    const base: MzIndividual = { ...ind, crop: 'mais', fertility: ind.fertility ?? 1, cyto: ind.cyto ?? 'N' };
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

  /** Grain porté par une mère `mother` (péricarpe) et de génotype `seed` (xénie). */
  kernelOf(mother: MzGenotype, seed: MzGenotype): Kernel {
    const has = (g: MzGenotype, id: VariantId) => this.has(g, id);
    const pAllele = this.expressedAllele(mother, 'p1');
    const pericarp: Pericarp = pAllele === 'Prr' ? 'red' : pAllele === 'Pvv' ? 'variegated' : 'none';
    const redCob = pAllele !== 'Pww';
    const colored = !has(seed, 'CI') && !has(seed, 'c1') && !has(seed, 'a1') && has(seed, 'R1');
    const aleurone: Aleurone = !colored ? 'none' : has(seed, 'bz1') ? 'bronze' : has(seed, 'pr1') ? 'red' : 'purple';
    const endosperm: Endosperm = has(seed, 'y1') ? 'white' : 'yellow';
    const texture: Texture = has(seed, 'sh2') ? 'shrunken' : has(seed, 'su1') ? 'sugary' : has(seed, 'wx1') ? 'waxy' : has(seed, 'o2') ? 'opaque' : 'normal';
    return { pericarp, redCob, aleurone, endosperm, texture };
  }

  /**
   * Épi d’échantillon (sans créer de plantes) : grains d’une mère pollinisée
   * par un père, tirés avec un générateur déterministe (pour les portraits).
   */
  sampleEar(mother: MzIndividual, father: MzIndividual, n: number, seed: number): Kernel[] {
    const saved = this.rng;
    this.rng = mulberry32(seed);
    try {
      const out: Kernel[] = [];
      for (let i = 0; i < n; i++) {
        const ga = this.gamete(mother);
        const gb = this.gamete(father);
        const g = {} as MzGenotype;
        for (const id of LOCUS_IDS) g[id] = [ga[id], gb[id]];
        out.push(this.kernelOf(mother.genotype, g));
      }
      return out;
    } finally {
      this.rng = saved;
    }
  }

  appearance(ind: MzIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.species, ind.cyto);
  }

  appearanceFromVariety(v: Pick<MzVariety, 'variants' | 'species' | 'cyto' | 'het'>): FruitAppearance {
    const g = this.genotypeFromVariants(v.variants);
    for (const h of v.het ?? []) {
      const [locus, allele] = VARIANT_ALLELE[h];
      g[locus] = [allele, LOCUS_BY_ID[locus].standard];
    }
    return this.appearanceOf(g, v.species, v.cyto ?? 'N');
  }

  /** Aspect de la plante et de ses grains (épi autofécondé « type »). */
  appearanceOf(g: MzGenotype, sp: SpeciesId, cyto: Cytoplasm = 'N'): FruitAppearance {
    const kernel = this.kernelOf(g, g);
    const B = this.has(g, 'B1');
    const tga = this.dose(g, 'TgaT');
    return {
      kernel,
      color: kernelColor(kernel),
      plant: B ? (this.has(g, 'Pl1') ? 'purple' : 'sunred') : 'green',
      dwarf: this.has(g, 'd1'),
      brachytic: this.has(g, 'br2'),
      branched: this.has(g, 'tbT'),
      fruitCase: tga === 2 ? 'encased' : tga === 1 ? 'half' : 'naked',
      maleSterile: cyto === 'T' && !this.has(g, 'Rf1'),
      popBarrier: this.has(g, 'Ga1S'),
      species: sp,
      cyto,
    };
  }

  resistances(ind: MzIndividual): VariantId[] {
    return (['Ht1', 'Rp1'] as VariantId[]).filter((id) => this.has(ind.genotype, id));
  }

  /** Code catalogue (« Et:0 · Ps »). */
  resistanceCode(ind: MzIndividual): string {
    const r = new Set(this.resistances(ind));
    const parts: string[] = [];
    if (r.has('Ht1')) parts.push('Et:0');
    if (r.has('Rp1')) parts.push('Ps');
    return parts.join(' · ');
  }

  sizeClass(ind: MzIndividual): SizeClass {
    return sizeClassOf(ind.pheno.earCm);
  }

  // --- Fixation ------------------------------------------------------------

  mendelianHeterozygosity(ind: MzIndividual): number {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: MzIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  heterozygosity(ind: MzIndividual): number {
    const nM = LOCUS_IDS.length;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * TOTAL_POLY_LOCI) / (nM + TOTAL_POLY_LOCI);
  }

  isFixed(ind: MzIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  segregatingLoci(ind: MzIndividual): MzLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ------------------------------------------------

  predict(a: MzIndividual, b: MzIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    for (const def of MZ_LOCI) {
      const pa = a.genotype[def.id];
      const pb = b.genotype[def.id];
      for (const al of def.alleles) {
        if (!al.id) continue;
        if (!pa.includes(al.allele) && !pb.includes(al.allele)) continue;
        let p = 0;
        for (const x of pa)
          for (const y of pb) {
            const g = { ...a.genotype, [def.id]: [x, y] } as MzGenotype;
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

  genotypeCode(ind: MzIndividual): string {
    const parts: string[] = [];
    for (const def of MZ_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const rank = (x: string) => def.alleles.findIndex((a) => a.allele === x);
      const ordered = [...pair].sort((x, y) => rank(x) - rank(y));
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    const code = parts.length ? parts.join(' ') : '+';
    return ind.cyto === 'T' ? `[T] ${code}` : code;
  }
}
