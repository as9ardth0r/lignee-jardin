/**
 * Paillage et broyat : ce que la couche apporte au sol.
 *
 * Masse posée = épaisseur × 10 L/m² par cm × densité apparente du paillis
 * tel qu'on l'étale. L'azote d'un paillis riche (herbe, trèfle, tonte :
 * rapport C/N bas) se libère en quelques mois ; celui d'un paillis
 * ligneux (paille, feuilles, broyat de branches : C/N élevé) ne se libère
 * presque pas la première année, et peut même en « emprunter » au sol si
 * on l'enfouit (faim d'azote). Libération modélisée en exponentielle
 * décroissante (constante τ en jours), plafonnée à la part disponible la
 * première année. Potasse : très soluble, libérée vite ; phosphore : moitié.
 *
 * Ordres de grandeur (guides de compostage et de paillage de l'Ademe et de
 * l'ITAB, tables de valeurs fertilisantes des résidus de culture) : la
 * densité et la teneur en eau d'un broyat varient beaucoup.
 */
import type { Bed, GardenData, ISODate, MulchEntry, MulchMaterial, Plant, Txt } from '../model';
import { addDays, diffDays } from './dates';
import { plantArea } from './crop';

const bedArea = (bed: Pick<Bed, 'w' | 'h'>) => Math.max(0.01, bed.w * bed.h);

export interface MulchInfo {
  name: Txt;
  emoji: string;
  /** Densité apparente telle qu'étalée (kg/L). */
  density: number;
  /** Teneurs du produit tel qu'étalé (% N, P₂O₅, K₂O). */
  N: number;
  P2O5: number;
  K2O: number;
  /** Rapport carbone / azote. */
  cn: number;
  /** Part de l'azote disponible pour les cultures la première année. */
  nAvail: number;
  /** Constante de décomposition (jours). */
  tau: number;
  /** Épaisseur conseillée (cm). */
  depth: [number, number];
  tip: Txt;
}

const T = (fr: string, en: string): Txt => ({ fr, en });

export const MULCH_MATERIALS: MulchMaterial[] = ['meadow', 'grass', 'hay', 'leaves', 'straw', 'woodChips', 'compost'];

export const MULCH_INFO: Record<MulchMaterial, MulchInfo> = {
  meadow: {
    name: T('Broyat d’herbe et de trèfle', 'Shredded grass and clover'), emoji: '🌾', density: 0.06, N: 0.8, P2O5: 0.2, K2O: 0.8, cn: 15, nAvail: 0.4, tau: 100, depth: [8, 15],
    tip: T('Riche en azote (le trèfle !) : il nourrit le sol en se décomposant au printemps. Le laisser en surface ; écarter du collet des plants. Les limaces y trouvent refuge : surveiller les semis.', 'Rich in nitrogen (the clover!): it feeds the soil as it breaks down in spring. Leave it on the surface; keep it off plant stems. Slugs shelter in it: watch seedlings.'),
  },
  grass: {
    name: T('Tonte de gazon', 'Grass clippings'), emoji: '🌱', density: 0.1, N: 0.5, P2O5: 0.15, K2O: 0.6, cn: 15, nAvail: 0.5, tau: 60, depth: [2, 5],
    tip: T('En couches fines (2 à 3 cm) renouvelées : une couche épaisse d’herbe fraîche fermente et colle. La faire faner un jour avant.', 'In thin layers (2–3 cm) topped up: a thick layer of fresh grass ferments and mats. Let it wilt for a day first.'),
  },
  hay: {
    name: T('Foin', 'Hay'), emoji: '🌾', density: 0.04, N: 1.5, P2O5: 0.4, K2O: 1.8, cn: 28, nAvail: 0.2, tau: 200, depth: [10, 20],
    tip: T('Bon paillis nourrissant mais peut contenir des graines d’herbes. Excellent sous courges et tomates.', 'A good feeding mulch but may contain weed seeds. Excellent under squash and tomatoes.'),
  },
  leaves: {
    name: T('Feuilles mortes', 'Fallen leaves'), emoji: '🍂', density: 0.05, N: 0.8, P2O5: 0.1, K2O: 0.3, cn: 50, nAvail: 0.05, tau: 300, depth: [10, 15],
    tip: T('Paillis d’hiver qui protège le sol et nourrit les vers de terre ; peu d’azote la première année. Broyées à la tondeuse, elles s’envolent moins.', 'Winter mulch that shields the soil and feeds earthworms; little nitrogen in the first year. Shredded with the mower, they blow away less.'),
  },
  straw: {
    name: T('Paille', 'Straw'), emoji: '🟨', density: 0.03, N: 0.5, P2O5: 0.2, K2O: 1.2, cn: 80, nAvail: 0, tau: 365, depth: [8, 15],
    tip: T('Garde l’humidité et les fruits propres (fraises, courges) mais n’apporte pas d’azote : à ne jamais enfouir (faim d’azote). Éviter les pailles traitées aux herbicides hormonaux.', 'Keeps moisture in and fruit clean (strawberries, squash) but brings no nitrogen: never dig it in (nitrogen lock-up). Avoid straw treated with hormone weedkillers.'),
  },
  woodChips: {
    name: T('Broyat de branches (BRF)', 'Wood chips (ramial chipped wood)'), emoji: '🪵', density: 0.25, N: 0.3, P2O5: 0.1, K2O: 0.3, cn: 100, nAvail: 0, tau: 600, depth: [3, 7],
    tip: T('Nourrit les champignons du sol et améliore la structure sur plusieurs années. En surface uniquement, couche fine au potager ; plus épais au pied des arbres et des petits fruits.', 'Feeds soil fungi and improves structure over several years. Surface only, a thin layer in the vegetable garden; thicker under trees and soft fruit.'),
  },
  compost: {
    name: T('Compost mûr en surface', 'Mature compost on the surface'), emoji: '🟫', density: 0.5, N: 0.6, P2O5: 0.4, K2O: 0.6, cn: 12, nAvail: 0.1, tau: 365, depth: [1, 3],
    tip: T('Amendement plus que paillis : il libère son azote lentement sur plusieurs années.', 'More soil improver than mulch: it releases its nitrogen slowly over several years.'),
  },
};

