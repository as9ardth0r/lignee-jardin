import type { VariantId } from './loci';

/**
 * Bibliothèque de variétés de tomate, toutes à pollinisation libre (OP),
 * donc des LIGNÉES FIXÉES : chaque fondateur planté est homozygote à tous
 * ses loci, comme en réalité. Pas d'hybrides F1 commerciaux ici : leur
 * génotype hétérozygote exact n'est pas publié.
 *
 * AVERTISSEMENT : les génotypes ci-dessous sont DÉDUITS DU PHÉNOTYPE
 * documenté (couleur de chair et de peau, port, feuillage, forme,
 * résistances déclarées par l'obtenteur), pas issus d'un séquençage de
 * chaque variété. Ex. : une tomate « noire » à peau rose (Cherokee
 * Purple) est notée gf/gf + y/y parce que c'est la combinaison qui
 * produit ce phénotype. Le génotype réel peut comporter d'autres gènes
 * modificateurs non modélisés.
 *
 * Valeurs chiffrées (poids moyen du fruit, jours de la plantation à la
 * première récolte, °Brix, rendement) : ordres de grandeur tirés des
 * catalogues semenciers et fiches variétales courantes, qui varient
 * fortement selon le climat et la conduite. Indicatives.
 */

export type TomatoType = 'cerise' | 'cocktail' | 'ronde' | 'côtelée' | 'cœur' | 'allongée' | 'ovale';

export interface TomatoVariety {
  id: string;
  name: string;
  origin: string;
  /** Loci où la variété est homozygote pour l'allèle d'intérêt (variant). */
  variants: VariantId[];
  /** Poids moyen d'un fruit (g). */
  weightG: number;
  /** Taux de sucres/solides solubles typique (°Brix). */
  brix: number;
  /** Jours de la plantation à la première récolte. */
  days: number;
  /** Rendement indicatif par plante (kg), conduite amateur. */
  yieldKg: number;
  /** Présente pour les fiches détaillées ; absente pour le catalogue élargi
   * (le texte est alors composé à l'affichage à partir des caractères). */
  description?: { fr: string; en: string };
  /** 'curated' = fiche vérifiée à la main ; 'tomatobase' = catalogue élargi
   * (Tatiana's TOMATObase, GFDL) : génotype déduit du phénotype, chiffres estimés. */
  source?: 'curated' | 'tomatobase' | 'custom';
  /** Usages déclarés : slicer, salad, cherry, paste, canner, cooking, stuffer. */
  kinds?: string[];
  /** Particularités non modélisées : bicolor, peach, orange, semi-det. */
  flags?: string[];
  /** Variété perso : haplotypes polygéniques exacts de la lignée d'origine
   * (un par trait, homozygote), pour qu'elle se ressème à l'identique. */
  haps?: Partial<Record<'weight' | 'brix' | 'days' | 'yield' | 'acidity' | 'crack' | 'shelf' | 'heat' | 'cold', number[]>>;
  /** Hybride F1 du commerce : génotype hétérozygote hypothétique. */
  hybrid?: boolean;
  /** Traits complémentaires (unités réelles) ; estimés si absents. */
  acidity?: number;
  crack?: number;
  shelfDays?: number;
  heat?: number;
  cold?: number;
  /** Variété perso : notes libres de l'obtenteur. */
  notes?: string;
  createdAt?: number;
}

