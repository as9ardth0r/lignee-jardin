/**
 * Loci mendéliens du melon (Cucumis melo, 2n = 24, 12 chromosomes).
 *
 * Sources : listes de gènes du melon du Cucurbit Genetics Cooperative
 * (Pitrat 2002, CGC Rep. 25 ; Dogimont 2011, CGC Rep. 33–34), Pitrat 2010
 * (« Le melon », INRA), Martin et al. 2009 (gène g, Nature), Cohen et al.
 * 2014 (gène So/CmPH, Nature Comm.), Tzuri et al. 2015 (CmOr).
 *
 * LIAISON : le melon a des groupes de liaison bien cartographiés. Chaque
 * locus porte son groupe (I–XII, noté 1–12) ; la position en cM n’est
 * connue avec précision que pour quelques paires (Fom-1–Prv ≈ 2 cM ;
 * Vat–Pm-w « étroitement liés » ; Zym lié à a). Les autres positions sont
 * APPROXIMATIVES (ordre de grandeur), et `chromosome: 0` = position non
 * publiée → ségrégation indépendante.
 *
 * Simplifications : Al-3 + Al-4 (deux gènes du mûrissement climactérique)
 * réunis en un locus « Al » ; interaction exacte gf × wf (couleur de chair)
 * simplifiée ; filet (Rn) traité comme un gène simple alors qu’il est
 * souvent quantitatif.
 */

export type MelonLocusId =
  | 'a'
  | 'g'
  | 'gf'
  | 'wf'
  | 'y'
  | 'w'
  | 'mt'
  | 'st'
  | 's'
  | 'rn'
  | 'al'
  | 'so'
  | 'suc'
  | 'bif'
  | 'wt'
  | 'fom1'
  | 'fom2'
  | 'pm1'
  | 'pmw'
  | 'vat'
  | 'prv'
  | 'zym'
  | 'nsv';

export type VariantId =
  | 'a'
  | 'g'
  | 'gf'
  | 'wf'
  | 'Y'
  | 'w'
  | 'Mt'
  | 'st'
  | 's'
  | 'Rn'
  | 'al'
  | 'So'
  | 'suc'
  | 'Bif'
  | 'Wt'
  | 'Fom1'
  | 'Fom2'
  | 'Pm1'
  | 'Pmw'
  | 'Vat'
  | 'Prv'
  | 'Zym'
  | 'nsv';

export type LocusCategory = 'flower' | 'flesh' | 'rind' | 'fruit' | 'resistance' | 'safety';

type Txt = { fr: string; en: string };

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: MelonLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  /** Groupe de liaison (1–12), 0 = non publié. */
  chromosome: number;
  /** Position approximative (cM) sur le groupe. */
  cM: number;
  note?: Txt;
}

const T = (fr: string, en: string): Txt => ({ fr, en });

