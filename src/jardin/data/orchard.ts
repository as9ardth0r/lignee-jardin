/**
 * Fruitiers et petits fruits.
 *
 * Plantation en repos de végétation (novembre à mars, « à la Sainte-
 * Catherine tout bois prend racine »). daysToHarvest = première récolte
 * comptée depuis une plantation de début décembre : elle tombe l'été
 * suivant pour les petits fruits, 2 à 4 ans plus tard pour les arbres
 * (porte-greffe moyen) ; l'app reporte ensuite la fenêtre de récolte d'une
 * année sur l'autre. Rendements en kg de fruits par m² occupé par l'arbre
 * ou l'arbuste adulte, exportations par kg de fruits : ordres de grandeur.
 * Sources : catalogues de pépiniéristes (Pépinières Lepage, Georges
 * Delbard, Promesse de fleurs), fiches CTIFL et Inrae (arboriculture
 * fruitière), Société pomologique, guides de la taille fruitière.
 */
import type { Family, Feeding, Frost, MonthRange, Species, SpeciesExtra, Sun, Txt } from '../model';

const T = (fr: string, en: string): Txt => ({ fr, en });

interface Def {
  id: string;
  name: Txt;
  latin: string;
  emoji: string;
  family: Family;
  sun: Sun;
  frost: Frost;
  pH?: [number, number];
  /** Espacement (cm) entre rangs et sur le rang. */
  spacing: [number, number];
  plantOut?: MonthRange[];
  /** Première récolte [début, fin] en jours depuis la plantation. */
  harvest: [number, number];
  yieldM2: [number, number];
  feeding: Feeding;
  root: number;
  height: number;
  /** Mois de récolte (rappel, région parisienne). */
  months: MonthRange;
  note: Txt;
  /** Multiplication : prix (€/kg), conseil. */
  prop: [number, string, string];
}

function fruit(d: Def): { species: Species; extra: SpeciesExtra; height: number } {
  const [h0, h1] = d.harvest;
  return {
    species: {
      id: d.id,
      name: d.name,
      latin: d.latin,
      emoji: d.emoji,
      family: d.family,
      type: 'orchard',
      life: 'perennial',
      sun: d.sun,
      frost: d.frost,
      tBase: d.frost === 'half' ? 8 : 6,
      tOpt: [18, 26],
      pH: d.pH ?? [6, 7.5],
      spacing: { row: d.spacing[0], inRow: d.spacing[1] },
      plantOut: d.plantOut ?? [[11, 3]],
      daysToHarvest: d.harvest,
      season: h1 + 30,
      stages: [['vegetative', 0], ['flowering', Math.max(30, h0 - 100)], ['fruiting', Math.max(60, h0 - 60)], ['harvest', h0]],
      kc: [0.5, 0.95, 0.75],
      rootDepth: d.root,
      yieldM2: d.yieldM2,
      exports: { N: 1.0, P2O5: 0.4, K2O: 2.0 },
      feeding: d.feeding,
      returnYears: 6,
      note: d.note,
    },
    extra: { seedLife: 0, pollination: 'vegetative', isolation: 0, priceKg: d.prop[0], trueToSeed: 'no', seedTip: { fr: d.prop[1], en: d.prop[2] } },
    height: d.height,
  };
}

