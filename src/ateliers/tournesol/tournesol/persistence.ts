import type { HaIndividual } from '../engine/tournesol/engine';

const KEY = 'lignee.tournesol.v1';

export function loadAmCatalog(): HaIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseAmCatalog(raw);
  } catch {
    return [];
  }
}

export function saveAmCatalog(list: HaIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeAmCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeAmCatalog(list: HaIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'tournesol', version: 1, individuals: list });
}

export function parseAmCatalog(raw: string): HaIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is HaIndividual => x && x.crop === 'tournesol' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
