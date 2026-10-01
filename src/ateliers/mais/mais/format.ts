import { PHENO_KEY, type QuantTraitId, type MzIndividual } from '../engine/mais/engine';
import type { TT } from './i18n';

export function formatKg(v: number, locale = 'fr-FR'): string {
  if (v < 1) return `${Math.round(v * 1000).toLocaleString(locale)} g`;
  return `${v.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: v < 10 ? 1 : 0 })} kg`;
}

/** Valeur lisible d’un trait (unité comprise). */
export function formatTraitValue(trait: QuantTraitId, v: number, tt: TT, locale = 'fr-FR'): string {
  const n = (x: number, d = 0) => x.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (trait) {
    case 'earLength':
      return `${n(v)} cm`;
    case 'kernel':
      return `${n(v)} g`;
    case 'ears':
      return n(v);
    case 'days':
      return `${n(v)} ${tt('trait.daysUnit')}`;
    case 'height':
      return `${n(v)} cm`;
    default:
      return n(v);
  }
}

export function formatTrait(ind: MzIndividual, trait: QuantTraitId, tt: TT, locale = 'fr-FR'): string {
  return formatTraitValue(trait, ind.pheno[PHENO_KEY[trait]], tt, locale);
}

/** Pour ces traits, une valeur BASSE est meilleure (jauge inversée). */
export const LOWER_IS_BETTER: Partial<Record<QuantTraitId, true>> = { days: true };

export const TRAIT_COLOR: Record<QuantTraitId, string> = {
  earLength: 'var(--color-resin-500)',
  kernel: 'var(--color-tomato-500)',
  ears: 'var(--color-bloom-500)',
  days: 'var(--color-leaf-500)',
  height: '#4a7fb0',
};
