/**
 * Capteurs (phase 3) : relevés, import CSV, passerelle Ecowitt du réseau
 * local, humidité du sol rapportée à la réserve utile, et suivi EC/pH des
 * bacs hydroponiques.
 *
 * Ecowitt : les passerelles GW1100/GW2000 (et les consoles qui les
 * embarquent) répondent en HTTP sur le réseau local à
 * `/get_livedata_info`, en JSON. Le format n'est pas documenté
 * officiellement : la lecture est défensive et n'a pas été testée sur du
 * matériel réel.
 */
import { SPECIES_BY_ID } from '../data/species';
import type { GardenData, ISODate, Reading, Sensor, SensorKind, Texture } from '../model';
import { addDays, diffDays } from './dates';

/** Unité affichée de chaque mesure. */
export const SENSOR_UNIT: Record<SensorKind, string> = { soilMoisture: '%', soilTemp: '°C', airTemp: '°C', humidity: '%', ec: 'mS/cm', ph: '' };

/** Bornes plausibles : une valeur hors bornes est rejetée à l'import. */
export const SENSOR_RANGE: Record<SensorKind, [number, number]> = { soilMoisture: [0, 100], soilTemp: [-30, 60], airTemp: [-40, 60], humidity: [0, 100], ec: [0, 20], ph: [0, 14] };

/** Deux relevés d'un même capteur à moins de 10 minutes : on garde le premier. */
export const MIN_GAP_MIN = 10;
/** Relevés gardés par capteur (≈ 14 mois toutes les 15 minutes). */
export const MAX_READINGS = 40_000;

export function toMinutes(d: Date): number {
  return Math.floor(d.getTime() / 60_000);
}

/** Date locale (AAAA-MM-JJ) d'un relevé. */
export function readingDate(t: number): ISODate {
  const d = new Date(t * 60_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Ajoute des relevés à une série triée (doublons et relevés trop rapprochés écartés). */
export function addReadings(series: Reading[], incoming: Reading[]): { list: Reading[]; added: number } {
  const all = [...series, ...incoming.filter((r) => Number.isFinite(r[0]) && Number.isFinite(r[1]))].sort((a, b) => a[0] - b[0]);
  const out: Reading[] = [];
  for (const r of all) {
    const prev = out[out.length - 1];
    if (prev && r[0] - prev[0] < MIN_GAP_MIN) continue;
    out.push(r);
  }
  const list = out.length > MAX_READINGS ? out.slice(out.length - MAX_READINGS) : out;
  return { list, added: list.length - series.length };
}

export function latestReading(data: Pick<GardenData, 'readings'>, sensorId: string): Reading | undefined {
  const s = data.readings[sensorId];
  return s && s.length ? s[s.length - 1] : undefined;
}

// --- Import CSV ---------------------------------------------------------------

/**
 * Date et heure d'une cellule : « 2026-09-30 14:05 », « 2026-09-30T14:05:00Z »,
 * « 30/09/2026 14:05 », ou un horodatage Unix (secondes ou millisecondes).
 * Sans fuseau, l'heure est lue comme heure locale de l'appareil.
 */
export function parseDateTime(cell: string): Date | null {
  const c = cell.trim().replace(/^"|"$/g, '');
  if (/^\d{10}(\.\d+)?$/.test(c)) return new Date(Number(c) * 1000);
  if (/^\d{13}$/.test(c)) return new Date(Number(c));
  let m = c.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (m) {
    const [, y, mo, d, h = '0', mi = '0', s = '0', tz] = m;
    if (tz) {
      const iso = `${y}-${mo}-${d}T${h.padStart(2, '0')}:${mi}:${s.padStart(2, '0')}${tz === 'Z' ? 'Z' : tz.length === 5 ? `${tz.slice(0, 3)}:${tz.slice(3)}` : tz}`;
      const dt = new Date(iso);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  }
  m = c.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const [, d, mo, y, h = '0', mi = '0', s = '0'] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  }
  return null;
}

function parseNumber(cell: string, decimalComma: boolean): number {
  let c = cell.trim().replace(/^"|"$/g, '').replace(/%$/, '').trim();
  if (decimalComma) c = c.replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(c)) return NaN;
  return Number(c);
}

export interface CsvResult {
  readings: Reading[];
  skipped: number;
  /** Colonnes numériques trouvées (index), pour choisir la bonne. */
  columns: number[];
  header?: string[];
}

/**
 * Lit un CSV de relevés : première colonne = date et heure, valeur dans la
 * colonne `col` (par défaut la première colonne numérique). Séparateur
 * détecté (; , ou tabulation) ; virgule décimale acceptée avec ; ou tab.
 */
export function parseReadingsCSV(text: string, kind: SensorKind, col?: number): CsvResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { readings: [], skipped: 0, columns: [] };
  const first = lines[0];
  const sep = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',';
  const decimalComma = sep !== ',';
  const rows = lines.map((l) => l.split(sep));
  const hasHeader = !parseDateTime(rows[0][0] ?? '');
  const body = hasHeader ? rows.slice(1) : rows;
  const sample = body.slice(0, 20);
  const columns: number[] = [];
  const width = Math.max(...sample.map((r) => r.length), 0);
  for (let j = 1; j < width; j++) if (sample.some((r) => Number.isFinite(parseNumber(r[j] ?? '', decimalComma)))) columns.push(j);
  const c = col ?? columns[0] ?? 1;
  const [lo, hi] = SENSOR_RANGE[kind];
  const readings: Reading[] = [];
  let skipped = 0;
  for (const r of body) {
    const dt = parseDateTime(r[0] ?? '');
    const v = parseNumber(r[c] ?? '', decimalComma);
    if (!dt || !Number.isFinite(v) || v < lo || v > hi) {
      skipped++;
      continue;
    }
    readings.push([toMinutes(dt), v]);
  }
  return { readings, skipped, columns, header: hasHeader ? rows[0].map((x) => x.trim().replace(/^"|"$/g, '')) : undefined };
}

