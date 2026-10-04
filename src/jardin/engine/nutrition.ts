/**
 * Nutrition : besoins de la saison, répartition par stade, apports déjà
 * faits et dose conseillée d'un produit.
 *
 * Tout est exprimé comme sur les étiquettes et les analyses françaises :
 * N, P₂O₅, K₂O (oxydes). La conversion en éléments n'est qu'un affichage.
 */
import { COVER_INFO } from '../data/covers';
import { PRODUCT_BY_ID } from '../data/products';
import type { Application, CropType, GardenData, ISODate, Plant, Product, Settings, StageId } from '../model';
import { addDays, diffDays } from './dates';
import { isActiveOn, plantArea, speciesOf } from './crop';
import { timeline } from './phenology';
import { nCredit, soilFor } from './soil';
import { mulchForPlant } from './mulch';

export type Nutrient = 'N' | 'P2O5' | 'K2O';
export const NUTRIENTS: Nutrient[] = ['N', 'P2O5', 'K2O'];
export type NPK = Record<Nutrient, number>;

/** Facteurs de conversion oxyde → élément. */
export const OXIDE_TO_ELEMENT = { P2O5: 0.436, K2O: 0.83, CaO: 0.715, MgO: 0.603 } as const;

/** Part de l'azote couverte par la fixation symbiotique chez les légumineuses (hypothèse simple). */
export const LEGUME_N_FIXED = 0.85;

/** Marge affichée autour des besoins calculés (± 25 %). */
export const NEED_MARGIN = 0.25;

/**
 * Répartition des besoins par stade, selon le type de culture (poids
 * relatifs, renormalisés sur les stades de l'espèce). Profils simplifiés :
 * l'azote surtout pendant la croissance, la potasse surtout pendant la
 * fructification ou la formation des organes de réserve.
 */
const SPLIT: Record<CropType, Record<Nutrient, Partial<Record<StageId, number>>>> = {
  fruit: {
    N: { germination: 0.02, vegetative: 0.33, flowering: 0.2, fruiting: 0.45 },
    P2O5: { germination: 0.1, vegetative: 0.4, flowering: 0.25, fruiting: 0.25 },
    K2O: { germination: 0.02, vegetative: 0.18, flowering: 0.2, fruiting: 0.6 },
  },
  legume: {
    N: { germination: 0.05, vegetative: 0.45, flowering: 0.25, fruiting: 0.25 },
    P2O5: { germination: 0.1, vegetative: 0.4, flowering: 0.25, fruiting: 0.25 },
    K2O: { germination: 0.02, vegetative: 0.3, flowering: 0.25, fruiting: 0.43 },
  },
  leaf: {
    N: { germination: 0.03, vegetative: 0.5, bulking: 0.47, harvest: 0.47 },
    P2O5: { germination: 0.1, vegetative: 0.5, bulking: 0.4, harvest: 0.4 },
    K2O: { germination: 0.03, vegetative: 0.45, bulking: 0.52, harvest: 0.52 },
  },
  herb: {
    N: { germination: 0.03, vegetative: 0.5, harvest: 0.47 },
    P2O5: { germination: 0.1, vegetative: 0.5, harvest: 0.4 },
    K2O: { germination: 0.03, vegetative: 0.45, harvest: 0.52 },
  },
  root: {
    N: { germination: 0.03, vegetative: 0.37, bulking: 0.6 },
    P2O5: { germination: 0.1, vegetative: 0.4, bulking: 0.5 },
    K2O: { germination: 0.03, vegetative: 0.27, bulking: 0.7 },
  },
  bulb: {
    N: { germination: 0.03, vegetative: 0.47, bulking: 0.5 },
    P2O5: { germination: 0.1, vegetative: 0.45, bulking: 0.45 },
    K2O: { germination: 0.03, vegetative: 0.37, bulking: 0.6 },
  },
  perennial: {
    N: { vegetative: 0.45, flowering: 0.2, fruiting: 0.35, harvest: 0.55 },
    P2O5: { vegetative: 0.45, flowering: 0.25, fruiting: 0.3, harvest: 0.55 },
    K2O: { vegetative: 0.3, flowering: 0.2, fruiting: 0.5, harvest: 0.7 },
  },
  // Fruitiers : réserves au débourrement, potasse pour le grossissement des fruits.
  orchard: {
    N: { vegetative: 0.5, flowering: 0.2, fruiting: 0.3, harvest: 0.3 },
    P2O5: { vegetative: 0.45, flowering: 0.25, fruiting: 0.3, harvest: 0.3 },
    K2O: { vegetative: 0.25, flowering: 0.15, fruiting: 0.6, harvest: 0.6 },
  },
  // Engrais verts : croissance végétative seulement.
  cover: {
    N: { germination: 0.05, vegetative: 0.95 },
    P2O5: { germination: 0.1, vegetative: 0.9 },
    K2O: { germination: 0.05, vegetative: 0.95 },
  },
  // Fleurs : l'azote pour le feuillage, la potasse pour la floraison.
  flower: {
    N: { germination: 0.03, vegetative: 0.62, flowering: 0.35 },
    P2O5: { germination: 0.1, vegetative: 0.45, flowering: 0.45 },
    K2O: { germination: 0.03, vegetative: 0.37, flowering: 0.6 },
  },
};

