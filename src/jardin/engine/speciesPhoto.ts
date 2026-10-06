/**
 * Photos des espèces du catalogue, prises sur Wikipédia / Wikimedia Commons
 * (images sous licence libre), téléchargées par l'appli quand elle a accès
 * à internet puis gardées sur l'appareil (hors ligne ensuite).
 *
 * Pour une espèce : on cherche la page Wikipédia (nom latin, puis nom
 * français, en français puis en anglais), on prend son image principale si
 * elle est sur Commons, on lit sur Commons l'auteur et la licence, et on
 * enregistre une vignette (≈ 640 px) avec son crédit.
 */
import type { Species } from '../model';

export interface PhotoCredit {
  author: string;
  license: string;
  licenseUrl?: string;
  /** Page de l'image sur Commons. */
  page: string;
  file: string;
}
export interface SpeciesPhoto {
  id: string;
  blob?: Blob;
  credit?: PhotoCredit;
  /** Pas d'image libre trouvée (on ne recherche pas à nouveau avant un mois). */
  none?: boolean;
  fetchedAt: number;
}

const DB = 'lignee-species-photos';
const STORE = 'p';
const RETRY_MS = 30 * 86_400_000;

function openDB(): Promise<IDBDatabase> {
  return new Promise((ok, ko) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => ko(req.error);
  });
}
let dbp: Promise<IDBDatabase> | null = null;
const db = () => (dbp ??= openDB());

async function get(id: string): Promise<SpeciesPhoto | undefined> {
  const d = await db();
  return new Promise((ok, ko) => {
    const r = d.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    r.onsuccess = () => ok(r.result as SpeciesPhoto | undefined);
    r.onerror = () => ko(r.error);
  });
}
async function put(p: SpeciesPhoto): Promise<void> {
  const d = await db();
  return new Promise((ok, ko) => {
    const t = d.transaction(STORE, 'readwrite');
    t.objectStore(STORE).put(p);
    t.oncomplete = () => ok();
    t.onerror = () => ko(t.error);
  });
}
/** Identifiants des espèces dont la photo est déjà sur l'appareil. */
export async function cachedIds(): Promise<Set<string>> {
  const d = await db();
  return new Promise((ok, ko) => {
    const r = d.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    r.onsuccess = () => ok(new Set((r.result as SpeciesPhoto[]).filter((p) => p.blob).map((p) => p.id)));
    r.onerror = () => ko(r.error);
  });
}
export async function clearPhotos(): Promise<void> {
  const d = await db();
  await new Promise<void>((ok, ko) => {
    const t = d.transaction(STORE, 'readwrite');
    t.objectStore(STORE).clear();
    t.oncomplete = () => ok();
    t.onerror = () => ko(t.error);
  });
  urls.clear();
}

// --- Recherche sur Wikipédia et Commons -----------------------------------------------

