/**
 * Espèces et loci mendéliens des pastèques (genre Citrullus, 2n = 22,
 * 11 chromosomes Chr01 à Chr11).
 *
 * Sources : liste des gènes de la pastèque du Cucurbit Genetics
 * Cooperative (Guner & Wehner 2004, HortScience 39:1175 ; mises à jour
 * CGC 2012-2017) ; gènes clonés : ClLCYB (C, chair jaune canari ;
 * Bang et al. 2007), ClSUN (O, fruit allongé ; Dou et al. 2018), ClBt
 * (amertume ; Zhang et al. 2016), ClACS7 (andromonoécie ; Manzano et al.
 * 2016), ClGA20ox / dw-1 (port nain), ClTFIIS / gms (stérilité mâle
 * glabre), eIF4E (zym, résistance au ZYMV ; Ling et al. 2009), Fo-1
 * (fusariose race 1 ; Lambel et al. 2014). Positions en cM : ordres de
 * grandeur d’après les cartes de référence (approchées).
 *
 * Modèle de la couleur de la chair (simplifié, mais fidèle à la logique
 * d’épistasie publiée) :
 *  - Wf est épistatique : chair BLANCHE quels que soient les autres gènes
 *    (citres, coloquinte, pastèques « crème ») ;
 *  - sinon C (dominant) donne une chair JAUNE CANARI (pas de lycopène) ;
 *  - sinon la série Y > y-o > y : rouge (lycopène), orange, jaune saumon.
 * Écorce : série G (vert foncé uni) > gs (rayée) > g (vert clair) ; Sp
 * ajoute les « lunes et étoiles » jaunes ; go fait virer l’écorce au doré.
 * Graine : w/w blanche (épistatique), r/r rouge, t/t brun clair, sinon
 * noire ; eg/eg = graine « égousi » (enveloppe charnue, graine à manger).
 */

export type SpeciesId = 'lanatus' | 'mucosospermus' | 'amarus' | 'colocynthis' | 'ecirrhosus';

export const SPECIES: SpeciesId[] = ['lanatus', 'mucosospermus', 'amarus', 'colocynthis', 'ecirrhosus'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt }> = {
  lanatus: {
    latin: 'Citrullus lanatus',
    short: 'C. lanatus',
    name: T('Pastèque', 'Watermelon'),
    examples: T('Crimson Sweet, Sugar Baby, Charleston Gray, Moon and Stars, pastèques sans pépins', 'Crimson Sweet, Sugar Baby, Charleston Gray, Moon and Stars, seedless watermelons'),
  },
  mucosospermus: {
    latin: 'Citrullus mucosospermus',
    short: 'C. mucosospermus',
    name: T('Égousi (pastèque à graines)', 'Egusi (seed watermelon)'),
    examples: T('égousi d’Afrique de l’Ouest, cultivé pour ses graines', 'West African egusi, grown for its seeds'),
  },
  amarus: {
    latin: 'Citrullus amarus',
    short: 'C. amarus',
    name: T('Citre (melon à confiture)', 'Citron melon'),
    examples: T('citre à graines rouges, Tsamma du Kalahari, porte-greffes, donneurs de résistances', 'red-seeded citron, Kalahari tsamma, rootstocks, resistance donors'),
  },
  colocynthis: {
    latin: 'Citrullus colocynthis',
    short: 'C. colocynthis',
    name: T('Coloquinte', 'Colocynth'),
    examples: T('coloquinte sauvage, amère et toxique, vivace des déserts', 'wild colocynth, bitter and toxic, a desert perennial'),
  },
  ecirrhosus: {
    latin: 'Citrullus ecirrhosus',
    short: 'C. ecirrhosus',
    name: T('Pastèque du Namib', 'Namib tendril-less melon'),
    examples: T('espèce sauvage vivace sans vrilles du désert du Namib', 'wild, tendril-less perennial of the Namib desert'),
  },
};

export type WmLocusId =
  | 'wf'
  | 'c'
  | 'y'
  | 'g'
  | 'sp'
  | 'go'
  | 'o'
  | 'e'
  | 'w'
  | 'r'
  | 't'
  | 'eg'
  | 'ts'
  | 'bi'
  | 'dw'
  | 'a'
  | 'gms'
  | 'fo1'
  | 'ar1'
  | 'db'
  | 'zym';

