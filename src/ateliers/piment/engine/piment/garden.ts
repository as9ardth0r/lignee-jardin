/**
 * Environnement de culture (« Mon jardin ») des piments et poivrons.
 *
 * Plante de chaleur : levée à 25 °C, croissance optimale 20–30 °C, nouaison
 * difficile sous 15 °C la nuit (et au-dessus de 32 °C). Pertes estimées en
 * ESPÉRANCE (moyenne sur plusieurs saisons, pas un tirage), ordres de
 * grandeur pédagogiques :
 *  - tobamovirus (TMV, ToMV, PMMoV), transmis par contact et par les
 *    semences : pathotypes P0, P1, P1.2, P1.2.3 ; il faut au moins L1, L2,
 *    L3 ou L4 respectivement ;
 *  - maladie bronzée (TSWV), transmise par les thrips : Tsw protège (des
 *    souches qui contournent Tsw existent) ;
 *  - virus Y (PVY), transmis par les pucerons : Pvr4 protège de tous les
 *    pathotypes, pvr2 des pathotypes 0 et 1 ;
 *  - nématodes à galles (sols sableux et chauds) : Me3 ;
 *  - gale bactérienne (temps chaud et humide) : Bs2 ;
 *  - manque de chaleur : moins de fruits, et des fruits moins piquants ;
 *  - saison trop courte : fruits qui n’ont pas le temps de mûrir (les
 *    chinense et les baccatum, lents, en souffrent le plus).
 */

import type { PepperEngine, PepperIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'greenhouse';
export type TobamoPathotype = 'none' | 'P0' | 'P1' | 'P1.2' | 'P1.2.3';
export const TOBAMO: TobamoPathotype[] = ['none', 'P0', 'P1', 'P1.2', 'P1.2.3'];

export interface GardenSettings {
  climate: ClimateId;
  tobamo: TobamoPathotype;
  /** Thrips et maladie bronzée présents. */
  tswv: boolean;
  /** Pucerons et virus Y présents. */
  pvy: boolean;
  /** Sol à nématodes à galles. */
  nematodes: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'continental', tobamo: 'none', tswv: false, pvy: false, nematodes: false };

interface ClimateProfile {
  /** Déficit de chaleur 0–1. */
  cool: number;
  /** Jours disponibles de la plantation aux premiers froids. */
  season: number;
  daysShift: number;
  /** Chaleur humide (gale bactérienne) 0–1. */
  wet: number;
  /** Nouaison insuffisante sans insectes ni vent. */
  pollination: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { cool: 0.4, season: 130, daysShift: 10, wet: 0.7, pollination: 0 },
  continental: { cool: 0.15, season: 135, daysShift: 3, wet: 0.5, pollination: 0 },
  mediterranean: { cool: 0, season: 175, daysShift: -8, wet: 0.3, pollination: 0 },
  mountain: { cool: 0.6, season: 100, daysShift: 20, wet: 0.5, pollination: 0 },
  greenhouse: { cool: 0, season: 190, daysShift: -10, wet: 0.2, pollination: 0.08 },
};

export type LossCause = 'tobamo' | 'tswv' | 'pvy' | 'nematodes' | 'bacterial' | 'cool' | 'season' | 'pollination';

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
  /** Piquant au jardin (le manque de chaleur le réduit). */
  shu: number;
  losses: Loss[];
  totalLoss: number;
}

const L_NEEDED: Record<Exclude<TobamoPathotype, 'none'>, number> = { P0: 1, P1: 2, 'P1.2': 3, 'P1.2.3': 4 };

export function gardenOutcome(engine: PepperEngine, ind: PepperIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = Math.max(45, ind.pheno.days + c.daysShift);

  if (garden.tobamo !== 'none') {
    const need = L_NEEDED[garden.tobamo];
    const lv = engine.lLevel(ind);
    const ok = lv >= need;
    add({ cause: 'tobamo', pct: ok ? 0.03 : 0.45, gene: (`L${ok ? lv : need}`) as VariantId, protectedBy: ok });
  }
  if (garden.tswv) {
    const ok = res.has('Tsw');
    add({ cause: 'tswv', pct: ok ? 0.05 : 0.35, gene: 'Tsw', protectedBy: ok });
  }
  if (garden.pvy) {
    const full = res.has('Pvr4');
    const part = !full && res.has('pvr2');
    add({ cause: 'pvy', pct: full ? 0.02 : part ? 0.08 : 0.25, gene: full ? 'Pvr4' : 'pvr2', protectedBy: full || part, partial: part });
  }
  if (garden.nematodes) {
    const ok = res.has('Me3');
    add({ cause: 'nematodes', pct: ok ? 0.03 : 0.3, gene: 'Me3', protectedBy: ok });
  }
  const bs = res.has('Bs2');
  add({ cause: 'bacterial', pct: (bs ? 0.1 : 1) * 0.2 * c.wet, gene: 'Bs2', protectedBy: bs });

  // Le rocoto supporte le frais ; les chinense y sont les plus sensibles.
  const coolFactor = ind.species === 'pubescens' ? 0.4 : ind.species === 'chinense' ? 1.3 : 1;
  add({ cause: 'cool', pct: Math.min(0.8, 0.4 * c.cool * coolFactor) });
  const overrun = days + 30 - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 45) });
  add({ cause: 'pollination', pct: c.pollination });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  const shuRaw = ind.pheno.shu * (1 - 0.35 * c.cool) * (garden.climate === 'mediterranean' ? 1.1 : 1);
  return {
    potentialKg,
    realizedKg: Math.round(potentialKg * keep * 100) / 100,
    days,
    shu: shuRaw <= 0 ? 0 : shuRaw < 1000 ? Math.round(shuRaw / 10) * 10 : Math.round(shuRaw / 100) * 100,
    losses: losses.sort((x, y) => y.pct - x.pct),
    totalLoss: 1 - keep,
  };
}

const KEY = 'lignee.piment.garden.v1';

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