export interface NPKg {
  N: number;
  P2O5: number;
  K2O: number;
}

/** Masse étalée (kg par m²). */
export function mulchMassKgM2(m: Pick<MulchEntry, 'material' | 'depthCm'>): number {
  return Math.max(0, m.depthCm) * 10 * MULCH_INFO[m.material].density;
}

/** Éléments contenus dans la couche (g par m²). */
export function mulchContentM2(m: Pick<MulchEntry, 'material' | 'depthCm'>): NPKg {
  const kg = mulchMassKgM2(m);
  const i = MULCH_INFO[m.material];
  return { N: kg * i.N * 10, P2O5: kg * i.P2O5 * 10, K2O: kg * i.K2O * 10 };
}

/** Part libérée (0–1) de ce qui sera disponible la première année, à t jours de la pose. */
function releasedShare(material: MulchMaterial, days: number): number {
  if (days <= 0) return 0;
  const t = Math.min(days, 365);
  const tau = MULCH_INFO[material].tau;
  return (1 - Math.exp(-t / tau)) / (1 - Math.exp(-365 / tau));
}

/** Éléments libérés (g par m²) par une couche entre deux dates. */
export function mulchReleasedM2(m: MulchEntry, from: ISODate, to: ISODate): NPKg {
  if (to <= from) return { N: 0, P2O5: 0, K2O: 0 };
  const c = mulchContentM2(m);
  const i = MULCH_INFO[m.material];
  const a = releasedShare(m.material, diffDays(m.date, from));
  const b = releasedShare(m.material, diffDays(m.date, to));
  const d = Math.max(0, b - a);
  return { N: c.N * i.nAvail * d, P2O5: c.P2O5 * 0.5 * d, K2O: c.K2O * 0.8 * d };
}

/** Éléments libérés par le paillage de la planche pendant la saison d'une culture, pour sa part de la planche (g). */
export function mulchForPlant(plant: Plant, bed: Bed | undefined, data: GardenData, seasonEnd: ISODate): NPKg {
  const out = { N: 0, P2O5: 0, K2O: 0 };
  if (!bed) return out;
  const share = Math.min(1, plantArea(plant) / Math.max(0.01, bedArea(bed)));
  for (const m of data.mulches ?? []) {
    if (m.bedId !== bed.id) continue;
    const from = m.date > plant.sowDate ? m.date : plant.sowDate;
    const to = seasonEnd < addDays(m.date, 365) ? seasonEnd : addDays(m.date, 365);
    const r = mulchReleasedM2(m, from, to);
    out.N += r.N * bedArea(bed) * share;
    out.P2O5 += r.P2O5 * bedArea(bed) * share;
    out.K2O += r.K2O * bedArea(bed) * share;
  }
  return out;
}

/** Bilan d'une planche sur les 12 mois qui suivent chaque pose encore active (g par m²). */
export function bedMulchSummary(bed: Bed, data: GardenData, today: ISODate): { active: MulchEntry[]; yearN: number; yearK: number; soFarN: number; lockup: boolean } {
  const active = (data.mulches ?? []).filter((m) => m.bedId === bed.id && m.date <= today && diffDays(m.date, today) < 365).sort((a, b) => b.date.localeCompare(a.date));
  let yearN = 0;
  let yearK = 0;
  let soFarN = 0;
  for (const m of active) {
    const y = mulchReleasedM2(m, m.date, addDays(m.date, 365));
    yearN += y.N;
    yearK += y.K2O;
    soFarN += mulchReleasedM2(m, m.date, today).N;
  }
  return { active, yearN, yearK, soFarN, lockup: active.some((m) => MULCH_INFO[m.material].cn >= 40) };
}

/** Une couche posée il y a moins d'un an compte comme paillage pour l'arrosage. */
export function bedIsMulched(bed: Bed, data: GardenData, today: ISODate): boolean {
  return bed.mulch || (data.mulches ?? []).some((m) => m.bedId === bed.id && m.date <= today && diffDays(m.date, today) < 365);
}
