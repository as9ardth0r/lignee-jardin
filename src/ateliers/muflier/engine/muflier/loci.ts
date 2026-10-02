/**
 * Espèces et loci mendéliens du muflier (genre Antirrhinum, 2n = 16).
 *
 * Le muflier est un modèle de génétique depuis Erwin Baur (1910) : les
 * gènes de la couleur et de la forme de sa fleur sont parmi les mieux
 * connus des plantes à fleurs (John Innes Centre, Max-Planck de Cologne).
 *
 * COULEUR, deux voies de pigments :
 *  - anthocyanes (magenta) : NIVEA (chalcone synthase) et PALLIDA (DFR)
 *    sont indispensables (niv/niv : fleur blanche ; pal/pal : sans
 *    magenta) ; ROSEA1 (MYB) règle la quantité — DOMINANCE INCOMPLÈTE :
 *    Ros/Ros magenta, Ros/ros rose, ros/ros pâle (l’exemple des manuels :
 *    rouge × blanc donne une F1 rose) ; ELUTA réduit le magenta sur la
 *    face de la fleur (motif bicolore) ; VENOSA colore les nervures, visible
 *    seulement sur les fleurs pâles (Schwinn et al. 2006 ; Shang et al. 2011) ;
 *  - aurones (jaune) : SULFUREA cantonne le jaune au « palais » (la bosse
 *    de la lèvre inférieure) ; sulf/sulf fait jaunir toute la fleur, et
 *    jaune + magenta donnent les rouges et les orange (Bradley et al. 2017).
 * Les sous-espèces sauvages pseudomajus (magenta) et striatum (jaune)
 * forment une zone hybride célèbre dans les Pyrénées, où se croisent
 * ROSEA, ELUTA et SULFUREA (Whibley et al. 2006 ; Tavares et al. 2018).
 *
 * pallida-recurrens : allèle INSTABLE, interrompu par le transposon Tam3.
 * Quand Tam3 « saute » dans une cellule, le pigment revient : fleur
 * ivoire tachetée ou striée de magenta, davantage à 15 °C qu’à 25 °C
 * (Carpenter, Martin & Coen 1987).
 *
 * FORME : CYCLOIDEA et DICHOTOMA, deux gènes voisins nés d’une
 * duplication, donnent sa symétrie bilatérale à la fleur. cyc/cyc :
 * fleur à moitié « pélorique » ; cyc/cyc dich/dich : fleur PÉLORIQUE,
 * symétrique en étoile (Luo et al. 1996 ; 1999). Darwin cultivait des
 * mufliers péloriques : croisés avec des normaux, F1 normale, F2 avec
 * 88 normaux pour 37 péloriques (1868), près du 3 : 1 de Mendel.
 * Chez la linaire, Linné décrivit dès 1744 une forme pélorique : c’est
 * une ÉPIMUTATION de Lcyc (Cubas, Vincent & Coen 1999).
 *
 * AUTO-INCOMPATIBILITÉ GAMÉTOPHYTIQUE (S-RNases) : les espèces sauvages
 * rejettent le pollen qui porte un allèle S déjà présent chez la mère ;
 * le muflier cultivé est auto-compatible (allèle Sc). Xue et al. 1996.
 *
 * Rouille (Puccinia antirrhini) : des résistances dominantes ont été
 * sélectionnées dès les années 1930 ; résumées ici en un gène (Pa).
 * Positions sur les chromosomes : approchées.
 */

export type SpeciesId = 'majus' | 'pseudomajus' | 'striatum' | 'hispanicum' | 'molle' | 'linaria';

export const SPECIES: SpeciesId[] = ['majus', 'pseudomajus', 'striatum', 'hispanicum', 'molle', 'linaria'];

type Txt = { fr: string; en: string };
const T = (fr: string, en: string): Txt => ({ fr, en });

