/**
 * Fleurs du catalogue, troisième série : grimpantes parfumées, annuelles et
 * vivaces de balcon gélives, vivaces d’ombre.
 *
 * Mêmes conventions que flowers.ts (calendrier « région parisienne »,
 * floraison = [début, fin] en jours après le semis ou la plantation).
 * Sources : catalogues des semenciers et pépiniéristes (Vilmorin, Graines
 * Baumaux, Promesse de fleurs, pépinières Travers pour les clématites),
 * fiches RHS et SNHF, ANSES et Centres antipoison pour la toxicité. Ordres de
 * grandeur.
 */
import type { SpeciesExtra, Txt } from '../model';
import type { FlowerDef } from './flowers';

const T = (fr: string, en: string): Txt => ({ fr, en });

type In = Omit<FlowerDef, 'tBase' | 'pH' | 'root'> & Partial<Pick<FlowerDef, 'tBase' | 'pH' | 'root'>>;
const m = (d: In): FlowerDef => ({ tBase: d.frost === 'tender' ? 9 : d.frost === 'half' ? 6 : 4, pH: [6, 7.5], root: 0.3, ...d });

// Calendriers types
const ANNUAL_INDOOR = { sowIndoor: [[3, 4]] as FlowerDef['sowIndoor'], plantOut: [[5, 6]] as FlowerDef['plantOut'], transplantAfter: 45 };
const PERENNIAL = { plantOut: [[3, 4], [9, 10]] as FlowerDef['plantOut'], season: 200 };
const CLIMBER = { plantOut: [[3, 4], [9, 10]] as FlowerDef['plantOut'], season: 220, returnYears: 5 };

