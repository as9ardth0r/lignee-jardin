/**
 * Programme de sélection automatique du fraisier — la démarche réelle d’un
 * obtenteur (INRA, Ciref, Marionnet, UC Davis) :
 *
 *  1. Croisement de deux parents choisis ; on sème les akènes : chaque
 *     semis est un génotype unique (le fraisier est très hétérozygote).
 *  2. Sélection au champ : on repère, plante par plante, les semis qui
 *     présentent les caractères visés (couleur, remontée, arôme,
 *     résistances) et on classe les meilleurs sur les critères chiffrés.
 *  3. Essai clonal : chaque candidat est multiplié par stolons et planté
 *     en petite parcelle de clones ; la moyenne des clones dit sa vraie
 *     valeur (un semis isolé est trompé par son emplacement et la météo).
 *  4. Si un clone réunit tout, c’est une NOUVELLE VARIÉTÉ : elle est déjà
 *     « fixée », puisqu’on la multipliera toujours par stolons. Sinon, on
 *     recroise entre eux les deux meilleurs candidats (sélection
 *     récurrente) et on recommence.
 *
 * Comme un vrai sélectionneur, le programme ne « voit » que le phénotype.
 */

import type { FaEngine, FaIndividual, FruitColor } from './engine';
import type { VariantId } from './loci';
import { gardenOutcome, type GardenSettings } from './garden';

export interface BreedingGoal {
  color?: FruitColor;
  /** Remontant voulu (true) ou non remontant (false). */
  everbearing?: boolean;
  /** Arôme de pêche (FAD1). */
  peach?: boolean;
  resistances: VariantId[];
  /** Poids moyen d’un fruit minimal (g). */
  minWeight?: number;
  minFirmness?: number;
  minBrix?: number;
  /** Première fraise au plus tard (jours après le 1er avril). */
  maxDays?: number;
  /** Récolte minimale par plante (kg, au jardin si fourni). */
  minYieldKg?: number;
  garden?: GardenSettings;
}

function quantValues(engine: FaEngine, ind: FaIndividual, goal: BreedingGoal) {
  const out = goal.garden ? gardenOutcome(engine, ind, goal.garden) : null;
  return {
    weight: ind.pheno.weightG,
    firmness: ind.pheno.firmness,
    brix: ind.pheno.brix,
    days: out ? out.days : ind.pheno.early,
    yield: out ? out.realizedKg : engine.yieldKg(ind),
  };
}

export interface ProgramStep {
  generation: number;
  kind: 'cross' | 'self' | 'clone';
  grown: number;
  conforming: number;
  /** Part des clones de l’essai qui atteignent les critères chiffrés. */
  familyConformity?: number;
  chosen: FaIndividual;
  heterozygosity: number;
}

export interface ProgramResult {
  steps: ProgramStep[];
  /** Semis retenus et clone final (dans l'ordre). */
  lineage: FaIndividual[];
  final: FaIndividual;
  goalReached: boolean;
  /** Le résultat est un clone (variété fixée par multiplication végétative). */
  fixed: boolean;
  totalGrown: number;
  stopped: 'fixed' | 'max-generations' | 'no-conforming' | 'blocked' | 'sterile';
}

/** Conformité qualitative : nombre de caractères visés présents / visés. */
export function qualitativeMatch(engine: FaEngine, ind: FaIndividual, goal: BreedingGoal): { ok: number; total: number } {
  const app = engine.appearance(ind);
  const checks: boolean[] = [];
  if (goal.color) checks.push(app.color === goal.color);
  if (goal.everbearing !== undefined) checks.push(app.everbearing === goal.everbearing);
  if (goal.peach) checks.push(app.peach);
  const res = engine.resistances(ind);
  for (const r of goal.resistances) checks.push(res.includes(r));
  return { ok: checks.filter(Boolean).length, total: checks.length };
}

function quantOk(v: ReturnType<typeof quantValues>, goal: BreedingGoal): boolean {
  if (goal.minWeight && v.weight < goal.minWeight) return false;
  if (goal.minFirmness && v.firmness < goal.minFirmness) return false;
  if (goal.minBrix && v.brix < goal.minBrix) return false;
  if (goal.maxDays && v.days > goal.maxDays) return false;
  if (goal.minYieldKg && v.yield < goal.minYieldKg) return false;
  return true;
}

export function qualitativeOk(engine: FaEngine, ind: FaIndividual, goal: BreedingGoal): boolean {
  const q = qualitativeMatch(engine, ind, goal);
  return q.ok === q.total;
}

export function conforms(engine: FaEngine, ind: FaIndividual, goal: BreedingGoal): boolean {
  return qualitativeOk(engine, ind, goal) && quantOk(quantValues(engine, ind, goal), goal);
}

/** Les critères chiffrés sont jugés sur la moyenne d’un groupe de plantes (essai clonal). */
export function familyMeetsQuant(family: FaIndividual[], goal: BreedingGoal, engine?: FaEngine): boolean {
  if (!family.length) return false;
  if (!engine) return true;
  const vals = family.map((x) => quantValues(engine, x, goal));
  const mean = {} as ReturnType<typeof quantValues>;
  for (const k of Object.keys(vals[0]) as Array<keyof ReturnType<typeof quantValues>>) mean[k] = vals.reduce((s, v) => s + v[k], 0) / vals.length;
  return quantOk(mean, goal);
}

