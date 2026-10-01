import type { BeanIndividual } from '../engine/haricot/engine';

const KEY = 'lignee.haricot.v1';

export function loadBeanCatalog(): BeanIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseBeanCatalog(raw);
  } catch {
    return [];
  }
}

export function saveBeanCatalog(list: BeanIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeBeanCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeBeanCatalog(list: BeanIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'haricot', version: 1, individuals: list });
}

export function parseBeanCatalog(raw: string): BeanIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is BeanIndividual => x && x.crop === 'haricot' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
