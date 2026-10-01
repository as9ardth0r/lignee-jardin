/**
 * Environnement de culture (« Mon jardin ») des fraisiers.
 *
 * Pertes estimées en ESPÉRANCE (moyenne sur plusieurs saisons), ordres de
 * grandeur pédagogiques :
 *  - oïdium (Podosphaera aphanis), étés secs et chauds sous abri : Pm ;
 *  - stèle rouge (Phytophthora fragariae), sols lourds, froids et
 *    détrempés : Rpf1 ;
 *  - anthracnose (Colletotrichum acutatum), chaleur humide : RCa1 ;
 *  - fusariose (Fusarium oxysporum f. sp. fragariae), sols chauds : FW1 ;
 *  - pourriture grise (Botrytis cinerea) par temps humide : pas de gène
 *    majeur ; les fruits fermes et aérés en souffrent moins ;
 *  - oiseaux et limaces : les fraises blanches (myb10) sont épargnées par
 *    les oiseaux, qui ne les reconnaissent pas comme mûres ;
 *  - gelées tardives sur les fleurs : les variétés précoces y perdent
 *    leurs premières fleurs ;
 *  - plante femelle sans pollinisateur à proximité ;
 *  - chaleur : les remontantes s’arrêtent de fleurir au-dessus de 30 °C.
 */

import type { FaEngine, FaIndividual } from './engine';
import type { VariantId } from './loci';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'tropical';

export interface GardenSettings {
  climate: ClimateId;
  /** Oïdium (abri, étés secs). */
  mildew: boolean;
  /** Sol lourd et humide (stèle rouge). */
  redStele: boolean;
  /** Anthracnose (chaleur humide). */
  anthracnose: boolean;
  /** Sol à fusariose. */
  fusarium: boolean;
  /** Oiseaux (merles) au jardin. */
  birds: boolean;
  /** Gelées tardives (fond de vallée). */
  lateFrost: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = { climate: 'oceanic', mildew: false, redStele: false, anthracnose: false, fusarium: false, birds: false, lateFrost: false };

interface ClimateProfile {
  humid: number;
  hot: number;
  /** Décalage de la première récolte (jours). */
  shift: number;
  /** Longueur de la saison de fructification des remontantes (relative). */
  season: number;
  frost: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { humid: 0.8, hot: 0.05, shift: 0, season: 1, frost: 0.3 },
  continental: { humid: 0.4, hot: 0.3, shift: 8, season: 0.85, frost: 0.6 },
  mediterranean: { humid: 0.3, hot: 0.6, shift: -15, season: 0.9, frost: 0.1 },
  mountain: { humid: 0.5, hot: 0, shift: 25, season: 0.6, frost: 0.8 },
  tropical: { humid: 0.9, hot: 1, shift: -30, season: 0.7, frost: 0 },
};

export type LossCause = 'mildew' | 'redStele' | 'anthracnose' | 'fusarium' | 'botrytis' | 'birds' | 'frost' | 'pollination' | 'heat' | 'season';

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
  /** Première fraise mûre (jours après le 1er avril) dans ce climat. */
  days: number;
  losses: Loss[];
  totalLoss: number;
}

export function gardenOutcome(engine: FaEngine, ind: FaIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const app = engine.appearance(ind);
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };
  const days = Math.max(5, ind.pheno.early + c.shift);

  if (garden.mildew) {
    const ok = res.has('Pm');
    add({ cause: 'mildew', pct: (ok ? 0.05 : 0.3) * (0.5 + c.hot), gene: 'Pm', protectedBy: ok, partial: ok });
  }
  if (garden.redStele) {
    const ok = res.has('Rpf1');
    add({ cause: 'redStele', pct: (ok ? 0.02 : 0.5) * (0.4 + c.humid * 0.6), gene: 'Rpf1', protectedBy: ok });
  }
  if (garden.anthracnose) {
    const ok = res.has('RCa1');
    add({ cause: 'anthracnose', pct: (ok ? 0.04 : 0.35) * (0.3 + c.humid * c.hot + c.hot * 0.4), gene: 'RCa1', protectedBy: ok });
  }
  if (garden.fusarium) {
    const ok = res.has('FW1');
    add({ cause: 'fusarium', pct: (ok ? 0.02 : 0.45) * (0.4 + c.hot * 0.6), gene: 'FW1', protectedBy: ok });
  }
  // Pourriture grise : chaque saison, plus forte par temps humide et sur fruits tendres.
  add({ cause: 'botrytis', pct: c.humid * 0.15 * (1.4 - ind.pheno.firmness / 9) });
  if (garden.birds) add({ cause: 'birds', pct: app.color === 'red' ? 0.2 : 0.04 });
  if (garden.lateFrost) add({ cause: 'frost', pct: c.frost * (days < 45 ? 0.3 : days < 60 ? 0.15 : 0.05) * (app.everbearing ? 0.4 : 1) });
  if (app.maleSterile) add({ cause: 'pollination', pct: 0.6 });
  if (app.everbearing) {
    add({ cause: 'heat', pct: c.hot * 0.35 });
    add({ cause: 'season', pct: (1 - c.season) * 0.5 });
  } else add({ cause: 'heat', pct: c.hot * 0.1 });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const potentialKg = engine.yieldKg(ind);
  return { potentialKg, realizedKg: Math.round(potentialKg * keep * 1000) / 1000, days, losses: losses.sort((x, y) => y.pct - x.pct), totalLoss: 1 - keep };
}

const KEY = 'lignee.fraise.garden.v1';

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
