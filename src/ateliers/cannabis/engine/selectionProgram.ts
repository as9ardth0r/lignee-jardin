/**
 * Programme de sélection automatique.
 *
 * Au-delà du croisement simple (CrossPanel), ce module simule un petit
 * programme de sélection : à partir de deux fondateurs A (femelle) et
 * B (mâle), on cherche à obtenir — génération après génération — un
 * phénotype cible (chimiotype, seuils de CBD/THC, auto-floraison,
 * pigmentation violette, hauteur, résistance au froid, préférence
 * lumineuse ombre/soleil), en choisissant à chaque étape le meilleur
 * appariement possible parmi une portée simulée. Chaque dimension de
 * l'objectif peut être désactivée (laissée « indifférente ») ; seul le
 * chimiotype visé est toujours actif.
 *
 * Deux limites IMPORTANTES du modèle sous-jacent (genetics.ts), à
 * connaître avant de lancer un programme :
 *
 *  1. Auto-floraison : dans ce modèle, `enfant.autoflower =
 *     parentA.autoflower && parentB.autoflower`. Une fois qu'un seul
 *     ancêtre de la lignée n'est pas auto-floraison, AUCUN descendant
 *     ne pourra plus jamais l'être (le trait ne réapparaît pas comme
 *     un caractère récessif classique). Concrètement : viser
 *     l'auto-floraison n'a de sens QUE si les deux fondateurs choisis
 *     le sont déjà tous les deux.
 *
 *  2. Rétrocroisement seul insuffisant pour cumuler deux traits
 *     récessifs distincts : si le trait « CBD dominant » (BD/BD) et le
 *     trait « violette » (v/v) ne sont pas déjà réunis chez un même
 *     fondateur, rétrocroiser indéfiniment vers A ou B seul ne peut
 *     que réinjecter l'allèle dominant que ce fondateur porte pour le
 *     locus considéré. Il faut, à un moment, croiser deux descendants
 *     de la même portée (frère × sœur) qui portent chacun une partie
 *     des traits recherchés pour les cumuler puis les fixer — c'est
 *     ce que fait cette fonction en comparant les deux stratégies à
 *     chaque étape et en gardant la meilleure.
 */

import type { BreedingEngine, ChemotypeId, Individual, TerpeneKey, TerpeneProfile } from './genetics';

/** Cible à trois paliers pour un trait polygénique continu (hauteur,
 * résistance au froid, préférence lumineuse) — `null` = indifférent,
 * le trait n'entre alors pas dans le score. */
export type TraitTarget = 'faible' | 'moyen' | 'élevé' | null;

export interface SelectionGoal {
  chemotype: ChemotypeId;
  minCbd: number; // 0..1, 0 = indifférent — n'a de sens qu'en chimiotype I/II/III
  minThc: number; // 0..1, 0 = indifférent — n'a de sens qu'en chimiotype I/II/III
  /** Seuil de CBG visé, en % de matière sèche (0-100, 0 = indifférent)
   * — n'a de sens qu'en chimiotype IV (échelle différente de
   * minCbd/minThc ci-dessus, qui restent des ratios alléliques 0..1,
   * pour rester lisible face à `cbgPercent`). */
  minCbgPercent: number;
  /** Seuil de CBC visé, en % de matière sèche (0-100, 0 = indifférent)
   * — n'a de sens qu'en chimiotype VI (même échelle que
   * `minCbgPercent`, voir `cbcPercent` dans genetics.ts). */
  minCbcPercent: number;
  autoflower: boolean;
  violet: boolean;
  /** Série propyl/"varin" visée (THCV/CBDV/CBGV/CBCV au lieu de
   * THC/CBD/CBG/CBC) — voir `Individual.PROPYL` dans genetics.ts. */
  varin: boolean;
  /** Hauteur visée : faible = plante compacte, élevé = plante haute. */
  height: TraitTarget;
  /** Résistance au froid visée. */
  coldTolerance: TraitTarget;
  /** Préférence lumineuse visée : faible = tolère l'ombre, élevé = a
   * besoin de plein soleil. */
  sunTolerance: TraitTarget;
  /** Résistance moisissure/oïdium visée (voir `Individual.moldResistance`
   * dans genetics.ts). */
  moldResistance: TraitTarget;
  /** Terpène dominant visé dans le chemovar — `null` = indifférent
   * (n'entre alors pas dans le score). Voir `terpeneProfile` dans
   * genetics.ts : le caryophyllène et l'humulène restent liés (même
   * trait "sesquiterpene"), donc les deux peuvent apparaître ensemble
   * dans `dominantTerpenes` quel que soit celui visé ici. */
  terpeneTarget: TerpeneKey | null;
}

