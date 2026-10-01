/**
 * Espèces et loci mendéliens de la carotte (genre Daucus).
 *
 * LA COULEUR DE LA RACINE, une cascade d’épistasies :
 *  - Y (DCAR_032551, Iorizzo et al. 2016) : l’allèle dominant Y garde la
 *    racine BLANCHE (carotte sauvage) ; y/y laisse les caroténoïdes
 *    s’accumuler ;
 *  - Y2 (Ellison et al. 2017) : sur fond y/y, Y2 donne une racine JAUNE
 *    (lutéine) ; y2/y2 donne l’ORANGE (α- et β-carotène) ;
 *  - l (simplifié) : sur fond orange, l/l bloque la cyclisation du lycopène
 *    → racine ROUGE (carottes Kintoki, Atomic Red) ;
 *  - P1 (DcMYB7, Bannoud et al. 2019) : anthocyanes, racine VIOLETTE en
 *    surface (au-dessus de la couleur du cœur) ; Px : violet jusqu’au cœur.
 *
 * STÉRILITÉ MÂLE CYTOPLASMIQUE, base de presque tous les hybrides F1 :
 *  - « pétaloïde » (cytoplasme Sp, Welch & Grimball 1947, découverte dans
 *    une carotte sauvage de l’Ithaca) : les étamines deviennent des pétales ;
 *  - « brown anther » (cytoplasme Ba, Welch & Grimball 1947 ; Banga 1964) :
 *    les anthères brunissent et avortent.
 * Restaurateurs simplifiés ici en deux gènes dominants (Rfp, Rfb).
 *
 * Vrn1 (dominant) : carotte ANNUELLE, sans besoin de froid pour fleurir
 * (carottes sauvages et orientales) ; les carottes occidentales sont
 * bisannuelles (vrn1/vrn1) et doivent passer l’hiver avant de fleurir.
 */

export type SpeciesId = 'sativus' | 'carota' | 'gummifer' | 'capillifolius' | 'pusillus';

export const SPECIES: SpeciesId[] = ['sativus', 'carota', 'gummifer', 'capillifolius', 'pusillus'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt }> = {
  sativus: {
    latin: 'Daucus carota subsp. sativus',
    short: 'subsp. sativus',
    name: T('Carotte cultivée', 'Cultivated carrot'),
    examples: T('carottes orange, jaunes, blanches, rouges et violettes', 'orange, yellow, white, red and purple carrots'),
  },
  carota: {
    latin: 'Daucus carota subsp. carota',
    short: 'subsp. carota',
    name: T('Carotte sauvage', 'Wild carrot'),
    examples: T('« dentelle de la reine Anne », racine blanche et ligneuse, partout au bord des chemins', '“Queen Anne’s lace”, white woody root, along every roadside'),
  },
  gummifer: {
    latin: 'Daucus carota subsp. gummifer',
    short: 'subsp. gummifer',
    name: T('Carotte de mer', 'Sea carrot'),
    examples: T('carotte sauvage des falaises de l’Atlantique et de la Manche, feuilles charnues', 'wild carrot of Atlantic and Channel cliffs, fleshy leaves'),
  },
  capillifolius: {
    latin: 'Daucus capillifolius',
    short: 'D. capillifolius',
    name: T('Daucus capillifolius', 'Daucus capillifolius'),
    examples: T('espèce sauvage de Libye et de Tunisie à feuilles filiformes, 2n = 18, se croise avec la carotte', 'wild species of Libya and Tunisia with thread-like leaves, 2n = 18, crosses with carrot'),
  },
  pusillus: {
    latin: 'Daucus pusillus',
    short: 'D. pusillus',
    name: T('Daucus pusillus', 'Daucus pusillus'),
    examples: T('petite carotte sauvage d’Amérique, 2n = 22 : ne se croise pas avec la carotte', 'small American wild carrot, 2n = 22: does not cross with carrot'),
  },
};

export type DcLocusId = 'y' | 'y2' | 'l' | 'p1' | 'px' | 'vrn' | 'rfp' | 'rfb' | 'mj' | 'alt' | 'cf';

export type VariantId = 'Y' | 'y2' | 'l' | 'P1' | 'Px' | 'Vrn1' | 'Rfp' | 'Rfb' | 'Mj1' | 'Alt' | 'cf';

export type LocusCategory = 'color' | 'flower' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: DcLocusId;
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

const CAROTA: SpeciesId[] = ['sativus', 'carota', 'gummifer', 'capillifolius'];
const SAT: SpeciesId[] = ['sativus'];

