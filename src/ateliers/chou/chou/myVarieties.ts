import { QUANT_TRAITS, type BrEngine, type BrIndividual } from '../engine/chou/engine';
import type { BrVariety } from '../engine/chou/varieties';

/** Variétés créées par l'utilisateur (lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.chou.myvarieties.v1';

export function loadMyVarieties(): BrVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: BrVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: BrVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'chou', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): BrVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is BrVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants) && typeof v.species === 'string')
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/** Transforme une lignée fixée en variété. Renvoie null si elle n'est pas fixée. */
export function varietyFromIndividual(engine: BrEngine, ind: BrIndividual, name: string): BrVariety | null {
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
    cyto: ind.cyto,
    s: [ind.genotype.s[0], ind.genotype.s[1]],
    weightKg: ind.pheno.weightKg,
    days: ind.pheno.days,
    heightCm: ind.pheno.heightCm,
    frostC: ind.pheno.frostC,
    kinds: [],
    source: 'custom',
    haps: Object.fromEntries(QUANT_TRAITS.map((t) => [t, [...ind.haps[t][0]]])),
    notes: ind.notes ? { fr: ind.notes, en: ind.notes } : undefined,
    createdAt: Date.now(),
  };
}
