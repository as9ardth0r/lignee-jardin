/**
 * Environnement de culture (« Mon jardin ») des pois de senteur.
 *
 * Pertes estimées en ESPÉRANCE (moyenne sur plusieurs saisons), en tiges
 * florales ; ordres de grandeur pédagogiques :
 *  - oïdium (Erysiphe), fin d’été sec et nuits fraîches : feuilles
 *    blanches, plantes épuisées ; aucune résistance mendélienne connue ;
 *  - pucerons, qui transmettent des virus (mosaïque, marbrure) ;
 *  - chaleur : au-dessus de 25-30 °C les boutons tombent et la floraison
 *    s’arrête — d’où le semis d’automne ou très précoce dans le Midi ;
 *  - saison trop courte pour une variété tardive.
 * Le PINCEMENT (au-dessus de la 3e ou 4e paire de feuilles) donne une
 * plante ramifiée, plus de tiges, floraison un peu plus tardive.
 */

import type { LoEngine, LoIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'tropical';

export interface GardenSettings {
  climate: ClimateId;
  /** Oïdium. */
  rust: boolean;
  /** Pucerons et virus. */
  mildew: boolean;
  /** Plants pincés. */
  pinch: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', rust: false, mildew: false, pinch: true };

interface ClimateProfile {
  humid: number;
  hot: number;
  season: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { humid: 0.8, hot: 0.05, season: 220 },
  continental: { humid: 0.4, hot: 0.45, season: 170 },
  mediterranean: { humid: 0.3, hot: 0.8, season: 160 },
  mountain: { humid: 0.5, hot: 0, season: 160 },
  tropical: { humid: 0.9, hot: 1, season: 130 },
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

export function gardenOutcome(engine: LoEngine, ind: LoIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = ind.pheno.days + (garden.pinch ? 10 : 0);
  if (garden.rust) add({ cause: 'rust', pct: 0.3 * (1.2 - c.humid * 0.5) });
  if (garden.mildew) add({ cause: 'mildew', pct: 0.2 });
  // Les variétés précoces fleurissent avant les fortes chaleurs.
  add({ cause: 'heat', pct: Math.min(0.85, c.hot * 0.55 * Math.min(1.3, days / 100)) });
  const overrun = days + 30 - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 40) });
  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potential = Math.round(engine.stems(ind) * (garden.pinch ? 1.3 : 1));
  return { potential, realized: Math.round(potential * keep * 10) / 10, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.pdsenteur.garden.v1';

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
