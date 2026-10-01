/**
 * Environnement de culture (« Mon jardin ») des pommes de terre.
 *
 * Pertes estimées en ESPÉRANCE (moyenne sur plusieurs saisons), ordres de
 * grandeur pédagogiques :
 *  - mildiou (Phytophthora infestans, temps doux et humide ; la Grande
 *    Famine irlandaise de 1845) : R1 (contourné) ou Rpi-blb (large) ;
 *  - nématode à kyste doré (Globodera rostochiensis) : H1 ;
 *  - virus Y transmis par les pucerons, qui s’ACCUMULE à chaque
 *    replantation de tubercules sans Ry (« dégénérescence ») ; la graine
 *    vraie et le plant certifié repartent sains ;
 *  - photopériode : sans Cdf (StCDF1), une pomme de terre andine ne
 *    tubérise pas en jours longs ;
 *  - gel tardif du feuillage, chaleur (la tubérisation s’arrête au-dessus
 *    de ~25 °C), saison trop courte.
 */

import type { PtEngine, PtIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'andes';

export interface GardenSettings {
  climate: ClimateId;
  /** Année humide, mildiou présent. */
  blight: boolean;
  /** Sol infesté par le nématode doré. */
  nematode: boolean;
  /** Pucerons et virus Y (plants replantés). */
  virus: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', blight: false, nematode: false, virus: false };

interface ClimateProfile {
  /** Gel tardif (°C) au printemps. */
  lateFrost: number;
  humid: number;
  hot: number;
  season: number;
  longDays: boolean;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { lateFrost: -1, humid: 0.9, hot: 0.05, season: 170, longDays: true },
  continental: { lateFrost: -2.5, humid: 0.5, hot: 0.3, season: 150, longDays: true },
  mediterranean: { lateFrost: 0, humid: 0.3, hot: 0.8, season: 130, longDays: true },
  mountain: { lateFrost: -3, humid: 0.6, hot: 0, season: 120, longDays: true },
  andes: { lateFrost: -4, humid: 0.6, hot: 0, season: 200, longDays: false },
};

export type LossCause = 'blight' | 'nematode' | 'virus' | 'photoperiod' | 'frost' | 'heat' | 'season';

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

export function gardenOutcome(engine: PtEngine, ind: PtIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = ind.pheno.days;
  const app = engine.appearance(ind);

  if (garden.blight) {
    // Les variétés précoces échappent en partie : récoltées avant l’épidémie d’été.
    const escape = days < 95 ? 0.55 : days < 115 ? 0.8 : 1;
    const base = 0.65 * c.humid * escape;
    if (res.has('Rpi-blb1')) add({ cause: 'blight', pct: base * 0.06, gene: 'Rpi-blb1', protectedBy: true });
    else if (res.has('R1')) add({ cause: 'blight', pct: base * 0.85, gene: 'R1', protectedBy: true, partial: true });
    else add({ cause: 'blight', pct: base, gene: 'Rpi-blb1', protectedBy: false });
  }
  if (garden.nematode) {
    const ok = res.has('H1');
    add({ cause: 'nematode', pct: ok ? 0.03 : 0.4, gene: 'H1', protectedBy: ok });
  }
  if (garden.virus) {
    const ok = res.has('Ry');
    const gen = ind.tuberGen ?? 0;
    add({ cause: 'virus', pct: ok ? 0 : Math.min(0.6, 0.06 + 0.12 * gen), gene: 'Ry', protectedBy: ok });
  }
  if (c.longDays && !app.longDay) add({ cause: 'photoperiod', pct: 0.75 });
  const gap = ind.pheno.frostC - c.lateFrost;
  if (gap > 0) add({ cause: 'frost', pct: Math.min(0.5, gap * 0.12) });
  add({ cause: 'heat', pct: c.hot * (days > 120 ? 0.35 : 0.15) });
  const overrun = days - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 50) });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 100) / 100, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.patate.garden.v1';

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
