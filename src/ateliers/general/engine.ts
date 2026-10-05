/**
 * Atelier général de sélection : un même moteur génétique pour toutes les
 * espèces du catalogue, réglé à partir de leurs données (calendrier,
 * rendement, hauteur, couleurs, mode de fécondation, cycle de vie).
 *
 * Modèle (pédagogique, simplifié) :
 * - chaque caractère chiffré (précocité, rendement, hauteur, abondance de
 *   fleurs) dépend de 6 gènes à effet additif, plus une part de milieu
 *   (héritabilité moyenne) ;
 * - la couleur des fleurs : un gène « pigment » (sans pigment = blanc,
 *   récessif) et une série d'allèles de teinte, dominants dans l'ordre du
 *   catalogue ;
 * - une résistance à une maladie courante, gène unique dominant ;
 * - les espèces allogames (fécondées par les insectes ou le vent) perdent
 *   en vigueur quand on les autoféconde (dépression de consanguinité) ;
 *   les autogames presque pas ;
 * - le temps d'une génération suit le cycle : annuelle 1 saison,
 *   bisannuelle 2, vivace 2, arbre fruitier 4 (juvénilité), et les clones
 *   (bouture, greffe, division) reproduisent la plante telle quelle.
 */
import { SPECIES_EXTRA } from '../../jardin/data/speciesExtra';
import { FLOWER_INFO, type FlowerColor } from '../../jardin/data/flowers';
import { ORCHARD_MONTHS } from '../../jardin/data/orchard';
import type { Species, Txt } from '../../jardin/model';

