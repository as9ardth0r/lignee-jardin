/**
 * Coin semis : suivi des semis faits à l'abri, de la graine à la mise en place.
 *
 * Étapes : semé → levée → repiquage en godets (si utile) → endurcissement →
 * prêt à planter. Pour chaque semis, l'app donne la date attendue de chaque
 * étape, l'étape en cours et les gestes du moment (chaleur, lumière,
 * arrosage, heure de sortie et de rentrée pendant l'endurcissement), en
 * tenant compte des dernières gelées du climat et des nuits annoncées.
 *
 * Références : fiches de semis du GNIS / SNHF, catalogues semenciers
 * (températures et délais de levée usuels) ; ce sont des ordres de grandeur.
 */
import { CLIMATES } from '../data/climate';
import type { Family, GardenData, ISODate, Plant, Species } from '../model';
import { inWindow, shiftWindows, speciesOf } from './crop';
import { addDays, dayOfYear, diffDays } from './dates';
import { timeline } from './phenology';

export interface GermInfo {
  /** Température de levée idéale (°C). */
  temp: [number, number];
  /** Jours de levée à cette température. */
  days: [number, number];
  /** Repiquage en godets : jours après la levée (2 vraies feuilles) ; absent si semé directement en godets. */
  potUp?: number;
  /** Profondeur de semis (mm) ; 0 = en surface (la lumière aide la levée). */
  depthMm: number;
  /** Nuits minimales pour laisser les plants dehors (°C). */
  nightMin: number;
}

/** Par espèce, pour les semis à l'abri les plus courants. */
const BY_SPECIES: Record<string, GermInfo> = {
  tomato: { temp: [20, 25], days: [6, 12], potUp: 14, depthMm: 5, nightMin: 10 },
  pepper: { temp: [24, 28], days: [10, 20], potUp: 21, depthMm: 5, nightMin: 12 },
  eggplant: { temp: [24, 28], days: [10, 18], potUp: 21, depthMm: 5, nightMin: 12 },
  basil: { temp: [20, 25], days: [6, 12], potUp: 18, depthMm: 2, nightMin: 12 },
  zucchini: { temp: [20, 25], days: [5, 8], depthMm: 20, nightMin: 10 },
  cucumber: { temp: [22, 28], days: [4, 8], depthMm: 15, nightMin: 12 },
  melon: { temp: [24, 30], days: [5, 10], depthMm: 15, nightMin: 12 },
  watermelon: { temp: [25, 30], days: [6, 12], depthMm: 20, nightMin: 13 },
  squash: { temp: [20, 25], days: [5, 10], depthMm: 25, nightMin: 10 },
  sweetcorn: { temp: [18, 25], days: [6, 10], depthMm: 30, nightMin: 8 },
  lettuce: { temp: [12, 18], days: [4, 8], potUp: 10, depthMm: 0, nightMin: 3 },
  endive: { temp: [15, 20], days: [5, 10], potUp: 12, depthMm: 3, nightMin: 3 },
  cabbage: { temp: [15, 20], days: [5, 10], potUp: 14, depthMm: 10, nightMin: 2 },
  cauliflower: { temp: [15, 20], days: [5, 10], potUp: 14, depthMm: 10, nightMin: 3 },
  broccoli: { temp: [15, 20], days: [5, 10], potUp: 14, depthMm: 10, nightMin: 3 },
  brussels: { temp: [15, 20], days: [5, 10], potUp: 14, depthMm: 10, nightMin: 2 },
  kale: { temp: [15, 20], days: [5, 10], potUp: 14, depthMm: 10, nightMin: 0 },
  kohlrabi: { temp: [15, 20], days: [5, 10], potUp: 12, depthMm: 10, nightMin: 3 },
  leek: { temp: [15, 20], days: [10, 15], depthMm: 5, nightMin: 0 },
  onion: { temp: [15, 20], days: [10, 15], depthMm: 5, nightMin: 0 },
  celeriac: { temp: [18, 22], days: [14, 21], potUp: 21, depthMm: 0, nightMin: 8 },
  parsley: { temp: [18, 22], days: [14, 28], depthMm: 5, nightMin: 2 },
  fennel: { temp: [18, 22], days: [8, 14], depthMm: 10, nightMin: 5 },
  chard: { temp: [15, 20], days: [7, 12], depthMm: 15, nightMin: 3 },
  beet: { temp: [15, 20], days: [7, 12], depthMm: 15, nightMin: 3 },
  strawberry: { temp: [18, 22], days: [14, 28], potUp: 21, depthMm: 0, nightMin: 2 },
};

