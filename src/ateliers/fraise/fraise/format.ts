import { PHENO_KEY, type QuantTraitId, type FaIndividual } from '../engine/fraise/engine';
import type { TT } from './i18n';

export function formatKg(v: number, locale = 'fr-FR'): string {
  if (v < 1) return `${Math.round(v * 1000).toLocaleString(locale)} g`;
  return `${v.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: v < 10 ? 1 : 0 })} kg`;
}

/** Date approximative (« vers le 12 mai ») d’un jour compté depuis le 1er avril. */
export function dayToDate(days: number, locale = 'fr-FR'): string {
  const d = new Date(Date.UTC(2026, 3, 1 + Math.round(days)));
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Valeur lisible d’un trait (unité comprise). */
export function formatTraitValue(trait: QuantTraitId, v: number, tt: TT, locale = 'fr-FR'): string {
  const n = (x: number, d = 0) => x.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (trait) {
    case 'weight':
      return `${n(v, v < 10 ? 1 : 0)} g`;
    case 'firmness':
      return `${n(v, 1)}/9`;
    case 'brix':
      return `${n(v, 1)} °Bx`;
    case 'early':
      return tt('trait.earlyValue', { date: dayToDate(v, locale) });
    case 'runners':
      return `${n(v)} ${tt('trait.runnersUnit')}`;
    default:
      return n(v);
  }
}

export function formatTrait(ind: FaIndividual, trait: QuantTraitId, tt: TT, locale = 'fr-FR'): string {
  return formatTraitValue(trait, ind.pheno[PHENO_KEY[trait]], tt, locale);
}

/** Pour ces traits, une valeur BASSE est meilleure (jauge inversée). */
export const LOWER_IS_BETTER: Partial<Record<QuantTraitId, true>> = { early: true };

export const TRAIT_COLOR: Record<QuantTraitId, string> = {
  weight: 'var(--color-tomato-500)',
  firmness: '#b08a4a',
  brix: '#c87a2a',
  early: 'var(--color-resin-500)',
  runners: 'var(--color-leaf-500)',
};
