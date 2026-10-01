import { QUANT_TRAITS, type FaEngine, type FaIndividual } from '../engine/fraise/engine';
import { FA_LOCI, type VariantId } from '../engine/fraise/loci';
import type { FaVariety } from '../engine/fraise/varieties';

/** Variétés créées par l'utilisateur (clones ou lignées fixées), propres à cet appareil,
 * exportables/importables en JSON. */
const KEY = 'lignee.fraise.myvarieties.v1';

export function loadMyVarieties(): FaVariety[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseMyVarieties(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyVarieties(list: FaVariety[]) {
  try {
    window.localStorage.setItem(KEY, serializeMyVarieties(list));
  } catch {
    // best-effort
  }
}

export function serializeMyVarieties(list: FaVariety[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'fraise', kind: 'varieties', version: 1, varieties: list });
}

export function parseMyVarieties(raw: string): FaVariety[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.varieties;
  if (!Array.isArray(list)) throw new Error('format');
  return list
    .filter((v): v is FaVariety => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.variants) && typeof v.species === 'string')
    .map((v) => ({ ...v, source: 'custom' as const }));
}

/**
 * Enregistre une plante comme variété. Fraisier cultivé : c’est un CLONE
 * (multiplié par stolons), il garde son hétérozygotie ; fraisier des bois :
 * seulement une lignée fixée, qui se ressème fidèlement. Renvoie null sinon.
 */
export function varietyFromIndividual(engine: FaEngine, ind: FaIndividual, name: string): FaVariety | null {
  const clonal = ind.species !== 'vesca';
  if (!clonal && !engine.isFixed(ind)) return null;
  const het: VariantId[] = [];
  const variants: VariantId[] = [];
  for (const def of FA_LOCI) {
    const pair = ind.genotype[def.id];
    for (const a of def.alleles) {
      if (!a.id) continue;
      const n = (pair[0] === a.allele ? 1 : 0) + (pair[1] === a.allele ? 1 : 0);
      if (n === 2) variants.push(a.id);
      else if (n === 1) het.push(a.id);
    }
  }
  return {
    id: `my-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    species: ind.species,
    hybridWith: ind.hybridWith,
    fertility: ind.fertility,
    origin: ind.label,
    variants,
    het: het.length ? het : undefined,
    weightG: ind.pheno.weightG,
    firmness: ind.pheno.firmness,
    brix: ind.pheno.brix,
    early: ind.pheno.early,
    runners: ind.pheno.runners,
    inbred: !clonal,
    kinds: [],
    source: 'custom',
    // Le clone garde ses deux haplotypes : on mémorise les deux (clé + suffixe).
    haps: clonal ? undefined : Object.fromEntries(QUANT_TRAITS.map((t) => [t, [...ind.haps[t][0]]])),
    clone: clonal ? Object.fromEntries(QUANT_TRAITS.map((t) => [t, [[...ind.haps[t][0]], [...ind.haps[t][1]]]])) as FaVariety['clone'] : undefined,
    notes: ind.notes ? { fr: ind.notes, en: ind.notes } : undefined,
    createdAt: Date.now(),
  };
}