// --- Ecowitt ------------------------------------------------------------------

export function ecowittURL(host: string): string {
  const h = host.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `http://${h}/get_livedata_info`;
}

export interface EcowittLive {
  outdoor: { temp?: number; humidity?: number };
  soil: Record<string, number>;
  soilTemp: Record<string, number>;
  aisle: Record<string, { temp?: number; humidity?: number }>;
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v !== 'string') return undefined;
  const m = v.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
}

function celsius(v: unknown, unit: unknown): number | undefined {
  const x = num(v);
  if (x === undefined) return undefined;
  const u = typeof unit === 'string' ? unit : typeof v === 'string' && /F/.test(v) ? 'F' : 'C';
  return /F/i.test(u) ? Math.round(((x - 32) * 5) / 9 * 10) / 10 : x;
}

const list = (x: unknown): Array<Record<string, unknown>> => (Array.isArray(x) ? x.filter((e): e is Record<string, unknown> => !!e && typeof e === 'object') : []);

/** Lit la réponse JSON de `/get_livedata_info`. */
export function parseEcowitt(json: unknown): EcowittLive {
  const j = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
  const out: EcowittLive = { outdoor: {}, soil: {}, soilTemp: {}, aisle: {} };
  for (const e of list(j.common_list)) {
    // 0x02 : température extérieure ; 0x07 : humidité extérieure.
    if (e.id === '0x02') out.outdoor.temp = celsius(e.val, e.unit);
    if (e.id === '0x07') out.outdoor.humidity = num(e.val);
  }
  for (const e of list(j.ch_soil)) {
    const v = num(e.humidity);
    if (e.channel !== undefined && v !== undefined) out.soil[String(e.channel)] = v;
  }
  for (const e of list(j.ch_temp)) {
    const v = celsius(e.temp, e.unit);
    if (e.channel !== undefined && v !== undefined) out.soilTemp[String(e.channel)] = v;
  }
  for (const e of list(j.ch_aisle)) {
    if (e.channel === undefined) continue;
    out.aisle[String(e.channel)] = { temp: celsius(e.temp, e.unit), humidity: num(e.humidity) };
  }
  return out;
}

