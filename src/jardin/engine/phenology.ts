/**
 * Phénologie par degrés-jours.
 *
 * Les stades du catalogue sont donnés en jours après le semis, pour un
 * semis « de référence » en région parisienne (milieu de la première
 * fenêtre de semis du calendrier). On les convertit en degrés-jours avec
 * les normales parisiennes : c'est la courbe de référence de l'espèce.
 * Pour une culture réelle, on cumule les degrés-jours depuis son semis
 * avec la météo mesurée et prévue (sinon les normales de son climat), à
 * l'abri tant qu'elle n'est pas repiquée, avec un bonus sous serre ; son
 * « âge équivalent » est le jour de la courbe de référence qui a reçu la
 * même chaleur. Les stades, la fenêtre de récolte et le Kc se lisent
 * alors sur cet âge équivalent : un printemps froid retarde tout, une
 * serre ou un été chaud avance tout.
 *
 * Les stades observés (première fleur, première récolte…) recalent ensuite
 * l'espèce : si vos tomates fleurissent plus tôt que prévu, toutes vos
 * tomates sont avancées d'autant (facteur borné entre 0,6 et 1,6).
 *
 *   GDD(jour) = max(0, (min(Tmax, 30) + Tmin) / 2 − Tbase)
 */
import type { GardenData, ISODate, Plant, Species, StageId } from '../model';
import { addDays, diffDays } from './dates';
import { isPerennialCrop, isPlanted, shiftWindows, speciesOf, varietyScale, type StageInfo, type StageState } from './crop';
import { ORCHARD_MONTHS } from '../data/orchard';
import { activeWeather, normalDay, tempsOn } from './weather';

/** Températures supposées pour un semis à l'abri (maison, serre chauffée). */
export const INDOOR = { tmax: 22, tmin: 15 };
/** Degrés ajoutés sous serre froide (hypothèse de départ). */
export const GREENHOUSE_BONUS = 4;
/** Plafond de température utile. */
export const GDD_CAP = 30;
/** Bornes du recalage par les observations. */
export const FACTOR_MIN = 0.6;
export const FACTOR_MAX = 1.6;

export function gddDay(tmax: number, tmin: number, tBase: number): number {
  return Math.max(0, (Math.min(tmax, GDD_CAP) + tmin) / 2 - tBase);
}

// --- Courbe de référence de l'espèce -------------------------------------------

/** Date du semis de référence : milieu de la première fenêtre du calendrier (année 2026). */
export function referenceStart(sp: Species): { date: ISODate; indoorDays: number } {
  const indoor = !!sp.sowIndoor && !isPlanted(sp);
  const w = (indoor ? sp.sowIndoor : sp.sowOutdoor ?? sp.plantOut)![0];
  const a = w[0];
  const b = w[1] < w[0] ? w[1] + 12 : w[1];
  const mid = (a + b + 1) / 2; // fenêtre inclusive : du 1er de a au dernier jour de b
  const m0 = Math.floor(mid);
  const year = 2026 + Math.floor((m0 - 1) / 12);
  const month = ((m0 - 1) % 12) + 1;
  const day = 1 + Math.round((mid - m0) * 29);
  return { date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, indoorDays: indoor ? sp.transplantAfter ?? 0 : 0 };
}

const refCache = new Map<string, Float64Array>();

/** Degrés-jours cumulés de la courbe de référence, jour par jour (cum[0] = 0). */
export function referenceCurve(sp: Species): Float64Array {
  const key = sp.typeId ? `${sp.id}:${sp.typeId}` : sp.id;
  const hit = refCache.get(key);
  if (hit) return hit;
  const { date, indoorDays } = referenceStart(sp);
  const n = Math.ceil(sp.season * 2.2) + 2;
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const d = addDays(date, i - 1);
    const t = i - 1 < indoorDays ? INDOOR : normalDay('parisian', d);
    cum[i] = cum[i - 1] + gddDay(t.tmax, t.tmin, sp.tBase);
  }
  refCache.set(key, cum);
  return cum;
}

/** Degrés-jours de la courbe de référence au jour `day` (interpolé ; extrapolé au-delà). */
export function gddAtRefDay(cum: Float64Array, day: number): number {
  const last = cum.length - 1;
  if (day <= 0) return 0;
  if (day >= last) return cum[last] + (cum[last] / last || 0) * (day - last);
  const i = Math.floor(day);
  return cum[i] + (cum[i + 1] - cum[i]) * (day - i);
}

/** Jour de la courbe de référence ayant reçu `g` degrés-jours (interpolé ; extrapolé au-delà). */
export function refDayFor(cum: Float64Array, g: number): number {
  if (g <= 0) return 0;
  const last = cum.length - 1;
  if (g >= cum[last]) {
    const rate = cum[last] / last || 1;
    return last + (g - cum[last]) / rate;
  }
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < g) lo = mid;
    else hi = mid;
  }
  const span = cum[hi] - cum[lo];
  return lo + (span > 0 ? (g - cum[lo]) / span : 0);
}

