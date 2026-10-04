/**
 * Bilan hydrique quotidien par planche (FAO-56 simplifié) :
 *   ETc = Kc × ET₀ × (paillage ? 0,75 : 1)
 *   R(j) = min(RU, max(0, R(j−1) + pluie efficace + arrosage − ETc))
 * RU = réserve utile du sol sur la profondeur des racines. Conseil :
 * arroser quand R passe sous la moitié de RU.
 */
import { AWC_MM_PER_CM, CLIMATES } from '../data/climate';
import type { Bed, GardenData, ISODate, Plant, Settings } from '../model';
import { addDays, daysInMonth, diffDays, monthOf } from './dates';
import { isActiveOn, kcAt, speciesOf, varietyScale } from './crop';
import { eqAge } from './phenology';
import { activeWeather, rainNext } from './weather';
import { moistureByDay } from './sensors';
import { bedIsMulched } from './mulch';

/** Réduction d'évaporation par un paillage (hypothèse de départ, à recaler). */
export const MULCH_FACTOR = 0.75;
/** Kc d'un sol nu (évaporation seule). */
export const BARE_KC = 0.3;
/** Part de la pluie réellement utile au sol (le reste ruisselle ou s'évapore). */
export const RAIN_EFFICIENCY = 0.8;
/** Seuil d'arrosage (fraction de la réserve utile). */
export const WATER_THRESHOLD = 0.5;
/** Arrosage conseillé en une fois au plus (mm = L/m²) : au-delà, l'eau file sous les racines. */
export const WATER_DOSE_MAX_MM = 20;
/** Jours simulés au maximum avant aujourd'hui. */
export const HISTORY_DAYS = 120;

export function bedArea(bed: Pick<Bed, 'w' | 'h'>): number {
  return Math.max(0.01, bed.w * bed.h);
}

export function activePlants(bed: Bed, plants: Plant[], date: ISODate): Plant[] {
  return plants.filter((p) => p.bedId === bed.id && isActiveOn(p, date));
}

/** Réserve utile (mm) de la planche à une date, selon la texture et les racines présentes. */
export function reserveMm(bed: Bed, settings: Pick<Settings, 'texture'>, active: Plant[]): number {
  const depth = Math.max(0.2, ...active.map((p) => speciesOf(p).rootDepth));
  return AWC_MM_PER_CM[bed.texture ?? settings.texture] * depth * 100;
}

export interface WaterDay {
  date: ISODate;
  et0: number;
  kc: number;
  etc: number;
  rain: number;
  irrigation: number;
  reserve: number;
  ru: number;
  /** ET₀ et pluie venues de la météo locale (sinon normales ou relevés). */
  measured: boolean;
  /** Réserve recalée ce jour-là sur une sonde d'humidité du sol. */
  sensor: boolean;
}

/** Kc de la planche : le plus fort des cultures présentes, lu sur leur âge équivalent (degrés-jours). */
function kcOfBed(active: Plant[], date: ISODate, data: GardenData): number {
  if (active.length === 0) return BARE_KC;
  return Math.max(
    BARE_KC,
    ...active.map((p) => {
      const sp = speciesOf(p);
      const v = p.varietyId ? data.varieties.find((x) => x.id === p.varietyId) : undefined;
      return kcAt(sp, eqAge(p, data, date), varietyScale(sp, v));
    }),
  );
}