export const TOMATO_VARIETIES: TomatoVariety[] = [
  {
    id: 'coeur-de-boeuf',
    name: 'Cœur de Bœuf',
    origin: 'Italie (Ligurie) — type « Cuor di Bue »',
    variants: ['fas', 'o'],
    weightG: 300,
    brix: 5,
    days: 80,
    yieldKg: 4,
    description: {
      fr: 'Gros fruit en cœur, chair dense et peu de graines. Collet vert.',
      en: 'Large heart-shaped fruit, dense flesh and few seeds. Green shoulder.',
    },
  },
  {
    id: 'noire-de-crimee',
    name: 'Noire de Crimée',
    origin: 'Crimée (Ukraine)',
    variants: ['gf', 'fas'],
    weightG: 220,
    brix: 5.5,
    days: 75,
    yieldKg: 4,
    crack: 30,
    description: {
      fr: 'Tomate « noire » : chair rouge + chlorophylle retenue (gf) = brun-acajou. Peau jaune (Y).',
      en: '"Black" tomato: red flesh + retained chlorophyll (gf) = mahogany. Yellow skin (Y).',
    },
  },
  {
    id: 'cherokee-purple',
    name: 'Cherokee Purple',
    origin: 'États-Unis (Tennessee)',
    variants: ['gf', 'y', 'fas'],
    weightG: 280,
    brix: 6,
    days: 80,
    yieldKg: 3.5,
    crack: 35,
    shelfDays: 9,
    description: {
      fr: 'Noire à peau incolore (gf + y) : teinte rose-pourpre fumée. Très parfumée.',
      en: 'Black with colourless skin (gf + y): dusky purple-pink. Very flavourful.',
    },
  },
  {
    id: 'green-zebra',
    name: 'Green Zebra',
    origin: 'États-Unis — Tom Wagner, 1983',
    variants: ['r', 'gf', 'gs'],
    weightG: 75,
    brix: 6,
    days: 78,
    yieldKg: 4,
    acidity: 0.65,
    description: {
      fr: 'Verte à maturité (jaune + stay-green) et rayée. Acidulée.',
      en: 'Green when ripe (yellow + stay-green) and striped. Tangy.',
    },
  },
  {
    id: 'brandywine',
    name: 'Brandywine (Sudduth)',
    origin: 'États-Unis — Amish, fin XIXᵉ',
    variants: ['y', 'c', 'fas'],
    weightG: 450,
    brix: 6,
    days: 90,
    yieldKg: 3,
    crack: 25,
    shelfDays: 8,
    description: {
      fr: 'Grosse rose (peau incolore) à feuille de pomme de terre. Tardive, référence gustative.',
      en: 'Large pink (colourless skin) with potato leaves. Late, a flavour benchmark.',
    },
  },
  {
    id: 'rose-de-berne',
    name: 'Rose de Berne',
    origin: 'Suisse',
    variants: ['y'],
    weightG: 180,
    brix: 5.5,
    days: 75,
    yieldKg: 4,
    crack: 40,
    description: {
      fr: 'Ronde rose, peau fine, très douce.',
      en: 'Round pink, thin skin, very sweet.',
    },
  },
  {
    id: 'marmande',
    name: 'Marmande',
    origin: 'France (Lot-et-Garonne)',
    variants: ['fas'],
    weightG: 180,
    brix: 4.5,
    days: 70,
    yieldKg: 4,
    crack: 45,
    description: {
      fr: 'Rouge aplatie et côtelée, précoce. Port semi-déterminé en réalité (modélisé indéterminé).',
      en: 'Red, flattened and ribbed, early. Semi-determinate in reality (modelled indeterminate).',
    },
  },
  {
    id: 'costoluto-genovese',
    name: 'Costoluto Genovese',
    origin: 'Italie (Ligurie)',
    variants: ['fas'],
    weightG: 200,
    brix: 5,
    days: 80,
    yieldKg: 4,
    description: {
      fr: 'Rouge très côtelée, idéale en sauce et en farce.',
      en: 'Deeply ribbed red, ideal for sauce and stuffing.',
    },
  },
  {
    id: 'roma-vf',
    name: 'Roma VF',
    origin: 'États-Unis — USDA, 1955',
    variants: ['o', 'sp', 'u', 'Ve', 'I'],
    weightG: 80,
    brix: 5,
    days: 75,
    yieldKg: 3,
    crack: 80,
    shelfDays: 20,
    description: {
      fr: 'Tomate prune à sauce, port déterminé, résistante verticilliose + fusariose (VF).',
      en: 'Plum sauce tomato, determinate, Verticillium + Fusarium resistant (VF).',
    },
  },
  {
    id: 'san-marzano',
    name: 'San Marzano',
    origin: 'Italie (Campanie)',
    variants: ['sun'],
    weightG: 100,
    brix: 5,
    days: 80,
    yieldKg: 4,
    crack: 75,
    shelfDays: 20,
    acidity: 0.45,
    description: {
      fr: 'Allongée (gène SUN), chair épaisse, la tomate à sauce italienne par excellence.',
      en: 'Elongated (SUN gene), thick flesh, the classic Italian sauce tomato.',
    },
  },
  {
    id: 'heinz-1350',
    name: 'Heinz 1350',
    origin: 'États-Unis — H.J. Heinz, 1963',
    variants: ['sp', 'u', 'Ve', 'I'],
    weightG: 170,
    brix: 5,
    days: 75,
    yieldKg: 3.5,
    crack: 85,
    shelfDays: 16,
    description: {
      fr: 'Tomate de conserverie : déterminée, maturation uniforme, VF.',
      en: 'Processing tomato: determinate, uniform ripening, VF.',
    },
  },
  {
    id: 'moneymaker',
    name: 'Moneymaker',
    origin: 'Royaume-Uni, 1913',
    variants: [],
    weightG: 110,
    brix: 4.5,
    days: 75,
    yieldKg: 5,
    crack: 60,
    description: {
      fr: 'Ronde rouge classique, productive et régulière. Bon témoin « standard ».',
      en: 'Classic round red, productive and even. A good "standard" control.',
    },
  },
  {
    id: 'stupice',
    name: 'Stupice',
    origin: 'Tchéquie',
    variants: ['c'],
    weightG: 60,
    brix: 6,
    days: 55,
    yieldKg: 4,
    cold: 85,
    crack: 55,
    description: {
      fr: 'Très précoce, tolère le frais, feuille de pomme de terre.',
      en: 'Very early, cool-tolerant, potato leaf.',
    },
  },
  {
    id: 'sub-arctic-plenty',
    name: 'Sub-Arctic Plenty',
    origin: 'Canada',
    variants: ['sp'],
    weightG: 60,
    brix: 4.5,
    days: 50,
    yieldKg: 2,
    cold: 90,
    description: {
      fr: 'Déterminée ultra-précoce pour climats courts.',
      en: 'Ultra-early determinate for short seasons.',
    },
  },
  {
    id: 'moonglow',
    name: 'Moonglow',
    origin: 'États-Unis',
    variants: ['t'],
    weightG: 190,
    brix: 5.5,
    days: 80,
    yieldKg: 4,
    description: {
      fr: 'Orange « tangerine » riche en tétra-cis-lycopène, étudiée pour sa biodisponibilité.',
      en: 'Orange "tangerine" type rich in tetra-cis-lycopene, studied for bioavailability.',
    },
  },
  {
    id: 'indigo-rose',
    name: 'Indigo Rose',
    origin: 'États-Unis — Oregon State University (J. Myers), 2012',
    variants: ['Aft', 'atv'],
    weightG: 50,
    brix: 5.5,
    days: 80,
    yieldKg: 3,
    description: {
      fr: 'Peau indigo (Aft + atv) là où le soleil touche le fruit, chair rouge.',
      en: 'Indigo skin (Aft + atv) where sun hits the fruit, red flesh.',
    },
  },
  {
    id: 'tigerella',
    name: 'Tigerella',
    origin: 'Royaume-Uni, années 1970',
    variants: ['gs'],
    weightG: 55,
    brix: 6,
    days: 60,
    yieldKg: 4,
    description: {
      fr: 'Rouge rayée d’orange, précoce.',
      en: 'Red with orange stripes, early.',
    },
  },
  {
    id: 'yellow-pear',
    name: 'Yellow Pear',
    origin: 'Europe, XVIIIᵉ siècle',
    variants: ['r', 'o'],
    weightG: 18,
    brix: 6,
    days: 75,
    yieldKg: 5,
    acidity: 0.38,
    crack: 60,
    description: {
      fr: 'Petite poire jaune (r + ovate), très vigoureuse.',
      en: 'Small yellow pear (r + ovate), very vigorous.',
    },
  },
  {
    id: 'gardeners-delight',
    name: "Gardener's Delight",
    origin: 'Allemagne (« Sugar Lump »)',
    variants: [],
    weightG: 15,
    brix: 8.5,
    days: 65,
    yieldKg: 5,
    crack: 35,
    acidity: 0.55,
    description: {
      fr: 'Cerise rouge très sucrée, en longues grappes.',
      en: 'Very sweet red cherry in long trusses.',
    },
  },
  {
    id: 'black-cherry',
    name: 'Black Cherry',
    origin: 'États-Unis — Vince Sapp, 2003',
    variants: ['gf'],
    weightG: 20,
    brix: 7,
    days: 70,
    yieldKg: 5,
    description: {
      fr: 'Cerise « noire » (gf), goût intense.',
      en: '"Black" cherry (gf), intense taste.',
    },
  },
  {
    id: 'principe-borghese',
    name: 'Principe Borghese',
    origin: 'Italie',
    variants: ['o', 'sp'],
    weightG: 35,
    brix: 6,
    days: 75,
    yieldKg: 3,
    shelfDays: 25,
    crack: 70,
    description: {
      fr: 'Petite ovale déterminée, traditionnelle pour le séchage.',
      en: 'Small oval determinate, the traditional drying tomato.',
    },
  },
  {
    id: 'pruden-purple',
    name: "Pruden's Purple",
    origin: 'États-Unis',
    variants: ['y', 'c', 'fas'],
    weightG: 350,
    brix: 5.5,
    days: 70,
    yieldKg: 3.5,
    description: {
      fr: 'Grosse rose à feuille de pomme de terre, plus précoce que Brandywine.',
      en: 'Large pink potato-leaf, earlier than Brandywine.',
    },
  },
  {
    id: 'matts-wild-cherry',
    name: "Matt's Wild Cherry",
    origin: 'Mexique (S. pimpinellifolium × lycopersicum)',
    variants: [],
    weightG: 8,
    brix: 8,
    days: 60,
    yieldKg: 5,
    heat: 85,
    crack: 35,
    description: {
      fr: 'Groseille sauvage minuscule, très sucrée, vigueur extrême.',
      en: 'Tiny wild currant tomato, very sweet, extremely vigorous.',
    },
  },
  {
    id: 'caro-rich',
    name: 'Caro Rich',
    origin: 'États-Unis — Purdue University, années 1970',
    variants: ['B'],
    weightG: 170,
    brix: 5,
    days: 80,
    yieldKg: 3.5,
    description: {
      fr: 'Orange riche en β-carotène (gène Beta) : environ dix fois plus de provitamine A qu’une rouge. Peu acide.',
      en: 'Orange, rich in β-carotene (Beta gene): about ten times the provitamin A of a red. Low acid.',
    },
  },
  {
    id: 'big-rainbow',
    name: 'Big Rainbow',
    origin: 'États-Unis (Minnesota)',
    variants: ['bic', 'fas'],
    weightG: 500,
    brix: 6,
    days: 90,
    yieldKg: 3,
    crack: 30,
    description: {
      fr: 'Grosse bicolore : chair jaune marbrée de rouge (allèle PSY1 faible), douce et peu acide.',
      en: 'Large bicolour: yellow flesh marbled red (weak PSY1 allele), mild and low-acid.',
    },
  },
  {
    id: 'pineapple',
    name: 'Pineapple',
    origin: 'États-Unis (Kentucky)',
    variants: ['bic', 'fas'],
    weightG: 450,
    brix: 6,
    days: 95,
    yieldKg: 3,
    crack: 30,
    description: {
      fr: 'Bicolore jaune et rouge, tardive, très grosse.',
      en: 'Yellow and red bicolour, late, very large.',
    },
  },
  {
    id: 'garden-peach',
    name: 'Garden Peach',
    origin: 'États-Unis, XIXᵉ siècle',
    variants: ['r', 'p'],
    weightG: 50,
    brix: 6,
    days: 75,
    yieldKg: 4,
    crack: 75,
    shelfDays: 30,
    description: {
      fr: 'Petite jaune à peau duveteuse de pêche (gène p), se conserve longtemps.',
      en: 'Small yellow with fuzzy peach skin (p gene), keeps a long time.',
    },
  },
  {
    id: 'long-keeper',
    name: 'Long Keeper',
    origin: 'États-Unis — Burpee',
    variants: ['alc'],
    weightG: 180,
    brix: 4.5,
    days: 78,
    yieldKg: 3.5,
    description: {
      fr: 'Tomate « d’hiver » : cueillie peu colorée, elle mûrit lentement et se garde plusieurs mois.',
      en: '"Winter" tomato: picked barely coloured, it ripens slowly and keeps for months.',
    },
  },
  {
    id: 'arkansas-traveler',
    name: 'Arkansas Traveler',
    origin: 'États-Unis (Arkansas)',
    variants: ['y'],
    weightG: 170,
    brix: 5,
    days: 76,
    yieldKg: 4,
    heat: 80,
    crack: 70,
    description: {
      fr: 'Rose ronde réputée pour nouer même par forte chaleur et résister à l’éclatement.',
      en: 'Round pink known for setting fruit in strong heat and resisting cracks.',
    },
  },
  {
    id: 'glacier',
    name: 'Glacier',
    origin: 'Suède / États-Unis',
    variants: ['c'],
    weightG: 60,
    brix: 5.5,
    days: 55,
    yieldKg: 3,
    cold: 90,
    description: {
      fr: 'Très précoce, feuille de pomme de terre, noue par temps frais : pour les climats courts.',
      en: 'Very early, potato leaf, sets fruit in cool weather: for short seasons.',
    },
  },
];

