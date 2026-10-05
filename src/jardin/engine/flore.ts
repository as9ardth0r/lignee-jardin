/**
 * Flore de France (BDTFX, Tela Botanica, CC BY-SA 4.0) : recherche d'une
 * plante par nom français, nom scientifique ou synonyme, famille et statut
 * en France, et lien vers l'espèce du catalogue des cultures quand il y en a
 * une. La base (≈ 3 Mo) est chargée seulement à la première recherche.
 */
import type { Species } from '../model';

export interface FloreData {
  source: string;
  date: string;
  fam: string[];
  /** [numéro du nom retenu, nom scientifique, nom français, famille, drapeaux]. */
  t: Array<[number, string, string, number, number]>;
  /** [synonyme, numéro du nom retenu]. */
  s: Array<[string, number]>;
}

export interface Taxon {
  nn: number;
  sci: string;
  fr: string;
  family: string;
  present: boolean;
  native: boolean;
  introduced: boolean;
  cultivated: boolean;
  /** Sous-espèce (nom à trois mots). */
  infra: boolean;
}

export interface FloreHit {
  taxon: Taxon;
  /** Synonyme par lequel la plante a été trouvée. */
  via?: string;
  /** Nom courant par lequel la plante a été trouvée. */
  alias?: string;
  score: number;
}

export interface Flore {
  source: string;
  date: string;
  taxa: Taxon[];
  byNn: Map<number, Taxon>;
  keys: Array<{ key: string; words: string[]; taxon: Taxon; via?: string; alias?: string; fr: boolean }>;
  /** Noms courants qui n'ont pas trouvé leur plante (contrôle des données). */
  unresolved: string[];
}

/** Minuscules, sans accents ni ligatures, apostrophes et traits d'union en espaces. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`\-‐.,()×]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildFlore(d: FloreData, aliases: Array<[string, string]> = []): Flore {
  const taxa: Taxon[] = d.t.map(([nn, sci, fr, f, flags]) => ({ nn, sci, fr, family: d.fam[f] ?? '?', present: Boolean(flags & 1), native: Boolean(flags & 2), introduced: Boolean(flags & 4), cultivated: Boolean(flags & 8), infra: sci.split(' ').length > 2 }));
  const byNn = new Map(taxa.map((t) => [t.nn, t]));
  const keys: Flore['keys'] = [];
  const add = (text: string, taxon: Taxon, fr: boolean, via?: string) => {
    const key = norm(text);
    if (key) keys.push({ key, words: key.split(' '), taxon, via, fr });
  };
  for (const t of taxa) {
    add(t.sci, t, false);
    if (t.fr) add(t.fr, t, true);
  }
  for (const [name, nn] of d.s) {
    const t = byNn.get(nn);
    if (t) add(name, t, false, name);
  }
  // Noms courants : rattachés au nom scientifique (ou à un synonyme) indiqué.
  const bySciKey = new Map<string, Taxon>();
  for (const k of keys) if (!k.fr && !bySciKey.has(k.key)) bySciKey.set(k.key, k.taxon);
  const unresolved: string[] = [];
  for (const [name, sci] of aliases) {
    const t = bySciKey.get(norm(sci));
    if (!t) {
      unresolved.push(name);
      continue;
    }
    const key = norm(name);
    keys.push({ key, words: key.split(' '), taxon: t, alias: name, fr: true });
  }
  return { source: d.source, date: d.date, taxa, byNn, keys, unresolved };
}

/** Recherche : chaque mot tapé doit commencer un mot du nom (« tre rampant », « trifolium rep »). */
export function searchFlore(flore: Flore, query: string, limit = 40): FloreHit[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const qw = q.split(' ');
  const best = new Map<number, FloreHit>();
  for (const k of flore.keys) {
    if (!qw.every((w) => k.words.some((x) => x.startsWith(w)))) continue;
    let score = k.key === q ? 100 : k.key.startsWith(q) ? 60 : k.words[0].startsWith(qw[0]) ? 40 : 20;
    // Nom français réduit au genre (« Trèfle » pour des dizaines d'espèces) : peu parlant, passe après.
    if (!k.alias && k.fr && k.words.length === 1 && k.taxon.sci.includes(' ')) score = Math.min(score, 25);
    if (k.alias) score += 12;
    if (k.fr) score += 8;
    if (!k.via) score += 6;
    if (!k.taxon.infra) score += 5;
    if (k.taxon.present) score += 4;
    if (k.taxon.native) score += 3;
    if (/ x /.test(k.taxon.sci)) score -= 10;
    score -= Math.min(10, k.key.length / 8);
    const prev = best.get(k.taxon.nn);
    if (!prev || score > prev.score) best.set(k.taxon.nn, { taxon: k.taxon, via: k.via, alias: k.alias, score });
  }
  return [...best.values()].sort((a, b) => b.score - a.score || a.taxon.sci.localeCompare(b.taxon.sci)).slice(0, limit);
}

/** Espèce du catalogue des cultures correspondant à un taxon (même genre et espèce). */
export function catalogLinks(flore: Flore, species: Species[]): Map<number, Species> {
  const bySci = new Map<string, Taxon>();
  for (const t of flore.taxa) if (!t.infra) bySci.set(norm(t.sci), t);
  const synTo = new Map<string, Taxon>();
  for (const k of flore.keys) if (k.via && k.words.length === 2 && !synTo.has(k.key)) synTo.set(k.key, k.taxon);
  const out = new Map<number, Species>();
  for (const s of species) {
    // « Solanum lycopersicum », « Allium giganteum, A. hollandicum », « Tulipa » (genre seul : pas de lien).
    const first = norm(s.latin.split(',')[0]).split(' ').filter((w) => w !== 'x').slice(0, 2).join(' ');
    if (first.split(' ').length < 2) continue;
    const t = bySci.get(first) ?? synTo.get(first);
    if (t && !out.has(t.nn)) out.set(t.nn, s);
  }
  return out;
}

/** Ajoute à la recherche les noms des cultures du catalogue (« Tomate » → Solanum lycopersicum). */
export function addCatalogNames(flore: Flore, species: Species[]): Flore {
  for (const [nn, sp] of catalogLinks(flore, species)) {
    const t = flore.byNn.get(nn);
    if (!t) continue;
    const key = norm(sp.name.fr);
    if (!flore.keys.some((k) => k.taxon === t && k.key === key)) flore.keys.push({ key, words: key.split(' '), taxon: t, alias: sp.name.fr, fr: true });
  }
  return flore;
}

/** Fiche de la plante sur le site de Tela Botanica. */
export const telaUrl = (nn: number) => `https://www.tela-botanica.org/bdtfx-nn-${nn}-synthese`;

let cache: Promise<Flore> | null = null;
/** Charge la base à la demande (une seule fois). */
export function loadFlore(): Promise<Flore> {
  cache ??= Promise.all([import('../data/flore.json'), import('../data/floreAlias'), import('../data/species')]).then(([m, a, sp]) => addCatalogNames(buildFlore(m.default as unknown as FloreData, a.FLORE_ALIASES), sp.SPECIES));
  return cache;
}
