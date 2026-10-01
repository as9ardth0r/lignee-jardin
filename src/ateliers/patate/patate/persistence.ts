import type { PtIndividual } from '../engine/patate/engine';

const KEY = 'lignee.patate.v1';

export function loadPtCatalog(): PtIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parsePtCatalog(raw);
  } catch {
    return [];
  }
}

export function savePtCatalog(list: PtIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializePtCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializePtCatalog(list: PtIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'patate', version: 1, individuals: list });
}

export function parsePtCatalog(raw: string): PtIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is PtIndividual => x && x.crop === 'patate' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
