/**
 * Stockage hors-ligne (IndexedDB) et état partagé de l'app.
 *
 * Phase 1 : les données du jardin sont un seul enregistrement JSON (petit,
 * quelques milliers d'objets au plus), réécrit après chaque modification ;
 * les photos sont des Blobs dans leur propre magasin. La même interface
 * pourra être servie par SQLite (plugin Capacitor) plus tard.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, EMPTY_DATA, uid, type Application, type Bed, type GardenData, type ManualTask, type Obstacle, type Observation, type PhenoEvent, type PhotoMeta, type Plant, type SeedLot, type Settings, type TaskState, type Treatment, type Variety, type WaterEvent } from './model';
import { mergeWeather, needsRefresh, parseOpenMeteo, weatherURL } from './engine/weather';
import { demoGarden, parseBackup, serializeBackup, type PhotoExport } from './engine/backup';
import { todayISO } from './engine/dates';

const DB_NAME = 'lignee-jardin';
const DB_VERSION = 1;
const KV = 'kv';
const PHOTOS = 'photos';
const DATA_KEY = 'garden';

interface PhotoRecord {
  id: string;
  meta: PhotoMeta;
  full: Blob;
  thumb: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('indexedDB'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
      if (!db.objectStoreNames.contains(PHOTOS)) db.createObjectStore(PHOTOS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = run(t.objectStore(store));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

/** Complète des données lues sur disque (anciennes versions, champs manquants). */
function normalize(d: Partial<GardenData> | undefined): GardenData {
  return {
    ...EMPTY_DATA,
    ...(d ?? {}),
    settings: { ...DEFAULT_SETTINGS, ...(d?.settings ?? {}) },
  } as GardenData;
}

// --- Photos ----------------------------------------------------------------

async function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', quality));
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!jpeg) throw new Error('canvas');
  return jpeg;
}

async function resize(bitmap: ImageBitmap, max: number, quality: number): Promise<Blob> {
  const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * k);
  canvas.height = Math.round(bitmap.height * k);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return toBlob(canvas, quality);
}

/** Compresse une photo : 1 600 px au plus (WebP), vignette de 320 px. Les métadonnées (GPS compris) ne sont pas conservées. */
export async function compressPhoto(file: Blob): Promise<{ full: Blob; thumb: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    const full = await resize(bitmap, 1600, 0.82);
    const thumb = await resize(bitmap, 320, 0.75);
    const k = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    return { full, thumb, width: Math.round(bitmap.width * k), height: Math.round(bitmap.height * k) };
  } finally {
    bitmap.close();
  }
}

function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
}

async function dataURLToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

// --- Contexte -----------------------------------------------------------------

export interface GardenStore {
  ready: boolean;
  /** Stockage indisponible (navigation privée…) : les données ne survivront pas à la fermeture. */
  volatile: boolean;
  data: GardenData;
  today: string;
  updateSettings: (patch: Partial<Settings>) => void;
  saveBed: (bed: Bed) => void;
  deleteBed: (id: string) => void;
  savePlant: (plant: Plant) => void;
  deletePlant: (id: string) => void;
  saveVarieties: (list: Variety[]) => void;
  deleteVariety: (id: string) => void;
  addObservation: (obs: Omit<Observation, 'id' | 'photoIds'>, photos: Blob[]) => Promise<void>;
  deleteObservation: (id: string) => void;
  addApplication: (app: Omit<Application, 'id'>) => void;
  deleteApplication: (id: string) => void;
  addWater: (e: Omit<WaterEvent, 'id'>) => void;
  deleteWater: (id: string) => void;
  saveTask: (t: ManualTask) => void;
  deleteTask: (id: string) => void;
  setTaskState: (s: TaskState) => void;
  photoURL: (id: string, size: 'thumb' | 'full') => Promise<string | null>;
  exportBackup: () => Promise<string>;
  importBackup: (raw: string) => Promise<void>;
  loadDemo: () => void;
  resetAll: () => Promise<void>;
  saveObstacle: (o: Obstacle) => void;
  deleteObstacle: (id: string) => void;
  addPhenoEvent: (e: Omit<PhenoEvent, 'id'>) => void;
  deletePhenoEvent: (id: string) => void;
  addTreatment: (t: Omit<Treatment, 'id'>) => void;
  deleteTreatment: (id: string) => void;
  saveSeed: (lot: SeedLot) => void;
  deleteSeed: (id: string) => void;
  setPrice: (speciesId: string, priceKg: number | undefined) => void;
  /** Télécharge la météo locale (si une position est connue). */
  refreshWeather: (force?: boolean) => Promise<'ok' | 'offline' | 'error' | 'noPlace' | 'fresh'>;
  weatherBusy: boolean;
}