export const MELON_LOCI: LocusDef[] = [
  {
    id: 'a',
    symbol: 'a',
    category: 'flower',
    name: T('Andromonoécie (fleurs hermaphrodites)', 'Andromonoecy (hermaphrodite flowers)'),
    alleles: [
      { allele: 'A' },
      { allele: 'a', id: 'a', name: T('Andromonoïque', 'Andromonoecious'), effect: T('Récessif (gène CmACS-7) : les fleurs « femelles » portent aussi des étamines (fleurs hermaphrodites). C’est le cas d’environ 2/3 des variétés (Charentais anciens, cantaloups, melons d’hiver). Pour croiser, il faut CASTRER la fleur mère. L’allèle A (monoïque) donne des fruits plus allongés.', 'Recessive (CmACS-7 gene): “female” flowers also carry stamens (hermaphrodite flowers). True of about 2/3 of varieties (old Charentais, cantaloupes, winter melons). To cross, the mother flower must be EMASCULATED. The A (monoecious) allele gives more elongated fruit.') },
    ],
    standard: 'A',
    chromosome: 2,
    cM: 50,
  },
  {
    id: 'g',
    symbol: 'g',
    category: 'flower',
    name: T('Gynoécie (fleurs femelles seules)', 'Gynoecy (female flowers only)'),
    alleles: [
      { allele: 'G' },
      { allele: 'g', id: 'g', name: T('Gynoïque', 'Gynoecious'), effect: T('Récessif (gène CmWIP1) : plus de fleurs mâles. g/g avec A = plante gynoïque (fleurs femelles seules) ; g/g avec a/a = plante hermaphrodite. Il faut alors un pollinisateur.', 'Recessive (CmWIP1 gene): no more male flowers. g/g with A = gynoecious (female flowers only); g/g with a/a = hermaphrodite plant. A pollinator is then needed.') },
    ],
    standard: 'G',
    chromosome: 5,
    cM: 95,
  },
  {
    id: 'gf',
    symbol: 'gf',
    category: 'flesh',
    name: T('Chair verte (CmOr)', 'Green flesh (CmOr)'),
    alleles: [
      { allele: 'Gf' },
      { allele: 'gf', id: 'gf', name: T('Chair verte', 'Green flesh'), effect: T('Récessif : pas de carotène dans la chair, qui reste verte (Honeydew, Galia, Ogen). L’orange (Gf, allèle « golden » de CmOr) est dominant.', 'Recessive: no carotene in the flesh, which stays green (Honeydew, Galia, Ogen). Orange (Gf, the “golden” CmOr allele) is dominant.') },
    ],
    standard: 'Gf',
    chromosome: 9,
    cM: 30,
  },
  {
    id: 'wf',
    symbol: 'wf',
    category: 'flesh',
    name: T('Chair blanche', 'White flesh'),
    alleles: [
      { allele: 'Wf' },
      { allele: 'wf', id: 'wf', name: T('Chair blanche', 'White flesh'), effect: T('Récessif : chair blanche à crème (Casaba, Piel de Sapo, Jaune canari). L’orange est dominant.', 'Recessive: white to cream flesh (Casaba, Piel de Sapo, Canary). Orange is dominant.') },
    ],
    standard: 'Wf',
    chromosome: 8,
    cM: 60,
    note: T('L’interaction exacte entre gf et wf n’est pas entièrement élucidée (Clayberg 1992) : modèle simplifié (gf/gf → vert, sinon wf/wf → blanc, sinon orange).', 'The exact gf × wf interaction is not fully resolved (Clayberg 1992): simplified model (gf/gf → green, else wf/wf → white, else orange).'),
  },
  {
    id: 'y',
    symbol: 'Y',
    category: 'rind',
    name: T('Écorce jaune', 'Yellow rind'),
    alleles: [
      { allele: 'Y', id: 'Y', name: T('Jaune', 'Yellow'), effect: T('Dominant : épiderme jaune à maturité (melons canari, Casaba, Galia et makuwa dorés).', 'Dominant: yellow epidermis at maturity (Canary, Casaba, Galia, golden makuwa).') },
      { allele: 'y' },
    ],
    standard: 'y',
    chromosome: 0,
    cM: 0,
  },
  {
    id: 'w',
    symbol: 'w',
    category: 'rind',
    name: T('Écorce blanche', 'White rind'),
    alleles: [
      { allele: 'W' },
      { allele: 'w', id: 'w', name: T('Blanche', 'White'), effect: T('Récessif : écorce blanc crème à maturité (Honeydew), au lieu de vert.', 'Recessive: cream-white rind at maturity (Honeydew), instead of green.') },
    ],
    standard: 'W',
    chromosome: 0,
    cM: 0,
  },
  {
    id: 'mt',
    symbol: 'Mt',
    category: 'rind',
    name: T('Écorce marbrée', 'Mottled rind'),
    alleles: [
      { allele: 'Mt', id: 'Mt', name: T('Marbrée', 'Mottled'), effect: T('Dominant : écorce tachetée de vert foncé (« peau de crapaud » du Piel de Sapo, Noir des Carmes mûr).', 'Dominant: rind speckled with dark green (the “toad skin” of Piel de Sapo, ripe Noir des Carmes).') },
      { allele: 'mt' },
    ],
    standard: 'mt',
    chromosome: 2,
    cM: 80,
  },
  {
    id: 'st',
    symbol: 'st',
    category: 'rind',
    name: T('Écorce rayée', 'Striped rind'),
    alleles: [
      { allele: 'St' },
      { allele: 'st', id: 'st', name: T('Rayée', 'Striped'), effect: T('Récessif : bandes colorées le long du fruit (Ogen, Tigger, makuwa à rayures blanches).', 'Recessive: coloured bands along the fruit (Ogen, Tigger, white-striped makuwa).') },
    ],
    standard: 'St',
    chromosome: 11,
    cM: 80,
  },
  {
    id: 's',
    symbol: 's',
    category: 'rind',
    name: T('Sutures (côtes)', 'Sutures (ribs)'),
    alleles: [
      { allele: 'S' },
      { allele: 's', id: 's', name: T('Sutures', 'Sutures'), effect: T('Récessif : sillons vert foncé qui dessinent des tranches (Charentais, cantaloups).', 'Recessive: dark green furrows marking out slices (Charentais, cantaloupes).') },
    ],
    standard: 'S',
    chromosome: 11,
    cM: 70,
  },
  {
    id: 'rn',
    symbol: 'Rn',
    category: 'rind',
    name: T('Écorce brodée (filet)', 'Netted rind'),
    alleles: [
      { allele: 'Rn', id: 'Rn', name: T('Brodée', 'Netted'), effect: T('Dominant : écorce couverte d’un réseau liégeux (« broderie ») : melons brodés, cantaloups américains, Galia.', 'Dominant: rind covered with a corky net: netted melons, American muskmelons, Galia.') },
      { allele: 'rn' },
    ],
    standard: 'rn',
    chromosome: 0,
    cM: 0,
    note: T('Décrit comme un gène simple dans une lignée ; dans beaucoup de croisements, le filet se comporte plutôt comme un caractère quantitatif.', 'Described as a single gene in one line; in many crosses netting behaves more like a quantitative trait.'),
  },
  {
    id: 'al',
    symbol: 'Al',
    category: 'fruit',
    name: T('Mûrissement climactérique (« se détache »)', 'Climacteric ripening (“slips”)'),
    alleles: [
      { allele: 'Al' },
      { allele: 'al', id: 'al', name: T('Non climactérique', 'Non-climacteric'), effect: T('Récessif : le fruit ne se détache pas de la tige à maturité, peu parfumé, mais se conserve des semaines à des mois (melons d’hiver : Piel de Sapo, Jaune canari, Honeydew). Al (dominant) = zone d’abscission, parfum, conservation courte (Charentais).', 'Recessive: the fruit does not slip from the stem when ripe, little aroma, but keeps for weeks to months (winter melons: Piel de Sapo, Canary, Honeydew). Al (dominant) = abscission layer, aroma, short shelf life (Charentais).') },
    ],
    standard: 'Al',
    chromosome: 8,
    cM: 40,
    note: T('En réalité au moins deux gènes dominants (Al-3, Al-4) plus CmNAC-NOR : réunis ici en un seul.', 'In reality at least two dominant genes (Al-3, Al-4) plus CmNAC-NOR: merged into one here.'),
  },
  {
    id: 'so',
    symbol: 'So',
    category: 'fruit',
    name: T('Chair acide (CmPH)', 'Sour flesh (CmPH)'),
    alleles: [
      { allele: 'So', id: 'So', name: T('Acide', 'Sour'), effect: T('Dominant : chair acide, peu agréable (melons primitifs et sauvages). Tous les melons de dessert sont so/so : un croisement avec un melon sauvage donne une F1 acide.', 'Dominant: sour, unpleasant flesh (primitive and wild melons). All dessert melons are so/so: a cross with a wild melon gives a sour F1.') },
      { allele: 'so' },
    ],
    standard: 'so',
    chromosome: 8,
    cM: 95,
  },
  {
    id: 'suc',
    symbol: 'suc',
    category: 'fruit',
    name: T('Accumulation de saccharose', 'Sucrose accumulation'),
    alleles: [
      { allele: 'Suc' },
      { allele: 'suc', id: 'suc', name: T('Très sucré', 'High sucrose'), effect: T('Récessif (incomplètement) : la chair accumule beaucoup de saccharose en fin de maturation (+ ~2,5 °Brix).', 'Recessive (incompletely): the flesh accumulates much sucrose late in ripening (+ ~2.5 °Brix).') },
    ],
    standard: 'Suc',
    chromosome: 0,
    cM: 0,
  },
  {
    id: 'bif',
    symbol: 'Bif',
    category: 'safety',
    name: T('Fruit amer (cucurbitacines)', 'Bitter fruit (cucurbitacins)'),
    alleles: [
      { allele: 'Bif', id: 'Bif', name: T('Fruit amer', 'Bitter fruit'), effect: T('Dominant : fruit amer, riche en cucurbitacines (melons sauvages d’Inde). À ne pas manger ; un seul allèle suffit.', 'Dominant: bitter fruit rich in cucurbitacins (Indian wild melons). Do not eat; one allele is enough.') },
      { allele: 'bif' },
    ],
    standard: 'bif',
    chromosome: 0,
    cM: 0,
  },
  {
    id: 'wt',
    symbol: 'Wt',
    category: 'fruit',
    name: T('Graines blanches', 'White seeds'),
    alleles: [
      { allele: 'Wt', id: 'Wt', name: T('Graines blanches', 'White seeds'), effect: T('Dominant : tégument des graines blanc, au lieu de jaune-beige.', 'Dominant: white seed coat, instead of yellow-tan.') },
      { allele: 'wt' },
    ],
    standard: 'wt',
    chromosome: 4,
    cM: 50,
  },
  {
    id: 'fom1',
    symbol: 'Fom-1',
    category: 'resistance',
    name: T('Fusariose races 0 et 2 (Fom-1)', 'Fusarium races 0 and 2 (Fom-1)'),
    alleles: [
      { allele: 'Fom1', id: 'Fom1', name: T('Fom-1', 'Fom-1'), effect: T('Dominant : résistance à la fusariose (Fusarium oxysporum f. sp. melonis) races 0 et 2. Très proche de Prv (≈ 2 cM).', 'Dominant: resistance to Fusarium wilt races 0 and 2. Very close to Prv (≈ 2 cM).') },
      { allele: 'fom1' },
    ],
    standard: 'fom1',
    chromosome: 9,
    cM: 100,
  },
  {
    id: 'fom2',
    symbol: 'Fom-2',
    category: 'resistance',
    name: T('Fusariose races 0 et 1 (Fom-2)', 'Fusarium races 0 and 1 (Fom-2)'),
    alleles: [
      { allele: 'Fom2', id: 'Fom2', name: T('Fom-2', 'Fom-2'), effect: T('Dominant : résistance à la fusariose races 0 et 1. Aucune résistance simple à la race 1.2.', 'Dominant: resistance to Fusarium races 0 and 1. No simple resistance to race 1.2.') },
      { allele: 'fom2' },
    ],
    standard: 'fom2',
    chromosome: 11,
    cM: 50,
  },
  {
    id: 'pm1',
    symbol: 'Pm-1',
    category: 'resistance',
    name: T('Oïdium race 1 (Pm-1)', 'Powdery mildew race 1 (Pm-1)'),
    alleles: [
      { allele: 'Pm1', id: 'Pm1', name: T('Pm-1', 'Pm-1'), effect: T('Dominant : résistance à l’oïdium race 1 (variété PMR 45, 1937). Contournée depuis par d’autres races : protection partielle.', 'Dominant: resistance to powdery mildew race 1 (PMR 45, 1937). Since overcome by other races: partial protection.') },
      { allele: 'pm1' },
    ],
    standard: 'pm1',
    chromosome: 9,
    cM: 70,
  },
  {
    id: 'pmw',
    symbol: 'Pm-w',
    category: 'resistance',
    name: T('Oïdium races 1, 2, 3 (Pm-w)', 'Powdery mildew races 1, 2, 3 (Pm-w)'),
    alleles: [
      { allele: 'Pmw', id: 'Pmw', name: T('Pm-w', 'Pm-w'), effect: T('Dominant : résistance large à l’oïdium (races 1, 2 et 3), lignée WMR 29. Étroitement liée à Vat.', 'Dominant: broad powdery mildew resistance (races 1, 2 and 3), line WMR 29. Tightly linked to Vat.') },
      { allele: 'pmw' },
    ],
    standard: 'pmw',
    chromosome: 5,
    cM: 8,
  },
  {
    id: 'vat',
    symbol: 'Vat',
    category: 'resistance',
    name: T('Pucerons et virus (Vat)', 'Aphids and viruses (Vat)'),
    alleles: [
      { allele: 'Vat', id: 'Vat', name: T('Vat', 'Vat'), effect: T('Dominant : empêche le puceron Aphis gossypii de transmettre les virus (CMV, WMV, ZYMV, PRSV) et limite sa colonisation. Code catalogue « Ag ».', 'Dominant: stops the aphid Aphis gossypii from transmitting viruses (CMV, WMV, ZYMV, PRSV) and limits colonisation. Catalogue code “Ag”.') },
      { allele: 'vat' },
    ],
    standard: 'vat',
    chromosome: 5,
    cM: 5,
  },
  {
    id: 'prv',
    symbol: 'Prv',
    category: 'resistance',
    name: T('Virus PRSV (Prv)', 'PRSV virus (Prv)'),
    alleles: [
      { allele: 'Prv', id: 'Prv', name: T('Prv', 'Prv'), effect: T('Dominant : résistance au virus des taches annulaires du papayer (PRSV-W).', 'Dominant: resistance to papaya ringspot virus (PRSV-W).') },
      { allele: 'prv' },
    ],
    standard: 'prv',
    chromosome: 9,
    cM: 98,
  },
  {
    id: 'zym',
    symbol: 'Zym',
    category: 'resistance',
    name: T('Virus ZYMV (Zym)', 'ZYMV virus (Zym)'),
    alleles: [
      { allele: 'Zym', id: 'Zym', name: T('Zym', 'Zym'), effect: T('Dominant : résistance au virus de la mosaïque jaune de la courgette (pathotype 0), lignée indienne PI 414723. Lié au gène a.', 'Dominant: resistance to zucchini yellow mosaic virus (pathotype 0), Indian line PI 414723. Linked to the a gene.') },
      { allele: 'zym' },
    ],
    standard: 'zym',
    chromosome: 2,
    cM: 62,
  },
  {
    id: 'nsv',
    symbol: 'nsv',
    category: 'resistance',
    name: T('Virus MNSV (nsv)', 'MNSV virus (nsv)'),
    alleles: [
      { allele: 'Nsv' },
      { allele: 'nsv', id: 'nsv', name: T('nsv', 'nsv'), effect: T('Récessif (mutation de eIF4E) : résistance au virus de la nécrose du melon (MNSV), transmis par le sol.', 'Recessive (eIF4E mutation): resistance to melon necrotic spot virus (MNSV), soil-borne.') },
    ],
    standard: 'Nsv',
    chromosome: 12,
    cM: 40,
  },
];

