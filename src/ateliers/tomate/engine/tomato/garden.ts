/**
 * Environnement de culture (« Mon jardin ») et pression des maladies.
 *
 * Le moteur génétique donne le potentiel d'une plante (rendement en
 * conditions saines). Ce module estime ce qu'elle produit réellement dans
 * un jardin donné : climat, sol contaminé, virus, abri. Chaque perte est
 * calculée en ESPÉRANCE (pas de tirage au sort), pour rester stable et
 * explicable d'une consultation à l'autre.
 *
 * Ordres de grandeur retenus (plante sensible, forte pression) :
 *  - mildiou (Phytophthora infestans) : jusqu'à ~50 % (en espérance sur plusieurs saisons ; une mauvaise année peut tout emporter) de perte en climat
 *    frais et humide ; Ph-3 réduit fortement la perte (résistance partielle,
 *    contournable) ; la précocité permet d'« échapper » en partie à la
 *    maladie, qui arrive en fin d'été ;
 *  - fusariose race 1 (sol contaminé) : ~40 % ; gène I → quasi nulle ;
 *  - verticilliose (sol contaminé) : ~25 % ; Ve → quasi nulle ;
 *  - nématodes à galles (sol contaminé) : ~35 %, davantage en sol chaud ;
 *    Mi-1.2 → faible, MAIS la résistance cède au-dessus de ~28 °C de sol
 *    (climat méditerranéen, serre) ;
 *  - virus de la mosaïque ToMV : ~20 % ; Tm-2² → nulle ;
 *  - stress thermique : perte proportionnelle au manque de nouaison à la
 *    chaleur ou de tolérance au froid, selon le climat ;
 *  - éclatement : perte de fruits commercialisables quand les pluies sont
 *    irrégulières ;
 *  - nécrose apicale (cul noir) : selon le risque du fruit (forme, calibre)
 *    et la sécheresse/chaleur.
 * Valeurs pédagogiques, à ne pas prendre pour des prévisions.
 */

import type { TomatoEngine, TomatoIndividual } from './engine';
import type { TomatoLocusId } from './loci';
import { tomatoNutrientPlan } from './nutrients';

export type ClimateId = 'oceanic' | 'continental' | 'mediterranean' | 'mountain' | 'greenhouse';

export interface GardenSettings {
  climate: ClimateId;
  /** Sol contaminé par la fusariose / la verticilliose / des nématodes. */
  fusarium: boolean;
  verticillium: boolean;
  nematodes: boolean;
  /** Virus de la mosaïque présent (tabac, outils, semences). */
  tomv: boolean;
}

export const DEFAULT_GARDEN: GardenSettings = {
  climate: 'oceanic',
  fusarium: false,
  verticillium: false,
  nematodes: false,
  tomv: false,
};

interface ClimateProfile {
  /** Pression de mildiou 0–1. */
  blight: number;
  /** Stress de chaleur 0–1 (nuits chaudes, > 32 °C). */
  heat: number;
  /** Stress de froid 0–1 (printemps frais, nuits < 12 °C). */
  cold: number;
  /** Irrégularité des pluies (éclatement) 0–1. */
  irregularRain: number;
  /** Sécheresse / chaleur favorisant le cul noir 0–1. */
  dry: number;
  /** Sol chaud (> 28 °C) : la résistance Mi cède. */
  hotSoil: boolean;
  /** Décalage de la première récolte (jours). */
  daysShift: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: { blight: 0.9, heat: 0.05, cold: 0.35, irregularRain: 0.6, dry: 0.1, hotSoil: false, daysShift: 8 },
  continental: { blight: 0.55, heat: 0.35, cold: 0.45, irregularRain: 0.5, dry: 0.35, hotSoil: false, daysShift: 3 },
  mediterranean: { blight: 0.15, heat: 0.8, cold: 0.05, irregularRain: 0.25, dry: 0.8, hotSoil: true, daysShift: -6 },
  mountain: { blight: 0.6, heat: 0.05, cold: 0.8, irregularRain: 0.45, dry: 0.1, hotSoil: false, daysShift: 14 },
  greenhouse: { blight: 0.15, heat: 0.55, cold: 0.1, irregularRain: 0.05, dry: 0.5, hotSoil: true, daysShift: -8 },
};

