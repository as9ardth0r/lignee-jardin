import type { WmIndividual } from '../engine/pasteque/engine';

const KEY = 'lignee.pasteque.v1';

export function loadWmCatalog(): WmIndividual[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return parseWmCatalog(raw);
  } catch {
    return [];
  }
}

export function saveWmCatalog(list: WmIndividual[]) {
  try {
    window.localStorage.setItem(KEY, serializeWmCatalog(list));
  } catch {
    // stockage indisponible ou plein : sauvegarde best-effort
  }
}

export function serializeWmCatalog(list: WmIndividual[]): string {
  return JSON.stringify({ app: 'lignee', crop: 'pasteque', version: 1, individuals: list });
}

export function parseWmCatalog(raw: string): WmIndividual[] {
  const data = JSON.parse(raw);
  const list = Array.isArray(data) ? data : data?.individuals;
  if (!Array.isArray(list)) throw new Error('format');
  return list.filter(
    (x): x is WmIndividual => x && x.crop === 'pasteque' && typeof x.species === 'string' && typeof x.id === 'string' && x.genotype && x.haps && x.pheno
  );
}
