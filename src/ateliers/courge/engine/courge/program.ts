/**
 * Programme de sélection automatique pour les courges — la démarche réelle
 * d'un obtenteur amateur qui veut « créer sa variété » :
 *
 *  1. Croisement des deux parents (F1), ou départ d'une plante unique.
 *  2. À chaque génération : on sème une famille par autofécondation MANUELLE
 *     de la plante élue (pollen d'une fleur mâle de la même plante, fleur
 *     femelle protégée des insectes), on repère les plantes qui présentent tous les caractères
 *     visés, et on garde la meilleure selon les critères chiffrés.
 *  3. Test de descendance : pour éviter de garder une plante « porteuse »
 *     qui ressemble à l'objectif sans le fixer, on autoféconde les 3
 *     meilleures candidates et on retient celle dont la famille reproduit
 *     le mieux l'objectif (taux de conformité).
 *  4. Arrêt quand la plante élue est fixée ET que sa descendance est 100 %
 *     conforme (la variété « tient »), ou au bout du nombre maximal de
 *     générations.
 *
 * Le programme ne « voit » que le phénotype, comme un vrai sélectionneur :
 * le génotype n'est jamais lu pour choisir (seulement pour le compte rendu
 * de fixation).
 */

import type { FruitAppearance, FruitShape, SquashEngine, SquashIndividual } from './engine';
import type { VariantId } from './loci';
import { gardenOutcome, type GardenSettings } from './garden';

export interface BreedingGoal {
  color?: FruitAppearance['rind'];
  shape?: FruitShape;
  striped?: boolean;
  warty?: boolean;
  bush?: boolean;
  hullless?: boolean;
  /** Toujours vrai par défaut : jamais de plante amère (toxique) retenue. */
  notBitter: boolean;
  resistances: VariantId[];
  minWeightKg?: number;
  maxWeightKg?: number;
  minBrix?: number;
  maxDays?: number;
  minStorage?: number;
  /** Rendement minimal par plante (au jardin si `garden` est fourni). */
  minYieldKg?: number;
  garden?: GardenSettings;
}

function quantValues(engine: SquashEngine, ind: SquashIndividual, goal: BreedingGoal) {
  const out = goal.garden ? gardenOutcome(engine, ind, goal.garden) : null;
  return {
    weight: ind.pheno.weightKg,
    brix: ind.pheno.brix,
    days: out ? out.days : ind.pheno.days,
    yield: out ? out.realizedKg : engine.yieldKg(ind),
    storage: ind.pheno.storageMonths,
  };
}

export interface ProgramStep {
  generation: number;
  kind: 'cross' | 'self';
  grown: number;
  conforming: number;
  /** Taux de conformité de la famille retenue au test de descendance. */
  familyConformity?: number;
  chosen: SquashIndividual;
  heterozygosity: number;
}

export interface ProgramResult {
  steps: ProgramStep[];
  /** Plantes élues, une par génération (dans l'ordre). */
  lineage: SquashIndividual[];
  final: SquashIndividual;
  goalReached: boolean;
  fixed: boolean;
  totalGrown: number;
  stopped: 'fixed' | 'max-generations' | 'no-conforming' | 'blocked' | 'sterile';
}

/** Conformité qualitative : nombre de caractères visés présents / visés. */
export function qualitativeMatch(engine: SquashEngine, ind: SquashIndividual, goal: BreedingGoal): { ok: number; total: number } {
  const app = engine.appearance(ind);
  const checks: boolean[] = [];
  if (goal.color) checks.push(app.rind === goal.color);
  if (goal.shape) checks.push(app.shape === goal.shape);
  if (goal.striped !== undefined) checks.push(app.striped === goal.striped);
  if (goal.warty !== undefined) checks.push(app.warty === goal.warty);
  if (goal.bush !== undefined) checks.push((app.bush === 'bush') === goal.bush);
  if (goal.hullless !== undefined) checks.push(app.hullless === goal.hullless);
  if (goal.notBitter) checks.push(!app.bitter);
  const res = engine.resistances(ind);
  for (const r of goal.resistances) checks.push(res.some((x) => x.id === r && (r !== 'Pm0' || x.full)));
  return { ok: checks.filter(Boolean).length, total: checks.length };
}

export function conforms(engine: SquashEngine, ind: SquashIndividual, goal: BreedingGoal): boolean {
  const q = qualitativeMatch(engine, ind, goal);
  if (q.ok < q.total) return false;
  return quantOk(quantValues(engine, ind, goal), goal);
}

function quantOk(v: ReturnType<typeof quantValues>, goal: BreedingGoal): boolean {
  if (goal.minWeightKg && v.weight < goal.minWeightKg) return false;
  if (goal.maxWeightKg && v.weight > goal.maxWeightKg) return false;
  if (goal.minBrix && v.brix < goal.minBrix) return false;
  if (goal.maxDays && v.days > goal.maxDays) return false;
  if (goal.minYieldKg && v.yield < goal.minYieldKg) return false;
  if (goal.minStorage && v.storage < goal.minStorage) return false;
  return true;
}

export function qualitativeOk(engine: SquashEngine, ind: SquashIndividual, goal: BreedingGoal): boolean {
  const q = qualitativeMatch(engine, ind, goal);
  return q.ok === q.total;
}

/** Les critères chiffrés sont jugés sur la moyenne d'une famille (comme un
 * obtenteur le fait sur une parcelle), pas plante par plante. */
