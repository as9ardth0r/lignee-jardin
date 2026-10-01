import { QUANT_TRAITS, type TomatoEngine, type TomatoIndividual } from '../engine/tomato/engine';
import type { TomatoVariety } from '../engine/tomato/varieties';

/** Variétés créées par l'utilisateur (lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.tomato.myvarieties.v1';

export function loadMyVarieties(): TomatoVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: TomatoVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: TomatoVariety[]): string {
  return JSON.stringify({ app: 'lignee', species: 'tomato', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): TomatoVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is TomatoVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants))
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/** Transforme une lignée fixée en variété. Renvoie null si elle n'est pas fixée. */
export function varietyFromIndividual(engine: TomatoEngine, ind: TomatoIndividual, name: string): TomatoVariety | null {
  const variants = engine.fixedVariants(ind);
  if (!variants || !engine.isFixed(ind)) return null;
  return {
    id: `my-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    origin: ind.label,
    variants,
    weightG: ind.pheno.weightG,
    brix: ind.pheno.brix,
    days: ind.pheno.days,
    yieldKg: ind.pheno.yieldKg,
    source: 'custom',
    acidity: ind.pheno.acidity,
    crack: ind.pheno.crack,
    shelfDays: ind.pheno.shelfDays,
    heat: ind.pheno.heat,
    cold: ind.pheno.cold,
    haps: Object.fromEntries(QUANT_TRAITS.map((t) => [t, [...ind.haps[t][0]]])),
    notes: ind.notes,
    createdAt: Date.now(),
  };
}