/** Lit la part relative (%) d'un terpène donné dans un `TerpeneProfile`
 * — évite un switch dupliqué entre le score et le résumé texte. */
function terpenePercentOf(profile: TerpeneProfile, key: TerpeneKey): number {
  switch (key) {
    case 'myrcene':
      return profile.myrcenePercent;
    case 'limonene':
      return profile.limonenePercent;
    case 'pinene':
      return profile.pinenePercent;
    case 'linalool':
      return profile.linaloolPercent;
    case 'caryophyllene':
      return profile.caryophyllenePercent;
    case 'humulene':
      return profile.humulenePercent;
    case 'terpinolene':
      return profile.terpinolenePercent;
  }
}

/** Libellés français par défaut des terpènes, pour les exports texte
 * (`formatProgramAsText`) qui restent en français quelle que soit la
 * langue de l'interface — même convention que le reste de ce fichier. */
const FR_TERPENE_LABEL: Record<TerpeneKey, string> = {
  myrcene: 'myrcène',
  limonene: 'limonène',
  pinene: 'pinène',
  linalool: 'linalol',
  caryophyllene: 'caryophyllène',
  humulene: 'humulène',
  terpinolene: 'terpinolène',
};

const BUCKET_CENTER: Record<'faible' | 'moyen' | 'élevé', number> = {
  faible: 20,
  moyen: 50,
  élevé: 80,
};

function bucketScore(percent: number, target: TraitTarget): number {
  if (!target) return 1;
  const center = BUCKET_CENTER[target];
  const dist = Math.abs(percent - center);
  return Math.max(0, 1 - dist / 40);
}

function bucketMatches(percent: number, target: TraitTarget): boolean {
  if (!target) return true;
  return Math.abs(percent - BUCKET_CENTER[target]) <= 15;
}

export interface ProgramStep {
  step: number;
  label: string;
  formula: string;
  generation: number;
  parentAId: string;
  parentALabel: string;
  parentBId: string;
  parentBLabel: string;
  pairingKind: 'F1' | 'rétrocroisement' | 'fratrie';
  individual: Individual;
  score: number;
  /** Détail du score par objectif actif (voir `scoreDetailed`) — pour
   * voir quels critères tirent le score vers le bas plutôt qu'un seul
   * nombre agrégé qui masque les compromis entre objectifs. */
  scoreDims: ScoreDimension[];
  matchesGoal: boolean;
  litterSize: number;
  /** Fraction de la portée de cette étape qui aurait passé un tri
   * génétique précoce (voir `passesMendelianFilters`) — 0 à 1. Indique
   * combien de semis auraient pu être écartés avant floraison avec une
   * sélection assistée par marqueurs, sans changer l'élite retenue. */
  mendelianPassRate: number;
  /** Nom d'un autre individu de CETTE MÊME portée (mêmes parents que
   * `individual`), retenu comme partenaire pour l'étape suivante
   * (stratégie « fratrie »). Sans cette annotation, ce second individu
   * apparaîtrait sans lignée visible dans les étapes suivantes — voir
   * l'en-tête du fichier. Absent si aucun partenaire de fratrie n'a
   * été retenu à cette étape. */
  siblingPartnerLabel?: string;
}

export interface SelectionProgramResult {
  steps: ProgramStep[];
  best: ProgramStep | null;
  goalReached: boolean;
  stoppedReason: 'goal-reached' | 'plateau' | 'max-generations' | 'no-pairing';
  warnings: string[];
  /** Individus de la chaîne (fondateurs inclus) à ajouter au catalogue
   * pour que la généalogie reste consultable dans l'app. */
  chainIndividuals: Individual[];
}