/** Relevés à enregistrer pour les capteurs Ecowitt déclarés. */
export function readingsFromEcowitt(live: EcowittLive, sensors: Sensor[], at: number): Array<[string, Reading]> {
  const out: Array<[string, Reading]> = [];
  for (const s of sensors) {
    if (s.source !== 'ecowitt' || !s.channel) continue;
    const ch = s.channel;
    let v: number | undefined;
    if (s.kind === 'soilMoisture') v = live.soil[ch];
    else if (s.kind === 'soilTemp') v = live.soilTemp[ch];
    else if (s.kind === 'airTemp') v = ch === 'outdoor' ? live.outdoor.temp : live.aisle[ch.replace(/^aisle/, '')]?.temp;
    else if (s.kind === 'humidity') v = ch === 'outdoor' ? live.outdoor.humidity : live.aisle[ch.replace(/^aisle/, '')]?.humidity;
    if (v !== undefined) out.push([s.id, [at, v]]);
  }
  return out;
}

// --- Humidité du sol → réserve utile ---------------------------------------------

/** Humidité volumique (%) à la capacité au champ et au point de flétrissement, par texture (ordres de grandeur). */
export const SOIL_WATER: Record<Texture, { fc: number; wp: number }> = {
  sand: { fc: 10, wp: 4 },
  sandyLoam: { fc: 18, wp: 8 },
  loam: { fc: 28, wp: 13 },
  siltLoam: { fc: 32, wp: 13 },
  clayLoam: { fc: 34, wp: 19 },
  clay: { fc: 40, wp: 25 },
};

/** Part de la réserve utile (0–1) d'après une mesure d'humidité du sol. */
export function moistureToFraction(sensor: Pick<Sensor, 'dry' | 'wet'>, value: number, texture: Texture): number {
  if (sensor.dry !== undefined && sensor.wet !== undefined && sensor.wet !== sensor.dry) {
    return Math.max(0, Math.min(1, (value - sensor.dry) / (sensor.wet - sensor.dry)));
  }
  const { fc, wp } = SOIL_WATER[texture];
  return Math.max(0, Math.min(1, (value - wp) / (fc - wp)));
}

/**
 * Pour une planche : dernière mesure d'humidité de chaque jour, en part de
 * réserve utile (moyenne des sondes de la planche).
 */
export function moistureByDay(bedId: string, texture: Texture, data: Pick<GardenData, 'sensors' | 'readings'>): Map<ISODate, number> {
  const perDay = new Map<ISODate, number[]>();
  for (const s of data.sensors) {
    if (s.kind !== 'soilMoisture' || s.bedId !== bedId) continue;
    const last = new Map<ISODate, number>();
    for (const [t, v] of data.readings[s.id] ?? []) last.set(readingDate(t), moistureToFraction(s, v, texture));
    for (const [d, f] of last) perDay.set(d, [...(perDay.get(d) ?? []), f]);
  }
  return new Map([...perDay].map(([d, l]) => [d, l.reduce((a, b) => a + b, 0) / l.length]));
}

// --- Hydroponie : EC et pH ---------------------------------------------------------

/**
 * Plages usuelles de conductivité (mS/cm) et de pH de la solution nutritive,
 * tableaux courants de culture hors-sol ; à affiner selon la variété, le
 * stade et l'eau de départ.
 */
