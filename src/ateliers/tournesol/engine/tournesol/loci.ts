/**
 * Espèces et loci mendéliens du tournesol (Helianthus annuus, 2n = 34).
 *
 * Le tournesol a été domestiqué en Amérique du Nord il y a plus de 4 000
 * ans. La domestication a fixé deux caractères récessifs ou rares chez la
 * plante sauvage : une TIGE UNIQUE à un seul grand capitule (le sauvage est
 * très ramifié, à petits capitules) et l’AUTO-COMPATIBILITÉ (le tournesol
 * sauvage refuse son propre pollen).
 *
 * Gènes modélisés :
 *  - couleur des fleurs ligulées (les « pétales ») : jaune d’or, citron
 *    (ly, récessif), orange (Or, modèle simplifié), crème (cr, modèle
 *    simplifié) ; ROUGE (Rd), découvert en 1910 par T. D. A. Cockerell
 *    dans un tournesol sauvage du Colorado : dominance incomplète, une
 *    dose donne des ligules bicolores (bronze), deux doses rouge acajou ;
 *  - cœur (disque) foncé P, dominant, ou clair (p, récessif) ;
 *  - fleurs DOUBLES (Dbl) : mutation du gène HaCYC2c (Chapman et al.
 *    2012), les fleurons tubulaires du cœur deviennent ligulés ; une dose
 *    donne un capitule semi-double, deux doses le « nounours » ;
 *  - RAMIFICATION (b, récessif ; groupe de liaison 10) ;
 *  - NANISME (dw, récessif, modèle simplifié) ;
 *  - STÉRILITÉ MÂLE (ms1, nucléaire, récessive) : fleurs sans pollen, comme
 *    les tournesols à bouquet « sans pollen » (en réalité, ceux du commerce
 *    sont des hybrides à stérilité CYTOPLASMIQUE, CMS PET1, Leclercq 1969 :
 *    modèle simplifié) ;
 *  - résistance au MILDIOU (Pl, dominante, type Pl6 ; groupe 8) ;
 *  - AUTO-INCOMPATIBILITÉ des tournesols sauvages (allèles S). Chez le
 *    tournesol elle est sporophytique ; le moteur la simule par le
 *    modèle gamétophytique commun (simplification).
 * Positions sur les chromosomes : seules la ramification et la résistance
 * au mildiou sont placées, approximativement ; les autres gènes sont
 * traités comme indépendants.
 */

export type SpeciesId = 'annuus' | 'petiolaris' | 'argophyllus' | 'debilis' | 'maximiliani' | 'tuberosus';

export const SPECIES: SpeciesId[] = ['annuus', 'petiolaris', 'argophyllus', 'debilis', 'maximiliani', 'tuberosus'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt; genus: 'Helianthus' }> = {
  annuus: {
    latin: 'Helianthus annuus',
    short: 'H. annuus',
    name: T('Tournesol', 'Sunflower'),
    examples: T('tournesols à bouquet, géants, nains, oléagineux ; tournesol sauvage des Grandes Plaines', 'cut-flower, giant, dwarf and oilseed sunflowers; wild sunflower of the Great Plains'),
    genus: 'Helianthus',
  },
  petiolaris: {
    latin: 'Helianthus petiolaris',
    short: 'H. petiolaris',
    name: T('Tournesol des prairies', 'Prairie sunflower'),
    examples: T('petit tournesol des sols sableux ; source de la stérilité mâle cytoplasmique PET1', 'small sunflower of sandy soils; source of the PET1 cytoplasmic male sterility'),
    genus: 'Helianthus',
  },
  argophyllus: {
    latin: 'Helianthus argophyllus',
    short: 'H. argophyllus',
    name: T('Tournesol argenté', 'Silverleaf sunflower'),
    examples: T('feuilles couvertes de poils argentés, Texas ; source de résistances', 'leaves covered in silver hairs, Texas; source of resistances'),
    genus: 'Helianthus',
  },
  debilis: {
    latin: 'Helianthus debilis',
    short: 'H. debilis',
    name: T('Tournesol à feuilles de concombre', 'Cucumberleaf sunflower'),
    examples: T('ramifié, petites fleurs ; « Italian White » à ligules crème', 'branched, small flowers; “Italian White” with cream rays'),
    genus: 'Helianthus',
  },
  maximiliani: {
    latin: 'Helianthus maximiliani',
    short: 'H. maximiliani',
    name: T('Tournesol de Maximilien', 'Maximilian sunflower'),
    examples: T('vivace des prairies, floraison d’automne ; croisements très difficiles', 'prairie perennial, autumn flowering; very difficult crosses'),
    genus: 'Helianthus',
  },
  tuberosus: {
    latin: 'Helianthus tuberosus',
    short: 'H. tuberosus',
    name: T('Topinambour', 'Jerusalem artichoke'),
    examples: T('vivace à tubercules, hexaploïde (2n = 102) : pas d’hybride au jardin', 'tuberous perennial, hexaploid (2n = 102): no hybrid in the garden'),
    genus: 'Helianthus',
  },
};

