/**
 * Environnement de culture (« Mon jardin ») des haricots.
 *
 * Le haricot craint le froid (semis quand le sol dépasse 12 °C, aucune
 * gelée). Pertes estimées en ESPÉRANCE (moyenne sur plusieurs saisons),
 * ordres de grandeur pédagogiques :
 *  - mosaïque commune (BCMV, pucerons et semences) : I protège ; face à la
 *    souche NÉCROTIQUE (BCMNV), une plante I sans bc-3 meurt de « racine
 *    noire » ; bc-3 protège de toutes les souches ;
 *  - anthracnose (taches noires creuses sur gousses, transmise par les
 *    semences, temps humide) : Co-2 (« Are ») ;
 *  - rouille (temps chaud et humide, fin d’été) : Ur-3 ;
 *  - graisse (taches huileuses auréolées, étés frais et humides) : Pse-1 ;
 *  - haricot d’Espagne : les fleurs coulent au-dessus de ~30 °C, et sans
 *    bourdons (serre) elles ne sont pas « déclenchées » ;
 *  - Lima et tépari demandent beaucoup de chaleur ;
 *  - saison trop courte : les graines n’ont pas le temps de sécher.
 */

import type { BeanEngine, BeanIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'greenhouse';
export type MosaicStrain = 'none' | 'BCMV' | 'BCMNV';
export const MOSAIC: MosaicStrain[] = ['none', 'BCMV', 'BCMNV'];

export interface GardenSettings {
  climate: ClimateId;
  mosaic: MosaicStrain;
  /** Anthracnose présente (semences non saines, temps humide). */
  anthracnose: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', mosaic: 'none', anthracnose: false };

interface ClimateProfile {
  cool: number;
  /** Chaleur excessive en été (coulure des fleurs du haricot d’Espagne). */
  hot: number;
  /** Jours disponibles du semis aux premiers froids. */
  season: number;
  daysShift: number;
  /** Rouille : chaleur humide. */
  rust: number;
  /** Graisse : fraîcheur humide. */
  halo: number;
  /** Serre : pas de bourdons pour le haricot d’Espagne. */
  greenhouse: boolean;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { cool: 0.25, hot: 0, season: 150, daysShift: 6, rust: 0.4, halo: 0.6, greenhouse: false },
  continental: { cool: 0.1, hot: 0.3, season: 150, daysShift: 0, rust: 0.6, halo: 0.3, greenhouse: false },
  mediterranean: { cool: 0, hot: 0.8, season: 190, daysShift: -5, rust: 0.4, halo: 0.1, greenhouse: false },
  mountain: { cool: 0.5, hot: 0, season: 110, daysShift: 15, rust: 0.2, halo: 0.6, greenhouse: false },
  greenhouse: { cool: 0, hot: 0.5, season: 200, daysShift: -8, rust: 0.5, halo: 0.1, greenhouse: true },
};

export type LossCause = 'mosaic' | 'blackroot' | 'anthracnose' | 'rust' | 'halo' | 'cool' | 'heat' | 'season' | 'pollination';

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

/** Jours supplémentaires entre les premières gousses et les grains secs. */
export const DRY_EXTRA_DAYS = 40;

export function gardenOutcome(engine: BeanEngine, ind: BeanIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = Math.max(35, ind.pheno.days + c.daysShift);

  if (garden.mosaic !== 'none') {
    const bc3 = res.has('bc3');
    const I = res.has('I');
    if (garden.mosaic === 'BCMV') add({ cause: 'mosaic', pct: bc3 || I ? 0.03 : 0.3, gene: bc3 ? 'bc3' : 'I', protectedBy: bc3 || I });
    else if (bc3) add({ cause: 'mosaic', pct: 0.03, gene: 'bc3', protectedBy: true });
    else if (I) add({ cause: 'blackroot', pct: 0.8, gene: 'bc3' });
    else add({ cause: 'mosaic', pct: 0.4, gene: 'bc3' });
  }
  if (garden.anthracnose) {
    const ok = res.has('Co2');
    add({ cause: 'anthracnose', pct: ok ? 0.04 : 0.4, gene: 'Co2', protectedBy: ok });
  }
  const ur = res.has('Ur3');
  add({ cause: 'rust', pct: (ur ? 0.1 : 1) * 0.25 * c.rust, gene: 'Ur3', protectedBy: ur });
  const pse = res.has('Pse1');
  add({ cause: 'halo', pct: (pse ? 0.1 : 1) * 0.25 * c.halo, gene: 'Pse1', protectedBy: pse });

  const warmSpecies = ind.species === 'lunatus' || ind.species === 'acutifolius';
  add({ cause: 'cool', pct: Math.min(0.85, 0.35 * c.cool * (warmSpecies ? 2.2 : ind.species === 'coccineus' ? 0.4 : 1)) });
  const heatSensitive = ind.species === 'coccineus' || ind.species === 'dumosus';
  add({ cause: 'heat', pct: 0.4 * c.hot * (heatSensitive ? 1 : ind.species === 'acutifolius' ? 0 : 0.2) });
  const overrun = days + DRY_EXTRA_DAYS - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 45) });
  if (c.greenhouse && ind.species === 'coccineus') add({ cause: 'pollination', pct: 0.5 });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 1000) / 1000, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.haricot.garden.v1';

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