export interface SelectionProgramOptions {
  litterSize?: number;
  maxSteps?: number;
  plateauLimit?: number;
  scoreEpsilon?: number;
}

/** Attribue un nom lisible « Hybride N » à un individu qui n'en a pas
 * encore (fondateurs et individus déjà nommés dans une étape
 * précédente sont laissés tels quels). Un compteur partagé entre
 * l'élite de chaque étape ET les individus de fratrie utilisés comme
 * partenaires garantit que TOUT individu affiché dans une formule —
 * jamais seulement l'élite retenue — porte un nom, plutôt que l'id
 * technique brut du catalogue (ex. « G1-0007 »). */
function makeLabeler() {
  let counter = 0;
  return (ind: Individual): string => {
    if (!ind.label) {
      counter += 1;
      ind.label = `Hybride ${counter}`;
    }
    return ind.label;
  };
}

/** Score pondéré sur toutes les dimensions ACTIVES de l'objectif
 * (celles laissées à `0`/`false`/`null` sont indifférentes et ne
 * diluent pas le score). Le chimiotype reste toujours actif — c'est
 * le seul critère qu'on ne peut pas désactiver. */
/** Un objectif (chimiotype, CBD visé, hauteur...) noté séparément —
 * `label` en français, prêt à afficher tel quel. */
export interface ScoreDimension {
  key: string;
  label: string;
  score: number;
  weight: number;
}

/**
 * Détail du score par objectif actif, en plus du score global pondéré
 * — utile pour voir les compromis (« CBD élevé mais hauteur ratée »)
 * plutôt qu'un seul nombre agrégé qui masque quel critère tire le
 * score vers le bas. `scoreIndividual` reste le score global seul,
 * pour tout le code existant qui n'a besoin que d'un nombre à comparer.
 */
export function scoreDetailed(engine: BreedingEngine, ind: Individual, goal: SelectionGoal): { score: number; dims: ScoreDimension[] } {
  const pheno = engine.cannabinoidPhenotype(ind);
  const dims: ScoreDimension[] = [
    { key: 'chemotype', label: `chimiotype ${goal.chemotype}`, score: engine.chemotypeOf(ind) === goal.chemotype ? 1 : 0, weight: 0.25 },
  ];
  // minCbd/minThc n'ont de sens qu'en I/II/III (thc = cbd = 0 en
  // IV/V/VI par construction) — ignorés si le chimiotype visé est IV,
  // V ou VI, même si un ancien réglage de l'UI traînait encore une
  // valeur.
  const cbdThcApplicable = goal.chemotype !== 'IV' && goal.chemotype !== 'V' && goal.chemotype !== 'VI';
  if (cbdThcApplicable && goal.minCbd > 0) {
    dims.push({ key: 'cbd', label: 'CBD visé', score: Math.min(1, pheno.cbd / goal.minCbd), weight: 0.2 });
  }
  if (cbdThcApplicable && goal.minThc > 0) {
    dims.push({ key: 'thc', label: 'THC visé', score: Math.min(1, pheno.thc / goal.minThc), weight: 0.15 });
  }
  if (goal.chemotype === 'IV' && goal.minCbgPercent > 0) {
    dims.push({ key: 'cbg', label: 'CBG visé', score: Math.min(1, pheno.cbgPercent / goal.minCbgPercent), weight: 0.2 });
  }
  if (goal.chemotype === 'VI' && goal.minCbcPercent > 0) {
    dims.push({ key: 'cbc', label: 'CBC visé', score: Math.min(1, pheno.cbcPercent / goal.minCbcPercent), weight: 0.2 });
  }
  if (goal.autoflower) dims.push({ key: 'autoflower', label: 'auto-floraison', score: ind.autoflower ? 1 : 0, weight: 0.1 });
  if (goal.violet) {
    dims.push({
      key: 'violet',
      label: 'pigmentation violette',
      score: engine.isVioletExpressed(ind) ? 1 : engine.isVioletCarrier(ind) ? 0.35 : 0,
      weight: 0.1,
    });
  }
  if (goal.varin) {
    dims.push({
      key: 'varin',
      label: 'série propyl/varin',
      score: engine.isVarinExpressed(ind) ? 1 : engine.isVarinCarrier(ind) ? 0.35 : 0,
      weight: 0.1,
    });
  }
  if (goal.height) dims.push({ key: 'height', label: 'hauteur', score: bucketScore(engine.heightPercent(ind), goal.height), weight: 0.1 });
  if (goal.coldTolerance) {
    dims.push({ key: 'cold', label: 'résistance au froid', score: bucketScore(engine.coldTolerancePercent(ind), goal.coldTolerance), weight: 0.1 });
  }
  if (goal.sunTolerance) {
    dims.push({ key: 'sun', label: 'besoin de lumière', score: bucketScore(engine.sunTolerancePercent(ind), goal.sunTolerance), weight: 0.1 });
  }
  if (goal.moldResistance) {
    dims.push({
      key: 'mold',
      label: 'résistance moisissure/oïdium',
      score: bucketScore(engine.moldResistancePercent(ind), goal.moldResistance),
      weight: 0.1,
    });
  }
  if (goal.terpeneTarget) {
    // Score proportionnel à la part du terpène visé dans le mélange,
    // plafonné à 1 dès qu'il franchit le seuil de dominance (~10%, voir
    // `terpeneProfile` dans genetics.ts) — pas besoin d'aller au-delà.
    const pct = terpenePercentOf(engine.terpeneProfile(ind), goal.terpeneTarget);
    dims.push({ key: 'terpene', label: 'terpène dominant', score: Math.min(1, pct / 10), weight: 0.1 });
  }

  const totalWeight = dims.reduce((sum, d) => sum + d.weight, 0);
  const score = dims.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight;
  return { score, dims };
}

