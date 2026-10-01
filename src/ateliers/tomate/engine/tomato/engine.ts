/**
 * Moteur de croisement de la tomate, bâti sur le noyau commun (../core).
 *
 * Particularités biologiques de la tomate :
 *  - Plante HERMAPHRODITE et AUTOGAME : pas de sexe, et une plante peut
 *    être autofécondée (`cross(a, a)`). C'est la voie normale pour fixer une
 *    lignée : l'hétérozygotie est divisée par deux à chaque génération.
 *  - Les variétés anciennes (OP) sont des lignées quasi pures : un
 *    fondateur planté depuis la bibliothèque est homozygote partout. Les
 *    hybrides F1 du commerce, eux, sont hétérozygotes (génotype hypothétique,
 *    voir `createFromVariety`) : leurs graines ségrègent.
 *  - LIAISON GÉNÉTIQUE : les loci d'un même chromosome sont transmis en
 *    bloc, avec crossing-over selon la fonction de Kosambi (positions en cM
 *    approximatives, voir loci.ts). La PHASE compte : `genotype[locus][0]`
 *    est toujours l'allèle du chromosome hérité du premier parent.
 *  - Faible dépression de consanguinité, mais une hétérosis modeste sur le
 *    rendement des F1 (bonus proportionnel à l'hétérozygotie polygénique,
 *    jusqu'à +20 %).
 *
 * Traits quantitatifs (10 loci additifs chacun, phénotype = valeur
 * génétique + bruit environnemental, tiré UNE fois à la naissance) :
 * poids du fruit, °Brix, précocité, rendement, acidité, résistance à
 * l'éclatement, durée de conservation, nouaison à la chaleur, tolérance au
 * froid.
 */

import {
  PolygenicTrait,
  countAllele,
  gameteAllele,
  gaussian,
  isHomozygous,
  makeIdGenerator,
  mulberry32,
  type Diploid,
  type Rng,
} from '../core';
import { EXTRA_ALLELES, LOCUS_BY_ID, LOCUS_IDS, TOMATO_LOCI, type TomatoLocusId, type VariantId } from './loci';
import type { TomatoVariety } from './varieties';

export type QuantTraitId = 'weight' | 'brix' | 'days' | 'yield' | 'acidity' | 'crack' | 'shelf' | 'heat' | 'cold';
export const QUANT_TRAITS: QuantTraitId[] = ['weight', 'brix', 'days', 'yield', 'acidity', 'crack', 'shelf', 'heat', 'cold'];
/** Les quatre traits affichés sur les cartes (les autres sur la fiche). */
export const MAIN_TRAITS: QuantTraitId[] = ['weight', 'brix', 'days', 'yield'];

const N_POLY_LOCI = 10;

/** Bornes et bruit environnemental de chaque trait (sur l'échelle 0–1).
 * Le bruit reflète l'héritabilité : forte pour le poids du fruit, faible
 * pour le rendement et l'éclatement, très dépendants des conditions. */
export const TRAIT_SCALE: Record<QuantTraitId, { min: number; max: number; log?: boolean; noise: number; digits: number }> = {
  weight: { min: 5, max: 800, log: true, noise: 0.035, digits: 0 },
  brix: { min: 3.5, max: 10, noise: 0.06, digits: 1 },
  days: { min: 45, max: 100, noise: 0.045, digits: 0 },
  yield: { min: 1, max: 8, noise: 0.09, digits: 1 },
  /** Acidité titrable (% d'acide citrique du jus). */
  acidity: { min: 0.25, max: 0.9, noise: 0.06, digits: 2 },
  /** Résistance à l'éclatement (%). */
  crack: { min: 0, max: 100, noise: 0.08, digits: 0 },
  /** Conservation après récolte, à température ambiante (jours). */
  shelf: { min: 5, max: 60, noise: 0.06, digits: 0 },
  /** Nouaison sous forte chaleur (> 32 °C le jour) (%). */
  heat: { min: 0, max: 100, noise: 0.07, digits: 0 },
  /** Tolérance au froid : croissance et nouaison sous 10–13 °C (%). */
  cold: { min: 0, max: 100, noise: 0.07, digits: 0 },
};

