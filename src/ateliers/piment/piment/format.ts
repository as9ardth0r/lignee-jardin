import { PHENO_KEY, type QuantTraitId, type PepperIndividual } from '../engine/piment/engine';
import type { TT } from './i18n';

export function formatKg(v: number, locale = 'fr-FR'): string {
  if (v < 0.01) return `${(v * 1000).toLocaleString(locale, { maximumFractionDigits: 1 })} g`;
  if (v < 1) return `${Math.round(v * 1000).toLocaleString(locale)} g`;
  return `${v.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: v < 10 ? 1 : 0 })} kg`;
}

/** Unités Scoville lisibles (« 250 000 SHU », « doux »). */
export function formatShu(v: number, tt: TT, locale = 'fr-FR'): string {
  if (v <= 0) return tt('heat.sweetShort');
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })} M SHU`;
  return `${v.toLocaleString(locale)} SHU`;
}

/** Valeur lisible d’un trait (unité comprise). */
export function formatTraitValue(trait: QuantTraitId, v: number, tt: TT, locale = 'fr-FR'): string {
  const n = (x: number, d = 0) => x.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (trait) {
    case 'weight':
      return formatKg(v, locale);
    case 'fruits':
      return n(v);
    case 'days':
      return `${n(v)} ${tt('trait.daysUnit')}`;
    case 'heat':
      return formatShu(v, tt, locale);
    case 'height':
      return `${n(v)} cm`;
    case 'shape':
      return n(v, 1);
    default:
      return `${n(v)} %`;
  }
}

export function formatTrait(ind: PepperIndividual, trait: QuantTraitId, tt: TT, locale = 'fr-FR'): string {
  return formatTraitValue(trait, ind.pheno[PHENO_KEY[trait]], tt, locale);
}

/** Pour ces traits, une valeur BASSE est meilleure (jauge inversée). */
export const LOWER_IS_BETTER: Partial<Record<QuantTraitId, true>> = { days: true };

export const TRAIT_COLOR: Record<QuantTraitId, string> = {
  weight: 'var(--color-tomato-500)',
  fruits: 'var(--color-bloom-500)',
  days: 'var(--color-leaf-500)',
  heat: '#c2371f',
  shape: '#8a6a42',
  height: '#4a7fb0',
};
