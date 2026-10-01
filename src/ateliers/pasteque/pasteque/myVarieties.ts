import { QUANT_TRAITS, type WmEngine, type WmIndividual } from '../engine/pasteque/engine';
import type { WmVariety } from '../engine/pasteque/varieties';

/** Variétés créées par l'utilisateur (lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.pasteque.myvarieties.v1';

export function loadMyVarieties(): WmVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: WmVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: WmVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'pasteque', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): WmVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is WmVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants) && typeof v.species === 'string')
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/** Transforme une lignée fixée en variété. Renvoie null si elle n'est pas fixée. */
export function varietyFromIndividual(engine: WmEngine, ind: WmIndividual, name: string): WmVariety | null {
  const variants = engine.fixedVariants(ind);
  if (!variants || !engine.isFixed(ind) || ind.ploidy === 3) return null;
  return {
    id: `my-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    species: ind.species,
    hybridWith: ind.hybridWith,
    fertility: ind.fertility,
    origin: ind.label,
    variants,
    ploidy: ind.ploidy,
    weightKg: ind.pheno.weightKg,
    brix: ind.pheno.brix,
    days: ind.pheno.days,
    fruits: ind.pheno.fruits,
    kinds: [],
    source: 'custom',
    haps: Object.fromEntries(QUANT_TRAITS.map((t) => [t, [...ind.haps[t][0]]])),
    notes: ind.notes ? { fr: ind.notes, en: ind.notes } : undefined,
    createdAt: Date.now(),
  };
}
