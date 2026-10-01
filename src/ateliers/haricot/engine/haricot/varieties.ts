/**
 * Bibliothèque de variétés de haricots (5 espèces de Phaseolus).
 *
 * Il n’existe pas de base de données ouverte des génotypes de variétés de
 * haricots : ce catalogue est compilé à la main d’après des catalogues de
 * semenciers (Kokopelli, Baker Creek, Seed Savers Exchange, Johnny’s,
 * Semences du Portage), les fiches des IGP et AOP françaises (Tarbais,
 * Coco de Paimpol, Mogette de Vendée) et, pour les lignées donneuses de
 * résistances, les publications qui les décrivent (Bean Improvement
 * Cooperative).
 *
 * Valeurs chiffrées = ordres de grandeur. Génotypes = DÉDUITS du phénotype
 * (couleur et motif de la graine, couleur de la fleur et de la gousse, port,
 * fil) avec le modèle simplifié de loci.ts : la couleur réelle d’une
 * variété peut faire intervenir d’autres gènes. Les résistances ne sont
 * attribuées qu’aux lignées où elles sont publiées. Le haricot étant
 * autogame, il n’existe pratiquement pas d’hybrides F1 du commerce.
 */

import type { QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type BeanKind = 'filet' | 'snap' | 'wax' | 'shell' | 'dry' | 'runner' | 'lima' | 'donor';
export const BEAN_KINDS: BeanKind[] = ['filet', 'snap', 'wax', 'shell', 'dry', 'runner', 'lima', 'donor'];

export interface BeanVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  variants: VariantId[];
  /** Poids de 100 graines (g). */
  seed100: number;
  podCm: number;
  pods: number;
  /** Jours du semis aux premières gousses mangeables. */
  days: number;
  heightCm: number;
  kinds: BeanKind[];
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<BeanVariety, 'hybrid' | 'origin'>>;

function v(
  id: string,
  name: string,
  species: SpeciesId,
  variants: VariantId[],
  seed100: number,
  podCm: number,
  pods: number,
  days: number,
  heightCm: number,
  kinds: BeanKind[],
  fr: string,
  en: string,
  opt: Opt = {}
): BeanVariety {
  return { id, name, species, variants, seed100, podCm, pods, days, heightCm, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

// Raccourcis : nain, sans fil, graine blanche, noire, brune, rouge, jaune
const N: VariantId = 'fin';
const S: VariantId = 'St';
const W: VariantId[] = ['p'];
const BK: VariantId[] = ['G', 'B'];
const BR: VariantId[] = ['v', 'G', 'B'];
const RD: VariantId[] = ['v', 'R'];
const YE: VariantId[] = ['v', 'G'];

export const BEAN_VARIETIES: BeanVariety[] = [
  // --- Haricots verts nains (filets, mangetout) ---------------------------------
  v('provider', 'Provider', 'vulgaris', [N, S], 30, 14, 35, 50, 45, ['snap'], 'Haricot vert nain très précoce et rustique, lève même en sol frais ; graines violettes.', 'Very early, hardy bush snap bean that germinates even in cool soil; purple seeds.', { origin: 'USA' }),
  v('blue-lake-274', 'Blue Lake 274', 'vulgaris', [N, S, ...W], 30, 15, 35, 55, 45, ['snap'], 'Version naine du célèbre Blue Lake : gousses rondes charnues, graines blanches.', 'Bush version of the famous Blue Lake: fleshy round pods, white seeds.', { origin: 'USA' }),
  v('burpee-stringless', 'Burpee’s Stringless Green Pod', 'vulgaris', [N, S, ...BR], 35, 14, 30, 52, 45, ['snap'], 'Le premier haricot vert « sans fil » (Calvin Keeney, 1894) : c’est le gène St.', 'The first “stringless” green bean (Calvin Keeney, 1894): the St gene.', { origin: 'USA' }),
  v('black-valentine', 'Black Valentine', 'vulgaris', [N, ...BK], 28, 15, 30, 52, 45, ['snap', 'dry'], 'Ancien haricot vert (1850) à graines noires, aussi utilisé en sec.', 'Old (1850) snap bean with black seeds, also used dry.', { origin: 'USA' }),
  v('royal-burgundy', 'Royal Burgundy', 'vulgaris', [N, S, 'Prp'], 30, 14, 30, 55, 45, ['snap'], 'Gousses violettes qui verdissent à la cuisson (Prp) ; lève bien en sol frais.', 'Purple pods that turn green when cooked (Prp); germinates well in cool soil.', { origin: 'USA' }),
  v('purple-teepee', 'Purple Teepee', 'vulgaris', [N, S, 'Prp'], 30, 14, 35, 55, 40, ['snap'], 'Gousses violettes portées au-dessus du feuillage, faciles à cueillir.', 'Purple pods held above the foliage, easy to pick.', { origin: 'Europe' }),
  v('roma-ii', 'Roma II', 'vulgaris', [N, S, ...W], 35, 16, 30, 55, 50, ['snap'], 'Mangetout plat de type italien, nain.', 'Flat Italian-type bush snap bean.', { origin: 'USA' }),
  v('imuna', 'Imuna', 'vulgaris', [N, S, 'I'], 28, 13, 35, 55, 45, ['filet', 'donor'], 'Haricot vert nain hollandais dont le nom vient de son gène I de résistance à la mosaïque.', 'Dutch bush snap bean named after its I gene for mosaic resistance.', { origin: 'Pays-Bas' }),
  // --- Haricots beurre ----------------------------------------------------------------
  v('rocquencourt', 'Beurre de Rocquencourt', 'vulgaris', [N, 'y', ...BK], 28, 13, 30, 55, 45, ['wax'], 'Le haricot beurre français classique, précoce, graines noires.', 'The classic French wax bean, early, black seeds.', { origin: 'France' }),
  v('cherokee-wax', 'Cherokee Wax', 'vulgaris', [N, S, 'y', ...BK], 28, 14, 35, 52, 45, ['wax'], 'Haricot beurre sans fil, lauréat All-America Selections, graines noires.', 'Stringless wax bean, All-America Selections winner, black seeds.', { origin: 'USA' }),
  v('pencil-pod-wax', 'Pencil Pod Black Wax', 'vulgaris', [N, 'y', ...BK], 28, 15, 30, 55, 45, ['wax'], 'Gousses jaunes fines comme un crayon (1900).', 'Pencil-thin yellow pods (1900).', { origin: 'USA' }),
  v('dragon-langerie', 'Dragon Langerie (Dragon Tongue)', 'vulgaris', [N, 'y', 'Cst', ...BR], 35, 16, 30, 58, 45, ['wax', 'shell'], 'Gousses plates jaunes striées de violet (y + Cst) ; graines marbrées.', 'Flat yellow pods streaked purple (y + Cst); marbled seeds.', { origin: 'Pays-Bas' }),
  v('neckargold', 'Neckargold', 'vulgaris', [S, 'y', ...W], 30, 20, 60, 65, 250, ['wax'], 'Haricot beurre à rames, longues gousses rondes, graines blanches.', 'Pole wax bean, long round pods, white seeds.', { origin: 'Allemagne' }),
  // --- Haricots à rames (verts) ----------------------------------------------------------
  v('blue-lake', 'Blue Lake (à rames)', 'vulgaris', [S, ...W], 30, 16, 70, 63, 250, ['snap'], 'Haricot à rames de référence pour la conserve, graines blanches.', 'The reference pole bean for canning, white seeds.', { origin: 'USA' }),
  v('kentucky-wonder', 'Kentucky Wonder', 'vulgaris', [...BR], 35, 20, 60, 65, 250, ['snap', 'dry'], 'Ancien haricot à rames (1864) avec fil, gousses plates savoureuses.', 'Old (1864) pole bean with strings, tasty flat pods.', { origin: 'USA' }),
  v('helda', 'Helda', 'vulgaris', [S, ...W], 40, 24, 50, 60, 250, ['snap'], 'Mangetout plat à rames, très long (type Romano).', 'Flat pole snap, very long (Romano type).', { origin: 'Pays-Bas' }),
  v('rattlesnake', 'Rattlesnake', 'vulgaris', ['Cst', ...BR], 40, 18, 60, 65, 250, ['snap', 'dry'], 'Gousses vertes striées de violet ; graines beiges mouchetées de brun.', 'Green pods streaked purple; beige seeds speckled brown.', { origin: 'USA' }),
  v('trail-of-tears', 'Cherokee Trail of Tears', 'vulgaris', [...BK], 25, 14, 60, 65, 250, ['snap', 'dry'], 'Haricot noir emporté par les Cherokees lors de leur déportation (1838).', 'Black bean carried by the Cherokee on their forced removal (1838).', { origin: 'USA' }),
  v('trionfo-violetto', 'Trionfo Violetto', 'vulgaris', ['Prp'], 35, 18, 60, 65, 250, ['snap'], 'Haricot à rames italien aux gousses violettes et fleurs lilas.', 'Italian pole bean with purple pods and lilac flowers.', { origin: 'Italie' }),
  v('lazy-housewife', 'Lazy Housewife', 'vulgaris', [S, ...W], 30, 15, 60, 65, 250, ['snap', 'dry'], 'Ancien haricot à rames allemand (1810) « de la ménagère paresseuse » : gousses en grappes, faciles à cueillir.', 'Old German pole bean (1810) “for the lazy housewife”: pods in clusters, easy to pick.', { origin: 'Allemagne' }),

  // --- Haricots à écosser (frais) ---------------------------------------------------------
  v('coco-de-prague', 'Coco de Prague (Borlotto)', 'vulgaris', ['Cst', ...RD], 55, 13, 45, 70, 250, ['shell', 'dry'], 'Grains crème marbrés de rouge, gousses éclaboussées de rouge à maturité.', 'Cream seeds marbled red, pods splashed red when ripe.', { origin: 'Italie' }),
  v('lingua-di-fuoco', 'Borlotto Lingua di Fuoco', 'vulgaris', [N, 'Cst', ...RD], 55, 14, 25, 65, 50, ['shell', 'dry'], '« Langue de feu » : borlotto nain aux gousses très colorées.', '“Tongue of fire”: bush borlotto with very colourful pods.', { origin: 'Italie' }),
  v('coco-de-paimpol', 'Coco de Paimpol', 'vulgaris', [N, ...W], 45, 13, 25, 75, 55, ['shell'], 'Coco blanc demi-nain, AOP bretonne, écossé frais en été.', 'Semi-dwarf white shell bean, Breton PDO, shelled fresh in summer.', { origin: 'France' }),
  v('coco-blanc', 'Coco blanc à rames', 'vulgaris', [...W], 45, 13, 50, 75, 250, ['shell', 'dry'], 'Coco blanc rond, frais ou sec.', 'Round white shell bean, fresh or dry.', { origin: 'France' }),
  v('flageolet-chevrier', 'Flageolet Chevrier', 'vulgaris', [N, ...W], 30, 13, 30, 70, 45, ['shell', 'dry'], 'Flageolet vert (1872) : grains blancs qui restent verts s’ils sèchent à l’ombre.', 'Green flageolet (1872): white seeds that stay green when dried in the shade.', { origin: 'France' }),
  v('cranberry', 'Cranberry (Wren’s Egg)', 'vulgaris', [N, 'Cst', ...RD], 50, 13, 25, 68, 50, ['shell', 'dry'], 'Grains crème mouchetés de rouge, « œufs de roitelet ».', 'Cream seeds speckled red, “wren’s eggs”.', { origin: 'USA' }),
  v('tigers-eye', 'Tiger’s Eye', 'vulgaris', [N, 'Cst', ...YE], 45, 12, 25, 75, 50, ['shell', 'dry'], 'Grains dorés zébrés, peau très fine.', 'Golden striped seeds, very thin skin.', { origin: 'Chili / Argentine' }),

  // --- Haricots secs -----------------------------------------------------------------------
  v('tarbais', 'Haricot Tarbais', 'vulgaris', [...W], 70, 14, 45, 80, 300, ['dry'], 'Gros haricot blanc à rames (IGP), cultivé sur le maïs ; pour le cassoulet.', 'Large white pole bean (PGI), grown up maize; for cassoulet.', { origin: 'France' }),
  v('soissons', 'Gros de Soissons', 'vulgaris', [...W], 90, 15, 40, 80, 300, ['dry'], 'Très gros haricot blanc plat de Picardie.', 'Very large flat white bean from Picardy.', { origin: 'France' }),
  v('lingot', 'Lingot', 'vulgaris', [N, ...W], 45, 12, 30, 75, 50, ['dry'], 'Haricot blanc allongé du cassoulet de Castelnaudary.', 'Elongated white bean of Castelnaudary cassoulet.', { origin: 'France' }),
  v('mogette', 'Mogette de Vendée', 'vulgaris', [N, ...W], 40, 12, 30, 75, 50, ['dry'], 'Haricot blanc plat de Vendée (IGP).', 'Flat white bean from Vendée (PGI).', { origin: 'France' }),
  v('cannellini', 'Cannellini', 'vulgaris', [N, ...W], 50, 12, 25, 75, 50, ['dry'], 'Haricot blanc en rognon de Toscane.', 'Tuscan white kidney bean.', { origin: 'Italie' }),
  v('navy', 'Navy (Michelite)', 'vulgaris', [N, ...W], 18, 10, 35, 70, 45, ['dry'], 'Petit haricot blanc des « baked beans ».', 'Small white bean of baked beans.', { origin: 'USA' }),
  v('great-northern', 'Great Northern', 'vulgaris', [...W], 35, 12, 40, 75, 200, ['dry'], 'Haricot blanc moyen des Grandes Plaines.', 'Medium white bean of the Great Plains.', { origin: 'USA' }),
  v('black-turtle', 'Black Turtle', 'vulgaris', [N, ...BK], 20, 10, 35, 70, 50, ['dry'], 'Petit haricot noir de la cuisine latino-américaine.', 'Small black bean of Latin American cooking.', { origin: 'Amérique latine' }),
  v('dark-red-kidney', 'Dark Red Kidney', 'vulgaris', [N, ...RD], 55, 13, 25, 75, 50, ['dry'], 'Haricot rouge en rognon, à bien cuire (riche en lectines).', 'Red kidney bean, to be well cooked (rich in lectins).', { origin: 'USA' }),
  v('pinto', 'Pinto', 'vulgaris', [N, 'Cst', ...BR], 35, 12, 30, 75, 50, ['dry'], 'Beige moucheté de brun (« peint ») ; le haricot le plus consommé aux États-Unis.', 'Beige speckled brown (“painted”); the most eaten bean in the USA.', { origin: 'Mexique / USA' }),
  v('mayocoba', 'Mayocoba (Canario)', 'vulgaris', [N, ...YE], 35, 12, 30, 75, 50, ['dry'], 'Haricot jaune pâle du Mexique et du Pérou.', 'Pale yellow bean of Mexico and Peru.', { origin: 'Mexique / Pérou' }),
  v('yellow-eye', 'Yellow Eye (Steuben)', 'vulgaris', [N, 't', ...YE], 45, 12, 30, 75, 50, ['dry'], 'Blanc avec un œil jaune-brun (t) ; baked beans du Maine.', 'White with a yellow-brown eye (t); Maine baked beans.', { origin: 'USA' }),
  v('soldier', 'Soldier', 'vulgaris', ['t', ...RD], 45, 13, 45, 75, 150, ['dry'], 'Blanc avec un « petit soldat » rouge autour du hile.', 'White with a little red “soldier” around the hilum.', { origin: 'USA' }),
  v('orca', 'Orca (Calypso)', 'vulgaris', [N, 't', ...BK], 45, 12, 30, 75, 50, ['dry'], 'Noir et blanc comme une orque.', 'Black and white like an orca.', { origin: 'Caraïbes' }),
  v('jacobs-cattle', 'Jacob’s Cattle', 'vulgaris', [N, 't', 'Cst', ...RD], 50, 12, 30, 75, 50, ['dry'], 'Blanc éclaboussé de rouge, « troupeau de Jacob ».', 'White splashed red, “Jacob’s cattle”.', { origin: 'USA' }),
  v('hidatsa-shield', 'Hidatsa Shield Figure', 'vulgaris', ['t', ...RD], 45, 12, 45, 80, 200, ['dry'], 'Haricot à rames des Hidatsa (Dakota), dessin de « bouclier » sur la graine.', 'Hidatsa (Dakota) pole bean, “shield” pattern on the seed.', { origin: 'USA' }),
  v('good-mother-stallard', 'Good Mother Stallard', 'vulgaris', ['Cst', ...RD], 50, 13, 45, 80, 250, ['dry'], 'Grains marron marbrés de blanc, à rames.', 'Maroon seeds marbled white, pole.', { origin: 'USA' }),

  // --- Lignées donneuses (résistances) -----------------------------------------------
  v('cornell-49242', 'Cornell 49242 (Co-2, « Are »)', 'vulgaris', [N, 'Co2', ...BK], 20, 10, 30, 70, 50, ['donor', 'dry'], 'Lignée noire source du gène Are (Co-2) contre l’anthracnose, introduit dans de nombreux haricots européens.', 'Black line, source of the Are (Co-2) anthracnose gene, bred into many European beans.', { origin: 'Venezuela / USA' }),
  v('ivt-7214', 'IVT 7214 (bc-3)', 'vulgaris', [N, 'bc3', ...W], 25, 11, 30, 65, 50, ['donor'], 'Lignée hollandaise porteuse de bc-3, résistance à toutes les souches de mosaïque.', 'Dutch line carrying bc-3, resistance to every mosaic strain.', { origin: 'Pays-Bas' }),
  v('aurora', 'Aurora (Ur-3)', 'vulgaris', [N, 'Ur3', ...W], 18, 10, 35, 70, 45, ['donor', 'dry'], 'Petit haricot blanc porteur du gène Ur-3 contre la rouille.', 'Small white bean carrying the Ur-3 rust gene.', { origin: 'USA' }),
  v('red-mexican', 'Red Mexican UI-3 (Pse-1)', 'vulgaris', [N, 'Pse1', ...RD], 30, 11, 30, 72, 50, ['donor', 'dry'], 'Petit haricot rouge, source de résistance à la graisse (Pse-1).', 'Small red bean, source of halo blight resistance (Pse-1).', { origin: 'USA' }),

  // --- P. coccineus (haricot d’Espagne) -------------------------------------------------
  v('scarlet-emperor', 'Scarlet Emperor', 'coccineus', ['Cst', ...BK], 130, 30, 50, 80, 300, ['runner'], 'Fleurs écarlates, graines violet-noir marbrées ; ornemental et comestible.', 'Scarlet flowers, violet-black marbled seeds; ornamental and edible.', { origin: 'Royaume-Uni' }),
  v('painted-lady', 'Painted Lady', 'coccineus', ['Cst', ...BR], 120, 25, 45, 80, 300, ['runner'], 'Fleurs bicolores rouge et blanc (1855).', 'Red and white bicolour flowers (1855).', { origin: 'Royaume-Uni' }),
  v('white-emergo', 'White Emergo (Espagne blanc)', 'coccineus', [...W], 140, 28, 45, 80, 300, ['runner', 'dry'], 'Fleurs et graines blanches (p).', 'White flowers and seeds (p).', { origin: 'Royaume-Uni' }),
  v('streamline', 'Streamline', 'coccineus', ['Cst', ...BK], 130, 40, 45, 85, 300, ['runner'], 'Très longues gousses de 40 cm.', 'Very long 40 cm pods.', { origin: 'Royaume-Uni' }),
  v('black-runner', 'Black Runner', 'coccineus', [...BK], 130, 28, 45, 80, 300, ['runner', 'dry'], 'Graines noires unies, fleurs écarlates.', 'Plain black seeds, scarlet flowers.', { origin: 'Europe' }),
  v('gigantes', 'Gigantes (Fasolia gigantes)', 'coccineus', [...W], 200, 25, 30, 90, 300, ['runner', 'dry'], 'Énormes haricots blancs grecs, cuisinés au four à la tomate.', 'Huge white Greek beans, baked with tomato.', { origin: 'Grèce' }),
  v('hestia', 'Hestia (nain)', 'coccineus', [N, 'Cst', ...BR], 110, 20, 30, 75, 45, ['runner'], 'Rare haricot d’Espagne NAIN, fleurs bicolores, en pot.', 'Rare DWARF runner bean, bicolour flowers, for pots.', { origin: 'Royaume-Uni' }),

  // --- P. dumosus ---------------------------------------------------------------------
  v('frijol-de-ano', 'Frijol de año (cacha)', 'dumosus', [...BR], 70, 13, 40, 85, 300, ['dry'], 'Haricot vivace des montagnes du Guatemala, entre haricot commun et haricot d’Espagne.', 'Perennial bean of the Guatemalan highlands, between common and runner bean.', { origin: 'Guatemala' }),
  v('dumosus-negro', 'Piloy negro', 'dumosus', [...BK], 65, 12, 40, 85, 300, ['dry'], 'Grains noirs, cultivé en altitude.', 'Black seeds, grown at altitude.', { origin: 'Guatemala' }),

  // --- P. acutifolius (tépari) -----------------------------------------------------------
  v('tepary-white', 'Tépari blanc', 'acutifolius', [...W], 13, 7, 30, 60, 50, ['dry'], 'Haricot du désert de Sonora : supporte chaleur et sécheresse.', 'Sonoran desert bean: tolerates heat and drought.', { origin: 'Mexique / Arizona' }),
  v('tepary-brown', 'Tépari brun', 'acutifolius', [...BR], 13, 7, 30, 60, 50, ['dry'], 'Tépari brun des Tohono O’odham.', 'Brown tepary of the Tohono O’odham.', { origin: 'Arizona' }),
  v('tepary-black', 'Tépari noir', 'acutifolius', [...BK], 12, 7, 30, 60, 50, ['dry'], 'Petit tépari noir.', 'Small black tepary.', { origin: 'Mexique' }),

  // --- P. lunatus (Lima) -------------------------------------------------------------------
  v('henderson-bush', 'Henderson Bush (baby lima)', 'lunatus', [N, ...W], 45, 8, 40, 70, 50, ['lima'], 'Petit Lima nain (1885), le plus facile.', 'Small bush lima (1885), the easiest.', { origin: 'USA' }),
  v('fordhook-242', 'Fordhook 242', 'lunatus', [N, ...W], 85, 10, 30, 75, 55, ['lima'], 'Gros Lima nain résistant à la chaleur.', 'Large heat-tolerant bush lima.', { origin: 'USA' }),
  v('king-of-the-garden', 'King of the Garden', 'lunatus', [...W], 90, 11, 50, 85, 300, ['lima'], 'Grand Lima à rames (1883).', 'Large pole lima (1883).', { origin: 'USA' }),
  v('christmas-lima', 'Christmas Lima (Chestnut)', 'lunatus', ['Cst', ...RD], 110, 11, 40, 90, 300, ['lima'], 'Gros grains marbrés de bordeaux, goût de châtaigne.', 'Large seeds marbled burgundy, chestnut flavour.', { origin: 'USA' }),
  v('big-mama', 'Big Mama', 'lunatus', [...W], 150, 12, 35, 90, 300, ['lima'], 'Lima géant.', 'Giant lima.', { origin: 'USA' }),
];

export const VARIETY_BY_ID: Record<string, BeanVariety> = Object.fromEntries(BEAN_VARIETIES.map((x) => [x.id, x]));
