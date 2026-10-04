/**
 * Bilan de fin de saison : fleurs coupées, résultats par planche, et ce qui
 * a marché ou non (récolte pesée comparée au rendement attendu), avec les
 * causes probables relevées dans le carnet : exposition insuffisante,
 * rotation non respectée, problèmes sanitaires notés, aucune pesée.
 */
import { SPECIES_EXTRA } from '../data/speciesExtra';
import type { GardenData, ISODate, Plant, Wish } from '../model';
import { inWindow, plantArea, shiftWindows, speciesOf } from './crop';
import { FLOWER_INFO } from '../data/flowers';
import { addDays, yearOf } from './dates';
import { bedIsMulched } from './mulch';
import { expectedYieldKg } from './nutrition';
import { timeline } from './phenology';
import { rotationWarning } from './rotation';
import { wishesFromYear } from './planner';
import { bedSun, DEFAULT_LAT, sunMismatch } from './sun';

/** Une culture compte pour l'année si elle a été semée, récoltée ou arrêtée cette année-là, ou si elle est en place. */
export function plantInYear(p: Plant, data: GardenData, year: number): boolean {
  if (p.status === 'planned') return false;
  if (yearOf(p.sowDate) === year) return true;
  if (p.endDate && yearOf(p.endDate) === year) return true;
  if (data.observations.some((o) => o.plantId === p.id && yearOf(o.date) === year && (o.harvestG || o.stems))) return true;
  return yearOf(p.sowDate) < year && !p.endDate && p.status !== 'ended';
}

export interface FlowerRow {
  speciesId: string;
  stems: number;
  plants: number;
  area: number;
}

/** Tiges coupées de l'année, par espèce. */
export function cutFlowers(data: GardenData, year: number): { rows: FlowerRow[]; stems: number } {
  const byId = new Map(data.plants.map((p) => [p.id, p]));
  const rows = new Map<string, FlowerRow>();
  const seen = new Set<string>();
  for (const o of data.observations) {
    if (!o.stems || !o.plantId || yearOf(o.date) !== year) continue;
    const p = byId.get(o.plantId);
    if (!p) continue;
    const r = rows.get(p.speciesId) ?? { speciesId: p.speciesId, stems: 0, plants: 0, area: 0 };
    r.stems += o.stems;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      r.plants += p.count;
      r.area += plantArea(p);
    }
    rows.set(p.speciesId, r);
  }
  const list = [...rows.values()].sort((a, b) => b.stems - a.stems);
  return { rows: list, stems: list.reduce((s, r) => s + r.stems, 0) };
}

export type Verdict = 'great' | 'ok' | 'poor' | 'unweighed' | 'pending';
export type Cause = 'sun' | 'rotation' | 'problems' | 'unweighed' | 'young';

export interface PlantResult {
  plant: Plant;
  expectedKg: number;
  harvestedKg: number;
  /** Récolte / attendu (0 si rien de pesé). */
  ratio: number;
  verdict: Verdict;
  causes: Cause[];
  problems: number;
}

/** Résultat de chaque culture potagère de l'année (les fleurs, sans rendement en poids, sont à part). */
export function plantResults(data: GardenData, year: number, today: ISODate): PlantResult[] {
  const lat = data.settings.lat ?? DEFAULT_LAT;
  const sunCache = new Map<string, ReturnType<typeof bedSun>>();
  const sunOf = (bedId: string) => {
    if (!sunCache.has(bedId)) {
      const b = data.beds.find((x) => x.id === bedId);
      if (b) sunCache.set(bedId, bedSun(b, data.obstacles, lat, data.settings.planNorth));
    }
    return sunCache.get(bedId);
  };
  const out: PlantResult[] = [];
  for (const p of data.plants) {
    const sp = speciesOf(p);
    if (sp.type === 'flower' || sp.type === 'cover' || !plantInYear(p, data, year)) continue;
    const expectedKg = expectedYieldKg(p);
    if (expectedKg <= 0) continue;
    const harvestedKg = data.observations.filter((o) => o.plantId === p.id && o.harvestG && yearOf(o.date) === year).reduce((s, o) => s + (o.harvestG ?? 0), 0) / 1000;
    const tl = timeline(p, data, today);
    // Jugée seulement quand la récolte est finie (culture arrêtée, fenêtre de récolte passée).
    const done = p.status === 'ended' || tl.harvestTo < today || yearOf(today) > year;
    const ratio = harvestedKg / expectedKg;
    const problems = data.treatments.filter((t) => yearOf(t.date) === year && (t.plantId === p.id || (!t.plantId && t.bedId === p.bedId))).length + data.observations.filter((o) => o.plantId === p.id && yearOf(o.date) === year && o.health === 'sick').length;
    const causes: Cause[] = [];
    const s = sunOf(p.bedId);
    if (s && sunMismatch(sp.sun, s.exposure)) causes.push('sun');
    if (rotationWarning(p.bedId, sp, data.plants, p.sowDate, p.id)) causes.push('rotation');
    if (problems > 0) causes.push('problems');
    let verdict: Verdict;
    if (harvestedKg === 0) {
      verdict = done ? 'unweighed' : 'pending';
      if (done) causes.push('unweighed');
    } else if (!done) verdict = ratio >= 0.9 ? 'great' : 'pending';
    else verdict = ratio >= 0.9 ? 'great' : ratio >= 0.5 ? 'ok' : 'poor';
    out.push({ plant: p, expectedKg, harvestedKg, ratio, verdict, causes, problems });
  }
  return out.sort((a, b) => b.ratio - a.ratio);
}

export interface BedResult {
  bedId: string;
  name: string;
  area: number;
  speciesIds: string[];
  grams: number;
  value: number;
  stems: number;
  /** Récolte pesée / récolte attendue des cultures jugées (null si rien à juger). */
  ratio: number | null;
  sunHours: number;
  mulched: boolean;
  problems: number;
}

