/**
 * Cycle d'une culture : calendrier décalé selon le climat, stade du jour,
 * fenêtre de récolte, coefficient cultural (Kc) et surface occupée.
 */
import { CLIMATES, springShiftDays } from '../data/climate';
import { SPECIES_BY_ID } from '../data/species';
import { speciesWithType, typesOf } from '../data/speciesTypes';
import type { ClimateId, ISODate, MonthRange, Plant, Species, StageId, Variety } from '../model';
import { addDays, diffDays } from './dates';

/** L'espèce d'une culture, avec le calendrier et la durée de son type s'il est précisé. */
export function speciesOf(plant: Pick<Plant, 'speciesId'> & { typeId?: string }): Species {
  const s = SPECIES_BY_ID[plant.speciesId];
  if (!s) throw new Error(`espèce inconnue : ${plant.speciesId}`);
  return speciesWithType(s, plant.typeId);
}

// --- Calendrier ----------------------------------------------------------

function wrapMonth(m: number): number {
  return ((((m - 1) % 12) + 12) % 12) + 1;
}

/**
 * Décale une fenêtre de référence (région parisienne) vers un autre climat :
 * les fenêtres de printemps suivent la date de dernière gelée, celles
 * d'automne la date de première gelée (en sens inverse : un automne plus
 * long permet de semer plus tard).
 */
export function shiftWindows(ranges: MonthRange[] | undefined, climate: ClimateId): MonthRange[] {
  if (!ranges) return [];
  const spring = Math.round(springShiftDays(climate) / 30);
  const autumn = Math.round((CLIMATES[climate].firstFrost - CLIMATES.parisian.firstFrost) / 30);
  return ranges.map(([a, b]) => {
    const s = a >= 8 ? autumn : a <= 7 ? spring : 0;
    return [wrapMonth(a + s), wrapMonth(b + s)] as MonthRange;
  });
}

export function inWindow(month: number, ranges: MonthRange[]): boolean {
  return ranges.some(([a, b]) => (a <= b ? month >= a && month <= b : month >= a || month <= b));
}

export interface CropCalendar {
  sowIndoor: MonthRange[];
  sowOutdoor: MonthRange[];
  plantOut: MonthRange[];
}

export function cropCalendar(sp: Species, climate: ClimateId): CropCalendar {
  return {
    sowIndoor: shiftWindows(sp.sowIndoor, climate),
    sowOutdoor: shiftWindows(sp.sowOutdoor, climate),
    plantOut: shiftWindows(sp.plantOut, climate),
  };
}

/**
 * Type de culture conseillé à une date : celui dont une fenêtre de semis ou
 * de plantation (décalée selon le climat) contient le mois ; sinon celui
 * dont la prochaine fenêtre arrive le plus tôt. Chaîne vide sans types.
 */
export function seasonalType(speciesId: string, today: ISODate, climate: ClimateId): string {
  const sp = SPECIES_BY_ID[speciesId];
  const types = typesOf(speciesId);
  if (!sp || !types.length) return '';
  const month = Number(today.slice(5, 7));
  let best = '';
  let bestWait = 99;
  for (const t of types) {
    const cal = cropCalendar(speciesWithType(sp, t.id), climate);
    const windows = [...cal.sowIndoor, ...cal.sowOutdoor, ...cal.plantOut];
    if (inWindow(month, windows)) return t.id;
    for (const [a] of windows) {
      const wait = (a - month + 12) % 12;
      if (wait < bestWait) {
        bestWait = wait;
        best = t.id;
      }
    }
  }
  return best;
}

/** Une espèce mise en place par plants, bulbes ou tubercules (sans semis). */
export function isPlanted(sp: Species): boolean {
  return !sp.sowIndoor && !sp.sowOutdoor;
}

// --- Stades -------------------------------------------------------------

/** Facteur d'échelle d'une variété (précoce < 1 < tardive). */
export function varietyScale(sp: Species, variety?: Pick<Variety, 'daysToHarvest'>): number {
  if (!variety?.daysToHarvest) return 1;
  return Math.min(2, Math.max(0.5, variety.daysToHarvest / sp.daysToHarvest[0]));
}

