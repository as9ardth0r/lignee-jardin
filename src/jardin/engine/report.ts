/**
 * Mode pro (phase 3) : récoltes prévues, bilan sur plusieurs années, et
 * contenu du rapport de saison (mis en page en PDF par l'app).
 */
import { SPECIES_EXTRA } from '../data/speciesExtra';
import type { GardenData, ISODate } from '../model';
import { plantArea, speciesOf } from './crop';
import { yearOf } from './dates';
import { expectedYieldKg } from './nutrition';
import { timeline } from './phenology';
import { seasonSummary } from './season';

export interface ForecastRow {
  plantId: string;
  speciesId: string;
  bedId: string;
  area: number;
  /** Récolte attendue sur la saison (kg) : rendement visé × surface. */
  expectedKg: number;
  harvestedKg: number;
  /** Reste à récolter (kg), jamais négatif. */
  remainingKg: number;
  from: ISODate;
  to: ISODate;
  valueEur: number;
}

/** Récoltes prévues des cultures en cours ou prévues. */
export function forecast(data: GardenData, today: ISODate): ForecastRow[] {
  const harvested = new Map<string, number>();
  for (const o of data.observations) if (o.plantId && o.harvestG) harvested.set(o.plantId, (harvested.get(o.plantId) ?? 0) + o.harvestG / 1000);
  return data.plants
    .filter((p) => p.status !== 'ended' && speciesOf(p).type !== 'flower')
    .map((p) => {
      const tl = timeline(p, data, today);
      const expectedKg = expectedYieldKg(p);
      const harvestedKg = harvested.get(p.id) ?? 0;
      const priceKg = data.prices[p.speciesId] ?? SPECIES_EXTRA[p.speciesId]?.priceKg ?? 0;
      const remainingKg = Math.max(0, expectedKg - harvestedKg);
      return { plantId: p.id, speciesId: p.speciesId, bedId: p.bedId, area: plantArea(p), expectedKg, harvestedKg, remainingKg, from: tl.harvestFrom, to: tl.harvestTo, valueEur: remainingKg * priceKg };
    })
    .sort((a, b) => a.from.localeCompare(b.from));
}

/** Récoltes attendues par mois (kg), réparties uniformément sur la fenêtre de chaque culture. */
export function forecastByMonth(rows: ForecastRow[], today: ISODate): Array<{ month: string; kg: number }> {
  const out = new Map<string, number>();
  for (const r of rows) {
    if (r.remainingKg <= 0) continue;
    const start = r.from > today ? r.from : today;
    if (start > r.to) {
      const m = today.slice(0, 7);
      out.set(m, (out.get(m) ?? 0) + r.remainingKg);
      continue;
    }
    const s = Date.parse(`${start}T00:00:00Z`);
    const e = Date.parse(`${r.to}T00:00:00Z`);
    const days = Math.max(1, Math.round((e - s) / 86_400_000) + 1);
    for (let i = 0; i < days; i++) {
      const m = new Date(s + i * 86_400_000).toISOString().slice(0, 7);
      out.set(m, (out.get(m) ?? 0) + r.remainingKg / days);
    }
  }
  return [...out.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, kg]) => ({ month, kg }));
}

export interface YearRow {
  year: number;
  speciesId: string;
  grams: number;
  area: number;
  value: number;
}

/** Bilan pluriannuel : une ligne par année et par espèce, plus les intrants par année. */
export function multiYear(data: GardenData): { rows: YearRow[]; inputs: Record<number, number>; years: number[] } {
  const years = new Set<number>();
  for (const o of data.observations) if (o.harvestG) years.add(yearOf(o.date));
  for (const a of data.applications) years.add(yearOf(a.date));
  const rows: YearRow[] = [];
  const inputs: Record<number, number> = {};
  for (const y of [...years].sort()) {
    const s = seasonSummary(data, y);
    for (const r of s.rows) rows.push({ year: y, speciesId: r.speciesId, grams: r.grams, area: r.area, value: r.value });
    inputs[y] = s.inputsCost;
  }
  return { rows, inputs, years: [...years].sort() };
}

export interface ReportData {
  gardenName: string;
  year: number;
  generated: ISODate;
  beds: number;
  plants: number;
  season: ReturnType<typeof seasonSummary>;
  forecast: ForecastRow[];
  treatments: GardenData['treatments'];
  applications: GardenData['applications'];
  waterLiters: number;
  rainMm: number;
}

/** Contenu du rapport de saison d'une année. */
export function reportData(data: GardenData, year: number, today: ISODate): ReportData {
  const inYear = (d: string) => yearOf(d) === year;
  return {
    gardenName: data.settings.gardenName,
    year,
    generated: today,
    beds: data.beds.length,
    plants: data.plants.filter((p) => yearOf(p.sowDate) === year || (p.endDate ? yearOf(p.endDate) === year : p.status === 'growing')).length,
    season: seasonSummary(data, year),
    forecast: yearOf(today) === year ? forecast(data, today).filter((r) => r.remainingKg > 0) : [],
    treatments: data.treatments.filter((t) => inYear(t.date)).sort((a, b) => a.date.localeCompare(b.date)),
    applications: data.applications.filter((a) => inYear(a.date)).sort((a, b) => a.date.localeCompare(b.date)),
    waterLiters: data.water.filter((w) => w.kind === 'irrigation' && inYear(w.date)).reduce((s, w) => s + w.amount, 0),
    rainMm: data.water.filter((w) => w.kind === 'rain' && inYear(w.date)).reduce((s, w) => s + w.amount, 0),
  };
}
