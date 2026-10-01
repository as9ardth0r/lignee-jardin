/**
 * Bibliothèque de variétés de courges (5 espèces de Cucurbita).
 *
 * Il n’existe pas de base de données ouverte des variétés de courges
 * équivalente à Tatiana’s TOMATObase : ce catalogue est compilé à la main
 * d’après des catalogues de semenciers (Johnny’s Selected Seeds, Kokopelli,
 * Territorial, Fedco, West Coast Seeds, Seed Savers Exchange), la fiche
 * variétale allemande du DLR Rheinland-Pfalz et la liste des gènes du
 * Cucurbit Genetics Cooperative (Paris & Padley 2014).
 *
 * Valeurs chiffrées = ordres de grandeur (les sources divergent souvent).
 * Génotypes = DÉDUITS du phénotype décrit ; un gène n’est attribué
 * « pour de vrai » à une variété que lorsque la liste du CGC la cite
 * (ex. D chez ‘Fordhook’, M chez ‘Caserta’, n chez les courges de Styrie).
 * Pour les hybrides F1 du commerce, les gènes de résistance et de port sont
 * supposés hétérozygotes (un seul parent les apporte).
 */

import type { QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type SquashKind = 'summer' | 'pattypan' | 'winter' | 'pumpkin' | 'giant' | 'seed' | 'ornamental' | 'cushaw';

export interface SquashVariety {
  id: string;
  name: string;
  species: SpeciesId;
  /** Hybride interspécifique : l’autre espèce parente. */
  hybridWith?: SpeciesId;
  /** Fertilité (hybrides interspécifiques). */
  fertility?: number;
  variants: VariantId[];
  weightKg: number;
  fruits: number;
  days: number;
  brix: number;
  storageMonths: number;
  shapeRatio: number;
  ribs: number;
  kinds: SquashKind[];
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  /** Variété perso : haplotypes exacts de la lignée d’origine. */
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<SquashVariety, 'hybrid' | 'origin' | 'hybridWith' | 'fertility'>>;

function v(
  id: string,
  name: string,
  species: SpeciesId,
  variants: VariantId[],
  weightKg: number,
  fruits: number,
  days: number,
  brix: number,
  storageMonths: number,
  shapeRatio: number,
  ribs: number,
  kinds: SquashKind[],
  fr: string,
  en: string,
  opt: Opt = {}
): SquashVariety {
  return { id, name, species, variants, weightKg, fruits, days, brix, storageMonths, shapeRatio, ribs, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

export const SQUASH_VARIETIES: SquashVariety[] = [
  // ---------------------------------------------------------------- C. pepo
  v('black-beauty', 'Black Beauty', 'pepo', ['Bu', 'D'], 0.3, 20, 55, 3, 0.2, 5, 5, ['summer'], 'Courgette classique vert très foncé, buissonnante. Récoltée jeune, vers 20 cm.', 'Classic very dark green bush zucchini. Harvested young, around 20 cm.', { origin: 'USA' }),
  v('fordhook', 'Fordhook Zucchini', 'pepo', ['Bu', 'D'], 0.3, 18, 55, 3, 0.2, 5, 5, ['summer'], 'Variété de référence pour le gène D (tige et fruit foncés) dans la liste des gènes du CGC.', 'Reference variety for the D gene (dark stem and fruit) in the CGC gene list.', { origin: 'USA' }),
  v('nero-di-milano', 'Nero di Milano', 'pepo', ['Bu', 'D'], 0.3, 18, 50, 3, 0.2, 5, 5, ['summer'], 'Courgette italienne presque noire, très productive.', 'Italian almost-black zucchini, very productive.', { origin: 'Italie' }),
  v('verte-non-coureuse', 'Verte non coureuse d’Italie', 'pepo', ['Bu', 'D'], 0.3, 18, 55, 3, 0.2, 5, 5, ['summer'], 'La courgette de base des jardins français.', 'The standard zucchini of French gardens.', { origin: 'Italie' }),
  v('costata-romanesco', 'Costata Romanesco', 'pepo', ['Bu', 'st'], 0.3, 14, 52, 3.5, 0.2, 5.5, 80, ['summer'], 'Courgette côtelée vert clair tachetée, réputée la plus goûteuse. Grosse fleur, idéale farcie.', 'Ribbed, flecked light-green zucchini, reputed the tastiest. Big flowers, great for stuffing.', { origin: 'Italie' }),
  v('cocozelle', 'Cocozelle', 'pepo', ['Bu', 'st'], 0.3, 16, 50, 3, 0.2, 6, 10, ['summer'], 'Courgette longue rayée de vert foncé ; type ancien (l-1 « larges rayures » dans la liste du CGC).', 'Long zucchini striped dark green; old type (l-1 broad-stripe allele in the CGC list).', { origin: 'Italie' }),
  v('caserta', 'Caserta', 'pepo', ['Bu', 'st', 'M'], 0.3, 16, 50, 3, 0.2, 5, 5, ['summer'], 'Courgette rayée gris-vert ; citée pour M (feuilles marbrées d’argent) et les rayures fines.', 'Grey-green striped zucchini; cited for M (silver-mottled leaves) and narrow stripes.', { origin: 'USA' }),
  v('striato-ditalia', 'Striato d’Italia', 'pepo', ['Bu', 'st', 'M'], 0.3, 16, 52, 3, 0.2, 5.5, 20, ['summer'], 'Courgette rayée vert clair et foncé, feuilles marbrées d’argent (M).', 'Zucchini with light and dark green stripes, silver-mottled leaves (M).', { origin: 'Italie' }),
  v('bianca-goriziana', 'Bianca Goriziana', 'pepo', ['Bu', 'l1', 'l2'], 0.3, 16, 45, 3, 0.2, 4.5, 5, ['summer'], 'Courgette blanc ivoire, précoce.', 'Early ivory-white zucchini.', { origin: 'Italie' }),
  v('ronde-de-nice', 'Ronde de Nice', 'pepo', ['Bu', 'l1'], 0.25, 16, 50, 3, 0.2, 1, 5, ['summer'], 'Courgette ronde vert clair tacheté, à farcir ; récoltée à la taille d’une orange.', 'Round, speckled light-green zucchini for stuffing; harvested at orange size.', { origin: 'France' }),
  v('genovese', 'Genovese', 'pepo', ['Bu', 'l1'], 0.3, 16, 45, 3, 0.2, 4, 5, ['summer'], 'Courgette vert pâle italienne, tendre.', 'Tender pale-green Italian zucchini.', { origin: 'Italie' }),
  v('eight-ball', 'Eight Ball F1', 'pepo', ['Bu', 'D'], 0.2, 16, 50, 3, 0.2, 1, 5, ['summer'], 'Courgette ronde vert foncé, hybride.', 'Dark green round hybrid zucchini.', { hybrid: true }),
  v('gold-rush', 'Gold Rush F1', 'pepo', ['Bu', 'B'], 0.3, 16, 50, 3, 0.2, 5, 5, ['summer'], 'Courgette jaune d’or ; couleur probablement due au gène B (jaune précoce), hypothèse.', 'Golden zucchini; colour probably due to B (precocious yellow) — an assumption.', { hybrid: true }),
  v('dunja', 'Dunja F1', 'pepo', ['Bu', 'D', 'Pm0', 'Zym'], 0.3, 20, 47, 3, 0.2, 5, 5, ['summer'], 'Courgette hybride vert foncé à résistances intermédiaires déclarées (oïdium, ZYMV). Gènes supposés.', 'Dark green hybrid zucchini with declared intermediate resistances (powdery mildew, ZYMV). Genes assumed.', { hybrid: true }),
  v('early-prolific-straightneck', 'Early Prolific Straightneck', 'pepo', ['Bu', 'Y', 'Hr'], 0.3, 16, 50, 3, 0.2, 3.5, 5, ['summer'], 'Courge jaune citron à col droit ; type cité pour Y (fruit jaune).', 'Lemon-yellow straightneck; type cited for Y (yellow fruit).', { origin: 'USA' }),
  v('yellow-crookneck', 'Yellow Crookneck', 'pepo', ['Bu', 'Y', 'Hr', 'Wt'], 0.3, 14, 50, 3, 0.2, 3, 5, ['summer'], 'Courge jaune à col tors et verruqueuse (Wt, visible grâce à l’écorce dure Hr).', 'Warty yellow crookneck (Wt, visible thanks to the hard rind Hr).', { origin: 'USA' }),
  v('patisson-blanc', 'Pâtisson blanc', 'pepo', ['Bu', 'Di', 'W', 'Wf'], 0.25, 12, 50, 3, 0.3, 0.45, 50, ['pattypan'], 'Le pâtisson classique : disque festonné blanc, chair blanche (Di, W, Wf).', 'The classic pattypan: white scalloped disc, white flesh (Di, W, Wf).', { origin: 'Europe' }),
  v('bennings-green-tint', 'Bennings Green Tint', 'pepo', ['Bu', 'Di', 'l1', 'Wf'], 0.2, 12, 55, 3, 0.3, 0.45, 50, ['pattypan'], 'Pâtisson vert pâle, chair blanche.', 'Pale green pattypan, white flesh.', { origin: 'USA' }),
  v('sunburst', 'Sunburst F1', 'pepo', ['Bu', 'Di', 'B'], 0.2, 14, 52, 3, 0.3, 0.45, 50, ['pattypan'], 'Pâtisson jaune vif à pointe verte.', 'Bright yellow pattypan with a green tip.', { hybrid: true }),
  v('table-queen', 'Table Queen (acorn)', 'pepo', ['D'], 0.8, 5, 85, 8, 2.5, 1.1, 70, ['winter'], 'Courge « gland » vert foncé côtelée ; citée dans la liste du CGC (Mo : ne vire pas à l’orange).', 'Dark green ribbed acorn squash; cited in the CGC list (Mo: does not turn orange).', { origin: 'USA' }),
  v('honey-bear', 'Honey Bear F1 (acorn)', 'pepo', ['Bu', 'D', 'Pm0'], 0.5, 6, 85, 9, 2.5, 1.1, 60, ['winter'], 'Petite acorn buissonnante, tolérante à l’oïdium.', 'Small bush acorn, powdery-mildew tolerant.', { hybrid: true }),
  v('delicata', 'Delicata', 'pepo', ['st'], 0.8, 6, 100, 11, 3.5, 2.3, 15, ['winter'], 'Courge crème rayée de vert, chair sucrée, peau fine qui se mange (écorce tendre hr).', 'Cream squash striped green, sweet flesh, thin edible skin (soft rind hr).', { origin: 'USA' }),
  v('sweet-dumpling', 'Sweet Dumpling', 'pepo', ['st'], 0.3, 8, 100, 10, 2, 0.8, 60, ['winter'], 'Petite courge côtelée crème rayée de vert, portion individuelle.', 'Small ribbed cream squash with green stripes, single-serving.', { origin: 'USA' }),
  v('spaghetti', 'Courge spaghetti', 'pepo', ['l1', 'l2', 'mo'], 1.8, 4, 90, 5.5, 2, 1.6, 5, ['winter'], 'Chair qui se défait en filaments une fois cuite. Citée pour d, l-1, l-2 et mo (‘Vegetable Spaghetti’).', 'Flesh separates into strands when cooked. Cited for d, l-1, l-2 and mo (‘Vegetable Spaghetti’).', { origin: 'Chine / USA' }),
  v('connecticut-field', 'Connecticut Field', 'pepo', ['mo'], 9, 2, 110, 5, 2, 0.95, 40, ['pumpkin'], 'La citrouille d’Halloween historique d’Amérique du Nord.', 'The historic North American Halloween pumpkin.', { origin: 'USA' }),
  v('howden', 'Howden', 'pepo', ['mo'], 10, 2, 115, 5, 2, 1, 40, ['pumpkin'], 'Citrouille à lanterne, ronde et régulière.', 'Round, even jack-o’-lantern pumpkin.', { origin: 'USA' }),
  v('jack-o-lantern', 'Jack O’Lantern', 'pepo', ['mo'], 5, 3, 110, 5, 2, 1, 45, ['pumpkin'], 'Citrouille à sculpter ; citée pour qi (couleur intense).', 'Carving pumpkin; cited for qi (intense colour).', { origin: 'USA' }),
  v('small-sugar', 'Small Sugar (New England Pie)', 'pepo', ['mo'], 2.2, 3, 105, 7, 3, 0.85, 25, ['pumpkin'], 'Citrouille à tarte, chair fine et sucrée ; écorce tendre (hr).', 'Pie pumpkin with fine sweet flesh; soft rind (hr).', { origin: 'USA' }),
  v('winter-luxury', 'Winter Luxury', 'pepo', ['mo'], 3.2, 3, 105, 8, 2.5, 0.9, 15, ['pumpkin'], 'Citrouille à tarte à peau finement réticulée (comme une broderie).', 'Pie pumpkin with finely netted skin.', { origin: 'USA' }),
  v('wee-b-little', 'Wee-B-Little', 'pepo', ['Bu', 'mo'], 0.35, 8, 95, 6, 4, 0.7, 40, ['pumpkin', 'ornamental'], 'Mini-citrouille buissonnante, parfaite en pot.', 'Bush mini pumpkin, perfect in a container.', { origin: 'USA' }),
  v('jack-be-little', 'Jack Be Little', 'pepo', ['mo', 'Hr'], 0.2, 10, 100, 6, 6, 0.5, 65, ['pumpkin', 'ornamental'], 'Mini-citrouille aplatie côtelée, se conserve des mois en décoration.', 'Flattened, ribbed mini pumpkin that keeps for months as a decoration.', { origin: 'USA' }),
  v('casperita', 'Casperita F1', 'pepo', ['Bu', 'W', 'Pm0'], 0.35, 8, 80, 7, 3, 0.7, 40, ['pumpkin'], 'Mini-citrouille blanche semi-buissonnante, tolérante à l’oïdium.', 'Semi-bush white mini pumpkin, powdery-mildew tolerant.', { hybrid: true }),
  v('cinnamon-girl', 'Cinnamon Girl PMR F1', 'pepo', ['mo', 'Pm0'], 1.8, 4, 85, 7, 3, 0.9, 25, ['pumpkin'], 'Citrouille à tarte tolérante à l’oïdium.', 'Powdery-mildew-tolerant pie pumpkin.', { hybrid: true }),
  v('styrie', 'Courge de Styrie (Gleisdorfer)', 'pepo', ['n', 'st'], 4, 3, 105, 4, 3, 1, 10, ['seed'], 'Courge à huile autrichienne : graines vertes SANS enveloppe (n/n), apparues par mutation spontanée en Styrie.', 'Austrian oil pumpkin: green seeds WITHOUT a hull (n/n), from a spontaneous mutation in Styria.', { origin: 'Autriche' }),
  v('lady-godiva', 'Lady Godiva', 'pepo', ['n', 'mo', 'st'], 2.7, 3, 105, 4, 3, 1, 10, ['seed'], 'Courge à graines nues, orange rayée de vert.', 'Hull-less seed pumpkin, orange striped with green.', { origin: 'USA' }),
  v('kakai', 'Kakai', 'pepo', ['n', 'mo', 'st'], 3, 3, 100, 4.5, 3, 1, 10, ['seed'], 'Graines nues vert foncé ; orange rayée de noir.', 'Dark green hull-less seeds; orange with black stripes.', { origin: 'Japon' }),
  v('naked-bear', 'Naked Bear F1', 'pepo', ['n', 'mo'], 1.4, 4, 105, 5, 3, 0.95, 20, ['seed', 'pumpkin'], 'Citrouille hybride à graines semi-nues.', 'Hybrid pumpkin with semi-hull-less seeds.', { hybrid: true }),
  v('coloquinte-bicolore', 'Coloquinte bicolore (Small Bicolor Pear)', 'pepo', ['B', 'Hr', 'Bi', 'st'], 0.15, 20, 90, 3, 10, 1.6, 5, ['ornamental'], 'Coloquinte décorative jaune et verte. AMÈRE ET TOXIQUE : ne pas manger, et ne pas la cultiver près des courgettes dont on garde les graines.', 'Yellow-and-green ornamental gourd. BITTER AND TOXIC: do not eat, and do not grow near zucchini you save seed from.', { origin: 'ornement' }),
  v('coloquinte-verruqueuse', 'Coloquinte orange verruqueuse', 'pepo', ['mo', 'Hr', 'Wt', 'Bi'], 0.25, 15, 95, 3, 10, 1.2, 20, ['ornamental'], 'Coloquinte orange couverte de verrues. AMÈRE ET TOXIQUE.', 'Warty orange ornamental gourd. BITTER AND TOXIC.', { origin: 'ornement' }),

  // -------------------------------------------------------------- C. maxima
  v('rouge-vif-detampes', 'Rouge vif d’Étampes', 'maxima', ['Rd'], 8, 2, 110, 6, 3, 0.45, 75, ['winter', 'pumpkin'], 'Le potiron français par excellence (« Cendrillon ») : aplati, très côtelé, rouge-orangé. Couleur attribuée au gène Rd par hypothèse.', 'The quintessential French pumpkin (“Cinderella”): flat, deeply ribbed, red-orange. Colour attributed to Rd by assumption.', { origin: 'France' }),
  v('galeux-deysines', 'Galeux d’Eysines', 'maxima', ['pk', 'Wt'], 6, 2, 100, 8, 5, 0.6, 35, ['winter'], 'Potiron saumon couvert de « galles » liégeuses, chair fine pour les soupes. Hérédité des galles non publiée.', 'Salmon pumpkin covered in corky “warts”, fine flesh for soups. Wart inheritance unpublished.', { origin: 'France' }),
  v('potimarron', 'Potimarron (Red Kuri, Uchiki Kuri)', 'maxima', ['Rd'], 1.5, 4, 95, 11, 4, 1.0, 10, ['winter'], 'Petit potiron en goutte, rouge-orangé, goût de châtaigne ; se mange avec la peau.', 'Small teardrop red-orange squash with a chestnut flavour; eaten skin and all.', { origin: 'Japon' }),
  v('blue-kuri', 'Blue Kuri (Hokkaido bleu)', 'maxima', ['bl'], 1.5, 4, 95, 11, 4, 1.0, 10, ['winter'], 'Le potimarron en version bleu-gris.', 'Blue-grey version of the red kuri.', { origin: 'Japon' }),
  v('blue-hubbard', 'Blue Hubbard', 'maxima', ['bl', 'Hr'], 6, 2, 100, 9, 6, 1.6, 10, ['winter'], 'Grosse courge bleu-gris à bouts pointus, écorce très dure ; type de référence du gène bl.', 'Large blue-grey squash with pointed ends and very hard rind; reference type for the bl gene.', { origin: 'USA' }),
  v('golden-hubbard', 'Golden Hubbard', 'maxima', ['Rd', 'Hr'], 5, 2, 100, 9, 5, 1.6, 10, ['winter'], 'Hubbard rouge-orangé.', 'Red-orange Hubbard.', { origin: 'USA' }),
  v('blue-ballet', 'Blue Ballet', 'maxima', ['bl', 'Hr'], 2.2, 3, 95, 10, 5, 1.5, 5, ['winter'], 'Hubbard bleu de petit format.', 'Small-sized blue Hubbard.', { origin: 'USA' }),
  v('buttercup', 'Buttercup (Burgess)', 'maxima', ['Tu'], 1.8, 3, 95, 12, 5, 0.7, 10, ['winter'], 'Vert foncé avec un « bouton » gris au bout, chair sèche très sucrée.', 'Dark green with a grey “button” at the end, dry and very sweet flesh.', { origin: 'USA' }),
  v('bonbon', 'Bonbon F1', 'maxima', ['Tu', 'Bu'], 2, 4, 95, 12, 5.5, 0.7, 10, ['winter'], 'Buttercup hybride semi-buissonnant.', 'Semi-bush hybrid buttercup.', { hybrid: true }),
  v('ambercup', 'Ambercup', 'maxima', ['Rd', 'Tu'], 2, 3, 95, 11, 4, 0.75, 10, ['winter'], 'Type buttercup/kabocha rouge écarlate.', 'Scarlet buttercup/kabocha type.', { origin: 'USA' }),
  v('sunshine', 'Sunshine F1 (kabocha)', 'maxima', ['Rd'], 2.2, 4, 95, 11, 3.5, 0.75, 10, ['winter'], 'Kabocha rouge écarlate, chair orange vif.', 'Scarlet kabocha with bright orange flesh.', { hybrid: true }),
  v('delica', 'Delica F1 (kabocha)', 'maxima', [], 1.7, 4, 90, 12, 4, 0.75, 10, ['winter'], 'Le kabocha japonais vert foncé, chair farineuse et sucrée.', 'The dark green Japanese kabocha, floury sweet flesh.', { hybrid: true, origin: 'Japon' }),
  v('sweet-jade', 'Sweet Jade', 'maxima', [], 0.7, 6, 95, 12, 5, 0.8, 10, ['winter'], 'Mini-kabocha vert, une portion.', 'Green mini kabocha, a single serving.', { origin: 'Japon' }),
  v('turks-turban', 'Turban turc', 'maxima', ['Rd', 'Tu'], 2, 3, 95, 7, 3, 0.8, 20, ['winter', 'ornamental'], 'Turban rouge coiffé d’un bouton rayé ; cité pour Rd (écorce rouge). Décoratif et comestible.', 'Red turban topped with a striped button; cited for Rd (red rind). Decorative and edible.', { origin: 'ancien' }),
  v('marina-di-chioggia', 'Marina di Chioggia', 'maxima', ['Wt', 'Tu'], 4, 2, 100, 10, 4, 0.6, 30, ['winter'], 'Turban vert-bleu couvert de verrues, chair très sucrée (gnocchi vénitiens).', 'Warty blue-green turban, very sweet flesh (Venetian gnocchi).', { origin: 'Italie' }),
  v('jarrahdale', 'Jarrahdale', 'maxima', ['bl'], 6.5, 2, 100, 9, 6, 0.55, 70, ['winter'], 'Potiron bleu-gris aplati et côtelé, chair dense.', 'Flat, ribbed blue-grey pumpkin with dense flesh.', { origin: 'Australie' }),
  v('queensland-blue', 'Queensland Blue', 'maxima', ['bl'], 6, 2, 115, 9, 8, 0.55, 75, ['winter'], 'Bleu, très côtelé, excellente conservation.', 'Blue, deeply ribbed, excellent keeper.', { origin: 'Australie' }),
  v('bleu-de-hongrie', 'Bleu de Hongrie', 'maxima', ['bl'], 7, 2, 110, 9, 8, 0.7, 40, ['winter'], 'Gros potiron gris-bleu, longue conservation.', 'Large grey-blue pumpkin, long keeping.', { origin: 'Hongrie' }),
  v('triamble', 'Triamble (Shamrock)', 'maxima', ['bl'], 6, 2, 120, 9, 8, 0.7, 95, ['winter'], 'Curieux fruit à trois lobes, gris-bleu.', 'Curious three-lobed grey-blue fruit.', { origin: 'Australie' }),
  v('sweet-meat', 'Sweet Meat', 'maxima', ['bl'], 7, 2, 100, 10, 6, 0.6, 30, ['winter'], 'Potiron gris ardoise de l’Oregon, chair sucrée.', 'Slate-grey Oregon squash, sweet flesh.', { origin: 'USA' }),
  v('pink-banana', 'Pink Banana Jumbo', 'maxima', ['pk'], 12, 2, 105, 7, 5, 4.5, 5, ['winter'], 'Courge « banane » rose saumon, jusqu’à 1 m de long.', 'Salmon-pink “banana” squash, up to 1 m long.', { origin: 'USA' }),
  v('candy-roaster', 'North Georgia Candy Roaster', 'maxima', ['pk'], 5, 2, 100, 10, 4, 3, 5, ['winter'], 'Courge banane rose à bout vert, variété des Cherokees.', 'Pink banana squash with a green tip, a Cherokee heirloom.', { origin: 'USA' }),
  v('porcelain-doll', 'Porcelain Doll F1', 'maxima', ['pk'], 9, 2, 110, 8, 4, 0.6, 70, ['winter', 'pumpkin'], 'Potiron rose pâle côtelé.', 'Pale pink ribbed pumpkin.', { hybrid: true }),
  v('valenciano', 'Valenciano', 'maxima', ['W'], 5.5, 2, 110, 8, 6, 0.55, 50, ['winter', 'pumpkin'], 'Potiron blanc aplati, chair orange. Blanc attribué à W par hypothèse (gène documenté chez C. pepo).', 'Flat white pumpkin, orange flesh. White attributed to W by assumption (gene documented in C. pepo).', { origin: 'Espagne' }),
  v('flat-white-boer', 'Flat White Boer', 'maxima', ['W'], 9, 2, 110, 8, 4, 0.5, 45, ['winter', 'pumpkin'], 'Grand potiron blanc plat d’Afrique du Sud.', 'Large flat white pumpkin from South Africa.', { origin: 'Afrique du Sud' }),
  v('gold-nugget', 'Gold Nugget', 'maxima', ['Bu', 'mo'], 0.6, 5, 85, 9, 3, 0.9, 10, ['winter'], 'Petit potiron orange sur plante BUISSONNANTE : exemple du gène Bu chez C. maxima.', 'Small orange squash on a BUSH plant: an example of Bu in C. maxima.', { origin: 'USA' }),
  v('jaune-gros-de-paris', 'Jaune gros de Paris', 'maxima', ['mo'], 40, 1, 115, 5, 4, 0.55, 40, ['giant', 'pumpkin'], 'Potiron géant jaune-orangé ancien (Gelber Zentner).', 'Old giant yellow-orange pumpkin (Gelber Zentner).', { origin: 'France' }),
  v('big-max', 'Big Max', 'maxima', ['mo'], 40, 1, 120, 4, 2, 0.85, 30, ['giant', 'pumpkin'], 'Potiron de concours de plusieurs dizaines de kilos.', 'Show pumpkin weighing several tens of kilos.', { origin: 'USA' }),
  v('atlantic-giant', 'Atlantic Giant (Dill’s)', 'maxima', ['mo'], 90, 1, 125, 3.5, 2, 0.8, 30, ['giant'], 'La variété des records : couramment 50 à 200 kg, et plus d’une tonne pour les champions (avec une seule courge par plante).', 'The record variety: commonly 50–200 kg, and over a tonne for champions (with one fruit per plant).', { origin: 'Canada' }),
  v('tetsukabuto', 'Tetsukabuto F1', 'maxima', [], 2, 3, 100, 11, 6, 0.8, 10, ['winter'], 'Hybride ENTRE ESPÈCES (C. maxima ♀ × C. moschata ♂, Japon 1951). Vigoureux, mais STÉRILE : il faut planter un potiron à côté pour qu’il fasse des fruits, et ses graines ne donnent rien.', 'INTERSPECIFIC hybrid (C. maxima ♀ × C. moschata ♂, Japan 1951). Vigorous but STERILE: needs a maxima pollinator nearby to set fruit, and its seed is useless.', { hybrid: true, hybridWith: 'moschata', fertility: 0, origin: 'Japon' }),

  // ------------------------------------------------------------ C. moschata
  v('waltham-butternut', 'Waltham Butternut', 'moschata', ['Bn'], 1.8, 5, 105, 10, 7, 2.2, 5, ['winter'], 'Le butternut de référence : chamois, en forme de cloche (Bn).', 'The reference butternut: buff, bell-shaped (Bn).', { origin: 'USA' }),
  v('butterbush', 'Butterbush', 'moschata', ['Bu', 'Bn'], 0.8, 5, 90, 10, 5, 2, 5, ['winter'], 'Butternut BUISSONNANT, pour petits jardins.', 'BUSH butternut, for small gardens.', { origin: 'USA' }),
  v('butterbaby', 'Butterbaby F1', 'moschata', ['Bn', 'Pm0'], 0.7, 7, 100, 11, 3, 1.9, 5, ['winter'], 'Mini-butternut, tolérance intermédiaire à l’oïdium.', 'Mini butternut, intermediate powdery-mildew tolerance.', { hybrid: true }),
  v('honeynut', 'Honeynut', 'moschata', ['Bn'], 0.6, 7, 110, 13, 3.5, 2, 5, ['winter'], 'Mini-butternut très sucré, vire au orange foncé à maturité.', 'Very sweet mini butternut, turns deep orange when ripe.', { origin: 'USA' }),
  v('metro-pmr', 'Metro PMR F1', 'moschata', ['Bn', 'Pm0'], 1.3, 5, 105, 10, 7, 2.1, 5, ['winter'], 'Butternut tolérant à l’oïdium.', 'Powdery-mildew-tolerant butternut.', { hybrid: true }),
  v('musquee-de-provence', 'Musquée de Provence', 'moschata', [], 10, 2, 120, 8.5, 8, 0.45, 80, ['winter', 'pumpkin'], 'Grosse courge aplatie très côtelée, vert sombre virant ocre ; chair orange parfumée, vendue en tranches.', 'Large flat, deeply ribbed squash, dark green turning ochre; fragrant orange flesh, sold by the slice.', { origin: 'France' }),
  v('longue-de-nice', 'Longue de Nice', 'moschata', [], 6, 2, 115, 8, 8, 5.5, 5, ['winter'], 'Très longue courge musquée, jusqu’à 1 m, bout renflé. Jeune, se mange comme une courgette.', 'Very long musk squash, up to 1 m, with a bulbous end. Young, eaten like a zucchini.', { origin: 'France' }),
  v('sucrine-du-berry', 'Sucrine du Berry', 'moschata', [], 2, 4, 100, 10, 5, 1.5, 5, ['winter'], 'Courge musquée en poire, verte virant ocre, très sucrée.', 'Pear-shaped musk squash, green turning ochre, very sweet.', { origin: 'France' }),
  v('long-island-cheese', 'Long Island Cheese', 'moschata', [], 3.5, 3, 108, 9, 8, 0.5, 50, ['winter', 'pumpkin'], 'Aplatie comme une meule de fromage, chamois ; excellente conservation.', 'Flattened like a wheel of cheese, buff; excellent keeper.', { origin: 'USA' }),
  v('seminole', 'Seminole', 'moschata', [], 2.5, 8, 110, 9, 12, 1.3, 5, ['winter'], 'Courge des Séminoles de Floride : très vigoureuse, résiste à la chaleur, se conserve un an. Porte pm-2 (résistance récessive à l’oïdium, non modélisée ici).', 'Florida Seminole squash: very vigorous, heat-tolerant, keeps a year. Carries pm-2 (recessive mildew resistance, not modelled here).', { origin: 'USA' }),
  v('tromboncino', 'Tromboncino (Rampicante)', 'moschata', [], 0.4, 12, 60, 3.5, 0.3, 7, 5, ['summer'], 'Courgette coureuse ligurienne : jeune, se mange comme une courgette ; laissée mûrir, devient une courge musquée.', 'Ligurian climbing zucchini: young, eaten like a zucchini; left to ripen, becomes a musk squash.', { origin: 'Italie' }),
  v('black-futsu', 'Black Futsu', 'moschata', ['Gr', 'Wt'], 1.3, 4, 105, 11, 4.5, 0.6, 60, ['winter'], 'Courge japonaise verte côtelée et bosselée (verrues : hypothèse), chair au goût de noisette.', 'Japanese ribbed, bumpy green squash (warts: an assumption), nutty flesh.', { origin: 'Japon' }),
  v('violina', 'Violina (Rugosa)', 'moschata', ['Bn', 'Wt'], 3, 3, 110, 10, 10, 2.4, 5, ['winter'], 'Butternut italien en violon, à peau bosselée ocre ; se conserve jusqu’à un an.', 'Italian violin-shaped butternut with bumpy ochre skin; keeps up to a year.', { origin: 'Italie' }),
  v('long-of-naples', 'Longue de Naples (Long Neapolitan)', 'moschata', ['Gr'], 10, 2, 120, 8, 8, 5, 5, ['winter'], 'Très longue courge musquée restant VERTE à maturité : variété citée pour Gr.', 'Very long musk squash that stays GREEN when ripe: variety cited for Gr.', { origin: 'Italie' }),
  v('pennsylvania-dutch-crookneck', 'Pennsylvania Dutch Crookneck', 'moschata', [], 6, 2, 110, 9, 7, 4, 5, ['winter'], 'Courge musquée à long col recourbé (bn).', 'Musk squash with a long curved neck (bn).', { origin: 'USA' }),
  v('tahitian-melon', 'Tahitian Melon', 'moschata', [], 8, 2, 120, 12, 7, 4.5, 5, ['winter'], 'Col tors très sucré, se mange parfois cru comme un melon.', 'Very sweet crookneck, sometimes eaten raw like a melon.', { origin: 'USA' }),
  v('nigerian-local', 'Nigerian Local', 'moschata', ['Zym'], 3, 4, 110, 8, 5, 1, 20, ['winter'], 'Variété locale africaine, source de résistances virales (ZYMV, CMV). Valeurs chiffrées inconnues : indicatives.', 'African landrace, source of virus resistances (ZYMV, CMV). Figures unknown: indicative only.', { origin: 'Nigeria' }),
  v('menina', 'Menina', 'moschata', ['Zym'], 5, 3, 115, 8, 6, 1.2, 20, ['winter'], 'Courge musquée portugaise d’où vient la résistance au ZYMV introduite dans les courgettes. Valeurs indicatives.', 'Portuguese musk squash, source of the ZYMV resistance bred into zucchini. Indicative figures.', { origin: 'Portugal' }),
  v('wan-fu', 'Wan Fu F1', 'moschata', ['Pm0'], 4, 3, 110, 9, 6, 0.55, 40, ['winter', 'pumpkin'], 'Courge musquée aplatie, tolérante à l’oïdium.', 'Flattened musk squash, powdery-mildew tolerant.', { hybrid: true }),

  // --------------------------------------------------------- C. argyrosperma
  v('green-striped-cushaw', 'Green Striped Cushaw', 'argyrosperma', ['st'], 5, 3, 110, 6, 4, 3, 5, ['cushaw'], 'Col tors crème rayé de vert, chair pâle ; résiste bien à la chaleur et aux foreurs de tiges.', 'Cream crookneck striped green, pale flesh; handles heat and vine borers well.', { origin: 'USA / Mexique' }),
  v('white-cushaw', 'White Cushaw', 'argyrosperma', ['W'], 6, 2, 110, 6, 4, 3, 5, ['cushaw'], 'Cushaw blanc à col tors.', 'White crookneck cushaw.', { origin: 'USA' }),
  v('tennessee-sweet-potato', 'Tennessee Sweet Potato', 'argyrosperma', ['st'], 4, 2, 100, 7, 5, 1.6, 5, ['cushaw'], 'Poire crème rayée de vert, goût de patate douce.', 'Cream pear striped green, sweet-potato flavour.', { origin: 'USA' }),
  v('pipian', 'Pipián (courge à graines argentées)', 'argyrosperma', ['st'], 1.5, 5, 110, 4, 4, 1, 10, ['seed'], 'Cultivée au Mexique pour ses grandes graines bordées d’argent (sauce pipián), chair peu intéressante.', 'Grown in Mexico for its large silver-edged seeds (pipián sauce), flesh of little interest.', { origin: 'Mexique' }),

  // ----------------------------------------------------------- C. ficifolia
  v('courge-de-siam', 'Courge de Siam (chilacayote)', 'ficifolia', [], 3, 12, 140, 4, 12, 1.55, 5, ['winter'], 'Vigueur énorme (jusqu’à 15 m), feuilles de figuier, graines noires ; fruit vert marbré qui se garde jusqu’à 2 ans. Confiture de cheveux d’ange. Ne se croise avec AUCUNE autre courge cultivée.', 'Huge vigour (up to 15 m), fig-like leaves, black seeds; marbled green fruit that keeps up to 2 years. Angel-hair jam. Crosses with NO other cultivated squash.', { origin: 'Andes' }),
];

export const VARIETY_BY_ID: Record<string, SquashVariety> = Object.fromEntries(SQUASH_VARIETIES.map((x) => [x.id, x]));
