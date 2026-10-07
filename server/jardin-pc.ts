/**
 * Lignée Jardin — version ordinateur et relais de synchronisation.
 *
 * Lancement (depuis le dossier du projet) : npm run pc
 *
 * - sert l'application (dossier dist/) sur http://localhost:8787 : c'est la
 *   version ordinateur, à ouvrir dans le navigateur ;
 * - garde la copie de référence du jardin dans ~/.lignee-jardin/jardin.json
 *   et la fusionne avec celle de chaque appareil qui se synchronise
 *   (téléphone, navigateur du PC), fiche par fiche, la plus récente gagnant ;
 * - le téléphone s'y connecte par le Wi-Fi de la maison avec l'adresse et le
 *   code affichés au démarrage (et dans Réglages de la version ordinateur).
 *
 * Rien ne sort de la maison : pas de compte, pas de service en ligne.
 * Dépendances : Node ≥ 20 et tsx (déjà dans le projet).
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir, networkInterfaces } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { mergeSynced } from '../src/jardin/engine/sync';
import type { GardenData } from '../src/jardin/model';

const PORT = Number(process.env.JARDIN_PORT || 8787);
const DIR = process.env.JARDIN_DIR || join(homedir(), '.lignee-jardin');
const DIST = resolve(process.env.JARDIN_DIST || join(import.meta.dirname, '..', 'dist'));
const DATA_FILE = join(DIR, 'jardin.json');
const CONF_FILE = join(DIR, 'config.json');
/** Photos et notes vocales, une par fichier : ~/.lignee-jardin/photos/<id>.json. */
const PHOTO_DIR = join(DIR, 'photos');
const PHOTO_ID = /^[a-z]{1,8}-[a-z0-9]{1,16}-[a-z0-9]{1,16}$/i;
/** Taille maximale d'un envoi (jardin complet, sans les photos). */
const MAX_BODY = 30 * 1024 * 1024;

mkdirSync(DIR, { recursive: true });
mkdirSync(PHOTO_DIR, { recursive: true });

// Code d'appairage : créé au premier lancement, gardé ensuite.
const conf: { code: string } = existsSync(CONF_FILE) ? JSON.parse(readFileSync(CONF_FILE, 'utf8')) : { code: '' };
if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(conf.code)) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = randomBytes(8);
  const part = (o: number) => Array.from({ length: 4 }, (_, i) => abc[b[o + i] % abc.length]).join('');
  conf.code = `${part(0)}-${part(4)}`;
  writeFileSync(CONF_FILE, JSON.stringify(conf, null, 2));
}

let store: { rev: number; data: GardenData | null } = existsSync(DATA_FILE) ? JSON.parse(readFileSync(DATA_FILE, 'utf8')) : { rev: 0, data: null };

function save() {
  // Écriture atomique : fichier temporaire puis renommage.
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(store));
  renameSync(tmp, DATA_FILE);
}

/** Adresses du PC sur le réseau local (à saisir sur le téléphone). */
function lanUrls(): string[] {
  const out: string[] = [];
  for (const list of Object.values(networkInterfaces())) for (const a of list ?? []) if (a.family === 'IPv4' && !a.internal) out.push(`http://${a.address}:${PORT}`);
  return out;
}

