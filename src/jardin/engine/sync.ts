/**
 * Jardin partagé sans serveur (phase 3).
 *
 * Chaque enregistrement porte la date de sa dernière modification (`mod`)
 * et son auteur (`by`), posés automatiquement à chaque changement ; une
 * suppression laisse une trace (`deleted`). Deux copies d'un même jardin
 * se fusionnent alors fiche par fiche : la modification la plus récente
 * gagne, une suppression plus récente que la dernière modification
 * l'emporte. Les réglages restent ceux de l'appareil.
 *
 * Limite assumée (« dernière écriture gagnante ») : si deux personnes
 * modifient la même fiche entre deux échanges, la plus récente remplace
 * l'autre en entier ; les relevés de capteurs et les états de tâches,
 * eux, s'additionnent.
 */
import type { GardenData, Meta, Reading, TaskState } from '../model';

/** Collections d'enregistrements identifiés par `id`. */
export const COLLECTIONS = ['beds', 'plants', 'varieties', 'observations', 'applications', 'mulches', 'compost', 'rainTanks', 'water', 'tasks', 'obstacles', 'phenoEvents', 'treatments', 'seeds', 'sensors', 'tankChanges', 'soilTests', 'pestCounts', 'stocks', 'shopping'] as const;
export type CollectionKey = (typeof COLLECTIONS)[number];

type Rec = Meta & { id: string };

/** Les traces de suppression plus vieilles que cela sont oubliées. */
export const TOMBSTONE_DAYS = 400;

/**
 * Pose `mod`/`by` sur les enregistrements nouveaux ou modifiés (comparaison
 * par référence avec l'état précédent) et note les suppressions.
 */
export function stampChanges(prev: GardenData, next: GardenData, nowISO: string, by: string | undefined): GardenData {
  let out = next;
  let deleted = next.deleted;
  for (const key of COLLECTIONS) {
    const before = (prev[key] ?? []) as Rec[];
    const after = (next[key] ?? []) as Rec[];
    if (before === after) continue;
    const old = new Map(before.map((r) => [r.id, r]));
    let changed = false;
    const stamped = after.map((r) => {
      const o = old.get(r.id);
      if (o === r) return r;
      changed = true;
      return { ...r, mod: nowISO, by: by || r.by };
    });
    const kept = new Set(after.map((r) => r.id));
    for (const id of old.keys()) {
      if (!kept.has(id)) {
        if (deleted === next.deleted) deleted = { ...deleted };
        deleted[id] = nowISO;
      }
    }
    if (changed) out = { ...out, [key]: stamped };
  }
  if (prev.taskStates !== next.taskStates) {
    const old = new Set(prev.taskStates);
    out = { ...out, taskStates: next.taskStates.map((s) => (old.has(s) ? s : { ...s, mod: nowISO, by: by || s.by })) };
  }
  if (deleted !== next.deleted) out = { ...out, deleted };
  return out;
}

/** Oublie les traces de suppression trop anciennes. */
export function pruneDeleted(deleted: Record<string, string>, nowISO: string): Record<string, string> {
  const limit = Date.parse(nowISO) - TOMBSTONE_DAYS * 86_400_000;
  const out: Record<string, string> = {};
  for (const [id, at] of Object.entries(deleted)) if (Date.parse(at) >= limit) out[id] = at;
  return out;
}

export interface MergeStats {
  added: number;
  updated: number;
  removed: number;
  /** Fiches modifiées des deux côtés : la plus récente a été gardée. */
  conflicts: number;
}

const modOf = (r: Meta) => r.mod ?? '';

function mergeList<T extends Rec>(local: T[], remote: T[], deleted: Record<string, string>, stats: MergeStats): T[] {
  const byId = new Map(local.map((r) => [r.id, r]));
  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l) {
      byId.set(r.id, r);
      stats.added++;
    } else if (modOf(r) > modOf(l)) {
      byId.set(r.id, r);
      stats.updated++;
      if (l.by && r.by && l.by !== r.by) stats.conflicts++;
    }
  }
  const out: T[] = [];
  for (const r of byId.values()) {
    const del = deleted[r.id];
    if (del && del >= modOf(r)) {
      if (local.some((x) => x.id === r.id)) stats.removed++;
      continue;
    }
    out.push(r);
  }
  return out;
}

function mergeReadings(a: Record<string, Reading[]>, b: Record<string, Reading[]>): Record<string, Reading[]> {
  const out: Record<string, Reading[]> = { ...a };
  for (const [k, list] of Object.entries(b)) {
    const m = new Map((out[k] ?? []).map((r) => [r[0], r]));
    for (const r of list) if (!m.has(r[0])) m.set(r[0], r);
    out[k] = [...m.values()].sort((x, y) => x[0] - y[0]);
  }
  return out;
}

function mergeTaskStates(a: TaskState[], b: TaskState[]): TaskState[] {
  const m = new Map(a.map((s) => [s.key, s]));
  for (const s of b) {
    const l = m.get(s.key);
    if (!l || modOf(s) > modOf(l)) m.set(s.key, s);
  }
  return [...m.values()];
}

/** Fusionne une copie reçue dans le jardin local. */
export function mergeGardens(local: GardenData, remote: GardenData): { data: GardenData; stats: MergeStats } {
  const stats: MergeStats = { added: 0, updated: 0, removed: 0, conflicts: 0 };
  const deleted = { ...remote.deleted };
  for (const [id, at] of Object.entries(local.deleted)) if (!deleted[id] || at > deleted[id]) deleted[id] = at;
  let data: GardenData = { ...local, deleted };
  for (const key of COLLECTIONS) {
    data = { ...data, [key]: mergeList((local[key] ?? []) as Rec[], (remote[key] ?? []) as Rec[], deleted, stats) };
  }
  data.readings = mergeReadings(local.readings, remote.readings);
  data.taskStates = mergeTaskStates(local.taskStates, remote.taskStates);
  data.prices = { ...remote.prices, ...local.prices };
  // Météo : on garde le cache le plus récent s'il porte sur le même lieu.
  if (remote.weather && (!local.weather || remote.weather.fetchedAt > local.weather.fetchedAt) && local.settings.lat !== undefined && Math.abs(remote.weather.lat - local.settings.lat) < 0.05 && Math.abs(remote.weather.lon - (local.settings.lon ?? 0)) < 0.05) {
    data.weather = remote.weather;
  }
  return { data, stats };
}

/** Photos référencées par un jardin (pour n'exporter que les siennes). */
export function photoIdsOf(data: GardenData): Set<string> {
  return new Set(data.observations.flatMap((o) => [...o.photoIds, ...(o.audioIds ?? [])]));
}
