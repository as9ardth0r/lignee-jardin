import { QUANT_TRAITS, type MelonEngine, type MelonIndividual } from '../engine/melon/engine';
import type { MelonVariety } from '../engine/melon/varieties';

/** Variétés créées par l'utilisateur (lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.melon.myvarieties.v1';

export function loadMyVarieties(): MelonVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: MelonVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: MelonVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'melon', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): MelonVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is MelonVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants) && typeof v.group === 'string')
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/** Transforme une lignée fixée en variété. Renvoie null si elle n'est pas fixée. */
export function varietyFromIndividual(engine: MelonEngine, ind: MelonIndividual, name: string): MelonVariety | null {
  const variants = engine.fixedVariants(ind);
  if (!variants || !engine.isFixed(ind)) return null;
  return {
    id: `my-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    group: ind.group ?? 'cantalupensis',
    origin: ind.label,
    variants,
    weightKg: ind.pheno.weightKg,
    fruits: ind.pheno.fruits,
    days: ind.pheno.days,
    brix: ind.pheno.brix,
    storageDays: ind.pheno.storageDays,
    shapeRatio: ind.pheno.shapeRatio,
    kinds: [],
    source: 'custom',
    haps: Object.fromEntries(QUANT_TRAITS.map((t) => [t, [...ind.haps[t][0]]])),
    notes: { fr: ind.notes || `Lignée fixée obtenue dans Lignée à partir de ${ind.label}.`, en: ind.notes || `Fixed line bred in Lignée from ${ind.label}.` },
    createdAt: Date.now(),
  };
}
