import type { PsIndividual } from '../engine/pois/engine';

const KEY = 'lignee.pois.v1';

export function loadPsCatalog(): PsIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parsePsCatalog(raw);
  } catch {
    return [];
  }
}

export function savePsCatalog(list: PsIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializePsCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializePsCatalog(list: PsIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'pois', version: 1, individuals: list });
}

export function parsePsCatalog(raw: string): PsIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is PsIndividual => x && x.crop === 'pois' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
