import type { LoIndividual } from '../engine/pdsenteur/engine';

const KEY = 'lignee.pdsenteur.v1';

export function loadAmCatalog(): LoIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseAmCatalog(raw);
  } catch {
    return [];
  }
}

export function saveAmCatalog(list: LoIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeAmCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeAmCatalog(list: LoIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'pdsenteur', version: 1, individuals: list });
}

export function parseAmCatalog(raw: string): LoIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is LoIndividual => x && x.crop === 'pdsenteur' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
