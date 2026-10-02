/**
 * Planificateur de saison (phase 4) : à partir d'une liste d'envies
 * (espèce, surface, nombre de semis), propose une planche pour chaque
 * culture en respectant les rotations, la succession des exigences
 * (gourmande après légumineuse…), l'ensoleillement, la serre pour les
 * cultures de chaleur, les associations et le pH ; ajoute des cultures
 * dérobées rapides avant une culture plantée tard, et date chaque semis
 * d'après le calendrier du climat.
 *
 * C'est un brouillon raisonné : chaque choix porte ses raisons, chaque
 * entorse son avertissement, et le jardinier modifie avant d'appliquer.
 */
import { companionsOf } from '../data/speciesExtra';
import { SPECIES_BY_ID } from '../data/species';
import type { Bed, ClimateId, GardenData, ISODate, MonthRange, Plant, SeasonPlan, Species, Wish } from '../model';
import { addDays, diffDays, yearOf } from './dates';
import { cropCalendar, isPerennialCrop, isPlanted, plantArea, plantsForArea } from './crop';
import { rotationWarning } from './rotation';
import { phMismatches, soilFor } from './soil';
import { bedSun, DEFAULT_LAT, sunMismatch } from './sun';
import { bedArea } from './water';

export type { SeasonPlan, Wish };

export type Note = { code: string; vars?: Record<string, string | number> };

export interface PlannedCrop {
  key: string;
  speciesId: string;
  bedId: string;
  area: number;
  count: number;
  indoor: boolean;
  /** Semis (ou plantation pour les plants, bulbes, tubercules). */
  sowDate: ISODate;
  transplantDate?: ISODate;
  role: 'main' | 'succession' | 'catch';
  /** Rang du semis échelonné (1…n). */
  round?: number;
  score: number;
  reasons: Note[];
  warnings: Note[];
  varietyName?: string;
}

export interface PlanResult {
  crops: PlannedCrop[];
  /** Surface restée sans planche (m²), par espèce. */
  unplaced: Array<{ speciesId: string; area: number }>;
  /** Occupation de chaque planche (m² occupés en même temps / surface). */
  usage: Array<{ bedId: string; used: number; area: number }>;
}

/** Cultures de chaleur qui gagnent à être sous serre hors climat méditerranéen. */
const HEAT_LOVERS = new Set(['tomato', 'eggplant', 'pepper', 'melon', 'cucumber', 'watermelon', 'sweetpotato', 'basil', 'lemongrass', 'stevia', 'shiso', 'marjoram', 'okra', 'physalis', 'purslane', 'nzspinach']);
/** Cultures rapides pour occuper une planche avant une plantation tardive. */
export const CATCH_CROPS = ['radish', 'rocket', 'lettuce', 'spinach', 'turnip'];
/** Surface maximale d'une culture dérobée (m²). */
export const CATCH_MAX_AREA = 2;
/** Surface minimale d'un bout de planche qui vaut la peine (m²). */
const MIN_PIECE = 0.3;

/** Milieu (ou fraction f) d'une fenêtre de mois, une année donnée. */
export function windowDate(r: MonthRange, year: number, f = 0.5): ISODate {
  const [a, b0] = r;
  const b = b0 < a ? b0 + 12 : b0;
  const start = Date.UTC(year, a - 1, 1);
  const end = Date.UTC(year, b, 0); // dernier jour du mois b
  const t = start + (end - start) * f;
  return new Date(t).toISOString().slice(0, 10);
}

/** Dates de culture d'une espèce pour l'année : semis à l'abri + repiquage, semis direct, ou plantation. */
export function cropDates(sp: Species, climate: ClimateId, year: number, f = 0.35): { sowDate: ISODate; transplantDate?: ISODate; indoor: boolean; inGround: ISODate } {
  const cal = cropCalendar(sp, climate);
  if (cal.sowIndoor.length && (!cal.sowOutdoor.length || HEAT_LOVERS.has(sp.id) || sp.frost === 'tender')) {
    return indoorDates(sp, cal, year, f);
  }
  const w = cal.sowOutdoor[0] ?? cal.plantOut[0];
  const sowDate = w ? windowDate(w, year, f) : `${year}-04-15`;
  return { sowDate, indoor: false, inGround: sowDate };
}

/**
 * Semis à l'abri : la mise en place suit la fenêtre de plantation du climat
 * (après les gelées), et le semis se cale en arrière, sans sortir de sa
 * propre fenêtre.
 */
