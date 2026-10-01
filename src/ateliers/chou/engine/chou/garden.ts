/**
 * Environnement de culture (« Mon jardin ») des choux.
 *
 * Plantes de saison fraîche, gourmandes ; pertes estimées en ESPÉRANCE
 * (moyenne sur plusieurs saisons), ordres de grandeur pédagogiques :
 *  - hernie (Plasmodiophora brassicae, sols acides et humides ; spores
 *    vivantes 15 ans) : CRa ;
 *  - fusariose jaune (sols chauds) : FOC1 ;
 *  - mildiou (temps frais et humide) : Pp523 ;
 *  - gel : chaque plante supporte un certain froid (trait « gel ») ;
 *  - chaleur : choux-fleurs et brocolis « boutonnent » ou montent ;
 *  - saison trop courte.
 */

import type { BrEngine, BrIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'nordic';

export interface GardenSettings {
  climate: ClimateId;
  /** Sol infesté par la hernie. */
  clubroot: boolean;
  /** Fusariose (sols chauds). */
  fusarium: boolean;
  /** Culture d’hiver (récolte après les gelées). */
  winter: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', clubroot: false, fusarium: false, winter: false };

interface ClimateProfile {
  /** Gel hivernal minimal (°C). */
  winterMin: number;
  humid: number;
  hot: number;
  season: number;
  daysShift: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { winterMin: -8, humid: 0.7, hot: 0.1, season: 300, daysShift: 0 },
  continental: { winterMin: -15, humid: 0.4, hot: 0.4, season: 220, daysShift: 0 },
  mediterranean: { winterMin: -3, humid: 0.2, hot: 0.9, season: 320, daysShift: -5 },
  mountain: { winterMin: -20, humid: 0.5, hot: 0.05, season: 170, daysShift: 12 },
  nordic: { winterMin: -25, humid: 0.5, hot: 0, season: 150, daysShift: 10 },
};

export type LossCause = 'clubroot' | 'fusarium' | 'mildew' | 'frost' | 'heat' | 'season';

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

export function gardenOutcome(engine: BrEngine, ind: BrIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = Math.max(25, ind.pheno.days + c.daysShift);
  const app = engine.appearance(ind);

  if (garden.clubroot) {
    const ok = res.has('CRa');
    add({ cause: 'clubroot', pct: ok ? 0.05 : 0.6, gene: 'CRa', protectedBy: ok });
  }
  if (garden.fusarium) {
    const ok = res.has('Foc1');
    add({ cause: 'fusarium', pct: (ok ? 0.03 : 0.45) * (0.5 + c.hot), gene: 'Foc1', protectedBy: ok });
  }
  const pp = res.has('Pp523');
  add({ cause: 'mildew', pct: (pp ? 0.1 : 1) * 0.2 * c.humid, gene: 'Pp523', protectedBy: pp });
  if (garden.winter) {
    const gap = ind.pheno.frostC - c.winterMin;
    if (gap > 0) add({ cause: 'frost', pct: Math.min(0.95, gap / 8) });
  }
  const heatSensitive = app.morphotype === 'cauliflower' || app.morphotype === 'romanesco' || app.morphotype === 'broccoli' || app.morphotype === 'cabbage';
  if (!garden.winter) add({ cause: 'heat', pct: c.hot * (heatSensitive ? 0.35 : 0.1) });
  const overrun = days - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.95, overrun / 40) });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 100) / 100, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.chou.garden.v1';

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
