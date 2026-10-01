import type { DcIndividual } from '../engine/carotte/engine';

const KEY = 'lignee.carotte.v1';

export function loadDcCatalog(): DcIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseDcCatalog(raw);
  } catch {
    return [];
  }
}

export function saveDcCatalog(list: DcIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeDcCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeDcCatalog(list: DcIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'carotte', version: 1, individuals: list });
}

export function parseDcCatalog(raw: string): DcIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is DcIndividual => x && x.crop === 'carotte' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
