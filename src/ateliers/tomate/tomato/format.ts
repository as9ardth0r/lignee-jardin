import { PHENO_KEY, type QuantTraitId, type TomatoIndividual } from '../engine/tomato/engine';
import type { useTomatoT } from './i18n';

type TT = ReturnType<typeof useTomatoT>['tt'];

/** Valeur lisible d'un trait (unité comprise). */
export function formatTraitValue(trait: QuantTraitId, v: number, tt: TT, locale = 'fr-FR'): string {
  const n = (x: number, d = 0) => x.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (trait) {
    case 'weight':
      return `${n(v)} g`;
    case 'brix':
      return `${n(v, 1)}°`;
    case 'days':
      return `${n(v)} ${tt('trait.daysUnit')}`;
    case 'yield':
      return `${n(v, 1)} ${tt('trait.yieldUnit')}`;
    case 'acidity':
      return `${n(v, 2)} %`;
    case 'shelf':
      return `${n(v)} ${tt('trait.daysUnit')}`;
    default:
      return `${n(v)} %`;
  }
}

export function formatTrait(ind: TomatoIndividual, trait: QuantTraitId, tt: TT, locale = 'fr-FR'): string {
  return formatTraitValue(trait, ind.pheno[PHENO_KEY[trait]], tt, locale);
}

/** Pour ces traits, une valeur BASSE est meilleure (jauge inversée). */
export const LOWER_IS_BETTER: Partial<Record<QuantTraitId, true>> = { days: true };

export const TRAIT_COLOR: Record<QuantTraitId, string> = {
  weight: 'var(--color-tomato-500)',
  brix: 'var(--color-resin-500)',
  days: 'var(--color-leaf-500)',
  yield: 'var(--color-bloom-500)',
  acidity: '#c9a227',
  crack: '#8a6a42',
  shelf: '#4a7fb0',
  heat: '#d06a3a',
  cold: '#6fa3c7',
};
