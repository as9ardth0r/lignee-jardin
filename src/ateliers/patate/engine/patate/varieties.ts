/**
 * Bibliothèque de pommes de terre, de formes andines et d’espèces sauvages.
 *
 * Sources : catalogue officiel français et fiches variétales (GNIS /
 * SEMAE, Germicopa, Agrico, HZPC), base européenne des variétés de pommes
 * de terre (europotato.org), banque de gènes du CIP (Lima) et de la
 * Commonwealth Potato Collection (CPC 1673, source de H1), lignées
 * génétiques publiées : IVP101 (Hermsen & Verdenius 1973), DM1-3 516 R44
 * (génome de référence, PGSC 2011), M6 (Jansky et al. 2014, Sli).
 *
 * Valeurs chiffrées = ordres de grandeur. Génotypes DÉDUITS de la couleur
 * de peau et de chair, de la forme et des résistances connues, avec le
 * modèle simplifié de loci.ts. `alleles` donne le NOMBRE DE COPIES de
 * chaque variante (« duplex » = 2 copies sur 4). Les allèles S sont des
 * étiquettes pédagogiques.
 */

import type { Cytoplasm, QuantTraitId } from './engine';
import type { PtLocusId, SpeciesId, VariantId } from './loci';

export type PtKind = 'firm' | 'floury' | 'early' | 'coloured' | 'heirloom' | 'resistant' | 'andean' | 'wild' | 'stock';
export const PT_KINDS: PtKind[] = ['firm', 'floury', 'early', 'coloured', 'heirloom', 'resistant', 'andean', 'wild', 'stock'];

export interface PtVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  /** Ploïdie et EBN, si différents de ceux de l’espèce (dihaploïdes, doublés). */
  ploidy?: number;
  ebn?: number;
  fertility?: number;
  cyto?: Cytoplasm;
  /** Nombre de copies de chaque variante. */
  alleles: Partial<Record<VariantId, number>>;
  /** Allèles S, un par copie (répétés si besoin). */
  s?: string[];
  /** Tubercules par plante (kg). */
  weightKg: number;
  /** Jours jusqu’à la maturité. */
  days: number;
  /** Matière sèche (%). */
  dm: number;
  /** Gel supporté (°C). */
  frostC: number;
  kinds: PtKind[];
  /** Lignée homozygote (doublé monoploïde, lignée consanguine). */
  inbred?: boolean;
  /** Inducteur d’haploïdes. */
  inducer?: boolean;
  /** Variété issue de graine F1 (pomme de terre hybride diploïde). */
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  /** Variétés perso : génotype et haplotypes exacts du clone d’origine. */
  genotype?: Partial<Record<PtLocusId, string[]>>;
  haps?: Partial<Record<QuantTraitId, number[][]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<PtVariety, 'origin' | 'cyto' | 's' | 'ploidy' | 'ebn' | 'inbred' | 'inducer' | 'hybrid' | 'hybridWith' | 'fertility'>>;
type A = Partial<Record<VariantId, number>>;

