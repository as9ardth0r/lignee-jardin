/**
 * Espèces et loci mendéliens des choux (genre Brassica et radis).
 *
 * LE TRIANGLE DE U (Nagaharu U, 1935) : trois espèces diploïdes de base,
 * chacune avec son génome — B. rapa (AA, 2n = 20 : navet, chou chinois,
 * pak-choï), B. nigra (BB, 2n = 16 : moutarde noire), B. oleracea (CC,
 * 2n = 18 : tous les choux) — et trois espèces nées de leurs hybrides,
 * dont les chromosomes ont doublé : B. napus (AACC : colza, rutabaga),
 * B. juncea (AABB : moutarde brune, moutardes asiatiques), B. carinata
 * (BBCC : moutarde d’Abyssinie). Le radis (Raphanus sativus, RR) est un
 * cousin, célèbre pour le « radis-chou » de Karpechenko (1928, RRCC).
 *
 * UNE espèce, B. oleracea, a donné presque tous les choux : la sélection a
 * hypertrophié un organe différent à chaque fois (bourgeon terminal : chou
 * pommé ; bourgeons axillaires : chou de Bruxelles ; inflorescence : brocoli
 * et chou-fleur ; tige : chou-rave ; feuilles : chou kale). L’hérédité
 * réelle de ces morphotypes est en grande partie POLYGÉNIQUE : ce modèle la
 * résume pédagogiquement par quelques loci majeurs (signalés), dont certains
 * sont des gènes clonés : BoCAL / BoAP1 (chou-fleur), BoMYB2 (chou et
 * chou-fleur violets), BoOr (chou-fleur orange), FOC1 (fusariose), CRa
 * (hernie, venu du navet), Pp523 (mildiou), MYB28 de B. villosa
 * (glucoraphanine, brocoli « Beneforté »), Rfo (restaurateur Ogura).
 *
 * Auto-incompatibilité : locus S (sporophytique, ici codominant) — une
 * plante rejette le pollen qui porte un de ses propres allèles S.
 */

export type SpeciesId = 'oleracea' | 'rapa' | 'nigra' | 'napus' | 'juncea' | 'carinata' | 'raphanus' | 'raphanobrassica';

export const SPECIES: SpeciesId[] = ['oleracea', 'rapa', 'nigra', 'napus', 'juncea', 'carinata', 'raphanus', 'raphanobrassica'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

/** Génome (lettres triées, un jeu = une lettre) de chaque espèce. */
export const SPECIES_GENOME: Record<SpeciesId, string> = {
  oleracea: 'CC',
  rapa: 'AA',
  nigra: 'BB',
  napus: 'AACC',
  juncea: 'AABB',
  carinata: 'BBCC',
  raphanus: 'RR',
  raphanobrassica: 'CCRR',
};

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt }> = {
  oleracea: {
    latin: 'Brassica oleracea',
    short: 'B. oleracea',
    name: T('Chou (génome CC)', 'Cabbage (CC genome)'),
    examples: T('chou pommé, de Milan, rouge, kale, chou-fleur, brocoli, chou de Bruxelles, chou-rave', 'cabbage, savoy, red cabbage, kale, cauliflower, broccoli, Brussels sprouts, kohlrabi'),
  },
  rapa: {
    latin: 'Brassica rapa',
    short: 'B. rapa',
    name: T('Navet (génome AA)', 'Turnip (AA genome)'),
    examples: T('navet, chou chinois, pak-choï, mizuna, navette', 'turnip, Chinese cabbage, pak choi, mizuna, turnip rape'),
  },
  nigra: {
    latin: 'Brassica nigra',
    short: 'B. nigra',
    name: T('Moutarde noire (génome BB)', 'Black mustard (BB genome)'),
    examples: T('moutarde noire, la moutarde de Dijon d’origine', 'black mustard, the original Dijon mustard'),
  },
  napus: {
    latin: 'Brassica napus',
    short: 'B. napus',
    name: T('Colza, rutabaga (AACC)', 'Rapeseed, swede (AACC)'),
    examples: T('colza, rutabaga, chou-navet ; né d’un croisement navet × chou', 'oilseed rape, swede; born from a turnip × cabbage cross'),
  },
  juncea: {
    latin: 'Brassica juncea',
    short: 'B. juncea',
    name: T('Moutarde brune (AABB)', 'Brown mustard (AABB)'),
    examples: T('moutarde brune, moutardes à feuilles asiatiques', 'brown mustard, Asian leaf mustards'),
  },
  carinata: {
    latin: 'Brassica carinata',
    short: 'B. carinata',
    name: T('Moutarde d’Abyssinie (BBCC)', 'Ethiopian mustard (BBCC)'),
    examples: T('chou d’Éthiopie, cultivé pour ses feuilles et son huile', 'Ethiopian kale, grown for leaves and oil'),
  },
  raphanus: {
    latin: 'Raphanus sativus',
    short: 'R. sativus',
    name: T('Radis (génome RR)', 'Radish (RR genome)'),
    examples: T('radis rose, daïkon, radis noir ; source du cytoplasme Ogura', 'red radish, daikon, black radish; source of Ogura cytoplasm'),
  },
  raphanobrassica: {
    latin: '× Raphanobrassica',
    short: '× Raphanobrassica',
    name: T('Radis-chou de Karpechenko (CCRR)', 'Karpechenko’s radish-cabbage (CCRR)'),
    examples: T('hybride radis × chou doublé (1928), le premier « nouveau genre » créé par l’homme', 'doubled radish × cabbage hybrid (1928), the first man-made “new genus”'),
  },
};