export type VariantId =
  | 'Wf'
  | 'C'
  | 'yo'
  | 'y'
  | 'G'
  | 'gs'
  | 'Sp'
  | 'go'
  | 'O'
  | 'e'
  | 'w'
  | 'r'
  | 't'
  | 'eg'
  | 'ts'
  | 'Bi'
  | 'dw'
  | 'a'
  | 'gms'
  | 'Fo1'
  | 'Ar1'
  | 'db'
  | 'zym';

export type LocusCategory = 'flesh' | 'rind' | 'seed' | 'plant' | 'flower' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: WmLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  /** Chromosome Chr01–Chr11 (absent : traité comme indépendant). */
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const LAN: SpeciesId[] = ['lanatus', 'mucosospermus'];
const WILD: SpeciesId[] = ['amarus', 'colocynthis', 'ecirrhosus'];
const ALL: SpeciesId[] = [...LAN, ...WILD];

export const WM_LOCI: LocusDef[] = [
  // --- Chair ----------------------------------------------------------------
  {
    id: 'wf',
    symbol: 'Wf',
    category: 'flesh',
    name: T('Chair blanche (Wf)', 'White flesh (Wf)'),
    alleles: [
      {
        allele: 'Wf',
        id: 'Wf',
        name: T('Chair blanche', 'White flesh'),
        effect: T('Dominant et épistatique : chair blanche ou crème quels que soient les gènes de couleur (citres, coloquinte, « Cream of Saskatchewan »).', 'Dominant and epistatic: white or cream flesh whatever the colour genes (citrons, colocynth, “Cream of Saskatchewan”).'),
      },
      { allele: 'wf', name: T('Chair colorée', 'Coloured flesh') },
    ],
    standard: 'wf',
    documented: ALL,
    cM: 0,
  },
  {
    id: 'c',
    symbol: 'C',
    category: 'flesh',
    name: T('Jaune canari (C)', 'Canary yellow (C)'),
    alleles: [
      {
        allele: 'C',
        id: 'C',
        name: T('Chair jaune canari', 'Canary yellow flesh'),
        effect: T('Dominant (gène ClLCYB) : le lycopène rouge est transformé en carotènes jaunes ; chair jaune vif (Yellow Doll, Desert King). Masque la série Y.', 'Dominant (ClLCYB gene): red lycopene is turned into yellow carotenes; bright yellow flesh (Yellow Doll, Desert King). Masks the Y series.'),
      },
      { allele: 'c', name: T('Pas de jaune canari', 'No canary yellow') },
    ],
    standard: 'c',
    documented: LAN,
    hypothetical: WILD,
    chromosome: 4,
    cM: 40,
  },
  {
    id: 'y',
    symbol: 'Y',
    category: 'flesh',
    name: T('Rouge / orange / saumon (série Y)', 'Red / orange / salmon (Y series)'),
    alleles: [
      { allele: 'Y', name: T('Chair rouge', 'Red flesh') },
      {
        allele: 'yo',
        id: 'yo',
        name: T('Chair orange', 'Orange flesh'),
        effect: T('Allèle intermédiaire de la série Y > y-o > y : chair orange (Orangeglo, Tendersweet Orange), riche en prolycopène.', 'Middle allele of the Y > y-o > y series: orange flesh (Orangeglo, Tendersweet Orange), rich in prolycopene.'),
      },
      { allele: 'y', id: 'y', name: T('Chair jaune saumon', 'Salmon yellow flesh'), effect: T('Récessif : chair jaune saumon pâle.', 'Recessive: pale salmon yellow flesh.') },
    ],
    standard: 'Y',
    documented: LAN,
    hypothetical: WILD,
    chromosome: 1,
    cM: 45,
  },
  // --- Écorce ---------------------------------------------------------------
  {
    id: 'g',
    symbol: 'G',
    category: 'rind',
    name: T('Couleur de l’écorce (série G)', 'Rind colour (G series)'),
    alleles: [
      { allele: 'G', id: 'G', name: T('Vert foncé uni', 'Solid dark green'), effect: T('Dominant : écorce vert foncé presque noire (Sugar Baby, Black Diamond).', 'Dominant: almost black dark green rind (Sugar Baby, Black Diamond).') },
      { allele: 'gs', id: 'gs', name: T('Rayée', 'Striped'), effect: T('Intermédiaire : larges rayures vert foncé sur fond clair (Crimson Sweet, Jubilee).', 'Intermediate: broad dark stripes on a light background (Crimson Sweet, Jubilee).') },
      { allele: 'g', name: T('Vert clair', 'Light green'), effect: T('Récessif : écorce vert clair à grisâtre (Charleston Gray).', 'Recessive: light green to greyish rind (Charleston Gray).') },
    ],
    standard: 'g',
    documented: LAN,
    hypothetical: WILD,
    chromosome: 8,
    cM: 40,
  },
  {
    id: 'sp',
    symbol: 'Sp',
    category: 'rind',
    name: T('Lunes et étoiles (Sp)', 'Moon and stars (Sp)'),
    alleles: [
      {
        allele: 'Sp',
        id: 'Sp',
        name: T('Taches jaunes', 'Yellow spots'),
        effect: T('Dominant : taches jaunes sur l’écorce (une grande « lune » et des « étoiles ») et sur les feuilles ; la célèbre Moon and Stars.', 'Dominant: yellow spots on the rind (a large “moon” and “stars”) and on the leaves; the famous Moon and Stars.'),
      },
      { allele: 'sp', name: T('Sans taches', 'No spots') },
    ],
    standard: 'sp',
    documented: LAN,
    cM: 0,
  },
  {
    id: 'go',
    symbol: 'go',
    category: 'rind',
    name: T('Écorce dorée (go)', 'Golden rind (go)'),
    alleles: [
      { allele: 'Go', name: T('Écorce verte à maturité', 'Rind stays green') },
      { allele: 'go', id: 'go', name: T('Écorce dorée', 'Golden rind'), effect: T('Récessif : l’écorce (et les vieilles feuilles) virent au jaune d’or à maturité — un repère de récolte (Golden Midget).', 'Recessive: the rind (and old leaves) turn golden yellow when ripe — a harvest cue (Golden Midget).') },
    ],
    standard: 'Go',
    documented: LAN,
    cM: 0,
  },
  {
    id: 'o',
    symbol: 'O',
    category: 'rind',
    name: T('Forme du fruit (O)', 'Fruit shape (O)'),
    alleles: [
      {
        allele: 'O',
        id: 'O',
        name: T('Fruit allongé', 'Elongated fruit'),
        effect: T('Dominance incomplète (gène ClSUN) : O/O allongé, O/o ovale, o/o rond. Une F1 rond × long est ovale, et la F2 donne 1 rond : 2 ovales : 1 long.', 'Incomplete dominance (ClSUN gene): O/O elongated, O/o oval, o/o round. A round × long F1 is oval, and the F2 gives 1 round : 2 oval : 1 long.'),
      },
      { allele: 'o', name: T('Fruit rond', 'Round fruit') },
    ],
    standard: 'o',
    incomplete: true,
    documented: LAN,
    hypothetical: WILD,
    chromosome: 3,
    cM: 30,
  },
  {
    id: 'e',
    symbol: 'e',
    category: 'rind',
    name: T('Écorce explosive (e)', 'Explosive rind (e)'),
    alleles: [
      { allele: 'E', name: T('Écorce normale', 'Normal rind') },
      { allele: 'e', id: 'e', name: T('Écorce fine, explosive', 'Thin, explosive rind'), effect: T('Récessif : écorce mince et tendre qui éclate quand on la coupe ; délicieux, mais fragile au transport (Klondike).', 'Recessive: a thin, tender rind that bursts when cut; delicious but fragile in transport (Klondike).') },
    ],
    standard: 'E',
    documented: LAN,
    cM: 0,
  },
  // --- Graines ---------------------------------------------------------------
  {
    id: 'w',
    symbol: 'w',
    category: 'seed',
    name: T('Graine blanche (w)', 'White seed (w)'),
    alleles: [
      { allele: 'W', name: T('Graine colorée', 'Coloured seed') },
      { allele: 'w', id: 'w', name: T('Graine blanche', 'White seed'), effect: T('Récessif et épistatique sur r et t : tégument blanc ou crème (égousi).', 'Recessive and epistatic to r and t: white or cream seed coat (egusi).') },
    ],
    standard: 'W',
    documented: ALL,
    cM: 0,
  },
  {
    id: 'r',
    symbol: 'r',
    category: 'seed',
    name: T('Graine rouge (r)', 'Red seed (r)'),
    alleles: [
      { allele: 'R', name: T('Pas de rouge', 'No red') },
      { allele: 'r', id: 'r', name: T('Graine rouge', 'Red seed'), effect: T('Récessif : graine rouge (citre à graines rouges, Méréville).', 'Recessive: red seed (red-seeded citron).') },
    ],
    standard: 'R',
    documented: ALL,
    cM: 0,
  },
  {
    id: 't',
    symbol: 't',
    category: 'seed',
    name: T('Graine brun clair (t)', 'Tan seed (t)'),
    alleles: [
      { allele: 'T', name: T('Graine noire', 'Black seed') },
      { allele: 't', id: 't', name: T('Graine brun clair', 'Tan seed'), effect: T('Récessif : graine brun clair au lieu de noire (si w et r sont absents).', 'Recessive: tan instead of black seed (when w and r are absent).') },
    ],
    standard: 'T',
    documented: ALL,
    chromosome: 3,
    cM: 70,
  },
  {
    id: 'eg',
    symbol: 'eg',
    category: 'seed',
    name: T('Graine égousi (eg)', 'Egusi seed (eg)'),
    alleles: [
      { allele: 'Eg', name: T('Graine ordinaire', 'Normal seed') },
      {
        allele: 'eg',
        id: 'eg',
        name: T('Graine égousi', 'Egusi seed'),
        effect: T('Récessif : graine entourée d’une enveloppe charnue et épaisse ; caractère des égousis d’Afrique de l’Ouest, cultivés pour leurs graines riches en huile et protéines.', 'Recessive: seed wrapped in a thick, fleshy coat; the trait of West African egusi, grown for their oil- and protein-rich seeds.'),
      },
    ],
    standard: 'Eg',
    documented: ['mucosospermus', 'lanatus'],
    cM: 0,
  },
  {
    id: 'ts',
    symbol: 'ts',
    category: 'seed',
    name: T('Graine minuscule (ts)', 'Tiny seed (ts)'),
    alleles: [
      { allele: 'Ts', name: T('Graine de taille normale', 'Normal-sized seed') },
      { allele: 'ts', id: 'ts', name: T('Graine minuscule', 'Tiny seed'), effect: T('Récessif (« tomato seed ») : graines toutes petites, à peine plus grandes que celles d’une tomate, qu’on avale sans gêne.', 'Recessive (“tomato seed”): very small seeds, barely bigger than a tomato’s, swallowed without bother.') },
    ],
    standard: 'Ts',
    documented: LAN,
    cM: 0,
  },
  // --- Plante -----------------------------------------------------------------
  {
    id: 'bi',
    symbol: 'Bi',
    category: 'plant',
    name: T('Amertume (Bi)', 'Bitterness (Bi)'),
    alleles: [
      {
        allele: 'Bi',
        id: 'Bi',
        name: T('Fruit amer', 'Bitter fruit'),
        effect: T('Dominant (gène ClBt) : fruit amer et purgatif (cucurbitacines), comme la coloquinte sauvage. La domestication a sélectionné l’allèle non amer : un croisement avec une espèce sauvage le fait réapparaître.', 'Dominant (ClBt gene): bitter, purgative fruit (cucurbitacins), like wild colocynth. Domestication selected the non-bitter allele: a cross with a wild species brings it back.'),
      },
      { allele: 'bi', name: T('Non amer', 'Not bitter') },
    ],
    standard: 'bi',
    documented: ALL,
    chromosome: 1,
    cM: 20,
  },
  {
    id: 'dw',
    symbol: 'dw-1',
    category: 'plant',
    name: T('Port nain (dw-1)', 'Dwarf habit (dw-1)'),
    alleles: [
      { allele: 'Dw', name: T('Tiges coureuses', 'Running vines') },
      { allele: 'dw', id: 'dw', name: T('Port nain', 'Dwarf / bush'), effect: T('Récessif : entre-nœuds très courts, plante compacte (« Bush »), pour les petits jardins ; fruits un peu plus petits.', 'Recessive: very short internodes, a compact “bush” plant for small gardens; slightly smaller fruit.') },
    ],
    standard: 'Dw',
    documented: LAN,
    chromosome: 9,
    cM: 50,
  },
  // --- Fleurs -----------------------------------------------------------------
  {
    id: 'a',
    symbol: 'a',
    category: 'flower',
    name: T('Andromonoécie (a)', 'Andromonoecy (a)'),
    alleles: [
      { allele: 'A', name: T('Monoïque', 'Monoecious') },
      {
        allele: 'a',
        id: 'a',
        name: T('Andromonoïque', 'Andromonoecious'),
        effect: T('Récessif (gène ClACS7, le même que chez le melon) : les fleurs à fruit portent aussi des étamines ; il faut les castrer pour croiser.', 'Recessive (ClACS7 gene, the same as in melon): fruiting flowers also carry stamens; they must be emasculated to cross.'),
      },
    ],
    standard: 'A',
    documented: LAN,
    hypothetical: WILD,
    chromosome: 2,
    cM: 30,
  },
  {
    id: 'gms',
    symbol: 'gms',
    category: 'flower',
    name: T('Stérilité mâle glabre (gms)', 'Glabrous male sterility (gms)'),
    alleles: [
      { allele: 'Gms', name: T('Fertile', 'Fertile') },
      {
        allele: 'gms',
        id: 'gms',
        name: T('Mâle stérile, glabre', 'Male sterile, glabrous'),
        effect: T('Récessif (mutant de Sugar Baby, Watts 1962) : plante sans poils et sans pollen. Mère idéale pour faire des hybrides sans castration ; repérable dès les jeunes plants grâce à l’absence de poils.', 'Recessive (Sugar Baby mutant, Watts 1962): hairless plant with no pollen. An ideal mother for hybrids without emasculation, recognisable on seedlings by the missing hairs.'),
      },
    ],
    standard: 'Gms',
    documented: LAN,
    chromosome: 6,
    cM: 50,
  },
  // --- Résistances --------------------------------------------------------------
  {
    id: 'fo1',
    symbol: 'Fo-1',
    category: 'resistance',
    name: T('Fusariose race 1 (Fo-1)', 'Fusarium wilt race 1 (Fo-1)'),
    alleles: [
      { allele: 'Fo1', id: 'Fo1', name: T('Fo-1', 'Fo-1'), effect: T('Dominant : résistance à la fusariose vasculaire race 1, champignon du sol qui fait flétrir les plantes (Charleston Gray, Crimson Sweet).', 'Dominant: resistance to Fusarium wilt race 1, a soil fungus that wilts the plants (Charleston Gray, Crimson Sweet).') },
      { allele: 'fo1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'fo1',
    documented: LAN,
    hypothetical: WILD,
    chromosome: 1,
    cM: 75,
  },
  {
    id: 'ar1',
    symbol: 'Ar-1',
    category: 'resistance',
    name: T('Anthracnose race 1 (Ar-1)', 'Anthracnose race 1 (Ar-1)'),
    alleles: [
      { allele: 'Ar1', id: 'Ar1', name: T('Ar-1', 'Ar-1'), effect: T('Dominant : résistance à l’anthracnose races 1 et 3 (taches noires sur feuilles et fruits par temps chaud et humide), venue d’Africa 8 via Congo.', 'Dominant: resistance to anthracnose races 1 and 3 (black spots on leaves and fruit in warm, wet weather), from Africa 8 via Congo.') },
      { allele: 'ar1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'ar1',
    documented: LAN,
    hypothetical: WILD,
    cM: 0,
  },
  {
    id: 'db',
    symbol: 'db',
    category: 'resistance',
    name: T('Pourriture gommeuse (db)', 'Gummy stem blight (db)'),
    alleles: [
      { allele: 'Db', name: T('Sensible', 'Susceptible') },
      { allele: 'db', id: 'db', name: T('db', 'db'), effect: T('Récessif : résistance à la pourriture gommeuse des tiges (Didymella), venue du citre PI 189225 ; l’hérédité réelle est plus complexe (plusieurs gènes).', 'Recessive: resistance to gummy stem blight (Didymella), from citron PI 189225; real inheritance is more complex (several genes).') },
    ],
    standard: 'Db',
    documented: ['lanatus', 'amarus'],
    cM: 0,
  },
  {
    id: 'zym',
    symbol: 'zym',
    category: 'resistance',
    name: T('Mosaïque jaune ZYMV (zym)', 'ZYMV (zym)'),
    alleles: [
      { allele: 'Zym', name: T('Sensible', 'Susceptible') },
      { allele: 'zym', id: 'zym', name: T('zym', 'zym'), effect: T('Récessif (gène eIF4E) : résistance au virus de la mosaïque jaune de la courgette, transmis par les pucerons ; venue de l’égousi PI 595203.', 'Recessive (eIF4E gene): resistance to zucchini yellow mosaic virus, spread by aphids; from egusi PI 595203.') },
    ],
    standard: 'Zym',
    documented: LAN,
    chromosome: 10,
    cM: 20,
  },
];

export const LOCUS_BY_ID: Record<WmLocusId, LocusDef> = Object.fromEntries(WM_LOCI.map((l) => [l.id, l])) as Record<WmLocusId, LocusDef>;
export const LOCUS_IDS: WmLocusId[] = WM_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [WmLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [WmLocusId, string]>;
  for (const l of WM_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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