export interface StageNeed {
  stage: StageId;
  from: ISODate;
  need: NPK;
}

export interface NutrientStatus {
  area: number;
  yieldKg: number;
  /** Besoins de la saison (g), valeur centrale et fourchette. */
  need: NPK;
  low: NPK;
  high: NPK;
  legume: boolean;
  byStage: StageNeed[];
  /** Apports disponibles déjà faits pour cette culture (g). */
  applied: NPK;
  /** Besoins cumulés jusqu'à la fin du stade en cours, moins les apports (g, ≥ 0). */
  dueNow: NPK;
  /** Ce qui reste à apporter sur la saison (g, ≥ 0). */
  remaining: NPK;
  /** Excès d'apport par rapport au besoin (P₂O₅ ou K₂O au-delà de 150 %). */
  excess: Nutrient[];
  /** Correction par l'analyse de sol (si elle existe) : facteurs P/K et azote fourni par le sol (g). */
  soil?: { date: ISODate; fromLab: boolean; P2O5: number; K2O: number; nCredit: number };
  /** Éléments libérés par le paillage de la planche pendant la saison (g, déjà comptés dans « applied »). */
  mulch: NPK;
  /** Azote rendu par un engrais vert détruit avant la culture (g). */
  cover: number;
}

export function expectedYieldKg(plant: Plant): number {
  const sp = speciesOf(plant);
  const target = plant.yieldTarget && plant.yieldTarget > 0 ? plant.yieldTarget : (sp.yieldM2[0] + sp.yieldM2[1]) / 2;
  return plantArea(plant) * target;
}

/** Besoins de la saison (g de N, P₂O₅, K₂O), avant apports. */
export function seasonNeed(plant: Plant): { need: NPK; legume: boolean; yieldKg: number } {
  const sp = speciesOf(plant);
  const yieldKg = expectedYieldKg(plant);
  const legume = sp.type === 'legume';
  return {
    yieldKg,
    legume,
    need: {
      N: sp.exports.N * yieldKg * (legume ? 1 - LEGUME_N_FIXED : 1),
      P2O5: sp.exports.P2O5 * yieldKg,
      K2O: sp.exports.K2O * yieldKg,
    },
  };
}

function splitWeights(type: CropType, stages: StageId[], n: Nutrient): number[] {
  const w = stages.map((s) => SPLIT[type][n][s] ?? 0);
  const sum = w.reduce((a, b) => a + b, 0);
  return sum > 0 ? w.map((x) => x / sum) : stages.map(() => 1 / stages.length);
}

/** Ce qu'un apport fournit réellement (g disponibles cette saison). */
export function supplied(product: Product, amount: number): NPK {
  return {
    N: (amount * product.N * product.nAvail) / 100,
    P2O5: (amount * product.P2O5) / 100,
    K2O: (amount * product.K2O) / 100,
  };
}

/**
 * Part d'un apport qui revient à cette culture : tout si l'apport la vise,
 * sinon au prorata de sa surface parmi les cultures présentes (ou prévues
 * dans les 45 jours, pour une fumure de fond avant plantation).
 */