export const DC_LOCI: LocusDef[] = [
  // --- Couleur de la racine ---------------------------------------------------------
  {
    id: 'y',
    symbol: 'Y',
    category: 'color',
    name: T('Racine blanche (Y)', 'White root (Y)'),
    alleles: [
      { allele: 'Y', id: 'Y', name: T('Racine blanche', 'White root'), effect: T('Dominant : bloque l’accumulation des caroténoïdes dans la racine, qui reste blanche comme celle de la carotte sauvage. Épistatique sur Y2 et l : seules les racines y/y sont jaunes, orange ou rouges.', 'Dominant: blocks carotenoid build-up in the root, which stays white like wild carrot’s. Epistatic over Y2 and l: only y/y roots are yellow, orange or red.') },
      { allele: 'y', name: T('Caroténoïdes accumulés', 'Carotenoids accumulate') },
    ],
    standard: 'y',
    documented: CAROTA,
    chromosome: 5,
    cM: 40,
  },
  {
    id: 'y2',
    symbol: 'y2',
    category: 'color',
    name: T('Jaune ou orange (Y2)', 'Yellow or orange (Y2)'),
    alleles: [
      { allele: 'Y2', name: T('Racine jaune', 'Yellow root') },
      { allele: 'y2', id: 'y2', name: T('Racine orange', 'Orange root'), effect: T('Récessif : sur fond y/y, la racine accumule α- et β-carotène et devient orange. C’est la carotte orange, apparue aux Pays-Bas au XVIIe siècle à partir de carottes jaunes.', 'Recessive: on a y/y background the root builds up α- and β-carotene and turns orange. The orange carrot, which appeared in the Netherlands in the 17th century from yellow carrots.') },
    ],
    standard: 'Y2',
    documented: CAROTA,
    chromosome: 7,
    cM: 50,
  },
  {
    id: 'l',
    symbol: 'l',
    category: 'color',
    name: T('Racine rouge, lycopène (l)', 'Red root, lycopene (l)'),
    alleles: [
      { allele: 'L', name: T('Lycopène transformé', 'Lycopene converted') },
      { allele: 'l', id: 'l', name: T('Racine rouge', 'Red root'), effect: T('Récessif : la cyclisation du lycopène est freinée, le pigment rouge de la tomate s’accumule ; sur fond orange (y/y, y2/y2), la racine devient rouge (Kintoki, Atomic Red).', 'Recessive: lycopene cyclisation is slowed, the tomato’s red pigment builds up; on an orange background (y/y, y2/y2), the root turns red (Kintoki, Atomic Red).') },
    ],
    standard: 'L',
    simplified: true,
    documented: SAT,
    cM: 0,
  },
  {
    id: 'p1',
    symbol: 'P1',
    category: 'color',
    name: T('Racine violette (P1, DcMYB7)', 'Purple root (P1, DcMYB7)'),
    alleles: [
      { allele: 'P1', id: 'P1', name: T('Racine violette', 'Purple root'), effect: T('Dominant : facteur MYB qui allume les anthocyanes dans la racine. Les premières carottes, en Afghanistan et en Asie centrale, étaient violettes.', 'Dominant: MYB factor switching on anthocyanins in the root. The first carrots, in Afghanistan and Central Asia, were purple.') },
      { allele: 'p1', name: T('Sans anthocyanes', 'No anthocyanins') },
    ],
    standard: 'p1',
    documented: SAT,
    chromosome: 3,
    cM: 30,
  },
  {
    id: 'px',
    symbol: 'Px',
    category: 'color',
    name: T('Violet jusqu’au cœur (Px)', 'Purple to the core (Px)'),
    alleles: [
      { allele: 'Px', id: 'Px', name: T('Cœur violet', 'Purple core'), effect: T('Dominant, s’exprime avec P1 : les anthocyanes gagnent aussi le xylème, le cœur ; la carotte est violette d’un bout à l’autre (Black Nebula). Sans Px, seule l’écorce est violette et le cœur garde sa couleur (Purple Haze).', 'Dominant, expressed with P1: anthocyanins also fill the xylem, the core; the carrot is purple through and through (Black Nebula). Without Px only the outer layer is purple and the core keeps its colour (Purple Haze).') },
      { allele: 'px', name: T('Cœur non pigmenté', 'Unpigmented core') },
    ],
    standard: 'px',
    simplified: true,
    documented: SAT,
    chromosome: 3,
    cM: 40,
  },
  // --- Fleurs et reproduction ---------------------------------------------------------
  {
    id: 'vrn',
    symbol: 'Vrn1',
    category: 'flower',
    name: T('Carotte annuelle (Vrn1)', 'Annual carrot (Vrn1)'),
    alleles: [
      { allele: 'Vrn1', id: 'Vrn1', name: T('Annuelle', 'Annual'), effect: T('Dominant : la plante fleurit sans passer par le froid, dès la première année (carottes sauvages, carottes orientales d’Asie centrale). Au potager, elle « monte » et sa racine devient ligneuse.', 'Dominant: the plant flowers without going through cold, in its first year (wild carrots, eastern Central Asian carrots). In the vegetable garden it bolts and the root turns woody.') },
      { allele: 'vrn1', name: T('Bisannuelle', 'Biennial') },
    ],
    standard: 'vrn1',
    simplified: true,
    documented: CAROTA,
    chromosome: 2,
    cM: 60,
  },
  {
    id: 'rfp',
    symbol: 'Rfp',
    category: 'flower',
    name: T('Restaurateur pétaloïde (Rfp)', 'Petaloid restorer (Rfp)'),
    alleles: [
      { allele: 'Rfp', id: 'Rfp', name: T('Restaurateur', 'Restorer'), effect: T('Dominant (simplifié) : rend des étamines normales aux plantes à cytoplasme pétaloïde. Rare dans les variétés cultivées, ce qui rend ce cytoplasme si pratique pour les hybrides.', 'Dominant (simplified): restores normal stamens to petaloid-cytoplasm plants. Rare in cultivated varieties, which makes this cytoplasm so handy for hybrids.') },
      { allele: 'rfp', name: T('Non restaurateur', 'Non-restorer') },
    ],
    standard: 'rfp',
    simplified: true,
    documented: CAROTA,
    cM: 0,
  },
  {
    id: 'rfb',
    symbol: 'Rfb',
    category: 'flower',
    name: T('Restaurateur brown anther (Rfb)', 'Brown-anther restorer (Rfb)'),
    alleles: [
      { allele: 'Rfb', id: 'Rfb', name: T('Restaurateur', 'Restorer'), effect: T('Dominant (simplifié) : rend du pollen aux plantes à cytoplasme « brown anther ».', 'Dominant (simplified): restores pollen to “brown anther” cytoplasm plants.') },
      { allele: 'rfb', name: T('Non restaurateur', 'Non-restorer') },
    ],
    standard: 'rfb',
    simplified: true,
    documented: CAROTA,
    cM: 0,
  },
  // --- Résistances ------------------------------------------------------------------------
  {
    id: 'mj',
    symbol: 'Mj-1',
    category: 'resistance',
    name: T('Nématode à galles (Mj-1)', 'Root-knot nematode (Mj-1)'),
    alleles: [
      { allele: 'Mj1', id: 'Mj1', name: T('Mj-1', 'Mj-1'), effect: T('Dominant : résistance aux nématodes à galles (Meloidogyne javanica, M. incognita) trouvée dans la carotte brésilienne « Brasilia » (Simon et al. 2000) ; la racine ne se fourche pas.', 'Dominant: resistance to root-knot nematodes (Meloidogyne javanica, M. incognita) found in the Brazilian carrot “Brasilia” (Simon et al. 2000); the root does not fork.') },
      { allele: 'mj1', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'mj1',
    documented: SAT,
    chromosome: 8,
    cM: 40,
  },
  {
    id: 'alt',
    symbol: 'Alt',
    category: 'resistance',
    name: T('Alternariose (Alt)', 'Alternaria leaf blight (Alt)'),
    alleles: [
      { allele: 'Alt', id: 'Alt', name: T('Résistance à l’alternariose', 'Alternaria resistance'), effect: T('Résistance au brûlage des feuilles (Alternaria dauci). Elle est en réalité polygénique (plusieurs QTL) ; on la résume ici en un gène dominant.', 'Resistance to leaf blight (Alternaria dauci). It is actually polygenic (several QTL); summarised here as one dominant gene.') },
      { allele: 'alt', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'alt',
    simplified: true,
    documented: SAT,
    cM: 0,
  },
  {
    id: 'cf',
    symbol: 'cf',
    category: 'resistance',
    name: T('Mouche de la carotte (cf)', 'Carrot fly (cf)'),
    alleles: [
      { allele: 'Cf', name: T('Sensible', 'Susceptible') },
      { allele: 'cf', id: 'cf', name: T('Résistance partielle', 'Partial resistance'), effect: T('Résistance partielle à la mouche de la carotte (Psila rosae), liée à une faible teneur en acide chlorogénique (Flyaway, Resistafly). Polygénique en réalité ; résumée ici en un gène récessif.', 'Partial resistance to carrot fly (Psila rosae), linked to low chlorogenic acid (Flyaway, Resistafly). Actually polygenic; summarised here as one recessive gene.') },
    ],
    standard: 'Cf',
    simplified: true,
    documented: SAT,
    cM: 0,
  },
];

export const LOCUS_BY_ID: Record<DcLocusId, LocusDef> = Object.fromEntries(DC_LOCI.map((l) => [l.id, l])) as Record<DcLocusId, LocusDef>;
export const LOCUS_IDS: DcLocusId[] = DC_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [DcLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [DcLocusId, string]>;
  for (const l of DC_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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
