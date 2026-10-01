/**
 * Notifications locales (phase 3) : ce qu'il faut programmer pour les trois
 * prochains jours, plafonné par jour. Aucun serveur : le téléphone les
 * déclenche lui-même, même app fermée (APK) ; dans un navigateur, seulement
 * tant que l'app est ouverte.
 *
 *  - résumé du matin à l'heure choisie (s'il y a quelque chose à faire) ;
 *  - alerte la veille à 18 h pour un gel ou un épisode sévère annoncé ;
 *  - rappel de sauvegarde si la dernière date de plus de 30 jours.
 */
import type { GardenData, ISODate } from '../model';
import { addDays, diffDays } from './dates';
import { generateTasks, type Task } from './tasks';

export const NOTIFY_DAYS = 3;
export const EVENING_HOUR = 18;
export const BACKUP_EVERY_DAYS = 30;

export type NotificationKind = 'morning' | 'alert' | 'backup';

export interface PlannedNotification {
  /** Identifiant entier stable (exigé par Android), dérivé de `key`. */
  id: number;
  key: string;
  kind: NotificationKind;
  at: Date;
  /** Tâches résumées (matin) ou alerte concernée. */
  tasks: Task[];
  /** Pour le rappel de sauvegarde : jours depuis la dernière (ou -1 si jamais). */
  days?: number;
}

/** Hachage 31 bits d'une clé (identifiants de notification stables). */
export function notificationId(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 1) || 1;
}

function localISO(d: Date): ISODate {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function at(date: ISODate, hour: number): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour, 0, 0);
}

const PRIORITY: Record<NotificationKind, number> = { alert: 0, morning: 1, backup: 2 };

export function planNotifications(data: GardenData, now: Date): PlannedNotification[] {
  const s = data.settings;
  if (!s.notify) return [];
  const today = localISO(now);
  const out: PlannedNotification[] = [];
  const push = (key: string, kind: NotificationKind, when: Date, tasks: Task[], days?: number) => {
    if (when.getTime() <= now.getTime()) return;
    out.push({ id: notificationId(key), key, kind, at: when, tasks, days });
  };

  for (let i = 0; i < NOTIFY_DAYS; i++) {
    const day = addDays(today, i);
    const tasks = generateTasks(data, day).filter((t) => t.due <= day);
    if (tasks.length) push(`morning:${day}`, 'morning', at(day, s.notifyHour), tasks);
  }

  // Gel et épisodes sévères : prévenir la veille au soir.
  const alerts = generateTasks(data, today).filter((t) => t.kind === 'alert' && t.priority === 1);
  for (const a of alerts) {
    const eve = addDays(String(a.vars.date), -1);
    push(`alert:${a.key}`, 'alert', at(eve, EVENING_HOUR), [a]);
  }

  const since = s.lastBackup ? diffDays(s.lastBackup, today) : -1;
  if ((since < 0 && data.plants.length + data.observations.length > 0) || since >= BACKUP_EVERY_DAYS) {
    // Un rappel par semaine au plus : la clé change chaque semaine.
    const week = Math.floor(now.getTime() / (7 * 86_400_000));
    const day = addDays(today, at(today, s.notifyHour + 1) > now ? 0 : 1);
    push(`backup:${week}`, 'backup', at(day, s.notifyHour + 1), [], since);
  }

  // Plafond quotidien : les alertes d'abord, puis le résumé, puis le rappel.
  const byDay = new Map<string, PlannedNotification[]>();
  for (const n of out) {
    const d = localISO(n.at);
    byDay.set(d, [...(byDay.get(d) ?? []), n]);
  }
  const max = Math.max(1, s.notifyMax);
  return [...byDay.values()]
    .flatMap((l) => l.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || a.at.getTime() - b.at.getTime()).slice(0, max))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}