const Ctx = createContext<GardenStore | null>(null);

export function GardenProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GardenData>(EMPTY_DATA);
  const [ready, setReady] = useState(false);
  const [volatile, setVolatile] = useState(false);
  const dbRef = useRef<IDBDatabase | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const urlCache = useRef(new Map<string, string>());
  const latest = useRef<GardenData>(EMPTY_DATA);
  const [today, setToday] = useState(() => todayISO());
  const [weatherBusy, setWeatherBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    openDB()
      .then(async (db) => {
        dbRef.current = db;
        const stored = await tx<GardenData>(db, KV, 'readonly', (s) => s.get(DATA_KEY) as IDBRequest<GardenData>);
        if (!cancelled) {
          latest.current = normalize(stored);
          setData(latest.current);
        }
      })
      .catch(() => {
        if (!cancelled) setVolatile(true);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    // Le jour change pendant que l'app reste ouverte (minuit) : on recalcule.
    const t = window.setInterval(() => setToday(todayISO()), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  /** Applique une modification et l'écrit sur le disque (regroupée sur 300 ms). */
  const mutate = useCallback((fn: (d: GardenData) => GardenData) => {
    setData((prev) => {
      const next = fn(prev);
      latest.current = next;
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveTimer.current = undefined;
        const db = dbRef.current;
        if (db) tx(db, KV, 'readwrite', (s) => s.put(latest.current, DATA_KEY)).catch(() => setVolatile(true));
      }, 300);
      return next;
    });
  }, []);

  // Écrit immédiatement si l'app passe en arrière-plan (téléphone verrouillé, onglet fermé).
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== 'hidden') return;
      const db = dbRef.current;
      if (!db || saveTimer.current === undefined) return;
      window.clearTimeout(saveTimer.current);
      saveTimer.current = undefined;
      tx(db, KV, 'readwrite', (s) => s.put(latest.current, DATA_KEY)).catch(() => {});
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, []);

  const upsert = <T extends { id: string }>(list: T[], item: T) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);

  const deletePhotos = useCallback(async (ids: string[]) => {
    const db = dbRef.current;
    for (const id of ids) {
      for (const size of ['thumb', 'full']) {
        const url = urlCache.current.get(`${id}:${size}`);
        if (url) URL.revokeObjectURL(url);
        urlCache.current.delete(`${id}:${size}`);
      }
      if (db) await tx(db, PHOTOS, 'readwrite', (s) => s.delete(id)).catch(() => {});
    }
  }, []);

  const refreshWeather = useCallback(
    async (force = false): Promise<'ok' | 'offline' | 'error' | 'noPlace' | 'fresh'> => {
      const { settings, weather } = latest.current;
      if (settings.lat === undefined || settings.lon === undefined) return 'noPlace';
      if (!force && !needsRefresh(weather, settings.lat, settings.lon, new Date())) return 'fresh';
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
      setWeatherBusy(true);
      try {
        const res = await fetch(weatherURL(settings.lat, settings.lon));
        if (!res.ok) return 'error';
        const days = parseOpenMeteo(await res.json());
        const { lat, lon } = latest.current.settings;
        if (lat === undefined || lon === undefined) return 'noPlace';
        mutate((d) => ({ ...d, weather: mergeWeather(d.weather, lat, lon, days, new Date().toISOString()) }));
        return 'ok';
      } catch {
        return 'error';
      } finally {
        setWeatherBusy(false);
      }
    },
    [mutate],
  );

  // Météo : à l'ouverture, puis toutes les heures tant que l'app reste ouverte (si le cache a plus de 3 h).
  const weatherOn = data.settings.weather && data.settings.lat !== undefined;
  useEffect(() => {
    if (!ready || !weatherOn) return;
    void refreshWeather();
    const t = window.setInterval(() => void refreshWeather(), 3_600_000);
    const online = () => void refreshWeather();
    window.addEventListener('online', online);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('online', online);
    };
  }, [ready, weatherOn, data.settings.lat, data.settings.lon, refreshWeather]);

  const store = useMemo<GardenStore>(
    () => ({
      ready,
      volatile,
      data,
      today,
      updateSettings: (patch) => mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      saveBed: (bed) => mutate((d) => ({ ...d, beds: upsert(d.beds, bed) })),
      deleteBed: (id) => {
        const photoIds = data.observations.filter((o) => o.bedId === id || data.plants.some((p) => p.bedId === id && p.id === o.plantId)).flatMap((o) => o.photoIds);
        void deletePhotos(photoIds);
        mutate((d) => {
          const plantIds = new Set(d.plants.filter((p) => p.bedId === id).map((p) => p.id));
          return {
            ...d,
            beds: d.beds.filter((b) => b.id !== id),
            plants: d.plants.filter((p) => p.bedId !== id),
            observations: d.observations.filter((o) => o.bedId !== id && !(o.plantId && plantIds.has(o.plantId))),
            applications: d.applications.filter((a) => a.bedId !== id),
            water: d.water.filter((w) => w.bedId !== id),
            phenoEvents: d.phenoEvents.filter((e) => !plantIds.has(e.plantId)),
            treatments: d.treatments.filter((t) => t.bedId !== id && !(t.plantId && plantIds.has(t.plantId))),
          };
        });
      },
      savePlant: (plant) => mutate((d) => ({ ...d, plants: upsert(d.plants, plant) })),
      deletePlant: (id) => {
        void deletePhotos(data.observations.filter((o) => o.plantId === id).flatMap((o) => o.photoIds));
        mutate((d) => ({
          ...d,
          plants: d.plants.filter((p) => p.id !== id),
          observations: d.observations.filter((o) => o.plantId !== id),
          applications: d.applications.filter((a) => a.plantId !== id),
          phenoEvents: d.phenoEvents.filter((e) => e.plantId !== id),
          treatments: d.treatments.filter((t) => t.plantId !== id),
        }));
      },
      saveVarieties: (list) => mutate((d) => ({ ...d, varieties: list.reduce((acc, v) => upsert(acc, v), d.varieties) })),
      deleteVariety: (id) => mutate((d) => ({ ...d, varieties: d.varieties.filter((v) => v.id !== id), plants: d.plants.map((p) => (p.varietyId === id ? { ...p, varietyId: undefined } : p)) })),
      addObservation: async (obs, photos) => {
        const photoIds: string[] = [];
        const db = dbRef.current;
        for (const file of photos) {
          const c = await compressPhoto(file);
          const id = uid('ph');
          const rec: PhotoRecord = { id, meta: { id, date: obs.date, width: c.width, height: c.height }, full: c.full, thumb: c.thumb };
          if (db) await tx(db, PHOTOS, 'readwrite', (s) => s.put(rec));
          else {
            urlCache.current.set(`${id}:thumb`, URL.createObjectURL(c.thumb));
            urlCache.current.set(`${id}:full`, URL.createObjectURL(c.full));
          }
          photoIds.push(id);
        }
        mutate((d) => ({ ...d, observations: [...d.observations, { ...obs, id: uid('obs'), photoIds }] }));
      },
      deleteObservation: (id) => {
        const o = data.observations.find((x) => x.id === id);
        if (o) void deletePhotos(o.photoIds);
        mutate((d) => ({ ...d, observations: d.observations.filter((x) => x.id !== id) }));
      },
      addApplication: (app) => mutate((d) => ({ ...d, applications: [...d.applications, { ...app, id: uid('app') }] })),
      deleteApplication: (id) => mutate((d) => ({ ...d, applications: d.applications.filter((a) => a.id !== id) })),
      addWater: (e) => mutate((d) => ({ ...d, water: [...d.water, { ...e, id: uid('w') }] })),
      deleteWater: (id) => mutate((d) => ({ ...d, water: d.water.filter((w) => w.id !== id) })),
      saveTask: (t) => mutate((d) => ({ ...d, tasks: upsert(d.tasks, t) })),
      deleteTask: (id) => mutate((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),
      setTaskState: (s) => mutate((d) => ({ ...d, taskStates: [...d.taskStates.filter((x) => x.key !== s.key), s] })),
      photoURL: async (id, size) => {
        const key = `${id}:${size}`;
        const cached = urlCache.current.get(key);
        if (cached) return cached;
        const db = dbRef.current;
        if (!db) return null;
        const rec = await tx<PhotoRecord>(db, PHOTOS, 'readonly', (s) => s.get(id) as IDBRequest<PhotoRecord>).catch(() => undefined);
        if (!rec) return null;
        const url = URL.createObjectURL(size === 'thumb' ? rec.thumb : rec.full);
        urlCache.current.set(key, url);
        return url;
      },
      exportBackup: async () => {
        const db = dbRef.current;
        const photos: PhotoExport[] = [];
        if (db) {
          const all = (await tx<PhotoRecord[]>(db, PHOTOS, 'readonly', (s) => s.getAll() as IDBRequest<PhotoRecord[]>)) ?? [];
          for (const r of all) photos.push({ meta: r.meta, full: await blobToDataURL(r.full), thumb: await blobToDataURL(r.thumb) });
        }
        return serializeBackup(data, photos);
      },
      importBackup: async (raw) => {
        const parsed = parseBackup(raw);
        const db = dbRef.current;
        if (db) {
          await tx(db, PHOTOS, 'readwrite', (s) => s.clear());
          for (const p of parsed.photos) {
            const rec: PhotoRecord = { id: p.meta.id, meta: p.meta, full: await dataURLToBlob(p.full), thumb: await dataURLToBlob(p.thumb) };
            await tx(db, PHOTOS, 'readwrite', (s) => s.put(rec));
          }
        }
        urlCache.current.forEach((u) => URL.revokeObjectURL(u));
        urlCache.current.clear();
        mutate(() => ({ ...parsed.data, settings: { ...parsed.data.settings, onboarded: true } }));
      },
      loadDemo: () => mutate((d) => demoGarden(today, d)),
      resetAll: async () => {
        const db = dbRef.current;
        if (db) {
          await tx(db, PHOTOS, 'readwrite', (s) => s.clear());
          await tx(db, KV, 'readwrite', (s) => s.delete(DATA_KEY));
        }
        urlCache.current.forEach((u) => URL.revokeObjectURL(u));
        urlCache.current.clear();
        window.clearTimeout(saveTimer.current);
        saveTimer.current = undefined;
        latest.current = EMPTY_DATA;
        setData(EMPTY_DATA);
      },
      saveObstacle: (o) => mutate((d) => ({ ...d, obstacles: upsert(d.obstacles, o) })),
      deleteObstacle: (id) => mutate((d) => ({ ...d, obstacles: d.obstacles.filter((o) => o.id !== id) })),
      addPhenoEvent: (e) => mutate((d) => ({ ...d, phenoEvents: [...d.phenoEvents.filter((x) => !(x.plantId === e.plantId && x.stage === e.stage)), { ...e, id: uid('ph') }] })),
      deletePhenoEvent: (id) => mutate((d) => ({ ...d, phenoEvents: d.phenoEvents.filter((x) => x.id !== id) })),
      addTreatment: (t) => mutate((d) => ({ ...d, treatments: [...d.treatments, { ...t, id: uid('tr') }] })),
      deleteTreatment: (id) => mutate((d) => ({ ...d, treatments: d.treatments.filter((x) => x.id !== id) })),
      saveSeed: (lot) => mutate((d) => ({ ...d, seeds: upsert(d.seeds, lot) })),
      deleteSeed: (id) => mutate((d) => ({ ...d, seeds: d.seeds.filter((x) => x.id !== id) })),
      setPrice: (speciesId, priceKg) =>
        mutate((d) => {
          const prices = { ...d.prices };
          if (priceKg === undefined) delete prices[speciesId];
          else prices[speciesId] = priceKg;
          return { ...d, prices };
        }),
      refreshWeather,
      weatherBusy,
    }),
    [ready, volatile, data, today, mutate, deletePhotos, refreshWeather, weatherBusy],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useGarden(): GardenStore {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGarden hors de GardenProvider');
  return c;
}
