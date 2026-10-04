/**
 * Compost : équilibre carbone / azote du mélange, avancement du tas et
 * date à laquelle il devrait être mûr.
 *
 * Chaque matière apportée est convertie en masse sèche (densité et matière
 * sèche des matières fraîches) puis en carbone (≈ 45 % de la matière sèche)
 * et en azote (carbone / rapport C/N). Un bon mélange vise C/N 25 à 35 :
 * trop bas (que des « verts »), le tas sent et perd son azote ; trop haut
 * (que des « bruns »), il ne chauffe pas et traîne.
 *
 * Durée jusqu'à maturité, ordres de grandeur (Ademe, guides du compostage
 * domestique) : 9 à 12 mois pour un tas jamais retourné, 4 à 6 mois s'il
 * est retourné chaque mois au début et qu'il a chauffé (≥ 55 °C), 3 à 4
 * mois en lombricompostage.
 */
import type { CompostHeap, CompostMaterial, GardenData, ISODate, Txt } from '../model';
import { addDays, diffDays } from './dates';

const T = (fr: string, en: string): Txt => ({ fr, en });

export const COMPOST_MATERIALS: CompostMaterial[] = ['kitchen', 'grass', 'greens', 'manure', 'leaves', 'browns', 'straw', 'woodChips'];

export const MATERIAL_INFO: Record<CompostMaterial, { emoji: string; name: Txt; /** kg/L frais */ density: number; /** matière sèche */ dm: number; cn: number; green: boolean }> = {
  kitchen: { emoji: '🍎', name: T('Épluchures, restes de cuisine', 'Kitchen scraps'), density: 0.5, dm: 0.15, cn: 18, green: true },
  grass: { emoji: '🌱', name: T('Tonte de gazon', 'Grass clippings'), density: 0.3, dm: 0.2, cn: 15, green: true },
  greens: { emoji: '🥬', name: T('Déchets verts du potager', 'Green garden waste'), density: 0.2, dm: 0.18, cn: 20, green: true },
  manure: { emoji: '🐴', name: T('Fumier', 'Manure'), density: 0.6, dm: 0.25, cn: 20, green: true },
  leaves: { emoji: '🍂', name: T('Feuilles mortes', 'Fallen leaves'), density: 0.08, dm: 0.6, cn: 50, green: false },
  browns: { emoji: '📦', name: T('Carton, papier, brindilles', 'Cardboard, paper, twigs'), density: 0.1, dm: 0.85, cn: 150, green: false },
  straw: { emoji: '🟨', name: T('Paille, foin sec', 'Straw, dry hay'), density: 0.05, dm: 0.85, cn: 80, green: false },
  woodChips: { emoji: '🪵', name: T('Broyat de branches', 'Wood chips'), density: 0.25, dm: 0.6, cn: 100, green: false },
};

/** Rapport C/N du mélange (null si rien d'apporté). */
export function heapCN(heap: Pick<CompostHeap, 'inputs'>): number | null {
  let c = 0;
  let n = 0;
  for (const i of heap.inputs) {
    const m = MATERIAL_INFO[i.material];
    if (!m || i.liters <= 0) continue;
    const carbon = i.liters * m.density * m.dm * 0.45;
    c += carbon;
    n += carbon / m.cn;
  }
  return n > 0 ? Math.round((c / n) * 10) / 10 : null;
}

export type CNAdvice = 'tooGreen' | 'good' | 'tooBrown';

export function cnAdvice(cn: number): CNAdvice {
  return cn < 22 ? 'tooGreen' : cn > 40 ? 'tooBrown' : 'good';
}

/** Litres de « bruns » (feuilles) ou de « verts » (déchets du potager) à ajouter pour revenir vers C/N 30. */
export function cnCorrection(heap: Pick<CompostHeap, 'inputs'>): { material: CompostMaterial; liters: number } | null {
  const cn = heapCN(heap);
  if (cn === null || cnAdvice(cn) === 'good') return null;
  const material: CompostMaterial = cn < 22 ? 'leaves' : 'greens';
  for (let l = 5; l <= 2000; l += 5) {
    const x = heapCN({ inputs: [...heap.inputs, { date: '2000-01-01', material, liters: l }] });
    if (x !== null && cnAdvice(x) === 'good') return { material, liters: l };
  }
  return null;
}

