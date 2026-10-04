/**
 * Plantes aromatiques (en plus du basilic, du persil et de la ciboulette,
 * définis avec les légumes) : annuelles à semer, vivaces et arbrisseaux
 * méditerranéens, aromatiques de mi-ombre.
 *
 * Mêmes conventions que les légumes : calendrier « région parisienne »
 * décalé selon le climat ; daysToHarvest = première cueillette et fin de
 * cueillette (jours après le semis ou la plantation). Rendements en kg de
 * feuilles fraîches par m² et par saison, prix de détail moyens arrondis :
 * ordres de grandeur.
 * Sources : catalogues des semenciers et pépiniéristes (Vilmorin,
 * Ducrettet, Graines Baumaux, Le Jardin du Pic Vert), fiches RHS,
 * guides des plantes aromatiques et médicinales (Iteipmai).
 */
import type { Family, Feeding, Frost, MonthRange, Species, SpeciesExtra, Sun, Txt } from '../model';

import { MORE_HERBS, MORE_HERB_EXTRA, MORE_HERB_HEIGHT } from './herbsMore';

const T = (fr: string, en: string): Txt => ({ fr, en });

interface Def {
  id: string;
  name: Txt;
  latin: string;
  emoji: string;
  family: Family;
  life: Species['life'];
  sun: Sun;
  frost: Frost;
  tBase?: number;
  pH?: [number, number];
  spacing: [number, number];
  sowIndoor?: MonthRange[];
  sowOutdoor?: MonthRange[];
  plantOut?: MonthRange[];
  transplantAfter?: number;
  harvest: [number, number];
  season: number;
  yieldM2: [number, number];
  feeding: Feeding;
  root?: number;
  returnYears?: number;
  height: number;
  note: Txt;
  /** Graines : durée, fécondation, isolement, prix (€/kg), fidélité, conseil. */
  seed: [number, SpeciesExtra['pollination'], number, number, NonNullable<SpeciesExtra['trueToSeed']>, string, string];
}

function herb(d: Def): { species: Species; extra: SpeciesExtra; height: number } {
  const seeded = Boolean(d.sowIndoor || d.sowOutdoor);
  const [seedLife, pollination, isolation, priceKg, trueToSeed, fr, en] = d.seed;
  return {
    species: {
      id: d.id,
      name: d.name,
      latin: d.latin,
      emoji: d.emoji,
      family: d.family,
      type: 'herb',
      life: d.life,
      sun: d.sun,
      frost: d.frost,
      tBase: d.tBase ?? (d.frost === 'tender' ? 10 : d.frost === 'half' ? 7 : 4),
      tOpt: [15, 25],
      pH: d.pH ?? [6, 7.5],
      spacing: { row: d.spacing[0], inRow: d.spacing[1] },
      sowIndoor: d.sowIndoor,
      sowOutdoor: d.sowOutdoor,
      plantOut: d.plantOut,
      transplantAfter: d.transplantAfter,
      daysToHarvest: d.harvest,
      season: d.season,
      stages: seeded ? [['germination', 0], ['vegetative', 10], ['harvest', d.harvest[0]]] : [['vegetative', 0], ['harvest', d.harvest[0]]],
      kc: [0.5, 0.9, 0.8],
      rootDepth: d.root ?? 0.3,
      yieldM2: d.yieldM2,
      exports: { N: 4.0, P2O5: 1.5, K2O: 5.0 },
      feeding: d.feeding,
      returnYears: d.returnYears ?? 2,
      note: d.note,
    },
    extra: { seedLife, pollination, isolation, priceKg, trueToSeed, seedTip: { fr, en } },
    height: d.height,
  };
}

const PERENNIAL_PLANT: Pick<Def, 'plantOut'> = { plantOut: [[3, 5], [9, 10]] };

