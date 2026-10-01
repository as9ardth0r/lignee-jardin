/**
 * Environnement de culture (« Mon jardin ») des pastèques.
 *
 * La pastèque est une plante de chaleur : sol à 18 °C au moins pour semer,
 * nuits chaudes pour nouer et sucrer. Pertes estimées en ESPÉRANCE (moyenne
 * sur plusieurs saisons), ordres de grandeur pédagogiques :
 *  - fusariose (champignon du sol, Fusarium oxysporum f. sp. niveum) : Fo-1
 *    protège de la race 1 ; c’est pourquoi on greffe souvent la pastèque ;
 *  - mosaïque jaune de la courgette (ZYMV, pucerons) : zym ;
 *  - anthracnose (temps chaud et humide) : Ar-1 ;
 *  - pourriture gommeuse des tiges (temps humide) : db ;
 *  - froid : nouaison et sucre en berne dans les climats frais ;
 *  - saison trop courte pour mûrir ;
 *  - pollinisation : sous serre sans abeilles ; les TRIPLOÏDES (sans
 *    pépins) ne font pas de pollen et ne nouent pas sans un pied diploïde
 *    « pollinisateur » à côté (1 pour 3 en culture) ;
 *  - amertume : un fruit amer (Bi) est immangeable.
 */

import type { WmEngine, WmIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'greenhouse';

export interface GardenSettings {
  climate: ClimateId;
  /** Sol contaminé par la fusariose (pastèques, melons déjà cultivés à cet endroit). */
  fusarium: boolean;
  /** Mosaïque jaune ZYMV présente (pucerons). */
  zymv: boolean;
  /** Un pied diploïde pollinisateur est planté à côté des triploïdes. */
  pollinizer: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'mediterranean', fusarium: false, zymv: false, pollinizer: true };

interface ClimateProfile {
  cool: number;
  /** Humidité estivale (anthracnose, pourriture gommeuse). */
  humid: number;
  /** Jours disponibles du semis (sous abri) aux premiers froids. */
  season: number;
  daysShift: number;
  greenhouse: boolean;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { cool: 0.6, humid: 0.7, season: 135, daysShift: 10, greenhouse: false },
  continental: { cool: 0.2, humid: 0.35, season: 145, daysShift: 2, greenhouse: false },
  mediterranean: { cool: 0, humid: 0.15, season: 180, daysShift: -5, greenhouse: false },
  mountain: { cool: 0.8, humid: 0.4, season: 110, daysShift: 15, greenhouse: false },
  greenhouse: { cool: 0.05, humid: 0.4, season: 190, daysShift: -6, greenhouse: true },
};

export type LossCause = 'fusarium' | 'zymv' | 'anthracnose' | 'gummy' | 'cool' | 'season' | 'pollination' | 'triploid' | 'bitter';

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

export function gardenOutcome(engine: WmEngine, ind: WmIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = Math.max(55, ind.pheno.days + c.daysShift);

  if (garden.fusarium) {
    const ok = res.has('Fo1');
    add({ cause: 'fusarium', pct: ok ? 0.05 : 0.55, gene: 'Fo1', protectedBy: ok });
  }
  if (garden.zymv) {
    const ok = res.has('zym');
    add({ cause: 'zymv', pct: ok ? 0.04 : 0.45, gene: 'zym', protectedBy: ok });
  }
  const ar = res.has('Ar1');
  add({ cause: 'anthracnose', pct: (ar ? 0.1 : 1) * 0.35 * c.humid, gene: 'Ar1', protectedBy: ar });
  const db = res.has('db');
  add({ cause: 'gummy', pct: (db ? 0.3 : 1) * 0.25 * c.humid, gene: 'db', protectedBy: db, partial: db });

  const desert = ind.species === 'colocynthis' || ind.species === 'ecirrhosus';
  add({ cause: 'cool', pct: Math.min(0.85, 0.5 * c.cool * (desert ? 1.3 : 1)) });
  const overrun = days - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 30) });
  if (ind.ploidy === 3) {
    if (!garden.pollinizer) add({ cause: 'triploid', pct: 0.9 });
  } else if (c.greenhouse && engine.sexType(ind) === 'monoecious') add({ cause: 'pollination', pct: 0.45 });
  if (engine.appearance(ind).bitter) add({ cause: 'bitter', pct: 1 });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 10) / 10, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.pasteque.garden.v1';

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
