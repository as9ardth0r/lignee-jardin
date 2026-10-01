/**
 * Espèces et loci mendéliens des haricots (genre Phaseolus, 2n = 22,
 * 11 chromosomes Pv01 à Pv11).
 *
 * Sources : liste des gènes du haricot du Bean Improvement Cooperative
 * (Bean Genes List 2017) ; couleur et motifs du tégument (Bassett 2007 ;
 * McClean, Lee, Otto et al. 2002, J. Hered. 93:148) ; positions sur les
 * chromosomes d’après la liste du BIC et les cartes de référence.
 *
 * Modèle de la couleur du tégument (simplifié, mais fidèle à la logique) :
 *  - P est épistatique : p/p → graine BLANCHE et fleur blanche, quels que
 *    soient les autres gènes ;
 *  - avec P : V (anthocyanes) → teintes violettes à noires et fleurs
 *    violettes ; v/v → teintes jaunes, chamois, brunes et fleurs blanches ;
 *  - G (jaune-brun) et B (brun verdâtre) modulent la teinte : avec V,
 *    G + B = noir ; avec v : G + B = brun, G seul = jaune, B seul = brun
 *    verdâtre (« olive »), aucun = chamois ;
 *  - R (rouge « sang de bœuf », dans le complexe C) donne les graines
 *    rouges ;
 *  - motifs : Cst (marbrures et stries, complexe C) ; t/t = graine
 *    partiellement colorée (blanche avec un « œil » coloré).
 * Le gène J (couleur « pleine » et brillance) est supposé présent partout.
 *
 * Simplifications assumées : série V réduite à V/v (sans l’allèle rose
 * v^lae) ; complexe C réduit à deux loci très liés (C, R) ; Z, L et Bip
 * (forme et taille de l’œil) non modélisés.
 */

export type SpeciesId = 'vulgaris' | 'coccineus' | 'dumosus' | 'acutifolius' | 'lunatus';

export const SPECIES: SpeciesId[] = ['vulgaris', 'coccineus', 'dumosus', 'acutifolius', 'lunatus'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt }> = {
  vulgaris: {
    latin: 'Phaseolus vulgaris',
    short: 'P. vulgaris',
    name: T('Haricot commun', 'Common bean'),
    examples: T('haricots verts, beurre, mangetout, coco, lingot, flageolet, haricots secs', 'green, wax and snap beans, borlotti, cannellini, flageolet, dry beans'),
  },
  coccineus: {
    latin: 'Phaseolus coccineus',
    short: 'P. coccineus',
    name: T('Haricot d’Espagne', 'Runner bean'),
    examples: T('Scarlet Emperor, Painted Lady, haricot d’Espagne blanc, gigantes', 'Scarlet Emperor, Painted Lady, White Emergo, gigantes'),
  },
  dumosus: {
    latin: 'Phaseolus dumosus',
    short: 'P. dumosus',
    name: T('Haricot « d’un an » (polyanthus)', 'Year bean (polyanthus)'),
    examples: T('frijol de año, cacha', 'frijol de año, cacha'),
  },
  acutifolius: {
    latin: 'Phaseolus acutifolius',
    short: 'P. acutifolius',
    name: T('Haricot tépari', 'Tepary bean'),
    examples: T('tépari blanc, brun, noir', 'white, brown and black tepary'),
  },
  lunatus: {
    latin: 'Phaseolus lunatus',
    short: 'P. lunatus',
    name: T('Haricot de Lima', 'Lima bean'),
    examples: T('Lima de Henderson, Fordhook, Christmas Lima, pois du Cap', 'Henderson Bush, Fordhook, Christmas Lima, butter bean'),
  },
};

export type BeanLocusId = 'p' | 'v' | 'g' | 'b' | 'r' | 'c' | 't' | 'fin' | 'st' | 'y' | 'prp' | 'i' | 'bc3' | 'co2' | 'ur3' | 'pse1';