/** Résultats par planche : ce qu'elle a porté, ce qu'elle a donné. */
export function bedResults(data: GardenData, year: number, today: ISODate, results = plantResults(data, year, today)): BedResult[] {
  const lat = data.settings.lat ?? DEFAULT_LAT;
  const byId = new Map(data.plants.map((p) => [p.id, p]));
  return data.beds
    .map((b) => {
      const plants = data.plants.filter((p) => p.bedId === b.id && plantInYear(p, data, year));
      let grams = 0;
      let value = 0;
      let stems = 0;
      for (const o of data.observations) {
        if (yearOf(o.date) !== year || !o.plantId) continue;
        const p = byId.get(o.plantId);
        if (!p || p.bedId !== b.id) continue;
        if (o.harvestG) {
          grams += o.harvestG;
          value += (o.harvestG / 1000) * (data.prices[p.speciesId] ?? SPECIES_EXTRA[p.speciesId]?.priceKg ?? 0);
        }
        if (o.stems) stems += o.stems;
      }
      const judged = results.filter((r) => r.plant.bedId === b.id && r.verdict !== 'pending' && r.verdict !== 'unweighed');
      const exp = judged.reduce((s, r) => s + r.expectedKg, 0);
      const got = judged.reduce((s, r) => s + r.harvestedKg, 0);
      return {
        bedId: b.id,
        name: b.name,
        area: b.w * b.h,
        speciesIds: [...new Set(plants.map((p) => p.speciesId))],
        grams,
        value,
        stems,
        ratio: exp > 0 ? got / exp : null,
        sunHours: bedSun(b, data.obstacles, lat, data.settings.planNorth).season,
        mulched: bedIsMulched(b, data, `${year}-07-01` < today ? `${year}-07-01` : today),
        problems: data.treatments.filter((t) => yearOf(t.date) === year && (t.bedId === b.id || (t.plantId && byId.get(t.plantId)?.bedId === b.id))).length,
      };
    })
    .filter((r) => r.speciesIds.length > 0)
    .sort((a, b) => b.grams / Math.max(0.1, b.area) - a.grams / Math.max(0.1, a.area));
}

export interface SeasonReview {
  /** Cultures réussies (≥ 90 % de l'attendu), meilleures d'abord. */
  worked: PlantResult[];
  /** Cultures décevantes (< 50 %) ou jamais pesées, avec leurs causes probables. */
  review: PlantResult[];
}

export function seasonReview(results: PlantResult[]): SeasonReview {
  return {
    worked: results.filter((r) => r.verdict === 'great'),
    review: results.filter((r) => r.verdict === 'poor' || r.verdict === 'unweighed').sort((a, b) => a.ratio - b.ratio),
  };
}

export interface HarvestCandidate {
  plant: Plant;
  /** Fleurs : on compte des tiges ; sinon on pèse. */
  unit: 'g' | 'stems';
  /** Déjà noté aujourd'hui (g ou tiges). */
  todayAmount: number;
}

/**
 * Cultures à récolter en ce moment : légumes et fruits dans leur fenêtre de
 * récolte (une semaine d'avance, deux de retard), fleurs en floraison ce
 * mois-ci. Sert à la saisie rapide des récoltes.
 */
export function harvestCandidates(data: GardenData, today: ISODate, all = false): HarvestCandidate[] {
  const month = Number(today.slice(5, 7));
  const out: Array<HarvestCandidate & { from: string }> = [];
  for (const p of data.plants) {
    if (p.status === 'planned' || (p.status === 'ended' && (!p.endDate || p.endDate < addDays(today, -10)))) continue;
    const sp = speciesOf(p);
    if (sp.type === 'cover') continue;
    const todayObs = data.observations.filter((o) => o.plantId === p.id && o.date === today);
    if (sp.type === 'flower') {
      const bloom = FLOWER_INFO[sp.id]?.bloom ?? [];
      const inBloom = inWindow(month, shiftWindows(bloom, data.settings.climate));
      if (all || inBloom) out.push({ plant: p, unit: 'stems', todayAmount: todayObs.reduce((s, o) => s + (o.stems ?? 0), 0), from: inBloom ? '0' : '9' });
      continue;
    }
    const tl = timeline(p, data, today);
    const inWin = tl.harvestFrom <= addDays(today, 7) && tl.harvestTo >= addDays(today, -14);
    if (all || inWin) out.push({ plant: p, unit: 'g', todayAmount: todayObs.reduce((s, o) => s + (o.harvestG ?? 0), 0), from: inWin ? tl.harvestFrom : `9${tl.harvestFrom}` });
  }
  return out.sort((a, b) => a.from.localeCompare(b.from)).map(({ from: _from, ...c }) => c);
}

/**
 * Envies pour la saison suivante tirées du bilan : on reprend les cultures
 * annuelles de l'année (avec leur surface) ; celles qui ont déçu sont
 * réduites de moitié. Le planificateur choisit ensuite les planches
 * (exposition, rotation), ce qui corrige les causes « soleil » et « rotation ».
 */
export function wishesFromReview(data: GardenData, year: number, today: ISODate): Wish[] {
  const results = plantResults(data, year, today);
  const poor = new Set(results.filter((r) => r.verdict === 'poor').map((r) => r.plant.speciesId));
  const good = new Set(results.filter((r) => r.verdict === 'great' || r.verdict === 'ok').map((r) => r.plant.speciesId));
  return wishesFromYear(data, year).map((w) => (poor.has(w.speciesId) && !good.has(w.speciesId) ? { ...w, area: Math.max(0.5, Math.round(w.area * 5) / 10) } : w));
}
