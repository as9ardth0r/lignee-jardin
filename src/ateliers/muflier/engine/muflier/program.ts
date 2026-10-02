/**
 * Programme de sélection automatique pour le muflier — la démarche réelle
 * d'un obtenteur amateur qui veut « créer sa variété » :
 *
 *  1. Croisement des deux parents (F1), ou départ d'une plante unique.
 *  2. À chaque génération : on sème une famille par AUTOFÉCONDATION de la
 *     plante élue (épi ensaché pour écarter les bourdons), on repère les
 *     plantes qui présentent tous les caractères visés, et on garde la
 *     meilleure selon les critères chiffrés.
 *     Si la plante est AUTO-INCOMPATIBLE (muflier sauvage, ou hybride qui a
 *     hérité de deux allèles S actifs), l'autofécondation ne donne rien :
 *     on la croise avec la meilleure SŒUR compatible de sa famille. La
 *     fixation est plus lente, mais elle avance.
 *  3. Test de descendance : on éprouve les 3 meilleures candidates et on
 *     retient celle dont la famille reproduit le mieux l'objectif.
 *  4. Arrêt quand la plante élue est fixée ET que sa descendance est 100 %
 *     conforme, ou au bout du nombre maximal de générations.
 *
 * Le programme ne « voit » que le phénotype, comme un vrai sélectionneur.
 */

import type { FlowerColor, FlowerShape, HeightClass, AmEngine, AmIndividual } from './engine';
import type { VariantId } from './loci';
import { gardenOutcome, type GardenSettings } from './garden';

export interface BreedingGoal {
  color?: FlowerColor;
  /** Face claire (bicolore) voulue ou refusée. */
  face?: boolean;
  veins?: boolean;
  flecked?: boolean;
  shape?: FlowerShape;
  height?: HeightClass;
  resistances: VariantId[];
  minFlorets?: number;
  maxDays?: number;
  minScent?: number;
  /** Tiges florales minimales par plante (au jardin si fourni). */
  minStems?: number;
  garden?: GardenSettings;
}

function quantValues(engine: AmEngine, ind: AmIndividual, goal: BreedingGoal) {
  const out = goal.garden ? gardenOutcome(engine, ind, goal.garden) : null;
  return {
    florets: ind.pheno.florets,
    scent: ind.pheno.scent,
    days: out ? out.days : ind.pheno.days,
    stems: out ? out.realized : engine.stems(ind),
  };
}

export interface ProgramStep {
  generation: number;
  kind: 'cross' | 'self' | 'sib';
  grown: number;
  conforming: number;
  /** Taux de conformité de la famille retenue au test de descendance. */
  familyConformity?: number;
  chosen: AmIndividual;
  heterozygosity: number;
}

export interface ProgramResult {
  steps: ProgramStep[];
  /** Plantes élues, une par génération (dans l'ordre). */
  lineage: AmIndividual[];
  final: AmIndividual;
  goalReached: boolean;
  fixed: boolean;
  totalGrown: number;
  stopped: 'fixed' | 'max-generations' | 'no-conforming' | 'blocked' | 'sterile' | 'no-mate';
}

/** Conformité qualitative : nombre de caractères visés présents / visés. */
export function qualitativeMatch(engine: AmEngine, ind: AmIndividual, goal: BreedingGoal): { ok: number; total: number } {
  const app = engine.appearance(ind);
  const checks: boolean[] = [];
  if (goal.color) checks.push(app.color === goal.color);
  if (goal.face !== undefined) checks.push(app.face === goal.face);
  if (goal.veins !== undefined) checks.push(app.veins === goal.veins);
  if (goal.flecked !== undefined) checks.push(app.flecked === goal.flecked);
  if (goal.shape) checks.push(app.shape === goal.shape);
  if (goal.height) checks.push(engine.heightClass(ind) === goal.height);
  const res = engine.resistances(ind);
  for (const r of goal.resistances) checks.push(res.includes(r));
  return { ok: checks.filter(Boolean).length, total: checks.length };
}

export function conforms(engine: AmEngine, ind: AmIndividual, goal: BreedingGoal): boolean {
  const q = qualitativeMatch(engine, ind, goal);
  if (q.ok < q.total) return false;
  return quantOk(quantValues(engine, ind, goal), goal);
}