/** Clé du phénotype pour chaque trait. */
export const PHENO_KEY: Record<QuantTraitId, keyof TomatoPhenotype> = {
  weight: 'weightG',
  brix: 'brix',
  days: 'days',
  yield: 'yieldKg',
  acidity: 'acidity',
  crack: 'crack',
  shelf: 'shelfDays',
  heat: 'heat',
  cold: 'cold',
};

/** Effet de u/u sur le °Brix (réduction des sucres, Powell et al. 2012). */
const UNIFORM_RIPENING_BRIX_PENALTY = 0.4;
/** Jours de conservation ajoutés par alc/alc (NOR alcobaca). */
const ALC_SHELF_BONUS = 45;
/** Bonus de rendement maximal d'un individu totalement hétérozygote. */
const MAX_HETEROSIS = 0.2;

export type TomatoGenotype = Record<TomatoLocusId, Diploid<string>>;

export interface TomatoPhenotype {
  weightG: number;
  brix: number;
  days: number;
  yieldKg: number;
  acidity: number;
  crack: number;
  shelfDays: number;
  heat: number;
  cold: number;
}

export interface TomatoIndividual {
  species: 'tomato';
  id: string;
  label: string;
  generation: number;
  parentIds: [string, string] | null;
  /** true si issu d'une autofécondation (les deux parents = la même plante). */
  selfed: boolean;
  varietyId?: string;
  /** Fondateur issu d'un hybride F1 du commerce (génotype hypothétique). */
  hybridFounder?: boolean;
  genotype: TomatoGenotype;
  haps: Record<QuantTraitId, [number[], number[]]>;
  pheno: TomatoPhenotype;
  createdAt: number;
  notes?: string;
  archived?: boolean;
  /** Bouture (gourmand enraciné) : id de la plante mère. Même génotype,
   * même génération ; seul le bruit environnemental du phénotype diffère. */
  clonedFromId?: string;
  /** Journal de culture daté (purement informatif, jamais lu par le moteur). */
  journal?: TomatoJournalEntry[];
}

export type TomatoStage = 'sowing' | 'emergence' | 'pricking' | 'planting' | 'flowering' | 'fruitset' | 'breaker' | 'harvest' | 'seeds';

export const TOMATO_STAGES: TomatoStage[] = ['sowing', 'emergence', 'pricking', 'planting', 'flowering', 'fruitset', 'breaker', 'harvest', 'seeds'];

export interface TomatoJournalEntry {
  id: string;
  date: number;
  stage?: TomatoStage;
  heightCm?: number;
  /** Récolte du jour : nombre de fruits et poids total (g). */
  fruits?: number;
  harvestG?: number;
  issues?: string;
  actions?: string;
  text: string;
}

// --- Phénotype qualitatif --------------------------------------------------

export type FleshColor = 'red' | 'crimson' | 'yellow' | 'bicolor' | 'orange' | 'black' | 'green';
export type SkinColor = 'yellow' | 'clear';
export type FruitShape = 'round' | 'ribbed' | 'heart' | 'oval' | 'pear' | 'elongated';
export type ColorKey = 'red' | 'crimson' | 'pink' | 'yellow' | 'cream' | 'bicolor' | 'orange' | 'black' | 'purple' | 'green';

export interface FruitAppearance {
  flesh: FleshColor;
  skin: SkinColor;
  /** Couleur perçue (clé de traduction `color.*`). */
  colorKey: ColorKey;
  striped: boolean;
  anthocyanin: 'none' | 'patches' | 'indigo';
  greenShoulder: boolean;
  /** Peau « pêche » duveteuse (p/p). */
  fuzzy: boolean;
  shape: FruitShape;
}

export interface TheoreticalRatio {
  locus: VariantId;
  /** Probabilité que l'allèle d'intérêt s'exprime chez un descendant. */
  pExpressed: number;
}