export function scoreIndividual(engine: BreedingEngine, ind: Individual, goal: SelectionGoal): number {
  return scoreDetailed(engine, ind, goal).score;
}

function meetsGoal(engine: BreedingEngine, ind: Individual, goal: SelectionGoal): boolean {
  const pheno = engine.cannabinoidPhenotype(ind);
  const cbdThcApplicable = goal.chemotype !== 'IV' && goal.chemotype !== 'V' && goal.chemotype !== 'VI';
  return (
    engine.chemotypeOf(ind) === goal.chemotype &&
    (!cbdThcApplicable || goal.minCbd === 0 || pheno.cbd >= goal.minCbd) &&
    (!cbdThcApplicable || goal.minThc === 0 || pheno.thc >= goal.minThc) &&
    (goal.chemotype !== 'IV' || goal.minCbgPercent === 0 || pheno.cbgPercent >= goal.minCbgPercent) &&
    (goal.chemotype !== 'VI' || goal.minCbcPercent === 0 || pheno.cbcPercent >= goal.minCbcPercent) &&
    (!goal.autoflower || ind.autoflower) &&
    (!goal.violet || engine.isVioletExpressed(ind)) &&
    (!goal.varin || engine.isVarinExpressed(ind)) &&
    bucketMatches(engine.heightPercent(ind), goal.height) &&
    bucketMatches(engine.coldTolerancePercent(ind), goal.coldTolerance) &&
    bucketMatches(engine.sunTolerancePercent(ind), goal.sunTolerance) &&
    bucketMatches(engine.moldResistancePercent(ind), goal.moldResistance) &&
    (!goal.terpeneTarget || engine.terpeneProfile(ind).dominantTerpenes.includes(goal.terpeneTarget))
  );
}

/**
 * Sous-ensemble des critères de `meetsGoal` déterminables par un test
 * génétique précoce (avant floraison) plutôt qu'en attendant
 * l'expression phénotypique complète — chimiotype, auto-floraison,
 * violet et varin sont tous des loci mendéliens simples (voir
 * genetics.ts), génotypables de façon fiable sur de jeunes semis
 * (comme le sexage précoce ou les kits de test chimiotype réels basés
 * sur le locus B). Les traits polygéniques (hauteur, froid, lumière,
 * terpènes) n'ont PAS de marqueur simple équivalent documenté pour le
 * cannabis — ils restent exclus de ce pré-tri, d'où le tri complet
 * qui reste nécessaire même avec sélection assistée par marqueurs.
 * Sert à estimer l'intérêt pratique (espace de culture économisé, pas
 * de gain de temps calendaire) d'un tri précoce — n'affecte PAS le
 * choix de l'élite lui-même, qui reste basé sur le phénotype complet
 * simulé.
 */
