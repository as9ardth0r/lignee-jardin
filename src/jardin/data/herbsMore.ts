/**
 * Aromatiques supplémentaires : alliacées vivaces, ombellifères à graines
 * (épices), aromatiques de pot gélives et quelques curiosités (safran,
 * houblon, gingembre).
 *
 * Mêmes conventions que herbs.ts : calendrier « région parisienne » décalé
 * selon le climat ; daysToHarvest = première cueillette et fin de cueillette
 * (jours après le semis ou la plantation). Rendements en kg de récolte
 * fraîche par m² et par saison (stigmates pour le safran, graines pour les
 * épices, rhizomes pour le gingembre), prix de détail moyens arrondis :
 * ordres de grandeur.
 * Sources : catalogues des semenciers et pépiniéristes (Vilmorin, Ducrettet,
 * Graines Baumaux, Kokopelli), fiches RHS, Iteipmai, guides de culture du
 * safran et du houblon amateur.
 */
import type { Family, Feeding, Frost, MonthRange, Species, SpeciesExtra, Sun, Txt } from '../model';

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
  // --- Alliacées vivaces ------------------------------------------------------------
  {
    id: 'garlicchives', name: T('Ciboulette chinoise (ail de Chine)', 'Garlic chives'), latin: 'Allium tuberosum', emoji: '🧄', family: 'amaryllidaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    spacing: [30, 20], sowIndoor: [[3, 4]], sowOutdoor: [[4, 5]], ...PERENNIAL_PLANT, transplantAfter: 50, harvest: [70, 200], season: 220, yieldM2: [1, 2], feeding: 'medium', root: 0.3, returnYears: 3, height: 40,
    note: T('Feuilles plates au goût d’ail doux, coupées à 3 cm du sol plusieurs fois par saison. Ombelles blanches en août-septembre, très visitées par les abeilles. Couper les fleurs fanées : elle se ressème beaucoup.', 'Flat leaves with a mild garlic taste, cut 3 cm above ground several times a season. White umbels in August–September, much visited by bees. Deadhead: it self-seeds a lot.'),
    seed: [1, 'insect', 100, 30, 'yes', 'Graines noires à récolter sèches en automne et à ressemer vite (1 à 2 ans) ; ou diviser les touffes au printemps.', 'Black seeds collected dry in autumn and sown soon (1–2 years); or divide clumps in spring.'],
  },
  {
    id: 'welshonion', name: T('Ciboule', 'Welsh onion'), latin: 'Allium fistulosum', emoji: '🌱', family: 'amaryllidaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    spacing: [30, 15], sowIndoor: [[2, 3]], sowOutdoor: [[3, 4], [8, 9]], plantOut: [[4, 5], [9, 10]], transplantAfter: 45, harvest: [60, 300], season: 320, yieldM2: [1, 2.5], feeding: 'medium', root: 0.3, returnYears: 3, height: 50,
    note: T('Tiges creuses entre l’oignon et la ciboulette, récoltées toute l’année même en hiver. Diviser la touffe tous les 2-3 ans pour la rajeunir. Famille de l’ail et de l’oignon : à compter dans la rotation.', 'Hollow stems between onion and chives, picked all year round, even in winter. Divide the clump every 2–3 years to rejuvenate it. Garlic and onion family: count it in the rotation.'),
    seed: [1, 'insect', 300, 20, 'mostly', 'Ne se croise pas avec l’oignon mais avec les autres ciboules ; graines vite périmées, à ressemer l’année suivante.', 'Does not cross with onion but with other Welsh onions; short-lived seed, resow the following year.'],
  },

  // --- Vivaces de potager -------------------------------------------------------------
  {
    id: 'saladburnet', name: T('Pimprenelle', 'Salad burnet'), latin: 'Sanguisorba minor', emoji: '🌿', family: 'rosaceae', life: 'perennial', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [30, 25], sowOutdoor: [[3, 5], [8, 9]], ...PERENNIAL_PLANT, harvest: [50, 240], season: 260, yieldM2: [0.5, 1], feeding: 'light', root: 0.4, returnYears: 3, height: 40,
    note: T('Petites feuilles dentelées au goût de concombre, pour salades et sauces. Persistante, elle se cueille presque toute l’année. Couper les tiges florales pour garder des feuilles tendres.', 'Small toothed leaves tasting of cucumber, for salads and sauces. Evergreen, picked almost all year. Cut flower stems to keep the leaves tender.'),
    seed: [3, 'wind', 100, 30, 'yes', 'Fleurs pollinisées par le vent ; se ressème volontiers. Récolter les têtes brunes et sèches.', 'Wind-pollinated flowers; self-seeds readily. Collect the brown, dry heads.'],
  },
  {
    id: 'sweetcicely', name: T('Cerfeuil musqué', 'Sweet cicely'), latin: 'Myrrhis odorata', emoji: '🌿', family: 'apiaceae', life: 'perennial', sun: 'partial', frost: 'hardy',
    spacing: [60, 50], ...PERENNIAL_PLANT, harvest: [60, 200], season: 220, yieldM2: [0.5, 1], feeding: 'medium', root: 0.8, returnYears: 3, height: 100,
    note: T('Feuillage de fougère au goût d’anis, qui sucre naturellement les compotes de rhubarbe. Mi-ombre et sol frais ; racine pivotante, ne se déplace plus une fois installé. Attention aux confusions avec les ombellifères sauvages toxiques.', 'Fern-like, aniseed-flavoured foliage that naturally sweetens rhubarb stews. Part shade and moist soil; taprooted, do not move once settled. Beware of confusion with toxic wild umbellifers.'),
    seed: [1, 'insect', 300, 40, 'yes', 'Grosses graines à semer fraîches dehors à l’automne : elles ont besoin de l’hiver pour germer.', 'Large seeds to sow fresh outdoors in autumn: they need winter cold to germinate.'],
  },
  {
    id: 'hops', name: T('Houblon', 'Hops'), latin: 'Humulus lupulus', emoji: '🍺', family: 'cannabaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    spacing: [150, 100], plantOut: [[3, 4], [10, 11]], harvest: [40, 180], season: 200, yieldM2: [0.2, 0.5], feeding: 'heavy', root: 1, returnYears: 5, height: 600,
    note: T('Liane vivace qui monte à 6 m sur un fil ou une pergola, puis disparaît l’hiver. Les jeunes pousses d’avril se mangent comme des asperges ; les cônes des pieds femelles se cueillent fin août-septembre, pour la bière ou la tisane. Sève et poils irritants : gants pour la récolte.', 'Perennial climber reaching 6 m on a wire or pergola, dying back in winter. Young April shoots are eaten like asparagus; cones of female plants are picked late August–September, for beer or tea. Irritant sap and bristles: wear gloves to harvest.'),
    seed: [0, 'vegetative', 0, 40, 'no', 'Plante dioïque : seuls les pieds femelles font des cônes. Multiplier par éclats de souche ou boutures de rhizome au printemps.', 'Dioecious: only female plants bear cones. Propagate from crown divisions or rhizome cuttings in spring.'],
  },

  // --- Ombellifères et légumineuse à graines (épices) ----------------------------------
  {
    id: 'fenugreek', name: T('Fenugrec', 'Fenugreek'), latin: 'Trigonella foenum-graecum', emoji: '🌱', family: 'fabaceae', life: 'annual', sun: 'full', frost: 'half',
    spacing: [25, 5], sowOutdoor: [[4, 7]], harvest: [30, 120], season: 130, yieldM2: [0.5, 1], feeding: 'improver', root: 0.4, returnYears: 3, height: 50,
    note: T('Jeunes feuilles (« methi ») cueillies 4 à 6 semaines après le semis, graines mûres à la fin de l’été. Légumineuse : enrichit le sol en azote, aussi semée en engrais vert. Craint les sols froids et détrempés.', 'Young leaves (“methi”) picked 4–6 weeks after sowing, ripe seeds by late summer. A legume: adds nitrogen to the soil, also sown as green manure. Dislikes cold, waterlogged soil.'),
    seed: [3, 'self', 5, 10, 'yes', 'Autogame : laisser jaunir les gousses sur pied, battre et trier les graines sèches.', 'Self-pollinated: let pods yellow on the plant, then thresh and clean the dry seeds.'],
  },
  {
    id: 'caraway', name: T('Carvi', 'Caraway'), latin: 'Carum carvi', emoji: '🌿', family: 'apiaceae', life: 'biennial', sun: 'full', frost: 'hardy',
    spacing: [30, 20], sowOutdoor: [[4, 5], [8, 8]], harvest: [60, 450], season: 460, yieldM2: [0.05, 0.1], feeding: 'light', root: 0.6, returnYears: 3, height: 60,
    note: T('Bisannuelle : feuilles et racine la première année, ombelles et graines-épice en juillet de la deuxième. Semer en place (racine pivotante). Couper les ombelles dès que les graines brunissent, avant qu’elles tombent.', 'Biennial: leaves and root in the first year, umbels and spice seeds in July of the second. Sow in place (taproot). Cut umbels as soon as seeds turn brown, before they drop.'),
    seed: [2, 'insect', 300, 20, 'yes', 'Sécher les ombelles tête en bas dans un sac en papier ; garder une partie pour ressemer.', 'Dry umbels upside down in a paper bag; keep some to resow.'],
  },
  {
    id: 'cumin', name: T('Cumin', 'Cumin'), latin: 'Cuminum cyminum', emoji: '🌿', family: 'apiaceae', life: 'annual', sun: 'full', frost: 'tender', tBase: 12,
    spacing: [25, 10], sowIndoor: [[4, 4]], plantOut: [[5, 6]], transplantAfter: 30, harvest: [100, 130], season: 140, yieldM2: [0.02, 0.06], feeding: 'light', root: 0.3, returnYears: 3, height: 30,
    note: T('Petite ombellifère des climats chauds : au nord de la Loire, réussite surtout en serre ou en été chaud. Semer en godets profonds et planter sans casser la motte. Récolter les graines dès qu’elles brunissent.', 'Small umbellifer from hot climates: north of the Loire it mostly succeeds under glass or in a hot summer. Sow in deep pots and plant out without breaking the root ball. Harvest seeds as soon as they turn brown.'),
    seed: [2, 'insect', 300, 20, 'yes', 'Les graines du rayon épices germent souvent : faire un essai sur coton humide.', 'Spice-rack seeds often germinate: test a few on damp cotton.'],
  },

  // --- Aromatiques de pot gélives -----------------------------------------------------
  {
    id: 'vietnamesecoriander', name: T('Coriandre vietnamienne', 'Vietnamese coriander'), latin: 'Persicaria odorata', emoji: '🌿', family: 'polygonaceae', life: 'perennial', sun: 'partial', frost: 'tender',
    spacing: [40, 30], plantOut: [[5, 6]], harvest: [40, 150], season: 170, yieldM2: [0.5, 1], feeding: 'medium', root: 0.25, height: 40,
    note: T('Goût de coriandre qui, elle, ne monte pas en graines l’été. Aime l’eau : sol toujours humide, voire soucoupe pleine. Gélive : rentrer le pot près d’une fenêtre en octobre.', 'Tastes like coriander but does not bolt in summer. Loves water: keep soil always moist, even a full saucer. Frost-tender: bring the pot to a bright window in October.'),
    seed: [0, 'vegetative', 0, 40, 'no', 'Ne fleurit presque jamais sous nos climats : une tige mise dans un verre d’eau s’enracine en une semaine.', 'Rarely flowers in our climate: a stem put in a glass of water roots within a week.'],
  },
  {
    id: 'ginger', name: T('Gingembre', 'Ginger'), latin: 'Zingiber officinale', emoji: '🫚', family: 'zingiberaceae', life: 'perennial', sun: 'partial', frost: 'tender', tBase: 15,
    spacing: [30, 25], plantOut: [[5, 5]], harvest: [150, 240], season: 250, yieldM2: [0.5, 1.5], feeding: 'heavy', root: 0.2, height: 80,
    note: T('Choisir au magasin un rhizome ferme avec des « yeux », le faire germer en mars au chaud (22-25 °C) dans un terreau humide, puis l’installer en grand pot large dehors à mi-ombre dès les nuits douces. Récolter le gingembre jeune à l’automne, avant le froid. Arrosage régulier sans excès.', 'Pick a firm shop rhizome with “eyes”, sprout it in March somewhere warm (22–25 °C) in moist compost, then move it to a wide pot outdoors in part shade once nights are mild. Harvest young ginger in autumn, before the cold. Regular watering without waterlogging.'),
    seed: [0, 'vegetative', 0, 15, 'no', 'Garder un morceau de rhizome hors gel au sec l’hiver et le remettre en culture en mars.', 'Keep a piece of rhizome dry and frost-free over winter and restart it in March.'],
  },

  // --- Bulbe à épice --------------------------------------------------------------------
  {
    id: 'saffron', name: T('Crocus à safran', 'Saffron crocus'), latin: 'Crocus sativus', emoji: '🪻', family: 'iridaceae', life: 'perennial', sun: 'full', frost: 'hardy', pH: [6, 8],
    spacing: [15, 10], plantOut: [[8, 8]], harvest: [55, 90], season: 300, yieldM2: [0.001, 0.003], feeding: 'light', root: 0.2, returnYears: 4, height: 15,
    note: T('Planter les bulbes (cormes) en août à 10-15 cm de profondeur, en sol très drainé. Fleurs violettes en octobre : cueillir chaque matin les fleurs juste ouvertes et en retirer les trois stigmates rouges, à sécher aussitôt. Le feuillage reste tout l’hiver ; arracher et diviser les touffes tous les 3-4 ans.', 'Plant the corms in August 10–15 cm deep, in very free-draining soil. Purple flowers in October: pick freshly opened flowers each morning and pull out the three red stigmas, dried straight away. Foliage stays all winter; lift and divide clumps every 3–4 years.'),
    seed: [0, 'vegetative', 0, 30000, 'no', 'Plante triploïde stérile : se multiplie uniquement par les petits cormes formés chaque année.', 'Sterile triploid: propagates only through the small cormlets formed each year.'],
  },
];

const BUILT = DEFS.map(herb);
export const MORE_HERBS: Species[] = BUILT.map((b) => b.species);
export const MORE_HERB_EXTRA: Record<string, SpeciesExtra> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.extra]));
export const MORE_HERB_HEIGHT: Record<string, number> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.height]));