/** Loci regroupés par chromosome et triés par position (liaison). */
const LINKAGE_GROUPS: TomatoLocusId[][] = (() => {
  const m = new Map<number, TomatoLocusId[]>();
  for (const l of TOMATO_LOCI) {
    if (!l.chromosome) continue;
    if (!m.has(l.chromosome)) m.set(l.chromosome, []);
    m.get(l.chromosome)!.push(l.id);
  }
  return Array.from(m.values()).map((ids) => ids.sort((a, b) => LOCUS_BY_ID[a].cM - LOCUS_BY_ID[b].cM));
})();
const UNLINKED: TomatoLocusId[] = TOMATO_LOCI.filter((l) => !l.chromosome).map((l) => l.id);

/** Fréquence de recombinaison (Kosambi) pour une distance en cM. */
export function kosambi(cM: number): number {
  return 0.5 * Math.tanh((2 * cM) / 100);
}

export class TomatoEngine {
  private rng: Rng;
  readonly traits: Record<QuantTraitId, PolygenicTrait>;
  private ids = makeIdGenerator('TOM');

  /** Graine fixe par défaut : les effets alléliques doivent rester
   * identiques d'une session à l'autre pour qu'un catalogue rechargé
   * garde le même sens. */
  constructor(seed = 20260930) {
    const traitRng = mulberry32(seed);
    this.traits = {} as Record<QuantTraitId, PolygenicTrait>;
    for (const t of QUANT_TRAITS) this.traits[t] = new PolygenicTrait(N_POLY_LOCI, traitRng);
    this.rng = mulberry32(seed ^ Date.now());
  }

  ensureIdsAbove(ids: string[]) {
    this.ids.ensureAbove(ids);
  }

  // --- Échelles ------------------------------------------------------------

  private toUnit(trait: QuantTraitId, value: number): number {
    const s = TRAIT_SCALE[trait];
    if (s.log) return (Math.log(value) - Math.log(s.min)) / (Math.log(s.max) - Math.log(s.min));
    return (value - s.min) / (s.max - s.min);
  }

  private fromUnit(trait: QuantTraitId, unit: number): number {
    const s = TRAIT_SCALE[trait];
    const u = Math.max(0, Math.min(1, unit));
    const v = s.log ? Math.exp(Math.log(s.min) + u * (Math.log(s.max) - Math.log(s.min))) : s.min + u * (s.max - s.min);
    const k = 10 ** s.digits;
    return Math.round(v * k) / k;
  }

  /** Position 0–1 d'une valeur brute sur l'échelle d'un trait. */
  unitOfValue(trait: QuantTraitId, value: number): number {
    return Math.max(0, Math.min(1, this.toUnit(trait, value)));
  }

  /** Position 0–1 d'un phénotype sur l'échelle de son trait (jauges). */
  unitOf(trait: QuantTraitId, ind: TomatoIndividual): number {
    let v = ind.pheno[PHENO_KEY[trait]];
    if (trait === 'shelf') v = Math.min(v, TRAIT_SCALE.shelf.max);
    return Math.max(0, Math.min(1, this.toUnit(trait, v)));
  }

  // --- Construction des individus -----------------------------------------

  private computePhenotype(genotype: TomatoGenotype, haps: TomatoIndividual['haps']): TomatoPhenotype {
    const value = (trait: QuantTraitId) => {
      const g = this.traits[trait].score(haps[trait][0], haps[trait][1]);
      return g + gaussian(this.rng) * TRAIT_SCALE[trait].noise;
    };
    let brix = this.fromUnit('brix', value('brix'));
    if (this.expresses(genotype, 'u')) brix = Math.max(TRAIT_SCALE.brix.min, Math.round((brix - UNIFORM_RIPENING_BRIX_PENALTY) * 10) / 10);

    const het = this.polygenicHeterozygosity(haps);
    const rawYield = this.fromUnit('yield', value('yield'));
    const yieldKg = Math.round(rawYield * (1 + MAX_HETEROSIS * het) * 10) / 10;

    let shelfDays = this.fromUnit('shelf', value('shelf'));
    if (this.expresses(genotype, 'alc')) shelfDays += ALC_SHELF_BONUS;

    return {
      weightG: this.fromUnit('weight', value('weight')),
      brix,
      days: this.fromUnit('days', value('days')),
      yieldKg,
      acidity: this.fromUnit('acidity', value('acidity')),
      crack: this.fromUnit('crack', value('crack')),
      shelfDays,
      heat: this.fromUnit('heat', value('heat')),
      cold: this.fromUnit('cold', value('cold')),
    };
  }

