import type { MelonIndividual } from '../engine/melon/engine';

const KEY = 'lignee.melon.v1';

export function loadMelonCatalog(): MelonIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseMelonCatalog(raw);
  } catch {
    return [];
  }
}

export function saveMelonCatalog(list: MelonIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeMelonCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeMelonCatalog(list: MelonIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'melon', version: 1, individuals: list });
}

export function parseMelonCatalog(raw: string): MelonIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is MelonIndividual => x && x.crop === 'melon' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
