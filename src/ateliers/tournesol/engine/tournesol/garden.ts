/**
 * Environnement de culture (« Mon jardin ») des tournesols.
 *
 * Pertes estimées en ESPÉRANCE (moyenne sur plusieurs saisons), en
 * capitules ; ordres de grandeur pédagogiques :
 *  - mildiou du tournesol (Plasmopara halstedii), printemps humide :
 *    plantes naines aux feuilles marbrées ; gène Pl de résistance ;
 *  - sclérotinia (pourriture blanche du capitule), fin d’été humide ;
 *  - manque de chaleur et de soleil : le tournesol aime la chaleur ;
 *  - saison trop courte pour une variété tardive.
 * Le PINCEMENT d’une variété à tige unique (au stade 4 à 6 feuilles)
 * donne 3 à 5 tiges plus courtes, à capitules plus petits : technique des
 * producteurs de fleurs coupées.
 */

import type { HaEngine, HaIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'tropical';

export interface GardenSettings {
  climate: ClimateId;
  /** Mildiou du tournesol. */
  rust: boolean;
  /** Sclérotinia (pourriture du capitule). */
  mildew: boolean;
  /** Plants pincés. */
  pinch: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', rust: false, mildew: false, pinch: false };

interface ClimateProfile {
  humid: number;
  hot: number;
  season: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { humid: 0.8, hot: 0.35, season: 160 },
  continental: { humid: 0.4, hot: 0.8, season: 170 },
  mediterranean: { humid: 0.3, hot: 1, season: 200 },
  mountain: { humid: 0.5, hot: 0.15, season: 120 },
  tropical: { humid: 0.9, hot: 1, season: 300 },
};

export type LossCause = 'rust' | 'mildew' | 'heat' | 'season';

export interface Loss {
  cause: LossCause;
  pct: number;
  gene?: VariantId;
  protectedBy?: boolean;
  partial?: boolean;
}

export interface GardenOutcome {
  potential: number;
  realized: number;
  days: number;
  losses: Loss[];
  totalLoss: number;
}

export function gardenOutcome(engine: HaEngine, ind: HaIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const branched = engine.appearance(ind).flecked;
  const pinched = garden.pinch && !branched;
  const days = ind.pheno.days + (pinched ? 7 : 0);
  if (garden.rust) {
    const res = engine.resistances(ind).includes('Pl');
    add({ cause: 'rust', pct: res ? 0.02 : 0.25 * (0.6 + c.humid * 0.5), gene: 'Pl', protectedBy: res });
  }
  if (garden.mildew) add({ cause: 'mildew', pct: 0.08 + 0.17 * c.humid });
  // Le tournesol veut de la chaleur et du soleil.
  add({ cause: 'heat', pct: Math.max(0, (1 - c.hot) * 0.35) });
  const overrun = days + 40 - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 40) });
  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potential = Math.round(engine.stems(ind) * (pinched ? 4 : 1) * 10) / 10;
  return { potential, realized: Math.round(potential * keep * 10) / 10, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.tournesol.garden.v1';

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
