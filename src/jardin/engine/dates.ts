/**
 * Dates « jour de jardin » (AAAA-MM-JJ), calculées en UTC pour que
 * l'ajout de jours ne dépende ni du fuseau ni de l'heure d'été.
 */
import type { ISODate } from '../model';

const DAY = 86_400_000;

function toUTC(d: ISODate): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, day || 1);
}

function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Aujourd'hui, dans le fuseau de l'appareil. */
export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(d: ISODate, n: number): ISODate {
  return fromUTC(toUTC(d) + n * DAY);
}

/** Nombre de jours de a à b (b − a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY);
}

export function monthOf(d: ISODate): number {
  return Number(d.slice(5, 7));
}

export function yearOf(d: ISODate): number {
  return Number(d.slice(0, 4));
}

export function dayOfYear(d: ISODate): number {
  return diffDays(`${d.slice(0, 4)}-01-01`, d) + 1;
}

export function daysInMonth(d: ISODate): number {
  const y = yearOf(d);
  const m = monthOf(d);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Date ISO du jour n de l'année y. */
export function fromDayOfYear(y: number, n: number): ISODate {
  return addDays(`${y}-01-01`, n - 1);
}

/** Lundi de la semaine de d (clé stable pour les tâches hebdomadaires). */
export function weekKey(d: ISODate): ISODate {
  const dow = (new Date(toUTC(d)).getUTCDay() + 6) % 7;
  return addDays(d, -dow);
}

export function isValidISO(d: unknown): d is ISODate {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(toUTC(d));
}