/** Simulation jour par jour, de `from` à `to` inclus ; réserve pleine au départ. */
export function simulateBed(bed: Bed, data: GardenData, from: ISODate, to: ISODate): WaterDay[] {
  const clim = CLIMATES[data.settings.climate];
  const wx = activeWeather(data);
  const days: WaterDay[] = [];
  const rainByDay = new Map<ISODate, number>();
  const irrByDay = new Map<ISODate, number>();
  const area = bedArea(bed);
  for (const e of data.water) {
    if (e.kind === 'rain') rainByDay.set(e.date, (rainByDay.get(e.date) ?? 0) + e.amount);
    else if (e.bedId === bed.id) irrByDay.set(e.date, (irrByDay.get(e.date) ?? 0) + e.amount / area);
  }
  const n = diffDays(from, to);
  const probe = moistureByDay(bed.id, bed.texture ?? data.settings.texture, data);
  let reserve = -1;
  for (let i = 0; i <= n; i++) {
    const date = addDays(from, i);
    const m = monthOf(date);
    const active = activePlants(bed, data.plants, date);
    const ru = reserveMm(bed, data.settings, active);
    if (reserve < 0) reserve = ru;
    const w = wx.get(date);
    const et0 = w ? w.et0 : clim.et0[m - 1];
    const kc = kcOfBed(active, date, data);
    const etc = kc * et0 * (bedIsMulched(bed, data, date) ? MULCH_FACTOR : 1);
    // Pluie : relevé du pluviomètre, sinon météo locale (sauf si le jardinier note tout), sinon moyenne du climat.
    let rain = 0;
    if (bed.kind !== 'greenhouse') {
      const logged = rainByDay.get(date);
      if (logged !== undefined) rain = logged * RAIN_EFFICIENCY;
      else if (w && data.settings.rainSource !== 'manual') rain = w.rain * RAIN_EFFICIENCY;
      else if (data.settings.rainSource === 'average') rain = (clim.rain[m - 1] / daysInMonth(date)) * RAIN_EFFICIENCY;
    }
    const irrigation = irrByDay.get(date) ?? 0;
    reserve = Math.min(ru, Math.max(0, reserve + rain + irrigation - etc));
    // Une sonde d'humidité du sol remplace le calcul : la mesure fait foi.
    const f = probe.get(date);
    if (f !== undefined) reserve = f * ru;
    days.push({ date, et0, kc, etc, rain, irrigation, reserve, ru, measured: !!w, sensor: f !== undefined });
  }
  return days;
}

export interface WaterAdvice {
  bedId: string;
  ru: number;
  reserve: number;
  ratio: number;
  etcToday: number;
  /** Faut-il arroser aujourd'hui ? */
  water: boolean;
  /** Litres conseillés maintenant : de quoi remonter la réserve à 90 % de RU, sans dépasser 20 mm par arrosage. */
  liters: number;
  /** Jours avant d'atteindre le seuil (si on n'arrose pas et qu'il ne pleut pas). */
  daysLeft: number;
  hasPlants: boolean;
  history: WaterDay[];
  /** Pluie utile annoncée sur 48 h (mm) ; si elle suffit, l'arrosage est reporté. */
  rainExpected: number;
  postponed: boolean;
  /** Durée de goutte-à-goutte équivalente (min), si le débit de la planche est connu. */
  dripMinutes?: number;
  /** La réserve du jour vient d'une sonde d'humidité. */
  sensorToday: boolean;
}

/** Pluie utile annoncée (mm sur 48 h) à partir de laquelle on reporte l'arrosage. */
export const POSTPONE_RAIN_MM = 8;

export function waterAdvice(bed: Bed, data: GardenData, today: ISODate): WaterAdvice {
  const starts = data.plants.filter((p) => p.bedId === bed.id && p.status !== 'planned').map((p) => p.transplantDate ?? p.sowDate);
  const earliest = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : today;
  const from = earliest < addDays(today, -HISTORY_DAYS) ? addDays(today, -HISTORY_DAYS) : earliest > today ? today : earliest;
  const history = simulateBed(bed, data, from, today);
  const last = history[history.length - 1];
  const hasPlants = activePlants(bed, data.plants, today).length > 0;
  const ratio = last.ru > 0 ? last.reserve / last.ru : 1;
  const area = bedArea(bed);
  // Un bac hydroponique n'a pas de réserve du sol : voir le suivi EC/pH.
  const needed = hasPlants && bed.kind !== 'hydro' && ratio < WATER_THRESHOLD;
  const rainExpected = bed.kind === 'greenhouse' || !data.settings.weather ? 0 : rainNext(data.weather, today, 2) * RAIN_EFFICIENCY;
  // On n'attend la pluie que si la réserve n'est pas déjà presque vide.
  const postponed = needed && rainExpected >= POSTPONE_RAIN_MM && last.reserve >= last.ru * 0.2;
  const water = needed && !postponed;
  const liters = water ? Math.max(0, Math.min(last.ru * 0.9 - last.reserve, WATER_DOSE_MAX_MM) * area) : 0;
  const daysLeft = last.etc > 0 ? Math.max(0, Math.floor((last.reserve - last.ru * WATER_THRESHOLD) / last.etc)) : 99;
  const dripMinutes = water && bed.drip && bed.dripFlow && bed.dripFlow > 0 ? Math.round((liters / bed.dripFlow) * 60) : undefined;
  const sensorToday = last.sensor;
  return { bedId: bed.id, ru: last.ru, reserve: last.reserve, ratio, etcToday: last.etc, water, liters, daysLeft, hasPlants, history, rainExpected, postponed, dripMinutes, sensorToday };
}
