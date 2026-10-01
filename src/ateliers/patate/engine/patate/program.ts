/**
 * Programme de sélection automatique pour la pomme de terre — la démarche
 * réelle d’un obtenteur, très différente de celle des plantes à graines :
 *
 *  1. Croisement des deux parents ; on sème la GRAINE VRAIE (les baies) :
 *     chaque semis est un génotype unique, très hétérozygote.
 *  2. On cherche dans la famille les plantes qui réunissent tous les
 *     caractères visés. Dès qu’on en trouve une, on la CLONE (on replante
 *     ses tubercules) : la variété est « fixée » d’un coup, sans
 *     autofécondations successives — impossibles de toute façon chez un
 *     tétraploïde qui perd sa vigueur à chaque génération.
 *  3. Sinon, SÉLECTION RÉCURRENTE : on croise entre elles les deux
 *     meilleures plantes de la famille et on recommence.
 *
 * Le programme ne « voit » que le phénotype, comme un vrai sélectionneur.
 */

import type { FleshColor, PtEngine, PtIndividual, SkinColor, TuberShape } from './engine';
import type { VariantId } from './loci';
import { gardenOutcome, type GardenSettings } from './garden';

export interface BreedingGoal {
  skin?: SkinColor;
  flesh?: FleshColor;
  shape?: TuberShape;
  /** Yeux superficiels voulus. */
  shallowEyes?: boolean;
  resistances: VariantId[];
  minWeight?: number;
  maxDays?: number;
  /** Matière sèche minimale (%). */
  minDm?: number;
  /** Récolte minimale par plante (kg, au jardin si fourni). */
  minYieldKg?: number;
  garden?: GardenSettings;
}

function quantValues(engine: PtEngine, ind: PtIndividual, goal: BreedingGoal) {
  const out = goal.garden ? gardenOutcome(engine, ind, goal.garden) : null;
  return {
    weight: ind.pheno.weightKg,
    dm: ind.pheno.dm,
    days: out ? out.days : ind.pheno.days,
    yield: out ? out.realizedKg : engine.yieldKg(ind),
  };
}

export interface ProgramStep {
  generation: number;
  kind: 'cross' | 'self' | 'intercross' | 'clone';
  grown: number;
  conforming: number;
  familyConformity?: number;
  chosen: PtIndividual;
  heterozygosity: number;
}

export interface ProgramResult {
  steps: ProgramStep[];
  lineage: PtIndividual[];
  final: PtIndividual;
  goalReached: boolean;
  /** La plante retenue a été clonée (la variété est fixée par le tubercule). */
  fixed: boolean;
  totalGrown: number;
  stopped: 'fixed' | 'max-generations' | 'no-conforming' | 'blocked' | 'sterile';
}

export function qualitativeMatch(engine: PtEngine, ind: PtIndividual, goal: BreedingGoal): { ok: number; total: number } {
  const app = engine.appearance(ind);
  const checks: boolean[] = [];
  if (goal.skin) checks.push(app.skin === goal.skin);
  if (goal.flesh) checks.push(app.flesh === goal.flesh);
  if (goal.shape) checks.push(app.shape === goal.shape);
  if (goal.shallowEyes) checks.push(!app.deepEyes);
  const res = engine.resistances(ind);
  for (const r of goal.resistances) checks.push(res.includes(r));
  return { ok: checks.filter(Boolean).length, total: checks.length };
}

export function qualitativeOk(engine: PtEngine, ind: PtIndividual, goal: BreedingGoal): boolean {
  const q = qualitativeMatch(engine, ind, goal);
  return q.ok === q.total;
}

function quantOk(v: ReturnType<typeof quantValues>, goal: BreedingGoal): boolean {
  if (goal.minWeight && v.weight < goal.minWeight) return false;
  if (goal.minDm && v.dm < goal.minDm) return false;
  if (goal.maxDays && v.days > goal.maxDays) return false;
  if (goal.minYieldKg && v.yield < goal.minYieldKg) return false;
  return true;
}

export function conforms(engine: PtEngine, ind: PtIndividual, goal: BreedingGoal): boolean {
  return qualitativeOk(engine, ind, goal) && quantOk(quantValues(engine, ind, goal), goal);
}

