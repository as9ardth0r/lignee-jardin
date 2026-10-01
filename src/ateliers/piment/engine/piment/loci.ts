/**
 * Espèces et loci mendéliens des piments et poivrons (genre Capsicum,
 * 2n = 24, 12 chromosomes).
 *
 * Sources : liste des gènes du poivron (Wang & Bosland 2006, J. Amer. Soc.
 * Hort. Sci. 131:6) ; couleur du fruit mûr, modèle à trois loci Y (CCS),
 * C2 (PSY1), C1 (PRR2) (Hurtado-Hernandez & Smith 1985 ; Jeong et al. 2020,
 * Front. Plant Sci. 11:399) ; cl = SGR, rétention de chlorophylle (Borovsky
 * & Paran 2008) ; Pun1 (Stewart et al. 2005) ; up, fruits dressés, récessif
 * (Cohen et al. 2021, Front. Plant Sci. 12:675474) ; S, fruit caduc et chair
 * molle des piments sauvages (Rao & Paran 2003) ; série L des tobamovirus
 * (Boukema 1980) ; Tsw (Jahn et al. 2000) ; Bs2 (Tai et al. 1999) ; pvr2 et
 * Pvr4 (Kyle & Palloix 1997) ; Me3 (Djian-Caporalino et al. 2007) ; stérilité
 * mâle cytoplasmique et restaurateur Rf (Peterson 1958 ; Jo et al. 2016).
 *
 * Les chromosomes sont ceux du génome de référence ; les positions (cM)
 * sont approchées, seulement pour rendre compte des liaisons.
 *
 * Simplifications assumées :
 *  - piquant : Pun1 présent/absent, le niveau (Scoville) est polygénique ;
 *  - Pvr4, Tsw, A et S sont bien sur le chromosome 10, mais leurs distances
 *    exactes sont approchées ;
 *  - pvr2 : les allèles pvr2-1 et pvr2-2 sont réunis.
 */

export type SpeciesId = 'annuum' | 'chinense' | 'frutescens' | 'baccatum' | 'pubescens';

export const SPECIES: SpeciesId[] = ['annuum', 'chinense', 'frutescens', 'baccatum', 'pubescens'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt }> = {
  annuum: {
    latin: 'Capsicum annuum',
    short: 'C. annuum',
    name: T('Poivrons et piments annuum', 'Sweet peppers & annuum chillies'),
    examples: T('poivron, Espelette, Cayenne, jalapeño, piment d’Anglet, paprika, Doux long des Landes', 'bell pepper, Espelette, cayenne, jalapeño, paprika, Anaheim'),
  },
  chinense: {
    latin: 'Capsicum chinense',
    short: 'C. chinense',
    name: T('Piments chinense (habanero)', 'Chinense chillies (habanero)'),
    examples: T('habanero, Scotch bonnet, Bhut Jolokia, Carolina Reaper, Biquinho', 'habanero, Scotch bonnet, Bhut Jolokia, Carolina Reaper, Biquinho'),
  },
  frutescens: {
    latin: 'Capsicum frutescens',
    short: 'C. frutescens',
    name: T('Piments frutescens (tabasco)', 'Frutescens chillies (tabasco)'),
    examples: T('Tabasco, piment oiseau, Malagueta', 'Tabasco, bird’s eye, Malagueta'),
  },
  baccatum: {
    latin: 'Capsicum baccatum',
    short: 'C. baccatum',
    name: T('Piments baccatum (ají)', 'Baccatum chillies (ají)'),
    examples: T('Ají amarillo, Lemon Drop, Bishop’s Crown, Aji Cristal', 'Ají amarillo, Lemon Drop, Bishop’s Crown, Aji Cristal'),
  },
  pubescens: {
    latin: 'Capsicum pubescens',
    short: 'C. pubescens',
    name: T('Rocoto (fleurs violettes, graines noires)', 'Rocoto (purple flowers, black seeds)'),
    examples: T('rocoto, manzano', 'rocoto, manzano'),
  },
};

export type PepperLocusId = 'pun1' | 'y' | 'c2' | 'c1' | 'cl' | 'a' | 'sw' | 'up' | 'fa' | 's' | 'rf' | 'l' | 'tsw' | 'bs2' | 'pvr2' | 'pvr4' | 'me3';

