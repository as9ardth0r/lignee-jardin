/**
 * Bibliothèque de maïs et de leurs parents sauvages.
 *
 * Sources : catalogues de semenciers (Baker Creek, Seed Savers Exchange,
 * Kokopelli, Johnny’s), collections publiques (Maize Genetics COOP Stock
 * Center pour les stocks de gènes, lignées publiques B73, Mo17, W22, Oh43,
 * A188, F2 et F252 de l’INRA), descriptions des races de pays (CIMMYT).
 *
 * Valeurs chiffrées = ordres de grandeur. Génotypes = DÉDUITS de la couleur
 * et de la texture des grains avec le modèle simplifié de loci.ts.
 * Les POPULATIONS (variétés anciennes, races de pays, téosintes) sont
 * hétérozygotes pour les traits chiffrés : leurs descendances varient, et
 * l’autofécondation fait apparaître la dépression de consanguinité. Les
 * LIGNÉES (inbred: true) sont fixées… et chétives. Les hybrides F1 ont un
 * génotype supposé ; `het` liste les gènes à l’état hétérozygote (maïs
 * bicolore, populations multicolores).
 */

import type { Cytoplasm, QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type MzKind = 'dent' | 'flint' | 'sweet' | 'pop' | 'flour' | 'specialty' | 'inbred' | 'wild';
export const MZ_KINDS: MzKind[] = ['dent', 'flint', 'sweet', 'pop', 'flour', 'specialty', 'inbred', 'wild'];

export interface MzVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  cyto?: Cytoplasm;
  variants: VariantId[];
  /** Gènes à l’état hétérozygote chez le fondateur. */
  het?: VariantId[];
  /** Lignée fixée (consanguine). */
  inbred?: boolean;
  /** Longueur d’épi (cm). */
  earCm: number;
  /** Poids de 100 grains (g). */
  kernel100: number;
  /** Épis par plante. */
  ears: number;
  /** Jours du semis à la maturité du grain. */
  days: number;
  heightCm: number;
  kinds: MzKind[];
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<MzVariety, 'hybrid' | 'origin' | 'inbred' | 'het' | 'cyto'>>;

function v(
  id: string,
  name: string,
  species: SpeciesId,
  variants: VariantId[],
  earCm: number,
  kernel100: number,
  ears: number,
  days: number,
  heightCm: number,
  kinds: MzKind[],
  fr: string,
  en: string,
  opt: Opt = {}
): MzVariety {
  return { id, name, species, variants, earCm, kernel100, ears, days, heightCm, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

const I = { inbred: true } as const;

export const MZ_VARIETIES: MzVariety[] = [
  // --- Lignées et hybrides ------------------------------------------------------
  v('b73', 'B73', 'mays', ['Pwr'], 15, 26, 1, 125, 200, ['inbred', 'dent'], 'Lignée de l’Iowa (1972), la plus utilisée de l’histoire et premier génome de maïs séquencé. Comme toute lignée, chétive seule.', 'Iowa inbred (1972), the most used in history and the first sequenced maize genome. Like any inbred, weak on its own.', { ...I, origin: 'USA' }),
  v('mo17', 'Mo17', 'mays', [], 14, 25, 1, 120, 190, ['inbred', 'dent'], 'Lignée du Missouri (1964), partenaire de B73 dans le plus célèbre des hybrides.', 'Missouri inbred (1964), B73’s partner in the most famous hybrid.', { ...I, origin: 'USA' }),
  v('b73xmo17', 'B73 × Mo17 F1', 'mays', [], 21, 32, 1, 120, 280, ['dent'], 'L’hybride simple modèle : deux lignées chétives, un hybride vigoureux. Ne ressemez pas ses grains : la F2 retombe.', 'The textbook single cross: two weak inbreds, one vigorous hybrid. Don’t resow its kernels: the F2 slumps.', { hybrid: true, het: ['Pwr'], origin: 'USA' }),
  v('oh43', 'Oh43', 'mays', ['Pwr'], 14, 26, 1, 120, 190, ['inbred', 'dent'], 'Lignée de l’Ohio (1949), très utilisée dans les hybrides des années 1950–70.', 'Ohio inbred (1949), widely used in 1950s–70s hybrids.', { ...I, origin: 'USA' }),
  v('w22', 'W22 (R-sc)', 'mays', ['R1'], 13, 22, 1, 115, 170, ['inbred', 'dent'], 'Lignée du Wisconsin, référence des généticiens : grains violets (A1 C1 R1), fond génétique des collections de mutants.', 'Wisconsin inbred, the geneticists’ reference: purple kernels (A1 C1 R1), background for mutant collections.', { ...I, origin: 'USA' }),
  v('a188', 'A188', 'mays', [], 12, 20, 1, 110, 170, ['inbred', 'dent'], 'Lignée du Minnesota, la plus facile à transformer en laboratoire.', 'Minnesota inbred, the easiest to transform in the lab.', { ...I, origin: 'USA' }),
  v('f2', 'F2 (INRA)', 'mays', [], 13, 22, 1, 105, 160, ['inbred', 'flint'], 'Lignée cornée précoce tirée de la population de Lacaune (INRA, années 1950), base des hybrides cornés × dentés européens.', 'Early flint inbred from the Lacaune population (INRA, 1950s), basis of European flint × dent hybrids.', { ...I, origin: 'France' }),
  v('f252', 'F252 (INRA)', 'mays', [], 13, 24, 1, 110, 165, ['inbred', 'flint'], 'Lignée cornée INRA, référence des études européennes.', 'INRA flint inbred, a reference for European studies.', { ...I, origin: 'France' }),
  v('wf9-cmst', 'Wf9 cms-T', 'mays', ['Pwr'], 14, 26, 1, 118, 185, ['inbred', 'dent'], 'Lignée à cytoplasme T, mâle stérile : on n’avait plus besoin de castrer les panicules… jusqu’à l’épidémie d’helminthosporiose race T de 1970.', 'T-cytoplasm, male-sterile inbred: no more detasseling… until the 1970 southern corn leaf blight race T epidemic.', { ...I, cyto: 'T', origin: 'USA' }),
  v('rf1-line', 'Lignée restauratrice Rf1', 'mays', ['Rf1'], 14, 26, 1, 118, 190, ['inbred', 'dent'], 'Lignée type porteuse du restaurateur Rf1 : croisée sur une mère cms-T, elle rend un hybride fertile.', 'Model line carrying the Rf1 restorer: on a cms-T mother, it gives a fertile hybrid.', { ...I }),
  v('b73ht', 'B73Ht', 'mays', ['Pwr', 'Ht1'], 15, 26, 1, 125, 200, ['inbred', 'dent'], 'B73 convertie avec le gène Ht1 contre l’helminthosporiose du Nord.', 'B73 converted with the Ht1 gene against northern leaf blight.', { ...I, origin: 'USA' }),
  v('rp1d-line', 'Lignée Rp1-D', 'mays', ['Rp1'], 14, 25, 1, 118, 190, ['inbred', 'dent'], 'Lignée type portant Rp1-D, résistance à la rouille commune.', 'Model line carrying Rp1-D, common rust resistance.', { ...I }),
  // --- Stocks génétiques ----------------------------------------------------------
  v('stock-a1-sh2', 'Stock a1 sh2', 'mays', ['R1', 'a1', 'sh2'], 12, 15, 1, 115, 160, ['inbred', 'sweet'], 'Grains incolores ET ratatinés : a1 et sh2 sont presque collés sur le chromosome 3. Croisé avec W22, la F2 ne donne presque que les deux types parentaux.', 'Colourless AND shrunken kernels: a1 and sh2 sit almost together on chromosome 3. Crossed with W22, the F2 gives almost only the parental types.', { ...I, origin: 'Maize COOP' }),
  v('stock-c1-wx1', 'Stock c1 wx1', 'mays', ['R1', 'c1', 'wx1'], 12, 20, 1, 115, 160, ['inbred', 'specialty'], 'Le croisement de Creighton et McClintock (1931) : c1 et wx1 sont à 30 cM sur le chromosome 9, les recombinants se comptent sur l’épi.', 'Creighton and McClintock’s cross (1931): c1 and wx1 are 30 cM apart on chromosome 9, recombinants are counted on the ear.', { ...I, origin: 'Maize COOP' }),
  v('stock-pvv', 'P1-vv (Ac)', 'mays', ['Pvv'], 13, 22, 1, 115, 170, ['inbred', 'dent'], 'Péricarpe panaché par le transposon Ac ; environ 1 % des graines de la descendance « réparent » l’allèle et donnent des épis rouges.', 'Pericarp variegated by the Ac transposon; about 1% of offspring “repair” the allele and give red ears.', { ...I, origin: 'Maize COOP' }),
  v('stock-ci', 'C1-I (inhibiteur)', 'mays', ['R1', 'CI'], 12, 22, 1, 115, 165, ['inbred', 'dent'], 'Inhibiteur dominant de la couleur : grains jaunes malgré A1 et R1.', 'Dominant colour inhibitor: yellow kernels despite A1 and R1.', { ...I, origin: 'Maize COOP' }),
  v('stock-bz1', 'bz1 (bronze)', 'mays', ['R1', 'bz1'], 12, 22, 1, 115, 165, ['inbred', 'dent'], 'Aleurone bronze : la dernière enzyme de la voie manque.', 'Bronze aleurone: the last pathway enzyme is missing.', { ...I, origin: 'Maize COOP' }),
  v('stock-pr1', 'pr1 (aleurone rouge)', 'mays', ['R1', 'pr1'], 12, 22, 1, 115, 165, ['inbred', 'dent'], 'Aleurone rouge au lieu de violette.', 'Red instead of purple aleurone.', { ...I, origin: 'Maize COOP' }),
  v('stock-b1pl1', 'B1 Pl1 (plante pourpre)', 'mays', ['B1', 'Pl1', 'R1'], 12, 22, 1, 115, 170, ['inbred', 'dent'], 'Plante entièrement pourpre (tiges, gaines, panicule), grains violets.', 'Fully purple plant (stalks, sheaths, tassel), purple kernels.', { ...I, origin: 'Maize COOP' }),
  v('stock-d1', 'd1 (nain)', 'mays', ['d1'], 8, 18, 1, 115, 60, ['inbred', 'dent'], 'Nain par manque de gibbérellines : un maïs d’un demi-mètre.', 'Gibberellin-deficient dwarf: a half-metre maize.', { ...I, origin: 'Maize COOP' }),
  v('stock-br2', 'br2 (brachytique)', 'mays', ['br2'], 14, 24, 1, 118, 120, ['inbred', 'dent'], 'Tige courte et trapue, épi normal : une piste contre la verse.', 'Short, stocky stalk with a normal ear: an idea against lodging.', { ...I, origin: 'Maize COOP' }),
  // --- Dentés et cornés (populations) ------------------------------------------------
  v('reids-yellow-dent', 'Reid’s Yellow Dent', 'mays', ['Pwr'], 22, 33, 1, 120, 300, ['dent'], 'Population de l’Illinois (1846), ancêtre de la plupart des maïs de la Corn Belt (et de B73).', 'Illinois population (1846), ancestor of most Corn Belt maize (and of B73).', { origin: 'USA' }),
  v('lancaster', 'Lancaster Sure Crop', 'mays', ['Pwr'], 21, 32, 1, 125, 300, ['dent'], 'Population de Pennsylvanie, l’autre grand réservoir des lignées américaines (Mo17).', 'Pennsylvania population, the other great source of US inbreds (Mo17).', { origin: 'USA' }),
  v('boone-county-white', 'Boone County White', 'mays', ['y1'], 25, 38, 1, 130, 330, ['dent'], 'Grand maïs denté blanc, pour la farine et le hominy.', 'Tall white dent, for meal and hominy.', { origin: 'USA' }),
  v('hickory-king', 'Hickory King', 'mays', ['y1'], 22, 45, 1, 120, 330, ['dent'], 'Grains blancs énormes, si larges que quatre rangs suffisent.', 'Huge white kernels, so wide that a few rows fill the ear.', { origin: 'USA' }),
  v('bloody-butcher', 'Bloody Butcher', 'mays', ['Prr'], 22, 34, 2, 120, 300, ['dent'], 'Denté rouge sang de Virginie (1845) : la couleur est dans le péricarpe, donc celle de la mère.', 'Blood-red Virginia dent (1845): the colour is in the pericarp, so it’s the mother’s.', { origin: 'USA' }),
  v('jala', 'Jala', 'mays', ['y1'], 30, 45, 1, 150, 400, ['dent'], 'Race mexicaine aux épis les plus longs du monde (plus de 40 cm), plante de plus de 4 m.', 'Mexican race with the world’s longest ears (over 40 cm), on plants over 4 m tall.', { origin: 'Mexique' }),
  v('grand-roux-basque', 'Grand Roux Basque', 'mays', ['Prr'], 18, 30, 1, 120, 250, ['flint'], 'Population corné rouge du Pays basque, pour la farine et le méture.', 'Red Basque flint population, for meal and the traditional méture bread.', { origin: 'France' }),
  v('lacaune', 'Maïs de Lacaune', 'mays', [], 16, 26, 1, 105, 200, ['flint'], 'Population cornée précoce des monts de Lacaune, d’où l’INRA a tiré la lignée F2.', 'Early flint population from the Lacaune hills, from which INRA drew the F2 inbred.', { origin: 'France' }),
  v('ottofile', 'Ottofile', 'mays', ['Pwr'], 20, 32, 2, 115, 240, ['flint'], 'Corné à huit rangs du Nord de l’Italie, pour la polenta.', 'Eight-rowed northern Italian flint, for polenta.', { origin: 'Italie' }),
  v('marano', 'Marano Vicentino', 'mays', [], 20, 30, 1, 110, 230, ['flint'], 'Corné orange de Vénétie (1890), polenta célèbre.', 'Orange Veneto flint (1890), famous for polenta.', { origin: 'Italie' }),
  v('biancoperla', 'Biancoperla', 'mays', ['y1'], 20, 30, 1, 120, 250, ['flint'], 'Corné blanc nacré de Vénétie, polenta blanche.', 'Pearly white Veneto flint, for white polenta.', { origin: 'Italie' }),
  v('rostrato-rosso', 'Rostrato Rosso', 'mays', ['Prr'], 18, 28, 1, 120, 230, ['flint'], 'Corné rouge à grains « en bec » de Lombardie.', 'Red Lombardy flint with beaked kernels.', { origin: 'Italie' }),
  // --- Farineux et multicolores ------------------------------------------------------
  v('hopi-blue', 'Hopi Blue', 'mays', ['R1', 'y1'], 18, 32, 2, 110, 180, ['flour'], 'Maïs farineux bleu des Hopis : aleurone violette sur albumen blanc.', 'Hopi blue flour corn: purple aleurone over white endosperm.', { origin: 'USA' }),
  v('painted-mountain', 'Painted Mountain', 'mays', [], 16, 30, 2, 90, 150, ['flour'], 'Population multicolore très précoce du Montana : ses épis mélangent grains violets, rouges, bleus, jaunes et blancs.', 'Very early multicoloured Montana population: its ears mix purple, red, blue, yellow and white kernels.', { het: ['R1', 'y1', 'pr1'], origin: 'USA' }),
  v('mandan-bride', 'Mandan Bride', 'mays', [], 15, 30, 2, 95, 150, ['flour'], 'Farineux multicolore des Mandans du Dakota.', 'Multicoloured flour corn of the Mandan people of Dakota.', { het: ['R1', 'y1'], origin: 'USA' }),
  v('kculli', 'Kculli (maïs violet)', 'mays', ['R1'], 16, 40, 1, 150, 200, ['flour'], 'Maïs violet des Andes, base de la chicha morada (simplifié ici en aleurone violette).', 'Andean purple corn, used for chicha morada (simplified here as purple aleurone).', { origin: 'Pérou' }),
  v('cuzco', 'Cuzco Gigante', 'mays', ['y1'], 16, 58, 1, 160, 200, ['flour'], 'Grains blancs géants des Andes (choclo), les plus gros du monde.', 'Giant white Andean kernels (choclo), the world’s largest.', { origin: 'Pérou' }),
  // --- Doux ---------------------------------------------------------------------------
  v('golden-bantam', 'Golden Bantam', 'mays', ['su1'], 16, 14, 2, 85, 170, ['sweet'], 'Le maïs doux jaune qui a tout changé (Burpee, 1902) ; avant lui, les maïs doux étaient blancs.', 'The yellow sweet corn that changed everything (Burpee, 1902); before it, sweet corn was white.', { origin: 'USA' }),
  v('stowells', 'Stowell’s Evergreen', 'mays', ['su1', 'y1'], 20, 18, 1, 95, 230, ['sweet'], 'Maïs doux blanc de 1848, longtemps la référence.', 'White sweet corn from 1848, long the standard.', { origin: 'USA' }),
  v('country-gentleman', 'Country Gentleman', 'mays', ['su1', 'y1'], 18, 16, 2, 95, 220, ['sweet'], 'Maïs doux « shoepeg » aux grains blancs en désordre.', '“Shoepeg” sweet corn with jumbled white kernels.', { origin: 'USA' }),
  v('black-aztec', 'Black Aztec', 'mays', ['su1', 'R1'], 18, 18, 1, 95, 180, ['sweet'], 'Maïs doux blanc en frais, violet-noir à maturité.', 'Sweet corn that is white when fresh, purple-black when ripe.', { origin: 'USA' }),
  v('golden-cross-bantam', 'Golden Cross Bantam F1', 'mays', ['su1'], 18, 15, 1, 88, 190, ['sweet'], 'Le premier maïs doux hybride (1933), résistant au flétrissement de Stewart.', 'The first hybrid sweet corn (1933), resistant to Stewart’s wilt.', { hybrid: true, origin: 'USA' }),
  v('silver-queen', 'Silver Queen F1', 'mays', ['su1', 'y1'], 21, 16, 1, 92, 230, ['sweet'], 'Hybride doux blanc mythique (1955).', 'Legendary white sweet hybrid (1955).', { hybrid: true, origin: 'USA' }),
  v('peaches-cream', 'Peaches and Cream F1', 'mays', ['su1'], 20, 15, 1, 83, 180, ['sweet'], 'Maïs doux bicolore : la plante est Y1/y1, son épi montre 3 grains jaunes pour 1 blanc. La xénie à table !', 'Bicolour sweet corn: the plant is Y1/y1, so its ear shows 3 yellow kernels for 1 white. Xenia at the dinner table!', { hybrid: true, het: ['y1'], origin: 'USA' }),
  v('illini-xtra-sweet', 'Illini Xtra Sweet F1', 'mays', ['sh2'], 20, 12, 1, 85, 190, ['sweet'], 'Le premier super-doux (sh2, années 1960) : à isoler des autres maïs, sinon ses grains deviennent farineux.', 'The first supersweet (sh2, 1960s): isolate it from other corn, or its kernels turn starchy.', { hybrid: true, origin: 'USA' }),
  // --- Pop-corns ---------------------------------------------------------------------
  v('strawberry-pop', 'Strawberry (pop-corn)', 'mays', ['Prr', 'Ga1S'], 6, 9, 3, 100, 160, ['pop'], 'Petits épis rouges en forme de fraise ; ses soies Ga1-s rejettent le pollen des maïs ordinaires.', 'Small red strawberry-shaped ears; its Ga1-s silks reject pollen from ordinary corn.', { origin: 'USA' }),
  v('japanese-hulless', 'Japanese Hulless', 'mays', ['y1', 'Ga1S'], 10, 10, 3, 105, 170, ['pop'], 'Pop-corn blanc à grains pointus, presque sans peau après éclatement.', 'White pointed popcorn, almost hull-less once popped.', { origin: 'Japon / USA' }),
  v('tom-thumb', 'Tom Thumb', 'mays', ['Ga1S'], 6, 10, 3, 85, 90, ['pop'], 'Pop-corn nain très précoce du New Hampshire.', 'Very early dwarf popcorn from New Hampshire.', { origin: 'USA' }),
  v('glass-gem', 'Glass Gem', 'mays', ['Ga1S'], 12, 12, 2, 110, 200, ['pop'], 'Pop-corn aux grains translucides de toutes les couleurs, sélectionné par Carl Barnes à partir de maïs amérindiens.', 'Popcorn with translucent kernels of every colour, selected by Carl Barnes from Native American corn.', { het: ['R1', 'y1', 'pr1', 'bz1'], origin: 'USA' }),
  // --- Spéciaux ------------------------------------------------------------------------
  v('waxy-nuo', 'Maïs cireux « nuo »', 'mays', ['wx1', 'y1'], 16, 22, 1, 95, 190, ['specialty'], 'Maïs gluant d’Asie (amidon 100 % amylopectine), mangé en épi frais.', 'Asian sticky corn (100% amylopectin starch), eaten fresh on the cob.', { origin: 'Chine' }),
  v('obatanpa', 'Obatanpa (QPM)', 'mays', ['o2', 'y1'], 20, 30, 1, 115, 230, ['specialty'], 'Maïs à protéines de qualité (opaque-2) du Ghana (1992), deux fois plus riche en lysine.', 'Quality protein maize (opaque-2) from Ghana (1992), twice the lysine.', { origin: 'Ghana' }),
  // --- Téosintes et Tripsacum ---------------------------------------------------------------
  v('parviglumis', 'Téosinte de Balsas', 'parviglumis', ['tbT', 'TgaT'], 6, 7, 12, 165, 280, ['wild'], 'L’ancêtre du maïs : une touffe ramifiée, des dizaines d’épis minuscules à deux rangs, chaque grain enfermé dans une coque dure. Fleurit en jours courts (automne).', 'Maize’s ancestor: a branched clump, dozens of tiny two-rowed ears, each kernel locked in a hard case. Flowers on short days (autumn).', { origin: 'Mexique (Guerrero)' }),
  v('mexicana', 'Téosinte de Chalco', 'mexicana', ['tbT', 'TgaT'], 7, 8, 10, 145, 220, ['wild'], 'Téosinte des hauts plateaux, adventice qui imite le maïs dans les champs ; beaucoup de populations rejettent le pollen du maïs (Tcb1).', 'Highland teosinte, a weed that mimics maize in fields; many populations reject maize pollen (Tcb1).', { origin: 'Mexique' }),
  v('diploperennis', 'Zea diploperennis', 'diploperennis', ['tbT', 'TgaT'], 6, 7, 15, 170, 200, ['wild'], 'Téosinte vivace découvert en 1978 dans la sierra de Manantlán, résistant à plusieurs virus.', 'Perennial teosinte found in 1978 in the Sierra de Manantlán, resistant to several viruses.', { origin: 'Mexique (Jalisco)' }),
  v('tripsacum', 'Tripsacum dactyloides', 'tripsacum', [], 15, 5, 20, 120, 200, ['wild'], 'Herbe gama, graminée vivace des prairies américaines ; cousin éloigné, croisé avec le maïs seulement au laboratoire.', 'Eastern gamagrass, a perennial prairie grass; a distant cousin crossed with maize only in the lab.', { origin: 'USA' }),
];

export const VARIETY_BY_ID: Record<string, MzVariety> = Object.fromEntries(MZ_VARIETIES.map((x) => [x.id, x]));
