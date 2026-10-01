/**
 * Rotation : une même famille revient-elle trop tôt sur une planche ?
 */
import type { ISODate, Plant, Species } from '../model';
import { diffDays } from './dates';
import { speciesOf } from './crop';

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
