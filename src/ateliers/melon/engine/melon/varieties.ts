/**
 * Bibliothèque de variétés de melon.
 *
 * Aucune base de données ouverte et structurée des variétés de melon n’a
 * été trouvée : catalogue compilé à la main d’après Vilmorin-Andrieux,
 * « Les Plantes potagères » (domaine public, Wikisource), les fiches Edulis
 * du GRAB, les catalogues Kokopelli, Ferme de Sainte Marthe, Baker Creek,
 * Seed Savers, Johnny’s, Fedco, Rijk Zwaan, et les listes de gènes du CGC
 * (lignées sources de résistances). Chiffres = ordres de grandeur ; °Brix
 * rarement publiés pour les variétés anciennes (valeurs typiques du type).
 *
 * Génotypes DÉDUITS de la description. Type floral : andromonoïque (a/a)
 * pour les groupes cantalupensis, reticulatus, inodorus, makuwa, conomon,
 * ameri, dudaim (Pitrat 2010) ; monoïque pour flexuosus, momordica et la
 * plupart des Charentais F1 modernes (depuis ‘Alpha’, années 1980).
 * Résistances des F1 d’après les codes semenciers (HR/IR Fom, Px, Ag) :
 * gènes supposés.
 */

import type { QuantTraitId } from './engine';
import type { MelonGroup, VariantId } from './loci';

export type MelonKind = 'charentais' | 'netted' | 'winter' | 'asian' | 'snake' | 'ornamental' | 'donor';