// --- Courbe d'une culture ----------------------------------------------------------

interface RawCurve {
  start: ISODate;
  /** Degrés-jours cumulés depuis le semis, jour par jour. */
  g: Float64Array;
  /** Jours de météo mesurée ou prévue utilisés (le reste : normales). */
  measured: number;
}

const rawCache = new WeakMap<GardenData, Map<string, RawCurve>>();

function rawCurve(plant: Plant, data: GardenData): RawCurve {
  let byPlant = rawCache.get(data);
  if (!byPlant) {
    byPlant = new Map();
    rawCache.set(data, byPlant);
  }
  const hit = byPlant.get(plant.id);
  if (hit) return hit;
  const sp = speciesOf(plant);
  const variety = plant.varietyId ? data.varieties.find((v) => v.id === plant.varietyId) : undefined;
  const scale = varietyScale(sp, variety);
  const bed = data.beds.find((b) => b.id === plant.bedId);
  const bonus = bed?.kind === 'greenhouse' ? GREENHOUSE_BONUS : 0;
  const wx = activeWeather(data);
  const indoorUntil = plant.indoor && !isPlanted(sp) ? plant.transplantDate ?? addDays(plant.sowDate, Math.round((sp.transplantAfter ?? 0) * scale)) : plant.sowDate;
  const n = Math.ceil(sp.season * scale * 2.2) + 2;
  const g = new Float64Array(n);
  let measured = 0;
  for (let i = 1; i < n; i++) {
    const d = addDays(plant.sowDate, i - 1);
    let tmax: number;
    let tmin: number;
    if (d < indoorUntil) ({ tmax, tmin } = INDOOR);
    else {
      const t = tempsOn(d, data.settings.climate, wx);
      if (t.measured) measured++;
      tmax = t.tmax + bonus;
      tmin = t.tmin + bonus;
    }
    g[i] = g[i - 1] + gddDay(tmax, tmin, sp.tBase);
  }
  const curve = { start: plant.sowDate, g, measured };
  byPlant.set(plant.id, curve);
  return curve;
}

function gAt(c: RawCurve, date: ISODate): number {
  const i = diffDays(c.start, date);
  if (i <= 0) return 0;
  if (i < c.g.length) return c.g[i];
  const last = c.g.length - 1;
  return c.g[last] + ((c.g[last] / last) || 0) * (i - last);
}

/** Jour de référence d'un stade observé. */
function refDayOfStage(sp: Species, stage: StageId, scale: number): number | null {
  if (stage === 'harvest' && !sp.stages.some(([s]) => s === 'harvest')) return sp.daysToHarvest[0] * scale;
  const s = sp.stages.find(([x]) => x === stage);
  return s ? s[1] * scale : null;
}

/**
 * Recalage d'une espèce par les stades observés : pour chaque stade noté,
 * rapport entre les degrés-jours que la référence demande pour ce stade et
 * ceux que la culture a réellement reçus ; moyenne géométrique, bornée.
 * Appliqué aux degrés-jours de la culture, il fait tomber le stade observé
 * exactement à sa date.
 */
export function speciesFactor(speciesId: string, data: GardenData): { factor: number; n: number } {
  const ratios: number[] = [];
  for (const ev of data.phenoEvents ?? []) {
    const p = data.plants.find((x) => x.id === ev.plantId);
    if (!p || p.speciesId !== speciesId) continue;
    const sp = speciesOf(p);
    const variety = p.varietyId ? data.varieties.find((v) => v.id === p.varietyId) : undefined;
    const scale = varietyScale(sp, variety);
    const ref = refDayOfStage(sp, ev.stage, scale);
    if (ref === null || ref < 10) continue;
    const gObs = gAt(rawCurve(p, data), ev.date);
    const gRef = gddAtRefDay(referenceCurve(sp), ref);
    if (gObs < 20 || gRef < 20) continue;
    ratios.push(gRef / gObs);
  }
  if (!ratios.length) return { factor: 1, n: 0 };
  const geo = Math.exp(ratios.reduce((s, r) => s + Math.log(r), 0) / ratios.length);
  return { factor: Math.min(FACTOR_MAX, Math.max(FACTOR_MIN, geo)), n: ratios.length };
}

const factorCache = new WeakMap<GardenData, Map<string, { factor: number; n: number }>>();
function factorOf(speciesId: string, data: GardenData) {
  let m = factorCache.get(data);
  if (!m) {
    m = new Map();
    factorCache.set(data, m);
  }
  let f = m.get(speciesId);
  if (!f) {
    f = speciesFactor(speciesId, data);
    m.set(speciesId, f);
  }
  return f;
}