function indoorDates(sp: Species, cal: ReturnType<typeof cropCalendar>, year: number, f: number) {
  const after = sp.transplantAfter ?? 42;
  const sowWin = cal.sowIndoor[0];
  const sowStart = windowDate(sowWin, year, 0);
  const sowEnd = windowDate(sowWin, year, 1);
  let transplantDate = cal.plantOut[0] ? windowDate(cal.plantOut[0], year, Math.min(f, 0.6)) : addDays(windowDate(sowWin, year, f), after);
  let sowDate = addDays(transplantDate, -after);
  if (sowDate < sowStart) {
    sowDate = sowStart;
    transplantDate = addDays(sowDate, after) > transplantDate ? addDays(sowDate, after) : transplantDate;
  } else if (sowDate > sowEnd) sowDate = sowEnd;
  return { sowDate, transplantDate, indoor: true, inGround: transplantDate };
}

/** Dernière culture (hors prévues) d'une planche avant l'année visée. */
function previousCrop(bedId: string, plants: Plant[], year: number): Plant | undefined {
  return plants
    .filter((p) => p.bedId === bedId && p.status !== 'planned' && yearOf(p.sowDate) < year)
    .sort((a, b) => (b.endDate ?? b.sowDate).localeCompare(a.endDate ?? a.sowDate))[0];
}

interface BedState {
  bed: Bed;
  area: number;
  used: number;
  exposure: 'full' | 'partial' | 'shade';
  prev?: Plant;
  assigned: string[];
}

function scoreBed(st: BedState, sp: Species, data: GardenData, sowDate: ISODate): { score: number; reasons: Note[]; warnings: Note[] } {
  const reasons: Note[] = [];
  const warnings: Note[] = [];
  let score = 0;
  const { bed } = st;
  const rot = rotationWarning(bed.id, sp, data.plants, sowDate);
  if (rot) {
    score -= 10;
    warnings.push({ code: 'rotation', vars: { prev: rot.previous.speciesId, years: rot.years, wanted: rot.wanted } });
  } else if (st.prev) {
    score += 1;
    reasons.push({ code: 'rotationOk' });
  }
  const prevSp = st.prev ? SPECIES_BY_ID[st.prev.speciesId] : undefined;
  if (prevSp) {
    if (prevSp.feeding === 'improver' && sp.feeding === 'heavy') {
      score += 3;
      reasons.push({ code: 'afterLegume', vars: { prev: prevSp.id } });
    } else if (prevSp.feeding === 'heavy' && sp.feeding === 'heavy') {
      score -= 2;
      warnings.push({ code: 'heavyAfterHeavy', vars: { prev: prevSp.id } });
    } else if (prevSp.feeding === 'heavy' && (sp.feeding === 'light' || sp.feeding === 'improver')) {
      score += 1.5;
      reasons.push({ code: 'lightAfterHeavy', vars: { prev: prevSp.id } });
    }
  }
  if (sunMismatch(sp.sun, st.exposure)) {
    score -= 6;
    warnings.push({ code: 'shade' });
  } else if (sp.sun === 'full' && st.exposure === 'full') score += 1;
  const cool = data.settings.climate !== 'mediterranean';
  if (bed.kind === 'greenhouse') {
    if (HEAT_LOVERS.has(sp.id) && cool) {
      score += 4;
      reasons.push({ code: 'greenhouse' });
    } else score -= 1.5;
  } else if (HEAT_LOVERS.has(sp.id) && cool && data.beds.some((b) => b.kind === 'greenhouse')) score -= 0.5;
  if (bed.kind === 'pot' && sp.spacing.row * sp.spacing.inRow > 1600) {
    score -= 5;
    warnings.push({ code: 'tooBigForPot' });
  }
  for (const c of companionsOf(sp.id)) {
    if (!st.assigned.includes(c.other)) continue;
    if (c.effect === 'good') {
      score += 1.5;
      reasons.push({ code: 'companion', vars: { other: c.other } });
    } else {
      score -= 4;
      warnings.push({ code: 'badNeighbour', vars: { other: c.other } });
    }
  }
  if (st.assigned.includes(sp.id)) score += 0.5;
  const soil = soilFor(data, bed.id);
  if (phMismatches(soil, [{ speciesId: sp.id } as Plant]).length) {
    score -= 3;
    warnings.push({ code: 'ph', vars: { ph: soil!.ph!.value } });
  }
  return { score, reasons, warnings };
}

