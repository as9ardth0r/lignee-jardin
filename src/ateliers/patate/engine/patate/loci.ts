/**
 * Espèces et loci mendéliens de la pomme de terre (genre Solanum, section
 * Petota) et de ses cousines sauvages.
 *
 * PLOÏDIE : la pomme de terre cultivée européenne (S. tuberosum) est
 * AUTOTÉTRAPLOÏDE (2n = 4x = 48) : chaque gène y existe en QUATRE copies.
 * Les formes andines primitives (Phureja, Stenotomum) et beaucoup d’espèces
 * sauvages sont diploïdes (2n = 2x = 24) ; S. demissum (mexicaine, source
 * des premiers gènes de résistance au mildiou) est hexaploïde.
 *
 * EBN (Endosperm Balance Number, Johnston et al. 1980) : chaque espèce a un
 * « nombre d’équilibre de l’albumen » qui ne coïncide pas toujours avec sa
 * ploïdie. La graine ne se développe que si l’albumen reçoit 2 parts
 * maternelles pour 1 paternelle en EBN : en pratique, deux espèces se
 * croisent quand leurs gamètes ont le même EBN. Les GAMÈTES NON RÉDUITS
 * (2n, très fréquents chez les diploïdes porteurs de `ps`) permettent de
 * franchir la barrière 4x × 2x — c’est la voie royale des sélectionneurs
 * (Peloquin, Hougas).
 *
 * Auto-incompatibilité GAMÉTOPHYTIQUE (S-RNase) chez les diploïdes : c’est
 * le génotype du GRAIN DE POLLEN qui compte (comparer au chou, où c’est la
 * plante père). Les tétraploïdes sont autocompatibles (un grain de pollen
 * 2x porte deux allèles S différents : « compétition », pas de rejet).
 * `Sli` (S-locus inhibitor, venu de S. chacoense) rend autocompatible.
 *
 * Gènes clonés ou cartographiés : StAN1 (D), DFR (R), F3'5'H (P), CHY2 (Y),
 * ZEP (orange), StOFP20 (Ro), StCDF1 (tubérisation en jours longs), Sli,
 * R1, Rpi-blb1 (= RB), H1, Ry-adg.
 */

export type SpeciesId =
  | 'tuberosum'
  | 'andigena'
  | 'phureja'
  | 'stenotomum'
  | 'chacoense'
  | 'demissum'
  | 'bulbocastanum'
  | 'stoloniferum'
  | 'acaule'
  | 'commersonii';