const isLocal = (req: IncomingMessage) => {
  const ip = req.socket.remoteAddress ?? '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Jardin-Code', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
  res.end(json);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((ok, ko) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        ko(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => ok(Buffer.concat(chunks).toString('utf8')));
    req.on('error', ko);
  });
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://x');
  let file = normalize(join(DIST, decodeURIComponent(url.pathname)));
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'forbidden' });
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end("L'application n'est pas construite : lancez « npm run build » (ou « npm run pc »).");
  }
  const isHtml = file.endsWith('.html') || file.endsWith('sw.js');
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=31536000, immutable' });
  res.end(readFileSync(file));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  if (!url.pathname.startsWith('/api/sync')) return serveStatic(req, res);
  if (req.method === 'OPTIONS') return send(res, 204, {});
  // Le navigateur du PC (même machine) n'a pas besoin du code ; les autres appareils, si.
  const authed = isLocal(req) || req.headers['x-jardin-code'] === conf.code;
  try {
    if (url.pathname === '/api/sync/info') {
      return send(res, 200, { app: 'lignee-jardin-pc', version: 1, authed, rev: authed ? store.rev : undefined, ...(isLocal(req) ? { code: conf.code, urls: lanUrls() } : {}) });
    }
    if (!authed) return send(res, 401, { error: 'code' });
    if (url.pathname === '/api/sync/rev' && req.method === 'GET') return send(res, 200, { rev: store.rev });
    if (url.pathname === '/api/sync' && req.method === 'GET') return send(res, 200, { rev: store.rev, data: store.data });
    // Photos : liste, lecture, dépôt (le jardin ne contient que leurs identifiants).
    if (url.pathname === '/api/sync/photos' && req.method === 'GET') {
      return send(res, 200, { ids: readdirSync(PHOTO_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) });
    }
    if (url.pathname === '/api/sync/photo' && req.method === 'GET') {
      const id = url.searchParams.get('id') ?? '';
      if (!PHOTO_ID.test(id)) return send(res, 400, { error: 'id' });
      const f = join(PHOTO_DIR, `${id}.json`);
      if (!existsSync(f)) return send(res, 404, { error: 'not found' });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
      return res.end(readFileSync(f));
    }
    if (url.pathname === '/api/sync/photo' && req.method === 'POST') {
      const p = JSON.parse(await readBody(req)) as { meta?: { id?: string }; full?: string; thumb?: string };
      const id = p.meta?.id ?? '';
      if (!PHOTO_ID.test(id) || typeof p.full !== 'string' || typeof p.thumb !== 'string' || !p.full.startsWith('data:')) return send(res, 400, { error: 'photo' });
      const f = join(PHOTO_DIR, `${id}.json`);
      if (!existsSync(f)) {
        writeFileSync(`${f}.tmp`, JSON.stringify(p));
        renameSync(`${f}.tmp`, f);
        console.log(`${new Date().toLocaleTimeString('fr-FR')}  photo reçue (${id})`);
      }
      return send(res, 200, { ok: true });
    }
    if (url.pathname === '/api/sync' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as { data?: GardenData };
      const incoming = body.data;
      if (!incoming || typeof incoming !== 'object' || !Array.isArray(incoming.beds) || !Array.isArray(incoming.plants) || typeof incoming.settings !== 'object') return send(res, 400, { error: 'data' });
      const before = store.data ? JSON.stringify(store.data) : '';
      const merged = store.data ? mergeSynced(store.data, incoming).data : incoming;
      // Le relais ne garde pas les réglages propres à un appareil.
      const { sync: _s, author: _a, ...settings } = merged.settings;
      const next = { ...merged, settings: settings as GardenData['settings'] };
      if (JSON.stringify(next) !== before) {
        store = { rev: store.rev + 1, data: next };
        save();
        const who = (incoming.settings.author || req.socket.remoteAddress || '?').toString();
        console.log(`${new Date().toLocaleTimeString('fr-FR')}  jardin mis à jour par ${who} (version ${store.rev})`);
      }
      return send(res, 200, { rev: store.rev, data: store.data });
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 400, { error: String((e as Error).message || e) });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const urls = lanUrls();
  console.log('');
  console.log('  Lignée Jardin — version ordinateur');
  console.log('');
  console.log(`  Sur ce PC, ouvrez :      http://localhost:${PORT}`);
  console.log(`  Sur le téléphone, dans Réglages → Synchronisation avec le PC :`);
  console.log(`    adresse : ${urls[0] ?? `http://<adresse-du-PC>:${PORT}`}${urls.length > 1 ? `   (autres : ${urls.slice(1).join(', ')})` : ''}`);
  console.log(`    code    : ${conf.code}`);
  console.log('');
  console.log(`  Jardin enregistré dans ${DATA_FILE}${store.data ? ` (version ${store.rev})` : ' (vide pour l’instant)'}`);
  console.log('  Laissez cette fenêtre ouverte ; Ctrl + C pour arrêter.');
  console.log('');
});