function v(id: string, name: string, species: SpeciesId, alleles: A, weightKg: number, days: number, dm: number, frostC: number, kinds: PtKind[], fr: string, en: string, opt: Opt = {}): PtVariety {
  return { id, name, species, alleles, weightKg, days, dm, frostC, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

const FR = { origin: 'France' };
const NL = { origin: 'Pays-Bas' };
const UK = { origin: 'Royaume-Uni' };
const DE = { origin: 'Allemagne' };
const US = { origin: 'États-Unis' };

export const PT_VARIETIES: PtVariety[] = [
  // --- Chair ferme --------------------------------------------------------------
  v('charlotte', 'Charlotte', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2, H1: 1 }, 1.0, 100, 18, -1, ['firm'], 'La chair ferme la plus cultivée en France (1981) : oblongue, peau et chair jaunes, résistante au nématode doré.', 'France’s most grown waxy potato (1981): oblong, yellow skin and flesh, golden-nematode resistant.', FR),
  v('ratte', 'La Ratte', 'tuberosum', { Y: 3, Cdf: 1 }, 0.6, 130, 21, -1, ['firm', 'heirloom'], 'Petite, longue et arquée, goût de noisette ; variété ancienne (vers 1870), sauvée par les chefs.', 'Small, long, curved, nutty; an old variety (about 1870), saved by chefs.', FR),
  v('belle-de-fontenay', 'Belle de Fontenay', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2 }, 0.9, 95, 18, -1, ['firm', 'heirloom', 'early'], 'Chair ferme historique (1885), oblongue et jaune.', 'Historic waxy variety (1885), oblong and yellow.', FR),
  v('bf15', 'BF 15', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2 }, 1.0, 90, 18, -1, ['firm', 'early'], 'Croisement Belle de Fontenay × Flava (1947), précoce.', 'Belle de Fontenay × Flava (1947), early.', FR),
  v('amandine', 'Amandine', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2 }, 1.0, 80, 17, -1, ['firm', 'early'], 'Primeur allongée à peau très fine.', 'Elongated new potato with very thin skin.', FR),
  v('nicola', 'Nicola', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2, H1: 1 }, 1.2, 110, 18, -1, ['firm', 'resistant'], 'Chair ferme jaune allemande (1973), résistante au nématode doré.', 'German yellow waxy variety (1973), golden-nematode resistant.', DE),
  v('linda', 'Linda', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2 }, 1.1, 115, 19, -1, ['firm'], 'Chair ferme jaune, défendue par les jardiniers quand elle a quitté le catalogue (2004).', 'Yellow waxy potato, defended by gardeners when it left the catalogue (2004).', DE),
  v('roseval', 'Roseval', 'tuberosum', { D: 1, R: 2, Y: 2, Ro: 1, Cdf: 2 }, 1.0, 110, 19, -1, ['firm', 'coloured'], 'Peau rouge, chair jaune, oblongue (1950).', 'Red skin, yellow flesh, oblong (1950).', FR),
  v('pink-fir-apple', 'Pink Fir Apple', 'tuberosum', { D: 1, R: 1, Y: 2, Eyd: 2, Cdf: 1 }, 0.7, 140, 20, -1, ['firm', 'heirloom', 'coloured'], 'Longue, noueuse, rosée, aux yeux profonds (1850).', 'Long, knobbly, pink, deep-eyed (1850).', UK),
  v('annabelle', 'Annabelle', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2 }, 0.9, 75, 17, -1, ['firm', 'early'], 'Primeur très précoce à chair jaune.', 'Very early yellow-fleshed new potato.', NL),
  // --- Polyvalentes et farineuses -------------------------------------------------
  v('bintje', 'Bintje', 'tuberosum', { Y: 1, Ro: 1, Cdf: 2 }, 1.4, 120, 21, -1, ['floury', 'heirloom'], 'Née en 1910 dans une école de Frise ; la frite belge par excellence, très sensible au mildiou.', 'Born in 1910 in a Frisian school; the classic Belgian fry, very blight-susceptible.', NL),
  v('agria', 'Agria', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2, H1: 1 }, 1.6, 125, 21, -1, ['floury', 'resistant'], 'Grosse frite à chair jaune (1985), résistante au nématode doré.', 'Large yellow-fleshed fry (1985), golden-nematode resistant.', DE),
  v('maris-piper', 'Maris Piper', 'tuberosum', { Y: 1, Ro: 2, Cdf: 2, H1: 1 }, 1.5, 120, 22, -1, ['floury', 'resistant'], 'La reine des frites britanniques (1966), première grande variété porteuse de H1.', 'Britain’s chip queen (1966), the first major variety carrying H1.', UK),
  v('russet-burbank', 'Russet Burbank', 'tuberosum', { Cdf: 2 }, 1.5, 150, 22, -1, ['floury'], 'Longue à peau liégeuse et chair blanche, sélectionnée par Luther Burbank (1870-1914) ; la frite américaine.', 'Long, russet-skinned, white-fleshed, selected by Luther Burbank (1870-1914); the American fry.', US),
  v('king-edward', 'King Edward', 'tuberosum', { Y: 1, Ro: 2, Eyd: 1, Cdf: 2 }, 1.1, 130, 21, -1, ['floury', 'heirloom'], 'Farineuse anglaise de 1902, aux yeux rosés.', 'English floury variety of 1902, with pinkish eyes.', UK),
  v('golden-wonder', 'Golden Wonder', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2 }, 0.9, 150, 25, -1, ['floury', 'heirloom'], 'Matière sèche record (1906) : la chips écossaise.', 'Record dry matter (1906): the Scottish crisp.', UK),
  v('spunta', 'Spunta', 'tuberosum', { Y: 1, Cdf: 2 }, 1.8, 100, 17, -1, ['early'], 'Très gros tubercules longs, cultivée tout autour de la Méditerranée.', 'Very large long tubers, grown all around the Mediterranean.', NL),
  v('monalisa', 'Monalisa', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2 }, 1.5, 100, 17, -1, ['early'], 'Polyvalente à chair jaune, productive.', 'Productive all-rounder with yellow flesh.', NL),
  v('kennebec', 'Kennebec', 'tuberosum', { Ro: 2, Cdf: 2, R1: 1 }, 1.6, 120, 20, -1, ['floury'], 'Américaine de 1948, porteuse du gène R1 de S. demissum, aujourd’hui contourné.', 'American 1948 variety carrying the S. demissum R1 gene, now overcome.', US),
  v('cara', 'Cara', 'tuberosum', { Ro: 2, Cdf: 2, H1: 1 }, 1.8, 150, 19, -1, ['resistant'], 'Tardive irlandaise (1976) à chair blanche, résistante au nématode doré.', 'Late Irish variety (1976) with white flesh, golden-nematode resistant.', { origin: 'Irlande' }),
  v('desiree', 'Désirée', 'tuberosum', { D: 1, R: 1, Y: 1, Ro: 1, Cdf: 2 }, 1.4, 120, 21, -1, ['coloured'], 'Peau rouge, chair crème (1962), tolérante à la sécheresse.', 'Red skin, cream flesh (1962), drought tolerant.', NL),
  v('red-duke-of-york', 'Red Duke of York', 'tuberosum', { D: 1, R: 1, Y: 1, Ro: 1, Cdf: 2 }, 0.9, 85, 20, -1, ['early', 'coloured'], 'Mutant rouge de Duke of York (1891).', 'Red sport of Duke of York (1891).', UK),
  v('kerrs-pink', 'Kerr’s Pink', 'tuberosum', { D: 1, R: 1, Y: 1, Ro: 2, Eyd: 1, Cdf: 2 }, 1.3, 130, 22, -1, ['floury', 'heirloom', 'coloured'], 'Ronde, rose, aux yeux profonds (Écosse, 1917).', 'Round, pink, deep-eyed (Scotland, 1917).', UK),
  v('rooster', 'Rooster', 'tuberosum', { D: 1, R: 2, Y: 2, Ro: 3, Cdf: 2 }, 1.5, 125, 21, -1, ['floury', 'coloured'], 'Ronde à peau rouge et chair jaune, la plus vendue d’Irlande.', 'Round, red skin, yellow flesh, Ireland’s best seller.', { origin: 'Irlande' }),
  v('mozart', 'Mozart', 'tuberosum', { D: 1, R: 2, Y: 2, Ro: 1, Cdf: 2 }, 1.4, 115, 19, -1, ['coloured'], 'Oblongue à peau rouge et chair jaune.', 'Oblong, red skin, yellow flesh.', NL),
  // --- Couleurs ------------------------------------------------------------------
  v('vitelotte', 'Vitelotte noire', 'tuberosum', { D: 2, P: 2, Pf: 2, Eyd: 2, Cdf: 1 }, 0.6, 140, 22, -1, ['coloured', 'heirloom'], 'Peau bleu-noir et chair violette, connue à Paris depuis le XIXe siècle.', 'Blue-black skin and purple flesh, known in Paris since the 19th century.', FR),
  v('violet-queen', 'Violet Queen', 'tuberosum', { D: 2, P: 2, Pf: 2, Ro: 1, Cdf: 2 }, 1.0, 110, 19, -1, ['coloured'], 'Violette dedans comme dehors, plus productive que la Vitelotte.', 'Purple inside and out, more productive than Vitelotte.', DE),
  v('adirondack-blue', 'Adirondack Blue', 'tuberosum', { D: 2, P: 2, Pf: 2, Ro: 2, Cdf: 2 }, 1.2, 110, 19, -1, ['coloured'], 'Ronde, peau et chair violettes (Cornell, 2003).', 'Round, purple skin and flesh (Cornell, 2003).', US),
  v('adirondack-red', 'Adirondack Red', 'tuberosum', { D: 2, R: 2, Pf: 2, Ro: 1, Cdf: 2 }, 1.2, 110, 19, -1, ['coloured'], 'Peau et chair rouges (Cornell, 2004).', 'Red skin and red flesh (Cornell, 2004).', US),
  v('highland-burgundy', 'Highland Burgundy Red', 'tuberosum', { D: 2, R: 2, Pf: 2, Eyd: 1, Cdf: 1 }, 0.8, 130, 21, -1, ['coloured', 'heirloom'], 'Chair rouge bordeaux, servie au duc de Burgundy en 1936.', 'Burgundy-red flesh, served to the Duke of Burgundy in 1936.', UK),
  v('shetland-black', 'Shetland Black', 'tuberosum', { D: 1, P: 1, Y: 1, Ro: 2, Eyd: 2, Cdf: 2 }, 0.8, 120, 22, -1, ['coloured', 'heirloom'], 'Peau violet-noir, chair crème cerclée de violet (XIXe s.).', 'Purple-black skin, cream flesh ringed with purple (19th c.).', UK),
  v('michunie-negra', 'Michuñe negra', 'tuberosum', { D: 2, P: 2, Eyd: 3, Cdf: 2 }, 0.7, 130, 22, -1, ['coloured', 'heirloom'], 'Variété de pays de l’île de Chiloé (Chili), berceau des pommes de terre adaptées aux jours longs.', 'Landrace from Chiloé island (Chile), cradle of long-day-adapted potatoes.', { origin: 'Chili' }),
  // --- Résistances ----------------------------------------------------------------------
  v('bionica', 'Bionica', 'tuberosum', { Y: 1, Ro: 1, Cdf: 2, 'Rpi-blb1': 1 }, 1.3, 125, 20, -1, ['resistant'], 'Une Bintje résistante au mildiou : gène Rpi-blb de S. bulbocastanum, introduit par des croisements-ponts pendant 40 ans (2009).', 'A blight-resistant Bintje: Rpi-blb gene from S. bulbocastanum, brought in through 40 years of bridge crosses (2009).', NL),
  v('toluca', 'Toluca', 'tuberosum', { Y: 2, Ro: 1, Cdf: 2, 'Rpi-blb1': 1 }, 1.3, 120, 20, -1, ['resistant'], 'Chair jaune, Rpi-blb (même origine que Bionica).', 'Yellow flesh, Rpi-blb (same origin as Bionica).', NL),
  v('pirola', 'Pirola', 'tuberosum', { Y: 1, Ro: 2, Cdf: 2, Ry: 1 }, 1.3, 125, 20, -1, ['resistant'], 'Résistance extrême au virus Y (Ry-sto, de S. stoloniferum).', 'Extreme resistance to virus Y (Ry-sto, from S. stoloniferum).', DE),
  v('bzura', 'Bzura', 'tuberosum', { Ro: 2, Cdf: 2, Ry: 1, H1: 1 }, 1.6, 145, 22, -1, ['resistant'], 'Polonaise tardive, résistante au virus Y et au nématode doré.', 'Late Polish variety, resistant to virus Y and golden nematode.', { origin: 'Pologne' }),
  // --- Andines et diploïdes cultivées -------------------------------------------------------
  v('cpc1673', 'Andigena CPC 1673', 'andigena', { D: 2, P: 1, H1: 1, Eyd: 4, Ro: 2, Y: 1 }, 0.5, 170, 22, -1.5, ['andean', 'stock'], 'L’andigena de la Commonwealth Potato Collection qui a donné H1 à presque toutes les variétés résistantes au nématode doré.', 'The Commonwealth Potato Collection andigena that gave H1 to almost every golden-nematode-resistant variety.', { origin: 'Argentine' }),
  v('andigena-ry', 'Andigena (Ry-adg)', 'andigena', { D: 2, R: 1, Ry: 1, Eyd: 4, Ro: 2, Y: 2 }, 0.5, 170, 23, -1.5, ['andean', 'stock'], 'Variété andine porteuse de Ry-adg, l’immunité au virus Y.', 'Andean landrace carrying Ry-adg, immunity to virus Y.', { origin: 'Bolivie' }),
  v('papa-criolla', 'Papa criolla', 'phureja', { Y: 2, Ro: 2, Eyd: 2 }, 0.4, 110, 21, -1, ['andean'], 'Petite pomme de terre jaune de Colombie, sans dormance, au goût de beurre ; diploïde (2x).', 'Small yellow Colombian potato with no dormancy and a buttery taste; diploid (2x).', { origin: 'Colombie', s: ['S1', 'S2'] }),
  v('yema-de-huevo', 'Yema de huevo', 'phureja', { Y: 2, zep: 2, Ro: 2, Eyd: 2 }, 0.3, 110, 22, -1, ['andean', 'coloured'], '« Jaune d’œuf » : chair orange, riche en zéaxanthine (zep/zep), qui a servi à cloner le gène.', '“Egg yolk”: orange flesh, rich in zeaxanthin (zep/zep), used to clone the gene.', { origin: 'Pérou', s: ['S3', 'S4'] }),
  v('mayan-gold', 'Mayan Gold', 'phureja', { Y: 2, Ro: 1, Cdf: 1 }, 0.7, 110, 22, -1, ['andean'], 'Phureja sélectionnée en Écosse pour tubériser en jours longs ; chair d’or, cuisson express.', 'Phureja bred in Scotland to tuberize in long days; golden flesh, cooks fast.', { origin: 'Royaume-Uni', s: ['S2', 'S5'] }),
  v('pitiquina', 'Pitiquiña', 'stenotomum', { D: 2, P: 1, Y: 1, Ro: 2, Eyd: 2 }, 0.3, 140, 23, -1.5, ['andean', 'coloured'], 'Diploïde andine panachée de violet, parmi les premières pommes de terre domestiquées.', 'Purple-splashed Andean diploid, among the first domesticated potatoes.', { origin: 'Pérou', s: ['S3', 'S6'] }),
  v('ps-stock', 'Diploïde 2n (ps/ps)', 'phureja', { ps: 2, Y: 1, Ro: 2, D: 1, R: 1 }, 0.3, 120, 21, -1, ['stock', 'andean'], 'Hybride phureja × stenotomum qui fait 30 % de pollen 2n (fuseaux parallèles) : de quoi féconder la pomme de terre tétraploïde (Peloquin).', 'Phureja × stenotomum hybrid making 30% 2n pollen (parallel spindles): able to fertilise tetraploid potato (Peloquin).', { origin: 'États-Unis', s: ['S4', 'S5'] }),
  v('ivp101', 'IVP101 (inducteur)', 'phureja', { D: 2, P: 2, Ro: 2, Eyd: 2 }, 0.2, 110, 20, -1, ['stock'], 'Inducteur d’haploïdes (Wageningen, 1973) : pollinisée par lui, la pomme de terre donne quelques « dihaploïdes » (2x), repérés à la tache violette de l’embryon, absente chez eux.', 'Haploid inducer (Wageningen, 1973): pollinated by it, potato yields some “dihaploids” (2x), spotted because they lack the purple embryo spot.', { origin: 'Pays-Bas', s: ['S1', 'S6'], inducer: true }),
  v('dm1-3', 'DM1-3 516 R44', 'phureja', { Y: 2, Ro: 2, Eyd: 2 }, 0.1, 120, 20, -1, ['stock'], 'Doublé monoploïde de Phureja, totalement homozygote : son génome a été le premier séquencé (2011). Chétif, il illustre la dépression de consanguinité.', 'Doubled monoploid of Phureja, fully homozygous: its genome was the first sequenced (2011). Puny, it shows inbreeding depression.', { origin: 'Pérou', s: ['S2'], inbred: true }),
  v('m6', 'M6 (S. chacoense, Sli)', 'chacoense', { Sli: 2, Ro: 2, Eyd: 2 }, 0.1, 130, 22, -2, ['stock', 'wild'], 'Lignée consanguine de S. chacoense porteuse de Sli : autocompatible, elle ouvre la voie aux pommes de terre diploïdes hybrides cultivées par graine.', 'Inbred S. chacoense line carrying Sli: self-compatible, it opened the way to diploid hybrid potatoes grown from seed.', { origin: 'États-Unis', s: ['S3'], inbred: true }),
  v('solyntus', 'Solyntus (diploïde Sli)', 'phureja', { Sli: 2, Y: 2, Ro: 2, Cdf: 2 }, 0.7, 100, 20, -1, ['stock'], 'Lignée diploïde homozygote et autocompatible (Solynta, 2021), mère de pommes de terre hybrides F1 semées en graines.', 'Homozygous self-compatible diploid line (Solynta, 2021), parent of F1 hybrid potatoes grown from seed.', { origin: 'Pays-Bas', s: ['S4'], inbred: true }),
  // --- Espèces sauvages -------------------------------------------------------------------------
  v('demissum', 'S. demissum', 'demissum', { R1: 3, D: 3, P: 3, Eyd: 6, Ro: 3 }, 0.05, 160, 24, -2.5, ['wild', 'resistant'], 'Hexaploïde (6x, 4EBN) mexicaine : son EBN 4 lui permet de se croiser avec la pomme de terre ; source des gènes R1 à R11.', 'Mexican hexaploid (6x, 4EBN): its EBN of 4 lets it cross with potato; source of genes R1 to R11.', { origin: 'Mexique' }),
  v('bulbocastanum', 'S. bulbocastanum', 'bulbocastanum', { 'Rpi-blb1': 2, Eyd: 2, Ro: 2 }, 0.03, 150, 22, -1, ['wild', 'resistant'], 'Diploïde 1EBN : la meilleure résistance au mildiou, mais aucune graine avec la pomme de terre sans pont (doublement, puis croisement avec une 2EBN).', 'Diploid 1EBN: the best blight resistance, but no seed with potato without a bridge (doubling, then a cross with a 2EBN species).', { origin: 'Mexique', s: ['S1', 'S4'] }),
  v('stoloniferum', 'S. stoloniferum', 'stoloniferum', { Ry: 2, Eyd: 4, Ro: 2 }, 0.04, 150, 22, -2, ['wild', 'resistant'], 'Tétraploïde 2EBN ; cytoplasme W qui rend les descendants mâles stériles, et Ry-sto contre le virus Y.', 'Tetraploid 2EBN; W cytoplasm that makes the offspring male sterile, and Ry-sto against virus Y.', { origin: 'Mexique', cyto: 'W' }),
  v('acaule', 'S. acaule', 'acaule', { Eyd: 4, Ro: 4 }, 0.03, 140, 23, -6, ['wild'], 'Tétraploïde 2EBN des hauts plateaux, gel jusqu’à −6 °C ; « pont » classique vers les espèces 1EBN.', 'Highland tetraploid 2EBN, frost to −6 °C; a classic “bridge” to 1EBN species.', { origin: 'Bolivie' }),
  v('commersonii', 'S. commersonii', 'commersonii', { Eyd: 2, Ro: 2 }, 0.03, 160, 21, -5, ['wild'], 'Diploïde 1EBN d’Uruguay, rustique au gel.', 'Frost-hardy diploid 1EBN from Uruguay.', { origin: 'Uruguay', s: ['S5', 'S6'] }),
  v('chacoense', 'S. chacoense', 'chacoense', { Eyd: 2, Ro: 2 }, 0.05, 140, 21, -2, ['wild'], 'Diploïde sauvage 2EBN, riche en glycoalcaloïdes (résistance aux doryphores), auto-incompatible.', 'Wild diploid 2EBN, rich in glycoalkaloids (Colorado beetle resistance), self-incompatible.', { origin: 'Argentine', s: ['S1', 'S5'] }),
];

export const VARIETY_BY_ID: Record<string, PtVariety> = Object.fromEntries(PT_VARIETIES.map((x) => [x.id, x]));
