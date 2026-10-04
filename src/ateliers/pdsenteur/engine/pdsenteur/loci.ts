/**
 * Espèces et loci mendéliens du pois de senteur (Lathyrus odoratus,
 * 2n = 14).
 *
 * Le pois de senteur est la plante où William Bateson, Edith Saunders et
 * Reginald Punnett ont découvert, entre 1904 et 1908, deux grandes
 * exceptions aux lois de Mendel :
 *  - l’INTERACTION DES GÈNES : deux variétés blanches (l’une c/c, l’autre
 *    r/r) donnent une F1 entièrement POURPRE ; en F2, 9 colorées pour 7
 *    blanches. Il faut à la fois C et R pour fabriquer les anthocyanes ;
 *  - la LIAISON GÉNÉTIQUE : la couleur de la fleur (B pourpre / b rouge)
 *    et la forme du pollen (L long / l rond) ne se répartissent pas
 *    indépendamment ; la F2 s’écarte fortement de 9 : 3 : 3 : 1 parce
 *    que les deux gènes sont voisins sur le même chromosome (environ
 *    12 % de recombinaison). C’est l’observation qui a mené Morgan à la
 *    théorie chromosomique.
 *
 * Autres caractères classiques : étendard en capuchon (« hooded »,
 * récessif), port nain « Cupid » (récessif), forme ondulée Spencer (née en
 * 1901 dans le jardin du comte Spencer).
 * Modèle SIMPLIFIÉ pour l’intensité (trois niveaux), le motif bicolore et
 * le jaune de L. belinensis : hypothèses pédagogiques, signalées comme
 * telles. Positions sur le chromosome : approchées.
 * Le pois de senteur est AUTOGAME : la fleur se féconde dans le bouton,
 * avant même de s’ouvrir. Allèle S conservé pour compatibilité du moteur
 * (aucune auto-incompatibilité dans le genre ici).
 */

export type SpeciesId = 'odoratus' | 'belinensis' | 'chloranthus' | 'tingitanus' | 'latifolius' | 'sativus';

export const SPECIES: SpeciesId[] = ['odoratus', 'belinensis', 'chloranthus', 'tingitanus', 'latifolius', 'sativus'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt; genus: 'Lathyrus' }> = {
  odoratus: {
    latin: 'Lathyrus odoratus',
    short: 'L. odoratus',
    name: T('Pois de senteur', 'Sweet pea'),
    examples: T('variétés anciennes, Spencer et naines ; sauvage en Sicile', 'heirloom, Spencer and dwarf varieties; wild in Sicily'),
    genus: 'Lathyrus',
  },
  belinensis: {
    latin: 'Lathyrus belinensis',
    short: 'L. belinensis',
    name: T('Gesse de Belin', 'Belin vetchling'),
    examples: T('découverte en 1987 en Turquie : fleurs rouge orangé à ailes jaunes ; se croise avec le pois de senteur', 'found in 1987 in Turkey: orange-red flowers with yellow wings; crosses with sweet pea'),
    genus: 'Lathyrus',
  },
  chloranthus: {
    latin: 'Lathyrus chloranthus',
    short: 'L. chloranthus',
    name: T('Gesse à fleurs vertes', 'Green-flowered vetchling'),
    examples: T('fleurs jaune verdâtre, Caucase ; croisements difficiles', 'greenish-yellow flowers, Caucasus; difficult crosses'),
    genus: 'Lathyrus',
  },
  tingitanus: {
    latin: 'Lathyrus tingitanus',
    short: 'L. tingitanus',
    name: T('Gesse de Tanger', 'Tangier pea'),
    examples: T('magenta, Afrique du Nord ; pas d’hybride fertile connu avec le pois de senteur', 'magenta, North Africa; no known fertile hybrid with sweet pea'),
    genus: 'Lathyrus',
  },
  latifolius: {
    latin: 'Lathyrus latifolius',
    short: 'L. latifolius',
    name: T('Pois vivace', 'Everlasting pea'),
    examples: T('grimpante vivace sans parfum ; ne se croise pas avec le pois de senteur', 'unscented perennial climber; does not cross with sweet pea'),
    genus: 'Lathyrus',
  },
  sativus: {
    latin: 'Lathyrus sativus',
    short: 'L. sativus',
    name: T('Gesse commune', 'Grass pea'),
    examples: T('légumineuse alimentaire (graines toxiques en excès : lathyrisme) ; aucun croisement', 'a pulse crop (seeds toxic in excess: lathyrism); no cross'),
    genus: 'Lathyrus',
  },
};

export type LoLocusId = 'c' | 'r' | 'b' | 'l' | 'd' | 'bi' | 'yel' | 'h' | 'wav' | 'cu' | 's';

export type VariantId = 'c' | 'r' | 'b' | 'l' | 'dm' | 'd' | 'Bi' | 'Yel' | 'h' | 'wav' | 'cu' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5';