  private build(
    genotype: TomatoGenotype,
    haps: TomatoIndividual['haps'],
    meta: Pick<TomatoIndividual, 'label' | 'generation' | 'parentIds' | 'selfed' | 'varietyId'> & { hybridFounder?: boolean }
  ): TomatoIndividual {
    return {
      species: 'tomato',
      id: this.ids.next(),
      ...meta,
      genotype,
      haps,
      pheno: this.computePhenotype(genotype, haps),
      createdAt: Date.now(),
    };
  }

  /** Valeurs cibles (unités réelles) d'une variété pour chaque trait : celles
   * de la fiche, sinon une estimation neutre déduite du type de fruit. */
  varietyTargets(v: TomatoVariety): Record<QuantTraitId, number> {
    const app = this.appearanceFromVariants(v.variants, v.weightG);
    const small = v.weightG < 30;
    const big = v.weightG >= 250;
    const early = v.days <= 62;
    return {
      weight: v.weightG,
      brix: v.variants.includes('u') ? v.brix + UNIFORM_RIPENING_BRIX_PENALTY : v.brix,
      days: v.days,
      yield: v.yieldKg,
      // Les chairs jaunes/blanches sont réputées « peu acides » ; les vertes plus vives.
      acidity:
        v.acidity ??
        (app.colorKey === 'yellow' || app.colorKey === 'cream' || app.colorKey === 'bicolor' ? 0.38 : app.colorKey === 'green' ? 0.62 : 0.5),
      // Les grosses côtelées éclatent volontiers, les prunes/allongées très peu.
      crack: v.crack ?? (big ? 30 : app.shape === 'elongated' || app.shape === 'oval' ? 70 : small ? 40 : 50),
      shelf: v.shelfDays ?? (app.shape === 'elongated' || app.shape === 'oval' ? 18 : big ? 9 : 14),
      heat: v.heat ?? (small ? 60 : big ? 35 : 45),
      cold: v.cold ?? (early ? 70 : 45),
    };
  }

  /** Fondateur à partir d'une variété de la bibliothèque. Variété OP →
   * homozygote partout ; hybride F1 → génotype hétérozygote plausible. */
  createFromVariety(v: TomatoVariety, label?: string): TomatoIndividual {
    const genotype = this.genotypeFromVariants(v.variants);
    const meta = { label: label || v.name, generation: 0, parentIds: null, selfed: false, varietyId: v.id };

    if (v.haps) {
      // Variété créée par l'utilisateur à partir d'une lignée fixée : on
      // rejoue exactement ses haplotypes (homozygotes) plutôt qu'une cible.
      const haps = {} as TomatoIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const h = v.haps[trait] ?? this.traits[trait].haplotypeForTarget(0.5, this.rng);
        haps[trait] = [[...h], [...h]];
      }
      return this.build(genotype, haps, meta);
    }

