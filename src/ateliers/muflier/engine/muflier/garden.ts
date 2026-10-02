/**
 * Environnement de culture (« Mon jardin ») des mufliers.
 *
 * Pertes estimées en ESPÉRANCE (moyenne sur plusieurs saisons), en tiges
 * florales à couper ; ordres de grandeur pédagogiques :
 *  - rouille du muflier (Puccinia antirrhini) : pustules brunes sous les
 *    feuilles, étés tièdes et humides ; Pa protège ;
 *  - mildiou (Peronospora antirrhini), printemps frais et humides, surtout
 *    sur les jeunes plants : aucune résistance connue ici ;
 *  - chaleur : au-dessus de 30 °C le muflier fleurit peu et ses épis
 *    raccourcissent ;
 *  - saison trop courte pour une variété tardive.
 * Le PINCEMENT (couper la tête du jeune plant au-dessus de la 3e paire de
 * feuilles) donne plus de tiges, mais retarde la floraison de 10 à 15 jours.
 */

import type { AmEngine, AmIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'tropical';

export interface GardenSettings {
  climate: ClimateId;
  rust: boolean;
  mildew: boolean;
  /** Plants pincés. */
  pinch: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', rust: false, mildew: false, pinch: false };

interface ClimateProfile {
  humid: number;
  hot: number;
  /** Jours disponibles du semis (sous abri) à la fin de la floraison utile. */
  season: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { humid: 0.8, hot: 0.05, season: 200 },
  continental: { humid: 0.4, hot: 0.3, season: 170 },
  mediterranean: { humid: 0.3, hot: 0.6, season: 220 },
  mountain: { humid: 0.5, hot: 0, season: 140 },
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
  /** Tiges florales attendues sans pertes. */
  potential: number;
  /** Tiges florales récoltées en moyenne. */
  realized: number;
  days: number;
  losses: Loss[];
  totalLoss: number;
}

export function gardenOutcome(engine: AmEngine, ind: AmIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = ind.pheno.days + (garden.pinch ? 12 : 0);

  if (garden.rust) {
    const ok = res.has('Pa');
    add({ cause: 'rust', pct: (ok ? 0.04 : 0.45) * (0.4 + 0.6 * c.humid), gene: 'Pa', protectedBy: ok, partial: ok });
  }
  if (garden.mildew) add({ cause: 'mildew', pct: 0.25 * (0.3 + c.humid) });
  add({ cause: 'heat', pct: c.hot * 0.35 });
  const overrun = days + 40 - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 40) });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potential = Math.round(engine.stems(ind) * (garden.pinch ? 1.5 : 1));
  return { potential, realized: Math.round(potential * keep * 10) / 10, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.muflier.garden.v1';

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
