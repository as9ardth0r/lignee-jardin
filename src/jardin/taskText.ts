import type { Task } from './engine/tasks';
import { fmtDate, fmtNum, speciesName } from './format';
import type { JKey, TT } from './i18n';

/** Texte d'une tâche (écran Aujourd'hui, notifications, rapports). */
export function taskText(task: Task, tt: TT, lang: 'fr' | 'en'): string {
  const species = typeof task.vars.species === 'string' ? speciesName(task.vars.species, lang) : '';
  const name = task.vars.variety ? `${species} · ${task.vars.variety}` : species;
  if (task.kind === 'alert') {
    return tt(`task.alert.${task.vars.alert}` as JKey, { ...task.vars, value: task.vars.value, date: fmtDate(String(task.vars.date), lang), species, count: task.vars.count });
  }
  if (task.kind === 'tank') {
    const n = (x: string | number | undefined, d = 1) => (typeof x === 'number' ? fmtNum(x, lang, d) : String(x ?? ''));
    return tt(`task.tank.${task.vars.what}` as JKey, { ...task.vars, value: n(task.vars.value), lo: n(task.vars.lo), hi: n(task.vars.hi) });
  }
  return tt(`task.${task.kind}` as JKey, { ...task.vars, name, species });
}
