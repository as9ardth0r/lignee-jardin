/**
 * Analyse de sol (phase 4) : interprétation d'un bulletin de laboratoire,
 * besoin en chaux, crédit d'azote du sol et correction des doses de P et K.
 *
 * ORDRES DE GRANDEUR, à confronter à l'interprétation du laboratoire :
 *  - Phosphore : seuils « faible / satisfaisant » selon la méthode
 *    d'extraction (Olsen, Joret-Hébert, Dyer), valeurs courantes des
 *    grilles d'interprétation pour les cultures légumières.
 *  - Potasse et magnésie : rapportées à la CEC (saturation visée de 3 à 5 %
 *    pour K, de 5 à 10 % pour Mg). 1 cmol+/kg = 471 mg K₂O/kg = 202 mg MgO/kg.
 *  - Correction des doses (comme les grilles COMIFER, simplifiées) : sol
 *    pauvre ×1,5, satisfaisant ×1, riche ×0,5, très riche : impasse.
 *  - Chaux : remonter le pH d'une unité demande d'augmenter la saturation
 *    de la CEC d'environ 20 % ; 1 cmol+/kg sur 25 cm de terre (325 kg/m²)
 *    = 91 g de CaO par m². D'où ≈ 18 g CaO/m² × ΔpH × CEC.
 *  - Azote : un sol minéralise chaque année environ 4 g N/m² par point de
 *    matière organique (≈ 120 kg N/ha pour 3 %), dont la culture profite
 *    au prorata de la durée de sa saison.
 */
import { PRODUCT_BY_ID, PRODUCTS } from '../data/products';
import { SPECIES_BY_ID } from '../data/species';
import type { Bed, GardenData, ISODate, PMethod, Plant, Product, SoilTest, Texture } from '../model';
import { diffDays, monthOf } from './dates';
import { bedArea } from './water';
import { speciesOf } from './crop';

export type Level = 'low' | 'ok' | 'high' | 'veryHigh';

/** Seuils P₂O₅ (mg/kg) : en dessous du premier, faible ; au-dessus du second, élevé. */
export const P_THRESHOLDS: Record<PMethod, [number, number]> = {
  olsen: [40, 90],
  joretHebert: [150, 300],
  dyer: [200, 400],
};

/** Argile typique (%) de chaque texture, pour estimer la CEC sans analyse. */
export const CLAY_OF_TEXTURE: Record<Texture, number> = { sand: 5, sandyLoam: 12, loam: 20, siltLoam: 15, clayLoam: 32, clay: 45 };

/** pH visé au potager. */
export const TARGET_PH = 6.5;
/** Chaulage : pas plus de 200 g CaO/m² (≈ 2 t/ha) en un apport. */
export const MAX_CAO_PER_M2 = 200;
/** g de CaO par m², par unité de pH et par cmol+/kg de CEC. */
export const CAO_PER_PH_CEC = 18.2;
/** g de N minéralisé par m² et par an, par point de matière organique. */
export const N_PER_OM_POINT = 4;
/** Le sol ne couvre jamais plus de 70 % du besoin en azote dans le conseil. */
export const MAX_N_CREDIT_SHARE = 0.7;

export const LEVEL_FACTOR: Record<Level, number> = { low: 1.5, ok: 1, high: 0.5, veryHigh: 0 };

/** CEC estimée (cmol+/kg) d'après l'argile et la matière organique. */
export function estimateCEC(clay: number, om: number): number {
  return Math.max(3, 0.5 * clay + 2 * om);
}

function level(value: number | undefined, [lo, hi]: [number, number]): Level | undefined {
  if (value === undefined) return undefined;
  if (value < lo) return 'low';
  if (value <= hi) return 'ok';
  return value > 2 * hi ? 'veryHigh' : 'high';
}

export interface SoilReading {
  test: SoilTest;
  /** Analyse de laboratoire, ou simple pH saisi dans les réglages. */
  fromLab: boolean;
  cec: number;
  cecEstimated: boolean;
  P?: { level: Level; range: [number, number] };
  K?: { level: Level; range: [number, number] };
  Mg?: { level: Level; range: [number, number] };
  /** Facteurs de correction des besoins en P₂O₅ et K₂O. */
  factor: { P2O5: number; K2O: number };
  /** Azote minéralisé par le sol en un an (g/m²), si la matière organique est connue. */
  nPerYear?: number;
  ph?: { value: number; state: 'acid' | 'ok' | 'alkaline' };
}

export function interpret(test: SoilTest, texture: Texture, fromLab = true): SoilReading {
  const clay = test.clay ?? CLAY_OF_TEXTURE[texture];
  const cecEstimated = test.cec === undefined;
  const cec = test.cec ?? estimateCEC(clay, test.om ?? 2);
  const kRange: [number, number] = [Math.max(80, Math.round(14.1 * cec)), Math.max(160, Math.round(23.6 * cec))];
  const mgRange: [number, number] = [Math.max(60, Math.round(10 * cec)), Math.max(120, Math.round(20 * cec))];
  const pRange = P_THRESHOLDS[test.pMethod];
  const P = level(test.P2O5, pRange);
  const K = level(test.K2O, kRange);
  const Mg = level(test.MgO, mgRange);
  return {
    test,
    fromLab,
    cec,
    cecEstimated,
    P: P && { level: P, range: pRange },
    K: K && { level: K, range: kRange },
    Mg: Mg && { level: Mg, range: mgRange },
    factor: { P2O5: P ? LEVEL_FACTOR[P] : 1, K2O: K ? LEVEL_FACTOR[K] : 1 },
    nPerYear: test.om !== undefined ? test.om * N_PER_OM_POINT : undefined,
    ph: test.pH !== undefined ? { value: test.pH, state: test.pH < TARGET_PH - 0.3 ? 'acid' : test.pH > 7.5 ? 'alkaline' : 'ok' } : undefined,
  };
}