export type HeapStage = 'filling' | 'active' | 'curing' | 'ready' | 'harvested';

export interface HeapStatus {
  stage: HeapStage;
  cn: number | null;
  liters: number;
  lastInput: ISODate | null;
  lastTurn: ISODate | null;
  hot: boolean;
  /** Date estimée de maturité (depuis le dernier gros apport). */
  readyOn: ISODate | null;
  /** Retournement conseillé ? */
  turnDue: boolean;
}

export function heapStatus(heap: CompostHeap, today: ISODate): HeapStatus {
  const liters = heap.inputs.reduce((s, i) => s + i.liters, 0);
  const dates = [...heap.inputs.map((i) => i.date)].sort();
  const lastInput = dates.length ? dates[dates.length - 1] : null;
  const lastTurn = heap.turns.length ? [...heap.turns].sort().pop()! : null;
  const hot = heap.temps.some((t) => t.c >= 55);
  const cn = heapCN(heap);
  if (heap.harvested) return { stage: 'harvested', cn, liters, lastInput, lastTurn, hot, readyOn: heap.harvested.date, turnDue: false };
  if (!lastInput) return { stage: 'filling', cn, liters, lastInput, lastTurn, hot, readyOn: null, turnDue: false };
  // On compte depuis le dernier apport important (le tas « repart » à chaque gros remplissage).
  const big = heap.inputs.filter((i) => i.liters >= Math.max(20, liters * 0.1)).map((i) => i.date).sort();
  const from = big.length ? big[big.length - 1] : lastInput;
  let months: number;
  if (heap.kind === 'worm') months = 4;
  else {
    const earlyTurns = heap.turns.filter((t) => t >= from && diffDays(from, t) <= 120).length;
    months = Math.max(4, 10 - earlyTurns * 1.2 - (hot ? 2 : 0));
  }
  const readyOn = addDays(from, Math.round(months * 30.4));
  const age = diffDays(from, today);
  const stage: HeapStage = today >= readyOn ? 'ready' : age < 14 && heap.kind !== 'worm' ? 'filling' : age < months * 30.4 * 0.5 ? 'active' : 'curing';
  const sinceTurn = diffDays(lastTurn && lastTurn > from ? lastTurn : from, today);
  const turnDue = heap.kind !== 'worm' && (stage === 'active' || stage === 'filling') && age >= 21 && sinceTurn >= 30;
  return { stage, cn, liters, lastInput, lastTurn, hot, readyOn, turnDue };
}

/** Tâches liées au compost : retourner, tamiser quand c'est mûr. */
export function compostTasks(data: GardenData, today: ISODate): Array<{ heapId: string; what: 'turn' | 'ready' | 'balance'; name: string }> {
  const out: Array<{ heapId: string; what: 'turn' | 'ready' | 'balance'; name: string }> = [];
  for (const h of data.compost ?? []) {
    const st = heapStatus(h, today);
    if (st.stage === 'harvested') continue;
    if (st.stage === 'ready') out.push({ heapId: h.id, what: 'ready', name: h.name });
    else if (st.turnDue) out.push({ heapId: h.id, what: 'turn', name: h.name });
    if (st.cn !== null && st.stage !== 'ready' && cnAdvice(st.cn) !== 'good' && st.liters >= 50) out.push({ heapId: h.id, what: 'balance', name: h.name });
  }
  return out;
}

/** Volume de compost mûr qu'on récupère : environ 40 % du volume apporté. */
export function compostYieldLiters(heap: CompostHeap): number {
  return Math.round(heap.inputs.reduce((s, i) => s + i.liters, 0) * 0.4);
}
