/**
 * Bibliothèque de mufliers : variétés à couper et de massif, variétés
 * anciennes, curiosités, lignées de laboratoire et mufliers sauvages.
 *
 * Sources : catalogues de semenciers (Vilmorin, Graines Baumaux,
 * Thompson & Morgan, Chiltern Seeds, Johnny’s, PanAmerican Seed, Sakata),
 * collections de mutants du John Innes Centre et du Max-Planck de Cologne
 * (Stubbe 1966 ; Schwarz-Sommer et al. 2003), Darwin 1868.
 *
 * Valeurs chiffrées = ordres de grandeur (hauteur, fleurs par épi, jours
 * du semis à la floraison, parfum de 0 à 10). Les génotypes de couleur
 * sont DÉDUITS de la couleur des fleurs : aucune analyse publiée ne les
 * donne variété par variété. Les variétés de population sont
 * hétérozygotes pour les caractères chiffrés ; `inbred` = lignée.
 */

import type { QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type AmKind = 'cut' | 'bedding' | 'dwarf' | 'heirloom' | 'novelty' | 'resistant' | 'lab' | 'wild';
export const AM_KINDS: AmKind[] = ['cut', 'bedding', 'dwarf', 'heirloom', 'novelty', 'resistant', 'lab', 'wild'];

export interface AmVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  variants: VariantId[];
  het?: VariantId[];
  /** Allèles S (mufliers sauvages auto-incompatibles). */
  sAlleles?: [string, string];
  /** Hauteur en fleur (cm). */
  heightCm: number;
  /** Fleurs sur l’épi principal. */
  florets: number;
  /** Jours du semis à la floraison. */
  days: number;
  /** Parfum (0 à 10). */
  scent: number;
  kinds: AmKind[];
  hybrid?: boolean;
  inbred?: boolean;
  /** Génotype de couleur supposé (non publié). */
  hypothesis?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<AmVariety, 'hybrid' | 'origin' | 'het' | 'inbred' | 'fertility' | 'sAlleles' | 'hypothesis' | 'hybridWith'>>;

function v(id: string, name: string, species: SpeciesId, variants: VariantId[], heightCm: number, florets: number, days: number, scent: number, kinds: AmKind[], fr: string, en: string, opt: Opt = {}): AmVariety {
  return { id, name, species, variants, heightCm, florets, days, scent, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

const F1 = { hybrid: true };
const RED: VariantId[] = ['sulf'];
const YELLOW: VariantId[] = ['sulf', 'pal'];
const IVORY: VariantId[] = ['pal'];

export const AM_VARIETIES: AmVariety[] = [
  // --- À couper (grands) ------------------------------------------------------------------
  v('rocket-red', 'Rocket Red F1', 'majus', RED, 90, 35, 110, 2, ['cut'], 'Grand muflier à couper, rouge vif : jaune (sulf) + magenta soutenu (Ros/Ros). Supporte la chaleur.', 'Tall cut snapdragon, bright red: yellow (sulf) + deep magenta (Ros/Ros). Heat tolerant.', { ...F1, origin: 'États-Unis' }),
  v('rocket-white', 'Rocket White F1', 'majus', IVORY, 90, 35, 110, 3, ['cut'], 'Blanc ivoire à palais jaune : sans magenta (pal/pal).', 'Ivory white with a yellow palate: no magenta (pal/pal).', { ...F1, origin: 'États-Unis' }),
  v('rocket-yellow', 'Rocket Yellow F1', 'majus', YELLOW, 90, 34, 110, 2, ['cut'], 'Jaune citron : jaune partout (sulf/sulf) et pas de magenta (pal/pal).', 'Lemon yellow: yellow everywhere (sulf/sulf) and no magenta (pal/pal).', { ...F1, origin: 'États-Unis' }),
  v('rocket-rose', 'Rocket Rose F1', 'majus', [], 90, 34, 110, 2, ['cut'], 'Rose : une seule dose de Rosea (Ros/ros). Hybride : ses graines donneront du magenta, du rose et du pâle (1 : 2 : 1).', 'Pink: a single dose of Rosea (Ros/ros). Hybrid: its seeds will give magenta, pink and pale (1 : 2 : 1).', { ...F1, het: ['ros'], origin: 'États-Unis' }),
  v('rocket-bronze', 'Rocket Bronze F1', 'majus', RED, 90, 34, 112, 2, ['cut'], 'Orange cuivré : jaune (sulf/sulf) + une dose de magenta (Ros/ros).', 'Coppery orange: yellow (sulf/sulf) + one dose of magenta (Ros/ros).', { ...F1, het: ['ros'], origin: 'États-Unis' }),
  v('potomac-pink', 'Potomac Pink F1', 'majus', [], 100, 40, 120, 3, ['cut'], 'Muflier de serre pour les fleuristes, tiges très droites.', 'Greenhouse snapdragon for florists, very straight stems.', { ...F1, het: ['ros'], origin: 'États-Unis' }),
  v('royal-bride', 'Royal Bride', 'majus', ['niv'], 75, 30, 115, 8, ['cut', 'heirloom'], 'Blanc pur et très parfumé. Blanc pur = nivea (aucun pigment, ni magenta ni jaune).', 'Pure white and very fragrant. Pure white = nivea (no pigment at all, neither magenta nor yellow).', { origin: 'Royaume-Uni' }),
  v('madame-butterfly', 'Madame Butterfly (mélange)', 'majus', [], 75, 28, 120, 3, ['cut'], 'Mélange à fleurs doubles « azalée ». Mélange de couleurs : graines très variées.', 'Double “azalea” flowered mixture. Colour mixture: very varied seedlings.', { het: ['ros', 'sulf', 'pal'], hybrid: true, origin: 'États-Unis' }),
  // --- Massif (moyens) ----------------------------------------------------------------------
  v('black-prince', 'Black Prince', 'majus', RED, 45, 22, 115, 3, ['bedding', 'heirloom'], 'Ancien muflier rouge cramoisi très sombre, feuillage bronze.', 'Old very dark crimson snapdragon, bronze foliage.', { origin: 'Royaume-Uni' }),
  v('night-and-day', 'Night and Day', 'majus', [...RED, 'El'], 45, 22, 115, 2, ['bedding', 'heirloom'], 'Cramoisi velouté à face blanc argenté : un motif bicolore comme celui d’Eluta (génotype supposé).', 'Velvety crimson with a silvery-white face: a bicolour pattern like Eluta’s (genotype assumed).', { hypothesis: true }),
  v('lucky-lips', 'Lucky Lips', 'majus', ['El'], 50, 24, 110, 2, ['bedding', 'novelty'], 'Lèvre supérieure pourpre, lèvre inférieure blanche (motif de type Eluta, supposé).', 'Purple upper lip, white lower lip (Eluta-like pattern, assumed).', { hypothesis: true }),
  v('liberty-cherry', 'Liberty Classic Cherry F1', 'majus', [], 50, 26, 100, 2, ['bedding'], 'Magenta cerise, épis denses, ramifié. Magenta = l’allure du muflier sauvage (Ros/Ros).', 'Cherry magenta, dense spikes, branching. Magenta = the wild snapdragon look (Ros/Ros).', { ...F1, origin: 'États-Unis' }),
  v('sonnet-white', 'Sonnet White F1', 'majus', IVORY, 50, 26, 100, 3, ['bedding', 'cut'], 'Blanc ivoire, mi-haut, pour massif ou petits bouquets.', 'Ivory white, medium height, for beds or small bouquets.', { ...F1, origin: 'Japon' }),
  v('brighton-rock', 'Brighton Rock (mélange)', 'majus', ['palrec'], 45, 22, 115, 2, ['bedding', 'novelty'], 'Fleurs striées et tachetées de magenta sur fond clair ; génotype supposé pallida-recurrens, l’allèle à transposon. Plus tacheté par temps frais.', 'Flowers striped and flecked with magenta on a pale background; genotype assumed pallida-recurrens, the transposon allele. More flecked in cool weather.', { het: ['sulf'], hypothesis: true, origin: 'Royaume-Uni' }),
  v('monarch', 'Mélange résistant à la rouille (type Monarch)', 'majus', ['Pa'], 50, 24, 115, 2, ['bedding', 'resistant'], 'Mélange ancien sélectionné pour la résistance à la rouille. La rouille a depuis contourné une partie de ces résistances.', 'Old mixture bred for rust resistance. Rust has since overcome some of these resistances.', { het: ['ros', 'sulf'], origin: 'Royaume-Uni' }),
  // --- Nains -----------------------------------------------------------------------------
  v('tom-thumb', 'Tom Thumb (mélange)', 'majus', [], 20, 14, 95, 1, ['dwarf', 'heirloom'], 'Muflier nain ancien, très ramifié, en mélange de couleurs.', 'Old dwarf snapdragon, very branching, in mixed colours.', { het: ['ros', 'sulf'] }),
  v('montego-yellow', 'Montego Yellow F1', 'majus', YELLOW, 20, 14, 90, 1, ['dwarf'], 'Nain jaune vif, pour bordures et potées.', 'Bright yellow dwarf, for edging and pots.', { ...F1, origin: 'États-Unis' }),
  v('snapshot-white', 'Snapshot White F1', 'majus', IVORY, 20, 14, 85, 1, ['dwarf'], 'Nain blanc ivoire très précoce.', 'Very early ivory-white dwarf.', { ...F1, origin: 'États-Unis' }),
  v('floral-showers-red', 'Floral Showers Red F1', 'majus', RED, 20, 14, 85, 1, ['dwarf'], 'Nain rouge, très précoce et compact.', 'Red dwarf, very early and compact.', { ...F1, origin: 'Japon' }),
  // --- Curiosités et histoire --------------------------------------------------------------
  v('darwin-peloric', 'Muflier pélorique (de Darwin)', 'majus', ['cyc', 'dich'], 60, 20, 120, 2, ['novelty', 'heirloom'], 'Fleurs en étoile, symétriques, au sommet et sur l’épi. Darwin le croisa avec un muflier normal : F1 normale, F2 88 normaux pour 37 péloriques.', 'Star-shaped symmetric flowers. Darwin crossed it with a normal snapdragon: normal F1, F2 of 88 normal to 37 peloric.', { origin: 'Royaume-Uni' }),
  // --- Lignées de laboratoire -------------------------------------------------------------
  v('lab-wild', 'Lignée magenta de référence', 'majus', [], 60, 22, 110, 2, ['lab'], 'Lignée sauvage de laboratoire, magenta à palais jaune : la référence des collections de mutants (type « Sippe 50 », Gatersleben).', 'Wild-type laboratory line, magenta with a yellow palate: the reference of mutant collections (“Sippe 50” type, Gatersleben).', { inbred: true, origin: 'Allemagne' }),
  v('lab-nivea', 'Lignée nivea', 'majus', ['niv'], 60, 22, 110, 2, ['lab'], 'Mutant blanc pur : chalcone synthase inactive. Épistatique sur tous les autres gènes de couleur.', 'Pure white mutant: inactive chalcone synthase. Epistatic over all other colour genes.', { inbred: true, origin: 'Royaume-Uni' }),
  v('lab-pallida', 'Lignée pallida', 'majus', ['pal'], 60, 22, 110, 2, ['lab'], 'Mutant ivoire : sans DFR, pas de magenta.', 'Ivory mutant: without DFR, no magenta.', { inbred: true, origin: 'Royaume-Uni' }),
  v('lab-palrec', 'Lignée pallida-recurrens', 'majus', ['palrec'], 60, 22, 110, 2, ['lab'], 'L’allèle à transposon Tam3 du John Innes Centre : fleurs ivoire tachetées de magenta, là où Tam3 a quitté le gène.', 'The Tam3 transposon allele of the John Innes Centre: ivory flowers flecked with magenta where Tam3 left the gene.', { inbred: true, origin: 'Royaume-Uni' }),
  v('lab-rosea', 'Lignée rosea', 'majus', ['ros'], 60, 22, 110, 2, ['lab'], 'Presque sans magenta (ros/ros). Croisée avec la lignée magenta : F1 rose, F2 1 : 2 : 1.', 'Almost no magenta (ros/ros). Crossed with the magenta line: pink F1, F2 1 : 2 : 1.', { inbred: true, origin: 'Royaume-Uni' }),
  v('lab-venosa', 'Lignée rosea venosa', 'majus', ['ros', 'Ven'], 60, 22, 110, 2, ['lab'], 'Fleur pâle aux nervures magenta : Venosa ne se voit que si Rosea est faible.', 'Pale flower with magenta veins: Venosa only shows when Rosea is weak.', { inbred: true, origin: 'Royaume-Uni' }),
  v('lab-sulfurea', 'Lignée sulfurea', 'majus', ['sulf'], 60, 22, 110, 2, ['lab'], 'Le jaune envahit toute la fleur ; avec le magenta : rouge.', 'Yellow spreads over the whole flower; with magenta: red.', { inbred: true, origin: 'Royaume-Uni' }),
  v('lab-cycloidea', 'Lignée cycloidea', 'majus', ['cyc'], 60, 22, 115, 2, ['lab'], 'Semi-pélorique : la fleur perd une partie de sa symétrie. CYCLOIDEA, le premier gène de la symétrie florale (Luo et al. 1996).', 'Semi-peloric: the flower loses part of its symmetry. CYCLOIDEA, the first floral-symmetry gene (Luo et al. 1996).', { inbred: true, origin: 'Royaume-Uni' }),
  v('lab-cyc-dich', 'Lignée cycloidea dichotoma', 'majus', ['cyc', 'dich'], 60, 22, 115, 2, ['lab'], 'Double mutant : fleur entièrement pélorique, en étoile à cinq pétales égaux.', 'Double mutant: fully peloric flower, a star of five equal petals.', { inbred: true, origin: 'Royaume-Uni' }),
  // --- Sauvages -------------------------------------------------------------------------------
  v('pseudomajus', 'Muflier sauvage magenta', 'pseudomajus', [], 70, 16, 130, 3, ['wild'], 'Magenta à palais jaune, sur les rochers des Pyrénées. Auto-incompatible : on ne peut pas l’autoféconder.', 'Magenta with a yellow palate, on Pyrenean rocks. Self-incompatible: it cannot be selfed.', { sAlleles: ['S1', 'S2'], origin: 'Espagne' }),
  v('striatum', 'Muflier sauvage jaune', 'striatum', ['sulf', 'ros', 'Ven', 'El'], 70, 16, 130, 3, ['wild'], 'Jaune à nervures rouges : peu de magenta (ros/ros, Eluta) et des nervures (Venosa) sur fond jaune (sulf). Auto-incompatible.', 'Yellow with red veins: little magenta (ros/ros, Eluta) and veins (Venosa) on yellow (sulf). Self-incompatible.', { sAlleles: ['S3', 'S4'], origin: 'Espagne' }),
  v('planes-hybrid', 'Hybride de la zone de Planès', 'pseudomajus', ['Ven'], 70, 16, 130, 3, ['wild'], 'Plante de la zone hybride des Pyrénées-Orientales, où pseudomajus et striatum se mêlent sur quelques kilomètres : hétérozygote pour la couleur.', 'Plant from the Pyrénées-Orientales hybrid zone, where pseudomajus and striatum mix over a few kilometres: heterozygous for colour.', { het: ['ros', 'sulf', 'El'], sAlleles: ['S2', 'S3'], hybridWith: 'striatum', origin: 'France' }),
  v('hispanicum', 'Antirrhinum hispanicum', 'hispanicum', ['ros', 'Ven'], 30, 8, 120, 1, ['wild'], 'Petit muflier rose pâle veiné des falaises du sud de l’Espagne ; se croise avec le muflier cultivé. Auto-incompatible.', 'Small pale-pink veined snapdragon of southern Spanish cliffs; crosses with the garden snapdragon. Self-incompatible.', { sAlleles: ['S4', 'S5'], origin: 'Espagne' }),
  v('molle', 'Antirrhinum molle', 'molle', ['pal'], 25, 6, 120, 1, ['wild'], 'Muflier rampant et velu des Pyrénées, blanc à palais jaune. Auto-incompatible.', 'Trailing hairy Pyrenean snapdragon, white with a yellow palate. Self-incompatible.', { sAlleles: ['S1', 'S5'], origin: 'Espagne' }),
  v('linaria', 'Linaire commune', 'linaria', ['sulf', 'pal'], 50, 25, 120, 2, ['wild'], 'Cousine jaune du muflier, au bord des chemins. Autre genre : aucun croisement possible.', 'Yellow cousin of the snapdragon, on roadsides. Another genus: no cross possible.', { sAlleles: ['S1', 'S2'], origin: 'France' }),
  v('linaria-peloria', 'Linaire « Peloria » (Linné, 1744)', 'linaria', ['sulf', 'pal', 'cyc', 'dich'], 50, 25, 120, 2, ['wild', 'novelty'], 'La linaire pélorique décrite par Linné, qui la crut une nouvelle espèce. C’est une ÉPIMUTATION : le gène Lcyc est intact mais réduit au silence par méthylation (Cubas et al. 1999) ; simulée ici comme un double récessif.', 'The peloric toadflax described by Linnaeus, who thought it a new species. It is an EPIMUTATION: the Lcyc gene is intact but silenced by methylation (Cubas et al. 1999); simulated here as a double recessive.', { sAlleles: ['S1', 'S2'], hypothesis: true, origin: 'Suède' }),
];

export const VARIETY_BY_ID: Record<string, AmVariety> = Object.fromEntries(AM_VARIETIES.map((x) => [x.id, x]));