export const SPECIES_INFO: Record<SpeciesId, { latin: string; short: string; name: Txt; examples: Txt; genus: 'Antirrhinum' | 'Linaria' }> = {
  majus: {
    latin: 'Antirrhinum majus',
    short: 'A. majus',
    name: T('Muflier cultivé', 'Garden snapdragon'),
    examples: T('variétés de massif et à couper, auto-compatibles', 'bedding and cut-flower varieties, self-compatible'),
    genus: 'Antirrhinum',
  },
  pseudomajus: {
    latin: 'Antirrhinum majus subsp. pseudomajus',
    short: 'subsp. pseudomajus',
    name: T('Muflier sauvage magenta', 'Magenta wild snapdragon'),
    examples: T('rochers et murets des Pyrénées et du nord de l’Espagne', 'rocks and walls of the Pyrenees and northern Spain'),
    genus: 'Antirrhinum',
  },
  striatum: {
    latin: 'Antirrhinum majus subsp. striatum',
    short: 'subsp. striatum',
    name: T('Muflier sauvage jaune', 'Yellow wild snapdragon'),
    examples: T('fleurs jaunes à nervures rouges, Pyrénées ; zone hybride avec pseudomajus', 'yellow flowers with red veins, Pyrenees; hybrid zone with pseudomajus'),
    genus: 'Antirrhinum',
  },
  hispanicum: {
    latin: 'Antirrhinum hispanicum',
    short: 'A. hispanicum',
    name: T('Muflier d’Espagne', 'Spanish snapdragon'),
    examples: T('petit muflier rose pâle des falaises calcaires du sud de l’Espagne', 'small pale-pink snapdragon of southern Spanish limestone cliffs'),
    genus: 'Antirrhinum',
  },
  molle: {
    latin: 'Antirrhinum molle',
    short: 'A. molle',
    name: T('Muflier mou', 'Soft snapdragon'),
    examples: T('muflier rampant et velu des Pyrénées, fleurs blanches à palais jaune', 'trailing hairy snapdragon of the Pyrenees, white flowers with a yellow palate'),
    genus: 'Antirrhinum',
  },
  linaria: {
    latin: 'Linaria vulgaris',
    short: 'Linaria',
    name: T('Linaire commune', 'Common toadflax'),
    examples: T('cousine jaune du muflier, au bord des chemins ; autre genre : ne se croise pas avec lui', 'yellow cousin of the snapdragon, on roadsides; another genus: does not cross with it'),
    genus: 'Linaria',
  },
};

export type AmLocusId = 'niv' | 'pal' | 'ros' | 'el' | 'ven' | 'sulf' | 'cyc' | 'dich' | 's' | 'pa';

export type VariantId = 'niv' | 'pal' | 'palrec' | 'ros' | 'El' | 'Ven' | 'sulf' | 'cyc' | 'dich' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'Pa';

export type LocusCategory = 'color' | 'shape' | 'flower' | 'resistance';

export interface AlleleDef {
  allele: string;
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: AmLocusId;
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  standard: string;
  incomplete?: boolean;
  /** Locus sans effet visible (allèles S) : exclu de la prédiction de Mendel. */
  silent?: boolean;
  documented: SpeciesId[];
  hypothetical?: SpeciesId[];
  simplified?: boolean;
  chromosome?: number;
  cM: number;
  note?: Txt;
}

const ANT: SpeciesId[] = ['majus', 'pseudomajus', 'striatum', 'hispanicum', 'molle'];
const MAJ: SpeciesId[] = ['majus', 'pseudomajus', 'striatum'];

const S_ALLELES: AlleleDef[] = [
  { allele: 'S1', id: 'S1', name: T('Allèle S1', 'S1 allele'), effect: T('Allèle d’auto-incompatibilité : le pistil rejette le pollen porteur de S1.', 'Self-incompatibility allele: the pistil rejects pollen carrying S1.') },
  { allele: 'S2', id: 'S2', name: T('Allèle S2', 'S2 allele'), effect: T('Allèle d’auto-incompatibilité : le pistil rejette le pollen porteur de S2.', 'Self-incompatibility allele: the pistil rejects pollen carrying S2.') },
  { allele: 'S3', id: 'S3', name: T('Allèle S3', 'S3 allele'), effect: T('Allèle d’auto-incompatibilité : le pistil rejette le pollen porteur de S3.', 'Self-incompatibility allele: the pistil rejects pollen carrying S3.') },
  { allele: 'S4', id: 'S4', name: T('Allèle S4', 'S4 allele'), effect: T('Allèle d’auto-incompatibilité : le pistil rejette le pollen porteur de S4.', 'Self-incompatibility allele: the pistil rejects pollen carrying S4.') },
  { allele: 'S5', id: 'S5', name: T('Allèle S5', 'S5 allele'), effect: T('Allèle d’auto-incompatibilité : le pistil rejette le pollen porteur de S5.', 'Self-incompatibility allele: the pistil rejects pollen carrying S5.') },
  { allele: 'Sc', name: T('Auto-compatible (Sc)', 'Self-compatible (Sc)'), effect: T('Allèle non fonctionnel du muflier cultivé : aucun rejet.', 'Non-functional allele of the garden snapdragon: no rejection.') },
];