export type BrLocusId = 'he' | 'cal' | 'fr' | 'sp' | 'kr' | 'tu' | 'sav' | 'cr' | 'pr' | 'or' | 'gc' | 'gl' | 'an' | 's' | 'rfo' | 'foc' | 'pp' | 'cra' | 'gr';

export type VariantId =
  | 'He'
  | 'br'
  | 'cu'
  | 'fr'
  | 'sp'
  | 'Kr'
  | 'Tu'
  | 'Sav'
  | 'Cr'
  | 'Pr'
  | 'Or'
  | 'Gc'
  | 'gl'
  | 'an'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'S5'
  | 'S6'
  | 'Sf'
  | 'Rfo'
  | 'Foc1'
  | 'Pp523'
  | 'CRa'
  | 'Gr';

export type LocusCategory = 'organ' | 'leaf' | 'color' | 'flower' | 'resistance' | 'quality';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: BrLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  /** Locus sans effet visible (allèles S) : exclu de la prédiction de Mendel. */
  silent?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  /** Hérédité réelle polygénique, résumée ici en un locus majeur. */
  simplified?: boolean;
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const OLE: SpeciesId[] = ['oleracea'];
const C_GENOME: SpeciesId[] = ['oleracea', 'napus', 'carinata', 'raphanobrassica'];
const ALL: SpeciesId[] = [...SPECIES];
const OTHERS: SpeciesId[] = ['rapa', 'nigra', 'napus', 'juncea', 'carinata', 'raphanus', 'raphanobrassica'];

const S_NAMES: Array<[string, Txt]> = [
  ['S1', T('Allèle S1', 'S1 allele')],
  ['S2', T('Allèle S2', 'S2 allele')],
  ['S3', T('Allèle S3', 'S3 allele')],
  ['S4', T('Allèle S4', 'S4 allele')],
  ['S5', T('Allèle S5', 'S5 allele')],
  ['S6', T('Allèle S6', 'S6 allele')],
];

