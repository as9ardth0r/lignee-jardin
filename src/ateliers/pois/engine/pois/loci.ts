/**
 * Espèces et loci mendéliens du pois (genre Pisum).
 *
 * LES SEPT CARACTÈRES DE MENDEL (1866), tous identifiés aujourd’hui au
 * niveau moléculaire pour la plupart :
 *  - forme de la graine R/r : r = SBEI, enzyme de ramification de
 *    l’amidon, inactivée par un transposon (Bhattacharyya et al. 1990) ;
 *  - couleur des cotylédons I/i : i = « stay-green » (SGR), la chlorophylle
 *    n’est pas dégradée (Armstead et al. 2007 ; Sato et al. 2007) ;
 *  - couleur des fleurs et du tégument A/a : facteur bHLH des anthocyanes
 *    (Hellens et al. 2010) ;
 *  - forme de la gousse V/v (gousse « étranglée », sans parchemin) ;
 *  - couleur de la gousse Gp/gp (jaune) ;
 *  - position des fleurs Fa/fa (fasciation, fleurs en bouquet terminal) ;
 *  - longueur de la tige Le/le : le = GA 3-oxydase (Lester et al. 1997 ;
 *    Martin et al. 1997), le pois nain.
 *
 * Mendel a eu la chance (ou le flair) de choisir des gènes indépendants, ou
 * si éloignés que leur liaison ne se voyait pas… à une exception près qu’il
 * n’a pas testée : Le et V, à ~12 cM sur le même chromosome.
 *
 * Le pois est AUTOGAME et CLÉISTOGAME : la fleur s’autoféconde avant même
 * de s’ouvrir. Pour croiser, il faut ouvrir le bouton et retirer les
 * étamines avant qu’elles ne libèrent leur pollen — le geste de Mendel.
 */

export type SpeciesId = 'sativum' | 'elatius' | 'fulvum' | 'abyssinicum';

export const SPECIES: SpeciesId[] = ['sativum', 'elatius', 'fulvum', 'abyssinicum'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt }> = {
  sativum: {
    latin: 'Pisum sativum',
    short: 'P. sativum',
    name: T('Pois cultivé', 'Garden pea'),
    examples: T('petits pois, mangetout, pois gourmands, pois protéagineux, pois fourragers', 'garden peas, snow peas, snap peas, field peas, fodder peas'),
  },
  elatius: {
    latin: 'Pisum sativum subsp. elatius',
    short: 'subsp. elatius',
    name: T('Pois sauvage (elatius)', 'Wild pea (elatius)'),
    examples: T('l’ancêtre sauvage, du Proche-Orient à la Méditerranée : grimpant, gousses qui éclatent, graines dures', 'the wild ancestor, from the Near East to the Mediterranean: climbing, shattering pods, hard seeds'),
  },
  fulvum: {
    latin: 'Pisum fulvum',
    short: 'P. fulvum',
    name: T('Pois fauve', 'Tawny pea'),
    examples: T('espèce sauvage aux fleurs orangées ; source de résistances (oïdium er3, bruches)', 'wild species with orange flowers; source of resistances (powdery mildew er3, bruchids)'),
  },
  abyssinicum: {
    latin: 'Pisum abyssinicum',
    short: 'P. abyssinicum',
    name: T('Pois d’Abyssinie', 'Abyssinian pea'),
    examples: T('pois cultivé d’Éthiopie et du Yémen, domestiqué indépendamment, très précoce', 'cultivated pea of Ethiopia and Yemen, domesticated independently, very early'),
  },
};

export type PsLocusId = 'r' | 'i' | 'a' | 'v' | 'gp' | 'fa' | 'le' | 'af' | 'tl' | 'n' | 'hr' | 'er1' | 'er3' | 'fw' | 'sbm';

export type VariantId = 'r' | 'i' | 'A' | 'v' | 'gp' | 'fa' | 'le' | 'af' | 'tl' | 'n' | 'Hr' | 'er1' | 'er3' | 'Fw' | 'sbm1';

export type LocusCategory = 'mendel' | 'plant' | 'pod' | 'season' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: PsLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  silent?: boolean;
  /** Un des sept caractères étudiés par Mendel. */
  mendel?: boolean;
  /** Caractère de la GRAINE (visible sur la graine récoltée, génotype de l’embryon). */
  seed?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  simplified?: boolean;
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const ALL: SpeciesId[] = [...SPECIES];
const SAT: SpeciesId[] = ['sativum', 'elatius'];