export function ageDays(plant: Pick<Plant, 'sowDate'>, today: ISODate): number {
  return diffDays(plant.sowDate, today);
}

export type StageState = StageId | 'planned' | 'ended';

export interface StageInfo {
  stage: StageState;
  age: number;
  /** Avancement dans le cycle (0–1). */
  progress: number;
  /** Début de chaque stade (date), le premier au semis. */
  starts: Array<{ stage: StageId; date: ISODate; day: number }>;
  harvestFrom: ISODate;
  harvestTo: ISODate;
  seasonEnd: ISODate;
  scale: number;
}

export function stageInfo(plant: Plant, today: ISODate, variety?: Pick<Variety, 'daysToHarvest'>): StageInfo {
  const sp = speciesOf(plant);
  const scale = varietyScale(sp, variety);
  const age = ageDays(plant, today);
  const season = Math.round(sp.season * scale);
  const starts = sp.stages.map(([stage, d]) => ({ stage, day: Math.round(d * scale), date: addDays(plant.sowDate, Math.round(d * scale)) }));
  let stage: StageState;
  if (plant.status === 'planned') stage = 'planned';
  else if (plant.status === 'ended') stage = 'ended';
  else {
    stage = starts[0].stage;
    for (const s of starts) if (age >= s.day) stage = s.stage;
  }
  return {
    stage,
    age,
    progress: plant.status === 'planned' ? 0 : Math.max(0, Math.min(1, age / season)),
    starts,
    harvestFrom: addDays(plant.sowDate, Math.round(sp.daysToHarvest[0] * scale)),
    harvestTo: addDays(plant.sowDate, Math.round(sp.daysToHarvest[1] * scale)),
    seasonEnd: addDays(plant.sowDate, season),
    scale,
  };
}

/** Une culture occupe-t-elle sa planche à cette date ? */
export function isActiveOn(plant: Plant, date: ISODate): boolean {
  if (plant.status === 'planned') return false;
  if (plant.sowDate > date) return false;
  if (plant.endDate && plant.endDate < date) return false;
  // Semée à l'abri et pas encore repiquée : elle n'est pas encore sur la planche.
  if (plant.indoor && (!plant.transplantDate || plant.transplantDate > date)) return false;
  return true;
}

/**
 * Coefficient cultural FAO-56 (méthode du Kc par segments) : Kc initial
 * pendant la levée, montée linéaire jusqu'au plein développement (premier
 * stade de floraison, formation ou récolte), plateau, puis descente sur
 * les 15 derniers % de la saison.
 */
export function kcAt(sp: Species, ageDay: number, scale = 1): number {
  const [kIni, kMid, kEnd] = sp.kc;
  const season = sp.season * scale;
  const devStart = (sp.stages.find(([s]) => s === 'vegetative')?.[1] ?? 0) * scale;
  const midStart =
    (sp.stages.find(([s]) => s === 'flowering' || s === 'bulking' || s === 'harvest' || s === 'fruiting')?.[1] ?? sp.season * 0.4) * scale;
  const lateStart = season * 0.85;
  if (ageDay <= devStart) return kIni;
  if (ageDay < midStart) return kIni + ((kMid - kIni) * (ageDay - devStart)) / Math.max(1, midStart - devStart);
  if (ageDay < lateStart) return kMid;
  if (ageDay >= season) return kEnd;
  return kMid + ((kEnd - kMid) * (ageDay - lateStart)) / Math.max(1, season - lateStart);
}

// --- Surface -----------------------------------------------------------

/** Surface occupée (m²) : saisie, ou nombre de pieds × espacement. */
export function plantArea(plant: Pick<Plant, 'area' | 'count' | 'speciesId'>): number {
  if (plant.area && plant.area > 0) return plant.area;
  const sp = SPECIES_BY_ID[plant.speciesId];
  if (!sp) return 0;
  return Math.max(0.01, (plant.count * sp.spacing.row * sp.spacing.inRow) / 10_000);
}

/** Nombre de pieds qui tiennent sur une surface. */
export function plantsForArea(sp: Species, area: number): number {
  return Math.max(1, Math.floor((area * 10_000) / (sp.spacing.row * sp.spacing.inRow)));
}