export function familyMeetsQuant(family: SquashIndividual[], goal: BreedingGoal, engine?: SquashEngine): boolean {
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
export function goalScore(engine: SquashEngine, ind: SquashIndividual, goal: BreedingGoal): number {
  const q = qualitativeMatch(engine, ind, goal);
  let s = q.total ? (q.ok / q.total) * 10 : 10;
  const v = quantValues(engine, ind, goal);
  const ratio = (x: number, target: number) => Math.min(1.2, x / Math.max(1e-6, target));
  let any = false;
  if (goal.minWeightKg) (s += ratio(v.weight, goal.minWeightKg)), (any = true);
  if (goal.maxWeightKg) (s += ratio(goal.maxWeightKg, v.weight)), (any = true);
  if (goal.minBrix) (s += ratio(v.brix, goal.minBrix)), (any = true);
  if (goal.maxDays) (s += ratio(goal.maxDays, v.days)), (any = true);
  if (goal.minYieldKg) (s += ratio(v.yield, goal.minYieldKg)), (any = true);
  if (goal.minStorage) (s += ratio(v.storage, goal.minStorage)), (any = true);
  // Sans critère chiffré : léger bonus aux sucres et à la conservation
  if (!any) s += engine.unitOf('brix', ind) * 0.5 + engine.unitOf('storage', ind) * 0.5;
  return s;
}

export function goalIsEmpty(goal: BreedingGoal): boolean {
  return (
    !goal.color &&
    !goal.shape &&
    goal.striped === undefined &&
    goal.warty === undefined &&
    goal.bush === undefined &&
    goal.hullless === undefined &&
    goal.resistances.length === 0 &&
    !goal.minWeightKg &&
    !goal.maxWeightKg &&
    !goal.minBrix &&
    !goal.maxDays &&
    !goal.minYieldKg &&
    !goal.minStorage
  );
}

export function runProgram(
  engine: SquashEngine,
  a: SquashIndividual,
  b: SquashIndividual | null,
  goal: BreedingGoal,
  opts: { familySize?: number; maxGenerations?: number; testedCandidates?: number } = {}
): ProgramResult {
  const familySize = opts.familySize ?? 40;
  const maxGen = opts.maxGenerations ?? 10;
  const tested = opts.testedCandidates ?? 3;
  const steps: ProgramStep[] = [];
  const lineage: SquashIndividual[] = [];
  let totalGrown = 0;

  const best = (list: SquashIndividual[]) => [...list].sort((x, y) => goalScore(engine, y, goal) - goalScore(engine, x, goal));
  const qualRate = (list: SquashIndividual[]) => list.filter((x) => qualitativeOk(engine, x, goal)).length / list.length;

  // Étape 1 : F1 (ou départ d'une plante seule)
  let parent: SquashIndividual;
  if (b && b.id !== a.id) {
    const check = engine.crossCheck(a, b);
    const f1 = engine.cross(a, b, familySize, `${a.label} × ${b.label}`);
    totalGrown += f1.length;
    if (check.level === 'blocked' || f1.length === 0) {
      return { steps, lineage, final: a, goalReached: false, fixed: engine.isFixed(a), totalGrown, stopped: 'blocked' };
    }
    parent = best(f1)[0];
    steps.push({
      generation: parent.generation,
      kind: 'cross',
      grown: f1.length,
      conforming: f1.filter((x) => conforms(engine, x, goal)).length,
      chosen: parent,
      heterozygosity: engine.heterozygosity(parent),
    });
    lineage.push(parent);
    if (parent.fertility <= 0.001) {
      return { steps, lineage, final: parent, goalReached: false, fixed: false, totalGrown, stopped: 'sterile' };
    }
  } else {
    if (a.fertility <= 0.001) return { steps, lineage, final: a, goalReached: false, fixed: false, totalGrown: 0, stopped: 'sterile' };
    parent = a;
  }

  let stopped: ProgramResult['stopped'] = 'max-generations';
  let lastFamilyMeetsQuant = false;
  let barren = 0;
  for (let g = 0; g < maxGen; g++) {
    const family = engine.cross(parent, parent, familySize, `${a.label}${b && b.id !== a.id ? ` × ${b.label}` : ''} ⊗`);
    totalGrown += family.length;
    if (!family.length) {
      stopped = 'sterile';
      break;
    }
    const conformingPlants = family.filter((x) => conforms(engine, x, goal));
    const qualPlants = family.filter((x) => qualitativeOk(engine, x, goal));
    const pool = conformingPlants.length ? conformingPlants : qualPlants.length ? qualPlants : family;
    barren = qualPlants.length ? 0 : barren + 1;

    // Test de descendance : conformité des caractères mendéliens (100 % =
    // la lignée « tient ») + moyenne de la famille pour les critères chiffrés
    // (bruités par l'environnement, on ne peut pas exiger 100 % plante à plante).
    const candidates = best(pool).slice(0, tested);
    let chosen = candidates[0];
    let chosenConformity = -1;
    let chosenMeetsQuant = false;
    for (const c of candidates) {
      const progeny = engine.cross(c, c, Math.max(12, Math.round(familySize / 2)), 'test');
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
      kind: 'self',
      grown: family.length,
      conforming: conformingPlants.length,
      familyConformity: chosenConformity,
      chosen,
      heterozygosity: engine.heterozygosity(chosen),
    });
    lineage.push(chosen);
    parent = chosen;
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