// --- Catalogue élargi (Tatiana's TOMATObase) ---------------------------------

interface CompactVariety {
  /** identifiant (slug ASCII) calculé par le script de conversion */
  i: string;
  n: string;
  v: string;
  w: number;
  d: number;
  b: number;
  y: number;
  c: string;
  k: string;
  f: string;
  /** 1 = hybride F1 */
  x?: number;
}


/**
 * Charge à la demande les variétés du catalogue élargi, générées par
 * scripts/tomatobase_to_json.py depuis Tatiana's TOMATObase
 * (https://tatianastomatobase.com — contenu sous licence GNU FDL 1.2).
 * Chargement différé : le fichier n'est téléchargé qu'à l'ouverture de
 * l'atelier tomate.
 */
export async function loadExtendedVarieties(): Promise<TomatoVariety[]> {
  const mod = await import('../../data/tomatoes-tomatobase.json');
  const list = mod.default as CompactVariety[];
  return list.map((e) => ({
    id: `tb-${e.i}`,
    name: e.n,
    origin: e.c,
    variants: (e.v ? e.v.split(' ') : []) as VariantId[],
    weightG: e.w,
    brix: e.b,
    days: e.d,
    yieldKg: e.y,
    source: 'tomatobase',
    kinds: e.k ? e.k.split(' ') : [],
    flags: e.f ? e.f.split(' ').filter((f) => f !== 'hybrid') : [],
    hybrid: e.x === 1,
  }));
}