export const HYDRO_TARGETS: Record<string, { ec: [number, number]; ph: [number, number] }> = {
  lettuce: { ec: [0.8, 1.2], ph: [5.5, 6.5] },
  spinach: { ec: [1.8, 2.3], ph: [6.0, 7.0] },
  basil: { ec: [1.0, 1.6], ph: [5.5, 6.5] },
  parsley: { ec: [0.8, 1.8], ph: [5.5, 6.0] },
  chives: { ec: [1.8, 2.4], ph: [6.0, 6.5] },
  rocket: { ec: [0.8, 1.2], ph: [6.0, 7.0] },
  tomato: { ec: [2.0, 5.0], ph: [5.5, 6.5] },
  pepper: { ec: [1.8, 2.8], ph: [5.5, 6.5] },
  kale: { ec: [1.25, 1.5], ph: [5.5, 6.5] },
  eggplant: { ec: [2.5, 3.5], ph: [5.5, 6.5] },
  cucumber: { ec: [1.7, 2.5], ph: [5.5, 6.0] },
  zucchini: { ec: [1.8, 2.4], ph: [5.5, 6.5] },
  melon: { ec: [2.0, 2.5], ph: [5.5, 6.0] },
  strawberry: { ec: [1.0, 1.4], ph: [5.5, 6.5] },
  bean: { ec: [2.0, 4.0], ph: [6.0, 6.5] },
  pea: { ec: [0.8, 1.8], ph: [6.0, 7.0] },
  cabbage: { ec: [2.5, 3.0], ph: [6.5, 7.0] },
  chard: { ec: [1.8, 2.3], ph: [6.0, 7.0] },
  celeriac: { ec: [1.8, 2.4], ph: [6.0, 6.5] },
  radish: { ec: [1.6, 2.2], ph: [6.0, 7.0] },
};

/** Plage commune aux cultures d'un bac (intersection ; à défaut, la plus prudente). */
export function tankTarget(speciesIds: string[]): { ec: [number, number]; ph: [number, number]; known: string[] } | null {
  const known = [...new Set(speciesIds)].filter((id) => HYDRO_TARGETS[id]);
  if (!known.length) return null;
  const t = known.map((id) => HYDRO_TARGETS[id]);
  let ec: [number, number] = [Math.max(...t.map((x) => x.ec[0])), Math.min(...t.map((x) => x.ec[1]))];
  if (ec[0] > ec[1]) ec = [Math.min(...t.map((x) => x.ec[0])), Math.min(...t.map((x) => x.ec[1]))];
  let ph: [number, number] = [Math.max(...t.map((x) => x.ph[0])), Math.min(...t.map((x) => x.ph[1]))];
  if (ph[0] > ph[1]) ph = [5.5, 6.5];
  return { ec, ph, known };
}

/** Renouveler la solution au moins tous les… (jours). */
export const TANK_RENEW_DAYS = 14;

export interface TankStatus {
  bedId: string;
  target: ReturnType<typeof tankTarget>;
  ec?: { value: number; t: number; state: 'low' | 'ok' | 'high' };
  ph?: { value: number; t: number; state: 'low' | 'ok' | 'high' };
  lastChange?: ISODate;
  renewDue: boolean;
  daysSinceChange?: number;
}

/** État d'un bac : dernières EC et pH comparées aux cibles, renouvellement. */
export function tankStatus(bedId: string, data: GardenData, today: ISODate): TankStatus {
  const species = data.plants.filter((p) => p.bedId === bedId && p.status === 'growing').map((p) => p.speciesId).filter((id) => SPECIES_BY_ID[id]);
  const target = tankTarget(species);
  const last = (kind: SensorKind) => {
    let best: Reading | undefined;
    for (const s of data.sensors) {
      if (s.kind !== kind || s.bedId !== bedId) continue;
      const r = latestReading(data, s.id);
      if (r && (!best || r[0] > best[0])) best = r;
    }
    return best;
  };
  const judge = (r: Reading | undefined, range?: [number, number]) => (r ? { value: r[1], t: r[0], state: (!range ? 'ok' : r[1] < range[0] ? 'low' : r[1] > range[1] ? 'high' : 'ok') as 'low' | 'ok' | 'high' } : undefined);
  const changes = data.tankChanges.filter((c) => c.bedId === bedId).map((c) => c.date).sort();
  const lastChange = changes[changes.length - 1];
  const daysSinceChange = lastChange ? diffDays(lastChange, today) : undefined;
  return {
    bedId,
    target,
    ec: judge(last('ec'), target?.ec),
    ph: judge(last('ph'), target?.ph),
    lastChange,
    daysSinceChange,
    renewDue: species.length > 0 && (daysSinceChange === undefined || daysSinceChange >= TANK_RENEW_DAYS),
  };
}

/** Prochaine date de renouvellement conseillée. */
export function nextRenewal(status: TankStatus, today: ISODate): ISODate {
  return status.lastChange ? addDays(status.lastChange, TANK_RENEW_DAYS) : today;
}
