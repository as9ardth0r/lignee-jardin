import { PHENO_KEY, type QuantTraitId, type WmIndividual } from '../engine/pasteque/engine';
import type { TT } from './i18n';

export function formatKg(v: number, locale = 'fr-FR'): string {
  if (v < 1) return `${Math.round(v * 1000).toLocaleString(locale)} g`;
  return `${v.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: v < 10 ? 1 : 0 })} kg`;
}

/** Valeur lisible d’un trait (unité comprise). */
export function formatTraitValue(trait: QuantTraitId, v: number, tt: TT, locale = 'fr-FR'): string {
  const n = (x: number, d = 0) => x.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (trait) {
    case 'weight':
      return `${n(v, v < 10 ? 1 : 0)} kg`;
    case 'brix':
      return `${n(v, 1)} °Bx`;
    case 'days':
      return `${n(v)} ${tt('trait.daysUnit')}`;
    case 'fruits':
      return n(v);
    default:
      return n(v);
  }
}

export function formatTrait(ind: WmIndividual, trait: QuantTraitId, tt: TT, locale = 'fr-FR'): string {
  return formatTraitValue(trait, ind.pheno[PHENO_KEY[trait]], tt, locale);
}

/** Pour ces traits, une valeur BASSE est meilleure (jauge inversée). */
export const LOWER_IS_BETTER: Partial<Record<QuantTraitId, true>> = { days: true };

export const TRAIT_COLOR: Record<QuantTraitId, string> = {
  weight: 'var(--color-leaf-500)',
  brix: 'var(--color-tomato-500)',
  days: 'var(--color-resin-500)',
  fruits: 'var(--color-bloom-500)',
};
