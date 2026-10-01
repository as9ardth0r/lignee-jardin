/**
 * Espèces et loci mendéliens du fraisier (genre Fragaria).
 *
 * PLOÏDIE. Le fraisier cultivé (Fragaria × ananassa) est octoploïde
 * (2n = 8x = 56) : quatre sous-génomes, mais une hérédité DISOMIQUE (les
 * chromosomes ne s’apparient qu’avec leur vrai homologue). Chaque gène se
 * transmet donc comme chez un diploïde, sous-génome par sous-génome : c’est
 * ce qui permet de le modéliser ici, locus par locus, comme les autres
 * espèces de Lignée. Le fraisier des bois (F. vesca) est diploïde
 * (2n = 14), le fraisier musqué (F. moschata) hexaploïde.
 *
 * LOCI RETENUS (références) :
 *  - PFRU (Gaston et al. 2013) : dominant, fraisier REMONTANT (« jour
 *    neutre ») chez les octoploïdes ; venu de F. virginiana subsp. glauca ;
 *    réduit aussi le nombre de stolons ;
 *  - SFL / FvTFL1 (Koskela et al. 2012) : récessif, remontant chez le
 *    fraisier des bois (fraises « des quatre saisons ») ;
 *  - R / FvGA20ox4 (Tenreira et al. 2017) : r/r = SANS STOLONS chez le
 *    fraisier des bois (Alexandria, Reine des Vallées) ;
 *  - MYB10 (Wang et al. 2020 ; Hawkins et al. 2016) : récessif, fruit
 *    BLANC chez F. × ananassa (Pineberry, Blanche du Chili), JAUNE chez le
 *    fraisier des bois (Yellow Wonder) ;
 *  - FAD1 (Sánchez-Sevilla et al. 2014) : dominant, arôme de pêche
 *    (γ-décalactone) ;
 *  - OMT (Zorrilla-Fontanesi et al. 2012) : dominant, arôme de mésifurane
 *    (notes caramel, sucrées) ;
 *  - SDR (Tennessen et al. 2018) : chez les octoploïdes sauvages, les
 *    plantes FEMELLES (sans pollen) portent un allèle dominant ;
 *  - Rpf1 (Haymes et al. 2000), RCa1 (Denoyes-Rothan et al. 2005 ;
 *    Salinas et al. 2019), FW1 (Pincot et al. 2018) : résistances à la
 *    stèle rouge, à l’anthracnose et à la fusariose ; Pm : oïdium,
 *    polygénique en réalité, résumé en un gène.
 */

export type SpeciesId = 'ananassa' | 'virginiana' | 'chiloensis' | 'vesca' | 'moschata';

export const SPECIES: SpeciesId[] = ['ananassa', 'virginiana', 'chiloensis', 'vesca', 'moschata'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt; ploidy: number }> = {
  ananassa: {
    latin: 'Fragaria × ananassa',
    short: 'F. × ananassa',
    name: T('Fraisier cultivé', 'Garden strawberry'),
    examples: T('Gariguette, Mara des Bois, Charlotte, Darselect… octoploïde (8x), né en Bretagne vers 1750', 'Gariguette, Mara des Bois, Charlotte, Darselect… octoploid (8x), born in Brittany around 1750'),
    ploidy: 8,
  },
  virginiana: {
    latin: 'Fragaria virginiana',
    short: 'F. virginiana',
    name: T('Fraisier de Virginie', 'Virginia strawberry'),
    examples: T('fraisier sauvage d’Amérique du Nord, petits fruits très parfumés, octoploïde ; source du caractère remontant', 'wild North American strawberry, small very fragrant fruit, octoploid; source of day-neutrality'),
    ploidy: 8,
  },
  chiloensis: {
    latin: 'Fragaria chiloensis',
    short: 'F. chiloensis',
    name: T('Fraisier du Chili', 'Chilean strawberry'),
    examples: T('gros fruits pâles des côtes du Chili, rapportés par Frézier en 1714 ; octoploïde', 'large pale fruit of the Chilean coast, brought back by Frézier in 1714; octoploid'),
    ploidy: 8,
  },
  vesca: {
    latin: 'Fragaria vesca',
    short: 'F. vesca',
    name: T('Fraisier des bois', 'Woodland strawberry'),
    examples: T('fraises des bois et des quatre saisons (Reine des Vallées, Alexandria), diploïde (2x) : ne donne pas d’hybride fertile avec le fraisier cultivé', 'wild and alpine strawberries (Reine des Vallées, Alexandria), diploid (2x): gives no fertile hybrid with the garden strawberry'),
    ploidy: 2,
  },
  moschata: {
    latin: 'Fragaria moschata',
    short: 'F. moschata',
    name: T('Fraisier musqué (capron)', 'Musk strawberry (hautbois)'),
    examples: T('le capron ou hautbois, au parfum musqué, hexaploïde (6x), plantes mâles et femelles', 'the hautbois, musky aroma, hexaploid (6x), male and female plants'),
    ploidy: 6,
  },
};

