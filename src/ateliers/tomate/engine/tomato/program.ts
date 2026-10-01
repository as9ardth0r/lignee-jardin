/**
 * Programme de sélection automatique pour la tomate — la démarche réelle
 * d'un obtenteur amateur qui veut « créer sa variété » :
 *
 *  1. Croisement des deux parents (F1), ou départ d'une plante unique.
 *  2. À chaque génération : on sème une famille par autofécondation de la
 *     plante élue, on repère les plantes qui présentent tous les caractères
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

import type { FruitAppearance, FruitShape, TomatoEngine, TomatoIndividual } from './engine';
import type { TomatoLocusId } from './loci';
import { gardenOutcome, type GardenSettings } from './garden';

export interface BreedingGoal {
  color?: FruitAppearance['colorKey'];
  shape?: FruitShape;
  striped?: boolean;
  anthocyanin?: 'none' | 'patches' | 'indigo';
  habit?: 'det' | 'indet';
  leaf?: 'potato' | 'regular';
  dwarf?: boolean;
  resistances: TomatoLocusId[];
  minWeightG?: number;
  minBrix?: number;
  maxDays?: number;
  /** Rendement minimal DANS LE JARDIN (maladies et climat déduits) si `garden`
   * est fourni, sinon rendement potentiel. */
  minYieldKg?: number;
  minCrack?: number;
  minShelfDays?: number;
  minHeat?: number;
  minCold?: number;
  maxAcidity?: number;
  garden?: GardenSettings;
}

/** Valeurs chiffrées jugées par le programme (rendement : au jardin si fourni). */
function quantValues(engine: TomatoEngine, ind: TomatoIndividual, goal: BreedingGoal) {
  const out = goal.garden ? gardenOutcome(engine, ind, goal.garden) : null;
  return {
    weight: ind.pheno.weightG,
    brix: ind.pheno.brix,
    days: out ? out.days : ind.pheno.days,
    yield: out ? out.realizedKg : ind.pheno.yieldKg,
    crack: ind.pheno.crack,
    shelf: ind.pheno.shelfDays,
    heat: ind.pheno.heat,
    cold: ind.pheno.cold,
    acidity: ind.pheno.acidity,
  };
}

export interface ProgramStep {
  generation: number;
  kind: 'cross' | 'self';
  grown: number;
  conforming: number;
  /** Taux de conformité de la famille retenue au test de descendance. */
  familyConformity?: number;
  chosen: TomatoIndividual;
  heterozygosity: number;
}

export interface ProgramResult {
  steps: ProgramStep[];
  /** Plantes élues, une par génération (dans l'ordre). */
  lineage: TomatoIndividual[];
  final: TomatoIndividual;
  goalReached: boolean;
  fixed: boolean;
  totalGrown: number;
  stopped: 'fixed' | 'max-generations' | 'no-conforming';
}

/** Conformité qualitative : nombre de caractères visés présents / visés. */
export function qualitativeMatch(engine: TomatoEngine, ind: TomatoIndividual, goal: BreedingGoal): { ok: number; total: number } {
  const app = engine.appearance(ind);
  const checks: boolean[] = [];
  if (goal.color) checks.push(app.colorKey === goal.color);
  if (goal.shape) checks.push(app.shape === goal.shape);
  if (goal.striped !== undefined) checks.push(app.striped === goal.striped);
  if (goal.anthocyanin) checks.push(app.anthocyanin === goal.anthocyanin);
  if (goal.habit) checks.push(engine.isDeterminate(ind) === (goal.habit === 'det'));
  if (goal.leaf) checks.push(engine.isPotatoLeaf(ind) === (goal.leaf === 'potato'));
  if (goal.dwarf !== undefined) checks.push(engine.isDwarf(ind) === goal.dwarf);
  const res = engine.resistances(ind);
  for (const r of goal.resistances) checks.push(res.includes(r));
  return { ok: checks.filter(Boolean).length, total: checks.length };
}

export function conforms(engine: TomatoEngine, ind: TomatoIndividual, goal: BreedingGoal): boolean {
  const q = qualitativeMatch(engine, ind, goal);
  if (q.ok < q.total) return false;
  return quantOk(quantValues(engine, ind, goal), goal);
}

function quantOk(v: ReturnType<typeof quantValues>, goal: BreedingGoal): boolean {
  if (goal.minWeightG && v.weight < goal.minWeightG) return false;
  if (goal.minBrix && v.brix < goal.minBrix) return false;
  if (goal.maxDays && v.days > goal.maxDays) return false;
  if (goal.minYieldKg && v.yield < goal.minYieldKg) return false;
  if (goal.minCrack && v.crack < goal.minCrack) return false;
  if (goal.minShelfDays && v.shelf < goal.minShelfDays) return false;
  if (goal.minHeat && v.heat < goal.minHeat) return false;
  if (goal.minCold && v.cold < goal.minCold) return false;
  if (goal.maxAcidity && v.acidity > goal.maxAcidity) return false;
  return true;
}