export type LossCause = 'blight' | 'fusarium' | 'verticillium' | 'nematodes' | 'tomv' | 'heat' | 'cold' | 'crack' | 'ber';

export interface Loss {
  cause: LossCause;
  /** Perte (0–1) sur le rendement. */
  pct: number;
  /** Gène qui protège contre cette cause (s'il existe). */
  gene?: TomatoLocusId;
  /** La plante porte-t-elle ce gène ? */
  protectedBy?: boolean;
  /** Résistance présente mais contournée (Mi en sol chaud). */
  brokenDown?: boolean;
}

export interface GardenOutcome {
  potentialKg: number;
  realizedKg: number;
  days: number;
  losses: Loss[];
  /** Perte totale (0–1). */
  totalLoss: number;
}

export function gardenOutcome(engine: TomatoEngine, ind: TomatoIndividual, garden: GardenSettings): GardenOutcome {
  const c = CLIMATES[garden.climate];
  const res = new Set(engine.resistances(ind));
  const losses: Loss[] = [];
  const add = (l: Loss) => {
    if (l.pct > 0.004 || l.protectedBy) losses.push({ ...l, pct: Math.round(l.pct * 1000) / 1000 });
  };

  // Mildiou : précocité = échappement partiel (la maladie arrive en fin d'été)
  if (c.blight > 0) {
    const escape = Math.max(0, Math.min(0.4, (75 - ind.pheno.days) / 50));
    const base = 0.5 * c.blight * (1 - escape);
    const has = res.has('Ph3');
    add({ cause: 'blight', pct: has ? base * 0.3 : base, gene: 'Ph3', protectedBy: has });
  }
  if (garden.fusarium) {
    const has = res.has('I');
    add({ cause: 'fusarium', pct: has ? 0.02 : 0.4, gene: 'I', protectedBy: has });
  }
  if (garden.verticillium) {
    const has = res.has('Ve');
    add({ cause: 'verticillium', pct: has ? 0.02 : 0.25, gene: 'Ve', protectedBy: has });
  }
  if (garden.nematodes) {
    const has = res.has('Mi');
    const base = c.hotSoil ? 0.45 : 0.3;
    const pct = has ? (c.hotSoil ? 0.2 : 0.04) : base;
    add({ cause: 'nematodes', pct, gene: 'Mi', protectedBy: has, brokenDown: has && c.hotSoil });
  }
  if (garden.tomv) {
    const has = res.has('Tm2');
    add({ cause: 'tomv', pct: has ? 0 : 0.2, gene: 'Tm2', protectedBy: has });
  }
  add({ cause: 'heat', pct: 0.5 * c.heat * (1 - ind.pheno.heat / 100) });
  add({ cause: 'cold', pct: 0.35 * c.cold * (1 - ind.pheno.cold / 100) });
  add({ cause: 'crack', pct: 0.25 * c.irregularRain * (1 - ind.pheno.crack / 100) });
  const ber = tomatoNutrientPlan(engine, ind).berRisk;
  add({ cause: 'ber', pct: (ber === 'high' ? 0.15 : ber === 'medium' ? 0.06 : 0.01) * (0.3 + c.dry) });

  const keep = losses.reduce((k, l) => k * (1 - l.pct), 1);
  const realizedKg = Math.round(ind.pheno.yieldKg * keep * 10) / 10;
  const coldDelay = Math.round(c.cold * (1 - ind.pheno.cold / 100) * 12);
  return {
    potentialKg: ind.pheno.yieldKg,
    realizedKg,
    days: Math.max(40, ind.pheno.days + c.daysShift + coldDelay),
    losses: losses.sort((a, b) => b.pct - a.pct),
    totalLoss: 1 - keep,
  };
}

const KEY = 'lignee.tomato.garden.v1';

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
