/**
 * Environnement de culture (« Mon jardin ») des courges.
 *
 * Les courges craignent le froid et ont besoin d’une longue saison chaude.
 * Pertes estimées en ESPÉRANCE (moyenne sur plusieurs saisons, pas un
 * tirage), ordres de grandeur pédagogiques :
 *  - oïdium (Podosphaera xanthii) : présent partout en fin d’été, jusqu’à
 *    ~35 % de perte selon le climat ; Pm-0 le réduit fortement (surtout à
 *    l’état homozygote) ; une variété précoce récolte avant le pic ;
 *  - virus transmis par les pucerons (ZYMV surtout) : ~30 % ; Zym protège ;
 *  - saison trop courte : les fruits qui n’ont pas le temps de mûrir avant
 *    les froids sont perdus (grosses variétés tardives en montagne) ;
 *  - serre : sans insectes pollinisateurs, une partie des fleurs femelles
 *    avorte, sauf pollinisation à la main.
 */

import type { SquashEngine, SquashIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'greenhouse';

export interface GardenSettings {
  climate: ClimateId;
  /** Pucerons et virus (ZYMV, mosaïques) présents dans le secteur. */
  virus: boolean;
  /** Pollinisation à la main des fleurs femelles (utile en serre). */
  handPollination: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', virus: false, handPollination: false };

interface ClimateProfile {
  /** Pression d’oïdium 0–1. */
  mildew: number;
  /** Jours disponibles entre le semis et les premiers froids. */
  season: number;
  /** Décalage de la récolte (jours) par rapport à la fiche. */
  daysShift: number;
  /** Déficit de pollinisation sans intervention (0–1). */
  pollination: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { mildew: 0.8, season: 150, daysShift: 8, pollination: 0.05 },
  continental: { mildew: 0.7, season: 145, daysShift: 3, pollination: 0.05 },
  mediterranean: { mildew: 0.9, season: 190, daysShift: -8, pollination: 0.05 },
  mountain: { mildew: 0.5, season: 115, daysShift: 15, pollination: 0.08 },
  greenhouse: { mildew: 1, season: 175, daysShift: -10, pollination: 0.35 },
};

export type LossCause = 'mildew' | 'virus' | 'season' | 'pollination';

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

export function gardenOutcome(engine: SquashEngine, ind: SquashIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = Math.max(40, ind.pheno.days + c.daysShift);

  // Oïdium : arrive en fin d’été ; une variété précoce récolte avant le pic.
  const pm = engine.dose(ind.genotype, 'Pm0');
  const escape = Math.max(0, Math.min(0.5, (100 - days) / 80));
  const mildewBase = 0.35 * c.mildew * (1 - escape);
  add({ cause: 'mildew', pct: mildewBase * (pm === 2 ? 0.15 : pm === 1 ? 0.45 : 1), gene: 'Pm0', protectedBy: pm > 0, partial: pm === 1 });

  if (garden.virus) {
    const has = engine.has(ind.genotype, 'Zym');
    add({ cause: 'virus', pct: has ? 0.04 : 0.3, gene: 'Zym', protectedBy: has });
  }

  // Saison : la part de la récolte qui ne mûrit pas avant les froids.
  const overrun = days + 25 - c.season; // ~25 j de récolte étalée
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 40) });

  if (!garden.handPollination) add({ cause: 'pollination', pct: c.pollination });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  const r = potentialKg * keep;
  return {
    potentialKg,
    realizedKg: r < 10 ? Math.round(r * 10) / 10 : Math.round(r),
    days,
    losses: losses.sort((x, y) => y.pct - x.pct),
    totalLoss: 1 - keep,
  };
}

const KEY = 'lignee.courge.garden.v1';

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
