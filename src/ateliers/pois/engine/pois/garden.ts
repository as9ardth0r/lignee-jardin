/**
 * Environnement de culture (« Mon jardin ») des pois.
 *
 * Plante de saison fraîche ; pertes estimées en ESPÉRANCE (moyenne sur
 * plusieurs saisons), ordres de grandeur pédagogiques :
 *  - oïdium (Erysiphe pisi), surtout sur les semis tardifs, en été sec et
 *    chaud : er1 ou Er3 ;
 *  - fusariose (Fusarium oxysporum f. sp. pisi), sols « fatigués » : Fw ;
 *  - virus de la mosaïque transmis par les semences et les pucerons : sbm1 ;
 *  - semis d’automne : seuls les pois d’hiver (Hr) passent l’hiver ;
 *  - chaleur : au-delà de 25 °C, la floraison avorte ;
 *  - saison trop courte.
 */

import type { PsEngine, PsIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'nordic';

export interface GardenSettings {
  climate: ClimateId;
  /** Oïdium (semis tardifs, été sec). */
  mildew: boolean;
  /** Sol à fusariose. */
  fusarium: boolean;
  /** Pucerons, virus de la mosaïque. */
  virus: boolean;
  /** Semis d’automne. */
  autumn: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', mildew: false, fusarium: false, virus: false, autumn: false };

interface ClimateProfile {
  winterMin: number;
  hot: number;
  season: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { winterMin: -6, hot: 0.1, season: 150 },
  continental: { winterMin: -15, hot: 0.35, season: 130 },
  mediterranean: { winterMin: -3, hot: 0.8, season: 120 },
  mountain: { winterMin: -18, hot: 0.05, season: 110 },
  nordic: { winterMin: -22, hot: 0, season: 110 },
};

export type LossCause = 'mildew' | 'fusarium' | 'virus' | 'frost' | 'heat' | 'season';

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

/** Jours de culture effectifs : un pois d’hiver semé au printemps fleurit bien plus tôt. */
export function effectiveDays(engine: PsEngine, ind: PsIndividual, garden: GardenSettings): number {
  const winter = engine.has(ind.genotype, 'Hr');
  if (winter && !garden.autumn) return Math.max(60, ind.pheno.days - 110);
  if (!winter && garden.autumn) return ind.pheno.days + 110;
  return ind.pheno.days;
}

export function gardenOutcome(engine: PsEngine, ind: PsIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = effectiveDays(engine, ind, garden);
  const winter = engine.has(ind.genotype, 'Hr');

  if (garden.mildew) {
    const gene: VariantId = res.has('er3') && !res.has('er1') ? 'er3' : 'er1';
    const ok = res.has('er1') || res.has('er3');
    add({ cause: 'mildew', pct: ok ? 0.03 : 0.45 * (garden.autumn ? 0.4 : 1) * (days > 100 ? 1 : 0.6), gene, protectedBy: ok });
  }
  if (garden.fusarium) {
    const ok = res.has('Fw');
    add({ cause: 'fusarium', pct: ok ? 0.02 : 0.5, gene: 'Fw', protectedBy: ok });
  }
  if (garden.virus) {
    const ok = res.has('sbm1');
    add({ cause: 'virus', pct: ok ? 0 : 0.25, gene: 'sbm1', protectedBy: ok });
  }
  if (garden.autumn) {
    const hardiness = winter ? -14 : -5;
    const gap = hardiness - c.winterMin;
    if (gap > 0) add({ cause: 'frost', pct: Math.min(0.95, gap / 8 + (winter ? 0 : 0.3)) });
    else if (!winter) add({ cause: 'frost', pct: 0.3 });
  } else {
    add({ cause: 'heat', pct: c.hot * (days > 100 ? 0.4 : 0.15) });
    const overrun = days - c.season;
    if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 40) });
  }

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 1000) / 1000, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.pois.garden.v1';

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