export const PS_LOCI: LocusDef[] = [
  // --- Les sept caractères de Mendel ---------------------------------------------
  {
    id: 'r',
    symbol: 'R',
    category: 'mendel',
    mendel: true,
    seed: true,
    name: T('Graine ronde ou ridée (R)', 'Round or wrinkled seed (R)'),
    alleles: [
      { allele: 'R', name: T('Graine ronde', 'Round seed') },
      { allele: 'r', id: 'r', name: T('Graine ridée', 'Wrinkled seed'), effect: T('Récessif : l’enzyme de ramification de l’amidon (SBEI) est cassée par un transposon de 800 paires de bases. La graine garde plus de sucre, absorbe de l’eau puis se ride en séchant : c’est le petit pois sucré des jardins.', 'Recessive: the starch-branching enzyme (SBEI) is broken by an 800-base-pair transposon. The seed keeps more sugar, takes up water, then wrinkles as it dries: the sweet garden pea.') },
    ],
    standard: 'R',
    documented: ALL,
    chromosome: 7,
    cM: 60,
  },
  {
    id: 'i',
    symbol: 'I',
    category: 'mendel',
    mendel: true,
    seed: true,
    name: T('Cotylédons jaunes ou verts (I)', 'Yellow or green cotyledons (I)'),
    alleles: [
      { allele: 'I', name: T('Cotylédons jaunes', 'Yellow cotyledons') },
      { allele: 'i', id: 'i', name: T('Cotylédons verts', 'Green cotyledons'), effect: T('Récessif : mutation du gène « stay-green » (SGR) ; la chlorophylle n’est pas dégradée quand la graine mûrit, elle reste verte. Le même gène garde vert le gazon de certaines graminées.', 'Recessive: mutation of the “stay-green” gene (SGR); chlorophyll is not broken down as the seed ripens, so it stays green. The same gene keeps some grasses green.') },
    ],
    standard: 'I',
    documented: ALL,
    chromosome: 1,
    cM: 10,
  },
  {
    id: 'a',
    symbol: 'A',
    category: 'mendel',
    mendel: true,
    name: T('Fleurs pourpres, tégument coloré (A)', 'Purple flowers, coloured seed coat (A)'),
    alleles: [
      { allele: 'A', id: 'A', name: T('Fleurs pourpres', 'Purple flowers'), effect: T('Dominant : facteur bHLH qui allume les anthocyanes. Fleurs pourpres (étendard rose, ailes pourpres), aisselles rouges et tégument gris-brun qui cache la couleur des cotylédons. Le tégument est un tissu de la MÈRE.', 'Dominant: bHLH factor switching on anthocyanins. Purple flowers (pink standard, purple wings), red leaf axils and a grey-brown seed coat hiding the cotyledon colour. The seed coat is MOTHER tissue.') },
      { allele: 'a', name: T('Fleurs blanches', 'White flowers') },
    ],
    standard: 'a',
    documented: ALL,
    chromosome: 1,
    cM: 120,
  },
  {
    id: 'v',
    symbol: 'V',
    category: 'mendel',
    mendel: true,
    name: T('Gousse pleine ou étranglée (V)', 'Inflated or constricted pod (V)'),
    alleles: [
      { allele: 'V', name: T('Gousse pleine (à parchemin)', 'Inflated pod (with parchment)') },
      { allele: 'v', id: 'v', name: T('Gousse étranglée, mangetout', 'Constricted pod, edible'), effect: T('Récessif : la paroi de la gousse n’a pas sa couche fibreuse (le « parchemin ») ; elle s’étrangle entre les graines en séchant… et se mange entière : c’est le pois mangetout.', 'Recessive: the pod wall lacks its fibrous layer (the “parchment”); it pinches between the seeds as it dries… and can be eaten whole: the snow pea.') },
    ],
    standard: 'V',
    simplified: true,
    documented: SAT,
    chromosome: 4,
    cM: 92,
    note: T('Deux gènes (p et v) contrôlent le parchemin ; on ne garde ici que V, celui de Mendel.', 'Two genes (p and v) control parchment; only Mendel’s V is kept here.'),
  },
  {
    id: 'gp',
    symbol: 'Gp',
    category: 'mendel',
    mendel: true,
    name: T('Gousse verte ou jaune (Gp)', 'Green or yellow pod (Gp)'),
    alleles: [
      { allele: 'Gp', name: T('Gousse verte', 'Green pod') },
      { allele: 'gp', id: 'gp', name: T('Gousse jaune', 'Yellow pod'), effect: T('Récessif : la gousse fabrique peu de chlorophylle et reste jaune d’or (Golden Sweet).', 'Recessive: the pod makes little chlorophyll and stays golden yellow (Golden Sweet).') },
    ],
    standard: 'Gp',
    documented: SAT,
    chromosome: 5,
    cM: 40,
  },
  {
    id: 'fa',
    symbol: 'Fa',
    category: 'mendel',
    mendel: true,
    name: T('Fleurs axillaires ou terminales (Fa)', 'Axial or terminal flowers (Fa)'),
    alleles: [
      { allele: 'Fa', name: T('Fleurs le long de la tige', 'Flowers along the stem') },
      { allele: 'fa', id: 'fa', name: T('Fleurs en bouquet terminal', 'Terminal flower cluster'), effect: T('Récessif : la tige devient « fasciée », large et aplatie, et porte toutes ses fleurs en bouquet au sommet (pois à bouquet, pois « momie »).', 'Recessive: the stem becomes “fasciated”, wide and flat, and carries all its flowers in a cluster at the top (crown pea, “mummy” pea).') },
    ],
    standard: 'Fa',
    documented: SAT,
    chromosome: 4,
    cM: 10,
  },
  {
    id: 'le',
    symbol: 'Le',
    category: 'mendel',
    mendel: true,
    name: T('Tige longue ou naine (Le)', 'Tall or dwarf stem (Le)'),
    alleles: [
      { allele: 'Le', name: T('Tige longue', 'Tall stem') },
      { allele: 'le', id: 'le', name: T('Pois nain', 'Dwarf pea'), effect: T('Récessif : la GA 3-oxydase ne fabrique presque plus de gibbérelline active ; les entrenœuds restent courts (pois nain, sans rames). Un remplacement d’un seul acide aminé, identifié en 1997.', 'Recessive: GA 3-oxidase hardly makes active gibberellin; internodes stay short (dwarf pea, no sticks needed). A single amino-acid change, identified in 1997.') },
    ],
    standard: 'Le',
    documented: ALL,
    chromosome: 4,
    cM: 80,
  },
  // --- Plante ------------------------------------------------------------------------------
  {
    id: 'af',
    symbol: 'af',
    category: 'plant',
    name: T('Afila : folioles en vrilles (af)', 'Afila: leaflets turned to tendrils (af)'),
    alleles: [
      { allele: 'Af', name: T('Feuilles normales', 'Normal leaves') },
      { allele: 'af', id: 'af', name: T('Afila (semi-aphylle)', 'Afila (semi-leafless)'), effect: T('Récessif : toutes les folioles deviennent des vrilles. Les plantes s’accrochent les unes aux autres et ne versent plus : presque tous les pois protéagineux modernes sont afila.', 'Recessive: all leaflets become tendrils. Plants hold each other up and no longer lodge: almost all modern field peas are afila.') },
    ],
    standard: 'Af',
    documented: SAT,
    chromosome: 1,
    cM: 50,
  },
  {
    id: 'tl',
    symbol: 'tl',
    category: 'plant',
    name: T('Sans vrilles (tl)', 'Tendril-less (tl)'),
    alleles: [
      { allele: 'Tl', name: T('Vrilles', 'Tendrils') },
      { allele: 'tl', id: 'tl', name: T('Vrilles changées en folioles', 'Tendrils turned to leaflets'), effect: T('Récessif : les vrilles deviennent des folioles (pois « acacia »). Avec af, les deux mutations donnent une feuille très découpée, le pois « persil ».', 'Recessive: tendrils become leaflets (“acacia” pea). Combined with af, the two give a finely divided leaf, the “parsley” pea.') },
    ],
    standard: 'Tl',
    documented: SAT,
    chromosome: 7,
    cM: 90,
  },
  // --- Gousse -------------------------------------------------------------------------------
  {
    id: 'n',
    symbol: 'n',
    category: 'pod',
    name: T('Gousse charnue (n)', 'Fleshy pod (n)'),
    alleles: [
      { allele: 'N', name: T('Paroi fine', 'Thin wall') },
      { allele: 'n', id: 'n', name: T('Paroi épaisse et charnue', 'Thick, fleshy wall'), effect: T('Récessif : paroi de gousse épaisse. Avec v (sans parchemin), elle donne le pois gourmand « Sugar Snap », croquant et rond (Lamborn, 1979).', 'Recessive: thick pod wall. With v (no parchment), it gives the crunchy, round “Sugar Snap” pea (Lamborn, 1979).') },
    ],
    standard: 'N',
    simplified: true,
    documented: ['sativum'],
    cM: 0,
  },
  // --- Saison ---------------------------------------------------------------------------------
  {
    id: 'hr',
    symbol: 'Hr',
    category: 'season',
    name: T('Pois d’hiver (Hr, ELF3)', 'Winter pea (Hr, ELF3)'),
    alleles: [
      { allele: 'Hr', id: 'Hr', name: T('Type hiver', 'Winter type'), effect: T('Dominant : en jours courts, la floraison est retardée ; la plante reste en rosette tout l’hiver et résiste au gel. Gène ELF3 de l’horloge circadienne (Weller et al. 2012). Les pois de printemps (hr) fleurissent tout de suite.', 'Dominant: in short days flowering is delayed; the plant stays as a rosette all winter and survives frost. ELF3 circadian clock gene (Weller et al. 2012). Spring peas (hr) flower straight away.') },
      { allele: 'hr', name: T('Type printemps', 'Spring type') },
    ],
    standard: 'hr',
    simplified: true,
    documented: ALL,
    chromosome: 3,
    cM: 30,
  },
  // --- Résistances --------------------------------------------------------------------------
  {
    id: 'er1',
    symbol: 'er1',
    category: 'resistance',
    name: T('Oïdium (er1, MLO)', 'Powdery mildew (er1, MLO)'),
    alleles: [
      { allele: 'Er1', name: T('Sensible', 'Susceptible') },
      { allele: 'er1', id: 'er1', name: T('er1', 'er1'), effect: T('Récessif : perte de fonction du gène MLO (Humphry et al. 2011), comme l’orge mlo ; le champignon de l’oïdium ne pénètre plus dans les cellules. Résistance durable.', 'Recessive: loss of function of the MLO gene (Humphry et al. 2011), like barley mlo; the powdery mildew fungus can no longer enter cells. Durable resistance.') },
    ],
    standard: 'Er1',
    documented: SAT,
    chromosome: 6,
    cM: 60,
  },
  {
    id: 'er3',
    symbol: 'Er3',
    category: 'resistance',
    name: T('Oïdium (Er3, de P. fulvum)', 'Powdery mildew (Er3, from P. fulvum)'),
    alleles: [
      { allele: 'Er3', id: 'er3', name: T('Er3', 'Er3'), effect: T('Dominant : résistance à l’oïdium trouvée chez P. fulvum et introduite chez le pois cultivé par croisement interspécifique (Fondevilla et al. 2007).', 'Dominant: powdery mildew resistance found in P. fulvum and brought into garden pea by interspecific crossing (Fondevilla et al. 2007).') },
      { allele: 'er3', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'er3',
    documented: ['fulvum', 'sativum'],
    cM: 0,
  },
  {
    id: 'fw',
    symbol: 'Fw',
    category: 'resistance',
    name: T('Fusariose (Fw)', 'Fusarium wilt (Fw)'),
    alleles: [
      { allele: 'Fw', id: 'Fw', name: T('Fw', 'Fw'), effect: T('Dominant : résistance à la fusariose race 1 (Fusarium oxysporum f. sp. pisi), découverte dans les années 1930 par Wade ; présente dans la plupart des variétés modernes.', 'Dominant: resistance to Fusarium wilt race 1 (Fusarium oxysporum f. sp. pisi), found in the 1930s by Wade; present in most modern varieties.') },
      { allele: 'fw', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'fw',
    documented: SAT,
    chromosome: 3,
    cM: 80,
  },
  {
    id: 'sbm',
    symbol: 'sbm1',
    category: 'resistance',
    name: T('Virus de la mosaïque (sbm1, eIF4E)', 'Seed-borne mosaic virus (sbm1, eIF4E)'),
    alleles: [
      { allele: 'Sbm1', name: T('Sensible', 'Susceptible') },
      { allele: 'sbm1', id: 'sbm1', name: T('sbm1', 'sbm1'), effect: T('Récessif : forme modifiée du facteur eIF4E dont le virus de la mosaïque transmis par les semences (PSbMV) a besoin pour se multiplier (Gao et al. 2004).', 'Recessive: altered form of the eIF4E factor the pea seed-borne mosaic virus (PSbMV) needs to multiply (Gao et al. 2004).') },
    ],
    standard: 'Sbm1',
    documented: SAT,
    chromosome: 6,
    cM: 20,
  },
];

export const LOCUS_BY_ID: Record<PsLocusId, LocusDef> = Object.fromEntries(PS_LOCI.map((l) => [l.id, l])) as Record<PsLocusId, LocusDef>;
export const LOCUS_IDS: PsLocusId[] = PS_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [PsLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [PsLocusId, string]>;
  for (const l of PS_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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
