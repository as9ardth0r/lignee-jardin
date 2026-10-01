/**
 * Graines (faculté germinative) et bilan de saison (récoltes, valeur,
 * coût des intrants).
 */
import { SPECIES_EXTRA } from '../data/speciesExtra';
import type { GardenData, ISODate, SeedLot } from '../model';
import { yearOf } from './dates';
import { plantArea } from './crop';

export type SeedState = 'ok' | 'lastYear' | 'old';

/**
 * État d'un lot : « ok », « dernière année » de faculté germinative
 * habituelle, ou « ancien » (à tester avant de semer). Un test de
 * germination récent l'emporte : au-dessus de 70 %, le lot est bon.
 */
export function seedState(lot: SeedLot, today: ISODate): { state: SeedState; ageYears: number; life: number } {
  const life = SPECIES_EXTRA[lot.speciesId]?.seedLife ?? 3;
  const ageYears = yearOf(today) - lot.year;
  if (lot.germRate !== undefined && lot.germTested && yearOf(today) - yearOf(lot.germTested) <= 1) {
    return { state: lot.germRate >= 0.7 ? 'ok' : 'old', ageYears, life };
  }
  return { state: ageYears < life ? 'ok' : ageYears === life ? 'lastYear' : 'old', ageYears, life };
}

/** Taux d'un test de germination (graines levées / semées). */
export function germRate(sown: number, up: number): number {
  return sown > 0 ? Math.max(0, Math.min(1, up / sown)) : 0;
}

/** Graines à semer pour obtenir n plants, compte tenu du taux de germination. */
export function seedsFor(plants: number, rate: number): number {
  return Math.ceil(plants / Math.max(0.1, rate));
}

export interface HarvestRow {
  speciesId: string;
  grams: number;
  area: number;
  /** €/kg retenu (prix choisi, sinon référence). */
  priceKg: number;
  value: number;
}

export interface SeasonSummary {
  year: number;
  rows: HarvestRow[];
  grams: number;
  value: number;
  inputsCost: number;
}

/** Récoltes de l'année (observations avec un poids), par espèce. */
export function seasonSummary(data: GardenData, year: number): SeasonSummary {
  const byId = new Map(data.plants.map((p) => [p.id, p]));
  const rows = new Map<string, HarvestRow>();
  const areaSeen = new Set<string>();
  for (const o of data.observations) {
    if (!o.harvestG || !o.plantId || yearOf(o.date) !== year) continue;
    const p = byId.get(o.plantId);
    if (!p) continue;
    const priceKg = data.prices[p.speciesId] ?? SPECIES_EXTRA[p.speciesId]?.priceKg ?? 0;
    const row = rows.get(p.speciesId) ?? { speciesId: p.speciesId, grams: 0, area: 0, priceKg, value: 0 };
    row.grams += o.harvestG;
    if (!areaSeen.has(p.id)) {
      row.area += plantArea(p);
      areaSeen.add(p.id);
    }
    row.value = (row.grams / 1000) * priceKg;
    rows.set(p.speciesId, row);
  }
  const list = [...rows.values()].sort((a, b) => b.value - a.value);
  const inputsCost = data.applications.filter((a) => yearOf(a.date) === year).reduce((s, a) => s + (a.cost ?? 0), 0);
  return { year, rows: list, grams: list.reduce((s, r) => s + r.grams, 0), value: list.reduce((s, r) => s + r.value, 0), inputsCost };
}
