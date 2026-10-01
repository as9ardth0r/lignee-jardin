import type { FaIndividual } from '../engine/fraise/engine';

const KEY = 'lignee.fraise.v1';

export function loadFaCatalog(): FaIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseFaCatalog(raw);
  } catch {
    return [];
  }
}

export function saveFaCatalog(list: FaIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeFaCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeFaCatalog(list: FaIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'fraise', version: 1, individuals: list });
}

export function parseFaCatalog(raw: string): FaIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is FaIndividual => x && x.crop === 'fraise' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
