import { PHENO_KEY, type QuantTraitId, type HaIndividual } from '../engine/tournesol/engine';
import type { TT } from './i18n';

/** Tiges florales (nombre décimal arrondi). */
export function formatStems(v: number, tt: TT, locale = 'fr-FR'): string {
  return `${v.toLocaleString(locale, { maximumFractionDigits: 1 })} ${tt('trait.stemsUnit')}`;
}

/** Valeur lisible d’un trait (unité comprise). */
export function formatTraitValue(trait: QuantTraitId, v: number, tt: TT, locale = 'fr-FR'): string {
  const n = (x: number, d = 0) => x.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (trait) {
    case 'height':
      return `${n(v)} cm`;
    case 'days':
      return `${n(v)} ${tt('trait.daysUnit')}`;
    case 'florets':
      return `${n(v)} ${tt('trait.floretsUnit')}`;
    case 'scent':
      return `${n(v, 1)} / 10`;
    default:
      return n(v);
  }
}

export function formatTrait(ind: HaIndividual, trait: QuantTraitId, tt: TT, locale = 'fr-FR'): string {
  return formatTraitValue(trait, ind.pheno[PHENO_KEY[trait]], tt, locale);
}

/** Pour ces traits, une valeur BASSE est meilleure (jauge inversée). */
export const LOWER_IS_BETTER: Partial<Record<QuantTraitId, true>> = { days: true };

export const TRAIT_COLOR: Record<QuantTraitId, string> = {
  height: 'var(--color-leaf-500)',
  days: 'var(--color-resin-500)',
  florets: '#c2187a',
  scent: '#9a6ac0',
};