export type Rng = () => number;
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rng: Rng) => {
  const u = Math.max(1e-9, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
};

export const QUANT_LOCI = 6;

export type QuantId = 'earliness' | 'yield' | 'height' | 'abundance';
export interface QuantTrait {
  kind: 'quant';
  id: QuantId;
  min: number;
  max: number;
  /** days : jours jusqu'à la récolte ou la floraison ; doy : jour de l'année de la maturité (fruitiers). */
  unit: 'days' | 'doy' | 'kgm2' | 'gm2' | 'cm' | 'score';
  /** Le mieux : valeur basse (précocité), haute (rendement), ou sans préférence (hauteur). */
  better: 'low' | 'high' | 'none';
  envSd: number;
  /** Touché par la dépression de consanguinité. */
  vigour: boolean;
  decimals: number;
}
export interface ColorTrait {
  kind: 'color';
  id: 'color';
  /** Teintes avec pigment, la première dominante. */
  hues: FlowerColor[];
  /** Un blanc récessif existe (gène pigment). */
  white: boolean;
}
export interface ResistTrait {
  kind: 'resist';
  id: 'resist';
  disease: Txt;
}
export type Trait = QuantTrait | ColorTrait | ResistTrait;

export interface Profile {
  species: Species;
  traits: Trait[];
  pollination: 'self' | 'insect' | 'wind' | 'vegetative';
  /** Perte de vigueur maximale à l'autofécondation complète (0–1). */
  depression: number;
  /** Saisons par génération sexuée, et pour une multiplication végétative. */
  seasonsPerGen: number;
  seasonsPerClone: number;
  /** Croisement possible (sinon : sélection clonale seulement). */
  sexual: boolean;
  /** Multiplication végétative possible (bouture, greffe, division, bulbes…). */
  clonable: boolean;
}

/** Maladie courante prise comme exemple de résistance, par famille. */
const DISEASE: Record<string, Txt> = {
  solanaceae: { fr: 'mildiou', en: 'late blight' },
  cucurbitaceae: { fr: 'oïdium', en: 'powdery mildew' },
  brassicaceae: { fr: 'hernie du chou', en: 'clubroot' },
  fabaceae: { fr: 'anthracnose', en: 'anthracnose' },
  asteraceae: { fr: 'mildiou (Bremia)', en: 'downy mildew' },
  apiaceae: { fr: 'alternariose', en: 'Alternaria blight' },
  amaryllidaceae: { fr: 'rouille', en: 'rust' },
  rosaceae: { fr: 'tavelure', en: 'scab' },
  lamiaceae: { fr: 'fusariose', en: 'Fusarium wilt' },
  amaranthaceae: { fr: 'mildiou', en: 'downy mildew' },
  poaceae: { fr: 'rouille', en: 'rust' },
};

/** Espèces cultivées sans graines (stériles ou presque) : on ne peut que choisir et multiplier les meilleurs clones. */
const STERILE = new Set(['garlic', 'shallot', 'saffron', 'horseradish', 'crosne', 'jerusalemartichoke', 'oca', 'yacon', 'ginger', 'lemongrass', 'tarragon', 'mint', 'vietnamesecoriander', 'fig']);

export function profileOf(sp: Species): Profile {
  const ex = SPECIES_EXTRA[sp.id];
  const fl = FLOWER_INFO[sp.id];
  const pollination = ex?.pollination ?? 'insect';
  const traits: Trait[] = [];
  const [d0, d1] = sp.daysToHarvest;
  const months = sp.type === 'orchard' ? ORCHARD_MONTHS[sp.id] : undefined;
  if (months) {
    // Fruitiers : date de maturité dans l'année (de la première à la dernière récolte connue pour l'espèce, élargie).
    // Une récolte à cheval sur deux années (agrumes, novembre → avril) se compte au-delà du 31 décembre.
    const [m0, m1raw] = months;
    const m1 = m1raw < m0 ? m1raw + 12 : m1raw;
    traits.push({ kind: 'quant', id: 'earliness', min: Math.max(1, Math.round((m0 - 1) * 30.4 - 10)), max: Math.round(m1 * 30.4 + 10), unit: 'doy', better: 'low', envSd: 0.05, vigour: false, decimals: 0 });
  } else traits.push({ kind: 'quant', id: 'earliness', min: Math.max(10, Math.round(d0 * 0.8)), max: Math.round(d1 * 1.15), unit: 'days', better: 'low', envSd: 0.07, vigour: false, decimals: 0 });
  if (sp.type === 'flower' && fl) {
    traits.push({ kind: 'quant', id: 'height', min: Math.max(3, Math.round(fl.height[0] * 0.7)), max: Math.round(fl.height[1] * 1.2), unit: 'cm', better: 'none', envSd: 0.08, vigour: true, decimals: 0 });
    traits.push({ kind: 'quant', id: 'abundance', min: 1, max: 10, unit: 'score', better: 'high', envSd: 0.12, vigour: true, decimals: 1 });
    const hues = fl.colors.filter((c) => c !== 'white');
    traits.push({ kind: 'color', id: 'color', hues: hues.length ? hues : ['white'], white: fl.colors.includes('white') && hues.length > 0 });
  } else {
    const [y0, y1] = sp.yieldM2;
    // Petites récoltes (safran, graines…) comptées en grammes.
    if (y1 < 0.1) traits.push({ kind: 'quant', id: 'yield', min: +(y0 * 600).toFixed(1), max: +(y1 * 1300).toFixed(1), unit: 'gm2', better: 'high', envSd: 0.13, vigour: true, decimals: 1 });
    else traits.push({ kind: 'quant', id: 'yield', min: Math.max(0.05, +(y0 * 0.6).toFixed(2)), max: +(y1 * 1.3).toFixed(2), unit: 'kgm2', better: 'high', envSd: 0.13, vigour: true, decimals: 1 });
    traits.push({ kind: 'quant', id: 'height', min: 1, max: 10, unit: 'score', better: 'none', envSd: 0.1, vigour: true, decimals: 1 });
  }
  traits.push({ kind: 'resist', id: 'resist', disease: DISEASE[sp.family] ?? { fr: 'une maladie courante', en: 'a common disease' } });
  const tree = sp.type === 'orchard' && /(apple|pear|plum|cherry|peach|apricot|quince|fig|walnut|almond|chestnut|olive|lemon|medlar|persimmon|mulberry|nectarine|mirabelle|loquat|pomegranate|feijoa|hazelnut|kiwi|grape)/.test(sp.id);
  const seasonsPerGen = tree ? 4 : sp.type === 'orchard' ? 2 : sp.life === 'annual' ? 1 : 2;
  const vegetativeOnly = pollination === 'vegetative';
  return {
    species: sp,
    traits,
    pollination,
    depression: pollination === 'self' ? 0.04 : vegetativeOnly ? 0.3 : 0.35,
    seasonsPerGen,
    seasonsPerClone: tree ? 3 : 1,
    // Ail, échalote, pomme de terre… : quasi stériles ou multipliés autrement ; on croise quand même les espèces qui fleurissent.
    // Ail, échalote, safran, raifort… ne donnent pas (ou presque pas) de graines : sélection clonale seulement.
    sexual: !STERILE.has(sp.id),
    clonable: vegetativeOnly || sp.life === 'perennial' || sp.type === 'orchard',
  };
}

// --- Génotype, phénotype ------------------------------------------------------------

export type Genotype = Record<string, [number, number]>;
export interface Pheno {
  quant: Partial<Record<QuantId, number>>;
  color?: FlowerColor;
  resistant?: boolean;
}
export interface Plant {
  id: string;
  gen: number;
  genotype: Genotype;
  pheno: Pheno;
  /** Comment la plante a été obtenue (« A × B », « autofécondation »…). */
  origin: string;
  /** Identifiants des parents. */
  parents: string[];
}

const locusIds = (p: Profile) => {
  const ids: string[] = [];
  for (const t of p.traits) {
    if (t.kind === 'quant') for (let i = 0; i < QUANT_LOCI; i++) ids.push(`${t.id}${i}`);
    else if (t.kind === 'color') {
      if (t.white) ids.push('P');
      if (t.hues.length > 1) ids.push('H');
    } else ids.push('R');
  }
  return ids;
};

/** Part des gènes à l'état homozygote (0 : tout hétérozygote, 1 : lignée fixée). */
export function homozygosity(g: Genotype): number {
  const ks = Object.keys(g);
  if (!ks.length) return 1;
  return ks.filter((k) => g[k][0] === g[k][1]).length / ks.length;
}

export function phenotype(p: Profile, g: Genotype, rng: Rng): Pheno {
  const out: Pheno = { quant: {} };
  const F = homozygosity(g);
  // Dépression de consanguinité : nulle pour une plante issue de croisement (≈ ½ homozygote), maximale si fixée.
  const dep = p.depression * Math.max(0, (F - 0.5) / 0.5);
  for (const t of p.traits) {
    if (t.kind === 'quant') {
      let s = 0;
      for (let i = 0; i < QUANT_LOCI; i++) {
        const a = g[`${t.id}${i}`] ?? [0, 0];
        s += a[0] + a[1];
      }
      let x = s / (2 * QUANT_LOCI) + gauss(rng) * t.envSd;
      x = Math.min(1, Math.max(0, x));
      let v = t.min + (t.max - t.min) * x;
      if (t.vigour) v = t.min + (v - t.min) * (1 - dep);
      out.quant[t.id] = +v.toFixed(t.decimals);
    } else if (t.kind === 'color') {
      const pig = g.P;
      if (t.white && pig && pig[0] === 0 && pig[1] === 0) out.color = 'white';
      else out.color = t.hues[Math.min(...(g.H ?? [0, 0]))] ?? t.hues[0];
    } else {
      const r = g.R ?? [0, 0];
      out.resistant = r[0] === 1 || r[1] === 1;
    }
  }
  return out;
}

// --- Variétés de départ ---------------------------------------------------------------

export interface Archetype {
  id: string;
  name: Txt;
  /** Fréquence de l'allèle « 1 » par gène (0 ou 1 : variété fixée). */
  freq: Record<string, number>;
}

const COLOR_NAME: Record<FlowerColor, Txt> = {
  white: { fr: 'blanche', en: 'white' },
  yellow: { fr: 'jaune', en: 'yellow' },
  orange: { fr: 'orange', en: 'orange' },
  red: { fr: 'rouge', en: 'red' },
  pink: { fr: 'rose', en: 'pink' },
  purple: { fr: 'violette', en: 'purple' },
  blue: { fr: 'bleue', en: 'blue' },
};

/**
 * Variétés de départ contrastées (fictives, pour l'exercice) : précoce,
 * productive, résistante… et pour les fleurs une par couleur, une naine,
 * une géante. Fixées pour les autogames, populations variables sinon.
 */
export function archetypes(p: Profile): Archetype[] {
  const fixed = p.pollination === 'self' || p.pollination === 'vegetative';
  // Allèles d'un caractère chiffré : k gènes sur 6 portent « 1 » (fixée) ou une fréquence proche (population).
  const q = (id: QuantId, level: number, f: Record<string, number>) => {
    const k = Math.round(level * QUANT_LOCI);
    for (let i = 0; i < QUANT_LOCI; i++) f[`${id}${i}`] = fixed ? (i < k ? 1 : 0) : Math.min(0.9, Math.max(0.1, level + (i % 2 ? 0.08 : -0.08)));
  };
  const color = p.traits.find((t): t is ColorTrait => t.kind === 'color');
  const flower = Boolean(color);
  const second: QuantId = flower ? 'abundance' : 'yield';
  const make = (id: string, name: Txt, lv: { earliness: number; second: number; height: number; r: boolean; hue?: number; white?: boolean }): Archetype => {
    const f: Record<string, number> = {};
    q('earliness', lv.earliness, f);
    q(second, lv.second, f);
    q('height', lv.height, f);
    f.R = lv.r ? 1 : 0;
    if (color?.white) f.P = lv.white ? 0 : 1;
    if (color && color.hues.length > 1) f.H = lv.hue ?? 0;
    return { id, name, freq: f };
  };
  const list: Archetype[] = [
    make('early', { fr: 'Lignée précoce', en: 'Early line' }, { earliness: 0.15, second: 0.35, height: 0.4, r: false, hue: 0 }),
    make('productive', flower ? { fr: 'Lignée florifère', en: 'Free-flowering line' } : { fr: 'Lignée productive', en: 'High-yield line' }, { earliness: 0.85, second: 0.9, height: 0.7, r: false, hue: color ? Math.min(1, color.hues.length - 1) : 0 }),
    make('resistant', { fr: 'Lignée résistante', en: 'Resistant line' }, { earliness: 0.5, second: 0.3, height: 0.5, r: true, hue: color ? color.hues.length - 1 : 0 }),
  ];
  if (flower && color) {
    list.push(make('dwarf', { fr: 'Lignée naine', en: 'Dwarf line' }, { earliness: 0.4, second: 0.6, height: 0.05, r: false, hue: 0 }));
    list.push(make('giant', { fr: 'Lignée géante', en: 'Giant line' }, { earliness: 0.6, second: 0.5, height: 0.95, r: false, hue: 0 }));
    // H : indice de teinte ; l'allèle « fréquence » sert d'indice pour les teintes (variété fixée sur cette teinte).
    color.hues.forEach((h, i) => list.push(make(`hue-${h}`, { fr: `Lignée ${COLOR_NAME[h].fr}`, en: `${COLOR_NAME[h].en[0].toUpperCase()}${COLOR_NAME[h].en.slice(1)} line` }, { earliness: 0.5, second: 0.5, height: 0.5, r: false, hue: i })));
    if (color.white) list.push(make('hue-white', { fr: 'Lignée blanche', en: 'White line' }, { earliness: 0.5, second: 0.5, height: 0.5, r: false, white: true, hue: color.hues.length - 1 }));
  }
  return list;
}

let counter = 0;
const newId = () => `p${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Une plante tirée d'une variété de départ. */
export function plantFrom(p: Profile, a: Archetype, rng: Rng): Plant {
  const g: Genotype = {};
  for (const id of locusIds(p)) {
    const f = a.freq[id] ?? 0;
    if (id === 'H') {
      g.H = [f, f];
      continue;
    }
    g[id] = [rng() < f ? 1 : 0, rng() < f ? 1 : 0];
  }
  return { id: newId(), gen: 0, genotype: g, pheno: phenotype(p, g, rng), origin: a.id, parents: [] };
}

function gamete(g: Genotype, rng: Rng): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of Object.keys(g)) out[k] = g[k][rng() < 0.5 ? 0 : 1];
  return out;
}

/** Descendance d'un croisement (ou d'une autofécondation si a = b). */
export function cross(p: Profile, a: Plant, b: Plant, n: number, rng: Rng, origin: string): Plant[] {
  const kids: Plant[] = [];
  for (let i = 0; i < n; i++) {
    const ga = gamete(a.genotype, rng);
    const gb = gamete(b.genotype, rng);
    const g: Genotype = {};
    for (const k of Object.keys(a.genotype)) g[k] = [ga[k], gb[k] ?? ga[k]];
    kids.push({ id: newId(), gen: Math.max(a.gen, b.gen) + 1, genotype: g, pheno: phenotype(p, g, rng), origin, parents: a.id === b.id ? [a.id] : [a.id, b.id] });
  }
  return kids;
}

/** Clone (bouture, greffe, division) : même génotype, nouvelle expression du milieu. */
export function clone(p: Profile, a: Plant, n: number, rng: Rng): Plant[] {
  return Array.from({ length: n }, () => ({ id: newId(), gen: a.gen, genotype: a.genotype, pheno: phenotype(p, a.genotype, rng), origin: 'clone', parents: [a.id] }));
}

/** Une plante est-elle « fixée » (se ressèmera presque à l'identique) ? */
export const isFixed = (pl: Plant) => homozygosity(pl.genotype) >= 0.9;

// --- Objectif ---------------------------------------------------------------------------

export interface Goal {
  earlinessMax?: number;
  yieldMin?: number;
  abundanceMin?: number;
  heightMin?: number;
  heightMax?: number;
  color?: FlowerColor;
  resistant?: boolean;
}

export function meetsGoal(pl: Plant, goal: Goal): boolean {
  const q = pl.pheno.quant;
  if (goal.earlinessMax !== undefined && (q.earliness ?? Infinity) > goal.earlinessMax) return false;
  if (goal.yieldMin !== undefined && (q.yield ?? 0) < goal.yieldMin) return false;
  if (goal.abundanceMin !== undefined && (q.abundance ?? 0) < goal.abundanceMin) return false;
  if (goal.heightMin !== undefined && (q.height ?? 0) < goal.heightMin) return false;
  if (goal.heightMax !== undefined && (q.height ?? Infinity) > goal.heightMax) return false;
  if (goal.color && pl.pheno.color !== goal.color) return false;
  if (goal.resistant && !pl.pheno.resistant) return false;
  return true;
}

/** Moyenne et écart-type d'un caractère dans un lot de plantes (pour juger l'homogénéité). */
export function stats(plants: Plant[], id: QuantId): { mean: number; sd: number } | null {
  const v = plants.map((pl) => pl.pheno.quant[id]).filter((x): x is number => typeof x === 'number');
  if (!v.length) return null;
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length);
  return { mean, sd };
}
