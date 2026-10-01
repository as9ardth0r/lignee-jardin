/**
 * Ensoleillement des planches : course du soleil (formules astronomiques
 * simplifiées, heure solaire vraie) et ombres portées des obstacles du plan
 * (maison, mur, arbre, haie), modélisés comme des blocs de hauteur donnée.
 *
 * Plan : x vers la droite, y vers le bas, en mètres ; `planNorth` donne la
 * direction du nord (0 = haut du plan, 90 = droite…).
 */
import type { Bed, Obstacle, Sun } from '../model';

const RAD = Math.PI / 180;
/** Latitude par défaut (centre de la France) si le jardin n'est pas localisé. */
export const DEFAULT_LAT = 47;
/** Soleil trop bas pour compter (degrés). */
export const MIN_ALT = 5;

export interface SunPos {
  /** Hauteur au-dessus de l'horizon (degrés). */
  alt: number;
  /** Azimut depuis le nord, sens horaire (degrés) : 90 = est, 180 = sud. */
  az: number;
}

/** Position du soleil pour un jour de l'année et une heure solaire. */
export function sunPosition(lat: number, doy: number, hour: number): SunPos {
  const decl = 23.44 * Math.sin((2 * Math.PI * (284 + doy)) / 365) * RAD;
  const phi = lat * RAD;
  const h = (hour - 12) * 15 * RAD;
  const sinAlt = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(h);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  // Azimut compté depuis le sud (positif vers l'ouest), ramené au nord.
  const azSouth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(decl) * Math.cos(phi));
  return { alt: alt / RAD, az: (azSouth / RAD + 180 + 360) % 360 };
}

/** Direction horizontale du soleil dans le repère du plan (vecteur unitaire). */
export function sunDir(az: number, planNorth: number): [number, number] {
  const t = (az + planNorth) * RAD;
  return [Math.sin(t), -Math.cos(t)];
}

/** Distance le long du rayon (origine p, direction d) jusqu'à l'entrée dans le rectangle, ou null. */
function rayRect(px: number, py: number, dx: number, dy: number, o: Obstacle): number | null {
  let tmin = 0;
  let tmax = Infinity;
  for (const [p, d, lo, hi] of [
    [px, dx, o.x, o.x + o.w],
    [py, dy, o.y, o.y + o.h],
  ] as const) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return null;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

/** Un point est-il à l'ombre d'un obstacle pour cette position du soleil ? */
export function inShadow(x: number, y: number, pos: SunPos, obstacles: Obstacle[], planNorth: number): boolean {
  if (pos.alt <= 0) return true;
  const [dx, dy] = sunDir(pos.az, planNorth);
  const tanAlt = Math.tan(pos.alt * RAD);
  for (const o of obstacles) {
    const t = rayRect(x, y, dx, dy, o);
    if (t !== null && o.height > t * tanAlt) return true;
  }
  return false;
}

/** Heures de soleil direct reçues en moyenne sur la planche (9 points, pas de 15 min). */
export function sunHours(bed: Pick<Bed, 'x' | 'y' | 'w' | 'h'>, obstacles: Obstacle[], lat: number, planNorth: number, doy: number): number {
  const pts: Array<[number, number]> = [];
  for (const fx of [0.2, 0.5, 0.8]) for (const fy of [0.2, 0.5, 0.8]) pts.push([bed.x + bed.w * fx, bed.y + bed.h * fy]);
  let total = 0;
  for (let hour = 3; hour <= 21; hour += 0.25) {
    const pos = sunPosition(lat, doy, hour);
    if (pos.alt < MIN_ALT) continue;
    const lit = pts.filter(([x, y]) => !inShadow(x, y, pos, obstacles, planNorth)).length;
    total += (0.25 * lit) / pts.length;
  }
  return total;
}

export interface BedSun {
  june: number;
  equinox: number;
  /** Moyenne avril → septembre. */
  season: number;
  /** Heures possibles sans obstacle (même période). */
  open: number;
  exposure: Sun;
}

/** Plein soleil ≥ 6 h en saison, mi-ombre 3 à 6 h, ombre < 3 h. */
export function exposureOf(hours: number): Sun {
  return hours >= 6 ? 'full' : hours >= 3 ? 'partial' : 'shade';
}

const SEASON_DAYS = [105, 135, 166, 196, 227, 258]; // 15 avril → 15 septembre

export function bedSun(bed: Pick<Bed, 'x' | 'y' | 'w' | 'h'>, obstacles: Obstacle[], lat: number, planNorth: number): BedSun {
  const season = SEASON_DAYS.reduce((s, d) => s + sunHours(bed, obstacles, lat, planNorth, d), 0) / SEASON_DAYS.length;
  const open = SEASON_DAYS.reduce((s, d) => s + sunHours(bed, [], lat, planNorth, d), 0) / SEASON_DAYS.length;
  return {
    june: sunHours(bed, obstacles, lat, planNorth, 172),
    equinox: sunHours(bed, obstacles, lat, planNorth, 80),
    season,
    open,
    exposure: exposureOf(season),
  };
}

/** Une espèce supporte-t-elle cette exposition ? */
export function sunMismatch(need: Sun, got: Sun): boolean {
  // Plein soleil exige plein soleil ; « soleil ou mi-ombre » refuse seulement l'ombre.
  if (need === 'full') return got !== 'full';
  if (need === 'partial') return got === 'shade';
  return false;
}

/** Contour de l'ombre portée d'un obstacle (enveloppe convexe), pour le dessin. */
export function shadowPolygon(o: Obstacle, pos: SunPos, planNorth: number): Array<[number, number]> {
  if (pos.alt <= 0) return [];
  const [dx, dy] = sunDir(pos.az, planNorth);
  const len = Math.min(60, o.height / Math.tan(pos.alt * RAD));
  const corners: Array<[number, number]> = [
    [o.x, o.y],
    [o.x + o.w, o.y],
    [o.x + o.w, o.y + o.h],
    [o.x, o.y + o.h],
  ];
  const pts = [...corners, ...corners.map(([x, y]) => [x - dx * len, y - dy * len] as [number, number])];
  return convexHull(pts);
}

function convexHull(points: Array<[number, number]>): Array<[number, number]> {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: Array<[number, number]> = [];
  for (let i = p.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p[i]) <= 0) upper.pop();
    upper.push(p[i]);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