function quantOk(v: ReturnType<typeof quantValues>, goal: BreedingGoal): boolean {
  if (goal.minFlorets && v.florets < goal.minFlorets) return false;
  if (goal.minScent && v.scent < goal.minScent) return false;
  if (goal.maxDays && v.days > goal.maxDays) return false;
  if (goal.minStems && v.stems < goal.minStems) return false;
  return true;
}

export function qualitativeOk(engine: AmEngine, ind: AmIndividual, goal: BreedingGoal): boolean {
  const q = qualitativeMatch(engine, ind, goal);
  return q.ok === q.total;
}

/** Les critères chiffrés sont jugés sur la moyenne d'une famille (comme un
 * obtenteur le fait sur une parcelle), pas plante par plante. */
export function familyMeetsQuant(family: AmIndividual[], goal: BreedingGoal, engine?: AmEngine): boolean {
  if (!family.length) return false;
  if (!engine) return true;
  const vals = family.map((x) => quantValues(engine, x, goal));
  const mean = {} as ReturnType<typeof quantValues>;
  for (const k of Object.keys(vals[0]) as Array<keyof ReturnType<typeof quantValues>>) {
    mean[k] = vals.reduce((s, v) => s + v[k], 0) / vals.length;
  }
  return quantOk(mean, goal);
}

/** Score de classement (qualitatif d'abord, puis critères chiffrés). */
export function goalScore(engine: AmEngine, ind: AmIndividual, goal: BreedingGoal): number {
  const q = qualitativeMatch(engine, ind, goal);
  let s = q.total ? (q.ok / q.total) * 10 : 10;
  const v = quantValues(engine, ind, goal);
  const ratio = (x: number, target: number) => Math.min(1.2, x / Math.max(1e-6, target));
  const crit: number[] = [];
  if (goal.minFlorets) crit.push(ratio(v.florets, goal.minFlorets));
  if (goal.minScent) crit.push(ratio(v.scent, goal.minScent));
  if (goal.maxDays) crit.push(ratio(goal.maxDays, v.days));
  if (goal.minStems) crit.push(ratio(v.stems, goal.minStems));
  s += crit.reduce((x, y) => x + y, 0);
  if (!crit.length) s += Math.min(1, ind.pheno.florets / 30) * 0.5;
  return s;
}

export function goalIsEmpty(goal: BreedingGoal): boolean {
  return (
    !goal.color &&
    goal.face === undefined &&
    goal.veins === undefined &&
    goal.flecked === undefined &&
    !goal.shape &&
    !goal.height &&
    goal.resistances.length === 0 &&
    !goal.minFlorets &&
    !goal.minScent &&
    !goal.maxDays &&
    !goal.minStems
  );
}

