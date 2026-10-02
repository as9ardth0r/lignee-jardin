import { QUANT_TRAITS, type AmEngine, type AmIndividual } from '../engine/muflier/engine';
import type { AmVariety } from '../engine/muflier/varieties';

/** Variétés créées par l'utilisateur (lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.muflier.myvarieties.v1';

export function loadMyVarieties(): AmVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: AmVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: AmVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'muflier', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): AmVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is AmVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants) && typeof v.species === 'string')
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/** Transforme une lignée fixée en variété. Renvoie null si elle n'est pas fixée. */
export function varietyFromIndividual(engine: AmEngine, ind: AmIndividual, name: string): AmVariety | null {
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
