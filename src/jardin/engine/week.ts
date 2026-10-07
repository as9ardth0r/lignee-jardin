/**
 * « Cette semaine au jardin » : sur les 7 prochains jours, ce qu'il y a à
 * faire (tâches), à semer avec les graines qu'on a, à récolter, les fruits
 * de saison au verger, le temps annoncé et les travaux du mois.
 */
import { SPECIES_BY_ID } from '../data/species';
import { ORCHARD_MONTHS } from '../data/orchard';
import type { GardenData, ISODate } from '../model';
import { cropCalendar, inWindow, isActiveOn } from './crop';
import { addDays, monthOf, yearOf } from './dates';
import { timeline } from './phenology';
import { seedState } from './season';
import { generateTasks, type Task } from './tasks';

export interface WeekSow {
  speciesId: string;
  how: 'indoor' | 'outdoor';
  variety?: string;
  /** Lot ancien : semer plus dense. */
  old?: boolean;
}
export interface WeekPlan {
  from: ISODate;
  to: ISODate;
  tasks: Task[];
  sow: WeekSow[];
  harvest: Array<{ plantId: string; speciesId: string }>;
  orchard: string[];
  frost?: { date: ISODate; tmin: number };
  rainMm?: number;
  hot?: { date: ISODate; tmax: number };
  month: number;
}

export function weekPlan(data: GardenData, today: ISODate): WeekPlan {
  const to = addDays(today, 6);
  const month = monthOf(today);
  // Tâches : celles d'aujourd'hui et celles qui tombent dans la semaine (calculées jour par jour).
  const byKey = new Map<string, Task>();
  // Une même action (arroser telle planche…) n'apparaît qu'une fois, à sa première date.
  const same = (t: Task) => `${t.kind}|${t.bedId ?? ''}|${t.plantId ?? ''}|${t.mushId ?? ''}|${t.manualId ?? ''}|${t.vars.what ?? ''}|${t.vars.alert ?? ''}`;
  for (let i = 0; i < 7; i += 3) for (const t of generateTasks(data, addDays(today, i))) if (t.due <= to && !byKey.has(same(t)) && t.kind !== 'observe') byKey.set(same(t), t);
  const tasks = [...byKey.values()].sort((a, b) => a.due.localeCompare(b.due) || a.priority - b.priority);

  // À semer : espèces dont on a des graines encore bonnes, dans leur fenêtre de semis, pas déjà semées cette saison.
  const year = yearOf(today);
  const started = new Set(data.plants.filter((p) => p.status !== 'ended' && yearOf(p.sowDate) === year).map((p) => p.speciesId));
  const sow: WeekSow[] = [];
  const seen = new Set<string>();
  for (const lot of [...data.seeds].sort((a, b) => b.year - a.year)) {
    const sp = SPECIES_BY_ID[lot.speciesId];
    if (!sp || seen.has(sp.id) || started.has(sp.id)) continue;
    const cal = cropCalendar(sp, data.settings.climate);
    const how = inWindow(month, cal.sowOutdoor) ? 'outdoor' : inWindow(month, cal.sowIndoor) ? 'indoor' : null;
    if (!how) continue;
    seen.add(sp.id);
    sow.push({ speciesId: sp.id, how, variety: lot.varietyName, old: seedState(lot, today).state === 'old' });
  }

  // À récolter : cultures en place dont la fenêtre de récolte croise la semaine.
  const harvest: WeekPlan['harvest'] = [];
  for (const p of data.plants) {
    if (p.status !== 'growing' || !isActiveOn(p, today)) continue;
    const sp = SPECIES_BY_ID[p.speciesId];
    if (!sp || sp.type === 'orchard' || sp.type === 'cover') continue;
    const t = timeline(p, data, today);
    if (t.harvestFrom <= to && t.harvestTo >= today) harvest.push({ plantId: p.id, speciesId: p.speciesId });
  }

  // Verger : fruitiers plantés dont c'est le mois de récolte.
  const orchard = [...new Set(data.plants.filter((p) => p.status === 'growing' && SPECIES_BY_ID[p.speciesId]?.type === 'orchard' && ORCHARD_MONTHS[p.speciesId] && inWindow(month, [ORCHARD_MONTHS[p.speciesId]])).map((p) => p.speciesId))];

  // Météo annoncée.
  const days = (data.weather?.days ?? []).filter((d) => d.date >= today && d.date <= to);
  const cold = days.filter((d) => d.tmin <= 1).sort((a, b) => a.tmin - b.tmin)[0];
  const heat = days.filter((d) => d.tmax >= 30).sort((a, b) => b.tmax - a.tmax)[0];
  return {
    from: today,
    to,
    tasks,
    sow,
    harvest,
    orchard,
    frost: cold ? { date: cold.date, tmin: cold.tmin } : undefined,
    hot: heat ? { date: heat.date, tmax: heat.tmax } : undefined,
    rainMm: days.length ? days.reduce((s, d) => s + d.rain, 0) : undefined,
    month,
  };
}