export const BR_LOCI: LocusDef[] = [
  // --- Organe récolté (morphotype) -------------------------------------------
  {
    id: 'he',
    symbol: 'He',
    category: 'organ',
    name: T('Pomme (He)', 'Head (He)'),
    alleles: [
      { allele: 'He', id: 'He', name: T('Chou pommé', 'Heading'), effect: T('Dominance incomplète : He/He forme une pomme serrée (le bourgeon terminal géant) ; He/he une pomme lâche ; he/he pas de pomme (chou feuille, kale).', 'Incomplete dominance: He/He makes a tight head (the giant terminal bud); He/he a loose head; he/he no head (leaf cabbage, kale).') },
      { allele: 'he', name: T('Pas de pomme', 'No head') },
    ],
    standard: 'he',
    incomplete: true,
    simplified: true,
    documented: OLE,
    hypothetical: ['rapa', 'napus'],
    cM: 0,
  },
  {
    id: 'cal',
    symbol: 'cal',
    category: 'organ',
    name: T('Inflorescence (BoCAL / BoAP1)', 'Inflorescence (BoCAL / BoAP1)'),
    alleles: [
      { allele: 'Cal', name: T('Inflorescence normale', 'Normal inflorescence') },
      { allele: 'br', id: 'br', name: T('Brocoli', 'Broccoli'), effect: T('Récessif : boutons floraux charnus serrés en une tête verte, récoltée avant l’ouverture.', 'Recessive: fleshy flower buds packed into a green head, picked before opening.') },
      {
        allele: 'cu',
        id: 'cu',
        name: T('Chou-fleur', 'Cauliflower'),
        effect: T('Récessif (gènes CAULIFLOWER et APETALA1 non fonctionnels) : les méristèmes floraux s’arrêtent et se multiplient en une « pomme » blanche, le caillé. Le même mutant existe chez Arabidopsis.', 'Recessive (non-functional CAULIFLOWER and APETALA1 genes): floral meristems stall and multiply into a white “curd”. The same mutant exists in Arabidopsis.'),
      },
    ],
    standard: 'Cal',
    simplified: true,
    documented: OLE,
    chromosome: 6,
    cM: 40,
  },
  {
    id: 'fr',
    symbol: 'fr',
    category: 'organ',
    name: T('Romanesco fractal (fr)', 'Fractal romanesco (fr)'),
    alleles: [
      { allele: 'Fr', name: T('Caillé arrondi', 'Rounded curd') },
      { allele: 'fr', id: 'fr', name: T('Pyramides fractales', 'Fractal spirals'), effect: T('Récessif (sur fond chou-fleur) : chaque bourgeon refait une pyramide en spirale, suivant la suite de Fibonacci (Azpeitia et al. 2021).', 'Recessive (on a cauliflower background): each bud rebuilds a spiral pyramid, following the Fibonacci sequence (Azpeitia et al. 2021).') },
    ],
    standard: 'Fr',
    simplified: true,
    documented: OLE,
    cM: 0,
  },
  {
    id: 'sp',
    symbol: 'sp',
    category: 'organ',
    name: T('Choux de Bruxelles (sp)', 'Brussels sprouts (sp)'),
    alleles: [
      { allele: 'Sp', name: T('Bourgeons axillaires normaux', 'Normal axillary buds') },
      { allele: 'sp', id: 'sp', name: T('Petites pommes axillaires', 'Axillary mini-heads'), effect: T('Récessif : chaque bourgeon à l’aisselle des feuilles forme une petite pomme, le long d’une haute tige.', 'Recessive: each bud in the leaf axils forms a small head, along a tall stalk.') },
    ],
    standard: 'Sp',
    simplified: true,
    documented: OLE,
    cM: 0,
  },
  {
    id: 'kr',
    symbol: 'Kr',
    category: 'organ',
    name: T('Chou-rave (Kr)', 'Kohlrabi (Kr)'),
    alleles: [
      { allele: 'Kr', id: 'Kr', name: T('Tige renflée', 'Swollen stem'), effect: T('Dominance incomplète : Kr/Kr donne une boule de tige (chou-rave) ; Kr/kr une tige épaissie.', 'Incomplete dominance: Kr/Kr gives a ball of stem (kohlrabi); Kr/kr a thickened stem.') },
      { allele: 'kr', name: T('Tige normale', 'Normal stem') },
    ],
    standard: 'kr',
    incomplete: true,
    simplified: true,
    documented: OLE,
    cM: 0,
  },
  {
    id: 'tu',
    symbol: 'Tu',
    category: 'organ',
    name: T('Racine tubérisée (Tu)', 'Swollen root (Tu)'),
    alleles: [
      { allele: 'Tu', id: 'Tu', name: T('Racine charnue', 'Fleshy root'), effect: T('Dominant : hypocotyle et racine renflés en réserve (navet, rutabaga, radis).', 'Dominant: hypocotyl and root swollen into a store (turnip, swede, radish).') },
      { allele: 'tu', name: T('Racine fine', 'Thin root') },
    ],
    standard: 'tu',
    simplified: true,
    documented: ['rapa', 'napus', 'raphanus'],
    hypothetical: ['oleracea', 'raphanobrassica'],
    cM: 0,
  },
  // --- Feuilles -----------------------------------------------------------------
  {
    id: 'sav',
    symbol: 'Sav',
    category: 'leaf',
    name: T('Feuilles cloquées (Sav)', 'Savoyed leaves (Sav)'),
    alleles: [
      { allele: 'Sav', id: 'Sav', name: T('Cloqué (Milan)', 'Savoyed'), effect: T('Dominance incomplète : feuilles gaufrées des choux de Milan.', 'Incomplete dominance: the puckered leaves of savoy cabbage.') },
      { allele: 'sav', name: T('Lisse', 'Smooth') },
    ],
    standard: 'sav',
    incomplete: true,
    simplified: true,
    documented: OLE,
    hypothetical: ['rapa'],
    cM: 0,
  },
  {
    id: 'cr',
    symbol: 'Cr',
    category: 'leaf',
    name: T('Feuilles frisées (Cr)', 'Curly leaves (Cr)'),
    alleles: [
      { allele: 'Cr', id: 'Cr', name: T('Frisé', 'Curly'), effect: T('Dominance incomplète : bords des feuilles très découpés et frisés (kale frisé).', 'Incomplete dominance: deeply cut, curled leaf margins (curly kale).') },
      { allele: 'cr', name: T('Bords lisses', 'Smooth margins') },
    ],
    standard: 'cr',
    incomplete: true,
    simplified: true,
    documented: OLE,
    hypothetical: ['napus', 'juncea'],
    cM: 0,
  },
  {
    id: 'gl',
    symbol: 'gl',
    category: 'leaf',
    name: T('Feuilles brillantes (gl)', 'Glossy leaves (gl)'),
    alleles: [
      { allele: 'Gl', name: T('Cire glauque', 'Waxy bloom') },
      { allele: 'gl', id: 'gl', name: T('Vert brillant', 'Glossy green'), effect: T('Récessif : pas de cire bleutée sur les feuilles ; plus attirant pour les pucerons, mais moins pour les altises.', 'Recessive: no bluish wax on the leaves; more attractive to aphids, less to flea beetles.') },
    ],
    standard: 'Gl',
    documented: OLE,
    hypothetical: ['rapa', 'napus'],
    cM: 0,
  },
  // --- Couleurs -----------------------------------------------------------------
  {
    id: 'pr',
    symbol: 'Pr',
    category: 'color',
    name: T('Violet (BoMYB2)', 'Purple (BoMYB2)'),
    alleles: [
      { allele: 'Pr', id: 'Pr', name: T('Violet', 'Purple'), effect: T('Dominant (gène BoMYB2) : anthocyanes dans les feuilles et le caillé ; chou rouge, chou-fleur violet (Graffiti), kale rouge.', 'Dominant (BoMYB2 gene): anthocyanins in leaves and curd; red cabbage, purple cauliflower (Graffiti), red kale.') },
      { allele: 'pr', name: T('Vert', 'Green') },
    ],
    standard: 'pr',
    documented: OLE,
    hypothetical: OTHERS,
    cM: 0,
  },
  {
    id: 'or',
    symbol: 'Or',
    category: 'color',
    name: T('Caillé orange (BoOr)', 'Orange curd (BoOr)'),
    alleles: [
      { allele: 'Or', id: 'Or', name: T('Orange', 'Orange'), effect: T('Dominant (gène Orange) : le caillé accumule du bêta-carotène ; trouvé en 1970 dans un champ de l’Ontario.', 'Dominant (Orange gene): the curd stores beta-carotene; found in 1970 in an Ontario field.') },
      { allele: 'or', name: T('Blanc', 'White') },
    ],
    standard: 'or',
    documented: OLE,
    chromosome: 3,
    cM: 50,
  },
  {
    id: 'gc',
    symbol: 'Gc',
    category: 'color',
    name: T('Caillé vert (Gc)', 'Green curd (Gc)'),
    alleles: [
      { allele: 'Gc', id: 'Gc', name: T('Vert', 'Green'), effect: T('Dominant (supposé) : caillé vert tendre (romanesco, chou-fleur vert).', 'Dominant (assumed): pale green curd (romanesco, green cauliflower).') },
      { allele: 'gc', name: T('Blanc', 'White') },
    ],
    standard: 'gc',
    simplified: true,
    documented: OLE,
    cM: 0,
  },
  // --- Fleurs et reproduction ------------------------------------------------------
  {
    id: 'an',
    symbol: 'an',
    category: 'flower',
    name: T('Annuel (FLC faible)', 'Annual (weak FLC)'),
    alleles: [
      { allele: 'An', name: T('Bisannuel', 'Biennial'), effect: T('Il faut un hiver (vernalisation) pour fleurir.', 'A winter (vernalisation) is needed to flower.') },
      { allele: 'an', id: 'an', name: T('Annuel', 'Annual'), effect: T('Récessif (allèles faibles de FLC) : fleurit sans passer l’hiver ; graines en un an (brocolis, choux-fleurs d’été, « rapid cyclers »).', 'Recessive (weak FLC alleles): flowers without overwintering; seed in one year (broccoli, summer cauliflower, “rapid cyclers”).') },
    ],
    standard: 'An',
    simplified: true,
    documented: ALL,
    chromosome: 9,
    cM: 20,
  },
  {
    id: 's',
    symbol: 'S',
    category: 'flower',
    name: T('Auto-incompatibilité (locus S)', 'Self-incompatibility (S locus)'),
    alleles: [
      ...S_NAMES.map(([a, n]) => ({
        allele: a,
        id: a as VariantId,
        name: n,
        effect: T('Le stigmate rejette tout pollen produit par une plante qui porte le même allèle S. Une plante ne peut donc pas s’autoféconder… sauf en pollinisant les boutons avant que le rejet ne s’installe.', 'The stigma rejects any pollen made by a plant carrying the same S allele. So a plant cannot self… except by pollinating buds before rejection is set up.'),
      })),
      { allele: 'Sf', id: 'Sf', name: T('Autocompatible (Sf)', 'Self-compatible (Sf)'), effect: T('Allèle S non fonctionnel, récessif : Sf/Sf s’autoféconde normalement (beaucoup de brocolis et de colzas).', 'Non-functional, recessive S allele: Sf/Sf selfs normally (many broccolis and rapeseeds).') },
    ],
    standard: 'S1',
    silent: true,
    documented: ALL,
    chromosome: 7,
    cM: 30,
  },
  {
    id: 'rfo',
    symbol: 'Rfo',
    category: 'flower',
    name: T('Restaurateur Ogura (Rfo)', 'Ogura restorer (Rfo)'),
    alleles: [
      { allele: 'Rfo', id: 'Rfo', name: T('Restaurateur', 'Restorer'), effect: T('Dominant : rend du pollen aux plantes à cytoplasme Ogura. Présent chez certains radis ; introduit dans le colza par l’INRA.', 'Dominant: restores pollen to Ogura-cytoplasm plants. Found in some radishes; brought into rapeseed by INRA.') },
      { allele: 'rfo', name: T('Non restaurateur', 'Non-restorer') },
    ],
    standard: 'rfo',
    documented: ['raphanus', 'napus'],
    hypothetical: ['oleracea', 'rapa', 'raphanobrassica'],
    cM: 0,
  },
  // --- Résistances --------------------------------------------------------------------
  {
    id: 'foc',
    symbol: 'Foc1',
    category: 'resistance',
    name: T('Fusariose jaune (FOC1)', 'Fusarium yellows (FOC1)'),
    alleles: [
      { allele: 'Foc1', id: 'Foc1', name: T('FOC1', 'FOC1'), effect: T('Dominant : résistance « de type A » à la fusariose du chou (feuilles jaunies d’un côté), gène cloné en 2015.', 'Dominant: “type A” resistance to cabbage Fusarium yellows (leaves yellowing on one side), gene cloned in 2015.') },
      { allele: 'foc1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'foc1',
    documented: OLE,
    chromosome: 7,
    cM: 60,
  },
  {
    id: 'pp',
    symbol: 'Pp523',
    category: 'resistance',
    name: T('Mildiou (Pp523)', 'Downy mildew (Pp523)'),
    alleles: [
      { allele: 'Pp523', id: 'Pp523', name: T('Pp523', 'Pp523'), effect: T('Dominant : résistance au mildiou (Hyaloperonospora) au stade adulte, trouvée chez le brocolis.', 'Dominant: adult-plant resistance to downy mildew (Hyaloperonospora), found in broccoli.') },
      { allele: 'pp523', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'pp523',
    documented: OLE,
    chromosome: 8,
    cM: 40,
  },
  {
    id: 'cra',
    symbol: 'CRa',
    category: 'resistance',
    name: T('Hernie (CRa)', 'Clubroot (CRa)'),
    alleles: [
      { allele: 'CRa', id: 'CRa', name: T('CRa', 'CRa'), effect: T('Dominant : résistance à la hernie (Plasmodiophora), venue des navets fourragers européens ; introduite chez le chou-fleur et le chou par croisement interspécifique.', 'Dominant: clubroot resistance (Plasmodiophora) from European fodder turnips; introduced into cauliflower and cabbage by interspecific crossing.') },
      { allele: 'cra', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'cra',
    documented: ['rapa', 'oleracea', 'napus'],
    cM: 0,
  },
  // --- Qualité ------------------------------------------------------------------------
  {
    id: 'gr',
    symbol: 'Gr',
    category: 'quality',
    name: T('Glucoraphanine élevée (MYB28)', 'High glucoraphanin (MYB28)'),
    alleles: [
      { allele: 'Gr', id: 'Gr', name: T('Riche en glucoraphanine', 'Glucoraphanin-rich'), effect: T('Dominant : allèle MYB28 venu de Brassica villosa, sauvage de Sicile ; deux à trois fois plus de glucoraphanine (brocoli « Beneforté »).', 'Dominant: MYB28 allele from Brassica villosa, a Sicilian wild relative; two to three times more glucoraphanin (“Beneforté” broccoli).') },
      { allele: 'gr', name: T('Teneur normale', 'Normal content') },
    ],
    standard: 'gr',
    documented: OLE,
    chromosome: 9,
    cM: 60,
  },
];

export const LOCUS_BY_ID: Record<BrLocusId, LocusDef> = Object.fromEntries(BR_LOCI.map((l) => [l.id, l])) as Record<BrLocusId, LocusDef>;
export const LOCUS_IDS: BrLocusId[] = BR_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [BrLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [BrLocusId, string]>;
  for (const l of BR_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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

export const C_GENOME_SPECIES = C_GENOME;
