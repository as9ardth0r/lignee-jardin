/**
 * Bibliothèque de variétés de piments et poivrons (5 espèces de Capsicum).
 *
 * Il n’existe pas de base de données ouverte des génotypes de variétés de
 * piments : ce catalogue est compilé à la main d’après des catalogues de
 * semenciers (Kokopelli, Baker Creek, Johnny’s, Semences du Portage, Real
 * Seeds, Pepper Joe’s), le Chile Pepper Institute (NMSU), la liste des gènes
 * du poivron (Wang & Bosland 2006) et, pour les lignées donneuses de
 * résistances, les publications qui les décrivent.
 *
 * Valeurs chiffrées = ordres de grandeur. Le piquant (unités Scoville) varie
 * énormément selon le climat et la plante : valeurs médianes indicatives.
 * Génotypes = DÉDUITS du phénotype (couleur mûre, fruits dressés…). Les
 * résistances ne sont attribuées qu’aux lignées où elles sont publiées
 * (Tabasco = L2, PI 152225 = Tsw, CM334 = Pvr4, ECW-20R = Bs2…) ; pour les
 * hybrides F1 du commerce, elles sont SUPPOSÉES d’après le code catalogue,
 * à l’état hétérozygote.
 */

import type { QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type PepperKind = 'bell' | 'sweet' | 'paprika' | 'mild' | 'hot' | 'superhot' | 'ornamental' | 'donor';
export const PEPPER_KINDS: PepperKind[] = ['bell', 'sweet', 'paprika', 'mild', 'hot', 'superhot', 'ornamental', 'donor'];

export interface PepperVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  /** Cytoplasme stérilisant (lignée CMS). */
  cms?: boolean;
  variants: VariantId[];
  weightKg: number;
  fruits: number;
  /** Jours de la plantation au premier fruit mûr. */
  days: number;
  /** Piquant (unités Scoville), 0 = doux. */
  shu: number;
  /** Potentiel de piquant masqué d’un poivron doux (pun1). */
  hiddenShu?: number;
  shapeRatio: number;
  heightCm: number;
  kinds: PepperKind[];
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<PepperVariety, 'hybrid' | 'origin' | 'cms' | 'hiddenShu'>>;

function v(
  id: string,
  name: string,
  species: SpeciesId,
  variants: VariantId[],
  grams: number,
  fruits: number,
  days: number,
  shu: number,
  shapeRatio: number,
  heightCm: number,
  kinds: PepperKind[],
  fr: string,
  en: string,
  opt: Opt = {}
): PepperVariety {
  return { id, name, species, variants, weightKg: grams / 1000, fruits, days, shu, shapeRatio, heightCm, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

const P: VariantId = 'pun1';

export const PEPPER_VARIETIES: PepperVariety[] = [
  // --- Poivrons (C. annuum, doux) ---------------------------------------------
  v('california-wonder', 'California Wonder', 'annuum', [P], 180, 8, 88, 0, 1.0, 60, ['bell'], 'Le poivron carré classique (1928) : 4 lobes, vert puis rouge, chair épaisse.', 'The classic blocky bell (1928): four lobes, green then red, thick walls.', { origin: 'USA' }),
  v('golden-california-wonder', 'Golden California Wonder', 'annuum', [P, 'y'], 170, 8, 90, 0, 1.0, 60, ['bell'], 'California Wonder qui mûrit jaune d’or (gène y).', 'California Wonder that ripens golden yellow (y gene).', { origin: 'USA' }),
  v('yolo-wonder', 'Yolo Wonder', 'annuum', [P, 'L1'], 200, 7, 88, 0, 0.95, 60, ['bell'], 'Poivron carré résistant à la mosaïque du tabac (L1).', 'Blocky bell resistant to tobacco mosaic (L1).', { origin: 'USA' }),
  v('quadrato-asti-rosso', 'Quadrato d’Asti Rosso', 'annuum', [P], 260, 6, 92, 0, 1.0, 70, ['bell'], 'Gros poivron carré piémontais, très charnu.', 'Large, very fleshy blocky pepper from Piedmont.', { origin: 'Italie' }),
  v('quadrato-asti-giallo', 'Quadrato d’Asti Giallo', 'annuum', [P, 'y'], 260, 6, 92, 0, 1.0, 70, ['bell'], 'La version jaune du Quadrato d’Asti.', 'The yellow Quadrato d’Asti.', { origin: 'Italie' }),
  v('orange-sun', 'Orange Sun', 'annuum', [P, 'c2'], 180, 7, 90, 0, 1.0, 60, ['bell'], 'Poivron carré qui mûrit orange vif.', 'Blocky bell ripening bright orange.', { origin: 'USA' }),
  v('purple-beauty', 'Purple Beauty', 'annuum', [P, 'A'], 150, 8, 88, 0, 1.0, 55, ['bell'], 'Fruit violet foncé avant maturité (gène A), puis rouge ; fleurs violettes.', 'Deep purple before ripening (A gene), then red; purple flowers.', { origin: 'USA' }),
  v('sweet-chocolate', 'Sweet Chocolate', 'annuum', [P, 'cl'], 110, 10, 85, 0, 1.3, 60, ['bell'], 'Mûrit brun chocolat : rouge + chlorophylle retenue (cl) ; chair rouge.', 'Ripens chocolate brown: red + retained chlorophyll (cl); red flesh.', { origin: 'USA' }),
  v('albino-bell', 'Albino', 'annuum', [P, 'sw'], 90, 9, 82, 0, 1.1, 50, ['bell'], 'Petit poivron blanc ivoire à l’état jeune (sw), rouge à maturité ; précoce.', 'Small bell, ivory when young (sw), red when ripe; early.', { origin: 'Hongrie' }),
  v('mini-bell-red', 'Mini Bell Red', 'annuum', [P], 25, 30, 75, 0, 1.0, 50, ['bell'], 'Poivron miniature de 4 cm, parfait en pot.', '4 cm miniature bell, perfect in a pot.', { origin: 'USA' }),
  v('lamuyo', 'Lamuyo (type)', 'annuum', [P, 'L1'], 230, 7, 92, 0, 1.8, 75, ['bell'], 'Le poivron rectangulaire long créé à l’INRA d’Avignon, référence en France.', 'The long rectangular bell bred at INRA Avignon, a French standard.', { origin: 'France' }),
  v('doux-d-espagne', 'Doux d’Espagne', 'annuum', [P], 160, 8, 90, 0, 2.0, 65, ['bell'], 'Poivron allongé à pointe, chair épaisse et douce.', 'Elongated pointed bell with thick sweet flesh.', { origin: 'Espagne' }),
  v('aristotle', 'Aristotle F1', 'annuum', [P, 'L1', 'Bs2'], 220, 8, 85, 0, 1.0, 70, ['bell'], 'Hybride carré de plein champ, code « X3R » (gale bactérienne) et mosaïque du tabac.', 'Field bell hybrid, “X3R” (bacterial spot) and tobacco mosaic resistant.', { hybrid: true, origin: 'USA' }),
  v('gypsy', 'Gypsy F1', 'annuum', [P, 'sw', 'L1'], 90, 14, 70, 0, 2.0, 55, ['sweet'], 'Hybride précoce en corne courte, jaune pâle puis rouge ; très productif.', 'Early short-horn hybrid, pale yellow then red; very productive.', { hybrid: true, origin: 'USA' }),
  v('mavras', 'Mavras F1', 'annuum', [P, 'A', 'L1'], 180, 8, 88, 0, 1.0, 65, ['bell'], 'Hybride carré noir-violet à l’état jeune, rouge à maturité.', 'Blocky hybrid, black-purple when young, red when ripe.', { hybrid: true, origin: 'Pays-Bas' }),
  v('ariane', 'Ariane F1', 'annuum', [P, 'c2', 'L1'], 220, 7, 90, 0, 1.2, 75, ['bell'], 'Hybride carré orange, cultivé sous serre.', 'Orange blocky greenhouse hybrid.', { hybrid: true, origin: 'Pays-Bas' }),

  // --- Autres poivrons doux ------------------------------------------------------
  v('corno-di-toro-rosso', 'Corno di Toro Rosso', 'annuum', [P], 120, 12, 90, 0, 4.0, 75, ['sweet'], 'Corne de taureau : long, recourbé, très sucré.', 'Bull’s horn: long, curved, very sweet.', { origin: 'Italie' }),
  v('corno-di-toro-giallo', 'Corno di Toro Giallo', 'annuum', [P, 'y'], 120, 12, 90, 0, 4.0, 75, ['sweet'], 'La corne de taureau jaune.', 'The yellow bull’s horn.', { origin: 'Italie' }),
  v('carmen', 'Carmen F1', 'annuum', [P, 'L1'], 110, 14, 80, 0, 3.5, 70, ['sweet'], 'Hybride en corne rouge, précoce (lauréat All-America Selections).', 'Early red horn hybrid (All-America Selections winner).', { hybrid: true, origin: 'USA' }),
  v('doux-long-des-landes', 'Doux long des Landes', 'annuum', [P], 40, 25, 85, 0, 6.5, 70, ['sweet'], 'Le « piment d’Anglet » : long et fin, cueilli vert pour la friture.', 'The “piment d’Anglet”: long and thin, picked green for frying.', { origin: 'France' }),
  v('petit-marseillais', 'Petit Marseillais', 'annuum', [P, 'y'], 40, 20, 80, 0, 2.3, 55, ['sweet'], 'Petit poivron conique jaune, précoce et productif.', 'Small conical yellow pepper, early and productive.', { origin: 'France' }),
  v('friariello', 'Friariello di Napoli', 'annuum', [P], 25, 35, 72, 0, 4.0, 60, ['sweet'], 'Petit piment doux napolitain, frit entier.', 'Small sweet Neapolitan pepper, fried whole.', { origin: 'Italie' }),
  v('jimmy-nardello', 'Jimmy Nardello', 'annuum', [P], 30, 30, 80, 0, 9.0, 60, ['sweet'], 'Long doux à peau fine, rapporté d’Italie en 1887.', 'Long thin-skinned sweet pepper, brought from Italy in 1887.', { origin: 'Italie / USA' }),
  v('cubanelle', 'Cubanelle', 'annuum', [P, 'sw'], 80, 15, 75, 0, 3.5, 60, ['sweet'], 'Poivron à frire vert-jaune pâle, puis rouge.', 'Pale yellow-green frying pepper, then red.', { origin: 'Cuba' }),
  v('sweet-banana', 'Sweet Banana', 'annuum', [P, 'sw'], 60, 20, 75, 0, 5.0, 55, ['sweet'], 'Jaune pâle cireux à l’état jeune, puis orange et rouge.', 'Waxy pale yellow when young, then orange and red.', { origin: 'USA' }),
  v('tequila-sunrise', 'Tequila Sunrise', 'annuum', [P, 'c2'], 40, 20, 85, 0, 3.0, 50, ['sweet'], 'Fruits en carotte qui mûrissent orange doré.', 'Carrot-shaped fruit ripening golden orange.', { origin: 'USA' }),
  v('lipstick', 'Lipstick', 'annuum', [P], 60, 15, 78, 0, 2.0, 55, ['sweet'], 'Petit poivron pointu rouge brillant, précoce.', 'Small pointed glossy red pepper, early.', { origin: 'USA' }),
  v('topepo-rosso', 'Topepo Rosso', 'annuum', [P], 120, 10, 85, 0, 0.65, 60, ['sweet'], 'Poivron-tomate aplati et côtelé, très épais.', 'Flattened, ribbed tomato pepper, very thick.', { origin: 'Italie' }),
  v('kapia', 'Kapia', 'annuum', [P], 120, 10, 90, 0, 3.5, 70, ['sweet', 'paprika'], 'Grand cône rouge charnu, pour griller et pour l’ajvar.', 'Large fleshy red cone, for roasting and ajvar.', { origin: 'Bulgarie' }),
  v('piquillo', 'Piquillo de Lodosa', 'annuum', [P], 40, 20, 92, 0, 2.2, 60, ['sweet'], 'Petit cône rouge en bec, grillé au bois (AOP Navarre).', 'Small beak-shaped red cone, wood-roasted (Navarre PDO).', { origin: 'Espagne' }),
  v('gernika', 'Pimiento de Gernika', 'annuum', [P], 15, 40, 75, 0, 4.0, 60, ['sweet'], 'Petit piment basque cueilli vert, frit.', 'Small Basque pepper picked green, fried.', { origin: 'Espagne' }),
  v('nora', 'Ñora', 'annuum', [P], 15, 30, 95, 0, 0.9, 60, ['paprika'], 'Petit poivron rond séché, pour les riz et le romesco.', 'Small round pepper, dried for rice dishes and romesco.', { origin: 'Espagne' }),
  v('feher-ozon', 'Fehér Özön', 'annuum', [P, 'sw'], 60, 14, 80, 0, 1.6, 45, ['paprika', 'sweet'], 'Poivron-paprika hongrois ivoire puis rouge, plante compacte.', 'Hungarian paprika pepper, ivory then red, compact plant.', { origin: 'Hongrie' }),

  // --- Paprikas et piments doux ---------------------------------------------------
  v('kalocsai', 'Paprika de Kalocsa', 'annuum', [], 25, 25, 95, 500, 4.0, 60, ['paprika'], 'Piment à paprika très peu piquant, séché puis moulu.', 'Barely hot paprika pepper, dried then ground.', { origin: 'Hongrie' }),
  v('espelette', 'Piment d’Espelette (Gorria)', 'annuum', [], 20, 40, 100, 4000, 4.5, 80, ['mild', 'paprika'], 'Variété Gorria de l’AOP Espelette : séchée en cordes au Pays basque.', 'Gorria, the Espelette PDO variety: dried on strings in the Basque Country.', { origin: 'France' }),
  v('padron', 'Padrón', 'annuum', [], 8, 60, 70, 1000, 2.2, 60, ['mild'], 'Cueilli vert et frit : « unos pican y otros no » (certains piquent, d’autres pas).', 'Picked green and fried: “some are hot, some are not”.', { origin: 'Espagne' }),
  v('shishito', 'Shishito', 'annuum', [], 8, 60, 70, 150, 4.0, 60, ['mild'], 'Petit piment japonais ridé, presque doux, grillé vert.', 'Small wrinkled Japanese pepper, nearly sweet, grilled green.', { origin: 'Japon' }),
  v('anaheim', 'Anaheim', 'annuum', [], 60, 15, 85, 1000, 6.0, 70, ['mild'], 'Long piment doux de Californie, grillé et farci.', 'Long mild Californian chilli, roasted and stuffed.', { origin: 'USA' }),
  v('big-jim', 'NuMex Big Jim', 'annuum', [], 90, 10, 90, 2000, 7.0, 70, ['mild'], 'Gousses de 25–30 cm du Nouveau-Mexique.', '25–30 cm pods from New Mexico.', { origin: 'USA' }),
  v('numex-6-4', 'NuMex 6-4 (Hatch)', 'annuum', [], 50, 15, 85, 1500, 7.0, 70, ['mild'], 'Le piment vert emblématique de la vallée de Hatch.', 'The iconic green chilli of the Hatch valley.', { origin: 'USA' }),
  v('poblano', 'Poblano (Ancho)', 'annuum', [], 80, 10, 92, 1500, 1.8, 75, ['mild'], 'Frais : poblano, pour les chiles rellenos ; séché : ancho.', 'Fresh: poblano, for chiles rellenos; dried: ancho.', { origin: 'Mexique' }),
  v('mulato', 'Mulato Isleño', 'annuum', ['cl'], 70, 10, 95, 1500, 1.8, 75, ['mild'], 'Poblano qui mûrit brun chocolat (cl) ; séché : mulato.', 'Poblano that ripens chocolate brown (cl); dried: mulato.', { origin: 'Mexique' }),
  v('pasilla', 'Pasilla Bajío (Chilaca)', 'annuum', ['cl'], 30, 20, 95, 2000, 8.0, 80, ['mild'], 'Long piment qui mûrit brun foncé ; séché : pasilla.', 'Long chilli ripening dark brown; dried: pasilla.', { origin: 'Mexique' }),
  v('guajillo', 'Guajillo (Mirasol)', 'annuum', ['up'], 15, 40, 90, 4000, 6.0, 80, ['mild'], '« Qui regarde le soleil » : fruits dressés ; séché : guajillo.', '“Looking at the sun”: erect fruit; dried: guajillo.', { origin: 'Mexique' }),
  v('cascabel', 'Cascabel', 'annuum', [], 10, 40, 90, 2000, 0.9, 70, ['mild'], 'Petit piment rond : séché, ses graines sonnent comme un grelot.', 'Small round chilli: when dried its seeds rattle like a bell.', { origin: 'Mexique' }),
  v('chimayo', 'Chimayo', 'annuum', [], 15, 30, 85, 4000, 5.0, 60, ['mild'], 'Race locale ancienne du Nouveau-Mexique, séchée en guirlandes.', 'Old New Mexican landrace, dried in ristras.', { origin: 'USA' }),
  v('aleppo', 'Alep (Halaby)', 'annuum', [], 10, 40, 90, 10000, 3.0, 70, ['mild', 'paprika'], 'Piment de Syrie séché en flocons huileux.', 'Syrian chilli dried into oily flakes.', { origin: 'Syrie' }),
  v('kashmiri', 'Kashmiri Mirch', 'annuum', [], 8, 50, 95, 2000, 6.0, 70, ['paprika'], 'Donne leur couleur rouge aux currys, sans les brûler.', 'Gives curries their red colour without the burn.', { origin: 'Inde' }),
  v('alma-paprika', 'Alma Paprika', 'annuum', ['sw'], 50, 15, 85, 500, 0.9, 60, ['paprika', 'mild'], 'Rond, ivoire puis orange et rouge, à peine piquant.', 'Round, ivory then orange and red, barely hot.', { origin: 'Hongrie' }),
  v('hungarian-wax', 'Hungarian Hot Wax', 'annuum', ['sw'], 50, 20, 70, 5000, 4.0, 55, ['mild'], 'Jaune cireux à l’état jeune, rouge à maturité.', 'Waxy yellow when young, red when ripe.', { origin: 'Hongrie' }),
  v('guindilla', 'Guindilla de Ibarra', 'annuum', [], 8, 50, 80, 1000, 10.0, 70, ['mild'], 'Long piment basque cueilli vert pâle, conservé au vinaigre.', 'Long Basque chilli picked pale green, pickled.', { origin: 'Espagne' }),

  // --- Piments piquants (C. annuum) -------------------------------------------------
  v('jalapeno', 'Jalapeño M', 'annuum', [], 30, 30, 75, 5000, 2.2, 70, ['hot'], 'Le piment mexicain le plus connu ; fumé, il devient chipotle.', 'The best-known Mexican chilli; smoked, it becomes chipotle.', { origin: 'Mexique' }),
  v('fresno', 'Fresno', 'annuum', [], 20, 30, 75, 5000, 2.5, 60, ['hot'], 'Proche du jalapeño, à paroi plus fine, mûrit vite au rouge.', 'Close to jalapeño, thinner walls, turns red quickly.', { origin: 'USA' }),
  v('serrano', 'Serrano', 'annuum', [], 6, 80, 80, 15000, 4.0, 80, ['hot'], 'Petit piment mexicain vif, mangé frais.', 'Small, sharp Mexican chilli, eaten fresh.', { origin: 'Mexique' }),
  v('cayenne', 'Long Red Cayenne', 'annuum', [], 10, 50, 85, 40000, 12.0, 70, ['hot'], 'Long piment fin, séché pour la poudre de Cayenne.', 'Long thin chilli, dried for cayenne powder.', { origin: 'Guyane / USA' }),
  v('golden-cayenne', 'Golden Cayenne', 'annuum', ['y'], 10, 50, 85, 35000, 12.0, 70, ['hot'], 'Cayenne jaune d’or (y).', 'Golden yellow cayenne (y).', { origin: 'USA' }),
  v('cayenne-bouquet', 'Cayenne en bouquet', 'annuum', ['fa', 'up'], 5, 70, 85, 30000, 9.0, 60, ['hot', 'ornamental'], 'Fruits dressés en bouquets au sommet des tiges (fa, up).', 'Erect fruit clustered at the stem tips (fa, up).', { origin: 'Europe' }),
  v('de-arbol', 'Chile de Árbol', 'annuum', [], 3, 100, 90, 25000, 9.0, 90, ['hot'], 'Fin et rouge vif, garde sa couleur une fois séché.', 'Thin and bright red, keeps its colour when dried.', { origin: 'Mexique' }),
  v('cayennetta', 'Cayennetta F1', 'annuum', ['L1'], 12, 50, 80, 15000, 5.0, 50, ['hot'], 'Hybride compact pour le pot, piquant modéré.', 'Compact hybrid for pots, moderately hot.', { hybrid: true, origin: 'Royaume-Uni' }),
  v('aci-sivri', 'Acı Sivri', 'annuum', [], 30, 25, 85, 5000, 12.0, 70, ['hot'], 'Très long piment turc tortueux.', 'Very long, twisting Turkish chilli.', { origin: 'Turquie' }),
  v('calabrese', 'Peperoncino di Calabria', 'annuum', ['up'], 3, 100, 85, 20000, 3.0, 60, ['hot'], 'Petit piment dressé du sud de l’Italie, séché en tresses.', 'Small erect southern Italian chilli, dried in braids.', { origin: 'Italie' }),
  v('thai', 'Piment thaï (Prik Kee Noo)', 'annuum', ['up'], 1.5, 150, 90, 75000, 5.0, 60, ['hot'], 'Petit piment dressé très piquant de la cuisine thaïe.', 'Small, very hot erect chilli of Thai cooking.', { origin: 'Thaïlande' }),
  v('takanotsume', 'Takanotsume', 'annuum', ['up'], 2, 120, 90, 40000, 6.0, 60, ['hot'], '« Griffe de faucon » : piment japonais dressé, séché.', '“Hawk’s claw”: erect Japanese chilli, dried.', { origin: 'Japon' }),
  v('hot-cherry', 'Hot Cherry', 'annuum', [], 25, 25, 80, 3000, 0.9, 60, ['hot'], 'Piment-cerise rond, souvent mariné.', 'Round cherry pepper, often pickled.', { origin: 'USA' }),
  v('korean-gochu', 'Piment coréen F1 (type gochu, CMS)', 'annuum', ['Rf'], 20, 60, 90, 3000, 7.0, 90, ['hot', 'paprika'], 'Type d’hybride asiatique produit sur stérilité mâle cytoplasmique : cytoplasme S + un seul Rf. Un quart de sa F2 n’aura pas de pollen.', 'Asian-type hybrid produced on cytoplasmic male sterility: S cytoplasm + a single Rf. A quarter of its F2 will have no pollen.', { hybrid: true, cms: true, origin: 'Corée' }),

  // --- Ornementaux ----------------------------------------------------------------------
  v('numex-twilight', 'NuMex Twilight', 'annuum', ['A', 'up'], 2, 150, 85, 30000, 2.5, 35, ['ornamental', 'hot'], 'Fruits dressés violets, puis jaunes, orange et rouges sur la même plante.', 'Erect fruit, purple then yellow, orange and red on the same plant.', { origin: 'USA' }),
  v('black-pearl', 'Black Pearl', 'annuum', ['A', 'up'], 1, 150, 90, 30000, 1.0, 45, ['ornamental', 'hot'], 'Feuillage noir, petites perles noires puis rouges.', 'Black foliage, small black pearls turning red.', { origin: 'USA' }),
  v('filius-blue', 'Filius Blue', 'annuum', ['A', 'up'], 1, 120, 90, 20000, 1.0, 35, ['ornamental', 'hot'], 'Petits fruits ronds bleu-violet puis rouges.', 'Small round blue-purple fruit, then red.', { origin: 'USA' }),
  v('bolivian-rainbow', 'Bolivian Rainbow', 'annuum', ['A', 'up'], 1, 200, 95, 20000, 2.0, 60, ['ornamental', 'hot'], 'Fruits violets, jaunes, orange et rouges en même temps.', 'Purple, yellow, orange and red fruit all at once.', { origin: 'Bolivie' }),
  v('prairie-fire', 'Prairie Fire', 'annuum', ['up'], 1, 200, 85, 70000, 2.0, 25, ['ornamental', 'hot'], 'Buisson de 25 cm couvert de minuscules piments dressés.', '25 cm bush covered with tiny erect chillies.', { origin: 'USA' }),
  v('medusa', 'Medusa F1', 'annuum', ['up', 'sw'], 1.5, 60, 80, 1000, 7.0, 25, ['ornamental', 'mild'], 'Hybride ornemental aux doigts dressés ivoire puis rouges, presque doux.', 'Ornamental hybrid, erect fingers ivory then red, nearly mild.', { hybrid: true, origin: 'Pays-Bas' }),

  // --- C. chinense ---------------------------------------------------------------------
  v('habanero-orange', 'Habanero Orange', 'chinense', ['c2'], 10, 60, 110, 250000, 1.2, 90, ['superhot'], 'Lanterne ridée orange au parfum d’abricot.', 'Wrinkled orange lantern with an apricot aroma.', { origin: 'Mexique' }),
  v('red-savina', 'Habanero Red Savina', 'chinense', [], 12, 60, 110, 350000, 1.2, 90, ['superhot'], 'Habanero rouge sélectionné en Californie, recordman en 1994.', 'Red habanero selected in California, record holder in 1994.', { origin: 'USA' }),
  v('habanero-chocolate', 'Habanero Chocolate', 'chinense', ['cl'], 12, 50, 115, 300000, 1.2, 90, ['superhot'], 'Habanero brun (cl), goût fumé.', 'Brown habanero (cl), smoky taste.', { origin: 'Jamaïque' }),
  v('habanero-white', 'Habanero White (péruvien)', 'chinense', ['y', 'c2', 'c1'], 5, 80, 115, 200000, 1.4, 90, ['superhot'], 'Petit habanero qui mûrit blanc crème : y, c2 et c1 réunis.', 'Small habanero ripening creamy white: y, c2 and c1 together.', { origin: 'Pérou' }),
  v('scotch-bonnet', 'Scotch Bonnet Yellow', 'chinense', ['y'], 10, 50, 110, 200000, 0.8, 90, ['superhot'], 'En forme de béret écossais, piment des Caraïbes.', 'Tam-o’-shanter shaped Caribbean chilli.', { origin: 'Jamaïque' }),
  v('bonda-man-jacques', 'Bonda Man Jacques', 'chinense', [], 10, 50, 110, 250000, 0.9, 90, ['superhot'], 'Le piment antillais « derrière de Madame Jacques », très parfumé.', 'The French Caribbean “Madame Jacques’ behind”, very fragrant.', { origin: 'Martinique' }),
  v('vegetarien', 'Piment végétarien', 'chinense', ['y'], 8, 50, 110, 300, 1.2, 90, ['mild'], 'Tout le parfum du piment antillais, presque sans piquant.', 'All the French Caribbean aroma, almost no heat.', { origin: 'Guadeloupe' }),
  v('aji-dulce', 'Ají Dulce', 'chinense', [], 6, 60, 105, 300, 1.3, 90, ['mild'], 'Petit chinense aromatique des Caraïbes, presque doux.', 'Small aromatic Caribbean chinense, nearly sweet.', { origin: 'Venezuela' }),
  v('numex-suave-orange', 'NuMex Suave Orange', 'chinense', ['c2'], 10, 60, 110, 800, 1.2, 80, ['mild'], 'Habanero sélectionné pour un piquant très doux.', 'Habanero selected for very low heat.', { origin: 'USA' }),
  v('biquinho', 'Biquinho', 'chinense', [], 1.5, 150, 110, 800, 1.3, 70, ['mild'], '« Petit bec » brésilien, mariné, à peine piquant.', 'Brazilian “little beak”, pickled, barely hot.', { origin: 'Brésil' }),
  v('aji-panca', 'Ají Panca', 'chinense', [], 15, 40, 120, 1000, 5.0, 110, ['mild', 'paprika'], 'Piment péruvien rouge sombre, doux et fruité, séché.', 'Dark red Peruvian chilli, mild and fruity, dried.', { origin: 'Pérou' }),
  v('madame-jeanette', 'Madame Jeanette', 'chinense', ['y'], 20, 40, 110, 250000, 1.8, 90, ['superhot'], 'Jaune, tordu, au goût de mangue ; Surinam.', 'Yellow, twisted, mango-flavoured; Suriname.', { origin: 'Surinam' }),
  v('fatalii', 'Fatalii', 'chinense', ['y'], 7, 60, 110, 250000, 3.0, 90, ['superhot'], 'Jaune citronné d’Afrique centrale.', 'Lemony yellow from central Africa.', { origin: 'Afrique centrale' }),
  v('datil', 'Datil', 'chinense', ['y'], 5, 80, 115, 200000, 3.0, 90, ['superhot'], 'Piment de Saint Augustine (Floride), sucré et brûlant.', 'St Augustine (Florida) chilli, sweet and fiery.', { origin: 'USA' }),
  v('paper-lantern', 'Habanero Paper Lantern', 'chinense', [], 12, 60, 110, 300000, 2.5, 100, ['superhot'], 'Habanero allongé en lanterne de papier.', 'Elongated paper-lantern habanero.', { origin: 'USA' }),
  v('bhut-jolokia', 'Bhut Jolokia', 'chinense', [], 8, 40, 120, 1000000, 3.5, 110, ['superhot'], 'Le « piment fantôme » d’Assam, premier à dépasser le million de Scoville (2007).', 'Assam’s “ghost pepper”, first past one million Scoville (2007).', { origin: 'Inde' }),
  v('7-pot-douglah', '7 Pot Douglah', 'chinense', ['cl'], 9, 40, 120, 1000000, 1.3, 100, ['superhot'], 'Piment trinidadien brun chocolat, parmi les plus piquants.', 'Chocolate-brown Trinidadian chilli, among the hottest.', { origin: 'Trinité' }),
  v('moruga-scorpion', 'Trinidad Moruga Scorpion', 'chinense', [], 9, 40, 120, 1200000, 1.3, 100, ['superhot'], 'Détenteur du record en 2012.', 'Record holder in 2012.', { origin: 'Trinité' }),
  v('carolina-reaper', 'Carolina Reaper', 'chinense', [], 8, 40, 120, 1600000, 1.4, 110, ['superhot'], 'Fruit bosselé à petite queue de scorpion ; record officiel 2013–2023.', 'Bumpy fruit with a scorpion tail; official record 2013–2023.', { origin: 'USA' }),
  v('pi-152225', 'PI 152225 (donneur Tsw)', 'chinense', ['Tsw'], 5, 60, 115, 150000, 1.5, 90, ['donor'], 'Lignée péruvienne source du gène Tsw contre la maladie bronzée (thrips).', 'Peruvian line, source of the Tsw spotted-wilt gene (thrips).', { origin: 'Pérou' }),
  v('pi-159236', 'PI 159236 (donneur L3)', 'chinense', ['L3'], 5, 60, 115, 100000, 1.5, 90, ['donor'], 'Lignée source de L3, résistance aux tobamovirus P0, P1 et P1.2.', 'Source line of L3, resistance to tobamovirus P0, P1 and P1.2.', { origin: 'Amérique du Sud' }),

  // --- C. frutescens ------------------------------------------------------------------
  v('tabasco', 'Tabasco', 'frutescens', ['up', 'L2'], 3, 150, 120, 40000, 4.0, 110, ['hot'], 'Le piment de la sauce ; fruits dressés, juteux. Source historique de L2.', 'The sauce chilli; erect, juicy fruit. Historical source of L2.', { origin: 'Mexique / USA' }),
  v('bird-eye', 'Piment oiseau', 'frutescens', ['up'], 1, 200, 110, 80000, 3.0, 90, ['hot'], 'Minuscule piment dressé d’Afrique et d’Asie (siling labuyo).', 'Tiny erect chilli from Africa and Asia (siling labuyo).', { origin: 'Afrique / Asie' }),
  v('malagueta', 'Malagueta', 'frutescens', ['up'], 1, 200, 115, 60000, 4.0, 100, ['hot'], 'Piment de Bahia, souvent mariné dans la cachaça.', 'Bahia chilli, often steeped in cachaça.', { origin: 'Brésil' }),
  v('piri-piri', 'Piri-piri', 'frutescens', ['up'], 2, 150, 110, 70000, 3.5, 90, ['hot'], 'Petit piment d’Afrique australe popularisé par les Portugais.', 'Small southern African chilli popularised by the Portuguese.', { origin: 'Mozambique' }),

  // --- C. baccatum ---------------------------------------------------------------------
  v('aji-amarillo', 'Ají Amarillo', 'baccatum', ['c2'], 25, 40, 120, 40000, 5.0, 150, ['hot'], 'Le piment emblématique du Pérou, orange à maturité, fruité.', 'Peru’s emblematic chilli, orange when ripe, fruity.', { origin: 'Pérou' }),
  v('lemon-drop', 'Lemon Drop (Ají Limón)', 'baccatum', ['y'], 5, 80, 115, 25000, 3.5, 120, ['hot'], 'Petit cône jaune citron, goût d’agrume.', 'Small lemon-yellow cone, citrus taste.', { origin: 'Pérou' }),
  v('bishops-crown', 'Bishop’s Crown', 'baccatum', [], 10, 50, 110, 10000, 0.6, 120, ['mild'], 'Fruit aplati à trois ailes en couronne d’évêque.', 'Flattened three-winged fruit like a bishop’s mitre.', { origin: 'Barbade' }),
  v('brazilian-starfish', 'Brazilian Starfish', 'baccatum', [], 8, 50, 115, 10000, 0.5, 120, ['mild'], 'Aplati en étoile de mer, rouge vif.', 'Flattened like a starfish, bright red.', { origin: 'Brésil' }),
  v('aji-cristal', 'Ají Cristal', 'baccatum', ['y', 'c1'], 10, 50, 110, 20000, 3.0, 110, ['hot'], 'Jaune très pâle à maturité, croquant ; Chili.', 'Very pale yellow when ripe, crunchy; Chile.', { origin: 'Chili' }),
  v('criolla-sella', 'Criolla Sella', 'baccatum', ['y'], 3, 100, 105, 25000, 3.0, 60, ['hot'], 'Petit baccatum bolivien jaune, précoce et compact.', 'Small yellow Bolivian baccatum, early and compact.', { origin: 'Bolivie' }),
  v('sugar-rush-peach', 'Sugar Rush Peach', 'baccatum', ['c2', 'c1'], 15, 60, 120, 15000, 5.0, 150, ['hot'], 'Longs fruits couleur pêche, très sucrés.', 'Long peach-coloured fruit, very sweet.', { origin: 'Royaume-Uni' }),

  // --- C. pubescens -------------------------------------------------------------------
  v('rocoto-red', 'Rocoto rouge', 'pubescens', [], 50, 25, 135, 50000, 1.0, 150, ['hot'], 'Charnu comme une pomme, graines noires, fleurs violettes ; supporte le frais.', 'Fleshy like an apple, black seeds, purple flowers; tolerates cool weather.', { origin: 'Pérou' }),
  v('rocoto-manzano', 'Rocoto Manzano Amarillo', 'pubescens', ['y'], 60, 20, 135, 40000, 1.0, 150, ['hot'], 'Le « piment-pomme » jaune du Mexique.', 'Mexico’s yellow “apple chilli”.', { origin: 'Mexique' }),
  v('rocoto-riesen', 'Rocoto Riesen', 'pubescens', [], 90, 15, 140, 40000, 1.0, 160, ['hot'], 'Rocoto géant, jusqu’à 7 cm.', 'Giant rocoto, up to 7 cm.', { origin: 'Pérou' }),

  // --- Lignées donneuses, sauvages et de production d’hybrides (C. annuum) ---------
  v('chiltepin', 'Chiltepín (sauvage)', 'annuum', ['S', 'up'], 0.6, 300, 110, 70000, 1.0, 120, ['donor', 'hot'], 'Piment sauvage (var. glabriusculum) : minuscules fruits ronds qui tombent tout seuls (S), mangés par les oiseaux.', 'Wild chilli (var. glabriusculum): tiny round fruit that drops by itself (S), eaten by birds.', { origin: 'Mexique / Texas' }),
  v('cm334', 'Criollo de Morelos 334', 'annuum', ['Pvr4'], 15, 40, 100, 20000, 1.5, 100, ['donor'], 'Race locale mexicaine source de Pvr4 (virus Y) et de résistance au Phytophthora.', 'Mexican landrace, source of Pvr4 (PVY) and Phytophthora resistance.', { origin: 'Mexique' }),
  v('pm687', 'PM687 (donneur Me3)', 'annuum', ['Me3'], 10, 60, 95, 20000, 2.0, 80, ['donor'], 'Lignée INRA porteuse de Me3 contre les nématodes à galles.', 'INRA line carrying Me3 against root-knot nematodes.', { origin: 'France' }),
  v('ecw-20r', 'ECW-20R (Bs2)', 'annuum', [P, 'Bs2'], 150, 8, 85, 0, 1.0, 60, ['donor', 'bell'], 'Early Calwonder porteur de Bs2 (gale bactérienne), issu de C. chacoense.', 'Early Calwonder carrying Bs2 (bacterial spot), from C. chacoense.', { origin: 'USA' }),
  v('yolo-y', 'Yolo Y (pvr2)', 'annuum', [P, 'L1', 'pvr2'], 180, 7, 88, 0, 1.0, 60, ['donor', 'bell'], 'Yolo Wonder résistant au virus Y (pvr2).', 'Yolo Wonder resistant to potato virus Y (pvr2).', { origin: 'USA' }),
  v('l4-line', 'Lignée L4 (introgression C. chacoense)', 'annuum', [P, 'L4'], 150, 8, 88, 0, 1.0, 60, ['donor', 'bell'], 'Poivron porteur de L4, la résistance la plus large aux tobamovirus.', 'Bell pepper carrying L4, the broadest tobamovirus resistance.', { origin: 'Europe' }),
  v('cms-a-line', 'Lignée A (stérile mâle, CMS)', 'annuum', [], 15, 50, 90, 10000, 6.0, 80, ['donor', 'hot'], 'Cytoplasme S de Peterson (1958), sans restaurateur : aucun pollen. Mère idéale, jamais besoin de la castrer.', 'Peterson’s (1958) S cytoplasm, no restorer: no pollen. Ideal mother, never needs emasculating.', { cms: true, origin: 'USA' }),
  v('cms-b-line', 'Lignée B (mainteneuse)', 'annuum', [], 15, 50, 90, 10000, 6.0, 80, ['donor', 'hot'], 'Même noyau que la lignée A mais cytoplasme normal : son pollen maintient la lignée A stérile.', 'Same nucleus as the A line but normal cytoplasm: its pollen keeps the A line sterile.', { origin: 'USA' }),
  v('rf-c-line', 'Lignée C (restauratrice Rf)', 'annuum', ['Rf'], 20, 50, 90, 8000, 5.0, 90, ['donor', 'hot'], 'Porte le restaurateur Rf : ses hybrides avec la lignée A ont du pollen.', 'Carries the Rf restorer: its hybrids with the A line have pollen.', { origin: 'Corée' }),
];

export const VARIETY_BY_ID: Record<string, PepperVariety> = Object.fromEntries(PEPPER_VARIETIES.map((x) => [x.id, x]));
