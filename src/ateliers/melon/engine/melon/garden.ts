/**
 * Environnement de culture (« Mon jardin ») du melon.
 *
 * Le melon est une plante de chaleur : 24–30 °C le jour, 18–20 °C la nuit,
 * nuits au-dessus de 12–13 °C (en dessous, bactériose). Pertes estimées en
 * ESPÉRANCE (moyenne sur plusieurs saisons) :
 *  - fusariose (sol contaminé) : jusqu’à 100 % pour les races virulentes ;
 *    Fom-1 protège des races 0 et 2, Fom-2 des races 0 et 1 ; aucune
 *    résistance simple à la race 1.2 (polygénique, partielle) ;
 *  - oïdium : fréquent en fin d’été ; Pm-1 (race 1, en partie contournée)
 *    protège partiellement, Pm-w (races 1, 2, 3) bien mieux. Des feuilles
 *    malades donnent aussi des fruits moins sucrés ;
 *  - pucerons et virus (CMV, WMV, ZYMV) : Vat bloque la transmission par le
 *    puceron Aphis gossypii ; Zym protège du seul ZYMV ;
 *  - manque de chaleur (climat frais) : nouaison faible, fruits peu sucrés ;
 *  - saison trop courte : fruits qui ne mûrissent pas ;
 *  - éclatement : arrosages irréguliers en fin de grossissement (les melons
 *    d’hiver à écorce épaisse y sont moins sensibles) ;
 *  - serre sans insectes : fleurs non pollinisées.
 */

import type { MelonEngine, MelonIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'greenhouse';
export type FusariumRace = 'none' | '0' | '1' | '2' | '1.2';

export interface GardenSettings {
  climate: ClimateId;
  fusarium: FusariumRace;
  virus: boolean;
  handPollination: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'mediterranean', fusarium: 'none', virus: false, handPollination: false };

interface ClimateProfile {
  mildew: number;
  /** Déficit de chaleur 0–1. */
  cool: number;
  /** Jours disponibles de la plantation aux premiers froids. */
  season: number;
  daysShift: number;
  irregularRain: number;
  pollination: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { mildew: 0.8, cool: 0.45, season: 110, daysShift: 12, irregularRain: 0.6, pollination: 0.05 },
  continental: { mildew: 0.7, cool: 0.2, season: 115, daysShift: 5, irregularRain: 0.5, pollination: 0.05 },
  mediterranean: { mildew: 0.9, cool: 0, season: 150, daysShift: -5, irregularRain: 0.25, pollination: 0.05 },
  mountain: { mildew: 0.5, cool: 0.7, season: 85, daysShift: 20, irregularRain: 0.45, pollination: 0.08 },
  greenhouse: { mildew: 1, cool: 0.05, season: 140, daysShift: -8, irregularRain: 0.05, pollination: 0.35 },
};

export type LossCause = 'fusarium' | 'mildew' | 'virus' | 'cool' | 'season' | 'crack' | 'pollination';

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
  /** °Brix au jardin (oïdium et manque de chaleur font baisser les sucres). */
  brix: number;
  losses: Loss[];
  totalLoss: number;
}

export function gardenOutcome(engine: MelonEngine, ind: MelonIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = Math.max(45, ind.pheno.days + c.daysShift);

  if (garden.fusarium !== 'none') {
    const r = garden.fusarium;
    const f1 = res.has('Fom1') && (r === '0' || r === '2');
    const f2 = res.has('Fom2') && (r === '0' || r === '1');
    const gene: VariantId = r === '2' ? 'Fom1' : r === '1' ? 'Fom2' : res.has('Fom2') ? 'Fom2' : 'Fom1';
    const base = r === '1.2' ? 0.7 : 0.6;
    add({ cause: 'fusarium', pct: f1 || f2 ? 0.03 : base, gene: r === '1.2' ? undefined : gene, protectedBy: f1 || f2 });
  }

  const escape = Math.max(0, Math.min(0.4, (85 - days) / 70));
  const mildewBase = 0.3 * c.mildew * (1 - escape);
  const pmw = res.has('Pmw');
  const pm1 = res.has('Pm1');
  const mildewPct = mildewBase * (pmw ? 0.15 : pm1 ? 0.55 : 1);
  add({ cause: 'mildew', pct: mildewPct, gene: pmw ? 'Pmw' : 'Pm1', protectedBy: pmw || pm1, partial: !pmw && pm1 });

  if (garden.virus) {
    const vat = res.has('Vat');
    const zym = res.has('Zym');
    add({ cause: 'virus', pct: vat ? 0.04 : zym ? 0.22 : 0.35, gene: vat ? 'Vat' : 'Zym', protectedBy: vat || zym, partial: !vat && zym });
  }

  add({ cause: 'cool', pct: 0.4 * c.cool });
  const overrun = days + 15 - c.season;
  if (overrun > 0) add({ cause: 'season', pct: Math.min(0.9, overrun / 35) });
  const app = engine.appearance(ind);
  add({ cause: 'crack', pct: 0.12 * c.irregularRain * (app.slips ? 1 : 0.4) });
  if (!garden.handPollination) add({ cause: 'pollination', pct: c.pollination });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  // Sucres : des feuilles malades et le manque de chaleur font chuter le °Brix
  const brix = Math.max(2, Math.round((ind.pheno.brix - 3 * mildewPct - 3.5 * c.cool) * 10) / 10);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 10) / 10, days, brix, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.melon.garden.v1';

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
