/**
 * Variétés potagères du Catalogue officiel français (GNIS / SEMAE) : nom,
 * obtenteur, année d'inscription, et surtout hybride F1 ou non — une
 * variété classique se ressème fidèlement, un hybride F1 ne redonne pas la
 * variété. Inclut la liste des variétés anciennes pour jardiniers amateurs
 * (dite « sans valeur intrinsèque ») et les variétés de conservation.
 * Chargé à la demande (≈ 170 Ko).
 */
import { norm } from './flore';

export interface GnisData {
  source: string;
  date: string;
  /** [espèce de l'app, nom, drapeaux, année, obtenteur, sous-espèce GNIS]. */
  v: Array<[string, string, number, number, string, string]>;
}

export interface GnisVariety {
  speciesId: string;
  /** Nom tel qu'inscrit (majuscules). */
  raw: string;
  /** Nom à afficher (« Coeur de Boeuf des Vertus »). */
  name: string;
  hybrid: boolean;
  /** Variété ancienne pour jardiniers amateurs. */
  amateur: boolean;
  conservation: boolean;
  /** Radiée du catalogue, encore commercialisable. */
  delisted: boolean;
  year?: number;
  breeder?: string;
  /** Précision GNIS : haricot nain ou à rames, frisée ou scarole, chou rouge… */
  sub?: string;
  key: string;
}

export interface Gnis {
  source: string;
  date: string;
  bySpecies: Map<string, GnisVariety[]>;
}

const SMALL = new Set(['de', 'des', 'du', 'a', 'au', 'aux', 'la', 'le', 'les', 'et', 'en', 'sur', "d'", "l'"]);

/** « COEUR DE BOEUF DES VERTUS » → « Coeur de Boeuf des Vertus » ; « AL 877 », « F1 » gardés tels quels. */
export function prettyName(raw: string): string {
  const words = raw.trim().replace(/\s+/g, ' ').split(' ');
  const code = words.some((w) => /\d/.test(w));
  return words
    .map((w, i) => {
      // Codes (« AL 877 », « F1 ») gardés tels quels ; « A » isolé en minuscule (« à » sans accent dans la base).
      if (/\d/.test(w) || (code && w.length <= 3)) return w;
      if (w.length === 1) return i > 0 ? w.toLowerCase() : w;
      const low = w.toLowerCase();
      if (i > 0 && SMALL.has(low)) return low;
      // D'ETE → d'Été non : on garde simple, initiale en capitale après l'apostrophe.
      return low.replace(/(^|['’-])(\p{L})/gu, (_m, p: string, c: string) => p + c.toUpperCase());
    })
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());
}

/** Clé de comparaison d'un nom de variété (sans casse, accents, guillemets ni « F1 »). */
export function varietyKey(name: string): string {
  return norm(name.replace(/[«»"“”]/g, ' ').replace(/\bF1\b/gi, ' '));
}

export function buildGnis(d: GnisData): Gnis {
  const bySpecies = new Map<string, GnisVariety[]>();
  for (const [sp, raw, flags, year, breeder, sub] of d.v) {
    const v: GnisVariety = {
      speciesId: sp,
      raw,
      name: prettyName(raw),
      hybrid: Boolean(flags & 1),
      amateur: Boolean(flags & 2),
      conservation: Boolean(flags & 4),
      delisted: Boolean(flags & 8),
      year: year || undefined,
      breeder: breeder && breeder !== 'DOMAINE PUBLIC' && breeder !== 'SERVICE OFFICIEL DE CONTROLE' ? prettyName(breeder) : breeder === 'DOMAINE PUBLIC' ? 'domaine public' : undefined,
      sub: sub ? prettyName(sub) : undefined,
      key: varietyKey(raw),
    };
    const list = bySpecies.get(sp) ?? [];
    list.push(v);
    bySpecies.set(sp, list);
  }
  return { source: d.source, date: d.date, bySpecies };
}

/** La variété inscrite qui porte ce nom (pour cette espèce). */
export function findVariety(g: Gnis, speciesId: string, name: string | undefined): GnisVariety | undefined {
  if (!name?.trim()) return undefined;
  const k = varietyKey(name);
  return g.bySpecies.get(speciesId)?.find((v) => v.key === k);
}

/** Variétés dont le nom contient les mots tapés (début de mot) ; celles qui commencent par le texte d'abord. */
export function suggestVarieties(g: Gnis, speciesId: string, q: string, limit = 8): GnisVariety[] {
  const k = varietyKey(q);
  if (k.length < 2) return [];
  const qw = k.split(' ');
  const list = (g.bySpecies.get(speciesId) ?? []).filter((v) => qw.every((w) => v.key.split(' ').some((x) => x.startsWith(w))));
  return list.sort((a, b) => Number(b.key.startsWith(k)) - Number(a.key.startsWith(k)) || Number(a.delisted) - Number(b.delisted) || a.name.localeCompare(b.name)).slice(0, limit);
}

let cache: Promise<Gnis> | null = null;
export function loadGnis(): Promise<Gnis> {
  cache ??= import('../data/gnis.json').then((m) => buildGnis(m.default as unknown as GnisData));
  return cache;
}
