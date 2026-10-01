/**
 * Environnement de culture (« Mon jardin ») du maïs.
 *
 * Plante de chaleur (semis quand le sol dépasse 10–12 °C), gourmande en eau
 * à la floraison. Pertes estimées en ESPÉRANCE (moyenne sur plusieurs
 * saisons), ordres de grandeur pédagogiques :
 *  - helminthosporiose du Nord (Exserohilum turcicum, étés humides) : Ht1 ;
 *  - rouille commune (Puccinia sorghi) : Rp1-D ;
 *  - helminthosporiose race T (Bipolaris maydis race T) : seules les plantes
 *    à cytoplasme T sont touchées, très gravement (épidémie de 1970 : 15 %
 *    de la récolte américaine perdue) ;
 *  - froid, saison trop courte pour mûrir le grain ;
 *  - jours longs : téosintes et Tripsacum ne fleurissent qu’en jours
 *    courts ; sous nos latitudes, ils fleurissent trop tard ;
 *  - sécheresse à la floraison (climat méditerranéen sans arrosage).
 */

import type { MzEngine, MzIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'tropical';

export interface GardenSettings {
  climate: ClimateId;
  /** Rouille commune présente. */
  rust: boolean;
  /** Helminthosporiose race T présente. */
  raceT: boolean;
  /** Arrosage à la floraison. */
  irrigated: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'continental', rust: false, raceT: false, irrigated: true };

interface ClimateProfile {
  cool: number;
  humid: number;
  dry: number;
  /** Jours disponibles du semis aux premiers froids. */
  season: number;
  daysShift: number;
  /** Jours longs en été (latitude tempérée). */
  longDays: boolean;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { cool: 0.35, humid: 0.7, dry: 0.1, season: 160, daysShift: 8, longDays: true },
  continental: { cool: 0.1, humid: 0.4, dry: 0.3, season: 165, daysShift: 0, longDays: true },
  mediterranean: { cool: 0, humid: 0.15, dry: 0.8, season: 190, daysShift: -6, longDays: true },
  mountain: { cool: 0.6, humid: 0.4, dry: 0.2, season: 130, daysShift: 15, longDays: true },
  tropical: { cool: 0, humid: 0.8, dry: 0.2, season: 240, daysShift: -10, longDays: false },
};

export type LossCause = 'nlb' | 'rust' | 'raceT' | 'cool' | 'season' | 'photoperiod' | 'drought';

export interface Loss {
  cause: LossCause;
  pct: number;
  gene?: VariantId;
  protectedBy?: boolean;
  partial?: boolean;
}

export interface GardenOutcome {
  potentialKg: number;
  realizedKg: number;
  days: number;
  losses: Loss[];
  totalLoss: number;
}

const SHORT_DAY: Record<string, boolean> = { parviglumis: true, mexicana: true, diploperennis: true, tripsacum: false };

export function gardenOutcome(engine: MzEngine, ind: MzIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = Math.max(55, ind.pheno.days + c.daysShift);

  const ht = res.has('Ht1');
  add({ cause: 'nlb', pct: (ht ? 0.15 : 1) * 0.3 * c.humid, gene: 'Ht1', protectedBy: ht });
  if (garden.rust) {
    const rp = res.has('Rp1');
    add({ cause: 'rust', pct: rp ? 0.02 : 0.25, gene: 'Rp1', protectedBy: rp });
  }
  if (garden.raceT && ind.cyto === 'T') add({ cause: 'raceT', pct: 0.7 });
  add({ cause: 'cool', pct: Math.min(0.85, 0.4 * c.cool) });
  const overrun = days - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.95, overrun / 35) });
  if (c.longDays && SHORT_DAY[ind.species] && !ind.hybridWith) add({ cause: 'photoperiod', pct: 0.8 });
  if (!garden.irrigated) add({ cause: 'drought', pct: 0.45 * c.dry });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 1000) / 1000, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.mais.garden.v1';

export function loadGarden(): GardenSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_GARDEN, ...JSON.parse(raw) } : DEFAULT_GARDEN;
  } catch {
    return DEFAULT_GARDEN;
  }
}

export function saveGarden(g: GardenSettings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(g));
  } catch {
    // best-effort
  }
}