export const EXTRA_FLOWER_DEFS: FlowerDef[] = [
  // --- Grimpantes -----------------------------------------------------------------------
  m({
    id: 'clematis', name: T('Clématite', 'Clematis'), latin: 'Clematis (hybrides, C. viticella, C. montana)', emoji: '🟣', family: 'ranunculaceae', life: 'perennial', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [100, 80], ...CLIMBER, bloomDays: [50, 180], feeding: 'medium', root: 0.6,
    note: T('« La tête au soleil, le pied à l’ombre » : planter 5 à 10 cm plus profond que la motte et pailler ou ombrer la base. La taille dépend du groupe : les montana se taillent après floraison, les viticella se rabattent à 30 cm en février.', '“Head in the sun, feet in the shade”: plant 5–10 cm deeper than the root ball and mulch or shade the base. Pruning depends on the group: montana is pruned after flowering, viticella is cut back to 30 cm in February.'),
    info: {
      bloom: [[4, 9]], height: [200, 600], colors: ['purple', 'blue', 'pink', 'white', 'red'], uses: ['pollinators', 'pots'],
      toxic: T('Toute la plante est toxique ; la sève irrite la peau.', 'The whole plant is toxic; the sap irritates the skin.'),
    },
  }),
  m({
    id: 'honeysuckle', name: T('Chèvrefeuille', 'Honeysuckle'), latin: 'Lonicera periclymenum', emoji: '🌼', family: 'caprifoliaceae', life: 'perennial', sun: 'partial', frost: 'hardy',
    spacing: [150, 100], ...CLIMBER, bloomDays: [70, 170], feeding: 'light', root: 0.5,
    note: T('Grimpante volubile au parfum puissant le soir, visitée par les sphinx. Pied au frais, tête au soleil ou à mi-ombre. Tailler légèrement après la floraison ; surveiller les pucerons au printemps.', 'Twining climber with a powerful evening scent, visited by hawk-moths. Roots cool, head in sun or part shade. Trim lightly after flowering; watch for aphids in spring.'),
    info: {
      bloom: [[6, 9]], height: [300, 600], colors: ['yellow', 'white', 'pink'], uses: ['fragrant', 'pollinators'],
      toxic: T('Baies rouges toxiques.', 'Toxic red berries.'),
    },
  }),
  m({
    id: 'jasmine', name: T('Jasmin officinal', 'Common jasmine'), latin: 'Jasminum officinale', emoji: '🤍', family: 'oleaceae', life: 'perennial', sun: 'full', frost: 'half',
    spacing: [150, 100], plantOut: [[4, 5]], bloomDays: [50, 140], season: 200, returnYears: 5, feeding: 'light', root: 0.5,
    note: T('Petites fleurs blanches très parfumées tout l’été. Rustique vers −10 °C contre un mur abrité au sud ; pailler le pied l’hiver. Palisser les tiges et éclaircir après la floraison.', 'Small, very fragrant white flowers all summer. Hardy to about −10 °C against a sheltered south-facing wall; mulch the base in winter. Tie in the stems and thin out after flowering.'),
    info: { bloom: [[6, 9]], height: [200, 500], colors: ['white'], uses: ['fragrant', 'pollinators', 'pots'] },
  }),
  m({
    id: 'wisteria', name: T('Glycine', 'Wisteria'), latin: 'Wisteria sinensis, W. floribunda', emoji: '🪻', family: 'fabaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    spacing: [400, 300], plantOut: [[10, 11], [3, 3]], bloomDays: [170, 220], season: 260, returnYears: 5, feeding: 'light', root: 1,
    note: T('Liane vigoureuse qui arrache gouttières et grillages : prévoir un support très solide. Acheter un pied greffé (les semis mettent 10 ans et plus à fleurir). Deux tailles : tiges de l’année à 5-6 feuilles en août, puis à 2-3 bourgeons en février.', 'Vigorous climber that tears off gutters and trellis: plan a very strong support. Buy a grafted plant (seedlings take 10 years or more to flower). Two prunings: new shoots to 5–6 leaves in August, then to 2–3 buds in February.'),
    info: {
      bloom: [[4, 5]], height: [500, 1000], colors: ['purple', 'blue', 'white', 'pink'], uses: ['fragrant', 'pollinators'],
      toxic: T('GRAINES ET GOUSSES TRÈS TOXIQUES, surtout pour les enfants qui les prennent pour des haricots ; écorce et racines aussi.', 'SEEDS AND PODS ARE HIGHLY TOXIC, especially to children who mistake them for beans; bark and roots too.'),
    },
  }),

  // --- Annuelles et gélives de balcon ---------------------------------------------------
  m({
    id: 'heliotrope', name: T('Héliotrope', 'Heliotrope'), latin: 'Heliotropium arborescens', emoji: '💜', family: 'boraginaceae', life: 'annual', sun: 'full', frost: 'tender', tBase: 10,
    spacing: [35, 30], sowIndoor: [[2, 3]], plantOut: [[5, 6]], transplantAfter: 70, bloomDays: [100, 210], season: 220, feeding: 'medium',
    note: T('Bouquets violets au parfum de vanille et de cerise, idéal près d’une terrasse. Craint le froid : ne sortir qu’après les Saints de Glace. Pincer les jeunes plants pour les ramifier.', 'Purple clusters with a vanilla-and-cherry scent, ideal near a terrace. Dislikes cold: plant out only after mid-May. Pinch young plants to make them bushy.'),
    info: {
      bloom: [[6, 10]], height: [30, 60], colors: ['purple', 'blue', 'white'], uses: ['fragrant', 'pollinators', 'pots'], deadhead: true,
      toxic: T('Toute la plante est toxique (alcaloïdes).', 'The whole plant is toxic (alkaloids).'),
    },
  }),
  m({
    id: 'osteospermum', name: T('Ostéospermum', 'African daisy'), latin: 'Osteospermum ecklonis', emoji: '🌼', family: 'asteraceae', life: 'perennial', sun: 'full', frost: 'half',
    spacing: [35, 30], plantOut: [[4, 5]], bloomDays: [20, 180], season: 200, feeding: 'light',
    note: T('Grandes marguerites qui s’ouvrent au soleil, du printemps aux gelées avec un creux au cœur de l’été. Sol drainé, arrosage modéré. Rustique vers −5 °C au sec ; sinon le traiter en annuelle ou le rentrer.', 'Large daisies that open in sunshine, from spring to frost with a dip in midsummer. Free-draining soil, moderate watering. Hardy to about −5 °C if dry; otherwise treat as an annual or bring it in.'),
    info: { bloom: [[5, 10]], height: [20, 50], colors: ['white', 'purple', 'pink', 'yellow', 'orange'], uses: ['pollinators', 'pots'], deadhead: true },
  }),
  m({
    id: 'bidens', name: T('Bidens', 'Bidens'), latin: 'Bidens ferulifolia', emoji: '🌟', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'tender',
    spacing: [30, 30], plantOut: [[5, 5]], bloomDays: [20, 160], season: 180, feeding: 'medium',
    note: T('Petites étoiles jaunes sans interruption jusqu’aux gelées, port retombant pour suspensions et jardinières. Arroser régulièrement et nourrir tous les 15 jours en pot. Supporte bien la chaleur.', 'Small yellow stars nonstop until frost, trailing habit for baskets and window boxes. Water regularly and feed every 2 weeks in pots. Copes well with heat.'),
    info: { bloom: [[5, 10]], height: [20, 40], colors: ['yellow', 'white', 'orange'], uses: ['pollinators', 'pots'] },
  }),
  m({
    id: 'salpiglossis', name: T('Salpiglossis', 'Painted tongue'), latin: 'Salpiglossis sinuata', emoji: '🏮', family: 'solanaceae', life: 'annual', sun: 'full', frost: 'tender',
    spacing: [30, 25], ...ANNUAL_INDOOR, bloomDays: [100, 180], season: 200, feeding: 'medium',
    note: T('Trompettes veloutées veinées d’or, superbes en bouquet. Tiges collantes à tuteurer ; craint le vent et l’excès d’eau. Même famille que la tomate : elle compte dans sa rotation.', 'Velvety trumpets veined with gold, superb when cut. Sticky stems to stake; dislikes wind and overwatering. Same family as tomato: it counts in its rotation.'),
    info: { bloom: [[7, 9]], height: [40, 70], colors: ['purple', 'red', 'yellow', 'orange', 'pink'], uses: ['cut', 'pots'], deadhead: true },
  }),
  m({
    id: 'schizanthus', name: T('Schizanthus', 'Poor man’s orchid'), latin: 'Schizanthus × wisetonensis', emoji: '🦋', family: 'solanaceae', life: 'annual', sun: 'partial', frost: 'half',
    spacing: [30, 25], ...ANNUAL_INDOOR, bloomDays: [90, 160], season: 180, feeding: 'medium',
    note: T('Fleurs découpées comme de petites orchidées, en pot ou en bordure. Préfère la fraîcheur : il s’épuise par forte chaleur, mi-ombre l’après-midi. Pincer les jeunes plants.', 'Cut-edged flowers like little orchids, in pots or edging. Prefers cool weather: it flags in strong heat, afternoon shade helps. Pinch young plants.'),
    info: { bloom: [[6, 8]], height: [30, 50], colors: ['pink', 'purple', 'white', 'red'], uses: ['pots', 'cut'] },
  }),
  m({
    id: 'cuphea', name: T('Cuphéa', 'Cigar plant'), latin: 'Cuphea ignea, C. hyssopifolia', emoji: '🚬', family: 'lythraceae', life: 'annual', sun: 'full', frost: 'tender', tBase: 10,
    spacing: [30, 25], sowIndoor: [[2, 3]], plantOut: [[5, 6]], transplantAfter: 60, bloomDays: [100, 210], season: 220, feeding: 'light',
    note: T('Petites fleurs tubulaires en continu jusqu’aux gelées, appréciées des bourdons. Plein soleil et chaleur, arrosage modéré. Vivace sous abri : se bouture facilement en fin d’été pour l’hiverner.', 'Small tubular flowers nonstop until frost, popular with bumblebees. Full sun and heat, moderate watering. Perennial under cover: cuttings root easily in late summer to overwinter.'),
    info: { bloom: [[6, 10]], height: [30, 60], colors: ['red', 'orange', 'purple', 'pink', 'white'], uses: ['pollinators', 'pots'] },
  }),
  m({
    id: 'lantana', name: T('Lantanier', 'Lantana'), latin: 'Lantana camara', emoji: '🌈', family: 'verbenaceae', life: 'perennial', sun: 'full', frost: 'tender', tBase: 10,
    spacing: [50, 40], plantOut: [[5, 5]], bloomDays: [30, 160], season: 180, feeding: 'light', root: 0.4,
    note: T('Bouquets qui changent de couleur en vieillissant, adorés des papillons. En pot, rentré hors gel (5-10 °C) l’hiver et rabattu au printemps. Plante envahissante sous les tropiques : ne pas la planter là où elle peut s’échapper.', 'Flower clusters that change colour as they age, loved by butterflies. In a pot, brought in frost-free (5–10 °C) for winter and cut back in spring. Invasive in the tropics: do not plant it where it can escape.'),
    info: {
      bloom: [[6, 10]], height: [50, 120], colors: ['yellow', 'orange', 'red', 'pink', 'white', 'purple'], uses: ['pollinators', 'pots'], lift: true,
      toxic: T('Baies vertes et feuilles toxiques, pour les enfants comme pour les animaux.', 'Green berries and leaves are toxic, to children and animals alike.'),
    },
  }),
  m({
    id: 'verbenabonariensis', name: T('Verveine de Buenos Aires', 'Purpletop vervain'), latin: 'Verbena bonariensis', emoji: '🪻', family: 'verbenaceae', life: 'perennial', sun: 'full', frost: 'half',
    spacing: [50, 40], sowIndoor: [[2, 3]], plantOut: [[5, 5]], transplantAfter: 60, bloomDays: [90, 200], season: 220, feeding: 'light', root: 0.4,
    note: T('Hautes tiges fines aux petits bouquets violets, transparentes : elles se placent devant. Aimant à papillons de juillet aux gelées. Vivace de courte durée qui se ressème dans les sols drainés ; laisser les tiges l’hiver.', 'Tall, wiry stems with small purple clusters, see-through: they can go at the front. A butterfly magnet from July to frost. Short-lived perennial that self-seeds in free-draining soil; leave the stems over winter.'),
    info: { bloom: [[7, 10]], height: [100, 180], colors: ['purple'], uses: ['pollinators', 'cut', 'selfSeeds'] },
  }),

  // --- Vivaces d’ombre et de mi-ombre ---------------------------------------------------
  m({
    id: 'sweetwoodruff', name: T('Aspérule odorante', 'Sweet woodruff'), latin: 'Galium odoratum', emoji: '🤍', family: 'rubiaceae', life: 'perennial', sun: 'shade', frost: 'hardy', pH: [5.5, 7.5],
    spacing: [25, 20], ...PERENNIAL, bloomDays: [30, 70], feeding: 'light', root: 0.15,
    note: T('Couvre-sol d’ombre à petites étoiles blanches en avril-mai, pour sous-bois frais et humifère. Les tiges séchées sentent le foin coupé et parfument le « vin de mai ». S’étend vite par stolons.', 'Shade ground cover with small white stars in April–May, for cool, humus-rich woodland. Dried stems smell of fresh hay and flavour German “May wine”. Spreads quickly by runners.'),
    info: {
      bloom: [[4, 5]], height: [15, 25], colors: ['white'], uses: ['fragrant', 'edible', 'pollinators'],
      toxic: T('Riche en coumarine : à consommer avec modération (maux de tête, toxique pour le foie à forte dose).', 'Rich in coumarin: use sparingly (headaches, harmful to the liver in large doses).'),
    },
  }),
  m({
    id: 'hosta', name: T('Hosta', 'Hosta'), latin: 'Hosta', emoji: '🍃', family: 'asparagaceae', life: 'perennial', sun: 'shade', frost: 'hardy',
    spacing: [60, 50], ...PERENNIAL, bloomDays: [100, 150], feeding: 'medium', root: 0.4, returnYears: 5,
    note: T('Cultivé pour son feuillage à l’ombre, en sol frais et riche ; hampes de clochettes en été. Ennemi n° 1 : les limaces, dès la sortie des pousses en avril (cendre, pièges, ou variétés à feuilles épaisses). Les jeunes pousses se mangent au Japon.', 'Grown for its foliage in shade, in moist, rich soil; spikes of bells in summer. Enemy no. 1: slugs, as soon as shoots appear in April (ash, traps, or thick-leaved varieties). Young shoots are eaten in Japan.'),
    info: {
      bloom: [[7, 8]], height: [30, 90], colors: ['purple', 'white'], uses: ['pots', 'cut', 'pollinators', 'edible'],
      toxic: T('Toxique pour les chiens et les chats (saponines).', 'Toxic to dogs and cats (saponins).'),
    },
  }),
  m({
    id: 'astrantia', name: T('Astrance', 'Masterwort'), latin: 'Astrantia major', emoji: '✳️', family: 'apiaceae', life: 'perennial', sun: 'partial', frost: 'hardy',
    spacing: [45, 40], ...PERENNIAL, bloomDays: [60, 150], feeding: 'medium', root: 0.4,
    note: T('Petites ombelles en pelote entourées d’une collerette papier, très durables en vase et au séchage. Mi-ombre et sol frais qui ne sèche pas l’été. Rabattre après la première floraison pour une remontée.', 'Small pincushion umbels ringed by a papery collar, very long-lasting in a vase and when dried. Part shade and soil that stays moist in summer. Cut back after the first flush for a repeat.'),
    info: { bloom: [[6, 8]], height: [50, 80], colors: ['pink', 'white', 'red'], uses: ['cut', 'dried', 'pollinators', 'selfSeeds'], deadhead: true },
  }),
];