export function goalScore(engine: PtEngine, ind: PtIndividual, goal: BreedingGoal): number {
  const q = qualitativeMatch(engine, ind, goal);
  let s = q.total ? (q.ok / q.total) * 10 : 10;
  const v = quantValues(engine, ind, goal);
  const ratio = (x: number, target: number) => Math.min(1.2, x / Math.max(1e-6, target));
  const crit: number[] = [];
  if (goal.minWeight) crit.push(ratio(v.weight, goal.minWeight));
  if (goal.minDm) crit.push(ratio(v.dm, goal.minDm));
  if (goal.maxDays) crit.push(ratio(goal.maxDays, v.days));
  if (goal.minYieldKg) crit.push(ratio(v.yield, goal.minYieldKg));
  s += crit.reduce((x, y) => x + y, 0);
  if (!crit.length) s += Math.min(1, engine.yieldKg(ind) / 2) * 0.5;
  return s;
}

export function goalIsEmpty(goal: BreedingGoal): boolean {
  return !goal.skin && !goal.flesh && !goal.shape && !goal.shallowEyes && goal.resistances.length === 0 && !goal.minWeight && !goal.minDm && !goal.maxDays && !goal.minYieldKg;
}

export function runProgram(
  engine: PtEngine,
  a: PtIndividual,
  b: PtIndividual | null,
  goal: BreedingGoal,
  opts: { familySize?: number; maxGenerations?: number } = {}
): ProgramResult {
  const familySize = opts.familySize ?? 60;
  const maxGen = opts.maxGenerations ?? 8;
  const steps: ProgramStep[] = [];
  const lineage: PtIndividual[] = [];
  let totalGrown = 0;
  const best = (list: PtIndividual[]) => [...list].sort((x, y) => goalScore(engine, y, goal) - goalScore(engine, x, goal));
  const name = `${a.label}${b && b.id !== a.id ? ` × ${b.label}` : ''}`;

  const crossing = !!b && b.id !== a.id;
  if (crossing && engine.crossCheck(a, b!).level === 'blocked') return { steps, lineage, final: a, goalReached: false, fixed: false, totalGrown, stopped: 'blocked' };
  if (!crossing && !engine.canPollinate(a)) return { steps, lineage, final: a, goalReached: false, fixed: false, totalGrown, stopped: 'sterile' };

  let mother = a;
  let father = crossing ? b! : a;
  let kind: ProgramStep['kind'] = crossing ? 'cross' : 'self';
  let stopped: ProgramResult['stopped'] = 'max-generations';
  let barren = 0;
  for (let g = 0; g < maxGen; g++) {
    const family = engine.cross(mother, father, familySize, kind === 'intercross' ? `${name} (S${g})` : name);
    totalGrown += family.length;
    if (!family.length) {
      stopped = g === 0 && crossing ? 'blocked' : 'sterile';
      break;
    }
    const conformingPlants = family.filter((x) => conforms(engine, x, goal));
    const ranked = best(conformingPlants.length ? conformingPlants : family);
    const chosen = ranked[0];
    steps.push({ generation: chosen.generation, kind, grown: family.length, conforming: conformingPlants.length, chosen, heterozygosity: engine.heterozygosity(chosen) });
    lineage.push(chosen);
    if (conformingPlants.length) {
      const clone = engine.cloneOf(chosen, `${chosen.label} (clone)`);
      steps.push({ generation: clone.generation, kind: 'clone', grown: 1, conforming: 1, chosen: clone, heterozygosity: engine.heterozygosity(clone) });
      lineage.push(clone);
      stopped = 'fixed';
      break;
    }
    barren = qualitativeOk(engine, chosen, goal) ? 0 : barren + 1;
    if (barren >= 4) {
      stopped = 'no-conforming';
      break;
    }
    // Sélection récurrente : les deux meilleures plantes fertiles, croisées entre elles.
    const fathers = ranked.filter((x) => engine.canPollinate(x));
    const mothers = ranked.filter((x) => x.fertility > 0.05);
    if (!mothers.length || !fathers.length) {
      stopped = 'sterile';
      break;
    }
    mother = mothers[0];
    father = fathers.find((x) => x.id !== mother.id && engine.crossCheck(mother, x).level !== 'blocked') ?? mother;
    kind = father.id === mother.id ? 'self' : 'intercross';
    if (kind === 'self' && !engine.canPollinate(mother)) {
      stopped = 'sterile';
      break;
    }
  }

  const final = lineage[lineage.length - 1] ?? a;
  return { steps, lineage, final, goalReached: stopped === 'fixed', fixed: stopped === 'fixed', totalGrown, stopped };
}