export const AM_LOCI: LocusDef[] = [
  // --- Couleur ------------------------------------------------------------------------
  {
    id: 'niv',
    symbol: 'niv',
    category: 'color',
    name: T('Nivea (chalcone synthase)', 'Nivea (chalcone synthase)'),
    alleles: [
      { allele: 'Niv', name: T('Pigments normaux', 'Normal pigments') },
      { allele: 'niv', id: 'niv', name: T('Fleur blanche (nivea)', 'White flower (nivea)'), effect: T('Récessif et épistatique : sans chalcone synthase, ni magenta ni jaune ; fleur blanc pur quels que soient les autres gènes.', 'Recessive and epistatic: without chalcone synthase, neither magenta nor yellow; pure white flower whatever the other genes.') },
    ],
    standard: 'Niv',
    documented: ANT,
    cM: 0,
  },
  {
    id: 'pal',
    symbol: 'pal',
    category: 'color',
    name: T('Pallida (DFR)', 'Pallida (DFR)'),
    alleles: [
      { allele: 'Pal', name: T('Magenta possible', 'Magenta possible') },
      { allele: 'pal-rec', id: 'palrec', name: T('Tacheté (pallida-recurrens)', 'Flecked (pallida-recurrens)'), effect: T('Allèle instable : le transposon Tam3 coupe le gène ; quand il en ressort dans une cellule, le magenta revient. Fleur ivoire tachetée ou striée de magenta, plus tachetée au frais (15 °C) qu’au chaud.', 'Unstable allele: transposon Tam3 interrupts the gene; when it jumps out in a cell, magenta returns. Ivory flower flecked or striped with magenta, more flecked when cool (15 °C) than warm.') },
      { allele: 'pal', id: 'pal', name: T('Sans magenta (pallida)', 'No magenta (pallida)'), effect: T('Récessif : sans DFR, pas d’anthocyanes ; la fleur reste ivoire (ou jaune si sulf/sulf).', 'Recessive: without DFR, no anthocyanins; the flower stays ivory (or yellow if sulf/sulf).') },
    ],
    standard: 'Pal',
    documented: ANT,
    cM: 0,
  },
  {
    id: 'ros',
    symbol: 'Ros',
    category: 'color',
    name: T('Rosea (intensité du magenta)', 'Rosea (magenta intensity)'),
    alleles: [
      { allele: 'Ros', name: T('Magenta (Rosea)', 'Magenta (Rosea)') },
      { allele: 'ros', id: 'ros', name: T('Pâle (rosea)', 'Pale (rosea)'), effect: T('Dominance incomplète : Ros/Ros magenta soutenu, Ros/ros rose, ros/ros presque sans magenta (ivoire rosé). Croisez un muflier magenta et un pâle : toute la F1 est rose ; en F2, 1 magenta : 2 roses : 1 pâle.', 'Incomplete dominance: Ros/Ros deep magenta, Ros/ros pink, ros/ros almost no magenta (blush ivory). Cross a magenta and a pale snapdragon: the whole F1 is pink; in the F2, 1 magenta : 2 pink : 1 pale.') },
    ],
    standard: 'Ros',
    incomplete: true,
    documented: ANT,
    chromosome: 6,
    cM: 40,
  },
  {
    id: 'el',
    symbol: 'El',
    category: 'color',
    name: T('Eluta (face claire)', 'Eluta (pale face)'),
    alleles: [
      { allele: 'El', id: 'El', name: T('Face claire (Eluta)', 'Pale face (Eluta)'), effect: T('Semi-dominant : efface le magenta de la face de la fleur, qui devient bicolore (lèvres claires, tube coloré) ; plus marqué chez El/El. Très lié à Rosea (quelques centimorgans).', 'Semi-dominant: erases magenta from the flower face, which turns bicoloured (pale lips, coloured tube); stronger in El/El. Tightly linked to Rosea (a few centimorgans).') },
      { allele: 'el', name: T('Couleur uniforme', 'Uniform colour') },
    ],
    standard: 'el',
    incomplete: true,
    documented: MAJ,
    chromosome: 6,
    cM: 43,
  },
  {
    id: 'ven',
    symbol: 'Ven',
    category: 'color',
    name: T('Venosa (nervures)', 'Venosa (veins)'),
    alleles: [
      { allele: 'Ven', id: 'Ven', name: T('Nervures colorées (Venosa)', 'Coloured veins (Venosa)'), effect: T('Dominant : du magenta le long des nervures des pétales, visible surtout sur les fleurs pâles ou jaunes (comme chez le muflier sauvage striatum).', 'Dominant: magenta along the petal veins, visible mostly on pale or yellow flowers (as in the wild striatum snapdragon).') },
      { allele: 'ven', name: T('Sans nervures', 'No veins') },
    ],
    standard: 'ven',
    documented: MAJ,
    cM: 0,
  },
  {
    id: 'sulf',
    symbol: 'sulf',
    category: 'color',
    name: T('Sulfurea (jaune)', 'Sulfurea (yellow)'),
    alleles: [
      { allele: 'Sulf', name: T('Jaune limité au palais', 'Yellow only on the palate') },
      { allele: 'sulf', id: 'sulf', name: T('Fleur jaune (sulfurea)', 'Yellow flower (sulfurea)'), effect: T('Récessif : le jaune (aurones) envahit toute la fleur. Sur une fleur sans magenta : jaune ; avec du magenta : orange (Ros/ros) ou rouge (Ros/Ros).', 'Recessive: yellow (aurones) spreads over the whole flower. Without magenta: yellow; with magenta: orange (Ros/ros) or red (Ros/Ros).') },
    ],
    standard: 'Sulf',
    documented: MAJ,
    hypothetical: ['hispanicum', 'molle'],
    cM: 0,
  },

  // --- Forme --------------------------------------------------------------------------
  {
    id: 'cyc',
    symbol: 'cyc',
    category: 'shape',
    name: T('Cycloidea (symétrie)', 'Cycloidea (symmetry)'),
    alleles: [
      { allele: 'Cyc', name: T('Fleur à deux lèvres', 'Two-lipped flower') },
      { allele: 'cyc', id: 'cyc', name: T('Semi-pélorique (cycloidea)', 'Semi-peloric (cycloidea)'), effect: T('Récessif : la fleur perd une partie de sa symétrie bilatérale ; avec dich/dich, elle devient entièrement pélorique (en étoile). Cycloidea et Dichotoma sont voisins sur le chromosome : ils se transmettent presque toujours ensemble.', 'Recessive: the flower loses part of its bilateral symmetry; with dich/dich it becomes fully peloric (star-shaped). Cycloidea and Dichotoma are neighbours on the chromosome: they are almost always inherited together.') },
    ],
    standard: 'Cyc',
    documented: ANT,
    chromosome: 4,
    cM: 30,
  },
  {
    id: 'dich',
    symbol: 'dich',
    category: 'shape',
    name: T('Dichotoma (symétrie)', 'Dichotoma (symmetry)'),
    alleles: [
      { allele: 'Dich', name: T('Lèvre supérieure normale', 'Normal upper lip') },
      { allele: 'dich', id: 'dich', name: T('Dichotoma', 'Dichotoma'), effect: T('Récessif, effet léger seul (lèvre supérieure plus symétrique) ; avec cyc/cyc, fleur pélorique.', 'Recessive, slight effect alone (more symmetric upper lip); with cyc/cyc, peloric flower.') },
    ],
    standard: 'Dich',
    documented: ANT,
    chromosome: 4,
    cM: 30.5,
  },

  // --- Reproduction ---------------------------------------------------------------------
  {
    id: 's',
    symbol: 'S',
    category: 'flower',
    name: T('Auto-incompatibilité (S)', 'Self-incompatibility (S)'),
    alleles: S_ALLELES,
    standard: 'Sc',
    silent: true,
    documented: ANT,
    cM: 0,
  },

  // --- Résistance -------------------------------------------------------------------------
  {
    id: 'pa',
    symbol: 'Pa',
    category: 'resistance',
    name: T('Rouille du muflier (Pa)', 'Snapdragon rust (Pa)'),
    alleles: [
      { allele: 'Pa', id: 'Pa', name: T('Résistant à la rouille', 'Rust resistant'), effect: T('Résistance dominante à la rouille (Puccinia antirrhini), sélectionnée dès les années 1930 ; de nouvelles races de rouille l’ont parfois contournée. Résumée ici en un gène.', 'Dominant resistance to rust (Puccinia antirrhini), bred from the 1930s; new rust races have sometimes overcome it. Summarised here as one gene.') },
      { allele: 'pa', name: T('Sensible', 'Susceptible') },
    ],
    standard: 'pa',
    simplified: true,
    documented: ['majus'],
    hypothetical: ['pseudomajus', 'striatum'],
    cM: 0,
  },
];

export const LOCUS_BY_ID: Record<AmLocusId, LocusDef> = Object.fromEntries(AM_LOCI.map((l) => [l.id, l])) as Record<AmLocusId, LocusDef>;
export const LOCUS_IDS: AmLocusId[] = AM_LOCI.map((l) => l.id);

export const VARIANT_ALLELE: Record<VariantId, [AmLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [AmLocusId, string]>;
  for (const l of AM_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
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