/** Par famille, à défaut. */
const BY_FAMILY: Partial<Record<Family, GermInfo>> = {
  solanaceae: BY_SPECIES.tomato,
  cucurbitaceae: BY_SPECIES.zucchini,
  brassicaceae: BY_SPECIES.cabbage,
  asteraceae: { temp: [15, 20], days: [5, 12], potUp: 14, depthMm: 3, nightMin: 3 },
  amaryllidaceae: BY_SPECIES.leek,
  apiaceae: { temp: [18, 22], days: [10, 21], depthMm: 5, nightMin: 3 },
  lamiaceae: BY_SPECIES.basil,
  fabaceae: { temp: [15, 22], days: [6, 12], depthMm: 30, nightMin: 5 },
};

export function germInfo(sp: Species): GermInfo {
  const g = BY_SPECIES[sp.id] ?? BY_FAMILY[sp.family];
  if (g) return g;
  // Fleurs et autres : selon la sensibilité au gel.
  return sp.frost === 'tender' ? { temp: [18, 24], days: [7, 14], potUp: 14, depthMm: 3, nightMin: 10 } : { temp: [15, 20], days: [7, 14], potUp: 14, depthMm: 3, nightMin: 3 };
}

export type NurseryStage = 'sown' | 'seedling' | 'potted' | 'hardening' | 'ready';

export interface NurseryStatus {
  plant: Plant;
  species: Species;
  germ: GermInfo;
  stage: NurseryStage;
  /** Jours depuis le semis. */
  age: number;
  germFrom: ISODate;
  germTo: ISODate;
  /** Pas de levée nettement après la date attendue. */
  noGerm: boolean;
  /** Repiquage en godets prévu (si utile pour l'espèce). */
  potUpDue?: ISODate;
  hardenFrom: ISODate;
  /** Mise en place possible (taille des plants, et dernières gelées pour une planche dehors). */
  outDate: ISODate;
  /** La date de mise en place est retardée par les gelées. */
  frostDelay: boolean;
  /** Planche de destination à l'abri (serre) : pas d'endurcissement. */
  sheltered: boolean;
  /** Nuit annoncée trop fraîche pour laisser les plants dehors (°C), dans les 3 jours. */
  coldNight?: { date: ISODate; tmin: number };
}

/** Jours d'endurcissement avant la mise en place. */
export const HARDEN_DAYS = 10;

/** Semis à l'abri en cours (pas encore mis en place). */
export function nurseryPlants(data: GardenData): Plant[] {
  return data.plants.filter((p) => p.indoor && p.status === 'growing' && !p.transplantDate).sort((a, b) => a.sowDate.localeCompare(b.sowDate) || a.id.localeCompare(b.id));
}

/** Date (année de `from`) d'un jour de l'année. */
function dateOfDoy(year: number, doy: number): ISODate {
  return addDays(`${year}-01-01`, doy - 1);
}

