/**
 * Sauvegarde complète (JSON, photos comprises), exports CSV, import des
 * variétés fixées dans les apps Lignée, et jardin d'exemple.
 */
import { SPECIES_BY_ID } from '../data/species';
import { DEFAULT_SETTINGS, EMPTY_DATA, uid, type Sensor, type PestCount, type ShoppingItem, type StockItem, type GardenData, type ISODate, type PhotoMeta, type Variety } from '../model';
import { addDays, isValidISO, yearOf } from './dates';

export const BACKUP_APP = 'lignee-jardin';
export const BACKUP_VERSION = 1;

export interface PhotoExport {
  meta: PhotoMeta;
  /** Image complète et vignette en data URL (base64). */
  full: string;
  thumb: string;
}

export interface Backup {
  app: string;
  version: number;
  exportedAt: string;
  data: GardenData;
  photos: PhotoExport[];
}

export function serializeBackup(data: GardenData, photos: PhotoExport[]): string {
  const b: Backup = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data, photos };
  return JSON.stringify(b);
}

const arr = <T,>(x: unknown, ok: (v: unknown) => boolean): T[] => (Array.isArray(x) ? (x.filter(ok) as T[]) : []);
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
const hasId = (v: unknown) => obj(v) && typeof v.id === 'string';

/** Lit une sauvegarde ; rejette ce qui n'est pas une sauvegarde Lignée Jardin. */
export function parseBackup(raw: string): { data: GardenData; photos: PhotoExport[] } {
  const b = JSON.parse(raw) as Partial<Backup>;
  if (!obj(b) || b.app !== BACKUP_APP || !obj(b.data)) throw new Error('format');
  const d = b.data as Partial<GardenData>;
  const data: GardenData = {
    settings: { ...DEFAULT_SETTINGS, ...(obj(d.settings) ? d.settings : {}) },
    beds: arr(d.beds, (v) => hasId(v) && obj(v) && typeof v.name === 'string'),
    plants: arr(d.plants, (v) => hasId(v) && obj(v) && typeof v.speciesId === 'string' && !!SPECIES_BY_ID[v.speciesId as string] && isValidISO(v.sowDate)),
    varieties: arr(d.varieties, (v) => hasId(v) && obj(v) && typeof v.name === 'string'),
    observations: arr(d.observations, (v) => hasId(v) && obj(v) && isValidISO(v.date)),
    applications: arr(d.applications, (v) => hasId(v) && obj(v) && isValidISO(v.date) && typeof v.amount === 'number'),
    mulches: arr(d.mulches, (v) => hasId(v) && obj(v) && isValidISO(v.date) && typeof v.bedId === 'string' && typeof v.depthCm === 'number' && typeof v.material === 'string'),
    water: arr(d.water, (v) => hasId(v) && obj(v) && isValidISO(v.date) && typeof v.amount === 'number'),
    tasks: arr(d.tasks, (v) => hasId(v) && obj(v) && isValidISO(v.due)),
    taskStates: arr(d.taskStates, (v) => obj(v) && typeof v.key === 'string'),
    obstacles: arr(d.obstacles, (v) => hasId(v) && obj(v) && typeof v.height === 'number'),
    phenoEvents: arr(d.phenoEvents, (v) => hasId(v) && obj(v) && isValidISO(v.date) && typeof v.plantId === 'string'),
    treatments: arr(d.treatments, (v) => hasId(v) && obj(v) && isValidISO(v.date) && typeof v.problemId === 'string'),
    seeds: arr(d.seeds, (v) => hasId(v) && obj(v) && typeof v.speciesId === 'string' && !!SPECIES_BY_ID[v.speciesId as string] && typeof v.year === 'number'),
    prices: obj(d.prices) ? Object.fromEntries(Object.entries(d.prices).filter(([, x]) => typeof x === 'number' && x >= 0)) : {},
    weather: obj(d.weather) && Array.isArray((d.weather as { days?: unknown }).days) ? d.weather : undefined,
    sensors: arr<Sensor>(d.sensors, (v) => hasId(v) && obj(v) && typeof v.kind === 'string' && typeof v.name === 'string').map((x) => (x.source === 'ecowitt' ? { ...x, source: 'manual' as const, channel: undefined } : x)),
    readings: obj(d.readings)
      ? Object.fromEntries(
          Object.entries(d.readings)
            .filter(([, r]) => Array.isArray(r))
            .map(([k, r]) => [k, (r as unknown[]).filter((x): x is [number, number] => Array.isArray(x) && x.length === 2 && Number.isFinite(x[0]) && Number.isFinite(x[1]))]),
        )
      : {},
    pestCounts: arr<PestCount>(d.pestCounts, (v) => hasId(v) && obj(v) && isValidISO(v.date) && typeof v.pestId === 'string' && typeof v.value === 'number').map((x) => ({ ...x, beneficials: Array.isArray(x.beneficials) ? x.beneficials : [] })),
    stocks: arr<StockItem>(d.stocks, (v) => hasId(v) && obj(v) && typeof v.name === 'string' && typeof v.qty === 'number' && isValidISO(v.since)),
    shopping: arr<ShoppingItem>(d.shopping, (v) => hasId(v) && obj(v) && typeof v.label === 'string'),
    soilTests: arr(d.soilTests, (v) => hasId(v) && obj(v) && isValidISO(v.date)).map((x) => ({ pMethod: 'olsen', ...(x as object) })) as GardenData['soilTests'],
    plan: obj(d.plan) && typeof (d.plan as { year?: unknown }).year === 'number' && Array.isArray((d.plan as { wishes?: unknown }).wishes) ? (d.plan as GardenData['plan']) : undefined,
    tankChanges: arr(d.tankChanges, (v) => hasId(v) && obj(v) && isValidISO(v.date) && typeof v.bedId === 'string'),
    deleted: obj(d.deleted) ? Object.fromEntries(Object.entries(d.deleted).filter(([, x]) => typeof x === 'string')) : {},
  };
  for (const o of data.observations) if (!Array.isArray(o.photoIds)) o.photoIds = [];
  const photos = arr<PhotoExport>(b.photos, (v) => obj(v) && obj(v.meta) && typeof v.full === 'string' && typeof v.thumb === 'string');
  return { data, photos };
}