export type LocusCategory = 'color' | 'shape' | 'flower' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: LoLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  /** Locus sans effet visible : exclu de la prédiction de Mendel. */
  silent?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  simplified?: boolean;
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const ODO: SpeciesId[] = ['odoratus'];
const ALL: SpeciesId[] = ['odoratus', 'belinensis', 'chloranthus', 'tingitanus', 'latifolius', 'sativus'];

const S_ALLELES: AlleleDef[] = [
  { allele: 'S1', id: 'S1' },
  { allele: 'S2', id: 'S2' },
  { allele: 'S3', id: 'S3' },
  { allele: 'S4', id: 'S4' },
  { allele: 'S5', id: 'S5' },
  { allele: 'Sc', name: T('Autogame', 'Self-pollinating'), effect: T('Pas d’auto-incompatibilité chez le pois de senteur.', 'No self-incompatibility in sweet pea.') },
];

export const LO_LOCI: LocusDef[] = [
  // --- Couleur ----------------------------------------------------------------------------
  {
    id: 'c',
    symbol: 'c',
    category: 'color',
    name: T('C (couleur, 1er facteur)', 'C (colour, 1st factor)'),
    alleles: [
      { allele: 'C', name: T('Couleur possible', 'Colour possible') },
      { allele: 'c', id: 'c', name: T('Blanc c', 'White c'), effect: T('Récessif : sans C, pas de pigment, fleur blanche. Croisé avec un blanc r/r, il donne une F1 colorée (complémentation).', 'Recessive: without C, no pigment, white flower. Crossed with an r/r white, it gives a coloured F1 (complementation).') },
    ],
    standard: 'C',
    documented: ODO,
    hypothetical: ['belinensis', 'chloranthus', 'tingitanus'],
    cM: 0,
  },
  {
    id: 'r',
    symbol: 'r',
    category: 'color',
    name: T('R (couleur, 2e facteur)', 'R (colour, 2nd factor)'),
    alleles: [
      { allele: 'R', name: T('Couleur possible', 'Colour possible') },
      { allele: 'r', id: 'r', name: T('Blanc r', 'White r'), effect: T('Récessif : sans R, fleur blanche. Il faut C ET R pour colorer la fleur : blanc c × blanc r → F1 pourpre, F2 9 colorées : 7 blanches (Bateson, Saunders et Punnett, 1905).', 'Recessive: without R, white flower. Both C AND R are needed to colour the flower: white c × white r → purple F1, F2 9 coloured : 7 white (Bateson, Saunders and Punnett, 1905).') },
    ],
    standard: 'R',
    documented: ODO,
    hypothetical: ['belinensis', 'chloranthus', 'tingitanus'],
    cM: 0,
  },
  {
    id: 'b',
    symbol: 'B',
    category: 'color',
    name: T('B (pourpre / rouge)', 'B (purple / red)'),
    alleles: [
      { allele: 'B', name: T('Pourpre (bleuté)', 'Purple (bluish)') },
      { allele: 'b', id: 'b', name: T('Rouge (b)', 'Red (b)'), effect: T('Récessif : la fleur colorée est rouge ou rose au lieu de pourpre ou bleue. Gène voisin de L (forme du pollen) : la liaison découverte par Bateson et Punnett.', 'Recessive: the coloured flower is red or pink instead of purple or blue. Neighbour of L (pollen shape): the linkage found by Bateson and Punnett.') },
    ],
    standard: 'B',
    documented: ODO,
    chromosome: 1,
    cM: 10,
  },
  {
    id: 'l',
    symbol: 'L',
    category: 'flower',
    name: T('L (forme du pollen)', 'L (pollen shape)'),
    alleles: [
      { allele: 'L', name: T('Pollen long', 'Long pollen') },
      { allele: 'l', id: 'l', name: T('Pollen rond (l)', 'Round pollen (l)'), effect: T('Récessif : grains de pollen ronds au lieu d’allongés (visible au microscope ou à la loupe ×20). Lié à B : environ 12 % de recombinants.', 'Recessive: round pollen grains instead of elongated (visible under a microscope or ×20 lens). Linked to B: about 12% recombinants.') },
    ],
    standard: 'L',
    documented: ODO,
    chromosome: 1,
    cM: 21.5,
  },
  {
    id: 'd',
    symbol: 'D',
    category: 'color',
    name: T('Intensité (modèle simplifié)', 'Intensity (simplified model)'),
    alleles: [
      { allele: 'D', name: T('Foncé', 'Dark') },
      { allele: 'Dm', id: 'dm', name: T('Moyen (Dm)', 'Medium (Dm)'), effect: T('Série d’allèles (modèle pédagogique) : D foncé (bordeaux ou cramoisi) > Dm moyen (pourpre ou rose) > d clair (lavande ou rose pâle).', 'Allele series (teaching model): D dark (maroon or crimson) > Dm medium (purple or pink) > d light (lavender or blush).') },
      { allele: 'd', id: 'd', name: T('Clair (d)', 'Light (d)'), effect: T('Récessif (modèle pédagogique) : couleur claire, lavande ou rose pâle.', 'Recessive (teaching model): light colour, lavender or blush.') },
    ],
    standard: 'D',
    simplified: true,
    documented: [],
    hypothetical: ODO,
    cM: 0,
  },
  {
    id: 'bi',
    symbol: 'Bi',
    category: 'color',
    name: T('Bicolore (modèle simplifié)', 'Bicolour (simplified model)'),
    alleles: [
      { allele: 'Bi', id: 'Bi', name: T('Ailes plus claires (bicolore)', 'Lighter wings (bicolour)'), effect: T('Dominant (hypothèse) : les ailes sont plus claires que l’étendard, comme chez Cupani (bordeaux et violet) ou Painted Lady (rose et blanc).', 'Dominant (assumed): wings lighter than the standard, as in Cupani (maroon and violet) or Painted Lady (pink and white).') },
      { allele: 'bi', name: T('Unicolore', 'Self-coloured') },
    ],
    standard: 'bi',
    simplified: true,
    documented: [],
    hypothetical: ODO,
    cM: 0,
  },
  {
    id: 'yel',
    symbol: 'Yel',
    category: 'color',
    name: T('Jaune de L. belinensis', 'Yellow from L. belinensis'),
    alleles: [
      { allele: 'Yel', id: 'Yel', name: T('Fond jaune (belinensis)', 'Yellow ground (belinensis)'), effect: T('Hypothèse : le pigment jaune de L. belinensis, absent du pois de senteur ; avec du rouge il donne de l’orangé. Le « pois de senteur jaune » reste un rêve d’obtenteur.', 'Assumption: the yellow pigment of L. belinensis, absent from sweet pea; with red it gives orange. The “yellow sweet pea” is still a breeder’s dream.') },
      { allele: 'yel', name: T('Sans jaune', 'No yellow') },
    ],
    standard: 'yel',
    simplified: true,
    documented: ['belinensis'],
    hypothetical: ['chloranthus', 'odoratus'],
    cM: 0,
  },

  // --- Forme ----------------------------------------------------------------------------------
  {
    id: 'h',
    symbol: 'h',
    category: 'shape',
    name: T('Étendard en capuchon', 'Hooded standard'),
    alleles: [
      { allele: 'H', name: T('Étendard dressé', 'Erect standard') },
      { allele: 'h', id: 'h', name: T('En capuchon (hooded)', 'Hooded'), effect: T('Récessif : l’étendard se replie en capuchon au lieu de s’ouvrir (Bateson et Punnett).', 'Recessive: the standard folds into a hood instead of opening (Bateson and Punnett).') },
    ],
    standard: 'H',
    documented: ODO,
    cM: 0,
  },
  {
    id: 'wav',
    symbol: 'wav',
    category: 'shape',
    name: T('Forme Spencer (ondulée)', 'Spencer (waved) form'),
    alleles: [
      { allele: 'Wav', name: T('Pétales lisses (grandiflora)', 'Plain petals (grandiflora)') },
      { allele: 'wav', id: 'wav', name: T('Ondulée Spencer', 'Spencer waved'), effect: T('Récessif (simplifié) : grands pétales ondulés, apparus en 1901 chez Silas Cole, jardinier du comte Spencer (« Countess Spencer »). Moins parfumée en moyenne que les anciennes.', 'Recessive (simplified): large waved petals, appeared in 1901 with Silas Cole, Earl Spencer’s gardener (“Countess Spencer”). Less scented on average than the old types.') },
    ],
    standard: 'Wav',
    simplified: true,
    documented: ODO,
    cM: 0,
  },
  {
    id: 'cu',
    symbol: 'cu',
    category: 'shape',
    name: T('Port nain Cupid', 'Cupid dwarf habit'),
    alleles: [
      { allele: 'Cu', name: T('Grimpant', 'Climbing') },
      { allele: 'cu', id: 'cu', name: T('Nain Cupid', 'Cupid dwarf'), effect: T('Récessif : plante naine et rampante (20-30 cm), sans tuteur, pour bordures et suspensions.', 'Recessive: dwarf trailing plant (20–30 cm), no support, for edging and baskets.') },
    ],
    standard: 'Cu',
    documented: ODO,
    cM: 0,
  },

  // --- Reproduction (compatibilité du moteur) ----------------------------------------------------
  {
    id: 's',
    symbol: 'S',
    category: 'flower',
    name: T('Auto-incompatibilité (absente)', 'Self-incompatibility (absent)'),
    alleles: S_ALLELES,
    standard: 'Sc',
    silent: true,
    documented: ALL,
    cM: 0,
  },
];

export const LOCUS_BY_ID: Record<LoLocusId, LocusDef> = Object.fromEntries(LO_LOCI.map((l) => [l.id, l])) as Record<LoLocusId, LocusDef>;
export const LOCUS_IDS: LoLocusId[] = LO_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [LoLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [LoLocusId, string]>;
  for (const l of LO_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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

/** Allèles S fonctionnels (Sc ne rejette rien). */
export function functionalS(pair: readonly string[]): string[] {
  return pair.filter((x) => x !== 'Sc');
}