export type HaLocusId = 'ly' | 'or' | 'cr' | 'rd' | 'p' | 'dbl' | 'b' | 'dw' | 'ms' | 'pl' | 's';

export type VariantId = 'ly' | 'Or' | 'cr' | 'Rd' | 'p' | 'Dbl' | 'b' | 'dw' | 'ms' | 'Pl' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5';

export type LocusCategory = 'color' | 'shape' | 'flower' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: HaLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  /** Locus sans effet visible : exclu de la prédiction de Mendel. */
  silent?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  simplified?: boolean;
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const ANN: SpeciesId[] = ['annuus'];
const WILD: SpeciesId[] = ['petiolaris', 'argophyllus', 'debilis', 'maximiliani', 'tuberosus'];
const ALL: SpeciesId[] = ['annuus', ...WILD];

const S_ALLELES: AlleleDef[] = [
  { allele: 'S1', id: 'S1' },
  { allele: 'S2', id: 'S2' },
  { allele: 'S3', id: 'S3' },
  { allele: 'S4', id: 'S4' },
  { allele: 'S5', id: 'S5' },
  { allele: 'Sc', name: T('Auto-compatible', 'Self-compatible'), effect: T('Allèle du tournesol cultivé : la plante accepte son propre pollen.', 'Allele of the cultivated sunflower: the plant accepts its own pollen.') },
];