// --- CSV ---------------------------------------------------------------------

export function toCSV(rows: Array<Array<string | number | undefined>>): string {
  const cell = (v: string | number | undefined) => {
    // Nombres en virgule décimale : avec le point-virgule, c'est ce qu'attend un tableur réglé en français (sinon 3.5 devient une date).
    const s = v === undefined ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Point-virgule : séparateur attendu par les tableurs en français.
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\n');
}

// --- Variétés venues des apps Lignée ----------------------------------------

/** Correspondance entre l'app Lignée d'origine et l'espèce du catalogue. */
export const LIGNEE_CROPS: Record<string, string> = {
  tomato: 'tomato',
  tomate: 'tomato',
  carotte: 'carrot',
  chou: 'cabbage',
  courge: 'squash',
  haricot: 'bean',
  mais: 'sweetcorn',
  melon: 'melon',
  pasteque: 'watermelon',
  patate: 'potato',
  piment: 'pepper',
  pois: 'pea',
  fraise: 'strawberry',
  muflier: 'snapdragon',
};

/**
 * Lit un export « Mes lignées » d'une app Lignée
 * ({ app: 'lignee', crop | species, kind: 'varieties', varieties: [...] }).
 */
export function parseLigneeVarieties(raw: string): Variety[] {
  const d = JSON.parse(raw);
  if (!obj(d) || d.app !== 'lignee' || !Array.isArray(d.varieties)) throw new Error('format');
  const crop = String(d.crop ?? d.species ?? '');
  const speciesId = LIGNEE_CROPS[crop];
  if (!speciesId) throw new Error('crop');
  return (d.varieties as unknown[])
    .filter((v): v is Record<string, unknown> => obj(v) && typeof v.name === 'string')
    .map((v) => ({
      id: uid('var'),
      speciesId,
      name: String(v.name),
      origin: `lignee:${crop}`,
      daysToHarvest: typeof v.days === 'number' && v.days > 10 ? Math.round(v.days) : undefined,
      note: obj(v.notes) && typeof v.notes.fr === 'string' ? v.notes.fr : typeof v.origin === 'string' ? v.origin : undefined,
    }));
}

// --- Jardin d'exemple ---------------------------------------------------------

/** Trois planches et quelques cultures datées par rapport à aujourd'hui, pour découvrir l'app. */
export function demoGarden(today: ISODate, base: GardenData = EMPTY_DATA): GardenData {
  const bed = (id: string, name: string, x: number, y: number, w: number, h: number, mulch: boolean, kind: 'bed' | 'greenhouse' = 'bed') => ({ id, name, kind, x, y, w, h, mulch, drip: false, createdAt: today });
  const beds = [bed('demo-b1', 'Planche 1', 0.5, 0.5, 4, 1.2, true), bed('demo-b2', 'Planche 2', 0.5, 2.3, 4, 1.2, false), bed('demo-b3', 'Serre', 6, 0.5, 3, 2.5, true, 'greenhouse')];
  const plant = (id: string, speciesId: string, bedId: string, count: number, sowOffset: number, indoor: boolean, transplantOffset?: number, varietyName?: string) => ({
    id,
    speciesId,
    bedId,
    count,
    indoor,
    status: (sowOffset > 0 ? 'planned' : 'growing') as 'planned' | 'growing',
    sowDate: addDays(today, sowOffset),
    transplantDate: transplantOffset !== undefined ? addDays(today, transplantOffset) : undefined,
    varietyName,
    createdAt: today,
  });
  return {
    ...base,
    settings: { ...base.settings, onboarded: true },
    beds,
    plants: [
      plant('demo-p1', 'tomato', 'demo-b3', 6, -95, true, -45, 'Cœur de bœuf'),
      plant('demo-p2', 'lettuce', 'demo-b1', 12, -40, false),
      plant('demo-p3', 'carrot', 'demo-b1', 60, -55, false),
      plant('demo-p4', 'zucchini', 'demo-b2', 3, -70, true, -45),
      plant('demo-p5', 'bean', 'demo-b2', 40, 2, false),
    ],
    varieties: [],
    observations: [
      { id: 'demo-g0', plantId: 'demo-p1', bedId: 'demo-b3', date: addDays(today, -55), note: '', heightCm: 30, photoIds: [] },
      { id: 'demo-g1', plantId: 'demo-p1', bedId: 'demo-b3', date: addDays(today, -40), note: '', heightCm: 90, photoIds: [] },
      { id: 'demo-g2', plantId: 'demo-p1', bedId: 'demo-b3', date: addDays(today, -25), note: '', heightCm: 135, photoIds: [] },
      { id: 'demo-g3', plantId: 'demo-p1', bedId: 'demo-b3', date: addDays(today, -10), note: 'Fleurs au 6e bouquet', heightCm: 150, photoIds: [] },
      { id: 'demo-h5', plantId: 'demo-p1', bedId: 'demo-b3', date: addDays(today, -1), note: '', harvestG: 2600, photoIds: [] },
      { id: 'demo-h1', plantId: 'demo-p4', bedId: 'demo-b2', date: addDays(today, -12), note: 'Premières courgettes', harvestG: 1400, photoIds: [] },
      { id: 'demo-h2', plantId: 'demo-p4', bedId: 'demo-b2', date: addDays(today, -4), note: '', harvestG: 2100, photoIds: [] },
      { id: 'demo-h3', plantId: 'demo-p1', bedId: 'demo-b3', date: addDays(today, -3), note: 'Premières tomates mûres', harvestG: 900, photoIds: [] },
      { id: 'demo-h4', plantId: 'demo-p2', bedId: 'demo-b1', date: addDays(today, -2), note: '', harvestG: 650, photoIds: [] },
    ],
    applications: [
      { id: 'demo-a1', bedId: 'demo-b3', productId: 'organicNPK', amount: 600, date: addDays(today, -50), cost: 4.5 },
      { id: 'demo-a2', bedId: 'demo-b1', productId: 'poultry', amount: 300, date: addDays(today, -40), cost: 2 },
      { id: 'demo-a3', bedId: 'demo-b2', productId: 'organicNPK', amount: 500, date: addDays(today, -45), cost: 3.8 },
    ],
    water: [
      ...[-30, -24, -18, -12, -6].map((d, i) => ({ id: `demo-w${i}`, kind: 'irrigation' as const, amount: 120, bedId: 'demo-b3', date: addDays(today, d) })),
      { id: 'demo-r1', kind: 'rain' as const, amount: 12, date: addDays(today, -9) },
      { id: 'demo-r2', kind: 'rain' as const, amount: 6, date: addDays(today, -3) },
    ],
    tasks: [],
    taskStates: [],
    // Pucerons sur les courgettes, coccinelles au travail : on attend et on recompte.
    pestCounts: [
      { id: 'demo-pc1', plantId: 'demo-p4', bedId: 'demo-b2', date: addDays(today, -8), pestId: 'aphids', value: 45, beneficials: [] },
      { id: 'demo-pc2', plantId: 'demo-p4', bedId: 'demo-b2', date: addDays(today, -2), pestId: 'aphids', value: 40, beneficials: ['ladybird', 'mummies'] },
    ],
    // Analyse de terre du printemps : sol un peu acide, riche en phosphore, pauvre en magnésie.
    soilTests: [{ id: 'demo-soil', date: addDays(today, -180), pH: 6.0, om: 2.8, pMethod: 'olsen' as const, P2O5: 120, K2O: 210, MgO: 90, cec: 12, lab: 'Laboratoire (exemple)' }],
    // Une sonde d'humidité relevée chaque matin sur la planche 1.
    sensors: [{ id: 'demo-s1', name: 'Sonde Planche 1', kind: 'soilMoisture', bedId: 'demo-b1', source: 'manual' }],
    readings: {
      'demo-s1': [-6, -5, -4, -3, -2, -1, 0].map((d, i): [number, number] => {
        const [y, m, day] = addDays(today, d).split('-').map(Number);
        return [Math.floor(new Date(y, m - 1, day, 8).getTime() / 60_000), [26, 24, 23, 21, 25, 23, 22][i]];
      }),
    },
    obstacles: [
      { id: 'demo-o1', name: 'Maison', kind: 'building', x: 0, y: 6.4, w: 7, h: 1.6, height: 7 },
      { id: 'demo-o2', name: 'Pommier', kind: 'tree', x: 10, y: 3.5, w: 2, h: 2, height: 4 },
    ],
    phenoEvents: [],
    treatments: [],
    seeds: [
      { id: 'demo-s1', speciesId: 'carrot', varietyName: 'Nantaise 2', year: yearOf(today) - 1, quantity: '½ sachet', source: 'Jardinerie' },
      { id: 'demo-s2', speciesId: 'leek', varietyName: 'Bleu de Solaise', year: yearOf(today) - 3, quantity: '1 sachet', source: 'Échange' },
      { id: 'demo-s3', speciesId: 'tomato', varietyName: 'Cœur de bœuf', year: yearOf(today), quantity: '200 graines', source: 'Mes graines', seeds: 200 },
    ],
    prices: {},
    // Stocks : un engrais suivi (les apports notés se déduisent), du terreau, et une ligne de courses.
    stocks: [
      { id: 'demo-st1', kind: 'product', productId: 'organicNPK', name: 'Engrais organique universel 4-3-6', qty: 2.5, unit: 'kg', since: addDays(today, -60), min: 1.5, priceUnit: 6 },
      { id: 'demo-st2', kind: 'substrate', name: 'Terreau de semis', qty: 40, unit: 'L', since: addDays(today, -30), min: 20 },
    ],
    shopping: [{ id: 'demo-sh1', label: 'Ficelle de palissage' }],
  };
}
