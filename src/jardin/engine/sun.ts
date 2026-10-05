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

/** Distance le long du rayon jusqu'à la sortie du rectangle (le rayon y est entré). */
function rayRectExit(px: number, py: number, dx: number, dy: number, o: Obstacle): number {
  let tmax = Infinity;
  for (const [p, d, lo, hi] of [
    [px, dx, o.x, o.x + o.w],
    [py, dy, o.y, o.y + o.h],
  ] as const) {
    if (Math.abs(d) < 1e-9) continue;
    tmax = Math.min(tmax, Math.max((lo - p) / d, (hi - p) / d));
  }
  return tmax;
}

/** Toit à deux pans : le faîtage court-il le long de x (sinon le long de y) ? */
const ridgeAlongX = (o: Obstacle) => (o.ridge === 'short' ? o.w < o.h : o.w >= o.h);

/** Hauteur sous gouttière effective (bornée par le faîtage). */
const eaveOf = (o: Obstacle) => Math.max(0, Math.min(o.height, o.eaveHeight ?? o.height));

/** Le bâtiment a-t-il un vrai toit à deux pans ? */
export const isGable = (o: Obstacle) => o.kind === 'building' && o.roof === 'gable' && eaveOf(o) < o.height;

/** Hauteur de l'obstacle au-dessus d'un point de son emprise (toit à deux pans : linéaire de la gouttière au faîtage). */
export function heightAt(o: Obstacle, x: number, y: number): number {
  if (!isGable(o)) return o.height;
  const eave = eaveOf(o);
  const [d, half] = ridgeAlongX(o) ? [Math.abs(y - (o.y + o.h / 2)), o.h / 2] : [Math.abs(x - (o.x + o.w / 2)), o.w / 2];
  return o.height - (o.height - eave) * Math.min(1, d / Math.max(1e-6, half));
}

/** Un point est-il à l'ombre d'un obstacle pour cette position du soleil ? */
export function inShadow(x: number, y: number, pos: SunPos, obstacles: Obstacle[], planNorth: number): boolean {
  if (pos.alt <= 0) return true;
  const [dx, dy] = sunDir(pos.az, planNorth);
  const tanAlt = Math.tan(pos.alt * RAD);
  for (const o of obstacles) {
    const t = rayRect(x, y, dx, dy, o);
    if (t === null) continue;
    if (!isGable(o)) {
      if (o.height > t * tanAlt) return true;
      continue;
    }
    // Toit à deux pans : la hauteur sous le rayon est linéaire par morceaux (cassure au faîtage),
    // on la compare à celle du rayon à l'entrée, à la sortie et au passage du faîtage.
    const t2 = rayRectExit(x, y, dx, dy, o);
    const ts = [t, t2];
    if (ridgeAlongX(o) ? Math.abs(dy) > 1e-9 : Math.abs(dx) > 1e-9) {
      const tr = ridgeAlongX(o) ? (o.y + o.h / 2 - y) / dy : (o.x + o.w / 2 - x) / dx;
      if (tr > t && tr < t2) ts.push(tr);
    }
    if (ts.some((tt) => heightAt(o, x + dx * tt, y + dy * tt) > tt * tanAlt)) return true;
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
  // Longueur d'ombre d'un point à la hauteur z (plafonnée à 60 m au ras de l'horizon).
  const k = Math.min(60 / Math.max(0.1, o.height), 1 / Math.tan(pos.alt * RAD));
  const proj = ([x, y]: [number, number], z: number): [number, number] => [x - dx * z * k, y - dy * z * k];
  const corners: Array<[number, number]> = [
    [o.x, o.y],
    [o.x + o.w, o.y],
    [o.x + o.w, o.y + o.h],
    [o.x, o.y + o.h],
  ];
  if (!isGable(o)) return convexHull([...corners, ...corners.map((c) => proj(c, o.height))]);
  // Toit à deux pans (volume convexe) : murs jusqu'à la gouttière, puis les deux bouts du faîtage.
  const ridgeEnds: Array<[number, number]> = ridgeAlongX(o)
    ? [
        [o.x, o.y + o.h / 2],
        [o.x + o.w, o.y + o.h / 2],
      ]
    : [
        [o.x + o.w / 2, o.y],
        [o.x + o.w / 2, o.y + o.h],
      ];
  return convexHull([...corners, ...corners.map((c) => proj(c, eaveOf(o))), ...ridgeEnds.map((c) => proj(c, o.height))]);
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

// --- Heure du téléphone ↔ heure solaire --------------------------------------------

/** Longitude par défaut (Paris) si le jardin n'est pas localisé. */
export const DEFAULT_LON = 2.35;

/** Jour de l'année (1 à 366) d'une date locale. */
export function dayOfYear(d: Date): number {
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 1)) / 86_400_000) + 1;
}

/** Équation du temps (minutes) : avance du soleil vrai sur le soleil moyen. */
export function equationOfTime(doy: number): number {
  const b = ((2 * Math.PI) / 365) * (doy - 81);
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * Heure solaire vraie au jardin pour un instant donné (horloge du téléphone) :
 * heure UTC + longitude / 15 + équation du temps. Le décalage horaire et
 * l'heure d'été sont pris en compte par l'horloge elle-même.
 */
export function solarHourAt(d: Date, lon: number): number {
  const utc = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  return (((utc + lon / 15 + equationOfTime(dayOfYear(d)) / 60) % 24) + 24) % 24;
}

/** Heure affichée par le téléphone (heures décimales, locale) pour une heure solaire d'un jour de l'année donné. */
export function clockHourOf(solarHour: number, doy: number, lon: number, year: number): number {
  const noon = new Date(year, 0, doy, 12);
  const tz = -noon.getTimezoneOffset() / 60;
  return (((solarHour - lon / 15 - equationOfTime(doy) / 60 + tz) % 24) + 24) % 24;
}

/** Point cardinal (16 directions) d'un azimut, pour le libellé. */
export function compassPoint(az: number): string {
  const pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return pts[Math.round((((az % 360) + 360) % 360) / 22.5) % 16];
}