function passesMendelianFilters(engine: BreedingEngine, ind: Individual, goal: SelectionGoal): boolean {
  return (
    engine.chemotypeOf(ind) === goal.chemotype &&
    (!goal.autoflower || ind.autoflower) &&
    (!goal.violet || engine.isVioletExpressed(ind)) &&
    (!goal.varin || engine.isVarinExpressed(ind))
  );
}

function labelOf(ind: Individual): string {
  return ind.label || ind.presetLabel || ind.id;
}

export function runSelectionProgram(
  engine: BreedingEngine,
  parentA: Individual,
  parentB: Individual,
  goal: SelectionGoal,
  opts: SelectionProgramOptions = {}
): SelectionProgramResult {
  const litterSize = opts.litterSize ?? 24;
  const maxSteps = opts.maxSteps ?? 12;
  const plateauLimit = opts.plateauLimit ?? 3;
  const scoreEpsilon = opts.scoreEpsilon ?? 0.01;

  const warnings: string[] = [];
  if (goal.autoflower && !(parentA.autoflower && parentB.autoflower)) {
    warnings.push(
      "Objectif auto-floraison choisi, mais A et B ne sont pas tous les deux auto-floraison. Dans ce modèle, l'auto-floraison d'un descendant exige que SES DEUX parents le soient — elle ne réapparaît jamais après avoir disparu d'une lignée. Cet objectif est donc inatteignable avec ces deux fondateurs ; le programme continuera pour les autres critères."
    );
  }

  const chain = new Map<string, Individual>([
    [parentA.id, parentA],
    [parentB.id, parentB],
  ]);

  const ensureLabel = makeLabeler();
  const steps: ProgramStep[] = [];
  let currentA = parentA;
  let currentB = parentB;
  let currentKind: ProgramStep['pairingKind'] = 'F1';
  let bestEver: ProgramStep | null = null;
  let plateauCount = 0;
  let stoppedReason: SelectionProgramResult['stoppedReason'] = 'max-generations';

  for (let step = 1; step <= maxSteps; step++) {
    const litter = engine.crossMany(currentA, currentB, litterSize);
    let elite = litter[0];
    let eliteScore = scoreIndividual(engine, elite, goal);
    for (const ind of litter) {
      const s = scoreIndividual(engine, ind, goal);
      if (s > eliteScore) {
        elite = ind;
        eliteScore = s;
      }
    }

    const stepLabel = ensureLabel(elite);
    chain.set(elite.id, elite);

    const record: ProgramStep = {
      step,
      label: stepLabel,
      formula: `${labelOf(currentA)} × ${labelOf(currentB)} = ${stepLabel}`,
      generation: elite.generation,
      parentAId: currentA.id,
      parentALabel: labelOf(currentA),
      parentBId: currentB.id,
      parentBLabel: labelOf(currentB),
      pairingKind: currentKind,
      individual: elite,
      score: eliteScore,
      scoreDims: scoreDetailed(engine, elite, goal).dims,
      matchesGoal: meetsGoal(engine, elite, goal),
      litterSize,
      mendelianPassRate: litter.filter((ind) => passesMendelianFilters(engine, ind, goal)).length / litter.length,
    };
    steps.push(record);

    if (!bestEver || record.score > bestEver.score + scoreEpsilon) {
      bestEver = record;
      plateauCount = 0;
    } else {
      plateauCount += 1;
    }

    if (record.matchesGoal) {
      stoppedReason = 'goal-reached';
      break;
    }
    if (plateauCount >= plateauLimit) {
      stoppedReason = 'plateau';
      break;
    }

    // Deux stratégies d'appariement candidates pour l'étape suivante :
    // rétrocroisement de l'élite vers le fondateur de sexe opposé, ou
    // croisement avec le meilleur individu de sexe opposé de la même
    // portée (fratrie) — utile pour cumuler des traits récessifs
    // distincts. On échantillonne les deux et on garde la meilleure.
    const backcrossTarget = elite.sex === 'F' ? currentB : currentA;
    const bestSibling = litter
      .filter((ind) => ind.sex !== elite.sex && ind.id !== elite.id)
      .sort((a, b) => scoreIndividual(engine, b, goal) - scoreIndividual(engine, a, goal))[0];

    const candidates: Array<{ a: Individual; b: Individual; kind: ProgramStep['pairingKind'] }> = [];
    if (backcrossTarget) {
      candidates.push(
        elite.sex === 'F'
          ? { a: elite, b: backcrossTarget, kind: 'rétrocroisement' }
          : { a: backcrossTarget, b: elite, kind: 'rétrocroisement' }
      );
    }
    if (bestSibling) {
      candidates.push(
        elite.sex === 'F' ? { a: elite, b: bestSibling, kind: 'fratrie' } : { a: bestSibling, b: elite, kind: 'fratrie' }
      );
    }

    if (candidates.length === 0) {
      stoppedReason = 'no-pairing';
      break;
    }

    let chosen = candidates[0];
    let chosenScore = -1;
    for (const c of candidates) {
      const sample = engine.crossMany(c.a, c.b, 8);
      const avg = sample.reduce((sum, ind) => sum + scoreIndividual(engine, ind, goal), 0) / sample.length;
      if (avg > chosenScore) {
        chosenScore = avg;
        chosen = c;
      }
    }

    // Le partenaire de fratrie choisi ici (issu de la même portée que
    // l'élite, jamais rencontré avant) est sur le point de devenir
    // currentA/currentB : il apparaîtra donc dans la formule de la
    // PROCHAINE étape. On lui donne un nom dès maintenant, sinon son id
    // technique brut (ex. « G2-0048 ») s'afficherait à la place.
    ensureLabel(chosen.a);
    ensureLabel(chosen.b);

    // Si la stratégie retenue est « fratrie », le partenaire choisi
    // (bestSibling) est un individu tout nouveau, issu de LA MÊME
    // portée que l'élite de cette étape (mêmes parents : currentA ×
    // currentB) — on l'annote sur l'étape en cours pour que sa lignée
    // reste visible, plutôt que de le laisser surgir sans origine à
    // l'étape suivante.
    if (chosen.kind === 'fratrie' && bestSibling && bestSibling.label) {
      record.siblingPartnerLabel = bestSibling.label;
    }

    chain.set(chosen.a.id, chosen.a);
    chain.set(chosen.b.id, chosen.b);
    currentA = chosen.a;
    currentB = chosen.b;
    currentKind = chosen.kind;
  }

  // Enchaîner fratries/rétrocroisements sur une lignée fermée à 2
  // fondateurs fait grimper la consanguinité (voir
  // `Individual.inbreedingCoefficient`) — on prévient quand le
  // meilleur résultat en porte une trace significative, plutôt que
  // de laisser la perte de vigueur associée passer inaperçue.
  const finalF = bestEver?.individual.inbreedingCoefficient ?? 0;
  if (finalF >= 0.25) {
    const vigorLossPercent = Math.round(finalF * 80);
    warnings.push(
      `Consanguinité élevée sur le meilleur résultat (F≈${Math.round(finalF * 100)}%) — vigueur réduite d'environ ${vigorLossPercent}% par rapport à un croisement entre lignées non apparentées. Envisager d'introduire du sang neuf (nouveau fondateur non apparenté) si la vigueur devient un critère important.`
    );
  }

  return {
    steps,
    best: bestEver,
    goalReached: stoppedReason === 'goal-reached',
    stoppedReason,
    warnings,
    chainIndividuals: Array.from(chain.values()),
  };
}

