/**
 * Espèces et loci mendéliens du maïs et de ses parents sauvages (genre Zea
 * et Tripsacum ; maïs 2n = 20, 10 chromosomes).
 *
 * Sources : base MaizeGDB et carte génétique classique (Neuffer, Coe &
 * Wessler 1997, « Mutants of Maize ») ; gènes clonés : A1, C1, R1, Bz1, Pr1
 * (voie des anthocyanes ; Dooner et al. 1991), Y1 (phytoène synthase), Sh2,
 * Su1, Wx1, O2 (endosperme), P1 (péricarpe ; allèle P1-vv instable à cause
 * de l’élément transposable Ac de McClintock), Tb1 (Doebley et al. 1997),
 * Tga1 (Wang et al. 2005), Ga1 (Zhang et al. 2018), Rf1 (CMS-T), Ht1, Rp1.
 * Positions en cM : carte classique (approchées).
 *
 * Couleur du grain (ce qu’on voit sur l’épi) :
 *  - PÉRICARPE : tissu de la MÈRE (P1) — rouge, panaché ou incolore ; il
 *    recouvre tout le reste ;
 *  - ALEURONE : couche externe de l’albumen, génotype du GRAIN (xénie) :
 *    colorée seulement avec A1 + C1 + R1 ; Pr1 violet / pr1 rouge ;
 *    bz1 bronze ; C1-I (inhibiteur dominant) l’éteint ;
 *  - ALBUMEN : Y1 jaune / y1 blanc, visible sous une aleurone incolore ;
 *    violet sur blanc = grain « bleu » (maïs hopi).
 * Simplification : l’albumen est en réalité triploïde (2 doses maternelles,
 * 1 paternelle) ; on le traite comme le génotype de l’embryon.
 */

export type SpeciesId = 'mays' | 'parviglumis' | 'mexicana' | 'diploperennis' | 'tripsacum';

export const SPECIES: SpeciesId[] = ['mays', 'parviglumis', 'mexicana', 'diploperennis', 'tripsacum'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt }> = {
  mays: {
    latin: 'Zea mays subsp. mays',
    short: 'Z. mays',
    name: T('Maïs', 'Maize'),
    examples: T('maïs denté, corné, doux, pop-corn, farineux, lignées et hybrides', 'dent, flint, sweet, pop and flour corn, inbreds and hybrids'),
  },
  parviglumis: {
    latin: 'Zea mays subsp. parviglumis',
    short: 'Z. m. parviglumis',
    name: T('Téosinte de Balsas (ancêtre du maïs)', 'Balsas teosinte (maize’s ancestor)'),
    examples: T('téosinte de la vallée du Balsas, domestiqué il y a 9 000 ans', 'Balsas valley teosinte, domesticated 9,000 years ago'),
  },
  mexicana: {
    latin: 'Zea mays subsp. mexicana',
    short: 'Z. m. mexicana',
    name: T('Téosinte des hauts plateaux', 'Highland teosinte'),
    examples: T('téosinte de Chalco, adventice des champs de maïs mexicains', 'Chalco teosinte, a weed of Mexican maize fields'),
  },
  diploperennis: {
    latin: 'Zea diploperennis',
    short: 'Z. diploperennis',
    name: T('Téosinte vivace', 'Perennial teosinte'),
    examples: T('téosinte vivace de la sierra de Manantlán (Jalisco), découvert en 1978', 'perennial teosinte of the Sierra de Manantlán (Jalisco), found in 1978'),
  },
  tripsacum: {
    latin: 'Tripsacum dactyloides',
    short: 'T. dactyloides',
    name: T('Tripsacum (herbe gama)', 'Eastern gamagrass'),
    examples: T('graminée vivace des prairies américaines, cousin éloigné du maïs', 'perennial grass of American prairies, a distant cousin of maize'),
  },
};

export type MzLocusId =
  | 'p1'
  | 'a1'
  | 'c1'
  | 'r1'
  | 'pr1'
  | 'bz1'
  | 'y1'
  | 'sh2'
  | 'su1'
  | 'wx1'
  | 'o2'
  | 'b1'
  | 'pl1'
  | 'd1'
  | 'br2'
  | 'tb1'
  | 'tga1'
  | 'ga1'
  | 'rf1'
  | 'ht1'
  | 'rp1';

export type VariantId =
  | 'Prr'
  | 'Pvv'
  | 'Pwr'
  | 'a1'
  | 'CI'
  | 'c1'
  | 'R1'
  | 'pr1'
  | 'bz1'
  | 'y1'
  | 'sh2'
  | 'su1'
  | 'wx1'
  | 'o2'
  | 'B1'
  | 'Pl1'
  | 'd1'
  | 'br2'
  | 'tbT'
  | 'TgaT'
  | 'Ga1S'
  | 'Rf1'
  | 'Ht1'
  | 'Rp1';

