import type { SquashIndividual } from '../engine/courge/engine';

const KEY = 'lignee.courge.v1';

export function loadSquashCatalog(): SquashIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseSquashCatalog(raw);
  } catch {
    return [];
  }
}

export function saveSquashCatalog(list: SquashIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeSquashCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeSquashCatalog(list: SquashIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'courge', version: 1, individuals: list });
}

export function parseSquashCatalog(raw: string): SquashIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is SquashIndividual => x && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