    const targets = this.varietyTargets(v);
    const haps = {} as TomatoIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      let tv = targets[trait];
      if (trait === 'yield' && v.hybrid) tv = tv / (1 + MAX_HETEROSIS * 0.5); // l'hétérosis ajoutera le reste
      const u = this.toUnit(trait, tv);
      if (v.hybrid) {
        // Deux parents différents : haplotypes distincts autour de la cible
        const a = this.traits[trait].haplotypeForTarget(u + 0.12, this.rng);
        const b = this.traits[trait].haplotypeForTarget(u - 0.12, this.rng);
        haps[trait] = [a, b];
      } else {
        const h = this.traits[trait].haplotypeForTarget(u, this.rng);
        haps[trait] = [h, [...h]];
      }
    }

    if (v.hybrid) {
      // Hypothèse plausible d'un F1 : les caractères récessifs visibles sont
      // homozygotes (sinon ils ne se verraient pas), les résistances sont le
      // plus souvent apportées par un seul parent (hétérozygotes), et des
      // récessifs de couleur/port peuvent être portés en silence.
      for (const def of TOMATO_LOCI) {
        const pair = genotype[def.id];
        if (def.category === 'resistance' && pair[0] === def.variant) {
          genotype[def.id] = this.rng() < 0.5 ? [def.variant, def.standard] : [def.standard, def.variant];
        } else if (!def.variantDominant && pair[0] === def.standard && ['y', 'gf', 'r', 't', 'sp', 'u', 'c'].includes(def.id)) {
          if (this.rng() < 0.2) genotype[def.id] = this.rng() < 0.5 ? [def.variant, def.standard] : [def.standard, def.variant];
        }
      }
      return this.build(genotype, haps, { ...meta, hybridFounder: true });
    }
    return this.build(genotype, haps, meta);
  }

  /** Fondateur personnalisé (lignée fixée) : on choisit les allèles
   * d'intérêt et la cible de chaque trait quantitatif (0–1). */
  createCustom(opts: { label: string; variants: VariantId[]; targets: Partial<Record<QuantTraitId, number>> }): TomatoIndividual {
    const genotype = this.genotypeFromVariants(opts.variants);
    const haps = {} as TomatoIndividual['haps'];
    for (const trait of QUANT_TRAITS) {
      const h = this.traits[trait].haplotypeForTarget(opts.targets[trait] ?? 0.5, this.rng);
      haps[trait] = [h, [...h]];
    }
    return this.build(genotype, haps, { label: opts.label, generation: 0, parentIds: null, selfed: false });
  }

  /** Bouture : copie génétique exacte (même génération, pas de méiose). */
  cloneOf(ind: TomatoIndividual, label?: string): TomatoIndividual {
    const haps = {} as TomatoIndividual['haps'];
    for (const trait of QUANT_TRAITS) haps[trait] = [[...ind.haps[trait][0]], [...ind.haps[trait][1]]];
    const genotype = {} as TomatoGenotype;
    for (const id of LOCUS_IDS) genotype[id] = [...ind.genotype[id]] as Diploid<string>;
    const clone = this.build(genotype, haps, {
      label: label || `${ind.label} (bouture)`,
      generation: ind.generation,
      parentIds: ind.parentIds,
      selfed: ind.selfed,
      varietyId: ind.varietyId,
      hybridFounder: ind.hybridFounder,
    });
    return { ...clone, clonedFromId: ind.id };
  }

  /** Allèles d'intérêt homozygotes d'un individu fixé (pour en faire une variété). */
  fixedVariants(ind: TomatoIndividual): VariantId[] | null {
    const out: VariantId[] = [];
    for (const def of TOMATO_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] !== pair[1]) return null;
      if (pair[0] === def.variant) out.push(def.id);
      else if (def.extra && pair[0] === def.extra.allele) out.push(def.extra.id);
    }
    return out;
  }

  /** Gamète d'un individu : un chromosome de chaque paire, avec
   * crossing-over entre loci liés (Kosambi). */
  gamete(ind: TomatoIndividual): Record<TomatoLocusId, string> {
    const g = {} as Record<TomatoLocusId, string>;
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

  /** Croisement (a × b) ou autofécondation (a × a). */
  cross(a: TomatoIndividual, b: TomatoIndividual, n: number, labelPrefix?: string): TomatoIndividual[] {
    const selfed = a.id === b.id;
    const generation = Math.max(a.generation, b.generation) + 1;
    const prefix = labelPrefix || (selfed ? `${a.label} ⊗` : `${a.label} × ${b.label}`);
    const out: TomatoIndividual[] = [];
    for (let k = 0; k < n; k++) {
      const ga = this.gamete(a);
      const gb = this.gamete(b);
      const genotype = {} as TomatoGenotype;
      for (const id of LOCUS_IDS) genotype[id] = [ga[id], gb[id]];
      const haps = {} as TomatoIndividual['haps'];
      for (const trait of QUANT_TRAITS) {
        const t = this.traits[trait];
        haps[trait] = [t.gamete(a.haps[trait][0], a.haps[trait][1], this.rng), t.gamete(b.haps[trait][0], b.haps[trait][1], this.rng)];
      }
      out.push(this.build(genotype, haps, { label: `${prefix} #${k + 1}`, generation, parentIds: [a.id, b.id], selfed }));
    }
    return out;
  }

  // --- Lecture du génotype ------------------------------------------------

  /** L'allèle d'intérêt du locus s'exprime-t-il ? Pour PSY1, « chair jaune »
   * = aucun allèle R et pas bic/bic (bic/r donne du jaune). */
  expresses(g: TomatoGenotype, locus: TomatoLocusId): boolean {
    const def = LOCUS_BY_ID[locus];
    const pair = g[locus];
    if (locus === 'r') return !pair.includes('R') && !(pair[0] === 'bic' && pair[1] === 'bic');
    const n = countAllele(pair, def.variant);
    return def.variantDominant ? n >= 1 : n === 2;
  }

  /** Expression d'un allèle d'intérêt quelconque (locus ou allèle supplémentaire). */
  expressesVariant(g: TomatoGenotype, id: VariantId): boolean {
    if (id === 'bic') return g.r[0] === 'bic' && g.r[1] === 'bic';
    if (id === 'og') return g.B[0] === 'og' && g.B[1] === 'og';
    return this.expresses(g, id);
  }

  /** Porteur masqué : possède un allèle récessif sans l'exprimer. */
  isCarrier(g: TomatoGenotype, locus: TomatoLocusId): boolean {
    const def = LOCUS_BY_ID[locus];
    if (def.variantDominant && !def.extra) return false;
    const pair = g[locus];
    const recessives = [def.variantDominant ? null : def.variant, def.extra?.allele].filter(Boolean) as string[];
    const nRec = pair.filter((a) => recessives.includes(a)).length;
    if (locus === 'r') return pair.includes('R') && nRec === 1;
    if (locus === 'B') return !(pair[0] === 'og' && pair[1] === 'og') && pair.includes('og') && !pair.includes('B');
    return nRec === 1;
  }

  /** Génotype homozygote d'une lignée fixée décrite par ses allèles d'intérêt. */
  genotypeFromVariants(variants: readonly VariantId[]): TomatoGenotype {
    const g = {} as TomatoGenotype;
    for (const locus of TOMATO_LOCI) {
      const a = variants.includes(locus.id) ? locus.variant : locus.standard;
      g[locus.id] = [a, a];
    }
    for (const [vid, [locus, allele]] of Object.entries(EXTRA_ALLELES) as Array<[VariantId, [TomatoLocusId, string]]>) {
      if (variants.includes(vid) && !variants.includes(locus)) g[locus] = [allele, allele];
    }
    return g;
  }

  /** Complète un individu sauvegardé par une version antérieure du moteur
   * (loci et traits ajoutés depuis) : allèle standard homozygote pour les
   * loci, haplotype neutre homozygote et phénotype recalculé pour les traits. */
  normalize(ind: TomatoIndividual): TomatoIndividual {
    const missingLoci = TOMATO_LOCI.filter((l) => !ind.genotype[l.id]);
    const missingTraits = QUANT_TRAITS.filter((t) => !ind.haps[t]);
    if (!missingLoci.length && !missingTraits.length) return ind;
    const genotype = { ...ind.genotype };
    for (const l of missingLoci) genotype[l.id] = [l.standard, l.standard];
    const haps = { ...ind.haps };
    for (const t of missingTraits) {
      const h = this.traits[t].haplotypeForTarget(0.5, this.rng);
      haps[t] = [h, [...h]];
    }
    const fresh = this.computePhenotype(genotype, haps);
    const pheno = { ...fresh, ...ind.pheno } as TomatoPhenotype;
    return { ...ind, genotype, haps, pheno };
  }

  appearance(ind: TomatoIndividual): FruitAppearance {
    return this.appearanceOf(ind.genotype, ind.pheno.weightG);
  }

  /** Aperçu d'une variété de la bibliothèque sans créer d'individu. */
  appearanceFromVariants(variants: readonly VariantId[], weightG: number): FruitAppearance {
    return this.appearanceOf(this.genotypeFromVariants(variants), weightG);
  }

  appearanceOf(g: TomatoGenotype, weightG: number): FruitAppearance {
    const ex = (l: TomatoLocusId) => this.expresses(g, l);
    const bicolor = this.expressesVariant(g, 'bic');
    const crimson = this.expressesVariant(g, 'og');

    let flesh: FleshColor;
    if (!g.r.includes('R')) {
      // PSY1 absent ou faible : pas (ou peu) de lycopène
      flesh = ex('gf') ? 'green' : bicolor ? 'bicolor' : 'yellow';
    } else if (ex('t') || (ex('B') && !ex('gf'))) {
      flesh = 'orange';
    } else if (ex('gf')) {
      flesh = 'black';
    } else {
      flesh = crimson ? 'crimson' : 'red';
    }
    const skin: SkinColor = ex('y') ? 'clear' : 'yellow';

    const colorKey: ColorKey =
      flesh === 'red' || flesh === 'crimson'
        ? skin === 'clear'
          ? 'pink'
          : flesh
        : flesh === 'black'
          ? skin === 'clear'
            ? 'purple'
            : 'black'
          : flesh === 'yellow'
            ? skin === 'clear'
              ? 'cream'
              : 'yellow'
            : flesh;

    const anthocyanin = ex('Aft') ? (ex('atv') ? 'indigo' : 'patches') : 'none';

    let shape: FruitShape;
    if (ex('sun')) shape = 'elongated';
    else if (ex('fas') && ex('o')) shape = 'heart';
    else if (ex('fas')) shape = 'ribbed';
    else if (ex('o')) shape = weightG < 40 ? 'pear' : 'oval';
    else shape = 'round';

    return { flesh, skin, colorKey, striped: ex('gs'), anthocyanin, greenShoulder: !ex('u'), fuzzy: ex('p'), shape };
  }

  isDwarf(ind: TomatoIndividual) {
    return this.expresses(ind.genotype, 'd');
  }

  isDeterminate(ind: TomatoIndividual) {
    return this.expresses(ind.genotype, 'sp');
  }

  isPotatoLeaf(ind: TomatoIndividual) {
    return this.expresses(ind.genotype, 'c');
  }

  isLongKeeper(ind: TomatoIndividual) {
    return this.expresses(ind.genotype, 'alc');
  }

  resistances(ind: TomatoIndividual): TomatoLocusId[] {
    return TOMATO_LOCI.filter((l) => l.category === 'resistance' && this.expresses(ind.genotype, l.id)).map((l) => l.id);
  }

  /** Code catalogue des résistances, à la manière des sachets (« VFN »). */
  resistanceCode(ind: TomatoIndividual): string {
    const letters: Partial<Record<TomatoLocusId, string>> = { Ve: 'V', I: 'F', Mi: 'N', Tm2: 'ToMV', Ph3: 'Ph3' };
    return this.resistances(ind)
      .map((id) => letters[id])
      .join(' ');
  }

  /** Taille relative des fruits : cerise / cocktail / moyenne / grosse. */
  sizeClass(ind: TomatoIndividual): 'cherry' | 'cocktail' | 'medium' | 'large' {
    const w = ind.pheno.weightG;
    return w < 30 ? 'cherry' : w < 90 ? 'cocktail' : w < 250 ? 'medium' : 'large';
  }

  /** Équilibre gustatif : rapport sucres/acidité (°Brix ÷ acidité titrable). */
  sugarAcidRatio(ind: TomatoIndividual): number {
    return Math.round((ind.pheno.brix / ind.pheno.acidity) * 10) / 10;
  }

  // --- Fixation --------------------------------------------------------------

  mendelianHeterozygosity(ind: TomatoIndividual): number {
    const het = LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id])).length;
    return het / LOCUS_IDS.length;
  }

  polygenicHeterozygosity(haps: TomatoIndividual['haps']): number {
    let s = 0;
    let n = 0;
    for (const trait of QUANT_TRAITS) {
      if (!haps[trait]) continue;
      s += this.traits[trait].heterozygosity(haps[trait][0], haps[trait][1]);
      n++;
    }
    return n ? s / n : 0;
  }

  /** Hétérozygotie globale (tous loci, mendéliens + polygéniques), 0–1. */
  heterozygosity(ind: TomatoIndividual): number {
    const nM = LOCUS_IDS.length;
    const nP = QUANT_TRAITS.length * N_POLY_LOCI;
    return (this.mendelianHeterozygosity(ind) * nM + this.polygenicHeterozygosity(ind.haps) * nP) / (nM + nP);
  }

  /** Lignée considérée fixée : aucun locus mendélien hétérozygote et
   * moins de 5 % de loci polygéniques hétérozygotes. */
  isFixed(ind: TomatoIndividual): boolean {
    return this.mendelianHeterozygosity(ind) === 0 && this.polygenicHeterozygosity(ind.haps) < 0.05;
  }

  /** Loci hétérozygotes restants : ce qui peut encore ségréger. */
  segregatingLoci(ind: TomatoIndividual): TomatoLocusId[] {
    return LOCUS_IDS.filter((id) => !isHomozygous(ind.genotype[id]));
  }

  // --- Prédiction mendélienne ---------------------------------------------

  /** Probabilité théorique d'expression de chaque allèle d'intérêt chez la
   * descendance de a × b (locus par locus, sans tenir compte de la liaison
   * — qui ne change pas ces proportions marginales). */
  predict(a: TomatoIndividual, b: TomatoIndividual): TheoreticalRatio[] {
    const out: TheoreticalRatio[] = [];
    const freq = (ind: TomatoIndividual, locus: TomatoLocusId, allele: string) => countAllele(ind.genotype[locus], allele) / 2;
    for (const def of TOMATO_LOCI) {
      if (def.id === 'r') {
        // Jaune : aucun R, et pas bic/bic
        const aR = freq(a, 'r', 'R');
        const bR = freq(b, 'r', 'R');
        const noR = (1 - aR) * (1 - bR);
        const bicbic = freq(a, 'r', 'bic') * freq(b, 'r', 'bic');
        const pY = noR - bicbic;
        if ((pY > 0 && pY < 1) || freq(a, 'r', 'r') !== freq(b, 'r', 'r')) out.push({ locus: 'r', pExpressed: pY });
        if (bicbic > 0 && bicbic < 1) out.push({ locus: 'bic', pExpressed: bicbic });
        continue;
      }
      const pa = freq(a, def.id, def.variant);
      const pb = freq(b, def.id, def.variant);
      if (pa > 0 || pb > 0) {
        const p = def.variantDominant ? 1 - (1 - pa) * (1 - pb) : pa * pb;
        if ((p > 0 && p < 1) || pa !== pb) out.push({ locus: def.id, pExpressed: p });
      }
      if (def.extra) {
        const p = freq(a, def.id, def.extra.allele) * freq(b, def.id, def.extra.allele);
        if (p > 0 && p < 1) out.push({ locus: def.extra.id, pExpressed: p });
      }
    }
    return out;
  }

  /** « gf/gf » : notation homozygote d'un allèle d'intérêt. */
  variantLabel(id: VariantId): string {
    const v = id === 'bic' || id === 'og' ? EXTRA_ALLELES[id][1] : LOCUS_BY_ID[id].variant;
    return `${v}/${v}`;
  }

  /** Code génotype compact : uniquement les loci non standard. */
  genotypeCode(ind: TomatoIndividual): string {
    const parts: string[] = [];
    for (const def of TOMATO_LOCI) {
      const pair = ind.genotype[def.id];
      if (pair[0] === def.standard && pair[1] === def.standard) continue;
      const ordered = pair[0] === def.standard ? [pair[1], pair[0]] : pair;
      parts.push(`${ordered[0]}/${ordered[1]}`);
    }
    return parts.length ? parts.join(' ') : '+';
  }
}