export function qualitativeOk(engine: TomatoEngine, ind: TomatoIndividual, goal: BreedingGoal): boolean {
  const q = qualitativeMatch(engine, ind, goal);
  return q.ok === q.total;
}

/** Les critères chiffrés sont jugés sur la moyenne d'une famille (comme un
 * obtenteur le fait sur une parcelle), pas plante par plante. */
export function familyMeetsQuant(family: TomatoIndividual[], goal: BreedingGoal, engine?: TomatoEngine): boolean {
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
export function goalScore(engine: TomatoEngine, ind: TomatoIndividual, goal: BreedingGoal): number {
  const q = qualitativeMatch(engine, ind, goal);
  let s = q.total ? (q.ok / q.total) * 10 : 10;
  const v = quantValues(engine, ind, goal);
  const ratio = (x: number, target: number) => Math.min(1.2, x / Math.max(1e-6, target));
  let any = false;
  if (goal.minWeightG) (s += ratio(v.weight, goal.minWeightG)), (any = true);
  if (goal.minBrix) (s += ratio(v.brix, goal.minBrix)), (any = true);
  if (goal.maxDays) (s += ratio(goal.maxDays, v.days)), (any = true);
  if (goal.minYieldKg) (s += ratio(v.yield, goal.minYieldKg)), (any = true);
  if (goal.minCrack) (s += ratio(v.crack, goal.minCrack)), (any = true);
  if (goal.minShelfDays) (s += ratio(v.shelf, goal.minShelfDays)), (any = true);
  if (goal.minHeat) (s += ratio(v.heat, goal.minHeat)), (any = true);
  if (goal.minCold) (s += ratio(v.cold, goal.minCold)), (any = true);
  if (goal.maxAcidity) (s += ratio(goal.maxAcidity, v.acidity)), (any = true);
  // Sans critère chiffré : léger bonus au rendement (au jardin si fourni) et aux sucres
  if (!any) s += Math.min(1, v.yield / 8) * 0.5 + engine.unitOf('brix', ind) * 0.5;
  return s;
}

export function goalIsEmpty(goal: BreedingGoal): boolean {
  return (
    !goal.color &&
    !goal.shape &&
    goal.striped === undefined &&
    !goal.anthocyanin &&
    !goal.habit &&
    !goal.leaf &&
    goal.dwarf === undefined &&
    goal.resistances.length === 0 &&
    !goal.minWeightG &&
    !goal.minBrix &&
    !goal.maxDays &&
    !goal.minYieldKg &&
    !goal.minCrack &&
    !goal.minShelfDays &&
    !goal.minHeat &&
    !goal.minCold &&
    !goal.maxAcidity
  );
}

export function runProgram(
  engine: TomatoEngine,
  a: TomatoIndividual,
  b: TomatoIndividual | null,
  goal: BreedingGoal,
  opts: { familySize?: number; maxGenerations?: number; testedCandidates?: number } = {}
): ProgramResult {
  const familySize = opts.familySize ?? 40;
  const maxGen = opts.maxGenerations ?? 10;
  const tested = opts.testedCandidates ?? 3;
  const steps: ProgramStep[] = [];
  const lineage: TomatoIndividual[] = [];
  let totalGrown = 0;

  const best = (list: TomatoIndividual[]) => [...list].sort((x, y) => goalScore(engine, y, goal) - goalScore(engine, x, goal));
  const qualRate = (list: TomatoIndividual[]) => list.filter((x) => qualitativeOk(engine, x, goal)).length / list.length;

  // Étape 1 : F1 (ou départ d'une plante seule)
  let parent: TomatoIndividual;
  if (b && b.id !== a.id) {
    const f1 = engine.cross(a, b, familySize, `${a.label} × ${b.label}`);
    totalGrown += f1.length;
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
  } else {
    parent = a;
  }

  let stopped: ProgramResult['stopped'] = 'max-generations';
  let lastFamilyMeetsQuant = false;
  let barren = 0;
  for (let g = 0; g < maxGen; g++) {
    const family = engine.cross(parent, parent, familySize, `${a.label}${b && b.id !== a.id ? ` × ${b.label}` : ''} ⊗`);
    totalGrown += family.length;
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
      const rate = qualRate(progeny);
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