export interface MelonVariety {
  id: string;
  name: string;
  group: MelonGroup;
  variants: VariantId[];
  weightKg: number;
  fruits: number;
  /** Jours de la plantation à la récolte. */
  days: number;
  brix: number;
  storageDays: number;
  shapeRatio: number;
  kinds: MelonKind[];
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<MelonVariety, 'hybrid' | 'origin'>>;

function v(
  id: string,
  name: string,
  group: MelonGroup,
  variants: VariantId[],
  weightKg: number,
  fruits: number,
  days: number,
  brix: number,
  storageDays: number,
  shapeRatio: number,
  kinds: MelonKind[],
  fr: string,
  en: string,
  opt: Opt = {}
): MelonVariety {
  return { id, name, group, variants, weightKg, fruits, days, brix, storageDays, shapeRatio, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

// Raccourci : andromonoïque (la majorité des variétés anciennes)
const A: VariantId = 'a';

export const MELON_VARIETIES: MelonVariety[] = [
  // ------------------------------------------------ Charentais et cantaloups
  v('charentais', 'Charentais', 'cantalupensis', [A, 's'], 1, 4, 80, 13, 5, 1, ['charentais'], 'Le melon français de référence : écorce lisse vert-gris à sutures vert foncé, chair orange très parfumée. Se fend au pédoncule à maturité.', 'The reference French melon: smooth grey-green rind with dark green sutures, very fragrant orange flesh. Cracks at the stem when ripe.', { origin: 'France' }),
  v('doublon', 'Doublon', 'cantalupensis', [A, 's', 'Fom1'], 1, 4, 82, 12.5, 5, 1, ['charentais', 'donor'], 'Charentais de sélection, source historique de la résistance Fom-1 (fusariose races 0 et 2) dans la liste des gènes du CGC.', 'Charentais breeding type, historic source of the Fom-1 resistance (Fusarium races 0 and 2) in the CGC gene list.', { origin: 'France' }),
  v('vedrantais', 'Védrantais', 'cantalupensis', [A, 's'], 1, 4, 78, 13, 5, 1, ['charentais'], 'Charentais de référence des généticiens (INRAE) : lignée climactérique type pour l’étude du mûrissement.', 'Reference Charentais for geneticists (INRAE): the model climacteric line for ripening studies.', { origin: 'France' }),
  v('noir-des-carmes', 'Noir des Carmes', 'cantalupensis', [A, 's', 'Mt'], 1.3, 3, 80, 12, 4, 1, ['charentais'], 'Cantaloup ancien vert-noir côtelé, qui se marbre d’orange à maturité et se détache seul ; se fend s’il mûrit trop.', 'Old black-green ribbed cantaloupe that mottles orange when ripe and slips on its own; splits if over-ripe.', { origin: 'France' }),
  v('petit-gris-de-rennes', 'Petit Gris de Rennes', 'cantalupensis', [A, 's'], 0.7, 4, 80, 13, 4, 1, ['charentais'], 'Petit melon gris-vert à sutures, précoce, adapté aux climats frais de l’Ouest.', 'Small grey-green melon with sutures, early, suited to cool western climates.', { origin: 'France (Bretagne)' }),
  v('prescott-fond-blanc', 'Prescott Fond Blanc', 'cantalupensis', [A, 's'], 3, 2, 85, 12, 4, 0.55, ['charentais'], 'Gros cantaloup très aplati, profondément côtelé et verruqueux, chair saumon.', 'Large, very flat cantaloupe, deeply ribbed and warty, salmon flesh.', { origin: 'France' }),
  v('prescott-petit-hatif', 'Prescott Petit Hâtif', 'cantalupensis', [A, 's'], 0.9, 4, 72, 12, 4, 0.9, ['charentais'], 'Petit Prescott très précoce, le meilleur pour la culture forcée (Vilmorin).', 'Small, very early Prescott, the best for forcing (Vilmorin).', { origin: 'France' }),
  v('bellegarde', 'Cantaloup de Bellegarde', 'cantalupensis', [A, 's', 'Mt'], 1.2, 3, 75, 12, 4, 1.25, ['charentais'], 'Cantaloup ovale côtelé, taché de vert, chair rouge-orangé ; déjà chez Vilmorin en 1885.', 'Oval ribbed cantaloupe, spotted green, red-orange flesh; already in Vilmorin in 1885.', { origin: 'France' }),
  v('kroumir', 'Kroumir (Cantaloup Obus)', 'cantalupensis', [A, 's'], 0.8, 4, 82, 12, 4, 1.3, ['charentais'], 'Issu du Noir des Carmes : côtes profondes, vert foncé.', 'Derived from Noir des Carmes: deep ribs, dark green.', { origin: 'France' }),
  v('cantaloup-dalger', 'Cantaloup d’Alger', 'cantalupensis', [A, 's'], 2.5, 2, 82, 12, 4, 1.15, ['charentais'], 'Cantaloup vert foncé verruqueux, « très rustique » (Vilmorin).', 'Warty dark green cantaloupe, “very hardy” (Vilmorin).', { origin: 'Algérie' }),
  v('noir-du-portugal', 'Noir du Portugal', 'cantalupensis', [A, 's'], 5, 2, 90, 11, 4, 1.15, ['charentais'], 'Très gros cantaloup bosselé à côtes profondes.', 'Very large bumpy cantaloupe with deep ribs.', { origin: 'Portugal' }),
  v('cantaloup-sucrin', 'Cantaloup Sucrin', 'cantalupensis', [A, 's'], 1.5, 3, 80, 13, 4, 1, ['charentais'], 'Cantaloup gris argenté lisse, réussit en plein air (Vilmorin).', 'Smooth silver-grey cantaloupe that succeeds outdoors (Vilmorin).', { origin: 'France' }),
  v('anasta', 'Anasta F1', 'cantalupensis', ['s', 'Rn', 'Fom1', 'Fom2', 'Pmw'], 1, 5, 75, 14, 6, 1, ['charentais'], 'Charentais brodé hybride, très sucré ; résistances déclarées HR Fom 1,2 et IR oïdium : gènes supposés.', 'Hybrid netted Charentais, very sweet; declared HR Fom 1,2 and IR powdery mildew: genes assumed.', { hybrid: true }),
  v('cezanne', 'Cézanne F1', 'cantalupensis', ['s', 'Fom2', 'Pmw'], 1, 5, 70, 13.5, 6, 1, ['charentais'], 'Charentais lisse précoce, monoïque comme la plupart des F1 modernes ; résistances déclarées (fusariose, oïdium) : gènes supposés.', 'Early smooth Charentais, monoecious like most modern F1s; declared resistances (Fusarium, powdery mildew): genes assumed.', { hybrid: true }),
  v('etchabi', 'Etchabi F1', 'cantalupensis', ['s', 'Fom1', 'Fom2', 'Pmw', 'Vat'], 1, 5, 72, 13.5, 6, 1, ['charentais'], 'Charentais F1 précoce : HR Fom 0,1,2, IR oïdium et pucerons (Ag) selon le semencier ; gènes supposés.', 'Early Charentais F1: HR Fom 0,1,2, IR powdery mildew and aphids (Ag) per the seed company; genes assumed.', { hybrid: true }),
  v('allegreto', 'Allegreto F1', 'cantalupensis', ['s', 'Fom2', 'Pmw', 'Vat'], 1, 5, 76, 13.5, 6, 1, ['charentais'], 'Charentais F1 : HR Fom 0,1, IR oïdium et pucerons ; gènes supposés.', 'Charentais F1: HR Fom 0,1, IR powdery mildew and aphids; genes assumed.', { hybrid: true }),

  // ------------------------------------------------- Melons brodés (reticulatus)
  v('sucrin-de-tours', 'Sucrin de Tours', 'reticulatus', [A, 'Rn'], 1.5, 3, 85, 13, 5, 1, ['netted'], 'Brodé ancien à fort filet, chair rouge-orangé ; catalogué en 1883.', 'Old heavily netted melon, red-orange flesh; catalogued in 1883.', { origin: 'France' }),
  v('ananas-damerique', 'Ananas d’Amérique à chair verte', 'reticulatus', [A, 'Rn', 'gf', 'Y'], 0.6, 5, 90, 13, 6, 1, ['netted'], 'Petit melon brodé qui dore à maturité, chair vert pâle parfumée ; cultivé par Jefferson en 1794.', 'Small netted melon that turns golden when ripe, fragrant pale green flesh; grown by Jefferson in 1794.', { origin: 'USA' }),
  v('vert-grimpant', 'Vert Grimpant (Vert à rames)', 'reticulatus', [A, 'Rn', 'gf'], 0.6, 6, 80, 12, 5, 1.1, ['netted'], 'Petit melon brodé vert à chair verte, qu’on peut faire grimper sur un support.', 'Small green netted melon with green flesh, can be trained up a support.', { origin: 'France' }),
  v('maraicher', 'Maraîcher', 'reticulatus', [A, 'Rn'], 2.5, 3, 85, 12, 5, 1, ['netted'], 'Brodé très finement, chair orange (Vilmorin).', 'Very finely netted, orange flesh (Vilmorin).', { origin: 'France' }),
  v('muscade-des-etats-unis', 'Muscade des États-Unis', 'reticulatus', [A, 'Rn', 'gf'], 1, 4, 80, 12, 5, 1.3, ['netted'], 'Brodé ovale à chair verte, demi-hâtif (Vilmorin).', 'Oval netted melon with green flesh, semi-early (Vilmorin).', { origin: 'USA' }),
  v('hales-best', 'Hale’s Best Jumbo', 'reticulatus', [A, 'Rn', 's'], 1.8, 4, 85, 12, 7, 1.2, ['netted'], 'Cantaloup américain fortement brodé, chair saumon, supporte la sécheresse.', 'Heavily netted American cantaloupe, salmon flesh, drought-tolerant.', { origin: 'USA' }),
  v('hearts-of-gold', 'Hearts of Gold', 'reticulatus', [A, 'Rn', 's'], 1.4, 4, 85, 12.5, 6, 1, ['netted'], 'Brodé côtelé à chair orange foncé, se détache seul à maturité.', 'Ribbed netted melon with deep orange flesh, slips when ripe.', { origin: 'USA' }),
  v('minnesota-midget', 'Minnesota Midget', 'reticulatus', [A, 'Rn', 'Fom1'], 0.6, 6, 65, 12, 5, 1, ['netted'], 'Mini-melon brodé de 10 cm sur tiges courtes (90 cm), très précoce ; résistant à la fusariose (gène supposé).', 'Netted 10 cm mini melon on short vines (90 cm), very early; Fusarium-resistant (gene assumed).', { origin: 'USA' }),
  v('emerald-gem', 'Emerald Gem', 'reticulatus', [A, 's'], 1.1, 4, 80, 12.5, 5, 1.2, ['netted'], 'Ancien Burpee (1886) vert, légèrement côtelé, chair orange pâle.', 'Old Burpee melon (1886), green, slightly ribbed, pale orange flesh.', { origin: 'USA' }),
  v('jenny-lind', 'Jenny Lind', 'reticulatus', [A, 'Rn', 'gf'], 0.9, 5, 80, 12.5, 5, 0.9, ['netted'], 'Petit melon en turban à chair verte, nommé en 1883.', 'Small turban-shaped melon with green flesh, named in 1883.', { origin: 'USA' }),
  v('edens-gem', 'Eden’s Gem (Rocky Ford)', 'reticulatus', [A, 'Rn', 'gf'], 0.8, 5, 75, 12.5, 5, 1, ['netted'], 'Petit brodé à chair verte de Rocky Ford (Colorado).', 'Small green-fleshed netted melon from Rocky Ford (Colorado).', { origin: 'USA' }),
  v('banana', 'Banana', 'reticulatus', [A, 'Y'], 3.5, 3, 90, 11, 7, 3.5, ['netted'], 'Melon jaune lisse en forme de banane (40–60 cm), chair saumon ; 1885.', 'Smooth yellow banana-shaped melon (40–60 cm), salmon flesh; 1885.', { origin: 'USA' }),
  v('pride-of-wisconsin', 'Pride of Wisconsin', 'reticulatus', [A, 'Rn', 's'], 2.2, 3, 95, 12, 6, 1, ['netted'], 'Brodé côtelé à chair orange épaisse (1937).', 'Ribbed netted melon with thick orange flesh (1937).', { origin: 'USA' }),
  v('schoons-hardshell', 'Schoon’s Hardshell', 'reticulatus', [A, 'Rn'], 3, 3, 90, 12, 10, 1, ['netted'], 'Écorce dure et grossièrement brodée : ne se fend pas, se conserve et voyage bien.', 'Hard, coarsely netted rind: does not crack, stores and travels well.', { origin: 'USA' }),
  v('delicious-51', 'Delicious 51', 'reticulatus', [A, 'Rn', 's', 'Fom1'], 1.2, 4, 85, 12, 6, 1.1, ['netted'], 'Brodé côtelé résistant à la fusariose (gène supposé).', 'Ribbed netted melon, Fusarium-resistant (gene assumed).', { origin: 'USA' }),
  v('pmr-45', 'PMR 45', 'reticulatus', [A, 'Rn', 's', 'Pm1'], 1.2, 4, 90, 11, 6, 1.1, ['netted', 'donor'], 'Première variété résistante à l’oïdium (1937) : porte Pm-1 (race 1), aujourd’hui contourné par d’autres races.', 'First powdery-mildew-resistant variety (1937): carries Pm-1 (race 1), since overcome by other races.', { origin: 'USA' }),
  v('planters-jumbo', 'Planters Jumbo', 'reticulatus', [A, 'Rn', 'nsv'], 2, 3, 86, 11.5, 6, 1.1, ['netted'], 'Brodé du Sud des États-Unis, cité pour nsv (virus MNSV) dans la liste du CGC.', 'Southern US netted melon, cited for nsv (MNSV virus) in the CGC list.', { origin: 'USA' }),
  v('ambrosia', 'Ambrosia F1', 'reticulatus', [A, 'Rn', 's', 'Pm1'], 2, 4, 86, 13, 6, 1, ['netted'], 'Brodé hybride très sucré à chair saumon, tolérant à l’oïdium (1975).', 'Very sweet hybrid netted melon with salmon flesh, powdery-mildew tolerant (1975).', { hybrid: true }),
  v('athena', 'Athena F1', 'reticulatus', [A, 'Rn', 's', 'Fom1', 'Fom2', 'Pm1'], 2.5, 4, 79, 12, 9, 1.1, ['netted'], 'Brodé hybride à écorce épaisse qui se fend rarement ; HR fusariose 0–2 et oïdium (gènes supposés).', 'Hybrid netted melon with a thick rind that seldom cracks; HR Fusarium 0–2 and powdery mildew (genes assumed).', { hybrid: true }),
  v('sugar-cube', 'Sugar Cube F1', 'reticulatus', [A, 'Rn', 'Fom1', 'Fom2', 'Pm1', 'Prv', 'Zym'], 1, 5, 80, 13.5, 7, 1, ['netted'], 'Petit brodé très sucré aux nombreuses résistances déclarées (fusariose, oïdium, virus) ; gènes supposés.', 'Small, very sweet netted melon with many declared resistances (Fusarium, powdery mildew, viruses); genes assumed.', { hybrid: true }),

  // --------------------------------------------- Melons d’hiver (inodorus)
  v('vert-olive-dhiver', 'Vert Olive d’Hiver', 'inodorus', [A, 'gf', 'al'], 1, 3, 110, 12, 130, 1.3, ['winter'], 'Melon d’hiver provençal vert foncé ridé, en goutte : se garde 4 à 5 mois, jusqu’en février (fiche GRAB).', 'Provençal winter melon, wrinkled dark green, teardrop-shaped: keeps 4–5 months, until February (GRAB sheet).', { origin: 'France (Provence)' }),
  v('boule-dor', 'Boule d’Or', 'inodorus', [A, 'Y', 'Rn', 'gf', 'al'], 1.5, 3, 90, 12.5, 70, 1, ['winter'], 'Melon doré à fine broderie, chair vert pâle ; Vilmorin 1885.', 'Golden melon with lacy netting, pale green flesh; Vilmorin 1885.', { origin: 'France' }),
  v('jaune-canari', 'Jaune Canari', 'inodorus', [A, 'Y', 'wf', 'al'], 1.8, 3, 100, 12, 80, 1.9, ['winter'], 'Melon jaune vif ridé, allongé, chair blanche croquante ; se conserve longtemps.', 'Bright yellow wrinkled elongated melon, crisp white flesh; keeps a long time.', { origin: 'Espagne' }),
  v('piel-de-sapo', 'Piel de Sapo', 'inodorus', [A, 'Mt', 'wf', 'al'], 3.5, 2, 100, 12.5, 90, 1.3, ['winter'], '« Peau de crapaud » : écorce verte tachetée, chair blanche croquante ; se garde jusqu’à Noël hors gel.', '“Toad skin”: speckled green rind, crisp white flesh; keeps until Christmas, frost-free.', { origin: 'Espagne' }),
  v('santa-claus', 'Santa Claus', 'inodorus', [A, 'Y', 'Mt', 'gf', 'al'], 3.5, 2, 110, 12, 100, 1.4, ['winter'], 'Melon d’hiver marbré jaune et vert, chair vert pâle ; se conserve remarquablement.', 'Winter melon mottled yellow and green, pale green flesh; stores remarkably well.', { origin: 'Espagne' }),
  v('tendral', 'Tendral Verde Tardif', 'inodorus', [A, 'gf', 'al'], 2, 3, 110, 12, 80, 1.2, ['winter'], 'Vert foncé très ridé, se garde 2 à 3 mois et s’adoucit en cave.', 'Very wrinkled dark green melon, keeps 2–3 months and sweetens in storage.', { origin: 'Espagne' }),
  v('honeydew', 'Honeydew (chair verte)', 'inodorus', [A, 'w', 'gf', 'al'], 2, 3, 95, 12, 60, 1.1, ['winter'], 'Écorce lisse et dure, blanc crème ; chair verte très juteuse. Cité pour w et gf dans la liste du CGC.', 'Smooth hard cream-white rind; very juicy green flesh. Cited for w and gf in the CGC list.', { origin: 'USA' }),
  v('honeydew-orange', 'Honeydew à chair orange', 'inodorus', [A, 'w', 'al'], 2.3, 3, 95, 12.5, 50, 1.1, ['winter'], 'Honeydew à chair orange.', 'Orange-fleshed honeydew.', { origin: 'USA' }),
  v('crenshaw', 'Crenshaw', 'inodorus', [A, 'Y', 'al'], 2, 2, 110, 12, 40, 1.4, ['winter'], 'Gros melon jaune acide à chair saumon.', 'Large acid-yellow melon with salmon flesh.', { origin: 'USA' }),
  v('casaba-golden-beauty', 'Casaba Golden Beauty', 'inodorus', [A, 'Y', 'wf', 'al'], 3, 2, 105, 11, 90, 1.2, ['winter'], 'Casaba jaune vif, dur et ridé, chair blanche ; se garde des mois.', 'Bright yellow casaba, hard and wrinkled, white flesh; keeps for months.', { origin: 'Turquie / USA' }),
  v('collective-farm-woman', 'Kolkhoznitsa (Collective Farm Woman)', 'inodorus', [A, 'Y', 'wf', 'al'], 1.2, 4, 82, 12, 30, 1, ['winter'], 'Melon ukrainien vert virant au jaune-orangé, chair blanche ; précoce pour un melon d’hiver.', 'Ukrainian melon, green turning yellow-orange, white flesh; early for a winter melon.', { origin: 'Ukraine' }),
  v('kazakh', 'Kazakh', 'inodorus', [A, 'Y', 'wf', 'al'], 1, 4, 75, 12, 30, 1.1, ['winter'], 'Petit melon blanc virant au jaune vif, précoce et résistant à la sécheresse.', 'Small white melon turning bright yellow, early and drought-tolerant.', { origin: 'Kazakhstan' }),

  // ------------------------------------------------------ Galia, Ogen
  v('galia', 'Galia F1', 'reticulatus', [A, 'Rn', 'Y', 'gf'], 1, 4, 80, 14, 10, 1, ['netted'], 'Hybride israélien (Karchi, 1973 : Ha’Ogen × Krymka) : brodé, vert virant au jaune, chair verte ; mûrit à la couleur.', 'Israeli hybrid (Karchi, 1973: Ha’Ogen × Krymka): netted, green turning yellow, green flesh; ripeness judged by colour.', { hybrid: true, origin: 'Israël' }),
  v('arava', 'Arava F1 (type Galia)', 'reticulatus', [A, 'Rn', 'Y', 'gf', 'Pm1'], 0.7, 5, 80, 11, 10, 1, ['netted'], 'Type Galia légèrement brodé, se détache à maturité, tolérant à l’oïdium.', 'Lightly netted Galia type, full slip, powdery-mildew tolerant.', { hybrid: true }),
  v('ogen', 'Ogen', 'cantalupensis', [A, 'Y', 'st', 'gf'], 1, 4, 75, 13, 6, 1, ['charentais'], 'Petit melon israélien jaune strié de vert, chair vert pâle cerclée d’orange.', 'Small Israeli melon, yellow streaked with green, pale green flesh ringed with orange.', { origin: 'Israël' }),

  // --------------------------------------------------------------- Asiatiques
  v('sakatas-sweet', 'Sakata’s Sweet', 'makuwa', [A, 'Y', 'wf'], 0.3, 10, 80, 12, 8, 1, ['asian'], 'Petit melon oriental doré à écorce fine qui se mange, chair blanche croquante.', 'Small golden oriental melon with a thin edible rind, crisp white flesh.', { origin: 'Japon' }),
  v('ogon-makuwa', 'Makuwa doré (Ōgon)', 'makuwa', [A, 'Y', 'wf'], 0.3, 10, 75, 11, 8, 1.2, ['asian'], 'Le makuwa japonais classique, jaune d’or (85 % du marché d’Osaka en 1955).', 'The classic golden Japanese makuwa (85% of the Osaka market in 1955).', { origin: 'Japon' }),
  v('ginsen-makuwa', 'Makuwa Ginsen', 'makuwa', [A, 'Y', 'st', 'wf'], 0.45, 8, 75, 11, 8, 1.3, ['asian'], 'Melon coréen jaune à rayures blanches.', 'Korean yellow melon with white stripes.', { origin: 'Corée' }),
  v('katsura-giant', 'Katsura Giant (conomon)', 'conomon', [A, 'wf', 'al'], 1, 5, 70, 5, 10, 2.7, ['asian'], 'Melon à confire japonais vert pâle de 35 cm, chair blanche aigre-douce ; non climactérique.', 'Japanese pickling melon, pale green, 35 cm, sweet-sour white flesh; non-climacteric.', { origin: 'Japon' }),

  // -------------------------------------------------- Autres groupes
  v('armenian-cucumber', 'Melon serpent (Armenian cucumber)', 'flexuosus', ['wf'], 0.5, 8, 70, 3, 7, 7, ['snake'], 'Un MELON qui se mange comme un concombre, cueilli jeune (25–30 cm) ; peut atteindre 90 cm. Monoïque.', 'A MELON eaten like a cucumber, picked young (25–30 cm); can reach 90 cm. Monoecious.', { origin: 'Arménie / Moyen-Orient' }),
  v('queen-annes-pocket', 'Melon de poche de la reine Anne', 'dudaim', [A, 'Y', 'st', 'wf'], 0.15, 12, 80, 4, 20, 1, ['ornamental'], 'Petit fruit velouté rayé d’orange, cultivé pour son parfum (on le glissait dans la poche) ; chair fade.', 'Small velvety orange-striped fruit, grown for its scent (it was slipped into a pocket); bland flesh.', { origin: 'Asie centrale' }),
  v('tigger', 'Tigger', 'ameri', [A, 'Y', 'st', 'wf'], 0.4, 8, 85, 9, 8, 1.1, ['ornamental'], 'Petit melon jaune zébré de rouge-orangé, très parfumé, chair blanche.', 'Small yellow melon with red-orange zigzag stripes, very fragrant, white flesh.', { origin: 'Arménie' }),

  // ---------------------------------------------- Lignées sources (sélection)
  v('pi-161375', 'PI 161375 (Songwhan Charmi)', 'conomon', [A, 'Vat', 'wf', 'al'], 0.4, 6, 80, 8, 20, 1.3, ['donor', 'asian'], 'Lignée coréenne de référence : source de Vat (pucerons et virus) et d’allèles non climactériques. Sert de parent donneur en sélection.', 'Korean reference line: source of Vat (aphids and viruses) and non-climacteric alleles. Used as a donor parent in breeding.', { origin: 'Corée' }),
  v('pi-414723', 'PI 414723', 'momordica', ['Vat', 'Zym', 'wf'], 0.8, 5, 75, 5, 3, 1.4, ['donor'], 'Lignée indienne (snapmelon) monoïque : source de Vat, Zym (ZYMV) et d’une résistance à l’oïdium. Peu sucrée : parent donneur.', 'Indian monoecious snapmelon line: source of Vat, Zym (ZYMV) and a powdery-mildew resistance. Low sugar: donor parent.', { origin: 'Inde' }),
  v('wmr-29', 'WMR 29', 'momordica', ['Pmw', 'Prv', 'nsv', 'wf'], 0.7, 5, 80, 5, 4, 1.2, ['donor'], 'Lignée source de Pm-w (oïdium races 1, 2, 3), Prv (PRSV) et nsv (MNSV).', 'Source line for Pm-w (powdery mildew races 1, 2, 3), Prv (PRSV) and nsv (MNSV).', { origin: 'Inde' }),
  v('melon-sauvage', 'Melon sauvage (var. agrestis)', 'agrestis', ['So', 'Bif', 'wf'], 0.06, 12, 70, 3, 6, 1.1, ['donor'], 'Petits fruits sauvages ACIDES et AMERS (So, Bif dominants) : à ne pas manger. Utile pour montrer qu’un croisement avec un melon de dessert donne une F1 immangeable.', 'Small wild fruits, SOUR and BITTER (dominant So, Bif): do not eat. Useful to show that a cross with a dessert melon gives an inedible F1.', { origin: 'Inde' }),
];

export const VARIETY_BY_ID: Record<string, MelonVariety> = Object.fromEntries(MELON_VARIETIES.map((x) => [x.id, x]));
