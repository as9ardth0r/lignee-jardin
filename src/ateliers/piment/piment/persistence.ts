import type { PepperIndividual } from '../engine/piment/engine';

const KEY = 'lignee.piment.v1';

export function loadPepperCatalog(): PepperIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parsePepperCatalog(raw);
  } catch {
    return [];
  }
}

export function savePepperCatalog(list: PepperIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializePepperCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializePepperCatalog(list: PepperIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'piment', version: 1, individuals: list });
}

export function parsePepperCatalog(raw: string): PepperIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is PepperIndividual => x && x.crop === 'piment' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
