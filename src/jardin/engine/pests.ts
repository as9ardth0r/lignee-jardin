/**
 * Comptages de ravageurs et auxiliaires (phase 4, lutte intégrée) :
 * on compte, on compare à un seuil, on regarde la tendance et la
 * présence d'auxiliaires avant de traiter.
 *
 * Seuils : ORDRES DE GRANDEUR pour un potager (repris des fiches de
 * protection intégrée et des seuils indicatifs courants), à adapter : un
 * jardin vivrier tolère plus de dégâts qu'une culture vendue.
 */
import { PROBLEM_BY_ID } from '../data/problems';
import type { GardenData, ISODate, PestCount } from '../model';
import { addDays, diffDays } from './dates';

export type PestUnit = 'pctShoots' | 'pctLeaves' | 'perTrapWeek' | 'perTrap' | 'perPlant';

export interface PestRule {
  unit: PestUnit;
  /** Au-delà : intervenir (sauf auxiliaires au travail, pour les ravageurs qu'ils régulent). */
  threshold: number;
  /** Ravageur que les auxiliaires régulent bien : leur présence justifie d'attendre. */
  regulated: boolean;
}

export const PEST_RULES: Record<string, PestRule> = {
  aphids: { unit: 'pctShoots', threshold: 33, regulated: true },
  whitefly: { unit: 'perTrapWeek', threshold: 50, regulated: true },
  spiderMites: { unit: 'pctLeaves', threshold: 20, regulated: true },
  thrips: { unit: 'perTrapWeek', threshold: 50, regulated: true },
  fleaBeetle: { unit: 'pctLeaves', threshold: 10, regulated: false },
  slugs: { unit: 'perTrap', threshold: 4, regulated: false },
  caterpillars: { unit: 'perPlant', threshold: 1, regulated: false },
  coloradoBeetle: { unit: 'perPlant', threshold: 1, regulated: false },
};

export const BENEFICIALS = ['ladybird', 'lacewing', 'hoverfly', 'mummies', 'groundBeetle', 'predatoryMites', 'birds'] as const;
export type Beneficial = (typeof BENEFICIALS)[number];

/** Ravageurs comptables pour une culture (selon sa famille). */
export function countablePests(family?: string): string[] {
  return Object.keys(PEST_RULES).filter((id) => {
    const p = PROBLEM_BY_ID[id];
    return p && (!family || !p.hosts.length || p.hosts.includes(family as never));
  });
}

export type PestAdvice = 'act' | 'beneficials' | 'watch' | 'ok';

export interface PestStatus {
  pestId: string;
  rule: PestRule;
  last: PestCount;
  prev?: PestCount;
  trend: 'up' | 'down' | 'flat';
  over: boolean;
  advice: PestAdvice;
  series: PestCount[];
}

/** Comptages d'une culture (ou d'une planche), regroupés par ravageur. */
export function pestStatuses(counts: PestCount[], target: { plantId?: string; bedId?: string }): PestStatus[] {
  const mine = counts.filter((c) => (target.plantId ? c.plantId === target.plantId : c.bedId === target.bedId && !c.plantId));
  const byPest = new Map<string, PestCount[]>();
  for (const c of mine) byPest.set(c.pestId, [...(byPest.get(c.pestId) ?? []), c]);
  const out: PestStatus[] = [];
  for (const [pestId, list] of byPest) {
    const rule = PEST_RULES[pestId];
    if (!rule) continue;
    const series = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    const trend = !prev ? 'flat' : last.value > prev.value * 1.25 + 0.5 ? 'up' : last.value < prev.value * 0.8 - 0.5 ? 'down' : 'flat';
    // Pièges : une population qui double d'un relevé à l'autre compte comme un dépassement.
    const doubling = rule.unit === 'perTrapWeek' && !!prev && last.value >= 20 && last.value >= prev.value * 2;
    const over = last.value > rule.threshold || doubling;
    const helped = last.beneficials.length > 0 && rule.regulated && trend !== 'up';
    const advice: PestAdvice = over ? (helped ? 'beneficials' : 'act') : trend === 'up' ? 'watch' : 'ok';
    out.push({ pestId, rule, last, prev, trend, over, advice, series });
  }
  return out.sort((a, b) => b.last.date.localeCompare(a.last.date));
}

/** Un comptage récent compte pour les tâches pendant… (jours). */
export const COUNT_FRESH_DAYS = 10;
/** Recompter après… (jours) quand on attend les auxiliaires ou qu'une population monte. */
export const RECOUNT_AFTER = 5;

/** Tâches issues des comptages : intervenir, ou recompter. */
export function pestTasks(data: GardenData, today: ISODate): Array<{ key: string; due: ISODate; priority: 1 | 3; plantId?: string; bedId?: string; pestId: string; advice: PestAdvice; value: number; threshold: number }> {
  const targets = new Set(data.pestCounts.map((c) => (c.plantId ? `p:${c.plantId}` : `b:${c.bedId}`)));
  const out: ReturnType<typeof pestTasks> = [];
  for (const t of targets) {
    const target = t.startsWith('p:') ? { plantId: t.slice(2) } : { bedId: t.slice(2) };
    if (target.plantId && data.plants.find((p) => p.id === target.plantId)?.status === 'ended') continue;
    for (const st of pestStatuses(data.pestCounts, target)) {
      if (diffDays(st.last.date, today) > COUNT_FRESH_DAYS || st.last.date > today) continue;
      const base = { plantId: st.last.plantId, bedId: st.last.bedId, pestId: st.pestId, advice: st.advice, value: st.last.value, threshold: st.rule.threshold };
      if (st.advice === 'act') out.push({ ...base, key: `pest:${st.last.id}`, due: st.last.date, priority: 1 });
      else if (st.advice === 'beneficials' || st.advice === 'watch') {
        const due = addDays(st.last.date, RECOUNT_AFTER);
        if (due <= addDays(today, 1)) out.push({ ...base, key: `pestRecount:${st.last.id}`, due, priority: 3 });
      }
    }
  }
  return out;
}
