/**
 * La Lune au jardin — affichage TRADITIONNEL, facultatif.
 *
 * Position de la Lune et du Soleil par les séries abrégées de Meeus
 * (Astronomical Algorithms, chap. 25 et 47) : longitude de la Lune à
 * ~0,3°, ce qui place les phases à quelques heures près et la lune
 * montante / descendante au jour près. Aucun réseau : tout est calculé.
 *
 * Les règles jardinières associées (semer en lune montante, planter en
 * lune descendante…) relèvent de la tradition : aucune étude contrôlée
 * n'a montré d'effet sur les cultures. L'app les affiche à titre
 * d'information et ne s'en sert JAMAIS pour ses dates ni ses conseils.
 */
import type { ISODate } from '../model';
import { addDays } from './dates';

const RAD = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
const sin = (d: number) => Math.sin(d * RAD);
const cos = (d: number) => Math.cos(d * RAD);

/** Jour julien d'un instant (ms depuis 1970, UTC). */
function julian(ms: number): number {
  return ms / 86_400_000 + 2_440_587.5;
}

export interface MoonPosition {
  /** Longitude écliptique de la Lune (°). */
  lon: number;
  /** Déclinaison (°), positive au nord. */
  dec: number;
  /** Élongation Lune – Soleil (°) : 0 nouvelle lune, 180 pleine lune. */
  elong: number;
  /** Fraction éclairée du disque (0–1). */
  illum: number;
}

export function moonPosition(ms: number): MoonPosition {
  const T = (julian(ms) - 2_451_545) / 36_525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = 297.8501921 + 445267.1114034 * T;
  const M = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;
  const F = 93.272095 + 483202.0175233 * T;
  const lon = norm(
    Lp +
      6.288774 * sin(Mp) +
      1.274027 * sin(2 * D - Mp) +
      0.658314 * sin(2 * D) +
      0.213618 * sin(2 * Mp) -
      0.185116 * sin(M) -
      0.114332 * sin(2 * F) +
      0.058793 * sin(2 * D - 2 * Mp) +
      0.057066 * sin(2 * D - M - Mp) +
      0.053322 * sin(2 * D + Mp) +
      0.045758 * sin(2 * D - M) -
      0.040923 * sin(M - Mp) -
      0.03472 * sin(D) -
      0.030383 * sin(M + Mp) +
      0.015327 * sin(2 * D - 2 * F) -
      0.012528 * sin(Mp + 2 * F) +
      0.01098 * sin(Mp - 2 * F),
  );
  const lat =
    5.128122 * sin(F) +
    0.280602 * sin(Mp + F) +
    0.277693 * sin(Mp - F) +
    0.173237 * sin(2 * D - F) +
    0.055413 * sin(2 * D - F + Mp) +
    0.046271 * sin(2 * D - F - Mp) +
    0.032573 * sin(2 * D + F) +
    0.017198 * sin(2 * Mp + F);
  const eps = 23.439291 - 0.0130042 * T;
  const dec = Math.asin(sin(lat) * cos(eps) + cos(lat) * sin(eps) * sin(lon)) / RAD;
  // Soleil : longitude vraie (série courte).
  const L0 = 280.46646 + 36000.76983 * T;
  const sunLon = norm(L0 + (1.914602 - 0.004817 * T) * sin(M) + 0.019993 * sin(2 * M) + 0.000289 * sin(3 * M));
  const elong = norm(lon - sunLon);
  return { lon, dec, elong, illum: (1 - cos(elong)) / 2 };
}

export type MoonPhase = 'new' | 'waxingCrescent' | 'firstQuarter' | 'waxingGibbous' | 'full' | 'waningGibbous' | 'lastQuarter' | 'waningCrescent';

const PHASES: MoonPhase[] = ['new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'full', 'waningGibbous', 'lastQuarter', 'waningCrescent'];
export const PHASE_EMOJI: Record<MoonPhase, string> = {
  new: '🌑',
  waxingCrescent: '🌒',
  firstQuarter: '🌓',
  waxingGibbous: '🌔',
  full: '🌕',
  waningGibbous: '🌖',
  lastQuarter: '🌗',
  waningCrescent: '🌘',
};

/** Midi à Paris (≈ 10 h ou 11 h UTC) : l'instant de référence d'une journée. */
function noon(date: ISODate): number {
  return Date.parse(`${date}T11:00:00Z`);
}

export interface MoonDay {
  phase: MoonPhase;
  illum: number;
  /** Lune croissante (de la nouvelle à la pleine lune). */
  waxing: boolean;
  /** Lune montante : sa hauteur dans le ciel augmente d'un jour à l'autre. */
  ascending: boolean;
  /** Fin de la période montante ou descendante en cours. */
  turnDate: ISODate;
  nextFull: ISODate;
  nextNew: ISODate;
}

function isAscending(ms: number): boolean {
  return moonPosition(ms + 43_200_000).dec > moonPosition(ms - 43_200_000).dec;
}

/** Date (jour de Paris) du prochain passage de l'élongation par `target` (0 ou 180°). */
function nextElong(from: number, target: number): ISODate {
  const step = 3_600_000 * 3;
  let prev = norm(moonPosition(from).elong - target);
  for (let t = from + step; t < from + 31 * 86_400_000; t += step) {
    const e = norm(moonPosition(t).elong - target);
    if (e < prev) {
      // Passage par 0 entre t - step et t : interpolation linéaire.
      const frac = (360 - prev) / (360 - prev + e);
      return new Date(t - step + frac * step + 7_200_000).toISOString().slice(0, 10);
    }
    prev = e;
  }
  return new Date(from).toISOString().slice(0, 10);
}

export function moonDay(date: ISODate): MoonDay {
  const t = noon(date);
  const pos = moonPosition(t);
  const phase = PHASES[Math.floor(norm(pos.elong + 22.5) / 45) % 8];
  const ascending = isAscending(t);
  let turnDate = date;
  for (let i = 1; i <= 16; i++) {
    const d = addDays(date, i);
    if (isAscending(noon(d)) !== ascending) {
      turnDate = d;
      break;
    }
  }
  return { phase, illum: pos.illum, waxing: pos.elong < 180, ascending, turnDate, nextFull: nextElong(t, 180), nextNew: nextElong(t, 0) };
}