const DEFS: Def[] = [
  // --- Méditerranéennes, sol sec --------------------------------------------------
  {
    id: 'thyme', name: T('Thym', 'Thyme'), latin: 'Thymus vulgaris', emoji: '🌿', family: 'lamiaceae', life: 'perennial', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [30, 25], sowIndoor: [[3, 4]], ...PERENNIAL_PLANT, transplantAfter: 60, harvest: [60, 220], season: 240, yieldM2: [0.3, 0.6], feeding: 'light', returnYears: 3, height: 25,
    note: T('Sol pauvre, sec et caillouteux, plein soleil : l’humidité l’hiver le tue plus que le froid. Tailler après la floraison sans couper le vieux bois. À renouveler tous les 4-5 ans.', 'Poor, dry, stony soil, full sun: winter wet kills it more than cold. Trim after flowering without cutting into old wood. Replace every 4–5 years.'),
    seed: [3, 'insect', 50, 30, 'mostly', 'Se multiplie surtout par boutures de tiges en été ou par division ; les graines minuscules se sèment en surface.', 'Mostly propagated by stem cuttings in summer or division; the tiny seeds are surface-sown.'],
  },
  {
    id: 'rosemary', name: T('Romarin', 'Rosemary'), latin: 'Salvia rosmarinus', emoji: '🌲', family: 'lamiaceae', life: 'perennial', sun: 'full', frost: 'half', pH: [6.5, 8],
    spacing: [80, 60], ...PERENNIAL_PLANT, harvest: [60, 300], season: 330, yieldM2: [0.3, 0.6], feeding: 'light', root: 0.6, returnYears: 3, height: 100,
    note: T('Arbrisseau persistant cueilli toute l’année. Sol très drainé ; rustique vers −10 °C au sec, il craint les hivers humides. Fleurs d’hiver précieuses pour les abeilles.', 'Evergreen shrub picked all year. Very free-draining soil; hardy to about −10 °C if dry, dislikes wet winters. Winter flowers precious to bees.'),
    seed: [1, 'insect', 50, 25, 'no', 'Bouturer des tiges de 10 cm en fin d’été : c’est bien plus rapide que le semis.', 'Take 10 cm cuttings in late summer: much faster than sowing.'],
  },
  {
    id: 'sage', name: T('Sauge officinale', 'Common sage'), latin: 'Salvia officinalis', emoji: '🌿', family: 'lamiaceae', life: 'perennial', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [50, 40], sowIndoor: [[3, 4]], ...PERENNIAL_PLANT, transplantAfter: 60, harvest: [60, 240], season: 260, yieldM2: [0.4, 0.8], feeding: 'light', root: 0.4, returnYears: 3, height: 60,
    note: T('Rabattre de moitié au printemps pour garder une touffe dense. Sol drainé, plutôt calcaire.', 'Cut back by half in spring to keep a dense clump. Well-drained, rather limy soil.'),
    seed: [3, 'insect', 100, 25, 'mostly', 'Les grosses graines se sèment facilement ; les sauges panachées se bouturent.', 'The large seeds sow easily; variegated sages are grown from cuttings.'],
  },
  {
    id: 'oregano', name: T('Origan', 'Oregano'), latin: 'Origanum vulgare', emoji: '🌿', family: 'lamiaceae', life: 'perennial', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [40, 30], sowIndoor: [[3, 4]], ...PERENNIAL_PLANT, transplantAfter: 60, harvest: [60, 200], season: 220, yieldM2: [0.4, 0.8], feeding: 'light', returnYears: 3, height: 40,
    note: T('Le plus parfumé en sol pauvre et au soleil. Fleurs roses très mellifères en été ; cueillir juste avant la floraison pour sécher.', 'Most fragrant in poor soil and sun. Pink flowers loved by bees in summer; pick just before flowering for drying.'),
    seed: [3, 'insect', 50, 30, 'mostly', 'Graines fines semées en surface ; division des touffes au printemps.', 'Fine seeds surface-sown; divide clumps in spring.'],
  },
  {
    id: 'marjoram', name: T('Marjolaine', 'Sweet marjoram'), latin: 'Origanum majorana', emoji: '🌿', family: 'lamiaceae', life: 'annual', sun: 'full', frost: 'tender',
    spacing: [30, 25], sowIndoor: [[3, 4]], plantOut: [[5, 6]], transplantAfter: 45, harvest: [70, 150], season: 170, yieldM2: [0.4, 0.8], feeding: 'light', height: 30,
    note: T('Plus douce que l’origan, gélive : cultivée en annuelle. Cueillir avant la floraison.', 'Milder than oregano, frost-tender: grown as an annual. Pick before flowering.'),
    seed: [3, 'insect', 50, 30, 'mostly', 'Couper les tiges en fleurs sèches, frotter au-dessus d’un papier.', 'Cut dry flowering stems, rub over a sheet of paper.'],
  },
  {
    id: 'savory', name: T('Sarriette', 'Savory'), latin: 'Satureja hortensis, S. montana', emoji: '🌿', family: 'lamiaceae', life: 'annual', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [30, 20], sowOutdoor: [[4, 5]], sowIndoor: [[3, 4]], plantOut: [[5, 5]], transplantAfter: 40, harvest: [60, 150], season: 170, yieldM2: [0.3, 0.6], feeding: 'light', height: 30,
    note: T('L’« herbe aux haricots » : se cuisine avec les légumineuses. La sarriette d’été est annuelle, la sarriette des montagnes vivace.', 'The “bean herb”: cooked with pulses. Summer savory is annual, winter savory perennial.'),
    seed: [3, 'insect', 50, 30, 'yes', 'Se ressème souvent seule ; récolter les tiges sèches.', 'Often self-seeds; collect dry stems.'],
  },
  {
    id: 'hyssop', name: T('Hysope', 'Hyssop'), latin: 'Hyssopus officinalis', emoji: '🪻', family: 'lamiaceae', life: 'perennial', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [40, 30], sowIndoor: [[3, 4]], ...PERENNIAL_PLANT, transplantAfter: 60, harvest: [60, 200], season: 220, yieldM2: [0.3, 0.6], feeding: 'light', returnYears: 3, height: 50,
    note: T('Petit arbrisseau à fleurs bleues très mellifères, feuilles amères et camphrées à petite dose. Bordure de potager.', 'Small shrub with blue flowers loved by bees, bitter camphor-scented leaves in small doses. Vegetable-bed edging.'),
    seed: [3, 'insect', 50, 30, 'mostly', 'Semis au printemps ou boutures d’été.', 'Sow in spring or take summer cuttings.'],
  },
  {
    id: 'bay', name: T('Laurier-sauce', 'Bay laurel'), latin: 'Laurus nobilis', emoji: '🍃', family: 'lauraceae', life: 'perennial', sun: 'full', frost: 'half',
    spacing: [150, 150], plantOut: [[4, 5], [9, 10]], harvest: [90, 330], season: 360, yieldM2: [0.2, 0.4], feeding: 'light', root: 0.8, returnYears: 3, height: 300,
    note: T('Arbuste persistant, en haie ou en grand pot ; rustique vers −10 °C. Feuilles meilleures séchées quelques jours. Attention : le laurier-cerise et le laurier-rose, eux, sont toxiques.', 'Evergreen shrub, as a hedge or in a large pot; hardy to about −10 °C. Leaves best dried a few days. Beware: cherry laurel and oleander are toxic.'),
    seed: [1, 'insect', 0, 20, 'no', 'Pieds mâles et femelles séparés ; on bouture des tiges semi-aoûtées en été (enracinement lent).', 'Separate male and female plants; take semi-ripe cuttings in summer (slow to root).'],
  },

  // --- Fraîches, sol riche --------------------------------------------------------
  {
    id: 'mint', name: T('Menthe', 'Mint'), latin: 'Mentha spicata, M. × piperita', emoji: '🌱', family: 'lamiaceae', life: 'perennial', sun: 'partial', frost: 'hardy',
    spacing: [40, 30], ...PERENNIAL_PLANT, harvest: [40, 200], season: 220, yieldM2: [1, 2], feeding: 'medium', returnYears: 3, height: 50,
    note: T('Très envahissante par ses rhizomes : la planter dans un seau sans fond enterré ou en pot. Sol frais, mi-ombre. Rouille possible : couper ras et brûler.', 'Very invasive through its rhizomes: plant in a bottomless buried bucket or a pot. Moist soil, part shade. Rust possible: cut to the ground and destroy.'),
    seed: [0, 'vegetative', 0, 25, 'no', 'Les menthes s’hybrident et ne se ressèment pas fidèlement : un bout de rhizome ou une tige mise dans l’eau suffit.', 'Mints hybridise and do not come true: a piece of rhizome or a stem in water is enough.'],
  },
  {
    id: 'lemonbalm', name: T('Mélisse', 'Lemon balm'), latin: 'Melissa officinalis', emoji: '🍋', family: 'lamiaceae', life: 'perennial', sun: 'partial', frost: 'hardy',
    spacing: [50, 40], sowIndoor: [[3, 4]], ...PERENNIAL_PLANT, transplantAfter: 60, harvest: [60, 200], season: 220, yieldM2: [1, 2], feeding: 'medium', returnYears: 3, height: 60,
    note: T('Parfum citronné, tisane apaisante. Se ressème beaucoup : couper avant la montée en graines.', 'Lemon scent, soothing tea. Self-seeds a lot: cut before it sets seed.'),
    seed: [3, 'insect', 50, 25, 'yes', 'Se ressème seule ; ou division des touffes.', 'Self-seeds; or divide clumps.'],
  },
  {
    id: 'tarragon', name: T('Estragon', 'French tarragon'), latin: 'Artemisia dracunculus', emoji: '🌿', family: 'asteraceae', life: 'perennial', sun: 'full', frost: 'hardy',
    spacing: [50, 40], ...PERENNIAL_PLANT, harvest: [60, 180], season: 200, yieldM2: [0.4, 0.8], feeding: 'light', returnYears: 3, height: 60,
    note: T('L’estragon français ne fait pas de graines fertiles : acheter un plant. L’« estragon de Russie » vendu en graines est presque sans goût. Pailler l’hiver, sol drainé.', 'French tarragon sets no fertile seed: buy a plant. “Russian tarragon” sold as seed has almost no flavour. Mulch in winter, well-drained soil.'),
    seed: [0, 'vegetative', 0, 40, 'no', 'Diviser la touffe au printemps tous les 3 ans, ou boutures de jeunes pousses.', 'Divide the clump in spring every 3 years, or take young-shoot cuttings.'],
  },
  {
    id: 'lovage', name: T('Livèche', 'Lovage'), latin: 'Levisticum officinale', emoji: '🌿', family: 'apiaceae', life: 'perennial', sun: 'partial', frost: 'hardy',
    spacing: [80, 60], sowIndoor: [[3, 4]], ...PERENNIAL_PLANT, transplantAfter: 60, harvest: [70, 200], season: 220, yieldM2: [1, 2], feeding: 'heavy', root: 0.6, returnYears: 4, height: 150,
    note: T('Le « céleri perpétuel » : quelques feuilles parfument soupes et bouillons. Grande plante, un seul pied suffit. Famille de la carotte et du céleri (rotation).', 'The “perpetual celery”: a few leaves flavour soups and stocks. Large plant, one is enough. Carrot and celery family (rotation).'),
    seed: [2, 'insect', 300, 25, 'yes', 'Graines à semer fraîches en fin d’été ; ou division au printemps.', 'Sow seed fresh in late summer; or divide in spring.'],
  },
  {
    id: 'lemonverbena', name: T('Verveine citronnelle', 'Lemon verbena'), latin: 'Aloysia citrodora', emoji: '🍋', family: 'verbenaceae', life: 'perennial', sun: 'full', frost: 'half',
    spacing: [80, 60], plantOut: [[4, 5]], harvest: [60, 180], season: 200, yieldM2: [0.3, 0.6], feeding: 'medium', root: 0.5, returnYears: 3, height: 120,
    note: T('La « verveine » des tisanes. Perd ses feuilles l’hiver et repart tard (mai) : ne pas l’arracher trop tôt. Pailler épais, ou en pot rentré au nord de la Loire.', 'The “verbena” of herbal teas. Loses its leaves in winter and regrows late (May): do not pull it up too soon. Mulch thickly, or a pot brought in in the north.'),
    seed: [0, 'vegetative', 0, 40, 'no', 'Boutures de tiges tendres au printemps ou en été, sous abri.', 'Softwood cuttings in spring or summer, under cover.'],
  },

  // --- Annuelles à semer ----------------------------------------------------------
  {
    id: 'coriander', name: T('Coriandre', 'Coriander'), latin: 'Coriandrum sativum', emoji: '🌿', family: 'apiaceae', life: 'annual', sun: 'partial', frost: 'half',
    spacing: [25, 10], sowOutdoor: [[3, 5], [8, 9]], harvest: [35, 70], season: 90, yieldM2: [0.5, 1], feeding: 'light', root: 0.3, returnYears: 3, height: 50,
    note: T('Monte vite en graines par temps chaud et jours longs : semer tous les 15 jours au printemps et à la fin de l’été, à mi-ombre. Ne se repique pas. Les graines sèches sont l’épice.', 'Bolts quickly in heat and long days: sow every 2 weeks in spring and late summer, in part shade. Does not transplant. The dry seeds are the spice.'),
    seed: [4, 'insect', 300, 25, 'yes', 'Laisser monter quelques pieds : les graines rondes se récoltent beiges et sèches (c’est aussi l’épice).', 'Let a few plants bolt: the round seeds are harvested beige and dry (they are also the spice).'],
  },
  {
    id: 'dill', name: T('Aneth', 'Dill'), latin: 'Anethum graveolens', emoji: '🌿', family: 'apiaceae', life: 'annual', sun: 'full', frost: 'half',
    spacing: [30, 15], sowOutdoor: [[4, 7]], harvest: [40, 90], season: 110, yieldM2: [0.5, 1], feeding: 'light', root: 0.4, returnYears: 3, height: 80,
    note: T('Semer en place (racine pivotante), en plusieurs fois. Ses ombelles jaunes attirent les syrphes et les guêpes parasites. À éloigner du fenouil (ils se croisent).', 'Sow in place (taproot), in batches. Its yellow umbels draw hoverflies and parasitic wasps. Keep away from fennel (they cross).'),
    seed: [3, 'insect', 300, 25, 'yes', 'Couper les ombelles quand les graines brunissent ; se ressème volontiers.', 'Cut umbels when seeds turn brown; self-seeds readily.'],
  },
  {
    id: 'chervil', name: T('Cerfeuil', 'Chervil'), latin: 'Anthriscus cerefolium', emoji: '🌿', family: 'apiaceae', life: 'annual', sun: 'shade', frost: 'hardy',
    spacing: [25, 10], sowOutdoor: [[3, 5], [8, 9]], harvest: [40, 80], season: 100, yieldM2: [0.5, 1], feeding: 'light', root: 0.25, returnYears: 3, height: 40,
    note: T('Aime la fraîcheur et l’ombre ; monte en graines en été. Semis de fin d’été pour une récolte d’automne et d’hiver.', 'Likes cool shade; bolts in summer. Late-summer sowing for autumn and winter picking.'),
    seed: [1, 'insect', 300, 25, 'yes', 'Graines à semer fraîches (vite périmées) ; il se ressème à l’ombre.', 'Sow seed fresh (short-lived); it self-seeds in shade.'],
  },
  {
    id: 'chamomile', name: T('Camomille matricaire', 'German chamomile'), latin: 'Matricaria chamomilla', emoji: '🌼', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'hardy',
    spacing: [25, 20], sowOutdoor: [[3, 5], [9, 9]], harvest: [60, 120], season: 140, yieldM2: [0.1, 0.3], feeding: 'light', root: 0.2, height: 40,
    note: T('Semer en surface (la graine a besoin de lumière). Cueillir les capitules bien ouverts et les sécher à l’ombre pour la tisane.', 'Surface-sow (seed needs light). Pick fully open flower heads and dry them in shade for tea.'),
    seed: [3, 'insect', 50, 60, 'yes', 'Se ressème seule abondamment.', 'Self-seeds freely.'],
  },
  {
    id: 'shiso', name: T('Shiso', 'Shiso'), latin: 'Perilla frutescens', emoji: '🍁', family: 'lamiaceae', life: 'annual', sun: 'partial', frost: 'tender', tBase: 12,
    spacing: [40, 30], sowIndoor: [[4, 4]], plantOut: [[5, 6]], transplantAfter: 40, harvest: [60, 150], season: 170, yieldM2: [0.5, 1], feeding: 'medium', height: 70,
    note: T('Aromatique japonaise vert ou pourpre, goût entre menthe et cumin. Graines à faire tremper, germination lente. Se ressème.', 'Japanese herb, green or purple, tasting between mint and cumin. Soak seeds, slow germination. Self-seeds.'),
    seed: [1, 'insect', 100, 40, 'mostly', 'Graines vite périmées : récolter chaque automne et ressemer.', 'Seed loses viability fast: collect every autumn and resow.'],
  },
  {
    id: 'lemongrass', name: T('Citronnelle', 'Lemongrass'), latin: 'Cymbopogon citratus', emoji: '🌾', family: 'poaceae', life: 'perennial', sun: 'full', frost: 'tender', tBase: 12,
    spacing: [60, 50], plantOut: [[5, 6]], harvest: [90, 150], season: 170, yieldM2: [0.5, 1], feeding: 'heavy', root: 0.4, height: 100,
    note: T('Graminée tropicale : un pied de supermarché mis dans l’eau fait des racines. Dehors l’été, rentrée hors gel l’hiver. Récolter la base renflée des tiges.', 'Tropical grass: a supermarket stalk put in water grows roots. Outside in summer, brought in frost-free in winter. Harvest the swollen stem bases.'),
    seed: [0, 'vegetative', 0, 15, 'no', 'Diviser la touffe au printemps.', 'Divide the clump in spring.'],
  },
  {
    id: 'wildgarlic', name: T('Ail des ours', 'Wild garlic'), latin: 'Allium ursinum', emoji: '🌿', family: 'amaryllidaceae', life: 'perennial', sun: 'shade', frost: 'hardy',
    spacing: [20, 15], plantOut: [[9, 10]], harvest: [150, 210], season: 240, yieldM2: [0.5, 1], feeding: 'light', root: 0.2, returnYears: 3, height: 30,
    note: T('Sous-bois frais et ombragé ; feuilles cueillies de mars à mai. CONFUSIONS MORTELLES avec le muguet et le colchique : seules les feuilles d’ail des ours sentent l’ail quand on les froisse. Ne pas le planter près d’eux.', 'Cool shady woodland; leaves picked March to May. DEADLY CONFUSION with lily of the valley and autumn crocus: only wild garlic leaves smell of garlic when crushed. Do not plant it near them.'),
    seed: [1, 'insect', 0, 30, 'yes', 'Graines à semer fraîches en été (germination l’hiver suivant) ; ou bulbes divisés.', 'Sow seed fresh in summer (germinates the next winter); or divide bulbs.'],
  },
  {
    id: 'stevia', name: T('Stévia', 'Stevia'), latin: 'Stevia rebaudiana', emoji: '🍬', family: 'asteraceae', life: 'perennial', sun: 'full', frost: 'tender', tBase: 12,
    spacing: [40, 30], plantOut: [[5, 6]], harvest: [60, 150], season: 170, yieldM2: [0.2, 0.4], feeding: 'medium', height: 60,
    note: T('Feuilles très sucrées, à sécher. Gélive : en pot, rentrée l’hiver, ou cultivée en annuelle.', 'Very sweet leaves, to dry. Frost-tender: in a pot brought in for winter, or grown as an annual.'),
    seed: [1, 'insect', 50, 60, 'no', 'Semis capricieux et peu sucré : bouturer les meilleurs pieds.', 'Seed is erratic and less sweet: take cuttings of the best plants.'],
  },
];

const BUILT = DEFS.map(herb);
export const HERBS: Species[] = [...BUILT.map((b) => b.species), ...MORE_HERBS];
export const HERB_EXTRA: Record<string, SpeciesExtra> = { ...Object.fromEntries(BUILT.map((b) => [b.species.id, b.extra])), ...MORE_HERB_EXTRA };
export const HERB_HEIGHT: Record<string, number> = { ...Object.fromEntries(BUILT.map((b) => [b.species.id, b.height])), ...MORE_HERB_HEIGHT };
