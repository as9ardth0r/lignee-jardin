import type { BrIndividual } from '../engine/chou/engine';

const KEY = 'lignee.chou.v1';

export function loadBrCatalog(): BrIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseBrCatalog(raw);
  } catch {
    return [];
  }
}

export function saveBrCatalog(list: BrIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeBrCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeBrCatalog(list: BrIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'chou', version: 1, individuals: list });
}

export function parseBrCatalog(raw: string): BrIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is BrIndividual => x && x.crop === 'chou' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