export const LOCUS_BY_ID: Record<MelonLocusId, LocusDef> = Object.fromEntries(MELON_LOCI.map((l) => [l.id, l])) as Record<MelonLocusId, LocusDef>;
export const LOCUS_IDS: MelonLocusId[] = MELON_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [MelonLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [MelonLocusId, string]>;
  for (const l of MELON_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
  return out;
})();

export const VARIANT_IDS = Object.keys(VARIANT_ALLELE) as VariantId[];

export function variantInfo(id: VariantId): { label: string; locus: LocusDef; name: Txt; effect: Txt } {
  const [lid, allele] = VARIANT_ALLELE[id];
  const locus = LOCUS_BY_ID[lid];
  const a = locus.alleles.find((x) => x.allele === allele)!;
  return { label: allele, locus, name: a.name ?? locus.name, effect: a.effect ?? locus.name };
}

/** Groupes botaniques (Pitrat), tous de la même espèce : ils se croisent entre eux. */
export type MelonGroup = 'cantalupensis' | 'reticulatus' | 'inodorus' | 'ameri' | 'conomon' | 'makuwa' | 'flexuosus' | 'dudaim' | 'agrestis' | 'momordica';
export const GROUPS: MelonGroup[] = ['cantalupensis', 'reticulatus', 'inodorus', 'ameri', 'makuwa', 'conomon', 'flexuosus', 'dudaim', 'momordica', 'agrestis'];