const DEFS: Def[] = [
  // --- Petits fruits ------------------------------------------------------------------
  {
    id: 'raspberry', name: T('Framboisier', 'Raspberry'), latin: 'Rubus idaeus', emoji: '🫐', family: 'rosaceae', sun: 'full', frost: 'hardy', pH: [5.5, 6.8],
    spacing: [150, 50], harvest: [210, 320], yieldM2: [0.8, 1.5], feeding: 'medium', root: 0.4, height: 150, months: [6, 10],
    note: T('Remontant (fruits l’été et l’automne) : couper toutes les cannes au ras du sol en février. Non remontant : couper seulement les cannes qui ont produit, après la récolte. Pailler épais, sol frais un peu acide. Palisser sur deux fils.', 'Everbearing (summer and autumn fruit): cut all canes to the ground in February. Summer-fruiting: cut only the canes that fruited, after harvest. Mulch thickly, moist slightly acid soil. Train on two wires.'),
    prop: [15, 'Les drageons qui sortent autour se replantent en novembre : on ne sème jamais un framboisier.', 'The suckers that come up around are replanted in November: raspberries are never grown from seed.'],
  },
  {
    id: 'blackberry', name: T('Mûrier sans épines', 'Thornless blackberry'), latin: 'Rubus fruticosus (cultivars inermes)', emoji: '🫐', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [300, 250], harvest: [610, 670], yieldM2: [1, 2], feeding: 'medium', root: 0.6, height: 200, months: [8, 9],
    note: T('Fructifie sur les tiges de l’année précédente : palisser les nouvelles tiges d’un côté, couper au sol celles qui ont produit. Très vigoureux, peu exigeant.', 'Fruits on last year’s canes: train new canes to one side, cut fruited ones to the ground. Very vigorous, undemanding.'),
    prop: [12, 'Marcotter en été : enterrer la pointe d’une tige, elle s’enracine en quelques semaines.', 'Tip-layer in summer: bury the end of a cane, it roots in a few weeks.'],
  },
  {
    id: 'redcurrant', name: T('Groseillier à grappes', 'Redcurrant'), latin: 'Ribes rubrum', emoji: '🍒', family: 'grossulariaceae', sun: 'partial', frost: 'hardy',
    spacing: [150, 120], harvest: [210, 240], yieldM2: [0.8, 1.5], feeding: 'medium', root: 0.4, height: 120, months: [6, 7],
    note: T('Supporte la mi-ombre et le froid. Tailler en hiver en gardant 8 à 10 branches, en supprimant les plus vieilles (plus de 3 ans). Filet contre les merles.', 'Copes with part shade and cold. Prune in winter keeping 8–10 branches, removing the oldest (over 3 years). Net against blackbirds.'),
    prop: [12, 'Boutures de bois sec de 20 cm piquées en terre en novembre.', 'Hardwood cuttings of 20 cm pushed into the soil in November.'],
  },
  {
    id: 'blackcurrant', name: T('Cassissier', 'Blackcurrant'), latin: 'Ribes nigrum', emoji: '🫐', family: 'grossulariaceae', sun: 'partial', frost: 'hardy',
    spacing: [180, 150], harvest: [210, 240], yieldM2: [0.6, 1.2], feeding: 'heavy', root: 0.4, height: 150, months: [7, 7],
    note: T('Fructifie sur le bois d’un an : chaque hiver, couper au ras un tiers des vieilles branches. Gourmand en azote, pailler. Feuilles en tisane.', 'Fruits on one-year-old wood: each winter cut a third of the old branches to the ground. Hungry for nitrogen, mulch. Leaves for tea.'),
    prop: [15, 'Boutures de bois sec en novembre, plantées profond (2 yeux dehors).', 'Hardwood cuttings in November, planted deep (2 buds showing).'],
  },
  {
    id: 'gooseberry', name: T('Groseillier à maquereau', 'Gooseberry'), latin: 'Ribes uva-crispa', emoji: '🍈', family: 'grossulariaceae', sun: 'partial', frost: 'hardy',
    spacing: [150, 120], harvest: [210, 240], yieldM2: [0.8, 1.5], feeding: 'medium', root: 0.4, height: 120, months: [6, 7],
    note: T('Épineux : tailler en gobelet ouvert pour cueillir et aérer (oïdium). Gros fruits verts, jaunes ou rouges.', 'Thorny: prune to an open goblet for picking and airflow (mildew). Large green, yellow or red berries.'),
    prop: [12, 'Boutures de bois sec ou marcottage par buttage.', 'Hardwood cuttings or mound layering.'],
  },
  {
    id: 'blueberry', name: T('Myrtillier', 'Blueberry'), latin: 'Vaccinium corymbosum', emoji: '🫐', family: 'ericaceae', sun: 'full', frost: 'hardy', pH: [5, 5.8],
    spacing: [150, 120], harvest: [220, 270], yieldM2: [0.5, 1], feeding: 'light', root: 0.3, height: 150, months: [7, 8],
    note: T('Exige une terre ACIDE (pH 4,5 à 5,5) : en sol calcaire, planter dans un grand bac de terre de bruyère. Arroser à l’eau de pluie. Planter 2 variétés pour une meilleure pollinisation.', 'Needs ACID soil (pH 4.5–5.5): on limy soil, plant in a large tub of ericaceous compost. Water with rainwater. Plant 2 varieties for better pollination.'),
    prop: [20, 'Boutures de bois tendre en juin sous châssis ; lent.', 'Softwood cuttings in June under a frame; slow.'],
  },
  {
    id: 'kiwi', name: T('Kiwi', 'Kiwifruit'), latin: 'Actinidia deliciosa, A. arguta', emoji: '🥝', family: 'actinidiaceae', sun: 'full', frost: 'hardy',
    spacing: [400, 400], harvest: [1400, 1460], yieldM2: [2, 4], feeding: 'heavy', root: 0.8, height: 400, months: [10, 11],
    note: T('Liane vigoureuse sur pergola. Plants mâles et femelles séparés : 1 mâle pour 6 femelles (sauf variétés autofertiles). Craint les gelées de printemps. Les kiwaïs (A. arguta) se mangent avec la peau.', 'Vigorous climber for a pergola. Separate male and female plants: 1 male for 6 females (except self-fertile varieties). Dislikes spring frosts. Kiwiberries (A. arguta) are eaten skin and all.'),
    prop: [4, 'Boutures d’été ; acheter les pieds sexés pour être sûr d’avoir un mâle et des femelles.', 'Summer cuttings; buy sexed plants to be sure of a male and females.'],
  },
  {
    id: 'grape', name: T('Vigne de table', 'Table grape'), latin: 'Vitis vinifera', emoji: '🍇', family: 'vitaceae', sun: 'full', frost: 'hardy', pH: [6, 8],
    spacing: [200, 120], harvest: [1000, 1050], yieldM2: [0.8, 1.5], feeding: 'light', root: 1, height: 200, months: [9, 10],
    note: T('Contre un mur au sud. Taille courte en hiver (2 yeux par coursons), pincer les rameaux en été. Mildiou et oïdium : choisir des variétés résistantes (Muscat bleu, Vanessa, Suffolk Red).', 'Against a south wall. Short winter pruning (2 buds per spur), pinch shoots in summer. Downy and powdery mildew: choose resistant varieties (Muscat Bleu, Vanessa, Suffolk Red).'),
    prop: [5, 'Boutures de sarments de 30 cm en hiver ; les variétés sensibles au phylloxéra se greffent.', '30 cm cane cuttings in winter; phylloxera-sensitive varieties are grafted.'],
  },

  // --- Arbres fruitiers ----------------------------------------------------------------
  {
    id: 'apple', name: T('Pommier', 'Apple'), latin: 'Malus domestica', emoji: '🍎', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [400, 400], harvest: [990, 1060], yieldM2: [2, 4], feeding: 'medium', root: 1, height: 400, months: [8, 10],
    note: T('Il faut un autre pommier (ou un pommier à fleurs) qui fleurit en même temps dans les environs pour la pollinisation. Taille d’hiver en gobelet ; éclaircir les fruits en juin. Variétés résistantes à la tavelure : Reine des reinettes, Melrose, Ariane…', 'Needs another apple (or crab apple) flowering at the same time nearby for pollination. Winter pruning to a goblet; thin fruit in June. Scab-resistant varieties: Reine des Reinettes, Melrose, Ariane…'),
    prop: [2.5, 'Les pépins ne redonnent pas la variété : on greffe (écusson en août, fente en mars) sur un porte-greffe qui fixe la vigueur.', 'Pips do not come true: varieties are grafted (bud in August, cleft in March) onto a rootstock that sets the vigour.'],
  },
  {
    id: 'pear', name: T('Poirier', 'Pear'), latin: 'Pyrus communis', emoji: '🍐', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [400, 400], harvest: [990, 1060], yieldM2: [1.5, 3], feeding: 'medium', root: 1, height: 450, months: [8, 10],
    note: T('Pollinisation croisée nécessaire (Conférence est partiellement autofertile). Cueillir un peu avant maturité et finir au fruitier. Craint le feu bactérien et la tavelure.', 'Needs cross-pollination (Conference is partly self-fertile). Pick slightly before ripe and finish indoors. Prone to fireblight and scab.'),
    prop: [3, 'Greffe sur cognassier (petit arbre) ou franc (grand arbre).', 'Grafted onto quince (small tree) or pear seedling (large tree).'],
  },
  {
    id: 'plum', name: T('Prunier', 'Plum'), latin: 'Prunus domestica', emoji: '🟣', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [400, 400], harvest: [950, 1020], yieldM2: [1.5, 3], feeding: 'medium', root: 1, height: 400, months: [7, 9],
    note: T('Reine-claude, mirabelle, quetsche : beaucoup sont autofertiles. Tailler peu, en été (le prunier craint les plaies d’hiver : maladie du plomb).', 'Greengage, mirabelle, damson: many are self-fertile. Prune lightly, in summer (winter wounds invite silver leaf).'),
    prop: [3, 'Greffe ; certaines mirabelles et quetsches se reproduisent par drageons.', 'Grafting; some mirabelles and damsons come true from suckers.'],
  },
  {
    id: 'cherry', name: T('Cerisier', 'Sweet cherry'), latin: 'Prunus avium', emoji: '🍒', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [500, 500], harvest: [920, 960], yieldM2: [0.8, 1.5], feeding: 'medium', root: 1, height: 500, months: [6, 7],
    note: T('Beaucoup de variétés ont besoin d’un pollinisateur (Stella, Sunburst sont autofertiles). Filet contre les oiseaux ; mouche de la cerise et Drosophila suzukii : cueillir dès maturité.', 'Many varieties need a pollinator (Stella, Sunburst are self-fertile). Net against birds; cherry fly and Drosophila suzukii: pick as soon as ripe.'),
    prop: [6, 'Greffe sur merisier ou porte-greffe nanisant (Gisela).', 'Grafted on wild cherry or a dwarfing rootstock (Gisela).'],
  },
  {
    id: 'peach', name: T('Pêcher', 'Peach'), latin: 'Prunus persica', emoji: '🍑', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [400, 400], harvest: [600, 660], yieldM2: [1.5, 3], feeding: 'medium', root: 0.8, height: 350, months: [7, 9],
    note: T('Autofertile, fructifie sur le bois de l’année précédente : taille chaque année. Cloque : variétés tolérantes (Pêche de vigne, Charles Ingouf) et bouillie bordelaise à la chute des feuilles.', 'Self-fertile, fruits on last year’s wood: prune every year. Leaf curl: tolerant varieties (vine peach, Charles Ingouf) and copper spray at leaf fall.'),
    prop: [4, 'Les pêches de vigne se ressèment assez fidèlement par le noyau ; les autres se greffent.', 'Vine peaches come fairly true from the stone; others are grafted.'],
  },
  {
    id: 'apricot', name: T('Abricotier', 'Apricot'), latin: 'Prunus armeniaca', emoji: '🍑', family: 'rosaceae', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [500, 500], harvest: [940, 980], yieldM2: [1, 2], feeding: 'medium', root: 1, height: 400, months: [7, 7],
    note: T('Fleurit très tôt : au nord de la Loire, contre un mur au sud et voile les nuits de gel en mars. Autofertile. Sol calcaire et sec.', 'Flowers very early: north of the Loire, against a south wall with fleece on frosty March nights. Self-fertile. Dry limy soil.'),
    prop: [5, 'Greffe sur prunier ou abricotier franc.', 'Grafted on plum or apricot seedling.'],
  },
  {
    id: 'fig', name: T('Figuier', 'Fig'), latin: 'Ficus carica', emoji: '🟤', family: 'moraceae', sun: 'full', frost: 'half', pH: [6, 8],
    spacing: [400, 400], harvest: [600, 680], yieldM2: [1, 2], feeding: 'light', root: 1, height: 350, months: [8, 9],
    note: T('Contre un mur chaud. Variétés « bifères » (Dauphine, Ronde de Bordeaux) : figues-fleurs en juillet et figues d’automne. Rustique vers −12 °C une fois installé. Sève irritante au soleil.', 'Against a warm wall. “Two-crop” varieties (Dauphine, Ronde de Bordeaux): breba figs in July and main crop later. Hardy to about −12 °C once established. Sap irritates skin in sun.'),
    prop: [8, 'Boutures de bois d’un an en mars : très faciles.', 'One-year wood cuttings in March: very easy.'],
  },
  {
    id: 'quince', name: T('Cognassier', 'Quince'), latin: 'Cydonia oblonga', emoji: '🍐', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [400, 400], harvest: [1040, 1070], yieldM2: [1.5, 3], feeding: 'light', root: 0.8, height: 400, months: [10, 10],
    note: T('Petit arbre rustique et autofertile, peu de taille. Coings parfumés pour gelées et pâtes de fruits ; cueillir avant les gelées.', 'Small hardy self-fertile tree, little pruning. Fragrant quinces for jellies and fruit pastes; pick before frost.'),
    prop: [4, 'Marcottage par buttage ou greffe.', 'Mound layering or grafting.'],
  },
  {
    id: 'hazelnut', name: T('Noisetier', 'Hazelnut'), latin: 'Corylus avellana', emoji: '🌰', family: 'betulaceae', sun: 'partial', frost: 'hardy',
    spacing: [400, 300], harvest: [1020, 1050], yieldM2: [0.2, 0.4], feeding: 'light', root: 1, height: 400, months: [9, 9],
    note: T('Haie fruitière facile. Pollinisé par le vent : planter au moins deux variétés. Chatons de février précieux pour les abeilles. Balanin (ver de la noisette) : ramasser les fruits tombés tôt.', 'Easy fruiting hedge. Wind-pollinated: plant at least two varieties. February catkins precious for bees. Nut weevil: collect early-dropped nuts.'),
    prop: [10, 'Drageons ou marcottage d’une branche basse.', 'Suckers or layering a low branch.'],
  },
];

const BUILT = DEFS.map(fruit);
export const ORCHARD: Species[] = BUILT.map((b) => b.species);
export const ORCHARD_EXTRA: Record<string, SpeciesExtra> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.extra]));
export const ORCHARD_HEIGHT: Record<string, number> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.height]));
/** Mois de récolte d'un fruitier adulte. */
export const ORCHARD_MONTHS: Record<string, MonthRange> = Object.fromEntries(DEFS.map((d) => [d.id, d.months]));
