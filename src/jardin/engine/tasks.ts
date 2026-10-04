/**
 * Tâches du jour, générées par des règles à partir de l'état du jardin.
 *
 * Chaque tâche a une clé stable (type + cible + période) : la marquer
 * faite ou la reporter s'enregistre sous cette clé, et la règle ne la
 * reproposera pas. Le nombre de tâches affichées est plafonné par l'écran
 * (pas de pluie de notifications).
 */
import { lowTanks } from './rainTank';
import { compostTasks } from './compost';
import { CLIMATES } from '../data/climate';
import type { GardenData, ISODate, Plant } from '../model';
import { addDays, dayOfYear, diffDays, weekKey } from './dates';
import { isActiveOn, speciesOf } from './crop';
import { timeline } from './phenology';
import { weatherAlerts, type AlertKind } from './weather';
import { nutrientStatus } from './nutrition';
import { waterAdvice } from './water';
import { readingDate, tankStatus } from './sensors';
import { limeAdvice, limeSeason, soilFor } from './soil';
import { pestTasks } from './pests';
import { FLOWER_INFO } from '../data/flowers';

export type TaskKind = 'sow' | 'plantOut' | 'transplant' | 'water' | 'feed' | 'harvest' | 'bloom' | 'lift' | 'observe' | 'frost' | 'alert' | 'tank' | 'lime' | 'pest' | 'manual' | 'cover' | 'compost' | 'raintank';

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

    const info = timeline(p, data, today);

    // Repiquage des semis faits à l'abri.
    if (p.indoor && !p.transplantDate && sp.transplantAfter) {
      const due = addDays(p.sowDate, Math.round(sp.transplantAfter * info.scale));
      if (due <= horizon) tasks.push({ ...base, key: `transplant:${p.id}`, kind: 'transplant', due, priority: due <= today ? 1 : 2 });
    }

    const fl = sp.type === 'flower' ? FLOWER_INFO[sp.id] : undefined;
    if (sp.type === 'cover') {
      // Engrais vert : à faucher dans sa fenêtre de destruction (avant la montée en graines).
      if (today >= addDays(info.harvestFrom, -LOOKAHEAD) && today <= info.harvestTo) {
        tasks.push({ ...base, key: `cover:${p.id}:${weekKey(today)}`, kind: 'cover', due: today < info.harvestFrom ? info.harvestFrom : today, priority: today > addDays(info.harvestTo, -14) ? 1 : 2 });
      }
    } else if (!fl) {
      // Récolte : chaque semaine de la fenêtre de récolte.
      if (today >= addDays(info.harvestFrom, -LOOKAHEAD) && today <= info.harvestTo) {
        tasks.push({ ...base, key: `harvest:${p.id}:${weekKey(today)}`, kind: 'harvest', due: today < info.harvestFrom ? info.harvestFrom : today, priority: 2 });
      }
    } else if (fl.deadhead && today >= info.harvestFrom && today <= info.harvestTo) {
      // Fleurs : couper les fleurs fanées chaque semaine de la floraison.
      tasks.push({ ...base, key: `bloom:${p.id}:${weekKey(today)}`, kind: 'bloom', due: today, priority: 3 });
    }
    // Bulbes et tubercules gélifs : à rentrer avant les premières gelées.
    if (fl?.lift && isActiveOn(p, today)) {
      const clim = CLIMATES[data.settings.climate];
      const frostDay = clim.firstFrost;
      const doy = dayOfYear(today);
      if (doy >= frostDay - 21 && doy <= frostDay + 30 && diffDays(p.sowDate, today) > 60) {
        tasks.push({ ...base, key: `lift:${p.id}:${today.slice(0, 4)}`, kind: 'lift', due: today, priority: doy >= frostDay - 7 ? 1 : 2 });
      }
    }

    // Fertilisation : seulement si la culture est en place et qu'il y a vraiment quelque chose à apporter.
    if (isActiveOn(p, today) && info.stage !== 'planned' && info.stage !== 'ended' && sp.type !== 'cover') {
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

  // Bacs hydroponiques : EC et pH hors cible, solution à renouveler.
  for (const bed of data.beds) {
    if (bed.kind !== 'hydro') continue;
    const st = tankStatus(bed.id, data, today);
    for (const m of ['ec', 'ph'] as const) {
      const r = st[m];
      const range = st.target?.[m];
      if (r && range && r.state !== 'ok' && diffDays(readingDate(r.t), today) <= 3) {
        tasks.push({ key: `tank:${bed.id}:${m}:${r.t}`, kind: 'tank', due: today, priority: 1, bedId: bed.id, vars: { bed: bed.name, what: `${m}${r.state === 'low' ? 'Low' : 'High'}`, value: r.value, lo: range[0], hi: range[1] } });
      }
    }
    if (st.renewDue) tasks.push({ key: `tank:${bed.id}:renew:${st.lastChange ?? 'none'}`, kind: 'tank', due: today, priority: 2, bedId: bed.id, vars: { bed: bed.name, what: 'renew', days: st.daysSinceChange ?? 0 } });
  }

  // Chaulage conseillé par une analyse de sol, en saison (octobre à mars).
  if (limeSeason(today)) {
    const done = new Set<string>();
    for (const bed of data.beds) {
      if (bed.kind === 'hydro' || bed.kind === 'pot') continue;
      const reading = soilFor(data, bed.id);
      const adv = limeAdvice(reading, data, bed);
      if (!adv || !reading) continue;
      const key = `lime:${bed.id}:${reading.test.id}:${today.slice(0, 4)}`;
      if (done.has(key)) continue;
      done.add(key);
      tasks.push({ key, kind: 'lime', due: today, priority: 3, bedId: bed.id, vars: { bed: bed.name, grams: Math.round(adv.productPerM2 / 10) * 10, product: adv.product.id, total: Math.round(adv.productTotal / 100) / 10 } });
    }
  }

  // Comptages de ravageurs : intervenir au-delà du seuil, ou recompter.
  for (const t of pestTasks(data, today)) {
    const p = t.plantId ? data.plants.find((x) => x.id === t.plantId) : undefined;
    tasks.push({ key: t.key, kind: 'pest', due: t.due, priority: t.priority, plantId: t.plantId, bedId: t.bedId ?? p?.bedId, vars: { what: t.advice, pest: t.pestId, species: p?.speciesId ?? '', bed: bedOf(t.bedId ?? p?.bedId ?? '')?.name ?? '', value: t.value, threshold: t.threshold } });
  }

  // Alertes météo (prévisions locales) : gel, canicule, vent, forte pluie.
  const weatherOn = data.settings.weather && !!data.weather;
  if (weatherOn) {
    for (const a of weatherAlerts(data.weather, today)) {
      const affected = data.plants.filter((p) => {
        if (!isActiveOn(p, a.date)) return false;
        const bed = bedOf(p.bedId);
        const outdoor = bed?.kind !== 'greenhouse' && bed?.kind !== 'hydro';
        const sp = speciesOf(p);
        if (a.kind === 'frost') return outdoor && (sp.frost === 'tender' || (sp.frost === 'half' && a.value <= -3));
        if (a.kind === 'rain' || a.kind === 'wind') return outdoor;
        return true;
      });
      if (!affected.length) continue;
      tasks.push({
        key: `alert:${a.kind}:${a.date}`,
        kind: 'alert',
        due: a.date,
        priority: a.severe || a.kind === 'frost' ? 1 : 2,
        vars: { alert: a.kind as AlertKind, value: Math.round(a.value), date: a.date, count: affected.length, species: speciesOf(affected[0]).id },
      });
    }
  }

  // Sans météo locale : gelées tardives climatologiques, cultures frileuses déjà en place dehors.
  const clim = CLIMATES[data.settings.climate];
  const doy = dayOfYear(today);
  if (!weatherOn && doy >= clim.lastFrost - 21 && doy <= clim.lastFrost + 10) {
    const tender = data.plants.filter((p) => {
      const bed = bedOf(p.bedId);
      return isActiveOn(p, today) && speciesOf(p).frost === 'tender' && bed && bed.kind !== 'greenhouse' && bed.kind !== 'hydro';
    });
    if (tender.length) {
      tasks.push({ key: `frost:${weekKey(today)}`, kind: 'frost', due: today, priority: 1, vars: { count: tender.length, species: speciesOf(tender[0]).id } });
    }
  }

  // Tâches saisies à la main.
  // Récupérateurs d'eau presque vides.
  for (const { tank, status } of lowTanks(data, today)) {
    tasks.push({ key: `raintank:${tank.id}:${today}`, kind: 'raintank', due: today, priority: 2, vars: { name: tank.name, pct: Math.round(status.ratio * 100), days: status.daysLeft ?? -1 } });
  }

  // Compost : retourner, rééquilibrer, tamiser quand c'est mûr.
  for (const c of compostTasks(data, today)) {
    tasks.push({ key: `compost:${c.heapId}:${c.what}:${c.what === 'ready' ? 'once' : weekKey(today)}`, kind: 'compost', due: today, priority: c.what === 'ready' ? 2 : 3, vars: { name: c.name, what: c.what } });
  }

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