export function formatProgramAsText(
  engine: BreedingEngine,
  parentA: Individual,
  parentB: Individual,
  result: SelectionProgramResult,
  goal: SelectionGoal
): string {
  const lines: string[] = [];
  lines.push('Programme de sélection — Lignée');
  lines.push('================================');
  lines.push('');
  lines.push(
    `Fondateurs : A = ${labelOf(parentA)} (femelle) · B = ${labelOf(parentB)} (mâle)`
  );
  const goalParts = [`chimiotype ${goal.chemotype}`];
  if (goal.minCbd > 0) goalParts.push(`CBD ≥ ${Math.round(goal.minCbd * 100)}%`);
  if (goal.minThc > 0) goalParts.push(`THC ≥ ${Math.round(goal.minThc * 100)}%`);
  if (goal.minCbgPercent > 0) goalParts.push(`CBG ≥ ${goal.minCbgPercent}%`);
  if (goal.minCbcPercent > 0) goalParts.push(`CBC ≥ ${goal.minCbcPercent}%`);
  if (goal.autoflower) goalParts.push('auto-floraison');
  if (goal.violet) goalParts.push('pigmentation violette exprimée');
  if (goal.varin) goalParts.push('série propyl/varin exprimée (THCV/CBDV)');
  if (goal.height) goalParts.push(`hauteur ${goal.height}`);
  if (goal.coldTolerance) goalParts.push(`résistance au froid ${goal.coldTolerance}`);
  if (goal.sunTolerance) goalParts.push(`besoin de lumière ${goal.sunTolerance}`);
  if (goal.moldResistance) goalParts.push(`résistance moisissure/oïdium ${goal.moldResistance}`);
  if (goal.terpeneTarget) goalParts.push(`terpène dominant visé : ${FR_TERPENE_LABEL[goal.terpeneTarget]}`);
  lines.push(`Objectif : ${goalParts.join(', ')}`);
  lines.push('');
  lines.push('Légende : [F1] = première génération, issue directement des deux fondateurs.');
  lines.push('[fratrie] = croisement entre deux individus nés de la même portée (frère × sœur), utile pour');
  lines.push('combiner deux traits récessifs distincts. [rétrocroisement] = croisement avec un individu déjà');
  lines.push('présent dans la lignée (pas forcément un fondateur d\'origine) qui améliore le score moyen.');
  lines.push('À chaque génération, les deux stratégies sont testées et celle qui obtient le meilleur score');
  lines.push('moyen sur l\'ensemble des critères est retenue — ce n\'est pas un retour systématique aux fondateurs.');
  lines.push('');
  if (result.warnings.length) {
    for (const w of result.warnings) lines.push(`⚠ ${w}`);
    lines.push('');
  }
  for (const s of result.steps) {
    const p = engine.cannabinoidPhenotype(s.individual);
    const extra: string[] = [];
    if (s.individual.autoflower) extra.push('auto-floraison');
    if (engine.isVioletExpressed(s.individual)) extra.push('violette exprimée');
    else if (engine.isVioletCarrier(s.individual)) extra.push('porteuse masquée du violet');
    if (engine.isVarinExpressed(s.individual)) extra.push('série varin exprimée');
    else if (engine.isVarinCarrier(s.individual)) extra.push('porteuse masquée du varin');
    if (goal.height) extra.push(`hauteur ${engine.heightPercent(s.individual).toFixed(0)}%`);
    if (goal.coldTolerance) extra.push(`froid ${engine.coldTolerancePercent(s.individual).toFixed(0)}%`);
    if (goal.sunTolerance) extra.push(`lumière ${engine.sunTolerancePercent(s.individual).toFixed(0)}%`);
    if (goal.moldResistance) extra.push(`moisissure ${engine.moldResistancePercent(s.individual).toFixed(0)}%`);
    if (goal.terpeneTarget) {
      const pct = terpenePercentOf(engine.terpeneProfile(s.individual), goal.terpeneTarget);
      extra.push(`${FR_TERPENE_LABEL[goal.terpeneTarget]} ${pct}%`);
    }
    const cannabinoidPart = p.propylSeries
      ? p.chemotype === 'IV'
        ? `CBGV ${p.cbgvPercent}%`
        : p.chemotype === 'VI'
          ? `CBCV ${p.cbcvPercent}%`
          : p.chemotype === 'V'
            ? `cannabinoïdes ${p.totalPotencyPercent}%`
            : `CBDV ${p.cbdvPercent}%, THCV ${p.thcvPercent}%`
      : p.chemotype === 'IV'
        ? `CBG ${p.cbgPercent}%`
        : p.chemotype === 'VI'
          ? `CBC ${p.cbcPercent}%`
          : p.chemotype === 'V'
            ? `cannabinoïdes ${p.totalPotencyPercent}%`
            : `CBD ${p.cbdPercent}%, THC ${p.thcPercent}%`;
    lines.push(
      `${s.formula}  [${s.pairingKind}, gén. ${s.generation}, ${s.individual.sex === 'F' ? '♀' : '♂'}] — ` +
        `chimiotype ${engine.chemotypeOf(s.individual)}, ${cannabinoidPart}` +
        `${extra.length ? ', ' + extra.join(', ') : ''}` +
        ` — score ${(s.score * 100).toFixed(0)}%${s.matchesGoal ? ' ✔ objectif atteint' : ''}`
    );
    if (s.scoreDims.length > 1) {
      lines.push(
        `  · détail : ${s.scoreDims.map((d) => `${d.label} ${(d.score * 100).toFixed(0)}%`).join(', ')}`
      );
    }
    if (s.siblingPartnerLabel) {
      lines.push(
        `  ↳ ${s.siblingPartnerLabel} : autre individu de cette même portée (${s.formula.split(' = ')[0]}), retenu comme partenaire pour l'étape suivante`
      );
    }
  }
  lines.push('');
  const outcome =
    result.stoppedReason === 'goal-reached'
      ? 'Objectif atteint.'
      : result.stoppedReason === 'plateau'
        ? "Le programme a stagné (pas d'amélioration significative sur plusieurs générations) — voici le meilleur individu obtenu."
        : result.stoppedReason === 'no-pairing'
          ? "Plus aucun appariement possible — voici le meilleur individu obtenu."
          : 'Nombre maximal de générations atteint — voici le meilleur individu obtenu.';
  lines.push(outcome);
  if (result.best) {
    lines.push(`Meilleur résultat : ${result.best.label} (score ${(result.best.score * 100).toFixed(0)}%)`);
  }
  return lines.join('\n');
}