export const SPECIES: SpeciesId[] = ['tuberosum', 'andigena', 'phureja', 'stenotomum', 'chacoense', 'demissum', 'bulbocastanum', 'stoloniferum', 'acaule', 'commersonii'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

/** Ploïdie et EBN de chaque espèce (Hawkes 1990 ; Hanneman 1994). */
export const SPECIES_PLOIDY: Record<SpeciesId, { ploidy: number; ebn: number }> = {
  tuberosum: { ploidy: 4, ebn: 4 },
  andigena: { ploidy: 4, ebn: 4 },
  phureja: { ploidy: 2, ebn: 2 },
  stenotomum: { ploidy: 2, ebn: 2 },
  chacoense: { ploidy: 2, ebn: 2 },
  demissum: { ploidy: 6, ebn: 4 },
  bulbocastanum: { ploidy: 2, ebn: 1 },
  stoloniferum: { ploidy: 4, ebn: 2 },
  acaule: { ploidy: 4, ebn: 2 },
  commersonii: { ploidy: 2, ebn: 1 },
};

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt; wild: boolean }> = {
  tuberosum: {
    latin: 'Solanum tuberosum',
    short: 'S. tuberosum',
    name: T('Pomme de terre (4x, 4EBN)', 'Potato (4x, 4EBN)'),
    examples: T('toutes nos variétés : Bintje, Charlotte, Ratte, Désirée, Agria…', 'all our varieties: Bintje, Charlotte, Ratte, Désirée, Agria…'),
    wild: false,
  },
  andigena: {
    latin: 'S. tuberosum gr. Andigena',
    short: 'Andigena',
    name: T('Pomme de terre andine (4x, jours courts)', 'Andean potato (4x, short days)'),
    examples: T('variétés de pays des Andes ; source de H1 et Ry-adg', 'Andean landraces; source of H1 and Ry-adg'),
    wild: false,
  },
  phureja: {
    latin: 'S. tuberosum gr. Phureja',
    short: 'Phureja',
    name: T('Phureja (2x, 2EBN)', 'Phureja (2x, 2EBN)'),
    examples: T('« papa criolla » jaune de Colombie, sans dormance ; inducteur d’haploïdes IVP101', 'yellow “papa criolla” of Colombia, no dormancy; IVP101 haploid inducer'),
    wild: false,
  },
  stenotomum: {
    latin: 'S. tuberosum gr. Stenotomum',
    short: 'Stenotomum',
    name: T('Stenotomum (2x, 2EBN)', 'Stenotomum (2x, 2EBN)'),
    examples: T('pommes de terre diploïdes andines, les premières domestiquées', 'Andean diploid potatoes, the first domesticated'),
    wild: false,
  },
  chacoense: {
    latin: 'Solanum chacoense',
    short: 'S. chacoense',
    name: T('S. chacoense (2x, 2EBN)', 'S. chacoense (2x, 2EBN)'),
    examples: T('sauvage d’Argentine et de Bolivie ; lignée M6 porteuse de Sli', 'wild species of Argentina and Bolivia; M6 line carrying Sli'),
    wild: true,
  },
  demissum: {
    latin: 'Solanum demissum',
    short: 'S. demissum',
    name: T('S. demissum (6x, 4EBN)', 'S. demissum (6x, 4EBN)'),
    examples: T('sauvage du Mexique ; source des gènes R1 à R11 contre le mildiou', 'wild species of Mexico; source of R1 to R11 late blight genes'),
    wild: true,
  },
  bulbocastanum: {
    latin: 'Solanum bulbocastanum',
    short: 'S. bulbocastanum',
    name: T('S. bulbocastanum (2x, 1EBN)', 'S. bulbocastanum (2x, 1EBN)'),
    examples: T('sauvage du Mexique ; Rpi-blb1, résistance large au mildiou', 'wild species of Mexico; Rpi-blb1, broad late blight resistance'),
    wild: true,
  },
  stoloniferum: {
    latin: 'Solanum stoloniferum',
    short: 'S. stoloniferum',
    name: T('S. stoloniferum (4x, 2EBN)', 'S. stoloniferum (4x, 2EBN)'),
    examples: T('sauvage du Mexique ; cytoplasme W (stérilité mâle), résistance aux virus', 'wild species of Mexico; W cytoplasm (male sterility), virus resistance'),
    wild: true,
  },
  acaule: {
    latin: 'Solanum acaule',
    short: 'S. acaule',
    name: T('S. acaule (4x, 2EBN)', 'S. acaule (4x, 2EBN)'),
    examples: T('sauvage des hauts plateaux andins (4 000 m), résistante au gel', 'wild species of the high Andes (4,000 m), frost tolerant'),
    wild: true,
  },
  commersonii: {
    latin: 'Solanum commersonii',
    short: 'S. commersonii',
    name: T('S. commersonii (2x, 1EBN)', 'S. commersonii (2x, 1EBN)'),
    examples: T('sauvage d’Uruguay, rustique au gel ; décrite par Commerson', 'wild species of Uruguay, frost hardy; described by Commerson'),
    wild: true,
  },
};

export type PtLocusId = 'd' | 'r' | 'p' | 'pf' | 'y' | 'zep' | 'ro' | 'eyd' | 'cdf' | 'sli' | 's' | 'ps' | 'r1' | 'blb' | 'h1' | 'ry';

export type VariantId =
  | 'D'
  | 'R'
  | 'P'
  | 'Pf'
  | 'Y'
  | 'zep'
  | 'Ro'
  | 'Eyd'
  | 'Cdf'
  | 'Sli'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'S5'
  | 'S6'
  | 'ps'
  | 'R1'
  | 'Rpi-blb1'
  | 'H1'
  | 'Ry';