export function nurseryStatus(p: Plant, data: GardenData, today: ISODate): NurseryStatus {
  const sp = speciesOf(p);
  const germ = germInfo(sp);
  const bed = data.beds.find((b) => b.id === p.bedId);
  const sheltered = bed?.kind === 'greenhouse' || bed?.kind === 'hydro';
  const age = Math.max(0, diffDays(p.sowDate, today));
  const germFrom = addDays(p.sowDate, germ.days[0]);
  const germTo = addDays(p.sowDate, germ.days[1]);
  // Levée non notée depuis longtemps : on la suppose faite (semis d'avant le coin semis, oubli).
  const assumed = !p.germDate && age > germ.days[1] + 30;
  const germDate = p.germDate ?? (assumed ? germTo : undefined);
  const noGerm = !germDate && today > addDays(germTo, Math.max(5, Math.round(germ.days[1] * 0.5)));
  const potUpDue = germ.potUp ? addDays(germDate ?? addDays(p.sowDate, Math.round((germ.days[0] + germ.days[1]) / 2)), germ.potUp) : undefined;
  // Taille des plants : comme la tâche de repiquage (durée de référence, ajustée à la chaleur).
  const scale = timeline(p, data, today).scale;
  const sizeReady = addDays(p.sowDate, Math.round((sp.transplantAfter ?? 42) * scale));
  // Dehors : après les dernières gelées (les frileuses une semaine plus tard).
  let outDate = sizeReady;
  let frostDelay = false;
  if (!sheltered) {
    const clim = CLIMATES[data.settings.climate];
    const year = Number(p.sowDate.slice(0, 4));
    const lag = sp.frost === 'tender' ? 7 : sp.frost === 'half' ? 0 : -21;
    // Semis d'automne (après l'été) : pas de contrainte de gel de printemps.
    const spring = dayOfYear(p.sowDate) < 200;
    const safe = spring ? dateOfDoy(year, clim.lastFrost + lag) : sizeReady;
    if (safe > outDate) {
      outDate = safe;
      frostDelay = true;
    }
  }
  const hardenFrom = sheltered ? outDate : addDays(outDate, -HARDEN_DAYS);
  let stage: NurseryStage;
  if (!germDate) stage = 'sown';
  else if (today >= outDate) stage = 'ready';
  else if (!sheltered && (p.hardenDate || today >= hardenFrom)) stage = 'hardening';
  else if (p.potUpDate || !germ.potUp) stage = germ.potUp ? 'potted' : 'seedling';
  else stage = 'seedling';
  // Nuits fraîches annoncées pendant l'endurcissement ou à la mise en place.
  let coldNight: NurseryStatus['coldNight'];
  if (!sheltered && (stage === 'hardening' || stage === 'ready')) {
    const soon = (data.weather?.days ?? []).filter((d) => d.date >= today && d.date <= addDays(today, 3));
    const cold = soon.find((d) => d.tmin < germ.nightMin);
    if (cold) coldNight = { date: cold.date, tmin: cold.tmin };
  }
  return { plant: p, species: sp, germ, stage, age, germFrom, germTo, noGerm, potUpDue, hardenFrom, outDate, frostDelay, sheltered, coldNight };
}

/** Espèces à semer à l'abri ce mois-ci (calendrier décalé selon le climat). */
export function sowIndoorNow(data: GardenData, today: ISODate, all: Species[]): { now: Species[]; next: Species[] } {
  const m = Number(today.slice(5, 7));
  const next = (m % 12) + 1;
  const grown = new Set([...data.plants.map((p) => p.speciesId), ...data.seeds.map((s) => s.speciesId), ...(data.plan?.wishes ?? []).map((w) => w.speciesId)]);
  const can = all.filter((s) => s.sowIndoor && s.type !== 'cover');
  const inM = (s: Species, month: number) => inWindow(month, shiftWindows(s.sowIndoor, data.settings.climate));
  // Les espèces déjà cultivées (cultures, graines, envies) d'abord.
  const order = (a: Species, b: Species) => Number(grown.has(b.id)) - Number(grown.has(a.id)) || a.name.fr.localeCompare(b.name.fr);
  return { now: can.filter((s) => inM(s, m)).sort(order), next: can.filter((s) => !inM(s, m) && inM(s, next)).sort(order) };
}
