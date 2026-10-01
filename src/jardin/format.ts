import { SPECIES_BY_ID } from './data/species';
import type { ISODate, Lang, Plant, Txt } from './model';

export const locale = (lang: Lang) => (lang === 'fr' ? 'fr-FR' : 'en-GB');

export function txt(t: Txt, lang: Lang): string {
  return t[lang];
}

export function fmtDate(d: ISODate, lang: Lang, withYear = false): string {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' });
}

export function fmtLongDate(d: ISODate, lang: Lang): string {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString(locale(lang), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

export function monthName(m: number, lang: Lang, style: 'short' | 'narrow' | 'long' = 'short'): string {
  return new Date(Date.UTC(2026, m - 1, 15)).toLocaleDateString(locale(lang), { month: style, timeZone: 'UTC' });
}

export function fmtNum(v: number, lang: Lang, digits = 0): string {
  return v.toLocaleString(locale(lang), { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

/** Grammes lisibles : « 38 g », « 1,2 kg ». */
export function fmtG(g: number, lang: Lang): string {
  if (g >= 1000) return `${fmtNum(g / 1000, lang, 1)} kg`;
  return `${fmtNum(g, lang, g < 10 ? 1 : 0)} g`;
}

export function fmtL(l: number, lang: Lang): string {
  return `${fmtNum(l, lang, l < 10 ? 1 : 0)} L`;
}

export function speciesName(id: string, lang: Lang): string {
  return SPECIES_BY_ID[id]?.name[lang] ?? id;
}

export function plantTitle(p: Plant, lang: Lang): string {
  const n = speciesName(p.speciesId, lang);
  return p.varietyName ? `${n} · ${p.varietyName}` : n;
}