export function shareOf(app: Application, plant: Plant, plants: Plant[]): number {
  if (app.bedId !== plant.bedId) return 0;
  if (app.plantId) return app.plantId === plant.id ? 1 : 0;
  const concerned = (p: Plant) =>
    p.bedId === app.bedId &&
    p.status !== 'planned' &&
    (isActiveOn(p, app.date) || (p.sowDate > app.date && p.sowDate <= addDays(app.date, 45)) || (p.indoor && p.sowDate <= app.date && (!p.transplantDate || p.transplantDate <= addDays(app.date, 45)) && (!p.endDate || p.endDate >= app.date)));
  if (!concerned(plant)) return 0;
  const total = plants.filter(concerned).reduce((s, p) => s + plantArea(p), 0);
  return total > 0 ? plantArea(plant) / total : 0;
}

/**
 * Azote rendu à une culture par les engrais verts détruits sur la même
 * planche dans les 8 mois avant sa mise en place (ou jusqu'à 2 semaines
 * après) : g N, au prorata de la surface commune.
 */
export function coverCredit(plant: Plant, data: GardenData): number {
  if (COVER_INFO[plant.speciesId]) return 0;
  const start = plant.transplantDate ?? plant.sowDate;
  let n = 0;
  for (const c of data.plants) {
    const info = COVER_INFO[c.speciesId];
    if (!info || c.id === plant.id || c.bedId !== plant.bedId || !c.endDate) continue;
    const gap = diffDays(c.endDate, start);
    if (gap < -15 || gap > 240) continue;
    n += info.nReturn * Math.min(plantArea(plant), plantArea(c));
  }
  return Math.round(n * 10) / 10;
}

export function nutrientStatus(plant: Plant, data: GardenData, today: ISODate): NutrientStatus {
  const sp = speciesOf(plant);
  const info = timeline(plant, data, today);
  const base = seasonNeed(plant);
  const { legume, yieldKg } = base;
  // Analyse de sol : le sol pauvre demande plus, le sol riche moins, la matière organique fournit de l'azote.
  const reading = soilFor(data, plant.bedId);
  let need = base.need;
  let soil: NutrientStatus['soil'];
  if (reading && (reading.fromLab || reading.nPerYear)) {
    const credit = nCredit(reading, plant, plantArea(plant), base.need.N);
    need = { N: Math.max(0, base.need.N - credit), P2O5: base.need.P2O5 * reading.factor.P2O5, K2O: base.need.K2O * reading.factor.K2O };
    soil = { date: reading.test.date, fromLab: reading.fromLab, P2O5: reading.factor.P2O5, K2O: reading.factor.K2O, nCredit: credit };
  }
  const stages = info.starts.map((s) => s.stage);
  const weights = Object.fromEntries(NUTRIENTS.map((n) => [n, splitWeights(sp.type, stages, n)])) as Record<Nutrient, number[]>;
  const byStage: StageNeed[] = info.starts.map((s, i) => ({
    stage: s.stage,
    from: s.date,
    need: { N: need.N * weights.N[i], P2O5: need.P2O5 * weights.P2O5[i], K2O: need.K2O * weights.K2O[i] },
  }));

  const applied: NPK = { N: 0, P2O5: 0, K2O: 0 };
  for (const app of data.applications) {
    const product = PRODUCT_BY_ID[app.productId];
    if (!product) continue;
    const share = shareOf(app, plant, data.plants);
    if (share <= 0) continue;
    const s = supplied(product, app.amount);
    for (const n of NUTRIENTS) applied[n] += s[n] * share;
  }
  // Engrais vert détruit sur la planche juste avant la culture : azote rendu.
  const cover = coverCredit(plant, data);
  applied.N += cover;
  // Paillage et broyat : ce que la couche libère pendant la saison de la culture.
  const mulch = mulchForPlant(plant, data.beds.find((b) => b.id === plant.bedId), data, info.seasonEnd);
  for (const n of NUTRIENTS) applied[n] += mulch[n];

  // Besoins cumulés jusqu'à la fin du stade en cours.
  let idx = -1;
  if (info.stage !== 'planned') {
    idx = info.stage === 'ended' ? byStage.length - 1 : stages.indexOf(info.stage as StageId);
  }
  const cumul: NPK = { N: 0, P2O5: 0, K2O: 0 };
  for (let i = 0; i <= idx; i++) for (const n of NUTRIENTS) cumul[n] += byStage[i].need[n];

  const pos = (x: number) => Math.max(0, x);
  const dueNow: NPK = { N: pos(cumul.N - applied.N), P2O5: pos(cumul.P2O5 - applied.P2O5), K2O: pos(cumul.K2O - applied.K2O) };
  const remaining: NPK = { N: pos(need.N - applied.N), P2O5: pos(need.P2O5 - applied.P2O5), K2O: pos(need.K2O - applied.K2O) };
  const excess = (['P2O5', 'K2O'] as Nutrient[]).filter((n) => need[n] > 0 && applied[n] > need[n] * 1.5);
  const scale = (k: number): NPK => ({ N: need.N * k, P2O5: need.P2O5 * k, K2O: need.K2O * k });
  return {
    area: plantArea(plant),
    yieldKg,
    need,
    low: scale(1 - NEED_MARGIN),
    high: scale(1 + NEED_MARGIN),
    legume,
    byStage,
    applied,
    dueNow,
    remaining,
    excess,
    soil,
    mulch,
    cover,
  };
}

