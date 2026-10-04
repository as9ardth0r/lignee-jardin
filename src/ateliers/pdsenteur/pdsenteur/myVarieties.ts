import { QUANT_TRAITS, type LoEngine, type LoIndividual } from '../engine/pdsenteur/engine';
import type { LoVariety } from '../engine/pdsenteur/varieties';

/** Variétés créées par l'utilisateur (lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.pdsenteur.myvarieties.v1';

export function loadMyVarieties(): LoVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: LoVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: LoVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'pdsenteur', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): LoVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is LoVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants) && typeof v.species === 'string')
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/** Transforme une lignée fixée en variété. Renvoie null si elle n'est pas fixée. */
export function varietyFromIndividual(engine: LoEngine, ind: LoIndividual, name: string): LoVariety | null {
  const variants = engine.fixedVariants(ind);
  if (!variants || !engine.isFixed(ind)) return null;
  return {
    id: `my-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    species: ind.species,
    hybridWith: ind.hybridWith,
    fertility: ind.fertility,
    origin: ind.label,
    variants,
    sAlleles: ind.genotype.s[0] === 'Sc' && ind.genotype.s[1] === 'Sc' ? undefined : [ind.genotype.s[0], ind.genotype.s[1]],
    heightCm: ind.pheno.heightCm,
    florets: ind.pheno.florets,
    days: ind.pheno.days,
    scent: ind.pheno.scent,
    inbred: true,
    kinds: [],
    source: 'custom',
    haps: Object.fromEntries(QUANT_TRAITS.map((t) => [t, [...ind.haps[t][0]]])),
    notes: ind.notes ? { fr: ind.notes, en: ind.notes } : undefined,
    createdAt: Date.now(),
  };
}