/** Titres à essayer : nom latin (genre et espèce), puis noms communs. */
export function titleCandidates(sp: Pick<Species, 'latin' | 'name'>): Array<{ wiki: 'fr' | 'en'; title: string }> {
  const latin = sp.latin
    .split(',')[0]
    .replace(/[×x]\s/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
  const out: Array<{ wiki: 'fr' | 'en'; title: string }> = [];
  const add = (wiki: 'fr' | 'en', title: string) => {
    const t = title.trim();
    if (t && !out.some((o) => o.wiki === wiki && o.title === t)) out.push({ wiki, title: t });
  };
  if (latin.includes(' ')) add('fr', latin);
  add('fr', sp.name.fr.split('(')[0].split(',')[0]);
  if (latin.includes(' ')) add('en', latin);
  add('en', sp.name.en.split('(')[0].split(',')[0]);
  if (!latin.includes(' ')) add('fr', latin);
  return out;
}

/** Nom de fichier Commons d'une URL d'image (vignette ou originale) ; null si l'image n'est pas sur Commons. */
export function commonsFile(url: string): string | null {
  const m = url.match(/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Texte d'un champ HTML de Commons (« <a …>Jean Dupont</a> » → « Jean Dupont »). */
export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type Fetcher = (url: string) => Promise<Response>;

async function findImage(sp: Pick<Species, 'latin' | 'name'>, f: Fetcher): Promise<{ file: string } | null> {
  for (const c of titleCandidates(sp)) {
    try {
      const r = await f(`https://${c.wiki}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(c.title.replace(/ /g, '_'))}`);
      if (!r.ok) continue;
      const j = (await r.json()) as { type?: string; originalimage?: { source?: string }; thumbnail?: { source?: string } };
      if (j.type === 'disambiguation') continue;
      const src = j.originalimage?.source ?? j.thumbnail?.source;
      const file = src ? commonsFile(src) : null;
      if (file) return { file };
    } catch {
      /* titre suivant */
    }
  }
  return null;
}

async function imageInfo(file: string, f: Fetcher): Promise<{ thumb: string; credit: PhotoCredit } | null> {
  const r = await f(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=640&titles=${encodeURIComponent(`File:${file}`)}`);
  if (!r.ok) return null;
  const j = (await r.json()) as { query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }> }> } };
  const info = Object.values(j.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  const license = stripHtml(meta.LicenseShortName?.value ?? '');
  // Commons n'accepte que des images libres ; on écarte quand même ce qui ne dit pas sa licence.
  if (!license) return null;
  return {
    thumb: info.thumburl ?? info.url ?? '',
    credit: { author: stripHtml(meta.Artist?.value ?? '') || 'Wikimedia Commons', license, licenseUrl: meta.LicenseUrl?.value, page: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`, file },
  };
}

/** Cherche et télécharge la photo d'une espèce (sans regarder le cache). */
export async function downloadPhoto(sp: Pick<Species, 'id' | 'latin' | 'name'>, f: Fetcher = (u) => fetch(u)): Promise<SpeciesPhoto> {
  const found = await findImage(sp, f);
  if (!found) return { id: sp.id, none: true, fetchedAt: Date.now() };
  const info = await imageInfo(found.file, f);
  if (!info?.thumb) return { id: sp.id, none: true, fetchedAt: Date.now() };
  const r = await f(info.thumb);
  if (!r.ok) throw new Error('image');
  return { id: sp.id, blob: await r.blob(), credit: info.credit, fetchedAt: Date.now() };
}

// --- Utilisation par l'interface ----------------------------------------------------------

const urls = new Map<string, string>();
const inflight = new Map<string, Promise<SpeciesPhoto | null>>();

export interface ShownPhoto {
  url: string;
  credit: PhotoCredit;
}

/** Photo déjà sur l'appareil (sans réseau). */
export async function cachedPhoto(id: string): Promise<ShownPhoto | null> {
  try {
    const p = await get(id);
    if (!p?.blob || !p.credit) return null;
    let url = urls.get(id);
    if (!url) {
      url = URL.createObjectURL(p.blob);
      urls.set(id, url);
    }
    return { url, credit: p.credit };
  } catch {
    return null;
  }
}

/** Photo d'une espèce : depuis l'appareil, sinon téléchargée (si internet). null si aucune. */
export async function speciesPhoto(sp: Pick<Species, 'id' | 'latin' | 'name'>): Promise<ShownPhoto | null> {
  const have = await cachedPhoto(sp.id);
  if (have) return have;
  try {
    const prev = await get(sp.id);
    if (prev?.none && Date.now() - prev.fetchedAt < RETRY_MS) return null;
  } catch {
    /* pas de cache */
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  let job = inflight.get(sp.id);
  if (!job) {
    job = downloadPhoto(sp)
      .then(async (p) => {
        await put(p).catch(() => {});
        return p;
      })
      .catch(() => null)
      .finally(() => inflight.delete(sp.id));
    inflight.set(sp.id, job);
  }
  await job;
  return cachedPhoto(sp.id);
}

/** Télécharge les photos manquantes de toute une liste (3 à la fois), avec suivi. */
export async function downloadAll(list: Array<Pick<Species, 'id' | 'latin' | 'name'>>, onProgress: (done: number, found: number) => void, signal?: { stop: boolean }): Promise<{ done: number; found: number }> {
  const have = await cachedIds().catch(() => new Set<string>());
  const todo = list.filter((s) => !have.has(s.id));
  let done = list.length - todo.length;
  let found = have.size;
  onProgress(done, found);
  let i = 0;
  const worker = async () => {
    while (i < todo.length && !signal?.stop) {
      const sp = todo[i++];
      const p = await speciesPhoto(sp).catch(() => null);
      done++;
      if (p) found++;
      onProgress(done, found);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return { done, found };
}
