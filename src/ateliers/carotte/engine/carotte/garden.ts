/**
 * Environnement de culture (« Mon jardin ») des carottes.
 *
 * Pertes estimées en ESPÉRANCE (moyenne sur plusieurs saisons), ordres de
 * grandeur pédagogiques :
 *  - mouche de la carotte (Psila rosae) : galeries dans la racine ; cf
 *    réduit les dégâts de moitié environ ;
 *  - alternariose (Alternaria dauci), étés humides : Alt ;
 *  - nématodes à galles (Meloidogyne), sols sableux chauds : racines
 *    fourchues et galeuses ; Mj-1 ;
 *  - montée en graines : les carottes annuelles (Vrn1) montent presque
 *    toutes ; les bisannuelles montent un peu si le semis précoce prend
 *    un coup de froid ;
 *  - chaleur (racines courtes, pâles, fibreuses) et saison trop courte.
 */

import type { DcEngine, DcIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'tropical';

export interface GardenSettings {
  climate: ClimateId;
  /** Mouche de la carotte. */
  fly: boolean;
  /** Alternariose. */
  alternaria: boolean;
  /** Sol à nématodes à galles. */
  nematode: boolean;
  /** Semis précoce (février-mars, sous le froid). */
  early: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', fly: false, alternaria: false, nematode: false, early: false };

interface ClimateProfile {
  humid: number;
  hot: number;
  season: number;
  cold: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { humid: 0.8, hot: 0.05, season: 200, cold: 0.3 },
  continental: { humid: 0.4, hot: 0.3, season: 170, cold: 0.6 },
  mediterranean: { humid: 0.3, hot: 0.6, season: 200, cold: 0.1 },
  mountain: { humid: 0.5, hot: 0, season: 130, cold: 0.8 },
  tropical: { humid: 0.9, hot: 1, season: 300, cold: 0 },
};

export type LossCause = 'fly' | 'alternaria' | 'nematode' | 'bolting' | 'heat' | 'season';

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

export function gardenOutcome(engine: DcEngine, ind: DcIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = ind.pheno.days;
  const app = engine.appearance(ind);

  if (garden.fly) {
    const ok = res.has('cf');
    add({ cause: 'fly', pct: ok ? 0.15 : 0.35, gene: 'cf', protectedBy: ok, partial: ok });
  }
  if (garden.alternaria) {
    const ok = res.has('Alt');
    add({ cause: 'alternaria', pct: (ok ? 0.05 : 0.4) * (0.4 + c.humid) * (days > 100 ? 1 : 0.6), gene: 'Alt', protectedBy: ok });
  }
  if (garden.nematode) {
    const ok = res.has('Mj1');
    add({ cause: 'nematode', pct: (ok ? 0.03 : 0.45) * (0.5 + c.hot * 0.5), gene: 'Mj1', protectedBy: ok });
  }
  if (app.annual) add({ cause: 'bolting', pct: c.cold > 0.05 || garden.early ? 0.7 : 0.35 });
  else if (garden.early) add({ cause: 'bolting', pct: 0.12 * c.cold });
  add({ cause: 'heat', pct: c.hot * 0.3 });
  const overrun = days - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 40) });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 1000) / 1000, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.carotte.garden.v1';

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