/** Propose un plan de saison. */
export function planSeason(data: GardenData, plan: SeasonPlan): PlanResult {
  const { year } = plan;
  const lat = data.settings.lat ?? DEFAULT_LAT;
  const states: BedState[] = data.beds
    .filter((b) => b.kind !== 'hydro')
    .map((bed) => {
      // Les vivaces en place gardent leur surface.
      const perennial = data.plants.filter((p) => p.bedId === bed.id && p.status !== 'ended' && isPerennialCrop(SPECIES_BY_ID[p.speciesId] ?? { life: 'annual', type: 'leaf' })).reduce((s, p) => s + plantArea(p), 0);
      return { bed, area: bedArea(bed), used: perennial, exposure: bedSun(bed, data.obstacles, lat, data.settings.planNorth).exposure, prev: previousCrop(bed.id, data.plants, year), assigned: [] };
    });
  const crops: PlannedCrop[] = [];
  const unplaced: PlanResult['unplaced'] = [];

  // Les plus exigeantes et les plus grandes d'abord : elles ont le moins de choix.
  const rank = (w: Wish) => {
    const sp = SPECIES_BY_ID[w.speciesId];
    return (sp.feeding === 'heavy' ? 3 : 0) + (HEAT_LOVERS.has(sp.id) ? 2 : 0) + (sp.sun === 'full' ? 1 : 0) + w.area / 10;
  };
  const wishes = plan.wishes.filter((w) => SPECIES_BY_ID[w.speciesId] && w.area > 0).sort((a, b) => rank(b) - rank(a));

  for (const w of wishes) {
    const sp = SPECIES_BY_ID[w.speciesId];
    const n = Math.max(1, Math.min(8, Math.round(w.sowings)));
    // Surface occupée en même temps : un semis échelonné en chevauche environ deux.
    const concurrent = n === 1 ? w.area : (w.area / n) * Math.min(n, 2);
    let left = concurrent;
    const placements: Array<{ st: BedState; share: number; s: ReturnType<typeof scoreBed> }> = [];
    const dates = cropDates(sp, data.settings.climate, year);
    while (left > MIN_PIECE / 2) {
      const options = states
        .filter((st) => st.area - st.used >= Math.min(MIN_PIECE, left) && !placements.some((p) => p.st === st))
        .map((st) => ({ st, s: scoreBed(st, sp, data, dates.inGround) }))
        .sort((a, b) => b.s.score - a.s.score || b.st.area - b.st.used - (a.st.area - a.st.used));
      const best = options[0];
      if (!best) break;
      const take = Math.min(left, best.st.area - best.st.used);
      best.st.used += take;
      best.st.assigned.push(sp.id);
      placements.push({ st: best.st, share: take / concurrent, s: best.s });
      left -= take;
    }
    if (left > MIN_PIECE / 2) unplaced.push({ speciesId: sp.id, area: Math.round((left / concurrent) * w.area * 10) / 10 });

    for (const pl of placements) {
      const areaHere = w.area * pl.share;
      for (let i = 0; i < n; i++) {
        const f = n === 1 ? 0.35 : 0.1 + (0.8 * i) / (n - 1);
        const d = n === 1 ? dates : cropDatesSpread(sp, data.settings.climate, year, f);
        const area = Math.round((areaHere / n) * 100) / 100;
        crops.push({
          key: `${sp.id}:${pl.st.bed.id}:${i}`,
          speciesId: sp.id,
          bedId: pl.st.bed.id,
          area,
          count: plantsForArea(sp, area),
          indoor: d.indoor,
          sowDate: d.sowDate,
          transplantDate: d.transplantDate,
          role: n === 1 ? 'main' : 'succession',
          round: n === 1 ? undefined : i + 1,
          score: pl.s.score,
          reasons: pl.s.reasons,
          warnings: pl.s.warnings,
          varietyName: w.varietyName,
        });
      }
    }
  }

  // Cultures dérobées : avant une culture mise en place tard (après la mi-mai), une culture rapide occupe la planche.
  for (const st of states) {
    if (st.bed.kind === 'pot') continue;
    const mains = crops.filter((c) => c.bedId === st.bed.id && c.role === 'main');
    const lateStart = mains.map((c) => c.transplantDate ?? c.sowDate).sort()[0];
    if (!lateStart || mains.some((c) => CATCH_CROPS.includes(c.speciesId))) continue;
    for (const id of CATCH_CROPS) {
      const sp = SPECIES_BY_ID[id];
      const cal = cropCalendar(sp, data.settings.climate);
      const w = cal.sowOutdoor[0];
      if (!w) continue;
      const sow = windowDate(w, year, 0);
      if (sow < `${year}-02-15`) continue;
      const end = addDays(sow, sp.daysToHarvest[1]);
      if (end > addDays(lateStart, -3) || diffDays(sow, lateStart) < 35) continue;
      const rot = rotationWarning(st.bed.id, sp, data.plants, sow);
      if (rot) continue;
      // Une dérobée de jardin : 2 m² au plus (au-delà, on ne mange pas tous ces radis).
      const area = Math.min(CATCH_MAX_AREA, Math.round(mains.filter((c) => (c.transplantDate ?? c.sowDate) >= addDays(sow, 35)).reduce((s, c) => s + c.area, 0) * 100) / 100);
      if (area < MIN_PIECE) continue;
      crops.push({
        key: `${id}:${st.bed.id}:catch`,
        speciesId: id,
        bedId: st.bed.id,
        area,
        count: plantsForArea(sp, area),
        indoor: false,
        sowDate: sow,
        role: 'catch',
        score: 0,
        reasons: [{ code: 'catch', vars: { before: mains[0].speciesId, until: lateStart } }],
        warnings: [],
      });
      break;
    }
  }

  crops.sort((a, b) => a.sowDate.localeCompare(b.sowDate) || a.bedId.localeCompare(b.bedId));
  return { crops, unplaced, usage: states.map((s) => ({ bedId: s.bed.id, used: Math.round(s.used * 10) / 10, area: s.area })) };
}

