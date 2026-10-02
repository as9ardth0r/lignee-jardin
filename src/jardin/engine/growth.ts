/**
 * Courbe de croissance (phase 4) : hauteurs mesurées comparées à une
 * courbe de référence, et récolte cumulée comparée à ce qu'on attend.
 *
 * Référence de hauteur : courbe logistique (en S) sur l'âge équivalent en
 * degrés-jours, qui atteint la moitié de la hauteur adulte au début de la
 * floraison (ou à 45 % du délai de récolte) et plafonne ensuite. Hauteurs
 * adultes : ORDRES DE GRANDEUR au jardin (variétés courantes, tuteurées
 * pour la tomate et le concombre, haricot nain) ; la variété compte
 * beaucoup, d'où une lecture « en avance / dans la norme / en retard »
 * plutôt qu'un chiffre.
 */
import { SPECIES_BY_ID } from '../data/species';
import { speciesWithType } from '../data/speciesTypes';
import { FLOWER_INFO } from '../data/flowers';
import { HERB_HEIGHT } from '../data/herbs';
import type { GardenData, ISODate, Plant } from '../model';
import { addDays, diffDays } from './dates';
import { expectedYieldKg } from './nutrition';
import { eqAge, timeline } from './phenology';

/** Hauteur adulte de référence (cm). */
export const MATURE_HEIGHT: Record<string, number> = {
  tomato: 160, eggplant: 80, pepper: 70, potato: 60, zucchini: 60, cucumber: 180, melon: 40, squash: 50, watermelon: 40,
  sweetcorn: 200, bean: 50, pea: 80, broadbean: 100, lettuce: 25, endive: 30, spinach: 25, chard: 50, cornsalad: 10, rocket: 30,
  cabbage: 45, cauliflower: 50, broccoli: 60, brussels: 90, kale: 70, kohlrabi: 40, radish: 20, turnip: 35, carrot: 35, parsnip: 45,
  celeriac: 50, fennel: 60, parsley: 35, onion: 50, shallot: 40, garlic: 50, leek: 60, basil: 40, strawberry: 20, rhubarb: 70,
  sweetpotato: 40, beet: 40, chives: 30,
  ...HERB_HEIGHT,
  // Fleurs : milieu de la fourchette de hauteur du catalogue.
  ...Object.fromEntries(Object.entries(FLOWER_INFO).map(([id, f]) => [id, Math.round((f.height[0] + f.height[1]) / 2)])),
};

/** Jour (âge équivalent) où la plante atteint la moitié de sa hauteur adulte. */
export function halfHeightDay(speciesId: string, typeId?: string): number {
  const sp = speciesWithType(SPECIES_BY_ID[speciesId], typeId);
  const fl = sp.stages.find(([s]) => s === 'flowering');
  return Math.max(10, fl ? fl[1] : sp.daysToHarvest[0] * 0.45);
}

/** Hauteur de référence (cm) à un âge équivalent donné. */
export function referenceHeight(speciesId: string, age: number, typeId?: string): number {
  const h = MATURE_HEIGHT[speciesId] ?? 50;
  const t50 = halfHeightDay(speciesId, typeId);
  // Pente : de 2 % à 98 % de la hauteur adulte entre la levée et deux fois t50.
  const k = 4 / t50;
  return h / (1 + Math.exp(-k * (age - t50)));
}

export type GrowthState = 'ahead' | 'normal' | 'behind';

export interface GrowthPoint {
  date: ISODate;
  measured: number;
  reference: number;
}

export interface GrowthReport {
  points: GrowthPoint[];
  /** Courbe de référence datée (tous les 7 jours, du semis à la fin de saison). */
  curve: Array<{ date: ISODate; reference: number }>;
  latest?: GrowthPoint & { ratio: number; state: GrowthState };
  mature: number;
}

/** Écart toléré avant de parler d'avance ou de retard. */
export const GROWTH_TOLERANCE = 0.2;

export function growthReport(plant: Plant, data: GardenData, today: ISODate): GrowthReport {
  const tl = timeline(plant, data, today);
  const end = tl.seasonEnd < addDays(plant.sowDate, 400) ? tl.seasonEnd : addDays(plant.sowDate, 400);
  const curve: GrowthReport['curve'] = [];
  for (let d = plant.sowDate; d <= end; d = addDays(d, 7)) curve.push({ date: d, reference: referenceHeight(plant.speciesId, eqAge(plant, data, d), plant.typeId) });
  const points = data.observations
    .filter((o) => o.plantId === plant.id && o.heightCm && o.heightCm > 0 && o.date >= plant.sowDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((o) => ({ date: o.date, measured: o.heightCm!, reference: referenceHeight(plant.speciesId, eqAge(plant, data, o.date), plant.typeId) }));
  const last = points[points.length - 1];
  let latest: GrowthReport['latest'];
  if (last && last.reference >= 5) {
    const ratio = last.measured / last.reference;
    latest = { ...last, ratio, state: ratio > 1 + GROWTH_TOLERANCE ? 'ahead' : ratio < 1 - GROWTH_TOLERANCE ? 'behind' : 'normal' };
  }
  return { points, curve, latest, mature: MATURE_HEIGHT[plant.speciesId] ?? 50 };
}

export interface HarvestProgress {
  expectedKg: number;
  harvestedKg: number;
  /** Ce qu'on devrait avoir récolté à ce jour (kg), réparti linéairement sur la fenêtre de récolte. */
  dueKg: number;
  from: ISODate;
  to: ISODate;
  /** Récoltes cumulées (date, kg). */
  cumul: Array<{ date: ISODate; kg: number }>;
  state?: GrowthState;
}

export function harvestProgress(plant: Plant, data: GardenData, today: ISODate): HarvestProgress | null {
  // Les fleurs ne se « récoltent » pas en kilos.
  if (SPECIES_BY_ID[plant.speciesId]?.type === 'flower') return null;
  const tl = timeline(plant, data, today);
  const obs = data.observations.filter((o) => o.plantId === plant.id && o.harvestG && o.harvestG > 0).sort((a, b) => a.date.localeCompare(b.date));
  if (!obs.length && today < tl.harvestFrom) return null;
  let kg = 0;
  const cumul = obs.map((o) => ({ date: o.date, kg: (kg += o.harvestG! / 1000) }));
  const expectedKg = expectedYieldKg(plant);
  const span = Math.max(1, diffDays(tl.harvestFrom, tl.harvestTo));
  const elapsed = Math.max(0, Math.min(span, diffDays(tl.harvestFrom, today)));
  const dueKg = today < tl.harvestFrom ? 0 : (expectedKg * elapsed) / span;
  let state: GrowthState | undefined;
  if (dueKg > expectedKg * 0.15) {
    const r = kg / dueKg;
    state = r > 1 + GROWTH_TOLERANCE ? 'ahead' : r < 1 - 2 * GROWTH_TOLERANCE ? 'behind' : 'normal';
  }
  return { expectedKg, harvestedKg: kg, dueKg, from: tl.harvestFrom, to: tl.harvestTo, cumul, state };
}