/** Produits proposés selon les pratiques du jardin (bio : seulement ceux utilisables en AB). */
export function allowedProducts(products: Product[], settings: Pick<Settings, 'practices'>): Product[] {
  const organicOnly = settings.practices.some((p) => p === 'organic' || p === 'livingSoil' || p === 'permaculture');
  const ferts = products.filter((p) => p.kind !== 'amendment');
  return organicOnly ? ferts.filter((p) => p.organicOK) : ferts;
}

export interface Dose {
  product: Product;
  /** Quantité (g, ou mL pour un liquide). */
  amount: number;
  /** Ce que la dose apporte réellement (g). */
  gives: NPK;
  /** Dose par m² (g/m² ou mL/m²). */
  perM2: number;
  /** Élément qui a fixé la dose. */
  drivenBy: Nutrient;
  /** Éléments que la dose apporte au-delà de 150 % de ce qui est dû. */
  overshoot: Nutrient[];
}

/**
 * Dose d'un produit pour couvrir ce qui est dû maintenant : calée sur
 * l'azote si le produit en apporte, sinon sur la potasse, sinon sur le
 * phosphore. Renvoie null si le produit n'apporte rien d'utile.
 */
export function doseFor(product: Product, due: NPK, area: number): Dose | null {
  const order: Nutrient[] = ['N', 'K2O', 'P2O5'];
  for (const n of order) {
    const per = n === 'N' ? (product.N * product.nAvail) / 100 : product[n] / 100;
    if (per <= 0 || due[n] <= 0.05) continue;
    const amount = due[n] / per;
    const gives = supplied(product, amount);
    const overshoot = NUTRIENTS.filter((m) => m !== n && gives[m] > 0.5 && gives[m] > due[m] * 1.5);
    const liquidFactor = product.kind === 'liquid' ? 1 / (product.density ?? 1) : 1;
    return { product, amount: amount * liquidFactor, gives, perM2: (amount * liquidFactor) / Math.max(area, 0.01), drivenBy: n, overshoot };
  }
  return null;
}

/**
 * Produit le mieux adapté à ce qui est dû : celui dont la dose couvre
 * l'élément principal sans trop dépasser les autres, et, une fois la
 * culture en place, un azote assez rapide (un azote lent ne sert qu'en
 * fumure de fond, avant la plantation).
 */
export function bestProduct(products: Product[], due: NPK, area: number, inSeason: boolean): Product | null {
  let best: { p: Product; score: number } | null = null;
  for (const p of products) {
    const d = doseFor(p, due, area);
    if (!d) continue;
    let score = d.overshoot.length * 3;
    // Écart relatif entre ce que la dose apporte et ce qui est dû, sur les deux autres éléments.
    for (const n of NUTRIENTS) if (n !== d.drivenBy && due[n] > 0.5) score += Math.min(1, Math.abs(d.gives[n] - due[n]) / due[n]);
    if (inSeason && d.drivenBy === 'N' && p.nAvail < 0.6) score += 2;
    if (d.perM2 > 2000) score += 2; // des kilos par m² : amendement, pas engrais d'entretien
    if (!best || score < best.score) best = { p, score };
  }
  return best?.p ?? null;
}

/** Conversion d'affichage : oxyde → élément (g). */
export function toElement(n: Nutrient, grams: number): number {
  if (n === 'P2O5') return grams * OXIDE_TO_ELEMENT.P2O5;
  if (n === 'K2O') return grams * OXIDE_TO_ELEMENT.K2O;
  return grams;
}