export function runProgram(
  engine: AmEngine,
  a: AmIndividual,
  b: AmIndividual | null,
  goal: BreedingGoal,
  opts: { familySize?: number; maxGenerations?: number; testedCandidates?: number } = {}
): ProgramResult {
  const familySize = opts.familySize ?? 40;
  const maxGen = opts.maxGenerations ?? 10;
  const tested = opts.testedCandidates ?? 3;
  const steps: ProgramStep[] = [];
  const lineage: AmIndividual[] = [];
  let totalGrown = 0;

  const best = (list: AmIndividual[]) => [...list].sort((x, y) => goalScore(engine, y, goal) - goalScore(engine, x, goal));
  const qualRate = (list: AmIndividual[]) => list.filter((x) => qualitativeOk(engine, x, goal)).length / list.length;

  /** Autofécondation, ou croisement avec la meilleure sœur compatible si la plante est auto-incompatible. */
  const reproduce = (plant: AmIndividual, sibs: AmIndividual[], n: number, label: string): { kind: 'self' | 'sib'; progeny: AmIndividual[] } => {
    if (engine.isSelfCompatible(plant)) return { kind: 'self', progeny: engine.cross(plant, plant, n, label) };
    const mates = best(sibs.filter((x) => x.id !== plant.id && engine.canPollinate(x) && engine.sCompatibility(plant, x) > 0));
    const mate = mates.find((x) => qualitativeOk(engine, x, goal)) ?? mates[0];
    if (!mate) return { kind: 'sib', progeny: [] };
    return { kind: 'sib', progeny: engine.sibCross(plant, mate, n, label) };
  };

  // Étape 1 : F1 (ou départ d'une plante seule)
  let parent: AmIndividual;
  let sibs: AmIndividual[] = [];
  if (b && b.id !== a.id) {
    const check = engine.crossCheck(a, b);
    const f1 = engine.cross(a, b, familySize, `${a.label} × ${b.label}`);
    totalGrown += f1.length;
    if (check.level === 'blocked' || f1.length === 0) {
      return { steps, lineage, final: a, goalReached: false, fixed: engine.isFixed(a), totalGrown, stopped: 'blocked' };
    }
    const fertileF1 = f1.filter((x) => engine.canPollinate(x));
    parent = best(fertileF1.length ? fertileF1 : f1)[0];
    sibs = f1;
    steps.push({
      generation: parent.generation,
      kind: 'cross',
      grown: f1.length,
      conforming: f1.filter((x) => conforms(engine, x, goal)).length,
      chosen: parent,
      heterozygosity: engine.heterozygosity(parent),
    });
    lineage.push(parent);
    if (!engine.canPollinate(parent)) {
      return { steps, lineage, final: parent, goalReached: false, fixed: false, totalGrown, stopped: 'sterile' };
    }
  } else {
    if (!engine.canPollinate(a)) return { steps, lineage, final: a, goalReached: false, fixed: false, totalGrown: 0, stopped: 'sterile' };
    parent = a;
  }

  let stopped: ProgramResult['stopped'] = 'max-generations';
  let lastFamilyMeetsQuant = false;
  let barren = 0;
  for (let g = 0; g < maxGen; g++) {
    const { kind, progeny: family } = reproduce(parent, sibs, familySize, `${a.label}${b && b.id !== a.id ? ` × ${b.label}` : ''} ⊗`);
    totalGrown += family.length;
    if (!family.length) {
      stopped = kind === 'sib' ? 'no-mate' : 'sterile';
      break;
    }
    const conformingPlants = family.filter((x) => conforms(engine, x, goal));
    const qualPlants = family.filter((x) => qualitativeOk(engine, x, goal));
    const pool = conformingPlants.length ? conformingPlants : qualPlants.length ? qualPlants : family;
    barren = qualPlants.length ? 0 : barren + 1;

    // Test de descendance : conformité des caractères mendéliens (100 % =
    // la lignée « tient ») + moyenne de la famille pour les critères chiffrés.
    const fertilePool = pool.filter((x) => engine.canPollinate(x));
    const candidates = best(fertilePool.length ? fertilePool : pool).slice(0, tested);
    let chosen = candidates[0];
    let chosenConformity = -1;
    let chosenMeetsQuant = false;
    for (const c of candidates) {
      const { progeny } = reproduce(c, family, Math.max(12, Math.round(familySize / 2)), 'test');
      totalGrown += progeny.length;
      const rate = progeny.length ? qualRate(progeny) : 0;
      const meets = familyMeetsQuant(progeny, goal, engine);
      const better =
        rate > chosenConformity ||
        (rate === chosenConformity && meets && !chosenMeetsQuant) ||
        (rate === chosenConformity && meets === chosenMeetsQuant && goalScore(engine, c, goal) > goalScore(engine, chosen, goal));
      if (better) {
        chosen = c;
        chosenConformity = rate;
        chosenMeetsQuant = meets;
      }
    }

    steps.push({
      generation: chosen.generation,
      kind,
      grown: family.length,
      conforming: conformingPlants.length,
      familyConformity: chosenConformity,
      chosen,
      heterozygosity: engine.heterozygosity(chosen),
    });
    lineage.push(chosen);
    parent = chosen;
    sibs = family;
    lastFamilyMeetsQuant = chosenMeetsQuant;

    if (barren >= 3) {
      stopped = 'no-conforming';
      break;
    }
    if (qualitativeOk(engine, chosen, goal) && chosenConformity === 1 && chosenMeetsQuant && engine.isFixed(chosen)) {
      stopped = 'fixed';
      break;
    }
  }

  const final = lineage[lineage.length - 1] ?? a;
  return {
    steps,
    lineage,
    final,
    goalReached: qualitativeOk(engine, final, goal) && (lineage.length === 0 || lastFamilyMeetsQuant),
    fixed: engine.isFixed(final),
    totalGrown,
    stopped,
  };
}