/** Identifiant d'un allèle d'intérêt (unique dans tout le modèle). */
export type VariantId =
  | 'pun1'
  | 'y'
  | 'c2'
  | 'c1'
  | 'cl'
  | 'A'
  | 'sw'
  | 'up'
  | 'fa'
  | 'S'
  | 'Rf'
  | 'L1'
  | 'L2'
  | 'L3'
  | 'L4'
  | 'Tsw'
  | 'Bs2'
  | 'pvr2'
  | 'Pvr4'
  | 'Me3';

export type LocusCategory = 'heat' | 'color' | 'plant' | 'flower' | 'resistance' | 'wild';

export interface AlleleDef {
  allele: string;
  /** Id de la variante (absent pour l'allèle standard). */
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: PepperLocusId;
  /** Symbole du gène dans la littérature. */
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  /** Allèle standard (le plus courant dans les variétés « de base »). */
  standard: string;
  incomplete?: boolean;
  /** Espèces où le gène est documenté. */
  documented: SpeciesId[];
  /** Espèces où on l'utilise sans que son hérédité y soit publiée. */
  hypothetical?: SpeciesId[];
  /** Chromosome (absent : traité comme indépendant). */
  chromosome?: number;
  /** Position approchée sur le chromosome (cM). */
  cM: number;
  note?: Txt;
}

const ALL: SpeciesId[] = ['annuum', 'chinense', 'frutescens', 'baccatum', 'pubescens'];

