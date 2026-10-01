import { QUANT_TRAITS, type BeanEngine, type BeanIndividual } from '../engine/haricot/engine';
import type { BeanVariety } from '../engine/haricot/varieties';

/** Variétés créées par l'utilisateur (lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.haricot.myvarieties.v1';

export function loadMyVarieties(): BeanVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: BeanVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: BeanVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'haricot', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): BeanVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is BeanVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants) && typeof v.species === 'string')
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/** Transforme une lignée fixée en variété. Renvoie null si elle n'est pas fixée. */
export function varietyFromIndividual(engine: BeanEngine, ind: BeanIndividual, name: string): BeanVariety | null {
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
    seed100: ind.pheno.seed100,
    podCm: ind.pheno.podCm,
    pods: ind.pheno.pods,
    days: ind.pheno.days,
    heightCm: ind.pheno.heightCm,
    kinds: [],
    source: 'custom',
    haps: Object.fromEntries(QUANT_TRAITS.map((t) => [t, [...ind.haps[t][0]]])),
    notes: ind.notes ? { fr: ind.notes, en: ind.notes } : undefined,
    createdAt: Date.now(),
  };
}