/**
 * Analyse qui s'applique à une planche : la plus récente de la planche,
 * sinon la plus récente du jardin, sinon le pH des réglages (sans labo).
 */
export function soilFor(data: Pick<GardenData, 'soilTests' | 'settings' | 'beds'>, bedId?: string): SoilReading | null {
  const bed = bedId ? data.beds.find((b) => b.id === bedId) : undefined;
  const texture = bed?.texture ?? data.settings.texture;
  const newest = (list: SoilTest[]) => [...list].sort((a, b) => b.date.localeCompare(a.date))[0];
  const own = bedId ? newest(data.soilTests.filter((t) => t.bedId === bedId)) : undefined;
  const garden = newest(data.soilTests.filter((t) => !t.bedId));
  const t = own ?? garden;
  if (t) return interpret(t, texture);
  if (data.settings.pH !== undefined) return interpret({ id: 'settings', date: '1970-01-01', pH: data.settings.pH, pMethod: 'olsen' }, texture, false);
  return null;
}

/** Crédit d'azote du sol pour une culture (g), plafonné à 70 % de son besoin. */
export function nCredit(reading: SoilReading | null, plant: Plant, area: number, needN: number): number {
  if (!reading?.nPerYear) return 0;
  const sp = speciesOf(plant);
  const share = Math.min(1, (sp.season / 365) * 1.4); // la minéralisation se fait surtout à la belle saison
  return Math.min(needN * MAX_N_CREDIT_SHARE, reading.nPerYear * share * area);
}

// --- Chaulage --------------------------------------------------------------------------

export interface LimeAdvice {
  /** CaO à apporter (g/m²) pour atteindre le pH visé, déduction faite des apports depuis l'analyse. */
  caoPerM2: number;
  /** Ce qu'on peut apporter cette fois-ci (g CaO/m²), plafonné. */
  nowPerM2: number;
  product: Product;
  /** Quantité de produit (g/m², et g pour la surface). */
  productPerM2: number;
  productTotal: number;
  area: number;
  /** Il faudra plusieurs années pour y arriver. */
  multiYear: boolean;
  /** CaO déjà apporté depuis l'analyse (g/m²). */
  alreadyPerM2: number;
  target: number;
}

/** CaO apporté (g/m²) par les amendements notés depuis une date, sur une planche ou tout le jardin. */
export function caoApplied(data: Pick<GardenData, 'applications' | 'beds'>, since: ISODate, bedId?: string): number {
  const beds = bedId ? data.beds.filter((b) => b.id === bedId) : data.beds;
  const area = beds.reduce((s, b) => s + bedArea(b), 0);
  if (area <= 0) return 0;
  let g = 0;
  for (const a of data.applications) {
    const p = PRODUCT_BY_ID[a.productId];
    if (!p?.cao || a.date < since || !beds.some((b) => b.id === a.bedId)) continue;
    g += (a.amount * p.cao) / 100;
  }
  return g / area;
}

export function limeAdvice(reading: SoilReading | null, data: Pick<GardenData, 'applications' | 'beds'>, bed?: Bed): LimeAdvice | null {
  if (!reading?.ph || reading.ph.state !== 'acid') return null;
  const delta = TARGET_PH - reading.ph.value;
  const total = CAO_PER_PH_CEC * delta * reading.cec;
  const already = caoApplied(data, reading.test.date, bed?.id);
  const caoPerM2 = Math.max(0, total - already);
  if (caoPerM2 < 20) return null;
  const nowPerM2 = Math.min(MAX_CAO_PER_M2, caoPerM2);
  const product = PRODUCT_BY_ID[reading.Mg?.level === 'low' ? 'dolomite' : 'limestone'];
  const productPerM2 = nowPerM2 / ((product.cao ?? 50) / 100);
  const area = bed ? bedArea(bed) : data.beds.reduce((s, b) => s + bedArea(b), 0);
  return { caoPerM2, nowPerM2, product, productPerM2, productTotal: productPerM2 * area, area, multiYear: caoPerM2 > MAX_CAO_PER_M2, alreadyPerM2: already, target: TARGET_PH };
}

/** Saison du chaulage : d'octobre à mars, sol ressuyé, loin d'un apport de fumier. */
export function limeSeason(date: ISODate): boolean {
  const m = monthOf(date);
  return m >= 10 || m <= 3;
}

/** Cultures d'une planche hors de leur plage de pH. */
export function phMismatches(reading: SoilReading | null, plants: Plant[]): Plant[] {
  if (!reading?.ph) return [];
  const v = reading.ph.value;
  return plants.filter((p) => {
    const sp = SPECIES_BY_ID[p.speciesId];
    return sp && (v < sp.pH[0] - 0.2 || v > sp.pH[1] + 0.2);
  });
}

/** Analyse vieille de plus de 5 ans : à refaire. */
export function testIsOld(test: SoilTest, today: ISODate): boolean {
  return test.id !== 'settings' && diffDays(test.date, today) > 5 * 365;
}

export const LIME_PRODUCTS = PRODUCTS.filter((p) => p.kind === 'amendment');
