import type { TomatoIndividual } from '../engine/tomato/engine';

const KEY = 'lignee.tomato.v1';

export function loadTomatoCatalog(): TomatoIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseTomatoCatalog(raw);
  } catch {
    return [];
  }
}

export function saveTomatoCatalog(list: TomatoIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeTomatoCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeTomatoCatalog(list: TomatoIndividual[]): string {
  return JSON.stringify({ app: 'lignee', species: 'tomato', version: 1, individuals: list });
}

export function parseTomatoCatalog(raw: string): TomatoIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is TomatoIndividual => x && x.species === 'tomato' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
