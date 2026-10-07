/**
 * Synchronisation automatique avec la version ordinateur (server/jardin-pc.ts).
 *
 * - Dans le navigateur du PC, quand l'app est servie par « npm run pc »,
 *   la synchronisation démarre seule (même machine, pas de code).
 * - Sur le téléphone (ou un autre ordinateur), on saisit dans Réglages
 *   l'adresse du PC et son code.
 *
 * Toutes les 3 secondes (app au premier plan) : si l'on a modifié quelque
 * chose ici, on envoie le jardin, le PC fusionne et renvoie sa copie qu'on
 * fusionne à son tour ; sinon on demande seulement au PC s'il a du nouveau.
 * Hors du Wi-Fi de la maison, l'app continue de fonctionner normalement et
 * rattrape au retour. Les photos et notes vocales suivent ensuite, quelques-unes
 * à la fois (toutes les 15 s), dans les deux sens.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { GardenData } from './model';
import type { PhotoExport } from './engine/backup';
import { photoIdsOf } from './engine/sync';
import { useGarden } from './store';

export type SyncState = 'off' | 'connecting' | 'ok' | 'offline' | 'auth' | 'error' | 'otherGarden';
export interface SyncStatus {
  /** pc : cette fenêtre est servie par le PC ; remote : connexion à un PC distant (téléphone). */
  mode: 'off' | 'pc' | 'remote';
  state: SyncState;
  /** Dernier échange réussi (ms). */
  lastAt?: number;
  /** Photos encore à échanger avec le PC. */
  photosPending?: number;
  /** Sur le PC : adresses et code à saisir sur le téléphone. */
  info?: { code: string; urls: string[] };
}

const INTERVAL = 3000;
/** Échange des photos : au plus toutes les 15 s, 6 photos par passage. */
const PHOTO_INTERVAL = 15000;
const PHOTO_BATCH = 6;
const PC_GARDEN_KEY = 'lignee.jardin.pcSyncGarden';

let status: SyncStatus = { mode: 'off', state: 'off' };
const listeners = new Set<() => void>();
function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  for (const l of listeners) l();
}
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
  );
}

/** Normalise l'adresse saisie : « 192.168.1.20 » → « http://192.168.1.20:8787 ». */
export function normalizeUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, '');
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  try {
    const p = new URL(u);
    if (!p.port && p.protocol === 'http:') p.port = '8787';
    return p.origin;
  } catch {
    return u;
  }
}

type Res = { status: number; json: unknown };
class Offline extends Error {}

async function call(base: string, code: string, method: 'GET' | 'POST', path: string, body?: unknown): Promise<Res> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (code) headers['X-Jardin-Code'] = code;
  try {
    if (Capacitor.isNativePlatform()) {
      // Requête native : le téléphone parle au PC en http sur le réseau local.
      const r = await CapacitorHttp.request({ url: base + path, method, headers, data: body, connectTimeout: 5000, readTimeout: 30000, responseType: 'json' });
      return { status: r.status, json: typeof r.data === 'string' ? JSON.parse(r.data || 'null') : r.data };
    }
    const ctl = new AbortController();
    const t = window.setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal, cache: 'no-store' });
      const text = await r.text();
      let json: unknown = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      return { status: r.status, json };
    } finally {
      window.clearTimeout(t);
    }
  } catch {
    throw new Offline();
  }
}

/** Le PC qui sert cette page répond-il (version ordinateur) ? */
async function probePC(): Promise<{ code: string; urls: string[] } | null> {
  if (Capacitor.isNativePlatform() || !/^https?:$/.test(location.protocol)) return null;
  try {
    const r = await call('', '', 'GET', '/api/sync/info');
    const j = r.json as { app?: string; authed?: boolean; code?: string; urls?: string[] } | null;
    if (r.status === 200 && j?.app === 'lignee-jardin-pc' && j.authed) return { code: j.code ?? '', urls: j.urls ?? [] };
  } catch {
    /* pas de PC */
  }
  return null;
}

/** Essaie une connexion (bouton « Connecter » des Réglages). */
export async function testConnection(url: string, code: string): Promise<'ok' | 'offline' | 'auth' | 'notPc'> {
  try {
    const r = await call(normalizeUrl(url), code.trim().toUpperCase(), 'GET', '/api/sync/info');
    const j = r.json as { app?: string; authed?: boolean } | null;
    if (r.status !== 200 || j?.app !== 'lignee-jardin-pc') return 'notPc';
    return j.authed ? 'ok' : 'auth';
  } catch {
    return 'offline';
  }
}

let kick: (() => void) | null = null;
/** Synchroniser tout de suite (bouton des Réglages). */
export function syncNow() {
  kick?.();
}

