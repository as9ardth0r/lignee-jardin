import { QUANT_TRAITS, type PtEngine, type PtIndividual } from '../engine/patate/engine';
import type { PtVariety } from '../engine/patate/varieties';

/** Variétés créées par l'utilisateur (clones), propres à cet appareil,
 * exportables/importables en JSON. Chez la pomme de terre, une variété est
 * un CLONE : on garde le génotype exact de la plante, hétérozygote. */
const KEY = 'lignee.patate.myvarieties.v1';

export function loadMyVarieties(): PtVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: PtVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: PtVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'patate', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): PtVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is PtVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.species === 'string' && (v.genotype || v.alleles))
    .map((v) => ({ ...v, alleles: v.alleles ?? {}, source: 'custom' as const }));
}

/** Transforme une plante en variété clonale (toujours possible, sauf plante stérile sans tubercules… ce qui n’existe pas : toute plante en fait). */
export function varietyFromIndividual(_engine: PtEngine, ind: PtIndividual, name: string): PtVariety | null {
  return {
    id: `my-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    species: ind.species,
    hybridWith: ind.hybridWith,
    ploidy: ind.ploidy,
    ebn: ind.ebn,
    fertility: ind.fertility,
    origin: ind.label,
    alleles: {},
    genotype: Object.fromEntries(Object.entries(ind.genotype).map(([k, v]) => [k, [...v]])),
    cyto: ind.cyto,
    inducer: ind.inducer,
    weightKg: ind.pheno.weightKg,
    days: ind.pheno.days,
    dm: ind.pheno.dm,
    frostC: ind.pheno.frostC,
    kinds: [],
    source: 'custom',
    haps: Object.fromEntries(QUANT_TRAITS.map((t) => [t, ind.haps[t].map((h) => [...h])])),
    notes: ind.notes ? { fr: ind.notes, en: ind.notes } : undefined,
    createdAt: Date.now(),
  };
}