export const HA_LOCI: LocusDef[] = [
  // --- Couleur des ligules ---------------------------------------------------------------
  {
    id: 'ly',
    symbol: 'ly',
    category: 'color',
    name: T('Jaune d’or / citron', 'Golden / lemon yellow'),
    alleles: [
      { allele: 'Ly', name: T('Jaune d’or', 'Golden yellow') },
      { allele: 'ly', id: 'ly', name: T('Jaune citron (ly)', 'Lemon yellow (ly)'), effect: T('Récessif : ligules jaune pâle, citron, comme « Lemon Queen » ou « Valentine ».', 'Recessive: pale, lemon-yellow rays, as in “Lemon Queen” or “Valentine”.') },
    ],
    standard: 'Ly',
    documented: ANN,
    hypothetical: WILD,
    cM: 0,
  },
  {
    id: 'or',
    symbol: 'Or',
    category: 'color',
    name: T('Orange (modèle simplifié)', 'Orange (simplified model)'),
    alleles: [
      { allele: 'Or', id: 'Or', name: T('Orangé (Or)', 'Orange (Or)'), effect: T('Dominant (modèle simplifié) : plus de caroténoïdes, ligules orangées comme « Orange Sun » ou « Sunrich Orange ».', 'Dominant (simplified model): more carotenoids, orange rays as in “Orange Sun” or “Sunrich Orange”.') },
      { allele: 'or', name: T('Sans orangé', 'No orange') },
    ],
    standard: 'or',
    documented: [],
    hypothetical: ALL,
    simplified: true,
    cM: 0,
  },
  {
    id: 'cr',
    symbol: 'cr',
    category: 'color',
    name: T('Crème (modèle simplifié)', 'Cream (simplified model)'),
    alleles: [
      { allele: 'Cr', name: T('Ligules colorées', 'Coloured rays') },
      { allele: 'cr', id: 'cr', name: T('Crème (cr)', 'Cream (cr)'), effect: T('Récessif (modèle simplifié) : presque plus de caroténoïdes, ligules crème ou ivoire, comme « Italian White » ou « Vanilla Ice ».', 'Recessive (simplified model): hardly any carotenoids, cream or ivory rays, as in “Italian White” or “Vanilla Ice”.') },
    ],
    standard: 'Cr',
    documented: [],
    hypothetical: ALL,
    simplified: true,
    cM: 0,
  },
  {
    id: 'rd',
    symbol: 'Rd',
    category: 'color',
    name: T('Rouge de Cockerell', 'Cockerell’s red'),
    alleles: [
      { allele: 'Rd', id: 'Rd', name: T('Rouge (Rd)', 'Red (Rd)'), effect: T('Anthocyanes dans les ligules. Dominance incomplète : une dose donne des ligules bicolores, rouges à la base et jaunes au bout (bronze), deux doses des ligules rouge acajou. Trouvé en 1910 par Cockerell dans un tournesol sauvage du Colorado.', 'Anthocyanins in the rays. Incomplete dominance: one dose gives bicolour rays, red at the base and yellow at the tip (bronze), two doses mahogany-red rays. Found in 1910 by Cockerell in a wild sunflower in Colorado.') },
      { allele: 'rd', name: T('Sans rouge', 'No red') },
    ],
    standard: 'rd',
    incomplete: true,
    documented: ANN,
    hypothetical: WILD,
    cM: 0,
  },
  {
    id: 'p',
    symbol: 'p',
    category: 'color',
    name: T('Cœur foncé / clair', 'Dark / light disc'),
    alleles: [
      { allele: 'P', name: T('Cœur foncé', 'Dark disc') },
      { allele: 'p', id: 'p', name: T('Cœur clair (p)', 'Light disc (p)'), effect: T('Récessif : fleurons du cœur sans anthocyanes, cœur vert ou jaune, comme « Sunrich Lemon » ou « Vincent’s Fresh ».', 'Recessive: disc florets without anthocyanins, green or yellow disc, as in “Sunrich Lemon” or “Vincent’s Fresh”.') },
    ],
    standard: 'P',
    documented: ANN,
    hypothetical: WILD,
    cM: 0,
  },

  // --- Forme et port ---------------------------------------------------------------------------
  {
    id: 'dbl',
    symbol: 'Dbl',
    category: 'shape',
    name: T('Fleurs doubles (HaCYC2c)', 'Double flowers (HaCYC2c)'),
    alleles: [
      { allele: 'Dbl', id: 'Dbl', name: T('Double (Dbl)', 'Double (Dbl)'), effect: T('Mutation du gène HaCYC2c : les fleurons tubulaires du cœur deviennent ligulés. Une dose : semi-double ; deux doses : capitule entièrement double, « nounours » (Teddy Bear). Pas de cœur, donc presque pas de graines.', 'HaCYC2c mutation: the tubular disc florets turn into rays. One dose: semi-double; two doses: fully double head, “Teddy Bear”. No disc, so hardly any seed.') },
      { allele: 'dbl', name: T('Simple', 'Single') },
    ],
    standard: 'dbl',
    incomplete: true,
    documented: ANN,
    simplified: true,
    cM: 0,
  },
  {
    id: 'b',
    symbol: 'b',
    category: 'shape',
    name: T('Ramification', 'Branching'),
    alleles: [
      { allele: 'B', name: T('Tige unique', 'Single stem') },
      { allele: 'b', id: 'b', name: T('Ramifié (b)', 'Branched (b)'), effect: T('Récessif : la plante se ramifie et porte de nombreux petits capitules, comme le tournesol sauvage. La tige unique à un grand capitule est un caractère de domestication.', 'Recessive: the plant branches and carries many small heads, like the wild sunflower. The single stem with one large head is a domestication trait.') },
    ],
    standard: 'B',
    documented: ANN,
    hypothetical: WILD,
    chromosome: 10,
    cM: 60,
  },
  {
    id: 'dw',
    symbol: 'dw',
    category: 'shape',
    name: T('Nanisme (modèle simplifié)', 'Dwarfism (simplified model)'),
    alleles: [
      { allele: 'Dw', name: T('Taille normale', 'Normal height') },
      { allele: 'dw', id: 'dw', name: T('Nain (dw)', 'Dwarf (dw)'), effect: T('Récessif (modèle simplifié) : entre-nœuds courts, plante de 40 à 90 cm, comme « Teddy Bear », « Big Smile » ou « Sunspot ».', 'Recessive (simplified model): short internodes, 40–90 cm plant, as in “Teddy Bear”, “Big Smile” or “Sunspot”.') },
    ],
    standard: 'Dw',
    documented: ANN,
    simplified: true,
    cM: 0,
  },

  // --- Reproduction ------------------------------------------------------------------------------
  {
    id: 'ms',
    symbol: 'ms1',
    category: 'flower',
    name: T('Stérilité mâle (sans pollen)', 'Male sterility (pollenless)'),
    alleles: [
      { allele: 'Ms', name: T('Pollen fertile', 'Fertile pollen') },
      { allele: 'ms', id: 'ms', name: T('Sans pollen (ms1)', 'Pollenless (ms1)'), effect: T('Récessif : anthères vides, aucun pollen. Idéal en bouquet (pas de pollen sur la nappe, fleurs qui durent plus) ; la plante ne peut être que MÈRE. Les tournesols « sans pollen » du commerce sont des hybrides à stérilité cytoplasmique (CMS) : modèle simplifié.', 'Recessive: empty anthers, no pollen. Ideal for bunches (no pollen on the tablecloth, longer-lasting flowers); the plant can only be a MOTHER. Commercial “pollenless” sunflowers are cytoplasmic male sterile (CMS) hybrids: simplified model.') },
    ],
    standard: 'Ms',
    documented: ANN,
    cM: 0,
  },
  {
    id: 's',
    symbol: 'S',
    category: 'flower',
    name: T('Auto-incompatibilité', 'Self-incompatibility'),
    alleles: S_ALLELES,
    standard: 'Sc',
    silent: true,
    documented: ALL,
    cM: 0,
  },

  // --- Résistance -------------------------------------------------------------------------------
  {
    id: 'pl',
    symbol: 'Pl',
    category: 'resistance',
    name: T('Résistance au mildiou', 'Downy mildew resistance'),
    alleles: [
      { allele: 'Pl', id: 'Pl', name: T('Résistant au mildiou (Pl)', 'Downy mildew resistant (Pl)'), effect: T('Dominant (type Pl6) : protège contre les races courantes du mildiou du tournesol (Plasmopara halstedii). De nouvelles races contournent régulièrement ces gènes.', 'Dominant (Pl6 type): protects against the common races of sunflower downy mildew (Plasmopara halstedii). New races regularly overcome these genes.') },
      { allele: 'pl', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'pl',
    documented: ANN,
    hypothetical: ['argophyllus'],
    chromosome: 8,
    cM: 40,
  },
];

export const LOCUS_BY_ID: Record<HaLocusId, LocusDef> = Object.fromEntries(HA_LOCI.map((l) => [l.id, l])) as Record<HaLocusId, LocusDef>;
export const LOCUS_IDS: HaLocusId[] = HA_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [HaLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [HaLocusId, string]>;
  for (const l of HA_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
  return out;
})();

export const VARIANT_IDS = Object.keys(VARIANT_ALLELE) as VariantId[];

export function variantInfo(id: VariantId): { label: string; locus: LocusDef; name: Txt; effect: Txt } {
  const [lid, allele] = VARIANT_ALLELE[id];
  const locus = LOCUS_BY_ID[lid];
  const a = locus.alleles.find((x) => x.allele === allele)!;
  return { label: allele, locus, name: a.name ?? locus.name, effect: a.effect ?? locus.name };
}

export function locusRelevant(l: LocusDef, sp: SpeciesId): boolean {
  return l.documented.includes(sp) || (l.hypothetical ?? []).includes(sp);
}

export function locusHypothetical(l: LocusDef, sp: SpeciesId): boolean {
  return !l.documented.includes(sp) && (l.hypothetical ?? []).includes(sp);
}

/** Allèles S fonctionnels (Sc ne rejette rien). */
export function functionalS(pair: readonly string[]): string[] {
  return pair.filter((x) => x !== 'Sc');
}