/** À appeler une fois, en haut de l'app : tient le jardin synchronisé avec le PC. */
export function useRemoteSync() {
  const store = useGarden();
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  });
  const cfg = store.data.settings.sync;
  const url = cfg?.url ? normalizeUrl(cfg.url) : '';
  const code = cfg?.code?.trim().toUpperCase() ?? '';
  const { ready } = store;
  const garden = store.activeGarden;

  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    let timer: number | undefined;
    let base: string | null = null;
    let pushed = -1;
    let rev = -1;
    let busy = false;
    let pcMode = false;

    const tick = async () => {
      if (stopped || busy || base === null || document.visibilityState === 'hidden') return;
      const s = storeRef.current;
      if (pcMode) {
        // Version ordinateur : un seul jardin synchronisé (le premier ouvert).
        let bound: string | null = null;
        try {
          bound = localStorage.getItem(PC_GARDEN_KEY);
          if (!bound) localStorage.setItem(PC_GARDEN_KEY, s.activeGarden);
        } catch {
          /* stockage indisponible */
        }
        if (bound && bound !== s.activeGarden) return setStatus({ state: 'otherGarden' });
      }
      busy = true;
      try {
        const edits = s.syncEdits();
        if (edits !== pushed) {
          const r = await call(base, code, 'POST', '/api/sync', { data: s.syncSnapshot() });
          if (r.status === 401) return setStatus({ state: 'auth' });
          const j = r.json as { rev: number; data: GardenData | null } | null;
          if (r.status !== 200 || !j) return setStatus({ state: 'error' });
          pushed = edits;
          rev = j.rev;
          if (j.data) storeRef.current.syncApply(j.data);
        } else {
          const r = await call(base, code, 'GET', '/api/sync/rev');
          if (r.status === 401) return setStatus({ state: 'auth' });
          const j = r.json as { rev: number } | null;
          if (r.status !== 200 || !j) return setStatus({ state: 'error' });
          if (j.rev !== rev) {
            const full = await call(base, code, 'GET', '/api/sync');
            const fj = full.json as { rev: number; data: GardenData | null } | null;
            if (full.status !== 200 || !fj) return setStatus({ state: 'error' });
            rev = fj.rev;
            if (fj.data) storeRef.current.syncApply(fj.data);
          }
        }
        setStatus({ state: 'ok', lastAt: Date.now() });
        void photoTick();
      } catch (e) {
        setStatus({ state: e instanceof Offline ? 'offline' : 'error' });
      } finally {
        busy = false;
      }
    };
    let photoAt = 0;
    let photoBusy = false;
    /** Envoie au PC les photos qu'il n'a pas, et récupère celles qui manquent ici. */
    const photoTick = async () => {
      if (stopped || photoBusy || base === null || Date.now() - photoAt < PHOTO_INTERVAL) return;
      photoBusy = true;
      photoAt = Date.now();
      try {
        const s = storeRef.current;
        const wanted = photoIdsOf(s.data);
        if (wanted.size === 0) return setStatus({ photosPending: 0 });
        const r = await call(base, code, 'GET', '/api/sync/photos');
        if (r.status !== 200) return;
        const remote = new Set(((r.json as { ids?: string[] } | null)?.ids ?? []).map(String));
        const local = await s.localPhotoIds();
        const up = [...wanted].filter((id) => local.has(id) && !remote.has(id));
        const down = [...wanted].filter((id) => !local.has(id) && remote.has(id));
        setStatus({ photosPending: up.length + down.length });
        for (const id of up.slice(0, PHOTO_BATCH)) {
          const p = await s.readPhoto(id);
          if (p) await call(base, code, 'POST', '/api/sync/photo', p);
        }
        for (const id of down.slice(0, PHOTO_BATCH)) {
          const g = await call(base, code, 'GET', `/api/sync/photo?id=${encodeURIComponent(id)}`);
          const p = g.json as PhotoExport | null;
          if (g.status === 200 && p?.meta?.id === id && typeof p.full === 'string') await storeRef.current.writePhoto(p);
        }
        const left = Math.max(0, up.length - PHOTO_BATCH) + Math.max(0, down.length - PHOTO_BATCH);
        setStatus({ photosPending: left });
        // Il en reste : on enchaîne sans attendre 15 s.
        if (left > 0) photoAt = 0;
      } catch {
        /* réessai au prochain passage */
      } finally {
        photoBusy = false;
      }
    };
    const loop = () => {
      void tick().finally(() => {
        if (!stopped) timer = window.setTimeout(loop, INTERVAL);
      });
    };
    const onVisible = () => document.visibilityState === 'visible' && void tick();
    kick = () => {
      pushed = -1;
      photoAt = 0;
      void tick();
    };

    void (async () => {
      const pc = await probePC();
      if (stopped) return;
      if (pc) {
        pcMode = true;
        base = '';
        setStatus({ mode: 'pc', state: 'connecting', info: pc });
      } else if (url) {
        base = url;
        setStatus({ mode: 'remote', state: 'connecting', info: undefined });
      } else {
        setStatus({ mode: 'off', state: 'off', info: undefined });
        return;
      }
      document.addEventListener('visibilitychange', onVisible);
      loop();
    })();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      kick = null;
    };
  }, [ready, url, code, garden]);
}
