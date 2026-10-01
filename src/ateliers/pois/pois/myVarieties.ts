import { QUANT_TRAITS, type PsEngine, type PsIndividual } from '../engine/pois/engine';
import type { PsVariety } from '../engine/pois/varieties';

/** Variétés créées par l'utilisateur (lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.pois.myvarieties.v1';

export function loadMyVarieties(): PsVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: PsVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: PsVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'pois', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): PsVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is PsVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants) && typeof v.species === 'string')
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/** Transforme une lignée fixée en variété. Renvoie null si elle n'est pas fixée. */
export function varietyFromIndividual(engine: PsEngine, ind: PsIndividual, name: string): PsVariety | null {
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
    weightG: ind.pheno.weightG,
    days: ind.pheno.days,
    heightCm: ind.pheno.heightCm,
    seed100: ind.pheno.seed100,
    kinds: [],
    source: 'custom',
    haps: Object.fromEntries(QUANT_TRAITS.map((t) => [t, [...ind.haps[t][0]]])),
    notes: ind.notes ? { fr: ind.notes, en: ind.notes } : undefined,
    createdAt: Date.now(),
  };
}
