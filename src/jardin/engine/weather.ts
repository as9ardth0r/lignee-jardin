/**
 * Météo locale (Open-Meteo, sans clé, données CC BY 4.0) : URL de requête,
 * lecture de la réponse, cache fusionné jour par jour, températures du jour
 * (mesurées, prévues ou normales du climat) et alertes des 4 prochains jours.
 *
 * La position envoyée est arrondie au centième de degré (≈ 1 km) : assez
 * pour la météo, pas assez pour retrouver une adresse.
 */
import { CLIMATES } from '../data/climate';
import type { ClimateId, GardenData, ISODate, WeatherCache, WeatherDay } from '../model';
import { addDays, daysInMonth, monthOf } from './dates';

export const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
export const GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
/** Jours passés et futurs demandés (maximum accepté : 92 jours passés). */
export const PAST_DAYS = 92;
export const FORECAST_DAYS = 10;
/** Âge maximal du cache avant une nouvelle requête (heures). */
export const REFRESH_HOURS = 3;
/** Jours gardés en cache (au-delà, les normales du climat prennent le relais). */
export const KEEP_DAYS = 500;

const DAILY = ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'et0_fao_evapotranspiration', 'wind_speed_10m_max', 'wind_gusts_10m_max'];

export const round2 = (x: number) => Math.round(x * 100) / 100;

export function weatherURL(lat: number, lon: number): string {
  const q = new URLSearchParams({
    latitude: String(round2(lat)),
    longitude: String(round2(lon)),
    daily: DAILY.join(','),
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
  });
  return `${OPEN_METEO}?${q.toString()}`;
}

export function geocodingURL(name: string, lang: 'fr' | 'en'): string {
  const q = new URLSearchParams({ name, count: '8', language: lang, format: 'json' });
  return `${GEOCODING}?${q.toString()}`;
}

export interface Place {
  name: string;
  lat: number;
  lon: number;
  detail: string;
  elevation?: number;
}

export function parseGeocoding(json: unknown): Place[] {
  const results = (json as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) return [];
  return results
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object' && typeof (r as Record<string, unknown>).latitude === 'number')
    .map((r) => ({
      name: String(r.name ?? ''),
      lat: r.latitude as number,
      lon: r.longitude as number,
      detail: [r.admin2, r.admin1, r.country].filter((x) => typeof x === 'string' && x).join(', '),
      elevation: typeof r.elevation === 'number' ? r.elevation : undefined,
    }));
}

/** Lit la réponse « daily » d'Open-Meteo ; ignore les jours incomplets. */
export function parseOpenMeteo(json: unknown): WeatherDay[] {
  const d = (json as { daily?: Record<string, unknown[]> })?.daily;
  if (!d || !Array.isArray(d.time)) throw new Error('format');
  const col = (k: string) => (Array.isArray(d[k]) ? (d[k] as unknown[]) : []);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const out: WeatherDay[] = [];
  d.time.forEach((t, i) => {
    const tmax = num(col('temperature_2m_max')[i]);
    const tmin = num(col('temperature_2m_min')[i]);
    if (typeof t !== 'string' || tmax === null || tmin === null) return;
    out.push({
      date: t.slice(0, 10),
      tmax,
      tmin,
      rain: num(col('precipitation_sum')[i]) ?? 0,
      et0: num(col('et0_fao_evapotranspiration')[i]) ?? 0,
      wind: num(col('wind_speed_10m_max')[i]) ?? 0,
      gust: num(col('wind_gusts_10m_max')[i]) ?? 0,
    });
  });
  return out;
}

/**
 * Fusionne une réponse dans le cache : les jours reçus remplacent les
 * anciens (une prévision devient une mesure), l'historique plus ancien est
 * gardé. Un changement de lieu de plus de ~5 km repart de zéro.
 */
export function mergeWeather(old: WeatherCache | undefined, lat: number, lon: number, days: WeatherDay[], fetchedAt: string): WeatherCache {
  const sameSpot = old && Math.abs(old.lat - round2(lat)) < 0.05 && Math.abs(old.lon - round2(lon)) < 0.05;
  const map = new Map<ISODate, WeatherDay>();
  if (sameSpot) for (const d of old.days) map.set(d.date, d);
  for (const d of days) map.set(d.date, d);
  const sorted = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { lat: round2(lat), lon: round2(lon), fetchedAt, days: sorted.slice(-KEEP_DAYS) };
}

export function needsRefresh(cache: WeatherCache | undefined, lat: number, lon: number, now: Date): boolean {
  if (!cache) return true;
  if (Math.abs(cache.lat - round2(lat)) >= 0.05 || Math.abs(cache.lon - round2(lon)) >= 0.05) return true;
  return now.getTime() - Date.parse(cache.fetchedAt) > REFRESH_HOURS * 3_600_000;
}

/** Index par date (mémorisé par objet cache). */
const indexCache = new WeakMap<WeatherCache, Map<ISODate, WeatherDay>>();
export function weatherIndex(cache: WeatherCache | undefined): Map<ISODate, WeatherDay> {
  if (!cache) return new Map();
  let m = indexCache.get(cache);
  if (!m) {
    m = new Map(cache.days.map((d) => [d.date, d]));
    indexCache.set(cache, m);
  }
  return m;
}

/** Météo utilisable : activée dans les réglages et présente en cache. */
export function activeWeather(data: Pick<GardenData, 'settings' | 'weather'>): Map<ISODate, WeatherDay> {
  return data.settings.weather ? weatherIndex(data.weather) : new Map();
}