/** Dates d'un semis échelonné : fraction f de la fenêtre (semis direct de préférence). */
function cropDatesSpread(sp: Species, climate: ClimateId, year: number, f: number) {
  const cal = cropCalendar(sp, climate);
  const w = cal.sowOutdoor[0] ?? cal.sowIndoor[0] ?? cal.plantOut[0];
  if (!w) return cropDates(sp, climate, year, f);
  if (!cal.sowOutdoor.length && cal.sowIndoor.length) return indoorDates(sp, cal, year, f);
  const sowDate = windowDate(w, year, f);
  return { sowDate, indoor: false, inGround: sowDate };
}

/** Envies de départ : les cultures de l'année précédente, avec leur surface. */
export function wishesFromYear(data: GardenData, year: number): Wish[] {
  const m = new Map<string, number>();
  for (const p of data.plants) {
    if (yearOf(p.sowDate) !== year || isPerennialCrop(SPECIES_BY_ID[p.speciesId] ?? { life: 'annual', type: 'leaf' })) continue;
    m.set(p.speciesId, (m.get(p.speciesId) ?? 0) + plantArea(p));
  }
  return [...m.entries()].map(([speciesId, area]) => ({ speciesId, area: Math.round(area * 10) / 10, sowings: ['lettuce', 'radish', 'spinach', 'rocket', 'carrot', 'bean'].includes(speciesId) ? 3 : 1 }));
}

/** Cultures prévues à créer dans le jardin. */
export function planToPlants(result: PlanResult, today: ISODate, uid: (p: string) => string): Plant[] {
  return result.crops.map((c) => ({
    id: uid('pl'),
    speciesId: c.speciesId,
    varietyName: c.varietyName,
    bedId: c.bedId,
    count: Math.max(1, c.count),
    area: c.area,
    indoor: c.indoor && !isPlanted(SPECIES_BY_ID[c.speciesId]),
    status: 'planned' as const,
    sowDate: c.sowDate,
    transplantDate: c.transplantDate,
    note: undefined,
    createdAt: today,
  }));
}

export type PlanAction = { date: ISODate; kind: 'sowIndoor' | 'sow' | 'plant' | 'transplant'; crop: PlannedCrop };

/** Calendrier des gestes du plan, dans l'ordre. */
export function planCalendar(result: PlanResult): PlanAction[] {
  const out: PlanAction[] = [];
  for (const c of result.crops) {
    const sp = SPECIES_BY_ID[c.speciesId];
    if (c.indoor) {
      out.push({ date: c.sowDate, kind: 'sowIndoor', crop: c });
      if (c.transplantDate) out.push({ date: c.transplantDate, kind: 'transplant', crop: c });
    } else out.push({ date: c.sowDate, kind: isPlanted(sp) ? 'plant' : 'sow', crop: c });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