export type VariantId = 'p' | 'v' | 'G' | 'B' | 'R' | 'Cst' | 't' | 'fin' | 'St' | 'y' | 'Prp' | 'I' | 'bc3' | 'Co2' | 'Ur3' | 'Pse1';

export type LocusCategory = 'seed' | 'pattern' | 'plant' | 'pod' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: BeanLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  /** Chromosome Pv01–Pv11 (absent : traité comme indépendant). */
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const VUL: SpeciesId[] = ['vulgaris'];
const OTHERS: SpeciesId[] = ['coccineus', 'dumosus', 'acutifolius', 'lunatus'];

export const BEAN_LOCI: LocusDef[] = [
  {
    id: 'p',
    symbol: 'P',
    category: 'seed',
    name: T('Couleur de base (P)', 'Basic colour (P)'),
    alleles: [
      { allele: 'P', name: T('Graine colorée', 'Coloured seed') },
      {
        allele: 'p',
        id: 'p',
        name: T('Graine blanche', 'White seed'),
        effect: T('Récessif et épistatique : p/p donne une graine blanche ET une fleur blanche, quels que soient les autres gènes de couleur (coco blanc, lingot, navy).', 'Recessive and epistatic: p/p gives a white seed AND a white flower, whatever the other colour genes (cannellini, navy).'),
      },
    ],
    standard: 'P',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 7,
    cM: 30,
  },
  {
    id: 'v',
    symbol: 'V',
    category: 'seed',
    name: T('Anthocyanes (V)', 'Anthocyanin (V)'),
    alleles: [
      { allele: 'V', name: T('Violet / noir, fleur violette', 'Violet / black, purple flower') },
      {
        allele: 'v',
        id: 'v',
        name: T('Teintes jaunes à brunes, fleur blanche', 'Yellow to brown hues, white flower'),
        effect: T('Récessif : sans anthocyanes, la graine est chamois, jaune, brune ou rouge, et la fleur blanche.', 'Recessive: without anthocyanins the seed is buff, yellow, brown or red, and the flower white.'),
      },
    ],
    standard: 'V',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 6,
    cM: 40,
  },
  {
    id: 'g',
    symbol: 'G',
    category: 'seed',
    name: T('Jaune-brun (G)', 'Yellow-brown (G)'),
    alleles: [
      { allele: 'G', id: 'G', name: T('Jaune-brun', 'Yellow-brown'), effect: T('Dominant : avec V et B, graine noire ; sans V, graine jaune (seul) ou brune (avec B).', 'Dominant: with V and B, black seed; without V, yellow (alone) or brown (with B).') },
      { allele: 'g', name: T('—', '—') },
    ],
    standard: 'g',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 4,
    cM: 50,
  },
  {
    id: 'b',
    symbol: 'B',
    category: 'seed',
    name: T('Brun verdâtre (B)', 'Greenish brown (B)'),
    alleles: [
      { allele: 'B', id: 'B', name: T('Brun verdâtre', 'Greenish brown'), effect: T('Dominant : assombrit la graine ; très étroitement lié au gène I de résistance à la mosaïque.', 'Dominant: darkens the seed; very tightly linked to the I mosaic-resistance gene.') },
      { allele: 'b', name: T('—', '—') },
    ],
    standard: 'b',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 2,
    cM: 96,
  },
  {
    id: 'r',
    symbol: 'R',
    category: 'seed',
    name: T('Rouge (R, complexe C)', 'Red (R, C complex)'),
    alleles: [
      { allele: 'R', id: 'R', name: T('Graine rouge', 'Red seed'), effect: T('Dominant (sans V) : rouge « sang de bœuf » des haricots rouges et des marbrures des cocos.', 'Dominant (without V): the oxblood red of red beans and of borlotti markings.') },
      { allele: 'r', name: T('—', '—') },
    ],
    standard: 'r',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 8,
    cM: 41,
  },
  {
    id: 'c',
    symbol: 'C',
    category: 'pattern',
    name: T('Marbrures et stries (Cst)', 'Marbling and stripes (Cst)'),
    alleles: [
      {
        allele: 'Cst',
        id: 'Cst',
        name: T('Graine marbrée, gousse striée', 'Marbled seed, striped pod'),
        effect: T('Dominant : fond clair marbré ou strié de la couleur de la graine (coco de Prague, pinto) ; stries aussi sur la gousse.', 'Dominant: pale background marbled or striped with the seed colour (borlotti, pinto); stripes on the pod too.'),
      },
      { allele: 'C', name: T('Uni', 'Plain') },
    ],
    standard: 'C',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 8,
    cM: 40,
    note: T('Le locus C est un complexe de gènes très liés ; il est réduit ici à Cst et R.', 'The C locus is a complex of tightly linked genes; reduced here to Cst and R.'),
  },
  {
    id: 't',
    symbol: 'T',
    category: 'pattern',
    name: T('Graine partiellement colorée (t)', 'Partly coloured seed (t)'),
    alleles: [
      { allele: 'T', name: T('Graine entièrement colorée', 'Fully coloured seed') },
      {
        allele: 't',
        id: 't',
        name: T('Œil coloré sur fond blanc', 'Coloured eye on white'),
        effect: T('Récessif : la couleur ne couvre que la zone autour du hile (« œil » : Yellow Eye, Soldier, Orca). Fleurs plus pâles.', 'Recessive: colour only around the hilum (“eye”: Yellow Eye, Soldier, Orca). Paler flowers.'),
      },
    ],
    standard: 'T',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 9,
    cM: 30,
  },
  {
    id: 'fin',
    symbol: 'fin',
    category: 'plant',
    name: T('Port nain (fin)', 'Bush habit (fin)'),
    alleles: [
      { allele: 'Fin', name: T('Grimpant (à rames)', 'Climbing (pole)') },
      {
        allele: 'fin',
        id: 'fin',
        name: T('Nain (déterminé)', 'Bush (determinate)'),
        effect: T('Récessif : la tige se termine par une inflorescence, plante naine de 40–60 cm ; F1 nain × rames = à rames.', 'Recessive: the stem ends in a flower cluster, 40–60 cm bush; bush × pole F1 = pole.'),
      },
    ],
    standard: 'Fin',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 1,
    cM: 20,
  },
  {
    id: 'st',
    symbol: 'St',
    category: 'pod',
    name: T('Sans fil (St)', 'Stringless (St)'),
    alleles: [
      { allele: 'St', id: 'St', name: T('Gousse sans fil', 'Stringless pod'), effect: T('Dominant : pas de fil le long de la gousse (haricots verts modernes, depuis 1894).', 'Dominant: no string along the pod (modern snap beans, since 1894).') },
      { allele: 'st', name: T('Avec fil', 'With string') },
    ],
    standard: 'st',
    documented: VUL,
    hypothetical: OTHERS,
    cM: 0,
  },
  {
    id: 'y',
    symbol: 'y',
    category: 'pod',
    name: T('Gousse jaune (beurre)', 'Yellow pod (wax)'),
    alleles: [
      { allele: 'Y', name: T('Gousse verte', 'Green pod') },
      { allele: 'y', id: 'y', name: T('Gousse jaune (beurre)', 'Yellow (wax) pod'), effect: T('Récessif : gousse jaune cireux, les haricots « beurre ».', 'Recessive: waxy yellow pod, the “wax” beans.') },
    ],
    standard: 'Y',
    documented: VUL,
    hypothetical: OTHERS,
    cM: 0,
  },
  {
    id: 'prp',
    symbol: 'Prp',
    category: 'pod',
    name: T('Gousse violette (Prp)', 'Purple pod (Prp)'),
    alleles: [
      { allele: 'Prp', id: 'Prp', name: T('Gousse violette', 'Purple pod'), effect: T('Dominant : gousse violette (elle redevient verte à la cuisson) ; dans le complexe C, avec V.', 'Dominant: purple pod (it turns green when cooked); in the C complex, with V.') },
      { allele: 'prp', name: T('Gousse verte', 'Green pod') },
    ],
    standard: 'prp',
    documented: VUL,
    hypothetical: OTHERS,
    chromosome: 8,
    cM: 42,
  },
  {
    id: 'i',
    symbol: 'I',
    category: 'resistance',
    name: T('Mosaïque commune (I)', 'Common mosaic (I)'),
    alleles: [
      {
        allele: 'I',
        id: 'I',
        name: T('I (hypersensibilité)', 'I (hypersensitivity)'),
        effect: T('Dominant : protège de la mosaïque commune (BCMV), mais face à la souche nécrotique (BCMNV) la plante meurt de « racine noire ». À combiner avec bc-3.', 'Dominant: protects from common mosaic (BCMV), but with the necrotic strain (BCMNV) the plant dies of “black root”. Combine with bc-3.'),
      },
      { allele: 'i', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'i',
    documented: VUL,
    chromosome: 2,
    cM: 97,
  },
  {
    id: 'bc3',
    symbol: 'bc-3',
    category: 'resistance',
    name: T('Mosaïque, toutes souches (bc-3)', 'Mosaic, all strains (bc-3)'),
    alleles: [
      { allele: 'Bc3+', name: T('Sensible', 'Susceptible') },
      { allele: 'bc3', id: 'bc3', name: T('bc-3', 'bc-3'), effect: T('Récessif : bloque toutes les souches de BCMV et BCMNV ; protège aussi le gène I de la racine noire.', 'Recessive: blocks every BCMV and BCMNV strain; also shields I from black root.') },
    ],
    standard: 'Bc3+',
    documented: VUL,
    chromosome: 6,
    cM: 90,
  },
  {
    id: 'co2',
    symbol: 'Co-2',
    category: 'resistance',
    name: T('Anthracnose (Co-2 / Are)', 'Anthracnose (Co-2 / Are)'),
    alleles: [
      { allele: 'Co2', id: 'Co2', name: T('Co-2 (Are)', 'Co-2 (Are)'), effect: T('Dominant : résistance à l’anthracnose, le gène « Are » de Cornell 49242, très utilisé dans les variétés européennes.', 'Dominant: anthracnose resistance, the “Are” gene from Cornell 49242, widely used in European varieties.') },
      { allele: 'co2', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'co2',
    documented: VUL,
    chromosome: 11,
    cM: 20,
  },
  {
    id: 'ur3',
    symbol: 'Ur-3',
    category: 'resistance',
    name: T('Rouille (Ur-3)', 'Rust (Ur-3)'),
    alleles: [
      { allele: 'Ur3', id: 'Ur3', name: T('Ur-3', 'Ur-3'), effect: T('Dominant : résistance à de nombreuses races de rouille (Uromyces appendiculatus).', 'Dominant: resistance to many rust races (Uromyces appendiculatus).') },
      { allele: 'ur3', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'ur3',
    documented: VUL,
    chromosome: 11,
    cM: 100,
  },
  {
    id: 'pse1',
    symbol: 'Pse-1',
    category: 'resistance',
    name: T('Graisse (Pse-1)', 'Halo blight (Pse-1)'),
    alleles: [
      { allele: 'Pse1', id: 'Pse1', name: T('Pse-1', 'Pse-1'), effect: T('Dominant : résistance à la graisse du haricot (Pseudomonas, taches huileuses auréolées) des étés frais et humides.', 'Dominant: resistance to halo blight (Pseudomonas, greasy haloed spots) of cool, wet summers.') },
      { allele: 'pse1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'pse1',
    documented: VUL,
    chromosome: 10,
    cM: 60,
  },
];

export const LOCUS_BY_ID: Record<BeanLocusId, LocusDef> = Object.fromEntries(BEAN_LOCI.map((l) => [l.id, l])) as Record<BeanLocusId, LocusDef>;
export const LOCUS_IDS: BeanLocusId[] = BEAN_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [BeanLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [BeanLocusId, string]>;
  for (const l of BEAN_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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
