/**
 * Tâches du jour, générées par des règles à partir de l'état du jardin.
 *
 * Chaque tâche a une clé stable (type + cible + période) : la marquer
 * faite ou la reporter s'enregistre sous cette clé, et la règle ne la
 * reproposera pas. Le nombre de tâches affichées est plafonné par l'écran
 * (pas de pluie de notifications).
 */
import { CLIMATES } from '../data/climate';
import type { GardenData, ISODate, Plant } from '../model';
import { addDays, dayOfYear, diffDays, weekKey } from './dates';
import { isActiveOn, speciesOf, stageInfo } from './crop';
import { nutrientStatus } from './nutrition';
import { waterAdvice } from './water';

export type TaskKind = 'sow' | 'plantOut' | 'transplant' | 'water' | 'feed' | 'harvest' | 'observe' | 'frost' | 'manual';

export interface Task {
  key: string;
  kind: TaskKind;
  due: ISODate;
  /** 1 = urgent, 3 = à l'occasion. */
  priority: 1 | 2 | 3;
  bedId?: string;
  plantId?: string;
  /** Valeurs à insérer dans le texte (litres, grammes, noms…). */
  vars: Record<string, string | number>;
  /** Tâche saisie à la main (sa clé est son id). */
  manualId?: string;
}

/** Jours d'avance avec lesquels une tâche datée apparaît. */
export const LOOKAHEAD = 3;
/** Nombre de jours sans observation avant de suggérer de passer voir une culture. */
export const OBSERVE_AFTER = 10;
/** Rappels « passer voir » proposés au plus par jour. */
export const MAX_OBSERVE = 2;
/** Pas de nouvel apport conseillé moins de N jours après le précédent sur la planche. */
export const FEED_SPACING = 10;
/** Seuil d'azote dû (g) en dessous duquel on ne dérange pas le jardinier. */
export const FEED_MIN_N = 2;

function plantLabel(p: Plant): string {
  return p.varietyName ? `${p.varietyName}` : '';
}

export function generateTasks(data: GardenData, today: ISODate): Task[] {
  const tasks: Task[] = [];
  const horizon = addDays(today, LOOKAHEAD);
  const bedOf = (id: string) => data.beds.find((b) => b.id === id);

  for (const p of data.plants) {
    const sp = speciesOf(p);
    const bed = bedOf(p.bedId);
    const base = { plantId: p.id, bedId: p.bedId, vars: { species: sp.id, variety: plantLabel(p), bed: bed?.name ?? '' } };

    if (p.status === 'planned') {
      if (p.sowDate <= horizon) {
        const planted = !sp.sowIndoor && !sp.sowOutdoor;
        tasks.push({ ...base, key: `sow:${p.id}`, kind: planted ? 'plantOut' : 'sow', due: p.sowDate, priority: p.sowDate <= today ? 1 : 2 });
      }
      continue;
    }
    if (p.status === 'ended') continue;

    const variety = p.varietyId ? data.varieties.find((v) => v.id === p.varietyId) : undefined;
    const info = stageInfo(p, today, variety);

    // Repiquage des semis faits à l'abri.
    if (p.indoor && !p.transplantDate && sp.transplantAfter) {
      const due = addDays(p.sowDate, Math.round(sp.transplantAfter * info.scale));
      if (due <= horizon) tasks.push({ ...base, key: `transplant:${p.id}`, kind: 'transplant', due, priority: due <= today ? 1 : 2 });
    }

    // Récolte : chaque semaine de la fenêtre de récolte.
    if (today >= addDays(info.harvestFrom, -LOOKAHEAD) && today <= info.harvestTo) {
      tasks.push({ ...base, key: `harvest:${p.id}:${weekKey(today)}`, kind: 'harvest', due: today < info.harvestFrom ? info.harvestFrom : today, priority: 2 });
    }

    // Fertilisation : seulement si la culture est en place et qu'il y a vraiment quelque chose à apporter.
    if (isActiveOn(p, today) && info.stage !== 'planned' && info.stage !== 'ended') {
      const status = nutrientStatus(p, data, today);
      const recent = data.applications.some((a) => a.bedId === p.bedId && diffDays(a.date, today) < FEED_SPACING && a.date <= today);
      if (!recent && !status.legume && status.dueNow.N >= FEED_MIN_N) {
        tasks.push({ ...base, key: `feed:${p.id}:${info.stage}`, kind: 'feed', due: today, priority: 2, vars: { ...base.vars, n: Math.round(status.dueNow.N), k: Math.round(status.dueNow.K2O) } });
      } else if (!recent && status.dueNow.K2O >= FEED_MIN_N * 2 && (status.legume || status.dueNow.N < FEED_MIN_N)) {
        tasks.push({ ...base, key: `feed:${p.id}:${info.stage}`, kind: 'feed', due: today, priority: 3, vars: { ...base.vars, n: Math.round(status.dueNow.N), k: Math.round(status.dueNow.K2O) } });
      }
    }

    // Passer voir la culture (photo, mesures) si rien n'a été noté depuis longtemps.
    const lastObs = data.observations.filter((o) => o.plantId === p.id).reduce<ISODate | null>((m, o) => (m && m > o.date ? m : o.date), null);
    const since = diffDays(lastObs ?? p.sowDate, today);
    if (since >= OBSERVE_AFTER) tasks.push({ ...base, key: `observe:${p.id}:${weekKey(today)}`, kind: 'observe', due: today, priority: 3, vars: { ...base.vars, days: since } });
  }

  // Arrosage, planche par planche.
  for (const bed of data.beds) {
    const adv = waterAdvice(bed, data, today);
    if (adv.water) tasks.push({ key: `water:${bed.id}:${today}`, kind: 'water', due: today, priority: 1, bedId: bed.id, vars: { bed: bed.name, liters: Math.max(1, Math.round(adv.liters)) } });
  }

  // Gelées tardives (climatologiques) : cultures frileuses déjà en place dehors.
  const clim = CLIMATES[data.settings.climate];
  const doy = dayOfYear(today);
  if (doy >= clim.lastFrost - 21 && doy <= clim.lastFrost + 10) {
    const tender = data.plants.filter((p) => {
      const bed = bedOf(p.bedId);
      return isActiveOn(p, today) && speciesOf(p).frost === 'tender' && bed && bed.kind !== 'greenhouse';
    });
    if (tender.length) {
      tasks.push({ key: `frost:${weekKey(today)}`, kind: 'frost', due: today, priority: 1, vars: { count: tender.length, species: speciesOf(tender[0]).id } });
    }
  }

  // Tâches saisies à la main.
  for (const t of data.tasks) {
    if (t.done || t.due > horizon) continue;
    tasks.push({ key: t.id, manualId: t.id, kind: 'manual', due: t.due, priority: t.due < today ? 1 : 2, bedId: t.bedId, plantId: t.plantId, vars: { title: t.title } });
  }

  // Pas plus de deux rappels « passer voir » par jour : les plus anciens d'abord.
  const observe = tasks.filter((t) => t.kind === 'observe').sort((x, y) => Number(y.vars.days) - Number(x.vars.days));
  const dropped = new Set(observe.slice(MAX_OBSERVE).map((t) => t.key));

  const states = new Map(data.taskStates.map((s) => [s.key, s]));
  return tasks
    .filter((t) => !dropped.has(t.key))
    .filter((t) => {
      const s = states.get(t.key);
      if (!s) return true;
      if (s.done) return false;
      return !(s.snoozeUntil && s.snoozeUntil > today);
    })
    .sort((a, b) => a.priority - b.priority || a.due.localeCompare(b.due) || a.key.localeCompare(b.key));
}