export const PEPPER_LOCI: LocusDef[] = [
  {
    id: 'pun1',
    symbol: 'Pun1',
    category: 'heat',
    name: T('Piquant', 'Pungency'),
    alleles: [
      { allele: 'Pun1', name: T('Piquant', 'Pungent'), effect: T('Allèle fonctionnel : le placenta fabrique de la capsaïcine.', 'Functional allele: the placenta makes capsaicin.') },
      {
        allele: 'pun1',
        id: 'pun1',
        name: T('Doux (sans capsaïcine)', 'Sweet (no capsaicin)'),
        effect: T('Récessif : deux copies et le fruit ne pique pas du tout, quel que soit le reste du génome (tous les poivrons).', 'Recessive: with two copies the fruit is not hot at all, whatever the rest of the genome (every sweet pepper).'),
      },
    ],
    standard: 'Pun1',
    documented: ['annuum', 'chinense', 'frutescens'],
    hypothetical: ['baccatum', 'pubescens'],
    chromosome: 2,
    cM: 40,
  },
  {
    id: 'y',
    symbol: 'y',
    category: 'color',
    name: T('Rouge / jaune (CCS)', 'Red / yellow (CCS)'),
    alleles: [
      { allele: 'Y', name: T('Rouge', 'Red') },
      { allele: 'y', id: 'y', name: T('Fruit mûr jaune', 'Yellow when ripe'), effect: T('Récessif : sans capsanthine, le fruit mûrit jaune au lieu de rouge.', 'Recessive: without capsanthin the fruit ripens yellow instead of red.') },
    ],
    standard: 'Y',
    documented: ALL,
    chromosome: 6,
    cM: 40,
  },
  {
    id: 'c2',
    symbol: 'c2',
    category: 'color',
    name: T('Intensité des caroténoïdes (PSY1)', 'Carotenoid level (PSY1)'),
    alleles: [
      { allele: 'C2', name: T('Normal', 'Normal') },
      { allele: 'c2', id: 'c2', name: T('Orange / pâle', 'Orange / pale'), effect: T('Récessif : moins de caroténoïdes ; un rouge devient orange, un jaune devient jaune pâle.', 'Recessive: fewer carotenoids; a red fruit turns orange, a yellow one pale yellow.') },
    ],
    standard: 'C2',
    documented: ALL,
    chromosome: 4,
    cM: 20,
  },
  {
    id: 'c1',
    symbol: 'c1',
    category: 'color',
    name: T('Intensité (PRR2)', 'Intensity (PRR2)'),
    alleles: [
      { allele: 'C1', name: T('Normal', 'Normal') },
      { allele: 'c1', id: 'c1', name: T('Couleur claire', 'Light colour'), effect: T('Récessif : couleur plus claire ; avec y et c2, le fruit mûr est blanc.', 'Recessive: lighter colour; with y and c2 the ripe fruit is white.') },
    ],
    standard: 'C1',
    documented: ['annuum'],
    hypothetical: ['chinense', 'frutescens', 'baccatum', 'pubescens'],
    chromosome: 1,
    cM: 50,
  },
  {
    id: 'cl',
    symbol: 'cl',
    category: 'color',
    name: T('Chlorophylle retenue (SGR)', 'Chlorophyll retainer (SGR)'),
    alleles: [
      { allele: 'Cl', name: T('Normal', 'Normal') },
      {
        allele: 'cl',
        id: 'cl',
        name: T('Brun / reste vert', 'Brown / stays green'),
        effect: T('Récessif : la chlorophylle ne disparaît pas à maturité. Avec du rouge : fruit brun « chocolat » ; avec du jaune : fruit vert olive.', 'Recessive: chlorophyll is kept at maturity. With red: a brown “chocolate” fruit; with yellow: an olive-green fruit.'),
      },
    ],
    standard: 'Cl',
    documented: ['annuum', 'chinense'],
    hypothetical: ['frutescens', 'baccatum', 'pubescens'],
    chromosome: 1,
    cM: 110,
  },
  {
    id: 'a',
    symbol: 'A',
    category: 'color',
    name: T('Anthocyanes (violet)', 'Anthocyanin (purple)'),
    alleles: [
      {
        allele: 'A',
        id: 'A',
        name: T('Fruit jeune violet', 'Purple unripe fruit'),
        effect: T('Dominant : fruit immature violet à noir, fleurs et tiges violettes (piments ornementaux, poivrons violets).', 'Dominant: purple to black unripe fruit, purple flowers and stems (ornamental chillies, purple bell peppers).'),
      },
      { allele: 'a', name: T('Vert', 'Green') },
    ],
    standard: 'a',
    documented: ['annuum', 'chinense', 'frutescens'],
    hypothetical: ['baccatum', 'pubescens'],
    chromosome: 10,
    cM: 20,
  },
  {
    id: 'sw',
    symbol: 'sw',
    category: 'color',
    name: T('Fruit jeune ivoire', 'Ivory unripe fruit'),
    alleles: [
      { allele: 'Sw', name: T('Vert', 'Green') },
      { allele: 'sw', id: 'sw', name: T('Jeune ivoire / jaune pâle', 'Ivory / pale yellow when young'), effect: T('Récessif : le fruit immature est blanc-ivoire ou jaune pâle au lieu de vert (piments « wax », Hongrois).', 'Recessive: the unripe fruit is ivory or pale yellow instead of green (wax and Hungarian peppers).') },
    ],
    standard: 'Sw',
    documented: ['annuum'],
    hypothetical: ['chinense', 'frutescens', 'baccatum', 'pubescens'],
    cM: 0,
  },
  {
    id: 'up',
    symbol: 'up',
    category: 'plant',
    name: T('Fruits dressés', 'Erect fruit'),
    alleles: [
      { allele: 'Up', name: T('Pendants', 'Pendent') },
      { allele: 'up', id: 'up', name: T('Fruits dressés vers le ciel', 'Fruit pointing up'), effect: T('Récessif : les fruits se tiennent dressés au-dessus du feuillage (Tabasco, piments oiseaux, ornementaux).', 'Recessive: fruit stands up above the foliage (Tabasco, bird peppers, ornamentals).') },
    ],
    standard: 'Up',
    documented: ['annuum', 'frutescens'],
    hypothetical: ['chinense', 'baccatum', 'pubescens'],
    chromosome: 12,
    cM: 60,
  },
  {
    id: 'fa',
    symbol: 'fa',
    category: 'plant',
    name: T('Fruits en bouquet', 'Clustered fruit'),
    alleles: [
      { allele: 'Fa', name: T('Fruits isolés', 'Single fruits') },
      { allele: 'fa', id: 'fa', name: T('Fruits en bouquet (fasciculé)', 'Clustered (fasciculate)'), effect: T('Récessif : entre-nœuds courts au sommet, fruits groupés en bouquets (piment « Fasciculatum », Cayenne en bouquet).', 'Recessive: short top internodes, fruit in clusters (cluster cayennes).') },
    ],
    standard: 'Fa',
    documented: ['annuum'],
    hypothetical: ['chinense', 'frutescens', 'baccatum', 'pubescens'],
    cM: 0,
  },
  {
    id: 's',
    symbol: 'S',
    category: 'wild',
    name: T('Fruit caduc, chair molle (sauvage)', 'Deciduous soft fruit (wild)'),
    alleles: [
      {
        allele: 'S',
        id: 'S',
        name: T('Fruit caduc (sauvage)', 'Deciduous fruit (wild)'),
        effect: T('Dominant : fruit mou qui se détache tout seul du calice, pour les oiseaux (piments sauvages). La domestication l’a éliminé : fruit ferme qui tient sur la plante.', 'Dominant: soft fruit that drops off the calyx for birds (wild chillies). Domestication removed it: firm fruit that stays on the plant.'),
      },
      { allele: 's', name: T('Fruit ferme, persistant', 'Firm, persistent fruit') },
    ],
    standard: 's',
    documented: ['annuum'],
    hypothetical: ['chinense', 'frutescens', 'baccatum', 'pubescens'],
    chromosome: 10,
    cM: 45,
  },
  {
    id: 'rf',
    symbol: 'Rf',
    category: 'flower',
    name: T('Restaurateur de fertilité', 'Fertility restorer'),
    alleles: [
      {
        allele: 'Rf',
        id: 'Rf',
        name: T('Restaurateur (Rf)', 'Restorer (Rf)'),
        effect: T('Dominant : rend son pollen à une plante au cytoplasme stérile (CMS). Sert à produire des semences F1 de piment sans castrer.', 'Dominant: restores pollen to a plant with sterile cytoplasm (CMS). Used to produce F1 chilli seed without emasculation.'),
      },
      { allele: 'rf', name: T('Mainteneur (rf)', 'Maintainer (rf)') },
    ],
    standard: 'rf',
    documented: ['annuum'],
    hypothetical: ['chinense', 'frutescens', 'baccatum', 'pubescens'],
    chromosome: 6,
    cM: 100,
  },
  {
    id: 'l',
    symbol: 'L',
    category: 'resistance',
    name: T('Tobamovirus (série L)', 'Tobamoviruses (L series)'),
    alleles: [
      { allele: 'L4', id: 'L4', name: T('L4', 'L4'), effect: T('Pathotypes P0, P1, P1.2 et P1.2.3 (dont PMMoV). Issu de C. chacoense.', 'Pathotypes P0, P1, P1.2 and P1.2.3 (incl. PMMoV). From C. chacoense.') },
      { allele: 'L3', id: 'L3', name: T('L3', 'L3'), effect: T('Pathotypes P0, P1 et P1.2. Issu de C. chinense.', 'Pathotypes P0, P1 and P1.2. From C. chinense.') },
      { allele: 'L2', id: 'L2', name: T('L2', 'L2'), effect: T('Pathotypes P0 et P1. Issu de C. frutescens (Tabasco).', 'Pathotypes P0 and P1. From C. frutescens (Tabasco).') },
      { allele: 'L1', id: 'L1', name: T('L1', 'L1'), effect: T('Pathotype P0 (TMV, ToMV). Chez de nombreux poivrons.', 'Pathotype P0 (TMV, ToMV). In many bell peppers.') },
      { allele: 'L+', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'L+',
    documented: ALL,
    chromosome: 11,
    cM: 90,
    note: T('Chaque allèle domine ceux qui le suivent : L4 > L3 > L2 > L1.', 'Each allele is dominant over the next ones: L4 > L3 > L2 > L1.'),
  },
  {
    id: 'tsw',
    symbol: 'Tsw',
    category: 'resistance',
    name: T('Maladie bronzée (TSWV)', 'Spotted wilt (TSWV)'),
    alleles: [
      { allele: 'Tsw', id: 'Tsw', name: T('Tsw', 'Tsw'), effect: T('Dominant : résistance au virus de la maladie bronzée de la tomate, transmis par les thrips. Issu de C. chinense PI 152225.', 'Dominant: resistance to tomato spotted wilt virus, spread by thrips. From C. chinense PI 152225.') },
      { allele: 'tsw', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'tsw',
    documented: ['chinense', 'annuum'],
    chromosome: 10,
    cM: 95,
  },
  {
    id: 'bs2',
    symbol: 'Bs2',
    category: 'resistance',
    name: T('Gale bactérienne (Bs2)', 'Bacterial spot (Bs2)'),
    alleles: [
      { allele: 'Bs2', id: 'Bs2', name: T('Bs2', 'Bs2'), effect: T('Dominant : résistance aux races 0 à 3 de Xanthomonas (gale bactérienne). Issu de C. chacoense.', 'Dominant: resistance to Xanthomonas races 0–3 (bacterial spot). From C. chacoense.') },
      { allele: 'bs2', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'bs2',
    documented: ['annuum'],
    chromosome: 9,
    cM: 10,
  },
  {
    id: 'pvr2',
    symbol: 'pvr2',
    category: 'resistance',
    name: T('Virus Y (pvr2)', 'Potato virus Y (pvr2)'),
    alleles: [
      { allele: 'Pvr2+', name: T('Sensible', 'Susceptible') },
      { allele: 'pvr2', id: 'pvr2', name: T('pvr2', 'pvr2'), effect: T('Récessif : résistance au virus Y de la pomme de terre (pathotypes 0 et 1), transmis par les pucerons.', 'Recessive: resistance to potato virus Y (pathotypes 0 and 1), spread by aphids.') },
    ],
    standard: 'Pvr2+',
    documented: ['annuum', 'chinense'],
    chromosome: 4,
    cM: 60,
  },
  {
    id: 'pvr4',
    symbol: 'Pvr4',
    category: 'resistance',
    name: T('Virus Y (Pvr4)', 'Potato virus Y (Pvr4)'),
    alleles: [
      { allele: 'Pvr4', id: 'Pvr4', name: T('Pvr4', 'Pvr4'), effect: T('Dominant : résistance à tous les pathotypes du virus Y. Issu du piment mexicain Criollo de Morelos 334.', 'Dominant: resistance to every PVY pathotype. From the Mexican chilli Criollo de Morelos 334.') },
      { allele: 'pvr4', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'pvr4',
    documented: ['annuum'],
    chromosome: 10,
    cM: 80,
  },
  {
    id: 'me3',
    symbol: 'Me3',
    category: 'resistance',
    name: T('Nématodes à galles (Me3)', 'Root-knot nematodes (Me3)'),
    alleles: [
      { allele: 'Me3', id: 'Me3', name: T('Me3', 'Me3'), effect: T('Dominant : résistance aux nématodes à galles (Meloidogyne) des sols sableux et chauds.', 'Dominant: resistance to root-knot nematodes (Meloidogyne) of warm sandy soils.') },
      { allele: 'me3', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'me3',
    documented: ['annuum'],
    chromosome: 9,
    cM: 70,
  },
];

export const LOCUS_BY_ID: Record<PepperLocusId, LocusDef> = Object.fromEntries(PEPPER_LOCI.map((l) => [l.id, l])) as Record<PepperLocusId, LocusDef>;
export const LOCUS_IDS: PepperLocusId[] = PEPPER_LOCI.map((l) => l.id);

/** Variante → [locus, allèle]. */
export const VARIANT_ALLELE: Record<VariantId, [PepperLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [PepperLocusId, string]>;
  for (const l of PEPPER_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
  return out;
})();

export const VARIANT_IDS = Object.keys(VARIANT_ALLELE) as VariantId[];

export function variantInfo(id: VariantId): { label: string; locus: LocusDef; name: Txt; effect: Txt } {
  const [lid, allele] = VARIANT_ALLELE[id];
  const locus = LOCUS_BY_ID[lid];
  const a = locus.alleles.find((x) => x.allele === allele)!;
  return { label: allele, locus, name: a.name ?? locus.name, effect: a.effect ?? locus.name };
}

/** Le locus concerne-t-il cette espèce (documenté ou hypothétique) ? */
export function locusRelevant(l: LocusDef, sp: SpeciesId): boolean {
  return l.documented.includes(sp) || (l.hypothetical ?? []).includes(sp);
}

export function locusHypothetical(l: LocusDef, sp: SpeciesId): boolean {
  return !l.documented.includes(sp) && (l.hypothetical ?? []).includes(sp);
}
