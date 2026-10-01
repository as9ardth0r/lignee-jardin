import type { MzIndividual } from '../engine/mais/engine';

const KEY = 'lignee.mais.v1';

export function loadMzCatalog(): MzIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseMzCatalog(raw);
  } catch {
    return [];
  }
}

export function saveMzCatalog(list: MzIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeMzCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeMzCatalog(list: MzIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'mais', version: 1, individuals: list });
}

export function parseMzCatalog(raw: string): MzIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is MzIndividual => x && x.crop === 'mais' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