export type LocusCategory = 'skin' | 'flesh' | 'tuber' | 'flower' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: PtLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  /** Effet de dose (forme du tubercule). */
  incomplete?: boolean;
  /** Locus sans effet visible (allèles S) : exclu de la prédiction de Mendel. */
  silent?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  /** Hérédité réelle plus complexe, résumée ici. */
  simplified?: boolean;
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const ALL: SpeciesId[] = [...SPECIES];
const CULT: SpeciesId[] = ['tuberosum', 'andigena', 'phureja', 'stenotomum'];
const CULT_WILD2: SpeciesId[] = [...CULT, 'chacoense'];

const S_NAMES: Array<[string, Txt]> = [
  ['S1', T('Allèle S1', 'S1 allele')],
  ['S2', T('Allèle S2', 'S2 allele')],
  ['S3', T('Allèle S3', 'S3 allele')],
  ['S4', T('Allèle S4', 'S4 allele')],
  ['S5', T('Allèle S5', 'S5 allele')],
  ['S6', T('Allèle S6', 'S6 allele')],
];

export const PT_LOCI: LocusDef[] = [
  // --- Couleur de la peau ------------------------------------------------------
  {
    id: 'd',
    symbol: 'D',
    category: 'skin',
    name: T('Développeur d’anthocyanes (D, StAN1)', 'Anthocyanin developer (D, StAN1)'),
    alleles: [
      { allele: 'D', id: 'D', name: T('Peau pigmentée', 'Pigmented skin'), effect: T('Dominant : facteur MYB (StAN1) qui allume la fabrication des anthocyanes dans la peau. Sans D, la peau reste beige, quels que soient R et P.', 'Dominant: MYB factor (StAN1) that switches on anthocyanin production in the skin. Without D, the skin stays buff whatever R and P.') },
      { allele: 'd', name: T('Peau non pigmentée', 'Unpigmented skin') },
    ],
    standard: 'd',
    documented: ALL,
    chromosome: 10,
    cM: 20,
  },
  {
    id: 'r',
    symbol: 'R',
    category: 'skin',
    name: T('Pigment rouge (R, DFR)', 'Red pigment (R, DFR)'),
    alleles: [
      { allele: 'R', id: 'R', name: T('Rouge', 'Red'), effect: T('Dominant : dihydroflavonol réductase qui fabrique la pélargonidine rouge. Avec D : peau rouge (Désirée, Roseval).', 'Dominant: dihydroflavonol reductase making red pelargonidin. With D: red skin (Désirée, Roseval).') },
      { allele: 'r', name: T('Pas de rouge', 'No red') },
    ],
    standard: 'r',
    documented: ALL,
    chromosome: 2,
    cM: 40,
  },
  {
    id: 'p',
    symbol: 'P',
    category: 'skin',
    name: T('Pigment violet (P, F3′5′H)', 'Purple pigment (P, F3′5′H)'),
    alleles: [
      { allele: 'P', id: 'P', name: T('Violet', 'Purple'), effect: T('Dominant et épistatique sur R : flavonoïde 3′,5′-hydroxylase, anthocyanes violettes (pétunidine). Avec D : peau violette ou bleu-noir (Vitelotte).', 'Dominant and epistatic over R: flavonoid 3′,5′-hydroxylase, purple anthocyanins (petunidin). With D: purple or blue-black skin (Vitelotte).') },
      { allele: 'p', name: T('Pas de violet', 'No purple') },
    ],
    standard: 'p',
    simplified: true,
    documented: ALL,
    chromosome: 11,
    cM: 30,
  },
  // --- Chair --------------------------------------------------------------------
  {
    id: 'pf',
    symbol: 'Pf',
    category: 'flesh',
    name: T('Chair pigmentée (Pf)', 'Pigmented flesh (Pf)'),
    alleles: [
      { allele: 'Pf', id: 'Pf', name: T('Chair colorée', 'Coloured flesh'), effect: T('Dominant : étend les anthocyanes de la peau à la chair. Avec D et P : chair violette (Vitelotte, Violet Queen) ; avec D et R : chair rouge (Highland Burgundy Red).', 'Dominant: extends skin anthocyanins into the flesh. With D and P: purple flesh (Vitelotte, Violet Queen); with D and R: red flesh (Highland Burgundy Red).') },
      { allele: 'pf', name: T('Chair non pigmentée', 'Unpigmented flesh') },
    ],
    standard: 'pf',
    documented: CULT,
    chromosome: 10,
    cM: 32,
  },
  {
    id: 'y',
    symbol: 'Y',
    category: 'flesh',
    name: T('Chair jaune (Y, CHY2)', 'Yellow flesh (Y, CHY2)'),
    alleles: [
      { allele: 'Y', id: 'Y', name: T('Chair jaune', 'Yellow flesh'), effect: T('Dominant, avec effet de dose : allèle 3 de la β-carotène hydroxylase, qui accumule lutéine et zéaxanthine. Une copie : chair crème-jaune ; deux ou plus : jaune franc (Charlotte, Ratte). Sans Y : chair blanche (Russet Burbank, Spunta).', 'Dominant, with a dosage effect: allele 3 of β-carotene hydroxylase, accumulating lutein and zeaxanthin. One copy: cream-yellow flesh; two or more: deep yellow (Charlotte, Ratte). Without Y: white flesh (Russet Burbank, Spunta).') },
      { allele: 'y', name: T('Chair blanche', 'White flesh') },
    ],
    standard: 'y',
    documented: ALL,
    chromosome: 3,
    cM: 50,
  },
  {
    id: 'zep',
    symbol: 'zep',
    category: 'flesh',
    name: T('Chair orange (zep)', 'Orange flesh (zep)'),
    alleles: [
      { allele: 'Zep', name: T('Zéaxanthine époxydase active', 'Active zeaxanthin epoxidase') },
      { allele: 'zep', id: 'zep', name: T('Chair orange', 'Orange flesh'), effect: T('Récessif : la zéaxanthine n’est plus transformée et s’accumule. Avec Y, la chair devient orange vif (Mayan Gold, Inca Bella). Chez un tétraploïde il faut QUATRE copies zep : c’est rarissime, d’où l’orange chez les diploïdes Phureja.', 'Recessive: zeaxanthin is no longer converted and builds up. With Y, the flesh turns bright orange (Mayan Gold, Inca Bella). A tetraploid needs FOUR zep copies: very rare, hence orange flesh in Phureja diploids.') },
    ],
    standard: 'Zep',
    documented: CULT,
    chromosome: 2,
    cM: 70,
  },
  // --- Tubercule ----------------------------------------------------------------
  {
    id: 'ro',
    symbol: 'Ro',
    category: 'tuber',
    name: T('Forme ronde (Ro, StOFP20)', 'Round shape (Ro, StOFP20)'),
    alleles: [
      { allele: 'Ro', id: 'Ro', name: T('Tubercule rond', 'Round tuber'), effect: T('Dominant avec effet de dose : 0 copie Ro = tubercule long (Ratte, Russet Burbank) ; chez un tétraploïde, une copie = oblong ; deux ou plus = rond.', 'Dominant with a dosage effect: 0 Ro copies = long tuber (Ratte, Russet Burbank); in a tetraploid, one copy = oval; two or more = round.') },
      { allele: 'ro', name: T('Tubercule long', 'Long tuber') },
    ],
    standard: 'ro',
    incomplete: true,
    documented: ALL,
    chromosome: 10,
    cM: 60,
  },
  {
    id: 'eyd',
    symbol: 'Eyd',
    category: 'tuber',
    name: T('Yeux profonds (Eyd)', 'Deep eyes (Eyd)'),
    alleles: [
      { allele: 'Eyd', id: 'Eyd', name: T('Yeux profonds', 'Deep eyes'), effect: T('Dominant : yeux enfoncés, comme chez les sauvages et beaucoup de variétés anciennes. Les variétés modernes à peau lisse sont « eyd » à toutes les copies. Très lié à Ro (4 cM).', 'Dominant: sunken eyes, as in wild species and many old varieties. Modern smooth-skinned varieties are “eyd” at every copy. Tightly linked to Ro (4 cM).') },
      { allele: 'eyd', name: T('Yeux superficiels', 'Shallow eyes') },
    ],
    standard: 'eyd',
    documented: ALL,
    chromosome: 10,
    cM: 64,
  },
  {
    id: 'cdf',
    symbol: 'Cdf',
    category: 'tuber',
    name: T('Tubérisation en jours longs (StCDF1)', 'Long-day tuberization (StCDF1)'),
    alleles: [
      { allele: 'Cdf', id: 'Cdf', name: T('Tubérise en été européen', 'Tuberizes in European summer'), effect: T('Dominant : allèle tronqué de StCDF1 (Kloosterman et al. 2013) qui déclenche la tubérisation malgré les jours longs. Apparu chez les pommes de terre du Chili et indispensable en Europe : sans lui, la plante ne forme ses tubercules qu’en automne.', 'Dominant: truncated StCDF1 allele (Kloosterman et al. 2013) that triggers tuberization despite long days. Arose in Chilean potatoes and essential in Europe: without it, the plant only forms tubers in autumn.') },
      { allele: 'cdf', name: T('Jours courts seulement', 'Short days only') },
    ],
    standard: 'cdf',
    documented: ALL,
    chromosome: 5,
    cM: 20,
  },
  // --- Fleurs et reproduction ---------------------------------------------------------
  {
    id: 'sli',
    symbol: 'Sli',
    category: 'flower',
    name: T('Inhibiteur du locus S (Sli)', 'S-locus inhibitor (Sli)'),
    alleles: [
      { allele: 'Sli', id: 'Sli', name: T('Autocompatible', 'Self-compatible'), effect: T('Dominant, agit dans le grain de pollen : un pollen porteur de Sli échappe au rejet S-RNase. Venu de S. chacoense (lignée M6), il rend possibles les lignées diploïdes fixées et la « pomme de terre hybride » (graine F1).', 'Dominant, acts in the pollen grain: pollen carrying Sli escapes S-RNase rejection. From S. chacoense (M6 line), it makes fixed diploid lines and “hybrid potato” (F1 seed) possible.') },
      { allele: 'sli', name: T('Pas d’inhibiteur', 'No inhibitor') },
    ],
    standard: 'sli',
    documented: ['chacoense', 'phureja', 'stenotomum', 'tuberosum'],
    chromosome: 12,
    cM: 10,
  },
  {
    id: 's',
    symbol: 'S',
    category: 'flower',
    name: T('Auto-incompatibilité (S-RNase)', 'Self-incompatibility (S-RNase)'),
    alleles: S_NAMES.map(([a, n]) => ({
      allele: a,
      id: a as VariantId,
      name: n,
      effect: T('Chez un diploïde, le style détruit les tubes polliniques qui portent un de ses allèles S : c’est l’allèle du GRAIN de pollen qui compte (auto-incompatibilité gamétophytique). Un pollen tétraploïde porte deux allèles S différents et passe.', 'In a diploid, the style destroys pollen tubes carrying one of its S alleles: what matters is the allele of the pollen GRAIN (gametophytic self-incompatibility). Tetraploid pollen carries two different S alleles and gets through.'),
    })),
    standard: 'S1',
    silent: true,
    documented: ALL,
    chromosome: 1,
    cM: 60,
  },
  {
    id: 'ps',
    symbol: 'ps',
    category: 'flower',
    name: T('Pollen 2n (ps, fuseaux parallèles)', '2n pollen (ps, parallel spindles)'),
    alleles: [
      { allele: 'Ps', name: T('Pollen réduit (n)', 'Reduced pollen (n)') },
      { allele: 'ps', id: 'ps', name: T('Pollen 2n', '2n pollen'), effect: T('Récessif : à la deuxième division de la méiose, les fuseaux sont parallèles et le grain de pollen garde TOUS les chromosomes (2n). Un diploïde ps/ps produit 20 à 40 % de pollen 2n, qui féconde la pomme de terre tétraploïde.', 'Recessive: at the second meiotic division the spindles are parallel and the pollen grain keeps ALL chromosomes (2n). A ps/ps diploid makes 20 to 40% 2n pollen, which can fertilise tetraploid potato.') },
    ],
    standard: 'Ps',
    documented: ['phureja', 'stenotomum', 'chacoense', 'tuberosum'],
    cM: 0,
  },
  // --- Résistances --------------------------------------------------------------------
  {
    id: 'r1',
    symbol: 'R1',
    category: 'resistance',
    name: T('Mildiou, gène R1', 'Late blight, R1 gene'),
    alleles: [
      { allele: 'R1', id: 'R1', name: T('R1', 'R1'), effect: T('Dominant : premier gène de résistance au mildiou (Phytophthora infestans), venu de S. demissum dans les années 1930. Contourné en quelques années par de nouvelles races : il ne protège presque plus.', 'Dominant: the first late blight (Phytophthora infestans) resistance gene, from S. demissum in the 1930s. Overcome within a few years by new races: it hardly protects any more.') },
      { allele: 'r1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'r1',
    documented: ['demissum', 'tuberosum'],
    chromosome: 5,
    cM: 50,
  },
  {
    id: 'blb',
    symbol: 'Rpi-blb',
    category: 'resistance',
    name: T('Mildiou, Rpi-blb (S. bulbocastanum)', 'Late blight, Rpi-blb (S. bulbocastanum)'),
    alleles: [
      { allele: 'Rpi-blb1', id: 'Rpi-blb1', name: T('Rpi-blb', 'Rpi-blb'), effect: T('Dominant : résistance large au mildiou (Rpi-blb1 = RB, Rpi-blb2) venue de S. bulbocastanum (1EBN, qui ne se croise pas directement avec la pomme de terre). Les deux gènes sont réunis ici en un seul. Il a fallu des ponts entre espèces (doublement, S. acaule) ou la fusion de cellules pour l’introduire.', 'Dominant: broad late blight resistance (Rpi-blb1 = RB, Rpi-blb2) from S. bulbocastanum (1EBN, which does not cross directly with potato). Bridge crosses (doubling, S. acaule) or cell fusion were needed to bring it in. Both genes are merged here into one.') },
      { allele: 'rpi', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'rpi',
    documented: ['bulbocastanum', 'tuberosum'],
    chromosome: 8,
    cM: 30,
  },
  {
    id: 'h1',
    symbol: 'H1',
    category: 'resistance',
    name: T('Nématode doré (H1)', 'Golden nematode (H1)'),
    alleles: [
      { allele: 'H1', id: 'H1', name: T('H1', 'H1'), effect: T('Dominant : résistance au nématode à kyste doré (Globodera rostochiensis, pathotypes Ro1 et Ro4), venue d’une pomme de terre andine (CPC 1673). Présent dans Maris Piper, Nicola, Agria…', 'Dominant: resistance to golden cyst nematode (Globodera rostochiensis, pathotypes Ro1 and Ro4), from an Andean potato (CPC 1673). Present in Maris Piper, Nicola, Agria…') },
      { allele: 'h1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'h1',
    documented: ['andigena', 'tuberosum'],
    chromosome: 5,
    cM: 70,
  },
  {
    id: 'ry',
    symbol: 'Ry',
    category: 'resistance',
    name: T('Virus Y (Ry-adg / Ry-sto)', 'Potato virus Y (Ry-adg / Ry-sto)'),
    alleles: [
      { allele: 'Ry', id: 'Ry', name: T('Ry', 'Ry'), effect: T('Dominant : résistance « extrême » au virus Y (le virus n’arrive pas à se multiplier), venue d’Andigena (Ry-adg) ou de S. stoloniferum (Ry-sto), réunis ici. Les tubercules replantés ne dégénèrent pas.', 'Dominant: “extreme” resistance to potato virus Y (the virus cannot multiply), from Andigena (Ry-adg) or S. stoloniferum (Ry-sto), merged here. Replanted tubers do not run down.') },
      { allele: 'ry', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'ry',
    documented: ['andigena', 'tuberosum', 'stoloniferum'],
    chromosome: 11,
    cM: 70,
  },
];

export const LOCUS_BY_ID: Record<PtLocusId, LocusDef> = Object.fromEntries(PT_LOCI.map((l) => [l.id, l])) as Record<PtLocusId, LocusDef>;
export const LOCUS_IDS: PtLocusId[] = PT_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [PtLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [PtLocusId, string]>;
  for (const l of PT_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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

export const CULTIVATED_SPECIES = CULT_WILD2;