/** Âge équivalent (jours de la courbe de référence) d'une culture à une date. */
export function eqAge(plant: Plant, data: GardenData, date: ISODate): number {
  const sp = speciesOf(plant);
  const { factor } = factorOf(plant.speciesId, data);
  return refDayFor(referenceCurve(sp), gAt(rawCurve(plant, data), date) * factor);
}

export interface Timeline extends StageInfo {
  /** Âge équivalent aujourd'hui (jours de référence). */
  eqAge: number;
  /** Recalage de l'espèce et nombre d'observations utilisées. */
  factor: number;
  nEvents: number;
  /** Part des jours écoulés couverte par la météo mesurée (0–1). */
  measuredShare: number;
}

/** Première date où l'âge équivalent atteint `day` (recherche jour par jour, bornée). */
function dateWhen(plant: Plant, data: GardenData, day: number): ISODate {
  if (day <= 0) return plant.sowDate;
  const sp = speciesOf(plant);
  const limit = Math.ceil(sp.season * 3) + 60;
  // Recherche dichotomique : l'âge équivalent ne décroît jamais.
  let lo = 0;
  let hi = limit;
  if (eqAge(plant, data, addDays(plant.sowDate, hi)) < day) return addDays(plant.sowDate, hi);
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (eqAge(plant, data, addDays(plant.sowDate, mid)) >= day) hi = mid;
    else lo = mid;
  }
  return addDays(plant.sowDate, hi);
}

/** Stades, fenêtre de récolte et avancement d'une culture, par degrés-jours. */
export function timeline(plant: Plant, data: GardenData, today: ISODate): Timeline {
  const sp = speciesOf(plant);
  const variety = plant.varietyId ? data.varieties.find((v) => v.id === plant.varietyId) : undefined;
  const scale = varietyScale(sp, variety);
  const age = diffDays(plant.sowDate, today);
  const eq = plant.status === 'planned' ? 0 : eqAge(plant, data, today);
  const season = sp.season * scale;
  const starts = sp.stages.map(([stage, d]) => ({ stage, day: Math.round(d * scale), date: dateWhen(plant, data, d * scale) }));
  let stage: StageState;
  if (plant.status === 'planned') stage = 'planned';
  else if (plant.status === 'ended') stage = 'ended';
  else {
    stage = starts[0].stage;
    for (const s of starts) if (eq >= s.day) stage = s.stage;
  }
  const { factor, n } = factorOf(plant.speciesId, data);
  const raw = rawCurve(plant, data);
  // Vivaces (fruitiers, aromatiques, fleurs vivaces) : la récolte revient chaque année.
  let harvestFrom = dateWhen(plant, data, sp.daysToHarvest[0] * scale);
  let harvestTo = dateWhen(plant, data, sp.daysToHarvest[1] * scale);
  const months = sp.type === 'orchard' ? ORCHARD_MONTHS[sp.id] : undefined;
  if (months && plant.status !== 'planned') {
    // Fruitier : première récolte l'année calculée, puis chaque année aux mois de récolte (décalés selon le climat).
    const [m0, m1] = shiftWindows([months], data.settings.climate)[0];
    const win = (y: number): [ISODate, ISODate] => {
      const y1 = m1 < m0 ? y + 1 : y;
      const last = new Date(Date.UTC(y1, m1, 0)).getUTCDate();
      return [`${y}-${String(m0).padStart(2, '0')}-01`, `${y1}-${String(m1).padStart(2, '0')}-${String(last).padStart(2, '0')}`];
    };
    let y = Math.max(Number(harvestFrom.slice(0, 4)), Number(today.slice(0, 4)));
    if (today > win(y)[1]) y++;
    [harvestFrom, harvestTo] = win(y);
  } else if (isPerennialCrop(sp) && plant.status !== 'planned' && today > harvestTo) {
    const k = Math.ceil(diffDays(harvestTo, today) / 365);
    harvestFrom = addDays(harvestFrom, 365 * k);
    harvestTo = addDays(harvestTo, 365 * k);
  }
  return {
    stage,
    age,
    eqAge: eq,
    progress: plant.status === 'planned' ? 0 : Math.max(0, Math.min(1, eq / season)),
    starts,
    harvestFrom,
    harvestTo,
    seasonEnd: dateWhen(plant, data, season),
    scale,
    factor,
    nEvents: n,
    measuredShare: age > 0 ? Math.min(1, raw.measured / Math.min(age, raw.g.length)) : 0,
  };
}

/** Degrés-jours cumulés depuis le semis (affichage). */
export function gddSince(plant: Plant, data: GardenData, date: ISODate): number {
  const { factor } = factorOf(plant.speciesId, data);
  return gAt(rawCurve(plant, data), date) * factor;
}
