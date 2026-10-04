/**
 * Récupérateurs d'eau de pluie : la cuve se remplit avec la pluie tombée
 * sur le toit qui l'alimente (1 mm sur 1 m² = 1 L, moins environ 20 %
 * perdus : évaporation, premier flot, débordement de la gouttière) et se
 * vide des arrosages qu'on y puise. Le niveau est recalé chaque fois qu'on
 * le relève.
 */
import type { GardenData, ISODate, RainTank } from '../model';
import { addDays, daysInMonth, diffDays, monthOf } from './dates';
import { CLIMATES } from '../data/climate';
import { activeWeather, rainNext } from './weather';

/** Part de la pluie du toit qui arrive dans la cuve. */
export const ROOF_EFFICIENCY = 0.8;

export interface TankDay {
  date: ISODate;
  inflow: number;
  draw: number;
  level: number;
  overflow: number;
}

export interface TankStatus {
  level: number;
  ratio: number;
  history: TankDay[];
  /** Arrosage puisé par jour en moyenne (14 derniers jours). */
  drawPerDay: number;
  /** Jours avant d'être vide au rythme actuel, pluie prévue comprise (null si rien n'est puisé). */
  daysLeft: number | null;
  /** Litres attendus avec la pluie prévue dans les 2 jours. */
  expectedInflow: number;
  /** Litres perdus par débordement depuis le dernier relevé. */
  overflowL: number;
}

/** Pluie du jour (mm) : relevé du pluviomètre, sinon météo locale, sinon normales si le jardin les utilise. */
function rainOf(data: GardenData, date: ISODate, logged: Map<ISODate, number>, wx: ReturnType<typeof activeWeather>): number {
  const l = logged.get(date);
  if (l !== undefined) return l;
  const w = wx.get(date);
  if (w && data.settings.rainSource !== 'manual') return w.rain;
  if (data.settings.rainSource === 'average') return CLIMATES[data.settings.climate].rain[monthOf(date) - 1] / daysInMonth(date);
  return 0;
}

export function tankStatus(tank: RainTank, data: GardenData, today: ISODate): TankStatus {
  const logged = new Map<ISODate, number>();
  for (const e of data.water) if (e.kind === 'rain') logged.set(e.date, (logged.get(e.date) ?? 0) + e.amount);
  const draws = new Map<ISODate, number>();
  for (const e of data.water) if (e.kind === 'irrigation' && e.tankId === tank.id) draws.set(e.date, (draws.get(e.date) ?? 0) + e.amount);
  const wx = activeWeather(data);
  let level = Math.max(0, Math.min(tank.capacityL, tank.level));
  let overflowL = 0;
  const history: TankDay[] = [];
  const n = Math.max(0, Math.min(730, diffDays(tank.since, today)));
  for (let i = 1; i <= n; i++) {
    const date = addDays(tank.since, i);
    const inflow = rainOf(data, date, logged, wx) * tank.roofM2 * ROOF_EFFICIENCY;
    const draw = draws.get(date) ?? 0;
    const raw = level + inflow - draw;
    const overflow = Math.max(0, raw - tank.capacityL);
    overflowL += overflow;
    level = Math.max(0, Math.min(tank.capacityL, raw));
    history.push({ date, inflow, draw, level, overflow });
  }
  // L'arrosage noté le jour même du relevé est déjà dans le niveau relevé ; celui d'avant aussi.
  const recent = [...draws.entries()].filter(([d]) => d > addDays(today, -14) && d <= today).reduce((s, [, v]) => s + v, 0);
  const drawPerDay = recent / 14;
  const expectedInflow = data.settings.weather ? rainNext(data.weather, today, 2) * tank.roofM2 * ROOF_EFFICIENCY : 0;
  const daysLeft = drawPerDay > 0.5 ? Math.floor((level + expectedInflow) / drawPerDay) : null;
  return { level: Math.round(level), ratio: tank.capacityL > 0 ? level / tank.capacityL : 0, history: history.slice(-30), drawPerDay, daysLeft, expectedInflow: Math.round(expectedInflow), overflowL: Math.round(overflowL) };
}

/** Taille de cuve conseillée pour un toit : ce que donne un gros orage d'été (≈ 20 mm). */
export function suggestedCapacity(roofM2: number): number {
  return Math.round((roofM2 * 20 * ROOF_EFFICIENCY) / 50) * 50;
}

/** Cuves presque vides (moins de 15 % ou moins de 4 jours d'arrosage). */
export function lowTanks(data: GardenData, today: ISODate): Array<{ tank: RainTank; status: TankStatus }> {
  return (data.rainTanks ?? []).map((tank) => ({ tank, status: tankStatus(tank, data, today) })).filter(({ status }) => status.ratio < 0.15 || (status.daysLeft !== null && status.daysLeft < 4));
}
