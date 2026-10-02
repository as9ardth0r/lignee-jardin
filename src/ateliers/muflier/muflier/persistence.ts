import type { AmIndividual } from '../engine/muflier/engine';

const KEY = 'lignee.muflier.v1';

export function loadAmCatalog(): AmIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseAmCatalog(raw);
  } catch {
    return [];
  }
}

export function saveAmCatalog(list: AmIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeAmCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeAmCatalog(list: AmIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'muflier', version: 1, individuals: list });
}

export function parseAmCatalog(raw: string): AmIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is AmIndividual => x && x.crop === 'muflier' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