export type LocusCategory = 'kernel' | 'endosperm' | 'plant' | 'domestication' | 'flower' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: MzLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  /** Chromosome 1–10 (absent : traité comme indépendant). */
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const ZEA: SpeciesId[] = ['mays', 'parviglumis', 'mexicana'];
const MAYS: SpeciesId[] = ['mays'];
const TEO: SpeciesId[] = ['parviglumis', 'mexicana', 'diploperennis'];

export const MZ_LOCI: LocusDef[] = [
  // --- Couleur du grain ---------------------------------------------------------
  {
    id: 'p1',
    symbol: 'P1',
    category: 'kernel',
    name: T('Péricarpe (P1)', 'Pericarp (P1)'),
    alleles: [
      { allele: 'Prr', id: 'Prr', name: T('Péricarpe rouge', 'Red pericarp'), effect: T('P1-rr : péricarpe et rafle rouges (Bloody Butcher, Strawberry). Le péricarpe est un tissu de la MÈRE : un croisement ne change pas sa couleur sur l’épi récolté.', 'P1-rr: red pericarp and cob (Bloody Butcher, Strawberry). The pericarp is MOTHER tissue: a cross doesn’t change its colour on the harvested ear.') },
      {
        allele: 'Pvv',
        id: 'Pvv',
        name: T('Péricarpe panaché', 'Variegated pericarp'),
        effect: T('P1-vv : stries rouges sur fond clair. L’allèle est cassé par un élément transposable (Ac), qui « saute » parfois : environ 1 % des graines redeviennent rouges (découverte de Barbara McClintock).', 'P1-vv: red streaks on a pale background. The allele is broken by a transposable element (Ac) that sometimes “jumps” out: about 1% of seeds revert to red (Barbara McClintock’s discovery).'),
      },
      { allele: 'Pwr', id: 'Pwr', name: T('Péricarpe incolore, rafle rouge', 'Colourless pericarp, red cob'), effect: T('P1-wr : péricarpe incolore mais rafle rouge, très courant chez les maïs dentés.', 'P1-wr: colourless pericarp but red cob, very common in dent corn.') },
      { allele: 'Pww', name: T('Péricarpe incolore, rafle blanche', 'Colourless pericarp, white cob') },
    ],
    standard: 'Pww',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 1,
    cM: 26,
  },
  {
    id: 'a1',
    symbol: 'A1',
    category: 'kernel',
    name: T('Anthocyanes A1', 'Anthocyanin A1'),
    alleles: [
      { allele: 'A1', name: T('Fonctionnel', 'Functional') },
      { allele: 'a1', id: 'a1', name: T('Aleurone incolore (a1)', 'Colourless aleurone (a1)'), effect: T('Récessif : une enzyme de la voie des anthocyanes manque, l’aleurone reste incolore même avec C1 et R1.', 'Recessive: an anthocyanin pathway enzyme is missing; the aleurone stays colourless even with C1 and R1.') },
    ],
    standard: 'A1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 3,
    cM: 148,
  },
  {
    id: 'c1',
    symbol: 'C1',
    category: 'kernel',
    name: T('Couleur de l’aleurone C1', 'Aleurone colour C1'),
    alleles: [
      { allele: 'CI', id: 'CI', name: T('Inhibiteur C1-I', 'C1-I inhibitor'), effect: T('Dominant : inhibe toute couleur de l’aleurone, même chez un hétérozygote. Un seul parent C1-I suffit pour un épi jaune ou blanc.', 'Dominant: inhibits all aleurone colour, even when heterozygous. One C1-I parent is enough for a yellow or white ear.') },
      { allele: 'C1', name: T('Fonctionnel', 'Functional') },
      { allele: 'c1', id: 'c1', name: T('Aleurone incolore (c1)', 'Colourless aleurone (c1)'), effect: T('Récessif : facteur de transcription absent, aleurone incolore.', 'Recessive: missing transcription factor, colourless aleurone.') },
    ],
    standard: 'C1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 9,
    cM: 26,
  },
  {
    id: 'r1',
    symbol: 'R1',
    category: 'kernel',
    name: T('Couleur de l’aleurone R1', 'Aleurone colour R1'),
    alleles: [
      { allele: 'R1', id: 'R1', name: T('Aleurone colorée (R1)', 'Coloured aleurone (R1)'), effect: T('Dominant : avec A1 et C1, l’aleurone se colore (violet ou rouge). Il manque à la plupart des maïs dentés modernes, d’où leurs grains jaunes.', 'Dominant: with A1 and C1, the aleurone becomes coloured (purple or red). Most modern dent corn lacks it, hence their yellow kernels.') },
      { allele: 'r1', name: T('Aleurone incolore (r1)', 'Colourless aleurone (r1)') },
    ],
    standard: 'r1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 10,
    cM: 61,
  },
  {
    id: 'pr1',
    symbol: 'Pr1',
    category: 'kernel',
    name: T('Violet / rouge (Pr1)', 'Purple / red (Pr1)'),
    alleles: [
      { allele: 'Pr1', name: T('Aleurone violette', 'Purple aleurone') },
      { allele: 'pr1', id: 'pr1', name: T('Aleurone rouge', 'Red aleurone'), effect: T('Récessif : la cyanidine n’est pas transformée en pigment violet ; aleurone rouge.', 'Recessive: cyanidin is not turned into purple pigment; red aleurone.') },
    ],
    standard: 'Pr1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 5,
    cM: 46,
  },
  {
    id: 'bz1',
    symbol: 'Bz1',
    category: 'kernel',
    name: T('Bronze (bz1)', 'Bronze (bz1)'),
    alleles: [
      { allele: 'Bz1', name: T('Fonctionnel', 'Functional') },
      { allele: 'bz1', id: 'bz1', name: T('Aleurone bronze', 'Bronze aleurone'), effect: T('Récessif : dernière étape de la voie bloquée, aleurone brun bronze. Lié à C1 (5 cM) sur le chromosome 9.', 'Recessive: last pathway step blocked, bronze-brown aleurone. Linked to C1 (5 cM) on chromosome 9.') },
    ],
    standard: 'Bz1',
    documented: MAYS,
    chromosome: 9,
    cM: 31,
  },
  {
    id: 'y1',
    symbol: 'Y1',
    category: 'kernel',
    name: T('Albumen jaune / blanc (Y1)', 'Yellow / white endosperm (Y1)'),
    alleles: [
      { allele: 'Y1', name: T('Albumen jaune', 'Yellow endosperm') },
      { allele: 'y1', id: 'y1', name: T('Albumen blanc', 'White endosperm'), effect: T('Récessif : pas de caroténoïdes, grain blanc (maïs blancs d’Afrique et d’Amérique latine, Silver Queen).', 'Recessive: no carotenoids, white kernel (white maize of Africa and Latin America, Silver Queen).') },
    ],
    standard: 'Y1',
    documented: ZEA,
    hypothetical: ['diploperennis'],
    chromosome: 6,
    cM: 17,
  },
  // --- Type d’albumen -------------------------------------------------------------
  {
    id: 'sh2',
    symbol: 'sh2',
    category: 'endosperm',
    name: T('Super-doux (sh2)', 'Supersweet (sh2)'),
    alleles: [
      { allele: 'Sh2', name: T('Amidon normal', 'Normal starch') },
      {
        allele: 'sh2',
        id: 'sh2',
        name: T('Ratatiné, super-doux', 'Shrunken, supersweet'),
        effect: T('Récessif : presque pas d’amidon, deux fois plus de sucre que le maïs doux ; grain sec ratatiné. Très étroitement lié à A1 (0,1 cM en réalité).', 'Recessive: almost no starch, twice the sugar of sweet corn; dry kernel shrivelled. Very tightly linked to A1 (0.1 cM in reality).'),
      },
    ],
    standard: 'Sh2',
    documented: MAYS,
    chromosome: 3,
    cM: 149,
  },
  {
    id: 'su1',
    symbol: 'su1',
    category: 'endosperm',
    name: T('Maïs doux (su1)', 'Sweet corn (su1)'),
    alleles: [
      { allele: 'Su1', name: T('Amidon normal', 'Normal starch') },
      { allele: 'su1', id: 'su1', name: T('Sucré (maïs doux)', 'Sugary (sweet corn)'), effect: T('Récessif : sucres et phytoglycogène au lieu d’amidon ; grain sec ridé et translucide (Golden Bantam).', 'Recessive: sugars and phytoglycogen instead of starch; dry kernel wrinkled and glassy (Golden Bantam).') },
    ],
    standard: 'Su1',
    documented: MAYS,
    chromosome: 4,
    cM: 66,
  },
  {
    id: 'wx1',
    symbol: 'wx1',
    category: 'endosperm',
    name: T('Cireux (wx1)', 'Waxy (wx1)'),
    alleles: [
      { allele: 'Wx1', name: T('Amidon normal', 'Normal starch') },
      { allele: 'wx1', id: 'wx1', name: T('Cireux', 'Waxy'), effect: T('Récessif : amidon 100 % amylopectine, grain d’aspect cireux ; maïs gluant d’Asie.', 'Recessive: 100% amylopectin starch, waxy-looking kernel; Asian sticky corn.') },
    ],
    standard: 'Wx1',
    documented: MAYS,
    chromosome: 9,
    cM: 56,
  },
  {
    id: 'o2',
    symbol: 'o2',
    category: 'endosperm',
    name: T('Opaque-2 (o2)', 'Opaque-2 (o2)'),
    alleles: [
      { allele: 'O2', name: T('Normal', 'Normal') },
      { allele: 'o2', id: 'o2', name: T('Opaque, riche en lysine', 'Opaque, lysine-rich'), effect: T('Récessif : grain farineux et opaque, deux fois plus de lysine ; base des maïs « QPM » (Obatanpa).', 'Recessive: floury, opaque kernel with twice the lysine; basis of “QPM” maize (Obatanpa).') },
    ],
    standard: 'O2',
    documented: MAYS,
    chromosome: 7,
    cM: 16,
  },
  // --- Plante ---------------------------------------------------------------------
  {
    id: 'b1',
    symbol: 'B1',
    category: 'plant',
    name: T('Plante pourpre B1', 'Purple plant B1'),
    alleles: [
      { allele: 'B1', id: 'B1', name: T('Booster B1', 'Booster B1'), effect: T('Dominant : colore tiges et gaines (rouge au soleil ; pourpre partout avec Pl1). Paramutation célèbre (B’).', 'Dominant: colours stalks and sheaths (red in the sun; purple everywhere with Pl1). Famous for paramutation (B’).') },
      { allele: 'b1', name: T('Plante verte', 'Green plant') },
    ],
    standard: 'b1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 2,
    cM: 67,
  },
  {
    id: 'pl1',
    symbol: 'Pl1',
    category: 'plant',
    name: T('Pourpre partout (Pl1)', 'Purple throughout (Pl1)'),
    alleles: [
      { allele: 'Pl1', id: 'Pl1', name: T('Pl1', 'Pl1'), effect: T('Dominant : avec B1, la plante est pourpre même à l’ombre.', 'Dominant: with B1, the plant is purple even in shade.') },
      { allele: 'pl1', name: T('pl1', 'pl1') },
    ],
    standard: 'pl1',
    documented: MAYS,
    chromosome: 6,
    cM: 55,
  },
  {
    id: 'd1',
    symbol: 'd1',
    category: 'plant',
    name: T('Nain (d1)', 'Dwarf (d1)'),
    alleles: [
      { allele: 'D1', name: T('Taille normale', 'Normal height') },
      { allele: 'd1', id: 'd1', name: T('Nain', 'Dwarf'), effect: T('Récessif (gibbérellines) : plante naine, épis et panicules plus petits, souvent des étamines dans l’épi.', 'Recessive (gibberellins): dwarf plant, smaller ears and tassels, often anthers in the ear.') },
    ],
    standard: 'D1',
    documented: MAYS,
    chromosome: 3,
    cM: 18,
  },
  {
    id: 'br2',
    symbol: 'br2',
    category: 'plant',
    name: T('Brachytique (br2)', 'Brachytic (br2)'),
    alleles: [
      { allele: 'Br2', name: T('Normal', 'Normal') },
      { allele: 'br2', id: 'br2', name: T('Entre-nœuds courts', 'Short internodes'), effect: T('Récessif : tige courte et robuste (−40 %) sans réduire l’épi ; contre la verse.', 'Recessive: short, sturdy stalk (−40%) without shrinking the ear; against lodging.') },
    ],
    standard: 'Br2',
    documented: MAYS,
    chromosome: 1,
    cM: 81,
  },
  // --- Domestication ----------------------------------------------------------------
  {
    id: 'tb1',
    symbol: 'tb1',
    category: 'domestication',
    name: T('Ramification (tb1)', 'Branching (tb1)'),
    alleles: [
      { allele: 'Tb1M', name: T('Allèle maïs : une tige', 'Maize allele: single stalk') },
      {
        allele: 'tbT',
        id: 'tbT',
        name: T('Allèle téosinte : ramifié', 'Teosinte allele: branched'),
        effect: T('Récessif (moins exprimé) : longues branches latérales et nombreux petits épis, comme le téosinte. Le gène clé de la domestication (Doebley 1997).', 'Recessive (less expressed): long side branches and many small ears, like teosinte. The key domestication gene (Doebley 1997).'),
      },
    ],
    standard: 'Tb1M',
    documented: ZEA,
    hypothetical: ['diploperennis'],
    chromosome: 1,
    cM: 160,
  },
  {
    id: 'tga1',
    symbol: 'tga1',
    category: 'domestication',
    name: T('Grain vêtu (tga1)', 'Encased kernel (tga1)'),
    alleles: [
      {
        allele: 'TgaT',
        id: 'TgaT',
        name: T('Allèle téosinte : grain dans une coque', 'Teosinte allele: kernel in a hard case'),
        effect: T('Dominance incomplète : chez le téosinte, chaque grain est enfermé dans une coque dure ; l’allèle maïs (une seule mutation) expose le grain nu.', 'Incomplete dominance: in teosinte, each kernel is enclosed in a hard fruitcase; the maize allele (a single mutation) exposes the naked kernel.'),
      },
      { allele: 'tga1', name: T('Allèle maïs : grain nu', 'Maize allele: naked kernel') },
    ],
    standard: 'tga1',
    incomplete: true,
    documented: ZEA,
    hypothetical: ['diploperennis'],
    chromosome: 4,
    cM: 62,
  },
  // --- Fleurs et pollinisation -----------------------------------------------------------
  {
    id: 'ga1',
    symbol: 'Ga1-s',
    category: 'flower',
    name: T('Barrière du pop-corn (Ga1-s)', 'Popcorn barrier (Ga1-s)'),
    alleles: [
      {
        allele: 'Ga1S',
        id: 'Ga1S',
        name: T('Ga1-s', 'Ga1-s'),
        effect: T('Dominant : les soies d’une plante Ga1-s rejettent presque tout le pollen ga1 des maïs ordinaires ; c’est ainsi que les pop-corns se protègent des maïs dentés voisins.', 'Dominant: silks of a Ga1-s plant reject almost all ga1 pollen from ordinary corn; that’s how popcorns stay protected from nearby dent corn.'),
      },
      { allele: 'ga1', name: T('ga1', 'ga1') },
    ],
    standard: 'ga1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 4,
    cM: 34,
  },
  {
    id: 'rf1',
    symbol: 'Rf1',
    category: 'flower',
    name: T('Restaurateur Rf1 (CMS-T)', 'Restorer Rf1 (CMS-T)'),
    alleles: [
      { allele: 'Rf1', id: 'Rf1', name: T('Restaurateur', 'Restorer'), effect: T('Dominant : rend du pollen aux plantes à cytoplasme T (avec Rf2, presque universel chez le maïs).', 'Dominant: restores pollen to T-cytoplasm plants (with Rf2, almost universal in maize).') },
      { allele: 'rf1', name: T('Non restaurateur', 'Non-restorer') },
    ],
    standard: 'rf1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 3,
    cM: 80,
  },
  // --- Résistances --------------------------------------------------------------------
  {
    id: 'ht1',
    symbol: 'Ht1',
    category: 'resistance',
    name: T('Helminthosporiose du Nord (Ht1)', 'Northern leaf blight (Ht1)'),
    alleles: [
      { allele: 'Ht1', id: 'Ht1', name: T('Ht1', 'Ht1'), effect: T('Dominant : lésions chlorotiques limitées face à Exserohilum turcicum race 0, maladie des étés humides.', 'Dominant: limited chlorotic lesions against Exserohilum turcicum race 0, a disease of wet summers.') },
      { allele: 'ht1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'ht1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 2,
    cM: 149,
  },
  {
    id: 'rp1',
    symbol: 'Rp1-D',
    category: 'resistance',
    name: T('Rouille commune (Rp1-D)', 'Common rust (Rp1-D)'),
    alleles: [
      { allele: 'Rp1', id: 'Rp1', name: T('Rp1-D', 'Rp1-D'), effect: T('Dominant : résistance spécifique à la rouille commune (Puccinia sorghi) ; locus complexe, sur le bout du chromosome 10.', 'Dominant: race-specific resistance to common rust (Puccinia sorghi); a complex locus at the tip of chromosome 10.') },
      { allele: 'rp1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'rp1',
    documented: MAYS,
    hypothetical: TEO,
    chromosome: 10,
    cM: 0,
  },
];

export const LOCUS_BY_ID: Record<MzLocusId, LocusDef> = Object.fromEntries(MZ_LOCI.map((l) => [l.id, l])) as Record<MzLocusId, LocusDef>;
export const LOCUS_IDS: MzLocusId[] = MZ_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [MzLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [MzLocusId, string]>;
  for (const l of MZ_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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