export function programToJson(
  engine: BreedingEngine,
  parentA: Individual,
  parentB: Individual,
  result: SelectionProgramResult,
  goal: SelectionGoal
) {
  return {
    founders: {
      A: { id: parentA.id, label: labelOf(parentA), sex: parentA.sex },
      B: { id: parentB.id, label: labelOf(parentB), sex: parentB.sex },
    },
    goal,
    warnings: result.warnings,
    goalReached: result.goalReached,
    stoppedReason: result.stoppedReason,
    steps: result.steps.map((s) => {
      const p = engine.cannabinoidPhenotype(s.individual);
      return {
        step: s.step,
        label: s.label,
        formula: s.formula,
        pairingKind: s.pairingKind,
        generation: s.generation,
        parentA: s.parentALabel,
        parentB: s.parentBLabel,
        individualId: s.individual.id,
        sex: s.individual.sex,
        chemotype: engine.chemotypeOf(s.individual),
        thc: p.thc,
        cbd: p.cbd,
        cbg: p.cbg,
        cbc: p.cbc,
        thcPercent: p.thcPercent,
        cbdPercent: p.cbdPercent,
        cbgPercent: p.cbgPercent,
        cbcPercent: p.cbcPercent,
        totalPotencyPercent: p.totalPotencyPercent,
        autoflower: s.individual.autoflower,
        violetExpressed: engine.isVioletExpressed(s.individual),
        violetCarrier: engine.isVioletCarrier(s.individual),
        heightPercent: engine.heightPercent(s.individual),
        coldTolerancePercent: engine.coldTolerancePercent(s.individual),
        sunTolerancePercent: engine.sunTolerancePercent(s.individual),
        moldResistancePercent: engine.moldResistancePercent(s.individual),
        terpeneProfile: engine.terpeneProfile(s.individual),
        chemovarLabel: engine.chemovarLabel(s.individual),
        score: s.score,
        scoreDims: s.scoreDims,
        matchesGoal: s.matchesGoal,
        siblingPartnerLabel: s.siblingPartnerLabel ?? null,
        mendelianPassRate: s.mendelianPassRate,
      };
    }),
    best: result.best ? { label: result.best.label, score: result.best.score } : null,
  };
}