/** Score de classement (qualitatif d'abord, puis critères chiffrés). */
export function goalScore(engine: FaEngine, ind: FaIndividual, goal: BreedingGoal): number {
  const q = qualitativeMatch(engine, ind, goal);
  let s = q.total ? (q.ok / q.total) * 10 : 10;
  const v = quantValues(engine, ind, goal);
  const ratio = (x: number, target: number) => Math.min(1.2, x / Math.max(1e-6, target));
  const crit: number[] = [];
  if (goal.minWeight) crit.push(ratio(v.weight, goal.minWeight));
  if (goal.minFirmness) crit.push(ratio(v.firmness, goal.minFirmness));
  if (goal.minBrix) crit.push(ratio(v.brix, goal.minBrix));
  if (goal.maxDays) crit.push(ratio(goal.maxDays, v.days));
  if (goal.minYieldKg) crit.push(ratio(v.yield, goal.minYieldKg));
  s += crit.reduce((x, y) => x + y, 0);
  if (!crit.length) s += Math.min(1, engine.yieldKg(ind) / 0.5) * 0.5;
  return s;
}

export function goalIsEmpty(goal: BreedingGoal): boolean {
  return (
    !goal.color &&
    goal.everbearing === undefined &&
    !goal.peach &&
    goal.resistances.length === 0 &&
    !goal.minWeight &&
    !goal.minFirmness &&
    !goal.minBrix &&
    !goal.maxDays &&
    !goal.minYieldKg
  );
}

/** Nombre de clones plantés à l’essai pour chaque candidat. */
export const CLONE_TRIAL = 6;

export function runProgram(
  engine: FaEngine,
  a: FaIndividual,
  b: FaIndividual | null,
  goal: BreedingGoal,
  opts: { familySize?: number; maxGenerations?: number; testedCandidates?: number } = {}
): ProgramResult {
  const familySize = opts.familySize ?? 60;
  const maxCycles = opts.maxGenerations ?? 6;
  const tested = opts.testedCandidates ?? 4;
  const steps: ProgramStep[] = [];
  const lineage: FaIndividual[] = [];
  let totalGrown = 0;
  const rank = (list: FaIndividual[]) => [...list].sort((x, y) => goalScore(engine, y, goal) - goalScore(engine, x, goal));

  let mother = a;
  let father: FaIndividual = b && b.id !== a.id ? b : a;
  if (!engine.canPollinate(father) && !engine.canPollinate(mother)) {
    return { steps, lineage, final: a, goalReached: false, fixed: false, totalGrown: 0, stopped: 'sterile' };
  }
  // Une plante femelle ne peut être que la mère.
  if (!engine.canPollinate(father) && engine.canPollinate(mother)) [mother, father] = [father, mother];

  let stopped: ProgramResult['stopped'] = 'max-generations';
  let barren = 0;
  let reached = false;
  let lastClone: FaIndividual | null = null;
  for (let cycle = 0; cycle < maxCycles; cycle++) {
    const self = mother.id === father.id;
    const seedlings = engine.cross(mother, father, familySize, self ? `${mother.label} ⊗` : `${mother.label} × ${father.label}`);
    totalGrown += seedlings.length;
    if (!seedlings.length) {
      stopped = cycle === 0 ? 'blocked' : 'sterile';
      break;
    }
    const qual = seedlings.filter((x) => qualitativeOk(engine, x, goal));
    barren = qual.length ? 0 : barren + 1;
    const pool = rank(qual.length ? qual : seedlings);
    const candidates = pool.slice(0, tested);
    steps.push({
      generation: candidates[0].generation,
      kind: self ? 'self' : 'cross',
      grown: seedlings.length,
      conforming: seedlings.filter((x) => conforms(engine, x, goal)).length,
      chosen: candidates[0],
      heterozygosity: engine.heterozygosity(candidates[0]),
    });

    // Essai clonal des candidats.
    let best: { c: FaIndividual; clones: FaIndividual[]; meets: boolean; share: number } | null = null;
    for (const c of candidates) {
      const clones = Array.from({ length: CLONE_TRIAL }, (_, i) => engine.cloneOf(c, `${c.label} · clone ${i + 1}`));
      totalGrown += clones.length;
      const meets = qualitativeOk(engine, c, goal) && familyMeetsQuant(clones, goal, engine);
      const share = clones.filter((x) => conforms(engine, x, goal)).length / clones.length;
      const better = !best || (meets && !best.meets) || (meets === best.meets && share > best.share) || (meets === best.meets && share === best.share && goalScore(engine, c, goal) > goalScore(engine, best.c, goal));
      if (better) best = { c, clones, meets, share };
    }
    const chosen = best!.c;
    lineage.push(chosen);
    const clone = engine.cloneOf(chosen, `${chosen.label} (clone)`);
    lastClone = clone;
    steps.push({ generation: chosen.generation, kind: 'clone', grown: CLONE_TRIAL, conforming: Math.round(best!.share * CLONE_TRIAL), familyConformity: best!.share, chosen, heterozygosity: engine.heterozygosity(chosen) });

    if (best!.meets) {
      reached = true;
      stopped = 'fixed';
      lineage.push(clone);
      break;
    }
    if (barren >= 3) {
      stopped = 'no-conforming';
      break;
    }
    // Sélection récurrente : on recroise les deux meilleurs candidats (fertiles comme père).
    const fertile = candidates.filter((x) => engine.canPollinate(x));
    const nextMother = chosen;
    const nextFather = fertile.find((x) => x.id !== chosen.id) ?? (engine.canPollinate(chosen) ? chosen : null);
    if (!nextFather || nextMother.fertility <= 0.001) {
      stopped = 'sterile';
      break;
    }
    mother = nextMother;
    father = nextFather;
  }

  const final = reached && lastClone ? lastClone : lineage[lineage.length - 1] ?? a;
  return { steps, lineage, final, goalReached: reached, fixed: reached, totalGrown, stopped };
}