export type FaLocusId = 'pfru' | 'sfl' | 'r' | 'myb10' | 'fad1' | 'omt' | 'sdr' | 'rpf1' | 'rca1' | 'fw1' | 'pm';

export type VariantId = 'PFRU' | 'sfl' | 'r' | 'myb10' | 'FAD1' | 'OMT' | 'F' | 'Rpf1' | 'RCa1' | 'FW1' | 'Pm';

export type LocusCategory = 'fruit' | 'flower' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: FaLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  silent?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  simplified?: boolean;
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const OCTO: SpeciesId[] = ['ananassa', 'virginiana', 'chiloensis'];
const ANA: SpeciesId[] = ['ananassa'];
const VES: SpeciesId[] = ['vesca'];

export const FA_LOCI: LocusDef[] = [
  // --- Fruit ---------------------------------------------------------------------------
  {
    id: 'myb10',
    symbol: 'myb10',
    category: 'fruit',
    name: T('Fruit blanc ou jaune (MYB10)', 'White or yellow fruit (MYB10)'),
    alleles: [
      { allele: 'MYB10', name: T('Fruit rouge', 'Red fruit') },
      { allele: 'myb10', id: 'myb10', name: T('Fruit pâle', 'Pale fruit'), effect: T('Récessif : le facteur MYB10 qui allume les anthocyanes est inactif ; le fruit reste BLANC chez le fraisier cultivé (Pineberry, avec ses akènes rouges ; Blanche du Chili) et JAUNE pâle chez le fraisier des bois (Yellow Wonder). Les oiseaux le délaissent.', 'Recessive: the MYB10 factor that switches on anthocyanins is inactive; the fruit stays WHITE in the garden strawberry (Pineberry, with its red seeds; White Chilean) and pale YELLOW in the woodland strawberry (Yellow Wonder). Birds leave it alone.') },
    ],
    standard: 'MYB10',
    documented: ['ananassa', 'chiloensis', 'vesca'],
    hypothetical: ['virginiana', 'moschata'],
    chromosome: 1,
    cM: 20,
  },
  {
    id: 'fad1',
    symbol: 'FAD1',
    category: 'fruit',
    name: T('Arôme de pêche (FAD1)', 'Peach aroma (FAD1)'),
    alleles: [
      { allele: 'FAD1', id: 'FAD1', name: T('Arôme de pêche', 'Peach aroma'), effect: T('Dominant : le gène FaFAD1 permet de produire la γ-décalactone, l’arôme fruité de pêche de certaines fraises ; les plantes sans ce gène n’en produisent pas du tout (présence ou absence, Sánchez-Sevilla et al. 2014).', 'Dominant: the FaFAD1 gene allows γ-decalactone, the fruity peach aroma of some strawberries; plants without it make none at all (presence or absence, Sánchez-Sevilla et al. 2014).') },
      { allele: 'fad1', name: T('Sans γ-décalactone', 'No γ-decalactone') },
    ],
    standard: 'fad1',
    documented: OCTO,
    chromosome: 3,
    cM: 35,
  },
  {
    id: 'omt',
    symbol: 'OMT',
    category: 'fruit',
    name: T('Arôme caramel, mésifurane (OMT)', 'Caramel aroma, mesifurane (OMT)'),
    alleles: [
      { allele: 'OMT', id: 'OMT', name: T('Mésifurane', 'Mesifurane'), effect: T('Dominant : FaOMT transforme le furanéol en mésifurane, aux notes sucrées de caramel ; une variante courante du gène l’éteint (Zorrilla-Fontanesi et al. 2012).', 'Dominant: FaOMT turns furaneol into mesifurane, with sweet caramel notes; a common variant of the gene switches it off (Zorrilla-Fontanesi et al. 2012).') },
      { allele: 'omt', name: T('Sans mésifurane', 'No mesifurane') },
    ],
    standard: 'omt',
    documented: OCTO,
    chromosome: 7,
    cM: 50,
  },
  // --- Floraison, stolons, sexe -----------------------------------------------------------
  {
    id: 'pfru',
    symbol: 'PFRU',
    category: 'flower',
    name: T('Remontant (PFRU)', 'Everbearing (PFRU)'),
    alleles: [
      { allele: 'PFRU', id: 'PFRU', name: T('Remontant', 'Everbearing'), effect: T('Dominant : la plante fleurit et fructifie de mai aux gelées au lieu d’une seule récolte au printemps (Mara des Bois, Charlotte, Albion). Venu du fraisier de Virginie des montagnes (subsp. glauca). Effet secondaire : moins de stolons.', 'Dominant: the plant flowers and fruits from May to the frosts instead of a single spring crop (Mara des Bois, Charlotte, Albion). Came from the mountain Virginia strawberry (subsp. glauca). Side effect: fewer runners.') },
      { allele: 'pfru', name: T('Non remontant', 'June-bearing') },
    ],
    standard: 'pfru',
    documented: ['ananassa', 'virginiana'],
    hypothetical: ['chiloensis'],
    chromosome: 4,
    cM: 40,
  },
  {
    id: 'sfl',
    symbol: 'sfl',
    category: 'flower',
    name: T('Quatre saisons (SFL, TFL1)', 'Alpine everbearing (SFL, TFL1)'),
    alleles: [
      { allele: 'SFL', name: T('Une floraison', 'One flowering') },
      { allele: 'sfl', id: 'sfl', name: T('Quatre saisons', 'Everbearing'), effect: T('Récessif : chez le fraisier des bois, une mutation du gène TFL1, le frein de la floraison, donne les fraises « des quatre saisons » qui fleurissent tout l’été (Koskela et al. 2012).', 'Recessive: in the woodland strawberry a mutation of TFL1, the flowering brake, gives the alpine strawberries that flower all summer (Koskela et al. 2012).') },
    ],
    standard: 'SFL',
    documented: VES,
    chromosome: 6,
    cM: 30,
  },
  {
    id: 'r',
    symbol: 'r',
    category: 'flower',
    name: T('Sans stolons (R, GA20ox4)', 'Runnerless (R, GA20ox4)'),
    alleles: [
      { allele: 'R', name: T('Stolons', 'Runners') },
      { allele: 'r', id: 'r', name: T('Sans stolons', 'Runnerless'), effect: T('Récessif : chez le fraisier des bois, une enzyme de la gibbérelline (GA20ox4) est inactive et la plante ne fait plus de stolons (Alexandria, Reine des Vallées) ; elle se multiplie par graines ou par division de la touffe.', 'Recessive: in the woodland strawberry a gibberellin enzyme (GA20ox4) is inactive and the plant no longer makes runners (Alexandria, Reine des Vallées); it is propagated by seed or by dividing the clump.') },
    ],
    standard: 'R',
    documented: VES,
    chromosome: 2,
    cM: 25,
  },
  {
    id: 'sdr',
    symbol: 'F',
    category: 'flower',
    name: T('Plante femelle (région du sexe)', 'Female plant (sex region)'),
    alleles: [
      { allele: 'F', id: 'F', name: T('Femelle', 'Female'), effect: T('Dominant : chez les fraisiers sauvages octoploïdes, les plantes portant cet allèle ont des étamines avortées : elles sont FEMELLES et doivent être pollinisées par une autre plante. Les femelles sont hétérozygotes (F/f), comme les oiseaux (Tennessen et al. 2018). Le fraisier cultivé est hermaphrodite.', 'Dominant: in wild octoploid strawberries plants carrying this allele have aborted stamens: they are FEMALE and must be pollinated by another plant. Females are heterozygous (F/f), as in birds (Tennessen et al. 2018). The garden strawberry is hermaphrodite.') },
      { allele: 'f', name: T('Hermaphrodite ou mâle', 'Hermaphrodite or male') },
    ],
    standard: 'f',
    simplified: true,
    documented: ['virginiana', 'chiloensis'],
    hypothetical: ['moschata'],
    chromosome: 6,
    cM: 0,
  },
  // --- Résistances ------------------------------------------------------------------------
  {
    id: 'rpf1',
    symbol: 'Rpf1',
    category: 'resistance',
    name: T('Stèle rouge (Rpf1)', 'Red stele (Rpf1)'),
    alleles: [
      { allele: 'Rpf1', id: 'Rpf1', name: T('Rpf1', 'Rpf1'), effect: T('Dominant : résistance à la stèle rouge (Phytophthora fragariae), qui pourrit le cœur des racines dans les sols lourds et froids (Haymes et al. 2000).', 'Dominant: resistance to red stele (Phytophthora fragariae), which rots the root core in heavy, cold soils (Haymes et al. 2000).') },
      { allele: 'rpf1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'rpf1',
    documented: ANA,
    chromosome: 2,
    cM: 60,
  },
  {
    id: 'rca1',
    symbol: 'RCa1',
    category: 'resistance',
    name: T('Anthracnose (RCa1)', 'Anthracnose (RCa1)'),
    alleles: [
      { allele: 'RCa1', id: 'RCa1', name: T('RCa1', 'RCa1'), effect: T('Dominant : résistance à l’anthracnose des fruits (Colletotrichum acutatum), taches noires et pourriture par temps chaud et humide (Denoyes-Rothan et al. 2005).', 'Dominant: resistance to fruit anthracnose (Colletotrichum acutatum), black spots and rot in warm, wet weather (Denoyes-Rothan et al. 2005).') },
      { allele: 'rca1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'rca1',
    documented: ANA,
    chromosome: 6,
    cM: 70,
  },
  {
    id: 'fw1',
    symbol: 'FW1',
    category: 'resistance',
    name: T('Fusariose (FW1)', 'Fusarium wilt (FW1)'),
    alleles: [
      { allele: 'FW1', id: 'FW1', name: T('FW1', 'FW1'), effect: T('Dominant : résistance à la fusariose (Fusarium oxysporum f. sp. fragariae), qui fait flétrir et mourir les plants en sol chaud (Pincot et al. 2018).', 'Dominant: resistance to Fusarium wilt (Fusarium oxysporum f. sp. fragariae), which wilts and kills plants in warm soil (Pincot et al. 2018).') },
      { allele: 'fw1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'fw1',
    documented: ANA,
    chromosome: 2,
    cM: 10,
  },
  {
    id: 'pm',
    symbol: 'Pm',
    category: 'resistance',
    name: T('Oïdium (Pm)', 'Powdery mildew (Pm)'),
    alleles: [
      { allele: 'Pm', id: 'Pm', name: T('Peu sensible à l’oïdium', 'Mildew tolerant'), effect: T('Tolérance à l’oïdium (Podosphaera aphanis), feutrage blanc et feuilles qui se recroquevillent. Polygénique en réalité (plusieurs QTL) ; résumée ici en un gène dominant.', 'Tolerance to powdery mildew (Podosphaera aphanis), white felt and curling leaves. Actually polygenic (several QTL); summarised here as one dominant gene.') },
      { allele: 'pm', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'pm',
    simplified: true,
    documented: ANA,
    cM: 0,
  },
];

export const LOCUS_BY_ID: Record<FaLocusId, LocusDef> = Object.fromEntries(FA_LOCI.map((l) => [l.id, l])) as Record<FaLocusId, LocusDef>;
export const LOCUS_IDS: FaLocusId[] = FA_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [FaLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [FaLocusId, string]>;
  for (const l of FA_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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
