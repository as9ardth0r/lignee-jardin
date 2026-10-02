/**
 * Rotation : une même famille revient-elle trop tôt sur une planche ?
 */
import type { ISODate, Plant, Species } from '../model';
import { diffDays } from './dates';
import { isPerennialCrop, speciesOf } from './crop';

export interface RotationWarning {
  previous: Plant;
  /** Années écoulées depuis la culture précédente de la même famille. */
  years: number;
  /** Années conseillées. */
  wanted: number;
}

export function rotationWarning(bedId: string, sp: Species, plants: Plant[], date: ISODate, ignoreId?: string): RotationWarning | null {
  let worst: RotationWarning | null = null;
  for (const p of plants) {
    if (p.id === ignoreId || p.bedId !== bedId || p.status === 'planned') continue;
    const prev = speciesOf(p);
    if (prev.family !== sp.family) continue;
    const ref = p.endDate ?? p.sowDate;
    if (ref > date) continue;
    const years = diffDays(ref, date) / 365;
    // Une culture encore en place ou qui vient de finir dans la même saison ne compte pas comme « année précédente ».
    if (years < 0.5) continue;
    if (years < sp.returnYears && (!worst || years < worst.years)) worst = { previous: p, years: Math.round(years * 10) / 10, wanted: sp.returnYears };
  }
  return worst;
}

// --- Rotation visible sur le plan ------------------------------------------------------

/**
 * Groupes de la rotation classique en 4 ans (solanacées → légumineuses →
 * choux → racines et alliums…), plus les cultures qui sortent de la
 * rotation : vivaces, fruitiers et fleurs.
 */
export type RotationGroup = 'solanaceae' | 'cucurbitaceae' | 'brassicaceae' | 'fabaceae' | 'alliums' | 'apiaceae' | 'leafy' | 'perennial' | 'flowers';
export const ROTATION_GROUPS: RotationGroup[] = ['solanaceae', 'cucurbitaceae', 'brassicaceae', 'fabaceae', 'alliums', 'apiaceae', 'leafy', 'perennial', 'flowers'];
export const ROTATION_COLOR: Record<RotationGroup, string> = {
  solanaceae: '#c8432e',
  cucurbitaceae: '#e2892c',
  brassicaceae: '#5b6fc0',
  fabaceae: '#4f9a45',
  alliums: '#9a5fb8',
  apiaceae: '#e3c23a',
  leafy: '#3fa39a',
  perennial: '#7a5a3a',
  flowers: '#e07aa8',
};

export function rotationGroup(sp: Species): RotationGroup {
  if (sp.type === 'flower') return 'flowers';
  if (isPerennialCrop(sp) || sp.type === 'orchard') return 'perennial';
  switch (sp.family) {
    case 'solanaceae':
    case 'cucurbitaceae':
    case 'brassicaceae':
    case 'fabaceae':
    case 'apiaceae':
      return sp.family;
    case 'amaryllidaceae':
      return 'alliums';
    default:
      return 'leafy';
  }
}

/** Cultures d'une planche une année donnée (semées cette année-là, ou vivaces en place). */
export function bedCropsOfYear(bedId: string, plants: Plant[], year: number): Plant[] {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return plants.filter((p) => {
    if (p.bedId !== bedId) return false;
    const sp = speciesOf(p);
    if (isPerennialCrop(sp) && p.status !== 'planned') return p.sowDate <= end && (!p.endDate || p.endDate >= start);
    return p.sowDate.slice(0, 4) === String(year);
  });
}

/** Groupe dominant d'une planche une année donnée (le plus de plants). */
export function bedGroupOfYear(bedId: string, plants: Plant[], year: number): RotationGroup | null {
  const count = new Map<RotationGroup, number>();
  for (const p of bedCropsOfYear(bedId, plants, year)) {
    const g = rotationGroup(speciesOf(p));
    count.set(g, (count.get(g) ?? 0) + Math.max(1, p.count));
  }
  let best: RotationGroup | null = null;
  for (const [g, n] of count) if (!best || n > (count.get(best) ?? 0)) best = g;
  return best;
}

/** Cultures de l'année (en place ou prévues) qui reviennent trop tôt sur leur planche. */
export function bedRotationIssues(bedId: string, plants: Plant[], year: number): Array<{ plant: Plant; warning: RotationWarning }> {
  const out: Array<{ plant: Plant; warning: RotationWarning }> = [];
  for (const p of plants) {
    if (p.bedId !== bedId || p.sowDate.slice(0, 4) !== String(year) || p.status === 'ended') continue;
    const sp = speciesOf(p);
    if (isPerennialCrop(sp) || sp.type === 'flower') continue;
    const w = rotationWarning(bedId, sp, plants, p.sowDate, p.id);
    if (w) out.push({ plant: p, warning: w });
  }
  return out;
}