const x = (seedLife: number, pollination: SpeciesExtra['pollination'], isolation: number, trueToSeed: SpeciesExtra['trueToSeed'], fr: string, en: string, f1Common = false): SpeciesExtra => ({
  seedLife,
  pollination,
  isolation,
  priceKg: 0,
  trueToSeed,
  f1Common: f1Common || undefined,
  seedTip: { fr, en },
});
const veg = (fr: string, en: string) => x(0, 'vegetative', 0, 'no', fr, en);

/** Garder ses graines (ou multiplier) : fidélité, isolement, récolte. */
export const EXTRA_FLOWER_EXTRA: Record<string, SpeciesExtra> = {
  clematis: veg('Marcotter une tige au printemps, ou boutures d’entre-nœuds en début d’été ; les semis ne redonnent pas les hybrides.', 'Layer a stem in spring, or take internodal cuttings in early summer; seedlings do not reproduce hybrids.'),
  honeysuckle: veg('Une tige couchée en terre s’enracine en quelques mois (marcottage) ; ou boutures en été.', 'A stem pegged into the soil roots within months (layering); or summer cuttings.'),
  jasmine: veg('Marcottage ou boutures semi-aoûtées en été, sous châssis.', 'Layering or semi-ripe cuttings in summer, under a cold frame.'),
  wisteria: veg('Les semis mettent 10 à 20 ans à fleurir : marcotter une tige ou acheter un pied greffé. Graines très toxiques.', 'Seedlings take 10–20 years to flower: layer a stem or buy a grafted plant. Seeds are highly toxic.'),
  heliotrope: x(2, 'insect', 50, 'mostly', 'Les graines donnent des plantes variables en parfum ; bouturer en fin d’été les pieds les plus parfumés.', 'Seed gives plants of varying scent; take late-summer cuttings from the most fragrant ones.'),
  osteospermum: x(2, 'insect', 50, 'no', 'Variétés surtout bouturées ou hybrides : boutures de tiges non fleuries en fin d’été.', 'Varieties are mostly cutting-grown or hybrids: take non-flowering shoot cuttings in late summer.', true),
  bidens: veg('Variétés souvent stériles : boutures de tiges, à hiverner sous abri.', 'Varieties are often sterile: take stem cuttings and overwinter them under cover.'),
  salpiglossis: x(3, 'insect', 100, 'mostly', 'Capsules sèches pleines de graines fines ; plusieurs séries sont des F1.', 'Dry capsules full of fine seed; several series are F1s.', true),
  schizanthus: x(3, 'insect', 50, 'mostly', 'Récolter les petites capsules sèches en fin d’été.', 'Collect the small dry capsules in late summer.'),
  cuphea: x(2, 'insect', 50, 'mostly', 'Graines rares sous nos climats : bouturer en fin d’été.', 'Seed is scarce in our climate: take cuttings in late summer.'),
  lantana: veg('Boutures en fin d’été, hivernées hors gel ; les baies sont toxiques et les variétés hybrides.', 'Late-summer cuttings, overwintered frost-free; berries are toxic and varieties are hybrids.'),
  verbenabonariensis: x(3, 'insect', 50, 'yes', 'Se ressème seule ; ou secouer les têtes sèches en automne. Un passage au froid aide la germination.', 'Self-seeds; or shake out dry heads in autumn. A spell of cold helps germination.'),
  sweetwoodruff: veg('Diviser les touffes au printemps ou en automne ; les graines à crochets ont besoin de l’hiver pour germer.', 'Divide clumps in spring or autumn; the hooked seeds need winter cold to germinate.'),
  hosta: veg('Diviser les touffes au printemps quand les pousses pointent ; les semis ne reproduisent pas les feuillages panachés.', 'Divide clumps in spring as the shoots emerge; seedlings do not reproduce variegated foliage.'),
  astrantia: x(1, 'insect', 50, 'mostly', 'Graines à semer fraîches dehors (besoin de froid) ; les cultivars se divisent au printemps.', 'Sow seed fresh outdoors (needs cold); cultivars are divided in spring.'),
};