/** Normales du climat pour un jour (interpolation entre les milieux de mois). */
export function normalDay(climate: ClimateId, date: ISODate): { tmax: number; tmin: number; et0: number; rain: number } {
  const c = CLIMATES[climate];
  const m = monthOf(date);
  const day = Number(date.slice(8, 10));
  const dim = daysInMonth(date);
  // Position par rapport au milieu du mois courant : interpolation avec le mois voisin.
  const f = (day - (dim + 1) / 2) / dim;
  const other = f >= 0 ? (m % 12) + 1 : ((m + 10) % 12) + 1;
  const w = Math.abs(f);
  const lerp = (arr: number[]) => arr[m - 1] * (1 - w) + arr[other - 1] * w;
  return { tmax: lerp(c.tmax), tmin: lerp(c.tmin), et0: lerp(c.et0), rain: c.rain[m - 1] / dim };
}

/** Températures d'un jour : météo si connue, sinon normales. */
export function tempsOn(date: ISODate, climate: ClimateId, wx: Map<ISODate, WeatherDay>): { tmax: number; tmin: number; measured: boolean } {
  const w = wx.get(date);
  if (w) return { tmax: w.tmax, tmin: w.tmin, measured: true };
  const n = normalDay(climate, date);
  return { tmax: n.tmax, tmin: n.tmin, measured: false };
}

// --- Alertes ---------------------------------------------------------------

export type AlertKind = 'frost' | 'heat' | 'wind' | 'rain';

export interface WeatherAlert {
  kind: AlertKind;
  date: ISODate;
  /** Valeur en cause (°C, km/h ou mm). */
  value: number;
  severe: boolean;
}

/** Seuils d'alerte. */
export const ALERT = { frost: 2, frostSevere: -1, heat: 32, heatSevere: 35, gust: 60, gustSevere: 80, rain: 20, rainSevere: 40 };

/** Alertes du jour et des 3 jours suivants, une par type (la plus forte). */
export function weatherAlerts(cache: WeatherCache | undefined, today: ISODate): WeatherAlert[] {
  if (!cache) return [];
  const idx = weatherIndex(cache);
  const best = new Map<AlertKind, WeatherAlert>();
  const keep = (a: WeatherAlert, worse: (x: WeatherAlert, y: WeatherAlert) => boolean) => {
    const cur = best.get(a.kind);
    if (!cur || worse(a, cur)) best.set(a.kind, a);
  };
  for (let i = 0; i <= 3; i++) {
    const date = addDays(today, i);
    const d = idx.get(date);
    if (!d) continue;
    if (d.tmin <= ALERT.frost) keep({ kind: 'frost', date, value: d.tmin, severe: d.tmin <= ALERT.frostSevere }, (x, y) => x.value < y.value);
    if (d.tmax >= ALERT.heat) keep({ kind: 'heat', date, value: d.tmax, severe: d.tmax >= ALERT.heatSevere }, (x, y) => x.value > y.value);
    if (d.gust >= ALERT.gust) keep({ kind: 'wind', date, value: d.gust, severe: d.gust >= ALERT.gustSevere }, (x, y) => x.value > y.value);
    if (d.rain >= ALERT.rain) keep({ kind: 'rain', date, value: d.rain, severe: d.rain >= ALERT.rainSevere }, (x, y) => x.value > y.value);
  }
  const order: AlertKind[] = ['frost', 'heat', 'wind', 'rain'];
  return order.flatMap((k) => (best.has(k) ? [best.get(k)!] : []));
}

/** Pluie prévue (mm) du lendemain au surlendemain inclus. */
export function rainNext(cache: WeatherCache | undefined, today: ISODate, days = 2): number {
  const idx = weatherIndex(cache);
  let s = 0;
  for (let i = 1; i <= days; i++) s += idx.get(addDays(today, i))?.rain ?? 0;
  return s;
}

/** Résumé des 7 derniers jours pour le diagnostic (humide, chaud, sec, froid). */
export function recentContext(cache: WeatherCache | undefined, today: ISODate): { humid: boolean; hot: boolean; dry: boolean; cold: boolean } | null {
  if (!cache) return null;
  const idx = weatherIndex(cache);
  const days = Array.from({ length: 7 }, (_, i) => idx.get(addDays(today, -i))).filter((d): d is WeatherDay => !!d);
  if (days.length < 4) return null;
  const rain = days.reduce((s, d) => s + d.rain, 0);
  const rainyDays = days.filter((d) => d.rain >= 1).length;
  return {
    humid: rain >= 15 || rainyDays >= 4,
    hot: days.some((d) => d.tmax >= 30),
    dry: rain < 3 && days.reduce((s, d) => s + d.et0, 0) >= 15,
    cold: days.some((d) => d.tmin <= 3),
  };
}

/** Âge du cache en heures (pour l'affichage). */
export function cacheAgeHours(cache: WeatherCache, now: Date): number {
  return Math.max(0, (now.getTime() - Date.parse(cache.fetchedAt)) / 3_600_000);
}


/**
 * Climat de référence suggéré d'après la position (France métropolitaine,
 * découpage grossier) : altitude d'abord, puis grandes zones.
 */
export function suggestClimate(lat: number, lon: number, elevation?: number): ClimateId {
  if (elevation !== undefined && elevation >= 800) return 'mountain';
  if (lon >= 8) return 'mediterranean'; // Corse
  if (lat < 44.3 && lon > 2.5) return 'mediterranean';
  if (lon < -1 || (lat > 47 && lon < 0) || (lat < 47 && lon < -0.5)) return 'oceanic';
  if (lon > 4.8 && lat > 45.5) return 'continental';
  return 'parisian';
}
