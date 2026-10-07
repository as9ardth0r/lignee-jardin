import { MUSHROOM_BY_ID } from './data/mushrooms';
import type { Task } from './engine/tasks';
import { PRODUCT_BY_ID } from './data/products';
import { PROBLEM_BY_ID } from './data/problems';
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
  if (task.kind === 'pest') {
    const where = species || String(task.vars.bed ?? '');
    return tt(`task.pest.${task.vars.what}` as JKey, { pest: PROBLEM_BY_ID[String(task.vars.pest)]?.name[lang] ?? '', where, value: task.vars.value, threshold: task.vars.threshold });
  }
  if (task.kind === 'raintank') return tt(Number(task.vars.days) >= 0 ? 'task.raintank.days' : 'task.raintank', { name: String(task.vars.name ?? ''), pct: task.vars.pct, days: task.vars.days });
  if (task.kind === 'nursery') return tt(`task.nursery.${task.vars.what}` as JKey, { name, bed: String(task.vars.bed ?? ''), days: task.vars.days, tmin: task.vars.tmin });
  if (task.kind === 'mushroom') {
    const m = MUSHROOM_BY_ID[String(task.vars.mush)];
    const mname = `${m?.name[lang] ?? ''}${task.vars.strain ? ` · ${task.vars.strain}` : ''}`;
    return tt((task.vars.what === 'water' && Number(task.vars.liters) > 0 ? 'task.mush.waterL' : `task.mush.${task.vars.what}`) as JKey, { name: mname, stage: tt(`mush.stage.${task.vars.stage}` as JKey), qty: task.vars.qty, days: m?.restDays ?? 0, liters: task.vars.liters });
  }
  if (task.kind === 'compost') return tt(`task.compost.${task.vars.what}` as JKey, { name: String(task.vars.name ?? '') });
  if (task.kind === 'lime') {
    return tt('task.lime', { ...task.vars, product: PRODUCT_BY_ID[String(task.vars.product)]?.name[lang] ?? '', total: fmtNum(Number(task.vars.total), lang, 1) });
  }
  return tt(`task.${task.kind}` as JKey, { ...task.vars, name, species });
}
